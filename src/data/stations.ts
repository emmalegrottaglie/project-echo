/**
 * Access to the station roster.
 *
 * The roster itself is `data/stations.json`, not this file. It used to be a 589-line
 * typed fixture, which meant every correction — a frequency that moved, a station that
 * went off the air, a `lastConfirmed` date that had rotted — was a code change, a
 * rebuild, and since the Android wrapper a reshipped APK. Station data is the one part
 * of this app whose whole value is being current, so it is data now:
 *
 * - The committed JSON is validated by `src/data/schema.ts` in CI, which is what keeps
 *   the provenance rule of docs/PLAN.md §3 enforceable now that the compiler no longer
 *   sees the literals.
 * - The build inlines a copy, so the app works offline and with no server at all.
 * - The server serves the current copy from `/api/stations`; the client fetches it in
 *   the background and caches it for the next launch.
 *
 * Data therefore ships without a release, while git keeps the provenance history and a
 * pull request keeps a human in the loop. See `data/README.md`.
 *
 * Updates apply at the next launch rather than mid-session. Swapping the roster under a
 * mounted view would mean re-rendering the archive, the schedule and the live view's
 * station picker from an event, which is machinery this buys nothing for: the data
 * changes a few times a month and the app is re-opened far more often than that.
 */

import type { Station, Tier } from '../types';
import bundled from '../../data/stations.json';
import { SCHEMA_VERSION, validateStationData } from './schema';

/** ENIGMA designator prefix conventions, surfaced in the UI rather than hidden. */
export const PREFIX_MEANING: Record<string, string> = {
  E: 'English voice',
  G: 'German voice',
  S: 'Slavic voice',
  V: 'Other-language voice',
  M: 'Morse',
  F: 'Digital (FSK)',
  P: 'Digital (PSK)',
  X: 'Digital (other)',
  H: 'Digital (hybrid voice + data)',
};

export function prefixMeaning(enigmaId: string): string {
  const head = enigmaId.slice(0, 2) === 'HM' ? 'H' : enigmaId.slice(0, 1);
  return PREFIX_MEANING[head] ?? 'Unclassified';
}

/** Where a cached roster lives between launches. */
const CACHE_KEY = 'echo.stations';

/**
 * The build-time copy is trusted without validation: it is the same file CI validates,
 * and it arrives through the bundler rather than over a network. Everything that does
 * arrive over a network goes through `validateStationData` before it gets here.
 */
let current: Station[] = bundled.stations as unknown as Station[];

export function allStations(): Station[] {
  return current;
}

export function byId(enigmaId: string): Station | undefined {
  return current.find((station) => station.enigmaId === enigmaId);
}

export function byTier(tier: Tier): Station[] {
  return current.filter((station) => station.tier === tier);
}

/** True when only identity and status are sourced — no detail imported yet. */
export function isRosterOnly(station: Station): boolean {
  return station.lore === null;
}

/**
 * Installs a cached roster, if one is present and still valid.
 *
 * Called once at startup, before the first view mounts. Anything wrong with the cache —
 * absent, unparseable, written by a newer schema, or failing validation — leaves the
 * bundled copy in place and clears the bad entry, so a poisoned or stale cache cannot
 * brick the app. That is also the rollback path: delete the key and the next launch is
 * the shipped dataset.
 */
export function loadCachedStations(): void {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CACHE_KEY);
  } catch {
    return; // Storage disabled. The bundled copy is still correct.
  }
  if (raw === null) return;

  const result = parseStations(raw);
  if (result === null) {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* Nothing more to do: the bundled copy is already in use. */
    }
    return;
  }
  current = result;
}

/**
 * Fetches the server's copy and caches it for the next launch.
 *
 * Deliberately does not touch `current`. It is also deliberately quiet: the server is
 * optional for this app, so a failure here is the normal state for anyone running the
 * client on its own and must not surface as an error.
 */
export async function refreshStations(): Promise<boolean> {
  try {
    const response = await fetch('/api/stations', { cache: 'no-cache' });
    if (!response.ok) return false;

    const text = await response.text();
    if (parseStations(text) === null) return false;

    localStorage.setItem(CACHE_KEY, text);
    return true;
  } catch {
    return false;
  }
}

/** Parses and validates a serialised dataset. Returns null for anything unusable. */
function parseStations(text: string): Station[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const result = validateStationData(parsed);
  if (!result.ok) {
    console.warn(
      `station data rejected (schema ${SCHEMA_VERSION}): ${result.errors.slice(0, 3).join('; ')}`,
    );
    return null;
  }
  return result.stations;
}
