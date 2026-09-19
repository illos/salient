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
| Growing Ferocity general rule, plus the Berserker and Reaver tables only | [Growing Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md) |
| Per-kit Growing Ferocity tables, kit bonuses, forms, storms and aspect benefits | `en/unified/md/feature/fury/<kit>/` for [boren](../../vendor/steel-compendium/en/unified/md/feature/fury/boren), [corven](../../vendor/steel-compendium/en/unified/md/feature/fury/corven), [raden](../../vendor/steel-compendium/en/unified/md/feature/fury/raden), [vuken](../../vendor/steel-compendium/en/unified/md/feature/fury/vuken) |
| The sentence granting one stormwight kit | `en/unified/md-linked/class/fury.md` and the printed Heroes text; it is **not** in the `stormwight-kits/` entries |
| Stormwight complication exclusion | Slight Case of Lycanthropy, printed Heroes text, `Special:` clause |
| Berserker aspect feature | [Primordial Strength](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-strength.md) |
| Reaver aspect feature | [Primordial Cunning](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-cunning.md) |
| Stormwight aspect features | [Beast Shape](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/beast-shape.md), [Relentless Hunter](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/relentless-hunter.md) |
| Ordinary kit grant | [Kit](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/kit.md) |
| Class-wide jump exception | [Mighty Leaps](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/mighty-leaps.md) |
| Ability pools and their quick builds | [Fury Abilities](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/fury-abilities.md) |
| Printed pool membership and order | `en/books/heroes/clean/Draw Steel Heroes.md` lines 9046–9247 at the pin (read with `git -C vendor/steel-compendium show`) |
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
| Chosen skills | Any two from the exploration or intrigue groups | Implemented and already served in full: `shared/content/supporting-backgrounds.ts` widens every `class.*.skills` choice to all skills after composition, and `optionsFrom` restricts legality to those two groups, so all 22 legal values are offered. The raw module constant still reads `['Jump', 'Climb']`; that is not the effective definition |
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

At level one only the ferocity 2, 4 and 6 benefit rows can apply. The 8, 10 and 12 rows are
explicitly gated to 4th, 7th and 10th level in all six tables and must not be granted, displayed as
active or carried into the level-two Berserker path this unit must leave unchanged. The gate is on
which benefit rows apply, not on the resource value: a level-one fury can hold more than 6 ferocity,
since they gain 1d3 per turn and start an encounter with ferocity equal to their Victories.

### Permanent build effects versus manual gameplay

| Effect | Classification | Reason |
| --- | --- | --- |
| Aspect skill (Lift / Hide / Track) | Permanent build grant | A granted skill on the sheet |
| Kit feature (Berserker, Reaver) | Permanent build grant plus a required kit choice | Feeds Stamina, stability, speed, melee damage and disengage |
| Beast Shape (Stormwight) | Permanent build grant plus a required stormwight kit choice | Same derived contributions, from the stormwight kit bonuses |
| Primordial Strength | Readable feature; manual in play | Conditional extra damage on object strikes and pushes into objects |
| Primordial Cunning | Readable feature; manual in play | "Never surprised" and an optional push→slide substitution |
| Relentless Hunter | Readable feature; manual in play | The edge on Track tests is explicit in the source; it is applied at the table, like Devil Silver Tongue's negotiation edge |
| Growing Ferocity rows | Readable, threshold-labelled features; manual in play | Conditional on live ferocity, which is play state, not a build value |
| Mighty Leaps | Readable feature; manual in play | Test-outcome floor, resolved at the table |
| Aspect triggered action | Permanent ability grant, manual resolution | The ability belongs on the sheet; its effects are parser/engine scope |
| Signature, 3- and 5-ferocity choices | Permanent ability grants, manual resolution | Same boundary |
| Stormwight animal/hybrid form, Primordial Storm damage type | Readable features; manual in play | Shapeshifting and damage typing are gameplay state |

