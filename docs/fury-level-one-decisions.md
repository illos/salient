# Level-one devil Fury creation decisions

Status: rules contract delivered by slice R01 on 2026-09-14; rules review pending. This document closes
readiness-audit gap G1 (`docs/v0.01-readiness-audit.md#g1-level-one-devil-fury-decision-table`). It is the
sourced definition the minimal wizard (A02) consumes and the input R02 (derived values) builds on. It is a
document plus a machine-readable mirror, not application code.

Source: the pinned Steel Compendium at `vendor/steel-compendium`, revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. S01 (content pipeline) had not landed, so the Markdown was read
directly; every path below is relative to `vendor/steel-compendium/`. No other source was used.

Machine-readable mirror: `shared/content/fury-level-one-decisions.json`. Verification:
`tests/fury-decisions.test.ts` (`node --test tests/fury-decisions.test.ts`).

Scope: the creation steps of *Making a Hero* for one level-one hero whose ancestry is Devil and class is
Fury. Other ancestries, classes and levels are listed only where the source lists them as options of a step,
and are marked unsupported in v0.01. Derived values (Stamina, Recoveries, speed, stability, potencies, kit
arithmetic) are R02; live state is R03; inventory is deferred.

## How to read this document

- **Step** rows follow the Compendium's *Step-by-Step Hero Making* headings in their printed order
  (`en/unified/md/chapter/making-a-hero.md`). The source says the order "is still a suggestion, not a hard
  and fast rule"; the wizard uses it as the presentation order.
- **Decision ids** are stable strings (`step.<name>`, `<step>.<decision>`); never renumber or reuse them.
- **Kind**: `choice` (the player selects), `automatic` (granted with no selection), `authored` (free text,
  non-mechanical), `none` (no selection, no grant).
- **Shape**: `single` (one value), `multi` with `count`, `points` with `budget`, `assignment` (map values to
  targets), `text`, `none`.
- **Supported in v0.01** marks the deliberate one-supported-option subset the v0.01 wizard offers
  (`docs/character-wizard-spec.md#v001-scope`). Every other listed option is in the source pool and is *not*
  offered in v0.01; that is a marking, not an omission. For the budgeted trait choice the supported item is
  one complete *set* that spends the whole budget, not a free spend.
- **Quote** is the source sentence that establishes the count, budget or grant. Quotes are verbatim after the
  normalization in the schema note below.
- **Q-ids** point at `docs/rules-questions-for-user.md`. Nothing listed there is resolved here by assumption;
  where a provisional default is applied it is labeled.

### Schema note for the JSON

`shared/content/fury-level-one-decisions.json`, `schemaVersion` `r01.1`:

- Top level: `compendiumRevision`, `sourceRoot`, `hero`, `textNormalization`, `pools`, `steps`,
  `selectionSets`, `questions`.
- `pools.<id>`: `{ source, values[] }`, a named list of option values reused by several decisions (skill
  groups, language tables, exploration perks, kit lists). `pool.languages.dead` carries
  `selectable: "unresolved (Q-R-102)"` and is not offered.
- `steps[]`: `{ id, sourceStep, source, optional, presentedInV001, optionalQuote?, note?, decisions[] }`.
  `sourceStep` is the exact heading text of the source step.
- `decisions[]`: `{ id, kind, shape, source, quote, dependsOn?, availableWhen?, options?, optionsFrom?,
  optionsByParent?, optionSources?, supportedInV001?, supportedSetInV001?, grants?, questions?, note? }`.
  - `availableWhen: { decision, value }` gates a decision on an earlier selection (e.g. only when
    `class.choice` is `Fury`). `dependsOn` lists parent decisions whose value shapes this one.
  - `options[]`: `{ id, value, source?, cost?, costQuote?, supportedInV001, grants? }`. `value` is the
    verbatim source name. `source` defaults to the decision's source.
  - `optionsFrom` names one or more pools; `optionsByParent` maps each parent value to
    `{ source, quote?, values?, optionsFrom? }`.
  - Named rule objects (`budgetRule`, `deferralRule`, `poolRule`, `baseRule`, `typeRule`, `choiceRule`,
    `featureRule`, `triggeredRule`, `stepRule`) each carry `{ source, quote }` for a sentence that
    establishes a rule the decision relies on.
  - `grants[]`: `{ kind, value, source?, quote?, note? }` automatic outcomes; `note: "R02"` marks values
    R02 derives.
- `selectionSets`: the three worked sets below, keyed by decision id. `null` in a `multi` slot is a deferred
  choice where the decision is `deferrable`.
- Text normalization applied before verbatim comparison: Markdown links `[label](target)` collapse to
  `label`; `<br>` becomes a space; `*` (bold/italic markers) is removed; whitespace runs collapse. The source
  files are never modified.

## Steps in source order

