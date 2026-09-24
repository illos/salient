# Shadow (insight): heroic-resource ledger, levels 1–3

Independent research subagent, 2026-09-24, read-only against the pinned `en/unified/md`.

## Identity

- Insight, floor 0, no maximum.
- No gain outside combat (the cost is waived once until a Victory or a respite; already
  implemented).

## Gains

- **Combat start:** "…you gain insight equal to your Victories." (`feature/shadow/level-1/insight.md`)
- **Turn start:** "At the start of each of your turns during combat, you gain 1d3 insight."
  - Level 7 changes this to 1d3 + 1 (outside scope).
- **T1:** "the first time each combat round that you deal damage incorporating 1 or more surges, you
  gain 1 insight."
  - Only rolled damage can include surges (`rule/damage/rolled-damage.md`).
  - Surge spending is not recorded, so this is PARTLY observable: ask the table after the Shadow
    deals damage.
  - Level 4 raises it to 2.

## Cost rule

- Edge discount: "Whenever you use a heroic ability that makes use of a power roll, that ability
  costs 1 fewer insight if you have an edge or double edge on it", even if only one target has the
  edge.
- This is not implemented, and it is PARTLY observable because edges are counted per roll.

## Loss

"You lose any remaining insight at the end of the encounter."

## Ambiguities

1. What counts as "incorporating surges" (spent on damage, potency, or fully prevented damage)?
2. Surges restricted to one strike.
3. Which abilities get the edge discount: Shadowstrike, So Gullible, Too Slow, Sticky Bomb.
4. Does the discount apply to "Spend X" entries?
5. Clever Trick's cost comes from the frontmatter.
6. Non-combat stressful situations.

## Boundary

- Automate: +Victories at combat start, 1d3 at each turn start, and the loss at encounter end.
- Table prompts: T1 (did this damage include surges?) and the edge discount when rolling.
- Manual: Victories-scaled "Spend 1+" outside combat, and stressful situations.
