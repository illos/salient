# V93: CI reuse and failure events

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
