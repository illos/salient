# V227: Thorn Dragon linked effects; Domain deferred

Rules review: required. Depends on: V214, V217, V218, V219, V221, V224.
Q-FOE-4 shelves Domain automation for later environmental-effect review.

## Goal

Connect dragonsealed, healing suppression, forced movement, briars and dragon reaction actions
through the existing shared mechanisms. Retain the group-text Domain trait as explicit manual
source text while its environmental-effect design is deferred.

## Scope

- Virulent Breath's target tests and dragonsealed effect; distinguish actual d6/d3 damage dice
  from ability-roll damage and guard against recursive self-triggering extra damage.
- Withering aura healing and winded enter/start riders; Spinous Tail optional 1d3/bleeding;
  Investiture gain from actual pulls; Prickly/Thorny reactions; Provoking Nettles action/limit.
- Cage, Bramble square records with health/fire weakness, Thorned Armor, two no-cost Brambles
  and encounter riders from Malign Thicket, Afflictive Overgrowth tests.
- Domain remains source text when used, with manual disposition under Q-FOE-4. No automatic
  Domain speed/bleeding, activation toggle or inferred flight exception in this slice. Its
  future encounter-start Director enable/disable control and classification need later review.
- Malign Thicket's Domain-dependent turn-start poison stays manual while Domain eligibility is
  shelved; its independent effects proceed. Other terrain positions/paths/grounding stay supplied.

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
6. Domain use retains source text and explicit manual status through the UI/shared route; it
   creates no automatic speed modifier, bleeding, or domain-dependent Malign Thicket poison.
   Do not hide the trait or label its text as automated support. The deferred review must retain
   source-dragon-only speed exemption (other monsters included), current-turn speed duration,
   and the separate grounded-restraint predicate. Flight and bleeding duration remain unresolved.
   Test gate plus `foe-thorn-dragon`; read dice, members, terrain health, costs, effects and undo/redo.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
- 2026-09-25: V232 records the user's Domain deferral. Text/manual presentation remains;
  encounter activation and environmental classification are later work. Independent dragon effects proceed.
