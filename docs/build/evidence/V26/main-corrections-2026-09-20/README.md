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
