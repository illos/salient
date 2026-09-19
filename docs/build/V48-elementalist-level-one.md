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

`shared/content/classes/elementalist/level-one.ts` is the existing V25 content, extracted unchanged
by V45. **Raw module metadata is not the served definition.** An independent audit of the assembled
definitions corrected an earlier draft of this table: `character-decisions.ts` composes the level-one
content and then runs the V37 extensions, one of which rewrites class skill support.

`shared/content/supporting-backgrounds.ts:1548-1555` widens every `class.*` decision whose id matches
`/\.skills?(\.|$)/` and whose kind is `choice`, assigning `supportedInV001 = allSkills` (57 names
across all five groups). Its own comment states the boundary: "Widen only already-sourced class skill
choices, not their classes, subclasses or abilities." `class.elementalist.skills` matches and is
widened; `class.elementalist.skill.magic` is `automatic` and is skipped.

Crucially, `supportedInV001` does **not** produce options. `basePoolOf`
(`shared/evaluate/structure.ts:182-198`) returns `decision.options` when present, otherwise the
`optionsFrom` pools; `isSupported` (`structure.ts:341-347`) only marks a value as offered-or-not.
An unsupported value is rendered disabled as "— not offered yet"
(`web/wizard/index.tsx:142-151`) and, if selected headlessly, is kept and flagged `unsupported`
rather than refused (`shared/evaluate/character.ts:399-401`).

| Decision | Shape | Served + enabled today | Source total | Newly delivered by V48 |
| --- | --- | ---: | ---: | ---: |
| `class.elementalist.characteristic-array` | explicit options | 4 | 4 | 0 |
| `class.elementalist.skills` (choose 3) | `optionsFrom` pools | **22** | 22 | **0** |
| `class.elementalist.magic-replacement` | regenerated | **57** | 57 | **0** |
| `class.elementalist.specialization` | explicit options | 1 (Fire) | 4 | 3 |
| `class.elementalist.enchantment` | explicit options | 1 (Destruction) | 5 | 4 |
| `class.elementalist.ward` | explicit options | 1 (Delightful Consequences) | 4 | 3 |
| Ward of Excellent Protection damage type | nested, does not exist yet | 0 | 7 | 7 |
| `class.elementalist.signature-abilities` (choose 2) | explicit options | 2 | 8 | 6 |
| `class.elementalist.ability-3` | explicit options | 1 | 4 | 3 |
| `class.elementalist.ability-5` | explicit options | 1 | 4 | 3 |

**V48 newly delivers 29 selectable options.** The class skills and the Magic replacement are
**reused shared coverage that is already served today**, not new options, and they do not need new
witness builds to establish coverage. An earlier draft of this document claimed 19 newly supported
skills; that was read from the stale raw `supportedInV001: ['Alchemy', 'Blacksmithing', 'History']`
array, which `supporting-backgrounds.ts:1553` discards. The same staleness affects
`magic-replacement`'s raw `['Empathize']`.

The six explicit-option decisions carry `options: [...]` arrays, and no composition or extension step
pushes options into a `class.*` decision. Their raw option lists therefore **are** the complete served
set, and those counts stand. `signature-abilities` is worth naming: two options for two required
slots is a forced selection with no freedom at all today.

The class's `features` row also omits two named level-one features that the advancement table lists:
**1st-Level Specialization Feature** and **Specialization Triggered Action**. The current Fire option
grants their Fire contents directly, so no Fire value is wrong, but the two container features are
missing from the readable feature list and must be added.

`shared/evaluate/classes/elementalist.ts` currently produces exactly two rolled-damage ability
modifiers (Enchantment of Destruction, Acolyte of Fire). Everything else below is new.

Two observations recorded without a defect claim, because no spec section requires otherwise:
Magic sits in the lore pool and is therefore now *enabled* in the choose-three dropdowns, but
selecting it yields an `invalid`/`duplicate-skill` diagnostic because the class auto-grants Magic;
several complication skill decisions pre-filter owned skills with `ownedPool` and this one does not.
Per the settled Q-CHAR-11 policy (`docs/character-wizard-spec.md:264-275`), deliberately selecting an
already-granted skill correctly creates **no** unrestricted replacement entitlement.

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

