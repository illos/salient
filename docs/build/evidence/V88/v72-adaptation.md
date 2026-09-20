# V88 adaptation of V72 Bury the Point assertions

V88 intentionally replaces Bury the Point's formerly manual post-damage remainder with a
compiled condition. The unchanged V72 hero fixture resists both printed thresholds used here:
`M < 1` on the original tier 2 and `M < 0` after the two-bane correction to tier 1.
This is the narrow runner adjustment approved by the engine lead in Chords 855.

## Exact changes

- `scripts/v72-headless.ts`: BP2 reads a `condition` occurrence and asserts `resisted`.
  The correction reads a distinct `condition` occurrence, asserts `resisted`, and retains the
  original clause, distinct-id, Stamina 25, Malice 0 and stale-occurrence refusal assertions.
- The corrected current occurrence now refuses `ability.resolved` with the applied/resisted
  reason, with complete roster equality before and after. Rewinding still deep-compares the
  complete compiled result to the original saved result. The restored occurrence also refuses
  disposition with the same reason and complete roster equality. The capture is renamed
  `BP5-disposition-refused-after-rewind`.
- `tests/app/compiled-effects.test.ts`: BP2/5 makes the same condition/resisted assertions and
  expects current-occurrence disposition refusal. Existing dice, resource, Stamina, registration
  and source-privacy assertions remain. Added rewind equality and restored-occurrence refusal
  prove unchanged hero state, Malice, roll count and registrations.
- That persisted file's separate synthetic duplicate-clause storage test formerly borrowed BP's
  unsupported node. It now explicitly converts BP's saved condition node and outcome into the
  same synthetic unsupported/manual fixture before duplicating it. All ambiguity, occurrence
  addressing, duplicate refusal and independent disposition assertions remain. This fixture
  asserts a storage contract, not a new source-supported ability shape.

No SC2 privacy assertion, other ability assertion, dice control, application route or environment
guard changes. `scripts/v72-headless-main.ts` is unchanged. No test execution or runtime stack was
started for this adaptation; verification belongs to the TESTER coordinator.

The full check at `ac95cc3` found two further legacy assertions of the same Bury the Point
shape: `tests/app/abilities.test.ts` expected the tier-1 bleeding clause in `unresolvedClauses`,
and `tests/app/compiled-source.test.ts` expected its second nodes to be `unsupported`.
These now expect an empty unresolved list and `condition` nodes respectively. Cost, damage,
blocking and source privacy assertions remain unchanged. The archived-history failure in
`v001-walkthrough.test.ts` identified a separate guard-order regression: archived encounters now
receive the existing history refusal before any live condition lookup, and damage-only compiled
results do not inspect condition targets. The original walkthrough assertion remains unchanged.
