# V106 Beastheart level-one independent source audit

ENGINE, 2026-09-21. Base 88e51a2. Authority: pinned Steel Compendium fb83a789da8f0327a389c277a0c790b1648d5810 only. No tests or implementation approval. Paths below are relative to vendor/steel-compendium/en/unified/md. Read class/beastheart.md, all 13 feature/beastheart/level-1 files, all 22 feature/ability/beastheart/level-1 files, all 14 companion stat blocks, 15 companion level-one traits and 14 companion level-one ability files. The chapter/the-beastheart-class.md stub has no additional body rules.

## Creation and inventory

class/beastheart.md#Basics: Might 2 and Intuition 2; assign 2,-1,-1 / 1,1,-1 / 1,0,0 to Agility/Reason/Presence. Starting Stamina 21, twelve Recoveries, Might potency M-2/M-1/M (0/1/2 at M2). Later +12 Stamina per level is not a level-one addition. Human before kit: Stamina21/recovery7/winded10. Fixed skill is labelled Animal Handling but links to skill/interpersonal/handle-animals.md, whose canonical name is Handle Animals; resolve by source identity, not an invented second skill. Choose two exploration/intrigue skills, plus nature skill and shared companion skills.

Four natures (feature/beastheart/level-1/wild-nature.md), with exact level-one grants from wild-nature-maneuver.md and wild-nature-triggered-action.md:

| Nature | Skill | Hero-only maneuver | Trigger usable by either partner |
|---|---|---|---|
| Guardian | Read Person | Living Arrow | The Pack Defends |
| Prowler | Hide | Lightning Leap | Shadow in the Mist |
| Punisher | Endurance | Avalanche Rush | Thunderclap |
| Spark | Magic | Jaws of the Storm | Pyre |

Choose ONE signature of four: Bodyswap, Come On!, Covering Fire, Stormrage. Feral Strike is marked signature in metadata but is a universal companion grant, not a fifth selectable option. Choose one 3-Ferocity ability: Bring the Thunder, Herd the Sheep, Hungry Like the Wolf, Pushover. Choose one 5-Ferocity ability: All of You Versus All of Me, I Feed On Your Pain!, Rain of Fire, You Let Me Get Too Close. Cross-nature choices have no restriction. Universal Heart of the Beast can be used by both; Feral Strike only by companion. Thus 22 class envelopes = 12 choices + 8 nature grants + 2 universal; plus 14 species maneuvers = 36 unique new envelopes, before embedded options/common/kit abilities.

