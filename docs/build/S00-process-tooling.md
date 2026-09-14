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

_Empty._
