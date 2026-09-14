# Build status

Single tracker for every slice. Update your row when you claim, block, hand off or complete. Status
values: `Not started`, `In progress`, `Blocked (Q-id)`, `In review`, `Committed`, `Outline` (V1 slice
whose document is an outline until claimed).

## Dependency graph

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
| R01 | [Level-one devil Fury decision table](R01-fury-decision-table.md) | R | S01 (soft) | required | Committed | rules/R01-research | 2026-09-14 | 2fe311b |
| R02 | [Derived values and evaluator contract](R02-derived-values-evaluator.md) | R | R01 | required | Committed (independent and rules audit passed) | rules/R02-research | 2026-09-14 | be11576 |
| R03 | [Live-state initialization and engine projection](R03-live-state-initialization.md) | R | R02 | required | Committed (initialization/projections passed; Q-R-200 resolved) | rules/R03-research | 2026-09-14 | 51a1536, 7b86b8a |
| R04 | [Roll and damage resolution contract](R04-roll-and-damage-resolution.md) | R | None | required | Committed | rules/R04-research | 2026-09-14 | a0cc457 |
| R05 | [Conditions, clock and Malice common lifecycle](R05-conditions-clock-malice.md) | R | None | required | Committed | rules/R05-research | 2026-09-14 | a3f9e93 |
| A01 | [Shared operations, command registry and engine integration](A01-shared-operations-engine.md) | A | S02, S00 (soft) | not required | Committed (audit fixes independently reviewed; browser/live CLI and retry checks passed) | app/A01-impl | 2026-09-14 | fdb3e7d, 7849251, ebeac11, 7bcf86d, 7b86b8a |
| A02 | [Minimal wizard, admission review and character sheet](A02-wizard-and-character-sheet.md) | A | R01, R02, R03, S01, A01 | required | Implemented, NOT MERGED: six commits on branch slice/A02 (worktree worktrees/A02), pnpm check green on its own base (A04). Rebase onto main conflicts semantically with A05/A06: A02 moved initialHeroLive to convex/lib/characterBuild.ts and removed liveState.staminaMaximum (maxima now come from the baseline), while convex/lib/abilityOperations.ts, convex/lib/resolve.ts and tests/app/fixtures/costedAbility.ts still import initialHeroLive from tableOperations and read live.staminaMaximum. Next session: resume the A02 implementer to rebase and adapt A05/A06 call sites, then merge. AUDIT NEEDED after merge: evaluator arithmetic vs R02; R03 initialization; table ops reading the baseline; sheet/review payload audiences; browser run on port 5180 not done. Note: A02 also carries a fix for a registry/combatOperations import cycle that blocks deploying main. | app/A02-impl | 2026-09-14 | af1aa42, a38d2d7, 9798731, dcace79, 5e6323d, 1ec61bf (unmerged) |
| A03 | [Table shell and FreePlay basics](A03-table-shell-freeplay.md) | A | A01, S01 | required | Committed (audit fixes independently reviewed; bounded rules/source review and three-context browser passed; Q-A-200 engineering follow-up) | app/A03-impl | 2026-09-14 | ae9d45a, dc9fbc8, 1dce91b, 7b86b8a |
| A04 | [Combat opening, turns and clock](A04-combat-opening-turns-clock.md) | A | A03, R05 | required | Committed — AUDIT NEEDED: rules claims in combatCommit/combatRoll/nextSide/fireMalice vs R05 and Compendium; clock dispatchBoundary/settle ordering; requireCharacterEditable lock semantics; clock.malice audience; not exercised: browser spec (check 7), live CLI, combat-end registrations, granted entries, empty-side adjudication; Q-A-400 policy resolved; implementation repair remains. See A04 work log "Audit needed". | app/A04-impl | 2026-09-14 | de64428, a5cf2fc, 0f4af9e |
| A05 | [Attacks, damage, costs and common actions](A05-attacks-damage-costs.md) | A | A04, R04 | required | Committed — AUDIT NEEDED: abilityOperations cost pools/Fury waiver/allowance; resolve.ts metadata derivation from S01 and unread immunity/weakness; shared/resolve correctTarget and parseTierText boundary vs R04; audience stripping on ability.use/correction.ability; targeting.tsx never opened in a browser; browser test not written; hero facts Director-supplied pending A02 (Q-A-200); rules review pending. See A05 work log. | app/A05-impl | 2026-09-14 | 6931ba9, 6cf5cb1, edd4a19, 64ea02f, cc8b938 |
| A06 | [History: undo, redo and corrections](A06-history-undo-corrections.md) | A | A04 (A05 for correction cards) | required | Committed — AUDIT NEEDED: seam semantics (playerWindow/seamOf/ownsUnit) vs undo spec; isGameplayHead kind sets; journal-only restoration and id aliases; OK/archive floors; correctionWindow contract not gated by the setting; not exercised: browser controls, live CLI, real A07 archive events, redo of deleting units, multi-hop aliases; check 1 action-use and check 7 A05 card pending A05; Q-A-600/601 open. See A06 work log "Audit needed". | app/A06-impl | 2026-09-14 | 1e88600, 6a91b04, 855ba1d |
| A07 | [Closeout and Void](A07-closeout-and-void.md) | A | A05, A06 | required | Not started | | | |
| A08 | [Design tokens and theme migration](A08-design-tokens-theme.md) | A | None | not required | Committed (audit passed; mockup comparison and post-rebase browser checks complete) | app/A08-impl | 2026-09-14 | 283bb09, 8c273ff, 7b86b8a |
| A09 | [v0.01 acceptance walkthrough](A09-v001-acceptance.md) | A | A02, A05, A06, A07 | required | Not started | | | |

## Audit follow-up

The [question-queue audit](audits/2026-09-14-question-queue-dedup.md) reviewed all 32 entries through
Q-A-601: 20 remain open, 11 are answered/resolved, and Q-A-200 is engineering follow-up. Q-A-400's
policy is already settled; the A04 implementation repair remains outstanding.

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
| V08 | [Core class content through level 10, advancement and progression history](V08-classes-and-advancement.md) | A09 | Outline |
| V09 | [Forge Steel import](V09-forge-steel-import.md) | V08 | Outline |
| V10 | [Accounts: settings, password reset, friends, blocking, share codes, deletion](V10-accounts-social.md) | A09 | Outline |
| V11 | [Character grants and delegated play](V11-character-grants.md) | V10 | Outline |
| V12 | [Campaign chat](V12-campaign-chat.md) | A09 | Outline |
| V13 | [Reference libraries: Rules, Foes, Items](V13-reference-libraries.md) | S01 | Outline |
| V14 | [Foe hiding and Add-visibility](V14-foe-hiding.md) | A09 | Outline |
| V15 | [Hero tokens](V15-hero-tokens.md) | A09 | Outline |
| V16 | [3D dice presentation](V16-dice-presentation.md) | A09 | Outline |
| V17 | [Mobile and tablet layouts, SSR decision](V17-mobile-layouts.md) | A08, A09 | Outline |
| V18 | [Hosting: Cloudflare, Convex Cloud, LAN portability](V18-hosting.md) | A09 | Outline |
| V19 | [Forced access changes and combat recovery](V19-forced-access-recovery.md) | V10 | Outline |
| V20 | [Dynamic terrain objects](V20-dynamic-terrain.md) | V04 | Outline |
