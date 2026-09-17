# S04 hosted deployment evidence — 2026-09-17

The actual public app is <https://salient-dev.rdxx.workers.dev>, with Convex development backend
`different-bat-943` and matching `.convex.site` auth/HTTP endpoint. Cloudflare account is Blackgate
Studio `462b5ee1e395c11b8523d6c38de0577a`; first Worker version is
`e5d0f086-0964-4434-92d8-656e7a11276e`.

Application/backend/content source is unchanged from main `3bcd390` (V38 runtime implementation
`40206a5`). Deployment tooling and the new direct-route test were verified as the S04 working-tree
snapshot atop `3bcd390`; the remote helper correctly recorded `dirty: true`, not an invented commit.
The final implementation commit includes that tooling and test. Synthetic remote Git commits are
not release identities.

## Build and target checks

- [Full check](check.log): 274 engine + 389 application/script tests = 663 passing tests, lint/types,
  source inventories, 231 documentation links, pinned vendors and build.
- [Hosted build](hosted-build.log): direct cloud/site URLs with private proxy disabled; no
  deployment credential passed to the build subprocess.
- [Key guards](key-guards.json): the original command executed in an ephemeral ordinary build
  container with synthetic production/wrong-dev credentials at its otherwise unmounted config
  path. Both refused before network access; no live credential was changed.
- [Build safeguards](build-safety.json): a temporary extra asset made publication refuse before
  Wrangler ran; the asset was then removed. Exact credential-value scan passed across all 50 built
  files. Final stamp code also passed focused ESLint after the full baseline check.
- [Publish log](publish.log): 50 assets uploaded and the above Worker version activated.
- [Backend readback](backend.json): authenticated target URL, 68 root functions, configured hosted
  origin and auth-secret presence. Values of credentials/auth secrets are deliberately omitted.

## Actual hosted browser verification

All browsers run in the CT114 `hosted` browser container, one worker, using:

```sh
SALIENT_TEST_URL=https://salient-dev.rdxx.workers.dev \
VITE_CONVEX_URL=https://different-bat-943.convex.cloud \
VITE_CONVEX_SITE_URL=https://different-bat-943.convex.site \
VITE_SITE_URL=https://salient-dev.rdxx.workers.dev VITE_LOCAL_PROXY=false \
pnpm exec playwright test tests/browser/hosting.spec.ts tests/browser/journey.spec.ts \
  tests/browser/table-audit.spec.ts tests/browser/v37-supporting-choices.spec.ts \
  --workers=1 --output=/artifacts/s04-browser --reporter=line
```

The first direct-route test incorrectly assumed a `Foes` heading. The hosted library loaded, but
uses a `Search foes` textbox; the test was corrected to that existing control and now checks the
same readiness after reload. This was a new test-selector defect, not a deployment/app fix.
The [original browser log](browser-initial.log) records four existing journeys passing in 4.4
minutes and that selector failure. The [focused route rerun](routes-rerun.log) passes in 6.6 seconds.
[Final focused checks](final-checks.log) pass ESLint/Prettier and all 233 documentation links.

The account journey exercises signup, membership/invitations, independent browser contexts,
saved draft/campaign reload, sign-out/sign-in and reconnect. The table audit exercises Director,
player and observer permissions, shared state, game-log operations and normal authenticated CLI.
V37 additionally checks complete supporting choices, saved/reviewed builds and private inheritance.
These are fresh synthetic test accounts on the hosted backend; no private-main fixtures are used.

[Authenticated content status](content-status.json) reads back all 483 records with exact pinned
revision and content hash. [Persisted table readback](table-readback.json) contains the actual cloud
campaign ID and state assertions. [Hosted Director screenshot](hosted-director.png) shows that
campaign in the running browser after the audit's recorded operations. Its page is
`https://salient-dev.rdxx.workers.dev/campaigns/<campaignId>/table` using the ID in the readback.

## Preservation

[Before metadata](workers-before.json) and [after comparison](preservation.json) show all 26
unrelated Workers retain identical identity/modification metadata. The entire recorded private
main runtime state is unchanged, still serving `40206a5` at its existing tailnet URL. No private
data was copied, reseeded or reset. The hosted slot's temporary anonymous services were stopped;
cloud frontend/backend operation is independent of those services.

[Cleanup](cleanup.json) confirms temporary remote credentials were removed, selected source/evidence
contains neither key, and public browser-header access remains HTTP 200. Cloudflare rejects the
default Python urllib user agent with error 1010; actual browser journeys pass. No edge-security
setting was changed to accommodate a synthetic HTTP client.

Final browser results and independent review are recorded in the [slice](../../S04-hosted-development.md).
