# V144 independent rules and implementation review

Reviewer: V144-REVIEW (independent review subagent). Date: 2026-09-24.
Reviewed `03912bdd` on `slice/V144` (`.worktrees/resource-null`). The change reviewed is
`git diff b819e2e2..03912bdd`, where `b819e2e2` is V142 and was reviewed separately. V120 and V142
engine code (`shared/resolve/heroicResourceGeneration.ts`, `convex/lib/resourceTriggers.ts`,
`convex/lib/resourceOperations.ts`, `convex/lib/clock.ts` `fireHeroicResource`) was read only to
judge how the Null uses it.
Rules source: the pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `03912bdd`: CHANGES REQUIRED (R1 required; R2 advisory).

## Findings

### R1 (required). Correcting a Malice ability that damaged the Null takes back the Null's Malice discipline

- **Where.**
  - `convex/lib/resourceTriggers.ts:324`: `observeMaliceAbility` links the gain to the ability use,
    because `applyObserved` gets `useEventId = scope.eventId`.
  - `convex/lib/resourceTriggers.ts:268-274`: `reconcileObservedGains` looks at every claim whose
    `resource.triggered` event has that `useEventId`. It reverses the claim unless
    `damageSatisfies(trigger.observe, …)` is true.
  - `convex/lib/resourceTriggers.ts:202-216`: `damageSatisfies` returns `false` for any `observe`
    other than `damage-taken` and `winded-or-dying`, so it always returns `false` for
    `malice-ability`.
  - `convex/lib/abilityOperations.ts:2048-2064`: `ability.correct` calls `reconcileObservedGains`
    for the corrected target, with the original use's event id, whenever that target is a hero who
    took damage.
- **Evidence.**
  - `feature/null/level-1/discipline.md`: "The first time each combat round that the Director uses
    an ability that costs Malice …, you gain 1 discipline."
  - The gain depends only on the Director using the ability. A later edge/bane correction to its
    damage does not change whether the ability was used.
  - V142's reconciliation assumes that every observed gain linked to a use is a damage gain. V144
    adds a non-damage gain under the same link, and nothing prevents the reconciliation from
    reaching it.
- **Failure scenario.**
  1. Round 1: a goblin warrior uses Bury the Point (2 Malice) on the Null, who takes damage.
  2. `observeMaliceAbility` gives the Null +1 discipline and records the `null-director-malice`
     claim for round 1, linked to the use.
  3. The Director runs `/ability correct event=… target=@Null edges=1`. This applies even when the
     tier and damage do not change.
  4. `reconcileObservedGains` logs `resource.reversed` "no longer applies after the correction",
     takes 1 discipline back and releases the round-1 claim.
  5. Result:
     - the Null has lost a gain the source grants;
     - the round's limit is released, so a second Malice ability later in round 1 grants +1 again,
       and the table can also claim it;
     - the log says the trigger "no longer applies", which is false.
- **Fix.**
  - In `reconcileObservedGains`, reconsider only claims whose trigger is a damage observation, for
    example `if (trigger?.observe !== 'damage-taken' && trigger?.observe !== 'winded-or-dying')
    continue;` before the `damageSatisfies` check. Alternatively, give `damageSatisfies` an explicit
    "not a damage trigger: keep" result.
  - Add a focused app assertion:
    1. a Null takes damage from Bury the Point and gains +1;
    2. `/ability correct` on the Null changes that use's edges;
    3. discipline and the `null-director-malice` claim are unchanged, and no `resource.reversed`
       event is logged for that trigger.

### R2 (advisory). Q-RES-5 does not cite the pinned passage that its "see *Draw Steel: Monsters*" refers to

- **Where.** `docs/rules-questions-for-user.md:1009-1023` (Q-RES-5), the slice doc's scope bullet,
  and `docs/build/evidence/V120/null.md`, ambiguity 1.
- **Evidence.**
  - The pinned Compendium includes that Monsters text: `rule/monster/malice.md` (scc
    `mcdm.monsters.v1/rule.monster/malice`), in the "Spending Malice" section.
  - It says "Monsters can spend Malice … activating and enhancing their abilities. Abilities that
    make use of Malice have their Malice cost noted in a creature's stat block." It also describes
    "[Creature] Malice" features that are spent "once per turn", separately from abilities.
  - That passage is the best source for reading A over B and C. Q-RES-5 quotes only the Null
    passage.
  - The interpretation is labelled, and alternatives (b) and (c) are named, so this is not an
    unlabelled guess. However, AGENTS.md asks for "cites the passage".
- **Failure scenario.** None in play. The user decides Q-RES-5 without seeing the one passage that
  defines Malice spending, and could rule on B on a false premise that the rules are silent.
- **Fix.** Quote the two `rule/monster/malice.md` sentences in Q-RES-5 and in the ledger. Optionally
  add that "[Creature] Malice" features are not stat-block abilities.

## Reviewed and accepted

