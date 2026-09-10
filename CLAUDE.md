# Project Echo — agent instructions

## Rule 0 — load the caveman skills before doing anything

Before any other tool call in a session, and before answering any question about this
repository, invoke the `caveman` skill. Do it first, unconditionally, even when the
request looks trivial — a one-line answer still gets written in caveman style, and the
skill is what defines that style.

Then, before starting the work itself, invoke every other caveman skill that fits the
task. Do not pick one and skip the rest if several apply; do not defer this until after
the first edit.

| If the task is… | Also invoke |
|---|---|
| new behaviour, a feature slice, an integration | `lean-build` |
| a bug fix or a small behaviour change | `surgical-patch` |
| an unexplained failure, a flake, a perf regression | `investigate-first` |
| restructuring without behaviour change | `safe-refactor` |
| a schema, data, API, or dependency transition | `migration` |
| reviewing a diff, branch, or PR | `caveman-review` |
| writing a commit message | `caveman-commit` |
| checking finished work against acceptance conditions | `verify-and-stop` |
| locating code, editing 1–2 files, reviewing a diff via a subagent | `cavecrew` |
| compressing a memory or instruction file | `caveman-compress` |

Order: `caveman` first, then the task skills, then the work. If no row matches, the
`caveman` skill alone is still required.

Reason this is Rule 0 and not a preference: the skills carry the session's output
contract and the architecture-first simplicity policy. Work started without them gets
redone.

## What this project is

A shortwave channel-marker monitor and numbers-station archive. Read
[docs/RESEARCH.md](docs/RESEARCH.md) before touching station data or audio code, and
[docs/PLAN.md](docs/PLAN.md) before adding a phase.

All three phases are built. A Vite + TypeScript client (no framework; `rrule` and a
lazily-loaded `hls.js`) and a dependency-free Node server using `node:sqlite`.
`npm start`, then <http://127.0.0.1:8080>.

Client: live waterfall with marker detection, schedule with per-slot alerts, archive
over a typed station fixture. Server: proxied receiver directory, observation storage,
relay HLS with CORS. The client must keep working without the server — those three
features hide themselves when `/api/health` fails.

The interface is the phone layout from [docs/MOBILE_UI_SPEC.md](docs/MOBILE_UI_SPEC.md),
reflowing to the desktop layout at 768 px. Tokens and fonts in
[src/tokens/](src/tokens) and [public/fonts/](public/fonts) are copied unchanged from
`Project Echo Design System/` — edit them there and re-copy rather than diverging.
Component markup lives in [src/ui.ts](src/ui.ts); that bundle's React components are a
design reference and are not shipped. Before adding any animation, read the fourteen-item
inventory in the spec: if it is not listed, it does not exist.

[README.md](README.md) covers the deployment constraint (the app must be served over
http to reach `ws://` receivers) and the load-bearing implementation details.

## Standing constraints

These come out of the research and are not open for re-derivation on the fly:

- **No station fact without provenance.** Every frequency and every activity claim
  carries a `source_url` and a `last_confirmed` date. Sources disagree (S32's
  frequencies are published two ways) and the schema records the disagreement rather
  than picking a winner.
- **Activity status is data, not a constant.** Most of the famous stations are off the
  air. Do not hardcode "Active".
- **No message decoding, ever.** The app stores observations about signals — markers,
  periodicity, timing — never their contents. This is a legal boundary, documented in
  [docs/RESEARCH.md](docs/RESEARCH.md) §5, not a scope preference.
- **Do not relay a third party's receiver.** Public KiwiSDR nodes are volunteer
  hardware with four hardware channels. Phase 1 is bring-your-own-node. A shared
  stream requires owned hardware or written permission.
- **`crossOrigin` and `Access-Control-Allow-Origin` are load-bearing.** A cross-origin
  `MediaElementAudioSourceNode` outputs silence with no error and no log. Any change to
  the audio graph keeps the startup non-silence check.
- **SQLite, not Postgres.** The scale does not justify the dependency.

## Style boundary

Caveman compression is a chat style. Anything persisted outside the chat is normal
prose: code, comments, commit messages, these documents, memory files, and anything
addressed to someone other than the repository owner.
