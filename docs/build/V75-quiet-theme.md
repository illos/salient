# V75: Quiet design language (app-wide presentation theme)

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 (UI/polish track) |
| Owner type | App team |
| Rules review | not required |
| Depends on | A08, V21, V29, V31, V33, V34, V68 (all merged) |
| Unblocks | V17 (mobile layouts inherit the tokens) |
| Status | see `STATUS.md` |

## Goal

Replace the Classic visual language (hard rules, borders, uppercase tracked micro-labels, hard
shadows, 2px corners) with the user's Quiet design language across the whole app, in light and
dark: tonal layering (ground → panel → inset), sentence-case type at 13px or larger with weights
capped at 500, one brick-red highlight spent on interaction, soft 14px/8px/999px geometry. This
is **presentation only**: no label, string, data, operation, permission, route, backend or content
changes, no `data-testid`/ARIA name changes, and no test edits. The Draw Steel glyph system and
the Core stat-block presentation are preserved as they are.

User instruction, 2026-09-20: do everything from a clean commit so the design can be reverted if
it does not work out. The slice is built on `slice/V75` cut from clean main `9252b8f`; every
commit is presentation-only so the set can be reverted or left unmerged as a unit.

## Spec references

- `docs/design-mockups/quiet/README.md#tokens` — the token set (dark and light), radii, font, motion.
- `docs/design-mockups/quiet/README.md#type-scale` — sizes, weights and label treatment.
- `docs/design-mockups/quiet/README.md#classic--quiet-component-changes` — per-component targets.
- `docs/design-mockups/quiet/README.md#rules-of-thumb-for-new-screens` — layering, hairlines, accent budget.
- `docs/design-mockups/quiet/README.md#preserved-subsystems` — glyphs and Core stat blocks stay.
- `docs/design-mockups/quiet/README.md#known-departures-from-the-written-specification` — what not to build from the pictures.
- `docs/design-tokens.md#quiet-v75` — token mapping onto the existing CSS variables.
- `docs/design-mockups/v1/README.md#login-footer-wording` — Q-HAND-1, unchanged.
- `docs/table-spec.md#confirmed-combat-layout` — the three-pane layout and role contents, unchanged.
- `docs/character-sheet-spec.md#layout-and-content` — sheet contents, unchanged.
- `docs/glyph-usage-spec.md` — the glyph contract, unchanged.

## In scope

- `web/style.css`: Quiet tokens for `:root` (light) and `.dark`, radius/type/weight scale, base
  layer, `.caps`/`.eyebrow` redefined as 13px sentence case, session shell as three `card` panels.
- shadcn primitives under `web/components/ui/` and the project primitives under `web/components/`
  restyled: buttons, inputs, cards, tabs (segmented control), badges, labels, checkboxes, toggles,
  dialogs, selects, tables, chips, pills, pane headings, stat tiles, discs, health bars, pips,
  overlay card, user menu and appearance switch.
- Screen chrome restyled class-by-class: site nav, login, campaign home and pop-ups, characters
  list, character sheet, progression, wizard (header, rail, choice lists, hero-so-far), session
  shell and table panes (roster, log, initiative, targeting, setup/closeout/void cards, settings,
  command line), rules and foes library chrome (search, filters, navigation, previews).
- `index.html` theme-color metas; `docs/design-tokens.md` updated as the token authority.

## Out of scope

- Any string, label, casing-in-content, route, operation, permission or data change.
- Layout re-architecture beyond what the tokens imply (pane widths, column structure and the V68
  campaign home layout the user approved stay); mobile/tablet (V17).
- The Draw Steel glyph system and the Core stat-block/rule-text presentation
  (`glyph.css`, `core-content.css`, `.ds-*` rules): untouched apart from inherited variables.
- New browser tests (moratorium); edits to existing tests.
- Deployment or merge: this slice hands back a reviewed branch. The user decides whether the design
  works out before it is merged, so that reverting is a matter of not merging or reverting the
  V75 commits.

## Inputs and dependencies

All dependencies are merged in main `9252b8f`. Worktree `code/.worktrees/quiet-theme`, branch
`slice/V75`, `node_modules` symlinked to the main checkout, vendor submodules at the recorded pins
(Compendium cloned from the main module store; Forge Steel copied from the main sparse clone).

