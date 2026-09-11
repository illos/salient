# Reusable rules content: storage options

Research, 2026-09-10. Proposals, not architectural decisions. Inspected Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`; no upstream content changed.

The useful distinction is **content definitions versus individual game objects**, not Markdown versus database. We already have structured JSON. It can save extraction work, but it does not make rules executable. A small portable content package is a promising first experiment; a Convex catalog mirror is optional and solves different problems.

## What the existing data actually provides

| Inspected entry | Already extracted | Interpretation still required |
| --- | --- | --- |
| [Troubadour JSON](../../vendor/steel-compendium/en/unified/json/class/troubadour.json), [Markdown](../../vendor/steel-compendium/en/unified/md/class/troubadour.md) | Numeric `starting_stamina`, `stamina_per_level`, `recoveries`; `primary_characteristics`; identity. | Potencies are linked text expressions. Skill choices are prose. Advancement remains a Markdown table in `content`, linking separate features. This is not a ready-to-run character wizard definition. |
| [Drama](../../vendor/steel-compendium/en/unified/json/feature/troubadour/level-1/drama.json) | Feature name, class, level, and an `effects` array. | An `effect` string contains resource generation, event triggers, restrictions, resurrection, and narrative commentary. Array membership alone does not identify executable operations. |
| [Harsh Critic](../../vendor/steel-compendium/en/unified/json/feature/ability/troubadour/level-1/harsh-critic.json) | `cost`, `distance`, `target`, `keywords`, `usage`, and roll/tier/effect fields. | `cost` is “3 Drama”; tiers are expressions such as “7 + P sonic damage.” A separate prose effect temporarily suppresses certain effects of a target's next ability. Markdown links remain inside mechanical fields. |
| [Goblin Spinecleaver](../../vendor/steel-compendium/en/unified/json/monster/goblin/statblock/goblin-spinecleaver.json) | Level, role, organization, characteristics, embedded ability/trait records. | Stamina is a string; EV describes a minion grouping. Tier strings combine damage and pushing. Crafty and the captain bonus remain prose. |
| [King's Roar](../../vendor/steel-compendium/en/unified/json/treasure/leveled/armor/kings-roar.json) | Keywords, project fields, and `level_effects` keyed by level. | Each level's bonuses, granted maneuver, movement, and condition remain prose. One item crosses character statistics, combat, and crafting; storing it does not require implementing all those systems immediately. |

JSON is therefore a useful extraction layer, not an independent rules authority or executable semantics. Keep readable text alongside anything derived from it.

The parallel hero audit found concrete incomplete projections, which I checked: [Magma Titan](../../vendor/steel-compendium/en/unified/json/feature/ability/elementalist/level-6/magma-titan.json) loses all five benefit bullets from `effects`, while [Stasis Field](../../vendor/steel-compendium/en/unified/json/feature/ability/talent/level-6/stasis-field.json) omits the sentence limiting its power roll to enemies. Both retain that information in `metadata.content` and their Markdown bodies. Import the full body losslessly; do not compile only the extracted `effects` array. The structured fields can assist parsing, but cannot establish completeness.

Identity also needs a small adapter: Troubadour and King's Roar use top-level `scc`; Spinecleaver uses `metadata.scc` as a string; the sampled hero features use `metadata.scc` as an array. Embedded monster features lack separate SCC identities. A package can assign local child keys without pretending upstream supplied permanent IDs.

Use full source-qualified SCC identifiers, not filenames or names alone. The unified [Perks chapter](../../vendor/steel-compendium/en/unified/md/chapter/perks.md) is Beastheart and [Rewards](../../vendor/steel-compendium/en/unified/md/chapter/rewards.md) is Summoner. I verified distinct Heroes chapters exist at `en/books/heroes/md/chapter/{perks,rewards}.md` through `git show`. A catalog relying only on unified filenames could omit intended book content. See the [navigation guide](../compendium-navigation.md) for recovery commands.

## Three approaches

| Approach | Advantages | Costs / limits | Suitable use |
| --- | --- | --- | --- |
| Markdown interpreted by each UI | Quick readable reference; close to source; no catalog import needed. | Repeats interpretation across clients; couples rules to presentation; CLI must reproduce that work. Rendering Markdown does not resolve its mechanics or linked dependencies. | Early reference pages. Poor fit for the shared executable rules boundary. |
| Normalized, versioned content package read by engine/clients | Reuses existing JSON; one format adapter; portable files; same definitions reach CLI and UI; source revision can be pinned. | Requires a modest build/loader and explicit treatment of unsupported text. Full normalization of every class now would be premature. Search/distribution need separate choices later. | Hypothesis to test with a tiny combat slice. “Normalized” need only mean consistent IDs and fields initially. |
| Convex catalog mirror with search/indexes and immutable revision references | Shared library queries, filters, and user homebrew can live beside the app. Content delivery need not require a client to download the entire corpus. | Adds import and revision-retention work. Database placement does not solve parsing. An engine that queries Convex directly loses independence unless callers provide content or export it first. | Possible app delivery/search layer, after actual lookup requirements emerge. |

Convex supports full-text search over a string field with configured equality filters, and search queries are reactive. A searchable text projection plus fields such as source, kind, level, or role is feasible; the exact filters should follow the UI. This is a capability check, not a reason to build a mirror now. [Official full-text search documentation](https://docs.convex.dev/search/text-search).

## Suggested boundaries to test

**Sources and representations.** Keep the pinned Compendium as the upstream reference, with any project corrections outside it. Treat normalized display data and compiled mechanics as derived artifacts. Retain unhandled text explicitly: a readable entry may be available in the library while unsupported for automated play. Neither a successful import nor a source link proves correct execution.

**Portable identity.** A definition reference needs its source-qualified identity and content revision. Record the compiler/package version when derived executable content changes. Convex generates its own document IDs; keep those as persistence details alongside portable definition keys, rather than making the standalone engine depend on them. [Official document-ID documentation](https://docs.convex.dev/database/document-ids).

**Definitions and instances.** Troubadour defines options and progression. A player's character holds their selections and current state. A table participant needs resolved values and the exact definitions relevant to play. Loading a saved encounter creates the independent snapshot already required by the project. Later content updates must not silently recalculate that snapshot or old history. Preserve the relevant definitions by retained revision or embedded copy; we need not choose the storage layout yet. History navigation restores recorded values without re-running either parsing or modifiers.

**Homebrew.** Give homebrew its own identity and revisions, and aim for the same normalized ability/effect shape as official material. Its editable source can live in Convex. Run authored text through the same supported-language parser; editing does not silently replace a table's existing copy. Avoid a second execution path just because content is user-owned.

**What belongs in Convex.** Accounts, ownership, campaign membership, editable creations, character instances, live table state, and recorded actions fit the established application boundary. An official catalog mirror could be another application service. The engine should accept supplied definitions and state without needing an account, database connection, or UI.

**Updates.** Fetch and inspect upstream changes without advancing the active pin. Rebuild the small derived slice and rerun its behavior examples before adopting a useful revision. Preserve revisions used by ongoing tables. Keep this to existing Git pinning plus a small package manifest, not per-rule approval queues or proof machinery.

## Smallest useful experiment

Load two goblin definitions and the content needed by one agreed level-one hero into a small local package. Normalize IDs and existing fields; parse only mechanics actually exercised, while reporting unsupported text. Have a CLI resolve an action against supplied state. Inspect both effects and resulting sheet values, then restore before/after states from the record. Separately inspect one Troubadour entry to see what a future wizard would still need; do not build the wizard or mirror yet.

This tests whether one portable representation serves content lookup and execution. It leaves engine language, database catalog layout, and the treatment of noncombat systems open.
