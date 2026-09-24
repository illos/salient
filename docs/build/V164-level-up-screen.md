# V164: Level-up screen, first design pass

Rules review: not required (presentation over V163's shared operations). Depends on: V163.
User review required before TESTER handoff (UI).

## Goal

The confirmed first pass for taking a level-up ([level-up policy](../character-wizard-spec.md#level-up),
"Level-up screen, first design pass"): the character builder's layout in a level-up mode.

## Scope

- Route `/characters/$characterId/level-up` (`web/progression/level-up.tsx`), in the builder's three-column
  layout and components: the step rail (one row per choice this level asks of this hero, then "Review and
  take"), the builder's decision editors in the middle with the same step footer, and "Hero so far" on the
  right showing the target-level build.
- Only the new level's choices are editable; the earlier build is fixed. Moving between steps saves the
  choices with `characters:saveAdvancement`; reload resumes them.
- Review: Stamina and Recoveries now → after (Q-CHAR-2 revised: damage taken and Recoveries spent stay),
  and everything new at the level. "Take level N" calls `characters:finalizeAdvancement`; afterwards
  "Take the next level-up" when more are pending, or back to the sheet.
- The character page shows "Level up to N" to the owner while a level-up is pending; the Progression page
  shows a short notice linking to the screen instead of V32's inline editor, which is removed.
- If review finds the builder mode poor, a dedicated level-up wizard is designed instead.

## Acceptance checks

1. User review of the captures from `tests/browser/v32-progression.spec.ts` (non-table): sheet button,
   perk step, ability step, review, taken.
2. The same spec asserts persisted readback: saved draft without the discarded Area of Expertise target,
   resume after reload, review values 20/30 → 29/39, level 2 after taking it.
3. After user approval: Test-support gate; Test-Deploy runs `level-up`, `lifecycle`, `all`.

## Work log

- Built on `slice/V164`, `.worktrees/level-up-ui`, stacked on V163. Author checks: TypeScript, ESLint.
