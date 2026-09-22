# V66: Browser test harness repair

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App lead |
| Rules review | not required |
| Depends on | S03; the [browser testing failure audit](audits/2026-09-20-browser-testing-failures.md) |
| Unblocks | the end of the [browser testing moratorium](README.md#browser-testing-moratorium--2026-09-20) |
| Status | see `STATUS.md` — registered 2026-09-20, **not started**; do not claim without the user's go |

## Goal

Remove the mechanical causes that made browser verification fail across every thread, so that
when browser testing resumes it is a short visual spot check that runs once, on one shared
fixture layer, without colliding with peers. The slice does not add product features, does not
change game rules, and does not touch the production auth configuration. It must not become a
general infrastructure redesign.

## Spec references

- `docs/build/README.md#programmatic-headless-completion-gate` — headless proof precedes browser
  acceptance; browser coverage is scoped to visual behavior.
- `docs/build/README.md#browser-testing-moratorium--2026-09-20` — the moratorium this slice ends.
- `docs/build/audits/2026-09-20-browser-testing-failures.md#recommendations` — the accepted items
  1 to 4 and 9 that this slice implements.
- `docs/accounts-and-access-spec.md` — records the development-only sign-in limit decision as an
  implementation note when item 1 lands.
- `docs/remote-development.md` — records the CT114 heavy-job slot rule and helper hardening.

## In scope

1. **Development-only sign-in rate limit configuration** in `convex/auth.ts`: a `customRules`
   entry for `/sign-in/email` and `/sign-up/email` that keeps the Better Auth default in
   production and raises it for anonymous/development deployments through an explicit, named
   condition. The password-reset limits and the V39 429 test stay unchanged.
2. **One session per role per run.** A `session` subcommand (or equivalent) in `scripts/app.ts`
   that signs in once and prints a token; every fixture and the V65 headless client reuse tokens
   instead of signing in per call. Sign-out happens once at the end of a run.
3. **One shared browser fixture module** (`tests/browser/fixtures.ts`) replacing the nine copies of
   `register()` and the per-spec `cli()` helpers: role registration through the CLI rather than
   the UI where the screen under test is not the login screen, token reuse, a `force` click helper
   for Base UI disabled controls, and an isolated per-run output directory. Delete the copies.
4. **CT114 heavy-job slot rule** written into `docs/remote-development.md`: one Playwright job and
   one build/check job at a time, claimed and released through one Chords `message_key`
   (`ct114-heavy-window`); idle environments stopped when a thread pauses; `presidium-dev status`
   and `docker ps` attached to any run that fails on a 1 s timeout.
5. **Runtime helper hardening** (item 9 of the audit), coordinated with the infrastructure owner:
   `run` refuses a synced tree whose `commit` differs from HEAD unless overridden; `--env` is
   mandatory with no default to shared main; trailing `--help` after an operation is rejected;
   the backend healthcheck probes the Convex port rather than `/tmp/backend-ready`.
6. Split the monolithic journeys along the headless boundaries only as far as needed for the
   shared fixture module; a full rewrite of every spec is a later pass recorded in the
   [browser coverage backlog](browser-coverage-backlog.md).

## Out of scope

- Any change to product behavior, rules resolution, schema or seeded content.
- Raising Playwright timeouts, adding `retries`, or removing assertions.
- Fixing the V42, V58/V59 or V62 unresolved journeys; those are logged in the backlog and become
  visible again once the harness is stable.
- Adding CPU to CT114 or new environments; the user decides capacity separately.

## Inputs and dependencies

- The audit's evidence and the Chords replies to `browser-test-failure-investigation-request-20260920`.
- An explicitly named CT114 environment for the slice; never shared `main`.
- Access to the infrastructure owner for item 5; if unavailable, record the requested guard
  behavior in the runbook and leave the helper change pending.

## Deliverables

- `convex/auth.ts` development-only rule with a backend test proving production defaults remain.
- `scripts/app.ts` session command and updated fixtures; `tests/browser/fixtures.ts`.
- Runbook and access-spec implementation notes; helper hardening or its recorded request.
- A single full browser run on the private environment with the host to itself, recorded with
  elapsed time, and the paired headless run for the same fixtures.

## Acceptance checks

1. Headless: a script creates three roles, runs `seedLocalHero` and ten CLI operations within
   10 s against the development environment without a 429, and the auth rate-limit table shows one
   sign-in per role. Production-mode configuration test shows the default 3 per 10 s intact.
2. `grep -c "Create account" tests/browser/*.spec.ts` returns zero outside the login/registration
   spec; all specs import the shared fixture module.
3. One full browser suite on an otherwise idle CT114 completes with zero 429s and zero 1 s
   timeouts in the backend log, and its elapsed time is recorded.
4. `presidium-dev run` after an uncommitted edit refuses or warns; `presidium-dev up --help` does
   not restart anything; a backend whose process has died reports unhealthy within its interval.
5. The moratorium section in `README.md` is updated to "lifted" with the commit hash, and the
   backlog entries deferred during the moratorium are triaged into "run now" or "later pass".

## Ability design and playtest evidence

Not applicable.

## Rules research

None.

## Open questions

None recorded. Capacity (CPU or environment cap) is the user's separate decision.

## Work log

- 2026-09-22 clarification: the user states the browser-testing pause was specifically for table
  testing. Focused non-table browser investigations may proceed through TESTER; V112's live
  Firefox authentication probes use that authorization. V66's table harness work remains pending.

- 2026-09-20: registered by the browser-failure investigation thread at the user's direction after
  the audit; not started. The user simultaneously placed all browser testing under a moratorium
  until this slice is implemented.
- 2026-09-20 checkpoint (investigation thread paused by the user). State: audit, V66 registration,
  browser coverage backlog and site-wide moratorium are all on main at `8291277`; broadcast to
  peers as Chords `browser-testing-moratorium-20260920`. No code, test, runtime or environment was
  changed. Resume prompt: when the user says go, claim V66 in a fresh worktree with an explicitly
  named CT114 environment, implement in-scope items 1 to 4 first (they also unblock the V65
  headless run's sign-up limit), then item 5 with the infrastructure owner, then item 6. Two user
  decisions remain open and are not blockers for starting: acceptance of the development-only
  sign-in rate limit as configuration (recommended yes, recorded in the access spec), and CT114
  capacity (recommended: cap running environments at two and stop idle stacks before adding CPU).
  While paused, threads keep verifying headlessly and appending to the backlog.
