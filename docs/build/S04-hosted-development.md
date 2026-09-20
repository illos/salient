# S04: Hosted development environment

| Field | Value |
| --- | --- |
| Family | S |
| Milestone | V1 |
| Owner type | App lead |
| Rules review | not required |
| Depends on | S03, V38 |
| Unblocks | Shared public development testing |
| Status | see `STATUS.md` |

## Goal

Publish the current Salient application to a dedicated Cloudflare Worker backed by the supplied
empty Convex development deployment, preserving the private CT114 environment and its data.

## Spec references

- `docs/hosted-development.md#targets-and-data` — explicit hosted targets and data separation.
- `docs/remote-development.md#workflow` — CT114 execution and secrets boundaries.

## In scope

- Blackgate Studio static SPA hosting, direct Convex Cloud connectivity and cross-domain auth.
- Explicit backend configuration/deploy, content seed, frontend build/publish and repeatable runbook.
- Actual public HTTPS signup/login, save/reload, shared updates and deep-link verification.

## Out of scope

Private play-data/account migration, production deployments, custom domains, paid-plan changes,
automatic deployment pipelines, gameplay changes and unrelated Workers.

## Inputs and dependencies

Main `3bcd390` includes V38; private runtime implementation `40206a5` already passed its checks.
New-session credentials contain `dev:different-bat-943` and the Blackgate Studio account token.
No fixture backend replaces the actual hosted acceptance target.

## Deliverables

`wrangler.jsonc`, explicit `runtime/hosted.mjs` task, Compose task profile,
`docs/hosted-development.md` and hosted verification evidence.

## Acceptance checks

1. Authenticated target readback identifies the exact development URL; all task commands reject
   another deployment key. Credentials remain outside source, browser bundles and evidence.
2. Backend deploys with auth configuration; pinned content loads and authenticated reads match.
3. Static assets and direct navigation to `/login`, `/rules`, `/foes` and a saved campaign work.
4. Fresh users sign up, sign out/in, save and reload state, and observe another user's changes.
5. Full `pnpm check` and applicable live browser journeys pass on CT114; independent review passes.
6. Private CT114 main and unrelated Cloudflare Workers remain unchanged.

## Ability design and playtest evidence

Not applicable; no mechanics changed.

## Rules research

None.

## Open questions

None.

## Work log

- 2026-09-17: User assigned deployment and requested Chords handoff. Received target/access details
  from the Live Dev Environment Blockers thread; verified actual injected credentials independently.
  Convex authenticated cloud URL matches, with zero functions and environment variables. Cloudflare
  account token is active; account listing identifies Blackgate Studio; existing Workers were
  enumerated and none is named `salient-dev`. Workers subdomain is `rdxx`. Pages access is unavailable;
  Workers static assets fits this SPA and the granted access.
- Branch `slice/S04`, worktree `/srv/presidium/projects/salient/hosting`, named CT114 `hosted` environment.
  All builds/dependency installation/browser work remains remote. Existing cloud/local seeding
  boundaries remain unchanged. Remote credentials are a selected mode-0600 file under the hosted
  config directory, read by the explicit hosted task; ordinary build/browser/web tasks do not mount
  config. The existing local backend config mount and shared guest Docker access retain their
  documented boundaries. No original `.env.local` is copied.
- The existing broker rejects a sibling-worktree cwd. A temporary local wrapper preserves the
  helper's hosting source archive/identity, launching only its SSH subprocess from canonical code
  cwd, as documented in previous V33 work. No installed helper or broker policy is modified.

- Full `pnpm check` passed on CT114: 274 engine + 389 application/script tests (663 total),
  lint/types, content inventories, vendor pins, 231 documentation links and build. The later build
  stamp and final route-test correction passed focused ESLint/Prettier and all 233 documentation
  links; production/wrong-dev synthetic keys and altered build assets were refused before writes.
- Hosted auth configured and existing backend deployed successfully to development
  `different-bat-943`; internal content seed loaded 483 entries. Authenticated ordinary-user readback
  matches the exact source revision and manifest hash. No application/backend source changes.
- Frontend published as Worker `salient-dev` in Blackgate Studio, version
  `e5d0f086-0964-4434-92d8-656e7a11276e`, at <https://salient-dev.rdxx.workers.dev>.
  Four existing real hosted browser journeys passed in 4.4 minutes: account lifecycle/reload and
  multiplayer, three-role table/CLI audit, supporting choices, private inheritance. The new
  direct-route test initially used a nonexistent Foes heading; corrected to the actual search
  control, then passed unchanged hosting behavior in 6.6 seconds, including reload and page errors.
- [Evidence](evidence/S04/README.md) retains the failed assertion and passing rerun, build/publish
  logs, target/content/state readbacks, screenshot, secret scans and preservation comparison.
  Independent [S04 review](reviews/S04-hosted-development-review.md): **pass**, all six acceptance
  checks verified, no blockers, no rules review required.
- All 26 unrelated Cloudflare Workers retain their metadata. CT114 private main retains its exact
  recorded runtime state and implementation `40206a5`; no private data migration/reset or runtime
  update. The hosted slot's temporary anonymous services are stopped and its selected cloud
  credential file is removed. Public browser access remains functional after cleanup.
- Integrating the reviewed optional deployment tools, test and documentation into main does not
  alter the running application/backend or default private services, so no private runtime rollout
  is needed. Cloud release evidence above records the separately authorized external deployment.
- Final five changed Markdown files pass link/anchor checks. A local full-link attempt could not
  resolve this worktree's uninitialized vendor directories; the full 233-file check passed on
  CT114 with the populated pinned sources. No source pin or link was changed to hide that difference.
- Reviewed implementation/evidence commit `4ba33d9cb588` fast-forwarded into main after the complete
  branch commit gate passed. No conflicts or post-review executable edits. Hosted Worker version
  and backend remain as verified above; private main requires no update for this optional tooling.

## Hosted development publication — 2026-09-19

The user subsequently authorized remote publication. Source `944a46ab7b05059d22d8403634867de56462e209`
was pushed to `origin/main` and deployed to Convex Cloud development `different-bat-943` and
Cloudflare Worker `salient-dev`, version `7e86903b-5f7c-46a8-8d68-540f8f21991f`.
Existing cloud data, auth settings and content were retained; no reset, reseed or auth reconfiguration
was performed. GitHub CI passed all 681 tests and the complete check suite.
See [hosted deployment evidence](evidence/V43/hosted/README.md) for live verification and limitations.
This supersedes the earlier unpublished status; the shared CT114 runtime was not changed by this publication.

## Integrated publication — 2026-09-20

Executable source `a0a700af77740879e214c064876e277219f0f441` is now published to both
Convex `dev:different-bat-943` and Worker `salient-dev`, version
`0336f2f4-1141-4d95-8bc6-d2cec63f8797`. The content-only reseed loaded the committed 1151 entries.
The initial scoped-key denial was resolved by the successor DEPLOY2 session; no play-data reset
or backend repeat was needed. Temporary credentials were removed.
TESTER's [live certificate](evidence/V85/tester-job-a0a700a-hosted-live.md) passes the exact manifest,
438-foe catalog and Ghoul persistence, two character cohorts and real-dice V88 condition/save
cleanup. The [deployment ledger](../../deploy.md) records GitHub closeout identity.
Browser verification remains suspended under the project moratorium.
