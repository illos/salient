# V39 — Account email and password recovery

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team — deploy thread |
| Primary track | App/social |
| Rules review | not required |
| Depends on | S04 and existing Better Auth integration |
| Unblocks | Hosted password recovery |
| Status | Implementation reviewed; activation blocked on credential/test inbox; see [STATUS](STATUS.md) |

## Goal

Connect password recovery to Cloudflare Email Service from `salient@blackgate.studio`, selected by
user on 2026-09-17; user reports domain onboarded. Deliver reviewed implementation and isolated
verification, then activate hosted recovery once the sending credential and test inbox are supplied.

## Spec references

- [Authentication investigation](../accounts-and-access-spec.md#3-authentication-investigation)
- [Cloudflare account email](../accounts-and-access-spec.md#cloudflare-account-email--2026-09-17)
- [Regular-account behavior](../accounts-and-access-spec.md#proposed-regular-account-behavior)
- [Hosted development](../hosted-development.md)

## In scope

Forgot/reset forms; Better Auth recovery callback, token expiry and session revocation; internal
scheduled Cloudflare REST delivery with fixed sender/account and canonical links; persistent provider
request limits; tests, configuration documentation and eventual authorized hosted dev activation.

## Out of scope

Verification/signup/notification mail, credential-change/account-deletion UI, production release,
offline recovery, data migration/reset, new game mechanics and unrelated Worker/DNS changes.

## Inputs and dependencies

Existing Better Auth and Convex components are real dependencies. External delivery is mocked only
in unit integration tests. Isolated browser verification uses
`tests/fixtures/password-recovery.mjs`: a disposable account and provider verification record,
an unusable credential for capability UI, and requests for nonexistent accounts. No deployed bypass.
Live activation needs a suitable sending token and user-selected recipient; neither is available yet.

## Deliverables

`convex/auth.ts`, internal `convex/accountEmail.ts` and its helper, recovery UI/routes, real-route
integration tests, isolated browser fixture/tests, owning specs and evidence/review records.

## Acceptance checks — implementation gate

1. Forgot-password form returns a generic account-existence response; reset form handles mismatches,
   invalid/missing/expired/reused links. Browser verifies UI; integration tests verify provider routes.
2. Real Better Auth routes persist a new password, reject the old one, preserve account identity and
   revoke existing sessions. Tokens expire in 30 minutes; integration tests read provider state back.
3. Database request limits reject a fourth recovery request across auth instances; real browser confirms
   the fourth request is limited through the runtime/proxy.
4. Mail is internal-only, queued, fixed sender/account, text plus escaped HTML, canonical reset link.
   Successful queued/delivered acceptance is distinct from inbox delivery. Provider failure details and
   email message bodies/tokens are not logged by the new transport. Better Auth's existing unknown-user
   diagnostic can contain the submitted email address; no broader auth-log privacy rewrite is claimed.
5. Missing mail configuration disables recovery capability/requests. No delivery bypass is deployed;
   isolated fixture refuses other targets and supports cleanup of its temporary credential/token file.
6. Full `pnpm check`, clean isolated backend push, focused integration tests, real browser reset,
   reload/sign-in/revocation checks and independent implementation review pass.

## Activation gate — pending external inputs

After implementation review, install a valid backend-only email token for Cloudflare Blackgate Studio;
confirm sender readiness; deploy reviewed code to dev `different-bat-943` / Worker `salient-dev` and
verify an actual received email and full reset flow using the selected inbox. Verify request limits
through the cloud endpoint as well (the isolated browser check proves the CT114 proxy only). Do not report sending
or deployment complete until verified. No content reset, existing-user credential change or data migration.

## Ability design and playtest evidence

Not applicable: account recovery has no game mechanics.

## Rules research

Not applicable.

## Open questions

No open product questions. Activation inputs: sending credential and selected test inbox.

## Work log

2026-09-17: branch `slice/V39`, worktree `/srv/presidium/projects/salient/hosting`, base main `8af0a89`.
Use CT114 named `hosted` local-anonymous backend for isolated validation. Intended cloud target is
**dev** `different-bat-943` plus Worker `salient-dev`, Blackgate Studio account
`462b5ee1e395c11b8523d6c38de0577a`. Touch auth configuration, internal mail action/helper, recovery UI,
router, tests and specs. Existing users/content remain intact.

Credential probe: current account token verifies active but email send endpoint rejects an empty
(no recipient/no message) request with HTTP 401 Authentication error; token administration is HTTP403.
No mail sent. Need a sending credential and user-selected test inbox before live delivery verification.

2026-09-17 verification: full `pnpm check` passed 672 tests, lint/typechecks, 234 Markdown links,
pinned source checks and build. Nine recovery integration tests use real Better Auth HTTP routes and
component persistence, with only mail fetch mocked. Provider expiry/reuse, changed credentials,
persisted session removal and old authenticated viewer denial pass. Explicit `disableOriginCheck:false`
ensures tests do not inherit Better Auth's test-mode origin bypass.

Actual isolated push succeeded. `presidium-dev --env hosted run backend -- node
tests/fixtures/password-recovery.mjs` validates the isolated identity, uses an unusable email credential,
proves the actual internal Convex action reaches Cloudflare and reports sanitized HTTP401, and creates
a disposable provider reset fixture. Initial fixture CLI insertion failed due to conflicting local vs
self-hosted target selection; replaced by the same in-process ConvexHttpClient function call used by
the CLI, which also keeps test tokens out of shell arguments. No mail delivered.

`SALIENT_RECOVERY_FIXTURE=/artifacts/v39-recovery-fixture.json pnpm exec playwright test
tests/browser/password-recovery.spec.ts --workers=1` passed both scenarios in 10.9s: generic request
response, actual fourth-request limit, malformed/missing link handling, password mismatch, successful
reset, old browser signed out, old password rejected, new sign-in/reload and token reuse rejected.
Secret-bearing trace/screenshot-on-failure are disabled for this fixture; retained screenshots show only
completed request/reset messages. See [evidence](evidence/V39/README.md).

Final focused checks after strengthening review coverage: lint, app TypeScript, nine recovery tests and
235 Markdown files passed; production code is unchanged from the full suite. Independent
[implementation review](reviews/V39-account-email-review.md) passed (`v39_review`, 2026-09-17).
The isolated fixture's `--cleanup` removed its fake mail environment variable and secret artifact;
actual `auth:recoveryAvailable` readback returned false afterward. No hosted credentials were copied
to CT114 for this slice. Cloud dev/Worker and shared private main remain unchanged; this branch is not
merged or activated. Resume from reviewed V39 once email-sending credential and test inbox are supplied.
