# V42 primary choice independent review

Reviewer: `v42_review`, 2026-09-19. Reviewed `slice/V42` at specification commit
`ed98ca2` plus the working implementation against baseline `e28e764`. This reviewer authored no
application or test changes.

Verdict: **pass — bounded implementation gate**. Acceptance 1–5 is verified for the changed wizard
presentation and persisted-choice behavior, with no unresolved blocking finding. The full combined
Fury/admission/table test failed twice after completing the changed wizard flow; the retained backend
timeouts and the limits of this verdict are explicit below. Acceptance 6 remains the subsequent
lead-owned shared development delivery gate.

## Specifications and evidence read

- [Main creation and editing](../../character-wizard-spec.md#main-creation-and-editing)
- [V42 acceptance](../V42-primary-choice-summary.md#acceptance)
- [Review standard](../README.md#review-standard) and
  [merge completion](../README.md#merge-completion-includes-the-playable-app)
- Project `AGENTS.md`, `agent.MD` and `CLAUDE.md`.

Inspected `web/wizard/index.tsx`, `web/wizard/primary-choice.tsx`, the affected browser-test diff,
the new V42 journey, and the existing decision editor, presentation mapping, source-reference
component, availability/pool helpers and supporting-kit definitions. No rule mechanics changed;
rules review is not required.

Read the [full check output](../evidence/V42/check.log),
[final fixture checks](../evidence/V42/fixture-check.log),
[focused browser result](../evidence/V42/browser.log), and
[evidence record](../evidence/V42/README.md). Read the retained initial lint failure and
detached-radio browser failure, including its page snapshot; neither is counted as a pass.
Read the [five-pass regression result](../evidence/V42/regression.log),
[Fury retry failure](../evidence/V42/fury-retry.log), both failure contexts, and the
[table query timeouts](../evidence/V42/table-timeouts.log) and
[admission mutation timeout](../evidence/V42/admission-timeout.log).
Read the [final lint/types/build](../evidence/V42/final-check.log) and
[final V42/V40 browser results](../evidence/V42/final-browser.log) after the optional-absence guard.
Independently checked all eight local code/test files against the retained
[remote source hashes](../evidence/V42/source-sha256.txt); all match.
Visually inspected the [light Class summary](../evidence/V42/class-step-light-1440x900.png),
[dark Class summary](../evidence/V42/class-step-dark-1440x900.png),
[Ancestry chooser](../evidence/V42/ancestry-editing.png), and
[selected ancestry dependents](../evidence/V42/ancestry-selected.png).

## Acceptance checks

1. **Verified.** Available single catalog decisions
   for Ancestry, Career, Class, Kit and Complication use the summary wrapper. New unselected choices
   render the existing chooser, and supported selections display their name, source reference and
   Edit followed by the other step decisions. Option-specific sources and pooled kit source maps
   retain the existing rule reader.
2. **Verified.** Edit changes presentation state and
   unmounts dependent controls without changing the selection map. Keeping the current raw value,
   including undefined/None, skips `select`; replacement invokes the original shared dependency
   pruning. Unsupported options retain their disabled controls. The journey checks preserved Devil
   and Artisan dependents, replacement with Polder/Elementalist and persisted removal of Devil choices.
3. **Verified.** A revisited step mounts with editing
   false. Confirmed None survives step navigation in Wizard state, and saved optional absence starts
   collapsed. The journey covers None revisit, saved reload and unchanged revision after keeping
   Artisan and None. Unavailable Kit uses the previous availability rendering, while Culture and
   Details fail the single-choice wrapper predicate and retain their independent fields.
4. **Verified.** After an explicit transition the
   effect focuses either the named chooser group or the named Edit button. The journey asserts both
   focus targets and opens full Mountain and Elemental Inside sources; affected supporting-choice
   coverage opens Artisan and Arcane Archer sources through their summary references.
5. **Verified for the bounded implementation scope.** Full `pnpm check` passed 674 tests
   (274 engine, 400 app/tooling),
   lint, types, links, source/content checks and build. The focused browser journey passed in
   16.0 seconds, five affected regression scenarios passed, and four retained screenshots were
   inspected. The Fury wizard assertions passed before downstream failures described below; the
   entire Fury/admission/table test did not pass. After the only subsequent application change,
   the optional-absence guard, final lint/types/build and V42/V40 browser journeys passed
   (two tests in 36.2 seconds). Six distinct browser scenarios passed in total. This report completes
   independent review. Static diff inspection confirms no persistence, schema, content, shared
   evaluator or rule changes.
6. **Not verified here — subsequent integration/shared delivery gate.** The lead must record the
   integrated commit, actual serving target and changed-feature check before reporting delivery
   complete. This review does not certify deployment.

## Findings by severity

No unresolved blocking findings.

Resolved during review:

- **Important:** the initial `web/wizard/primary-choice.tsx:40` called the selection callback for an
  unchanged None choice, marking a saved draft dirty and invoking pruning; Exit could create an
  unnecessary revision. `web/wizard/index.tsx` now compares the candidate to the raw stored choice
  before calling `select`, and the V42 journey asserts revision 1 after keeping None and exiting.
- **Minor:** the initial `web/wizard/primary-choice.tsx:27` held confirmed None only in the keyed
  step component, losing the summary when navigating away and back. Wizard now owns the confirmation
  set, and saved optional absence starts confirmed. The journey asserts both revisit and saved cases.
- **Minor, identified by the implementer and independently confirmed:**
  `web/wizard/index.tsx:986` initially treated any saved optional choice without a supported display
  name as None. A nonempty unsupported/out-of-pool raw value could consequently display a misleading
  None summary. The confirmation predicate now also requires `primaryValue === undefined`, keeping
  such values in the chooser with existing diagnostics. This edge is verified by source inspection;
  the browser journey covers ordinary optional absence, not a seeded invalid saved value.

Verification corrections also resolved: the initial ref-analysis lint failure was addressed by
requesting focus with state and reading DOM refs only in the effect. Primary radio fixture actions
now use `click()` because selection immediately removes the chooser; the original `check()` waited
for a checked control that no longer existed. Summary, dependent-control and persisted-value
assertions remain in place. Final lint and the focused rerun pass.

## Verification limits

This reviewer independently inspected source, assertions, logs and screenshots. Runtime checks were
executed by the implementer on isolated CT114 `characters`, not repeated by the reviewer. No build,
install, browser or development server workload ran locally. Local hashes independently match the
retained remote manifest; collection of that remote manifest is implementer-reported.

The selected-Ancestry screenshot is scrolled down to dependent traits and shows an in-flight
evaluation; it is not evidence of the summary or settled derived values. Class screenshots show the
compact selected name, source reference, Edit and dependent controls. Persisted-state and keyboard
focus claims rely on passing browser assertions. Shared-runtime delivery remains unverified here.

The combined regression run passed layout, Elementalist, supporting choices, private inheritance and
unsaved creation, then failed the full Fury journey in its pre-existing table stress extension.
The test had already completed Fury creation, save, admission, all three sheet audiences and earlier
table operations. Its game-log count reached zero while the backend recorded one-second
`campaigns:get`, `encounters:current` and `sessions:list` execution timeouts. One unchanged retry
again completed Fury creation/save, then failed admission alongside a one-second `characters:submit`
timeout. Neither full Fury run is reported as passing. The prior V40 review records the same class
of local-backend timeout, but the exact underlying runtime cause is not established by this review.

These failures do not block the bounded presentation change: its changed flow passed before both
failures, persisted behavior is covered by successful dedicated journeys, and no backend, admission
or table implementation changed. This is not a claim that the whole browser suite or broader runtime
reliability passes. No failing assertion was removed, relaxed or skipped to obtain acceptance.

Chords MCP and the CLI from the canonical project checkout could not uniquely map this child session.
No sender identity was guessed; the parent received findings directly and owns project coordination.
