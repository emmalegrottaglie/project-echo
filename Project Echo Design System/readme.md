# Project Echo — design system

The design language of **Project Echo**, a shortwave channel-marker monitor and
numbers-station archive. It is a listener's instrument: the user picks a public receiver
somewhere in the world, tunes one of three Russian channel markers that transmit
continuously, and watches a scrolling spectrogram while the app says whether the marker
is really there and at what pulse period. Alongside that live view sit an archive of 141
stations — almost all of them dead — with sourced frequencies and dates, and reminders
before the few stations that still carry traffic are due to transmit.

The stated aesthetic is signals intelligence: **instrument, not dashboard**. The user is
watching a real signal arrive from a transmitter they cannot see, and the interface's job
is to stay out of the way of that.

## Sources

Everything here was read from one attached, read-only codebase. No Figma file, no deck,
no screenshots were provided.

| Source | Path | What it gave |
|---|---|---|
| Codebase | `numberstationsApp/` (mounted local folder) | The whole system |
| Mobile + motion spec | `numberstationsApp/docs/MOBILE_UI_SPEC.md` | Token roles, the four added mobile roles, type scale, space and shape, the complete 14-item motion inventory, screen inventory, state inventory, accessibility and performance budgets |
| Implementation plan | `numberstationsApp/docs/PLAN.md` | Product definition, data model and provenance rules, waterfall geometry, server scope, theme direction |
| Research notes | `numberstationsApp/docs/RESEARCH.md` | Station facts and the legal scope boundary (referenced by the other two documents) |
| Live stylesheet | `numberstationsApp/src/style.css` | The four themes' six colour roles, verbatim |
| App shell + views | `numberstationsApp/src/main.ts`, `src/views/{live,schedule,stations}.ts` | Every string of user-facing copy, control inventory, view structure |
| Instrument code | `numberstationsApp/src/waterfall.ts`, `src/detector.ts` | The inferno colour ramp verbatim, the row rate, the detector's four states and their exact wording |
| Data model | `numberstationsApp/src/types.ts`, `src/data/stations.ts` | Tiers, provenance, disputed frequencies, the roster-only concept, all sample content in this system |

