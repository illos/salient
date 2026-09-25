# V226: Werewolf form, curse and Shared Ferocity

Rules review: required. Depends on: V214, V225. Q-FOE-3 affects Shared Ferocity's limit.

## Goal

Complete the werewolf's form and persistent-curse behavior, retaining explicit source gaps and
story cure decisions while automating their defined combat consequences.

## Scope

- Full Wolf overrides size/speed/stability and adds strike damage/rage/Bite potency until death
  or encounter end; enter combat hybrid, external shape change remains a reported rules conflict.
- Accursed Bite's optional cost, per-target increasing potency after failed application,
  lycanthropy turn-end rage and respite retention. Cure is explicit table resolution linked to
  the printed Find a Cure project; no fabricated downtime implementation.
- Blood In Their Eyes holy-damage interval, temporary Stamina and speed; Moonfall line-of-effect
  facts, action choice and rage gain; Shared Ferocity recorded 1d3 with Q-FOE-3 limit.

Spec: `docs/lasting-effects-design.md`;
`docs/table-spec.md#respite-mode`;
`docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`.
Sources: Werewolf stat block and Malice file named blocks; `monster/group/werewolf.md`, Shared
Ferocity; `rule/health/temporary-stamina.md`; `project/find-a-cure.md`, including corpse prerequisite and cure creation.
Likely paths: effect-derived actor facts, potency history, damage observations, clock/respite.

## Acceptance checks

1. `foe-werewolf`: Full Wolf sets size 3, speed 10, stability 2, strike damage +2, added rage +1,
   Bite potency +1. Repeated effect does not compound; death/encounter end restores underlying values.
2. On one target, paid Bite potency begins P < 0, failed effect increases the next attempt's
   potency to 1; another target starts independently. Full Wolf adds its own +1 without rewriting history.
3. Lycanthropy adds 2 rage at affected combat turn end and retains rage after respite. An explicit
   recorded cure clears the affliction under its source, not by an arbitrary encounter cleanup.
4. Blood In Their Eyes grants max(current temp, 10), speed +3 until turn end; prior holy damage
   since last turn end triggers the printed restriction. Ordinary unrelated damage does not.
5. Moonfall grants one extra move or maneuver only with line of effect to moon; existing-rage
   eligible creature gets +2 at its end. Shared Ferocity, after Q-FOE-3, rolls 1d3 exactly once per
   accepted scope and requires an ability that costs ferocity plus line of effect.
6. Test gate plus `foe-werewolf`: read actor facts, counters, cost, history, turn allowance, curse
   and cleanup through public queries. Undo/redo preserves rolls and all modifier dependencies.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
