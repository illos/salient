# V103 — Null level one

## Goal

Complete Null level-one creation and shared table actions, using the pinned Compendium.

## Scope

All three traditions and their skill choices, three augmentations, all eight signature choices
(pick two), four 3-Discipline and four 5-Discipline choices. Null grants no kit. Source:
`en/unified/md/class/null.md`, `feature/null/level-1`, `feature/ability/null/level-1` in the pinned
Compendium. Static speed, augmentation statistics and psionic rolled-damage bonuses are derived.
Discipline Mastery thresholds retain their benefits through the user's turn; their timing, surge
triggers, spatial effects and field lifecycle remain explicit manual effects. No higher levels.

## Acceptance checks

Independent source ledger covering every choice, all traditions and augmentations; exact statistics,
skills, source costs, damage and conditional grants. Shared authenticated creation/admission,
authorization, pruning, every granted action use and persisted readback; applied/resisted compiled
conditions and manual remainder. TESTER owns generators, full gate and isolated Null cohort.
Independent ENGINE review then DEPLOY2 publication reusing acceptance.

## Work log

- Started from main `0919e70`. ENGINE assigned pinned source audit. No tests run yet.
- Independent source audit persisted in [audit](audits/V103-null-source-audit.md). ENGINE found no
  authoring blockers at `aa498a1`; final proof review pending.
- TESTER generated 1436 content entries and reports (all three commands exit 0) at `aa498a1`;
  artifacts `/srv/presidium/projects/salient/test-artifacts/V103-aa498a1-generation`.
- Source oracle: `tests/fixtures/v103-null-expected.json`, four Human Soldier builds covering all
  eight signatures, all eight heroic choices, three traditions/augmentations/arrays. No evaluator
  output used. Every rolled action names its source path and independent tier damage; embedded
  action costs are the four printed 1-Discipline options. The ordinary free-strike oracle protects
  Force's Psionic-only restriction. Manual fixed damage is not automatically modified.
- `scripts/headless/null.ts` invokes every one of 18 source envelopes and 21 embedded actions.
  It reads saved builds, edits/pruning without changing admitted builds, resource debit/block/waiver,
  damage and manual state back. Pressure Points has both resisted A2 and applied A−1 paths with
  condition source/save registration; its pure check covers below/equal each strict threshold.
  Phase Inversion's prerequisite prevents compiled admission; its teleport/push stays manual.
- Authoring: both TypeScript projects and touched ESLint passed. Focused evaluator/report files:
  11 passing tests. Found and repaired empty skill options shadowing their source pools.
  Full/live acceptance has not yet run.
- ENGINE final static PASS `17c0776`, recorded in [rules review](audits/V103-null-rules-review.md).
  No blocking findings; reviewer ran no tests.
- TESTER job `test-V103-17c0776-2`: `CI=true pnpm check` exit 0 / 197s,
  **993 tests (391 engine + 602 app/scripts)** with all content/report/link/vendor/build gates.
  Isolated `SALIENT_HEADLESS_COHORT=null node scripts/verify-character-headless.ts` exit 0 / 56.7s:
  four builds and 39 distinct Null actions, plus ordinary free-strike Force exclusion.
  Persisted applied/resisted Pressure Points, source-linked save registration, source costs and
  manual target/actor state checks passed. Backend stopped, ports free, data retained, checkout clean.
  Artifacts: `/srv/presidium/projects/salient/test-artifacts/V103-17c0776`.
- Accepted runtime remains `17c0776`; closeout adds review/evidence only. Ready for DEPLOY2 to
  integrate and publish, reusing accepted results. No repeat suite, smoke or live checks requested.

## Publication — 2026-09-21

DEPLOY2 fast-forwarded reviewed `983bcfa` into main and published the backend, 1436-entry content
snapshot and frontend. Backend/schema validation, hosted build and upload succeeded. Worker:
`7d57b840-f22b-4dd3-bb6b-859147f92f71`. Accepted 993-test gate and isolated four-build/39-action
results were reused; no smoke test or test rerun. Release logs:
`/srv/presidium/projects/salient/test-artifacts/V103-release-983bcfa`.
