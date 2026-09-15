# Foe catalog kickoff: can we ingest all stat blocks?

Assessment: 2026-09-15, application baseline `e83930e`, Steel Compendium pin
`fb83a789da8f0327a389c277a0c790b1648d5810`. Track: foe coverage; branch `slice/V23`;
worktree `/srv/presidium/projects/salient/foes`.

## Recommendation

**Yes: deterministic ingestion is practical for the complete core stat-block reference.** Most of
the parsing has already been done upstream: each core creature has structured JSON, original Markdown,
and expanded Markdown. We should adapt that data and reuse the Rules reader, keeping full text beside
the structured fields. An LLM or a new natural-language parser is unnecessary for this first goal.

In fact, all **438 core stat blocks already exist in the generated Rules library**. The missing ingestion
layer is a complete structured monster package shared by the app and parser. Dedicated browsing and
broader roster loading can consume that package. Only Goblin Warrior currently loads through the
app's shared foe operation.

Complete readable coverage can ship ahead of creature-specific automation. Importing an ability's
name, action type, targets and full text is substantially simpler than executing all its effects.

**User-confirmed track boundary, 2026-09-15:** this track owns correct ingestion from monster source
files into a format usable by the app and parser. Engine interpretation and execution belong to the
separate parser branch. Runtime observations below identify consumers, not added deliverables.

## Current implementation

| Layer | Current evidence | Ingestion relevance / downstream gap |
| --- | --- | --- |
| Public reading | `scripts/ingest-rules.ts` reads pinned Heroes/Monsters book blobs, renders expanded Markdown, rewrites links, and builds a search index. The generated catalog contains all 438 stat-block IDs. | Reuse its reader, source identities and reference cards. |
| Foe browsing | Rules supports a Creatures topic and book/text search. Its summary contract lacks creature-specific fields. | Add level, organization, role and group/keyword filters, a Foes entry point and useful list summaries. |
| Structured source package | `scripts/build-content.ts` retains Markdown, frontmatter and JSON features, but selects only Goblin Warrior as a stat block. | Expand through a core-only adapter, validating visible values and retaining exceptional text. |
| Live loading | `convex/foes.ts` returns one catalog entry; `convex/lib/foeOperations.ts` explicitly rejects other definition IDs. Snapshots, live Stamina, permissions and history already have a shared path. | Generalize selection and loading only for validated creature models; preserve current audience and lifecycle boundaries. |
| Live sheet | `web/table/foe-sheet.tsx` exposes current play values, abilities and a source card. | Present the selected creature's complete sourced stats and traits; source coverage and supported operations remain separate. |

This is code inspection and generated-asset verification, not a new browser or live-backend acceptance.
The [recorded prototype acceptance](../build/evidence/v001-acceptance.md) covers its stated scope.

## Fresh core-only inventory

The [machine-readable audit](foe-catalog-audit-2026-09-15.json) records every entry's identity, path,
organization and feature count, plus exceptions. This rechecks the earlier
[broader audit](monster-import-audit.md) against book-specific sources, excluding supplements.

| Category | Stat blocks |
| --- | ---: |
| Horde | 76 |
| Platoon | 68 |
| Elite | 97 |
| Minion | 116 |
| Leader | 30 |
| Solo | 22 |
| Retainer | 21 |
| Other Monsters-book blocks | 7 |
| Heroes-book summon: Source of Earth | 1 |
| **Total** | **438** |

The six standard enemy organizations account for **409** entries. The other seven Monsters-book
blocks are Noncombatant and six Xorannox eye blocks. Include those, retainers and Source of Earth in
readable references without asserting they are ordinary independently loadable enemies. Playable
retainers and friendly monsters remain outside V1 under the existing catalog specification.

Measured results:

- 438 unique IDs; no missing original/expanded Markdown counterparts.
- All 438 IDs present in the existing Rules catalog at the same source revision.
- **4,380 field comparisons agree**: size, speed, Stamina, stability, free strike, and five
  characteristics, across every entry. Repeated printed cells are checked for agreement as well.
