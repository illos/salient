# V223: Foe reinforcements, revival and delayed death

Rules review: required. Depends on: V214, V215, V218. Q-FOE-2 affects Ravenous Horde only.

## Goal

Create and revive real monster instances through journaled roster/squad operations, preserving
death provenance, initiative, source limits and later cleanup.

## Scope

- Get in Here!, Ravenous Horde, Decaying Touch's specter conversion and Rise, My Minions.
- Arise/Endless Knight death replacement with once-use history and damage/body predicates.
- Dread March temporarily defers defeat until sequence completion; death-trigger traits emit
  once with actual selected casualty identities for V224's residual terrain.
- Ordinary minions cannot heal or be winded. Revival is its own printed effect; Ravenous Horde's
  source conflict stays explicit pending Q-FOE-2. Rebuild squad pools without reviving unselected bodies.
- Keep summoned/spawned foe identities and prepared groups distinct; minion squads remain at most eight.

Spec: `docs/table-spec.md#foes-roster`;
`docs/table-spec.md#minion-squads-and-captain-state`;
`docs/table-spec.md#formal-encounter-closeout`.
Sources: named inventory blocks; `chapter/monster-basics.md`, Shared Low Stamina / Dropping One
Minion; `rule/monster/squad.md`; `rule/health/winded.md`; `rule/health/stamina.md`, Director-Controlled Creatures. Likely paths: foe/squad lifecycle, death observations, clock/journal.

## Acceptance checks

1. `foe-lifecycle`: Monarch pays 1 → exactly two new Goblin Runners, correct source, squad and
   remaining-turn placement. Retry creates none extra; undo removes spawn and restores cost.
2. Zombie first qualifying non-fire/non-holy defeat with intact body leaves Stamina 10 and prone;
   Skeleton/Ghoul leave 1. A second defeat kills them. Fire/holy or destroyed body does not consume
   an invented revival. Read used flag and undo it with its causal hit.
3. Specter paid potency rider: a qualifying living target killed by that hit creates one specter
   at next-round start, not immediately; a survivor/death from another hit does not qualify.
4. Cultist revives three selected eligible dead minions for 3 Malice, with source-defined full
   Stamina contribution and no unrelated pool/casualty reset. Revive the same selected minion again
   legally; cultist death and encounter end each defeat only its still-linked revivals once.
5. Ravenous Horde checks adjacency at round end, not activation. Before Q-FOE-2, winded/pool
   result remains manual; after answer, encode its exact full/remaining/step numbers and survivors
   in independent expectations. Consecutive-round attempt is identified even with a different undead actor.
6. Dread March participant reaching 0 remains until that march finishes; completion emits defeat
   once. Test gate plus `foe-lifecycle`; read roster, pools, casualties, turns, delay registrations and log.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
