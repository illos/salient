# S02: Data contracts: encounter record, events, change journal, dice

| Field | Value |
| --- | --- |
| Family | S |
| Milestone | v0.01 |
| Owner type | App lead |
| Rules review | not required |
| Depends on | None |
| Unblocks | A01, A03, A04, A06 |
| Status | see `STATUS.md` |

## Goal

Implement the storage contracts readiness-audit gap G7 names as engineering work: an encounter record
replacing the `combatActive` boolean, an event schema that permits engine-originated entries without a
user actor, a per-field before/after change journal that undo and redo restore from, the undo-unit
definition, and a server-side shared dice operation with stable request ids. No gameplay behavior is
added; this slice gives every later slice one place to write history.

## Spec references

- `docs/v0.01-readiness-audit.md#g7-dice-generation-and-event-storage`
- `docs/data-architecture-spec.md#5-encounter-actions-and-undo` — journal, undo, corrections proposals.
- `docs/data-architecture-spec.md#4-user-records-and-current-state`
- `docs/data-architecture-spec.md#6-session-closure-and-compression` — archive boundary fields.
- `docs/table-spec.md#confirmed-action-and-log-contract` — ordered attributed entries; user attribution
  separate from acting character.
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` — seams, outer limits.
- `docs/table-spec.md#formal-encounter-closeout` — archive boundary that undo cannot cross.
- `docs/table-spec.md#public-rolls-and-the-dice-tower` — public by default; tower out of v0.01.
- `docs/engine-architecture.md#determinism-and-shared-state`, `#history-and-state-restoration`
- `docs/table-command-spec.md#structured-invocation-envelope`, `#recording-ordering-and-recovery`
- `docs/dice-roller-spec.md` — shared pseudorandom results; presentation never decides values.

## In scope

- Schema: `encounters` (campaign, session, status draft/committed/closed-out/voided, precombat snapshot
  ref, created/archived timestamps); `events` gains `origin` (`user` | `engine` | `clock`) with `actorId`
  optional for non-user origins, a monotonically increasing per-campaign sequence, an `encounterId`, a
  `causeEventId` for automatic consequences, and a `disposition` (`applied` | `undone` | `redone` |
  `corrected` | `archived`); `changes` journal rows keyed by event with entity id, field path, before,
  after; `snapshots` for encounter start state.
- Undo unit: one user-initiated command and all its automatic consequences share a `commandId`; the
  journal lists them in order; undo reverses the whole unit. Recorded as an implementation note in
  `docs/data-architecture-spec.md#5-encounter-actions-and-undo`.
- Dice: `dice.roll` internal function on the server using a seeded CSPRNG per campaign, returning dice
  values recorded on the event; retries with the same `commandId` return the same values; no client
  generation.
- Migration policy: reset and reseed (disposable data). Update `scripts/setup-local.ts` accordingly.
- Types in `shared/contracts/history.ts` used by A01 and A06.
- Tests with convex-test: sequence monotonicity under concurrent writes; retry returns identical dice;
  engine-origin event without actor is accepted; user-origin event without actor is rejected.

## Out of scope

- Undo/redo operations themselves (A06); this slice only stores what they need.
- Session archive compression (V-scope; data architecture section 6 remains proposed).
- The tower mode.

## Inputs and dependencies

None.

## Deliverables

- `convex/schema.ts` changes, `convex/encounterTables.ts`, `convex/lib/journal.ts`, `convex/lib/dice.ts`
- `shared/contracts/history.ts`
- `tests/app/journal.test.ts`, `tests/app/dice.test.ts`
- Implementation notes in the data-architecture spec sections above and the G7 entry in the audit.

## Acceptance checks

1. `pnpm check` passes; existing session tests updated for the encounter record.
2. Two concurrent mutations writing events to one campaign produce distinct consecutive sequence numbers
   (test).
3. Calling the dice operation twice with the same `commandId` yields identical values; a new id yields
   new values (test).
4. An event with origin `engine` and no `actorId` inserts; origin `user` without `actorId` throws (test).
5. The journal for a sample command lists before/after for every changed field, verified by reading the
   rows back.
6. Reviewer confirms no gameplay behavior was added.

## Rules research

None.

## Open questions

None.

## Work log

_Empty._
