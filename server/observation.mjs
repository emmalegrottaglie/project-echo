/**
 * What an observation is allowed to be.
 *
 * `/api/observations` takes writes without authentication — that is a deliberate choice
 * for a server that binds loopback by default — so this check is the whole trust
 * boundary, and it is kept apart from storage because it is the part that has to be
 * right rather than the part that has to be fast.
 *
 * SQLite will not do it for us. A column with REAL affinity stores a string that does
 * not look like a number unchanged, so `khz: "<img src=x onerror=...>"` was written
 * verbatim and handed back to a client that interpolated it into the page. Types are the
 * only thing between an arbitrary caller and the rendered archive.
 */

/** A rejected write. Carries the status the route should answer with. */
export class InvalidObservation extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidObservation';
    this.status = 400;
  }
}

/** Notes are the only free-text field, and the request body cap is not a field cap. */
const MAX_TEXT = 500;

/** A finite number, or null. Anything else is a caller sending the wrong thing. */
function number(value, field) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidObservation(`${field} must be a finite number`);
  }
  return value;
}

function text(value, field, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new InvalidObservation(`${field} is required`);
    return null;
  }
  if (typeof value !== 'string') throw new InvalidObservation(`${field} must be a string`);

  const trimmed = value.trim();
  if (required && trimmed === '') throw new InvalidObservation(`${field} is required`);
  if (trimmed.length > MAX_TEXT) {
    throw new InvalidObservation(`${field} is longer than ${MAX_TEXT} characters`);
  }
  return trimmed === '' ? null : trimmed;
}

/**
 * The validated row, or a thrown `InvalidObservation`.
 *
 * Timestamps are parsed rather than pattern-matched and re-emitted in ISO form, so what
 * reaches the table is a date this process produced.
 */
export function validateObservation(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new InvalidObservation('expected an observation object');
  }

  const heardAt = input.heardAt ?? null;
  let when = new Date();
  if (heardAt !== null) {
    if (typeof heardAt !== 'string' || Number.isNaN(Date.parse(heardAt))) {
      throw new InvalidObservation('heardAt must be an ISO date string');
    }
    when = new Date(heardAt);
  }

  return {
    stationId: text(input.stationId, 'stationId', { required: true }),
    heardAt: when.toISOString(),
    khz: number(input.khz, 'khz'),
    receiver: text(input.receiver, 'receiver'),
    periodSec: number(input.periodSec, 'periodSec'),
    consistency: number(input.consistency, 'consistency'),
    notes: text(input.notes, 'notes'),
  };
}
