# V145: Censor wrath generation

Rules review: required. Depends on: V120 (shared heroic-resource engine).
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/censor.md`](evidence/V120/censor.md).

## Goal

Enable automatic wrath generation for the Censor on the V120 engine, with its own implementation and
an independent rules review.

## Scope

The Censor profile in `shared/resolve/heroicResourceGeneration.ts`, with sources in
`feature/censor/level-1/wrath.md`:
- +Victories at combat start.
- +2 at the start of each of the Censor's turns.
- Claim `censor-judged-damaged-you`: +1 "the first time each combat round that a creature judged by
  you … deals damage to you".
- Claim `censor-damaged-judged`: +1 "The first time each combat round that you deal damage to a
  creature judged by you". From level 4 it is +2 (`feature/censor/level-4/wrath-beyond-wrath.md`,
  "2 wrath instead of 1").
- Both are table claims, because Judgment is not tracked. They have separate round limits.
- Lose all remaining wrath at encounter end.
- Verified through level 6. `feature/censor/level-7/focused-wrath.md` changes the turn-start gain to
  3, so a Censor of level 7 or higher stays manual.

## Out of scope

- Tracking Judgment, which would let both triggers be observed from recorded damage.
- The ledger's ambiguities: zero damage and damage absorbed by temporary Stamina. These stay with the
  table's confirmation.

**Labelled interpretation: each limit is per Censor, once per round.** Each trigger reads "the first
time each combat round that …" (`feature/censor/level-1/wrath.md`). The alternative is one gain per
judged creature each round. That would matter when a judged creature drops and the Censor judges a
new one in the same round; the app refuses the second claim, which matches the plain text.
- **Engine-wide limitation (not Censor-specific).** A hero with the Self-Taught complication
  (`complication/self-taught.md`) who forgoes the turn-start gain still receives it automatically.
  The table removes it with `/adjust heroic-resource`. This affects every enabled class and is a
  follow-up for the shared engine.
- The Self-Taught and Feytouched complications, and non-combat stressful situations.

## Acceptance

- Pure quote test: the Censor's clauses and amounts, including level 4.
- App test `tests/app/heroic-resource-censor.test.ts`:
  - Victories at commit;
  - +2 at the turn start;
  - both claims once each per round;
  - 0 after finish.
- Headless cohort `heroic-resource-censor`.

## Work log

- 2026-09-24: implemented on main `a804a02`. The focused files pass; `tsc` and eslint are clean. No
  Censor content row adds wrath by hand. `censor.ts` and `censor-level-three.ts` take no turn and set
  wrath with absolute adjustments.
- Independent review ([audit](audits/V145-rules-review.md)): PASS. The reviewer checked every Censor
  feature and ability through level 6. R1 (advisory): the per-Censor reading is now labelled with its
  alternative. The Self-Taught limitation is recorded as engine-wide.
- TESTER PASS at `a44f6b7` and QC1 final PASS (after V150). Rebased onto main `8c8aedf`. Ready for
  integration.
