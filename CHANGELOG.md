# Changelog

Every change to this project, newest first. Entries record what changed and why it
mattered, not only what moved — a line here should be readable by someone who was not
in the room.

Corrections to station data are listed alongside code changes, because in an archive a
wrong fact is a defect. Where a correction has evidence behind it, the evidence lives in
[docs/RESEARCH.md](docs/RESEARCH.md) and is linked from the entry.

## 2026-09-11

### Fixed — consent

- **Detections are no longer sent without asking.** The app had been posting an
  observation to the server every minute from the moment the detector locked — station,
  frequency, measured period, and the name of the receiver it was heard through — with
  nothing said and no way to decline. It is now off unless switched on, the switch is in
  the live view rather than buried in Diagnostics, and its wording says exactly what a
  detection contains and that it goes only to the server hosting the page. The gate is in
  `src/api.ts`, the only module that talks to the server, so no caller can forget it, and
  unusable storage counts as no answer, which means no.

### Data

- **Transmitter sites, and a correction to where The Buzzer transmits from.** Stations
  now carry `sites` with a `status` of `confirmed`, `claimed` or `former` per entry. The
  dataset had stated as fact that the transmitter "moved from Povarovo to Naro-Fominsk
  in 2010"; neither cited source supports that as written. numbers-stations.com reports
  one site confirmed outside St Petersburg and a second claimed at Naro-Fominsk, and
  Wikipedia records only the St Petersburg move, to within 70 m of the same position.
  Both agree Povarovo was abandoned in 2010. Wikipedia's page coordinate for The Squeaky
  Wheel is deliberately absent — its own infobox leaves the field empty and the figure
  comes from Wikidata with no stated basis. [RESEARCH.md §8](docs/RESEARCH.md) (`c2e993d`)
- **Priyom schedules imported.** 186 slots across the ten active stations that publish
  one, plus frequency lists for E25 and V13. Each slot stores twelve monthly
  frequencies, because that is how these schedules are published — E11's 03:15 slot runs
  8102 kHz in January and 16530 kHz in May. `schemaVersion` 2. The remaining sixteen
  active stations publish neither a schedule nor a frequency list and stay empty.
  (`2e1baf3`)
- **The station roster left the source.** `src/data/stations.ts` was 589 lines of typed
  fixture, so every correction was a code change, a rebuild and a reshipped APK. It is
  `data/stations.json` now, validated in CI, inlined at build time and served from
  `/api/stations` so a correction reaches an installed build without a release.
  (`d438c29`)

### Added

- **A world map of the public receiver directory**, drawn as inline SVG from Natural
  Earth's 110m land outline. It draws all 786 receivers where the list renders fifty,
  and answers a question the SNR ordering cannot: which receiver gives a *different
  path*. No map library and no tile server — the app must work inside the Android build
  with no network. (`8b3ea15`, `c2e993d`)
- **Every station has an address.** `#archive/S28` opens that station, so a station can
  be linked to and returned to. Designators match without regard to case but are never
  normalised, since V02a, S06c and XPA2 are mixed case. (`3f3b600`)
- **Find one for me** takes the best-reported receiver covering the tuned frequency and
  connects, instead of asking someone who has never seen a KiwiSDR to choose between
  776. Connect also walks up to three saved receivers until one answers. (`f9b2ac3`)
- **A page explaining what the app is**, opened by `?` and offered once on a first run.
  (`0896b54`)

### Changed

- **The receiver is released when nobody is there** — after ten minutes without
  interaction, and a minute after the tab goes to the background. A KiwiSDR has four
  channels and the app held one for as long as its socket stayed open. Raised by an
  operator on Priyom's IRC channel before anyone outside this repository had installed
  it. (`763fe0d`)
- **A schedule frequency is presented as a dated report**, not a timetable entry: "16530
  kHz reported for May", and "no September frequency published" where a dash used to
  read as a rendering fault. An XPA transmission was reported live on 10237 kHz in a slot
  whose imported table holds no September frequency at all. (`ce5c013`)
- **A frequency that is the wrong half of a day/night pair is marked off-hours** against
  the current UTC time. The first on-phone session chose The Pip's night frequency at
  11:45 and heard nothing. (`f9b2ac3`)
- **The Claude Design bundle is no longer tracked** — 160 files and 3.8 MB that nothing
  built from. Its tokens and fonts live in `src/tokens/` and `public/fonts/`.
  (`69b034c`)
- **No donation page.** The app stays free and open source; the only support links it
  carries are Priyom's and ENIGMA 2000's. Priyom publish under CC BY-NC-SA 4.0, so the
  non-commercial clause later made this a condition rather than a preference.
  (`afb4dd1`, `763fe0d`)

### Fixed

- **The receiver directory survives its upstream going down.** rx.linkfanel.net was
  unreachable for an afternoon and a failed refresh discarded a perfectly serviceable
  cached list, taking the whole feature with it. It now serves what it holds and says
  so. (`bb39a74`)
- **Station source URLs are escaped before they reach an `href`.** Inert while the data
  was compiled in; a stored-XSS vector the moment it arrived over the network. The
  validator rejects any scheme but http and https, and `safeUrl` refuses to emit one.
  (`d438c29`)
- **Top safe area, and false "no audio" warnings.** The header sat under the status bar,
  and the liveness check timed out before audio had crossed a mobile network — reporting
  a stall over a signal the waterfall was drawing beside it. (`0896b54`)

## 2026-09-10

- **Capacitor wrapper** for on-device testing, with `usesCleartextTraffic` because
  public KiwiSDRs are plain http. (`d3c0446`)
- **Detector rewritten to measure a tracked bin over wall time**, not the band peak per
  frame. Three separate causes, each of which had passed a green test suite: the whole
  passband was thresholded where AGC holds the floor up, every time constant was in
  frames on a waterfall that throttles, and dropouts inside a pulse re-armed the edge
  detector. Stale locks now expire. (`bb2392d`, `29a3eaf`)
- **The Buzzer's pulse period corrected to 3.1 s.** Measured 3.40 s on air against a
  widely repeated 2.4 s; the error traces to a summary of numbers-stations.com, which
  gives a 1.25 s tone and a 1.85 s pause. [RESEARCH.md §7](docs/RESEARCH.md) (`ac8aff1`)
- **The receiver selection fallback is committed rather than returned silently**, which
  had let the interface show one receiver while a connection opened against another.
  (`c1d361b`)
- **First release**: live waterfall with marker detection, schedule with per-slot alerts,
  archive over 141 stations, and a dependency-free Node server. (`fa08fd3`, `1ba5d85`,
  `5e495bf`)
