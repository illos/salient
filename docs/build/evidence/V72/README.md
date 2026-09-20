# V72 compiled-effects acceptance evidence

## Source, runner and target

Candidate branch `slice/V72-live-compiled-effects`, worktree `.worktrees/engine-live`, based on
main `e5c1cd84bb5f08a2c1ee51279467ca4e692c6e0e` plus uncommitted V72 changes. The run metadata
correctly says dirty; it does not claim a clean commit. Compendium remains
`fb83a789da8f0327a389c277a0c790b1648d5810`.

The public runner and application target were both CT114's isolated anonymous `engine-live`:
`https://salient-engine-live-dev-fcf42d994212.tail41404c.ts.net`, Compose
`salient-engine-live-dev-31a5f427abce`, internal backend `http://backend:3210`.
`presidium-dev --env engine-live up` synced the candidate; backend reported ready at 04:04:22 UTC.
Fresh isolated source content was loaded with the existing internal content reseed (483 entries).
No shared-main data was copied, reset or changed. The seed was content only, not gameplay rows.

## Actual public proof

[Readback](v72-headless-readback.json), [output](v72-headless-output.txt), [exit status](v72-headless-exit.txt)
and the compact derived [case summary](case-summary.json) retain run
`c89b4f0f-859c-46b4-b9ec-d2072e0e8816`: started `2026-09-20T04:06:59.404Z`,
167.278 seconds, 46 records, stage complete, `passed: true`, exit 0. All 18 embedded source-byte
hashes match the candidate. BetterAuth signup and all campaign/hero/foe/session/turn setup used
public APIs; gameplay used `scripts/app.ts` registered commands. Generated API references typecheck
the runner's argument contracts. Numeric expectations come from the pinned V26 designs, not a call
to the resolver being tested. Both Director and player reads are retained.

| Case | Observed numeric result or boundary |
| --- | --- |
| BS1/BS2/BS3 | Damage 5/8/15, Goblin 10/7/0 with Slain at zero; push subtotals 2/3/5. No final allowance while coverage is missing. Lethal damage retains following push/manual scope. |
| BS6 | Restrained target retains damage 8/subtotal 3 and named unevaluated condition consequence. No automatic movement. |
| BS7 | Original 7+7 retained; one bane damage 8/subtotal 3; two banes damage 5/subtotal 2. Health 7/10, exact saved effects restored by undo/redo. Stale occurrence refused. |
| BS8 | Director disposition records only completion; wrong user/target, duplicate mark, correction after disposition and after unrelated turn end refused. Rewind/redo restores the exact disposition/effect record. |
| SC1–SC4 | Constant damage 3/4/5; temporary Stamina 3 absorbs three of tier-2 damage 4, leaving hero at 29. No automatic Ferocity gain. Selected ability alone is public. |
| BP2/BP4/BP5 | Damage 6, hero 24, Malice 2→0; tier-specific bleeding remainder remains manual. Correction changes occurrence/remainder without another payment; stale mark refused. Rewind restores original; disposition changes no condition/save/health/resource. Malice 1 blocks before dice/action/payment. |
| MF3/RF3 | Independent roll/damage characteristic choices retained; damage 13/8. |
| PP3/OW2/TR1 | Unchanged compatibility gives damage 15/7/(17,6,9), preserves manual text and existing costs. OW/TR unaffordability blocks. No compiled push or selective loss of Effect sequencing. |
| LF1 | Recorded manual ability; no rolled result or state change. |
| VF2 | Magic/Fire contributions retained: damage 9, Goblin 6, printed push subtotal 3 with size bonus 0 and named missing coverage. |

BS4/BS5 complete same-size/stability/missing-size comparisons and immunity variants remain pure
fixtures, as designed. Meteoric Introduction, Ray, Ghoul Razor Claws and Worg Bite remain
compile-only; no grants or loading paths were manufactured. Spinecleaver remains an unsupported
minion comparison. No browser testing ran; visual scenarios are in the
[browser backlog](../../browser-coverage-backlog.md).

