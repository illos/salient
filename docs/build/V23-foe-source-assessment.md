# V23: Foe source ingestion assessment

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Foe coverage track |
| Rules review | not required — source inventory and recommendation; no mechanical changes |
| Depends on | S01, A09, implemented Rules portion of V13 |
| Unblocks | Shared monster ingestion package; informs app catalog and parser consumers |
| Status | see `STATUS.md` |

## Goal

Kick off foe coverage with an evidence-backed answer on reliable all-core stat-block ingestion,
separating existing public reading, missing structured data coverage and downstream consumers.

## Spec references

- `docs/monster-catalog-spec.md#confirmed-requirements-and-proposed-first-scope`
- `docs/monster-catalog-spec.md#proposed-import-procedure`
- `docs/reference-library-spec.md#confirmed-library-coverage`
- `docs/reference-library-spec.md#implementation-note--embedded-core-compendium-2026-09-15`

## In scope

- Source inventory, representative exceptions and corpus-wide extraction checks.
- Existing Rules/content/roster implementation inspection.
- Dedicated worktree and a proposed bounded monster-ingestion implementation.

## Out of scope

- Catalog or gameplay implementation, new source interpretations, deployment and backend changes.
- V02/V03 creature models, V06 saved encounters, and V05 effect automation.

## Inputs and dependencies

Integrated `main` at `e83930e`; pinned core source; existing Rules assets. No fixtures needed.
V13's existing Rules implementation is enough for this assessment; completion of Items/Foes is not
a dependency. V02/V03/V05 are not prerequisites for research or readable catalog coverage.

## Deliverables

- [Assessment and next implementation recommendation](../research/foe-catalog-kickoff.md).
- [Core-only inventory and measured exceptions](../research/foe-catalog-audit-2026-09-15.json).

## Acceptance checks

1. Enumerate core-book `type: statblock` records at the pinned revision: 438 unique entries, 437
   Monsters and one Heroes; all have original and expanded Markdown and an existing Rules catalog ID.
2. Compare ten visible table fields and feature heading associations across the population; record
   exceptions and distinguish extraction agreement from gameplay correctness.
3. `node scripts/ingest-rules.ts --check` verifies current generated Rules assets without rewriting.
4. Read the report against `scripts/build-content.ts`, `scripts/ingest-rules.ts`, `convex/foes.ts`,
   `convex/lib/foeOperations.ts` and `web/table/foe-sheet.tsx`; verify loading remains single-definition.
5. Check documentation links, JSON syntax and Git diff whitespace. No changed application behavior
   needs live-state or browser verification in this assessment.

## Rules research

Pinned `en/books/{heroes,monsters}/{json,md,md-linked}` records only. This report checks representation,
not new mechanical meaning. Earlier parser research is cited with its original limitations.

## Open questions

None needed for this assessment. Implementation remains subject to the owning specs' open decisions.

## Work log

- 2026-09-15: Claimed by Codex, primary track foe coverage, branch `slice/V23`, worktree
  `/srv/presidium/projects/salient/foes`, from integrated `main` at `e83930e`. Shared main has existing
  development-process documentation edits and the parser track has `slice/V22`; neither was modified.
  Followed the updated checkpoint instructions read in main; did not copy its uncommitted work.
- Target: local read-only Git source inspection and generated-asset check; no backend configured,
  synchronized or reset. Initialized the exact Compendium pin using the existing local object store.
- Contract consumers inspected: public Rules reader/search, shared content package, foe add/query,
  table sheet, parser/runtime source adapter. No shared application contracts changed.
- One-off scan measured 438 entries, 4,380 agreeing stat fields and 1,800 feature-title associations.
  Full results and explicit limits are in the deliverables. Follow-up ingestion implementation is proposed,
  not certified by this source audit.
- User clarified the track boundary: correctly ingest monster source files into shared app/parser data;
  engine execution is owned by the separate parser branch. Revised the recommendation around the data
  contract, complete feature sections and corpus validation. Runtime expansion is downstream work.
- Verification: `node scripts/ingest-rules.ts --check` in the shared checkout passed: 2,614 entries,
  26 categories, no unresolved links. It is a read-only regeneration check; no assets were rewritten.
- Verification in this worktree: `node scripts/check-links.ts` passed (158 Markdown files),
  `node scripts/check-vendor.ts` passed (both pinned submodules), `git diff --check` passed, and
  Python JSON/count assertions verified the recorded inventory and exceptions. Initial worktree
  link checks lacked materialized vendor files; sparse initialization at the existing pins repaired
  that setup. No source changes or pin advances were made.
- Closing: assessment and data-contract proposal complete, documentation-only. No production importer,
  app behavior, parser behavior or backend was changed. Full application/browser tests and independent
  implementation/rules reviews are not claimed by this research record. The next implementation is
  the shared ingestion package; parser execution remains owned by its separate branch.
- 2026-09-15 follow-up: recorded the user's correction/search/theming/sharing requirements as resolved
  Q-V-1. Read data architecture section 3.5, table content sharing, inventory object sharing and current
  Rules reference/rendering code. Updated owning specs and the proposed data contract: independently
  addressable features, identities separate from ordering, regenerable corrections and shared resolution.
  Sharing UI and engine execution remain downstream. Documentation links and diff whitespace pass;
  no runtime code or generated corpus data changed.
- 2026-09-15 comparison follow-up: user authorized examining Steel Cauldron's generated stat blocks
  as a secondary completeness comparison and explicitly excluded direct adaptation without a clear
  license. Inspected eleven undead outputs and four Malice features at a fixed external revision;
  [comparison report](../research/steel-cauldron-output-comparison.md) records checks, differences and
  limits. Expected content remains the pinned local Compendium; no external implementation or data
  was added to the application. Documentation links and diff whitespace pass.
