# Server API

Reference for the Phase 3 server in [`server/`](../server). Written for anyone running
it or building against it; the client in [`src/api.ts`](../src/api.ts) is the only
consumer today.

The server exists because four things are impossible in the browser alone: reading the
public receiver directory, which sends no CORS headers; persisting observations;
serving the relay's segments with the CORS headers a `MediaElementAudioSourceNode`
needs; and shipping corrected station data to an installed client without a release.
It does those and serves the built client. Nothing else.

```bash
npm start          # build the client, then serve on 8080
npm run server     # serve an existing build
```

## Base URL and binding

`http://127.0.0.1:8080` by default, and `http://localhost:8080` and `http://[::1]:8080`
reach the same server — both loopback addresses are bound.

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8080` | |
| `HOST` | unset | Unset binds `127.0.0.1` **and** `::1`. Setting it binds only that address. |

Binding both loopback names is not cosmetic: `127.0.0.1:8080` and `localhost:8080` are
different origins to a browser, which is what makes the CORS diagnostic in
[RUNBOOK.md](RUNBOOK.md) reproducible without extra infrastructure.

**There is no authentication, and `POST /api/observations` accepts writes.** Loopback-only
is the default for that reason. Setting `HOST=0.0.0.0` exposes an unauthenticated write
endpoint to the network; do not do it without putting something in front.

Because the endpoint is unauthenticated, the field types are the trust boundary, and
`server/observation.mjs` is where they are checked. A row that fails is refused rather
than stored: SQLite does not enforce a column's type, and a string in a `REAL` column is
kept unchanged, so an unchecked write reached the rendered archive intact.

## Conventions

- All responses are JSON except the file routes.
- **No JSON response carries `Access-Control-Allow-Origin`.** The client is served by
  this same server, so it never needs one. The header used to be on every response,
  which meant any page the user happened to visit could read every observation the
  server held and write new ones. CORS is now only on the audio routes, where a
  `MediaElementAudioSourceNode` is silent without it.
- `OPTIONS` on any path returns `204` with `Allow: GET, POST, OPTIONS` and no
  access-control headers, which is what refuses a cross-origin caller.
- Errors are `{ "error": "<message>" }`.
- A rejected write returns `400` and says which field was wrong. Anything else returns
  `500` with `server error` — the exception's message is not the caller's business.

---

## `GET /api/health`

Liveness. The client calls this once and caches the result to decide whether to show
the directory, hearings and relay controls at all.

```bash
curl -s http://127.0.0.1:8080/api/health
```

```json
{ "ok": true }
```

---

## `GET /api/receivers`

The public KiwiSDR directory, proxied and normalised.

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `khz` | number | absent | Keep only receivers whose published band coverage includes this frequency. Absent means no frequency filter. |
| `free` | `1` | absent | Keep only receivers with a free channel. |

Offline receivers are always excluded.

```bash
curl -s 'http://127.0.0.1:8080/api/receivers?khz=4625&free=1'
```

```json
{
  "attribution": "http://rx.linkfanel.net/",
  "fetchedAt": "2026-09-10T11:51:29.920Z",
  "total": 855,
  "receivers": [
    {
      "host": "kiwisdr.areg.org.au:8074",
      "name": "2-30MHZ SDR #2, VK5ARG Remote Receiver Site | Near Tarlee, South Australia",
      "location": "Near Tarlee, South Australia",
      "grid": "PF95JR",
      "gps": [-34.2737, 138.771],
      "bandsKhz": [2000, 30000],
      "users": 2,
      "usersMax": 8,
      "offline": false,
      "snr": 44
    }
  ]
}
```

`total` is the size of the unfiltered directory, so a client can say "776 of 855".
`gps`, `bandsKhz`, `users`, `usersMax` and `snr` are `null` when the upstream omits or
malforms them. `snr` is the first figure of the upstream's two-band estimate.

**Ordering is upstream order, not useful order.** Sort client-side; the client sorts by
`snr` descending and renders the top 50, because the response for 4625 kHz runs to
several hundred entries.

**Source.** `http://rx.linkfanel.net/kiwisdr_com.js`, Pierre Ynard's auto-generated
list for the dyatlov map maker, regenerated from kiwisdr.com every few minutes and
cached here for 15 minutes. Attribute it in any interface that shows this data.

kiwisdr.com/public itself is **not** usable programmatically — it serves a captcha page
that replays an `x-kiwi-auth` token before the list appears. Working around that gate is
out of bounds for this project.

Errors: `500` if the upstream is unreachable or its format has changed
(`directory source is not in the expected format`). There is no stale-cache fallback —
a failed refresh fails the request.

---

## `GET /api/stations`

The station roster, served from [`data/stations.json`](../data/stations.json).

This is an update channel, not a dependency. The client inlines a copy of the same file
at build time, so it has the full roster with no server at all; this endpoint exists so
a corrected frequency or a station that went off the air reaches an installed build
without a release.

```bash
curl -s http://127.0.0.1:8080/api/stations | head -c 120
```

```json
{ "schemaVersion": 1, "stations": [ { "enigmaId": "S28", "name": "The Buzzer", ... } ] }
```

