# V146 independent rules and implementation review

Reviewer: V146-REVIEW (independent rules and code review subagent). Date: 2026-09-24.
Reviewed `821f57f4e24a71ec577894e2840712dd67cf3f8b` (`slice/V146`) against `origin/main`, in
`.worktrees/resource-talent`. The change is `git diff origin/main...821f57f4`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `821f57f`: CHANGES REQUIRED (R1 required; R2 and R3 advisory).

## Findings

### R1 (required). Automatic strain damage ignores the Talent's own live damage immunity (Steel Ward, Force Orbs)

- **Where.**
  - `convex/lib/clock.ts:305-317`: `damageTargetFacts(record)` then `applyDamage` then `writeDamage`,
    with no table step.
  - `convex/lib/resolve.ts:990-1006`: hero facts carry only the evaluated
    `baseline.damageImmunities`. Live, manually tracked immunities are not included.
  - `shared/content/classes/talent/abilities.ts:37`: the row now says the app applies the damage and
    "Do not also apply them by hand".
  - `docs/build/V146-talent-clarity-generation.md:48-49`: "only an 'all' immunity would reduce it".
- **Evidence.**
  - `feature/talent/level-1/steel-ward.md` (one of the four level-1 wards): "Whenever you take
    damage, after the damage resolves, you gain damage immunity equal to your Reason score until the
    end of your next turn."
  - `rule/damage/damage-immunity.md`: an untyped "damage immunity 5" represents "immunity to all
    damage". So Steel Ward is exactly the "all" immunity that the slice says would reduce strain.
  - Steel Ward is triggered by any damage the Talent takes, including the strain damage itself. It
    is also triggered by any foe hit earlier in the round. So it is usually active when a strained
    Steel Ward Talent ends a turn.
  - The app does not track it. The `Steel Ward: React` row (`abilities.ts:100-106`) is "Resolve the
    stated effects manually", so `applyDamage` never sees it.
  - `feature/ability/talent/level-3/force-orbs.md` has the same problem: "Each orb gives you a
    cumulative damage immunity 1. Each time you take damage, you lose 1 orb." Strain damage should
    be reduced by the orbs, and it should use up an orb. Neither happens, and nothing tells the
    table.
  - Related (not a wrong number): `vanishing-ward.md`, "Whenever you take damage, you become
    invisible". Strain damage triggers it, but the strain log entry does not say so.
- **Failure scenario.** A Steel Ward Talent has Reason 2 (floor −3). A goblin hits them in round 1,
  or they end round 1 at clarity −3 and take 3 strain damage. Either way Steel Ward now gives damage
  immunity 2 until the end of their next turn. They end their round-2 turn at clarity −3. The rules
  give 3 − 2 = 1 damage. The app takes 3 Stamina automatically, and the row tells the table not to
  adjust by hand. This repeats on every strained turn for the whole encounter.
- **Fix (any one, plus the label).**
  - Preferred: for a Talent whose ward selection is Steel Ward, or who has Force Orbs, do not
    auto-apply. Log the computed strain (amount, source, quote) as a table-confirmed step, or apply
    it and add a correction prompt. The prompt should say: "Steel Ward / Force Orbs immunity is not
    tracked; if active, reduce by it (immunity applies last) and restore with
    `/adjust stamina`". Name Vanishing Ward's trigger in the same note.
  - At minimum: add that note to the strain event description, and change the manual row so it does
    not say "Do not also apply them by hand" without that exception.
  - Record in the slice doc that the "all immunity" reading is only as good as the immunities the
    app tracks. Live, manually tracked immunities such as Steel Ward and Force Orbs are not applied.
  - Add an app assertion for the chosen behaviour, using a Steel Ward witness.

### R2 (advisory). Ending combat during the Talent's turn skips that turn's strain damage, and this is not labelled

