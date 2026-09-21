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

- Source review at `fdf9c87`: ENGINE found no blocking rules defects. Eighteen embedded uses
  complement twenty Fury/Stormwight source abilities. Two ordinary-kit signatures are also exercised.
  Forms and Growing Ferocity remain source-visible manual effects (thresholds 2/4/6 at level one;
  benefits last through own turn even after spending). Optional costs debit Ferocity; the source's
  repeat-use lock and variable-spend Victories total outside combat remain manual.
- Both authoring typechecks passed. TESTER generated content/audit/support reports at `fdf9c87`,
  exits 0 (1.00/0.68/0.89s), 1362 content entries; artifacts
  `/srv/presidium/projects/salient/test-artifacts/V101-fdf9c87-generation`.
- Independent six-witness ledger checks exposed kit-dependent features evaluated before kit.choice.
  Moved those automatic grants after the kit choice. Focused `character-v101-fury.test.ts` passes 2/2.
  Existing V25/V32 expected action lists explicitly gain Lines of Force: Enhance and Out of the Way!: Follow;
  their numerical expectations stay sourced and unchanged.
- `scripts/headless/fury.ts` is cohort `fury`: six builds, forty distinct action uses, ordinary↔Stormwight
  draft pruning, admitted-build separation, source-derived damage/cost/readback and Tide self-safety.
  The ledger is written directly from the pinned source and independently audited; no Forge run requested.

- TESTER `ddc7edf`: generators passed, full check stopped at three historical comparison failures
  (384 engine passes; no backend started). The two V101 embedded uses are now asserted as the exact
  delta before the legacy full-output comparison; the Forge comparison documents their representation
  inside parent abilities. No runtime change. Artifacts: `/srv/presidium/projects/salient/test-artifacts/V101-ddc7edf`.
