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
The table browser-testing moratorium applies here too; the user's 2026-09-22 clarification
allows focused non-table browser investigations through TESTER. Programmatic API tests set `VITE_SITE_URL` to the
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


## Current release — V179 granted defenses

Backend/frontend source `392d236292c299497151f7a2da7301e7f00e773d` published on 2026-09-25 as
Worker `d29fda21-1978-45c7-8541-8c0f084e2ce2`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V179](build/V179-granted-defenses.md) and
the [ledger](../deploy.md).

## Previous release — V178 immunity and weakness

Backend/frontend source `eeaa9920a6338b6b60f4343b420450e1f1ac26c4` published on 2026-09-25 as
Worker `a1debfdf-a8fb-4bcc-9347-3ed4bb026ef3`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V178](build/V178-immunity-weakness.md) and
the [ledger](../deploy.md).

## Previous release — train 19 (V189, V190)

Backend/frontend source `36a5e179b0cf4b892b42ab6b2a75c2dc27a8bc56` published on 2026-09-25 as
Worker `c076ef27-2f91-4988-a279-2f9332cf3110`: view-only build history and campaign XP per level. Backend and schema validation, the
hosted build and the upload succeeded. Content remains the 1881-entry snapshot, so no reseed was
needed. See the [ledger](../deploy.md).

## Previous release — V177 damage-type options

Backend/frontend source `64b521edbc21c811e7a42357af02cb699d184d1e` published on 2026-09-25 as
Worker `c56d0334-acbf-4712-b599-3200983d92c2`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V177](build/V177-damage-type-options.md) and
the [ledger](../deploy.md).

## Previous release — V176 forced-movement follow-ups

Backend/frontend source `408dd11b6c6b6430b7ac09224ef1c70c7c640f6c` published on 2026-09-25 as
Worker `713636cf-0683-4b09-981d-cfe7997ec946`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V176](build/V176-forced-movement-followups.md) and
the [ledger](../deploy.md).

## Previous release — train 17 (V159 fix, V170–V175)

Backend/frontend source `04013505e72e990a9a75fe3e3fb703b2f8bc22f0` published on 2026-09-25 as
Worker `7db282ef-874d-4898-83e7-fad8a9c28cfd`: Talent Strained, watchers, next-turn durations, triggered actions, damage reactions
and Marks. Backend and schema validation, the hosted build and the upload succeeded. Content remains
the 1881-entry snapshot, so no reseed was needed. See the [ledger](../deploy.md).

## Previous release — V188 follow-up ability text

Backend/frontend source `75885cb35d4300f872dc8f8818fb273e0c0e4180` published on 2026-09-25 as
Worker `dbb5720a-6982-489d-8d59-56d2e465769a`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V188](build/V188-follow-up-ability-content.md) and
the [ledger](../deploy.md).

## Previous release — V185 build history page

Backend/frontend source `f2160c355efa143e100fa7de857e76a165d80033` published on 2026-09-25 as
Worker `00525f22-e999-4002-b0b0-89ed1a0e7465`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V185](build/V185-build-history.md) and
the [ledger](../deploy.md).

## Previous release — V184 level-up diagnostics

Backend/frontend source `887f44892a06be30c759d5e2f610595a2ac7a013` published on 2026-09-25 as
Worker `5a9f67c6-9c3e-4270-8f6d-e739420dc105`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V184](build/V184-level-up-stale-diagnostics.md) and
the [ledger](../deploy.md).

## Previous release — V181 level-up dependent choices

Backend/frontend source `bd4f0cca6fe13ebec0970d0a63f347af7c4dc5a9` published on 2026-09-25 as
Worker `6371fbe2-18a0-4c93-8e05-e69de06273a9`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V181](build/V181-level-up-dependent-choices.md) and
the [ledger](../deploy.md).

## Previous release — train 12 (V180, V09 part a)

Backend/frontend source `111848900476d623577b8d3552c7ef8d4d2f3d17` published on 2026-09-25 as
Worker `74d47264-33a5-44ce-a544-73c36de159c4`: the headless journey split and the Forge character import. Backend and schema
validation, the hosted build and the upload succeeded. Content remains the 1881-entry snapshot, so no
reseed was needed. See the [ledger](../deploy.md).

## Previous release — V164 level-up screen

Backend/frontend source `6686fbee51df636ba590546088e457288678fe4f` published on 2026-09-25 as
Worker `0b1c92f9-495a-4ad9-bcfc-9d43a57191f8`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V164](build/V164-level-up-screen.md) and
the [ledger](../deploy.md).

## Previous release — V167 respite table controls and V169 Rapid Processing

