/**
 * Imports each station's descriptive prose from Priyom.org into `data/stations.json`.
 *
 * Most of this roster arrived as identity only — a designator, an operator and a status —
 * and the archive said so rather than pretending the gap was the station. Priyom publish
 * a paragraph of description for nearly every one of them, so the honest way to deepen
 * those entries is to quote it and credit them, not to write something plausible here.
 *
 * What lands is therefore a verbatim extract, stored with the page it came from, and the
 * app renders it as a quotation. `data/LICENSE` already carries the CC BY-NC-SA 4.0 terms
 * their data is under; this is the attribution half of those terms made concrete per
 * station rather than only in a footer.
 *
 * What it will not do, and why the rules are in code rather than in a person's head:
 *
 * - **It strips every table before reading a word.** A station page mixes description
 *   with message-format diagrams, and those diagrams are sample five-figure groups laid
 *   out in tables. Storing message content is the legal boundary in docs/RESEARCH.md §5,
 *   so the tables are removed first and a paragraph that still looks like groups is
 *   dropped on a second check. Two refusals for one boundary is deliberate: the layout
 *   is theirs to change.
 * - **It drops paragraphs that point at the page.** "as heard below", "see the table
 *   above" — true on Priyom, meaningless once the words are somewhere else, and an
 *   extract that references furniture the reader cannot see reads as a broken quote.
 * - **It never writes a date.** Where a page says when a station started, that is
 *   reported to the console as a candidate for a human to weigh, because `activeFrom`
 *   carries the source's own phrasing and an automated guess at which sentence is the
 *   start date would arrive wearing a provenance stamp it had not earned.
 *
 * Run it with `npm run import-lore`, read the diff, and commit that. `PRIYOM_CACHE=<dir>`
 * reads pages from disk instead of the network, which is how the extraction rules were
 * tuned without fetching 127 pages each time.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const AGENT = 'project-echo-import/0.1 (archival research; https://priyom.org credited in app)';
const PAUSE_MS = 800;
const ROOT = 'https://priyom.org';

/**
 * The six index pages. Every one carries the whole navigation, but the station links
 * differ between them, so the map is the union.
 */
const INDEXES = ['english', 'slavic', 'german', 'other', 'morse', 'digital'];

/** Longest extract kept. Past this it stops being a quotation and becomes a mirror. */
const MAX_CHARS = 700;

/** Below this a paragraph is a table caption or a download link, not description. */
const MIN_PARAGRAPH = 40;

const CACHE = process.env.PRIYOM_CACHE ?? null;
if (CACHE && !existsSync(CACHE)) mkdirSync(CACHE, { recursive: true });

/* ------------------------------------------------------------------- html ----- */

