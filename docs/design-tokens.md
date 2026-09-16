# Design tokens

Status: delivered by build slice A08 (2026-09-14). This document owns the visual token set that
`web/style.css` implements and that every `web/` component consumes. The style authority is
[the V1 mockup README](design-mockups/v1/README.md): an achromatic white/grey or dark foundation, a
muted brick-red accent, strong rules and borders, compact uppercase metadata and Schibsted Grotesk
typography. Its departures list is binding; nothing here adds content, labels or behavior from the
pictures. Finished polish is not a v0.01 gate (`agent.MD`, "For v0.01, focus on desktop").

Each value below is marked **measured** (sampled from the mockup PNGs with a headless Chromium canvas;
anti-aliased 1px rules were read from the darkest pixel of the run) or **chosen** (a decision made in
the build because the mockups do not define it; the mockup README states that exact values, the
spacing scale, component sizes and breakpoints are a build deliverable).

## Implementation

- Tokens are CSS custom properties on `:root` (light) and `.dark` (dark) in `web/style.css`, exposed
  to Tailwind through `@theme inline` so utilities such as `bg-card`, `text-muted-foreground`,
  `border-rule-strong`, `shadow-hard`, `text-2xs` and `tracking-caps` resolve to them. The shadcn
  variable names (`--background`, `--primary`, `--muted-foreground`, …) are kept so registry
  components keep working; project additions are `--rule-strong`, `--placeholder`,
  `--shadow-hard-color`, `--success`, `--warning`, the motion tokens and the type scale.
- Appearance preference: light, dark or system, switched by the `Appearance` toggle group in the
  top nav and on the login page. `web/theme.ts` stores it in `localStorage` under `salient.theme`,
  follows `prefers-color-scheme` changes while on `system`, and syncs other tabs through the
  `storage` event. `index.html` applies the stored class before first paint so a reload does not
  flash. Account preference storage waits for V10.
- Acceptance check 1 (no raw hex in components) is checked with
  `grep -rnE "#[0-9a-fA-F]{3,8}\b" web --include=*.tsx --include=*.ts | grep -v web/style.css`.

## Typography

| Token | Value | Provenance |
| --- | --- | --- |
| Font family | `'Schibsted Grotesk Variable', 'Schibsted Grotesk', ui-sans-serif, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` | Family measured from the mockup captions; fallback stack chosen. |
| Font source | `@fontsource-variable/schibsted-grotesk` 5.3.0 (npm), variable weight 400–900, latin and latin-ext subsets, self-hosted by the Vite build. | Chosen. No runtime font CDN. |
| Font license | SIL Open Font License 1.1; copyright 2023 The Schibsted-Grotesk Project Authors. The license text ships in `node_modules/@fontsource-variable/schibsted-grotesk/LICENSE`. | Recorded from the package. |
| Type scale | `2xs` 11px/16, `xs` 12/16, `sm` 13/20, `base` 14/24, `lg` 16/24, `xl` 19/24, `2xl` 24/28, `3xl` 32/36, `4xl` 48/48 (Tailwind `text-*` names) | Chosen. Body 14px; h1 32px (page titles), 48px on the login headline, which the mockup renders around 64px at 1652px width. |
| Weights | Body 400, labels and metadata 600, headings and buttons 700 | Chosen from the mockups' visual weight. |
| Uppercase metadata (`.caps`, `.eyebrow`) | 11px, weight 600, letter-spacing `0.12em`, uppercase | Size and tracking measured approximately (eyebrows are ~11px with ~1.3px tracking in the PNGs). |
| Heading tracking | `tracking-tight` (−0.025em); login headline `tracking-tighter` | Chosen. |

