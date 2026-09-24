# V154: Tier instructions and tiers without damage

Rules review: required. Depends on: V109, V113, V152, V153.

## Goal

Compile power rolls whose tiers have no damage, such as Power Chord's "Push 1" or Battle Cry's
"Each target gains 1 surge". Also compile whole tier clauses that are table work for that target's
outcome: a teleport, shift, Recovery or surge instruction. The engine rolls and resolves every
supported tier effect in printed order. Instructions are recorded per target and change no state,
as V109 riders do (see
[the coverage decision](../decisions/2026-09-24-compiled-effect-coverage.md#what-compiled-means)).

## Scope

- `shared/resolve/effectRiders.ts` `tierInstruction`: five whole-clause patterns, each citing its
  source. Printed casing is matched.
- `shared/resolve/compileAbility.ts`:
  - A tier may open with supported work instead of damage. Push, condition and instruction nodes
    then have `after: ''`.
  - An `instruction` node kind.
  - Metadata tiers may lack damage.
  - A "tier N damage outside grammar" classifier result is no longer fatal on its own, because the
    tier loop diagnoses every clause it can't support.
- `shared/resolve/compiledOutcome.ts`:
  - The envelope check allows zero or one damage node, and damage must come first.
  - Every tier effect must follow the tier's damage, or `''` if it has none.
  - An instruction's shape must re-read from its clause.
  - Instructions resolve as rider outcomes with `tier: true` and wait for this target's damage.
- `convex/lib/abilityOperations.ts`: a correction of one target keeps other targets' tier
  instructions, as it keeps their other tier effects.
- `web/table/targeting.tsx`: a tier instruction is headed with its target's name.
- Out of scope:
  - Potency-gated instructions (Wither's "P < WEAK, the target takes a bane on their next power
    roll"). These need target-score privacy and a resisted display.
  - Executed surge and temporary Stamina gains, planned as one later slice for every such clause.
  - "Vertical push N" with a capital V (Lion's Toss).

Spec references:

- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/build/V26-compiled-ability-effects.md#3-persisted-results-and-clients`
- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`

Compendium (pinned `en/unified/md`): `rule/dice/ability-roll.md` (tier effects, printed order);
`movement/forced-movement.md`; `resource/surge.md`.

| Ability | Source | Tiers |
| --- | --- | --- |
| Power Chord | `feature/ability/troubadour/level-1/power-chord.md` | Push 1/2/3, no damage |
| Battle Cry | `feature/ability/tactician/level-1/battle-cry.md` | Each target gains 1/2/3 surge(s), no damage |
| In a Puff of Ash | `feature/ability/shadow/level-2/in-a-puff-of-ash.md` | damage; you can teleport the target 1/3/5 |
| Inspiring Strike | `feature/ability/tactician/level-1/inspiring-strike.md` | damage; Recovery instructions (tier 3 adds an edge on the next ability roll) |
| Fade | `kit/cloak-and-dagger.md` | damage; you can shift 1/2/3 |
| Muddle the Mind | `monster/rival/1st-echelon/statblock/rival-talent.md` | conditions only |
| Web | `monster/goblin/statblock/war-spider.md` | A < N restrained (save ends) only, plus the V109 terrain rider |

## Acceptance checks

1. `tests/scripts/tier-instructions.test.ts`:
   - Whole-clause admission.
   - Power Chord pushes each area target by its tier, with no damage.
   - Battle Cry records one ready surge instruction per ally.
   - In a Puff of Ash's teleport waits for its damage.
   - A tampered instruction or misplaced damage is refused.
2. `tests/scripts/live-compiled-report.test.ts` names the 7 additions. `pnpm compiled:check` is
   fresh.
3. TESTER:
   - `CI=true pnpm check`.
   - `SALIENT_HEADLESS_COHORT=tier-instructions node scripts/verify-character-headless.ts` reads
     back per-target instructions and dispositions.
   - A one-target correction on Battle Cry keeps the other allies' instructions.
4. An independent rules and implementation review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V154`, stacked on `slice/V153`, in `.worktrees/tier-instructions`.
- The V72 report moves exactly 7 to compiled: 136 → 143 reachable. Lion's Toss stays manual.
- Authoring: `vitest run` on the tier-instructions, live report, compiled-ability, compound,
  tier-effects and effect-riders script tests passed. Both typechecks pass.
