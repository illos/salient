# V35: Full core stat-block ingestion

Track: foe coverage. Rules review: required. Depends on V27, V30 and V34.

## Goal

Deliver all 438 core stat blocks as complete, independently addressable source definitions with
abilities, traits and supporting Malice, usable by the app and future parser. Ability execution
and live roster loading remain separate. The user's parallel thread owns library browse/sort design.

## Spec references

- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`
- `docs/monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16`
- `docs/data-architecture-spec.md#35-unified-object-references-and-sharing`
- `docs/monster-presentation-spec.md`

## Acceptance checks

1. Exact inventory of 438 core stat blocks, 1,800 embedded features, all source Malice records;
   original JSON/Markdown/linked Markdown retained and complete readable spans reconstructable.
2. Deterministic regeneration, append-only identities and retained V27/V30 historical editions.
   Source anomalies preserve evidence; no inferred rules or truncated expressions.
3. Every stat block has an explicit comparison outcome against the pinned Steel Cauldron inventory;
   material differences investigated against Compendium, missing counterparts reported honestly.
4. Source-based regression tests reject lost text, changed stats, ambiguous identities and stale
   corrections; all content references resolve and supporting links respect source context.
5. Browser checks open the entire imported corpus and representative independent features with the
   shared Core presentation, both themes, and no page errors. Full-volume delivery remains usable.
6. `pnpm check`, independent implementation review and subsequent pinned-source review pass.

## Work log

2026-09-17: User authorized building the display-focused full core ingest. New worktree
`/srv/presidium/projects/salient/foes-full`, branch `slice/V35`, from main `a0ac6d4`.
Reviewed V30 prerequisite `510f6c7` cherry-picked as `214d04b`, preserving V34 presentation.
All builds, installs and browsers use named CT114 `foes`; shared main remains untouched.
Source research and comparator implementation are delegated under the project build process.
Importer, source package, consumer interface and verification are owned here. No gameplay/backend changes.

### Full source generation and comparison

Generated edition `bf262edf546e91e1540cc17489915f18c4873ddd8bd8e225b20f3441e3f74f30`:
438 stat blocks, 63 Malice parents, 1,158 abilities, 642 traits and 206 Malice child records.
All 74 prior V30 feature bindings remain; 1,932 new bindings were explicitly allocated once.
All parent source bytes and child spans are retained. The 21.27 MB archival package projects to
6.63 MB browser JSON (680,790 gzip bytes), excluding original evidence/section duplication.

All 501 parents have explicit comparison outcomes: 475 explained, 26 unavailable, no unresolved,
missing, ambiguous, retrieval or comparison errors. All 476 pinned external generated files were
retrieved and digest checked; Tactical Stance is recorded separately as related reading.
Unavailable means no corresponding external record exists at that pin, not a verified match.
Guarded source/projection records make new drift in those entries fail review too.

Source findings identified two extraction repairs: Gnoll Iron Jaws was split at a malformed table
row, and Hag Malice omitted a printed feature and misclassified Kick's signature label. Both repairs
retain exact originals and fail on changed JSON/Markdown inputs. No vendor pin or file changed.
Nested abilities, absent numeric EV and optional fields remain readable without inferred execution.

The library peer (V36) received the compact package contract and full generated file for independent
browse/sort integration. Only minimum compatibility edits are made to the existing preview here.
Parent search text covers its own header/prose; consumer monster search can compose child text.

### Verification

Named CT114 environment: `foes`, Compose `salient-foes-dev-40d531b6ad5e`, preview
`https://salient-foes-dev-7bbd8a1a60ab.tail41404c.ts.net`. Shared main is unchanged.
The installed helper's sibling-worktree SSH cwd issue required a temporary local client copy that
runs only the broker subprocess from the canonical project directory, retaining the selected
worktree archive/identity. No broker grant or system helper was modified. Iterative source files
were transferred only to this named environment; final verification records the selected files.

Initial focused validation: generation, exhaustive comparison, TypeScript and all 24 then-current
foe tests pass. Final unavailable-counterpart mutation tests were added afterward.
First `pnpm check` passed lint/types, engine and visible app/script tests through Rules, then exited
137 at the 2 GiB build-container limit. The retry uses `NODE_OPTIONS=--max-old-space-size=768` to
force earlier collection within the same container limit; no assertions or timeouts were weakened.
Logs and final browser/review results are recorded below when complete.

The 768 MiB retry failed in TypeScript before app tests. Root cause was an existing presentation test
importing the new 21 MB archival JSON as a JavaScript module, forcing TypeScript/Vite to expand a
huge literal. `tests/scripts/core-presentation.test.ts` now reads JSON data through `readFileSync`,
with the same typed contract and every-object assertions. The whole-object presentation test gets
30 seconds for 2,507 objects rather than the previous small fixture; measured time is 1.34 seconds.
The subsequent default-heap typecheck and all 32 focused tests pass, including the new unavailable
mutations. A crash dump from the failed heap experiment was removed from the remote source before
rerunning lint (it was a generated `core.576`, not project data). Container limits remain unchanged.


Final `pnpm check` passes with the normal 1,536 MiB Node heap and unchanged 2 GiB build
container: 97 engine tests, 358 app/script tests, lint, types, links, vendor pins, both content
regeneration checks and production build. See [check log](evidence/V35/check.log) and
[focused log](evidence/V35/focused.log). The lazy Foes bundle is 696.78 kB gzip; Vite reports
its standard large-chunk advisory. The archival evidence is excluded from the browser bundle.

The first browser command accidentally selected the unrelated authenticated V34 hero/Director
scenario as well as the five intended public checks. All five public checks passed (including all
501 parents); the extra scenario timed out in its campaign-admission fixture waiting for Approve,
before its content assertions. The corrected command explicitly excludes that scenario. This slice
makes no backend, campaign or hero-sheet changes and does not claim authenticated-suite validation.

Corrected public browser run: **five passed**, including every 501 parent, all 2,006 feature
controls, existing independent-feature/navigation/focus checks, both themes and font fallback.
No page errors. [Durable browser evidence and screenshots](evidence/V35/README.md#browser-acceptance)
record the actual HTTPS run. All 25 changed scripts/shared/tests/web files compare byte-for-byte
between the local branch and tested CT114 source. Main remains clean and its runtime unchanged.

### Review and branch handoff

[Independent implementation review](audits/2026-09-17-V35-independent-review.md): pass.
[Independent source review](audits/2026-09-17-V35-source-review.md): pass.
This is a display-content slice; complete
ability automation, live encounter loading and the parallel V36 browse/sort design are separate.

Integration requires the V30 prerequisite `214d04b` followed by V35. The library consumer uses
`shared/content/foes/browser.json?raw` as `FoeDisplayPackage`, the existing generic reference/search
helpers, and the same immutable edition/IDs as the full catalog. Parent facets and related Rules
links are included; full monster-text search can compose the existing child search rows. The V36
thread will adapt public browser selectors to its redesigned pagination/tabs while retaining the
all-parent coverage. The archival editions and comparison evidence must stay in the final tree.

This branch handoff does not update shared main or its playable environment. The named `foes`
preview remains available with the tested source. No production deployment or backend migration
was performed.

The source reviewer found one explanation-only wording error repeated across six Troll weakness
comparison dispositions: the printed order is Acid with a magnitude, then fire with no magnitude.
Corrected those descriptions and regenerated the report. The actual fields, source text and guards
were already correct. CT114 `pnpm foes:compare && pnpm foes:check` passes again with 475 explained,
26 unavailable, zero other outcomes and the same immutable edition. No browser or engine behavior
changed, so the passing full suite and browser evidence remain applicable.
