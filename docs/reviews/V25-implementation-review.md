# V25 independent implementation review

Reviewer: `implementation_review`, 2026-09-16. Fresh review context; reviewer did not implement
this slice. Reviewed the uncommitted `slice/V25` changes in `characters-build`, based on
`8a6c06c`, including new content, fixtures and tests. No implementation files were changed.

## Verdict

**Pass.** No blocking implementation defects or outstanding implementation-verification findings.
The final full repository check and both required browser journeys have passed. The earlier
evidence-only finding is closed. The separate independent rules review may now begin.

## Owning specifications read

- [Build process](../build/README.md#review-standard) and all of [V25](../build/V25-two-class-wizard.md).
- [Wizard scope](../character-wizard-spec.md#fuller-product-scope),
  [decision system](../character-wizard-spec.md#3-decision-system),
  [current values](../character-wizard-spec.md#current-values-when-a-build-changes),
  [review lifecycle](../character-wizard-spec.md#7-revision-and-review-lifecycle),
  [interchange](../character-wizard-spec.md#8-content-and-forge-steel-compatibility), and
  [acceptance scenarios](../character-wizard-spec.md#11-acceptance-scenarios).
- [Sheet layout](../character-sheet-spec.md#layout-and-content),
  [readable rules](../character-sheet-spec.md#actions-tests-and-readable-rules), and
  [privacy/persistence](../character-sheet-spec.md#views-permissions-and-persistence).
- [Verification procedure](../build/character-verification.md),
  [V24 assessment](../build/V24-character-wizard-assessment.md), and the
  [V1 contracts](../v1-character-wizard-contracts.md), particularly creation, definition identity,
  duplicate skills, class baselines, kits and revision safety.
- [Independent source audit](../research/v25-character-source-audit.md), both portable V25
  fixtures and corrected Forge capture metadata.

Applied the installed `convex-reviewer` checklist to changed backend paths: authentication,
ownership/audience boundaries, indexed reads, validation, bounded data and awaited operations.
Existing guards remain in place; this diff introduces no new public trust boundary.

## Acceptance checks

| V25 check | Result | Evidence |
| --- | --- | --- |
| 1. Both builds, save/reload and independent expected values | Verified | Independent reviewer compared both portable fixtures' scalar totals, characteristics, potency, kit/resource and every grant group. Focused persistence tests read back saved selections, evaluation and sheet. Elementalist and Fury browser journeys pass. |
| 2. Every grant sourced and classified | Verified for implementation/source coverage | Independent researcher ledger covers the two paths; provenance test checks pinned source sentences and readable content membership. Persisted sheet test checks every grant's exact source text. Mechanical interpretation remains the next independent rules review. |
| 3. Characteristic assignment | Verified | All 34 Elementalist assignments, fixed Reason, incomplete/invalid assignments, named/shared transition persistence and unchanged Fury regression. |
| 4. No-kit Elementalist, resource/costs, passive modifiers; Fury unchanged | Verified | Fixture comparisons, pure roll/waiver tests, persisted actor/target projection assertions and readable modifier annotations. Original Fury output still deep-equals its regression expectation. |
| 5. Parent changes and unsupported choices | Verified | Shared invalidation removes class/ancestry/career-dependent selections; culture pool and characteristic-array changes invalidate affected choices; independent authored fields remain. Invalid/unimplemented choices retain diagnostics and cannot produce a complete baseline. |
| 6. Review, privacy, locks and live-state preservation | Verified | Exact-revision/stale review, effective isolation, owner-private notes, peer projection, stale saves, combat locks and unchanged compatible live values. Actual Fury-to-Elementalist activation refuses incompatible resource conversion atomically, preserving event history. |
| 7. Readable grants and effective sheet | Verified | All persisted grant source text checked; browser opens ability rules; inspected Elementalist sheet screenshot. Source wrappers are retained alongside Hurl Element and Practical Magic abilities. No automatic Essence or ward grants introduced. |
| 8. Repository/browser checks and independent reviews | Verified for this implementation-review stage | Final full repository check passed. Elementalist and the complete Fury browser/table regression passed. This independent implementation review passes; the independent rules review is the next required process stage. |

## Findings

### Closed — verification gap

`tests/browser/acceptance-extension.ts:186` in the pre-repair version: after the complete Fury
wizard/admission/three-audience journey, the extended table performance loop sampled zero log rows
before the reactive DOM settled. This is separate from V25 character implementation. The lead
added a bounded 15-second retry retaining the original greater-than-zero, at-most-50 and exact-50
(after cycle 40) requirements. Reviewer inspected and approved this test-only synchronization
repair. `.playtest/v25-fury-browser.log` now records **one passed (2.3 minutes)**, and
`.playtest/v25-fury-browser.exit` is `0`. This complete rerun closes the finding.
`.playtest/v25-browser-final.log` separately records the successful Elementalist journey; its
earlier Fury failure is superseded by the successful repaired rerun.

The final full `pnpm check` passed: `.playtest/v25-check-final.log` records 97 engine tests,
321 app/scripts tests, lint, links, vendor pins, the clean 467-entry content snapshot and build.
`.playtest/v25-check.exit` is `0`. Earlier infrastructure-related failures are superseded by this
successful run, not treated as application defects.

### Suggestions resolved during review

- The independently authored Fury fixture initially had no permanent regression assertion. The
  lead added it; reviewer inspected and reran it successfully.
- New backend modifier/immunity projections initially had only static inspection and pure roll
  coverage. The lead added assertions against an actually persisted Elementalist record;
  reviewer inspected and reran them successfully.

## Verification performed by reviewer

- `pnpm exec vitest run --project engine tests/character-v25-evaluator.test.ts tests/v25-build-roll-contributions.test.ts --project app tests/app/elementalist-character.test.ts tests/app/admission.test.ts`
  — **27 tests in four files passed**, after the two coverage additions.
- Separate read-only Node comparison of both portable fixtures against evaluator output —
  all scalar/characteristic/potency/resource/kit and grant-membership comparisons passed.
- Inspected `.playtest/v25/elementalist-sheet.png`: effective Polder/Fire Elementalist, correct
  primary totals, twelve abilities, sourced passive annotations and complete visible grant groups.
- Inspected final full-check and browser logs plus their exit sentinels: full check **0**,
  repaired complete Fury browser **0**, and Elementalist browser **passed**. Did not run another
  full heavy repository check in parallel with the lead's check or mutate any deployment.

## Boundaries and follow-on seams

This is an implementation review, not the independent rules verdict. The ledger's full mechanical
interpretation still requires that separate reviewer. Corrected Forge-side evidence does not claim
an application import/export adapter. Runtime Essence generation, Persistent Magic, ward triggers,
spatial choices and condition override adjudication remain manual. Generalized level-one profiles
preserve the legacy Fury derivation branch; this is adequate for the two delivered paths, not proof
of eleven-class or higher-level support. Companion recipients and summon portfolios remain the
explicit extension work described in V25.

No functional claim was disproved in focused tests. All implementation-verification evidence
requested by this review is now available and passing. Rules interpretation remains explicitly
reserved for the separate independent rules review.
