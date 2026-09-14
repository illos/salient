Independent CI history review: pass (2026-09-14)

Reviewed actual isolated worktree diff in scripts/check-commit.ts, tests/scripts/check-commit.test.ts and docs/build/README.md against the commit-format contract and adoption history. The fixed full-hash ancestor exclusion affects --range only; adoption and later/nonhistorical commits remain subject to existing validation. Hooks and --rev remain strict, and absent boundary history makes git fail rather than silently skip enforcement. No blocking findings. No gameplay/rules changes.

Verified independently: node node_modules/vitest/vitest.mjs run --project scripts tests/scripts/check-commit.test.ts (14 tests passed); node scripts/check-commit.ts --range 821426b..629ca0f (44 post-adoption commits accepted, 2 pre-adoption commits excluded); git diff --check (passed). Regression exercises actual CLI on disposable borrowed-object Git history, explicitly checks adoption, rejects legacy explicit --rev, and rejects a future malformed commit deleting the contract file.

Scope: review does not claim GitHub workflow execution; root is monitoring hosted CI. No shared-workspace files changed.