## Deliverables

- `docs/design-mockups/quiet/README.md` with the six reference screenshots.
- `web/style.css`, `web/components/**`, `web/ui.tsx`, `web/router.tsx`, `index.html`, and the
  screen files under `web/**` with class-level changes only.
- `docs/design-tokens.md` "Quiet (V75)" section; this document's work log; STATUS row; browser
  coverage backlog rows for the visual spot checks.

## Acceptance checks

1. `pnpm check` passes on the branch (lint, engine and app typecheck and tests, links, vendor,
   content, supporting, foes, build).
2. No raw hex colour in `web/**/*.ts(x)` outside `web/style.css`:
   `grep -rnE "#[0-9a-fA-F]{3,8}\b" web --include=*.tsx --include=*.ts` returns nothing.
3. No uppercase transform, caps tracking, hard shadow or strong rule remains in `web/**`:
   `grep -rnE "uppercase|tracking-caps|shadow-hard|border-rule-strong|bg-rule-strong" web --include=*.tsx`
   returns nothing; `.caps`/`.eyebrow` render 13px sentence case.
4. No text token below 13px: every `--text-*` size in `web/style.css` is ≥ `0.8125rem`, and no
   `text-[..px]` arbitrary size below 13px appears in `web/**`.
5. Weights: no Tailwind weight token resolves above 500 except `font-wordmark` (600); no
   `font-[6-9]00` arbitrary weight in `web/**`.
6. Diff review: no `.test.ts`/`.spec.ts` file changed; no file under `convex/`, `shared/`, `src/`,
   `scripts/` or `vendor/` changed; every JSX string literal, `data-testid`, `aria-label`, role
   and title is unchanged (checked by diffing the extracted string sets before and after), with
   two recorded exceptions: the login page's split-screen tagline is removed with the split
   layout, and its form heading becomes the page's `h1` (it was an `h2` under the tagline).
7. Preserved subsystems unchanged: `git diff main -- web/components/glyph.css
   web/components/glyph.tsx web/components/core-content.tsx` is empty; the only change in
   `web/components/core-content.css` is the surface tone of the `.ds-monster-title` gradient end
   and the `.ds-hero-ability::after` notch (`var(--background)` → `var(--card)`, because Core
   content now sits on card panels); the `.ds-*` rules in `web/rules/rules.css` and
   `web/foes/foes.css` and the `.rules-prose` rules are unchanged. The one addition is the scoped
   `.foe-statblock-flush` rules in `foes.css` (side padding and a right inset on the title band
   when a stat block fills a pop-up); no existing `.ds-*` declaration changes.
8. Appearance preference behavior (`web/theme.ts`, `index.html` pre-paint script) is unchanged:
   light, dark and system still resolve to the `dark` class and `data-theme`.

## Ability design and playtest evidence

Not applicable.

## Rules research

None.

## Open questions

None recorded. Contrast note for the user (not a blocker, values are theirs): the spec's `muted`
on `sub` measures about 4.3:1 dark and 3.8:1 light, and light `muted` on `bg` about 4.1:1, below
the spec's own 4.5:1 line; on `card` it passes in both themes. Accent used as text (cost pills,
Malice, "Acting") measures 2.2–2.9:1 on the dark surfaces, as it did in Classic. The
implementation uses the spec values as given; the dark focus ring is ink rather than accent so
keyboard focus stays visible.

## Programmatic headless completion gate

Not applicable in the ordinary sense: V75 adds or changes no capability, operation, route or
persisted state, so there is no new CLI/API journey to prove. The existing headless evidence for
every screen's operations stands. What a browser would add is purely visual (layout, theme,
focus rings, dialogs) and is logged in the [browser coverage backlog](browser-coverage-backlog.md)
for the post-V66 pass; screenshots for the user are a manual capture on the recorded target.

## Work log

### 2026-09-20 — claim and plan (Fable, UI/polish track)

