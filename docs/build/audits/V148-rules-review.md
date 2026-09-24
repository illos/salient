# V148 independent rules and implementation review

Reviewer: V148-REVIEW (independent rules and code review subagent). Date: 2026-09-24.
Reviewed `d44a0a54` on `slice/V148` against `slice/V142`, in `.worktrees/resource-elementalist`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `d44a0a5`: CHANGES REQUIRED (R1, R2, R3 and R5 required; R4 advisory).

## Findings

### R1 (required). An ability-use correction does not reconcile the Persistent Magic break or the turn tally

- **Where.** `convex/lib/resourceTriggers.ts:330-331` returns when the write does not lower the
  pools. The correction path is `convex/lib/abilityOperations.ts:2049-2076`: `reconcileObservedGains`
  only walks `resourceClaims`, then `writeDamage` records the delta from the *current* pools.
- **Evidence.**
  - `feature/elementalist/level-1/persistent-magic.md`: "If you take damage equal to or greater than
    5 times your Reason score in one turn, you stop maintaining any persistent abilities."
  - V142 set the rule that an observed consequence of damage is reversed when a correction removes
    the damage that caused it (`reconcileObservedGains`). The break is such a consequence, but it is
    not reconciled. A correction that lowers damage writes a Stamina *increase*, so `taken <= 0` and
    the observer returns. `turnDamage` keeps the original amount, and `maintained` stays `[]`.
  - A correction that raises damage adds the delta to the turn that is active *now*. That may not be
    the turn in which the damage was taken.
- **Failure scenario.** The hero has Reason 2 and maintains Conflagration. On the goblin's turn,
  Spear Charge at tier 3 plus an earlier hit makes 10 damage. `resource.maintenance-ended` is logged
  and maintenance stops. The Director then corrects the edge: tier 2, and the hero's turn total is
  now 9. Stamina is restored, but maintenance stays ended, the log still says it ended, and
  `turnDamage.amount` stays at 10. Any later 1 damage in that turn is compared against the stale
  total.
- **Fix.**
  - In the correction commit, recompute the tally for the original turn:
    `turnDamage.amount − original taken + corrected taken`. Do this only when `turnDamage.turnId`
    still matches the original event's turn.
  - If a `resource.maintenance-ended` caused by the corrected use no longer holds, restore the
    `maintained` entries it ended and log a linked reversal, as `resource.reversed` does.
  - Alternatively, label the gap in the slice document and Q-RES-10, and point the table to
    `/resource maintain` to restore maintenance by hand.
  - Add one app assertion: a tier-3 → tier-1 correction after a break restores maintenance.

### R2 (required). One entry per ability name forbids a second maintained instance, and this interpretation is not labelled

- **Where.** `convex/lib/resourceOperations.ts:228-230` (`already maintains` refusal). The data model
  is `maintained: { ability, value, encounterId }[]`, keyed by name
  (`shared/contracts/liveState.ts:114`).
- **Evidence.** `persistent-magic.md`: "If you maintain the same ability on several targets and the
  effect includes a power roll, you make that roll once and apply the same effect to all targets. A
  creature can't be affected by multiple instances of a persistent ability." The second sentence
  assumes that several instances of one persistent ability can exist at once, on different
  creatures. Each instance would plausibly carry its own upkeep. The first sentence can be read as
  either one use with several targets or several uses. The Compendium does not settle this. The code
  silently takes the narrowest reading. The slice document, the ledger and Q-RES-10 do not mention
  it.
- **Failure scenario.** A level-1 Elementalist uses The Flesh, a Crucible (Persistent 1) on goblin A
  and maintains it. On the next turn, they use it again on goblin B and try to maintain both
  (upkeep 1 + 1 = 2, a gain of 0, which is allowed). The app refuses with "already maintains The
  Flesh, a Crucible". The table must then correct the essence by hand every turn.
- **Fix.** Either allow instances by keying entries by use or by count, with the negative-gain check
  summing every instance. Or keep the one-per-name model, label it as an interpretation in the op's
  source comment and the slice document, and add a question
  to `docs/rules-questions-for-user.md` that names the alternative.

### R3 (required). Maintenance is not tied to a use of the ability, and this is not labelled

- **Where.** `convex/lib/resourceOperations.ts:188-262`. The op checks ownership, combat and the cap,
  but not that the ability was used.
- **Evidence.** `persistent-magic.md`: "Whenever you use a persistent ability, you decide whether you
  want to maintain it, and start doing so immediately after you first use the ability." The op's
  description, the content row and the slice document all present `/resource maintain` as a free
  toggle. None of them says that the prior use is taken on trust.
- **Failure scenario.** A player maintains Conflagration without ever casting it. That skips the
  5-essence cost, and the log shows a normal "maintains Conflagration" record. They can also turn
  maintenance back on after a 5 × Reason break without a new use. That undoes the break.
