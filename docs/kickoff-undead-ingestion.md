# Undead ingestion: kickoff and build handoff

Updated **2026-09-16**: [V27](build/V27-undead-ingestion.md) has been implemented and independently
reviewed. Read its closing work log and the [consumer contract](../shared/foes/README.md) for the
current package, commands, evidence and integration boundary. The original kickoff below is historical;
do not repeat the assessment or rebuild the finished slice. V27 and its V23 prerequisites are now merged into main and verified in the shared playable app at
`/foes`; see the final integration section in the slice log. Next is a separately bounded coverage
slice. Engine execution remains separate.

## Ready-to-paste kickoff

```text
Resume the foe track from /srv/presidium/projects/salient/foes/docs/kickoff-undead-ingestion.md.
Build V27: the 11 level-one undead stat blocks, their 36 abilities/traits, and four shared Malice
features. Read the kickoff and owning slice/specs, inspect current Git/worktrees, then implement.
Do not repeat the feasibility assessment or ask me to reconfirm the chosen first slice.

This track owns correct ingestion into shared app/parser data, independently addressable features,
search/filter indexes, reference resolution, correction/regeneration, and a small themeable preview.
The parser branch owns rules interpretation and execution. Do not expand live foe loading or squads.

Every generated stat block must have a Steel Cauldron comparison outcome; significant differences
trigger source-based manual investigation. Record missing/ambiguous counterparts and unresolved
findings explicitly. Use Steel Cauldron only as an example and output comparison, with no direct
adaptation of its code without a clear license. Our pinned Compendium remains the content authority.

Preserve existing work and use an isolated slice branch/worktree. Make routine implementation choices,
run the slice checks and required independent/source reviews, update docs, and hand back the build
with screenshots and comparison results. No deployment is authorized by this kickoff.
```

## Current state and setup

- Shared main: `/srv/presidium/projects/salient/code`, observed at `e83930e`. Its roadmap/process/root
  instruction changes and development-track checkpoint are uncommitted work belonging to the lead.
  Read current `AGENTS.md`, `agent.MD`, `CLAUDE.md`, roadmap and build process there; do not overwrite
  or copy their uncommitted files wholesale. Those newer instructions permit post-prototype track work.
- Foe assessment: `/srv/presidium/projects/salient/foes`, branch `slice/V23`. Its commits since main
  are documentation only: `30dc3db` assessment, `2c53830` addressable/regenerable content, `0c4c19d`
  output comparison, `3003ac5` full-coverage comparison, and this kickoff commit. Not merged to main.
- `slice/V27` is the intended implementation branch. Recheck branches and status before claiming it.
  Integrate/rebase the V23 documentation with the lead's current main before normal implementation
  setup. If integration is still pending, preserve the docs as an explicit prerequisite on the V27
  branch based on current main; do not lose these requirements or touch the lead's working files.
  Reuse the clean foe directory only after preserving V23; otherwise use a separate worktree.
- Other observed tracks: V22 parser assessment, V26 parser implementation specification, V24 character
  assessment and V25 character build. Recheck their current state. V26 is a consumer coordination
  point, not a hard dependency for producing data; do not edit its compiler/runtime incidentally.
- Both vendor pins are initialized and clean in the foe worktree. Their object stores reference the
  shared checkout, so retain that checkout. Dependencies are not installed here, and no `.env.local`,
  dev servers or isolated backend were configured by this session. Install pinned dependencies normally.
  This slice should need build-time data and a read-only frontend, not backend sync or seeding.

Use `git status --short`, `git log`, `git worktree list` and the current `docs/build/STATUS.md` to
refresh these observations. V27's row is Not started; update it on claim. Branch IDs and paths do not
establish that another session's work is reviewed or integrated.

## Read next

1. [V27 build slice](build/V27-undead-ingestion.md): complete scope, inputs and acceptance checks.
2. [Monster catalog](monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15), including
   [full-output comparison](monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16).
3. [Unified object model](data-architecture-spec.md#35-unified-object-references-and-sharing) and
   [reference cards](reference-library-spec.md#app-wide-rule-cards).
4. [Assessment and proposed format](research/foe-catalog-kickoff.md),
   [core inventory](research/foe-catalog-audit-2026-09-15.json), and
   [Steel Cauldron comparison](research/steel-cauldron-output-comparison.md).

## Existing implementation to build on

- `scripts/ingest-rules.ts`: core book Git-blob loading, source IDs, expanded Markdown, links and public
  reader assets. All 438 core stat blocks already have Rules articles; this is not structured foe ingestion.
- `scripts/build-content.ts`, `shared/contracts/content.ts`, `shared/content/README.md`: current source
  package and provenance. Its sole selected stat block is Goblin Warrior. Avoid unrelated character data
  churn when adding the new package; choose a clear shared adapter boundary.
- `shared/contracts/rules.ts`, `web/rules/reference.ts`, `web/rules/preview.tsx`, `web/rules/article.tsx`,
  `web/rules/search.ts`: existing public references, cards and search. A parent article plus a heading
  slug is not sufficient as the new independently addressable feature model.
- `convex/lib/resolve.ts`: current monster source/ability consumer, for contract inspection only.
  Coordinate with parser work before changing consumer APIs; no engine change is necessary for V27.
- `tests/scripts/build-content.test.ts`, `tests/scripts/rules.test.ts`, `tests/browser/rules.spec.ts`:
  relevant existing verification patterns. Put new data tests with the scripts/shared code they check.

Exact new filenames are implementation choices. Prefer a reusable TypeScript importer with selected
source paths, not eleven bespoke conversion scripts. Preserve complete feature text; normalization
and presentation must never become the only retained representation.

## Evidence already established, with limits

- Core corpus: 438 stat blocks, 4,380 agreeing stat comparisons, 1,800 matched feature headings.
  This established feasibility, not complete feature-section extraction or engine correctness.
- First undead slice: 11 blocks, 23 abilities, 13 traits and four separate shared Malice features.
- External sample: all 110 checked undead stats agreed; all 40 features' compared effect content
  agreed after formatting normalization. The latter comparison ignored effect grouping/order, so
  implement stronger checks. Differences include empty keywords, Zombie Dust grouping, display HTML,
  absent external feature IDs/provenance and EV quantity text not carried in the external numeric field.
- Prior checks: Rules regeneration passed for 2,614 entries with no unresolved links; documentation,
  vendor pins and audit assertions passed. No new importer, automated comparator, UI or backend tests
  have been implemented/run for V27. No running app was updated.
- Temporary `/tmp/` comparison files/scripts are disposable and not required to resume. Reproduce
  inspection from the recorded revisions; no external generated data was committed as application data.

## Expected hand-back

A working, regenerable undead package; individual feature lookup/search and themed previews; a complete
comparison report with explained discrepancies; source-derived tests and browser screenshots; and the
required independent implementation/source reviews. Report source coverage and remaining limitations
without implying that undead now execute in the engine. Keep the next step bounded before expanding
to the rest of the core corpus.
