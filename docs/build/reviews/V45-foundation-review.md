# V45 independent foundation review

Reviewer: `wizard_plan_review`, 2026-09-19. Implementer: character integration lead and
`foundation_content`. Review baseline: `9fb4fa6`; candidate: staged, uncommitted `slice/V45`
on integration parent `944a46a`, identified by the V45 candidate hash manifest.
This reviewer did not implement application code. Initial review and repaired-candidate static
re-review are recorded below. Repository, exact-preservation, portable-reference and applicable
browser evidence have now been reviewed. Shared playable delivery remains the lead's post-merge gate.

## Verdict

**Pass — pre-merge implementation audit, 2026-09-19.** Both initial static blockers are repaired.
The unchanged candidate has passing evidence for all applicable foundation acceptance scenarios.
The retained intermittent backend timeouts and account rate limits are acknowledged below; they
are not certified fixed. No remaining V45 implementation blocker was identified. This verdict
permits the lead's commit/integration procedure; it does not attest shared rollout completion.

## Findings

1. **Repaired: retained Devil trait projection called removed symbols.**
   `shared/evaluate/character.ts`, `traits()`, still calls `this.purchasedTraits()` and reads
   `TRAIT_EFFECTS[name]`, while this candidate deletes the helper and its import. This prevents
   typechecking and causes Devil evaluation to fail when assembling traits. Restore the helper
   and import or move the projection into the ancestry module while preserving its output.
   Re-review: `appendDevilTraits` now owns the unchanged signature/purchased projection in the
   Devil module, where `TRAIT_EFFECTS` is imported; `traits()` invokes it in its original position.
   The removed symbols are no longer referenced in `character.ts`.
2. **Repaired: nullable trait selected as provenance.**
   `shared/evaluate/ancestries/devil.ts`, `applyDevilSavingThrow`, reads `(string | null)[]`
   directly and passes `trait` to `Provenance.selection`, whose type is `string | undefined`.
   Computing `effect` through a conditional expression does not narrow the later `trait` value.
   Preserve the original helper's explicit null filtering or guard `trait` before the lookup.
   Re-review: `applyDevilSavingThrow` now explicitly filters null entries with a string type
   predicate before reading effects and building provenance, matching the original helper.

## Static preservation assessment

- Definition extraction retains the original IDs, sources, budgets, support flags and class
  profiles in the inspected families. Composition replaces the original family rows at their
  old positions and clones module-owned rows before V37 extensions. Exact assembled definition
  equivalence is now supported by the recorded executable comparison below.
- Moved contribution blocks retain Fury's separate kit-dependent baseline, level-two +9 Stamina,
  source sentences, provenance construction and derivation order. Generic profiles still skip
  Fury. Polder level-based immunity, no-kit handling and Elementalist conditional damage modifiers
  retain their inspected expressions. No new rules formula was identified in these moves.
- Level-support diagnostics preserve the prior level/class/aspect checks. Progression adds an
  explicit Berserker requirement, consistent with the already supported transition and preventing
  a future level-one aspect expansion from enabling its level-two advancement accidentally.
  The new future-aspect test checks that boundary, but persisted-operation regression evidence
  remains required.
- Context collections are exposed through read-only types; the extraction does not establish
  deep runtime immutability. This is acceptable for the internal contribution seam and must not
  be represented as a security boundary or general immutability guarantee.

## Portable reference static review

Reviewed `tests/character-v45-reference.test.ts`, `tests/helpers/v45-reference.ts` and the recovered
manifest. The tests bind recovered bytes to original capture metadata and compare independent
source-fixture expectations with export selections, projected active grants and captured sheet
values. The projection traverses active levels and selected subclasses; unknown active containers
and unsupported cross-class/complication/inventory cases fail explicitly. The tests account for
the authored Bethell name difference and deferred Fury language slots instead of hiding them.
Reimport checks compare the historical Forge exports with their historical Forge reimports; they
do not establish a Salient interchange adapter.

The helper's `sortedNames` intentionally compares sets for grant membership. It also currently
normalizes selected-option arrays through the same set helper; this is adequate for these fixed,
hash-checked historical artifacts but must not be treated as general validation of choice counts
or duplicate selections for future option fixtures. Those fixtures should check multiplicity and
budgets explicitly. Actual execution of the recovered-reference tests now passes in the evidence
reviewed below.

## Executed evidence reviewed

