# V163: Level-up for every class, one granted level at a time

Rules review: required. Depends on: V32, V161, V162.

## Goal

Generalise V32's Fury 1→2 advancement to every class and supported level, driven by pending level-ups
([level-up policy](../character-wizard-spec.md#level-up)).

## Scope

- `characters.pendingLevelUps` counts granted level-ups not yet taken; `characters:get` returns it.
- Registered shared operation `character.grant-level-up` (`/character grant-level-up`, palette, headless
  `commands:invoke`): Director only, one pending level-up to each chosen hero, the attached party by
  default. Character events are outside table undo, so a mistaken grant is corrected with
  `character.withdraw-level-up` (Director; removes one not-yet-taken level-up). Respite completion adds
  grants in V165.
- `characters:progression`, `saveAdvancement`, `finalizeAdvancement`: from the effective build's level
  L to L+1 when L+1 supports the class (`levelUpTarget` in `shared/content/character-support.ts`); the
  level-up's decisions are those in L+1 but not L. Eligibility: attached to a campaign, complete build,
  a pending level-up, not combat-locked. Finalizing spends one pending level-up. The owner-declared
  respite checkbox and the 16-XP gate are gone (XP converts at respite; the grant is the eligibility).
- Interim sheet panel (`web/progression/index.tsx`) now works for any class and level and appears only
  while a level-up is pending. V164 replaces it with the builder's level-up mode (user review).

## Acceptance checks

1. `tests/character-v163-level-up.test.ts`: one level-3 ledger build per class (all eleven) splits into
   level 1 plus each level's new decisions, complete at 1, 2 and 3, with the ledger's level-3 Stamina.
2. App tests: grant through `commands:invoke` and slash text, player refused, party default; no level-up
   without a grant; V32 Fury flows with the revised Q-CHAR-2 values.
3. Headless `level-up`: eleven heroes admitted at level 1, two party grants, each taken one level at a
   time through the public API; persisted level, pending count, ledger Stamina and full current Stamina.
4. Test-support gate; Test-Deploy runs `level-up` and `character-lifecycle`.

## Work log

- Started on `slice/V163`, `.worktrees/level-up`, stacked on V162.
- Removed V45/V97/V98/V114 assertions that encoded the old Fury-only advancement boundary.
- Test-Deploy: `all` passed in 239 s of its 240 s deadline at V162. The lifecycle journey is now its own
  `lifecycle` cohort (no longer inside `all`); it grants its level-up with `/character grant-level-up`.
  Journeys for this slice: `level-up`, `lifecycle`, `all`.
- Independent review of `3a38ea2`: CHANGES REQUIRED, one blocking finding: the slice claimed the grant was
  undoable, but character events are outside table undo. Added `character.withdraw-level-up` (Director,
  removes one not-yet-taken level-up, refused at zero) with app coverage, and corrected the doc.
  Non-blocking, fixed: Shadow's level-4–6 ledger builds level up one level at a time to each witness's
  level; the headless readback checks the effective build's level; a stale V45 test title. Accepted:
  the interim panel's finish state (V164 replaces it).
- Review re-verification of `81519dc`: PASS.
