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

/**
 * Tried in order. rx.linkfanel.net answers only on http today — a request to the https
 * port is refused outright — so the plaintext URL is not a preference but the only one
 * that works. It is listed second rather than alone so that the day TLS appears there,
 * this starts using it without anybody noticing it had not been.
 *
 * What that means is written down rather than assumed: the list arrives over a transport
 * nobody authenticates, so anything in it is a claim, not a fact. Nothing here is
 * evaluated, `host` is rebuilt from a parsed URL rather than copied, and the client
 * escapes every field it shows. A listener still chooses a receiver by hand before
 * anything connects to it. See docs/RESEARCH.md §11.
 */
const SOURCE_URLS = [
  'https://rx.linkfanel.net/kiwisdr_com.js',
  'http://rx.linkfanel.net/kiwisdr_com.js',
];
const ATTRIBUTION = 'http://rx.linkfanel.net/';

/**
 * Sent upstream so this project is identifiable in rx.linkfanel.net's logs rather than
 * anonymous. Add the repository URL here once it is published — an operator who wants to
 * know who is fetching should be able to find out without asking.
 */
const USER_AGENT = 'project-echo/0.1 (shortwave marker monitor)';

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

/**
 * 'host:port' from the directory's full URL, or null for anything that is not one.
 *
 * The scheme and the hostname are both checked because `new URL` is happy with a great
 * deal that is not a receiver: `javascript:alert(1)` parses, with an empty hostname, and
 * would have become the host `:8073`. The upstream publishes web URLs for Kiwi nodes, so
 * anything else is either a broken row or a poisoned one, and neither belongs in a list
 * the app offers people to connect to.
 */
function parseHost(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!parsed.hostname) return null;
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
  let last = null;

  for (const url of SOURCE_URLS) {
    try {
      // Identifies this project in the operator's logs. rx.linkfanel.net is one person's
      // server and the polite thing is to be visible in it rather than anonymous.
      const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
      if (!response.ok) throw new Error(`directory source returned ${response.status}`);

      cache = { at: Date.now(), receivers: parseDirectory(await response.text()) };
      return;
    } catch (error) {
      last = error;
    }
  }

  throw last ?? new Error('no directory source configured');
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
  let stale = false;

  if (Date.now() - cache.at > CACHE_MS) {
    try {
      await refresh();
    } catch (error) {
      // One volunteer's server, and it goes down: it was unreachable for the whole of
      // one afternoon while this was being written. Throwing here discarded a perfectly
      // serviceable list that was already in memory and took the whole feature with it.
      // A fifteen-minute-old directory is worth far more than an error, so it is served
      // and flagged; only an empty cache is a real failure.
      if (!cache.receivers.length) throw error;
      stale = true;
      console.warn(`directory refresh failed, serving the cached copy: ${error.message}`);
    }
  }

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
    /** True when the upstream could not be reached and this is the last good copy. */
    stale,
    total: cache.receivers.length,
    receivers: list,
  };
}
