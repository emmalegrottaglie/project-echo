import { describe, expect, it } from 'vitest';
import { countdown, formatUtc, nextOccurrence, upcoming } from '../src/schedule';
import type { Schedule, Station } from '../src/types';

/**
 * Schedules are published in UTC and evaluated in UTC; only the formatting layer
 * localises. Converting before comparison is how off-by-an-hour bugs get in, so these
 * tests all assert against UTC instants.
 */

function schedule(rrule: string, khz: number | null = null): Schedule {
  return { rrule, khz, note: null, sourceUrl: 'https://example.test' };
}

function station(id: string, schedules: Schedule[]): Station {
  return {
    enigmaId: id,
    name: id,
    aliases: [],
    language: 'English voice',
    operator: 'Test',
    tier: 'scheduled',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: null,
    lore: null,
    frequencies: [],
    schedules,
    sourceUrls: [],
  };
}

describe('nextOccurrence', () => {
  it('finds the next matching weekday and time in UTC', () => {
    // 2026-09-10 is a Thursday.
    const from = new Date('2026-09-10T00:00:00Z');
    const at = nextOccurrence(schedule('FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=3;BYMINUTE=15'), from);

    // The following Monday, not the past Wednesday.
    expect(at?.toISOString()).toBe('2026-09-14T03:15:00.000Z');
  });

  it('includes an occurrence happening exactly now', () => {
    const from = new Date('2026-09-10T05:05:00Z');
    const at = nextOccurrence(schedule('FREQ=WEEKLY;BYDAY=TH;BYHOUR=5;BYMINUTE=5'), from);

    expect(at?.toISOString()).toBe('2026-09-10T05:05:00.000Z');
  });
});

describe('upcoming', () => {
  it('sorts every station\'s slots together, soonest first', () => {
    const from = new Date('2026-09-10T00:00:00Z');
    const stations = [
      station('LATE', [schedule('FREQ=WEEKLY;BYDAY=TH;BYHOUR=20;BYMINUTE=0')]),
      station('EARLY', [schedule('FREQ=WEEKLY;BYDAY=TH;BYHOUR=6;BYMINUTE=0')]),
      station('MIDDLE', [schedule('FREQ=WEEKLY;BYDAY=TH;BYHOUR=12;BYMINUTE=0')]),
    ];

    expect(upcoming(stations, from).map((row) => row.station.enigmaId)).toEqual([
      'EARLY',
      'MIDDLE',
      'LATE',
    ]);
  });

  it('honours the limit', () => {
    const from = new Date('2026-09-10T00:00:00Z');
    const slots = [3, 6, 9, 12, 15].map((hour) =>
      schedule(`FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=${hour};BYMINUTE=0`),
    );

    expect(upcoming([station('MANY', slots)], from, 2)).toHaveLength(2);
  });

  it('returns nothing for a station with no imported schedule', () => {
    expect(upcoming([station('NONE', [])], new Date())).toEqual([]);
  });
});

describe('countdown', () => {
  const now = new Date('2026-09-10T00:00:00Z');
  const at = (ms: number) => new Date(now.getTime() + ms);

  it('says now inside the first minute', () => {
    expect(countdown(at(0), now)).toBe('now');
    expect(countdown(at(59_000), now)).toBe('now');
  });

  it('counts minutes under an hour', () => {
    expect(countdown(at(42 * 60_000), now)).toBe('in 42 m');
  });

  it('counts hours and minutes under a day', () => {
    expect(countdown(at(3 * 3_600_000 + 12 * 60_000), now)).toBe('in 3 h 12 m');
  });

  it('drops to days and hours beyond a day', () => {
    expect(countdown(at(26 * 3_600_000), now)).toBe('in 1 d 2 h');
  });
});

describe('formatUtc', () => {
  it('labels the weekday and time in UTC, not local', () => {
    expect(formatUtc(new Date('2026-09-14T03:15:00Z'))).toBe('Mon 03:15 UTC');
  });
});