Relentless Hunter's source is unambiguous — "You gain an edge on tests made using the Track skill" —
so this is a representation question, not a rules one. Salient has no permanent per-skill roll
modifier field today, and it does not need one here: the established precedent is Devil's Silver
Tongue, whose conditional negotiation-discovery edge is granted as sourced content and applied
manually at the table, with no modifier field invented for it. Proposed narrow representation for
this unit: grant Relentless Hunter as a feature carrying its verbatim source text and an explicit
manual-application note naming the Track skill, so the sheet states the edge and the Director
applies it. That is the whole mechanic at build level; automatic test resolution belongs to the
engine track and its absence is not a missing part of this unit. Do not describe the edge as
unsupported or omit it from the sheet.

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
the hero use stormwight kits. That sentence is **not** in the unified `stormwight-kits/` entries: it
appears in `en/unified/md-linked/class/fury.md`, `en/unified/md-linked/chapter/classes.md` and the
printed Heroes text. Cite one of those for it, not `kit-features.md`.

Note on where the figures live. `en/unified/md/kit/boren.md` and its three siblings contain only
flavour and the kit's signature ability. **Every** bonus, form, storm, aspect-benefit and Growing
Ferocity figure below comes from `en/unified/md/feature/fury/<kit>/`:
[boren](../../vendor/steel-compendium/en/unified/md/feature/fury/boren),
[corven](../../vendor/steel-compendium/en/unified/md/feature/fury/corven),
[raden](../../vendor/steel-compendium/en/unified/md/feature/fury/raden) and
[vuken](../../vendor/steel-compendium/en/unified/md/feature/fury/vuken), each holding
`kit-bonuses.md`, `aspect-benefits.md`, `animal-form-*.md`, `hybrid-form-*.md`,
`primordial-storm-*.md` and `growing-ferocity.md`. Provenance must cite those paths.

Every stormwight kit shares Aspect Benefits and Animal Form, Aspect of the Wild, a Primordial Storm
damage type, the no-armour unarmed Equipment entry, kit bonuses, a signature ability and its own
Growing Ferocity table.

### Unconditional kit bonuses (permanent build contributions)

Kit Bonuses "apply in your true form, your animal form, and your hybrid form"
(`feature/fury/stormwight-kits/kit-bonuses.md`), so every figure in this table is unconditional.

| Kit | Stamina/echelon | Stability | Speed | Melee damage | Disengage | Primordial storm | Signature ability |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Boren (bear) | +9 | +2 | — | +0/+0/+4 | — | Blizzard, cold | Bear Claws |
| Corven (crow) | +3 | — | +3 | +2/+2/+2 | +1 | Anabatic Wind, fire | Wing Buffet |
| Raden (rat) | +3 | — | +3 | +2/+2/+2 | +1 | Rat Flood, corruption | Driving Pounce |
| Vuken (wolf) | +9 | — | +2 | +2/+2/+2 | +1 | Lightning Storm, lightning | Unbalancing Attack |

Equipment — no armour, unarmed strikes only — is likewise unconditional (`…/equipment.md`), and it
is what makes the printed signature values correct without separate weapon data. Primordial Storm
sets a damage type used by some abilities; at level one it grants no immunity, and the immunity that
later features refer back to is not a level-one effect.

### Always-available Aspect Benefits (one per kit, not form-gated)

"Your primordial aspect benefits are always available to you, and you gain additional benefits while
in the animal or hybrid form" (`…/aspect-benefits-and-animal-form.md`). These are always-on readable
content and must not be filed under the forms.

| Kit | Aspect Benefits, always available |
| --- | --- |
| Boren | Forced-movement push may be a pull instead; when pulling a creature adjacent with M < AVERAGE, a free triggered action makes it grabbed |
| Corven | Edge on tests to hide and sneak; when falling, a free triggered action to use Aspect of the Wild |
| Raden | Edge on tests to hide and sneak; **ignores difficult terrain unconditionally** |
| Vuken | After using Knockback, may use Aid Attack as a free triggered action |

### Form-conditional effects (only while transformed)

| Kit | Animal form | Hybrid form |
| --- | --- | --- |
| Boren | Size 2; +1 bonus to distance with melee weapon abilities | Size 2; same +1 distance; 4th-level temporary Stamina clause |
| Corven | Size 1T; can fly; Hide as a free maneuver; may use allies as cover when hiding; **cannot use any ability except Aspect of the Wild** | Size 1S or 1M; 4th-level flight clause |
| Raden | Size 1T; automatically climbs at full speed while moving; Hide as a free maneuver; allies as cover; stays hidden moving through occupied squares; edge on tests to climb creatures; **cannot use any ability except Aspect of the Wild** | Size 1S or 1M; 4th-level climbing clause |
| Vuken | Size 1L; +2 bonus to speed; ignores difficult terrain | Size 1L; +2 bonus to speed; ignores difficult terrain; 4th-level temporary Stamina clause |

