# V87 corrected-candidate verification — 2026-09-20

Job `test-V87-104f4b0-1`, Chords message **830**, submitted by FOES1
`7fa5ae52-8819-4a86-8309-78d59a6b93a1` to TESTER. It superseded the blocked
[`4d8c127` attempt](tester-job-4d8c127.md). The frozen source was
`104f4b087c58a6c1451d66c57f6e0eb1a101dba3` in the initially clean
`.worktrees/foes-seeding` worktree. Its only change from the blocked source replaced two invalid
test/runner command IDs with `crypto.randomUUID()`; runtime code was unchanged.

Result: **passed**. Pure gates ran on local Presidium. The live proof used only the worktree's
retained anonymous Convex development target at `http://127.0.0.1:3260` with HTTP actions on 3261.
Cloud credentials were explicitly unset; no shared app, CT114 environment, frontend or browser ran.

## Results

```text
focused V87 suite
PASS — 3 files, 30 tests, 10.97 s; exit 0

pnpm check
PASS — exit 0
engine: 35 files, 352 tests
app/scripts: 64 files, 528 tests
links and both pinned vendor submodules: pass
content: 1,151 entries at Compendium fb83a789da8f
supporting inventory, 438-stat-block foe inventory and V72 compiled report: pass
production build and web budget: pass

setup:local
PASS — existing auth secret preserved; local origins configured; no reset

content:seed
PASS — 1,151 entries, revision fb83a789da8f; exit 0

SALIENT_V87_TARGET=http://127.0.0.1:3260 node scripts/v87-headless.ts
PASS — 3.978 s; exit 0
```

The live run `7dc9ef92-9699-4265-b33a-b97cc114356f` read back the exact manifest and all 438
stat-block definitions. Its first `foes:definitions` call completed in **162 ms**. It proved the
five repaired ability headings through persisted sheets, Xorannox parent naming without changing
source snapshots, exact Ghoul text/features, compiled Razor Claws damage, undo/redo and anonymous
denial. The real roll was 5 + 8 + 2, tier 2, four damage; the Goblin Warrior ended at 11 Stamina
after redo.

Immediately after backend readiness the host had 12,729 MiB available memory and zero current
memory PSI. The record names the backend process and ports, but does not claim process RSS or a
Convex isolate-heap metric because neither was captured. The backend was stopped after the proof;
ports 3260 and 3261 are free. Retained local data was not reset.

Artifacts are in
`/srv/presidium/projects/salient/test-artifacts/V87-104f4b0-20260920T1504Z`. The credential-marker
scan is empty. `scripts/v87-headless.ts` ignores the supplied external report environment variable
and writes `docs/build/evidence/V87/headless.json`; TESTER copied that output and its diff into the
artifact directory and left the candidate worktree visibly dirty at that one generated report.
Application source remains the submitted commit. No generated output was silently discarded.

TESTER returned the passing result directly to FOES1 in Chords message **856** using stable key
`test-V87-104f4b0-1-passed-return`. Chords reported `wake.status: accepted`
(`turn_request_accepted`). This records delivery; it does not claim that FOES1 has completed its
review or integration work.
