# Quiet — design language spec

Status: supplied by the user on 2026-09-20 as the app-level visual direction, implemented by build
slice [V75](../../build/V75-quiet-theme.md). This is a **presentation-only** change: labels,
data, workflows, permissions, operations and content are unchanged. The written specifications
stay authoritative for product content and behavior; this document owns the look.

The user's guidance (2026-09-20): the six screenshots below are **inspiration and guidance for
the finished look, not pixel targets**, and some of what they show is not accurate to the live
app. Judgment calls preserve the parts of the current app that are already polished: the Draw
Steel glyph system and the Core stat-block presentation (see
[Preserved subsystems](#preserved-subsystems)).

## Reference screens

Screenshots of `Themes Toggle.dc.html` (variant 11b Quiet) and `Character Sheet Quiet.dc.html`,
supplied by the user. They are not screenshots of implemented functionality.

- [Login, dark](login-dark.png) · [Login, light](login-light.png)
- [Combat table, dark](combat-table-dark.png) · [Combat table, light](combat-table-light.png)
- [Character sheet, dark](character-sheet-dark.png) · [Character sheet, light](character-sheet-light.png)

## Philosophy

Salient is stared at for hours in a dim room next to a map. Classic spends contrast on
*structure* — rules, borders, uppercase labels — so data has to compete with chrome. Quiet inverts
this:

1. **Surfaces recede, content carries weight.** Hierarchy comes from tonal steps (ground → panel
   → inset), not lines. If a border is needed, the layering is wrong.
2. **Type does the labelling.** Sentence case, size and weight replace tracked uppercase
   micro-labels. Nothing under 13px; weights capped at 500 (600 for the wordmark only).
3. **One highlight, spent on interaction.** The brick red marks primary actions, active/selected
   state, the acting hero, live results. Never decoration, never headings.
4. **Air over separators.** Spacing (gap 12–24px) groups things; hairlines appear only inside a
   panel between two peer rows.
5. **Soft geometry.** 14px panels, 8px controls, 999px pills/steppers. Nothing at 2px.
6. **Lower contrast ink.** Text is warm off-white/near-black, not pure. Still ≥ 4.5:1 on its
   surface.

## Tokens

Dark (default)

| token | value | use |
| --- | --- | --- |
| `bg` | `#121212` | page ground |
| `card` | `#1a1a1a` | panels |
| `sub` | `#232323` | insets inside panels: inputs, tier rows, kit stats, idle pills, segmented-control track |
| `ph` | `#2c2c2c` | placeholder/track fills, hover of `sub` |
| `line` | `#222222` | hairline between peer rows inside a panel |
| `ink` | `#d2cfc9` | text |
| `muted` | `#8a877f` | labels, meta, secondary |
| `accent` | `#a63a3a` | highlight |
| `onAccent` | `#ffffff` | text on accent |
| `frame` | `#2e2e2e` | outer screen border (mock only) |

Light

| token | value |
| --- | --- |
| `bg` | `#f4f3f0` |
| `card` | `#ffffff` |
| `sub` | `#ebe9e4` |
| `ph` | `#dcd9d3` |
| `line` | `#e8e6e1` |
| `ink` | `#2b2926` |
| `muted` | `#7a766f` |
| `accent` | `#a63a3a` |

Radius: `r = 14px` panels · `rs = 8px` controls, inputs, tier rows · `999px` pills, steppers, tab
track. Font: Schibsted Grotesk 400/500 (600 wordmark). Tabular numerals on all stats. Motion:
`background .15s`, `width .35s cubic-bezier(.2,0,0,1)` on bars, `transform .2s` chevrons. Roll
result pops in `.2s ease-out` scale .9→1.

The implementation maps these names onto the existing CSS variables in `web/style.css`; the
mapping and contrast notes are recorded in [design tokens](../../design-tokens.md#quiet-v75).

## Type scale

| role | spec |
| --- | --- |
| Page/character name | 500 30px |
| Panel title (Foes, Abilities…) | 500 20–22px |
| Card title (ability name, Conditions, Kit) | 500 17–20px |
| Hero number (stamina) | 500 40px tabular |
| Stat number (characteristics, ferocity) | 500 24–26px tabular |
| Body | 400 14–15px, line-height 1.5 |
| Label / meta | 400 13–14px `muted`, sentence case |
| Flavor text | 400 15px `muted`, no italic |

## Classic → Quiet component changes

**Top nav**: 56px with 2px bottom rule, uppercase 11px links, active link underlined in accent →
64px, no rule, 14px sentence-case links, active link = `ink`, others `muted`. Connected dot stays
green (`#5f8f6a`).

**Identity header**: chip row (Devil / Fury · Berserker / Level 1 / inverted Campaign chip) +
framed Victories box + bordered characteristic buttons → one `muted` 15px line "Devil · Fury,
Berserker · Level 1 · Obaron"; characteristics are borderless `card` tiles (84px wide, 8px radius,
number 24px over 13px label); Victories is the same tile unfilled.

**Stamina card**: bordered card with 4px hard drop shadow, 10px square bar with winded tick, ±temp
squares → borderless `card` panel; 6px rounded bar on `ph` track, fill `ink` (turns `accent` when
winded); "Winded at 15" text turns accent instead of a tick; temp uses 28px round steppers.
Recoveries merged into the same panel below a hairline: 6px rounded pips, "Catch breath · +10" as
a `sub`-filled 44px button (not inverted ink).

**Ferocity / Surges**: two bordered boxes, ferocity outlined in accent with accent text and 28px
square ± → one panel, two rows split by a hairline; ferocity marked only by an 8px accent dot
before the label; 32px round steppers in `sub`; numbers 26px `ink`.

**Conditions / Skills**: bordered uppercase 10px chips → 999px pills, 13px sentence case, idle
`sub`, hover `ph`; selected condition fills `accent` with `onAccent` text. Count reads "2 active"
/ "None".

**Stats**: 2-col grid with 1px `line` gutters and cell borders → plain 2-col list, row-gap 12px,
label `muted` left, value 500 right, no lines.

**Abilities header + filter**: bordered uppercase tab buttons (active inverted ink) → segmented
control: `card` 999px track, 4px padding, tabs 13px 500, active tab `sub` + `ink`, idle `muted`.
Count text removed.

**Ability card**: 1px border + 4px left edge (ink for signature, accent for cost), tag chips
(Signature / 3 Ferocity / Triggered) inline with title, uppercase placement line → borderless
`card` 14px panel, no edge; title 20px 500; single `muted` subline "Signature · Main action · Melee
1"; cost as one `sub` pill with `accent` text ("3 Ferocity") on the right; chevron `muted`. Rolled
card gets `inset 0 0 0 1px accent` ring instead of border color change.

**Ability body**: 3-cell bordered grid for keywords/distance/target → three plain columns, 13px
`muted` label over 14px value. Tier rows: bordered rows, hit row inverted accent → `sub`-filled 8px
rows, hit row fills `accent`/`onAccent` with "Result" trailing. Effect: bold "Effect:" → `muted`
"Effect" prefix, regular body. Spend: 3px accent left-border block → `sub` 8px block, "Spend 1
Ferocity." in accent, rest body. Action row: inverted ink uppercase button + top rule → 40px
`accent` 8px button "Roll 2d10" / "Resolve" (falls to `sub`/`muted` when unaffordable); hint 13px
`muted`; roll result is bare text (18px total, `muted` dice, `accent` tier), no framed badge.

**Common actions**: dashed-border box with bordered item chips → `card` panel at 80% opacity;
groups as label column + comma-joined text. No chips.

**Kit**: bordered card with shadow and 1px-gutter grid → panel; four `sub` 8px tiles (20px value
over 13px label); subtitle "Heavy armor, heavy weapon" in `muted`.

**Features**: rows with bottom rules, uppercase source → rows with 9px vertical padding, no rules;
source 13px `muted`.

**Languages**: bordered chips → one 14px comma-joined line.

**Table screen**: 56px header with 2px rule, uppercase status chip → 64px header, no rule, status
as accent dot + "Combat · Round 2"; Pause/End as `pane` 999px pills in `muted`. Three columns
become three `card` panels with 16px gaps and 16px page padding, 24px inside. Foes rows: no
dividers, 36px avatars, 4px rounded stamina bars, no trailing target circles. Turn tracker: 4px
bars, no outline on current. Prompt card: `sub` inset, no border/shadow, 18px rounded checkboxes
(checked = accent fill). Heroes: no conic rings or count badges — 48px circles with a 3px stamina
bar beneath; acting hero gets `outline: 2px accent, offset 3px` and "Acting" in `muted`.
Persistent-area block loses its double rule; command bar is a `sub` inset with `/` in `muted`.

**Login**: split screen with 2px rule, 64px headline, uppercase labels, bordered inputs → single
centered 360px column on `bg`; wordmark top-left and footer bottom-left at 13px `muted`; 48px
`pane` inputs, focused input = `pane2` with accent caret; 48px buttons: primary `accent`, secondary
`pane`; links row 14px `muted`, no underline.

## Rules of thumb for new screens

- Start with `bg`, place content in `card` panels, inset interactive things in `sub`. Stop there —
  no fourth layer.
- If two things need separating and a gap doesn't do it, add a hairline `line`, never a border.
- Labels are 13px `muted` sentence case above or beside their value. No uppercase, no
  letter-spacing.
- Accent budget per screen: primary button, selected/active states, live status. If you're about
  to use it on a heading, don't.
- Disabled/spent = `opacity .4`, not a different color.
- Hit targets ≥ 40px (buttons 40–48px, steppers 28–32px round inside a 44px row).

## Preserved subsystems

User guidance, 2026-09-20: the mockups do not show the live app's Draw Steel glyph system or its
Core stat blocks, both of which are finished and polished. The Quiet rollout applies to the
chrome around them and leaves these untouched apart from the colour variables they already
consume:

- The Draw Steel glyph font and semantics (`web/components/glyph.css`, `web/components/glyph.tsx`,
  [glyph usage](../../glyph-usage-spec.md)).
- The Core rule-text and stat-block presentation (`web/components/core-content.css`, the `.ds-*`
  rules in `web/rules/rules.css` and `web/foes/foes.css`, [V33](../../build/V33-core-stat-block-design.md),
  [V34](../../build/V34-sitewide-core-presentation.md)): Georgia serif body, bold stat labels,
  the accent-topped monster title band, the five-column characteristics grid, printed tier rows
  and ability cards as the books print them.

## Known departures from the written specification

The pictures predate or ignore settled decisions. Builders must not implement the elements below
from the picture.

| Image | Depicted element | Settled decision |
| --- | --- | --- |
| `login-*.png` | Footer "Pre-alpha · Draw Steel compatible"; "Have an invitation?" link; heading "Sign in" | Q-HAND-1 (2026-09-14): no compatibility or affiliation phrase. The footer keeps "Pre-alpha" and "Desktop first". Invitations are joined through their share link (`/join/<code>`); there is no invitation entry on the login page. Existing headings, labels and button text are unchanged (V75 is presentation only). |
| `combat-table-*.png` | Director foe controls beside a player-style "Selected sheet" pane; flat per-side initiative bar; fixed-bottom "Persistent area" card | Unchanged from the [V1 mockup departures](../v1/README.md#known-departures-from-the-written-specification): role-specific pane contents, grouped initiative, persistent areas deferred beyond v0.01. |
| `character-sheet-*.png` | Ability filter tabs (All / Main / Triggered / Free strikes); "Level up" absent; sample content | The sheet keeps its specified grouping and contents ([sheet spec](../../character-sheet-spec.md#layout-and-content)). The segmented-control styling applies to controls the sheet already has. |
| `character-sheet-*.png` | Sans-serif ability text with plain tier rows | Ability and rule text keep the Core presentation and glyphs ([Preserved subsystems](#preserved-subsystems)); the surrounding card takes the Quiet panel. |
| all | Placeholder bars and sample names/values | Approximate; the written specifications own content. |
