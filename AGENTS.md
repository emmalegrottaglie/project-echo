# Project Echo — agent instructions

The full instruction set lives in [CLAUDE.md](CLAUDE.md). This file exists so agents
that follow the `AGENTS.md` convention pick up the same rules.

## Rule 0 — load the caveman skills before doing anything

Before any other tool call, and before answering any question about this repository,
invoke the `caveman` skill. Then invoke every other caveman skill that fits the task
before starting the work: `lean-build` for features, `surgical-patch` for bug fixes,
`investigate-first` for unexplained failures, `safe-refactor` for restructuring,
`migration` for schema or dependency transitions, `caveman-review` for diffs,
`caveman-commit` for commit messages, `verify-and-stop` for completion checks, and
`cavecrew` when delegating to a subagent. If several apply, invoke all of them.

If a row does not match the task, the `caveman` skill alone is still required.

## Everything else

Read [CLAUDE.md](CLAUDE.md) for the standing constraints — provenance on every station
fact, no message decoding, no relaying a third party's receiver, the CORS non-silence
check, and SQLite over Postgres — then [docs/RESEARCH.md](docs/RESEARCH.md) and
[docs/PLAN.md](docs/PLAN.md) for the project itself.
