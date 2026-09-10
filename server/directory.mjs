/**
 * Public receiver directory.
 *
 * kiwisdr.com/public is behind a captcha handshake — it serves a page that replays an
 * `x-kiwi-auth` token before it will hand over the list — so it is not a source an app
 * may read programmatically, and working around that gate is not something this project
 * will do.
 *
 * The machine-readable source is Pierre Ynard's auto-generated list at
 * rx.linkfanel.net, published for the dyatlov map maker and regenerated from
 * kiwisdr.com every few minutes. It sends no `Access-Control-Allow-Origin`, which is
 * why the browser cannot read it and this proxy exists at all.
 */

const SOURCE_URL = 'http://rx.linkfanel.net/kiwisdr_com.js';
const ATTRIBUTION = 'http://rx.linkfanel.net/';

/** The upstream regenerates every few minutes; there is nothing to gain by asking more often. */
const CACHE_MS = 15 * 60 * 1000;

let cache = { at: 0, receivers: [] };

/** '(-34.273700, 138.771000)' → [lat, lon], or null. */
function parseGps(value) {
  const match = /^\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/.exec(value ?? '');
  return match ? [Number(match[1]), Number(match[2])] : null;
}

/** '2000000-30000000' → [lowKhz, highKhz], or null. */
function parseBands(value) {
  const [low, high] = String(value ?? '').split('-').map(Number);
  return Number.isFinite(low) && Number.isFinite(high) ? [low / 1000, high / 1000] : null;
}

/** 'host:port' from the directory's full URL. */
function parseHost(url) {
  try {
    const parsed = new URL(url);
    return parsed.port ? `${parsed.hostname}:${parsed.port}` : `${parsed.hostname}:8073`;
  } catch {
    return null;
  }
}

function normalise(entry) {
  const host = parseHost(entry.url);
  if (!host) return null;

  const users = Number(entry.users);
  const usersMax = Number(entry.users_max);

  return {
    host,
    name: String(entry.name ?? host).trim(),
    location: String(entry.loc ?? '').trim(),
    grid: String(entry.grid ?? '').trim().toUpperCase(),
    gps: parseGps(entry.gps),
    bandsKhz: parseBands(entry.bands),
    users: Number.isFinite(users) ? users : null,
    usersMax: Number.isFinite(usersMax) ? usersMax : null,
    offline: entry.offline === 'yes',
    /** '44,44' is a two-band SNR estimate; the first figure is the useful one. */
    snr: Number(String(entry.snr ?? '').split(',')[0]) || null,
  };
}

/**
 * Turns the upstream file into receiver records.
 *
 * The source is a JavaScript assignment — `var kiwisdr_com = [ {...}, ]` — with
 * trailing commas, so the array is sliced out and the commas stripped before it is
 * valid JSON. Parsed, never evaluated: this is third-party text.
 *
 * Exported so the parse can be tested without reaching the network, which is the part
 * most likely to break when the upstream format shifts.
 */
export function parseDirectory(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error('directory source is not in the expected format');

  const json = text.slice(start, end + 1).replace(/,(\s*[\]}])/g, '$1');
  return JSON.parse(json).map(normalise).filter(Boolean);
}

async function refresh() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) throw new Error(`directory source returned ${response.status}`);

  cache = { at: Date.now(), receivers: parseDirectory(await response.text()) };
}

/**
 * Returns the directory, refreshing at most every 15 minutes.
 *
 * `khz` keeps only receivers whose published band coverage includes that frequency —
 * worth having, because a good number of public Kiwis are VLF-only or otherwise band
 * limited and cannot hear 4625 kHz at all. `freeOnly` drops receivers with no free
 * channel, since a Kiwi has four and a full one will refuse the connection.
 */
export async function receivers({ khz, freeOnly } = {}) {
  if (Date.now() - cache.at > CACHE_MS) await refresh();

  let list = cache.receivers.filter((receiver) => !receiver.offline);

  if (Number.isFinite(khz)) {
    list = list.filter(
      (receiver) => receiver.bandsKhz && khz >= receiver.bandsKhz[0] && khz <= receiver.bandsKhz[1],
    );
  }
  if (freeOnly) {
    list = list.filter(
      (receiver) =>
        receiver.users === null || receiver.usersMax === null || receiver.users < receiver.usersMax,
    );
  }

  return {
    attribution: ATTRIBUTION,
    fetchedAt: new Date(cache.at).toISOString(),
    total: cache.receivers.length,
    receivers: list,
  };
}
