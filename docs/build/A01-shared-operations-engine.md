# A01: Shared operations, command registry and engine integration

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | not required (no mechanical meaning is added; A05 adds it) |
| Depends on | S02; S00 soft |
| Unblocks | A02, A03, A04, A05, A06, A07 |
| Status | see `STATUS.md` |

## Goal

Build the one path every table control uses: a registry of shared operations callable from UI buttons,
the command palette, slash text and the headless CLI, executing inside Convex mutations with the engine
invoked in-process, writing ordered attributed events and journal rows through S02. Establish the
action-card state machine skeleton for operations that need more input. Deliver it with two
non-mechanical operations end to end so later slices only add operations.

## Spec references

- `docs/table-spec.md#confirmed-action-and-log-contract`
- `docs/table-command-spec.md#accepted-human-syntax`, `#identity-actor-and-targets`,
  `#recommended-execution-model`, `#registry-definition`, `#structured-invocation-envelope`,
  `#results-and-pending-interactions`, `#recording-ordering-and-recovery`
- `docs/research/table-command-grammar.md` — the syntax fixtures (syntax only).
- `docs/engine-architecture.md#command-registry-and-palette`, `#proposed-boundaries`, `#app-backend`
- `docs/engine-architecture.md#standalone-engine-and-portability` — TypeScript, in-process placement is
  an integration decision made here.
- `docs/v1-tech-stack-spec.md#4-shared-operations-and-the-realtime-table`
- `docs/development-process.md#headless-development-workflow`
- `docs/accounts-and-access-spec.md#director-table-capability-doctrine` — Director can do anything a
  player can.

## In scope

- Registry module `convex/lib/registry.ts`: operation id, family/verb, argument schema (Convex validators),
  authority check (role, control of actor, session state), execution function, and log-entry builder.
  Registered operations are discoverable by a `commands.list` query for the palette and the CLI.
- Invocation envelope: `commandId`, invoking user, explicit `@Character` actor when given, arguments,
  expected revision. Once-only commitment reusing `convex/lib/commands.ts`.
- Parser for the accepted human syntax (`/family verb`, named arguments, quoted names, target lists)
  into the envelope, validated against the grammar fixtures. Parsing lives in `shared/`, not in UI.
- Engine adapter: `convex/lib/engine.ts` calling a pure function from `src/` (or a new `engine/` package
  if the lead decides to move it) with entity projections in and structured outcomes out. Dice come from
  S02's server operation, never from the engine.
- Action-card skeleton: an `interactions` table row with status `awaiting-input | resolved | closed`,
  the bound actor label, the operation continuation, and a headless `interactions.respond` operation.
- Two operations delivered end to end to prove the path: `/session note` (a Director-attributed free-text
  log entry) and `/table roll` for a plain public dice roll with no game meaning, logged with dice values.
- Web: a command input on the campaign page that submits slash text; a minimal palette listing registered
  operations; both use the same mutation as the CLI.
- CLI: `pnpm app command "<slash text>"` and `pnpm app respond <interactionId> '<json>'`.

## Out of scope

- Any operation with game meaning (A03 onward).
- Card presentation beyond a labeled placeholder in the log.
- Undo/redo (A06).

## Inputs and dependencies

S02 committed. If S00 is not yet merged, follow its commit format manually.

## Deliverables

- `convex/lib/registry.ts`, `convex/lib/engine.ts`, `convex/commands.ts`, `convex/interactions.ts`
- `shared/commands/parse.ts` with tests against `docs/research/` grammar fixtures
- `web/command-input.tsx`, `web/palette.tsx`
- `scripts/app.ts` extended
- Implementation note in `docs/engine-architecture.md#app-backend` recording in-process placement
- Tests: registry authority checks, envelope idempotency, parser conformance, headless respond

## Acceptance checks

1. The same `/table roll` submitted from the web input and from the CLI produces two events with
   identical shape, user attribution, and server-generated dice (read back with `events:list`).
2. Retrying the CLI call with the same `commandId` produces no second event.
3. A player submitting `/session note` is rejected by the authority check with a readable error; the
   Director succeeds; the observer is rejected.
4. Every grammar fixture in `docs/research/` parses to the expected envelope (test count recorded).
5. An interaction created by a test operation can be answered headlessly and its status changes to
   resolved; the log shows the labeled actor before the response.
6. `commands.list` returns every registered operation with its argument schema; the palette renders it.

## Rules research

None.

## Open questions

None.

## Work log

_Empty._
