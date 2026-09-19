# V52 evidence

Candidate `0987595628c548dea2a5e14d014ce2a65bb8ed17` on `slice/V52`, exercised in CT114's isolated
`characters` environment. **The slice is not verified.** `pnpm check` passes and a focused four-spec
run passes; the whole-suite run was **aborted on a backend OOM kill** and proves nothing either way.
This file records what was run, what failed, and what was lost.

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
`wizard` and `rule-popup` and failed inside `table-audit` on a foe health-display assertion. **The
cause is unknown** — an earlier draft of this file called it "unrelated to registration", which was
an assumption, not a finding. The integration lead read it from the job container before removal and
holds the excerpt; a copy is retained here as
[`attempt1-root-observation.md`](attempt1-root-observation.md). The loss was caused by stopping the
local wrapper while believing the remote job was still in `pnpm check`: `presidium-dev` removes a
job container on exit, so the container's stdout went with it.

Its partial sign-up trace survives as
[`focused-attempt1-partial-signup-exchanges.json`](focused-attempt1-partial-signup-exchanges.json):
**4 rows**, all status 200, all observed and claimed, 3 gaps spanning **11820–11860 ms**. These are
attempt 1's rows and are not part of attempt 2's counts.

**Attempt 2 passed: 4 passed in 6.2m**, [`focused-four-specs.log`](focused-four-specs.log), with
[`focused-attempt2-signup-exchanges.json`](focused-attempt2-signup-exchanges.json). Computed over
every row rather than sampled: **10 rows**, all status 200, 10 of 10 observed, 10 of 10 claimed by
the call that made them, and 9 gaps spanning **11812–70074 ms**. All exceed the 11500 ms quiet
period; the large values are ordinary spec boundaries where no wait was needed, recorded with
`reason: none`. An earlier draft quoted "11812–11837 ms", which was read off the `quiet-interval`
rows alone and silently omitted the `none` rows — the range above is computed from all of them.

**No row is an unclaimed observed response.** That is a narrower statement than "no other requests
were made", which this record cannot support: it only sees responses on pages the helper watched.

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
started. It worked: 10365 records.

Separately, the integration lead recovered a **partial historical** window for the focused attempt 2
run — 1106 records covering 22:11:15–22:12:28 — from the configured backend after the fact. That is
a retrospective partial recovery of one pass-run window, not a live capture of the focused attempts,
and the two must not be conflated.

## What this thread did not do

- No product rate limit was changed, relaxed or disabled; no address spoofed; no counter cleared; no
  data reset; no refusal retried.
- No change to `main`, no shared-`main` runtime update and no hosted or external publication. The
  isolated `characters` environment **was** synced and replaced with `up --replace`, which is what
  the verification required; an earlier draft said "no deployment", which was wrong.
- No application code differs from the V46 base: `git diff` over `convex shared web src scripts
  public runtime` is empty.

## Full suite — ABORTED on a backend OOM kill. Not a result, and not a pass.

`presidium-dev --env characters run browser -- pnpm exec playwright test --workers=1`, started
2026-09-19T22:14:24Z, **exited 143 at position 48 of 56 when the integration lead stopped it**,
because by then the backend it was testing no longer existed. No end stamp was written.

**The backend was OOM-killed.** The lead's snapshot (`v52-full-oom-state-2243.txt` in
`review-reports-20260919/`) records `State.OOMKilled=true`, cgroup `memory.events` `oom 2` /
`oom_kill 1` against a `memory.max` of 3 GiB, no Convex backend process, and connection refused on
localhost:3210. **Docker still reported the container healthy**, which is a stale marker rather than
a live check — an earlier draft of this file repeated that "healthy, up 40 minutes" reading as if it
meant the service was up. It did not, and the exact OOM instant was not retained.

**Seven cases failed, not two.** An earlier draft said two; that was read from a mid-run poll rather
than the finished log. From the retained stdout, in order:

