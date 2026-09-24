# Elementalist (essence): heroic-resource ledger, levels 1–3

Independent research subagent, 2026-09-24, read-only against the pinned `en/unified/md`.

## Identity

- Essence, floor 0, no maximum.
- No gain outside combat. There the cost is waived once until a Victory or a respite.
- The Summoner's resource is also called essence, so generation must be keyed by class.

## Gains

- **Combat start:** "…you gain essence equal to your Victories." (`feature/elementalist/level-1/essence.md`)
- **Turn start:** "At the start of each of your turns during combat, you gain 2 essence."
  - Level 7 raises it to 3 (outside scope).
  - Persistent Magic (`feature/elementalist/level-1/persistent-magic.md`): maintaining reduces the
    turn-start gain by the ability's persistent value.
  - "You can't maintain any abilities that would make you earn a negative amount of essence at the
    start of your turn."
  - Taking damage of at least 5 × Reason in one turn stops all maintenance.
  - Persistent values at levels 1–3:
    - 1: Behold the Mystery, The Flesh a Crucible, Instantaneous Excavation, No More Than a
      Breeze, O Flower Aid, Swarm of Spirits, Wall of Fire;
    - 2: Conflagration.
- **T1:** "the first time each combat round that you or a creature within 10 squares takes damage
  that isn't untyped or holy damage, you gain 1 essence."
  - The Elementalist taking the damage: OBSERVABLE.
  - Another creature within 10 squares: PARTLY, because the app has no positions.
  - Level 4 raises it to 2.

## Loss

"You lose any remaining essence at the end of the encounter." Persistent abilities end then too.

## Ambiguities

1. Whose "one turn" counts for the 5 × Reason rule?
2. Does typed damage reduced to 0 count?
3. Mixed typed and untyped damage.
4. The timing of maintenance against the gain.
5. Which ability to drop at the cap (the player's choice).
6. Non-combat stressful situations.
7. The essence name collision with the Summoner.

## Boundary

- Automate:
  - +Victories at combat start;
  - the turn-start gain of 2 minus maintained persistent values, with a guard against negative
    gains;
  - the loss at encounter end;
  - T1 when the Elementalist takes typed damage that isn't holy.
- Needs a table prompt: T1 for another creature within 10 squares.
- Manual: the persistent effects themselves and choices at the cap.
