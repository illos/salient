# Reference libraries and v1 content scope

Version 0.3 — consolidated specification checkpoint, 2026-09-11. Specification only; no implementation.

**Checkout status, 2026-09-14:** no reference library exists. The only readable Compendium text in the app is the
Director-only Goblin Warrior source snapshot served by [convex/foes.ts](../convex/foes.ts) (`detail`), taken from
Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`. Hero ability text at the table awaits the
character evaluator.

Related specifications: [monster catalog](monster-catalog-spec.md),
[character wizard](character-wizard-spec.md), [inventory](inventory-spec.md), and
[content/data architecture](data-architecture-spec.md).

## Confirmed pre-alpha scope

For v0.01, standalone rules search/reference browsing is deferred. The user explicitly identified it as a
separate feature that can be developed independently. Heroes, foes and abilities used in the prototype still
show their relevant reference text at the table. Reading that text does not depend on implementing rules
search or automating every described mechanic. The required catalog-to-foes-roster loading path remains in
scope. This feature boundary does not require a separate application or deployment.

The broader library coverage below remains the fuller-product destination.

## Confirmed library coverage

- **Rules:** v1 provides a searchable reference for all core rules. Reference availability is not restricted
  to mechanics already automated by the app.
- **Foes:** include in-scope official retainers, companions, and summons alongside standard monsters, subject
  to the source exclusions below. Their distinct mechanics may require different adapters; a readable entry
  does not establish playable automation.
- **Items:** include in-scope official items even when their mechanics are not yet automated. Preserve
  readable descriptions and rules; show supported, manual, or unresolved behavior accurately when used in
  play.
- These remain public reference libraries usable without joining a campaign. Reference reading does not grant
  access to private inventories, templates, or table state, or permit a player to add loot directly to their
  inventory.

## Confirmed release scope

**Confirmed v1 scope: core rulebooks only.** Character creation and advancement support every core class
through levels 1–10. All official supplemental content, if present in the source corpus, is outside v1,
including Summoner, Beastheart, and their associated mechanics. Homebrew monsters, character options, and
items are also excluded. Creating characters from core options and saving encounters/rewards assembled from
core content remain in scope; these are user-created records, not homebrew rules content.

## Official content is not necessarily core content

User clarification: **Summoner and Beastheart are official MCDM content, but are not core-rulebook classes and
are not v1 targets. Their associated mechanics are also outside v1.** This qualifies the broad
library-coverage decisions above; the presence of their summons, companions, features, or rules in the
Compendium must not expand v1 scope implicitly.

Homebrew authoring and selection of monsters, character options, and items are deferred beyond v1. Do not
classify official supplemental content as homebrew merely because it is excluded from this release.

Compendium presence, official authorship, core-book membership, v1 inclusion, and automation support are
distinct properties. The inspected character corpus includes Summoner and Beastheart; that corpus count is not
the app's v1 class list. The monster audit likewise includes their supplemental creature records.

## Proposed source and delivery contract

- Retain source-qualified identities and publication provenance. Classify core versus supplemental content
  using identified source material, not a generic class/monster category or the fact that data lives in a
  unified directory.
- Apply v1 scope consistently to library entries, character choices, encounter selections, and mechanics. Do
  not make excluded supplemental classes playable by importing a file or following a related-content link.
  Preserve unsupported import data under the existing compatibility policy without claiming it is supported
  gameplay.
- Keep an explicit source/coverage inventory. The [monster audit](research/monster-import-audit.md) identifies
  `mcdm.summoner.v1` and `mcdm.beastheart.v1`; these are useful provenance evidence. Audit dependencies and
  source context before finalizing the included corpus rather than relying only on paths or names.
- Preserve links between in-scope rules, items, and creature entries. An unresolved dependency must not become
  an invented rule or silently count as implemented support.
- Keep readable content available while automation expands. Existing partial-automation/manual-resolution
  requirements apply to in-scope content; supplemental exclusions are a release-scope decision, not a
  temporary parsing failure.

## Proposed acceptance examples

- Every core class can be created and advanced through levels 1–10 with its sourced choices. This does not
  assert full automation of every gameplay mechanic.
- Official supplements and homebrew do not become selectable through pack configuration or imports; core-based
  user characters and saved encounters remain supported.
- Search finds core rules even when the app has no automated operation for the referenced mechanic.
- An in-scope official item remains readable without falsely claiming its effects are automated; viewing it
  does not create an owned item.
- Foes reference coverage accounts for eligible retainers, companions, and summons as well as standard
  monsters. Unsupported adapters are reported separately from missing reference content.
- Summoner, Beastheart, and their supplemental dependencies do not enter v1 choices merely because they exist
  in the unified Compendium corpus. Their official provenance remains correctly identified.

Reference bookmarks are excluded from v1. Search layout, filters, link navigation, and exact category
presentation need further design. Numerical coverage targets must be recomputed against the scoped source
inventory; broad corpus counts are not v1 acceptance counts.
