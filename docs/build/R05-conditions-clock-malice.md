# R05: Conditions, clock and Malice common lifecycle

| Field | Value |
| --- | --- |
| Family | R |
| Milestone | v0.01 |
| Owner type | Rules team |
| Rules review | required |
| Depends on | None |
| Unblocks | A04, A03 |
| Status | see `STATUS.md` |

## Goal

Enumerate the core conditions the v0.01 toggle list must show, state what the source says each does
(readable text, not automation), and write the sourced contract for the turn/round clock and the
common Malice lifecycle that A04 implements. Also record which scheduled work can actually exist in
v0.01 so that the automatic save-ends path is either exercised honestly or explicitly dormant.

## Spec references

- `docs/table-spec.md#v001-manual-condition-tracking` — one toggle per core condition; manual saves.
- `docs/table-spec.md#game-clock-and-scheduled-rules-work` — enqueue order, saves last, once per turn.
- `docs/table-spec.md#initiative-groups-confirmed-app-model` — turn entries, groups, rounds.
- `docs/table-spec.md#taking-a-turn`, `#player-sheet-actions-and-explicit-end-turn`
- `docs/table-spec.md#malice-visibility` and the common Malice lifecycle paragraphs in
  `docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope`
- `docs/table-command-spec.md#clock-driven-operations`
- `docs/rules-questions-for-user.md` Q-TS-1 (automatic save-ends in v0.01).

## In scope

- Core condition list with source path per condition and the verbatim effect text, plus whether the
  source defines a save-ends default. No automation of effects in v0.01; the list feeds the toggles and
  the readable text.
- Clock contract: what a turn boundary is, what a round boundary is, the order of due work at each,
  save rolls last, one firing per actual turn, and the statement that in v0.01 the only producers of
  scheduled work are the common Malice lifecycle and any source-backed operation that A04 or A05
  registers. Q-TS-1 is answered: no save-ends roll is automatic in v0.01, so the contract states that the
  automatic path is V1 behavior with no v0.01 producer.
- Malice: how the Director's Malice pool starts and grows each round per the source, what "common
  lifecycle" covers, and which parts are manual (spending on abilities is manual in v0.01 unless a
  known fixed Malice cost is supplied).
- Surprise and the starting side choice: what the source says, to confirm the opening contract.
- Combat round and end-of-turn definitions used by the opening and turn slices.
- Worked example: two rounds with one hero and one foe, listing the clock events in order.

## Out of scope

- Ability-driven condition application or expiry (parser support, V05).
- Minions, captains, villain actions, bosses (V02, V03).
- Implementation (A04).

## Inputs and dependencies

None. Pinned Compendium only.

## Deliverables

- `docs/conditions-and-clock.md` — the list, the clock contract, the Malice lifecycle, the example.
- `shared/content/core-conditions.json` — id, name, source path, verbatim text.
- `shared/contracts/clock.ts` — types for scheduled work registration and dispatch, no logic.
- Implementation notes in the table-spec sections above.
- `rules` commit.

## Acceptance checks

1. Every condition in the JSON file has a source file that exists and text that matches it verbatim.
2. The clock contract's ordering rule quotes the user's standing policy and the source's end-of-turn
   definition.
3. The Malice growth rule quotes the source.
4. The worked example's event order is derivable by hand from the contract.
5. The document states in one sentence that v0.01 has no automatic save producer, citing the Q-TS-1
   answer of 2026-09-14.
6. Reviewer confirms all citations.

## Rules research

- `vendor/steel-compendium/en/unified/md/condition/*.md`
- `vendor/steel-compendium/en/unified/md/rule/combat/condition.md`, `combat-round.md`, `turn.md`,
  `end-of-turn.md`, `surprised.md`, `side.md`
- `vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md`
- `vendor/steel-compendium/en/unified/md/rule/monster/malice.md`
- `vendor/steel-compendium/en/unified/md/chapter/combat.md`, `monster-basics.md`

## Open questions

- None. Q-TS-1 was answered 2026-09-14 (no automatic save-ends in v0.01).

## Work log

_Empty._
