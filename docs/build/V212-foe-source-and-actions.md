# V212: Foe source accounting and action discovery

Rules review: required. Depends on: V211.

## Goal

Make every selected monster feature reachable through an honest source-linked action, passive
effect or manual entry, and maintain a roster report that distinguishes recognition from execution.

## Scope

- Bind the 189 named records in the [inventory](../v1-foe-engine-inventory.md), headers and
  referenced general rules to stable source identities. Keep printed text and parent privacy.
- Extend foe source/action discovery beyond `feature_type=ability`: trait actions, Malice
  references, group traits, fixed creature free strikes and optional contextual actions.
- Supply a reusable trait/feature descriptor; do not implement 189 hard-coded action handlers.
- Include End Effect, Provoking Nettles and later conditional javelin/granted-action entries with
  explicit manual status until their executing slices land. No false `compiled` label.
- Report per clause: source, compiler status, supported operation, dependency and persisted proof.

Spec: `docs/table-spec.md#confirmed-action-and-log-contract`;
`docs/engine-architecture.md#from-rules-text-to-executable-behavior`.
Sources: inventory files; `rule/monster/monster-trait.md`, Traits;
`rule/monster/creature-free-strike.md`, Creature Free Strikes;
`monster/dragon/statblock/thorn-dragon.md`, Provoking Nettles.
Likely paths: `convex/lib/resolve.ts`, `compiledSource.ts`, shared foe/source contracts and action UI.

## Acceptance checks

1. Proposed cohort `foe-discovery`: load all 36 definitions through `foe.add`/`squad.add`, query
   their permitted action lists, compare names and source identity with the inventory. Traits
   that grant actions must have registered UI/CLI/API routes, including conditional availability.
2. Thorn Dragon's Provoking Nettles appears; passive Withering Wyrmscale Aura is separately
   identified; neither acquires a fabricated action cost. Used text excludes unrelated private features.
3. An ordinary player cannot operate a foe or read unused private stat-block data. The Director's
   invocation and manual completion persist source and attribution. Paused/closed sessions refuse writes.
4. Alter a source clause/revision and prove source drift refuses automatic execution. Retry an
   unchanged manual operation without duplicate log/state; undo/redo retains source identity.
5. Report reconciles all records and explicitly states that mapped/manual behavior is not executed.
   Test runs the shared gate and `foe-discovery`; QC reviews the source accounting.

## Work log

- 2026-09-25: registered by V211. Proposed cohort and checks; no implementation or test results yet.
