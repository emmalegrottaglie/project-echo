import type { Receiver } from './types';

/**
 * The user's own list of receivers.
 *
 * The app ships no hostnames of its own, for two reasons. Baking in volunteer nodes
 * makes other people's hardware look like our infrastructure, which docs/RESEARCH.md §4
 * says not to do; and the public directory changes constantly, so a compiled-in list
 * would rot into a menu of dead hosts. Fetching the live directory needs a server to
 * proxy it — kiwisdr.com sends no CORS headers — which is Phase 3.
 *
 * What the user gets instead: they add a node once, from kiwisdr.com/public, and
 * afterwards pick it from a list in the app. Several can be saved, which is useful in
 * its own right, since the node that hears 4625 kHz well is rarely the one that hears
 * 5448 kHz well.
 */

const KEY = 'echo.receivers';
const SELECTED_KEY = 'echo.receiver.selected';
/** Pre-list format: a single receiver object. Migrated on first read. */
const LEGACY_KEY = 'echo.receiver';

export const PUBLIC_LIST_URL = 'http://kiwisdr.com/public/';

/** 'host:port' with something before the colon. */
function hasHostname(host: string | undefined): boolean {
  return typeof host === 'string' && host.split(':')[0]!.length > 0;
}

function read(): Receiver[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const stored = JSON.parse(raw) as Receiver[];
      const usable = stored.filter((receiver) => hasHostname(receiver.host));
      if (usable.length !== stored.length) write(usable);
      return usable;
    }
  } catch {
    localStorage.removeItem(KEY);
  }

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    localStorage.removeItem(LEGACY_KEY);
    try {
      const receiver = JSON.parse(legacy) as Receiver;
      // An earlier build normalised an empty field to ':8073' and saved it, so a
      // stored value is only worth migrating if it actually names a host.
      if (hasHostname(receiver.host)) {
        write([receiver]);
        localStorage.setItem(SELECTED_KEY, receiver.id);
        return [receiver];
      }
    } catch {
      // Unparseable legacy value; the key is already gone.
    }
  }

  return [];
}

function write(receivers: Receiver[]): void {
  localStorage.setItem(KEY, JSON.stringify(receivers));
}

export function listReceivers(): Receiver[] {
  return read();
}

/** Adds or updates by host, and selects it. Returns the saved receiver. */
export function saveReceiver(receiver: Receiver): Receiver {
  const receivers = read().filter((existing) => existing.id !== receiver.id);
  receivers.push(receiver);
  receivers.sort((a, b) => a.label.localeCompare(b.label));
  write(receivers);
  localStorage.setItem(SELECTED_KEY, receiver.id);
  return receiver;
}

export function removeReceiver(id: string): void {
  write(read().filter((receiver) => receiver.id !== id));
  if (localStorage.getItem(SELECTED_KEY) === id) localStorage.removeItem(SELECTED_KEY);
}

export function selectReceiver(id: string): void {
  localStorage.setItem(SELECTED_KEY, id);
}

/**
 * The receiver a connection should use.
 *
 * When the stored selection names nothing in the list — cleared, or left over from a
 * receiver since forgotten — the first entry stands in, and that choice is written back
 * immediately. Returning a silent fallback without committing it let the interface show
 * one receiver while a connection opened against another, which is how a smoke test
 * ended up on a node in Missouri while the screen said France. Connecting to a
 * volunteer's receiver nobody chose is exactly what docs/RESEARCH.md §4 forbids.
 */
export function selectedReceiver(): Receiver | null {
  const receivers = read();
  if (!receivers.length) return null;

  const id = localStorage.getItem(SELECTED_KEY);
  const selected = receivers.find((receiver) => receiver.id === id);
  if (selected) return selected;

  const fallback = receivers[0]!;
  localStorage.setItem(SELECTED_KEY, fallback.id);
  return fallback;
}

/**
 * Normalise a pasted host. Accepts 'example.com:8073', 'http://example.com:8073/',
 * or a bare hostname, and returns 'host:port' with no scheme or path.
 */
export function normaliseHost(input: string): string {
  const trimmed = input.trim().replace(/^\w+:\/\//, '').replace(/\/.*$/, '');
  if (!trimmed) return '';
  return trimmed.includes(':') ? trimmed : `${trimmed}:8073`;
}

/** Maidenhead grid squares are two letters, two digits, optionally two more letters. */
export function isValidGrid(grid: string): boolean {
  return /^[A-R]{2}\d{2}([A-X]{2})?$/i.test(grid.trim());
}
