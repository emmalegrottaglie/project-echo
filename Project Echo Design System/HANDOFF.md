# Handoff: Project Echo — phone layout

## Overview

Project Echo is a shortwave channel-marker monitor and numbers-station archive. A user
picks a public KiwiSDR receiver, tunes one of three Russian channel markers that transmit
continuously, and watches a scrolling spectrogram while the app reports whether the marker
is actually on the air and at what pulse period. Alongside that: an archive of 141
stations — almost all dead — with per-frequency provenance, and reminders before the few
stations still carrying traffic are due to transmit.

This handoff covers the **phone layout**: moving the existing desktop build (three
hash-routed views, header nav) to a bottom-tab-bar interface with bottom sheets, a
full-screen pushed detail view, and a specified motion system. The desktop layout at
≥ 768 px is explicitly unchanged and out of scope.

The aesthetic is **instrument, not dashboard**. The user is watching a real signal arrive
from a transmitter they cannot see, and the interface's job is to stay out of the way of
that.

## About the design files

Everything in this bundle is a **design reference created in HTML** — prototypes showing
intended look and behaviour, not production code to lift. `ui_kits/echo-mobile/index.html`
is a click-through mock built with React 18 + in-browser Babel; the files under
`components/` are cosmetic React implementations that read CSS custom properties.

**The task is to recreate these designs in the target codebase**, which is
`numberstationsApp`: vanilla TypeScript with Vite, no framework, views built by
`document.createElement` + `innerHTML` strings, styling in a single `src/style.css`. The
JSX here is not the shape to ship — port each component into that idiom, or introduce a
framework as a deliberate, separate decision.

Two parts of this bundle **are** production-ready and should be copied close to verbatim:

- `tokens/*.css` — the custom properties. `tokens/colors.css` already carries the four
  theme blocks in the exact form `src/style.css` uses.
- `assets/fonts/*.woff2` — five self-hosted JetBrains Mono weights, with `@font-face`
  rules in `tokens/fonts.css`.

## Fidelity

**High-fidelity.** Colours, type scale, spacing, radii, durations, easings and copy are
final and sourced — most from `docs/MOBILE_UI_SPEC.md` (itself written against the working
implementation) and from `src/style.css` verbatim. Every number below is a real number,
not an approximation. Recreate the UI pixel-accurately.

Three known gaps, flagged rather than hidden:

1. **The waterfall is a static representation** in the mock. The real implementation
   already exists in `src/waterfall.ts` and must not be replaced by anything in
   `components/instrument/WaterfallPanel.jsx`.
2. **Gestures are documented but not implemented:** long-press freeze, vertical scrub,
   drag-to-dismiss, edge-swipe back.
3. **Landscape, the 360 × 800 Android reflow and the 768 tablet reflow are not drawn.**
   Their rules are stated below.

---

## Screens

Artboard: **393 × 852** (iPhone 15 Pro logical). Breakpoints: ≤ 480 px phone (primary),
481–767 px large phone, ≥ 768 px existing desktop layout unchanged.

Shell on every tab: app header (56 px, fixed) → tab content (own scroller) → bottom tab
bar (56 px + `env(safe-area-inset-bottom)`, fixed). On the Live tab a transport bar sits
between content and tab bar, also fixed.

Per-screen and per-component specifications — layout, exact paddings, type, colours,
copy, and the rules that apply to each — are in the `.prompt.md` file beside every
component. **Read those; they carry the constraints that don't fit in a props table.**
The dense state/variant sheets are the `*.card.html` files in each component directory.

### Live tab

Vertical order: receiver row → station row → status line → **full-bleed waterfall** →
detector strip → (collapsed Propagation and Diagnostics) → fixed transport bar.

- **Receiver row / station row** (`components/instrument/ReceiverRow.jsx`) — one
  truncating line each, `min-height:44px`, `padding:8px 16px`, 12 px uppercase sans label
  over a 14 px mono value, trailing `›`. Tapping opens the matching sheet. Live-tier
  stations carry an 8 px pulsing dot; disputed frequencies carry the `disputed` flag.
- **Status line** (`components/instrument/StatusLine.jsx`) — `padding:8px 12px`,
  `border-left:2px solid <tone>`, `background:var(--panel)`, mono 14 px,
  `role="status" aria-live="polite"`. Copy per phase: `idle` · `connecting to Moscow
  region…` · `running — Moscow region · KO85` · the stalled string below.
- **Waterfall** (`components/instrument/WaterfallPanel.jsx`) — full bleed to both screen
  edges, `height:320px`, `border-radius:0`, `background:#000`. Frequency scale on the
  leading edge: 34 px wide, `linear-gradient(90deg, rgba(0,0,0,.72), transparent)`, labels
  `3k / 2k / 1k / 0` in mono 12 px `var(--dim)`. **Newest row at the bottom.**
- **Detector strip** (`components/instrument/DetectorStrip.jsx`) — a 2 px track over a
  text row at `padding:12px 16px`, mono 14 px. Four states, table below.
- **Transport bar** (`components/instrument/TransportBar.jsx`) — `padding:8px 16px`,
  `padding-bottom: calc(8px + env(safe-area-inset-bottom))`,
  `border-top:1px solid var(--border)`, `background:var(--panel)`. Primary control
  `flex:1`, 48 px; secondary 132 px × 48 px labelled `Synthetic`, hidden without the
  server.

