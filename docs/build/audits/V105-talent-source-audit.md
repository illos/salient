# V105 Talent level-one independent source audit

ENGINE, 2026-09-21; source audit against project base `33d18be96da1132c945e2436e2a59dcfe6ce43ac`. No tests or implementation approval. Authority: pinned `vendor/steel-compendium` revision `fb83a789da8f0327a389c277a0c790b1648d5810`. Paths below are relative to `vendor/steel-compendium/en/unified/md/`. Read `class/talent.md`, all `feature/talent/level-1/*.md`, all23 `feature/ability/talent/level-1/*.md`. No external rules or evaluator-derived expectations.

## Creation and grants

`class/talent.md#Basics`: Reason2, Presence2; assign (2,-1,-1), (1,1,-1), (1,0,0) to Might/Agility/Intuition. Stamina18, eight Recoveries, later +6 per level (not starting bonus). Reason potency R-2/R-1/R, thresholds0/1/2 atR2; stays Reason for Presence-rolled attacks. Psionics and Read Person fixed; choose two from interpersonal/lore. No kit.

`talent-tradition.md`: choose Chronopathy, Telekinesis or Telepathy only; other listed psionic categories are ability categories, not additional selectable subclasses. `talent-abilities.md` allows cross-tradition ability choices.

`1st-level-tradition-features.md`: Chronopathy grants Accelerate and Again; Telekinesis Minor Telekinesis and Repel; Telepathy Feedback Loop and Remote Assistance. All gain Mind Spike (also a ranged free strike), Clarity and Strain, Psionic Augmentation, Talent Ward, Telepathic Speech. No tradition-specific skill grant is printed.

`telepathic-speech.md`: knows **Mindspeech language**; additionally communicates with creatures within **Mind Spike distance** if they share a language and know of each other, allowing reply. Do not replace this with universal language-independent mind reading. If distance augmentation is manual, derived communication range must not be misrepresented as always10.

| Pool | Select | Names |
|---|---|---|
| Signatures | Two distinct of8 | Entropic Bolt; Hoarfrost; Incinerate; Kinetic Grip; Kinetic Pulse; Materialize; Optic Blast; Spirit Sword |
| 3 Clarity | One of4 | Awe; Choke; Precognition; Smolder |
| 5 Clarity | One of4 | Flashback; Inertia Soak; Iron; Perfect Clarity |

**23 source envelopes** =16 choices + Mind Spike + six tradition grants. Complete build has seven source envelopes before common/ancestry/embedded actions. Higher-level Scan/Mind Projection/Cascading Strain etc are not level-one grants.

## Augmentations and wards

Choose one of **five** augmentations (Talent's list is broader than Null's): Battle, Density, Distance, Force, Speed. Cite each matching `feature/talent/level-1/<name>-augmentation.md`, not Null's similarly named source.

- Battle: light armor worn =>+3 Stamina; light weapon wielded =>Weapon damage+1 including free strikes; corresponding treasure permission; cannot take with a kit. Equipment conditional, not automatic on selection.
- Density: +6 Stamina,+1 stability; subsequent increases at4/7/10 not yet.
- Distance: ranged Psionic distance+2; not melee range or area dimensions.
- Force: damage-dealing Psionic **rolled** damage+1; not fixed/strain self-damage, Feedback Loop or movement damage.
- Speed: +1 speed and Disengage. Talent has **no Null Speed**; do not add Agility to speed/disengage.

Human baseline18 Stamina/recovery6/winded9/speed5/disengage1/stability0. Density24/8/12 plus stability1. Speed6/disengage2. Battle when armored21/7/10; absent equipment evidence leave conditional/manual. Eight Recoveries throughout.

Choose one of **four wards**, each under `feature/talent/level-1/`:

| Ward | Source effect |
|---|---|
| Entropy | Creature damaging caster loses R speed and cannot use triggered actions through **end of that creature's next turn** |
| Repulsive | Adjacent creature damages caster => optional free-trigger push up toR |
| Steel | **After** damage resolves, caster gains damage immunityR through end next turn; not mitigation of triggering damage |
| Vanishing | Taking damage makes caster invisible through end next turn |

Ward and augmentation can change by psionic meditation as respite activity (`psionic-augmentation.md`, `talent-ward.md`); Q-CHAR-5 kit-only exception does not permit bypassing ordinary edit approval. No permanent immunity/invisibility/speed debuff baseline from these reactive wards.

