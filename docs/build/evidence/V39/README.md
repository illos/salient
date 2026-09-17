# V39 verification evidence

Source: `slice/V39`, based on main `8af0a89`; CT114 isolated `hosted` environment,
local-anonymous `anonymous-agent`. The initial isolated evidence is followed by hosted activation below.

- [Full check](check.log): 672 tests, lint, TypeScript, source/link checks and build passed.
- [Final focused checks](final-check.log): lint/types, strengthened nine-test suite and 235 Markdown files pass.
- [Browser run](browser.log): both scenarios passed against actual HTTPS UI/backend in 10.9s.
- [Request confirmation](request-complete.png): generic response, no account-existence disclosure.
- [Reset completion](reset-complete.png): completed reset, followed by old-session/old-password denial,
  new login/reload and rejected token reuse in browser test.

The browser fixture creates its own account and provider verification token. Its unusable email
credential enables the capability; request-form checks use nonexistent accounts, so no real mail is
queued. A separate internal-action probe reaches Cloudflare and receives sanitized HTTP401 with the
fake credential, proving runtime support without claiming delivery. The integration tests exercise
real token issuance, scheduling and credential/session persistence with mail transport mocked.

`--cleanup` on the fixture removes its backend fake credential and temporary secret fixture file.
Cleanup succeeded and actual recovery capability read back false. Secret fixture, browser traces and storage state are not retained here. The screenshot URLs have no
reset token. These initial browser checks apply to CT114’s proxy; the hosted checks below cover
the actual cloud endpoint.

## Hosted activation

Implementation `62ca7b964c700eae20fd32b3393fdbcd175c9af4` is merged into main and live on
Convex dev `different-bat-943`, Worker `salient-dev`, and the shared private CT114 main runtime.

- [Cloud publication](cloud-publish.log): Worker version `97387eb7-b9b7-41c1-b19e-dc96379cecc3`.
- [Cloud browser run](cloud-browser.log): two recovery scenarios pass in 20.7s, including actual
  cloud request limiting, password/session replacement and single-use tokens.
- [Cloud request confirmation](cloud-request-complete.png) and [cloud reset completion](cloud-reset-complete.png).
- [Delivery response](delivery.json): a plainly labeled test to the user-selected inbox was accepted
  and queued by Cloudflare (HTTP 200); the user subsequently **confirmed receiving the test email**.
- [Shared-main journey](main-browser.log): signup/login, invitation, lifecycle, persistence and
  reconnect pass in 37.8s after serializing guest workloads. The first attempt encountered a
  backend query timeout during concurrent build work; this log is the successful rerun.
- [Private recovery capability](main-unconfigured.png): unavailable without a mail token; a separate
  browser assertion confirms the private sign-in page hides its recovery link.

The selected inbox had no hosted account. Browser recovery therefore used a disposable `.test`
account, a token from the normal recovery endpoint, and read-only access to that synthetic token.
The fixture request also scheduled mail to that reserved address; this is not delivery evidence.
The delivery test to the selected inbox was a separate direct Cloudflare API call using the same
backend token and sender, not a reset of an existing user's password.

Temporary remote deployment credentials and the token-bearing fixture were removed. The real mail
token remains only in the cloud backend environment. No secret-bearing traces, fixture, recipient
address or credential values are committed. Shared main remains running; the unused hosted local
services are stopped. No data/content reset was performed.
