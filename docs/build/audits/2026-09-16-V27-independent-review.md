# V27 independent implementation review — 2026-09-16

Reviewer: `v27_implementation_review`, fresh context, no implementation edits.
Scope: working changes on `slice/V27` in the foe worktree, including untracked files.

## Verdict

**Pass.** All ten acceptance checks are verified for this isolated slice. All four initial
implementation findings were repaired and independently rechecked; no blocking finding remains.
The separate [source/rules review](2026-09-16-V27-source-review.md) also passed. Integration onto
newer main and deployment are outside this verdict.

## Specifications read

- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`
- `docs/monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16`
- `docs/monster-catalog-spec.md#baseline-stats-and-unresolved-values`
- `docs/monster-catalog-spec.md#features-and-supporting-rules`
- `docs/monster-catalog-spec.md#proposed-import-procedure`
- `docs/data-architecture-spec.md#35-unified-object-references-and-sharing`
- `docs/reference-library-spec.md#confirmed-library-coverage`
- `docs/reference-library-spec.md#app-wide-rule-cards`

Also read project instructions, the newer main-worktree post-prototype checkpoint, the build process,
V27 and its kickoff, the consumer contract and owning-spec implementation notes. No rules browsing or
third-party implementation inspection was performed. External data inspection was limited to the
authorized generated-JSON comparison cache at revision `eba4b8bb8bc1baf947f15e67e9e923951092fd89`.

## Initial findings and verified repairs

1. **P1, blocking: a paired correction can publish contradictory structured and readable values.**
   `scripts/foes/import.ts:328` requires a Markdown partner but does not revalidate the corrected
   envelope. Reproduction: change Leap's usage from `Maneuver` to `Main action` and provide a
   `$markdown` correction whose replacement is unchanged. Import succeeds with `usage: Main action`,
   HTML showing `Maneuver`, and no diagnostics. Repaired at `scripts/foes/import.ts:347`: the shared feature validator now checks corrected
   envelopes, headings and ordered effects; parent printed stats are also checked at line 352. The
   reviewer reran the exact reproduction and it now rejects with `Feature envelope disagreement`.
2. **P1, blocking: ordinary-foe EV quantity differences are ignored.**
   `scripts/foes/compare.ts:125` compares quantity only when the local quantity differs from one.
   Changing cached Skeleton's external `evQuantity` to `99` still produces `explained` without a
   quantity difference. Repaired at `scripts/foes/compare.ts:133`: every quantity is compared. The reviewer reran
   the cached Skeleton mutation and it now returns `review`. An absent ordinary quantity has an
   explicit explanation; an explicit different quantity does not inherit that explanation.
3. **P1, blocking: extra parent prose can bypass full-output comparison.**
   `scripts/foes/import.ts:338` diagnoses only child prose and `scripts/foes/compare.ts:158` consumes
   only child diagnostics. Adding a synthetic mechanical paragraph before Skeleton's first feature
   retains the paragraph visibly but yields no diagnostic and an `explained` comparison. Repaired at
   `scripts/foes/import.ts:373` and `scripts/foes/compare.ts:92`: parent prose/table anomalies are
   diagnosed and parent diagnostics require comparison review. The reviewer reran the injected
   paragraph and confirmed both the diagnostic and the `review` outcome.
4. **P2, repaired: reopening a result retains the previous child reference.**
   Initial `web/foes/index.tsx:86` initialized preview history once while keeping it mounted after
   dismissal. The two-theme browser loop reopened Haunt after clicking Ghost. `FoeResult` now mounts
   the preview only while open. The enhanced browser suite passed after this repair.

## Acceptance checks

