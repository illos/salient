# A02: Minimal wizard, admission review and character sheet

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required (the evaluator implements R02 formulas) |
| Depends on | R01, R02, R03, S01, A01 |
| Unblocks | A03 (hero roster), A09 |
| Status | see `STATUS.md` |

## Goal

Deliver the minimal level-one devil Fury wizard as a real decision flow over the R01 table, the pure
evaluator implementing R02, admission of the evaluated hero into a campaign under the review rules, and
the v0.01 character sheet both standalone and in the table's heroes pane. A loaded fixture behind a
mock wizard does not satisfy this slice.

## Spec references

- `docs/character-wizard-spec.md#v001-scope`, `#3-decision-system`, `#4-wizard-flows`,
  `#main-creation-and-editing`, `#7-revision-and-review-lifecycle`, `#9-shared-operations-and-reliability`,
  `#11-acceptance-scenarios`
- `docs/character-wizard-spec.md#6-ownership-attachment-and-permissions`
- `docs/character-sheet-spec.md` — all sections.
- `docs/table-spec.md#party-sheets-and-resource-visibility`, `#character-sheet-lock-during-encounters`,
  `#persistent-values-and-manual-adjustment-entries`
- `docs/accounts-and-access-spec.md#characters`, `#7-character-visibility-and-delegated-play` (peers see
  Stamina and Recoveries; notes owner-private)
- `docs/fury-level-one-decisions.md`, `docs/character-derived-values.md`, `docs/live-state-initialization.md`
  (R01 to R03 deliverables)
- `docs/pre-alpha-design-gaps.md#confirmed-first-acceptance-journey`

## In scope

- Wizard UI over the R01 JSON: every step in source order, source text panel per option, live "hero so
  far" summary from the evaluator, save draft and reopen, at least one supported option per step and the
  full pool visible with unsupported options labeled.
- Evaluator `shared/evaluate/character.ts` implementing R02 with provenance; run as a shared operation
  `characters.evaluate`; results persisted on the revision (`derivedBaseline` populated, status from the
  contract).
- Admission: submit for Director review; Director approve/decline through registered operations; owning
  active Director's own admission logged without approval; withdraw undecided submission; pending edits
  leave the effective build unchanged; combat lock respected (the lock itself is applied by A04).
- Live state initialized per R03 on first admission; draft saves never touch live values.
- Character sheet: compact header (identity, Stamina current/max/temp with winded, Recoveries with Catch
  Breath control wired to A05 when it lands, heroic resource, surges, Victories, turn state placeholder),
  body order Actions and abilities / Conditions / Features and modifiers / Character details; expandable
  source text; grouping by Main actions / Maneuvers / Move / Triggered using only source metadata;
  condition toggles rendered from R05's list (toggle operation itself in A03); Director editable persistent
  numbers producing Manual adjustment entries; hero selector for multi-character users.
- Standalone character page and the same component in the table heroes pane.
- Remove the paper-sheet fields that the spec excludes (dying tracker, empty enchantment panels).

## Out of scope

- Level-up, progression history UI, duplication, detachment UI, Forge Steel import (V08, V09).
- Inventory or starting equipment (V07).
- Any class-resource automation; Ferocity is an editable counter with readable rules.
- Mobile layout.

## Inputs and dependencies

R01, R02, R03 committed; S01 content available; A01 registry for the sheet's operations. If A03 is not
yet merged, condition toggles and Catch Breath render disabled with a visible "pending A03/A05" label,
not a fake handler.

## Deliverables

- `web/wizard/**`, `web/character-sheet/**`, `shared/evaluate/character.ts`
- `convex/characters.ts` extended: evaluate, submit, approve, decline, withdraw, adjust persistent value
- Tests: evaluator against the three R02 examples; admission authority matrix; draft save leaves live
  state unchanged; Manual adjustment entry shape
- Browser test: create the fixture hero through the wizard, submit, approve as Director, view sheet as
  owner, peer and observer

## Acceptance checks

1. Walking the wizard with the hero-fixture choices yields an evaluated baseline equal to the R02 complete
   example, read back from the revision document.
2. Leaving the kit unselected yields status incomplete with a diagnostic naming the kit decision id;
   over-budget traits yields invalid.
3. A player's submission is not effective until Director approval; the Director's own hero is effective
   on submission with a logged entry; withdrawal before decision works.
4. Saving a draft edit after admission leaves current Stamina and every live value unchanged (read back).
5. Peer view shows Stamina and Recoveries only; owner notes are absent from the peer and Director query
   payloads (not merely hidden in UI).
6. Every ability on the sheet shows verbatim source text from S01; no ability appears that the baseline
   does not grant.
7. Director edit of Victories from 0 to 1 produces a Manual adjustment event with before/after values.
8. Rules reviewer confirms the evaluator's arithmetic against R02 and the Compendium.

## Rules research

R01 to R03 are the research; the implementer does not re-derive. If a formula in R02 cannot be
implemented as written, stop and raise `Q-A-n`; do not adjust the formula.

## Open questions

- Q-CHAR-1 answered 2026-09-14: no. Do not present the Complication step in the v0.01 wizard.

## Work log

_Empty._
