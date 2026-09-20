# V63 correction prerequisite verification — 2026-09-20

**Fresh post-rebase full check and live CLI proof pass on `47e69c6`. Browser coverage is deferred under the moratorium.**
No merge or shared-runtime update is claimed. All eleven V26 compiler checks remain pending.

## Tested source and target

Candidate `a843c1a7472c7e6c8638214473f08f35eb1cff42`, based on main `5956331`.
[Actual source metadata](v63-tested-source.json) records the clean checkout and vendor pins;
[tested file hashes](v63-tested-files.sha256) bind application, test and harness bytes.
All workloads ran on CT114, named local-anonymous `engine-corrections`, at
`https://salient-engine-corrections-dev-bd0641caff1f.tail41404c.ts.net`.
Content seed: 483 entries, Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
No shared, character or hosted data/credentials were used. Services are stopped with data retained.

## Check and real CLI evidence

- [Before repair](red-output.txt): two targeted parity cases fail; the passive read refuses a
  correction/manual window which the authoritative mutation permits. [After repair](green-output.txt):
  the same two cases pass, without changing expected behavior.
- [Full check](v63-check-output.txt), [exit 0](v63-check-exit.txt): 284 engine + 409 app/scripts
  tests; lint, formatting, TypeScript, links, pins, content/inventory/foe checks and production build pass.
- [Live CLI readback](v63-headless-readback.json), [exit 0](v63-headless-exit.txt): real BetterAuth
  sessions; public API campaign/hero/session setup; gameplay through `scripts/app.ts command`;
  public query readback of persisted results, roster and history. No browser or mock setup.
  Tokens stay in memory/child environment and are not recorded. One disclosed deterministic
  diceStates import uses the existing isolated backend; no gameplay rows are fabricated.
- Invocation: `SALIENT_V63_HEADLESS=1 SALIENT_V26_RUNTIME_URL=<named HTTPS URL> node scripts/v63-headless.ts`
  in the `presidium-dev --env engine-corrections run build` container, after starting the
  backend-only `tests/browser/v26-dice-import.mjs` helper in that same environment.

| CLI state | Goblin Stamina | Observed behavior |
| --- | --- | --- |
| Original Slam | 7 | Dice 7+7; tier 2; 8 damage; player and Director can correct. |
| First player bane | 7 | Same dice; total 14; 8 damage; both can still correct. |
| Second player bane | 10 | Same dice; tier 1; 5 damage; both can still correct. |
| Undo / redo | 7 / 10 | Separate correction units restored; no reroll. |
| Manual disposition | 10 | Director can dispose after corrections; correction closes. |
| Rewind disposition | 10 | Correction and manual disposition become available again. |
| Director correction | 7 | Player window closes; player attempt rejected without state change. |
| Unrelated turn end | 7 | Both windows close; Director attempt rejected without state change. |

Pinned arithmetic and policy review: [independent rebase review](../../../reviews/V26-corrections-rebase-review.md).
Brutal Slam's pushes remain manual; this is not calculated push/compiler evidence.

## Browser failure and incremental coverage

[Browser output](v63-browser-output.txt), [exit 1](v63-browser-exit.txt): the unchanged ten-ability
journey stopped at fixture `v21-fixtures.ts:86` while looking for Add foe. The Director campaign
page displayed “Function execution timed out (maximum duration: 1s) Called by client”.
See the [page snapshot](v63-browser/v26-baseline-V26-real-app--5fe46-n-abilities-on-proper-turns/error-context.md)
and [Director screenshot](v63-browser/v26-baseline-V26-real-app--5fe46-n-abilities-on-proper-turns/test-failed-1.png).
No ability case ran. No timeout, assertion or ability implementation was patched around this failure.
The private trace remains on CT114 and in `/tmp/v63-browser-failed-trace.zip`; it is excluded from
Git because a browser trace can retain authentication material.

The CLI proves persisted correction behavior and permissions, including manual disposition on a
corrected card. The planned browser journey adds rendered control availability, repeated clicks,
source/log screenshots, proper-turn ten-ability resolution and reload persistence. This failed
setup supplies none of those fresh acceptance claims. Historical
[2026-09-16 evidence](../corrections-2026-09-16/README.md) remains historical, not a current pass.
Fable received blocker message 587; runtime window released to V65 in message 588.

## Paused verification and failure attribution

User paused browser/testing after this run and then authorized continued non-test work.
Read-only logs from the stopped backend identify `characters:reviews` at
`2026-09-20T01:50:02.754170801Z` as exceeding one second. `table:roster` logged
873.094232 ms at `01:50:02.771487032Z`; see the
[minimal backend excerpt](backend-timeout-excerpt.txt). This identifies the failed query,
not its root cause. Fable noted prior intermittent infrastructure timeouts and proposed one
unchanged serialized rerun; that proposal is held while the user's pause remains in force.
No test, browser, service or deployment was started to collect these logs.

## Current handoff after the browser moratorium

Rebased onto main `2f5544f`; the source artifacts above continue to identify their exact original
tested candidate `a843c1a`, not an unperformed post-rebase run. Browser execution is deferred by
[the moratorium](../../../README.md#browser-testing-moratorium--2026-09-20); its absence is no
longer an acceptance blocker. The historical failed run is retained for diagnosis, not acceptance.
Would-be visible scenarios are in [the backlog](../../../browser-coverage-backlog.md).
Fable requested refreshed headless/full-check verification and final review. This thread's direct
user testing pause remains in effect until clarified; no test or service was started during the
rebase. Do not mistake that separate pause for a browser acceptance requirement.

## Resumed headless verification — 2026-09-20

The user explicitly resumed ordinary development and all non-browser verification. Browser testing
remains paused until further notice. On clean rebased candidate `47e69c6753c7c0f7eba22d361a1a3598f26f0155`:

- [Fresh full check](v63-rebased-check-output.txt), [exit 0](v63-rebased-check-exit.txt):
  **705 tests** (284 engine, 421 app/scripts), lint/format/types, links/pins/content checks and build.
- [Fresh authenticated CLI readback](v63-rebased-headless-readback.json),
  [exit 0](v63-rebased-headless-exit.txt): complete, 12 records, same correction/permission lifecycle
  described above. Accepted dice retained; one disclosed dice fixture import. No browser setup.
- [Actual tested source](v63-rebased-source.json) and [file hashes](v63-rebased-files.sha256)
  distinguish this run from the earlier `a843c1a` evidence. Source base is main `2f5544f`.
- Full check and CLI ran serially on named CT114 `engine-corrections`; jobs/helper exited and
  backend/web stopped with data retained. Shared, hosted and character runtimes were untouched.

The historical browser failure and prior acceptance language above remain diagnostic history.
They do not block this headless acceptance and no browser run was repeated.

Independent [final implementation and pinned-source rules review](../../../reviews/V63-headless-final-review.md) both PASS. Final history cleanup changes commit metadata and documentation only; reviewed application file hashes remain unchanged. Committed on branch only; Fable owns main/runtime integration.
