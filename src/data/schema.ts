/**
 * Validation for the station dataset.
 *
 * The roster used to be a TypeScript fixture compiled into the bundle, which meant the
 * compiler was the only gate it needed. It is now `data/stations.json`, read at build
 * time *and* fetched from the server at runtime, so two things changed:
 *
 * 1. The provenance rule of docs/PLAN.md §3 is no longer enforced by anything the
 *    compiler can see. A frequency with no `sourceUrl` is a valid object literal. It is
 *    enforced here instead, and `test/stations.test.ts` runs this over the committed
 *    file so a bad edit fails CI rather than shipping.
 * 2. Station data crosses a trust boundary. Several views interpolate `sourceUrl` and
 *    `sourceUrls` straight into an `href`, so a dataset carrying `javascript:` — or a
 *    quote, to break out of the attribute — would be script execution. Every URL is
 *    therefore checked for an http or https scheme here, and escaped again at the point
 *    of use by `safeUrl` in src/ui.ts. Either one alone would do; both is deliberate,
 *    because this file also guards the copy fetched over the network.
 */

import type { Frequency, Schedule, Station, Tier } from '../types';
import { isSafeUrl } from '../url';

/**
 * Bumped only for a change that an older client cannot read. A client that sees a
 * version it does not know keeps its bundled copy rather than guessing — which is what
 * makes it safe for the server to serve new data to an installed APK.
 */
export const SCHEMA_VERSION = 1;

export type ValidationResult =
  | { ok: true; stations: Station[] }
  | { ok: false; errors: string[] };

const TIERS: readonly Tier[] = ['live', 'scheduled', 'historical'];
const TIME_OF_DAY = ['day', 'night'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkStrings(value: unknown, where: string, errors: string[]): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    errors.push(`${where}: expected an array of strings`);
    return [];
  }
  return value as string[];
}

function checkFrequency(value: unknown, where: string, errors: string[]): Frequency | null {
  if (!isRecord(value)) {
    errors.push(`${where}: expected an object`);
    return null;
  }
  const before = errors.length;

  if (typeof value.khz !== 'number' || !Number.isFinite(value.khz) || value.khz <= 0) {
    errors.push(`${where}.khz: expected a positive number`);
  }
  if (typeof value.mode !== 'string' || value.mode === '') {
    errors.push(`${where}.mode: expected a non-empty string`);
  }
  if (value.timeOfDay !== null && !TIME_OF_DAY.includes(value.timeOfDay as string)) {
    errors.push(`${where}.timeOfDay: expected 'day', 'night' or null`);
  }
  if (typeof value.lastConfirmed !== 'string' || !ISO_DATE.test(value.lastConfirmed)) {
    errors.push(`${where}.lastConfirmed: expected an ISO date (YYYY-MM-DD)`);
  }
  // The provenance rule: a frequency with no source is not a frequency.
  if (!isSafeUrl(value.sourceUrl)) {
    errors.push(`${where}.sourceUrl: expected an http or https URL`);
  }
  if (typeof value.disputed !== 'boolean') {
    errors.push(`${where}.disputed: expected a boolean`);
  }

  return errors.length === before ? (value as unknown as Frequency) : null;
}

function checkSchedule(value: unknown, where: string, errors: string[]): Schedule | null {
  if (!isRecord(value)) {
    errors.push(`${where}: expected an object`);
    return null;
  }
  const before = errors.length;

  if (typeof value.rrule !== 'string' || value.rrule === '') {
    errors.push(`${where}.rrule: expected a non-empty RRULE string`);
  }
  if (value.khz !== null && (typeof value.khz !== 'number' || !Number.isFinite(value.khz))) {
    errors.push(`${where}.khz: expected a number or null`);
  }
  if (value.note !== null && typeof value.note !== 'string') {
    errors.push(`${where}.note: expected a string or null`);
  }
  if (!isSafeUrl(value.sourceUrl)) {
    errors.push(`${where}.sourceUrl: expected an http or https URL`);
  }

  return errors.length === before ? (value as unknown as Schedule) : null;
}

function checkStation(value: unknown, where: string, errors: string[]): Station | null {
  if (!isRecord(value)) {
    errors.push(`${where}: expected an object`);
    return null;
  }
  const before = errors.length;
  const id = typeof value.enigmaId === 'string' ? value.enigmaId : where;

  if (typeof value.enigmaId !== 'string' || value.enigmaId === '') {
    errors.push(`${where}.enigmaId: expected a non-empty string`);
  }
  for (const field of ['name', 'language', 'operator'] as const) {
    if (typeof value[field] !== 'string' || value[field] === '') {
      errors.push(`${id}.${field}: expected a non-empty string`);
    }
  }
  if (!TIERS.includes(value.tier as Tier)) {
    errors.push(`${id}.tier: expected one of ${TIERS.join(', ')}`);
  }
  if (value.marker !== null && typeof value.marker !== 'string') {
    errors.push(`${id}.marker: expected a string or null`);
  }
  if (
    value.markerPeriodSec !== null &&
    (typeof value.markerPeriodSec !== 'number' || !(value.markerPeriodSec > 0))
  ) {
    errors.push(`${id}.markerPeriodSec: expected a positive number or null`);
  }
  if (value.lastConfirmed !== null && !ISO_DATE.test(String(value.lastConfirmed))) {
    errors.push(`${id}.lastConfirmed: expected an ISO date (YYYY-MM-DD) or null`);
  }
  if (value.lore !== null && typeof value.lore !== 'string') {
    errors.push(`${id}.lore: expected a string or null`);
  }

  checkStrings(value.aliases, `${id}.aliases`, errors);

  const sourceUrls = checkStrings(value.sourceUrls, `${id}.sourceUrls`, errors);
  if (sourceUrls.length === 0) {
    errors.push(`${id}.sourceUrls: every station cites at least one source`);
  }
  sourceUrls.forEach((url, index) => {
    if (!isSafeUrl(url)) errors.push(`${id}.sourceUrls[${index}]: expected an http or https URL`);
  });

  if (!Array.isArray(value.frequencies)) {
    errors.push(`${id}.frequencies: expected an array`);
  } else {
    value.frequencies.forEach((item, index) =>
      checkFrequency(item, `${id}.frequencies[${index}]`, errors),
    );
  }

  if (!Array.isArray(value.schedules)) {
    errors.push(`${id}.schedules: expected an array`);
  } else {
    value.schedules.forEach((item, index) =>
      checkSchedule(item, `${id}.schedules[${index}]`, errors),
    );
  }

  return errors.length === before ? (value as unknown as Station) : null;
}

/**
 * Validates a whole dataset — the envelope, then every station.
 *
 * Collects every error rather than throwing on the first, because the caller that
 * matters most is a CI run telling a contributor what to fix.
 */
export function validateStationData(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ['expected an object with schemaVersion and stations'] };
  }
  if (input.schemaVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [`schemaVersion: expected ${SCHEMA_VERSION}, got ${String(input.schemaVersion)}`],
    };
  }
  if (!Array.isArray(input.stations) || input.stations.length === 0) {
    return { ok: false, errors: ['stations: expected a non-empty array'] };
  }

  const stations: Station[] = [];
  const seen = new Set<string>();

  input.stations.forEach((item, index) => {
    const station = checkStation(item, `stations[${index}]`, errors);
    if (!station) return;
    if (seen.has(station.enigmaId)) {
      errors.push(`${station.enigmaId}: duplicate designator`);
      return;
    }
    seen.add(station.enigmaId);
    stations.push(station);
  });

  return errors.length === 0 ? { ok: true, stations } : { ok: false, errors };
}
