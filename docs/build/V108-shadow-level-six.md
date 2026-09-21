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

- Author checks: both TypeScript projects pass; focused source-ledger/transition/ancestry test 3/3 passes. Eight core builds cover every characteristic choice, all four arrays, all colleges and eleven ability envelopes; two additional persisted Spark builds cover native and borrowed level-six values.
- TESTER generation at `46b27e3` passed content/audit/support (1.06/0.74/1.03s), 1654 entries. Artifacts `/srv/presidium/projects/salient/test-artifacts/V108-46b27e3-generation`.
- New source abilities remain compatibility routes: Shadowfall and Black Ash Eruption roll damage with movement manual; You Talk Too Much rolls damage with both dazed and communication manual (the compiler rejects its extra section). No condition automation is claimed. Faster vial rolls while drinking and tier benefits stay manual. Into the Shadows/Puppet Strings initially record and pay without premature damage.
- `shadow-level-six` cohort covers 32 new distinct uses (11 envelopes/21 embedded), blocked costs, outside-combat waiver, inherited signature damage with A3, and persisted target-state readback.

- ENGINE static final review passed `13f6feb`, including the source ledger and proof. [Written review](audits/V108-shadow-rules-review.md) distinguishes manual condition handling from runtime evidence.
- TESTER first full attempt at `f5e2ed5` found three legacy provenance-string assertions; restored the exact first-echelon wording in `13f6feb` while retaining the new second-echelon label. All other 399 engine tests passed. Focused repair files then passed 16/16.
- Remaining app/scripts at `13f6feb` passed 602 tests; the historical V88 inventory guard needed the eleven reviewed new envelope IDs explicitly added. Original rows/hashes and classification assertions remain unchanged. Retain passing gates for the bounded retry.

- TESTER accepted `542f452`: focused audit and all remaining gates passed, combining retained results for 1005 unique tests (402 engine +603 app/scripts). Isolated `SALIENT_HEADLESS_COHORT=shadow-level-six` exited0 in68.3s: eight core builds, two additional Spark admissions, all32 new uses, inherited damage and outside-combat waiver; level/college edits and state readback passed. Backend stopped, ports freed, checkout released clean. Artifacts `/srv/presidium/projects/salient/test-artifacts/V108-542f452`; earlier failed reports retained. This is resumed acceptance, not a claim of one uninterrupted full run.
- [Independent source audit](audits/V108-shadow-source-audit.md) and [inherited-growth audit](audits/V108-inherited-growth-audit.md) retained. ENGINE bounded review passes `542f452`; production behavior unchanged from the reviewed provenance repair.
- Frozen handoff to DEPLOY2: reuse these gates, run only required release build/publication, no smoke or suite reruns. No runtime configuration or schema migration needed.
