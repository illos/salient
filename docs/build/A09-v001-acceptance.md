# A09: v0.01 acceptance walkthrough

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App lead with an independent reviewer and a rules reviewer |
| Rules review | required |
| Depends on | A02, A05, A06, A07 (A08 optional) |
| Unblocks | all V slices |
| Status | see `STATUS.md` |

## Goal

Run the confirmed acceptance journey end to end, headless and in the browser, across Director, player
and observer, with real persisted state, retries, reload and reconnect, and record the evidence. This is
the milestone gate. It is a verification slice: it adds tests and evidence, fixes defects it finds in
small commits attributed to the owning slice, and changes no scope.

## Spec references

- `docs/pre-alpha-design-gaps.md#confirmed-first-acceptance-journey`
- `docs/pre-alpha-design-gaps.md#v001-combat-acceptance-checklist` — every Required cell.
- `docs/v001-basic-play-walkthrough.md` — all steps and every "confirmed" review case.
- `docs/v0.01-readiness-audit.md` — G1 to G7 must show delivered artifacts.
- `docs/development-process.md#verification-strategy`, `#headless-development-workflow`
- `docs/v1-tech-stack-spec.md#9-verification-and-acceptance` — table performance sample.
- `docs/web-app-build-handoff.md#v001-scope-review-complete--build-handoff` — acceptance paragraph.

## In scope

- A scripted headless scenario `tests/acceptance/v001.walkthrough.test.ts` executing every walkthrough
  step through `pnpm app` operations with disclosed dice inputs, asserting persisted state after each step
  by reading it back, including retries with the same commandId, undo/redo branches, closeout, and a
  separate Void branch including while paused.
- The browser journey extended to the full path: sign-up for three users, campaign, invitation, hero
  through the wizard, review, session, foe, combat, attack, damage, conditions, undo, closeout, next
  session start.
- Reload and reconnect during combat for each role; the active turn and cards survive.
- Performance sample: one hour of scripted play in Chromium with heap and DOM measurements at intervals,
  recorded like the existing `.playtest/table-performance.json`.
- Coverage report: a generated list of which walkthrough steps and checklist cells are verified by which
  test, checked in under `docs/build/evidence/v001-acceptance.md`.
- Update `docs/workstream-app-status.md` and the readiness audit with the outcome. Do not certify anything
  the tests did not exercise.

## Out of scope

- New features. Any deferred item in the checklist. Mobile.

## Inputs and dependencies

All listed slices committed. Both dev servers running for browser tests.

## Deliverables

- Tests above, evidence document, status updates, defect fix commits referencing the owning slice.

## Acceptance checks

1. The headless scenario passes from a reset database with output attached to the evidence document.
2. The browser journey passes in three contexts; video or screenshots retained under `.playtest/`.
3. Every Required cell in the checklist maps to at least one passing test in the evidence document; any
   cell without a test is listed as not verified, not omitted.
4. Reload during a player's turn restores the same active turn, targets draft cleared, and pending cards.
5. The one-hour sample shows bounded DOM node count and post-GC heap within the tolerance recorded in the
   tech-stack acceptance section, or the deviation is recorded as a defect.
6. Independent reviewer reruns the headless scenario and confirms the evidence; rules reviewer confirms the
   walkthrough's numeric outcomes against R04 and R05.
7. `docs/build/STATUS.md` marks A09 Committed only after both reviews pass.

## Rules research

None new; reviewers use R04 and R05.

## Open questions

Any open `Q-` entry that a Required cell depends on blocks that cell's verification; list them in the
evidence document.

## Work log

### Build handoff and coverage gaps (2026-09-15, Codex build team)

This is a read-only inventory of existing acceptance artifacts, not a verification verdict. The
user's separate audit thread owns independent acceptance and rules verification. Concurrent A02,
A04, A05 and A06 repairs were in progress during this inspection; their audit reports and files
remain owned by that thread. The build team supplies remaining implementation and integration work.

