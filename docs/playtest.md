# Run the headless combat experiment

This runs the retained 2026-09-10 headless CLI experiment, not the pre-alpha web app; see the [README](../README.md) for the app. Commands were updated to pnpm on 2026-09-14 (`pnpm check` also builds the web app, so use `pnpm check:engine` here).

Requires Node 24.12 or later and pnpm 11.5.3. From the project root:

```sh
pnpm install --frozen-lockfile
pnpm check:engine
pnpm demo
```

The demo prints its unique `.playtest/demo-….json` artifact path, full source abilities, each request and modifier result, pending table work, and state before/after history navigation. These local files are experiment records, not the planned application database. No Convex deployment is involved.

For an easy-to-type filename, use `pnpm play demo .playtest/example.json`. Existing files are refused unless you explicitly append `--force`. The demo starts with a manually supplied turn Ferocity gain, uses Goblin Warrior's Spear Charge, uses Fury's Brutal Slam, and records table completion of its movement. It then reopens the saved file and restores the previous/following recorded states. Its fixed rolls are supplied inputs, not generated randomness.

```sh
pnpm play state .playtest/example.json
pnpm play abilities .playtest/example.json
pnpm play ability .playtest/example.json fury:brutal-slam
pnpm play log .playtest/example.json
pnpm play back .playtest/example.json
pnpm play forward .playtest/example.json
```

State, log, ability inspection, reopening, and backward/forward navigation read recorded data; they never invoke the parser, engine, or dice roller. `parse` is a separate, explicit analysis with the **current** parser:

```sh
pnpm play parse .playtest/example.json fury:brutal-slam
```

Read parser diagnostics and scenario notes. Recognizing an ability's tier expressions does not establish support for all its surrounding traits or game procedures. An action's output distinguishes applied effects from unresolved work; `manual-required` is deliberately not a claim of complete resolution.

## Submit your own commands

Start a new scenario, optionally including the Spinecleaver squad:

```sh
pnpm play init .playtest/custom.json --squad
```

Save this JSON as `.playtest/strike.json`, then run `pnpm play submit .playtest/custom.json .playtest/strike.json`:

```json
{
  "kind": "use-ability",
  "id": "strike-001",
  "actorId": "warrior",
  "abilityId": "warrior:spear-charge",
  "targetIds": ["fury"],
  "roll": [5, 5],
  "facts": {
    "targetsConfirmed": true,
    "edges": 0,
    "banes": 0,
    "distances": { "fury": 1 }
  }
}
```

The `facts` are table attestations for this experiment, not facts inferred from a map. Omit target confirmation to inspect a blocked request. Hero actions also need the current turn's `furyFerocityPeak` where applicable; unsupported modifiers require manual handling. Combat turn scheduling and the complete Fury feature set are not automated.

Save a manual correction as `.playtest/correction.json` and submit it through the same command:

```json
{
  "kind": "manual",
  "id": "correction-001",
  "reason": "The table resolved an additional effect and confirmed the final Stamina.",
  "changes": [
    { "kind": "stamina", "entityId": "fury", "value": 25 },
    { "kind": "fury-triggers", "entityId": "fury", "firstDamageRound": 1, "windedTriggered": false }
  ]
}
```

Manual Fury Stamina changes must also supply `fury-triggers` in the same command. This example preserves the first-damage trigger already used by the preceding strike in round 1. For a newly resolved hit, update those flags and Ferocity explicitly according to the ability and current state; otherwise later automation could grant the same resource twice. Omit `firstDamageRound` only when deliberately clearing that bookkeeping.

For a pending movement or unsupported effect, copy its exact ID from `state` into `completePendingIds`, describe what the table resolved in `reason`, and include any actual state corrections in `changes`. An empty `changes` array is appropriate when the resolution only happened on an external map. Do not clear pending work merely to bypass a dependency.

Every command needs a stable unique `id`. Repeating the identical command returns its existing record and does not apply it twice. Reusing the ID with different input fails. A new action while viewing the past is refused; move forward to the end first. Future entries are preserved; branching is deferred.

## Recovery and implementation boundary

The CLI writes the request and its before-state durably **before** invoking a modifier. It then records the returned output and after-state together using atomic file replacement. Failed invocations remain explicit. If the process exits after saving input but before saving output, reopening shows a `requested` entry and leaves state unchanged; it never automatically reruns the request.

Writers use a per-file `.lock`. Following a crash, inspect the lock's process ID and confirm the process is no longer running before deleting the stale lock. Do not remove a live writer's lock. To close an unfinished request without reexecuting it:

```sh
pnpm play abandon .playtest/custom.json strike-001 "Confirmed the process exited; no result was committed."
```

The history module exposes `createRun`, `submitCommand`, `currentState`, `navigate`, `readRun`, `writeRun`, `withRunFile`, and `abandonRequest`. `submitCommand` accepts an injectable evaluator and persistence hook, allowing tests to count evaluations and prove navigation does not invoke one. File updates must hold `withRunFile`; the CLI does so. This prototype uses complete before/after snapshots for clarity, without committing the future application to that storage strategy.
