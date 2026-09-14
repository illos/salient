# A06: History: undo, redo and corrections

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required (seam semantics affect mechanical outcomes) |
| Depends on | A04; A05 for the correction-window integration |
| Unblocks | A07, A09 |
| Status | see `STATUS.md` |

## Goal

Implement the confirmed history model over the S02 journal: player sequential undo of their own
character's uninterrupted latest actions to the nearest seam with turn start or FreePlay stretch start
as the outer limit; Director sequential rewind across seams within the current encounter; exact Redo
restoring recorded state and dice; new gameplay after undo clears redo while retaining abandoned
history; corrections and undo as appended entries; the campaign "Enable user undo" setting; and the
archive boundary that nothing crosses.

## Spec references

- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control`
- `docs/table-spec.md#director-edits-to-inline-results`
- `docs/table-spec.md#inline-interaction-cards-in-the-game-log` (trigger prompt after undo; not required
  in v0.01 beyond restoring a still-valid card)
- `docs/table-spec.md#formal-encounter-closeout` — archive boundary.
- `docs/table-command-spec.md#inline-corrections-and-history`
- `docs/data-architecture-spec.md#5-encounter-actions-and-undo`
- `docs/engine-architecture.md#history-and-state-restoration`
- `docs/pre-alpha-design-gaps.md#undo-and-redo--confirmed-for-v001`,
  `#damage-and-corrections--confirmed-for-v001`
- `docs/v1-spec-checkpoint.md#loot-and-history`
- `docs/development-process.md#headless-development-workflow` — restore without rerunning rules or dice.

## In scope

- Seam computation from the journal: another character's committed action, a committed Director
  correction or adjustment, turn start, FreePlay stretch start, encounter archive.
- `/history undo` for players: only the latest own-character command unit, only if no seam intervenes;
  restores every journal field from before values without rerunning the engine or dice; appends an
  `undone` event linked to the original; clock registrations and participation restore with their cause.
- `/history rewind` for the Director: sequential across seams within the current encounter, one unit per
  call, never into an archived encounter.
- `/history redo`: restores the recorded path exactly, including dice; unavailable after new gameplay.
- Correction entries from A05's post-roll card use the same window check: acting player until the next
  actor's turn start and no intervening seam; Director always, subject to the full-rewind rule for older
  events once later gameplay has committed.
- Campaign setting "Enable user undo" default on; off removes player undo, not Director rewind, and never
  affects inventory (none exists yet).
- Log presentation: undone entries stay visible and marked; the effective branch is what rules use.
- Headless parity; tests are the main deliverable.

## Out of scope

- Inventory undo (V07). Progression history (V08). Trigger-prompt refund cases beyond restoring a
  still-valid card (V04).
- Reopening archived encounters: forbidden by contract.

## Inputs and dependencies

S02 journal; A04 turn boundaries; A05 correction card (soft: this slice ships the window check as a
library function A05 calls).

## Deliverables

- `convex/lib/history.ts` (seams, window checks), `convex/history.ts` operations
- `web/table/history-controls.tsx`, log markers
- Tests: each seam type blocks player undo; Director crosses it; redo exactness including dice; new
  gameplay clears redo; archive boundary; setting off; undo of a costed ability refunds the recorded
  cost; undo of damage restores temporary Stamina and Stamina and Slain flag together

## Acceptance checks

1. Player attacks, then undoes: foe Stamina, hero resource and the ability's action use all return to the
   before values in one operation, read back; the original event remains with disposition undone.
2. Player attacks, another player acts, first player's undo is rejected with the seam named.
3. Director rewinds both in order; a rewind attempt past the encounter start is rejected.
4. Redo after undo restores the same dice values and outcome; after a new attack, redo is unavailable.
5. Turn start blocks undo of the previous turn's action for the player; Director rewind still works.
6. With "Enable user undo" off, player undo is rejected, Director rewind unaffected.
7. Post-roll bane addition by the acting player succeeds before the next actor's turn starts and is
   rejected after.
8. Rules reviewer confirms that no restoration invoked the engine or the dice operation (assert by
   counting dice events).

## Rules research

None beyond the confirmed rulings; the reviewer checks the seam semantics against the table spec, not
the Compendium.

## Open questions

None known.

## Work log

_Empty._
