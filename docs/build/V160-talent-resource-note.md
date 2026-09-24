# V160: Talent ability cards defer resource bookkeeping to the engine

Rules review: required. Depends on: V136, V146.

## Goal

Close QC1's V136 R1 (`review-artifacts/2026-09-24-V134-V136-V137-V138-V151-QC1.md`): Talent ability
cards without their own note said Clarity generation, end-of-turn strain damage and encounter reset are
manual, although the heroic-resource engine applies them at levels 1–6 in combat. Following both could
apply strain twice.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system). `shared/evaluate/talentAbilities.ts`:
  the shared fallback note keeps each ability's Strained effects manual and points Clarity gain,
  end-of-turn strain damage and reset to "Clarity and Strain: Turn-End Damage", which already states the
  level 1–6 automation and the manual cases (level 7+, outside combat, Steel Ward and Force Orbs
  immunity). Source: `feature/talent/level-1/clarity-and-strain.md`.
- No rules or engine change.

## Acceptance checks

1. Focused `tests/character-v160-talent-resource-note.test.ts`: every level-2 Talent witness's class
   abilities no longer say resource bookkeeping is manual, and Gravitic Burst (QC1's reproduction)
   points to the automated record. It fails on the old text.
2. Test-support runs `CI=true pnpm check`; Test-Deploy merges and publishes. No journey change.

## Work log

- Started from main `0f0919c` on `slice/V160`, `.worktrees/talent-resource-note`. Only Talent had a
  stale note: the Summoner, Beastheart and Elementalist resource records already describe the
  automation. Author checks: full lint, TypeScript, focused V160/V136 tests (5) pass; the new test
  fails against the old fallback.
- Independent review of `1c599cb`: CHANGES REQUIRED, the new note overclaimed twice, both fixed: it
  now keeps the Steel Ward and Force Orbs exception (the engine holds that strain for the player to
  apply) and names only the automated gains (combat start, turn start), leaving the first forced
  movement each round to a claim. The test asserts both and that the referenced record exists.