**Detector states** — wording is already implemented in `describe()` in `src/detector.ts`;
reuse it, don't rewrite it.

| State | Track | Text | Glyph | Copy |
|---|---|---|---|---|
| `idle` | empty | `var(--dim)` | `···` | `listening…` |
| `searching` | 24 px accent bar crossing, 1400 ms linear, loops | `var(--dim)` | `≈` | `pulses present, measuring period…` or `pulses present but irregular (0.62 consistency)` |
| `detected` | filled accent | `var(--accent)` | `●` | `marker detected, period 2.38 s (25/min) — matches the published 2.40 s` |
| `absent` | empty | `var(--dim)` | `—` | `no marker — band is noise, or the transmitter is off` |

Detected has two other forms: `marker detected, period 2.38 s (25/min)` when no period is
published, and `periodic signal at 3.10 s (19/min), but the published period is 2.40 s`
when the measurement is more than 25 % off.

**Waterfall constraints — not negotiable.** Nothing may require re-laying out or
repainting this region while it runs; nothing may add per-row work; it must not resize
when the mobile URL bar appears (use `dvh` — resizing loses history); decorative motion
overlapping it must be compositor-only; **no pinch-zoom** — the visible span is fixed by
the FFT and the row rate, so specify the disabled state rather than letting users
discover it.

**States to build:** no receiver saved; connecting; running with marker detected; running
with no marker; connection refused (all channels busy); stream stalled.

**Landscape (not drawn):** waterfall takes full height; the detector strip overlays its
bottom edge at 60 % opacity over a blur; everything else collapses behind one control
affordance.

### Schedule tab

**Coverage note** (`components/schedule/CoverageNote.jsx`) — `padding:12px 16px`, a
coverage sentence in sans 14 px `var(--fg)` over a permission line in sans 12 px
`var(--dim)` (or `var(--danger)` when denied). Copy: *"1 of 26 scheduled stations have
imported schedules. Times are as published, in UTC. Several operators rotate frequencies
month by month, so a slot that is silent on the listed frequency may simply have moved."*

Four permission strings, fixed — do not soften them:

| State | Copy |
|---|---|
| not asked | Enable notifications to be reminded before a window opens. |
| granted | Alerts fire 10 minutes ahead, while a tab is open. There is no server, so a closed browser means no alert. |
| denied | Notifications are blocked for this site. Alerts will not fire until that is changed in browser settings. |
| unsupported | This browser has no Notification API, so alerts cannot fire here. |

The `Enable notifications` button renders **only** in the not-asked state. Denied is not
recoverable in-app; do not offer a control that cannot work.

**Window rows** (`components/schedule/ScheduleRow.jsx`) — grid `44px 1fr auto`,
`gap: 0 12px`, `padding:8px 16px 8px 8px`. Alert switch leading. Middle: designator (mono
14 px/500 accent) + name (sans 14 px, truncating), then `Mon 03:15 UTC · Mon 04:15 ·
8102 kHz` in mono 12 px dim, then the note in sans 12 px dim. Trailing: the countdown,
mono 14 px/500, `var(--fg)` — `var(--accent)` under an hour. Formats `in 18 h 31 m`,
`in 1 d 2 h`, `in 42 m`, `now`. Existing implementation: `countdown()` in
`src/schedule.ts`.

Sorted soonest first. UTC before local, always — schedules are published in UTC and
converting before comparison is how off-by-an-hour bugs get in.

Empty state: *"No schedules have been imported yet. This is a data gap, not a quiet
band."*

### Archive tab

**Sticky header** — `position:sticky; top:0; z-index:2; padding:12px 16px;
background:var(--bg); border-bottom:1px solid var(--border)`. Search field, tier filter,
then: *"141 stations — 3 live markers, 26 scheduled, 112 historical. Status is shown as a
dated claim, because most published \"active\" listings are stale."*

**Tier filter** — segmented control, All / Live / Scheduled / Historical, All default.

**Tier section headers** (`components/archive/TierHeader.jsx`) — shown only when
unfiltered. Sticky on `var(--panel)`, mono 12 px/500 uppercase dim, label left, count
right.

**Station rows** (`components/archive/StationRow.jsx`) — grid `4.5rem 1fr auto` × 2 rows,
`gap: 0 8px`, `min-height:44px`, `padding:8px 16px`, `border-radius:0`. Designator spans
both rows in mono 14 px/500 accent, `nowrap`, plus a 6 px pulsing dot on live-tier rows.
Name sans 14 px fg; operator row 2 column 2, sans 12 px dim. Trailing column shows
`disputed` in mono 12 px uppercase accent when sources conflict. Press feedback
`opacity:0.7`, instant, **no exit animation, no ripple**. All 141 render directly.

Search matches designator, name, operator and aliases, case-insensitively, immediately.
Empty state: *"Nothing in the roster matches that search. Designators are the reliable
key — try \"S28\", \"Buzzer\", or an operator name."*

### Station detail — full-screen push

