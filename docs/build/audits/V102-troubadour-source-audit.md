# V102 Troubadour level-one independent source audit

ENGINE, 2026-09-21. Source inventory audit for base `a03bfe755e8bdf0c3f6fd8b0a349b9b98dd45b71`; not an implementation approval. No tests run.

Authority: pinned `vendor/steel-compendium` revision `fb83a789da8f0327a389c277a0c790b1648d5810`. Paths below are relative to `vendor/steel-compendium/en/unified/md/` unless stated otherwise. Read all 24 `feature/ability/troubadour/level-1/*.md`, all 15 `feature/troubadour/level-1/*.md`, `class/troubadour.md`, and kit rules. Checked class grouping and costs against `vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md`, Troubadour / 1st-Level Features through immediately before 2nd-Level Features. No Forge or runtime output used for expectations.

## Creation and grants

`class/troubadour.md#Basics`: Agility 2, Presence 2; distribute one of (2,-1,-1), (1,1,-1), (1,0,0) over Might/Reason/Intuition. Starting Stamina 18; 8 Recoveries; subsequent levels +6 Stamina (not level-one addition). Potency uses Presence: weak P-2, average P-1, strong P. At P2 these are 0/1/2 regardless of roll characteristic. Printed inequalities are strict: equality resists.

Read Person fixed; choose two interpersonal skills plus one intrigue-or-lore skill. Add class-act skill separately. Do not count the fixed skill/subclass grant as spending a choice. Source quick build Brag/Flirt/Read Person/Rumors is an example, not a restriction.

One ordinary kit (`feature/troubadour/level-1/kit.md`); quick build Swashbuckler. No special Stormwight kit permission. Kit signature is additional to the selected class signature.

`feature/troubadour/level-1/troubadour-class-act.md`, `1st-level-class-act-features.md`, `class-act-triggered-action.md`, `routines.md`, `virtuoso-performances.md`:

| Class act | Skill | Additional performances | Other granted actions |
|---|---|---|---|
| Auteur | Brag | Blocking | Dramatic Monologue; Turnabout Is Fair Play |
| Duelist | Gymnastics | Acrobatics | Star Power; Riposte |
| Virtuoso | Music, ability to play an instrument | "Thunder Mother"; "Ballad of the Beast" | Power Chord; Harmonize |

All acts gain Choreography and Revitalizing Limerick from Routines and Scene Partner. Virtuoso has both performances, not a pick between them.

Select exactly one from each row (`signature-ability.md`; clean Heroes grouping):

| Pool | Options | Base Drama |
|---|---|---|
| Signature | Artful Flourish; Cutting Sarcasm; Instigator; Witty Banter | 0 |
| 3-Drama | Harsh Critic; Hypnotic Overtones; Quick Rewrite; Upstage | 3 |
| 5-Drama | Dramatic Reversal; Fake Your Death; Flip the Script; Method Acting | 5 |

Inventory is **24 source ability envelopes**: 12 choices, 2 universal performances, 10 act-specific grants (Auteur3/Duelist3/Virtuoso4). A completed Auteur/Duelist has 8 class envelopes; Virtuoso has 9, before kit signature, common actions and explicit embedded follow-ups. Optional-use representation adds actions, not new source envelopes. No level-two Invocation, Appeal to the Muses, or later performances at level one.

## Damage and cost oracle

Every named row cites its kebab-case filename under `feature/ability/troubadour/level-1/`. Quoted performance names omit quotation marks in filenames. Values are per target, tiers 1/2/3. A/P in damage expressions are printed additions, not inferred from the roll label.

| Ability | Base Drama; type | Roll | Printed damage | P=A2, Swashbuckler damage |
|---|---|---|---|---|
| Artful Flourish | 0; main | A | 2/5/7 | 4/7/9 |
| Cutting Sarcasm | 0; main | P | 2+P / 5+P / 7+P psychic | 4/7/9 psychic |
| Instigator | 0; main | P | 3+P / 6+P / 9+P | 7/10/13 |
| Witty Banter | 0; main | P | 4+P / 5+P / 7+P psychic | 6/7/9 psychic |
| Harsh Critic | 3; main | P | 7+P / 10+P / 13+P sonic | 9/12/15 sonic |
| Quick Rewrite | 3; main | P | 4/5/6 | 4/5/6 |
| Method Acting | 5; main | A | 6+A / 10+A / 14+A | 10/14/18 |
| Thunder Mother | 0; no action | P | level / 5+level / 10+level lightning | 1/6/11 lightning at level1 |

Kit rule `chapter/kits.md#Damage Bonuses`: only Melee+Weapon or Ranged+Weapon gets the corresponding kit damage bonus. Magic does not disqualify Weapon. Cutting Sarcasm is **Ranged+Weapon** and can receive a ranged kit bonus, but Swashbuckler has none. Witty Banter and Harsh Critic lack Weapon even when used in melee. Artful Flourish gets no A damage addition despite rolling A. Quick Rewrite gets no P damage addition. Thunder Mother gets no P damage addition and no kit bonus.

