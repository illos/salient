# V217: Foe grabs and confirmed movement consequences

Rules review: required. Depends on: V215, V216.

## Goal

Bind grabs and dependent damage/healing to their actual source and supplied movement facts, so
instructions never masquerade as completed movement or guessed adjacency.

## Scope

- Own-grab prerequisites, selected target grabs, source-linked periodic effects and Escape Grab
  penalties; source exceptions such as Claw Swing's multiple grabs remain explicit.
- Shared continuation facts: actual movement distance/type, final adjacency, landing, traversal,
  grabbed/released state and secondary recipient. Use existing forced-movement result contracts.
- Execute fixed/formula secondary damage and healing: Tiny Stabs/Kill!, Death Scythe, Necrotic
  Bolt, Bone Bow, Drag Through Hell, iron-ball/javelin throws and Chief adjacency rider.
- Preserve objects as explicit manual state where unsupported; no hidden generic damage tool.

Spec: `docs/engine-architecture.md#knowledge-of-rules-and-knowledge-of-the-board`;
`docs/table-spec.md#director-fine-tuning-and-deliberate-damage-tool-omission`.
Sources: inventory V217 blocks; `condition/grabbed.md`, `movement/forced-movement.md`,
`rule/monster/creature-free-strike.md`, Stat Block Self-Reference;
`rule/health/temporary-stamina.md`, `rule/general/always-round-down.md`.
Likely paths: movement/grab contracts, ability continuations, shared damage/healing and journal.

## Acceptance checks

1. `foe-movement`: Drag Through Hell paid 3, actual drag 3 squares → 6 damage, then release/prone;
   unresolved distance leaves dependent damage pending. Retry continuation does not deal 6 again.
2. Whip tier-2 pull-2 does not itself prove adjacency; confirmed adjacent adds 3 corruption,
   confirmed nonadjacent adds none. Re-check source event/window before accepting late input.
3. Iron Ball thrown 3 squares deals 5; Javelin thrown 3 deals 9, M < 1 gates their distinct conditions.
   Javelin's pull action exists only while its own bleeding effect remains.
4. Death Scythe actual damage 9 heals 4 before applicable healing modifiers/cap; damage reduced
   to 5 heals 2. Necrotic Bolt's selected non-minion recipient heals 1, not the attacked target by default.
5. Throw requires the acting bugbear/brawler's grab; enforce coherent source ownership. Test ally
   collision-damage exception and ending grab only after the appropriate separation/teleport fact.
6. Test gate plus `foe-movement`; persist and read facts, effects, child damage, cost and undo/redo.
   Movement instruction alone fires no movement watcher. Per-target missing facts remain visible.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
