# V165: Respite loop

Rules review: required. Depends on: V161, V163.

## Goal

The respite mode's core loop as the user settled it ([respite mode](../table-spec.md#respite-mode)):
start, and end by Cancel, Interrupt or Complete, with completion benefits and level-up grants.

## Scope

- Registered Director operations (palette, slash, headless `commands:invoke`), running session only:
  - `respite.start` (`/respite start`): chosen heroes, the attached party by default; refused during
    combat or while a respite is open. Stored on the session with each participant's live values.
  - `respite.cancel`: every participant's live values return to the start; Stamina and Recoveries return
    to the damage taken and Recoveries spent then, against the current maxima (Q-CHAR-2).
    **Implementation interpretation (Q-RESPITE-1), not a user ruling:** the ruling reverts "every change
    made during the respite … (activities, kit swaps and other respite choices)"; a level-up or an
    approved edit made meanwhile is a separate operation and is not reverted. Alternatives: revert those
    builds too, or block build changes for participants while a respite is open. V166's respite kit
    swaps are respite choices and will be reverted.
  - `respite.interrupt`: ends early; what happened stands; no benefits
    (`rule/resource/respite.md`: "the respite ends early and you don't gain the benefits").
  - Participants who left the campaign meanwhile are skipped and named in the event.
  - `respite.complete`: each participant regains all Stamina and Recoveries and converts Victories to
    XP, Victories reset to 0 (`rule/resource/respite.md`, `rule/resource/experience.md`); each 16-XP
    threshold crossed (Heroic Advancement table, `chapter/making-a-hero.md`) grants one pending level-up,
    counted from the admission offset and never past level 10. Final. A dead hero (Stamina at or below
    the negative of their winded value, `rule/health/dying.md`) is left unchanged for the table. Only
    this XP gain counts: XP adjusted by hand never grants, and a manual grant does not replace one.
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

- `sessions:get` returns the open respite (start time, participants).
- Built on `slice/V165`, `.worktrees/respite`, stacked on V163. Author checks: lint, TypeScript,
  respite app tests (4).
- Independent review of `9fc9d50`: CHANGES REQUIRED, three blocking findings, all fixed: Cancel now
  restores damage taken against the current maxima (a mid-respite level-up no longer leaves wrong
  Stamina); its scope is labelled an interpretation with Q-RESPITE-1; departed participants are
  skipped. Non-blocking, fixed: dead heroes are left unchanged; the open respite is readable through
  `sessions:get`; exact rewind assertion, a hero left out stays untouched, start refused in combat;
  the headless cleanup interrupts an open respite without masking failures.
