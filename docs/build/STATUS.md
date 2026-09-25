# Build status

One row per slice. Status is one of `Registered`, `In progress`, `Committed on branch`, `Merged`,
`Blocked (Q-id)` or `Historical`. Details live in the slice document's work log and in Chords; do not
add narrative here. V46–V56 were the abandoned Opus pilot and are retired ids.

| Id | Slice | Status |
| --- | --- | --- |
| S00 | [Process tooling, CI, lint, commit checker](S00-process-tooling.md) | Merged |
| S01 | [Content pipeline from the pinned Compendium](S01-content-pipeline.md) | Merged |
| S02 | [Data contracts: encounter, events, journal, dice](S02-data-contracts.md) | Merged |
| S03 | [Remote development adapter](S03-remote-development.md) | Merged |
| S04 | [Hosted development environment](S04-hosted-development.md) | Merged |
| R01 | [Level-one devil Fury decision table](R01-fury-decision-table.md) | Merged |
| R02 | [Derived values and evaluator contract](R02-derived-values-evaluator.md) | Merged |
| R03 | [Live-state initialization and engine projection](R03-live-state-initialization.md) | Merged |
| R04 | [Roll and damage resolution contract](R04-roll-and-damage-resolution.md) | Merged |
| R05 | [Conditions, clock and Malice common lifecycle](R05-conditions-clock-malice.md) | Merged |
| A01 | [Shared operations, command registry and engine integration](A01-shared-operations-engine.md) | Merged |
| A02 | [Minimal wizard, admission review and character sheet](A02-wizard-and-character-sheet.md) | Merged |
| A03 | [Table shell and FreePlay basics](A03-table-shell-freeplay.md) | Merged |
| A04 | [Combat opening, turns and clock](A04-combat-opening-turns-clock.md) | Merged |
| A05 | [Attacks, damage, costs and common actions](A05-attacks-damage-costs.md) | Merged |
| A06 | [History: undo, redo and corrections](A06-history-undo-corrections.md) | Merged |
| A07 | [Closeout and Void](A07-closeout-and-void.md) | Merged |
| A08 | [Design tokens and theme migration](A08-design-tokens-theme.md) | Merged |
| A09 | [v0.01 acceptance walkthrough](A09-v001-acceptance.md) | Merged |
| V01 | [Respite research and loop](V01-respite.md) | Registered |
| V02 | [Minion squads and captains](V02-minions-and-captains.md) | Merged |
| V03 | [Boss and villain turn mechanics](V03-boss-turn-mechanics.md) | Registered |
| V04 | [Persistent area cards and response reconciliation](V04-areas-and-response-reconciliation.md) | Registered |
| V05 | [Ability parser and class/stat-block automation](V05-ability-automation.md) | Registered |
| V06 | [Monster catalog, saved encounters and party strength](V06-catalog-and-saved-encounters.md) | Registered |
| V07 | [Inventory, loot and Director stash](V07-inventory-and-loot.md) | Registered |
| V08 | [Eleven-class editor, advancement and progression history](V08-classes-and-advancement.md) | Registered |
| V09 | [Forge Steel import](V09-forge-steel-import.md) | Merged (`1118489`, train 12); cloud dev published; gate and headless PASS at tip |
| V10 | [Accounts: settings, password reset, friends, blocking, share codes, deletion](V10-accounts-social.md) | Registered |
| V11 | [Character grants and delegated play](V11-character-grants.md) | Registered |
| V12 | [Campaign chat](V12-campaign-chat.md) | Registered |
| V13 | [Reference libraries: Rules, Foes, Items](V13-reference-libraries.md) | In progress |
| V14 | [Foe hiding and Add-visibility](V14-foe-hiding.md) | Registered |
| V15 | [Hero tokens](V15-hero-tokens.md) | Registered |
| V16 | [3D dice presentation](V16-dice-presentation.md) | Registered |
| V17 | [Mobile and tablet layouts, SSR decision](V17-mobile-layouts.md) | Registered |
| V18 | [Hosting: Cloudflare, Convex Cloud, LAN portability](V18-hosting.md) | Registered |
| V19 | [Forced access changes and combat recovery](V19-forced-access-recovery.md) | Registered |
| V20 | [Dynamic terrain objects](V20-dynamic-terrain.md) | Registered |
| V21 | [Desktop layout fidelity](V21-desktop-layout-fidelity.md) | Merged |
| V23 | [Foe source ingestion assessment](V23-foe-source-assessment.md) | Merged (with V27) |
| V24 | [Character wizard assessment and delivery proposal](V24-character-wizard-assessment.md) | Historical (assessment) |
| V25 | [Shared Fury/Bethell wizard](V25-two-class-wizard.md) | Merged |
| V26 | [Compiled ability effects: damage and push instructions](V26-compiled-ability-effects.md) | Specification merged; implemented by V67 and V72 |
| V27 | [Undead ingestion and independent feature access](V27-undead-ingestion.md) | Merged |
| V29 | [Desktop layout feedback follow-ups](V29-desktop-feedback.md) | Merged |
| V30 | [Second-echelon undead ingestion](V30-second-echelon-undead.md) | Merged |
| V31 | [History control placement correction](V31-history-control-placement.md) | Merged |
| V32 | [Fury advancement and restorable history](V32-fury-progression-history.md) | Merged |
| V33 | [Core stat blocks and automatic glyph semantics](V33-core-stat-block-design.md) | Merged |
| V34 | [Sitewide Core presentation](V34-sitewide-core-presentation.md) | Merged |
| V35 | [Full core stat-block ingestion](V35-full-core-ingestion.md) | Merged |
| V36 | [Foes library browsing UI](V36-foes-library.md) | Merged |
| V37 | [Supporting character choices](V37-supporting-character-choices.md) | Merged |
| V38 | [Foes integration and top-level navigation](V38-foes-integration-navigation.md) | Merged |
| V39 | [Account email and password recovery](V39-account-email.md) | Merged |
| V40 | [Unsaved wizard entry](V40-unsaved-wizard.md) | Merged |
| V41 | [Reference performance](V41-reference-performance.md) | Merged |
| V42 | [Primary wizard choice summary](V42-primary-choice-summary.md) | Merged |
| V43 | [Table performance](V43-table-performance.md) | Merged |
| V44 | [Character option delivery plan](V44-character-option-delivery.md) | In progress |
| V45 | [Character option foundation](V45-character-option-foundation.md) | Merged |
| V57 | [Devil level one](V44-character-option-delivery.md) | Merged |
| V58 | [Polder level one](V44-character-option-delivery.md) | Merged |
| V59 | [Closeout verification blocker](V59-closeout-timeout.md) | Historical |
| V60 | [Dwarf level one](V44-character-option-delivery.md) | Merged |
| V61 | [Human level one](V44-character-option-delivery.md) | Merged |
| V63 | [Rebase and reverify V26 correction prerequisites](V26-compiled-ability-effects.md) | Merged |
| V64 | [Ability grammar coverage audit](V64-ability-coverage-audit.md) | Merged |
| V65 | [Programmatic character verification](V65-character-headless.md) | Merged (via V74) |
| V66 | [Browser test harness repair](V66-browser-test-harness-repair.md) | Registered, not started; ends the browser moratorium |
| V67 | [Pure compiled ability definitions and outcomes](V67-compiled-effects-pure.md) | Merged |
| V68 | [Campaign home redesign](V68-campaign-home.md) | Merged |
| V69 | [Current-main character integration and headless coverage](V69-character-coverage.md) | Merged |
| V70 | [Hakaan level one](V70-hakaan-level-one.md) | Merged |
| V71 | [Orc level one](V71-orc-level-one.md) | Merged |
| V72 | [Live compiled ability effects](V72-live-compiled-effects.md) | Merged |
| V73 | [Headless Forge character counterparts](V73-forge-headless-counterparts.md) | Merged (via V74) |
| V74 | [Trait-granted abilities and active Dwarf runes](V74-trait-granted-abilities.md) | Merged |
| V75 | [Quiet theme](V75-quiet-theme.md) | Merged (`c4ed53e`); full check pass; frontend published; hosted asset smoke pass |
| V76 | [Dragon Knight level one](V76-dragon-knight-level-one.md) | Merged |
| V77 | [High Elf level one](V77-high-elf-level-one.md) | Merged |
| V78 | [Memonek level one](V78-memonek-level-one.md) | Merged |
| V79 | [Revenant level one](V79-revenant-level-one.md) | Merged |
| V80 | [Time Raider level one](V80-time-raider-level-one.md) | Merged |
| V81 | [Wode Elf level one](V81-wode-elf-level-one.md) | Merged |
| V82 | [Remaining level-one ancestries](V82-remaining-ancestries.md) | Merged |
| V83 | [Core perk and ordinary kit action coverage](V83-supporting-actions.md) | Merged |
| V84 | [Culture presets](V84-culture-presets.md) | Merged |
| V85 | [Complication grants and dependencies](V85-complications.md) | Merged and published (`a0a700a`) |
| V86 | [Starting reward fulfillment](V86-starting-rewards.md) | Merged and published (`a0a700a`) |
| V87 | [Core library seeding](V87-foes-library-seeding.md) | Merged |
| V88 | [Compiled potency conditions with automatic save ends](V88-compiled-potency-conditions.md) | Merged and published (`a0a700a`) |
| V89 | [Reusable test foundation](V89-test-foundation.md) | Merged |
| V90 | [Check pipeline speed](V90-check-pipeline-speed.md) | Merged (with V91); TESTER pass on `f55764d` |
| V91 | [Process trim](V91-process-trim.md) | Merged |
| V92 | [Shadow level one](V92-shadow-level-one.md) | Merged (`81b7931`), cloud published; TESTER full pass on `2b46094`, hosted Shadow smoke pass |
| V93 | [CI reuse and failure events](V93-ci-failure-events.md) | Merged (`a5a23ec`); targeted gate and real event delivery pass |
| V94 | [Tactician level one](V94-tactician-level-one.md) | Merged (`fcf13f1`); cloud dev published; accepted TESTER gates reused |
| V95 | [Account screen](V95-account-screen.md) | Merged (`1115380`); cloud dev published; accepted TESTER results reused |
| V97 | [Shadow level two](V97-shadow-level-two.md) | Merged (`c3423f4`); cloud dev published; accepted TESTER results reused |
| V96 | [Character builder](V96-wizard-rail.md) | Merged (`1e20eec`); cloud dev published; accepted TESTER results reused |
| V98 | [Shadow level three](V98-shadow-level-three.md) | Merged (`66a0f3d`); cloud dev published; accepted TESTER results reused |
| V99 | [Censor level one](V99-censor-level-one.md) | Merged (`517ea19`); cloud dev published; accepted TESTER results reused |
| V100 | [Conduit level one](V100-conduit-level-one.md) | Merged (`5079192`); cloud dev published; accepted TESTER results reused |
| V101 | [Fury level one](V101-fury-level-one.md) | Merged (`e31335d`); cloud dev published; accepted TESTER results reused |
| V102 | [Troubadour level one](V102-troubadour-level-one.md) | Merged (`0bb1ead`); cloud dev published; accepted TESTER results reused |
| V103 | [Null level one](V103-null-level-one.md) | Merged (`983bcfa`); cloud dev published; accepted TESTER results reused |
| V104 | [Elementalist level one](V104-elementalist-level-one.md) | Merged (`e064050`); cloud dev published; accepted TESTER results reused |
| V105 | [Talent level one](V105-talent-level-one.md) | Merged (`465814b`); cloud dev published; accepted TESTER results reused |

