# V222: Foe traits, modifiers and lasting effects

Rules review: required. Depends on: V216, V217, V219. Accepted Q-FOE-5 sets Overwhelm to the current turn.

## Goal

Apply the roster's source-linked passive rules, marks, next-roll benefits and restrictions to
later shared operations, with exact subject, scope and expiration.

## Scope

- Inventory V222 clauses: Crafty, Slip Away, Supernatural Insight, Disorganized, Hunger, Earthwalk,
  Vukenstep, Soft Underbelly; source-owned marks, taunts, concealment, attack prevention and next-roll effects.
- Twist Shape bundles slowed/fire weakness; Carving Dagger hide prevention ends with its bleeding;
  Sucker Punch trigger prevention ends next round; Phantom Flow immunity uses V224 membership.
- Periodic grab damage, cumulative Zombie hunger consequence and explicit manual cure; Commander
  condition removal choice; Overwhelm current-turn no-shift restriction using supplied turn-start adjacency facts.
- Encounter buffs from Get Reckless!, Form Up!, Show Them the Great Fear and consumed Malice
  modifiers. Do not copy Tactician Mark benefits onto Blackguard's You!.

Spec: `docs/lasting-effects-design.md#2-modifier-pipeline`;
`docs/rules-adaptation-principles.md#faithful-automation-and-deliberate-departures-are-different`.
Sources: named blocks in inventory; `condition/prone.md`, `condition/taunted.md`,
`rule/combat/cover.md`, `rule/combat/concealment.md`, `rule/combat/opportunity-attack.md`,
`rule/general/saving-throw.md`. All paths are relative to the pinned unified Markdown root.
Likely paths: shared modifier predicates, effect instances, source feature profiles, clock/observations.

## Acceptance checks

1. `foe-traits`: prone hero's melee strike against Arixx replaces the prone bane with double edge;
   ranged strike does not. Supernatural Insight ignores supernatural concealment only; ordinary
   cover/concealment inputs remain distinguishable. Crafty does not make all free strikes impossible.
2. You! grants an edge on the blackguard's own and each ally's abilities against its target
   until the start of the blackguard's next turn, without Tactician resource/Recovery rewards.
   Assert both beneficiaries, no edge against an unmarked target, and expiry at that turn start.
   Next-strike edge/bane consumes on the next qualifying strike even if cancelled, with expiration and source identity preserved.
3. Twist Shape's higher-tier failed potency gives slowed and fire weakness 10 under one save;
   saving ends both, without retroactively increasing the initiating damage. Tier 1 gives only slowed.
4. Arixx Bite deals 3 acid at qualifying size-1 grabbed turn start; larger grabbed subject does
   not take it. Zombie Clobber deals 2 corruption per qualifying start; three unreduced firings
   cross the printed cumulative-5 threshold. Reduced damage counts actual damage, not nominal 2.
5. Commander offers a chosen condition removal at ally start with confirmed line of effect.
   Sucker Punch denies ordinary/free reactions until next round; removing its grab does not
   implicitly erase that independent prohibition. Overwhelm uses confirmed start-of-turn adjacency
   to an enemy knave, blocks shifting through that turn, survives moving away and expires at End
   turn. Starting nonadjacent then moving adjacent does not trigger it; the next turn needs its
   own facts. Missing facts stay unresolved, never silently treated as nonadjacent.
   Prove the spatial answer and persisted restriction through the shared API, with wrong-user
   refusal, duplicate submission, correction and undo/redo checks. Multiple sources must not
   cause duplicate prompts/effects; exact card layout remains a proposal under Q-FOE-5.
6. Test gate plus `foe-traits` and focused modifier/clock regression. Read restrictions, saved
   effect groups, expiry, resource effects, chosen removals and full undo/redo state.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
- 2026-09-25: V233 records accepted Overwhelm duration and a proposed minimum-input spatial
  flow. The duration is settled; no UI design or runtime implementation is claimed as approved/built.
