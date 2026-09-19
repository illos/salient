# V52 evidence

Candidate `0987595628c548dea2a5e14d014ce2a65bb8ed17` on `slice/V52`, exercised in CT114's isolated
`characters` environment. **The slice is not verified.** `pnpm check` passes and a focused four-spec
run passes; the whole-suite run failed and was **aborted after backend loss**. Full verification is pending.
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
deployment, which lives in the backend container. This collector supplied **no live backend record** for the focused attempts. The empty file
should not be read as "nothing happened"; a separate partial recovery is described below.

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

## Full suite: failed and aborted after backend loss

The full browser run started at 2026-09-19T22:14:24Z on `0987595`. The integration lead stopped
it after confirming backend loss. The retained [stdout](full-aborted.log) records seven failures
and position 48 of 56 starting; the [container exit](full-aborted-exit.txt) is 143. Positions
49–56 never started. This is not a full verification pass.

| Position | Spec | Observed failure |
| --- | --- | --- |
| 36 | `v32-progression.spec.ts:29` | CLI `characters:sheet` query: `fetch failed` |
| 41 | `v34-core-content.spec.ts:90` | Campaigns heading absent after registration |
| 43 | `v37-supporting-choices.spec.ts:11` | Same registration assertion |
| 44 | `v37-supporting-choices.spec.ts:175` | Same registration assertion |
| 45 | `v38-library-navigation.spec.ts:5` | Same registration assertion |
| 46 | `v40-unsaved-wizard.spec.ts:8` | Same registration assertion |
| 47 | `v42-primary-choice.spec.ts:8` | Same registration assertion |

The failures are not consecutive. Intervening public-content cases do not establish backend
availability. The retained v34 accessibility snapshot shows the generic sign-in error, rather than
the earlier rate-limit message. No recurrence of that rate-limit message was observed; this
incomplete run cannot establish that pacing eliminated it. `table-audit` at position 22 and
`v21-campaign` at position 27 completed without a reported failure.

The [22:43:06 state snapshot](full-oom-state.txt) records `OOMKilled: true`, cgroup `oom_kill 1`,
a 3 GiB limit, no Convex backend process, and connection refusal on port 3210. Docker still
reported healthy because its check only tested a startup marker. The exact OOM time and the
relative contributions of backend growth and diagnostic overhead were not retained.

Three CLI log followers shared the backend cgroup, including one started by the integration lead.
After their termination, a [later snapshot](after-logger-stop.txt) records 302272512 bytes, compared
with 772546560 bytes in the earlier snapshot. Both readings postdate backend loss; this is
material diagnostic residency, not proof that removing the loggers would have prevented the OOM.
Evidence was archived before recovery. V55 owns the live-health correction.

The retained Opus JSONL contains 10365 records. Its `timestamp` field ranges from
22:14:27.126 to 22:29:23.906 UTC. Among 9807 completion records, `executionTimestamp` ranges from
22:12:11.928 to 22:29:23.178. The latter is snapshot-derived, not the instant the handler ran;
these ranges alone do not establish backfill or latency. No timeout error was found in that
capture. The capture is incomplete after backend loss.

Full traces and sign-up observations are preserved outside the repository in
`/srv/presidium/projects/salient/review-reports-20260919/v52-full-aborted-0987595.tar.gz`, SHA-256
`acca6f4430ad6660ed51ebf1e754a1d155bcafd3807331b4d52c3171d63fe0b9`. This is a local retained artifact,
not a portable fixture. The same directory retains `v52-full-opus-backend.jsonl` and stderr.

## Process repairs

Runtime ownership now belongs to the integration lead. The failed first attempt lost its full
output; subsequent attempts must persist stdout, exit status and unique artifacts during execution.
Capture must be preflighted in its actual container and budgeted against its memory limit. Workers
must read queued handoffs at job boundaries, and verification reports must use complete retained
records rather than a mid-run status or a container's startup marker. These practices are recorded
in [the orchestration guide](../../../agent-orchestration.md#review-completed-bundles).
