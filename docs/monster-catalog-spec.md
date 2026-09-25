# Monster catalog, import, and storage specification

Status: **consolidated product checkpoint, 2026-09-11; proposed implementation and source research dated
2026-09-10.** The user requested monster import/storage research, then explicitly constrained this work to
research and spec writing. No catalog importer, database schema, deployment, or UI was delivered by that task.
The character-builder workstream remains separate.

**Checkout status, 2026-09-14 (updated by S01):** the app loads exactly one stat block, the Goblin Warrior
entry `mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior` of the generated content snapshot in
[shared/content/compendium](../shared/content/README.md), produced by
[scripts/build-content.ts](../scripts/build-content.ts) from the pinned Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810` (tag `v4.20260908021459`) and verified by `pnpm content:check`.
The snapshot is the first instance of the versioned content package recommended below: a manifest with the
source revision, generator version and entry list; per entry the verbatim source file, its printed frontmatter
values unrenamed, and for the stat block the JSON twin's `features` record. It records; it does not derive a
baseline. [convex/contentTables.ts](../convex/contentTables.ts) mirrors it into a `content` table that
[convex/content.ts](../convex/content.ts) exposes by id and kind, refreshed by the bounded internal `reseed` action through `pnpm content:seed`, preserving row ids and play data.
[convex/foes.ts](../convex/foes.ts) reads the Goblin Warrior through that table (the only app-level projection
is the printed `stamina: "15"` becoming the instance's maximum Stamina; a non-integer printed value is refused,
not defaulted) and [convex/foeTables.ts](../convex/foeTables.ts) provides Director-only add/remove/detail, a
`foes` table (immutable source snapshot, maximum Stamina, live Stamina) and a per-campaign
`foeSettings.addVisible` default. There is no catalog, search, importer beyond that fixed selection, saved
encounter or template, minion squad, or difficulty calculation. Per-foe show/hide and the Add-visibility default exist in code
even though the v0.01 scope below now defers hiding; the scope decision, not the code, is authoritative.
Resolved 2026-09-14 (Q-REC-1): the code is not removed. It stays dormant: the controls are not exposed in
the v0.01 UI or command registry, and every loaded foe is visible until foe hiding returns in V1.

**V1 roster, 2026-09-24:** the user confirmed which foes get combat behavior implemented and
tested for V1: the [V1 foe roster](decisions/2026-09-24-v1-foe-roster.md).

**Ingestion assessment, 2026-09-15:** all 438 core stat blocks are already readable in the generated
Rules library, while the shared structured snapshot and live add operation still select only Goblin
Warrior. The [foe-track kickoff](research/foe-catalog-kickoff.md) and
[core inventory](research/foe-catalog-audit-2026-09-15.json) record current source coverage, extraction
checks and exceptions. The user clarified that the foe track owns correct source ingestion into a
shared format for app and parser consumers; interpretation/execution belongs to the parser branch.
The proposed next deliverable is a deterministic all-core monster package preserving complete source
and structured features. This assessment does not implement that package or extend live foe support.

The [source audit](research/monster-import-audit.md) records the corpus counts, observed inconsistencies, and
limits of the exploratory checks. This document builds on [the product inventory](product-features.md),
[engine architecture](engine-architecture.md), and [storage research](research/content-storage-options.md).

The [data architecture checkpoint](data-architecture-spec.md) connects these definitions and independent
encounter loads to encounter undo, realtime sessions, and compressed history after session closure. It
distinguishes the saved encounter template from a run in one session. Session closure voids an active run with
a keep/reset state choice; an indefinite pause preserves it. Earlier cross-session encounter segments are no
longer proposed.

## Confirmed requirements and proposed first scope

**v0.01 foe visibility, confirmed 2026-09-14:** defer hiding and its hide/reveal/Add visibility
controls. All loaded foes are visible in audience rosters, with participating foes visible in
shared setup and initiative. Full stat blocks remain Director-only; health display and Malice
visibility keep their separate policies. Fuller V1 hidden-foe designs below are future scope.
See [the owning contract](table-spec.md#monster-visibility-and-health-display). This records scope,
not an implementation change.

**Confirmed v0.01 scope:** saved encounter templates are deferred beyond the pre-alpha. Its required loading
path is adding at least one catalog stat block directly to the live foes roster. Template authoring,
duplication and loading remain fuller-product requirements below, not prerequisites for this prototype.
Starting and running combat with the roster remains in the pre-alpha journey. The entire inventory/loot
system is also deferred; direct roster loading must not depend on templates, reward creation or standalone
rules search. See [the clarification queue](pre-alpha-design-gaps.md#confirmed-first-acceptance-journey).

Existing requirements: a public Foes library; encounters containing monsters; a Director foes roster retaining
live monsters for free play and encounters; saved encounters loaded as independent roster instances with
replace/append choices; persistent play state and reversible history; complete readable ability text alongside
partial automation; an engine independent of UI and storage; and Convex for application persistence.
**Confirmed v1 scope: no homebrew monsters.** Monster authoring, copying a monster for customization, and
sharing homebrew monsters are deferred; v1 uses core-rulebook monster content only; all official supplemental
content is excluded, if present. The general content/parser architecture may retain future homebrew support
without making it a v1 delivery requirement.

Confirmed v1 reference breadth includes eligible official retainers, companions, and summons alongside
standard monsters. Summoner and Beastheart are official supplemental content, not core, and their
classes/associated mechanics are excluded from v1. See the
[reference-library scope](reference-library-spec.md). The earlier proposed 409 standard Monsters-book foes may
remain an initial import stage, but that count alone no longer defines complete v1 reference coverage.
Audit the included core/source-qualified categories separately from the broad corpus and its supplemental
entries. Public reference availability need not wait for full automation.

Confirmed 2026-09-11 combat-scope clarification: playable retainers and friendly monsters are deferred
beyond V1. Initiative groups preserve their future integration path, but their player-control, attachment
and special-mechanics workflows are not V1 implementation gates. The readable reference breadth above is
separate from this gameplay deferral. See [initiative groups](table-spec.md#initiative-groups-confirmed-app-model).

V1 now includes encounter difficulty calculation for a selected party in the encounter builder. The planning
party supports hypothetical character stubs with adjustable individual levels and party-stub imports from
campaigns the user owns or actively directs. Imported stubs can be deleted individually and their levels
edited or reset to the source character's current actual level without changing the source campaign or
characters. Its mathematics and required party inputs still need rules verification; the feature requirement
does not settle the formulas. A current-EV comparison against the current party in the Director's foes roster
is also proposed. Its confirmed scope is all undefeated roster monsters, including hidden monsters and those
outside the active combat. Defeated monsters stop contributing immediately, even while retained on the roster
until normal cleanup. This proposal does not add companion progression, implement every monster mechanic, or
choose a final UI layout.

## User-visible flow

Confirmed 2026-09-17: the app exposes Rules and Foes as separate top-level destinations.
The primary navigation has a **Rules** link to `/rules` and a **Foes** link to `/foes`.
Each library keeps its own dataset, search and filters; cross-reference links connect related
content without combining the catalogs. Both reference destinations remain publicly readable.

1. Browse or search Foes. Proposed filters: name, level, organization, role, creature group/keywords, and
   sourcebook. Optional search by feature name can help locate mechanics.
2. Open a foe to see its stat block, traits, abilities, captain benefit, immunities/weaknesses, and relevant
   group rules/Malice. Preserve source distinctions between a standard monster and a similarly named companion
   or variant.
3. Add a count to an encounter selection. Record any preparation choices, such as variable size and intended
   minion squads, separately from the original definition. Missing required values remain visible.
4. Show calculated encounter difficulty for the selected party using verified rules, then save the reusable
   encounter. For v1, it retains the monster selection, including quantities, the party strength calculator's
   last setup (hypothetical/imported stubs and adjusted levels), a rewards stash, and prepared initiative
   groups, minion squads and captain assignments. Reopening, duplication and loading preserve this
   preparation. The proposed storage retains the selected definition revisions. No other authored supporting content is required; standalone
   saved stashes are excluded from v1. The encounter builder supports reusable preparation, including
   duplication of owned templates. Foes-roster additions/removals and saved-encounter loads are available at
   between sessions and during running combat. Pausing locks both live rosters until resume, including
   additions/removals, regrouping and saved-encounter loads.
5. From the top of the Director's foes roster, search/add individual stat blocks or load a saved encounter. A
   toggle beside Add determines whether newly added monsters start visible or hidden; individual roster
   visibility remains adjustable. Loading into a nonempty roster requires a replace/append dialog; an empty
   roster is populated directly. Each load creates independent content snapshots and mutable monster instances
   through shared application operations. Loading a saved encounter also adds its prepared rewards to the
   campaign's persistent Director's stash immediately; start/wrap-up do not add those rewards a second time.
6. Run roster monsters in free play or select them into an encounter using their current values. They remain
   in the persistent campaign roster until removed by the Director or by normal encounter cleanup of defeated
   foes. Defeated foes remain marked during combat; normal ending removes them while preserving their history.
   Survivors retain state after combat and across session closure. Voiding uses keep/reset without this normal
   cleanup. A later session uses the same retained instances after any required keep/reset choice. No
   additional roster-clutter mechanism is required. The Director can add/remove monsters during active combat,
   including participating foes. A new monster added mid-combat automatically joins in a new initiative
   group at the bottom, with a current-round turn available; the Director can change placement/group.
   Group changes move selected turn entries, preserving their spent state and shared creature identity, and follow the [regrouping contract](table-spec.md#mid-combat-additions-and-regrouping).
   No encounter roster lock blocks these operations or saved-encounter
   replace/append loading. Unsupported mechanics remain readable and manually resolvable. Loading and gameplay
   changes are recorded state transitions.

Confirmed minion-add UI, 2026-09-13: adding a minion stat block creates one squad entry, defaulting
to four members. Plus/minus controls select any whole count from 1 to 8, not only four or eight. The
optional captain does not count toward that maximum. Add another entry for another independent squad;
do not merge it into an existing same-name squad. Saved preparation preserves each entry’s count and
relationships. No manual split/merge or damaged-squad refill is implied by the add control. Each minion
still retains an identity and target reticle inside the shared squad turn.

Confirmed table loading scope, 2026-09-20: every core stat block in the seeded library is addable
from the table, including those with no printed organization: Xorannox the Tyract's six eyestalk
stat blocks (Compulsion Eye, Demolition, Mover Eye, Necrotic Eye, Toxic Eye, Zapper Eye), the
Noncombatant block, the Elementalist's Source of Earth summon and the retainer stat blocks. Nothing
is filtered out of the picker; missing source facts stay visible as blank. Stat blocks that the source
prints under a named parent monster (the same `monster/<family>/statblock/` directory as a stat block
named for that family, with no organization of their own) carry the parent's printed name in the add
control and in the loaded instance name, for example "Xorannox the Tyract: Compulsion Eye", so they
are searchable by the boss's name. This is a display and naming rule over source facts; the printed
stat block text is unchanged.

Confirmed minion EV calculation, 2026-09-13: derive EV proportionally from the given source numbers:
`selected minion count × printed EV ÷ printed creature quantity`. Preserve the original EV and quantity;
for EV 3 per four minions, six minions contribute EV 4.5. Do not round the count up to a purchase pack
or round away fractional EV. Sum the derived values across entries; splitting the same total count
between prepared squads does not change its combined EV. A captain contributes its own creature EV
separately. This is the selected calculator policy for the 1–8 count control; the printed four-minion
purchase wording remains preserved as source text.

Confirmed saved preparation, 2026-09-13: predesigning an encounter includes arranging monster
initiative groups, establishing minion squads and assigning their captains. Persist those choices in
the saved encounter; reopening, duplicating and loading preserve the prepared arrangement. Loading
creates independent live monsters, groups and squad/captain relationships within that load, rather
than requiring the Director to repeat completed setup. New ordinary monsters default to individual
initiative groups unless deliberately regrouped. Initiative groups and minion squads remain separate
mechanisms. Existing live-roster editing and mid-combat group/turn rules still apply; loading prepared
groups does not grant extra turns. The squad count control is selected above; other preparation
details and source-specific minion exceptions remain open. This confirms reusable monster preparation, not arbitrary additional authored encounter content.

The Director can directly adjust live gameplay stats in loaded monster stat blocks as recorded table
adjudication, alongside eligible game-log result corrections. Reusable source definitions remain
independent. The standalone damage/collision/fall tool is deliberately omitted; see
[fine-tuning](table-spec.md#director-fine-tuning-and-deliberate-damage-tool-omission).

At the table, only the Director can inspect complete loaded monster stat blocks. Every used ability's full
verbatim source text is available to the table through its game-log entry, including unsupported abilities;
see [rules adaptation principles](rules-adaptation-principles.md). Each monster has a Director show/hide
toggle. Hidden controls only the player-facing roster entry; it does not make a monster inactive or stop the
Director from using it against players under normal gameplay rules. Visible monsters use the campaign-selected
Numerical, Bar, or Winded health presentation under the
[table visibility contract](table-spec.md#monster-visibility-and-health-display). This does not restrict the
public Foes glossary; the user treats avoiding lookups during play as table etiquette.

Library usability, extraction quality, and automation availability are separate concerns. A troll with an
unresolved weakness value remains a useful reference entry; affected automatic damage calculations need an
explicit resolution of that uncertainty.

## Recommended storage boundary

The [common pack model](data-architecture-spec.md#31-common-pack-contract--proposed) extends this package
design to official, community, and personal homebrew content. Campaigns select sources; the proposed policy
validates encounter selections on loading, while existing loads keep their independent snapshots. An active
public-library edition is not an automatic campaign content update.

Use a **portable, versioned content package** as the importer output. The application can mirror its search
fields and definition documents into Convex; the engine receives supplied definitions and state. The engine
never looks up a Convex document ID to discover a rule.

```mermaid
flowchart LR
  S[Pinned Compendium JSON and Markdown] --> I[Reviewed import]
  I --> P[Versioned content package]
  P --> C[Convex catalog and library queries]
  C --> E[Saved encounter selection]
  E --> T[Foes roster: independent definitions and live instances]
  C -->|Add stat block| T
  T --> F[Free-play operations]
  T -->|Select existing instances| B[Encounter operations]
  F --> R[Standalone rules engine]
  B --> R
  R --> O[Shared application operations and history]
