# Shared-main V63 correction proof

## Runner readiness

The runner is a public HTTP/CLI parity check using real random accepted dice, not a dice-state
fixture or new rules implementation. Live shared-main acceptance is pending until its actual run.

Scoped checks ran in CT114 `engine-corrections` with its backend/web stopped. Only the new runner
and its typecheck include were copied into that existing source snapshot; the runner was **not
executed there**. Its main-target guard remains intact. The previous V63 application source already
passed the full 705-test check; this addition changes only the harness, typecheck include and docs.

```sh
pnpm exec prettier --write scripts/v63-headless-main.ts tsconfig.web.json &&
pnpm exec eslint scripts/v63-headless-main.ts &&
pnpm exec tsc -p tsconfig.web.json
```

- [Check output](v63-main-runner-check-output.txt) and [exit 0](v63-main-runner-check-exit.txt).
- [Actual checked bytes](v63-main-runner-files.sha256) match the retrieved local runner/config.
- [Base source metadata](check-source.json) identifies the isolated snapshot before the two-file
  overlay. This is not a claim that the new runner was already part of that recorded commit.

Fable will integrate the reviewed runner into canonical main and sync that clean source before
execution. The main run uses no browser, database import, reset or seed; disposable public-created
records remain for inspection. Existing browser backlog scenarios remain deferred.

## First main attempt — failed before ability use

The single run on clean deployed `a9a0e5d` exited 1 after 4.016 seconds.
[Readback](initial-main-readback.json), [output](initial-main-output.txt), and
[exit status](initial-main-exit.txt) preserve the original failure. Setup created disposable
records and took the hero turn; the following `abilities:sheet` query omitted the required
`actor.name`. [Backend argument validation](initial-main-backend-error.txt) rejected that request before any ability use.
The artifact’s stage still named the previous turn command, and no setup record had yet been
appended. This was a runner defect, not evidence that main correction behavior failed.

The corrected runner supplies the authored actor name, records setup identities before reading
ability facts, labels that phase, and records the most recent public query/mutation operation.
The original isolated runner and all application mechanics remain unchanged. CT114 was released
to UI after the failed job; no unchanged retry was attempted. Corrected checks/review and a new
coordinated main run remain pending.

The original wrappers erased argument types through `makeFunctionReference` plus `Json`. All public
query/mutation calls now use generated `api` references and `FunctionArgs` wrappers; only return
readbacks remain untyped for evidence retention. A negative missing-name TypeScript check and
positive restored-source check will establish the corrected contract before another live trial.

## Corrected runner contract checks

The corrected runner passed CT114 formatter, scoped ESLint and full web TypeScript checks.
The [exact check script](v63-contract-check.sh) then removed only `actor.name` temporarily:
TypeScript rejected the same defect with **TS2741** ([diagnostic](v63-main-missing-name-type-error.txt),
[exit 2](v63-main-missing-name-type-exit.txt)). It restored the positive source byte-for-byte.
The overall [check output](v63-main-fixed-check-output.txt) and [exit 0](v63-main-fixed-check-exit.txt)
prove both the valid call and the intentional invalid-call rejection. The
[checked source hashes](v63-main-fixed-files.sha256) match the local corrected runner/config.
No additional unit test duplicates this actual generated-API type contract.

This ran in the stopped isolated environment with the same two-file runner/config overlay described
above. It did not execute the main-only runner there. All jobs ended and CT114 was released to V73.
Clean main integration/sync and the corrected main proof remain pending; no retry is claimed.

Independent [corrected readiness review](../../../reviews/V63-main-proof-review.md) is PASS. This
accepts the fixed runner for clean integration, not the still-pending shared-main runtime proof.
