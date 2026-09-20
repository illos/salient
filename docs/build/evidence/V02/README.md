# V02 evidence

Headless proof of minion squads on an isolated local anonymous Convex backend (Presidium, the
permitted peer test environment): the runner and the target are `code/.worktrees/minions` at
`slice/V02` (the commit that adds this directory), backend `http://127.0.0.1:3250` with its own
`.convex/local/default` state, `SITE_URL` `http://127.0.0.1:5190`, content seeded with
`pnpm content:seed` (595 entries at pin `fb83a789da8f`). The shared CT114 `main` app, the main
checkout's local deployment and every peer environment were untouched; `CONVEX_DEPLOY_KEY` was
unset for every command. CT114 was unreachable (`presidium-ssh dev-runtime` timed out) when this
ran, so the local route was used under the environment-selection rule.

- `headless.json` — the `scripts/v02-headless.ts` report for run `v02-mu9n5vkg`
  (2026-09-20T09:56:21.136Z, 10168 ms): 9 steps passed, 0 failed, with the read-back
  evidence per step (ids, names and numbers only; no tokens or credentials).
- `headless.log`, `headless.exit` — the step log and recorded exit status (`exit 0`).

Real server dice: the coordinated attack rolled tiers [2, 2] (Thorn 24,
warrior 11 after it); the Brutal Slam rolled tier 1 for 5 damage
(pool 15, 1 casualties, 0 named through the card). Two earlier runs
of the same script failed on script sequencing only (the casualty answer is its own undo unit and
must be rewound before the attack; the free strike must pick living minions), fixed in the script.

Accounts are disposable (`<run>-<role>@headless.invalid`). Full local checks are in the V02 work log.
