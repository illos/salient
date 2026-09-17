# V28: Draw Steel glyph typography

Historical outline carried from `391509c`. V33 supersedes its renderer/accessibility decisions;
see [V33](V33-core-stat-block-design.md) and the current glyph specification. The original acceptance
wording below is retained as history, not an instruction to use the old hidden-text-only pattern.

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | UI/polish track |
| Rules review | not required |
| Depends on | A08, S01, V13 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Set the Draw Steel Glyphs typeface across the surfaces that print ability and stat block metadata, so
that distance, target, ability category, traits, power roll tiers, characteristics and potency read as
they do in the core books. The slice ships the font, a typed glyph vocabulary, and the accessibility
contract that keeps glyph characters out of every accessible name. It adds no rules resolution and no
content.

## Spec references

- `docs/glyph-usage-spec.md` — owns the vocabulary, composition rules and accessibility contract.
- `docs/glyph-usage-spec.md#6-accessibility-contract` — the mandatory `aria-hidden` and paired-text model.
- `docs/glyph-usage-spec.md#7-component-contract` — the proposed component surface.
- `docs/glyph-usage-spec.md#8-where-glyphs-appear-in-salient` — placement and the required pipeline change.
- `docs/design-tokens.md#typography` — the design system section this sub-specification hangs from.
- `docs/character-sheet-spec.md#actions-tests-and-readable-rules` — the ability card metadata being set.

## In scope

- Ship `DrawSteelGlyphs-Regular.otf` byte-identical to upstream, self-hosted through the Vite build,
  with a `@font-face` rule and a font token; record attribution in `THIRD_PARTY_NOTICES.md`.
- `web/components/glyph.tsx`: a typed `GlyphName` union carrying each glyph's codepoint and default
  accessible name, labelled by default, with a separate export for ornaments that cannot be labelled.
- A potency component owning the whole composed run and emitting one accessible name for it.
- Preserve the markers instead of discarding them: `scripts/ingest-rules.ts` (currently strips them at
  lines 183-185) and `web/rules/reference.ts`.
- Extend the rules reader's `rehypeSanitize` schema to admit exactly the two generated span shapes.
- Apply at ability cards, foe stat blocks, rules articles, and the leader-or-solo marker in the log.

## Out of scope

- The nine unused tier end-cap alternates, the Notes glyphs, U+0027 and U+001A
  (`docs/glyph-usage-spec.md#9-recorded-uncertainties`).
- Ornament placement in Salient's own layouts; the spec establishes what the ornaments are but not
  where they go. Cosmetic, and last if the slice has room.
- Any change to rules resolution, ability parsing, or what the projections contain.
- Mobile layout work, which remains V17's.

## Inputs and dependencies

- Hard: A08 for the token set and the no-raw-hex rule; S01 for the ingest pipeline being changed.
- Soft: V13 for the rules reader surface; the slice degrades to cards and stat blocks without it.
- Reference: core-book page scans and the upstream font archive under
  `docs/design-mockups/v1/reference/` (ignored by Git; see that directory's README).

## Deliverables

- The font asset, font token, `THIRD_PARTY_NOTICES.md` entry and a `docs/design-tokens.md` row.
- `web/components/glyph.tsx` and the potency component, with unit tests over the vocabulary.
- Ingest and reference-text changes preserving markers, with tests over the rewrite.
- Browser tests asserting the accessibility contract.

## Acceptance checks

1. No element's accessible name contains a bare glyph character, asserted over ability cards, foe stat
   blocks and a rules article.
2. An ability card's accessible name spells out distance, target, action category and every potency;
   `A<1` reads as `Agility less than 1`.
3. A stat block characteristic row announces `Might +3`, not `M` or `ight`.
4. A leading category icon whose word already appears in the adjacent keyword row is not announced twice.
5. Selecting and copying an ability yields the spelled words, never `t` or `a<1`.
6. Ornament runs expose no accessible name.
7. Glyph tiles invert between light and dark themes with no per-theme rule, and the no-raw-hex check
   still passes.
8. The shipped OTF is byte-identical to the upstream archive's, verified by hash.

## Rules research

None. The glyph meanings come from the core-book legend, reproduced in the pinned Compendium at
`vendor/steel-compendium/en/unified/md/rule/monster/captain.md:23-38`. The power roll tier bands used in
accessible names are the ones already recorded at `shared/resolve/index.ts:70`. The slice introduces no
formula, threshold or resource grant, so no rules review is required; if an accessible name would state
a rule rather than transcribe printed text, that is a defect and the wording goes to
`docs/rules-questions-for-user.md` instead.

## Open questions

Carried from `docs/glyph-usage-spec.md#9-recorded-uncertainties`. None blocks implementation.

- Potency banner wording: `Might less than strong` as literal transcription, versus naming it as a
  potency comparison.
- Whether ornaments are in this slice at all, or deferred.

## Work log

_Empty._
