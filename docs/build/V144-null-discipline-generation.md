# V144: Null discipline generation and the observed Malice trigger

Rules review: required. Depends on: V120, V142 (observed-trigger engine).
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/null.md`](evidence/V120/null.md).

## Goal

Enable automatic discipline generation for the Null, with its own implementation and an independent
rules review, including a trigger observed from a paid Malice cost.

## Scope

- **Engine.** `observeMaliceAbility` (`convex/lib/resourceTriggers.ts`) runs when `ability.use` debits
  a creature ability's own Malice cost (`debit` in `convex/lib/abilityOperations.ts`).
  - It applies every participating hero's `malice-ability` triggers within their limits.
  - Each gain is logged as a `resource.triggered` consequence of the use, and undone with it.
  - The per-trigger application is shared with V142's damage observer (`applyObserved`).
- **Null profile** (`feature/null/level-1/discipline.md`):
  - +Victories at combat start.
  - +2 at the start of each of the Null's turns.
  - Lose all remaining discipline at encounter end.
  - `null-field-main-action`: +1 "the first time each combat round that an enemy in the area of your
    Null Field ability (see below) uses a main action".
    - It is a table claim, because positions and the field's area are not tracked.
    - From level 4 it is +2 (`level-4/regenerative-field.md`, "2 discipline instead of 1").
  - `null-director-malice`: +1 "The first time each combat round that the Director uses an ability
    that costs Malice".
    - It is automatic for a creature ability's own Malice cost (reading A, Q-RES-5).
    - It is claimable for enhancement spends and Malice features (readings B and C).
  - Verified through level 6. `level-7/improved-body.md` changes the turn-start gain to 3.

## Out of scope

- Discipline Mastery thresholds and their surges.
- Squad abilities that cost Malice (not paid through `ability.use`); these are claimed.
- Non-combat stressful situations.

## Acceptance

- The pure profile test covers the Null's amounts and level 4.
- App test `tests/app/heroic-resource-null.test.ts`:
  - +2 at the turn start;
  - a goblin's Bury the Point (2 Malice) gives +1 automatically, linked to the use;
  - a second Malice use or a claim in the same round adds nothing;
  - the Null Field claim has its own limit;
  - undoing the Malice use removes its gain and claim;
  - 0 after finish.
- Headless: the Null's existing cohort, plus TESTER's gate.

## Work log

- 2026-09-24: implemented on top of V142. The focused files pass (1/1 and 6/6); `tsc` is clean.
- Independent review ([audit](audits/V144-rules-review.md)): changes required.
  - R1: correcting a Malice ability reversed the Null's gain, because correction reconciliation
    reconsidered every gain linked to the use. It is fixed in V142 (`e8666e48`): only damage
    triggers are reconciled. A regression test corrects Bury the Point and checks that the gain and
    its claim stand.
  - R2: Q-RES-5 now quotes `rule/monster/malice.md`.
- Closure round: R3, the regression corrected Thorn rather than the Null. The first Bury the Point
  now hits the Null and the correction targets the Null, asserting no `resource.reversed`. Checked
  by removing the V142 guard: the test fails without it and passes with it.
