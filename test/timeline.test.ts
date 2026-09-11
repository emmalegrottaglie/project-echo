import { describe, expect, it } from 'vitest';
import { timeline } from '../src/timeline';
import type { Station } from '../src/types';

/**
 * The timeline's job is to be honest about lopsided data. Endings are well recorded in
 * this archive and beginnings are barely recorded at all, so the cases that matter are
 * the ones where a date is missing: a station must never gain a bar stretching back to
 * a start nobody published.
 */

function station(overrides: Partial<Station> = {}): Station {
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

function from(year: number, approximate = false): Station['activeFrom'] {
  return {
    year,
    approximate,
    note: 'source phrasing',
    lastConfirmed: '2026-09-11',
    sourceUrl: 'https://example.org/',
  };
}

describe('what gets a row', () => {
  it('leaves out a station with no date at either end, and counts it', () => {
    const model = timeline([station({ enigmaId: 'A' }), station({ enigmaId: 'B' })], 2026);
    expect(model.rows).toEqual([]);
    expect(model.undated).toBe(2);
  });

  it('includes a station known only by when it stopped', () => {
    const model = timeline([station({ enigmaId: 'E03', lastConfirmed: '2008-07-02' })], 2026);
    expect(model.rows).toHaveLength(1);
    expect(model.undated).toBe(0);
  });

  it('gives an end-only station a mark rather than a bar back to an invented start', () => {
    // The whole point: no source says when E03a began, so nothing may be drawn there.
    const model = timeline([station({ enigmaId: 'E03a', lastConfirmed: '2009-12-01' })], 2026);
    expect(model.rows[0]?.width).toBe(0);
  });
});

describe('placement', () => {
  const stations = [
    station({ enigmaId: 'OLD', activeFrom: from(1976), lastConfirmed: '2008-01-01' }),
    station({ enigmaId: 'NOW', tier: 'live', activeFrom: from(2000), lastConfirmed: '2026-01-01' }),
  ];

  it('runs the axis from the earliest date to just past this year', () => {
    const model = timeline(stations, 2026);
    expect(model.from).toBe(1976);
    expect(model.to).toBe(2027);
  });

  it('starts the earliest bar at the left edge', () => {
    expect(timeline(stations, 2026).rows[0]?.left).toBe(0);
  });

  it('leaves a still-transmitting station open at the right', () => {
    const model = timeline(stations, 2026);
    const live = model.rows.find((row) => row.id === 'NOW');
    expect(live?.openEnd).toBe(true);
    // Runs to the end of the axis rather than stopping at a date it was last checked.
    expect((live?.left ?? 0) + (live?.width ?? 0)).toBeCloseTo(100, 5);
  });

  it('closes a historical station at the year it was last heard', () => {
    const model = timeline(stations, 2026);
    const dead = model.rows.find((row) => row.id === 'OLD');
    expect(dead?.openEnd).toBe(false);
    // 1976 to 2008 across a 1976-2027 axis.
    expect((dead?.left ?? 0) + (dead?.width ?? 0)).toBeCloseTo((32 / 51) * 100, 5);
  });

  it('orders rows by where they sit on the axis', () => {
    const model = timeline(
      [
        station({ enigmaId: 'LATE', activeFrom: from(2012), lastConfirmed: '2024-01-01' }),
        station({ enigmaId: 'EARLY', activeFrom: from(1975), lastConfirmed: '2008-01-01' }),
      ],
      2026,
    );
    expect(model.rows.map((row) => row.id)).toEqual(['EARLY', 'LATE']);
  });
});

describe('how a span is described', () => {
  it('hedges a start the source hedges', () => {
    const model = timeline([station({ activeFrom: from(1975, true), lastConfirmed: '2008-01-01' })], 2026);
    expect(model.rows[0]?.label).toBe('about 1975 to 2008');
    expect(model.rows[0]?.approximateStart).toBe(true);
  });

  it('states a start the source states', () => {
    const model = timeline([station({ activeFrom: from(1986), lastConfirmed: '2008-01-01' })], 2026);
    expect(model.rows[0]?.label).toBe('1986 to 2008');
  });

  it('says a live station is still transmitting rather than giving it an end', () => {
    const model = timeline([station({ tier: 'live', activeFrom: from(1986) })], 2026);
    expect(model.rows[0]?.label).toBe('1986 to still transmitting');
  });

  it('says only what it knows about an end-only station', () => {
    const model = timeline([station({ lastConfirmed: '2020-09-01' })], 2026);
    expect(model.rows[0]?.label).toBe('last heard 2020');
  });
});
