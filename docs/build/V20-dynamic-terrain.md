# V20: Dynamic terrain objects

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | V04 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Add dynamic terrain objects as targetable live entities with their own identity, Stamina and state
but no turn entry: creature-paid operations, triggers and clock-scheduled effects, object load/reset
state, capture/operation by any eligible creature, and inclusion in undo/redo chains. The slice follows
the 35-entry research and the confirmed clock-ownership decision; it does not add terrain to
saved-encounter preparation or invent object save timing.

## Spec references

- `docs/table-spec.md#follow-ups-when-their-scope-is-selected` — "Dynamic terrain" bullet.
- `docs/research/dynamic-terrain-action-economy.md#subsequent-clock-ownership-decision-2026-09-13` — clock owns scheduling; once-per-turn dispatch.
- `docs/research/dynamic-terrain-action-economy.md#compatibility-and-decisions-genuinely-left-open` — what is compatible and what is open.
- `docs/research/dynamic-terrain-action-economy.md#objects-as-targets-and-effect-recipients` — targeting objects.
- `docs/table-spec.md#game-clock-and-scheduled-rules-work` — scheduled work registration.
- `docs/table-spec.md#persistent-area-effect-cards` — cards for ongoing object effects (V04).
- `docs/table-spec.md#roster-targeting-controls` — object targeting in the roster.
- `docs/table-command-spec.md#target-and-fact-model` — object as a target kind.

## In scope

- Object record: source entry, size, Stamina/immunities as printed, load/charge state, operator slot, visibility distinct from foe hiding.
- Add/remove object operations for the Director; object-targeting in the existing targeting card.
- Operate/capture operations paid from the operating creature's action economy, with effects resolved via V04/V05 paths or recorded manual resolution.
- Clock-registered object effects firing once per actual turn; End combat never synthesizes an extra terrain tick.
- Undo restores full object state including removed terrain; redo restores dice without rerolling.

## Out of scope

- Terrain in saved encounters (`docs/table-spec.md#follow-ups-when-their-scope-is-selected`: research does not add it).
- Object save timing and simultaneous protective-object destruction (open; no default).
- A recurring terrain turn or acted flag (contradicts the sources per the research).
- Parsing every terrain entry; coverage is the sampled entries the research names plus a stated subset.

## Inputs and dependencies

- Hard: V04 (area cards, clock work, linked responses); A09 targeting and undo.
- Soft: V05 for parsed object abilities; otherwise `fixtures/terrain-manual-effects` records effects as manual.

## Deliverables

- Object contract in `shared/contracts/`; Convex table; registered operations add/remove/operate/capture/target.
- Convex-test cases for the checks; implementation notes in `docs/table-spec.md` under the dynamic-terrain follow-up.

## Acceptance checks

1. Adding a catapult creates an object with printed Stamina and no turn entry; the initiative query is unchanged.
2. A hero operating it spends the printed action and the log records issuer, operator, object and effect; the object's load state reads back as spent.
3. A clock-registered object effect fires once at a shared squad/captain turn start and once at a captain-only turn, never per participant.
4. End combat with a pending object effect neither fires it nor advances a round.
5. Undoing the operate action restores load state; redo replays the recorded dice values.
6. Objects are absent from foe-hiding projections' hostile roster but present as targets where the spec allows.

## Rules research

- `vendor/steel-compendium/en/unified/md/chapter/dynamic-terrain.md`
- `vendor/steel-compendium/en/unified/md/dynamic-terrain/siege-engines/catapult.md`, `dynamic-terrain/mechanisms/pressure-plate.md`, `dynamic-terrain/power-fixtures/tree-of-might.md`, `dynamic-terrain/environmental-hazards/lava.md`, `dynamic-terrain/fieldworks/bear-trap.md` and the other entries the research inventories.
- `vendor/steel-compendium/en/unified/md/rule/general/unattended-object.md`, `rule/combat/objective.md`
- Research already done: `docs/research/dynamic-terrain-action-economy.md`.

Ruling that applies: clock owns scheduling, one global firing per actual turn (2026-09-13).

## Open questions

Candidate `Q-V-n` entries from `docs/research/dynamic-terrain-action-economy.md#compatibility-and-decisions-genuinely-left-open` and `docs/table-spec.md#follow-ups-when-their-scope-is-selected`:

- Object save timing.
- Simultaneous protective-object destruction.
- Which object interactions are exposed directly to players versus Director-mediated.

## Work log

_Empty._
