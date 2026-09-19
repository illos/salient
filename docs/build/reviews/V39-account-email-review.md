# V39 account email implementation review

Reviewer: `v39_review` (independent implementation reviewer), 2026-09-17.
Reviewed branch: `slice/V39`, working changes and untracked implementation files against
`8af0a8964ae45fbe8b6b41953427a60041a85f6e`. No implementation changes authored by this reviewer.

Verdict: **pass — implementation gate**. All six implementation acceptance checks are verified
by source inspection and the retained validation evidence; no blocking findings remain. This report
does not approve or certify cloud activation, actual mail delivery, Git integration or runtime rollout.

## Specifications and evidence read

- [Authentication investigation](../../accounts-and-access-spec.md#3-authentication-investigation)
- [Cloudflare account email](../../accounts-and-access-spec.md#cloudflare-account-email--2026-09-17)
- [Regular-account behavior](../../accounts-and-access-spec.md#proposed-regular-account-behavior)
- [Hosted email configuration](../../hosted-development.md#account-email)
- [V39 implementation acceptance](../V39-account-email.md#acceptance-checks--implementation-gate)
- [V39 activation gate](../V39-account-email.md#activation-verification)
- [Review standard](../README.md#review-standard), project `AGENTS.md` and `agent.MD`.

Read all production changes and new recovery tests/fixture; inspected
[check output](../evidence/V39/check.log), [final focused checks](../evidence/V39/final-check.log),
[browser output](../evidence/V39/browser.log),
[request screenshot](../evidence/V39/request-complete.png),
[reset screenshot](../evidence/V39/reset-complete.png) and the
[evidence record](../evidence/V39/README.md). Checked installed Better Auth 1.6.15 and Convex
integration 0.12.5 source in the canonical checkout, matching the reviewed project's pins.
The transport payload and recipient acceptance handling match the current
[Cloudflare REST API](https://developers.cloudflare.com/api/resources/email_sending/methods/send/).

## Acceptance checks

| Check | Status | Evidence and limits |
| --- | --- | --- |
| 1. Recovery forms, generic response, invalid/expired/reused links | Verified | Browser scenarios pass on actual isolated HTTPS UI/backend. Source and real-route integration test cover expiry and identical existing/unknown-account responses. Screenshots show the expected confirmation text. |
| 2. Persisted password change, identity, session revocation, 30-minute expiry | Verified | Integration test reads verification expiry and sessions, rejects old password and reuse, and preserves provider identity. Strengthened viewer assertion first creates and reads a real application profile. Browser logs show old session denied after reload, old password denied and new login surviving reload. |
| 3. Persistent request limits | Verified | Database-backed integration case rejects request four across fresh auth instances; browser scenario observes the same limit through CT114's actual proxy. Cloud trusted-client-IP behavior remains an activation check. |
| 4. Internal queued Cloudflare transport | Verified | Only an internal action sends mail; callback schedules `internal.accountEmail.sendPasswordReset`. Fixed account/sender, server environment token, canonical site URL, escaped HTML and text inspected. Tests cover queued acceptance, HTTP/network failures and malformed/bounced responses. No email message body, reset token or raw provider error is logged by this transport. |
| 5. Disabled when unconfigured; no deployed bypass | Verified | Unconfigured integration case returns false capability and rejects requests. Fixture is outside deployed code, checks the named anonymous target and supports deletion of its fake credential and secret file. Implementer reports cleanup completed. |
| 6. Checks, isolated push, browser behavior and independent review | Verified | Original full check passed 672 tests plus lint/types/source/link/build checks; both browser scenarios passed in 10.9 seconds. Implementer reports isolated push and actual action's sanitized HTTP 401 probe passed. Final lint, app typecheck, nine recovery tests and 235 Markdown link checks passed after test/fixture edits; production code is unchanged from the full check. Independent source/evidence review passes. |

## Findings

No unresolved Critical or Important source findings. No blocking implementation defect identified.

Resolved during review:

- The original old-session viewer assertion could pass without an application profile. The test now
  creates the profile and proves viewer access before the reset, making subsequent denial meaningful.
- Runtime request-limit evidence now exercises a fourth request through the actual browser/proxy;
  the original unit-only header injection did not establish that boundary.
- The slice now uses the required template and separates implementation acceptance from activation.
  Logging scope explicitly acknowledges Better Auth's existing unknown-email diagnostic.

## Verification limits and activation blocker

This reviewer independently inspected source, dependency behavior, test assertions, logs and screenshots.
The reviewer did not rerun runtime workloads while the implementer owned the CT114 environment; no
local build, install or browser workload was run. The backend push, fixture cleanup and sanitized
transport probe are reported work-log evidence rather than independently repeated operations.

**Cloud activation and real inbox delivery are not verified.** The available credential is reported
rejected by Cloudflare HTTP 401, and a user-selected test recipient is missing. The browser fixture
inserts its own provider verification record and cannot prove mail issuance or inbox arrival; the
integration test proves issuance/scheduling with external transport mocked. A fake-credential transport
probe establishes runtime reachability only. Sender readiness, usable sending permission, received
sender/link, cloud request-limit behavior and the full hosted reset journey must pass the separate
activation gate. No content reset or game-data migration is part of the diff.

Chords identity/update reads could not uniquely map this reviewer; no sender ID was guessed and no
peer update was published under the parent thread's identity.
