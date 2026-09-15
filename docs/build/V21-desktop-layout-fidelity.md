# V21: Desktop layout fidelity

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required |
| Depends on | A08, A09, V13 (rule card component) |
| Unblocks | V17 |
| Status | see `STATUS.md` |

## Goal

Make the desktop app look like the V1 mockups: the full-viewport session shell with its pane
proportions, compact roster cards with health bars, discs and reticles, the log feed with dice chips
and a bottom-pinned command line, the initiative bar, the three-column character sheet, the wizard
step rail, and the campaign home details. Presentation only: every control keeps its registered
operation, no rules logic enters components, and audience projections are unchanged.

Confirmed by the user on 2026-09-15: the mockups' desktop layouts are binding. The
[design fidelity audit](audits/2026-09-15-v1-design-audit.md) is the gap list and carries the
measurements; read it first.

## Spec references

- `docs/design-mockups/v1/README.md` — layout authority (rewritten 2026-09-15) and the binding departures table.
- `docs/build/audits/2026-09-15-v1-design-audit.md` — per-screen gaps, measured pane widths, what the spec already required.
- `docs/table-spec.md#confirmed-combat-layout` — three panes, role contents, and the 2026-09-15 user decisions: Director roster cards with drill-in, settings pop-up, ring-portrait row and initiative bar as the target presentation.
- `docs/table-spec.md#roster-targeting-controls` — reticle per participant.
- `docs/table-spec.md#initiative-groups-confirmed-app-model` — the group/entry model the bar must present.
- `docs/table-spec.md#monster-visibility-and-health-display`, `#malice-visibility` — settings that move into the pop-up.
- `docs/character-sheet-spec.md#layout-and-content` — sheet sections, compact header, separately scrollable body.
- `docs/character-wizard-spec.md` — step names come from the source, not the picture.
- `docs/reference-library-spec.md#app-wide-rule-cards` — the card the settings pop-up reuses.
- `docs/design-tokens.md` — tokens; extend, do not fork.

## In scope

1. **Session shell.** On session routes replace the site nav with the session header (wordmark,
   campaign name, session number and elapsed time, status pill such as `RUNNING · COMBAT · ROUND 2`,
   PAUSE and END as registered operations). Full-viewport frame, three edge-to-edge panes separated
   by full-height rules, each pane scrolling independently. Widths from the audit: 424 / flex / 424
   in FreePlay; heroes pane widened (about 566 at a 1606 frame) in combat. Header about 70px at 1440.
2. **Roster cards.** Director view: foes and heroes as the same compact card: disc, name, class or
   role line, thick health bar (red for foes, ink for heroes, red when low), Stamina, Recoveries,
   Heroic Resource and other point pools per the sheet spec, reticle at the right edge, acting
   highlight (red left rule and tinted background), Slain and Away states. Clicking a card replaces
   the pane's roster section with the full sheet or stat block and a Back control. Player view: own
   sheet dominant, compact party roster in the same card style without peer Heroic Resource.
3. **Settings pop-up.** A settings control in the Director pane header opens the rule-card
   component with the campaign presentation settings: health display mode, Show Malice, Show test
   difficulty. Each toggle submits its existing operation. Remove those controls from the pane body.
4. **Malice, Victories, Encounter Value placement.** `MALICE n` in the Foes heading, `VICTORIES n`
   in the Heroes heading. Encounter Value stays deferred to V06; leave the slot empty, not zero.
5. **Log feed.** Disc per entry, name line, grey body, dice results as chips (`Test · Might` `2d10`
   `+2` `16` `Tier 2`, result chip filled), centred pill for session markers, interactive cards
   inline (Target prompt, opening and closeout cards). Undo, Redo and Disable-user-undo move to a
   compact toolbar under the LOG heading. Tabs LOG / RULES / ROLLS: LOG and ROLLS filter the feed;
   RULES opens the reference library card.
6. **Command line.** One input pinned to the bottom of the log pane with the red `/` prefix, Enter
   to run, the palette reachable from the input. Remove the Command card and its RUN button.
