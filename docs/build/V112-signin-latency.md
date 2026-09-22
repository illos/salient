# V112: Live sign-in latency investigation

Rules review: not required. Depends on: None.

## Goal

Locate the delay behind the user's measured 22-second sign-in on hosted development,
using fresh test accounts and measured public authentication/API requests.

## Scope

- Trace the deployed email/password, session, Convex token, profile and campaign-home path.
- Have TESTER create disposable accounts on hosted development and retain sanitized timings.
- Record evidence, confidence and the recommended repair; this slice does not publish changes.

## Acceptance checks

1. TESTER measures successful sign-up and repeated sign-in requests against
   `https://different-bat-943.convex.site`, with the Worker URL as Origin.
2. Authenticate public API calls, create the test user's app profile and read it back;
   measure the home-page queries separately from authentication.
3. Compare live endpoint timings with the checked-in call path and report remaining uncertainty.

## Work log

- 2026-09-22: Started from main `d86f9cdef0cb71782774a803c2bd00e4c15e99aa` in
  `.worktrees/signin-latency`, branch `slice/V112`. Runtime source is V109 `7d82b59`
  according to the deployment ledger; subsequent main changes are documentation.
- TESTER job `test-signin-d86f9cd-1` requests live public-API measurements with fresh
  disposable accounts. The existing browser moratorium remains in force.
- `web/router.tsx` submits `authClient.signIn.email`, then navigation waits for
  `useConvexAuth().isAuthenticated`. The provider retrieves the session and Convex JWT;
  `ProfileGate` then queries `auth.viewer`, creates a profile only if missing, and mounts
  the home page. Home data uses `campaigns.list` and `campaigns.myRequests`.
- `convex/auth.ts` uses default Better Auth password hashing. Installed Better Auth
  1.6.15 resolves `@better-auth/utils` 0.4.1. Its non-Node implementation calls
  JavaScript `scryptAsync` with N=16384, r=16, p=1, dkLen=64. This is a candidate
  bottleneck, pending endpoint timings; no password-strength reduction is proposed.
- Convex MCP status resolves the stopped local backend at port 3212, so it cannot
  directly provide the hosted logs. DEPLOY2 has been asked for bounded read-only
  hosted authentication execution logs.
- TESTER completed public-API probes against hosted development using two fresh
  accounts and 60-second request timeouts. Sign-up: 864/909 ms; repeated successful
  sign-in: 490/432/444 ms; wrong-password rejection: 471 ms. Session reads: 247–416 ms;
  JWT: 220–244 ms; profile readback: 234–438 ms; campaign reads: 314–355 ms.
  Profile creation and authenticated persisted readback passed; test sessions were
  signed out. No secrets were retained. Commands were `node probe.mjs` and
  `node wrong-password.mjs` from
  `/srv/presidium/projects/salient/test-artifacts/signin-d86f9cd/`.
  The sequential sign-in/session/token/viewer/campaign/character probes took
  1.94–2.15 seconds; that includes a character query absent from the home screen,
  and is **not** a browser click-to-home measurement. See
  [timings](evidence/V112/timings.json) and
  [negative authentication timings](evidence/V112/wrong-password-timings.json).
- DEPLOY2 supplied sanitized metadata from the last 1000 hosted execution records,
  ending 13:49:53 UTC. Nine auth POSTs: median 307.5 ms, maximum 531.7 ms;
  54 auth GETs: maximum 600.9 ms. This contradicts the initial slow-password-hash
  hypothesis for the observed window.
- A [request sequence](evidence/V112/hosted-request-sequence.json) closely matches
  the reported 22 seconds: auth POST completed at 13:48:06.377 UTC in 299 ms;
  next auth GET completed at 13:48:26.826 in 297 ms; profile read completed at
  13:48:27.504; campaign queries completed at 13:48:27.873 and 13:48:28.049.
  The interval from estimated POST start to final home query completion is
  approximately 21.97 seconds. Roughly 20.15 seconds passed between POST completion
  and estimated next GET execution start. The logs expose wildcard auth paths
  and lack browser/session correlation, so this is a matching candidate sequence,
  not proof of the exact user's request or exact GET endpoint.
- Current finding: the excess delay lies outside the recorded backend execution,
  before the subsequent session/auth requests. The exact cause (response delivery,
  browser scheduling, or session-state notification) is unconfirmed. The installed
  client signals session refresh immediately when its stored session cookie changes
  and also schedules a signal after 10 ms; no intentional 20-second wait was found.
  Do not lower password security or change backend hashing based on these results.
- Next diagnostic: capture the actual browser's request start/headers/body-finish,
  session notification, JWT/WebSocket authentication, and profile/route timestamps.
  Retain timing metadata only, excluding passwords, cookies, tokens and bodies.
  Browser execution remains deferred under the standing V66 moratorium. TESTER is
  checking whether the real session subscription can reproduce the gap headlessly.