Upstream data sources the product depends on, credited in its own UI:
[Priyom.org](https://priyom.org/), the ENIGMA 2000 control list
([signalshed.com](http://www.signalshed.com/)), [prop.kc2g.com](https://prop.kc2g.com/)
for propagation, and [rx.linkfanel.net](http://rx.linkfanel.net/) for the public
receiver list.

## Products

One product, one surface set.

1. **The phone app** — three tabs (Live, Schedule, Archive), three bottom sheets, one
   full-screen pushed detail view, four themes. Recreated in
   [`ui_kits/echo-mobile/`](ui_kits/echo-mobile/).
2. **The existing desktop layout** (≥ 768 px) is explicitly unchanged by the mobile
   spec and is not recreated here. Its two-column archive is the same components at a
   wider breakpoint.

There is no marketing site, no docs site and no deck in the source, so this system
contains none.

---

## Content fundamentals

The voice is a technician writing for another technician. It is precise, unhurried, and
it volunteers what it does not know.

**Casing.** Sentence case in prose. Lowercase for machine output — status lines and
detector readouts read `idle`, `listening…`, `running — Moscow region · KO85`. Uppercase
only for 12px labels (`RECEIVER`, `LAST CONFIRMED`) and the wordmark. Designators keep
their published case exactly: `S28`, `E03a`, `HM01`, `XPA2`.

**Person.** Second person for the user's own actions and property — "Saved in this
browser, so you only do it once", "your connection goes straight to that node". First
person plural is never used; the app does not speak as a team. The app refers to itself
in the third person: "this app never relays anyone's receiver", "the app records
observations about signals, never their contents".

**Numbers carry units and dates.** `4625 kHz USB`. `2.38 s (25/min)`. `in 18 h 31 m`.
`last confirmed 2025-11-15`. Never a bare number, never "recently", never "a while ago".

**Status is a dated claim, never a badge.** "Live marker, last confirmed 2025-11-15".
"Historical, last confirmed 2008-07-02". "Scheduled, never confirmed". A green *Active*
pill is forbidden: most published listings for these stations are stale, so a badge would
be repeating an error confidently.

**Gaps are stated, with a route onward.** 112 of 141 stations have sourced identity and
no imported detail, and the copy says exactly that: *"The designator, name, operator and
status are sourced; frequencies, schedules and history have not been imported yet."* The
schedule tab opens with *"1 of 26 scheduled stations have imported schedules."* A short
list must read as an import gap, not as a quiet band.

**Failures name themselves and offer the next move.** *"connected but no audio reached
the analyser. Either the receiver is not sending (all channels busy) or the source is
cross-origin without CORS headers."* Never "Something went wrong". Never a retry button
that cannot work — notification permission, once denied, says it is not recoverable
in-app rather than offering a dead control.

**Limitations are printed next to the feature.** *"Alerts fire 10 minutes ahead, while a
tab is open. There is no server, so a closed browser means no alert."*

**Disagreement is shown, not resolved.** *"two different frequency pairs are published
for it and neither source retracts the other. Both are listed below, flagged as
disputed."*

**The scope boundary is stated in the footer of the product and must survive into any
new copy:** the app records observations about signals — frequencies, markers, timing —
and never their contents. Nothing in an interface may imply the app decodes messages.

**Length.** Notes cap at about 68 characters of measure (`max-width: 68ch` in the
source). Status lines are one short clause, because they are ARIA live regions and long
strings get re-announced.

**No emoji, ever.** None appear anywhere in the source. No exclamation marks outside a
quoted transmission. No exhortation, no onboarding cheer, no celebration on a detection —
there is explicitly no gamification: no streaks, no badges, no confetti.

**Vocabulary to use:** marker, designator, receiver, node, passband, tier, provenance,
hearing, window, slot, roster, lock. **Vocabulary to avoid:** dashboard, insights,
seamless, powerful, effortless, unlock, journey, and any word implying interception.

---

## Visual foundations

### Colour

Four themes — phosphor green, amber terminal, midnight blue, night-vision red — all
dark, all narrow-gamut on near black. **There is no light theme and no dark/light
toggle.** Each theme defines the same six roles (`--bg`, `--panel`, `--fg`, `--dim`,
`--accent`, `--border`) plus four added for mobile (`--surface-elevated`, `--overlay`,
`--danger`, `--ok`). Accents were chosen for text contrast first; glow is layered on
afterwards as a shadow, never by lightening the text colour. Every text pair clears WCAG
AA in all four themes — the audit is in
[`guidelines/color-contrast-audit.card.html`](guidelines/color-contrast-audit.card.html);
the tightest pair is `--dim` on `--panel` in nightvision at 4.9:1.

Two theme-specific traps, handled: in nightvision the accent is already red, so
`--danger` moves to orange; in phosphor the accent is already green, so `--ok` moves to
teal.

**The spectrogram is outside the colour system.** It uses a perceptually ordered
inferno-like ramp (`--wf-00`…`--wf-08`, lifted verbatim from `src/waterfall.ts`) and is
never themed. On a hue ramp a mid-amplitude pulse can read as louder than a strong one,
which would make the instrument lie about the marker.

Maximum one accent per screen. Colour never carries meaning alone: the tier, the disputed
flag and every detector state also carry a word or a glyph.

### Type

Two faces, split by what the text *is*. **Monospace** (JetBrains Mono) for data:
frequencies, designators, timestamps, periods, RRULEs, status output, and every control
label. **Platform sans** (`system-ui`) for prose, notes and field labels — deliberately
unbranded, because the app is a browser tab and should look like one.

Mobile scale is four steps and no more: **12 / 14 / 16 / 20**, with 14 as body. Nothing
sits below 12px anywhere; the desktop build's 0.72rem labels grow on mobile. Line height
1.55 for prose, 1.35 for data rows, 1 for controls. Tracking: 0.06em on uppercase labels,
0.03em on mono titles, 0.08em on the wordmark.

ENIGMA designators are the app's proper nouns — always monospace, always accent, never
wrapped mid-token.

### Space, shape and surface

4px base, six steps: 4 / 8 / 12 / 16 / 24 / 32. 16px is the standard horizontal gutter.

Radius is a statement about what a thing is: **3px on controls, 12px on sheet tops, 0 on
the waterfall viewport.** The instrument is square; the interface is slightly soft.

**No drop shadows for elevation.** On these grounds a shadow is invisible, so elevation
is carried by surface: `--bg` → `--panel` → `--surface-elevated`, each separated by a 1px
`--border` hairline. A card in this system is exactly that: panel ground, hairline
border, 3px radius, no shadow, no coloured left border as decoration. The single 2px left
rail in the app is the status line's tone indicator, and it means something.

Glow — `box-shadow` in the accent at low alpha — is reserved for two things: the live
indicator and focus rings. Transparency is used in exactly two places: the sheet scrim at
72% (deliberately translucent, because it must not fully hide the waterfall) and 8%/14%
accent tints for selected segments, disputed rows and switch tracks. **No backdrop blur
on the phone layout** — the one exception the spec allows is the landscape detector strip,
which overlays the waterfall's bottom edge at 60% opacity over a blur.

Touch targets are 44 × 44 px minimum, including the alert toggles, which were glyph-sized
on desktop. **There are no hover states** — every desktop hover affordance needed a touch
equivalent, and press feedback is opacity 0.7 on the row ground, instant, with no exit
animation and no ripple.

Fixed elements: the app header, the bottom tab bar (above the safe-area inset), the
transport bar directly above it, the archive's sticky search plus filter, and sticky tier
headers inside the list. `100vh` is wrong on mobile browsers — use `dvh`, and the
waterfall must not resize when the URL bar appears, because resizing the canvas
mid-stream loses history.

### Background and imagery

Flat colour. No gradient backgrounds, no textures, no patterns, no illustration, no
photography — the source contains none of these and the aesthetic does not want them. The
only full-bleed visual in the app is the spectrogram itself, generated from live audio,
plus the propagation map fetched from prop.kc2g.com. If imagery is ever needed, the honest
register is off-air spectrograms and equipment, cool and near-monochrome; never stock
photography of people in headsets, and never anything referencing an intelligence
service.

### Motion

Fourteen animations exist, enumerated in
[`guidelines/motion-inventory.card.html`](guidelines/motion-inventory.card.html). If an
animation is not on that list, it does not exist.

Durations: 120ms for control state flips, 180ms for view and tab transitions, 260ms for
sheets and the detail push, 400ms for detector confirmation only. Easing: `ease-out`
(0.2, 0, 0.2, 1) entering, `ease-in` (0.4, 0, 1, 1) leaving, `ease-inout` (0.4, 0, 0.2, 1)
moving between two on-screen positions.

Hard rules, all from measured device behaviour:

- Only `transform`, `opacity` and `filter` animate. No animated `height`, `width`, `top`,
  `left`, `margin` or `background-color` on anything sharing a screen with the waterfall.
  The alert switch's track colour is the one documented exception.
- **Battery is a feature.** No continuous decorative animation runs anywhere while audio
  is live. Two loops are permitted: the detector's 1400ms scanning bar (a 2px strip) and
  the directory skeletons, which only run while fetching and never during streaming.
- Nothing bounces. Tabs fade and lift 8px; they never slide horizontally, because tabs
  are peers, not a stack. The transport control crossfades its label and never resizes.
  Numbers that tick — countdowns, measured period, S-meter — change without moving, and
  the countdown animates only when it crosses 1 h, 10 min or 1 min.
- No page-load entrance, no staggered reveal, no reveal-on-scroll, no parallax, no
  pull-to-refresh. Nothing on screen is a feed.
- Theme change is explicitly instant. A 300ms recolour of every surface is a full-page
  repaint and it fights the waterfall.
- The live pulse beats at the station's *own* marker period — 2.4s for The Buzzer, 1.2s
  for The Pip — and fades rather than scales.
- Under `prefers-reduced-motion` transforms drop to crossfades, loops go static, and the
  waterfall keeps scrolling, because it is data, not decoration. A freeze control exists
  for everyone instead.

Performance budget the design must respect: 60fps for interface motion on a three-year-old
mid-range Android *while* the waterfall runs at 22fps and audio decodes; under 4ms of
main-thread work per frame outside the waterfall; nothing that adds per-row cost.

---

## Iconography

**There is no icon set in the source, and none has been invented here.**

`numberstationsApp` ships no SVGs, no icon font, no PNG icons, no sprite sheet and no
favicon. Its complete glyph vocabulary is unicode characters rendered in the monospace
face:

| Glyph | Use in the source |
|---|---|
| `●` | live-tier station rows (`.station-row.tier-live .designator::after`), detector lock |
| `◉` / `○` | alert subscribed / not subscribed (`.alert-toggle`) |
| `›` / `‹` | opens a sheet / back from detail |
| `·` | separator inside data lines — `S28 The Buzzer · 4625 kHz USB` |
| `≈` | detector searching |
| `—` | absent, or no value in a table cell |

Labels do the work icons would elsewhere: the bottom tab bar is three uppercase mono
words, not three pictograms. This is deliberate and worth keeping — an invented glyph in
the most-used control would be unrecognisable, and this interface can afford words.

**If a glyph set is ever genuinely needed**, the closest match to the app's 1px hairline
weight is [Lucide](https://lucide.dev/) at 1.5px stroke, no fill. That would be a
substitution, not a recovery: Lucide is not in the source, is not bundled here, and
adopting it is a design decision someone should make on purpose.

Emoji are never used. See [`assets/README.md`](assets/README.md) for the full inventory of
what does and does not exist.

---

## Fonts — self-hosted

`src/style.css` names `'JetBrains Mono', 'Fira Code', ui-monospace, 'Cascadia Mono',
monospace` but **the repository ships no font binaries.** [`tokens/fonts.css`](tokens/fonts.css)
declares local `@font-face` rules against `assets/fonts/` — no CDN, no third-party
request per load. The app runs from `127.0.0.1` with no service worker, so a remote font
is both a privacy liability and a single point of failure for the face every frequency,
designator and timestamp is set in. JetBrains Mono is SIL OFL 1.1, which permits
self-hosting; keep `OFL.txt` beside the binaries.

Five static woff2 files are wired up in `assets/fonts/`: regular 400, medium 500,
semibold 600, bold 700, and italic 400. Those are the weights the type system actually
asks for. The uploaded set also contains thin through extrabold and a variable axis;
they are deliberately not declared, because an unused `@font-face` is still a file the
browser may fetch.

Prose uses `system-ui`, which is the source's choice and needs no webfont.

---

## Intentional additions

Four things exist here that the source does not define. Each is noted so nobody mistakes
it for something a designer will recognise from the app.

1. **`--tabbar-height: 56px` and `--transport-height: 60px`.** The spec requires a bottom
   tab bar and a fixed transport bar but gives no heights; these satisfy the 44px minimum
   with breathing room.
2. **`--surface-elevated`, `--overlay`, `--danger`, `--ok` values.** The spec requires
   these four roles and defines their *meaning* but leaves the values to design. The
   values here are new; the roles are not.
3. **Accent tint and glow tokens** (`--tint-accent-weak`, `--tint-accent-press`,
   `--glow-accent`, `--glow-accent-tight`). The source uses
   `color-mix(in srgb, var(--accent) 8%, transparent)` inline for disputed rows; these
   name that pattern and extend it to switch tracks and focus rings.
4. **`GapNotice` and `CoverageNote` components.** The source expresses these states as
   ad-hoc `<p class="note">` blocks in three views. §7.6 and §4.2 require them as designed
   states, so they are components here.

---

## Index

### Root

| File | What it is |
|---|---|
| [`readme.md`](readme.md) | This file — context, content fundamentals, visual foundations, iconography, index |
| [`SKILL.md`](SKILL.md) | Agent-skill front matter, for using this system outside this project |
| [`styles.css`](styles.css) | The global CSS entry point. `@import` lines only — link this one file |
| [`thumbnail.html`](thumbnail.html) | Homepage tile |
| [`assets/README.md`](assets/README.md) | Inventory of visual assets, and why the folder is empty |

### Tokens

`tokens/fonts.css` · `tokens/colors.css` · `tokens/typography.css` ·
`tokens/spacing.css` · `tokens/motion.css` · `tokens/instrument.css`

### Components

**core** — [`Button`](components/core/Button.jsx),
[`SegmentedControl`](components/core/SegmentedControl.jsx),
[`SearchField`](components/core/SearchField.jsx),
[`BottomSheet`](components/core/BottomSheet.jsx),
[`ThemePicker`](components/core/ThemePicker.jsx),
[`Skeleton`](components/core/Skeleton.jsx)

**navigation** — [`AppHeader`](components/navigation/AppHeader.jsx),
[`TabBar`](components/navigation/TabBar.jsx),
[`DetailHeader`](components/navigation/DetailHeader.jsx)

**instrument** — [`WaterfallPanel`](components/instrument/WaterfallPanel.jsx),
[`DetectorStrip`](components/instrument/DetectorStrip.jsx),
[`LivePulse`](components/instrument/LivePulse.jsx),
[`StatusLine`](components/instrument/StatusLine.jsx),
[`TransportBar`](components/instrument/TransportBar.jsx),
[`ReceiverRow`](components/instrument/ReceiverRow.jsx)

**archive** — [`StationRow`](components/archive/StationRow.jsx),
[`TierHeader`](components/archive/TierHeader.jsx),
[`DetailList`](components/archive/DetailList.jsx),
[`ProvenanceTable`](components/archive/ProvenanceTable.jsx),
[`Flag`](components/archive/Flag.jsx),
[`GapNotice`](components/archive/GapNotice.jsx)

**schedule** — [`ScheduleRow`](components/schedule/ScheduleRow.jsx),
[`AlertSwitch`](components/schedule/AlertSwitch.jsx),
[`CoverageNote`](components/schedule/CoverageNote.jsx)

**receiver** — [`DirectoryRow`](components/receiver/DirectoryRow.jsx)

Every component has a sibling `.d.ts` props contract and a `.prompt.md` with a usage
example and the rules that apply to it. The inventory follows §12.4 of
`MOBILE_UI_SPEC.md` — station row, provenance row, schedule row with alert switch,
detector strip in four states, receiver row, status line, sheet chrome, segmented control,
primary/secondary transport controls — plus the screen chrome those screens need. Nothing
was added because a design system "usually" has it: there is no Toast, no Avatar, no
Tooltip, no Modal, because the app has none.

### UI kit

[`ui_kits/echo-mobile/`](ui_kits/echo-mobile/) — the phone app at 393 × 852, click-through.
See its [README](ui_kits/echo-mobile/README.md) for what works and what is faked.

### Templates

[`templates/echo-phone/`](templates/echo-phone/) — **Echo phone screen**. A 393 × 852
starting frame: header, receiver and station rows, waterfall, detector strip, transport
bar and bottom tabs, composed from this system's components. Theme and detector state are
exposed as tweaks.

### Guidelines

25 specimen cards in [`guidelines/`](guidelines/), grouped in the Design System tab as
**Colors** (four themes, mobile roles, contrast audit, accent tints and glow),
**Instrument** (spectrogram ramp, waterfall geometry), **Type** (mono, sans, mobile scale,
designators), **Spacing** (space scale, radius, hairlines and elevation, touch targets),
**Motion** (durations, easing, inventory, reduced motion) and **Brand** (wordmark, glyph
vocabulary, status-is-a-dated-claim, honest gaps).

---

## Non-goals, carried over verbatim

These are the product's, not this system's, and any new design must honour them:

- No message decoding UI, ever. Nothing may imply the app interprets transmission
  content.
- No onboarding carousel, no tour, no tooltips-on-first-run.
- No gamification of detections — no streaks, badges or celebration.
- No map view. Receiver geography matters, but a map is a later, separate decision.
- No dark/light toggle. All four themes are dark by design.
- No branding implying affiliation with any intelligence service, real or historical. The
  aesthetic references the equipment, not the institutions.
- The app is served over plain http and cannot be a PWA: no service worker, no
  installability, no splash screen, no app icon. Anything that reads as "installed native
  app" is a lie.
