# V227: Thorn Dragon linked effects and domain

Rules review: required. Depends on: V214, V217, V218, V219, V221, V224.
Q-FOE-4 affects domain rider durations only.

## Goal

Connect dragonsealed, healing suppression, forced movement, briars and dragon reaction actions
through the existing shared mechanisms, including the group-text Domain trait.

## Scope

- Virulent Breath's target tests and dragonsealed effect; distinguish actual d6/d3 damage dice
  from ability-roll damage and guard against recursive self-triggering extra damage.
- Withering aura healing and winded enter/start riders; Spinous Tail optional 1d3/bleeding;
  Investiture gain from actual pulls; Prickly/Thorny reactions; Provoking Nettles action/limit.
- Cage, Bramble square records with health/fire weakness, Thorned Armor, two no-cost Brambles
  and encounter riders from Malign Thicket, Afflictive Overgrowth tests.
- Domain declaration and sourced riders. Terrain positions/paths/grounding stay supplied; no map
  implementation. Q-FOE-4 keeps unspecified duration behavior explicitly manual.

Spec: `docs/table-spec.md#persistent-area-effect-cards`;
`docs/table-spec.md#game-clock-and-scheduled-rules-work`;
`docs/engine-architecture.md#structured-effects-are-the-common-contract`.
Sources: `monster/dragon/statblock/thorn-dragon.md`, all named blocks;
`monster/dragon/thorn-dragon-malice.md`, all four features;
`monster/group/dragon.md`, Thorn Dragon's Domain;
`rule/damage/rolled-damage.md`, `rule/general/always-round-down.md`.
Likely paths: source effects, typed damage dice, healing pipeline, area/terrain instances and reactions.

## Acceptance checks

1. `foe-thorn-dragon`: lower two Might-test tiers create dragonsealed. A later 1d6/1d3 damage
   instance adds recorded 1d3 once; plain tier-based ability damage does not. Ending dragonsealed
   offers Prickly Situation once, including successful save and explicit ending with valid source.
2. Healing 9 inside aura becomes 4 for another creature; dragon's own healing unaffected. Winded
   eligible member enter/start damage uses saved 1d3. A minion never gets ordinary healing.
3. Investiture pays 5, selects dragonsealed enemies and confirms two actual pulls → 10 temporary
   Stamina (max with current), not 5×all selected targets. Failed/no displacement does not invent a pull.
4. Provoking Nettles action exists, once-per-turn history survives a Thorned Armor granted use;
   confirmed traversal of an enemy gives 3 once. Thorny Scales costs 1 and uses static dragon free
   strike, then M < 2 bleeding with correct subject next-turn expiry.
5. Each Bramble square has 5 Stamina and fire weakness 5; two no-cost uses by Malign Thicket
   remain independently tracked. Supplied forced path of three affected squares gives 3 damage,
   with distinct Malign Thicket poison/weakened rider. Do not guess collision/location damage.
6. Domain declaration needs ≥1 week occupancy fact. Its turn-start speed reduction excludes
   the source dragon only: another creature, including another dragon, is affected; the source
   dragon is not. The grounded-restraint bleeding predicate has no source-owner exclusion.
   Unanswered duration cases remain manual.
   Test gate plus `foe-thorn-dragon`; read dice, members, terrain health, costs, effects and undo/redo.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