| V106 | [Beastheart level one and companion builds](V106-beastheart-level-one.md) | Merged (`34a8b48`); cloud dev published; accepted TESTER results reused |
| V107 | [Summoner level one](V107-summoner-level-one.md) | Merged (`ca190a9`); cloud dev published; accepted TESTER results reused |
| V108 | [Shadow through level six](V108-shadow-level-six.md) | Merged (`8744738`); cloud dev published; accepted TESTER results reused |
| V109 | [Compiled Effect riders and kit signatures](V109-compiled-effect-riders.md) | Merged (`7d82b59`); cloud dev published; accepted TESTER results reused |
| V110 | [Compiled multi-target and area abilities](V110-compiled-multi-target.md) | Merged (`2921a57`); cloud dev published; accepted TESTER results reused |
| V111 | [Current V1 release target](V111-v1-release-target.md) | Merged (`105f7d5`); independent documentation review passed |
| V112 | [Live sign-in latency investigation](V112-signin-latency.md) | Merged (`8b166cc`); evidence and table-only pause recorded; user's 20s session gap remains unresolved |
| V113 | [Compiled tier forced movement, EoT and prone conditions](V113-compiled-tier-effects.md) | Merged (`bd6e8e4`); cloud dev published; accepted TESTER results reused |
| V114 | [Fury levels two and three](V114-fury-level-three.md) | Merged (`3aa24ae`); cloud dev published with content reseed; accepted TESTER results reused |
| V116 | [Tactician levels two and three](V116-tactician-level-three.md) | Merged (`3175606`); cloud dev published with content reseed; accepted TESTER results reused |
| V118 | [Vendor path resolver for worktrees](V118-vendor-path-resolver.md) | Merged; worktree `pnpm check` and independent review PASS |
| V115 | [Kit bonus correctness and known condition immunity](V115-kit-bonus-correctness.md) | Merged (`4cc7f31`); cloud dev published; accepted TESTER results reused |
| V119 | [Grabs and the common grab and stand-up maneuvers](V119-grab-lifecycle.md) | Merged (`3c02939`); cloud dev published; accepted TESTER results reused |
| V117 | [Censor levels two and three](V117-censor-level-three.md) | Merged (`2dcbf97`); cloud dev published with content reseed; combined gate and headless PASS at tip |
| V132 | [Troubadour levels two and three](V132-troubadour-level-three.md) | Merged (`c3f9e35`); cloud dev published with content reseed; accepted TESTER results reused |
| V120 | [Shared heroic-resource generation engine (Shadow first)](V120-heroic-resource-engine.md) | Merged (`f3acd97`); cloud dev published; accepted TESTER results reused |
| V133 | [Null levels two and three](V133-null-level-three.md) | Merged (`b99b951`); cloud dev published with content reseed; combined gate and headless PASS at tip |
| V135 | [Elementalist levels two and three](V135-elementalist-level-three.md) | Merged (`7646954`, train 1); cloud dev published with content reseed; combined gate and headless PASS at tip |
| V140 | [Tactician focus generation](V140-tactician-focus-generation.md) | Merged (`7646954`, train 1); cloud dev published with content reseed; combined gate and headless PASS at tip |
| V145 | [Censor wrath generation](V145-censor-wrath-generation.md) | Merged (`7646954`, train 1); cloud dev published with content reseed; combined gate and headless PASS at tip |
| V134 | [Conduit levels two and three](V134-conduit-level-three.md) | Merged (`ca5f562`, train 2); cloud dev published with content reseed; gate and headless PASS at tip |
| V136 | [Talent levels two and three](V136-talent-level-three.md) | Merged (`ca5f562`, train 2); cloud dev published with content reseed; gate and headless PASS at tip |
| V137 | [Beastheart levels two and three](V137-beastheart-level-three.md) | Merged (`ca5f562`, train 2); cloud dev published with content reseed; gate and headless PASS at tip |
| V141 | [Summoner essence generation](V141-summoner-essence-generation.md) | Merged (`7e9f731`, resource train 3); cloud dev published; gate and headless PASS at tip |
| V143 | [Beastheart ferocity generation](V143-beastheart-ferocity-generation.md) | Merged (`7e9f731`, resource train 3); cloud dev published; gate and headless PASS at tip |
| V146 | [Talent clarity generation and strain damage](V146-talent-clarity-generation.md) | Merged (`7e9f731`, resource train 3); cloud dev published; gate and headless PASS at tip |
| V142 | [Fury ferocity generation and observed damage triggers](V142-fury-ferocity-generation.md) | Merged (`7e9f731`, resource train 3); cloud dev published; gate and headless PASS at tip |
| V144 | [Null discipline generation and the observed Malice trigger](V144-null-discipline-generation.md) | Merged (`71a3fa5`, resource train 4); cloud dev published; gate and headless PASS at tip |
| V147 | [Conduit piety generation: prayer and domain triggers](V147-conduit-piety-generation.md) | Merged (`71a3fa5`, resource train 4); cloud dev published; gate and headless PASS at tip |
| V149 | [Troubadour drama generation](V149-troubadour-drama-generation.md) | Merged (`71a3fa5`, resource train 4); cloud dev published; gate and headless PASS at tip |
| V148 | [Elementalist essence generation with Persistent Magic](V148-elementalist-essence-generation.md) | Merged (`71a3fa5`, resource train 4); cloud dev published; gate and headless PASS at tip |
| V151 | [Level 2–3 follow-up actions](V151-follow-up-actions.md) | Merged (`b0f7c53`); cloud dev published with content reseed; gate and headless PASS at tip |
| V150 | [Self-Taught forgo for automatic heroic resources](V150-self-taught-forgo.md) | Ready for integration; TESTER PASS at 50f066d5, independent review and QC1 PASS |
| V138 | [Summoner levels two and three](V138-summoner-level-three.md) | Merged (`b0f7c53`); cloud dev published with content reseed; gate and headless PASS at tip |
| V152 | [Effect rider grammar II](V152-effect-rider-grammar.md) | Merged (`4b87799`, train 7); cloud dev published; gate and headless PASS |
| V153 | [Compound tier conditions](V153-compound-conditions.md) | Merged (`4b87799`, train 7); cloud dev published; gate and headless PASS |
| V154 | [Tier instructions and tiers without damage](V154-tier-instructions.md) | Merged (`4b87799`, train 7); cloud dev published; gate and headless PASS |
| V160 | [Talent ability cards defer resource bookkeeping to the engine](V160-talent-resource-note.md) | Merged (`4b87799`, train 7); cloud dev published; gate and headless PASS |
| V161 | [Respite and level-up design](V161-respite-design.md) | In progress |
| V162 | [Build changes keep damage taken](V162-current-values.md) | Merged (`b724eea`); cloud dev published; gate and headless PASS at tip |
| V163 | [Level-up for every class, one granted level at a time](V163-level-up.md) | Merged (`b724eea`); cloud dev published; gate and headless PASS at tip |
| V155 | [Prone and can't stand](V155-cant-stand.md) | Merged (`d266437`, train 8); cloud dev published; gate and headless PASS at tip |
| V156 | [Shadow insight costs 1 less with an edge](V156-insight-edge-cost.md) | Merged (`d266437`, train 8); cloud dev published; gate and headless PASS at tip |
| V165 | [Respite loop](V165-respite-loop.md) | Merged (`1811a3f`); cloud dev published; gate and headless PASS at tip |
| V166 | [Respite activities](V166-respite-activities.md) | Merged (`1811a3f`); cloud dev published; gate and headless PASS at tip |
| V168 | [Field Arsenal choices stay locked mid-respite](V168-field-arsenal-lock.md) | Merged (`79fc25f`); cloud dev published; accepted TESTER results reused |
| V167 | [Respite on the table](V167-respite-table.md) | Merged (`59b890c`); cloud dev published; gate and headless PASS at tip |
| V169 | [Rapid Processing's extra respite activity](V169-respite-extra-activity.md) | Merged (`59b890c`); cloud dev published; gate and headless PASS at tip |
| V164 | [Level-up screen, first design pass](V164-level-up-screen.md) | Merged (`6686fbe`); cloud dev published; accepted TESTER results reused |
| V180 | [Split the headless `all` cohort again](V180-headless-all-split.md) | Merged (`1118489`, train 12); cloud dev published; gate and headless PASS at tip |
| V181 | [Dependent choices stay with their parent on the level-up screen](V181-level-up-dependent-choices.md) | Merged (`bd4f0cc`); cloud dev published; accepted TESTER results reused |
| V182 | Forge import levels 2–3 and UI (doc on `slice/V182`) | Paused (user ruling 2026-09-25: not V1); reviewed PASS, parked on `slice/V182` |
| V183 | [Pause Forge Steel import](V183-forge-import-pause.md) | Merged (docs only; no gate needed) |
| V184 | [Level-up diagnostics follow the current choices](V184-level-up-stale-diagnostics.md) | Merged (`887f448`); cloud dev published; accepted TESTER results reused |
| V185 | [Build History page: full recorded sheet preview and restore](V185-build-history.md) | Merged (`f2160c3`); cloud dev published; accepted TESTER results reused |
| V186 | [Level-up capture spec leaves the editor by navigation](V186-v32-spec-exit.md) | Merged (`0c5848c`); spec and docs only, no deploy needed |
| V187 | [Level-up capture spec approves through Manage players](V187-v32-spec-approve.md) | Merged (`ccd9c67`); spec and docs only; v32 capture passes end to end |
| V188 | [Follow-up ability records show the printed body, not frontmatter](V188-follow-up-ability-content.md) | Merged (`75885cb`); cloud dev published; accepted TESTER results reused |
| V157 | [Abilities without a power roll, and executed gains](V157-effect-only-abilities.md) | In progress (ENGINE2) |
| V158 | [Effect instances and durations](V158-effect-instances.md) | In progress (ENGINE2) |
| V159 | [Modifiers from lasting effects](V159-modifiers.md) | Merged (`0401350`, train 17); cloud dev published; gate and headless PASS at tip |
| V170 | [Talent Strained sections](V170-talent-strained.md) | Merged (`0401350`, train 17); cloud dev published; gate and headless PASS at tip |
| V171 | [Watchers and limits](V171-watchers.md) | Merged (`0401350`, train 17); cloud dev published; gate and headless PASS at tip |
| V172 | [Owner-anchored end of your next turn](V172-next-turn-duration.md) | Merged (`0401350`, train 17); cloud dev published; gate and headless PASS at tip |
| V173 | [Triggered actions: offers on observable triggers](V173-triggered-actions.md) | Merged (`0401350`, train 17); cloud dev published; gate and headless PASS at tip |
| V174 | [Damage-changing reactions (option B revision)](V174-damage-reactions.md) | Merged (`0401350`, train 17); cloud dev published; gate and headless PASS at tip |
| V175 | [Marks (Tactician Mark lifecycle and benefits)](V175-marks.md) | Merged (`0401350`, train 17); cloud dev published; gate and headless PASS at tip |
| V176 | [Forced-movement follow-ups](V176-forced-movement-followups.md) | Merged (`408dd11`); cloud dev published; accepted TESTER results reused |
| V177 | [Damage-type options](V177-damage-type-options.md) | Merged (`64b521e`); cloud dev published; accepted TESTER results reused |
| V189 | [History is view-only; restore deferred](V189-history-view-only.md) | Merged (`36a5e17`, train 19); cloud dev published; gate and headless PASS at tip |
| V190 | [Campaign XP per level](V190-xp-per-level.md) | Merged (`36a5e17`, train 19); cloud dev published; gate and headless PASS at tip |
