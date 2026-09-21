# V104 complete Elementalist level-one source audit

ENGINE, 2026-09-21; base `33d18be96da1132c945e2436e2a59dcfe6ce43ac`. Independent source inventory and comparison with existing Fire implementation; no tests run and no final implementation approval.

Authority: pinned `vendor/steel-compendium` revision `fb83a789da8f0327a389c277a0c790b1648d5810`. Abbreviated paths below are relative to `vendor/steel-compendium/en/unified/md/`. Read `class/elementalist.md`, all level-one Elementalist features and all25 level-one ability files. Clean Heroes `vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md` Elementalist choice/cost headings corroborate grouping. No Forge or runtime output used for damage expectations. Talent is outside this audit assignment.

## Existing slice and required expansion

`shared/content/classes/elementalist/level-one.ts` currently admits only Fire, Destruction, Delightful Consequences, Bifurcated Incineration+Viscous Fire, The Flesh a Crucible, Conflagration. Class skills limited to Alchemy/Blacksmithing/History; Magic duplicate replacement limited to Empathize. Existing R2 baseline, arrays, Essence, no-kit profile, Hurl Element/Practical Magic grants and Fire/Destruction modifiers already exist. Preserve existing Fire arithmetic/provenance while expanding choices, not replacing them with a fresh guessed model.

`shared/evaluate/classes/elementalist.ts` currently implements Destruction Magic rolled-damage+1 and Fire+Magic rolled-damage+1, with the explicit Hurl Element/fire alternative. It does not implement the other specialization/enchantment/ward effects. Existing generic ability loading is not proof that every embedded feature action has a shared route.

## Creation and inventory

`class/elementalist.md#Basics`: Reason2; assign (2,2,-1,-1), (2,1,1,-1), (2,1,0,0), or (1,1,1,0) over M/A/I/P. Stamina18, eight Recoveries, Reason potency R-2/R-1/R =>0/1/2 atR2; later +6 Stamina/level is not starting bonus. Magic fixed + three crafting/lore skills. Apply existing general duplicate-skill rules, not an Empathize-only restriction. No kit granted.

`elemental-specialization.md`, `1st-level-specialization-feature.md`, `specialization-triggered-action.md` under `feature/elementalist/level-1/`:

| Specialization | Acolyte | Feature / granted ability | Trigger |
|---|---|---|---|
| Earth | Acolyte of Earth | Motivate Earth / Motivate Earth | Skin Like Castle Walls |
| Fire | Acolyte of Fire | Return to Formlessness / same | Explosive Assistance |
| Green | Acolyte of the Green | It Is the Soul Which Hears / prose communication | Breath of Dawn Remembered |
| Void | Acolyte of the Mystery | A Beyonding of Vision / Shared Void Sense | Subtle Relocation |

Only Earth/Fire/Green/Void are selectable specializations, although seven elements exist in fiction. Ability choices are **not restricted by specialization** (`elementalist-abilities.md`). All gain Hurl Element (also usable as a ranged free strike), Practical Magic, Persistent Magic, Essence, Enchantment and Ward features.

| Pool | Pick | Names |
|---|---|---|
| Signatures | Two distinct of8 | Afflict a Bountiful Decay; Bifurcated Incineration; Grasp of Beyond; Meteoric Introduction; Ray of Agonizing Self-Reflection; The Green Within, the Green Without; Unquiet Ground; Viscous Fire |
| 3 Essence | One of4 | Behold the Mystery; Invigorating Growth; Ripples in the Earth; The Flesh, a Crucible |
| 5 Essence | One of4 | Conflagration; Instantaneous Excavation; No More Than a Breeze; Test of Rain |

Total **25 source ability envelopes** =16 choices +2 universal +3 specialization utility abilities +4 triggers. A completed Earth/Fire/Void gets8 envelopes, Green7, before common/ancestry/embedded actions. Green's communication feature has no separately printed ability envelope; provide explicit manual interaction if represented as an action.

## Specialization rules

Each following filename is under `feature/elementalist/level-1/`.

