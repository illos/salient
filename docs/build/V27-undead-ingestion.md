# V27: Undead ingestion and independent feature access

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Foe coverage track |
| Rules review | required — source completeness, normalized fields and comparison dispositions; no engine execution |
| Depends on | S01, A09, implemented Rules portion of V13, V23 assessment/specification |
| Unblocks | Broader core ingestion; app and parser consumption of monster definitions |
| Status | see `STATUS.md` |

## Goal

Build a reusable source importer and consumer-ready package for first-echelon undead. Definitions,
abilities and traits are individually addressable, searchable/filterable and independently viewable
using shared theme tokens. Every emitted stat block has an external comparison result. Deliver correct
data and source preservation; the parser branch owns interpretation and engine behavior.

## Spec references

- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`
- `docs/monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16`
- `docs/monster-catalog-spec.md#baseline-stats-and-unresolved-values`
- `docs/monster-catalog-spec.md#features-and-supporting-rules`
- `docs/monster-catalog-spec.md#proposed-import-procedure`
- `docs/data-architecture-spec.md#35-unified-object-references-and-sharing`
- `docs/reference-library-spec.md#confirmed-library-coverage`
- `docs/reference-library-spec.md#app-wide-rule-cards`

## In scope

- Eleven level-one stat blocks: Crawling Claw, Decrepit Skeleton, Ghost, Ghoul, Rotting Zombie, Shade,
  Skeleton, Soulwight, Specter, Umbral Stalker and Zombie.
- Their 23 abilities and 13 traits, plus the four first-echelon Undead Malice features in a separate
  supporting record. Preserve explicit links to existing core references rather than duplicating them.
- Source ingestion, validated display projections, immutable original text/records, complete ordered
  feature sections, source locators, stable logical identities and edition provenance.
- Shared lookup/resolution and generated creature/feature search projections. A feature resolves on its
  own with parent context; identically named traits on different monsters remain distinct.
- Repeatable correction/regeneration support, identity continuity and exception reporting.
- A small read-only app preview/search surface for whole blocks and individual features, using existing
  reference-card conventions and theme tokens. Keep it independent of live creature support.
- Steel Cauldron comparison accounting for every emitted stat block and the supporting Malice block,
  with explicit matches, differences, missing/ambiguous counterparts and review dispositions.

## Out of scope

- Effect compilation/execution, initiative changes, minion squads/captains, boss turns and ability use.
  These belong to parser/engine and V02/V03, not this ingestion slice.
- Generalizing `foe.add`, replacing Goblin Warrior in the live prototype, changing Convex persistence
  or source snapshots in existing encounters, and deployment.
- Full encounter builder/difficulty, all-core ingestion in this first slice, homebrew authoring,
  chat/bookmark/disclosure UI. Sharing compatibility means resolvable objects, not a new chat feature.
- Direct reuse of Steel Cauldron implementation, styling or generated content as our application data.

## Inputs and dependencies

Hard dependencies above have implementations or documentation in the recorded branches. V23 is a
documentation prerequisite, not a hidden new library. V13's Rules implementation is sufficient;
unfinished Items/Foes functionality does not block this slice. No runtime dependency on V05/V26 or
the parser branch is needed. Coordinate IDs, feature sections and provenance before editing any
shared adapter consumed by that branch; deliver a data-reading example without changing its compiler.

Compendium pin: `fb83a789da8f0327a389c277a0c790b1648d5810`.
Use `en/books/monsters/{json,md,md-linked}/monster/undead/1st-echelon/`, including `statblock/` and
`undead-malice-level-1-malice-features`. Read Git blobs at the pin rather than requiring full checkout.
The equivalent unified files are available for inspection. Do not advance or modify vendor sources.

Comparison baseline: Steel Cauldron revision `eba4b8bb8bc1baf947f15e67e9e923951092fd89`, corresponding
`data/monsters/<slug>.json` and `data/malice/undead-malice.json`. Use an explicit research/comparison
cache outside production content, with a recorded revision. No dependency on a changing external site
for ordinary offline unit tests. Unavailable comparison inputs produce an incomplete result, never pass.

The [session kickoff](../kickoff-undead-ingestion.md) records branch/environment setup and source findings.
No fixtures stand in for production ingestion; synthetic input variations are allowed in tests for
collisions, corrections, changed ordering and discrepancy detection, clearly separate from core content.

## Deliverables

- TypeScript content contract and reusable importer, sharing existing pinned-source helpers where useful.
- Generated definition/feature package, manifest and searchable projections; source and derived values
  remain distinguishable. Keep definition data usable from Node and the app without a backend.
