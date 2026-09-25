# V181: Dependent choices stay with their parent on the level-up screen

Rules review: not required (presentation). Depends on: V164 (stacked on `slice/V164`).

## Goal

The V164 capture showed a level-2 perk's target ("Area of Expertise: choose an owned crafting skill") as
its own rail step, "Target", after the ability step. A choice that depends on another of the same level's
choices now appears on its parent's step, directly under it, as the wizard shows it.

## Scope

- `web/progression/level-up.tsx`: rail steps group each available new choice under its root parent, found
  through `availableWhen`, `conditions`, `dependsOn` or `dependsOnAny` within this level's choices.
  Rail counts and problems cover the whole group.

## Acceptance checks

1. `tests/browser/v32-progression.spec.ts` (unchanged): the perk step shows the target select after
   Area of Expertise is chosen, and the rail has three steps (perk, ability, review).
2. Test-Deploy: the capture, then the gate.

## Work log

- Built on `slice/V181`, `.worktrees/level-up-steps`, from `slice/V164`. Author checks: TypeScript,
  ESLint, Prettier.
- Independent review PASS (2026-09-24): no independent level 2–3 choices merge (the only same-level link, Conduit domain abilities, is automatic).
- Test-Deploy capture (train 12): all five screens, but the perk screenshot caught the hero panel "Pending" while the new evaluation loaded; the level-up screen now keeps the last result meanwhile, and the spec waits for the evaluated panel. The spec's live-state check still expected Stamina 20; it now carries damage and Recoveries spent (Q-CHAR-2 revised: 29/39).
