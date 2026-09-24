# Conduit (piety): heroic-resource ledger, levels 1–3

Independent research subagent, 2026-09-24, read-only against the pinned `en/unified/md`. Only
`feature/conduit/level-1/piety.md` and `domain-piety-and-effects.md` grant piety at levels 1–3.

## Identity

- Piety, floor 0, no maximum.
- No gain outside combat. There the cost is waived and the ability is locked until a Victory or a
  respite.

## Gains

- **Combat start:** gain piety equal to your Victories.
- **Turn start:** "At the start of each of your turns during combat, you gain 1d3 piety."
- **Optional prayer**, chosen before the roll:
  - a roll of 1: +1 piety, plus 1d6 + level psychic damage that can't be reduced;
  - a roll of 2: +1 piety;
  - a roll of 3: +2 piety, plus a domain prayer effect of the player's choice.
- Later levels, outside scope: level 7 makes it 1d3 + 1, and level 10 adds 1 when praying.

## Domain triggers

Each grants 2 piety the first time in an encounter; the hero has exactly two domains. One event can
trigger both.

| Domain | Trigger | Observability |
| --- | --- | --- |
| Creation | a creature within 10 squares uses an area ability | PARTLY (range) |
| Death | a non-minion within 10 squares drops to 0 Stamina, or a solo within 10 becomes winded | PARTLY |
| Fate | an ally within 10 gets a tier-3 power roll, or an enemy within 10 gets tier 1 | PARTLY |
| Knowledge | the Director spends Malice | OBSERVABLE |
| Life | a creature within 10 squares regains Stamina | PARTLY |
| Love | you or an ally within 10 uses Aid Attack or an ability that targets an ally | PARTLY |
| Nature | you or a creature within 10 takes acid, cold, fire, lightning, poison or sonic damage | PARTLY (own damage: observable) |
| Protection | you or an ally within 10 gains temporary Stamina, or uses a damage-reducing or bane triggered action | PARTLY / MANUAL |
| Storm | an enemy within 10 is force moved | MANUAL |
| Sun | an enemy within 10 takes fire or holy damage | PARTLY |
| Trickery | you or a creature within 10 takes the Aid Attack or Hide maneuver | PARTLY / MANUAL |
| War | you or a creature within 10 takes damage greater than 10 + level in a single turn | PARTLY |

## Loss

"You lose any remaining piety at the end of the encounter."

## Ambiguities

1. Sun and War wording (V100): the domain entries govern.
2. War "in a single turn" means a total per turn.
3. Death's two first-time clauses: once per clause, or once overall?
4. Does "a creature" include the Conduit (Creation, Death, Life)?
5. Love: does a self-only target count?
6. Trickery: does a Hide inside another ability count?
7. Damage reduced to 0.
8. Test tiers for Fate.
9. Protection's triggered-action classification.

## Boundary

- Automate:
  - +Victories at combat start;
  - 1d3 at each turn start with a recorded pray choice, including the prayer outcomes and the
    self-damage on a 1;
  - the loss at encounter end;
  - Knowledge, when Malice is spent;
  - a once-per-encounter latch per domain.
- Confirm range with the table: Creation, Death, Fate, Life, Love, Nature, Protection's temporary
  Stamina, Sun and War. The Conduit's own events need no range prompt.
- Manual: Storm, Protection's triggered actions, Trickery (unless maneuvers are logged), the
  prayer effect chosen on a 3, and out-of-combat locks.