**A push, not a sheet** — the provenance tables, lore, hearings and links are too much for
a sheet. `position:absolute; inset:0; z-index:10; background:var(--bg)`, enters
`translateX(100%) → 0`.

Header (`components/navigation/DetailHeader.jsx`): `‹` at 44 × 44 px in mono 20 px dim,
`aria-label="Back to archive"`, then designator (mono 16 px/600 accent) + name (sans
16 px fg, truncating) over the tier label in sans 12 px uppercase dim.

Body `padding:16px; display:flex; flex-direction:column; gap:16px`, in order:

1. **Definition list** (`components/archive/DetailList.jsx`) — grid `max-content 1fr`,
   `gap: 8px 16px`. `dt` sans 12 px uppercase `letter-spacing:0.06em` dim; `dd` mono 14 px
   fg. Rows: Classification, Operator, Status, Marker, Also known as.
   **Status is always a dated claim:** `Live marker, last confirmed 2025-11-15`;
   `Historical, last confirmed 2008-07-02`; `Scheduled, never confirmed`.
2. **Lore** — sans 14 px/1.55 fg, `text-wrap:pretty`.
3. **Provenance table** (`components/archive/ProvenanceTable.jsx`) — columns kHz, Mode,
   When, Last confirmed, Source. Header cells mono 12 px/500 uppercase dim, left-aligned.
   Every cell `padding: 8px 8px 8px 0; border-bottom:1px solid var(--border);
   vertical-align:top`. **Disputed rows** get
   `background: color-mix(in srgb, var(--accent) 8%, transparent)` *and* the word
   `disputed` — colour never carries this alone. It must read as "the sources disagree",
   not as a validation error. S32 has four such rows and all four must show; the data
   model deliberately stores no winner.
4. **Heard here** — columns When, kHz, Period, Receiver in mono 12 px. Empty state: *"No
   hearings recorded yet. The live view records one when the detector locks onto this
   station's marker — timing and frequency only, never any content."*
5. **Recordings and logs** — four outbound search links (Shortwave Radio Audio Archive,
   Internet Archive, Signal Identification Wiki, Priyom.org) with one-line descriptions.
   Copy: *"Searches on the established archives. This app hosts no message recordings:
   publishing the contents of non-broadcast transmissions is the regulated act, and the
   hobby groups have curated these for decades."*
6. **Numbered sources** — `[1] [2]` in `var(--accent)`.

**Roster-only variant** — 112 of 141 stations. Replaces items 2–4 with the gap notice
reading *"The designator, name, operator and status are sourced; frequencies, schedules
and history have not been imported yet."* plus the four archive links. It must read as an
honest gap, not a broken page and not an empty table.

**States to build:** full detail (S28); roster-only (M13c); disputed frequencies (S32).

### Bottom sheets

Three: receiver picker, station picker, directory browser
(`components/core/BottomSheet.jsx`).

- Scrim `background: var(--overlay)` (72 %, deliberately translucent — it must not fully
  hide the waterfall), fades 0→1 over 180 ms.
- Sheet `max-height:90%`, `border-top:1px solid var(--border)`,
  `border-radius:12px 12px 0 0`, `background: var(--surface-elevated)`,
  `padding-bottom: env(safe-area-inset-bottom)`. Enters `translateY(100%) → 0`.
- Drag handle 36 × 4 px, `border-radius:2px`, `background:var(--border)`, centred.
- Title mono 16 px/600 `letter-spacing:0.03em` accent; note beneath in sans 12 px dim.
- Body `overflow-y:auto; padding: 0 16px 16px`.
- Drag-to-dismiss tracks the finger 1:1 and releases with velocity.

Copy: receiver — *"Saved in this browser. Your audio connection goes straight to that
node, under that node's own rules."* · station — *"Only the three
continuously-transmitting Russian markers are offered here. Scheduled stations live on
the Schedule tab."* · directory — *"Showing 50 of 776 receivers covering 4625 kHz with a
free channel. Source: rx.linkfanel.net, sorted by reported SNR."*

**The directory hazard:** the server returns 776 receivers for 4625 kHz. **Do not render
them all.** Top 50 by reported SNR, a search field, and the "showing 50 of 776" line.
Rows (`components/receiver/DirectoryRow.jsx`) grid `1fr auto auto`, `gap:12px`,
`min-height:44px`: location sans 14 px fg truncating, grid square mono 12 px dim beneath,
channels as `3/7` in mono 12 px dim (`var(--danger)` when full), SNR mono 14 px accent
right-aligned `min-width:62px`. Adopting a row closes the sheet and updates the receiver
row.

### Shared controls

Full specs in each component's `.prompt.md`. Summary:

- **Button** (`components/core/Button.jsx`) — `min-height:44px`, `padding: 0 12px`,
  `border:1px solid var(--border)`, `border-radius:3px`, `background:var(--panel)`, mono
  14 px/500 `letter-spacing:0.03em`. `size="lg"` → 48 px, `padding: 0 16px`. Variants:
  `primary` (accent border and text on an 8 % accent tint), `secondary` (base), `ghost`
  (transparent, dim), `danger` (`var(--danger)`). Disabled `opacity:0.55`.
