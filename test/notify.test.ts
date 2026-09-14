import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationId, plan } from '../src/notify';
import { LEAD_MS, slotKey, toggleSubscription } from '../src/alerts';
import type { Schedule, Station } from '../src/types';

/**
 * Which alerts get handed to Android, and what they say.
 *
 * The handover itself needs a device, so it is not what these test. What can be pinned
 * here is the part that decides the phone's behaviour for the next several days: which
 * windows are chosen, how many, and whether the ids stay put — an id that drifted
 * between runs would leave the previous alarm uncancellable and the reader would get
 * every reminder twice.
 */

function schedule(rrule: string): Schedule {
  return {
    rrule,
    khzByMonth: Array.from({ length: 12 }, () => 4625),
    lastConfirmed: '2026-09-11',
    note: null,
    sourceUrl: 'https://example.org/',
  };
}

function station(enigmaId: string, schedules: Schedule[]): Station {
  return {
    enigmaId,
    name: 'Test',
    aliases: [],
    language: 'English voice',
    operator: 'Nobody',
    tier: 'scheduled',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: null,
    lore: null,
    frequencies: [],
    schedules,
    sites: [],
    activeFrom: null,
    activeUntil: null,
    sourceUrls: ['https://example.org/'],
  };
}

const daily = schedule('FREQ=DAILY;BYHOUR=12;BYMINUTE=0');
const subject = station('E11', [daily]);
const now = new Date('2026-09-14T06:00:00Z');

/** A localStorage stand-in, so these tests need no DOM environment. */
const store = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
});

beforeEach(() => store.clear());

describe('what gets handed to the phone', () => {
  it('schedules nothing while nothing is subscribed', () => {
    expect(plan([subject], now)).toEqual([]);
  });

  it('schedules ahead of the window, not at it', () => {
    toggleSubscription(slotKey(subject, daily));
    const [first] = plan([subject], now);

    expect(first).toBeDefined();
    // 12:00 UTC minus the ten-minute lead.
    expect(first!.at.toISOString()).toBe('2026-09-14T11:50:00.000Z');
    expect(first!.title).toContain('E11');
    expect(first!.body).toContain('4625');
  });

  /** Two occurrences per slot, so a phone left alone still alerts tomorrow. */
  it('schedules more than the next one', () => {
    toggleSubscription(slotKey(subject, daily));
    const planned = plan([subject], now);

    expect(planned).toHaveLength(2);
    expect(planned[1]!.at.toISOString()).toBe('2026-09-15T11:50:00.000Z');
  });

  it('leaves out a window already inside its lead time', () => {
    toggleSubscription(slotKey(subject, daily));
    // Five minutes before the window: too late to schedule an alert ten minutes ahead.
    const late = plan([subject], new Date('2026-09-14T11:55:00Z'));

    expect(late.every((alert) => alert.at.getTime() > Date.parse('2026-09-14T11:55:00Z'))).toBe(
      true,
    );
    expect(late.some((alert) => alert.at.toISOString() === '2026-09-14T11:50:00.000Z')).toBe(false);
  });

  it('puts the soonest first, and caps what it asks the OS to hold', () => {
    const many = Array.from({ length: 40 }, (_, index) =>
      station(`E${index}`, [schedule(`FREQ=DAILY;BYHOUR=${index % 24};BYMINUTE=30`)]),
    );
    for (const each of many) toggleSubscription(slotKey(each, each.schedules[0]!));

    const planned = plan(many, now);

    expect(planned.length).toBeLessThanOrEqual(48);
    const times = planned.map((alert) => alert.at.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('ignores a station nobody subscribed to', () => {
    toggleSubscription(slotKey(subject, daily));
    const other = station('S28', [schedule('FREQ=DAILY;BYHOUR=3;BYMINUTE=0')]);

    expect(plan([subject, other], now).every((alert) => alert.title.includes('E11'))).toBe(true);
  });
});

describe('notification ids', () => {
  /** Cancelling uses the same number scheduling did, so it cannot be a counter. */
  it('is the same every time for the same slot and instant', () => {
    const at = new Date('2026-09-14T12:00:00Z');
    expect(notificationId('E11|rule', at)).toBe(notificationId('E11|rule', at));
  });

  it('differs across occurrences and across slots', () => {
    const first = new Date('2026-09-14T12:00:00Z');
    const second = new Date('2026-09-15T12:00:00Z');
    expect(notificationId('E11|rule', first)).not.toBe(notificationId('E11|rule', second));
    expect(notificationId('E11|rule', first)).not.toBe(notificationId('S28|rule', first));
  });

  it('stays inside the positive 32-bit range Android accepts', () => {
    for (let index = 0; index < 400; index += 1) {
      const id = notificationId(`S${index}|FREQ=DAILY;BYHOUR=${index % 24}`, new Date(index * 1e7));
      expect(Number.isSafeInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(2_147_483_647);
    }
  });
});

describe('the lead time', () => {
  it('is the same ten minutes the schedule view promises', () => {
    expect(LEAD_MS).toBe(10 * 60 * 1000);
  });
});
