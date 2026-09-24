# V169: Rapid Processing's extra respite activity

Rules review: required. Depends on: V166, V167 (stacked on `slice/V167`).

## Goal

A Chronokinetic Null with Rapid Processing can take the additional respite activity the feature grants.
V166 refused any second activity.

## Source

- `rule/resource/respite.md`: "You can also undertake one respite activity, such as making a project
  roll … or changing your kit".
- `feature/null/level-2/rapid-processing.md`: "Additionally, during any respite, you can take an
  additional respite activity."
- No other Compendium feature, perk or treasure grants an additional respite activity (searched for
  "respite activit" across `feature/`, `perk/`, `treasure/`). Inspired Artisan adds a second project
  roll within one activity, which stays manual.

## Scope

- `shared/evaluate/respiteActivities.ts`: allowance is 1 plus one per additional-activity feature in the
  hero's current build, read when the activity is recorded. A level-up taken during the respite counts.
- `respite.activity` and `respite.change-kit` accept activities up to the allowance. The first is still
  `activity`; later ones are stored in `moreActivities`. A second kit change still makes Cancel revert
  to the build from before the respite.
- Complete names heroes who used none ("No respite activity used") and heroes with some left
  ("Respite activities left unused: name (n)").
- `table:roster` and `sessions:get` return every activity and the unused count. The table card lists
  them and offers the controls while any activity is left.

## Acceptance checks

1. `tests/app/respite.test.ts`: the v103-1 Chronokinetic witness, levelled to 2 through the shared
   level-up path with its ledger choices, records two activities. A third is refused, and Thorn still
   gets exactly one. Roster and stored readback are checked.
2. Test-Deploy: gate, then the `respite` and `level-up` journeys.

## Work log

- Built on `slice/V169`, `.worktrees/respite-extra`, stacked on V167. Author checks: lint, both
  TypeScript projects, respite app tests (14/14).
