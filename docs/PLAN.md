# Project Echo — Implementation Plan

Revision of the original brief. The factual and legal basis for the changes is in
[RESEARCH.md](RESEARCH.md); this document is the build order.

## 0. What the product is

A **channel-marker monitor and station archive** for shortwave numbers and military
markers, with an honest live tier.

It is not a numbers-message scanner. Of the seven stations in the original brief, only
the Russian channel markers (S28, S30, S32) are continuously on the air, and none of
the message-carrying stations transmit on a cadence a user can sit and wait for. The
live view shows markers; the schedule view shows when message traffic is expected; the
archive holds everything else.

Non-goals, explicitly:

- No message decoding, and no presentation of number groups as decoded content.
- No hosted recordings of voice or digital message traffic in Phase 1 — link to
  established archives instead.
- No accounts, no social feed, no crowd-sourced logging in Phase 1.
- No relay of anyone else's receiver without written permission. See §4.

## 1. Phase 1 — client only, no backend

Everything here runs in the browser against a receiver the user picks.

Deliverables:

1. **Receiver picker.** A curated list of public KiwiSDR and WebSDR nodes, each with
   its location, so the user can choose one with propagation to the transmitter. The
   connection is the user's own, direct to that node, under that node's rules.
2. **Waterfall.** The circular-buffer spectrogram, corrected per §2.
3. **Station database view.** Seeded from the tables in [RESEARCH.md](RESEARCH.md) §2,
   stored per §3. Live / scheduled / historical tiers are distinct in the UI, with
   `last_confirmed` dates visible — the tier is data, not a hardcoded badge.
4. **Schedule view.** Expected transmission windows for the alerting tier, in UTC and
   local, with a "next window" countdown.
5. **Propagation layer.** MUF from `prop.kc2g.com` next to each station's frequency, so
   a station that cannot physically be heard right now says so instead of appearing
   broken. Refreshed no more often than the source's 5-minute cadence.

Acceptance for Phase 1: a user picks a node, sees the Buzzer's marker moving in the
waterfall on 4625 kHz, reads what the station is, and sees when E11 is next due.

## 2. The waterfall — corrected

The original brief's transform does not work. Writing new rows at `y = currentRow` on
a canvas of height `H` and applying `translateY(-currentRow)` scrolls the canvas the
wrong way, and every wrap at `currentRow === H` shows as a hard tear where the newest
row sits directly above the oldest.

**Fix: a canvas of height `2H`, with every row written twice.**

```
canvas height  = 2 * H          // H = viewport height in rows
r              = row cursor, 0 .. H-1

per frame:
  write the new row at y = r
  write the same row at y = r + H
  r = (r + 1) % H
  viewport transform: translateY(-(r_next))     // i.e. -(r + 1) mod-free
```

Because every row exists at both `y` and `y + H`, the window of `H` rows ending at the
cursor is always contiguous somewhere on the canvas, so the transform never crosses a
discontinuity. The newest row sits at the bottom edge of the viewport and history
scrolls up. No tear, and still one row of painting per frame rather than a full-canvas
`drawImage`.

Structure:

```html
<div class="viewport">          <!-- height: H px; overflow: hidden -->
  <canvas width="BINS" height="2H"></canvas>   <!-- position: absolute; top: 0 -->
</div>
```

Painting a row:

- Build one `ImageData(BINS, 1)` per frame from `getByteFrequencyData`, then
  `putImageData` twice. Two 1-pixel-tall blits, no compositing.
- Render only the bins covering the SSB passband. At 48 kHz with `fftSize = 4096` the
  resolution is ~11.7 Hz per bin and the useful 0–3 kHz of an SSB signal is the first
  ~256 bins; drawing the other 1792 is wasted work and wasted screen.
- `smoothingTimeConstant = 0` — temporal smoothing in the analyser blurs exactly the
  short marker pulses the app exists to show.

Cost control:

- Throttle to ~20–25 fps with a time accumulator inside `requestAnimationFrame`. A
  marker at 25–50 pulses per minute needs nothing near 60 fps, and the row rate sets
  the vertical time scale anyway.
- Stop the loop on `visibilitychange` when `document.hidden`, and resume from the
  existing cursor. `requestAnimationFrame` already throttles in background tabs, but
  the analyser and the audio graph do not.
- If windowing control or overlap is ever needed, that is the point to move the FFT
  into an `AudioWorklet`. `AnalyserNode` gives a fixed Blackman window and no overlap.
  Do not start there.

