# R04: Roll and damage resolution contract

| Field | Value |
| --- | --- |
| Family | R |
| Milestone | v0.01 |
| Owner type | Rules team |
| Rules review | required |
| Depends on | None |
| Unblocks | A05 |
| Status | see `STATUS.md` |

## Goal

Write the single sourced contract for the attack-to-damage step of the core loop, which no current
document specifies as arithmetic: power roll, characteristic selection, edges and banes, tier
boundaries, natural 19 and 20, damage application order, winded, Slain, Catch Breath bounds, direct
test rolls, and the affordability check. Every claim cites the Compendium. Every ambiguity becomes a
user question. This is the document A05 implements.

## Spec references

- `docs/table-spec.md#v001-edge-and-bane-inputs` — target-only counts, zero defaults, one-attack lifetime.
- `docs/table-spec.md#v001-roll-characteristic-default` — highest permitted characteristic, pre-fire override.
- `docs/table-spec.md#v001-critical-hits-and-additional-main-actions` — recognition, tier 3, extra main action.
- `docs/table-spec.md#director-edits-to-inline-results` — post-roll add/remove edge/bane, same dice.
- `docs/table-spec.md#ability-costs-and-optional-spending` — fixed costs, affordability block, negatives.
- `docs/table-spec.md#v001-temporary-stamina` — consumed first, not refilled by healing.
- `docs/table-spec.md#v001-catch-breath` — one Recovery, recovery value, bounds to verify.
- `docs/table-spec.md#v001-defend-and-aid-attack` — recorded use, manual benefits.
- `docs/table-spec.md#freeplay-baseline-and-combat-transition` — direct test rolls: dice, modifiers, total,
  outcome only when difficulty known.
- `docs/table-command-spec.md#direct-test-rolls`
- `docs/v001-basic-play-walkthrough.md#source-references-for-the-representative-common-action`
- `docs/pre-alpha-design-gaps.md#v001-combat-acceptance-checklist` — required/deferred boundary.

## In scope

- Power roll: 2d10 plus characteristic, edge and bane arithmetic including double edge and double bane
  and how they combine, exactly as the source states; tier thresholds; natural 19 and 20 handling and
  which of them is a critical hit for which action types.
- Characteristic selection: which characteristics an ability permits, how the default is chosen, and
  what is recorded.
- Tier outcome to damage: how the tier result of the representative common action (Melee Weapon Free
  Strike) and of a signature ability with tier text maps to a damage number, including kit damage
  bonuses, with the boundary where interpretation stops and manual resolution begins.
- Damage application: order across temporary Stamina and Stamina; damage immunity and weakness for
  ordinary creatures if the source states them; negative Stamina if the source allows; winded threshold
  (verify "half maximum" against the source); ordinary-foe Slain at zero; heroes at zero are not
  automated (dying deferred), only recorded.
- Catch Breath: cost, healing amount, eligibility limits, cap at maximum Stamina.
- Save roll for manually toggled conditions: 1d10, success threshold, per the source.
- Direct test rolls: dice, characteristic, edges/banes, total; outcome only when a difficulty or
  outcome table is supplied.
- Affordability: fixed cost known from source metadata, current pool check, legal negative ranges if
  the source permits any at level one.
- Worked examples with hand-computed outcomes for: single-target free strike at each tier; one
  multi-target attack with different per-target counts; a critical; damage that crosses winded; damage
  that consumes temporary Stamina then Stamina; Catch Breath at and near the cap; a post-roll bane
  addition that changes tier; a blocked unaffordable ability.

## Out of scope

- Any class-specific resource generation or unique ability clauses (deferred).
- Persistent areas, responses like Parry reconciliation, minions, bosses (V-slices).
- Implementation (A05).

## Inputs and dependencies

None. Pinned Compendium only.

## Deliverables

- `docs/roll-and-damage-resolution.md` — the contract and examples.
- `shared/contracts/rollResolution.ts` — input/output types for roll and damage operations, no logic.
- Implementation notes added to the table-spec sections above where they said "needs bounded
  verification", pointing to the contract.
- `rules` commit.

## Acceptance checks

1. Every arithmetic rule quotes its source sentence with path. Reviewer confirms each independently.
2. Every worked example's outcome is computed by hand in the document, not by code.
3. Each place the source is silent (for example a modifier interaction not stated) is a `Q-R-n` entry,
   and the contract says what the app records in the meantime: a manual result with the uncertainty
   labeled.
4. The types compile and match the examples.
5. The winded threshold statement matches the source text exactly.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/dice/*.md` (power-roll, ability-roll, edge, bane,
  bonuses-and-penalties, natural-19-20, natural-roll, tier-outcome)
- `vendor/steel-compendium/en/unified/md/rule/combat/critical-hit.md`, `strike.md`, `target.md`,
  `melee.md`, `ranged.md`
- `vendor/steel-compendium/en/unified/md/rule/damage/*.md`
- `vendor/steel-compendium/en/unified/md/rule/health/*.md`
- `vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md`, `always-round-down.md`
- `vendor/steel-compendium/en/unified/md/chapter/tests.md`
- `vendor/steel-compendium/en/unified/md/chapter/combat.md`
- `vendor/steel-compendium/en/unified/md/rule/monster/creature-free-strike.md`
- The Fury signature abilities in `class/fury.md` and the chosen kit for damage bonuses.

Existing rulings that apply and must not be re-decided: target-only edge/bane entry; auto-fire retained;
post-roll add/remove within the undo window; highest characteristic default; crit extra action is
offered, never executed automatically; unaffordable abilities are blocked; other warnings never block.

## Open questions

None known at slice creation.

## Work log

_Empty._