- **Alert switch** (`components/schedule/AlertSwitch.jsx`) — 44 × 44 px target around a
  34 × 20 px track, `border-radius:10px`; 14 px knob translating 14 px over 120 ms
  `ease-out`. On: accent border, 14 % accent track, accent knob. `role="switch"`.
  Disabled `opacity:0.45`. Replaces the desktop `◉`/`○` glyph button.
- **Segmented control** (`components/core/SegmentedControl.jsx`) — grid of `1fr` columns,
  `gap:1px`, `padding:1px`, `border:1px solid var(--border)`, `border-radius:3px`,
  `background:var(--panel)`. Segments `min-height:36px`, mono 12 px/500 uppercase
  `letter-spacing:0.06em`. Selected: 8 % accent tint ground, accent text — **not a filled
  pill**, which would compete with the live pulse.
- **Search field** (`components/core/SearchField.jsx`) — `min-height:44px`,
  `padding: 0 12px`, `background:var(--panel)`, **mono** 14 px (what gets typed is usually
  a designator), `outline-offset:2px`. Placeholders `Search designator, name or operator`
  and `Search location`.
- **Tab bar** (`components/navigation/TabBar.jsx`) — grid of `1fr` columns,
  `border-top:1px solid var(--border)`, `background:var(--panel)`,
  `padding-bottom: env(safe-area-inset-bottom)`. Three tabs, always Live / Schedule /
  Archive. Each `min-height:56px`, mono 12 px/500 uppercase `letter-spacing:0.06em`, dim →
  accent. Active tab carries a 2 px accent rule at its top edge with `box-shadow:
  0 0 12px color-mix(in srgb, var(--accent) 32%, transparent)`. **Labels, no icons** — the
  source ships no icon set; do not introduce pictograms here.
- **App header** (`components/navigation/AppHeader.jsx`) — wordmark `PROJECT ECHO` in mono
  16 px/600 uppercase `letter-spacing:0.08em` accent, plus the theme control. Nothing
  else. **There is no logo** — do not draw one.
- **Theme control** (`components/core/ThemePicker.jsx`) — four 44 × 44 px buttons each
  holding a 12 px dot in that theme's accent; active adds a 1 px accent border and
  `box-shadow: 0 0 8px <accent>66`. `role="radiogroup"`.
- **Live pulse** (`components/instrument/LivePulse.jsx`) — 6 px circle (8 px on the
  receiver row). **Its animation period is the station's own published marker period** —
  2.4 s for The Buzzer, 1.2 s for The Pip — read from station data, not a fixed 2 s house
  value. `opacity: 1 → 0.25 → 1`, `ease-inout`, infinite while live-tier. **Never scale
  it** — scaling a 6 px dot at 22 fps alongside the waterfall is visible jank on
  mid-range Android.
- **Gap notice** (`components/archive/GapNotice.jsx`) — `padding:16px`,
  `border:1px solid var(--border)`, `border-radius:3px`, `background:var(--panel)`. Mono
  12 px uppercase dim title over sans 14 px fg body, `max-width:60ch`,
  `text-wrap:pretty`, with an optional link list (mono 14 px accent + sans 12 px dim
  description). Used for every empty or partial state. Say what is missing and why, then
  link onward. Never render an empty frequency table as though the station had no
  frequencies. No illustration, no shrug.
- **Skeleton** (`components/core/Skeleton.jsx`) — three rows, `opacity .4→.7` over 900 ms,
  directory sheet only.
- **Flag** (`components/archive/Flag.jsx`) — a bare uppercase mono word (`disputed`,
  `not imported`, `never confirmed`), not a pill. Never an Active/Inactive badge.

---

## Interactions & behaviour

### The connect flow

The first tap on Connect is what creates the `AudioContext` — Web Audio requires a real
user gesture, so nothing can be built on page load. That makes the control load-bearing:
it must be reachable without scrolling on the smallest target device.

`idle → connecting → running` on the transport, then independently
`idle → searching → detected | absent` on the detector.

**`searching → detected` is the most important transition in the app.** The scanning bar
stops where it is, fades out over 120 ms, and the confirmation scales in
(`scale .96→1`, `opacity 0→1`) over 400 ms `ease-out`, once, then holds still. **Nothing
bounces.** This is an instrument reporting a lock, not a game rewarding the player.

`detected → absent` must look visibly different from `detected → searching`. A marker that
stopped transmitting is news; a marker whose timing got noisy is not.

### Full motion inventory

Fourteen animations exist. **If it is not on this list, it does not exist.**

| # | Name | Trigger | Property | Duration / easing |
|---|---|---|---|---|
| 1 | Tab switch | tab tap | opacity 0→1, translateY 8px→0 | 180 ms / ease-out |
| 2 | Detail push | archive row tap | translateX 100%→0 | 260 ms / ease-out |
| 3 | Sheet present | control tap | translateY 100%→0 | 260 ms / ease-out |
| 4 | Live pulse | station is live tier | opacity 1→.25→1 | the station's own marker period |
| 5 | Detector confirm | state → detected | scale .96→1, opacity 0→1 | 400 ms / ease-out, once |
| 6 | Detector search | state = searching | translateX of a 24 px bar | 1400 ms linear, loops |
| 7 | Waterfall reveal | first row painted | opacity 0→1 | 180 ms / ease-out |
| 8 | Transport swap | Connect ↔ Stop | label crossfade, **no size change** | 120 ms / ease-inout |
| 9 | Alert toggle | tap | knob translateX, track colour | 120 ms / ease-out |
| 10 | Countdown threshold | crossing 1 h, 10 min, 1 min | opacity .6→1 on the value | 120 ms |
| 11 | Status line update | any status change | crossfade | 120 ms |
| 12 | Row press | touch down | opacity .7 on the row ground | instant, no exit |
| 13 | Directory load | sheet opens | 3 skeleton rows, opacity .4→.7 | 900 ms ease-inout, loops |
| 14 | Theme change | theme picked | **none** | instant, explicitly no transition |

