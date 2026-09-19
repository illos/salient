# V43: incremental table loading and bounded history reads

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead — performance |
| Rules review | not required — preserve existing operation semantics |
| Depends on | V41, V42 |
| Unblocks | Integrated performance rollout |
| Status | Reviewed — integration pending |

## Goal

Open the table without fetching every full sheet/source or repeatedly replaying the session log for passive controls. Preserve authorization, history windows, corrections, exact undo/redo and all existing data. Merge V41 and V43 and update the shared development app after verification.

## Spec references

- `docs/table-spec.md#incremental-table-loading--2026-09-19`
- `docs/table-spec.md#party-sheets-and-resource-visibility`
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control`
- `docs/data-architecture-spec.md#5-encounter-actions-and-undo`

## In scope

- Small audience-projected roster facts; full foe/hero detail only when opened.
- Independent log, history and roster reads start together; visible panes render without unrelated response gates.
- Ability result queries restricted to visible log pages, retaining older-page results.
- Incremental derived history read state, with bounded catch-up for existing sessions; preserve append-only source events and mutation validation.
- Test, independently review, commit and merge both performance slices; update and verify established shared development runtime.

## Out of scope

New rules, changed undo windows, deleting/truncating gameplay history, external hosted publication, and broad entity-storage rewrites.

## Inputs and dependencies

V41 committed `fd58cf7`/`5f55f34`, V42 merged `45426dc`/`c63294b`. Existing journal and history walker remain the semantic reference. No stubbed production dependencies.

## Deliverables

Compact roster response and consumers, early table read composition, bounded ability-result projection, incremental history read tables/writer/catch-up and reader, regression/browser evidence, integration record.

## Acceptance checks

1. Director/player/observer roster and details preserve privacy and current card values; no initial per-foe detail or per-hero full-sheet subscriptions on collapsed cards.
2. Independent table reads start together; log and panes can load progressively; drill-in, targeting, tab switches and session lifecycle remain functional.
3. Result reads cover only requested visible events, including older pages and corrected/restored records; invalid/cross-campaign IDs cannot disclose data.
4. Derived history read windows match the original walker through gameplay, non-gameplay, undo, redo, new branches, corrections, manual continuations, encounter boundaries and session transitions. Catch-up handles existing data in bounded batches with writes during catch-up; source history is never deleted.
5. `pnpm check`, focused long-session/privacy regressions, real browser journeys and independent review pass. Capture subscription/payload evidence; no local timings represented as hosted improvements.
6. Commit metadata validates, main integrates both slices, shared runtime updates without reset, and actual shared HTTPS checks read persisted results back.

## Ability design and playtest evidence

Not applicable: delivery/read-side optimization, no new rules or ability semantics.

## Rules research

None. Existing authorized contracts and source-derived baseline fields remain unchanged.

## Open questions

None.

## Work log

- 2026-09-19: user authorized table changes and clarified completion is merge. Claimed `slice/V43` in `/srv/presidium/projects/salient/performance`, stacked on clean V41. Reuse isolated CT114 `performance`, then serialize shared main update through Chords. Files: table/roster/log UI, Convex table/results/history read paths and bounded derived-state maintenance. Preserve source logs and legacy mutation validator as correctness reference; record exact final design and limits after testing.

- Verification: full CT114 `pnpm check` passed (274 engine + 406 app/scripts = 680 tests, lint, types, pinned content, links, build/budget). The added fifth real lifecycle/floor/backfill parity scenario subsequently passed with all five focused table tests. Backend sync added the two derived tables/indexes and reported functions ready without validation errors. Initial-JS gzip budget is 160,918 bytes against the live-baseline inventory's 458,779. Browser and independent review pending; no hosted timing improvement is inferred from development runtime timings.

- Browser verification: journey, table and shared-navigation cases passed; unchanged standalone Fury wizard/admission/three-audience/60-action test passed in 3.0min after the batch hit account registration rate limiting. One979ms history warning remains; no timeout in the retry. Final prepare-gating refinement passed lint/types and the table browser again (33.7s). All52 implementation/config/test files match the tested remote source. [Evidence and limits](evidence/V43/README.md), [independent review PASS](reviews/V43-table-performance.md), reviewer `v43_review`,2026-09-19. Source-event history is preserved; full mutation validation remains an explicit cost limitation.
