import { allStations } from './data/stations';
import type { Station } from './types';
import { esc, gapNotice, openSheet, type Sheet } from './ui';

/**
 * When each station was on the air, as far as the sources say.
 *
 * The honest shape of this data is lopsided. Ends are well recorded — a historical
 * station's `lastConfirmed` is the date it was last heard, and those dates are the most
 * striking thing in the archive: the Lincolnshire Poacher in 2008, Cherry Ripe in 2009,
 * Atención in 2019, V15 and V24 in 2020, HM01 in 2024, while three Russian markers carry
 * on. Beginnings are the thinnest thing these sources carry, and only six are recorded
 * at all.
 *
 * So this is a timeline of what is known rather than a timeline of the roster, and it
 * says which it is. A bar needs both ends; a station with only an ending gets a mark at
 * that ending and nothing stretching back to an invented start.
 */

export interface TimelineRow {
  id: string;
  name: string;
  /** Percent from the left edge of the axis. */
  left: number;
  /** Percent of the axis width. Zero for a station known only by its ending. */
  width: number;
  /** The start is a guess at a decade, so its left edge is drawn soft. */
  approximateStart: boolean;
  /** Still transmitting, so the bar runs off the right edge rather than stopping. */
  openEnd: boolean;
  label: string;
}

export interface Timeline {
  from: number;
  to: number;
  rows: TimelineRow[];
  /** Stations carrying no date at either end. */
  undated: number;
}

/** The year a station was last heard, or null while it is still transmitting. */
function endYear(station: Station): number | null {
  if (station.tier !== 'historical') return null;
  return station.lastConfirmed ? Number(station.lastConfirmed.slice(0, 4)) : null;
}

/**
 * Lays the dated stations out against a shared axis.
 *
 * `now` is a parameter so the axis is deterministic under test; in the app it is this
 * year, because a station still transmitting has no right-hand end.
 */
export function timeline(stations: readonly Station[], now: number): Timeline {
  const dated = stations.filter((station) => station.activeFrom || endYear(station) !== null);

  const years = dated.flatMap((station) => {
    const end = endYear(station);
    return [station.activeFrom?.year, end].filter((year): year is number => year !== null && year !== undefined);
  });

  const from = years.length ? Math.min(...years) : now;
  // A little headroom on the right so a bar that runs to now does not touch the edge.
  const to = now + 1;
  const span = Math.max(1, to - from);
  const place = (year: number): number => ((year - from) / span) * 100;

  const rows = dated
    .map((station): TimelineRow => {
      const start = station.activeFrom?.year ?? null;
      const end = endYear(station);
      const openEnd = end === null;

      const left = place(start ?? end ?? from);
      const right = place(end ?? to);

      return {
        id: station.enigmaId,
        name: station.name === station.enigmaId ? '' : station.name,
        left,
        width: start === null ? 0 : Math.max(0, right - left),
        approximateStart: station.activeFrom?.approximate ?? false,
        openEnd,
        label: describeSpan(station, start, end),
      };
    })
    // Earliest first where a start is known; the end-only marks fall in among them by
    // the only date they have, which is where they belong on an axis of time.
    .sort((a, b) => a.left - b.left || a.id.localeCompare(b.id));

  return { from, to, rows, undated: stations.length - dated.length };
}

function describeSpan(station: Station, start: number | null, end: number | null): string {
  const startText = station.activeFrom
    ? station.activeFrom.approximate
      ? `about ${start}`
      : String(start)
    : null;
  const endText = end === null ? 'still transmitting' : String(end);
  return startText ? `${startText} to ${endText}` : `last heard ${endText}`;
}

export function openTimeline(): Sheet {
  const sheet = openSheet(
    'Timeline',
    'When each station was on the air, where a source says so.',
    undefined,
  );

  const model = timeline(allStations(), new Date().getUTCFullYear());

  const decades: string[] = [];
  for (let year = Math.ceil(model.from / 10) * 10; year < model.to; year += 10) {
    const left = ((year - model.from) / (model.to - model.from)) * 100;
    decades.push(
      `<span class="echo-timeline__decade" style="left:${left.toFixed(2)}%">${year}</span>`,
    );
  }

  sheet.body.innerHTML =
    `<div class="echo-timeline">` +
    `<div class="echo-timeline__axis" aria-hidden="true">${decades.join('')}</div>` +
    model.rows
      .map(
        (row) =>
          `<button class="echo-timeline__row" type="button" data-id="${esc(row.id)}">` +
          `<span class="echo-timeline__name">` +
          `<span class="echo-timeline__designator">${esc(row.id)}</span>` +
          (row.name ? `<span>${esc(row.name)}</span>` : '') +
          `</span>` +
          `<span class="echo-timeline__track">` +
          (row.width > 0
            ? `<span class="echo-timeline__bar${row.approximateStart ? ' is-approximate' : ''}` +
              `${row.openEnd ? ' is-open' : ''}"` +
              ` style="left:${row.left.toFixed(2)}%;width:${row.width.toFixed(2)}%"></span>`
            : `<span class="echo-timeline__tick" style="left:${row.left.toFixed(2)}%"></span>`) +
          `</span>` +
          `<span class="echo-timeline__label">${esc(row.label)}</span>` +
          `</button>`,
      )
      .join('') +
    `</div>` +
    gapNotice(
      `${model.rows.length} of ${model.rows.length + model.undated} stations carry a date`,
      `The rest are in the archive with an operator and a status but nothing to place them ` +
        `by. Endings are recorded far better than beginnings here: only six stations have a ` +
        `sourced start, and where a start is a guess at a decade the bar fades out to the ` +
        `left rather than pretending to a year.`,
    );

  sheet.body.addEventListener('click', (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-id]');
    if (!row?.dataset.id) return;
    sheet.close();
    location.hash = `archive/${row.dataset.id}`;
  });

  return sheet;
}
