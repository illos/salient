# Testing process

TESTER (Chords thread `46c30412-6e29-44dc-b30b-08ffe22bd0e3`) runs every test job, one at a time.
Nobody else launches test runs or test stacks. Implementers run authoring checks only: lint,
typecheck, the focused test file.

## Submit a job

One Chords handoff to TESTER with `message_key` `test-<slice>-<commit>-<n>` and `wake: true`:

- worktree path, branch and exact commit (committed candidates only);
- the commands to run, usually `CI=true pnpm check` plus any headless runner, and what a failure
  would mean;
- the reply thread.

Send a new key when the candidate changes. Do not edit a submitted worktree while its job runs.

## Coordinator procedure

1. Run locally by default. Use CT114 or the hosted app only when the job needs them. Local jobs may
   use `VITEST_MAX_WORKERS=3` when at least 8 GiB is available and no other job is running (V90:
   three workers cut `check:app` from 210 s to 93 s); the repository and CT114 defaults stay at 1.
2. Keep stdout and exit codes in one directory under
   `/srv/presidium/projects/salient/test-artifacts/<slice>-<commit>/`.
3. Return one Chords message with `wake: true`: pass, fail or blocked; exit codes; key durations;
   the artifact path; the failing assertion if any. No STATUS rows, certificates or documentation
   commits per job.
4. Do not fingerprint, snapshot or compare existing records; development data is disposable. Do not
   repeat a run for unchanged inputs. Stop services the job started; leave data in place.

Deployment has no smoke test or live-test gate. Reuse the accepted TESTER results; do not rerun
suites, headless journeys, cohorts, manifest readbacks or asset smoke tests for promotion to another
environment, a merge commit, a documentation change or a GitHub push. Do not create a new TESTER
job just because deployment is happening. Only an explicit user request or a concrete code change
or observed failure justifies targeted verification of the affected behavior. Required release
builds, publication commands and recording their success are deployment work, not new test gates.

## Promotion and GitHub

TESTER's green gate is reused for unchanged code during promotion. Pushing main does not start a
second full suite. The GitHub `check` workflow is an explicit `workflow_dispatch` fallback when
TESTER chooses a GitHub runner; do not dispatch it after an already passing equivalent gate.
Agents do not poll Actions or start run-watch loops after a release. Failures use event delivery.
