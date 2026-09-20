# V68 evidence

Headless proof of the campaign home operations on the isolated CT114 environment
`campaign-home` (source `slice/V68` at `136f7e2`, backend `http://backend:3210` inside the
Compose network, run `v68-mu9934tu`, 12832 ms, started 2026-09-20T03:22:18.546Z).

- `headless.json` — the `scripts/v68-headless.ts` report: 8 steps passed, 0 failed, with
  the read-back evidence per step (ids and names only; no tokens or credentials).
- `headless.log` — the step log; `headless.exit` — the recorded exit status (`exit 0`).
- The full `pnpm check` on the same environment passed (lint, 284 engine tests, 423 app and scripts
  tests, 278-file link check, vendor pins, content, supporting, foes, build); the log stayed on the
  environment's artifacts volume (`/artifacts/v68/check.log`, `check.exit` = `exit 0`).

Accounts are disposable (`<run>-<role>@headless.invalid`) and were signed out at the end.
