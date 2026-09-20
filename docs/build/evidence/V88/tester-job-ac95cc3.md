# V88 coordinator gate — `ac95cc3`

Result: **failed** on 2026-09-20. The focused V88 suites and deterministic coverage-audit
freshness gate pass, but the required full repository check has three app-test failures. No
backend, deployment, source upload or browser process was started.

## Identity and target

- Job: `test-V88-ac95cc3-1` (Chords message 876)
- Requester: ENGINE `2b1ba081-4040-4665-9ea2-22364db707f4`; result copied to ENGINE2
  `3498baf0-e8d9-442b-a704-f24f7e595b30`
- Source: `/srv/presidium/projects/salient/code/.worktrees/engine-potency`, branch `slice/V88`,
  commit `ac95cc36959b52549be7d4824dc9ab8f1878d39e`
- Pinned inputs: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, Forge
  `5a846aadb623a9855a023e9403bb887a956c341f`
- Target: local pure Vitest/TypeScript/build gates; no application target
- Artifacts: `/srv/presidium/projects/salient/test-artifacts/V88-ac95cc3-20260920T152656Z`

The tracked source stayed clean. `CI=true pnpm check` recreated the worktree's shared
`node_modules` target from the unchanged lockfile before running; it made no tracked source change.

## Results

The requested script-focused command passed 88/88 tests in five files (4.04 seconds):

```text
node node_modules/vitest/vitest.mjs run --project scripts \
  tests/scripts/compiled-ability.test.ts \
  tests/scripts/audit-ability-grammar.test.ts \
  tests/scripts/live-compiled-report.test.ts \
  tests/scripts/compiled-condition-privacy.test.ts \
  tests/scripts/compiled-effects-presentation.test.ts \
  --maxWorkers=1 --no-file-parallelism
```

The requested app-focused command passed 34/34 tests in four files (6.10 seconds):

```text
node node_modules/vitest/vitest.mjs run --project app \
  tests/app/potency-conditions.test.ts \
  tests/app/condition-instances.test.ts \
  tests/app/compiled-effects.test.ts \
  tests/app/combat.test.ts \
  --maxWorkers=1 --no-file-parallelism
```

`CI=true pnpm check` ran from 15:27:44 through 15:31:10 UTC and exited 1. Lint/formatting and
the 352-test engine stage passed. The app/scripts stage ended with 559 passes and these three
failures; later full-check stages did not run:

1. `tests/app/abilities.test.ts:841` still expects Bury the Point's bounded bleeding clause in
   `unresolvedClauses`, but V88 now compiles and resolves that clause, so the received list is empty.
   The assertion and its “potency clause is unresolved” comment need the V88 applied/resisted result.
2. `tests/app/compiled-source.test.ts:53` still requires every Bury the Point second node to be
   `unsupported`. V88 intentionally turns bounded second-and-final potency clauses into `condition`
   nodes, so this V72 assertion needs the documented narrow V88 adaptation.
3. `tests/app/v001-walkthrough.test.ts:281` expects an archived-event correction to fail with
   `archived`, but receives `Condition target is unavailable.` This is an ordering regression:
   `abilityCorrect` now calls `hasRolledConditionSave` for the removed foe before
   `assertCorrectionAllowed` applies the archived-window guard. Restore the archived guard before
   reading V88 condition state, or make the new check archive-aware.

The coverage audit was generated twice in separate artifact directories using `audit()` and
`renderMarkdown()` without writing into the candidate worktree. Both generations are byte-identical
to each other and to the committed reports:

| File | SHA-256 |
| --- | --- |
| `report.md` | `bda6ac5858e82e1912a27491ea843ac62369c410c886c506dd2a04780398ce33` |
| `report.json` | `db0532cff0a89d19505c07e3881f682b3db72b4227c1d6b3b60633275f62c79b` |

The original failing full-check log, focused logs, exit codes, timestamps, both generated reports
and all comparisons remain in the artifact directory. The next candidate should update the two
superseded assertions, repair the archived-correction ordering, and submit a new job key. The
dependent real-headless job should remain gated on a green rerun.

The failed return was sent directly to ENGINE as Chords message 880; its wake was accepted. A
quiet copy was sent to ENGINE2 as message 881.