Tab switch has no horizontal slide — tabs are peers, not a stack; the outgoing view fades
over 120 ms with no movement. No pull-to-refresh anywhere; nothing on screen is a feed.

### Animation rules

- **Only `transform`, `opacity` and `filter` animate.** No animated `height`, `width`,
  `top`, `left`, `margin` or `background-color` on anything sharing a screen with the
  waterfall. Item 9's track colour is the one documented exception, because a track is
  never near it.
- **Battery is a feature.** This runs for hours on a phone while decoding audio from a
  WebSocket. No continuous decorative animation runs on any screen while audio is live —
  no ambient loops, shimmer, gradient drift or particles. Items 6 and 13 are the only
  permitted loops: item 6 is a 2 px strip, and item 13 only runs while fetching, when
  audio is not streaming.
- **Nothing decorative over the waterfall** — no zoom, no parallax, no scroll-linked
  effect.
- **Numbers that tick do not fly.** Countdowns, measured period and S-meter values change
  without movement; the countdown animates only on threshold crossings, never on the
  30-second tick.
- **No page-load entrance**, no staggered reveal, no reveal-on-scroll anywhere.
- Theme change is instant: a 300 ms recolour of every surface is a full-page repaint and
  it fights the waterfall.

### Reduced motion (`prefers-reduced-motion: reduce`)

- Items 1, 2, 3: no transform, crossfade only at 120 ms.
- Items 4, 6, 13: static. The pulse becomes a solid dot; the scanning bar a static 24 px
  bar; skeletons stop shimmering.
- Item 5: opacity only, no scale.
- **The waterfall keeps scrolling.** It is data, not decoration, and stopping it would
  remove the app's function. Provide a **freeze control** for anyone who wants it still —
  that is a feature, not an accessibility fallback.

### Touch and gesture

| Gesture | Where | Action |
|---|---|---|
| Tap | everywhere | primary |
| Long press | waterfall | freeze and show a crosshair reading frequency offset and time offset for that pixel |
| Vertical drag | waterfall | scrub back through the 14.5 s of visible history; release resumes |
| Horizontal drag | sheets | dismiss |
| Edge swipe | detail view | back |
| Pinch | waterfall | **not supported** — specify the disabled state |

**There are no hover states.** Every hover affordance in the desktop build needs a touch
equivalent; press feedback is item 12.

### Failure and edge states

- **Connected but silent** is the single most confusing failure the app can have: the
  receiver accepted the connection and is sending nothing, or a stream is cross-origin and
  the analyser reads silence. Both look exactly like a dead antenna and neither throws.
  `hasSignal()` in `src/audio/analyser.ts` detects it; the UI must say which it is, in
  plain words, with an action. Copy: *"connected but no audio reached the analyser. Either
  the receiver is not sending (all channels busy) or the source is cross-origin without
  CORS headers."* plus a ghost `Try another receiver`.
- **Disputed data:** rows carry a `disputed` flag and both published values are shown.
- **Notification permission:** four states, copy fixed above. Denied is not recoverable
  in-app and must say so.
- **Offline / server absent:** the directory, hearings and relay controls **hide** rather
  than fail. Both configurations of the live view need building.

### Responsive

- ≤ 480 px: the layout above. 481–767 px: same, wider gutters. ≥ 768 px: existing desktop
  two-column layout, unchanged.
- `100vh` is wrong on mobile browsers — use `dvh`, and account for the URL bar appearing
  and disappearing during scroll. **The waterfall must not resize when it does.**
- Safe-area insets on the tab bar and transport bar.
- Not drawn: 360 × 800 Android, and a 768 tablet layout showing how the phone design
  reflows toward the desktop two-column archive.

---

## State management

The existing app is view-scoped: each view factory returns `{ element, destroy }` and the
shell calls `destroy` on every navigation. **Keep that.** Leaving a WebSocket to a
volunteer's receiver open behind a hidden view is the kind of thing that gets a node to
block you.

