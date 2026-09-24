# V135: Elementalist levels two and three

Rules review: required. Depends on: V104, V117.

## Goal

Build and edit an Elementalist of every specialization at target level two or three through the full
wizard and shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/elementalist.md`, Basics and Elementalist Advancement Table: +6 Stamina at
  levels 2 and 3 (shared class-profile growth); first echelon, 8 Recoveries.
- `feature/elementalist/level-2/`: one crafting, lore or supernatural perk; the specialization feature
  (Earth Disciple of Earth, Fire Disciple of Fire, Green Disciple of the Green, Void There Is No Space
  Between, which grants its ability); the new 5-Essence ability: O Flower Aid, O Earth Defend, Subvert
  the Green Within, Translated Through Flame, Volcano's Embrace, or a level-1 5-Essence ability not
  chosen at 1st level (excluded when it was).
- `feature/elementalist/level-3/`: Earth Accepts Me and Remember Growth and Sun and Rain (with their
  abilities), A Conversation With Fire, Distance Is Only Memory; 7-Essence: Erase, Maw of Earth, Swarm of
  Spirits, Wall of Fire (book, 7-Essence Ability).
- Disciple of Fire's "fire damage you deal ignores a target's fire immunity" is applied: ability uses
  by an actor with the feature drop typed fire immunity from the target facts before damage (and
  corrections reuse those facts). Interpretation: an all-damage immunity is not fire immunity and still
  applies. Shared helpers `ignoredImmunityTypes`/`withoutImmunityTypes` in `shared/resolve/index.ts`.
- Derived: Disciple of Earth adds +6 Stamina at 2nd level and +3 at each later level (recovery and winded
  recomputed); Disciple of Fire grants fire immunity 5 + level, highest immunity applying.
- Embedded uses, each a manual record citing its clause: Disciple of Fire's encounter surges, Disciple of
  the Green's shapeshift and revert (forms and statistics manual), A Conversation With Fire, Distance Is
  Only Memory's portal, and the Persistent 1 upkeep of O Flower Aid, Swarm of Spirits and Wall of Fire.
- Table routes: Volcano's Embrace compiles (fire, restrained save ends) and joins the V72 inventory. Maw
  of Earth and Swarm of Spirits roll with riders manual. Subvert the Green Within (target acts before the
  roll), Translated Through Flame (roll hits enemies adjacent to the teleported creature) and Erase (the
  roll sets the target count) are recorded without a roll (manualRoll list). The rest have no power roll.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v135-elementalist-three-expected.json` extends the five V104
   witnesses so every new ability and a level-1 5-Essence alternative is chosen. Focused engine test
   checks vitals, Disciple of Earth Stamina, Disciple of Fire immunity, features, perk pool, costs,
   embedded uses, the excluded level-1 repeat and level/specialization pruning.
2. Authenticated `elementalist-level-three` headless cohort: five level-3 builds, draft resume and save,
   owner-only level transition, lower to 2 and back, and every new ability and embedded use with Essence
   payment, blocked second paid use and persisted readback including compiled outcomes.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `a804a02` on `slice/V135`, `.worktrees/elementalist-three`, with empty `vendor/*`.
- Ledger written by an isolated subagent from the canonical Compendium only: Disciple of Earth +6/+9
  Stamina (stacking with Enchantment of Permanence), Disciple of Fire fire immunity 7/8, Volcano's
  Embrace 9/13/16 with Enchantment of Destruction and Acolyte of Fire. Its interpretations (both
  distance bonuses counting; Swarm of Spirits repeat and Acolyte of the Green) are manual here.
- Author checks: both TypeScript projects and ESLint pass; focused V135, V104 and V45 engine files pass;
  V88 audit guard and live compiled report 34/34. Content 1756 entries; `compiled:check`,
  `content:check`, `supporting:check`, links pass.
- Independent rules/implementation review (subagent, source-only) of `390bcdf`: CHANGES REQUIRED, one
  blocking finding: automated damage still subtracted fire immunity from a Disciple of Fire's fire
  damage. Fixed in the shared ability-use path with a pure unit case (14 fire vs fire 10 and
  all-damage 3 lands 11, not 4). Non-blocking: the specialization swap now proves the Disciple of Earth
  Stamina leaves with the feature; the cohort names list no longer repeats chosen abilities.
- Test-support gate at `201b255` failed one engine test: the V32 support sentinel used an Elementalist
  at level 2 as its unsupported class. Moved the sentinel to level 4, where only Shadow is supported, so
  later class slices do not break it. Log `/srv/presidium/projects/salient/test-artifacts/V135-201b255`.
- Test-Deploy headless at `a5aa9c8` failed at "Volcano's Embrace listed with its condition": the cohort
  required an activation note on every new ability, but the compiled Volcano's Embrace needs none. The
  cohort now requires source text for every use, activation text for embedded uses (as V101), and aims
  printed-Self abilities at the actor. An evaluator and route dry run over all five builds is clean.
  Artifacts `/srv/presidium/projects/salient/test-artifacts/V135-a5aa9c8`.
- Test-support gate PASS at `b1aa80b`: `CI=true pnpm check` rc0 in 346 s, engine 420/420, app+scripts
  667/667, content 1775 entries at the pin, compiled report current. Test-Deploy isolated
  `elementalist-level-three` cohort rc0 in 73 s: five builds, level edits and twenty-one new uses
  persisted, seed 1775. Artifacts `/srv/presidium/projects/salient/test-artifacts/V135-b1aa80b`.
- Ready for integration and cloud dev publication, reusing these results.

## Publication: 2026-09-24

Merged in Test-Deploy merge train 1 (V135, V140, V145) as main `7646954`. The combined tree
passed the full gate (420 engine and 672 app tests) and the train's headless journeys before merge.
The backend, content (1775 entries) and frontend were published as Worker `5224599e-bc2e-40c5-9330-546ea0feae12`. Release logs:
`/srv/presidium/projects/salient/test-artifacts/train1-release-34a2dd6`.
