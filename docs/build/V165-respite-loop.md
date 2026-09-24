# V165: Respite loop

Rules review: required. Depends on: V161, V163.

## Goal

The respite mode's core loop as the user settled it ([respite mode](../table-spec.md#respite-mode)):
start, and end by Cancel, Interrupt or Complete, with completion benefits and level-up grants.

## Scope

- Registered Director operations (palette, slash, headless `commands:invoke`), running session only:
  - `respite.start` (`/respite start`): chosen heroes, the attached party by default; refused during
    combat or while a respite is open. Stored on the session with each participant's live values.
  - `respite.cancel`: every participant's live values return to the start. Build changes (a level-up,
    an approved edit) are separate operations and are not reverted.
  - `respite.interrupt`: ends early; what happened stands; no benefits
    (`rule/resource/respite.md`: "the respite ends early and you don't gain the benefits").
  - `respite.complete`: each participant regains all Stamina and Recoveries and converts Victories to
    XP, Victories reset to 0 (`rule/resource/respite.md`, `rule/resource/experience.md`); each 16-XP
    threshold crossed (Heroic Advancement table, `chapter/making-a-hero.md`) grants one pending level-up,
    counted from the admission offset and never past level 10. Final.
- The session cannot close, and combat cannot start, while a respite is open. Respite events are not
  undoable and are a floor for table undo and rewind.
- Later (V166, with user UI review): respite activities (kit swap), unused-option notices and the table's
  respite display. The campaign XP-per-level setting is later work (16 per level until then).
  Feature-specific respite effects stay manual.

## Acceptance checks

1. `tests/app/respite.test.ts`: complete (20/30, 4/10, 17 Victories → 30/30, 10/10, 17 XP, 0 Victories,
   1 pending level-up), player refused, session close and combat start refused while open, no rewind
   across it; interrupt keeps changes and grants nothing; cancel restores the start; threshold arithmetic.
2. Headless `respite`: cancel, interrupt and complete through the public API with persisted readback.
3. Test-support gate; Test-Deploy runs `respite`, `level-up`, `lifecycle`, `all`.

## Work log

- Built on `slice/V165`, `.worktrees/respite`, stacked on V163. Author checks: lint, TypeScript,
  respite app tests (4).
