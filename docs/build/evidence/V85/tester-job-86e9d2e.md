# V85/V86 hosted acceptance — 2026-09-20

Job `test-V85-V86-86e9d2e-3`, Chords message **803**, submitted by WIZARD
`a45eccaa-2dd6-4bb8-ae39-e3a217d1aeb1` to TESTER. The frozen candidate was
`86e9d2ed3b82a5d027f631f677975f040439f472` in `.worktrees/supporting-actions`.

Result: **blocked after deployment; hosted acceptance incomplete**. The compiler, focused tests,
integrated repository gate, Convex dry run, Convex deployment, frontend build and Worker publication
all passed. The hosted API proof passed its first 30 scenarios, then exhausted the runner's fixed
240-second overall execution budget inside the pre-existing culture-presets scenario. The four
V85/V86 scenarios received zero remaining time and did not run. This is not a 35/35 acceptance result.
TESTER did not retry, raise a timeout or weaken an assertion.

## Runner, source and targets

- Pure checks, build and headless runner: local Presidium. Preflight had about 14 GiB available RAM,
  no memory pressure and 13 GiB free disk. CT114 had about 10 GiB available RAM, no memory pressure,
  24 GiB free disk and only shared main running. No CT114 environment was started and no source
  archive crossed the wire.
- Convex target: development deployment `different-bat-943`,
  `https://different-bat-943.convex.cloud`. The target was identified and announced before the
  dry run and deployment. Existing content and play data were retained; no configure, reseed or
  reset operation ran.
- Frontend target: Cloudflare account `462b5ee1e395c11b8523d6c38de0577a`, Worker `salient-dev`,
  `https://salient-dev.rdxx.workers.dev`. The target was identified and announced before publication.
  Live identity returned HTTP 200, asset `dist/assets/index-C6mJj8G3.js`, 84 Convex functions and
  Worker version `bb430814-0366-43a3-882a-bd69f81cc811`.
- Artifacts: `/srv/presidium/projects/salient/test-artifacts/V85-V86-86e9d2e-20260920T1433Z`.
  Command output and exit codes are retained separately. The bounded `convex logs` capture exits
  124 because the CLI streams after returning its requested history; its 1,000 JSONL rows are intact.

## Local and deployment results

```text
pnpm exec tsc --noEmit
PASS — exit 0

pnpm exec vitest run --project engine --maxWorkers=1 \
  tests/complication-actions.test.ts tests/starting-item-abilities.test.ts
PASS — 2 files, 6 tests, 650 ms; exit 0

pnpm exec vitest run --project app --maxWorkers=1 \
  tests/app/complication-actions.test.ts tests/app/starting-rewards.test.ts
PASS — 2 files, 5 tests, 4.57 s; exit 0

pnpm check
PASS — 345 engine tests and 519 app/script tests; links, pinned vendor,
567-entry content snapshot, supporting inventory, foes, compiled report and production build; exit 0

pnpm exec convex deploy --yes --dry-run
PASS — functions bundled and typechecked; schema validated; exit 0

pnpm exec convex deploy --yes
PASS — deployed to different-bat-943; exit 0

hosted frontend build and wrangler@4.134.0 deploy
PASS — credential scan empty; 21 changed assets uploaded; exit 0
```

Convex deployment regenerated `convex/_generated/api.d.ts` in the candidate worktree. The retained
`api-dts-after.diff` adds generated module-map entries for `lib/compiledResults`,
`lib/compiledSource`, `lib/startingRewards` and `startingRewardValidators`; it does not alter the
application source represented by the submitted commit. The candidate worktree is therefore dirty
after deployment, and TESTER did not discard that generated delta.

## Hosted proof and timeout classification

The hosted runner targeted the exact deployed Convex and Worker identities and reported source
`86e9d2ed3b82a5d027f631f677975f040439f472`. It created three disposable authenticated actors and
attempted normal cleanup in `finally`; the report contains no cleanup failure.

```text
scripts/verify-character-headless.ts
FAIL — exit 1, 240.591 s
30 scenarios passed
1 culture-presets scenario failed after 57.889 s: request-timeout
4 V85/V86 scenarios failed at 0 ms: run-deadline
```

The `request-timeout` label is misleading in this case. The runner gives all scenarios one shared
240-second deadline. Its scenario wrapper calls the same `bounded()` helper used for individual
requests, with the remaining overall duration. The first 30 scenarios had consumed about 182 seconds,
so culture presets received about 58 seconds. It hit that wrapper deadline exactly; subsequent
scenarios failed the explicit `active()` deadline check without issuing their operations. There is no
scenario filter or resume control in the submitted runner.

A bounded read-only capture of the most recent 1,000 Convex log records found no backend timeout or
resource-budget failure. The slowest uncached execution in the capture was an authentication request
at 0.332 seconds; the slowest application query was `characterWizard:discover` at 0.181 seconds of
user execution. The two recorded application errors were the expected authorization rejections from
negative cases (`Campaign unavailable`), not server timeouts. This evidence classifies the failure as
runner-budget exhaustion, not CT114 pressure, Convex's one-second function limit or a failed V85/V86
assertion.

WIZARD needs to submit a runner that can prove the remaining scenarios within its declared limits,
for example by splitting the acceptance workload while preserving the existing per-request timeout
and assertions. The deployed development targets currently contain this candidate, but deployment
success does not substitute for the missing four hosted scenarios.

TESTER returned the blocker directly to WIZARD in Chords message **811** using stable key
`test-V85-V86-86e9d2e-3-blocked-return` and `wake: true`. Chords reported
`wake.status: accepted` (`turn_request_accepted`). This records delivery of the repair handoff;
it does not claim that WIZARD has completed it.
