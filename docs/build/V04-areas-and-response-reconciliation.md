# V04: Persistent area cards and response reconciliation

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | A09 |
| Unblocks | V05, V20 |
| Status | see `STATUS.md` |

## Goal

Deliver persistent area-effect cards pinned at the bottom of the game log with owner/Director membership
controls, per-firing confirmation and Resolve now, all registered with the game clock; and the
apply-then-revise model for responses that modify an already-applied outcome (Lines of Force style),
within the sequential undo seams. The slice implements the confirmed card and history contracts and
stops at source-specific consequence ordering, which stays manual and recorded.

## Spec references

- `docs/table-spec.md#persistent-area-effect-cards` — pinned card, membership edits vs firing confirmation, Resolve now, live projection of immutable records.
- `docs/table-spec.md#inline-interaction-cards-in-the-game-log` — minimum-input cards, Resolved at table.
- `docs/table-spec.md#game-clock-and-scheduled-rules-work` — clock owns scheduled work; FIFO/save-last policy.
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` — seams a linked response must respect.
- `docs/table-spec.md#next-baseline-contracts` — "Concrete action/response sequence" and "Same-turn dependencies" rows.
- `docs/pre-alpha-design-gaps.md#response-reconciliation--deferred-beyond-v001` — the deferral this slice lifts; F3 precondition.
- `docs/table-command-spec.md#triggered-opportunities` — response windows.
- `docs/table-command-spec.md#clock-driven-operations` — clock-fired operations.
- `docs/engine-architecture.md#structured-effects-are-the-common-contract` — typed effects a revision must re-derive from.

## In scope

- Area card lifetime: create on effect registration, stay pinned until the clock ends it, then remain in history unpinned.
- Membership checkbox operation (immediate, no Apply) and firing-confirmation operation (previous selection pre-checked), as distinct registered operations.
- Dependent clock work waits for confirmation; Resolve now reuses the same confirmation flow.
- Linked response record: a response applied after a triggering outcome that revises that outcome, with the revised effective result on the current branch and links to the prior result.
- Undo of a linked response restores the prior effective result without undoing the source action.

## Out of scope

- Exact effect-owner control mapping and source-specific membership/entry effects (`docs/table-spec.md#next-baseline-contracts`, open).
- Automatic repair of dependent consequences (collision chains); record as manually resolved (`docs/pre-alpha-design-gaps.md#response-reconciliation--deferred-beyond-v001`).
- Parsing area abilities from source text (V05) and terrain objects as area sources (V20).
- Compact/expandable card formatting (recommended, not required).

## Inputs and dependencies

- Hard: A09 (clock, log cards, undo/redo, corrections).
- Soft: an ability with a persistent area from S01; otherwise `fixtures/area-effect-sample` with a hand-authored registration.

## Deliverables

- Area-effect record and linked-response record types in `shared/contracts/`.
- Registered operations: area membership edit, area firing confirm, area resolve-now, response apply-linked.
- Convex-test cases for the checks below; browser test for a pinned card across two rounds.
- Implementation notes in `docs/table-spec.md#persistent-area-effect-cards`.

## Acceptance checks

1. Registering an area effect with a two-round end condition persists a clock entry and a pinned card; after the second round-end firing the card record is unpinned and still readable in history.
2. A membership checkbox edit persists immediately as its own log entry and does not fire any effect.
3. The next firing produces a confirmation request pre-filled with stored membership; dependent saves are absent from the log until confirmation is recorded.
4. Applying a linked response to a committed damage outcome appends a revised result; the sheet query shows the revised Stamina and the original entry is unchanged.
5. Undoing the linked response restores the prior Stamina while the source ability's use remains in the log.
6. A player's undo attempt across another character's committed response is refused with the seam identified.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/combat/area-of-effect.md`, `rule/combat/aura.md`, `rule/combat/burst.md`, `rule/combat/cube.md`, `rule/combat/line.md`, `rule/combat/wall.md`
- `vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md`, `rule/combat/end-of-turn.md`
- `vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md`
- Research already done: `docs/research/ally-response-after-resource-spend.md`, `docs/research/trigger-opportunity-intervening-actions.md`, `docs/research/turn-boundary-ordering.md`.

Rulings that apply: Thorn's Parry closure case (precedent identified by the user; original case only); committed Director corrections create seams; FIFO/save-last clock policy.

## Open questions

Candidate `Q-V-n` entries from `docs/table-spec.md#next-baseline-contracts`:

- Exact effect-owner control mapping for area cards.
- Source-specific consequence order, dependent consequences and conditional costs in linked responses.
- Undo-unit and concurrency details for same-turn dependencies.

## Work log

_Empty._
