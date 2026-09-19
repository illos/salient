# Fury level-one implementation preparation

Prepared 2026-09-19 from local pinned sources for the V47 unit under the
[V44 delivery plan](../build/V44-character-option-delivery.md). This is research and a proposed
implementation plan. It enables no option, changes no evaluator and is not a verification verdict.
Implementation waits for the lead's V46 pilot verdict; see [the slice](../build/V47-fury-level-one.md).

## Source boundary

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Reference structure: Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.
Neither pin was changed, no vendor file was modified and no online source was consulted.

| Purpose | Exact repository source |
| --- | --- |
| Class basics, advancement table, skills | [Fury](../../vendor/steel-compendium/en/unified/md/class/fury.md) |
| Subclass choice and its skill grants | [Primordial Aspect](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-aspect.md) |
| Which two features each aspect grants | [1st-Level Aspect Features](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/1st-level-aspect-features.md) |
| Which triggered action each aspect grants | [Aspect Triggered Action](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/aspect-triggered-action.md) |
| Heroic resource | [Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md) |
| Threshold benefits and their level gates | [Growing Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md) |
| Berserker aspect feature | [Primordial Strength](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-strength.md) |
| Reaver aspect feature | [Primordial Cunning](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-cunning.md) |
| Stormwight aspect features | [Beast Shape](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/beast-shape.md), [Relentless Hunter](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/relentless-hunter.md) |
| Ordinary kit grant | [Kit](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/kit.md) |
| Class-wide jump exception | [Mighty Leaps](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/mighty-leaps.md) |
| Ability pools and their quick builds | [Fury Abilities](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/fury-abilities.md) |
| Printed pool membership and order | `en/books/heroes/clean/Draw Steel Heroes.md` lines 9046–9248 at the pin (read with `git -C vendor/steel-compendium show`) |
| Stormwight kit common features | [Kit Features](../../vendor/steel-compendium/en/unified/md/feature/fury/stormwight-kits/kit-features.md) and the sibling entries in that directory |
| Stormwight kit records | [Boren](../../vendor/steel-compendium/en/unified/md/kit/boren.md), [Corven](../../vendor/steel-compendium/en/unified/md/kit/corven.md), [Raden](../../vendor/steel-compendium/en/unified/md/kit/raden.md), [Vuken](../../vendor/steel-compendium/en/unified/md/kit/vuken.md) |
| Ordinary kit list and rules | [Kits](../../vendor/steel-compendium/en/unified/md/chapter/kits.md) |
| Forge choices and serialization | [Fury](../../vendor/forge-steel/src/data/classes/fury/fury.ts), [Berserker](../../vendor/forge-steel/src/data/classes/fury/berserker.ts), [Reaver](../../vendor/forge-steel/src/data/classes/fury/reaver.ts), [Stormwight](../../vendor/forge-steel/src/data/classes/fury/stormwight.ts), [stormwight kits](../../vendor/forge-steel/src/data/kits/stormwight) |

## Class baseline (already implemented; must be preserved)

| Value | Source statement | Current state |
| --- | --- | --- |
| Fixed characteristics | Might 2, Agility 2 | Implemented as `class.fury.fixed-characteristics` |
| Array choice | `2, −1, −1`; `1, 1, −1`; `1, 0, 0` for the other three | Implemented, all three options enabled |
| Assignment | Any ordering of the chosen array across Reason/Intuition/Presence (Q-R-101) | Implemented |
| Starting Stamina | 21 at 1st level | Implemented |
| Recoveries | 10 | Implemented |
| Potencies | Weak Might − 2, Average Might − 1, Strong Might | Implemented |
| Automatic skill | Nature | Implemented |
| Chosen skills | Any two from the exploration or intrigue groups | Implemented as a choice, but only `Jump` and `Climb` are enabled |
| Class features | Primordial Aspect, Ferocity, Growing Ferocity, Aspect Features, Aspect Triggered Action, Mighty Leaps, Fury Abilities | `Ferocity`, `Growing Ferocity` and `Mighty Leaps` granted; aspect-dependent rows come from the aspect option |

The quick build (Alertness, Jump, Nature; Berserker; Panther; To the Death!; Back!; Blood for Blood!)
is advice in the source, not a separate decision. It is not modelled and should not become one.

## Aspect inventory: every branch this unit must complete

