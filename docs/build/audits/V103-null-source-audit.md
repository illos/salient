# V103 Null level-one independent source audit

ENGINE, 2026-09-21. Source-only audit for starting main `0919e704259a14d6ea3c911f3c356ff25c3b87b9`; no implementation approval or tests run.

Authority: `vendor/steel-compendium` pin `fb83a789da8f0327a389c277a0c790b1648d5810`. All abbreviated paths below are relative to `vendor/steel-compendium/en/unified/md/`. Read `class/null.md`, all fifteen `feature/null/level-1/*.md`, all eighteen `feature/ability/null/level-1/*.md`, `rule/damage/rolled-damage.md`, and `chapter/kits.md`. Clean Heroes `vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md`, Null / 1st-Level Features (around lines10311–10750), corroborates choices/cost headings. Expectations below are source-derived, not runtime output.

## Creation inventory

`class/null.md#Basics`: fixed Agility2 and Intuition2. Assign one array (2,-1,-1), (1,1,-1), (1,0,0) to Might/Reason/Presence. Stamina21 at level1; later-level increase9 is not a starting bonus. Eight Recoveries. Potency uses **Intuition**, not the roll characteristic: weak I-2, average I-1, strong I; at I2 thresholds0/1/2. Printed inequalities are strict; equality resists.

Gain Psionics; choose two skills from the union of interpersonal and lore, plus one tradition skill from its own pool. `null-tradition.md`: Chronokinetic chooses lore; Cryokinetic crafting; Metakinetic exploration. These are choices, not fixed Monsters/other quick-build suggestions.

Level-one features: Null Tradition, Discipline, Null Field, Inertial Shield, Discipline Mastery, Null Speed, Psionic Augmentation, Psionic Martial Arts, Null Abilities; selected tradition adds its named Mastery, selected augmentation its named feature. All traditions receive Null Field and Inertial Shield. They do not each grant a different standalone signature at level1; tradition features provide conditional uses below.

Null has **no kit grant** (`class/null.md` advancement and `chapter/kits.md` introduction). Do not expose ordinary or Stormwight kit selection or kit signature/bonuses just because abilities have Weapon. Null's unarmed presentation does not remove their printed Weapon keywords.

`feature/null/level-1/null-abilities.md` and clean Heroes choice groups:

| Pool | Count chosen | Options |
|---|---|---|
| Signature | **Two distinct** | Dance of Blows; Faster Than the Eye; Inertial Step; Joint Lock; Kinetic Strike; Magnetic Strike; Phase Inversion Strike; Pressure Points |
| 3 Discipline | One | Chronal Spike; Psychic Pulse; Relentless Nemesis; Stunning Blow |
| 5 Discipline | One | A Squad Unto Myself; Arcane Disruptor; Impart Force; Phase Strike |

Thus **18 source ability envelopes**: eight signatures + four3 + four5 + two universal abilities. A complete hero receives six envelopes before common/ancestry/embedded actions. Do not grant second-level tradition abilities, Psionic Leap/Reorder, enhanced field or higher-level mastery benefits at level1.

## Augmentations and permanent statistics

`psionic-augmentation.md`: choose **one** augmentation; can change via psionic meditation as a respite activity. A draft-edit route must not imply unrestricted in-play swapping of admitted bonuses.

| Source under feature/null/level-1 | Level-one benefit |
|---|---|
| density-augmentation.md | +6 Stamina, +1 stability; future +6 increments at4/7/10 not yet granted |
| force-augmentation.md | +1 **rolled damage** for damage-dealing **psionic** abilities |
| speed-augmentation.md | +1 speed and +1 Disengage distance |
| null-speed.md (all Nulls) | +Agility to speed and Disengage distance |

Human A2 baseline speed5/disengage1 yields: Density Stamina27, recovery9, winded13, speed7, disengage3, stability1; Force Stamina21, recovery7, winded10, speed7, disengage3, stability0; Speed Stamina21, recovery7, winded10, speed8, disengage4, stability0. Eight Recoveries in each. These arithmetic witnesses assume Human and no other modifiers; ancestry effects must be separately sourced.

Force is not a global damage bonus and not limited to strikes or single-target abilities: Dance of Blows and A Squad Unto Myself qualify despite lacking Strike/Melee. Psychic Pulse's fixed damage, Faster Than the Eye's extra A damage, Arcane Disruptor's later Malice punishment and collision damage are not automatically +1. `rule/damage/rolled-damage.md` excludes damage dealt without a power roll. Common weapon free strikes do not acquire Psionic merely because a Null uses them. Do not add a characteristic to damage unless printed.

## Damage/cost oracle

Each row cites its corresponding kebab-case filename under `feature/ability/null/level-1/`. All listed rolled attacks use Agility except Impart Force, which uses Intuition. Values are per target, tiers1/2/3; default A=I=2, no kit. All signatures cost0; universal Null Field and Inertial Shield cost0.

