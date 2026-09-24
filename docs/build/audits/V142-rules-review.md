# V142 independent rules and implementation review

Reviewer: V142-REVIEW (independent review subagent). Date: 2026-09-24.
Reviewed `9ea9c9e` (`slice/V142`) against the accepted V120 engine `63b47d7`
(`git diff 63b47d7..9ea9c9e`), in `.worktrees/resource-fury`.
Rules source: the pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).
Commands run: `git` reads and `npx tsc --noEmit` (clean). No tests or builds were run.

Verdict at `9ea9c9e`: CHANGES REQUIRED (R1, R2 and R3 are required; R4 is advisory).

## What was checked and holds

- **Gains and limits.** These match `feature/fury/level-1/ferocity.md`:
  - +Victories at combat start;
  - 1d3 at each turn start;
  - +1 "the first time each combat round that you take damage", limit `round`;
  - 1d3 "The first time you become winded or are dying in an encounter", limit `encounter`;
  - lose all at encounter end.
- **Level amounts.** `feature/fury/level-4/damaging-ferocity.md` ("2 ferocity instead of 1") is
  applied through `levelAmounts` from level 4. The ceiling `verifiedThroughLevel: 6` is right, since
  `feature/fury/level-7/greater-ferocity.md` changes the turn-start gain.
- **No missed gains at levels 1–6.** I read every level 2–6 Fury feature, grepped
  `feature/ability/fury/**` (levels 1–6 and stormwight-kits), `feature/fury/{boren,corven,raden,vuken,
  stormwight-kits}` and `kit/{boren,corven,raden,vuken}.md`. There is no other ferocity gain.
  - Level 4's Growing Ferocity improvement and Primordial Strike, and the level 5 and level 3
    ferocity abilities, are thresholds or costs, not gains.
  - Riders on the Storm's self-damage happens only outside combat.
- **Winded.** Only Stamina is tested, and temporary Stamina is ignored. This is right:
  `rule/health/temporary-stamina.md` says temporary Stamina "shouldn't be included … when figuring
  out a creature's … winded value", and `rule/health/winded.md` defines winded as Stamina ≤ the
  winded value.
