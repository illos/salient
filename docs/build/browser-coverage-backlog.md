# Browser coverage backlog

Status: active during the [browser testing moratorium](README.md#browser-testing-moratorium--2026-09-20)
that began 2026-09-20. Every thread appends here instead of running browser tests.

Purpose: while verification is headless-only, record the UI behavior each slice would have checked
in a browser, so the coverage is not lost and can be run in a later pass once
[V66](V66-browser-test-harness-repair.md) has repaired the harness. Log only what a browser can
see: layout, focus, dialogs, drag, theme, error boundaries, route transitions, screenshots for the
user. Do not log persisted-value checks; those belong to the headless proof in the slice work log.

Rules:

- One row per scenario. Append; do not edit other threads' rows except to mark them run.
- `Existing spec` names the current `tests/browser/*.spec.ts` that covers or would cover it, or
  `new`.
- `Priority` is `spot` (must be in the first post-moratorium pass), `later`, or `retire`
  (redundant with headless proof; propose removal of the browser assertion).
- When the scenario is eventually run, fill `Run` with the date, commit and result.

| Date | Slice | Scenario a browser must see | Existing spec | Priority | Headless proof reference | Run |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-20 | V42 | Full Fury wizard → admission → table journey never passed as one run on CT114 | `wizard.spec.ts` | spot | V65 headless lifecycle, pending | |
| 2026-09-20 | V58/V59 | Intermittent closeout timeout; page error boundary replaces table | `closeout.spec.ts` | spot | V59 evidence | |
| 2026-09-20 | V62 | Older wizard journey unresolved on hosted | `wizard.spec.ts` | later | V65 remote headless run | |
| 2026-09-20 | V45 | Two password-recovery scenarios and the Workers immutable-cache scenario skipped (fixtures absent) | `password-recovery.spec.ts`, `reference-cache.spec.ts` | later | V39 backend tests | |
| 2026-09-20 | V63 | Consecutive correction controls stay visible; Undo/Redo and Director/manual boundaries display correctly | `tests/browser/v26-baseline.spec.ts` | spot | [CLI lifecycle and pre-pause checks](evidence/V26/corrections-2026-09-20/README.md) | |
| 2026-09-20 | V26/V63 | Ten-ability source dialogs, log cards and reloaded table display remain readable through proper-turn navigation | `tests/browser/v26-baseline.spec.ts` | spot | [Correction CLI proof](evidence/V26/corrections-2026-09-20/v63-headless-readback.json); broader arithmetic in existing app suites | |
| 2026-09-20 | V70/V71 | Hakaan/Orc choice labels, conditional Artisan selector and trait source dialogs display correctly | new | later | V69 authenticated character runner | |
| 2026-09-20 | V68 | Campaign home layout: header meta and buttons, member cards with badges and presence dot, session rows, chat pane beside history | `v21-campaign.spec.ts` (obsolete: asserts removed next-session tiles, invite card, member rows, foe chips, role tag, command disclosure) | spot | `scripts/v68-headless.ts` report in `docs/build/evidence/V68/` | |
| 2026-09-20 | V68 | Manage players pop-up opens from INVITE PLAYERS, MANAGE PLAYERS and the request count; scrolls to the section; focus trap and Escape | new | spot | headless: `campaigns.approveRequest`, `characters.approve` steps | |
| 2026-09-20 | V68 | Start session confirmation lists every member and starts; header switches to OPEN THE TABLE / PAUSE / END | `v21-campaign.spec.ts` | spot | headless: start-with-all-members step | |
| 2026-09-20 | V68 | RECAP drill-in replaces the list, shows the read-only notice and the session's log, Back returns | new | later | headless: recap `events.list` step | |
| 2026-09-20 | V68 | Chat pane: composer sends on Enter, list scrolls to the newest message, second client sees it live | new | later | headless: chat step | |
| 2026-09-20 | V68 | Presence dot turns green for a second connected client and grey after it leaves | new | later | headless: presence step | |
| 2026-09-20 | V74 | Trait-granted action cards preserve source conditions; Dwarf rune control and refreshed maneuver display agree after change and undo/redo | new | later | `scripts/headless/trait-abilities.ts` and ancestry/rune app tests | |
| 2026-09-20 | V76/V82 | Dragon Knight initial Wyrmplate and conditional Prismatic Scales selectors have clear distinct labels; source dialogs and action cards fit without clipping | new | later | V82 character headless journey and Forge saved-readback comparisons; acceptance passed | |
| 2026-09-20 | V77/V78/V80/V81 | New ancestry purchase controls, Psionic Gift nested selector, trait descriptions and granted action cards remain readable; focus remains usable when a conditional selector disappears | new | later | V82 headless creation/replacement journeys and focused ancestry tests; acceptance passed | |
| 2026-09-20 | V79/V82 | Revenant Former Life selector and combined native/borrowed purchase list clearly show the current former ancestry and budget; nested choices, immunity/weakness summaries and provenance dialogs display correctly | new | spot | V82 Revenant headless replacement journey and Forge borrowed-trait witnesses; acceptance passed | |
| 2026-09-20 | V72 | Compiled effect cards remain legible on desktop/mobile; source links, subtotal/missing-fact labels and occurrence buttons display correctly through correction/rewind | new | spot | [V72 headless plan and progress](V72-live-compiled-effects.md) | |
| 2026-09-20 | V83 | Perk/kit action cards appear in the appropriate groups, keep source conditions/costs readable, and display manual activity timing without implying automated effects | `tests/browser/wizard.spec.ts` | later | V83 public supporting action/choice scenarios | |
| 2026-09-20 | V84 | Culture selector groups ancestral/professional/bespoke choices; summaries, editable aspects and focus remain coherent after preset replacement or customization | `tests/browser/wizard.spec.ts` | later | V84 all27 public saved preset witnesses and shared-transition tests | |
| 2026-09-20 | V02 | Add control: Minion stat blocks show the 1–8 stepper, pool preview and captain select; ordinary stat blocks do not | new | spot | `tests/app/squads.test.ts` acceptance 1; V02 headless proof | |
| 2026-09-20 | V02 | Squad card with nested minion rows and reticles; dropped minions dim; the squad card itself has no reticle | new | spot | V02 headless proof (roster projection) | |
| 2026-09-20 | V02 | Squad sheet: pool bar with step/carried/EV line, captain attach/detach, casualty picker limits the selection to the owed count, participation toggles, action builder and Free Strike Together submit and clear | new | later | `tests/app/squads.test.ts` acceptance 2–5 | |
| 2026-09-20 | V02 | Player view: squad pool through Bar/Numerical/Winded, owed-casualty picker only after the player's own attack | new | later | V02 headless proof (player projection, casualties permission) | |
| 2026-09-20 | V02 | Initiative bar shows the squad entry with Take turn / End turn and no separate captain entry while attached | new | later | `tests/app/squads.test.ts` shared-turn test | |
| 2026-09-20 | V87 | Both foe pickers show readable Xorannox-prefixed eyestalk names and level-distinguished Rivals; echelon families group correctly; repaired ability source cards display full text | new | spot | V87 committed API runner and source corpus regression; final coordinator run pending | |
| 2026-09-20 | V88 | Potency outcome lines show public inequalities and authorized target scores; hero/foe condition-source labels remain readable; applied/resisted conditions have no manual disposition control through correction and rewind | new | spot | V88 headless proof and persisted condition/presentation tests passed at 1af9c75 | |
| 2026-09-20 | V85 | Complication prose/alternate action cards, selected-trait conditions and eligibility messages | new | later | Shared API source matrix and table costs/Victory proof | Deferred under moratorium |
| 2026-09-20 | V86 | Starting reward panel, legacy initialize control, pending Director review without private reward query, and item action cards | new | later | Owner/Director API, one-time award and item possession/action proof | Deferred under moratorium |
| 2026-09-20 | V75 | Quiet theme, dark and light: login column, top nav (no rule, active link ink), campaign home panels, character sheet (stamina panel, tiles, pills, ability panels with Core body intact), session table (three card panels, header status dot, prompt insets, hero row outline), rules/foes chrome; screenshots for the user | `theme.spec.ts` (appearance persistence still applies), `journey.spec.ts` | spot | none needed: presentation only, no capability change (V75 work log) | |
| 2026-09-20 | V75 | Focus rings (2px accent, offset 2px) visible on every control kind: button, input, checkbox, tab, toggle, link; reduced-motion still zeroes transitions | `theme.spec.ts` | spot | none needed: presentation only | |
| 2026-09-20 | V75 | Hero portrait row now renders a `progressbar` per hero under the disc; `journey.spec.ts` progressbar counts may need re-baselining after V66 | `journey.spec.ts` | later | none needed: presentation only | |
| 2026-09-20 | V75 | Contrast spot check of `muted` text on `sub` insets (spec values measure below 4.5:1) on real screens; report to the user | new | later | design-tokens.md contrast notes | |
| 2026-09-20 | V95 | Header and session-header connection/name/theme/sign-out chrome collapses to the status pip and portrait disc; the disc opens `/account` | new | spot | `tests/app/account.test.ts` profile and device API proof | |
| 2026-09-20 | V95 | Account sidebar switches Profile, Security, Preferences and Delete account panels; portrait preview and theme selection update without layout shift | new | spot | `tests/app/account.test.ts`; `web/theme.ts` local persistence | |
| 2026-09-20 | V95 | Account screen remains usable in light/dark and at narrow desktop widths; destructive copy and focus states remain clear | new | later | quiet static checks; authenticated route/API proof | |
| 2026-09-21 | V96 | Wizard rail: "Character Builder" heading with the Making a Hero rulebook link, steps 1–7 Ancestry…Finalize, no Think, Add Free Strikes or Make Connections row; a decided step reads its chosen value in place of the step name, current step's number badge in the accent, no pip | `v21-wizard.spec.ts` (obsolete: asserts `1. Think`, `10. Make Connections`, `Step 1 of 10`), `rule-popup.spec.ts` (obsolete: `Read 1. Think in the rules`) | spot | none needed: presentation only, content and headless routes unchanged (V96 work log) | |
| 2026-09-21 | V96 | Culture step: preset cards in a responsive grid under Ancestral, Professional and Bespoke headings; each card shows its aspect chips; the selected card takes the accent ring; keyboard arrows move within the radio group | `wizard.spec.ts` (obsolete: selects the culture by dropdown option) | spot | none needed: presentation only, same shared choice transition (V96 work log) | |
| 2026-09-21 | V96 | Culture step: after picking a preset its environment, organization, upbringing and printed language read as read-only lines naming the culture; the skill selectors stay live; Build your own restores the selectors | `wizard.spec.ts` | spot | none needed: wizard-path restriction only, shared transition unchanged (V96 work log) | |
| 2026-09-21 | V96 | Ancestry step: each purchased-trait card shows the name at the left of a header with the point cost at the right and its rules text below; no visible checkbox; the selected card takes the accent ring; keyboard selection and focus ring still work with the control hidden | `wizard.spec.ts` | spot | catalog resolution checked for all 161 point-budget options (V96 work log) | |
| 2026-09-21 | V96 | Wizard navigation sits under the rail progress bar: arrow-only Back disabled on the first step, forward naming the next step and truncating without overflowing the 224px rail, Save and close on the last step; the centre column scrolls without a pinned footer | `v21-wizard.spec.ts` (obsolete: expects the nav inside the centre pane) | spot | none needed: presentation only, same goTo/persist handlers (V96 work log) | |
| 2026-09-21 | V96 | Wizard scrolls as one document: the header scrolls away, the rail and hero columns stay pinned one gap from the top, a hero column taller than the viewport scrolls inside its sticky box, and the centre column no longer has its own scrollbar | `v21-wizard.spec.ts` (obsolete: asserts `[data-wizard-pane="centre"]` scrollTop as the scrolling element) | spot | none needed: presentation only (V96 work log) | |
| 2026-09-21 | V96 | Step header after a main choice: reads the option name, its rules text and its reference with Edit beside it; Edit reopens the chooser and moves focus into it; choosing collapses back and returns focus to Edit; an optional none reads its own label | `v21-wizard.spec.ts`, `wizard.spec.ts` (obsolete: expect a separate chosen-name summary under the step title) | spot | none needed: presentation only, same select/transition path (V96 work log) | |
| 2026-09-21 | V96 | Wizard mockup refinements: rail percentage and accent bar under the heading, current row filled, pill forward button, hint line; step header eyebrow with Edit right-aligned; base-statistic tiles; point-budget panel with budget dots, Clear and two-column cards; step footer; hero-column status dot and Traits chosen chips | `v21-wizard.spec.ts`, `wizard.spec.ts` | spot | none needed: presentation only, same select/transition path (V96 work log) | |
| 2026-09-21 | V96 | Wizard working draft: opening a new hero and making one choice writes a draft without leaving the page, the header reads Saving then Draft saved, Exit returns to the characters list with the draft absent, reopening the wizard resumes the same draft, and saving with a name makes it appear in the list | `v40-unsaved-wizard.spec.ts` (obsolete: asserts choices are discarded on reload) | spot | `tests/app/wizard-draft.test.ts` (V96 work log) | |
| 2026-09-21 | V96 | Culture step: preset aspects as one tile block with its two-sided caption; Read more opens the rules dialog for the entry behind the description; Culture skills panel with a dot per aspect and Clear; granted language and culture edge as cards | `wizard.spec.ts` | spot | none needed: presentation only, same shared transition (V96 work log) | |
| 2026-09-21 | V96 | Rail sub-menu: the current step lists its own choices beneath it with a filled dot once recorded, the list follows when the step changes, and picking an item smooth-scrolls that choice into view | `v21-wizard.spec.ts` | spot | none needed: presentation over the same derived choice list as the step count (V96 work log) | |
| 2026-09-21 | V96 | Rail nests the kit under the class with a bullet centred on the step numbers, numbering runs 1-6 over the top-level steps, and "Step n of m" plus the progress bar still count the kit | `v21-wizard.spec.ts` | spot | none needed: presentation only, navigation order unchanged (V96 work log) | |
| 2026-09-21 | V96 | Kit reads as a section of the class page: absent from the rail until the class grants one, absent entirely for Elementalist, appearing for Fury once the aspect is chosen, and its rail row scrolls the class page to that section | `wizard.spec.ts` (obsolete: walks a separate kit step) | spot | availability checked across classes (V96 work log) | |
| 2026-09-21 | V96 | Kit step: a responsive card grid with description, equipment line, bonus rows and a signature-ability pill; the selected card takes the accent ring; the pill's reference opens the kit entry; unsupported kits stay visible and muted | `wizard.spec.ts` (obsolete: selects the kit from a dropdown) | spot | source-row and description coverage checked for all 25 kits (V96 work log) | |
| 2026-09-21 | V96 | Tactician kit grid: two cards selectable at once with a count line, a third refused until one is cleared, clearing one frees it, and the Field Arsenal overlap questions appear below once both kits are taken | `wizard.spec.ts` | spot | flagged for character-track audit (V96 work log) | |
| 2026-09-21 | V96 | Complication step: filtered card grid with each complication's text and reference, a No complication card while unfiltered, the match count under the grid, and unavailable complications visible with their reason | `wizard.spec.ts` (obsolete: selects the complication from the catalog select) | spot | text and reference coverage checked for all 100 (V96 work log) | |
| 2026-09-21 | V96 | Hero column groups: Vitals, Movement and defense and Standing as named insets, counted grant insets, skills chips, and an outstanding list with accent count that empties as choices are made | `v21-wizard.spec.ts` | spot | none needed: presentation over the same evaluation (V96 work log) | |
| 2026-09-21 | V96 | Wizard inside the site chrome: the top nav appears above it and scrolls away, the side panes stick below the viewport top, and the single Save hero button under the rail saves and returns to the character | `v21-wizard.spec.ts`, `v40-unsaved-wizard.spec.ts` (obsolete: expect the wizard header with Save draft and Exit) | spot | none needed: presentation and routing only (V96 work log) | |
| 2026-09-21 | V96 | Delay first create; keep editing and navigate immediately. Editor does not remount, navigation waits; failed save retains edits with Retry. Reload/close warns while unsaved. | new | spot | `wizard-save-queue.test.ts`, wizard-draft headless cohort | |
| 2026-09-21 | V96 | Reopen a primary chooser and reselect the checked radio with mouse or Space; chooser closes without pruning. Culture Clear removes all three skills. Finalize step count matches visible top-level pages for kit and kitless classes. | new | spot | shared choice transitions; browser interaction deferred | |

## V97: full-builder target level

- Select level 2 before the first autosave; choose each Shadow college and its level-two choices.
- Switch 2 → 1 → 2 during an in-flight save, then reload: the final level persists, higher-level
  choices clear when lowered, and the route/editor stays mounted.
- Keyboard operation of the level selector; unavailable 3–10 options; visible unsupported-class
  diagnostics; explicit Save and Close and navigation draining include the latest level.

## V98: Shadow level three

After V66: select level 3, inspect cumulative Shadow choices and 7-Insight alternatives; lower to 2 and confirm later choices disappear; resume the saved level-3 draft. API proof lives in the V98 cohort.

## V99 Censor level one

Visually check deity/domain portfolio filtering, custom deity name and four-domain selection,
order/domain skill changes, and source-timed Censor actions on the sheet. Programmatic coverage
uses the `censor` cohort; browser execution remains deferred under V66.

## V100 Conduit level one

Spot-check two-domain selection and one feature-domain, prayer/ward controls, Piety costs and
source-timed manual actions. Shared API coverage is in the `conduit` cohort; browser runs await V66.

## V101: Full Fury level one

After V66: choose each aspect; confirm ordinary versus four Stormwight kit cards, derived bonuses,
animal/form rule cards and conditional actions. Edit Stormwight to Reaver and confirm stale kit/action
cards disappear. Headless cohort `fury` owns saved-choice, cost and action-state proof.

## V102 — Troubadour level one

After the browser moratorium: select each class act, inspect both Virtuoso performances, verify
ordinary-kit choices and skill exclusions, and reopen a saved build. Check Drama costs and optional
action labels on the sheet, manual performance timing and Upstage Self text. Public-API proof is
the Troubadour cohort; no browser test was run for V102.

- V103: Null tradition/augmentation cards, two-signature selection, no kit section, sourced sheet actions and draft pruning. Browser runs deferred under moratorium; shared routes covered by Null cohort.

- V104: Elementalist four specializations, five enchantments/four wards and two-of-eight signatures; edit pruning, source manual actions and persistent timing text. Headless proof owns behavior.
- V105: Talent traditions/augmentation/ward choices, signature pairs, Mindspeech, negative Clarity display and explicit manual strain actions; headless API proof owns behavior.

- V106: Beastheart wizard shows all fourteen companion choices, conditional drake attunement and kit melee-bonus choice; sheet displays companion stats separately and manual actor-labelled actions. Verify small-screen readability when browser moratorium ends.

## V107 — Summoner level one

Four circle cards; two signature and two three-Essence portfolio selections; formation statistics
including Elite/Horde; quick command/heroic choices; source-labelled manual minion actions and Essence
costs; no ordinary hero free strikes or Summoner minions in foe picker. Verify visually when the
browser moratorium is lifted. Logic and persisted results use the Summoner CLI/API cohort.

## V108 — Shadow through level six

Target levels 4–6 show cumulative choices, separate characteristic/perk/skill controls and college
ability pairs. Verify second-echelon sheet totals, manual timing/Umbral liabilities and lower-level
pruning visually when the moratorium ends. Shared API cohort owns behavioral proof.

## V109 — Compiled Effect riders and kit signatures

After the moratorium, inspect the Ability effect label, full manual rider text, explicit movement
prerequisites and Director disposition button on a narrow screen. Verify corrected and restored
occurrences display current dispositions. Public API cohort and persisted tests own behavior.

## V112 — Live sign-in latency

Capture click-to-home timing on hosted development with a disposable account. Record auth POST
request/headers/body timing, automatic session refresh, JWT retrieval, WebSocket authentication,
profile readiness and home rendering. A 13:48 UTC server sequence on 2026-09-22 has a roughly
20-second gap after a 299-ms auth POST and before the next auth GET. Fresh public-API sign-ins
take 432–490 ms. Browser timing is needed to distinguish response delivery from delayed client
session notification; retain no credentials, cookies, tokens or response bodies.

2026-09-22: user clarified pause is table-only. TESTER exercised live Firefox with fresh and
returning tabs: foreground sign-in-to-home 1.84–2.35 s; no 20 s stall reproduced. A background-tab
auto-navigation expectation timed out. See [V112](V112-signin-latency.md) for evidence and limits.
The outstanding scenario is the affected user's Firefox profile/network path.

## V115 — Melee-or-ranged "Use as" selector

On a Melee-and-Ranged weapon ability whose kit bonuses differ between modes (a Panther Shadow's Two
Throats at Once), the pending-ability controls show "Use as" with melee and ranged. Choosing ranged
and firing records `selectedMode: ranged` and ranged damage. Firing with no choice shows the
server's "give mode=melee or mode=ranged" refusal. The selector must appear for Compendium keywords
stored as links. Headless coverage is the `kit-bonus` cohort.
