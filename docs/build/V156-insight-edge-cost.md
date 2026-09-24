# V156: Shadow insight costs 1 less with an edge

Rules review: required. Depends on: V92, V120, V143.

## Goal

Apply the Shadow's Insight feature: a heroic ability that uses a power roll costs 1 fewer insight
when the Shadow has an edge or double edge on it, even against only one of several targets. The
engine charged the full cost until now. ENGINE2 found the gap on 2026-09-24 while building V155.

## Scope

- `shared/resolve/index.ts` `effectiveFixedCost`:
  - Reduces an insight cost by 1 when any target's edges and banes resolve to a net edge after
    cancelling.
  - Never goes below 0, and only applies to the named resource.
  - Both affordability checks use it: `resolveAbilityRoll`, and the pre-roll check in `ability.use`.
    The amount paid and the amount checked are therefore the same.
- `shared/contracts/rollResolution.ts`: `ActorRollFacts.edgeCostReduction`.
- `convex/lib/resolve.ts` `actorRollFacts`: set for heroes whose evaluated class is Shadow. Insight
  is a level-1 class feature.
- Only abilities with their own power roll get the discount. The pre-roll check applies it only to
  rolled abilities, and `resolveAbilityRoll` only handles those.
  - Interpretation (labelled): "a heroic ability that makes use of a power roll" means the ability's
    own power roll. Shadowstrike ("You use a strike signature ability twice"), So Gullible, Too Slow,
    Dancer, Clever Trick and Hesitation Is Weakness have no power roll of their own, so they pay their
    printed cost.
  - Alternative considered: counting a roll made by an ability they cause to be used, such as the
    signature strikes of Shadowstrike. Rejected, because those strikes are separate uses with their
    own (zero) cost.
- Interpretation (labelled): a later `ability.correct` that changes whether any target had a net edge
  never re-charges or refunds. When the edge-reduced cost would now differ, the correction's log
  entry says so and names `/adjust heroic-resource`. Alternatives considered: refunding or charging
  the difference automatically.

Spec references:

- `docs/table-spec.md#ability-costs-and-optional-spending`

Compendium (pinned `en/unified/md`):
- `feature/shadow/level-1/insight.md`: "Whenever you use a heroic ability that makes use of a power
  roll, that ability costs 1 fewer insight if you have an edge or double edge on it. If the ability
  has multiple targets, the cost is reduced even if the ability gains an edge or has a double edge
  against only one target."
- `rule/dice/power-roll.md`, "Rolling With Edges and Banes": edges and banes cancel. A double edge
  and one bane leave one edge.

## Acceptance checks

1. `tests/scripts/insight-edge.test.ts`: edge, double edge, double edge with one bane, cancelled
   pairs, three edges against two banes, bane only, one of several targets, edges against every
   target (still 1 fewer), other resources, zero cost, and non-Shadows.
2. A headless Shadow journey uses an insight ability with one edge and reads back the reduced
   payment. The same use without an edge pays full cost.
3. TESTER: `CI=true pnpm check` and the Shadow cohorts.
4. An independent review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V156` at `f3dece4` in `.worktrees/insight-edge`.
- Authoring runs:
  - `tests/scripts/insight-edge.test.ts`: 9 passed.
  - The abilities, A05 regressions, engine adapter, compiled effects and shadow character app
    tests: 32 passed.
  - The script suite passed, except `rules.test.ts`, which needs `pnpm rules:ingest`.
  - `tsc --noEmit` passes.
- V156-REVIEW on `f15df79`: changes required. Fixed:
  - The discount now applies only to abilities with their own power roll. It was also reaching
    no-roll insight abilities through the recorded path, such as Dancer given an edge through the
    API.
  - A correction that changes edge eligibility now says the cost would differ.
  - Added pure test cases.

