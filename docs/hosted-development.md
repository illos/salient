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


## Character deployment checkpoint — 2026-09-20

The latest recorded successful hosted character deployment is V82 source
`8d5559fc87f18f4ed4112f4effc2cafaa3809739`, Worker `ff4da11e-6772-4e3c-bdd4-afd2fc88b000`,
with 567 reference entries, retained play data, and 28/28 hosted API scenarios passing.
See [V82 evidence](build/evidence/V82/README.md). Later V83/V84 delivery updated CT114 main;
that did not update this separate hosted demo.

The user explicitly requested V85/V86 verification on this hosted demo. Deployment of candidate
`b161a7bb375e28c5777801c65553559289d270f8` from a local runner reached the correct development
target but the Convex CLI exited 1 before reporting a successful upload, without an underlying
error message. Two bounded diagnostic repeats confirmed normal exit 1 and its `flushAndExit`
call site; neither explains the cause. The hosted frontend build passed but was not published
because backend deployment did not succeed. No API acceptance run, content reseed, data reset,
configuration change or infrastructure repair followed. This is separate from the earlier CT114
isolated startup timeout. [V85/V86 evidence](build/evidence/V85/README.md#hosted-cloud-demo-attempt)
retains the logs and remaining gate; do not claim this candidate is deployed.
