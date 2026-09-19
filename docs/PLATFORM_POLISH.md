# Platform polish — strategy and plan of action

This is a proposal, not a spec. [docs/MOBILE_UI_SPEC.md](MOBILE_UI_SPEC.md) stays
authoritative for what the interface looks like and how it moves; nothing here
overrides it, and anything approved out of this document gets folded into the spec's
own inventory before it ships — the spec's rule that an animation not listed there does
not exist still applies.

The request behind it was broad: research Android UI/UX best practice and come back
with a plan to make the app more polished and smooth. The research is below, but the
plan is deliberately narrower than "adopt best practice," because most of what current
Android guidance recommends is Material You visual language — dynamic color, tonal
elevation, M3 components — and this app has already made a different, considered
choice. It has its own aesthetic (the phosphor terminal theme, the four hand-built color
schemes in [src/tokens/](../src/tokens), a fourteen-item motion inventory chosen for a
waterfall display rather than borrowed from a component library) and restyling toward
generic Material would be *undoing* design work, not finishing it. The
[`frontend-design`](../CLAUDE.md) instinct that generic-AI-app aesthetics are a defect
applies here as much as anywhere: the goal is for this app to feel like a well-made
native app, not for it to stop looking like itself.

So the plan below keeps to the part of "Android best practice" that is actually about
*platform conformance* — gesture handling, safe areas, touch feedback, and finishing the
motion spec's own inventory — and treats visual restyling as explicitly out of scope.

## What the research actually found

Three searches, summarized with what each means for this codebase specifically rather
than repeated as generic advice:

**Material Design 3 / general mobile UX** ([market.gluestack.io](https://market.gluestack.io/blog/mobile-app-design-best-practices),
[developer.android.com](https://developer.android.com/design/ui/mobile),
[designstudiouiux.com](https://www.designstudiouiux.com/blog/mobile-app-design-best-practices/)) —
the substance underneath the marketing is: minimum 44pt touch targets, consistent
component behavior, and profiling startup/transition time. All three are real and
checkable against this app rather than aspirational. Material You's dynamic theming and
tonal-elevation surface system is not applicable — this app's theming is deliberately
fixed per palette, not derived from the user's wallpaper, and that is correct for a
terminal aesthetic.

**Capacitor/WebView-specific UX** ([capgo.app](https://capgo.app/blog/cross-platform-uiux-best-practices-for-capacitor-apps/),
[nextnative.dev](https://nextnative.dev/blog/improve-mobile-app-performance)) — modern
WebView performance is good enough that the ceiling is the app's own code, not the
container: small bundle, compressed assets, a shallow DOM (guidance suggests keeping
total node count under ~1500), and testing on a real device rather than trusting an
emulator. This project already does the bundle-splitting part right — `hls.js` (574 KB)
loads only when the relay is actually used, per the comment in
[src/audio/relay.ts](../src/audio/relay.ts) — and the DOM per view is small because
markup is generated on demand rather than templated wholesale. Worth a real measurement
rather than an assumption; see Phase D.

**Edge-to-edge and safe areas** ([developer.chrome.com](https://developer.chrome.com/docs/css-ui/edge-to-edge),
[capawesome.io](https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/),
[codelabs.developers.google.com](https://codelabs.developers.google.com/codelabs/gesture-navigation)) —
this is the one finding with a concrete, checkable claim against this repository, not
just a good idea. Two facts compound:

1. `android/variables.gradle` sets `targetSdkVersion = 36`. Android 15 enforces
   edge-to-edge for any app targeting SDK 35+, and Android 16 removed the opt-out
   entirely. This app already targets a version where edge-to-edge is not optional.
2. The app's only safe-area handling is CSS: `env(safe-area-inset-*)` in
   [src/tokens/spacing.css](../src/tokens/spacing.css), enabled by `viewport-fit=cover`
   in `index.html`. The research is specific that Android WebView below version 140 has
   had bugs here — the top inset sometimes reporting 0 — and that Capacitor apps
   generally need the native side to plumb `WindowInsets` through explicitly rather than
   trusting the WebView's own CSS environment variables.

Nothing in this app's code currently reads `WindowInsets` on the native side at all —
grep for it comes back empty. The CSS variables may well be resolving correctly on the
device already tested against (nothing reported wrong with the tab bar or header during
the Friday device-testing round), but that was not tested for specifically, and it is
the kind of failure that is invisible until a gesture-nav phone with an older WebView is
in someone's hand. See Phase A.

## Non-goals

Stated plainly, because "make it more polished" invites scope creep:

- **No Material Design visual adoption.** No M3 components, no dynamic color, no
  elevation shadows. This app's surfaces are flat and its palette is fixed by design.
- **No animation invented outside the existing inventory.** Anything new in Phase C
  gets written into [docs/MOBILE_UI_SPEC.md](MOBILE_UI_SPEC.md) §5.2 before it is built,
  same as every animation already there.
- **No framework migration.** The `innerHTML`-string-component approach stays; this is a
  platform-conformance pass, not a rewrite.
- **No third native plugin without saying so.** Two have been added so far
  (`@capacitor/local-notifications`, discussed in [CHANGELOG.md](../CHANGELOG.md)) and
  each one is a real decision — the app stops being a bare WebView wrapper a little more
  each time. Phase B proposes a third and names that cost explicitly, per this project's
  own rule that a dependency needs a stated tradeoff, not just a benefit.

## The plan

Ordered by how directly each phase serves "feels smoother" versus how much it costs,
cheapest and most certain first.

### Phase A — Verify and, if needed, fix safe areas on a real device

**Acceptance:** on the device already used for Friday's testing round, confirm the top
and bottom insets are non-zero in gesture-navigation mode, with the status bar and the
gesture bar both. If they are already correct, this phase is a documented finding and a
regression test, not a code change.

If they are wrong: the fix is `@capacitor/status-bar` and reading `WindowInsets` on the
native side rather than trusting the WebView's own CSS resolution, exposed to the page
as CSS custom properties the way the design bundle originally intended. This is the
Phase B tradeoff pattern again — a native dependency — but a broken safe area on a
gesture-nav phone is a correctness bug (content behind the nav bar), not a polish
question, so it would be justified rather than optional.

**Non-goal inside this phase:** do not add inset handling speculatively before
confirming it is broken. The lean-build discipline this project already follows — build
where the invariant is proven to live, not where it might — applies here too.

**Result, checked 2026-09-19 on a Motorola Edge 50 Pro** (Android 16, target SDK 36,
WebView 151, gesture navigation on) via Chrome DevTools Protocol against the installed
debug build — reading both the CSS custom properties and `env(safe-area-inset-*)`
directly from the live page, cross-checked against `dumpsys window`'s own inset frames
rather than trusted on their own:

| | native (`dumpsys window`) | CSS (`env(safe-area-inset-*)`) |
|---|---|---|
| Portrait, top | 106 px physical → 37.7 px CSS | `--safe-top: 38px` |
| Portrait, bottom | 68 px physical → 24.2 px CSS | `--safe-bottom: 25px` |

Agreement to within a rounding pixel. **Portrait is correct on this device** — the
WebView-below-140 bug the research flagged does not reproduce here, and the header and
tab bar both sit clear of the status bar and the gesture pill (`headerTop: 0` with the
padding already accounting for it; `tabbarBottom` flush to `innerHeight`, its own
content held clear by the same token). No fix needed; this table is the regression test
until the next Android or WebView jump makes it worth re-running.

**Landscape surfaced a real gap, on a different axis than the one being tested for.**
Rotated both directions, the OS reports a genuine left inset alongside the top one — 106
physical px / 38 CSS px in one rotation, matching the portrait status bar's own size
rotated onto its side — and this app's CSS defines `--safe-top` and `--safe-bottom`
only. `grep` confirms it: no `--safe-left` or `--safe-right` token exists anywhere in
[src/tokens/](../src/tokens) or [src/style.css](../src/style.css). The header and tab
bar's actual left edge sat 14 CSS px short of where the OS says content becomes unsafe.

Not fixed here, on this evidence: screenshots in both landscape rotations show no
camera cutout or notch actually intruding on that edge on this device — the Edge 50 Pro
has no landscape-relevant hardware cutout, so the reported inset is not currently
covering anything a person can see wrong. Adding `--safe-left`/`--safe-right` on the
strength of a device that shows no visible defect would be exactly the speculative fix
this phase's own non-goal rules out. Recorded instead: the CSS coverage is two of four
edges, a device with an actual landscape-relevant punch-hole would be affected, and
nobody has checked one. If landscape use turns out to matter for this app — it does not
currently, the layout is designed portrait-first — this is where to look first.

### Phase B — Touch feedback (haptics)

**Acceptance:** `@capacitor/haptics` fires a light tick on the actions that most benefit
from confirmation without a screen glance — the transport button on connect/stop, the
alert switch, and the detector's confirm animation (item 5 in the spec's inventory,
which already marks that moment as significant). Falls through silently on the web
build and in a browser tab, the same pattern `src/notify.ts` already uses for
`Capacitor.isNativePlatform()`.

**The tradeoff, stated:** this is the third native plugin. It buys the one thing a
WebView categorically cannot do on its own — a physical tick synchronized to a UI event
— and it is a single, narrow API with no permission prompt and no manifest changes
beyond the plugin's own registration. Worth doing for that reason. Not worth doing on
every tap: the spec's own row 12 ("row press... native-feeling... no ripple") already
identifies restraint as the actual native feeling, and haptics on every scroll or list
tap would read as noise, not polish.

**Done.** [src/haptics.ts](../src/haptics.ts), same lazy-load shape as
[src/notify.ts](../src/notify.ts) — `Capacitor.isNativePlatform()` gates the import, so
a browser pays nothing and gets nothing. Three call sites, matching the three named
above: the transport button (`tick`, `ImpactStyle.Light`), the alert switch (`tick`),
and the detector's confirm transition (`confirm`, `NotificationType.Success`) — gated by
the same `dataset.state` transition guard that already stops the confirm *animation*
(row 5) from restarting every second while the marker stays locked, so the buzz fires
once on entry and not once a second while `detected` holds.

Verified on the Motorola Edge 50 Pro via `dumpsys vibrator_manager`, matched against a
reference signature taken from a direct plugin call: `ImpactStyle.Light` is 57 ms,
usage `TOUCH`, pattern `[0,50@0.31]`; `NotificationType.Success` is 124 ms, usage
`UNKNOWN`, pattern `[0,35@0.70,65,21@0.50]`. All three call sites produced a matching
entry — transport connect, alert switch, detector confirm. `AndroidManifest.xml` gained
only `VIBRATE`, a normal permission granted at install with no runtime prompt.

**Found on the way, fixed alongside this phase:** `src/notify.ts`'s lazy plugin loader
had never actually worked. `local()` returned the raw `LocalNotifications` proxy across
an `await` boundary; a Capacitor plugin is a `Proxy` that answers *any* property access,
including `.then`, with a stub that throws for anything that is not a real plugin
method. The JS engine's thenable check sees that truthy `.then`, calls it to try to
"unwrap" the return value, and the resulting throw left every caller's `await local()`
hanging forever — `delivery()`, `ensurePermission()`, `granted()`, and the schedule sync
in `run()`. This is why the alert switches always rendered disabled: `refreshDelivery()`
never resolved. Local notifications were unit-tested (`test/notify.test.ts`) but that
only pins `plan()`/`notificationId()`, the pure half — the native handover needed a
device and had never been checked. Fixed by keeping the plugin reference in module
scope and having the async loader return a `boolean` instead of the plugin itself,
in both `src/notify.ts` and the new `src/haptics.ts`. Re-verified end to end on device:
permission prompt → granted → 8 alerts actually reached Android's `schedule()` call.

### Phase C — Finish the motion spec's own inventory

**Acceptance:** row 2 of [docs/MOBILE_UI_SPEC.md](MOBILE_UI_SPEC.md) §5.2 — "Detail
push... translateX 100%→0... Back gesture reverses, interruptible and following the
finger" — is specified and not built. `detailSlot.innerHTML = detailHtml(station)` in
[src/views/stations.ts](../src/views/stations.ts) swaps the detail view in with no
transition and no drag-to-go-back at all.

This is the single highest-leverage item in this whole plan: it is not new design work,
research, or a dependency — it is closing a gap between a document already approved and
code that never caught up to it. The interaction pattern needed (a view that tracks a
horizontal drag 1:1 and springs back or completes based on position and velocity) was
already built once this month, for the sheet's drag-to-dismiss in
[src/ui.ts](../src/ui.ts) `openSheet` — the same pointer-capture, threshold-and-velocity
logic applies to a horizontal push instead of a vertical one, on the same interruptible
terms the spec asks for.

**Also in scope for this phase, same reason (spec exists, code does not — audit before
building):** re-check the other thirteen inventory rows against the current code now
that the app has grown since the spec was written, the way row 2 turned out to have
drifted. A one-hour audit, not a rebuild.

### Phase D — Measure, don't assume, on performance

**Acceptance:** a number, not an opinion. `document.querySelectorAll('*').length` on the
heaviest real screen (the archive list, 141 rows) against the ~1500-node guidance the
research surfaced; and the existing `hls.js` lazy-load confirmed with the network panel
on a real device rather than inferred from the source comment. If both come back
healthy — plausible, given the loader pattern already in place — this phase is a
documented result, the same shape as Phase A. If not, the fix is scoped after the
number, not before it.

## What this deliberately leaves out, and why

- **Dark/light "system" theme switching.** The app already has four deliberately
  chosen themes rather than one that derives from the OS; that is a decision already
  made, not a gap.
- **Onboarding flows, empty-state illustration, animated icons.** Real "polish" items in
  the generic listicle sense, and exactly the kind of addition that would fight this
  app's restraint-first motion philosophy (§5.1: "no continuous decorative animation
  runs while audio is live," and the spec's explicit refusal of shimmer/ambient loops).
  Not proposed here; revisit only if the four phases above land and still leave the app
  feeling unfinished, which is not the expectation.

## Sources

- [Mobile app design best practices](https://market.gluestack.io/blog/mobile-app-design-best-practices) — gluestack
- [Mobile | UI Design | Android Developers](https://developer.android.com/design/ui/mobile)
- [12 Mobile App UI/UX Design Best Practices](https://www.designstudiouiux.com/blog/mobile-app-design-best-practices/) — Design Studio UI/UX
- [Cross-Platform UI/UX: Best Practices for Capacitor Apps](https://capgo.app/blog/cross-platform-uiux-best-practices-for-capacitor-apps/) — Capgo
- [Improve Mobile App Performance in Capacitor Apps](https://nextnative.dev/blog/improve-mobile-app-performance) — NextNative
- [Chrome on Android edge-to-edge migration guide](https://developer.chrome.com/docs/css-ui/edge-to-edge) — Chrome for Developers
- [Capacitor Edge-to-Edge & Safe Areas: The Complete Guide](https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/) — Capawesome
- [Gesture Navigation and the edge-to-edge experience](https://codelabs.developers.google.com/codelabs/gesture-navigation) — Google Codelabs
