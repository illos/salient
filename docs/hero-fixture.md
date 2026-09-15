# Milestone 1 prepared hero and foes

For integrated v0.01 automation, use [the current boundary](fury-goblin-automation.md). The 2026-09-14
game-basics-first revision defers class/stat-block-specific execution, including turn-start Ferocity.
Coverage described below belongs to the earlier experiment, not the integrated milestone requirement.

This is a documented level-one character choice set with a small combat-state projection, not a character wizard or a fully automated sheet. It is not the integrated app's character record: the integrated checkout stores authored details and unevaluated selection revisions only (see the [wizard spec's implementation status](character-wizard-spec.md)). The headless experiment's `loadScenario()` (`src/content.ts`) reads selected abilities from the pinned Compendium JSON and complete Markdown. Default paths are relative to the module, so loading works outside the project working directory. Nothing modifies or updates the dependency.

Source revision: `fb83a789da8f0327a389c277a0c790b1648d5810`. All links below point into that local dependency. The adapters check the checkout HEAD against this pin; a different `corpusRoot` is an alternate location for the same revision, not an automatic content-version migration. Local uncommitted corpus edits are not certified by that revision check; keep the dependency clean. Generic monster adapters mark unrepresented stat-block fields (such as immunities) as unsupported traits so they cannot silently enter automated combat.

## Grug: level-one devil Berserker Fury

