import { RRule } from 'rrule';
import type { Schedule, Station } from './types';

/**
 * Schedule evaluation.
 *
 * Transmission slots are weekday-and-UTC-time patterns, which is what RFC 5545 RRULE
 * describes, so the fixtures store RRULE strings and this module evaluates them rather
 * than the app inventing its own recurrence format. `rrule` is the one runtime
 * dependency: recurrence arithmetic across weekday sets and month boundaries is
 * exactly the kind of thing that is cheap to get subtly wrong by hand.
 *
 * Everything here works in UTC. Numbers station schedules are published in UTC and
 * converting them to local time before comparison is how off-by-an-hour bugs get in;
 * only the formatting layer localises.
 */

export interface Occurrence {
  station: Station;
  schedule: Schedule;
  at: Date;
}

/**
 * A fixed start for every rule.
 *
 * Without an explicit `dtstart`, `rrule` defaults it to the moment the rule is parsed,
 * which makes occurrences depend on the wall clock in two ways: they inherit the
 * current seconds, so a 06:00 window resolves to 06:00:37; and any occurrence earlier
 * in the day than "now" is treated as before the rule began, so it silently jumps a
 * week. Pinning the start makes an occurrence a function of the rule and the query
 * time alone.
 */
const RULE_EPOCH = new Date(Date.UTC(2020, 0, 1));

function parse(schedule: Schedule): RRule {
  return new RRule({
    ...RRule.parseString(`RRULE:${schedule.rrule}`),
    dtstart: RULE_EPOCH,
    bysecond: [0],
  });
}

/**
 * The frequency a slot runs on in the month `at` falls in.
 *
 * `at` is the occurrence's own date, not today's. A window three weeks out can be in
 * next month, and announcing this month's frequency for it would send a listener to an
 * empty channel — which is the failure this whole field exists to prevent.
 */
export function scheduleKhz(schedule: Schedule, at: Date): number | null {
  return schedule.khzByMonth[at.getUTCMonth()] ?? null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * How a slot's frequency should be described to someone about to tune to it.
 *
 * Never a bare number. These frequencies are not published by the operator — they are a
 * record of what listeners last reported, and the station moves faster than the record
 * follows. While this was being written, an XPA transmission was reported live on
 * 10237 kHz in a slot whose imported table gives no September frequency at all, and
 * 10237 appears nowhere in the dataset.
 *
 * So the frequency is a starting point and the wording says so, and a month the source
 * publishes nothing for says that rather than rendering an em dash that reads as a
 * rendering fault. Same discipline the archive already applies to activity status, which
 * is shown as "last confirmed 2020-09-01" and never as a bare Active badge.
 */
export function describeScheduleKhz(schedule: Schedule, at: Date): string {
  const khz = scheduleKhz(schedule, at);
  const month = MONTH_NAMES[at.getUTCMonth()] ?? '';
  return khz === null
    ? `no ${month} frequency published`
    : `${khz} kHz reported for ${month}`;
}

/** Next occurrence of one slot at or after `from`, or null if the rule is exhausted. */
export function nextOccurrence(schedule: Schedule, from: Date): Date | null {
  return parse(schedule).after(from, true);
}

/** Upcoming slots across every station, soonest first. */
export function upcoming(stations: Station[], from: Date, limit = 20): Occurrence[] {
  const found: Occurrence[] = [];

  for (const station of stations) {
    for (const schedule of station.schedules) {
      const at = nextOccurrence(schedule, from);
      if (at) found.push({ station, schedule, at });
    }
  }

  return found.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, limit);
}

/** 'in 3 h 12 m', or 'now' inside the first minute. */
export function countdown(at: Date, now: Date): string {
  const seconds = Math.floor((at.getTime() - now.getTime()) / 1000);
  if (seconds < 60) return 'now';

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `in ${days} d ${hours} h`;
  if (hours > 0) return `in ${hours} h ${minutes} m`;
  return `in ${minutes} m`;
}

export function formatUtc(at: Date): string {
  const hh = String(at.getUTCHours()).padStart(2, '0');
  const mm = String(at.getUTCMinutes()).padStart(2, '0');
  const day = at.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  return `${day} ${hh}:${mm} UTC`;
}

export function formatLocal(at: Date): string {
  return at.toLocaleString(undefined, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** A station's published day or night frequency pair. */
export type Period = 'day' | 'night';

/**
 * Which of a station's day/night frequencies is the one in use now.
 *
 * Coarse, and deliberately so. The published pairs — The Pip on 5448 kHz by day and
 * 3756 kHz by night — are the transmitter's own switch, and this app has neither the
 * transmitter's coordinates nor a sourced switching time, so a precise rule here would
 * be a station fact with no provenance. 06:00 to 18:00 UTC is an approximation, used
 * only to annotate a choice the user still makes: nothing is hidden or auto-tuned on
 * the strength of it, and a frequency outside its period is offered anyway.
 *
 * The failure this exists for: 3756 kHz selected at 11:45, which is the night
 * frequency, on a screen that said "night" without saying what time it was.
 */
export function currentPeriod(at: Date = new Date()): Period {
  const hour = at.getUTCHours();
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

/**
 * True when a frequency's published period is not the current one.
 *
 * A frequency with no period — The Buzzer's 4625 kHz, which never moves — is never
 * off-hours.
 */
export function isOffHours(timeOfDay: Period | null, at: Date = new Date()): boolean {
  return timeOfDay !== null && timeOfDay !== currentPeriod(at);
}
