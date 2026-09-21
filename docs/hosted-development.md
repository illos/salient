# Hosted development

## Targets and data

S04 publishes a separate development environment for the user's remote-hosting assignment:

| Component | Target |
| --- | --- |
| Frontend | `https://salient-dev.rdxx.workers.dev` |
| Cloudflare account | Blackgate Studio, `462b5ee1e395c11b8523d6c38de0577a` |
| Worker | `salient-dev` |
| Convex development | `https://different-bat-943.convex.cloud` |
| Convex HTTP actions/auth | `https://different-bat-943.convex.site` |
| Build/browser environment | CT114, named `hosted` slot |

Hosted development starts with the pinned content and fresh test accounts. Existing private main
accounts, campaigns and characters stay on CT114. No production backend, domain change or paid-plan
change is part of this deployment. The default private runtime and local-only seed guard are retained.

## Workflow

Use [the remote-development workflow](remote-development.md#workflow) to sync the hosting checkout
to the explicitly named CT114 `hosted` environment. `up` only starts its isolated private development
services; cloud operations are explicit one-off tasks. Nothing publishes automatically.

An enrolled operator transfers only `CONVEX_DEPLOY_KEY` and `CLOUDFLARE_API_TOKEN` through brokered
SSH stdin into `/srv/dev/salient/hosted/config/hosted.json`, mode 0600. Never place these credentials
in source, `.env.local`, artifacts, shell arguments or frontend build variables. Remove this temporary
file after the deployment work; reprovision it for future explicit releases. The `hosted` task reads
it from the config mount; ordinary frontend/build/browser tasks do not mount that directory. The
existing anonymous backend also mounts config, and CT114 Docker access remains shared as described
in the remote runbook. Use the exact `dev:different-bat-943` key and the selected account token.

```sh
presidium-dev --env hosted run hosted -- node runtime/hosted.mjs status
presidium-dev --env hosted run hosted -- node runtime/hosted.mjs configure
presidium-dev --env hosted run hosted -- node runtime/hosted.mjs backend
presidium-dev --env hosted run hosted -- node runtime/hosted.mjs seed
presidium-dev --env hosted run hosted -- node runtime/hosted.mjs build
presidium-dev --env hosted run hosted -- node runtime/hosted.mjs frontend
```

Identify and announce the target before each mutating step. `configure` sets the hosted `SITE_URL`,
creates `BETTER_AUTH_SECRET` only if absent and removes the private proxy's auth-base override.
`backend` uses the installed Convex CLI and scoped deployment key. `seed` deliberately runs internal
`content:reseed`, replacing only the content snapshot and manifest; it does not migrate play data.
Do not run it against any other deployment or as an incidental step of every frontend publish.

`build` supplies the public cloud/site URLs with `VITE_LOCAL_PROXY=false` and passes no deployment
credentials into the build. `frontend` uses pinned Wrangler 4.134.0 and `wrangler.jsonc` to publish
`dist` as a static SPA. A build stamp records the hosted URLs and every asset hash; publication
refuses changed assets, including a private-proxy build produced by a later `pnpm check`. Re-run
the hosted build immediately before publishing. No Worker JavaScript, API proxy or custom-domain
binding is required.

Cloudflare's [SPA routing configuration](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
serves the app shell for direct client-side routes. Backend deployment follows Convex's
[custom-hosting workflow](https://docs.convex.dev/production/hosting/custom). These are infrastructure
references; the existing source pins and game-content records are unchanged.

## Verification and recovery

Deployment reuses accepted TESTER evidence. Do not run smoke tests, headless cohorts, manifest
readbacks or asset checks before or after promotion solely to verify the new environment. Required
build/publication commands and their successful results complete deployment verification. The
headless configuration below applies only when an explicit user request, code change or observed
failure warrants a targeted test; it is not a routine release step.

The hosted demo is a test environment alongside local and CT114, not production. Use a free
suitable runner on either host; record the runner separately from the application target.
The browser moratorium applies here too. Programmatic API tests set `VITE_SITE_URL` to the
Worker URL and `VITE_CONVEX_URL` / `VITE_CONVEX_SITE_URL` to the matching cloud URLs.
The headless helper sends `VITE_SITE_URL` as its authentication Origin; inheriting the CT114 preview
value causes an expected “Invalid origin” rejection from hosted auth. Use fresh
test users and preserve existing data. Prove saved behavior through authenticated public API
routes; retain visual/deep-link browser scenarios in the browser coverage backlog.

Record source commit, Worker version, backend/content status and test evidence in
[S04](build/S04-hosted-development.md). For a failed initial deployment, retain the existing private
development URL. Later releases can redeploy the previously recorded frontend source and compatible
backend; do not reset data as a rollback. Verify schema compatibility before rolling backend code back.

## Account email

V39 enables hosted password-reset delivery from `salient@blackgate.studio` through Cloudflare Email Service.
Use an email-only token for Blackgate Studio with **Email Sending: Edit**, supplied through the secret
broker, and set it as **backend** `CLOUDFLARE_EMAIL_API_TOKEN` on `dev:different-bat-943`. Never use a
`VITE_` variable or place it in the frontend build. The user installed the dedicated sending token
directly in Convex on 2026-09-17; it is separate from the deployment token.

The configured `SITE_URL` supplies the reset-link origin. No frontend key is needed. Recovery UI is
available only when backend mail configuration exists. To disable new recovery requests, remove the
email token; issued tokens keep their normal 30-minute validity. Existing auth, game data and content
need no reseed. Internal mail failures contain only a sanitized category/HTTP status; inspect those
and Cloudflare Email Service delivery logs for operations. Avoid blind retries after ambiguous network
failures: request a new reset link through the UI instead.

V39 implementation `62ca7b9` was initially published to hosted dev as Worker version
`97387eb7-b9b7-41c1-b19e-dc96379cecc3`. Actual hosted browser checks passed reset, old-password
rejection, fresh sign-in, session revocation, token reuse rejection and request limiting with a
disposable account. Cloudflare accepted/queued a separate test to the operator-selected inbox.
The user confirmed receipt of that test email. The received message was a delivery test, while
reset-link behavior was checked separately through the disposable account.
See [V39](build/V39-account-email.md) for the validation record. Shared private main also has the code
but keeps recovery unavailable because it has no email token.

## Previous release — 2026-09-19

Performance source `944a46ab7b05059d22d8403634867de56462e209` is published to the targets above.
Worker version: `7e86903b-5f7c-46a8-8d68-540f8f21991f`. Convex deployment added bounded-history
read indexes without deleting existing indexes or resetting data. GitHub CI passed 681 tests.
See [the release evidence](build/evidence/V43/hosted/README.md) for browser results,
fixture limitations and deployment logs. Earlier Worker versions in slice records are historical.


## Current release — V104 Elementalist level one

Backend/frontend source `e064050936c73c75da87b82f3830b127948f70c7` published on 2026-09-21 as
Worker `68918c7b-7875-45a3-bb7f-aefb97163a6f`. Backend/schema validation, updated content reseed
(1436 entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test
or rerun. See [V104](build/V104-elementalist-level-one.md) and the [ledger](../deploy.md).

## Previous release — V103 Null level one

Backend/frontend source `983bcfa930b070ce8375f8008966a0eea41c8c7a` published on 2026-09-21 as
Worker `7d57b840-f22b-4dd3-bb6b-859147f92f71`. Backend/schema validation, content reseed (1436
entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test or
rerun. See [V103](build/V103-null-level-one.md) and the [ledger](../deploy.md).

## Previous release — V102 Troubadour level one

Backend/frontend source `0bb1ead31771b6b148102fefba9f0f22706ae2dd` published on 2026-09-21 as
Worker `e2663b2f-4575-43a2-9bae-b9fb906f1997`. Backend/schema validation, content reseed (1402
entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test or
rerun. See [V102](build/V102-troubadour-level-one.md) and the [ledger](../deploy.md).

## Previous release — V101 Fury level one

Backend/frontend source `e31335d0fa35ebcb2cc9e50af60d2d56f6c96c7f` published on 2026-09-21 as
Worker `179f7087-1c06-4e07-a626-2ebc6473d69a`. Backend/schema validation, content reseed (1362
entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test or
rerun. See [V101](build/V101-fury-level-one.md) and the [ledger](../deploy.md).

## Previous release — V100 Conduit level one

Backend/frontend source `507919299a83b079167c43f7da40c0a0c8bfa92e` published on 2026-09-21 as
Worker `28baa4c0-dbb9-4b75-ad0a-7a596b8d54a2`. Backend/schema validation, content reseed (1361
entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test or
rerun. See [V100](build/V100-conduit-level-one.md) and the [ledger](../deploy.md).

## Previous release — V99 Censor level one

Backend/frontend source `517ea19de44ea758bc76812d3235b617077defd1` published on 2026-09-21 as
Worker `4cfd22de-2da4-42fe-b10b-65c373ae1cf1`. Backend/schema validation, content reseed (1306
entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test or
rerun. See [V99](build/V99-censor-level-one.md) and the [ledger](../deploy.md).

## Previous release — V98 Shadow level three

Backend/frontend source `66a0f3d12ea8bb450cfda7c8375ba363fa718861` published on 2026-09-21 as
Worker `185d6c0a-3965-4ea1-87da-f399259360f2`. Backend/schema validation, content reseed (1228
entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test or
rerun. See [V98](build/V98-shadow-level-three.md) and the [ledger](../deploy.md).

## Previous release — V97 Shadow level two

Backend/frontend source `c3423f4ba6d4dd95aacc7f230a243e6a264748a9` published on 2026-09-21 as
Worker `b25c3463-9fe2-4580-b0c6-dd3c55e9b76d`. Backend/schema validation, content reseed (1221
entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test or
rerun. See [V97](build/V97-shadow-level-two.md) and the [ledger](../deploy.md).

## Previous release — V96 Character builder

Backend/frontend source `1e20eece741fc763eea4c359d3853d018e4513de` published on 2026-09-21 as
Worker `b1effe2a-181b-4fa5-8355-df49f69cc3f0`. Backend publication/schema validation and hosted
build/upload succeeded. Accepted TESTER results reused, with no smoke test or rerun. Content
remains the V94 1209-entry snapshot. See [V96](build/V96-wizard-rail.md) and the [ledger](../deploy.md).

## Previous release — V95 Account screen

Backend/frontend source `1115380d0411acae916a3c7a8936e46cad95f9da` published on 2026-09-21 as
Worker `72e2c950-8477-4c4a-895c-ed6b2c3026f1`. Backend publication and hosted build/upload succeeded.
Accepted TESTER results reused; no deployment smoke test or rerun. Content remains the V94
1209-entry snapshot below. See [V95](build/V95-account-screen.md) and the [ledger](../deploy.md).

## Previous release / current content — V94 Tactician level one

Backend/frontend source `fcf13f11e91646579e9a5a05e1650255bc2ae21b` published on 2026-09-21.
Worker `c4b6b8f4-dd09-4706-934a-be5d4fac73a3`; content reseed returned 1209 entries, with committed
snapshot hash `sha256:b4e0d992e181c9bac991ca9487600fabeb1ce20a130781dc38128cdba0fa5035`.
Accepted TESTER evidence was reused. Publication commands succeeded; no deployment smoke tests
or repeated test gates. See [V94](build/V94-tactician-level-one.md) and the [ledger](../deploy.md).

## Previous frontend release — V75 Quiet theme

Frontend source `c4ed53e48c74f5783b876cd6a7c09fafe2f0795c` published on 2026-09-20 as
Worker `31c58f6d-cfe2-4848-945e-908aa4104003`. User-approved presentation changes only;
backend and content remain at the V92 identities below. Hosted build passed; the full TESTER
check was reused. See [V75](build/V75-quiet-theme.md) and the [deployment ledger](../deploy.md).

## Previous backend/content — V92 Shadow level one

Backend/frontend source `81b79316dbf11e18d44f3feab6e7f1d3b49f5d22` published on 2026-09-20.
Worker `f6951468-0bfe-49bd-b0ab-1ec9628334fc`; content reseeded to 1182 entries with hash
`sha256:ea1f6a2cf1d3c8a30f5fa40aef52fdadc25aa97900648485c9fe5957a50cf43b`.
The [V92 work log](build/V92-shadow-level-one.md#work-log) records verification and the
[deployment ledger](../deploy.md) records publication.

## Current partial release — 2026-09-20

The initial partial publication is now resolved.

Backend and frontend source `a0a700af77740879e214c064876e277219f0f441` are published.
This integrates V85/V86/V87/V88/V89 and the reviewed build-only Node heap increase to 1536 MiB.
Backend schema validation and the hosted build passed. An initial scoped-key denial prevented
content/frontend publication; DEPLOY2's fresh credential session resolved it at 20:06 UTC.
The content-only reseed loaded 1151 entries; the retained stamped frontend build published as
Worker `0336f2f4-1141-4d95-8bc6-d2cec63f8797`. Existing play data was not reset.

The integrated suite passed 358 engine + 575 app/scripts. Targeted live certification passed:
1151-entry manifest, 438 foe definitions and persisted Ghoul, starting rewards, complication table,
and real-dice Eye Flash condition/save cleanup. See the
[live certificate](build/evidence/V85/tester-job-a0a700a-hosted-live.md) and
[deployment ledger](../deploy.md) for executable versus documentation/GitHub closeout identity.
Temporary CT114 credentials are removed and private hosted helper services remain stopped.

## Previous character deployment — 2026-09-20

TESTER deployed source `86e9d2ed3b82a5d027f631f677975f040439f472` to both hosted components;
Worker version `bb430814-0366-43a3-882a-bd69f81cc811`. Full repository checks (864 tests), Convex
dry-run/deployment validation and hosted frontend build/publication passed. Existing play data
and 567 reference entries were retained. No configure/reseed/reset or browser commands were run.
The earlier bundling/schema defects are resolved; their [diagnosis](build/evidence/V85/deployment-diagnosis.md)
remains historical evidence.

Hosted API acceptance later passed the five remaining bounded cohorts (TESTER return 866),
covering 35 distinct scenarios with the retained first 30 successes. The original aggregate
timeout remains recorded; this is not a single successful 35-scenario run. See
[acceptance evidence](build/evidence/V85/README.md#acceptance-return--2026-09-20).
