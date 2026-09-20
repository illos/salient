# V65: Programmatic character verification

Status: implementation and blocker fixes committed on `slice/V65`; both blockers resolved; all 22 remote headless scenarios pass. Rules review: not required for exposing
existing choice/evaluation behavior; ancestry rules acceptance remains with V57/V58/V60/V61.

This fills the supported-route and proof gaps in the
[V24 audit](V24-character-wizard-assessment.md#current-headless-route-audit--2026-09-20).
The user requires bounded verification and subsequently authorized fixing both recorded blockers.
The repair covers the script type error and the public auth-key rate limit identified below.
Browser testing is prohibited by the project-wide moratorium; no browser run is a completion gate.

## Supported route

`pnpm app query characterWizard:discover '{}'` exposes level-qualified definitions, contextual
availability/pools, canonical selections and evaluation. With `characterId`, ownership is checked
and an omitted input selection list uses the saved draft. Unsaved callers may supply selections.
`targetLevel` is limited to implemented definition levels.

`pnpm app query characterWizard:transition '<JSON>'` takes `selections`, `decisionId`, optional
`value`, optional `characterId`/`targetLevel`. Omit value to clear a choice. It returns canonical
selections, removed choices and evaluation without writing. Both wizard and progression now use
its shared `changeChoice` primitive. Persist the returned selection list through existing
`characters:create` / `save`; authored name/appearance/biography/private notes remain their separate
payload. Other existing review, sheet, private-inheritance and progression endpoints are unchanged.

No schema migration, new rules or auth limit change is included. The user subsequently directed
publication and verification on the existing hosted development target. Candidate
starts with combined ancestry source `1e7896c` plus main's headless doctrine/audit. It is not a main
merge and does not certify the four pending ancestries.

## Verification command and boundaries

Run from CT114's named `hosted` environment against Convex Cloud development:

```sh
SALIENT_HEADLESS_ENVIRONMENT=hosted \
SALIENT_HEADLESS_TARGET=https://different-bat-943.convex.cloud \
SALIENT_HEADLESS_SOURCE=<actual-source-commit> \
SALIENT_HEADLESS_REPORT=/artifacts/v65/headless.json \
pnpm test:headless:character
```

Set `VITE_CONVEX_URL` to that target, `VITE_CONVEX_SITE_URL` to
`https://different-bat-943.convex.site`, and `VITE_SITE_URL` to
`https://salient-dev.rdxx.workers.dev`. The runner permits only this exact hosted triple or its
explicit isolated private alternative. It programmatically registers fresh disposable Director, player
and peer accounts and obtains its own sessions; no browser setup/token or direct database patch.
Every tested write uses a public authorized operation, followed by independent reads. Tests use
source-audited V25 inputs and the V60/V61 expected values; discoveries supply real source metadata.

Use focused checks for changed mechanisms, then a bounded live headless pass. Repeat only when
a concrete diagnosis or fix warrants it; do not retry failures blindly. Record compile/deploy/fixture/product failures separately.
Run independent cases after a failed case when safe; dependent cases are explicit skips. The live
runner has 15-second request bounds, a four-minute work budget and a hard stop below five minutes.
A timeout can leave a remotely accepted operation: never retry it blindly. Cleanup revokes owned
sessions; disposable test records remain in the selected development environment. Record actual exit codes.

New backend cases catch unavailable/foreign-owner discovery, missing canonical sources, incorrect
parent cleanup and assignment reset, and bad input bounds. Live cases catch transport/auth failures,
missing saved choices/source projections, incorrect class/ancestry totals, dropped connections,
retry duplication, stale saves, improper review/privacy, private-grant activation, lost live values
on advancement and incorrect restoration/history. They are not wrappers around the evaluator's
own expected output. A passing sampled journey is not exhaustive rules coverage.

The original audit's full parity map remains the scope ledger. Live scenarios include owner/Director/peer paths, owning-Director setup, combat locks,
foreign-history refusal and stale-review handling. Dependency skips and any remaining unexercised
boundaries are reported below. Existing backend coverage remains useful but cannot be relabeled
live proof. The subsequent project-wide browser moratorium supersedes the earlier comparison gate.


## Initial verification — 2026-09-20

Source `c0fe8b1054ec5d6a5db908b1b85163f5f7879889`, committed on `slice/V65`, not merged into main.
The backend was deployed to cloud dev `different-bat-943` with normal Convex typechecking and schema
validation passing; no indexes deleted, no content reseed, no auth configuration change or data reset.
Frontend remains V62 source `1e7896c`, Worker `b9cc5ebb-54a1-4176-bc05-d99051b3cf1e`:
the V65 UI refactor was not published because the app TypeScript gate failed.

| Check | Actual result |
| --- | --- |
| Lint/format and engine checks | Passed, 299 engine tests |
| `pnpm check` | Exit 2 at app TypeScript; later stages did not run |
| Independent app/script test command | Exit 0, 413 tests including all five new route tests; 158.57 seconds |
| Cloud backend deployment | Exit 0; backend TypeScript and schema validation pass |
| Live programmatic character verification | Exit 1; 14 pass, 1 fail, 7 dependency skips in 45.472 seconds |
| Browser tests | Not run |

**Original blocker 1 — compile:** `scripts/headless/character-scenarios.ts:159` produces TS7022 for the
inferred `actual` variable. The standalone Node runner still executes using normal TypeScript
stripping; this does not turn the failed build into a pass. No typecheck was disabled for deployment.

**Original blocker 2 — live assertion:** `lifecycle: admission and audience privacy` failed an assertion.
The report identifies the scenario but does not identify that assertion's source line or operands;
no narrower root cause is claimed. The seven skipped cases are private inheritance, advancement,
history/restoration, owning-Director activation/inheritance, foreign history/restore permissions,
stale full-edit review, and combat edit locks. They are implemented scenarios, not proven behavior.
The harness currently gates owning-Director work on the broader admission case; that dependency
also limits independent coverage after a failure. This limitation is recorded, not repaired here.

Passing live cases prove discovery without creation; complete saved/readback builds for Devil,
Polder, Dwarf and Human; the remaining ancestry purchase witnesses; foreign-owner refusal; parent
replacement; culture/kit/complication edits; incomplete/over-budget evaluation; and characteristic
assignment, retry and stale-write boundaries. Connections text round-trips in all four creation
cases. These are real authenticated public API calls against the remote backend, with no browser
session/setup or database fixture injection.

The initial pass stopped as instructed. The user then explicitly authorized both fixes. Original
logs and actual exit statuses remain in [evidence/V65](evidence/V65/README.md); they have not been
replaced with passing results.


## Authorized blocker repair — 2026-09-20

Commits `76591c9` and `b1f50c8` are on `slice/V65`, not merged into main. The numeric witness now
uses an explicit `unknown` type without changing its assertions. Failure reports retain a safe
scenario source location and nested rejection category/operation, without raw SDK payloads.

The admission failure was not a demonstrated privacy leak: Convex rejected the peer query before
app authorization because fetching `/api/auth/convex/jwks` returned HTTP 429 (`InvalidAuthHeader`).
Isolating lifecycle verification passed admission/privacy, private inheritance, progression,
reviewed restoration and owning-Director activation before later requests hit the same limit.
The exact public `/convex/jwks` route is now exempt from BetterAuth rate limiting; sign-in, signup,
token minting and password-reset protections retain their prior settings. The installed BetterAuth
1.6.15 limiter and Convex plugin 0.12.5 source confirm the exact path and `false` rule semantics.
No permission check, character rule, test expectation, schema or content was changed.

Backend `b1f50c8` deployed to `dev:different-bat-943` with normal typechecking/schema validation.
Independent scoped review passed. Browser testing remains prohibited. The frontend deployment
remains V62 `1e7896c`; these blocker fixes require no frontend publication.

The complete unchanged 22-scenario suite passed against that backend in **73.547 seconds**,
exit 0, with zero failures or skips. This proves the previously blocked lifecycle routes as well as
the four ancestry journeys. See [the final report](evidence/V65/fixed-headless.json). Targeted
formatting, ESLint, app TypeScript and the normal `pnpm build` all passed (exit 0). Broader ancestry acceptance/main integration
remain separate from these two repaired verification blockers.