Backend/frontend source `59b890c21fd7b8e1d53ce7d70478873502b82b7f` published on 2026-09-25 as
Worker `089b650b-6979-4377-9527-34bf19876d72`. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1881-entry snapshot, so no reseed was needed. See the [ledger](../deploy.md).

## Previous release — V157 abilities without a power roll and V158 effect instances

Backend/frontend source `6632e95def1e4797c504e3ab79a51fb9bc3d29b2` published on 2026-09-25 as
Worker `c594c5db-1402-41a2-b460-d3efe7352912`. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1881-entry snapshot, so no reseed was needed. See the [ledger](../deploy.md).

## Previous release — V168 Field Arsenal kit lock during respite

Backend/frontend source `79fc25f401ec2c9a1e467396cd772a660fec2138` published on 2026-09-25 as
Worker `d48f300d-6adb-45aa-8841-74446a53ffa9`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V168](build/V168-field-arsenal-lock.md) and
the [ledger](../deploy.md).

## Previous release — V165 respite loop and V166 respite activities

Backend/frontend source `1811a3f030bccb39290d02fcb77095a33f202803` published on 2026-09-25 as
Worker `d2a08201-500d-4593-8405-21075ed16284`. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1881-entry snapshot, so no reseed was needed. See the [ledger](../deploy.md).

## Previous release — train 8 (V155, V156)

Backend/frontend source `d266437b69f2f2f1c16693e547eda6f004a81c71` published on 2026-09-25 as
Worker `dd30feb0-bf87-4f0d-b420-03b67b68cced`: can't-stand and the Shadow insight edge discount. Backend and schema validation, the
hosted build and the upload succeeded. Content remains the 1881-entry snapshot, so no reseed was
needed. See the [ledger](../deploy.md).

## Previous release — V162 current values and V163 level-up

Backend/frontend source `b724eea9fc51a9c613aaa96b4b424aa1c8908456` published on 2026-09-25 as
Worker `ea49dd4d-0946-43ce-8e65-25bb1c7f270d`. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1881-entry snapshot, so no reseed was needed. See the [ledger](../deploy.md).

## Previous release — train 7 (V152, V153, V154, V160)

Backend/frontend source `4b8779941ac57ad766f78b956d513faa6e9553ec` published on 2026-09-25 as
Worker `bde8df86-9a57-4299-87f1-b6b564085f9f`: table-work effect riders, compound tier conditions and tier instructions (143 compiled
abilities), and the Talent resource note. Backend and schema validation, the hosted build and the
upload succeeded. Content remains the 1881-entry snapshot, so no reseed was needed. See the
[ledger](../deploy.md).

## Previous release — V151 follow-up actions and V138 Summoner levels two and three

Backend/content/frontend source `b0f7c53f52b48b64b3442d90672d725d891da330` published on 2026-09-25 as
Worker `5aee5766-b59e-4552-a208-839d72d73dbb`. Backend and schema validation, the content reseed (1881 entries at `fb83a789`), the
hosted build and the upload succeeded. The tip passed the full gate and headless journeys before
merge, with no smoke test. See the [ledger](../deploy.md).

## Previous release — party read-limit fix

Backend/frontend source `9240044e4be4516ac13cf798670b3c6e6f901bb1` published on 2026-09-25 as
Worker `509f7b29-b09f-46ce-838a-0e7de40c2865`: combat commit and finish read each hero once, keeping large parties under Convex's
per-function read limit. Backend and schema validation, the hosted build and the upload succeeded.
Content remains the 1852-entry snapshot, so no reseed was needed. See the [ledger](../deploy.md).

## Previous release — resource train 4 (V144, V147, V149, V148)

Backend/frontend source `71a3fa5053e753ef98f380f90f9faae52d0a0023` published on 2026-09-25 as
Worker `e7cd0093-3a28-400a-8853-df89561e8a77`: automatic Null, Conduit, Troubadour and Elementalist heroic resources, completing all
eleven classes. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1852-entry snapshot, so no reseed was needed. The tip passed the full gate and headless
journeys before merge, with no smoke test. See the [ledger](../deploy.md).

## Previous release — resource train 3 (V141, V143, V146, V142)

Backend/frontend source `7e9f7317088f6db0c8b93750d4a790eeb4607aa0` published on 2026-09-25 as
Worker `35639817-fb01-4132-9428-728b6512c8ec`: automatic Summoner, Beastheart, Talent and Fury heroic resources. Backend and schema
validation, the hosted build and the upload succeeded. Content remains the 1852-entry snapshot, so no
reseed was needed. The tip passed the full gate and headless journeys before merge, with no smoke
test. See the [ledger](../deploy.md).

