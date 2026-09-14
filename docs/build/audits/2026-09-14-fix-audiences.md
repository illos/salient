# A03 audience and source fixes — 2026-09-14

Addresses F6, F7, F8 and F10 in [the independent S02/A01/A03 audit](2026-09-14-S02-A01-A03.md).
Owning contracts: [Malice visibility](../../table-spec.md#malice-visibility),
[foe health display](../../table-spec.md#monster-visibility-and-health-display),
[party resources](../../table-spec.md#party-sheets-and-resource-visibility), and
[direct tests](../../table-spec.md#freeplay-baseline-and-combat-transition).

## Changes

- `convex/lib/audience.ts` owns the shared foe-health and event projections. `events.list` uses the
  current campaign settings at read time, including for existing history. Hidden Malice adjustments
  retain their event and attribution but omit pool values from descriptions, structured before/after
  facts and submitted argument envelopes. Foe Stamina adjustments omit those exact values in Bar and
  Winded modes; Numerical preserves them. Foe temporary Stamina remains Director-only in all modes.
  Persisted events and journals remain complete.
- Show test difficulty defaults off, including campaigns with an older settings object. The Director's
  registered `/campaign test-difficulty-visible state=on|off` operation persists and journals the
  setting, appears in command discovery, and has a table control. Off hides only the recorded
  difficulty from the description/result/envelope. Dice, characteristic, skill, modifiers, total,
  tier, critical information and calculated outcome remain public. Changing the setting immediately
  changes the projection of previously recorded tests.
- `foes.list` now uses the same mode projection as `table.roster`. Its peer UI renders the returned
  mode. No peer payload receives an extra health fraction in Winded or Numerical mode. Full source
  stat blocks retain their separate Director-only access.
- `table.roster` returns only current Stamina and Recoveries for peer heroes. Character owners and
  the Director retain full live records. The hero pane renders only those returned resource fields.
  Public historical gameplay, including a hero's resource adjustment, remains visible. Additional
  character-sharing grants have no implemented representation in this prototype; this change does
  not invent or revoke such grants.
- A successful Recovery reads the already-bundled pinned Catch Breath and Recoveries entries and
  persists complete verbatim Markdown, IDs, source paths and revisions on the event. The Source
  expander renders both the maneuver and its supporting Recovery rule. No new content bundle or
  online rules research was used.

The coordinated F2 identity change also adds the optional event command key/index in `schema.ts` and
passes the authenticated issuer to `rollDice` in `tableOperations.ts`; the history agent owns that fix.
The parent owns F9 registered foe add/remove integration.

## Evidence

`tests/app/audience.test.ts` adds five persisted regression scenarios covering:

1. Malice hidden/revealed/hidden again for players and observers, complete Director history, and
   outsider rejection.
2. Default-off difficulty, player/observer setting rejection, registered setting discovery, historical
   setting changes, complete public workings/outcomes, and unchanged stored payloads.
3. Every health mode through both foe queries and event history, including submitted arguments and
   temporary Stamina. Director reads retain the numbers.
4. Owner/Director versus peer hero records, a player's view of another owner's hero, and preservation
   of public historical resource adjustments.
5. Recovery source text compared byte-for-byte with both pinned local vendor files, revision/path
   provenance, and observer read-through.

Validation completed:

```text
pnpm exec tsc -p tsconfig.web.json --pretty false
passed

pnpm exec vitest run --project app tests/app/audience.test.ts tests/app/table.test.ts
2 files, 11 tests passed

pnpm exec eslint convex/lib/audience.ts convex/events.ts convex/schema.ts convex/table.ts convex/lib/tableOperations.ts tests/app/audience.test.ts tests/app/table.test.ts
passed
```

No deployment, browser run, live concurrency check or commit was performed by this subtask. Those
integration checks belong to the parent. Existing Recovery events written before this fix are not
backfilled with a source snapshot; new successful uses carry their immutable source. The current
projection handles the implemented event shapes; future automatic Malice/health event writers must
supply an explicit compatible audience projection while preserving public used-action source text.
