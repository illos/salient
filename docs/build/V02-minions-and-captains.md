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

- Add-squad operation: any seeded Minion stat block, count 1–8 (default 4), optional captain, one
  independent squad entry per addition; members are individual creatures with their own reticles.
- Shared squad turn entry: one turn, one global clock firing, per-member participation (opt out),
  captain acting on the same turn with its separate actions.
- Coordinated signature attack: one roll, up to three participants per target, extra contributors add
  their free strike value; critical hit offers the extra main action to participants only.
- Squad maneuvers together: Grab, Knockback and Search for Hidden Creatures with one roll and one
  instance per target; Hide recorded together.
- Free Strike Together: simultaneous same-squad free strikes summed and applied as one strike.
- Shared Stamina pool on the cumulative ladder the user decided on 2026-09-20 (carried damage across
  captain changes; area damage in-area only, one step per affected member; zero kills the squad);
  casualty identities chosen through an inline card when the rules leave a choice.
- Captain attachment and loss: eligibility from the stat block (non-minion, non-Mount; language
  warned, not checked), printed With Captain Stamina, strike-damage and edge benefits applied, other
  benefits shown as text; loss reverts the pool and step without casualties, then zero kills.
- Proportional EV from printed EV and quantity, fractions preserved, stored on the squad.
- Per-member conditions; removal rules decided 2026-09-20 (squad removed as a unit; no single-minion
  administrative removal; captain finishes a shared turn alone when the last minion falls).
- Content: the goblin family (all goblin stat blocks and Malice) joins the seeded selection so squads
  are proven on real Spinecleaver and Sniper data; the table's add control lists every seeded stat block.

## Out of scope

- Manual live squad splitting/merging and refill through the add count (excluded, not pending; `docs/table-spec.md#minion-squads-and-captain-state`).
- Captain personal extra turns and boss turn entries (V03).
- Saved-encounter persistence of squads (V06) and minion-related hero-token grants (V15).
- Troll and other source-specific pool healing/revival/transformation; record as manual (`docs/research/minion-lifecycle.md#10-troll-exceptions-to-ordinary-death-and-healing`).
- Mixed per-participant edges/banes inside one shared attack: the coordinated roll takes one edge/bane
  count per target; participant-specific modifiers are recorded as a warning, no invented normalization.
- Library-wide seeding of every Monsters stat block (the follow-on foes slice; this slice widens the
  selection to the goblin family only).

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

All five candidate questions were answered by the user in the foes build thread on 2026-09-20 and are
recorded in `docs/table-spec.md#minion-squads-and-captain-state` ("User decisions, 2026-09-20") and the
decision record: cumulative ladder with carried damage after a captain change; zero from any cause kills
the squad (no separate pool floor); area damage on the same ladder with in-area casualties only; no
administrative single-minion removal and the captain finishing a shared turn alone; build the full
acting-together set. Mixed participant modifiers inside one shared attack remain out of scope.

## Work log

2026-09-20: claimed by the foes thread (Fable) after a gap review with the user; `slice/V02` in
`.worktrees/minions` from main `dbfb61d` (V72 included). Plan: (1) widen the S01 selection to
`monster/goblin` plus the squad/captain/minion rule pages, list every seeded stat block in the add
control, and route Minion definitions to the squad add; (2) `squads` table plus member foe rows, squad
actor kind for the shared turn entry, pure ladder arithmetic in `shared/resolve/squad.ts`, damage routing
from ability use and free strikes into the pool, casualty card on the interactions row, captain
attach/detach/loss, participation; (3) coordinated attack, squad maneuvers, Free Strike Together and the
participant-only critical; (4) Director pane squad card and shared-turn card; (5) convex-test coverage
of the acceptance checks and the 2026-09-20 rulings, then an authenticated headless proof. Verification
target: local convex-test plus a headless CLI run against an isolated backend; browser scenarios go to
the backlog under the moratorium.
