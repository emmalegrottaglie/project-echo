import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { listObservations, recordObservation } from './db.mjs';
import { receivers } from './directory.mjs';
import { stationPayload } from './stations.mjs';

/**
 * Phase 3 server.
 *
 * Three things the client cannot do on its own, and nothing else:
 *
 *   1. read the public receiver directory, which sends no CORS headers;
 *   2. persist observations, so a detection survives the tab;
 *   3. serve the relay's HLS segments with the CORS headers that a
 *      `MediaElementAudioSourceNode` needs before it will produce anything but silence.
 *
 * No framework and no dependencies. The routing table is nine entries; a router would
 * be more code than the thing it routes.
 */

const PORT = Number(process.env.PORT ?? 8080);

/**
 * Loopback only by default. `/api/observations` accepts writes without authentication,
 * so binding every interface is a decision for whoever deploys this, not a default.
 *
 * Both loopback addresses are bound, for two reasons: people type `localhost`, and the
 * CORS diagnostic needs two origins that serve the same files — `127.0.0.1:8080` and
 * `localhost:8080` are different origins to the browser, which is exactly what makes
 * the cross-origin silence reproducible without any extra infrastructure.
 */
const HOSTS = process.env.HOST ? [process.env.HOST] : ['127.0.0.1', '::1'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.m4s': 'audio/mp4',
  '.mp4': 'audio/mp4',
  '.aac': 'audio/aac',
};

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'access-control-allow-origin': '*',
  });
  response.end(payload);
}

/**
 * Serves a file from `root`, refusing anything that escapes it.
 *
 * `cors` is a parameter rather than always-on because `/diagnostic-nocors/` exists
 * precisely to serve the same bytes without the header — see the route table.
 */
function sendFile(response, root, urlPath, { cors }) {
  const rootPath = resolve(root);
  const requested = resolve(join(rootPath, normalize(decodeURIComponent(urlPath))));

  if (requested !== rootPath && !requested.startsWith(rootPath + sep)) {
    sendJson(response, 403, { error: 'path outside root' });
    return;
  }

  let stats;
  try {
    stats = statSync(requested);
  } catch {
    sendJson(response, 404, { error: 'not found' });
    return;
  }
  if (!stats.isFile()) {
    sendJson(response, 404, { error: 'not a file' });
    return;
  }

  const headers = {
    'content-type': MIME[extname(requested).toLowerCase()] ?? 'application/octet-stream',
    'content-length': stats.size,
  };

  // Live HLS playlists are rewritten every segment, so a cached one strands the player
  // on an expired window.
  if (extname(requested) === '.m3u8') headers['cache-control'] = 'no-store';

  // index.html names the hashed asset bundles, so a cached copy keeps loading the
  // previous build's CSS and JavaScript after a rebuild. The hashed assets themselves
  // are safe to cache forever, because their names change when they do.
  if (extname(requested) === '.html') headers['cache-control'] = 'no-store';
  else if (urlPath.startsWith('/assets/')) {
    headers['cache-control'] = 'public, max-age=31536000, immutable';
  }
  if (cors) headers['access-control-allow-origin'] = '*';

  response.writeHead(200, headers);
  createReadStream(requested).pipe(response);
}

async function readJsonBody(request, limit = 8192) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw new Error('request body too large');
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handle(request, response) {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? HOSTS[0]}`);
  const path = url.pathname;

  try {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      });
      response.end();
      return;
    }

    if (path === '/api/receivers' && request.method === 'GET') {
      // An absent parameter must stay absent: `Number(null)` is 0, which is a finite
      // frequency, and filtering on 0 kHz quietly returns only the VLF-capable nodes.
      const khzParam = url.searchParams.get('khz');
      const khz = khzParam === null ? Number.NaN : Number(khzParam);

      sendJson(
        response,
        200,
        await receivers({
          khz: Number.isFinite(khz) ? khz : undefined,
          freeOnly: url.searchParams.get('free') === '1',
        }),
      );
      return;
    }

    if (path === '/api/observations' && request.method === 'GET') {
      sendJson(response, 200, {
        observations: listObservations({
          stationId: url.searchParams.get('station') ?? undefined,
          limit: url.searchParams.get('limit') ?? undefined,
        }),
      });
      return;
    }

    if (path === '/api/observations' && request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body?.stationId) {
        sendJson(response, 400, { error: 'stationId is required' });
        return;
      }
      sendJson(response, 201, recordObservation(body));
      return;
    }

    if (path === '/api/stations' && request.method === 'GET') {
      const { body, etag } = stationPayload();

      if (request.headers['if-none-match'] === etag) {
        response.writeHead(304, { etag, 'access-control-allow-origin': '*' });
        response.end();
        return;
      }

      response.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'content-length': body.length,
        // Revalidate every launch: the whole point of this endpoint is currency, and
        // the 304 above makes checking cheap.
        'cache-control': 'no-cache',
        etag,
        'access-control-allow-origin': '*',
      });
      response.end(body);
      return;
    }

    if (path === '/api/health') {
      sendJson(response, 200, { ok: true });
      return;
    }

    // The relay's output. CORS headers here are not optional: without them the
    // client's analyser reads silence from the stream and the waterfall stays blank.
    if (path.startsWith('/stream/')) {
      sendFile(response, 'server/stream', path.slice('/stream'.length), { cors: true });
      return;
    }

    // A fixed marker recording, served twice: once correctly, and once deliberately
    // without CORS headers. The second route is how the client's silence check can be
    // verified after any change to the audio graph — a cross-origin
    // MediaElementAudioSourceNode outputs silence with no error and no log, so the only
    // way to know the check still works is to reproduce the failure on demand.
    if (path.startsWith('/diagnostic/')) {
      sendFile(response, 'server/diagnostic', path.slice('/diagnostic'.length), { cors: true });
      return;
    }
    if (path.startsWith('/diagnostic-nocors/')) {
      sendFile(response, 'server/diagnostic', path.slice('/diagnostic-nocors'.length), {
        cors: false,
      });
      return;
    }

    sendFile(response, 'dist', path === '/' ? '/index.html' : path, { cors: true });
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}

console.log('Project Echo server');
console.log('  /api/receivers      public KiwiSDR directory (proxied, 15 min cache)');
console.log('  /api/observations   marker hearings (SQLite)');
console.log('  /stream/            relay output, with CORS');
console.log('  /diagnostic/        marker recording, with and without CORS');

for (const host of HOSTS) {
  const server = createServer(handle);
  server.listen(PORT, host, () => {
    const shown = host.includes(':') ? `[${host}]` : host;
    console.log(`listening on http://${shown}:${PORT}`);
  });
  // A machine with IPv6 disabled should still serve on IPv4 rather than exiting.
  server.on('error', (error) => console.warn(`could not bind ${host}: ${error.message}`));
}
