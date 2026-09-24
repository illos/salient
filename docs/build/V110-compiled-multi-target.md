# V110: Compiled multi-target and area abilities

Rules review: required. Depends on: V26, V67, V72, V88, V109.

## Goal

Admit abilities whose Target entry is a printed count ("Two creatures or objects", "Three
creatures") or an area ("Each enemy in the area") to compiled execution. One power roll resolves
every selected target at its own tier. Per-target damage, push instructions and save-ends potency
conditions apply as for single targets, and once-per-use Effect riders occur once. The slice does
not place areas, check line of effect or decide which creatures are eligible. The table still
selects the targets, as the compatibility path already does. Self, special, per-minion and other
unknown Target entries stay on the compatibility path.

## Scope

- Compiler (`shared/resolve/compileAbility.ts`, `abilityGrammar.ts`): `target-boundary` now fires
  only for self, unknown and inconsistent Area-keyword envelopes. An Effect section whose subject is
  "the target", or which reads a tier outcome, stays a manual section on counted and area
  envelopes (`effectRiders.ts` `subject`).
- Pure resolver (`compiledOutcome.ts`): one or more distinct targets, capped at the printed count
  for counted envelopes; exactly one for a single target. Riders stay once per use.
- Live operations (`convex/lib/abilityOperations.ts`):
  - A compiled counted ability refuses more targets than printed. Compatibility records keep
    their existing rule warning.
  - A correction re-resolves every target with its current recorded edges and banes. Only the
    corrected target's occurrences and the once-per-use riders get the correction revision. Other
    targets keep their recorded occurrence identities, dispositions and condition instances.
  - Dispositions accept any current occurrence of the use.
- Regenerated V67/V72 reports and an updated live inventory. Excludes squad per-minion signature
  strikes, self-targeting envelopes, placement and geometry, enemy/ally eligibility enforcement,
  and "one target" tier clauses (for example Haymaker's "one target is grabbed").

Spec references:

- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/build/V26-compiled-ability-effects.md#3-persisted-results-and-clients`
- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`
- `docs/table-spec.md#director-edits-to-inline-results`

Compendium passages (pinned `en/unified/md`):

- `rule/combat/target.md`:
  - The Target entry is the number of creatures, objects or both that can be targeted; fewer is
    always allowed.
  - "Each [target]" area abilities affect all eligible targets in the area.
  - Objects are immune to an ability's other effects unless otherwise noted. The existing
    evaluator only admits hero and foe characteristics for potency, so object and squad targets
    stay `fact-needed`.
- `rule/combat/area-of-effect.md`: origin square, line of effect and spread are table placement.
  They are not modeled here.
- `rule/dice/ability-roll.md`, "Abilities With Damage and Effects":
  - Tier effects apply to the target unless otherwise specified, after damage to all targets, in
    printed order.
  - An effect that targets the user or the Director occurs once, not once per target.
  - When tiers differ across targets, the user picks the tier for such an effect. That is why
    target-subject and tier-outcome sections stay manual when several targets can differ.
- `movement/forced-movement.md`: the +1 size adjustment applies to melee weapon abilities,
  including Area/Melee/Weapon abilities such as Back!. The adjustment is per target and was
  already implemented.
- `chapter/kits.md`, Damage Bonuses: the kit bonus follows the Melee+Weapon or Ranged+Weapon
  keywords, including area abilities. Printed kit-signature damage already includes it (V109).

### Inventory

The regenerated V72 report moves exactly 30 envelopes from compatibility to compiled (42 → 72), with
no demotions. Every one was read against its source. Each has only damage, `push N` and V88
save-ends potency nodes, plus at most the area terrain rider. The live inventory is asserted in
`tests/scripts/live-compiled-report.test.ts`.

| Corpus | Abilities (path under `feature/ability`, `kit` or `monster`) |
| --- | --- |
| Hero (7) | Censor Back Blasphemer!; Dragon Knight Draconian Pride; Elementalist Bifurcated Incineration and Unquiet Ground (terrain rider); Fury Back!; Shadow Two Throats at Once; Troubadour Quick Rewrite (potency, terrain rider) |
| Kit (2) | Guisarmier Forward Thrust, Backward Smash; Rapid-Fire Two Shot |
| V1 roster foe (1) | Goblin Assassin Shadow Chains |
| Other foes (20) | Big Animal B Natural Weapon; Predator B Wild Swing; Chimera Roar; Ruinant Bloodletting Claws; Aeolyxria Spittlesplash; Lydixavus Ice Lob; Phrrygalax Spinning Spit; Servitor War Walker Stunning Blast; Brush Stalker Gore and Reclamation; War Spider Leg Blade; Wode Hag Corrosive Claws; Medusa Snake Bites; Radenwight Bruxer Flurry of Bites; Shambling Mound Seismic Slam; Multivok Bodyguard Gatling Bolt Gun; Multivok Chief Pneumatic Punch; Voiceless Talker Artillerist Mind Jolt; Voiceless Talker Evolutionist Psionic Intrusion; Toxic Eye Toxic Vapors |

Only one release-gate roster foe gains here. Most roster target-boundary abilities also carry
Effect prose, non-save-ends conditions, slide/pull or villain-action headers. Those are the next
slices.

### Engine ability design and playtest evidence

| Ability | Source | Expected per-tier damage (source, plus kit) | Proof |
| --- | --- | --- | --- |
| Back Blasphemer! | `censor/level-1/back-blasphemer.md` | 2/4/6 holy + Cloak and Dagger +1 = 3/5/7; push 1/2/3 per target | headless `multi-target` |
| Back! | `fury/level-1/back.md` | 5/8/11 + Panther +0/+0/+4 = 5/8/15; push —/1/3 per target | headless |
| Quick Rewrite | `troubadour/level-1/quick-rewrite.md` | 4/5/6 (Magic, not Weapon); P2 potency 0/1/2 | headless, `tests/scripts/multi-target.test.ts` |
| Two Shot | `kit/rapid-fire.md` | 4/6/8 printed (kit bonus included) | headless |
| Two Throats at Once | `shadow/level-1/two-throats-at-once.md` | 4/6/10 | pure test |
| Shadow Chains | `monster/goblin/statblock/goblin-assassin.md` | 2/4/5 corruption; A < 0/1/2 restrained | headless, app test |

## Acceptance checks

1. `tests/scripts/multi-target.test.ts`:
   - One area roll gives per-target tiers from per-target edges.
   - Per-target damage and conditions come in printed order, and the terrain rider occurs once.
   - Counted envelopes accept 1..max distinct targets and refuse zero, over-max or duplicate
     targets.
   - A target-subject rider stays manual on a counted envelope but not on one target.
   - Self, unknown and Area-inconsistent envelopes keep the boundary.
2. `tests/app/multi-target.test.ts` (convex-test, registered operations):
   - Shadow Chains against three creatures applies and resists per target.
   - A fourth target is refused.
   - Correcting one target changes only that target's occurrence and instance.
   - A later correction of another target ends that target's preserved instance by its original
     identity and keeps the first correction.
3. `tests/scripts/live-compiled-report.test.ts` names the 30 additions. `pnpm compiled:check` and
   the V67 report are fresh.
4. TESTER: `CI=true pnpm check`, plus the isolated public API journey
   `SALIENT_HEADLESS_COHORT=multi-target node scripts/verify-character-headless.ts`. The journey
   uses legal builds and real campaign dice, and reads back per-target damage, push occurrences,
   Quick Rewrite applied/resisted instances, one rider disposition, a one-target correction that
   keeps the other target's instance, the over-max refusal, and Shadow Chains per-target results.
5. An independent rules and implementation review passes before deployment.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V110` at `cce0416` in `.worktrees/engine-targets`. The user
  directed ENGINE2 to run the slice in its own thread with its own tester and deploy subagents.
  Astra is unavailable.
- Blocker survey on `cce0416`: the target boundary is the largest shared blocker (hero 128, foe
  887), but it is usually combined with other blockers. The roster decision was confirmed
  2026-09-24. On the roster, Shadow Chains is the only ability whose sole blocker is the target
  boundary.
- Authoring found and fixed a latent correction defect that only multi-target exposes. The earlier
  code re-resolved from the original inputs, so a second correction reverted the first corrected
  target's tier. It also re-revisioned every target's occurrences, which orphaned other targets'
  condition instances. The app test covers both.
- Authoring checks: focused scripts tests 103/103 and app tests 1/1 (V110) plus 8/8 (V88
  regression) passed. Engine `tsc` and eslint on the changed files are clean. Full suite and
  headless run are TESTER's job.
