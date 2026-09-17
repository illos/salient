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

Run checks/builds and Playwright only on CT114. Browser tests set `SALIENT_TEST_URL` to the Worker URL
and `VITE_CONVEX_URL` / `VITE_CONVEX_SITE_URL` to the matching cloud URLs for CLI readback. Use fresh
test users; do not reset private main. Verify sign-out/in as well as signup, reload saved deep links,
and observe real-time changes across separate browser contexts.

Record source commit, Worker version, backend/content status and test evidence in
[S04](build/S04-hosted-development.md). For a failed initial deployment, retain the existing private
development URL. Later releases can redeploy the previously recorded frontend source and compatible
backend; do not reset data as a rollback. Verify schema compatibility before rolling backend code back.

## Account email

V39 prepares password-reset delivery from `salient@blackgate.studio` through Cloudflare Email Service.
Use an email-only token for Blackgate Studio with **Email Sending: Edit**, supplied through the secret
broker, and set it as **backend** `CLOUDFLARE_EMAIL_API_TOKEN` on `dev:different-bat-943`. Never use a
`VITE_` variable or place it in the frontend build. The deployment token currently available for S04
is active but the email API rejects it; no sending credential has been installed yet.

The configured `SITE_URL` supplies the reset-link origin. No frontend key is needed. Recovery UI is
available only when backend mail configuration exists. To disable new recovery requests, remove the
email token; issued tokens keep their normal 30-minute validity. Existing auth, game data and content
need no reseed. Internal mail failures contain only a sanitized category/HTTP status; inspect those
and Cloudflare Email Service delivery logs for operations. Avoid blind retries after ambiguous network
failures: request a new reset link through the UI instead.

Before activation, verify the sender domain is ready and exercise a reset with an operator-selected
inbox. Confirm received sender/link, reset, old-password rejection, fresh sign-in and session revocation.
Do not equate Cloudflare's queued acceptance with inbox delivery. See [V39](build/V39-account-email.md)
for the validation record and remaining activation blocker.
