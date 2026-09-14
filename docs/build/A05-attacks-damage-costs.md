# A05: Attacks, damage, costs and common actions

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required |
| Depends on | A04, R04 |
| Unblocks | A06 (correction cards), A07, A09 |
| Status | see `STATUS.md` |

## Goal

Implement the attack-to-damage loop the walkthrough centers on: ability selection from the sheet with
known source metadata, roster targeting with auto-fire, per-target edge/bane inputs, characteristic
default, the server-side power roll per R04, tier outcome, supported damage application with temporary
Stamina, winded and Slain, critical recognition with the optional extra main action, fixed-cost payment
and the affordability block, Catch Breath in combat, Defend and Aid Attack with manual benefits, surge
and temporary Stamina counters, and honest recording of unsupported clauses as manual work.

## Spec references

- `docs/roll-and-damage-resolution.md` (R04 deliverable) — the arithmetic.
- `docs/table-spec.md#roster-targeting-controls`, `#v001-edge-and-bane-inputs`,
  `#v001-roll-characteristic-default`, `#v001-critical-hits-and-additional-main-actions`,
  `#ability-costs-and-optional-spending`, `#player-sheet-actions-and-explicit-end-turn`,
  `#v001-catch-breath`, `#v001-defend-and-aid-attack`, `#v001-surge-tracking`, `#v001-temporary-stamina`,
  `#inline-interaction-cards-in-the-game-log` (Resolved at table), `#director-fine-tuning-and-deliberate-damage-tool-omission`
- `docs/table-command-spec.md#roster-target-selection`, `#ability-costs-and-affordability`,
  `#results-and-pending-interactions`, `#target-and-fact-model`
- `docs/pre-alpha-design-gaps.md#targeting--confirmed-for-v001`, `#ability-costs--confirmed-for-v001`,
  `#damage-and-corrections--confirmed-for-v001`, `#game-basics-first--current-runtime-scope`
- `docs/rules-adaptation-principles.md` — warn without blocking except affordability; show full text.
- `docs/v001-basic-play-walkthrough.md#main-path-and-observable-results` steps 3 to 6

## In scope

- Ability list on the sheet from S01 metadata; select for use vs expand to read; common actions (free
  strikes, Catch Breath, Defend, Aid Attack) alongside granted abilities.
- Targeting: per-user visible draft; self/single auto-fires on completion; multi-select auto-fires at full
  count or on explicit fire; target-only edge/bane counters starting at zero, entered per target before
  firing; pre-fire characteristic override with highest permitted as default.
- Resolution: server roll through S02 dice; R04 arithmetic in the engine adapter; tier result; for
  supported tier text (flat damage plus known bonuses) apply damage; for unsupported clauses record the
  verbatim clause as unresolved and offer Director "Resolved at table" on the card; never invent effects.
- Damage application order per R04: temporary Stamina, then Stamina; winded flag; ordinary foe Slain at
  zero without ending combat; heroes at zero recorded, no dying automation.
- Critical: recognize per R04, apply tier 3, log it, expose an optional additional main action through
  the allowance tracker; never auto-execute.
- Costs: fixed applicable cost from metadata debited on execution; unaffordable blocks for every caller;
  legal negatives per R04; other rule conflicts warn only.
- Catch Breath in combat as a maneuver with action tracking; Defend and Aid Attack recorded with actor and
  target, full text logged, benefits manual through the existing edge/bane inputs.
- Post-roll per-target Add edge / Add bane / remove, same dice, recomputed outcome appended as a linked
  correction; authority: acting player within their undo window, Director always. A06 owns the window
  logic; A05 delivers the card and calls A06's seam check if merged, otherwise Director-only until A06.
- Surge counter and temporary Stamina Director-editable with Manual adjustment entries (A03 may have the
  generic edit; this slice ensures damage consumes temporary Stamina first).
- Every operation headless; every card answerable headlessly.

## Out of scope

- Class-specific resource generation, unique triggers, movement, area abilities, responses like Parry
  reconciliation (V04, V05).
- Direct damage editing (deferred). Optional enhancement cards (deferred). Main-action substitution
  (deferred).
- Undo/redo mechanics (A06).

## Inputs and dependencies

A04 combat; R04 contract and types. Rules reviewer must be booked before review starts.

## Deliverables

- `convex/lib/resolve.ts` (adapter to engine), `convex/abilities.ts`, `convex/targets.ts`
- Engine module implementing R04 as pure functions with tests whose expected values are the R04 worked
  examples verbatim
- `web/table/targeting.tsx`, ability cards in the log, correction card
- Tests: every R04 example; affordability block for player and Director; crit path; temp Stamina order;
  Slain at zero; unsupported clause recorded not applied; retry idempotency for an attack
- Browser test: hero free strike on the Goblin Warrior, damage visible to all three roles, Slain after
  enough hits

## Acceptance checks

1. Each R04 worked example reproduces exactly through the shared operation (not only the pure function),
   read back from foe or hero state and the event journal.
2. A single-target attack with one edge entered for the target records the edge, the dice, the tier and the
   damage; the Goblin Warrior's Stamina decreases by that amount.
3. A multi-target attack with different counts per target records and applies each separately.
4. An ability with a fixed cost the hero cannot pay is rejected with no roll, no event beyond the
   rejection, and no debit; with enough resource, the debit and the roll appear in one command unit.
5. A natural 20 logs a critical, applies tier 3, and the allowance tracker shows an extra main action
   available; taking a second main action succeeds; not taking it has no effect.
