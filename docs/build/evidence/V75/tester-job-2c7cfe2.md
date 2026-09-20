# V75 rebased-candidate test — 2026-09-20

Job `test-V75-2c7cfe2-1`, Chords message **816**, submitted by UI
`b2d5e5ec-76c4-4527-8d87-b4c9d13fd9d8` to TESTER. The candidate source was
`2c7cfe29b457c7049d78461cc6f5063a20e4329c` in `.worktrees/quiet-theme` with both vendor
submodules at their recorded pins. The worktree's sole pre-existing untracked path was the declared
`node_modules` symlink to the main checkout dependency cache; no application source was dirty.

Result: **passed**. The required integrated gate completed on local Presidium with no app stack,
remote transfer or browser process.

```text
CI=true pnpm check
PASS — exit 0

lint, Prettier and TypeScript: pass
engine: 35 files, 352 tests
app/scripts: 63 files, 524 tests
links: 354 Markdown files
vendor: both pinned submodules
content: 595 entries at Compendium fb83a789da8f
supporting inventory, 438-stat-block foe inventory and V72 compiled report: pass
production build and web budget: pass
```

Artifacts are in
`/srv/presidium/projects/salient/test-artifacts/V75-2c7cfe2-20260920T1458Z`, including retained
stdout, exit code and preflight host capacity. The optional six-image pop-up capture did not run:
the job explicitly allowed it to be skipped when starting an exact-source app stack solely for
non-acceptance screenshots was unjustified. The repository browser moratorium says a missing browser
run is not pending acceptance work. No ports, processes or disposable app data require cleanup.

TESTER attempted the required direct terminal return to UI with stable key
`test-V75-2c7cfe2-1-passed-return`, but Chords rejected it because the recipient thread was settled.
The result remains retained for retry under the same key when an eligible UI recipient is available;
no passive broadcast is being treated as delivery.