## Previous release — merge train 2 (V134, V136, V137)

Backend/content/frontend source `ca5f562bb0eee8e7e84984c976d76d483b53d959` published on 2026-09-25 as
Worker `d097d610-cf1f-4dcd-8ce5-9096cfd765b2`: Conduit, Talent and Beastheart levels two and three. Backend and schema validation,
the content reseed (1852 entries at `fb83a789`), the hosted build and the upload succeeded. The tip
passed the full gate and headless journeys before merge, with no smoke test. See the
[ledger](../deploy.md).

## Previous release — merge train 1 (V135, V140, V145)

Backend/content/frontend source `764695471245f02c56ae579adb42dd12fe1375d9` published on 2026-09-25 as
Worker `5224599e-bc2e-40c5-9330-546ea0feae12`: V135 Elementalist levels two and three, V140 Tactician focus generation and V145
Censor wrath generation. Backend and schema validation, the content reseed (1775 entries at
`fb83a789`), the hosted build and the upload succeeded. The combined tree passed the full gate and
headless journeys before merge, with no smoke test. See the [ledger](../deploy.md).

## Previous release — V150 Self-Taught forgo

Backend/frontend source `fad564fc6cd877031b501ef08b9771af2456f878` published on 2026-09-25 as
Worker `e6b75c20-07d3-4d41-bc8c-d75576303b1d`. Backend and schema validation, the hosted build and the upload succeeded.
Content is unchanged, so no reseed was needed. Accepted TESTER results were reused, with no smoke test. See [V150](build/V150-self-taught-forgo.md) and
the [ledger](../deploy.md).

## Previous release — V133 Null levels two and three

Backend/content/frontend source `b99b951784bd235b16174f507a8144929e89d262` published on 2026-09-25 as
Worker `99cbb3c1-fad8-4f35-8715-1c94905601b6`. Backend and schema validation, the content reseed (1751 entries at
`fb83a789`), the hosted build and the upload succeeded. The combined V133 and V120 tip passed the
full gate and headless journeys before merge, with no smoke test. See
[V133](build/V133-null-level-three.md) and the [ledger](../deploy.md).

## Previous release — V120 heroic resource generation engine

Backend/frontend source `f3acd97ce5a58c8a68df3d52e04a9852673ce4a1` published on 2026-09-25 as
Worker `3d6cb3e2-2c3c-4cec-8d5c-83ec1a5c4a73`. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1732-entry snapshot, so no reseed was needed. Accepted TESTER results were reused, with
no smoke test or rerun. See [V120](build/V120-heroic-resource-engine.md) and the
[ledger](../deploy.md).

## Previous release — V132 Troubadour levels two and three

Backend/content/frontend source `c3f9e353432a274ce7c7f22b5db734ef6e18bfc7` published on 2026-09-25 as
Worker `1d9acb09-8147-4839-911e-bbb6664df299`. Backend and schema validation, the content reseed (1732 entries at
`fb83a789`), the hosted build and the upload succeeded. Accepted TESTER results were reused, with
no smoke test or rerun. See [V132](build/V132-troubadour-level-three.md) and the
[ledger](../deploy.md).

## Previous release — V117 Censor levels two and three

Backend/content/frontend source `2dcbf978bbf763825c71e5a4a598963f1cbab52f` published on 2026-09-25 as
Worker `18bbb949-22f5-4349-8083-305f3b96defa`. Backend and schema validation, the content reseed (1708 entries at
`fb83a789`), the hosted build and the upload succeeded. The combined V117 and V119 tip passed the
full gate and headless journeys before merge, with no smoke test. See
[V117](build/V117-censor-level-three.md) and the [ledger](../deploy.md).

## Previous release — V119 grabs, Escape Grab and Stand Up

Backend/frontend source `3c02939f3b71bec8a4a80427ddd971e72a972087` published on 2026-09-25 as
Worker `28a58465-a6d3-4879-93d6-72dcc190d2ca`. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1687-entry snapshot, so no reseed was needed. Accepted TESTER results were reused, with
no smoke test or rerun. See [V119](build/V119-grab-lifecycle.md) and the [ledger](../deploy.md).

## Previous release — V115 kit bonus correctness and known condition immunity

Backend/frontend source `4cc7f3175b0d4557783b47f3ce7189cd21126694` published on 2026-09-25 as
Worker `690a35fd-e0b8-4b32-86f8-049f6dddb099`. Backend and schema validation, the hosted build and the upload succeeded. Content
remains the 1687-entry snapshot, so no reseed was needed. Accepted TESTER results were reused, with
no smoke test or rerun. See [V115](build/V115-kit-bonus-correctness.md) and the
[ledger](../deploy.md).

