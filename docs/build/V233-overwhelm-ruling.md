# V233: Record Overwhelm duration and spatial deferral

## Goal

Record the accepted current-turn duration and the user's text-only disposition; track spatial
manual effects for future map/spatial implementation.

## Scope

Documentation only: Q-FOE-5, V222, inventory, plan and the new spatial-dependency register.
The proposed adjacency questionnaire is withdrawn. No automatic Overwhelm effect or expiry.
Register the identified Overwhelm, Domain and Domain-dependent poison deferrals; do not claim
an exhaustive app-wide audit or disable other fact-assisted mechanics.

Spec: `docs/table-spec.md#inline-interaction-cards-in-the-game-log`;
`docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`.
Source: pinned `monster/human/statblock/human-knave.md`, Overwhelm;
`movement/shifting.md`. Duration is a user-approved interpretation, not printed source text.

## Acceptance checks

1. QC verifies current-turn duration remains recorded while source text/manual handling is the
   implementation disposition. No proposed adjacency prompt survives as active V222 scope.
2. Spatial register links sources, missing facts, ownership and completion criteria; future
   map work must review entries, not silently delete effects or invent missing rules.
3. Test runs focused diff and documentation link checks; QC then clears Deploy. No gameplay proof.

## Work log

- 2026-09-25: created `slice/V233` in `.worktrees/overwhelm-ruling` from `ecbe9289` (the initial
  Chords start note named the preceding main tip before creation; actual parent includes closeout).
  User approved duration, then rejected the adjacency-input proposal as messy and requested
  text-only handling and tracking spatial-dependent effects. Recorded that correction before QC.
- 2026-09-25: Test's diff and documentation link checks passed (588 Markdown files); QC gave
  final PASS at `df9a9ecc`. Fast-forward merged into `main`. Documentation only; no runtime deployment.
