# V219: Foe reaction holders and damage consequences

Rules review: required. Depends on: V213, V217, V218.

## Goal

Offer and resolve foe damage responses and retaliations using existing causal revision and
shared action windows, preserving the distinction between targeting and actual damage triggers.

## Scope

- Foe holders at encounter start and add/remove/revive; alive/source checks, ordinary/free action
  budgets, dazed/surprised/specific prohibitions, Director ownership and same-trigger ordering.
- Skitter, Shadow Veil, Shriek, Parry!, Arcane Shield, Shoot the Hostage and the knave's trait
  response; later Catcher, Flying Sawblade and dragon event hooks accept explicit qualifying facts.
- Reuse option B for damage changes: revise consequences and retained spent gains. Targeting
  triggers exist even if final damage is zero; don't substitute damage-taken events for them.
- Retargeting, before-resolution harm and roll-tier changes remain V220/Q-FOE-1.

Spec: `docs/lasting-effects-design.md#4-triggered-actions-and-reactions`;
`docs/table-spec.md#inline-interaction-cards-in-the-game-log`.
Sources: named V219 inventory blocks; `rule/combat/triggered-action.md`;
`rule/damage/damage-immunity.md`, `rule/general/always-round-down.md`;
`docs/decisions/2026-09-24-automation-rulings.md`, damage revision.
Likely paths: `convex/lib/triggeredActions.ts`, `damageRevisions.ts`, holder index and clock.

## Acceptance checks

1. `foe-reactions`: Arixx hit for 9 accepts Skitter → 4 before defenses; shift instruction follows
   triggering resolution. Wrong owner, dead actor, stale window and duplicate accept change nothing.
2. Blackguard Parry! halves damage with **no** hero-Parry potency reduction. Shadow Veil also
   creates strike protection to the ally's next turn. Save/expiry and source relationships persist.
3. Shriek can qualify on a strike targeting the ghost even when immunity makes final damage zero;
   its 2 sonic retaliation still follows its printed trigger. Damage-taken-only traits do not fire then.
4. Shoot the Hostage with 9 incoming damage uses 4 for brawler and remainder 5 for grabbed size≥1S
   subject before source-defined defense ordering; derive and review that ordering explicitly. No eligible
   hostage → no split. Changes to the grab or original hit reconcile both records or require rewind.
5. Players' same-trigger responses precede Director creatures' responses as sourced. A free
   reaction does not consume ordinary allowance; a trait with no action cost must not acquire one.
   Automatic retaliations have causal guards against duplicate/recursive firing.
6. Test gate plus `foe-reactions` and affected existing damage-response regression; read offer,
   revised Stamina/conditions/resources, action usage and journal after acceptance, undo and redo.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