| Ability | Cost | Printed damage | At A2 | With Force |
|---|---|---|---|---|
| Dance of Blows | 0 | 3/4/5 | 3/4/5 | 4/5/6 |
| Faster Than the Eye | 0 | 4/5/7 | 4/5/7 | 5/6/8 |
| Inertial Step | 0 | 5+A / 7+A / 10+A | 7/9/12 | 8/10/13 |
| Joint Lock | 0 | 4+A / 7+A / 9+A | 6/9/11 | 7/10/12 |
| Kinetic Strike | 0 | 4+A / 5+A / 6+A | 6/7/8 | 7/8/9 |
| Magnetic Strike | 0 | 5+A / 8+A / 11+A psychic | 7/10/13 | 8/11/14 |
| Phase Inversion Strike | 0 | 4+A / 6+A / 8+A | 6/8/10 | 7/9/11 |
| Pressure Points | 0 | 4+A / 7+A / 9+A | 6/9/11 | 7/10/12 |
| Chronal Spike | 3 | 7+A / 10+A / 13+A | 9/12/15 | 10/13/16 |
| Relentless Nemesis | 3 | 6+A / 8+A / 12+A | 8/10/14 | 9/11/15 |
| Stunning Blow | 3 | 4+A / 5+A / 7+A | 6/7/9 | 7/8/10 |
| A Squad Unto Myself | 5 | 6/9/13 | 6/9/13 | 7/10/14 |
| Arcane Disruptor | 5 | 8+A / 12+A / 16+A psychic | 10/14/18 | 11/15/19 |
| Phase Strike | 5 | 3+A / 4+A / 6+A psychic | 5/6/8 | 6/7/9 |

Psychic Pulse costs3, maneuver, 2 burst each enemy; **no roll**: immediate2I psychic (4 atI2); field size+1 until start of next turn; at end of current turn each enemy then in field takes I psychic (2 atI2). Two different timings/recipient sets, not6 damage to the initial set. Force does not boost these fixed values.

Impart Force costs5, maneuver, Melee1 one creature/object: I roll, push3/5/7. Printed Effect grants an edge, limits object to own size or smaller, and deals1 psychic per square actually pushed. These are not printed damage tiers3/5/7: stability/obstruction/actual movement can alter displacement. Keep dependent damage explicit/manual without spatial proof. Do not assume a +1 Force effect on movement-derived damage without resolving whether it is rolled damage under the cited general rule; ordinary flat damage automation is not justified by the tier text.

## Source remainders and optional follow-ups

| Parent | Required explicit boundary / callable follow-up |
|---|---|
| Dance of Blows | 1 burst enemies; optional slide of **one adjacent enemy** up to I, independent of per-target damage |
| Faster Than the Eye | Two creatures/objects; optional extra A damage to one adjacent creature/object, not A added to each rolled tier |
| Inertial Step | Optional shift up to half speed before **or** after strike |
| Joint Lock | Target **A** below I-derived threshold => grabbed; no save-ends phrase, do not invent a save clock |
| Kinetic Strike | Taunted EoT all tiers; slide0/1/2; compound tier remainder, not generic save-ends |
| Magnetic Strike | Melee2; **vertical pull**1/2/3; psychic damage already typed |
| Phase Inversion Strike | Before push2/4/6, teleport target opposite its original square, adjacent to caster; **if teleport impossible, no push** |
| Pressure Points | Target **A** below I-derived threshold => weakened save ends; source allows creature/object but engine object support must remain bounded |
| Chronal Spike | Half-speed shift before/after; whenever an effect permits free strike or signature, may substitute Chronal Spike **paying its usual3** |
| Relentless Nemesis | Until start of next turn, whenever target finishes moving/being force moved, free-trigger shift up to speed **ending adjacent** |
| Stunning Blow | Target **I** below I-derived threshold => **dazed and slowed** save ends; do not compile only one half |
| A Squad Unto Myself | 2 burst enemies; free-maneuver Disengage before or after use |
| Arcane Disruptor | Target **M** below I-derived threshold => weakened save ends; while weakened **this way**, supernatural ability costing Malice triggers I damage |
| Phase Strike | Target **I** below threshold goes **out of phase** save ends: slowed, stability-2, ability-roll maximum tier2; composite state, not merely slowed |

Optional follow-ups with no printed resource cost must not charge a second parent cost. Chronal Spike's substitution is the exception expressly charging normal3; a proxy that records only permission must not debit3 and then charge again when the actual attack is invoked. Clearly choose and document the shared route's semantics. Remainder text is not evidence of a follow-up's persisted resolution.

Pressure Points is the simple single-target core save-ends shape. Arcane Disruptor has a dependent ongoing punishment and must retain it; compiler admission follows actual structural grammar, not a name allowlist. Joint Lock, Stunning Blow and Phase Strike are outside that bounded core condition shape. Phase Inversion Strike must not present its push as unconditional merely because tiers contain a familiar push clause.

## Null Field and Inertial Shield

`feature/ability/null/level-1/null-field.md`: maneuver, 1 aura, each enemy; those enemies' **outgoing potencies reduced1**, not scores reduced1. Field persists **after encounter end** and ends only if caster is dying or willingly ends it (no action). Generic combat cleanup must not silently terminate it if a future implementation automates field state.