7. **Initiative bar.** Under the round/side eyebrow, one segment per turn entry, grouped by side and
   by initiative group (a gap or bracket between groups), spent filled, current outlined, surprised
   and Slain marked. The existing text list becomes the Director's regroup view, opened from the bar.
8. **Hero ring row.** In combat, the ring-portrait row in the Heroes pane with a resource badge and
   an ACTING label; clicking a ring selects that hero's sheet.
9. **Character sheet.** Header band: disc, name, chips (ancestry, class · subclass, level, kit,
   campaign), five characteristic boxes, hard rule. Three columns: Stamina block (large current /
   max, bar with Winded tick, Winded at, Recovery value, recovery pips, Heroic Resource in red),
   Stats list, Skills chips; Abilities as cards with type tag (SIGNATURE, cost, TRIGGERED,
   MANEUVER), action · distance at the right, and dice and tier chips; Kit boxes, Features list,
   Languages chips, Notes. Spec-required elements absent from the mockup (Conditions, Surges,
   Victories, temporary Stamina, Roll test, hero selector) keep their place in the same style. The
   compact table sheet reuses the same components in one column with the separately scrollable body.
10. **Wizard.** Step rail with numbered discs, check marks, current step with red rule and tint,
    chosen value at the right, progress bar; large step title; choice rows with radio, bold name,
    caps metadata, description and right-aligned facts; pinned bottom navigation with the previous
    and next step names; hero-so-far column with disc, chips, characteristic boxes, ruled rows and
    skill chips. Nav shows NEW HERO context with SAVE DRAFT and EXIT.
11. **Campaign home.** DIRECTOR tag and START SESSION together at the right of the header; player
    selection as bordered tiles; COPY button beside the invitation link; member rows with discs;
    foes-prepared chips with counts.
12. **Discs.** Neutral disc with initials until a portrait system exists; ink fill for the viewer's
    own or acting creature, grey otherwise, red for a foe entry in the log.

## Out of scope

- Anything in the README departures table (Call for test, hero tokens, respite request, filter
  tabs on the sheet, Level up, seven fixed wizard steps, Observer as a membership role).
- Persistent area cards (V04), Encounter Value and party strength (V06), account page (V10),
  foe hiding (V14), hero tokens (V15), dice animation (V16), mobile and tablet (V17).
- New operations or changed rules behavior. If a presentation needs data the projections do not
  supply, add a projection field in the owning slice's terms and note it; never compute it in the UI.

## Inputs and dependencies

- Hard: A08 tokens, A09 acceptance, the V13 rule-card component for the settings pop-up.
- The Convex projections already carry Stamina, Recoveries and Heroic Resource for the Director's
  heroes list; the player projection omits peer Heroic Resource and must stay that way.

## Deliverables

- Session shell, roster cards, drill-in, settings pop-up, log feed, command line, initiative bar,
  ring row, sheet, wizard and campaign home changes under `web/`.
- `docs/design-tokens.md` extended with any new layout tokens (pane widths, header height, bar
  thickness, disc sizes) marked measured or chosen.
- Screenshots at 1440×900 and 1920×1080 for each mockup screen in both themes under `.playtest/v21/`,
  placed beside the mockup in the work log.
- Browser tests: pane scrolling independence, the drill-in and Back, the settings pop-up submitting
  its operations, the command line running a command, the initiative bar reflecting a taken turn.

## Acceptance checks

1. Each mockup screen and its screenshot, side by side, show the same pane structure, proportions
   within 5% at 1440px, and the same element placement; the reviewer records any remaining
   difference explicitly.
2. In a running session at 1440×900 nothing outside the log pane scrolls the page; each pane scrolls
   on its own; the command line stays visible.
3. The Director sees compact cards for every foe and hero with Stamina, Recoveries and Heroic
   Resource; clicking one replaces the roster section with the full sheet or stat block and Back
   restores the roster with scroll position preserved.
4. Health display, Show Malice and Show test difficulty are absent from the pane body, present in
   the settings pop-up, and each toggle's effect is read back from the campaign settings query.
5. The player projection still omits peer Heroic Resource and hidden data (assert on the serialized
   query result, as V14 does).