## Clarity and strain: mandatory distinct resource semantics

`feature/talent/level-1/clarity-and-strain.md`:

- Encounter start gain Victories; own-turn start1d3; first creature force moved each combat round +1; encounter end clears positive **or negative** balance.
- May spend below zero down to **-(1+Reason)**, thus **-3 atR2**. Example pool0 can pay3 to end-3; cannot pay5; pool2 can pay5 to end-3. A generic floor0 affordability rule is wrong. Negative pool input/payment/readback must be supported or explicitly scoped as manual, never silently clamp it to0.
- End each own turn take1 damage per negative point. This is not damage each time Clarity is spent and not a die roll.
- Strained if below0. Strain clauses apply when already strained **or becoming strained by this use**; pre-payment-only checks miss crossing zero. Effects can outlast recovery to nonnegative Clarity. A free signature while pool<0 can also have strain effects.
- Outside combat paid uses waive resource payment, but same ability/effect cannot repeat until Victory/respite. Any paid ability/effect within1 minute of another paid use deals1d6 damage and incurs the new ability's strain. For an ability with a strain effect, can voluntarily take1d6 and incur it even absent another cause. Do not infer no strain merely from waived cost or nonnegative pool. Unlimited spend budget=Victories.

If generation/turn damage/strain clauses remain manual, make that visible on shared actions and preserve cost floor and conditions faithfully. Do not claim full automation from just exposing paid abilities.

## Damage and cost tables

Each row cites corresponding kebab-case file under `feature/ability/talent/level-1/`. R=P=2 values, no augmentation. Force adds1 to direct rolled damage rows; no kit bonuses. All signature/base tradition actions/Mind Spike cost0.

| Ability | Cost; roll | Base tiers atR=P2 | Key remainder |
|---|---|---|---|
| Mind Spike | 0; R | 4/6/8 psychic | Strain extra2 target + unavoidable2 psychic self |
| Entropic Bolt | 0; P | 4/5/7 corruption | P<Reason threshold slowed save ends; extra1 corruption per additional targeting this encounter; strained tier2/3 gains1 Clarity |
| Hoarfrost | 0; R | 4/6/8 cold | M<threshold slowed EoT; strain replaces eligible slowed with restrained and slows actor through next-turn end |
| Incinerate | 0; R | 2/4/6 fire | 3 cube within10 enemies; no+R; lingering column fixed2 fire; strain increases cube by2 but ends fire at own-turn end |
| Kinetic Pulse | 0; R | 2/5/7 psychic | 1 burst enemies; no+R; push0/1/2; strained burst+2, self bleeding until next-turn start |
| Materialize | 0; R | 5/7/10 | Worthless1M wood/stone/metal object then adjacent empty square; strained adjacent creatures takeR plus unavoidable R self |
| Optic Blast | 0; R | 4/6/8 | M<threshold prone; reflective surface permits one extra target within3 of first; strain immediate1 surge plus unavoidable R self |
| Spirit Sword | 0; P | 5/8/11 | Melee2, gain1 surge; strain extra3 target plus unavoidable3 self |
| Awe | 3; P **enemy only** | 5/8/11 psychic | Enemy I<threshold frightened save ends; ally branch is **no attack**, temp Stamina3P=6 and ends one save-ends/EoT effect |
| Choke | 3; R | 5/7/10 | M<threshold slowed/slowed/restrained save ends; optional vertical pull2 ignores stability only if restrained **by this ability** |
| Smolder | 3; R | 5/8/11 chosen type | Choose acid/corruption/fire for damage AND weakness; target R<threshold weakness5/5/(5+R=7) save ends; **damage before imposing weakness** |

Kinetic Grip signature uses R roll and slide2+R/4+R/6+R =4/6/8, tier3 prone; **no direct damage**. Strained **must vertical push instead** of slide. Fixed damage from collision requires separate actual movement resolution.

Precognition3, main, Melee2 Self/ally, no damage roll: incoming ability-roll bane through caster next-turn start; whenever target takes damage while active, can use **triggered action** (not free) for free strike at source.

All four5-cost choices are **maneuvers**, no direct attack roll:

