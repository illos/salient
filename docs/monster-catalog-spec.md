# Monster catalog, import, and storage specification

Status: **proposed design, 2026-09-10; research and specification only.** The user requested monster import/storage research, then explicitly constrained this work to research and spec writing. No catalog importer, database schema, deployment, or UI is delivered by this task. The character-builder workstream remains separate.

The [source audit](research/monster-import-audit.md) records the corpus counts, observed inconsistencies, and limits of the exploratory checks. This document builds on [the product inventory](product-features.md), [engine architecture](engine-architecture.md), and [storage research](research/content-storage-options.md).

The [data architecture checkpoint](data-architecture-spec.md) connects these definitions and independent encounter loads to encounter undo, realtime sessions, and compressed history after session closure. It distinguishes the saved encounter template from an encounter run and proposes segments for a run that spans sessions.

## Confirmed requirements and proposed first scope

Existing requirements: a public Foes library; encounters containing monsters; saved encounters loaded as independent table snapshots; persistent play state and reversible history; complete readable ability text alongside partial automation; an engine independent of UI and storage; and Convex for application persistence. Homebrew monsters should eventually use supported stat-block language through the same parser/interpreter boundary.

Proposed first implementation: make the 409 standard Monsters-book foes searchable and readable, identify their baseline stats and complete embedded features, and prepare selections for later encounter loading. Inventory retainers, companions, summons, and other stat-block categories separately so deferred adapters never masquerade as absent content. Public reference availability need not wait for full automation.

This proposal does not add companion progression to the monster workstream, settle encounter-building mathematics, implement every monster mechanic, or choose a final UI layout.

## User-visible flow

1. Browse or search Foes. Proposed filters: name, level, organization, role, creature group/keywords, and sourcebook. Optional search by feature name can help locate mechanics.
2. Open a foe to see its stat block, traits, abilities, captain benefit, immunities/weaknesses, and relevant group rules/Malice. Preserve source distinctions between a standard monster and a similarly named companion or variant.
3. Add a count to an encounter selection. Record any preparation choices, such as variable size and intended minion squads, separately from the original definition. Missing required values remain visible.
4. Save the reusable encounter. It records the selected definition revisions and authored supporting data.
5. Loading into a table creates independent content snapshots and mutable play objects through shared application operations. Unsupported mechanics remain readable and manually resolvable. Loading is a recorded state transition.

Library usability, extraction quality, and automation availability are separate concerns. A troll with an unresolved weakness value remains a useful reference entry; affected automatic damage calculations need an explicit resolution of that uncertainty.

## Recommended storage boundary

