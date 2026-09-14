# V16: 3D dice presentation

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required |
| Depends on | A09 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Add an optional 3D dice tray that displays results already produced by the shared dice generator:
physics never supplies gameplay randomness, the tray renders on demand and returns the device to idle,
a static/text fallback is always available, remote viewers see the same accepted values, and the
planned dice-tower audience rule (Director-only, hidden from the roller) is enforced in the shared path
rather than the renderer. The generator, API types and persistence remain headless concerns.

## Spec references

- `docs/dice-roller-spec.md#1-confirmed-requirements` — optional presentation of supplied results.
- `docs/dice-roller-spec.md#roll-visibility-and-planned-tower-mode` — audience rule.
- `docs/dice-roller-spec.md#3-ownership-boundary` — headless generator owns results.
- `docs/dice-roller-spec.md#6-making-physics-display-supplied-results` — result-matching technique.
- `docs/dice-roller-spec.md#7-upstream-extraction-plan` — upstream code extraction.
- `docs/dice-roller-spec.md#9-implementation-sequence-and-acceptance-examples` — sequence and examples.
- `docs/table-spec.md#public-rolls-and-the-dice-tower` — public default; tower hidden from submitter.
- `docs/v1-tech-stack-spec.md#6-visual-quality-and-sustained-performance` — on-demand rendering, measured limits, phone prototype.

## In scope

- Tray component consuming roll records from the shared dice operation; final-face matching for d10/d3 and the additional types the spec lists.
- Lazy load, render only while a roll animates, explicit teardown releasing GPU/memory.
- Reduced-motion and text fallback showing the same values.
- Tower submissions: the submitter's client receives an acknowledgement with no faces/totals; the Director's client renders them.
- Measured phone performance recorded in the work log.

## Out of scope

- Any change to the generator algorithm, roll records or history (`docs/dice-roller-spec.md#3-ownership-boundary`).
- Tower UI gesture/control design and historical disclosure (unresolved; `docs/table-spec.md#public-rolls-and-the-dice-tower`).
- Dragging-to-reroll unless permissions already allow reroll (`docs/dice-roller-spec.md#10-decisions-still-open`).

## Inputs and dependencies

- Hard: A09 shared dice operation and roll records.
- Hard: extracted upstream renderer per the extraction plan, license-checked.

## Deliverables

- `app/dice/` renderer package with fallback; integration on the table log.
- Tower audience enforcement test at the query level (may already exist from A-slices; extend if so).
- Performance note with device, frame budget and memory before/after teardown.
- Implementation notes in `docs/dice-roller-spec.md`.

## Acceptance checks

1. For twenty recorded rolls, the rendered final faces equal the persisted roll record values (assert via a test hook reading the scene's settled faces).
2. With the tray disabled or reduced-motion active, the same roll shows identical values in text.
3. After a roll completes, no animation frame is requested and the WebGL context is released (checked with the browser test's performance hooks).
4. A tower submission's response payload and subscription updates for the submitter contain no dice values; the Director's do.
5. A remote observer client renders the same values as the roller's client for a public roll.
6. `pnpm check` passes with the renderer excluded from the initial bundle (verified by build output chunk names).

## Rules research

None.

## Open questions

Candidate `Q-V-n` entries from `docs/dice-roller-spec.md#10-decisions-still-open`:

- Final-orientation correction versus authored trajectories.
- Tray placement and size; initial additional dice types, styles, sound and motion defaults.
- Whether dragging an existing result is the preferred reroll affordance.

## Work log

_Empty._
