# V32 backend implementation review

Reviewer: `v32_rules_research`, 2026-09-16. **Scope: backend only.** The reviewer authored the
independent rules fixture and pure evaluator, but did not author any backend code reviewed here.
This report does not independently approve that evaluator, the UI, the generator or the complete
slice. Those components require separate review/evidence.

Review target: uncommitted `slice/V32` worktree changes based on main `f7137dc`, including fixes
made during review. Read the [V32 specification](../build/V32-fury-progression-history.md), primary
[character specification](../character-wizard-spec.md), and Convex reviewer skill. No deployment,
mutation, implementation edit or heavy test run was performed by this reviewer.

## Verdict

**PASS for backend code review after the fixes below.** No unresolved blocking backend finding.
Final whole-slice checks and live browser/headless acceptance remain the lead's integration gate;
this is not a claim of deployed behavior or full-slice completion.

## Findings and remediation

| Severity | Finding | Resolution inspected |
| --- | --- | --- |
| Important | `restore` originally derived its nested submit command ID by truncating the caller's ID to 110 characters. Two distinct valid outer IDs sharing that prefix could reuse a prior submission receipt, leaving the second restored revision without its own submission/activation. | Nested identity now uses `restore-review-${newRevisionId}`. Each immutable new revision has its own submission identity. Regression test uses two distinct 124-character command IDs sharing 120 characters. |
| Important | `listMine.attached` originally equated an effective revision with campaign attachment. V32 introduces effective builds for restored unattached characters, so the list falsely marked these attached. | Attachment now uses `character.campaignId !== null`; standalone restore test checks the list result. |
| Important, found by lead before this review | Restoration initially rejected incomplete historical builds, contrary to the primary spec. | Restore copies the recorded incomplete snapshot into a new draft; it does not submit or activate it, and retains the old effective build/live state. The persisted test exercises this path. |
| Important, found by lead before this review | Invalidating a legacy pending full edit must not rewrite its recorded snapshot. Legacy rows lack `baseEffectiveRevisionId`. | Optional character-level `staleFullEditRevisionId` invalidates the proposal while preserving its revision bytes; submission refuses it. Regression test removes optional metadata to exercise the legacy case and compares the old row unchanged. |

The two reviewer findings were sent directly to the backend author and lead, and fixes were
re-read in the working tree. No backend implementation was changed by the reviewer.

## Check coverage