```

Recommended package contents: a small manifest with source revision, format version, and importer version;
lightweight search rows; full definition documents; and supporting source documents. Search results need not
carry every trait, source body, and parser diagnostic. Do not put the entire corpus in one database document
or require every library visit to download it all.

The initial implementation can exercise the same portable definitions locally before the application catalog
exists. Actual Convex validators, indexes, pagination, import batching, and deployment are later
implementation work. No new backend setup is needed to decide the logical model here.

### Logical records

Names below describe responsibilities, not committed table names or wire-format types.

| Record | Contents and purpose |
| --- | --- |
| Content edition | Compendium revision plus derived package/importer version. Identifies exactly which interpretation of a source is in use. |
| Source document | Source-qualified SCC, source path, original JSON and full Markdown. Retains unprojected fields and text. Supporting group, Malice, and general rules can use the same record shape. |
| Monster definition | Identity, classification, structured baseline stat fields, revision-scoped embedded features, source references, unresolved data, and extraction diagnostics. Contains no damage or current encounter resources. |
| Library search row | Name, identity/revision, sourcebook, category, level where known, organization, role, group/keywords, and a search projection. References the full definition. |
| Saved encounter | User ownership, selected monster definitions/counts, prepared initiative groups, minion squad membership and captain assignments, the last party strength calculator setup, including hypothetical/imported stubs and planning levels, and encounter rewards-stash preparation; version-qualified references are proposed. No other authored supporting content is required for v1; see the [rewards-stash contract](inventory-spec.md#v1-encounter-rewards-stashes). Prepared grouping and squad/captain relationships are confirmed saved content; loading restores them onto independent live instances. The default-four, 1–8 count control and shared squad/captain turn are selected; other preparation details and specific source exceptions remain open. Saved encounters are private to their creator in v1; sharing is deferred. Independent loaded roster instances follow table permissions. |
| Loaded roster content | Independent copy of selected definitions, overrides, and relevant supporting rules when added to the foes roster. Repeated creature instances may share one immutable definition copy within a load. |
| Monster play instance | Foes-roster membership, instance identity, definition snapshot reference, resolved baseline, current values, conditions, relationships, and show/hide state. Lives outside encounter membership and persists until removed from the roster. |
| Squad play state | Member identities, pooled current/maximum Stamina, relevant baseline contributions, captain relationship, and squad-specific state. Captain health remains separate. |
| Encounter play state | Shared Malice, round/turn state, and other encounter-scoped values. Do not copy a separate Malice pool into each monster. |

Use source-qualified SCC identity rather than names or filenames. Definition references additionally carry the
source revision and derived edition identifier. A change in importer interpretation can change derived data
even if the upstream revision stays the same. Old loaded encounters retain their copied interpretation.

Embedded features lack independent SCC IDs. Give abilities and traits addressable child identities under
their containing definition, with content edition separate from logical identity. The confirmed ingestion
requirements below supersede the earlier proposal to use source position plus a name as the reference key:
source order is presentation information, and reordering must not silently retarget a reference. The exact
key-generation and revision-mapping implementation remains proposed. Homebrew remains outside V1; future
homebrew has a separate namespace and revision history, and edits never mutate a table's loaded copy.

Retain source and derived content together without confusing them. A correction belongs outside the vendored
dependency, identifies the affected field and source, and records why the value changes. Avoid per-rule
approval machinery or hash-based proof systems.

### Confirmed ingestion requirements — 2026-09-15

The user clarified the foe track's data requirements after the initial assessment:

- **Regenerable corrections.** Fixing extraction or changing the data representation must not require
  hand-editing every generated stat block. Keep source records immutable and generated output reproducible.
  Shared importer changes regenerate all affected records. Individual source corrections belong in a
  separate, targeted correction layer, retaining original values and the reason for the correction.
- **Addressable contents.** Full stat blocks, individual abilities and individual traits are programmatically
  addressable records. Preserve each feature's parent, kind, source order, complete text, structured fields
  and provenance. Same-named features on different monsters must remain distinguishable; repeated names
  within one monster must not collide. Indexes and parent feature lists refer to these identities.
- **Search and filtering.** Support querying features as well as creatures by their own fields and text,
  with parent context where useful. Feature search returns the particular ability/trait and its containing
  creature, rather than only a whole article that happens to mention the search term. Do not infer
  unsupported semantics just to populate a filter.
- **Themeable display.** Stat blocks and individual features expose data suitable for independent views.
  Keep structure and source wording separate from layout, colors, fonts, icons and other theme choices.
  A style change must not require editing content records. Rendered HTML may be a generated cache, but
  cannot be the only usable representation of an ability, trait or stat block.
- **Shared object references.** Stat blocks and abilities must fit the app's
  [unified sharing model](data-architecture-spec.md#35-unified-object-references-and-sharing).
  Preserve the same capability for individual traits; the user identified trait sharing as a possible
  use, while explicitly requiring abilities and stat blocks. Resolving a feature should provide enough
  content for its own preview/card without scraping or rendering the entire parent article.
- **Reference continuity.** Rebuilding identical content, fixing extraction, changing themes or changing
  display order must not silently change which logical object an ID identifies. Keep edition-qualified
  references for exact historical content. Source changes that cannot be matched unambiguously must be
  reported or explicitly mapped, never guessed from array position or a newly matching display name.

These requirements concern ingestion and consumer-ready data. They do not implement sharing UI, settle
private-object disclosure/live-versus-snapshot policy, or move engine execution into this track.

**Proposed implementation:** one canonical collection of feature records with ordered references from
each monster, plus generated creature and feature search projections. Embedded serialized records are
also acceptable if the same IDs resolve independently through a shared lookup. Use a generic source
adapter and small versioned correction records keyed by definition/feature and field. Each correction
records its applicable source revision, expected original value, replacement and rationale; stale or
ambiguous targets fail validation. This is maintainer data repair, not V1 homebrew authoring. Importer,
schema and correction changes produce a new content edition; existing loaded snapshots remain intact.

Proposed acceptance additions for the implementation:

1. Fix one importer convention and regenerate every affected creature/feature without hand-editing outputs.
2. Apply a targeted correction, preserve original evidence, and reject it if its expected source no longer
   matches. Repeated generation produces the same result.
3. Resolve a stat block, one ability and one trait directly by reference; feature results include full text,
   their parent context and provenance without returning private live-instance state.
4. Search/filter individual features, including identically named features on different creatures and
   repeated headings within a definition, without ID collisions or loss of source order.
5. Reorder display features or change an extraction projection while keeping logical references bound to
   the same features. Verify exact edition references still identify their original content.
6. Render the same definition/feature fixture with different theme tokens without changing its data or IDs.

### V27 implementation — 2026-09-16

The first structured package now covers the 11 first-echelon undead, their 23 abilities and 13 traits,
plus four shared Malice features. The [consumer contract](../shared/foes/README.md) documents exact
files, commands, correction preconditions and `{kind, id, edition}` references. Parents retain source
SCC identities; child UUIDs are maintained in an explicit registry separately from source selectors,
mutable names, order and edition. Unmatched/ambiguous selectors fail rather than allocate replacement IDs.

The package retains full original JSON/Markdown/linked Markdown, complete ordered feature spans and
sections, source/display projections and independent search results. `ev` preserves the per-four minion
basis; `activation` keeps villain ordinals separate from cost text. Unknown prose/fields remain readable
and require comparison review. Corrections are revision/expected-value guarded and preserve originals.
Generated immutable editions stay available to consumers; current-package resolution refuses old editions.

The read-only `/foes` route and reusable `FoeView` provide whole-block and independent feature cards with
existing themes, related Rules navigation inside the card and focus-restoring dismissal. Live loading,
parser execution, squads and persistent sharing UI remain outside this slice. Existing Goblin support
and private encounter state are unchanged. Verification/reviews are recorded in [V27](build/V27-undead-ingestion.md).

### V30 implementation — 2026-09-16

The structured package adds all nine second-echelon undead: 20 stat blocks in total, 44 abilities,
24 traits and six features in two shared Malice records. A maintained batch list selects source paths,
external counterpart identities and supporting Malice references. Level-four monsters link to level-four
Malice, whose prior-features reference links to level-one Malice. Existing V27 objects and its exact
immutable edition remain unchanged; the expanded package receives a new edition.

All 22 parent records have explicit comparison outcomes in the [V30 report](build/evidence/V30-steel-cauldron.json).
Second-echelon minion counterparts omit the printed four-minion EV quantity; source values are retained
and the guarded discrepancy is explained. Comparison still rejects explicit conflicting quantities,
changed amounts and missing/ambiguous counterparts. No new source corrections or engine behaviors
were introduced. See the [slice verification](build/V30-second-echelon-undead.md).

### Full core ingestion implementation — 2026-09-17

V35 extends the source package to all 438 core stat blocks and all 63 core Malice parents, with
2,006 independently addressable features. It adds a compact browser projection, explicit group and
sourcebook facets, source-checked contextual Rules links, and exact original source retention.
The library browse/sort UI, live roster loading, and ability execution were separate work at this
checkpoint. See [V35](build/V35-full-core-ingestion.md) for actual verification/branch
status and [the consumer contract](../shared/foes/README.md) for the generated interface.

Two guarded source repairs address malformed Gnoll extraction and omitted/mislabeled Hag material.
Every parent has a comparison outcome; unavailable external counterparts are explicit, not successes
or omitted denominators. Corrections do not advance the pinned source or overwrite old editions.

### Full-output comparison — confirmed 2026-09-16

The user requires comparing **every generated stat block** with its Steel Cauldron counterpart as a
completeness sanity check. Substantial divergence triggers manual investigation of why the outputs differ.
This replaces sampling as the intended comparison coverage; the earlier eleven-undead comparison is
research evidence, not completion of this requirement.

Steel Cauldron remains a secondary comparison, under the user's example-only reuse boundary. The pinned
Compendium is the rules authority. Do not adapt external application code without a clear applicable
license, import external generated data as our canonical content, or automatically alter our output to
agree with it. Agreement does not establish correctness, particularly where both tools share upstream data.

**Proposed comparison implementation:**

- Produce one report row for every generated definition, including our content edition/source revision,
  the inspected external repository revision, both identifiers and the match outcome. Use a recorded
  external revision/cache for reproducible comparison, not a changing website response on every build.
- Match counterparts using verified identity mappings and source/classification context. Names alone
  cannot distinguish all variants. Report missing or ambiguous counterparts explicitly; they are not
  matches and must not silently disappear from the denominator. Counterpart availability does not define
  our eligible core corpus.
- Compare stats, classification, movement, defenses, captain benefits, EV and its quantity basis,
  ordered abilities/traits, and complete ability sections: usage, targets, range, triggers, costs/labels,
  rolls, tier text and additional effects. Compare related Malice records separately where included.
  Full raw text and field differences remain available alongside the normalized comparison.
- Normalize understood presentation differences such as markup and equivalent number/string forms.
  Do not normalize away quantities, qualifiers, ordering, missing paragraphs or unresolved values.
  Format equivalence is separate from factual agreement; the earlier unordered effect-content scan is
  insufficient as the final comparator.
- Flag substantial differences for review: changed numeric values, missing/additional features or
  sections, changed targeting/cost/trigger text, consequential ordering, or lost source context. Report
  representation-only differences separately so recurring formatting differences do not obscure losses.
  Failure to retrieve/compare data is an explicit incomplete check, not a successful match.
- Review discrepancies against the pinned source and classify the cause: our extraction/rendering error,
  an external omission/error, differing source versions, an intentional representation difference, or
  unresolved evidence. Record the disposition and supporting source. Manual review may be agent-assisted;
  ask the user only when an actual source ambiguity or product decision remains.

Comparison findings feed importer fixes and explicit corrections, followed by regeneration and rechecking.
They do not create a per-monster approval queue. No stat block is described as comparison-verified while
its material discrepancies remain unexplained; report unmatched and unresolved cases separately from
verified matches. This status is about content comparison, not whether the creature works in the engine.

Acceptance for the ingestion implementation includes exhaustive report accounting; a known matching case;
a missing and an ambiguous counterpart; a presentation-only change; and deliberately removed effect text
or changed numeric values that trigger review. Review resolutions must retain enough evidence to explain
why a difference was accepted or fixed. The comparison machinery is not implemented by this spec update.

### Encounter value accounting

For EV totals, count a creature once even when it has several turn entries, and count a captain
separately from its squad. Saved templates use prepared minion counts; the current undefeated-roster
total uses surviving identities. Neither pool damage nor captain Stamina adjustments alone change that
count. Live casualties do not rewrite the template or historical encounter difficulty.

### Baseline stats and unresolved values

For every interpreted field, retain its original text and whether it is a known constant, a supported
expression/choice, missing, or conflicting. Only include a usable numeric value when the interpretation
establishes it. Do not coerce missing values to zero or serialize `NaN` as if it were an ordinary stat.

| Field family | Proposed representation |
| --- | --- |
| Fixed numbers | Level, speed, stability, free-strike damage, Stamina, five characteristics; preserve source text alongside normalized values. |
| Size | Exact category such as `1S`, numeric size where meaningful, and explicit alternatives/ranges where present. A selected size belongs to encounter preparation/instance data. |
| Encounter value | Original text, numeric EV when supplied, and the number of creatures that EV describes. `3 for four minions` is not EV 3 per creature. Confirmed minion arithmetic: selected count × printed EV ÷ printed creature quantity, retaining fractional EV. Other difficulty arithmetic and party inputs retain their own research requirements. |
| Movement | Base speed plus named movement modes and any source qualifications. |
| Immunities/weaknesses | Ordered entries with type, amount/expression where resolved, and full original text. Shared-value inference is not a default. |
| Conditional stats | Captain benefits, contextual bonuses, and other modifiers stay separate from the unmodified baseline. |
| Additional fields | Preserve source fields not yet modeled, including summon costs, free-strike damage-type text, and owner-dependent stats; expose meaningful unresolved data. |

When JSON and visible Markdown disagree, retain both and flag the conflict. A conflicting numeric projection
cannot be used as the baseline merely because it is machine-readable. Consult sourcebook context to resolve
it; record any adopted correction separately.

Deriving a new baseline must not reset current damage, conditions, or shared resources. Reconciliation of an
intentional baseline change during play belongs to a later explicit game operation. The catalog importer has
no authority to change active encounters.

### Features and supporting rules

Every embedded feature needs its original name, kind, full source section, section locator, original
structured record, and local identity. An ability additionally exposes usage, keywords, distance, targets,
trigger, signature status, resource cost or usage limit, roll/test description, ordered outcomes, and
additional effect/special text as available.

Treat `Villain Action 3` as an ordinal/classification, not a resource expenditure. Retain triggered versus
free triggered usage. A three-tier table does not determine who rolls: actor rolls, target tests, and
unresolved roll semantics must remain distinct.

Preserve effect order and text beyond tiers, including lists, restrictions, durations, special targets, costs
that augment an ability, and consequences extending beyond combat. Do not build executable mechanics solely
from the upstream `effects` array.

Supporting content has distinct relationships:

- **Linked rule:** an explicit source-qualified link; retain it and indicate whether its target is available
  in the package.
- **Granted/applicable feature:** basic, group, organization, or other mechanics whose applicability has been
  established from rule context.
- **Related reading:** nearby group material that helps a reader, without asserting that every feature
  applies.
- **Unresolved dependency:** a named mechanic or rule required for interpretation but not yet bound to its
  definition.

For example, Basic Malice and group Malice must be discoverable alongside the embedded stat block. Sharing the
dragon directory does not grant a Thorn Dragon every other dragon's Malice options. Some named references are
plain prose rather than SCC links, so a link crawl alone cannot establish dependency completeness. Companion
features can be granted from advancement records outside the monster stat-block file.

## Proposed import procedure

1. Read the installed, reviewed Compendium pin. Enumerate every candidate and record its source/category; pair
   JSON with Markdown. Never advance the submodule during import or app startup.
2. Normalize identities and detect duplicates, missing counterparts, and alternate record formats. Distinguish
   missing features from a valid featureless record. Inventory out-of-scope formats explicitly.
3. Extract classification and stat projections. Compare relevant fields against visible tables; preserve
   numeric expressions, conflicts, unknown fields, and complete source documents.
4. Associate features with full source sections in order, allowing the observed display variants. Detect
   missing, ambiguous, duplicated, and unprojected sections. Retain source text even where extraction fails.
5. Build display envelopes and source/dependency references. Check envelope fields against full text; avoid
   silently choosing the first roll or dropping later effect sections.
6. Optionally feed eligible ability text through the shared rules-language parser. Store parser results as
   derived information with their version. Separate parser recognition from runtime support.
7. Produce a deterministic package and corpus report. Malformed identity or duplicate identity blocks
   publication of the affected edition; unresolved mechanics can coexist with readable library entries.
8. For an app mirror, stage the edition, verify expected counts and representative lookups, then switch the
   library's active edition only after it is complete. Repeating an import must not create duplicates. Retain
   editions needed by saved selections and history; loaded snapshots remain independent.

The eventual report should count source files, imported/readable entries, category deferrals, per-field
conflicts, feature associations, full-text gaps, and automation outcomes separately. List affected source
paths and reasons. Do not compress these into one “monster support percentage.”

## Encounter and engine integration

The character builder and monster importer can produce adapters into a common ability source contract; they
need not share source loaders or progression logic. The existing `AbilitySource` is useful evidence of that
boundary, but is a limited experiment: richer ordered outcomes and explicit roll ownership remain proposed
extensions. Coordinate future contract changes with the character workstream rather than changing it from this
spec task.

Proposed shared operations are: list/filter definitions, read a definition and its context, prepare a
selection, add catalog monsters to the foes roster, load a saved encounter with replace/append and required
preparation choices, and select existing roster instances for combat. CLI and UI should call the same
operations. Catalog reads do not execute rules.

Confirmed Void restoration: Restore starting state recovers the combat-start foes roster and recorded
state/relationships, removing post-start additions and restoring removed original instances. Keep current
state preserves the current roster. Use recorded identities and snapshots, not a new catalog/template
load. Live changes and their reversal remain in history; saved preparation is not mutated. See
[Void](table-spec.md#voiding-an-encounter).

Minion loading must establish squad membership and pooled Stamina. Per-member Stamina is baseline/reference
data, not an independent pool to damage in addition to the squad. Captain attachment supplies conditional
benefits without adding captain health to the squad. Missing squad choices or unresolved dependent stats must
be surfaced during preparation rather than guessed.

Confirmed minion casualty input: when overflow kills require missing spatial assignments, the original
action's inline game-log card prompts the acting user to identify the additional minions. The Director
can also respond. Derive the count from damage/squad state and collect only missing identities under
the source casualty rules. Link the response and resulting casualties to the original action without
applying its damage a second time. This uses the existing area/spatial-input pattern; see
[the table contract](table-spec.md#inline-interaction-cards-in-the-game-log).

An ability can be identified and readable while still requiring manual resolution. Parser acceptance alone
must never label an entire monster supported: traits, immunity, captain effects, external rules, timing, and
runtime facts can change the outcome. Retain applied, manually resolved, and outstanding effects through the
existing history model. Rewinding a load or action restores stored state without rerunning the importer,
parser, engine, or dice roller.

## Acceptance examples for a later implementation

These are proposed checks, not completed tests. The source audit supplies the observed corpus baseline.

| Example | Required outcome |
| --- | --- |
| Goblin Warrior | Library identifies level 1 Horde Harrier, Stamina 15, speed 6, size `1S`, both Spear Charge and Bury the Point, and complete Crafty text. Search can find it without a campaign. |
| Goblin Spinecleaver | Preserve EV `3 for four minions`, individual Stamina 5, and captain benefit. A deliberately prepared four-member squad starts with one pool of 20; damaging it does not subtract a second independent health pool. |
| Minion overflow input | Given known damage and squad state but unknown nearest additional casualties, the source action card asks for the missing minion assignments. The response records casualty identities and completes dependent effects without another attack roll or a second squad damage deduction. |
| Thorn Dragon | Preserve Solo traits, all three villain-action ordinals, Virulent Breath as a target Might test, group/domain context, and complete special text. No inference that nearby dragon Malice all applies. |
| Troll Butcher | Display `Acid 5, fire`; the missing fire value remains unresolved and cannot silently alter automatic damage. |
| Iron Reaver — supplemental research, outside v1 | Report JSON stability `0` versus Markdown `R`; no trusted numeric zero is emitted for play. Preserve repeated Stamina notation and source text. |
| Shieldscale Drangolin | Preserve size `2 or 3`; require the relevant preparation choice before size-dependent automation. |
| Beastheart Drake — supplemental research, outside v1 | Retain a readable alternate-format entry; do not claim zero abilities or fixed Stamina. Identify the need for companion/advancement context. |
| Manticore, Rival Null, retainer headings | Match sections despite missing/extra quote whitespace and linked labels; preserve complete source sections without merging adjacent features. |
| Formatting variation and malformed input | Repeated names, unknown sections, extra effects, missing tier labels, and multiple rolls produce explicit diagnostics instead of silent truncation. Include a holdout variant that was not used to tune extraction. |
| Saved encounter loaded twice | Each load has distinct instance identities and independent play state; changing one load, the template, or the active catalog cannot change the other load. |
| Edition update/reimport | Existing selections resolve their retained edition; retrying the same import is idempotent; incomplete imports never become the active library edition. |
| Manual action and history | Unsupported source text remains visible; manual changes are recorded and reversible; restoring before/after state makes no parser or engine call. |

For the extraction work, test the importer and package round trip against the relevant rows. Squad
combat, permissions, live state, and history cases become required when implementing encounter loading; a
catalog-only work must not claim those behaviors are complete.

## Remaining decisions

- Audit the in-scope official retainer, companion, and summon reference coverage in addition to standard
  monsters. Exclude all official supplemental content, including Summoner/Beastheart dependencies, from v1;
  the 409-standard-monster import is not complete v1 coverage. Decide adapter sequencing independently of
  readable reference delivery.
- Saved-encounter sharing is deferred beyond v1; v1 templates are private to their creator. Any
  monster-control delegation beyond the confirmed Director authority needs later design. Public library access
  does not establish access to private encounter state.
- Add visibility defaults to hidden, persists per campaign, and applies to saved-encounter loads. Define
  history/void-reset handling for mid-encounter additions/removals under the
  [foes-roster contract](table-spec.md#foes-roster).
- Verify encounter difficulty formulas, required party inputs, organization/count handling, and meaningful
  numerical examples. The roster comparison includes all undefeated roster monsters irrespective of visibility
  or active-combat membership, excluding defeated entries immediately. Clarify its party inputs, and reuse the
  verified calculation through shared operations.
- Define the preparation UX for variable stats, squad assignment, captain attachment, and unresolved rules.
- Select catalog delivery/index details alongside actual app integration. Convex is the intended backend; its
  concrete schema is not specified here.
- Define local corrections and how users deliberately adopt a later official definition into a saved
  encounter. Homebrew monster authoring/copying/sharing is outside v1 and does not block its implementation.
- Establish distribution/attribution for the source material actually shipped under the existing
  [third-party notices](../THIRD_PARTY_NOTICES.md); the app's code license does not relicense game content.

These decisions do not block the written design. They remain proposals to address in the relevant later
implementation task.

## Foes library browsing — V36

The public `/foes` library follows the Rules index layout, with a monster-band sidebar, a responsive
list and shared Core reference cards. A band is the source monster family/group, independently of
organization and level. Stat blocks are the default; abilities, traits, Malice and all-reference views
remain available. Filters combine band, level, role, organization, sourcebook, keyword and ability usage. Search
includes names, source text and a creature's feature names/text, with exact-title priority, partial
matching and typo tolerance. Sorting supports name, band, level in both directions and printed EV
amount; EV quantities remain visibly attached and no encounter arithmetic is implied.

Filter/search/sort state lives in the URL and survives reload and reference-card dismissal. Results
are revealed in batches of 40. Cards retain complete source, feature/parent navigation, related Malice,
nested rules navigation, keyboard dismissal and focus restoration. Reading remains public and separate
from live roster loading. The catalog determines available bands/levels/roles and actual coverage;
this UI does not add content or confer automation support. Verification is tracked in
[the V36 slice](build/V36-foes-library.md).
