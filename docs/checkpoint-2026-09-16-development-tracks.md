# Development tracks checkpoint — 2026-09-16

This planning session is paused at the user's request. The five-track development specification and
implementation kickoff are written. This checkpoint records handoff state, not a new feature assignment
or acceptance of work completed in other sessions.

## Decisions to retain

- Five tracks: parser/rules engine; foe coverage; characters (wizard, sheets, progression); UI/polish;
  app/social features.
- Valid character and foe coverage can advance ahead of complete automation, with correct supported
  calculations, full source text under existing audience rules, and explicit manual effects.
- Parser and engine develop together through bounded source-to-persisted-state/history increments.
- Active work uses separate worktrees and short-lived slice branches, integrating completed slices
  into tested `main`. Backend changes need runtime isolation as well as code isolation.
- Hands-on UI feedback needs the user at the desktop. Reports, concrete examples, screenshots and phone
  dictation support progress elsewhere. Only work dependent on an unanswered decision waits.
- Existing V1 scope, source-only rules research, shared operations and review requirements remain.

The [roadmap](v1-roadmap.md) owns these decisions and recommended starting assignments. The
[build process](build/README.md) owns operational details. The reusable
[track kickoff](kickoff-development-track.md) starts an individual implementation thread.

## Repository state observed at this checkpoint

The shared checkout is `/srv/presidium/projects/salient/code`, on `main` at `e83930e`.
The planning changes remain **uncommitted** there: the roadmap, specification checkpoint, development
process, build README/status, root README, `agent.MD`, `CLAUDE.md`, historical kickoff/handoff notices,
the new track kickoff, and this checkpoint. Preserve and review those changes before committing them;
new worktrees from committed `main` do not automatically receive them.

Additional worktrees now exist. This is a discovery snapshot, not an activity, review or completion report:

| Worktree directory under `/srv/presidium/projects/salient/` | Branch | Observed HEAD |
| --- | --- | --- |
| `characters` | `slice/V24` | `87059f8` |
| `characters-build` | `slice/V25` | `8a6c06c` |
| `engine-parser` | `slice/V22` | `9d50b47` |
| `engine-parser-spec` | `slice/V26` | `e83930e` |
| `foes` | `slice/V23` | `3003ac5` |

Their uncommitted changes, reports, backend targets and verification were not audited in this checkpoint.
Recheck current Git state and the relevant work logs before acting. Do not create duplicate assignments,
switch branches in their working directories, stop their processes, or infer merge readiness from a commit.
This thread created no implementation worktrees or runtime environments and performed no deployment.

## Verification

This session's changes are documentation only. Markdown formatting, relative links/anchors and Git
whitespace checks pass. Application tests were not rerun. Earlier prototype acceptance remains bounded
to [its recorded revision, scenarios and limitations](build/evidence/v001-acceptance.md).

## Ready-to-paste kickoff for the next session

```text
Resume the development-coordination session from
docs/checkpoint-2026-09-16-development-tracks.md.

Read AGENTS.md, agent.MD, CLAUDE.md, docs/v1-roadmap.md, docs/build/README.md,
docs/build/STATUS.md and docs/kickoff-development-track.md. Preserve the five confirmed tracks,
independent content/automation progress, worktree/runtime isolation and the agreed feedback cadence.

First inspect current Git status and worktrees. The planning specification was left uncommitted
in the shared main checkout, and other sessions have already created V22–V26 worktrees. Read their
latest slice documents, work logs and review evidence before proposing or claiming work. Reconcile
the planning handoff with that progress; do not restart the recommended first assessments if they
have already been done, or treat this checkpoint's branch list as current proof of readiness.

Give a concise report of what is implemented, what is reviewed or ready for integration, what is
still manual, and the next bounded work or decision. Continue authorized independent work within
the established scope. Keep product/rules questions concrete and in plain text, record decisions
in owning specs, and preserve other sessions' work. Coordinate commits/integration through the
existing lead process; report integration separately from any running-app update.
```