- **Damage taken.** The test counts damage absorbed only by temporary Stamina ("the temporary
  Stamina decreases first") and excludes 0 damage (`rule/damage/damage-immunity.md`), as Q-RES-4
  states.
- **Coverage of damage writes.** `writeDamage` has five callers, and all are covered:
  - `abilityOperations.ts:1500` (creature free strike), `:1700` (rolled use) and `:2046`
    (correction);
  - `squadOperations.ts:958` (squad act) and `:1092` (free strike together), so squad damage to
    heroes is covered.
  - Healing (Catch Breath, `tableOperations.ts:318`) and `/adjust stamina` (`:576`) do not go
    through it.
  - `took` and `crossed` both require a decrease, so a correction that raises Stamina fires nothing.
- **Ordering.** `writeDamage` patches and then re-reads the character. `observeHeroDamage` re-reads
  it for each trigger, and `writeTriggerGain` re-reads it before patching. Every later
  character write in the same commits reads fresh (`debit` at `:802`, `conditionInstances.ts:43`).
  The ferocity `debit` runs before damage in the rolled path, so it cannot overwrite the gain.
- **Events.**
  - The `resource.triggered` consequence copies the pattern of `squad.captain-lost`: origin
    `engine`, the cause's `commandId` and `causeEventId`.
  - `appendEvent` inherits the cause's `commandKey`, and nothing hashes or chains events.
  - The cause event exists before `commit` runs (`registry.ts:516`, then `:535`).
- **Undo, redo and rewind.**
  - `walkHistory` maps the engine event to its unit by `commandKey`.
  - `restoreUnit` reverts the pool and the claim together, both journaled under the cause scope,
    and marks the event `undone` or `redone`.
  - Restores patch values directly and never call `writeDamage`, so the trigger cannot fire again.
- **Dice.**
  - The key `hrt_${eventId}_${triggerId}` is unique per event and trigger, and within the length
    and character rules.
  - OCC retries replay the whole transaction, and redo does not reroll.
  - The claim's `envelope.commandId` roll cannot collide:
    - `resource.claim` is never a card continuation (the only continuations are in
      `combatOperations.ts:197`, `squads.ts:354` and `registry.ts:327`);
    - it rolls once per command;
    - `invoke` makes a command once-only.
- **Blocking and cost.**
  - A closeout phase, no committed encounter, a hero outside `heroParticipantIds`, round < 1, or a
    pool name other than `ferocity` all block the trigger. The pool check keeps the Beastheart out.
  - Foes and squad members return from `writeDamage` before the hero branch.
  - A non-Fury hero costs one extra `db.get` per damage write.

## Findings

### R1 (required). A Fury who is already winded and then drops to dying gets no grant, and Q-RES-2 does not cover this case

- **Where.**
  - `convex/lib/resourceTriggers.ts:149`: `const crossed = before.stamina > winded && after.stamina <= winded;`
  - `docs/rules-questions-for-user.md:955-975` (Q-RES-2).
- **Evidence.**
  - The source is "The first time you become winded **or are dying** in an encounter, you gain 1d3
    ferocity." "Are dying" describes a state (`rule/health/dying.md`: "When your Stamina is 0 or
    lower, you are dying"). The V120 ledger (`evidence/V120/fury.md`, A2) raised this asymmetry.
  - Q-RES-2 covers a Fury winded at encounter start. It says nothing then, and grants only after
    healing above the winded value and dropping again. Its alternatives are (a) two grants and
    (b) an immediate grant at the start.
  - Q-RES-2 does not consider the reading that a Fury who has had no grant this encounter gets it
    on first reaching dying. Under the implementation, a winded Fury never gets it by reaching
    dying.
- **Failure scenario.**
  - Thorn enters an encounter at Stamina 10, with winded value 14 (Stamina carries over).
  - In round 2, a goblin hits her to −1. She is dying for the first time in this encounter and has
    had no grant, but gains nothing.
  - A second case: a Fury is made winded by a manual `/adjust stamina` (Blood for Blood self-damage
    or To the Uttermost End's Stamina loss) and nobody claims it. Recorded damage later takes her
    to dying, and she gains nothing.
- **Fix.**
  - Preferred: treat a first drop to dying as a trigger too, as
    `crossed = (before.stamina > winded && after.stamina <= winded) || (before.stamina > 0 && after.stamina <= 0)`.
    The `encounter` limit still makes it one grant.
  - Update the Q-RES-2 text, the `observe` doc comment and the confirmation string to match.
  - Add an app assertion: a Fury already winded before round 1 is hit to 0 or lower, gains 1d3,
    and a second grant in the same encounter is refused.
  - If the author keeps the current reading instead, label it in Q-RES-2 as a separate
    interpretation, name this alternative, and make the confirmation text say to claim on dying.

### R2 (required). A correction that reduces the damage leaves the observed gain standing, and this is not labelled

- **Where.**
  - `convex/lib/abilityOperations.ts:2046` (the `ability.correct` reconciliation calls
    `writeDamage`).
  - `convex/lib/resourceTriggers.ts:147-151` fires only on a decrease.
  - Nothing reconciles the original use's `resource.triggered` consequences. Neither the slice doc,
    Q-RES-2, Q-RES-3 nor Q-RES-4 mentions corrections.
- **Evidence.**
  - A correction that lowers the tier raises the target's Stamina by the reconciliation delta.
    `took` and `crossed` are false, so nothing happens.
  - The original event's consequence (+1d3 and an `encounter` claim for `fury-winded-or-dying`)
    stays applied. It is a separate unit only from undo's point of view; the correction is a new
    unit.
  - After the correction, the Fury was never winded. The corrected record contradicts the grant,
    and the claim record now blocks the real first crossing.
- **Failure scenario.**
  - A goblin's rolled Strike takes Thorn from winded+2 to winded−3. She gains +1 and +1d3.
  - The Director applies a missed bane with `ability.correct`. The tier drops, and Thorn ends at
    winded+1, not winded.
  - Ferocity stays inflated by 1d3.
  - Later in the encounter she really becomes winded and gets nothing. A claim is refused with
    "Already claimed this encounter".
  - The same happens to the first-damage +1 if an immunity correction brings the damage to 0
    (Q-RES-4 says 0 damage is not taken).
- **Fix.**
  - Preferred: in the correction commit, after `writeDamage`, load the original event's
    `resource.triggered` consequences for this target (`causeEventId === event._id`, same
    `characterId`). Re-evaluate each against the original pre-damage Stamina
    (`inputs.targetFacts`) and the corrected result. For any that no longer holds:
    - subtract its delta and remove the claim whose `eventId` is that consequence;
    - journal this under the correction scope and append a linked `resource.trigger-reversed`
      engine event.
  - Minimum: record this as a labelled limitation (slice doc, plus a line in Q-RES-2 and Q-RES-4
    with the reversal alternative). Append a warning to the correction description that names the
    kept gain and points to `/adjust heroic-resource`.

### R3 (required). Existing expectations for Thorn, who is a Fury, were not updated, and the gate will fail on them

- **Where.** Thorn (`tests/app/fixtures/table.ts:142`, built from the Fury selections) now gets:
  - three `heroic-resource` clock registrations at `combat.commit`;
  - a `clock.heroic-resource` event at combat start, at each of her turn starts (with a d3 roll)
    and at combat end;
  - `resource.triggered` consequences and `resourceClaims` when she takes damage in rounds.
- **Failures:**
  - `tests/app/heroic-resource.test.ts:71-75`: the heroic-resource registrations are expected to
    be `[shadow, shadow, shadow]` and will now include Thorn three times. The comment at `:66`
    ("Thorn (Fury) has no profile yet") is now false.
  - `tests/app/combat.test.ts`:
    - `:303-327`: the exact registration list (Thorn's three rows go between the Malice rows and
      the surprise expiry, which moves from enqueueSeq 4 to 7);
    - `:331` and `:450-455`: exact clock-event kind lists (new `clock.heroic-resource` entries);
    - `:971-988`: the roll count is taken before `@Thorn /turn take` and compared after it (the
      turn-start d3 adds one roll);
    - `:993-1006` and `:1024`: enqueueSeq 4, 5 and 6 shift by 3;
    - `:1337`: `rolls` is expected to have length 0 in the hero-side variant, where Thorn takes a
      turn.
  - `tests/app/history.test.ts:639-669`: registration snapshots (`[enqueueSeq, status]`) around
    Thorn's turn.
- **Likely further failures:**
  - Unit event and change counts, and exact event-kind lists, for any foe attack or squad action
    that damages Thorn in rounds ≥ 1: `abilities.test.ts`, `squads.test.ts`,
    `potency-conditions.test.ts`, `multi-target.test.ts`, `grab.test.ts`, `kit-bonus.test.ts`,
    `tier-effects.test.ts`, `compiled-effects.test.ts`, `condition-instances.test.ts`,
    `history-audit.test.ts` and `v001-walkthrough.test.ts`.
  - Full `liveState` equality on Thorn against a literal or a pre-combat value (`heroicResource`
    and `resourceClaims` now change).
  - Closeout event lists: `closeout.test.ts`, `closeout-session.test.ts`.
  - Dice: any `position()` followed by `@Thorn /turn take` and then a roll, because the turn-start
    d3 uses up the positioned counter.
- **Headless journeys.** `scripts/headless/fury.ts` and `fury-level-three.ts` commit combat but
  never start rounds. The observer blocks at round 0 and the Victories grant is 0, so they are
  unaffected. The `tier-effects.ts` target is an Elementalist. `heroic-resource.ts` uses only a
  Shadow.
- **Product problems.** None found. Every case above is a stale expectation of the kind the slice
  doc predicts ("existing tests now see automatic ferocity"). The dice consumption, extra events and
  registrations are correct behaviour.
- **Fix.** Before handing to TESTER:
  - update `heroic-resource.test.ts:66-75` (filter to the Shadow's `characterId`, or expect Thorn's
    three rows);
  - update the combat and history registration, clock and roll assertions listed above;
  - for the rest, prefer filtering by kind or actor over exact whole-list equality, rather than
    re-pinning longer lists.

### R4 (advisory). The Fury's own self-damage is recorded manually, and nothing points the table to the claim

- **Where.**
  - `shared/content/classes/fury/abilities.ts:29` (Blood for Blood!: Extra Damage: "Resolve both
    rolls and damage manually").
  - The `fury-first-damage` and `fury-winded-or-dying` confirmation strings
    (`shared/resolve/heroicResourceGeneration.ts:162`, `:175`).
- **Evidence.**
  - `feature/ability/fury/level-1/blood-for-blood.md`: "You can deal 1d6 damage to yourself".
    That is damage, not Stamina loss, so it satisfies "the first time each combat round that you
    take damage".
  - The table records it with `/adjust stamina`, which by design (Q-RES-3) triggers nothing.
  - The confirmation string gives only falling as an example.
- **Failure scenario.**
  - A Fury opens round 2 with Blood for Blood's self-damage, recorded manually. She gets no +1
    unless someone claims it. If no recorded damage follows that round, the gain is lost.
  - If the self-damage makes her winded, a later recorded hit is not a crossing (see R1), so the
    1d3 is also lost.
- **Fix.**
  - Name Blood for Blood in both confirmation strings, and in Q-RES-3 as damage that the table
    records manually.
  - Add "then claim the ferocity trigger" to that row's `activationCondition`.

## Verdict

CHANGES REQUIRED:
- R1: grant on first reaching dying, or label that reading with its alternative;
- R2: reverse or label and warn for the observed gains that a correction invalidates;
- R3: update the stale expectations so the gate can pass.

The observer's engine mechanics hold: coverage, ordering, event linkage, undo and redo, dice keys,
closeout and non-participants.

## Closure review at `111f9171`

Reviewed `git diff 9ea9c9e..111f9171` (`b819e2e2`, `e8666e48`, `111f9171`). The worktree was idle,
so these checks were run at `111f9171`:
- `npx tsc --noEmit`: clean.
- `npx eslint` on the changed source and test files: clean.
- `npx vitest run tests/app/heroic-resource-fury.test.ts tests/scripts/heroic-resource-generation.test.ts tests/app/v001-walkthrough.test.ts`:
  3 files and 8 tests passed.

Nothing broader was run. The 31-file sweep the coordinator reported was not re-run here.

- **R1: closed.**
  - `damageSatisfies` (`convex/lib/resourceTriggers.ts`) fires `winded-or-dying` when Stamina
    crosses the winded value, or when it goes from above 0 to 0 or lower. The `encounter` limit
    keeps it to one grant.
  - Q-RES-2 now states the dying case and the correction case, and still lists alternatives (a)
    and (b).
  - The new app test covers this: a Fury at Stamina 1 before combat is hit to 0 and gains +1 and
    +1d3.
- **R2: closed.**
  - `reconcileObservedGains` runs in the `ability.correct` commit before the damage write. It
    compares the original start pools (`applied.staminaBefore`) with the corrected result.
    `correctTarget` rebuilds that result from the restored pools, so this is the right baseline.
    With no corrected damage, the start pools are used, so every gain is reversed.
  - It considers only `resource.triggered` claims whose `useEventId` is the corrected use, and only
    damage-observed triggers (`e8666e48`).
  - For each gain the corrected damage no longer earns, it:
    - subtracts the gain, not going below the floor;
    - releases the claim;
    - logs `resource.reversed` under the correction's command key, so undoing the correction
      restores the gain.
  - Gains the corrected damage newly earns come from the correction's own `writeDamage`, which
    passes the original `useEventId`, so a later correction can reconcile them too. Gains still
    earned are kept, and their claims block a double gain.
  - The new test covers this with Spear Charge: tier 2 becomes tier 1 under a bane, the winded
    grant is reversed and released, and the first-damage gain stands.
- **R3: closed for the files named in the finding.**
  - The updated assertions in `abilities`, `combat`, `heroic-resource`, `history` and
    `v001-walkthrough` read Thorn's rolled ferocity back, or filter by actor or kind. They are not
    weakened to accept anything.
  - The TESTER gate still owns the full run.
- **R4: closed.** Both confirmation strings and the Blood for Blood row now say to claim for
  self-damage entered by hand.
- **Found during closure: a problem the first review missed, now fixed.**
  - At `9ea9c9e` the dice key was `hrt_${eventId}_${triggerId}`. Two Furies made winded by one area
    ability would both have received the same accepted 1d3, because the key and fingerprint
    matched.
  - The key is now `hrt_${eventId}_${characterId}_${triggerId}` (about 90 characters, within
    `rollDice`'s limit of 128), so each hero gets her own roll.

No new findings.

**Closure verdict: PASS** at `111f9171`.