| Header | Value |
|---|---|
| `etag` | SHA-256 of the body, truncated to 32 hex characters |
| `cache-control` | `no-cache` — revalidate every time, which the 304 makes cheap |

Send the tag back to revalidate:

```bash
curl -s -o /dev/null -w '%{http_code}
'      -H 'If-None-Match: "99ceb529530f458a8e89dcb03bbe5515"'      http://127.0.0.1:8080/api/stations      # 304
```

The response is cached against the file's mtime, so editing `data/stations.json` and
reloading is enough — the server does not need restarting. The tag is content-addressed
rather than mtime-based, so touching the file without changing it does not invalidate a
client's copy.

Clients validate what they receive (`src/data/schema.ts`) and keep their bundled copy if
it fails or carries an unknown `schemaVersion`. Editing rules are in
[`data/README.md`](../data/README.md).

---

## `GET /api/observations`

Marker hearings recorded by this installation's detector.

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `station` | string | all | ENIGMA designator, e.g. `S28`. |
| `limit` | number | `50` | Clamped to 1–500. |

Newest first.

```bash
curl -s 'http://127.0.0.1:8080/api/observations?station=S28'
```

```json
{
  "observations": [
    {
      "id": 1,
      "stationId": "S28",
      "heardAt": "2026-09-10T11:51:30.009Z",
      "khz": 4625,
      "receiver": "sdr.autreradioautreculture.com:8074 @ 4625 kHz USB",
      "periodSec": 3.4,
      "consistency": 1,
      "notes": null
    }
  ]
}
```

An observation records **that a signal was heard, when, where and at what period. Never
what it said.** That is a legal boundary, documented in [RESEARCH.md](RESEARCH.md) §5,
not a schema preference. Do not add content fields.

---

## `POST /api/observations`

The client sends no `receiver`. The measurement is the contribution, and which
volunteer's node someone listened through names a third party's hardware in a record of
what a person listened to. The column remains for rows written before that decision and
the endpoint still accepts one from any other client; this client does not send it.

The client sends nothing here at all unless the user has turned on the switch in the live
view. It is off by default, the gate lives in `src/api.ts` rather than in the view so
no caller can forget it, and the endpoint itself is unauthenticated — the consent is a
property of this client, not of the server.

Records a hearing. `Content-Type: application/json`.

| Field | Type | Required | Meaning |
|---|---|---|---|
| `stationId` | string | yes | ENIGMA designator. |
| `khz` | number | no | Frequency heard on. |
| `receiver` | string | no | Free-form receiver label. |
| `periodSec` | number | no | Measured pulse period. |
| `consistency` | number | no | 0–1, how regular the intervals were. |
| `heardAt` | ISO string | no | Defaults to now. |
| `notes` | string | no | |

```bash
curl -s -X POST http://127.0.0.1:8080/api/observations \
  -H 'content-type: application/json' \
  -d '{"stationId":"S28","khz":4625,"receiver":"my-kiwi:8073","periodSec":3.4,"consistency":1}'
```

```json
{ "id": 1, "updated": false }
```

**Writes are deduplicated.** A hearing for the same `stationId` and `receiver` within
ten minutes updates the existing row and returns `{ "id": <same>, "updated": true }`
rather than inserting. A detector reports a lock every second while a marker is up, so
without this the table would log the polling interval instead of the transmissions. The
client additionally posts at most once a minute.

| Status | When |
|---|---|
| `201` | Inserted or updated. |
| `400` | `stationId` missing. |
| `400` | A field is the wrong type, missing, or too long. The message names the field. |
| `500` | Body over 8192 bytes (`request body too large`) or not valid JSON. Both should be `413` and `400`; they are not, and a client cannot currently distinguish either from a server fault. |

---

## File routes

| Path | CORS | Cache | Serves |
|---|---|---|---|
| `/stream/*` | yes | `no-store` on `.m3u8` | The relay's HLS output from `server/stream/`. |
| `/diagnostic/*` | yes | default | `server/diagnostic/`. |
| `/diagnostic-nocors/*` | **no** | default | The same directory, deliberately without the header. |
| everything else | **no** | `no-store` on `.html`, one year immutable on `/assets/*` | The built client from `dist/`. |

`/diagnostic-nocors/` exists to make cross-origin audio silence reproducible: a
`MediaElementAudioSourceNode` built from a cross-origin resource outputs silence with no
error and no log, so the only way to know the client's check still works is to trigger
the failure. See [RUNBOOK.md](RUNBOOK.md).

`index.html` is `no-store` because it names the hashed asset bundles; a cached copy
keeps loading the previous build's JavaScript after a rebuild. The hashed assets are
immutable because their names change when they do.

Paths that escape their root return `403` or `404`; nothing outside the served directory
is reachable.

## Storage

SQLite at `server/data/echo.sqlite` via `node:sqlite`, so the server has no
dependencies. Only the `observation` table is created — stations, frequencies and
schedules live in [`data/stations.json`](../data/stations.json), reviewed in git and
served as a file, and creating empty tables nothing reads would be scaffolding.
Schema and rationale in [PLAN.md](PLAN.md) §3.

The file is gitignored. Deleting it loses the hearings and nothing else.
