# V72 integration verification

## Rebase scope

V72 commits `ed564b3` and `9e0f96f` rebased onto main
`42211f5a71e378e6b8f0be19ad3aea203d7e1e91` as `67027b0` and `a68a047`.
Conflicts were documentation/configuration only: current V68 completion and V72 rows in STATUS,
both dated V26 evidence appendices, all browser-backlog rows, and both TypeScript include lists
were retained. `convex/schema.ts` is byte-identical to main. The entire `abilitiesFor` function
and following `resolve.ts` suffix are byte-identical to main, preserving V74 ancestry grants.
There are no changes to runtime arithmetic in this integration pass.

The refreshed [support report](../support.md) reflects the current 567-entry catalog: six compiled
abilities and four supported-but-unavailable entries remain unchanged. Compatibility availability
increases from 49 to 53 through Draconian Pride, Dragon Breath, Detonate Sigil and The Wode Defends.
No additional ability becomes compiled. The prior acceptance artifacts remain historical evidence
for run `c89b4f0f`; this directory records the integration checks separately.

## Verification environments

The full check runs locally on Presidium against the engine-live worktree; its unit persistence
tests use convex-test, with no external application target. The runtime proof target is the retained
anonymous CT114 engine-live environment at
`https://salient-engine-live-dev-fcf42d994212.tail41404c.ts.net`, Compose
`salient-engine-live-dev-31a5f427abce`. Shared main is owned by the integration lead.
Browser testing remains paused. Passing runtime results are recorded below.

## Reference refresh

Fable clarified in Chords message 738 that the isolated reference-only refresh and previously
disclosed disposable-campaign dice fixture remain within assignment 5. Shared main gets neither.
[Before](content-before.json) and [after](content-after.json) preserve the catalog metadata:
483 entries, hash `64a08e925f76657409df983b706d2599edcb499457e9b21325d65ee7268c10d8`,
to 567 entries, hash `aaf7c027a421e6059448e019271111877f208b577b756f5e79645c3d497ed26e`.
The pin remains unchanged. The exact existing `content:reseed` mutation was inspected: its only
writes delete/insert `content` and `contentManifest`; it does not reference gameplay tables.
It ran inside the existing engine-live backend. An initial read-only `content:status` CLI call
was refused for lack of app authentication; manifest readback then used the bounded administrative
`data contentManifest --limit 10 --format json` path. No authentication guard was weakened.

## Shared-main runner

`scripts/v72-headless-main.ts` adapts the original V63 14-record linked-correction journey to the
compiled result contract. It adds occurrence revision/disposition/privacy assertions, uses real
accepted dice and independent pinned Brutal Slam arithmetic, and never imports database rows.
The required explicit target selects one of two fixed checkout/URL identity pairs. Rehearsal:

```sh
presidium-dev --env engine-live run build -- env SALIENT_V72_MAIN_HEADLESS=1 SALIENT_V72_TARGET=engine-live node scripts/v72-headless-main.ts
```

After the integration lead updates shared main, the same runner uses the main environment with
`SALIENT_V72_TARGET=main`. The historical V63 runner is retained unchanged as evidence for the old
legacy-clause representation; this occurrence-aware adaptation is the current linked-correction proof.

## Full V72 repeated proof — passed

[Readback](v72-headless-readback.json), [output](v72-headless-output.txt) and
[exit 0](v72-headless-exit.txt) record run `b0f5df59-b1cb-4038-933c-9fc552a1d862`:
46 records, 167.624 seconds, stage complete. All 18 embedded source hashes match the rebased
candidate. The [case comparison](case-comparison.json) confirms the same case order and identical
23 numeric/effect summaries versus run `c89b4f0f`. Catalog/hash, generated record IDs, timestamps
and timing differ; supported damage, movement subtotals, compatibility, costs and correction outcomes
do not. The previous table in [V72 acceptance](../README.md#actual-public-proof) describes these
same cases. Helper and runner exited 0; prior gameplay records remain.

The first linked-proof rehearsal failed before ability use because the new runner used a nonexistent
`characteristics.might` property. Its [readback](v72-linked-first-readback.json),
[output](v72-linked-first-output.txt) and [exit 1](v72-linked-first-exit.txt) remain.
The corrected runner uses `DerivedBaseline` and `M`, with explicit baseline/kit assertions and
sanitized diagnostic stages. Its [scoped TypeScript/lint/format check](checks/runner-final-check.txt)
[passed](checks/runner-final-exit.txt). Application code did not change.

## Occurrence-aware linked-correction proof — passed

[Readback](v72-linked-readback.json), [output](v72-linked-output.txt) and [exit 0](v72-linked-exit.txt)
record run `3796d38b-aae5-458b-b317-bb77aee3a3e0`: 14 records, 19.592 seconds, stage complete,
real accepted dice 4+10. All 17 source hashes match. Initial damage 8 leaves Stamina 7;
one bane retains that outcome; two banes produce damage 5 and Stamina 10. Player undo/redo
restores those exact compiled snapshots, Director correction restores 8/7 and closes player
correction, and manual disposition/rewind/redo retains the same damage and occurrence identity.
Wrong role, wrong target, stale and duplicate occurrence and unrelated-turn boundaries refuse.
Both-role reads preserve privacy and agree with permissions. No dice import or content write occurs
in this runner. This is the current occurrence-aware V63 regression on the rebased contract.

The runtime snapshot is dirty base `a68a047`, explicitly recorded as such; no clean-commit run is
claimed. Local application bytes and source hashes match both runs. The application code was not
changed by the runner fix. Shared-main integration and its actual main-target proof remain owned
by the lead; this evidence establishes the isolated candidate only.


## Runtime closeout

The one-shot runner and dice helper exited 0. The isolated environment was then stopped with
its data retained ([stop output](runtime-stop-output.txt), [exit 0](runtime-stop-exit.txt)).
No shared-main update was performed. The integration lead must update main's backend/web and
run the explicit `main` target of the new runner before claiming shared-runtime acceptance.
V72 adds only optional ability-result schema fields; the existing 567-entry main reference catalog
requires no refresh for this change.


## Independent review and branch handoff

[Independent integration review](../../../reviews/V72-integration-review.md) passed the rebase,
new runner and both actual readbacks. Original V72 implementation/rules reviews remain applicable;
this pass changes no gameplay arithmetic. Full local check passed 843 tests and build, and the
runner-only correction received a passing scoped TypeScript/lint/format check. No browser ran.
