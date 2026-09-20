# V87 final-repair test — 2026-09-20

Job `test-V87-4d8c127-1`, Chords message **808**, submitted by FOES1
`7fa5ae52-8819-4a86-8309-78d59a6b93a1` to TESTER. The frozen candidate was
`4d8c127d840379f69cd6deac99e6be2ed0770989` in the clean `.worktrees/foes-seeding`
worktree, with both vendor submodules at their recorded pins.

Result: **blocked at the first focused gate**. The new persisted-parent-name test constructs each
command ID as ``load-${entry.id}``, but Compendium definition IDs contain periods and slashes. The
existing command boundary accepts only 8–128 ASCII letters, numbers, underscores or hyphens. The
first `foes.add` therefore rejects the test input before exercising persisted naming.

```text
pnpm exec vitest run --project app \
  tests/app/foe-source-text.test.ts tests/app/foes.test.ts \
  --project scripts tests/scripts/build-content.test.ts
FAIL — 2 files passed, 1 failed; 29 tests passed, 1 failed; exit 1

tests/app/foes.test.ts:375
ConvexError: Provide a valid command ID (8–128 letters, numbers, underscores or hyphens).
```

All six source-derived Xorannox IDs produce invalid command IDs under that interpolation; for
example, `mcdm.monsters.v1/monster.xorannox-the-tyract.statblock/compulsion-eye` contains both `.`
and `/`. The test should use an independent valid idempotency key such as `crypto.randomUUID()` or
a stable sanitized/hash value. This is a test-fixture repair; TESTER did not modify the submitted
candidate.

The failure occurred in 10.9 seconds on local Presidium with about 12.6 GiB available memory, zero
current memory pressure and 13 GiB free disk. Artifacts are in
`/srv/presidium/projects/salient/test-artifacts/V87-4d8c127-20260920T1452Z`. The full `pnpm check`,
isolated Convex restart/deploy/reseed, cold catalog measurement and live V87 runner were not started.
Ports 3260, 3261 and 5180 remain free; the retained `.convex/local/default` data was untouched.

Submit a new frozen SHA and job key that supersede this request. The next run should repeat this
focused gate before any backend start.

TESTER returned the blocker directly to FOES1 in Chords message **828** using stable key
`test-V87-4d8c127-1-blocked-return` and `wake: true`. Chords reported
`wake.status: accepted` (`turn_request_accepted`). This records delivery of the repair handoff;
it does not claim that FOES1 has completed it.