- Build and check commands that regenerate deterministically, plus an explicit external-comparison command.
  Proposed names: `foes:build`, `foes:check`, `foes:compare`; these do not exist at kickoff.
- Small independent feature resolver/search API, parser-facing read example and themeable app preview.
- Source-derived tests, comparison report with dispositions, browser evidence and required reviews.
- Owning-spec implementation notes stating the actual format, commands, limitations and consumer contract.

## Acceptance checks

1. Generate exactly 11 stat blocks, 36 embedded features and four shared Malice features from the pinned
   sources. Retain all original records/text and source-qualified parent identities; no supplemental
   or unrelated creatures enter the selected package. Run generation twice and compare output bytes.
2. Check printed stats and envelope fields against source Markdown. Validate complete feature boundaries,
   including pre-roll and post-tier paragraphs, triggers, optional spending and trait bodies. A heading
   match alone does not pass. Test Ghost, Skeleton and Zombie explicitly.
3. Look up Skeleton, its Bone Shards ability and its Arise trait independently. Search for Arise returns
   distinct parent-bound results for Skeleton, Ghoul and Soulwight. Filter by trait/ability and printed
   usage/keywords without turning absent keywords or a dash into a real tag. Duplicate-name fixtures
   cannot collide; display reordering and projection fixes cannot retarget existing IDs.
4. Preserve minion EV amount and its per-four basis, captain-benefit text, blank Ghost role and source
   villain-action labels. Unknown/unmodeled input remains explicit and readable. Do not compile effects.
5. Demonstrate a generic extraction fix affecting multiple fixtures and a targeted correction with
   source revision/expected-value validation. Regenerate without hand-editing output; originals remain
   intact. Reject a stale or ambiguous correction and preserve exact edition references.
6. Read the same package through app and headless lookup. Resolve a monster and individual ability/trait
   through a reference compatible with the shared model, independent of a page route and private state.
7. Show whole-block and individual-feature previews using shared theme tokens in two existing themes;
   data/IDs stay unchanged. Browser checks cover search/filter selection, complete sections, reference
   navigation and accessible dismissal/focus behavior where a reference card is used. Capture screenshots.
8. Compare all 11 stat blocks and the supporting Malice record at the recorded external revision.
   Every emitted block has a report row. Record material divergences and source-backed dispositions;
   expose unmatched/unresolved counts. Induced numeric changes and missing paragraphs trigger review;
   presentation-only variants are distinguished, and failures cannot become successful matches.
9. Regression checks include missing and ambiguous counterpart fixtures, duplicate feature identities,
   consequential effect ordering and external formatting differences. Do not silently inherit the
   research scan's order-insensitive comparison as the production completeness check.
10. Run focused scripts/shared tests, `pnpm check`, and relevant browser checks. Obtain independent
    implementation review and source/rules review under the build process. Report checks actually run;
    this checkpoint does not claim any implementation or review has passed.

## Rules research

Read the selected pinned JSON/Markdown in full and use the first-echelon Malice source for its context.
Check the general rules only to establish source representation and links, not to implement behavior.
Confirmed corrections/search/theming/sharing requirements are Q-V-1; exhaustive external comparison is
Q-V-2. Steel Cauldron is secondary comparison evidence and cannot resolve a source ambiguity.

Source examples to preserve: Ghost's optional Haunt spending, Shriek trigger and post-roll sections;
Skeleton's post-tier effects and Arise; Zombie Dust's pre-roll paragraph and the longer consequence in
Clobber and Clutch; minion targeting and captain fields; shared Malice feature text outside stat blocks.

## Open questions

None blocking this assignment. Exact schema, identity mapping, index layout, cache location and preview
route are engineering choices under the owning contracts. Ask only if actual source ambiguity or a
consumer-contract conflict materially changes the implementation; keep ordinary progress independent.

## Work log

- 2026-09-16: Prepared at the user's checkpoint request as the next build slice; implementation not
  started. Primary track foe coverage. Intended branch `slice/V27`; no backend or frontend process
  configured. Prerequisite docs are on `slice/V23` in `/srv/presidium/projects/salient/foes`.
  The kickoff records setup and coordination without changing other tracks or shared main.

- 2026-09-16: Claimed by Codex. Reused clean `/srv/presidium/projects/salient/foes` on new
  `slice/V27`, based on current main `e83930e` plus the five explicit V23 documentation prerequisites.
  Main's uncommitted instructions read in place and preserved. Local build/read-only Vite on port 5187;
  no backend configuration or deployment. Plan: additive shared foe contract/package and identity registry,
  generic importer/corrections, exhaustive cached comparison, standalone public preview and tests.
  Existing parser and Convex adapters remain untouched; consumers use the new pure lookup boundary.
  Verify deterministic regeneration, source completeness, comparison failure cases, full check and browser
  screenshots, then independent implementation and source reviews. No fixture replaces production sources.

