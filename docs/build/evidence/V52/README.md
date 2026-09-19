# V52 evidence

Candidate `0987595628c548dea2a5e14d014ce2a65bb8ed17` on `slice/V52`, verified in CT114's isolated
`characters` environment. **This file records what was run and what was lost. It does not claim the
slice is verified, and it does not claim pacing fixed anything.**

Runtime orchestration passed to the integration lead partway through this sequence
(Chords 486, 493, 499). The full-suite result and its closure are theirs; what follows is only what
this thread ran and holds.

## Preconditions, both confirmed

| Check | Result |
| --- | --- |
| Synced source commit | `0987595628c548dea2a5e14d014ce2a65bb8ed17`, `dirty: false` |
| Installed `better-auth` **on the box** | 1.6.15 |
| Installed `@better-auth/core` **on the box** | 1.6.15 |

The versions matter: the pacing model in [the slice document](../../V52-signup-pacing.md) is derived
from 1.6.15's limiter and would be wrong for 1.6.31, which reworked it. Both resolve from
`/app/node_modules/.pnpm/better-auth@1.6.15_.../node_modules`, read from each `package.json`
directly — `better-auth`'s `exports` map excludes `./package.json`, so `require.resolve` cannot
reach it.

## `pnpm check` — pass

[`pnpm-check.log`](pnpm-check.log). Prettier clean, engine 22 files / 316 tests, app and scripts 47
files / 407 tests, links 275 files, vendor pinned, content 483 entries at `fb83a789da8f`, supporting
289 exact source records, foes 438 stat blocks / 2006 features, build clean.

An earlier candidate failed this gate on `prettier --check` against `tests/browser/signup-pacing.ts`.
That file was written while the runtime was held by another thread and never formatted; the static
link check that had been run does not cover formatting. The fix was one wrapped ternary, verified by
diffing the runtime's `prettier --write` output before applying it locally.

## Focused specs — two attempts, and the first one failed

**Attempt 1 failed and its full output was not preserved.** It ran `table-audit`, `v21-campaign`,
`wizard` and `rule-popup` and failed inside `table-audit` waiting on the Goblin Warrior health
progress bar — a failure unrelated to registration. The integration lead read it from the job
container and holds the excerpt at
`/srv/presidium/projects/salient/review-reports-20260919/v52-root-job-observation.md`; this thread
does not. The loss was caused by stopping the local wrapper while believing the remote job was still
in `pnpm check`: `presidium-dev` removes a job container on exit, so the container's stdout went
with it. What survives here is the partial sign-up trace the run had already written,
[`focused-attempt1-partial-signup-exchanges.json`](focused-attempt1-partial-signup-exchanges.json) —
four registrations, all 200, all spaced 11820–11860 ms apart.

**Attempt 2 passed: 4 passed in 6.2m**, [`focused-four-specs.log`](focused-four-specs.log), with
[`focused-attempt2-signup-exchanges.json`](focused-attempt2-signup-exchanges.json). Ten sign-ups,
every one status 200, every one observed and claimed by the call that made it, **no unsolicited
row**, and every gap from the previous response between 11812 and 11837 ms against the 11500 ms
target. So the pacing does what it says.

**What that does not establish.** All three previously-refused specs — `table-audit` and
`v21-campaign` from V45 and V46, `wizard` from V43 — already passed in isolation on V46 with no
pacing at all. Four specs is also a far lighter load than fifty-six. A focused pass therefore cannot
distinguish this slice's effect from the isolation effect, and it is not offered as evidence that it
can.

## Backend capture — the first attempt produced nothing

The `convex logs --jsonl` child inside the browser job wrote **zero lines**. Its stderr reads
`Could not find deployment with name anonymous-agent!`: the browser container cannot resolve the
deployment, which lives in the backend container. The focused attempts therefore have **no backend
record**, and the empty file should not be read as "nothing happened".

For the full suite the capture was moved to a `docker exec` against the already-running backend
container — the sanctioned existing-container route — and confirmed to emit records before the run
started.

## What this thread did not do

- No product rate limit was changed, relaxed or disabled; no address spoofed; no counter cleared; no
  data reset; no refusal retried.
- No change to `main`, no deployment, nothing published.
- No application code differs from the V46 base: `git diff` over `convex shared web src scripts
  public runtime` is empty.

## Process failures in this sequence, recorded rather than smoothed over

1. **Stages were advanced on this thread's own status rather than on the inbox.** Handoffs 481, 484,
   486 and 490 changed ownership and prohibited further browser runs; the full suite was started
   before they were read. Chords must be checked at every remote-job boundary, not at convenient
   ones.
2. **A running job was misidentified and its evidence destroyed.** Attempt 1 was reported as "not
   yet started" and then as an interruption, when it was running and had genuinely failed.
3. **An auxiliary capture was not preflighted in its real container.** The `convex logs` child was
   assumed to work in the browser container; one exec would have shown it could not.

These are the same lessons now recorded in `docs/agent-orchestration.md` (main `cf7c24a`).
