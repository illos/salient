# V48: Elementalist level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Class implementer (Opus thread `88b6a7e6-2590-4c52-bdef-efe85bf82e74`) |
| Rules review | Required for the implementation commit; this preparation makes no certified rules claims |
| Depends on | V45 foundation (merged `ebe66e2`); V46 Devil pilot verdict gates implementation |
| Unblocks | Elementalist level-two work; Dwarf/Polder ancestry contrast builds |
| Status | Preparation in progress; see `STATUS.md` |

## Goal

Deliver every level-one Elementalist option — all four elemental specializations, all five
enchantments, all four wards and the ward's nested damage-type choice, all eight signature
abilities, both heroic ability pools and the full crafting/lore skill choice — as one reviewed
implementation commit, with same-build Forge Steel counterparts and independently source-derived
expectations. The boundary: no level-two Elementalist support, no combat automation of essence,
persistent magic or triggered actions, and no change to existing Fury/Devil/Polder behavior.

**This document is preparation only.** No option is enabled by it, no reference has been captured,
and no verification gate has been met. Implementation waits for the V46 pilot verdict per the
[V44 execution update](V44-character-option-delivery.md#current-execution-opus-pilot-then-every-level-one-unit).

## Source boundary

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Reference structure: Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.
Neither pin was changed and no vendor file was modified. Research used local files only; no
online Draw Steel content was consulted.

The unified `feature/elementalist/level-1/enchantment.md`, `elementalist-ward.md` and
`elementalist-abilities.md` entries carry the "choose one of the following" wording but not the
option lists, which the extraction moved into standalone entries. The authoritative level-one
option lists and their source order were confirmed against the book-specific text:

```
git -C vendor/steel-compendium show 'HEAD:en/books/heroes/clean/Draw Steel Heroes.md'
```

Elementalist occupies lines 7431–8840 of that file; its 1st-Level Features run to the start of
2nd-Level Features. Every option list below was read from that section and cross-checked against
the unified entries.

| Purpose | Exact repository source |
| --- | --- |
| Class basics, advancement table | [Elementalist](../../vendor/steel-compendium/en/unified/md/class/elementalist.md) |
| Subclass choice and the four acolyte benefits | [Elemental Specialization](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/elemental-specialization.md) |
| Per-specialization level-one feature table | [1st-Level Specialization Feature](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/1st-level-specialization-feature.md) |
| Per-specialization triggered action table | [Specialization Triggered Action](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/specialization-triggered-action.md) |
| Enchantment choice | [Enchantment](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment.md) |
| Ward choice | [Elementalist Ward](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/elementalist-ward.md) |
| Signature and heroic ability choices | [Elementalist Abilities](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/elementalist-abilities.md) |
| Class skill pools | [Crafting](../../vendor/steel-compendium/en/unified/md/skill/group/crafting.md), [Lore](../../vendor/steel-compendium/en/unified/md/skill/group/lore.md) |
| Immunity stacking | [Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md) |
| Duplicate-skill replacement | [Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md) |
| Forge choices and serialization | [Elementalist](../../vendor/forge-steel/src/data/classes/elementalist/elementalist.ts), [earth](../../vendor/forge-steel/src/data/classes/elementalist/earth.ts), [fire](../../vendor/forge-steel/src/data/classes/elementalist/fire.ts), [green](../../vendor/forge-steel/src/data/classes/elementalist/green.ts), [void](../../vendor/forge-steel/src/data/classes/elementalist/void.ts) |

Throughout, `feature/elementalist/level-1/<slug>.md` is the feature wrapper (it carries a
`subclass:` frontmatter key) and `feature/ability/elementalist/level-1/<slug>.md` is the ability
stat block. Motivate Earth and Return to Formlessness exist at both paths; the specialization
table links the ability path. The existing module already follows this split and must keep it.

## Current supported state

`shared/content/classes/elementalist/level-one.ts` is the existing V25 content, extracted
unchanged by V45. It is a single-path Fire build, not partial coverage of each family:

| Decision | Source options | Currently enabled | Newly supported by V48 |
| --- | ---: | ---: | ---: |
| `class.elementalist.characteristic-array` | 4 | 4 | 0 |
| `class.elementalist.skills` (choose 3) | 22 | 3 | 19 |
| `class.elementalist.specialization` | 4 | 1 (Fire) | 3 |
| `class.elementalist.enchantment` | 5 | 1 (Destruction) | 4 |
| `class.elementalist.ward` | 4 | 1 (Delightful Consequences) | 3 |
| Ward of Excellent Protection damage type (nested, new) | 7 | 0 | 7 |
| `class.elementalist.signature-abilities` (choose 2) | 8 | 2 | 6 |
| `class.elementalist.ability-3` | 4 | 1 | 3 |
| `class.elementalist.ability-5` | 4 | 1 | 3 |

The class's `features` row also omits two named level-one features that the advancement table
lists: **1st-Level Specialization Feature** and **Specialization Triggered Action**. The current
Fire option grants their Fire contents directly, so no Fire value is wrong, but the two container
features are missing from the readable feature list and must be added.

`shared/evaluate/classes/elementalist.ts` currently produces exactly two rolled-damage ability
modifiers (Enchantment of Destruction, Acolyte of Fire). Everything else below is new.

## Complete level-one inventory

### Automatic grants (no choice)

| Grant | Source | Classification |
| --- | --- | --- |
| Magic skill | [class](../../vendor/steel-compendium/en/unified/md/class/elementalist.md) | Permanent build; already implemented |
| Starting Stamina 18, Recoveries 8, Reason 2, potency Reason/−1/−2 | same | Permanent build; already implemented |
| Essence heroic resource | [Essence](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/essence.md) | Readable feature. In-combat gain, the 10-square damage trigger and end-of-encounter loss stay manual gameplay |
| Hurl Element ability | [Hurl Element](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/hurl-element.md) | Readable ability; the per-use damage-type choice is in-play, not a build choice |
| Persistent Magic | [Persistent Magic](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/persistent-magic.md) | Readable feature; essence reduction and the 5 × Reason drop threshold stay manual |
| Practical Magic ability | [Practical Magic](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/practical-magic.md) | Readable ability; its three effects are in-play choices |
| Elemental Specialization, Enchantment, Elementalist Ward, Elementalist Abilities | class table | Container features; already granted |
| **1st-Level Specialization Feature**, **Specialization Triggered Action** | class table | Container features; **currently missing, add** |

### Elemental specialization — 4 options

Each specialization grants an acolyte benefit, a 1st-level feature and a triggered action. Void
grants four items because A Beyonding of Vision carries its own ability.

| Specialization | Acolyte benefit | Build effect | 1st-level feature | Triggered action |
| --- | --- | --- | --- | --- |
| **Earth** | [Acolyte of Earth](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/earth-acolyte-of-earth.md): Earth+Magic abilities raise stability by 1 until the start of your next turn, cumulative | **Manual.** A conditional, cumulative, expiring in-play modifier, not a baseline stability bonus | [Motivate Earth](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/motivate-earth.md) ability | [Skin Like Castle Walls](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/skin-like-castle-walls.md) |
| **Fire** | [Acolyte of Fire](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/fire-acolyte-of-fire.md): +1 rolled damage on Fire+Magic abilities, and on Hurl Element when dealing fire damage | **Permanent ability modifier.** Already implemented, including the Hurl Element alternative | [Return to Formlessness](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/return-to-formlessness.md) ability | [Explosive Assistance](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/explosive-assistance.md) |
| **Green** | [Acolyte of the Green](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/green-acolyte-of-the-green.md): damaging with a Green+Magic ability that costs essence gives you or a creature within 10 temporary Stamina equal to Reason | **Manual.** Triggered, targeted temporary Stamina; never a baseline Stamina increase | [It Is the Soul Which Hears](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/it-is-the-soul-which-hears.md) feature | [Breath of Dawn Remembered](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/breath-of-dawn-remembered.md) |
| **Void** | [Acolyte of the Mystery](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/void-acolyte-of-the-mystery.md): +2 squares distance on Magic+Ranged+Void abilities | **Permanent ability modifier — not currently representable.** See [contract gaps](#shared-contract-and-evaluator-gaps) | [A Beyonding of Vision](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/a-beyonding-of-vision.md) feature **plus** [Shared Void Sense](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/shared-void-sense.md) ability | [Subtle Relocation](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/subtle-relocation.md) |

### Enchantment — 5 options

| Enchantment | Source-backed effect | Build requirement and manual boundary |
| --- | --- | --- |
| [Battle](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment-of-battle.md) | Wear light armor and wield light weapons without a kit. **While you wear light armor,** +3 Stamina, increasing by 3 at 4th/7th/10th. **While you wield a light weapon,** +1 damage with weapon abilities including free strikes. Can use light armor and light weapon treasures. Cannot be taken if you have a kit | Both numeric bonuses are **conditional** in the source. Record them as conditional contributions with their condition text, not as unconditional baseline values. See [finding D](#d-enchantment-of-battle-is-conditional-in-the-source-and-unconditional-in-forge) |
| [Celerity](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment-of-celerity.md) | +1 speed and +1 to Disengage shift distance | **Permanent build.** Adds to `speed` and `disengage` after the no-kit baseline and after Polder's disengage contribution |
| [Destruction](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment-of-destruction.md) | +1 rolled damage with magic abilities | **Permanent ability modifier.** Already implemented |
| [Distance](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment-of-distance.md) | +2 to the distance of ranged magic abilities | **Permanent ability modifier — not currently representable.** See [contract gaps](#shared-contract-and-evaluator-gaps) |
| [Permanence](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/enchantment-of-permanence.md) | +6 Stamina, increasing by 6 at 4th/7th/10th, and +1 stability | **Permanent build**, unconditional. At level one: +6 Stamina, +1 stability. Recovery value and winded value must be recomputed from the increased Stamina |

The source's "increases by 3/6 at 4th, 7th, and 10th levels" is echelon scaling; Forge encodes it
as `valuePerEchelon`. At level one both reduce to the printed base value. Later-level scaling
belongs to the Elementalist level-two-and-above units, not here.

Enchantment and ward are both `selectAt: 'respite'` in Forge, matching the source's "change your
enchantment and ward by performing a complex ritual as a respite activity." Respite reselection is
**out of scope** for this unit; the wizard choice is the build-time selection.

### Elementalist ward — 4 options, one with a nested choice

| Ward | Source-backed effect | Build requirement and manual boundary |
| --- | --- | --- |
| [Delightful Consequences](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/ward-of-delightful-consequences.md) | First time each round you take damage, gain 1 surge | **Manual.** A per-round in-play resource gain. Already implemented as a readable feature |
| [Excellent Protection](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/ward-of-excellent-protection.md) | Immunity to acid, cold, corruption, fire, lightning, poison, **or** sonic damage equal to your Reason score | **Nested choice of exactly one damage type**, then a permanent `damageImmunities` entry valued at the Reason score. Forge confirms the reading with seven mutually exclusive sub-options (`elementalist-1-8ba`…`bg`) |
| [Nature's Affection](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/ward-of-natures-affection.md) | When a creature within Reason squares damages you, a free triggered action slides it up to Reason squares | **Readable ability grant** (Forge models it as an ability). Slide resolution is manual |
| [Surprising Reactivity](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/ward-of-surprising-reactivity.md) | When an adjacent creature damages you, a free triggered action pushes it up to twice Reason squares | **Readable ability grant.** Push resolution is manual |

The "or" in Ward of Excellent Protection is a selection, not simultaneous immunity to all seven.
This is an **interpretation** grounded in the source's singular "immunity … equal to your Reason
score" plus Forge's seven-way choice encoding; the alternative reading (immunity to all seven
types at once) would make it strictly better than every other ward and is not supported by the
Forge structure. Recorded here as an interpretation for the rules reviewer to confirm, with both
alternatives stated. It does not require a user ruling unless the reviewer disagrees.

### Signature abilities — choose 2 of 8

All eight are readable ability grants; every power roll, damage number and rider is manual
gameplay. None carries a build-time nested choice.

| Ability | Keywords | Notes |
| --- | --- | --- |
| [Afflict a Bountiful Decay](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/afflict-a-bountiful-decay.md) | Green, Magic, Ranged, Rot, Strike | In-play choice of self or ally |
| [Bifurcated Incineration](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/bifurcated-incineration.md) | Fire, Magic, Ranged, Strike | Already enabled. Gains Acolyte of Fire and Enchantment of Destruction bonuses |
| [Grasp of Beyond](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/grasp-of-beyond.md) | Magic, Melee, Strike, Void | Teleport up to Reason squares |
| [The Green Within, the Green Without](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/the-green-within-the-green-without.md) | Green, Magic, Ranged, Strike | |
| [Meteoric Introduction](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/meteoric-introduction.md) | Earth, Magic, Melee, Strike | Forge names it "A Meteoric Introduction"; see [finding G](#g-forge-naming-differences) |
| [Ray of Agonizing Self-Reflection](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md) | Magic, Ranged, Strike, Void | Carries potency-gated slowed riders |
| [Unquiet Ground](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/unquiet-ground.md) | Area, Earth, Magic, Ranged | 2 cube within 10; no Strike keyword |
| [Viscous Fire](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/viscous-fire.md) | Fire, Magic, Ranged, Strike | Already enabled |

### 3-essence ability — choose 1 of 4

[Behold the Mystery](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/behold-the-mystery.md) (Persistent 1),
[The Flesh, a Crucible](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/the-flesh-a-crucible.md) (Persistent 1, already enabled),
[Invigorating Growth](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/invigorating-growth.md),
[Ripples in the Earth](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/ripples-in-the-earth.md).

### 5-essence ability — choose 1 of 4

[Conflagration](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/conflagration.md) (Persistent 2, already enabled),
[Instantaneous Excavation](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/instantaneous-excavation.md) (Persistent 1),
[No More Than a Breeze](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/no-more-than-a-breeze.md) (Persistent 1),
[Test of Rain](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/test-of-rain.md).

Both pools carry a fixed essence cost that the existing `costQuote` mechanism already records.
Persistent values are readable source text; maintenance and the essence-income reduction are
manual gameplay in this unit.

### Class skills — choose 3 from crafting or lore

Twenty-two eligible skills: the ten crafting skills (Alchemy, Architecture, Blacksmithing,
Carpentry, Cooking, Fletching, Forgery, Jewelry, Mechanics, Tailoring) and the twelve lore skills
(Criminal Underworld, Culture, History, Magic, Monsters, Nature, Psionics, Religion, Rumors,
Society, Strategy, Timescape). The existing row already draws from both pools and must keep doing
so; only the `supportedInV001` list widens from three names to the full pool.

Magic is in the lore group **and** is granted automatically by the class. Whether Forge filters
the already-granted Magic out of the choose-three list is an observation to make during capture,
not an assumption; record what the real editor does. Witness builds avoid selecting Magic so every
chosen skill is an effective grant.

`class.elementalist.magic-replacement` must be preserved exactly as it is. V45's
`extendSkillReplacements` strips every `replacesDuplicateSkill` row and regenerates them for all
fixed skills, reusing this decision's id so saved revisions stay stable. Its hardcoded
"Mage's Apprentice" label and career source are overwritten by that pass; removing or renaming the
row would break existing saved builds.

## Shared contract and evaluator gaps

These require the integration owner. Each is a genuine blocker for a specific option; none can be
worked around inside the owned module without changing shared behavior.

### A. `AbilityModifier.field` admits only `'rolled-damage'`

`shared/contracts/characterEvaluation.ts:194` types the field as the single literal
`'rolled-damage'`. **Enchantment of Distance** (+2 ranged magic distance) and **Void: Acolyte of
the Mystery** (+2 Magic/Ranged/Void distance) are permanent distance contributions with no
representation. Forge models them with a distinct `createAbilityDistance` factory, confirming they
are a different kind of contribution rather than a damage bonus.

Request: extend the field union with a distance value and define whether the amount applies to
melee distance, ranged distance or both. Kit contributions already distinguish
`meleeDistanceBonus` from `rangedDistanceBonus`; the new modifier must not silently diverge from
that split. Inserting a distance bonus into `rolled-damage` would be incorrect.

### B. `damageImmunities` is assigned, not merged

`shared/evaluate/ancestries/polder.ts:51` sets `out.damageImmunities = [...]` for Polder's
Corruption Immunity. `applyElementalistModifiers` runs later in `deriveProfiles`
(`shared/evaluate/character.ts:1225`, after `applyPolderBaseline` at 1193). A Ward of Excellent
Protection entry written the same way would **silently discard the Polder ancestry immunity** on
exactly the Polder Elementalist build that is our existing reference.

The source resolves the gameplay question: "If multiple damage immunities apply to a source of
damage, only the immunity with the highest value applies"
([Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md)).
Both grants are therefore legitimately retained in the build with their own provenance, and the
highest applies at play time. Request a shared append/merge helper for `damageImmunities` and
`damageWeaknesses`, plus a presentation decision for two entries of the same damage type. A
contrasting test — Polder Corruption Immunity plus Ward of Excellent Protection (corruption) —
belongs in this unit regardless of who writes the helper.

### C. Class-feature contributions to Stamina, speed, stability and disengage

`shared/evaluate/classes/profile.ts:79` **sets** `staminaMaximum` to the profile's
`startingStamina` for a `kit: 'none'` class, and derives `recoveryValue` and `windedValue` from it
immediately afterwards. Enchantment of Permanence (+6 Stamina, +1 stability) and Enchantment of
Battle (conditional +3 Stamina) must add **after** that assignment, and the two derived values
must be recomputed from the final Stamina, not from 18.

Similarly, `character.ts:1196` sets `out.disengage = dv(1, …)` in the no-kit branch and
`applyPolderDisengage` adds to it afterwards. Enchantment of Celerity's +1 speed and +1 disengage
need an equivalent, ordered contribution point.

Request: a defined phase for class-feature vital contributions that runs after the class profile
and after ancestry baselines, with the dependent recoveries/winded recomputation handled once.
This is the shared-phase change the [module handoff](../../shared/content/character-options.md)
reserves to the integration owner.

### D. Enchantment of Battle is conditional in the source and unconditional in Forge

The Compendium gates both numbers: "**While you wear light armor,** you gain a +3 bonus to
Stamina" and "**While you wield a light weapon,** you gain a +1 damage bonus with weapon
abilities." Forge applies them unconditionally —
`createBonus({ field: FeatureField.Stamina, valuePerEchelon: 3 })` and
`createAbilityDamage({ keywords: [Weapon], value: 1 })` — with the condition surviving only in the
description prose, alongside a `createProficiency` entry for light armor and light weapons.

Salient follows the Compendium. Consequence: a same-build Enchantment of Battle witness will show
Forge Stamina 3 higher than ours, and that difference needs a recorded source-backed explanation
rather than a silent adjustment. This is the one option in the unit where an exact numeric match
with Forge is **expected to fail for a source-backed reason**.

Compounding it, Salient has no equipment or treasure model at level one, so "wearing light armor"
is not a state the build can currently hold. The proposed treatment is to record both bonuses as
conditional contributions valued at 0 with their full condition text readable, and to state
plainly that the condition cannot yet be satisfied — an explicit recorded limitation, not a
silent default. The alternative — recording +3 unconditionally to match Forge — contradicts the
source and is rejected. Flagging for the lead: this is a presentation/contract decision with a
visible numeric consequence, and it needs the integration owner's agreement before implementation.

### E. Specialization grants are asymmetric

Earth and Fire grant an ability as their 1st-level specialization feature; Green and Void grant a
non-ability feature, and Void's additionally carries the Shared Void Sense ability. The option
grant lists are therefore 3, 3, 3 and 4 entries. Any test or comparison helper that assumes a
fixed grant count per specialization will be wrong for Void.

### F. Parent-change removal

Changing specialization must remove the previous acolyte modifier, feature and triggered action;
changing enchantment must remove its Stamina/speed/stability/distance/damage contribution;
changing ward must remove the immunity entry **and** its nested damage-type selection. A stale
nested damage type whose parent ward is no longer selected is not an active grant. This is the
established V45 rule — "An option must cease contributing when its parent choice is no longer
available" — and the nested ward choice is the first level-one class option where a *nested*
selection has to be dropped with its parent.

### G. Forge naming differences

Compendium is the authority; the comparison helper needs normalization for:

| Compendium | Forge |
| --- | --- |
| Meteoric Introduction | A Meteoric Introduction |
| Ray of Agonizing Self-Reflection | Ray of Agonizing Self Reflection |
| The Green Within, the Green Without | The Green Within, The Green Without |
| No More Than a Breeze | No More than a Breeze |
| Void: Acolyte of the Mystery | Acolyte of the Void |
| Earth: Acolyte of Earth | Earth: Acolyte of Earth |
| Fire: Acolyte of Fire | Acolyte of Fire |

Forge's own acolyte prefixing is inconsistent across the four specializations. These are label
differences only; no mechanical difference is implied, and none should be treated as a source
discrepancy requiring explanation beyond this table.

## Proposed same-build reference matrix

The existing portable Elementalist counterpart is **Bethell Corrected V25** — Polder / Fire
Elementalist 1, Mage's Apprentice, no kit — in
[the V45 reference inventory](../research/v45-reference-inventory.md). Its verified level-one
selections, read from the retained export, are Fire; Enchantment of Destruction; Ward of
Delightful Consequences; signatures `elementalist-ability-2` and `-8` (Bifurcated Incineration,
Viscous Fire); 3-essence `elementalist-ability-10` (The Flesh, a Crucible); 5-essence
`elementalist-ability-13` (Conflagration); class skills Alchemy, Blacksmithing, History. That is
exactly the currently enabled path, and it must be preserved byte-identically as build 1.

Coverage is driven by the widest independent dimension. Specializations need 4 builds,
enchantments 5, signature abilities 4 (two per build), each heroic pool 4, and the 22 class skills
8 builds at three per build. Wards need 3 builds for the non-nested wards plus 7 builds that all
select Ward of Excellent Protection, one per damage type — **10 builds**, which sets the minimum.
Dimensions combine freely because no level-one Elementalist option excludes another.

Ancestry is held at **Polder** with Bethell's exact existing ancestry selections across all ten
builds, so that class contributions are isolated. This is the class unit; the ancestry contrast
builds the reference procedure asks for belong to the Polder and Dwarf ancestry units. If V46
Devil merges before V48 implementation, add one Devil Elementalist build as a cross-family check
rather than re-cutting the matrix.

| # | Specialization | Enchantment | Ward (nested type) | Signature ×2 | 3-essence | 5-essence | Class skills ×3 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Fire | Destruction | Delightful Consequences | Bifurcated Incineration, Viscous Fire | The Flesh, a Crucible | Conflagration | Alchemy, Blacksmithing, History |
| 2 | Earth | Celerity | Excellent Protection (acid) | Afflict a Bountiful Decay, Grasp of Beyond | Behold the Mystery | Instantaneous Excavation | Architecture, Carpentry, Cooking |
| 3 | Green | Battle | Excellent Protection (cold) | The Green Within the Green Without, Meteoric Introduction | Invigorating Growth | No More Than a Breeze | Fletching, Forgery, Jewelry |
| 4 | Void | Distance | Excellent Protection (corruption) | Ray of Agonizing Self-Reflection, Unquiet Ground | Ripples in the Earth | Test of Rain | Mechanics, Tailoring, Criminal Underworld |
| 5 | Fire | Permanence | Excellent Protection (fire) | Bifurcated Incineration, Afflict a Bountiful Decay | Behold the Mystery | Instantaneous Excavation | Culture, Monsters, Nature |
| 6 | Earth | Destruction | Excellent Protection (lightning) | Grasp of Beyond, Unquiet Ground | Invigorating Growth | Test of Rain | Psionics, Religion, Rumors |
| 7 | Green | Celerity | Excellent Protection (poison) | Meteoric Introduction, Viscous Fire | Ripples in the Earth | Conflagration | Society, Strategy, Timescape |
| 8 | Void | Battle | Excellent Protection (sonic) | Ray of Agonizing Self-Reflection, The Green Within the Green Without | The Flesh, a Crucible | No More Than a Breeze | Alchemy, History, Nature |
| 9 | Fire | Distance | Nature's Affection | Bifurcated Incineration, Grasp of Beyond | Behold the Mystery | Test of Rain | Cooking, Jewelry, Strategy |
| 10 | Earth | Permanence | Surprising Reactivity | Unquiet Ground, Viscous Fire | Ripples in the Earth | Instantaneous Excavation | Carpentry, Monsters, Timescape |

Builds 1–8 cover all 22 class skills exactly once across 24 slots, with builds 9 and 10 reusing
already-covered skills. All four specializations appear at least twice. Every enchantment, every
ward, all seven ward damage types, all eight signature abilities and all four options in each
heroic pool appear at least once.

Independent checks each build must carry, derived from the Compendium before our evaluator runs:

- Build 1: unchanged Bethell values; Stamina 18, no speed/stability change.
- Builds 2, 7: speed 6 → 7 and Disengage 1 → 2 from Celerity, on top of Polder's baseline.
- Builds 3, 8: Enchantment of Battle Stamina **unchanged at 18** with the light-armor condition
  recorded and unsatisfied; expect and explain the Forge +3 difference.
- Builds 5, 10: Stamina 18 → 24, stability +1, recovery value and winded value recomputed from 24.
- Builds 4, 9: +2 distance on ranged magic abilities; build 4 stacks Enchantment of Distance with
  Void's Acolyte of the Mystery — confirm from the source whether the two independent +2 bonuses
  both apply to a Magic/Ranged/Void ability before asserting a combined value.
- Builds 2–8: `damageImmunities` carries the chosen type at the Reason score (2), **alongside**
  Polder's corruption immunity; build 4's corruption case exercises the two-entry path directly.
- Build 4: four specialization grants, not three.

## Deliverables

| File | Change |
| --- | --- |
| `shared/content/classes/elementalist/level-one.ts` | All option rows completed; the two missing container features added; the nested ward damage-type decision added; existing decision IDs and source paths preserved |
| `shared/evaluate/classes/elementalist.ts` | Acolyte modifiers for all four specializations; five enchantment contributions; ward immunity contribution |
| Shared contracts/phases | **Requested from the integration owner**, not written here: gaps A, B, C and the D representation decision |
| `tests/fixtures/v48-elementalist/` | Ten raw `.ds-hero` exports, readable sheets, capture metadata, hashes, normalized selections, independently derived expectations |
| `tests/character-v48-elementalist.test.ts` | Per-build comparison, parent-change removal, nested-choice removal, budget/count and duplicate-skill cases |
| `tests/browser/v48-elementalist.spec.ts` | Wizard journeys, source display, sheet rendering, persisted readback |
| `docs/build/V48-elementalist-level-one.md` | This document, advanced through implementation and evidence |
| `docs/build/STATUS.md` | This unit's row only |

## Acceptance checks

The eight gates in
[V44](V44-character-option-delivery.md#acceptance-checks) apply unchanged. Unit-specific additions:

1. Every one of the 22 class skills, 4 specializations, 5 enchantments, 4 wards, 7 ward damage
   types, 8 signature abilities and 8 heroic abilities appears in at least one completed
   same-build Forge counterpart, per the ledger above.
2. Choosing a second signature ability beyond two, or a class skill outside crafting/lore, is
   refused; the ward damage type is unavailable unless Ward of Excellent Protection is selected.
3. Changing specialization, enchantment or ward removes every prior contribution including the
   nested ward damage type, and preserves unrelated ancestry, career, background and authored
   details.
4. A Polder Elementalist with Ward of Excellent Protection (corruption) retains **both** immunity
   entries with distinct provenance; neither overwrites the other.
5. Bethell's build 1 values are byte-identical to the existing reference before and after the
   change, including provenance ordering.
6. Existing Fury level-one and Berserker level-two behavior, and Fury 1→2 advancement, are
   unchanged. No Elementalist level-two support is enabled by this unit.
7. Enchantment of Battle's Forge Stamina difference is recorded with its source explanation and
   passes independent rules review, or the unit is not declared fully verified.

## Out of scope

Elementalist levels two and above, including the level-two specialization features and the second
5-essence ability. Essence generation, spending, persistent-ability maintenance and the 5 × Reason
drop threshold. Respite reselection of enchantment and ward. Triggered-action execution. Equipment,
armor and treasure modelling beyond recording Enchantment of Battle's conditions. Import/export
adapters. Any change to Fury, Devil or Polder behavior beyond the shared merge required by gap B.

## Open questions

None requiring a user ruling. The Ward of Excellent Protection reading is recorded above as a
labelled interpretation with its alternative, grounded in source text plus Forge structure, for the
rules reviewer. The Enchantment of Battle representation (finding D) is an engineering decision
needing the integration owner's agreement, not a rules question. If the rules reviewer rejects the
ward interpretation, that becomes a source ambiguity for
[the question queue](../rules-questions-for-user.md) and the ward's seven witness builds pause
while the rest of the unit continues.

## Work log

2026-09-19: claimed V48 preparation on `slice/V48` in `/srv/presidium/projects/salient/opus-elementalist`,
cut from main `453dd1e`, per Chords assignment 218 from the integration lead. Read the pinned
Compendium class chapter, all level-one feature and ability entries, the book-specific clean text
for the authoritative option lists, the crafting and lore skill groups, the damage-immunity rule,
and the pinned Forge class and four specialization definitions. Inspected the existing content
module, evaluator, support registry, evaluation contract and the retained Bethell reference export.

No application, evaluator, contract or vendor file was changed; no option is enabled; no reference
has been captured and no verification has been run. Vendor submodules were not initialized in this
worktree — all source reading used the canonical checkout's existing pinned trees, read-only. No
dependency, build, server or browser workload ran anywhere, and nothing ran on CT114.

Implementation remains gated on the V46 Devil pilot verdict and on the integration owner's
response to shared gaps A, B, C and D.