| # | Spec |
| --- | --- |
| 1 | `v32-progression.spec.ts:29` |
| 2 | `v34-core-content.spec.ts:90` |
| 3 | `v37-supporting-choices.spec.ts:11` |
| 4 | `v37-supporting-choices.spec.ts:175` |
| 5 | `v38-library-navigation.spec.ts:5` |
| 6 | `v40-unsaved-wizard.spec.ts:8` |
| 7 | `v42-primary-choice.spec.ts:8` |

They are consecutive and they begin at the collapse, which is what a dead backend looks like from
the browser: `v32` reports `fetch failed` from the CLI query, and `v34` shows
`alert: Unable to sign in. Please try again.` — `web/router.tsx`'s fallback when the auth error
carries no message. **None of them is the `Too many requests. Please try again later.` body** seen
in V43, V45 and V46, so none is the rate-limit refusal this slice addresses.

### The backend capture, with its timestamp semantics stated

10365 records, retained by the lead as `v52-full-opus-backend.jsonl` with its `.err`.

**`executionTimestamp` is when the function executed, and the stream is not ordered by it.** An
earlier draft quoted "last 22:28:45" alongside a count for 22:29 and was internally contradictory
for exactly that reason: 22:28:45.347 is the last record *in file order*, not the latest execution.
Computed across all rows:

- earliest `executionTimestamp` **22:12:11.928** — before the tail was attached at 22:14:21, so the
  capture includes backfill;
- latest `executionTimestamp` **22:29:23.178**, which matches the lead's independent finding that
  backend logs stop around 22:29:23.

The tail then retried six times and gave up with `Failed to fetch logs`. So three independent
clients — the Playwright CLI helper, the browser's auth call, and this capture — lost the backend in
the same window.

### This capture was part of the problem

The lead found several CLI log processes occupying the backend container's cgroup, including this
thread's logger. After terminating three logger leaves at 22:43:16, cgroup usage fell from about
**772.5 MB to 305.7 MB**. Against a 3 GiB limit that is material observer overhead and it is not the
sole cause, but a diagnostic capture that contributes to the failure it is capturing is a real
defect in how this was set up, and duplicate captures were running because two threads instrumented
the same container.

Raw bundle: `v52-full-aborted-0987595.tar.gz`, SHA-256
`acca6f4430ad6660ed51ebf1e754a1d155bcafd3807331b4d52c3171d63fe0b9`, with full stdout
`v52-full-0987595.log`, all under `review-reports-20260919/`.

### What the aborted run does and does not support

Positions 1–47 ran before the collapse, and within them `table-audit` at 22 and `v21-campaign` at 27
both passed — the two positions where V46 failed them on registration. The rate-limit refusal was
not reproduced in any position that ran against a live backend.

That is **not** evidence that pacing is why. Those specs also pass unpaced in isolation, the run
never finished, and eight positions never ran at all. **No PASS is claimed for this slice.**

## Process failures in this sequence, recorded rather than smoothed over

1. **Stages were advanced on this thread's own status rather than on the inbox.** Handoffs 481, 484,
   486 and 490 changed ownership and prohibited further browser runs; the full suite was started
   before they were read. Chords must be checked at every remote-job boundary, not at convenient
   ones.
2. **A running job was misidentified and its evidence destroyed.** Attempt 1 was reported as "not
   yet started" and then as an interruption, when it was running and had genuinely failed.
3. **An auxiliary capture was not preflighted in its real container.** The `convex logs` child was
   assumed to work in the browser container; one exec would have shown it could not.
4. **The capture was then added without checking who else was already capturing, or what it cost.**
   Two threads instrumented the same container, and the resident memory of those log processes was
   a measurable fraction of the limit the backend was killed against. A diagnostic must be budgeted
   against the thing it is observing.
5. **Results were reported from partial views.** "Two failures" came from a mid-run poll and the
   real number is seven; "healthy, up 40 minutes" came from a Docker marker that was stale while
   the process behind it was gone; a log "last timestamp" was quoted from file order while the same
   paragraph counted a later minute. Each was avoidable by reading the finished artifact instead of
   the convenient one.

These are the same lessons now recorded in `docs/agent-orchestration.md` (main `cf7c24a`).