Startup check, per [RESEARCH.md](RESEARCH.md) §4:

```
after playback starts, sample getByteFrequencyData for ~10 frames.
all-zero across all of them while the element reports playing
  => cross-origin silence, not a quiet band.
show "this receiver does not permit analysis (missing CORS headers)".
```

This is not optional. A CORS-silenced `MediaElementAudioSourceNode` throws nothing,
logs nothing, and looks exactly like a dead antenna.

## 3. Data model

SQLite. A few hundred stations and a slowly growing observation table; Postgres would
add an operational dependency and buy nothing.

The one real modelling problem is **provenance**. Sources disagree — S32's frequencies
are published two different ways, and "active" is a claim with a date on it. So no
frequency, and no activity status, is stored as a bare constant.

```sql
CREATE TABLE station (
  enigma_id     TEXT PRIMARY KEY,       -- 'S28'
  name          TEXT NOT NULL,          -- 'The Buzzer'
  aliases       TEXT,                   -- JSON: ['UVB-76','MDZhB','ZhUOZ','ANVF']
  language      TEXT,                   -- from the ENIGMA prefix
  operator      TEXT,
  tier          TEXT NOT NULL,          -- 'live' | 'scheduled' | 'historical'
  marker        TEXT,                   -- '~1.2s buzz, ~25/min'
  lore          TEXT                    -- long-form, markdown
);

CREATE TABLE frequency (
  station_id     TEXT NOT NULL REFERENCES station(enigma_id),
  khz            REAL NOT NULL,
  mode           TEXT,                  -- 'USB'
  time_of_day    TEXT,                  -- 'day' | 'night' | NULL
  last_confirmed TEXT,                  -- ISO date
  source_url     TEXT NOT NULL,
  disputed       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE schedule (
  station_id  TEXT NOT NULL REFERENCES station(enigma_id),
  rrule       TEXT NOT NULL,            -- RFC 5545, UTC
  khz         REAL,
  source_url  TEXT NOT NULL
);

CREATE TABLE observation (               -- what was actually heard, and when
  id           INTEGER PRIMARY KEY,
  station_id   TEXT NOT NULL REFERENCES station(enigma_id),
  heard_at     TEXT NOT NULL,           -- ISO 8601 UTC
  khz          REAL,
  receiver     TEXT,                    -- node identifier
  marker_only  INTEGER NOT NULL DEFAULT 1,
  notes        TEXT
);
```

`observation` stores metadata about a signal, never its content. That boundary is
what keeps the archive on the right side of §5 of [RESEARCH.md](RESEARCH.md).

Schedules as RFC 5545 `RRULE` strings rather than cron: transmission windows are
expressed as weekday-and-UTC-time patterns with seasonal changes, which is what
`RRULE` is for.

Seeding: hand-parse the ENIGMA v1.3 list once into a fixture. Priyom schedules refresh
on a daily cached fetch per station, with attribution shown in the UI.

## 4. Phase 2 — schedule alerting and archive

Built. Three pieces, all still client-only.

- **Schedule alerts.** Per-slot subscriptions in `localStorage`, checked from the app
  shell every 30 s, notifying 10 minutes ahead via the Notification API. The shell owns
  the poll rather than the schedule view, because a reminder that only fires while the
  user is looking at the schedule is not a reminder. Alerts are per-browser and only
  fire while a tab is open; a service worker or a server is the fix, and the UI states
  the limitation instead of letting the user assume otherwise.
- **Archive links.** Each station detail carries searches into the Shortwave Radio
  Audio Archive, the Internet Archive, the Signal Identification Wiki and Priyom.
  Links out rather than hosted copies: publishing message contents is the regulated
  act (§5 of [RESEARCH.md](RESEARCH.md)), the hobby groups have curated these for
  decades, and duplicating them adds exposure and no value.
- **Marker detection.** Answers "is S28 up right now" without the user reading the
  waterfall, and reports the measured period against the published one.

Method note: the plan originally said cross-correlate the row buffer. The
implementation times rising edges instead. The markers are on/off tones, so
thresholding against the observed dynamic range and taking the median interval between
edges is both simpler and more robust — it uses each sample's real timestamp, whereas
an autocorrelation over a rAF-driven series reads dropped frames as period error.
Measured 2.38 s against a 2.40 s synthetic reference, and 25 pulses/min, which is the
published Buzzer figure. It measures periodicity only; there is no demodulation.

