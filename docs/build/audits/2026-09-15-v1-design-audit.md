# V1 design fidelity audit — 2026-09-15

Auditor: Claude Fable 5.1, at the user's request in the main thread.
Scope: how far the implemented desktop UI matches the layout, proportions and display mechanics
shown in the eight V1 mockups under `docs/design-mockups/v1/`. This is a design audit, not a rules
or behavior audit; nothing here changes or questions gameplay behavior.

## Summary

The theme landed and the layouts did not. The A08 slice delivered tokens (colour, type, rules,
brick-red accent, uppercase metadata) and the login page is a close match. Every other screen keeps
the mockup's palette but not its structure: the table is a scrolling page of stacked cards inside a
centred container rather than a full-viewport three-pane workspace; the character sheet is a single
column of text rather than the three-column sheet with a Stamina block, characteristic boxes and
ability cards; the roster rows have no portraits, health bars, reticles or acting highlight; the game
log has no avatars, dice chips or bottom-pinned command line; and the wizard has no numbered step
rail, filter chips or hero-summary boxes.

Root cause, recorded so it is not repeated: the mockup README (`docs/design-mockups/v1/README.md`,
written by Codex on 2026-09-14, commit 517ffc4) declares the mockups a reference for "visual style
and theme only" and says their layouts are "approximate and are not product requirements". The A08
slice inherited that framing ("Content, labels and behavior come from the written specs, never from
the pictures") and its acceptance check for structure covered only the login and campaign pages. The
visual review of 2026-09-15 therefore certified structure at the level of "two columns, a hard rule,
a red button". Builders followed the README as written. If the mockups' layouts are design
requirements, that README paragraph and the A08/A03 slice scopes need to say so; see the questions
at the end.

## Method and evidence

- Viewed all eight mockup PNGs directly.
- Viewed the current implementation captures from the 2026-09-15 acceptance runs:
  `.playtest/fixes/table-director-light.png` (FreePlay, Director), `.playtest/audit-2026-09-15/`
  `combat-0.png` (combat, Director), `sheet-owner.png` (standalone sheet), `wizard-assignment.png`
  (wizard, Class step), `.playtest/a08/campaign-home-light.png` and `login-light.png`. These are
  captures of the committed build at 1280–1440px; the uncommitted V13 work in the tree changes rule
  links, not layout. No fresh captures were taken for this audit.
- Read the layout code: `web/router.tsx` (shell), `web/table/index.tsx`, `web/table/initiative.tsx`,
  `web/character-sheet/index.tsx`, `web/wizard/index.tsx`, `web/campaigns.tsx`, `web/style.css`,
  and `docs/design-tokens.md`.
- Measured pane rules in `combat-table-dark.png` with a headless Chromium canvas (the method A08
  used for colours). The other mockups' rules are too light for the same detector; their widths below
  are read visually and marked "estimated".

## Measured proportions

Combat table, dark mockup: app frame is 1606px wide (x 24–1630), header rule at 80px below the
frame top, vertical pane rules at x 448 and x 1064.

| Pane | Mockup width | Share | Implemented (`grid-cols-[340px_minmax(0,1fr)_340px]` inside a 1460px container with 36px gutters and 24px gaps, at 1440px) | Share |
| --- | ---: | ---: | ---: | ---: |
| Foes / Director | 424px | 26% | 340px | 25% |
| Log | 616px | 38% | 640px | 47% |
| Heroes | 566px | 35% | 340px | 25% |

FreePlay mockup (estimated): 424 / 760 / 422, about 26 / 47 / 26. So the implemented ratio happens to
match FreePlay at 1440px, but not combat, where the mockup widens the heroes pane to hold the selected
sheet. More important than the ratio: the mockup panes run edge to edge, are separated by full-height
1px rules, fill the viewport height, and scroll independently; the implementation is a centred,
max-width page that scrolls as one document, with each pane a bordered, shadowed card. At 1920px the
implementation leaves 230px of empty margin on each side; the mockup does not.

Header: mockup 80px at mockup scale (about 70px at 1440), implemented 56px.

## Cross-cutting findings

1. **Full-viewport session shell is missing.** Every session mockup (FreePlay, combat light, combat
   dark) replaces the site navigation with a session header: wordmark, campaign name, session number
   and elapsed time, a status pill (`RUNNING · FREE PLAY`, `RUNNING · COMBAT · ROUND 2`), and PAUSE
   and END buttons. The implementation keeps the global nav (Campaigns / Characters / Rules,
   connection status, theme toggle, name, Sign out) and puts session status in an h1 subtitle and
   the pause/end controls somewhere in the Director pane. There is no full-height frame and no
   independent pane scrolling (`grep overflow-y web/table` finds nothing; only the compact sheet body
   has a 60vh scroll). The character sheet spec also asks for a "separately scrollable body" in the
   heroes pane, so this is a spec gap as well as a mockup gap.
2. **Cards inside panes.** The mockups use bordered, offset-shadow cards only for callouts: Encounter
   ready, Next session, Invite your players, Selected sheet, the Target prompt, Profile/Password. The
   implementation wraps every pane and most sections in a `Card` (Foes, Command, Game log, Heroes,
   Initiative, Malice, Setup), giving a dashboard of boxes instead of the mockups' rule-separated
   columns. The hard-rule card style is right; the frequency is not.
3. **No portrait or avatar discs.** Every mockup roster row, log entry, member row and sheet header has
   a circular disc (filled ink for the acting or own creature, grey for others, red for a foe entry
   in the log, ringed for hero resource portraits). The implementation has none. The sheet spec says
   "no portrait system is required" for identity, which builders read as "no discs"; the discs are a
   layout element that works without uploaded images (initials or a neutral fill).
4. **No health bars in roster rows.** Mockup foe rows: disc, name, a thick red bar on a grey track,
   and a target reticle circle at the right edge. Mockup party rows: disc, name, class · level at the
   right, a thick black bar (red when low), and an "Away" grey state. The implementation renders foe
   health as text ("11 / 15 Stamina") unless the Director sets the health display to `bar`, in which
   case it renders a 6px native `<progress>`; hero rows show "Stamina 30 · Recoveries 10" as text.
   The mockup shows a bar and a number together for the Director. The reticle is a text button
   labelled TARGET, not a circle at the row edge.
5. **Roster rows carry every ability inline.** In the implementation each foe row and each hero row
   lists every ability with USE and READ buttons, plus condition toggles, stat block, and remove,
   for every creature at once. This is why the Director capture is 3,855px tall. The mockups show one
   compact row per creature and a single "Selected sheet" region for the hero being looked at; foe
   abilities are not shown in any mockup. Where Director foe actions should live is an open question
   below.
6. **Game log presentation.** Mockup: a chronological feed with a disc per entry, name line, one or
   two lines of grey text, dice results as bordered chips (`Test · Might` `2d10` `+2` `16` `Tier 2`;
   the final result chip is ink-filled or red), a centred pill for session markers
   (`SESSION STARTED · 19:02`), interactive cards inline (Target up to 3 / AWAITING INPUT / FIRE;
   Respite requested), and LOG / RULES / ROLLS tabs at the top. Implementation: numbered entries
   (`#24`), bold headline, grey attribution and clock time, dice as plain text ("Dice: d10=3 d10=8"),
   REWIND / REDO / DISABLE USER UNDO buttons at the top, and a separate Command card above the log.
   The undo controls are required by A06; the mockup simply omits them. The Target prompt exists as
   a card in the log (`web/table/targeting.tsx`) and is the closest match in the centre column.
7. **Command line placement.** Mockup: a single input pinned to the bottom of the centre pane with a
   red `/` prefix and no Run button. Implementation: a "Command" card at the top of the centre column
   with an eyebrow, a placeholder example, a RUN button and a collapsible "Command palette (50)".
8. **Initiative bar.** Mockup: a slim segmented bar under "ROUND 2 · HEROES ACTING", one segment per
   turn entry on each side, filled when spent, the current one outlined. The README lists this as a
   departure because the bar "does not show groups or entries". The bar can show groups and entries
   (a segment per entry, grouped by spacing or bracket) without contradicting the initiative-group
   model; the implementation instead renders a text list of groups and entries in a card. The
   group/entry model is right; the presentation is what is missing.
9. **Hero resource ring row.** Combat mockups show a row of ring portraits in the Heroes pane, each
   with a small numeric badge and an ACTING label under the active hero. The table spec calls this a
   "provisional presentation preference" and it was not built. Nothing in the implementation gives
   the Director or player an at-a-glance party overview during combat; the Heroes pane is a select
   plus one compact sheet plus one-line text for the others.
10. **Malice, Victories and Encounter Value placement.** Mockups put `MALICE 7` in the Foes pane
    heading, `VICTORIES 3` in the Heroes pane heading, and `ENCOUNTER VALUE 42` pinned to the bottom
    of the Foes pane. Implementation: Malice is a separate card with a large number and EDIT / SHOW
    MALICE buttons; Victories appear only inside the sheet stats; Encounter Value is not computed or
    displayed anywhere (the stat blocks carry `ev` and the V06 slice owns party strength, so this is
    deferred scope, not an omission).
11. **Buttons and controls.** Mockup buttons are uppercase, square, 1px ink outline or filled brick
    red, with an ink-filled variant for secondary "add" actions next to inputs. Implementation matches
    these variants. Mockup tabs and filters are chips (ALL / MARTIAL / MAGIC, BAR / NUMERICAL /
    WINDED); implementation uses the same chip idea for the health display and the theme toggle, so
    this part is consistent.
12. **Theme toggle in the nav.** The mockup places Appearance in Account preferences; the nav shows a
    name and avatar only. The implementation puts LIGHT / DARK / SYSTEM in every page's nav because the
    account page is V10. Acceptable interim, but it is a permanent-looking addition to the shell.

## Per-screen comparison

Status key: **match** (structure and mechanics present), **partial** (some elements present),
**missing** (not built), **prohibited** (README departures or written spec exclude it),
**deferred** (owned by a later slice).

### Login (`login.png` vs `.playtest/a08/login-light.png`)

| Mockup element | Implementation | Status |
| --- | --- | --- |
| Two equal columns, hard vertical rule, grey left / white right | Same | match |
| Wordmark top-left, large headline mid-left, two grey lines beneath | Same; headline 48px vs mockup ~64px at 1652px | match |
| Footer eyebrows PRE-ALPHA left, DRAW STEEL COMPATIBLE right | PRE-ALPHA / DESKTOP FIRST | prohibited (Q-HAND-1) |
| Right form: "Sign in" heading, eyebrow under it, hard rule | "Welcome back" with eyebrow above it, hard rule | partial (order swapped) |
| Email, Password, red SIGN IN, outline CREATE ACCOUNT | Same | match |
| Forgot password / Have an invitation? links | Absent | deferred (V10) |
| No theme control on this page | LIGHT / DARK / SYSTEM toggle top-right of the left column | partial (addition) |

### Campaign home (`campaign-home.png` vs `.playtest/a08/campaign-home-light.png`)

| Mockup element | Implementation | Status |
| --- | --- | --- |
| Top nav: wordmark, rule, CAMPAIGNS / CHARACTERS / LIBRARY, name + avatar right | CAMPAIGNS / CHARACTERS / RULES, connection status, theme toggle, name, SIGN OUT; no avatar | partial |
| Back link, eyebrow, campaign name, "5 members · Between sessions · Last played 3 days ago" | Same shape; no last-played | match |
| DIRECTOR outline tag and red START SESSION together at the right of the header row | DIRECTOR ink badge in the header; START SESSION inside "The table" card | partial (placement) |
| Main column ~64%, aside ~25% | `minmax(0,1fr)` / 380px, close | match |
| "Next session" card: player selection as a row of bordered tiles (checkbox, disc, name), NO ACTIVE SESSION eyebrow | "The table" card with a plain checkbox list, then party roster and submissions | partial |
| Game log as a section (heading, hard rule, Show filter), rows with a dot, right-aligned "Session 4 · closed", OLDER ACTIVITY | Same, including the filter and the dot | match |
| Command console | A "Command" card in the main column | partial (not in mockup; required by the operations rule, placement unspecified) |
| Invite card: link input + ink COPY button, JOIN REQUESTS with red APPROVE / outline DECLINE | Link input, "Replace invitation link" text link, join requests list; no COPY button | partial |
| Members: disc, name, right-aligned role tag (DIRECTOR ink, PLAYER outline) | Name + tag, no disc | partial |
| Foes prepared: EV total, add input + ink button, chips with ×count | "Foes" with add select + red ADD FOE, rows with Stamina and REMOVE; no EV, no counts | partial (EV deferred to V06) |
| OBSERVER as a member tag | Derived from session selection | prohibited (README) |

### Running session, FreePlay, Director (`session-free-play-director.png` vs `.playtest/fixes/table-director-light.png`)

| Mockup element | Implementation | Status |
| --- | --- | --- |
| Session header replacing site nav: campaign, "Session 5 · 1h 12m", RUNNING · FREE PLAY pill, PAUSE, END | Site nav retained; status in h1 subtitle; pause/end in the Director pane | missing |
| Full-height three panes 424 / 760 / 424, rules between, independent scroll | Centred 1460px page, 340 / 1fr / 340 cards, page scroll | missing |
| Left heading "Director" with MALICE 0 at the right | Card headed "Foes · 1 loaded"; Malice in its own card lower down | partial |
| "Encounter ready" card: EV 42, foe lines with ×counts, red START COMBAT | START COMBAT button among foe controls; no encounter summary card | partial |
| Add-foe input + ink button | Select + red ADD FOE | partial |
| QUICK ACTIONS 2×2: AWARD VICTORY, CALL FOR TEST, GIVE HERO TOKEN, MANAGE PLAYERS | None as a group; Victory awards exist in closeout; CALL FOR TEST and GIVE HERO TOKEN are prohibited | partial (two of four prohibited) |
| SELECTED SHEET region at the bottom of the Director pane | Not present; Director's selected hero sheet is in the Heroes pane | missing |
| Centre tabs LOG / RULES / ROLLS | No tabs; Rules are a separate top-level page (V13) | missing |
| Feed with discs, dice chips, SESSION STARTED pill | Numbered entries, text dice, no discs or pills | missing |
| Respite requested card | Absent | prohibited |
| Slash input pinned bottom, red `/` | Command card at top with RUN and palette | missing |
| Right heading "Party" with VICTORIES 3 | "Heroes · 1 at the table" | partial |
| Party rows: disc, name, "Tactician 3" right, black/red bar, Away state | Sheet select, one compact sheet, one-line text for the rest | missing |
| Observers section with count | Absent | missing |
| HERO TOKENS discs | Absent | prohibited |
| Foe rows | Every foe lists all abilities with USE / READ, TARGET, conditions, stat block, REMOVE | missing (mockup shows compact rows only) |

### Combat table (`combat-table-light.png`, `combat-table-dark.png` vs `.playtest/audit-2026-09-15/combat-0.png`)

| Mockup element | Implementation | Status |
| --- | --- | --- |
| Header pill RUNNING · COMBAT · ROUND 2, PAUSE, END | Subtitle "Session running · Combat · round 1" | missing |
| Panes 424 / 616 / 566, heroes pane widened for the sheet | 340 / 1fr / 340 | missing |
| "ROUND 2 · HEROES ACTING" eyebrow and segmented initiative bar (HEROES / FOES labels, spent filled, current outlined) | "Initiative" card with a text list of groups and entries, TAKE TURN / END TURN, Move-to-group selects | partial (model present, presentation missing) |
| Foe rows: disc, name, red bar, reticle circle; ACTING row with red left rule and tinted background; Slain row greyed | Text health, TARGET button, Slain badge and strikethrough; acting shown only in the initiative card | partial |
| MALICE 7 in the Foes heading; ENCOUNTER VALUE 42 pinned bottom | Malice card; no EV | partial |
| Heroes: VICTORIES 3; ring portraits with resource badges; ACTING label | Neither; Victories only inside the sheet | missing |
| SELECTED SHEET card with a three-box top row | Compact sheet inside the Heroes card; header stats as inline caps pairs | partial |
| Log: feed, dice chips, Target up to 3 / AWAITING INPUT / FIRE card | Target card exists; feed and chips do not | partial |
| Persistent area fixed-bottom card | Absent | deferred (V04) |
| Slash input pinned bottom | Command card at top | missing |
| Dark theme: soft grey rules, no offset shadows, tinted acting row | Tokens exist; the layout is the same as light | match for tokens |

### Standalone character sheet (`character-sheet.png` vs `.playtest/audit-2026-09-15/sheet-owner.png`)

| Mockup element | Implementation | Status |
| --- | --- | --- |
| Nav: EDIT and LEVEL UP buttons | "Open the wizard →" link in a notice card; LEVEL UP prohibited | partial |
| Header band: portrait disc, name, chips (HUMAN · FURY · BERSERKER · LEVEL 3 · KIT · PANTHER · CAMPAIGN), hard rule | h1 name, a "View: Effective build" select, a notice card, then a Card with name, EFFECTIVE BUILD badge and a text identity line | missing |
| Five characteristic boxes (big value, caps label) at the right of the header | Inline caps label / value pairs in a wrapping row | missing |
| Three columns: left Stamina block + Stats + Skills; centre Abilities; right Kit + Features + Languages + Notes | One column, everything stacked | missing |
| Stamina block: "27 / 39" large, bar with a Winded tick, "Winded at 19", "Recovery 13", RECOVERIES as filled/empty squares, FEROCITY value in red | "STAMINA 30 / 30", "RECOVERIES 10 / 10 recovery value 10 Stamina restored", "FEROCITY 0" as text; CATCH BREATH and SPEND A RECOVERY buttons | missing |
| Stats as a ruled list (Size, Speed, Stability, Disengage, Renown, Wealth) | Inline caps pairs; Renown/Wealth under Character details | partial |
| Skills as chips | Under Character details, collapsed | partial |
| Abilities as cards: name, tag (SIGNATURE ink / 3 FEROCITY red outline / TRIGGERED / MANEUVER), "Main action · Melee 1" right, chip row `2d10 + M` `≤11 · 3 dmg` `12–16 · 6 dmg` `17+ · 9 dmg` | Rows: name, "Main action · 3 Ferocity" grey text, rulebook icon; no tags, no tier chips | missing |
| ALL / SIGNATURE / HEROIC / TRIGGERED filter tabs | Grouped by Main actions / Maneuvers / Move / Triggered / Other | prohibited (spec grouping wins) |
| Kit box with STAMINA +6 / SPEED +1 / MELEE +2 | Inside "Features and modifiers", collapsed | partial |
| Features as a ruled list with category at the right | Collapsed section | partial |
| Notes box | Owner notes inside Character details | partial |
| Conditions, Surges, Victories, temp Stamina, Roll test, hero selector | Present (spec-required, absent from the mockup) | match with spec |

### Character wizard (`character-wizard-class.png` vs `.playtest/audit-2026-09-15/wizard-assignment.png`)

| Mockup element | Implementation | Status |
| --- | --- | --- |
| Nav replaced by NEW HERO context, SAVE DRAFT, EXIT | Site nav retained; SAVE DRAFT and SAVE AND CLOSE in the page header | partial |
| Three columns: step rail / choice / hero so far | 220 / 1fr / 320 | match |
| Step rail: "STEP 4 OF 7", numbered discs with check marks, current step with red left rule and tinted row, chosen value at the right, progress bar at the bottom | Plain text list "1. Think … 10. Make Connections", bold current, problem-count badge | partial |
| Big "Choose a class" title, ALL / MARTIAL / MAGIC chips, hard rule | Card with h2 "5. Class" and a rulebook icon; every sub-decision stacked in one card | partial |
| Choice rows: radio, bold name, resource caps, description, characteristics right | Radio + name + "NOT OFFERED IN V0.01" text | partial |
| Bottom bar pinned: ← CAREER / CONTINUE TO KIT → | ← PREVIOUS STEP / NEXT STEP → at the end of the card | partial |
| Hero so far: disc, chips, five characteristic boxes, ruled stat rows, skill chips | Card with a definition list | partial |
| SOURCE TEXT red-outlined card at the bottom right | Rule links open the shared rule card (V13) | partial |
| Seven fixed steps | Sourced steps | prohibited (README) |

### Account (`account.png`)

No account page exists; it is the V10 slice. The only mockup element present anywhere is the
appearance choice, which lives in the nav. Nothing to compare yet.

## What the written spec already requires and the build did not do

These are not mockup preferences; they are in the owning specs and are still missing.

- Table heroes pane: "Keep identity, essential resources and turn controls above a separately
  scrollable body" (`character-sheet-spec.md#layout-and-content`). The compact sheet has a 60vh
  body scroll, but the pane and page still scroll as one document.
- Director heroes pane: "Vertical list of players and their heroes' current Stamina, Recoveries and
  Heroic Resources" (`table-spec.md#confirmed-combat-layout`). The implementation shows one hero's
  full compact sheet and a one-line Stamina/Recoveries string for the others; Heroic Resource is not
  in the list view.
- Target control "provisionally a reticle" (`table-spec.md#roster-targeting-controls`). It is a text
  button.

## Open questions for the user

Answered 2026-09-15, same thread: (1) yes, the layouts are binding for desktop; (2) a "Selected
foe" drill-in is the answer, generalized: in the Director's view foes and heroes are the same
compact cards and clicking one replaces the roster section with the sheet or stat block; (6) the
health display and similar settings move to a settings pop-up using the rule-card component.
Questions 3, 4 and 5 are resolved by the mockups being binding: initials discs, the bar presents the
group model, and the session header replaces the site nav. Recorded in
`docs/table-spec.md#confirmed-combat-layout`; the slice is `V21`.

The questions as originally asked:

1. **Are the mockup layouts binding?** The README says style only. If the layouts, proportions and
   roster mechanics are design requirements, I recommend rewriting the README's opening paragraph
   to say the mockups are the layout reference, keeping the departures table as the only list of
   elements not to build, and adding a build slice for layout fidelity (below).
2. **Foe abilities for the Director.** The mockups never show them. Options: a "Selected foe" region
   in the Director pane mirroring the player's "Selected sheet" (my recommendation; it matches the
   SELECTED SHEET block at the bottom of the FreePlay Director pane), a flyout per row, or keep
   inline lists but collapsed by default.
