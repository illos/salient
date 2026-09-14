# S02/A01 history and interaction fixes — 2026-09-14

Implementation response to F1–F5 in [the independent audit](2026-09-14-S02-A01-A03.md).
This record describes implementation and verification; it is not independent review approval.
No rules interpretation or provisional gameplay ruling changes.

## Behavior and design

- **F1:** nested plain-object replacement now compares the union of old and replacement keys.
  Omitted nested keys receive explicit present → absent journal entries; deletion-only replacement
  is applied and recorded. Top-level omission still means no patch. Arrays remain whole values.
- **F2:** public `commandId` remains unchanged. Internal `commandKey` is the unambiguous JSON pair
  `[authenticated issuer ID, commandId]`, matching receipt identity. Dice reuse and command-journal
  reads use the scoped key; independent issuers cannot share accepted rolls or undo groups.
  User events derive the key from the server's invoking user. Engine/clock consequences inherit
  their cause's key and must retain its command ID. Independent system work uses a separate null
  issuer scope. Public callers cannot supply an issuer or key. The internal dice function and
  in-process dice helper require an explicit server-owned issuer scope.
- **F3:** a new card continuation stores its stable actor reference. Responses use the stored
  `boundActor` ID/kind even for older name-based continuations, and the common runner rechecks
  current table membership and control. Renaming does not redirect the card to a same-name actor.
  Actorless cards remain actorless; an explicit response actor cannot change that binding.
- **F4:** both response and closure require the card's original session to remain the current
  active session. Historical cards remain inspectable and unchanged; their projection disables
  response/closure authority. Ordinary roll continuations still refuse a pause and can execute
  after their own session resumes.
- **F5:** `card.close` is registered/discoverable. Direct `interactions.close` delegates to the
  same invocation as slash/structured calls, with one authenticated receipt, attributed ordered
  `interaction.closed` event linked to the opening event, then the terminal card-status update.
  `interactions.respond` likewise delegates to `card.respond`. Optional `revision` is the card
  revision argument on those operations; retries must repeat it when originally supplied.
  Closure does not roll or execute the continuation.

Storage `commandKey` fields are optional for deployment schema compatibility. New writes always
supply them. Old unscoped rows are not merged into scoped journals or used as accepted-roll caches;
no backfill or legacy undo implementation was added. Development data may be reset under the
existing pre-alpha policy. A consequence with a legacy unscoped cause fails explicitly.

## Files

- Identity and journaling: `convex/lib/commands.ts`, `convex/lib/events.ts`, `convex/lib/dice.ts`,
  `convex/lib/journal.ts`, `convex/dice.ts`, `convex/encounterTables.ts`,
  `shared/contracts/history.ts`. Coordinated event field/index in `convex/schema.ts` and the
  test-roll issuer argument in `convex/lib/tableOperations.ts` were applied by the audience agent.
- Cards and registry: `convex/lib/interactions.ts`, `convex/interactions.ts`,
  `convex/lib/registry.ts`, `convex/commands.ts`.
- Integration at the lead's request: register `foeOperations`; add the `unpaused` session
  requirement for roster operations, including its discovery validator and availability check.
  Foe implementation, wrappers, UI and focused F9 verification belong to the lead's change.
- Regression coverage: `tests/app/history-interaction-regressions.test.ts` (8 tests),
  with corrected nested-deletion expectation and issuer arguments in `journal.test.ts`/
  `dice.test.ts`, consistent response-retry revision in `interactions.test.ts`, and updated
  card syntax/schema expectation in `registry.test.ts` (all under `tests/app/`).

## Verification

Passed:

```text
pnpm exec vitest run --project app tests/app/history-interaction-regressions.test.ts tests/app/journal.test.ts tests/app/dice.test.ts tests/app/interactions.test.ts tests/app/registry.test.ts
5 files, 29 tests passed

pnpm exec tsc -p convex/tsconfig.json --noEmit
exit 0

pnpm exec eslint <changed owned implementation and test files listed above>
exit 0
```

Regression assertions read persisted foe state, events, journal values and scoped identity,
roll rows and generator counter, actor IDs, card lifecycle/revision and original session IDs.
They cover changed-value and deletion-only replacement, copied IDs with same/different dice,
issuer-separated automatic consequences, rename/same-name replacement, revoked control,
actor injection, historical-card rejection through direct and slash entry points, paused/resumed
execution, closure authority and stale revision, and cross-entry-point idempotent response/closure.

An earlier whole-web typecheck encountered in-progress content and audience-agent edits; the
backend-only typecheck above passed afterward. The lead owns final full checks and live/browser
verification. No deployment, reset, commit, STATUS update or independent review performed here.
