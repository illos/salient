# V184: Level-up diagnostics follow the current choices

Rules review: not required (presentation and test path). Depends on: V181.

## Goal

Test-Deploy's V181 capture showed "Needs a selection" and 0% on the perk step after Danger Sense was
chosen. V181 kept the previous evaluation while a new one loads. That is right for the hero panel, but its
diagnostics describe the earlier choices.

## Scope

- `web/progression/level-up.tsx`: decision diagnostics, rail problems/progress and "Take" readiness read
  only the current evaluation. The hero panel, vitals and new-grant list still show the kept one.
- `tests/browser/v32-progression.spec.ts`:
  - The perk step asserts no missing-selection notice and one completed step.
  - Compendium readback resolves `content.sourcePath` with `vendorPath`, since worktrees and copies have an
    empty `vendor/` (V118).

## Acceptance checks

1. Test-Deploy capture: v164-step-perk.png shows no "Needs a selection" and a completed perk step.
2. Gate.

## Publication: 2026-09-25

The test and deploy thread fast-forwarded reviewed `887f448` into main and published the backend/frontend
using the DEPLOY2 hosted procedure. Worker: `5a9f67c6-9c3e-4270-8f6d-e739420dc105`. Content is unchanged, so no reseed was needed. Temporary credentials were
removed and the private hosted helpers stopped. Release logs: `/srv/presidium/projects/salient/test-artifacts/V184-release-887f448`.
