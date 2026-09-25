# Undead ingestion: kickoff and build handoff

Historical V30 handoff. The [current direction](v1-roadmap.md#version-one) and
[build status](build/STATUS.md) supersede the slice state below.

## Current slice — V30 second-echelon undead

The user selected and authorized the next slice: all nine second-echelon undead and their level-four
Malice. Work is on `slice/V30` in `/srv/presidium/projects/salient/foes`, based on main `663b49f`.
The slice is verified on branch: 437 tests, both browser journeys and independent implementation/source
reviews pass. Integration into main is pending. Read [V30](build/V30-second-echelon-undead.md), its current
status and reviews before continuing.
The older V27 checkpoint below is retained as history; its “next batch unselected” statement is superseded.

V30 expands the package to 20 stat blocks, 44 abilities, 24 traits and six features in two Malice records.
It preserves every original V27 object and edition. Batch selection, explicit counterpart mappings and
supporting-Malice links are maintained in `scripts/foes/batches.ts`. Engine execution, live roster loading
and persistent sharing UI remain separate. No additional monster batch is authorized by this handoff.

For integration, refresh Chords and current main, preserve peer work, rebase and run the required checks.
An assigned merge includes verification at the shared playable development target under the standing
merge directive. This branch's isolated browser target is frontend 5187; it needs no backend or data seed.

## Resume checkpoint — 2026-09-16

**V27 is complete, merged and live.** Main was clean at `e6ba249` when this checkpoint began.
Read the [final integration log](build/V27-undead-ingestion.md#main-integration-and-live-verification--2026-09-16)
and [consumer contract](../shared/foes/README.md); do not rebuild the finished slice.

- Public `/foes` on the shared app (port 5180) contains 11 first-echelon undead stat blocks,
  36 independently addressable abilities/traits, and four shared Malice features.
- Every emitted stat block and the shared Malice record has a Steel Cauldron comparison:
  12 explained outcomes, zero unresolved/missing/ambiguous/error outcomes. The
  [committed report](build/evidence/V27-steel-cauldron.json) records the exact revisions and findings.
  This coverage applies to V27; the rest of the core catalog has not yet been structured and compared
  by this pipeline. All 438 core stat blocks already have readable Rules articles.
- Integrated verification passed 432 tests, build and both isolated/shared-app browser checks.
  No backend sync, seed or reset was needed; existing play data was preserved.
- `slice/V27` is retired. `/srv/presidium/projects/salient/foes` is retained clean and detached at
  `e6ba249`; create a new slice branch from current main before future implementation.
- The next coverage batch/family is **not selected**. This checkpoint starts no new implementation.
  Engine execution, live foe loading and sharing UI remain separately scoped work.

## Historical V27 resume prompt

```text
Resume the foe ingestion track from docs/kickoff-undead-ingestion.md in the current main checkout.
V27 is complete, merged and verified live; do not repeat its assessment or implementation.
Refresh project instructions, Chords, Git/worktrees and docs/build/STATUS.md, then read V27's final
integration log and shared/foes/README.md. Follow my next request; no next coverage slice is selected.

If I request more coverage, select a bounded batch and an available slice ID, and branch from current
main in an isolated worktree. Preserve stable object IDs, the maintained identity registry, retained
editions, independently addressable features, original source content and regenerable corrections.
The parser branch owns rules interpretation and execution.

Compare every new output to its Steel Cauldron counterpart. Significant divergence requires review
against the pinned Compendium; missing/ambiguous/error outcomes never count as passing. Steel Cauldron
is an example and output comparison only: do not adapt its code without a clear license or use its
outputs as canonical app content. Do not infer whole-corpus implementation from this checkpoint.
```

## Historical V27 kickoff

The remainder records the original pre-implementation handoff. Its branch/setup observations,
verification counts and deployment limits describe that earlier point, not the current resume state
or the standing merge-completion directive.

### Original ready-to-paste kickoff

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

### Current state and setup

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

### Read next

1. [V27 build slice](build/V27-undead-ingestion.md): complete scope, inputs and acceptance checks.
2. [Monster catalog](monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15), including
   [full-output comparison](monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16).
3. [Unified object model](data-architecture-spec.md#35-unified-object-references-and-sharing) and
   [reference cards](reference-library-spec.md#app-wide-rule-cards).
4. [Assessment and proposed format](research/foe-catalog-kickoff.md),
   [core inventory](research/foe-catalog-audit-2026-09-15.json), and
   [Steel Cauldron comparison](research/steel-cauldron-output-comparison.md).

### Existing implementation to build on

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

### Evidence already established, with limits

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

### Expected hand-back

A working, regenerable undead package; individual feature lookup/search and themed previews; a complete
comparison report with explained discrepancies; source-derived tests and browser screenshots; and the
required independent implementation/source reviews. Report source coverage and remaining limitations
without implying that undead now execute in the engine. Keep the next step bounded before expanding
to the rest of the core corpus.
