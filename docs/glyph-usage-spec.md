# Draw Steel glyph usage specification

Status: recorded 2026-09-16. This is a sub-specification of [the design system](design-tokens.md) and
owns how the Draw Steel Glyphs typeface is used in `web/`. It defines the glyph vocabulary, the
composition rules the printed books follow, and the accessibility contract every glyph must satisfy.

V33 now supplies a shared descriptor, React/HTML reference renderers and an interactive design study;
production consumers are not migrated. See [the integration design](monster-presentation-spec.md). Requirements are labelled **confirmed** (observed in
the core books or the pinned Compendium), **chosen** (a build decision this document makes), or
**uncertain** (recorded in section 9, never silently defaulted).

## 1. Source, licence and distribution

**Confirmed.** The typeface is *Draw Steel Glyphs*, version 002.101, © 2025 MCDM Productions, LLC,
licensed **Creative Commons Attribution-ShareAlike 4.0 International**. The upstream archive is
`sha256 2a699a3a34530244d470e635e621bac2512b4b8c8f87ed0756fb9e40b7bebaaf`, retrieved 2026-09-15 from
`https://files.mcdmproductions.com/DrawSteel/DrawSteelGlyphs.zip`. The advertised `mcdm.gg` address is a
meta-refresh stub and does not return the archive. A local copy is kept under
[the ignored reference directory](design-mockups/v1/reference/README.md).

**Chosen.** The project ships `DrawSteelGlyphs-Regular.otf` **byte-identical to upstream**, 21,636
bytes, self-hosted and fingerprinted by the Vite build exactly as Schibsted Grotesk already is. No
subsetting and no WOFF2 conversion.

The unchanged upstream asset keeps distribution and verification straightforward. Its own license
and attribution remain separate from application code.

Attribution belongs in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) naming MCDM Productions, the
CC BY-SA 4.0 licence with its URL, the version string and the sha256. `FontLicense.txt` ships alongside
the font. This font is the one sanctioned exception to the rule in [AGENTS.md](../AGENTS.md) against
copying game artwork into application assets, and it is sanctioned only because its own licence grants
redistribution.

## 2. Authority and provenance

Three sources describe these glyphs. Where they disagree, **the printed core books win**, then the
pinned Compendium, and the font's own chart last — its labels are the least precise.