- `earth-acolyte-of-earth.md`: **using** Earth+Magic ability grants stability+1 until start next turn; cumulative. Not permanent starting stability and not restricted to damaging abilities.
- `fire-acolyte-of-fire.md`: Fire+Magic rolled damage+1; Hurl Element also gets this only when its chosen damage type is fire. Practical Magic's fixed fire damage does not become rolled damage. Other Magic fire damage without Fire keyword is not a blanket qualifying case.
- `green-acolyte-of-the-green.md`: when dealing damage to one or more creatures with Green+Magic ability costing Essence, choose self or one creature within10 to gain R temp Stamina. One grant for the triggering ability, not per damaged target; not signature-only or every Green ability. Keep cost/waiver interpretation explicit if automating outside combat; source names an ability that costs essence, not net pool debit.
- `void-acolyte-of-the-mystery.md`: Magic+Ranged+Void distance+2, not melee reach or area dimensions.
- `a-beyonding-of-vision.md`: identify illusions, see invisible creatures, supernatural concealment cannot hide creatures/objects; know observed magic and its specifics. Not generic immunity to illusion effects. Shared Void Sense shares these benefits, not its own ability grant.
- `it-is-the-soul-which-hears.md`: speak/understand animals, beasts, plant creatures; no intelligence increase; may use Reason instead of Presence on influence tests. Touch living non-creature plant for telepathy: plant returns nonspecific feelings/sensations, not detailed factual speech.

## Enchantments and wards

Choose **one of five** enchantments; **one of four** wards. Source-authorized change is complex ritual as respite activity (`enchantment.md`, `elementalist-ward.md`). Project Q-CHAR-5 does not exempt these from ordinary full-edit approval; the kit exception must not be generalized.

| Enchantment source slug | Level-one rule |
|---|---|
| enchantment-of-battle | While wearing light armor +3 Stamina; while wielding light weapon +1 damage with Weapon abilities including free strikes; enables corresponding treasures. Cannot take if hero has a kit. Do not give either bonus unconditionally on selection. |
| enchantment-of-celerity | Speed+1, Disengage+1 |
| enchantment-of-destruction | Magic **rolled** damage+1 |
| enchantment-of-distance | Ranged Magic distance+2 |
| enchantment-of-permanence | Stamina+6, stability+1; later increments not atlevel1 |

At Human base speed5/disengage1 with no other modifiers: default18 Stamina/recovery6/winded9; Permanence24/8/12 and stability1; Battle **when armored**21/7/10; Celerity speed6/disengage2. Battle equipment facts must be explicit or the benefit manual. Destruction does not boost fixed Practical Magic damage. Distance+Void stacks to+4 only for Magic+Ranged+Void; neither bonus enlarges cubes/bursts. Do not overwrite unrelated ancestry/item modifiers when appending class contributions.

| Ward source slug | Rule |
|---|---|
| ward-of-delightful-consequences | First damage taken each round grants1 surge; not on every hit or initial baseline |
| ward-of-excellent-protection | Printed immunity clause: acid, cold, corruption, fire, lightning, poison, or sonic equal to R |
| ward-of-natures-affection | When a creature within R damages caster, free-trigger slide that creature up toR |
| ward-of-surprising-reactivity | When adjacent creature damages caster, free-trigger push it up to2R |

Excellent Protection text has no instruction to select one damage type, unlike Hurl Element's explicit choice. Do not invent a persistent one-type selection. Preserve exact multi-type immunity wording and check the general immunity model when implementing; any unresolved interpretation should stay explicit/manual and go to the rules question register, rather than guessing. Psychic/holy/untyped are not listed.

## Damage, costs and targets

All named ability rows cite their kebab-case file under `feature/ability/elementalist/level-1/` (commas removed from slugs). All rolls use Reason. Table values are bare source damage atR2 **before** Destruction/Fire modifiers. All listed signatures cost0; universal/utility/trigger base costs0.

