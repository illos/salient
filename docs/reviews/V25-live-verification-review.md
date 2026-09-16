# V25 live-verification repair: independent implementation review

Reviewer: `v25_live_review`, 2026-09-16. Reviewed the uncommitted repair on
`slice/V25-live`, based on `663b49f`, in `characters-build`. The reviewer did not
implement the repair and changed only this review document.

## Verdict

**Pass for the narrowly scoped repair.** No blocking findings. This verdict covers
`scripts/app.ts`, `tests/scripts/app-output.test.ts`, and
`tests/browser/table-audit.spec.ts`; it does not independently certify completion
of the shared playable-environment verification. The integrating lead owns the
remaining full check and live journeys.

No new rules review is required: these changes route CLI diagnostics and verify
content identity. They change no game mechanic, source content, character grant,
backend function, schema, or authorization policy. The existing V25 rules review
continues to cover the delivered character features.

## Specifications read

- [Build review standard](../build/README.md#review-standard),
  [verification baseline](../build/README.md#verification-baseline), and
  [playable-app merge completion](../build/README.md#merge-completion-includes-the-playable-app).
- [V25 acceptance checks](../build/V25-two-class-wizard.md#acceptance-checks),
  especially persisted headless/browser parity and verification.
- [Table command requirements](../table-command-spec.md#confirmed-requirements)
  and [scope and authority](../table-command-spec.md#scope-and-authority).
- Project instructions in `agent.MD` and `CLAUDE.md`.

## Repair acceptance

| Check | Result | Evidence |
| --- | --- | --- |
| Successful CLI results remain machine-readable when Convex includes diagnostics | Verified | Ran the real CLI subprocess regression against its local mock HTTP server. Exact parsed stdout matches the response value; diagnostic text is present on stderr. |
| Diagnostics remain available and operations retain their existing execution path | Verified | Inspected all four logger methods and unchanged result/error/authentication handling. The installed Convex 1.45.0 client accepts this logger contract; both query and mutation response paths pass `logLines` through it. |
| Browser audit checks the active pinned content snapshot | Verified by inspection | Expected count and revision now come from the checked-in manifest, with a new content-hash assertion. Current manifest has 467 entries. The test still checks the live `content:status` result, so it rejects a stale deployed snapshot. |
| Complete shared runtime browser journeys and full repository check | Not independently verified in this review | Lead was running these checks concurrently. Their final successful results must be recorded before shared-runtime closeout. |

## Validation and findings

`pnpm exec vitest run --project scripts tests/scripts/app-output.test.ts`:
**one test passed**, 561 ms total (385 ms test). An earlier attempt reached the
30-second timeout during severe host load; the unchanged rerun passed. The timeout
is retained here as an environmental limitation, not omitted or treated as a
functional failure.

Inspected the installed Convex client's logging implementation rather than
assuming that a server `[WARN]` message uses `console.warn`: its successful
function-response diagnostics actually call `logger.log`, which explains the
original stdout contamination. Mapping every logger method to `console.error`
preserves diagnostic output while leaving the final JSON as stdout's sole result.

Read the lead's earlier shared-run failure in
`.playtest/v25-live/browser-final.log` in the main checkout: Fury's extended
headless table journey failed at `JSON.parse(output.stdout)`. The same run
recorded the Elementalist browser journey passing. Inspected the persisted
readback summary reporting both characters complete, matching their independent
baseline fixtures, with exact pinned source for 30 Elementalist and 17 Fury
grants. Those are lead-produced evidence records, not independently rerun live
checks by this reviewer.

No application or runtime data was changed by the reviewer. No remaining code
defect was identified in the scoped diff. Full V25 acceptance remains documented
in its original implementation and rules reviews; this repair does not reopen
or repeat those mechanical audits.
