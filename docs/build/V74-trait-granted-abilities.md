# V74 — Trait-granted abilities and active Dwarf runes

Status: Complete — merged into main and deployed to hosted/shared development apps at `b73cb8d`.
Character track, WIZARD; shared-main public API proof also passes 27/27.
Starts from current main `e5c1cd8` plus the verified character candidate and V73 comparison tooling.
Uses whichever suitable local or remote test environment is free; no browsers.

## Scope

The user requires a project-wide check: inspect every implemented trait for ability/action grants
and implement those grants, retaining the trait. Deliver the five audited ancestry action gaps,
Stone Singer, Doomsight and Relentless, and Dwarf rune actions. Their source conditions and timing
remain explicit. This slice supplies selectable, sourced actions through the existing manual
ability-use route; it does not automate damage, conditions, Director judgment or hour-long effects.

Dwarf active rune is independent persisted play state, not a character-build choice. A public API
and sheet control choose/replace/remove one rune after an explicit acknowledgement of ten
uninterrupted minutes. Only that rune grants its maneuver. Authorized changes must preserve the
build and current resources, reject stale/unauthorized writes and unavailable timing, and remove
stale grants when the trait is lost. No character revision edit is needed to change a rune.

## Verification

- Source checks catch invented action costs, missing conditions and incorrectly copied effects.
- Grant tests catch omitted actions, retained actions after trait removal, and cross-ancestry leaks.
- Persisted rune tests catch simultaneous/stale rune grants, privacy/authorization failures,
  lost state on reload, and accidental resource/build resets.
- Authenticated public API proof creates and saves characters, checks grouped sourced actions,
  changes each rune and verifies refreshed sheet/table grants without browser setup.
- Re-run the existing Forge comparisons with explicit source-reviewed differences for activations
  that Forge represents only as descriptive text; never normalize away unknown differences.
- Independent implementation and source review precede completion. Record actual failures;
  no prolonged infrastructure debugging or timeout inflation.

## Ownership

Root owns shared evaluator/projection integration and verification. Native Astra workers own
sourced action catalog, rune persistence/control and doctrine; independent review follows the
integrated candidate. Engine V72 owns combat compiler/execution; coordinate the narrow ancestry
projection change in `convex/lib/resolve.ts` without changing its engine semantics.

## Results

Full checks pass: 791 tests and production build. Independent implementation and rules reviews
pass. Hosted authenticated API journeys pass 27/27; saved Forge comparisons pass 31/31, resolving
all seven prior missing-ability discrepancies. See [retained evidence](evidence/V74/README.md).
