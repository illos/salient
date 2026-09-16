# V26 ability designs and playtest cases

This is the per-ability design appendix to [V26](V26-compiled-ability-effects.md).
Status: **V26 implementation and acceptance pending**. A [real-app baseline run](evidence/V26/baseline-2026-09-16/README.md)
now documents all ten currently available abilities, screenshots, saved state and known gaps; it does
not satisfy the complete designed cases below.
Expected values below are independently calculated from pinned source, never observed app results.
The owning slice inventory tracks designed, built and playtested separately.

## Shared source and fixture contract

All source links use local Steel Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. Read each full ability, not just the selected tier.
General rules used throughout:

- [Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md),
  Characteristics and Damage and Abilities With Damage and Effects: characteristic expressions,
  damage to all targets before tier effects, then printed effect order unless an exception applies.
- [Power Roll Outcomes](../../vendor/steel-compendium/en/unified/md/rule/dice/tier-outcome.md):
  totals at most 11, 12–16 and at least 17 give tiers 1, 2 and 3.
- [Kits](../../vendor/steel-compendium/en/unified/md/chapter/kits.md), Damage Bonuses,
  Kit Signature Ability and Improvised Weapons: qualifying keyword bonuses; signatures already
  include their kit bonus; improvised weapons receive no kit bonuses.
- [Forced Movement](../../vendor/steel-compendium/en/unified/md/movement/forced-movement.md),
  opening definitions, Big Versus Little, multitarget order and death/collision sections;
  [Size](../../vendor/steel-compendium/en/unified/md/rule/character/size.md) and
  [Stability](../../vendor/steel-compendium/en/unified/md/rule/character/stability.md).
- [Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md)
  and [Temporary Stamina](../../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md):
  retain the existing shared mitigation and temporary-Stamina arithmetic.

**H fixture:** an admitted level-one devil Berserker Fury with Mountain, Might 2, Agility 2,
size 1M, maximum/current Stamina 30, temporary Stamina 0, stability 2 and melee kit bonuses
+0/+0/+4. Use the choice set and source trail in [the prepared hero](../hero-fixture.md), but
obtain live facts from the integrated evaluated build, not the experimental engine's entity.
Ferocity is 0 unless a case explicitly sets it. Retained threshold benefits, extra damage modifiers,
conditions, surges and optional spending are absent unless explicitly stated. Other class/ancestry
traits and resource triggers remain manual; preserve their source rather than pretending all traits
are implemented. Do not change the integrated V25 modifier/immunity projection to simplify fixtures.

**G fixture:** a fresh ordinary [Goblin Warrior](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md):
Stamina 15, temporary Stamina 0, size 1S, stability 0, Might -2, printed immunity/weakness none.
G1/G2/G3 mean independent fresh copies. Crafty stays sourced; movement and opportunity attacks
are not executed by this slice. Live creature targets only; printed object targeting remains visible
but does not add an object runtime.

Each table row starts from fresh state unless it explicitly describes a continuation. Run paid
examples in an active combat with the correct actor's turn and listed resource balance, using existing
logged adjustments or a disclosed seed. Do not infer an automatic Ferocity or Malice grant from setup.
Use ordinary accepted dice through the shared operation. Deterministic seeding in an isolated test
runtime is allowed and must be disclosed; never inject fabricated result or journal rows.
Distances, area membership, line of effect and legal physical placement are supplied by the table.

The listed **live cases** require real rendered-app execution and readable game-log screenshots.
Other rows are shared/compiler or persisted-operation checks unless marked live. Shared tests can
cover common arithmetic once; each affected ability still needs its own live proof. Exact wording
and layout may vary, but the listed information and distinctions must be visible.

## Brutal Slam

Source: [Brutal Slam](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md),
header and all three power-roll tiers. Main action, Melee/Strike/Weapon, melee 1, one creature or
object, Might roll, no fixed cost. Compiler emits damage followed by an ordinary push instruction.
Damage uses the shared resolver including applicable kit/build bonuses, immunity and temporary
Stamina. Physical movement never writes a destination or collision damage.