- All 438 printed Stamina projections are integer strings.
- **1,800 embedded features**: 1,158 abilities and 642 traits. Every feature name associates with one
  distinct icon-prefixed Markdown heading; no leftover headings under that convention.
- Noncombatant has no embedded features, a valid source case.
- Original Markdown is about **1.33 MB**, and JSON about **1.41 MB**, uncompressed. This supports a small
  static catalog plus lazy article/definition loading; it does not measure browser performance.

These are extraction consistency results, not an accuracy percentage for gameplay. JSON and Markdown
are sibling representations, so agreement cannot detect an error shared by both. The scan does not
certify every ability envelope, full section boundary, cross-reference, or semantic interpretation.

### Scan method and limits

The one-off local Python scan used `git ls-tree` and `git cat-file --batch` at the superproject's
recorded vendor pin. It enumerated **all** JSON in `en/books/{heroes,monsters}/json`, selected
`type: statblock`, and paired corresponding `md` and `md-linked` paths. All selected files happened
to be under `monster/**/statblock/`; classification was not inferred from that directory alone.

For the ten fields, compare JSON against labeled `<br>` cells in the introductory table. Normalize
link labels, bold markup, whitespace, escaped bars and leading numeric plus signs. Preserve size
strings rather than coercing them to integers. Repeated cells must all agree. For feature headings,
match quoted icon-prefixed bold titles, normalize link labels/whitespace, allow the observed
parenthetical or inline-roll suffix, and consume each match once. A first exploratory pattern also
matched Power Roll subheadings; requiring an icon corrected that scan, without changing the source.
This is a corpus-adjusted association check, not independent holdout validation.

The audit also classifies organizations, integer Stamina, simple size/EV forms and weakness strings
without a trailing number, and compares IDs with the generated Rules catalog. Those last checks are
exception discovery, not general expression parsing. A production importer should make these checks
repeatable in its own tests and build report; this assessment does not deliver that importer.

## Exceptions the importer must preserve

| Evidence | Handling |
| --- | --- |
| Shieldscale Drangolin size `2 or 3`; Noncombatant `1S-2` | Preserve exact text and model a choice/range. Never silently use `parseInt`. A runtime choice is separate from the definition. |
| All 116 minions express EV per four creatures, spelling the quantity either `four` or `4` | Retain the EV quantity basis; do not treat the printed number as per-creature EV. Squad loading depends on V02. |
| 28 entries print EV `-`: 20 retainers and eight unclassified blocks | Keep absent EV distinct from zero. Do not include these in ordinary encounter-cost calculations by default. |
| Gnoll Gnasher is a Retainer but prints EV `60` in both JSON and its table | Preserve the stated value; do not assume all retainers have absent EV or silently correct an unusual number. |
| Seven trolls, including Troll Mercenary, list `fire` without an amount | Show the original weakness; leave the numeric amount unresolved. It does not block reading the creature. |
| Hobgoblin Flameslinger repeats its five-cell size/speed/Stamina/stability/free-strike row | Detect the duplicate; both copies agree. Preserve the source, avoid duplicating normalized fields. |
| `Villain Action 3` appears in an ability cost field; target tests can also have three tiers | Retain original structured records and prose. Do not interpret an ordinal as Malice cost or every tier table as the acting monster's roll. |
| Basic/group Malice, dragon domains and named dependencies live outside individual blocks | Provide related rule links and group reading. Directory proximity alone does not establish granted mechanics. |

The source paths for size, weakness and duplicate-row cases are in the audit. The existing
[language study](monster-parser-sample.md) supplies examples of villain actions, target tests and
external mechanics; this assessment does not resolve or implement those rules.

## Proposed data contract and implementation sequence

### 1. Generate the complete shared monster package

First bounded implementation: ingest all 438 core entries into a deterministic versioned package
that both app code and the parser can consume. Read book-specific JSON for classification, stats and
structured features; retain original Markdown and isolate full feature sections for parser input.
Expanded Markdown and the existing Rules renderer supply the reading view.

Proposed record shape, to coordinate with the parser branch before changing its adapter:

