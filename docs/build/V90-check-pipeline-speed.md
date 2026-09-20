# V90: Check pipeline speed

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead |
| Rules review | not required |
| Depends on | V89 (shares the scripts-project fixtures; no code dependency) |
| Unblocks | faster TESTER turnaround for every slice |
| Status | see `STATUS.md` |

## Goal

Cut the wall time of the required `pnpm check` gate without weakening any check, by removing work
the pipeline repeats and by letting the coordinator use spare local capacity. The boundary: no test
assertion is dropped or loosened, no generated content changes, no new runtime or dependency is
introduced, and the CT114 container budget (one worker, 2 GB) is unchanged.

## Spec references

- `docs/build/README.md#verification-baseline` — the ordered contents of `pnpm check`.
- `docs/build/README.md#test-value` — a test that repeats another test's failure mode is removed.
- `testing-process.md#coordinator-procedure` — the coordinator chooses hosts and worker counts.

## Measured profile — 2026-09-20

Source: TESTER artifact `test-artifacts/V85-V88-a0c9584-full-integrated-20260920T172800Z`
(full `CI=true pnpm check` on the local 4-core, 16 GB host, one vitest worker) and the verbose
V60/V40 check logs under `docs/build/evidence/`.

| Stage | Measured |
| --- | --- |
| whole job (focused checks, full check, Convex dry run) | 7 min 13 s |
| `check:app` vitest (`app` + `scripts`, 70 files, serial) | 258.9 s |
| `tests/scripts/rules.test.ts` (builds the 2,614-entry corpus twice) | 65–78 s |
| `tests/scripts/foes.test.ts` (generates 438 stat blocks twice) | 26–31 s |
| `tests/scripts/core-presentation.test.ts` | 13–21 s |
| typecheck: engine, web in `check:app`, web again in `build` | ~45 s |
| `eslint . && prettier --check .` | ~15–20 s |
| `check:engine` vitest | 11.2 s |
| `vite build` | 2.9 s |

The same rules ingest ran three times per check (twice in the test, once in `build`) and the foes
generation three times (twice in the test, once in `foes:check`). Bun, a native TypeScript compiler
or a task-cache system were considered and rejected for now: the cost is in-process ingest and
convex-test work under vitest, not runtime start-up, install or bundling.

## In scope

- `tests/scripts/rules.test.ts`: the determinism case compares the single in-process build against
  the files `pnpm rules:ingest` wrote (a separate process from the same pin) instead of building a
  second time. A missing `public/rules-data` fails with a message naming the command.
- `tests/scripts/foes.test.ts`: the determinism case keeps the deep equality against the committed
  catalog and drops the second in-process generation, which could not fail independently of it.
- `package.json`: `check` runs `rules:ingest` before `check:app` and ends with `build:web` (bundle
  and budget only), since the ingest and the web typecheck already ran in the same command. `build`
  remains the standalone full build. `lint` caches ESLint and Prettier under `.cache/` with the
  content strategy.
- `vitest.config.ts` documents that `VITEST_MAX_WORKERS` overrides the pinned single worker.
- README verification-baseline note and this record.

## Out of scope

- Changing worker counts in `runtime/compose.yaml` or `vitest.config.ts`; the CT114 budget stands.
  Adopting `VITEST_MAX_WORKERS=3` for local jobs is TESTER's decision after the measurement below.
- Reducing the 1,151-entry reseed cost in the 25 app suites that call `content.reseed`; measure first.
- `core-presentation.test.ts`, a native TypeScript compiler (`tsgo`), Bun, GitHub Actions sharding.
- Any change to generated content, vendor pins, dependencies or the lockfile.

## Inputs and dependencies

Current main `42baf9c`. No fixtures, no backend, no browser. The candidate needs `public/rules-data`
generated in the worktree that runs the `scripts` project; `pnpm check` now does that itself.

## Deliverables

`package.json`, `vitest.config.ts`, `eslint.config.js`, `.gitignore`, `tests/scripts/rules.test.ts`,
`tests/scripts/foes.test.ts`, `docs/build/README.md`, `docs/build/STATUS.md`, this document.

## Acceptance checks

1. `CI=true pnpm check` passes on the candidate with the new order. Evidence: TESTER certificate.
2. The `app` + `scripts` vitest duration on the candidate (one worker) is below main's 258.9 s
   baseline by roughly the removed rebuilds (about 40 s). Report the actual numbers; no assertion
   encodes an expected time.
3. `VITEST_MAX_WORKERS=3 pnpm check:app` on the candidate passes on the local host with peak memory
   recorded, so TESTER can decide whether local jobs adopt it. A failure or memory pressure is a
   result, not a blocker for 1–2.
4. A second `pnpm lint` on the unchanged tree is measurably faster than the first; report both.
5. Optional negative check: with `public/rules-data` removed in the job worktree, the focused
   `rules.test.ts` run fails naming `pnpm rules:ingest`; regenerate afterwards.

## Ability design and playtest evidence

Not applicable.

## Rules research

None.

## Open questions

None.

## Work log

- 2026-09-20 — Plan (Fable, thread `11881977-3b63-4148-80c4-db1e8b7325c8`): worktree
  `.worktrees/check-speed`, branch `slice/V90` from main `42baf9c`; no development backend.
  Profile above taken from retained TESTER artifacts, not from an independent run. Authoring checks
  run locally: ESLint and Prettier on the changed files, `tsc -p tsconfig.web.json`,
  `pnpm rules:ingest`, `pnpm check-links`, `check-commit`. Vitest was not run here; the job below
  measures it through TESTER per the testing process.
- 2026-09-20 — TESTER job submitted on the user's instruction as Chords handoff
  `test-V90-<candidate>-1` to TESTER `46c30412-6e29-44dc-b30b-08ffe22bd0e3`: acceptance checks 1–4
  (5 optional), the frozen commit, base `42baf9c`, and a request to record per-stage durations and
  peak memory for the 3-worker comparison. Result pending.
