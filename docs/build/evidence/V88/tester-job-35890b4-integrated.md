# V88 current-main pre-promotion integration gate — 2026-09-20

Job `test-V88-35890b4-integrated-1`, Chords message **993**, submitted by DEPLOY
`bc6847ae-0334-4282-ae3c-6ec7291a509c`. The frozen source was
`35890b4c0d1f250c0cd84a14cb38dcefed501c3c` (tree
`f5598e5580c96c0e344b89fc157bc94a2d89c1a1`) on `integration/V88` in
`.worktrees/deploy-v88`, based on current main
`dd8e3ea62fe07d3d236806f6997b5dcec8356c0b`. The executable parent was
`2600c37df6339be5c68630e87e0c8410f557f9d5`.

Result: **failed** because the required merge-range metadata gate rejects rebased code commit
`be4b4193ac006fd04fa2641255f590270bd8569c`: it has a `Rules-Review:` trailer but is missing the
required independent `Reviewed-By:` trailer. DEPLOY must repair and resubmit a frozen commit before
promotion. The source and behavioral gates otherwise pass, so a metadata-only rewrite that keeps
the submitted tree identical does not require repeating the expensive full check.

## Passing checks

```text
git diff --exit-code 8d43dfb HEAD -- . ':!docs' ':!deploy.md'
PASS — application, test, helper and generated-report bytes equal the reviewed source

node node_modules/vitest/vitest.mjs run --project app tests/app/potency-conditions.test.ts --maxWorkers=1 --no-file-parallelism
PASS — 6/6

node node_modules/vitest/vitest.mjs run --project scripts tests/scripts/live-compiled-report.test.ts --maxWorkers=1 --no-file-parallelism
PASS — 3/3

CI=true pnpm check
PASS — lint/format; 352 engine tests; 571 app/scripts tests; 382 Markdown files; pinned vendor,
1,151-entry content, supporting, foe, compiled-report and production-build gates

node scripts/check-links.ts
PASS — 382 Markdown files

git diff --check
PASS

git status --porcelain --untracked-files=no
PASS — empty
```

The only non-document difference from reviewed `8d43dfb` is `deploy.md`, whose V88 ledger row
stages this integrated candidate. The pinned submodules resolve to Forge
`5a846aadb623a9855a023e9403bb887a956c341f` and Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`.

The regenerated support artifact reports exactly 13 compiled reachable entries, 1,222 legacy
compatibility entries and two compiled-but-unavailable entries. `convex/content.ts` still exports
`reseed` as an `internalAction`, and the full suite exercises it against the 1,151-entry snapshot.

## Blocking check

```text
node scripts/check-commit.ts --merge --range dd8e3ea62fe07d3d236806f6997b5dcec8356c0b..35890b4c0d1f250c0cd84a14cb38dcefed501c3c
FAIL — be4b4193ac00: Missing "Reviewed-By:" trailer; code commits need an independent review before merging to main.
```

The job ran locally from 17:02:22 through 17:08:27 UTC. It started no application stack or browser,
made no deployment or data changes, and left the frozen tracked checkout clean. Outputs are retained
at `/srv/presidium/projects/salient/test-artifacts/V88-35890b4-integrated-20260920T170200Z`.
