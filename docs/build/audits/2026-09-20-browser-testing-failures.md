# Browser testing failure audit — 2026-09-20

Status: investigation complete. The user endorsed the recommendations on 2026-09-20 and
confirmed the doctrine: headless tests prove the app at the logical level; browser tests are the
final visual spot check that the UI is not badly broken. The recommendations are registered as
[V66](../V66-browser-test-harness-repair.md), not started. Until V66 lands, all browser testing is
under a site-wide [moratorium](../README.md#browser-testing-moratorium--2026-09-20) and would-be
browser scenarios go to the [browser coverage backlog](../browser-coverage-backlog.md). No code, test, configuration or runtime change was made by this
audit. Written from main `41a8a48`.

Scope: why Playwright browser verification fails so often across threads, and what behavior should
change. Sources: retained evidence under `docs/build/evidence/` (V25 through V62, S03, S04, V59),
the slice work logs, the Chords update history for this project (messages 1–600), the browser test
sources under `tests/browser/`, `convex/auth.ts`, `scripts/app.ts`, `playwright.config.ts`,
`runtime/compose.yaml`, the installed `better-auth` 1.6.15 rate limiter, and a live read-only
inspection of CT114 (`nproc`, `free`, `docker ps`). The user has already mandated that CLI/headless
proof takes precedence; this audit does not reopen that decision.

## Summary

Browser runs are not failing because the app is broken. Across roughly forty recorded failed or
retried runs since 2026-09-15, only five found product defects. The rest fall into three shared
mechanical causes and one behavioral cause:

| Cause | Confirmed incidents | Nature |
| --- | --- | --- |
| A. Convex 1 s function execution limit under CPU contention on CT114 | 11+ runs, plus 8 near-limit warnings (808–979 ms) retained | Infrastructure capacity; the failing functions are ordinary indexed reads |
| B. Better Auth sign-in/sign-up rate limit: 3 requests per 10 s per client IP, one IP for every thread | 5 runs (V43, V43 hosted ×2, V45 ×2) plus the abandoned pilot's V52 | Shared-bucket contention created by our fixtures |
| C. Stale selectors/assertions and fixture hygiene | ~13 runs | Test debt from monolithic journeys that every slice re-touches |
| D. Full-suite reruns under unchanged conditions, per-thread copies of helpers, ad hoc pacing | Every thread | Behavior; the workflow rewards a green artifact, so threads keep re-rolling |

Every one of these was diagnosed correctly at least once by some thread and then rediscovered from
scratch by the next one, because the diagnosis lived in a slice work log, not in the harness.

## A. The 1 s execution limit is a capacity problem, not a code problem

Convex queries and mutations have a hard one-second execution budget. The retained backend logs
name the tripping functions: `targets:drafts`, `foes:catalog`, `characters:submit`,
`campaigns:get`, `encounters:current`, `sessions:list`, `abilities:sheet`, `history:status`,
`table:roster`, `closeout:current`. V59 statically inspected `targets:drafts` and found only indexed
reads. The common signature is `requireUser` → `authComponent.safeGetAuthUser` (a component
sub-call on every authenticated function) plus a handful of indexed reads, which normally take a
few tens of milliseconds. They only approach one second when the backend is starved.

CT114 has 4 CPUs and 12 GiB. Every compose service is capped at 2 CPUs. At the time of this audit
three environments were running (`main`, `foes-library`, `ui`, each backend plus Vite) plus a
`hosted` job. A browser test run adds a Playwright container, and a `pnpm check` adds a build
container. Threads routinely ran a full check, a browser suite and a peer's browser suite at the
same time; the Chords history records load above 36 and 50 on the old host, PSI memory stall of
40–56 %, an OOM exit 137 during V35, and every 1 s timeout coinciding with concurrent work.

The decisive datapoint is the hosted run of 2026-09-20 01:14 UTC (Chords
`astra-hosted-live-progress-20260920`): the same ancestry candidate deployed to Convex Cloud
`different-bat-943` and the `salient-dev` Worker passed all four ancestry journeys, closeout and
table performance, and the 1 s timeout did not recur. V43's hosted publication also passed all 16
cases. The only hosted failures were the sign-in throttle (cause B) and a Foes keypress race.
Message 498 in the Chords history adds, from the pinned backend source, that the 1 s clock excludes
database wait, so the timed-out second is isolate CPU time and queueing, which is exactly what a
2-CPU cap shared by several stacks starves.

Related: on 2026-09-19 22:35 UTC a full-suite backend was OOM-killed (`memory.max` 3 GiB) while
Docker still reported it healthy, because the healthcheck only tests for the `/tmp/backend-ready`
file. Several CLI log followers were sitting in the backend cgroup at the time (772 MB → 306 MB
after terminating them). A stale-healthy backend makes every subsequent browser assertion look like
an app failure.

Evidence that the code is not the variable: V59 reran the failing closeout spec alone on unchanged
main and it passed in 1.3 min with no timeout; V42's Fury journey failed twice, at different
functions, and passed alone later; V45's initial 52-test batch failed four and each passed alone.

Why it hurts browser tests specifically: the table page's React error boundary replaces the whole
page with "This page is unavailable" on the first timed-out subscription. Every later assertion in a
5–10 minute journey then fails, so one 1 s blip costs the whole journey plus a rerun.

## B. The rate limit is ours, and every thread shares one bucket

`better-auth` ships a default special rule: any path starting with `/sign-in` or `/sign-up` is
limited to **3 requests per 10 seconds per client IP**
(`node_modules/better-auth/dist/api/rate-limiter/index.mjs`, `getDefaultSpecialRules`).
`convex/auth.ts` enables rate limiting with database storage and overrides only the two
password-reset paths, so the sign-in default applies everywhere, including CT114 private
environments and the hosted Convex deployment.

The key is the client IP. All browser contexts inside the Playwright container, every `pnpm app`
CLI call from the build/browser containers, and every peer thread's job on CT114 share one egress
address, so **the 3-per-10 s budget is shared across every role, every test and every thread**.

Our fixtures then spend that budget as fast as possible:

- `journey.spec.ts`, `wizard.spec.ts`, `table-audit.spec.ts`, `closeout.spec.ts`,
  `combat.spec.ts`, `campaign-sharing.spec.ts` and `v21-campaign.spec.ts` each register three or
  four fresh accounts through the UI at the start of the test.
- `tests/browser/local-fixtures.ts` `seedLocalHero` makes four credential-based CLI calls in a
  row (`create`, `save`, `submit`, `approve`). `scripts/app.ts` signs in and signs out on every
  invocation when given credentials, so that is four sign-ins in a few seconds, alone at the limit.
- The V65 headless runner in `.worktrees/character-headless` creates director, player and peer
  with three consecutive sign-ups: exactly the limit, with zero headroom for any peer activity.

Recorded consequences: V43 third registration refused; V45 `table-audit` and `v21-campaign`
registrations refused in the same batch; V43 hosted `characters:approve` refused twice until a
temporary 21-second sleep was inserted into a runner-only copy of `local-fixtures.ts` (evidence
`docs/build/evidence/V43/hosted/README.md`, deliberately not committed). The abandoned Opus pilot
independently burned a whole slice (V52 "signup pacing") on the same symptom.

The Astra workflow forbids "rate-limit bypasses merely to make verification pass". That rule is
right for hiding a product failure. It has been read as forbidding the fix for a test-harness
self-collision, which is a different thing.

## C. Monolithic journeys accumulate stale expectations

The 34 spec files contain 52 tests, but the meaningful coverage sits in a dozen 160–340 line
single-test journeys with `test.setTimeout` of 3–10 minutes: `wizard.spec.ts`,
`table-audit.spec.ts`, `v21-log.spec.ts`, `v37-supporting-choices.spec.ts`,
`v32-progression.spec.ts`, `closeout.spec.ts`. Each one walks registration, campaign, wizard,
admission, session, combat and readback in one linear script.

Consequences recorded in the evidence:

- Any UI slice changes labels somewhere along that path, so unrelated journeys break on stale
  selectors: V36, V37 (three), V40 (four specs), V42, S04, V25's manifest count, V32's vendor path.
  About thirteen failed runs were test debt, with the product correct.
- A failure at minute 6 discards minutes 1–5 and costs a full rerun; there is no checkpointing.
- Five near-identical `register()` helpers exist (`journey`, `wizard`, `table-audit`, `closeout`,
  `combat`, `v21-fixtures`, `campaign-sharing`, `rule-popup`, `theme`), so every fix to
  registration timing has to be made in each copy or, in practice, is made ad hoc in one.
- Fixture hygiene defects recurred for days: `foes.spec.ts` overwrote committed evidence PNGs on
  every run until V30 fixed it; shared `test-results/` collided between concurrent runs (A07, V31).
- Base UI `focusableWhenDisabled` controls need `click({ force: true })`; each thread learned it
  separately.

Full-suite duration is the practical ceiling: 22 tests took 11.0 min (S03), 52 tests took 17.3 min
(V45), on one worker by necessity, on a host that cannot afford a second worker.

## D. The behavior that turns three mechanical causes into a "dumpster fire"

1. **Rerun-until-green is the default response.** The record shows unchanged standalone reruns in
   V32, V39, V40, V43, V43 hosted, V45 (four), S04; V45 needed "49 successes after 4 unchanged
   retries". Each rerun costs 2–17 minutes of the only runtime host and often collides with a
   peer's run, causing the next cause-A failure. The Astra workflow already says "do not repeat a
   full suite under the same conditions merely hoping for green", and V59 followed it; most
   threads did not, because the merge gate demands a green full suite and nothing else is accepted.
2. **The full browser suite is a merge gate for every slice**, including content-only and
   engine-only slices whose diff cannot affect most journeys. Reviewers then reran it again.
3. **Diagnoses are not shared.** The rate-limit cause was correctly identified in V43 hosted on
   2026-09-19 and recorded as a 21 s sleep in a README; V45 hit it hours later and treated it as a
   transient; the Opus pilot spent a slice on it; V65 is about to hit it. The 1 s timeout was
   diagnosed on 2026-09-15 (A07) and again in V26, V32, V40, V42, V45, V59, each time from scratch.
4. **Workarounds are kept out of the repo on principle**, so they have to be reinvented: the 21 s
   pacing, per-run `--output` directories, `VITEST_MAX_WORKERS=1`, stopping idle stacks, serial
   "browser windows" negotiated over Chords.
5. **Concurrency is unmanaged.** Named environments removed data collisions but not CPU
   contention; three or four backends now compete on 4 cores, and threads still start browser runs
   without checking whether a peer is running one.
6. **The runtime helper has footguns that produced false failures.** `presidium-dev run` executes
   the previously synced tree, not the edited checkout, so a run after an edit tests stale source
   unless `up --replace` was issued first (one thread "nearly mislabelled a candidate"). A
   `presidium-dev up --help` restarted the shared main environment because trailing arguments are
   swallowed. A job launched without `--env` ran in shared main and exited 1. Each was reported as
   a browser or verification failure before its real cause was found.

## What the browser suite has actually bought

Five product defects were found only in the browser: the V40 conditional `useParams` hook on the
new→saved wizard route, V40 drag-and-drop active inside a disabled fieldset, V33 narrow reflow
(760 px inherited min-width), V41 anchor scroll release, and the V29 aria-hidden toast (found by
review, confirmed in browser). All are rendering, routing or accessibility behavior that a headless
route cannot see. The tables, the history, the evaluator and every persisted operation were never
the thing that failed in a browser run. That matches the user's precedence decision: headless proof
for behavior and persistence, browser for UI behavior only.

## Recommendations

Confirmed requirement from the user: CLI/headless tests take precedence. Everything below is a
proposal; items 1–4 remove the mechanical causes and are cheap; 5–8 change behavior.

1. **Configure the development sign-in rate limit deliberately** in `convex/auth.ts`: a
   `customRules` entry for `/sign-in/email` and `/sign-up/email` that keeps the production default
   and raises the window for the anonymous/development deployments (for example 60 per 10 s when
   `CONVEX_AGENT_MODE=anonymous` or an explicit `SALIENT_DEV_AUTH_LIMITS=1`). Record it in the
   access spec as a development-environment decision, not a bypass. Keep the password-reset limits
   and the V39 test that proves the 429. Until then, no fixture may issue more than three
   sign-in/sign-up requests per 10 s, and threads must not run two auth-creating jobs at once.
2. **Stop signing in per CLI call.** Give `scripts/app.ts` a `session` subcommand that signs in
   once and prints a token, and make every fixture (`local-fixtures.ts`, `acceptance-extension.ts`,
   `journey.spec.ts`, `combat.spec.ts`, the V65 headless client) mint one token per role per run
   and reuse it. `acceptance-extension.ts` already does this for browser-issued tokens; extend the
   same pattern to CLI-issued ones. This removes about ten sign-ins per journey.
3. **One shared browser fixture module.** Collapse the nine `register()` copies and the per-spec
   `cli()` helpers into `tests/browser/fixtures.ts` exporting `registerRoles`, `cli` (token
   reuse, `force` click helper for Base UI disabled controls), and an isolated per-run output
   directory. Commit the known-good workarounds there once; delete them from README prose.
4. **Cap concurrent load on CT114 explicitly.** Two rules: at most one Playwright job and one
   build/check job on the guest at a time, claimed and released through a single Chords key
   (`ct114-heavy-window`), and idle environments stopped (`presidium-dev --env X stop`) when a
   thread pauses. Add `presidium-dev status` plus `docker ps` output to the evidence of any run
   that fails on a 1 s timeout, so contention is recorded rather than guessed. This is the only
   change that addresses cause A short of more CPUs; a 1 s timeout in a run that overlapped a
   peer's job is infrastructure, and reviewers should classify it that way without a rerun.
5. **Make the browser gate proportional to the diff.** Replace "full suite before every merge"
   with: run the specs that cover changed UI paths, plus `journey.spec.ts` as the smoke test, and
   record which specs were selected and why. Content-only, engine-only, docs-only and
   `convex/`-only slices run no browser suite at all; their proof is headless. Reserve the full
   suite for a scheduled integration pass (for example once per day on main, or before a shared
   playable update), run by one owner with the host to itself.
6. **Ban unchanged reruns as evidence.** A rerun is allowed only after the failure is classified
   (product / stale test / contention / rate limit / harness) and recorded with the backend log
   excerpt, and only if the classification says the rerun changes something (contention cleared,
   selector fixed). A green rerun after an unclassified failure is not a pass. This is already the
   Astra workflow text; it needs to be the project rule and reviewers need to enforce it.
7. **Split the monolithic journeys along the persisted boundaries the headless gate already
   defines.** Registration and campaign setup become a fixture that uses the CLI, not the UI, so
   the browser test starts at the screen under test. Wizard, admission, table, closeout and
   progression become separate specs that share fixtures. A journey that fails at minute six is
   then a one-minute rerun, and label changes in the wizard stop breaking closeout tests.
8. **Keep browser tests for what only a browser can see.** Given the headless precedence, retire
   browser assertions that only re-check persisted values already proven by the CLI readback
   (most `expect(await query(...))` lines inside `acceptance-extension.ts` and `table-audit`), and
   keep layout, focus, drag, dialog, theme, error-boundary and route-transition checks. The paired
   comparison the build README asks for should be run once per area, recorded, and then used to
   demote redundant browser regression to the scheduled integration pass in item 5.

9. **Harden the runtime helper against the recorded mistakes**: make `run` refuse to execute
   when the synced `commit` differs from the checkout HEAD unless `--stale-ok` is given; make
   `--env` mandatory for every operation with no default to shared main; reject `--help` after an
   operation; and make the backend healthcheck probe the Convex port rather than a marker file so
   an OOM-killed backend reports unhealthy. Log followers should run outside the backend cgroup.

Two items need the user rather than an implementer:

- Whether item 1 is acceptable as a development-only configuration. Recommendation: yes, with the
  production default untouched and the choice recorded in `docs/accounts-and-access-spec.md`.
- Whether CT114 can get more CPU, or whether the number of simultaneously running environments
  should be capped at two. Recommendation: cap at two and stop idle stacks; measure before buying.

## Open items this audit did not resolve

- V42's full Fury wizard → admission → table journey has never passed as one run on CT114.
- V58's closeout timeout is intermittent and unreproduced in isolation (V59).
- V62 reports an unresolved older wizard journey on hosted.
- The broadcast request for additional failure context received one reply before this audit was
  written, from the engine track: its only failure was cause A (`characters:reviews` timing out
  while a peer's hosted browser job ran on CT114). It independently recommended a shared
  token-reusing auth helper and a single Chords-claimed heavy-job slot, matching items 2 and 4.
