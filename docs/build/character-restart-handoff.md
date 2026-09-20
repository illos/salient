# Fresh-session handoff: restart character development with Astra

Status: implementation resumed after this handoff was staged. The original staging session changed
documentation only; [STATUS.md](STATUS.md#astra-delivery-and-verification-queue--2026-09-20) records
the current candidate commits, verification queue and unresolved blocker.

## Read first

1. `agent.MD` and [the dead-end decision](../decisions/2026-09-19-opus-pilot-dead-end.md).
2. [Astra workflow](astra-character-workflow.md) and [V44 scope](V44-character-option-delivery.md).
3. Relevant character specification sections, the existing reference procedure and remote runbook
   linked from those documents. Then read the actual current modules before assigning files.

The user's requirements remain: every ancestry and included class through level ten, each
ancestry/class/level as its own logical commit, same-build Forge verification, an initial combined
audit, and verified incremental merges. Complete level-one coverage before expanding the new queue
into later class levels. Existing Berserker level-two support must remain working.

## Starting point

Use a new branch/worktree from current main. Do not reset to an old commit: main contains this
handoff and the permanent rejection of the pilot. Its application, tests, runtime, dependency and
source-pin trees match pre-pilot `88d1e61793939feedf37ec88181e128fd721364e` when this handoff was
staged. Check for later legitimate changes before relying on that statement.

Already delivered: partial Devil/Berserker Fury and Polder/Fire Elementalist paths; Fury 1→2 and
history/restoration; V37 supporting choices; V40/V42 wizard presentation; V45 modular foundation.
The foundation is not a task to rebuild. None of these partial paths certifies all options.

Useful starting files:

- `shared/content/ancestries/devil/level-one.ts`, `shared/content/ancestries/polder/level-one.ts`.
- `shared/content/classes/fury/level-one.ts`, `shared/content/classes/fury/level-two.ts`.
- `shared/content/classes/elementalist/level-one.ts`.
- `shared/content/character-decisions.ts`, `shared/content/character-support.ts`.
- `shared/evaluate/character.ts` and the ancestry/class files under `shared/evaluate/`.
- `shared/contracts/characterEvaluation.ts`, `shared/contracts/characterSheet.ts`.

Compendium pin: `fb83a789da8f0327a389c277a0c790b1648d5810`.
Forge pin: `5a846aadb623a9855a023e9403bb887a956c341f`.
Read rules only from the pinned Compendium; do not research Draw Steel on the web.

## First implementation session

- Check main/worktrees, `STATUS.md` and Chords. Confirm no overlapping ownership. Keep Opus stopped.
- Assign fresh Astra implementers Devil level one and Polder level one, using separate new branches
  and slice IDs. Start at V57/V58 only if those numbers are still unused; V46–V56 are retired pilot IDs.
  Both units start from main and derive their code, tests and expectations again.
- The lead owns shared composition/evaluation contracts and the first runtime baseline. Reserve an
  explicitly named clean CT114 environment such as `character-restart`, after checking it is unused.
  Do not start a stack for each subagent. Coordinate heavy jobs and capture with one runtime owner.
- Establish current-main checks in that environment, then test each finished integration candidate.
  If baseline faults block verification, assign a bounded repair while independent implementation
  continues. Do not release a failed merge or freeze unrelated coding behind it.
- Justify each test by the concrete failure it catches and its added coverage. Reuse adequate
  existing tests; remove redundant or implementation-mirroring assertions during review.
- Follow the workflow through reviews, full candidate verification, individual commits, main merge
  and shared-app verification. Then take the next independent unit from V44.

The old `characters` environment is stopped and contains abandoned candidate state. Leave it stopped.
All old Opus branches/worktrees, test fixtures, source ledgers, captures, diagnostics and helpers are
rejected inputs. Do not inspect them to speed up the rewrite. Historical cold archives are solely
for accountability; there is no salvage queue.

## Suggested fresh-session kickoff

> Continue character development from current main using docs/build/character-restart-handoff.md
> and docs/build/astra-character-workflow.md. The entire Opus pilot is abandoned and must not be
> reused. Use fresh Astra subagents for independent Devil and Polder level-one implementations.
> Keep full verification before each merge, but allow independent coding while runtime or review
> work is pending. Complete one ancestry/class/level per commit and update the shared app after
> verified merges. Start with the existing pre-pilot foundation; do not build a new orchestration
> system. Every test must justify its existence; reject redundant or implementation-mirroring
> assertions. Report concrete delivered behavior and blockers.
