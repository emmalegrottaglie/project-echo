import { fetchObservations, type Observation } from '../api';
import { archiveLinks } from '../archives';
import { openCorrection } from '../correction';
import { openCredits } from '../credits';
import { openDecoder } from '../decoder';
import { openTimeline } from '../timeline';
import {
  allStations,
  byId,
  describeDesignator,
  designatorPrefix,
  isRosterOnly,
  PREFIX_MEANING,
} from '../data/stations';
import { describeScheduleKhz } from '../schedule';
import type { Station, Tier } from '../types';
import { isSafeUrl } from '../url';
import {
  definitionList,
  esc,
  gapNotice,
  safeUrl,
  searchField,
  segmented,
  stationRow,
  tierHeader,
} from '../ui';

/**
 * Archive tab: all 141 stations, filterable, with provenance shown, and a full-screen
 * detail pushed over the list.
 *
 * Two things this view is careful about. Activity status is presented as a dated claim
 * — "last confirmed 2020-09-01" — never as a bare Active badge, because most published
 * listings for these stations are stale and a badge repeats the error confidently. And
 * a station with no operational data says so rather than rendering empty tables as
 * though nobody had ever found it a frequency. Most of the roster is in that state: it
 * has a history, quoted from Priyom, and nothing confirmed on the air.
 */

const TIER_LABEL: Record<Tier, string> = {
  live: 'Live marker',
  scheduled: 'Scheduled',
  historical: 'Historical',
};

const TIER_ORDER: Tier[] = ['live', 'scheduled', 'historical'];

function statusClaim(station: Station): string {
  return station.lastConfirmed
    ? `${TIER_LABEL[station.tier]}, last confirmed ${station.lastConfirmed}`
    : `${TIER_LABEL[station.tier]}, never confirmed`;
}

function provenanceTable(station: Station): string {
  return (
    `<h4>Frequencies</h4><div class="echo-table-scroll"><table>` +
    `<thead><tr><th>kHz</th><th>Mode</th><th>When</th><th>Last confirmed</th><th>Source</th></tr></thead>` +
    `<tbody>` +
    station.frequencies
      .map(
        (frequency) =>
          `<tr${frequency.disputed ? ' class="disputed"' : ''}>` +
          `<td>${frequency.khz}</td>` +
          `<td>${esc(frequency.mode)}</td>` +
          `<td>${frequency.timeOfDay ?? '—'}</td>` +
          `<td>${frequency.lastConfirmed}</td>` +
          `<td><a href="${safeUrl(frequency.sourceUrl)}" target="_blank" rel="noreferrer">source</a>` +
          (frequency.disputed ? ' <span class="echo-flag echo-flag--accent">disputed</span>' : '') +
          `</td></tr>`,
      )
      .join('') +
    `</tbody></table></div>`
  );
}

/**
 * Hearings recorded by this installation's own detector, newest first — the
 * `observation` rows: what was heard, when, on what frequency, through which receiver,
 * at what measured period. Never what was said.
 */
/**
 * One measured figure from an observation, or an em dash.
 *
 * The type says `number | null` and the runtime did not have to agree. Observations come
 * back from a server that takes writes without authentication, and SQLite stores a string
 * in a REAL column unchanged when it does not look like a number — so a crafted `khz`
 * arrived here as text and went into the page. Checking the type is a stronger guarantee
 * than escaping would be: a figure that is not a number is not a figure, and there is
 * nothing to render. It also keeps `toFixed` off a string, which threw and took the whole
 * table with it.
 */
function measure(value: number | null, format?: (value: number) => string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return esc(format ? format(value) : String(value));
}

export function observationsHtml(observations: Observation[]): string {
  if (!observations.length) {
    return `<h4>Heard here</h4>${gapNotice(
      'No hearings yet',
      "The live view records one when the detector locks onto this station's marker, if " +
        'you have turned that on — timing and frequency only, never any content and ' +
        'never which receiver you listened through.',
    )}`;
  }

  return (
    `<h4>Heard here</h4><div class="echo-table-scroll"><table>` +
    `<thead><tr><th>When</th><th>kHz</th><th>Period</th><th>Steadiness</th></tr></thead><tbody>` +
    observations
      .map(
        (observation) =>
          `<tr><td>${esc(new Date(observation.heardAt).toLocaleString())}</td>` +
          `<td>${measure(observation.khz)}</td>` +
          `<td>${measure(observation.periodSec, (value) => `${value.toFixed(2)} s`)}</td>` +
          `<td>${measure(observation.consistency, (value) => `${Math.round(value * 100)}%`)}</td>` +
          `</tr>`,
      )
      .join('') +
    `</tbody></table></div>`
  );
}

