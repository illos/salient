# V51 measured result

Run 2026-09-19 on the CT114 `characters` environment, exclusively held, brought up from this
worktree with `presidium-dev --env characters up --replace` through the guarded broker. Source
identity confirmed by `status` before measuring: checkout `/srv/presidium/projects/salient/opus-diag`,
commit `7f2f28a`, `dirty: false`, install job exit 0. Existing data volume preserved. Shared `main`
untouched by this experiment.

## Host intervention that must not be read as original suite conditions

At 20:50 UTC, **before** any measurement, I accidentally restarted the shared `main` environment by
running `presidium-dev up --help` from the canonical checkout, expecting help text. `--help` after
the subcommand is not parsed as help; it was passed through and the tool executed `up` on the
default environment. Main was recreated at `853789e`, backend healthy, HTTPS 200, volumes retained,
and a diff of `ebe66e2..853789e` outside docs and markdown is one instruction file. There was a
brief service interruption and no zero-impact claim is made. Every V51 measurement below was taken
after that event, through the strict `/tmp/v46-broker` guard which refuses any invocation without a
leading `--env characters`.

## Method

Two probes, each returning one boolean, each taking a nonce that is never read so Convex cannot
serve the call from cache. `probeWithAuthPrefix` calls `requireUser` and stops — two nested
better-auth component `runQuery` calls plus one indexed read of the application `users` table.
`probeIdentityOnly` calls `ctx.auth.getUserIdentity()` only. Arms interleaved, alternating which
leads each pair; 30 pairs per condition at one pair every two seconds; host load sampled
continuously.

Server execution time is from `npx convex logs --success` — the `--success` flag is required,
because without it a successful execution emits no Completion line at all. Client latency is
recorded separately and is never substituted for server time.

A freshly signed-up probe account has an auth identity but no application `users` row, so the
preflight refused the first attempt with "Finish account setup first." The driver now calls the
app's own `auth:ensureProfile` — the ordinary setup path the web client already calls. No auth,
session, expiry or revocation path was changed; no limit was altered; no load fixture was modified.

## Result

**Server execution time, milliseconds.**

| Probe | Idle p50 | Idle p90 | Idle max | Loaded p50 | Loaded p90 | Loaded max |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `probeWithAuthPrefix` | 42 | 54 | 77 | **43** | 91 | 223 |
| `probeIdentityOnly` | 11 | 13 | 40 | **11** | 20 | 467 |

n = 34/31 idle, 68/62 loaded. Zero failed samples in either condition.

**Application queries in the same loaded window, same backend, same moment:**

| Query | p50 | p90 | max |
| --- | ---: | ---: | ---: |
| `targets:drafts` | 1114 | 1392 | 1431 |
| `encounters:current` | 1086 | 1425 | 1426 |
| `history:status` | 907 | 1321 | 1437 |
| `events:list` | 711 | 1117 | 1205 |
| `table:roster` | 616 | 1247 | 1433 |
| `foes:catalog` | 497 | 984 | 1425 |

59 executions at or above 900 ms in that window, including `sessions:list` 942, `campaigns:get`
946, `table:roster` 952, `foes:catalog` 969, `foes:list` 1035 and an auth HTTP action at 993.

The loaded condition **did** reproduce the blocker: `closeout.spec.ts:21` failed, exit code 1.

## What this establishes

**The shared `requireUser` prefix is not the cause.** A query that pays the full prefix and stops
ran at 43 ms median while application queries on the same backend at the same moment ran 500–1400
ms. The prefix is roughly 4% of the one-second budget and it does **not** degrade under the load
that produces the failure.

**Simple host contention is not the cause either.** If the backend were slowing every function
equally, the probes would have degraded with everything else. They did not: both probes' medians
are unchanged between idle and loaded, while application queries crossed the limit.

This is the outcome the plan listed as refuting the shared-prefix explanation, and unlike the
inconclusive case it is a real refutation, because the loaded condition reproduced an actual
application failure rather than merely failing to.

## What this does not establish, stated plainly

It does not identify the cause. It narrows where to look.

Fast probes concurrent with application failure are **evidence against a fixed universal-prefix
explanation, not logical proof** excluding rare or context-dependent prefix effects.

It also corrects my own earlier triage. I argued `targets:drafts` and `foes:catalog` read too
little to be slow and should be treated as a control group proving the cost was not in the
handlers. Both were measured slow here — `targets:drafts` at a 1114 ms median. So that argument was
wrong, and a small read set does not bound execution time on this backend.

**The next suspect, and it is a hypothesis.** The probes deliberately stop after `requireUser`.
Every slow application query additionally runs `requireMember` — a campaign document read plus a
membership lookup — and the table queries add `tableContext`, which reads a `sessions` row. That
layer is shared by all the slow queries, is not exercised by either probe, and is now the narrowest
untested shared surface. A third arm calling `requireMember` and stopping would test it directly.
The per-query work already identified — `events:list` unbounded payload bytes, `closeout:current`
reading up to 10,001 events with a per-row lookup, `characters:reviews` N+1 over full documents —
remains in scope and is not excluded by this result.

## Artifacts

Raw artifacts are in the environment under `/app/artifacts/v51`: `v51-idle.json`, `v51-loaded.json`
(client latency, per-sample UTC timestamps, preflight records), `idle-logs.txt`, `loaded-logs.txt`
(`convex logs --success` output), `idle-host.txt`, `loaded-host.txt` (continuous load samples) and
`loaded-closeout.txt` (the Playwright run that failed). The tables above are transcribed from those
files.
