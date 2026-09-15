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

### Plan (2026-09-15, implementer)

Files: `convex/initiativeTables.ts` (initiative groups, turn entries, turns, clock registrations;
spread into `convex/schema.ts`), `convex/encounterTables.ts` (optional phase/round/opening fields on
`encounters`), `convex/lib/clock.ts` (registration and dispatch against `shared/contracts/clock.ts`),
`convex/lib/initiative.ts` (groups, entries, turn sequencing, foe add/remove hooks),
`convex/lib/combatOperations.ts` (registered `/combat start|setup|cancel|commit|roll|first`,
`/turn take|end`, `/group move`), `convex/encounters.ts` (the `current` read for every role),
`convex/lib/encounters.ts` (`requireCharacterEditable`, the lock helper A02 calls),
`convex/characters.ts` (calls the helper), `convex/lib/foeOperations.ts` (mid-combat hooks),
`convex/lib/audience.ts` (Malice clock events follow Show Malice), `convex/lib/interactions.ts`
(a combat-setup card is discarded through `/combat cancel`), `web/table/setup-card.tsx`,
`web/table/initiative.tsx`, `web/table/index.tsx` (mounts the two; viewed hero follows Take turn),
`tests/app/combat.test.ts`. Dependencies: A03, S02, A01 and R05 are real; no fixture. A02 has not
landed, so heroes remain the existing `characters` rows and Victories come from `liveState.victories`
(0 when no live record exists, the R03 initial value).

### Implementation notes (2026-09-15)

- **Draft model.** The setup card is an `interactions` row of kind `combat-setup` plus a draft
  `encounters` row; the draft stores departures from the defaults and is resolved against the live
  rosters on every read, which is how roster updates flow into it without resetting choices. Draft
  edits are attributed `combat.setup` events. OK is the card's answer (continuation `combat.commit`);
  `/combat commit` also works directly and resolves the card itself. `card.close` on this card is
  refused in favor of `/combat cancel`, which deletes the draft row and closes the card.
- **Opening paths.** Roll when both sides have an unsurprised selected creature; other side first
  when exactly one side is entirely surprised; Director adjudication (phase `choice`, players refused)
  when both sides are surprised or a side has no participants. The d10 entitlement is 6+ players,
  else Director (rule/combat/combat-round.md); the Director may choose on either result.
- **Turn model.** `initiativeGroups` (side, order, `completedRound`), `turnEntries` (actor,
  `spentRound`, surprised, source ordinary|granted), `turns` (one row per actual turn with its start
  and end events). "Spent this round" and "finished this round" are comparisons against
  `encounter.round`, so a new round needs no reset writes. `activeSide` is the side expected next
  under the alternation and exhausted-side rules; acting against it is a recorded warning.
- **Clock.** `clockRegistrations` rows with `enqueueSeq`; dispatch logs a boundary event and one
  event per firing under the causing user's command id. The save phase is computed after the
  ordinary phase from the live queue (standing save-phase policy) and has no producer in v0.01: a
  `saving-throw` item is logged as unsupported, not rolled. Malice values: combat-start grant floors
  the average and logs the unrounded value (Q-R-51 A); round gain uses the hero count recorded at OK
  (Q-R-50 A). Surprise expiry is registered at OK when anyone is surprised.
- **Hooks in A03 code.** `foe.add` / `foe.remove` call `onFoeAdded` / `onFoeRemoved`; the registry
  gained an optional interaction `kind`; `projectEvent` hides `clock.malice` pool values unless Show
  Malice is on; `characters.save` calls `requireCharacterEditable` (only participants are locked).
- **Engineering choices recorded here, not asked:** empty non-active groups are deleted (the spec
  leaves empty-group presentation open); a session closed while a setup draft is open leaves the
  draft row on the closed session (a new session starts with no encounter); `combat.cancel` is
  `session: 'active'` so a paused draft can be discarded. Q-A-400 asks whether the finished-group
  refusal should be a warning.
