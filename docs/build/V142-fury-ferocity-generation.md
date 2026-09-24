# V142: Fury ferocity generation and observed damage triggers

Rules review: required. Depends on: V120 (shared heroic-resource engine).
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/fury.md`](evidence/V120/fury.md).

## Goal

Enable automatic ferocity generation for the Fury, with its own implementation and an independent
rules review. The engine gains its first triggers observed from recorded events, not only claimed by
the table.

## Scope

- **Engine** (`convex/lib/resourceTriggers.ts`):
  - Trigger limits, availability and gain writing are shared by `resource.claim` and a new damage
    observer.
  - `writeDamage` (`convex/lib/resolve.ts`) calls `observeHeroDamage` after every recorded hero
    damage write: ability uses, creature free strikes, squad actions and correction reconciliation.
  - A satisfied trigger is applied once within its limit, as a `resource.triggered` consequence
    linked to the causing event, with any dice on it. It is journaled in the causing operation's
    scope, so undo and redo restore it with the damage.
  - Profiles gain `observe` (`damage-taken`, `winded-or-dying`) and `dice` for gains like 1d3.
  - The sheet and UI show dice gains and mark automatic triggers.
  - `ability.correct` reconciles gains observed from the use it corrects. A gain the corrected damage
    no longer satisfies is reversed, down to no lower than the pool's floor, and its claim is
    released, logged as `resource.reversed`. Newly satisfied gains follow from the correction's
    damage write.
- **Fury profile** (`feature/fury/level-1/ferocity.md`):
  - +Victories at combat start.
  - 1d3 at the start of each of the Fury's turns.
  - Lose all remaining ferocity at encounter end.
  - `fury-first-damage`: +1 "the first time each combat round that you take damage".
    - It is automatic when a recorded damage write lowers Stamina or temporary Stamina.
    - From level 4 it is +2 (`level-4/damaging-ferocity.md`).
  - `fury-winded-or-dying`: +1d3 "The first time you become winded or are dying in an encounter".
    - It is automatic on the first recorded damage that takes Stamina from above the winded value
      to at or below it, or from above 0 to 0 or lower.
  - Both triggers stay claimable for damage or states the app did not record.
  - Verified through level 6. `level-7/greater-ferocity.md` changes the turn-start gain.
- **Labelled interpretations**, recorded in `docs/rules-questions-for-user.md`:
  - Q-RES-2: one winded-or-dying grant per encounter, and no grant for a Fury already winded when
    the encounter starts.
  - Q-RES-3: Stamina loss recorded by `/adjust stamina` is not damage.
  - Q-RES-4: damage reduced to 0 is not taken; damage absorbed only by temporary Stamina is taken.

## Out of scope

- Growing Ferocity thresholds and their surge triggers.
- Non-combat stressful situations.
- Damage from sources the app does not write (the table claims instead).

## Acceptance

- The pure profile test covers the Fury's amounts, dice, limits and level 4.
- App test `tests/app/heroic-resource-fury.test.ts`:
  - no gain from damage outside combat;
  - 1d3 at the turn start;
  - the first free strike in the round gives +1 automatically, linked to the strike, and a second
    strike or a claim adds nothing;
  - crossing the winded value gives +1d3 with its die;
  - undo and redo restore the gain and its claim;
  - a later hit below the winded value adds nothing;
  - 0 after finish.
- The TESTER gate and the Fury journeys. Thorn, the app fixture hero, is a Fury, so existing tests
  now see automatic ferocity: a d3 per turn and damage consequences.

## Work log

- 2026-09-24: implemented on top of V120 (`63b47d7`). The focused files pass (1/1 and 6/6); `tsc`
  and eslint are clean.
- TESTER gate probe at `9ea9c9e` (Test-support): 16 of 669 app tests failed, all stale Thorn-is-a-Fury
  expectations; 4 were host-load timeouts. Artifacts: `test-artifacts/V142-9ea9c9e/`.
- Independent review ([audit](audits/V142-rules-review.md)): changes required, R1–R4.
  - R1: an already-winded Fury hit to dying gained nothing. The winded-or-dying trigger now also
    fires on a drop from above 0 to 0 or lower, still once per encounter. Q-RES-2 is updated.
  - R2: a correction left a gain the corrected damage no longer earns. `reconcileObservedGains`
    reverses such gains (down to no lower than the floor), releases their claims and logs
    `resource.reversed`. Newly earned gains follow from the correction's damage write.
    - Since `e8666e48` only damage triggers are reconciled; the V144 review found that correcting
      a Malice ability wrongly reversed the Null's gain.
  - R3: stale expectations were updated in `abilities`, `combat`, `heroic-resource`, `history` and
    `v001-walkthrough`. The first four now read Thorn's rolled ferocity. `v001-walkthrough` now
    expects the logged turn-start d3 instead of "no invented Fury grants", and 0 after finish. A
    sweep of 31 further combat test files passed without edits.
  - R4: the claim texts and the Blood for Blood row name hand-entered self-damage.
  - New app test: winded then dying grants once, and a correction reverses a winded grant it no
    longer earns.
- Review closure: PASS at `111f9171`. The reviewer also noted the per-hero dice key that `b819e2e2`
  had already fixed.
- Rebased onto main `8c8aedf` (with V150). The Self-Taught forgo guard now sits in the shared
  `blocked()` in `convex/lib/resourceTriggers.ts`, so claims and observed triggers both honour it.
- QC1 (`../review-artifacts/2026-09-24-V142-QC1.md`) R1: observed triggers suppressed while forgoing
  were not recorded, so a later occurrence in the same window gained.
  - A forgone occurrence is now recorded with no gain: a `resource.forgone` event plus a journaled
    claim, reconciled on correction like a gain. Manual claims while forgoing are still refused.
  - A real Self-Taught Fury regression covers it: round-1 first damage and first winded forgone, a
    round-2 hit before its turn forgone, a later round-2 hit gains nothing, and a round-3 hit gains
    +1 while a second winded crossing gains nothing.
  - Without the fix the test fails.
- Rebuilt onto main `82f2bfd` (merge train 1: V135, V140, V145) as one commit. The gate passed at
  `b639cf23` on the old main; this rebuild needs a new gate.

## Publication: 2026-09-24

Merged in resource train 3 (V141, V143, V146, V142) as main `7e9f731`. The tip passed the full
gate (431 engine and 683 app tests) and the train's headless journeys. The backend and frontend were
published as Worker `35639817-fb01-4132-9428-728b6512c8ec`. Release logs: `/srv/presidium/projects/salient/test-artifacts/rtrain3-release-7e9f731`.
