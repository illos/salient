# V210: Director build-review count

Rules review: not required. Depends on: none.

## Goal

Show the Director when a character admission or full edit awaits review from the campaign page.

## Scope

- Show a pending build-review count beside Join requests in the Players heading. The count opens
  Manage players at Hero admissions.
- Reuse the existing campaign-scoped review query and count only `pending` reviews, so decisions and
  withdrawals update the indicator through Convex subscriptions.
- Spec: `docs/character-wizard-spec.md#7-revision-and-review-lifecycle`.

## Acceptance checks

1. On the Director's campaign page, a pending admission or full edit appears in the Build reviews
   count. A stale, approved, declined or withdrawn review does not. The same count leads to the
   Hero admissions section in Manage players.
2. The existing `characters.reviews` CLI/API route lists a submitted review for the Director;
   after a decision, readback omits it and the count falls through the subscribed query.
3. `pnpm lint` and `pnpm exec tsc -p tsconfig.web.json` pass; TESTER runs the project gate.

## Work log

- 2026-09-25: Started on `slice/V210` in `code/.worktrees/build-review-count` from main `3ffd772`.
- 2026-09-25: Local `pnpm lint` and `pnpm exec tsc -p tsconfig.web.json` passed (exit 0).
- 2026-09-25: QC design/code PASS on `2bcd16ed`; reviewed tip `6c4c566c` has the same tree.
  TESTER's `CI=true VITEST_MAX_WORKERS=3 pnpm check` passed (exit 0): 458 engine and 979 app/script
  tests, source checks and web build. A focused non-table browser run passed (1/1): the Director's
  count changed 0 → 1 → 0 around an admission and approval; the button opened Hero admissions;
  `characters.reviews` CLI readback confirmed both states. Evidence is outside the repository in
  `test-artifacts/V210-6c4c566c/`.
- 2026-09-25: Fast-forward merged and pushed on main as `6c4c566c`. The hosted frontend build
  and Cloudflare upload succeeded for Worker `0c91bf9c-1fe2-423b-a076-97b50722b997`.
  Backend and content were unchanged, so neither was redeployed or reseeded.
