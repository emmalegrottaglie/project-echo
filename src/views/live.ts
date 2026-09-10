import {
  available,
  diagnosticNoCorsUrl,
  diagnosticUrl,
  fetchDirectory,
  postObservation,
  RELAY_URL,
  type DirectoryReceiver,
} from '../api';
import { createAnalyser, hasSignal } from '../audio/analyser';
import { KiwiSource } from '../audio/kiwi';
import { RelaySource } from '../audio/relay';
import { createContext, type AudioSource } from '../audio/source';
import { SyntheticSource } from '../audio/synthetic';
import { byTier } from '../data/stations';
import { describe, MarkerDetector, type DetectorState } from '../detector';
import { mountPropagation, ATTRIBUTION_URL } from '../propagation';
import {
  isValidGrid,
  listReceivers,
  normaliseHost,
  PUBLIC_LIST_URL,
  removeReceiver,
  saveReceiver,
  selectedReceiver,
  selectReceiver,
} from '../receiver';
import type { Frequency, Station } from '../types';
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
        Live means live while this tab is in front — iOS suspends audio in the
        background. This app records observations about signals, never their contents.
      </p>
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
          'Pick a public KiwiSDR with propagation to the transmitter. Saving one only ' +
            'stores its address in this browser; the connection goes straight to that node.',
        )}<div class="echo-sheet__actions">${button({
          label: 'Choose a receiver',
          variant: 'primary',
          name: 'open-receiver',
        })}</div></div>`;

    connectButton.disabled = !receiver || phase === 'connecting';

    if (receiver?.grid) {
      unmountPropagation?.();
      unmountPropagation = mountPropagation(propagation, receiver.grid);
    }
  };

  const renderStation = (): void => {
    const current = tuning();
    if (!current) return;

    stationSlot.innerHTML = pickerRow({
      label: 'Station',
      value: `${current.station.enigmaId} ${current.station.name}`,
      meta: `· ${current.frequency.khz} kHz ${current.frequency.mode}`,
      live: current.station.tier === 'live',
      periodSec: current.station.markerPeriodSec,
      flagWord: current.frequency.disputed ? 'disputed' : null,
      name: 'open-station',
    });
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

  const run = async (next: AudioSource, current: Tuning | null): Promise<void> => {
    teardownAudio();
    setPhase('connecting');
    syntheticButton.disabled = true;
    renderStatus(`connecting to ${next.label}…`);

    context = createContext();
    const { analyser, visibleBins } = createAnalyser(context);
    analyser.connect(context.destination);

    try {
      await next.start(context, analyser);
    } catch (error) {
      renderStatus(error instanceof Error ? error.message : String(error), 'danger', true);
      teardownAudio();
      return;
    }

    source = next;
    setPhase('running');
    renderStatus(`running — ${next.label}`, 'live');

    waterfall = new Waterfall(viewport, analyser, visibleBins, (atMs, bins) =>
      detector.feed(atMs, bins),
    );
    waterfall.start();
    waterfallPanelElement.classList.add('is-live');

    const expected = current?.station.markerPeriodSec ?? null;
    lastPosted = 0;

    detectorTimer = window.setInterval(() => {
      const detection = detector.read();
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
    if (!(await hasSignal(analyser))) {
      setPhase('stalled');
      renderStatus(
        'connected but no audio reached the analyser. Either the receiver is not ' +
          'sending (all channels busy) or the source is cross-origin without CORS headers.',
        'danger',
        true,
      );
    }
  };

  const connect = (): void => {
    const receiver = selectedReceiver();
    const current = tuning();
    if (!receiver || !current) {
      openReceiverSheet();
      return;
    }

    void run(
      new KiwiSource({
        host: receiver.host,
        khz: current.frequency.khz,
        mode: current.frequency.mode.toLowerCase() === 'lsb' ? 'lsb' : 'usb',
        onStatus: (message) => renderStatus(message),
      }),
      current,
    );
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
      button({ label: 'Browse directory', variant: 'primary', name: 'browse', hidden: !serverPresent }) +
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
        'Scheduled stations live on the Schedule tab.',
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

    void fetchDirectory(currentTuning?.frequency.khz).then((result) => {
      if (sheet !== current) return;

      if (!result) {
        current.body.innerHTML = gapNotice(
          'Directory unavailable',
          'The public list is proxied by the server, which is not answering. Saved ' +
            'receivers still work, and a host can be pasted by hand.',
        );
        return;
      }

      // Best first: a free channel and a high reported SNR is the receiver most likely
      // to actually hear the marker. Only the top 50 render — the upstream list has 776
      // entries for 4625 kHz and a phone will not thank us for all of them.
      const sorted = [...result.receivers].sort((a, b) => (b.snr ?? 0) - (a.snr ?? 0));

      const note = current.element.querySelector<HTMLElement>('.echo-sheet__header p');
      const header = current.element.querySelector<HTMLElement>('.echo-sheet__header');
      const text =
        `Showing ${Math.min(DIRECTORY_LIMIT, sorted.length)} of ${sorted.length} receivers ` +
        `covering ${currentTuning?.frequency.khz ?? '—'} kHz with a free channel. ` +
        `Source: rx.linkfanel.net, sorted by reported SNR.`;

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

      current.body.innerHTML = `${searchField('directory-search', 'Search location')}<div class="echo-directory-rows"></div>`;
      const rows = current.body.querySelector<HTMLElement>('.echo-directory-rows')!;
      const search = current.body.querySelector<HTMLInputElement>('[name="directory-search"]')!;

      render('');
      search.addEventListener('input', () => render(search.value));

      rows.addEventListener('click', (event) => {
        const row = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-host]');
        if (!row) return;
        const chosen = sorted.find((receiver) => receiver.host === row.dataset.host);
        if (!chosen) return;

        saveReceiver({
          id: chosen.host,
          label: chosen.location || chosen.name.slice(0, 40) || chosen.host,
          host: chosen.host,
          grid: chosen.grid,
          location: chosen.location,
          kind: 'kiwisdr',
          notes: null,
        });
        renderReceiver();
        closeSheet();
        renderStatus(`saved ${chosen.host}`);
      });
    });
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

    if (target.closest('[name="open-receiver"]') || target.closest('[name="retry"]')) {
      openReceiverSheet();
      return;
    }
    if (target.closest('[name="open-station"]')) {
      openStationSheet();
      return;
    }
    if (target.closest('[name="connect"]')) {
      if (phase === 'idle') connect();
      else {
        teardownAudio();
        renderStatus('idle');
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

  renderReceiver();
  renderStation();
  renderStatus('idle');
  renderDetector('idle', 'listening…');

  // The relay and the diagnostics need the server. Without it the app is the static
  // client, so those controls stay hidden rather than failing when pressed.
  void available().then((present) => {
    serverPresent = present;
    diagnostics.hidden = !present;
    syntheticButton.hidden = false;
  });

  return {
    element,
    destroy: () => {
      closeSheet();
      teardownAudio();
      unmountPropagation?.();
    },
  };
}
