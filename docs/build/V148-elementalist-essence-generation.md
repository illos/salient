# V148: Elementalist essence generation with Persistent Magic

Rules review: required. Depends on: V142 (the damage observer), V120.
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/elementalist.md`](evidence/V120/elementalist.md).

## Goal

Enable automatic essence generation for the Elementalist, with its own implementation and an
independent rules review. This includes the Persistent Magic upkeep that reduces the turn-start
gain.

## Scope

- **Engine.**
  - Profiles can carry a `persistent` table: ability name, persistent value and source.
  - `resource.maintain ability=… value=on|off` works in combat, for the hero's own persistent
    abilities.
    - Each maintained instance needs one unmaintained recorded use of the ability this encounter.
    - Instances on different targets can run together; `off` stops one.
    - It refuses maintenance that "would make you earn a negative amount" (total upkeep above the
      turn-start gain of 2).
    - Maintained entries are journaled on the hero with the encounter id.
  - The clock's fixed turn-start gain is reduced by the total upkeep, which is logged.
  - The damage observer totals the damage taken during the current turn. At 5 × Reason or more
    (Q-RES-10) it stops all maintenance and logs `resource.maintenance-ended`.
  - Encounter end clears maintenance and the turn tally.
  - `abilities:sheet` exposes `resourceMaintenance`, and the ability panel has Maintain and Stop
    toggles.
- **Elementalist profile** (`feature/elementalist/level-1/essence.md`, `persistent-magic.md`):
  - +Victories at combat start.
  - +2 at each turn start, less upkeep.
  - Lose all remaining essence at encounter end.
  - Claim `elementalist-typed-damage`: +1 the first time each round that you or a creature within
    10 squares takes damage that isn't untyped or holy. It is a table claim, because damage types
    and positions aren't carried to the damage write. From level 4 it is +2 (`font-of-essence.md`).
  - Persistent values come from each ability's pinned "Persistent N" entry, levels 1–6. The pure
    test checks them.
  - Verified through level 6. `level-7/surging-essence.md` changes the turn-start gain to 3.
- **Content.** The `Persistent Magic: Maintain` row points to the control.

## Out of scope

- The persistent effects themselves.
- Maintaining outside combat (for rounds equal to Victories), which stays manual.
- Automatic observation of the typed-damage trigger for the Elementalist's own damage, pending a
  damage type at the damage write.
- Mantle of Essence (level 4 aura).

## Acceptance

- The pure test covers the Elementalist profile, level 4, and every persistent value against its
  source.
- App test `tests/app/heroic-resource-elementalist.test.ts`:
  - maintaining is refused out of combat;
  - maintaining is refused when upkeep would exceed 2;
  - the turn-start gain is 1 with Flesh maintained;
  - two tier-3 Spear Charges (10 damage, Reason 2) in one turn end maintenance, logged;
  - Conflagration alone makes the next gain 0;
  - encounter end clears all.

## Work log

- 2026-09-24: implemented on V142. The focused files pass (7 tests); `tsc` is clean.
- Independent review ([audit](audits/V148-rules-review.md)): changes required.
  - R1: a correction doesn't restore maintenance after a break; labelled under Q-RES-10.
  - R2: instances are now supported.
  - R3: a use is required per instance, and maintaining a use later is labelled.
  - R4: the tally counts damage taken before maintenance began.
  - R5: the `Persistent Magic: End` row points to `value=off`.
  - The test now uses The Flesh, a Crucible. It checks the refusal without a use, two instances,
    the third refused as negative, the break, and a re-maintained instance giving the next gain of 1.
- Review round 2: R2–R5 closed. R1's recovery label was wrong: the use check refuses re-maintaining
  a broken instance. The label now names the working recovery: undo and re-record the damage, or
  adjust essence by hand.
- Review closure: PASS at `975856ef`.
- Rebased onto V142 `b639cf23` (with V150). The slice is squashed into one commit, because its
  per-commit history conflicted repeatedly with V150's forgo code.
  - Encounter end clears forgo and maintenance state together.
  - `resource.forgo` and `resource.maintain` are both registered.
  - `tsc` (root, convex, web) is clean. The Elementalist, forgo, Fury and pure tests pass (11/11).
