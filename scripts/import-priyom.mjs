/**
 * Imports transmission schedules and frequencies from Priyom.org into
 * `data/stations.json`.
 *
 * Committed rather than run once and thrown away, because the result is a few hundred
 * sourced facts and the only honest way to review them is to be able to re-run the
 * import and diff it. Run it with `npm run import-priyom`, read the diff, and commit
 * that — never hand-edit the rows it produces.
 *
 * What it will not do, and why the rules are in code rather than in a person's head:
 *
 * - **It never reads a table with a `Message` column.** V07's page carries a log of
 *   received transmissions, five-figure groups and all. Storing message content is the
 *   legal boundary in docs/RESEARCH.md §5, so the parser refuses that table shape
 *   outright rather than relying on nobody pointing it at one.
 * - **It skips rows rendered in italics.** Priyom's own legend on those pages reads
 *   "Schedules in italics are outdated pending discovery of their new time slots". An
 *   importer that ignored the styling would import retired slots as current.
 * - **It skips rows it cannot parse** and reports them, rather than guessing a day or a
 *   time. A guessed slot would arrive carrying a source URL, which is worse than an
 *   absent one: the provenance stamp makes it look checked.
 *
 * Frequencies rotate month by month, which is why a slot stores twelve entries. The
 * month columns are merged cells — E11's 03:15 slot is one `colspan="4"` covering March
 * to June — so the parser expands them; reading the cells positionally silently shifts
 * every frequency after the first merge.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const AGENT = 'project-echo-import/0.1 (archival research; https://priyom.org credited in app)';
const PAUSE_MS = 600;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY_CODES = {
  monday: 'MO',
  tuesday: 'TU',
  wednesday: 'WE',
  thursday: 'TH',
  friday: 'FR',
  saturday: 'SA',
  sunday: 'SU',
};

const report = { slots: 0, frequencies: 0, outdated: 0, skipped: [], stations: {} };

/* ------------------------------------------------------------------- html ----- */

function text(fragment) {
  return fragment
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, '’')
    .trim();
}

function tables(html) {
  return html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
}

function rows(table) {
  return table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
}