function text(fragment) {
  return fragment
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    // Priyom footnote markers, and the gap a stripped inline link leaves before the
    // punctuation that followed it — "replaced by S11a ." reads as a typo here.
    .replace(/\s*\[\d+\]/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

async function fetchPage(path) {
  const name = `${path.split('/').pop()}.html`;
  if (CACHE) {
    const file = join(CACHE, name);
    if (existsSync(file)) return readFileSync(file, 'utf8');
  }

  const response = await fetch(ROOT + path, { headers: { 'user-agent': AGENT } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  const body = await response.text();

  if (CACHE) writeFileSync(join(CACHE, name), body, 'utf8');
  await sleep(PAUSE_MS);
  return body;
}

/* --------------------------------------------------------------- refusals ----- */

/** Two or more five-figure groups in a row: a message, wherever it appears. */
const GROUPS = /\b\d{5}\b[\s,]+\b\d{5}\b/;

/** References to something laid out on the page rather than said in the sentence. */
const DEICTIC =
  /\b(?:below|above|as follows|see (?:the )?(?:table|list|image|diagram|sample)|following table)\b/i;

/** Captions introducing one of the format diagrams. */
const CAPTION = /^(?:null|traffic|message|transmission)[^.]*:$/i;

/* ---------------------------------------------------------------- extract ----- */

/**
 * The description, as Priyom wrote it, with everything that is not description removed.
 *
 * Their page is two sections: an infobox with a table, then the body. Tables go first
 * because the message formats live in them, then paragraphs are taken in order until the
 * extract is long enough.
 */
export function extractLore(html) {
  const sections = [...html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)].map((m) => m[1]);
  if (sections.length < 2) return { text: null, dropped: ['no body section'] };

  const body = sections
    .slice(1)
    .join('\n')
    .replace(/<table[\s\S]*?<\/table>/g, ' ')
    .replace(/<audio[\s\S]*?<\/audio>/g, ' ');

  const kept = [];
  const dropped = [];

  for (const match of body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const paragraph = text(match[1]);
    if (!paragraph) continue;

    if (GROUPS.test(paragraph)) {
      dropped.push(`groups: ${paragraph.slice(0, 40)}`);
      continue;
    }
    if (CAPTION.test(paragraph) || paragraph.length < MIN_PARAGRAPH) {
      dropped.push(`short: ${paragraph}`);
      continue;
    }
    if (DEICTIC.test(paragraph)) {
      dropped.push(`points at the page: ${paragraph.slice(0, 40)}`);
      continue;
    }

    kept.push(paragraph);
    if (kept.join(' ').length >= MAX_CHARS) break;
  }

  if (!kept.length) return { text: null, dropped };

  const joined = kept.join(' ');
  return { text: joined.length > MAX_CHARS ? cutAtSentence(joined, MAX_CHARS) : joined, dropped };
}

/** Trims to the last sentence that fits, so a quote never ends mid-clause. */
function cutAtSentence(value, limit) {
  const window = value.slice(0, limit);
  const stop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '));
  return stop > limit / 2 ? window.slice(0, stop + 1) : `${window.trimEnd()}…`;
}

/**
 * Sentences that look like they say when the station started.
 *
 * Reported, never written. A sentence matching this is a lead for a person to read in
 * context, and the difference that matters is whether the source is stating a start date
 * or describing when somebody first logged one — the second is a fact about listeners.
 */
export function dateCandidates(extract) {
  if (!extract) return [];
  return extract
    .split(/(?<=[.!?])\s+/)
    .filter(
      (sentence) =>
        /\b(?:1[89]\d{2}|20[0-2]\d)\b/.test(sentence) &&
        /\b(?:first|began|start(?:ed)?|since|appeared|originat|introduc|earliest|as early as|dates? back)\b/i.test(
          sentence,
        ),
    );
}

/* ------------------------------------------------------------------- main ----- */

async function main() {
  const urls = new Map();
  for (const index of INDEXES) {
    const html = await fetchPage(`/number-stations/${index}`);
    for (const [, path, slug] of html.matchAll(
      /href="(\/number-stations\/[a-z-]+\/([a-z0-9]+))"/g,
    )) {
      urls.set(slug, path);
    }
  }

  const data = JSON.parse(readFileSync('data/stations.json', 'utf8'));
  // Re-runnable: a quoted description is refreshed from the page it was quoted from,
  // while lore written for this archive is left alone. Without that, a second run would
  // find nothing to do and the import could never be diffed against a changed page.
  const wanted = data.stations.filter(
    (station) => station.lore === null || station.lore.quotedFrom !== null,
  );

  const report = { imported: 0, noPage: [], noProse: [], dates: [] };

  for (const station of wanted) {
    const path = urls.get(station.enigmaId.toLowerCase());
    if (!path) {
      report.noPage.push(station.enigmaId);
      continue;
    }

    const { text: extract } = extractLore(await fetchPage(path));
    if (!extract) {
      report.noProse.push(station.enigmaId);
      continue;
    }

    const sourceUrl = ROOT + path;
    station.lore = { text: extract, quotedFrom: sourceUrl };
    if (!station.sourceUrls.includes(sourceUrl)) station.sourceUrls.push(sourceUrl);
    report.imported += 1;

    for (const sentence of dateCandidates(extract)) {
      report.dates.push(`${station.enigmaId}: ${sentence}`);
    }
  }

  writeFileSync('data/stations.json', `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  console.log(`imported ${report.imported} descriptions`);
  if (report.noPage.length) console.log(`no Priyom page: ${report.noPage.join(' ')}`);
  if (report.noProse.length) console.log(`page carried no description: ${report.noProse.join(' ')}`);
  if (report.dates.length) {
    console.log(
      `\n${report.dates.length} sentences mentioning a year — read these, none were written:`,
    );
    for (const line of report.dates) console.log(`  ${line}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
