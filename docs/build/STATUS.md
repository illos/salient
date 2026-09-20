# Build status

Single tracker for every slice. Update your row when you claim, block, hand off or complete. Status
values: `Not started`, `In progress`, `Blocked (Q-id)`, `In review`, `Committed`, `Outline` (V1 slice
whose document is an outline until claimed).

## Post-v0.01 organization — 2026-09-15

The [five-track roadmap](../v1-roadmap.md) and [track kickoff](../kickoff-development-track.md)
govern new work after the recorded A09 acceptance. Tracks are parser/rules engine, foe coverage,
characters, UI/polish, and app/social features; this file remains the single slice status tracker.
Record each claimed slice's primary track, owner, worktree/branch and development/test target in its
work log. Use isolated worktrees and short-lived slice branches under the
[build policy](README.md#branch-and-merge-policy). No track branches, environments or new feature
implementations are claimed merely by recording this plan.

Existing V outlines can be split into smaller assignments when their scope/dependencies are recorded.
Track organization does not change the implementation/review states below; verify current Git and
evidence when claiming work rather than treating historical handoff notes as current gates.

## Active parser/engine ownership — 2026-09-20

Fable's engine/parser thread owns integration. Codex's V63 branch
`slice/V63-corrections-rebase` in `.worktrees/engine-corrections` repairs the V43 indexed-read
mismatch after rebasing the original prerequisites onto main `5956331`.

**Fresh post-rebase full check and authenticated CLI proof pass on `47e69c6`.** The user resumed
non-browser testing; 705 tests and all check/build gates pass, plus the complete 12-record CLI
correction lifecycle. Independent final review is in progress. Browser coverage is deferred under
the moratorium with visual scenarios in the backlog, not an acceptance blocker. Named CT114
engine-corrections is stopped with data retained; Fable owns integration.
See [fresh evidence](evidence/V26/corrections-2026-09-20/README.md).

V26 specification and the source-to-screenshot evidence policy are merged into main. The
[2026-09-16 prerequisite evidence](evidence/V26/corrections-2026-09-16/README.md) passed all ten
abilities on its recorded revision; it is historical evidence, not validation of current main.
Compiler definitions, typed occurrences and calculated push allowances remain pending.

### Historical assessment and specification checkpoints

V22 assessment `9d50b47` remains historical and unmerged on `slice/V22`; it is not an active
implementation dependency or a competing track assignment. Its proposed Ferocity work did not
supersede the subsequently accepted V26 compiled damage/push specification. V26's original
specification branch was integrated as `3689226`, with integration record `8ef8b5e`.

Every engine ability still requires source-backed design followed by actual rendered-app
source/log screenshots and persisted readback. Designed, built and playtested states remain
separate. The [historical baseline](evidence/V26/baseline-2026-09-16/README.md) and subsequent
correction evidence stay intact. Current verification and any later main/runtime integration
must be separately recorded; this branch has performed neither.

## Dependency graph

### Character track assessment — 2026-09-15

| Id | Slice | Depends on | Status | Owner |
| --- | --- | --- | --- | --- |
| V82 | [Remaining level-one ancestries](V82-remaining-ancestries.md) | Main 589d357 | Complete — main `1fa8aac`; both apps API28/28, Forge137 accepted | WIZARD, slice/V82 |
| V83 | [Core perk and ordinary kit action coverage](V83-supporting-actions.md) | V37, V74, V82 | Delivered — `175d17d` merged/live; 31/31 shared API passed | Astra character lead |
| V84 | [Culture presets](V84-culture-presets.md) | V37, V83 | Delivered — 27 presets plus Bespoke; `175d17d` merged/live | Astra character lead |
| V76 | [Dragon Knight level one](V76-dragon-knight-level-one.md) | V82 integration | Complete via V82 — checks, reviews, public API and Forge proof | Astra character worker |
| V77 | [High Elf level one](V77-high-elf-level-one.md) | V82 integration | Complete via V82 — checks, reviews, public API and Forge proof | Astra character worker |
| V78 | [Memonek level one](V78-memonek-level-one.md) | V82 integration | Complete via V82 — checks, reviews, public API and Forge proof | Astra character worker |
| V79 | [Revenant level one](V79-revenant-level-one.md) | V82 integration | Complete via V82 — checks, reviews, public API and Forge proof | Astra character worker |
| V80 | [Time Raider level one](V80-time-raider-level-one.md) | V82 integration | Complete via V82 — checks, reviews, public API and Forge proof | Astra character worker |
| V81 | [Wode Elf level one](V81-wode-elf-level-one.md) | V82 integration | Complete via V82 — checks, reviews, public API and Forge proof | Astra character worker |
| V74 | [Trait-granted abilities and active Dwarf runes](V74-trait-granted-abilities.md) | V69/V73 candidate | Complete — merged/live b73cb8d; 791 checks, hosted and shared-main API 27/27, Forge 31/31 | WIZARD, slice/V74 |
| V73 | [Headless Forge character counterparts](V73-forge-headless-counterparts.md) | V69 verified candidate | Verified — calibration and 31/31 saved API comparisons pass after V74 grants; historical seven failures retained | WIZARD, slice/V73 |
| V24 | [Character wizard assessment and delivery proposal](V24-character-wizard-assessment.md) | A09; assesses A02/V21 | Assessment complete; V25 implementation verified | Codex, character wizard thread |
| V25 | [Shared Fury/Bethell wizard](V25-two-class-wizard.md) | A09, R01–R03, S01, A01; V24 docs | Merged and live verified — `4cb3f1f`, closeout `a3a144f`; 433 tests, both character journeys and table audit pass | Codex character team |
| V32 | [Fury advancement and restorable history](V32-fury-progression-history.md) | V25, A09, V29 | Merged and live verified — `73b7ab4`, integration `ea831d6`; 466 tests and isolated/shared character journeys pass | Codex character team |
| V37 | [Supporting character choices](V37-supporting-character-choices.md) | V25, V32 | Complete — merged/live 6eeaf5b; 648 checks, five isolated and four shared browser journeys | Codex character team |

V25 implementation is merged into main; shared frontend 5180/backend 3212/site 3213 now have
the reviewed backend and matching 467-entry content. Creation, persistence, review, sourced sheets
and table regression checks pass with existing play data preserved. The live closeout includes
a reviewed CLI diagnostic-output repair and manifest-based table audit; see
[V25 live evidence](evidence/V25-live/README.md). The original `slice/V25` branch is retired.

V24 lives on `slice/V24` in `/srv/presidium/projects/salient/characters`, based on `e83930e`.
Assessment only; no backend/runtime changes. The user reaffirmed Forge Steel as a working structural
reference and both import/export as planned features. Q-CHAR-14 confirms all eleven classes in
the wizard track from the outset, with shared class knowledge for parser/engine/UI consumers. V08
remains the broader implementation outline; table support has separate milestones.

```
S00 process tooling ─────────────────────────────────────────────┐
S01 content pipeline ──┬──> R01 Fury decisions ──> R02 derived ──> R03 live state ──┐
                       │                                                            ├──> A02 wizard + sheet
S02 data contracts ────┼──> A01 shared operations + engine integration ─────────────┤
                       │        │                                                   │
R04 roll/damage ───────┤        ├──> A03 table shell + FreePlay ──> A04 opening/turns/clock ──> A05 attacks/damage/costs
R05 conditions/clock ──┘        │                                        │                          │
                                └──> A06 history/undo ◄──────────────────┴──────────────────────────┤
                                                                                                    ├──> A07 closeout/void
A08 design tokens (independent) ────────────────────────────────────────────────────────────────────┤
                                                                                                    └──> A09 v0.01 acceptance ──> V-slices
```

## v0.01 slices

| Id | Slice | Family | Depends on | Rules review | Status | Team | Updated | Commits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S00 | [Process tooling, CI, lint, commit checker](S00-process-tooling.md) | S | None | not required | Committed (GitHub CI passed; historical format boundary repaired) | lead/S00-impl | 2026-09-14 | d5b2765, d67e5bd, c9114b6, 2b3f6db, 5b864dc, 1e0bb50, 3d3bcb6 |
| S01 | [Content pipeline from the pinned Compendium](S01-content-pipeline.md) | S | None | required | Committed (audit fixes independently reviewed; extraction and live reseed passed) | lead/S01-impl | 2026-09-14 | 2023d41, 79a6d86, a73ac74, 7844def, 7b86b8a |
| S02 | [Data contracts: encounter, events, journal, dice](S02-data-contracts.md) | S | None | not required | Committed (history/identity fixes independently reviewed; persisted-state and real reset checks passed) | lead/S02-impl | 2026-09-14 | bfd7485, 97a555b, 00958e3, e106a7d, 7b86b8a |
| R01 | [Level-one devil Fury decision table](R01-fury-decision-table.md) | R | S01 (soft) | required | Committed (independent source review passed; latest creation rulings applied) | rules/R01-research | 2026-09-15 | 2fe311b |
| R02 | [Derived values and evaluator contract](R02-derived-values-evaluator.md) | R | R01 | required | Committed (independent source/evaluator review passed; current character rulings applied) | rules/R02-research | 2026-09-15 | be11576 |
| R03 | [Live-state initialization and engine projection](R03-live-state-initialization.md) | R | R02 | required | Committed (independent initialization/projection review passed; first-admission scope verified) | rules/R03-research | 2026-09-15 | 51a1536, 7b86b8a |
| R04 | [Roll and damage resolution contract](R04-roll-and-damage-resolution.md) | R | None | required | Committed | rules/R04-research | 2026-09-14 | a0cc457 |
| R05 | [Conditions, clock and Malice common lifecycle](R05-conditions-clock-malice.md) | R | None | required | Committed | rules/R05-research | 2026-09-14 | a3f9e93 |
| A01 | [Shared operations, command registry and engine integration](A01-shared-operations-engine.md) | A | S02, S00 (soft) | not required | Committed (audit fixes independently reviewed; browser/live CLI and retry checks passed) | app/A01-impl | 2026-09-14 | fdb3e7d, 7849251, ebeac11, 7bcf86d, 7b86b8a |
| A02 | [Minimal wizard, admission review and character sheet](A02-wizard-and-character-sheet.md) | A | R01, R02, R03, S01, A01 | required | Committed (independent rules/code and browser pass; Q-CHAR-2/10/11 applied) | audit coordinator + independent reviewers | 2026-09-15 | 2899c6b, 97f764a, c248bb4, 12f9c4c, d527168, 1ea22d4, eb01ea5 |
| A03 | [Table shell and FreePlay basics](A03-table-shell-freeplay.md) | A | A01, S01 | required | Committed (independent rules/code and three-context browser pass; Q-A-200 bridge retired) | app/A03-impl | 2026-09-15 | ae9d45a, dc9fbc8, 1dce91b, 7b86b8a |
| A04 | [Combat opening, turns and clock](A04-combat-opening-turns-clock.md) | A | A03, R05 | required | Committed (independent rules/code and live opening/turn/clock checks passed) | audit coordinator + independent reviewers | 2026-09-15 | de64428, a5cf2fc, 0f4af9e |
| A05 | [Attacks, damage, costs and common actions](A05-attacks-damage-costs.md) | A | A04, R04 | required | Committed (independent rules/code, persisted costs/corrections and browser passed) | audit coordinator + independent reviewers | 2026-09-15 | 6931ba9, 6cf5cb1, edd4a19, 64ea02f, cc8b938 |
| A06 | [History: undo, redo and corrections](A06-history-undo-corrections.md) | A | A04 (A05 for correction cards) | required | Committed (independent history review, persisted restoration and live Undo/Redo passed) | audit coordinator + independent reviewers | 2026-09-15 | 1e88600, 6a91b04, 855ba1d |
| A07 | [Closeout and Void](A07-closeout-and-void.md) | A | A05, A06 | required | Committed (independent rules/code, closeout/Void and three-role browser passed) | codex-build / a07_backend + a07_ui | 2026-09-15 | this acceptance commit |
| A08 | [Design tokens and theme migration](A08-design-tokens-theme.md) | A | None | not required | Committed (independent desktop visual review and all theme/browser checks passed) | app/A08-impl | 2026-09-15 | 283bb09, 8c273ff, 7b86b8a |
| A09 | [v0.01 acceptance walkthrough](A09-v001-acceptance.md) | A | A02, A05, A06, A07 | required | Committed (all Required coverage verified; 392 tests, 8 browser tests and visual/source reviews passed) | audit coordinator + independent reviewers | 2026-09-15 | this acceptance commit |

## Audit follow-up

**Question walkthrough complete, 2026-09-15:** All 13 reviewed questions have a source resolution,
user decision or explicit deferral. The [deferred queue](../rules-questions-for-user.md#deferred-questions)
retains Q-CHAR-7/9/13 until after the narrow playtest. They are not implementation gates for v0.01;
their underlying recommendations remain undecided. This closes the questionnaire batch, not build
verification or all later design work.

The [2026-09-15 integrated acceptance record](evidence/v001-acceptance.md) consolidates the
remaining implementation repairs, fresh independent rules/code reviews, live backend and browser
verification, and visual evidence. Its scope is the confirmed prototype; V1 slices remain deferred.

The [remaining-question research](../research/remaining-character-questions-review.md) checked
all then-open cases against pinned rules and existing specs. The separate rules thread has since
answered additional questions; use the [live queue](../rules-questions-for-user.md), not historical
open-question counts. Potency labels and the Q-CHAR-2 current-value policy are reconciled in the
implementation. Q-A-400's warned departures and Q-A-200's evaluated-baseline replacement are repaired.
The [September 14 question audit](audits/2026-09-14-question-queue-dedup.md) remains historical evidence.

The [2026-09-14 coordinated audit](audits/2026-09-14-coordinated-audit.md) records independent
verdicts, reproduced defects, local/backend/browser evidence and the ordered repair list.
The [fix verification](audits/2026-09-14-fix-verification.md) closes the S01/S02/A01/A03 repair findings
with fresh independent implementation/rules reviews and complete local checks. These bounded approvals
do not settle the open rules questions or certify the unfinished v0.01 slices.
S00 GitHub Actions passed on `3d3bcb6`: [hosted run](https://github.com/illos/salient/actions/runs/34905450764).
See the [CI review and run record](audits/2026-09-14-ci-history-review.md) for the first-run failure and repair.

## V1 slices (start after A09 is Committed)

| Id | Slice | Depends on | Status |
| --- | --- | --- | --- |
| V01 | [Respite research and loop](V01-respite.md) | A09 | Outline |
| V02 | [Minion squads and captains](V02-minions-and-captains.md) | A09 | Reviewed on branch, awaiting merge — `slice/V02` (`.worktrees/minions`) at `b903692` plus this closeout, 2026-09-20; full `pnpm check`, 9-step headless proof and independent implementation/rules reviews pass; not merged, shared runtime untouched |
| V03 | [Boss and villain turn mechanics](V03-boss-turn-mechanics.md) | V02 | Outline |
| V04 | [Persistent area cards and response reconciliation](V04-areas-and-response-reconciliation.md) | A09 | Outline |
| V05 | [Ability parser and class/stat-block automation](V05-ability-automation.md) | A09, V04 | Outline |
| V06 | [Monster catalog, saved encounters and party strength](V06-catalog-and-saved-encounters.md) | A09 | Outline |
| V07 | [Inventory, loot and Director stash](V07-inventory-and-loot.md) | A09, V06 | Outline |
| V08 | [Eleven-class editor, advancement and progression history](V08-classes-and-advancement.md) | A09 | Outline |
| V09 | [Forge Steel import](V09-forge-steel-import.md) | V08 | Outline |
| V10 | [Accounts: settings, password reset, friends, blocking, share codes, deletion](V10-accounts-social.md) | A09 | Outline |
| V11 | [Character grants and delegated play](V11-character-grants.md) | V10 | Outline |
| V12 | [Campaign chat](V12-campaign-chat.md) | A09 | Outline |
| V13 | [Reference libraries: Rules, Foes, Items](V13-reference-libraries.md) | S01 | In progress — app-wide rule links (2026-09-15; rules wiki committed `dafcd8a`) |
| V14 | [Foe hiding and Add-visibility](V14-foe-hiding.md) | A09 | Outline |
| V15 | [Hero tokens](V15-hero-tokens.md) | A09 | Outline |
| V16 | [3D dice presentation](V16-dice-presentation.md) | A09 | Outline |
| V17 | [Mobile and tablet layouts, SSR decision](V17-mobile-layouts.md) | A08, A09 | Outline |
| V18 | [Hosting: Cloudflare, Convex Cloud, LAN portability](V18-hosting.md) | A09 | Outline |
| V19 | [Forced access changes and combat recovery](V19-forced-access-recovery.md) | V10 | Outline |
| V20 | [Dynamic terrain objects](V20-dynamic-terrain.md) | V04 | Outline |
| V21 | [Desktop layout fidelity](V21-desktop-layout-fidelity.md) | A08, A09, V13 | Built, not committed — 2026-09-15 (foundation + five parallel implementers, lead integration and repairs); lint, typecheck, 85 engine tests, 317 app tests, links, vendor, content and the full 20-test browser suite pass; screenshots under `.playtest/v21/` compared with each mockup; review deferred to the user's audit thread |
| V26 | [Compiled ability effects: damage and push instructions](V26-compiled-ability-effects.md) | S01, S02, A01, A02, A04, A05, A06, A09 | Specification merged at `3689226`; compiler pending. Historical prerequisite branch passed ten proper-turn playtests on 2026-09-16, not merged. V63 indexed-read repair passes full check and live CLI; browser scenarios deferred to the moratorium backlog. |
| V63 | [Rebase and reverify V26 correction prerequisites](V26-compiled-ability-effects.md#2026-09-20--v63-rebase-and-integration-audit) | V26 prerequisites, V43, V45 | Headless acceptance and independent implementation/rules reviews PASS — tested `47e69c6`, 705-test full check and authenticated CLI lifecycle. Committed on branch only; Fable owns integration. Browser deferred under moratorium. |
| V64 | [Ability grammar coverage audit](V64-ability-coverage-audit.md) | V26 specification, S01, V35 | Merged — read-only audit script, report and tests integrated into main at `458b6e8`, 2026-09-20; independent review pass; no runtime impact (no backend, frontend or content change) | Engine and parser thread |
| V66 | [Browser test harness repair](V66-browser-test-harness-repair.md) | S03, browser failure audit | Not started — registered 2026-09-20 at the user's direction; do not claim until the user starts it; ends the browser testing moratorium when implemented | Unassigned |
| V67 | [Pure compiled ability definitions and outcomes](V67-compiled-effects-pure.md) | V26 design, R04, V64 | Merged — integrated into main 2026-09-20; pure compiler/outcome API and report only; 742-test full check, reproducible report CLI, unchanged V64 audit; independent implementation/rules reviews PASS; no live wiring, so no runtime update |
| V68 | [Campaign home redesign](V68-campaign-home.md) | V21, V29, V31, V43, A09 | Merged and live — `3ca24e8` fast-forwarded into main 2026-09-20; independent review pass; integrated `pnpm check` exit 0 (284 engine, 466 app/scripts tests, build); shared CT114 main updated with data retained and the 8-step headless changed-feature check passing live | Campaign home UI thread (Fable) |
| V72 | [Live compiled ability effects](V72-live-compiled-effects.md) | V26, V63, V67 | Complete — merged into main `dbfb61d` and live on shared CT114 main, 2026-09-20; integrated 843-test check, isolated proofs (46 + 14 records) and independent implementation/integration/rules reviews PASS; shared-main real-dice proof run `e31357a7` PASS (14 records), see [main evidence](evidence/V72/main-2026-09-20/README.md); six compiled live abilities, four compile-only; browser scenarios in the backlog |
| V23 | [Foe source ingestion assessment](V23-foe-source-assessment.md) | S01, A09, Rules portion of V13 | Merged — source assessment and confirmed ingestion requirements integrated with V27, 2026-09-16 |
| V27 | [Undead ingestion and independent feature access](V27-undead-ingestion.md) | S01, A09, Rules portion of V13, V23 docs | Merged and live — rebased implementation `6d47dc0`, test repair `e4590e9`; integrated at `f019e3a`, 2026-09-16; 432 tests, build, isolated and shared-app browser checks pass; public `/foes` verified on 5180 |
| V29 | [Desktop layout feedback follow-ups](V29-desktop-feedback.md) | V21 | Merged — `7b80e56`, 2026-09-16; independent implementation review pass; integrated checks and the full 22-test browser suite pass; shared playable app on `5180` updated and the changed-feature journey verified live |
| V31 | [History control placement correction](V31-history-control-placement.md) | V29 | Merged — `bd0c512`, 2026-09-16; user correction to V29 (only the Enable user undo toggle is a settings row; Rewind and Redo are a discreet icon pair beside the tabs); independent implementation review pass over three rounds; full 22-test browser suite passes; shared playable app on `5180` updated and the changed-feature journey verified live |

| V30 | [Second-echelon undead ingestion](V30-second-echelon-undead.md) | V27 | Merged and live via V38 `40206a5`, 2026-09-17; reviewed V30 dependency `214d04b` included in full-catalog verification |

## Build lead handoff — 2026-09-15

The following chronological checkpoints are retained as history. The slice table and integrated
acceptance record above carry the final disposition; intermediate failures below are not current gates.

The user assigned Codex the remaining v0.01 implementation with sub-agent progress logging.
A separate user thread owns independent audit and acceptance verification. Active A02–A06 repairs
in this checkout belong to that audit thread; the build team does not overwrite them or claim
review approval. The build team owns A07 backend, table UI and session-close integration, with
source research and an A09 handoff of verification gaps. Integration uses disjoint files in the
shared checkout so both threads see the current build; no deployment or merge is implied.

- `a07_backend`: shared closeout/Void operations, persistence, focused operation tests and A07 log.
- `a07_ui`: table closeout/Void cards, session-close choice, browser scenario and UI evidence.
- `a02_repairs`: reassigned before edits to A07 source checks and A09 handoff after detecting
  the audit thread's active character repairs.
- Lead: schema/registry/session integration, local build checks, status and coordination.

A09 remains unverified until its full persisted/browser/reconnect/performance evidence and
independent implementation/rules verdicts are recorded. V1 slices remain outside this assignment.

A07 integration touchpoints for the concurrent audit: `convex/encounterTables.ts`,
`convex/encounters.ts`, `convex/lib/registry.ts`, `convex/sessions.ts` and the
`abilityResolved` execution guard in `convex/lib/abilityOperations.ts`. The latter permits
current-closeout manual clause continuations while preserving ordinary correction windows.
`combat.ended` and Victory confirmation remain sequentially undoable before final archive:
only Finish cleanup/Void make the irreversible boundary in the owning table spec.

Build integration checkpoint: local anonymous Convex bundle analysis now passes after making registry
assembly lazy (`registeredOperations()`), avoiding its runtime circular-import failure.
Focused registry/history/session suites passed; A07 backend/browser checks are still in progress.
The first full check stopped at the active A05 test's unused `BRUTAL_SLAM`; the next typecheck
reported unknown-payload assertions in the audit-owned `tests/app/audience.test.ts`. These are
reported for the concurrent audit to reconcile; A07 is not yet handed off as passing.

Audit integration note: `abilityResolved` now calls A06's shared `assertManualResolutionAllowed`,
which permits directly linked consecutive clauses and current-closeout continuations while retaining
branch/archive/session checks. A05 owns this operation and its query until its independent review;
please do not reintroduce a separate `cleanupContinuation` guard. Audience payload typing is repaired.

Build acknowledgment: retained the audit-owned `assertManualResolutionAllowed` integration;
no additional guard will be introduced. Local schema/functions are now actually synced (00:18:50),
after the authorized pre-alpha app-table reset and 403-entry content reseed. The A07 browser run
is active; please coordinate further local syncs to avoid replacing APIs during that run.
Engine check passes 79 tests. Latest app typecheck is blocked by the new audit test
`tests/app/history-audit.test.ts:131`: `initiativeGroups` has no `entryIds` field; entries reference
groups via their `groupId`. Audit owns repair of that relationship assertion.

Browser coordination: A07 now reaches End combat, but concurrent load caused one-second local
Better Auth lookup timeouts in `table:roster` and `closeout:current` for player/observer. Build lead
has stopped heavy full-suite runs until the three-role browser retry finishes; please avoid
concurrent backend sync/reset or heavy test runs during this short retry. UI also removes the
unneeded closeout subscription before the closeout phase. Requests: `3c06d0f59cde92d6`,
`2fd4c08684b871e0`. This failure is recorded, not treated as a passing browser check.

Audit verification checkpoint: the combined `pnpm check` passed at 00:24 UTC (79 engine + 301
app/tooling tests, types/lint/links/vendor/content/build). History test's invalid group field is
repaired and current integration regressions pass. Independent A04/A05/A06/A07 reports are in
`audits/2026-09-15-*`; new Q-CHAR-2 activation repair is in progress. A07 browser process has
finished; audit now owns the next local sync and complete browser/visual acceptance pass.
Please leave final deployment/test coordination and combined acceptance commit to this audit.

Build-to-audit coordination acknowledgment: read the passing combined-check checkpoint and A07
review, including the source-backed retained-foe temporary Stamina repair. Audit owns final local
sync, full browser/visual acceptance and the combined commit. One A07 browser retry is still active
(the preceding failure was a Resume/navigation test race, now fixed); the UI sub-agent will finish
this current run and perform no further retries. Build lead is doing no further backend sync or
heavy checks. Final run result will be appended here and in the A07 work log.

### A07 build hand-back

Implementation is complete and the [independent backend/source review](audits/2026-09-15-A07-review.md)
passes, including the audit's retained-foe cleanup repair. The audit coordinator recorded a passing
full check (79 engine + 301 app/tooling tests). The final build-team browser run completed its gameplay
assertions through paused session close, then exited 1 in browser-context teardown because a trace file
in the shared `test-results/.playwright-artifacts-0/` directory disappeared (ENOENT). This is **not a
certified browser pass**. Audit owns a rerun with an isolated output directory, for example
`pnpm exec playwright test tests/browser/closeout.spec.ts --output .playtest/a07-audit-results`,
plus final live sync, A09 acceptance and the combined commit. No build-team browser process remains.

Screenshots: `.playtest/a07/closeout-director.png`, `closeout-player.png`, `closeout-observer.png`,
and `paused-reset.png`. Detailed implementation, source and validation evidence is in the
[A07 work log](A07-closeout-and-void.md#work-log). No milestone completion or commit is self-attested.

### User checkpoint — 2026-09-15

The user checkpointed this build thread after the v0.01 implementation handoff. Build work is
paused here. Implementation and sub-agent evidence are recorded above and in the slice work logs;
A02–A07 and A09 retain their tracked review states. The separate audit thread owns remaining
browser/visual verification, final acceptance, deployment coordination and the combined commit.

On resumption, read this tracker and the latest audit reports before making changes. Incorporate
new audit findings without restarting completed slices or expanding into V1. This checkpoint
records the handoff; it does not certify A09 or create an implementation commit.

## Development infrastructure — 2026-09-16

| Id | Slice | Depends on | Status | Owner |
| --- | --- | --- | --- | --- |
| S03 | [Remote development adapter](S03-remote-development.md) | External dev-host V1 helpers and enrollment | Merged through `d663c15`; main data migrated, local workloads stopped and reboot recovery passed; provider/human checks pending | Voltar infrastructure thread |
| S04 | [Hosted development environment](S04-hosted-development.md) | S03, V38 | Complete — `4ba33d9` merged into main; hosted dev live; 663 tests, five hosted browser scenarios and independent review pass; private data preserved | Deploy thread, hosting worktree |

## V33 UI design — 2026-09-17

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V33 | [Core stat blocks and automatic glyph semantics](V33-core-stat-block-design.md) | Complete — `bc773c1` merged into main with V34; approved design and shared glyph contract | Codex, UI worktree |

## V34 UI rollout — 2026-09-17

| Slice | Outcome | Status | Owner |
| --- | --- | --- | --- |
| V34 | [Sitewide Core presentation](V34-sitewide-core-presentation.md) | Complete — `e3ae838` merged into main and live on shared CT114 main; 444 tests, 7 UI browser tests and 3 shared-main scenarios pass; independent review pass | Codex, UI worktree |

## V35 full core ingestion — 2026-09-17

| Slice | Outcome | Status | Owner |
| --- | --- | --- | --- |
| V35 | [Full core stat-block ingestion](V35-full-core-ingestion.md) | Merged and live via V38 `40206a5`; full 438-statblock catalog and retained source reviews; 663 integrated tests and shared exhaustive browser verification pass | Codex, foes-full worktree |

## V36 Foes library — 2026-09-17

| Id | Slice | Dependencies | Status |
| --- | --- | --- | --- |
| V36 | [Foes library browsing UI](V36-foes-library.md) | V34, V35 | Merged and live via V38 `40206a5`; reviewed library plus new primary navigation, 12 isolated and 5 shared browser scenarios pass |

## Current integration

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V38 | [Foes integration and top-level navigation](V38-foes-integration-navigation.md) | Complete — merged/live `40206a5`; separate Rules/Foes links, 663 tests, 12 isolated and 5 shared browser scenarios pass | Integration lead |

## V39 account email — 2026-09-17

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V39 | [Account email and password recovery](V39-account-email.md) | Merged/live `62ca7b9` — reviewed implementation, 672 tests; 2 hosted recovery scenarios and shared-main journey pass; Cloudflare test message received, confirmed by user | Deploy thread, hosting worktree |

## V40 unsaved wizard entry — 2026-09-19

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V40 | [Unsaved wizard entry](V40-unsaved-wizard.md) | Complete — merged/live `af69671`; 674 tests, nine isolated browser journeys, two shared browser checks and independent review pass | Character wizard thread |

## V42 primary wizard choice summary — 2026-09-19

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V42 | [Primary wizard choice summary](V42-primary-choice-summary.md) | Complete — merged/live `45426dc`; 674 tests, six isolated journeys, two shared checks and independent review; broader Fury timeout limitation recorded | Character wizard thread |

## V44 character option delivery — 2026-09-19

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V44 | [Character option delivery plan](V44-character-option-delivery.md) | In progress — resumed 2026-09-20; [workflow](astra-character-workflow.md). Opus pilot [abandoned without reuse](../decisions/2026-09-19-opus-pilot-dead-end.md); zero pilot option units delivered. V45 remains delivered. | Character integration lead |

## V41 — reference loading and shared navigation

| Slice | Assignment | Status | Owner |
| --- | --- | --- | --- |
| V41 | [Reference performance](V41-reference-performance.md) | Complete — merged `bc74ddd`, shared development verified at `087a709`; lazy reference delivery/navigation, checks and independent review pass; hosted source `944a46a` published (see V43 evidence) | Codex performance, slice/V41 |

## V43 — table loading and history reads

| Slice | Assignment | Status | Owner |
| --- | --- | --- | --- |
| V43 | [Table performance](V43-table-performance.md) | Complete — merged/live `087a709`; 680 check tests plus added lifecycle regression, browser journeys, independent review and three shared checks pass; hosted source `944a46a` published, CI 681 and 16 distinct live browser checks pass | Codex performance, slice/V43 |

## V45 character option foundation — 2026-09-19

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V45 | [Character option foundation](V45-character-option-foundation.md) | Complete — merged/live `ebe66e2`; 691 tests, 5,584 exact comparisons, 49 applicable browser successes and two shared checks; both audits pass; initial timeout/retry limits retained; no new options enabled | Character integration lead and subagents |

V46–V56 are retired Opus pilot IDs, not pending assignments. Allocate fresh IDs for replacement work.

## Astra delivery and verification queue — 2026-09-20

The first six ancestries merged through V74 `b73cb8d`, including trait-granted actions and active
Dwarf rune state. V82 completes implementation and hosted acceptance for the remaining six:
full checks, independent reviews, 28 public API scenarios and 137 source-adjudicated Forge
comparisons. Main integration `1fa8aac` and both application updates pass; shared-main API proof is 28/28.
See [V82](V82-remaining-ancestries.md).
No Opus material was reused.

| Id | Unit | Implementation | Verification |
| --- | --- | --- | --- |
| V57 | [Devil level one](V44-character-option-delivery.md) | Merged via V74 | All 13 Forge witnesses, live API and independent review pass |
| V58 | [Polder level one](V44-character-option-delivery.md) | Merged via V74 | Both Forge witnesses, live API and independent review pass |
| V59 | [Closeout verification blocker](V59-closeout-timeout.md) | Historical investigation `4c990eb` | Browser investigation stopped under moratorium; not a character completion gate |
| V60 | [Dwarf level one](V44-character-option-delivery.md) | Merged via V74 | Three Forge witnesses plus persisted rune/history proof pass |
| V61 | [Human level one](V44-character-option-delivery.md) | Merged via V74 | Three Forge witnesses, live API and independent review pass |

Use a free suitable local or remote test environment and coordinate shared workloads. Browser
tests remain prohibited. The stopped `characters` and `character-restart` environments stay
stopped. User-approved programmatic Forge counterparts replace website capture for this proof;
bounded comparison limits, including Orc Artisan target representation, remain explicit.
[V82 evidence](evidence/V82/README.md) owns current results; V62/V65/V69/V74 records remain history.


## Browser testing moratorium — 2026-09-20

User decision: all browser (Playwright) testing is deprecated for the time being, across every
track, branch, worktree, private environment and the hosted target, until
[V66](V66-browser-test-harness-repair.md) is implemented. Verification moves to headless CLI/API
routes under the [headless completion gate](README.md#programmatic-headless-completion-gate).
Threads log the UI scenarios they would have checked in the
[browser coverage backlog](browser-coverage-backlog.md) for a later pass. Do not run
`pnpm test:browser` or `presidium-dev run browser`; do not treat a missing browser run as a
blocker; do not record a browser result as pending acceptance. The
[audit](audits/2026-09-20-browser-testing-failures.md) records why.

## V65 programmatic character verification — 2026-09-20

| Id | Unit | Candidate | Verification / next action |
| --- | --- | --- | --- |
| V65 | [Programmatic character verification](V65-character-headless.md) | `slice/V65`, `.worktrees/character-headless`; discovery/transition routes, shared UI transition and browser-independent runner | Backend fix published `b1f50c8`; original 712 unit/backend/script tests pass; type error resolved; all 22 remote headless scenarios pass in 73.547s, zero skips; no browser; ancestry acceptance/main integration separate |

Discovery and shared choice-transition routes, including their UI integration, are merged through
V74 and published. Both original blockers are fixed; the original 22-scenario proof is retained.
V74 extends and re-verifies that coverage; no browser test is required
or permitted during the moratorium. See [V65](V65-character-headless.md) for retained failed and
passing evidence.


## Character coverage continuation — 2026-09-20

| Id | Slice | Status | Owner |
| --- | --- | --- | --- |
| V69 | [Current-main character integration and headless coverage](V69-character-coverage.md) | Complete via V74; preserved V65 candidate; V74 integration verifies 791 checks, 27 live API scenarios and 31 Forge counterparts; merged/live b73cb8d; shared-main API 27/27 | Astra lead |
| V70 | [Hakaan level one](V70-hakaan-level-one.md) | Complete via V74; all choices implemented; V74 full checks, live API and Forge counterparts pass; merged/live b73cb8d; shared-main API 27/27 | Astra Hakaan implementer |
| V71 | [Orc level one](V71-orc-level-one.md) | Complete via V74; all choices including Artisan implemented; V74 full checks/live API pass; Forge comparisons pass within documented Artisan boundary; merged/live b73cb8d; shared-main API 27/27 | Astra Orc implementer |
