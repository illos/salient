# Monster parser feasibility: exploratory sample

**Finding:** the samples justify trying a shared rules-language parser and interpreter. They do not justify expecting a small numeric-tier parser to execute complete creatures. Reusable mechanics recur throughout; unusual abilities mostly require combinations of events, choices, scoped modifiers, relationships, and spatial queries. Some require substantially richer constructs or remain ambiguous.

This is a reading-based assessment, not an implemented parser, success-rate measurement, or verified simulation. Official source: `mcdm.monsters.v1`, Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`. No upstream files changed.

## Selection and scope

The [sample manifest](monster-sample.json) records exact paths, full SCC IDs, metadata, seed, and selection algorithm. Eligible population: 409 recursively discovered `monster/**/statblock/*.md` entries with Monsters-book SCC IDs, integer levels, and Minion/Horde/Platoon/Elite/Leader/Solo organization. Retainers, companions, and entries without qualifying metadata were excluded. This is an explicit population filter, not a claim that the corpus contains only 409 monsters.

Using Python `random.Random("draw-steel-parser-feasibility-2026-09-10")`, sample one from each nonempty level-band × organization cell, visiting bands 1–3, 4–6, 7–11 and organizations in the order above. Within each cell, prefer groups not already sampled; randomly choose from eligible candidates in sorted path order. Skip empty cells without consuming randomness. This yields 17 entries (no high-band Platoon). Add unused entries from goblin, human, and undead, in that order, with the same selection rule: 20 total, 18 groups, all six organizations, eight roles, and actual levels 1–9. Leaders and solos have no additional role. This deliberately diverse exploration is not statistically representative; level 10–11 and Mount-role coverage remain absent.

Read every sampled stat block in full, including traits and triggered/villain actions, and the associated group Malice sheets. Followed named dependencies such as Seeping Blight, the thorn dragon domain, and Implanted Parasite, plus common combat/minion rules. Dependency chains were inspected to expose requirements, not exhaustively certified; lower-echelon Malice imports, summoned creatures, and copied arbitrary traits expand the eventual scope.

| Stat block (exact path) | Level | Organization | Role | Group | Non-tier work observed |
| --- | ---: | --- | --- | --- | --- |
| [Angulotl Cleaver](../../vendor/steel-compendium/en/unified/md/monster/angulotl/statblock/angulotl-cleaver.md) | 1 | Minion | Ambusher | angulotl | Jump before/after; poison event hook |
| [War Dog Eviscerite](../../vendor/steel-compendium/en/unified/md/monster/war-dog/1st-echelon/statblock/war-dog-eviscerite.md) | 1 | Horde | Harrier | war-dog | Pull→optional grab; death explosion |
| [High Elf Palinode](../../vendor/steel-compendium/en/unified/md/monster/elf-high/statblock/high-elf-palinode.md) | 1 | Platoon | Support | elf-high | Potency; teleport/healing; respite consequence |
| [Predator B](../../vendor/steel-compendium/en/unified/md/monster/animal/statblock/predator-b.md) | 3 | Elite | Brute | animal | Trample per-turn damage; environment predicate |
| [Wode Elf Warleader](../../vendor/steel-compendium/en/unified/md/monster/elf-wode/statblock/wode-elf-warleader.md) | 3 | Leader | — | elf-wode | Sequenced strikes; forced turn; villain actions |
| [Thorn Dragon](../../vendor/steel-compendium/en/unified/md/monster/dragon/statblock/thorn-dragon.md) | 2 | Solo | — | dragon | Target tests; custom dragonsealed; aura/domain |
| [Shadow Elf Sniper](../../vendor/steel-compendium/en/unified/md/monster/elf-shadow/statblock/shadow-elf-sniper.md) | 4 | Minion | Artillery | elf-shadow | Next-strike edge; sunlight/concealment modifiers |
| [Flesh Mournling](../../vendor/steel-compendium/en/unified/md/monster/undead/2nd-echelon/statblock/flesh-mournling.md) | 4 | Horde | Defender | undead | Death replacement; respite consequence |
| [Hobgoblin Hell Trooper](../../vendor/steel-compendium/en/unified/md/monster/hobgoblin/statblock/hobgoblin-hell-trooper.md) | 4 | Platoon | Brute | hobgoblin | Taunt-linked damage; death explosion |
| [Troll Butcher](../../vendor/steel-compendium/en/unified/md/monster/troll/statblock/troll-butcher.md) | 5 | Elite | Hexer | troll | Next-use ability rewrite; death exception |
| [Voiceless Talker Evolutionist](../../vendor/steel-compendium/en/unified/md/monster/voiceless-talker/statblock/voiceless-talker-evolutionist.md) | 6 | Leader | — | voiceless-talker | Copy trait; summon; target-owned tests |
| [Olothec](../../vendor/steel-compendium/en/unified/md/monster/olothec/statblock/olothec.md) | 6 | Solo | — | olothec | Custom statuses; permanent transformation |
| [Hill Giant Mosstooth](../../vendor/steel-compendium/en/unified/md/monster/giant/statblock/hill-giant-mosstooth.md) | 7 | Minion | Brute | giant | Held entity as weapon; target redirection |
| [Blight Phage](../../vendor/steel-compendium/en/unified/md/monster/demon/3rd-echelon/statblock/blight-phage.md) | 7 | Horde | Controller | demon | External Seeping Blight terrain definition |
| [Rival Talent](../../vendor/steel-compendium/en/unified/md/monster/rival/3rd-echelon/statblock/rival-talent.md) | 8 | Elite | Hexer | rival | Damage replacement; rivalry roll bonus |
| [Soulraker Hivequeen](../../vendor/steel-compendium/en/unified/md/monster/demon/3rd-echelon/statblock/soulraker-hivequeen.md) | 9 | Leader | — | demon | Parasite entity; delayed transformation; remote sight |
| [Kingfissure Worm](../../vendor/steel-compendium/en/unified/md/monster/kingfissure-worm/statblock/kingfissure-worm.md) | 7 | Solo | — | kingfissure-worm | Targetable tongues; swallowed entities; terrain creation |
| [Goblin Spinecleaver](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-spinecleaver.md) | 1 | Minion | Brute | goblin | Damage/push; Crafty; squad/captain |
| [Human Guard](../../vendor/steel-compendium/en/unified/md/monster/human/statblock/human-guard.md) | 1 | Minion | Brute | human | Flanking grants another strike; concealment exception |
| [Wraith](../../vendor/steel-compendium/en/unified/md/monster/undead/2nd-echelon/statblock/wraith.md) | 4 | Horde | Hexer | undead | Delayed spawning; healing interception; phasing |

## Shared language versus complete behavior

All 20 contain the familiar ability envelope and tier notation, and all 20 also contain mechanically relevant text outside numeric tiers. This is an observation about these files, not parser coverage.

**Small reusable grammar candidates:** keywords; action usage; range/area/target selectors; actor roll versus target test; constant or characteristic-based numbers; typed damage; push/pull/slide; potency comparisons; conditions; durations; costs; and ordered effect sequences. Linked and unlinked spellings, capitalization, punctuation, and presentation icons need normalization without losing source order.

The spinecleaver's Axe (lines 40–44) is the clean example: a roll modifier and three damage/push outcomes. The palinode's Instill Regret adds an Intuition threshold and save-ended weakened effect. Their numerical differences do not suggest different parsers. Hero abilities use the same semicolon/characteristic/potency conventions, explicitly demonstrated by [Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md), including the fury's Brutal Slam. A shared expression/effect interpreter with separate content-envelope adapters is plausible; monster constants and hero characteristic expressions can be variants of the same numeric expression.

**Generic advanced constructs:**

- Event subscriptions and counters: Toxiferous, Loyalty Collar, Trample, Agonizing Phasing, and the hivequeen's second-strike trigger. “First time on a turn” and “first time in a round” are distinct scopes.
- Temporary modification and replacement: Wraith Stolen Vitality redirects healing; Rival Talent Mind Requital halves damage; Flesh Mournling Arise replaces a first qualifying defeat; Troll Gourmet Flesh rewrites the next use of a named ability.
- Choices and bindings: jump before/after attacking; select targets and movement endpoints; copy one allied trait; choose condition/damage pairs. Determinism requires those choices as explicit inputs, not invented decisions.
- Spatial and temporal selectors: adjacency, natural environment, sunlight, line of effect, aura membership, next strike, source's next turn, encounter end. A client without coordinates still needs to supply relevant facts or leave effects unresolved.
- Named references and nested execution: a villain action uses Wodeblade; Blight Pus creates terrain described in [Demon Malice](../../vendor/steel-compendium/en/unified/md/monster/demon/3rd-echelon/demon-malice-level-7-malice-features.md). Blight Pus's simple damage tiers do not make the whole ability simple.

**Hard counterexamples to a small parser:** Kingfissure Worm has separately targetable tongues with Stamina, dependent grabs, swallowed creatures, damage accumulation, and terrain changes. Olothec defines custom statuses with associated rules and a permanent transformation. Soulraker Hivequeen delegates to [Implanted Parasite](../../vendor/steel-compendium/en/unified/md/monster/demon/3rd-echelon/statblock/soulraker-handmaiden.md), which involves linked creatures, inherited abilities, gestation, and a downtime cure. Those are candidates for reusable entity/relationship constructs or explicit extensions, not a reason to hardcode every monster by name. This sample cannot establish which approach will be cheaper.

Thorn Dragon Virulent Breath and the evolutionist's Show Me Who You Are have three outcomes but ask **each target to make a test**. Interpreting every tier table as one attacker's roll would produce the wrong game even with perfectly extracted numbers.

## Rules omitted from individual abilities

- [Monster Basics](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md), lines 117–177: minions have a shared Stamina pool, special casualties/area damage rules, and one squad roll. Additional attackers add free-strike damage rather than duplicate the entire ability. [Captains](../../vendor/steel-compendium/en/unified/md/rule/monster/captain.md) provide conditional bonuses. An individual minion is not an ordinary independent health record.
- [Ability Roll](../../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md), line 49: deal tier damage to all targets before tier effects by default; resolve multiple effects in listed order. [Triggered actions](../../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md) supply usage and ordering rules.
- [Forced movement](../../vendor/steel-compendium/en/unified/md/movement/forced-movement.md) and [stability](../../vendor/steel-compendium/en/unified/md/rule/character/stability.md): movement is up to the listed amount, with choices, size interactions, collisions, terrain triggers, and stability reduction. Damage followed by forced movement can defer death-triggered effects until after movement.
- [Temporary Stamina](../../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md), [EoT](../../vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md), [potency](../../vendor/steel-compendium/en/unified/md/rule/character/potency.md), [creature free strikes](../../vendor/steel-compendium/en/unified/md/rule/monster/creature-free-strike.md), [Malice](../../vendor/steel-compendium/en/unified/md/rule/monster/malice.md), and [villain actions](../../vendor/steel-compendium/en/unified/md/rule/monster/villain-action.md) supply nonlocal resolution rules. Basic Malice applies even without a group sheet.

These findings also show that “combat-only” cannot mean “discard every longer-lived consequence”: the palinode and mournling affect a subsequent respite, while the parasite points to downtime. A combat experiment can record such consequences without implementing those other systems yet.

## Uncertainty and next experiment

Do not silently interpret incomplete or ambiguous input. Troll Butcher's weakness list says `Acid 5, fire` without a fire value; that value is unresolved here. Olothec's tier text mixes potency with “or” and “and,” needing careful scope interpretation. Thorn Dragon refers to a domain trait in the separate [dragon group entry](../../vendor/steel-compendium/en/unified/md/monster/group/dragon.md), line 192. The boundary between descriptive prose, executable meaning, and source extraction problems needs explicit treatment.

Nominate **[Goblin Warrior](../../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md)** (purposefully inspected outside the random sample) and **Goblin Spinecleaver** for the later CLI demonstration. Start with the warrior's ordinary Spear Charge use: numeric tiers, actual sheet damage, and Crafty. Then Bury the Point adds a Malice cost, potency, bleeding, and a saving throw. Add the spinecleaver to exercise push and the actual squad/captain rules. Charge movement, group/basic Malice options, and common actions remain real dependencies; unsupported branches must be named rather than silently ignored.

This is a progression of explicitly scoped actions, not permission to label either creature fully supported early. Preserve roll and choice inputs; verify expected effects separately from stored changes and history restoration. Reserve several unimplemented abilities and homebrew variations for a later holdout: changed names/numbers and recombined supported clauses should work without name-specific code, while genuinely new wording should produce a clear unsupported result. Only an executable experiment can establish real parser reliability.
