# S00: Process tooling, CI, lint and commit checker

| Field | Value |
| --- | --- |
| Family | S |
| Milestone | v0.01 |
| Owner type | App lead |
| Rules review | not required |
| Depends on | None |
| Unblocks | every A slice (soft: A slices may begin before S00 lands, but cannot merge without it) |
| Status | see `STATUS.md` |

## Goal

Make the process in `docs/build/README.md` enforceable: one command that runs every check, a lint
configuration, a commit-message checker that validates `Slice:` and `Spec:` trailers against real
headings, a git hook that runs it, and a CI workflow that runs the same checks on every branch. Keep it
small. This is a hobby project; the gate exists to catch missing spec references and broken builds, not
to add ceremony.

## Spec references

- `docs/build/README.md#commit-format` — the trailer format this slice validates.
- `docs/build/README.md#verification-baseline` — what `pnpm check` must cover.
- `docs/development-process.md#keep-the-process-small` — the constraint on scope.
- `docs/development-process.md#rules-review-workflow-accepted-for-trial` — the review verdicts and the
  "implementer cannot self-attest" rule the checker enforces for `Reviewed-By`.
- `docs/v1-tech-stack-spec.md#9-verification-and-acceptance` — test tooling already chosen.

## In scope

- `scripts/check-commit.ts`: reads a commit message (file path or stdin), validates: type prefix; `Slice:`
  present and matches `STATUS.md` ids or `none`; at least one `Spec:` for `feat`/`fix`/`rules`/`content`;
  each `Spec:` path exists and its anchor resolves to a heading in that file at HEAD (GitHub slug rules);
  `Verified:` present for code commits; `Reviewed-By:` present for code commits; `Rules-Review:` present
  with a value. Exits non-zero with a readable list of failures.
- `scripts/check-links.ts`: validates every relative link and anchor in `docs/**/*.md` and `README.md`,
  `CLAUDE.md`, `agent.MD`. Reused by the audit process.
- A `commit-msg` hook installed by a `pnpm prepare` step (simple-git-hooks or a checked-in hook script;
  no husky is required) that runs `check-commit`.
- ESLint with typescript-eslint, React hooks and Convex plugin rules if available at pinned versions;
  Prettier or ESLint stylistic for formatting with a line width of 100 so the current 300 to 600
  character lines get wrapped. Run the formatter once over `web/`, `convex/`, `shared/`, `scripts/`,
  `src/`, `tests/` in a separate `chore` commit so the reformat is isolated from behavior changes.
- `pnpm check` extended to: lint, `check:engine`, `check:app`, `check-links`, `foes:source`, build.
- Consolidate the engine tests onto Vitest so there is one runner, keeping test behavior identical.
- `.github/workflows/check.yml` running `pnpm install --frozen-lockfile`, submodule checkout without
  `--remote`, and `pnpm check` on push and pull request. Browser tests are not run in CI in this slice.
- A `scripts/check-vendor.ts` guard in `pnpm check` that fails if any path under `vendor/` differs from
  the pinned submodule commit.

## Out of scope

- Branch protection, authenticated overrides, deployment jobs.
- Semantic verification of rules (rules review remains a human-readable verdict, not a script).
- Changing test content beyond runner migration.

## Inputs and dependencies

None. The checkout must pass `pnpm check` before the reformat commit.

## Deliverables

- `scripts/check-commit.ts`, `scripts/check-links.ts`, `scripts/check-vendor.ts`
- `eslint.config.js`, formatter config, hook installation in `package.json`
- `.github/workflows/check.yml`
- `vitest.config.ts` covering `tests/*.test.ts` and `tests/app/**`; `package.json` scripts updated
- `docs/build/README.md` updated with the exact commands if they differ from the plan above

## Acceptance checks

1. A commit message missing `Spec:` on a `feat` commit is rejected by the hook with the reason printed.
2. A `Spec:` anchor that does not exist is rejected, naming the file and the anchor.
3. `pnpm check` passes on a clean checkout and fails when a file under `vendor/` is modified.
4. `pnpm check-links` reports zero broken links after the 2026-09-14 audit.
5. CI workflow passes on the branch.
6. The reformat commit changes no test outcome: `pnpm check` output before and after is recorded in the
   work log.

## Rules research

None.

## Open questions

None.

## Work log

### 2026-09-14 — Plan (implementer: Claude Fable 5.1, worktree `slice/S00`)

Spec sections read in this checkout: `docs/build/README.md#commit-format`,
`docs/build/README.md#verification-baseline`, `docs/development-process.md#keep-the-process-small`,
`docs/development-process.md#rules-review-workflow-accepted-for-trial`,
`docs/v1-tech-stack-spec.md#9-verification-and-acceptance`. No discrepancy between the slice summary
and the cited sections.

