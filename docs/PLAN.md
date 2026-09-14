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
- Render only the bins covering the SSB passband. As built this is `fftSize = 2048`
  against a 12 kHz context — the receiver's own rate, so nothing is resampled — giving
  ~5.9 Hz per bin, and the useful 0–3 kHz of an SSB signal is the first ~512 of 1024
  bins; drawing the rest is wasted work and wasted screen.
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
  marker        TEXT,                   -- '1.25 s buzz, 1.85 s pause, ~19/min'
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
  station_id    TEXT NOT NULL REFERENCES station(enigma_id),
  rrule         TEXT NOT NULL,          -- RFC 5545, UTC
  khz_by_month  TEXT NOT NULL,          -- JSON: twelve entries, January first
  source_url    TEXT NOT NULL
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

A slot carries twelve frequencies rather than one because that is how the schedules are
published — E11's 03:15 slot runs 8102 kHz in January and 16530 kHz in May — and a
single frequency with a note saying it rotates is wrong eleven months of the year.

Seeding: hand-parse the ENIGMA v1.3 list once into a fixture. Priyom schedules are
imported by [`scripts/import-priyom.mjs`](../scripts/import-priyom.mjs), reviewed as a
diff, with attribution shown in the UI.

## 4. Phase 2 — schedule alerting and archive

Built. Three pieces, all still client-only.

- **Schedule alerts.** Per-slot subscriptions in `localStorage`, checked from the app
  shell every 30 s, notifying 10 minutes ahead via the Notification API. The shell owns
  the poll rather than the schedule view, because a reminder that only fires while the
  user is looking at the schedule is not a reminder. **Superseded on Android**: the
  packaged build hands the schedule to the OS instead and fires with the app closed, and
  its WebView has no Notification API at all, so the browser path could never have
  worked there. A browser is still limited to an open tab, and the UI states which of
  the two it has.
- **Archive links.** Each station detail carries searches into the Shortwave Radio
  Audio Archive, the Internet Archive, the Signal Identification Wiki and Priyom.
  Links out rather than hosted copies: publishing message contents is the regulated
  act (§5 of [RESEARCH.md](RESEARCH.md)), the hobby groups have curated these for
  decades, and duplicating them adds exposure and no value.
- **Marker detection.** Answers "is S28 up right now" without the user reading the
  waterfall, and reports the measured period against the published one.

Method note: the plan originally said cross-correlate the row buffer. The
implementation times rising edges instead. The markers are on/off tones, so taking the
median interval between edges is both simpler and more robust — it uses each sample's
real timestamp, whereas an autocorrelation over a rAF-driven series reads dropped frames
as period error.

*What* gets thresholded took three attempts and only the on-air test found the problems.
A slow per-bin baseline now estimates the noise floor, the bin that swings most is
tracked, its excursion is smoothed before thresholding, and every time constant is wall
time rather than frames. The header comment in `src/detector.ts` records each failure and
why a green test suite missed it. It measures periodicity only; there is no
demodulation.

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
repeating every three seconds. Safari needs HLS regardless, so building only HLS means
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

## 7. Phase 4 — the observation network, the rabbit hole, and credit

Phases 1 to 3 built an instrument. Phase 4 is about what the instrument produces and
who else it credits.

**There is no donation page and no funding ask.** An earlier draft of this section
planned one, sequenced under Priyom's and ENIGMA 2000's own support links, to pay for
the owned receiver of §5c. That is dropped: the app stays free and open source, and the
only support links it carries are theirs. Anyone reading this later should take the
absence as a decision, not an omission.

### 7a. The loop

The three parts of this phase are not separate features. They feed each other:

The live scanner produces observations. Observations make the live view trustworthy:
knowing when a station was last actually heard is the difference between a quiet band
and a dead station, and nothing else available says which. **Built**, as "last heard"
rather than the "four of six listeners" this section first imagined — counting
listeners would need an identifier distinguishing them, the receiver name that used to
serve was removed as a third party's business, and a recency answer settles the same
question without one. Aggregated
observations become an archive nobody else has, because Priyom logs messages and the
ENIGMA list logs identity, while nobody logs marker behaviour continuously at scale.
That archive is the thing this project contributes back, and it is worth building for
the live view alone — without it, a quiet band and a dead station look identical.

