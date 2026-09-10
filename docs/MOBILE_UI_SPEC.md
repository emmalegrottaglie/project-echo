# Project Echo — Mobile UI and Motion Specification

Handoff document for Claude Design. It describes the mobile interface and the animation
system for an app that already exists and works: three views, 141 stations, a live
spectrogram, a marker detector, schedule alerts, and a receiver directory.

**Status: built.** Claude Design returned `Project Echo Design System/` against this
spec, and the phone layout is implemented — tokens and fonts copied from that bundle,
its React components reimplemented in `src/ui.ts`, and the desktop layout reflowing
back at 768 px. Two items in §5.2 and §6 remain unimplemented and are called out in
README.md: the gestures, and the landscape layout.

Read [RESEARCH.md](RESEARCH.md) for what the stations actually are and
[PLAN.md](PLAN.md) for how the app is built. This document does not restate them; it
specifies the interface.

**What to produce:** artboards per §12, using the tokens in §3 and the motion table in
§5. Everything in §2 and §10 is a constraint on the design, not a suggestion — those
sections come from the working implementation and from measured device behaviour.

---

## 1. What the app is, in one paragraph

A shortwave listener's instrument. The user picks a public receiver somewhere in the
world, tunes it to one of three Russian channel markers that transmit continuously, and
watches a scrolling spectrogram while the app tells them whether the marker is really
there and at what pulse period. Alongside that: an archive of 141 numbers stations —
almost all of them dead — with sourced frequencies and dates, and reminders before the
few stations that still carry traffic are due to transmit.

The aesthetic is signals intelligence: instrument, not dashboard. The user is watching
a real signal arrive from a transmitter they cannot see, and the interface's job is to
stay out of the way of that.

## 2. Constraints that shape everything

These are not preferences. Each one has already changed the implementation.

**2.1 The spectrogram is the app, and it is a canvas being translated.**
A canvas twice the viewport height, one 1-pixel row painted per frame at 22 fps, moved
under a clipping viewport with `transform: translateY()`. Nothing in the design may
require re-laying out or repainting that region while it runs. Decorative motion
overlapping the waterfall must be compositor-only — `transform` and `opacity`, nothing
else.

**2.2 22 fps is deliberate, and the row rate is the time axis.**
A marker pulses 25–50 times a minute. The waterfall is not trying to look smooth; its
scroll speed *is* the time scale of the data. Do not specify a faster row rate to make
it feel slicker — it would compress the visible history and change what the user reads.
320 rows at 22 fps is about 14.5 seconds of history on screen.

**2.3 The spectrogram colour ramp is not themeable.**
It uses a perceptually ordered map (inferno-like). On a hue ramp, a mid-amplitude pulse
can read as louder than a strong one, which makes the instrument lie. Theme accents
apply to chrome only. This is the one place where the visual system does not follow the
theme.

**2.4 Battery is a feature.**
This runs for hours on a phone while decoding audio from a WebSocket. No continuous
decorative animation may run while the live view is streaming. Ambient loops, shimmer,
gradient drift, particles: none of it, on any screen, while audio is live.

**2.5 All four themes are low-contrast by nature.**
Phosphor green, amber, midnight blue and night-vision red are all narrow-gamut on near
black. Every one must clear WCAG AA for text. Choose the accent for contrast first and
add the glow afterwards as a shadow, never by lightening the text colour.

**2.6 The app must be served over plain http, so it cannot be a PWA.**
Public receivers are `http://` on odd ports, so their sockets are `ws://`, and an https
page cannot open one. No service worker, no installability, no push, no offline. Design
for a browser tab on a phone — visible browser chrome, no splash screen, no app icon.
Anything that reads as "installed native app" will be a lie. If a real native shell is
ever built, that constraint lifts; it does not lift for the web build.

**2.7 iOS suspends audio when the tab is backgrounded.**
"Live" means live while the screen is on and the tab is in front. The design must have
somewhere to say that, and must handle resume gracefully rather than pretending the
stream continued.

**2.8 Web Audio needs a real user gesture.**
The audio graph cannot be created on page load. The first tap on a connect control is
what starts everything, so that control is load-bearing and must be reachable without
scrolling on the smallest target device.

**2.9 Most stations are dead, and 112 of 141 have no imported detail.**
The archive is mostly historical, and mostly thin. The design must make "sourced
identity, detail not imported yet" a legible state rather than an empty page. Status is
always a dated claim — "last confirmed 2020-09-01", never a green "Active" pill.

---

## 3. Design tokens

### 3.1 Themes