A second face is specified but not yet shipped: the Draw Steel Glyphs typeface, which sets the stat
block and ability-card icons, power roll tier pills, characteristic tiles and potency notation.
[The glyph usage specification](glyph-usage-spec.md) is a sub-specification of this document and owns
its vocabulary, composition rules and accessibility contract. Its glyphs are mapped onto ordinary ASCII
letters, so every use is subject to the `aria-hidden` and paired-text requirements in that document's
section 6; no component may write a raw glyph character.

## Colour

Light foundation (`:root`):

| Token | Hex | Provenance |
| --- | --- | --- |
| `--background` | `#ffffff` | Measured (page background, campaign-home.png, combat-table-light.png). |
| `--foreground` | `#111111` | Measured (wordmark, tags, hard rules). |
| `--card`, `--muted` | `#f5f5f5` | Measured (login left pane, account panels, session card). |
| `--muted-foreground` | `#717070` | Measured (eyebrows and secondary text: #717070/#737373 samples). |
| `--accent` (hover surface) | `#efefef` | Chosen, between card and border. |
| `--primary`, `--destructive` | `#a63b3a` | Measured (Sign in button, Start session, log dot, active nav underline, delete-account link). |
| `--primary-foreground` | `#ffffff` | Measured (button label). |
| `--secondary` / `--secondary-foreground` | `#111111` / `#ffffff` | Measured (Director tag, Save/Copy ink buttons, segmented control active state). |
| `--border` (soft rule) | `#e1e1e1` | Measured (list row rules #e1e1e1/#e7e7e7). |
| `--input` (control border) | `#d0d0d0` | Measured (account inputs #d0d0d0, chip borders #dadada/#e0e0e0). |
| `--rule-strong` | `#111111` | Measured (top-nav rule, heading rules, card borders, 1px). |
| `--ring` (focus) | `#111111` | Chosen: focus uses the ink outline, 2px, offset 2px. |
| `--placeholder` | `#d9d9d9` | Measured (skeleton bars in every mockup). |
| `--shadow-hard-color` | `#e7e7e7` | Measured (4px offset shadow under cards). |
| `--success` / `--warning` | `#3c6e47` / `#8a5a1c` | Chosen (connection status only; not in the mockups). |

Dark foundation (`.dark`):

| Token | Hex | Provenance |
| --- | --- | --- |
| `--background` | `#0e0e0e` | Measured (combat-table-dark.png page and nav). |
| `--foreground` | `#e7e3e0` | Measured (headings; a warm off-white, not pure white). |
| `--card`, `--muted` | `#171717` | Measured (cards, inputs, bar tracks). |
| `--muted-foreground` | `#8a8a8a` | Measured (metadata text). |
| `--accent` | `#1e1313` | Measured (acting row tint). |
| `--primary` | `#a63b3a` | Measured (same brick red in both themes). |
| `--secondary` / `--secondary-foreground` | `#e7e3e0` / `#0e0e0e` | Chosen (inverse ink for pressed states). |
| `--border` | `#222222` | Measured (row rules #1f1f1f–#222222). |
| `--input` | `#333333` | Chosen, one step above the border so controls read on the card tone. |
| `--rule-strong` | `#3a3a3a` | Chosen: the dark mockup uses soft grey rules (#2e2e2e measured); raised slightly for contrast. |
| `--ring` | `#e7e3e0` | Chosen. |
| `--placeholder` | `#242424` | Measured. |
| `--shadow-hard-color` | `transparent` | Chosen: the dark mockup has no offset shadows. |
| `--destructive` | `#e07470` | Chosen in the September 15 visual audit: lifted for readable error text on dark cards and notices. |
| `--success` / `--warning` | `#7fb88a` / `#d9a45b` | Chosen. |

Contrast notes (calculated using sRGB relative luminance): `#717070` on `#ffffff` is 4.94:1;
`#8a8a8a` on `#0e0e0e` is 5.59:1; white on `#a63b3a` is 6.35:1. Dark error text
`#e07470` on `#171717` is 5.89:1, or approximately 5.17:1 on an error notice's 10% tinted
background. These are text-pair spot checks, not a complete accessibility certification.
Dark destructive buttons use 10% tint normally and 15% on hover, giving approximately 5.17:1
and 4.79:1 against the dark card surface. Primary-action color remains the measured brick red.

## Rules, borders, radius and shadow

| Token | Value | Provenance |
| --- | --- | --- |
| Hard rule (`.rule-strong`) | 1px `--rule-strong` under page and section headings, top nav, card edges | Measured (1px in every mockup). |
| Soft rule (`.rule-soft`) | 1px `--border` between list rows | Measured. |
| Active nav underline | 2px `--primary` | Measured (campaign-home.png nav). |
| Notice accent | 2px left border `--rule-strong` on `--muted` | Chosen. |
| `--radius` | `0.125rem` (2px); `rounded-md` = 2px, `rounded-sm` = 1px, `rounded-lg` = 4px | Measured: buttons, cards and chips are square-cornered in the mockups; 2px keeps anti-aliasing clean. |
| `shadow-hard` | `4px 4px 0 0 --shadow-hard-color` on cards | Measured (light cards). |

## Spacing and layout

| Token | Value | Provenance |
| --- | --- | --- |
| Base unit | Tailwind default `0.25rem` | Chosen. |
| Page gutter | 36px (`px-9`), content max width 1460px | Chosen; the previous shell used the same width. |
| Top nav height | 56px, sticky, hard rule beneath | Measured (~60px in the mockups). |
| Card padding | 20px | Chosen (mockup cards use roughly 24px at their scale). |
| Column layout | two columns, main `minmax(0,1fr)` + aside 340–380px, 32px gap | Chosen. |
| Control height | 36px default buttons and inputs, 28px small, 44px large (login) | Chosen. |
| Minimum body width | 760px | Retained from the previous stylesheet; desktop first. |

## Session shell and table primitives (V21)

Added by build slice V21 (2026-09-15) for the desktop layout fidelity work. The mockup
measurements come from the [design fidelity audit](build/audits/2026-09-15-v1-design-audit.md)
(combat-table-dark.png: 1606px frame, header rule at 80px, pane rules at x 448 and x 1064). The
tokens are CSS custom properties on `:root` in `web/style.css`; the shell classes
(`.session-shell`, `.session-panes`, `.session-pane`, `.session-pane-scroll`) and the overlay card
classes (`.overlay-card*`) consume them. Primitives live under `web/components/`.

| Token | Value | Provenance |
| --- | --- | --- |
| `--session-header-height` | 70px | Measured (80px at the 1606px mockup frame, about 70px at 1440). |
| `--pane-side-width` | `min(424px, calc(424 / 1440 * 100vw))` | Measured 424px (Director pane; heroes pane in FreePlay). Chosen: fixed from 1440px up, scaled proportionally below; the body minimum of 760px still applies. |
| `--pane-heroes-combat-width` | `min(566px, calc(566 / 1440 * 100vw))` | Measured 566px (heroes pane while an encounter is committed). Same scaling rule. |
| `--pane-padding-x` / `--pane-padding-y` | 24px / 20px | Horizontal measured (24px in every session mockup); vertical chosen. |
| Pane rules | 1px `--rule-strong`, full height, between panes and under the header | Measured. Panes have no card wrappers; cards are reserved for callouts. |
| `--bar-thickness` | 6px | Measured (roster and sheet Stamina bars in the light mockups). |
| `--disc-sm` / `--disc-md` / `--disc-lg` / `--disc-ring` | 32px / 44px / 110px / 60px | Measured approximately (log entries, roster rows, sheet header, ring portraits). |
| `--disc-ring-stroke` | 3px | Measured approximately (ring portrait stroke). |
| `--chip-radius` / `--chip-border` | 2px / 1px | Measured (square-cornered chips with a 1px `--input` border; result chips filled ink, accent chips brick red). |
| `--pip-size` | 10px | Measured approximately (Recoveries squares). |
| Status pill | `--primary` fill, 28px tall, caps label; feed marker pill outlined `--input`, fully rounded | Measured (header pill filled; `SESSION STARTED` pill outlined). |
| Overlay card | `min(850px, 100vw - 2rem)` wide, `min(850px, 100dvh - 3rem)` tall, blurred 35% backdrop | Retained from the V13 rule card unchanged. |
| Dark theme shadows | none (`--shadow-hard-color: transparent`, unchanged) | Measured: the dark mockup has no offset shadow; the light hard-shadow token is kept for callout cards. |

## Motion, focus and disabled states

| Token | Value | Provenance |
| --- | --- | --- |
| `--motion-fast` / `--motion-base` / `--motion-slow` | 120ms / 180ms / 260ms, easing `cubic-bezier(0.2, 0, 0, 1)` | Chosen. Colour transitions on controls use `--motion-fast`. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` sets the motion tokens to `0s` and forces every transition and animation duration/delay to `0s` | Chosen; tested in `tests/browser/theme.spec.ts`. |
| Long sessions | No ambient animation; the only motion is short state transitions that finish and hold no references. Motion (the library) is not installed in A08 because the migrated screens have no panel or roster transitions; A03 can add it when the table needs them. | Chosen per `v1-tech-stack-spec.md#6-visual-quality-and-sustained-performance`. |
| Focus | `:focus-visible` outline 2px `--ring`, offset 2px | Chosen. |
| Disabled | `opacity: 0.5`, pointer events off (shadcn default) | Chosen. |

## Component baseline

shadcn/ui 4.21.0 with the Base UI variant (`@base-ui/react` 1.8.0, preset `nova`, `components.json`
at the repository root, alias `@/*` → `web/*`) was verified compatible with the pinned React 19.3.0,
Vite 8.3.0 and Tailwind 4.3.3: a scratch probe and the real `shadcn init`/`add` runs completed and
`pnpm check` passes. Runtime dependencies added (exact pins): `@base-ui/react`,
`class-variance-authority`, `cn`, `lucide-react`. Build-time: `shadcn` (for `shadcn/tailwind.css`),
`tw-animate-css`, `@fontsource-variable/schibsted-grotesk`.

Installed under `web/components/ui/`: `badge`, `button`, `card`, `checkbox`, `dialog`, `input`,
`label`, `select`, `separator`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`. The
button, badge, card, input, textarea, label and checkbox variants were edited to the tokens above
(uppercase compact button labels, brick primary, ink secondary, hard-outline secondary, rectangular
badges, hard-rule cards with the offset shadow). The others keep the registry defaults until a slice
uses them. `web/ui.tsx` adds the small project pieces the screens share: `Eyebrow`, `SectionHeading`
(heading with a hard rule and a trailing metadata slot), `Field`, `Notice`, `ErrorNotice`, `Loading`.

Native controls deliberately kept: the session-player and foe-visibility checkboxes stay native
`<input type="checkbox">` (styled with `accent-secondary`) because the browser journey addresses them
by label text, and the game-log session filter stays a native `<select>` (`.native-select`). The
Base UI `Checkbox` and `Select` remain available for new screens.

## Migration notes

- The sidebar shell is removed. The top nav carries the wordmark, Campaigns and Characters, the
  connection status, the appearance switch, the display name and Sign out. No Library item: the
  reference library is V13 and not specified for this shell.
- Q-HAND-1 (no "Draw Steel compatible" or similar phrase): the login eyebrow, the page title and
  the old sidebar wordmark no longer name Draw Steel. The login footer reads "Pre-alpha" and
  "Desktop first".
- Membership tags show Director / Player / Observer exactly as the campaign page did before this
  slice (the mockup README departure concerns presenting Observer as a standing role; the existing
  page derives Player from the active session's selection and Observer from its absence, which is
  the specified meaning). Changing that presentation is outside A08.