| Ability | Base cost | R2 tiers1/2/3 | Target/effect boundary |
|---|---|---|---|
| Hurl Element | 0 | 4/6/8 | One creature/object; choose acid/cold/corruption/fire/lightning/poison/sonic; no untyped/psychic/holy option |
| Afflict a Bountiful Decay | 0 | 4/6/8 corruption | One creature; self/ally within distance ends one save-ends/EoT effect |
| Bifurcated Incineration | 0 | 2/4/6 fire | Two creatures/objects; no +R damage |
| Grasp of Beyond | 0 | 5/8/11 corruption | One creature; optional caster teleport up toR |
| Meteoric Introduction | 0 | 5/7/10 | One creature/object; push2/3/4 |
| Ray of Agonizing Self-Reflection | 0 | 4/6/8 corruption | One creature/object; target R<weak/average/strong => slowed save ends |
| The Green Within, the Green Without | 0 | 4/7/9 | One creature; slide one creature within10 of **target** up to2 |
| Unquiet Ground | 0 | 2/5/7 | 2 cube within10, enemies; ground difficult terrain for enemies |
| Viscous Fire | 0 | 4/7/9 fire | One creature/object; push2/3/4 |
| Behold the Mystery | 3 | 2/4/6 psychic | 3 cube within10, enemies; persistent1 maneuver repeat |
| Invigorating Growth | 3 | 6/9/13 poison | One creature; ongoing mushrooms/surges and removal main action |
| Ripples in the Earth | 3 | 3/5/8 | 2 burst enemies; tier3 M<strong =>prone; touching ground prerequisite; optional pillar |
| The Flesh, a Crucible | 3 | 7/10/13 fire | One creature/object; persistent1 repeat roll if within distance |
| Conflagration | 5 | 4/6/10 fire | 3 cube within10 enemies; persistent2 maneuver repeat |
| Test of Rain | 5 | 4/6/10 acid | 3 cube within10 enemies; self and each ally in area can end one save-ends/EoT effect |

Destruction adds1 to each rolled Magic row. Fire Acolyte adds another1 only to Bifurcated/Viscous/Flesh/Conflagration and fire-selected Hurl among these rows. Thus retained Fire+Destruction expectations: Bifurcated4/6/8; Viscous6/9/11; Flesh9/12/15; Conflagration6/8/12; Hurl fire6/8/10 versus other allowed types5/7/9. Cross-specialization choices still receive their actual applicable modifiers.

Instantaneous Excavation costs5, **maneuver**, no direct damage tiers. Open two mundane-surface holes, each1-square opening/depth4; may combine openings. **Separate roll per eligible creature** standing above each hole, not one shared attack roll. Tier1 shift1 to nearest unoccupied space from edge; tier2 fall; tier3 fall without reducing height. No critical (maneuver). Falling damage/geometry remain explicit; don't replace the roll with guessed flat damage. Persistent1 adds one new hole at start of turn with rolls for eligible creatures, no activation payment.

No More Than a Breeze costs5, maneuver, Self/ally ranged10: pass through solid matter, ignore difficult terrain, movement no opportunity attacks until start next turn. End turn inside matter => forced back to entry space and effect ends. Persistent1 extends duration, not a new teleport or attack.

## Embedded actions and manual boundaries

Practical Magic (`practical-magic.md`): maneuver Self header contains three exclusive options, not a self-damage roll: (1) Knockback at **Hurl Element range**, using Reason instead of Might; (2) chosen creature within that range takes **fixed R damage** of seven Hurl types; (3) caster teleports up toR, optionally +1 square per Essence. Expose selection/recipient/type and optional incremental spend. Fixed damage gets neither rolled-damage bonus. Changing Hurl range can change Practical range; it does not make Practical itself a generic ranged attack.

Four triggered abilities and optional costs:

- Skin Like Castle Walls: Self/ally ranged10 taking damage => half damage; spend1 reduces associated potency effects by1 for target. Unlike Null Shield, wording does not say choose only one associated effect.
- Explosive Assistance: Self/ally ranged10 force moves creature/object => distance+R; spend1 replaces with+2R, not+3R.
- Breath of Dawn Remembered: Self/ally ranged10 starts turn **or** takes damage => may spend Recovery; spend1 per **additional** Recovery; ensure target can pay Recoveries, not automatic free healing.
- Subtle Relocation: Self/ally ranged10 starts turn/moves/is force moved => teleportR; voluntary-move trigger can teleport at any point during movement; spend1 replaces with2R.

Along with Practical Magic extra teleport, these are **five optional paid-use families**, two unlimited (Practical and Breath). Base triggers cost0. Source prerequisites, per-unit costs and outside-combat Victories budget must remain visible if not automatically enforced.

