# V41: shared navigation and incremental reference loading

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team — performance |
| Rules review | not required — no source/rules semantics change |
| Depends on | V38, V39; coordinate V40 router integration |
| Status | Committed on slice/V41 `fd58cf7` — awaiting integration |

## Goal

Keep ordinary site navigation consistent and responsive across public Rules/Foes and signed-in app views. Load page code and the reference data currently needed, with build-generated search indexes and versioned browser caching.

## Spec references

- `docs/reference-library-spec.md#reference-loading-and-navigation--2026-09-19`
- `docs/v1-tech-stack-spec.md#3-rendering-spa-baseline-ssr-remains-optional`
- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`

## Scope and decisions

User authorization on 2026-09-19 covers shared top navigation, route lazy loading, progressive reference content delivery, indexes generated at build time and retained between views, and immutable asset caching. Public access and existing search/filter relevance, all content identities, source links and card navigation remain. Progressive delivery uses small on-demand chunks and background workers, not artificial serialization of independent requests. Table summary/read/history redesign remains a recommendation awaiting discussion; no backend schema/function changes in this slice.

## Deliverables and verification

1. Shared responsive primary navigation on app and reference pages, without auth gating public content; internal navigation preserves the document.
2. Lazy non-entry page components with loading/error boundaries; measure complete initial static JS closure.
3. Compact reference catalogs; bounded/per-reference detail assets loaded only on opening; browse snippets loaded as needed; preserved complete source coverage.
4. Deterministic serialized Rules/Foes indexes generated from pinned data; workers deserialize them once per content version and stay alive across articles/routes. No corpus indexing on the browser main thread. Query ordering, errors/retry and empty query behavior remain correct.
5. Immutable headers for hashed and versioned content; HTML/current manifests revalidate. Verify served headers on a compatible preview; hosted publication separately recorded if performed.
6. Meaningful generation/search parity tests and browser coverage for delayed assets, document-preserving navigation, public/authenticated headers, deep links, cached return, all parent/feature cards, responsive overflow and error retry. Run full `pnpm check` and independent implementation review.

## Ability design and rules research

Not applicable. Only delivery and presentation boundaries change, using the existing pinned content.

## Work log

- 2026-09-19: claimed from main `6ddb3cb`, worktree `/srv/presidium/projects/salient/performance`, branch `slice/V41`; named CT114 `performance` environment. Main audit evidence preserved. Peer V40 owns new-character route changes and has been notified of router overlap. Live-site baseline is recorded in the performance audit. No hosted/backend rollout is part of initial implementation/testing.

- Integrated V40 implementation `af69671` before completing the router edits. Its single `useParams` wizard creation route is retained. Worktree broker launches use the installed presidium-dev helper with only the SSH subprocess cwd set to canonical `code`, matching the existing character-thread workaround; source/archive identity remains this actual worktree. No shared-main/runtime or hosted changes.
- Delivery design: all 2,507 Foe entries remain addressable through a compact manifest; 501 root-plus-feature files preserve card traversal. Build-time presentation replaces runtime Foe HTML processing. Rules browse excerpts are fetched in small shards; individual articles replace category downloads, and oversized articles split between complete HTML elements at a 128 KB target. Three continuation requests run concurrently, with an anchored section prioritized; navigation/error stops future scheduling and retry preserves already-rendered text.
- Prebuilt Rules full-text indexes cost approximately 1.4 MB gzip, larger than the previous corpus download. Catalogue title matches therefore render immediately while full-text search loads; the UI identifies the pending full-text phase. Final ranking/snippets remain the existing worker algorithm. Workers persist across articles and library navigation; serialized index content participates in the immutable version hash.
- First candidate full `pnpm check` passed 675 tests and the transitive initial-JS budget. First browser pass found a hash-scroll timing issue (repaired with a post-render section effect) and Vite serving HTML for an existing search-index file after the build deletes/regenerates its public tree. The generator now preserves the current public directory while rewriting assets; both Rules and Foes generators use this strategy. Production verification uses Wrangler's actual static-assets runtime.

- Integrated V42 implementation `45426dc` before final verification. The first Workers runtime pass passed 12/13 scenarios, including actual cache headers. Its late-chapter anchor assertion failed and prompted further diagnostics, recorded below. The section now stays in view through insertion until pointer, wheel, touch or keyboard input releases it; final coverage includes reader scroll release.

## Limits and follow-up

- Hosted timings in the audit remain the pre-change live baseline. This slice measures final emitted bytes and tests functionality/headers in the actual Workers runtime on CT114; it does not claim post-change hosted latency or a hosted rollout.
- The full-text Rules index is approximately 1.4 MB gzip. Build-time indexing removes repeated corpus indexing, but download/deserialization still costs time on first search. Immediate title results and a visible full-text pending state keep search usable; later searches reuse the worker/index.
- Content versions are immutable, while the current catalogue revalidates. An already-open document retains its catalogue version; after an update removes that version's assets, reload the document to obtain the new catalogue. This slice does not add cross-deployment old-asset retention.
- Oversized chapters load complete HTML elements progressively with three requests in flight, prioritizing a requested anchor. This is progressive static delivery, not server-rendered HTTP streaming. An indivisible large element and the complete heading metadata can exceed the nominal 128 KB target.
- Table follow-up: return authorized roster summaries for the initial screen; load full hero sheets/foe source on drill-in; start independent log/roster reads together after access is established. Then bound log reads with checkpoints/pagination while preserving undo/correction semantics. Do not truncate history without those invariants. Warm tabs already measured 11–17 ms; prioritize cold startup and subscription payloads.

- The late-anchor failure was ultimately isolated to browser tracing exhausting the constrained runner, not a remaining alignment failure: the same production bundle passed with tracing disabled and recorded the selected heading at approximately 157 px throughout insertion. Only the two huge-chapter anchor tests disable DOM snapshot tracing. The input-released layout correction remains; a speculative extra animation-frame correction was removed. Final evidence records the failed and diagnostic runs explicitly.

## Verification outcome

- `pnpm check`: 676 tests pass; final refinements also pass lint, TypeScript and production build.
- Actual Workers runtime: 14 browser scenarios pass; authenticated isolated HTTPS preview: four journeys pass, including table/session flow and persisted wizard creation/reopening.
- Complete initial static JS: 490,191 raw / 160,921 gzip bytes, 64.9% less gzip than the audit baseline. Rules catalogue: 112,848 gzip; Foes catalogue: 101,309 gzip. All content coverage retained.
- [Detailed evidence and limitations](evidence/V41/README.md), including exact source hashes, logs, screenshots and failed-run diagnosis.
- Based on V42 implementation `45426dc`, then incorporated its documentation closeout `c63294b`. No hosted rollout or main runtime update in this slice. Independent review and branch handoff recorded below when complete.

## Independent review

[`v41_review`: pass, 2026-09-19](reviews/V41-reference-performance.md). All six acceptance checks verified within the isolated-runtime scope; no unresolved blocking finding. Rules review not required because source/gameplay semantics are unchanged.

## Branch handoff

Reviewed implementation: `fd58cf7443d42e31fb8c6efb5ca4c57aec1ecfe3`. Commit metadata validation passed with `node scripts/check-commit.ts --merge --range main..HEAD`. Final documentation links and whitespace checks passed. The isolated CT114 `performance` environment was stopped after verification, retaining its data; shared `main` and the hosted Worker were not changed. This is a reviewed branch handoff, not a completed merge or publication. No additional runtime sync is needed for this documentation-only closeout.

The canonical main checkout still contains the original untracked audit report/evidence from the read-only audit; their complete preserved copies are committed here (the report adds the V41 follow-up link). An integrating lead should preserve/reconcile those owned audit files before fast-forwarding main.