Deliberately not built: persisting detections as `observation` rows. The schema in §3
has the table, but with no backend it would be per-browser state that looks like a log,
so it waits for the server that can hold it.

## 5. Phase 3 — the server

Built, with one part still gated on a decision that is not a coding decision.

The server exists because three things are impossible in the browser alone, and it does
those three things and nothing else.

### 5a. Receiver directory

`GET /api/receivers?khz=&free=` proxies the public KiwiSDR list, 15-minute cache, and
filters to receivers whose published band coverage includes the tuned frequency and
that have a free channel. 855 receivers upstream; 776 of them cover 4625 kHz with a
channel free.

Source note, because the obvious source does not work: **kiwisdr.com/public is behind a
captcha handshake.** It serves a page that replays an `x-kiwi-auth` token before the
list appears, so it is not a source an app may read, and defeating that gate is out of
bounds. The machine-readable list is Pierre Ynard's auto-generated
[rx.linkfanel.net](http://rx.linkfanel.net/) file, published for the dyatlov map maker
and regenerated from kiwisdr.com every few minutes. It sends no CORS headers, which is
why the proxy is needed at all.

This is what puts receiver selection inside the app: the user picks from a list sorted
by reported SNR rather than pasting a hostname from another site.

### 5b. Observations

`GET`/`POST /api/observations`, stored in SQLite via `node:sqlite` — standard library,
so no dependency. Only the `observation` table from §3 is created; stations,
frequencies and schedules are a compiled-in fixture, and empty tables nothing reads
would be scaffolding.

The live view records a hearing when the detector locks, at most once a minute, and the
server folds repeats from the same receiver inside ten minutes into one row — otherwise
the table logs the polling interval rather than the transmissions. The archive shows
them per station under "Heard here". Markers, timing and period only; never content.

### 5c. The relay

`scripts/relay.mjs` runs `kiwirecorder.py --netcat | ffmpeg`, ffmpeg writing an HLS
playlist and segments into `server/stream/`, which the server serves with CORS.

**Icecast is gone.** This plan previously called for Icecast serving Ogg Opus with an
HLS ladder beside it for older Safari. Dropping Icecast removes a daemon, a port and a
codec path, and costs a few seconds of latency on a signal whose content is a buzz
repeating every 2.4 seconds. Safari needs HLS regardless, so building only HLS means
one output rather than two, and the segments are static files the server already knows
how to serve. AAC-LC 32 kbps mono, not Opus: Safari cannot play Opus in MP4 at all.

**Still gated.** Which receiver the relay points at is unresolved, and deliberately not
defaulted, because relaying one node to every listener spends a volunteer's channels
and uplink (§4 of [RESEARCH.md](RESEARCH.md)). The script refuses to start without
`--authorized`, which asserts the receiver is ours or its operator has agreed in
writing. That decision needs hardware or a conversation, not code.

### 5d. The CORS diagnostic

`/diagnostic/marker.wav` and `/diagnostic-nocors/marker.wav` serve the same generated
30-second Buzzer-shaped recording, one with `Access-Control-Allow-Origin` and one
without, and the client requests them from the server's *other* loopback name so both
are genuinely cross-origin. A same-origin media element is never silenced whatever the
headers say, so a same-origin fixture cannot reproduce the failure — that was the first
version of this and it proved nothing.

It exists because cross-origin silence is the one audio failure that throws nothing,
logs nothing, and is indistinguishable from a dead antenna, so the check in §2 needs a
way to be re-proved after any change to the audio graph.

## 6. Theme and UI

Mobile layout and the full animation system are specified separately, in
[MOBILE_UI_SPEC.md](MOBILE_UI_SPEC.md), as a handoff document for design work. What
follows is the direction that specification is built on.


The original brief's direction stands and needs no research to justify: dark-first,
monospace for data, sans-serif for chrome, and the four themes (Phosphor Green, Amber
Terminal, Midnight Blue, High Contrast Red).

Two constraints worth writing down:

- Those palettes are all low-contrast by nature. Every one of them has to clear
  WCAG AA for text, which for amber-on-black and green-on-black means picking the
  accent for contrast first and letting the glow be decoration.
- The waterfall colour map should be perceptually uniform (viridis, inferno) rather
  than a hue ramp, so pulse amplitude reads correctly. Keep the theme accent for UI
  chrome and leave the spectrogram to a colormap that does not lie about magnitude.