- Flashback: Self/ally ranged10 uses ability with base resource cost<=7 **already used this round**; waives base only, optional augmentations still paid. Do not call ordinary paid parent unchanged and debit again. Strain1d6 self+slowed save ends.
- Inertia Soak: Self/ally ranged10 ignores difficult terrain and forced-movement damage until caster next-turn start; entering each square can push one adjacent creatureR; may ignore allied stability; each creature moved this way once a turn. Strain self weakened save ends; while weakened **this way**, incoming forced distance+5.
- Iron: Self/ally ranged10 stability+R,10 temporary Stamina,2surges; stability lasts while temp Stamina **from this ability** remains. Strain actor cannot maneuver save ends.
- Perfect Clarity: Self/ally ranged10 speed+3 through caster next-turn start, double edge on next power roll; if that roll tier3 **caster** gains1 Clarity. Strain1d6 self and no triggered actions save ends.

No named core condition represents all of Iron's/no-trigger/no-maneuver effects; preserve complete custom strain text. Most source envelopes have strain/other dependent sections and should not be promoted into bounded compiled conditions merely from a matching tier clause.

## Tradition actions and paid embedded options

| Action | Printed behavior |
|---|---|
| Accelerate | Maneuver ranged10 Self/one creature shiftsR. Spend2 Clarity: target may use a maneuver. |
| Again | Triggered ranged10 Self/creature made ability roll; may use after seeing result; **must reroll and use new roll**, not pick better. |
| Minor Telekinesis | Maneuver ranged10 Self or one size1 creature/object slidesR. Spend2 per +1 allowable target size (unlimited); separately spend3 for vertical slide. Both options can be represented with separately stated costs/prerequisites. |
| Repel | Triggered ranged10 Self/ally taking damage or forced movement: halve damage OR reduce forced distanceR, choose if both. If reduced to0, target can push sourceR. |
| Feedback Loop | Triggered ranged10 creature damages ally: source takes psychic damage equal half triggering damage. Fixed/reactive, no Force bonus. |
| Remote Assistance | Maneuver ranged10 creature/object as **target of next allied attack**, not the ally receiving a buff. Next allied ability roll against it before caster next-turn start has edge. Spend1 adds one target. |

Four optional paid option types: Accelerate2, Minor TK larger target2/unit, Minor TK vertical3, Remote Assistance1. Optional costs may themselves cross zero and create strain. No repeated parent base cost for embedded spend actions.

Also expose source-linked manual follow-ups for ward triggers; Repel return push; Precognition free strike; Optic Blast reflection; Materialize object/strain explosion; Incinerate area trigger; Entropic repeat damage/strained resource; Spirit Sword surge; each strained effect and corresponding self drawback. A descriptive feature label alone is not proof of a callable granted action. If resolving manually, record actor/recipient/context and retain source text rather than fake automated consequences.

## Safety of interpretation and proof requirements

Awe is the key branch hazard: generic header One creature plus printed roll does **not** authorize damaging an ally. Use explicit ally/enemy modes or a fully manual guard until allegiance branch is supported. Smolder cannot silently deal untyped damage; require the permitted type choice or keep whole action manual. Flashback and Again are changes to another ability's execution, not new ordinary attacks; avoid invented repeated payment/dice rules.

Strain readiness must consider pre/post payment and outside-combat rules. Retain unreduceable self damage where explicitly printed (Mind Spike/Materialize/Optic Blast/Spirit Sword). Do not add immunity/weakness adjustments to those self effects. Other strain1d6 damage is not labelled unreduceable in source; do not extend that qualifier.

Proof cohort should cover all three traditions, five augmentations, four wards, eight signatures and eight heroic choices; at least five builds if proving every augmentation directly. Source-independent R/P damage tables and targets test fixed Reason potency despite Presence roll. Assert no kit, Mindspeech and shared-language/range boundary, skill pools, edit pruning/admitted isolation, correct modifier exclusions. Show below-zero spending at floor and refusal below floor, zero-crossing strain/manual boundary, turn-end negative damage boundary and outside-combat strain explicitly. All newly exposed grants/actions require UI/API visibility and persisted readback. Ordinary damage tests alone do not prove strain, bonus effects, ward timing or reactive damage.

No source ambiguity blocks inventory or numeric baseline. Product automation boundaries for negative resources and strain must be decided explicitly within the slice; they cannot be omitted under a generic zero-floor resource adapter. No tests were run in this audit.
