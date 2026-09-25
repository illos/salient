# V211: V1 foe parser and engine audit and plan

Rules review: required. Depends on: the confirmed V1 foe roster and merged engine through V202.

## Goal

Account for the chosen 36 monsters' abilities, traits, Malice and shared rule dependencies, then
define implementable slices that maximize faithful automation with explicit table facts and manual
boundaries. This slice delivers the plan; its future slices remain unimplemented.

## Scope

- [Plan](../v1-foe-engine-plan.md): baseline, shared architecture, dependency order and pipeline.
- [Inventory](../v1-foe-engine-inventory.md): every named feature with its pinned source and owner slices.
- V212–V228 documents: goals, affected mechanics, source-derived acceptance designs and dependencies.
- Queue rules/product questions in `docs/rules-questions-for-user.md`; preserve independent work.
- Account for existing V03 boss-turn and V20 terrain plans without declaring those broader slices done.

Spec: `docs/monster-catalog-spec.md#encounter-and-engine-integration`,
`docs/engine-architecture.md#from-rules-text-to-executable-behavior`,
`docs/rules-adaptation-principles.md#faithful-automation-and-deliberate-departures-are-different`.
Source files and sections are enumerated in the inventory; no online rules sources.

## Acceptance checks

1. Reconcile 36 roster paths with 110 catalog abilities, 50 traits and 25 band Malice records;
   independently account for two basic Malice options and two group traits. Every named record
   appears in the inventory; repeated names remain associated with their own parent.
2. State actual current support: static committed V72 report gives six compiled and 104
   compatibility records; code inspection identifies distinct runtime gaps and existing reuse.
3. Each proposed slice has source citations, observable expected results, a proposed authenticated
   headless cohort and dependencies; manual/decision cases are identifiable.
4. QC reviews source correctness, omissions and slice boundaries. Test checks docs links and the
   roster/inventory reconciliation on the committed candidate; no gameplay test is claimed.
5. After Test results, QC clears the documentation handoff to Deploy. Documentation-only merge.

## Work log

- 2026-09-25: created `slice/V211` in `.worktrees/v1-foe-engine-plan` from main `06859c7b`.
  Read all selected stat blocks, seven Malice files, named group traits and general rules; inspected
  the common compiler, foe discovery, squad resolver, initiative, areas and reaction holders.
- Foes peer supplied independent read-only findings on V02, missing band-Malice routes and V03's
  unimplemented boss turns (Chords 2487–2489), consistent with this audit. No test was run by that peer.
- Implementation, runtime tests and deployment of V212–V228 have not occurred in this slice.
