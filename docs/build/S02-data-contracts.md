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

### 2026-09-14 — plan (lead/S02-impl)

Spec sections read in this checkout: every anchor listed above. Discrepancies noted: none; the data
architecture section 5 and the G7 audit entry both describe the current schema exactly as found
(`sessions.combatActive`, required `events.actorId`, no change payload).

Files to touch:

- `convex/encounterTables.ts` (new): `encounters`, `snapshots`, `changes`, `diceStates`, `rolls`.
- `convex/schema.ts`: spread `encounterTables`; `sessions.combatActive` becomes
  `sessions.encounterId`; `events` gains `origin`, optional `actorId`/`actorName`, `commandId`,
  `encounterId`, `causeEventId`, `disposition`, optional `dice`/`payload`; new indexes. No other
  table is touched, so S01's `contentTables` spread merges cleanly.
- `convex/lib/events.ts`: `appendEvent` takes a structured input, allocates the per-campaign sequence
  under the campaign counter, rejects `origin: "user"` without an actor, rejects writes into closed
  sessions and archived encounters.
- `convex/lib/journal.ts` (new): `journalPatch`/`journalInsert`/`journalDelete` write one `changes`
  row per changed field path with before/after (absence recorded explicitly) and apply the write.
- `convex/lib/dice.ts` (new): `rollDice` with a per-campaign seeded hash-DRBG (SHA-256 over a
  32-byte seed from `crypto.getRandomValues` plus a counter), rejection sampling, retry-idempotent on
  `commandId` through the `rolls` table; `convex/dice.ts` exposes it as `internalMutation dice.roll`.
- `convex/lib/encounters.ts` (new, small): `combatActive(ctx, session)` = session's encounter is
  `committed`; used by `sessions.ts` and `characters.ts` in place of the boolean.
- `convex/sessions.ts`, `convex/characters.ts`, `convex/campaigns.ts`, `convex/foes.ts`,
  `convex/events.ts`, `web/campaigns.tsx`: adapt to the new event/session shape (origin label in the
  log; `encounter` projection on sessions).
- `shared/contracts/history.ts` (new): types mirroring the records, reusing `EncounterId`/`LogEntryId`
  from `clock.ts`; no logic.
- `scripts/setup-local.ts`: `--reset-data` empties every app table in the local deployment through
  `convex import --table <t> --replace` (reset-and-reseed policy, no migrations).
- Tests: `tests/app/journal.test.ts`, `tests/app/dice.test.ts`; `tests/app/access-sessions.test.ts`
  and `tests/app/foes.test.ts` use an encounter row instead of `combatActive`;
  `tests/app/setup-local.test.ts` covers the reset flag.
- Docs: implementation notes in `docs/data-architecture-spec.md#5-encounter-actions-and-undo` (undo
  unit) and `#6-session-closure-and-compression` (archive fields), G7 entry in the audit.

Dependencies: none real. No development fixture is stubbed. No gameplay operation is added: nothing
creates an encounter through the API yet; tests insert rows directly through `t.run`.

### 2026-09-14 — verification (lead/S02-impl)

Discrepancy from the plan: the reset lists tables from the deployment (`convex data`) rather than by
importing `convex/schema.ts`, because plain Node cannot resolve the schema's extensionless imports and
the deployed table list is the right thing to empty under the old schema anyway. `convex codegen`
needs a reachable deployment, which this worktree has none of; `convex/_generated/api.d.ts` was
updated by hand in the generator's exact pattern (sorted module list) and typechecks.

`pnpm check` (full output in the thread; summary):

```
$ eslint . && prettier --check .            All matched files use Prettier code style!
$ tsc --noEmit && vitest run --project engine   Test Files 6 passed (6)   Tests 39 passed (39)
$ tsc -p tsconfig.web.json && vitest run --project app --project scripts
                                             Test Files 10 passed (10)  Tests 55 passed (55)
$ node scripts/check-links.ts / check-vendor / build-foe-source --check / vite build   ✓ built
exit=0
```

Baseline before this slice: 39 engine and 42 app/scripts tests. The new suites:

```
✓ |app| tests/app/dice.test.ts > sha256 > matches the FIPS 180-4 vectors and Node for a multi-block input
 ✓ |app| tests/app/dice.test.ts > shared dice operation > same commandId returns the identical accepted roll; a new id draws new values
 ✓ |app| tests/app/journal.test.ts > event sequence and origin > concurrent appends to one campaign get distinct consecutive sequence numbers
 ✓ |app| tests/app/dice.test.ts > shared dice operation > reusing a commandId with different dice is rejected and rolls nothing
 ✓ |app| tests/app/dice.test.ts > shared dice operation > requests are validated: bounds, distinct die ids, valid command id
 ✓ |app| tests/app/dice.test.ts > shared dice operation > every face is reachable and within range across the stream
 ✓ |app| tests/app/dice.test.ts > shared dice operation > dice.roll is registered as an internal function and persists the same accepted roll
 ✓ |app| tests/app/journal.test.ts > event sequence and origin > engine and clock origins insert without an actor; user origin without an actor is rejected
 ✓ |app| tests/app/journal.test.ts > event sequence and origin > archived encounters and closed sessions refuse new events
 ✓ |app| tests/app/journal.test.ts > change journal > diffFields records leaf changes, absence and unchanged fields
 ✓ |app| tests/app/journal.test.ts > change journal > the journal for a sample command lists before/after for every changed field, read back
 Test Files  2 passed (2)
      Tests  11 passed (11)
```

Acceptance checks:

1. `pnpm check` passes; `tests/app/access-sessions.test.ts` and `tests/app/foes.test.ts` now create a
   committed `encounters` row instead of patching `combatActive`, and additionally check that a
   draft or archived run does not lock the roster. Verified.
2. `journal.test.ts` "concurrent appends": 20 `Promise.all` appends to one campaign read back as
   sequences 1..N with no gap and `campaigns.eventSequence` equal to N. Verified.
3. `dice.test.ts`: same `commandId` returns an equal accepted roll and one persisted `rolls` row;
   a new id creates a second row with `counterStart` 2 and the generator counter reads 4; the faces
   reproduce from the stored seed and counter; same id with different dice is rejected. Verified.
4. `journal.test.ts` "engine and clock origins": engine and clock events insert with no `actorId`,
   `causeEventId` set and the cause's `commandId`; `origin: user` without an actor throws
   "must name the invoking user" and the event count is unchanged. Verified.
5. `journal.test.ts` "sample command": one user event and one engine consequence under one
   `commandId`; `commandJournal` reads back four `changes` rows with before/after for
   `foes.live.stamina` (15 to 9), `foes.visible` (false to true), a whole-document insert and a
   whole-document delete, ordered by event then ordinal; persisted foe state matches. Verified.
6. Independent review deferred to the user's audit thread (lead's process change, 2026-09-14).
   Not verified here; the implementer does not self-attest.

### 2026-09-14 — audit repairs verified (coordinator)

Nested replacement deletions are recorded and command history/dice use authenticated issuer scope. Fresh independent review passes with persisted deletion, sequence and retry evidence. The original audit exercised the real local reset path. No gameplay mechanic was added.

Repair commit: `7b86b8a`. Final `pnpm check`: 265 tests plus lint/types/content/vendor/build;
`pnpm test:browser`: all 5 pass. See the [verification record](audits/2026-09-14-fix-verification.md)
for independent verdicts, local deployment/visual evidence and remaining scope. This follow-up
supersedes the earlier verification omissions for these exercised paths. Hosted CI still needs a push.
