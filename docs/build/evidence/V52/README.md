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

## Full suite — terminated, not completed

`presidium-dev --env characters run browser -- pnpm exec playwright test --workers=1`, started
2026-09-19T22:14:24Z. **It exited 143 (SIGTERM) at position 48 of 56**, about eighteen minutes into
a fifty-five minute allowance, so it was stopped externally rather than timing out. No end stamp was
written to `/artifacts/v52-full-end.txt`, which is itself the marker that it never reached its own
end. **This is not a result and must not be read as one.** Positions 49–56 never ran; those include
three of the four V46 journeys, `password-recovery` and `reference-streaming`, so nothing can be
said about them.

Two failures were recorded before termination, both at 22:29:

1. `v32-progression.spec.ts:29` — `Error: Command failed: pnpm app query characters:sheet`,
   `fetch failed`.
2. `v34-core-content.spec.ts:90` — the `Campaigns` heading assertion, the same shape as the
   registration refusals. **But it is not the same failure.** `v34` registers through `createTable`
   in `v21-fixtures`, which *is* the paced helper, so a paced registration failed — and its
   accessibility snapshot reads `alert: Unable to sign in. Please try again.`, which is
   `web/router.tsx`'s generic fallback when the auth error carries no message. It is **not**
   `Too many requests. Please try again later.`, the 429 body seen in V43, V45 and V46.

The backend capture for 22:29:00–22:30:09 holds 85 records, **none with an error field and no 429**.
The slowest are auth HTTP — `GET /api/auth/*` at 3.52 s and `POST /api/auth/*` at 2.66 s, both
uncached, against sub-second norms elsewhere in the file. That is a correlation in one window and no
cause is claimed from it.

What the partial run supports, and only this: `table-audit` at position 22 and `v21-campaign` at 27
both passed, which is where V46 failed them, and the rate-limit refusal was not reproduced in the 48
positions that ran. It does not establish that pacing is why, for the reason given above — those
specs also pass unpaced in isolation, and this run did not finish.

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
