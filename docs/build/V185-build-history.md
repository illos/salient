# V185: Build History page — full recorded sheet preview and restore

Rules review: not required (history presentation over recorded builds; no rule added). Depends on:
V32 (history and restore operations), V164 (level-up screen).

## Goal

The user's design (2026-09-25): every character edit or level-up creates a complete character
sheet snapshot that can be previewed and restored. The revisions already exist (Q-CHAR-4); this
slice lets the owner and the Director see any recorded revision as the full character sheet, compare
it with the active build, and (owner only) restore it. A recorded build is always shown from its
recorded evaluation, never re-evaluated with today's rules. Snapshot scope stays the build only:
live state, inventory and authored text are current and not snapshotted (the spec's table in
section 5; the user's confirmation is pending and does not change this slice).

## Scope

- Server: `characters.historySheet` builds the same `HeroSheet` projection as `characters.sheet`
  (shared `heroSheet` builder) from a revision's recorded baseline, labelled `history`, with no
  table controls. Readers are exactly `characters.history`'s (`requireHistoryReader`); the Director
  never receives owner notes. A `BuildDifference` (shared/evaluate/buildDifference.ts) compares it
  with the effective build: level, Stamina and Recoveries maxima, features, abilities and perks by
  name. History entries now carry `restoredFromRevision` for the "restored from revision N" label.
- UI: `/characters/$characterId/history` (web/progression/index.tsx) — revisions newest first,
  paginated; selecting one shows the comparison, the owner's restore panel stating the outcome, and
  the full read-only sheet (`HeroSheetView`). The sheet header links "History"; `/progression`
  redirects to it; the pending level-up notice moved with it.
- CLI/API: `pnpm app history <characterId>`, `pnpm app history-sheet <characterId> <revisionId>
  [--full]`, `pnpm app restore <characterId> <revisionId>` (scripts/lib/build-history.ts), and the
  `history` headless cohort (scripts/headless/build-history.ts).
- Tests: tests/app/build-history.test.ts; tests/browser/v32-progression.spec.ts moved its preview
  and restore to the History page and fixed the builder rail selector (`/^Class/`).

Spec: docs/character-wizard-spec.md#5-progression-history

## Acceptance checks

1. `npx vitest run --project app tests/app/build-history.test.ts`: the recorded (marked) baseline is
   shown, not a re-evaluation; observer and outsider are refused; the Director's payload has no
   notes; the difference names Wrecking Ball and Danger Sense as only in the active build.
2. TESTER: `SALIENT_HEADLESS_COHORT=history pnpm test:headless:character` — create, edit, list,
   read the old revision's sheet (equals its recorded baseline, not the current one), restore
   through review, read back the new `restore` revision with `restoredFromRevisionId` and unchanged
   live state.
3. TESTER: `tests/browser/v32-progression.spec.ts` (authored here, not run by the implementer).
4. Gate.

## Work log

- 2026-09-25 WIZARD3: worktree `.worktrees/build-history`, branch `slice/V185` from main `f423f56`.
  Authoring checks only (typecheck, lint, focused vitest, Convex push check); browser and headless
  runs belong to TESTER.
- 2026-09-25 WIZARD3: committed `8c38b06` on `slice/V185`. Authoring checks: both `tsc --noEmit`
  runs clean; `pnpm -s lint` clean; `vitest --project app` on build-history and
  character-progression 16/16 pass; the Convex push check from `git archive HEAD` reported
  "Convex functions ready". Remaining: TESTER runs the `history` cohort, the v32 browser spec and
  the gate; review.
- 2026-09-25 WIZARD3, review fixes: the history sheet shows today's inventory read-only
  (`historySheet.inventory`, starting-rewards panel without its initialize action; app test asserts
  it equals the character's present rewards); read-only characteristics are plain boxes; the
  restore panel reads the outcome back from the character (active, submitted, or saved unsubmitted
  pending Director setup, or private draft) and no longer shows the "changed" notice after its own
  restore; the pre-restore text covers the owning-Director setup case; `pnpm app restore` accepts
  `--expected-revision` and `--expected-effective` and documents that omitting them skips the
  concurrency check; the v32 spec's level-up notice check now waits for the list and asserts the
  notice appears after the grant.
