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

### 2026-09-14 — plan (app/A01-impl)

Spec sections read in this checkout: every anchor listed above, plus `docs/table-command-spec.md`
"Scope and authority" and "Command-family coverage". Discrepancies noted: none. The catalog draft
(`docs/table-command-catalog.md`) has no spelling for `/session note` or `/table roll`; this slice
document is the only source for those two names, and neither carries game meaning.

Files to touch:

- `shared/commands/parse.ts` (new): lexer/parser for the accepted human syntax, a faithful port of the
  bounded recognizer's rules (`docs/research/table-command-syntax-check.py`), producing the fixture
  tree shape (`actor`, `path`, `arguments`; references as `{name}`, `{refKind, id}`,
  `{selector: "self"}`; records as `{record}`; enum words as `{symbol}`). `toEnvelope` lowers a tree
  into the structured envelope: operation id `family.verb`, actor reference, arguments unchanged.
  `@self` as the actor prefix is a binding error, not a parse error, so it is rejected in `toEnvelope`.
- `shared/commands/envelope.ts` (new): the envelope types shared by the parser, the mutations, the
  web console and the CLI.
- `convex/lib/registry.ts` (new): operation definitions (id, family/verb, title, description, argument
  schema as Convex validators, authority requirements, executor, log-entry builder) and the runner
  `invoke(ctx, user, envelope)`: role (`director` = campaign owner, `player` = selected in the active
  session, `observer` = other member), actor control (a character in the campaign owned by the caller,
  or any campaign character/foe for the Director), session state, argument validation, once-only
  commitment through `convex/lib/commands.ts` keyed on the operation id and canonical envelope, then
  execution and `appendEvent` with the envelope in the event payload.
- `convex/lib/engine.ts` (new): in-process adapter around `src/engine.ts` (`resolveAbility`,
  `applyManual`) with a projection in and a structured `Resolution` out; no operation uses it yet.
  `convex/tsconfig.json` gains `allowImportingTsExtensions` so the engine's `.ts` imports typecheck
  inside the Convex bundle.
- `convex/lib/interactions.ts` (new) and `convex/interactions.ts` (new): the `interactions` row
  (status `awaiting-input | resolved | closed`, bound actor label, continuation envelope, revision),
  `interactions.list`/`get`, headless `interactions.respond` and `interactions.close`.
- `convex/commands.ts` (new): `commands.list` (registry discovery with argument schemas and the
  caller's availability), `commands.invoke` (structured envelope) and `commands.submit` (slash text,
  parsed on the server through `shared/commands/parse.ts`, then the same runner).
- `convex/schema.ts`: add the `interactions` table only.
- `convex/events.ts`: the log projection gains `dice` and `payload` so a roll can be read back.
- Operations: `session.note` (Director, active session, `text`), `table.roll` (Director or player,
  running session, `dice="NdS"`; without `dice` it opens a guided-input interaction bound to the
  labeled actor), `card.respond` (the slash spelling of `interactions.respond`).
- `web/command-input.tsx`, `web/palette.tsx` (new, self-contained): a console that submits slash text
  through `commands.submit` and a palette listing `commands.list`; mounted from `web/campaigns.tsx`
  with a one-line change, plus dice values in the log rows.
- `scripts/app.ts`: `pnpm app command "<slash text>"` and `pnpm app respond <id> '<json>'`, campaign
  from `--campaign` or `SALIENT_CAMPAIGN_ID`, command id from `--command-id` or generated.
- Tests: `tests/app/parse.test.ts` (every fixture in `docs/research/table-command-syntax-cases.json`),
  `tests/app/registry.test.ts` (authority, idempotency, envelope, read-back through `events.list`),
  `tests/app/interactions.test.ts` (headless respond), `tests/app/engine-adapter.test.ts`.
- Docs: implementation notes in `docs/engine-architecture.md#app-backend` (in-process placement) and
  `docs/table-command-spec.md` (registry, envelope and interaction shapes as implemented).

Dependencies: S02 is real (events, journal, dice, commands). No development fixture is stubbed.
Characters cannot yet be attached to a campaign through the API (A02); actor-binding tests insert a
character row with `campaignId` directly.

### 2026-09-14 — verification (app/A01-impl)

Deviations from the plan: `card.respond` was added as a third registered operation so a card can be
answered from slash text (same code path as `interactions.respond`); `interactions.close` was added
to complete the status skeleton; `characters` gained a `by_campaign` index because the Convex lint
forbids table scans for actor binding; `convex/tsconfig.json` gained `allowImportingTsExtensions`
so the engine's `.ts` imports typecheck in the Convex bundle. Main moved during the slice (S01, A08);
the branch was rebased twice and the console restyled with A08's primitives.

