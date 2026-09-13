import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { validateObservation } from './observation.mjs';

/**
 * Observation storage.
 *
 * docs/PLAN.md §3 sketches four tables. Only `observation` is created here: stations,
 * frequencies and schedules are a typed fixture compiled into the client, and creating
 * empty tables that nothing reads or writes would be scaffolding for its own sake.
 *
 * `node:sqlite` is the standard library as of Node 22.5, so this adds no dependency. It
 * still prints an ExperimentalWarning, which is the whole cost.
 *
 * An observation records that a marker was heard, when, on what frequency, through which
 * receiver, and at what measured period. It never records content — that boundary is
 * docs/RESEARCH.md §5.
 */

let db = null;

export function open(path = 'server/data/echo.sqlite') {
  if (db) return db;

  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);

  db.exec(`
    CREATE TABLE IF NOT EXISTS observation (
      id            INTEGER PRIMARY KEY,
      station_id    TEXT    NOT NULL,
      heard_at      TEXT    NOT NULL,
      khz           REAL,
      receiver      TEXT,
      period_sec    REAL,
      consistency   REAL,
      marker_only   INTEGER NOT NULL DEFAULT 1,
      notes         TEXT
    );

    CREATE INDEX IF NOT EXISTS observation_station_heard
      ON observation (station_id, heard_at DESC);
  `);

  return db;
}

/**
 * Records one hearing.
 *
 * Detections repeat every second while a marker is up, so a hearing for the same
 * station and receiver inside `dedupeMinutes` updates the existing row instead of
 * adding another. Without that the table becomes a log of the polling interval rather
 * than a log of transmissions.
 *
 * Throws `InvalidObservation` for anything malformed rather than storing it: this is an
 * unauthenticated endpoint, so the validation is the trust boundary.
 */
export function recordObservation(raw, dedupeMinutes = 10) {
  const database = open();
  const input = validateObservation(raw);
  const heardAt = input.heardAt;
  const since = new Date(Date.now() - dedupeMinutes * 60_000).toISOString();

  const existing = database
    .prepare(
      `SELECT id FROM observation
        WHERE station_id = ? AND IFNULL(receiver, '') = IFNULL(?, '') AND heard_at >= ?
        ORDER BY heard_at DESC LIMIT 1`,
    )
    .get(input.stationId, input.receiver, since);

  if (existing) {
    database
      .prepare(
        `UPDATE observation
            SET heard_at = ?, khz = ?, period_sec = ?, consistency = ?, notes = ?
          WHERE id = ?`,
      )
      .run(heardAt, input.khz, input.periodSec, input.consistency, input.notes, existing.id);
    return { id: existing.id, updated: true };
  }

  const result = database
    .prepare(
      `INSERT INTO observation
         (station_id, heard_at, khz, receiver, period_sec, consistency, marker_only, notes)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    )
    .run(
      input.stationId,
      heardAt,
      input.khz,
      input.receiver,
      input.periodSec,
      input.consistency,
      input.notes,
    );

  return { id: Number(result.lastInsertRowid), updated: false };
}

export function listObservations({ stationId, limit = 50 } = {}) {
  const database = open();
  const capped = Math.min(Math.max(Number(limit) || 50, 1), 500);

  const rows = stationId
    ? database
        .prepare(
          `SELECT * FROM observation WHERE station_id = ? ORDER BY heard_at DESC LIMIT ?`,
        )
        .all(stationId, capped)
    : database
        .prepare(`SELECT * FROM observation ORDER BY heard_at DESC LIMIT ?`)
        .all(capped);

  return rows.map((row) => ({
    id: row.id,
    stationId: row.station_id,
    heardAt: row.heard_at,
    khz: row.khz,
    receiver: row.receiver,
    periodSec: row.period_sec,
    consistency: row.consistency,
    notes: row.notes,
  }));
}
