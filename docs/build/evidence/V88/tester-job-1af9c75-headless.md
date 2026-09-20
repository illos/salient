# V88 real headless verification — 2026-09-20

Job `test-V88-1af9c75-7-headless`, Chords message **915**, submitted by ENGINE
`2b1ba081-4040-4665-9ea2-22364db707f4` and copied to ENGINE2
`3498baf0-e8d9-442b-a704-f24f7e595b30`. The frozen application and runner source was
`1af9c7509400d493d690851e4d3e5b0f6ecad30a` in `.worktrees/engine-potency`.

Result: **passed**. TESTER used a job-owned, non-production anonymous Convex deployment at
`http://127.0.0.1:3210`, with HTTP actions on 3211 and frontend identity
`http://127.0.0.1:5180`. The backend functions were pushed from the exact candidate worktree,
local auth origins were configured without a data reset, and the committed 595-entry snapshot at
Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` was seeded. No browser or frontend server ran.

The submitted checkout had the requester-authorized uncommitted reviewer update in
`docs/build/reviews/V88-implementation-review.md` and an untracked shared `node_modules` symlink;
no runtime source differed from the submitted commit. The runner retained SHA-256 hashes of every
runtime and fixture input used by the proof.

## Result

```text
setup:local: PASS; new local auth secret, site URL and trusted origin configured
content:seed: PASS; 595 entries, revision fb83a789da8f
scripts/v88-headless.ts: PASS; run b3a53798-0c7f-4546-ac0f-f24b448e9671
elapsed: 51,284 ms; 25 recorded readback groups; stage complete
```

The retained readbacks cover BP6 resisted, BP7 applied, BP9 same-dice correction, BP8 save and
BP10 post-save refusal/manual-off; Eye resisted/applied and save behavior with the retained manual
toggle and Impressive Horns threshold; and Wode resisted/applied, foe save, history restoration and
manual-off. Director/controller/observer projections, evaluated scores, source occurrences,
registration/work provenance, exact dice, correction behavior and history state are included in the
JSON evidence. The runner signed out its sessions in `finally`; disposable accounts and campaigns
remain in the retained local database.

Artifacts are in
`/srv/presidium/projects/salient/test-artifacts/V88-1af9c75-headless-20260920T155700Z`, including
target identity, setup and seed logs, and the 5.45 MB public readback JSON. The job-owned backend was
stopped after the proof; ports 3210, 3211 and 5180 are free, while the 9.7 MB local database is retained.

During initial target setup the account-linked Convex CLI created an empty cloud project shell named
`engine-potency` before local anonymous mode was selected. No cloud deployment, functions, secrets or
application data were pushed; all verification ran against the recorded loopback target.
