# Project Echo — Corrected Research Baseline

Date of survey: 2026-09-10. Every factual row below carries a source. Where sources
disagree, that is recorded rather than resolved silently.

Read this alongside [PLAN.md](PLAN.md), which contains the revised implementation plan.

---

## 1. Corrections to the original brief

The original brief contained seven factual errors that would have shipped as product
copy and as seeded database rows. They are listed first because they change scope,
not just wording.

| # | Original claim | Correction |
|---|----------------|------------|
| 1 | Atención / V02 — "Active" | V02a has been **inactive since February 2019**. Most of its schedules were taken over by HM01 in November 2012. HM01 itself went off the air on 2024-08-23 after the Radio Habana Cuba transmitter failed permanently while switching from 11635 kHz to 10715 kHz, and has only partially returned as of 2026. The Cuban voice station is a historical exhibit, not a live feed. |
| 2 | V15 — "Active" | V15 broadcast weekly until 2019-06-27, then only four more times (2019-09-19, 2019-11-09, 2020-03-07, 2020-03-12). Nothing heard since. Treat as dormant. |
| 3 | UVB-76 designator | "UVB-76" is an obsolete callsign from the 1970s–80s and is not what the station transmits today. Voice identifiers observed since 2010: **MDZhB**, then **ZhUOZ** (2019), then **ANVF**. Display the ENIGMA ID (S28) and the current voice ID; keep "UVB-76" only as a search alias. |
| 4 | UVB-76 buzz "~1.2s repeating" | **Superseded — see §7.** The first pass here recorded a ~2.4 s period from Wikipedia's "approximately 25 tones per minute". A live measurement and a closer read of the sources both put it near 3.1 s, about 19 per minute. |
| 5 | The Pip — "Southern Military District" | Radioscanner attributes The Pip to a **North Caucasus** military district communications centre, callsign *Akacia* (ex-72nd communications centre). The Squeaky Wheel (S32) is the one usually placed in the Southern district. |
| 6 | Gong Station G03 / Stasi | Priyom attributes G03 "Gongs or Chimes" to the East German **Nationale Volksarmee**, not the Stasi. The Stasi attribution belongs to G08 "Four Note Rising Scale". Both are in the roster with the correct operators. |
| 7 | V24 — "Active" | Added after the first pass. Priyom's V24 page states it was last heard in **September 2020** and has been inactive since. The category index does not mark it inactive, which is how it survived the first review — a reminder that the index and the station pages disagree, and the station page wins. |

Consequence for scope: **the app cannot be built around live voice-message capture.**
Of the seven stations in the original brief, at most two are reliably on the air, and
neither transmits numbers on a schedule a user can wait for. The product has to be a
*channel-marker monitor plus an archive*, not a numbers-message scanner. Section 6
reflects that.

---

## 2. Station set, rebuilt

Split by what the app can actually do with each one.

### 2a. Continuously audible — the live tier

These transmit a channel marker 24/7. They are what a "live" view can honestly show.

| ENIGMA | Name | Frequencies | Marker | Operator |
|--------|------|-------------|--------|----------|
| S28 | The Buzzer | 4625 kHz USB | 1.25 s buzz, 1.85 s pause, ~19/min, 24 h — measured 3.40 s here, see §7 | Russian military, 69th communications hub; site moved Povarovo → Naro-Fominsk in 2010 |
| S30 | The Pip | 5448 kHz day / 3756 kHz night | short beep, ~50/min | Russian military, *Akacia*, North Caucasus |
| S32 | The Squeaky Wheel | Sources disagree: 5473 / 3828 kHz, or 5367 / 3363.5 kHz | squeaking sweep | Russian military, Southern district |

The S32 frequency conflict is exactly why the schema in [PLAN.md](PLAN.md) stores
frequencies as observation-backed rows with a `last_confirmed` date and a source URL,
not as constants.

### 2b. Scheduled and active — the alerting tier