Choose one of 14 companions and a kit; drake additionally chooses one of seven attuned types. Companion melee kit-bonus choice is separate: use kit's melee bonus, if any, OR 0/0/4. Do not grant both. Hero alone receives kit signature. The pair both receive kit benefits, but companion maximum Stamina equals the hero's final maximum: do not add the kit Stamina a second time. Kit damage bonuses are to rolled Melee+Weapon or Ranged+Weapon damage (chapter/kits.md#Damage Bonuses), not fixed maneuver damage. Companion has no ranged free strike.

## Companion baselines and species grants

Sources: monster/companion/beastheart/statblock/<species>.md; traits feature/companion/beastheart/<species>/level-1/*.md; actions feature/ability/companion/beastheart/<species>/level-1/*.md. All printed M2/R-1/I2, Stamina '= yours', Free Strike '1 + M'. A/P vary below. Values precede kit and conditional traits.

| Species | Size | Speed/movement | Stability | A/P | Immunity | Shared skill | Maneuver |
|---|---|---|---|---|---|---|---|
| Basilisk | 1L | 5 | 2 | 1/2 | poison3 | Alertness | Petrify |
| Bear | 1L | 5 climb | 2 | 1/2 | none | Intimidate | Backhand |
| Boar | 1M | 5 | 2 | 1/2 | none | Search | Gore |
| Condor | 1M | 7 fly | 0 | 1/1 | none | Alertness | Flurry of Wings |
| Deinonychus | 1M | 7 | 1 | 2/1 | none | Track | Terrible Claws |
| Drake | 1M | 5 fly | 1 | 1/2 | attuned3 | Intimidate | Drake Breath |
| Elemental Spark | 1M | 7 | 1 | 2/1 | lightning3 | Magic | Static Shock |
| Gummy Ball | 1L | 5 | 2 | 2/1 | acid3 | Sneak | Absorb |
| Hellhound | 1M | 7 | 1 | 2/1 | fire3 | Intimidate | Fire Breath |
| Lightbender | 1L | 7 | 2 | 1/2 | none | Hide | Sparking Tail Whip |
| Panther | 1M | 7 climb | 1 | 2/1 | none | Sneak | Pounce |
| Spider | 1M | 5 climb | 1 | 2/1 | none | Sneak | Web Shot |
| Sporeling | 1S | 5 | 0 | 2/1 | poison3 | Track | Spore Puff |
| Wolf | 1M | 7 | 1 | 2/1 | none | Track | Clamping Jaws |

Traits (not optional higher-level advancements):

- Bear Strong Like Bear gives the HERO +1 stability: stat-block 'you' means beastheart. Do not inflate bear's printed stability2 from this sentence.
- Drake Elementally Attuned chooses acid/cold/corruption/fire/lightning/poison/sonic. Shared Scales gives hero immunity3 of that type; drake has same printed immunity3.
- Hellhound Hellish Pact gives hero fire immunity equal to hellhound's fire immunity (3 initially). Other species immunities do not automatically transfer.
- Boar Spiteful Endurance: while winded, immunity equal to boar M and ignores bleeding effects. Does not remove bleeding itself or give unconditional immunity.
- Condor Moving Target: ranged strikes against it take bane only while flying AND speed>0.
- Deinonychus Blood Frenzy: each time it damages a bleeding creature, gain1 surge into shared pool.
- Elemental Spark Electric Surge: first time per turn either partner deals lightning damage, gain1 shared surge (not once per partner).
- Gummy Ball Gelatinous: may occupy creatures; line-of-effect restrictions for fully enclosed creatures; ball space difficult terrain.
- Lightbender Avoidance: any saving-throw-ended effect instead ends automatically at end of its next turn. A generic d10 save registration is incorrect here; this is not merely a different threshold.
- Panther Mighty Spring: Advance or Charge permits jump up to speed, any direction including vertical, as part of movement.
- Spider Come Into My Parlor: strike against restrained creature deals extra poison2I=4.
- Sporeling Skulker: may end in ally space and has cover there.
- Wolf Retriever: full speed with grabbed creature regardless of size.
- Basilisk Stoned: special effect, not a core condition synonym. Each failed ending save deals corruption M=2. Target or adjacent creature may spend maneuver to cut stone, end effect and deal unreducible 2M=4 to target. Reaching0 while stoned or from a stoning ability petrifies until magically restored to life. This grants a contextual action to affected/adjacent creatures, not just a basilisk button.

## Two creatures, one hero

feature/beastheart/level-1/companion-rules.md is the binding architecture contract:

- Separate current Stamina/conditions/positions/characteristics. Companion maximum equals hero maximum. Companion has no Recoveries; every companion Recovery expenditure consumes the hero's pool. Do not allocate a second pool of12. Companion can become dying at0 and die at negative half maximum as printed; do not apply ordinary foe removal at0.
- Shared surge pool; if an effect grants surges to BOTH, gain them only once. One ferocity pool fuels either user's paid abilities. Rampage belongs to companion, not hero, and is not spendable currency.
- Same turn and start/end boundaries for both. Each has own move action. Shared one triggered action per round. Main and maneuver split: whoever uses main cannot use maneuver, partner can; taking main does not prohibit free maneuvers. Additional/removed actions affect the individual, not both (adding-and-subtracting-actions.md); dazed on one does not daze the other.
- Catch Breath, Escape Grab, Hide and Stand Up grant partner the SAME maneuver as a triggered free action. This is not a second ordinary maneuver or ordinary triggered-action expenditure.
- Beastheart keyword means hero-only, Companion means companion-only; shared abilities use actor-specific 'you' and other creature as 'partner'. Within companion stat blocks 'you' means hero. These ownership checks must exist in shared API, not just UI labels.
- Skills shared in both directions; physiology limits actions. Perks/titles/complications shared only where logically applicable, explicitly Director-adjudicated. Ancestry traits are not blanket transferred.
- Telepathy within1 mile is vague images/feelings; shared space permits moving through and ending in each other's spaces. Pair counts as one hero for encounter/montage difficulty and shares one montage turn.
- Companion replacement is respite activity; preserve identity/history of prior creature appropriately and do not silently duplicate live resource pools. Source allows recalling a previously released companion.

feature/beastheart/level-1/beasthearts-and-magic-treasure.md: hero adjacent may use eligible edible/drinkable or weapon-enhancing consumable to benefit companion instead, with hero paying required action. One suitable passive Neck trinket allowed; not arbitrary biped gear or action-activated trinkets. Hero's leveled-item benefits also benefit companion. Keep physiological/eligibility decisions explicit/manual until supported.

## Resource and rampage

ferocity.md: start encounter Victories; own-turn start1d3; first time each round a creature adjacent to companion takes damage, gain2. End encounter clear. Outside paid abilities waive payment but same effect cannot repeat until Victory/respite; variable/unlimited budget equals Victories. This is Beastheart's own source, not Fury's ferocity trigger.

rampage.md: whenever either partner SPENDS ferocity, companion gains equal rampage. Free/waived cost does not state a spend; do not fabricate rampage from waived nominal costs. At8, mandatory end-of-turn Feral Strike as free maneuver, cannot voluntarily lower outcome tier. Each ally damaged grants2 shared surges usable on that strike. At12 immunity equal to companion I (2 at level1). Thresholds16/20/24 require levels4/7/10 and are unavailable at level1. End encounter clear rampage/effects. Rampage gain must follow actual payment/correction/history consistently if automated; otherwise expose an explicit linked manual adjustment and do not claim full spend automation.

## Source damage and embedded actions

All class ability paths feature/ability/beastheart/level-1/<kebab-name>.md. Base M=I2, no kit damage included:

| Ability | Cost/actor | Tiers or fixed result |
|---|---|---|
| Bodyswap | 0 hero | I roll5/7/9; optional grounded willing ally swap within10 gives edge |
| Come On! | 0 hero | M roll4/5/6; companion melee free strike, both shiftI |
| Covering Fire | 0 hero | I roll4/6/8; target free-trigger prone or extra2I=4; companion shift its I |
| Stormrage | 0 hero, explicit companion follow-up exception | M roll4/6/8 chosen cold/fire/lightning/sonic; spend1 surge without benefit for companion same-roll use on different target, no recursion |
| Feral Strike | 0 companion | M roll3/5/6, 1burst EACH CREATURE; movement toward closest known enemy then roll; nature-specific effects |
| Bring the Thunder | 3 companion | I roll3/5/7 sonic,push1/2/3; P<0/1/2 taunted/taunted/frightened save ends |
| Herd the Sheep | 3 companion | M roll7/10/13,slide1/2/4,I<threshold weakened save ends; partner shifts depend on actual movement |
| Hungry Like the Wolf | 3 companion | M roll6/9/13; recovery opportunities differ by tier; tier3 A<2 bleeding EoT and shifts |
| Pushover | 3 companion | M roll7/10/13,push2/4/6; passing hero space causes prone+heroI extra |
| I Feed On Your Pain! | 5 hero | M roll10/14/18;tier3M<2bleeding save ends; conditional2surges |
| Rain of Fire | 5 hero | M roll3/5/8 fire; companion in area adds its I fire to each |
| You Let Me Get Too Close | 5 hero | M roll10/14/18,M<threshold grabbed; conditional companion free strike |
| All of You Versus All of Me | 5 hero maneuver | optional Recovery;3tempStamina/enemy;taunt EoT;extra1Ferocity companion-origin burst |

Feral Spark type choice and Stormrage type choice must not silently become untyped damage. Feral targets allies too; other nature riders apply enemies only where printed (Punisher slide each target). Kit weapon bonuses apply to qualifying rolled damage, not every row.

Nature maneuvers: Living Arrow teleports companion to eligible space within10 then companion free strike;1Ferocity range15. Lightning Leap fixed5 plus lightning jump-distance, pre-jumpI;1 no opportunity attacks. Avalanche Rush fixed5,M<1prone; move3before/after, entering prone enemy space first time deals coldM;1raises potency tostrong2. Jaws of Storm fixedM chosen4types,2cube;1increases cube1.

Nature triggers: Pack Defends halves ally damage;1Ferocity spends Recovery without self healing, target gains recovery value. Shadow in Mist invisibility until nextturnend/dealingdamage plus Hide and I movement;1 doubles movement and ignores terrain. Thunderclap sonicM and push1+M; halve triggering damage only if pushed away from victim;1doubles push. Pyre halves self damage+teleport5;1 fire/lightningI to enemies adjacent originalspace. Shared trigger actor uses own statistics.

Heart of Beast: either partner, Self maneuver, Recovery expenditure without self healing; partner teleports from any distance/no line of effect and gains tempStamina equal user's recovery value. Options:1Ferocity partner shift speed;1–5 adds partnerM temp per point;5 restores dead partner at1Stamina even destroyed, with NO tempStamina in that mode. All expenditures sourced from shared pools. Expose bounded amount rather than unlimited repeat1 that could exceed5.

Species maneuvers are fixed, not rolled/critical: Petrify5corruption+stoned (1 adds slowed while stoned); Backhand6+push2 (1 addsMdistance); Gore5,+Mif moved closer (1bleedingEoT); Flurry5+adjacentenemy weakened until heronextturnend (1taunted INSTEAD); Terrible Claws5,M<1bleedingEoT (1M<2bleedingsaveends); Drake Breath2attuned in1or2cube (1/2Ferocity gives3/4cube); Static Shock4lightning (1melee5); Absorb5acid,A<1enter space/grab if fits (1grabbedtarget acidM each companionturnend); Fire Breath5fire (1 +I damage OR distance); Sparking Tail Whip5,M<1dazzledEoT, lineofeffect1 (1baneonstrikes); Pounce5,M<1prone (1jump speed and ifjump>=1 M<2prone); Web Shot nodamage,M<1restrainedEoT (1M<2restrainedsaveends); Spore Puff5poison+target-relative invisibility (1M<2dazedEoT); Clamping Jaws5,M<1grabbed (1M<2grabbed). Equality resists potency.

## Ambiguities and safe boundaries

1. Companion stat blocks print Free Strike1+M=3, but rule/monster/creature-free-strike.md describes no-roll strikes specifically for Director-controlled creatures; player companion is not explicitly covered by that wording. Strong evidence favors using printed3 rather than generic hero rolled4/7/9, but label this interpretation and leave unresolved distance/keyword/type inheritance explicit if source cannot settle it. No companion ranged free strike is unambiguous.
2. Companion-only text sometimes says 'you and your companion' or 'originating from you' (Bring the Thunder, Herd the Sheep), despite general actor-relative pronouns. Preserve explicit paired origin semantics as manual where necessary; do not produce two bursts from same companion or two shifts of same entity. Stormrage explicitly grants companion use despite Beastheart keyword; this is a specific exception, not authority for every hero-only action.
3. No separate companion potency statistic is printed; class potency is Might-derived, and all level-one companions M2. Use class source for ordinary thresholds but record derivation; do not infer monster printed numeric thresholds or use chosen roll I to derive potency.
4. Avoidance and Stoned cannot safely reuse generic core-condition/save automation unchanged. Saving at shared boundaries needs companion identity and trait-aware producer behavior or a clear manual boundary. Effects and saving throws remain separate per creature even though timing is shared.
5. Maximum Stamina is equality, not one combined damage pool. Shared Recoveries does not mean companion may heal hero whenever it spends one. Shared surges must not be doubled. Changing companion cannot transfer all old conditions to new species without an explicit policy.
6. Physiological perk/complication eligibility and optional damage-type reskins require Director judgment explicitly in source. Do not grant arbitrary reskins as normal creation choices. Record unresolved product/rules choices in docs/rules-questions-for-user.md before automating beyond these passages.

## Proof priorities

Source-derived fixtures should cover all14 species baselines/grants, four natures,12 chosen abilities,14 companion maneuvers, typed choices, kit choice and alternative0/0/4. Prove separate companion targeting/Stamina/conditions with shared max and Recovery/surge pools, ownership and actor-keyword refusals, hero-only kit signature, no companion rangedfree strike, same turn boundaries and separate effects, paid/waived Ferocity and Rampage handling, companion replacement/pruning/history, and read persisted state after every new shared action. A hero-only action catalog is not proof of a playable Beastheart companion. If the slice scopes these mechanics manual, the shared API must expose the manual actor/recipient operation and delivery language must state that boundary.