The [common pack model](data-architecture-spec.md#31-common-pack-contract--proposed) extends this package design to official, community, and personal homebrew content. Campaigns select sources; the proposed policy validates encounter selections on loading, while existing loads keep their independent snapshots. An active public-library edition is not an automatic campaign content update.

Use a **portable, versioned content package** as the importer output. The application can mirror its search fields and definition documents into Convex; the engine receives supplied definitions and state. The engine never looks up a Convex document ID to discover a rule.

```mermaid
flowchart LR
  S[Pinned Compendium JSON and Markdown] --> I[Reviewed import]
  I --> P[Versioned content package]
  P --> C[Convex catalog and library queries]
  C --> E[Saved encounter selection]
  E --> T[Independent table snapshot and play state]
  T --> R[Standalone rules engine]
  R --> O[Shared application operations and history]
```

Recommended package contents: a small manifest with source revision, format version, and importer version; lightweight search rows; full definition documents; and supporting source documents. Search results need not carry every trait, source body, and parser diagnostic. Do not put the entire corpus in one database document or require every library visit to download it all.

The initial implementation can exercise the same portable definitions locally before the application catalog exists. Actual Convex validators, indexes, pagination, import batching, and deployment are later implementation work. No new backend setup is needed to decide the logical model here.

### Logical records

Names below describe responsibilities, not committed table names or wire-format types.

| Record | Contents and purpose |
| --- | --- |
| Content edition | Compendium revision plus derived package/importer version. Identifies exactly which interpretation of a source is in use. |
| Source document | Source-qualified SCC, source path, original JSON and full Markdown. Retains unprojected fields and text. Supporting group, Malice, and general rules can use the same record shape. |
| Monster definition | Identity, classification, structured baseline stat fields, revision-scoped embedded features, source references, unresolved data, and extraction diagnostics. Contains no damage or current encounter resources. |
| Library search row | Name, identity/revision, sourcebook, category, level where known, organization, role, group/keywords, and a search projection. References the full definition. |
| Saved encounter | User ownership, authored supporting data, selected definition revisions/counts, preparation choices, and proposed squad/captain assignments. Exact supporting fields and sharing permissions remain open. |
| Loaded encounter content | Independent copy of the selected definitions, overrides, and relevant supporting rules for this table load. Repeated creature instances may share one immutable definition copy within the loaded encounter. |
| Monster play instance | Instance identity, definition snapshot reference, resolved baseline, current values, conditions, pending effects, and relationships. Separate from the library definition. |
| Squad play state | Member identities, pooled current/maximum Stamina, relevant baseline contributions, captain relationship, and squad-specific state. Captain health remains separate. |
| Encounter play state | Shared Malice, round/turn state, and other encounter-scoped values. Do not copy a separate Malice pool into each monster. |

Use source-qualified SCC identity rather than names or filenames. Definition references additionally carry the source revision and derived edition identifier. A change in importer interpretation can change derived data even if the upstream revision stays the same. Old loaded encounters retain their copied interpretation.

Embedded features lack independent SCC IDs. Propose local child keys within a definition edition, using source position plus a readable name. Do not promise those keys survive source reordering. Homebrew receives a separate identity namespace and revision history; an edit never mutates a table's loaded copy.

Retain source and derived content together without confusing them. A correction belongs outside the vendored dependency, identifies the affected field and source, and records why the value changes. Avoid per-rule approval machinery or hash-based proof systems.

### Baseline stats and unresolved values

For every interpreted field, retain its original text and whether it is a known constant, a supported expression/choice, missing, or conflicting. Only include a usable numeric value when the interpretation establishes it. Do not coerce missing values to zero or serialize `NaN` as if it were an ordinary stat.

| Field family | Proposed representation |
| --- | --- |
| Fixed numbers | Level, speed, stability, free-strike damage, Stamina, five characteristics; preserve source text alongside normalized values. |
| Size | Exact category such as `1S`, numeric size where meaningful, and explicit alternatives/ranges where present. A selected size belongs to encounter preparation/instance data. |
| Encounter value | Original text, numeric EV when supplied, and the number of creatures that EV describes. `3 for four minions` is not EV 3 per creature. Final encounter arithmetic is separate. |
| Movement | Base speed plus named movement modes and any source qualifications. |
| Immunities/weaknesses | Ordered entries with type, amount/expression where resolved, and full original text. Shared-value inference is not a default. |
| Conditional stats | Captain benefits, contextual bonuses, and other modifiers stay separate from the unmodified baseline. |
| Additional fields | Preserve source fields not yet modeled, including summon costs, free-strike damage-type text, and owner-dependent stats; expose meaningful unresolved data. |

When JSON and visible Markdown disagree, retain both and flag the conflict. A conflicting numeric projection cannot be used as the baseline merely because it is machine-readable. Consult sourcebook context to resolve it; record any adopted correction separately.

Deriving a new baseline must not reset current damage, conditions, or shared resources. Reconciliation of an intentional baseline change during play belongs to a later explicit game operation. The catalog importer has no authority to change active encounters.

### Features and supporting rules

Every embedded feature needs its original name, kind, full source section, section locator, original structured record, and local identity. An ability additionally exposes usage, keywords, distance, targets, trigger, signature status, resource cost or usage limit, roll/test description, ordered outcomes, and additional effect/special text as available.

Treat `Villain Action 3` as an ordinal/classification, not a resource expenditure. Retain triggered versus free triggered usage. A three-tier table does not determine who rolls: actor rolls, target tests, and unresolved roll semantics must remain distinct.

Preserve effect order and text beyond tiers, including lists, restrictions, durations, special targets, costs that augment an ability, and consequences extending beyond combat. Do not build executable mechanics solely from the upstream `effects` array.

Supporting content has distinct relationships:

- **Linked rule:** an explicit source-qualified link; retain it and indicate whether its target is available in the package.
- **Granted/applicable feature:** basic, group, organization, or other mechanics whose applicability has been established from rule context.
- **Related reading:** nearby group material that helps a reader, without asserting that every feature applies.
- **Unresolved dependency:** a named mechanic or rule required for interpretation but not yet bound to its definition.

For example, Basic Malice and group Malice must be discoverable alongside the embedded stat block. Sharing the dragon directory does not grant a Thorn Dragon every other dragon's Malice options. Some named references are plain prose rather than SCC links, so a link crawl alone cannot establish dependency completeness. Companion features can be granted from advancement records outside the monster stat-block file.

## Proposed import procedure

1. Read the installed, reviewed Compendium pin. Enumerate every candidate and record its source/category; pair JSON with Markdown. Never advance the submodule during import or app startup.
2. Normalize identities and detect duplicates, missing counterparts, and alternate record formats. Distinguish missing features from a valid featureless record. Inventory out-of-scope formats explicitly.
3. Extract classification and stat projections. Compare relevant fields against visible tables; preserve numeric expressions, conflicts, unknown fields, and complete source documents.
4. Associate features with full source sections in order, allowing the observed display variants. Detect missing, ambiguous, duplicated, and unprojected sections. Retain source text even where extraction fails.
5. Build display envelopes and source/dependency references. Check envelope fields against full text; avoid silently choosing the first roll or dropping later effect sections.
6. Optionally feed eligible ability text through the shared rules-language parser. Store parser results as derived information with their version. Separate parser recognition from runtime support.
7. Produce a deterministic package and corpus report. Malformed identity or duplicate identity blocks publication of the affected edition; unresolved mechanics can coexist with readable library entries.
8. For an app mirror, stage the edition, verify expected counts and representative lookups, then switch the library's active edition only after it is complete. Repeating an import must not create duplicates. Retain editions needed by saved selections and history; loaded snapshots remain independent.

The eventual report should count source files, imported/readable entries, category deferrals, per-field conflicts, feature associations, full-text gaps, and automation outcomes separately. List affected source paths and reasons. Do not compress these into one “monster support percentage.”

## Encounter and engine integration

The character builder and monster importer can produce adapters into a common ability source contract; they need not share source loaders or progression logic. The existing `AbilitySource` is useful evidence of that boundary, but is a limited experiment: richer ordered outcomes and explicit roll ownership remain proposed extensions. Coordinate future contract changes with the character workstream rather than changing it from this spec task.

Proposed shared operations are: list/filter definitions, read a definition and its context, prepare a selection, snapshot a saved encounter, and instantiate a loaded encounter with required choices. CLI and UI should call the same operations. Catalog reads do not execute rules.

Minion loading must establish squad membership and pooled Stamina. Per-member Stamina is baseline/reference data, not an independent pool to damage in addition to the squad. Captain attachment supplies conditional benefits without adding captain health to the squad. Missing squad choices or unresolved dependent stats must be surfaced during preparation rather than guessed.

An ability can be identified and readable while still requiring manual resolution. Parser acceptance alone must never label an entire monster supported: traits, immunity, captain effects, external rules, timing, and runtime facts can change the outcome. Retain applied, manually resolved, and outstanding effects through the existing history model. Rewinding a load or action restores stored state without rerunning the importer, parser, engine, or dice roller.

## Acceptance examples for a later implementation

These are proposed checks, not completed tests. The source audit supplies the observed corpus baseline.

| Example | Required outcome |
| --- | --- |
| Goblin Warrior | Library identifies level 1 Horde Harrier, Stamina 15, speed 6, size `1S`, both Spear Charge and Bury the Point, and complete Crafty text. Search can find it without a campaign. |
| Goblin Spinecleaver | Preserve EV `3 for four minions`, individual Stamina 5, and captain benefit. A deliberately prepared four-member squad starts with one pool of 20; damaging it does not subtract a second independent health pool. |
| Thorn Dragon | Preserve Solo traits, all three villain-action ordinals, Virulent Breath as a target Might test, group/domain context, and complete special text. No inference that nearby dragon Malice all applies. |
| Troll Butcher | Display `Acid 5, fire`; the missing fire value remains unresolved and cannot silently alter automatic damage. |
| Iron Reaver | Report JSON stability `0` versus Markdown `R`; no trusted numeric zero is emitted for play. Preserve repeated Stamina notation and source text. |
| Shieldscale Drangolin | Preserve size `2 or 3`; require the relevant preparation choice before size-dependent automation. |
| Beastheart Drake | Retain a readable alternate-format entry; do not claim zero abilities or fixed Stamina. Identify the need for companion/advancement context. |
| Manticore, Rival Null, retainer headings | Match sections despite missing/extra quote whitespace and linked labels; preserve complete source sections without merging adjacent features. |
| Formatting variation and malformed input | Repeated names, unknown sections, extra effects, missing tier labels, and multiple rolls produce explicit diagnostics instead of silent truncation. Include a holdout variant that was not used to tune extraction. |
| Saved encounter loaded twice | Each load has distinct instance identities and independent play state; changing one load, the template, or the active catalog cannot change the other load. |
| Edition update/reimport | Existing selections resolve their retained edition; retrying the same import is idempotent; incomplete imports never become the active library edition. |
| Manual action and history | Unsupported source text remains visible; manual changes are recorded and reversible; restoring before/after state makes no parser or engine call. |

For the extraction milestone, test the importer and package round trip against the relevant rows. Squad combat, permissions, live state, and history cases become required when implementing encounter loading; a catalog-only milestone must not claim those behaviors are complete.

## Remaining decisions

- Confirm the proposed 409-foe first implementation scope and ordering of retainer, companion, and summon adapters when implementation resumes.
- Decide encounter supporting fields, sharing/edit permissions, and who can control or reveal monsters at a table. Public library access does not establish access to private encounter state.
- Define the preparation UX for variable stats, squad assignment, captain attachment, and unresolved rules.
- Select catalog delivery/index details alongside actual app integration. Convex is the intended backend; its concrete schema is not specified here.
- Define local correction and homebrew authoring UX, and how users deliberately adopt a later definition into a saved encounter.
- Establish distribution/attribution for the source material actually shipped under the existing [third-party notices](../THIRD_PARTY_NOTICES.md); the app's code license does not relicense game content.

These decisions do not block the written design. They remain proposals to address in the relevant later implementation task.
