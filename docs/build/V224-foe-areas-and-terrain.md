# V224: Foe areas, auras and terrain consequences

Rules review: required. Depends on: V217, V219, V221, V222; V223 for death-created zones.

## Goal

Extend table-maintained areas to selected foe zones and auras, applying only consequences whose
membership and movement facts are known, with durable source and cleanup.

## Scope

- Acid pools, Swamp Gas/Stink, Dust Cloud, Shadow Drag/Drag Through Hell terrain, Death Grasp,
  Bonetrops, The Grasping the Hungry, Earth Sink and membership-driven traits/buffs in the inventory.
- Multiple independent placed zones versus moving auras; keyword/side/size/winded filters;
  enter/start/end/movement-distance triggers, first-in-round limits and source-specific endings.
- Support minion members via V215's explicit pool/turn semantics; objects stay manual until a
  supported object model exists. Narrow terrain instances may serve Bramble in V227; broader V20
  arbitrary terrain/destructible world editing remains a separate scope.
- A membership add is enter; it is not displacement, a path, proximity or one square of movement.
  Event facts for movement/ground/line of effect are explicit and journaled.

Spec: `docs/table-spec.md#persistent-area-effect-cards`;
`docs/engine-architecture.md#knowledge-of-rules-and-knowledge-of-the-board`.
Sources: inventory V224 blocks; `rule/combat/aura.md`, `rule/combat/area-of-effect.md`;
automation rulings section 6. Likely paths: `shared/resolve/areas.ts`, `convex/lib/areas.ts`,
watchers, movement facts, effect membership cards.

## Acceptance checks

1. `foe-areas`: Arixx Spitfire/Acid Spew area lasts through encounter; eligible enemy first enter
   in a round takes 2 acid. Leaving/re-entering does not reset the limit. Turn-start rider follows
   its own printed trigger; creating the area under an initial member does not invent an enter event.
2. Swamp Gas: non-goblin actually moves 3 squares inside → 6 poison; goblin/bugbear takes none.
   Membership add alone does not claim three squares. Owner's next turn or 0 Stamina ends it.
   Gust of Wind cannot disperse the explicit wind-proof zone.
3. Bone casualty creates one Bonetrops zone; first enemy entry takes 1 and ends it. Death Grasp
   waits for M < 2; nonqualifying entry does not consume it. Death removal does not erase terrain early.
4. Grasping zone end-turn test applies new restrained before final save phase under standing
   policy; failed save retains start-turn 1d6 damage, with recorded dice and source-linked expiry.
5. Unknown grounded/same-position/line-of-effect inputs produce explicit pending work. Area/trait
   grouping never silently overrides distinct source durations or stacking rules.
6. Test gate plus `foe-areas` and existing area regression. Read members, firings, source durations,
   minion pool effects, saved dice, removal and undo/redo; log deferred table browser scenarios.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