This is why the scanner stays the first tab. It is not competing with the archive for
prominence; it is the thing that fills it.

### 7b. The fixture has to become data

Built. The roster was 589 lines of typed fixture, which made every correction a code
change, a rebuild and — since the Android wrapper — a reshipped APK. That is
survivable for a roster that never moves and fatal for an archive whose whole value is
currency, with `lastConfirmed` dates that rot silently.

The move is to versioned JSON in the repository, not to a database with an admin UI.
Git history and pull-request review are what make the provenance rule of §3 an
enforceable check rather than a promise; an admin form writing to SQLite loses both.

- Station data lives as JSON in the repo, schema-validated in CI. A frequency without
  a `sourceUrl` and a `lastConfirmed` fails the build.
- The server serves it with an `ETag`; the client caches it and falls back to the
  copy bundled at build time, so the offline and server-less paths keep working.
- Data corrections ship without a release.

Staleness then gets surfaced rather than hidden: a station detail showing "confirmed
14 months ago" in dim text is honest, and it is also what generates the corrections
described in 7f.

**This landed before the rabbit-hole work, because the schema is about to grow.**

Three of the seven views in 7e need fields the `Station` type does not have today, and
an earlier draft of this plan wrongly assumed the dates were already present:

| Needed for | Field | Sourcing |
|---|---|---|
| Timeline, On this day | `activeFrom`, `activeUntil` | **Built.** Per-station, sourced, and often only known to the year. |
| Exits — successor | `succeeds` / `succeededBy` | New. Hand-curated; a few dozen pairs at most (V02a to HM01, and so on). |
| Map | transmitter site name and coordinates | New, partial by nature — many sites are unknown or only attributed to a district. |

`lastConfirmed` is not a start date and must not be drawn as one. Growing a hand-edited
TypeScript fixture by three more fields across 141 entries is worse work than growing
reviewed JSON, which is the second reason 7b comes first.

### 7c. Live: raise the success rate

The live view fails quietly on a first run. It needs a reachable KiwiSDR, the right
frequency and the right hour, and a new user has no way to know they have picked
wrongly — the observed failure was 3756 kHz at 11:45 UTC, which is The Pip's night
frequency. Four fixes, all built on parts that already exist:

1. **Time-aware frequency default.** `Frequency.timeOfDay` is already in the schema and
   already shown in the station row. Default the selector to the correct one for the
   current UTC hour.
2. **One-tap "find me a receiver".** `/api/receivers` already ranks by reported SNR for
   the tuned frequency and filters to nodes with a free channel. Take the top result and
   connect, instead of requiring the user to browse and choose.
3. **Fallback chain.** Public nodes die constantly. On a failed connect, try the
   next-best and say so, rather than ending the session on one 1006.
4. **"Hearing it now".** From the observation network — the line that tells a user
   whether the silence is the band or the station.

(4) depends on 7d and is the strongest single argument for building it.

Cheaper than it sounds, because the propagation overlay is already wired: when the
tuned frequency is above the MOF for the path, say so, rather than painting a dead
waterfall and leaving the user to guess.

### 7d. The observation network

`observation` exists in the schema from §5b and nothing meaningful writes to it. The
detector already measures period, consistency, tracked bin and uptime every session.

Phase 4 writes that, opt-in, and reads it back as aggregates. **The opt-in is built**
and it closed a gap rather than adding a feature: the app had been posting a detection a
minute from the moment the detector locked, with nothing said and no way to decline. It
is off by default and the gate sits in `src/api.ts`, the only module that talks to the
server, so a view cannot forget to check it. The contribution is
metadata about a signal and never its content, which is the same boundary §5 of
[RESEARCH.md](RESEARCH.md) draws for everything else here; user-contributed data does
not get a weaker rule than imported data.

Ship the write path and the opt-in before building aggregation, and confirm a single
phone produces usable data over a week. If contributions do not arrive, the aggregate
views in 7c and 7e have nothing behind them — so this is the assumption to test cheaply
and early.