| # | Step id | Source heading | Optional (source) | Presented in v0.01 | Decisions |
| --- | --- | --- | --- | --- | --- |
| 1 | `step.think` | 1. Think | no (no selection) | yes (prompts only) | `think.prompts` |
| 2 | `step.ancestry` | 2. Ancestry | no | yes | `ancestry.choice`, `ancestry.devil.base-statistics`, `ancestry.devil.signature-trait`, `ancestry.devil.silver-tongue-skill`, `ancestry.devil.purchased-traits` |
| 3 | `step.culture` | 3. Culture | no | yes | `culture.name`, `culture.caelian`, `culture.language`, `culture.environment`, `culture.environment.skill`, `culture.organization`, `culture.organization.skill`, `culture.upbringing`, `culture.upbringing.skill`, `culture.edge` |
| 4 | `step.career` | 4. Career | no | yes | `career.choice`, `career.soldier.skill.exploration`, `career.soldier.skill.intrigue`, `career.soldier.languages`, `career.soldier.renown`, `career.soldier.perk`, `career.soldier.inciting-incident`, `career.what-was-taken` |
| 5 | `step.class` | 5. Class | no | yes | `class.choice`, `class.level`, `class.fury.fixed-characteristics`, `class.fury.characteristic-array`, `class.fury.array-assignment`, `class.fury.baseline`, `class.fury.skill.nature`, `class.fury.skills`, `class.fury.features`, `class.fury.aspect`, `class.fury.signature-ability`, `class.fury.ability-3`, `class.fury.ability-5` |
| 6 | `step.kit` | 6. Kit | no for this class | yes | `kit.choice`, `kit.mountain.contributions` |
| 7 | `step.free-strikes` | 7. Add Free Strikes | no (automatic) | yes (display only) | `free-strikes.grant` |
| 8 | `step.complication` | 8. Complication | yes: "complications aren't necessary for making a great hero" | **no** (Q-CHAR-1 answered 2026-09-14) | `complication.choice` |
| 9 | `step.details` | 9. Determine Details | no | yes | `details.name`, `details.appearance`, `details.backstory-and-personality` |
| 10 | `step.connections` | 10. Make Connections | yes: "If you like, you can use the following prompts" | yes (optional free text) | `connections.notes` |

All ten step paths resolve to `en/unified/md/chapter/making-a-hero.md`, section *Step-by-Step Hero Making*.
"Background" (`en/unified/md/chapter/background.md`) is the chapter containing Culture and Careers, not a
step, and is not used as a step name.

## Step 1: Think

| Decision | Kind | Shape | Source and quote |
| --- | --- | --- | --- |
| `think.prompts` | none | none | `chapter/making-a-hero.md`: "The first thing you should do is think about the kind of hero you want to make." Seven reflection questions; no selection, no grant. |

## Step 2: Ancestry

| Decision | Kind | Shape | Source and quote | Options (supported in v0.01 in bold) | Depends on / grants |
| --- | --- | --- | --- | --- | --- |
| `ancestry.choice` | choice | single | `chapter/making-a-hero.md`: "Choose your hero's humanoid ancestry from among the range of ancestries available in the game" | **Devil**, Dragon Knight, Dwarf, Wode Elf, High Elf, Hakaan, Human, Memonek, Orc, Polder, Revenant, Time Raider (each `en/unified/md/ancestry/<name>.md`) | — |
| `ancestry.devil.base-statistics` | automatic | none | `en/books/heroes/clean/Draw Steel Heroes.md`, *Starting Size and Speed*: "Unless otherwise noted, a character of any of these ancestries is size 1M and has speed 5 and stability 0." | — | Grants size 1M, speed 5, stability 0 (R02 derives; Beast Legs and kits modify). This sentence is absent from `en/unified/md/chapter/ancestries.md`. |
| `ancestry.devil.signature-trait` | automatic | none | `chapter/ancestries.md`, *Ancestry Traits*: "Each ancestry has one or more signature traits, which your hero gets for free if they take that ancestry." | — | Grants **Silver Tongue** (`feature/trait/devil/silver-tongue.md`). |
| `ancestry.devil.silver-tongue-skill` | choice | single | `feature/trait/devil/silver-tongue.md`: "You have one skill of your choice from the interpersonal skill group" | Interpersonal skills (`skill/group/interpersonal.md`): Brag, Empathize, Flirt, Gamble, Handle Animals, Interrogate, Intimidate, Lead, Lie, Music, Perform, **Persuade**, Read Person | Depends on the signature trait. Also grants an edge on negotiation discovery tests (manual in v0.01). Duplicate-skill handling: Q-CHAR-11. |
| `ancestry.devil.purchased-traits` | choice | points, budget **3** | `feature/trait/devil/devil-traits.md`: "You have 3 ancestry points to spend on the following traits." Budget rule, `chapter/ancestries.md`, *Ancestry Traits*: "But they couldn't select both Impressive Horns and Wings, since their combined cost of 4 exceeds the ancestry points budget for the devil." | Barbed Tail (1), **Beast Legs (1)**, Glowing Eyes (1), Hellsight (1), **Impressive Horns (2)**, Prehensile Tail (2), Wings (2). Costs from each entry's `cost:` field (`feature/trait/devil/<name>.md`). Supported v0.01 *set*: {Beast Legs, Impressive Horns} = 3 points. | Unspent points: Q-CHAR-10 (open; not decided here). Overspending is invalid per the quoted example. |

