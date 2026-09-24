# V133: Null levels two and three

Rules review: required. Depends on: V103, V116.

## Goal

Build and edit a Null of every tradition at target level two or three through the full wizard and
shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/null.md`, Basics and Null Advancement Table: +9 Stamina at levels 2 and 3
  (shared class-profile growth); first echelon, 8 Recoveries, unchanged characteristics and potency.
  Density Augmentation's +6 Stamina next grows at 4th level (`feature/null/level-1/density-augmentation.md`).
- `feature/null/level-2/`: one exploration, interpersonal or intrigue perk; the tradition feature
  (Chronokinetic Rapid Processing, Cryokinetic Entropic Adaptability, Metakinetic Inertial Sink); the
  tradition ability pair from `en/books/heroes/clean/Draw Steel Heroes.md`, 2nd-Level
  Chronokinetic/Cryokinetic/Metakinetic Ability: Blur / Force Redirected; Entropic Field / Heat Sink;
  Gravitic Strike / Kinetic Shield.
- `feature/null/level-3/`: Psionic Leap and Reorder (automatic); `7-discipline-ability.md`: Absorption
  Field, Molecular Rearrangement Field, Stabilizing Field, Synapse Field.
- Derived: Entropic Adaptability grants cold immunity equal to twice Intuition; with another cold
  immunity the highest applies (`rule/damage/damage-immunity.md`). Its climbing and cold-terrain
  benefits, Inertial Sink's effective size, fall and forced-movement damage reduction, and Psionic
  Leap's jump distance stay manual text.
- Embedded uses, each a manual record citing its clause: Rapid Processing's reading maneuver and
  extra respite activity, Reorder's start-of-turn effect ending, Blur's granted ability, Heat Sink's
  end-of-turn cold damage and Stabilizing Field's start-of-turn effect ending.
- Table routes: Force Redirected (slide), Gravitic Strike (psychic, vertical pull) and Entropic Field
  (area, cold, slowed save ends) are compiled by the existing engine and resolve damage, forced-movement
  occurrences and potency conditions automatically; they join the V72 compiled inventory. Kinetic
  Shield rolls against yourself with its temporary Stamina manual. Blur, Heat Sink and the four fields
  have no power roll and are recorded with Discipline payment.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v133-null-three-expected.json` extends the four V103
   witnesses plus two alternates so every tradition ability and 7-Discipline ability is chosen.
   Focused engine test checks vitals, cold immunity, features, perk pool, costs, embedded uses,
   foreign-pool rejection and level/tradition pruning.
2. Authenticated `null-level-three` headless cohort: six level-3 builds, draft resume and save,
   owner-only level transition, lower to 2 and back, and every new ability and embedded use with
   Discipline payment, blocked second paid use, and persisted damage/compiled-effect readback.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `a789fcc` on `slice/V133`, `.worktrees/null-three`, with empty `vendor/*`.
  ENGINE2 informed. Three new abilities compile under the existing engine (V110/V113 grammar).
- Ledger written by an isolated subagent from the canonical Compendium only: Stamina +9 per level,
  Cryokinetic cold immunity 4 (twice Intuition 2); Force Redirected 11/15/19 with Force Augmentation's
  +1 on psionic rolled damage, Gravitic Strike 10/14/18 psychic, Entropic Field 6/9/13 cold. Its
  interpretations (Inertial Sink's size stays manual; field growth stacking unresolved) are manual here.
  The ledger drops Teamwork from the perk pool only because every base holds it; the pool keeps it
  under Q-FURY-2's interim reading.
- Author checks: both TypeScript projects and ESLint pass; focused V133, V103 and sibling class engine
  files pass; V88 audit guard and live compiled report (with the three new compiled names) 34/34.
- Independent rules/implementation review (subagent, source-only) of `f9d0931`: CHANGES REQUIRED, two
  blocking cohort bugs, both fixed: the three compiled abilities now carry accurate activation text
  (the table resolves damage, movement instructions and slowed), and Kinetic Shield's empty damage row
  reads as zero. Non-blocking closed: Stabilizing Field's ally potency wording; the tradition-change
  test proves the cold immunity is removed; unused cost maps dropped.
- Test-support gate PASS at `187fa3f`: `CI=true pnpm check` rc0 in 268 s, engine 416/416, app+scripts
  661/661, content 1751 entries at the pin, compiled report current. Test-Deploy isolated
  `null-level-three` cohort rc0 in 37 s: six builds, level edits and sixteen new uses persisted,
  including compiled readback, seed 1751; the only backend error was the deliberate peer owner refusal.
  Artifacts `/srv/presidium/projects/salient/test-artifacts/V133-187fa3f`.
- Ready for integration and cloud dev publication, reusing these results.

## Publication: 2026-09-24

The test and deploy thread fast-forwarded reviewed `b99b951` into main. The rebase onto V120 combined
runtime code, so the tip itself was tested first: the full gate (281 s, 416 engine and 667 app tests)
and the `null-level-three` and `heroic-resource` journeys passed. The backend, content and frontend
were then published using the DEPLOY2 hosted procedure. Backend and schema validation succeeded, the
reseed read back 1751 entries at `fb83a789`, and the hosted build and upload succeeded.
Worker: `99cbb3c1-fad8-4f35-8715-1c94905601b6`. Temporary credentials were removed and the private hosted helpers stopped. Release
logs: `/srv/presidium/projects/salient/test-artifacts/V133-release-b99b951`.
