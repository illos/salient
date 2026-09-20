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

## Integrated checkpoint

V87 rebased onto merged V02 (`7e1c088`) as `6836d1d`. All required `pnpm check` stages passed:
352 engine + 526 app/script tests (878 total), lint/types, links, vendor pins, generated content,
supporting inventory, Foes content, compiled support report, production build and web budgets.
The first attempt using a shared dependency symlink encountered an incomplete Vite dependency;
installed this worktree's own pinned lockfile offline before the successful integrated run.

Final integrated root-function footprint (`bundle.json`, `integrated`): 8,236,169 UTF-8 source bytes,
3,401,814 source-map bytes, 1,218,240 per-module gzip source bytes. Baseline is V02 main `c1b52cb`;
this includes the same V02 modules. Both code and maps remain below the documented deployment limit.

`headless.json` now records integrated run `77ea078c-c971-4ad6-ae6b-52323e4927c3`, 4,722 ms:
all 438 Director catalog entries, persisted Ghoul load and exact source snapshot, Razor Claws and
Leap on the shared ability sheet, and the newly reachable compiled Razor Claws path. Actual dice
2+5, +2 gives tier one: 3 damage, Goblin Warrior Stamina 15 → 12; undo 15, redo 12.
The deployed application is clean `6836d1d`; the report identifies the tested proof-script extension
as dirty, subsequently committed without changing its tested bytes. No claim is made that the
Ghoul's Arise/Hunger traits, Leap consequences, or tier-three bleeding are automated.

A separate whole-corpus read audit found 5 blank action texts in the pre-repair parser, out of
1,158 embedded abilities. Spacing repair `029ea29` is committed separately on
`slice/V87-heading-fix` in `/tmp/salient-v87-heading-fix`, awaiting the ongoing independent review
before applying it here. Its new corpus regression passes after repair, fails on the restored
original parser (exit 1), and web typecheck passes. The source text itself is never rewritten.
No final V87 acceptance or merge is claimed while review and repair integration remain pending.

Round 1 follow-up: `029ea29` is now integrated after rebase as `b4f463c`. The branch also contains
parent-name/group/level fixes and strict shared YAML parser coverage. The final candidate must be
verified by TESTER and independently reviewed again. Existing reports above retain their original
source identity and are not final-candidate proof.
