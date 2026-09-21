# V100 independent source inventory audit

ENGINE, 2026-09-21. Read-only source audit from base 2db8e7b; Compendium pin fb83a789da8f0327a389c277a0c790b1648d5810. No implementation approval and no tests. Source paths below are relative to vendor/steel-compendium/en/unified/md/. Spec Q-CHAR-6 restricts this delivery to printed portfolios; the source's permission to invent a deity does not override that scope.

## Choices and counts

- class/conduit.md Basics: Intuition 2; assign M/A/R/P from 2,2,-1,-1; 2,1,1,-1; 2,1,0,0; or 1,1,1,0. Stamina18, recoveries8, potency I-2/I-1/I (0/1/2). Two interpersonal/lore skills. No ordinary kit granted.
- feature/conduit/level-1/deity-and-domains.md: choose deity then TWO distinct domains from its printed portfolio. Both domains form the subclass and grant their respective piety triggers/prayer effects. They do not grant two first-level domain features.
- 1st-level-domain-feature.md: choose ONE of those two domains for its feature and ONE skill in that domain's group. Changing the deity/pair must prune an excluded feature-domain and dependent skill/actions. Swapping the feature-domain must not revoke the other selected domain's piety/effect.
- 12 domains; 5 prayers choose1; 4 wards choose1; 2 triggered abilities choose1; 8 signatures choose2; 4 three-piety abilities choose1; 4 five-piety abilities choose1.
- 23 distinct level-one source ability files = 8 signatures +4 cost3 +4 cost5 +2 triggered +2 universal (Healing Grace/Ray of Wrath) +3 domain grants (Hands/Grave/Friend). Per character, 7 source abilities normally, 8 if choosing Creation/Death/Nature feature. Embedded uses are additional, not more source files. Many apparent feature duplicates are grant wrappers.
- Printed portfolio list can reuse the 38 explicitly sourced god/saint entries; do not infer a portfolio for Lords of Hell or add a custom option.

Source ability inventory (feature/ability/conduit/level-1/):
- Signatures: Blessed Light, Drain, Holy Lash, Lightfall, Sacrificial Offer, Staggering Curse, Warrior's Prayer, Wither.
- 3 Piety: Call the Thunder Down, Font of Wrath, Judgment's Hammer, Violence Will Not Aid Thee.
- 5 Piety: Corruption's Curse, Curse of Terror, Faith Is Our Armor, Sermon of Grace.
- Trigger choice: Word of Guidance / Word of Judgment; parent uses free, their double-edge/double-bane enhancements each cost1.
- Universal: Healing Grace (once on your turn is in its FEATURE wrapper), Ray of Wrath (may be used as ranged free strike, also in FEATURE wrapper).
- Domain: Hands of the Maker / Grave Speech / Faithful Friend. Hands and Friend target Self. Grave Speech requires a creature dead within24h, shared language, one-minute duration, never same corpse twice; Stamina0 alone does not establish actual death.

## Domain features

Under feature/conduit/level-1/, table maps:
Creation Hands of the Maker/crafting; Death Grave Speech/lore; Fate Oracular Visions/lore; Knowledge Blessing of Comprehension/lore; Life Revitalizing Ritual/exploration; Love Blessing of Compassion/interpersonal; Nature Faithful Friend/exploration; Protection Protective Circle/exploration; Storm Blessing of Fortunate Weather/exploration; Sun Inner Light/lore; Trickery Inspired Deception/intrigue; War Sanctified Weapon/exploration.

Do not copy Censor mechanics blindly: Hands maintains Intuition objects, and Inspired Deception substitutes Intuition. The table links some Censor pages, but Conduit-specific feature/ability pages give those class-specific values. Retain Conduit provenance.

Embedded domain uses to inventory: Hands Destroy; Friend Dismiss; Oracular Visions spend1 fate point for edge when self/creature within10 makes test; Revitalizing Ritual at respite; Compassion negotiation benefit; Protective Circle create and dismiss; Fortunate Weather respite choice; Inner Light respite ritual; Inspired Deception optional Intuition substitution; Sanctified Weapon respite blessing. This is 11 explicit use entries if following V99's one-entry-per-choice-family convention. Knowledge's research-language benefit is passive, not universal language knowledge. Fate points are not Piety.

## Prayers and wards

Source folder feature/conduit/level-1/; prayers/wards can be changed as a respite activity, not freely mid-combat.

- prayer-of-destruction: +1 ROLLED damage with MAGIC abilities, including area/non-Strike magic. Do not repeat the V99 area-bonus omission.
- prayer-of-distance: +2 distance for RANGED MAGIC abilities; do not enlarge an area. Retain manual display if distance is not modeled, rather than claiming it is applied.
- prayer-of-speed: +1 speed and +1 Disengage shift distance.
- prayer-of-steel: +6 Stamina and +1 stability at level1.
- prayer-of-soldiers-skill: incompatible with any kit. Light armor/light weapon proficiency; Stamina+3 only WHILE wearing light armor; damage+1 with weapon abilities/free strikes only WHILE wielding light weapon. Not a magic damage bonus. Equipment-sensitive benefits cannot silently become unconditional baseline benefits; use explicit equipment evidence or a clearly stated manual boundary.
- bastion-ward: +1 saving throws (unconditional). Preserve provenance and ensure runtime saving threshold reflects the bonus if automated. Do not simply overwrite another ancestry's existing save benefit; any composition must follow pinned general bonus rules.
- quickness-ward: after adjacent creature damages you, optional shift up to I. Expose an executable manual use with the trigger.
- sanctuary-ward: when another creature damages you, it cannot target you with a strike until you harm it/an ally, or end of its next turn. Conditional and timed; expose/prove manual handling if not automated.
- spirit-ward: adjacent creature damaging you takes corruption damage I. Conditional reactive effect needs explicit manual use/readback if not automated.

