# V88 mandatory V72 real regressions — 2026-09-20

Job `test-V88-1af9c75-8-v72-regressions`, Chords message **916**, submitted by ENGINE
`2b1ba081-4040-4665-9ea2-22364db707f4` and copied to ENGINE2
`3498baf0-e8d9-442b-a704-f24f7e595b30`. The exact candidate
`1af9c7509400d493d690851e4d3e5b0f6ecad30a` was checked out detached and clean in the retained
`.worktrees/engine-live` worktree. Both pinned vendor submodules were initialized and clean.

Result: **passed**. CT114 had 9.9 GiB available memory, zero current memory PSI and low CPU pressure
before setup; only the shared main environment was running. TESTER deployed the exact clean snapshot
to the stopped named `engine-live` environment, preserving its volumes, then seeded only the
committed 595-entry content snapshot at Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
The actual runtime state, `/runtime-source.json`, Compose identity and guarded URL all recorded the
requested worktree and commit. No shared-main update, browser, fabricated gameplay import or data
reset occurred.

## Results

```text
scripts/v72-headless-main.ts: PASS
run a4b587d4-6f2b-4405-81b2-106f1549354f
14 readback groups; 15,588 ms; stage complete

scripts/v72-dice-import.mjs + scripts/v72-headless.ts: PASS
helper 93396887-d4f4-4a78-91de-4d2d132d589d
run ccb99e72-68f3-4405-bb8b-6744b47aa756
46 readback groups; 180,699 ms; stage complete
```

The unchanged main runner proves the real correction and disposition lifecycle, including player and
Director authority, undo/redo, stale/refused operations and an unrelated turn boundary. The adapted
runner proves BS damage/push and history, SC temporary Stamina, BP costs/remainders and correction,
independent MF/RF characteristics, PP/OW/TR compatibility and costs, LF manual handling, and VF
Magic/Fire behavior. The approved V88 adaptation is represented by the passing BP remainder-only
expectations. Both reports retain exact source hashes, accepted dice, public readbacks and state.

The dice helper ran inside the actual backend container. It accepted only bounded dice-state requests,
preserved unrelated rows and exited cleanly after the runner wrote its done marker. Its request/response
bundle is retained with the reports. Application source was transferred once for the exact deployment;
subsequent source identity, seed, execution and evidence operations moved only their required metadata,
content call or artifact.

Artifacts are in
`/srv/presidium/projects/salient/test-artifacts/V88-1af9c75-v72-20260920T160100Z`. Report hashes:

```text
ea4b51e82cc7376d9aad736f3c9a4b0da2a8d32959bb33ec7dcd922e52745633  v72-headless-main-readback.json
9b88177826aa670f056a758e3018cdadf6c924741f09a77378cff97cc7e63a69  v72-headless-readback.json
6311c2b8bc7d02c4557a746a9a5a3e2ad1a26dc5937885acb3e7bdaf37db83a3  v72-dice-93396887.tar.gz
```

TESTER stopped `engine-live` after both proofs. Backend exited 0, web exited 143 from the requested
stop, the final runtime state remains exact clean `1af9c75`, and all volumes and disposable proof data
are retained.