**Vuken has two separate +2 speed figures** and they must not be conflated: an unconditional kit
Speed Bonus of +2 in `vuken/kit-bonuses.md`, and a further "+2 bonus to speed" that applies only
while in wolf or hybrid form. Only the first is a permanent build contribution. Adding them once at
build time, or double-counting them, are both wrong.

Level-one derived consequences of the kit choice, using the existing generic kit pipeline:
Stamina maximum 21 + (kit Stamina bonus × echelon 1), stability, speed, melee damage bonus and
disengage. A Boren stormwight therefore has Stamina 30 and stability 2 before ancestry and other
contributions; a Corven or Raden stormwight has Stamina 24; a Vuken stormwight has Stamina 30.
Derive each reference build's exact numbers from the source before running the evaluator.

The 4th-level clauses inside Hybrid Form (Boren, Vuken temporary Stamina) and the 4th-level flight
and climbing clauses (Corven, Raden) belong to their own later level unit. Retain the verbatim text
so the sheet is readable, and do not grant or activate the level-gated part at level one.

### Stormwight excludes one complication

The printed Slight Case of Lycanthropy complication carries: "**Special:** You can't take this
complication if you are a fury with the stormwight primordial aspect." Salient enables all
complications, and the entry records this only as narrative `conditionalText` with no availability
rule or validation anywhere in `shared/evaluate/`. Enabling the Stormwight aspect therefore makes an
explicitly illegal combination selectable and undiagnosed. This unit must add the eligibility rule
and its diagnostic, with a negative test, and the same seam should be checked for any other
complication whose Special clause names a class or subclass.

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
| `shared/content/classes/fury/level-one.ts` | All `class.fury.*` level-one rows and the class profile | Enable every aspect and ability option; add the aspect-dependent grants each branch is missing; apply the settled duplicate policy to the skill choice |
| `shared/content/fury-level-one-decisions.json` | Pinned R01 reference, shared pools, `kit.choice` including `pool.kits.stormwight` | Unchanged; it is the pinned artifact |
| `shared/content/supporting-kits.ts` | `SUPPORTING_KITS` and `KIT_BONUS_SOURCES`, already containing all four stormwight kits with correct figures; `STORMWIGHT_KIT_NAMES` is exported but referenced nowhere | Repairs listed below; wire the stormwight names into the contribution rows |
| `shared/content/supporting-backgrounds.ts` | V37 extension that widens class skill choices, sets kit support and creates `kit.<name>.contributions` rows for ordinary kits only | This unit extends it to cover stormwight kits, after claiming the file |
| `shared/evaluate/classes/fury.ts` | Subclass, characteristics, vitals and resource contributions | Add nothing aspect-specific unless a branch changes a derived value; verify all three aspects flow through the existing phases |
| `shared/content/character-support.ts` | Level-two gate requiring Fury + Berserker | Unchanged: this is what keeps Reaver and Stormwight out of level two |
| `tests/fixtures/v25-fury.json` | Existing Devil Berserker regression build | Unchanged; it is the carry-forward regression |

Concrete gaps, all of which this unit owns. Each was checked against the assembled definitions
rather than the raw module constants:

1. `class.fury.aspect`: `Reaver` and `Stormwight` are `supportedInV001: false`, and no later
   extension widens aspect options.
2. `class.fury.signature-ability`, `class.fury.ability-3`, `class.fury.ability-5`: nine of twelve
   options are unsupported, and the skill-widening loop deliberately excludes classes, subclasses
   and abilities.
3. No kit contribution rows exist for Boren, Corven, Raden or Vuken, and `kit.choice` support is
   replaced by the V37 extension with the ordinary list only. Because the evaluator gates all kit
   contributions on that row, a stormwight kit currently yields no Stamina, stability, disengage,
   speed term or kit signature ability, with no diagnostic; see defect 1 below.
4. The aspect option grants list features and the triggered ability, but no aspect currently grants
   its Growing Ferocity table rows as readable, threshold-labelled content. Provenance for those
   rows belongs to the aspect *feature* entries — `primordial-strength.md`, `primordial-cunning.md`
   and each `feature/fury/<kit>/growing-ferocity.md` — not to `primordial-aspect.md`, and
   `feature/fury/level-1/growing-ferocity.md` holds the general rule plus the Berserker and Reaver
   tables only.