| Case | Inputs | Expected calculation and saved state |
| --- | --- | --- |
| BS1 | H → G; dice 4+5 | Total 11, tier 1; damage 3+2+0=5; G 15→10; push 1+1=2. |
| BS2 **live** | H → G; dice 7+7 | Total 16, tier 2; damage 6+2+0=8; G 15→7; push 2+1=3. |
| BS3 **live** | H → G; dice 8+7 | Total 17, tier 3; damage 9+2+4=15; G 15→0, Slain; retain push 4+1=5 and manual death/collision scope. |
| BS4 | Same-size creature facts; tier 2; target stability 2 | Push allowance 2, optional stability reduction up to 2; do not automatically reduce allowance to 0. This is a resolver fixture, not altered Goblin source. |
| BS5 | Missing precise target size, or bare size `1` | Damage may resolve if its own inputs are known; size bonus/final push allowance are incomplete with the missing fact named. |
| BS6 | Active unhandled movement condition/modifier | Show only supported subtotal with eligibility/final allowance manual; do not claim the movement is legal or complete. |
| BS7 **live continuation of BS2** | Correct latest roll to one bane, then two banes | Same dice 7+7. One bane: total 14, tier 2, G remains 7, push 3. Two banes: original tier 2 shifts to 1, effective damage 5, G 10, push 2. Reconcile once. |
| BS8 **live** | Mark BS2's push Resolved at table | One disposition event; G remains 7; no movement/state inference. Originating-roll correction is refused until this later event is sequentially undone. Undo/redo restores the recorded effective damage/instruction/disposition without rolling or replaying movement. |

BS2's log must connect the exact tier clause and Big Versus Little rule to `8 damage`, `15→7`
and `push allowance 2+1=3 before optional stability reduction`. Show known target stability 0,
ordinary straight-line/away semantics and explicit table handling of route, actual distance,
terrain, flying/slope exceptions and collisions. A pending instruction does not require a completion
click before further actions. Screenshots cover BS2, BS3, BS7 and BS8, including source and restoration.

## Spear Charge

Source: [Goblin Warrior](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md),
Spear Charge block in full. Main action; Charge/Melee/Strike/Weapon; melee 1; one creature or object;
fixed roll bonus +2; printed damage 3/4/5, no damage characteristic and no cost. Extract only this
ability into the public source record. Keep the actor's full stat block Director-only.

| Case | Inputs | Expected calculation and saved state |
| --- | --- | --- |
| SC1 | G → H; dice 4+5 | Total 11, tier 1; damage 3, H 30→27. |
| SC2 **live** | G → H; dice 7+7 | Total 16, tier 2; damage 4, H 30→26. No automatic Ferocity gain. |
| SC3 | G → H; dice 8+7 | Total 17, tier 3; damage 5, H 30→25. |
| SC4 | H starts with temporary Stamina 3; otherwise SC2 | Damage 4 consumes temporary Stamina 3→0, then H Stamina 30→29. |

Log: printed `Power Roll +2`, accepted dice, selected tier, constant damage and saved health.
Never add Goblin Might -2 or its roll bonus +2 to damage. Charge keyword does not execute a move
or invent charge eligibility. SC2 screenshots/readback prove use from an actual ordinary foe and
the public source's exclusion of Bury the Point/Crafty/private stat-block fields.

## Bury the Point

Source: [Goblin Warrior](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md),
Bury the Point block, cost and all tiers. Main action; Melee/Strike/Weapon; melee 1; one creature;
fixed roll +2; fixed 2 Malice. Shared affordability runs before accepted dice/state writes.
Compile damage followed by a distinct unsupported potency/bleeding/save clause for the selected
tier. Ability Roll's damage-before-effects rule establishes this narrow remainder's ordering;
this is not permission to classify arbitrary semicolon prose as independent.

| Case | Inputs | Expected calculation and saved state |
| --- | --- | --- |
| BP1 | G → H; Malice 2; dice 4+5 | Total 11, tier 1; damage 5; H 30→25; Malice 2→0; retain `M < 0`, bleeding, save ends as manual. |
| BP2 **live** | G → H; Malice 2; dice 7+7 | Total 16, tier 2; damage 6; H 30→24; Malice 2→0; retain `M < 1`, bleeding, save ends as manual. |
| BP3 | G → H; Malice 2; dice 8+7 | Total 17, tier 3; damage 7; H 30→23; Malice 2→0; retain `M < 2`, bleeding, save ends as manual. |
| BP4 **live** | Same selection, Malice 1 | Blocked before roll/payment/action use; H remains 30, Malice remains 1; explain required 2 Malice. |
| BP5 **live continuation of BP2** | Director marks the remainder Resolved at table | Disposition only; H remains 24, Malice remains 0, condition toggles unchanged; no save scheduled or rolled. Retry does not duplicate any write. |