| State | Owner | Notes |
|---|---|---|
| `theme` | app shell | `'phosphor' \| 'amber' \| 'midnight' \| 'nightvision'`, persisted in `localStorage` as `echo.theme`, applied as `data-theme` on `<html>`, instantly |
| `tab` | app shell | `'live' \| 'schedule' \| 'archive'`. Currently hash-routed; keep the hash so links work |
| `receivers`, `selectedReceiverId` | `src/receiver.ts` + `localStorage` | Saving stores the address locally only |
| `stationId`, `frequencyIndex` | live view | The tuning |
| `phase` | live view | `'idle' \| 'connecting' \| 'running' \| 'stalled'` |
| `detection` | live view | From `MarkerDetector.read()`, polled every 1000 ms: `{ state, periodSec, perMinute, consistency, range }` |
| `sheet` | live view | `null \| 'receiver' \| 'station' \| 'directory'` |
| `directory`, `directoryLoading` | live view | Fetched per tuned frequency, sorted by SNR descending |
| `detailId` | archive view | Non-null means the detail is pushed |
| `query`, `tier` | archive view | Filter state |
| `permission` | schedule view | `'default' \| 'granted' \| 'denied' \| 'unsupported'`; only requestable from a user gesture |
| `alerts` | `src/alerts.ts` + `localStorage` | Per-slot subscriptions. **The app shell owns the 30 s poll, not the schedule view** — a reminder that only fires while the user is looking at the schedule is not a reminder |

Data fetching: audio over a WebSocket direct to the chosen KiwiSDR with
`SET compression=0` for raw signed 16-bit (no media element, so no CORS-silence class of
bug — but keep the liveness check); `GET /api/receivers?khz=&free=` for the proxied public
list on a 15-minute cache; `GET`/`POST /api/observations` for hearings, at most one per
minute, server folding repeats from the same receiver inside ten minutes;
`prop.kc2g.com` for propagation, refreshed no more often than its 5-minute cadence;
schedules as RFC 5545 `RRULE` strings evaluated in UTC, with only the formatting layer
localising.

---

## Design tokens

All of these already exist as CSS custom properties in `tokens/`. **Copy the files.**

### Colour — four themes, ten roles each

| Role | phosphor | amber | midnight | nightvision |
|---|---|---|---|---|
| `--bg` | `#060a06` | `#0d0803` | `#05070f` | `#0a0000` |
| `--panel` | `#0c130c` | `#171008` | `#0b1020` | `#150202` |
| `--surface-elevated` | `#121c13` | `#211708` | `#111830` | `#1e0505` |
| `--fg` | `#b8f5c0` | `#f5d9a8` | `#cdd9f5` | `#f7b8b8` |
| `--dim` | `#6f9c76` | `#a98a58` | `#7e8cb0` | `#b06a6a` |
| `--accent` | `#4ade80` | `#fbbf24` | `#38bdf8` | `#f87171` |
| `--border` | `#1d2f1f` | `#33240f` | `#1a2340` | `#341010` |
| `--overlay` | `rgba(3,6,3,.72)` | `rgba(8,5,2,.72)` | `rgba(2,4,9,.72)` | `rgba(6,0,0,.72)` |
| `--danger` | `#f87171` | `#f87171` | `#f87171` | `#fb923c` |
| `--ok` | `#2dd4bf` | `#4ade80` | `#4ade80` | `#86efac` |

The first seven are verbatim from `src/style.css`. The last three are new — the spec
required the roles and left the values to design. Two theme-specific traps, already
handled: in nightvision the accent is red, so `--danger` moves to orange; in phosphor the
accent is green, so `--ok` moves to teal. Applied via `:root[data-theme="<name>"]`;
phosphor is also the bare `:root` default.

**Contrast audit — every text pair clears WCAG AA (4.5:1) in all four themes:**

| Pair | phosphor | amber | midnight | nightvision |
|---|---|---|---|---|
| fg on bg | 16.0 | 14.6 | 14.2 | 12.3 |
| fg on panel | 15.1 | 13.8 | 13.4 | 12.0 |
| fg on surface-elevated | 14.0 | 12.9 | 12.4 | 11.6 |
| dim on bg | 6.4 | 6.1 | 6.0 | 5.1 |
| dim on panel | 6.0 | 5.8 | 5.6 | 4.9 |
| accent on bg | 11.4 | 11.9 | 9.4 | 7.5 |
| accent on panel | 10.8 | 11.3 | 8.8 | 7.3 |
| danger on panel | 6.8 | 6.8 | 6.8 | 8.9 |
| ok on panel | 10.1 | 10.8 | 10.9 | 14.4 |

Tightest pair is `dim` on `panel` in nightvision at 4.9:1. **Do not lighten an accent to
add glow** — pick for contrast first and layer the shadow on top.

**Derived values**

```
--tint-accent-weak:   color-mix(in srgb, var(--accent) 8%,  transparent)
--tint-accent-press:  color-mix(in srgb, var(--accent) 14%, transparent)
--glow-accent:        0 0 12px color-mix(in srgb, var(--accent) 32%, transparent)
--glow-accent-tight:  0 0 0 1px color-mix(in srgb, var(--accent) 60%, transparent)
```

Glow is only ever the live indicator and focus rings. **No drop shadows for elevation** —
on these grounds a shadow is invisible; raise a surface with `--panel` →
`--surface-elevated` instead.

**Spectrogram ramp — not themeable.** Perceptually ordered, inferno-like, verbatim from
`src/waterfall.ts`. On a hue ramp a mid-amplitude pulse can read as louder than a strong
one, which makes the instrument lie about the marker.

```
rgb(0,0,4)      rgb(31,12,72)    rgb(85,15,109)   rgb(136,34,106)  rgb(186,54,85)
rgb(227,89,51)  rgb(249,140,10)  rgb(249,201,50)  rgb(252,255,164)
```