**Language fixture repair, 2026-09-15 (Q-R-100):** Caelian is automatically known and consumes
no language slot. The former paid Caelian slot is now explicitly deferred (`null`), as permitted
by *I Speak Their Language*; the other Soldier language remains Vaslorian. No replacement was
silently selected. See [the current wizard contract](character-wizard-spec.md#3-decision-system).

| Choice | Value and source |
| --- | --- |
| Ancestry | [Devil](../vendor/steel-compendium/en/unified/md/ancestry/devil.md). Size 1M; the combat projection also retains its numeric footprint 1. |
| Signature ancestry trait | [Silver Tongue](../vendor/steel-compendium/en/unified/md/feature/trait/devil/silver-tongue.md): choose Persuade; negotiation discovery tests gain its edge. |
| Purchased ancestry traits | Spend the [three ancestry points](../vendor/steel-compendium/en/unified/md/feature/trait/devil/devil-traits.md) on [Beast Legs](../vendor/steel-compendium/en/unified/md/feature/trait/devil/beast-legs.md) (1; speed 6) and [Impressive Horns](../vendor/steel-compendium/en/unified/md/feature/trait/devil/impressive-horns.md) (2; saves succeed at 5+). |
| Class | [Fury](../vendor/steel-compendium/en/unified/md/class/fury.md), level 1. Might 2, Agility 2; choose the remaining array 1/0/0 as Intuition 1, Reason 0, Presence 0. |
| Class skills | Nature, Jump, Climb. |
| Aspect | [Berserker](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-aspect.md), granting Lift. |
| Culture | A fictional wilderness mercenary commune: [Wilderness](../vendor/steel-compendium/en/unified/md/culture/wilderness.md) environment (Swim), [Communal](../vendor/steel-compendium/en/unified/md/culture/communal.md) organization (Blacksmithing), [Martial](../vendor/steel-compendium/en/unified/md/culture/martial.md) upbringing (Intimidate). Culture language Anjali. |
| Career | [Soldier](../vendor/steel-compendium/en/unified/md/career/soldier.md): Endurance and Alertness, Renown +1, choose Vaslorian and explicitly leave its other language slot open, [Teamwork](../vendor/steel-compendium/en/unified/md/perk/teamwork.md) exploration perk, inciting incident Sole Survivor. |
| Kit | [Mountain](../vendor/steel-compendium/en/unified/md/kit/mountain.md): heavy armor, heavy weapon, +9 Stamina at first echelon, +2 stability, +0/+0/+4 melee weapon damage. |
| Health | Fury base 21 + kit 9 = maximum Stamina 30; current 30, temporary 0. Ten maximum/current Recoveries. [Recovery value](../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md) is floor(30/3) = 10. |
| Initial resources | Zero Victories, Ferocity, and surges. Initial record precedes the first Fury turn. Record supplied start-turn d3 and Ferocity gain as a manual action; do not silently preload resources. |

Default ancestry statistics (size 1M, speed 5, stability 0) are in the book-specific clean Heroes text at line 1501 of this pin: `git -C vendor/steel-compendium show "HEAD:en/books/heroes/clean/Draw Steel Heroes.md"`. Beast Legs replaces speed with 6; Mountain adds stability 2. This sentence is absent from the extracted unified ancestry chapter.

Culture, career, languages, skill choices, speed, and recovery value are documented here (the creation steps follow [Making a Hero](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#step-by-step-hero-making); "Background" is the Compendium chapter containing Culture and Careers); the experiment's small `Entity` interface (`src/contracts.ts`) deliberately stores only fields exercised by this combat experiment. Their absence from that interface does not imply the character lacks them. Inventory, common actions, and other full-sheet fields are deferred.

The [Fury ability choices](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/fury-abilities.md) are Brutal Slam (signature), Out of the Way! (3 Ferocity), and Thunder Roar (5 Ferocity). The aspect adds Lines of Force; Mountain adds Pain for Pain. The loaded ability list contains all five, including those currently requiring manual resolution.

| ID | Support in this experiment |
| --- | --- |
| `fury:brutal-slam` | Grammar recognizes Might roll, damage 3/6/9 + Might, and push 1/2/4. With this kit and Might 2, unmodified damage is 5/8/15. Missing movement facts remain explicit. |
| `fury:out-of-the-way` | Cost is recognized; slide, follow movement, and opportunity-attack damage sharing require manual resolution. |
| `fury:thunder-roar` | Cost and damage/push clauses are recognized; area targeting, ordered movement, and collisions require manual resolution. |
| `fury:lines-of-force` | Trigger, retargeting, source change, and optional spend require manual resolution. |
| `mountain:pain-for-pain` | Characteristic choice and remembered damage trigger require manual resolution. Its displayed damage already includes this kit's bonus; general kit stacking must be handled when this ability is implemented. |

## Features that matter outside the parsed ability

[Ferocity](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md) provides encounter-start Victories, start-turn 1d3, first-damage-each-round +1, and first winded/dying 1d3. The resolver supports the damage triggers with supplied dice when required. Turn start, turn end, encounter end, and outside-combat procedures remain manual.

[Berserker Growing Ferocity](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md) adds Might to Knockback at 2, grants a surge on the first push of a turn at 4, and gives an edge to Might tests and Knockback at 6. Benefits persist through the turn even after spending Ferocity. This experiment requires manual handling for the active unsupported branches; callers must supply retained turn threshold where relevant. It must not resolve a push as complete while silently losing a surge.

[Primordial Strength](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-strength.md) adds Might damage to weapon strikes against objects and when pushing a creature into an object. The prototype's creature actions and noncollision movement do not invoke either branch; collisions remain manual. [Mighty Leaps](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/mighty-leaps.md) sets a tier-two minimum for Might jump tests; those tests are outside this slice.

Silver Tongue, Teamwork, and Impressive Horns remain available character features but their negotiation, montage, and save procedures are manual. No such effect is silently applied to an ordinary attack. Eligibility and distances come from the table; speed and geometry are not simulated.

## Foes

[Warrior](../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md): entity `warrior`, Stamina 15, size 1S, stability 0, Might -2, Agility 2, Reason/Intuition 0, Presence -1. `warrior:spear-charge` deals 3/4/5; `warrior:bury-the-point` costs 2 Malice, deals 5/6/7, and applies bleeding (save ends) at Might below 0/1/2. With the prepared Fury's Might 2, those unmodified potency checks do not apply bleeding.

[Spinecleavers](../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-spinecleaver.md): optional `spine-1` through `spine-4`, `spine-squad` shared pool 20, member Stamina 5, free strike damage 2, size 1S, stability 0, Might 2, Agility/Reason/Intuition 0, Presence -1. `spine:axe` deals 2/4/5 and pushes 1/3/4. There is no captain. Their individual Stamina field is definition/display data; damage and casualty decisions use the shared pool.

Both foes have Crafty: movement does not provoke opportunity attacks. The app must preserve that fact when movement/opportunity automation is implemented; this experiment does not generate those attacks.

## Parser boundary

One strict grammar handles both hero and monster text. It parses one power roll, all three tiers, numeric or single-characteristic damage expressions, push distance, fixed Malice/Ferocity costs, and numeric potency conditions with `save ends` or `EoT` durations. Recognizing a condition does not automate its later lifecycle.

The complete Markdown body is scanned, including extra effects and nested lists. Structured tiers and rolls are cross-checked against it. Unknown clauses, mismatches, multiple rolls, and unsupported extra rows produce diagnostics. Recognized fragments remain visible but diagnostics prevent the engine from applying an unsafe partial result. A successful parse establishes grammar support only: the resolver still validates action usage, target envelope, actors, conditions, and facts.

This grammar has no name-based mechanics handlers. It is intentionally small; it is not an arbitrary natural-language interpreter. The first italic paragraph follows the Compendium's flavor convention, and frontmatter supplies metadata. Authors must place mechanical instructions in the ability body and cost field, not conceal them in flavor text.
