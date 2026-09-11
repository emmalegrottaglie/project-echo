import { describe, expect, it } from 'vitest';
import {
  countdown,
  currentPeriod,
  formatUtc,
  isOffHours,
  nextOccurrence,
  scheduleKhz,
  upcoming,
} from '../src/schedule';
import type { Schedule, Station } from '../src/types';

/**
 * Schedules are published in UTC and evaluated in UTC; only the formatting layer
 * localises. Converting before comparison is how off-by-an-hour bugs get in, so these
 * tests all assert against UTC instants.
 */

function schedule(rrule: string, khz: number | null = null): Schedule {
  return {
    rrule,
    khzByMonth: Array.from({ length: 12 }, () => khz),
    note: null,
    sourceUrl: 'https://example.test',
  };
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

/**
 * Day/night frequency pairs. The Pip publishes 5448 kHz by day and 3756 kHz by night,
 * and picking the wrong one is a silent failure: the band is simply empty.
 */
describe('currentPeriod', () => {
  const at = (iso: string): Date => new Date(iso);

  it('calls 06:00 to 18:00 UTC day', () => {
    expect(currentPeriod(at('2026-09-11T06:00:00Z'))).toBe('day');
    expect(currentPeriod(at('2026-09-11T11:45:00Z'))).toBe('day');
    expect(currentPeriod(at('2026-09-11T17:59:00Z'))).toBe('day');
  });

  it('calls the rest night', () => {
    expect(currentPeriod(at('2026-09-11T18:00:00Z'))).toBe('night');
    expect(currentPeriod(at('2026-09-11T23:30:00Z'))).toBe('night');
    expect(currentPeriod(at('2026-09-11T05:59:00Z'))).toBe('night');
  });

  it('reads UTC, not the machine timezone', () => {
    // 01:00 UTC is the previous evening in the Americas and mid-morning in Asia. The
    // published pairs are UTC, so neither local reading may change the answer.
    expect(currentPeriod(at('2026-09-11T01:00:00Z'))).toBe('night');
  });

  it('flags the frequency that is not the current half of a pair', () => {
    const noon = at('2026-09-11T11:45:00Z');
    expect(isOffHours('night', noon)).toBe(true);
    expect(isOffHours('day', noon)).toBe(false);
  });

  it('never flags a frequency that does not move', () => {
    // The Buzzer's 4625 kHz has no period and is on around the clock.
    expect(isOffHours(null, at('2026-09-11T11:45:00Z'))).toBe(false);
    expect(isOffHours(null, at('2026-09-11T23:45:00Z'))).toBe(false);
  });
});

/**
 * Monthly frequency rotation. These schedules publish a different frequency for each
 * part of the year, and the frequency that matters for a window three weeks out is the
 * one for *that* window's month, not for today.
 */
describe('scheduleKhz', () => {
  const rotating = (): Schedule => ({
    rrule: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=3;BYMINUTE=15',
    // E11's 03:15 slot, as published: Jan-Feb 8102, Mar-Apr 12630, May-Aug 16530,
    // Sep-Oct 12630, Nov-Dec 8102.
    khzByMonth: [8102, 8102, 12630, 12630, 16530, 16530, 16530, 16530, 12630, 12630, 8102, 8102],
    note: null,
    sourceUrl: 'https://example.test',
  });

  it('reads the month the occurrence falls in', () => {
    expect(scheduleKhz(rotating(), new Date('2026-01-05T03:15:00Z'))).toBe(8102);
    expect(scheduleKhz(rotating(), new Date('2026-05-04T03:15:00Z'))).toBe(16530);
    expect(scheduleKhz(rotating(), new Date('2026-12-07T03:15:00Z'))).toBe(8102);
  });

  it('reads UTC months, so a window near midnight does not shift a month', () => {
    // 23:30 on 31 January is already February for anyone east of UTC.
    expect(scheduleKhz(rotating(), new Date('2026-01-31T23:30:00Z'))).toBe(8102);
  });

  it('is null for a month the source publishes nothing for', () => {
    const summerOnly: Schedule = {
      rrule: 'FREQ=WEEKLY;BYDAY=SU;BYHOUR=7;BYMINUTE=0',
      khzByMonth: [null, null, null, null, 14469, 13927, 13978, 13408, null, null, null, null],
      note: null,
      sourceUrl: 'https://example.test',
    };
    expect(scheduleKhz(summerOnly, new Date('2026-06-07T07:00:00Z'))).toBe(13927);
    expect(scheduleKhz(summerOnly, new Date('2026-01-04T07:00:00Z'))).toBeNull();
  });
});