## Deterministic dice and preflight

The isolated helper imported only dice state for this disposable campaign while retaining every
other dice row and its identity/counter. Each bounded read/import/read verifies unrelated rows
are unchanged. Seventeen requested inputs entered the normal accepted-dice path. No fabricated
ability result, event, character, foe or other gameplay row was imported. Engine-live was exclusive
to this proof for dice workloads. Helper and runner both exited 0; sign-outs completed. The isolated
environment is stopped with proof data retained.

The first preflight failed before signup or gameplay because the backend container did not mount
`/runtime-source.json`, so no helper ready file existed. [Output](v72-preflight-output.txt) and
[exit 1](v72-preflight-exit.txt) are retained. The exact nonsecret environment source metadata at
`/srv/dev/salient/engine-live/state/source.json` was copied into that existing backend container at
`/runtime-source.json`; the helper's checkout/identity/URL guards were preserved. Then helper readiness
was checked before starting the successful run. Reproducible commands, from the engine-live worktree:

```sh
presidium-ssh dev-runtime 'docker cp /srv/dev/salient/engine-live/state/source.json salient-engine-live-dev-31a5f427abce-backend-1:/runtime-source.json'
presidium-ssh dev-runtime 'docker exec -w /app -e SALIENT_V72_HEADLESS=1 -e SALIENT_V72_RUNTIME_URL=https://salient-engine-live-dev-fcf42d994212.tail41404c.ts.net salient-engine-live-dev-31a5f427abce-backend-1 node scripts/v72-dice-import.mjs'
# In another command while the helper is ready:
presidium-dev --env engine-live run build -- env SALIENT_V72_HEADLESS=1 node scripts/v72-headless.ts
```

The helper must run inside the existing backend, not `presidium-dev run backend`. Tokens/passwords
stay in memory/child environments and are absent from retained evidence. Dice seed transport artifacts
remain isolated runtime files, not repository evidence.

## Local verification and review

[Full check output](checks/local-check-output.txt), [exit 0](checks/local-check-exit.txt) and
[source metadata](checks/local-check-source.json) record local Node 24.18.0/pnpm 11.5.3:
284 engine tests plus 486 app/script tests, lint/types, links, pinned source/content checks,
report freshness and production build all passed. No external app was targeted by local checks;
persisted tests used convex-test. The later identical-clause storage fixture passed in the
[eight-case focused suite](checks/occurrence-check-output.txt), [exit 0](checks/occurrence-check-exit.txt),
with no application-source changes. This fixture proves identity/isolation/ambiguity behavior;
it does not claim a new duplicated-clause source envelope became live eligible.

The initial full check found missing NodeNext import extensions; the second found closeout still
reading legacy clauses instead of compiled occurrences. Both failures are retained under `checks/`.
The fixes preserve closeout optional continuations and archive refusal, verified by the updated
existing lifecycle test. Headless React rendering covers subtotal versus final allowance and
occurrence controls without a browser.

The [JSON](support.json) and [Markdown](support.md) support report covers 1,264 discovered
entries. It distinguishes six reachable compiled entries from four structurally supported but
unavailable entries, while kit/complex/manual paths remain separate. [Two actual generations](checks/report-reproducibility.txt)
produced identical JSON and Markdown bytes, matching the retained candidate artifacts (not yet a
commit at execution time). `pnpm check` now checks this report against current source and availability.
[Independent implementation review](../../reviews/V72-implementation-review.md) and
[independent pinned-source rules review](../../reviews/V72-rules-review.md) passed. The latter
explicitly notes that BS6 uses supplied roll modifiers and manual condition coverage; automatic
restrained edges or movement prohibition are not implemented by V72.


## Commit identity and handoff

The tested application bytes were committed as `ed564b35eb892c7a139244761e9db3cf4cc17063`
on `slice/V72-live-compiled-effects`. Execution-time metadata remains dirty base `e5c1cd8`
because no clean-commit run is claimed. This is a branch acceptance handoff, not main integration.
