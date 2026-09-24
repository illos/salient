# V143: Beastheart ferocity generation

Rules review: required. Depends on: V120 (shared heroic-resource engine).
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/beastheart.md`](evidence/V120/beastheart.md).

## Goal

Enable automatic ferocity generation for the Beastheart on the V120 engine, with its own
implementation and an independent rules review.

## Scope

The Beastheart profile in `shared/resolve/heroicResourceGeneration.ts`, with sources in
`feature/beastheart/level-1/ferocity.md`. It is keyed by class, because the Fury's resource is also
ferocity.
- +Victories at combat start.
- 1d3 at the start of each of the Beastheart's turns. The companion acts on the Beastheart's turn
  and is not an app actor, so there is one roll.
- Claim `beastheart-companion-adjacent-damage`: +2 "the first time each combat round that a creature
  adjacent to your companion takes damage". It is a table claim, because the companion and positions
  are not tracked. From level 4 it is +3 (`feature/beastheart/level-4/unleash-the-beast.md`,
  "3 ferocity instead of 2 ferocity").
- Lose all remaining ferocity at encounter end.
- The manual `Beastheart: Ferocity` row now points to the automation and the claim, so the gains
  aren't added twice. Level 7 and higher stays manual.
- Verified through level 6. `feature/beastheart/level-7/feral-heart.md` changes the turn-start gain
  to 1d3 + 1, so a Beastheart of level 7 or higher stays manual.

## Out of scope

- Rampage: the companion's running total of ferocity spent. It stays manual until the companion is
  an actor.
- The ledger's ambiguities: shared space as adjacency, and damage to the companion itself. Both stay
  with the table's confirmation.
- Non-combat stressful situations.

## Acceptance

- Pure quote test: the Beastheart's clauses and amounts, including level 4.
- App test `tests/app/heroic-resource-beastheart.test.ts`:
  - Victories at commit;
  - 1d3 at the turn start, with the logged die;
  - the claim once per round;
  - 0 after finish.
- Headless cohort `heroic-resource-beastheart`.

## Work log

- 2026-09-24: implemented on top of V120. The focused files pass (1/1 and 5/5); `tsc` and eslint
  are clean. No Beastheart content row adds ferocity by hand; `scripts/headless/beastheart.ts`
  takes no turn and sets ferocity with absolute adjustments.
- Independent review ([audit](audits/V143-rules-review.md)): changes required. R1: the manual
  `Beastheart: Ferocity` row still told the table to add Victories, the 1d3 and +2 by hand. It is
  rewritten to point to the automation and the claim; the "Record and resolve manually" prefix that
  `tests/character-v106-beastheart.test.ts` asserts is kept. The profile matched the Compendium.
- Review closure: PASS at `e6cc919`.
- TESTER gate at `0fb9bb1c`: `tsc -p tsconfig.web.json` failed in the new app test. The witness
  selections needed an `unknown` cast (TS2352). Fixed.