/** A source named by its site rather than by its URL, for an attribution line. */
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Who this station's identity and status came from, named rather than numbered.
 *
 * The archive is built on two volunteer projects, and a row of `[1] [2]` footnote marks
 * credits neither of them in any way a reader notices. Naming the host on all 141
 * station pages is the attribution that actually reaches someone; the credits page is
 * the long version, not the only version.
 */
function sourceCredit(station: Station): string {
  const hosts = [
    ...new Set(
      station.sourceUrls
        .filter(isSafeUrl)
        .map(hostLabel),
    ),
  ];
  if (!hosts.length) return '';

  const links = station.sourceUrls
    .filter(isSafeUrl)
    .map(
      (url, index) =>
        `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer">[${index + 1}]</a>`,
    )
    .join(' ');

  return (
    `<p class="echo-sources">Identity and status from ` +
    `${hosts.map((host) => esc(host)).join(', ')}. ${links} ` +
    `<button class="echo-linkish" type="button" name="credits">Credits and licence</button> ` +
    `<button class="echo-linkish" type="button" name="correct">Report a correction</button></p>`
  );
}

/**
 * Transmitter sites, with the source's own word for how firmly each is placed.
 *
 * Several rows rather than one, for the same reason frequencies are: the sources
 * disagree and the disagreement is a fact about the station. The Buzzer has a confirmed
 * site near St Petersburg, a claimed one at Naro-Fominsk and an abandoned one at
 * Povarovo, and choosing between them would be inventing something none of them says.
 */
function sitesTable(station: Station): string {
  if (!station.sites.length) return '';

  return (
    `<h4>Transmitter sites</h4><div class="echo-table-scroll"><table>` +
    `<thead><tr><th>Place</th><th>Position</th><th>Claim</th><th>Confirmed</th><th>Source</th></tr></thead>` +
    `<tbody>` +
    station.sites
      .map(
        (site) =>
          `<tr${site.status === 'former' ? ' class="disputed"' : ''}>` +
          `<td>${esc(site.name)}</td>` +
          `<td>${site.lat.toFixed(4)}, ${site.lon.toFixed(4)}</td>` +
          `<td>${site.status}</td>` +
          `<td>${esc(site.lastConfirmed)}</td>` +
          `<td><a href="${safeUrl(site.sourceUrl)}" target="_blank" rel="noreferrer">source</a></td>` +
          `</tr>`,
      )
      .join('') +
    `</tbody></table></div>`
  );
}

/**
 * The background paragraph, and whose words it is.
 *
 * Most of these are quoted from Priyom rather than written here, so they are rendered as
 * a quotation with the page attached. Their data is CC BY-NC-SA 4.0 and this is the
 * attribution that licence asks for, but it is also the honest thing to show: a reader
 * should be able to tell the archive's own summary from somebody else's paragraph, and
 * follow the link to whoever did the work.
 */
function loreBlock(station: Station): string {
  const lore = station.lore;
  if (!lore) return '';
  if (!lore.quotedFrom) return `<p class="echo-lore">${esc(lore.text)}</p>`;

  return (
    `<blockquote class="echo-lore echo-lore--quoted" cite="${safeUrl(lore.quotedFrom)}">` +
    `<p>${esc(lore.text)}</p>` +
    `<footer>Quoted from ` +
    `<a href="${safeUrl(lore.quotedFrom)}" target="_blank" rel="noreferrer">` +
    `${esc(hostLabel(lore.quotedFrom))}</a>, CC BY-NC-SA 4.0</footer>` +
    `</blockquote>`
  );
}

