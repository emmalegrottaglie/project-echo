# Changelog

Every change to this project, newest first. Entries record what changed and why it
mattered, not only what moved — a line here should be readable by someone who was not
in the room.

Corrections to station data are listed alongside code changes, because in an archive a
wrong fact is a defect. Where a correction has evidence behind it, the evidence lives in
[docs/RESEARCH.md](docs/RESEARCH.md) and is linked from the entry.

## 2026-09-13

### Security

- **A page the user visited could put script into the archive.** `khz` was interpolated
  straight into `innerHTML` on the station page, and it was reachable: every JSON
  response carried `Access-Control-Allow-Origin: *`, so any website could POST an
  observation to the loopback server, and SQLite keeps a non-numeric string in a `REAL`
  column unchanged. A crafted value survived the round trip and ran in the app's origin.
  Confirmed end to end against a running server before and after the fix.

  Closed at three points, because one of them alone would have left the others standing:

  - **The write is validated.** `server/observation.mjs` is new and holds the whole
    trust boundary: types, lengths, and a timestamp parsed and re-emitted by this
    process. A bad field is refused with `400` naming it, rather than stored. It is a
    module of its own because the endpoint takes writes without authentication, which
    makes this the part that has to be right.
  - **The API no longer answers other origins.** The client is served by the same
    server and never needed the header. Only `/stream/` and `/diagnostic/` keep it —
    that is the CORS which is load-bearing, where a `MediaElementAudioSourceNode` is
    silent without it, and the `/diagnostic-nocors/` pair still reproduces that failure.
  - **The client renders a figure only when it is one.** A measurement that is not a
    finite number shows an em dash. Stronger than escaping, and it also keeps `toFixed`
    off a string, which threw and took the whole hearings table with it.

- **Any origin could also read the hearings.** `GET /api/observations` answered every
  origin with the station, time and frequency of everything the user had listened to.
  The receiver label was removed from this payload in September for a third party's
  privacy; the server was handing the rest of it to any page in the browser. Same fix:
  the header is gone from the API.

- **Server errors no longer echo their message.** A rejected write says which field was
  wrong, because the caller can act on that. Everything else returns `server error`.

- **The page carries a Content Security Policy.** The whole interface is built by
  assigning strings to `innerHTML`, and today proved what that costs when one value
  escapes the escaping. The policy is the backstop: verified in the browser, an
  `onerror=` handler injected exactly the way the stored XSS arrived is now refused by
  `script-src-attr`, and an inline `<script>` and a third-party one by `script-src-elem`.
  The payload would not run even if the escaping regressed.

  It is a meta tag in [index.html](index.html) rather than a response header because the
  client is built to run with no server at all — the Android wrapper loads these files
  from disk, and a header would cover only the case that needs it least. The server adds
  `frame-ancestors 'none'` on HTML, which a meta tag may not carry, with
  `X-Content-Type-Options` and `Referrer-Policy`.

  Two directives are wider than the rest and both are named in the markup with the reason:
  `connect-src ws: wss:`, because the receiver is whichever public KiwiSDR the listener
  picks out of thousands, and `style-src 'unsafe-inline'`, because the timeline and the
  world map position elements with a `style` attribute computed per row. Checked against
  the built app, the dev server and the timeline's 17 bars and 56 ticks: no violations,
  and the inline positions still resolve.

### Fixed

- **The hearings table no longer throws on a malformed row.** `periodSec.toFixed(2)` on
  a string took out the whole `<div>`. Rows written before the validation existed can
  still be in anyone's database.

## 2026-09-12

### Fixed

- **One dead page no longer aborts the whole lore import.** `scripts/import-lore.mjs`
  threw on any non-200, so S10b — a station Priyom still links from its own index, whose
  page has since been removed — killed a run of 130 fetches and wrote nothing. The
  importer could not be re-run at all, which was the one thing it was built to support.

  A 404 on a station page is now survivable and reported; a 404 on an index page, and
  every other failure, stays fatal. "Not there" is a fact about the archive and "we could
  not tell" is a fact about the network, and quietly skipping the second would drop a
  description that still exists. Pages are also cached only after the status check, so a
  failure is never stored as though it were a page.

  Found by running the importer against the live site for the first time. Every page
  until then had come from a cache built with `curl -o`, which writes the body of a 404
  to disk like any other, so the failure had no way to surface.

### Data

- **S10b's page is gone, not empty.** It had been recorded alongside V12 as a station
  whose Priyom page carries an infobox and nothing else. An error page has no body
  section either, which is indistinguishable from an empty one once it is sitting in a
  cache — the two only separated when the fetch and the parse happened in the same
  process. See [docs/RESEARCH.md](docs/RESEARCH.md) §10.

  The live run otherwise reproduced the committed dataset exactly: 125 descriptions, no
  diff.

## 2026-09-11

### Added

- **An ending for 66 stations, read out of the descriptions just imported.** The
  description import left a visible hole: seven stations showed "end unrecorded" on the
  timeline while the quoted paragraph directly above said when they stopped. A second
  pass over the same text found 63 more endings, and the three famous stations whose
  descriptions are written here rather than quoted were recorded in the same shape. The
  timeline went from 16 dated stations to 73 of the 141.

  `activeUntil` is a new field rather than a use of `lastConfirmed`, because they are
  different claims. `lastConfirmed` is an ISO date this archive can stamp — evidence the
  station transmitted that day. "Last reported in late 1999" has no day in it, and
  forcing one would invent precision that changes what the sentence means. G06 is the
  case that settles it: Priyom record it retired from regular operation in March 2021 and
  then heard in test transmissions on 11 November 2024. It now carries both, and the
  timeline runs its bar to the later, because both are lower bounds on when it was last
  on the air.

  Fourteen stations also gained a real `lastConfirmed` where a page named a full calendar
  date for a last hearing, so their status line reads "last confirmed 1997-10-30" instead
  of "never confirmed".

