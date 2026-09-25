# V228: Connected V1 foe proof and residual manual work

Rules review: required. Depends on: relevant completed slices V212–V227.

## Goal

Prove interactions across the implemented roster track and report its actual automatic,
fact-assisted, manual and decision-pending behavior without rerunning already accepted evidence.

## Scope

- Reconcile all 189 named records against per-slice source-derived proofs; verify every exposed
  action has UI/CLI/API reachability and each passive effect has an observed trigger and saved result.
- New connected cases: mixed goblin/bugbear warband; undead + cultist revival; human leader with
  minions; Arixx two-turn acid/grab fight; Werewolf rage/curse/respite; Thorn Dragon aura/terrain.
- Only unproven interaction boundaries get new tests. Accepted per-feature tests are reused for
  unchanged code. Fix discovered defects in their owning scope and route through QC/Test.
- Inventory every remaining manual clause and unanswered question. Broader V03/V20 and excluded
  monsters do not become accidental gates for this roster.

Spec: `docs/v1-roadmap.md#version-one`;
`docs/build/README.md#programmatic-headless-completion-gate`;
`docs/rules-adaptation-principles.md#show-the-source-and-the-work`.
Sources: complete [inventory](../v1-foe-engine-inventory.md); expected values inherited from cited
source cases, never from generated execution output.

## Acceptance checks

1. `foe-connected` (new scenarios only): a Goblin Mode buff affects bugbear but not human; captain
   bonus and reaction revision feed squad damage correctly; pool deaths create one source hazard each.
2. Cultist revives a known dead minion after a prior area casualty; its linked death at encounter
   closeout does not trigger duplicate rewards, remove unrelated squads or retain a stale turn.
3. Arixx takes both turns, with start/end-dependent effects between them and one shared villain
   action budget. Acid zone survives correctly while unrelated grab effect ends after escape.
4. Werewolf rage compelled attack, Full Wolf and cursed respite; Thorn Dragon healing suppression,
   d6/d3 extra damage, effect ending and free reaction form complete saved causal chains.
5. For each journey: Director and player views honor privacy; retries and undo/redo preserve
   source/dice/costs; pause/close deny writes. Actual persisted readback is recorded by Test.
6. QC reviews final omissions and incorrect-rule risks, Test supplies exact commit/artifacts,
   QC clears Deploy. Report accepted feature evidence plus residual table work. Deployment performs
   publication steps without a new smoke/live suite. Deferred table UI scenarios remain in backlog.

## Work log

- 2026-09-25: registered by V211; no implementation or test results.