## Previous release — V116 Tactician levels two and three

Backend/content/frontend source `3175606b82eb0f8505c480a08a997e96b7e35d02` published on 2026-09-25 as
Worker `d603e11b-f449-4f84-88fa-daf498a8ddd6`. Backend and schema validation, the content reseed (1687 entries at
`fb83a789`), the hosted build and the upload succeeded. Accepted TESTER results were reused, with
no smoke test or rerun. See [V116](build/V116-tactician-level-three.md) and the
[ledger](../deploy.md).

## Previous release — V114 Fury levels two and three

Backend/content/frontend source `3aa24aed75ec7b33db94dabf8ab0690a678f9298` published on 2026-09-25 as
Worker `283ae7db-6658-40c3-9007-d02a79ad9978`. Backend and schema validation, the content reseed (1669 entries at
`fb83a789`), the hosted build and the upload succeeded. Accepted TESTER results were reused, with
no smoke test or rerun. See [V114](build/V114-fury-level-three.md) and the [ledger](../deploy.md).

## Previous release — V113 compiled tier forced movement, EoT and prone conditions

Backend/frontend source `bd6e8e4d85a00072a0f1f318b26b14269969ca07` published on 2026-09-25 as
Worker `5d0f8637-0103-430d-b260-6b29072da6c2`. Backend and schema validation, the hosted build and
the upload succeeded. Content remains the 1654-entry snapshot, so no reseed was needed. Accepted
TESTER results were reused, with no smoke test or rerun. See
[V113](build/V113-compiled-tier-effects.md) and the [ledger](../deploy.md).

## Previous release — V110 compiled multi-target and area abilities

Backend/frontend source `2921a57f994f6ce2b3da2713123967b69a33c6ae` published on 2026-09-25 as
Worker `ed93b686-8a97-4cd9-9eed-7e38d6fc4012`. Backend and schema validation, the hosted build and
the upload succeeded. Content remains the 1654-entry snapshot, so no reseed was needed. Accepted
TESTER results were reused, with no smoke test or rerun. See
[V110](build/V110-compiled-multi-target.md) and the [ledger](../deploy.md).

## Previous release — V109 Effect riders and kit signatures

Backend/frontend source `7d82b594181e22dfcd1ba108cc41a930d83ebf5e` published on 2026-09-22 as
Worker `afc19386-cef9-48b7-9979-748a9456ddca`. Backend/schema validation, hosted build and upload
succeeded. Content remains V108's 1654 entries; no reseed needed. Accepted TESTER results reused;
no smoke test or rerun. See [V109](build/V109-compiled-effect-riders.md) for manual rider boundaries
and the [ledger](../deploy.md).

## Previous release — V108 Shadow through level six

Backend/frontend source `8744738c24003d2794f24cb5ef1637472665c26d` published on 2026-09-21 as
Worker `bcdeafc0-9b86-4fde-b3b4-c163b7a98a66`. Backend/schema validation, content reseed
(1654 entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test
or rerun. See [V108](build/V108-shadow-level-six.md) for manual boundaries and the [ledger](../deploy.md).

## Previous release — V107 Summoner level one

Backend/frontend source `ca190a99f9a0b895d394e1df7cbce464e7bc95ce` published on 2026-09-21 as
Worker `e8b28ff3-da63-418d-904a-75be2a543d03`. Backend/schema validation, content reseed
(1629 entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test
or rerun. Summoned-creature combat remains manual. See [V107](build/V107-summoner-level-one.md)
and the [ledger](../deploy.md).

## Previous release — V106 Beastheart level one

Backend/frontend source `34a8b483ec71065e48aaa132c77acc796879c8e9` published on 2026-09-21 as
Worker `e0c83bf3-190c-466b-a623-5b2cc46bcc4d`. Backend/schema validation, content reseed
(1561 entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test
or rerun. Companion combat remains manual. See [V106](build/V106-beastheart-level-one.md)
and the [ledger](../deploy.md).

## Previous release — V105 Talent level one

Backend/frontend source `465814b17640852055d40b7a47614f658779b95a` published on 2026-09-21 as
Worker `ef7da151-f04d-4bc8-8532-12aedb937290`. Backend/schema validation, content reseed
(1483 entries), hosted build and upload succeeded. Accepted TESTER results reused; no smoke test
or rerun. See [V105](build/V105-talent-level-one.md) and the [ledger](../deploy.md).

## Previous release — V104 Elementalist level one

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
