# V87 reference-content evidence

Source worktree: `.worktrees/foes-seeding`, branch `slice/V87` from `ad8bdbe`.
Runner: local Presidium. Application target: isolated anonymous Convex at
`http://127.0.0.1:3260`, HTTP actions `http://127.0.0.1:3261`, private worktree `.convex` data.
No browser, CT114 runtime change or production deployment.

`headless.json` records public authenticated status/list/get readback and anonymous denial.
The first run was against an explicitly dirty candidate (listed in the report), not a committed release.
Pinned Ghoul Markdown and all four features match exactly; ability extraction is separately covered by
`tests/app/content.test.ts`. New availability does not claim automation of every trait or action.

`bundle.json` measures actual Convex 1.45.0 CLI `dev --debug-bundle-path` output (push skipped),
summing UTF-8 source and source-map bytes across root function modules, plus per-module gzip source.
Baseline was main `c1b52cb` (V02 integrated at 13:34:44 UTC, bundle at 13:35:19); candidate was
V87 atop `ad8bdbe` at 13:35:21. Thus this initial comparison includes different V02 code and is an
approximate footprint comparison; final integrated measurements follow after rebase.
Generated `statblock.json` is 2,983,469 bytes for 438 stat blocks; the complete selected snapshot
contains 1,151 entries and explicitly excludes 126 source files.

Convex setup during the debug-only comparison rewrote the ignored local `.env.local` target fields
before skipping the push. Those were restored immediately from each checkout's own persisted
local metadata (main 3212/3213, V87 3260/3261); no functions or data were pushed by those commands.
Further bundle measurements use only the isolated worktree.
