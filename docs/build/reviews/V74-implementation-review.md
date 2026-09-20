# V74 trait-granted actions: implementation review

Reviewer: Astra `v74_doctrine`, 2026-09-20. Candidate:
`f28ed6c9d632e6a49ba4d0a834133248d01b9cb8` application source in `slice/V74`, including main
through `9252b8f`; test-only follow-up `a2a10dfc2e37e373c920ed42cf5fe48a6f1f1f49` also inspected.

**Implementation verdict: pass; no outstanding blocking code or test-value findings. The retained
authenticated application and Forge comparison evidence now also pass.** This is not a delivery or
main-merge verdict. The reviewer authored the accompanying doctrine changes
but did not implement the application or tests. That documentation is not independently approved
by this review. No runtime or browser workload was run by the reviewer.

Inspected the retained CT114 hosted [full check log](../evidence/V74/check.log): engine 310 tests,
app/scripts 481 tests, lint/formatting, typechecks, links, vendor/source checks and production build
passed. The lead reports exit 0; the log reaches the successful build and asset report. The initial
import failure is retained separately and is not treated as passing. The full-check snapshot has
the candidate's runtime source; the later commit adds ancestry-loss test assertions and docs. The
reviewer inspected those assertions; the lead reports their local focused run passing. This is
inspected execution evidence, not an independent rerun.

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
failures rather than duplicate implementation assertions. The added
ancestry-loss assertions exercise private Dwarf→Devil→Dwarf saves through the public mutation and
confirm that the old active rune and its maneuver do not return. This adds meaningful coverage of
a persistent-state leak rather than testing the same grant projection twice.

The Forge comparison now separately records `compendiumActionsBeyondForge`: Runic Carving's
carving activity, Relentless, and selected Stone Singer/Doomsight activations. This explicit,
source-reviewed list augments the expected action set without removing or ignoring any Forge
ability. All actual sheet actions are still compared for exact membership; unexpected additions
or missing existing Forge grants still fail. Conditional rune maneuvers remain covered by the
separate saved-state journey rather than falsely claimed by witnesses with no active rune.

Read the [independent rules verdict](V74-rules-review.md), which passes the sourced catalog and
conditional grants while explicitly limiting effects to manual resolution. The new authenticated
headless scenario uses supported creation, rune mutation/readback, campaign admission, registered
action, and undo/redo routes without direct database writes. The first live run passed 26 existing
scenarios; the new scenario reached its final ability invocation but omitted the operation's
mandatory target. Follow-up `a2a10df` creates and admits a Director-owned recipient through the
public character operations and supplies that character to the Voice invocation. This repairs the
test setup without changing application code or weakening assertions. Inspected the corrected
[authenticated headless report](../evidence/V74/headless.json): all 27 scenarios pass in 99.553
seconds, source `a2a10df`, against hosted `different-bat-943`; the lead reports exit 0. The new
trait/rune scenario passes, including persisted grant changes, unauthorized/stale refusal,
registered action exposure/use and undo/redo. This closes the pending authenticated proof gate.
The earlier failed scenario remains a failed attempt, not an erased or retroactive pass.

Inspected the retained [Forge comparison](../evidence/V74/live-comparison.json): all 31 saved
character comparisons pass with no mismatches in 52.772 seconds, against hosted
`different-bat-943`, application source `f28ed6c`. The explicit Compendium-only action additions
remain visible in each applicable result. This closes the refreshed Forge comparison gate for the
recorded witnesses, not the separate active-rune application journey.

No browser run is required or authorized under the moratorium. The implementation review may be
used for the implementation-review gate. The retained evidence satisfies the inspected live
application acceptance scope; final integration and shared-app delivery remain the lead's separately
recorded responsibility.