| Area | Existing starting point | Evidence still required |
| --- | --- | --- |
| Headless full journey | `tests/app/` contains operation-level character, admission, combat, ability and history tests. | The specified `tests/acceptance/v001.walkthrough.test.ts` does not exist at this checkpoint. Run one connected real-app journey with persisted readback, retries, history branches, closeout and Void; keep disclosed inputs and expected source-derived results. `tests/acceptance.test.ts` exercises the earlier standalone `src/` engine and is not equivalent evidence. |
| Browser full journey | `tests/browser/wizard.spec.ts`, `journey.spec.ts`, `combat.spec.ts` and `table-audit.spec.ts` cover separate parts of the journey. | A connected three-role path through normal closeout and next session, plus Void branches, remains unverified. Existing tests do not invoke the A07 closeout/Void workflow. Retain fresh screenshots/video for the completed build. |
| Combat reload and reconnect | `journey.spec.ts` includes a player network interruption; `table-audit.spec.ts` reloads the player. | Verify interruption/reload during combat for Director, player and observer, preserving the active turn and pending cards and clearing the local target draft without duplicate effects. Existing lifecycle reloads do not prove this combat scenario. |
| Required checklist mapping | The owning checklist remains `docs/pre-alpha-design-gaps.md#v001-combat-acceptance-checklist`. | `docs/build/evidence/v001-acceptance.md` does not exist at this checkpoint. Map every Required cell to fresh passing evidence or explicitly record it unverified. Include the settled A02 language/assignment repairs and new A07 behavior. |
| Sustained table behavior | `.playtest/table-performance.json` records 40 pause/resume cycles, one Director context, two post-GC samples and a two-second idle sample. | This report explicitly disclaims multihour/multiplayer certification. Run representative combat/lifecycle activity with periodic DOM and post-GC heap samples; record browser, roles, workload, duration and observed trends. |
| Review and gate | Existing slice work logs describe prior verification and limitations. | The separate audit team must rerun the final implementation and report independent and rules verdicts. No A09 completion or committed status is established by this handoff. |

Specification discrepancy: this slice proposes a one-hour performance sample and refers to a
numeric tolerance in the tech-stack acceptance section. The owning
[tech-stack section](../v1-tech-stack-spec.md#9-verification-and-acceptance) instead says the
prototype duration/group size are not selected and numerical budgets should follow measurements.
Keep the one-hour sample as this slice's proposed procedure, report actual results and limitations,
and do not invent a pre-existing numeric pass threshold or certify the proposed six-hour V1 target.

Inspection commands: `rg --files tests .playtest docs/build/evidence`, targeted searches of browser
tests for reload/network interruption/closeout/Void, and reads of the existing performance JSON,
walkthrough, scope checklist and tech-stack acceptance section. No test suite or browser scenario
was run for this documentation-only inventory.

### 2026-09-15 — A07 build hand-back

A07 now provides the shared closeout/Void operations, table controls, 13 focused backend/session
tests and a three-role browser scenario in `tests/browser/closeout.spec.ts`. The independent
[A07 review](audits/2026-09-15-A07-review.md) passes for backend/source behavior. Browser gameplay
assertions reached final teardown, which failed due to a missing shared Playwright trace artifact;
a successful isolated-output rerun remains an audit gate. The audit coordinator owns new acceptance
tests, final sync, coverage mapping and the A09 verdict. This update does not certify the complete
walkthrough, reconnect or sustained-performance requirements.

### 2026-09-15 — Coordinated acceptance closure

The connected fresh-backend test is `tests/app/v001-walkthrough.test.ts`; its independently
researched inputs and outcomes are recorded in the
[source walkthrough](audits/2026-09-15-A09-walkthrough.md) and
[independent verdict](audits/2026-09-15-A09-independent-review.md). The live wizard journey extends
through three-role combat reconnect, a persisted pending card, targeting-draft clearing, actual
ability/correction/Undo/Redo controls, normal closeout and the next session. The separate closeout
scenario covers both Void paths and paused session closure.

The [acceptance record](evidence/v001-acceptance.md) maps every Required checklist cell to passing
evidence and records full checks, desktop visual inspection, live CLI, code generation, reseeding
and the measured performance limits. The one-hour procedure above remains a proposal, as explained
in the specification discrepancy; the actual representative sample does not certify a soak target.
Newly settled character decisions were implemented where applicable and independently reviewed.
The reviewed question queue now has no open questions and three explicit post-playtest deferrals.
