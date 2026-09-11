# Project Echo

A shortwave channel-marker monitor and numbers-station archive.

It connects to a public KiwiSDR the user chooses, renders a scrolling spectrogram,
detects whether the marker is actually transmitting and at what period, lists 141
stations with their provenance and links into the established recording archives, and
notifies ahead of published transmission windows.

```bash
npm install
npm start
```

Then open <http://127.0.0.1:8080>. That runs the build and the server together.

The client also runs standalone with `npm run dev` on <http://127.0.0.1:5173>, without
the server. Three features need the server and hide themselves without it: the
in-app receiver directory, saved observations, and the relay.

```bash
npm test        # 81 tests: detector, schedules, alerts, receivers, directory, station data
npm run typecheck
```

To try it on a phone, `npm run android:apk` writes a debug APK — see
[docs/ANDROID.md](docs/ANDROID.md), which also covers the three features that hide
themselves inside it.

## Interface

The phone layout is built: a bottom tab bar, bottom sheets for receiver, station and
directory selection, a full-screen station detail pushed over the archive, and the
motion system from [docs/MOBILE_UI_SPEC.md](docs/MOBILE_UI_SPEC.md). At 768 px and up
it reflows back to the desktop layout — navigation above the content, two-column
archive, sheets as centred dialogs.

Design tokens and the five self-hosted JetBrains Mono weights come from
`Project Echo Design System/`, produced by Claude Design against that spec and copied
in unchanged ([src/tokens/](src/tokens), [public/fonts/](public/fonts)). Its React
components are a design reference, not shipped code; they are reimplemented in this
codebase's idiom in [src/ui.ts](src/ui.ts).

Fourteen animations exist and are listed in the spec. If it is not on that list, it
does not exist. Only `transform`, `opacity` and `filter` animate — the alert switch's
track colour is the one documented exception, because a track is never near the
waterfall. Two loops are permitted while audio streams: the detector's 2 px scanning
bar, and the directory skeletons, which only run while fetching.

Not implemented, and flagged as such in the design bundle too: the gestures
(long-press freeze, vertical scrub, drag-to-dismiss, edge-swipe back) and the landscape
layout.

| View | What it shows |
|------|---------------|
| **Live** | Receiver list, station and frequency selector, scrolling waterfall, marker detector, propagation map. Only the three continuously-transmitting Russian markers are offered — see below. |
| **Schedule** | Next transmission windows in UTC and local time, with countdowns and per-slot alerts. |
| **Archive** | All 141 stations: 3 live markers, 26 scheduled, 112 historical. Filterable, with per-frequency sources and dates, plus searches into the recording archives. |

Four themes (Phosphor Green, Amber Terminal, Midnight Blue, High Contrast Red),
remembered in `localStorage`.

### Receivers

**Browse directory** lists the public KiwiSDRs that cover the tuned frequency and have
a free channel, sorted by reported SNR — 776 of 855 for 4625 kHz at the time of
writing. Saving one adds it to your own list; several can be saved, which is genuinely
useful because the node that hears 4625 kHz well is rarely the one that hears 5448 kHz
well. Hosts can still be pasted by hand, and saved receivers work without the server.

