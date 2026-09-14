# Independent review of content/source repairs — 2026-09-14

**Implementation verdict: pass for this bounded repair. Rules extraction verdict: pass.**
S01-F1 and S01-F2 are resolved in the reviewed working tree. No new blocking finding.

Reviewer: fresh independent `review_fixed_content` agent, without implementation authorship.
This reviews the current uncommitted repairs against application HEAD
`8e9e315dcee3642bbc0d4b2422421dc1aedfb26e`, not a claim that the original HEAD passed.
Read project instructions, development process, the original [S01 audit](2026-09-14-S01.md),
[R02/R03 audit](2026-09-14-R02-R03.md), and
[implementer record](2026-09-14-fix-content.md). Applied the Convex review skill to the backend portion.
Rules evidence came exclusively from the local pinned Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810` (`v4.20260908021459`). No online rules research.

## Findings and source trace

- **S01-F1:** optional `jsonPath` and `features` now survive the content schema, internal reseed,
  stored rows and authenticated full-entry query. Non-stat-block features remain absent.
  `foeSource.snapshotOf` copies both optional fields without transforming their nested values.
  Catalog previews and actual `foe.add` loads use that helper. The loaded snapshot remains separate
  from mutable live state. `journalInsert` retains the whole snapshot in its after-value and
  `journalDelete` retains it in its before-value. Focused persisted tests compare all three Goblin
  features to the pinned JSON twin; an additional temporary reviewer check compared the exact
  snapshot string in both journal records with the actual loaded foe. Both comparisons passed.
- **S01-F2:** `buildSnapshot` no longer reads or accepts the generated manifest as input.
  It calculates the date from the clean pinned commit's `%cI` timestamp, converted to a UTC date.
  The documented value is source metadata, `2026-09-08`, independently reproducible on another
  build day. Tests detect both a valid substituted date and `9999-99-99`. Generator version is
  `1.0.1`; only `generator`, `generatedAt`, and `contentHash` changed in the manifest.
- **Sparse checkout:** the test helper obtains the gitlink from superproject `HEAD` and reads
  that exact commit's blobs with `git show`. It never uses the child checkout's current version
  as substitute evidence. Its isolated Git fixture actually omits the book file and advances
  child HEAD, yet reads the original pinned text. Missing blobs and paths outside the vendor
  directory fail. The helper does not fetch, edit vendor files, or expand sparse checkout.
  The generator still intentionally requires clean materialized unified Markdown/JSON paths.
- **R03 correction:** `DerivedBaseline` and `HeroLiveState` have no character-name field.
  The corrected projection contract therefore properly identifies authored character metadata
  as the separate input. This documentation change supplies no new evaluator or adapter.
- **Question relocation:** independently split both HEAD and working-tree question documents into
  question blocks and compared them: all **30 blocks are unchanged**. Q-R-1, Q-R-2 and Q-R-3 now
  occur under Open questions. Their recommendations remain provisional; no ruling was altered,
  and the R03 Q-R-200 decision limitation from the earlier review remains open.
- **F10 source preservation:** the changed Recovery operation snapshots the complete Catch Breath
  and Recoveries Markdown, IDs, names, source paths and revisions into the persisted event.
  The local source files explicitly provide the maneuver and out-of-combat Recovery context.
  The observer event projection retains both records unchanged, verified through `api.events.list`.
  The FreePlay note is separate application context; the source text is not rewritten to imply
  changed rules. This diff adds source delivery without changing healing arithmetic or settling
  Q-R-3. Source rendering and browser presentation belong to the complementary audience review.

Authenticated content reads, indexed content lookup, internal-only reseed and Director-only foe
source reads remain intact. The new `v.any()` feature members preserve upstream heterogeneous
objects; only trusted bundled content enters this path. No new auth or schema-validation issue
was found within this repair.

## Independent verification

- Repeated full extraction comparison independently of the generator/frontmatter parser, using
  installed PyYAML and `git show <exact-pin>:<path>`: **403/403 exact** complete Markdown byte
  strings, identity fields, full structured objects, and applicable complete JSON feature arrays.
  This includes every Goblin Warrior feature and all 15 Fury level-one abilities. Every generated
  file except the manifest is byte-identical to application HEAD. Thus the prior extraction
  omissions/defaults review remains applicable; this repair adds no inferred mechanical fields.
- `pnpm content:check`: pass, 403 entries and 10 exclusions.
- Focused suite: **61 tests pass across 10 files** using
  `pnpm exec vitest run --project scripts --project app --project engine` with
  `tests/scripts/build-content.test.ts`, `tests/scripts/pinned-source.test.ts`,
  `tests/app/content.test.ts`, `tests/app/foes.test.ts`, `tests/app/foe-operations.test.ts`,
  `tests/fury-decisions.test.ts`, `tests/character-derived-values.test.ts`,
  `tests/live-state-initialization.test.ts`, `tests/core-conditions.test.ts`, and
  `tests/app/audience.test.ts`.
- A temporary copy of `foe-operations.test.ts` added exact assertions for
  `insertion[0].after.value.sourceSnapshot` and `deletion[0].before.value.sourceSnapshot` against
  the loaded row: **2 tests pass**. Removed the temporary file after execution; no implementation
  or permanent test edits were made by this reviewer.
- Vendor Git status remains clean at the exact pin. No deployment, live reseed, commit or STATUS
  change was performed by this reviewer. The coordinating agent's complete build and live checks
  are separate evidence, not claimed as reviewer execution here.

## Reviewed revision and limits

Final source-preservation recheck at 20:49 UTC: inspected the current audience projection's
exact generated test-result suffix replacement. It operates only on `test.roll` description,
result difficulty and command difficulty; it leaves `data.source` and its supporting records
untouched. Reran the Recovery source-persistence/observer-read test: **1 passed, 7 unrelated tests
skipped**. The bounded implementation/extraction verdict remains **pass**. Recomputed the input
digest below; it is unchanged because the final suffix fix was already present when the initial
digest was captured. The separate observer-control change in `table.ts` is outside this content
review and does not alter the reviewed content or Recovery paths.

Content hash: `sha256:746e8b51d64f379113c8757785f7cd68c287ce814e32476ef5d6dbb7ddfc0cb5`.
Manifest file SHA-256: `117dde1f96e43807568aa239ae388e377c2ef631608bc0d8801a588e490587c4`.
For identifying the reviewed uncommitted state, SHA-256 over each following UTF-8 path, NUL,
file bytes, NUL, in this order is
`b2ce5c6afd270b9052e1b2288d41c6271297d27f5e8cab53ffaf3eafcaad195b`:

```text
scripts/build-content.ts
shared/content/compendium/manifest.json
convex/content.ts
convex/contentTables.ts
convex/lib/foeSource.ts
convex/lib/foeOperations.ts
convex/lib/journal.ts
convex/lib/tableOperations.ts
convex/lib/audience.ts
tests/helpers/pinned-source.ts
docs/live-state-initialization.md
docs/rules-questions-for-user.md
```

These hashes identify review inputs; they do not prove source semantics. Later relevant changes
need renewed review. Approval covers extraction and delivery of this bounded content repair,
not all R01 inputs, chapter closure, general ability execution, every history feature, or the
whole audience diff. Existing deployed content rows still require reseeding and existing loaded
foes retain their old immutable snapshots until recreated through the development workflow.
Historical Recovery events are not backfilled. Live deployment, actual browser rendering and
the complete application acceptance journey remain the coordinating agent's scope.
