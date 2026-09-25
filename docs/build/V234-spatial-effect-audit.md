# V234: Audit spatial-dependent hero and monster effects

## Goal

Give the user a sourced list of effects resembling Overwhelm for triage, excluding the existing
area/aura multi-select membership flow.

## Scope

Read-only hero/monster audits delegated to two user-requested subagents. Engine checks current
shared runtime boundaries and integrates a clause-level list with sources, missing spatial facts,
current handling and review priority. No new blanket deferrals or game-runtime changes. User also requested a standalone interactive
HTML review document over MagicDNS, with per-effect comments and portable exports.

Spec: `docs/table-spec.md#inline-interaction-cards-in-the-game-log`;
`docs/lasting-effects-design.md#6-areas-and-auras`.
Pinned Compendium paths and named sections are given in the research report.

## Acceptance checks

1. List actual coverage and exclusions, distinguish source-only gaps from existing table-assisted
   operations, and provide source evidence for each named candidate. No invented rules support.
2. Exclude plain target selection and area/aura membership already handled by existing controls;
   extra independent spatial predicates remain eligible for triage.
3. QC reviews the documentation/source claims; Test checks links and diff whitespace on the
   final candidate, plus focused non-table browser checks for comment persistence, filtering,
   export/import, and the served document. No gameplay gate or runtime behavior claim for this documentation audit.

## Work log

- 2026-09-25: created `slice/V234` in `.worktrees/spatial-effect-audit` from `ecbe9289`.
  Delegated hero and monster inventories; inspected current area membership, triggered cards,
  conditional modifiers, resource claims and movement-follow-up boundaries. No tests run.
- Fast-forwarded the worktree to `43080f66` after V233 integration, retaining the accepted
  Overwhelm text-only disposition and spatial register.

- Added `scripts/spatial-review/build.py` and `template.html`. Build the standalone artifact with
  `python3 scripts/spatial-review/build.py <output-directory>`; generated HTML stays outside Git.
  Per-clause stable IDs, browser-local autosave, JSON/Markdown exports and JSON restore allow
  user triage without changing any game behavior. Serve only the generated artifact directory.
- Deploy reserved `https://presidium-iv.tail41404c.ts.net:9570/` for the review artifact.

- User requested a per-effect “Text only” checkbox. It synchronizes the disposition, persists
  locally and exports without a comment; unchecking resets the disposition to Unreviewed.
