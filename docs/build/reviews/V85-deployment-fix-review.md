# V85/V86 deployment correction review

Reviewer: independent native Astra agent `deployment_fix_review`, 2026-09-20.
Verdict: static implementation review PASS against `854a5dd`; no findings.

Reviewed `shared/evaluate/startingItemAbilities.ts`, `convex/startingRewardValidators.ts`,
`convex/characterTables.ts`, `convex/characterRewards.ts` and `convex/lib/startingRewards.ts`.
The extracted validator body is identical. The schema import graph no longer reaches runtime
authentication through the reward helper. Authorization checks, reward initialization and
public query/mutation handlers are unchanged.

The item helper's manifest import now matches existing attribute-free backend imports. Only
`convex/characters.ts` and `convex/lib/resolve.ts` import this helper; no direct Node script caller
was found. Application tests reaching it use the Vitest bundler. Thus the readback identifies no
new raw-Node JSON import failure on existing script paths.

No tests, builds, lint/type checks, deployment commands or services were run by this reviewer.
The earlier temporary dry-run pass is diagnostic history, not proof of this permanent candidate.
TESTER owns execution and actual hosted API acceptance under the project testing process.

## NodeNext correction after TESTER return

TESTER’s focused checks passed on `b08ebcd`, but the repository NodeNext typecheck failed at
its attribute-free JSON import (TS1543). The initial static review above did not certify that
compiler gate and was insufficient to discover it; the earlier successful Convex dry run used
a different typecheck path.

The same independent reviewer read the replacement three-file diff against `b08ebcd` and returned
static PASS, no findings. `startingItemAbilities` no longer imports JSON; its required
`compendiumRevision: string` argument supplies provenance. The only two callers are
`convex/characters.ts` and `convex/lib/resolve.ts`; both now pass their already-imported
`manifest.compendium.revision`. The direct manifest import and barrel re-export at those existing
backend boundaries refer to the same source. No new import or hardcoded revision is introduced.
The isolated schema validator remains unchanged and free of runtime auth dependencies.

No tests, builds or compiler checks were run by WIZARD or the reviewer. This static verdict does
not certify typechecking: TESTER must pass the full repository compiler gate and Convex deployment
validation before the hosted API suite can establish acceptance.
