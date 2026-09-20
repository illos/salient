# V72 independent pinned-source rules review

Reviewer: `v72_rules_review`, 2026-09-20. Independent of implementation and the
[implementation reviewer](V72-implementation-review.md); performed after that review passed.

**Verdict: PASS for the bounded V72 rules scope. No blocking rules findings.**
This accepts the isolated candidate on `slice/V72-live-compiled-effects`, based on
`e5c1cd84bb5f08a2c1ee51279467ca4e692c6e0e` plus uncommitted changes. It does not assert
integration into main, full ability automation, or browser acceptance.

## Authority and method

Verified the local Compendium checkout is pinned at
`fb83a789da8f0327a389c277a0c790b1648d5810`. Read complete selected ability sources,
including costs, headers, all tiers and additional prose, directly from that checkout.
No online rules or abandoned Opus materials were used. Compared those sources with
[V26 designs](../V26-ability-designs.md), the [V72 boundary](../V72-live-compiled-effects.md),
[V26 acceptance](../V26-compiled-ability-effects.md#acceptance-checks), compiler/live adapters,
movement facts, use/correction paths, tests and retained evidence.

Inspected the actual [public readback](../evidence/V72/v72-headless-readback.json), not only
its derived summary: run `c89b4f0f-859c-46b4-b9ec-d2072e0e8816`, 46 records, completed and
passed, on CT114's isolated `engine-live` target. Cross-checked selected result rows, ordered
effects, movement requirements and blocked/recorded events against independently calculated
expectations. This review did not rerun gameplay, tests or deployments. The retained
[full check](../evidence/V72/checks/local-check-output.txt) passed 284 engine and 486 app/script
tests plus build; the later eight-case persisted suite and twice-generated report also passed.

## Source arithmetic and sequencing

| Cases | Independently checked expectation and evidence |
| --- | --- |
| BS1–BS3 | Brutal Slam prints 3/6/9 + Might. Might 2 and Mountain +0/+0/+4 give 5/8/15 damage, Goblin Stamina 10/7/0. Printed pushes 1/2/4 plus the qualifying size bonus give subtotals 2/3/5. Actual records agree, retaining movement work after lethal damage. |
| BS7–BS8 | Dice 7+7 plus Might 2 gives 16. One bane subtracts 2: tier 2, damage 8. Double bane shifts the original tier to 1: damage 5. Actual corrections retain original dice and reconcile Goblin Stamina 7→10 once; saved effects restore through undo/redo. Disposition records table completion without executing movement. |
| SC1–SC4 | Goblin Spear Charge uses fixed roll +2 and constant damage 3/4/5. Neither its Might -2 nor its roll bonus belongs in damage. Actual health 27/26/25 agrees. Four damage first consumes temporary Stamina 3, then leaves ordinary Stamina 29. |
| BP2/BP4/BP5 | Bury the Point costs 2 Malice and tier 2 deals constant 6 damage. Actual Malice 2→0 and hero 30→24 agree; Malice 1 blocks. The entire `M < 1` bleeding/save clause remains unevaluated and ordered after damage. Correction/disposition does not pay again, toggle bleeding or schedule a save. |
| MF3/RF3 | Melee free strike tier 3 is 7 + chosen characteristic 2 + Mountain 4 = 13. Ranged improvised free strike is 6 + 2 = 8 with no Mountain bonus. Explicit roll/damage choices are independent; actual results agree. |
| VF2 | Viscous Fire is 5 + Reason 2 + Enchantment of Destruction 1 + Acolyte of Fire 1 = 9 fire damage. Actual Goblin Stamina 6 and push subtotal 3 agree. Fire/Magic qualifies both damage modifiers; absence of Melee/Weapon means no size movement bonus. |
| PP3 | Mountain's printed signature already includes its kit bonus: 13 + 2 = 15, not 19. Actual result agrees under the recorded no-prior-target-damage assumption. The conditional additional-damage Effect stays manual; compatibility does not claim its predicate was evaluated. |
| OW2 | Out of the Way costs 3 Ferocity and tier 2 deals 5 + 2 = 7. Actual cost/damage agree. Slide 3 and the linked optional movement/opportunity-damage rider remain complete manual text; no ordinary-push instruction substitutes for them. |
| TR1 | Thunder Roar has constant 6/9/13 damage, not +Might damage. Natural 13 + Might 2 gives tier 2; one edge gives tier 3, double bane tier 1. Mountain produces 17/6/9 across the three targets, with one cost 5. Actual Stamina -2/9/6 agrees. Nearest-first movement remains manual and is not inferred from selected order. |
| LF1 | Lines of Force has no power roll. The actual `ability.recorded` event retains the explicit unsupported action-type warning. Optional Spend 1 is not a fixed debit. No new result row or executed redirection, replacement target, bonus or trigger is claimed. |

Primary source anchors are [Ability Roll](../../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md),
[Edge](../../../vendor/steel-compendium/en/unified/md/rule/dice/edge.md),
[Bane](../../../vendor/steel-compendium/en/unified/md/rule/dice/bane.md),
[Kits](../../../vendor/steel-compendium/en/unified/md/chapter/kits.md),
[Mountain](../../../vendor/steel-compendium/en/unified/md/kit/mountain.md),
[Goblin Warrior](../../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md)
and the complete per-ability source links in the design appendix. The two Fire fixture modifiers
were checked directly against their pinned feature prose, rather than inferred from the result.

## Movement and manual boundaries

[Forced Movement](../../../vendor/steel-compendium/en/unified/md/movement/forced-movement.md)
adds one when a larger creature uses a melee weapon ability against a smaller target.
[Size](../../../vendor/steel-compendium/en/unified/md/rule/character/size.md) distinguishes
1T, 1S, 1M and 1L: the prepared 1M hero is larger than the 1S Goblin despite occupying one
square. The pure evaluator preserves this ordering and refuses ambiguous bare `1`.
[Stability](../../../vendor/steel-compendium/en/unified/md/rule/character/stability.md)
permits voluntary reduction; it is not automatic subtraction. Same-size stability-2 fixtures
correctly retain allowance 2 and a separate optional reduction.

The dated V26 amendment is a product scope decision: live facts establish subtotals but do not
establish complete movement eligibility. Actual BS2/VF2 list missing condition, trait and modifier
coverage for actor and target and omit final allowance. BS6 additionally names restrained as
unevaluated. The pinned restrained rule prohibits forced movement and also grants an edge against
the target; BS6 proves conservative coverage handling with supplied roll modifiers, not automatic
condition mechanics or a fully adjudicated restrained attack. No application of those condition
consequences is claimed. Missing coverage remains visible after manual disposition.

Damage precedes tier effects under Ability Roll. Compiled effects preserve that dependency and
all damage is applied through the existing damage path. Ordinary push instructions retain optional
zero distance, straight-line/away meaning, route/flying/slope/terrain/collision scope and death-effect
ordering. No route, collision damage or death trigger is executed. Keeping a slain target's pending
movement is source-correct. Thunder Roar's explicit ordering exception stays outside this grammar.

## Generic grammar, source integrity and grant boundary

Runtime eligibility uses the compiler's checked envelope, with complete source/body/projection
comparison against bundled content. It does not dispatch by ability name. Renamed/numerically
changed consistent parser fixtures demonstrate generality; changed live source instead gets a
review diagnostic. Unknown extra mechanics, additional rolls, altered fixed costs and projection
contradictions cannot silently acquire automation or the unchanged-source compatibility exception.
The narrow potency remainder retains its complete condition and save text as one manual effect;
this is not general permission to detach arbitrary semicolon prose from damage.

Pure Meteoric Introduction tier 2 is 5 + Reason 2 + Magic 1 = 8, push 3 without a Weapon size
bonus. Ray tier 2 is 4 + Reason 2 + Magic 1 = 7 corruption damage, with its full Reason potency/
slowed/save remainder manual. Their missing current grants are explicit. Ghoul Razor Claws and
Worg Bite both use fixed +2 and constant 3/4/5; only Claws tier 3 has its additional `M < 2`
bleeding/save remainder. Pinned parent actions/traits are not executed by these compile-only
comparisons. Spinecleaver's recognized clauses retain an unsupported minion execution boundary.

The report's six reachable compiled abilities and four supported-but-unavailable comparisons
match current grant/loading scope. V72 adds no trait, grants, class choice or monster loading;
it does not claim trait-granted ability completion for unimplemented parent features. Existing
source-granted actions remain available through the shared UI/CLI path, including the explicitly
manual Lines of Force and kit-signature compatibility route. No character feature completion
claim is inferred from preserved trait text.

## Limits and acceptance

The accepted conservative movement boundary, fixed-cost refusal, compatibility preservation,
Director disposition permissions and sequential correction policy are specified product choices;
they are distinguished here from the underlying rules. V72 does not automate conditions,
potency, saves, triggers, spatial legality, resource triggers or all trait consequences.

The user browser moratorium replaces visual journeys with the documented headless gate for this
slice. The public proof, pure source fixtures and persisted tests cover the designed supported
behavior; lack of a browser run is not a rules blocker. Independent implementation acceptance
remains a separate verdict. Main integration and its runtime verification belong to the lead handoff.