- Worktree `code/.worktrees/quiet-theme`, branch `slice/V75` from main `9252b8f` (clean; the
  user asked for a clean base so the design can be reverted). `node_modules` symlinked to the
  main checkout; `vendor/steel-compendium` initialised from the main module store with
  `-c protocol.file.allow=always`, `vendor/forge-steel` copied from the main sparse clone;
  `pnpm check-vendor` passes (2 submodules at pin). Chords claim `v75-quiet-theme-claim-20260920`.
- Spec read in this checkout: the user's Quiet spec (recorded verbatim under
  `docs/design-mockups/quiet/README.md`) and the six screenshots; `docs/design-tokens.md`;
  `docs/design-mockups/v1/README.md` departures and Q-HAND-1; `docs/table-spec.md#confirmed-combat-layout`;
  `docs/character-sheet-spec.md#layout-and-content`. User guidance during the plan: the mockups
  are inspiration, not accurate to the live app; preserve the glyph system and the Core stat
  blocks.
- Method: a global token pass first so every screen inherits most of the change, then class-level
  restyles per area. Levers in `web/style.css`: the Quiet palette on the shadcn variables (`sub`
  → `--muted`/`--secondary`/`--input`, `ph` → `--placeholder`/`--accent`, `line` → `--border` and
  the legacy `--rule-strong`), radii 8/14/999, the type scale floored at 13px, Tailwind weight
  tokens capped at 500 (`--font-weight-bold: 500`; `font-wordmark` = 600), `--tracking-caps: 0`,
  `--shadow-hard: none`, and `.caps`/`.eyebrow` redefined as 13px sentence case so their 150
  call sites change without edits. `.rule-strong` keeps its name and spacing but draws no line.
- Rules for every edit: class names only; no string, `data-testid`, ARIA, role, route or
  operation changes; no test edits; no edits to `glyph.css`, `core-content.css` or `.ds-*` rules.
- Verification plan: `pnpm check` locally on Presidium (a permitted peer test environment); the
  grep gates in the acceptance checks; a before/after diff of the extracted string literals.
  No browser runs (moratorium); backlog rows for the visual spot checks.

### 2026-09-20 — built, rebased and verified (branch handoff pending review)

Commits on `slice/V75` after rebasing onto main `589d357` (V74 merged during the slice):
`9d8bac2` tokens and primitives, `aaee9cc` every screen, `5cb1f91` the V74 Runic Carving
section. The rebase conflicted only on appended browser-backlog rows; both sides kept.

Method as planned: the token pass in `web/style.css` (palette, radii 8/14/999, type floored at
13px, Tailwind weight tokens capped at 500 plus a `strong`/`b` base rule outside the Core
content, `caps`/`eyebrow` redefined, `rule-strong` drawing nothing, `shadow-hard: none`, the
session panes as `card` panels), then the primitives, then five parallel class-level passes
(table, character sheet/characters/progression, wizard, campaign/login recovery, Rules and Foes
chrome) under one written brief: className-only edits, no strings, ARIA, test ids, handlers or
tests; glyphs and `.ds-*`/`.rules-prose` untouched.

Judgment calls recorded (mock versus live app):

- The Core stat-block and ability presentation stays; the ability *group* wrapper is the Quiet
  panel. Two Core rules that painted the page ground (`.ds-monster-title` gradient end and the
  `.ds-hero-ability::after` notch) now use the card tone they sit on; nothing else in
  `core-content.css` changed.
- Information the pictures omit is kept and restyled tonally: the heroic-resource count on the
  hero portrait row, the wizard rail step numbers, the campaign member badges, Victories in the
  Stamina panel.
- The log tab row keeps its own buttons (the Rules tab opens a dialog; the Tabs primitive would
  change focus behavior); it is drawn as the segmented control.
- Symmetric choices with no default ("Heroes first"/"Foes first", keep/restore state) keep two
  primary buttons rather than biasing one.
- The login page drops its split-screen tagline with the split layout the spec replaces; this is
  the one string removal in the slice and the only string-set difference against main.
- The Rules top bar stays 76px under the 64px site nav because several sticky offsets depend on it.
- Native radio/checkbox inputs in the wizard and setup cards stay native (a primitive swap
  changes the change contract) and are restyled with classes.

