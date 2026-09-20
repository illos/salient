# V70/V71 independent rules review

Reviewer: fresh Astra `v70_v71_rules_review`, 2026-09-20. Candidate: `ab0f2fd` on
`slice/V69`, following the passing [implementation review](V69-implementation-review.md).

**Rules verdict: pass. No blocking rules findings.** This is not full acceptance or delivery:
genuine matching Forge counterparts remain pending, and live headless execution/publication must
be recorded separately. No browser, test, build or server workload was run for this review.

Reviewed both ancestry decision modules and evaluators, shared registration and skill-target
handling, the V70/V71 slice records and focused tests, and the new witnesses in
`scripts/headless/character-scenarios.ts`. Rules were independently checked against local
Compendium commit `fb83a789da8f0327a389c277a0c790b1648d5810` (verified HEAD). No Opus material,
online rules source or Forge interpretation was used.

## Source findings

Source paths below are relative to `vendor/steel-compendium/en/unified/md/` at that pin.

- **Hakaan:** `feature/trait/hakaan/hakaan-traits.md` gives three points. Individual trait
  headers give All Is a Feather, Forceful and Stand Tough one point each; Doomsight and Great
  Fortitude two each. All five are eligible; Big! is automatic. `big.md` sets size 1L;
  `great-fortitude.md` grants weakened immunity. Implementation matches those permanent effects.
  `all-is-a-feather.md`, `forceful.md` and `stand-tough.md` respectively give a lifting/hauling
  edge, +1 forced-movement distance, and resistance-only effective Might +1 plus the specified
  Might-test edge. They correctly remain readable manual effects without altering core Might
  or attack potency. `doomsight.md` retains the predetermined/Director-approved doom paths,
  tier-three outcomes, death at encounter end without resurrection, and the separate non-doomed
  rubble rule with twelve-hour recovery. It grants no permanent health increase.
- **Orc:** `feature/trait/orc/orc-traits.md` gives three points. Bloodfire Rush, Grounded and
  Passionate Artisan cost one each; Glowing Recovery and Nonstop cost two each. All five are
  eligible. `relentless.md` is automatic and permits a free strike against any creature after
  creature damage leaves the hero dying; reducing that target to zero Stamina permits a Recovery.
  `grounded.md` adds one stability and `nonstop.md` grants slowed immunity. `bloodfire-rush.md`
  grants speed +2 only after the first damage in a combat round until that round ends;
  `glowing-recovery.md` changes Catch Breath spending, not recovery capacity/value. The static
  baseline/manual boundary matches each source.
- **Artisan:** `feature/trait/orc/passionate-artisan.md` explicitly permits two crafting targets
  whether owned or unowned, with +2 only to crafting-project rolls using them. All ten options
  exactly match `skill/group/crafting.md`. The nested two-distinct-target selection and
  `skill-target` role preserve this meaning: no extra training, no ordinary-test bonus, no
  rejection merely because a target is already owned. Removing the trait or ancestry removes
  its dependent targets; selected values and conditional benefit remain in supporting choices.

## Independently recomputed expectations

`rule/character/speed.md` gives size 1M, speed 5, stability 0 before overrides. Thus Hakaan is
1L and Orc 1M; Mountain adds stability 2 and no speed. Grounded raises Mountain stability to 3
or no-kit stability to 1. Great Fortitude/Nonstop add only their respective immunities.

From `class/fury.md` and `kit/mountain.md`, level-one Mountain Fury has Stamina 21 + 9 = 30
and ten Recoveries. `rule/health/recoveries.md` yields recovery value 10;
`rule/health/winded.md` yields winded 15. None of these ancestry purchases changes those values.
From `class/elementalist.md`, the no-kit witness has Stamina 18, eight Recoveries, recovery 6
and winded 9. Its selected Might remains -1 and Reason/strong potency remain 2 with Stand Tough;
the Fury witness retains Might 2. These expectations agree with the focused assertions.

Focused tests distinguish conditional effects from permanent values, invalid budgets from grants,
Artisan targets from trained skills, and parent replacement from stale ancestry effects. Headless
witness loadouts legally cover every purchase within three points, require readable source text,
and include persisted Hakaan replacement and Orc Artisan removal. Their source correctness does
not establish that the pending live route or Forge comparison has passed.
