# V88 seeded-inventory real headless proof — 2026-09-20

Job `test-V88-21ec7ca-13-seeded-headless`, Chords message **972**, submitted by ENGINE
`2b1ba081-4040-4665-9ea2-22364db707f4` and copied to ENGINE2
`3498baf0-e8d9-442b-a704-f24f7e595b30`. It superseded blocked job 11 before any setup.
The frozen application, runner and helper source was
`21ec7cadcdc4a7abe04d5116cdad4d3bcd6f8b3c` in `.worktrees/engine-potency-seeded`.

Result: **passed**. TESTER used a job-owned, non-production anonymous Convex deployment at
`http://127.0.0.1:3210`, HTTP actions on 3211 and frontend identity
`http://127.0.0.1:5180`. Functions were pushed from the exact candidate worktree, auth was configured
without reset, and the committed 1,151-entry V87 content snapshot at Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810` was seeded. No main/cloud target, frontend server or
browser ran.

```text
scripts/v88-seeded-dice-import.mjs: PASS — helper 4ce92ee7-e4c6-46f5-bc7b-6c9f8e253923
scripts/v88-headless.ts: PASS — run 1691dca4-4449-4577-88a6-1a236a662caa
91 readback groups; 247,618 ms; stage complete
10 bounded dice-position requests; 10 successful preservation responses
```

The original 25 V88 readback groups ran first with ordinary unpositioned randomness. Four public
foe/action availability records then established Bola Knock, Eye Flash, Power Chord and Razor Claws.
The added cases proved applied and resisted results, same-dice correction transitions, source-linked
automatic saves, history/manual-off behavior, and separate tier-two no-condition uses for Power Chord
and Razor Claws. Publicly saved/evaluated heroes and `foes.add` parents were used; no outcome, event,
condition, character or foe record was imported.

The helper accepted exactly the ten disclosed requests for the disposable campaign. Every response
reported `ok: true`; the fresh isolated database contained zero unrelated dice rows, so each complete
snapshot preservation check reported `preservedRows: 0`. The helper exited cleanly via the runner's
done marker. The runner signed out its sessions in `finally`; disposable accounts, campaign and proof
data remain in the retained 26 MB local database.

The job-owned backend was stopped after the proof. Ports 3210, 3211 and 5180 are free, no helper or
runner process remains, and the candidate is unchanged apart from its pre-existing ignored
`node_modules` symlink. Artifacts are in
`/srv/presidium/projects/salient/test-artifacts/V88-21ec7ca-seeded-headless-20260920T164300Z`.
The 39 MB readback JSON has SHA-256
`94b24e3555e4100759d6b0ac64d409ee15fdae22388d01dcc7f5129e25849025`.
