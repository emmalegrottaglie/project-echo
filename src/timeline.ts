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
 * on. Beginnings are the thinnest thing these sources carry, and most of the sixteen
 * that exist are a first hearing rather than a start — which is why nearly all of them
 * are marked approximate.
 *
 * So this is a timeline of what is known rather than a timeline of the roster, and it
 * says which it is. A bar needs both ends. A station with only an ending gets a mark at
 * that ending and nothing stretching back to an invented start, and a station with only
 * a beginning gets a mark at that beginning — several of the starts imported from Priyom
 * belong to stations that stopped without anybody recording when, and drawing those to
 * the right-hand edge would say they are still on the air.
 */

export interface TimelineRow {
  id: string;
  name: string;
  /** Percent from the left edge of the axis. */
  left: number;
  /** Percent of the axis width. Zero where only one end of the span is known. */
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

/** True while the station is on the air, so its span has no right-hand end yet. */
function stillTransmitting(station: Station): boolean {
  return station.tier !== 'historical';
}

/**
 * The year a station was last heard.
 *
 * Null has two meanings and the caller has to keep them apart: for a station still
 * transmitting there is no end yet, and for a historical one with no `lastConfirmed`
 * nobody wrote the ending down. The first draws to the edge; the second cannot draw at
 * all without inventing a duration.
 */
function endYear(station: Station): number | null {
  if (stillTransmitting(station)) return null;
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

  const years = dated.flatMap((station) =>
    [station.activeFrom?.year, endYear(station)].filter(
      (year): year is number => year !== null && year !== undefined,
    ),
  );

  const from = years.length ? Math.min(...years) : now;
  // A little headroom on the right so a bar that runs to now does not touch the edge.
  const to = now + 1;
  const span = Math.max(1, to - from);
  const place = (year: number): number => ((year - from) / span) * 100;

  const rows = dated
    .map((station): TimelineRow => {
      const start = station.activeFrom?.year ?? null;
      const end = endYear(station);
      const openEnd = stillTransmitting(station);

      // Both ends have to be known before a length means anything. A bar from a sourced
      // start to `to` on a station that went off the air in some unrecorded year would
      // read as thirty more years of transmission than anybody can attest.
      const spans = start !== null && (end !== null || openEnd);

      const left = place(start ?? end ?? from);
      const right = place(end ?? to);

      return {
        id: station.enigmaId,
        name: station.name === station.enigmaId ? '' : station.name,
        left,
        width: spans ? Math.max(0, right - left) : 0,
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

  if (startText === null) return `last heard ${end}`;
  if (end !== null) return `${startText} to ${end}`;
  return stillTransmitting(station) ? `${startText} to still transmitting` : `${startText}, end unrecorded`;
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
        `by. Most of the starts that do exist are the date somebody first heard a station ` +
        `rather than the date it began, so the bar fades out to the left rather than ` +
        `pretending to a year. A single mark is a station known by one date only — either ` +
        `the year it was last heard, or a beginning whose ending nobody wrote down.`,
    );

  sheet.body.addEventListener('click', (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-id]');
    if (!row?.dataset.id) return;
    sheet.close();
    location.hash = `archive/${row.dataset.id}`;
  });

  return sheet;
}
