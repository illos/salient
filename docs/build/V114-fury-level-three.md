# V114: Fury levels two and three

Rules review: required. Depends on: V101, V32, V97.

## Goal

Build and edit a Fury of every primordial aspect at target level two or three through the full
wizard and shared API. Guided advancement stays the V32 Berserker 1→2 transition.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/fury.md`, Basics and Fury Advancement Table: +9 Stamina at levels 2
  and 3; first echelon, 10 Recoveries, unchanged characteristics and potency.
- `feature/fury/level-2/perk.md`: one crafting, exploration or intrigue perk, now for every aspect
  (V32 restricted the whole level to Berserker). Existing core perk catalog and extracted actions.
- `feature/fury/level-2/2nd-level-aspect-feature.md`: Unstoppable Force, Inescapable Wrath, Tooth
  and Claw. `2nd-level-aspect-ability.md` with the option pairs from
  `en/books/heroes/clean/Draw Steel Heroes.md`, 2nd-Level Berserker/Reaver/Stormwight Ability:
  Special Delivery / Wrecking Ball; Death... Death! / Phalanx-Breaker; Apex Predator / Visceral Roar.
- `feature/fury/level-3/3rd-level-aspect-feature.md`: Immovable Object, See Through Their Tricks,
  Nature's Knight (its table row is unlinked; `natures-knight.md` is the entry).
  `7-ferocity-ability.md`: Demon Unleashed, Face the Storm!, Steelbreaker, You Are Already Dead.
- Derived: Inescapable Wrath adds Agility to speed; Immovable Object adds Might to stability. Both add
  to the kit-derived value as kit bonuses do. Ignoring difficult terrain and the effective-size
  increase are manual feature text.
- Embedded uses, each an explicit manual record with its source clause: Unstoppable Force (strike
  ability during Charge), Tooth and Claw (end-of-turn adjacent Might damage), Special Delivery (the
  ally's free strike), Apex Predator (pursuit move), You Are Already Dead (leader/solo free strike).
- Table routes: Death... Death! and Apex Predator roll printed damage plus kit bonus with their
  conditions manual. Phalanx-Breaker and Wrecking Ball print a Self target whose roll hits enemies
  passed during movement, and Visceral Roar deals the Stormwight primordial damage type: all three are
  recorded without a roll, as Tide of Death and Hurl Element already are. The four 7-Ferocity
  abilities and Special Delivery have no power roll and are recorded with payment. Steelbreaker's 20
  temporary Stamina is applied manually; the effect-rider grammar does not cover it (engine track).

## Acceptance checks

1. Independent source ledger `tests/fixtures/v114-fury-three-expected.json` (written from the
   Compendium only) extends the six V101 witnesses to levels 2 and 3. Focused engine test
   `tests/character-v114-fury-three.test.ts` checks vitals, speed/stability, features, perk, costs
   and embedded uses per aspect and kit; foreign-pool and missing choices; level and aspect pruning.
2. Authenticated `fury-level-three` headless cohort: eight level-3 builds (six witnesses plus two
   alternates so all six level-2 abilities are chosen), wizard-draft resume and save, owner-only
   level transition, lower to 2 and back to 3 with draft/effective separation, and fifteen new uses
   (ten abilities, five embedded) with Ferocity payment, blocked second paid use and persisted
   damage/no-damage readback.
3. TESTER runs `CI=true pnpm check` and the isolated cohort. Independent rules review before DEPLOY2.

## Work log

- Started from main `344a7d7` on `slice/V114`, `.worktrees/fury-three`. Chords: ENGINE2 informed
  (V113 touches shared resolve and the support reports; regenerate them after rebase).
- Ledger written by an isolated subagent reading only the Compendium. Its uncertainties (duplicate
  perk choice, Heroes-book perk groups, true-form Stormwight values) do not affect the witnesses.
- Author checks: both TypeScript projects and ESLint pass. Focused engine files (V114, V32, V45,
  V101, V97, V98, supporting) pass, V88 audit guard 24/24, live compiled report 65/65, app
  progression/choice-origin 15/15. Content 1669 entries; `compiled:check`, `content:check` and
  `supporting:check` pass. Intended updates: V32 perk/aspect pruning and the V45 unsupported-aspect
  sentinel, the new Unstoppable Force use in the V32 fixture, eight IDs added to the V88 allowance.
- Independent rules/implementation review (subagent, source-only) of `bf72805`: PASS, five
  non-blocking findings, all closed here. Manual text for the three unrolled abilities now names the
  roll and damage; You Are Already Dead's 3 surges belong to the ability, not its free strike; the
  foreign-pool and V45 assertions check exact diagnostics; the duplicate-perk question is
  [Q-FURY-2](../rules-questions-for-user.md#q-fury-2--may-a-class-perk-duplicate-a-perk-the-hero-already-has).
