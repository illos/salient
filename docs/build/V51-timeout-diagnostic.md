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

[`convex/diagnostics.ts`](../../convex/diagnostics.ts), two queries, each returning one boolean,
driven by [`scripts/v51-probe-driver.ts`](../../scripts/v51-probe-driver.ts).
Written against the installed tree: **convex 1.45.0, @convex-dev/better-auth 0.12.5,
better-auth 1.6.15.**

| Probe | Work | Purpose |
| --- | --- | --- |
| `probeWithAuthPrefix` | `requireUser(ctx)`, then return | **Treatment.** Two nested component `runQuery` calls (session, then user) **plus one indexed read of the application `users` table**. It omits only what comes *after* the prefix: no campaign, no membership, no `sessions` row, no domain table. |
| `probeIdentityOnly` | `ctx.auth.getUserIdentity()`, then return | **Control.** Authenticated, with no component `runQuery` and no `ctx.db` read. |

An earlier draft described the treatment as touching "no session, no application table". That was
wrong: `requireUser` reads a component session *and* the application `users` table. It also claimed
the control performs per-call JWT verification. That is not demonstrated and no such claim is made —
the control's stated property is only that it does no component round trip and no database read.

**Both take a `nonce: v.string()` that is never read.** It changes the argument tuple so Convex
cannot serve the call from cache, which is the difference between measuring an execution and
measuring a cache hit. `auth:viewer` may be observed alongside as a passive comparator, but it may
legitimately stay cached, so it is context and not a measurement.

**No third arm.** A session-lookup variant keyed only on session `_id`, with the same `expiresAt`
check moved to the outer query, would test whether embedding a timestamp in the sub-query arguments
causes cache misses. It is not included: **nested `ctx.runQuery` caching semantics are UNVERIFIED
on this backend**, so such an arm could not be presented as an established equivalence, and adding
it would risk reading as a proposed auth change. The uncertainty is recorded here instead. Whether
those semantics can be investigated separately — without altering any production auth path — is a
question for the integration owner, not something this slice assumes.

## The measurement

Server-side execution time is the quantity of interest, and it is **not** the client's round-trip
latency, which includes network, websocket scheduling and React work. The driver records both and
reports them separately; conclusions are drawn only from the server figure.

**Preflight, before any arm is timed.** Three things are established first, and the experiment does
not proceed if any fails:

1. Both probes are reachable and **authenticated** — a probe that silently ran unauthenticated
   would measure the wrong thing entirely.
2. **The execution-timing source, corrected against the installed CLI rather than assumed.**
   `node_modules/convex/src/cli/lib/logs.ts` reads `log.executionTime * 1000` and formats the
   Completion line as **"Function executed in N ms"** — not "Function execution took N ms", which
   an earlier draft of this plan assumed and which would have matched nothing. More importantly,
   that line is emitted only when `shouldShowSuccessLogs` is true (`logs.ts:226`), so the command
   is **`npx convex logs --success`**. Without the flag a successful execution emits no timing line
   at all, and a driver tailing plain `convex logs` would record nothing while reporting client
   latency as though it were server time. That output is a required artifact; the driver does not
   parse it and never substitutes client latency for it.
3. A nonce-varied call and a repeated identical call are compared, to confirm the nonce actually
   forces execution on this backend rather than being assumed to.

**Protocol.** Arms are **interleaved**, not run in blocks, so drift in host conditions cannot be
mistaken for a difference between arms. A bounded sample is taken — **30 paired calls per
condition at roughly one pair every two seconds**, which is enough to separate a large fixed cost
from noise without itself loading the backend. Host state is sampled **continuously across the
window**, not once, because the triage's single post-hoc snapshot is exactly what made its swapping
claim unsound.

**Two conditions:**

| Condition | What runs |
| --- | --- |
| **Idle** | Probes only, no browser suite, host otherwise quiet |
| **Loaded** | Probes interleaved while the closeout scenario drives the same environment |

**The loaded condition is not equivalent to the full suite.** A single closeout scenario is a
narrower load than the full browser run that produced the blocker. If the loaded condition does not
reproduce an application timeout, that is a limitation of the experiment, not a finding about the
application.

## Outcomes, including the inconclusive ones

Stated in advance so a result cannot be rationalised afterwards. The first draft listed three clean
outcomes; that was too tidy, and the mixed cases are the likely ones.

| Observation | What it supports |
| --- | --- |
| Treatment slow in **both** conditions, materially slower than control in both | Shared prefix carries a large fixed cost |
| Both probes fast idle, **both** degrade under load, gap roughly unchanged | Contention dominates; the prefix is not the differentiator |
| Both fast idle, treatment degrades **disproportionately** under load | **Mixed, and plausible:** the prefix is not a large fixed cost but amplifies under contention. Neither hypothesis alone; both terms matter |
| Both probes fast in both conditions, **and** the loaded condition reproduced an application timeout | Refutes the shared-prefix explanation; look to per-query work and payload size |
| Both probes fast in both conditions, **and** the loaded condition did **not** reproduce a timeout | **Inconclusive. Refutes nothing.** The experiment failed to recreate the failing conditions, and says nothing about the prefix |

That fifth row is the one an earlier draft got wrong: it treated "both probes fast" as refuting the
prefix hypothesis outright, without requiring that the load actually reproduced the symptom.

Retained per run: probe execution timings and counts from the verified timing source; client
latency separately; continuous host samples; the driver's timeline; and any Playwright failure
contexts from the loaded condition.

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

**Fast probes concurrent with an application failure are evidence against a fixed universal-prefix
explanation, not logical proof.** They do not exclude rare or context-dependent prefix effects, and
the report must not claim they do.

**The diagnostics are not left deployed.** `convex/diagnostics.ts` and the driver are removed, or
explicitly handed off with a restore step, as part of finishing the work — never abandoned on the
deployment.

A result identifies where the cost is. It does **not** fix anything, does not certify any
candidate, and does not release the V46 batch. Bounding `closeout:current` and `characters:reviews`
— the two unambiguous source defects the triage found, both scaling with retained play — remains
separate follow-up work, out of this slice's scope and not a prerequisite for it.

## Work log

2026-09-19, second pass after integration-lead review of `b7db556`: corrected four claims before
any run. The treatment probe was described as touching "no session, no application table" when
`requireUser` reads both a component session and the application `users` table. The control was
described as verifying the caller's JWT per call, which is not demonstrated. The outcome table had
no mixed or inconclusive rows, and in particular treated "both probes fast" as refuting the prefix
hypothesis even where the loaded condition never reproduced a timeout. And the protocol did not
state a sample size, an interleaving rule, a preflight, or that the execution-timing source must be
verified on this backend rather than assumed. The proposed third arm is deliberately **not** added:
nested `ctx.runQuery` caching semantics are unverified here, so it could not be presented as an
established equivalence, and the uncertainty is recorded instead.

2026-09-19: claimed V51 on `slice/V51` in `/srv/presidium/projects/salient/opus-diag`, branched
from the frozen candidate `cc7d4ac`. Wrote the two probes and this plan. Corrected four triage
overstatements before designing, and verified the atomicity correction directly: `registry.ts` runs
`outcome.commit` inside the same `MutationCtx`, so one mutation is one transaction and one
invalidation. Re-read the retained load log and confirmed the failure timestamps span the 20:08
capacity change rather than preceding it.

Nothing executed. No probe deployed, no measurement taken, nothing on CT114, no dependency, build,
server or browser workload run anywhere. The instrumentation is temporary and is deleted before any
merge; this branch is never merged.
