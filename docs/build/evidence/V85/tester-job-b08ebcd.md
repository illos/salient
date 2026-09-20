# V85/V86 corrected-candidate test — 2026-09-20

Job `test-V85-V86-b08ebcd-2`, Chords message **798**, submitted by WIZARD
`a45eccaa-2dd6-4bb8-ae39-e3a217d1aeb1` to TESTER. Candidate
`b08ebcd53caccbd0ac271dd747211dacdfe5998d` in the clean
`.worktrees/supporting-actions` worktree superseded the original blocked request.

Result: **blocked before deployment**. Focused behavior tests pass, but the required integrated
TypeScript gate rejects the corrected manifest import. No Convex deployment preparation, schema
push, frontend build/publication, content reseed, hosted API call or browser test ran. Hosted dev
`different-bat-943` and `salient-dev.rdxx.workers.dev` were untouched by this attempt.

## Runner and artifacts

- Runner: local Presidium, 2026-09-20 14:28 UTC. At preflight it had 14,180 MiB available RAM,
  no current memory pressure and 13 GiB free disk. CT114 had 10,018 MiB available RAM, no current
  memory pressure, 24 GiB free disk, and only shared main running. Local was sufficient for pure checks.
- Frozen source stayed clean at the submitted SHA. Compendium and Forge submodules matched their
  recorded pins. No app stack or source transfer was needed.
- Artifacts: `/srv/presidium/projects/salient/test-artifacts/V85-V86-b08ebcd-20260920T1428Z`.
  Each command has retained stdout and a separate exit-code file.

## Results

```text
pnpm exec vitest run --project engine --maxWorkers=1 \
  tests/complication-actions.test.ts tests/starting-item-abilities.test.ts
PASS — 2 files, 6 tests, 629 ms; exit 0

pnpm exec vitest run --project app --maxWorkers=1 \
  tests/app/complication-actions.test.ts tests/app/starting-rewards.test.ts
PASS — 2 files, 5 tests, 4.60 s; exit 0

pnpm check
FAIL — lint/Prettier pass, then tsc --noEmit exits 2
shared/evaluate/startingItemAbilities.ts(3,22): TS1543
Importing JSON into a NodeNext ECMAScript module requires a type: "json" import attribute.
```

The correction removed that attribute because Convex 1.45/esbuild previously treated the annotated
metadata key as a filename and failed with `ENOENT`. The candidate therefore exchanges the confirmed
Convex deployment failure for a deterministic repository typecheck failure. Focused Vitest transpilation
does not exercise this NodeNext constraint, which is why its 11 assertions pass first.

WIZARD should avoid a direct JSON import at this module boundary rather than choosing one side of
the incompatible attribute behavior. One bounded option is to generate/export the Compendium revision
from the existing `shared/content/starting-item-abilities.ts` artifact (or pass the revision through a
dependency that is already valid in both build graphs). Preserve the source revision in emitted ability
provenance. This is a repair suggestion, not an implementation performed by TESTER.

Submit a new frozen SHA and new job key superseding this request. The next run should start with the
same focused groups and integrated gate; only after those pass should TESTER identify and announce
the exact non-production target, deploy the matching candidate, and run the 35-scenario hosted API proof.