Other required follow-ups/utility actions, parent-gated:

- Motivate Earth: touch mundane dirt/stone/metal, create5-wall including touched square; alternative open1-square hole in >=2-square structure or seal existing <=1-square opening. Not magical terrain or unrestricted destruction.
- Return to Formlessness: mundane object, destroy only touched square if larger than1square.
- Shared Void Sense: up to one creature **per Victory**, range10 plus eligible Void/Distance bonuses, through end next turn; never grants Shared Void Sense itself. Zero Victories means zero recipients.
- Invigorating Growth: damaged target bears mushrooms; caster and allies adjacent gain1 surge whenever target takes damage; target or adjacent creature can remove mushrooms as **main action**. Need accessible removal instruction/action, not only an attacking grant.
- Ripples: touching ground; chosen ground square empty or occupied by caster/ally; pillar height<=R cannot cause collisions. Terrain/forced movement explicit manual.
- Afflict/Test of Rain effect removal, Green acolyte temp Stamina selection, Grasp teleport, Green Within slide, both reactive ward movements, and Battle equipment conditions must be represented beyond passive labels if claiming their effects are supported.

## Persistent Magic: not a repeated activation cost

`persistent-magic.md` and `essence.md`: choose maintain immediately after first use. In combat **reduce Essence earned at turn start** by sum of persistent values; cannot make that gain negative. This is not an immediate recurring pool debit nor the original3/5 activation cost. Stop any time, no action. All maintained abilities end at encounter end. Damage in one turn >=5R (10 atR2) ends all maintained abilities. Same persistent ability cannot affect a creature multiple times; if maintained on several targets and a roll is involved, one roll applies to all, subject to the source's specific hole-opening instruction.

Five level-one persistent entries:

| Parent | Upkeep | Timing/action |
|---|---|---|
| Behold the Mystery | 1 | At turn start can use maneuver to repeat, no activation payment |
| The Flesh, a Crucible | 1 | At turn start, if target in range, repeat roll, no action/payment |
| Conflagration | 2 | At turn start can use maneuver to repeat, no activation payment |
| Instantaneous Excavation | 1 | At turn start add hole and roll eligible creatures, no activation payment |
| No More Than a Breeze | 1 | Effect lasts until start next turn |

A separate repeat action must not route through the paid parent and charge its original cost again. If upkeep/repeats remain manual, clearly label that limit and provide the shared manual action(s); don't assert persistent gameplay from an initial spell event. Outside combat maintain for Victories rounds; not indefinite free uptime. General repeat-use waiver restrictions still apply to ordinary paid uses.

## Essence and proof requirements

`essence.md`: encounter start Victories, own-turn start2 before upkeep; first time each combat round caster or creature within10 takes **typed damage other than holy** gain1 (untyped/holy excluded); encounter end lose pool. Resource-generation detection is manual unless separately proven. Outside-combat paid costs waived, repeat same effect barred until Victory/respite; unlimited spend budget Victories. Existing project warning-only handling must not be described as full enforcement.

Cohort should cover all four specializations, all eight signatures (two each), four3/four5 options, five enchantments and four wards (more than four builds needed if covering every enchantment directly). Verify cross-specialization choice legality, skills beyond old narrow set, no kit, pruning and preserving admitted builds during edits. Retain old Fire/Destruction expectations. Prove rolled-damage positive/negative modifiers, ranged distance vs area dimension, equipment-dependent Battle benefits or explicit manual treatment.

Meteoric/Viscous push and Ray condition must be checked against actual structural admission/report, not assumed from names. Ray was formerly compile-only/unavailable: now reachable needs its own source-derived applied/resisted target Reason witnesses and save-ends instance readback. Equality resists; caster Reason supplies thresholds. Area spells, persistent sections and other compounds remain compatibility/manual where current compiler requires it. Do not promote a whole spell merely because its first damage clause parses.

Every newly granted action needs UI/shared API visibility and persisted readback; manual records prove recording and payment, not terrain/movement/recovery/maintenance effects. Preserve source-linked manual remainders, subtype and temporal restrictions. This audit requests no implementation changes outside V104 and ran no tests.
