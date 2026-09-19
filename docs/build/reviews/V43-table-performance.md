# V43 independent review

Reviewer: `v43_review`, 2026-09-19. Fresh-context review of the uncommitted V43 diff on
`slice/V43` above `5f55f34`; V41 is separately reviewed. No product code changed by this reviewer.

Verdict: **pass for premerge implementation review**, with no blocking findings. The unchanged
wizard rerun and final table browser rerun passed. Integration and shared-runtime verification
remain lead-owned completion gates; this verdict does not declare the merge complete.

## Specifications read

- [Incremental table loading](../../table-spec.md#incremental-table-loading--2026-09-19)
- [Party sheets and resource visibility](../../table-spec.md#party-sheets-and-resource-visibility)
- [Undo permissions](../../table-spec.md#undo-permissions-and-proposed-campaign-control)
- [Encounter actions and undo](../../data-architecture-spec.md#5-encounter-actions-and-undo)

Also read `agent.MD`, `CLAUDE.md`, the build review standard, the V43 slice, and the existing
authoritative history walker, correction windows, event writer and archive operations. Applied the
Convex reviewer skill for authentication, indexed access, bounded reads and function validators.
No game mechanics changed; independent rules review is not required.

## Acceptance checks

| Check | Status | Evidence |
| --- | --- | --- |
| 1. Compact roster and privacy | Verified | Audience regression covers Director, owner/player, observer and outsider; foe source remains detail-only, peer hero facts expose only allowed maxima. Browser trace has no initial `foes:detail` or `characters:sheet` subscriptions for collapsed cards. Screenshot preserves visible values. |
| 2. Progressive reads and existing table behavior | Verified | Initial `events:list`, `history:status`, `table:roster` and encounter subscriptions start together before the roster response. Real browser test drills into both kinds of sheet, switches log tabs without navigation and reads persisted adjusted Stamina after reload. Journey and navigation cases passed in the first browser batch. |
| 3. Visible-page ability results | Verified | Visible event IDs drive the query; empty pages skip it. Tests request older results beyond the former newest-100 window, deduplicate IDs, enforce the 50-ID limit and prevent cross-campaign disclosure. Existing correction/result privacy tests pass using the new reader. Result identity and historical actor alias handling are preserved. |
| 4. Derived history parity and bounded catch-up | Verified | New tests compare windows against the original walker for all roles, engine consequences, manual continuations, undo/redo, branching and turn boundaries. A 300-plus-event legacy fixture catches up in 64-event batches while accepting gameplay and retaining source events. The fifth test exercises real combat archive operations, later encounters and legacy reconstruction. Existing history and lifecycle regressions pass. |
| 5. Checks and browser evidence | Verified for implementation | Full `pnpm check` passed 274 engine and 406 app/scripts tests plus lint, types, links, content/vendor and build. The later fifth lifecycle test passed in a focused five-test run. Three browser cases passed initially; the unchanged standalone wizard rerun passed after a registration refusal in the first batch. The final history-preparation refinement passed targeted lint/format/web types (lead-reported exit 0) and the table browser rerun (retained log, 33.7 s). The entire full check was not rerun for that narrow frontend refinement. |
| 6. Commit, merge and shared runtime | Not verified at premerge review | No V43 commit or integration existed at review start. The lead must validate commit metadata, integrate current main, update the established shared environment without reset and record the actual HTTPS persisted readback before reporting merge completion. |

## Findings and limits

No blocking correctness or privacy finding in the reviewed diff.

Nonblocking operational limitation at `convex/lib/historyIndex.ts:95`: `scheduled` records that a
catch-up mutation was queued, not its eventual terminal status. Application or read-limit failures
can leave history controls preparing even after another successful `history.prepare`. Convex retries
internal/transient mutation errors automatically; application failures require diagnosis. After fixing
the underlying cause, an operator can invoke `internal.history.backfill` for that session to resume
from the saved cursor and schedule remaining bounded batches. The evidence record documents this
recovery. No such failure was observed. See [Convex scheduling guarantees](https://docs.convex.dev/scheduling/scheduled-functions)
and [error categories](https://docs.convex.dev/functions/error-handling/).

The backend still reads full existing hero/foe documents to construct the small roster projection.
Authoritative undo/correction mutations intentionally retain full-session history validation.
Neither backend entity storage nor mutation replay has been made constant-cost by this slice.
The implementer also reports one `history:status` execution warning at 979.272 ms against a 1 s
threshold during the wizard retry; the browser passed, but timeout risk is not claimed eliminated.

## Evidence inspected

- [Full check output](../evidence/V43/check.log): 680 passing tests before the additional lifecycle test.
- [Five focused tests](../evidence/V43/floors.log): includes the added real archive/catch-up parity case.
- [WebSocket trace](../evidence/V43/subscriptions.json): six foes and one hero, 3,454-byte initial
  roster value; the 101,212-byte hero sheet appears only after drill-in. Trace duplicates are retained.
- [Actual table screenshot](../evidence/V43/table-summary.png): visible hero Stamina 30/30,
  Recoveries 10/10 and foe Stamina 15/15 with level/role labels.
- [First browser batch](../evidence/V43/browser-first.log): journey, table and navigation passed;
  wizard stopped during registration before its changed-feature work.
- [Unchanged wizard retry](../evidence/V43/fury-retry.log): passed, including its audience,
  admission and 60-action acceptance extension.
- [Registration failure context](../evidence/V43/rate-limit-context.md): directly confirms the
  account endpoint's rate-limit alert before wizard execution.
- [Final table browser rerun](../evidence/V43/table-final.log): passed after the final preparation
  gating and stale-error guard; reviewed those final lines in `web/table/log.tsx`.
- [Implementation evidence and limits](../evidence/V43/README.md).

The reviewer inspected implementation, tests, retained logs, trace and screenshot; the reviewer did
not independently rerun the remote suites while the implementer occupied CT114. This is functional
and payload/subscription evidence, not a claim of improved hosted latency. Shared-main rollout is
not established by the isolated-environment results.
