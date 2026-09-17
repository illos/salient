# V39 verification evidence

Source: `slice/V39`, based on main `8af0a89`; CT114 isolated `hosted` environment,
local-anonymous `anonymous-agent`. Cloud and private shared-main apps have not been changed.

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
reset token. Cloud activation, sender readiness and actual received email remain unverified until the
sending token and chosen recipient are supplied. Cloud request-limit header behavior remains a live
activation check; the browser evidence here is for CT114's proxy.
