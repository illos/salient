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
   and title is unchanged (checked by diffing the extracted string sets before and after).
7. Preserved subsystems unchanged: `git diff main -- web/components/glyph.css
   web/components/glyph.tsx web/components/core-content.css` is empty, and the `.ds-*` rules in
   `web/rules/rules.css` and `web/foes/foes.css` are unchanged.
8. Appearance preference behavior (`web/theme.ts`, `index.html` pre-paint script) is unchanged:
   light, dark and system still resolve to the `dark` class and `data-theme`.

## Ability design and playtest evidence

Not applicable.

## Rules research

None.

## Open questions

None recorded. Contrast note for the user (not a blocker, values are theirs): the spec's `muted`
on `sub` measures about 4.3:1 dark and 3.8:1 light, below the spec's own 4.5:1 line; on `card`
and `bg` it passes. The implementation uses the spec values as given.

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
