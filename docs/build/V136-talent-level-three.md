# V136: Talent levels two and three

Rules review: required. Depends on: V105, V117.

## Goal

Build and edit a Talent of every tradition at target level two or three through the full wizard and
shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/talent.md`, Basics and Talent Advancement Table: +6 Stamina at levels 2
  and 3 (shared class-profile growth); first echelon, 8 Recoveries.
- `feature/talent/level-2/`: one interpersonal, lore or supernatural perk; the tradition feature
  (Chronopathy Ease the Hours, Telekinesis Ease Their Fall, Telepathy Ease the Mind); the tradition
  ability pair from `en/books/heroes/clean/Draw Steel Heroes.md`, 2nd-Level Chronopathy/Telekinesis/
  Telepathy Ability: Applied Chronometrics / Slow; Gravitic Burst / Levity and Gravity; Overwhelm /
  Synaptic Override.
- `feature/talent/level-3/`: Scan (automatic); 7-Clarity: Fling Through Time, Force Orbs, Reflector
  Field, Soul Burn.
- Embedded uses, each a manual record citing its clause: Ease the Hours' montage round, Ease Their
  Fall's reduction, Scan's free search, Force Orbs' orb strike, and each new ability's Strained effect
  (following V105's per-ability Strain records).
- Table routes: Gravitic Burst, Levity and Gravity, Overwhelm, Slow, Synaptic Override, Fling Through
  Time and Soul Burn roll on the legacy route with conditions, forced movement and Strained effects
  manual. Applied Chronometrics (the roll sets the target count) and Force Orbs (its roll belongs to
  later orb strikes) are recorded without a roll (manualRoll list). Reflector Field has no power roll.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v136-talent-three-expected.json` extends the five V105
   witnesses plus one alternate so every tradition and 7-Clarity ability is chosen. Focused engine test
   checks vitals, features, perk pool, costs, embedded uses, foreign-pool rejection and pruning.
2. Authenticated `talent-level-three` headless cohort: six level-3 builds, draft resume and save,
   owner-only level transition, lower to 2 and back, and every new ability and embedded use with Clarity
   payment, blocked second paid use and persisted readback.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `693280c` on `slice/V136`, `.worktrees/talent-three`, with empty `vendor/*`.
- Ledger written by an isolated subagent from the canonical Compendium only: Stamina +6 per level, no
  other numeric change; damage per witness including Force Augmentation's +1 on psionic Fling Through
  Time. Its interpretations (Strained "potency increases by 1" per tier; Force Orbs and Scan ranges)
  are manual text here.
- Author checks: both TypeScript projects and ESLint pass; focused V136, V105, V45 and V32 engine files
  pass; V88 audit guard and live compiled report 34/34; an evaluator and route dry run of the cohort
  (six builds, 24 uses) is clean. Content 1769 entries; `compiled:check`, `content:check`,
  `supporting:check`, links pass.
- Independent rules/implementation review (subagent, source-only) of `4100b3b`: CHANGES REQUIRED, one
  blocking finding: the Talent strain default note was also applied to perk-granted abilities. Perk
  grants are now excluded, with a test. Non-blocking closed: real manual-clause patterns for rolled
  abilities in the cohort, dead compiled-branch code removed, Overwhelm/Synaptic Override/Soul Burn note
  wording, and the Force Orbs range and Strained potency readings recorded as
  [Q-TALENT-2](../rules-questions-for-user.md#q-talent-2--talent-force-orbs-range-and-strained-potency-v136).
- Test-Deploy isolated `talent-level-three` cohort PASS at `c4bae49`: rc0 in 70 s, six builds, level
  edits and twenty-four new uses persisted. Artifacts
  `/srv/presidium/projects/salient/test-artifacts/V136-c4bae49`. The gate there was preempted; it runs at
  the rebased tip.
