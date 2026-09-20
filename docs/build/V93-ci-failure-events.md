# V93: CI reuse and failure events

**Rules review:** not applicable (CI infrastructure). **Depends on:** none.

## Goal

Reuse TESTER's passing gate when promoting main and deliver failures through events instead of
agent polling.

## Scope

The full GitHub check becomes an explicit fallback that TESTER can dispatch when a GitHub runner
is needed. Pushes and pull requests do not repeat the locally completed gate. Failure events must
include the failing run and commit and reach a durable notification destination.

## Acceptance checks

- Promotion does not start another full suite; TESTER remains the required gate.
- A completed failed workflow produces a notification; successful runs remain quiet.
- Verify real event delivery with a bounded probe, without rerunning the application suite.

## Work log

- 2026-09-20: user request relayed by TESTER1139. Branch `slice/V93`, worktree `.worktrees/ci-events`,
  base `c56f6fb`. Repository webhook administration is denied by the current token; evaluating
  GitHub's native `workflow_run` event as the delivery trigger.
- Selected destination: a GitHub issue assigned to and mentioning repository owner `illos`.
  This is a durable GitHub notification, not a T3 wake. Email/inbox delivery depends on the user's
  GitHub notification settings; the current token cannot inspect that inbox.
- The notifier runs trusted default-branch code with read-only contents and issue-write permissions,
  validates run identity, and deduplicates retries by run/attempt. A manual one-step probe can fail
  intentionally without executing the application suite.
- References: [workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
  [workflow security](https://docs.github.com/en/actions/reference/security/secure-use).

- TESTER1145: focused notifier 6/6 and workflow YAML/security wiring passed on `eafbbf9`.
- Review1146 fixes: manual fallback executes notifier regression tests; commit checking uses
  `HEAD^..HEAD` on main and the build guide distinguishes local/promotion/manual gates.

- Independent WIZARD review1149 passed; TESTER1150 passed the followup YAML, shell/range and
  documentation checks, reusing the unchanged 6/6 notifier result. Merged and pushed `a5a23ec`.
- TESTER1153 verified real event delivery with one bounded evidence capture:
  [intentional failure](https://github.com/illos/salient/actions/runs/35543366336) produced
  [issue #1](https://github.com/illos/salient/issues/1), assigned to and mentioning `illos`;
  [successful probe](https://github.com/illos/salient/actions/runs/35543367443) skipped notification
  and created no issue. No full check started. Evidence retained at
  `/srv/presidium/projects/salient/test-artifacts/V93-a5a23ec-delivery`.
- Probe issue cleanup returned HTTP403 (`Resource not accessible by personal access token`).
  The clearly labeled delivery-probe issue remains open; delivery itself passed. Email/inbox
  receipt and T3 wake are not claimed. No cloud runtime deployment was needed.

- TESTER1160 caught seven CommonJS lint errors during V75 integration. Added a scoped Node
  CommonJS override for `.github/scripts/*.cjs`; application lint rules remain unchanged.
- WIZARD1166 review passed. TESTER1167: `CI=true pnpm lint` passed (16.9s) on `ac29a43`,
  covering repository ESLint and Prettier. Evidence: `test-artifacts/V93-ac29a43`.
