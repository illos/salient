# V177: Damage-type options

Rules review: required. Depends on: V176 (stacked on `slice/V176` `408dd11b`), V159, V174.

## Goal

Compile the level 1–3 hero abilities whose only blocker is the choice of their damage type. The
damage type changes a number the engine computes for the use, so it can't be a manual instruction
([coverage decision](../decisions/2026-09-24-compiled-effect-coverage.md#what-compiled-means)). The
printed choice becomes a table input on `ability.use`, `damage-type=<type>`. It is validated against
the printed list, refused when missing and required, saved with the result, reused by corrections,
and applied through the existing immunity and weakness arithmetic. Part B, potency-gated outcomes
other than conditions, compiles only where every clause maps onto an existing mechanism. None did,
so all four stay manual (see the work log).

## Scope

- `shared/resolve/damageTypes.ts`: three whole-section patterns, each citing its source. Each gives
  a `DamageTypeSpec` (`optional`, `required` or `primordial`, with its options). It also has the
  Primordial Storm table and `chooseDamageType`, which decides one use's type or its refusal.
- `shared/resolve/compileAbility.ts`: a `damage-type` section node. It is admitted only when every
  tier opens with untyped printed damage, and at most once.
- `shared/resolve/compiledOutcome.ts`: the node is re-read and tamper-checked. The input
  `selectedDamageType` must be a printed option, and a required choice must be present. The section
  is executed in the damage, so it is not listed as table work.
- `shared/resolve/index.ts`, `shared/contracts/rollResolution.ts`: `selectedDamageType` on the roll
  request and result. `resolveTarget` applies it to every tier's untyped damage and to per-type
  build bonuses (Acolyte of Fire's Hurl Element alternative). `correctTarget` reuses the saved
  type.
- `convex/lib/abilityOperations.ts`: the `damage-type` argument on `ability.use` (syntax string
  updated). It is refused before any payment or roll when missing, unprinted, or given for an
  ability without the section. The log states the type. `ability.correct` passes the saved type.
- `convex/lib/resolve.ts`: Hurl Element and Visceral Roar leave the manual-roll list. Its
  comments named the damage type as their only reason.
- Activation text of the base Hurl Element entry (`shared/evaluate/elementalistAbilities.ts`) and
  of "Ray of Wrath: Holy Damage" (`shared/content/classes/conduit/abilities.ts`) now points to
  `damage-type=`. The seven typed Hurl Element actions are unchanged.
- Regenerated V72 support report. The V26 audit regenerates unchanged, since classify is
  untouched.

Compendium (pinned `en/unified/md`): `rule/damage/damage-type.md`,
`rule/damage/damage-immunity.md`, `rule/damage/damage-weakness.md`,
`feature/fury/stormwight-kits/primordial-storm.md`, the four `feature/fury/<kit>/primordial-storm-*.md`,
`feature/elementalist/level-1/fire-acolyte-of-fire.md`, and the abilities below.

| Ability | Source | Effect section | Choice |
| --- | --- | --- | --- |
| Ray of Wrath | `feature/ability/conduit/level-1/ray-of-wrath.md` | "You can have this ability deal holy damage." | optional: holy |
| Hurl Element | `feature/ability/elementalist/level-1/hurl-element.md` | "When you make this strike, choose the damage type from one of the following options: acid, cold, corruption, fire, lightning, poison, or sonic." | required: the seven |
| Visceral Roar | `feature/ability/fury/level-2/visceral-roar.md` | "This ability deals your primordial damage type (see Stormwight Kits)." | primordial: from the kit |

Out of scope, kept manual (reasons in the work log): Corruption's Curse, Wither, Setup and Phase
Strike.

Spec references:

- `docs/decisions/2026-09-24-compiled-effect-coverage.md#what-compiled-means`

## Acceptance checks

1. `tests/scripts/damage-types.test.ts` (pure, source-derived):
   - Each of the three compiles with one whole-source `damage-type` section, and no table work.
   - A changed sentence or unprinted type is not admitted, and a tampered spec is refused.
   - Ray of Wrath: untyped by default (holy immunity 4 doesn't apply, 6 damage), holy when chosen
     (6 − 4 = 2). Fire is refused.
   - Hurl Element: refused without a choice or with holy. Fire against fire weakness 5 gives 11,
     cold gives 6, and an untyped "damage weakness 3" applies to cold (9).
   - Acolyte of Fire adds +1 only when fire is chosen (7 against acid's 6).
   - Visceral Roar: Blizzard gives cold. Another type, or no Primordial Storm, is refused. Cold
     weakness 2 on tier 2 "5 damage" gives 7.
   - A correction to tier 3 keeps fire: "6 + R" is 8, plus weakness 5, so 13.
2. `tests/app/damage-types.test.ts` (convex-test, `transactionLimits: true`): the v104-1 Elementalist
   uses Hurl Element on a level 1 Revenant through `/ability use`.
   - Refused without `damage-type` and with `damage-type=holy`.
   - `damage-type=cold` at tier 2 reads back cold damage 7 less cold immunity 1 on the target's
     Stamina.
   - `ability.correct` with one edge reads back tier 3 cold, 9 − 1.
   - `damage-type=acid` applies no immunity.
3. Updated for the flips:
   - `tests/app/abilities.test.ts`: the `ability.use` syntax string.
   - `tests/scripts/effect-riders.test.ts`: Ray of Wrath and Hurl Element are no longer rider
     candidates.
   - `tests/scripts/live-compiled-report.test.ts`: names the three.
4. Journeys, for TESTER:
   - `scripts/headless/conduit.ts`: Ray of Wrath is compiled and untyped without a choice. A second
     use with `damage-type=holy` reads back holy damage by the ledger tier. The fixture's `holy`
     manual remainder is no longer matched.
   - `scripts/headless/elementalist.ts`: the base Hurl Element was `ability.recorded`. Now a use
     without a type is refused, and a use with `damage-type=fire` reads back the ledger's Hurl
     Element: Fire damage, which includes Acolyte of Fire.
   - `scripts/headless/fury-level-three.ts`: Visceral Roar was `ability.recorded`. Now it is
     `ability.use` with the ledger's `damageTypeByKit` type (Boren cold) and `damageByTierMight2`
     damage.
   - TESTER: `CI=true pnpm check`, then the conduit, elementalist and fury-level-three cohorts.
5. An independent rules and implementation review, then QC1.

## Work log

- 2026-09-25: cut `slice/V177` from `slice/V176` (`408dd11b`, on main `e87a4f94`) in
  `.worktrees/damage-types`.
- **Flipped (3):**
  - Ray of Wrath, Hurl Element and Visceral Roar.
  - Reachable compiled goes from 176 to 179 (without a power roll: 20, unchanged).
  - Unchanged reachable compatibility goes from 1445 to 1442.
  - No foe or kit entry changed. The V26 audit is unchanged.
- **Kept manual (Part B)**, since no clause set maps wholly onto V158 instances, V159 modifiers or
  V171 watchers:
  - **Corruption's Curse** (`feature/ability/conduit/level-1/corruptions-curse.md`; a Conduit
    ability, not a Censor one): "M < WEAK, damage weakness 5 (save ends)".
    - The V159 stat modifiers are speed, stability and saving throws. No effect instance adds a
      damage weakness to a creature's damage facts.
    - A foe's damage facts come only from its stat-block cells (`convex/lib/resolve.ts`
      `damageTargetFacts`).
  - **Setup** (`feature/ability/shadow/level-1/setup.md`): "R < WEAK, the target has damage
    weakness 5 (save ends)". It stays manual for the same reason.
  - **Phase Strike** (`feature/ability/null/level-1/phase-strike.md`): "the target goes out of
    phase (save ends)". The Effect section defines that as slowed, stability reduced by 2, and
    "can't obtain a tier 3 outcome on ability rolls".
    - A tier cap is not a modifier the engine has.
    - The three parts would also need one save to end them together.
  - **Wither** (`feature/ability/conduit/level-1/wither.md`): "P < WEAK, the target takes a bane on
    their next power roll". This is V159's consumable `rolls-by` bane (as in Raider's Awe), but
    potency-gated per tier. Compiling it needs three things that don't exist:
    - A tier modifier node with a potency. V159 modifiers are once-per-use sections, independent
      of the roll.
    - Correction reconciliation. `ability.correct` keeps modifier occurrences unchanged, so a
      correction that changes the tier or the potency outcome would have to create the bane, end
      it, or refuse when a later roll already used it up.
    - V174's potency reduction. Parry's "If the damage has any potency effect associated with it,
      the potency is decreased by 1" re-checks only condition occurrences
      (`convex/lib/damageRevisions.ts` `potencyEffects`). A parried Wither would keep a bane the
      reduced potency no longer gives.

    It also prints no expiry. The V159 note about the Heroes book's "Ending Effects" still applies.
    Each of the four keeps its current `unsafe-tier-remainder` diagnostic.
- Interactions checked:
  - **Watchers (V171):** the damage is written by the same `writePlannedDamage` call with the
    dealer. No watcher reads a damage type.
  - **Triggered offers (V173):** triggers are on damage taken or dealt, not on its type. Feedback
    Loop's own damage keeps its printed psychic type.
  - **Reaction revisions (V174):** a revision halves the saved application, keeping its
    `weaknessApplied` and `immunityApplied` (Q-REACT-1). Those were computed with the chosen type,
    so the revision respects it. The potency re-check reads conditions only, which the type
    doesn't change (Visceral Roar's dazed).
  - **Marks (V175):** the Mark's extra damage is its own untyped damage. Any immunity or weakness on
    the marked creature makes it a table instruction, whatever this use's type.
  - **Corrections:** `correctTarget` and the compiled re-resolution both read the saved
    `selectedDamageType` (app test 2 and pure test).
  - **Build bonuses:** Acolyte of Fire's Hurl Element alternative reads the chosen type. Disciple of
    Fire's ignored fire immunity (`ignoredImmunityTypes`) applies to a chosen fire.
  - **Essence:** the Elementalist's typed-damage gain stays a table-confirmed trigger
    (`shared/resolve/heroicResourceGeneration.ts`, "Damage types and positions are not tracked"),
    so a chosen type doesn't claim it.
  - **Drafts:** the selection draft carries no damage type, so firing the base Hurl Element from a
    draft is refused with the `damage-type=` message. The typed Hurl Element actions still work
    from the list. Ray of Wrath from a draft is untyped. Visceral Roar needs no input.
- Findings outside this slice (not changed):
  - A foe whose stat block prints an immunity or weakness cell (for example
    `monster/demon/1st-echelon/statblock/ruinant.md`, "Holy 3" weakness) gets `fact-needed` damage
    from every ability, because `modifierCells` doesn't read the cell. So a chosen type changes foe
    damage only once those cells are read.
  - Hero damage weaknesses are evaluated but not passed to the damage facts, which carry immunities
    only. Examples are the Revenant's "fire weakness 5" (`feature/trait/revenant/tough-but-withered.md`)
    and the complication weaknesses.
  - Both are recorded under Q-DT-1.
- Authoring checks (all run in the worktree):
  - `pnpm -s lint` clean.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json` clean.
  - `node scripts/report-live-compiled-abilities.ts`, then `--check`: fresh.
  - `node scripts/audit-ability-grammar.ts`: unchanged.
  - Focused vitest with `--maxWorkers=2` passed:
    - the scripts files damage-types, effect-riders, compiled-ability, audit-ability-grammar,
      live-compiled-report and forced-movement-followups, with `tests/resolve.test.ts` and
      `tests/v25-build-roll-contributions.test.ts`;
    - the app files damage-types, abilities, compiled-source, elementalist-character,
      forced-movement-followups and damage-reactions;
    - the character files v100, v104, v114, v134, v135, v45 and v25.
- Journeys were not run (TESTER). Open question: Q-DT-1 in `docs/rules-questions-for-user.md`.
