# Core foe content (V35)

The package contains all 438 core stat blocks, 63 Malice sheets and 2,006 independently addressable
features. These are source definitions, not live creatures or executable mechanics. The source pin is
`fb83a789da8f0327a389c277a0c790b1648d5810`; supplements are excluded by source identity.

## Generate and verify

- `pnpm foes:build` regenerates the archival `shared/content/foes/catalog.json`, an immutable
  `editions/<edition>.json`, and compact `browser.json`.
- `pnpm foes:check` proves exact regeneration and exhaustive comparison-report accounting offline.
- `pnpm foes:compare --fetch` retrieves the explicitly pinned Steel Cauldron generated inventory.
  `pnpm foes:compare` uses its digest-verified cache. External generated data is comparison evidence
  only, never application content. Every stat block remains in the denominator, including the 25
  with documented unavailable counterparts; one Malice sheet is also unavailable.
- `node scripts/foes/allocate-identities.ts` explicitly allocates missing identity bindings once.
  Ordinary builds never allocate or change identities. Review and commit the append-only registry.

All builds and browsers run on CT114 through `presidium-dev`; see
[the runbook](../../docs/remote-development.md). Use an explicitly named environment for a branch.

## Consumer contract

`shared/contracts/foes.ts` owns the portable schema. `FoePackage` retains complete original JSON,
Markdown, linked Markdown, source spans, ordered sections, structured fields, rendered HTML and
search records. `fields` is a source projection, not an executable rules AST. Printed expressions,
missing values and unusual source shapes remain intact. EV retains amount and quantity only when
fully numeric; a printed dash is not zero.

The UI imports `shared/content/foes/browser.json?raw`, parses it as `FoeDisplayPackage`, and uses the
same `foeReference`, `resolveFoe` and `searchFoes` helpers. This projection removes original evidence,
Markdown, section copies and correction records, retaining the full rendered text and structured
fields. It has the same edition and logical identities as the archival package. The `?raw` import
avoids TypeScript inferring a huge generated JSON literal type. Browser layout and glyph projection
remain the presentation layer's responsibility.

Parents list ordered `featureIds` and `supportingIds`. Each child retains its own ID, parent and
source span. `relatedRules` links contextual group rules, Basic Malice, retainer advancement or an
owner/summoning source. These links are reading context, not inferred grants. Every path and source
ID is verified against the pin. `group: {id,name}` and `sourcebook` are explicit on parents, children
and search rows. Search rows inherit optional level, organization and role from their parent;
missing source values remain missing. The separate library thread owns browse, filter and sort UX.

Persist the complete `{kind,id,edition}` reference. Resolve an old edition using its retained file;
resolution refuses a different edition or kind. V27 and V30 editions and identity bindings remain
available. New source metadata may enrich the current edition without retargeting historical IDs.

## Corrections and source anomalies

`scripts/foes/corrections.json` contains expected-value/revision-guarded projection corrections;
field corrections require a paired reviewed Markdown correction. Original evidence stays immutable.
`scripts/foes/source-adaptations.json` separately records two source extraction repairs, each guarded
by exact JSON and Markdown digests: Gnoll Iron Jaws joins a mistaken split table row; Hag Malice gains
its omitted printed feature and preserves Kick's printed Signature Ability label. Child
`original.records` retains multiple or absent original JSON records; exact source spans always remain.
The package carries the adaptation ledger. A changed source fails rather than silently reusing a fix.

Complete source prose can be retained even where upstream structured effects omit or differently
represent a nested table or paragraph. Diagnostics disclose those boundaries; no mechanic is inferred.
See [the source findings](../../docs/research/V35-source-findings.md).

## Comparison limits

The comparator covers all 501 parent records against the pinned 476-entry external inventory and
records the external Tactical Stance as related reading outside the selected Malice parents.
Representation differences are distinct from source omissions or changed rule text. Reviewed
material differences use exact source/external revisions, field values and, where needed, displayed
source excerpts. Changed or unused dispositions fail verification. Unknown retrieval failures,
ambiguous matches and unexplained material changes fail; documented unavailable counterparts remain
explicitly `unavailable`, never `match`.

This verifies content preservation and comparison accounting, not independent rules correctness,
external renderer behavior or engine execution. Neither ordinary import nor reference availability
adds a creature to live encounters or claims ability automation.
