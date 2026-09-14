import { describeScheduleKhz, nextOccurrence } from './schedule';
import type { Schedule, Station } from './types';
import { LEAD_MS, slotKey, subscriptions } from './alerts';

/**
 * Where an alert actually comes from.
 *
 * Two deliveries, and they are not the same product:
 *
 * - **`native`** hands the whole schedule to Android before anything happens, so an
 *   alert arrives with the app closed and the phone in a pocket. That is what a reminder
 *   for a transmission window a few times a week has to do to be worth having.
 * - **`web`** is the `Notification` API, which only fires while a tab is open. Fine on a
 *   desktop that is already showing the app; useless as a reminder.
 *
 * The packaged Android app used to report `none` and mean it: its WebView ships no
 * Notification API at all, so every switch in the schedule was arming something that
 * could never fire. This module is why that is no longer true.
 *
 * The plugin is imported lazily. It is the only native dependency in the project, and a
 * browser must never pay for it — nor fail to start because of it.
 */

export type Delivery = 'native' | 'web' | 'none';

/**
 * How many notifications to hand the OS at once.
 *
 * Android keeps a bounded number of pending alarms per app and drops the excess without
 * saying which. With 186 slots in the roster a naive "schedule everything" would sail
 * past that limit, so this takes the soonest few and tops up whenever the app is opened
 * or a switch is flipped.
 */
const MAX_PENDING = 48;

/** How many occurrences of a single slot to schedule ahead. */
const PER_SLOT = 2;

let plugin: typeof import('@capacitor/local-notifications').LocalNotifications | null = null;
let looked = false;

/** The plugin, or null in a browser. Resolved once. */
async function local(): Promise<
  typeof import('@capacitor/local-notifications').LocalNotifications | null
> {
  if (looked) return plugin;
  looked = true;

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;
    const module = await import('@capacitor/local-notifications');
    plugin = module.LocalNotifications;
  } catch {
    plugin = null;
  }
  return plugin;
}

export async function delivery(): Promise<Delivery> {
  if (await local()) return 'native';
  return 'Notification' in globalThis ? 'web' : 'none';
}

/** Asks for permission on whichever delivery this platform has. */
export async function ensurePermission(): Promise<boolean> {
  const native = await local();

  if (native) {
    const status = await native.checkPermissions();
    if (status.display === 'granted') return true;
    if (status.display === 'denied') return false;
    return (await native.requestPermissions()).display === 'granted';
  }

  if (!('Notification' in globalThis)) return false;
  if (Notification.permission !== 'default') return Notification.permission === 'granted';
  return (await Notification.requestPermission()) === 'granted';
}

export async function granted(): Promise<boolean> {
  const native = await local();
  if (native) return (await native.checkPermissions()).display === 'granted';
  return 'Notification' in globalThis && Notification.permission === 'granted';
}

/**
 * A stable 31-bit id for one occurrence of one slot.
 *
 * Android identifies a pending notification by an integer, so cancelling needs the same
 * number the scheduling used. Derived from the slot and the instant rather than counted,
 * so two runs over the same schedule produce the same ids and rescheduling replaces
 * rather than duplicates.
 */
export function notificationId(key: string, at: Date): number {
  const text = `${key}@${at.toISOString()}`;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 2_147_483_647;
}

export interface PlannedAlert {
  id: number;
  title: string;
  body: string;
  at: Date;
}

/**
 * What should be sitting in Android's alarm table right now.
 *
 * Pure, and exported for that reason: the scheduling itself cannot be tested without a
 * device, but which windows are chosen and what they say can be.
 */
export function plan(stations: readonly Station[], now: Date): PlannedAlert[] {
  const subscribed = subscriptions();
  if (subscribed.size === 0) return [];

  const planned: PlannedAlert[] = [];

  for (const station of stations) {
    for (const schedule of station.schedules) {
      const key = slotKey(station, schedule);
      if (!subscribed.has(key)) continue;

      let cursor = now;
      for (let index = 0; index < PER_SLOT; index += 1) {
        const at = nextOccurrence(schedule, cursor);
        if (!at) break;

        const fireAt = new Date(at.getTime() - LEAD_MS);
        // A window already inside its lead time cannot be scheduled ahead of itself.
        if (fireAt.getTime() > now.getTime()) {
          planned.push({
            id: notificationId(key, at),
            title: `${station.enigmaId} ${station.name}`,
            body: alertBody(schedule, at),
            at: fireAt,
          });
        }
        cursor = new Date(at.getTime() + 60_000);
      }
    }
  }

  // Soonest first, then capped: the ones nearest in time are the ones worth the alarm
  // slots, and the rest are picked up the next time the app is opened.
  return planned.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_PENDING);
}

function alertBody(schedule: Schedule, at: Date): string {
  const minutes = Math.max(1, Math.round(LEAD_MS / 60_000));
  return (
    `Window opens in ${minutes} min — ${describeScheduleKhz(schedule, at)}` +
    (schedule.note ? `. ${schedule.note}` : '')
  );
}

/**
 * Replaces everything this app has pending with the current plan.
 *
 * Cancel-then-schedule rather than a diff: the whole set is small, the ids are derived
 * so an unchanged alert keeps its own, and reconciling by hand would be a second source
 * of truth about what the OS is holding.
 *
 * Returns how many alerts are now pending, or null where the platform schedules nothing.
 */
export function sync(stations: readonly Station[], now?: Date): Promise<number | null> {
  // Serialised. Every call cancels what is pending and schedules the current plan, so
  // two overlapping runs interleave as cancel, cancel, schedule(A), schedule(B) — and
  // A's alarms for a slot switched off in B survive, because ids are derived and
  // scheduling one does not remove another. Running them in turn means the later
  // cancel always wipes the earlier plan.
  // `now` is read when the run starts, not when it was queued: a plan built from a
  // stale clock could schedule a window that has already passed, which Android fires
  // on the spot.
  queue = queue.then(() => run(stations, now ?? new Date())).catch(() => null);
  return queue;
}

let queue: Promise<number | null> = Promise.resolve(null);

async function run(stations: readonly Station[], now: Date): Promise<number | null> {
  const native = await local();
  if (!native) return null;
  if (!(await granted())) return null;

  const pending = await native.getPending();
  if (pending.notifications.length > 0) {
    await native.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) });
  }

  const wanted = plan(stations, now);
  if (wanted.length === 0) return 0;

  await native.schedule({
    notifications: wanted.map((alert) => ({
      id: alert.id,
      title: alert.title,
      body: alert.body,
      schedule: { at: alert.at, allowWhileIdle: true },
    })),
  });

  return wanted.length;
}