- **Fix.** The minimum is to label it in the op comment, the description and the slice document: "the
  table vouches that the ability was just used; the app does not check the use". Better, require an
  `ability.use` event for that ability by this hero in this encounter since the last break or stop,
  and refuse otherwise.

### R4 (advisory). Damage taken earlier in the turn before maintenance started is not counted toward the break

- **Where.** `convex/lib/resourceTriggers.ts:338`. The observer returns before `turnDamage` is
  written when nothing is maintained.
- **Evidence.** The rule totals damage "in one turn". It does not say "since you started
  maintaining". Q-RES-10 labels only whose turn counts. It does not label this narrowing.
- **Failure scenario.** The hero has Reason 2. On their own turn, a triggered free strike deals 6.
  They then cast Wall of Fire and maintain it, and take 4 more that turn. The turn total is 10, but
  the app counts 4 and maintenance continues.
- **Fix.** Keep the tally whenever the hero has a persistent profile and is in combat, and check
  maintenance only when deciding the break. Or add this case to Q-RES-10 as a labelled part of the
  current behaviour.

### R5 (required). The "Persistent Magic: End" row no longer matches the engine

- **Where.** `shared/content/classes/elementalist/abilities.ts:41-46`.
- **Evidence.** The row still says "Stop maintaining an ability at any time. Resolve the stated
  effects manually." Using it only records the row. It does not clear `liveState.maintained`, so the
  clock keeps deducting upkeep (`convex/lib/clock.ts:291-301`). V148 changed the sibling "Maintain"
  row to point to `/resource maintain`, but not this row.
- **Failure scenario.** A player uses "Persistent Magic: End" from the ability list to drop
  Conflagration. At their next turn start the gain is still 2 − 2 = 0 instead of 2.
- **Fix.** Point the row to `/resource maintain ability="…" value=off`, as the Maintain row does.
  Or make the row's use perform that stop.

## Checked and correct

- **Persistent table (levels 1–6).** It is complete and correct. A grep of
  `feature/ability/elementalist/level-1..6` for "Persistent" finds exactly the 13 entries in the
  profile: Behold the Mystery 1, Conflagration 2, Instantaneous Excavation 1, No More Than a Breeze
  1, The Flesh, a Crucible 1, O Flower Aid, O Earth Defend 1, Swarm of Spirits 1, Wall of Fire 1,
  Storm of Sands 1, Web of All That's Come Before 1, Luminous Champion Aloft 1, Magma Titan 2, The
  Wode Remembers and Returns 2. The names match each file's `name:`. The only persistent abilities
  are at levels 8–9 (Summon Source of Earth, Earth Rejects You, The Green Defends Its Servants), which
  are outside the verified range. No `feature/elementalist/**` feature at levels 1–6 carries a
  persistent value.
- **Essence clauses.** The combat-start (+Victories), turn-start (+2) and encounter-end (lose)
  quotes are verbatim from `feature/elementalist/level-1/essence.md`. The typed-damage quote is
  verbatim, and so is the round limit. Font of Essence gives +2 from level 4
  (`level-4/font-of-essence.md`, verbatim). The level-6 ceiling is right:
  `level-7/surging-essence.md` makes the gain 3. No other feature at levels 1–6 changes essence gain.
- **Negative-gain cap.** The op refuses when total upkeep exceeds 2. The clock also clamps at 0.
- **Stopping at any time.** `value=off` needs no action and works on any turn.
- **End of encounter.** `encounter-end-loss` clears `maintained` and `turnDamage`. Stale entries
  from a voided or kept encounter are harmless, because every reader filters by `encounterId`.
- **Break.** The threshold is 5 × `baseline.characteristics.R.value` (the evaluated Reason).
  - Temporary Stamina loss counts as damage taken (both pools are summed).
  - Between-turn damage stands alone, and Q-RES-10 labels the "one turn" reading.
  - The break is journaled under the damaging operation's scope, so undo and redo restore
    `maintained` and `turnDamage` together.
  - It runs before the V142 observed triggers. Those re-read the hero (`applyObserved` and
    `writeTriggerGain` use `db.get`), so neither write clobbers the other. The Elementalist has no
    observed triggers.
- **Double counting.** No existing Elementalist row changes the pool. The Persistent Effect rows
  only record the effect. The typed-damage gain is a claim with no manual twin.
- **Existing journeys.**
  - `scripts/headless/elementalist.ts` starts and commits combat but never takes a turn or
    maintains. It sets essence with `adjust.heroic-resource` before each use, so the new profile does
    not change its assertions.
  - `tests/app/elementalist-character.test.ts` does not run combat turns.
- **Self-Taught.** The forgo is manual for every class, and the V120 clock grants the turn-start gain
  regardless. That behaviour was already there before V148, which does not make it worse. The table
  still reverses the gain by hand.