5. Enabling Stormwight exposes an unenforced eligibility rule: the Slight Case of Lycanthropy
   complication cannot be taken by a stormwight fury, and nothing validates that today.

**Not a gap, corrected 2026-09-19:** `class.fury.skills` is already served with all 22 legal values.
(The widening sets support for all 57 skill names; the decision's pool keeps the legal set at the 22
exploration and intrigue values, so the extra names are unreachable here.)
An earlier draft of this document read `supportedInV001: ['Jump', 'Climb']` from the module file and
reported it as a gap. `shared/content/supporting-backgrounds.ts` widens every `class.*.skills`
choice to all skills after composition, and the decision's pool restricts legality to exploration
and intrigue. Verify assembled definitions, not module constants; `character-options.md` says so
explicitly. What this unit does owe the skill choice is the duplicate policy below.

## Defects found in existing shared data (repairs this unit carries)

These are pre-existing and become user-visible the moment stormwight kits are selectable. This unit
writes the repairs itself after claiming the shared files through the lead. The first is the
serious one.

1. **A stormwight kit currently contributes nothing at all, silently.** `Evaluation.kit()` requires
   an available `kit.<name>.contributions` decision, and the V37 extension generates those rows only
   for `ORDINARY_KIT_NAMES`; `STORMWIGHT_KIT_NAMES` is exported and never referenced anywhere in the
   repository. With a Stormwight who has chosen Boren, `kit()` returns `undefined`, so
   `staminaMaximum` is never set — and with it recovery value, winded value and the level-two +9 —
   `stability` and `disengage` are never set, `speed` loses its kit term, `out.kit` is absent and the
   kit's signature ability is not listed. No diagnostic reports any of this: `missing()` fires only
   when `kit.choice` is unselected. The gap is masked today only because the Stormwight aspect is
   itself unsupported, which forces the partial-baseline return path, so the baseline-keys contract
   check never runs. Enabling the aspect without adding these rows would ship a character sheet with
   no Stamina.
2. **Empty provenance quotes behind that gate.** All four stormwight entries carry `tableRow: ''`,
   correctly, since they have no row in the ordinary Kits table. `citeSupportingKit` rewrites a
   provenance source only where `KIT_BONUS_SOURCES` has a non-null entry, so every null field falls
   back to an empty quote attributed to `chapter/kits.md` under the Kits Table heading — a citation
   to a row that does not exist. The null fields differ per kit and an earlier draft of this document
   got them wrong in both directions:

   | Kit | Null `KIT_BONUS_SOURCES` fields needing a real citation |
   | --- | --- |
   | Boren | `speed`, `disengage`, `rangedDamage`, `meleeDistance`, `rangedDistance` |
   | Corven | `stability`, `rangedDamage`, `meleeDistance`, `rangedDistance` |
   | Raden | `stability`, `rangedDamage`, `meleeDistance`, `rangedDistance` |
   | Vuken | `stability`, `rangedDamage`, `meleeDistance`, `rangedDistance` |

   Corven, Raden and Vuken already cite `speed` and `disengage` correctly; Boren already cites
   `stability`. Fix each null field by citing that kit's own `feature/fury/<kit>/kit-bonuses.md`
   entry with its omitted-bonus-means-zero note, which the records already carry in `notes`.
3. **Paraphrased equipment text.** `SUPPORTING_KITS.Boren.equipmentText` reads "You wear no armor and
   use unarmed strikes." The source sentence is "You wear no armor and wield only your unarmed
   strikes—which become devastating natural weapons as your ferocity grows." Provenance quotes must
   be verbatim; correct all four stormwight strings before they appear on a sheet.
4. **Aspect-blind missing-kit diagnostic.** `missing()` in `shared/evaluate/character.ts` explains a
   required kit only for Berserker and Reaver. Stormwight needs the Beast Shape wording.
5. **Stale spec line, for the lead rather than this unit.** `docs/character-wizard-spec.md` still
   records the Q-R-103 note that only Berserker with Mountain is supported, while the V37 code
   supports all 21 ordinary kits. That drift is not V47's to fix, but it should not be cited as
   current behaviour by anyone verifying this unit.

