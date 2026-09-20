# V88 alias-aware fixture and full gate — `1af9c75`

Result: **passed** on 2026-09-20. The repaired Wode fixture and the first full repository gate
containing the reviewed combat-end unscheduling log both pass. No backend, deployment, upload or
browser process was used.

## Identity and target

- Job: `test-V88-1af9c75-6-alias-fixture` (Chords message 908)
- Requester: ENGINE `2b1ba081-4040-4665-9ea2-22364db707f4`; result copied to ENGINE2
  `3498baf0-e8d9-442b-a704-f24f7e595b30`
- Source: `/srv/presidium/projects/salient/code/.worktrees/engine-potency`, branch `slice/V88`,
  commit `1af9c7509400d493d690851e4d3e5b0f6ecad30a`
- Prior failed source: `c220cbc7ee3e20b9b96ac12ca3681c398a4bdc27`
- Target: local pure Vitest/TypeScript/content/build gates using `convex-test`
- Artifacts: `/srv/presidium/projects/salient/test-artifacts/V88-1af9c75-20260920T154801Z`

The source stayed frozen and tracked-clean except for its declared untracked `node_modules` symlink;
both pinned vendor submodules matched their gitlinks.

## Results

The submitted focused command passed 2/2 tests in 1.95 seconds:

```text
node node_modules/vitest/vitest.mjs run --project app \
  tests/app/potency-conditions.test.ts --maxWorkers=1 --no-file-parallelism
```

The alias-aware Wode redo fixture now compares functional live state independently of regenerated
clock-registration storage IDs, then verifies that the same condition occurrence points to an active
replacement registration with equivalent encounter, timing, work, source and affected IDs. Its
roll rows remain JSON-byte-identical across undo/redo.

`CI=true pnpm check` ran from 15:48:29 through 15:52:51 UTC and exited 0. It passed:

- ESLint and Prettier;
- TypeScript plus 352/352 engine tests in 35 files;
- web TypeScript plus 563/563 app/scripts tests in 66 files;
- 359-document relative-link and anchor validation;
- both pinned vendor checks;
- the 595-entry Compendium content check;
- supporting inventory, 438-stat-block foe catalog and V72 support report checks;
- rules/foe asset generation, production Vite build and web budget check.

Focused log SHA-256: `7b43f2b18e33321b3631445e3cabfbfed6aa6f42a4349c7ab309f749206a2689`.
Full-check log SHA-256: `abd32e25be7376cb4c011c3b4026c0c1783abdce0668fb039dac14b9d7b78ef4`.

The prior twice-generated audit freshness proof remains valid because this repair changes neither
the grammar, audit generator nor committed reports. The earlier `c220cbc` focused failure remains
preserved in [its coordinator record](tester-job-c220cbc.md).

This verifies the exact submitted source. V87 merged into main after the candidate branch was cut;
any subsequent rebase or integration candidate requires its own appropriate gate.
