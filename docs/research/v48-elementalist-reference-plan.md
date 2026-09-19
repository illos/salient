# V48: Elementalist level-one reference plan

Prepared 2026-09-19 for the [V48 slice](../build/V48-elementalist-level-one.md) under the
[V44 delivery plan](../build/V44-character-option-delivery.md) and the
[reference procedure](../build/character-verification.md). This is preparation: the ten legal choice
maps, the independently derived source expectations, the normalized comparison design and the capture
plan. **No capture has been performed, no option is enabled and no verification has been run.**

Pins, both unchanged: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.

## Constant selections

All ten builds hold Bethell Corrected V25's non-class selections fixed, so class contributions are
isolated. Read from the retained portable export and
[the existing fixture](../../tests/fixtures/v25-bethell.json).

| Decision | Value |
| --- | --- |
| `ancestry.choice` | Polder |
| `ancestry.polder.purchased-traits` | Corruption Immunity, Graceful Retreat, Fearless |
| `culture.name` / `.language` | Polder / Khoursirian |
| `culture.environment` / `.skill` | Urban / Alertness |
| `culture.organization` / `.skill` | Communal / Gymnastics |
| `culture.upbringing` / `.skill` | Creative / Tailoring |
| `career.choice` | Mage's Apprentice |
| `career.mages-apprentice.skills` | Monsters, Timescape |
| `career.mages-apprentice.languages` | The First Language |
| `career.mages-apprentice.perk` | Arcane Trick |
| `career.mages-apprentice.inciting-incident` | Forgotten Memories |
| `class.choice` | Elementalist |
| `class.elementalist.characteristic-array` | `2, 1, 1, −1` |
| `class.elementalist.array-assignment` | Might −1, Agility 1, Intuition 2, Presence 1 |
| `class.elementalist.magic-replacement` | Empathize |
| complication | none |

**Reason is 2 in every build.** Every Reason-scaled expectation below therefore evaluates to 2.

### Skill collisions constrain the class's choose-three

The fixed skills across these constant selections are Alertness, Gymnastics, Tailoring (culture),
Monsters, Timescape (career), Magic (class) and Empathize (the Magic replacement). Four of those sit
inside the class's own crafting ∪ lore pool: **Tailoring, Monsters, Timescape and Magic**. Selecting
any of them in `class.elementalist.skills` produces an `invalid`/`duplicate-skill` diagnostic and the
build will not complete.

An earlier draft of the V48 matrix assigned Tailoring to build 4, Monsters to build 5, and Monsters
plus Timescape to build 10. Those three builds were illegal. The corrected assignment below draws
only from the 18 legal values: the nine crafting skills other than Tailoring, and the nine lore
skills other than Monsters, Timescape and Magic. Builds 1–6 cover all 18 exactly once.

## The ten choice maps

Varying selections only; everything above is constant.

| # | `specialization` | `enchantment` | `ward` (+ nested type) | `signature-abilities` | `ability-3` | `ability-5` | `skills` |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Fire | Destruction | Delightful Consequences | Bifurcated Incineration, Viscous Fire | The Flesh, a Crucible | Conflagration | Alchemy, Blacksmithing, History |
| 2 | Earth | Celerity | Excellent Protection (acid) | Afflict a Bountiful Decay, Grasp of Beyond | Behold the Mystery | Instantaneous Excavation | Architecture, Carpentry, Cooking |
| 3 | Green | Battle | Excellent Protection (cold) | The Green Within, the Green Without; Meteoric Introduction | Invigorating Growth | No More Than a Breeze | Fletching, Forgery, Jewelry |
| 4 | Void | Distance | Excellent Protection (corruption) | Ray of Agonizing Self-Reflection, Unquiet Ground | Ripples in the Earth | Test of Rain | Mechanics, Criminal Underworld, Culture |
| 5 | Fire | Permanence | Excellent Protection (fire) | Bifurcated Incineration, Afflict a Bountiful Decay | Behold the Mystery | Instantaneous Excavation | Nature, Psionics, Religion |
| 6 | Earth | Destruction | Excellent Protection (lightning) | Grasp of Beyond, Unquiet Ground | Invigorating Growth | Test of Rain | Rumors, Society, Strategy |
| 7 | Green | Celerity | Excellent Protection (poison) | Meteoric Introduction, Viscous Fire | Ripples in the Earth | Conflagration | Alchemy, Architecture, Nature |
| 8 | Void | Battle | Excellent Protection (sonic) | Ray of Agonizing Self-Reflection; The Green Within, the Green Without | The Flesh, a Crucible | No More Than a Breeze | Blacksmithing, Carpentry, Psionics |
| 9 | Fire | Distance | Nature's Affection | Bifurcated Incineration, Grasp of Beyond | Behold the Mystery | Test of Rain | Cooking, Fletching, Religion |
| 10 | Earth | Permanence | Surprising Reactivity | Unquiet Ground, Viscous Fire | Ripples in the Earth | Instantaneous Excavation | Forgery, Jewelry, Rumors |

