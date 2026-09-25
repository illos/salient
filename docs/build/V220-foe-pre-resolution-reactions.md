# V220: Foe pre-resolution and roll-changing reactions

Rules review: required. Depends on: V219 and Q-FOE-1.

## Goal

Apply the triggering attack immediately, then offer a contextual Director response card that
revises its result if used within the accepted window, preserving the complete causal result.

## Scope

- Monarch Meat Shield, Sneak Clever Trick, Chief Bloodstones and Werewolf Facepalm and Head Slam.
- Distinguish declaration/targeting, roll, application and later damage-revision phases. Do not
  reinterpret target replacement as damage transfer, or reuse a previous target's defenses/potency.
- Q-FOE-1 confirms resolve-first interaction following character reactions: no blocking response
  step. Meat Shield appears on a dynamic Director card after the player's action applies.
- Use the shared hero/monster triggered-card window: the next committed action closes the
  unused card, even in the same turn. Next individual turn start remains the outer deadline.
  Unresolved source-specific consequences and Facepalm's timing antecedent stay explicit/manual.

Spec: `docs/engine-architecture.md#proposed-resolution-lifecycle`;
`docs/table-spec.md#director-edits-to-inline-results`;
`docs/table-spec.md#inline-interaction-cards-in-the-game-log`.
Sources: the four named blocks and `rule/combat/triggered-action.md`, same-trigger ordering.
Likely paths: ability operation, contextual offers, response-window validity, linked result revision.

## Acceptance checks

1. `foe-interruptions`: the original strike applies without waiting for the Director. An eligible
   Meat Shield card permits a linked revision, retaining the original roll and history. Use an ally
   with different defenses/characteristics; revised damage and potency use that ally. Remove
   displaced effects coherently; declining/leaving the card unused retains the original result.
   Clever Trick costs 1 and checks its distinct enemy/distance target rule.
2. Bloodstones costs 5 irreducible corruption damage, improves a tier by one within valid tiers,
   changes all tier-dependent effects and retains original dice. It is not a reroll or new critical hit.
3. Facepalm's qualifying approach fact enables prone and 5 damage at the approved phase; absent
   approach does not qualify. Verify what happens if that damage removes the attacker from play.
4. Ordered competing hero/foe reactions, stale target changes, retry, cancellation and undo/redo
   cannot commit two original attacks, spend twice or leave effects on a displaced target.
5. Prove no mandatory pause, Director authority, stale-card refusal at next individual turn start,
   and closure on the next committed action by either side, including within the same turn. End turn alone is not the outer cutoff.
6. Test gate plus `foe-interruptions`; compare original/final targets, roll and saved state through
   the public readback. QC must review the explicit answer and affected character pathways first.

## Work log

- 2026-09-25: registered by V211, decision-dependent. No implementation or test results.
- 2026-09-25: V229 records the user's resolve-first/card-revision direction. The prior blocking
  response proposal is withdrawn. The user confirmed next-action closure across hero and monster
  triggered cards; unconfirmed source readings remain open.