Reviewed [focused checks](../evidence/V45/focused-pass.log),
[full repository checks](../evidence/V45/check-pass.log),
[candidate identities](../evidence/V45/candidate-hashes.json), the
[evidence record](../evidence/V45/README.md) and the comparison script. The runs identify the
isolated CT114 `characters` environment. The manifest identifies integration parent `944a46a`;
the preservation comparison uses a pristine `9fb4fa6:shared/` archive, not candidate-generated
expected outputs. Application code was reported unchanged since repaired static review.

- All ten new foundation/reference tests passed, including recovered Forge artifact checks.
- Ten assembled definition variants and 5,584 full evaluation objects passed exact deep equality,
  covering complete/incomplete/invalid/unsupported results, invalid levels, omitted or invalidated
  selected keys and contrasting single-choice options. The script compares the entire result,
  including diagnostics and provenance; this is preservation evidence, not a rules oracle.
- Full `pnpm check` passed: 284 engine and 407 app/script tests, lint, formatting, type checks,
  links, vendor/content/supporting/foe checks, frontend build and build-budget verification.
  Logged authentication errors are expected negative-test cases; their owning tests pass.

These results resolve the compilation and deterministic-preservation gates. They do not replace
the in-app browser/persistence evidence or shared playable delivery. This reviewer read retained
results; no additional test workload was run by the reviewer.

## Final pre-merge acceptance matrix

| Gate | Reviewed evidence | Verdict |
| --- | --- | --- |
| Definitions and derived behavior preserved | Ten definition variants and 5,584 complete evaluation-object comparisons; sourced V25/V32 tests; no enabled new options. | Pass |
| Type safety and repository integration | Full check: 691 tests plus lint/types/content/vendor/build checks. Both initial static issues repaired. | Pass |
| Current build support and progression boundaries | New unsupported-aspect tests plus existing evaluator/progression tests; source-registered Berserker transition only. | Pass |
| Existing Forge counterparts | Portable historical exports, hashes, mapped selections, active grants and captured sheet totals; deferred Grug language and uncaptured totals explicitly limited. | Pass for preservation scope |
| Browser journeys | Initial 52-scenario batch: 45 pass, four fail, three environment-specific skips. All four failures subsequently pass unchanged in retained reruns. | Pass for all 49 applicable scenarios, with intermittent performance limitation |
| Actual persisted advancement/restoration | Raw before/advanced/restored application readback, source-card identities and history; inspected corresponding screenshots. | Pass |
| Candidate identity | Isolated source verification reports 39 compared application/test/reference files and zero mismatches. | Pass |
| Shared playable delivery | Actual integrated commit, shared runtime update and changed-feature readback not yet available. | Pending post-merge lead gate |

Reviewed the initial browser log and all three retry logs. Closeout passes in 1.4 minutes;
table-audit and campaign registration pass together in 2.0 minutes; Fury wizard/admission/sheet/
table passes in 3.2 minutes, including its stress extension. The three skipped scenarios require
password-recovery or Workers fixtures absent from this target and do not exercise changed V45
behavior. They are excluded from the 49 applicable successes, not counted as passes.

The initial failures remain evidence of intermittent backend execution limits and registration
rate limits. Successful unchanged retries establish current functional coverage without erasing
that reliability limitation. Near-limit history and character-sheet reads remain in the retry
warnings. For this extraction, exact evaluator preservation, unchanged query paths, current
successful journeys and the explicit performance-thread handoff justify merge acceptance without
claiming a clean initial batch, relaxed assertions, or a timeout fix. This judgment does not waive
a future failure in an option unit's required checks.

Inspected `progression-readback.json` directly: level one starts at maximum/current Stamina 30/20;
level two is 39/20. Recoveries 4 and Ferocity 3 persist. The browser test then explicitly adjusts
current Stamina to 39 before requesting restoration; pending review retains 39 and approved
restoration caps it at 30. The restored baseline equals the earlier level-one baseline; history
retains the level-two revision and records an effective level-one restore. Twenty source-card
readbacks identify the pinned Compendium. The evidence README's initial statement that current
Stamina remained 20 throughout was corrected during this audit to describe that deliberate setup
and cap. This was an evidence-description error, not a new application defect.

Visually inspected the Fury combat capture, level-two sheet, restored sheet and corrected Bethell
sheet. They agree with the recorded states and show the expected source/grant displays. Raw
application readbacks and executable checks remain the numerical evidence; screenshots alone do
not establish persistence or every mechanical clause.

Before declaring merge complete, the lead must validate final commit trailers/documentation,
integrate the reviewed candidate, update the shared development runtime and retain the actual
shared changed-feature verification. If application code changes, renew affected checks and
review instead of inheriting this candidate's verdict.
