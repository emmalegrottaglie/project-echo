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
