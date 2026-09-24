# Tactician (focus): heroic-resource ledger, levels 1–3

Independent research subagent, 2026-09-24, read-only against the pinned `en/unified/md`. All
sources are in `feature/tactician/level-1/focus.md`.

## Identity

- Focus, floor 0, no stated maximum.
- No gain outside combat. There the cost is waived and the ability is locked until a Victory or a
  respite.

## Gains

- **Combat start:** +Victories.
- **Turn start:** "At the start of each of your turns during combat, you gain 2 focus."
  - Level 7 raises it to 3 and level 10 to 4.
- **T1:** "the first time each combat round that you or any ally damages a creature marked by you
  …, you gain 1 focus."
  - A mark comes from Mark, Mind Game, Fog of War, Targets of Opportunity, Out of Position or a
    retarget.
  - A mark ends at the end of the encounter, when the Tactician is dying, when Mark is used again,
    by a willing end, or when another tactician marks the creature.
  - Marks aren't tracked state, so this is PARTLY observable.
  - Level 4 raises it to 2.
- **T2:** "The first time in a combat round that any ally within 10 squares of you uses a heroic
  ability, you gain 1 focus."
  - Only allies count, not the Tactician.
  - "Heroic" means an ability with a fixed resource cost (`rule/general/heroic-ability.md`).
  - PARTLY observable: the range is a position.

## Loss

"You lose any remaining focus at the end of the encounter."

## Ambiguities

1. Zero damage after immunity.
2. Does a new mark from another ability end older marks? The text suggests only reusing Mark does.
3. Marked objects are probably not "creatures".
4. The range prompt for T2.
5. Heroic abilities used by an ally for free probably still count.
6. The turn-start gain while dying is still granted.

## Boundary

- Automate: +Victories at combat start, +2 at each turn start, and the loss at encounter end.
- Table prompts:
  - T1: damage to a creature derived as marked from recorded mark uses;
  - T2: an ally's heroic ability use, with a range confirmation.
- Manual: mark state until it is tracked, and item or curse modifiers.