Environment note: the worktree's `node_modules` symlink to the main checkout could not be used (pnpm's
pre-run dependency check tried to purge it, and `pnpm add` would have written into the other checkout).
Replaced it with a real `pnpm install --frozen-lockfile` from the store before starting.

Files to add:

- `scripts/check-commit.ts` — commit message validator (file path or stdin). Optional `--merge` flag
  makes `Reviewed-By:` required; without it `Reviewed-By:` is optional because the `commit-msg` hook runs
  before an independent review can exist (see the implementation note added to
  `docs/build/README.md#commit-format`).
- `scripts/check-links.ts` — relative link and anchor validator over `docs/**/*.md`, `README.md`,
  `CLAUDE.md`, `agent.MD`; shares the GitHub slug function with the commit checker via
  `scripts/lib/markdown.ts`.
- `scripts/check-vendor.ts` — fails when a submodule under `vendor/` is not at its pinned commit or
  has working-tree changes.
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.github/workflows/check.yml`.
- `tests/scripts/check-commit.test.ts`, `tests/scripts/check-links.test.ts` — Vitest coverage for the
  validators, with expected outcomes taken from the format rules in `docs/build/README.md`.

Files to change:

- `package.json` — pinned devDependencies (`eslint`, `@eslint/js`, `typescript-eslint`,
  `eslint-plugin-react-hooks`, `@convex-dev/eslint-plugin` if it installs cleanly, `prettier`,
  `simple-git-hooks`, `globals`), `prepare` script, `simple-git-hooks` config, `check` extended to
  `lint`, `check:engine`, `check:app`, `check-links`, `check-vendor`, `foes:source`, `build`; `test`
  and `check:engine` moved from `node --test` to Vitest.
- `vitest.config.ts` — projects for `tests/*.test.ts` (engine, Node environment), `tests/app/**`
  (convex-test) and `tests/scripts/**`.
- `tests/*.test.ts` — `node:test`/`node:assert` imports replaced by Vitest's `test` plus
  `node:assert/strict` (assertions unchanged, so expected values are untouched).
- `tsconfig.json` / `tsconfig.web.json` — include the new scripts and tests for typechecking.
- `docs/build/README.md` — implementation note under *Commit format* and the exact `pnpm check`
  command list under *Verification baseline*.

Dependencies: none real, none stubbed.

Commits planned: (1) `feat(S00)` tooling, (2) `chore(S00)` formatter run over `web/`, `convex/`,
`shared/`, `scripts/`, `src/`, `tests/`, and (3) `docs(S00)` only if `check-links` finds genuinely
broken links.

### 2026-09-14 — Verification and closing entry (implementer: Claude Fable 5.1)

Commits on `slice/S00`, in order:

- `39c769c` `feat(S00): add lint, commit checker, link and vendor guards, CI`
- `7160cbd` `chore(S00): reformat code with Prettier at print width 100`
- `18fed3c` `fix(S00): read the type column when parsing vendor submodule pins` — found while running
  acceptance check 3: `check-vendor.ts` read `git ls-tree` columns one position early, so the
  per-submodule checks were dead code and only the superproject status caught the change. Fixed and
  re-verified with a stray file and with the submodule detached one commit back, then restored with
  `git submodule update` (no `--remote`).
- the `docs(S00)` commit carrying this entry.

Decisions taken within the slice (routine engineering, not product behavior):

- `Reviewed-By:` is optional in the hook and required with `--merge`, because the hook runs before an
  independent review can exist. Documented as an implementation note under
  `docs/build/README.md#commit-format`.
- The commit checker is not part of `pnpm check`; it runs in the `commit-msg` hook and as a CI step
  over the pushed range, so `pnpm check` passes on a clean checkout of any commit regardless of its
  history (acceptance check 3 would otherwise fail on `main`'s pre-S00 commits).
- `@convex-dev/explicit-table-ids` is off: `convex/` uses the one-argument `db.get`/`db.patch` form
  in 37 places; migrating it is code work for a slice that owns `convex/`. `preserve-caught-error`
  (new in ESLint 10) is off, and `@typescript-eslint/no-explicit-any` is off for `src/` only, so the
  historical engine is not edited for lint. Three minimal lint fixes were made in the feat commit
  and listed in its message.
- `simple-git-hooks` installs the hook into the shared `.git/hooks` directory (worktrees share hooks),
  so the hook also fires in the main checkout. Its command is
  `[ ! -f scripts/check-commit.ts ] || node scripts/check-commit.ts "$1"`, so a checkout without the
  checker (main before S00 merges) still commits. The package's own postinstall is denied in
  `pnpm-workspace.yaml`; `pnpm prepare` runs it explicitly.
- `prettier --check` joined `pnpm lint` in the reformat commit rather than the feat commit, so each
  commit passes `pnpm check` on its own.
- Node 24 runs the `.ts` scripts directly; no build step was added for tooling.

Acceptance checks:

1. **Verified.** With the tooling staged, `git commit -F` a `feat(S00)` message with no `Spec:` line.
   Hook output, commit not created:
   ```
   .../COMMIT_EDITMSG: commit message rejected (see docs/build/README.md#commit-format):
     - "feat" commits need at least one "Spec: <path>#<anchor>" trailer naming the owning spec section.
   exit=1
   ```
2. **Verified.** Same with `Spec: docs/build/README.md#commit-formats`:
   ```
   .../COMMIT_EDITMSG: commit message rejected (see docs/build/README.md#commit-format):
     - Spec: no heading resolves to #commit-formats in docs/build/README.md.
   exit=1
   ```
   Unit tests in `tests/scripts/check-commit.test.ts` also cover a missing `Spec:` file, a bad slice
   id, scope/`Slice:` mismatch, `Verified:`/`Reviewed-By:` rules with and without `--merge`,
   `Rules-Review:` values, vendor paths and git comment stripping (16 tests in the `scripts` project).
3. **Verified.** `pnpm check` passes on the clean checkout at every commit (outputs below). With an
   untracked `README.md` written into `vendor/steel-compendium`, `pnpm check` stopped at
   `check-vendor` with exit 1:
   ```
   $ node scripts/check-vendor.ts
   vendor/steel-compendium: working tree differs from the pin:
   ?? README.md
   vendor/ pin changed in this checkout:
   M vendor/steel-compendium
   ```
   (The first two lines appear after the fix commit; before it only the last two lines printed.)
   With the submodule detached at `HEAD~1`: `vendor/steel-compendium: checked out at 34f55d920844 but
   pinned at fb83a789da8f.` The file was removed and the pin restored; `check-vendor` then passed.
4. **Verified.** `pnpm check-links` → `Checked 112 Markdown files: no broken relative links or
   anchors.` The extractor was confirmed against real content (215 links in six sample files, 212
   relative) and against a fixture tree with deliberate breaks in
   `tests/scripts/check-links.test.ts`. No `docs(S00)` link-fix commit was needed.
5. **Not verified locally.** GitHub Actions cannot run here (no `act`, nothing pushed). The workflow
   parses, and its steps (`pnpm install --frozen-lockfile`, `pnpm check`,
   `node scripts/check-commit.ts --range main..HEAD`) were run locally with the outputs recorded here;
   `--range main..HEAD` reported every S00 commit `ok`. The lead should confirm the green run after
   pushing the branch.
6. **Verified.** `pnpm check` before the reformat (at `39c769c`) and after (working tree of
   `7160cbd`), condensed:
   ```
   # before (feat commit)
   $ eslint .
   $ tsc --noEmit && vitest run --project engine
    Test Files  5 passed (5)   Tests  28 passed (28)
   $ tsc -p tsconfig.web.json && vitest run --project app --project scripts
    Test Files  8 passed (8)   Tests  42 passed (42)
   Checked 112 Markdown files: no broken relative links or anchors.
   vendor/ matches the pinned submodule commits (2 submodules).
   Goblin Warrior snapshot matches the clean pinned Compendium.
   ✓ built in 2.24s        exit=0
   # after (reformat)
   $ eslint . && prettier --check .
   All matched files use Prettier code style!
   $ tsc --noEmit && vitest run --project engine
    Test Files  5 passed (5)   Tests  28 passed (28)
   $ tsc -p tsconfig.web.json && vitest run --project app --project scripts
    Test Files  8 passed (8)   Tests  42 passed (42)
   Checked 112 Markdown files: no broken relative links or anchors.
   vendor/ matches the pinned submodule commits (2 submodules).
   Goblin Warrior snapshot matches the clean pinned Compendium.
   ✓ built in 1.76s        exit=0
   ```
   For reference, the pre-S00 baseline on the unmodified checkout ran `node --test` with
   `tests 28 / pass 28 / fail 0` and Vitest app `6 files / 26 tests`; the same 28 engine test names
   pass under Vitest, and the app count is unchanged (the 42 includes the 16 new `scripts` tests).

What works: lint, format check, one Vitest runner for engine/app/scripts, link and vendor guards, the
commit checker in the hook and CI, and `pnpm check` covering all of it. What remains: CI green run
(needs a push), `Reviewed-By:` trailers (added by the lead after independent review; the lead's
pre-merge command is `node scripts/check-commit.ts --merge --range main..slice/S00`), and the
`STATUS.md` row (lead-owned).
