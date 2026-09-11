import { describeScheduleKhz, nextOccurrence } from './schedule';
import type { Schedule, Station } from './types';

/**
 * Schedule alerts.
 *
 * A transmission window is a few minutes long and a few times a week, so the useful
 * product is a reminder shortly beforehand — the reason the scheduled tier gets alerts
 * instead of a live view.
 *
 * State lives in `localStorage`, so alerts are per-browser and only fire while a tab is
 * open. The fix would be a service worker, which this app cannot have: it must be
 * served over plain http to reach `ws://` receivers. The UI says so rather than letting
 * the user assume otherwise.
 */

const SUBSCRIPTIONS_KEY = 'echo.alerts';
const FIRED_KEY = 'echo.alerts.fired';

/** How far ahead of a window to notify. */
export const LEAD_MS = 10 * 60 * 1000;

/** How often the shell re-checks. Windows are minutes long, so this is ample. */
export const POLL_MS = 30_000;

/** Identifies one slot of one station, stable across reloads. */
export function slotKey(station: Station, schedule: Schedule): string {
  return `${station.enigmaId}|${schedule.rrule}`;
}

function readSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    // The removal is itself guarded: if storage threw on the read, it throws here too.
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clean up that we can reach.
    }
    return new Set();
  }
}

function writeSet(key: string, value: Set<string>): void {
  // Guarded for the same reason as the receiver list: `checkDue` runs from the app
  // shell on load, so a storage-blocked browser would take the whole app down before a
  // view ever mounted.
  try {
    localStorage.setItem(key, JSON.stringify([...value]));
  } catch {
    // Subscriptions will not survive this session. The alert still fires.
  }
}

export function subscriptions(): Set<string> {
  return readSet(SUBSCRIPTIONS_KEY);
}

export function isSubscribed(key: string): boolean {
  return subscriptions().has(key);
}

/** Returns the new subscription state. */
export function toggleSubscription(key: string): boolean {
  const current = subscriptions();
  const next = !current.has(key);
  if (next) current.add(key);
  else current.delete(key);
  writeSet(SUBSCRIPTIONS_KEY, current);
  return next;
}

/**
 * Asks for notification permission. Must be called from a user gesture — browsers
 * reject the prompt otherwise, and a silently denied request looks exactly like
 * working alerts that never arrive.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in globalThis)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function permission(): NotificationPermission | 'unsupported' {
  return 'Notification' in globalThis ? Notification.permission : 'unsupported';
}

/**
 * Notifies for any subscribed slot whose next occurrence falls inside the lead window.
 *
 * Fired occurrences are recorded per occurrence rather than per slot, so next week's
 * instance of a weekly slot still fires while this week's does not fire twice.
 * Returns the number of notifications raised.
 */
export function checkDue(stations: Station[], now = new Date()): number {
  if (permission() !== 'granted') return 0;

  const subscribed = subscriptions();
  if (subscribed.size === 0) return 0;

  const fired = readSet(FIRED_KEY);
  let raised = 0;

  for (const station of stations) {
    for (const schedule of station.schedules) {
      const key = slotKey(station, schedule);
      if (!subscribed.has(key)) continue;

      const at = nextOccurrence(schedule, now);
      if (!at) continue;

      const lead = at.getTime() - now.getTime();
      if (lead < 0 || lead > LEAD_MS) continue;

      const stamp = `${key}@${at.toISOString()}`;
      if (fired.has(stamp)) continue;

      const minutes = Math.max(1, Math.round(lead / 60_000));
      new Notification(`${station.enigmaId} ${station.name}`, {
        body:
          `Window opens in ${minutes} min` +
          ` — ${describeScheduleKhz(schedule, at)}` +
          (schedule.note ? `. ${schedule.note}` : ''),
        tag: stamp,
      });

      fired.add(stamp);
      raised++;
    }
  }

  if (raised > 0) {
    // Keep the fired log from growing without bound. Anything already in the past is
    // no longer needed to suppress a duplicate.
    const pruned = new Set(
      [...fired].filter((stamp) => {
        const iso = stamp.split('@')[1];
        return iso ? new Date(iso).getTime() > now.getTime() - LEAD_MS : false;
      }),
    );
    writeSet(FIRED_KEY, pruned);
  }

  return raised;
}
