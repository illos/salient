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

_Empty._