Theme accents apply to chrome only. This is the one place the visual system does not
follow the theme.

### Typography

Two faces, split by what the text *is*.

- **Mono** — data: frequencies, designators, timestamps, periods, RRULEs, status output,
  every control label.
  `--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, "Cascadia Mono", monospace`
- **Sans** — prose, notes, field labels. Deliberately the platform sans, because the app
  is a browser tab and should look like one.
  `--font-sans: system-ui, -apple-system, "Segoe UI", sans-serif`

**Scale — four steps and no more.** 12 / 14 / 16 / 20 px. 14 px is body. **Nothing below
12 px anywhere** — the desktop build's `0.72rem` labels must grow on mobile.

| Token | px | Use |
|---|---|---|
| `--text-label` | 12 | uppercase labels, notes, table headers |
| `--text-body` | 14 | body, data rows, control labels |
| `--text-title` | 16 | sheet titles, detail header, wordmark |
| `--text-display` | 20 | the largest number on a screen |

Weights 400 / 500 / 600. Line heights 1.55 prose, 1.35 data rows, 1 controls. Tracking
`0.06em` uppercase labels, `0.03em` mono titles, `0.08em` wordmark, 0 data.

**ENIGMA designators are the app's proper nouns.** Always mono, always `var(--accent)`,
never wrapped mid-token, never lowercased: `S28`, `E03a`, `HM01`, `XPA2`, `M13c`.

### Spacing, radius, borders

4 px base, six steps: **4 / 8 / 12 / 16 / 24 / 32**. `--gutter` is 16 px — the horizontal
inset of every row, header and sheet.

`--radius-control: 3px` · `--radius-sheet: 12px` · `--radius-instrument: 0`. The
instrument is square; the interface is slightly soft.

Hairlines are `1px solid var(--border)`. Minimum touch target **44 × 44 px**, including
the alert toggles.

Layout constants (design additions — the spec gives no heights):
`--tabbar-height: 56px` · `--transport-height: 60px` ·
`--safe-bottom: env(safe-area-inset-bottom, 0px)`.

### Motion

```
--dur-fast: 120ms         --ease-out:   cubic-bezier(0.2, 0, 0.2, 1)   entering, settling
--dur-base: 180ms         --ease-in:    cubic-bezier(0.4, 0, 1, 1)     leaving
--dur-slow: 260ms         --ease-inout: cubic-bezier(0.4, 0, 0.2, 1)   moving on screen
--dur-deliberate: 400ms
--dur-scan: 1400ms        --dur-skeleton: 900ms
```

### Instrument constants

320 rows · 22 fps · ~14.5 s of history on screen · 0–3 kHz of the SSB passband (~256 bins
at `fftSize = 4096`, 48 kHz).

---

## Performance budget

A real acceptance criterion, not aspiration.

- **60 fps for all interface motion on a three-year-old mid-range Android, while the
  waterfall runs at 22 fps and audio decodes.** That combination is the test.
- No animation may cause layout or paint outside its own compositor layer.
- Main-thread work per frame outside the waterfall: **under 4 ms**.
- The waterfall's own cost is two 1-pixel `putImageData` calls plus a transform change per
  row. Nothing in the design may add per-row work.
- Total blocking time on first interaction under 200 ms — the first tap has to create the
  audio graph and must not compete with animation.

## Accessibility

- AA contrast in all four themes (audit above).
- The status line and detector strip are `aria-live="polite"` regions. They update
  frequently, so wording must be short and must not repeat unchanged text.
- **Every control must be operable without the waterfall.** The app must be usable by
  someone who cannot see the spectrogram at all, which is what the detector strip is for —
  and which raises its importance far above its size.
- 44 px targets. Focus rings visible against both `--panel` and `--bg` in every theme.
- Respect `prefers-reduced-motion` per the mapping above.
- **No meaning carried by colour alone** — the disputed flag, the tier and every detector
  state also carry a glyph or a word.

## Assets

- **Fonts:** `assets/fonts/` — five self-hosted JetBrains Mono woff2 files (regular 400,
  medium 500, semibold 600, bold 700, italic 400), supplied by the team. SIL OFL 1.1.
  `@font-face` rules in `tokens/fonts.css`. Self-hosted deliberately: the app runs from
  `127.0.0.1` with no service worker, so a CDN request per load is both a privacy
  liability and a single point of failure. Ship `OFL.txt` alongside.
- **Logo: none exists.** The wordmark is the name set in mono. Do not create one.
- **Icons: none exist.** No SVG set, no icon font, no sprite, no favicon. The app's
  complete glyph vocabulary is unicode in the mono face: `●` live tier / detected,
  `◉`/`○` alert on / off, `›` opens a sheet, `‹` back, `·` separator in data lines, `≈`
  searching, `—` absent or no value. Labels do the work icons would elsewhere — the tab
  bar is three words. If a glyph set is ever needed, Lucide at 1.5 px stroke is the
  nearest match to the hairline weight, but that would be a new design decision, not a
  recovery.
- **Imagery: none.** No photography, illustration, texture, pattern or gradient background
  anywhere. The only full-bleed visuals are the generated spectrogram and the propagation
  map fetched from `prop.kc2g.com`.
