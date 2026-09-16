# Local design reference (contents not tracked)

Everything in this directory except this README is ignored by Git. It holds source material used
to design against: scans or PDFs of the Draw Steel core books, and upstream font archives as
published.

These are MCDM materials, not project assets. They exist here so layout work can be checked against
the printed originals.

- **Never copy anything from here into `web/`, `public/` or any shipped bundle.** Assets that ship
  are added deliberately, with their licence recorded in
  [THIRD_PARTY_NOTICES.md](../../../../THIRD_PARTY_NOTICES.md).
- Page scans are design reference only. Do not transcribe rules text out of them; the pinned
  Compendium at `vendor/steel-compendium` remains the only permitted rules source, per
  [CLAUDE.md](../../../../CLAUDE.md).
- Cite pages by book and page number in slice documents so the reference survives the files.

## Contents

`core-books/` — page scans supplied by the user.

| File | Shows |
| --- | --- |
| `IMG_7234-monsters-stat-block-icons-legend.jpg` | The twelve-icon stat block legend. Matches `vendor/steel-compendium/en/unified/md/rule/monster/captain.md:23-38`. |
| `IMG_7238-monsters-p66-demon-stat-blocks.jpg` | Monsters p66. Bale Eye, Fangling, Fiktin: full stat block layout, characteristic row, tier rows, ability dividers. |
| `IMG_7235-monsters-p33-ajax-the-invincible.jpg` | Monsters p33. Solo layout, triggered actions, villain actions, dense potency notation. |
| `IMG_7231-heroes-the-wode-defends-ability-card.jpg` | A single hero ability card: left-edge ornament, keyword row, tier rows with `A<WEAK` style potency. |
| `IMG_7232-heroes-psionic-gift-ability-cards.jpg` | Stacked hero ability cards with multi-characteristic damage expressions. |

`fonts/` — Draw Steel Glyphs as published by MCDM.

`DrawSteelGlyphs.zip` is the upstream archive, `sha256
2a699a3a34530244d470e635e621bac2512b4b8c8f87ed0756fb9e40b7bebaaf`, retrieved 2026-09-15 from
`https://files.mcdmproductions.com/DrawSteel/DrawSteelGlyphs.zip` (the advertised `mcdm.gg` URL is a
meta-refresh stub). It expands to `DrawSteelGlyphs-Regular.otf` version 002.101, the official glyph
chart PDF, and `FontLicense.txt` recording CC BY-SA 4.0, © 2025 MCDM Productions.

The font is redistributable under that licence with attribution. The copy this project ships is added
by its own slice and must stay byte-identical to the upstream OTF, so that we redistribute rather than
adapt and never take on ShareAlike obligations of our own.
