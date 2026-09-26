# V235: Verbatim source dropdowns for spatial review

## Goal

Give every spatial-review card an expandable verbatim source passage, as requested by the user.

## Scope

Read the existing canonical pinned Compendium at build time. Hero cards include their individual
feature/ability body; monster cards include their exact named section. Retain source Markdown
verbatim in a safely escaped, wrapping text block. Generated excerpts remain outside Git and
outside app assets in the user-requested tailnet review artifact; original content rights remain.
Retain all 515 IDs, V234 storage key and export/import schema so existing review notes survive.

## Acceptance checks

- All 515 entries have nonempty excerpts matching contiguous canonical source text; monster
  excerpts stop at their section boundary and preserve complete tiers/effect paragraphs.
- Expand/collapse with keyboard and pointer; literal text cannot become HTML. Wrapped source is
  usable on narrow screens. Existing saved notes and checkbox-only exports survive regeneration.
- QC review, then Test focused generator and non-table browser checks, then QC final/Deploy
  publication to the existing MagicDNS URL. No game-runtime behavior changes.

## Work log

- 2026-09-26: created slice/V235 from main 1fc59678. Added canonical-source section extraction,
  one native details dropdown per card, and excluded source bodies from comment exports.
  Source audit interpretation text and all IDs remain unchanged. Generator authoring run: 515 cards.