- **Emoji: never.**

## Content rules

The voice is a technician writing for another technician. Copy in this design is final —
carry it over verbatim.

- Sentence case in prose. Lowercase for machine output (`idle`, `running — …`). Uppercase
  only for 12 px labels and the wordmark. Designators keep their published case exactly.
- Second person for the user's own actions and property. The app refers to itself in the
  third person. Never "we".
- Numbers carry units and dates: `4625 kHz USB`, `2.38 s (25/min)`, `in 18 h 31 m`,
  `last confirmed 2025-11-15`. Never a bare number, never "recently".
- **Status is a dated claim, never a badge.** A green *Active* pill is forbidden: most
  published listings for these stations are stale, so a badge repeats an error
  confidently.
- Gaps are stated with a route onward. Failures name themselves and offer the next move —
  never "Something went wrong", never a control that cannot work.
- Limitations are printed next to the feature. Disagreement is shown, not resolved.
- No emoji. No exclamation marks outside a quoted transmission. No onboarding cheer, no
  celebration on a detection.

## Scope boundaries — carry these forward

From the product's own documents. Any new UI must honour them.

- **The app records observations about signals — frequencies, markers, timing — and never
  their contents.** Reception is legal nearly everywhere; publishing the contents of
  non-broadcast transmissions is regulated (47 U.S.C. § 605, Wireless Telegraphy Act
  2006). **No message decoding UI, ever.** Nothing may imply the app interprets
  transmission content.
- **The app must be served over plain http, so it cannot be a PWA.** Public receivers are
  `http://` on odd ports, so their sockets are `ws://`, and an https page cannot open one.
  No service worker, no installability, no push, no offline. Design for a browser tab on a
  phone — visible browser chrome, no splash screen, no app icon. Anything that reads as
  "installed native app" is a lie.
- **"Live" means live while the screen is on and the tab is in front.** iOS suspends audio
  when backgrounded; handle resume gracefully rather than pretending the stream continued.
- No onboarding carousel, no tour, no tooltips-on-first-run.
- No gamification of detections — no streaks, badges or celebration.
- No map view. Receiver geography matters, but a map is a later, separate decision.
- No dark/light toggle. All four themes are dark by design.
- No branding implying affiliation with any intelligence service, real or historical. The
  aesthetic references the equipment, not the institutions.
- **Never relay someone else's receiver.** The user's connection goes directly to the node
  they chose, under that node's own rules.

---

## Files in this bundle

| Path | What it is |
|---|---|
| `HANDOFF.md` | This file |
| `readme.md` | The full design system guide — content fundamentals, visual foundations, iconography, index |
| `ui_kits/echo-mobile/index.html` | **Open this first.** The click-through phone mock, 393 × 852 |
| `ui_kits/echo-mobile/README.md` | What works in the mock and what is faked |
| `ui_kits/echo-mobile/*.jsx`, `data.js` | Screens, sheets, and the fixture lifted from `src/data/stations.ts` |
| `styles.css` | Global entry point — `@import` lines only |
| `tokens/*.css` | **Copy these.** colors, typography, spacing, motion, instrument, fonts |
| `assets/fonts/*.woff2` | **Copy these.** Five JetBrains Mono weights |
| `components/<group>/<Name>.jsx` | 25 cosmetic component implementations |
| `components/<group>/<Name>.d.ts` | Props contract for each |
| `components/<group>/<Name>.prompt.md` | Per-component rules and a usage example — **read these** |
| `components/<group>/*.card.html` | Dense state/variant sheets per group |
| `guidelines/*.card.html` | 25 specimen cards: themes, contrast audit, ramp, type, spacing, motion inventory, reduced motion, glyphs, content rules |
| `templates/echo-phone/` | A 393 × 852 starting frame composed from the components |

Component groups: `core` (Button, SegmentedControl, SearchField, BottomSheet, ThemePicker,
Skeleton) · `navigation` (AppHeader, TabBar, DetailHeader) · `instrument` (WaterfallPanel,
DetectorStrip, LivePulse, StatusLine, TransportBar, ReceiverRow) · `archive` (StationRow,
TierHeader, DetailList, ProvenanceTable, Flag, GapNotice) · `schedule` (ScheduleRow,
AlertSwitch, CoverageNote) · `receiver` (DirectoryRow).

## Source of truth in the target repo

The design was built by reading these, and they remain authoritative where they conflict
with anything here.

| File | What it defines |
|---|---|
| `docs/MOBILE_UI_SPEC.md` | The whole phone layout and motion system. Read §2 and §10 first — those are constraints from measured device behaviour, not suggestions |
| `docs/PLAN.md` | Product definition, data model and provenance rules, waterfall geometry, server scope |
| `docs/RESEARCH.md` | Station facts and the legal scope boundary |
| `src/style.css` | The four themes, verbatim |
| `src/waterfall.ts` | **Do not reimplement.** The canvas geometry and colour ramp |
| `src/detector.ts` | The four detector states and their exact wording (`describe()`) |
| `src/views/{live,schedule,stations}.ts` | Every string of existing user-facing copy |
| `src/types.ts`, `src/data/stations.ts` | Tiers, provenance, disputed frequencies, roster-only entries |
