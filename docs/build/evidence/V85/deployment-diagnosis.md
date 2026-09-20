# V85/V86 deployment failure diagnosis

Status: resolved in application `86e9d2e`; TESTER passed full checks and actual hosted deployment.
The current API acceptance blocker is the aggregate runner budget; see [remaining proof](README.md#remaining-hosted-proof).
Causes originally confirmed on source `c3cf992`, 2026-09-20. Two temporary changes together pass
Convex deployment dry run. Application changes were restored after the experiment. The permanent correction now uses the
standalone validator and removes the shared helper’s JSON dependency entirely; TESTER owns
verification of the new committed candidate. No actual publication or API acceptance run is claimed. This investigation did not change CT114 main.

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

## Permanent correction and TESTER return

Candidate `b08ebcd` applied the consistent attribute-free manifest import and extracted the
unchanged validator to `convex/startingRewardValidators.ts`. TESTER’s focused engine6/app5 checks
passed, but integrated `pnpm check` failed at NodeNext typechecking with TS1543: the shared helper’s
JSON import requires an import attribute. The earlier dry-run used Convex’s separate typecheck;
it did not prove the repository’s NodeNext check. No deployment or API suite was run on `b08ebcd`.
TESTER retains the report on main at `docs/build/evidence/V85/tester-job-b08ebcd.md`, and raw
artifacts at `/srv/presidium/projects/salient/test-artifacts/V85-V86-b08ebcd-20260920T1428Z`.

The replacement correction removes the JSON import from `startingItemAbilities.ts` entirely.
The helper now requires `compendiumRevision: string`; its two existing backend callers,
`convex/characters.ts` and `convex/lib/resolve.ts`, pass `manifest.compendium.revision` from their
existing imports. This preserves source provenance without duplicating a pin, importing the full
content barrel into the helper, changing TypeScript settings, or patching Convex tooling.
The pure schema validator extraction remains intact; runtime authorization/reward logic is unchanged.

WIZARD submits a new frozen commit/job superseding `test-V85-V86-b08ebcd-2`. No new checks,
builds, dry runs or tests were executed by WIZARD. TESTER owns the focused checks, the integrated
repository check, deployment validation and hosted 35-scenario API proof. Neither static review
nor the earlier temporary dry run substitutes for those distinct gates. No timeout increase,
infrastructure repair, content reseed or data reset is indicated by this source correction.
