# S04 hosted development implementation review

Reviewer: `s04_review`, independent implementation reviewer, 2026-09-17.

Verdict: **pass**. All six S04 acceptance checks are verified by static review and retained CT114
verification evidence. No blocking findings remain. Rules review is not required.

## Scope and references

Reviewed the uncommitted S04 changes on `slice/S04`, based on `3bcd390`, including
`runtime/hosted.mjs`, `runtime/compose.yaml`, `wrangler.jsonc`, `.gitignore`,
`tests/browser/hosting.spec.ts`, the hosted runbook and slice record. Read the unchanged auth
client/server wiring, content reseed boundary and existing journey test to assess the integration.
No gameplay behavior or source pins change.

References read:

- [Hosted targets and data](../../hosted-development.md#targets-and-data).
- [Hosted workflow](../../hosted-development.md#workflow).
- [Hosted verification and recovery](../../hosted-development.md#verification-and-recovery).
- [Remote runtime workflow](../../remote-development.md#workflow).
- [S04 acceptance checks](../S04-hosted-development.md#acceptance-checks).
- [Review standard](../README.md#review-standard) and
  [verification baseline](../README.md#verification-baseline).

The static SPA setting agrees with the official
[Cloudflare routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).
The explicit deployment-key workflow is consistent with the official
[Convex custom-hosting documentation](https://docs.convex.dev/production/hosting/custom).

## Acceptance checks

| Check | Status | Evidence |
| --- | --- | --- |
| 1. Exact authenticated development target; credential boundaries | Verified | Static key-prefix and authenticated-URL guards; [wrong-target refusals](../evidence/S04/key-guards.json); [credential scan and asset guard](../evidence/S04/build-safety.json); [authenticated backend identity](../evidence/S04/backend.json). |
| 2. Backend/auth deployment and matching pinned content | Verified | [Backend readback](../evidence/S04/backend.json) identifies the development URL, 68 functions and hosted auth origin. [Ordinary-user content readback](../evidence/S04/content-status.json) matches all 483 entries and the exact revision/hash in `shared/content/compendium/manifest.json`. |
| 3. Static assets and direct routes, including saved campaign | Verified | [Publish log](../evidence/S04/publish.log), [corrected route test](../evidence/S04/routes-rerun.log), and passing campaign reload in the [account journey](../evidence/S04/browser-initial.log). |
| 4. Signup, sign-out/in, persistence and cross-user changes | Verified | The passing account journey covers signup, membership, sign-out/in, saved campaign/private draft reload and independent browser contexts. The passing table audit supplies [persisted readback](../evidence/S04/table-readback.json) and a [Director screenshot](../evidence/S04/hosted-director.png) for the same campaign. |
| 5. CT114 checks, live journeys and independent review | Verified | [Full check](../evidence/S04/check.log): 274 engine and 389 app/scripts tests, typechecks, content/vendor checks and build. [Hosted browser run](../evidence/S04/browser-initial.log): four existing tests passed. [Route rerun](../evidence/S04/routes-rerun.log): one passed. Final stamp/test changes passed focused ESLint, [formatting and documentation checks](../evidence/S04/final-checks.log). This record supplies independent review. |
| 6. Private main and unrelated Workers preserved | Verified | [Preservation comparison](../evidence/S04/preservation.json) confirms all 26 existing Workers' identity/modification metadata and the recorded private-main runtime state remained unchanged, with main still at `40206a5`. |

## Findings and reviewed safeguards

No blocking findings. One test defect and one publication safeguard were resolved during review:

- **Resolved, medium:** `runtime/hosted.mjs:119` originally allowed an unrelated build to replace
  `dist` between hosted build and publish. The complete asset/target stamp now rejects that case;
  the retained negative probe confirms refusal before Wrangler runs.
- **Resolved, low:** `tests/browser/hosting.spec.ts:9` originally assumed the Foes library had a
  `Foes` heading. It now checks the existing `Search foes` textbox and repeats readiness assertions
  after reload. The initial failure remains visible in the evidence; the focused rerun passes.

Reviewed safeguards:

- `runtime/hosted.mjs` clears inherited Convex target overrides, authenticates against the fixed
  development URL and supplies the selected key only to backend administration subprocesses.
  The build receives public URLs and `VITE_LOCAL_PROXY=false`; credentials are read from a file
  outside source/artifacts and are neither logged nor passed as command arguments by this task.
- `configure` preserves an existing auth secret and removes the private proxy auth override.
  `seed` is explicit and invokes the internal content-only reseed operation. The existing local
  seed guard remains unchanged.
- `runtime/compose.yaml` makes cloud operations a one-off task profile. Ordinary frontend,
  build and browser services do not mount the credential directory. The existing backend config
  mount and shared guest Docker access remain documented; these are not hostile tenant isolation.
- `wrangler.jsonc` fixes the account and Worker and serves static assets with SPA routing. There
  are no custom-domain bindings, production backend selectors or automatic publish hooks.
- The implementing agent added a complete asset hash stamp after identifying that an ordinary
  `pnpm check` could overwrite `dist` with private-runtime assets. Static review confirms the
  preflight compares the complete regular-file set plus target URLs before invoking Wrangler.

## Reproduction limits

This reviewer has not deployed, seeded, changed credentials or independently rerun tests. The
implementation owner ran all workloads on CT114; this review inspected retained logs, JSON
readbacks and the screenshot to avoid overlapping remote workloads. The final focused checks
supplement the earlier full check; a second full check after the stamp/test-only edits is not
claimed. No deployment credentials have been read or printed by this reviewer.

The reviewed running frontend is `https://salient-dev.rdxx.workers.dev`, Worker version
`e5d0f086-0964-4434-92d8-656e7a11276e`, backed by development deployment `different-bat-943`.
The [evidence record](../evidence/S04/README.md) distinguishes unchanged application source at
`3bcd390` from the dirty S04 tooling/test snapshot. The retained
[cleanup result](../evidence/S04/cleanup.json) confirms temporary remote credentials were removed,
the named build services stopped, the selected source/evidence credential scan passed and public
login still returned HTTP 200 with browser headers. Cloudflare rejected a default Python user
agent with code 1010; actual browser acceptance passed. This verdict does not attest to a later
Git integration, which the lead owns at closeout.

Chords startup calls returned an ambiguous provider-session mapping. The lead is handling project
coordination; this reviewer reports findings directly to the lead.