6. Every table control still submits its registered operation; the operation registry and headless
   parity tests pass unchanged.
7. No element from the README departures table appears.
8. `pnpm check` and the full browser suite pass.

## Rules research

None. Presentation only.

## Open questions

- Q-V21-1: LOG / RULES / ROLLS tab semantics are proposed above (ROLLS filters the feed; RULES opens
  the library card). Confirm or redirect. Recorded here, not blocking; build LOG first.
- Q-V21-2: on the drill-in, whether the Director's foe stat block is the reference card content or a
  live editable block with the existing Stamina and condition controls. Proposed: live block with
  controls above the readable source text.

## Work log

### 2026-09-15 — Plan (lead: Claude Fable 5.1, main thread)

Spec sections read in this checkout: everything under *Spec references* above, plus all eight
mockup PNGs and the 2026-09-15 implementation captures. No discrepancy between this document and
the cited sections after the same-day README, table-spec and checkpoint updates.

Working arrangement: the user asked for parallel implementer subagents. The checkout carries the
V13 thread's uncommitted rule-card work in `web/`, so V21 builds on top of it in the shared checkout
with disjoint file ownership (as the A07 team did) rather than in a worktree branched from `main`.
Nothing is committed by this thread; the user decides. Review is deferred to the user's audit
thread per the 2026-09-14 directive. The running Vite server on 5180 and the local backend on 3212
serve every agent's screenshots; no agent starts a second `convex dev`.

Phases and ownership:

1. **Foundation** (one agent): shared presentation primitives under `web/components/` (disc,
   health bar, chips, stat box, pip row, pill, pane heading, overlay card extracted from the rule
   preview), the full-viewport session shell with the session header and three independently
   scrolling panes, the split of `web/table/index.tsx` into `log.tsx`, `director-pane.tsx` and
   `heroes-pane.tsx` with unchanged behavior, layout tokens, and a reusable screenshot fixture under
   `tests/browser/`.
2. **Parallel** (five agents, disjoint files): table rosters + drill-in + settings pop-up
   (`director-pane.tsx`, `heroes-pane.tsx`, new roster files); log feed + command line + initiative
   bar + ring row (`log.tsx`, `initiative.tsx`, new files, minimal `index.tsx` mounts); character
   sheet (`web/character-sheet/index.tsx`, `controls.tsx`, new files; not `party.tsx`); wizard
   (`web/wizard/**`); campaign home (`web/campaigns.tsx`, `web/character-sheet/party.tsx`).
3. **Lead integration**: `pnpm check`, full browser suite, side-by-side screenshot review against
   each mockup, this work log's closing entry.

Screenshots go under `.playtest/v21/<area>/` at 1440×900 and 1920×1080 in both themes.

### 2026-09-15 — Foundation (implementer: Claude Fable 5.1)

Phase 1 of the plan above. Presentation only: every control still submits the operation it did
before (`commands.submit` / `commands.invoke` / `sessions.transition` with identical text and
arguments); nothing under `convex/` or `shared/` changed; audience projections are untouched.
Built on top of the uncommitted V13 work in the shared checkout; nothing committed.

**Files created.** `web/components/disc.tsx`, `health-bar.tsx`, `chip.tsx`, `stat-box.tsx`,
`pip-row.tsx`, `pill.tsx`, `pane-heading.tsx`, `overlay-card.tsx`, `session-user.tsx`;
`web/table/shell.tsx`, `log.tsx`, `director-pane.tsx`, `heroes-pane.tsx`, `command-line.tsx`;
`tests/browser/v21-fixtures.ts`, `tests/browser/v21-shell.spec.ts`.

**Files edited.** `web/table/index.tsx` (now the composition only; re-exports `DirectorPane`,
`HeroesPane`, `GameLog`), `web/router.tsx` (table route renders without the site nav; `ThemeSwitch`
and `SignOut` moved to `web/components/session-user.tsx` and re-exported), `web/style.css` (layout
tokens, `.session-*` and `.overlay-card*` classes), `web/rules/preview.tsx` (renders through
`OverlayCardContent`; behavior unchanged, `rule-popup.spec.ts` passes), `web/rules/reference.css`
(card frame rules moved to `style.css`; only the prose scoping stays), `docs/design-tokens.md`
(new section "Session shell and table primitives (V21)"), and three test files minimally for
moved labels (below). `web/ui.tsx` was not changed: `SectionHeading` is left alone and
`PaneHeading` adds the label/value aside.

