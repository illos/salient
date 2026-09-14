# Content and source reproducibility repair — 2026-09-14

Implementation follow-up to [S01](2026-09-14-S01.md),
[R02/R03](2026-09-14-R02-R03.md), and the
[runtime audit's sparse-checkout finding](2026-09-14-A08-runtime.md#local-checks-and-remaining-limits).
This is an implementer verification record, not an independent review or deployment certificate.
The Compendium pin remains `fb83a789da8f0327a389c277a0c790b1648d5810`.

## Changes

- **S01-F1:** `convex/contentTables.ts` and `convex/content.ts` preserve `jsonPath` and optional
  `features` through reseed, persistence, and full-entry reads. Both new schema fields are optional
  for existing rows; reseeding loads the bundled values. Non-stat-block content keeps features
  absent. The persisted-read test compares the complete Goblin Warrior feature array to the pinned
  JSON twin and separately checks Spear Charge, Bury the Point, and Crafty.
  Foe snapshot propagation belongs to the coordinating agent's source/snapshot changes; this
  subtask did not edit `convex/foes.ts` or certify the foe operation path.
- **S01-F2:** the generator no longer reads the old manifest or accepts a prior generation date.
  `generatedAt` is now the UTC calendar date of the pinned source commit, independently calculated
  from Git's commit timestamp. It is explicitly documented as reproducible source metadata, not
  the wall-clock build date. Generator version is `1.0.1`. Regeneration changed only the manifest's
  generator version, generation date (`2026-09-08`), and derived content hash; all 403 entries are
  unchanged. Tests reject both a valid substituted date (`2020-01-01`) and the original impossible
  date reproduction (`9999-99-99`).
- **Sparse-checkout reproducibility:** source-evidence readers in R01, R02, R03, R05, S01, and the
  persisted content test use `tests/helpers/pinned-source.ts`. It reads exact Git blobs at the
  superproject's committed submodule pin, including clean-book/chapter files absent on disk.
  A temporary Git fixture omits a book file with sparse checkout and advances the child HEAD;
  the reader still returns the original pinned blob. Missing sources still fail, and paths outside
  the Compendium are refused. No fetch, source edit, or sparse-checkout change is required in the
  actual repository. The dependency guide documents this behavior.
- **R03 documentation:** the hero projection explicitly receives authored character metadata for
  `name`, separately from `DerivedBaseline` and `HeroLiveState`.
- **Question headings:** Q-R-1, Q-R-2, and Q-R-3 moved under Open questions. Their existing open
  statuses, source notes, recommendations, and empty answers are unchanged. No rules ruling was made.

## Verification

- `pnpm exec vitest run --project scripts --project app --project engine tests/scripts/build-content.test.ts tests/scripts/pinned-source.test.ts tests/app/content.test.ts tests/fury-decisions.test.ts tests/character-derived-values.test.ts tests/live-state-initialization.test.ts tests/core-conditions.test.ts`
  — **49 tests passed in 7 files**.
- `pnpm content:check` — **pass**, 403 entries, 10 exclusions, unchanged source pin.
- `pnpm exec tsc --noEmit` and `pnpm exec tsc -p tsconfig.web.json` — **pass**.
- ESLint on all changed TypeScript files in this subtask — **pass**.
- Prettier on changed TypeScript files and documentation — **pass**.
- `pnpm check-links` — **pass**, 123 Markdown files at the time of the check.
- `git diff --check` — **pass**; `git status --short vendor/steel-compendium` — no changes.

No deployment, live reseed, commit, or STATUS edit was performed by this subtask. Existing deployed
content rows need reseeding to acquire the added fields; loaded foe snapshots need the coordinating
repair's normal load/reset workflow. Broader integrated validation and independent review remain
with the coordinating agent.