The Russian SVR cluster (referred to as "Russian 7" on Priyom) plus the Polish and
Korean stations. These do carry real traffic, on published schedules, which is what
makes schedule alerts worth building.

| ENIGMA | Mode | Notes |
|--------|------|-------|
| E07 | English voice | Active; example logging 12147 kHz, 2025-04-10 |
| S06 | Russian voice | Active |
| M12 | Morse | Active, high volume |
| XPA2 | MFSK polytone, 7.5 baud, USB | Active; first heard May 2006; sibling of XPA/XPB |
| E11 | English voice, "Oblique" | Polish operator; replaced G02 "Swedish Rhapsody" |

Full active roster per the Priyom category indexes (fetched 2026-09-10):

- **English voice:** E06, E07, E11, E25
- **Slavic voice:** S06, S06c, S11a, S25
- **German voice:** none — no German-language station remains in regular operation
- **Other-language voice:** V07, V13, V28
- **Morse:** M01, M01a, M12, M14, M23
- **Digital:** F01, F03, F06, F06a, F07, P03, P07, XPA, XPA2, XPB, and HM01 with the
  caveat above — the index lists it active, its own station page does not

### 2c. Historical — the lore tier

| ENIGMA | Name | Ran until | Notes |
|--------|------|-----------|-------|
| E03 | The Lincolnshire Poacher | Final recording 2008-07-02 | RAF Akrotiri, Cyprus; attributed to SIS |
| E03a | Cherry Ripe | Last reported December 2009 | Guam, then Humpty Doo, Australia from late Sept 2009 — only two months there |
| V02a | Atención | Feb 2019 | Cuban DGI; superseded by HM01 from Nov 2012 |
| HM01 | — | 2024-08-23 | Hybrid voice + RDFT digital; transmitter loss, partial recovery in progress |
| V15 | Pyongyang | 2020-03-12 | Aired inside Pyongyang Broadcasting Station programming, framed as university assignment lists |
| V24 | — | September 2020 | Korean; musical intro, 3–4 digit identifier, length announcement, groups read twice |
| G02 | Swedish Rhapsody | superseded by E11 | Polish |

Beyond these, the full ENIGMA roster runs to roughly 112 inactive designators across
all six categories — the Bulgarian S02/M13 families, the Czechoslovak S05/S10/M06/M10
families, the Polish M03 series, G01–G22 in German, and one-offs like V30 "The
Lighthouse" (Vietnam) and M40 (North Korea). All of them are seeded in the app as
roster entries: designator, name, operator and status sourced, detail not yet
imported. The app marks that distinction rather than rendering an empty station as a
station with nothing to say.

---

## 3. Data sources

