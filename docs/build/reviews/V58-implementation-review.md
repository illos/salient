# V58 independent implementation review

Reviewer: Astra `polder_evidence`, 2026-09-19. Did not implement the application or tests. Reviewed the uncommitted integration candidate against main `6459c8d` in `.worktrees/astra-integration`.

**Implementation assessment: no blocking code findings. Overall acceptance: blocked by required verification.** The required full browser suite failed and was stopped; it is incomplete. Fresh rules review has not started. No overall acceptance pass or merge approval is given.

## Scope and specifications

Read `docs/character-wizard-spec.md` anchors `#3-decision-system`, `#4-wizard-flows`, `#7-revision-and-review-lifecycle`, `#8-content-and-forge-steel-compatibility`; `docs/build/astra-character-workflow.md#unit-contract` and `#review-and-merge`; `docs/build/README.md#test-value`; and all V58 acceptance checks. Inspected the current generic option constructor, evaluator support gate/purchased grants, Polder numeric contributions, existing V25 ancestry-switch and reference coverage, and the admission fixture used by the new app test.

Application change is exactly three option support overrides removed plus a comment. The constructor defaults those options to supported. Printed costs, source paths, four-point validation, signature grants, evaluator and persistence behavior remain shared. No conditional effect is converted to a permanent bonus or automation. The changed specification accurately distinguishes readable manual effects.

## Acceptance checks

| V58 check | State | Evidence |
| --- | --- | --- |
| 1. Complete new movement build, correct traits/numerics/no old immunities | Verified | Source-derived engine assertions passed in `../evidence/V58/checks/check2.log`; actual complete persisted readback and independent `../evidence/V58/comparison.md`. |
| 2. Mixed old/new exact budget and invalid overspend with no purchased grants | Verified | Second engine case passes for Nimblestep/Fearless and rejects adding Polder Geist with `budget-exceeded`; source costs are independent of the evaluator. |
| 3. Admitted persisted sheet/source content; approved replacement preserves live state | Verified | App test uses create/save/submit/approve via existing admission helper, queries authenticated character/sheet, and replaces through save/submit/approve. Nondefault Stamina 11 and Essence 7 plus the entire live object survive. Passing app result retained in check2 log. This is backend integration evidence, separate from the browser draft. |
| 4. Same-build authentic Forge export and Salient save/reload | Verified | Comparison files, actual Forge export/sheet/choices and Salient readback/screenshots retained. Only Forge purchased-trait selected subtree differs from current main's V45 export. All persisted selections match V25 with new traits, ignoring authored name. |
| 5. Focused/check/full browsers, independent reviews and shared app | Failed/incomplete required browser gate | Focused cases pass; inspected full candidate `check2.log` (286 engine + 408 app tests, lint/types/content/build) and exit 0. New actual wizard journey passes in 14 seconds. Required full browser suite failed at `closeout.spec.ts:104`: the Combat closeout heading was absent; error context showed “This page is unavailable” and “Function execution timed out (maximum duration: 1s) Called by client.” Lead stopped the suite at test 3 under the user’s anti-spiral pause requirement. The full suite is failed/incomplete and blocks acceptance; fresh rules review has not started; shared playable verification remains undone. |

No runtime workload was rerun by this reviewer. Evidence was inspected, not represented as personally reproduced runtime execution. Lead reports matching CT114/local hashes for all four reviewed code/test files; candidate `check2.exit` records 0 despite a separate broker connection termination.

## Test value review

Every added case has distinct observable coverage and an explicit failure rationale:

- `tests/character-v58-polder.test.ts:22`: the three previously disabled choices must complete without unconditional speed/Disengage bonuses or quick-build immunities. Existing V25 covers only the quick build; this adds the newly enabled manual-effect combination. Expected numbers/traits are sourced constants, not values calculated with production logic.
- `tests/character-v58-polder.test.ts:44`: new Nimblestep plus existing Fearless spends exactly four; adding new Polder Geist must reject five and emit no purchased grants. Existing generic/Devil budget tests do not exercise this content's costs or mixed old/new choices. It protects content configuration rather than merely repeating a generic budget test.
- `tests/app/polder-v58.test.ts:16`: authenticated admitted readback and actual sourced sheet text, then approved replacement without stale traits or live-resource reset. This catches persistence/content/projection failures the pure evaluator cannot. `draftSelectionsFrom` only adapts test input; rule expectations are not generated by the code under test. Direct live-state setup is deliberate preparation of nondefault resources, not an alternate path for the operation being tested.
- `tests/browser/v58-polder.spec.ts:13`: enabled controls, saved checkbox state after reload, complete real build and readable source dialogs. These require a browser and are distinct from API assertions. One build covers all new traits; no mechanical permutation is multiplied across browser cases. Numeric assertions identify the saved counterpart and guard browser/backend integration, while exhaustive mechanical boundaries stay in the cheap engine cases.

No redundant or implementation-mirroring test requiring removal was found. Existing V25 comparison and ancestry pruning coverage are relevant unchanged-path guards, not a reason to add another quick-build or ancestry-switch test.

## Findings and limits

Blocking verification finding: required full browser failure at `tests/browser/closeout.spec.ts:104`, with the timeout context quoted above. The lead is retaining the raw full-browser log and error context under `../evidence/V58/checks/`. No backend/runtime diagnostics were undertaken and no root cause is established. The failing code path is outside the three changed support flags; that does not establish a preexisting failure or waive the gate. Work pauses for discussion, with no further investigation or merge implied. The passing full 694-test check and focused real UI/Forge comparison remain valid evidence for their narrower scopes.

Low severity, preexisting presentation issue: `shared/content/ancestries/polder/level-one.ts:24` includes Shadowmeld as both a signature trait and an ability; the unchanged wizard renderer prints both under Signature Trait (visible in `../evidence/V58/salient/reloaded-wizard.png`). The baseline has exactly one Shadowmeld ability. This slice does not introduce or worsen it.

Reactive Tumble's Forge Ability/Triggered Actions placement versus Salient's readable purchased-trait placement is intentional manual support, with complete trigger/action text visible. No automated forced movement, shift or conditional speed execution is claimed or verified. Actual browser readback is a completed draft with no effective revision/live state; campaign activation/replacement evidence comes from the passing app integration test. Full browser verification is failed/incomplete; rules review has not started and shared-app verification remains pending. No full acceptance is claimed.
