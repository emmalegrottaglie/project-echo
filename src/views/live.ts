import {
  available,
  diagnosticNoCorsUrl,
  diagnosticUrl,
  fetchDirectory,
  isContributing,
  postObservation,
  RELAY_URL,
  setContributing,
  type DirectoryReceiver,
} from '../api';
import { createAnalyser, hasEnergy, waitForSignal } from '../audio/analyser';
import { KiwiSource } from '../audio/kiwi';
import { RelaySource } from '../audio/relay';
import { createContext, type AudioSource } from '../audio/source';
import { SyntheticSource } from '../audio/synthetic';
import { byTier } from '../data/stations';
import { describe, MarkerDetector, type DetectorState } from '../detector';
import { mountPropagation, ATTRIBUTION_URL } from '../propagation';
import {
  candidateReceivers,
  isValidGrid,
  listReceivers,
  normaliseHost,
  PUBLIC_LIST_URL,
  removeReceiver,
  saveReceiver,
  selectedReceiver,
  selectReceiver,
} from '../receiver';
import { formatUtc, isOffHours } from '../schedule';
import type { Frequency, Receiver, Station } from '../types';
import {
  button,
  detectorStrip,
  esc,
  gapNotice,
  openSheet,
  pickerRow,
  searchField,
  skeleton,
  statusLine,
  toggleSwitch,
  transportBar,
  waterfallPanel,
  type Sheet,
  type Tone,
} from '../ui';
import { Waterfall } from '../waterfall';

/**
 * Live view.
 *
 * Phone order: receiver row, station row, status line, full-bleed waterfall, detector
 * strip, then collapsed propagation and diagnostics, with the transport bar fixed
 * above the tab bar. The transport is fixed because the first tap on Connect is what
 * creates the AudioContext — Web Audio needs a real user gesture — so that control
 * must be reachable without scrolling.
 *
 * Only the live tier is offered. The scheduled tier transmits for minutes a few times
 * a week, so a live view pointed at it would show an empty band and imply the station
 * was dead; that is what the schedule tab is for.
 */

type Phase = 'idle' | 'connecting' | 'running' | 'stalled';

interface Tuning {
  station: Station;
  frequency: Frequency;
}

/** How many directory rows a phone gets. The server returns 776 for 4625 kHz. */
const DIRECTORY_LIMIT = 50;

/**
 * When to hand a volunteer's receiver back.
 *
 * A KiwiSDR has four hardware channels and this app holds one for as long as its socket
 * is open — there is a keepalive, so the node will not time the connection out by
 * itself. Someone who connects and then walks away costs the operator exactly what a bot
 * would, however little they meant to, and an operator asked about precisely this on
 * Priyom's IRC channel before anyone else had even installed it.
 *
 * Two timers, because there are two ways to leave: the tab going to the background, and
 * the tab staying in front while nobody is there. The backgrounded case is the shorter
 * of the two — audio the user cannot hear has no claim on someone else's hardware.
 */
const IDLE_RELEASE_MS = 10 * 60_000;
const HIDDEN_RELEASE_MS = 60_000;
const IDLE_CHECK_MS = 15_000;