Once as a **free maneuver on each own turn**, spend1 Discipline for **one** added effect through start of next turn. These are three distinct choices, not cumulative simultaneous toggles paid once:

- Gravitic Disruption: first damage to a target on a turn permits slide up to2.
- Inertial Anchor: target starting its turn inside cannot shift.
- Synaptic Break: caster/allies' potency effects used against targets in field gain1 potency.

Expose three option uses plus voluntary end if field actions are supported. Area membership, own-turn use limit, first-damage tracking, expiration and potency adjustments stay explicit/manual unless separately implemented/proven. Null Field is not blanket suppression of enemy magic, damage, psionics or a bonus to all ally characteristic scores.

`inertial-shield.md`: Self triggered by taking damage; half that damage. **Spend1 Discipline** additionally reduces potency of **one** associated effect by1 **for caster**. Base shield costs0. Do not retroactively refund unrelated damage or reduce all effects by1. Tradition follow-up exists even below Discipline2 (see next section). An explicit manual shield record must not be presented as automatic mitigation of the triggering attack.

Therefore four paid optional effects at level1: three Null Field modes at1 each and Shield potency reduction at1. No level-one unlimited-discipline optional spend is printed.

## Tradition actions and resource thresholds

`discipline-mastery.md`: threshold benefits are cumulative except replacement; attained benefits last until **end of own turn**, even after spending below threshold. Level1 permits thresholds2/4/6 only;8 requires4th,10 requires7th,12 requires10th. Do not grant later rows merely on funding the pool.

| Tradition source | Unconditional Shield follow-up | At2 Discipline | At4 Discipline | At6 Discipline |
|---|---|---|---|---|
| chronokinetic-mastery.md | Disengage as free triggered action when Shield used | With Knockback, free-trigger Disengage before/after maneuver | First time **on a turn** willingly moves >=1 square as part of ability: +1 surge | Edge on Grab and Knockback |
| cryokinetic-mastery.md | After Shield, Grab as free triggered action | Knockback one extra creature; may convert **untyped psionic** damage to cold | First time **on a turn** grabs creature **or** enemy moves >=1 in Null Field: +1 surge | Edge on Grab and Knockback |
| metakinetic-mastery.md | After Shield, Knockback as free triggered action | Knockback forced distance +I | First time **in a combat round** takes damage or is force moved, even resisted: +1 surge | Edge on Grab and Knockback |

All printed conditional actions/optional conversions need source-linked availability instructions and shared UI/API access. Threshold2 is not required for the initial Shield follow-up. Cryokinetic conversion is optional and cannot replace already psychic damage; Metakinetic+I at2 affects **Knockback**, not every forced movement. Do not confuse Cryo/Chrono per-turn limits with Meta per-round. Surge grants are not starting baseline surges.

`psionic-martial-arts.md`: Grab and Knockback use **Intuition instead of Might**, both for roll and larger-target size qualification. Knockback may slide instead of push. This is not a general switch of all melee attacks/free strikes to Intuition. If primitive common actions remain manual, explicitly preserve the alternate characteristic/size basis and slide option in their accessible action description; never quietly execute an incorrect Might rule.

## Discipline and proof boundaries

`discipline.md`: encounter start gain Victories; each own-turn start +2. First enemy main action in Null Field per combat round +1; first Director Malice-cost ability per combat round +1. These are separately qualified triggers. End encounter lose all remaining Discipline (field itself remains). Resource generation/event detection is manual unless implemented independently.

Outside combat paid heroic abilities/effects waive cost but same ability/effect cannot repeat until earning >=1 Victory or respite. Unlimited spend would use Victories budget, but no core level-one Null option uses that rule. Existing project warning-only enforcement must be labelled if reused.

Suggested source-ledger proof matrix: four builds can cover eight distinct signatures plus all four3/four5 choices; span all three traditions, all three augmentations and arrays. Assert no kit grant, correct skill pools and pruning on tradition/augmentation/class edits. Include Force positive checks for both area and strike rolls and negative non-Psionic/fixed-damage checks; verify no automatic +A on Dance/Faster/Squad. Invoke both targets of Faster Than the Eye with persisted readbacks. Pressure Points applied/resisted must use source-derived target Agility versus **caster Intuition** potency, including strict equality on every tier. Do not use caster Agility merely because signatures roll it.

Manual proof should record each granted follow-up and check its actor/recipient, source, optional cost and unchanged unrelated live state. Specifically retain Phase Inversion teleport prerequisite, Psychic Pulse two timings, Impart Force actual-distance dependency, Shield/mastery trigger eligibility and field ending rule. No browser or test execution is part of this audit.

No source uncertainty blocks the inventory, base arithmetic, costs or grants. Impart Force/Force interaction should remain manual if implemented semantics would require a ruling about movement-derived rolled damage; do not guess or expand automation to decide it. Final implementation review follows the frozen candidate and independent ledger.