- TESTER's additional `node subscription.mjs` probe used a third fresh account,
  the real Better Auth client and a minimal window shim. Sign-in took 558 ms;
  the automatic session became ready 252 ms later (811 ms from recorded start).
  Sign-out passed. See [subscription timings](evidence/V112/subscription-timings.json)
  and [events](evidence/V112/subscription-events.json). This excludes actual browser
  transport, React and WebSocket behavior and does not explain the observed 20-second gap.
- ENGINE independently reviewed `c70d729`: **pass**, 2026-09-22. Verified 21.971-second
  sequence, 20.152-second execution gap, 811-ms subscribed session, and 9 POST/54 GET
  aggregates against retained evidence; agrees that exact browser attribution is unproven.
- User clarified with screenshots: signed-out startup waits a long time at “Checking
  your session…”. On submitting credentials, “Please wait…” lasts about one second,
  then the button returns to disabled “Sign in” for 20+ seconds. In `web/router.tsx`,
  this means submit `pending` has cleared while `useConvexAuth().isLoading` remains
  true. That state covers session discovery, JWT retrieval and Convex confirmation;
  the screenshots alone cannot distinguish those stages. The observed POST-to-GET
  gap is consistent with a stalled session-check handoff. No user credentials or
  screenshots containing the user's email were copied into the repository.
- User confirmed Firefox and clarified that the browser-testing pause was specifically
  for table testing. Resumed focused live Firefox investigation through TESTER job
  `test-V112-d86f9cd-browser-1`; updated the standing guidance to reflect that scope.
- TESTER ran Playwright Firefox 155 on CT114 against the unchanged live site. See
  [Firefox summary](evidence/V112/firefox-summary.json). Successful attempt measured
  sign-up click-to-home 2856 ms, sign-in click-to-home 2346 ms, session GET starting
  4 ms after the sign-in response finished, disabled Sign in observed for 699 ms,
  and unsigned “Checking your session” observed for 590 ms. No WebSocket errors.
  The first attempt passed sign-up but timed out on a stale sign-out selector; the
  second used `/account/security`. Second sign-in overlapped the tail of sign-out,
  so a follow-up separates those transitions. Final explicit sign-out was not
  confirmed; disposable sessions were retained and browser/container stopped.
  These observations do not reproduce the user's browser/network conditions or
  explain the 20-second gap. Original sanitized request/UI/WS timings are at
  `/srv/presidium/projects/salient/test-artifacts/V112-firefox-d86f9cd/`.
- Follow-up TESTER job `test-V112-d86f9cd-browser-cache-2` targets returning-tab and
  shared-session state: await completed sign-out, reload root, open another tab,
  sign in and measure both. Native HTTP cache remains enabled; response metadata
  is restricted to timing and cache headers. This tests a different condition from
  the fresh-browser baseline, not a general rerun.
- Returning-tab Firefox result: root-to-login 407 ms; second-tab root-to-login
  346 ms; active-tab sign-in-to-home 1842 ms. The background tab did not fetch a
  new session or reach home within the 60-second wait, so the aggregate probe
  timed out; this does not reproduce the foreground 20-second stall. Final explicit
  sign-out passed and the browser stopped. See
  [returning-tab summary](evidence/V112/firefox-returning-tab-summary.json), derived
  from `/srv/presidium/projects/salient/test-artifacts/V112-firefox-cache-d86f9cd/events.json`.
  Auth GET response headers had `Vary: Origin` and `CF-Cache-Status: DYNAMIC`, with
  no Cache-Control header observed. DYNAMIC refers to the CDN and does not rule
  out browser caching; no cache-related cause is proven by these measurements.
- Investigation result: a matching server timeline and user-confirmed UI state
  locate the long wait in session establishment outside recorded backend execution.
  Three headless accounts and three further browser-probe accounts exercised the
  live system; active Firefox sign-in reached home in 1.84–2.35 seconds. Exact cause
  on the user's Firefox remains unresolved. Asked for a Private Window comparison
  to distinguish browser-profile state/extensions from the network path before
  proposing an application repair. No authentication behavior was changed or deployed.
- ENGINE independently reviewed the browser evidence and table-only guidance at
  `de72960`: **pass**, 2026-09-22. Raw milestones and limitations verified; no additional
  test runs. Documentation-only handoff to DEPLOY2; future application repair still
  requires evidence from the affected browser/network condition.

## Integration — 2026-09-22

DEPLOY2 fast-forwarded reviewed `8b166cc` into main. Merge metadata and documentation whitespace
checks passed. The merged policy limits the V66 browser pause to table testing; focused non-table
investigations continue through TESTER. This records the investigation, not a fix or resolution
of the reported delay. No runtime changes, deployment or repeated tests were required.