Each aspect grants a skill, two features from the 1st-Level Aspect Features table and one triggered
action from the Aspect Triggered Actions table.

| Aspect | Skill | Features | Triggered action | Growing Ferocity table |
| --- | --- | --- | --- | --- |
| Berserker | Lift (exploration) | Kit, Primordial Strength | Lines of Force | Berserker table, keyed to Might |
| Reaver | Hide (intrigue) | Kit, Primordial Cunning | Unearthly Reflexes | Reaver table, keyed to Agility |
| Stormwight | Track (intrigue) | Beast Shape, Relentless Hunter | Furious Change | Supplied by the chosen stormwight kit, one table per kit |

Level-one heroes reach only the ferocity 2, 4 and 6 rows. The 8, 10 and 12 rows are explicitly
gated to 4th, 7th and 10th level in every table and must not be granted, displayed as active or
carried into the level-two Berserker path this unit must leave unchanged.

### Permanent build effects versus manual gameplay

| Effect | Classification | Reason |
| --- | --- | --- |
| Aspect skill (Lift / Hide / Track) | Permanent build grant | A granted skill on the sheet |
| Kit feature (Berserker, Reaver) | Permanent build grant plus a required kit choice | Feeds Stamina, stability, speed, melee damage and disengage |
| Beast Shape (Stormwight) | Permanent build grant plus a required stormwight kit choice | Same derived contributions, from the stormwight kit bonuses |
| Primordial Strength | Readable feature; manual in play | Conditional extra damage on object strikes and pushes into objects |
| Primordial Cunning | Readable feature; manual in play | "Never surprised" and an optional push→slide substitution |
| Relentless Hunter | Readable feature; manual in play | An edge on Track tests; Salient has no permanent per-skill roll modifier layer at level one |
| Growing Ferocity rows | Readable, threshold-labelled features; manual in play | Conditional on live ferocity, which is play state, not a build value |
| Mighty Leaps | Readable feature; manual in play | Test-outcome floor, resolved at the table |
| Aspect triggered action | Permanent ability grant, manual resolution | The ability belongs on the sheet; its effects are parser/engine scope |
| Signature, 3- and 5-ferocity choices | Permanent ability grants, manual resolution | Same boundary |
| Stormwight animal/hybrid form, Primordial Storm damage type | Readable features; manual in play | Shapeshifting and damage typing are gameplay state |

Relentless Hunter is the one case where I recommend recording an explicit uncertainty rather than
inventing representation: the source grants an edge on Track tests, and Forge models it as a roll
modifier (`createRollModifier`, `RollModifierType.Edge`). Salient has no equivalent permanent
modifier field on the character baseline today. Recommendation: grant it as a readable feature with
its verbatim text this unit, and raise a shared-contract proposal for a sourced test-modifier layer
separately rather than silently dropping or faking the mechanic.

## Ability pools

The unified feature entry for Fury Abilities states the choose-one rule for each pool but omits the
option lists. Membership below is taken from the printed headings in the pinned Heroes book, in
printed order, and cross-checked against each ability entry's `cost` frontmatter. The existing
implementation already records this method in `class.fury.signature-ability.poolSource`.

| Pool | Options (printed order) |
| --- | --- |
| Signature (at will) | Brutal Slam; Hit and Run; Impaled!; To the Death! |
| 3-ferocity heroic | Back!; Out of the Way!; Tide of Death; Your Entrails Are Your Extrails! |
| 5-ferocity heroic | Blood for Blood!; Make Peace With Your God!; Thunder Roar; To the Uttermost End |
| Granted by aspect (not chosen) | Lines of Force (Berserker); Unearthly Reflexes (Reaver); Furious Change (Stormwight) |
| Granted by stormwight kit (not chosen) | Aspect of the Wild, plus that kit's signature ability |

Currently enabled: Brutal Slam, Out of the Way! and Thunder Roar. The other nine choosable
abilities are present as unsupported options and are this unit's main content work.

## Stormwight kits

The stormwight aspect "grants you knowledge of one stormwight kit of your choice"; Beast Shape lets
the hero use stormwight kits. Every stormwight kit shares Aspect Benefits and Animal Form, Aspect of
the Wild, a Primordial Storm damage type, the no-armour unarmed Equipment entry, kit bonuses, a
signature ability and its own Growing Ferocity table.