## Shared files to claim, then edit in this unit

These edits are this unit's implementation work. They are claimed through the integration lead
before being written, because V46 may touch the same files; the lead coordinates the claim and
reviews the result rather than authoring it.

| File | Why it cannot live in the class module | Proposed minimal change |
| --- | --- | --- |
| `shared/content/supporting-backgrounds.ts` | It runs after composition and assigns `kitChoice.supportedInV001 = [...ORDINARY_KIT_NAMES]`, replacing anything the class module set | Make that assignment a union with the kits the composed definition already marks supported, and run the existing contribution-row loop over the stormwight names as well |
| `shared/evaluate/character.ts` | The missing-kit diagnostic lives in the shared evaluator | Extend the existing aspect branch with the Stormwight case and its Beast Shape source |
| `shared/content/supporting-kits.ts` | Shared V37 kit data | Fill the null `KIT_BONUS_SOURCES` fields for the four stormwight kits and correct their equipment text |
| `class.fury.skills` duplicate handling | Touches shared pool filtering semantics | See below |

### Duplicate skills: already enforced; only presentation is open

Policy is settled. **Q-CHAR-11** (resolved 2026-09-15, recorded in
[the question log](../rules-questions-for-user.md) and
[the derived-values record](../character-derived-values.md)): resolve fixed grants first, with an
unrestricted replacement for an unavoidable fixed-versus-fixed duplicate; free selections choose
distinct eligible skills that are not already granted, and deliberate duplication does not expand a
printed pool. This is not a rules uncertainty and not a question for the user.

Both halves are already implemented, which an independent inspection of the assembled definitions
confirmed:

- Fixed versus fixed: `supporting-replacements.ts` collects skill grants from both `decision.grants`
  and `option.grants`, so Lift, Hide and Track are already in its fixed-skill set with replacement
  entitlements generated, and `shared/evaluate/character.ts` folds a second fixed copy into the
  replacement's provenance. Enabling Reaver and Stormwight needs no change here; this unit verifies
  it with a test rather than extending it.
- Deliberate chosen duplicate: `shared/evaluate/character.ts` already raises an `invalid`
  `duplicate-skill` diagnostic for a chosen skill that collides with a fixed grant or with another
  chosen skill, drops the value from the returned skill list, and forces the character's overall
  status to invalid. The accounting is order-independent because the fixed set is fully populated
  before chosen skills are scanned.

So V47 owes this area a regression test, not an enforcement mechanism. What remains open is
presentation only: `class.fury.skills` has no `ownedPool`, so the wizard still offers an
already-granted skill as a supported option and fails it after selection, whereas complication skill
choices exclude owned skills from the pool. Adding `ownedPool: { kind: 'skill', exclude: true }`
would make the offered pool match the settled policy and remove a dead-end click; it must narrow the
exploration/intrigue pool rather than replace it, and it must be evaluated against the composed
build, since the aspect grant is what makes the exclusion non-empty. Recommendation: make that
change, because it is small and it removes an inconsistency; it is optional for correctness and can
be dropped from the unit without weakening any gate. Note that the same inconsistency affects
`culture.*.skill` and `career.*.skills`, which are outside this unit.

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

## Proposed counterpart ledger

