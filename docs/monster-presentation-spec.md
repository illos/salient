# Core-style monster presentation and automatic glyph semantics

Status: V33 design and executable reference implementation, 2026-09-17. The user requested a
Core-book presentation design and, especially, a small system that automatically assigns ARIA
semantics to every known glyph combination. The preview demonstrates that contract. Production
Foes, sheets and Rules have **not** been migrated by this slice.

## Presentation

Use the supplied Monsters p66 and p33 scans for layout, and Heroes ability scans for composition;
all example rules text comes from the pinned Compendium, never transcribed from a scan.
The [interactive study](design-mockups/v33/index.html) includes Fangling, Bale Eye, Ajax,
Concussive Slam and The Wode Defends. The scans remain ignored under the
[local reference directory](design-mockups/v1/reference/README.md).

- Identity band: name and keywords left; printed level, organization, role and EV right. A quiet
  tint and one accent rule provide hierarchy. This design uses existing Salient colors, without
  assigning new game meaning to role colors.
- Five large printed values: Size, Speed, Stamina, Stability, Free Strike. Immunity, Weakness,
  Movement and With Captain (when present) follow in compact lines. Preserve nonnumeric values,
  EV denominators, source ordering and omitted-field distinctions in the production adapter.
- Characteristics form a single narrow ruled row. Use the em-square initial followed by the rest
  of the name, with one full accessible name. Scores remain normal text.
- Each ability has a category icon, bold name, right-aligned printed signature/cost, keywords/action
  row, then distance/target. A power roll stays verbatim; do not calculate a new expression in UI.
  Tiers are vertical rows with consistent badge width, not wrapping horizontal chips.
- Keep triggers, effect clauses, special cases and optional costs in source order. A thin notched
  divider separates features. Traits share the same rhythm, with their star marker.
- Use one continuous column for a solo; avoid CSS newspaper columns that split abilities or create
  an unclear reading order. Catalog comparisons can put independent monsters side by side.
- The study proposes Georgia for rule text and retains Schibsted for app controls. This is a visual
  proposal, not a global typography change. Text remains selectable and zoomable. Narrow containers
  wrap metadata and characteristics; they do not horizontally scroll the entire stat block.

The live Director sheet must retain the existing permission-filtered read and registered gameplay
controls. Put current Stamina/temporary Stamina, conditions, target and Use controls in a distinct live
control area above/beside the printed reference. Printed Stamina is never relabeled as current Stamina.
Opening the same reference from a catalog, sheet, log or Rules must use the same presentation adapter.
No automatic gameplay behavior or player access to the Director's full block follows from this design.

## Automatic ARIA contract

One finite token union, one descriptor function, two output adapters. The implementation is
[shared/presentation/glyphs.ts](../shared/presentation/glyphs.ts); React uses
[Glyph](../web/components/glyph.tsx), generated HTML uses `glyphHtml`. Neither adapter accepts
caller-provided `role`, `aria-label`, raw font characters or arbitrary children.

| Token family | Examples | Automatic output |
| --- | --- | --- |
| Icon | distance, target, trait, melee, ranged, melee-or-ranged, self, area, aura-or-burst, special, triggered, leader/solo, activation | One `role="img"`, fixed full name |
| Tier | 1, 2, 3 | One image named `Tier 1, 11 or lower`, `Tier 2, 12 to 16`, or `Tier 3, 17 or higher` |
| Characteristic symbol | M, A, R, I, P in a structured damage expression | One image named Might, Agility, Reason, Intuition or Presence |
| Characteristic word | em-square M + ordinary `ight` | One image named `Might`, with the score outside it as ordinary text |
| Potency | characteristic + `<` + nonnegative integer or WEAK/AVERAGE/STRONG | One image named, for example, `Agility less than 0` or `Might less than strong` |
| Ornament | divider, diamond, hero ornament | `aria-hidden="true"`, no label, role or tab stop |

There are **13 icon meanings, 3 tiers, 5 characteristics in each of two forms, 50 currently observed
potency combinations, and 3 reference ornament compositions**: 79 examples, 76 meaningful images.
This is a small grammar, not a list of every future integer. All five characteristics currently occur
with each threshold 0–6 and each named potency. A new nonnegative integer uses the same composition
and naming rule; an unknown operator or banner remains source text and is reported for review.
The existing meanings/codepoints remain in [the glyph vocabulary](glyph-usage-spec.md).

