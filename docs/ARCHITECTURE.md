# Architecture

How a sample gets from a transmitter to the screen, and which module owns which
decision. Written for whoever maintains this next.

Product definition and data model are in [PLAN.md](PLAN.md); station facts and the legal
boundary are in [RESEARCH.md](RESEARCH.md); the server's surface is in [API.md](API.md).
This document is the wiring.

## Shape

A Vite + TypeScript client with no framework, and a Node server with no dependencies.

```
                      ┌─ the user's own browser ─────────────────────────┐
 4625 kHz             │                                                  │
 transmitter          │   KiwiSource ── AudioWorklet ── AnalyserNode      │
     │                │   (WebSocket)   (ring buffer)        │            │
     ▼                │                                      ├─ speakers │
 public KiwiSDR ══════╪══ ws:// ═══════════╯                  │            │
 (volunteer's)        │                                  Waterfall        │
                      │                                   (canvas)        │
                      │                                      │            │
                      │                                  onRow(t, bins)   │
                      │                                      ▼            │
                      │                              MarkerDetector       │
                      │                                      │            │
                      │                                 DetectorStrip     │
                      └──────────────────────────────────────┬───────────┘
                                                             │ observation
                      ┌─ our server (loopback) ──────────────▼───────────┐
                      │  /api/observations ── node:sqlite                 │
                      │  /api/receivers ───── rx.linkfanel.net (proxied)  │
                      │  /stream/ ─────────── relay HLS, with CORS        │
                      └───────────────────────────────────────────────────┘
```

The audio never touches our server. The user's browser connects straight to the
receiver they chose, which is both an architectural choice and an ethical one: relaying
someone else's receiver spends their hardware, and [RESEARCH.md](RESEARCH.md) §4 says
not to.

## The signal path

**1. Transport — [`src/audio/kiwi.ts`](../src/audio/kiwi.ts).**
A WebSocket to `ws://<host>/<unix-seconds>/SND`. Every frame is binary with a three-byte
ASCII tag: `MSG` carries `key=value` parameters, `SND` carries audio as flags (u8),
sequence (u32 LE), S-meter (u16 BE), then samples. `SET compression=0` during the
handshake asks for raw signed 16-bit instead of IMA ADPCM, which is why there is no
ADPCM decoder in the tree. Ordering matters: the Kiwi ignores mode and frequency until
it has been told the audio rate is accepted, so the `sample_rate` message is the cue to
configure everything else.

