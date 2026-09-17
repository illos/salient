# V30: Second-echelon undead ingestion

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team — foe ingestion |
| Rules review | required |
| Depends on | V27 |
| Unblocks | Further bounded foe coverage |
| Status | see `STATUS.md` |

## Goal

Expand the public foe package to all 20 first/second-echelon undead with independently addressable
abilities, traits and both shared Malice records. Preserve deterministic correction/regeneration and
exact historical references. Rules interpretation and execution remain the parser track's work.

## Spec references

- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`
- `docs/monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16`
- `docs/data-architecture-spec.md#35-unified-object-references-and-sharing`
- `docs/reference-library-spec.md#app-wide-rule-cards`

## In scope

- Configurable maintained batch selection replacing first-echelon-only paths/counts.
- Nine new stat blocks, 21 abilities, 11 traits and two level-four Malice features.
- Correct batch-specific Malice links, including the prior-Malice reference.
- Exhaustive comparison of all 22 parent records, with source-based discrepancy review.
- Existing themeable previews/search and exact retained-edition resolution.

## Out of scope

Engine execution, live roster loading, encounter preparation and persistent sharing UI remain separate
under the owning ingestion requirements and V27 consumer contract. No backend changes.

## Inputs and dependencies

V27 is a hard dependency, merged at main `663b49f`. Pinned Steel Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810` is the content authority. Steel Cauldron generated
outputs at `eba4b8bb8bc1baf947f15e67e9e923951092fd89` are comparison inputs only, under the
user-authorized exception; no external code adaptation. Tests use synthetic source-derived comparison
fixtures, not network access or copied external data. No stubs.

## Deliverables

- `scripts/foes/batches.ts`, updated importer/comparator and maintained identity registry.
- Regenerated current package plus immutable new edition; original V27 edition retained.
- `docs/build/evidence/V30-steel-cauldron.json` and discrepancy dispositions.
- Public `/foes` counts, supporting-reference labels, source-based tests and browser evidence.
- Consumer/spec updates and independent implementation/source reviews.

## Acceptance checks

1. `pnpm foes:build` and `pnpm foes:check`: deterministic exact output, 20 stat blocks,
   44 abilities, 24 traits and six child Malice records; exact original source bytes/spans retained.
2. All V27 IDs/objects and historical edition references remain intact; registry only appends new IDs.
3. Every stat block links its echelon's Malice; level-four Malice links prior level-one Malice.
   Independent feature search/card resolution and duplicate trait names remain unambiguous.
4. `pnpm foes:compare --fetch` compares all 22 parents. Missing/ambiguous/retrieval failures and
   unexplained material differences fail; findings are reviewed against pinned source.
5. Source-derived tests cover nested Malice spending, villain labels, triggers, minion EV quantity,
   correction/regeneration and fail-closed comparison mutations.
6. Browser checks show all 20 stat blocks, original first-echelon navigation and second-echelon
   independent ability/trait/Malice cards in both themes, including prior-Malice navigation.
7. `pnpm check`, focused browser suite, independent implementation review and pinned-source review pass.

## Ability design and playtest evidence

Not applicable: source ingestion and reference display only; no engine ability work.

## Rules research

Read all JSON/Markdown/linked Markdown under pinned
`en/books/monsters/{json,md,md-linked}/monster/undead/2nd-echelon/`.
Preserve printed text, values and ordered effects; no mechanical interpretation or automation.
Level-four Malice explicitly references level-three-or-lower Malice; keep that supporting reference.

## Open questions

None.

## Work log

### Claim and plan — 2026-09-16

- User approved the proposed nine-monster second-echelon slice. Foe track, `slice/V30`, reused clean
  worktree `/srv/presidium/projects/salient/foes`, based on main `663b49f`.
- Existing V27 `foes:check` baseline; implement batch selection, preserve IDs/editions, regenerate,
  compare every output, add focused regressions, verify browser at isolated frontend 5187.
- No backend or shared playable runtime changes. V25 peer owns shared runtime verification.
- Public package consumers: `/foes`, shared resolver/search and future parser adapters. Schema remains
  `foes.1`; source, content editions and logical object identities retain separate roles.
- Implementation/source reviews required by the build process; branch handoff precedes integration.

### Source and comparison findings — 2026-09-16

All 30 new source blobs (JSON, original Markdown and linked Markdown for ten parents) ingest without
extraction changes or correction records. Appended 34 new maintained feature identities. The generated
package has no unmodeled-source diagnostics. Original V27 objects compare exactly with their retained
edition, including supporting references and feature IDs.

The initial expanded external comparison returned 19 explained rows and three requiring review:
Fleshflayed Shambler Zombie, Ghoul Craver and Hollowbone Launcher. Each pinned source prints
**EV 6 for four minions**; each pinned counterpart supplies `ev: 6` with no quantity. This is the same
external field omission observed for first-echelon minions at EV 3. The comparator now explains the
omission only when the printed four-minion basis, structured amount/quantity and external amount agree
and external quantity is absent. Explicit conflicting quantities or amounts still trigger review.
The source paths are each monster's `statblock/<slug>` under the second-echelon root above.

Both Malice records have explicit counterpart identities (`undead-malice`, `undead-malice-4`). Their
shorter external titles retain the printed qualifier separately as level and featureblock type. Nested
Malice spending, Mummy Lord villain ordinals, roll tiers, complete triggers and ordered effects agree
under the existing narrowly scoped representation rules. All 22 parent rows are explained, with zero
unresolved, missing, ambiguous or error outcomes. No external code, styling or canonical content imported.

### Verification in progress — 2026-09-16

Baseline V27 `foes:check` passed. Expanded focused tests initially found one stale search expectation:
Hollowbone Slug correctly joins the existing ranged “Bone” results; expectation updated from source.
The first broad check passed lint and 97 engine tests, then hit host-load timeouts in the unchanged
Rules setup and two foe ingestion tests. Browser startup and subsequent navigation also timed out
under observed host load around 40. These runs are recorded as failed, not counted as verification.
Retry checks sequentially against the already started isolated frontend at 5187; no product timeout
or validation was weakened. The ignored browser config extends test time budgets only for this host.

The warmed isolated browser rerun passed both journeys in 8.6 seconds. The final expanded run also
opens **every one of the 20 stat blocks**, asserting the correct Malice link on each; both journeys
passed in 10.1 seconds. Four durable screenshots cover Binding Curse and Mummy Lord in light/dark
at `docs/build/evidence/V30-{ability,undead}-{light,dark}.png`; all four inspected for readability.
Existing first-echelon screenshots now write to Playwright's ignored output directory, preserving
historical V27 evidence. Stopped the isolated Vite process after verification to release host memory.

A two-worker broad run passed all 19 foe tests and 436 total tests but the unchanged Rules deterministic
rebuild test exceeded its 120-second budget under memory pressure (339 app/scripts passed, one failed;
97 engine passed). Stopped an earlier default-worker retry rather than continuing concurrent pressure.
The final full run uses `VITEST_MAX_WORKERS=1`, supported by the installed runner; no product behavior,
assertions or test timeouts changed. Chords MCP became ambiguous during concurrent review sessions;
the documented CLI fallback identifies this thread correctly and carries the remaining coordination.

### Full verification — 2026-09-16

`VITEST_MAX_WORKERS=1 pnpm check` completed successfully (exit 0): lint/format, both type checks,
97 engine tests plus 340 app/script tests (**437 total**), 177 Markdown files, both vendor pins,
467-entry existing content check, exact expanded foe regeneration/report validation and production build.
Rules ingestion generated 2,614 entries with no unresolved links. Log: `/tmp/salient-v30-check-4.log`.
Final focused browser log: `/tmp/salient-v30-browser-3.log` (two tests, 10.1 seconds).

Vite reports a size advisory: the lazy foe chunk is 644.62 kB (55.40 kB gzip), and the existing main
chunk is 675.88 kB. The build succeeds. This bounded slice retains full source evidence in the package;
large-corpus delivery tuning can be assessed when coverage grows. No backend update, seed or data reset
was needed. All changes remain on the isolated branch; this is not shared-app integration.

### Review and integration boundary — 2026-09-16

Independent implementation review: **pass**, `v30_implementation_review`; see
[the audit](audits/2026-09-16-V30-independent-review.md). Its independent checks reproduced exact
original sources, all 74 feature spans, all 52 V27 objects, the append-only identity registry and
all 22 comparison rows. It also rejected 88 missing/duplicate/changed-level/removed-effect mutations.
Source-audit preparation began while the final broad verification was pending; its final verdict follows
this implementation pass. This sequencing kept content review progressing during host-load delays.

Main advanced separately to `78a3a55` for the V25 runtime closeout while this branch was reviewed.
V30 remains based on `663b49f`; integration must preserve those peer changes and verify the combined
result. The isolated frontend is stopped; no shared runtime ownership remains with this slice.

Pinned-source review: **pass**, `v30_source_review`; see
[the source audit](audits/2026-09-16-V30-source-review.md). It independently checked all 66 parent
source blobs, all 74 feature spans/fields, historical continuity and supporting links. It reproduced
the full report with verified cached digests and rejected 89 source-sensitive comparison mutations.
No source discrepancies or correction records were required. Both required reviews now pass.


## Shared integration — 2026-09-17

This reviewed dependency is now merged into main and running in the shared CT114 app through
V38 `40206a5`. Full integrated checks and isolated/shared browser verification passed, including
the full catalog and separate top-level Rules/Foes navigation. Existing play data was preserved.
See [V38 delivery](V38-foes-integration-navigation.md#merge-and-shared-rollout) and
[actual shared evidence](evidence/V38/README.md#shared-rollout). Earlier branch handoff notes above
record the state before this integration.
