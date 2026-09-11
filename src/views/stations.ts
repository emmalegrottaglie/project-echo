import { fetchObservations, type Observation } from '../api';
import { archiveLinks } from '../archives';
import { allStations, isRosterOnly, prefixMeaning } from '../data/stations';
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
 * a roster-only entry says its detail has not been imported rather than rendering
 * empty tables as though the station had no frequencies.
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
function observationsHtml(observations: Observation[]): string {
  if (!observations.length) {
    return `<h4>Heard here</h4>${gapNotice(
      'No hearings yet',
      "The live view records one when the detector locks onto this station's marker — " +
        'timing and frequency only, never any content.',
    )}`;
  }

  return (
    `<h4>Heard here</h4><div class="echo-table-scroll"><table>` +
    `<thead><tr><th>When</th><th>kHz</th><th>Period</th><th>Receiver</th></tr></thead><tbody>` +
    observations
      .map(
        (observation) =>
          `<tr><td>${new Date(observation.heardAt).toLocaleString()}</td>` +
          `<td>${observation.khz ?? '—'}</td>` +
          `<td>${observation.periodSec ? `${observation.periodSec.toFixed(2)} s` : '—'}</td>` +
          `<td>${esc(observation.receiver ?? '—')}</td></tr>`,
      )
      .join('') +
    `</tbody></table></div>`
  );
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
        .map((url) => new URL(url).hostname.replace(/^www\./, '')),
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
    `${hosts.map((host) => esc(host)).join(', ')}. ${links}</p>`
  );
}

function detailHtml(station: Station): string {
  const links = archiveLinks(station);
  const now = new Date();

  const items = [
    { label: 'Classification', value: prefixMeaning(station.enigmaId) },
    { label: 'Operator', value: station.operator },
    { label: 'Status', value: statusClaim(station) },
  ];
  if (station.marker) items.push({ label: 'Marker', value: station.marker });
  if (station.aliases.length) {
    items.push({ label: 'Also known as', value: station.aliases.join(', ') });
  }

  // No links on the notice: the Recordings and logs section below already lists the
  // same four, and printing them twice on the same screen reads as a rendering bug.
  const body = isRosterOnly(station)
    ? gapNotice(
        'Not imported',
        'The designator, name, operator and status are sourced; frequencies, schedules ' +
          'and history have not been imported yet.',
      )
    : `<p class="echo-lore">${esc(station.lore ?? '')}</p>` +
      (station.frequencies.length ? provenanceTable(station) : '') +
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
            because most published "active" listings are stale.
          </p>
        </div>
        <div class="echo-rows"></div>
      </div>
      <div class="echo-detail-slot"></div>
    </div>
  `;

  const search = element.querySelector<HTMLInputElement>('[name="q"]')!;
  const segments = element.querySelector<HTMLElement>('.echo-segmented')!;
  const rows = element.querySelector<HTMLElement>('.echo-rows')!;
  const detailSlot = element.querySelector<HTMLElement>('.echo-detail-slot')!;

  let tier: Tier | '' = '';

  const render = (): void => {
    const query = search.value.trim().toLowerCase();

    const matches = allStations().filter((station) => {
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
    rows.innerHTML = tier
      ? matches.map(row).join('')
      : TIER_ORDER.map((group) => {
          const inGroup = matches.filter((station) => station.tier === group);
          if (!inGroup.length) return '';
          return tierHeader(TIER_LABEL[group], inGroup.length) + inGroup.map(row).join('');
        }).join('');
  };

  /** The designator whose detail is on screen, so a hash echo does not re-render it. */
  let openId: string | null = null;

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
    if ((event.target as HTMLElement).closest('[name="back"]')) location.hash = 'archive';
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
