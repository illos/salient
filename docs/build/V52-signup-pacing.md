# V52: pace browser-suite account creation to the product's own sign-up limit

**Status: NOT verified. `pnpm check` and a focused four-spec run pass; the whole-suite run was
aborted when the backend was OOM-killed mid-run, with seven consecutive failures at the collapse and
eight positions never reached.**
`pnpm check` passes and a focused four-spec run passes, both on `0987595`. What those do **not**
establish is in [the evidence README](evidence/V52/README.md#focused-specs--two-attempts-and-the-first-one-failed):
the three previously-refused specs already passed in isolation without any pacing, so a focused
pass cannot distinguish this slice's effect from the isolation effect. The whole-suite run is the
only one that can, and runtime orchestration passed to the integration lead partway through
(Chords 486, 493, 499).

## Base and relationship to V46

Branched from `b2c660a` — the frozen V46 candidate — in
`/srv/presidium/projects/salient/opus-auth-pacing` on `slice/V52`. V46's branch is untouched.

This inheritance is deliberate and it is also a constraint: **V52 must not become a way for V46 to
reach `main` without passing its own gates.** V52 contains all of V46, so merging V52 merges V46.
Whoever integrates this must either rebase V52 onto a `main` that already has V46, or hold V52
until V46's gates are settled. It cannot be treated as an independent infrastructure change on the
grounds that it only edits tests.

**No product code is touched.** The demonstration covers every path product code lives in, not
just three of them — an earlier version of this line fingerprinted `convex shared web` only, which
omitted `src/` (`cli.ts`, `engine.ts`, `parser.ts`, `content.ts`, `contracts.ts`) and `scripts/`
and so did not demonstrate what the sentence beside it asserted:

```
git diff --stat <base> <candidate> -- convex shared web src scripts public runtime   # empty
```

## What is wrong

The browser suite creates accounts as fast as it can and observes no constraint at all. The
product has one, deliberately. Across three slices — V43, V45 and V46 — a registration in the full
suite has been refused with the auth library's own 429 body, *"Too many requests. Please try again
later."*, retained at `docs/build/evidence/V43/rate-limit-context.md`,
`docs/build/evidence/V45/rate-limit-context.md` and
`docs/build/evidence/V46/browser/cc7d4ac-failures/`.

## The policy, read from the installed package

`better-auth` 1.6.15, with `@better-auth/core` also resolving to **1.6.15**. An earlier version of
this document said 1.6.31; that was wrong and it was the dangerous kind of wrong, because 1.6.31
reworked the limiter and a future reader would have "confirmed" this model against the wrong file.
The resolution is `pnpm-lock.yaml`: `better-auth@1.6.15` depends on `@better-auth/core: 1.6.15`,
and the lockfile contains no 1.6.31 at all — the `1.6.31` directories under `.pnpm` are orphaned
store entries reachable from no import. **The version that matters is the one installed on the
runtime at run time**; confirm it on the box at the start of the verification run, not here.

`convex/auth.ts:41` enables rate limiting with `storage: 'database'` and custom rules only for two
password-recovery paths, so sign-up takes the library default:

| Fact | Source |
| --- | --- |
| `/sign-in*`, `/sign-up*`, `/change-password*`, `/change-email*` → `window: 10`, `max: 3` | `better-auth/dist/api/rate-limiter/index.mjs`, `getDefaultSpecialRules()` |
| Bucket key is `` `${ip}\|${path}` `` — per address **and** per path | `@better-auth/core/src/utils/ip.ts`, `createRateLimitKey` |
| Refuses when `now - lastRequest < window*1000 && count >= max`, evaluated **before** the increment | `better-auth/dist/api/rate-limiter/index.mjs`, `shouldRateLimit` — **not** `ip.ts`, which holds only `createRateLimitKey` |
| Counter resets to 1 only when a response arrives more than `window` after the previous one | same file, `onResponseRateLimit` |

Two consequences worth stating plainly. The window is **rolling**, not fixed: an unbroken chain of
sign-ups under ten seconds apart never resets. And because the key includes the path,
`/sign-in/email` and `/sign-up/email` are independent buckets — which is why reusing an auth token
to cut the CLI's sign-in traffic, considered earlier, cannot affect a sign-up refusal and is not
part of this slice.

## This is a conformance fix, not a proven cure

**The observed refusals are not fully explained by that policy, and this slice does not claim to
fix them.** In `table-audit` the refused account is the *third* sign-up the spec makes, and `max: 3`
with a pre-increment check means the *fourth* is refused; the preceding suite positions issue
almost no auth traffic, so the rolling window had every chance to reset first; and `wizard` later
issued three more sign-ups successfully in the same run. Something is unaccounted for — more
requests reaching `/sign-up/email` than the specs appear to issue, a differently scoped key,
retries, or counter rows persisting in the retained database volume.

So the honest framing: the suite violates a stated constraint, that is worth fixing on its own,
and whether it is *the* cause is an open question this slice does not close. It should be landed
and then observed. `signUpExchanges()` and the retained file exist so the next full run
produces measurements of what reached the endpoint instead of another argument — though not of the
server's counter, which they cannot see.

## What changed

`tests/browser/signup-pacing.ts` (new). `pacedSignUp(page, submit)` waits until more than a full
window has passed since the last sign-up, runs the caller's submit unchanged, and records the
`/api/auth/sign-up/email` exchange that results.

Wired into all nine UI registration helpers: `v21-fixtures.ts:22` (the shared one; `createTable:53`
calls it twice, at `:67` and `:74`), and the per-spec copies in `campaign-sharing`, `closeout`,
`combat`, `journey`, `rule-popup`, `table-audit`, `theme` and `wizard`.

`tests/fixtures/password-recovery.mjs` — the suite's **tenth** sign-up, and its only non-UI one: a
direct `fetch` POST to `/api/auth/sign-up/email`. It shares the per-address bucket with every
browser registration, and an independent review caught that the first version of this slice missed
it. It runs in its own process, so it cannot share the in-process chain; a plain quiet period
before the request gives the same guarantee.

Design points, each with the reason it is not arbitrary:

- **No counter, no reset logic.** The first version replicated the server's bucket and paced in
  bursts of three. Two independent problems killed it. The reset predicate `gap > window` had to be
  evaluated on client-observed instants, and unequal latencies can push an observed gap past ten
  seconds while the server's stayed under it — clearing the replica's count while the server's
  still held, then submitting into a full bucket. That is unsafe, not conservative, and that
  version's comment claimed the opposite. Second, the replica was per worker process while the
  bucket is per address, so anything else reaching the backend was invisible to it. An
  unconditional wait has neither failure mode because it models nothing.
- **Timestamped at the network event, in one place.** The first version clocked the `Campaigns`
  heading; the second moved the *status* to the response but left the *instant* in a `finally`
  after the caller's assertions, so it was still UI completion wearing a response's label. Every
  exchange is now recorded once, by the `page.on('response')` listener, which is the only code
  that sees the event. A paced call then claims its own response by object identity.
- **Nothing is suppressed.** The second version skipped matching responses while a paced call was
  in flight, which blinded it during exactly the interval under investigation. All matching
  responses are recorded; unclaimed ones stay `initiated: false`, which is how a request the specs
  did not issue becomes visible.
- **But `initiated: false` is not proof of an extra request**, and the record says so. A response
  slower than the 2 s claim grace looks identical: its paced call records `observed: false`, then
  the response arrives unclaimed. An `observed: false` row followed closely by an unclaimed one is
  most likely one exchange, not two. Whoever reads the file must read such pairs together.
- **An unobserved submit is recorded as unobserved.** `observed: false`, with no invented instant.
- **`X-Retry-After`, as the library actually spells it.** `rateLimitResponse` in 1.6.15 sets
  `X-Retry-After`. It is a different header from `Retry-After`, not a case variant, so reading only
  the latter silently drops the one header that says how long the bucket has left. Both are read,
  at both sites — the browser helper and the recovery fixture.
- **No response body and no token is recorded.** Method, instant, status and the retry header
  only.
- **Initial quiescence, for the right reason.** Module load necessarily *follows* the previous
  process's last sign-up, so a full quiet period measured from import implies at least that long
  since any sign-up the suite made. That is what makes it correct after a worker restart. It is
  often a no-op, because import can precede the first paced call by minutes.
- **`workers: 1` is enforced, not assumed.** `assertSingleWorker()` throws if the config or
  `parallelIndex` says otherwise. An in-process chain cannot constrain a second worker against a
  per-address bucket, and a comment saying so would rot silently.
- **Bounded waits, never retries.** Two per call, both bounded: the quiet period before the submit
  (at most 11.5 s) and at most 2 s afterwards to claim the response. No loop, no retry — a blanket
  retry would hide the signal this exists to expose. The post-submit bound matters: a submit that
  produces no request at all must not sit on the observer's 30 s timeout, delaying the real failure
  for time nobody is charged. Nothing is lost by giving up early, because the listener records every
  response independently; a late arrival is retained as `initiated: false` rather than dropped.
- **Timeout accounting is best-effort and says so.** Both waits, plus time queued behind another
  caller, are added to the running test's budget. Three residual gaps are listed in the helper
  rather than papered over with an absolute claim.
- **Exemptions by construction.** Only callers that go through the helper are paced. The
  deliberate 429s in `password-recovery.spec.ts` are on `/request-password-reset`, which has its
  own custom rule and its own bucket, and are untouched.

## What is deliberately not done

No product rate limit is changed, relaxed or disabled. No address is spoofed and no header is
forged. No counter or table is cleared and no data is reset. No refusal is retried. Token reuse is
out of scope: it belongs to a different bucket and would not affect this.

## Expected cost

**56 registrations** across the suite. The derivation is recorded here rather than cited from
`/tmp`, which will not exist for whoever runs the verification: nine UI helpers plus the recovery
fixture's direct `fetch`, counted per call site with loop iterations resolved from their fixtures —
`createTable` registers two per call, `table-audit` and `wizard` register one then two more in a
loop, `journey` four, and the V46 counterpart journey loops over the 13-witness manifest.

At one quiet period per registration that is an **upper bound** of 56 × 11.5 s ≈ 10.7 minutes added
to an 18-minute run, and only if every wait fires in full; any registration already more than 11.5 s
after the previous one waits nothing. It can be narrowed later *from the measurements this slice
retains*, rather than from a guess now.

## Verification plan, for when a runtime is handed over

Nothing below has been run.

1. `pnpm check` on the frozen tree, to show the test-only change breaks nothing: lint and Prettier,
   engine, app and scripts, links, vendor pins, content, supporting, foes, build.
2. The whole configured browser suite, single worker, with `presidium-dev --env <env> up --replace`
   first and `status` captured into the log — the `commit` field, not `identity`.
3. **Hold the environment exclusively.** The bucket is per address; a second run, a manual
   session or another thread registering against the same deployment makes the timings
   uninterpretable. This is a precondition, not a nicety.
4. Confirm the installed `better-auth` and `@better-auth/core` versions **on the runtime** before
   starting, and record them. The model in this document is correct for 1.6.15 and wrong for
   1.6.31.
5. Retain `.playtest/v52/signup-exchanges-*.json`, plus the `signUpExchange` line the recovery
   fixture logs. Each row is one `/api/auth/sign-up/email` response: UTC instant, status,
   `Retry-After`, whether it was observed, whether this helper initiated it, the wait imposed and
   the gap from the previous one. **This records what reached the endpoint. It does not record the
   server-side counter** — only a read of the backend's rate-limit rows would show that, and if the
   run is inconclusive that is the next measurement to take.
6. Record the result honestly whichever way it goes. **A passing suite does not establish that
   pacing was the cause**, given the unexplained pattern above; a failing one, with timings showing
   the policy was respected, is a stronger result than a green run, because it would rule the
   documented policy out.
7. Independent implementation review before any merge, and the V46 inheritance above resolved.

## Exact commands for the verification run

Prepared, not run. `<env>` is whichever isolated environment is handed over; the guard at
`/tmp/v46-broker/presidium-dev` hardcodes `characters` and must be copied and edited for any other
target. Prepend `PATH=/tmp/v46-broker:$PATH` to every one of these.

**0. Preconditions, both mandatory.** Hold the environment exclusively — the rate-limit bucket is
per address, so a second run or a manual session against the same deployment makes the timings
uninterpretable. And sync before anything else: `presidium-dev run` does **not** re-sync, so a run
after an edit executes the previously synced tree.

```
presidium-dev --env <env> up --replace
presidium-dev --env <env> status            # read "commit", NOT "identity" — identity is
                                            # stable across different commits
```

**1. Confirm the installed library on the box.** The model in this document is correct for 1.6.15
and wrong for 1.6.31; the runtime's own install governs, not this checkout's.

```
presidium-dev --env <env> run build -- node -e "
  const r = p => require(require.resolve(p + '/package.json')).version;
  console.log('better-auth', r('better-auth'));
  console.log('@better-auth/core', r('@better-auth/core'));
"
```

**2. Static gate on the candidate.**

```
presidium-dev --env <env> run build -- pnpm check
```

**3. Focused validation — the changed paths, before spending a full suite.** These four specs
between them exercise the shared helper, a per-spec copy, the three-registration shape that was
refused in V45 and V46, and the click-only site with no post-submit assertion.

```
presidium-dev --env <env> run browser -- pnpm exec playwright test \
  tests/browser/table-audit.spec.ts tests/browser/v21-campaign.spec.ts \
  tests/browser/wizard.spec.ts tests/browser/rule-popup.spec.ts \
  --workers=1 --output=/artifacts/v52-focused --reporter=line
```

**4. The whole configured suite.**

```
presidium-dev --env <env> run browser -- pnpm exec playwright test \
  --workers=1 --output=/artifacts/v52-full --reporter=line
```

**5. Retain, from the synced source's `.playtest/v52/`.** `signup-exchanges-<pid>.json` per worker,
plus the `signUpExchange` line the recovery fixture logs if that fixture ran. Copy them into
`docs/build/evidence/V52/` before any further `up --replace`, which recreates the backend container
and destroys its logs — that is how the V46 backend excerpt became unretrievable.

**6. What the result does and does not mean.** A green suite does **not** establish that pacing was
the cause; the refusals were never explained by the policy this conforms to. A red suite whose
timings show every sign-up separated by more than the window is the *more* informative outcome,
because it rules the documented policy out and points the next measurement at the server's own
rate-limit rows.
