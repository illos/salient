# V85/V86 character supporting completion evidence

Status: candidate `b15fc59`, followed by import-only correction `faa9b1e`, committed on
`slice/V85`; not merged. Full local checks passed. Live API acceptance is blocked by the
isolated backend startup failure; no live scenarios ran.

## Implemented scope

Fresh audit of all 100 core complications: 49 action/activity records across 39 complications,
including 37 previously missing prose/alternate/trait actions. Retain parent features, source
text and restrictions. Gnoll-Mauled excludes actual Unstoppable Mind grants; Slight Case of
Lycanthropy excludes Fury/Stormwight. Shared sheet/table projections repair historical grants.
Dragon Dreams table actions require five live Victories; source standalone rolled routes remain
intact. Psychic Blast pays the current supported heroic pool in combat, following existing
outside-combat affordability rules; Guilty Conscience spends one Recovery. Effects remain manual.

Starting rewards persist Wealth, Renown, project points and item identity/status/provenance once
at first admission. Later approved career changes or historical restoration do not mint another
award. Explicit legacy initialization uses the original admission revision and refuses missing
or foreign origin data. No global backfill or re-evaluation of the current career is used.
Seven fixed narrative possessions and Shattered Legacy's repair project source are retained.
Private Strange Inheritance identity remains in its existing Director-only store.

All 12 core first-echelon trinkets and 14 leveled weapons were audited; 20 actions from 17 items
are exposed from persisted possessed items only. Draft entitlements, broken items, absent artifacts
and private/inoperative placeholders cannot grant these actions. Items and granting complications
remain readable alongside their actions. Worn/held/equipped conditions and modifiers are manual;
there is no automatic treasure engine, equipment state or project spending.

## Verification and test value

Tests reuse authenticated public create/save/submit/approve/query/operation routes. The source
matrix independently checks timing/text; table witnesses prove successful manual events,
Recovery payment/undo/redo, all-pool payment and Victory gating. Item witnesses save/admit all 26
eligible treasures, compare independently enumerated source actions and prove actual manual use
through its persisted event, not merely unchanged state. Reward witnesses prove distinct initial
resource amounts, exact preservation through edits/restores, denied foreign callers and retry
safety. A disclosed historical database fixture is necessary to test pre-V86 missing snapshots;
new admission already initializes them and is separately proved through the public route.

Focused source/engine126 and app5 checks passed. The initial repository check stopped at NodeNext
import validation: two shared-module imports lacked explicit `.ts` extensions. Both corrected in
`faa9b1e`; runtime behavior is unchanged. [Failure log](check-import-failure.log) retained as failure.
Final `pnpm check` on `faa9b1e` passed (exit 0): 345 engine and 519 app/script tests,
864 total, plus lint, formatting, types, source/content checks, links and production build.
[Full check log](check-final.log). These include the shared public-operation scenarios in the
application test harness; they are not a successful deployed API run.

The isolated CT114 deployment attempted source `b15fc59` before the import-only correction.
Its initial Convex function push stayed at “Preparing Convex functions” until the existing
180-second readiness guard stopped the backend. The aggregate 35-scenario live API suite
never started: all 35 are **not run**, not failed assertions. The cause is undiagnosed.
[Deployment failure](remote-up-failure.log), [backend log](remote-backend-blocker.log),
[environment stop](remote-stop.log). No timeout increase, retry, infrastructure repair or
reset/reseed was attempted. The environment is stopped with data retained.
Live acceptance and merge remain blocked; resume requires a usable isolated deployment of
the current candidate and the existing API suite, not another source audit or broad test rewrite.

## Source, runner and boundaries

Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge
`5a846aadb623a9855a023e9403bb887a956c341f`, unchanged. Only pinned Compendium rules research.
Local checks run on Presidium with Node24.18.0/pnpm11.5.3. Isolated runtime target is retained
CT114 `supporting-actions`, compose `salient-supporting-actions-dev-d21ad518e747`, anonymous
backend internal `http://backend:3210`, site3211, origin
<https://salient-supporting-actions-dev-fc2fb66104e0.tail41404c.ts.net>. No reset/reseed/browser.
Current shared main remains V83/V84; this candidate has not changed it.

Earth + Grounded's duplicate range5 benefit cannot be proved through a complete public Earth
character because that specialization remains unsupported. Metadata handling is present but its
live witness is blocked; no class expansion attempted. Temporary learned abilities, Loner/Shared
Spirit runtime skill configuration, hero/antihero/destiny tokens, companion entities, private
trinket reveal/activation and source-specific cooldowns remain named gameplay dependencies.
No claim is made that all complication/treasure effects are automated. No new full-character
Forge export comparison is claimed: source ledgers and persisted API witnesses own this bounded
supporting extension; prior unchanged choice/ancestry comparisons remain historical evidence.

## Reviews

[Complication source/proof review](../../reviews/V85-complication-source-review.md),
[integration/proof review](../../reviews/V85-V86-implementation-review.md) and
[reward/item source review](../../reviews/V86-starting-rewards-review.md) separate authorship
and independent review. Static/source and proof-code reviews pass within the stated boundaries. Full local checks pass;
formal acceptance remains blocked on live API evidence.