| Kit | Form | Primordial storm | Kit bonuses | Signature ability |
| --- | --- | --- | --- | --- |
| Boren (bear) | Size 2 in animal and hybrid form, +1 melee weapon distance | Blizzard, cold | Stamina +9/echelon, Stability +2, Melee damage +0/+0/+4 | Bear Claws |
| Corven (crow) | Animal form size 1T and fly; hybrid 1S or 1M | Anabatic Wind, fire | Stamina +3/echelon, Speed +3, Melee damage +2/+2/+2, Disengage +1 | Wing Buffet |
| Raden (rat) | Animal form size 1T, climbs at full speed; hybrid 1S or 1M | Rat Flood, corruption | Stamina +3/echelon, Speed +3, Melee damage +2/+2/+2, Disengage +1 | Driving Pounce |
| Vuken (wolf) | Size 1L in animal and hybrid form, +2 speed, ignores difficult terrain | Lightning Storm, lightning | Stamina +9/echelon, Speed +2, Melee damage +2/+2/+2, Disengage +1 | Unbalancing Attack |

Level-one derived consequences of the kit choice, using the existing generic kit pipeline:
Stamina maximum 21 + (kit Stamina bonus × echelon 1), stability, speed, melee damage bonus and
disengage. A Boren stormwight therefore has Stamina 30 and stability 2 before ancestry and other
contributions; a Corven or Raden stormwight has Stamina 24; a Vuken stormwight has Stamina 30.
Derive each reference build's exact numbers from the source before running the evaluator.

The 4th-level clauses inside Hybrid Form (Boren, Vuken temporary Stamina) and the 4th-level flight
and climbing clauses (Corven, Raden) belong to their own later level unit. Retain the verbatim text
so the sheet is readable, and do not grant or activate the level-gated part at level one.

### Kits a Fury may choose

Interpretation, grounded in the source and labelled as such: Berserker and Reaver receive the
ordinary Kit feature, which points at Chapter 6, and the stormwight kits are introduced only by the
stormwight aspect and Beast Shape. I therefore treat the ordinary 21-kit list as the Berserker and
Reaver pool and the four stormwight kits as the Stormwight pool. The existing `kit.choice` decision
already encodes exactly this split in `optionsByParent`, so this unit changes no structure, only
which options are enabled. The alternative reading — that any fury may select a stormwight kit
because stormwight kits appear in the kit index — is not supported by any text I found, and the
8th-level Menagerie feature ("You can use all stormwight kits") reads as an expansion for the
stormwight itself. If the lead or a rules reviewer disagrees, this is a one-line change to the
enabled option sets, not a structural one.

## Existing implementation inventory and the gap this unit closes

Files that already hold Fury level-one content, after the V45 extraction:

| Path | Holds | V47 change |
| --- | --- | --- |
| `shared/content/classes/fury/level-one.ts` | All `class.fury.*` level-one rows and the class profile | Enable every aspect, ability and skill option; add the aspect-dependent grants each branch is missing |
| `shared/content/fury-level-one-decisions.json` | Pinned R01 reference, shared pools, `kit.choice` including `pool.kits.stormwight` | Unchanged; it is the pinned artifact |
| `shared/content/supporting-kits.ts` | `SUPPORTING_KITS` and `KIT_BONUS_SOURCES`, already containing all four stormwight kits | Repairs listed below |
| `shared/content/supporting-backgrounds.ts` | V37 extension that sets kit support and creates `kit.<name>.contributions` rows for ordinary kits only | Shared change request: also cover stormwight kits |
| `shared/evaluate/classes/fury.ts` | Subclass, characteristics, vitals and resource contributions | Add nothing aspect-specific unless a branch changes a derived value; verify all three aspects flow through the existing phases |
| `shared/content/character-support.ts` | Level-two gate requiring Fury + Berserker | Unchanged: this is what keeps Reaver and Stormwight out of level two |
| `tests/fixtures/v25-fury.json` | Existing Devil Berserker regression build | Unchanged; it is the carry-forward regression |

Concrete gaps, all of which this unit owns:

1. `class.fury.aspect`: `Reaver` and `Stormwight` are `supportedInV001: false`.
2. `class.fury.signature-ability`, `class.fury.ability-3`, `class.fury.ability-5`: nine of twelve
   options are unsupported.
