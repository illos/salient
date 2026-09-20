# V74 trait-granted actions: early implementation review

Reviewer: Astra `v74_doctrine`, 2026-09-20. Candidate: uncommitted V74 changes over
`638bb1209b2f490ab7499c93e10f69337ce8e973` in `slice/V74`.

**Early source verdict: no outstanding blocking findings in the inspected changes. Formal
implementation acceptance remains pending full repository checks and authenticated application
proof.** This is a bounded source consultation, not a formal passing review or merge verdict.
The reviewer authored the accompanying doctrine changes but did not implement the application or
tests. That documentation is not independently approved by this review. No runtime or browser
workload was run by the reviewer.

## Scope and findings

Inspected trait-derived ability projection in the evaluator, saved sheet and table resolver;
source metadata and manual-resolution paths; rune query privacy, mutation authorization and
persistence; ancestry-loss cleanup; the sheet rune control; and focused source/grant/rune tests.
Existing saved builds receive actions from their actual granted traits and matching source paths.
The trait remains present. Rune maneuvers depend on the active rune rather than an ancestry label
alone. Ability provenance now points to the extracted trait source as well as retaining its quote.
Manual effect resolution remains explicit; this change does not implement effect automation.

The first source pass identified two blocking issues, both corrected:

- Rune state used a direct write with a `character.*` event, which the existing history model
  excludes from gameplay. The replacement registered `rune.change` operation emits `rune.changed`
  through the registry and applies the change with `journalPatch`. The registry supplies the bound
  character in `payload.envelope.boundActor`, allowing the ordinary owner undo, Director rewind
  and redo paths to restore rune state and its derived grants.
- The table rune button bypassed registered operations. Its campaign mutation now invokes that
  same `rune.change` operation, registered with the existing command registry and available to
  programmatic commands. Standalone owned characters use the same validation and patch construction
  with their separate non-table persistence path.

The follow-up inspected `convex/lib/runeOperations.ts`, `convex/characterRunes.ts`, registry
registration and event/commit integration, the updated control, provenance correction and focused
rune tests. Recarving the same rune kind is permitted, so manually resolving a different Voice
recipient does not require switching to another kind first. No recipient automation is claimed.
Query results remain restricted to owner/Director; peers receive no rune details. Running-session,
controller, combat, version, build and completed-time checks remain in the shared validation path.

## Evidence limits and test value

The focused rune test source covers persisted grant switching/removal without resetting builds or
resources; stale/duplicate commands, authorization and invalid-time/build rejection; and public
owner undo/redo plus Director rewind/redo, including same-kind recarving. These target distinct
failures rather than duplicate implementation assertions. The lead reports three focused tests
passing; this reviewer has not independently rerun or inspected a retained execution artifact for
that report.

Full checks, retained authenticated CLI/API evidence, and the fresh independent rules review
remain required. No browser run is required or authorized under the moratorium. Obtain final
independent acceptance after those gates pass; this early consultation must not be used as a
passing `Reviewed-By` trailer.
