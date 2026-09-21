# V101: Complete Fury level one

Rules review: required. Depends on: V83, V96, V100.

## Goal

Complete level-one Fury creation and editing with all three primordial aspects, the four
Stormwight kits and every printed level-one ability choice. Preserve the existing Berserker
level-two boundary; this slice does not enable Reaver or Stormwight progression.

## Scope

- All three characteristic arrays, exploration/intrigue skills, Berserker/Reaver/Stormwight.
  Berserker and Reaver retain all 21 ordinary kits; Stormwight selects Boren, Corven, Raden or Vuken.
- Stormwight permanent kit bonuses, signature, Aspect of the Wild, per-kit aspect/form/storm and
  Growing Ferocity source features. Form-dependent size, movement, equipment restrictions,
  negotiation, transformation and timed Ferocity thresholds stay explicit/manual.
- All four signature, four 3-Ferocity and four 5-Ferocity options; three aspect triggers;
  optional paid effects and source-embedded actions in sheet and shared ability.use route.
  Supported rolls/costs persist; unresolved clauses remain visible manual text.
- Source-only expected ledger covering all aspects, four kits, three arrays and all new actions;
  public save/prune/readback and ability-use journey. Existing level-two limits remain.

Spec: docs/character-wizard-spec.md#3-decision-system
Spec: docs/character-wizard-spec.md#9-shared-operations-and-reliability

Pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, under
`vendor/steel-compendium/en/unified/md/`: `class/fury.md`, `feature/fury/level-1/`,
`feature/ability/fury/level-1/`, `feature/ability/fury/stormwight-kits/aspect-of-the-wild.md`,
`feature/fury/stormwight-kits/`, `feature/fury/{boren,corven,raden,vuken}/` and the matching `kit/`
entries. The clean Heroes text supplies ability group membership. No Forge output is rules evidence.

## Acceptance checks

1. Focused source-ledger evaluator checks prove class/kit numbers, grants, legal choices and pruning.
2. TESTER generators and `CI=true pnpm check` pass; reports retain existing supported effects.
3. TESTER `SALIENT_HEADLESS_COHORT=fury` runs authenticated creation, admission, aspect/kit edits,
   shared ability.use calls and persisted state/event readback for every new action. Costs are checked
   against the source ledger, including insufficient-resource rejection and the outside-combat waiver.
4. Independent pinned-source review passes; DEPLOY2 publishes accepted main without repeating tests.
   Browser scenarios recorded under the standing moratorium.

## Work log

- 2026-09-21: registered from main `53b7853`, branch `slice/V101`, worktree `.worktrees/class-fury`.
  User requests full level-one Fury subclass choices. ENGINE owns independent source/final review.
