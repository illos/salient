# S00 CI history repair and hosted verification

Independent CI history review: pass (2026-09-14)

Reviewed actual isolated worktree diff in scripts/check-commit.ts, tests/scripts/check-commit.test.ts and docs/build/README.md against the commit-format contract and adoption history. The fixed full-hash ancestor exclusion affects --range only; adoption and later/nonhistorical commits remain subject to existing validation. Hooks and --rev remain strict, and absent boundary history makes git fail rather than silently skip enforcement. No blocking findings. No gameplay/rules changes.

Verified independently: node node_modules/vitest/vitest.mjs run --project scripts tests/scripts/check-commit.test.ts (14 tests passed); node scripts/check-commit.ts --range 821426b..629ca0f (44 post-adoption commits accepted, 2 pre-adoption commits excluded); git diff --check (passed). Regression exercises actual CLI on disposable borrowed-object Git history, explicitly checks adoption, rejects legacy explicit --rev, and rejects a future malformed commit deleting the contract file.

Scope: review does not claim GitHub workflow execution; root is monitoring hosted CI. No shared-workspace files changed.

## Hosted verification

The [first hosted run](https://github.com/illos/salient/actions/runs/34905068785) on `629ca0f`
passed `pnpm check`, then failed because two old mockup commits predated the commit-format contract.
The reviewed repair is `3d3bcb6`. Its [GitHub run](https://github.com/illos/salient/actions/runs/34905450764)
passed every step: fresh install, full `pnpm check` and commit-range validation. This closes S00's
previously unexercised workflow item. The additional regression brings the suite to 266 tests.

The repair was developed in an isolated checkout, then fast-forwarded onto the shared branch while
preserving the active builder's A02/A04 claim. No active app implementation, local backend state or
vendored source was changed by this CI follow-up. Local browser/visual results for the application
remain in the [repair verification](2026-09-14-fix-verification.md); GitHub does not run the browser
suite against the local deployment.
