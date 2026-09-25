# V201: Small damage fixes

Rules review: required. Depends on: V178, V179 (merged).

## Goal

Two follow-ups to V178/V179. A roll correction to a use whose granted weakness joined a V158 manual
stacking group is no longer refused when it keeps the same weakness clause. The Ogre Goon's and Ogre
Juggernaut's Defiant Anger is applied exactly instead of leaving all damage to them manual. No other
stat block leaves `FOE_MODIFIER_TRAITS`. Stored weaknesses are still never re-derived.

## Scope

- **Correction refusal.** `convex/lib/abilityOperations.ts`, `ability.correct`: the V179 check
  compares a saved tier clause marked manual by `markManual` (manual stacking) as the roll resolved
  it (`applied`), so like is compared with like. A refusal names the manual stacking group when the
  saved clause is in one. The correction takes the current pools from the creature's record rather
  than from `damageTargetFacts`. That function now reports "manual" for a creature in a group, which
  used to drop the hit's saved application (`applied: null`) while the Stamina kept the damage.
- **Defiant Anger.** `FOE_WINDED_TRAITS` (`shared/resolve/damageModifiers.ts`) replaces the two ogres'
  `FOE_MODIFIER_TRAITS` entries. `DamageTargetFacts.whileWinded` carries the entries and
  `applyDamage` adds them when the target is winded (Stamina ≤ winded value, temporary Stamina not
  counted). `DamageApplication.whileWinded` records the immunity in each state, so `reapplyDamage`
  (used by `writePlannedDamage`) picks the one for the Stamina the damage is written against.
  Corrections fix the state the hit met (`atWindedState`). The Mark's extra damage uses the hit's
  saved immunity. A squad member with such a trait is manual.
- Readings: Q-IW-1 point 6 (new), Q-IW-2 point 3 (extended), in `docs/rules-questions-for-user.md`.

Spec: `docs/roll-and-damage-resolution.md#62-immunity-and-weakness`.

Compendium (pinned `en/unified/md`): `monster/ogre/statblock/ogre-goon.md` (Stamina 100, "While
winded, the goon has damage immunity 2."), `monster/ogre/statblock/ogre-juggernaut.md` (Stamina 80,
"While winded, the juggernaut has damage immunity 2."), `rule/health/winded.md`,
`rule/health/temporary-stamina.md`, `rule/damage/damage-immunity.md`,
`feature/ability/shadow/level-1/setup.md`, `rule/dice/power-roll.md`. A grep of `monster/` for
"winded" on a line that also has "immun" or "weakness" matches only the two ogres.

Out of scope: the other ogres' squad-counted Anger traits (Royal, Excessive), which stay manual.

## Acceptance checks

1. `tests/app/granted-defenses.test.ts`, "V201: correcting a Setup in a manual stacking group…":
   Twin's Setup joins Shade's in a group (saved modifier `manual`). One edge (12 → 14, tier 2)
   succeeds with "tier 2 → 2, damage 11 → 11, reconciliation +0 Stamina". The persisted target has
   edges 1, `applied` {incoming 11, weaknessApplied 5, afterImmunity 16}, goblin Stamina −1, and
   both instances are still active manual stacking. Two edges (tier 3) are refused with "…which is
   in a manual stacking group the table resolves; rewind the use instead…". The test fails on main
   with the old refusal.
2. Same file, "V201: an ogre goon…": the goon at 51 takes the free strike's 5 in full (46, winded).
   Winded, it takes 5 − 2 = 3 (43). At 50, Hurl Element fire tier 1 does 6 − 2, and the log says
   "Defiant Anger: winded, damage immunity 2". A one-edge correction gives tier 2, 8 − 2, and
   Stamina 50 − 6.
3. `tests/scripts/immunity-weakness.test.ts`: the scan still classifies every stat block, now
   including `FOE_WINDED_TRAITS`. The winded traits are quoted exactly, are disjoint from the other
   lists, and are their stat block's only mention. The set of stat blocks with a winded immunity or
   weakness line is exactly the goon and the juggernaut. Arithmetic uses stat-block maxima: 51 → full,
   50 → −2 for every type, temporary Stamina, reapply across the threshold, and `atWindedState`.
4. Authoring checks: `pnpm -s lint`, `pnpm -s tsc --noEmit`, `pnpm -s tsc -p tsconfig.web.json`,
   `node scripts/report-live-compiled-abilities.ts --check`, `pnpm -s foes:check`.

## Work log

- 2026-09-25: worktree `.worktrees/small-fixes`, branch `slice/V201` from main `37ceda45`.
- A correction is refused once later gameplay has committed (`assertCorrectionAllowed`), so the
  creature's Stamina can't move between a hit and its correction through the table. The saved
  winded state is still used (`atWindedState`), and a unit test covers it.
- Authoring checks, all exit 0: lint; `tsc --noEmit`; `tsc -p tsconfig.web.json`; compiled report
  `--check`; `foes:check` (438 stat blocks, verified). Focused vitest (`--maxWorkers=2`):
  `tests/scripts/immunity-weakness.test.ts`, `tests/scripts/granted-defenses.test.ts`,
  `tests/resolve.test.ts`, `tests/scripts/damage-types.test.ts`, `tests/app/granted-defenses.test.ts`,
  `tests/app/immunity-weakness.test.ts`, `tests/app/marks.test.ts`, `tests/app/abilities.test.ts`,
  `tests/app/damage-reactions.test.ts`: 9 files, 108 tests passed.
- Stale-expectation sweep: no test or headless script names the ogres or the old refusal text
  except `tests/app/granted-defenses.test.ts`, whose `/rewind the use instead/` still matches.
- Remaining: the TESTER gate and review.

## Publication: 2026-09-25

Merged in train 21 as main `9d8f7bc` and published as Worker `758b9359-5be8-4113-a393-6d7c117c2fa4`. Release logs: `/srv/presidium/projects/salient/test-artifacts/train21-release-9d8f7bc`.
