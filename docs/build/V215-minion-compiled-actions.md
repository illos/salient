# V215: Compiled minion actions and captain parity

Rules review: required. Depends on: V212.

## Goal

Apply shared compiled semantics to the ten selected minion definitions while preserving V02's
squad rules and adding the selected captain speed/range benefits currently left manual.

## Scope

- Coordinated signature actions, individual permitted actions and Free Strike Together share
  effect application with the ordinary route. Recognizing `per minion` does not bypass squad semantics.
- Preserve one roll, one ability instance per target, up to three contributors, action participation,
  captain bonuses, casualty choices and pool defenses. Add +2 speed and +5 ranged distance forms.
- Give supported per-member conditions/watchers an explicit shared-turn identity; prevent repeated
  global turn work and once-per-target riders multiplying with contributors. Later rider slices
  must run through this same route.
- Ordinary minions cannot regain Stamina, become winded or gain temporary Stamina. Revival and
  Ravenous Horde exceptions are separately sourced in V223, not generic healing changes.

Spec: `docs/table-spec.md#minion-squads-and-captain-state`.
Sources: `chapter/monster-basics.md`, Using Minions / Shared Low Stamina / Minion Weakness and
Immunity / Squad Action / Minion Maneuvers / Free Strike Together; `rule/monster/captain.md`,
Captain Benefits; all ten minion stat blocks and With Captain headers in the inventory.
Likely paths: `convex/lib/squadOperations.ts`, `squads.ts`, `shared/resolve/squad.ts`, compiled application.

## Acceptance checks

1. `foe-minions`: three Spinecleavers on one unarmored target at tier 2 deal 4 + 2 + 2 = 8;
   with captain +1 strike damage, 9, and only one push-3 instruction. A separate target gets
   its own instance, with the same roll but its own edges/banes and potency facts.
2. Two simultaneous Spinecleaver free strikes with that captain deal (2+1)+(2+1)=6 as one strike.
   The signature captain bonus is once per target, free-strike bonus once per contributing minion.
3. Human Archer ranged distance 10 becomes 15 with captain; Crawling Claw speed 6 becomes 8.
   Detachment/death removes those benefits; undo restores them. Critical extra action only for participants.
4. Rotting Fist tier-3 M < 2 with size 1 gives prone; size 2 gives slowed save ends; M = 2 gives
   neither. Compound conditions and sourced per-member riders do not duplicate by contributor count.
5. Multi-hit area damage applies squad immunity/weakness once after aggregation per the source;
   casualty identity and death events persist exactly once, including pending choice and undo.
6. Ordinary healing/temp-Stamina/winded automation does not run on a minion. Dead/opted-out
   contributors, a fourth contributor, individual maneuver participation and captain actions preserve
   current coherent-state checks and rule-warning distinctions. Test gate plus `foe-minions`.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
