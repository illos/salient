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

_Empty._
