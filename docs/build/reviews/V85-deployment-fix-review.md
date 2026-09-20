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
