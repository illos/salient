# A04: Combat opening, turns and clock

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required |
| Depends on | A03, R05 |
| Unblocks | A05, A06, A07 |
| Status | see `STATUS.md` |

## Goal

Implement the encounter lifecycle from the staged setup card through committed combat, initiative,
groups of actor-linked turn entries, Take turn and End turn, round advancement with the clock's due
work in the confirmed order, the common Malice lifecycle, mid-combat additions and regrouping, and the
combat locks on party roster and character edits. No attacks yet; A05 adds them.

## Spec references

- `docs/table-spec.md#5-encounter-workflow`, `#confirmed-initiative-setup-and-shared-presentation`,
  `#initiative-groups-confirmed-app-model`, `#mid-combat-additions-and-regrouping`,
  `#overall-encounter-sequence`, `#taking-a-turn`, `#player-sheet-actions-and-explicit-end-turn`,
  `#game-clock-and-scheduled-rules-work`, `#character-sheet-lock-during-encounters`
- `docs/table-spec.md#freeplay-baseline-and-combat-transition` — carryover rules.
- `docs/table-command-spec.md#starting-combat-through-an-action-card`, `#mid-combat-group-operations`,
  `#clock-driven-operations`
- `docs/pre-alpha-design-gaps.md#combat-opening--confirmed-for-v001`,
  `#ordinary-creatures-and-turns--confirmed-for-v001`, `#clock-and-saves--confirmed-for-v001`
- `docs/v1-spec-checkpoint.md#sessions-roles-and-rosters` — draft until OK, snapshot, locks, who rolls.
- `docs/conditions-and-clock.md` (R05 deliverable)
- `docs/v001-basic-play-walkthrough.md#main-path-and-observable-results` steps 1, 2, 7

## In scope

- Setup card (registered `/combat start`): Director selects participants, surprise per side, initial
  groups (one per hero and per ordinary monster by default; Director may combine); draft state visible
  per user; live roster additions appear included, removals disappear; Cancel discards draft.
- OK: capture precombat snapshot (S02 `snapshots`), create the encounter record, apply party-roster lock
  and character-edit lock, then initiative: shared roll by any active player or the Director, observers
  cannot; surprise-determined path; winning side chooses first with Director control on either result.
- Turn entries linked to creatures; group activation; Take turn (switches invoking user's pane to that
  hero; Director may act for any character); End turn explicit; advisory action-allowance display;
  spent entries grayed; group completes when no turns remain; round advances when all groups finish.
- Clock: at each actual turn boundary and round boundary, dispatch registered due work in enqueue order
  with saves last; one firing per actual turn; Malice per R05 at round start; hooks for A05's registered
  work. No wall-time.
- Mid-combat: add a foe (new bottom group, turn this round); remove a foe (finishes its turn and due work);
  Director drag/regroup of selected entries preserving spent state; unspent arrival into an active group
  may act; a finished group does not reopen.
- Pause during combat preserves everything; both rosters locked; Void handled in A07.
- FreePlay carryover: current damage and resources carry; no action replay; no refund.
- Headless parity for every operation.

## Out of scope

- Attacks, damage, costs (A05). Undo (A06). Closeout and Void (A07).
- Minions, captains, bosses, terrain, persistent areas (V02, V03, V20, V04).
- Automatic save-ends rolls of any kind (Q-TS-1 answered 2026-09-14: none in v0.01). The clock may keep
  a registration hook; nothing registers a save.

## Inputs and dependencies

A03 table; R05 clock contract. S02 encounter record.

## Deliverables

- `convex/encounters.ts`, `convex/lib/clock.ts`, `convex/lib/initiative.ts`
- `web/table/setup-card.tsx`, `web/table/initiative.tsx`, turn controls in the sheet header
- Tests: setup draft isolation per user; OK creates snapshot and locks; observer initiative roll rejected;
  group completion and round advance; add/remove/regroup state preservation; clock ordering with three
  registered items; Malice increments once per round
- Browser test: Director starts combat with one hero and one Goblin Warrior; player takes turn; End turn;
  round advances

## Acceptance checks

1. Cancel before OK leaves no encounter record and no locks; OK creates both, verified by reading the
   encounter and a rejected character edit.
2. Observer initiative roll is rejected server-side; player roll succeeds and is logged with dice.
3. With one hero and one foe, the walkthrough steps 1, 2 and 7 produce the expected records: one
   committed encounter, one active turn with attribution, End turn then group handoff then round start with
   exactly one Malice event.
4. Regrouping an unspent entry into an active group lets it act; into a finished group does not reopen
   the group; a spent entry stays spent.
5. Adding a foe mid-combat places it in a new bottom group with a turn in the current round.
6. Pausing mid-combat blocks turn actions and roster changes; resuming restores them with the same active
   turn.
7. Explicit Take turn switches only the invoking user's pane (browser test with two player contexts).
8. Rules reviewer confirms surprise handling, first-side choice, and the Malice rule against R05 and the
   Compendium.

## Rules research

R05 owns it. Reviewer paths: `rule/combat/combat-round.md`, `turn.md`, `end-of-turn.md`, `surprised.md`,
`rule/monster/malice.md`, `chapter/combat.md`.

## Open questions

- None. Q-TS-1 answered 2026-09-14: no automatic save producer is wired in this slice.

## Work log

_Empty._
