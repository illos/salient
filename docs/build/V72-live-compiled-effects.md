# V72: Live compiled ability effects

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Engine implementer with independent implementation and rules reviewers |
| Rules review | required |
| Depends on | V26 design, V63 correction history, V67 pure compiler |
| Status | Committed on branch `ed564b3`; acceptance and reviews PASS; Fable owns integration |

## Goal and boundaries

Connect V67's checked definitions to existing ability use, payment, damage, history and reads.
Persist selected-ability snapshots and original facts, expose ordered effects and occurrence-aware
manual dispositions, and restore recorded outcomes without replay. This is V26 build sequence
steps 3–4, with its full headless acceptance and independent review gates.

Existing grants/loading expose six structurally supported abilities: Brutal Slam, Viscous Fire,
both weapon free strikes, Spear Charge and Bury the Point. Bury the Point's bleeding clauses
remain unsupported post-damage work. Meteoric Introduction, Ray, Ghoul Razor Claws and Worg Bite
are compile-only because current grant/loading paths do not expose them. Kit signatures and
unchanged complex A05 abilities retain explicitly labeled compatibility behavior. Changed
body/projection/revision cannot silently use that adapter. Eligibility is structural, not name dispatch.

No new grants, foe loading, condition/potency execution, movement execution or Director fact-entry
workflow. Only additive optional ability-result schema fields are planned. Parent stat-block
context and other private facts must not enter public selected-ability evidence.

## Owning specifications

- [V26 source and migration boundary](V26-compiled-ability-effects.md#1-source-to-compiled-definition).
- [V26 outcomes](V26-compiled-ability-effects.md#2-definition-to-outcome).
- [V26 persistence and clients](V26-compiled-ability-effects.md#3-persisted-results-and-clients).
- [Acceptance checks](V26-compiled-ability-effects.md#acceptance-checks) and
  [source-derived ability cases](V26-ability-designs.md).
- [Headless completion gate](README.md#programmatic-headless-completion-gate).

## Work log

### 2026-09-20 — Claim and implementation plan

Primary track: parser/rules engine. Branch `slice/V72-live-compiled-effects`, worktree
`.worktrees/engine-live`, base main `e5c1cd84bb5f08a2c1ee51279467ca4e692c6e0e`.
V63's corrected shared-main proof passed with independent acceptance review; its evidence-only
handoff is separate. V67 is already integrated. Pinned Compendium remains
`fb83a789da8f0327a389c277a0c790b1648d5810`; abandoned Opus material is excluded.

Plan: adapt complete source envelopes; add versioned result/occurrence contracts and conservative
movement facts; wire existing registered operations and audience-filtered reads; render the same
stored effect list; verify source arithmetic, persisted history/permissions and real public CLI
journeys; regenerate deterministic support reports; obtain independent implementation and rules
reviews. Consumers are existing table commands, abilities queries and log cards, not wizard flows.

Files: `convex/lib/resolve.ts`, new source/result helpers, `convex/lib/abilityOperations.ts`,
`convex/abilityTables.ts`, `convex/abilities.ts`, `shared/contracts`, `web/table/targeting.tsx`,
headless proof/tests and report scripts. No replacement payment/damage/history subsystem.

Test targets: local pinned Node/pnpm for pure and persisted tests; distinct CT114 `engine-live`
for public authenticated CLI/backend proof. Its nonsecret backend binary is provisioned; no
workload is started while UI owns CT114. Preserve all existing environments/data. Record actual
source, runner host and target in evidence. All browser testing remains paused; would-be visual
scenarios go to the existing backlog. No ability is claimed built/playtested yet.


### 2026-09-20 — Verification and independent implementation review

The complete [evidence record](evidence/V72/README.md) identifies local checks and the isolated
CT114 source/runner/target. Full `pnpm check` passed: 284 engine tests, 486 app/script tests,
source/content/report checks and production build. The subsequent repeated-clause contract fixture
passed in the eight-case persisted suite without application changes. Initial import-extension
and closeout-consumer failures are retained; both were fixed and rechecked.

The real authenticated public CLI proof passed in 167.278 seconds with 46 records across six
compiled abilities, four compatibility cases and permissions/correction/undo/redo. No browser ran.
Original source hashes match; engine-live is stopped with data retained. Generated JSON/Markdown
reports match two actual generations and normal `pnpm check` now enforces report freshness.

[Independent implementation review](reviews/V72-implementation-review.md): PASS.
[Independent pinned-source rules review](reviews/V72-rules-review.md): PASS. Integration and
shared playable runtime update remain with Fable; this evidence accepts the isolated candidate.
Main advanced independently through V68 while this candidate was checked; the integration lead
must check the integrated tree and update the shared app when merging. V74's ancestry-action
projection touches `abilitiesFor`; V72's source adapter changes are confined to source constructors.


### 2026-09-20 — Branch handoff

Implementation/evidence commit: `ed564b35eb892c7a139244761e9db3cf4cc17063`.
The committed application bytes match the tested candidate. The metadata retains the truthful
dirty source identity at execution time. No main merge, push or shared-runtime change was done
by this thread. Isolated `engine-live` is stopped and its data retained.

Integration must preserve V68's intervening main changes and V74's separate ancestry-action
projection in `abilitiesFor`. Expected overlap is shared documentation/status and the TypeScript
include list. Run the integrated checks, then update backend/schema and frontend on the existing
shared main and verify occurrence-aware results. No content reseed or data reset is needed.
The historical V63 main proof runner assumes push is in legacy `unresolvedClauses`; after this
migration use occurrence-aware verification rather than treating that historical harness as a
current compiled-effects acceptance test. Browser testing remains paused.


### 2026-09-20 — Integration preparation on current main

Assignment 5 rebases V72 onto `42211f5`, preserving the V68 campaign schema/UI, V74 ancestry
projection and V82 twelve-ancestry catalog. The refreshed support report retains exactly six live
compiled abilities and four supported-but-unavailable entries. Four newly selectable ancestry
abilities remain compatibility paths. No runtime arithmetic changed.

The [integration evidence](evidence/V72/integration/README.md) records local full-check acceptance
(333 engine and 510 app/script tests, build), the isolated reference-only catalog refresh and the
repeated 46-record public proof and 14-record real-dice linked-correction proof (both passed). The new `scripts/v72-headless-main.ts` is an occurrence-aware
adaptation of V63's linked-correction journey, with exact environment guards and real dice;
it neither imports state nor refreshes content. The old runner remains historical evidence.
The first rehearsal caught a runner-only `might` versus `M` baseline key error before ability use;
the fix uses the typed baseline and preserves the failed artifact. Browser testing remains paused.

Renewed [independent integration review](reviews/V72-integration-review.md) passed the rebase and both actual readbacks. The isolated runtime is stopped with data retained. The integration lead owns fast-forwarding main, updating the shared runtime and the final main-target proof.
