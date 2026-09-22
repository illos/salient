# V111: Current V1 release target

Rules review: not required. Depends on: None.

## Goal

Make the user's 2026-09-22 V1 target durable and discoverable by other agents.

## Scope

Record the target in `docs/v1-roadmap.md#current-v1-release-target--confirmed-2026-09-22`.
Link it from AGENTS.md and the older specification checkpoint. Preserve open decisions about
level two versus three, the selected foe roster, manual exceptions and the app release checklist.

## Acceptance checks

1. Read the changed documents against the conversation: all classes, near-full low-level automation,
   useful low-level foes without complete bands, and most app features working/tested are present.
2. Verify local link targets and `git diff --check`; no application tests for this documentation change.

## Work log

- Created `.worktrees/v1-target`, branch `slice/V111`, from main `30ecc71`.
- Recorded the confirmed direction and distinguished the proposed level-three ceiling from the
  user's still-open level-two/three choice. No rules or runtime behavior changed.
- Documentation readback, local link-target/heading checks and `git diff --check` passed.
  Documentation only; no tests run. Sent to DEPLOY2 for independent scope review and integration.
