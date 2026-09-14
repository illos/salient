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
| S00 | [Process tooling, CI, lint, commit checker](S00-process-tooling.md) | S | None | not required | Committed | lead/S00-impl | 2026-09-14 | d5b2765, d67e5bd, c9114b6, 2b3f6db, 5b864dc |
| S01 | [Content pipeline from the pinned Compendium](S01-content-pipeline.md) | S | None | required | Not started | | | |
| S02 | [Data contracts: encounter, events, journal, dice](S02-data-contracts.md) | S | None | not required | Not started | | | |
| R01 | [Level-one devil Fury decision table](R01-fury-decision-table.md) | R | S01 (soft) | required | In progress | rules/R01-research | 2026-09-14 | |
| R02 | [Derived values and evaluator contract](R02-derived-values-evaluator.md) | R | R01 | required | In progress | rules/R01-research | 2026-09-14 | |
| R03 | [Live-state initialization and engine projection](R03-live-state-initialization.md) | R | R02 | required | Not required | | | |
| R04 | [Roll and damage resolution contract](R04-roll-and-damage-resolution.md) | R | None | required | In progress | rules/R04-research | 2026-09-14 | |
| R05 | [Conditions, clock and Malice common lifecycle](R05-conditions-clock-malice.md) | R | None | required | In progress | rules/R05-research | 2026-09-14 | |
| A01 | [Shared operations, command registry and engine integration](A01-shared-operations-engine.md) | A | S02, S00 (soft) | not required | Not started | | | |
| A02 | [Minimal wizard, admission review and character sheet](A02-wizard-and-character-sheet.md) | A | R01, R02, R03, S01, A01 | required | Not started | | | |
| A03 | [Table shell and FreePlay basics](A03-table-shell-freeplay.md) | A | A01, S01 | required | Not started | | | |
| A04 | [Combat opening, turns and clock](A04-combat-opening-turns-clock.md) | A | A03, R05 | required | Not started | | | |
| A05 | [Attacks, damage, costs and common actions](A05-attacks-damage-costs.md) | A | A04, R04 | required | Not started | | | |
| A06 | [History: undo, redo and corrections](A06-history-undo-corrections.md) | A | A04 (A05 for correction cards) | required | Not started | | | |
| A07 | [Closeout and Void](A07-closeout-and-void.md) | A | A05, A06 | required | Not started | | | |
| A08 | [Design tokens and theme migration](A08-design-tokens-theme.md) | A | None | not required | Not started | | | |
| A09 | [v0.01 acceptance walkthrough](A09-v001-acceptance.md) | A | A02, A05, A06, A07 | required | Not started | | | |

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
