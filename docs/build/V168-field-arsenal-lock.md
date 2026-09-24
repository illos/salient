# V168: Field Arsenal choices stay locked mid-respite

Rules review: required. Depends on: V166.

## Goal

Close QC1's V166 R1 (`review-artifacts/2026-09-24-V165-V166-QC1.md`): `respite.change-kit` accepted a
Tactician's Field Arsenal choice alone, with both kits unchanged, and activated it at once; Interrupt
kept it.

## Scope

- Source: `feature/tactician/level-1/field-arsenal.md`, paragraph 2: where both kits grant a benefit,
  "you take one or the other and can't change your choice until you finish a respite."
- `respite.change-kit` now refuses a change that keeps both kit identities (`kit.choice` and
  `class.tactician.second-kit`) and changes only arsenal choices. Arsenal choices remain part of a real
  kit change, when a kit identity changes. Changing an arsenal choice on respite completion is not
  implemented; it stays a full edit with Director approval.

## Acceptance checks

1. `tests/app/respite.test.ts`: the V94 Tactician witness with Martial Artist and Mountain (arsenal melee
   damage from Mountain) is refused an arsenal-only change mid-respite, and after Interrupt its persisted
   build still takes Mountain. The test fails against the V166 code.
2. Test-support gate; Test-Deploy runs `respite`.

## Work log

- Built on `slice/V168`, `.worktrees/arsenal-lock`, from main `7098e50`. Author checks: lint, both
  TypeScript projects, respite app tests (12).