Four, switchable, persisted. Each defines the same six roles. Current implementation
values are given as the starting point; refine them, keep the roles.

| Role | Meaning | phosphor | amber | midnight | nightvision |
|---|---|---|---|---|---|
| `--bg` | page ground | `#060a06` | `#0d0803` | `#05070f` | `#0a0000` |
| `--panel` | raised surface | `#0c130c` | `#171008` | `#0b1020` | `#150202` |
| `--fg` | primary text | `#b8f5c0` | `#f5d9a8` | `#cdd9f5` | `#f7b8b8` |
| `--dim` | secondary text | `#6f9c76` | `#a98a58` | `#7e8cb0` | `#b06a6a` |
| `--accent` | active, live, interactive | `#4ade80` | `#fbbf24` | `#38bdf8` | `#f87171` |
| `--border` | hairlines | `#1d2f1f` | `#33240f` | `#1a2340` | `#341010` |

Required additions for mobile:

| Role | Meaning |
|---|---|
| `--overlay` | scrim behind sheets and dialogs; must not fully hide the waterfall |
| `--surface-elevated` | bottom-sheet ground, one step above `--panel` |
| `--danger` | failure states; must be distinguishable from `--accent` in the nightvision theme, where the accent is already red |
| `--ok` | confirmed-good states; same problem in reverse for phosphor |

Deliver a contrast audit per theme: `--fg` on `--bg`, `--fg` on `--panel`, `--dim` on
`--bg`, `--accent` on `--bg`, `--accent` on `--panel`. All ≥ 4.5:1 for body text,
≥ 3:1 for large text and for non-text indicators that carry meaning.

### 3.2 Type

- Data, frequencies, designators, timestamps, periods, code: monospace (JetBrains Mono
  or Fira Code, with a real fallback stack).
- Labels, prose, notes: system sans.
- Mobile scale, four steps only: 12 / 14 / 16 / 20 px. 14 px is body. Nothing below
  12 px anywhere; the current desktop build has 0.72rem labels that must grow on mobile.
- ENIGMA designators are the app's proper nouns. Always monospace, always accent, never
  wrapped mid-token.

### 3.3 Space and shape

- 4 px base, steps 4 / 8 / 12 / 16 / 24 / 32.
- Radius: 3 px on controls, 12 px on sheets, 0 on the waterfall viewport. The
  instrument is square; the interface is slightly soft.
- Hairlines are 1 px `--border`. No shadows for elevation on dark grounds — use
  `--panel` and `--surface-elevated` instead. Glow (`box-shadow` in the accent at low
  alpha) is for the live indicator and focus rings only.
- Minimum touch target 44 × 44 px, including the alert toggles, which are currently
  glyph-sized.

---

## 4. Screens

Breakpoints: **≤ 480 px** phone (primary), **481–767 px** large phone / small tablet,
**≥ 768 px** the existing two-column desktop layout, unchanged.

Navigation on phone moves from the current header links to a **bottom tab bar**, three
tabs — Live, Schedule, Archive — above the safe-area inset. The header keeps the app
name and the theme control only. Rationale: the connect control and the tab bar are
both thumb-reachable, and the waterfall gets the middle of the screen.

### 4.1 Live

Vertical order on a phone:

1. **Receiver row.** Selected receiver name and grid, with a chevron opening the
   receiver sheet (§4.4). One line, truncating.
2. **Station row.** Selected station, frequency, mode — e.g. `S28 The Buzzer · 4625 kHz
   USB`. Tapping opens the station picker sheet. Disputed frequencies carry the flag
   from §7.3 here too.
3. **Waterfall.** Full bleed to both edges, 320 rows tall, with a frequency scale along
   one edge labelled in kHz offset from the passband (0–3 kHz). Newest row at the
   bottom.
4. **Detector strip.** The one piece of live interpretation on the screen. Four states,
   §7.1.
5. **Transport.** Connect / Stop as a single primary control that swaps role, plus a
   secondary control for the demo signal, labelled **Demo** — "Synthetic" meant nothing
   to the first person who used the app. On a phone this is a fixed bar directly above
   the tab bar so it never scrolls away — see 2.8.
6. **Propagation** and **Diagnostics**, collapsed by default, below the fold.

Landscape: the waterfall takes the full height, the detector strip overlays its bottom
edge at 60% opacity over a blur, and everything else collapses behind a single control
affordance. Rotating a phone to watch a waterfall is a real use case and deserves this.

States to draw: no receiver saved; connecting; running with marker detected; running
with no marker; connection refused (all channels busy); stream stalled (connected, no
audio — see §7.2).