| Source | What it gives | How to use it |
|--------|---------------|---------------|
| [Priyom.org](https://priyom.org/number-stations) | Per-station schedules, frequency tables, operator groupings, logs | The primary source. No official API. Scrape politely — one fetch per station per day, cached, a `User-Agent` identifying the app, and visible attribution in the UI. A community scraper exists ([priyomScraper](https://github.com/BeanGirlThing/priyomScraper)) as a reference for page structure. |
| [ENIGMA 2000 Active Station List v1.3](http://www.signalshed.com/docs/ENIGMA%202000%20Active%20Stations%20List%20V1.3.pdf) | Canonical ENIGMA designators and classification prefixes | One-time seed for IDs and naming. Static PDF; parse once by hand into a fixture, do not fetch at runtime. |
| [ENIGMA 2000 newsletters](http://www.signalshed.com/nletter06.html) | Two-monthly frequency and activity updates | Manual review cadence for keeping the seed honest. |
| [Signal Identification Wiki](https://www.sigidwiki.com/wiki/Category:Numbers_Stations) | Reference waveforms and sample audio | Fingerprints for the marker detector, and fallback samples for the historical tier. |
| [The Shortwave Radio Audio Archive](https://shortwavearchive.com/) | Dated off-air recordings | Archive tier content, with attribution. |
| [prop.kc2g.com](https://prop.kc2g.com/) | MUF(3000)/foF2 from IRI-2016 conditioned on live ionosonde data via GIRO and NOAA; refreshed every 5 minutes; `api/moflof.svg?grid=<maidenhead>&metric=mof_sp` | Answers "why can't I hear it right now", which is the single most common user question for any shortwave app. Worth building in early. |

The ENIGMA prefix convention (E = English, G = German, S = Slavic, V = other voice,
M = Morse, X/HM = digital) should be surfaced in the UI, not hidden — it is most of
what makes the designators legible to a newcomer.

---

## 4. Audio acquisition — the hard constraint

### KiwiSDR reality check

- A KiwiSDR supports **four simultaneous connections**, each with its own audio and
  waterfall channel. Public nodes commonly advertise 8–12 slots via multiplexing but
  the underlying hardware limit is small and shared.
- Busy public nodes enforce short inactivity timeouts.
- The mechanism for headless audio is [`kiwiclient`](https://github.com/jks-prv/kiwiclient):
  `kiwirecorder.py --netcat` streams raw or WAV samples to stdout, which pipes into
  `ffmpeg`. The repository `Makefile` carries working invocations. There is no
  documented supported path for third-party relay.
- **A one-worker-to-many-listeners relay consumes a volunteer's receiver and uplink to
  serve our users.** No public KiwiSDR terms of use authorising rebroadcast could be
  found, and its absence is not permission. Relaying a named node without asking is
  the kind of thing that gets the project blocked node by node.

Three honest options, in order of preference:

1. **Bring-your-own node.** The client connects directly to a public KiwiSDR or WebSDR
   the *user* picks, from a list, with the node's own load and etiquette rules applying
   to that one user. Zero infrastructure, no relay ethics problem, and it works for the
   whole live tier. This is the right Phase 1.
2. **Own receiver.** An Airspy HF+ Discovery, or an RTL-SDR with an HF upconverter, on
   a dedicated antenna, hosted. Then the relay is ours to give away. This is the only
   clean basis for a shared always-on stream, and it is the honest cost of the
   multiplexer feature.
3. **Negotiated relay.** Written permission from specific node operators, credited in
   the UI, with per-node rate limits. Viable, but it is a relationship-management
   project rather than an engineering one.

The original plan's Phase 2 assumed option 3 without the negotiation and priced it as
option 1. That is the plan's largest risk, not its transcoding step.

### Codec and container

- Icecast has native, well-maintained Ogg and Opus support — the only mainstream
  streaming server that does.
- Safari ships Ogg Opus from **18.4**; below that it needs CAF, and Safari does not
  support Opus in MP4 at all, so an MP4/HLS ladder cannot simply carry Opus.
- Practical answer for narrowband SSB voice: mono, 24–32 kbps. Serve **Ogg Opus over
  Icecast** as the primary and an **HLS/AAC-LC** ladder as the fallback for older
  Safari. One `ffmpeg` process produces both from a single input; the decision costs
  one extra output, not an extra pipeline.

### The CORS trap

This one silently breaks the core feature, so it is called out on its own.

Per the Web Audio spec, a `MediaElementAudioSourceNode` built from a cross-origin
media resource **outputs silence**. Playback still works. The spectrogram just shows
nothing, with no error. Two requirements follow:

1. The `<audio>` element must carry `crossOrigin="anonymous"` **and** the stream server
   must send `Access-Control-Allow-Origin`. Both, or the analyser reads zeros.
2. With hls.js, the `MediaElementAudioSourceNode` must be created **after** the
   manifest has loaded and attached to the element, or initialisation fails or yields
   silence.

There is no reliable feature test for the CORS-restricted case, and
`createMediaElementSource` cannot be reverted, so the app should verify non-silence
once at startup — sum a frame of `getByteFrequencyData`; all zeros across several
frames while the element reports playing means CORS — and surface a specific
diagnostic instead of a dead waterfall.

---

## 5. Legal and ethical constraints

Reception of shortwave is legal nearly everywhere. **Publishing what you received is
the regulated part**, and this app is a publishing app.

- United States: 47 U.S.C. § 605 restricts divulging or publishing the contents of
  non-broadcast radio communications to persons other than the addressee.
- United Kingdom: the Wireless Telegraphy Act 2006 makes it an offence to listen to
  transmissions not intended for general reception and to disclose their contents.

Numbers stations sit awkwardly inside both: they are unencrypted, transmitted in the
clear on well-known frequencies, and archived openly by long-standing hobby groups
including ENIGMA 2000 and Priyom — but they are plainly not intended for general
reception.

Practical position for the product, to be reviewed by counsel before any public
launch:

- Archive and display **channel markers, signal characteristics, schedules, and
  metadata** freely. These are observations about a signal, not its contents.
- For voice and digital message content, prefer **linking to established archives**
  over hosting recordings, and never present decoded groups as decoded intelligence.
- Do not build message decoding as a feature. Store what was heard, and when.
- Geofencing is not a real defence and adds complexity; being metadata-first is.

---

## 6. What changed in the plan

Summarised here; the plan itself is in [PLAN.md](PLAN.md).

1. **Phase 1 has no backend.** Client-only, against a user-chosen public receiver. The
   waterfall, the station database, the schedule view, and the propagation layer all
   ship without a server.
2. **The waterfall scroll transform in the original plan is wrong.** Writing rows at
   `y = currentRow` on an `H`-tall canvas and translating the viewport by
   `-currentRow` scrolls the wrong way and shows the wrap as a visible tear. Fix:
   canvas of height `2H`, write each row **twice** at `y = r` and `y = r + H`,
   translate by `-(r + 1)`. The viewport then always shows `H` consecutive rows with
   the newest at the bottom, seamlessly. Detail in [PLAN.md](PLAN.md) §2.
3. **SQLite only.** Postgres buys nothing for a few hundred stations and some
   observation rows. The interesting schema problem is provenance, not scale.
4. **Multiplexer deferred to Phase 3**, behind either owned hardware or written
   permission. It is not a prerequisite for a usable app.
5. **Propagation promoted into Phase 1.** It is cheap, it is a live external feed, and
   it answers the question the app will otherwise get wrong.

---

## 7. The Buzzer's pulse rate, measured

On 2026-09-10 the app's own detector measured S28 through a public KiwiSDR at Tremolat,
France (JN04KU) on 4625 kHz USB: a stable **3.40 s period, about 18 pulses a minute**,
with an envelope of roughly 1.4 s on and 1.95 s off read independently off the
waterfall. That disagreed with the 2.4 s this document originally recorded, so the
sources were re-read.

| Source | Figure | Implied period |
|---|---|---|
| [numbers-stations.com](https://www.numbers-stations.com/russia/the-buzzer/) — detailed timing | "the buzzing tone lasts 1.25 seconds, with a 1.85 second pause" | **3.10 s ≈ 19/min** |
| [Wikipedia](https://en.wikipedia.org/wiki/UVB-76) — summary sentence | "approximately 25 tones per minute" | 2.40 s |
| Wikipedia — detail sentence | "lasts 1.2 seconds, pausing for 1–1.3 seconds, and repeating 21–34 times per minute" | 2.2–2.5 s, which its own 21–34/min range contradicts |
| [Priyom.org](https://priyom.org/military-stations/russia/the-buzzer) | states no rate at all | — |
| This installation, measured | 3.40 s | **3.40 s ≈ 18/min** |

Both Wikipedia sentences carry the same single citation — the numbers-stations.com page
— and neither matches what that page actually says. Its "21–34 times per minute" range
also contradicts the "1.2 s + 1–1.3 s" arithmetic in the same sentence. The community
authority publishes no figure.

So the measurement agrees with the only detailed published timing, to within 10 %, and
the 25-per-minute figure looks like an error introduced in summarising rather than a
change on the air. `markerPeriodSec` for S28 is now 3.1 s, sourced to
numbers-stations.com, and the station's lore records the disagreement.

Two things this leaves open:

- **The residual 10 %.** 3.40 s measured against 3.10 s published is inside the app's
  25 % tolerance but not inside measurement noise. A path with fading drops individual
  pulses, which stretches intervals, and this was a single receiver on one evening.
  Worth re-measuring from a receiver closer to Naro-Fominsk.
- **S30's rate has the same provenance problem.** The Pip's "~50 beeps per minute" also
  comes from Wikipedia and has not been measured here. Treat it as unverified.

## Sources

- [UVB-76 — Wikipedia](https://en.wikipedia.org/wiki/UVB-76)
- [The Buzzer (UVB-76), August 8 2025 — Shortwave Radio Audio Archive](https://shortwavearchive.com/archive/the-buzzer-uvb-76-august-8-2025)
- [The Pip — Wikipedia](https://en.wikipedia.org/wiki/The_Pip)
- [The Pip — Priyom.org](https://priyom.org/military-stations/russia/the-pip)
- [The Squeaky Wheel — Wikipedia](https://en.wikipedia.org/wiki/The_Squeaky_Wheel)
- [Squeaky Wheel S32 — Mystery Signals](http://www.mysterysignals.signalshed.com/page21.html)
- [V02a — Priyom.org](https://priyom.org/number-stations/other/v02a)
- [HM01 — Priyom.org](https://priyom.org/number-stations/digital/hm01)
- [V15 — Priyom.org](https://priyom.org/number-stations/other/v15)
- [V24 — Priyom.org](https://priyom.org/number-stations/other/v24)
- [Russian 7 operator group — Priyom.org](https://priyom.org/number-stations/operators/russian-7)
- [E11 — Priyom.org](https://priyom.org/number-stations/english/e11)
- [Station schedules — Priyom.org](https://priyom.org/number-stations/station-schedule)
- [Lincolnshire Poacher — Wikipedia](https://en.wikipedia.org/wiki/Lincolnshire_Poacher_(numbers_station))
- [Cherry Ripe — Wikipedia](https://en.wikipedia.org/wiki/Cherry_Ripe_(numbers_station))
- [E03/E03a profile — Numbers & Oddities](https://www.numbersoddities.nl/E03-profile.pdf)
- [XPA2 Polytones — numbers-stations.com](https://www.numbers-stations.com/digital/xpa2/)
- [ENIGMA 2000 Active Station List v1.3](http://www.signalshed.com/docs/ENIGMA%202000%20Active%20Stations%20List%20V1.3.pdf)
- [ENIGMA 2000 newsletters 2025](http://www.signalshed.com/nletter06.html)
- [Numbers Stations — Signal Identification Wiki](https://www.sigidwiki.com/wiki/Category:Numbers_Stations)
- [kiwiclient — jks-prv](https://github.com/jks-prv/kiwiclient)
- [Introduction to using the KiwiSDR](http://kiwisdr.com/ks/using_Kiwi.html)
- [Ogg Opus streaming — Radio Mast](https://www.radiomast.io/solutions/opus-streaming)
- [Opus codec browser support](https://www.testmuai.com/learning-hub/opus-audio-codec-browser-support/)
- [Analyzing HLS audio streams with Web Audio API and hls.js](https://dev.to/andreyburov30/analyzing-hls-audio-streams-with-web-audio-api-and-hlsjs-ffb)
- [Detecting a CORS-restricted MediaElementAudioSourceNode — W3C issue 2453](https://github.com/WebAudio/web-audio-api/issues/2453)
- [MUF(3000km) — prop.kc2g.com](https://prop.kc2g.com/)
- [How do I read this? — prop.kc2g.com](https://prop.kc2g.com/about/)