- **Where.** `convex/lib/closeoutOperations.ts:320-345` (`combat.end` → `stopStructure`, "no final
  turn or round effects are triggered"). `shared/content/classes/talent/abilities.ts:37` says the app
  applies the damage "at the end of each of your turns in combat". The slice doc does not mention
  the case.
- **Evidence.** `clarity-and-strain.md`: "At the end of each of your turns, you take 1 damage for
  each negative point of clarity." Then: "You lose any remaining clarity or reset any negative
  clarity at the end of the encounter." When the Director ends combat mid-turn, the Talent's turn is
  sealed without a `turn-end` boundary. Then `combat.finish` resets clarity to 0. The strain for that
  turn is never applied or prompted. The Compendium does not say whether the interrupted turn "ends"
  for this purpose. The existing no-final-effects policy is a reasonable reading, but for this
  mechanic it is an interpretation and is not labelled as one.
- **Failure scenario.** A strained Talent at clarity −3 kills the last foe with a strained ability.
  The Director presses End combat before the Talent presses End turn. No strain damage is taken, and
  clarity resets. With the opposite click order, the Talent takes 3 damage.
- **Fix.** Label this in the slice doc and the ledger, citing the passage and naming the alternative
  (apply strain for the active turn at `combat.end`). Add a Q-RES entry to
  `docs/rules-questions-for-user.md`. In the row, say that ending combat during your turn applies no
  strain. Or have `combat.end` warn when the active turn belongs to a strained Talent.

### R3 (advisory). The strain log entry doesn't say when strain makes the Talent dying or reach the death threshold

- **Where.** `convex/lib/clock.ts:318-326`. The description ignores `application.dying` and
  `application.deadThresholdReached`. Ability damage does report these
  (`convex/lib/abilityOperations.ts:840`, "; at 0 Stamina or lower (dying not automated)").
- **Evidence.** `rule/health/dying.md`: "While your Stamina is lower than 0, if it reaches the
  negative of your winded value, you die." Strain applies while dying, which is correct because the
  source has no exception. So it is the one automatic damage source that can kill a hero with nobody
  acting.
- **Failure scenario.** A dying Talent has max Stamina 18 (winded 9), Stamina −7 and clarity −2. They
  end their turn, and Stamina becomes −9. The log says only "2 strain damage; Stamina −7 → −9". Unlike
  every other damage entry, it does not say the Talent has reached the death threshold.
- **Fix.** Add the same dying and dead-threshold suffix used for ability damage.

## Reviewed and accepted

- **Levels 1–6 clarity lifecycle.** I read every file in `feature/talent/level-1` to
  `feature/talent/level-6`, and every Talent ability in `feature/ability/talent/level-1,2,3,5,6`.
  Levels 1–6 have these clarity gains and losses:
  - The combat-start +Victories, the turn-start 1d3, the per-round forced-movement +1, the strain,
    and the encounter-end reset, all in `clarity-and-strain.md`.
  - Mind Recovery at level 4: "2 clarity instead of 1", plus the out-of-scope option to forgo a
    Recovery's Stamina for 3 clarity.
  - The ability riders Entropic Bolt, Perfect Clarity and Fling Through Time.

  Nothing at levels 2, 3, 5 or 6 changes the combat-start, turn-start, strain or reset clauses.
  Speed of Thought, Triangulate and the Psi Boosts only spend clarity. The profile is verbatim; the
  pure quote test covers `turnEndStrain` and `levelAmounts`.
- **Level ceiling.** `feature/talent/level-7/lucid-mind.md`: "you gain 1d3 + 1 clarity instead of
  1d3". So `verifiedThroughLevel: 6` is right. `generationProfile` gates commit registration,
  firing and claims alike.
- **Mind Recovery amount.** `triggerAmount(trigger, 4)` gives 2, citing
  `feature/talent/level-4/mind-recovery.md` verbatim.
- **Forced-movement claim.** The limit is `round`, keyed by encounter round: "the first time each
  combat round that a creature is force moved". Any creature, moved by anyone, is correct, because
  the source does not restrict who. Claims are refused outside combat, in closeout and before round
  1 ("you can't gain clarity outside of combat").
- **Reset versus lose.** `encounterEnd.kind: 'reset'` sets any value to 0, negative included. That
  matches "lose any remaining clarity or reset any negative clarity".
- **Strain timing.** The step is registered at commit as `creature-turn` / `turn-end` / `each` for
  the hero's own id. It fires on every `turn.end` of that hero, including while dying, since the
  source has no exception.
- **Strain amount.** The step reads `pool.current` when the turn ends, so clarity that went negative
  during the turn is covered. It does nothing at 0 or above.
- **Out of combat.** `turn-end` boundaries exist only in a committed encounter, so the step cannot
  fire outside combat.
- **Temporary Stamina.** Strain goes through `applyDamage`, so temporary Stamina is used first
  (`rule/health/temporary-stamina.md`), and the app test proves it.
- **Immunity.** Untyped strain damage is matched only by `all-damage` entries, which follows
  `damage-immunity.md`. R1 covers the untracked live immunities.
- **Squads and captains.** `turnRef.participantIds` holds squad foe ids, or only the acting
  creature's id. A character id cannot match a foe turn.
- **Dispatch order.** Strain is registered at commit, so it fires before any EoT expiry registered
  later in play. Saves always fire last. No tracked effect changes strain damage, so the order does
  not change any result today.
- **Undo.** `writeDamage` journals `stamina` and `temporaryStamina` with `journalPatch` under
  `firing.scope`, which is the `turn.end` event's scope. Undoing `turn.end` therefore restores both.
  This is the same mechanism as V120's accepted turn-start gain. I checked this by reading the code;
  no test undoes strain.
- **Import graph.** `clock.ts` importing `./resolve` adds no cycle. `resolve.ts`'s runtime imports
  (`./journal`, `./squads`, `./characterBuild`, `./compiledSource`, and so on) never reach
  `./clock`. The only cycle involving `clock.ts` is the existing `clock` ↔ `conditionInstances` one,
  which uses its imports only inside function bodies. `tsc -p convex` is clean.
- **Scope boundary.** Entropic Bolt's strain rider, Perfect Clarity and Fling Through Time are
  ability effects, so leaving them manual is sound.
  - The level-1 rows still tell the table what to do: `abilities.ts:189-192` for Perfect Clarity,
    and `:208` for Entropic Bolt's strain rider ("Gain 1 Clarity on a tier 2 or 3 parent roll").
  - Fling Through Time is level 3 and has no Talent row yet, because Talent content is level 1 only.
  - None of these overlaps an automated gain, so nothing is counted twice.
- **Existing coverage.**
  - `scripts/headless/talent.ts` runs `combat.commit` but never takes a turn. The new combat-start
    grant can change clarity, but the script sets clarity explicitly before every use and compares
    live state `withoutResource`, so no assertion changes meaning.
  - `tests/character-v105-talent.test.ts` and `v105-talent-expected.json` pin row names only, not
    `activationCondition`.
  - No other app test puts a Talent in combat.
- **Other labelling.** The slice doc labels untyped strain damage as the literal reading and names
  the alternative (irreducible). It also lists forced-movement edge cases and dying turn starts as
  out of scope. R2 is the unlabelled case.

## Checks run by the reviewer

- `npx tsc --noEmit`: exit 0. `npx tsc --noEmit -p convex/tsconfig.json`: exit 0.
- `npx eslint` on the nine changed TypeScript files: exit 0.
- `npx vitest run tests/app/heroic-resource-talent.test.ts tests/scripts/heroic-resource-generation.test.ts tests/character-v105-talent.test.ts`:
  3 files, 8 tests passed.
- No other suites, journeys or services were run.

## Verdict

CHANGES REQUIRED. R1 must be closed: automatic strain damage is wrong for a Steel Ward Talent (a
level-1 option) on most strained turns, and nothing tells the table. R2 and R3 are advisory. The
rest of the profile, the engine step and its registration are correct against the Compendium.

## R1–R3 closure: `e76e2c4`

Verdict: PASS. All three findings are closed, and nothing new is at required severity.

- **R1: closed.**
  - `turnEndStrain.heldBy` lists Steel Ward (`feature/talent/level-1/steel-ward.md`) and Force Orbs
    (`feature/ability/talent/level-3/force-orbs.md`). `notedBy` lists Vanishing Ward.
  - `convex/lib/clock.ts` matches these against the baseline's feature and ability names, exactly
    or as a `Name:` prefix. For a held hero it returns before any write. The log entry gives the due
    amount and the ward, and says to apply the remainder with `/adjust stamina`. A noted ward is
    named in the applied log.
  - Holding even when a Force Orbs Talent has no orbs left, or when Steel Ward has not been set off
    yet, is conservative: the table applies the full amount by hand. It is never wrong.
  - The new app test uses the v105-3 fixture (Steel Ward): Stamina is unchanged and the payload
    carries `damage: 2, held: 'Steel Ward'`. It uses the v105-4 fixture (Vanishing Ward): 2 damage
    is applied and the ward is named. The fixture confirms v105-3 has Steel Ward and v105-4 has
    Vanishing Ward.
  - Advisory, not blocking: the manual row (`shared/content/classes/talent/abilities.ts:37`) still
    says "Do not also apply them by hand" with no ward exception. The held log entry tells the table
    what to do at the moment it matters. The row could add "except when the log holds it for Steel
    Ward or Force Orbs".
- **R2: closed.** Q-RES-8 in `docs/rules-questions-for-user.md` quotes the source, states the
  current behaviour as a labelled interpretation, and names the alternative (apply strain at
  `combat.end`). The slice doc references it.
- **R3: closed.** The applied strain log now ends with "; reaches the death threshold" or "; dying",
  taken from `application.deadThresholdReached` and `application.dying`.

Check run by the reviewer at `e76e2c4` (the host is loaded, so only this one was run):
- `npx vitest run tests/app/heroic-resource-talent.test.ts`: 1 file, 2 tests passed.
- Typecheck and eslint were not rerun at `e76e2c4`.