### 4.2 Schedule

A list of upcoming windows, soonest first. Each row: station designator and name, UTC
time, local time, countdown, frequency, and an alert toggle.

- Countdown is the row's emphasis. `in 18 h 31 m` in monospace, accent when under an
  hour.
- The alert toggle becomes a 44 px switch, not a glyph.
- A header block states coverage honestly — currently "1 of 26 scheduled stations have
  imported schedules" — and the notification permission state (§7.4).
- Empty state: no schedules imported yet. This is a data gap, and must read as one.

### 4.3 Archive

- Sticky search field plus a tier filter as a three-way segmented control (Live /
  Scheduled / Historical) with an All default.
- Rows: designator, name, operator. Live-tier rows carry the pulse indicator (§5.4).
- 141 rows is fine to render directly. Section headers by tier when unfiltered.
- Tapping a row pushes a **full-screen detail view** on phones, not a sheet — the
  detail has provenance tables, lore, hearings and archive links, which is too much for
  a sheet. Slide in from the trailing edge, back gesture returns.

Detail contents, in order: designator and name, classification, operator, dated status,
marker description, aliases, lore, frequency provenance table, schedule, "Heard here"
(local hearings, §7.5), archive search links, numbered sources.

Roster-only detail (112 of 141) replaces lore and tables with the not-imported state
from §7.6.

### 4.4 Sheets

Three bottom sheets: receiver picker, station picker, directory browser.

The **directory browser** is the one with a hazard: the server returns 776 receivers for
4625 kHz. Do not design a 776-row scrolling list on a phone. Specify: top 50 by
reported SNR, a search field, and a "showing 50 of 776" line. Each row shows location,
free channels as `3/7`, and SNR. Adopting one closes the sheet and updates the receiver
row.

Sheets: 90% max height, drag handle, swipe-to-dismiss, scrim `--overlay`.

---

## 5. Motion

### 5.1 Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120 ms | state flips on controls, toggles, focus |
| `--dur-base` | 180 ms | view and tab transitions, fades |
| `--dur-slow` | 260 ms | sheet present and dismiss, detail push |
| `--dur-deliberate` | 400 ms | detector state confirmation only |
| `--ease-out` | `cubic-bezier(0.2, 0, 0.2, 1)` | anything entering or settling |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | anything leaving |
| `--ease-inout` | `cubic-bezier(0.4, 0, 0.2, 1)` | anything moving between two on-screen positions |

Only `transform`, `opacity`, and `filter` are animated. No animated `height`, `width`,
`top`, `left`, `margin`, or `background-color` on any element that shares a screen with
the waterfall.

### 5.2 Inventory

Every animation in the app. If it is not here, it does not exist.

| # | Name | Trigger | Property | Duration / easing | Notes |
|---|---|---|---|---|---|
| 1 | Tab switch | tab tap | opacity 0→1, translateY 8px→0 | base / ease-out | No horizontal slide: tabs are peers, not a stack. Outgoing view fades in 120 ms, no movement. |
| 2 | Detail push | archive row tap | translateX 100%→0 | slow / ease-out | Trailing edge. Back gesture reverses, interruptible and following the finger. |
| 3 | Sheet present | control tap | translateY 100%→0 | slow / ease-out | Scrim fades 0→1 over base. Drag-to-dismiss tracks the finger 1:1 and releases with velocity. |
| 4 | Live pulse | station is live tier | opacity 1→0.25→1 | period = the station's own marker period | See 5.4. |
| 5 | Detector confirm | state → `detected` | scale 0.96→1, opacity 0→1 | deliberate / ease-out | Once, on entry. Never loops. See 5.5. |
| 6 | Detector search | state = `searching` | translateX of a 24 px accent bar across the strip | 1400 ms linear, loops | The only looping animation permitted while streaming, and only in this one 2 px tall strip. Stops the moment state changes. |
| 7 | Waterfall reveal | first row painted | opacity 0→1 | base / ease-out | Prevents a black flash before data arrives. |
| 8 | Transport swap | Connect ↔ Stop | crossfade label, no size change | fast / ease-inout | The control must not resize; a moving primary button under a thumb is a mis-tap. |
| 9 | Alert toggle | tap | knob translateX, track colour | fast / ease-out | Colour is the exception to 5.1: a track is not near the waterfall. |
| 10 | Countdown threshold | crossing 1 h, 10 min, 1 min | opacity 0.6→1 on the value | fast | Only on threshold crossing. Never on the 30-second tick. |
| 11 | Status line update | any status change | crossfade | fast | It is an ARIA live region; movement would fight the announcement. |
| 12 | Row press | touch down | opacity 0.7 on the row ground | instant, no exit animation | Native-feeling press feedback. No ripple. |
| 13 | Directory load | sheet opens | three skeleton rows, opacity 0.4→0.7 | 900 ms ease-inout, loops | Loops only while fetching, and audio is not streaming while this sheet is open in the normal flow. |
| 14 | Theme change | theme picked | none | — | Instant. A 300 ms recolour of every surface is a full-page repaint, and it fights the waterfall. Explicitly no transition. |