The seven purchased traits match the chapter's count ("3 ancestry points to spend on seven different
traits"). Trait effects (speed 6, saves at 5+, and so on) are R02/R05 concerns and remain manual where
unsupported.

## Step 3: Culture

The culture is assembled from four aspects: language, environment, organization, upbringing
(`chapter/background.md`, *Culture*). The culture's name and description are authored text; the mechanical
grants come only from the aspects. The sentences that establish the grants exist only in the clean Heroes
text (see *Source path corrections* below).

| Decision | Kind | Shape | Source and quote | Options (supported in v0.01 in bold) | Depends on / grants |
| --- | --- | --- | --- | --- | --- |
| `culture.name` | authored | text | `chapter/making-a-hero.md`: "Choose or create your hero's culture." | free text | Non-mechanical. Assembled cultures: Q-CHAR-6. |
| `culture.caelian` | automatic | none | clean Heroes, *Caelian Empire*: "All player characters know Caelian!" | — | Grants language **Caelian**. |
| `culture.language` | choice | single | clean Heroes, *Culture Benefits*: "You know the language of your culture, in addition to knowing Caelian." | Extant languages: *Languages by Ancestry Table* (25: **Anjali**, Axiomatic, Caelian, Filliaric, The First Language, Hyrallic, Illyvric, Kalliak, Kethaic, Khelt, Khoursirian, High Kuric, Low Kuric, Mindspeech, Proto-Ctholl, Szetch, Tholl, Urollialic, Variac, Vastariax, Vhoric, Voll, Yllyric, Za'hariax, Zaliac) and *Vaslorian Human Languages Table* (9: Uvalic, Higaran, Oaxuatl, Khemharic, Khoursirian, Phaedran, Riojan, Vaniric, Vaslorian). Dead languages (9) listed in the JSON as unresolved and not offered. | Pool boundary: Q-R-102. Duplicating Caelian: Q-R-100. Campaign-specific languages: Q-CHAR-6. The *Typical Ancestry Cultures Table* suggests Anjali for a devil; it is a suggestion, not a restriction. |
| `culture.environment` | choice | single | clean Heroes, *Environment*: "When you build a culture, select its environment aspect from the following options: nomadic, rural, secluded, urban, or wilderness." | Nomadic, Rural, Secluded, Urban, **Wilderness** (`culture/<name>.md`) | — |
| `culture.environment.skill` | choice | single | clean Heroes, *Culture Benefits*: "You can select one skill from each aspect's list of options." Per aspect: Nomadic "One skill from the exploration or interpersonal skill groups."; Rural "One skill from the crafting or lore skill groups."; Secluded "One skill from the interpersonal or lore skill groups."; Urban "One skill from the interpersonal or intrigue skill groups."; Wilderness "One skill from the crafting or exploration skill groups." | Pool depends on the chosen environment. Wilderness: crafting (10) + exploration (10). Supported: **Swim** | Depends on `culture.environment`. Q-CHAR-11. |
| `culture.organization` | choice | single | clean Heroes, *Organization*: "When you build a culture, select its organization aspect from the following options: bureaucratic or communal." | Bureaucratic, **Communal** | — |
| `culture.organization.skill` | choice | single | as above. Bureaucratic "One skill from the interpersonal or intrigue skill groups."; Communal "One skill from the crafting or exploration skill groups." | Communal: crafting + exploration. Supported: **Blacksmithing** | Depends on `culture.organization`. Q-CHAR-11. |
| `culture.upbringing` | choice | single | clean Heroes, *Upbringing*: "Pick your upbringing aspect from the following list: academic, creative, labor, lawless, martial, or noble." | Academic, Creative, Labor, Lawless, **Martial**, Noble | — |
| `culture.upbringing.skill` | choice | single | as above. Academic "One skill from the lore skill group."; Creative "The Music or Perform skill (from the interpersonal skill group), or one skill from the crafting group."; Labor "The Blacksmithing skill (from the crafting skill group), the Handle Animals skill (from the interpersonal group), or a skill from the exploration group."; Lawless "One skill from the intrigue skill group."; Martial "One of the following: Blacksmithing or Fletching from the crafting skill group; Climb, Endurance, or Ride from the exploration group; Intimidate from the interpersonal group; Alertness or Track from the intrigue group; or Monsters or Strategy from the lore skill group"; Noble "One skill from the interpersonal skill group." | Martial: Blacksmithing, Fletching, Climb, Endurance, Ride, **Intimidate**, Alertness, Track, Monsters, Strategy | Depends on `culture.upbringing`. Q-CHAR-11. |
| `culture.edge` | automatic | none | clean Heroes, *Culture Benefits*: "You gain an edge on tests made to recall lore about your culture, and on tests made to influence and interact with people of your culture." | — | Manual in v0.01. |

Skill group pools (`skill/group/<group>.md`): crafting 10, exploration 10, interpersonal 13, intrigue 12,
lore 12 (57 total, matching `_index/skill.md`). The *Archetypical Cultures Table* and *Typical Ancestry
Cultures Table* are presets of these aspects, not additional options.

**User decision, 2026-09-14 (Q-R-100):** Caelian stays visible with a short common-tongue
explanation, but is automatically known and cannot consume a culture or career language slot.
The source language catalog may still contain it; the choice UI marks it already known and not
selectable as an additional grant. See [the wizard contract](character-wizard-spec.md#3-decision-system).
The provisional fixture choice of Caelian as a Soldier language below is superseded and needs
correction in the R01/R02 artifacts and A02 integration; it is not a completed extra-language choice.

## Step 4: Career

| Decision | Kind | Shape | Source and quote | Options (supported in v0.01 in bold) | Depends on / grants |
| --- | --- | --- | --- | --- | --- |
| `career.choice` | choice | single | `chapter/making-a-hero.md`: "Choose your hero's career, which describes what you did for a living before you became a hero." | Agent, Aristocrat, Artisan, Beggar, Criminal, Disciple, Explorer, Farmer, Gladiator, Laborer, Mage's Apprentice, Performer, Politician, Sage, Sailor, **Soldier**, Warden, Watch Officer (`career/<name>.md`, 18 per `_index/career.md`) | Each career defines its own skills, languages, perk type, Renown, wealth, project points and six inciting incidents. Sub-decisions are defined below for Soldier only; V08 expands the others from the same entries. |
| `career.soldier.skill.exploration` | choice | single | `career/soldier.md`: "One skill from the exploration skill group and one skill from the intrigue group" | exploration (10): Climb, Drive, **Endurance**, Gymnastics, Heal, Jump, Lift, Navigate, Ride, Swim | Available when career = Soldier. Q-CHAR-11. |
| `career.soldier.skill.intrigue` | choice | single | same sentence | intrigue (12): **Alertness**, Conceal Object, Disguise, Eavesdrop, Escape Artist, Hide, Pick Lock, Pick Pocket, Sabotage, Search, Sneak, Track | Q-CHAR-11. |
| `career.soldier.languages` | choice | multi, count **2**, deferrable | `career/soldier.md`: "Languages: Two languages". Pool: `chapter/background.md`, *Languages*: "Some careers allow you to learn extra languages, chosen from those available in Languages in Orden above." Deferral: `chapter/making-a-hero.md`, *I Speak Their Language*: "You can choose to leave some of the languages you know open until you discover what might be a good choice for the campaign you're playing in." | Same extant language pool as `culture.language`. Original fixture: **Caelian, Vaslorian**; the Caelian slot is superseded by Q-R-100 and needs correction | Q-R-100 (duplicate of the automatic Caelian), Q-R-102 (pool), Q-CHAR-5 (filling a deferred slot later). |
| `career.soldier.renown` | automatic | none | `career/soldier.md`: "Renown: +1". Base: `rule/resource/renown.md`: "At the start of character creation, your Renown is 0." | — | Grants Renown +1 (so Renown 1). |
| `career.soldier.perk` | choice | single | `career/soldier.md`: "Perk: One exploration perk". Type rule: `en/books/heroes/md/chapter/perks.md`: "Whenever a feature allows you to gain a perk, that feature tells you which type of perk to choose." | Exploration perks (clean Heroes, *Exploration Perks* headings; entries `perk/<name>.md`): Brawny, Camouflage Hunter, Danger Sense, Friend Catapult, I've Got You!, Monster Whisperer, Put Your Back Into It!, Team Leader, **Teamwork**, Wood Wise | Perk types are not in the unified perk entries (see corrections). |
| `career.soldier.inciting-incident` | choice | single (d6 rollable) | `career/soldier.md` table *Inciting Incident*. Rule: `chapter/background.md`: "You can roll for or choose an inciting incident from the table that accompanies each career." | Dishonorable Discharge, Out of Retirement, Peace Through Healing, **Sole Survivor**, Stolen Valor, Vow of Sacrifice | A unique incident authored with the Director is source-permitted ("come up with a unique inciting incident of your own") and deliberately not supported in v0.01. |
| `career.what-was-taken` | authored | text | `chapter/background.md`, *What Was Taken From You?*: "Record what was taken from you on your character sheet, and let your Director know." | free text | Non-mechanical. |

Career benefits that Soldier does not grant (wealth, project points) are not modeled here; they are recorded
per career in the entries and Q-CHAR-9 covers project points.

## Step 5: Class

| Decision | Kind | Shape | Source and quote | Options (supported in v0.01 in bold) | Depends on / grants |
| --- | --- | --- | --- | --- | --- |
| `class.choice` | choice | single | `chapter/making-a-hero.md`: "You can be a censor, conduit, elementalist, fury, null, shadow, tactician, talent, or troubadour." | Censor, Conduit, Elementalist, **Fury**, Null, Shadow, Tactician, Talent, Troubadour (`class/<name>.md`). Beastheart and Summoner are excluded from V1 scope. | — |
| `class.level` | automatic | none | `chapter/making-a-hero.md`: "Each option you can choose for your hero at 1st level includes a parenthetical selection labeled "Quick Build."" | — | Level 1 (v0.01 creates at level one only). |
| `class.fury.fixed-characteristics` | automatic | none | `class/fury.md`, *Basics*: "You start with a Might of 2 and an Agility of 2" | — | Might 2, Agility 2. |
| `class.fury.characteristic-array` | choice | single | `class/fury.md`: "you can choose one of the following arrays for your other characteristic scores:" | 2, −1, −1 / 1, 1, −1 / **1, 0, 0** | — |
| `class.fury.array-assignment` | choice | assignment to Reason, Intuition, Presence | same sentence ("for your other characteristic scores") | Supported: **Intuition 1, Reason 0, Presence 0** (the fixture) | Depends on the array. Whether any order is allowed: **Q-R-101** (provisional: any order). |
| `class.fury.baseline` | automatic | none | `class/fury.md`: "Starting Stamina at 1st Level: 21"; "Recoveries: 10"; potencies "Weak Potency: Might − 2; Average Potency: Might − 1; Strong Potency: Might" | — | Values recorded as references; R02 derives them. |
| `class.fury.skill.nature` | automatic | none | `class/fury.md`: "You gain the Nature skill" | — | Grants **Nature**. Collision with a culture/career Nature: Q-CHAR-11. |
| `class.fury.skills` | choice | multi, count **2** | `class/fury.md`: "Then choose any two skills from the exploration or intrigue skill groups." | exploration (10) + intrigue (12). Supported: **Jump, Climb** | Interpretation: "any two" from the union of both groups (both may come from one group); the source uses "One skill from ... and one skill from ..." when it means one per group (Soldier). Q-CHAR-11. |
| `class.fury.features` | automatic | none | `class/fury.md`, *Fury Advancement Table* row 1st: "Primordial Aspect, Ferocity, Growing Ferocity, Aspect Features, Aspect Triggered Action, Mighty Leaps, Fury Abilities" | — | Grants **Ferocity** (`feature/fury/level-1/ferocity.md`), **Growing Ferocity** (`growing-ferocity.md`), **Mighty Leaps** (`mighty-leaps.md`). Their execution is manual in v0.01 (`docs/fury-goblin-automation.md`). |
| `class.fury.aspect` | choice | single | `feature/fury/level-1/primordial-aspect.md`: "You choose a primordial aspect from the following options, each of which grants you a skill." Features: `1st-level-aspect-features.md`: "Your primordial aspect grants you two features, as shown on the 1st-Level Aspect Features table." Triggered action: `aspect-triggered-action.md`: "Your primordial aspect grants you a triggered action, as shown on the Aspect Triggered Actions table." | **Berserker** (skill "You have the Lift skill."; features Kit, Primordial Strength; triggered action Lines of Force), Reaver (Hide; Kit, Primordial Cunning; Unearthly Reflexes), Stormwight (Track; Beast Shape, Relentless Hunter; Furious Change) | The aspect is the subclass. Kit eligibility depends on it (Step 6). Q-CHAR-11 for the granted skill. |
| `class.fury.signature-ability` | choice | single | `feature/fury/level-1/fury-abilities.md`: "Choose one signature ability from the following options." | **Brutal Slam**, Hit and Run, Impaled!, To the Death! (`feature/ability/fury/level-1/<name>.md`) | Pool membership from the clean Heroes headings under *Signature Ability* (the unified feature entry omits the list); these four entries have no `cost:` field. |
| `class.fury.ability-3` | choice | single | same file: "Choose one heroic ability from the following options, each of which costs 3 ferocity to use." | Back!, **Out of the Way!**, Tide of Death, Your Entrails Are Your Extrails! (each `cost: 3 Ferocity`) | — |
| `class.fury.ability-5` | choice | single | same file: "Choose one heroic ability from the following options, each of which costs 5 ferocity to use." | Blood for Blood!, Make Peace With Your God!, **Thunder Roar**, To the Uttermost End (each `cost: 5 Ferocity`) | — |

## Step 6: Kit

| Decision | Kind | Shape | Source and quote | Options (supported in v0.01 in bold) | Depends on / grants |
| --- | --- | --- | --- | --- | --- |
| `kit.choice` | choice | single | Step: `chapter/making-a-hero.md`: "Your class might grant your hero a kit that helps define your approach to martial combat." Grant: `feature/fury/level-1/kit.md`: "You can use and gain the benefits of a kit." Stormwight: `feature/fury/level-1/beast-shape.md`: "You can use and gain the benefits of a stormwight kit". | Berserker/Reaver: the 21 non-stormwight kits in `_index/kit.md` (Arcane Archer, Battlemind, Cloak and Dagger, Dual Wielder, Guisarmier, Martial Artist, **Mountain**, Panther, Pugilist, Raider, Ranger, Rapid-Fire, Retiarius, Shining Armor, Sniper, Spellsword, Stick and Robe, Swashbuckler, Sword and Board, Warrior Priest, Whirlwind). Stormwight: Boren, Corven, Raden, Vuken. | Depends on `class.fury.aspect`. Eligibility split is an interpretation: **Q-R-103**. Kits can be changed as a respite activity (`chapter/kits.md`, *Changing Your Kit*): Q-CHAR-5. |
| `kit.mountain.contributions` | automatic | none | `kit/mountain.md`: "You wear heavy armor and wield a heavy weapon." | — | References for R02: "Stamina Bonus: +9 per echelon", "Stability Bonus: +2", "Melee Damage Bonus: +0/+0/+4", signature ability **Pain for Pain**. Every kit entry carries the same shape (equipment, bonuses, signature ability). Equipment is descriptive; inventory is deferred. |

## Step 7: Add Free Strikes

| Decision | Kind | Shape | Source and quote | Grants |
| --- | --- | --- | --- | --- |
| `free-strikes.grant` | automatic | none | `chapter/making-a-hero.md`: "Every hero has a melee weapon free strike and a ranged weapon free strike." | **Melee Weapon Free Strike** (`feature/ability/common/melee-weapon-free-strike.md`), **Ranged Weapon Free Strike** (`.../ranged-weapon-free-strike.md`). "It's up to you to decide what exactly your free strikes are" is authored flavor. Kit modifiers to free strikes are R02. |

## Step 8: Complication

| Decision | Kind | Shape | Source and quote | Options |
| --- | --- | --- | --- | --- |
| `complication.choice` | choice | single, none allowed, d100 rollable | Optional: `chapter/making-a-hero.md`: "complications aren't necessary for making a great hero". Choice: `chapter/complications.md`: "You can choose your character's complication from any of the available options below." | 100 complications, recorded by reference only: `_index/complication.md` ("Total: 100"). |

**Not presented in v0.01** (Q-CHAR-1 answered 2026-09-14: no). The step is recorded here because the source
lists it; heroes are created without a complication. V08 adds the pool and its benefit/drawback effects.

## Step 9: Determine Details

| Decision | Kind | Shape | Source and quote |
| --- | --- | --- | --- |
| `details.name` | authored | text | `chapter/making-a-hero.md`: "What's their name?" |
| `details.appearance` | authored | text | "What do they look like?" |
| `details.backstory-and-personality` | authored | text | "it's time to determine the additional details of their backstory, appearance, and personality." Maps to the app's biography/notes fields. |

All non-mechanical; they follow the authored-details review policy in `docs/character-wizard-spec.md`.

## Step 10: Make Connections

| Decision | Kind | Shape | Source and quote |
| --- | --- | --- | --- |
| `connections.notes` | authored | text, optional | `chapter/making-a-hero.md`: "Ask the Director if all the heroes start the campaign knowing each other." Optional per "If you like, you can use the following prompts to make those connections, or to come up with prompts of your own". |

Non-mechanical. Presented as an optional free-text field so the step exists; no prompt selection is modeled.

## Interpretations (grounded, labeled)

1. `class.fury.skills`: "any two skills from the exploration or intrigue skill groups" is read as two from
   the union. Alternative considered: one from each group; rejected because the same corpus writes that
   case as "One skill from the exploration skill group and one skill from the intrigue group"
   (`career/soldier.md`).
2. `kit.choice` split by aspect (Q-R-103). Alternative considered: any of the 25 kits for any aspect.
3. `class.fury.array-assignment` any order (Q-R-101). Alternative: printed order.
4. `culture.language` / `career.soldier.languages` pool = the two extant tables (Q-R-102). Alternative:
   include dead languages.
5. Ability pools for signature/3/5 taken from the clean Heroes headings, cross-checked with the entries'
   `cost:` fields; the unified `fury-abilities.md` says "from the following options" but carries no list.
6. `connections.notes`: the optional *Make Connections* step is presented as one optional free-text field so
   the step exists in the wizard; the source's prompts are not modeled as selections. Alternative considered:
   omit the step because it is optional; rejected because the v0.01 scope lists connections among the steps
   to present (`docs/character-wizard-spec.md#v001-scope`) and only the complication step has a ruling.

## Ambiguities and questions

Every place the source is silent or ambiguous for this hero, with its id in `docs/rules-questions-for-user.md`.
None is resolved by assumption; provisional defaults are labeled there.

| Id | Decision(s) | Summary |
| --- | --- | --- |
| Q-R-100 | `career.soldier.languages`, `culture.language` | Resolved 2026-09-14: show Caelian as automatically known common tongue; it is not selectable for or counted against a language slot. |
| Q-R-101 | `class.fury.array-assignment` | Whether the chosen array's values may be assigned to Reason/Intuition/Presence in any order. Raised by R01. |
| Q-R-102 | `culture.language`, `career.soldier.languages` | Which language tables are selectable at creation (dead languages, Vaslorian regional table). Raised by R01. |
| Q-R-103 | `kit.choice` | Kit eligibility by aspect; stormwight kits restricted to Stormwight. Raised by R01. |
| Q-CHAR-1 | `step.complication` | Answered 2026-09-14: not presented in v0.01. |
| Q-CHAR-5 | `career.soldier.languages`, `kit.choice` | Filling a deferred language slot / changing kit later without full-edit review (existing, open). |
| Q-CHAR-6 | `culture.name`, `culture.language` | Campaign-specific languages and assembled cultures (existing, open). |
| Q-CHAR-10 | `ancestry.devil.purchased-traits` | Whether a complete hero may leave ancestry points unspent (existing, open). The supported v0.01 set spends all 3. |
| Q-CHAR-11 | every skill decision | Duplicate-skill replacement rules (existing, open). The three worked sets below avoid duplicates so they do not depend on it. |

## Worked selection sets

**Historical fixture status:** the examples and their JSON/test mirrors below predate the Q-R-100
answer. Set A's paid Caelian selection and complete-with-warning result are no longer valid as
current acceptance evidence. A02 must replace that selection through the normal choice flow (or an
explicit source-supported deferral), preserving the automatic Caelian grant and the full extra-language
entitlement. No replacement language has been chosen by this ruling.

Hand-validated against the tables above; the same three sets are in the JSON and checked by
`tests/fury-decisions.test.ts`.

### Set A: hero-fixture path (`docs/hero-fixture.md`, Grug) — complete, one warning

| Decision | Selection | Check |
| --- | --- | --- |
| `ancestry.choice` | Devil | in pool, supported |
| `ancestry.devil.silver-tongue-skill` | Persuade | interpersonal, count 1 |
| `ancestry.devil.purchased-traits` | Beast Legs (1) + Impressive Horns (2) | 3 ≤ budget 3, no duplicates |
| `culture.language` | Anjali | in extant pool |
| `culture.environment` / `.skill` | Wilderness / Swim | Swim is exploration, allowed for Wilderness |
| `culture.organization` / `.skill` | Communal / Blacksmithing | crafting, allowed for Communal |
| `culture.upbringing` / `.skill` | Martial / Intimidate | listed for Martial |
| `career.choice` | Soldier | supported |
| `career.soldier.skill.exploration` | Endurance | exploration |
| `career.soldier.skill.intrigue` | Alertness | intrigue |
| `career.soldier.languages` | Caelian, Vaslorian | count 2, both in pool; **warning**: Caelian duplicates the automatic grant (Q-R-100, provisional: accepted) |
| `career.soldier.perk` | Teamwork | exploration perk |
| `career.soldier.inciting-incident` | Sole Survivor | in Soldier table |
| `class.choice` | Fury | supported |
| `class.fury.characteristic-array` | 1, 0, 0 | in list |
| `class.fury.array-assignment` | Intuition 1, Reason 0, Presence 0 | uses exactly the array's values (order per Q-R-101 provisional) |
| `class.fury.skills` | Jump, Climb | count 2, both exploration |
| `class.fury.aspect` | Berserker | grants Lift, Kit, Primordial Strength, Lines of Force |
| `class.fury.signature-ability` / `ability-3` / `ability-5` | Brutal Slam / Out of the Way! / Thunder Roar | one from each pool |
| `kit.choice` | Mountain | non-stormwight kit, Berserker eligible |
| `details.name` | Grug | authored |

Automatic grants in this set: Silver Tongue; Caelian; culture edge; Renown +1; Might 2, Agility 2; Nature;
Ferocity, Growing Ferocity, Mighty Leaps; Pain for Pain and the Mountain bonuses; both free strikes. Skill
list has no duplicates (Persuade, Swim, Blacksmithing, Intimidate, Endurance, Alertness, Nature, Jump, Climb,
Lift), so Q-CHAR-11 is not triggered. Every required choice is present: **complete**, with one warning. The
complication step is not presented, so its absence is not a diagnostic.

### Set B: a second legal path — complete

Devil; Silver Tongue skill Lie; purchased traits Barbed Tail + Glowing Eyes + Hellsight (1+1+1 = 3); culture
"Seven Cities trade house": Anjali, Urban / Eavesdrop (intrigue), Bureaucratic / Persuade (interpersonal),
Academic / History (lore); Soldier: Ride (exploration), Search (intrigue), languages Zaliac + one slot left
open (deferrable per *I Speak Their Language*), perk Danger Sense, incident Vow of Sacrifice; Fury: array
2, −1, −1 assigned Reason 2, Intuition −1, Presence −1 (Q-R-101 provisional), class skills Alertness + Climb,
aspect Reaver (grants Hide, Kit, Primordial Cunning, Unearthly Reflexes), abilities To the Death! / Back! /
Blood for Blood!; kit Panther; name Tessiar. No duplicate skills (Lie, Eavesdrop, Persuade, History, Ride,
Search, Nature, Alertness, Climb, Hide). Every required choice present; budget exactly spent; no warnings:
**complete**.

### Set C: invalid — rejected

Same as Set A except: purchased traits Impressive Horns (2) + Wings (2); languages Vaslorian + Zaliac; no
5-Ferocity ability chosen; no upbringing skill chosen. Diagnostics, each with its reason:

1. `ancestry.devil.purchased-traits: cost 4 exceeds budget 3` — the source's own example: "they couldn't
   select both Impressive Horns and Wings, since their combined cost of 4 exceeds the ancestry points budget".
2. `class.fury.ability-5: required choice missing` — "Choose one heroic ability from the following options,
   each of which costs 5 ferocity to use."
3. `culture.upbringing.skill: required choice missing` — "You can select one skill from each aspect's list of
   options."

Status: **invalid** (over budget) and **incomplete** (two missing required choices). The Caelian warning does
not occur because this set does not pick Caelian.

## Source path corrections

The slice document listed paths to read first; these are the corrections found while reading.

| Listed | Finding |
| --- | --- |
| `en/unified/md/chapter/background.md` and `culture/`, `career/` entries | Exists, but the unified chapter (identical to `en/books/heroes/md/chapter/background.md`) omits *Culture Benefits* (language grant; one skill per aspect; culture edge), the *Language*/*Environment*/*Organization*/*Upbringing* aspect paragraphs, and every language table. Those sentences are cited from `en/books/heroes/clean/Draw Steel Heroes.md` (lines 3217–3300 and 3341–3465 at this revision), which is present on disk in a full checkout. |
| `en/unified/md/chapter/perks.md` | Is the Beastheart perks chapter (`scc: mcdm.beastheart.v1/chapter/perks`), as `docs/compendium-navigation.md` warns. The Heroes text is `en/books/heroes/md/chapter/perks.md` (intro only). Perk *types* exist only as section headings in the clean Heroes text (*Exploration Perks* etc.); unified `perk/<name>.md` entries carry no type field. |
| `en/unified/md/chapter/ancestries.md` | Exists and contains the *Ancestry Traits* rules verbatim (signature trait grant, 3-point budget example), which are cited from it. It lacks only the *Starting Size and Speed* sentence, cited from the clean Heroes text (already noted in `docs/hero-fixture.md`). |
| `en/unified/md/feature/fury/level-1/fury-abilities.md` | Exists, but its "from the following options" lists are empty; the options are the separate `feature/ability/fury/level-1/*.md` entries, grouped by the clean Heroes headings. |
| `en/unified/md/chapter/kits.md` and `kit/` | As listed. No kit entry carries a class restriction; stormwight kits identify themselves in prose only. |
| `en/unified/md/chapter/complications.md`, `skill/` | As listed. Individual skills are `skill/<group>/<name>.md`; pools are taken from the `skill/group/<group>.md` tables. |

Extraction gaps in the unified Markdown are not treated as rules being absent; the clean text is the same
corpus at the same revision (`docs/compendium-navigation.md`).

## Verification

- `node --test tests/fury-decisions.test.ts`: check 1 (step order and existing paths, pinned revision),
  checks 2–3 (every option value, grant name and quoted count/budget sentence verbatim in its cited file after
  the stated normalization), check 4 (Set A complete with the single Q-R-100 warning; Set B complete; Set C
  produces exactly the three diagnostics above), and a mirror check that this document names every decision id
  and every question id, and that each `Q-` id exists in `docs/rules-questions-for-user.md`.
- Check 5 is this document's *Ambiguities and questions* table. Check 6 (independent rules review) is pending.
