import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Schedule, Station } from '../src/types';

/**
 * Alert subscriptions and the due check.
 *
 * The behaviour worth pinning is that `checkDue` fires once per occurrence and not
 * once per poll — the shell calls it every 30 seconds, so a per-slot rather than
 * per-occurrence guard would notify sixty times inside one lead window.
 */

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

const raised: string[] = [];

class FakeNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = async (): Promise<NotificationPermission> => 'granted';

  constructor(title: string) {
    raised.push(title);
  }
}

vi.stubGlobal('Notification', FakeNotification);

const { checkDue, isSubscribed, permission, slotKey, toggleSubscription } = await import(
  '../src/alerts'
);

/** A slot five minutes from `now`, inside the ten-minute lead window. */
function slotSoon(now: Date): Schedule {
  const soon = new Date(now.getTime() + 5 * 60_000);
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return {
    rrule: `FREQ=WEEKLY;BYDAY=${days[soon.getUTCDay()]};BYHOUR=${soon.getUTCHours()};BYMINUTE=${soon.getUTCMinutes()}`,
    khz: 8102,
    note: null,
    sourceUrl: 'https://example.test',
  };
}

function station(schedules: Schedule[]): Station {
  return {
    enigmaId: 'E11',
    name: 'Oblique',
    aliases: [],
    language: 'English voice',
    operator: 'Poland',
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

beforeEach(() => {
  store.clear();
  raised.length = 0;
  FakeNotification.permission = 'granted';
});

describe('subscriptions', () => {
  it('identifies a slot by station and rule, so it survives a reload', () => {
    const schedule = slotSoon(new Date());
    expect(slotKey(station([schedule]), schedule)).toBe(`E11|${schedule.rrule}`);
  });

  it('toggles on and off', () => {
    const key = 'E11|FREQ=WEEKLY;BYDAY=MO';

    expect(isSubscribed(key)).toBe(false);
    expect(toggleSubscription(key)).toBe(true);
    expect(isSubscribed(key)).toBe(true);
    expect(toggleSubscription(key)).toBe(false);
    expect(isSubscribed(key)).toBe(false);
  });
});

describe('checkDue', () => {
  it('notifies once for a window inside the lead time, not once per poll', () => {
    const now = new Date();
    const schedule = slotSoon(now);
    const subject = station([schedule]);
    toggleSubscription(slotKey(subject, schedule));

    expect(checkDue([subject], now)).toBe(1);
    // The shell polls every 30 seconds; the same occurrence must not fire again.
    expect(checkDue([subject], new Date(now.getTime() + 30_000))).toBe(0);
    expect(raised).toEqual(['E11 Oblique']);
  });

  it('ignores a window beyond the lead time', () => {
    const now = new Date();
    const far = new Date(now.getTime() + 4 * 24 * 3_600_000);
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const schedule: Schedule = {
      rrule: `FREQ=WEEKLY;BYDAY=${days[far.getUTCDay()]};BYHOUR=${far.getUTCHours()};BYMINUTE=0`,
      khz: null,
      note: null,
      sourceUrl: 'https://example.test',
    };
    const subject = station([schedule]);
    toggleSubscription(slotKey(subject, schedule));

    expect(checkDue([subject], now)).toBe(0);
  });

  it('does nothing for a slot nobody subscribed to', () => {
    const now = new Date();
    expect(checkDue([station([slotSoon(now)])], now)).toBe(0);
  });

  it('does nothing without permission', () => {
    const now = new Date();
    const schedule = slotSoon(now);
    const subject = station([schedule]);
    toggleSubscription(slotKey(subject, schedule));

    FakeNotification.permission = 'denied';
    expect(permission()).toBe('denied');
    expect(checkDue([subject], now)).toBe(0);
  });
});