**Primitive APIs** (all under `web/components/`, token-only, typed props):

| Component | Props | Reproduces |
| --- | --- | --- |
| `Disc` | `name` (initials source and accessible label), `variant` `ink` / `grey` / `red` / `ring`, `size` `sm` 32 / `md` 44 / `lg` 110 (ring is 60), `filled`, `badge`, `caption` (`Acting`), `muted`, `label`, `className`; `initialsOf(name)` exported | Roster, log, member and sheet discs; combat ring portraits with the resource badge. |
| `HealthBar` | `value`, `max`, `tone` `foe` / `hero`, `low` (hero fill turns red when `value <= low`; pass the projection's winded value), `windedAt` (tick), `label`, `className`; renders `role="progressbar"` | Thick 6px bar on a grey track. |
| `Chip`, `DiceChips` | `Chip`: `kind` `plain` / `result` (ink fill) / `accent` (red outline) / `filled-accent` (red fill, the dark result chip), `caps`, `title`; `DiceChips`: `chips: {label, kind}[]` ordered | Metadata and dice chips (`2d10` `+2` `16` `Tier 2`; `HUMAN`, `3 FEROCITY`). |
| `StatBox` | `value`, `label`, `compact` (wizard 56px square), `emphasis`, `className` | Characteristic boxes; kit boxes. |
| `PipRow` | `filled`, `total`, `label`, `className` | Recoveries squares. |
| `Pill` | `children`, `filled` (brick red header status), `centered` (own line in the feed), `role`, `aria-live`, `className` | `SESSION STARTED · 19:02`; `RUNNING · COMBAT · ROUND 2`. |
| `PaneHeading` | `children`, `asideLabel` (`Malice`), `asideValue` (`7`), `asideTone` `default` / `accent`, `actions` (slot before the aside for the settings icon or Back), `as` `h1`–`h3`, `className` | Pane title with `MALICE 7` / `VICTORIES 3` and the hard rule. |
| `OverlayCard` / `OverlayCardContent` | `open`, `onOpenChange` (root layer only); `title`, `eyebrow`, `leading` (Back control), `closeLabel` (default `Close`), `children`, `className`, `backdropClassName`, `bodyClassName`, `bodyKey`; `OverlayCardTrigger` re-exports the Base UI trigger for use inside an existing `Dialog` root | Centered scrollable card, blurred backdrop, Escape / backdrop / close dismissal, focus trap and return (Base UI). Use `OverlayCard` for the settings pop-up and the reference library card. |
| `UserMenu`, `ThemeSwitch`, `SignOut` (`session-user.tsx`) | `UserMenu({displayName})` opens Appearance + Sign out; `ThemeSwitch({className})`; `SignOut({className})` | Header user disc; the same switch and sign-out the site nav uses. |

**Shell API** (`web/table/shell.tsx`): `SessionShell({header, children})` is the full-viewport
grid; `SessionHeader({campaignId, campaignName, roster, encounter})` renders wordmark, rule,
campaign link, `Session N · elapsed`, the status pill (`role="status"`), PAUSE / RESUME / END for
the Director and the user menu; `SessionPanes({combat, director, center, centerFooter, heroes})`
places each node directly in a scrolling column (`.session-pane-scroll`, `data-pane` =
`director` / `log` / `heroes`) with `centerFooter` pinned under the centre column;
`sessionStatusText(roster, encounter)` is the pill text. `CommandLine({campaignId,
sessionRevision})` (`command-line.tsx`) is the pinned input: Enter submits through
`commands.submit` with the same `expectedRevision` handling the old console used; the list icon
inside the input (`aria-label="Command palette"`) opens `web/palette.tsx` above it, unchanged,
with its disclosure expanded. The Command card and its RUN button are gone from the table;
`web/command-input.tsx` still serves the campaign page.

**File ownership after the split** (phase 2):

| File | Contents now | Phase-2 owner |
| --- | --- | --- |
| `web/table/index.tsx` | `TablePage`: queries, entry cancellation, shell + panes composition; mount-point comments in the centre column | Lead; minimal mounts by the log/initiative agent |
| `web/table/director-pane.tsx` | `DirectorPane`, `FoeRow`, `FoeHealth`, `FoeStatBlock`, `QuickAction`, `AdjustAction`, `ConditionBadges`, `ConditionControls`, `actorRef`, `Roster` / `Foe` types | Rosters + drill-in + settings pop-up agent |
| `web/table/heroes-pane.tsx` | `HeroesPane`, `HeroRow`, `Hero` type | Rosters agent (cards, drill-in); log agent mounts the ring row here |
| `web/table/log.tsx` | `GameLog`, `boundActorName`, `CARD_KINDS` | Log feed + command line + initiative bar + ring row agent |
| `web/table/command-line.tsx` | `CommandLine` | Log agent |
| `web/table/shell.tsx` | `SessionShell`, `SessionHeader`, `SessionPanes`, `sessionStatusText` | Lead (stable) |
| `web/table/initiative.tsx`, `setup-card.tsx`, `targeting.tsx`, `closeout-card.tsx`, `void-card.tsx`, `history-controls.tsx` | Untouched | As planned |
| `web/components/*.tsx` | Primitives above | Shared; extend, do not fork |

**Screenshots** (`.playtest/v21/shell/`, viewport captures, both themes, 1440×900 and 1920×1080):
`freeplay-director-*`, `freeplay-player-*`, `combat-director-*`, `combat-player-*`, each as
`<name>-<theme>-<w>x<h>.png` (16 files). Compared with `session-free-play-director.png`,
`combat-table-light.png` and `combat-table-dark.png`: header 70px with wordmark, rule, campaign
name, `Session 1 · 0m`, filled status pill, PAUSE / END and the user disc at the far right; three
edge-to-edge panes with full-height 1px rules, 424 / flex / 424 in FreePlay and 424 / flex / 566 in
combat at 1440 and 1920; no card wrappers, 24px pane padding; the command line pinned at the
bottom of the centre pane with the red `/`; dark theme shows soft grey rules and no offset
shadows. The pane contents (ability lists, text health, initiative text list, compact sheet) are
still the old presentation by design; they are phase 2.

**Commands run.**

- `pnpm lint` → `All matched files use Prettier code style!` (eslint clean, exit 0).
- `pnpm check:app` → `Test Files 34 passed (34) · Tests 317 passed (317)`, tsc clean.
- `pnpm exec playwright test tests/browser/v21-shell.spec.ts tests/browser/rule-popup.spec.ts tests/browser/table-audit.spec.ts tests/browser/theme.spec.ts` → `7 passed (1.8m)`.
- `grep -rnE "#[0-9a-fA-F]{3,8}\b" web --include=*.tsx --include=*.ts | grep -v web/style.css` → empty.
- Also run: `pnpm exec playwright test tests/browser/closeout.spec.ts tests/browser/combat.spec.ts tests/browser/journey.spec.ts tests/browser/campaign-sharing.spec.ts` → closeout, journey and campaign-sharing passed; combat failed on the old status text and passed after the label update below. `pnpm check-links` → 156 files, no broken links.
- `v21-shell.spec.ts` asserts, per role, mode, viewport: no `Primary` navigation on the table
  route; `document.documentElement.scrollHeight === window.innerHeight` and `scrollY === 0`;
  three `.session-pane-scroll` columns with `overflow-y: auto`, at least one overflowing, and
  scrolling one leaves the page and the other panes at 0; the `Slash command` input visible in the
  bottom 80px inside the log pane; pane widths 424 / 424 (FreePlay) and 424 / 566 (combat) and a
  70px header; PAUSE then RESUME change the player's status pill through `sessions.transition`;
  the user menu opens with the Appearance group and Sign out and closes on Escape.

**Tests updated minimally because a label moved** (not behavior): `combat.spec.ts` (`Combat ·
round n` text is now the header pill `Combat · Round n`, asserted through `getByRole('status')`;
passes: `1 passed (32.2s)`), `table-audit.spec.ts` (palette
opens from the `Command palette` button in the input; Enter replaces the RUN button; on the table
the Appearance switch is inside the user menu), `closeout.spec.ts` and `acceptance-extension.ts`
(the status text `Session running · Combat · round 1` / `Session running · FreePlay` is now the
header pill `Running · Combat · Round 1` / `Running · Free play`, asserted through
`getByRole('status')`).

**Decisions where the mockup or brief is silent.**

- Session number and elapsed time: `table.roster` carries only the session id, status and
  revision, so `SessionHeader` subscribes to `api.sessions.list` (newest first) and derives
  `Session N` as position from the oldest and elapsed from `startedAt`. Elapsed is wall time since
  start, including pauses, refreshed each minute. This is one extra read, no new projection.
- Pane widths are fixed at the measured 424 / 566 from 1440px up and scale as the same fraction of
  the viewport below (`min(424px, 424/1440 · 100vw)`); at 1440 the shares are 29 / 32 / 39 in
  combat against the mockup's 26 / 38 / 35 at its 1606 frame. The reviewer should record this
  difference; it follows the brief's fixed widths rather than the frame ratio.
- Status pill text: `Running · Free play`, `Running · Free play · Combat setup`,
  `Running · Combat · Opening | Round n | Closeout`, `Paused`, `Read-only · No active session`;
  rendered uppercase by the caps style, filled red only while running.
- END with committed combat opens the existing `VoidCard` inside an `OverlayCard` (same keep /
  reset choice and `sessions.transition` call as the campaign page).
- The user menu is a simple disclosure (outside click and Escape close it), not a Base UI menu,
  so the Appearance toggle group keeps its `group` role and label for the existing tests.
- The log heading stays `Game log` and the undo toolbar stays where it was so the existing
  specs keep passing; the LOG / RULES / ROLLS tabs and toolbar move are phase 2.
- `web/command-input.tsx` is untouched because the campaign page still renders it.

**Unresolved / risks for phase 2.**

- `InitiativePanel`'s two-column group grid overflows the 450px centre pane at 1440 in combat
  (visible in `combat-director-light-1440x900.png`); the initiative bar replaces it.
- `FoeHealth` in `bar` mode still renders the native `<progress>` because `table-audit.spec.ts`
  and the journeys address it by `progressbar` name (`Goblin Warrior health`); `HealthBar` renders
  `role="progressbar"` with the same label pattern, so the roster agent can swap it.
- The compact sheet keeps its own `max-h-[60vh]` body scroll inside the heroes pane; the sheet
  agent should drop it in favour of the pane scroll.
- Palette disclosure: `CommandLine` expands `web/palette.tsx`'s `<details>` through a ref after
  opening; a phase-2 log agent replacing the palette panel can remove that.

### 2026-09-15 — Phase 2 and lead integration (implementers: five parallel agents; lead: Claude Opus 5)

The five phase-2 agents (rosters, log and initiative, character sheet, wizard, campaign home) ran
in parallel in the shared checkout on disjoint files. All five were cut off by a model rate limit
before writing their work logs; four had finished their components and specs, the log agent had
finished its components but not its spec, and nobody had wired the new centre column into the page.
The lead completed the integration, wrote the two missing specs, and fixed the defects the
screenshots and the suite exposed. No agent's component work was discarded.

**Integration the lead completed**

- `web/table/index.tsx` now composes `LogPane` (initiative bar, LOG / RULES / ROLLS tabs, history
  toolbar, feed) with the setup and closeout cards as its children, replacing the old
  `InitiativePanel` + `Game log` block; `web/table/heroes-pane.tsx` mounts `HeroRingRow` while an
  encounter is committed, selecting a hero through the pane's existing viewed-hero callback.
- `tests/browser/v21-rosters.spec.ts` and `tests/browser/v21-log.spec.ts` written from the two
  briefs: compact cards with Stamina, Recoveries and the class resource; the drill-in and Back;
  Escape from a detail; the settings pop-up changing the player's foe presentation; the audience
  boundary (no peer Heroic Resource in the player's DOM); a foe Stamina edit read back through the
  card; dice chips, the session-marker pill, the ROLLS filter, the history toolbar, one bar segment
  per turn entry, taking a turn from a segment, and the Director-only Groups view.

**Defects found and fixed during integration**

| Defect | Fix |
| --- | --- |
| The player's table grew the document to 2,970px at a 900px viewport: Base UI's visually hidden checkbox inputs are `position: absolute`, and with no positioned ancestor they resolved against the initial containing block, escaping the shell's clip. | `.session-pane-scroll` is now `position: relative`, so the pane is the containing block. |
| Roster cards rendered no creature name in the 424px pane: a `truncate` name beside a `shrink-0` caps line collapses to zero width. | The name takes `min-w-0 flex-1`; the caps line truncates at 55%. The same failure in the sheet header is fixed with a floor width on the identity block, so the characteristics wrap instead. |
| The foe card's caps line (`Level 1 · Horde Harrier · EV 3`) left no room for the name. | `foeRoleLine(structured, { compact: true })` drops the organization and encounter value on cards; the stat block keeps the full line. |
| The Director's `Groups` control was absolutely positioned over the centred initiative eyebrow and overlapped it. | The eyebrow and the control are columns in one flex row; the eyebrow truncates with a title. |
| The history toolbar's explanation was clipped to `Rew…` between the buttons. | It wraps to its own line (`basis-full`). |
| Every `Disc` carried `role="img"` with the creature's name, duplicating the visible name and making `getByLabel` ambiguous. | The disc is decorative unless a caller passes `label`; the three places where it is the only identification (sheet header, log entry, ring row) pass one. |
| The wizard rail renumbered the presented steps 1–9, silently hiding that the source's step 8 (Complication) is not offered. | The rail and its eyebrow use the source numbers (`stepNumber`), so the sequence reads 1–7, 9, 10 of 10 and the gap is visible. |
| The rail replaced a step's chosen value with its outstanding count, so a decided step showed only a number. | Both are shown. |
| `ChoiceSection` gave its `<section>` an `aria-label` equal to its heading, which also matched a control inside it. | The visible heading names the section. |
| The invitation link took the mockup's filled `COPY` button, contradicting `docs/accounts-and-access-spec.md#5` ("an icon-only copy button beside each field (no visible button label)") and failing `campaign-sharing.spec.ts`. | Both fields use the icon control. The written specification governs where it speaks to appearance; the mockup does not override it. |
| Session player tiles could no longer be found by `getByLabel(displayName)`: a wrapping `<label>` contributes its whole text content, and the disc's initials are part of it. This broke `closeout`, `journey`, `combat` and `table-audit`. | The tile's checkbox carries `aria-label={displayName}`. |
| The compact sheet's pinned header had no boundary, so a card scrolling under it read as clipped. | A hard rule closes the sticky block. |
| Recovery pips wrapped onto a second line inside a 424px hero card. | The card shows the count; the pips stay in the sheet's Stamina block, where the mockup puts them. |
| `combat.spec.ts` asserted the old initiative wording `Round 1 · Foes to act`. | The bar's eyebrow takes the mockup's `ROUND n · FOES ACTING`; the spec follows. |
| `journey.spec.ts` counted three `Read Goblin Warrior in the rules` controls. | Two: the table's per-foe stat-block link moved into the drill-in, and the mockup's roster rows carry no rulebook icon. |
| `rule-popup.spec.ts` found two triggers named `Read 1. Think in the rules`: the step title and the hero summary's source callout. | The spec takes the trigger from the step region; both remain, in different landmarks. |
| `table-audit.spec.ts` and `combat.spec.ts` matched log entries through a bare `locator('strong')`. | A `logEntry(page, text)` helper scopes them to `[data-log-feed] li[data-sequence]`. |
| `table-audit.spec.ts` clicked `Show test difficulty`, `Show Malice` and the health mode directly in the Director pane, where those controls no longer are; the click waited out the six-minute budget. | A `withTableSettings` helper opens the settings card, acts on its switches and chips, and dismisses it. |
| `theme.spec.ts` left the wizard through the site nav's Characters link, which the wizard header replaced. | The spec navigates to `/characters`. |
| **Regression:** the wizard's remaining-value tokens were `draggable` but set no `dataTransfer` payload, so dropping one on a characteristic silently did nothing. Caught by `wizard.spec.ts`. | `onDragStart` writes the value; drag assignment works again. |
| **Regression:** moving the hero's abilities into the drill-in dropped `AbilityPanel` from the heroes pane, so a player had no way to use an ability at the table and the Director could not act for a hero. The sheet's ability cards are readable presentation and carry no Use control. Caught by the shared `tableJourney` helper. | The panel returns under the player's Selected sheet and inside the Director's hero drill-in, gated on a running session and `hero.controlled` exactly as before. |
| Turn controls in the card's right column widened it enough to truncate the creature's name even at 1920. | They sit under the row; the reticle keeps the right edge. |
| The shared `tableJourney` helper opened a foe's `Read Spear Charge in the rules` from the roster row, where a foe's abilities no longer are. | The journey opens the foe drill-in, reads the reference, and returns to the roster. |

**Verification**

- `pnpm lint`: clean (ESLint and Prettier).
- `pnpm check:app`: `tsc -p tsconfig.web.json` clean; 34 files, 317 tests passed.
- Browser: `pnpm exec playwright test` — **20 passed (9.1 minutes)**, the whole suite in one run,
  including the six new V21 specs and every pre-existing journey.
- `grep -rnE "#[0-9a-fA-F]{3,8}\b" web --include=*.tsx --include=*.ts | grep -v web/style.css`:
  no matches.
- `pnpm check:engine` 85 tests, `check-links` 156 files clean, `check-vendor` matches the pinned
  submodules, `content:check` matches the pinned Compendium (403 entries).

**Screenshot comparison against the mockups**

Captured under `.playtest/v21/<area>/` at 1440×900 and 1920×1080 in both themes and compared with
the owning mockup by eye:

- `session-free-play-director.png` / `combat-table-{light,dark}.png` against `shell/`, `rosters/`
  and `log/`: the session header, status pill, three edge-to-edge panes, compact roster rows with
  discs, bars and reticles, the acting tint, the segmented bar, the ring row, the feed with dice
  chips and marker pills, and the pinned command line all match. The pane widths follow the tokens
  rather than the mockup's frame ratio (recorded in the foundation entry).
- `character-sheet.png` against `sheet/`: header band, five characteristic boxes, the Stamina card
  with its bar, Winded tick and recovery pips, ability cards with tags and tier chips, Kit boxes,
  Features rows, Languages chips and Notes all match. Conditions, Surges, Victories and Roll test
  are present as the sheet spec requires and the mockup omits.
- `character-wizard-class.png` against `wizard/`: rail with markers and chosen values, progress bar,
  large step title with its sourced description, choice rows, pinned step navigation and the hero
  summary match.
- `campaign-home.png` against `campaign/`: header actions, player tiles, the game log with dot rows,
  Older activity, the invite card with Copy, member rows with discs and the foe chips with counts
  match.

**Known differences and gaps (not defects)**

- Class choice rows show no heroic-resource caps or description because the wizard model does not
  supply them for class options; the mockup's `ALL / MARTIAL / MAGIC` filter chips are not built
  (one class is offered in v0.01, so a filter over eight unavailable options would be noise).
- Encounter Value has no slot on the table (V06 owns party strength); the Foes heading carries
  Malice only.
- Full-page captures of sticky headers show the header at its scroll offset; that is a capture
  artifact, as the 2026-09-14 visual review also recorded.
- Q-V21-1 and Q-V21-2 in this document stay open: the RULES tab currently opens the reference
  library in the shared card and the Director's foe drill-in is a live block with the existing
  controls, both as proposed.

Review remains deferred to the user's audit thread (2026-09-14 directive). Nothing is committed.
