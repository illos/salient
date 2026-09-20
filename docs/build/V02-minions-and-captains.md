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

### 2026-09-20 — built on the branch

Commits on `slice/V02`: `1764813` (rulings and claim), `adbe679` (backend, content, tests),
`3027990` (Director pane, campaign page add control, headless proof script). Backend: `squads`
table plus member `foes` rows; pure ladder `shared/resolve/squad.ts`; operations `squad.add`,
`squad.remove`, `squad.captain`, `squad.participation`, `squad.casualties`, `squad.act`,
`squad.free-strike`; squad actor kind for the shared turn entry; damage routing from ability use
and free strikes into the pool with the `squad-casualties` card; captain loss as a linked
consequence; setup, snapshot, Void reset, cleanup and undo carry squads; `foe.add` loads any seeded
stat block; the S01 selection gains `monster/goblin`, `monster/dwarf` and the squad, captain and
minion rule pages (595 entries). Implementation notes and the two labeled interpretations are in
[the table spec](../table-spec.md#minion-squads-and-captain-state) and
[the command spec](../table-command-spec.md#minion-squad-additions-and-state).

Local verification (Presidium, permitted peer environment; runner in `code/.worktrees/minions`):
`pnpm exec tsc --noEmit`, `pnpm exec tsc -p tsconfig.web.json --noEmit`, `pnpm lint`,
`pnpm content:build` and `pnpm content:check` (595 entries), `pnpm exec vitest run --project
engine --project app --project scripts` (865 tests; the one failure was
`tests/scripts/build-content.test.ts`'s frontmatter sampler drawing the Goblin Malice feature block
after the manifest grew, a pre-existing matcher limit for nested YAML records, repaired to skip
nested `features` and rerun 22/22), `tests/squad.test.ts` 13/13 (ladder, captain change, area cap,
zero, EV, benefit text), `tests/app/squads.test.ts` 9/9 (acceptance 1–6 and the 2026-09-20
rulings through the registered operations with server dice and persisted readback).

| Capability / scenario | CLI/API entry point | Headless command, source, target and persisted evidence | Headless result | Browser result and additional gap |
| --- | --- | --- | --- | --- |
| Add a squad of N (1–8) with optional captain; one entry, N identities, pool N × Stamina, EV N × amount ÷ quantity; minions refuse `/foe add` | `squad.add`, `foe.definitions`, `table.roster` | `scripts/v02-headless.ts` step 2; `tests/app/squads.test.ts` acceptance 1 and 6 | pass | pending (moratorium; backlog rows logged) |
| Shared turn: one squad entry, one turn-start firing with every living member as participant | `turn.take`, `encounters.current`, `events.list` | proof step 3; `tests/app/squads.test.ts` acceptance 5 | pass | pending |
| Coordinated attack: one roll, up to three per target, extra minions add free strike damage, participant-only critical, captain strike bonus | `squad.act`, `abilities.results` | proof step 4; `tests/app/squads.test.ts` acceptance 2 | pass | pending |
| Pool ladder: casualties from printed steps, nearest/directly-damaged choice through the card, survivors below the step, zero kills the squad | `ability.use`, `card.respond` / `squad.casualties` | proof step 5; `tests/app/squads.test.ts` acceptance 3 and ladder tests | pass | pending |
| Undo restores the pool and dropped minions exactly | `history.rewind` | proof step 6; `tests/app/squads.test.ts` adjust/undo test | pass | pending |
| Free Strike Together applies one summed strike | `squad.free-strike` | proof step 7; `tests/app/squads.test.ts` | pass | pending |
| Captain Stamina benefit, loss without casualties, carried damage across the change, zero from a loss, replacement for survivors only | `squad.captain`, `foe.remove`, damage on the captain | proof step 8; `tests/app/squads.test.ts` acceptance 4 | pass | pending |
| Area damage: per-member cap, in-area casualties only | `ability.use` (area) | `tests/app/squads.test.ts` area test | pass (convex-test) | pending |
| Removal: single minions refused, squad removed as a unit, captain keeps an entry | `foe.remove`, `squad.remove` | proof step 9; `tests/app/squads.test.ts` | pass | pending |
| Player projection: pool through the health display, no Director facts, casualty answers limited to the attacker | `table.roster`, `squad.casualties` | proof steps 2 and 5 | pass | pending |

Headless proof (`scripts/v02-headless.ts`, [evidence](evidence/V02/README.md)): 9/9 steps pass in
10168 ms (run `v02-mu9n5vkg`) on an isolated local anonymous backend at `http://127.0.0.1:3250`
(CT114 unreachable at the time; local is a permitted peer environment). Real dice; the recorded
tiers drive the expectations from the printed tables. The first two runs failed on script
sequencing only (casualty answer rewound before the attack; living minions for the free strike), not
on product behavior; the fix also removed a spurious "winded" label from minion damage text, since
minions cannot be winded. Elapsed wall time for the whole build on 2026-09-20: about three hours.
No browser run (moratorium); the visual scenarios are in
[the backlog](browser-coverage-backlog.md).

Acceptance check 6 deviation: no persisted encounter summary exists yet (EV belongs to V06), so the
proportional EV is stored on the squad row and read back through `table.roster`; the 2.25 case is
proven there. Trait-granted ability gate: the seeded minion traits were checked against the pinned
stat blocks; Crafty (Spinecleaver, Sniper, Runner) is passive, the Sniper signature's conditional
edge is a modifier, and the dwarf minion Effect clauses grant no separate action, so no
trait-granted action is missing; the traits remain readable in the sheet.

### 2026-09-20 — independent review round 1: changes required, addressed

Reviewer (fresh read-only Fable subagent, static review of `main..9e4a54d` plus the two test files
rerun): implementation **changes required**, rules **pass**. Repairs: new damage, captain changes,
participation, squad actions and pool edits are refused while a squad owes a casualty choice (the
pool and living count could otherwise diverge); a lone minion's free strike carries the captain's
strike damage bonus and its individual Strike ability use is pointed to `/squad act` with one
participant while a strike benefit is attached; a squad maneuver taken together no longer marks its
participants as having acted alone; a captain attached while taking its own turn finishes that turn
first; the headless captain step fails rather than skips when the warrior is dead; the add controls
no longer preview pool arithmetic; the two interpretations carry their alternatives and citations;
the trait gate and the acceptance-6 deviation are recorded above.
Rerun after the repairs: `tests/squad.test.ts` 13/13, `tests/app/squads.test.ts` 10/10 (new: owed
casualties refused until named; lone free strike 2 + 1 with a captain; individual Axe pointed to the
squad action; Grab together leaves the individual record), `abilities`, `closeout-session` and
`history` suites pass (49 tests together); headless proof 9/9 again (run `v02-mu9nsur3`,
9839 ms). Review round 2 requested.

