# Fresh-session handoff: restart character development with Astra

Status: resumed at the user's request on 2026-09-20 in V69, with Hakaan (V70) and Orc (V71) as the next bounded pair. Character implementation
is preserved on `slice/V65` at `acc3df1` (pushed); application changes are not merged into main.
Both verification blockers are fixed. All 22 remote authenticated headless scenarios passed in
73.547 seconds, with zero failures/skips; the normal application build also passed.
See [V65 results and evidence](V65-character-headless.md#authorized-blocker-repair--2026-09-20).

The preserved checkpoint is `.worktrees/character-headless`; active integration is
`.worktrees/character-coverage` on `slice/V69`, based on current main with V65 carried forward. Backend `b1f50c8` is deployed to development
`different-bat-943`; the hosted frontend remains source `1e7896c`, Worker
`b9cc5ebb-54a1-4176-bc05-d99051b3cf1e`, at <https://salient-dev.rdxx.workers.dev>.
The backend fix exempts only public signing-key discovery from auth rate limiting; login/reset
limits remain intact. Temporary deployment credentials were removed and our runtime jobs ended.
The CT114 heavy window was released to the engine thread; coordinate before starting more work.

## Read first

1. `agent.MD` and [the dead-end decision](../decisions/2026-09-19-opus-pilot-dead-end.md).
2. [Astra workflow](astra-character-workflow.md) and [V44 scope](V44-character-option-delivery.md).
3. Relevant character specification sections, the existing reference procedure and remote runbook
   linked from those documents. Then read the actual current modules before assigning files.

The user's requirements remain: every ancestry and included class through level ten, each
ancestry/class/level as its own logical commit, same-build Forge verification, an initial combined
audit, and verified incremental merges. Complete level-one coverage before expanding the new queue
into later class levels. Existing Berserker level-two support must remain working.

## Verification order — current requirement

Apply the [app-wide headless completion gate](README.md#programmatic-headless-completion-gate).
V65 now proves the supported character routes through real authenticated public APIs, including
Devil/Polder/Dwarf/Human creation, choice changes, review/privacy, private inheritance, Fury 1→2,
history/restoration, stale review and combat locks. This is sampled workflow proof, not certification
of every rules option. The original 712 engine/app/script tests passed; the entire `pnpm check`
was not repeated after the two fixes. Targeted lint/types, the normal build and documentation links passed.

The [browser testing moratorium](README.md#browser-testing-moratorium--2026-09-20) is absolute:
no browser/Playwright/headless-Chromium testing until V66 repair is implemented. V66 is not started
and needs the user's go. Missing browser runs are not blockers; record future visual scenarios
in the [browser coverage backlog](browser-coverage-backlog.md). Do not restart browser debugging.

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

## Resume from this checkpoint

- Implementation has resumed under V69. Read main instructions, this handoff, V65 and
  `STATUS.md`; check Chords and checkout ownership before changing shared files.
- Preserve `slice/V65` and its evidence. Do not rebuild Devil/Polder/Dwarf/Human from scratch or
  repeat passing verification without a relevant change. Broader ancestry acceptance and main
  integration remain outstanding; inspect their recorded reviews before claiming completion.
- Prepare any integration candidate against current main, retaining peer engine/UI work. Follow
  the normal review/headless gates and shared-app update procedure when integration is authorized.
  The deployed backend and older frontend intentionally have different source revisions above.
- Use remote CT114 for workloads and the existing hosted development target for live verification.
  Keep verification bounded: diagnose concrete failures, report blockers, and pause rather than
  enter another prolonged test-repair loop. Every test needs a meaningful failure and added coverage.

The old `characters` environment is stopped and contains abandoned candidate state. Leave it stopped.
All old Opus branches/worktrees, test fixtures, source ledgers, captures, diagnostics and helpers are
rejected inputs. Do not inspect them to speed up the rewrite. Historical cold archives are solely
for accountability; there is no salvage queue.

## Suggested fresh-session kickoff

> Resume from the 2026-09-20 character checkpoint in this handoff. Candidate `slice/V65` at
> `acc3df1` has all 22 remote headless scenarios and the normal build passing. Preserve that work;
> inspect outstanding ancestry review/integration requirements before choosing the next bounded
> slice. Keep the browser moratorium and abandoned-Opus prohibition in force.