No hostnames are compiled into the app: the public list changes constantly and a baked
copy would rot into a menu of dead hosts. The directory is proxied live instead, from
[rx.linkfanel.net](http://rx.linkfanel.net/) — kiwisdr.com/public itself is behind a
captcha handshake and is not a source an app may read.

Saving a receiver only stores its address locally. Your audio connection still goes
straight to that node, under that node's own rules; the app never relays someone else's
receiver.

### Marker detection

A slow per-bin baseline estimates the noise floor, the bin that swings most is tracked,
and that bin's smoothed excursion is thresholded with hysteresis. Every time constant is
wall time, not frames, because the waterfall throttles and drops frames. It reports the
measured period against the station's published one.

Taking the loudest bin across the whole passband instead — the obvious approach, and the
first one here — works on a synthetic tone and never locks on a real receiver, where the
band is loud everywhere and AGC holds the floor up. See the header comment in
[src/detector.ts](src/detector.ts) for the three separate causes that had to be fixed,
each of which passed a green test suite.

Measured on air through a KiwiSDR in France: a stable 3.40 s for The Buzzer, which is
how [docs/RESEARCH.md](docs/RESEARCH.md) §7 came to correct the widely-repeated figure
of 25 pulses per minute.

It measures periodicity and nothing else. There is no demodulation and no decoding, by
design rather than by omission.

### Alerts

Per-slot subscriptions, checked from the app shell every 30 seconds, notifying 10
minutes before a window. They are per-browser and only fire while a tab is open: there
is no service worker, because the app must be served over plain http. The schedule view
says so rather than letting you assume otherwise.

## Why it is a marker monitor and not a numbers scanner

Of the stations people associate with numbers broadcasts, almost none are still on the
air. Atención (V02a) stopped in February 2019; its digital successor HM01 has been off
since a transmitter failure on 23 August 2024; V15 last transmitted on 12 March 2020;
V24 was last heard in September 2020; the Lincolnshire Poacher ended in 2008.

What does transmit continuously is the Russian channel markers — The Buzzer (S28), The
Pip (S30) and The Squeaky Wheel (S32). Those are what the live view offers. The
message-carrying stations that are still active transmit in windows of a few minutes,
a few times a week, which is a scheduling and alerting problem rather than a live one.

Full sourcing in [docs/RESEARCH.md](docs/RESEARCH.md); build order in
[docs/PLAN.md](docs/PLAN.md).

## Deployment constraint

**The app has to be served over plain http, which is why there is no hosted build.**

Public KiwiSDR nodes are almost all plain `http://` on non-standard ports, so their
WebSocket endpoints are `ws://`. A page served over `https://` cannot open a `ws://`
socket — mixed content — and browsers give no override. Serving the app over http and
connecting to http nodes is consistent; anything else fails at connect time.

The fix is not a proxy in front of someone else's receiver. It is owned hardware behind
our own `wss://`, which is Phase 3 in [docs/PLAN.md](docs/PLAN.md) and needs a receiver
and an antenna before it needs code.

## Documentation

| Document | For |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How a sample gets from the transmitter to the screen, module ownership, decisions worth not re-litigating |
| [docs/API.md](docs/API.md) | The server's endpoints, shapes and status codes |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Starting it, verifying a deployment, and diagnosing every failure this project has actually hit |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Station facts, sources, and the legal boundary |
| [docs/PLAN.md](docs/PLAN.md) | Product definition, data model, the three phases |
| [docs/MOBILE_UI_SPEC.md](docs/MOBILE_UI_SPEC.md) | The phone layout and the fourteen-item motion inventory |
| [docs/ANDROID.md](docs/ANDROID.md) | Building and installing the test APK, and what does not work inside it |
| [data/README.md](data/README.md) | Editing the station roster, and how a correction reaches an installed app |

## Architecture notes

Three details are load-bearing and easy to undo by accident. The full picture is in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**The waterfall canvas is twice the height of its viewport, and every row is written
twice.** Writing one row per frame at `y = cursor` on a viewport-height canvas and
translating by `-cursor` scrolls the wrong way and tears at every wrap. With a
double-height canvas and each row written at both `y` and `y + rows`, the window of
consecutive rows ending at the cursor is always contiguous, so the transform never
crosses the wrap. See [src/waterfall.ts](src/waterfall.ts).

**`SET compression=0` is why there is no ADPCM decoder.** The KiwiSDR protocol defaults
to IMA ADPCM; asking for uncompressed audio gets raw signed 16-bit samples instead. See
[src/audio/kiwi.ts](src/audio/kiwi.ts).

**Audio arrives over a WebSocket, not a media element, so there is no CORS silence
problem — but the liveness check stays.** A cross-origin `MediaElementAudioSourceNode`
outputs silence with no error and no log, and a busy Kiwi that accepts the connection
without sending audio looks identical. Both are caught by
[`waitForSignal`](src/audio/analyser.ts), which reports the difference between "band is
quiet" and "nothing is arriving". It waits eight seconds, not half a second: the first
version timed out before audio had crossed a mobile network and reported a stall over a
signal the waterfall was drawing beside it. If audio turns up after the warning, the
warning clears.

## Data

Station identity, operator and status come from the [Priyom.org](https://priyom.org/)
category indexes, cross-checked against the
[ENIGMA 2000](http://www.signalshed.com/) control list. Frequencies carry their own
source URL and confirmation date, and a `disputed` flag where sources conflict — S32 is
published as both 5473/3828 kHz and 5367/3363.5 kHz, and the app shows both rather than
picking one.

The roster lives in [data/stations.json](data/stations.json), not in the source. The
build inlines a copy so the app has all 141 stations offline and with no server, and
`GET /api/stations` serves the current file so a correction reaches an installed
Android build without a release — applied at its next launch. `npm test` validates the
committed file, which is what keeps the provenance rule enforceable now that the
compiler no longer sees the literals. Editing rules: [data/README.md](data/README.md).

Propagation is [prop.kc2g.com](https://prop.kc2g.com/)'s MOF/LOF map: IRI-2016
conditioned on live ionosonde data, regenerated every five minutes.

## Scope boundary

The app records observations about signals — frequencies, markers, timing — and never
their contents. Reception is legal nearly everywhere; publishing the contents of
non-broadcast transmissions is regulated (47 U.S.C. § 605 in the US, the Wireless
Telegraphy Act 2006 in the UK). Message decoding is not a missing feature, it is out of
scope. [docs/RESEARCH.md](docs/RESEARCH.md) §5 has the detail.

## The relay

`scripts/relay.mjs` turns one receiver into an HLS stream every listener shares:

```bash
node scripts/relay.mjs --host my-kiwi.example.org:8073 --khz 4625 \
     --kiwiclient ../kiwiclient --authorized
```

Needs `ffmpeg` on PATH and a checkout of
[kiwiclient](https://github.com/jks-prv/kiwiclient). It writes HLS into
`server/stream/`, which the server serves with CORS; the app's **Play relay** button
reads it.

`--authorized` is required and has no default. Relaying one node to every listener
spends that receiver's channels and uplink, so the flag asserts the receiver is yours
or its operator agreed in writing. Pointing this at a volunteer's node without asking
is the thing [docs/RESEARCH.md](docs/RESEARCH.md) §4 exists to prevent.

Full procedure, verification and rollback: [docs/RUNBOOK.md](docs/RUNBOOK.md).

There is no Icecast. The plan originally wanted Ogg Opus over Icecast with an HLS
ladder beside it; HLS alone is one output instead of two, needs no daemon, and costs a
few seconds of latency on a buzz that repeats every three seconds. AAC-LC rather than
Opus, because Safari cannot play Opus in MP4.

## Diagnostics

The recording is generated rather than committed, so a fresh clone needs it once:

```bash
npm run diagnostic-wav
```

Under **Diagnostics** in the live view: a generated 30-second Buzzer-shaped recording,
served with and without CORS headers from the server's other loopback name, so both are
genuinely cross-origin. The first should give a waterfall and a detected period; the
second should report silence. If the second one paints, the silence check has regressed
and the app can no longer tell a CORS failure from a dead antenna — treat that as a
release blocker.

The four-step deployment check, and what every failure symptom means, are in
[docs/RUNBOOK.md](docs/RUNBOOK.md).

## Not built yet

- The relay is written but has never run end to end here: it needs `ffmpeg` and a
  receiver that is ours to relay. Both are open.
- Corrections still arrive as pull requests. `GET /api/stations` ships them to
  installed clients without a release, but there is no in-app way to report one yet.
- Schedules imported for E11 only, and partially — Priyom lists further slots through
  20:00 UTC. The schedule view states the coverage so a short list reads as an import
  gap, not a quiet band.
