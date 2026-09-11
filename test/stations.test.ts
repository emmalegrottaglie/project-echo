import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, validateStationData } from '../src/data/schema';
import { isSafeUrl } from '../src/url';
import { safeUrl } from '../src/ui';

/**
 * The roster is `data/stations.json` rather than a typed fixture, so the compiler no
 * longer checks it. This suite is what replaces that: it runs the validator over the
 * committed file, which means an edit that drops a source URL, invents a tier or
 * duplicates a designator fails here rather than shipping.
 */

const raw = readFileSync('data/stations.json', 'utf8');
const parsed = JSON.parse(raw) as { schemaVersion: number; stations: unknown[] };

/** A minimal station that passes, used as the base for the rejection cases below. */
function station(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    enigmaId: 'E99',
    name: 'Test',
    aliases: [],
    language: 'English voice',
    operator: 'Nobody',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: null,
    lore: null,
    frequencies: [],
    schedules: [],
    sites: [],
    activeFrom: null,
    sourceUrls: ['https://example.org/'],
    ...overrides,
  };
}

function dataset(...stations: unknown[]): unknown {
  return { schemaVersion: SCHEMA_VERSION, stations };
}

describe('the committed dataset', () => {
  it('validates', () => {
    const result = validateStationData(parsed);
    expect(result.ok ? [] : result.errors).toEqual([]);
  });

  it('holds the whole roster', () => {
    const result = validateStationData(parsed);
    if (!result.ok) throw new Error('dataset is invalid');

    const byTier = (tier: string): number =>
      result.stations.filter((entry) => entry.tier === tier).length;

    expect(result.stations).toHaveLength(141);
    expect(byTier('live')).toBe(3);
    expect(byTier('scheduled')).toBe(26);
    expect(byTier('historical')).toBe(112);
  });

  it('is serialised the way the generator writes it, so diffs stay reviewable', () => {
    expect(raw).toBe(`${JSON.stringify(parsed, null, 2)}\n`);
  });

  it('carries a source for every frequency and every schedule', () => {
    const result = validateStationData(parsed);
    if (!result.ok) throw new Error('dataset is invalid');

    for (const entry of result.stations) {
      for (const frequency of entry.frequencies) {
        expect(isSafeUrl(frequency.sourceUrl), `${entry.enigmaId} frequency`).toBe(true);
        expect(frequency.lastConfirmed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      for (const schedule of entry.schedules) {
        expect(isSafeUrl(schedule.sourceUrl), `${entry.enigmaId} schedule`).toBe(true);
      }
    }
  });

  /**
   * The month columns on Priyom's schedule pages are merged cells — E11's 03:15 slot is
   * `colspan="2"` 8102, `colspan="2"` 12630, `colspan="4"` 16530, and so on. Reading
   * them positionally gives Jan 8102, Feb 12630, Mar 16530, which is wrong from
   * February onward and looks entirely plausible. This row is checked against the page
   * by hand and pins the expansion.
   */
  it('expands merged month columns rather than reading them positionally', () => {
    const result = validateStationData(parsed);
    if (!result.ok) throw new Error('dataset is invalid');

    const e11 = result.stations.find((entry) => entry.enigmaId === 'E11');
    const slot = e11?.schedules.find((entry) => entry.rrule.includes('BYHOUR=3;BYMINUTE=15'));

    expect(slot?.khzByMonth).toEqual([
      8102, 8102, 12630, 12630, 16530, 16530, 16530, 16530, 12630, 12630, 8102, 8102,
    ]);
  });

  it('imported the schedules that Priyom actually publishes', () => {
    const result = validateStationData(parsed);
    if (!result.ok) throw new Error('dataset is invalid');

    const slots = (id: string): number =>
      result.stations.find((entry) => entry.enigmaId === id)?.schedules.length ?? 0;

    // Ten of the twenty-six active stations publish a schedule Priyom tabulates, and
    // two more publish a frequency list. The remaining fourteen carry neither on
    // Priyom at all, and stay honestly empty rather than being filled with guesses.
    expect(slots('E11')).toBeGreaterThan(30);
    expect(slots('XPB')).toBeGreaterThan(40);
    expect(slots('M23')).toBeGreaterThan(0);
    expect(slots('E06')).toBe(0);

    const withSchedules = result.stations.filter(
      (entry) => entry.tier === 'scheduled' && entry.schedules.length > 0,
    );
    expect(withSchedules).toHaveLength(10);

    const withFrequencies = result.stations.filter(
      (entry) => entry.tier === 'scheduled' && entry.frequencies.length > 0,
    );
    expect(withFrequencies.map((entry) => entry.enigmaId)).toEqual(['E25', 'V13']);
  });

  it('never stores a slot that has no frequency in any month', () => {
    const result = validateStationData(parsed);
    if (!result.ok) throw new Error('dataset is invalid');

    for (const entry of result.stations) {
      for (const slot of entry.schedules) {
        expect(slot.khzByMonth, `${entry.enigmaId} ${slot.rrule}`).toHaveLength(12);
        expect(slot.khzByMonth.some((khz) => khz !== null)).toBe(true);
      }
    }
  });

  it('still records S32 as disputed rather than picking a winner', () => {
    const result = validateStationData(parsed);
    if (!result.ok) throw new Error('dataset is invalid');

    const s32 = result.stations.find((entry) => entry.enigmaId === 'S32');
    expect(s32?.frequencies.map((frequency) => frequency.khz).sort()).toEqual([
      3363.5, 3828, 5367, 5473,
    ]);
    expect(s32?.frequencies.every((frequency) => frequency.disputed)).toBe(true);
  });
});

describe('validation', () => {
  it('rejects a schema version it does not know', () => {
    const result = validateStationData({ schemaVersion: 99, stations: [station()] });
    expect(result.ok).toBe(false);
  });

  it('rejects a frequency with no source', () => {
    const result = validateStationData(
      dataset(
        station({
          frequencies: [
            {
              khz: 4625,
              mode: 'USB',
              timeOfDay: null,
              lastConfirmed: '2026-01-01',
              sourceUrl: '',
              disputed: false,
            },
          ],
        }),
      ),
    );
    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.join()).toContain('sourceUrl');
  });

  it('rejects a station citing nothing', () => {
    const result = validateStationData(dataset(station({ sourceUrls: [] })));
    expect(result.ok).toBe(false);
  });

  it('rejects a duplicate designator', () => {
    const result = validateStationData(dataset(station(), station()));
    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.join()).toContain('duplicate');
  });

  it('rejects an unknown tier', () => {
    expect(validateStationData(dataset(station({ tier: 'active' }))).ok).toBe(false);
  });

  it('names every problem it finds, not only the first', () => {
    const result = validateStationData(
      dataset(station({ enigmaId: 'A1', tier: 'nope' }), station({ enigmaId: 'A2', name: '' })),
    );
    expect(result.ok ? [] : result.errors).toHaveLength(2);
  });
});

/**
 * The dataset is fetched over the network and its URLs are interpolated into `href`
 * attributes, so a scheme that executes is the one input that turns stale data into
 * script execution. Rejected at the gate and again at the point of use.
 */
describe('URL handling', () => {
  it('accepts http and https only', () => {
    expect(isSafeUrl('https://priyom.org/')).toBe(true);
    expect(isSafeUrl('http://www.signalshed.com/')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>')).toBe(false);
    expect(isSafeUrl('/relative')).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
  });

  it('keeps a javascript: source out of the dataset', () => {
    const result = validateStationData(
      dataset(station({ sourceUrls: ['javascript:alert(1)'] })),
    );
    expect(result.ok).toBe(false);
  });

  it('refuses to emit one even if it got this far', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('https://priyom.org/a?b=1&c=2')).toBe('https://priyom.org/a?b=1&amp;c=2');
  });
});