export function liveView(): { element: HTMLElement; destroy: () => void } {
  const element = document.createElement('section');
  element.className = 'view view-live';

  const stations = byTier('live');
  const tunings: Tuning[] = stations.flatMap((station) =>
    station.frequencies.map((frequency) => ({ station, frequency })),
  );

  let tuningIndex = 0;
  let phase: Phase = 'idle';
  let serverPresent = false;

  let context: AudioContext | null = null;
  let source: AudioSource | null = null;
  let waterfall: Waterfall | null = null;
  let unmountPropagation: (() => void) | null = null;
  let detectorTimer: number | null = null;
  let sheet: Sheet | null = null;
  let lastPosted = 0;
  /** Bumped on teardown, so a chain still negotiating knows it was abandoned. */
  let attempt = 0;
  let lastFailure: string | null = null;
  let lastInteraction = Date.now();
  let idleTimer: number | null = null;
  let hiddenTimer: number | null = null;

  const detector = new MarkerDetector();

  element.innerHTML = `
    <div class="echo-scroll">
      <div class="echo-receiver-slot"></div>
      <div class="echo-station-slot"></div>
      <div class="echo-status-slot"></div>
      ${waterfallPanel()}
      <div class="echo-detector-slot"></div>
      <details class="echo-details echo-propagation-details">
        <summary>Propagation</summary>
        <p>
          Maximum usable frequency, from
          <a href="${ATTRIBUTION_URL}" target="_blank" rel="noreferrer">prop.kc2g.com</a>
          (IRI-2016 conditioned on live ionosonde data, regenerated every five minutes).
          If the station's frequency sits above the MUF on your path, the band is shut
          and the silence is the ionosphere, not the transmitter.
        </p>
        <div class="propagation"></div>
      </details>
      <details class="echo-details echo-diagnostics" hidden>
        <summary>Diagnostics</summary>
        <p>
          A fixed 30-second recording shaped like The Buzzer, fetched from the server's
          other loopback name so both are genuinely cross-origin. The first carries CORS
          headers and should give a waterfall and a detected 2.4 s period; the second is
          served without them, so playback works while the analyser reads silence. If
          the second one paints, the silence check has regressed.
        </p>
        <div class="echo-sheet__actions">
          ${button({ label: 'CORS correct', name: 'diagnostic' })}
          ${button({ label: 'CORS missing', name: 'diagnostic-nocors' })}
          ${button({ label: 'Relay', name: 'relay' })}
        </div>
      </details>
      <p class="echo-footnote">
        The connection is released after ten minutes without interaction, and a minute
        after this tab goes to the background. A public receiver has four channels and
        they are lent to you, not given.
      </p>
      <div class="echo-contribute" hidden>
        <div class="echo-contribute__text">
          <strong>Send detections to the server</strong>
          <span>
            Off unless you turn it on. When it is on, a locked detection is sent at most
            once a minute: the station, the frequency, the measured period, how steady it
            was, and the name of the receiver you heard it through. Never any audio and
            never any message content — this app does not decode, by design. It goes only
            to the server hosting this page.
          </span>
        </div>
        <div class="echo-contribute__switch"></div>
      </div>
    </div>
    ${transportBar(false)}
  `;

  const receiverSlot = element.querySelector<HTMLElement>('.echo-receiver-slot')!;
  const stationSlot = element.querySelector<HTMLElement>('.echo-station-slot')!;
  const statusSlot = element.querySelector<HTMLElement>('.echo-status-slot')!;
  const detectorSlot = element.querySelector<HTMLElement>('.echo-detector-slot')!;
  const diagnostics = element.querySelector<HTMLDetailsElement>('.echo-diagnostics')!;
  const propagation = element.querySelector<HTMLElement>('.propagation')!;
  const viewport = element.querySelector<HTMLElement>('.waterfall-viewport')!;
  const waterfallPanelElement = element.querySelector<HTMLElement>('.echo-waterfall')!;
  const transport = element.querySelector<HTMLElement>('.echo-transport')!;
  const connectButton = transport.querySelector<HTMLButtonElement>('[name="connect"]')!;
  const syntheticButton = transport.querySelector<HTMLButtonElement>('[name="synthetic"]')!;
  const contribute = element.querySelector<HTMLElement>('.echo-contribute')!;
  const contributeSwitch = contribute.querySelector<HTMLElement>('.echo-contribute__switch')!;

  const tuning = (): Tuning | null => tunings[tuningIndex] ?? null;

  /* -------------------------------------------------------------- rendering ---- */

  const renderStatus = (message: string, tone: Tone = 'neutral', retry = false): void => {
    statusSlot.innerHTML = statusLine(
      message,
      tone,
      retry ? button({ label: 'Try another', variant: 'ghost', name: 'retry' }) : '',
    );
  };

  const renderReceiver = (): void => {
    const receiver = selectedReceiver();

    receiverSlot.innerHTML = receiver
      ? pickerRow({
          label: 'Receiver',
          value: receiver.label,
          meta: receiver.grid ? `· ${receiver.grid}` : null,
          name: 'open-receiver',
        })
      : `<div class="echo-detail__body">${gapNotice(
          'No receiver saved',
          'This app has no antenna of its own: it listens through a public KiwiSDR that ' +
            'someone volunteers. Saving one only stores its address in this browser, and ' +
            'the audio connection goes straight to that node.',
        )}<div class="echo-sheet__actions">${button({
          label: 'Find one for me',
          variant: 'primary',
          name: 'find-receiver',
          hidden: !serverPresent,
        })}${button({
          label: 'Choose a receiver',
          variant: serverPresent ? 'secondary' : 'primary',
          name: 'open-receiver',
        })}</div></div>`;

    connectButton.disabled = !receiver || phase === 'connecting';

    // Torn down unconditionally: leaving the previous receiver's map up when the new one
    // has no grid square shows a MUF for somewhere the user is not listening from.
    unmountPropagation?.();
    unmountPropagation = null;
    if (receiver?.grid) {
      unmountPropagation = mountPropagation(propagation, receiver.grid);
    }
  };

  const renderStation = (): void => {
    const current = tuning();
    if (!current) return;

    // A day/night frequency is only half the information without the time. The first
    // on-phone session picked 3756 kHz — The Pip's night frequency — at 11:45 and heard
    // nothing, on a screen that said "night" and never said what time it was.
    const offHours = isOffHours(current.frequency.timeOfDay);

    stationSlot.innerHTML = pickerRow({
      label: 'Station',
      value: `${current.station.enigmaId} ${current.station.name}`,
      meta:
        `· ${current.frequency.khz} kHz ${current.frequency.mode}` +
        (current.frequency.timeOfDay ? ` · ${current.frequency.timeOfDay}` : '') +
        (offHours ? ` · now ${formatUtc(new Date())}` : ''),
      flagWord: offHours ? 'off-hours' : current.frequency.disputed ? 'disputed' : null,
      live: current.station.tier === 'live',
      periodSec: current.station.markerPeriodSec,
      name: 'open-station',
    });
  };

  const renderContribute = (): void => {
    contributeSwitch.innerHTML = toggleSwitch(
      isContributing(),
      'data-contribute',
      'on',
      'Send detections to the server',
    );
  };

  const renderDetector = (state: DetectorState, text: string): void => {
    // Re-rendering only on a state change keeps the confirmation animation from
    // restarting every second while the marker stays locked.
    if (detectorSlot.dataset.state === state) {
      const line = detectorSlot.querySelector<HTMLElement>('.echo-detector__line');
      if (line) line.textContent = text;
      return;
    }
    detectorSlot.dataset.state = state;
    detectorSlot.innerHTML = detectorStrip(state, text);
  };

  const setPhase = (next: Phase): void => {
    phase = next;
    connectButton.textContent = next === 'connecting' ? 'Connecting…' : next === 'idle' ? 'Connect' : 'Stop';
    connectButton.disabled = next === 'connecting' || (next === 'idle' && !selectedReceiver());
  };

  /* ------------------------------------------------------------------ audio ---- */

  const teardownAudio = (): void => {
    if (detectorTimer !== null) window.clearInterval(detectorTimer);
    detectorTimer = null;
    if (idleTimer !== null) window.clearInterval(idleTimer);
    idleTimer = null;
    clearHiddenTimer();
    detector.reset();
    renderDetector('idle', 'listening…');
    waterfall?.destroy();
    waterfall = null;
    source?.stop();
    source = null;
    void context?.close();
    context = null;
    viewport.replaceChildren();
    syntheticButton.disabled = false;
    setPhase('idle');
  };

  /** Resolves true when the transport connected. False means try something else. */
  /**
   * Hands the receiver back and says why.
   *
   * Not an error and not styled as one: the app did the right thing. The transport
   * returns to Connect, so getting it back is one tap.
   */
  const release = (reason: string): void => {
    if (phase === 'idle') return;
    attempt += 1;
    teardownAudio();
    renderStatus(reason);
  };

  const clearHiddenTimer = (): void => {
    if (hiddenTimer !== null) window.clearTimeout(hiddenTimer);
    hiddenTimer = null;
  };

  /**
   * A backgrounded tab is still holding a channel. iOS suspends the audio anyway, so on
   * a phone this releases something already inaudible; on a desktop it stops a tab
   * nobody is looking at from streaming for hours.
   */
  const onVisibility = (): void => {
    if (document.visibilityState === 'visible') {
      clearHiddenTimer();
      lastInteraction = Date.now();
      return;
    }
    if (phase === 'idle' || hiddenTimer !== null) return;

    hiddenTimer = window.setTimeout(() => {
      hiddenTimer = null;
      release('Disconnected while the tab was in the background, to free the receiver.');
    }, HIDDEN_RELEASE_MS);
  };

  document.addEventListener('visibilitychange', onVisibility);

  // Any touch of this view counts as someone being present. Captured, so it still
  // registers on controls that stop the event.
  element.addEventListener('pointerdown', () => (lastInteraction = Date.now()), true);
  element.addEventListener('keydown', () => (lastInteraction = Date.now()), true);

  const run = async (next: AudioSource, current: Tuning | null): Promise<boolean> => {
    teardownAudio();
    setPhase('connecting');
    syntheticButton.disabled = true;
    renderStatus(`Connecting to ${next.label}…`);

    context = createContext();
    const { analyser, visibleBins } = createAnalyser(context);
    analyser.connect(context.destination);

    try {
      await next.start(context, analyser);
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
      teardownAudio();
      return false;
    }

    source = next;
    setPhase('running');
    renderStatus(`Listening — ${next.label}`, 'live');

    lastInteraction = Date.now();
    idleTimer = window.setInterval(() => {
      if (Date.now() - lastInteraction < IDLE_RELEASE_MS) return;
      release(
        `Disconnected after ${Math.round(IDLE_RELEASE_MS / 60_000)} minutes without ` +
          'interaction, to free the receiver. Connect to resume.',
      );
    }, IDLE_CHECK_MS);

    waterfall = new Waterfall(viewport, analyser, visibleBins, (atMs, bins) =>
      detector.feed(atMs, bins),
    );
    waterfall.start();
    waterfallPanelElement.classList.add('is-live');

    const expected = current?.station.markerPeriodSec ?? null;
    lastPosted = 0;

    detectorTimer = window.setInterval(() => {
      // Audio that arrives late must clear the warning. The first screenshots from a
      // phone showed the marker drawing in the waterfall under a red "no audio"
      // message that had latched during the connect, which is worse than saying
      // nothing: the app was contradicting itself.
      if (phase === 'stalled' && hasEnergy(analyser)) {
        setPhase('running');
        renderStatus(`Listening — ${next.label}`, 'live');
      }

      const detection = detector.read(performance.now());
      renderDetector(detection.state, describe(detection, expected));

      // A detection repeats every second while the marker is up, so this records at
      // most one hearing a minute; the server folds repeats from the same receiver into
      // one row, keeping the table a log of transmissions rather than of polling.
      if (
        detection.state === 'detected' &&
        current &&
        !(next instanceof SyntheticSource) &&
        Date.now() - lastPosted > 60_000
      ) {
        lastPosted = Date.now();
        void postObservation({
          stationId: current.station.enigmaId,
          khz: current.frequency.khz,
          receiver: next.label,
          periodSec: detection.periodSec ?? undefined,
          consistency: detection.consistency,
        });
      }
    }, 1000);

    // Both a CORS-silenced graph and a receiver that accepted the connection without
    // sending look exactly like a dead antenna, and neither throws. See
    // src/audio/analyser.ts.
    if (!(await waitForSignal(analyser))) {
      setPhase('stalled');
      renderStatus(`No audio yet. ${next.silenceHint}`, 'danger', true);
    }
    return true;
  };

  /**
   * Connects, falling through the saved receivers until one answers.
   *
   * Only a refused connection advances the chain. A receiver that connects and then
   * sends nothing is left alone: that costs eight seconds to detect and the band being
   * quiet is a real answer, so moving on automatically would spend other people's
   * channels to re-ask a question already answered. That case keeps its "Try another".
   */
  const connect = async (): Promise<void> => {
    const current = tuning();
    const candidates = candidateReceivers();
    if (!candidates.length || !current) {
      openReceiverSheet();
      return;
    }

    for (const [index, receiver] of candidates.entries()) {
      // One token per candidate, not per chain: a receiver that closes late must not be
      // able to write over the status line of the one being tried after it. That is how
      // a chain that had already given up still ended with "connection closed (1006)"
      // on screen and no "Try another" offered.
      const token = ++attempt;

      if (index > 0) {
        renderStatus(
          `${lastFailure ?? 'No answer'}. Trying ${receiver.label} ` +
            `(${index + 1} of ${candidates.length})…`,
        );
      }

      const connected = await run(kiwiFor(receiver, current, token), current);

      // The user pressed Stop, or started another attempt, while this was negotiating.
      if (token !== attempt) return;

      if (connected) {
        selectReceiver(receiver.id);
        renderReceiver();
        if (isOffHours(current.frequency.timeOfDay)) {
          renderStatus(
            `Listening — ${receiver.label}. ${current.frequency.khz} kHz is the ` +
              `${current.frequency.timeOfDay} frequency and it is ${formatUtc(new Date())}.`,
            'live',
          );
        }
        return;
      }
    }

    // Past every candidate, so the last one's dying socket cannot overwrite the verdict
    // with its own close message — which is how this ended up showing "connection closed
    // (1006)" and no way to retry.
    attempt += 1;

    renderStatus(
      candidates.length === 1
        ? `${lastFailure ?? 'No answer'}.`
        : `${lastFailure ?? 'No answer'}. None of the ${candidates.length} saved receivers answered.`,
      'danger',
      true,
    );
  };

  const kiwiFor = (receiver: Receiver, current: Tuning, token: number): KiwiSource =>
    new KiwiSource({
      host: receiver.host,
      khz: current.frequency.khz,
      mode: current.frequency.mode.toLowerCase() === 'lsb' ? 'lsb' : 'usb',
      // A socket goes on reporting as it dies, well after the chain has moved past it.
      onStatus: (message) => {
        if (token === attempt) renderStatus(message);
      },
    });

  /**
   * Picks the best-reported public receiver for the tuned frequency and connects.
   *
   * The directory already filters to nodes with a free channel that publish coverage of
   * this frequency, and sorts by reported SNR, so the top row is the same one a user
   * would pick after scrolling. Someone who has never seen a KiwiSDR has no basis for
   * that choice, and making them make it before hearing anything is where first runs
   * were being lost.
   *
   * It saves the receiver rather than connecting anonymously: the receiver row must name
   * the node actually being used. A connection to a volunteer's hardware that the
   * interface does not admit to is the failure docs/RESEARCH.md §4 exists to prevent.
   */
  const findReceiver = async (): Promise<void> => {
    const current = tuning();
    closeSheet();
    renderStatus(`Looking for a receiver that covers ${current?.frequency.khz ?? '—'} kHz…`);

    const result = await fetchDirectory(current?.frequency.khz);
    const best = result ? bySnr(result.receivers)[0] : undefined;

    if (!best) {
      renderStatus(
        result
          ? 'No public receiver currently lists coverage of that frequency with a free channel.'
          : 'The public directory is proxied by the server, which is not answering.',
        'danger',
        true,
      );
      return;
    }

    saveReceiver(toReceiver(best));
    renderReceiver();
    void connect();
  };

  /* ----------------------------------------------------------------- sheets ---- */

  const closeSheet = (): void => {
    sheet?.close();
    sheet = null;
  };

  function openReceiverSheet(): void {
    closeSheet();
    const current = openSheet(
      'Receiver',
      'Saved in this browser. Your audio connection goes straight to that node, under ' +
        "that node's own rules.",
      () => {
        sheet = null;
      },
    );
    sheet = current;

    const receivers = listReceivers();
    const selected = selectedReceiver();

    current.body.innerHTML =
      (receivers.length
        ? receivers
            .map(
              (receiver) =>
                `<button class="echo-sheet-row" type="button" data-host="${esc(receiver.host)}"` +
                ` aria-selected="${receiver.host === selected?.host}">` +
                `${esc(receiver.label)}<span>${esc(receiver.grid || receiver.host)}</span></button>`,
            )
            .join('')
        : gapNotice(
            'No receivers saved',
            'Add one from the public directory, or paste a host from kiwisdr.com/public.',
          )) +
      `<div class="echo-sheet__actions">` +
      button({ label: 'Find one for me', variant: 'primary', name: 'find-receiver', hidden: !serverPresent }) +
      button({ label: 'Browse directory', name: 'browse', hidden: !serverPresent }) +
      button({ label: 'Paste a host', name: 'manual' }) +
      (selected ? button({ label: 'Forget', variant: 'ghost', name: 'forget' }) : '') +
      `</div>` +
      `<form class="echo-form" hidden>
         <p class="echo-gap__body">
           Pick a node from
           <a href="${PUBLIC_LIST_URL}" target="_blank" rel="noreferrer">kiwisdr.com/public</a>
           and paste its host. This app ships no hostnames: the public directory changes
           constantly and a compiled-in copy would rot into dead hosts.
         </p>
         <label>Host<input name="host" placeholder="example.proxy.kiwisdr.com:8073" /></label>
         <label>Name<input name="label" placeholder="Moscow region" /></label>
         <label>Grid square<input name="grid" placeholder="KO85" /></label>
         <div class="echo-sheet__actions">
           ${button({ label: 'Save', variant: 'primary', type: 'submit' })}
         </div>
       </form>`;

    const form = current.body.querySelector<HTMLFormElement>('.echo-form')!;

    current.body.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      const row = target.closest<HTMLButtonElement>('[data-host]');
      if (row?.dataset.host) {
        selectReceiver(row.dataset.host);
        renderReceiver();
        closeSheet();
        return;
      }

      if (target.closest('[name="manual"]')) form.hidden = !form.hidden;
      if (target.closest('[name="find-receiver"]')) void findReceiver();
      if (target.closest('[name="browse"]')) openDirectorySheet();
      if (target.closest('[name="forget"]')) {
        const host = selectedReceiver()?.host;
        if (host) removeReceiver(host);
        renderReceiver();
        closeSheet();
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const host = normaliseHost((form.elements.namedItem('host') as HTMLInputElement).value);
      const label = (form.elements.namedItem('label') as HTMLInputElement).value.trim();
      const grid = (form.elements.namedItem('grid') as HTMLInputElement).value.trim();

      if (!host) {
        renderStatus('a receiver host is required', 'danger');
        return;
      }
      if (grid && !isValidGrid(grid)) {
        renderStatus(`"${grid}" is not a Maidenhead grid square (e.g. KO85)`, 'danger');
        return;
      }

      saveReceiver({
        id: host,
        label: label || host,
        host,
        grid: grid.toUpperCase(),
        location: '',
        kind: 'kiwisdr',
        notes: null,
      });
      renderReceiver();
      closeSheet();
      renderStatus(`saved ${host}`);
    });
  }

  function openStationSheet(): void {
    closeSheet();
    const current = openSheet(
      'Station',
      'Only the three continuously-transmitting Russian markers are offered here. ' +
        `Scheduled stations live on the Schedule tab. It is ${formatUtc(new Date())}; a ` +
        'frequency marked off-hours is the other half of a day/night pair, and is ' +
        'offered anyway.',
      () => {
        sheet = null;
      },
    );
    sheet = current;

    current.body.innerHTML = tunings
      .map(
        (candidate, index) =>
          `<button class="echo-sheet-row" type="button" data-index="${index}"` +
          ` aria-selected="${index === tuningIndex}">` +
          `${esc(candidate.station.enigmaId)} ${esc(candidate.station.name)}` +
          `<span>${candidate.frequency.khz} kHz ${esc(candidate.frequency.mode)}` +
          `${candidate.frequency.timeOfDay ? ` ${candidate.frequency.timeOfDay}` : ''}` +
          `${isOffHours(candidate.frequency.timeOfDay) ? ' · off-hours now' : ''}` +
          `${candidate.frequency.disputed ? ' disputed' : ''}</span></button>`,
      )
      .join('');

    current.body.addEventListener('click', (event) => {
      const row = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-index]');
      if (!row) return;
      tuningIndex = Number(row.dataset.index);
      renderStation();
      closeSheet();
    });
  }

  function openDirectorySheet(): void {
    closeSheet();
    const current = openSheet('Public receivers', '', () => {
      sheet = null;
    });
    sheet = current;

    current.body.innerHTML = skeleton();

    const currentTuning = tuning();

    // The land outline is 54 kB of path data and only this sheet draws it, so it is
    // split out of the initial bundle the same way hls.js is. Fetched alongside the
    // directory, which takes longer anyway.
    void Promise.all([
      fetchDirectory(currentTuning?.frequency.khz),
      import('../worldmap'),
    ]).then(([result, { worldMap }]) => {
      if (sheet !== current) return;

      if (!result) {
        current.body.innerHTML = gapNotice(
          'Directory unavailable',
          'The public list is proxied by the server, which is not answering. Saved ' +
            'receivers still work, and a host can be pasted by hand.',
        );
        return;
      }

      // Only the top 50 render — the upstream list has 776 entries for 4625 kHz and a
      // phone will not thank us for all of them.
      const sorted = bySnr(result.receivers);

      const note = current.element.querySelector<HTMLElement>('.echo-sheet__header p');
      const header = current.element.querySelector<HTMLElement>('.echo-sheet__header');
      const text =
        `Showing ${Math.min(DIRECTORY_LIMIT, sorted.length)} of ${sorted.length} receivers ` +
        `covering ${currentTuning?.frequency.khz ?? '—'} kHz with a free channel. ` +
        `Source: rx.linkfanel.net, sorted by reported SNR.` +
        (result.stale
          ? ` The directory is not answering, so this is the last copy fetched — ` +
            `channel counts and SNR may have moved since.`
          : '');

      if (note) note.textContent = text;
      else if (header) header.insertAdjacentHTML('beforeend', `<p>${esc(text)}</p>`);

      const render = (query: string): void => {
        const filtered = query
          ? sorted.filter((receiver) =>
              `${receiver.location} ${receiver.name} ${receiver.grid}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
          : sorted;

        rows.innerHTML = filtered
          .slice(0, DIRECTORY_LIMIT)
          .map((receiver) => directoryRow(receiver))
          .join('');
      };

      // The map draws every receiver the directory returned; the list below renders the
      // top fifty. That asymmetry is the point — 776 rows are unusable and 776 dots are
      // not — and both carry `data-host`, so the one click handler below serves either.
      current.body.innerHTML =
        worldMap(sorted, {
          selectedHost: selectedReceiver()?.host ?? null,
          sites: currentTuning?.station.sites ?? [],
        }) +
        `${searchField('directory-search', 'Search location')}<div class="echo-directory-rows"></div>`;
      const rows = current.body.querySelector<HTMLElement>('.echo-directory-rows')!;
      const search = current.body.querySelector<HTMLInputElement>('[name="directory-search"]')!;

      render('');
      search.addEventListener('input', () => render(search.value));

      current.body.addEventListener('click', (event) => {
        const row = (event.target as HTMLElement).closest<SVGElement | HTMLButtonElement>(
          '[data-host]',
        );
        if (!row) return;
        const chosen = sorted.find((receiver) => receiver.host === row.dataset.host);
        if (!chosen) return;

        saveReceiver(toReceiver(chosen));
        renderReceiver();
        closeSheet();
        renderStatus(`saved ${chosen.host}`);
      });
    });
  }

  /** A directory row as a saveable receiver. Shared by the list and by "Find one". */
  function toReceiver(entry: DirectoryReceiver): Receiver {
    return {
      id: entry.host,
      label: entry.location || entry.name.slice(0, 40) || entry.host,
      host: entry.host,
      grid: entry.grid,
      location: entry.location,
      kind: 'kiwisdr',
      notes: null,
    };
  }

  /** Best reported SNR first: the node most likely to actually hear the marker. */
  function bySnr(receivers: readonly DirectoryReceiver[]): DirectoryReceiver[] {
    return [...receivers].sort((a, b) => (b.snr ?? 0) - (a.snr ?? 0));
  }

  function directoryRow(receiver: DirectoryReceiver): string {
    const full =
      receiver.users !== null && receiver.usersMax !== null && receiver.users >= receiver.usersMax;
    const channels =
      receiver.users !== null && receiver.usersMax !== null
        ? `${receiver.users}/${receiver.usersMax}`
        : '—';

    return (
      `<button class="echo-directory-row" type="button" data-host="${esc(receiver.host)}">` +
      `<span class="echo-directory-row__place">` +
      `<strong>${esc(receiver.location || receiver.name)}</strong>` +
      (receiver.grid ? `<span>${esc(receiver.grid)}</span>` : '') +
      `</span>` +
      `<span class="echo-directory-row__users${full ? ' echo-directory-row__users--full' : ''}">${channels}</span>` +
      `<span class="echo-directory-row__snr">${receiver.snr !== null ? `SNR ${receiver.snr}` : '—'}</span>` +
      `</button>`
    );
  }

  /* --------------------------------------------------------------- listeners --- */

  element.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    const contributeToggle = target.closest<HTMLElement>('[data-contribute]');
    if (contributeToggle) {
      setContributing(contributeToggle.getAttribute('aria-checked') !== 'true');
      renderContribute();
      return;
    }
    if (target.closest('[name="find-receiver"]')) {
      void findReceiver();
      return;
    }
    if (target.closest('[name="open-receiver"]') || target.closest('[name="retry"]')) {
      openReceiverSheet();
      return;
    }
    if (target.closest('[name="open-station"]')) {
      openStationSheet();
      return;
    }
    if (target.closest('[name="connect"]')) {
      if (phase === 'idle') void connect();
      else {
        attempt += 1;
        teardownAudio();
        renderStatus('Not listening.');
      }
      return;
    }
    if (target.closest('[name="synthetic"]')) {
      const current = tuning();
      void run(new SyntheticSource(800, current?.station.markerPeriodSec ?? 2.4), current);
      return;
    }
    if (target.closest('[name="relay"]')) {
      void run(new RelaySource(RELAY_URL, 'relay stream'), tuning());
      return;
    }
    if (target.closest('[name="diagnostic"]')) {
      void run(new RelaySource(diagnosticUrl(), 'diagnostic recording (CORS correct)'), null);
      return;
    }
    if (target.closest('[name="diagnostic-nocors"]')) {
      void run(
        new RelaySource(diagnosticNoCorsUrl(), 'diagnostic recording (CORS missing)'),
        null,
      );
    }
  });

  renderContribute();
  renderReceiver();
  renderStation();
  renderStatus('Not listening.');
  renderDetector('idle', 'listening…');

  // The relay and the diagnostics need the server. Without it the app is the static
  // client, so those controls stay hidden rather than failing when pressed.
  void available().then((present) => {
    serverPresent = present;
    diagnostics.hidden = !present;
    // Nothing is sent anywhere without a server, so offering the choice would be
    // offering a control over something that is not happening.
    contribute.hidden = !present;
    syntheticButton.hidden = false;
    // Re-rendered because the empty-receiver notice offers "Find one for me", which
    // needs the directory and so cannot be drawn before this resolves.
    renderReceiver();
  });

  return {
    element,
    destroy: () => {
      document.removeEventListener('visibilitychange', onVisibility);
      closeSheet();
      teardownAudio();
      unmountPropagation?.();
    },
  };
}