H has Might 2, so the printed unmodified inequalities are false. This is a human source check;
the app still labels potency unevaluated rather than claiming that it executed a failed potency
test. Also use a lower-level target with Might -2 to confirm the app does not silently apply
bleeding when an inequality would be true. Original thresholds must survive corrections between
tiers. Do not split one potency-conditioned bleeding/save clause into separately applicable effects.
BP2/BP4/BP5 screenshots include the source, damage, cost in the Director audience, manual remainder
and disposition. Player-visible output must not disclose a hidden Malice pool.

## Melee Free Strike

Source: [Melee Weapon Free Strike](../../vendor/steel-compendium/en/unified/md/feature/ability/common/melee-weapon-free-strike.md),
header and three tiers; [Free Strike](../../vendor/steel-compendium/en/unified/md/feature/common/main-actions/free-strike.md).
Main action; Charge/Melee/Strike/Weapon; melee 1; one creature or object. The app's shortened label
does not replace the source identity. Preserve independent permitted roll and damage choices of
Might or Agility; no name-specific compiler handler.

With H's actual kit weapon and G: dice 4+5 / 7+7 / 8+7 select tiers 1/2/3 and damage
`2+2+0=4` / `5+2+0=7` / `7+2+4=13`, leaving G at 11/8/2 respectively.
**Live MF3:** use 8+7, explicitly select Agility for the roll and Might for damage; log choices,
total 17, damage 13 and G 15→2 with source and kit-bonus evidence. No push/manual movement node.
A pure asymmetric fact fixture (Might 2, Agility 1) with chosen Agility roll/Might damage and
dice 8+7 must give total 16 and tier-2 damage 7, proving the choices are independent; this is
not a claim that H has Agility 1. Preserve default highest-permitted selection and reject an
unpermitted characteristic before execution.

## Ranged Free Strike

Source: [Ranged Weapon Free Strike](../../vendor/steel-compendium/en/unified/md/feature/ability/common/ranged-weapon-free-strike.md),
header and three tiers; Free Strike and Kits' Improvised Weapons section above. Main action;
Ranged/Strike/Weapon; ranged 5; one creature or object; Might or Agility roll/damage choices.
H uses a disclosed improvised thrown weapon; no Mountain bonus applies.

Against G, dice 4+5 / 7+7 / 8+7 give damage `2+2=4` / `4+2=6` / `6+2=8`, leaving G at
11/9/7. **Live RF3:** 8+7, explicit Might roll and Agility damage, total 17, tier 3, damage 8,
G 15→7; source, choices and absence of an applicable kit bonus visible. Preserve range text and
table-supplied legality; do not add ranged weapon inventory or trajectory simulation. Repeat the
asymmetric choice test at the shared resolver, with source constants adjusted to this ability.

## Pain for Pain

Source: [Mountain](../../vendor/steel-compendium/en/unified/md/kit/mountain.md), Signature Ability →
Pain for Pain, all tiers and Effect; Kits' Kit Signature Ability section above. Main action;
Melee/Strike/Weapon; melee 1; one creature; Might or Agility roll/damage. Printed tier damage
3/5/13 plus the chosen characteristic **already includes** Mountain's kit bonuses.
The conditional Effect can change this strike's damage. Keep it outside the compiler's safe
automatic subset and preserve the explicitly labeled existing compatibility damage path with
manual conditional additional damage. Do not misclassify this rider as independent post-damage work.

In a fresh encounter where the target has not damaged H since the end of H's last turn, dice
4+5 / 7+7 / 8+7 give base damage 5/7/15 and G 15→10/8/0. **Live PP3:** 8+7; explicitly
record this history assumption; log printed 13+2=15, kit addition 0, G Slain at 0, and complete
manual Effect. A second lower-level/persisted compatibility case with the history predicate true
still records base damage only and an outstanding rider; it must not label 15 the fully resolved
damage or automatically infer/add 2. Existing manual adjustments can record additional damage
separately; a disposition itself never applies it. Source revision/body changes cannot silently
reuse the unchanged-source compatibility exception.

## Out of the Way!

Source: [Out of the Way!](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/out-of-the-way.md),
cost, all tiers and complete Effect. Main action; Melee/Strike/Weapon; melee 1; one creature;
Might roll; 3 Ferocity. Preserve existing compatibility damage, manual slide and linked movement/
opportunity-attack damage rider. Do not compile slide as push or execute the later damage rider.

