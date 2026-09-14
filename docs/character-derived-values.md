# Character derived values and evaluator contract (R02)

Status: rules contract delivered by slice R02 on 2026-09-14; rules review pending (deferred to the
user's audit thread). This document closes readiness-audit gap G2
(`docs/v0.01-readiness-audit.md#g2-derived-value-formulas-and-evaluator-contract`). It defines, with
source sentences, how the R01 selections (`docs/fury-level-one-decisions.md`) become a character sheet
baseline, and the pure evaluator contract the application calls. It is a document plus a type file and
a machine-readable examples file; the evaluator implementation belongs to A02.

Source: the pinned Steel Compendium at `vendor/steel-compendium`, revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. Every path below is relative to `vendor/steel-compendium/`.
Quotes are verbatim after the R01 text normalization (Markdown links collapse to their label, `<br>`
becomes a space, `*` emphasis markers are removed, whitespace runs collapse). No other source was used.

Companion artifacts:

- `shared/contracts/characterEvaluation.ts` — input, status, diagnostic, provenance and baseline types.
  Types only, no logic.
- `shared/content/character-evaluation-examples.json` — the three worked examples below in the contract's
  shape, with every quote checked verbatim by `tests/character-derived-values.test.ts`.

Labels: **Source** is quoted Compendium text. **Ruling** is an existing user decision, cited to the
document that records it. **Interpretation** is grounded in cited text and names the alternative.
**Open** points to a question id in `docs/rules-questions-for-user.md`; the provisional default is
labeled and carried on the output as an `uncertainty`.

Boundaries: live values (current Stamina, spent Recoveries, resource pools, conditions, Victories,
XP) are R03 (`docs/build/R03-live-state-initialization.md`). Roll-time arithmetic (kit damage bonus
application, winded, Catch Breath) is R04 (`docs/roll-and-damage-resolution.md`); this document
restates R04's definitions by reference only. Levels above one are V08.

## 1. Formulas

Each row gives the formula, the source sentence and the R01 decision id that supplies the input.
`decision ids` are R01's; they are the evaluator's input vocabulary and are not renamed here.

### 1.1 Characteristics

> "Each characteristic has a score that runs from −5 to +5." — `en/unified/md/rule/character/characteristic.md`

> "You start with a Might of 2 and an Agility of 2, and you can choose one of the following arrays for
> your other characteristic scores:" (arrays "2, −1, −1", "1, 1, −1", "1, 0, 0") —
> `en/unified/md/class/fury.md`, *Basics*

```
Might     = 2                                      (class.fury.fixed-characteristics)
Agility   = 2                                      (class.fury.fixed-characteristics)
Reason, Intuition, Presence = the three values of the chosen array (class.fury.characteristic-array),
                              each assigned to one of the three by class.fury.array-assignment
```

Validity: the assignment must use exactly the multiset of the chosen array, one value per
characteristic (`assignment-mismatch` otherwise). Assignment order is **Open, Q-R-101** (provisional:
any order; raised by R01). Every value is within −5..+5 by construction.

**Ancestry and culture adjustments.** The source defines none for this hero: none of the nine devil
trait entries (`en/unified/md/feature/trait/devil/*.md`) changes a characteristic score, and the
culture benefits are languages, skills and an edge (clean Heroes text, *Culture Benefits*, cited by
R01). The evaluator therefore applies no ancestry or culture characteristic adjustment for a devil.
This is a statement about the pinned content, not a general rule; V08 re-checks it per ancestry.

### 1.2 Level and echelon

> "Each option you can choose for your hero at 1st level includes a parenthetical selection labeled
> "Quick Build."" — `en/unified/md/chapter/making-a-hero.md` (R01's level citation)

> "1st Echelon (1st to 3rd Level)" — `en/unified/md/rule/general/echelon.md`

```
level   = 1          (class.level; v0.01 creates at level one only, docs/character-wizard-spec.md#v001-scope)
echelon = 1          (level 1 is in "1st to 3rd Level")
```

### 1.3 Stamina maximum

> "Starting Stamina at 1st Level: 21" — `en/unified/md/class/fury.md`, *Basics*

> "Your kit's Stamina bonus is added to your Stamina maximum and scales with your echelon." —
> `en/unified/md/chapter/kits.md`, *Stamina Bonus*

> "Stamina Bonus: +9 per echelon" — `en/unified/md/kit/mountain.md`, *Kit Bonuses*

```
staminaMaximum = classStartingStamina (21, class.fury.baseline)
               + kitStaminaBonusPerEchelon × echelon (9 × 1 = 9, kit.mountain.contributions)
               = 30
```

Interpretation: "Starting Stamina at 1st Level" is the class contribution to the Stamina *maximum*
(the kit sentence adds to "your Stamina maximum"; *Heroic Advancement* says "Each time you gain a new
level in your class, your Stamina increases", `chapter/making-a-hero.md`). Alternative considered:
reading it as a current value only; rejected because nothing else would define the maximum. At the
1st echelon "+9 per echelon" yields 9 under either reading of "per echelon" (9 × echelon number, or 9
at each echelon), so no question is needed at level one; V08 settles the scaling reading. Stamina
gained at 2nd and higher levels ("9") is out of scope.

### 1.4 Recoveries and recovery value

> "Each hero has a number of Recoveries determined by their class. A hero also has a recovery value
> that equals one-third of their Stamina maximum, rounded down." — `en/unified/md/rule/health/recoveries.md`

> "Recoveries: 10" — `en/unified/md/class/fury.md`, *Basics*

```
recoveriesMaximum = 10                        (class.fury.baseline)
recoveryValue     = floor(staminaMaximum / 3) = floor(30 / 3) = 10
```

The Mountain kit and the devil traits do not modify Recoveries or the recovery value (no such
sentence in `kit/mountain.md`, `feature/trait/devil/*.md`). R04 section 7 consumes `recoveryValue`
unchanged.

### 1.5 Winded value (restated from R04)

> "Your winded value equals half your Stamina maximum." — `en/unified/md/rule/health/winded.md`

```
windedValue = floor(staminaMaximum / 2) = 15      (R04 section 6.3; rule/general/always-round-down.md)
```

### 1.6 Speed

> "Unless otherwise noted, a character of any of these ancestries is size 1M and has speed 5 and
> stability 0." — `en/unified/md/rule/character/speed.md`, *Starting Size and Speed*

> "Your powerful legs make you faster. You have speed 6." — `en/unified/md/feature/trait/devil/beast-legs.md`

> "Your kit's speed bonus is added to your speed." — `en/unified/md/chapter/kits.md`, *Speed Bonus*

```
speed = 5                                   (ancestry.devil.base-statistics)
        replaced by 6 when Beast Legs is among ancestry.devil.purchased-traits ("You have speed 6.")
        + kitSpeedBonus                     (Mountain: "-" in the Kits table, so 0)
      = 6 with Beast Legs and Mountain; 5 without Beast Legs
```

Order: a "You have speed N" trait sets the value; a kit bonus is then "added to your speed". No v0.01
kit with a speed bonus is supported, so the order has no observable effect in v0.01; it is recorded so
V08 does not have to re-derive it.

### 1.7 Stability

> "Heroes start with stability 0 and can increase their stability through ancestry, class, and kit
> options." and "A creature's stability can't be less than 0, even when reduced by a penalty." —
> `en/unified/md/rule/character/stability.md`

> "Your kit's stability bonus is added to your stability." — `en/unified/md/chapter/kits.md`, *Stability Bonus*

> "Stability Bonus: +2" — `en/unified/md/kit/mountain.md`, *Kit Bonuses*

```
stability = max(0, 0 + kitStabilityBonus) = 0 + 2 = 2
```

No devil trait changes stability.

### 1.8 Size

> "for creatures of size 1, that size is further broken down as 1T, 1S, 1M, or 1L" —
> `en/unified/md/rule/character/size.md`

```
size = "1M"                                 (ancestry.devil.base-statistics, the sentence in 1.6)
```

### 1.9 Disengage

> "When a creature takes the Disengage move action, they can shift 1 square. Certain class features,
> kits, and other rules allow a creature to shift more than 1 square when they disengage." —
> `en/unified/md/feature/common/move-actions/disengage.md`

> "A kit that has a disengage bonus increases the number of squares you can shift when you take the
> Disengage move action" — `en/unified/md/chapter/kits.md`, *Disengage Bonus*

```
disengage = 1 + kitDisengageBonus = 1 + 0 = 1      (Mountain: "-" in the Kits table)
```

The base is a common move action, not a creation decision; its provenance is attached to the
automatic `free-strikes.grant` step as the nearest "every hero has" grant, with a note.

### 1.10 Potencies

> "the value of the potency for your hero's abilities is based on one of your characteristics and
> determined by your class." and "Your weak potency value is equal to your highest characteristic
> score − 2." (average: "− 1"; strong: "equal to your highest characteristic score") —
> `en/unified/md/rule/character/potency.md`

> "Weak Potency: Might − 2", "Average Potency: Might − 1", "Strong Potency: Might" —
> `en/unified/md/class/fury.md`, *Basics*

```
potencyCharacteristic = Might                (class.fury.baseline)
weak = Might − 2 = 0;  average = Might − 1 = 1;  strong = Might = 2
```

The class names Might; the general rule names the highest characteristic. For every level-one Fury
they agree: Might 2 and Agility 2 are fixed and no array value exceeds 2. The divergent
modified-character case is **Open, Q-CHAR-12** (cited, not re-decided); the output carries
`uncertainty: Q-CHAR-12` on `potencyCharacteristic` so the label is visible if a later feature
raises another characteristic.

### 1.11 Heroic resource

> "Within the heat of battle, your determination and anger grow, fueling a Heroic Resource called
> ferocity." — `en/unified/md/feature/fury/level-1/ferocity.md`

> "Though you can't gain ferocity outside of combat" (*Ferocity Outside of Combat*) and "You lose any
> remaining ferocity at the end of the encounter." (*Ferocity in Combat*) — same file

```
heroicResource.name          = "ferocity"     (class.fury.features)
heroicResource.startingValue = 0
```

Interpretation (starting value): the source states no creation value. A newly created hero has been
in no encounter, can gain ferocity only in combat, and loses any remainder when an encounter ends, so
no path leaves a new hero with ferocity. Alternative considered: treating the value as undefined until
first combat; rejected because the sheet must show a number and R03 initializes live resources from
this baseline. In-combat generation is manual in v0.01 (`docs/fury-goblin-automation.md#turn-start-ferocity`);
this value is the creation baseline, not automation.

### 1.12 Saving-throw threshold

> "On a 6 or higher, the effect ends." — `en/unified/md/rule/general/saving-throw.md`

> "Whenever you make a saving throw, you succeed on a roll of 5 or higher." —
> `en/unified/md/feature/trait/devil/impressive-horns.md`

```
savingThrowThreshold = 6, set to 5 when Impressive Horns is among ancestry.devil.purchased-traits
```

R04 section 8 takes this as a supplied fact with its label; it does not change the toggle workflow
(`docs/conditions-and-clock.md#13-ending-conditions`).

### 1.13 Renown and Wealth

> "At the start of character creation, your Renown is 0. Some careers can increase your initial
> Renown score" — `en/unified/md/rule/resource/renown.md`; "Renown: +1" — `en/unified/md/career/soldier.md`

> "Some careers increase your starting Wealth score (from a base score of 1)." —
> `en/unified/md/rule/resource/wealth.md`

```
renown = 0 + 1 = 1          (career.soldier.renown)
wealth = 1                  (Soldier lists no Wealth benefit)
```

Victories ("At the start of an adventure, your hero has 0 Victories.", `rule/resource/victories.md`)
and XP are live values: R03.

### 1.14 Kit contributions

> "A kit can grant a bonus to your Stamina, speed, and stability, as well as the damage and distance
> of your weapon abilities, including your free strikes." — `en/unified/md/chapter/kits.md`, *Kit Bonuses and Traits*

> "If a kit has a melee damage bonus, that bonus is added to the rolled damage of any damage-dealing
> ability with both the Melee and Weapon keywords." (*Damage Bonuses*); "A kit's melee distance bonus
> increases the distance of abilities with the Melee and Weapon keywords." (*Distance Bonus*); "Each
> kit grants a signature ability, whose distance and damage already includes the kit's bonuses."
> (*Kit Signature Ability*) — same file

> "| Mountain | Heavy | Heavy | +9 | - | +2 | +0/+0/+4 | - | - | - | - |" — same file, *Kits Table*
> (columns: Armor, Weapon, Stamina per Echelon, Speed, Stability, Melee Damage, Ranged Damage, Melee
> Distance, Ranged Distance, Disengage)

> "Melee Damage Bonus: +0/+0/+4" and "You wear heavy armor and wield a heavy weapon." —
> `en/unified/md/kit/mountain.md`

```
kit.staminaBonusPerEchelon = 9;  kit.staminaBonusApplied = 9 (echelon 1)
kit.speedBonus = 0;  kit.stabilityBonus = 2;  kit.disengageBonus = 0
kit.meleeDamageBonus = [0, 0, 4];  kit.rangedDamageBonus = [0, 0, 0]
kit.meleeDistanceBonus = 0;  kit.rangedDistanceBonus = 0
```

A "-" cell in the Kits table is 0. The baseline stores the tuple; it does not precompute ability
damage. R04 section 4.2 applies the tuple at roll time (`ActorRollFacts.kitMeleeDamageBonus`), skips
the kit's own signature ability (`kitBonusesIncluded: true` on Pain for Pain) and improvised weapons.
For display, the sheet may show the modified free strike (Melee Weapon Free Strike 2/5/7 + M or A
becomes 2/5/11 + M or A with Mountain; the ranged free strike is unchanged), labeled as a kit
contribution beside the total (`docs/character-sheet-spec.md`).

### 1.15 Granted content

| Group | Rule (source sentence) | R01 decision ids | v0.01 handling |
| --- | --- | --- | --- |
| Skills | Silver Tongue: "You have one skill of your choice from the interpersonal skill group" (`feature/trait/devil/silver-tongue.md`); culture: "You can select one skill from each aspect's list of options." (clean Heroes, *Culture Benefits*); Soldier: "One skill from the exploration skill group and one skill from the intrigue group" (`career/soldier.md`); class: "You gain the Nature skill" and "Then choose any two skills from the exploration or intrigue skill groups." (`class/fury.md`); aspect: "You have the Lift skill." (`feature/fury/level-1/primordial-aspect.md`) | `ancestry.devil.silver-tongue-skill`, `culture.environment.skill`, `culture.organization.skill`, `culture.upbringing.skill`, `career.soldier.skill.exploration`, `career.soldier.skill.intrigue`, `class.fury.skill.nature`, `class.fury.skills`, `class.fury.aspect` | Listed with group; each skill grants the +2 test bonus in R04 section 5 when used. Duplicates: **Open, Q-CHAR-11** (`duplicate-skill` warning). |
| Languages | "All player characters know Caelian!" (clean Heroes, *Caelian Empire*); "You know the language of your culture, in addition to knowing Caelian." (*Culture Benefits*); "Languages: Two languages" (`career/soldier.md`) | `culture.caelian`, `culture.language`, `career.soldier.languages` | Listed. **Confirmed Q-R-100:** Caelian is automatically known and consumes no selectable language slot; the old paid-Caelian duplicate warning is superseded. A `null` slot is a deferred choice (R01) and is not a diagnostic. Pool: Q-R-102. |
| Ancestry traits | "Each ancestry has one or more signature traits, which your hero gets for free if they take that ancestry." (`chapter/ancestries.md`); "You have 3 ancestry points to spend on the following traits." (`feature/trait/devil/devil-traits.md`) | `ancestry.devil.signature-trait`, `ancestry.devil.purchased-traits` | Listed with cost; numeric effects (Beast Legs speed, Impressive Horns saves) feed 1.6 and 1.12; other trait text is manual. Over budget is `invalid` (the source's own example, section 3.3). Unspent points: **Open, Q-CHAR-10** (`budget-unspent` warning until answered). |
| Class features | Advancement table row "1st": "Primordial Aspect, Ferocity, Growing Ferocity, Aspect Features, Aspect Triggered Action, Mighty Leaps, Fury Abilities" (`class/fury.md`) | `class.fury.features` | Ferocity, Growing Ferocity, Mighty Leaps listed with source text; execution manual (`docs/fury-goblin-automation.md`). |
| Aspect features | "Your primordial aspect grants you two features, as shown on the 1st-Level Aspect Features table." (`feature/fury/level-1/1st-level-aspect-features.md`): Berserker = Kit, Primordial Strength; "Your primordial aspect grants you a triggered action, as shown on the Aspect Triggered Actions table." (`aspect-triggered-action.md`): Berserker = Lines of Force | `class.fury.aspect` | Kit feature makes `kit.choice` required; Primordial Strength manual; Lines of Force listed as an ability. |
| Culture benefit | "You gain an edge on tests made to recall lore about your culture, and on tests made to influence and interact with people of your culture." (clean Heroes, *Culture Benefits*) | `culture.edge` | Listed as a feature; manual. |
| Perks | "Perk: One exploration perk" (`career/soldier.md`) | `career.soldier.perk` | Listed with entry text; manual. |
| Abilities | "Choose one signature ability from the following options." / "...each of which costs 3 ferocity to use." / "...5 ferocity to use." (`feature/fury/level-1/fury-abilities.md`); "Every hero has a melee weapon free strike and a ranged weapon free strike." (`chapter/making-a-hero.md`); kit signature ability (`kit/mountain.md`, *Signature Ability*: Pain for Pain) | `class.fury.signature-ability`, `class.fury.ability-3`, `class.fury.ability-5`, `class.fury.aspect`, `kit.mountain.contributions`, `free-strikes.grant` | Listed with kind, fixed cost (`cost:` frontmatter, e.g. "cost: 3 Ferocity") and `kitBonusesIncluded`; R04 resolves rolls; unsupported clauses stay manual. |

Grants from selections the evaluator rejects are not granted: an over-budget purchased-trait set
grants no purchased trait (section 3.3), following "Invalidated selections cannot continue granting
benefits" (`docs/character-wizard-spec.md#3-decision-system`).

### 1.16 Source path corrections

| Listed in the slice | Finding |
| --- | --- |
| `rule/character/*.md` (characteristic, speed, stability, size) | All exist. `rule/character/speed.md` is titled *Starting Size and Speed* and contains the "size 1M and has speed 5 and stability 0" sentence verbatim. R01 and `docs/hero-fixture.md` cite the clean Heroes text for it because the sentence is absent from `chapter/ancestries.md`; the unified rule entry is the same sentence at the same revision and is cited here. `might.md` and the other four characteristic entries add no formula. |
| `rule/health/stamina.md`, `recoveries.md`, `winded.md` | As listed. `stamina.md` states no hero maximum formula; the class and kit sentences supply it. |
| `chapter/kits.md` and the chosen kit entry | As listed. The Kits table is the only place the absent bonuses ("-") of a kit are stated; `kit/mountain.md` frontmatter carries only the present ones. |
| `rule/general/always-round-down.md` | As listed; it governs halving ("Whenever you divide an odd number in half"). The recovery value's rounding is stated directly in `recoveries.md` ("rounded down"). |
| `chapter/making-a-hero.md`, `class/fury.md`, `ancestry/devil.md` | As listed. `ancestry/devil.md` is prose only; the traits are the nine `feature/trait/devil/*.md` entries. |

## 2. Provenance rule

Every value in the derived baseline carries a `provenance` list. Each entry names the **decision id**
that supplied it, the **selected value** when that decision is a choice, and the **source sentence**
(path, revision, verbatim quote, optional heading) that establishes the contribution. Numeric values
additionally record the **operation** (`base`, `add`, `set`, `floor-divide`) and the **amount** in the
order applied, so `staminaMaximum` reads `base 21 (class.fury.baseline) + add 9
(kit.mountain.contributions)`. Values touched by a provisional default carry the open question id as
`uncertainty`; the baseline's `uncertainties` list is the union.

Granted items (skills, languages, traits, features, perks, abilities) carry one provenance entry
each and the entry path whose body is the readable text. The sheet shows the text from that path
through the content pipeline; this document never restates ability text.

A value without provenance is a contract violation, not a default. Where a decision is not a
creation choice (the disengage base, the 6+ save rule), the entry names the nearest automatic step
and says so in `note`.

## 3. Evaluator contract

`shared/contracts/characterEvaluation.ts`. Evaluation is a shared operation
(`docs/character-wizard-spec.md#9-shared-operations-and-reliability`), deterministic for the same
input, and never touches live state (`docs/character-wizard.md#character-model-direction`).

**Input** (`EvaluationInput`): `definitionsSchemaVersion: 'r01.1'`, `compendiumRevision`, `level: 1`,
and `selections`, a map from R01 decision id to a selection value in the R01 JSON shapes (string;
list with `null` for a deferred slot; assignment map).

**Output** (`EvaluationResult`):

- `status`: `complete | incomplete | invalid | unsupported`, the wizard spec's vocabulary.
- `diagnostics`: keyed by decision id; each `Diagnostic` has a severity (`invalid`, `unsupported`,
  `incomplete`, `warning`), a code, a message, the source sentence it rests on and an optional
  question id.
- `baseline`: the `DerivedBaseline`, present only when `status` is `complete`.
- `partial`: the fields derivable from the valid, available selections so far (the wizard's "hero so
  far"), present when the status is not `complete`.
- `evaluatedAgainst`: the definitions version and revision used.

**Status rules** (proposed engineering contract within the spec's vocabulary; labeled as such):

1. A `choice` decision that is available (its `availableWhen` and `dependsOn` are satisfied) and not
   optional with no selection yields `required-choice-missing` (`incomplete`). A `null` slot in a
   `deferrable` multi decision is not missing (R01, *I Speak Their Language*).
2. A selection outside its pool, a wrong slot count, an assignment not matching the chosen array, a
   `points` total over budget, a selection for an unavailable decision, or an unknown decision id
   yields an `invalid` diagnostic.
3. A legal option that R01 marks not supported in v0.01 yields `unsupported-option` (`unsupported`).
4. `status` = `invalid` if any invalid diagnostic; else `unsupported` if any unsupported; else
   `incomplete` if any incomplete; else `complete`. Warnings (`duplicate-language`, `duplicate-skill`,
   `budget-unspent`) never change the status. This precedence is a routine decision so one status is
   reported for a set with several faults (R01's Set C is both over budget and missing choices; it
   reports `invalid`).
5. Grants and derived contributions come only from valid, available selections. Decisions of kind
   `automatic` contribute when their step is available (for example `kit.mountain.contributions` only
   when `kit.choice` is Mountain).
6. The complication step is not presented (Q-CHAR-1, ruling); its absence is never a diagnostic.

**Implementation note, 2026-09-15 (A02):** `shared/evaluate/character.ts` implements this contract and
`tests/character-evaluator.test.ts` checks the three examples below as whole results. Choices the
contract leaves to engineering, labeled: a legal but unsupported option (`unsupported-option`) keeps
the grants the definitions state for it in the partial (a Panther kit lists no kit numbers rather than
invented ones); a value chosen twice in one `multi` or `points` decision is `count-mismatch`; a `null`
slot in a non-deferrable `multi` is `required-choice-missing`; a mismatched definitions version or
revision is reported under the key `definitions`.

## 4. Worked examples

Computed by hand from the sentences in section 1; the same three examples are in
`shared/content/character-evaluation-examples.json` in the contract shape, and
`tests/character-derived-values.test.ts` checks their quotes and numbers against the source files.

**Q-R-100 update, 2026-09-14:** the worked examples below preserve their original fixture snapshot.
Their duplicate paid-Caelian entry, warning and complete-status claim are superseded by the
[confirmed wizard contract](character-wizard-spec.md#3-decision-system). Caelian is shown once as
already known and does not satisfy or consume a culture/career selection. Update the fixture,
JSON mirror and evaluator expectations together through A02; no automatic replacement selection
is implied by the ruling. The arithmetic unrelated to language choices is unchanged.

### 4.1 Complete: the hero fixture (`docs/hero-fixture.md`, Grug; R01 Set A)

Input: R01 `selectionSets["hero-fixture"]`.

| Value | Result | Hand computation and provenance |
| --- | --- | --- |
| Might / Agility | 2 / 2 | `class.fury.fixed-characteristics`: "You start with a Might of 2 and an Agility of 2" |
| Reason / Intuition / Presence | 0 / 1 / 0 | array "1, 0, 0" (`class.fury.characteristic-array`) assigned Intuition 1, Reason 0, Presence 0 (`class.fury.array-assignment`, Q-R-101 provisional) |
| Stamina maximum | 30 | 21 ("Starting Stamina at 1st Level: 21") + 9 ("Stamina Bonus: +9 per echelon" × echelon 1) |
| Recoveries | 10 | "Recoveries: 10" |
| Recovery value | 10 | floor(30 / 3) |
| Winded value | 15 | floor(30 / 2) (R04) |
| Speed | 6 | base 5, set to 6 by Beast Legs ("You have speed 6."), + 0 kit |
| Stability | 2 | 0 + 2 ("Stability Bonus: +2") |
| Size | 1M | "size 1M" |
| Disengage | 1 | 1 + 0 |
| Potency (weak / average / strong) | 0 / 1 / 2 | Might 2 − 2, − 1, − 0 |
| Heroic resource | ferocity, 0 | section 1.11 |
| Saving-throw threshold | 5 | 6 set to 5 by Impressive Horns |
| Renown / Wealth | 1 / 1 | 0 + 1; base 1 |
| Kit | Mountain: Stamina +9 (echelon 1), speed +0, stability +2, melee damage +0/+0/+4, ranged +0/+0/+0, distances +0, disengage +0 | section 1.14 |
| Skills (10) | Persuade, Swim, Blacksmithing, Intimidate, Endurance, Alertness, Nature, Jump, Climb, Lift | one per granting decision; no duplicates, so Q-CHAR-11 is not triggered |
| Languages (4 entries) | Caelian (automatic), Anjali, Caelian (Soldier slot, duplicate), Vaslorian | duplicate kept with a `duplicate-language` warning (Q-R-100 provisional) |
| Traits | Silver Tongue (signature); Beast Legs (1), Impressive Horns (2) = 3 of 3 points | budget exactly spent |
| Features | Culture edge; Ferocity, Growing Ferocity, Mighty Leaps; Kit, Primordial Strength | class table row and aspect table |
| Perks | Teamwork | "Perk: One exploration perk" |
| Abilities (7) | Brutal Slam (signature); Out of the Way! (3 ferocity); Thunder Roar (5 ferocity); Lines of Force (aspect triggered); Pain for Pain (kit signature, bonuses included); Melee Weapon Free Strike; Ranged Weapon Free Strike | |

Status: **complete**. Diagnostics: `career.soldier.languages` → one `warning` (`duplicate-language`,
Q-R-100). Uncertainties carried: Q-R-100, Q-R-101, Q-CHAR-12.

**Fixture check (acceptance check 2).** `docs/hero-fixture.md` states Stamina 30, Recoveries 10,
recovery value floor(30/3) = 10, speed 6 (Beast Legs), stability 2 (Mountain), size 1M, Might 2,
Agility 2, Intuition 1, Reason 0, Presence 0, saves at 5+, Renown +1, the ten skills, the languages
and the five class/aspect/kit abilities. Every number is reproduced above; no fixture number is wrong.
The fixture's "unmodified damage is 5/8/15" for Brutal Slam is R04's arithmetic (section 10.13), not a
baseline value.

### 4.2 Incomplete: missing kit

Input: Set A without `kit.choice`.

Diagnostics:

- `kit.choice` → `incomplete`, `required-choice-missing`: the Berserker aspect grants the Kit feature
  ("You can use and gain the benefits of a kit.", `feature/fury/level-1/kit.md`), so the decision is
  available and required (R01: "no for this class" in the optional column).
- `career.soldier.languages` → the same Q-R-100 warning as 4.1.

Status: **incomplete**. `baseline` is `null`. `partial` carries everything that does not depend on
the kit: level, identity, characteristics, Recoveries 10, speed 6 (base 5 set by Beast Legs; the kit
term is absent), size 1M, potencies 0/1/2, ferocity 0, save threshold 5, Renown 1, Wealth 1, the ten
skills, four language entries, traits, features, the perk, and six abilities (no Pain for Pain).
Stamina maximum, recovery value, winded value, stability, disengage and the kit block are absent
because their formulas read a kit term that does not exist yet; the sheet shows them as pending, not
as 21 or 0 (`docs/character-sheet-spec.md`: "never a displayed zero or an invented formula").

### 4.3 Invalid: over-budget traits

Input: Set A with `ancestry.devil.purchased-traits` = Impressive Horns (2) + Wings (2).

> "But they couldn't select both Impressive Horns and Wings, since their combined cost of 4 exceeds
> the ancestry points budget for the devil." — `en/unified/md/chapter/ancestries.md`, *Ancestry Traits*

Diagnostics:

- `ancestry.devil.purchased-traits` → `invalid`, `budget-exceeded`: 2 + 2 = 4 > 3 (costs from
  `cost: 2 Points` in `impressive-horns.md` and `wings.md`).
- `career.soldier.languages` → the same Q-R-100 warning.

Status: **invalid**. `baseline` is `null`. `partial` is 4.1's baseline with the rejected decision
contributing nothing: speed 5 (no Beast Legs), saving-throw threshold 6 (no Impressive Horns), traits
= Silver Tongue only; Stamina 30, stability 2 and the rest are unchanged because they do not depend
on purchased traits. R01's Set C (over budget and two missing choices) evaluates to `invalid` under
status rule 4 with three diagnostics, matching R01's stated list.

## 5. Ambiguities and questions

Every place the source is silent or ambiguous for these formulas, with its question id. None is
resolved by assumption here; provisional defaults are labeled on the output.

| Id | Where it applies | Status |
| --- | --- | --- |
| Q-R-100 | `career.soldier.languages` duplicate Caelian (4.1) | resolved 2026-09-14; automatic known-language grant, no paid Caelian slot; fixture update remains |
| Q-R-101 | `class.fury.array-assignment` order (1.1) | open; raised by R01; provisional: any order |
| Q-R-102 | language pool (1.15) | open; raised by R01 |
| Q-R-103 | kit eligibility by aspect (`kit.choice`) | open; raised by R01 |
| Q-CHAR-10 | unspent ancestry points (`budget-unspent`) | open; the three examples spend all 3 points or over-spend, so none depends on it |
| Q-CHAR-11 | duplicate skills (`duplicate-skill`) | open; the examples have no duplicate skill |
| Q-CHAR-12 | potency characteristic when another characteristic exceeds the class's (1.10) | open; every level-one Fury agrees, labeled anyway |
| Q-R-3 | Stamina regain cap (R04) | open; consumes `staminaMaximum`, no effect on this document |

No new `Q-R-n` question was needed: every formula in section 1 rests on a quoted sentence, and the two
interpretations (Stamina maximum reading in 1.3, ferocity starting value in 1.11) are labeled with
their alternatives. Q-R-150 onward remains reserved for R02 follow-ups.

## 6. Sources read

All under `vendor/steel-compendium/` at `fb83a789da8f0327a389c277a0c790b1648d5810`:
`en/unified/md/chapter/{making-a-hero,kits,ancestries,classes,the-basics,combat}.md`;
`en/unified/md/class/fury.md`; `en/unified/md/ancestry/devil.md`;
`en/unified/md/feature/trait/devil/{devil-traits,silver-tongue,barbed-tail,beast-legs,glowing-eyes,hellsight,impressive-horns,prehensile-tail,wings}.md`;
`en/unified/md/rule/health/{stamina,recoveries,winded}.md`;
`en/unified/md/rule/character/{characteristic,speed,stability,size,potency}.md`;
`en/unified/md/rule/general/{always-round-down,echelon,saving-throw}.md`;
`en/unified/md/rule/resource/{heroic-resource,renown,wealth,victories,surge,experience}.md`;
`en/unified/md/feature/fury/level-1/{1st-level-aspect-features,aspect-triggered-action,beast-shape,ferocity,fury-abilities,growing-ferocity,kit,mighty-leaps,primordial-aspect,primordial-cunning,primordial-strength,relentless-hunter}.md`;
`en/unified/md/feature/ability/fury/level-1/{lines-of-force,out-of-the-way,thunder-roar}.md` (cost fields);
`en/unified/md/feature/ability/common/{melee-weapon-free-strike,ranged-weapon-free-strike}.md`;
`en/unified/md/feature/common/main-actions/free-strike.md`;
`en/unified/md/feature/common/move-actions/disengage.md`; `en/unified/md/kit/mountain.md`;
`en/unified/md/career/soldier.md`; `en/unified/md/perk/teamwork.md`;
`en/books/heroes/clean/Draw Steel Heroes.md` (*Starting Size and Speed*, *Ancestry Traits*, *Culture
Benefits*, *Caelian Empire*, *Characteristic Scores*).
