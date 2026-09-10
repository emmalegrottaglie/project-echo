# UI kit — Project Echo, phone

A click-through recreation of the phone layout specified in
`numberstationsApp/docs/MOBILE_UI_SPEC.md`, built from this design system's components.
393 × 852 (iPhone 15 Pro logical). Open `index.html`.

## What works

- **Tabs.** Live / Schedule / Archive, fading in and lifting 8px. No horizontal slide — tabs are peers, not a stack.
- **Live.** Tap **Connect** to walk `connecting → running`, then the detector walks `searching → detected` and reports 2.38 s against the published 2.40 s. **Stop** returns to idle. **Synthetic** locks faster.
- **Sheets.** The receiver row and station row each open a picker. Inside the receiver sheet, **Browse directory** opens the directory sheet with three skeleton rows, then 6 rows standing in for the top 50 of 776.
- **Archive.** Search and the tier filter both work. Tapping a row pushes the full-screen detail from the trailing edge; the ‹ chevron returns.
- **Detail.** S28 shows full detail with hearings; S32 shows four disputed frequencies; M13c and V30 show the roster-only gap state.
- **Schedule.** Alert switches toggle. **Enable notifications** moves the permission copy from "not yet asked" to "granted", which states the limitation rather than hiding it.
- **Themes.** The four dots in the header switch theme instantly, with no transition.

## What is faked

- The waterfall is a static representation, not a canvas. In the app it is a 320-row
  spectrogram painted one row per frame at 22 fps from an `AnalyserNode`.
- No audio, no WebSocket, no receiver directory fetch. Timers stand in for the state machine.
- 12 stations stand in for 141, and 5 schedule slots for E11's imported set.
- Gestures are not implemented: long-press freeze, vertical scrub through the visible
  history, drag-to-dismiss and edge-swipe back are specified in the source and are
  described in the component prompts, but this kit is tap-only.

## Files

| File | Contents |
|---|---|
| `index.html` | Shell: links `styles.css`, loads the bundle, mounts `App.jsx` |
| `App.jsx` | Tab routing, sheet routing, the connect/detector state machine, theme |
| `LiveScreen.jsx` | Receiver row, station row, status line, waterfall, detector strip, transport |
| `ScheduleScreen.jsx` | Coverage note plus window rows |
| `ArchiveScreen.jsx` | Sticky search and tier filter, tier sections, station rows |
| `StationDetail.jsx` | Pushed detail: detail list, lore, provenance, hearings, archive links |
| `Sheets.jsx` | Receiver picker, station picker, directory browser |
| `data.js` | Fixture lifted from `src/data/stations.ts` |
