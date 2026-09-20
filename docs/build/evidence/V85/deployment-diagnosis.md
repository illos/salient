# V85/V86 deployment failure diagnosis

Status: causes confirmed on source `c3cf992`, 2026-09-20. Two temporary changes together pass
Convex deployment dry run. Application changes were restored after the experiment; no actual
publication or API acceptance run is claimed. This investigation did not change CT114 main.

## First failure: inconsistent JSON import attributes

`shared/evaluate/startingItemAbilities.ts` imports `manifest.json` with `with { type: 'json' }`.
Existing `convex/characters.ts` and the generated content index import it without attributes.
The pinned esbuild/Convex 1.45.0 combination reports an annotated metadata input key:
`manifest.json with { type: 'json' }`. Convex's `doEsbuild` metadata loop calls `stat` on that
entire key as a filename, which throws `ENOENT` even though the actual JSON file exists.

The surrounding catch assumes esbuild already printed its error, passes `printedMessage: null`
and discards the exception. That explains the otherwise unexplained exit 1. No credentials,
network timeout or slow server is needed to reproduce this failure.
[Original exception and stack](diagnosis-import-error.log).

A temporary one-line change to match the existing attribute-free manifest imports removes this
failure. It preserves the direct JSON import and does not restore the large content barrel.
The resulting dry run then reaches a separate schema problem.

## Second failure: schema imports runtime authentication

`convex/characterTables.ts` imports `startingRewardsValidator` from `convex/lib/startingRewards.ts`.
That module also imports `requireMember` from `lib/access.ts`, which imports `authComponent` from
`auth.ts`. The schema import graph consequently reaches runtime authentication/component code.
Cloud schema evaluation rejects the emitted dependency import with `NoImportModuleInSchema`:
`Can't import _deps/5GCWYXST.js while evaluating schema`.
[Schema failure after the first temporary correction](diagnosis-schema-error.log).

Moving the validator unchanged into a standalone module that imports only `convex/values`, and
pointing schema/API validator imports to that module, removes the unwanted runtime dependency.
The authorization and reward logic remain in the runtime helper.

## Confirmation and method

Local Presidium runner, Node24.18.0, installed Convex1.45.0; cloud target
`dev:different-bat-943`, <https://different-bat-943.convex.cloud>. Commands used the installed
`node node_modules/convex/bin/main.js deploy --yes --dry-run` and the scoped development key.
A temporary Node preload added exception/stack logging to the in-memory CLI module; installed
packages were not edited. Diagnostic output was credential-redacted before writing artifacts.
The preload adds logging only; it does not change bundling or deployment behavior.

With both temporary application changes, the [dry run passed](diagnosis-dry-run-pass.log),
including bundling, TypeScript and hosted schema validation: exit0, “Would have deployed Convex
functions.” Dry-run upload/validation is not a finalized deployment or a gameplay/API test.
All temporary source changes and generated-binding changes were restored in `finally` blocks;
Git confirmed a clean application tree before this documentation was written.

The earlier 864 passing tests run the shared logic/application harness; the successful production
build targets the frontend. Neither exercises this Convex deployment metadata/schema path.
The identified causes explain the hosted failure. The earlier CT114 startup may share the same
bundling problem, but that environment was not rerun, so its cause is not independently confirmed.

## Next bounded work

Apply the two demonstrated source changes, verify relevant Node-runner/shared tests as well as
the Convex deployment route, then complete the already-requested hosted deployment and existing
35-scenario authenticated API suite. No CLI upgrade, timeout increase, infrastructure repair,
content reseed or data reset is required by the evidence. Do not repeat the source audits or
claim API acceptance from this dry run.