### 7e. The rabbit hole

The archive is where most sessions will spend their time, because hearing a marker
requires a working node and the right hour while 141 stations of history always load.
Ranked by uniqueness against cost:

1. **Station deep links.** `main.ts` routes tabs only — `#live`, `#schedule`,
   `#archive`. There is no `#station/S28`, so no station is shareable and nothing can
   link into the archive from outside. A prerequisite, not a feature.
2. **Exits on every detail page.** Three minimum: same designator family, same
   operator, and successor. The first two are derivable from fields that already exist;
   the third needs the new field in 7b.
3. **Designator decoder.** **Built**, and as a filter rather than only a legend.
   `PREFIX_MEANING` already encodes the taxonomy — E, G and S
   for voice languages, M for Morse, F, P and X for digital. One screen turns 141
   opaque codes into a readable system. The highest payoff per hour in this list.
4. **Timeline.** **Built**, and no longer sparse: 73 of the 141 stations carry a date
   since the descriptions were imported. 18 have a sourced start and 66 a sourced end,
   twelve of them both; the remaining row is M08a, placed by its `lastConfirmed` alone.
   It is still honest about which dates are events and which are only sightings — see
   [RESEARCH.md](RESEARCH.md) §9.
5. **On this day.** Cheap once the dates exist, and it is what brings people back.
6. **Map.** Transmitter sites, partial by construction under the provenance rule — no
   coordinate is guessed, and the map says which sites are unplaced rather than
   quietly omitting them.
7. **Spectrogram fingerprint per station.** Generated from contributed observations.
   Genuinely unique, and depends on 7d.

Two things stay out. Hosting recordings is a rights question rather than a technical
one, and links into the existing archives already serve it. Comments and forums are a
moderation load a single maintainer should not take on.

### 7f. Credit and corrections

**Built.** **Credit is contextual first.** An acknowledgement page on its own is where
credit goes to die. Every station already carries its `sourceUrl`, so every station detail states
where its identity and status came from, and the archive header names both projects
persistently. The deep page — who Priyom and ENIGMA 2000 are, what they have built and
over how long, and how to support them directly — is reached from those lines. It is
good rabbit-hole content in its own right, not a legal footer.

**Built.** **Contact is a correction pipeline, not a mailbox.** A generic form collects spam. The
useful thing is a "report a correction" action attached to the station being viewed,
prefilled with the designator and the field, requiring a source URL, and becoming an
issue. It composes a GitHub issue rather than posting to a review queue here: this
section assumed a server, and the server binds to loopback while the static client and
the Android build run without one, so a posted form would have reached only the
maintainer. A plain address covers everything else. With
7b in place that closes the loop: staleness surfaced, correction reported, change
reviewed, data endpoint updated, app current without a release.

**The only support links are theirs.** The credits page carries Priyom's and ENIGMA
2000's, with the plain statement that this project's station data is theirs, and none
of its own. That is the whole of it — there is no second half of the page, no ledger and
no goal. It also settles the question the credit page exists to answer, permanently: a
reader who wonders whether this project is profiting from volunteer work can see that
it is not.

The correction path can ship as soon as 7b lands.

### 7g. Order, and what gates what

1. Write to Priyom and ENIGMA 2000: what this is, that they are credited per station,
   and that support routes to them. Everything below stands on their data, so they
   should hear it from us rather than find it. Priyom's contact is the `#priyom` IRC
   channel on Libera; ENIGMA 2000 have a form at signalshed.com. It does not gate the
   rest, now that no money is involved.
2. Fixture to JSON, with CI validation and the served endpoint (7b). Unblocks the new
   fields, the corrections path and the deep links.
3. Live success-rate fixes 1 to 3 (7c). Cheapest visible win, and independent of
   everything else.
4. Observation write path and opt-in (7d), then the "hearing it now" line.
5. Deep links and in-situ credit (7e.1, 7f).
6. Credits page (7f). **Built.**
7. Designator decoder **(built)**, then timeline **(built)** (7e.3, 7e.4).
