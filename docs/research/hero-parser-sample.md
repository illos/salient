# Hero ability parsing: initial feasibility sample

**Assessment:** Hero abilities contain enough recurring structure to justify testing a shared parser and interpreter. They do not justify assuming that a short collection of text substitutions can execute complete abilities. Most of the difficult examples need reusable concepts—event triggers, temporary rules, target relationships, choices, and spatial queries—rather than obviously unique code for each named ability. That is an engineering hypothesis, not demonstrated parser coverage.

This is a source-reading study at Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`; no parser or engine was implemented. Eighteen abilities were deliberately selected across six core Heroes classes, one at each actual grant level 1, 3, and 6. Selection emphasizes contrasting mechanics, not random prevalence. Null, Shadow, Conduit, later levels, and supplements remain outside this sample.

## Sample and grant evidence

Ability links point to complete Markdown entries. Exact SCC IDs, source paths, costs, and clean-book heading/line evidence are in [the sample manifest](hero-sample.json). Grant levels were checked against the enclosing class and level headings in `en/books/heroes/clean/Draw Steel Heroes.md`, accessed with `git -C vendor/steel-compendium show HEAD:en/books/heroes/clean/Draw Steel Heroes.md`. Class/subclass grants were also checked in the linked feature entries recorded in the manifest. A 7-resource ability here is granted at level 3; 9-resource abilities here at level 6. These are costs, not levels.

| Class | Grant level | Ability | Base/optional cost | Coverage reason |
| --- | --- | --- | --- | --- |
| Fury | 1 | [Brutal Slam](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md) | No base Heroic Resource cost | Signature; damage + push |
| Fury | 3 | [Face the Storm!](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-3/face-the-storm.md) | 7 Ferocity | Encounter buff; later taunts/damage |
| Fury | 6 | [Force of Storms](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-6/force-of-storms.md) | 9 Ferocity | Berserker; push then select nearby creatures |
| Censor | 1 | [My Life for Yours](../../vendor/steel-compendium/en/unified/md/feature/ability/censor/level-1/my-life-for-yours.md) | No base Heroic Resource cost; 1 Wrath; base effect spends 1 Recovery | Trigger; spend own Recovery to heal target; optional cleanse |
| Censor | 3 | [Edict of Stillness](../../vendor/steel-compendium/en/unified/md/feature/ability/censor/level-3/edict-of-stillness.md) | 7 Wrath | Aura exit trigger; judged/willing movement bonus |
| Censor | 6 | [Intercede](../../vendor/steel-compendium/en/unified/md/feature/ability/censor/level-6/intercede.md) | 9 Wrath | Paragon; free trigger redirects incoming strike |
| Elementalist | 1 | [Hurl Element](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/hurl-element.md) | No base Heroic Resource cost | Granted ability; choose damage type; also ranged free strike |
| Elementalist | 3 | [Wall of Fire](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-3/wall-of-fire.md) | 7 Essence | Persistent wall; entry/turn damage |
| Elementalist | 6 | [Magma Titan](../../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-6/magma-titan.md) | 9 Essence | Persistent transformation; multiple stat/rule changes |
| Tactician | 1 | [Parry](../../vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-1/parry.md) | No base Heroic Resource cost; 1 Focus | Vanguard; triggered shift and damage/potency reduction |
| Tactician | 3 | [Rout](../../vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-3/rout.md) | 7 Focus | Mark-based subsequent fear trigger |
| Tactician | 6 | [Battle Plan](../../vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-6/battle-plan.md) | 9 Focus | Mastermind; marks, information reveal, paid later benefits |
| Talent | 1 | [Entropic Bolt](../../vendor/steel-compendium/en/unified/md/feature/ability/talent/level-1/entropic-bolt.md) | No base Heroic Resource cost | Signature; potency, target counter, strained resource gain |
| Talent | 3 | [Fling Through Time](../../vendor/steel-compendium/en/unified/md/feature/ability/talent/level-3/fling-through-time.md) | 7 Clarity | Remove/return target; strained dice damage and aging |
| Talent | 6 | [Stasis Field](../../vendor/steel-compendium/en/unified/md/feature/ability/talent/level-6/stasis-field.md) | 9 Clarity | Chronopathy; area/roll target distinction; death exceptions |
| Troubadour | 1 | [Power Chord](../../vendor/steel-compendium/en/unified/md/feature/ability/troubadour/level-1/power-chord.md) | No base Heroic Resource cost | Virtuoso; area push without damage |
| Troubadour | 3 | [Extensive Rewrites](../../vendor/steel-compendium/en/unified/md/feature/ability/troubadour/level-3/extensive-rewrites.md) | 7 Drama | Slide or position swap; potency modifies stability |
| Troubadour | 6 | [Blood on the Stage](../../vendor/steel-compendium/en/unified/md/feature/ability/troubadour/level-6/blood-on-the-stage.md) | 9 Drama | Duelist; damage + condition with alternate durations |

## What repeats

The common envelope is clear: action type, keywords, distance, target selection, optional cost/trigger, power-roll characteristic, three tiers, and additional effect sections. A shared expression grammar could represent constants, characteristic references, arithmetic, dice requests, potency comparisons, damage types, conditions, and movement distances.

[Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md) explicitly defines characteristic abbreviations and semicolon effects. Damage is dealt to all targets before tier-dependent effects unless overridden; multiple effects resolve in presentation order. A parser must preserve that order and bind pronouns and subjects, not merely collect recognizable words. [Potencies](../../vendor/steel-compendium/en/unified/md/rule/character/potency.md) distinguishes the target's tested characteristic from the user's potency value and includes resource-spending exceptions. Those rules belong in shared resolution, not copied into every ability.

Advanced but plausibly reusable constructs include:

- **Event subscriptions and provenance:** Face the Storm!, Rout, and Battle Plan attach rules to later actions and distinguish creatures taunted, marked, or judged **by this actor**. Those relationships refer to [Judgment](../../vendor/steel-compendium/en/unified/md/feature/ability/censor/level-1/judgment.md) and [Mark](../../vendor/steel-compendium/en/unified/md/feature/ability/tactician/level-1/mark.md), not just generic conditions.
- **Interception and replacement:** Parry changes pending damage after a chosen shift; Intercede redirects a strike despite normal target eligibility. [Triggered-action rules](../../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md) govern limits and participant-selected ordering.
- **Scoped memory:** Entropic Bolt counts previous targeting during the encounter. Wall of Fire needs round/turn timing and spatial occupancy. Fling Through Time stores a return location and schedules reappearance.
- **Temporary rules:** Magma Titan alters size, stability, immunity, damage, forced movement, and characteristic selection. Stasis Field changes death/destruction and, when strained, the usual [restrained](../../vendor/steel-compendium/en/unified/md/condition/restrained.md) prohibition on forced movement.
- **Choices and information:** Hurl Element chooses damage type; Extensive Rewrites chooses movement or a valid position swap; Battle Plan reveals information to specified recipients. Not every output is a numerical sheet change.

These examples argue for extensions expressed as reusable operations. They do not establish that every future clause can be covered without a special handler. Aging in Fling Through Time is an example of a result requiring campaign-level representation or recorded adjudication beyond combat numbers.

## Context and extraction hazards

**The extracted `effects` arrays are not complete executable definitions.** Magma Titan's array omits the five benefit bullets following “the following benefits.” Stasis Field's array omits the sentence restricting its power roll to enemies, although its overall target field includes every creature and object. Both passages survive in their Markdown bodies and the corresponding JSON `metadata.content`; this is incomplete extraction, not missing underlying text. A future import must retain and account for the full ordered content.

“Persistent” and “Strained” also require class context. [Persistent Magic](../../vendor/steel-compendium/en/unified/md/feature/elementalist/level-1/persistent-magic.md) reduces essence earned, imposes maintenance limits, and can end effects after accumulated damage. [Clarity and Strain](../../vendor/steel-compendium/en/unified/md/feature/talent/level-1/clarity-and-strain.md) permits negative clarity and explains when strained effects apply. These labels cannot be interpreted as ordinary unconditional effect sections.

Spatial output is not always the end of resolution. Force of Storms needs the original target's actual endpoint before selecting nearby creatures for its second push. Extensive Rewrites needs fit and occupancy facts. [Forced movement](../../vendor/steel-compendium/en/unified/md/movement/forced-movement.md) includes optional shorter distances, collisions, size modifiers, and ordering; [stability](../../vendor/steel-compendium/en/unified/md/rule/character/stability.md) is also a choice to reduce movement. A mapless client must supply relevant facts or record an unresolved instruction. It cannot silently substitute an empty board.

## Shared heroes/monsters core

The [Goblin Spinecleaver's Axe](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-spinecleaver.md) and Brutal Slam both use a power roll, numeric damage, and push distance per tier. The monster has a fixed roll modifier and damage; the hero uses characteristic expressions. The [Human Guard's Halberd](../../vendor/steel-compendium/en/unified/md/monster/human/statblock/human-guard.md) adds a conditional free strike when flanked, analogous to hero conditional follow-up actions. Their “per minion” targets and captain/passive traits remain monster context.

Recommendation: test separate **source adapters** for embedded monster blocks and standalone hero entries, feeding one shared ability representation and runtime. Class resources and monster organization rules supply context. Separate full hero and monster parsers would duplicate the strongest common structure; a per-name dispatcher would postpone testing whether the language actually generalizes.

## Small Fury experiment

For a later level-1 **Berserker Fury**, nominate [Brutal Slam](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md) as the chosen signature, [Back!](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/back.md) as the 3-ferocity choice, and [Blood for Blood!](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/blood-for-blood.md) as the 5-ferocity choice. These follow [Fury Abilities](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/fury-abilities.md). Add the Berserker's [Lines of Force](../../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/lines-of-force.md), granted by [Aspect Triggered Action](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/aspect-triggered-action.md), after basic damage/movement works. It introduces a real replacement and optional spend.

This is an ability set, **not a complete valid character**. Establish characteristics, Stamina, recoveries, kit and its ability/bonuses, ancestry traits, and relevant general combat rules. [Devil Traits](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/devil-traits.md) supplies ancestry-point choices; the narrative devil entry is insufficient. [Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md), [Growing Ferocity](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/growing-ferocity.md), and [Primordial Strength](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/primordial-strength.md) affect actual play and cannot disappear because the wizard is deferred. Character building can precompute chosen definitions, while these ongoing hooks remain runtime behavior.

Start with fixed supplied rolls and explicit geometry facts; verify both interpreted effects and actual before/after state, then history restoration. Keep some previously unexamined abilities from excluded classes as a held-out set before implementing the grammar. Evaluate them without per-ability edits first, recording supported clauses, unresolved clauses, and any incorrect behavior. Add a few controlled homebrew variations to test whether numbers, targets, and conditions are genuinely parameterized. That experiment—not this sample's familiarity—will answer whether the parser generalizes.
