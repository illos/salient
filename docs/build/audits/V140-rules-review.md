# V140 independent rules and implementation review

Reviewer: V140-REVIEW (independent rules review subagent). Date: 2026-09-24.
Reviewed `db40b35` on `slice/V140` against the reviewed V120 engine `eb32e21`
(`git diff eb32e21..db40b35`), in `.worktrees/resource-tactician`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `db40b35`: PASS. R1 and R2 are advisory. Neither is blocking or required.

## Findings

### R1 (advisory). The ally-heroic claim tells the table only about distance, not who counts or what counts as heroic

- **Where.** `shared/resolve/heroicResourceGeneration.ts:155-162`. The `confirmation` for
  `tactician-ally-heroic` reads "Distance is not tracked; the table confirms the ally was within 10
  squares." The slice doc does not label the reading that the Tactician is excluded. The ledger
  states it as fact (`docs/build/evidence/V120/tactician.md:27`, "Only allies count, not the
  Tactician").
- **Evidence.**
  - `feature/tactician/level-1/focus.md` says "the first time … that **you or any ally** damages a
    creature marked by you" for T1, but only "any ally within 10 squares of you uses a heroic ability"
    for T2. That contrast is the basis for leaving the Tactician out. `rule/combat/ally.md` ("You
    aren't an eligible target for your own abilities that target allies unless…") supports the
    reading but is a targeting rule, not a definition. So this is an interpretation. It is sound,
    but AGENTS.md requires it to be labelled with the alternative (self counts) named.
  - `rule/general/heroic-ability.md`: an ability is heroic only if "you can't use the ability at all
    without spending some of your Heroic Resource". Abilities that only allow an optional spend
    (its example is the conduit's Healing Grace) "are not heroic abilities".
- **Failure scenario.** In round 2, the only resource spent by an ally is an optional spend on a
  signature or non-heroic ability (for example Healing Grace, or a Tactician's own "Spend 1 Focus"
  on Parry). No ally used a heroic ability. The table sees "An ally within 10 squares used a heroic
  ability" with a confirmation that asks only about distance, presses Claim, and gains 1 focus the
  source does not grant. Nothing in the control points to the definition.
- **Fix.** Extend the confirmation, for example: "Distance is not tracked; the table confirms an
  ally other than you used an ability that can't be used without spending its Heroic Resource
  (rule/general/heroic-ability.md), within 10 squares." Record the self-exclusion in the slice doc
  as a labelled interpretation, citing the T1/T2 contrast and naming the alternative.

### R2 (advisory). The ledger's scope heading does not cover the ceiling the profile claims

- **Where.** `docs/build/evidence/V120/tactician.md:1` ("levels 1–3"), compared with
  `shared/resolve/heroicResourceGeneration.ts:113` (`verifiedThroughLevel: 6`) and the slice doc
  ("Verified through level 6").
- **Evidence.** I checked every level 4–6 Tactician feature and ability independently (see below).
  Nothing at levels 5 or 6 changes focus, so the ceiling of 6 is correct. However, the evidence
  file cited as the ledger says it covers levels 1–3, and nothing records who checked levels 5–6.
- **Failure scenario.** A later reviewer or class slice relies on the ledger to trust the level-6
  ceiling and finds that levels 4–6 are not in its scope.
- **Fix.** Add a line to the ledger or the slice work log: levels 4–6 checked. The only change is
  `feature/tactician/level-4/focus-on-their-weaknesses.md`. Level 5 (Anticipation, Distracted,
  I Predicted That, Leave No Trace, Shake It Off, Tactical Offensive, the 9-focus abilities) and
  level 6 (Master of Arms, the doctrine abilities) contain no focus gain, loss or reset.

## Reviewed and accepted

- **Source sweep.** I read all of `feature/tactician/level-1` to `level-10` and grepped every
  Tactician ability (`feature/ability/tactician/level-1` to `level-9`), the kits and the whole
  unified tree for focus and Heroic Resource gains.
  - The only focus gain, loss or change clauses at levels 1–6 are the four in
    `level-1/focus.md` plus `level-4/focus-on-their-weaknesses.md`.
  - Tactician abilities and mark benefits only spend focus (Mark 1, Melee Superiority 2, Fog of War
    and Targets of Opportunity 2, and the fixed costs).
  - No kit grants focus. Counterstrategy (level 9, "gains 2 of their Heroic Resource") and
    Command/Warmaster (level 10) are above the ceiling.
- **Amounts.**
  - Combat start: +Victories, which is correct.
  - Turn start: fixed 2. `level-7/heightened-focus.md` ("3 focus instead of 2") and
    `level-10/true-focus.md` ("4 focus instead of 3") justify stopping at 6.
  - T1: 1, and 2 from level 4 ("2 focus instead of 1"). `triggerAmount` selects it by level.
  - T2: 1 at every level through 6.
  - Encounter end: `lose`, which is correct. Focus has a floor of 0, so `lose` and `reset` are the
    same here.
- **Limits.** Both triggers are `round`. "The first time each combat round" and "The first time in
  a combat round" say the same thing. Claim records are keyed by trigger id, encounter and round,
  so the two limits are independent. The app test proves both claims in round 1, a refusal of each
  second claim, and a reset in round 2.
- **Claim wording and marks.** The T1 label and confirmation ("the damaged creature was marked by
  you") match the source. Mark targets a creature, so the level-4 wording "target" makes no
  difference. Marks ending when the Tactician is dying, or through reuse, are covered by "marked by
  you". No Tactician feature through level 6 grants focus to allies or through them. Mark benefits
  only spend the Tactician's focus, so the claim wording does not suggest otherwise.
- **Double counting.** No Tactician content row tells the table to add focus by hand.
  - `shared/content/classes/tactician/abilities.ts` only pays focus (Mark: Trigger 1; Melee
    Superiority, Fog of War and Targets of Opportunity 2) or adjusts surges.
  - `level-one.ts` and `level-two-three.ts` carry only the resource identity, the out-of-combat
    quote and costs.
  - There is no level-4 Focus on Their Weaknesses row, because Tactician levels 4–6 content is not
    built. The amount comes only from the profile.
- **Existing coverage.**
  - `tests/app/tactician-character.test.ts` sets focus to 2 absolutely after commit (Victories 0)
    and takes no turn.
  - `tests/app/potency-conditions.test.ts` (Concussive Strike) takes the Tactician's turn (+2),
    then sets focus to 6 absolutely before asserting 3 and 0.
  - `tests/app/kit-bonus.test.ts` (commit, roll, first, no turn; then absolute 9) is unaffected.
  - `scripts/headless/tactician.ts` sets focus to 1 absolutely after commit.
    `scripts/headless/tactician-level-three.ts` sets it absolutely before each use, with no turns.
    `scripts/headless/kit-bonus.ts` does the same before each use and takes no turns.
  - No test pins `resourceTriggers` for a Tactician except the new test, and no test pins the
    clock event list for a Tactician. No assertion changes meaning.
- **Engine use.** This is the first `fixed` turn-start profile. `convex/lib/clock.ts:289-292` adds
  the fixed amount, and the app test proves 1 → 3 → 7 across two turns. The V120 pool-name guard,
  level gate, closeout and round-0 refusals, and the kept-Void note (Q-RES-1) apply unchanged.
- **Quotes.** Every Tactician clause is verbatim from the pinned files, with link markup removed.

## Checks run by the reviewer

- `npx tsc --noEmit`: exit 0.
- `npx eslint` on the four changed source and test files: exit 0.
- `npx vitest run tests/app/heroic-resource-tactician.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 6 tests passed.
- No other suites, journeys or services were run.

## Verdict

PASS. The profile matches the pinned source for levels 1–6: combat start, turn start, both round
limits, the level-4 amount, the level-6 ceiling and the encounter-end loss. R1 (clarify the T2
confirmation and label the self-exclusion) and R2 (record the levels 4–6 check in the ledger) are
advisory.