`pnpm check` (after the final rebase onto `34bddbf`), exit 0:

```
$ eslint . && prettier --check .                 All matched files use Prettier code style!
$ tsc --noEmit && vitest run --project engine    Test Files 8 passed (8)    Tests 47 passed (47)
$ tsc -p tsconfig.web.json && vitest run --project app --project scripts
                                                 Test Files 16 passed (16)  Tests 187 passed (187)
$ check-links / check-vendor / content:check / vite build   ✓ built in 4.12s
```

New suites: `tests/app/parse.test.ts` (97 tests: 90 fixtures + 7 shape/diagnostic/lowering tests),
`tests/app/registry.test.ts` (7), `tests/app/interactions.test.ts` (3), `tests/app/engine-adapter.test.ts` (1).

Acceptance checks:

1. **Verified at the shared-mutation level, not in a browser.** `registry.test.ts` "acceptance 1"
   submits the same `/table roll dice="2d10"` text through `commands.submit` as two users (the
   mutation the console and `pnpm app command` both call) and reads both events back with
   `events.list`: identical key sets, origin `user`, same session, two d10 faces each equal to the
   persisted `rolls` rows for those command ids, attribution to each invoking user, and the recorded
   envelope. Not exercised: the browser console against the local backend (that deployment is shared
   with another project's process and A08; pushing this branch's functions there was not attempted)
   and `pnpm app command` against a live deployment. The CLI path differs from the test only in
   transport and authentication, which `scripts/app.ts` already exercised before this slice.
2. **Verified.** "acceptance 2": a retry with the same `commandId` returns the same result and the
   stored events are unchanged (one `table.roll` under that id); the same id with a different envelope
   is refused through both `submit` and `invoke`.
3. **Verified.** "acceptance 3": player and observer get `/session note is for the Director; you are
   a player|an observer here.`; the Director's note is stored with kind `session.note`, the text and
   the Director's actor id; the observer's roll is refused; a non-member gets `Campaign unavailable`.
4. **Verified.** `parse.test.ts`: 90 fixtures (58 valid, 32 invalid; 10 asserted trees), all pass.
5. **Verified.** `interactions.test.ts` "acceptance 5": `@Thorn /table roll` opens a card; the first
   `events.list` row reads `Thorn — awaiting input: which dice to roll.` before any response; no
   roll exists yet; `interactions.respond` with `{dice:"2d10"}` sets status `resolved`, revision 1,
   `resolvedEventId`, stores the answer, and the continuation event is `Thorn rolled 2d10: …` under
   the responder's command id with the opening event as cause; a retry is idempotent; a second answer
   is refused.
6. **Verified for the query; the palette rendering is not browser-verified.** "acceptance 6":
   `commands.list` returns the three operations with family/verb, syntax, argument name/type/required/
   description and per-viewer availability with reasons. `web/palette.tsx` renders that list and
   typechecks/builds; it was not opened in a browser.

Independent review: deferred to the user's audit thread (lead's instruction); commits carry no
`Reviewed-By:`.

### 2026-09-14 — closing entry (app/A01-impl)

What works: one runner for every surface (`convex/lib/registry.ts`), discoverable through
`commands.list`; slash text and structured envelopes through `commands.submit`/`commands.invoke`;
once-only commitment; role, session-state and actor-control checks with readable refusals;
`session.note`, `table.roll` (with guided card when `dice` is omitted) and `card.respond`; the
`interactions` table with headless `list/get/respond/close`; the in-process engine adapter; the web
console and palette; `pnpm app command` and `pnpm app respond`.

What was tested: everything above at the convex-test level, reading persisted rows back; parser
conformance against all 90 fixtures; `pnpm check`.

What remains: browser verification of the console and palette against a local backend; a live
`pnpm app command` run; the interaction state machine beyond one answer per card (completion
policies, cross-user request cards, card rendering beyond the labeled log entry); undo (A06);
operations with game meaning (A03 onward).

### 2026-09-14 — audit repairs verified (coordinator)

Stable actor/session binding, registered card closure and foe Add/Remove now pass fresh independent review. Palette/console, live CLI command/response and retries pass against the local deployment with persisted reads. The broader interaction state machine and A06 remain unfinished.

Repair commit: `7b86b8a`. Final `pnpm check`: 265 tests plus lint/types/content/vendor/build;
`pnpm test:browser`: all 5 pass. See the [verification record](audits/2026-09-14-fix-verification.md)
for independent verdicts, local deployment/visual evidence and remaining scope. This follow-up
supersedes the earlier verification omissions for these exercised paths. Hosted CI still needs a push.
