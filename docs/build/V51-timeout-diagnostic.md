# V51: bounded timeout diagnostic

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Diagnostic support for the V46 blocker (Opus thread `88b6a7e6-2590-4c52-bdef-efe85bf82e74`) |
| Rules review | Not applicable; no rules content |
| Depends on | Frozen candidate `cc7d4ac`; CT114 `characters` released by the V46 owner |
| Unblocks | Nothing directly. Produces evidence for the V46 timeout blocker |
| Status | Prepared, not run; see `STATUS.md` |

## What this is, and what it must never become

`slice/V51` is branched from the **frozen** V46 candidate `cc7d4ac` so the diagnostic runs against
exactly the tree that failed. It therefore *contains* V46.

**It is an unmerged diagnostic baseline and never a route to merging V46 around its own gates.**
Nothing on this branch may be merged. The instrumentation is temporary and is deleted before any
merge of anything. V46's implementation review, rules review, verification and merge gates are
untouched by this work and are not advanced by any result it produces.

This is **instrumentation, not a proposed product fix.** It measures; it does not repair. No
limit is raised, no data is reset, no existing auth, session, expiry or revocation path is changed.

## The question

The V46 blocker is repeated Convex one-second query timeouts in the closeout and `startCombat`
paths, on three queries that share almost nothing: `events:list`, `targets:drafts`, `foes:catalog`.

The source triage report (`/tmp/v46-timeout-source-triage.md`, outside the repository) established that two of those three read fewer than ten small documents through
correct indexes. The only non-trivial work every timing-out query shares is `requireUser`, which
makes two nested `ctx.runQuery` calls into the better-auth component before any own work.

**The question this experiment answers, and the only one:** does an authenticated query pay a
large fixed cost in that shared prefix, or does this backend slow *any* function equally under the
suite's load?

That is a discriminating question with two outcomes, not an open-ended hunt.

## Corrections to the triage, applied before designing this

The triage overstated four things. They are corrected here because the experiment's design depends
on not believing them.

1. **Swapping is not ruled out.** Four vmstat samples showing zero active swapping were taken
   *after* the failures they were offered against. They say nothing about conditions earlier in the
   run. The driver therefore samples host state continuously across the window rather than once.
2. **The failures span the capacity change, not precede it.** The retained log records five
   failures: 20:03:19, 20:04:09, 20:06:02, 20:07:12 — and **20:20:30, twelve minutes after** the
   20:08 stop of the `foes` preview. The triage summary said all four preceded the stop. That was
   wrong, and the log itself says otherwise. Conditions were not constant across the run, and a
   single post-stop failure measures nothing either way.
3. **Multiple appends inside one mutation commit atomically.** A Convex mutation is one
   transaction. `registry.ts` runs `outcome.commit` inside the same `MutationCtx`, so a
   `startCombat` that appends many events produces **one** commit and therefore **one**
   invalidation — not one per append. The triage's "burst of commits" framing was wrong. The
   fan-out that remains is real but smaller: one commit invalidates the subscriptions of every
   connected client, because `requireMember` reads the campaign document and every append patches
   `campaigns.eventSequence`.
4. **Small handlers are controls, not proof.** That `targets:drafts` reads under ten documents
   shows its *handler* is not the cost. It does not prove that no handler or runtime cost is
   possible — deserialisation, validator work, component invocation and scheduling all sit outside
   the handler's own database reads. The triage came close to treating a control as a proof.

Two further factors the design must respect, which the triage did not account for:

- **Query and subscription deduplication.** Multiple components subscribing to the same query with
  the same arguments share one subscription. Counting subscribing components overstates executions.
- **Parent caching.** Convex caches query results by function and arguments. Repeated identical
  reads may never execute. This is why both probes take a nonce (below) and why observing
  `auth:viewer` alone would not be an execution-cost measurement.

## The probes

[`convex/diagnostics.ts`](../../convex/diagnostics.ts), two queries, each returning one boolean.

