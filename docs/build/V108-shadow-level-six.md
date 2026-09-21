# V108: Shadow through level six

## Goal

Extend all Shadow colleges through target level six in the full build wizard and shared API.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices; guided progression stays deferred.
- Pinned Shadow Basics, advancement table, and every feature/ability under levels 4–6: characteristic increase, any skill and perks, college features and all eleven new ability envelopes.
- Second-echelon kit Stamina and inherited level-dependent ancestry statistics. Source-derived characteristics, potency and Recovery values update existing abilities too.
- Source-timed embedded uses are explicit manual records where the engine lacks spatial, form, potion or trigger state. Into the Shadows and Puppet Strings cannot deal damage before their printed prerequisites. No claim of automatic forms, teleportation or potion consumption.

## Acceptance checks

1. Independent source ledger covers all colleges, all level-five/six alternatives, levels four through six, characteristic selections and independent perk slots.
2. Authenticated headless cohort proves save/resume, target-level pruning, admission, every new action's payment and persisted result; compiled damage/conditions read back from targets.
3. TESTER generates content/support reports, runs full checks and the isolated cohort. ENGINE independently reviews source and proof. DEPLOY2 reuses accepted results for publication.

## Work log

- Started from main `90ebdd5`, branch `slice/V108`, worktree `.worktrees/shadow-six`.
- ENGINE source audit identifies 14 feature files, 11 ability envelopes, characteristic and echelon transitions, and explicit delayed/before-damage timing boundaries.
