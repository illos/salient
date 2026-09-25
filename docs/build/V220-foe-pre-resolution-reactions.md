# V220: Foe pre-resolution and roll-changing reactions

Rules review: required. Depends on: V219 and Q-FOE-1.

## Goal

Resolve target replacement and effects that change an attack before resolution with an explicit
user-approved timing contract, preserving the complete causal result.

## Scope

- Monarch Meat Shield, Sneak Clever Trick, Chief Bloodstones and Werewolf Facepalm and Head Slam.
- Distinguish declaration/targeting, roll, application and later damage-revision phases. Do not
  reinterpret target replacement as damage transfer, or reuse a previous target's defenses/potency.
- Queued proposal Q-FOE-1 chooses a narrow pre-resolution opportunity versus full replay/revision
  or continued manual handling. Implementation dependent on that answer stays manual meanwhile.

Spec: `docs/engine-architecture.md#proposed-resolution-lifecycle`;
`docs/table-spec.md#director-edits-to-inline-results`;
`docs/table-spec.md#inline-interaction-cards-in-the-game-log`.
Sources: the four named blocks and `rule/combat/triggered-action.md`, same-trigger ordering.
Likely paths: pending resolution/continuation contract, ability operation, offers, result revision.

## Acceptance checks

1. `foe-interruptions` (after decision): Meat Shield replaces target identity before effect
   resolution. Use an ally with different defenses/characteristics; damage and potency use that ally.
   Clever Trick costs 1 and checks its distinct enemy/distance target rule.
2. Bloodstones costs 5 irreducible corruption damage, improves a tier by one within valid tiers,
   changes all tier-dependent effects and retains original dice. It is not a reroll or new critical hit.
3. Facepalm's qualifying approach fact enables prone and 5 damage at the approved phase; absent
   approach does not qualify. Verify what happens if that damage removes the attacker from play.
4. Ordered competing hero/foe reactions, stale target changes, retry, cancellation and undo/redo
   cannot commit two original attacks, spend twice or leave effects on a displaced target.
5. Test gate plus `foe-interruptions`; compare original/final targets, roll and saved state through
   the public readback. QC must review the explicit answer and affected character pathways first.

## Work log

- 2026-09-25: registered by V211, decision-dependent. No implementation or test results.
