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

### Plan, 2026-09-14 (rules researcher, worktree `slice/R04`)

- Sources: only the pinned Compendium at `vendor/steel-compendium` revision
  `fb83a789da8f0327a389c277a0c790b1648d5810`. Every path listed under *Rules research* exists at this
  pin; no path correction was needed. Additional files read because the listed ones reference them:
  `chapter/classes.md` (Roll Against Multiple Creatures), `chapter/kits.md` (Damage Bonuses, Kit
  Signature Ability), `kit/mountain.md`, `rule/test/test.md`, `rule/test/test-difficulty.md`,
  `rule/combat/turn.md`, `rule/combat/opportunity-attack.md`, `rule/combat/signature-ability.md`,
  `rule/general/heroic-ability.md`, `rule/general/ability.md`, `rule/resource/heroic-resource.md`,
  `rule/character/potency.md`, `rule/monster/malice.md`, `feature/common/main-actions/free-strike.md`,
  `feature/ability/common/melee-weapon-free-strike.md`, `feature/ability/common/ranged-weapon-free-strike.md`,
  `feature/common/maneuvers/catch-breath.md`, `feature/fury/level-1/{ferocity,fury-abilities,kit}.md`,
  `feature/ability/fury/level-1/{brutal-slam,hit-and-run,impaled,to-the-death,thunder-roar,blood-for-blood}.md`,
  `monster/goblin/statblock/goblin-warrior.md`, `chapter/the-basics.md` (Recoveries),
  `chapter/monster-basics.md` (shared-rules pointer).
- Files to touch: `docs/roll-and-damage-resolution.md` (new contract), `shared/contracts/rollResolution.ts`
  (new, types only), `tsconfig.json` (include the contract so `tsc --noEmit` covers it),
  `docs/rules-questions-for-user.md` (Q-R entries), dated implementation notes in the cited
  `docs/table-spec.md` sections plus `docs/table-command-spec.md#direct-test-rolls` and
  `docs/v001-basic-play-walkthrough.md#source-references-for-the-representative-common-action`, and
  this work log. No `STATUS.md` edit (lead owns it). No `vendor/` changes.
- Tests: none (R slice, no application code). Verification is `tsc --noEmit` for the types and hand
  arithmetic in the document.
- Dependencies: none real, none stubbed. The worked examples use the documented v0.01 hero fixture
  (`docs/hero-fixture.md`: Might 2, Agility 2, maximum Stamina 30, Mountain kit) and the Goblin
  Warrior stat block (Stamina 15) as concrete numbers; the contract itself is creature-generic.
- Existing rulings honored without re-deciding: target-only edge/bane counts, auto-fire retained,
  post-roll add/remove within the undo window with the same dice, highest permitted characteristic
  default, critical extra action offered never executed, affordability block, other warnings never block.


### Closing entry, 2026-09-14 (rules researcher)

Delivered: `docs/roll-and-damage-resolution.md` (contract, 12 sections, 14 worked-example groups),
`shared/contracts/rollResolution.ts` (types only), `tsconfig.json` include for the contract, Q-R-1 to
Q-R-3 in `docs/rules-questions-for-user.md`, dated implementation notes in the nine cited
`docs/table-spec.md` sections plus `docs/table-command-spec.md#direct-test-rolls` and
`docs/v001-basic-play-walkthrough.md#source-references-for-the-representative-common-action`.

Compendium files read (all at `fb83a789da8f0327a389c277a0c790b1648d5810`): listed in the contract's
section 12; every path in *Rules research* above exists, no correction needed.

Acceptance checks:

1. *Every arithmetic rule quotes its source sentence with path.* Verified by reading: sections 1.1
   to 1.10, 2, 4.1 to 4.5, 5, 6.1 to 6.4, 7, 8 and 9 each open with block quotes carrying
   `SC/...` paths; the reviewer can `grep -F` each quoted sentence in the named file (link markup
   removed).
2. *Every worked example computed by hand.* Section 10 shows the addition for every row (dice sum,
   characteristic, bonus, modifier, tier, damage, Stamina). No code produced them. A throwaway
   arithmetic cross-check script (not committed) reproduced all table values from the stated rules,
   catching no discrepancies; the document values remain the source of truth.
3. *Each silence is a `Q-R-n` with meanwhile behavior.* Q-R-1 (natural 19/20 under double bane,
   provisional tier 3), Q-R-2 ("M or A" damage characteristic, provisional roll characteristic),
   Q-R-3 (regain cap, provisional cap at maximum); section 11 tabulates each with its label and the
   two labeled interpretations (foe Stamina below 0; one crit per multi-target roll).
4. *Types compile and match the examples.* `npx tsc --noEmit` exit 0 with
   `shared/contracts/rollResolution.ts` in the file list (`--listFilesOnly | grep -c rollResolution`
   = 1); `npx tsc -p tsconfig.web.json` exit 0 (`shared` already included there). Every field named
   in the examples (`naturalRoll`, `edgeBane.net`, `tierShift`, `criticalHit`,
   `additionalMainActionOffered`, `absorbedByTemporaryStamina`, `staminaDelta`, `windedValue`,
   `slain`, `capApplied`, `staminaReconciliationDelta`, `outcome`, `blocked` response) exists in the
   types.
5. *Winded threshold matches the source exactly.* Section 6.3 quotes `SC/rule/health/winded.md`:
   "Your winded value equals half your Stamina maximum. When your Stamina is equal to or less than
   your winded value, you are winded." and applies `floor` from `always-round-down.md` for odd maxima.

Verification commands: `npx tsc --noEmit` (exit 0); `node --test tests/*.test.ts` (28 pass, 0 fail);
`npx tsc -p tsconfig.web.json` (exit 0). `pnpm check:engine` itself aborted before running anything
(`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`, pnpm wanting to purge the worktree's symlinked
`node_modules`); its two underlying commands were run directly as above.

What remains: rules review (required); user answers to Q-R-1..3 (nothing blocked; provisional
behavior labeled); A05 implements the contract. `STATUS.md` left for the lead.

*Review fixes, 2026-09-14:* independent and rules review passed (non-blocking findings). Applied:
Brutal Slam worked example 10.13 (5/8/15 with Might 2 and Mountain +0/+0/+4, hand computed,
matching `docs/hero-fixture.md`) and the section 2 cross-reference; Knocking Creatures Out note in
6.4 (manual result, Slain unchanged); blocked-response prose aligned to `AbilityRollBlocked`
(`kind: "blocked"`); `negative-rolled-damage` label added to section 11 and `UncertaintyId`
(unreachable with v0.01 content); Q-R links use full heading slugs in the contract, table-spec and
walkthrough notes (each verified to resolve); 10.9 Recovery wording. Re-verified: `npx tsc --noEmit`
exit 0, `node --test tests/*.test.ts` 28 pass, `npx tsc -p tsconfig.web.json` exit 0. Folded into
the original commit by amend.