`kit/swashbuckler.md`: +3 Stamina at echelon1, +3 speed, +1 disengage, melee +2/+2/+2. Thus Troubadour base+kit Stamina21, 8 Recoveries, recovery value7, winded10 (before ancestry/other features). Kit Fancy Footwork printed5/7/10 + M or A =>7/9/12 at A2; push0/1/2, optional shift into vacated square. `chapter/kits.md#Kit Signature Ability`: printed kit damage/distance already includes kit bonuses; do not apply twice. Ancestry determines starting speed/size; assert those only from the chosen witness's source.

Remaining source rolls / effects (no automatic damage implied):

| Ability | Base Drama; type | Source outcome |
|---|---|---|
| Power Chord | 0; maneuver | P roll; push1/2/3; 2 burst, each enemy |
| Hypnotic Overtones | 3; main | P roll; slide1/1/2; target I < weak/average/strong => dazed save ends; 2 burst each enemy |
| Upstage | 3; maneuver | A or P roll; taunted EoT all tiers, target A < weak/average/strong => prone; tier3 also can't stand EoT |
| Dramatic Reversal | 5; main | P roll; shift1/2/3 + free strike; tier2/3 free strike has edge; tier3 then may spend Recovery |
| Fake Your Death | 5; maneuver | Self, no roll; invisibility/illusion +3 speed, ignore difficult terrain with termination conditions |
| Flip the Script | 5; main | 3 burst Self+allies; teleport up to5; only teleported targets lose slowed |
| Dramatic Monologue | 0; maneuver | Ranged10; choose one of three effects below |
| Star Power | **1**; maneuver | Self; +2 speed through own turn, next power roll this turn minimum tier2 |
| Turnabout Is Fair Play | 0; triggered | Ranged10; transform triggering edge/bane |
| Riposte | 0; triggered | Melee1; Self/ally damaged by melee strike makes free strike at attacker |
| Harmonize | **3**; triggered | Ranged5 ally; extra target for single-enemy ability costing <=3; added target damage sonic |

**Cost trap:** Star Power's base1 and Harmonize's base3 are printed in clean Heroes headings (Star Power around line15275, Harmonize around15329), corroborating unified frontmatter. Optional spend lines are additional to these base costs, not their replacements.

## Embedded uses and conditional effects

Seven explicit paid options exist. Expose them through the shared action route only when their parent is available; names are implementation choices. A separate optional-use action charges the increment only, with prerequisite text saying the parent use has occurred. A combined invocation must charge base+increment. Do not silently make optional spends permanent.

| Parent/source file | Incremental Drama | Printed option |
|---|---|---|
| Artful Flourish | 2 per added target, unlimited | Add one creature/object per2; base is two targets; independent shift up to3 |
| Witty Banter | 1 | The chosen ally can spend a Recovery |
| Hypnotic Overtones | 2 per +1 burst, unlimited | Increase burst size, not slide distance |
| Dramatic Monologue | 1 | Two targets for the **same chosen effect** |
| Star Power | 1 | Speed+4 replaces+2, not +6; tier floor unchanged |
| Turnabout Is Fair Play | 3 | Stronger edge/bane transformation |
| Harmonize | 1 per extra permitted resource cost, unlimited | Triggering cost ceiling3+n; still one added target, not n targets |

One additional explicit voluntary exchange: Method Acting (`method-acting.md#Effect`) lets the actor become bleeding (save ends) to deal extra5 corruption to its target. Drama increment0; this is distinct from the parent's weakened condition on target. Do not auto-bleed the actor or add5 by default. Headless proof should explicitly show the optional boundary and correct actor/target identities.

Dramatic Monologue has three exclusive effect choices: ally next power roll edge before start of your next turn; ally gains1 surge; enemy next power roll bane before end of their next turn. Preserve which option and recipient was selected, whether represented as explicit actions or structured arguments.

Turnabout normal mappings: edge->bane, double edge->edge, bane->edge, double bane->bane. Spend3 mappings: edge->double bane, double edge->none, bane->double edge, double bane->none. Trigger requires an existing edge/bane; never a generic unconditional modifier.

Witty Banter free base follow-up: one ally within10 can end one save-ends or EoT effect; it is not necessarily the struck creature. Paid Recovery is for that chosen ally. Harsh Critic: first target ability before start of caster next turn loses only non-damage tier effects for all its targets; unconditional effects still work. Instigator taunt source can be caster or willing adjacent ally and ends at end of target's next turn. These are not automatically accomplished by recording damage.

## Routines and performance timing

