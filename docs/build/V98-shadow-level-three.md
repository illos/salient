# V98: Shadow level three

Rules review: required. Depends on: V97.

## Goal

Build and edit any Shadow college at target level 3 through the full wizard and shared API.
Guided progression remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative choices, level selection,
  owned draft persistence and unchanged admission boundaries.
- Pinned `en/unified/md/class/shadow.md`, Basics and Shadow Advancement Table: another +6 Stamina;
  still first echelon, eight recoveries, unchanged characteristics and potency. Prior grants remain.
- `en/unified/md/feature/shadow/level-3/careful-observation.md` automatically grants the action;
  `7-insight-ability.md` in that directory grants exactly one of four heroic abilities.
- `en/unified/md/feature/ability/shadow/level-3/`: all five files are included as source content.
  Careful Observation is a free-of-Insight maneuver; its next-strike edge and restricted surge stay
  manual because line of effect, range and intervening strikes are not observed.
- Dancer pays 7 Insight and records encounter-duration prose. Its embedded free triggered Disengage
  is exposed only for a build selecting Dancer, with explicit activation/trigger conditions. Activation,
  encounter duration and movement remain manual, matching the existing Friend! action boundary.
- Misdirecting Strike pays 7 and rolls 9/13/18 + Agility plus applicable kit bonus; ally taunt manual.
  Pinning Shot pays 7 and rolls 8/12/16 + Agility plus ranged kit bonus; the existing bounded compiler
  evaluates Agility versus weak/average/strong potency and applies restrained (save ends).
  Staggering Blow pays 7 and rolls 7/11/16 + Agility plus kit bonus; its combined prone/cannot-stand
  clause is outside the compiler and remains visible manual prose with the other condition tiers.

## Acceptance checks

1. Source-derived `tests/fixtures/v98-shadow-three-expected.json` covers all four options and all
   colleges. Focused engine test catches cumulative-stat, grant, cost and choice-pruning failures.
2. Authenticated `shadow-level-three` headless cohort creates four builds, resumes a level-3 draft,
   lowers/raises its target, and reads saved draft and effective sheet separately. It invokes all five
   new source abilities plus Dancer's embedded Disengage; reads events, resource spend, damage and
   condition outcomes back. Insufficient Insight blocks a second paid use.
3. TESTER runs content/report generation and `CI=true pnpm check`, then the isolated cohort.
   Independent ENGINE review checks rules, manual boundaries and proofs before DEPLOY2 handoff.

## Work log

- Started from main `1d08b96` on `slice/V98`, `.worktrees/shadow-level-three`.
- Source inventory: two advancement features, one automatic maneuver, four cost-7 choices,
  one embedded conditional action; no new perk, skill, college feature or characteristic increase.
