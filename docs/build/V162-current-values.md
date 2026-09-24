# V162: Build changes keep damage taken

Rules review: required. Depends on: V161.

## Goal

Implement the revised Q-CHAR-2 ([current values](../character-wizard-spec.md#current-values-when-a-build-changes)):
activating an edited, advanced or restored build keeps the damage taken and Recoveries spent as maxima
rise or fall, and never drops a hero to 0 Stamina or below (or Recoveries below 0). Prerequisite for
generic level-up.

## Scope

- `shared/evaluate/liveReconciliation.ts`: `newCurrent = newMaximum − (oldMaximum − oldCurrent)`,
  floored at 1 Stamina and 0 Recoveries; a hero already at 0 Stamina or below is not pushed further
  down. The shared preview feeds every activation path (approval, level-up, history restore) and the
  sheet's activation preview.
- Tests that encoded the old keep-current rule now derive from the revised rule.

## Acceptance checks

1. `tests/app/admission.test.ts` Q-CHAR-2 table (Thorn Fury, Stamina 30 / Recoveries 10): 20/7 → 26/9
   (maxima 36/12); 20/7 → 8/3 (18/6); 5/1 → 1/0 (floor); −4/4 → −4/0; 30/10 → 36/12. Preview and
   persisted commit agree.
2. V32 Fury level-up and history restore: 21/30 → 30/39 → 21/30; 38/39 → 29/30 → 38/39.
3. Test-support gate; Test-Deploy runs `character-lifecycle` (20/30 → 29/39).

## Work log

- Started from main `c7aa637` on `slice/V162`, `.worktrees/current-values`.
- Author checks: TypeScript, focused admission, character-progression and history-audit (31) plus five
  other activation tests (38) pass.
- Independent review of `38d4508`: CHANGES REQUIRED, stale wording of the old rule in the restore screen,
  the approval event description, schema and contract comments and two docs; all updated. The
  above-the-old-maximum case (never carried above the new maximum) is now stated in the spec and, with
  the no-previous-maximum, zero and floor cases, covered by `tests/live-reconciliation.test.ts`.
