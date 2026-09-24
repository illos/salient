# V134: Conduit levels two and three

Rules review: required. Depends on: V100, V117.

## Goal

Build and edit a Conduit of every domain at target level two or three through the full wizard and
shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/conduit.md`, Basics and Conduit Advancement Table: +6 Stamina at levels 2
  and 3 (shared class-profile growth); first echelon, 8 Recoveries, unchanged characteristics and potency.
- `feature/conduit/level-2/`: The Lists of Heaven (automatic); one crafting, lore or supernatural perk;
  `2nd-level-domain-feature.md`: the 1st-level domain feature and skill choice of the chosen domain whose
  feature was not taken at level 1 (one automatic grant and one skill choice per domain, available only
  for that other domain); `2nd-level-domain-ability.md`: choose one of your two domains and gain its
  table ability (all twelve domain abilities).
- `feature/conduit/level-3/`: Minor Miracle (automatic); `7-piety-ability.md`: Fear of the Gods,
  Saint's Raiment, Soul Siphon, Words of Wrath and Grace.
- Shared change: a `heroic-ability` grant kind lets a selected domain grant its heroic ability with the
  printed cost (`cost: 5 Piety`); the grammar audit counts it as an ability grant.
- Embedded uses, each a manual record citing its clause: The Lists of Heaven's Recovery, Minor Miracle's
  ritual, and Sacred Bond's damage transfer and shared Recovery. The second domain feature brings its
  existing level-1 activities.
- Table routes: Nature Judges Thee (area, restrained save ends) and Saint's Tempest (area lightning,
  vertical slide) compile under the existing engine and join the V72 inventory. Morning Light, Fear of
  the Gods, Soul Siphon and Words of Wrath and Grace roll with their riders manual. The Gods Command You
  Obey is recorded without a roll (manualRoll list, as Puppet Strings): at every tier the target acts
  before taking the damage. The others have no power roll and are recorded with Piety payment.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v134-conduit-three-expected.json` extends the twelve V100
   witnesses (one per domain) so every domain ability and 7-Piety ability is chosen. Focused engine test
   checks vitals, the second domain feature and skill, features, perk pool, costs, embedded uses,
   foreign-domain rejection and level/domain pruning.
2. Authenticated `conduit-level-three` headless cohort: twelve level-3 builds, draft resume and save,
   owner-only level transition, lower to 2 and back, and every new ability and embedded use with Piety
   payment, blocked second paid use and persisted readback, including compiled outcomes.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `7f6a0b1` on `slice/V134`, `.worktrees/conduit-three`, with empty `vendor/*`.
- Ledger written by an isolated subagent from the canonical Compendium only: Stamina +6 per level (30/36
  with Prayer of Steel, else 24/30), no other numeric change; damage per witness including Prayer of
  Destruction's +1 on magic abilities. Its interpretations (Prayer of Distance on "cube within",
  Fear of the Gods' frightened gating) do not change a table-resolved value here.
- The second domain's level-1 skill choices offer their full skill group, like level 1.
- Author checks: both TypeScript projects and ESLint pass; focused V134, V100 and V45 engine files pass;
  V88 audit guard and live compiled report 34/34. Content 1754 entries; `compiled:check`,
  `content:check`, `supporting:check`, links pass.
- Independent rules/implementation review (subagent, source-only) of `87dfac3`: PASS, four
  non-blocking findings, all closed: The Gods Command You Obey's note names the Presence potency gate;
  Statue of Power and Blessing of Fate and Destiny notes follow the printed text; the cohort reads the
  second domain feature and skill back from the persisted sheet; catch-all remainder patterns removed.
- Test-Deploy headless at `32eddf5` failed at "v100-fate Grave Speech listed with its condition": the
  cohort required an activation note on carried-over level-1 domain abilities (Grave Speech, Hands of the
  Maker), which keep only their source text. An evaluator probe confirmed every new use has its note.
  The cohort now requires source text for every use and the activation note for every new one.
  Artifacts `/srv/presidium/projects/salient/test-artifacts/V134-32eddf5`.
- Test-Deploy headless at `471eaa3` failed: Hands of the Maker (a carried level-1 ability) prints a Self
  target, and the cohort aimed it at another creature. The cohort now derives self-only uses from the
  printed target on the sheet, and requires activation text only for embedded uses (as V101). An
  evaluator and route dry run over all twelve builds found no further mismatch.
