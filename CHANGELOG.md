# Changelog

Every change to this project, newest first. Entries record what changed and why it
mattered, not only what moved — a line here should be readable by someone who was not
in the room.

Corrections to station data are listed alongside code changes, because in an archive a
wrong fact is a defect. Where a correction has evidence behind it, the evidence lives in
[docs/RESEARCH.md](docs/RESEARCH.md) and is linked from the entry.

## 2026-09-11

### Added

- **Report a correction, from any station page.** Every fact in the archive carries a
  source and a date, and until now there was no way for a reader who found one wrong to
  say so. The form asks what is wrong, what it should be, and on what evidence — a
  source is required, for the same reason every frequency has one — then opens a
  prefilled GitHub issue carrying what the archive currently claims, so the report is
  actionable by someone reading a notification with the app closed.

  It posts nowhere. A form backed by the server would have worked for almost nobody: the
  server binds to loopback unless changed, and the static client and the Android build
  both run without one, so the person most likely to spot a wrong frequency has no
  server to post to. This needs no endpoint, no table, no rate limiting and no
  moderation.

  Where the fact came from Priyom — frequencies, schedules, status, operator — the form
  says so and points at `#priyom`, because fixing it upstream fixes it for everyone
  rather than only here. Transmitter sites were researched in this repository, so those
  it keeps.

- **The great-circle path, drawn on the receiver map.** A straight line on an
  equirectangular map is not the route a signal takes: the short way from Moscow to a
  receiver in Missouri goes over the Arctic, and drawn flat it would cross Kazakhstan and
  the Atlantic — a picture of the wrong path, on a map whose only purpose is showing
  which path you are listening over. Interpolated by spherical linear interpolation and
  projected point by point, cut at the antimeridian so a Pacific route is not drawn as a
  streak back across the whole world.

  Only from the chosen receiver, and only to a transmitter that has not been abandoned:
  786 paths would bury the map, and a path to Povarovo is a route to nothing.

- **A timeline, of what is actually known.** Ten of 141 stations carry a date, and the
  shape of that is the point: endings are recorded well because a station's death is an
  event someone notices, beginnings badly because a station starts by being noticed
  rather than announced. Three bars run off the right edge still transmitting; the rest
  stop — the Lincolnshire Poacher in 2008, Cherry Ripe in 2009, Atención in 2019, V15
  and V24 in 2020, HM01 in 2024.

  A station known only by when it stopped gets a mark at that year and **no bar
  stretching back to a start nobody published**. Six stations have a sourced start and
  four of those are a decade narrowed by hand, so those bars fade out to the left rather
  than capping at a year Wikipedia explicitly declines to give. `ActiveFrom` carries the
  source's own phrasing beside the year for exactly that reason.
  [RESEARCH.md §9](docs/RESEARCH.md)

- **A designator decoder, which is also a filter.** The archive is 141 rows of E11,
  S06c, XPA2 and M12, which look like inventory codes and are in fact a classification:
  ENIGMA 2000 assign the leading letter by language and mode, so the roster is already
  sorted by what a station sounds like. "What do the codes mean?" in the archive header
  opens the nine families present in the data — Morse 38, Slavic voice 33, English voice
  22, and so on down to one hybrid — and picking one filters the archive to it, which is
  what makes it worth building rather than writing down. It composes with the tier
  control and says what it has applied, with the way back out.

  Every station page now reads its own designator aloud where it used to print a bare
  classification: "S for Slavic voice, 06 for the station, c for a variant of it". The
  designators that do not follow the pattern — HM01, SK01, the XPA polytones — say so
  instead of being given a parse they do not have. The counts come from the roster
  rather than a hardcoded legend, so they cannot rot.

- **A credits and licence page.** Attribution had been living in three places a reader
  would never visit — a per-station footnote, `data/LICENSE`, and a repository README —
  which satisfies nobody and least of all CC BY-NC-SA, whose attribution clause is a
  condition rather than a courtesy. There is now a page saying who Priyom.org and
  ENIGMA 2000 are, what each contributed, what the licence requires, and what this
  adaptation changed, reachable from the archive header, from every station's source
  line and from the help screen.

  Neither group publishes a donation link, so the page invents none. What they ask for
  is reception reports, which it points at instead — Priyom's `#priyom` channel on
  Libera.Chat. It also credits rx.linkfanel.net, prop.kc2g.com, Natural Earth and
  JetBrains Mono, and states plainly that this app takes no money of any kind.

- **"Last heard", under the tuned station.** The one question a dead-looking waterfall
  cannot answer on its own is whether the silence is the band or the station, and this
  answers it from evidence rather than from a published claim that may be years stale:
  "Last heard — 14 m ago, 3.41 s period — recorded by this server". Absent entirely when
  the server holds no record, rather than saying "never", and cleared before each fetch
  so one station's evidence is never shown under another's name.

  Deliberately not "four of six listeners are hearing it". Counting listeners needs
  something that distinguishes them, and the only thing that did was the receiver name,
  which was removed in the same session and for good reason. A recency answer needs no
  identifier at all and settles the same question. It is worded as the server's record
  rather than as the truth, because on a personal install that record is the user's own
  listening history and nobody else's.

### Fixed — consent

- **A contributed detection no longer names the receiver it was heard through.** The
  measurement is the contribution — station, frequency, period, steadiness — and which
  volunteer's node someone listened through is incidental to it while putting a third
  party's hardware into a record of what a person listened to. The server keeps the
  column for rows already written and still accepts one from any other client; this
  client stops sending it, and the archive's "Heard here" table shows steadiness in its
  place. One consequence, stated because it is not obvious: the server dedupes on
  station and time window, so two people hearing the same station in the same ten
  minutes now collapse into one row.
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