| # | Status | Evidence |
| --- | --- | --- |
| 1 | verified | Reviewer reran focused tests: two independent generations match each other and the committed payload; exact original JSON/Markdown/linked Markdown retained. Inventory is 11 stat blocks, 23 abilities, 13 traits, four supporting Malice features. |
| 2 | verified | Source validators check printed stats/envelopes and ordered effect text; reviewer inspected the exact Ghost, Skeleton and Zombie source spans, optional spending, post-tier effects and Zombie Dust's pre-roll paragraph. |
| 3 | verified | Shared lookup/search tests cover independent Skeleton/Bone Shards/Arise resolution, three parent-bound Arise results, usage/keyword filters, duplicate names, duplicate bindings and source-order reversal without ID retargeting. |
| 4 | verified | Printed per-four EV, captain text, empty Ghost role and villain ordinals are preserved. Source originals and ordered sections stay available; no engine/compiler/backend changes occur. |
| 5 | verified | Generic extraction fixtures, revision/expected-value guards, original preservation and exact older-edition lookup pass. Corrected structured fields and Markdown are now revalidated together; reviewer reproduced rejection of the contradictory pair. |
| 6 | verified | The pure shared resolver consumes the same package as the public app. `FoeView` accepts a package/object without route or private-state dependencies. Old-edition references refuse the current package and resolve against the retained edition. |
| 7 | verified | Enhanced browser test passed after reopening repair: search/filters, parent/child/Rules navigation, complete text, Escape/backdrop/close dismissal and focus return. Whole-block light and independent Haunt dark screenshots visually inspected; all four screenshot artifacts exist. |
| 8 | verified | Reviewer reran the cached CLI comparison to a temporary report: 12 explained, zero review/missing/ambiguous/error. Numeric changes, explicit differing quantity, missing effects and added parent prose require review; source evidence and both revisions are retained. |
| 9 | verified | Existing regression fixtures detect missing/ambiguous counterparts, duplicate feature identities, missing paragraphs, changed values/labels, consequential ordering and equivalent formatting. The new regression test covers all three data findings and passes. |
| 10 | verified | Reviewer reran 14 focused tests and `pnpm foes:check`; final full `pnpm check` passed with 85 engine and 331 app/scripts tests, links/pins/content checks and production build. Enhanced browser test passed. Independent implementation and separate source/rules reviews both pass. The incidental flaky-test repair is reviewed below. |

## Verification and limits

- Reviewer executed `pnpm exec vitest run --project scripts tests/scripts/foes.test.ts`: 14 passed after repairs (13 passed in the initial review).
- Reviewer directly reproduced findings 1–3 with Node calls to the importer/comparator and synthetic
  changes to in-memory inputs, then repeated all three after repairs and verified rejection/review.
  Source files, generated application data and cached evidence were not edited by the reviewer.
- Inspected `/tmp/salient-v27-final-check.log`: final full build/check reached successful production
  build after 85 engine and 331 app/scripts tests, formatting, types, links, vendor and package checks.
  The lead confirmed process exit 0. Did not independently repeat the full suite; focused checks were rerun.
  A preceding full run exposed the timestamp-sensitive test assertion described below; its repaired
  test passes in this final run.
- Inspected `/tmp/salient-v27-final-browser.log`: initial reopening failure followed by a successful
  rerun after the preview lifecycle fix. Browser network log includes the known optional auth request
  refusal with no backend running; public reference behavior succeeds.
- Reviewer independently ran `pnpm foes:check` and cached `pnpm foes:compare` with a temporary report
  destination. The package edition remains `6c6bbd40f2460c196511a2f0cc19b2ff9184ddee27be90245e5d5a8a915ed331`;
  12 comparison rows are explained with no incomplete/unresolved outcome.
- All substantive implementation claims were reproduced or supported by inspected evidence after repairs.
  This is an ingestion/reference review, not evidence of executable undead mechanics.
- Main independently advanced from the recorded `e83930e` base to `a25a0e8` during this assignment.
  This report reviews the isolated V27 worktree and its explicit V23 prerequisites. Lead rebase/integration
  and any necessary integrated checks remain separate; this report makes no claim that they occurred.

## Incidental test repair

The reviewer also inspected `tests/app/closeout-audit.test.ts:66`, a separate test-only repair.
The failed full-suite assertion searched the complete serialized public event for the substring `37`.
The captured failure contained it only in `createdAt: 1789522853757`; neither before/after values nor
the private temporary-Stamina number appeared in the public payload. The replacement asserts event
existence, the literal safe public description and the exact public payload shape, excluding extra
private fields. Existing persisted-state and private-journal assertions are unchanged; backend behavior
is untouched. The reviewer recommended literal description expectations, inspected their application,
and found no issue with this repair. The final combined app/scripts run reports 331 passing tests.