3. `class.fury.skills`: `supportedInV001` is `['Jump', 'Climb']` against a 22-value legal pool.
4. No kit contribution rows exist for Boren, Corven, Raden or Vuken, and `kit.choice` support is
   overwritten by the V37 extension with the ordinary list only.
5. The aspect option grants list features and the triggered ability, but no aspect currently grants
   its Growing Ferocity table rows as readable, threshold-labelled content.

## Defects found in existing shared data (repairs this unit should request or carry)

These are pre-existing and only become user-visible once stormwight kits are selectable.

1. `SUPPORTING_KITS.Boren` and its siblings carry `tableRow: ''`. The generic kit derivation in
   `shared/evaluate/character.ts` uses `tableRow` as the provenance quote for speed, ranged damage,
   both distance bonuses and disengage. `citeSupportingKit` replaces those sources only where
   `KIT_BONUS_SOURCES` has a non-null entry, and every stormwight kit has `speed: null`,
   `disengage: null`, `rangedDamage: null`, `meleeDistance: null` and `rangedDistance: null`.
   A stormwight build would therefore show empty quotes attributed to `chapter/kits.md`, which has
   no stormwight row at all. Fix by citing that kit's own `kit-bonuses.md` entry with its
   omitted-bonus-means-zero note, which those records already carry in `notes`.
2. `SUPPORTING_KITS.Boren.equipmentText` reads "You wear no armor and use unarmed strikes." The
   source sentence is "You wear no armor and wield only your unarmed strikes—which become
   devastating natural weapons as your ferocity grows." Provenance quotes must be verbatim; correct
   the four stormwight equipment strings before they appear on a sheet.
3. `shared/evaluate/character.ts` `missing()` explains a missing kit only for Berserker and Reaver.
   A Stormwight needs the Beast Shape wording instead. This is a shared file; request it from the
   integration owner rather than editing it unilaterally.

## Shared contracts to request from the integration owner

| Request | Why it cannot live in the class module | Proposed minimal form |
| --- | --- | --- |
| Stormwight kit support and contribution rows | `supporting-backgrounds.ts` (V37) runs after composition and assigns `kitChoice.supportedInV001 = [...ORDINARY_KIT_NAMES]`, replacing anything the class module set | Make that assignment a union with the kits the composed definition already marks supported, and run the existing contribution-row loop over the stormwight names as well |
| Stormwight missing-kit diagnostic | Lives in the shared evaluator | Extend the existing aspect branch with the Stormwight case and its Beast Shape source |
| Stormwight kit provenance repairs | `supporting-kits.ts` is shared V37 data | Fill the null `KIT_BONUS_SOURCES` fields for the four kits and correct the equipment text |
| Duplicate-skill handling for the Fury's two chosen skills | Touches shared pool filtering | See below |

### Duplicate skills

The aspect skills are fixed grants inside `class.fury.aspect` options, so the existing V37
replacement generator in `supporting-replacements.ts` already includes Lift, Hide and Track in its
fixed-skill set and already creates their replacement entitlements. The unresolved case is the
Fury's own two-skill choice, which today has no `ownedPool` filter: with the full pool enabled a
player could choose Lift while playing a Berserker, or choose a skill their culture or career
already granted.

Recommendation, as an engineering choice rather than a rules claim: add
`ownedPool: { kind: 'skill', exclude: true }` to `class.fury.skills`, matching the existing
exclude-known precedent used by V37 (`perk …eidetic-memory.currentSkill`, Linguist languages). The
alternative is to allow the duplicate and generate an any-group replacement under the making-a-hero
rule; that rule is written for gaining the same skill "from two different sources", and reading a
deliberate self-duplicating choice as a route to an any-group skill would be an exploit rather than
a faithful reading. The exclusion must be computed after the aspect grant is composed, because the
aspect skill is what makes the exclusion non-empty. Record the choice in the slice work log, and if
a rules reviewer prefers the replacement route, the change is confined to one decision row.

## Forge Steel structural comparison

Forge places Stamina 21/+9 per level, Recoveries 10, the ferocity resource, both skill features and
the three ability choices at class level one; the kit choice, aspect skill, aspect feature and
triggered action live on the subclass, and the stormwight kit choice is a typed kit choice
(`types: ['Stormwight']`). Growing Ferocity is a `createMultiple` feature holding one
`createHeroicResourceThreshold` per row, which is a useful confirmation that threshold rows are
per-benefit content rather than derived numbers.

