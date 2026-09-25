# V225: Werewolf Accursed Rage

Rules review: required. Depends on: V213, V218, V221, V222.

## Goal

Persist Accursed Rage separately from heroic ferocity and resolve its source-defined turn-start
compulsion, including the stormwight exclusion and respite behavior.

## Scope

- Accursed Bite/Ripping Claws/Berserker Slash/Rampage tier rage and Howl's independent rage gain.
- ≥10 rage at turn start expends rage, then supplied nearest-creature movement and melee free
  strike before normal actions; damage recipient gains 1 rage, with source-defined exclusions.
- Hero and foe recipients keep their appropriate free-strike mechanics. Rage is a named effect
  counter with source/history, not a heroic-resource substitution or an arbitrary condition string.
- Ordinary rage clears on respite; V226 adds lycanthropy's exception. No automatic nearest target.

Spec: `docs/table-spec.md#game-clock-and-scheduled-rules-work`;
`docs/table-spec.md#respite-mode`.
Sources: `monster/werewolf/statblock/werewolf.md`, Accursed Rage and named attacks/Howl;
`monster/group/werewolf.md`, On Wights and Weres; `rule/monster/creature-free-strike.md`.
Likely paths: custom effect counters, clock/continuations, action opportunities, respite cleanup.

## Acceptance checks

1. `foe-rage`: Bite tier 1/2/3 adds 2/4/5 rage to eligible enemy, none to stormwight Fury; damage
   still applies to the stormwight. Ripping Claws tier 1 adds no rage, tier 2/3 adds 1/3.
2. Start with 9 rage → no compulsion; start with 10 → expend rage and pending compulsory
   sequence. No ordinary turn action executes ahead of required sequence completion/adjudication.
3. Confirm nearest creature, enact shift, execute recipient's melee free strike. A damaged
   eligible target gains 1 rage; immunity reducing all damage to zero does not satisfy takes-damage.
4. Howl adds 4 to every qualifying encounter enemy already at ≥1 rage, including outside the
   burst; zero-rage enemy gains none from this clause. Its Intuition-test outcomes remain independent.
5. Ordinary respite clears accumulated rage, not a heroic pool. Retry/undo of the granting hit,
   compulsion or respite restores counters and child attacks; no double expenditure or forced strike.
6. Test gate plus `foe-rage` and targeted respite/clock regression; read counters, source event,
   sequence, Stamina, dice and completed boundary. V226's cursed retention remains pending.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
