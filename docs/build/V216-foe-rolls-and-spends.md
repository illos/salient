# V216: Foe roll clauses and optional Malice variants

Rules review: required. Depends on: V212, V214.

## Goal

Compile the selected roster's ordinary roll clauses and paid variants without dropping their
conditions, keyword/target changes or dependent work.

## Scope

- Inventory V216 rows: damage/condition tiers, actor-name references, edge/hidden/prior-grab bonuses,
  damage-type choice, self-prone, extra targets, additional forced distance, and area/strike variants.
- Typed parameter choices precede resolution; derived cost, targets, keywords, roll modifiers and
  minion damage routing all consume the same chosen variant. No string patch only in the UI.
- Apply independent clauses only where justified; follow-up grabs, child actions, persistent effects
  and custom boss resources remain linked to their owning slices, honestly manual until available.
- Retain all six baseline compiled abilities and inspect every newly affected source envelope.

Spec: `docs/engine-architecture.md#from-rules-text-to-executable-behavior`;
`docs/table-spec.md#ability-costs-and-optional-spending`.
Sources: each V216-named block in the inventory, especially Assassin Sword Stab, Channeler Blistering
Element, Roughneck Haymaker, Storm Mage Lightning Bolt, Chief Kneel Peasant, Zombie Dust and Ghost
Awful Wail; `rule/character/potency.md`, `rule/damage/damage-immunity.md`.
Likely paths: shared grammar/compiler, `convex/lib/abilityOperations.ts`, input contracts and forms.

## Acceptance checks

1. `foe-rolls`: source-derived all-tier expectations for each newly accepted envelope. Sword Stab
   tier 2 = 6 normally, 8 with qualifying edge; cancelled-edge interpretation must be cited explicitly.
2. Blistering Element tier 2 deals 3 of the chosen type; a fire-immune target and acid-immune target
   respond to their actual selected type. Missing/unknown type choice refuses coherent automatic result.
3. Lightning Bolt costs no Malice normally; pay 5 to use the printed 10×1 enemy/object area.
   It is not a Strike or Ranged ability in that mode. Verify changed effects, modifiers and squad routing.
4. Trick Crossbow 3-Malice extra target, Chief 2-Malice extra target, Kneel's 2-Malice burst and
   Roughneck 5-Malice burst preserve distinct envelopes. Unaffordable use changes no state.
5. Zombie Dust's self-prone occurs with its own use; Awful Wail tests winded after damage and only
   qualifying P < 2 targets become Stamina 1. No false inference from starting Stamina alone.
6. Test gate plus `foe-rolls`; authenticated readback includes per-target damage, conditions,
   modifiers, payment and unresolved rider records. Source mutations and retry/undo cover new shapes.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
