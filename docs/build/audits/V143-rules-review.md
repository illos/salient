# V143 independent rules and implementation review

Reviewer: V143-REVIEW (independent ENGINE2 review subagent). Date: 2026-09-24.
Reviewed `b5de7f3` on `slice/V143` against the accepted V120 engine (`63b47d7`), in
`.worktrees/resource-beastheart`. The change is `git diff 63b47d7..b5de7f3`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `b5de7f3`: CHANGES REQUIRED (R1 required).

## Findings

### R1 (required). The manual "Beastheart: Ferocity" row still tells the table to add the gains the engine now applies

- **Where.** `shared/content/classes/beastheart/abilities.ts:952-960` (`Beastheart: Ferocity`,
  `actionType: 'Source-timed effect'`). `shared/evaluate/beastheartAbilities.ts:30-46` grants it to
  every Beastheart as a class ability with that `activationCondition`, so it shows on the sheet
  and in the ability list.
- **Evidence.**
  - The row's `activationCondition` reads: "Record and resolve manually … Victories at combat
    start; 1d3 at own-turn start; +2 first adjacent-to-companion damage each round. Clear at
    encounter end."
  - Since `b5de7f3`, for levels 1–6, `combat.commit` adds Victories, every `turn.take` rolls and adds
    1d3, `resource.claim trigger=beastheart-companion-adjacent-damage` adds the per-round gain, and
    `combat.finish` sets the pool to 0 (`shared/resolve/heroicResourceGeneration.ts:111-156`,
    `convex/lib/combatOperations.ts:476-518`, `convex/lib/clock.ts` `fireHeroicResource`).
  - The row also says "+2", but from level 4 the claim gives +3
    (`feature/beastheart/level-4/unleash-the-beast.md`: "you gain 3 ferocity instead of 2
    ferocity").
  - This is the same defect V120 R1 found and fixed for the Shadow's Surge of Insight row. That row
    now points to the claim and says not to also adjust by hand
    (`shared/content/classes/shadow/later-actions.ts:19-20`).
  - The slice work log says "No Beastheart content row adds ferocity by hand". That is true of
    code, but not of this row's instruction.
- **Failure scenario.** A level-1 Beastheart with 2 Victories enters combat. The clock grants 2
  ferocity at commit and rolls 1d3 (say 3) at `turn.take`: 5 ferocity. A player or Director reads
  the Ferocity row ("Record and resolve manually … Victories at combat start; 1d3 at own-turn
  start") and sets `/adjust heroic-resource` to add Victories and a 1d3 roll by hand. The pool is
  now about 9–10, roughly double what `feature/beastheart/level-1/ferocity.md` grants. Likewise,
  a table that records the adjacent-damage gain as a manual +2 can still use the Claim once that
  round and get +2 (or +3) more.
- **Fix.**
  - Rewrite the in-combat part of the row: levels 1–6 apply Victories at combat start, the 1d3 at
    turn start and the encounter-end loss automatically. Claim the adjacent-damage gain with
    `/resource claim trigger=beastheart-companion-adjacent-damage`: +2, or +3 from level 4, once per
    round. Do not also adjust by hand. Level 7 and above stay manual.
  - Keep the "Outside combat …" sentence, which is still manual.
  - Keep the shared "Record and resolve manually" prefix.
    `tests/character-v106-beastheart.test.ts:73` and `scripts/headless/beastheart.ts:112` assert
    that phrase on every row. No fixture pins the rest of this row's text.

## Reviewed and accepted

- **Compendium sweep, levels 1–6.** I searched every "ferocity" and "rampage" mention in
  `feature/beastheart/**`, `feature/ability/beastheart/**`, `feature/ability/companion/**`,
  `feature/companion/**` and `monster/companion/**`.
  - The only gains are the three in `level-1/ferocity.md` and the level-4 change in
    `unleash-the-beast.md`.
  - No ability, companion stat block, advancement feature (including the level-6 Become the Beast
    grant of the companion's level-6 feature) or wild-nature feature at levels 1–6 gains or
    changes ferocity. Everything else is a spend: the "Spend N Ferocity" options, Heart of the
    Beast's "Spend 1–5", and Elements Unleashed's "spend 3 ferocity" at the start of each of your
    turns, a level-6 manual spend.
  - I Feed On Your Pain! grants surges, not ferocity.
- **Level ceiling.** `verifiedThroughLevel: 6` is right.
  - `level-7/feral-heart.md`: "you gain 1d3 + 1 ferocity instead of 1d3".
  - `level-10/final-evolution.md`: "2d3 + 1 … instead of 1d3 + 1".
  - Levels 5 and 6 change nothing about generation.
- **Level-4 amount.** +3 from level 4 matches `unleash-the-beast.md` verbatim. `triggerAmount` reads
  `baseline.level` at claim time, and the pure test asserts 2 at level 3 and 3 at level 4.
- **Turn-start 1d3, one roll.**
  - `ferocity.md`: "At the start of each of your turns during combat, you gain 1d3 ferocity."
  - `companion-rules.md` (Companion Actions): "they take their turn as a part of your turn … the
    start and end of your turn is also the start and end of the companion's turn."
  - One turn start means one gain, so the single registration per hero (`creatureId` = the
    Beastheart) is the literal reading, not an interpretation. The slice doc could cite
    `companion-rules.md` for it; that is not required.
- **Per-round limit.** "the first time each combat round" maps to `limit: 'round'`, keyed by encounter
  round. The claim is allowed on any creature's turn, which is right because the adjacent creature
  may take damage on anyone's turn. It is refused before round 1, in closeout and outside combat
  (`ferocity.md`: "you can't gain ferocity outside of combat").
- **Encounter end.** "You lose any remaining ferocity at the end of the encounter" maps to `lose`,
  which sets the pool to 0 and clears claims. Ferocity has no negative values, so `lose` and `reset`
  behave the same here. The V120 void-keep note (Q-RES-1) covers the Beastheart automatically.
- **Rampage and the shared pool.**
  - `rampage.md`: "Whenever you or your companion spends ferocity, your companion gains rampage
    equal to the ferocity spent."
  - V143 changes only gains. Companion abilities already pay from the Beastheart's pool through
    `ability.use` (`cost: { resource: 'ferocity' }` in `beastheartAbilities.ts:41`).
  - Rampage stays manual, as the existing `Companion: Rampage` row says ("After actual Ferocity
    payment add that amount to Rampage manually"). Gains correctly add no rampage.
- **Keying by class.**
  - `generationProfile` matches `baseline.class.value === 'Beastheart'` exactly, and the pool guard
    also requires `ferocity`.
  - There is no Fury profile on this branch. The V120 Fury witness (Thorn) still has none: the
    `tests/app/heroic-resource.test.ts:66` and `:101` assertions are unaffected.
  - When a Fury profile lands, keyed `'Fury'`, neither profile can match the other class: the
    lookup is by class name, and the pool name only guards.
  - The Unstoppable title (`title/unstoppable.md`, Fury ability ferocity for non-Furies) is
    echelon 2 and not automated anywhere.
- **Ambiguities.** Shared space as adjacency, damage to the companion itself and non-combat
  stressful situations are recorded in the ledger and the slice's out-of-scope list. The claim is
  table-confirmed, so the app makes no reading of its own.
- **Existing coverage.**
  - `scripts/headless/beastheart.ts` commits a combat with 14 fresh Beastheart witnesses. They have
    0 Victories, so the grant is +0.
  - That journey takes no turn, so there is no 1d3. It sets ferocity with the absolute
    `adjust.heroic-resource` (`tableOperations.ts`: "The new Heroic Resource value") before each
    paid use.
  - It closes with `voidMode: 'keep'` at pool 0, so no `combat.resource-kept` note is written.
  - Its assertions keep their meaning. `tests/character-v106-beastheart.test.ts` never enters
    combat.
  - No other test or journey builds a Beastheart in combat.
- **Quotes.** Every clause and the level-4 `levelAmounts` quote are verbatim from the pinned files,
  and the V120 verbatim-quote test covers them.
- **Tests.**
  - The app test proves combat-start Victories, the logged d3, the claim once per round, and 0
    after finish, all with persisted readback.
  - The headless cohort does the same through `commands:invoke`, and it is registered in
    `scripts/verify-character-headless.ts`.
  - Expected values come from the source text.

## Checks run by the reviewer

- `npx tsc --noEmit`: exit 0, no output.
- `npx eslint` on the five changed TypeScript files: exit 0.
- `npx vitest run tests/app/heroic-resource-beastheart.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 6 tests passed.
- No other suites, journeys or services were run.

## Verdict

CHANGES REQUIRED: R1. The stale manual Ferocity row invites the table to double-count the gains the
engine now applies, and it gives the wrong amount from level 4. The profile itself (amounts, level
ceiling, one turn-start roll, per-round limit, encounter-end loss and class keying) is correct against
the Compendium.

## R1 closure: `e6cc919`

Verdict: PASS. R1 is closed, and I found nothing new at any severity.

- **R1: closed.**
  - The `Beastheart: Ferocity` row (`shared/content/classes/beastheart/abilities.ts:959`) now says:
    - Levels 1–6: the app adds Victories at combat start and 1d3 at each turn start, and clears
      ferocity at encounter end.
    - The adjacent-damage gain is claimed with
      `/resource claim trigger=beastheart-companion-adjacent-damage` for "+2, +3 from level 4", and
      the table is told not to also adjust by hand.
    - Level 7+: resolve these gains manually.
  - That matches the profile: `verifiedThroughLevel: 6`, the `levelAmounts` from
    `unleash-the-beast.md`, and `feral-heart.md` at level 7.
  - The "Record and resolve manually" prefix and the outside-combat sentence are unchanged.
  - No other fixture, test or script pins the old text.

Checks run by the reviewer at `e6cc919`:
- `npx tsc --noEmit`: exit 0.
- `npx eslint shared/content/classes/beastheart/abilities.ts`: exit 0.
- `npx vitest run tests/character-v106-beastheart.test.ts tests/app/heroic-resource-beastheart.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  3 files, 8 tests passed.
- No other suites, journeys or services were run.