With H at Ferocity 3 and G, dice 4+5 / 7+7 / 8+7 give damage `3+2=5` / `5+2=7` /
`8+2+4=14`, G 10/8/1, and Ferocity 0. Retain printed slides 2/3/5 as manual source clauses,
not calculated or completed movement. **Live OW2:** 7+7; log damage 7, G 15→8, Ferocity 3→0,
slide 3 and the full Effect. Explicitly retain the optional move into vacated squares and conditional
damage sharing; no movement, opportunity attack or extra damage is synthesized. With Ferocity 2,
the persisted blocked case changes no dice, action use, health or resource.

## Thunder Roar

Source: [Thunder Roar](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/thunder-roar.md),
cost, area/targets, all tiers and nearest-first Effect. Main action; Area/Melee/Weapon; 5×1 line
within 1; each enemy in the area; Might roll; 5 Ferocity. Existing compatibility damage uses
table-supplied target membership and per-target edge/bane counts. The new compiler does not
execute areas or independent push instructions for this ability.

**Live TR1:** H starts with Ferocity 6; table supplies G1/G2/G3 in the line. Accepted dice 7+6
give unmodified total 15. G1 has one edge: total 17, tier 3, damage 13+4=17, Stamina 15→-2,
Slain. G2 has two banes: tier 2 shifts to 1, damage 6, Stamina 15→9. G3 has no modifiers:
tier 2, damage 9, Stamina 15→6. Ferocity 6→1 once for the use. All damage precedes movement.
Do not add Might to these constant damage expressions. Mountain still applies because the
ability has Melee and Weapon even though it lacks Strike.

Screenshots must show each target's tier/damage/health, one payment, printed push distances
6/2/4 and the full nearest-target-first Effect as manual. Do not infer target order from selection
order, drop slain G1's movement clause, or execute collision damage. A persisted Ferocity-4 case
blocks before roll/payment. Threshold/resource consequences of H's prepared Ferocity remain manual.

## Lines of Force

Source: [Lines of Force](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/lines-of-force.md),
Trigger, complete Effect and Spend 1 Ferocity. Triggered action; Magic/Melee; melee 1; self or one
creature. No power roll or automatic damage. Keep the existing manual recorded-action path.

**Live LF1:** table establishes that H would be force moved; Director/player uses the actual ability
card or palette with H bound as actor and target, Ferocity 1. The log retains the trigger, eligible
replacement target constraint, changed movement source, optional push substitution, Might bonus
and optional doubled bonus for spending 1. Preserve the existing `ability.recorded` path: the
printed usage `Triggered` is not recognized by the current action-type adapter, so the log includes
its manual action-type warning and does not consume a tracked triggered-action allowance. This is
an existing compatibility limitation, not supported trigger execution. There is no ability-result
row or new occurrence/disposition control for LF1. No dice, Stamina change, retargeting, calculated
final movement or automatic Ferocity debit occurs; Ferocity remains 1. The spend is optional,
not a fixed cost. Any manual spend uses the existing
resource adjustment separately; this slice adds no automated application or replay of that spend.
No automatic trigger detection, offered response window, or reconstruction of the original
movement is implied. Screenshots/readback prove the complete source and unchanged mechanical state.

## Compile-only comparison: Meteoric Introduction

The content audit adds this comparison because its full source matches the same generic grammar
as Brutal Slam. Main `14b7536` does not offer it as a selectable Elementalist signature in
`shared/content/level-one-decisions.ts`. It is **compile-only** in V26; do not grant it to a live
character or expand the wizard to manufacture a playtest. Before a later slice exposes it live,
promote its inventory entry and provide the same in-app evidence required for any affected ability.
Source: [Meteoric Introduction](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/meteoric-introduction.md),
header/all tiers. Main action; Earth/Magic/Melee/Strike; melee 1; one creature or object; Reason
roll; no fixed cost; damage 3/5/8 + Reason then push 2/3/4.

**E facts:** integrated level-one Fire Elementalist damage facts, Reason 2, Essence 0, no optional
spend/conditions/extra movement modifiers, with
[Enchantment of Destruction](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment-of-destruction.md)
(+1 Magic rolled damage) and
[Fire: Acolyte of Fire](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/fire-acolyte-of-fire.md)
(+1 Fire and Magic rolled damage). For this compile-only comparison, supply these explicit facts
directly to the pure resolver; this does not construct an admitted character with that ability.
Preserve V25's evaluated modifiers and source labels. This Earth ability lacks Fire and Weapon,
so neither the Fire feature's damage bonus nor the melee-weapon size movement bonus applies.

