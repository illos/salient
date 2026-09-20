# V59 — Closeout browser timeout investigation

Status: bounded investigation complete; original intermittent timeout unresolved. Primary track: shared runtime blocker.
Branch/worktree: `slice/V59`, `.worktrees/astra-closeout`, based on main
`6459c8dc490c444d4a77a5d819dddda6881fa78c`. Rules review: not required; no game rule changes.

Scope: identify the backend function behind V58's closeout browser failure, run one focused
reproduction on unchanged main, and fix only an evidenced narrow defect. The user authorized
independent ancestry development while verification is queued. No timeout increases, assertion
removal, rate-limit bypass, speculative runtime rewrite, or Opus inputs.

## Findings

The retained Playwright trace identifies `targets:drafts`, request `e231309d25ba30ca`, as the
query that exceeded the backend's one-second execution limit. The React `TablePage` error boundary
then replaced the table with “This page is unavailable”. The closeout test subsequently exhausted
its separate 15-second assertion waiting for the Combat closeout heading.

Retained backend logs independently confirm `targets:drafts` at 2026-09-19 23:54:47 UTC, and also
record `foes:catalog` exceeding the same limit at 23:55:43. This identifies the failed query, not
its internal cause. It does not establish a defect in the closeout mutation or ancestry evaluator.

Static inspection: `targets:drafts` authenticates the user, checks membership/session, then reads
at most 100 indexed campaign targeting drafts and fetches names for other users with selections.
`requireUser`, membership and session reads are indexed/direct reads. The test uses three users
and two heroes. No unbounded closeout-specific hot loop was identified on this read path.
The implicated query, access helpers, registry, foe catalog, browser test and Compose config are
unchanged between main and Polder candidate `2291b29` (`git diff` empty). Transitive runtime cost
and resource scheduling remain unproven; unchanged source alone does not rule out a regression.

## Verification value

Reuses `tests/browser/closeout.spec.ts`; adds no test. Its existing assertions catch an unavailable
real table, missing shared closeout for Director/player/observer, incorrect award persistence,
cleanup errors and paused-session Void behavior. A mock that merely expects the same query calls
would not catch this backend timeout and was deliberately not added.

## Commands and evidence

All server, dependency and browser work runs on CT114 through `presidium-dev`, environment
`character-restart`; shared main and abandoned `characters` were untouched. Preserved the original
trace in `/srv/presidium/projects/salient/character-restart-evidence/v58-paused-evidence.tar.gz`
and captured backend logs before replacing source. Evidence is in [evidence/V59](evidence/V59).

- `presidium-dev --env character-restart logs backend`: [retained log](evidence/V59/retained-backend.log).
- Trace JSON extraction: [original error](evidence/V59/original-error.json).
- `presidium-dev --env character-restart --replace up`: [startup log](evidence/V59/startup.log)
  and [actual exit](evidence/V59/startup.exit), source main `6459c8d` plus evidence-only files.
- `presidium-dev --env character-restart run browser -- pnpm exec playwright test tests/browser/closeout.spec.ts --workers=1 --output=/artifacts/v59/closeout --reporter=line`:
  [focused log](evidence/V59/main-closeout.log) and [actual exit](evidence/V59/main-closeout.exit):
  **1 passed (1.3m), exit 0**, unchanged main. [Backend log](evidence/V59/main-backend.log)
  contains no function timeout during this focused run.

Chords calls reported ambiguous provider-session mapping; coordination stayed with the lead,
without inventing sender identity. The lead owns `STATUS.md` and the remaining verification queue.

## Handoff

No code fix is claimed: this one focused reproduction did not reproduce the failure, and the
bounded static investigation did not establish a narrow defect. No additional tests were added,
no limits changed, and no full suite was blindly retried. No commits or merges were made.

Main closeout screenshots and browser artifacts were retained outside the replaceable remote
source at `/srv/presidium/projects/salient/character-restart-evidence/v59-main-closeout-evidence.tar.gz`;
[package log](evidence/V59/package.log), [package exit](evidence/V59/package.exit) and
[fetch exit](evidence/V59/fetch.exit) record capture. The environment remains running on main
`6459c8d`, data retained, with no test job left active; runtime ownership returns to the lead.

The original V58 full browser failure remains unresolved, despite this isolated main pass.
Queue full browser verification on the next ancestry integration candidate. If this recurs,
retain the precise function/request and trace again; the next bounded investigation should compare
runtime resource/isolate scheduling and common authenticated query cost for the failing interval.
Do not treat that hypothesis as a measured cause. Independent ancestry development continues.

Committed text logs trim trailing whitespace only; original bytes are retained outside Git in
`/srv/presidium/projects/salient/character-restart-evidence/v59-raw-logs`.
