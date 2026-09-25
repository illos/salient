# V214: Foe Malice features and payments

Rules review: required. Depends on: V212, V213.

## Goal

Expose band and basic Malice through shared operations, with exact activation windows, eligibility,
costs and use history; execute the bounded first buffs and extra-main-action grants.

## Scope

- Basic and seven band/solo feature lists; Goblin-keyword bugbears can access Goblin Malice without
  paying for the alias as well as the selected feature. Once-per-turn feature accounting and start window.
- Fixed, variable and per-recipient costs: 1+, 3+, 5+, 7+, 1 per minion; require explicit choices.
  Refuse unaffordable activation and preserve remaining payload as manual until its slice lands.
- Initial payloads: Goblin Mode, Brutal Effectiveness, Malicious Strike, Burning Maw, Exploit
  Opening and Solo Action. Reuse modifiers and action opportunities; exact clauses drive consumption.
- Grant Alchemical Device to eligible non-minion human and iron-ball/javelin maneuvers to paid
  bugbears; later use must not charge the activation twice. V217/V218 supplies those payloads.

Spec: `docs/table-spec.md#ability-costs-and-optional-spending`;
`docs/table-spec.md#game-clock-and-scheduled-rules-work`.
Sources: `rule/monster/malice.md`, Spending Malice / Basic Malice; all seven Malice files in inventory;
`rule/general/always-round-down.md`. Likely paths: foe discovery, resource payment, modifiers, clock.

## Acceptance checks

1. `foe-malice`: at Goblin Warrior's turn start, Goblin Mode pays 3 once and grants speed +2 to
   qualifying goblins including bugbears, not humans; expires at round end and undoes completely.
2. With 2 Malice, a 3-cost activation is refused and changes nothing. A duplicate command after a
   successful 3-cost activation never pays again. Player/paused/stale source cases are refused.
3. Malicious Strike on a Might-3 highest-characteristic actor: spend 5 adds 3 to one target;
   spend 7 adds 5; cap extra damage at 9. Declare a rule-warning/manual policy for spending beyond
   useful cap from source, never silently repurpose it. No use in consecutive rounds, even by
   another monster; read shared history after undo/redo.
4. Brutal Effectiveness waits through an ability with no potency; qualifying next ability gets
   +1 potency exactly once. Burning Maw next strike has an edge and +3 acid as sourced typed damage.
5. Solo Action pays 5, grants one additional main action even dazed, and adds no turn. Other
   dazed restrictions remain correctly represented. Exploit Opening checks target conditions per target.
6. Test gate plus `foe-malice`; read balance, effects, opportunities and log through authenticated APIs.
   Preserve existing hero gains triggered by a Director spending Malice without duplicating them.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
