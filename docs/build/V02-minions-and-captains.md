# V02: Minion squads and captains

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | A09 |
| Unblocks | V03; V06 saved squad/captain preparation consumes its model |
| Status | see `STATUS.md` |

## Goal

Add minion squads as a subgroup inside an initiative group: one squad entry per addition with a shared
turn, up to eight members plus an optional captain, member-level participation and targeting, a shared
Stamina pool with sourced casualty rules, and captain attachment with its printed benefits. The slice
implements the confirmed contract in the table spec and stops at the bounded arithmetic cases the spec
leaves open; it does not touch ordinary-monster behavior delivered in v0.01.

## Spec references

- `docs/table-spec.md#minion-squads-and-captain-state` — subgroup model, add flow (default four, 1–8), captain, pool and casualty rules.
- `docs/table-spec.md#initiative-groups-confirmed-app-model` — squad entry inside a group; entries per creature.
- `docs/table-spec.md#mid-combat-additions-and-regrouping` — squad turns retain member participation and captain allowance under regrouping.
- `docs/table-spec.md#game-clock-and-scheduled-rules-work` — one global firing per shared squad/captain turn.
- `docs/table-command-spec.md#minion-squad-additions-and-state` — command surface for adding squads and squad state.
- `docs/v1-spec-checkpoint.md#sessions-roles-and-rosters` — EV proportional to printed EV/quantity; captain-bonus loss/gain rules.
- `docs/table-spec.md#follow-ups-when-their-scope-is-selected` — "Minions" bullet: bounded remaining arithmetic.

## In scope

- Add-squad operation: stat block, count 1–8 (default 4), optional captain, new independent entry per squad.
- Squad turn entry that fires shared-turn work once and lets each member participate or opt out.
- Individual member targeting; one roll for a coordinated attack with per-target allocation.
- Shared Stamina pool: non-area damage exhausting the pool defeats remaining ordinary members; area damage limited to affected members; casualty selection via the existing inline spatial-input card.
- Captain attachment: separate actions/Stamina, printed member bonuses applied while attached; bonus loss reduces pool without casualties, gain applies to survivors only.
- Proportional EV from printed EV/quantity, fractions preserved.
- Per-member conditions, saves and source-timed effects on shared timing.

## Out of scope

- Manual live squad splitting/merging and refill through the add count (excluded, not pending; `docs/table-spec.md#minion-squads-and-captain-state`).
- Captain personal extra turns and boss turn entries (V03).
- Saved-encounter persistence of squads (V06) and minion-related hero-token grants (V15).
- Troll and other source-specific pool healing/revival/transformation; record as manual (`docs/research/minion-lifecycle.md#10-troll-exceptions-to-ordinary-death-and-healing`).
- Mixed per-participant edges/banes inside one shared attack: use partial-automation policy, no invented normalization.

## Inputs and dependencies

- Hard: A09 (initiative groups, turn entries, targeting card, clock, casualty card, health display).
- Soft: minion stat blocks from the S01 content pipeline; if minion fields are missing, use `fixtures/minion-goblin-squad` derived from the pinned Compendium and delete it when S01 covers them.

## Deliverables

- Squad/member/captain data contract additions in `shared/contracts/` and Convex schema.
- Registered operations: add squad, set member participation, attach/detach captain, apply pool damage with casualty selection.
- Convex-test cases matching `docs/research/minion-spec-review.md#verification-examples-for-later-implementation`.
- Implementation notes in `docs/table-spec.md#minion-squads-and-captain-state`.

## Acceptance checks

1. Adding a squad of 3 persists one turn entry, three member identities and one pool equal to 3 × printed Stamina; read back through the roster query.
2. Eight attackers allocated 3/3/2 across three targets produce one power roll record and three per-target outcome records.
3. Non-area damage exhausting the pool marks all remaining ordinary members Slain in one logged event; area damage on two of four members never defeats the other two.
4. Detaching a captain reduces the pool by the printed bonus × surviving members with zero casualties, verified by before/after values in the log.
5. Starting the shared turn fires each registered global turn-start effect exactly once.
6. Proportional EV for a 3-minion squad from a printed "EV n for 4" block equals 3n/4 unrounded in the persisted encounter summary.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/organization/minion.md`
- `vendor/steel-compendium/en/unified/md/rule/monster/squad.md`, `rule/monster/captain.md`, `rule/monster/encounter-value.md`
- `vendor/steel-compendium/en/unified/md/chapter/monster-basics.md`
- `vendor/steel-compendium/en/unified/md/rule/combat/area-of-effect.md`, `rule/combat/strike.md`
- Research already done: `docs/research/minion-lifecycle.md`, `docs/research/minion-spec-review.md`.

Existing rulings that apply and must not be re-decided: one squad per entry with count 1–8; no manual split/merge; bonus loss without casualties; gain for survivors only; one global firing per shared turn.

## Open questions

Candidate `Q-V-n` entries from `docs/table-spec.md#follow-ups-when-their-scope-is-selected` and `docs/research/minion-spec-review.md#bounded-unresolved-cases`:

- Non-exhausting damage thresholds after a captain-bonus stat adjustment.
- Pool floor when bonus loss reaches or passes zero.
- Area damage exhausting the pool while unaffected members remain.
- Differing participant modifiers inside one shared attack.
- Shared-turn handoff when a member or captain is removed mid-turn.

## Work log

_Empty._
