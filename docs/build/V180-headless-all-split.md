# V180: Split the headless `all` cohort again

Rules review: not required (test orchestration only). Depends on: V163 (the `lifecycle` split).

## Goal

After V167/V169 the `all` cohort took 240 s, exactly the runner's deadline. Move self-contained scenarios out
of `all` into cohorts, so every scenario still runs but no single cohort nears the limit.

## Scope

- `scripts/headless/character-scenarios.ts`: `runScenarios` no longer runs the remaining ancestries,
  culture presets, complication actions, starting rewards or starting items.
- `scripts/verify-character-headless.ts`: a new `ancestries` cohort. The others already existed:
  `culture`, `complication-choices`, `complication-table`, `starting-rewards`, `starting-items`.
- No scenario or assertion changes.

## Acceptance checks

1. Test-Deploy: `all` finishes well under 240 s. `ancestries`, `culture`, `complication-choices`,
   `complication-table`, `starting-rewards` and `starting-items` pass as their own cohorts. A full
   release now runs these alongside `all`.

## Work log

- Built on `slice/V180`, `.worktrees/headless-split`. Author checks: TypeScript, ESLint, Prettier.
