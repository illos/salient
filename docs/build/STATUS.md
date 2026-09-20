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

## Active parser/engine ownership — 2026-09-15

Codex owns the parser/rules-engine track in the user's engine/parser thread. Initial assessment
V22 is on `slice/V22` in `/srv/presidium/projects/salient/engine-parser`, based on `e83930e`.
Assessment committed as `9d50b47` with independent review pass and 402 passing baseline tests;
lead integration is pending. Its slice document and verification live in that worktree. Recommended
first implementation: source-linked Fury turn-start Ferocity through the existing clock/history.
Assessment only: no backend or shared playable environment changes. Coordinate engine/clock/history
contract edits with this owner.

On 2026-09-16 the user requested the first slice spec optimized for parser/engine viability.
V26 specification work is on `slice/V26` in `/srv/presidium/projects/salient/engine-parser-spec`.
The current proposed priority is compiled damage/push effects through shared resolution, ahead of
the bookkeeping-focused Ferocity slice. Specification committed as `9949aba`; independent design
and pinned-source rules reviews pass. Final serial full check passes 402 tests and build.
Implementation has not started; lead integration is pending. The V26 work log records the earlier
Rules-library timeout and the existing closeout test's timestamp-substring false positive.

User-confirmed workflow, 2026-09-16: every engine ability requires a source-backed design, then a
real in-app playtest with screenshot evidence correlating game-log results to the source. V26
amendment `80d1f97` records the standing gate in its build process, slice template and per-ability
inventory; independent amendment review and documentation checks pass. Designed, built and
playtested states must remain visible separately. No V26 implementation or screenshots exist yet;
these commits remain pending lead integration from `slice/V26`.

## Dependency graph

### Character track assessment — 2026-09-15

| Id | Slice | Depends on | Status | Owner |
| --- | --- | --- | --- | --- |
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
| V02 | [Minion squads and captains](V02-minions-and-captains.md) | A09 | Outline |
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
| V26 | [Compiled ability effects: damage and push instructions](V26-compiled-ability-effects.md) | S01, S02, A01, A02, A04, A05, A06, A09 | Ready — specification merged into main at `3689226`, 2026-09-16; independent design and rules review pass; 10 live designs including Viscous Fire; 3 compile-only comparisons; implementation and screenshot evidence pending; documentation-only integration needs no runtime update |
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

User directed continued independent development while verification blockers are repaired. This
explicitly expands the initial two-unit queue to four ancestry candidates; verification still gates
merges, not development. No pilot inputs may be reused. All runtime work remains on CT114.

| Id | Unit | Implementation | Verification / next action |
| --- | --- | --- | --- |
| V57 | [Devil level one](V44-character-option-delivery.md) | Candidate `ae773b0`, `slice/V57` | Queued: focused checks, persisted browser/Forge witnesses, full gates and reviews |
| V58 | [Polder level one](V44-character-option-delivery.md) | Candidate `2291b29`, `slice/V58-integration` | 694 checks, new browser and same-build Forge pass; queue rules review and full regression after V59; not merged |
| V59 | [Closeout verification blocker](astra-character-workflow.md#runtime-and-failure-handling) | In progress, `slice/V59` | Identify and repair observed `targets:drafts` timeout; focused reproduction first |
| V60 | [Dwarf level one](V44-character-option-delivery.md) | In progress, `slice/V60` | Source-backed implementation, then focused checks and Forge/browser queue |
| V61 | [Human level one](V61-human-level-one.md) | Candidate implemented, `slice/V61` | Four focused tests and full 695-test check suite pass; actual browser/Forge and final reviews queued |

Lead owns shared ancestry composition/evaluation wiring and this queue. V59 temporarily owns
`character-restart`; source replacement and heavy jobs remain serialized. The shared main app and
old stopped `characters` environment are untouched. V57/V58 evidence is retained in their branches;
no ancestry unit is yet fully accepted or merged. Stop expanding this batch after Dwarf and Human.
