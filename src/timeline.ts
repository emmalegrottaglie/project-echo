import { allStations } from './data/stations';
import type { Station } from './types';
import { esc, gapNotice, openSheet, type Sheet } from './ui';

/**
 * When each station was on the air, as far as the sources say.
 *
 * The honest shape of this data is lopsided. Ends are well recorded — the Lincolnshire
 * Poacher in 2008, Cherry Ripe in 2009, Atención in 2019, V15 and V24 in 2020, HM01 in
 * 2024, and sixty more taken from the descriptions Priyom publish, while three Russian
 * markers carry on. Beginnings are the thinnest thing these sources carry, and most of
 * the eighteen that exist are a first hearing rather than a start — which is why nearly
 * all of them are marked approximate.
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
  /** Nobody said the station stopped, only when it was last heard: soft right edge. */
  approximateEnd: boolean;
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
 * The last year a station is known to have been on the air.
 *
 * Two sources of that, and the later one wins because both are lower bounds: a source
 * saying the station ceased, and the date this archive last confirmed it transmitting.
 * G06 is why the rule is stated rather than assumed — Priyom record it as retired from
 * regular operation in March 2021 and then heard in test transmissions in November 2024,
 * and a bar stopping in 2021 would contradict a hearing three years later.
 *
 * Null has two meanings the caller has to keep apart: for a station still transmitting
 * there is no end yet, and for a historical one with neither claim nobody wrote the
 * ending down. The first draws to the edge; the second cannot draw at all without
 * inventing a duration.
 */
function endYear(station: Station): number | null {
  if (stillTransmitting(station)) return null;

  const years = [
    station.activeUntil?.year,
    station.lastConfirmed ? Number(station.lastConfirmed.slice(0, 4)) : undefined,
  ].filter((year): year is number => year !== undefined);

  return years.length ? Math.max(...years) : null;
}

/** The year a source says the station stopped, as against a year somebody heard it. */
function ceasedYear(station: Station): number | null {
  return station.activeUntil && !station.activeUntil.approximate ? station.activeUntil.year : null;
}

/**
 * True unless the year being drawn is the year a source says the station stopped.
 *
 * A last hearing bounds the end without being it — the station may have gone on
 * transmitting with nobody listening — so only an explicit cessation earns a hard edge.
 * It has to be the cessation that is actually being drawn, which is not the same as the
 * station merely having one: G06 ceased regular operation in 2021 and was heard again in
 * 2024, so its bar ends at 2024, and calling that edge a cessation would put the word
 * "ceased" on a year its own source describes as a hearing.
 */
function approximateEnd(station: Station): boolean {
  const end = endYear(station);
  return end === null || end !== ceasedYear(station);
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
        approximateEnd: approximateEnd(station),
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

  // A cessation and a last hearing are different claims, so they get different words.
  const ceased = end !== null && !approximateEnd(station);

  if (startText === null) return ceased ? `ceased ${end}` : `last heard ${end}`;
  if (end === null) {
    return stillTransmitting(station)
      ? `${startText} to still transmitting`
      : `${startText}, end unrecorded`;
  }
  return `${startText} to ${ceased ? end : `about ${end}`}`;
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
            ? `<span class="echo-timeline__bar${row.approximateStart ? ' is-soft-start' : ''}` +
              `${row.openEnd || row.approximateEnd ? ' is-soft-end' : ''}"` +
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
        `by. A bar spans a station whose beginning and ending are both recorded; a single ` +
        `mark is one known by a single date. An edge fades where the source gives an ` +
        `observation rather than an event — "first heard in February 1995" and "Last heard ` +
        `in 1996" bound a station's life without being it, while "Ceased in 2001" is the ` +
        `source saying the station stopped, and that edge is drawn hard.`,
    );

  sheet.body.addEventListener('click', (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-id]');
    if (!row?.dataset.id) return;
    sheet.close();
    location.hash = `archive/${row.dataset.id}`;
  });

  return sheet;
}