### 5.3 What must not animate

- The waterfall canvas itself, beyond its own translate. No zoom, no parallax, no
  scroll-linked effect.
- Numbers that update on a timer: countdowns, the measured period, S-meter values. They
  change; they do not fly.
- Page load. No staggered entrance, no reveal-on-scroll anywhere in the app.
- Anything decorative and looping while audio is live, except items 6 and 13 above.

### 5.4 The live pulse, specifically

The archive's live-tier rows and the live view's receiver row carry a pulsing dot.
**Its period should match the station's real marker period** — 2.4 s for The Buzzer,
1.2 s for The Pip — taken from the station data, not a fixed 2 s house value. It is a
small thing that makes the interface honest: the dot is beating at the rate the
transmitter is.

Amplitude: opacity 1 → 0.25 → 1, `ease-inout`, infinite while the station is in the
live tier. Never scale — scaling a 6 px dot at 22 fps alongside the waterfall is
visible jank on mid-range Android.

### 5.5 The detector strip, specifically

Four states, and the transitions between them are the most important motion in the app,
because this is where the app tells the user something they could not see themselves.

| State | Meaning | Treatment |
|---|---|---|
| `idle` | listening, not enough data | `--dim` text, no motion |
| `searching` | pulses present, period not yet consistent | scanning bar, item 6 |
| `detected` | consistent period found | accent, item 5 fires once, then still. Shows measured period and pulses/minute, and whether it matches the published figure |
| `absent` | band is noise, or transmitter off | `--dim`, no motion, explicit wording |

`searching → detected` is the moment worth designing carefully: the scanning bar stops
where it is, fades out over 120 ms, and the confirmation scales in over 400 ms. Nothing
bounces. This is an instrument reporting a lock, not a game rewarding the player.

`detected → absent` must be visibly different from `detected → searching`. A marker
that stopped transmitting is news; a marker whose timing got noisy is not.

### 5.6 Reduced motion

`prefers-reduced-motion: reduce` maps as follows, and this mapping must be drawn:

- Items 1, 2, 3: no transform, crossfade only at `--dur-fast`.
- Items 4, 6, 13: static. The pulse dot becomes a solid dot; the scanning bar becomes a
  static 24 px bar; skeletons stop shimmering.
- Item 5: no scale, opacity only.
- The waterfall keeps scrolling. It is data, not decoration, and stopping it would
  remove the app's function. Instead, provide a **freeze control** for anyone who wants
  it still — that is a feature, not an accessibility fallback.

---

## 6. Touch and gesture

| Gesture | Where | Action |
|---|---|---|
| Tap | everywhere | primary |
| Long press | waterfall | freeze and show a crosshair reading frequency offset and time offset for that pixel |
| Vertical drag | waterfall | scrub back through the 14.5 s of visible history; release resumes |
| Horizontal drag | sheets | dismiss |
| Edge swipe | detail view | back |
| Pinch | waterfall | **not supported** — the visible span is fixed by the FFT and the row rate; specify the disabled state rather than leaving users to discover it |

No pull-to-refresh anywhere. Nothing on screen is a feed.

---

## 7. States that need a designed treatment

### 7.1 Detector
Four states, §5.5.

### 7.2 Connected but silent
The single most confusing failure the app can have: the receiver accepted the
connection and is sending nothing, or a stream is cross-origin and the analyser is
reading silence. Both look exactly like a dead antenna, and neither throws an error.
The app detects it and must say which it is, in plain words, with an action — try
another receiver.

### 7.3 Disputed data
Some frequencies are published two different ways by sources that do not retract each
other. Rows carry a `disputed` flag and both values are shown. Needs a visual language
that reads as "the sources disagree", not as "this is wrong" and not as a validation
error.

### 7.4 Notification permission
Four states: not yet asked, granted, denied, unsupported. Denied is not recoverable
in-app and must say so rather than offering a button that does nothing. Granted must
state the limitation: alerts fire only while a tab is open, because there is no service
worker (see 2.6).

