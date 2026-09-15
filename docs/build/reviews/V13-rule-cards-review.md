# V13 app-wide rule cards — independent review

Reviewer: `rule_cards_review` (independent agent; no implementation changes). Date: 2026-09-15.

## Verdict

**Pass for the V13 app-wide rule-card follow-up.** The feature acceptance checks below are verified
and no blocking implementation defect remains. Re-review distinguished the shared presentation
feature's acceptance criteria from the additional full-app browser regression scenarios. Those
broader scenarios remain incomplete because of the documented timeouts and test failures below;
they are listed explicitly as verification limits, not claimed as passing.

## Scope and specifications

- `docs/reference-library-spec.md#app-wide-rule-cards`: shared popup, English labels, stable references,
  section targets, preserved drafts, keyboard focus, in-card navigation and historical metadata.
- `docs/reference-library-spec.md#confirmed-library-coverage` and
  `#confirmed-release-scope`: public core-only catalog remains separate from campaign state.
- `docs/table-spec.md#monster-visibility-and-health-display`: table monster detail privacy.
- `docs/build/V13-reference-libraries.md#acceptance-checks` and the app-wide follow-up work log.
- `docs/build/README.md`: independent review and verification requirements.
- Latest user steering: reduce icon artwork from 16px to 12px while retaining its click target.

Reviewed the complete uncommitted application and ingestion diff, the new reference resolver,
modal reader, icon/style asset, event links, wizard presentation metadata, focused tests, and
the closeout query's added existing ability ID. No vendor files were changed or online Draw Steel
research performed. No new mechanical interpretation is introduced.

## Acceptance evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Shared clean labels and rulebook control replace existing inline source blocks | Verified | Static review of wizard, sheet, conditions, foe views, both logs, ability selection and cleanup cards; source snapshots remain in shared/backend data. |
| Centered, scrollable card and blurred backdrop | Verified | Modal CSS; successful popup test in `/tmp/salient-rule-links-rerun.log` checks blur and actual overflow. |
| Escape, backdrop and close dismissal; focus return; preserved route and unsaved inputs | Verified | Successful popup scenario explicitly asserts these behaviors, focus within the dialog, one browser page and retained appearance text. This is implementer-run evidence, not a second independent browser execution. |
| Related reference navigation stays within the card and supports Back | Verified | Popup callback/history implementation and successful popup test. |
| SCC IDs, legacy paths, chapter sections and monster blocks resolve | Verified | Independently reran the three reference tests in their initial standalone file: every presented wizard reference and runtime manifest source, named Goblin ability/trait blocks and free strike resolve; section IDs exist in generated articles. They now live in `tests/scripts/rules.test.ts` and use its existing in-memory ingestion fixture; that test-only move was reviewed below. |
| Icon artwork is 25% smaller with click area retained | Verified | `reference.css` uses 0.75rem artwork and a separate 1.75rem control box (12px and 28px at the standard root size). |
| Operational costs, controls, live values and gameplay semantics remain | Verified | Static diff preserves command invocations, costs and resolution controls; backend change only projects stored `abilityId`. Independent closeout tests passed. |
| Full account/session journey, Director foe popup and saved private draft | Verified | Final `tests/browser/journey.spec.ts` rerun passed in 24 seconds, including the current foe modal and authored-draft save/reload assertions. |
| Additional full journey, wizard, table and closeout browser regressions | Not verified in full | The broad batch's closeout timed out at 300 seconds before a useful page snapshot, journey timed out, table audit was interrupted to stop resource pressure, and wizard was not reached. Popup passed. Earlier wizard execution completed creation/admission/sheet-audience UI assertions and later failed in a headless `/table roll` call with the backend's one-second execution timeout. These failures do not identify a reference-presentation defect. |
| Original V13 checks 1–2: core classification, nine classes, Winded search/readability | Verified | Successful full `pnpm check` log includes the rules ingestion/search tests; original source-path display was superseded by readable source names. |
| Original V13 checks 3–5: public references/private campaign reads, creature audit, full item text and no inventory writes | Verified | Existing V13 review and successful full check evidence; current diff adds no campaign joins to catalog reads or inventory operations. |
| Original V13 check 6: deterministic pinned-source rebuild | Verified | Successful `pnpm check` includes the unchanged deterministic rebuild assertion. |

Independent focused execution passed **10/10 tests** across rule references and closeout.
Final focused browser execution passed **2/2 in 28 seconds**, recorded in
`/tmp/salient-rule-cards-accepted-browser.log`: complete journey plus popup, including scroll,
focus, all dismissal methods, retained draft input, related-rule navigation and narrow viewport.
The implementer's `/tmp/salient-rule-links-check-final.log` records **85 engine + 315 app/tooling
tests**, lint, type checks, document links, vendor/content checks and production build passing.
The independent full ingestion-suite rerun timed out in its setup hook amid the reported
environment slowdown (340 seconds elapsed; five tests skipped). The attempted interruption
arrived after termination. It supplies no additional pass evidence and did not reach an assertion.

## Findings

1. **Low, nonblocking — eager full foe detail reads.** `web/foes.tsx:13` and
   `web/table/index.tsx:201` subscribe to the existing Director-only detail query as soon as each
   row renders, to obtain a stable source identity. Previously this happened only after opening
   the source. This preserves authorization but increases subscriptions and source-snapshot
   transfer for larger rosters. A later compact identity projection in the roster response can
   avoid that cost. The current limited prototype does not require this optimization to ship.
2. **Verification limit, nonblocking — additional browser regression coverage is incomplete.**
   The previously pending broad run is now dispositioned above. The reduced run in
   `/tmp/salient-rule-cards-focused-browser.log` recorded another successful popup scenario.
   Its journey timed out on the old `details.backstory-and-personality` label. Both remaining
   selectors were updated to the readable label and the final complete journey passed.
   Its wizard completed creation, admission, sheet
   audience checks and the added Brutal Slam popup assertions, then failed in the unchanged
   reconnect extension because the player draft was null after the Director reconnected
   (`tests/browser/acceptance-extension.ts:84`). These are distinct from the earlier backend
   timeouts; the reconnect failure's cause is not established here. No full browser suite pass
   is claimed. The feature contract is supported by the successful popup scenario,
   exhaustive reference/anchor assertions, shared-component review and successful repository tests.

## Reproduction limits

The popup browser result and complete `pnpm check` result were inspected as implementer-run
evidence. I did not run browsers concurrently with the implementer. I independently reproduced
reference/anchor and closeout checks. The full journey/wizard/table/closeout browser batch has
not been independently reproduced or certified here. The initial popup selector ambiguity was
corrected and the popup subsequently passed repeatedly; the initial journey icon-count selector
was updated, and both stale details-field selectors were corrected. The final complete journey
and popup both passed, as recorded above.
No code assertion failed in the independent checks; the independent ingestion rerun did not get
past its setup timeout. This re-review supersedes the initial verification-pending verdict.

## Test portability follow-up

Reviewed the move of the three reference tests into `tests/scripts/rules.test.ts`: **pass**.
The previous standalone file read ignored `public/rules-data` assets at module initialization,
which could fail on a clean checkout. The final tests reuse `built.catalog` and `built.articles`
from the existing `buildRules()` setup, preserve the same reference and anchor assertions, and
introduce no extra ingestion. The standalone file was removed. No feature implementation changed.
This final test-only form was reviewed statically; the implementer will run the refreshed full
repository check after browser execution finishes.