3. **Portrait discs without uploads.** Initials on a neutral fill, or plain discs, until a portrait
   system exists? I recommend initials.
4. **Initiative bar with groups.** A segment per turn entry, grouped with small gaps or brackets, on
   the mockup's bar. Is that acceptable as the presentation of the group model, with the current
   text list becoming the Director's regroup control only?
5. **Session header.** Replace the site nav on session routes as the mockups do, with the theme
   toggle moving to the account page when V10 lands? Or keep the site nav and add the status pill
   and PAUSE / END beneath it?
6. **Health bars for every audience.** Mockup foe rows show a bar for everyone; the campaign setting
   currently chooses bar / numerical / winded for players. Should the Director always see bar plus
   number, with the setting governing only players? That is what the mockup implies.

## Outcome

Implemented the same day by slice [V21](../V21-desktop-layout-fidelity.md): a foundation agent
built the shared primitives and the session shell, five agents built the areas below in parallel,
and the lead integrated, tested and repaired the result. The V21 work log records what was built,
the defects integration exposed, the verification, and the differences that remain. This audit
stands as the record of the gap and its cause.

## Remediation

Slice [V21: Desktop layout fidelity](../V21-desktop-layout-fidelity.md) (V19 was already taken),
depending on A08, A09 and the V13 rule card, with these deliverables in order of visible impact:

1. Session shell: full-viewport frame, session header with status pill and PAUSE / END, three
   edge-to-edge panes with rules, independent pane scrolling, command line pinned to the bottom of
   the log pane, mockup pane widths (424 / flex / 424 in FreePlay, heroes pane widened in combat).
2. Roster rows: disc, name, bar, reticle, acting highlight, Slain state, compact by default; a
   Selected sheet / Selected foe region for details.
3. Game log feed: discs, dice chips, session marker pills; keep the undo controls but move them to
   a compact toolbar.
4. Initiative bar presentation over the existing group model.
5. Character sheet three-column layout, header band with chips and characteristic boxes, Stamina
   block, ability cards with tags and tier chips; reuse the same components in the compact table
   sheet.
6. Wizard step rail, choice rows, pinned step navigation, hero-so-far boxes.
7. Campaign home details: header actions, player tiles, COPY button, member discs.

Everything above is presentation over existing operations; no rules logic moves into components.
V17 (mobile) should then adapt these layouts rather than the current ones.