Coverage of the 29 newly delivered options: all 4 specializations (each twice or more), all 5
enchantments, all 4 wards, all 7 ward damage types, all 8 signature abilities, all 4 three-essence
and all 4 five-essence abilities. Class skills vary but are **not** counted — all 22 are already
served today.

## Independently derived source expectations

From the pinned Compendium, before running our evaluator. Build 1's values are the existing verified
Bethell baseline and must be reproduced unchanged.

### Baseline for every build, before class-option contributions

Stamina 18, recoveries 8, recovery value 6, winded 9, speed 5, stability 0, disengage 2, size 1S,
saving-throw threshold 6, potency 0/1/2, `damageImmunities` corruption 3 (Polder, level + 2).

### Per enchantment

| Enchantment | Builds | Expected effect | Expected values |
| --- | --- | --- | --- |
| Destruction | 1, 6 | +1 rolled damage, Magic | Vitals unchanged. Ability modifier +1 |
| Celerity | 2, 7 | +1 speed, +1 Disengage distance | **speed 6**, **disengage 3**. Stamina unchanged |
| Battle | 3, 8 | Conditional; see below | **All vitals unchanged: Stamina stays 18.** Two `conditionalEffects` |
| Distance | 4, 9 | +2 distance, ranged magic | Vitals unchanged. Distance contribution +2 |
| Permanence | 5, 10 | +6 Stamina, +1 stability | **Stamina 24**, **recovery value 8** (⌊24/3⌋), **winded 12** (⌊24/2⌋), **stability 1** |