- **Null discipline at levels 1–6.**
  - I read every file under `feature/null/**` and `feature/ability/null/**`, and grepped the whole
    `en/unified/md` tree for discipline gain, loss and "instead" text.
  - All of the level-1 gains and the loss are in `feature/null/level-1/discipline.md`. They match the
    profile:
    - +Victories at combat start;
    - +2 at each turn start;
    - the Null Field main-action trigger (+1);
    - the Malice trigger (+1);
    - "lose any remaining discipline at the end of the encounter".
  - At levels 2–6, the only change is `level-4/regenerative-field.md`: "2 discipline instead of 1"
    for the Null Field trigger.
    - It is a general level-4 feature, not a tradition feature (`class/null.md` table, 4th row).
    - `levelAmounts` from level 4 is correct, and the Malice trigger stays at 1.
  - The following were checked and none changes discipline gain or loss:
    - the tradition features at levels 2, 5 and 6 (Instant Action spends 3);
    - Enhanced Null Field;
    - Elemental Absorption/Buffer;
    - the Discipline Mastery tables (thresholds grant surges, not discipline).
  - External heroic-resource grants (titles, treasures, other classes' abilities) are out of scope
    for the class profile, as in V120 and V142.
- **Level ceiling.**
  - `level-7/improved-body.md` ("3 discipline instead of 2") supersedes the turn-start amount, so
    `verifiedThroughLevel: 6` is right.
  - `level-10/manifold-body.md` (4) and `manifold-resonance.md` (restricted discipline) fall under
    the same ceiling.
- **Trigger limits.**
  - Both triggers say "The first time each combat round", and both use `limit: 'round'`.
  - They are separate triggers with separate claim records, so the Null Field claim does not block
    the Malice gain and the Malice gain does not block the claim.
  - An automatic gain and a claim of the same trigger share one limit, and the app test proves a
    later claim is refused.
- **Null Field as a claim.** The claim is appropriate, because the aura's area and positions are not
  tracked. The confirmation text says so.
- **Q-RES-5 labelling.**
  - Q-RES-5 is labelled "labelled interpretation" and names alternatives (b) and (c) alongside
    reading A.
  - The profile's confirmation text tells the table to claim readings B and C. R2 covers the missing
    citation only.
- **Malice paths that bypass `debit`.**
  - Every campaign Malice write was grepped. There are only three:
    - `debit`;
    - the clock's Malice steps (gains and loss, not spending);
    - `/adjust malice` (a manual edit, not an ability use).
  - `ability.fire` delegates to `ability.use`, so there is one debit per use.
  - `squad.act` accepts only the signature ability and four common maneuvers, and pays no cost.
    Minions use Malice abilities individually through `ability.use`.
  - Villain actions print no Malice cost.
  - "[Creature] Malice" and Basic Malice features are not usable abilities in the app.
    - Every variable cost ("3+", "3-7", "2-7+") in `monster/**` is on a Malice feature, not on a
      stat-block ability.
    - Every stat-block ability's Malice cost therefore parses as a fixed cost and reaches `debit`,
      through either the rolled path or the recorded path.
  - A foe ability that is `manual` because of source drift pays nothing automatically, so the table
    claims. This is rare, and the table can claim.
  - No path both debits and re-observes, so nothing double-triggers.
- **Undo, redo and refund.**
  - The gain and claim are journaled in the use's scope, so undoing or rewinding the use removes
    them, and the app test proves it. Redo writes the recorded values.
  - There is no Malice refund operation. Raising Malice with `/adjust malice` is a manual edit and
    correctly does not reverse anything; undo is the supported route.
- **Out of combat, before round 1, closeout.**
  - `committedEncounter` returns null out of combat, so nothing happens.
  - `blocked` refuses in round 0 (roll or choice phase), in closeout and for non-participants.
  - The Malice rule's "during combat" matches this.
- **Several Nulls.** Every `heroParticipantIds` hero with a profile is visited, each with its own
  claim record and a dice key that includes the `characterId`. Heroes of other classes have no
  `malice-ability` trigger and are skipped.
- **Malice visibility.** The `resource.triggered` entry shows the Null's discipline, not the Malice
  pool. The cost amount of a Malice ability is already public under `showMalice: false`
  (`convex/lib/audience.ts:106-118`).
- **Existing Null content.**
  - `shared/content/classes/null/*.ts` has no manual discipline-gain row. The only discipline text
    is costs, mastery thresholds and the outside-combat waiver, so nothing now counts twice.
  - The censor Edict and Arcane Disruptor/Purge "costs Malice" riders are damage to the foe and do
    not interact.
- **Existing journeys and tests.**
  - `scripts/headless/null.ts` sets discipline with absolute `adjust.heroic-resource` before each
    paid use. It uses no foes and takes no turns, and its combat never reaches round 1, so V144
    changes nothing it asserts.
  - `tests/character-v103-null.test.ts` is a build and sheet test with no generation assertions.
  - Other app tests that use Bury the Point have no Null participant, so for them
    `observeMaliceAbility` does nothing.
- **Quotes.** Every new profile clause is verbatim from its pinned file. The pure test enforces this
  and passes.

## Checks run by the reviewer

- `npx tsc --noEmit` (root) and `npx tsc --noEmit -p convex`: both exit 0, no output.
- `npx eslint` on the five changed source and test files: exit 0.
- `npx vitest run tests/app/heroic-resource-null.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 7 tests passed.
- No other suites, journeys or services were run. R1 comes from reading the code. No test for it was
  written or run, because the reviewer's remit excludes new tests.

## Verdict

CHANGES REQUIRED: R1, where a correction reverses the Malice discipline gain and releases its
round limit. R2 is advisory.

## R1–R2 closure: `24531816` (with V142 `e8666e48`)

Verdict: CHANGES REQUIRED. R1 is fixed in the code and R2 is closed, but the R1 regression test
cannot catch the failure (R3).

- **R1: fixed in the code.**
  - `reconcileObservedGains` (`convex/lib/resourceTriggers.ts:275`) now skips a linked gain unless
    its trigger observes `damage-taken` or `winded-or-dying`, before the `damageSatisfies` check.
  - A correction therefore can no longer reverse `null-director-malice`, or any other future
    non-damage trigger.
  - V142's damage reconciliation is otherwise unchanged.
- **R2: closed.**
  - Q-RES-5 now quotes the two `rule/monster/malice.md` sentences.
  - It says that A and B are supported by the passage and C is not. That matches the passage, which
    handles "[Creature] Malice" features apart from stat-block abilities.
  - The recommendation and the labelled current behaviour are unchanged, which is consistent with
    that.

### R3 (required). The R1 regression assertion corrects the wrong target, so it passes with or without the fix

- **Where.** `tests/app/heroic-resource-null.test.ts:73-78`.
- **Evidence.**
  - Bury the Point is used on `@Thorn` (`bury()`, line 51), and the correction is
    `/ability correct … target=@Thorn`.
  - `ability.correct` calls `reconcileObservedGains` only for the corrected target's own character
    (`convex/lib/abilityOperations.ts`, `targetRecord.character`). It therefore walks Thorn's claims,
    never the Null's.
  - The Null's `null-director-malice` gain and claim were never reachable from that correction. This
    was also true before `e8666e48`, so the new assertions (discipline 3, claim kept) hold whether
    or not the fix is present.
  - AGENTS.md: "Write only tests that catch a concrete failure."
- **Failure scenario.** Someone reverts or reworks the `observe` guard in `reconcileObservedGains`.
  The Null test still passes, and R1 returns unnoticed.
- **Fix.**
  - Make the corrected use hit the Null. For example, the first Bury the Point targets
    `@{character:${hero}}`, and the correction is `target=${ref} edges=1 banes=0`, since the Null
    takes damage.
  - Then assert:
    - discipline is still 3;
    - the claim list is still `['null-director-malice']`;
    - there is no `resource.reversed` event whose `causeEventId` is the correction.
  - To confirm the assertion is sensitive, check that it fails on `b819e2e2`'s reconcile.

Checks run by the reviewer at `24531816`:
- `npx tsc --noEmit` (root) and `-p convex`: both exit 0.
- `npx eslint convex/lib/resourceTriggers.ts tests/app/heroic-resource-null.test.ts`: exit 0.
- `npx vitest run tests/app/heroic-resource-null.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 7 tests passed.
- No other suites, journeys or services were run.

## R3 closure: `9f515e50`

Verdict: PASS. R1, R2 and R3 are closed, and nothing new is at required severity.

- **R3: closed.**
  - The first Bury the Point now targets the Null (`bury(ref)`), and the correction is
    `target=${ref} edges=1 banes=0`.
  - `ability.correct` therefore runs `reconcileObservedGains` over the Null's own claims, which
    include the `null-director-malice` gain linked to that use.
  - The test asserts no `resource.reversed` caused by the correction, discipline still 3, and the
    claim kept. The remaining steps are unchanged:
    - the second Malice use adds nothing;
    - the claim is refused;
    - the Null Field claim is made;
    - the undo chain back to 2;
    - 0 after finish.
  - The implementer reports that the assertion fails with the `observe` guard removed ("expected
    [ {…} ] to deeply equal []"). The reviewer did not re-run that mutation. By reading the code, it
    is the expected outcome: without the guard, `damageSatisfies('malice-ability', …)` is false and
    the gain is reversed.

Checks run by the reviewer at `9f515e50`:
- `npx tsc --noEmit` (root) and `-p convex`: both exit 0.
- `npx eslint tests/app/heroic-resource-null.test.ts`: exit 0.
- `npx vitest run tests/app/heroic-resource-null.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 7 tests passed.
- No other suites, journeys or services were run.