/** Cells with their span, so merged month columns can be expanded. */
function cells(row) {
  return [...row.matchAll(/<(t[dh])\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map((match) => ({
    span: Number(/colspan\s*=\s*"?(\d+)/i.exec(match[2])?.[1] ?? 1),
    rowspan: Number(/rowspan\s*=\s*"?(\d+)/i.exec(match[2])?.[1] ?? 1),
    html: match[3],
    text: text(match[3]),
  }));
}

/* ----------------------------------------------------------------- parsing ---- */

function isScheduleTable(table) {
  const header = cells(rows(table)[0] ?? '').map((cell) => cell.text);
  // The message log is `Date | Message`. Refusing it here is the point.
  if (header.some((name) => /^message$/i.test(name))) return false;
  return header[1] === 'UTC' && MONTHS.every((month) => header.includes(month));
}

function byDay(cellText) {
  const codes = cellText
    .split(/[\n,&]|and/i)
    .map((part) => DAY_CODES[part.trim().toLowerCase()])
    .filter(Boolean);
  return codes.length ? [...new Set(codes)] : null;
}

function monthlyKhz(monthCells) {
  const expanded = [];
  for (const cell of monthCells) {
    const khz = Number(cell.text.replace(/[^\d.]/g, ''));
    const value = Number.isFinite(khz) && khz > 0 ? khz : null;
    for (let i = 0; i < cell.span; i += 1) expanded.push(value);
  }
  // Short rows mean a trailing ID column was absent, not that December is missing.
  while (expanded.length < 12) expanded.push(null);
  return expanded.slice(0, 12);
}

/** Parses one schedule table into slots. */
function parseSchedule(table, { id, sourceUrl }) {
  const slots = [];
  const header = cells(rows(table)[0] ?? '').map((cell) => cell.text);
  const hasId = header[header.length - 1] === 'ID';
  let carriedDay = null;
  let carriedRows = 0;

  for (const row of rows(table).slice(1)) {
    // Priyom's own legend: "Schedules in italics are outdated pending discovery of
    // their new time slots". Counted rather than silently dropped, so the totals add up.
    if (/<(i|em)\b/i.test(row)) {
      report.outdated += 1;
      report.stations[id].outdated += 1;
      continue;
    }
    const parts = cells(row);
    if (!parts.length) continue;

    let dayCell = null;
    let rest = parts;

    if (parts[0].rowspan > 1) {
      carriedDay = byDay(parts[0].text);
      carriedRows = parts[0].rowspan - 1;
      dayCell = carriedDay;
      rest = parts.slice(1);
    } else if (carriedRows > 0) {
      carriedRows -= 1;
      dayCell = carriedDay;
    } else {
      dayCell = byDay(parts[0].text);
      rest = parts.slice(1);
    }

    const time = /^(\d{1,2}):(\d{2})$/.exec(rest[0]?.text ?? '');
    if (!dayCell || !time) {
      const label = parts.map((cell) => cell.text).join(' | ').slice(0, 70);
      if (label && !/^Day\b/.test(label)) report.skipped.push(`${id}: ${label}`);
      continue;
    }

    const khzByMonth = monthlyKhz(rest.slice(1));
    if (khzByMonth.every((khz) => khz === null)) {
      report.skipped.push(`${id}: ${time[0]} has no frequency in any month`);
      continue;
    }

    // The trailing ID column identifies the transmission and is worth keeping, but
    // only where it is a single value for the year — V07 and XPA publish a different ID
    // per month, on a separate row this parser skips.
    const trailing = hasId ? (rest[rest.length - 1]?.text ?? '') : '';
    const id3 = /^\d{2,3}$/.test(trailing) ? trailing : null;

    slots.push({
      rrule: `FREQ=WEEKLY;BYDAY=${dayCell.join(',')};BYHOUR=${Number(time[1])};BYMINUTE=${Number(time[2])}`,
      khzByMonth,
      note: id3 ? `Transmission ID ${id3}.` : null,
      sourceUrl,
    });
  }

  return slots;
}

/**
 * M23 publishes fixed daily slots instead of a monthly rotation, in a
 * `Time | Frequency | ID | First heard` table. A second table on the same page has a
 * `Last heard` column and lists slots that have stopped; importing that as current is
 * the trap this function exists to avoid.
 */
function parseFixedDaily(html, { sourceUrl }) {
  const slots = [];

  for (const table of tables(html)) {
    const header = cells(rows(table)[0] ?? '').map((cell) => cell.text.replace(/\s+/g, ' '));
    if (!/^Time/i.test(header[0] ?? '')) continue;
    if (!/^Frequency/i.test(header[1] ?? '')) continue;
    if (header.some((name) => /last heard/i.test(name))) continue; // discontinued

    for (const row of rows(table).slice(1)) {
      if (/<(i|em)\b/i.test(row)) continue;
      const parts = cells(row).map((cell) => cell.text);
      const time = /^(\d{1,2}):(\d{2})$/.exec(parts[0] ?? '');
      const khz = Number((parts[1] ?? '').replace(/[^\d.]/g, ''));
      if (!time || !Number.isFinite(khz) || khz <= 0) continue;

      slots.push({
        rrule: `FREQ=DAILY;BYHOUR=${Number(time[1])};BYMINUTE=${Number(time[2])}`,
        khzByMonth: Array.from({ length: 12 }, () => khz),
        note: 'Daily, on one frequency year round.',
        sourceUrl,
      });
    }
  }

  return slots;
}

/** The `Frequencies` row of a station page infobox, when it lists discrete values. */
function parseFrequencies(html) {
  const match = /<tr[^>]*>\s*<t[dh][^>]*>\s*Frequencies\s*<\/t[dh]>([\s\S]*?)<\/tr>/i.exec(html);
  if (!match) return [];

  const body = text(match[1]);
  // "2900 - 5300" is a range, and "Various" is not data. Neither becomes a frequency.
  if (!body || /various/i.test(body) || /\d\s*-\s*\d/.test(body)) return [];

  return [...new Set(body.split(/[,\s]+/).map(Number).filter((khz) => khz > 0))];
}

/* -------------------------------------------------------------------- run ----- */

async function get(url) {
  const response = await fetch(url, { headers: { 'user-agent': AGENT } });
  await sleep(PAUSE_MS);
  if (!response.ok) return null;
  // V07's /schedule redirects to /sunday, the only day it currently transmits. Cite
  // where the table actually is, not where the link pointed.
  return { html: await response.text(), url: response.url };
}

const data = JSON.parse(readFileSync('data/stations.json', 'utf8'));
const today = new Date().toISOString().slice(0, 10);

// Slots carry twelve monthly frequencies, which a version 1 reader cannot understand.
data.schemaVersion = 2;

for (const station of data.stations) {
  if (station.tier !== 'scheduled') continue;

  const base = station.sourceUrls.find((url) => url.includes('priyom.org/number-stations/'));
  if (!base) continue;

  const slots = [];
  report.stations[station.enigmaId] = { slots: 0, frequencies: 0, outdated: 0 };

  const schedule = await get(`${base}/schedule`);
  if (schedule) {
    const scheduleTables = tables(schedule.html).filter(isScheduleTable);
    for (const table of scheduleTables) {
      slots.push(...parseSchedule(table, { id: station.enigmaId, sourceUrl: schedule.url }));
    }
    if (!scheduleTables.length) {
      slots.push(...parseFixedDaily(schedule.html, { sourceUrl: schedule.url }));
    }
  }

  const page = await get(base);
  const khz = page ? parseFrequencies(page.html) : [];

  if (slots.length) {
    station.schedules = slots;
    station.lastConfirmed = today;
  }
  if (khz.length) {
    station.frequencies = khz.map((value) => ({
      khz: value,
      mode: 'USB',
      timeOfDay: null,
      lastConfirmed: today,
      sourceUrl: base,
      disputed: false,
    }));
  }

  report.slots += slots.length;
  report.frequencies += khz.length;
  report.stations[station.enigmaId].slots = slots.length;
  report.stations[station.enigmaId].frequencies = khz.length;
}

writeFileSync('data/stations.json', `${JSON.stringify(data, null, 2)}\n`, 'utf8');

for (const [id, counts] of Object.entries(report.stations)) {
  if (!counts.slots && !counts.frequencies && !counts.outdated) continue;
  console.log(
    `${id.padEnd(5)} slots=${String(counts.slots).padStart(3)}` +
      ` frequencies=${String(counts.frequencies).padStart(2)}` +
      ` outdated-skipped=${counts.outdated}`,
  );
}
console.log(
  `\ntotal: ${report.slots} slots, ${report.frequencies} frequencies, ` +
    `${report.outdated} rows skipped as outdated`,
);
if (report.skipped.length) {
  console.log(`\nskipped ${report.skipped.length} rows:`);
  for (const line of report.skipped) console.log(`  ${line}`);
}
