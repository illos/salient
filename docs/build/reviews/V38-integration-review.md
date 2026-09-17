# V38 independent integration review

Reviewer: `v38_integration_review`, 2026-09-17. Reviewed the pending `slice/V38`
integration of main `0993e51` and reviewed V36 `5e8b675`, including V30/V35 dependencies.

Verdict: **pass for the pre-merge integration/navigation review**. Static inspection, the
integrated full check and all 12 browser scenarios pass, with no blocking finding. Final commit
gates, main integration and the shared playable update remain steps owned by the integration
lead; this review does not certify those later actions.

## Specifications read

- [User-visible catalog flow](../../monster-catalog-spec.md#user-visible-flow).
- [Foes browsing](../../monster-catalog-spec.md#foes-library-browsing--v36).
- [Public reference coverage](../../reference-library-spec.md#confirmed-library-coverage).
- [V38 acceptance](../V38-foes-integration-navigation.md#acceptance-and-verification).
- [Review standard](../README.md#review-standard) and
  [merge completion](../README.md#merge-completion-includes-the-playable-app).

Read `AGENTS.md`, `agent.MD`, `CLAUDE.md`, the slice and the preserved V30/V35
implementation/source and V36 implementation reviews. This is an integration/navigation review;
the unchanged source packages retain their existing independent source certification. No new
rules interpretation or ability execution is introduced.

## Integration boundaries

Direct Git comparisons verified that the Foes importer, identity/source registries, generated
catalog and editions, display contracts, resolver, library UI and relevant tests equal reviewed
V36 `5e8b675`. Convex, character UI/wizard, evaluator, shared UI components, dependencies and
vendor pins equal main `0993e51`. The conflict-free merge preserves both lines of work.

The additional product diff adds the primary Foes link and explicit empty search objects on the
primary Rules/Foes links and the Rules-to-Foes crosslink. `/rules` and `/foes` remain independent
public routes with their existing validators, datasets and return-to-app controls. The change
does not alter private roster access, live loading, character persistence or source semantics.

The new browser scenario uses actual registration and primary navigation, checks the full default
statblock count, opens Goblin Warrior, returns to the app, enters Rules with an empty search,
and then follows the Rules-to-Foes link after searching Rules. These assertions exercise actual
catalog separation and prevent query leakage; they are meaningful coverage of the new behavior.

## Acceptance checks

| V38 check | Result | Evidence |
| --- | --- | --- |
| 1. Separate primary links, correct libraries, return path and public access | Verified | Static routing/link inspection, passing new authenticated journey, public Rules/Foes regressions and inspected primary-nav/Foes screenshots. Existing public scenarios start without authentication. |
| 2. Complete library, independent feature kinds, filters/cards/navigation/responsiveness | Verified | Reviewed V36 implementation is byte-identical; all library and reference scenarios pass in the integrated browser run. Source reproduction passes. |
| 3. Full checks, exhaustive parent/feature coverage and character/table regressions | Verified | Durable full-check and 12-scenario browser logs pass, including the exhaustive parent loop, hero/Director sheets and both V37 supporting-choice/private-inheritance journeys. |
| 4. Pre-merge independent review and commit gates | Review verified; final commit gate not yet verified | This report supplies the independent pass. The lead records a pass for the five existing dependency commits; the final V38 commit must pass its gate before integration. |
| 5. Main integration and shared playable delivery | Not verified | Later delivery step explicitly outside the pre-merge verdict; requires the lead's main commit and shared-app evidence. |

The [integrated full-check log](../evidence/V38/check.log) records successful lint/formatting,
typechecks, 274 engine and 389 app/scripts tests (663 total), 227 Markdown link checks, both
unchanged vendor pins, 483 exact character entries, 289 supporting source records, deterministic
438-statblock/2,006-feature ingestion, 2,614 Rules entries and production build.

The [integrated browser log](../evidence/V38/browser.log) records all 12 scenarios passing in
3.7 minutes on the isolated CT114 `characters` environment. Inspected the actual
[primary navigation](../evidence/V38/v38-primary-navigation.png),
[Foes library](../evidence/V38/v38-foes-library.png) and
[enlarged mobile layout](../evidence/V38/v36-library-mobile.png) captures. The primary links
are separate and legible; the Foes destination shows its own kinds, filters and full count.

## Findings

No blocking or nonblocking implementation defect identified in the reviewed integration diff.

The inherited 6.73 MB Foes chunk (705 KB gzip) remains a build size advisory documented by the
prior review. The current evidence does not establish a low-bandwidth or broader latency budget.
This integration introduces no additional catalog payload.

## Verification limits

The reviewer performed read-only Git/source inspection and inspected retained execution evidence.
Only the integration lead runs CT114 workloads; no independent reviewer build or browser rerun
is claimed. The final browser log and the screenshots listed above were inspected. The code did
not change between the passing full check and final browser run, per the lead's execution record.

The exhaustive corpus scenario opens every one of the 501 parent cards and verifies all 2,006
feature controls are visible. It does not open every child card independently. Representative
feature/parent/nested-rule navigation is covered by the separate library scenarios. Source
fidelity is supported by the unchanged V30/V35 source reviews and reproducibility checks,
not inferred solely from the browser's generated-package expectations.

The V38 line-only reporter retained the passing corpus scenario but not a new structured coverage
attachment. The retained V36 attachment describes the identical catalog and is not represented as
a new V38 run artifact. No final shared-runtime or merge completion claim was available for this
pre-merge review, and no such claim is made here.

Chords `whoami`, `list_threads` and `check_updates` returned an ambiguous-provider-session
error. The assigning lead retains project coordination; this reviewer supplied no sender identity.
