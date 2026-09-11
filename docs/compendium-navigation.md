# Finding Draw Steel rules

Use the pinned local Compendium for definitions and implementation research. Start with its existing [Glossary Index](../vendor/steel-compendium/en/unified/md/chapter/introduction.md#glossary-index) and [category indexes](../vendor/steel-compendium/en/unified/md/_index/README.md); we do not maintain a second glossary. This is a navigation guide, not a claim that every rule is present or correctly extracted. See the [dependency guide](steel-compendium.md) for pinning and updates.

## Quick lookup

Run commands from the project root. Search filenames first, then relevant text:

```bash
rg --files vendor/steel-compendium/en/unified/md | rg -i 'power-roll|background|dynamic-terrain|light.?bender'
rg -n -i 'power roll|ability roll|background' vendor/steel-compendium/en/unified/md/chapter/introduction.md
```

Category indexes use ordinary relative links. Content links usually contain an SCC identifier, such as `scc.v1:mcdm.heroes.v1/rule.dice/power-roll`. Remove only the `scc.v1:` prefix and search for the exact frontmatter line:

```bash
rg -l -F -x 'scc: mcdm.heroes.v1/rule.dice/power-roll' vendor/steel-compendium/en/unified/md
```

Keep the sourcebook portion of the ID; a matching filename alone does not establish that you found the intended book.

| Starting question | Where to look next |
| --- | --- |
| Power roll | [Power Rolls](../vendor/steel-compendium/en/unified/md/rule/dice/power-roll.md), then [Power Roll Outcomes](../vendor/steel-compendium/en/unified/md/rule/dice/tier-outcome.md). |
| “Ability check” | Read [Ability Roll](../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md) and [How to Make a Test](../vendor/steel-compendium/en/unified/md/rule/test/test.md). They are distinct; clarify the intended action instead of automatically aliasing this phrase to either. |
| Background | [Background chapter](../vendor/steel-compendium/en/unified/md/chapter/background.md), then the culture and career entries it references. |
| Dynamic terrain object | [Dynamic Terrain chapter](../vendor/steel-compendium/en/unified/md/chapter/dynamic-terrain.md) for the general rules; [object index](../vendor/steel-compendium/en/unified/md/_index/dynamic-terrain.md) for individual entries. |
| “Light bender” | Search `lightbender`. Start with the [creature description](../vendor/steel-compendium/en/unified/md/monster/group/lightbender.md), then deliberately choose the standard stat block, a variant, or a companion. |

## When an entry is incomplete or surprising

Extracted chapters can omit sections moved into standalone entries and retain phrases like “see below.” Follow the related entries before concluding a rule is missing. Before implementing a stat block, read the general resolution rules and its referenced traits, keywords, conditions, and exceptions.

The unified view can select a chapter from another sourcebook: at the initial pin, `chapter/perks.md` is Beastheart and `chapter/rewards.md` is Summoner. Check frontmatter and use the book-specific text when necessary. Although sparse checkout hides those files, Git can read them locally:

```bash
git -C vendor/steel-compendium show HEAD:en/books/heroes/md/chapter/perks.md
git -C vendor/steel-compendium show 'HEAD:en/books/heroes/clean/Draw Steel Heroes.md' | rg -n -A 35 '^### Power Rolls$'
```

Use the same book-specific path pattern for `rewards.md`. The `clean` file retains source order and helps recover surrounding context.

For implementation notes, retain the relevant path or SCC ID and dependency revision. Markdown and JSON are representations of the same corpus, not independent confirmation. If text remains inconsistent or unclear after checking context, state the uncertainty and seek better source evidence; do not fill the gap from memory. Keep upstream files unmodified.
