# Public undead content

This package contains source definitions, not live creatures or executable mechanics. It is usable
without Convex. The current selection is 20 first/second-echelon undead, 68 embedded abilities/traits and
six shared Malice features, from the pinned Monsters book.

## Generate and verify

- `pnpm foes:build` regenerates `shared/content/foes/catalog.json` and writes its immutable edition
  to `shared/content/foes/editions/<edition>.json`.
- `pnpm foes:check` regenerates in memory and compares both files byte-for-byte. It is part of
  `pnpm check`; it also requires the committed comparison report to cover the exact current edition with
  no incomplete/unresolved outcomes. It needs only the clean pinned Compendium, not generated Rules assets or network access.
- `pnpm foes:compare --fetch` retrieves the explicitly pinned Steel Cauldron generated JSON into
  `.playtest/steel-cauldron/<revision>/`. `pnpm foes:compare` reuses the recorded cache and verifies its
  revision/digests. Both write `docs/build/evidence/V30-steel-cauldron.json` and exit unsuccessfully
  for missing, ambiguous, erroneous or unresolved outcomes. Use `SALIENT_FOE_COMPARISON_CACHE` and
  `SALIENT_FOE_COMPARISON_REPORT` for other local paths. External content is comparison evidence only;
  it is never imported into application data. Ordinary tests use synthetic counterparts, offline.
- `/foes` is a public read-only preview. The Rules header links to it. For isolated browser checks,
  `pnpm exec playwright test --config playwright.foes.config.ts` starts only Vite on port 5187.
  Generate Rules assets with `pnpm rules:ingest` first. No backend sync or credentials are needed.

## Consumer contract

`shared/contracts/foes.ts` owns the portable JSON schema. `catalog.json` is the manifest and payload:
source revision, schema/generator, edition, complete objects, search projection and correction ledger.
Each parent has ordered `featureIds` and `supportingIds`; children resolve independently and retain
`parentId`, source position and original record. `sections` contains ordered Markdown blocks (including
unmodeled blocks). `fields` retains upstream keys and nested ordered effects; it is not an executable
rules AST. `activation` separates Villain Action labels from resource cost text. `ev` retains printed
amount and quantity. Absent values remain absent/null; source unknowns remain readable diagnostics.

`original` is immutable source evidence. Parent records include exact JSON, Markdown and linked Markdown
bytes. Feature spans locate their exact original text in the parent. `markdown`, `sections`, `html`,
search and normalized fields are regenerable projections. HTML is a sanitized convenience cache;
the source/structured contract does not depend on HTML or theme classes. Local rule links are verified
against the pinned source IDs; their targets are the existing public Rules reader.

```ts
import { readFileSync } from 'node:fs';
import type { FoePackage } from '../contracts/foes.ts';
import { foeReference, resolveFoe, searchFoes } from './catalog.ts';

const pack = JSON.parse(readFileSync('shared/content/foes/catalog.json', 'utf8')) as FoePackage;
const result = searchFoes(pack, 'Bone Shards', { kind: 'ability' })[0];
const reference = foeReference(pack, result.id); // { kind, id, edition }
const resolved = resolveFoe(pack, reference); // object + parent context
// A parser can read resolved.object.fields and ordered sections; no execution is implied.
```

Persist the entire reference, including edition. For an older reference, read its retained
`editions/<edition>.json` and pass that package to `resolveFoe`. The resolver refuses a different
edition or kind instead of silently substituting current content. The renderer accepts a package and
resolved object separately from the page route. No campaign IDs, Stamina state or access grants occur
in these public references. This is the definition adapter for the proposed unified object model;
chat, bookmarks and private-instance disclosure are separate work.

## Identity and corrections

`scripts/foes/identities.json` is a maintained identity registry, not generated output. Feature IDs were
allocated once. The exact original structured-record fingerprint selects a binding within its source
parent; it is **not** the logical ID. Display order, themes and projection corrections do not affect
it. A changed source record requires an explicit registry mapping to the existing ID, or a deliberately
new ID. Never regenerate the registry wholesale. Multiple same-name features with different records
can have different IDs. Indistinguishable duplicate records, missing bindings and multiple bindings
fail closed; adding positional matching would silently corrupt continuity.

`scripts/foes/corrections.json` currently has no production corrections. Each correction declares
`id`, source `revision`, `field`, `expected`, `replacement`, and `reason`. `$markdown` targets the
readable projection; other fields target top-level `fields` entries (including complete structured
arrays). A field correction must include a `$markdown` correction for the same object, so the new
projection and its display can be reviewed together. All preconditions and corrected envelope/effect text are validated together; stale,
duplicate and ambiguous targets fail. Identity/envelope edits require explicit mapping instead.
The test suite demonstrates a paired correction, unchanged original evidence, new edition and
continued resolution of the old edition. Shared extraction fixes live in the importer and affect
all selected records. Neither correction mode edits upstream or generated stat blocks by hand.

A correction or importer output change creates a new edition. Existing edition files are retained;
never delete a published/committed edition to make regeneration pass. The same reference must continue
to resolve to its exact retained contents. Consumer references are not automatically migrated.

## Comparison limits

Every parent, including shared Malice, has one row. Differences preserve field values, source locator,
our edition and the external revision. Ordered feature/effect streams distinguish grouping and markup
from missing text, altered labels, tier values and consequential order. Extra source prose not covered
by structured effects is retained and triggers review, as do unknown external effect fields.
The narrowly guarded explanations cover only the observed values at the pinned comparison revision.

All initial rows have explained differences; this is not a claim of byte equality or independent rules
certification. Both sources can share upstream errors. The report covers generated data, not the live
Steel Cauldron renderer, encounter calculations or either tool's engine execution. Expand coverage in
another bounded slice, retaining missing/unresolved outcomes in the denominator.

## V30 coverage and batch selection

The current package covers 20 first/second-echelon undead, 44 independently addressable abilities,
24 traits, and six features across two shared Malice records. V27's exact immutable edition remains
available and all its logical objects are unchanged in the expanded package.

`scripts/foes/batches.ts` selects source batches and records verified external counterpart identities.
Each batch names its monsters, shared Malice and prior-Malice dependencies. Adding a batch requires
explicit child identity allocations, source review and complete comparison evidence. The importer
links monsters to their own batch's Malice; level-four Malice links back to level-one Malice.
The full generator refuses missing supporting records. Small importer test fixtures may omit them.

The current comparison report is selected by `COMPARISON_REPORT` in the batch module. Historical
V27 evidence remains attached to its original edition. All 22 current parent records have explained
comparison outcomes. Three level-four minion counterparts omit the printed four-minion quantity;
our source-derived `ev` retains both amount 6 and quantity 4. Explicit conflicting quantities or
amounts still fail comparison. No new source corrections were needed.
