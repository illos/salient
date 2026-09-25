# V218: Granted foe actions and ordered sequences

Rules review: required. Depends on: V213, V215, V216.

## Goal

Execute optional free strikes, granted maneuvers/signature uses and multi-action sequences with
their real actors, source overrides, costs and ordering through the shared operations.

## Scope

- Source-linked child-action opportunities for all V218 inventory rows; each has exact eligible
  actor, target, action, lifetime and use count. Show in UI and CLI/API action lists/cards.
- Movement instructions with before/during/after ordering; a dependency waits for supplied facts
  when they affect the child action. Preserve recipient choice and ability source.
- Reuse static foe free strikes, independent rolled child attacks and simultaneous squad free
  strikes; do not flatten multi-attack text into an unrelated multi-target roll.
- Dread March sequence records completion for V223's delayed deaths; no duplicate open-ended grants.

Spec: `docs/table-spec.md#inline-interaction-cards-in-the-game-log`;
`docs/engine-architecture.md#structured-effects-are-the-common-contract`.
Sources: inventory V218 blocks, especially Underboss Swordplay, Blackguard Advance!/Zweihander,
Scoundrel Dagger Storm, Raider Handaxes, Commander You Next!/Fall Back!, Undead Dread March;
`rule/monster/creature-free-strike.md`, `chapter/monster-basics.md`, Free Strike Together.
Likely paths: action opportunities, ability execution, UI cards and authenticated headless client.

## Acceptance checks

1. `foe-sequences`: Swordplay grants one chosen ally one free strike; only the Director controls
   foe execution, and retry/second click cannot duplicate the child. Decline records no attack.
2. Dagger Storm pays 5 once, then up to three Rapier and Dagger uses with separately recorded
   rolls and shifts; Advance! grants two Zweihander uses. Ordinary main action is not charged twice.
3. Raider charge's ranged free strike resolves before Handaxes. Its damage/defeat consequences
   affect later target validity; simultaneous minion free strikes use the V215 rule, not arbitrary ordering.
4. Blackguard's 1 Malice replaces the granted free strike with a signature use, not both.
   Lead From the Front's altered target limit and adjacent ally grants retain their printed bounds.
5. Malign Thicket later grants exactly two no-cost Bramble uses while preserving source/cost
   override provenance; a normal Bramble still costs 5. Include a generic contract fixture now,
   and the real dragon journey in V227, without inventing current dragon support.
6. Test gate plus `foe-sequences`: read parent/child uses, dice, payments and opportunities; undo
   reverses the sequence safely, redo restores recorded rolls, expiry does not leave reusable grants.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
