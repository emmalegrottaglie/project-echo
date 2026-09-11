import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Serves the current station roster.
 *
 * The client ships with a copy of this file inlined at build time, so this endpoint is
 * an update channel rather than a dependency — it exists so a corrected frequency or a
 * station that went off the air reaches an installed APK without a release.
 *
 * Cached against the file's mtime rather than read once at startup: editing
 * `data/stations.json` and reloading is how a maintainer checks a correction, and a
 * server that needs restarting to show it would send them looking for a bug that is
 * not there. The cost is one `stat` per request.
 */

const FILE = resolve('data/stations.json');

let cached = null;

export function stationPayload() {
  const { mtimeMs } = statSync(FILE);
  if (cached?.mtimeMs !== mtimeMs) {
    const body = readFileSync(FILE);
    // Content-addressed, so a touched-but-unchanged file does not invalidate a client's
    // cached copy, and an edit-then-revert returns to the tag the client already holds.
    const etag = `"${createHash('sha256').update(body).digest('hex').slice(0, 32)}"`;
    cached = { mtimeMs, body, etag };
  }
  return cached;
}
