# Live-state initialization and engine projection (R03)

Status: rules contract delivered by slice R03 on 2026-09-14; rules review pending (deferred to the
user's audit thread). This document closes readiness-audit gap G3
(`docs/v0.01-readiness-audit.md#g3-new-character-live-state-initialization-and-engine-projection`).
It states, with a source sentence or a cited ruling per value, how a newly approved hero's live play
state is initialized from its R02 derived baseline, what happens to live values when a draft is saved
or a build is re-evaluated, and how the effective build plus live state project into the engine's
combat entity. A Director-controlled creature is projected the same way for symmetry, worked for the
Goblin Warrior. Persisting these values is A02/S02; the projection adapter is A01/A03.

Source: the pinned Steel Compendium at `vendor/steel-compendium`, revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. Paths below are repo-relative, abbreviated with
`SC = vendor/steel-compendium/en/unified/md`. Quotes are verbatim with the Compendium's
`[term](scc.v1:...)` link markup shown as plain words; the worked examples keep the markup byte-exact.
No other source was used. The S01 content snapshot (`shared/content/compendium/`) is the
application's copy of the same files; where an entry exists its `id` is cited beside the file.

Companion artifacts:

- `shared/contracts/liveState.ts` — live values, first-admission values, derived labels, adjustable
  fields, live record and the unreconciled-change type. Types only, no logic.
- `shared/contracts/entities.ts` — `HeroEntity`, `FoeEntity`, ability and feature projections. Types
  only, no logic.
- `tests/live-state-initialization.test.ts` — checks the two worked examples below against the pinned
  files, the content snapshot and R02's example JSON; expected values are read from the source.

Labels: **Source** is quoted Compendium text. **Ruling** is an existing user decision, cited to the
document that records it. **Interpretation** is grounded in cited text and names the alternative
considered. **Open** points to a question id in `docs/rules-questions-for-user.md`; the provisional
default is labeled and carried on the projection as an `uncertainties` entry.

Boundaries: the derived baseline and its formulas are R02 (`docs/character-derived-values.md`); the
Ferocity creation value is R02's interpretation (section 1.11 there) and is referenced, not restated.
Damage application, winded, Slain and Catch Breath arithmetic are R04
(`docs/roll-and-damage-resolution.md`, sections 6 and 7). Condition ids and toggle semantics are R05
(`docs/conditions-and-clock.md`, section 1). Reconciliation of live values when an activated build
changes a maximum is **Open, Q-CHAR-2**, not decided here (section 3).

## 1. Terms

- **Effective build**: the approved build revision a campaign uses for a character
  (`docs/character-wizard-spec.md#7-revision-and-review-lifecycle`).
- **Derived baseline**: the R02 `DerivedBaseline` evaluated from the effective build: maxima, fixed
  values and granted content. Never changed by play.
- **Live state**: the values play changes (`HeroLiveState`, `FoeLiveState`). Changed only through
  registered shared operations that append history events
  (`docs/table-spec.md#persistent-values-and-manual-adjustment-entries`).
- **First admission**: the activation of a character's first effective build in a campaign, which is
  the only event that initializes live state (`docs/character-wizard-spec.md#7-revision-and-review-lifecycle`:
  "Initial admission uses the draft/review/activation path without an existing effective build").
  Combat blocks activation, so first admission never happens during an encounter.
- **Projection**: the read-time construction of a `HeroEntity` or `FoeEntity` from the baseline (or
  content entry) and the live state. It stores nothing.

## 2. Initial values at first admission

### 2.1 Hero

Each value names the baseline field or the constant it takes, then the sentence or ruling that sets it.
The fixture numbers are the R02 complete example (`docs/character-derived-values.md`, section 4.1).

| Live value | Initial value | Fixture | Basis |
| --- | --- | --- | --- |
| `stamina` | `DerivedBaseline.staminaMaximum` | 30 | Source and interpretation, 2.1.1 |
| `temporaryStamina` | 0 | 0 | Source, 2.1.2 |
| `recoveries` | `DerivedBaseline.recoveriesMaximum` | 10 | Source and interpretation, 2.1.3 |
| `heroicResource` | `{ name: baseline.heroicResource.name, current: baseline.heroicResource.startingValue }` | ferocity, 0 | R02 interpretation by reference, 2.1.4 |
| `surges` | 0 | 0 | Source and ruling, 2.1.5 |
| `victories` | 0 | 0 | Source, 2.1.6 |
| `xp` | 0 | 0 | Source and interpretation, 2.1.7 |
| `conditions` | every core condition `false` | nine toggles off | Source and ruling, 2.1.8 |

**2.1.1 Stamina.** Source: "Starting Stamina at 1st Level: 21" (`SC/class/fury.md`, *Basics*);
"Your kit's Stamina bonus is added to your Stamina maximum" (`SC/chapter/kits.md`, *Stamina Bonus*);
"Whenever a creature takes damage, they reduce their Stamina (see below) by an amount equal to the
damage taken." (`SC/rule/damage/damage.md`); "When you finish a respite, you regain all your
Recoveries and Stamina" (`SC/rule/resource/respite.md`). Interpretation: the source names a starting
Stamina and a maximum to which the kit bonus is added, describes Stamina as reduced only by damage and
restored "all" by a respite, and a newly admitted hero has taken no damage; the current value is
therefore the maximum, 21 + 9 = 30 (R02 section 1.3 for the maximum). Alternative considered: current
Stamina 21 with the kit bonus raising only the maximum; rejected because no sentence says a hero begins
below their maximum and "regain all your ... Stamina" treats the maximum as the rested value. This is
the same reading `docs/hero-fixture.md` records ("maximum Stamina 30; current 30").

**2.1.2 Temporary Stamina.** Source: "Some abilities, treasures, and other effects grant a creature
temporary Stamina." and "Unless otherwise indicated, temporary Stamina disappears at the end of an
encounter." (`SC/rule/health/temporary-stamina.md`). Nothing at creation grants it, so the pool is 0.
Ruling: it is a separate Director-editable value on heroes and foes
(`docs/table-spec.md#v001-temporary-stamina`); a sourced grant keeps the greater amount, a Director
edit is a Manual adjustment.

**2.1.3 Recoveries.** Source: "Each hero has a number of Recoveries determined by their class."
(`SC/rule/health/recoveries.md`); "Recoveries: 10" (`SC/class/fury.md`, *Basics*); "Outside of combat,
you can spend as many Recoveries as you have remaining." (`SC/rule/health/recoveries.md`); "When you
finish a respite, you regain all your Recoveries" (`SC/rule/resource/respite.md`). Interpretation: the
class number is the full complement, Recoveries only decrease by being spent, and a newly admitted hero
has spent none, so the current value equals `recoveriesMaximum` (10). Alternative considered: none
that the text supports.

**2.1.4 Heroic resource.** The name and creation value are the baseline's
(`DerivedBaseline.heroicResource`, R02 section 1.11: ferocity, 0, labeled there as an interpretation
with its alternative). This document adds nothing to that reading. Two rules are explicitly *not*
applied by initialization: "At the start of a combat encounter ... you gain ferocity equal to your
Victories. At the start of each of your turns during combat, you gain 1d3 ferocity."
(`SC/feature/fury/level-1/ferocity.md`, *Ferocity in Combat*) are combat events, and in v0.01 every
class-specific grant, threshold and reset is resolved manually through recorded operations
(`docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope`: "Defer unique feature
execution: class-specific resource generation, thresholds and resets"). The counter is editable
(`docs/table-spec.md#persistent-values-and-manual-adjustment-entries`) and is debited by fixed costs
(R04 section 9).

**2.1.5 Surges.** Source: "many abilities granting heroes surges during a battle" and "At the end of
combat, you lose any surges you have remaining." (`SC/rule/resource/surge.md`). No creation grant
exists and none survives an encounter, so the counter starts at 0. Ruling: a persisted, Director-
editable surge counter on the hero sheet with manual gains and spends
(`docs/table-spec.md#v001-surge-tracking`).

**2.1.6 Victories.** Source: "At the start of an adventure, your hero has 0 Victories."
(`SC/rule/resource/victories.md`). Ruling: Victories are a campaign value granted by the Director at
closeout, never awarded automatically (`docs/table-spec.md#formal-encounter-closeout`;
`docs/fury-goblin-automation.md#victories-and-numeric-adjustments`: "do not award merely to fund a
demonstration"), and cleared on detachment (`agent.MD`, *Characters, privacy and inventory*).

**2.1.7 Experience.** Source: "Each time you finish a respite (see below), you gain XP equal to your
Victories, then your Victories reset to 0." (`SC/rule/resource/experience.md`); "The amount of
Experience you gain is cumulative." and the Heroic Advancement Table row "1st | 0-15"
(`SC/chapter/making-a-hero.md`, *Heroic Advancement*). Interpretation: the source states no single
starting number, but XP is gained only at a respite, cumulatively, and a newly created hero has
finished none, so the cumulative total is 0, which lies in the level-one band. Alternative considered:
leaving XP absent until the first respite; rejected because the sheet shows a number and detachment
"clearing campaign XP" presumes a stored value. Nothing in v0.01 changes XP (respite is V01,
advancement V08; a transferred higher-level hero is Q-CHAR-3).

**2.1.8 Conditions.** Source: "Some abilities and other effects apply specific negative effects called
conditions to a creature." (`SC/rule/combat/condition.md`). No creation step applies one, so every
toggle is off. Ruling: one on/off toggle per core condition, nine ids in index order, no duration and
no automatic save (`docs/table-spec.md#v001-manual-condition-tracking`; ids and text in
`shared/content/core-conditions.json`, R05 section 1.1). Winded, dying and unconscious are not
conditions and are not toggles (R05 section 1.1).

### 2.2 Foe (loaded from a content entry)

| Live value | Initial value | Goblin Warrior | Basis |
| --- | --- | --- | --- |
| `stamina` | the printed Stamina | 15 | Source and interpretation, 2.2.1 |
| `temporaryStamina` | 0 | 0 | Source, 2.1.2 (the rule speaks of "a creature") |
| `conditions` | every core condition `false` | nine toggles off | Source and ruling, 2.1.8; the Director toggles foes |

**2.2.1 Stamina.** Source: the stat block prints "**15** Stamina" (frontmatter `stamina: "15"`,
`SC/monster/goblin/statblock/goblin-warrior.md`); "a monster stat block represents a moment in time"
(`SC/chapter/monster-basics.md`, *Every Goblin Has a Story*); for minions "initial Stamina equal to
each individual minion's Stamina multiplied by the number of minions in the squad" (same file,
*Shared Low Stamina*). Interpretation: the printed number is both the maximum (winded reads "half your
Stamina maximum", R04 6.3 applies it to the Goblin Warrior as 15) and the value the creature enters
play with; the minion rule's "initial Stamina equal to each individual minion's Stamina" is the source's
own use of the printed number as the starting pool. Alternative considered: none. This is what
`convex/foes.ts` already does (`live: { stamina: maxStamina, temporaryStamina: 0 }`).

No Recoveries, surges, Victories or XP exist for a foe: "Director-controlled creatures don't have
Recoveries or a recovery value." (`SC/rule/health/stamina.md`, *No Recoveries*); the surge and
Victories rules address heroes and the surge ruling scopes the counter to the hero sheet
(`docs/table-spec.md#v001-surge-tracking`). Malice is the Director's shared encounter pool, not a
creature value (R05 section 3); a printed Malice cost on an ability is metadata, section 4.3.

### 2.3 Labels derived at read time

Never stored, never toggled; recomputed from live values and maxima whenever an entity is read
(`HealthLabels`):

- `windedValue = floor(staminaMaximum / 2)`; `winded = stamina <= windedValue` on ordinary Stamina
  only (R04 6.3; "Temporary Stamina shouldn't be included ... when figuring out a creature's ... winded
  value", `SC/rule/health/temporary-stamina.md`). Fixture: 30 > 15, not winded. Goblin Warrior:
  15 > 7, not winded.
- Hero: `dying = stamina <= 0`, `deadThresholdReached = stamina <= -windedValue` (R04 6.4; labels only,
  hero dying automation deferred, `docs/fury-goblin-automation.md#hero-dying`). Fixture: both false.
- Ordinary foe: `slain = stamina <= 0` (R04 6.4; ruling "0 stamina make the foe show as slain",
  `docs/fury-goblin-automation.md#ordinary-foes-at-zero-stamina`). Goblin Warrior at 15: false.
  **Open, Q-R-200:** whether the label is recomputed from Stamina after a later Director edit above
  zero, or recorded until cleanup. Provisional default: recomputed (the projection derives it), which
  is R04's derivation and the existing engine's behavior (`src/engine.ts`, `syncHealth`).

### 2.4 Values that are not live in v0.01

Renown and Wealth are baseline values (R02 section 1.13); no v0.01 operation changes them and they are
not in the ruling's list of persistent editable values
(`docs/table-spec.md#persistent-values-and-manual-adjustment-entries`), so they are shown from the
baseline and carried on no live record. Should V1 make them live, they initialize from the baseline
values (1 and 1 for the fixture) under the same rule as section 3.

## 3. Draft save and re-evaluation

**In one sentence: saving a draft and re-evaluating a build recompute only the derived baseline and
never read or write live values, which change only through registered table operations; the sole
exception, activating a build that changes a maximum or resource of a hero who already has a live
record, is not decided here and applies no default (Open, Q-CHAR-2).**

Grounds: "Reopening the wizard or recalculating the character must not heal damage, replenish
resources, remove conditions, or erase manual adjustments." and "Treat a build or item change that
affects a resource maximum as a state reconciliation, not an implicit resource reset."
(`docs/character-wizard.md#character-model-direction`); "Save drafts without altering the effective
build." and "It must not replace live state with a stale draft snapshot."
(`docs/character-wizard-spec.md#7-revision-and-review-lifecycle`); "No automatic refresh or
replenishment occurs on viewing or reloading the sheet." (`docs/character-sheet-spec.md#resource-and-condition-interaction`).

Consequences for the application:

1. A draft preview evaluates against the draft and shows the baseline it would produce; it is labeled
   and cannot act at the table (`docs/character-sheet-spec.md#views-permissions-and-persistence`).
2. Activating a later build for a hero with a live record changes the baseline the projection reads
   (new maxima, abilities, kit values) and leaves `HeroLiveState` byte-for-byte as it was. Where the
   new baseline's `staminaMaximum`, `recoveriesMaximum` or `heroicResource` differs from the one the
   live record was initialized or last reconciled against, the activation surfaces an
   `UnreconciledMaximumChange` per field, labeled `Q-CHAR-2`, and applies no arithmetic to the current
   value. Q-CHAR-2's recommendation (preserve damage and spent Recoveries) is a proposal awaiting the
   user, not a default of this contract.
3. Re-admission of a character previously played elsewhere is **Open, Q-R-201** (the
   `docs/character-wizard-spec.md#12-open-decisions` row "Non-campaign live-state transfer on
   detachment/duplication" has no question id yet). The ruling that detachment clears campaign XP and
   Victories stands; the other live values' fate is the question. Not reachable in the v0.01 journey.
4. A build activation is blocked during an encounter, so live values are never reconciled mid-combat.

## 4. `HeroEntity` projection

`shared/contracts/entities.ts`. The projection is built at read time from the effective build's
baseline, the hero's live record, and authored character metadata (including the name). Field names
follow `src/contracts.ts` where the meaning is the same (section 6 has the mapping). Ids in the worked example are placeholders (`grug`,
`example-character`, ...); the persistence layer owns real ids (`docs/engine-architecture.md#proposed-boundaries`).

### 4.1 Identity and baseline values

| Field | From | Note |
| --- | --- | --- |
| `entityId` | engine-owned `CreatureId` (`shared/contracts/clock.ts`) | the clock and history key |
| `characterId`, `campaignId`, `buildRevisionId` | persistence | which build the baseline came from |
| `name` | authored character metadata, supplied separately to the projection adapter | neither `DerivedBaseline` nor `HeroLiveState` carries a name |
| `level`, `ancestry`, `class`, `subclass` | baseline | `level` is `1` in v0.01 |
| `characteristics` | `baseline.characteristics[*].value` | current scores; no v0.01 effect changes them |
| `maxima` | `staminaMaximum`, `recoveriesMaximum`, `recoveryValue`, `windedValue`, `speed`, `stability`, `size` (numeric 1 plus `sizeCategory`), `disengage`, `potencyCharacteristic`, `potency`, `savingThrowThreshold` | plain numbers copied from the `DerivedValue`s |
| `kit` | `baseline.kit` values | the R04 shape (`ActorRollFacts.kitMeleeDamageBonus` reads `meleeDamageBonus`) |
| `live` | the live record | section 2 |
| `labels` | computed | section 2.3 |
| `uncertainties` | `baseline.uncertainties` plus any projection label | R02's ids for the fixture |

### 4.2 Abilities

`abilities` lists every `baseline.abilities` entry in baseline order and nothing else: the R02 grant
rule ("Grants ... come only from valid, available selections", section 3 there) decides what is
granted; the projection only attaches text and metadata. Per ability:

- `abilityId`: the entry's SCC id. Convention (engineering, not source): a stat-block ability uses
  `<stat block scc>/<name slug>`.
- `source`: repo-relative file path, pinned revision and SCC id (`SourceRef`, R04 shape).
- `contentId`: the snapshot entry that carries the text. The kit signature ability has no standalone
  snapshot entry; it is carried by the kit entry (`mcdm.heroes.v1/kit/mountain`, whose text prints
  Pain for Pain under *Signature Ability*), and its `source.path` is the standalone vendor file
  `SC/feature/ability/mountain/pain-for-pain.md`, whose body is the same ability text.
- `text`: the complete source file, byte-exact, frontmatter included (the snapshot's `text`
  convention; "Every used action exposes its complete verbatim source text", `agent.MD`).
- `usage`, `distance`, `target`, `keywords`, `cost`, `roll`, `tiers`, `trigger`, `effects`: the
  frontmatter values as printed (`action_type`, `distance`, `target`, `keywords`, `cost`,
  `effects[].roll`, `tier1`–`tier3`, `trigger`, `effects[].effect` with its printed `name`/`cost` label).
- `metadata`: the R04 `AbilityRollMetadata` subset the printed fields determine: `actionType`
  (`ActionType`), plain keywords, `permittedCharacteristics` from `power_roll_characteristic`
  ("Might or Agility" → `['M', 'A']`), `fixedCost` from `cost` ("3 Ferocity" → `{ resource:
  'ferocity', amount: 3 }`), `kitBonusesIncluded` from the R02 grant. Tier damage expressions are
  the A05 parser's output, not projection metadata.

Fixture list (seven; R02 section 4.1): Brutal Slam (signature), Out of the Way! (3 Ferocity),
Thunder Roar (5 Ferocity), Lines of Force (aspect triggered action), Pain for Pain (kit signature,
`kitBonusesIncluded: true`), Melee Weapon Free Strike, Ranged Weapon Free Strike. Grants the source
does not make are absent: no other Fury signature or heroic ability, no other aspect's triggered
action, no other kit's signature ability.

### 4.3 Features

`features` lists the baseline's traits, features and perks in that order with verbatim text, for
manual resolution (`docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope`). The
culture edge has no unified entry at this pin; its `text` is the byte-exact bullet from
`vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md`, *Culture Benefits* (R01 and
R02 cite the same passage), and it carries no `contentId`.

### 4.4 Worked projection: the hero fixture (Grug, R01 Set A)

Generated from the pinned files, the snapshot entries and R02's complete example; every `text` is
byte-exact and `tests/live-state-initialization.test.ts` checks it.

<!-- example:hero-fixture -->

```json
{
  "$example": "hero-fixture",
  "kind": "hero",
  "side": "heroes",
  "entityId": "grug",
  "characterId": "example-character",
  "campaignId": "example-campaign",
  "buildRevisionId": "example-revision",
  "name": "Grug",
  "level": 1,
  "ancestry": "Devil",
  "class": "Fury",
  "subclass": "Berserker",
  "characteristics": {
    "M": 2,
    "A": 2,
    "R": 0,
    "I": 1,
    "P": 0
  },
  "maxima": {
    "staminaMaximum": 30,
    "recoveriesMaximum": 10,
    "recoveryValue": 10,
    "windedValue": 15,
    "speed": 6,
    "stability": 2,
    "size": 1,
    "sizeCategory": "1M",
    "disengage": 1,
    "potencyCharacteristic": "M",
    "potency": {
      "weak": 0,
      "average": 1,
      "strong": 2
    },
    "savingThrowThreshold": 5
  },
  "kit": {
    "name": "Mountain",
    "contentId": "mcdm.heroes.v1/kit/mountain",
    "staminaBonusApplied": 9,
    "speedBonus": 0,
    "stabilityBonus": 2,
    "meleeDamageBonus": [
      0,
      0,
      4
    ],
    "rangedDamageBonus": [
      0,
      0,
      0
    ],
    "meleeDistanceBonus": 0,
    "rangedDistanceBonus": 0,
    "disengageBonus": 0
  },
  "live": {
    "stamina": 30,
    "temporaryStamina": 0,
    "recoveries": 10,
    "heroicResource": {
      "name": "ferocity",
      "current": 0
    },
    "surges": 0,
    "victories": 0,
    "xp": 0,
    "conditions": {
      "bleeding": false,
      "dazed": false,
      "frightened": false,
      "grabbed": false,
      "prone": false,
      "restrained": false,
      "slowed": false,
      "taunted": false,
      "weakened": false
    }
  },
  "labels": {
    "windedValue": 15,
    "winded": false,
    "dying": false,
    "deadThresholdReached": false
  },
  "abilities": [
    {
      "abilityId": "mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam",
      "name": "Brutal Slam",
      "kind": "signature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam"
      },
      "contentId": "mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam",
      "text": "---\naction_type: '[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)'\nclass: fury\ndistance: '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1'\neffects:\n    - roll: Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might)\n      tier1: 3 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1\n      tier2: 6 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n      tier3: 9 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4\nflavor: The heavy impact of your weapon attacks drives your foes ever back.\nkeywords:\n    - '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)'\n    - '[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)'\n    - Weapon\nlevel: \"1\"\nname: Brutal Slam\npower_roll_characteristic: '[Might](scc.v1:mcdm.heroes.v1/rule.character/might)'\nscc: mcdm.heroes.v1/feature.ability.fury.level-1/brutal-slam\nsubtype: signature\ntarget: One creature or object\ntier1: 3 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1\ntier2: 6 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\ntier3: 9 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4\ntype: ability\n---\n\n\n*The heavy impact of your weapon attacks drives your foes ever back.*\n\n| **[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), Weapon** |                **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|---------------------------|-------------------------------:|\n| **📏 [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1**            |  **🎯 One creature or object** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might):**\n\n- **≤11:** 3 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1\n- **12-16:** 6 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n- **17+:** 9 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4\n",
      "usage": "[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)",
      "distance": "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1",
      "target": "One creature or object",
      "keywords": [
        "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)",
        "[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)",
        "Weapon"
      ],
      "roll": "Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might)",
      "tiers": [
        "3 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 1",
        "6 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2",
        "9 + M damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4"
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Melee",
          "Strike",
          "Weapon"
        ],
        "permittedCharacteristics": [
          "M"
        ],
        "kitBonusesIncluded": false
      }
    },
    {
      "abilityId": "mcdm.heroes.v1/feature.ability.fury.level-1/out-of-the-way",
      "name": "Out of the Way!",
      "kind": "heroic",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/out-of-the-way.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.ability.fury.level-1/out-of-the-way"
      },
      "contentId": "mcdm.heroes.v1/feature.ability.fury.level-1/out-of-the-way",
      "text": "---\naction_type: '[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)'\nclass: fury\ncost: 3 Ferocity\ndistance: '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1'\neffects:\n    - roll: Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might)\n      tier1: 3 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n      tier2: 5 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 3\n      tier3: 8 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 5\n    - effect: When you [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target, you can move into any square they leave. If you take damage from an [opportunity attack](scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack) by moving this way, the target takes the same damage.\n      name: Effect\nflavor: Your enemies will clear your path—whether they want to or not.\nkeywords:\n    - '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)'\n    - '[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)'\n    - Weapon\nlevel: \"1\"\nname: Out of the Way!\npower_roll_characteristic: '[Might](scc.v1:mcdm.heroes.v1/rule.character/might)'\nscc: mcdm.heroes.v1/feature.ability.fury.level-1/out-of-the-way\ntarget: One creature\ntier1: 3 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\ntier2: 5 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 3\ntier3: 8 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 5\ntype: ability\n---\n\n\n*Your enemies will clear your path—whether they want to or not.*\n\n| **[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), Weapon** |     **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|---------------------------|--------------------:|\n| **📏 [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1**            | **🎯 One creature** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might):**\n\n- **≤11:** 3 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n- **12-16:** 5 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 3\n- **17+:** 8 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 5\n\n**Effect:** When you [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target, you can move into any square they leave. If you take damage from an [opportunity attack](scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack) by moving this way, the target takes the same damage.\n",
      "usage": "[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)",
      "distance": "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1",
      "target": "One creature",
      "keywords": [
        "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)",
        "[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)",
        "Weapon"
      ],
      "cost": "3 Ferocity",
      "roll": "Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might)",
      "tiers": [
        "3 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2",
        "5 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 3",
        "8 + M damage; [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) 5"
      ],
      "effects": [
        {
          "label": "Effect",
          "text": "When you [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target, you can move into any square they leave. If you take damage from an [opportunity attack](scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack) by moving this way, the target takes the same damage."
        }
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Melee",
          "Strike",
          "Weapon"
        ],
        "permittedCharacteristics": [
          "M"
        ],
        "fixedCost": {
          "resource": "ferocity",
          "amount": 3
        },
        "kitBonusesIncluded": false
      }
    },
    {
      "abilityId": "mcdm.heroes.v1/feature.ability.fury.level-1/thunder-roar",
      "name": "Thunder Roar",
      "kind": "heroic",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/thunder-roar.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.ability.fury.level-1/thunder-roar"
      },
      "contentId": "mcdm.heroes.v1/feature.ability.fury.level-1/thunder-roar",
      "text": "---\naction_type: '[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)'\nclass: fury\ncost: 5 Ferocity\ndistance: 5 x 1 line within 1\neffects:\n    - roll: Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might)\n      tier1: 6 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n      tier2: 9 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4\n      tier3: 13 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 6\n    - effect: The targets are [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement) one at a time, starting with the target nearest to you, and can be [pushed](scc.v1:mcdm.heroes.v1/movement/forced-movement) into other targets in the same line.\n      name: Effect\nflavor: You unleash a howl that hurls your enemies back.\nkeywords:\n    - Area\n    - '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)'\n    - Weapon\nlevel: \"1\"\nname: Thunder Roar\npower_roll_characteristic: '[Might](scc.v1:mcdm.heroes.v1/rule.character/might)'\nscc: mcdm.heroes.v1/feature.ability.fury.level-1/thunder-roar\ntarget: Each enemy in the area\ntier1: 6 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\ntier2: 9 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4\ntier3: 13 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 6\ntype: ability\n---\n\n\n*You unleash a howl that hurls your enemies back.*\n\n| **Area, [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee), Weapon**    |               **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n|----------------------------|------------------------------:|\n| **📏 5 x 1 line within 1** | **🎯 Each enemy in the area** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might):**\n\n- **≤11:** 6 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2\n- **12-16:** 9 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4\n- **17+:** 13 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 6\n\n**Effect:** The targets are [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement) one at a time, starting with the target nearest to you, and can be [pushed](scc.v1:mcdm.heroes.v1/movement/forced-movement) into other targets in the same line.\n",
      "usage": "[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)",
      "distance": "5 x 1 line within 1",
      "target": "Each enemy in the area",
      "keywords": [
        "Area",
        "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)",
        "Weapon"
      ],
      "cost": "5 Ferocity",
      "roll": "Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might)",
      "tiers": [
        "6 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 2",
        "9 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 4",
        "13 damage; [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) 6"
      ],
      "effects": [
        {
          "label": "Effect",
          "text": "The targets are [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement) one at a time, starting with the target nearest to you, and can be [pushed](scc.v1:mcdm.heroes.v1/movement/forced-movement) into other targets in the same line."
        }
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Area",
          "Melee",
          "Weapon"
        ],
        "permittedCharacteristics": [
          "M"
        ],
        "fixedCost": {
          "resource": "ferocity",
          "amount": 5
        },
        "kitBonusesIncluded": false
      }
    },
    {
      "abilityId": "mcdm.heroes.v1/feature.ability.fury.level-1/lines-of-force",
      "name": "Lines of Force",
      "kind": "aspect-triggered",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/lines-of-force.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.ability.fury.level-1/lines-of-force"
      },
      "contentId": "mcdm.heroes.v1/feature.ability.fury.level-1/lines-of-force",
      "text": "---\naction_type: '[Triggered](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action)'\nclass: fury\ndistance: '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1'\neffects:\n    - effect: You can select a new target of the same [size](scc.v1:mcdm.heroes.v1/rule.character/size) or smaller within [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) to be force moved instead. You become the source of the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement), determine the new target's destination, and can [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target instead of using the original [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) type. Additionally, the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score.\n      name: Effect\n    - cost: Spend 1 Ferocity\n      effect: The [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to twice your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score instead.\nflavor: You redirect the energy of motion.\nkeywords:\n    - Magic\n    - '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)'\nlevel: \"1\"\nname: Lines of Force\nscc: mcdm.heroes.v1/feature.ability.fury.level-1/lines-of-force\nsubclass: berserker\nsubtype: triggered\ntarget: Self or one creature\ntrigger: The target would be [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement).\ntype: ability\n---\n\n\n*You redirect the energy of motion.*\n\n| **Magic, [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)** |               **[Triggered](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action)** |\n|------------------|----------------------------:|\n| **📏 [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1**   | **🎯 Self or one creature** |\n\n**Trigger:** The target would be [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement).\n\n**Effect:** You can select a new target of the same [size](scc.v1:mcdm.heroes.v1/rule.character/size) or smaller within [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) to be force moved instead. You become the source of the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement), determine the new target's destination, and can [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target instead of using the original [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) type. Additionally, the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score.\n\n**Spend 1 Ferocity:** The [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to twice your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score instead.\n",
      "usage": "[Triggered](scc.v1:mcdm.heroes.v1/rule.combat/triggered-action)",
      "distance": "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1",
      "target": "Self or one creature",
      "keywords": [
        "Magic",
        "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)"
      ],
      "trigger": "The target would be [force moved](scc.v1:mcdm.heroes.v1/movement/forced-movement).",
      "effects": [
        {
          "label": "Effect",
          "text": "You can select a new target of the same [size](scc.v1:mcdm.heroes.v1/rule.character/size) or smaller within [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) to be force moved instead. You become the source of the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement), determine the new target's destination, and can [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) the target instead of using the original [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) type. Additionally, the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score."
        },
        {
          "label": "Spend 1 Ferocity",
          "text": "The [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to twice your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score instead."
        }
      ],
      "metadata": {
        "actionType": "triggered action",
        "keywords": [
          "Magic",
          "Melee"
        ],
        "permittedCharacteristics": [],
        "kitBonusesIncluded": false
      }
    },
    {
      "abilityId": "mcdm.heroes.v1/feature.ability.mountain/pain-for-pain",
      "name": "Pain for Pain",
      "kind": "kit-signature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/ability/mountain/pain-for-pain.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.ability.mountain/pain-for-pain"
      },
      "contentId": "mcdm.heroes.v1/kit/mountain",
      "text": "---\naction_type: Main action\ndistance: '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1'\neffects:\n    - roll: Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)\n      tier1: 3 + M or A damage\n      tier2: 5 + M or A damage\n      tier3: 13 + M or A damage\n    - effect: If the target dealt damage to you since the end of your last [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), this [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike) deals additional damage equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score (your choice).\n      name: Effect\nflavor: An enemy who tagged you will pay for that.\nkeywords:\n    - '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)'\n    - '[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)'\n    - Weapon\nkit: mountain\nname: Pain for Pain\npower_roll_characteristic: '[Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)'\nscc: mcdm.heroes.v1/feature.ability.mountain/pain-for-pain\nsubtype: signature\ntarget: One creature\ntier1: 3 + M or A damage\ntier2: 5 + M or A damage\ntier3: 13 + M or A damage\ntype: ability\n---\n\n*An enemy who tagged you will pay for that.*\n\n| **[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), Weapon** |     **Main action** |\n|---------------------------|--------------------:|\n| **📏 [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1**            | **🎯 One creature** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility):**\n\n- **≤11:** 3 + M or A damage\n- **12-16:** 5 + M or A damage\n- **17+:** 13 + M or A damage\n\n**Effect:** If the target dealt damage to you since the end of your last [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), this [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike) deals additional damage equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score (your choice).\n",
      "usage": "Main action",
      "distance": "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1",
      "target": "One creature",
      "keywords": [
        "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)",
        "[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)",
        "Weapon"
      ],
      "roll": "Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)",
      "tiers": [
        "3 + M or A damage",
        "5 + M or A damage",
        "13 + M or A damage"
      ],
      "effects": [
        {
          "label": "Effect",
          "text": "If the target dealt damage to you since the end of your last [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), this [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike) deals additional damage equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score (your choice)."
        }
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Melee",
          "Strike",
          "Weapon"
        ],
        "permittedCharacteristics": [
          "M",
          "A"
        ],
        "kitBonusesIncluded": true
      }
    },
    {
      "abilityId": "mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike",
      "name": "Melee Weapon Free Strike",
      "kind": "free-strike",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/ability/common/melee-weapon-free-strike.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike"
      },
      "contentId": "mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike",
      "text": "---\naction_type: Main action\ndistance: '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1'\neffects:\n    - roll: Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)\n      tier1: 2 + M or A damage\n      tier2: 5 + M or A damage\n      tier3: 7 + M or A damage\nkeywords:\n    - Charge\n    - '[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)'\n    - '[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)'\n    - Weapon\nname: Melee Weapon Free Strike\npower_roll_characteristic: '[Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)'\nscc: mcdm.heroes.v1/feature.ability.common/melee-weapon-free-strike\nsubtype: free-strike\ntarget: One creature or object\ntier1: 2 + M or A damage\ntier2: 5 + M or A damage\ntier3: 7 + M or A damage\ntype: ability\n---\n\n| **Charge, [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), Weapon**  |               **Main action** |\n|------------------------------------|------------------------------:|\n| **📏 [Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1**                     | **🎯 One creature or object** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility):**\n\n- **≤11:** 2 + M or A damage\n- **12-16:** 5 + M or A damage\n- **17+:** 7 + M or A damage\n",
      "usage": "Main action",
      "distance": "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee) 1",
      "target": "One creature or object",
      "keywords": [
        "Charge",
        "[Melee](scc.v1:mcdm.heroes.v1/rule.combat/melee)",
        "[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)",
        "Weapon"
      ],
      "roll": "Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)",
      "tiers": [
        "2 + M or A damage",
        "5 + M or A damage",
        "7 + M or A damage"
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Charge",
          "Melee",
          "Strike",
          "Weapon"
        ],
        "permittedCharacteristics": [
          "M",
          "A"
        ],
        "kitBonusesIncluded": false
      }
    },
    {
      "abilityId": "mcdm.heroes.v1/feature.ability.common/ranged-weapon-free-strike",
      "name": "Ranged Weapon Free Strike",
      "kind": "free-strike",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/ability/common/ranged-weapon-free-strike.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.ability.common/ranged-weapon-free-strike"
      },
      "contentId": "mcdm.heroes.v1/feature.ability.common/ranged-weapon-free-strike",
      "text": "---\naction_type: Main action\ndistance: '[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 5'\neffects:\n    - roll: Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)\n      tier1: 2 + M or A damage\n      tier2: 4 + M or A damage\n      tier3: 6 + M or A damage\nkeywords:\n    - '[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)'\n    - '[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)'\n    - Weapon\nname: Ranged Weapon Free Strike\npower_roll_characteristic: '[Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)'\nscc: mcdm.heroes.v1/feature.ability.common/ranged-weapon-free-strike\nsubtype: free-strike\ntarget: One creature or object\ntier1: 2 + M or A damage\ntier2: 4 + M or A damage\ntier3: 6 + M or A damage\ntype: ability\n---\n\n| **[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged), [Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), Weapon**  |               **Main action** |\n|-----------------------------|------------------------------:|\n| **📏 [Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 5**             | **🎯 One creature or object** |\n\n**[Power Roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility):**\n\n- **≤11:** 2 + M or A damage\n- **12-16:** 4 + M or A damage\n- **17+:** 6 + M or A damage\n",
      "usage": "Main action",
      "distance": "[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged) 5",
      "target": "One creature or object",
      "keywords": [
        "[Ranged](scc.v1:mcdm.heroes.v1/rule.combat/ranged)",
        "[Strike](scc.v1:mcdm.heroes.v1/rule.combat/strike)",
        "Weapon"
      ],
      "roll": "Power Roll + [Might](scc.v1:mcdm.heroes.v1/rule.character/might) or [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility)",
      "tiers": [
        "2 + M or A damage",
        "4 + M or A damage",
        "6 + M or A damage"
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Ranged",
          "Strike",
          "Weapon"
        ],
        "permittedCharacteristics": [
          "M",
          "A"
        ],
        "kitBonusesIncluded": false
      }
    }
  ],
  "features": [
    {
      "featureId": "mcdm.heroes.v1/feature.trait.devil/silver-tongue",
      "name": "Silver Tongue",
      "kind": "ancestry-signature-trait",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/trait/devil/silver-tongue.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.trait.devil/silver-tongue"
      },
      "contentId": "mcdm.heroes.v1/feature.trait.devil/silver-tongue",
      "text": "---\nancestry: devil\nname: 'Signature Trait: Silver Tongue'\nscc: mcdm.heroes.v1/feature.trait.devil/silver-tongue\ntype: trait\n---\n\nYour innate magic allows you to twist how your words are perceived to get a better read on people and convince them to see things your way. You have one skill of your choice from the [interpersonal skill group](scc.v1:mcdm.heroes.v1/skill.group/interpersonal) (see Skills in Chapter 9: [Tests](scc.v1:mcdm.heroes.v1/chapter/tests)), and you gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [tests](scc.v1:mcdm.heroes.v1/rule.test/test) when attempting to discover an [NPC](scc.v1:mcdm.heroes.v1/rule.general/npc)'s motivations and pitfalls during a negotiation (see Chapter 11: [Negotiation](scc.v1:mcdm.heroes.v1/chapter/negotiation)).\n"
    },
    {
      "featureId": "mcdm.heroes.v1/feature.trait.devil/beast-legs",
      "name": "Beast Legs",
      "kind": "ancestry-purchased-trait",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/trait/devil/beast-legs.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.trait.devil/beast-legs"
      },
      "contentId": "mcdm.heroes.v1/feature.trait.devil/beast-legs",
      "text": "---\nancestry: devil\ncost: 1 Point\nname: Beast Legs\nscc: mcdm.heroes.v1/feature.trait.devil/beast-legs\ntype: trait\n---\n\nYour powerful legs make you faster. You have [speed](scc.v1:mcdm.heroes.v1/rule.character/speed) 6.\n"
    },
    {
      "featureId": "mcdm.heroes.v1/feature.trait.devil/impressive-horns",
      "name": "Impressive Horns",
      "kind": "ancestry-purchased-trait",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/trait/devil/impressive-horns.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.trait.devil/impressive-horns"
      },
      "contentId": "mcdm.heroes.v1/feature.trait.devil/impressive-horns",
      "text": "---\nancestry: devil\ncost: 2 Points\nname: Impressive Horns\nscc: mcdm.heroes.v1/feature.trait.devil/impressive-horns\ntype: trait\n---\n\nYour cherished horns are larger than the average [devil's](scc.v1:mcdm.heroes.v1/ancestry/devil), and a hardened representation of your force of will. Whenever you make a [saving throw](scc.v1:mcdm.heroes.v1/rule.general/saving-throw), you succeed on a roll of 5 or higher.\n"
    },
    {
      "featureId": "culture.edge",
      "name": "Culture edge",
      "kind": "culture-benefit",
      "source": {
        "path": "vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/chapter/background"
      },
      "text": "You gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to recall lore about your culture, and on [tests](scc.v1:mcdm.heroes.v1/rule.test/test) made to influence and interact with people of your culture. (See [Edges](scc.v1:mcdm.heroes.v1/rule.dice/edge) and [Banes](scc.v1:mcdm.heroes.v1/rule.dice/bane) in Chapter 1: [The Basics](scc.v1:mcdm.heroes.v1/chapter/the-basics).)"
    },
    {
      "featureId": "mcdm.heroes.v1/feature.fury.level-1/ferocity",
      "name": "Ferocity",
      "kind": "class-feature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.fury.level-1/ferocity"
      },
      "contentId": "mcdm.heroes.v1/feature.fury.level-1/ferocity",
      "text": "---\nclass: fury\nlevel: \"1\"\nname: Ferocity\nscc: mcdm.heroes.v1/feature.fury.level-1/ferocity\ntype: feature\n---\n\nWithin the heat of battle, your determination and anger grow, fueling a [Heroic Resource](scc.v1:mcdm.heroes.v1/rule.resource/heroic-resource) called ferocity.\n\n> **Where's My Maneuver?**\n>\n> Since most other classes get a bespoke maneuver, you might find yourself asking, \"Where's the special maneuver for the [fury](scc.v1:mcdm.heroes.v1/class/fury)?\" The answer is that the class doesn't need its own maneuver, because most of the time, the fantasy of the [fury](scc.v1:mcdm.heroes.v1/class/fury) has them using the [Grab](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/grab) or [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuvers in combat. They're really good at those maneuvers too, so it doesn't make sense to give you another option that you'll rarely or never use.\n\n##### Ferocity in Combat\n\nAt the start of a combat encounter or some other stressful situation tracked in [combat rounds](scc.v1:mcdm.heroes.v1/rule.combat/combat-round) (as determined by the Director), you gain ferocity equal to your [Victories](scc.v1:mcdm.heroes.v1/rule.resource/victories). At the start of each of your [turns](scc.v1:mcdm.heroes.v1/rule.combat/turn) during combat, you gain 1d3 ferocity.\n\nAdditionally, the first time each [combat round](scc.v1:mcdm.heroes.v1/rule.combat/combat-round) that you take damage, you gain 1 ferocity. The first time you become [winded](scc.v1:mcdm.heroes.v1/rule.health/winded) or are [dying](scc.v1:mcdm.heroes.v1/rule.health/dying) in an encounter, you gain 1d3 ferocity.\n\nYou lose any remaining ferocity at the end of the encounter.\n\n##### Ferocity Outside of Combat\n\nThough you can't gain ferocity outside of combat, you can use your [heroic abilities](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability) and effects that cost ferocity without spending it. Whenever you use an ability or effect outside of combat that costs ferocity, you can't use that same ability or effect outside of combat again until you earn 1 or more [Victories](scc.v1:mcdm.heroes.v1/rule.resource/victories) or finish a [respite](scc.v1:mcdm.heroes.v1/rule.resource/respite).\n\nWhen you use an ability outside of combat that lets you spend unlimited ferocity on its effect, such as [To the Uttermost End](scc.v1:mcdm.heroes.v1/feature.ability.fury.level-1/to-the-uttermost-end), you can use it as if you had spent an amount of ferocity equal to your [Victories](scc.v1:mcdm.heroes.v1/rule.resource/victories).\n"
    },
    {
      "featureId": "mcdm.heroes.v1/feature.fury.level-1/growing-ferocity",
      "name": "Growing Ferocity",
      "kind": "class-feature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.fury.level-1/growing-ferocity"
      },
      "contentId": "mcdm.heroes.v1/feature.fury.level-1/growing-ferocity",
      "text": "---\nclass: fury\nlevel: \"1\"\nname: Growing Ferocity\nscc: mcdm.heroes.v1/feature.fury.level-1/growing-ferocity\ntype: feature\n---\n\nYou gain certain benefits in combat based on the amount of ferocity you have (see 1st-Level Aspect Features for details). These benefits last until the end of your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), even if a benefit would become unavailable to you because of the amount of ferocity you spend during your [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn).\n\nSome [Growing Ferocity](scc.v1:mcdm.heroes.v1/feature.fury.boren/growing-ferocity) benefits can be applied only if you are a specific level or higher, with the level of those benefits noted in the various [Growing Ferocity](scc.v1:mcdm.heroes.v1/feature.fury.boren/growing-ferocity) tables in this section.\n\n###### Berserker Growing Ferocity Table\n\n| Ferocity        | Benefit                                                                                                                                                                                                                        |\n|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|\n| 2               | Whenever you use the [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuver, the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score.                                                                                                                 |\n| 4               | The first time you [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) a creature on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), you gain 1 [surge](scc.v1:mcdm.heroes.v1/rule.resource/surge).                                                                                                                                                                |\n| 6               | You gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [Might](scc.v1:mcdm.heroes.v1/rule.character/might) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) and the [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuver.                                                                                                                                                                    |\n| 8 (4th level)   | The first time you [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) a creature on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), you gain 2 [surges](scc.v1:mcdm.heroes.v1/rule.resource/surge).                                                                                                                                                               |\n| 10 (7th level)  | You have a double [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [Might](scc.v1:mcdm.heroes.v1/rule.character/might) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) and the [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuver.                                                                                                                                                              |\n| 12 (10th level) | Whenever you use a [heroic ability](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability), you gain 10 [temporary Stamina](scc.v1:mcdm.heroes.v1/rule.health/temporary-stamina). Additionally, whenever you make a [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) that imposes [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) on a target, the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score. |\n\n###### Reaver Growing Ferocity Table\n\n| Ferocity        | Benefit                                                                                                                                                                                                                          |\n|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|\n| 2               | Whenever you use the [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuver, the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score.                                                                                                                 |\n| 4               | The first time you [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) a creature on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), you gain 1 [surge](scc.v1:mcdm.heroes.v1/rule.resource/surge).                                                                                                                                                                 |\n| 6               | You gain an [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) and the [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuver.                                                                                                                                                                    |\n| 8 (4th level)   | The first time you [slide](scc.v1:mcdm.heroes.v1/movement/forced-movement) a creature on a [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn), you gain 2 [surges](scc.v1:mcdm.heroes.v1/rule.resource/surge).                                                                                                                                                                |\n| 10 (7th level)  | You have a double [edge](scc.v1:mcdm.heroes.v1/rule.dice/edge) on [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) [tests](scc.v1:mcdm.heroes.v1/rule.test/test) and the [Knockback](scc.v1:mcdm.heroes.v1/feature.common.maneuvers/knockback) maneuver.                                                                                                                                                              |\n| 12 (10th level) | Whenever you use a [heroic ability](scc.v1:mcdm.heroes.v1/rule.general/heroic-ability), you gain 10 [temporary Stamina](scc.v1:mcdm.heroes.v1/rule.health/temporary-stamina). Additionally, whenever you make a [power roll](scc.v1:mcdm.heroes.v1/rule.dice/power-roll) that imposes [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) on a target, the [forced movement](scc.v1:mcdm.heroes.v1/movement/forced-movement) [distance](scc.v1:mcdm.heroes.v1/rule.combat/distance) gains a [bonus](scc.v1:mcdm.heroes.v1/rule.dice/bonuses-and-penalties) equal to your [Agility](scc.v1:mcdm.heroes.v1/rule.character/agility) score. |\n"
    },
    {
      "featureId": "mcdm.heroes.v1/feature.fury.level-1/mighty-leaps",
      "name": "Mighty Leaps",
      "kind": "class-feature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/fury/level-1/mighty-leaps.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.fury.level-1/mighty-leaps"
      },
      "contentId": "mcdm.heroes.v1/feature.fury.level-1/mighty-leaps",
      "text": "---\nclass: fury\nlevel: \"1\"\nname: Mighty Leaps\nscc: mcdm.heroes.v1/feature.fury.level-1/mighty-leaps\ntype: feature\n---\n\nYou can't obtain lower than a tier 2 outcome on any [Might](scc.v1:mcdm.heroes.v1/rule.character/might) [test](scc.v1:mcdm.heroes.v1/rule.test/test) made to jump (see Movement Types in Chapter 10: [Combat](scc.v1:mcdm.heroes.v1/chapter/combat)).\n"
    },
    {
      "featureId": "mcdm.heroes.v1/feature.fury.level-1/kit",
      "name": "Kit",
      "kind": "aspect-feature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/fury/level-1/kit.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.fury.level-1/kit"
      },
      "contentId": "mcdm.heroes.v1/feature.fury.level-1/kit",
      "text": "---\nclass: fury\nlevel: \"1\"\nname: Kit\nscc: mcdm.heroes.v1/feature.fury.level-1/kit\ntype: feature\n---\n\nYou can use and gain the benefits of a kit. See Chapter 6: [Kits](scc.v1:mcdm.heroes.v1/chapter/kits) for more information. (*Quick Build:* [Panther](scc.v1:mcdm.heroes.v1/kit/panther).)\n"
    },
    {
      "featureId": "mcdm.heroes.v1/feature.fury.level-1/primordial-strength",
      "name": "Primordial Strength",
      "kind": "aspect-feature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-strength.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/feature.fury.level-1/primordial-strength"
      },
      "contentId": "mcdm.heroes.v1/feature.fury.level-1/primordial-strength",
      "text": "---\nclass: fury\nlevel: \"1\"\nname: Primordial Strength\nscc: mcdm.heroes.v1/feature.fury.level-1/primordial-strength\nsubclass: berserker\ntype: feature\n---\n\nWhenever you damage an object with a weapon [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike), the [strike](scc.v1:mcdm.heroes.v1/rule.combat/strike) deals extra damage equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score. Additionally, whenever you [push](scc.v1:mcdm.heroes.v1/movement/forced-movement) another creature into an object, the creature takes extra damage equal to your [Might](scc.v1:mcdm.heroes.v1/rule.character/might) score.\n\nAs your ferocity grows, you gain benefits as noted on the Berserker [Growing Ferocity](scc.v1:mcdm.heroes.v1/feature.fury.boren/growing-ferocity) table. Benefits are cumulative except where an improved benefit replaces a lesser benefit.\n"
    },
    {
      "featureId": "mcdm.heroes.v1/perk/teamwork",
      "name": "Teamwork",
      "kind": "perk",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/perk/teamwork.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.heroes.v1/perk/teamwork"
      },
      "contentId": "mcdm.heroes.v1/perk/teamwork",
      "text": "---\nflavor: When you take your first turn during any montage test, you can both make a test and assist another hero's test.\nname: Teamwork\nscc: mcdm.heroes.v1/perk/teamwork\ntype: perk\n---\n\nWhen you take your first [turn](scc.v1:mcdm.heroes.v1/rule.combat/turn) during any [montage test](scc.v1:mcdm.heroes.v1/rule.test/montage-test), you can both make a [test](scc.v1:mcdm.heroes.v1/rule.test/test) and assist another hero's [test](scc.v1:mcdm.heroes.v1/rule.test/test).\n"
    }
  ],
  "uncertainties": [
    "Q-R-100",
    "Q-R-101",
    "Q-CHAR-12"
  ]
}
```

## 5. `FoeEntity` projection

Built at read time from the roster instance's content entry (`convex/foes.ts` stores the entry
snapshot and `live`) and the instance's live state.

### 5.1 Identity and printed values

| Field | From | Note |
| --- | --- | --- |
| `entityId`, `foeId`, `campaignId` | engine/persistence | placeholders in the example |
| `contentId`, `name`, `source`, `text` | the content entry | `text` is the complete stat block file, byte-exact; Director-only audience is app policy |
| `level`, `organization`, `role`, `keywords`, `characteristics` | entry `structured` (`level`, `organization`, `role`, `keywords`, `might`..`presence`) | as printed |
| `maxima.staminaMaximum` | `structured.stamina` parsed as a whole number | 2.2.1; "15" |
| `maxima.windedValue` | `floor(staminaMaximum / 2)` | R04 6.3: 7 |
| `maxima.speed`, `stability`, `size`/`sizeCategory` | `structured.speed`, `stability`, `size` | 6, 0, 1 / "1S" |
| `maxima.freeStrike` | `structured.free_strike` | "their stat block notes a Free Strike value representing the amount of damage they deal" (`SC/rule/monster/creature-free-strike.md`); 1; never rolls (R04 4.4) |
| `maxima.immunities`, `weaknesses` | the stat block's Immunity / Weakness cells | "-" in both cells → empty (R04 6.2) |
| `live` | the instance | section 2.2 |
| `labels` | computed | section 2.3, including `slain` |

### 5.2 Abilities and traits

`abilities` are the entry's `features` with `feature_type: "ability"` in printed order: the signature
ability first ("This is the first action that appears in their stat block and is noted as 'Signature
Ability.'", `SC/chapter/monster-basics.md`, *Signature Ability*), then Malice abilities. `kind` is
`signature` or `malice` (a printed cost). `text` is the ability's blockquote block from the stat block
file, byte-exact. `usage`, `distance`, `target`, `keywords`, `cost`, `roll`, `tiers` are the feature's
own fields. `metadata.fixedRollBonus` is the printed "Power Roll + 2" number (R04 1.1) and
`permittedCharacteristics` is empty; `metadata.fixedCost` is `{ resource: 'malice', amount: 2 }` for
Bury the Point, paid from the shared pool (R04 section 9). `traits` are the features with
`feature_type: "trait"` (Crafty), verbatim, manual.

### 5.3 Worked projection: the Goblin Warrior

Every value equals the snapshot entry `mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior`
(`shared/content/compendium/statblock.json`) and the vendor file it was generated from. At zero or
lower Stamina the `slain` label becomes `true` (R04 6.4; ruling above); nothing else changes in the
projection.

<!-- example:goblin-warrior -->

```json
{
  "$example": "goblin-warrior",
  "kind": "foe",
  "side": "director",
  "entityId": "goblin-warrior-1",
  "foeId": "example-foe",
  "campaignId": "example-campaign",
  "contentId": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior",
  "name": "Goblin Warrior",
  "source": {
    "path": "vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md",
    "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
    "id": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior"
  },
  "text": "---\nagility: 2\nev: \"3\"\nfree_strike: 1\nintuition: 0\nkeywords:\n    - Goblin\n    - Humanoid\nlevel: 1\nmight: -2\nmovement: Climb\nname: Goblin Warrior\norganization: Horde\npresence: -1\nreason: 0\nrole: Harrier\nscc: mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior\nsize: 1S\nspeed: 6\nstability: 0\nstamina: \"15\"\ntype: statblock\n---\n\n| Goblin, Humanoid  |           -           |      Level 1      |     Horde Harrier     |         EV 3         |\n|:-----------------:|:---------------------:|:-----------------:|:---------------------:|:--------------------:|\n|  **1S**<br>Size   |    **6**<br>Speed     | **15**<br>Stamina |  **0**<br>Stability   | **1**<br>Free Strike |\n| **-**<br>Immunity | **Climb**<br>Movement |         -         | **-**<br>With Captain |  **-**<br>Weakness   |\n|  **-2**<br>Might  |   **+2**<br>Agility   |  **0**<br>Reason  |  **0**<br>Intuition   |  **-1**<br>Presence  |\n\n> 🗡 **Spear Charge (Signature Ability)**\n>\n> | **Charge, Melee, Strike, Weapon** |               **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n> |-----------------------------------|------------------------------:|\n> | **📏 Melee 1**                    | **🎯 One creature or object** |\n>\n> **Power Roll + 2:**\n>\n> - **≤11:** 3 damage\n> - **12-16:** 4 damage\n> - **17+:** 5 damage\n\n> 🗡 **Bury the Point (2 [Malice](scc.v1:mcdm.monsters.v1/rule.monster/malice))**\n>\n> | **Melee, Strike, Weapon** |     **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n> |---------------------------|--------------------:|\n> | **📏 Melee 1**            | **🎯 One creature** |\n>\n> **Power Roll + 2:**\n>\n> - **≤11:** 5 damage; M < 0 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)\n> - **12-16:** 6 damage; M < 1 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)\n> - **17+:** 7 damage; M < 2 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)\n\n> ⭐️ **Crafty**\n>\n> The warrior doesn't provoke [opportunity attacks](scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack) by moving.\n",
  "level": 1,
  "organization": "Horde",
  "role": "Harrier",
  "keywords": [
    "Goblin",
    "Humanoid"
  ],
  "characteristics": {
    "M": -2,
    "A": 2,
    "R": 0,
    "I": 0,
    "P": -1
  },
  "maxima": {
    "staminaMaximum": 15,
    "windedValue": 7,
    "speed": 6,
    "stability": 0,
    "size": 1,
    "sizeCategory": "1S",
    "freeStrike": 1,
    "immunities": [],
    "weaknesses": []
  },
  "live": {
    "stamina": 15,
    "temporaryStamina": 0,
    "conditions": {
      "bleeding": false,
      "dazed": false,
      "frightened": false,
      "grabbed": false,
      "prone": false,
      "restrained": false,
      "slowed": false,
      "taunted": false,
      "weakened": false
    }
  },
  "labels": {
    "windedValue": 7,
    "winded": false,
    "slain": false
  },
  "abilities": [
    {
      "abilityId": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior/spear-charge",
      "name": "Spear Charge",
      "kind": "signature",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior"
      },
      "contentId": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior",
      "text": "> 🗡 **Spear Charge (Signature Ability)**\n>\n> | **Charge, Melee, Strike, Weapon** |               **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n> |-----------------------------------|------------------------------:|\n> | **📏 Melee 1**                    | **🎯 One creature or object** |\n>\n> **Power Roll + 2:**\n>\n> - **≤11:** 3 damage\n> - **12-16:** 4 damage\n> - **17+:** 5 damage",
      "usage": "Main action",
      "distance": "Melee 1",
      "target": "One creature or object",
      "keywords": [
        "Charge",
        "Melee",
        "Strike",
        "Weapon"
      ],
      "roll": "Power Roll + 2",
      "tiers": [
        "3 damage",
        "4 damage",
        "5 damage"
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Charge",
          "Melee",
          "Strike",
          "Weapon"
        ],
        "permittedCharacteristics": [],
        "fixedRollBonus": 2,
        "kitBonusesIncluded": false
      }
    },
    {
      "abilityId": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior/bury-the-point",
      "name": "Bury the Point",
      "kind": "malice",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior"
      },
      "contentId": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior",
      "text": "> 🗡 **Bury the Point (2 [Malice](scc.v1:mcdm.monsters.v1/rule.monster/malice))**\n>\n> | **Melee, Strike, Weapon** |     **[Main action](scc.v1:mcdm.heroes.v1/rule.combat/turn)** |\n> |---------------------------|--------------------:|\n> | **📏 Melee 1**            | **🎯 One creature** |\n>\n> **Power Roll + 2:**\n>\n> - **≤11:** 5 damage; M < 0 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)\n> - **12-16:** 6 damage; M < 1 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)\n> - **17+:** 7 damage; M < 2 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)",
      "usage": "Main action",
      "distance": "Melee 1",
      "target": "One creature",
      "keywords": [
        "Melee",
        "Strike",
        "Weapon"
      ],
      "cost": "2 Malice",
      "roll": "Power Roll + 2",
      "tiers": [
        "5 damage; M < 0 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)",
        "6 damage; M < 1 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)",
        "7 damage; M < 2 [bleeding](scc.v1:mcdm.heroes.v1/condition/bleeding) (save ends)"
      ],
      "metadata": {
        "actionType": "main action",
        "keywords": [
          "Melee",
          "Strike",
          "Weapon"
        ],
        "permittedCharacteristics": [],
        "fixedRollBonus": 2,
        "fixedCost": {
          "resource": "malice",
          "amount": 2
        },
        "kitBonusesIncluded": false
      }
    }
  ],
  "traits": [
    {
      "featureId": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior/crafty",
      "name": "Crafty",
      "kind": "stat-block-trait",
      "source": {
        "path": "vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md",
        "revision": "fb83a789da8f0327a389c277a0c790b1648d5810",
        "id": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior"
      },
      "contentId": "mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior",
      "text": "> ⭐️ **Crafty**\n>\n> The warrior doesn't provoke [opportunity attacks](scc.v1:mcdm.heroes.v1/rule.combat/opportunity-attack) by moving."
    }
  ],
  "uncertainties": [
    "Q-R-200"
  ]
}
```

## 6. Adoption by the existing engine

`src/contracts.ts` `Entity` is a bounded playtest projection
(`docs/character-wizard.md#character-model-direction`). The mapping below lets A01/A03 build it from
`HeroEntity`/`FoeEntity` without changing either; nothing here asks the engine to change.

| `src/contracts.ts` `Entity` | `HeroEntity` | `FoeEntity` |
| --- | --- | --- |
| `id` | `entityId` | `entityId` |
| `definitionId` | `buildRevisionId` | `contentId` |
| `kind` | `'hero'` | `'monster'` for `'foe'` |
| `side` | `'heroes'` | `'foes'` for `'director'` |
| `level` | `level` | `level` |
| `stamina`, `temporaryStamina` | `live.*` | `live.*` |
| `maxStamina` | `maxima.staminaMaximum` | `maxima.staminaMaximum` |
| `characteristics` | same | same |
| `size`, `sizeCategory`, `stability` | `maxima.*` | `maxima.*` |
| `abilities` (ids) | `abilities[].abilityId` | `abilities[].abilityId` |
| `resources` | `{ [live.heroicResource.name]: live.heroicResource.current }` | `{}` |
| `conditions` | the `true` toggles, `duration` unknown (a toggle has none) | same |
| `traits` (ids) | `features[].featureId` | `traits[].featureId` |
| `meleeDamageBonus` | `kit.meleeDamageBonus` or `[0, 0, 0]` | `[0, 0, 0]` |
| `freeStrikeDamage` | absent (heroes roll) | `maxima.freeStrike` |
| `defeated` | absent | `labels.slain` |
| `fury` | not projected (turn-start bookkeeping is manual in v0.01) | absent |

`AbilitySource` fields (`text`, `usage`, `distance`, `target`, `keywords`, `cost`, `roll`, `tiers`,
`kitBonusesIncluded`) are the same-named `AbilityProjection` fields; `AbilitySource.text` for a hero
ability was the file body in the experiment and is the complete file here (S01 convention).

## 7. Open questions and interpretations

| Id | Where | Status |
| --- | --- | --- |
| Q-CHAR-2 | section 3, `UnreconciledMaximumChange` | open; cited, no default applied |
| Q-R-200 | section 2.3, foe `slain` label after a Director edit above zero | open; raised by R03; provisional: derived from current Stamina |
| Q-R-201 | section 3, live values on re-admission after detachment | open; raised by R03; provisional: none needed in v0.01, recommendation recorded |
| Q-CHAR-3 | section 2.1.7, XP of a transferred higher-level hero | open; cited |
| Q-R-100, Q-R-101, Q-CHAR-12 | carried from the R02 baseline on `uncertainties` | open; R01/V1 research |

Interpretations labeled above with their alternatives: current Stamina equals the maximum (2.1.1);
Recoveries start full (2.1.3); XP starts at 0 (2.1.7); the printed Stamina is a foe's starting value
(2.2.1). Engineering conventions, not source claims: the `abilityId` form for stat-block abilities
(4.2) and the `text` convention (complete file for entries, blockquote block for stat-block features).

Note for S01/A02: the kit signature ability files (`SC/feature/ability/<kit>/*.md`) are not in the
snapshot's `kits` selection; the projection cites the kit entry as `contentId` and the vendor file as
`source`. Adding that directory to the selection would give Pain for Pain its own entry.

## 8. Sources read

All under `vendor/steel-compendium/` at `fb83a789da8f0327a389c277a0c790b1648d5810`:
`en/unified/md/rule/health/{stamina,recoveries,winded,temporary-stamina,dying,falling,suffocating}.md`;
`en/unified/md/class/fury.md`; `en/unified/md/chapter/monster-basics.md` (in full);
`en/unified/md/monster/goblin/statblock/goblin-warrior.md`; `en/unified/md/monster/goblin/goblin-malice.md`;
`en/unified/md/rule/resource/{victories,experience,surge,heroic-resource,respite}.md`;
`en/unified/md/rule/monster/{creature-free-strike,malice}.md`; `en/unified/md/rule/combat/condition.md`;
`en/unified/md/rule/general/echelon.md`; `en/unified/md/chapter/making-a-hero.md` (*Step-by-Step Hero
Making*, *Heroic Advancement*); `en/unified/md/feature/fury/level-1/ferocity.md`;
`en/unified/md/feature/ability/fury/level-1/{brutal-slam,out-of-the-way,thunder-roar,lines-of-force}.md`;
`en/unified/md/feature/ability/mountain/pain-for-pain.md`; `en/unified/md/kit/mountain.md`;
`en/unified/md/feature/ability/common/{melee-weapon-free-strike,ranged-weapon-free-strike}.md`;
`en/unified/md/feature/trait/devil/{silver-tongue,beast-legs,impressive-horns}.md`;
`en/unified/md/feature/fury/level-1/{growing-ferocity,mighty-leaps,kit,primordial-strength}.md`;
`en/unified/md/perk/teamwork.md`; `en/books/heroes/clean/Draw Steel Heroes.md` (*Culture Benefits*).
Snapshot: `shared/content/compendium/{manifest,statblock,ability,kit,feature,trait,perk,condition}.json`.
