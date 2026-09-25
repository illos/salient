# V232: Shelve Thorn Dragon Domain automation

## Goal

Record the user's Domain deferral and preserve confirmed direction for later research.

## Scope

Documentation only: Q-FOE-4, V227, inventory and overall plan. Domain stays source text when
used and explicitly manual. Later review considers encounter-wide environmental classification,
Director encounter-start enable/disable, flight/ground contact and bleeding lifetime. Record
current-turn speed duration and coverage of other monsters as confirmed. Do not implement now.

Spec: `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`.
Source: pinned `monster/group/dragon.md`, Thorn Dragon's Domain;
`monster/dragon/statblock/thorn-dragon.md`, Malign Thicket.

## Acceptance checks

1. QC checks that no planned automatic Domain rider survives; flight is unresolved and bleeding
   expiry has not been inferred. Only the source dragon is exempt from the printed speed clause.
2. Domain-dependent Malign Thicket poison remains manual; independent dragon effects proceed.
   Text retention is a planned presentation requirement, not proof of current runtime capability.
3. Test runs diff whitespace and documentation link checks on the committed tip. QC clears
   Deploy afterward; no gameplay suite or implementation claim for this docs-only change.

## Work log

- 2026-09-25: created `slice/V232` in `.worktrees/thorn-domain-deferral` from `e192af43`.
  User requested shelving the effect for later research, keeping source text when used. Recorded
  future activation and confirmed speed duration/other-monster scope; no runtime changes.
- Test accepted `4fd2c92d`: diff check passed and 586 Markdown files had no broken relative links
  or anchors. QC gave final PASS on that exact tip. Fast-forward merged into main; no runtime
  component changed.