| Area | Evidence inspected | Assessment |
| --- | --- | --- |
| Authentication and ownership | New queries/mutations use `requireUser`; progression/save/finalize/restore call `owned`; identity comes from authentication, not a caller-supplied user ID. | Pass. Director table authority does not grant another owner's build editing. |
| History authorization/privacy | `requireHistoryReader` permits owner and the current supported Director (campaign owner), including pending admission context; ordinary peers are refused. Snapshot revision must belong to the requested character. History projections contain no independent `authored.notes`. | Pass for existing permission model. Delegated Directors/sharing are not introduced here. |
| Scoped decisions | Server takes the immutable effective base plus bounded canonical new selections. New-choice payload is at most 20 rows/16,000 serialized characters, refuses duplicate/foreign IDs, and regenerates source metadata. Final evaluator completion is mandatory. | Pass. Earlier decisions cannot be smuggled through ungated advancement. |
| Eligibility and timing | Campaign attachment, live record, complete level-one Fury, XP plus fixed entry offset ≥16, final `duringRespite` confirmation, and complete level-two evaluation. Unattached advancement is refused. | Pass within explicitly manual respite timing. Confirmation records context; it grants no XP or restoration. |
| Concurrency | Character revision, exact effective-base ID and advancement-draft version are checked on authoritative mutations. A full-edit approval changing only the effective pointer still invalidates an old advancement base. Convex transactions keep writes atomic. | Pass; covered by stale-save and changed-effective-base tests. |
| Retry behavior | User-scoped command receipts compare operation/argument fingerprints. Retries return the original revision/version without duplicate history/events. Nested restoration now has a unique revision-based identity. | Pass; advancement and restore retries plus long-prefix regression covered. |
| Effective build isolation | Advancement merges only effective selections, preserves an unrelated full-edit draft, marks pending reviews stale and sets the legacy stale marker. Submission and approval recheck the proposal's base when available. | Pass. A newly saved, reviewed full edit remains a separate deliberate operation. |
| Resource reconciliation | `activateRevision` uses shared `previewBuildReconciliation`: retains compatible current amounts, applies downward caps and refuses incompatible resources. Level-up does not reinitialize live state or reset XP/Victories/conditions. | Pass. Tests compare the complete live object, then restore down/up without healing. |
| History immutability | Restore copies selections/status/evaluation/derived baseline from the recorded revision, appends a new chronological revision and records `restoredFromRevisionId`; it does not reevaluate the old snapshot or delete later records. | Pass; byte-equality assertions cover original records and copied evaluation/selections. |
| Full-edit review | Attached complete restoration invokes the existing registered submission operation. Another owner's restoration waits for exact-revision approval; owning Director activation is logged. Incomplete restoration remains draft-only. | Pass. |
| Unattached state | Complete restoration can set the local effective build without creating live resources or campaign attachment. Subsequent complete local edits stay effective; later admission follows normal review/initialization. | Pass; standalone admission regression inspected. |
| XP offset | First admission sets `(entryLevel − 1) ×16`; it is distinct from live campaign XP and remains unchanged during ordinary advancement/restoration. Legacy level-one rows fall back to zero. | Pass for supported levels1–2; the level-two entry test expects offset16 and campaignXP0. |
| Manual XP correction | New `/adjust xp` field reuses the registered Director-only numeric adjustment path: hero-only, nonnegative integer, running-session requirement, attributed journal/event and receipt behavior. | Pass. It changes only XP; no automatic advancement, Victory conversion or healing. |
| Combat locks | Save/finalize/restore call `requireEditable`, which consults both persisted lock and encounter participation. Activation keeps roster locks on initial attachment. | Pass. |
| Query bounds and validators | New public operations declare argument/return validators. History uses `by_character_and_revision`, descending pagination capped at50; progression/snapshot use direct IDs. No new unbounded `collect`, DB-query `filter`, query-time clock use or scheduling. | Pass. Existing complex snapshot responses use `v.any()` inside a curated authenticated projection; this review does not claim stricter serialization schemas. |
| Backward compatibility | Added schema fields are optional; `revisionLevel` falls back to stored baseline or legacy level1; old snapshots are not migrated or rewritten by advancement. | Pass for existing saved level-one rows. |

## Verification evidence boundary

Reviewed `tests/app/character-progression.test.ts`, including persisted readback, owner/Director
separation, stale proposal/base cases, scoped draft reload/versioning, exact snapshot preservation,
incomplete restoration, source timing refusal, standalone behavior, XP correction and command retries.
The backend author runs the focused tests; the lead owns full checks and live evidence. Test execution
results are recorded below without presenting them as reviewer-executed runs.

Backend author reported **25/25 tests passing across four files** at 11:05:51 UTC. The reviewer
read `.playtest/v32-backend-focused.log` and confirmed its 25-test/four-file pass summary. Command:

```sh
pnpm exec vitest run --project app tests/app/character-progression.test.ts tests/app/character-rulings.test.ts tests/app/elementalist-character.test.ts tests/app/table.test.ts --maxWorkers=1
```

Final test additions also explicitly reject an unrelated account's history/snapshot reads, assert
that the second long-command-ID restoration owns the latest pending review, and confirm the
unattached character list flag. These assertions were re-read after the author's update.
`git diff --check` passed during review. No additional code changes were requested after this
final review pass.

## Files reviewed

- `convex/characterTables.ts`
- `convex/characters.ts`
- `convex/lib/characterBuild.ts`
- `convex/lib/characterOperations.ts`
- `convex/lib/characterProgression.ts`
- The narrow XP addition in `convex/lib/tableOperations.ts`
- `tests/app/character-progression.test.ts`
- Supporting existing authentication, command receipts, registry and encounter-lock code.
