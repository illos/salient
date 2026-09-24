# V140: Tactician focus generation

Rules review: required. Depends on: V120 (shared heroic-resource engine).
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/tactician.md`](evidence/V120/tactician.md).

## Goal

Enable automatic focus generation for the Tactician on the V120 engine, with its own implementation
and an independent rules review.

## Scope

The Tactician profile in `shared/resolve/heroicResourceGeneration.ts`, with sources in
`feature/tactician/level-1/focus.md`:
- +Victories at combat start.
- +2 at the start of each of the Tactician's turns.
- Claim `tactician-marked-damage`: +1 "the first time each combat round that you or any ally
  damages a creature marked by you". It is a table claim because marks are not tracked. From
  level 4 it is +2 (`feature/tactician/level-4/focus-on-their-weaknesses.md`, "2 focus instead
  of 1").
- Claim `tactician-ally-heroic`: +1 "The first time in a combat round that any ally within 10
  squares of you uses a heroic ability". It is a table claim because distance is not tracked. The
  two triggers have separate round limits.
  - **Labelled interpretation: the Tactician does not count.** The first trigger says "you or any
    ally" and this one says only "any ally". The alternative, that the Tactician's own heroic
    abilities count, was rejected on that contrast.
  - A heroic ability is one that "you can't use … at all without spending" its Heroic Resource
    (`rule/general/heroic-ability.md`), so an optional spend doesn't count.
  - The claim's confirmation text says both.
- Lose all remaining focus at encounter end.
- Verified through level 6. `feature/tactician/level-7/heightened-focus.md` changes the turn-start
  gain to 3, so a Tactician of level 7 or higher stays manual.

## Out of scope

- Automatic detection of either trigger: mark state (V141+) and ally range.
- The ledger's ambiguities: zero damage after immunity, whether a new mark ends older marks, marked
  objects, and free heroic uses. Each stays with the table's confirmation.
- Non-combat stressful situations (as V120).

## Acceptance

- The pure quote test covers the new clauses. The Tactician's amounts, including level 4, match
  the source.
- App test `tests/app/heroic-resource-tactician.test.ts`:
  - Victories at commit;
  - +2 at each turn start across two rounds;
  - both claims in one round, each refused a second time;
  - limits reset in round 2;
  - 0 after finish.
- Headless: the `heroic-resource` cohort adds a Tactician run.

## Work log

- 2026-09-24: implemented on top of V120 (`eb32e21`). The focused files pass (1/1 and 5/5);
  `tsc` and eslint are clean. The existing Tactician tests and journeys set focus with absolute
  adjustments and take no turn afterwards, so the automatic gains do not change them.
- Independent review ([audit](audits/V140-rules-review.md)): PASS with two advisories, both fixed.
  - R1: the ally-heroic confirmation now names who counts and what a heroic ability is, and the
    reading is labelled above.
  - R2: the reviewer checked every Tactician feature through level 10, which confirms the levels 4–6
    range the V120 ledger (levels 1–3) did not cover. The only focus changes up to level 6 are
    `level-1/focus.md` and `level-4/focus-on-their-weaknesses.md`.
- TESTER at `bae43ad` PASS: gate rc 0 in 271 s (engine 413/413, app 669/669); headless (seed 1732)
  `heroic-resource`, `tactician` and `tactician-level-three` pass. Artifacts:
  `test-artifacts/V140-bae43ad/`. Merge waits for V150 (the Self-Taught forgo, QC1's shared blocker).
- TESTER PASS at `bae43ad` and QC1 final PASS (after V150). Rebased onto main `8c8aedf`. Ready for
  integration.