**The "or" in Ward of Excellent Protection is a selection of one damage type, not simultaneous
immunity to all seven.** An earlier draft of this document justified that reading from Forge's
seven-way encoding plus a balance argument. Both were invalid — a third-party tool's structure is not
rules authority, and balance reasoning is not source text. The reading was re-established by an
independent Compendium-only review, and the corpus evidence is decisive:

- **The disambiguated twin.** Conduit and Censor *Nature's Bounty*
  ([conduit](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-7/natures-bounty.md),
  [censor](../../vendor/steel-compendium/en/unified/md/feature/censor/level-7/natures-bounty.md))
  use a word-for-word identical clause — same seven types, same order, same "or", same "damage equal
  to your X" — and then resolve it: "You can choose this benefit twice, **choosing a different damage
  immunity each time**." That sentence is only coherent if the clause denotes one selected immunity.
- **"and" is the author's phrasing for simultaneous**, used five times, including the *same seven
  types in the same order*: [Fury Elemental Form](../../vendor/steel-compendium/en/unified/md/feature/fury/level-7/elemental-form.md)
  ("acid, cold, corruption, fire, lightning, poison, **and** sonic damage equal to your Might score"),
  [Chaos Incarnate](../../vendor/steel-compendium/en/unified/md/feature/fury/level-10/chaos-incarnate.md),
  [Elemental Absorption](../../vendor/steel-compendium/en/unified/md/feature/null/level-6/elemental-absorption.md),
  and two entries that cannot be a player choice at all —
  [the Mundane complication](../../vendor/steel-compendium/en/unified/md/complication/mundane.md) and
  the Revenant trait [Tough but Withered](../../vendor/steel-compendium/en/unified/md/feature/trait/revenant/tough-but-withered.md).
- **No counterexample.** The review found no place in the pin where an "or" enumeration of damage
  types means all of them at once. The Elementalist's own three other uses of this seven-type list —
  Hurl Element, Practical Magic and
  [Grand Wyrding](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-9/grand-wyrding.md)
  ("choose one of the following damage types") — are every one an explicit single choice.

I verified each quoted line against the pin myself rather than relying on the review's summary. The
counter-argument is recorded: the ward's flavour sentence says "a shield of **all** the elements …
their **full** protective power". It is rejected because all four wards open with a non-mechanical
flavour sentence in that slot, "full protective power" is not a defined term anywhere in the pin, and
flavour cannot override a phrasing discipline demonstrated across eight texts with no exception.

The review did surface a genuinely unresolved sub-question — *when* the damage type is chosen and
whether it can change — which is recorded as [Q-CHAR-16](../rules-questions-for-user.md) and blocks
nothing at level one.

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

Twenty-two eligible skills: the ten crafting skills (Alchemy, Architecture, Blacksmithing, Carpentry,
Cooking, Fletching, Forgery, Jewelry, Mechanics, Tailoring) and the twelve lore skills (Criminal
Underworld, Culture, History, Magic, Monsters, Nature, Psionics, Religion, Rumors, Society, Strategy,
Timescape).

