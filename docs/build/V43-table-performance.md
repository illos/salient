# V43: incremental table loading and bounded history reads

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead — performance |
| Rules review | not required — preserve existing operation semantics |
| Depends on | V41, V42 |
| Unblocks | Integrated performance rollout |
| Status | Complete — merged and shared development verified |

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

- Browser verification: journey, table and shared-navigation cases passed; unchanged standalone Fury wizard/admission/three-audience/60-action test passed in 3.0 min after the batch hit account registration rate limiting. One 979 ms history warning remains; no timeout in the retry. Final prepare-gating refinement passed lint/types and the table browser again (33.7 s). All 52 implementation/config/test files match the tested remote source. [Evidence and limits](evidence/V43/README.md), [independent review PASS](reviews/V43-table-performance.md), reviewer `v43_review`, 2026-09-19. Source-event history is preserved; full mutation validation remains an explicit cost limitation.

## Integration and shared development verification

V41 implementation `bc74ddd` and V43 implementation `087a709` are merged into `main`, retaining V44's documentation commit `9fb4fa6`. Rebase reconciliation changed only documentation; all 52 implementation/config/test files match the reviewed isolated candidate. Commit metadata checks and 255 document link checks passed.

`presidium-dev up` updated the established shared CT114 `main` environment from the clean `087a709598e6acf2d86f8b68ba62f835b46e0c33` checkout. Target: local-anonymous `anonymous:anonymous-agent`, Compose `salient-dev-b90776c53141`, internal backend ports 3210/3211, frontend host port 32830, [shared HTTPS app](https://salient-dev-fc4f48cb09a0.tail41404c.ts.net). Existing volumes, authentication secrets and pinned content were retained; no reset/reseed was run. New history indexes synchronized and Convex reported ready at 13:56:21 UTC.

Three actual shared browser checks passed in 1.3 min: account/session/private-draft/reconnect journey; six-foe+one-hero table subscription/drill-in/edit/undo/redo/reload scenario; and signed-in Rules/Foes navigation. Persisted Stamina 9 was reread after reload. [Runtime evidence](evidence/V43/README.md#shared-development-rollout), source hashes, screenshot and logs are retained. No execution timeout occurred; one characters.reviews 927 ms warning remains a follow-up alongside the isolated history 979 ms warning. Near-limit backend execution and full mutation replay are not claimed solved.

The owned isolated `performance` stack is stopped, volumes retained. Shared runtime remains available. No external hosted publication or remote Git push was performed. The final documentation-only closeout requires no further runtime update.

## Hosted development publication — 2026-09-19

The user subsequently authorized remote publication. Source `944a46ab7b05059d22d8403634867de56462e209`
was pushed to `origin/main` and deployed to Convex Cloud development `different-bat-943` and
Cloudflare Worker `salient-dev`, version `7e86903b-5f7c-46a8-8d68-540f8f21991f`.
Existing cloud data, auth settings and content were retained; no reset, reseed or auth reconfiguration
was performed. GitHub CI passed all 681 tests and the complete check suite.
See [hosted deployment evidence](evidence/V43/hosted/README.md) for live verification and limitations.
This supersedes the earlier unpublished status; the shared CT114 runtime was not changed by this publication.