Permanence and Battle both scale per echelon in the source ("increases by 3/6 at 4th, 7th and 10th
levels"). At level one both reduce to the printed base. The echelon boundaries 1–3 / 4–6 / 7–9 / 10
are confirmed in
[Echelons of Play](../../vendor/steel-compendium/en/unified/md/rule/general/echelon.md).

### Per specialization

| Specialization | Builds | Permanent build effect | Manual |
| --- | --- | --- | --- |
| Fire | 1, 5, 9 | +1 rolled damage on Fire+Magic, and on Hurl Element when dealing fire damage | — |
| Earth | 2, 6, 10 | **None** | Stability +1 until start of next turn per Earth+Magic ability, cumulative |
| Green | 3, 7 | **None** | Temporary Stamina equal to Reason (2) on damaging with a costed Green+Magic ability |
| Void | 4, 8 | +2 distance on Magic+Ranged+Void | — |

Void grants **four** level-one items (Acolyte of the Mystery, A Beyonding of Vision, Shared Void
Sense, Subtle Relocation); the other three grant three each.

### Per ward

| Ward | Builds | Expected |
| --- | --- | --- |
| Delightful Consequences | 1 | No permanent value. 1 surge on first damage each round is manual |
| Excellent Protection | 2–8 | One `damageImmunities` entry of the chosen type valued **2** (Reason). **Exception, build 4:** its corruption ward merges with Polder's corruption 3 into a single entry valued 3 |
| Nature's Affection | 9 | No permanent value. Readable free triggered ability; slide up to 2 |
| Surprising Reactivity | 10 | No permanent value. Readable free triggered ability; push up to 4 (twice Reason) |

**Build 4 is the immunity-merge case.** Its ward type is corruption, which collides with Polder's
Corruption Immunity 3. Expected result: a **single** `damageImmunities` entry, `corruption` valued
**3**, retaining both provenance chains.

**The value alone is not discriminating here and must not be the only assertion.** Corruption is the
one damage type whose ward grant (Reason 2) is masked by Polder's 3, so an implementation that
dropped the ward contribution entirely would still produce 3 and pass a value check. Build 4's
expectation must additionally assert that the merged entry's provenance contains **both** an
`ancestry.polder.purchased-traits` entry and a `class.elementalist.ward` entry. Not two entries, and not 5 —
[Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md) states
that only the highest value applies. Builds 2, 3, 5, 6, 7 and 8 each expect **two** independent
entries: Polder corruption 3 plus the chosen type at 2.

### Build 3 and 8 — Enchantment of Battle, stated in full

The source gates both amounts. Expected representation, using V46's `ConditionalEffect` contract:

| Field | Value |
| --- | --- |
| `feature` | Enchantment of Battle |
| `effect` | `stamina-bonus` (**new union member**) |
| `condition` | "While you wear light armor" |
| `amount` | 3 |
| `sourcePath` | `en/unified/md/feature/elementalist/level-1/enchantment-of-battle.md` |

| Field | Value |
| --- | --- |
| `feature` | Enchantment of Battle |
| `effect` | `weapon-damage-bonus` (**new union member**) |
| `condition` | "While you wield a light weapon" |
| `amount` | 1 |
| `sourcePath` | same |

`staminaMaximum` stays **18** and `abilityModifiers` gains **nothing**. The +1 must not enter
`abilityModifiers`: `convex/lib/resolve.ts:577-586` forwards every entry's amount into damage after
keyword matching alone, so a conditional entry there would be applied unconditionally. A `condition`
string on the sheet is presentation only and does not gate that path.

The third clause — "You can use light armor treasures and light weapon treasures" — is a capability
with no amount. It is a readable feature grant, not a `ConditionalEffect`.

### Build 4 — the one stacking question, now an open rules question

Build 4 selects Void (+2 distance on Magic+Ranged+Void) **and** Enchantment of Distance (+2 distance
on ranged magic). A Magic+Ranged+Void ability qualifies for both.

An earlier draft recorded **+4** as a derived expectation. **Withdrawn.** The pin does not resolve
it, and the grounds offered were weaker than the label suggested:

- [Bonuses and Penalties](../../vendor/steel-compendium/en/unified/md/rule/dice/bonuses-and-penalties.md)
  says bonuses "always add together", but every sentence of it is scoped to **power rolls**, not
  distance.
- Worse, it does not lexically reach one of the two effects. Enchantment of Distance says "+2
  **bonus** to the distance"; Acolyte of the Mystery says the distance "**increases by 2 squares**"
  and links no bonus rule at all.
- The nearest thing to a non-stacking rule sits on the
  [Distance](../../vendor/steel-compendium/en/unified/md/rule/combat/distance.md) page but is not
  about distance: "the Cloak and Dagger kit, which has a **weapon damage bonus** to melee abilities
  and a **weapon damage bonus** to ranged abilities, only one bonus at a time applies to an ability
  with both the Melee and Ranged keywords." That governs weapon damage bonuses for mode-exclusive
  alternatives; it merely lives on the Distance page. A second draft of this document called it a
  "distance-scoped non-stacking sentence", which was inaccurate and is corrected here. The honest
  statement is the original one: the pin states no stacking rule for distance either way.

Recorded as [Q-CHAR-17](../rules-questions-for-user.md) and **blocking nothing**. The build records
two independent distance contributions, each with its own provenance, which is what gap A's
recommended representation produces anyway. Build 9 witnesses Distance without Void and build 8
witnesses Void without Distance, both at +2, so each input is independently established.

**Ledger limitation, to be carried explicitly and not quietly dropped.** Displaying two separate
contributions is an honest partial representation, but it is not the same as establishing the
effective combined distance. **Build 4 must therefore not be labelled a fully verified counterpart
for the Void-plus-Distance combination while Q-CHAR-17 is open.** Its two individual contributions
are verified; its combined effective value is *not verified*, and the option ledger records that in
those words. Enchantment of Distance and Acolyte of the Mystery each remain fully covered as
individual options through builds 9 and 8, which carry no such limitation, so the unit's 29-option
coverage does not depend on build 4's combination being resolved.

## Enchantment of Battle's kit exclusion — recorded, not enforced

The source says "If you have a kit, you can't take this enchantment." **No Elementalist can hold a
kit**, so the exclusion is vacuously satisfied for every level-one Elementalist build.

Evidence: `kit.choice` carries `dependsOn: ['class.fury.aspect']` and an `optionsByParent` map keyed
only on Berserker, Reaver and Stormwight
([the pinned R01 reference](../../shared/content/fury-level-one-decisions.json)). `basePoolOf`
returns `{ values: [] }` when no parent entry matches (`shared/evaluate/structure.ts:190-192`), and
an Elementalist never selects a Fury aspect. The Elementalist advancement table grants no Kit feature
at any level from 1 to 10.

Following the Lycanthropy precedent — whose restriction is recorded precisely as "Ineligible
Stormwight Fury only, not all Furies" rather than over-generalized — V48 **records the exclusion as
source text with its exact scope and does not build an enforcement mechanism that can never fire**.
This is an assumption tied to the current definition: recheck it if `kit.choice`'s dependency ever
widens, or if a later Elementalist level grants a kit.

## Normalized comparison design

The comparison must not manufacture a second oracle. Following
[the V45 helper boundary](v45-reference-inventory.md), it reads the pinned Forge structural entry
points and compares three independently produced sets: the raw export's active selections, our
source-derived expectations above, and Salient's persisted readback.

Normalization required before comparison, all label-only, no mechanical effect:

| Compendium (authority) | Forge |
| --- | --- |
| Meteoric Introduction | A Meteoric Introduction |
| Ray of Agonizing Self-Reflection | Ray of Agonizing Self Reflection |
| The Green Within, the Green Without | The Green Within, The Green Without |
| No More Than a Breeze | No More than a Breeze |
| Void: Acolyte of the Mystery | Acolyte of the Void |
| Fire: Acolyte of Fire | Acolyte of Fire |
| Green: Acolyte of the Green | Acolyte of the Green |

Forge feature shapes the helper must newly recognize, beyond what V45 supports:

- `createChoice` **nested inside** a ward option — Ward of Excellent Protection's seven damage-type
  sub-options (`elementalist-1-8ba`…`bg`), each a `createDamageModifier` with
  `createCharacteristic({ characteristics: [Reason], modifierType: Immunity })`. The selected
  sub-option is the ward's damage type; the unselected six are catalog, not grants.
- `createMultiple` for Enchantment of Battle, Enchantment of Celerity and Enchantment of
  Permanence, whose child features carry the actual bonuses: **three** children for Battle —
  `createBonus(Stamina, valuePerEchelon: 3)`, `createAbilityDamage([Weapon], 1)` and
  `createProficiency` — then `Speed` and `Disengage` for Celerity, and `Stamina` and `Stability`
  for Permanence. Battle's `createAbilityDamage` child is what expected-difference 2 below requires
  the helper to compare, so it must not be omitted.
- `createAbilityDistance` for Enchantment of Distance and Void's acolyte — a shape with no Salient
  counterpart until the new distance contribution exists.
- `createSurgeGain` for Ward of Delightful Consequences.
- `createAbility` at ward level for Nature's Affection and Surprising Reactivity.

Two expected, source-backed comparison differences to record rather than resolve:

1. **Enchantment of Battle Stamina.** Forge applies `valuePerEchelon: 3` unconditionally; the source
   gates it on wearing light armor.

   **An unchanged base Stamina of 18 does not by itself certify a worn-light-armor counterpart.**
   If the witness states the assumption "light armor worn", the comparison must evaluate our
   conditional amount *under that assumption* and show 21 against Forge's 21. Reporting 18 against
   21 and calling the difference explained would be a vacuous comparison: it compares two different
   equipment states and then excuses the gap with our own missing fact. That is precisely what the
   per-option delivery gate forbids.

   This means the comparison needs a way to resolve a `ConditionalEffect` under a stated condition
   assumption — a read-side projection for the ledger only, never a change to
   `staminaMaximum` and never anything automatic. Two candidate shapes, for the integration owner:
   evaluate the ledger's expected totals from `conditionalEffects` in the comparison helper, or add
   an explicitly-labelled derived "with stated conditions met" projection that no resolution path
   reads. The first is narrower and is the recommendation.

   The alternative is to declare exact counterpart coverage for Enchantment of Battle **incomplete**
   and record the precise limitation, per
   [character-verification.md](../build/character-verification.md#per-option-delivery-gate). That is
   an acceptable honest outcome, but it must be stated as incomplete rather than dressed as a pass.

2. **Enchantment of Battle weapon damage.** Same shape and the same requirement: Forge's
   unconditional `Weapon`-keyword +1 against our conditional record, compared under a stated
   wielding assumption or else marked incomplete.

## Capture plan

Per the [capture-mode clarification](../build/character-verification.md#2-build-and-capture-the-reference),
captures use the real Forge application served from the pinned source on CT114 through
`presidium-dev` with an explicitly named environment. Nothing runs on Presidium and nothing runs
before the pilot release and CT114 coordination.

Per build, retain: the unmodified `.ds-hero` export from the application's own export path; a
rendered sheet; feature and ability evidence for the varying selections; capture date; the observed
local application version and source commit; enabled sourcebook IDs; byte count and SHA-256. Record
the local target explicitly and label it as the pinned local application, never as the public
website. Selections are made through the editor; fabricating an export or injecting selections into
storage is not equivalent evidence.

**Build 1's capture mode differs and that must be recorded, not glossed.** Bethell's retained export
was captured from the public website at version 14.198.0, while this plan's other nine builds use
the pinned local application at 14.197.0. Either recapture build 1 on the pinned application so all
ten share one mode, or record the mixed mode and the version difference explicitly, as
[the procedure](../build/character-verification.md#2-build-and-capture-the-reference) requires for
website-versus-pin drift. Recapturing is the cleaner option and is the recommendation.

A manifest in the same shape as
[the V45 manifest](../../tests/fixtures/v45-reference/manifest.json) records all ten, so the
comparison is reproducible from the normal checkout rather than from an ignored directory.

## What this plan does not establish

No capture has been made, no expectation has been checked against any builder, no test exists and no
option is enabled. The ward's one-of-seven reading and the build-4 stacking expectation both need the
independent rules review the V44 gates require. Implementation waits on the V46 pilot verdict and on
the integration owner's decisions for the distance contribution, the immunity merge helper, the
class-feature vitals entry point and the `ConditionalEffect` union extension.