A WebSocket is not subject to the cross-origin silence rule that afflicts media
elements. It has a mixed-content problem instead, which is the app's largest constraint
— see [README](../README.md#deployment-constraint).

**2. Buffering — [`public/pcm-player.js`](../public/pcm-player.js).**
Bursts arrive on the main thread; the audio graph needs 128-frame blocks on the audio
thread. A ring-buffer `AudioWorkletProcessor` bridges the two and resamples linearly
when the context rate does not match the source. Plain JavaScript in `public/` because
a worklet is loaded by URL at runtime, not imported.

**3. Analysis — [`src/audio/analyser.ts`](../src/audio/analyser.ts).**
`fftSize` 2048 against a 12 kHz context gives 1024 bins over 0–6 kHz; only the first
~512 cover the 0–3 kHz an SSB signal occupies, and only those are drawn or analysed.
`smoothingTimeConstant` is 0 — the analyser's temporal averaging blurs exactly the short
marker pulses this app exists to show.

`waitForSignal()` lives here, and it is not optional. A cross-origin
`MediaElementAudioSourceNode` outputs silence with no error and no log, and a busy
receiver that accepts a connection without sending looks identical. Nothing else in the
system can tell those apart from a dead antenna.

It polls on a timer for eight seconds rather than sampling a fixed number of animation
frames. The frame-counting version expired in about half a second, which was shorter
than the first audio took to cross a mobile network and fill the worklet's ring buffer,
so the app warned about silence while the marker drew on screen. What silence *means*
comes from the transport — `AudioSource.silenceHint` — because only it knows whether to
blame a full receiver or a missing CORS header.

**4. Rendering — [`src/waterfall.ts`](../src/waterfall.ts).**
A canvas twice the viewport height with every row written twice, at `y = cursor` and
`y = cursor + rows`, translated by `-(cursor + 1)`. The window of consecutive rows
ending at the cursor is then always contiguous, so the transform never crosses the wrap.
Cost is two one-pixel `putImageData` calls per row.

The single-height version — one row at `y = cursor`, translate by `-cursor` — scrolls
the wrong way and tears at every wrap. That is the first thing to re-derive if someone
"simplifies" this.

**5. Interpretation — [`src/detector.ts`](../src/detector.ts).**
Fed the whole passband frame, not a summary, because *which bin matters* is its
decision. A slow per-bin baseline estimates the noise floor, the bin that swings most is
tracked, and that bin's smoothed signed excursion is thresholded with hysteresis. It
measures periodicity and nothing else — no demodulation, ever.

Every constant is in wall time, never frames. The three things that made this module
wrong on a real signal are recorded in its header comment; read that before touching it.

## Module ownership

| Concern | Owner |
|---|---|
| Which receiver, and remembering it | [`src/receiver.ts`](../src/receiver.ts) + `localStorage` |
| Station facts, tiers, provenance | [`data/stations.json`](../data/stations.json) |
| Loading, caching and refreshing that roster | [`src/data/stations.ts`](../src/data/stations.ts) |
| Validating it, at build time and on arrival | [`src/data/schema.ts`](../src/data/schema.ts) |
| Recurrence arithmetic, countdown formatting | [`src/schedule.ts`](../src/schedule.ts) |
| Alert subscriptions and the due check | [`src/alerts.ts`](../src/alerts.ts) |
| Server calls, degrading when absent | [`src/api.ts`](../src/api.ts) |
| Component markup | [`src/ui.ts`](../src/ui.ts) |
| Tokens and layout | [`src/style.css`](../src/style.css) + [`src/tokens/`](../src/tokens) |

Three rules that hold the seams together:

- **A view owns its audio graph, timers and intervals, and returns `{ element, destroy }`.**
  The shell calls `destroy` on every navigation. Leaving a WebSocket to a volunteer's
  receiver open behind a hidden view is how you get a node to block you.
- **The shell owns the alert poll, not the schedule view.** A reminder that only fires
  while the user is looking at the schedule is not a reminder.
- **The client must work without the server.** `available()` is resolved once and
  cached; the three server-dependent features hide rather than fail.

## Decisions worth not re-litigating

**No framework.** The app is three views of mostly static markup over a compiled-in
fixture. `innerHTML` strings plus a handful of event delegates cover it, and the one
place performance matters — 141 archive rows alongside a 20 fps canvas — is better
served by classes in one stylesheet than by per-row inline styles. The design bundle
ships React components as a *reference*; they are reimplemented here, not shipped. See
[`Project Echo Design System/HANDOFF.md`](../Project%20Echo%20Design%20System/HANDOFF.md).

**No Icecast.** The plan originally called for Ogg Opus over Icecast with an HLS ladder
beside it. HLS alone is one `ffmpeg` output instead of two, needs no daemon, and the
extra few seconds of latency are meaningless for a buzz that repeats every three
seconds. AAC-LC rather than Opus, because Safari cannot play Opus in MP4.

**SQLite, and only the `observation` table.** A few hundred stations do not justify
Postgres, and `node:sqlite` is stdlib so the server has no dependencies. Stations,
frequencies and schedules are a reviewed JSON file instead of rows: git history is
what records who changed a fact and on what evidence, and a pull request is where the
provenance rule is enforced by a person. An admin form writing to a table would lose
both. See [`data/README.md`](../data/README.md).

**Frequencies are rows with provenance, not constants.** S32's are published two
different ways by sources that do not retract each other, so the schema stores both with
a `disputed` flag and the interface shows the disagreement. The same discipline caught a
wrong period for S28 ([RESEARCH.md](RESEARCH.md) §7).

**Two audio sources exist because both are needed now.** `SyntheticSource` generates a
marker so the waterfall and detector can be exercised without occupying a volunteer's
receiver — for development, and for anyone who wants to see the app work before finding
a node. It is labelled **Demo** in the interface: the first person to use the app asked
what "Synthetic" was for, which is a fair question about a button that fabricates a
signal. `RelaySource` is the media-element path. Neither is a hook left open for later.

## Testing

`npm test` — 62 tests over the pure logic: detector thresholds and wording, RRULE
evaluation and countdown formats, receiver storage and its migration, alert dedupe, and
the upstream directory parse.

The detector tests feed synthesised **spectra**, not scalar levels, and three of them
encode failures found only against a real receiver: a loud AGC band, three different
frame rates, and dropouts inside a pulse. Keep them. Every one of those bugs passed a
green suite that fed clean synthetic tones.

What tests cannot cover, and what therefore needs a browser: the KiwiSDR protocol
against real hardware, the CORS silence check, and anything rAF-driven. The procedures
are in [RUNBOOK.md](RUNBOOK.md).
