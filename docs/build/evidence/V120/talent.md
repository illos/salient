# Talent (clarity): heroic-resource ledger, levels 1–3

Independent research subagent, 2026-09-24, read-only against the pinned `en/unified/md`. Main
source: `feature/talent/level-1/clarity-and-strain.md` (C&S).

## Identity

- Clarity, floor −(1 + Reason); already implemented. Below 0 the Talent is strained. No maximum.
- No gain outside combat. There the cost is waived and the ability is locked until a Victory or a
  respite; plus the 1d6 one-minute rule and voluntary strain.

## Gains

- **Combat start:** +Victories.
- **Turn start:** "At the start of each of your turns during combat, you gain 1d3 clarity." No change
  at levels 1–3.
- **End of own turn:** "At the end of each of your turns, you take 1 damage for each negative point
  of clarity."

## Triggers

| # | Trigger | Level / tradition | Frequency | Observability |
| --- | --- | --- | --- | --- |
| T1 | "the first time each combat round that a creature is force moved, you gain 1 clarity." | L1, all | once per round | PARTLY: compiled forced movement is visible, but actual movement isn't |
| T2 | Entropic Bolt strained: "You gain 1 clarity when you obtain a tier 2 or tier 3 outcome" | L1 | each strained use | OBSERVABLE |
| T3 | Perfect Clarity: the target's next power roll at tier 3 gives +1 clarity | L1, 5 clarity | once per use | PARTLY |
| T4 | Fling Through Time strained: tier 3 gives +2 clarity | L3, 7 clarity | each strained use | OBSERVABLE |

## Loss

"You lose any remaining clarity or reset any negative clarity at the end of the encounter": clarity
goes to 0.

## Ambiguities

1. Zero-distance forced movement for T1.
2. Objects for T1.
3. Rolled or selected tier after a downgrade.
4. T3's window.
5. The strain boundary for Fling Through Time's gain.
6. Is the end-of-turn strain damage reducible?
7. The combat-start trigger and Victories timing.
8. The turn start while dying.

## Boundary

- Automate:
  - +Victories at combat start and +1d3 at each turn start;
  - the end-of-turn negative damage, pending ruling 6;
  - reset to 0 at encounter end;
  - T2 and T4 from recorded tier and clarity.
- Table prompts: T1, on a compiled push, pull or slide, plus a manual button; T3 through a pending
  rider.
- Manual: stressful situations, out-of-combat waivers, and the one-minute and voluntary strain.
