import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dateCandidates, extractLore } from '../scripts/import-lore.mjs';
import { SCHEMA_VERSION, validateStationData } from '../src/data/schema';
import { isSafeUrl } from '../src/url';

/**
 * The lore import, and the boundary it exists to keep.
 *
 * A Priyom station page mixes description with message-format diagrams, and those
 * diagrams are sample five-figure groups. Storing message content is the legal boundary
 * in docs/RESEARCH.md §5, so these tests are the enforcement of it: they exercise the
 * extractor against pages shaped like theirs, and they re-check the committed data, so a
 * change to either the parser or the roster that lets a group through fails here.
 */

/** A page in Priyom's shape: an infobox section, then a body mixing prose and tables. */
function page(body: string): string {
  return (
    `<section><table><tr><td>Enigma ID</td><td>E99</td></tr></table></section>` +
    `<section>${body}</section>`
  );
}

describe('extracting a description', () => {
  it('keeps the prose', () => {
    const result = extractLore(
      page('<p>E99 is the English language mode of a fictional operator, used in tests.</p>'),
    );
    expect(result.text).toBe(
      'E99 is the English language mode of a fictional operator, used in tests.',
    );
  });

  it('removes the message-format tables before reading a word', () => {
    const result = extractLore(
      page(
        '<p>E99 is the English language mode of a fictional operator, used in tests.</p>' +
          '<table><tr><td>75161 11770 55934 25</td></tr></table>',
      ),
    );
    expect(result.text).not.toMatch(/75161/);
  });

  it('drops a paragraph carrying groups even outside a table', () => {
    const result = extractLore(
      page(
        '<p>E99 is the English language mode of a fictional operator, used in tests.</p>' +
          '<p>The message read 75161 11770 55934 25611 and then repeated once more.</p>',
      ),
    );
    expect(result.text).not.toMatch(/75161/);
    expect(result.dropped.some((line) => line.startsWith('groups:'))).toBe(true);
  });

  it('drops paragraphs that point at something on the page', () => {
    const result = extractLore(
      page(
        '<p>E99 is the English language mode of a fictional operator, used in tests.</p>' +
          '<p>There exists a female E99 voice, as heard below in the recording.</p>',
      ),
    );
    expect(result.text).not.toMatch(/female/);
  });

  it('drops the captions that introduce a format diagram', () => {
    const result = extractLore(
      page(
        '<p>Null format:</p>' +
          '<p>E99 is the English language mode of a fictional operator, used in tests.</p>',
      ),
    );
    expect(result.text).toBe(
      'E99 is the English language mode of a fictional operator, used in tests.',
    );
  });

  it('strips footnote markers and the gap a removed link leaves', () => {
    const result = extractLore(
      page('<p>E99 was replaced by <a href="/e99a">E99a</a> [1] , which is still active.</p>'),
    );
    expect(result.text).toBe('E99 was replaced by E99a, which is still active.');
  });

  it('cuts a long extract at a sentence rather than mid-clause', () => {
    const sentence = 'This station transmitted on a schedule that changed every month. ';
    const result = extractLore(page(`<p>${sentence.repeat(20)}</p>`));
    expect(result.text!.length).toBeLessThanOrEqual(700);
    expect(result.text!.endsWith('.')).toBe(true);
  });

  it('returns nothing for a page with no description', () => {
    expect(extractLore(page('')).text).toBeNull();
    expect(extractLore('<section><table></table></section>').text).toBeNull();
  });
});

describe('reporting a date rather than writing one', () => {
  it('reports a sentence that says when a station was first heard', () => {
    expect(dateCandidates('E09 was first heard in February 1995.')).toEqual([
      'E09 was first heard in February 1995.',
    ]);
  });

  it('ignores a year with nothing to say about a beginning', () => {
    expect(dateCandidates('The operator moved to a new frequency plan in 2011.')).toEqual([]);
  });

  it('ignores a beginning with no year in it', () => {
    expect(dateCandidates('It was first heard some years ago.')).toEqual([]);
  });
});

describe('the committed descriptions', () => {
  const parsed = JSON.parse(readFileSync('data/stations.json', 'utf8')) as unknown;
  const result = validateStationData(parsed);
  if (!result.ok) throw new Error(result.errors.join('; '));
  const stations = result.stations;

  it('never carries a run of five-figure groups', () => {
    const offenders = stations
      .filter((s) => s.lore && /\b\d{5}\b[\s,]+\b\d{5}\b/.test(s.lore.text))
      .map((s) => s.enigmaId);
    expect(offenders).toEqual([]);
  });

  it('attributes every quotation to a safe URL', () => {
    for (const s of stations) {
      if (s.lore?.quotedFrom) expect(isSafeUrl(s.lore.quotedFrom)).toBe(true);
    }
  });
});

describe('validating lore', () => {
  function dataset(lore: unknown): unknown {
    return {
      schemaVersion: SCHEMA_VERSION,
      stations: [
        {
          enigmaId: 'E99',
          name: 'Test',
          aliases: [],
          language: 'English voice',
          operator: 'Nobody',
          tier: 'historical',
          marker: null,
          markerPeriodSec: null,
          lastConfirmed: null,
          lore,
          frequencies: [],
          schedules: [],
          sites: [],
          activeFrom: null,
          sourceUrls: ['https://example.org/'],
        },
      ],
    };
  }

  it('accepts a quotation and an unattributed paragraph alike', () => {
    expect(validateStationData(dataset({ text: 'Written here.', quotedFrom: null })).ok).toBe(true);
    expect(
      validateStationData(dataset({ text: 'Quoted.', quotedFrom: 'https://priyom.org/x' })).ok,
    ).toBe(true);
  });

  it('rejects an attribution that is not an http URL', () => {
    const result = validateStationData(
      dataset({ text: 'Quoted.', quotedFrom: 'javascript:alert(1)' }),
    );
    expect(result.ok).toBe(false);
  });

  it('rejects an empty description', () => {
    expect(validateStationData(dataset({ text: '  ', quotedFrom: null })).ok).toBe(false);
  });

  it('rejects the old shape, so a stale dataset cannot load as valid', () => {
    expect(validateStationData(dataset('a bare string')).ok).toBe(false);
  });
});