Verification (Presidium local, worktree `code/.worktrees/quiet-theme`, source `5cb1f91`):

| Check | Result |
| --- | --- |
| `CI=true pnpm check` (lint, engine, app/scripts, links, vendor, content, supporting, foes, build) | exit 0 in 244 s: 310 engine tests, 481 app/scripts tests, 322 Markdown files linked, 2 submodules at pin, CSS bundle 75.49 kB (15.13 kB gzip) |
| Acceptance 2, raw hex in `web/**/*.ts(x)` | none |
| Acceptance 3, `uppercase`, `tracking-caps`, `shadow-hard`, `rule-strong` utilities in `web/**/*.tsx` | none |
| Acceptance 4–5, type floor and weight cap | `--text-*` minimum `0.8125rem`; no `text-[<13px]`; weight tokens 500, `font-wordmark` 600 only |
| Acceptance 6, presentation only | `git diff main...HEAD --name-only` touches `web/**`, `index.html` and docs only; string-set diff of JSX text and ARIA/test-id attributes against main shows only the login tagline |
| Acceptance 7, preserved subsystems | `glyph.css`, `glyph.tsx`, `core-content.tsx` unchanged; `core-content.css` differs in the two surface-tone lines above; no `.ds-*` line in the `rules.css`/`foes.css` diff |
| Acceptance 8, appearance behavior | `web/theme.ts` unchanged; `index.html` differs only in the two theme-color metas |

No browser run (moratorium); the visual spot checks are in the backlog. No runtime was
updated: this is a branch handoff, not a merge.

### 2026-09-20 — independent review round 1: changes required, addressed

Verdict on `5cb1f91`: changes required. Blocking: (1) the connection-status text had lost its
`●`/`○` prefixes (an unrecorded string change) — restored exactly; (2) acceptance check 7 said
the `core-content.css` diff is empty when two surface-tone lines change, and the verification
record was uncommitted — check reworded, record committed; (3) the roster target control was
invisible on the acting row (`sub` on `sub`) — it steps up to `ph` there. Non-blocking items
taken: dark focus ring changed from accent (2.2–2.9:1) to ink; an unlayered `.inset-controls`
rule steps tonal selects, outline buttons and badges up to `ph` inside the initiative, targeting,
setup and closeout insets; the emphasized characteristic tile (`aria-pressed`) gets an inset
accent ring; the dead tooltip primitive is tonal; the unused `--disc-ring-stroke` token is
removed; the light `muted`-on-`bg` figure corrected to 4.07:1 and accent-as-text added to the
contrast notes; the login heading level change recorded as the second exception; a backlog note
that the hero portrait row now carries a `progressbar` per hero. Deferred: `bg-sub`/`bg-ph`/
`border-line` aliases stay (documented vocabulary).

### 2026-09-20 — review round 2: pass; branch handoff

Round 2 on `7cd4313`: **pass**. Every round-1 finding reproduced as fixed; Tailwind 4.3.3
confirmed to register the `in-*` variant the reticle uses; contrast figures recomputed and
agree (light accent-as-text corrected to 5.8:1 here). Second full `CI=true pnpm check` on the
fixed tree: exit 0 in 237 s, 310 engine and 481 app/scripts tests, build CSS 75.69 kB
(15.20 kB gzip). Reviewer trailer `Reviewed-By: v75_implementation_review (pass, 2026-09-20)`
added to the slice commits; `node scripts/check-commit.ts --merge --range main..slice/V75`
passes.

**Handoff, not a merge.** `slice/V75` in `code/.worktrees/quiet-theme` is rebased onto main
`589d357` and clean. Nothing has been merged or deployed; the shared playable app still serves
Classic. The user asked for a clean base so the design can be reverted: reverting is either not
merging this branch or reverting its commits as a unit after a merge. Suggested next step: the
user views the theme (an isolated CT114 environment from this worktree, or a merge under the
standing directive when they ask for it), then decides. Preview URL work needs the CT114 heavy
window and is not started here. Browser spot checks stay in the backlog under the moratorium.

### 2026-09-20 — screenshots for the user, and one accent-budget fix

