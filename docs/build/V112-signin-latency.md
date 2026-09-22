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
