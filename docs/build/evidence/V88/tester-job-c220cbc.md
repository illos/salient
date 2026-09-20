# V88 implementation-review repair gate — `c220cbc`

Result: **failed focused gate** on 2026-09-20. The submitted four-file local `convex-test` command
passed 27/28 tests; the new Wode player undo/redo assertion failed. Per the coordinator process,
the full `CI=true pnpm check` was not started. No backend, deployment, upload or browser was used.

## Identity and target

- Job: `test-V88-c220cbc-5-review-repair` (Chords message 902)
- Requester: ENGINE `2b1ba081-4040-4665-9ea2-22364db707f4`; result copied to ENGINE2
  `3498baf0-e8d9-442b-a704-f24f7e595b30`
- Source: `/srv/presidium/projects/salient/code/.worktrees/engine-potency`, branch `slice/V88`,
  commit `c220cbc7ee3e20b9b96ac12ca3681c398a4bdc27`
- Prior green source: `a07dd279cb5dc98f92d231d4c9fae52812a7a7f7`
- Target: local pure `convex-test`
- Artifacts: `/srv/presidium/projects/salient/test-artifacts/V88-c220cbc-20260920T154526Z`

The candidate was frozen and tracked-clean; its only untracked entry was the declared shared
`node_modules` symlink. Both pinned vendor submodules matched their gitlinks.

## Failure

```text
node node_modules/vitest/vitest.mjs run --project app \
  tests/app/condition-instances.test.ts tests/app/potency-conditions.test.ts \
  tests/app/combat.test.ts tests/app/v001-walkthrough.test.ts \
  --maxWorkers=1 --no-file-parallelism
```

The command exited 1 after 6.05 seconds: three files passed; `tests/app/potency-conditions.test.ts`
failed `player Wode correction flips potency and replaces slowed with tier-three restrained` at
line 248. The functional state was restored: the same restrained condition occurrence was active
after redo. Only its `registrationId` differed:

```text
before undo: 00000000010768clockRegistrations
after redo:  00000000010798clockRegistrations
```

This is the documented history model, not replacement gameplay dice or a changed condition
occurrence. `convex/historyTables.ts` states that Convex assigns a fresh ID when redo recreates an
inserted document; `historyAliases` maps the former clock-registration ID to the live row and
`restoreUnit` rewrites recorded references through that alias. The test's whole-object equality
therefore compares an intentionally regenerated storage ID.

Repair the fixture to assert the promised behavior directly: same condition occurrence ID/source,
condition/status/toggles/stamina restored, the new `registrationId` resolves to a live scheduled
registration with the same timing/work/source facts, and the roll rows remain byte-equal. Preserve
the assertion that no replacement die was generated. Then submit a new job key. The combat-end
unscheduling test itself passed in this focused run.

The prior twice-generated audit evidence remains valid because this candidate does not change the
grammar, audit generator or reports. The original log, timestamps and exit code remain in the
artifact directory.

The failed return was sent directly to ENGINE as Chords message 906; its wake was accepted. A
quiet copy was sent to ENGINE2 as message 907.