6. Damage of 5 against 3 temporary Stamina and 20 Stamina leaves 0 temporary and 18 Stamina, in one event.
7. Reducing the foe to 0 shows Slain and the encounter remains open.
8. A tier text with an unsupported clause appears verbatim on the card marked unresolved; Director
   Resolved at table records the disposition without changing state; the clause is never applied twice.
9. Post-roll Add bane changes the recorded tier and damage with the same dice, as a linked correction
   event; the original event is unchanged.
10. Rules reviewer verifies arithmetic and application order against R04 and the Compendium.

## Rules research

R04 owns it. Do not re-derive; raise `Q-A-n` if R04 cannot be implemented as written.

## Open questions

None known.

## Work log

### Plan (2026-09-14, implementer)

Files: `shared/resolve/index.ts` (pure R04 engine), `tests/resolve.test.ts` (section 10 verbatim),
`convex/abilityTables.ts` (targetingDrafts, heroRollFacts, actionUses, actionOpportunities,
abilityResults), `convex/lib/resolve.ts` (content metadata, facts, journaled damage writes),
`convex/lib/abilityOperations.ts` (registered operations), `convex/abilities.ts` and
`convex/targets.ts` (reads), `convex/lib/audience.ts` (foe Stamina projection for attack events),
`web/table/targeting.tsx` and `web/table/index.tsx`, `tests/app/abilities.test.ts`. Dependencies:
A04, R04, S01, S02 real; A06's `assertCorrectionAllowed` real after the rebase; A02 absent, so hero
roll facts come from a Director-supplied `/hero facts` record (the Q-A-200 route).

### Implementation notes (2026-09-14)

- **Engine.** `shared/resolve/index.ts` implements R04 sections 1 to 9 as pure functions;
  `convex/lib/tableOperations.ts` now imports its edge/bane, tier, test-outcome and recovery-value
  arithmetic from it. Every section 10 example is a test with the contract's numbers.
- **Operations.** `/ability select`, `/target toggle`, `/target modifier`, `/selection cancel`,
  `/ability fire` keep a per-user draft and fire `/ability use` under the same command id (single
  fires on its target, self on selection, multi at the full count or on Fire, area on Fire only).
  `/ability use` takes `targets=[...]` with `edges=`/`banes=` as one number per target (target-only
  counts), `characteristic=` as the pre-fire override. Affordability is decided before any dice; a
  blocked activation is recorded as an `ability.blocked` event (R04 10.11 says "Record") with no
  roll, no debit, no action use and the draft kept. Unknown cost text or action type records the
  ability as manual with no roll. Catch Breath, Defend, Aid Attack and the creature Free Strike are
  common actions of the same operation. Critical hits create an `actionOpportunities` row; the
  allowance tracker (advisory, warnings only) consumes it on the next main action.
- **Facts.** Heroes have no evaluated baseline (A02 pending): `/hero facts` records characteristics,
  kit bonuses, the kit signature name, granted ability ids and the heroic resource name as supplied
  facts; `/adjust` still sets the maxima and pools. Foe immunity/weakness cells other than `-` are
  not read: damage is then left unapplied with the reason recorded (none in v0.01 content).
- **Corrections.** `/ability correct` recomputes one target with the same dice through
  `correctTarget`, reconciles the applied pools, journals the effective record on `abilityResults`
  and appends `correction.ability` with the original as cause; authority is A06's
  `assertCorrectionAllowed`. `/ability resolved` records a Resolved at table disposition once.
- **Audience.** `projectEvent` and `abilities.results` remove a foe's resulting Stamina numbers for
  players and observers unless the numerical display is on; damage arithmetic stays public.

### Verification (2026-09-14)

- `pnpm check`: exit 0 after rebasing onto main (engine 67 tests incl. `tests/resolve.test.ts` 16;
  app and scripts 251 tests incl. `tests/app/abilities.test.ts` 12).
- Acceptance 1 to 9 exercised at the shared-operation level with the campaign's own dice stream
  positioned to the example faces (see the test header). Check 10 (rules reviewer): pending.
- Browser test: **not written, not run** (no local deployment in this worktree).

### Left undone / audit needed (2026-09-14)

- No browser spec; the UI in `web/table/targeting.tsx` compiles and lints but was never opened.
- `ability.blocked` is a recorded event, not a thrown error: confirm this matches the intended
  card behavior and A06's seam rules (it has no journal rows).
- Removal of a post-roll bane through the operation after a prior correction is refused by A06's
  rewind-first rule; only the pure engine covers the restore case (10.10 second half).
- Foe abilities with a printed cost the app cannot read, multi-target abilities with an unknown
  target text, and hero abilities outside the `/hero facts` list are not offered.
- Rules review of the arithmetic wiring in `convex/lib/abilityOperations.ts` (cost pool
  selection, waiver outside combat, allowance warnings) against R04 and the Compendium.


### User decision follow-up: Q-R-1 and Q-R-2

Q-R-1 is confirmed after dedicated source research: natural 19/20 stays tier 3 under ordinary edges
and banes, including double bane. Q-R-2 now defaults the damage characteristic to the highest current
value permitted by the damage expression, independently of the roll choice. Preserve source-authorized
alternatives. Apply these [R04 contracts](../roll-and-damage-resolution.md) and remove their obsolete
uncertainty labels. This handoff records decisions; implementation and verification remain build work.
