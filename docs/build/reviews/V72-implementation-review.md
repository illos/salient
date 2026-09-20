# V72 independent implementation review

Reviewer: `v72_review`, 2026-09-20. The reviewer did not implement this slice.

**Verdict: PASS — implementation acceptance, 2026-09-20.** No blocking findings remain.
The reviewed candidate passes the headless gate under the browser moratorium. Separate
pinned-source rules review and lead integration checks remain required before merge.

## Scope and references

Reviewed the working candidate on `slice/V72-live-compiled-effects` in `.worktrees/engine-live`,
based on main `e5c1cd84bb5f08a2c1ee51279467ca4e692c6e0e`. The candidate is uncommitted.
Read the [review standard](../README.md#review-standard),
[headless gate](../README.md#programmatic-headless-completion-gate),
[V72 boundaries](../V72-live-compiled-effects.md#goal-and-boundaries), V26
[source contract](../V26-compiled-ability-effects.md#1-source-to-compiled-definition),
[migration boundary](../V26-compiled-ability-effects.md#runtime-migration-boundary),
[outcomes](../V26-compiled-ability-effects.md#2-definition-to-outcome),
[persistence](../V26-compiled-ability-effects.md#3-persisted-results-and-clients),
[acceptance checks](../V26-compiled-ability-effects.md#acceptance-checks), and the
[ability appendix](../V26-ability-designs.md#shared-source-and-fixture-contract).
Applied the Convex reviewer security, query/index, validator and schema checklist.

The 2026-09-20 acceptance amendment permits a live push subtotal with named missing movement
coverage. It does not permit claiming a final allowance or relax acceptance check 7. Browser
execution is paused by user instruction; the recorded backlog replaces this slice's visual run.

## Static findings

No Critical or Important findings remain. Reviewed:

- Whole selected-source compilation and bundled source comparison in `compiledSource.ts`.
  Body, revision and structured-projection drift cannot silently fall back to compatibility.
  Runtime eligibility follows compiler support rather than an ability-name list.
- Existing registered `ability.use` still performs one affordability check before accepted dice,
  one resource debit and one existing damage-write sequence. Compiled results supply the same
  resolved roll, with original private facts saved only in optional ability-result fields.
- Corrections reuse saved definition, original dice and original actor/target facts. Existing
  `correctTarget` reconciles health once; pending effects receive a new effective revision.
  Undo/redo journals restore the saved records rather than recompile or replay.
- Manual disposition resolves a current non-damage occurrence with exact use/revision identity,
  optional current target binding through restoration aliases, role/history checks and duplicate
  refusal. It changes only the saved disposition. Legacy clause handling is retained; reads do
  not migrate old records.
- Public result projection omits private original inputs, filters foe Stamina by the existing
  audience setting and preserves historical occurrence identities while projecting effective
  target aliases separately. Selected foe source excludes sibling abilities and parent context.
  Events keep their existing audience path; closeout exposes only outstanding selected clauses
  and exact occurrence commands, including restored target aliases.
- The log card renders saved public effects and sends the same registered operation used by the
  CLI. Missing movement coverage remains visible after manual disposition. No movement,
  conditions, potency or saves are automatically executed.
- The generated report distinguishes structural recognition from current grants/loading:
  six reachable compiled abilities and four supported but unreachable comparisons. Kit and
  complex unchanged definitions remain labeled compatibility. No grant/loading expansion exists.

The new tests protect source drift, paid-action side effects, correction/disposition seams,
restoration aliases, health privacy, historical reads, closeout and incomplete-movement wording.
Their assertions address distinct failures rather than reproduce implementation internals.
The dice helper is isolated to `engine-live`, target-checked and opt-in; it preserves unrelated
rows and is explicitly disclosed as fixture setup, not gameplay proof.

## Verification inspected

The local `pnpm check` [output](../evidence/V72/checks/local-check-output.txt) and
[exit status](../evidence/V72/checks/local-check-exit.txt) pass: 284 engine tests plus
486 app/scripts tests, typechecking, lint/format, links, pinned vendor/content/report checks and
production build. The added identical-clause regression was then included in the separately
captured [eight-case persisted suite](../evidence/V72/checks/occurrence-check-output.txt),
with scoped lint/format and exit 0. It deliberately extends a saved real-use result for the
occurrence-storage contract; it does not claim that repeated clauses are a newly eligible source.
It proves ambiguous text refusal, isolated exact dispositions and duplicate refusal.

Inspected actual CT114 [public readback](../evidence/V72/v72-headless-readback.json) and
[exit 0](../evidence/V72/v72-headless-exit.txt): run
`c89b4f0f-859c-46b4-b9ec-d2072e0e8816`, started `2026-09-20T04:06:59.404Z`,
167.278 seconds, 46 records, `passed: true`, `stage: complete`. Source was explicitly dirty
base `e5c1cd84bb5f08a2c1ee51279467ca4e692c6e0e` from `.worktrees/engine-live`, runner
CT114 `engine-live`, application target
`https://salient-engine-live-dev-fcf42d994212.tail41404c.ts.net`, internal backend
`http://backend:3210`. The reviewer independently hashed all 18 recorded public-proof source
files and all 17 local-check source files; each matches the current reviewed file.
The [initial preflight failure](../evidence/V72/v72-preflight-output.txt) is retained honestly:
the dice helper readiness file was absent, before accounts or gameplay setup. Restoring the
existing backend's nonsecret runtime metadata allowed the unchanged guarded proof to proceed.

Independently checked readback arithmetic, role permissions, hidden foe-health projection,
original-dice preservation, exact compiled-result equality through correction undo/redo and
manual-disposition restoration, and restrained-condition coverage. BS2 is 8 damage, Goblin 7,
push subtotal 3; two banes produce 5 damage, Goblin 10, subtotal 2; lethal BS3 preserves subtotal
5 and manual movement/death scope. SC4 consumes three temporary Stamina then one ordinary
Stamina. Bury the Point debits two Malice once and retains its manual remainder. VF2 applies
9 fire damage and subtotal 3 without a weapon size bonus. Both free strikes and all four
compatibility cases match the designed result format and scope.

The two actual CLI [report generations](../evidence/V72/checks/report-reproducibility.txt)
match each other and the retained JSON/Markdown artifacts byte-for-byte. Current report checks
also pass inside `pnpm check`. The candidate remains uncommitted at review time; an artifact
comparison is not a claim that this branch has been merged.

## Acceptance mapping

| V26 check | Status | Evidence |
| --- | --- | --- |
| 1. Real hero end to end | Verified | Actual BS2 public use/readback, source identity and saved effects; conservative subtotal amendment honored. Static renderer tests cover matching displayed gaps. |
| 2. Monster adapter/minion boundary | Verified | Actual SC1–SC4/BP2; selected foe-source privacy; pure Spinecleaver coverage retains its unsupported/minion boundary. |
| 3. Choice/arithmetic regression | Verified | Full A05/R04 coverage plus actual MF3/RF3, SC4, paid compatibility and insufficient-resource cases. Existing critical recognition path remains unchanged and covered. |
| 4. Parameter/composition generality | Verified | V67 renamed/numeric fixtures plus distinct structural nodes; new persisted identical-clause contract fixture proves separate exact dispositions and rejects ambiguity. |
| 5. No lost mechanics | Verified | Whole-envelope compiler tests plus V72 source drift and registered-operation negative cases refuse automation before payment, dice, damage or action use. |
| 6. Sequencing counterexample | Verified | Actual TR1/OW2 retain labeled compatibility and manual sequencing/slide; no compiled ordinary-push instructions invented. |
| 7. Facts/voluntary reduction | Verified | Pure BS4/BS5 and coverage cases; actual BS3 lethal and BS6 restrained readbacks retain subtotal/manual work without inventing final allowance, stability reduction or movement. |
| 8. Correction/restoration | Verified | Actual BS7/BS8/BP5 and persisted alias tests; original dice, exact recorded restoration, one damage reconciliation and manual-disposition seam. |
| 9. Retries/access/history/privacy | Verified | Persisted role, wrong-target, stale/duplicate, alias, private input/health and closeout archive regressions; actual denied commands and turn boundary; existing command idempotency remains shared. |
| 10. Connected proof/report/reviews | Verified | Actual CLI journey, passing full check, twice-generated reports and this independent implementation review. Required separate rules review is the next gate. Browser work remains deferred by instruction. |
| 11. Integrated content/build facts | Verified | Actual VF2; full-suite MI/Ray and V25 modifier/immunity coverage; Ghoul/Worg pure comparisons and six-reachable/four-unavailable report. No new grants or loading. |

## Limits

No browser was opened or run. No deployment, gameplay mutation or heavy workload was performed
by this reviewer. The reviewer inspected and independently cross-checked retained proof artifacts; this is not
represented as independently rerunning the public backend journey. Rules arithmetic still
requires the separate pinned-source reviewer. This accepts the isolated candidate, not an
integration into main or an update of the shared playable environment.
