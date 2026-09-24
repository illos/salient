# Censor (wrath): heroic-resource ledger, levels 1–3

Independent research subagent, 2026-09-24. Read-only against the pinned Compendium
`en/unified/md`. Paths below are relative to it.

Every level 1–3 wrath rule is in `feature/censor/level-1/wrath.md`. No level 2 or 3 feature, order,
domain or kit changes generation; the first change is at level 4 (Wrath Beyond Wrath).

## Identity

- Wrath, floor 0: only clarity may go below 0 (`chapter/introduction.md`). No maximum.
- No gain outside combat: "Though you can't gain wrath outside of combat…". Out of combat, a cost
  is paid without spending wrath, and the same ability or effect can't be used out of combat again
  until a Victory or a respite.

## Gains

- **Combat start:** "At the start of a combat encounter or some other stressful situation tracked in
  combat rounds (as determined by the Director), you gain wrath equal to your Victories."
- **Turn start:** "At the start of each of your turns during combat, you gain 2 wrath."
  - Level 7 raises it to 3 and level 10 to 4 (outside scope).
- **T1:** "the first time each combat round that a creature judged by you … deals damage to you, you
  gain 1 wrath."
- **T2:** "The first time each combat round that you deal damage to a creature judged by you, you
  gain 1 wrath."
  - Level 4 raises it to 2.
  - Judged: `feature/ability/censor/level-1/judgment.md`. It lasts until the end of the encounter,
    re-use, willing end, or another censor judging the target. Judged is not a condition, and the
    app does not persist it yet, so T1 and T2 are PARTLY observable.

## Loss

"You lose any remaining wrath at the end of the encounter."

## Optional complications (manual)

- Feytouched: +1 Heroic Resource at combat start for 3 Malice.
- Self-Taught: forgo the turn-start gain for a damage bonus.

## Ambiguities

1. Does damage reduced to 0 by immunity count as "deals damage"? Recommended reading: no, only
   applied damage greater than 0.
2. Does damage absorbed by temporary Stamina count?
3. Does the turn-start gain apply in non-combat "stressful situations"?
4. Does Self-Taught's forgo cover triggered gains too?
5. Is "first time each combat round" per Censor rather than per judged creature? Probably per
   Censor.

## Boundary

- Automate:
  - the combat-start gain equal to Victories;
  - +2 at each turn start;
  - the loss at encounter end;
  - floor 0, no maximum, source-linked logs, and no duplicate grant after history.
- T1 and T2: automate once a judged relation is recorded from a Judgment use. Until then, the table
  confirms them.
- Keep manual: the complication choices and non-combat situations.