1. **The core rule books.** Page scans supplied by the user on 2026-09-15 and 2026-09-16, kept in
   `docs/design-mockups/v1/reference/core-books/` (ignored by Git; see that directory's README).
2. **The pinned Compendium.** The Monsters stat block icon legend is reproduced verbatim at
   `vendor/steel-compendium/en/unified/md/rule/monster/captain.md:23-38`, and matches the printed legend
   exactly. Ability records additionally carry a structured `icon:` frontmatter field.
3. **The font's glyph chart**, `Draw Steel Glyphs Chart.pdf` in the upstream archive. Useful for
   enumerating codepoints; its category names are unreliable (see section 4).

Reference scans and what each establishes:

| File in `reference/core-books/` | Establishes |
| --- | --- |
| `IMG_7234-monsters-stat-block-icons-legend.jpg` | The twelve-icon legend and the book's own wording for each meaning. |
| `IMG_7238-monsters-p66-demon-stat-blocks.jpg` | Monsters p66. Full stat block: icon before the ability name, characteristic row, distance and target lines, tier rows, ability dividers. |
| `IMG_7235-monsters-p33-ajax-the-invincible.jpg` | Monsters p33. Solo layout, triggered actions, villain actions, and the densest potency usage available. |
| `IMG_7231-heroes-the-wode-defends-ability-card.jpg` | A hero ability card: left-edge ornament, keyword row, and potency in its `A<WEAK` banner form. |
| `IMG_7232-heroes-psionic-gift-ability-cards.jpg` | Stacked hero ability cards; multi-characteristic damage expressions. |
| `IMG_7239`, `IMG_7240` | Magnified `Might +3`, establishing that the characteristic initial is the em-square form. |

The old Uses column below is a historical broad-corpus count, not a coverage gate. The scoped V33
[Core inventory](build/evidence/V33-glyph-inventory.json) counts 2,614 raw Core records once each.

## 3. Glyph inventory

Every glyph is written here as the literal character to type in the glyph font. The **Accessible name**
column is normative: it is the text a screen reader must receive, per section 6.

### 3.1 Ability and feature icons — confirmed

Meanings are the core-book legend's own wording, condensed. Corpus marker is the emoji the Compendium
uses for the same position.

| Glyph | Codepoint | Meaning (book legend) | Corpus marker | Uses | Accessible name |
| --- | --- | --- | --- | --- | --- |
| `o` | U+006F | The distance of the ability | 📏 | 2029 | `Distance` |
| `x` | U+0078 | The targets or affected area of the ability | 🎯 | 2029 | `Target` |
| `*` | U+002A | A trait of the creature, often always in effect | ⭐ | 1044 | `Trait` |
| `t` | U+0074 | A melee ability | 🗡 | 336 | `Melee` |
| `g` | U+0067 | A ranged ability | 🏹 | 277 | `Ranged` |
| `l` | U+006C | An ability that is melee or ranged, your choice | ⚔ | 53 | `Melee or ranged` |
| `f` | U+0066 | A self ability that only targets the user | 👤 | 91 | `Self` |
| `e` | U+0065 | A cube, line or wall area ability | 🔳 | 164 | `Area` |
| `b` | U+0062 | An aura or burst area ability | ❇ | 160 | `Aura or burst` |
| `c` | U+0063 | A special ability with a unique distance | 🌀 | 81 | `Special` |
| `)` | U+0029 | A triggered action | ❗ | 247 | `Triggered action` |
| `d` | U+0064 | A feature or ability specific to a leader or solo creature | ☠ | 225 | `Leader or solo feature` |
| `(` | U+0028 | Activation | ❕ | 22 | `Activation` |

Two notes on this table.

`d` is **not** "Malice". The font chart labels it `Villian Action "Malice"`, but the book legend defines
it as a leader or solo creature's feature and names villain actions only as an example. Use the book's
meaning; a villain action is one thing this marks, not the definition.

`(` is the one icon absent from the book's twelve. All 22 corpus uses are dynamic-terrain mechanisms,
where it pairs with `c` as `Activate` / `Deactivate`. It is relevant to V20 rather than to ability cards.

### 3.2 Power roll tier pills — confirmed

Each tier row in the books begins with a pill that replaces the text band label entirely.

| Glyph | Codepoint | Prints | Accessible name |
| --- | --- | --- | --- |
| `!` | U+0021 | ≤11 | `Tier 1, 11 or lower` |
| `@` | U+0040 | 12-16 | `Tier 2, 12 to 16` |
| `#` | U+0023 | 17+ | `Tier 3, 17 or higher` |

The bands are the ones already recorded at `shared/resolve/index.ts:70` from Compendium section 1.5, so
the accessible names transcribe the pill rather than introducing a threshold.

The font carries three further codepoints per tier (`¼ Á á`, `½ É é`, `¾ Í í`) differing only in
end-cap shape. The books use the three above. See section 9.

### 3.3 Characteristics — confirmed

Two families of the same five letters. Which to use is governed by section 4, not by the datum.

| Em-square | Proportional | Characteristic | Accessible name |
| --- | --- | --- | --- |
| `A` U+0041 | `a` U+0061 | Agility | `Agility` |
| `I` U+0049 | `i` U+0069 | Intuition | `Intuition` |
| `M` U+004D | `m` U+006D | Might | `Might` |
| `P` U+0050 | `p` U+0070 | Presence | `Presence` |
| `R` U+0052 | `r` U+0072 | Reason | `Reason` |

### 3.4 Composition set — confirmed

Used only inside a composed run, never alone.

| Glyphs | Codepoints | Role |
| --- | --- | --- |
| `0`–`9` | U+0030–U+0039 | Proportional digits, 590 units each |
| `<` `=` `>` | U+003C–U+003E | Comparators |
| `≤` `≥` | U+2264, U+2265 | Comparators, unused by the corpus |
| `-` `−` | U+002D, U+2212 | Hyphen and minus |
| `×` `÷` | U+00D7, U+00F7 | Multiplication and division |
| `[` `]` | U+005B, U+005D | Run end bars |
| `w` `v` `s` | U+0077, U+0076, U+0073 | WEAK / AVERAGE / STRONG banners |

### 3.5 Ornaments — confirmed as decorative

| Glyphs | Codepoints | Role |
| --- | --- | --- |
| `¡` | U+00A1 | Horizontal rule segment |
| `¢` | U+00A2 | Chevron notch |
| `£` | U+00A3 | Chevron with diamond |
| `¥` `®` `©` | U+00A5, U+00AE, U+00A9 | Diamonds, small to large |

A run of `¡` with a single `¢` draws the notched divider printed between abilities in the stat blocks
(`IMG_7238`); rendering `¡¡¡¢¡¡¡` reproduces it. `£` and the diamonds build the vertical ornament down
the left edge of hero ability cards (`IMG_7231`, `IMG_7232`) and the page-corner marks.

These are furniture. They carry no meaning and take no accessible name, ever.

## 4. The two characteristic families

**Confirmed.** The uppercase family has an advance width of exactly 1000 units — one full em — for every
letter, measured from the font's `hmtx` table. The lowercase family is proportional:

| | `A`/`a` | `I`/`i` | `M`/`m` | `P`/`p` | `R`/`r` |
| --- | --- | --- | --- | --- | --- |
| Em-square (upper) | 1000 | 1000 | 1000 | 1000 | 1000 |
| Proportional (lower) | 800 | 462 | 908 | 718 | 728 |

They are not stylistic alternates. The em-square form is a self-contained tile with uniform padding,
which is why a narrow `I` sits in as much whitespace as a wide `M`. The proportional form is a tiling
set, sized to its letter so that a run butts together with no internal gaps; uniform 1000-unit cells
would blow `A<1` apart with white space around the digit.

**The rule, confirmed against the books:**

> Use the proportional form when the glyph adjoins **another glyph**. Use the em-square form otherwise.

Adjoining ordinary text does not count. `M`ight in the characteristic row uses the em-square `M`
(`IMG_7239`, `IMG_7240`) even though it sits tight against the letters "ight", because "ight" is body
text and not a glyph. The only composed runs the books produce are the potency pills, so in practice the
proportional family is used exclusively there.

This makes the form a property of the **rendering context, not the content**. `M` in `2 + M damage` and
`M` in `Might +3` are the same datum; the component decides the form from whether it is emitting a
single tile or an element of a run. No variant tagging belongs in content or contracts.

The font chart's own names for these families are **`Rounded Atributes (AIMPR)`** and **`Block
Atributes (aimpr)`**. Those labels are recorded here only so the mapping is recoverable. Do not use them
in code or discussion — "block" has been used in this project to mean the opposite of the chart's
meaning, and the collision will keep causing errors. Use **em-square** and **proportional**.

## 5. Composed forms

### 5.1 Potency

**Confirmed.** A potency reads as one continuous black bar with hairline seams: proportional
characteristic, proportional comparator, then either proportional digits or a banner. Monster stat
blocks use numbers (`A<1`, `M<5`, `P<4`); hero abilities use banners (`A<WEAK`, `M<STRONG`).

The V33 scoped Core inventory finds 1,611 body occurrences in the form `X < Y`, where `X` is one
of `M A I R P` and `Y` is a nonnegative integer (including zero) or `WEAK`, `AVERAGE`, `STRONG`. That regularity makes detection
reliable; do not attempt looser matching.

The whole pill is **one** accessible unit. Its name spells the characteristic and reads the comparator
in words: `A<1` is `Agility less than 1`, and `M<STRONG` is `Might less than strong`. The individual
glyphs inside it are never announced separately. The banner wording is **chosen**, recorded in section 9.

### 5.2 Tier rows

**Confirmed.** Each tier row begins with its pill from section 3.2, followed by the result text. The
pill replaces the printed band label; do not render `Tier 1` or `≤11` as text beside it.

### 5.3 Characteristic initial

**Confirmed.** In a stat block characteristic row the em-square tile substitutes for the word's first
letter: the tile `M` followed by the body text `ight +3`. The accessible name of the whole construct is
the spelled word, `Might +3` — not `M` plus `ight`.

### 5.4 Standalone characteristic

**Confirmed.** In damage expressions the em-square tile stands as its own token: `2 + M or A damage`,
whose accessible name is `2 + Might or Agility damage`. Roughly 1,270 such occurrences exist in the
corpus.

## 6. Accessibility contract

**V33 supersedes the original V28 accessibility proposal.** The user explicitly prioritized automatic
ARIA assignment for the finite combinations. The normative contract is now
[Automatic ARIA contract](monster-presentation-spec.md#automatic-aria-contract).

Each meaningful symbol/composition has one `role="img"` and a generated `aria-label`. Its visual
children are `aria-hidden="true"`; only ornaments are entirely hidden. Potencies get one complete
name, not one name per character. Native document semantics remain outside the image wrapper.
A caller cannot supply an arbitrary label, role or decorative override.

The earlier role prohibition was based on a mistaken connection between ARIA and copying.
ARIA does not govern clipboard text. V33 separately keeps raw font codes in CSS-generated content
and keeps meaningful fallback text in the DOM. The glyph font is enabled only after successful
loading; `font-display: block` alone does not prevent ASCII fallback after its timeout. Browser
verification covers actual accessibility-tree exposure, font failure, selection and forced colors.

Sanitization currently happens in `scripts/ingest-rules.ts` and `scripts/foes/import.ts`, not the
React article component. Generate trusted glyph nodes after source sanitization. Never allow raw
source HTML to author arbitrary roles or labels merely to support this renderer.

## 7. Component contract

`shared/presentation/glyphs.ts` defines the finite `Glyph` union and `describeGlyph`, the only
mapping of semantic tokens to font characters and accessible names. `glyphHtml` and
`web/components/glyph.tsx` consume that same descriptor. Callers supply semantic tokens only.

The token families are icon, tier, characteristic, characteristicName, potency and ornament.
Potency owns proportional composition; the two characteristic contexts own em-square composition.
No public API renders a raw font character or supplies an arbitrary ARIA label. Numeric thresholds
are nonnegative safe integers; unsupported source grammar remains ordinary text with a diagnostic
at the integration boundary.

## 8. Where glyphs appear in Salient

The required consumers are monster references and Director stat blocks, hero ability/feature/kit
references and sheet cards, Rules articles and all embedded previews. These must share adapters;
see [the audited pipelines](monster-presentation-spec.md#what-the-current-pipelines-do) and
[the rollout method](monster-presentation-spec.md#integration-method).

Log references reuse the Rules adapter. A skull is not automatically added to Malice counters:
it means a leader/solo feature and appears only when source semantics call for it.
The current production paths still strip or flatten some markers. The V33 proof of concept does
not claim to have fixed those consumers. Source-to-render coverage is the gate for their later rollout.

## 9. Recorded uncertainties

Per [AGENTS.md](../AGENTS.md), these are recorded rather than defaulted.

1. **Tier end-cap alternates.** Nine codepoints (`¼ Á á ½ É é ¾ Í í`) duplicate the three tier pills with
   different end caps. Neither chart distinguishes them and the books use `!` `@` `#`. Proposal: ignore
   the alternates. No known cost.
2. **Potency banner wording.** `M<STRONG` is specified as `Might less than strong`, a literal
   transcription. The alternative is naming it as a potency comparison. Not resolved from source; the
   transcription avoids asserting rules language.
3. **Undocumented codepoints.** U+0027 is a smaller outlined activation mark and U+001A is blank. Neither
   appears in the books, the corpus or the font chart's categories. Proposal: leave both unmapped.
4. **Notes, `n` U+006E and `N` U+004E.** The font chart calls them "Notes"; no use appears anywhere in
   the corpus or the scans. The only `♪` in the Compendium is literal song lyrics in flavour text, so
   mapping that character would corrupt prose. Proposal: leave unmapped.
5. **Ornament placement.** Section 3.5 establishes what the ornaments are and that the books use them for
   dividers and card edges. Exact placement in Salient's layouts is not specified here and should be
   settled when the implementing slice reaches them; they are cosmetic and last in priority.