### 7.5 Hearings
"Heard here" — the local record of when this installation's own detector locked onto a
station. Empty state explains how a row gets there. Rows show time, frequency, measured
period, receiver. Never any content of a transmission; the app records that a signal
was heard, never what it said.

### 7.6 Roster-only station
112 of 141. Identity and status are sourced; frequencies, schedules and history are not
imported. Must read as an honest gap with links onward to Priyom and the archives, not
as a broken page.

### 7.7 Offline / server absent
The app runs without its server, losing the directory, hearings and relay. Those
controls hide rather than fail. Draw both configurations of the live view.

---

## 8. Accessibility

- AA contrast in all four themes, per §3.1.
- The status line and detector strip are ARIA live regions, `polite`. They update
  frequently, so wording must be short and must not repeat unchanged text.
- Every control reachable and operable without the waterfall: the app must be usable by
  someone who cannot see the spectrogram at all. The detector strip is what makes that
  true, which raises its importance above its size.
- 44 px targets, focus rings visible against `--panel` and `--bg` in every theme.
- Respect `prefers-reduced-motion` per §5.6.
- No meaning carried by colour alone — the disputed flag, the tier, and the detector
  state all need a glyph or a word as well.

## 9. Performance budget

- 60 fps for all interface motion, on a mid-range Android from three years ago, **while
  the waterfall runs at 22 fps and audio decodes**. That combination is the real test.
- No animation may cause layout or paint outside its own compositor layer.
- Main-thread work per frame outside the waterfall: under 4 ms.
- The waterfall's own cost is two 1-pixel `putImageData` calls plus a transform change
  per row. Nothing in the design may add per-row work.
- Total blocking time on first interaction under 200 ms; the first tap has to create the
  audio graph (2.8) and must not compete with animation.

## 10. Platform notes

- `100vh` is wrong on mobile browsers. Use `dvh`, and account for the URL bar appearing
  and disappearing during scroll — the waterfall must not resize when it does. Resizing
  the canvas mid-stream loses history.
- Safe-area insets on the tab bar and the fixed transport bar.
- No hover states. Every hover affordance in the current desktop build needs a touch
  equivalent.
- iOS: audio needs a gesture (2.8), suspends in background (2.7), and momentum
  scrolling must not be disabled anywhere.
- Android: mid-range devices are the performance target, not flagships.

## 11. Explicit non-goals

- No onboarding carousel, no tour, no tooltips-on-first-run. **Amended after first
  use:** there is now one explanatory screen, reachable from a `?` in the header and
  offered once to someone with no receiver saved. The first real session on a phone
  produced "I'm not quite sure I know what it all means", which made this non-goal
  wrong. A carousel and a tour are still ruled out — this is a single page the user can
  dismiss and return to.
- No gamification of detections. No streaks, badges, or celebration.
- No map view. Receiver geography matters, but a map is a later, separate decision.
- No message decoding UI, ever — there is no such feature and there will not be. Nothing
  in the interface may imply the app interprets transmission content.
- No dark/light toggle. There is no light theme; the four themes are all dark by design.
- No branding that implies affiliation with any intelligence service, real or historical.
  The aesthetic references the equipment, not the institutions.

## 12. Deliverables

Artboards at 393 × 852 (iPhone 15 Pro logical), plus 360 × 800 for Android, plus one
768-wide tablet layout showing how the phone design reflows toward the existing desktop
two-column archive.

| Screen | States to draw |
|---|---|
| Live | no receiver; connecting; detected; absent; stalled/silent; landscape |
| Live — sheets | receiver picker; station picker; directory browser with 50-of-776 |
| Schedule | populated; permission not asked; permission denied; no schedules imported |
| Archive | list unfiltered; list filtered to Live; search with results; search empty |
| Station detail | full detail (S28); roster-only (M13c); disputed frequencies (S32) |
| System | tab bar; transport bar; theme picker; all four themes on the Live screen |

Plus:

1. **Motion prototype** for items 1–6 of §5.2, at real durations. The
   `searching → detected` transition is the one to get right.
2. **Token sheet** — the table in §3.1 extended with the four new roles, per theme,
   with the contrast audit.
3. **Reduced-motion variants** of the motion prototype.
4. **A component sheet**: station row, frequency provenance row, schedule row with
   alert switch, detector strip in four states, receiver row, status line, sheet
   chrome, segmented control, primary/secondary transport controls.

Every screen in every theme is not required. Draw all screens in phosphor, and the Live
screen in all four.
