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
  `class.tactician.second-kit`, compared as a pair so swapping slots counts as unchanged) and changes only
  arsenal choices. **Implementation interpretation:** a change to the pair
  of kits re-opens the arsenal choice for the new pair (field-arsenal.md: "Whenever you would choose or
  change one kit, you can choose or change your second kit as well"); the alternative keeps a shared
  benefit's choice locked while one of its kits stays. Changing an arsenal choice on respite completion is not
  implemented; it stays a full edit with Director approval.

## Acceptance checks

1. `tests/app/respite.test.ts`: the V94 Tactician witness with Martial Artist and Mountain (arsenal melee
   damage from Mountain) is refused an arsenal-only change mid-respite, and after Interrupt its persisted
   build still takes Mountain. The test fails against the V166 code.
2. Test-support gate; Test-Deploy runs `respite`.

## Work log

- Built on `slice/V168`, `.worktrees/arsenal-lock`, from main `7098e50`. Author checks: lint, both
  TypeScript projects, respite app tests (12).
- Independent review of `c6ab563`: CHANGES REQUIRED: swapping the two kits between slots passed the
  guard. The pair is now compared unordered, with a swap regression; the kit-change interpretation is
  labelled.
- Review re-verification of `153a370`: PASS; the swap regression now sends a complete change.

## Publication: 2026-09-24

The test and deploy thread fast-forwarded reviewed `79fc25f` into main and published the backend/frontend
using the DEPLOY2 hosted procedure. Worker: `d48f300d-6adb-45aa-8841-74446a53ffa9`. Content is unchanged, so no reseed was needed. Temporary credentials were
removed and the private hosted helpers stopped. Release logs: `/srv/presidium/projects/salient/test-artifacts/V168-release-79fc25f`.
