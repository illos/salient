# Monster import: source inventory and extraction findings

V1 scope clarification (2026-09-11): this audit includes official supplemental Summoner and Beastheart content. Those classes and associated mechanics are excluded from v1; their counts and examples below are research evidence, not release acceptance targets. See the [reference-library scope](../reference-library-spec.md).

Research dated 2026-09-10 against Steel Compendium commit `fb83a789da8f0327a389c277a0c790b1648d5810`. Scope is research and specification only. Exploratory importer files were removed when the user constrained the work; this document does not describe a shipped importer or certified parser coverage.

**Finding:** the existing JSON is a strong starting point for a monster library. Names, classifications, most baseline stats, and embedded ability/trait records already exist. Full Markdown must accompany those projections. Expressions, inconsistent projections, and external dependencies prevent treating all imported values as ready for automatic play.

The proposed application contract and storage approach are in [the monster catalog specification](../monster-catalog-spec.md). The earlier [20-monster language study](monster-parser-sample.md) covers the deeper execution problems; this audit concentrates on import and storage.

## Corpus population

Enumerated sorted `en/unified/json/monster/**/statblock/*.json` paths and their same-path Markdown counterparts. Source identity comes from `metadata.scc` or top-level `scc`, retaining its book prefix. No dependency update or upstream file edit was made.

| Source | Stat-block files | Details |
| --- | ---: | --- |
| `mcdm.monsters.v1` | 437 | 409 standard organizations, 21 retainers, 7 with blank organization |
| `mcdm.summoner.v1` | 75 | 66 minions, 4 champions, 4 elites, 1 retainer |
| `mcdm.beastheart.v1` | 14 | Companion records using a different source format |
| `mcdm.heroes.v1` | 1 | Blank organization |
| **Total** | **527** | File location alone does not establish a standard enemy stat block |

The 409 standard Monsters-book entries divide into 116 Minions, 76 Hordes, 68 Platoons, 97 Elites, 30 Leaders, and 22 Solos. This matches the eligible population in the earlier [sample manifest](monster-sample.json); that study did not claim the entire corpus contained only 409 monsters.

There are 699 JSON files beneath `monster/`, of which 172 are outside `statblock/`. These include group descriptions, Malice sheets, and advancement material; they are not another 172 selectable foes. Additional relevant abilities live outside `monster/`, including `feature/companion/`.

## What the structured source supplies

Of the 527 files, 513 use `type: statblock`. The 14 Beastheart files use `type: feature-group`; they carry readable tables in `content`, but lack the same structured stats and embedded feature arrays. For example, [Drake](../../vendor/steel-compendium/en/unified/json/monster/companion/beastheart/statblock/drake.json) has a companion relationship and source identity; its [Markdown](../../vendor/steel-compendium/en/unified/md/monster/companion/beastheart/statblock/drake.md) gives Stamina as `= yours` and free strike as `1 + M`. This needs an adapter and owner/build context.

| Information | Source shape | Import consequence |
| --- | --- | --- |
| Identity | `metadata.scc` for ordinary blocks; top-level `scc` for Beastheart | Normalize source-qualified identity, retain source revision and original shape. |
| Level, speed, stability, free strike, five characteristics | Numbers in ordinary blocks | Useful projections, but check against the visible stat table. |
| Stamina | String even when it contains a fixed number | Parse only a complete numeric value; preserve all other forms. |
| Size | Strings such as `1S`, `2`, `2 or 3`, `1S-2` | Preserve categories, alternatives, and ranges; do not use `parseInt` as interpretation. |
| Encounter value | Number-like string, `3 for four minions`, `3 for 4 minions`, blank, or dash | Preserve the quantity basis; missing EV is not zero EV. |
| Organization and role | Distinct strings; role can be blank | A Solo or Leader need not have an additional combat role. |
| Movement | Text such as `Fly, hover` | Preserve movement modes separately from speed. |
| Immunity and weakness | Lists containing numeric values or expressions | Keep complete text and explicit unresolved values. |
| Captain benefit | `with_captain` prose | Conditional feature, not an unconditional baseline bonus. |
| Features | Embedded `ability` and `trait` records | Child identities need a local, revision-scoped convention. |