Dice 4+5 / 7+7 / 8+7 against G give totals 11/16/17, damage `3+2+1=6` / `5+2+1=8` /
`8+2+1=11`, expected G health 9/7/4 and push allowances 2/3/4. **Pure MI2:** 7+7; source,
+1 feature contribution, damage 8 and push 3 before optional stability reduction are returned.
No persisted state, app log or live evidence is claimed. Physical movement and other Elementalist
features stay manual. A pure larger-actor/smaller-target case must still omit the size bonus
because Weapon is absent.

## Additional affected ability: Viscous Fire

Source: [Viscous Fire](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/viscous-fire.md),
header/all tiers. Main action; Fire/Magic/Ranged/Strike; ranged 10; one creature or object; Reason
roll; no fixed cost; fire damage 2/5/7 + Reason then push 2/3/4. Use the integrated V25 Fire
Elementalist build with Viscous Fire legally selected and E's sourced facts, including both +1
damage features above. This ability is offered by the current wizard and requires real live proof.

Dice 4+5 / 7+7 / 8+7 against G give damage `2+2+1+1=6` / `5+2+1+1=9` /
`7+2+1+1=11`, G 9/6/4 and push allowances 2/3/4. **Live VF2:** 7+7; total 16, tier 2,
9 fire damage, G 15→6, push 3 and unchanged Essence 0. Show both named feature bonuses and the
damage type; no kit or melee-weapon size bonus. Movement remains a manual physical instruction.
Retain the integrated immunity calculation: a pure/persisted target-fact case with known fire
immunity 5 and Stamina 15 takes 9−5=4, leaving 11, while its push calculation is unaffected.
That numeric immunity case is a resolver fixture, not an invented Goblin trait; an unknown immunity
must remain explicit and must not be replaced by zero. Preserve immunity facts from evaluated heroes.

## Compile-only comparison: Ray of Agonizing Self-Reflection

Source: [Ray of Agonizing Self-Reflection](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md),
header/all tiers. Main action; Magic/Ranged/Strike/Void; ranged 10; one creature or object; Reason
roll; no fixed cost. Recognize damage 2/4/6 + Reason, corruption type, followed by an unsupported
Reason potency/slowed/save clause. Preserve the symbolic threshold WEAK/AVERAGE/STRONG verbatim;
V26 does not calculate potency or apply/remove conditions. Its syntactic post-damage position
supports the same bounded partial execution as Bury the Point, without assuming any threshold value.

Like Meteoric Introduction, Ray is present in content but cannot be selected by the current
integrated wizard. Keep it compile-only without editing character builds or granting an unselected
ability; live availability in a future slice requires its own in-app evidence. Use E's explicit facts
in the pure resolver. Only Enchantment of Destruction applies; no Fire bonus.
Dice 4+5 / 7+7 / 8+7 against G give damage `2+2+1=5` / `4+2+1=7` / `6+2+1=9`, G 10/8/6
and the corresponding manual threshold clause. **Pure RA2:** 7+7; total 16, tier 2, damage 7
corruption, expected G health 8; retain `R < AVERAGE, slowed (save ends)`. No automatic slowed
toggle, save or push. No persistence or screenshot proof is claimed. The compiler report must show
the missing live grant prerequisite separately from syntactic recognition and possible damage support.

## Compile-only comparison: Spinecleaver Axe

Source: [Goblin Spinecleaver](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-spinecleaver.md),
Axe and the containing stat block's Minion/With Captain context. Recognize fixed +2 roll;
damage 2/4/5 then push 1/3/4. Tier 2 has damage 4 and printed push 3. Retain one target per
minion, captain bonus and minion prerequisites; report execution unsupported for that envelope.
No live instance, single-creature substitute, screenshot pass or fully supported minion claim.

## Evidence record and completion

For every live case above, the future run record under `docs/build/evidence/V26/` contains:

1. Case ID, tested Git revision, source pin, runtime identity, seed/setup and actor/target facts.
2. Exact source section and expected values from this design, followed by observed values and pass/fail.
3. Screenshots of real use and the resulting game-log source/result, with source/log paired across
   images if needed for readability. The caption links both to the same event/use and effect IDs.
4. Saved-state readback from the same run: health/temporary health/resources/action tracking,
   effect records/dispositions and absence of unintended condition, save or movement writes.
5. For correction/history cases, the original/effective event relationship, restored state and
   unchanged accepted dice. Include any authority/privacy failures found and their resolution.

Browser automation counts as in-app proof when it drives the real rendered controls against the
isolated backend; disclose that method. Source screenshots alone, invented logs, mock UI and
`convex-test` output do not satisfy this gate. Failures or missing artifacts keep that ability pending.
Keep other gameplay unchanged and perform the final affected-ability audit before claiming completion.