Differences to record in the ledger rather than "fix":

- Forge's ferocity gains list start-of-turn 1d3, on-damage 1 and winded/dying 1d3, but not the
  encounter-start gain equal to Victories that the Compendium states. Our build values do not use
  either list; the Compendium wording governs.
- Forge attaches Aspect of the Wild to the Stormwight subclass; the Compendium attaches it to the
  stormwight kit's common features. At level one both produce the same granted ability. Follow the
  Compendium's attribution in our source provenance.
- Forge's Lines of Force and Furious Change spend clauses match the pinned entries verbatim, so no
  ability-text difference was found at this level.

## Proposed reference-build matrix

Every enabled option needs a legal completed Forge counterpart of the same build, per the
[per-option delivery gate](../build/character-verification.md#per-option-delivery-gate). Mutually
exclusive choices need additional builds; compatible options share one. Nine builds cover the unit:

| # | Ancestry | Aspect | Kit | Array | Skills | Signature / 3 / 5 | Covers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Devil (existing `v25-fury.json` path) | Berserker | Mountain | 1, 0, 0 | Jump, Climb | Brutal Slam / Out of the Way! / Thunder Roar | Carry-forward regression; must not change |
| 2 | Devil | Berserker | Panther | 2, −1, −1 | Alertness, Endurance | Hit and Run / Back! / Blood for Blood! | Second array, second ordinary kit, three new abilities |
| 3 | Devil | Reaver | Cloak and Dagger | 1, 1, −1 | Sneak, Swim | Impaled! / Tide of Death / Make Peace With Your God! | Reaver branch, third array, three new abilities |
| 4 | Polder | Reaver | Swashbuckler | 1, 0, 0 | Search, Ride | To the Death! / Your Entrails Are Your Extrails! / To the Uttermost End | Remaining four abilities; ancestry contrast on the same aspect |
| 5 | Polder | Stormwight | Boren | 1, 0, 0 | Gymnastics, Navigate | Brutal Slam / Back! / Thunder Roar | Stormwight branch, Stamina +9 kit, stability bonus |
| 6 | Devil | Stormwight | Corven | 1, 1, −1 | attempt Track, then Heal | Hit and Run / Tide of Death / Blood for Blood! | Speed +3 kit, fly form; Track is already granted by the aspect, so this row exercises duplicate handling |
| 7 | Devil | Stormwight | Raden | 2, −1, −1 | Climb, Escape Artist | Impaled! / Out of the Way! / Make Peace With Your God! | Third stormwight kit, corruption storm |
| 8 | Devil | Stormwight | Vuken | 1, 0, 0 | Jump, plus a skill a career already granted | To the Death! / Your Entrails… / To the Uttermost End | Fourth stormwight kit, lightning storm; second duplicate case, from a non-aspect source |
| 9 | Devil | Berserker, level two | Mountain | as existing `v32-fury-level-two.json` | unchanged | unchanged | Existing level-two compatibility; proves no level-one change leaks |

Builds 6 and 8 deliberately aim the chosen-skill step at a skill the build already has, from the
aspect and from a career respectively, to prove the duplicate handling. Capture what Forge does
there and record it: that is the one place the two builders may legitimately differ.

Each row needs: unmodified `.ds-hero` export, readable Forge sheet evidence, normalized selections,
independently source-derived expectations written before running our evaluator, and the Salient
persisted readback. Capture through the pinned Forge application on CT114 under the
[capture-mode clarification](../build/character-verification.md#2-build-and-capture-the-reference);
fabricating exports or injecting selections into storage is not acceptable evidence.

## Open uncertainties

1. Relentless Hunter's edge has no permanent representation in our baseline today (see above).
   Recorded as an explicit uncertainty; no invented field.
2. Whether a Berserker or Reaver may select a stormwight kit. Interpreted as no, with the source
   reasoning above and the alternative stated.
3. Duplicate-skill policy for the Fury's chosen skills, recommended above as an engineering choice.

None of these blocks preparation, and none is a question for the user in a build thread. If item 2
or 3 is contested during review and the pinned source cannot settle it, append it to
`docs/rules-questions-for-user.md` with the paths read and continue on the rest of the unit.