- **Generated API.** `convex/_generated/api.d.ts` extended by hand for the new modules (no local
  deployment in this checkout to run `convex codegen`).
- **UI.** `web/table/setup-card.tsx` and `web/table/initiative.tsx`; `web/table/index.tsx` mounts
  them, adds Start combat to the Director pane, Take turn / End turn to hero rows and switches only
  the invoking user's hero pane (local state) after a successful Take turn.

### Verification (2026-09-15)

- `pnpm check`: clean at each commit (lint, engine, app 224 tests including
  `tests/app/combat.test.ts` 10 tests, links, vendor, content, build).
- `tests/app/combat.test.ts` reads persisted rows back for: draft per Director with player/observer
  edits refused, roster addition/removal reflected in the effective draft, Cancel leaving no
  encounter/snapshot/lock and the setup card closed; OK through the card (snapshot contents, locks on
  the participant only, party-roster lock, one group per creature, the four registrations in enqueue
  order, `combat-start` grant 0 with inputs, idempotent OK retry); observer roll refused, player roll
  logged with dice and entitlement, second roll refused, choice authority per entitlement, round 1
  gain 1 + 1 = 2; surprise-determined path with no roll and expiry at the end of round 1;
  adjudication path; walkthrough steps 1, 2 and 7 with the full ordered clock log for two rounds
  (gains 2 and 3, pool 0 → 2 → 5) and the player-side Malice projection; regrouping (unspent into
  active acts, spent stays spent, finished does not reopen, round advances with an unacted arrival,
  no turn invented); mid-combat add (bottom group, turn this round) and removal of the acting foe
  (turn-end fired, round ends, idempotent retry); pause blocks turn, roster and regroup operations
  and resume restores the same active turn; dispatch order with three registered items and a dormant
  save (fires last, unsupported, no roll row, no condition change); registry discovery.
- Browser test `tests/browser/combat.spec.ts`: **written, not run** (no `.env.local` / local
  deployment in this worktree). Acceptance 7 is therefore not verified in a browser; the pane switch
  is local state set only on the invoking user's successful Take turn.
- Acceptance 8 (rules reviewer): pending.

### Unfinished (2026-09-15)

- Browser run of `tests/browser/combat.spec.ts` (two player contexts) and a visual pass.
- Granted (extra) turn entries: the data model carries `source: 'granted'`, but no operation creates
  one (not in this slice's scope list).
- Independent review and rules review not requested (the user audits separately).

### User decision follow-up: Q-R-50

The user confirmed that removing a hero from combat stops their contribution to future round-start
Malice gains; dying heroes still in combat count. Replace the provisional setup-time hero count
(Q-R-50 A) with the current participating heroes, counted once per hero from remaining combat turn
entries. See [the owning contract](../conditions-and-clock.md#33-manual-parts-in-v001).
This is a specification handoff; implementation and persisted-state verification remain outstanding.

### Question audit follow-up: Q-A-400

The [queue audit](audits/2026-09-14-question-queue-dedup.md) resolves the question under existing
policy; it does not certify the current refusal behavior. Implement warned deliberate turn-rule
departures through the shared operation without requiring regrouping merely to bypass eligibility.
Preserve completed-group and spent-entry history, access/session checks, and coherent sequencing;
never create competing ordinary active turns. Treat active-group representation as engineering work
under those constraints. Verify refused unauthorized/incoherent requests separately from accepted,
logged rule departures. No new user approval is required for that repair.

### 2026-09-15 — Independent repair closure

The Q-R-50 participant count and Q-A-400 warned departures are implemented and independently
source/code reviewed. Persisted tests cover current distinct heroes, preserved spent/group state,
coherent turns and clock queue ordering. The earlier outstanding-work notes are historical. See
[the A04 verdict](audits/2026-09-15-A04-independent-review.md) and
[combined acceptance evidence](evidence/v001-acceptance.md).