function detailHtml(station: Station): string {
  const links = archiveLinks(station);
  const now = new Date();

  const items = [
    { label: 'Classification', value: describeDesignator(station.enigmaId) },
    { label: 'Operator', value: station.operator },
    { label: 'Status', value: statusClaim(station) },
  ];
  // The source's own phrasing rather than the year behind it: "Active since mid 1970s"
  // and "Last heard in 1996" are different claims that would both render as a bare year.
  if (station.activeFrom) items.push({ label: 'Start', value: station.activeFrom.note });
  if (station.activeUntil) items.push({ label: 'End', value: station.activeUntil.note });
  if (station.marker) items.push({ label: 'Marker', value: station.marker });
  if (station.aliases.length) {
    items.push({ label: 'Also known as', value: station.aliases.join(', ') });
  }

  const body =
    loreBlock(station) +
    (station.frequencies.length ? provenanceTable(station) : '') +
    sitesTable(station) +
    (station.schedules.length
      ? `<h4>Schedule</h4><ul class="echo-gap__links">` +
        station.schedules
          .map(
            (schedule) =>
              `<li><code>${esc(schedule.rrule)}</code>` +
              ` — ${esc(describeScheduleKhz(schedule, now))}, read ${esc(schedule.lastConfirmed)}` +
              (schedule.note ? `<span>${esc(schedule.note)}</span>` : '') +
              `</li>`,
          )
          .join('') +
        `</ul>`
      : '') +
    // No links on the notice: the Recordings and logs section below already lists the
    // same four, and printing them twice on the same screen reads as a rendering bug.
    (isRosterOnly(station)
      ? gapNotice(
          'No frequency imported',
          'Nobody has contributed a confirmed frequency or transmission time for this ' +
            'one yet. The identity, status and history above are sourced; the operational ' +
            'detail is the gap.',
        )
      : '') +
    `<div class="echo-observations"></div>`;

  const archive =
    `<h4>Recordings and logs</h4>` +
    `<p class="echo-gap__body">Searches on the established archives. This app hosts no ` +
    `message recordings: publishing the contents of non-broadcast transmissions is the ` +
    `regulated act, and the hobby groups have curated these for decades.</p>` +
    `<ul class="echo-gap__links">` +
    links
      .map(
        (link) =>
          `<li><a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>` +
          `<span>${esc(link.description)}</span></li>`,
      )
      .join('') +
    `</ul>`;

  return (
    `<div class="echo-detail">` +
    `<header class="echo-detail__header">` +
    `<button class="echo-back" type="button" name="back" aria-label="Back to archive">‹</button>` +
    `<span class="echo-detail__title">` +
    `<span class="echo-detail__title-line">` +
    `<span class="echo-detail__designator">${esc(station.enigmaId)}</span>` +
    // Roster entries fall back to the designator as their name, and printing it twice
    // reads as a glitch rather than as a station with no nickname.
    (station.name === station.enigmaId
      ? ''
      : `<span class="echo-detail__name">${esc(station.name)}</span>`) +
    `</span>` +
    `<span class="echo-detail__tier">${TIER_LABEL[station.tier]}</span>` +
    `</span></header>` +
    `<div class="echo-scroll"><div class="echo-detail__body">` +
    definitionList(items) +
    body +
    archive +
    sourceCredit(station) +
    `</div></div></div>`
  );
}

