# V145 independent rules and implementation review

Reviewer: V145-REVIEW (independent rules review subagent). Date: 2026-09-24.
Reviewed `34a3fc2a` on `slice/V145` against `origin/main` (`a804a02`, the accepted V120 engine), in
`.worktrees/resource-censor`. The change is `git diff origin/main...34a3fc2a`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `34a3fc2a`: PASS (no required findings; R1 advisory).

## Findings

### R1 (advisory). The per-Censor round-limit reading is labelled, but its label does not name the alternative

- **Where.** `docs/build/V145-censor-wrath-generation.md:31-33` ("The limit is per Censor, one claim
  each round, labelled as the ledger's reading"). The profile triggers are at
  `shared/resolve/heroicResourceGeneration.ts:133-165` (`limit: 'round'` at `:137` and `:158`). The
  claim record is kept on the hero (`convex/lib/resourceOperations.ts:81-87`), so the limit is per
  Censor by construction.
- **Evidence.**
  - `feature/censor/level-1/wrath.md`: "The first time each combat round that you deal damage to a
    creature judged by you, you gain 1 wrath." The plain text gives one gain per round per Censor.
    The implementation matches that.
  - The alternative is named only in the ledger (`docs/build/evidence/V120/censor.md:47`, "per
    Censor rather than per judged creature? Probably per Censor"). The slice doc calls it "the
    ledger's reading" but neither names the alternative nor cites the Judgment passage that makes
    it matter. AGENTS.md: "An interpretation is labelled as one, cites the passage and names the
    alternatives considered."
  - `feature/ability/censor/level-1/judgment.md` makes the case reachable: "When a creature judged
    by you is reduced to 0 Stamina, you can use a free triggered action to use this ability against
    a new target."
- **Failure scenario.** In round 2 a Censor damages judged creature A and claims
  `censor-damaged-judged`. A drops to 0 Stamina. The Censor judges B with the free triggered action
  and damages B in the same round. The second claim is refused ("already claimed … this round").
  Under the plain text this is correct. A table that follows the per-judged-creature alternative
  has no record of why the app decided otherwise.
- **Fix.** Add one sentence to the slice doc's out-of-scope bullet. Cite `wrath.md` ("The first time
  each combat round that you deal damage…") and name the alternative: one gain per judged creature
  per round, reachable through Judgment's re-target on a 0-Stamina drop. Optionally, mention "once
  per round for you, whichever judged creature" in the two `confirmation` strings.

## Reviewed and accepted

- **Compendium sweep, levels 1–6 (done by this reviewer, not the ledger).** The ledger covered
  levels 1–3 only. I checked every file under `feature/censor/level-1` … `level-6` (class features,
  the domain-feature tables and all 12 level-4 domain features, 2nd- and 5th-level order features,
  Implement of Wrath), every file under `feature/ability/censor/level-1` … `level-6`, `kit/**`,
  `perk/**`, `title/**` and `class/censor.md`. I checked them for any wrath or Heroic Resource gain,
  loss or change.
  - The only gains and losses are the four clauses in `feature/censor/level-1/wrath.md` and the
    level-4 change in `feature/censor/level-4/wrath-beyond-wrath.md`.
  - Every other wrath mention at levels 1–6 is a spend: ability costs, Judgment's "spend 1 wrath",
    Arrest's "spend 3 wrath", My Life for Yours "Spend 1 Wrath", Look On My Work and Despair "spend
    1 wrath". Congregation (level 6) uses "wrath" only in flavour text.
  - No kit or perk changes wrath generation. Titles only add abilities payable with the Heroic
    Resource, or (Godsworn) a separate temporary pool.
- **Level-4 amount and scope.** `wrath-beyond-wrath.md`: "The first time each combat round that you
  deal damage to a creature judged by you, you gain 2 wrath instead of 1."
  - It applies to the second trigger (you damage a judged creature) only. The first trigger (a
    judged creature damages you) stays at 1 at every level through 6.
  - The profile matches (`heroicResourceGeneration.ts:145-158`). `triggerAmount` picks the level-4
    clause, and the pure test asserts 2 at level 4 and 1 for the other trigger at level 6. Wrath
    Beyond Wrath is a fixed class feature, not an order or domain choice, so every level-4+ Censor
    has it.
- **Level-6 ceiling.** `feature/censor/level-7/focused-wrath.md`: "you gain 3 wrath instead of 2".
  That is the first change after level 4, so `verifiedThroughLevel: 6` (`:113`) is correct. Level
  10 (Wrath of the Gods) falls under the same ceiling.
- **Round limits.** Both triggers read "the first time each combat round", so each has its own
  `limit: 'round'`. The claim key includes the trigger id (`resourceOperations.ts:81-87`), so the
  two limits are independent. The app test and the headless cohort prove both claims work in one
  round and that a repeat of either is refused.
- **Other clauses.**
  - Combat start is `victories` and turn start is fixed 2.
  - The encounter-end `lose` sets the pool to 0. Wrath has floor 0 and never goes negative, so
    `lose` is right rather than `reset`.
  - Every quote is verbatim from its source; the V120 pure test checks all Censor clauses, including
    `levelAmounts`.
  - "Though you can't gain wrath outside of combat" is kept: claims are refused with no committed
    encounter, in round 0 and in closeout (V120 engine).
- **No double count with Censor content.**
  - `shared/content/classes/censor/abilities.ts` (`CENSOR_ACTIONS`, `CENSOR_ACTIVATION`),
    `shared/evaluate/censorAbilities.ts`, `level-one.ts` and `level-two-three.ts` have no
    "Censor: Wrath" or other source-timed row that tells the table to add wrath by hand.
  - The only wrath text in `level-one.ts` is the resource name, the grant quote and the
    outside-combat quote (used for `startingValue`, set 0).
  - The Judgment rows only resolve Judgment's own effects and its 1-wrath spends.
  - The Wrath feature card shows the Compendium text itself, not an instruction.
  - Nothing in `src/` or `convex/` mentions wrath.
  - The V143 R1 defect is not present here.
- **Existing journeys and tests.**
  - `scripts/headless/censor.ts` and `censor-level-three.ts` commit combat with Censors but never
    take a Censor turn or claim. The combat-start grant adds the Censor's Victories, which is 0 for
    these fixtures. Wrath is then set with absolute `adjust.heroic-resource value=cost` before each
    use, and the check afterwards expects 0.
  - `conduit.ts` (Censor-built targets) and `multi-target.ts` (a v99 Censor actor) follow the same
    absolute-adjust pattern and never take turns.
  - No test counts events or clock entries for these tables.
  - `tests/character-v99-censor.test.ts` and `tests/character-v117-censor-three.test.ts` are
    evaluation-only.
  - `tests/app/heroic-resource.test.ts` uses a Fury (Thorn), not a Censor.
  - No assertion breaks or changes meaning.
- **Out-of-scope items, correctly left manual.** These are the Self-Taught and Feytouched
  complications, non-combat stressful situations, and the zero-damage and temporary-Stamina
  questions (ledger ambiguities 1–2).
  - Self-Taught's forgo ("you can forgo gaining your Heroic Resource until the start of your next
    turn") still leaves the table to reverse the automatic +2 by hand. Its row in
    `shared/content/supporting-complication-abilities.ts:170-174` says "Resolve manually".
  - That is an engine-wide V120 behaviour shared with the Shadow, not a V145 defect.

## Checks run by the reviewer

- `npx tsc --noEmit` at `34a3fc2a`: exit 0.
- `npx eslint` on the five changed source/test files: exit 0.
- `npx vitest run tests/app/heroic-resource-censor.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 6 tests passed.
- No other suites, journeys or services were run.

## Verdict

PASS. The Censor profile matches `feature/censor/level-1/wrath.md` and
`feature/censor/level-4/wrath-beyond-wrath.md` for levels 1–6, the level-6 ceiling is correct, both
round limits are right and independent, and no Censor content double-counts. R1 (label wording) is
advisory.