The user asked to see the design. Captured manually under the moratorium's carve-out for
user-requested screenshots (not a browser test, not acceptance evidence): an isolated local
stack from this worktree, a fresh anonymous Convex backend with its own state, seeded content,
and disposable data created through the app's own UI and operations. Method, target and the
twelve images are in [the evidence directory](evidence/V75/README.md).

Reviewing the captures found one real defect, now fixed: in the wizard's "hero so far" column,
`StatBox emphasis` marked every characteristic that had a value, so after the class step all
five tiles carried an accent ring. An assigned characteristic now steps up a tone
(`sub` → `ph`) instead, leaving the accent on the selected option, the current step, the live
status dot and the primary button. The character sheet header keeps the accent ring, where it
marks one pressed tile at a time.

Verified after the fix: `pnpm exec tsc -p tsconfig.web.json`, `pnpm exec eslint`, and
`pnpm exec prettier` on the changed file all pass; the captures above are from the fixed tree
except the character sheet and table images, which the fix does not touch.

The local stack remains available for further captures at `127.0.0.1:5180` (backend `3210`);
its data is disposable and nothing outside this worktree was touched.

### 2026-09-20 — user correction: stat-block pop-ups fill their panel

The user, looking at the foe stat-block capture: the monster's name was printed twice (once by
the panel header, once by the printed title band) and the card sat inside the panel's padding.

`OverlayCardContent` gains two presentation options. `flush` is for content that prints its own
title band: the body loses its padding so the card runs to the panel's rounded edges, the header
is not drawn, and Back and Close float over the top corners; the title stays as the dialog's
accessible name (`sr-only`), so the dialog keeps the same accessible name and heading it had.
`hideTitle` keeps the header, its eyebrow and its controls but drops the title line, for content
that prints its own name without a band to bleed.

In the foes reference, `flush` applies only when the object is a `statblock`; an ability, trait
or Malice card uses `hideTitle` (it prints its own name, but has no band, and floating controls
would collide with its own action line). A rule opened inside the same card is unchanged: the
article does not print its name, so it still needs the header title. Two scoped rules in
`web/foes/foes.css` give the flush stat block a comfortable side padding at the panel edge and
keep the printed level/role line clear of the floating close control; the Core `.ds-*` rules
themselves remain unchanged.

Verified: full `CI=true pnpm check` exit 0 (310 engine, 481 app/scripts tests, links, vendor,
content, build) and fresh captures of a minion stat block in both themes, a full stat block with
ability cards, and an ability opened from it, in [the evidence directory](evidence/V75/README.md).

### 2026-09-20 — user corrections to the reference pop-ups, second rebase, testing process