export function stationsView(param = ''): {
  element: HTMLElement;
  destroy: () => void;
  route: (next: string) => void;
} {
  const element = document.createElement('section');
  element.className = 'view view-stations';

  const counts = TIER_ORDER.map(
    (tier) =>
      `${allStations().filter((station) => station.tier === tier).length} ${TIER_LABEL[
        tier
      ].toLowerCase()}${tier === 'live' ? 's' : ''}`,
  );

  element.innerHTML = `
    <div class="echo-station-layout">
      <div class="echo-scroll">
        <div class="echo-sticky">
          ${searchField('q', 'Search designator, name or operator')}
          ${segmented('tier', [
            { value: '', label: 'All' },
            { value: 'live', label: 'Live' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'historical', label: 'Historical' },
          ], '')}
          <p>
            141 stations — ${counts.join(', ')}. Status is shown as a dated claim,
            because most published "active" listings are stale. Compiled by
            <button class="echo-linkish" type="button" name="credits">Priyom.org and
            ENIGMA 2000</button>, and used under their licence.
            <button class="echo-linkish" type="button" name="decode">What do the codes
            mean?</button>
            <button class="echo-linkish" type="button" name="timeline">Timeline</button>
          </p>
          <div class="echo-family-filter" hidden></div>
        </div>
        <div class="echo-rows"></div>
      </div>
      <div class="echo-detail-slot"></div>
    </div>
  `;

  const search = element.querySelector<HTMLInputElement>('[name="q"]')!;
  const familyFilter = element.querySelector<HTMLElement>('.echo-family-filter')!;
  const segments = element.querySelector<HTMLElement>('.echo-segmented')!;
  const rows = element.querySelector<HTMLElement>('.echo-rows')!;
  const detailSlot = element.querySelector<HTMLElement>('.echo-detail-slot')!;

  let tier: Tier | '' = '';
  /** Designator family letter, applied on top of the tier and the search. */
  let prefix = '';

  const render = (): void => {
    const query = search.value.trim().toLowerCase();

    const matches = allStations().filter((station) => {
      if (prefix && designatorPrefix(station.enigmaId) !== prefix) return false;
      if (tier && station.tier !== tier) return false;
      if (!query) return true;
      return (
        station.enigmaId.toLowerCase().includes(query) ||
        station.name.toLowerCase().includes(query) ||
        station.operator.toLowerCase().includes(query) ||
        station.aliases.some((alias) => alias.toLowerCase().includes(query))
      );
    });

    if (!matches.length) {
      rows.innerHTML = `<div class="echo-detail__body">${gapNotice(
        'No match',
        'Nothing in the roster matches that search. Designators are the reliable key — ' +
          'try "S28", "Buzzer", or an operator name.',
      )}</div>`;
      return;
    }

    const row = (station: Station): string =>
      stationRow({
        designator: station.enigmaId,
        name: station.name,
        operator: station.operator,
        tier: station.tier,
        periodSec: station.markerPeriodSec,
        disputed: station.frequencies.some((frequency) => frequency.disputed),
      });

    // Tier sections only when unfiltered: with a filter applied the header would
    // repeat what the segmented control already says.
    rows.innerHTML = tier || prefix
      ? matches.map(row).join('')
      : TIER_ORDER.map((group) => {
          const inGroup = matches.filter((station) => station.tier === group);
          if (!inGroup.length) return '';
          return tierHeader(TIER_LABEL[group], inGroup.length) + inGroup.map(row).join('');
        }).join('');
  };

  /** The designator whose detail is on screen, so a hash echo does not re-render it. */
  let openId: string | null = null;

  /* --- back: edge swipe, 1:1 with the finger, spec §5.2 item 2 and §6 "Edge swipe" - */

  /** Touch has to start within this many px of the leading edge to count as the back
   *  gesture, so it never steals a drag or a tap meant for the detail body. */
  const EDGE_PX = 24;

  const currentPanel = (): HTMLElement | null =>
    detailSlot.querySelector<HTMLElement>('.echo-detail');

  /** Slides the open detail off to the trailing edge, then hands off to `route`. */
  const animateBack = (panel: HTMLElement): void => {
    panel.style.transition = 'transform var(--dur-slow) var(--ease-out)';
    panel.style.transform = 'translateX(100%)';
    const done = (): void => {
      location.hash = 'archive';
    };
    panel.addEventListener('transitionend', done, { once: true });
    // Reduced motion shortens the transition, and an interrupted one never ends.
    window.setTimeout(done, 400);
  };

  let dragStartX = 0;
  let dragStartAt = 0;
  let dragging = false;

  const onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || event.clientX > EDGE_PX) return;
    // A control that happens to sit near the edge — the back button itself — keeps its
    // own tap; the gesture is for the bare margin next to it.
    if ((event.target as HTMLElement).closest('button, a')) return;
    const panel = currentPanel();
    if (!panel) return;

    dragging = true;
    dragStartX = event.clientX;
    dragStartAt = event.timeStamp;
    // The push-in animation holds a transform of its own and would fight the drag.
    panel.style.animation = 'none';
    panel.style.transition = 'none';
    detailSlot.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) return;
    const panel = currentPanel();
    if (!panel) return;
    const width = panel.getBoundingClientRect().width || 1;
    const dx = Math.min(width, Math.max(0, event.clientX - dragStartX));
    panel.style.transform = `translateX(${dx}px)`;
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    const panel = currentPanel();
    if (!panel) return;

    const width = panel.getBoundingClientRect().width || 1;
    const dx = Math.min(width, Math.max(0, event.clientX - dragStartX));
    const velocity = dx / Math.max(1, event.timeStamp - dragStartAt);
    panel.style.transition = 'transform var(--dur-slow) var(--ease-out)';

    // Either far enough, or fast enough. A flick that has barely moved still means go.
    if (dx > width * 0.3 || velocity > 0.5) {
      animateBack(panel);
      return;
    }
    panel.style.transform = 'translateX(0)';
  };

  detailSlot.addEventListener('pointerdown', onPointerDown);
  detailSlot.addEventListener('pointermove', onPointerMove);
  detailSlot.addEventListener('pointerup', onPointerUp);
  detailSlot.addEventListener('pointercancel', onPointerUp);

  const openDetail = (station: Station): void => {
    openId = station.enigmaId;
    detailSlot.innerHTML = detailHtml(station);

    // Hearings need the Phase 3 server. Without it the section stays absent rather
    // than showing an empty table that implies the station has never been heard.
    void fetchObservations(station.enigmaId).then((observations) => {
      if (!observations) return;
      const slot = detailSlot.querySelector<HTMLElement>('.echo-observations');
      if (slot) slot.innerHTML = observationsHtml(observations);
    });
  };

  /** The applied family, with the way out: a filter you cannot see is a broken archive. */
  const renderFamilyFilter = (): void => {
    familyFilter.hidden = prefix === '';
    if (!prefix) return;

    familyFilter.innerHTML =
      `<span>Showing ${esc(PREFIX_MEANING[prefix] ?? prefix)} — designators beginning ` +
      `${esc(prefix)}</span>` +
      `<button class="echo-linkish" type="button" name="clear-family">Show all</button>`;
  };

  const applyPrefix = (next: string): void => {
    prefix = next;
    renderFamilyFilter();
    render();
  };

  search.addEventListener('input', render);

  segments.addEventListener('click', (event) => {
    const segment = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-value]');
    if (!segment) return;

    tier = (segment.dataset.value ?? '') as Tier | '';
    for (const other of segments.querySelectorAll<HTMLButtonElement>('[data-value]')) {
      other.setAttribute('aria-selected', String(other === segment));
    }
    render();
  });

  // Opening and closing a station go through the hash rather than straight to the DOM,
  // so a station has an address that can be sent to someone. `route` below is what
  // actually renders; this only asks for it.
  rows.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-id]');
    if (button?.dataset.id) location.hash = `archive/${button.dataset.id}`;
  });

  detailSlot.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('[name="credits"]')) {
      openCredits();
      return;
    }
    if (target.closest('[name="correct"]')) {
      const station = openId ? byId(openId) : undefined;
      if (station) openCorrection(station);
      return;
    }
    if (target.closest('[name="back"]')) {
      const panel = currentPanel();
      if (panel) animateBack(panel);
      else location.hash = 'archive';
    }
  });

  element.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('[name="credits"]')) openCredits();
    if (target.closest('[name="decode"]')) openDecoder(applyPrefix);
    if (target.closest('[name="timeline"]')) openTimeline();
    if (target.closest('[name="clear-family"]')) applyPrefix('');
  });

  /**
   * Applies `#archive/<designator>`.
   *
   * Called on every hash change while this view stays mounted, including the echo of
   * the change this view just made, so it has to be idempotent — re-rendering an
   * already-open station would restart its observation fetch on every navigation.
   */
  const route = (next: string): void => {
    if (!next) {
      openId = null;
      detailSlot.replaceChildren();
      return;
    }
    if (next.toLowerCase() === openId?.toLowerCase()) return;

    // Matched without regard to case so a link survives being retyped, but never
    // normalised: designators are mixed case — V02a, S06c, XPA2 — and upper-casing one
    // makes it match nothing at all.
    const station = allStations().find(
      (candidate) => candidate.enigmaId.toLowerCase() === next.toLowerCase(),
    );
    if (station) {
      openDetail(station);
      return;
    }

    // A designator that does not exist — a stale link, or a typo in a shared one. Show
    // the list rather than an error, and correct the address so Back behaves.
    openId = null;
    detailSlot.replaceChildren();
    location.hash = 'archive';
  };

  render();
  route(param);

  return { element, destroy: () => {}, route };
}
