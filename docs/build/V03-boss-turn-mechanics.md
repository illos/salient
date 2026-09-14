# V03: Boss and villain turn mechanics

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | V02 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Support monsters that take more than one turn per round and the special-turn mechanics around them:
Solo nonconsecutive turns, acquired multi-turn capacity, immediate source-forced turns, captain-only
extra turns that do not refresh the squad, villain actions with their per-round and per-encounter
limits, and extra main actions that are not turns. The slice builds on the actor-linked turn-entry
model and the V02 squad entry; it does not program per-boss action cards.

## Spec references

- `docs/table-spec.md#initiative-groups-confirmed-app-model` — one creature may own several turn entries sharing live state.
- `docs/table-spec.md#mid-combat-additions-and-regrouping` — spent entries, own-group insertion for grants, interrupted-turn resumption.
- `docs/table-spec.md#next-baseline-contracts` — "Remaining group cases": single source-forced immediate turn, Wode Sickness handling.
- `docs/table-spec.md#smaller-opening-and-visibility-questions` — source-specific extra-turn mechanics still need treatment.
- `docs/research/boss-and-captain-turn-review.md#confirmed-captain-only-extra-turns` — user-confirmed interpretation.
- `docs/research/boss-and-captain-turn-review.md#review-checks-for-eventual-implementation` — suggested checks.
- `docs/table-command-spec.md#mid-combat-group-operations` — entry selection and group commands.

## In scope

- Additional turn entries for a creature with printed multi-turn capacity, placed per the confirmed group-placement rule, with the nonconsecutive constraint where the source states it.
- Effect-granted recurring capacity (for example a Malice feature granting two turns per round) as an entitlement bounded by source duration.
- Immediate personal turns that interrupt and then return to the interrupted group.
- Captain-only extra entries distinguishable from the shared squad entry; attachment persists.
- Villain action allowance: one shared use per round across villain-action creatures, individual once-per-encounter uses, not reset by a second turn.
- Extra main action grants recorded without creating a turn entry or new turn boundaries.

## Out of scope

- Effects that grant turns to several recipients at once (for example Do Not Hesitate in the Wode); keep visible as unsupported/decision-required (`docs/research/boss-and-captain-turn-review.md#confirmed-captain-only-extra-turns`).
- Parsing boss stat blocks for their unique abilities (V05); this slice schedules turns and allowances only.
- Retainers and friendly monsters (deferred beyond V1).

## Inputs and dependencies

- Hard: V02 committed (squad entry, captain attachment, once-per-turn global dispatch).
- Soft: Solo/Elite stat blocks from S01; otherwise `fixtures/boss-thorn-dragon` built from the pinned Compendium.

## Deliverables

- Turn-entitlement contract in `shared/contracts/` (entries, nonconsecutive rule, duration-bounded capacity, villain allowance).
- Registered operations to grant/consume an extra entry and to use a villain action.
- Convex-test cases for each check below; implementation notes in `docs/table-spec.md#mid-combat-additions-and-regrouping`.

## Acceptance checks

1. Finishing Solo Turn 1 leaves Turn 2 available in its own group with shared creature state; dragging Turn 2 never moves Turn 1 (persisted group order read back).
2. Granting an extra main action creates no new turn entry, no turn-start/end firings, and no villain-allowance refresh.
3. Buying two-turn capacity mid-turn yields exactly one additional current-round entitlement, removed when the effect's recorded duration ends.
4. A captain-only extra turn fires global turn-start work once and leaves squad member participation for the shared entry unchanged.
5. A second villain action in the same round by any villain-action creature is refused with a logged reason; the once-per-encounter use stays consumed after undo/redo of an unrelated action.
6. A source-forced immediate turn returns to the interrupted group and consumes the target's normal round turn where the source specifies.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/organization/solo.md`, `rule/organization/elite.md`, `rule/organization/leader.md`
- `vendor/steel-compendium/en/unified/md/rule/monster/villain-action.md`, `rule/monster/captain.md`, `rule/monster/malice.md`
- `vendor/steel-compendium/en/unified/md/rule/combat/turn.md`, `rule/combat/combat-round.md`
- `vendor/steel-compendium/en/unified/md/monster/ajax-the-invincible/` and the dragon and war-dog statblocks cited in `docs/research/boss-and-captain-turn-review.md`.
- Research already done: `docs/research/boss-turns-and-extra-actions.md`, `docs/research/boss-and-captain-turn-review.md`.

Ruling that applies: captain-only extra turns, confirmed 2026-09-13 (not precedent for multi-recipient grants).

## Open questions

Candidate `Q-V-n` entries:

- Multi-recipient turn grants such as Do Not Hesitate in the Wode (`docs/research/boss-and-captain-turn-review.md#confirmed-captain-only-extra-turns`).
- Which eligible captain turn is paired with the squad when preparation does not say (`docs/research/boss-and-captain-turn-review.md#confirmed-captain-only-extra-turns`).
- Source-specific extra-turn edit-window treatment (`docs/table-spec.md#smaller-opening-and-visibility-questions`).

## Work log

_Empty._
