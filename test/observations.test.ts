import { describe, expect, it } from 'vitest';
import { InvalidObservation, validateObservation } from '../server/observation.mjs';
import { observationsHtml } from '../src/views/stations';
import type { Observation } from '../src/api';

/**
 * The observation endpoint is the one place this project accepts a write from outside,
 * and it takes it without authentication. These tests are the two halves of that trust
 * boundary: what the server refuses to store, and what the client refuses to render.
 *
 * The attack they encode was real. `khz` is a REAL column, and SQLite stores a string
 * that does not look like a number in one unchanged — so a crafted value survived the
 * round trip and reached an `innerHTML` that interpolated it directly. Any page the user
 * visited could write it, because the API answered every origin.
 */

const PAYLOAD = '<img src=x onerror=alert(document.domain)>';

describe('what the server will store', () => {
  it('accepts a well-formed hearing, and stamps the time itself', () => {
    const row = validateObservation({ stationId: 'S28', khz: 4625, periodSec: 3.4 });
    expect(row.stationId).toBe('S28');
    expect(row.khz).toBe(4625);
    expect(Number.isNaN(Date.parse(row.heardAt))).toBe(false);
  });

  it('refuses a measurement that is not a number', () => {
    expect(() => validateObservation({ stationId: 'S28', khz: PAYLOAD })).toThrow(InvalidObservation);
    expect(() => validateObservation({ stationId: 'S28', periodSec: 'nope' })).toThrow(
      InvalidObservation,
    );
    expect(() => validateObservation({ stationId: 'S28', khz: Number.NaN })).toThrow(
      InvalidObservation,
    );
  });

  it('refuses a hearing with no station', () => {
    expect(() => validateObservation({})).toThrow(InvalidObservation);
    expect(() => validateObservation({ stationId: '   ' })).toThrow(InvalidObservation);
    expect(() => validateObservation({ stationId: 42 })).toThrow(InvalidObservation);
  });

  it('refuses a timestamp that is not a date', () => {
    expect(() => validateObservation({ stationId: 'S28', heardAt: 'whenever' })).toThrow(
      InvalidObservation,
    );
  });

  it('refuses a body that is not an object', () => {
    expect(() => validateObservation('S28')).toThrow(InvalidObservation);
    expect(() => validateObservation([{ stationId: 'S28' }])).toThrow(InvalidObservation);
  });

  it('answers 400 rather than 500, so the caller can tell it was their input', () => {
    try {
      validateObservation({ stationId: 'S28', khz: PAYLOAD });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as { status?: number }).status).toBe(400);
    }
  });

  /** Notes are free text and the only unbounded field; the body cap is not a field cap. */
  it('refuses a note longer than the column is meant to hold', () => {
    expect(() => validateObservation({ stationId: 'S28', notes: 'x'.repeat(501) })).toThrow(
      InvalidObservation,
    );
  });
});

describe('what the client will render', () => {
  function observation(overrides: Partial<Observation> = {}): Observation {
    return {
      id: 1,
      stationId: 'S28',
      heardAt: '2026-09-13T08:00:00.000Z',
      khz: 4625,
      receiver: null,
      periodSec: 3.4,
      consistency: 0.92,
      notes: null,
      ...overrides,
    };
  }

  it('shows a hearing', () => {
    const html = observationsHtml([observation()]);
    expect(html).toContain('4625');
    expect(html).toContain('3.40 s');
    expect(html).toContain('92%');
  });

  /**
   * Defence in depth: the server now refuses this, but the client is also handed rows
   * written before the validation existed, and by any other client pointed at the same
   * database.
   */
  it('renders nothing for a measurement that is not a number', () => {
    const html = observationsHtml([
      observation({ khz: PAYLOAD as unknown as number, periodSec: PAYLOAD as unknown as number }),
    ]);
    expect(html).not.toContain('<img');
    expect(html).not.toContain('onerror');
  });

  it('does not throw on a measurement that is not a number', () => {
    expect(() =>
      observationsHtml([observation({ periodSec: 'nope' as unknown as number })]),
    ).not.toThrow();
  });

  it('renders nothing for a measurement that is not finite', () => {
    const html = observationsHtml([observation({ khz: Number.NaN, consistency: Infinity })]);
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });
});
