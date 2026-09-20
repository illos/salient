# V85/V86 bounded hosted acceptance — 2026-09-20

Job `test-V85-V86-331a5b9-4`, Chords message **832**, was submitted by WIZARD and transferred by
message **843** to WIZARD.2 `f8b014d3-c9a7-4e97-828d-da1e5773e53c`. The clean frozen runner
source was `331a5b913b392f648c3281fa4c79bf7544892010` in `.worktrees/supporting-actions`.
Application source remained byte-equivalent to the already-deployed
`86e9d2ed3b82a5d027f631f677975f040439f472`.

Result: **passed across retained and resumed runs**. This is deliberately not described as one
35/35 run. The prior hosted report retains its original 30 passes and five deadline failures. Five
fresh bounded cohort runs now pass the exact five scenario names that previously had no successful
result. A generated combined manifest verifies 35 distinct names across those retained reports.

No application deploy, frontend build, upload, configure, seed, reset, browser or server startup ran.
All hosted calls targeted the existing development deployment
`https://different-bat-943.convex.cloud`, using
`https://different-bat-943.convex.site` for auth and
`https://salient-dev.rdxx.workers.dev` as the allowed origin. Every cohort used fresh disposable
authenticated actors and reported no cleanup failure. Existing data was preserved.

## Runner gates

```text
pnpm exec vitest run --project scripts --maxWorkers=1 \
  tests/scripts/headless-deadline.test.ts
PASS — 1 file, 1 test, 235 ms; exit 0

pnpm exec eslint scripts/verify-character-headless.ts \
  scripts/headless/character-client.ts tests/scripts/headless-deadline.test.ts
PASS — exit 0

pnpm exec prettier --check scripts/verify-character-headless.ts \
  scripts/headless/character-client.ts tests/scripts/headless-deadline.test.ts
PASS — exit 0

node scripts/check-links.ts
PASS — 356 Markdown files; exit 0
```

An `invalid-cohort` invocation exited 1 before authentication in 0 ms with the sole reason
`cohort-validation-failed`, proving unknown cohort names do not create actors or call the app. The
15-second request bound, 240-second run bound and 295-second hard stop were unchanged.

## Hosted cohort results

| Cohort | Scenario | Result | Runner elapsed |
| --- | --- | --- | ---: |
| `culture` | all 27 book defaults persist independently of ancestry and remain customizable | pass | 72.257 s |
| `complication-choices` | source actions persist with original timing and replaced grants disappear | pass | 57.849 s |
| `complication-table` | manual actions, Recovery undo, all-resource payment and Victory gates | pass | 27.594 s |
| `starting-rewards` | one award survives approved career edits and restored builds | pass | 12.636 s |
| `starting-items` | every possessed treasure persists and exposes its source actions | pass | 51.887 s |

Each report contains exactly one passing scenario, `coverage: selected-cohort`, deployed application
source `86e9d2e...` and runner source `331a5b9...`. The culture, complication, reward and treasure
assertions are the original scenario exports; the cohort runner did not weaken or duplicate them.

Artifacts are in
`/srv/presidium/projects/salient/test-artifacts/V85-V86-331a5b9-20260920T1513Z`. The
`combined-coverage.json` manifest verifies that the five new passing names exactly equal the prior
five failed names, and that those plus the retained 30 passes form 35 distinct scenario names. The
credential-marker scan is empty. The prior failed aggregate remains at
`/srv/presidium/projects/salient/test-artifacts/V85-V86-86e9d2e-20260920T1433Z` and is not replaced
or rewritten.

TESTER returned the passing result directly to WIZARD.2 in Chords message **866** using stable key
`test-V85-V86-331a5b9-4-passed-return`. Chords reported `wake.status: accepted`
(`turn_request_accepted`). This records delivery; it does not claim that WIZARD.2 has completed
review or integration.