**User review of the pop-ups.** Three follow-ups from looking at the captures: ability cards had
three rows above their printed title; Back and Close looked like the same thing; source references
belong at the bottom of a card. Applied (commit "one control row on foe cards, sources at the
bottom"): the foe reference draws one slim control row and no eyebrow. Back and Close are
different actions (Back returns to the previous card inside the pop-up, Close dismisses it), but
the redundancy was real: "From <parent>" and "Back" both led to the parent when the ability had
been opened from its monster. Now one navigation pill sits beside Close: "From <parent>" returns
to the parent card (popping history when the parent is the previous card, opening it when the
card was reached directly), and "Back" appears only when the previous card is something other
than the parent. The foe view no longer repeats the parent control in its body. The "source
reference" eyebrow is gone; the foe card already prints its source footer, and a rule opened in
the foe card or from the rules library shows its "Draw Steel: <book>" line as a footer below the
article. No string was added; the dialog's accessible name is unchanged.

**Second rebase.** Main advanced through V72 (live compiled effects), V83/V84 (perk actions,
culture presets) and V02 (minion squads) while the branch waited: `slice/V75` is now rebased onto
main `618fadd`. Conflicts: appended browser-backlog rows (both kept), and `web/foes.tsx` and
`web/table/director-pane.tsx`, which V02 rewrote; main's versions were taken and are re-skinned
in the following commit together with the new `web/table/squad-sheet.tsx` and
`web/wizard/culture-preset.tsx` and the V72/V02/V84 additions inside `targeting.tsx`,
`initiative-bar.tsx`, `foe-sheet.tsx` and `wizard/index.tsx`.

**Testing process.** The user assigned all test execution to the testing coordinator
(`testing-process.md`, thread `46c30412-6e29-44dc-b30b-08ffe22bd0e3`) during this slice. From
here on this thread runs only authoring checks (prettier, eslint, tsc) and submits the full
`pnpm check` and any capture job to the coordinator; the local capture stack used earlier today
was stopped by the coordinator under the user's cleanup authorization, data retained. The capture
script for the pop-ups is `.playtest/v75/capture-popups.mjs` in the worktree (ignored; readable
by the coordinator), which needs only the public Rules and Foes routes.

### 2026-09-20 — user approval, third rebase, handoff to DEPLOY2

**Decision.** The user, having seen the captures, approved the Quiet theme and asked for it to be
merged. The revert path stays as recorded: the V75 commits are a contiguous presentation-only
range on top of main, so reverting them as a unit restores Classic.

**Third rebase.** Main advanced another 120 commits (V85/V86 complications and starting rewards,
V88 compiled potency conditions, V89, the V90/V91 process trim, V92 Shadow) while the branch
waited: `slice/V75` is now rebased onto main `c56f6fb`, then onto `5881bf1` (V93, docs, CI and a
lint override for its CommonJS helpers; no conflicts). Conflicts at `c56f6fb`: the STATUS table (main's
one-row-per-slice table taken, its V75 row kept), appended browser-backlog rows (both kept), and
the condition-badge call sites in `web/character-sheet/controls.tsx`, `web/table/foe-sheet.tsx`
and `web/table/squad-sheet.tsx`, where V88's condition-source `instances` props are kept and only
the label class changes. Commit `6f0f441` re-skins the one new screen piece, the V86 starting
rewards panel, onto the same treatment as its Notes neighbour (card on the full sheet, sub inset
with a muted label on the compact sheet, muted terms over medium tabular values); the compact mount
passes a presentation-only flag. The V88 condition-source lines render as main wrote them (their
`text-xs` is already floored at 13px by the token scale). Authoring checks on the rebased tree:
`CI=true pnpm exec tsc -p tsconfig.web.json`, `eslint web`, `prettier --check`, `check-links`
(411 files) pass; `check-commit --merge` passes once the review trailer is on the tip; acceptance
greps 2–5 return nothing; the string-set diff against main shows only JSX line reflow; no test or
non-presentation file differs. A fresh-context review of the rebase delta (conflict resolutions,
the starting rewards re-skin, the untouched V88 condition-source lines) returned `pass` with no
blocking findings; its interdiff found the previously reviewed patch byte-identical in
`targeting.tsx`, `director-pane.tsx`, `foes.tsx` and `wizard/index.tsx`.

**Handoff.** Integrated `CI=true pnpm check` on the rebased tip is submitted to the testing
coordinator; the tip is then handed to DEPLOY2 for the fast-forward, the cloud dev promotion and
the smoke check. The pop-up captures listed as pending in the evidence index were not taken (the
coordinator recorded the optional capture as skipped); the user approved from the captures on
file.

### 2026-09-20 — hosted promotion

TESTER `test-V75-c4ed53e-1` passed the full check (exit 0, 162 s). DEPLOY2 fast-forwarded main
to the frozen reviewed `c4ed53e48c74f5783b876cd6a7c09fafe2f0795c` and reused that gate.
The hosted build and frontend publication passed; Worker `31c58f6d-cfe2-4848-945e-908aa4104003`
serves the Quiet theme at `https://salient-dev.rdxx.workers.dev`.
Backend and content remain V92 (`81b7931`, 1182 entries); no backend publication or reseed.
Temporary credentials removed; private hosted helpers stopped. Build/publication logs:
`/srv/presidium/projects/salient/test-artifacts/V75-release-c4ed53e`.

TESTER1179 hosted smoke passed in 1.27 s: public HTML, CSS and all three referenced fonts
returned HTTP200 with exact hosted-build hashes; Quiet background/accent/Schibsted tokens were
present. No browser run. Evidence: `/srv/presidium/projects/salient/test-artifacts/V75-hosted-c4ed53e`.
