# V45 independent foundation review

Reviewer: `wizard_plan_review`, 2026-09-19. Implementer: character integration lead and
`foundation_content`. Review baseline: `9fb4fa6`; reviewed candidate initially based on
integration parent `944a46a`, identified by the V45 candidate hash manifest. Final implementation
is `ebe66e2b631cb9d30acb59cb24011d0585bdf9d3`; all 39 candidate file identities remain unchanged.
This reviewer did not implement application code. Initial review and repaired-candidate static
re-review are recorded below. Repository, exact-preservation, portable-reference and applicable
browser evidence have now been reviewed. Shared playable delivery evidence is accepted in the
final addendum below.

## Verdict

**Pass — implementation audit and shared development delivery, 2026-09-19.** Both initial static blockers are repaired.
The unchanged candidate has passing evidence for all applicable foundation acceptance scenarios.
The retained intermittent backend timeouts and account rate limits are acknowledged below; they
are not certified fixed. No remaining V45 implementation blocker was identified. This verdict
initially permitted the lead's commit/integration procedure. The final delivery addendum now
accepts that completed integration and shared rollout; it does not certify a hosted release.

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
| Shared playable delivery | Implementation `ebe66e2`; backend ready; 39/39 serving source identities; two shared browser journeys and persisted progression readback. | Pass; see final addendum |

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

## Final shared-delivery acceptance

**Acceptance check 7 is complete.** Reviewed the final
[delivery record](../evidence/V45/README.md#shared-delivery),
[shared browser results](../evidence/V45/shared-browser.log),
[serving source verification](../evidence/V45/shared-source-verification.json),
[backend-ready log](../evidence/V45/shared-backend-ready.log),
[runtime warnings](../evidence/V45/shared-runtime-exceptions.log) and raw
[persisted progression readback](../evidence/V45/shared-progression-readback.json).

The reviewed application is integrated as `ebe66e2b631cb9d30acb59cb24011d0585bdf9d3` after a
documentation-only main update; all 39 application/test/reference identities match the candidate.
The established CT114 main backend synchronized successfully at 14:53:02 UTC. The source record
identifies the shared HTTPS app and CT114 main, distinct from the earlier isolated environment.
The lead records retained volumes, credentials and existing play data and successful final commit
trailer/documentation validation.

Both actual shared browser journeys pass in 1.2 minutes: corrected Bethell wizard/reload/review/
source sheet, and Fury advancement/source sheet/history restoration. Direct readback again shows
Stamina maximum/current 30/20 before advancement, 39/20 afterward, and 30/30 after the deliberate
39-current restoration setup and approved cap. Recoveries 4 and Ferocity 3 remain unchanged;
history retains the prior level-two revision and marks the level-one restore effective. Twenty
source-card identities are retained. These observations agree with the accepted isolated behavior.

The filtered shared runtime log contains only two `foes:list` near-limit warnings (808 and
888 ms), with no recorded execution timeout or validation failure during these checks. The wider
intermittent performance limitation remains open under the performance follow-up and is not erased
by this focused shared success.

No V45 implementation or shared-delivery blocker remains. This acceptance covers the established
local development environment; no hosted publication or remote Git push is claimed. The pending
closeout commit contains documentation/evidence only and needs no application runtime restart.