Scope of the ledger, corrected 2026-09-19: it must witness the options **this unit newly enables**,
each in a completed legal build with an identical Forge counterpart, per the
[per-option delivery gate](../build/character-verification.md#per-option-delivery-gate). Choices the
unit does not newly enable are reused already-verified shared content and are recorded as reused,
not re-witnessed. Illegal, incomplete and duplicate attempts are negative tests, never counterpart
rows, because an unfinished build is not a completed-character target.

Newly enabled, and therefore requiring witnesses — 17 items:

| Group | Items |
| --- | --- |
| Aspects (2) | Reaver, with Hide, Kit, Primordial Cunning, Unearthly Reflexes and the Reaver Growing Ferocity rows; Stormwight, with Track, Beast Shape, Relentless Hunter, Furious Change |
| Abilities (9) | Hit and Run, Impaled!, To the Death!; Back!, Tide of Death, Your Entrails Are Your Extrails!; Blood for Blood!, Make Peace With Your God!, To the Uttermost End |
| Stormwight kits (4) | Boren, Corven, Raden, Vuken, each with its kit bonuses, Aspect Benefits, forms, primordial storm, Growing Ferocity rows, signature ability and Aspect of the Wild |
| Aspect combinations (2) | Reaver with an ordinary kit; Stormwight with a stormwight kit, which is the only aspect/kit pairing not already exercised |

Reused, already verified, recorded as reused: the Berserker aspect and its three enabled abilities,
the 21 ordinary kits, the full exploration/intrigue skill choice, all three characteristic arrays,
cultures, careers, perks and complications. None of these is new content in this unit; its
verification obligation is regression, not fresh counterpart capture.

Five completed builds cover all 17 items:

| # | Ancestry | Aspect | Kit | Signature / 3-ferocity / 5-ferocity | Newly enabled items witnessed |
| --- | --- | --- | --- | --- | --- |
| A | Devil | Reaver | Panther (reused ordinary kit) | Hit and Run / Back! / Blood for Blood! | Reaver aspect and all its grants; 3 abilities; Reaver-with-ordinary-kit pairing |
| B | Polder | Stormwight | Boren | Impaled! / Tide of Death / Make Peace With Your God! | Stormwight aspect and all its grants; Boren; 3 abilities; Stormwight-with-stormwight-kit pairing |
| C | Devil | Stormwight | Corven | To the Death! / Your Entrails Are Your Extrails! / To the Uttermost End | Corven; the remaining 3 abilities |
| D | Devil | Stormwight | Raden | Brutal Slam / Out of the Way! / Thunder Roar (reused trio) | Raden, isolated from ability changes |
| E | Devil | Stormwight | Vuken | Brutal Slam / Out of the Way! / Thunder Roar (reused trio) | Vuken, isolated from ability changes |

Every row is a completed legal build: array, both chosen skills, culture, career and all dependent
selections filled with eligible values, no deferred slot and no deliberate duplicate. Builds D and E
deliberately hold the ability trio constant so any derived difference is attributable to the kit.
Ancestry is varied across A/B so the aspect contributions are observed against two ancestries, per
the [vary-ancestry guidance](../build/character-verification.md#vary-ancestry-as-well-as-class-and-level).

Separate from the ledger, as tests rather than counterparts:

| Case | Kind | Expectation |
| --- | --- | --- |
| Existing Devil Berserker level one (`tests/fixtures/v25-fury.json`) | Regression | Byte-identical evaluation before and after |
| Existing Berserker level two (`tests/fixtures/v32-fury-level-two.json`) | Compatibility regression | Unchanged; Reaver and Stormwight still refused at level two |
| Choosing a skill the aspect already granted | Negative | Refused under Q-CHAR-11; no pool expansion |
| Choosing a skill a career or culture already granted | Negative | Same |
| Berserker or Reaver attempting a stormwight kit, and Stormwight attempting an ordinary kit | Negative | Refused by `optionsByParent` eligibility |
| Changing aspect on a saved build | Behavioural | Obsolete skill, features, triggered action and now-ineligible kit removed; independent choices and authored details kept |
| Missing kit for each aspect | Diagnostic | Aspect-appropriate message, including the Stormwight Beast Shape wording |

Each ledger row needs: unmodified `.ds-hero` export, readable Forge sheet evidence, normalized
selections, independently source-derived expectations written before our evaluator runs, and the
Salient persisted readback. Capture through the pinned Forge application on CT114 under the
[capture-mode clarification](../build/character-verification.md#2-build-and-capture-the-reference);
fabricating exports or injecting selections into storage is not equivalent evidence.

## Open uncertainties

One, and it is an interpretation rather than a gap: whether a Berserker or Reaver may select a
stormwight kit. Read as no, with the source reasoning and the alternative recorded above.

Two items an earlier draft listed here have been removed because they are already settled:
duplicate-skill handling is resolved by Q-CHAR-11 and is implemented, not decided, by this unit;
and Relentless Hunter's edge is explicit in the source, with an established representation
precedent, so it is a representation choice rather than an uncertainty.

Nothing here blocks preparation and nothing is a question for the user in a build thread. If the
stormwight-kit interpretation is contested during review and the pinned source cannot settle it,
append it to [the question log](../rules-questions-for-user.md) with the paths read and a
recommendation, and continue with the rest of the unit.
