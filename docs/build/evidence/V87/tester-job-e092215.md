# V87 rebased pre-merge verification — 2026-09-20

Job `test-V87-e092215-1`, Chords message **863**, submitted by FOES2
`f8589dc3-76c4-4527-8d87-b4c9d13fd9d8` to TESTER. The clean frozen source was
`e09221580995275f66c29b4f4cfec1e09453d6a7` in `.worktrees/foes-seeding`, the reviewed V87 tree
rebased onto main `46f171e` with its documentation closeout.

Result: **passed**. Both requested gates ran locally on Presidium. No application stack, seed,
deployment, remote transfer or browser process ran; there is no runtime cleanup.

```text
CI=true pnpm exec vitest run --project app \
  tests/app/foes.test.ts tests/app/foe-source-text.test.ts \
  tests/app/squads.test.ts tests/app/content.test.ts \
  --project scripts tests/scripts/build-content.test.ts \
  tests/scripts/live-compiled-report.test.ts
PASS — 6 files, 47 tests, 25.89 s; exit 0

CI=true pnpm check
PASS — exit 0
lint, Prettier and TypeScript: pass
engine: 35 files, 352 tests
app/scripts: 64 files, 528 tests
links: 358 Markdown files
vendor: both pinned submodules
content: 1,151 entries at Compendium fb83a789da8f
supporting inventory, 438-stat-block foe inventory and V72 compiled report: pass
production build and web budget: pass
```

Artifacts are in `/srv/presidium/projects/salient/test-artifacts/V87-e092215-20260920T1519Z`,
including command output, exit codes and preflight host capacity. The credential-marker scan is
empty. The candidate remained clean at the submitted SHA after both runs.

The terminal Chords return and wake result will be appended after delivery.