A potency is an atomic symbolic image: `role="img"` groups its internal visual pieces and
`aria-label` supplies its complete name. A generic span cannot simply take an accessible name;
there is no `aria-role` attribute or standard `potency`/`dice` role. This uses the
[W3C img role](https://www.w3.org/TR/wai-aria/#img) and
[HTML naming rules](https://www.w3.org/TR/html-aria/#docconformance). Do not give an entire ability
`role="img"`: that would hide the structure and interactive links within it. Keep native headings,
paragraphs, description lists, lists, links and buttons. Glyphs do not create keyboard stops.

```ts
// Both renderers derive the exact same role, name and font run.
{ kind: 'potency', characteristic: 'A', threshold: 2 }
// → one image named "Agility less than 2", visual font run a<2
```

The descriptor owns the uppercase em-square versus lowercase proportional distinction. Callers
cannot accidentally compose a potency out of five independently announced letters. Comparators,
digits, minus signs and potency banners are not public standalone glyph tokens. A negative score
remains ordinary text; unsupported mathematical expressions are not guessed from the font chart.

All meaningful tokens are labeled, even if their keyword appears later. V33 deliberately removes
V28's per-call `decorative` override: deciding whether a nearby keyword is equivalent is unreliable
and can erase a meaning. Only the ornament family is hidden. A later compound metadata adapter may
remove a duplicate **entire field** if it can prove the same accessible grouping already labels it;
no individual screen may suppress an icon's semantics by convention.

### Font, copying and fallback

Visual font codes exist only in a `data-glyph` attribute used by a hidden-from-AT CSS pseudo-element.
They never become DOM text. A real text fallback contains the descriptor's full name. The outer
image uses that same name; both children are hidden from AT so there is no double announcement.
The visual uses `user-select: none`; the semantic text stays selectable even when visually clipped.
No copy event handler is needed for the prototype. Validate real clipboard behavior across browsers
before promising universal clipboard interoperability; Chromium selection is tested here.

The exact font must finish loading before `ds-font-ready` enables glyphs. Before that, or if the
font request fails, the full text stays visible. `font-display: block` alone is insufficient: its
block period expires and fallback ASCII could appear. The stylesheet uses `currentColor` through
inheritance, including forced colors. Font codes are never added to search text or source exports.

## What the current pipelines do

| Path | Existing transformation | Gap and integration seam |
| --- | --- | --- |
| Rules | `scripts/ingest-rules.ts` reads Core `md` plus expanded `md-linked`, strips markers in `readableMarkdown`, promotes feature titles, resolves links, sanitizes HTML, writes ignored `public/rules-data` | Tokenize before marker destruction. Recognize block structure separately. Sanitization happens at ingest, **not** in `web/rules/article.tsx`. |
| Public Foes | `scripts/foes/import.ts` validates JSON against Markdown, creates separate statblock/feature objects with `fields`, `markdown`, `html`, source spans, IDs and immutable edition | Preserve complete fields/spans and feature order. Add a presentation adapter; do not mutate archived editions just to change typography. |
| Character sheets | `scripts/build-content.ts` keeps source/frontmatter; `convex/characters.ts:metadataOf` projects `SheetAbilityMetadata`; `AbilityCard` flattens small labels through `readableRuleText` | Metadata currently has no icon field and reads tiers from top-level fields, while some source records nest them in effects. Use a lossless presentation adapter for all effects, not just the first roll/summary. |
| Live foe sheet | `web/table/foe-sheet.tsx` reads a Director-only source snapshot; `RuleLink` opens the Rules reader | Keep snapshot revision and audience. Resolve presentation by source identity/revision, not editable foe name or newest catalog entry. |
| Rule previews/log references | `web/rules/preview.tsx`, `web/rules/article.tsx`, rulebook links | Reuse the same prepared article. Do not add a separate DOM replacement pass to each surface. |

The public Foes package presently covers 11 first-echelon undead. The five study fixtures are pinned
reference content for design, **not new playable monsters or hero choices**. The broader V30 importer
and V32 character changes are unmerged on other branches; coordinate those seams before rollout.

## Headless remains ordinary text

User-confirmed, 2026-09-17: the headless API, CLI, rules engine, stored state and source exports keep
ordinary characters and numbers, such as `A < 2`, `2 + M damage` and `Might +3`. No font codes,
HTML, ARIA attributes or glyph tokens enter a mechanical value or replace original source text.
The presentation model is optional derived web output, not a new canonical content format.
Accessible names expand abbreviations only for the web accessibility/copy projection. A terminal
never needs the glyph font and headless JSON snapshots must remain unchanged by renderer work.

## Integration method

1. Preserve verbatim source and provenance. Add a versioned presentation projection beside the
   rules/gameplay representation; never store font codes in game state. The input is structured facts
   plus a Markdown AST retaining every source clause, link, heading and unknown node.
2. Produce the finite glyph tokens once at the content boundary. Explicit `icon` metadata and exact
   source markers win. Stat fields and tier positions supply their own tokens. Do not infer an icon
   from cost: the skull is a leader/solo feature, **not** a generic Malice symbol.
3. Scan only eligible Markdown text nodes for the exact printed potency pattern and known markers.
   Do not rewrite raw HTML strings, attributes, URLs, code, IDs or the English pronoun `I`. Standalone
   characteristic tiles require a recognized damage-expression node. Keep unrecognized text intact.
   Preserve stable heading IDs from the existing plain heading text before injecting glyph nodes.
4. Both AST-to-HTML and React output call `describeGlyph`. For generated HTML, sanitize source first,
   then insert only escaped trusted glyph nodes; do not let authored HTML claim trusted ARIA. A
   structured HAST adapter is preferred for production; the prototype's post-sanitize serializer
   demonstrates the boundary. Keep source links as links outside image wrappers.
5. Route Foes, full/compact hero cards, embedded kit abilities, features, Rules pages and previews
   through those adapters. Source-snapshot references keep their edition/revision. Compact cards may
   have an explicit summary mode, but their full reference uses the same complete model.
6. Keep source/headless exports in their original plain-text form. Web search may index semantic
   names in addition to source text; web accessible-copy may use expanded names from the tokens.
   Neither replaces canonical source or headless output. Presentation regeneration must bump the Rules renderer/cache version; retain source hashes, SCC identities and
   source ordering. Archived Foe edition bytes remain immutable. If generated HTML is retained in a
   new package, issue a new edition and keep old editions resolvable.

This design does **not** require a new backend or changing the rules parser. Production projection
changes may need additive sheet metadata, with its own tested integration. The current standalone
reference components and preview are ready to exercise the policy before connecting those consumers.

## Coverage that prevents omissions

The acceptance gate is a **source-to-render coverage report**, not a checklist for authors to fill in.
For each pinned record and each recognized semantic occurrence, record its source ID/path, position,
family and canonical token. Render it through both adapters and compare the expected role/name.
Every eligible occurrence must be rendered or explicitly retain source text with a diagnostic;
there is no silent discard count. Surface tests also assert that a corresponding token actually reaches
its DOM/AX tree. An exhaustive renderer test alone cannot prove that an upstream parser used it.

Run `node scripts/audit-glyphs.ts --check` to verify the scoped inventory against pinned Git blobs.
V33 includes a reproducible [Core inventory](build/evidence/V33-glyph-inventory.json), exhaustive
79-example renderer tests, and a browser study. The full consumer coverage gate is a rollout requirement,
not something the design prototype claims to have completed. Current inventory counts 2,614 Core `md`
records once each (no `md-linked`, `unified`, JSON or frontmatter duplicates), including 1,611 printed
potencies and 50 unique potency combinations. Retain corpus-revision and counting-scope metadata so
future counts are comparable.

Required production regressions: numeric zero and multi-digit potency; all three banners and tiers;
all 13 markers including variation selectors; multi-characteristic damage; negative characteristic
scores; nested/linked/spend effects; unknown markers and malformed comparisons; plain prose containing
`I`, code and URLs; source headings/deep links; sanitization; archived editions; Director/player
visibility; light/dark/forced colors; missing font; narrow width and 200% text; keyboard links;
selection/clipboard. Test the actual accessibility tree, not just `aria-label` attributes.
