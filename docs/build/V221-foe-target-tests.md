# V221: Foe effects resolved by each target's test

Rules review: required. Depends on: V214, V216.

## Goal

Model abilities that ask each target to make a characteristic test, rather than incorrectly
rolling once for the attacking monster or treating the defender's success as an attack tier.

## Scope

- Werewolf Howl, Thorn Dragon Virulent Breath, Goblin Swamp Stink, Arixx Geyser, undead Grasping
  and Hungry and Thorn Dragon Afflictive Overgrowth.
- Preserve each target's characteristic, own accepted roll and applicable modifiers, outcome,
  source consequence and optional response. Required results may remain pending independently.
- Reuse shared test/dice infrastructure with an explicit source-defined outcome table. No
  fabricated attacking characteristic, ability critical or one-roll-all-targets shortcut.
- V225/V227 supply rage/dragonsealed; V224 supplies later area-triggered tests.

Spec: `docs/table-spec.md#freeplay-baseline-and-combat-transition`;
`docs/engine-architecture.md#determinism-and-shared-state`.
Sources: the six named inventory blocks; `rule/test/test.md`, `rule/dice/power-roll.md`,
`rule/dice/ability-roll.md`. Inspect test-specific modifiers and natural outcomes before coding.
Likely paths: compiler roll contract, shared test resolution, dice operations and result cards.

## Acceptance checks

1. `foe-target-tests`: Virulent Breath targets independently achieve totals ≤11, 12–16, ≥17:
   receive 12/9/5 poison respectively, dragonsealed only for the first two. No caster roll is substituted.
2. Howl's low test outcome gives forced retreat instruction and frightened save ends; middle
   frightened EoT; high no test effect. Separate encounter-wide rage clause is not suppressed by high tier.
3. Geyser low/middle deals 4 plus vertical push 5/3; high asks safe-space shift. Swamp Stink low
   deals 5 poison damage once plus weakened, middle only weakened, high neither. Weakened lasts
   until the mist disappears; assert that no damage-weakness modifier is created.
4. The Grasping, the Hungry deals 5 in all three tiers; restrained save ends/EoT/none differs.
   Afflictive Overgrowth deals 12/9/5 poison with its printed restrained/bleeding durations.
5. Actor/player/Director authority, partial target completion, duplicate input, already-removed
   target and undo/redo retain coherent saved state. A declined optional roll replacement is not paid.
6. Test gate plus `foe-target-tests`; persisted readback includes distinct accepted dice and
   per-target effects. Existing ordinary hero/foe ability roll semantics remain a focused regression.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
