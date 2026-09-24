# V118: Vendor path resolver for worktrees

Rules review: not required. Depends on: None.

## Goal

Worktrees keep `vendor/*` empty under the [one-copy rule](../steel-compendium.md#one-copy-on-presidium-2026-09-24).
Scripts and tests that read `vendor/steel-compendium` or `vendor/forge-steel` relative to their own
checkout must read the main checkout's single copy instead, so `pnpm check` passes in a worktree
again. No rules, content or generated output change.

## Scope

- `scripts/lib/vendor.ts` resolves the readable copy of each source. It uses this checkout's
  `vendor/<name>` when populated (main, GitHub CI, CT114); otherwise `$SALIENT_VENDOR_ROOT/<name>`
  when set (for copies without Git metadata, such as headless `/tmp` trees); otherwise the main
  working tree found through `git rev-parse --git-common-dir`. Citations keep repo-relative
  `vendor/<name>/…` paths; only file-system and `git -C` access go through `vendorDir`/`vendorPath`.
- `readPinnedTree` reads a subtree at the pin from Git objects. The foe ingest needs
  `en/books/monsters`, which main's sparse copy omits; the sparse set must not change, so the ingest
  now reads Git blobs, as `ingest-rules` and `tests/helpers/pinned-source.ts` already did.
- `check-vendor` validates the resolved copy against this checkout's pin; `check-links` resolves
  links into `vendor/*` against the resolved copy.
- Every script and test that touched `vendor/*` on disk uses the resolver: the content, rules and
  foe ingests, supporting inventory, character-source inspection, glyph/presentation audits, the
  Forge build (CT114), headless helpers and 20 test files.

## Acceptance checks

1. `env -u CONVEX_DEPLOY_KEY CI=true VITEST_MAX_WORKERS=3 pnpm check` exits 0 in a worktree whose
   `vendor/*` directories are empty.
2. `node scripts/check-vendor.ts` in that worktree reports both submodules at their pins.
3. `pnpm content:check`, `foes:check`, `rules:ingest` and `compiled:check` report no generated
   differences.

## Work log

- 2026-09-24: worktree `.worktrees/vendor-paths`, branch `slice/V118` from `d424b00`. The user asked
  Test-support (878b24ca) for the fix after the single-copy cleanup (3d1f8d0, d424b00) broke worktree
  checks.
- Before the fix, running each step in the worktree failed the engine tests (20 files),
  app/scripts tests, `check-links` (1,584 broken vendor links), `check-vendor`, `rules:ingest` (`git
  -C` on the empty directory fell through to the worktree repo: "not a tree object") and `foes:check`.
- After the fix: `pnpm check` exit 0 in the worktree; engine 407/407 tests, app+scripts 652/652,
  464 Markdown files with no broken links, vendor at pins (2 submodules), foes 438 stat blocks
  verified, web build passes. Log: `/tmp/v118/pnpm-check.log`.