`routines.md`: at start of **combat round**, choose a new performance or maintain current, no action, only when not dazed/dead/surprised. One current performance at level1. Lasts until unable to maintain or encounter end. Do not grant level5 Medley or schedule them as generic start-of-own-turn effects. Keep lifecycle/area/eligibility explicit and manual if not implemented.

| Performance source | Area/recipient | Timing and manual follow-up |
|---|---|---|
| Choreography | 5 aura Self+allies | Target starts its turn inside: +2 speed until its turn ends |
| Revitalizing Limerick | 5 aura Self+allies | End of caster turn: choose up to P targets; each may spend Recovery |
| Blocking | 2 aura each creature | End of caster turn: choose up to P; teleport into unoccupied spaces **within aura**; cannot harm, leave dying, or impose condition/negative effect |
| Acrobatics | 5 aura Self+allies | Target starts turn inside: one movement jump/tumble/climb test automatically tier3 that turn |
| Ballad of the Beast | 5 aura Self+allies | Target starts turn inside: gains1 surge |
| Thunder Mother | Ranged10 one creature | End of each round while active: optional P roll ignores cover; cannot target same creature twice with this effect |

Starting Thunder Mother is not its end-round attack. If generic use resolves its damage roll, label it as the end-round follow-up and retain a separate manual start/maintain boundary. An indiscriminate roll on activation would be early. Cover exception and previous-target restriction are specific to the performance. The text does not spell out whether the no-repeat set resets when switching away/back: do not invent an automated reset policy; retain manual adjudication if needed.

All delayed grants/teleports/recoveries/free strikes need explicit shared follow-up routes or a clearly recorded manual resolution. A listed feature alone is not action completion; actual actions must be visible and callable, with persisted readback for their supported effects.

## Other boundaries and proof guidance

Upstage's Self header is a movement envelope: shift up to speed, then **one roll against enemies passed adjacent to**, not against Self. Do not taunt/prone the caster. If movement-selected targeting is unsupported, preserve the whole action as explicitly manual with correct cost. Same source inequality threshold still uses class Presence even when choosing Agility for its roll.

Cutting Sarcasm's single-target damage+bleeding/save-ends is the bounded potency shape; validate applied and strict-equality resisted cases from independently chosen target Presence. Method Acting's damage+weakened/save-ends is similarly shaped, but its optional actor bleeding/extra damage must stay explicit. Quick Rewrite is an area envelope with difficult terrain; do not broaden the single-target compiler simply because one target is chosen in a proof. Hypnotic Overtones is area slide+condition, not damage-then-condition. Upstage is movement-selected EoT/compound conditions, not save-ends core grammar. Claim compilation only after checking structural report, not from this source audit.

Dramatic Reversal has **no damage in its own roll**; follow-up free strikes belong to recipients, with tier-based edge and Recovery. Fake Your Death ends on next-turn end, illusion interaction, actor damage, or actor main/maneuver; bonuses aren't permanent baseline. Flip the Script cure is contingent on actual teleport. Manual-only effects should leave unrelated live state unchanged; costs and event records remain persisted and testable.

`drama.md`: start encounter gain Victories; start own turn gain1d3. First occurrence of >=3 heroes using abilities on same turn +2; first hero winded +2; any natural19/20 within line of effect +3; self/other hero death +10. Intact dead body can continue earning in death encounter; at30 revive with1 Stamina/0Drama, no action. Still dead after that encounter cannot gain in later encounters. Lose remainder at encounter end. Do not automate event detection, resource dice or resurrection without supported scope/proof. No start-turn gain from merely selecting class.

Outside combat paid abilities/effects waive cost; same ability/effect cannot be reused until >=1 Victory earned or respite. Unlimited spend effects use Victories budget. A unit-spend UI does not waive these constraints; state manual limitations explicitly when not enforced.

`scene-partner.md`: successful interpersonal NPC test can establish bond; max active bonds=level (one at level1); new excess replaces chosen bond. Negotiation patience+1 max5; first personally made +1-interest argument instead+2 max5. Manual negotiation/bond management, not universal skill bonus.

For proof cohort cover all three acts and each of four signature/3/5 options, all 24 envelopes, seven paid options, Method Acting exchange, and meaningful performance/trigger follow-ups. Assert ownership/conditional grants, subclass/choice pruning, source costs including StarPower/Harmonize base+optional split, no-resource refusal, outside-combat waiver, and persisted outcome/manual event. Damage assertions use actual random tier against the source table; avoid reroll-until-green. Explicit source-based low/high Presence targets exercise potency applied/resisted; P0/1/2 thresholds must not derive from code under test. Do not imply broad performance automation from manual events.

No source ambiguity blocks base inventory, costs, or level-one damage. Thunder Mother repeat-set lifetime is the bounded timing ambiguity above; defer only that interpretation if automation is proposed. This audit approves the inventory as source-derived, not any unreviewed implementation or test result.
