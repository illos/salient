# V40 unsaved wizard independent review

Reviewer: `v40_review`, 2026-09-19. Reviewed `slice/V40` at documentation commit
`00ac99d4b0a3c83ae3a4e6a36b76c118d5a3ec70` plus working implementation and new fixtures against
`main` baseline `6ddb3cb`. This reviewer authored no implementation changes.

Verdict: **pass — implementation gate**. Acceptance checks 1–5 are verified by independent
source inspection and retained implementer-run evidence. No unresolved blocking findings remain.
Acceptance 6 is the subsequent lead-owned integration/shared-runtime gate; it is not certified here.

## Specifications and evidence read

- [Main creation and editing](../../character-wizard-spec.md#main-creation-and-editing)
- [Shared operations and reliability](../../character-wizard-spec.md#9-shared-operations-and-reliability)
- [V40 acceptance](../V40-unsaved-wizard.md#scope-and-acceptance)
- [Review standard](../README.md#review-standard) and
  [merge completion](../README.md#merge-completion-includes-the-playable-app)
- Project `AGENTS.md`, `agent.MD`, `CLAUDE.md`, and the installed Convex expert skill.

Inspected the complete application/test diff, command receipts, pending-command handling,
selection conversion, existing ownership/revision protections, new browser fixture and journey.
Read [original check output](../evidence/V40/check.log),
[remaining check stages](../evidence/V40/check-completion.log),
[final lint/type/build output](../evidence/V40/final-check.log),
[focused draft browser output](../evidence/V40/draft-browser.log),
[regression output](../evidence/V40/regression-browser.log),
[full Fury rerun](../evidence/V40/fury-browser.log), retained failures, and the
[evidence record](../evidence/V40/README.md). Visually inspected
[unsaved Details](../evidence/V40/unsaved.png) and [saved draft](../evidence/V40/saved.png).

## Acceptance checks

1. **Verified — no creation on entry, Exit or reload.** The character-list link opens
   `/characters/new/wizard`; the route supplies no character ID and the wizard skips the saved
   character query. Preview uses the existing read-only evaluator. The unsaved Exit branch only
   navigates to the list. The focused browser journey reads the authenticated character list after
   selection, rejected save, Exit and reload and observes no records; reload clears local choices.
2. **Verified — naming inside Details.** Blank save selects Details and shows the name error
   before invoking a mutation. Browser assertions verify the prompt, field and empty persisted list.
   Server validation still trims and requires 1–100 characters. The character-list name form is gone.
3. **Verified — atomic, validated, idempotent first save.** `characters.create` accepts optional
   selections, shares bounds/JSON/provenance/duplicate-decision validation with later saves, replaces
   known-choice provenance with pinned canonical references, evaluates, and writes the character,
   revision and receipt in one mutation. Authentication precedes writes. New app tests read back
   authored fields, selections, evaluation and exactly one revision after retry; invalid input leaves
   both tables empty, forged known provenance is canonicalized, anonymous creation and another user's
   read are denied. Browser readback verifies revision 1 and selected ancestry after first save.
   The delayed-request case also proves native inputs and custom drop callbacks cannot change the
   submitted snapshot while saving.
4. **Verified — subsequent identity and protections.** Successful first save replaces the temporary
   URL with the returned ID and mounts the saved editor. Later writes retain the existing save path,
   owner check, expected revision/effective revision checks, combat lock and review invalidation.
   Existing app coverage remains passing. Browser reload recovers choices; the next save advances the
   same character to revision 2 with the edited name. Both first-save buttons are exercised.
5. **Verified — implementation checks and independent review.** Original lint/types and 674 tests
   passed (274 engine, 400 app/tooling). A pre-existing V39 documentation anchor stopped the aggregate
   command; after its correction, the remaining link/source/content/build stages passed. Later route
   and pending-edit fixes passed final lint, TypeScript and build. Nine unique affected browser
   scenarios pass across the focused draft run, seven regression cases and the final full Fury run.
   Earlier failures remain recorded rather than counted as passes. This report completes independent
   implementation review before integration.
6. **Not verified here — subsequent integration/shared delivery gate.** Branch verification is
   explicitly separate from integration and the established CT114 shared `main` update. The lead
   must record the integrated commit, actual serving target and changed-feature persisted readback
   before reporting delivery complete. This report makes no hosted-deployment claim.

## Findings by severity

No unresolved Critical, Important or Minor implementation findings.

Resolved findings:

- **Important, resolved:** `web/wizard/index.tsx:757` and `:770`. A disabled fieldset did not block
  characteristic drops on non-input elements. A drop during a pending first save could alter local
  choices after submission and lose them on remount. The reviewer identified this; selection and
  authored callbacks now reject changes while pending. The browser holds the actual create request,
  dispatches a drop and verifies the assignment stays unchanged before releasing the request.
- **Important, resolved:** `web/router.tsx:355`. Browser verification exposed conditional calls to
  `useParams` across the new-to-saved transition. The route now reads params once unconditionally.
  Source re-review and successful first-save browser transitions verify the correction.
- **Minor, resolved:** `tests/browser/character-fixtures.ts` and affected wizard fixtures used stale
  labels/control assumptions. Corrections match the current UI, preserve selected values and retain
  the original behavioral assertions. No rule or source-pin changes were introduced.

## Verification limits

This reviewer independently inspected source, test assertions, logs and screenshots; runtime checks
were executed by the implementer on CT114, not repeated by the reviewer. No build, install, browser
or development server workload ran locally for this review. Exact remote/local source hash matching
is implementer-reported evidence, not an independently repeated operation.

The full Fury journey initially hit an anonymous-backend one-second query timeout in its existing
table action loop after wizard/admission assertions passed. The retained bounded rerun passed the
whole scenario in 3.8 minutes. This does not establish broader table performance. The Details
screenshot is scrolled below its name label; persisted-data claims rely on authenticated readback
assertions rather than that screenshot alone. No implementation claim remained unsupported by the
supplied final evidence, but shared-runtime delivery remains unverified as stated above.

Chords could not uniquely map this child session. No sender identity was guessed; the parent
coordinated the project and received review findings directly. Rules review is not required for this
persistence/UI-only slice.
