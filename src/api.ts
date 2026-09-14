/**
 * Client for the Phase 3 server.
 *
 * The app has to keep working without it. Phases 1 and 2 are a static bundle, and the
 * server only adds three things — the receiver directory, persisted observations, and
 * the relay stream. So every call here degrades to `null` rather than throwing, and the
 * views hide the features that depend on it. `available()` is resolved once and cached,
 * so a static deployment pays a single failed request rather than one per interaction.
 */

import { isSafeUrl } from './url';

export interface DirectoryReceiver {
  host: string;
  name: string;
  location: string;
  grid: string;
  gps: [number, number] | null;
  bandsKhz: [number, number] | null;
  users: number | null;
  usersMax: number | null;
  offline: boolean;
  snr: number | null;
}

export interface Directory {
  attribution: string;
  fetchedAt: string;
  /** The upstream could not be reached; this is the last good copy the server held. */
  stale: boolean;
  total: number;
  receivers: DirectoryReceiver[];
}

export interface Observation {
  id: number;
  stationId: string;
  heardAt: string;
  khz: number | null;
  receiver: string | null;
  periodSec: number | null;
  consistency: number | null;
  notes: string | null;
}

/**
 * What a contributed detection contains.
 *
 * No receiver. The measurement is the contribution — that a marker was heard, when, on
 * what frequency, at what period, how steadily — and which volunteer's node it was heard
 * through is incidental to that while naming a third party's hardware in a record of
 * what somebody listened to. The server still has the column for rows written before
 * this, and still accepts one from any other client; this one does not send it.
 */
export interface ObservationInput {
  stationId: string;
  khz?: number;
  periodSec?: number;
  consistency?: number;
  notes?: string;
}

/**
 * Whether this browser sends its detections to the server.
 *
 * Off unless someone turns it on. A detection is a measurement rather than a message —
 * station, frequency, period, consistency — but it is still a record of what a person
 * listened to, and it leaves their machine. The app had been
 * posting one a minute from the moment the detector locked, with nothing said and no way
 * to decline, which is the sort of thing this project criticises other software for.
 *
 * The gate lives here rather than in the view because this is the only module that
 * talks to the server: a view cannot forget to check it.
 */
const CONTRIBUTE_KEY = 'echo.contribute';

export function isContributing(): boolean {
  try {
    return localStorage.getItem(CONTRIBUTE_KEY) === 'yes';
  } catch {
    // Storage unavailable, so no choice has been recorded, so nothing is sent.
    return false;
  }
}

export function setContributing(on: boolean): void {
  try {
    localStorage.setItem(CONTRIBUTE_KEY, on ? 'yes' : 'no');
  } catch {
    // Nothing to do: without storage the answer stays no on the next read.
  }
}

/* ------------------------------------------------------------------ server ---- */

const SERVER_KEY = 'echo.server';

/**
 * Where the server is, when it is not this origin.
 *
 * Empty means same origin, which is right for `npm start` on a desktop and is the only
 * thing that ever worked before. The packaged Android app is the reason this exists:
 * Capacitor serves the bundle from its own local origin, so a relative `/api/...` asks
 * Capacitor for it and always will. A phone can only reach a server by being told where
 * one is.
 *
 * Stored rather than built in, because it is one person's machine on one network and
 * nobody else's business.
 */
export function serverBase(): string {
  try {
    return localStorage.getItem(SERVER_KEY) ?? '';
  } catch {
    return '';
  }
}

/**
 * Points the app at a server, or at this origin when given nothing.
 *
 * Returns false for anything that is not an http or https origin — the value is used to
 * build request URLs and is typed by hand on a phone keyboard, so it is checked in the
 * same place and by the same rule as every other URL this app accepts.
 */
export function setServerBase(value: string): boolean {
  const trimmed = value.trim().replace(/\/+$/, '');

  if (trimmed !== '' && !isSafeUrl(trimmed)) return false;

  try {
    if (trimmed === '') localStorage.removeItem(SERVER_KEY);
    else localStorage.setItem(SERVER_KEY, trimmed);
  } catch {
    return false;
  }

  // The old answer was about the old server.
  availability = null;
  return true;
}

/** A server path against whichever server is configured. */
function url(path: string): string {
  return `${serverBase()}${path}`;
}

let availability: Promise<boolean> | null = null;

export function available(): Promise<boolean> {
  availability ??= fetch(url('/api/health'))
    .then((response) => response.ok)
    .catch(() => false);
  return availability;
}

async function getJson<T>(path: string): Promise<T | null> {
  if (!(await available())) return null;
  try {
    const response = await fetch(url(path));
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Public receiver directory, proxied by the server.
 *
 * `khz` filters to receivers whose published band coverage includes that frequency,
 * which matters: plenty of public Kiwis are band limited and cannot hear 4625 kHz.
 */
export function fetchDirectory(khz?: number, freeOnly = true): Promise<Directory | null> {
  const params = new URLSearchParams();
  if (khz !== undefined) params.set('khz', String(khz));
  if (freeOnly) params.set('free', '1');
  return getJson<Directory>(`/api/receivers?${params.toString()}`);
}

export async function fetchObservations(stationId: string): Promise<Observation[] | null> {
  const body = await getJson<{ observations: Observation[] }>(
    `/api/observations?station=${encodeURIComponent(stationId)}`,
  );
  return body?.observations ?? null;
}

export async function postObservation(input: ObservationInput): Promise<boolean> {
  if (!isContributing()) return false;
  if (!(await available())) return false;
  try {
    const response = await fetch(url('/api/observations'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** The relay's HLS playlist, served with the CORS headers the audio graph needs. */
export function relayUrl(): string {
  return url('/stream/live.m3u8');
}

/**
 * Diagnostic marker recording, served correctly and — deliberately — without CORS
 * headers, from a *different origin* to this page.
 *
 * The cross-origin part is the whole point. A same-origin media element is never
 * silenced regardless of headers, so a same-origin fixture cannot reproduce the failure
 * at all. The server binds both loopback names, and `127.0.0.1:8080` and
 * `localhost:8080` are different origins to the browser, so swapping the hostname is
 * enough. On any other host the pair does not exist and these buttons will simply fail
 * to load — which is why they live under Diagnostics and not in the main controls.
 */
function crossOrigin(path: string): string {
  // A configured server is already a different origin to this page, which is the whole
  // point of the fixture, so the loopback swap has nothing to add.
  const base = serverBase();
  if (base !== '') return `${base}${path}`;

  const target = new URL(path, location.href);
  if (target.hostname === 'localhost') target.hostname = '127.0.0.1';
  else if (target.hostname === '127.0.0.1') target.hostname = 'localhost';
  return target.toString();
}

export function diagnosticUrl(): string {
  return crossOrigin('/diagnostic/marker.wav');
}

export function diagnosticNoCorsUrl(): string {
  return crossOrigin('/diagnostic-nocors/marker.wav');
}