| Probe | Work | Purpose |
| --- | --- | --- |
| `probeWithAuthPrefix` | `requireUser(ctx)`, then return | **Treatment.** Pays the full shared prefix — two nested component `runQuery` calls plus one indexed `users` read — and stops. No campaign, no membership, no session, no application table. |
| `probeIdentityOnly` | `ctx.auth.getUserIdentity()`, then return | **Control.** Authenticated, but no component round trip and no table read. Separates JWT verification from component invocation cost. |

**Both take a `nonce: v.string()` argument that is never read.** It changes the argument tuple so
Convex cannot serve the call from cache, which is the difference between measuring an execution and
measuring a cache hit. `auth:viewer` may be observed alongside, but only as context: repeated
cached viewer reads are not an execution-cost measurement.

Neither probe returns or logs any identity, session id, token, email or display name. The control
returns *whether* an identity was present, not who it was.

## The measurement

Server-side execution time is the quantity of interest, and it is **not** the same as the client's
round-trip latency. Client latency includes network, websocket scheduling and React work.
`npx convex logs` reports `Function execution took N ms` per execution, which is the server figure.
The driver records both and reports them separately; any conclusion is drawn from the server
figure.

Two conditions, same probes, same deployment:

| Condition | What runs | What it discriminates |
| --- | --- | --- |
| **Idle** | Probes only, no browser suite, host otherwise quiet | Baseline cost of the prefix with no contention |
| **Loaded** | Probes running while the real closeout scenario drives the same environment | Cost under exactly the conditions that produce the blocker |

Predictions, stated in advance so the result cannot be rationalised afterwards:

- **Prefix hypothesis:** `probeWithAuthPrefix` is slow in *both* conditions, and materially slower
  than `probeIdentityOnly` in both.
- **Contention hypothesis:** both probes are fast when idle and both degrade under load, with the
  gap between them roughly unchanged.
- **Neither:** both probes stay fast in both conditions while application queries time out. That
  would refute the shared-prefix explanation outright and send the investigation back to per-query
  work and payload size — `events:list` is the one named query with a plausible own-work cost
  (rows bounded at 51, bytes unbounded through a `v.any()` payload, plus a `history.*` N+1).

Retained per run: probe execution timings and counts from `npx convex logs`; client-side latency
separately; continuous host samples across the window, not a single snapshot; the driver's own
timeline; and any Playwright failure contexts from the loaded condition.

## Runtime preconditions — none of this has run

**Nothing in this slice has been executed.** No probe has been deployed, no measurement taken, no
CT114 environment touched.

Before any runtime step:

1. The **V46 owner must explicitly release** the CT114 `characters` environment, after finishing
   current reruns and supplements and preserving artifacts. This slice does not touch CT114 before
   that release.
2. The released `characters` slot is then **reused exclusively**, through `presidium-dev --env
   characters up` and `--env characters status`, preserving its existing data. **No new environment
   is created**, and no second environment runs simultaneously — adding one would change the very
   host-contention variable under test.
3. The prepared plan and probe diff go to the integration lead **before** the experiment runs.

## What a result does and does not establish

A result identifies where the cost is. It does **not** fix anything, does not certify any
candidate, and does not release the V46 batch. Bounding `closeout:current` and `characters:reviews`
— the two unambiguous source defects the triage found, both scaling with retained play — remains
separate follow-up work, out of this slice's scope and not a prerequisite for it.

## Work log

2026-09-19: claimed V51 on `slice/V51` in `/srv/presidium/projects/salient/opus-diag`, branched
from the frozen candidate `cc7d4ac`. Wrote the two probes and this plan. Corrected four triage
overstatements before designing, and verified the atomicity correction directly: `registry.ts` runs
`outcome.commit` inside the same `MutationCtx`, so one mutation is one transaction and one
invalidation. Re-read the retained load log and confirmed the failure timestamps span the 20:08
capacity change rather than preceding it.

Nothing executed. No probe deployed, no measurement taken, nothing on CT114, no dependency, build,
server or browser workload run anywhere. The instrumentation is temporary and is deleted before any
merge; this branch is never merged.
