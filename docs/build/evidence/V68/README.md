# V68 evidence

Headless proof and full check of the campaign home on the isolated CT114 environment
`campaign-home` (source `slice/V68` at `ed83dff`, backend `http://backend:3210` inside the Compose
network; the first round at `136f7e2` had the same results before the review-fix rerun).

- `headless.json` — the `scripts/v68-headless.ts` report for run `v68-mu99p51j`
  (2026-09-20T03:39:25.256Z, 13283 ms): 8 steps passed, 0 failed, with the
  read-back evidence per step (ids and names only; no tokens or credentials).
- `headless.log`, `headless.exit` — the step log and recorded exit status (`exit 0`).
- `check.log`, `check.exit` — the full `pnpm check` output on the same environment (colour codes
  stripped): lint, 284 engine tests, 425 app and scripts tests including
  `tests/app/campaign-home.test.ts` (6), 279-file link check, vendor pins, content, supporting and
  foes checks, production build; `exit 0`.

Accounts are disposable (`<run>-<role>@headless.invalid`) and were signed out at the end.
- `main-headless.json` — the same proof run against the shared CT114 main app after the merge
  (source `3ca24e8`): 8 steps passed, disposable accounts and campaign only.
