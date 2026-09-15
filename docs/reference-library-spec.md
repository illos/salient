# Reference libraries and v1 content scope

Version 0.4 — embedded core library implementation, 2026-09-15.

**Checkout status:** `/rules` provides the public core-book compendium. The implementation note below
records its import, rendering and sharing contracts. Existing table reference snapshots remain separate.

Related specifications: [monster catalog](monster-catalog-spec.md),
[character wizard](character-wizard-spec.md), [inventory](inventory-spec.md), and
[content/data architecture](data-architecture-spec.md).

**Research and implementation, 2026-09-15:** [the investigation](research/embedded-compendium.md)
records the upstream implementation, measured pinned-corpus coverage and native-stack approach. The user
subsequently authorized the embedded library for the provisional internal-tool stage.

## Confirmed pre-alpha scope

The earlier v0.01 deferral of standalone rules browsing was superseded for this assignment on 2026-09-15. The user explicitly identified it as a
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

- **Confirmed long-term direction, 2026-09-15:** the embedded Compendium participates in the app's
  [unified object-reference and sharing model](data-architecture-spec.md#35-unified-object-references-and-sharing).
  Rules, inventory items and other supported objects should use the same foundation for readable links,
  chat sharing and bookmarks. Build Compendium navigation so later consumers can reference the same
  content; exact contracts and delivery milestones remain open.
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

**Confirmed quality priority, 2026-09-15:** search needs to be very good. Treat relevance as a feature
to verify, alongside responsiveness. Proposed acceptance covers exact names, partial names, misspellings,
type/book filters, chapter-only prose and duplicate suppression. Use representative queries with expected
entries/sections to compare ranking changes; merely returning results is insufficient. The
[stack investigation](research/embedded-compendium.md#stack-fit-and-search-recommendation) recommends
an initial search implementation, with performance and relevance targets still to be measured and agreed.

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

Reference bookmarks remain excluded from the currently recorded v1 milestone, but are an explicitly desired
future use of the shared object model (2026-09-15); their implementation timing has not been reassigned.
The implemented layout, filters, navigation and core coverage are recorded below; future consumers can
reuse its IDs without depending on presentation routes.

## Implementation note — embedded core compendium, 2026-09-15

The user authorized implementing the complete core library under `/rules` for the provisional internal
tool stage. Heroes and Monsters, including their chapters and individual records, come from the pinned
per-book Markdown trees. The unified tree is unsuitable as the sole core source because supplements
replace some core sections there. Ingest reads immutable Git blobs without changing the sparse checkout
or the pin. Both raw Markdown (for search) and expanded Markdown (for full articles) are consumed.

`pnpm rules:ingest` generates ignored static assets in `public/rules-data/`; normal dev/build commands
run it automatically. The catalog records the revision and a content version. Entries have stable SCC
IDs, local page paths, source book/path and `sourceUrl`, a direct link to the original Steel Compendium
page. The user explicitly requested this URL metadata so future reference renderers can choose either
an internal page or the original page. Book/page-number provenance is not fabricated where absent.

The native React route renders sanitized headings, lists, tables, emphasis and links. Source attributes,
frontmatter syntax and machine IDs stay out of normal reading text. Frontmatter-only facts such as
ability cost, signature status, level, item echelon/type and kit type appear as readable labels. An article footer provides a readable source
book and upstream link. Core creatures and items are browsable here as topics; reading never adds them
to a roster/inventory. Search runs in a lazy web worker with exact-title priority, prefix matching, typo
fallback and book/topic filters. Content has no access to campaign queries. The existing campaign auth
boundary is retained. Shared ID-based link/article components establish reuse; chat embeds, bookmarks,
inventory instances and hover previews remain subsequent consumers of the shared model.

The generated audit records core-book provenance and creature eligibility reasons. Source coverage does
not imply mechanical automation. No artwork or upstream website runtime is imported. Attribution and the
provisional data-repository license uncertainty remain in `THIRD_PARTY_NOTICES.md`.