| Part | Data retained | Consumer |
| --- | --- | --- |
| Identity and provenance | Source-qualified SCC ID, book, pinned revision, source paths, upstream URL | Both; reuse the current Rules identities |
| Classification | Name, level, organization, role, keywords/group information, core source category | App filtering; parser context |
| Printed stats | Source values for size, speed, Stamina, stability, free strike, characteristics, movement, immunities, weaknesses, captain benefit and EV | Both; preserve strings and absent fields |
| Validated projections | Known constant values; EV amount with printed quantity basis; explicit choices/unresolved values instead of lossy coercion | App display and future consumers; no inferred mechanics |
| Full source | Byte-preserved original Markdown and original JSON record; expanded reading source or reference to its existing article | App full reading; parser fallback and source evidence |
| Ordered features | Local identity scoped to the definition/revision, name, source kind, ordinal, complete source section/locator, original structured feature | Parser gets entire abilities/traits, not only damage tiers |
| Ability envelope | Printed usage, keywords, distance, target, trigger, cost/label, roll text and ordered effects, where stated | App presentation and parser input; retain raw forms |
| Relationships and issues | Explicit source links, separately labeled related group reading, extraction conflicts, missing values | Both; a related document is not automatically a granted feature |

Use the existing content entry/manifest contracts where they fit. The exact TypeScript shape is an
implementation choice to coordinate with consumers, not a competing engine representation. Do not
compile effects, infer triggers, choose a target-test roller or promise runtime support in this adapter.
In particular, preserve `Villain Action 3` as source classification/text rather than blindly parsing
all costs as resource amounts. Keep a source field that the normalized model cannot yet represent.

The package should be usable as ordinary local JSON/TypeScript data by the parser, without a running
app or database. The app can publish a small browse index and lazily load full definitions/articles
from the same build output. Share pinned-source loading and rendering helpers with the Rules pipeline;
keep one source identity across reference cards, definitions and engine inputs. Backend mirroring,
if needed later, is a delivery adapter rather than a separate source of truth.

### 2. Validate ingestion and preserve exceptions

The first importer must verify:

1. All 438 expected IDs are accounted for; supplemental records are excluded by source book, not name.
2. Required source counterparts exist, identities are unique, and generation is deterministic.
3. Structured fields agree with printed tables, including duplicate identical cells; conflicts remain
   explicit instead of publishing a guessed numeric baseline.
4. Every feature is associated with its **complete section**, in source order. Include trigger, effect,
   special text, lists and post-tier paragraphs. Prove boundaries and text preservation, not just names.
5. Size alternatives, EV quantity wording, absent EV and the seven incomplete weakness values survive
   unchanged. Noncombatant's empty feature list is valid.
6. Full original source remains available even where envelope normalization is unsupported. Known
   schema fields are not an excuse to discard unknown source fields.
7. Existing Rules links and source locators remain usable; named dependencies without explicit links
   are not silently claimed to be resolved.
8. Representative app-facing and parser-facing reads use the same package, without engine execution
   being necessary to accept the import.

Malformed identity or lost source should fail generation. Unsupported rule semantics need not block
correct ingestion. Deliver a corpus report of records, fields, features and extraction exceptions;
**no whole-monster automation flag** is warranted by this work. Preserve content attribution and keep
source pin updates explicit.

### 3. Hand off the data to consumers

The parser branch owns interpreting feature text and producing executable effects. App consumers own
presentation and live-state integration appropriate to their assigned slices. Minion squads, boss
turns, encounter difficulty, saved encounters, permissions/history verification and generalizing
`foe.add` are downstream work, not acceptance criteria for this ingestion assignment.

Coordinate the definition ID, feature identity/locator, source-section format and unresolved-field
representation with the parser branch. If it needs an additional source field, add it at this shared
boundary instead of independently reparsing or copying monster data in each branch.

## Decision

Proceed next with the deterministic creature adapter and shared monster package. The source is
regular enough for reliable ingestion, with explicit handling of the measured exceptions and full
text as the parser input. This track does not need to make monsters work in the engine to finish
that job. No new product decision is needed for this data-first scope.