- **Two more starts**, from sentences the first pass's pattern missed: S10d "Active from
  1996" and XP "Active from 1993 until 2005". The importer now reports beginnings and
  endings separately, so the next re-run surfaces both.

### Changed

- **`approximate` now means "this date is not the event", on both ends.** It used to mark
  a year narrowed by hand from a decade. The endings made the sharper reading necessary:
  "Ceased in 2001" is a source saying the station stopped, while "Last heard in 1996" is
  a source saying somebody stopped listening — the transmitter may well have run on. The
  first draws a hard edge on the timeline, the second fades. Nothing about the starts
  changed in substance; a first hearing was already approximate for the same reason, and
  now the field says why.

- **The station page shows both ends in the source's own words.** A `Start` and `End` row
  carrying the sentence the date came from — "Active since mid 1970s", "until 20 June
  2007" — rather than a bare year that would flatten a sighting and a cessation into the
  same thing.

- **`ActiveFrom` is now `SourcedYear`**, since both ends are the same shape, and
  `schemaVersion` stays 3: `activeUntil` is tolerated absent, so a dataset cached by an
  older build still validates.

### Fixed

- **The timeline stopped calling a hearing a cessation.** A bar runs to the later of the
  year a source says a station ceased and the date it was last confirmed on the air,
  because both are lower bounds. The label and the hard right edge, though, were decided
  from whether a cessation existed at all rather than from whether the cessation was the
  year being drawn. G06 therefore read "ceased 2024" — on the year its own quoted
  paragraph describes as a test transmission, three years after the March 2021 retirement
  it actually records. It now reads "last heard 2024" with a soft edge, which restores
  what `src/style.css` already promised: a hard edge means a source said the station
  stopped.

- **`npm run typecheck` now covers `test/`.** It only ever looked at `src`, so three test
  fixtures had drifted out of the `Station` type without failing anything — one of them
  since yesterday's `lore` change. They passed because the tests never read the fields
  they were missing, which is exactly the kind of silence a typecheck exists to break.
  `allowJs` is on so the tests that import the server and the importers can be checked at
  all.

- **A description for 125 stations that had none, quoted from Priyom.** Most of the
  roster arrived from ENIGMA 2000's list as identity only: a designator, an operator and
  a status, with the app honestly saying nothing else had been imported. Priyom publish a
  paragraph for nearly every one of them, so `scripts/import-lore.mjs` fetches it and
  quotes it. The archive now has history behind 137 of 141 stations instead of 12.

  Quoted rather than rewritten, and the data says which. Paraphrasing somebody else's
  research would have read as this archive's own work while being theirs, and their data
  is CC BY-NC-SA 4.0, which asks for attribution by name. A quoted description renders as
  a quotation with the page and the licence beside it; the twelve written here render as
  plain prose. See [docs/RESEARCH.md](docs/RESEARCH.md) §10.

  The importer's refusals are in the script, not in a reviewer's head. A station page
  lays its message formats out as tables of sample five-figure groups, so every table is
  stripped before a word is read and any paragraph that still looks like groups is
  dropped on a second check — the boundary in [docs/RESEARCH.md](docs/RESEARCH.md) §5,
  enforced twice because the page layout is Priyom's to change. Paragraphs that point at
  something on the page ("as heard below") are dropped too: true where they were written,
  a broken quote anywhere else. Both refusals are pinned by tests.

- **Ten more sourced start dates, all of them approximate.** The import printed every
  sentence that mentioned a year beside a beginning, and ten of them were the station's
  own first hearing: M10 "Active since mid 1970s", E21 "First noted around 1981", E09
  "first heard in February 1995", and seven more listed in
  [docs/RESEARCH.md](docs/RESEARCH.md) §9. The timeline now places sixteen stations
  rather than six.

  Nine other year-bearing sentences were rejected, and the test that separated them is
  reported against derived: a date a source states belongs in `activeFrom` with its own
  phrasing kept; a date worked out from the earliest row of a log table does not, because
  it records when logging started. The rejected ones were endings, facts about a
  different station, or the appearance of a schedule rather than of the station. The
  importer writes no date itself for exactly this reason.

### Changed

- **`lore` is now `{ text, quotedFrom }`, and `schemaVersion` is 3.** A bare string could
  not say whose words it held, which stopped being an acceptable gap the moment most
  descriptions came from somewhere else. Older clients keep their bundled copy on an
  unknown version, so an installed APK is unaffected until it updates.

- **The timeline no longer says a dead station is still transmitting.** Its bars ran to
  the right-hand edge whenever no end year was recorded, which had been harmless while
  the only stations with a start were ones whose fate was known. Seven of the ten starts
  imported today belong to stations that stopped without anybody writing down when, and
  those bars claimed thirty years of transmission each. A span needs both ends: a station
  known by one date now gets a single mark and a label saying which date it is.

- **"Not imported" now names the gap that is actually there.** It used to appear whenever
  a station had no description, and hid the frequency, schedule and site tables with it.
  With descriptions imported, the missing thing for those 125 stations is operational: no
  confirmed frequency and no transmission time. The notice says that instead, below the
  history rather than in place of it.

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