**All 22 are already served and enabled today**, so V48 delivers no new skill option here. See
[current supported state](#current-supported-state) for the composition evidence. The row keeps its
`optionsFrom: ['pool.skills.crafting', 'pool.skills.lore']` pool; V48 must not touch it.

Magic is in the lore group **and** is granted automatically by the class, so it is offered and
enabled but produces an `invalid`/`duplicate-skill` diagnostic when chosen — correct under Q-CHAR-11,
which settles that deliberately selecting an already-granted skill creates no unrestricted
replacement. Witness builds avoid selecting Magic so every chosen skill is an effective grant.
Whether the real Forge editor filters the already-granted Magic out of its choose-three list is an
observation to make during capture, not an assumption.

`class.elementalist.magic-replacement` must be preserved exactly as it is. V45's
`extendSkillReplacements` strips every `replacesDuplicateSkill` row and regenerates them for all
fixed skills, reusing this decision's id so saved revisions stay stable, and setting its supported
set to all 57 skills. Its hardcoded "Mage's Apprentice" label and career source are overwritten by
that pass. The replacement becomes available only when two automatic Magic grants are active —
Elementalist plus the Mage's Apprentice career — so it is correctly unavailable for an Elementalist
with any other career. Removing or renaming the row would break existing saved builds.

## Shared contract and evaluator gaps

Each finding below was checked against the actual consumer code, not inferred from the contract
types. Two of them turned out to be narrower than an earlier draft of this document claimed, and one
turned out to be more dangerous.

### A. `AbilityModifier.field` has zero runtime readers — do not widen it

`shared/contracts/characterEvaluation.ts:194` types the field as the single literal
`'rolled-damage'`. **Enchantment of Distance** (+2 ranged magic distance) and **Void: Acolyte of the
Mystery** (+2 Magic/Ranged/Void distance) are permanent distance contributions with no representation.

A consumer inventory establishes that widening the union would be **unsafe**. No consumer of
`abilityModifiers` reads `field` at all:

- `convex/lib/resolve.ts:577-586` maps the **entire array** into
  `ActorRollFacts.abilityDamageModifiers` with no filter and no `field` guard. The target contract
  (`shared/contracts/rollResolution.ts:104-109`) has no `field` slot, so the discriminator is
  silently dropped at the boundary.
- `shared/resolve/index.ts:274-282` filters only on keywords and the named alternative, via
  `matchesAbilityModifier` (`shared/evaluate/abilityModifiers.ts:13-25`), then sums `amount`
  straight into `damage.rolledDamage`.
- `convex/characters.ts:625-649` applies the same keyword-only gate for the sheet.

Repo-wide, the only `\.field ===` reads are on *complication* permanent modifiers and Devil ancestry
effects — different types entirely. On `AbilityModifier`, `field` is write-only.

A `{ field: 'ranged-distance', amount: 2, keywords: ['Magic', 'Ranged'] }` entry added today would
therefore give every Magic+Ranged ability **+2 automatic rolled damage**, write that damage to the
target's Stamina, and print it to the player under the literal heading "Rolled damage bonuses"
(`web/character-sheet/ability-card.tsx:89-100`). Nothing would flag it: there is no type error,
because the field is dropped before any runtime check.

**Recommendation: a separate narrow field**, e.g.
`abilityDistanceModifiers?: { id; label?; amount; keywords: string[]; provenance }[]` on
`DerivedBaseline`, leaving `AbilityModifier` untouched. Supporting evidence: `matchesAbilityModifier`
already takes a structural `{ keywords, alternative? }`, so the eligibility helper is reusable with no
change; and there is no numeric distance pipeline to plug into today — `rollResolution.ts` and
`shared/resolve/index.ts` contain no distance handling, ability distance is carried only as printed
frontmatter text, and even the existing `KitContributions.meleeDistanceBonus`/`rangedDistanceBonus`
have no consumer that applies them to a rendered or resolved distance. Widening `field` buys no reuse
and only adds the hazard. If it were widened anyway, it would need explicit
`field === 'rolled-damage'` filters at `resolve.ts:579` **and** `characters.ts:637` plus a
discriminator on the roll contract — three coordinated edits whose omission fails silently.

No Convex schema change is needed for either option: baselines are stored as `v.any()`
(`convex/characterTables.ts:129,183,185`), so stored blobs are validator-opaque and older baselines
simply lack the new key.

### B. Highest-wins is already implemented; the hazard is clobbering at the producer

An earlier draft asked for max semantics. They already exist and are already correct.
`shared/resolve/index.ts:301-313` (`highest()`) iterates the entries and keeps
`if (entry.value > best) best = entry.value`, and `:326-331` applies weakness first, then immunity.
That matches the pinned rule
([Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md)):
"If multiple damage immunities apply to a source of damage, only the immunity with the highest value
applies." Multiple same-type entries resolve correctly today.

The real defect risk is at the **producer**. `shared/evaluate/ancestries/polder.ts:50-68` performs a
bare `out.damageImmunities = [...]`, called from `character.ts:1193`; `applyElementalistModifiers`
runs later **in the same method** at `character.ts:1225`. A ward producer written in the same
bare-assignment style would silently delete Polder's corruption immunity on a Polder Elementalist —
our own reference build — with no type error and no diagnostic.

A correct merge already exists inline at `shared/evaluate/character.ts:992-1005`, in the
supporting-complications loop: `list = (out[field] ??= [])`, find by `damageType`, `Math.max` the
value, concatenate provenance. It is safe today only because `deriveProfiles` runs before
`deriveSupportingBenefits` (`character.ts:825-826`).

**Recommendation:** extract that merge into a shared helper and route both Polder and the new ward
through it, rather than adding a second bare assignment or relying on `highest()` to clean up at
resolution time. Emit damage types lowercase — `highest()` compares with case-sensitive `===`, and
incoming ability damage types are lowercased at parse (`shared/resolve/index.ts:166-167`).

Answering the two cases raised in review:

- **Polder corruption 3 (level + 2) plus ward corruption at Reason 2** — one merged entry valued
  **3**, retaining both provenance chains so the sheet can show that two sources grant corruption
  immunity and the higher applies. Not two rows, and not 5. Presenting two rows would imply two
  independent immunities, which the rule contradicts; `web/wizard/supporting-components.tsx:209-216`
  renders one row per array entry with no dedup, so merging at the producer is what keeps the panel
  truthful.
- **Different types**, e.g. Polder corruption 3 plus ward fire 2 — two entries, both active,
  independent of each other. `highest()` matches per damage type, so they never interact.

Three existing test shapes constrain the merge and must keep passing:
`tests/character-v25-evaluator.test.ts:112-115` deep-equals `[['corruption', 3]]`;
`tests/character-v32-evaluator.test.ts:281-285` reads `damageImmunities[0]` positionally, so it is
order-sensitive; and `tests/fixtures/v25-bethell.json:142-144` stores
`"damageImmunities": {"corruption": 3}` keyed by type, a shape that cannot express duplicates at all.
Merging at the producer keeps all three valid; appending would break the first and make the second
depend on insertion order.

**Pre-existing defect found while tracing this, outside V48's scope and reported to the integration
owner rather than fixed here:** `damageTargetFacts` in `convex/lib/resolve.ts:634-641` populates
`immunities` from the hero baseline but never reads `baseline.damageWeaknesses`, although
`DamageTargetFacts.weaknesses` exists and the foe branch populates it. **Hero damage weaknesses are
currently inert in automatic damage application.** Relatedly, the complication sentinel
`weakness.allDamage` (`shared/content/supporting-complications.ts:244`) yields damage type
`allDamage`, which never equals the `all-damage` sentinel `highest()` matches — dormant only because
hero weaknesses are never passed in. Both matter to V46, whose Devil Wings grant is a conditional
weakness.

### C. Class-feature vitals: the mechanism exists but is reachable only from complications

An earlier draft asked for a new phase. That was overstated. `deriveSupportingBenefits`
(`character.ts:920-1045`) already adds to a `numericFields` list —
`['staminaMaximum', 'recoveriesMaximum', 'speed', 'stability']` — by appending to the existing value
and concatenating provenance, and already recomputes `recoveryValue` and `windedValue` from the
**final** Stamina when Stamina changed (`character.ts:1012-1040`). It runs after `deriveProfiles`,
so it correctly lands after `profile.ts:79-93` sets the no-kit `staminaMaximum`.

There is also an exact precedent for the echelon scaling both enchantments need. The
`'Elemental Inside'` complication (`shared/content/supporting-complications.ts:281-288`) uses
`value: '3 * echelon'` with the quote "You gain a +3 bonus to Stamina at 1st level, then again at
4th, 7th, and 10th levels" — the same sentence shape as Enchantment of Battle. `amountOf` resolves
it as `3 * Math.ceil(level / 3)` (`character.ts:929`), which matches the source echelon boundaries
1-3 / 4-6 / 7-9 / 10
([Echelons of Play](../../vendor/steel-compendium/en/unified/md/rule/general/echelon.md)).
Enchantment of Permanence is therefore `'6 * echelon'` and Enchantment of Battle `'3 * echelon'`,
both reducing to the printed base at level one.

What is actually missing is narrow:

1. The loop is hard-wired to the complication path — it reads `COMPLICATION_EFFECTS` and stamps
   `decisionId: 'complication.choice'` on every provenance entry. A class-feature-sourced modifier
   needs a way in that carries its own decision id and source path.
2. `disengage` is **not** in `numericFields`, so Enchantment of Celerity's +1 Disengage has nowhere
   to land. `character.ts:1196` sets `out.disengage` in the no-kit branch and `applyPolderDisengage`
   adds to it afterwards, so the ordering point exists; only the field entry is missing.
3. The recompute guard at `character.ts:1013-1014` triggers on complication modifiers only; it must
   also trigger when a class feature changed Stamina.

**Recommendation:** generalise the existing loop to accept sourced modifiers from a class-feature
contributor and add `disengage` to `numericFields`. No new framework, and existing provenance and
results are preserved by construction because the same code path produces them.

### D. Enchantment of Battle: record the source amounts with their condition, not zero

An earlier draft of this document proposed recording Enchantment of Battle's bonuses as amount **0**
because Salient has no equipment model. **That was wrong and is withdrawn.** Treating an unrecorded
condition as false is exactly the silent default this project forbids, and it would have
manufactured a false mismatch against Forge.

The source gates both numbers: "**While you wear light armor,** you gain a +3 bonus to Stamina" and
"**While you wield a light weapon,** you gain a +1 damage bonus with weapon abilities, including free
strikes," plus "You can use light armor treasures and light weapon treasures." Forge encodes them
unconditionally — `createBonus({ field: Stamina, valuePerEchelon: 3 })`,
`createAbilityDamage({ keywords: [Weapon], value: 1 })` and a `createProficiency` entry — with the
condition surviving only in prose.

**Correct treatment:** record the **source amounts** (+3 Stamina at echelon 1, +1 weapon damage) as
conditional contributions carrying their full condition text and an explicit *activation unknown*
state, because Salient does not yet model whether the hero wears light armor. The amounts are known
and recorded; what is unknown is recorded as unknown. The `SupportingChoice` contract already carries
a `condition?: string`, and `convex/characters.ts:625-649` already supports a per-modifier
`condition` string that the sheet renders (`ability-card.tsx:96`), so the ability-damage half has an
existing presentation path.

**Forge comparison:** the reference witness must state the condition assumption explicitly and
compare under the **same** assumption. Assuming light armor worn, Forge's +3 and our +3 agree and
there is no mismatch. The difference is Forge assuming the condition met, not a rules disagreement,
and it must not be reported as an unexplained discrepancy in either direction. Salient lacking an
equipment fact does not by itself excuse a numeric difference.

This needs a shared representation for a conditional permanent contribution with unknown activation.
**Coordinate with V46 before inventing a second one** — the Devil's Wings grant needs exactly the
same shape for its conditional damage weakness, and its preparation already records that the current
baseline has unconditional `damageWeaknesses` entries but no conditional field.

### E. Specialization grants are asymmetric

Earth and Fire grant an ability as their 1st-level specialization feature; Green and Void grant a
non-ability feature, and Void's additionally carries the Shared Void Sense ability. The option grant
lists are therefore 3, 3, 3 and 4 entries. Any test or comparison helper that assumes a fixed grant
count per specialization will be wrong for Void.

### F. Parent-change removal

Changing specialization must remove the previous acolyte modifier, feature and triggered action;
changing enchantment must remove its Stamina/speed/stability/distance/damage contribution; changing
ward must remove the immunity entry **and** its nested damage-type selection. A stale nested damage
type whose parent ward is no longer selected is not an active grant. This is the established V45
rule, and the nested ward choice is the first level-one class option where a *nested* selection has
to be dropped with its parent.

### G. Forge naming differences

Compendium is the authority; the comparison helper needs normalization for:

| Compendium | Forge |
| --- | --- |
| Meteoric Introduction | A Meteoric Introduction |
| Ray of Agonizing Self-Reflection | Ray of Agonizing Self Reflection |
| The Green Within, the Green Without | The Green Within, The Green Without |
| No More Than a Breeze | No More than a Breeze |
| Void: Acolyte of the Mystery | Acolyte of the Void |
| Fire: Acolyte of Fire | Acolyte of Fire |

Forge's own acolyte prefixing is inconsistent across the four specializations. These are label
differences only; no mechanical difference is implied.

## Proposed same-build reference matrix

The existing portable Elementalist counterpart is **Bethell Corrected V25** — Polder / Fire
Elementalist 1, Mage's Apprentice, no kit — in
[the V45 reference inventory](../research/v45-reference-inventory.md). Its verified level-one
selections, read from the retained export, are Fire; Enchantment of Destruction; Ward of
Delightful Consequences; signatures `elementalist-ability-2` and `-8` (Bifurcated Incineration,
Viscous Fire); 3-essence `elementalist-ability-10` (The Flesh, a Crucible); 5-essence
`elementalist-ability-13` (Conflagration); class skills Alchemy, Blacksmithing, History. That is
exactly the currently enabled path, and it must be preserved byte-identically as build 1.

Coverage is driven by the widest independent dimension **among the 29 newly delivered options**.
The class skills and the Magic replacement are excluded: they are already served today, so they are
reused shared coverage rather than new options, and build 1 already witnesses three of them.
Specializations need 4 builds, enchantments 5, signature abilities 4 (two per build), and each heroic
pool 4. Wards need 3 builds for the non-nested wards plus 7 that all select Ward of Excellent
Protection, one per damage type — **10 builds**, which sets the minimum. Dimensions combine freely
because no level-one Elementalist option excludes another.

Ancestry is held at **Polder** with Bethell's exact existing ancestry selections across all ten
builds, so class contributions are isolated. This is the class unit; the ancestry contrast builds the
reference procedure asks for belong to the Polder and Dwarf ancestry units. If V46 Devil merges
before V48 implementation, add one Devil Elementalist build as a cross-family check rather than
re-cutting the matrix.

Class skills still vary across the builds below. That is deliberate but is **not** coverage of new
options: it exercises the already-served pool against the new class grants and gives the duplicate
and de-duplication paths something to bite on. It is not counted toward the unit's option ledger.

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

All four specializations appear at least twice. Every enchantment, every
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

[Q-CHAR-16](../rules-questions-for-user.md) — when Ward of Excellent Protection's damage type is
chosen and whether it can change. Raised by this preparation from the independent rules review.
**It blocks nothing at level one**: the build-time choice is identical under the two plausible
readings, and only respite reselection, already out of scope here, depends on the answer.

The ward's one-type-of-seven reading is no longer an open interpretation; the corpus resolves it, as
recorded above. The Enchantment of Battle representation (finding D) is an engineering decision
needing the integration owner's agreement, not a rules question.

## Work log

2026-09-19: claimed V48 preparation on `slice/V48` in `/srv/presidium/projects/salient/opus-elementalist`,
cut from main `453dd1e`, per Chords assignment 218. Read the pinned Compendium class chapter, all
level-one feature and ability entries, the book-specific clean text for the authoritative option
lists, the crafting and lore skill groups, the damage-immunity and echelon rules, and the pinned
Forge class and four specialization definitions. Inspected the existing content module, evaluator,
support registry, evaluation contract and the retained Bethell reference export.

2026-09-19, after integration-lead review (Chords 224): corrected four things this document got
wrong, rather than defending the draft. (1) The claim that only three class skills were supported was
read from stale raw module metadata; `supporting-backgrounds.ts:1548-1555` widens the served set and
all 22 are already enabled, so V48 delivers 29 new options rather than the 48 an earlier count
implied, and the skills dimension leaves the coverage ledger. (2) Gap A was resolved on consumer
evidence in favour of a separate narrow distance field, because `AbilityModifier.field` has no
runtime reader and widening it would silently add distance to automatic damage. (3) Gap B was
narrowed: highest-wins is already implemented at `shared/resolve/index.ts:301-313`, the real risk is
producer clobbering, and a correct merge already exists inline for complications. (4) Gap C was
narrowed: the vitals mechanism and an echelon-scaling precedent already exist and are reachable only
from the complication path. The Enchantment of Battle amount-0 proposal was withdrawn as a silent
default. The ward interpretation was re-established from corpus evidence after the original
Forge-structure and balance justification was correctly rejected as not being rules authority.

Bounded independent work was delegated to three Anthropic subagents under the delegation authorized
in `CLAUDE.md#character-track-scope`: a Compendium-only ward rules review explicitly barred from
Forge, from Salient implementation code and from online sources; a consumer inventory of
`abilityModifiers` and `damageImmunities`; and an assembled-definition audit. Each load-bearing claim
was re-verified directly against the checkout before being written here.

No application, evaluator, contract or vendor file was changed; no option is enabled; no reference
has been captured and no verification has been run. Vendor submodules were left uninitialized in this
worktree — all source reading used the canonical checkout's existing pinned trees, read-only. No
dependency, build, server or browser workload ran anywhere, and nothing ran on CT114.

Implementation remains gated on the V46 Devil pilot verdict and on the integration owner's decisions
for gaps A, B, C and D.