All 437 Monsters-book Stamina strings are simple integers. Across the 513 ordinary structured records, 50 Stamina strings are not: 46 use repeated values separated by bars, and 4 say `SPECIAL`. Do not add, split into damage tiers, or choose one value without reading the relevant summon rules.

## Consistency checks and their limits

One-off read-only scans compared ten labeled Markdown table cells against the JSON projection: size, speed, Stamina, stability, free strike, and the five characteristics. Across 513 records, **5,122 of 5,130 cells agree after display normalization; eight disagree**. Normalization removes links/bold markup, leading numeric `+`, and Markdown escapes on literal bars. No numeric coercion of expressions was used for this comparison.

Every discrepancy is stability `0` in JSON versus `R` in Markdown, in these Summoner paths relative to `en/unified/`:

- `json/monster/minion/summoner/elemental/statblock/iron-reaver.json`
- `json/monster/minion/summoner/elemental/statblock/knight-of-blood.json`
- `json/monster/minion/summoner/elemental/statblock/principle-of-the-swamp.json`
- `json/monster/minion/summoner/elemental/statblock/walking-boulder.json`
- `json/monster/minion/summoner/fey/statblock/sprite-olyender.json`
- `json/monster/minion/summoner/undead/statblock/ceaseless-mournling.json`
- `json/monster/minion/summoner/undead/statblock/zombie-lumberer.json`
- `json/monster/minion/summoner/undead/statblock/zombie-titan.json`

See [Iron Reaver JSON](../../vendor/steel-compendium/en/unified/json/monster/minion/summoner/elemental/statblock/iron-reaver.json) and [its visible table](../../vendor/steel-compendium/en/unified/md/monster/minion/summoner/elemental/statblock/iron-reaver.md). A conflict must leave the usable numeric stat unresolved, with both representations available. This audit does not establish the correct binding of `R` for every such entry.

These checks cover ten fields, not every stat, metadata field, or ability envelope. Markdown and JSON are sibling representations of the same corpus, not independent authorities. Agreement cannot reveal an error shared by both. The scan is a reproducible population/consistency observation, not a measured probability of correct game behavior.

## Identifying abilities and traits

The embedded feature arrays contain **1,992 features: 1,193 abilities and 799 traits**. Of these, 1,157 abilities and 639 traits belong to Monsters-book entries. The Noncombatant legitimately has no embedded features. The Beastheart files' lack of embedded arrays does **not** mean their companions have no abilities.

A one-off heading association scan matched **all 1,992 embedded feature names to distinct Markdown feature headings**, with no leftover headings under the scanned convention. Method: identify icon-prefixed quoted bold headings; normalize links and horizontal whitespace; match the feature name with an optional parenthetical suffix or the observed inline-roll suffix. Consume each heading once. This establishes name association at this pin, not full section-boundary correctness, complete envelope extraction, or semantics. The matching rules were adjusted while examining this corpus; there was no independent holdout test.

Observed presentation variants that a future importer must handle:

- [Manticore](../../vendor/steel-compendium/en/unified/md/monster/manticore/statblock/manticore.md) has `>☠️` without a space; [Rival Null](../../vendor/steel-compendium/en/unified/md/monster/rival/3rd-echelon/statblock/rival-null.md) has extra spaces after the quote marker.
- Retainer headings such as [Human Warrior's Chop](../../vendor/steel-compendium/en/unified/md/monster/retainer/statblock/human-warrior.md) have repeated spaces before `(Signature Ability)`.
- 23 headings embed `2d10 + …` between the name and signature label. [Demon Lord's Aspect](../../vendor/steel-compendium/en/unified/md/monster/champion/summoner/demon/statblock/demon-lords-aspect.md) also presents outcomes as unlabeled lines. Finding the heading does not make those outcomes safe to compile.
- Villain-action ordinal is stored in `cost`, for example `Villain Action 3`, with usage `-`. [Thorn Dragon](../../vendor/steel-compendium/en/unified/json/monster/dragon/statblock/thorn-dragon.json) demonstrates this. It is not a three-point resource cost.
- Some tier tables are target tests. Thorn Dragon's [Virulent Breath](../../vendor/steel-compendium/en/unified/md/monster/dragon/statblock/thorn-dragon.md) explicitly tells each target to make a Might test.
- Triggered actions, free triggered actions, traits, signature abilities, and villain actions must remain distinguishable. An icon alone cannot supply their execution semantics.

The existing [experimental loader](../../src/content.ts) is sufficient for its chosen goblins, but is not a general catalog contract: it converts Stamina using `Number`, truncates size with `parseInt`, uses a narrower heading pattern, and turns traits into name tokens rather than carrying their complete text on the entity. Expanding its call sites to all monsters would not establish reliable import. No change to that loader is part of this research task.

## Ambiguities and rules outside the block

| Evidence | Consequence |
| --- | --- |
| Seven Monsters-book trolls list an acid weakness with a number followed by `fire` without a number; [Troll Butcher](../../vendor/steel-compendium/en/unified/md/monster/troll/statblock/troll-butcher.md) is one example. | Retain the exact list and flag the fire amount. Do not assume it repeats the acid amount. |
| [Shieldscale Drangolin](../../vendor/steel-compendium/en/unified/md/monster/kobold/statblock/shieldscale-drangolin.md) has size `2 or 3`; [Noncombatant](../../vendor/steel-compendium/en/unified/md/monster/noncombatant/statblock/noncombatant.md) has `1S-2`. | Encounter preparation needs a choice or an unresolved value, rather than silent truncation. |
| [Malice](../../vendor/steel-compendium/en/unified/md/rule/monster/malice.md) includes Basic Malice; [Goblin Malice](../../vendor/steel-compendium/en/unified/md/monster/goblin/goblin-malice.md) supplies separate group options. | Embedded abilities are not the complete set of available actions. The Director's encounter resource is shared. |
| [Monster Basics](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md) defines pooled minion Stamina; [captains](../../vendor/steel-compendium/en/unified/md/rule/monster/captain.md) have separate Stamina and grant conditional bonuses. | Runtime storage requires squads and captain relationships, not just independent monster health fields. |
| Thorn Dragon refers to a domain trait in [the dragon group entry](../../vendor/steel-compendium/en/unified/md/monster/group/dragon.md). Multiple dragon Malice sheets occupy the same directory. | A shared directory is useful for related reading, but cannot prove every nearby feature is granted to a creature. |
| [Drake advancement](../../vendor/steel-compendium/en/unified/md/monster/companion/beastheart/advancement-features/drake.md) and [Elementally Attuned](../../vendor/steel-compendium/en/unified/json/feature/companion/beastheart/drake/level-1/elementally-attuned.json) are separate records. | A complete companion feature set requires build/advancement context and overlaps the character workstream. |

## Research conclusion

Recommend starting the first implementation with the 409 standard Monsters-book foes, retaining an inventory of the other categories and complete readable content where available. This is a proposed implementation order, not a change to the eventual complete glossary requirement.

The evidence supports deterministic extraction of library entries and feature identities. It does not justify a whole-monster “automated” flag. Reliability should be measured separately for source inventory, field consistency, full-text preservation, ability-envelope extraction, supported clauses, and actual engine/state behavior. The next implementation task should generate those measurements from its actual importer and tests, using the acceptance examples in [the specification](../monster-catalog-spec.md#acceptance-examples-for-a-later-implementation).
