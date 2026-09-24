# Testing process

A test coordinator runs every test job. The coordinator is a role, not a fixed thread: the user
assigns it, and the thread holding it announces that on Chords. A coordinator may hand a job's
`pnpm check` gate to a helper thread it names; the coordinator still owns the queue and the reply.
Nobody else launches test runs or test stacks. Implementers run authoring checks only: lint,
typecheck, the focused test file.

## Submit a job

One Chords handoff to the current coordinator with `message_key` `test-<slice>-<commit>-<n>` and
`wake: true`:

- worktree path, branch and exact commit (committed candidates only);
- the commands to run, usually `CI=true pnpm check` plus any headless cohorts, and what a failure
  would mean;
- the reply thread.

Send a new key when the candidate changes. Do not edit or move a submitted worktree or branch while
its job runs.

## Coordinator procedure

1. Run locally by default. Use CT114 or the hosted app only when the job needs them. The Presidium
   host has four cores: run one `pnpm check` gate at a time, with `VITEST_MAX_WORKERS=3` when at
   least 8 GiB is available (V90: three workers cut `check:app` from 210 s to 93 s). Two concurrent
   gates hit the 60 s test timeouts. Light headless cohorts may run beside a gate; heavy ones
   (`summoner`, `beastheart`, the class base journeys) need an idle host to stay inside the runner's
   240 s deadline. The repository and CT114 defaults stay at one worker.
2. Headless cohorts run against a private anonymous backend on 127.0.0.1:3210/3211 from a
   disposable copy of the candidate under `/tmp/<slice>-<commit>`. Exclude `node_modules`, `.git`,
   `.convex`, `.env.local`, `dist` and `vendor/`, give the copy its own
   `CI=true pnpm install --offline --frozen-lockfile`, and set
   `SALIENT_VENDOR_ROOT=/srv/presidium/projects/salient/code/vendor` so it reads the one vendor copy.
   Stop only that copy's processes afterwards, matched by its path or working directory, and delete
   the copy.
3. Keep stdout and exit codes in one directory under
   `/srv/presidium/projects/salient/test-artifacts/<slice>-<commit>/`.
4. Return one Chords message with `wake: true`: pass, fail or blocked; exit codes; key durations;
   the artifact path; the failing assertion if any. When a cohort fails, run it on current main
   before calling it a regression, and say which it is. No STATUS rows, certificates or
   documentation commits per job.
5. Do not fingerprint, snapshot or compare existing records; development data is disposable. Do not
   repeat a run for unchanged inputs. Stop services the job started; leave data in place.

A candidate rebased over new runtime code on main is a new candidate: gate it and run its cohorts at
the rebased tip. Several reviewed candidates on the same main may be stacked into one integration
branch and gated once at its tip; conflicts beyond STATUS rows go back to their owners.

Deployment has no smoke test or live-test gate. Reuse the accepted coordinator results; do not rerun
suites, headless journeys, cohorts, manifest readbacks or asset smoke tests for promotion to another
environment, a merge commit, a documentation change or a GitHub push. Do not create a new test job
just because deployment is happening. Only an explicit user request or a concrete code change or
observed failure justifies targeted verification of the affected behavior. Required release builds,
publication commands and recording their success are deployment work, not new test gates.

## Promotion and GitHub

The coordinator's green gate is reused for unchanged code during promotion. Pushing main does not
start a second full suite. The GitHub `check` workflow is an explicit `workflow_dispatch` fallback
when the coordinator chooses a GitHub runner; do not dispatch it after an already passing equivalent
gate. Agents do not poll Actions or start run-watch loops after a release. Failures use event
delivery.
