# V65: Programmatic character verification

Status: implementation prepared; first verification pending. Rules review: not required for exposing
existing choice/evaluation behavior; ancestry rules acceptance remains with V57/V58/V60/V61.

This fills the supported-route and proof gaps in the
[V24 audit](V24-character-wizard-assessment.md#current-headless-route-audit--2026-09-20).
The user explicitly requires bounded verification: record blockers, do not implement fixes or rerun
failed tests. No browser tests in this slice. Do not expand into auth/runtime repairs.

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

One pass only: focused route tests and existing character/backend checks, then the live headless
runner if the backend is available. Record compile/deploy/fixture/product failures separately.
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

The original audit's full parity map remains the scope ledger. Initial live scenarios cover the
ordinary owner/Director/peer paths. Explicit remaining coverage gaps must be reported, including
any owning-Director branch, combat lock, cross-character restore, private-write abuse or other
boundary not exercised in this run. Existing backend coverage remains useful but cannot be relabeled
live proof. Do not demote browser testing on the strength of these results alone.
