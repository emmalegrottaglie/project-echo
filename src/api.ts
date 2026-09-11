/**
 * Client for the Phase 3 server.
 *
 * The app has to keep working without it. Phases 1 and 2 are a static bundle, and the
 * server only adds three things — the receiver directory, persisted observations, and
 * the relay stream. So every call here degrades to `null` rather than throwing, and the
 * views hide the features that depend on it. `available()` is resolved once and cached,
 * so a static deployment pays a single failed request rather than one per interaction.
 */

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

export interface ObservationInput {
  stationId: string;
  khz?: number;
  receiver?: string;
  periodSec?: number;
  consistency?: number;
  notes?: string;
}

let availability: Promise<boolean> | null = null;

export function available(): Promise<boolean> {
  availability ??= fetch('/api/health')
    .then((response) => response.ok)
    .catch(() => false);
  return availability;
}

async function getJson<T>(path: string): Promise<T | null> {
  if (!(await available())) return null;
  try {
    const response = await fetch(path);
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
  if (!(await available())) return false;
  try {
    const response = await fetch('/api/observations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** The relay's HLS playlist, served by the same origin with CORS headers. */
export const RELAY_URL = '/stream/live.m3u8';

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
  const url = new URL(path, location.href);
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
  else if (url.hostname === '127.0.0.1') url.hostname = 'localhost';
  return url.toString();
}

export function diagnosticUrl(): string {
  return crossOrigin('/diagnostic/marker.wav');
}

export function diagnosticNoCorsUrl(): string {
  return crossOrigin('/diagnostic-nocors/marker.wav');
}