## Piety and prayer effects

piety.md: start encounter=Victories; start own turn gain1d3; lose remainder at encounter end. Optional Pray BEFORE rolling (no action): die1 adds1 but suffers irreducible1d6+level psychic; die2 adds1; die3 adds2 and may activate ONE chosen domain effect. Do not conflate this with the five passive Prayer selections.

Outside combat: paid abilities/effects waived, repeat prohibited until Victory/respite. Unlimited-piety uses such as Healing Grace act as spending Victories (not arbitrary unlimited paid repetitions). Existing generic waiver alone does not express that variable-spend limit.

Expose prayer invocation and all12 domain effects conditionally from the TWO domains, not just feature-domain. All effects range10 unless noted below. domain-piety-and-effects.md:
- Creation: area ability first occurrence within10=>2; effect stone wall size5+I lasts encounter.
- Death: first nonminion reduced0 OR solo winded within10=>2; effect up to2 enemies take2I corruption.
- Fate: first ally tier3/enemy tier1 within10=>2; effect one creature's next roll before encounter end becomes chosen tier1/3.
- Knowledge: first Director Malice spend=>2; effect up to5 allies, self substitution allowed, each1 surge.
- Life: first creature regains Stamina within10=>2; effect self/ally Recovery OR cleanse OR stand OR2I temporary Stamina.
- Love: first self/ally within10 Aid Attack or ally-targeting ability=>2; effect each ally within10 gains2I temp Stamina (not automatically self).
- Nature: first self/creature within10 takes acid/cold/fire/lightning/poison/sonic=>2; effect I creatures slide I.
- Protection: first self/ally within10 gains temp Stamina or defensive triggered action=>2; effect ONE ALLY gains4I temp Stamina (no printed self substitution).
- Storm: first enemy force moved within10=>2; effect enemies in3cube within10 take2I lightning.
- Sun: first ENEMY within10 takes fire/holy=>2; effect one enemy takes3I fire.
- Trickery: first self/creature within10 Aid Attack/Hide maneuver=>2; effect one creature slide5+level.
- War: specific paragraph says first self/creature within10 taking GREATER THAN10+level damage IN A SINGLE TURN=>2; effect up to3 allies, self substitution allowed, each2 surges.

Two domains can trigger from same event; each is first-time-in-encounter limited. Without event automation, triggers, timing, distances, resource generation and domain effects remain manual; do not fake proof of automated gain or exact positioning.

## Ability embedded uses and boundaries

- Healing Grace: four separately accessible enhancement choices costing1 per selection: additional ally, end eligible effect, stand prone target, additional Recovery. Retain once-own-turn and unlimited-spend/Victories caveat. These enhance a parent use; they are not four independent unconditional spells.
- Word of Guidance double edge1 / Word of Judgment double bane1; same parent trigger and target.
- Sacrificial Offer grants chosen self/ally a later one-roll bane option until end next turn. Inventory the beneficiary's conditional use (or explicitly bounded manual proxy), not only source casting.
- Sermon of Grace grants targets free triggered cleanse OR stand, in addition to optional Recovery. Action grant needs a shared operation and persisted proof; this is not extra Piety spend.
- Ray of Wrath optionally holy rather than automatic holy; its free-strike eligibility must remain visible/shared.
- Font of Wrath spirit damage, Violence retaliation, Friend damage-dismiss/irreducible backlash, surges, healing, temp Stamina, movement, weakness, bans and positions are manual unless explicitly existing mechanics cover them; retain source text and actual manual event readback.
- Curse of Terror is the straightforward bounded single-target core condition: damage6/9/13+I, I<0/1/2 frightened(save ends). Prove applied/resisted and source-linked save if grammar admits it.
- Corruption's Curse weakness5, Wither next-roll bane, and Judgment's Hammer prone/cannot stand are not equivalent to that save-ends core-condition grammar. Do not broaden by relabeling them.
- At I2 without Destruction, source damage examples: Ray4/6/8; Blessed/HolyLash/Staggering/Wither5/7/10; Drain4/7/9; Sacrificial4/6/8; Warrior/Judgment/Violence/Corruption5/8/11; Curse8/11/15; Lightfall/Thunder2/3/5. Destruction adds1 to these Magic rolled damage values; no kit bonus.

## Ambiguities requiring explicit handling

1. domain-piety-and-effects introduction says Sun nearby creature and War10+level-or-higher; named domain paragraphs say Sun enemy and War greater-than10+level in a single turn. Do not silently automate the conflicting summary. Recommended bounded choice: show exact named-domain clauses, mark trigger resolution manual; record discrepancy in rules questions if proposing automation. This is a real source inconsistency, not permission to infer a new trigger.
2. Prayer of Soldier's Skill has equipment-dependent benefits while equipment evidence may be absent from evaluator. This is an implementation boundary, not a rules ambiguity. Mark manual or represent the condition explicitly.
3. Bastion+ancestry save bonuses require correct stacking if automated; do not inherit a fixed threshold5 clamp without checking composition.
4. Conduit table's Censor links versus class-specific Intuition pages: use class-specific body and cite both; do not assume Presence.

This audit approves the inventory derivation only. Final action count depends on documented splitting of enhancement/recipient-use families; give every granted action a UI/shared route and persisted proof rather than satisfying an arbitrary aggregate count.