- **Q-RES-3.** Stamina lowered with `/adjust stamina` does not count toward the break. This is
  consistent with the V142 labelled ruling Q-RES-3.

## Checks run

- `npx tsc --noEmit -p tsconfig.json`: clean. `-p convex/tsconfig.json`: clean.
  `-p tsconfig.web.json`: clean.
- `npx eslint` on the 11 changed source and test files: clean.
- `npx vitest run tests/app/heroic-resource-elementalist.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 7 tests passed (one run).

## Verdict

CHANGES REQUIRED. R1 (correction reconciliation, or a labelled gap), R2 and R3 (unlabelled
interpretations) and R5 (the stale End row) must be addressed. R4 is advisory.

## Round 2: fixes at `30c6bcd7`

Re-reviewed `git diff d44a0a54..30c6bcd7`.

Checks run:
- `npx tsc --noEmit` for the root config, `-p convex/tsconfig.json` and `-p tsconfig.web.json`:
  clean.
- `npx eslint` on the changed files: clean.
- `npx vitest run tests/app/heroic-resource-elementalist.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files and 7 tests passed, in one run.

### Closure

- **R2: closed.** `on` appends an instance and `off` removes one (`findIndex`). The negative-gain
  check sums every instance, the sheet reports a count, and the panel offers Maintain and Stop one.
  The test proves two instances at upkeep 2 and refuses a third as negative.
- **R3: closed.** `maintenanceCounts` (`convex/lib/resourceOperations.ts:157-191`) reads this
  encounter's events. It keeps those whose `payload.envelope.boundActor.id` is the hero and whose
  disposition is not `undone`.
  - It counts `ability.use` and `ability.recorded` events whose `data.ability.name` matches. That
    shape is confirmed at `abilityOperations.ts:1222-1225`.
  - It counts `resource.maintain` on-events.
  - It requires uses to outnumber maintains.
  - A use that has been stopped or broken stays consumed, which is right: a new use is needed.
  - Maintaining later than "immediately" is labelled under Q-RES-10.
- **R4: closed.** The tally is written on every in-combat damage write to a hero with a persistent
  profile. The break needs at least one maintained instance. The behaviour is labelled under
  Q-RES-10.
- **R5: closed.** The End row now points to `value=off`.

### R1: not closed. The labelled workaround does not work

- **Where.** `docs/rules-questions-for-user.md:1029-1031` says: "The table re-maintains it: the use
  still counts, since each maintained instance needs one unmaintained use this encounter." In the
  code, `convex/lib/resourceOperations.ts:188` counts every non-undone `resource.maintain` on-event
  as a consumed use, including one whose instance a break ended, and `:275` refuses when
  `uses <= maintains`.
- **Failure scenario.**
  1. The hero uses The Flesh, a Crucible once and maintains it (uses 1, maintains 1).
  2. A Spear Charge brings the turn total to 10, and the break ends maintenance.
  3. The Director corrects the Spear Charge to tier 1, so the turn total is below 10.
  4. Following Q-RES-10, the table runs `/resource maintain ability="The Flesh, a Crucible"`.
  5. It is refused with "has no unmaintained use … this encounter". The documented recovery path
     does not exist.
  6. The remaining ways back are to undo and re-record the damage, or to use the ability again and
     pay its cost. Otherwise the hero keeps the wrong gain, with no upkeep deducted.
- **Fix (either).**
  - Correct the label. Name the working recovery, "undo the damage use and record it again", or
    manual essence adjustment, and drop "the use still counts".
  - Or make it work. Do not count a maintain event as consuming its use when its instance was ended
    by a `resource.maintenance-ended` whose cause event has since been corrected. Add the
    corresponding app assertion.

### Round 2 verdict

CHANGES REQUIRED. R2, R3, R4 and R5 are closed. R1's labelled gap describes a workaround that the
R3 use check refuses. Correct the label, or implement the re-maintain after a correction.

## Round 3: R1 label at `975856ef`

I re-read `git diff 30c6bcd7..975856ef`. It changes docs only, so no tests were run.

- **R1: closed.** `docs/rules-questions-for-user.md` (Q-RES-10, related V148 limits) now matches the
  code.
  - A correction after a break doesn't restore maintenance, and the broken instance's use stays
    spent (`resourceOperations.ts:188` and `:275`).
  - The first recovery it names works: undo back to the damage and re-record it. The break's
    `maintained: []` and the tally are journaled under the damaging operation's scope
    (`resourceTriggers.ts`, `journalPatch(ctx, scope, …)`). Undo therefore restores the instances,
    and the `resource.maintain` on-events are left intact.
  - The second recovery also works: adjust essence by hand.
  - Automatic restoration is recorded as a follow-up. The slice work log records round 2.

### Final verdict

PASS. R1 through R5 are closed. R1 is closed by labelling, with automatic restoration after a
correction left as a follow-up.
