# Beastheart (ferocity): heroic-resource ledger, levels 1–3

Independent research subagent, 2026-09-24, read-only against the pinned `en/unified/md`. All rules
are in `feature/beastheart/level-1/ferocity.md`.

## Identity

- Ferocity, floor 0, no maximum.
- The name collides with the Fury's ferocity, so generation must be keyed by class.
- The companion spends from the same pool.
- No gain outside combat. There the cost is waived and the ability is locked until a Victory or a
  respite; a variable spend counts as Victories.

## Gains

- **Combat start:** +Victories.
- **Turn start:** "At the start of each of your turns during combat, you gain 1d3 ferocity."
  - The companion shares the Beastheart's turn, so it is one roll.
  - Level 7 makes it 1d3 + 1.
- **T1:** "the first time each combat round that a creature adjacent to your companion takes damage,
  you gain 2 ferocity."
  - PARTLY observable: adjacency is a position, and the companion is not an app actor.
  - Level 4 raises it to 3.

## Loss and rampage

- "You lose any remaining ferocity at the end of the encounter."
- Rampage (`rampage.md`): the companion gains rampage equal to ferocity spent, and loses it at the
  end of the encounter. It is rampaging at 8, with further thresholds at 8 and 12 at levels 1–3.

## Ambiguities

1. Does a shared space count as adjacent?
2. Does damage to the companion itself trigger T1? Probably not.
3. Stressful situations.
4. The timing of the combat-start grant.
5. Is Heart of the Beast "Spend 1–5" a variable cost outside combat?
6. The Unstoppable title and Fury ferocity (echelon 2).

## Boundary

- Automate: +Victories at combat start, 1d3 at each turn start, and the loss at encounter end.
- Table prompt: T1 once per round, plus a manual button.
- Count only: rampage, as the sum of recorded spends. Its effects stay manual until the companion is
  an actor.