- Implementation: additive `shared/contracts/foes.ts`, `shared/foes/catalog.ts`, versioned generated
  package, maintained feature identities and paired correction support; `scripts/ingest-foes.ts` and
  `scripts/compare-foes.ts`; public `/foes` cards using shared themes and existing Rules rendering.
  Source reads use pinned book Git blobs; all 40 features retain original records and ordered complete
  sections. Existing Convex/parser files and Goblin loader are untouched. Rules header adds a preview link.
- Comparison: all 11 stat blocks plus shared Malice inspected at external revision
  `eba4b8bb8bc1baf947f15e67e9e923951092fd89`; [report](evidence/V27-steel-cauldron.json).
  Initial outcome: 12 explained rows; zero unresolved, missing, ambiguous or failed comparisons.
  Explanations retain source evidence: minion quantity absent from external numeric EV, default walk
  versus absent printed movement, generic external feature classifications, split Malice title and
  villain ordinals moved from upstream cost to external ability type. Effect markup/grouping differences
  are presentation-only when the ordered labels and text agree. Neither data source proves the other.
- Browser evidence: [light](evidence/V27-undead-light.png) and [dark](evidence/V27-undead-dark.png).
  Search, kind/usage/keyword filters, independent trait and ability cards, parent/back navigation,
  within-card Rules navigation, Escape/close dismissal and restored focus pass on isolated Vite 5187.
  No backend started/synced; the existing shell makes an unsuccessful optional auth-session request
  without preventing public reading. Screenshots inspected and text-button/line-break issues corrected.

- Verification before review: `pnpm check` passed (engine 85 tests; app/scripts suite and build,
  links, pins, snapshot checks). Subsequent extraction guards pass 13 focused foe tests plus typecheck/lint;
  complete final checks are rerun for review. `foes:check` is offline and source-regenerates identically.
  Explicit missing-cache CLI run exited 1 with all 12 parent records counted missing; normal cached
  comparison exits 0 with all 12 explained. Browser artifacts also include independent Haunt cards in
  [light](evidence/V27-ability-light.png) and [dark](evidence/V27-ability-dark.png).

- Independent review found and regression-tested four fixes: compare explicit EV quantities for ordinary
  foes too; revalidate corrected fields against corrected display; diagnose unknown parent prose/table
  content; reset card navigation when reopened. Focused tests now total 14. Generated edition stays
  `6c6bbd40f2460c196511a2f0cc19b2ff9184ddee27be90245e5d5a8a915ed331`.
- Final full-suite rerun exposed an unrelated existing `closeout-audit` false positive: its substring
  check for private Stamina value `37` matched timestamp `1789522853757`, while the returned payload
  correctly omitted the value. Replaced that assertion with an exact public-payload shape check,
  retaining the persisted private-journal checks. No backend behavior changed; this small test repair
  is reviewed separately with the implementation review.

- Final verification after repairs: `pnpm check` passes: 85 engine tests plus 331 app/scripts tests
  (including all 14 foe tests), lint/format/typechecks, documentation links, both clean vendor pins,
  existing content snapshot, offline foe/report validation and production build. The existing large
  main-chunk build advisory remains; the new lazy foe chunk is about 31 KB gzip.
  `pnpm exec playwright test --config playwright.foes.config.ts` passes the complete public browser flow
  and saves all four screenshots. Cached `node scripts/compare-foes.ts` exits 0; missing-cache run exits 1.
- Independent [implementation review](audits/2026-09-16-V27-independent-review.md) and
  [source review](audits/2026-09-16-V27-source-review.md) pass after fixes. Source review independently
  verified 36 pinned input blobs and 40 exact feature records/spans, and reproduced the comparison report.
- Integration boundary: main advanced independently to `a25a0e8` (V24/V25) during this assignment.
  V27 retains its documented base plus V23 prerequisites. Lead rebase/integration must preserve both
  tracks' status/question/spec edits and rerun integrated checks. This handoff does not merge main,
  update the user's running app, or deploy. Live Goblin support and all engine execution remain separate.

- Committed implementation as `02be722`; incidental test repair as `c209a6e`. V27 is complete in
  `slice/V27`, ready for lead integration. The [updated kickoff](../kickoff-undead-ingestion.md)
  points future sessions to the build handoff rather than repeating the assessment. Remaining work
  is integration and future broader coverage, engine execution and sharing UI, each in its own scope.
