# Runbook

Operating procedures and failure diagnosis. Written for whoever is running the app,
including future you at 02:00 wondering why the waterfall is black.

Every symptom below has been hit and diagnosed on this project; the causes are real, not
hypothetical.

## Prerequisites

- Node 22.5 or later (`node:sqlite` is used, and it is stdlib from 22.5).
- A browser. The app must be served over **plain http** — see
  [README](../README.md#deployment-constraint).
- For the relay only: `ffmpeg` on `PATH` and a checkout of
  [kiwiclient](https://github.com/jks-prv/kiwiclient).

## Start and stop

```bash
npm install
npm run diagnostic-wav   # once per clone; generates server/diagnostic/marker.wav
npm start                # build + serve on http://127.0.0.1:8080
```

Ctrl-C stops it. There is no daemon, no PID file and no state to unwind — SQLite is the
only thing on disk, at `server/data/echo.sqlite`.

Client-only, without the server:

```bash
npm run dev              # http://127.0.0.1:5173
```

The directory, hearings and relay hide themselves when `/api/health` fails, so this is
a supported mode, not a degraded one.

## Verifying a deployment

Four checks, in order. Each is fast and each isolates a different layer.

```bash
# 1. Server up, and both loopback names bound.
curl -s http://127.0.0.1:8080/api/health
curl -s http://localhost:8080/api/health

# 2. Upstream directory reachable and parsing.
curl -s 'http://127.0.0.1:8080/api/receivers?khz=4625&free=1' | head -c 200

# 3. Storage writable.
curl -s -X POST http://127.0.0.1:8080/api/observations \
  -H 'content-type: application/json' -d '{"stationId":"TEST"}'
curl -s 'http://127.0.0.1:8080/api/observations?station=TEST'

# 4. The CORS pair — the first must carry the header, the second must not.
curl -sI http://127.0.0.1:8080/diagnostic/marker.wav        | grep -i access-control
curl -sI http://127.0.0.1:8080/diagnostic-nocors/marker.wav | grep -i access-control
```

Then in the browser, under **Diagnostics** on the Live tab:

- **Recording, CORS correct** → a waterfall appears and the detector locks on 2.4 s
  within about 20 seconds.
- **Recording, CORS missing** → playback runs, the waterfall stays black, and after
  about eight seconds the status line reports no audio and names the likely cause.

If the second one paints a waterfall, the silence check has regressed and the app can no
longer tell a CORS failure from a dead antenna. That check is the only thing standing
between those two, so treat it as a release blocker.

## Symptoms

### Waterfall is black, status says running

Three causes, in order of likelihood.

1. **The tab is not in front.** `Waterfall` stops on `visibilitychange`, by design —
   a hidden tab painting at 20 fps is a battery bug. Bring it forward.
2. **The receiver accepted the connection and is sending nothing.** Common on a busy
   public node. The status line says so explicitly; pick another receiver.
3. **Cross-origin silence.** Only possible on the relay or diagnostic paths, never on a
   KiwiSDR (a WebSocket is not subject to the rule). The stream is missing
   `Access-Control-Allow-Origin`, or the `<audio>` element lost its `crossOrigin`
   attribute. Playback works, the analyser reads zeros, nothing throws or logs.

A **transient** version of this is expected and self-correcting: audio can take several
seconds to arrive over a mobile network, and the check waits eight seconds before
saying anything. If it does warn and audio then starts, the warning clears itself.

### Connection closes immediately

| Close code | Meaning |
|---|---|
| 1006 | Never opened. Node is down, or the host is wrong. |
| 1005 | Node closed without a reason. Usually all four channels are busy, or you reconnected too quickly. |

A KiwiSDR has **four hardware channels**. Reconnecting repeatedly while debugging is how
you get dropped and, eventually, blocked — it happened during the on-air smoke test.
Connect once and hold; if you need to iterate, capture the signal and work offline.

### Detector never leaves "listening…"

It warms up for **11 seconds of wall time** before reporting anything, then needs four
edges — about twelve more seconds for a 3.1 s marker. Under half a minute is normal.

Longer than that means no frames are arriving: the tab is hidden, or the audio graph
never started. Check the status line first.

### Detector says "pulses present but irregular"

The band has energy but no consistent period. In order:

1. **Propagation.** Expand Propagation and compare the tuned frequency with the MUF. A
   frequency above the MUF on your path is not arriving, and fading drops individual
   pulses, which stretches intervals.
2. **Wrong frequency.** Check the station row against
   [RESEARCH.md](RESEARCH.md) §2 — S30 has separate day and night frequencies, and S32's
   are published two different ways.
3. **A voice message is running.** The buzz stops during one, and the detector will
   track whatever is loudest instead.

### Detector reports a period that disagrees with the published one

This is working as designed — the app shows both figures and says they disagree rather
than resolving it. It found a real data error that way: see [RESEARCH.md](RESEARCH.md)
§7, where a measured 3.40 s exposed the widely-repeated "25 tones per minute" for The
Buzzer as an error in summarising a source that actually gives 3.1 s.

Before believing the measurement over the data, re-measure from a second receiver.

### Directory sheet says "directory unavailable"

The server is not answering, or the upstream changed shape. Check:

```bash
curl -s http://127.0.0.1:8080/api/receivers | head -c 200
curl -s http://rx.linkfanel.net/kiwisdr_com.js | head -c 200
```

If the upstream returns HTML or an error page, `parseDirectory` throws
`directory source is not in the expected format` — the parser is pinned by tests in
[`test/directory.test.ts`](../test/directory.test.ts), so start by running those against
the new shape. Saved receivers keep working meanwhile, and a host can always be pasted
by hand.

### Alerts never fire

In order:

1. Permission. The Schedule tab states it plainly; **denied is not recoverable in-app**
   and needs browser settings.
2. **In a browser**, a tab must be open. There is no service worker, because the app
   must be served over plain http, so a closed browser means no alert. This is a
   limitation, not a bug.
3. **In the Android build**, the app is closed and that is fine — the schedule is handed
   to the OS. If nothing arrives, check Android's own switches for the app: notifications
   must be allowed, and under **Alarms & reminders** exact alarms decide whether the
   reminder lands on the minute or drifts. Without that one the plugin falls back to an
   inexact alarm, which Android is free to delay while the phone is dozing, so an alert
   can arrive late rather than not at all.
4. Only slots with an imported schedule can alert — the coverage line says how many.

### Rebuild does not appear in the browser

`index.html` is served `no-store` precisely to prevent this, but a copy cached before
that header existed will persist. Hard-reload, or append a query string once.

## Procedure: running the relay

**Not verified end to end.** It has never run against a real receiver here; there was no
`ffmpeg` and no receiver we were entitled to relay. Treat this as untested.

Before you run it, read the gate: relaying one node to every listener of the app spends
that receiver's channels and uplink. `--authorized` asserts the receiver is yours or its
operator has agreed **in writing**. See [RESEARCH.md](RESEARCH.md) §4.

```bash
node scripts/relay.mjs \
  --host my-kiwi.example.org:8073 \
  --khz 4625 \
  --mode usb \
  --kiwiclient ../kiwiclient \
  --authorized
```

It clears `server/stream/`, then runs `kiwirecorder.py --netcat | ffmpeg`, writing an
HLS playlist and 2-second AAC segments for the server to serve with CORS. The **Relay**
button under Diagnostics plays it.

Verify:

```bash
ls server/stream/                                   # live.m3u8 plus live###.aac
curl -sI http://127.0.0.1:8080/stream/live.m3u8 | grep -i 'access-control\|cache-control'
```

**Rollback.** Ctrl-C. Both child processes are killed together, deliberately: either one
dying leaves a stale playlist advertising segments that no longer advance. Then remove
the output so nothing serves a frozen stream:

```bash
rm -rf server/stream
```

The client's **Relay** button then fails to load and reports it; no other feature is
affected.

**Escalation.** If a node operator objects to being relayed, stop the relay first and
answer afterwards. The project's position is that this must not happen without written
permission; if it did, the fix is to stop, not to negotiate retroactively.

## Procedure: refreshing station data

The roster is a dated snapshot, and its `lastConfirmed` fields rot by design — the
interface presents status as a dated claim for exactly that reason.

1. Re-read the [ENIGMA 2000 newsletters](http://www.signalshed.com/nletter06.html),
   which publish every two months, and the Priyom category indexes.
2. For schedules and their frequency lists, run `npm run import-priyom` and read the
   diff — never hand-edit those rows. For everything else, edit
   [`data/stations.json`](../data/stations.json) directly. Every frequency needs its own
   `sourceUrl` and `lastConfirmed`; where sources conflict, add both rows and set
   `disputed` rather than choosing. Full rules in [`data/README.md`](../data/README.md).
3. Note in [RESEARCH.md](RESEARCH.md) what changed and why, especially anything that
   contradicts a previous entry.
4. `npm test && npm run build`. The test suite validates the file, so a missing source
   URL or a duplicate designator fails here rather than shipping.
5. Deploying the file is enough — `GET /api/stations` reads it from disk and installed
   clients pick it up at their next launch. No release is needed for a data change.

Do not "tidy" a disagreement away. Two of this project's factual corrections came from
noticing that sources disagree.
