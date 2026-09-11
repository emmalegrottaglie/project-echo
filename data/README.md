# Station data

`stations.json` is the roster: 141 stations, their identity, status, frequencies and
schedules. It is the source of truth. Nothing in `src/` holds station facts.

## Where the rows come from

Schedules and the frequency lists that accompany them are imported:

```bash
npm run import-priyom     # rewrites this file from priyom.org, then read the diff
```

Never hand-edit a row the importer produces — re-run it and commit the diff, so the
result stays reproducible. [`scripts/import-priyom.mjs`](../scripts/import-priyom.mjs)
documents what it refuses to read and why: it will not touch a table with a `Message`
column, because that is V07's log of received transmissions and storing message content
is the legal boundary in [docs/RESEARCH.md](../docs/RESEARCH.md) §5; and it skips rows
Priyom renders in italics, which its own legend marks as outdated.

Descriptions come from [`scripts/import-lore.mjs`](../scripts/import-lore.mjs), which
quotes Priyom's own paragraph for each station and records the page in `lore.quotedFrom`.
It refuses the same boundary from the other direction: it strips every table before
reading a word, because a station page lays its message formats out as tables of sample
five-figure groups, and it drops any paragraph that still looks like groups. It writes no
dates — sentences that mention when a station started are printed for a person to weigh,
for the reason in [docs/RESEARCH.md](../docs/RESEARCH.md) §9. Re-running it refreshes
every quoted description and leaves hand-written ones alone.

Everything else — identity, operator, tier, the twelve hand-written descriptions, the
live markers' frequencies — is hand-written and stays that way.

## Corrections from readers

Every station page in the app carries **Report a correction**, which opens a prefilled
issue with the field, what the archive currently records, the proposed value and a
source. Those arrive as issues labelled `data`; act on one by editing this file and
committing, so the change carries the same provenance as everything else here.

## Editing it

Edit the JSON and open a pull request. There is no admin interface and no database
table behind this on purpose — git history is what records who changed a fact and on
what evidence, and review is where the provenance rule below is actually enforced by a
person rather than only by a script.

```bash
npm test        # validates this file, among everything else
```

`test/stations.test.ts` runs `src/data/schema.ts` over the committed file, so a bad
edit fails CI rather than shipping. It checks, among other things:

- every frequency and every schedule carries a `sourceUrl` and the frequency carries a
  `lastConfirmed` date — the provenance rule from [docs/PLAN.md](../docs/PLAN.md) §3;
- every schedule carries exactly twelve `khzByMonth` entries, January first, and at
  least one of them is a frequency. A slot with nothing in any month is not a slot;
- every schedule carries a `lastConfirmed` date. A schedule frequency is a record of
  what listeners reported, not a timetable, and without the date the interface cannot
  tell anyone how old the claim is;
- every transmitter site carries a name, a position in range, a `status` of
  `confirmed`, `claimed` or `former`, a `lastConfirmed` date and a `sourceUrl`. A
  station with no sourced position has an empty `sites` array, and that is the correct
  state — see [docs/RESEARCH.md](../docs/RESEARCH.md) §8 for the one coordinate this
  project refuses to use;
- `activeFrom` and `activeUntil`, where a station has them, each carry a four-digit year
  no later than this one, the source's own phrasing in `note`, and an `approximate` flag
  marking a date that bounds the station's life rather than being it — a first or last
  hearing, against a source saying the station started or ceased. An ending before its
  beginning is rejected. Most of the roster has `null` at one end or both, which is
  correct — see [docs/RESEARCH.md](../docs/RESEARCH.md) §9, which also says why
  `activeUntil` is not the same field as `lastConfirmed`;
- every URL is `http` or `https`. Nothing else is accepted, because these strings are
  interpolated into `href` attributes in the archive view;
- designators are unique, tiers are one of `live`, `scheduled`, `historical`;
- the file is `JSON.stringify(…, null, 2)` with a trailing newline, so a one-field
  change shows up as a one-line diff.

If the test fails it names every problem it found, not only the first.

## Rules that are not stylistic

- **No station fact without provenance.** A frequency with no source is not a
  frequency. Where sources genuinely disagree — S32 is published as both 5473/3828 kHz
  and 5367/3363.5 kHz — list both and set `disputed` on each. Do not pick a winner.
- **Activity status is a dated claim.** `tier` plus `lastConfirmed`, never a bare
  "active". Most published listings for these stations are stale and repeating them
  confidently is how the errors spread.
- **`lastConfirmed` is the date the cited source confirmed it**, not the date you
  edited the file.

## How an edit reaches people

1. Merged into `main`.
2. The build inlines a copy, so a fresh build and any new APK carry it.
3. `GET /api/stations` serves the file from disk, cached against its mtime and tagged
   with a hash of its contents. Editing it and reloading is enough to see the change;
   the server does not need restarting.
4. An installed client fetches that in the background and caches it in `localStorage`
   under `echo.stations`. **The new data applies at the next launch**, not mid-session.

So a correction reaches an installed Android build without a release. A client that
cannot reach the server, or that gets something failing validation, keeps the copy it
was built with — clearing `echo.stations` always returns it to that.

## Changing the shape

`schemaVersion` is `3`. Version 2 replaced a slot's single `khz` with twelve
`khzByMonth` entries; version 3 turned `lore` from a bare string into `{ text,
quotedFrom }`, because most descriptions are now quoted from Priyom and a reader is owed
the difference between somebody else's paragraph and this archive's own. Bump it only for a change an older client cannot read; an
unknown version makes clients keep their bundled copy instead of guessing, which is
what stops a new dataset from breaking an APK someone installed months ago. Adding an
optional field does not need a bump. Renaming or removing one does.
