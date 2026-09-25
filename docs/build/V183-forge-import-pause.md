# V183: Pause Forge Steel import

Rules review: not required (documentation of a user ruling).

## Goal

Record the user's 2026-09-25 ruling: Forge Steel import is not part of V1 and waits until the character
wizard is level-complete for all classes.

## Scope

- `docs/character-wizard-spec.md#required-import` and the scope paragraph: the ruling, superseding "Import
  remains a v1 requirement".
- `docs/v1-roadmap.md`: Forge Steel import removed from the V1 release criteria.
- `docs/rules-questions-for-user.md`: Q-V-3 to Q-V-6 deferred.
- `docs/build/STATUS.md`: V182 paused. Its branch `slice/V182` (review PASS, `a0ee7dcd`) is parked, not
  merged. V09 part a stays on main.

## Acceptance checks

1. Docs only; Test-Deploy gate (commit and format checks).
