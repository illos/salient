# V41/V43 hosted publication — 2026-09-19

The user authorized publishing the already-reviewed, integrated performance changes. Runtime source:
`944a46ab7b05059d22d8403634867de56462e209`, pushed to `origin/main` without rewriting history.
The release-record commit contains documentation/evidence only and needs no runtime redeployment.

| Component | Published target |
| --- | --- |
| Frontend | [salient-dev](https://salient-dev.rdxx.workers.dev) |
| Worker version | `7e86903b-5f7c-46a8-8d68-540f8f21991f` |
| Convex Cloud | development `different-bat-943` |
| Build and browser host | CT114, named `hosted` environment |

## Deployment and checks

- [GitHub CI](https://github.com/illos/salient/actions/runs/35449241724) passed the complete
  `pnpm check` and pushed-commit metadata checks for the exact source: 274 engine + 407 app/script
  tests = **681**. [Retained CI summary](ci-summary.log).
- [Hosted build](build.log) passed, emitting **160,778 gzip bytes** of initial JavaScript against
  the audit baseline's 458,779 bytes (about 65% less). This is a build-size comparison, not a new
  hosted latency measurement.
- [Backend deployment](backend.log) validated the schema, added the three history indexes and
  deleted no indexes. Authenticated metadata shows 72 functions after deployment (70 before),
  including the bounded-history public status/prepare and internal backfill functions.
  [Safe deployment metadata](deployment.json) contains environment names, never values.
- [Frontend deployment](frontend.log) published the version above with the verified hosted build.
  No auth configure, reset or content reseed was run. Existing cloud/private data and credentials
  were retained. The shared CT114 main environment was not modified by this publication.

## Live browser verification

The browser and CLI helpers targeted the public Worker and matching Convex Cloud URLs, not the
private CT114 preview. The initial batch passed all **14 public reference scenarios**, covering
Rules/Foes navigation, lazy content, search, cache headers, progressive large articles, anchor
prioritization and fetch failures/retries. [Initial batch log](browser.log).

The initial two authenticated cases failed at fixture setup because the CLI inherited the private
preview's `VITE_SITE_URL`. Explicitly setting that variable to the public Worker fixed the origin.
The corrected account/session/private-draft/reconnect journey passed. The table fixture then hit
login rate limiting, as did an isolated unchanged retry: its CLI creates a new authentication
session for each of the four admission operations. [Corrected authenticated batch](authenticated.log)
and [isolated unpaced attempt](table-unpaced.log) retain those failures.

The final table run spaces each fixture CLI invocation by 21 seconds in a temporary runner-only
copy of `tests/browser/local-fixtures.ts`, restored on exit. No application source, backend rate
limit or table assertion changes. The pacing addresses test setup and is excluded from any app
latency claim. The run retains the regular test and all its assertions:

```sh
SALIENT_TEST_URL=https://salient-dev.rdxx.workers.dev \
VITE_SITE_URL=https://salient-dev.rdxx.workers.dev \
VITE_CONVEX_URL=https://different-bat-943.convex.cloud \
VITE_CONVEX_SITE_URL=https://different-bat-943.convex.site \
VITE_LOCAL_PROXY=false \
pnpm exec playwright test tests/browser/table-performance.spec.ts \
  --output=/artifacts/v43-hosted-table-paced --reporter=line
```

The temporary pacing is `await new Promise(resolve => setTimeout(resolve, 21000));` at the
start of the fixture's `cli` helper. No deployed or committed executable file was changed.

**Final table: passed in 2.1 minutes**, including fixture pacing. All 16 distinct selected hosted
scenarios have therefore passed across the recorded attempts. The table assertions verified six
foes and one hero; no initial per-card full-detail reads; concurrent log/history/roster subscriptions;
unchanged document origin across Log/Rolls; on-demand foe and hero sheets; Stamina 9 → rewind 15 →
redo 9 → reload 9; and no visible alert. [Passing log](table-paced.log),
[table screenshot](table-summary.png), [subscription metadata](subscriptions.json).

The initial roster result was 3,454 JSON bytes and history status 336 bytes in this fixture.
Log/history/roster subscriptions started at the same recorded millisecond; their first results
arrived 116–117 ms later. These are single-run subscription observations, not complete page-load
latency or a statistical before/after claim. Metadata records only phase, path, time and result
size, without authentication frames or gameplay payloads.

The temporary helper was restored; its remote/local SHA-256 both equal
`cad1812960f796ba117063a8f5fdfc8cecb8d3bf16e4c8f9f48894fdccabc0b2`.
Temporary cloud credentials were removed and their absence verified. The owned CT114 hosted test
stack is stopped with volumes retained; public Cloudflare/Convex Cloud services remain live.

## Limits

These are deployment and behavior checks, not a repeated statistical hosted latency benchmark.
The first full-text index still requires download/deserialization; oversized articles use progressive
static requests, not server-rendered streaming. The existing full mutation history validator and
near-limit warnings recorded in [V43's original evidence](../README.md) remain follow-up work.
Failed setup runs can leave disposable test accounts/campaigns; no existing user data was deleted.
