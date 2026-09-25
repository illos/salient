# V202: Turn-start and turn-end triggered-action offers

Rules review: required. Depends on: V173, V174, V175, V171, V200 (stacked on `slice/V200`
`473bee03`, not merged yet).

## Goal

A hero's triggered ability whose Trigger is a turn boundary the engine reads whole, and whose effect
compiles, is offered from the clock's turn start or turn end through V173's card: eligibility, the
re-check on accept, the per-round ordinary allowance, free triggered actions, dead owners, stale
rounds, the Director acting for the player, pass, expiry and undo. Anything whose effect doesn't
compile stays a manual triggered action with a precise diagnostic. Foe triggered abilities stay
manual (no Director-side offers yet).

## Scope

- **Grammar** (`shared/resolve/triggers.ts`). New whole Trigger sentences, each citing its source:
  - "The target starts their turn or takes damage." (My Life for Yours, Breath of Dawn Remembered):
    `turn-start` of the target, and `orDamageTaken`, which the damage writer offers as the target's
    `damage-taken`.
  - "An enemy within 10 squares starts their turn." (Prescient Grace): observed, but its effect stays
    manual.
  - "Another hero ends their turn. That hero can't have used this ability to start their turn."
    (Hesitation Is Weakness): `turn-end` of another hero, `notStartedByThis`.
  - Every other turn-boundary sentence stays `trigger-unobserved` with the reason that the clock
    offers only the sentences V202 reads whole. Movement sentences (Halt!, Subtle Relocation) keep
    V173's movement reason.
  - `triggerTargetForTurn` matches a boundary; `triggerTargetFor` answers the damage half of
    `orDamageTaken`. A trigger about another creature's turn (an enemy, another hero) compiles only
    with a Self target, which the card names (`triggerNamesTarget`).
  - Eligibility adds `turnLeft` for a response that takes its user's turn.
- **Effects** (`shared/resolve/effectOnly.ts`, `damageRevision.ts`, `compileAbility.ts`):
  - "You spend a Recovery and the target regains Stamina equal to your recovery value." is table work
    (`recovery`).
  - "You take your turn after the triggering hero." is `turn-order` work and needs another hero's
    turn-end trigger.
  - "The triggering damage" now needs a damage event; a turn boundary has none.
  - Two Spend sections of table work: My Life for Yours (Spend 1 Wrath, `end-effect`) and Breath of
    Dawn Remembered (Spend 1+ Essence, `recovery`). A Spend section needs a revision only when it
    reduces potency.
  - Prescient Grace's `trigger-manual` diagnostic names both missing facts: the card can't name
    "Self or one ally" for an enemy's turn, and its effect needs a turn before one the clock has
    already started.
- **Offers** (`convex/lib/triggeredActions.ts`, `convex/lib/clock.ts`):
  - `dispatchBoundary` calls `offerForBoundary` for `turn-start` and `turn-end`, after the boundary's
    ordinary and save work. A holder made dead or dazed by a watcher or area rider at that boundary is
    judged as it now stands.
  - One indexed `triggerHolders` read per boundary, plus the turn row; an owner's documents are read
    only for a matching holder. No campaign scan.
  - The card sits on the boundary's `clock.boundary` entry with a linked `trigger.offered` line,
    journaled with Take turn or End turn, so undo of that operation withdraws it.
  - `TriggerOffer.boundary` names the turn and its creature; `takesTurn` and `spend` are carried for
    the card and the re-check. Damage offers also carry `spend` now.
  - Windows: the next individual turn start (V173's). A turn-end card stays open through the gap
    after End turn, per the confirmed "Standing action-card/prompt window". A turn-start card also
    closes when the creature whose turn it is commits an ability (the confirmed "Clarified existing
    precedent"). Combat end closes them through the existing closeout.
- **Turn order** (`convex/lib/initiative.ts`, `convex/lib/abilityOperations.ts`, schema):
  - Accepting a `turn-order` response from a turn-end card stores `encounters.turnAfter`.
  - The next Take turn by that creature gives no side-order or group warning, records
    `turns.startedBy`, and clears the allowance. Any other turn start clears it too.
  - "That hero can't have used this ability to start their turn" reads `startedBy`'s source path.
- **UI** (`web/table/trigger-offers.tsx`): "Accept and spend" also for `offer.spend`.
- Out of scope: ability-use triggers, rolls before their outcome, retargeting, movement, foe offers,
  closing V173 damage cards on the damaged creature's play, and automatic Recovery spending.

Spec: `docs/lasting-effects-design.md#4-triggered-actions-and-reactions`,
`docs/table-spec.md#inline-interaction-cards-in-the-game-log`.
Rules question: [Q-TURNTRIG-1](../rules-questions-for-user.md#q-turntrig-1-readings-behind-v202s-turn-boundary-offers).

Compendium read (`en/unified/md`): `feature/ability/censor/level-1/my-life-for-yours.md`,
`censor/level-2/prescient-grace.md`, `censor/level-9/fulfill-your-destiny.md`,
`elementalist/level-1/breath-of-dawn-remembered.md`, `elementalist/level-1/subtle-relocation.md`,
`shadow/level-1/hesitation-is-weakness.md`, `summoner/level-1/halt.md`,
`null/level-9/time-loop.md`, `null/level-9/arrestor-cycle.md`,
`rule/combat/triggered-action.md`, `condition/dazed.md`, `rule/health/dying.md`,
`feature/censor/level-1/wrath.md`. Every hero `trigger:` line naming a turn was checked. Levels 6 and
9 are outside the reachable report, and foe sentences such as "An ally ends their turn." are Director
abilities, used by hand.

## Acceptance checks

1. `tests/scripts/turn-triggers.test.ts`:
   - the three abilities compile with their trigger specs, sections and costs;
   - Prescient Grace gives `trigger-manual` naming both missing facts; Subtle Relocation and Halt!
     give movement `trigger-unobserved`;
   - "the triggering damage" is refused at a turn boundary, "the triggering hero" on a damage
     trigger, and "Self or one ally" on an enemy's turn;
   - matching covers self, ally, foe, the wrong boundary, the damage half, another hero, the owner's
     own turn end and `startedByThis`;
   - eligibility: `turnLeft`; a free response after the ordinary one is used; dazed;
   - Breath of Dawn Remembered's 1+ Essence: 2 spent is 3 → 1, 0 is refused, a tampered trigger is
     manual.
2. `tests/app/turn-trigger-offers.test.ts` (convex-test, `transactionLimits: true`, registered
   operations, persisted readback):
   - My Life for Yours: a dazed Censor gets no card. Thorn's Take turn opens the card on the
     boundary entry. Thorn's Aid Attack closes it, and undo reopens it. Undo of Take turn deletes it.
     The Director accepts with `spend=1`: Wrath 1 → 0, card resolved, a `recovery` rider for Thorn,
     one triggered action in round 1. The Censor's own turn start offers nothing more that round, and
     still gains 2 wrath.
   - Hesitation Is Weakness, two Shadows. Thorn's End turn offers both, and the cards stay open.
     Umbra passes. The player accepts Shade's: Insight 1 → 0, and `turnAfter` is set. Shade's Take
     turn has no rule warning and records `startedBy`. Shade's turn end offers Umbra nothing. Umbra's
     turn end offers Shade nothing (no turn left). In round 2, Thorn's End turn offers both again, and
     `/combat end` closes them.
   - An unanswered turn-end card closes at the goblin's Take turn, and accepting it is refused.
   - The damage half: the goblin's Spear Charge on Thorn offers My Life for Yours on the hit, with its
     Spend.
3. Both reports: `node scripts/report-live-compiled-abilities.ts --check` matches; the V64 audit
   regenerates unchanged.
4. TESTER: `pnpm check` and the censor and elementalist journeys (not run here).
5. Independent review, then QC1.

## Work log

- 2026-09-25: `slice/V202` in `.worktrees/turn-triggers`, stacked on `slice/V200` `473bee03`.
  Implementation commit: `a7d9a7f5` (committed on the branch, not pushed).
- Flipped to fully compiled (effect-only), and the only three:
  - **My Life for Yours** (`feature/ability/censor/level-1/my-life-for-yours.md`): offered at the
    turn start of the Censor or an ally, and when either takes damage. The Recovery and healing, and
    the optional Spend 1 Wrath, are table work.
  - **Breath of Dawn Remembered** (`feature/ability/elementalist/level-1/breath-of-dawn-remembered.md`):
    the same trigger. "The target can spend a Recovery." and the optional Spend 1+ Essence are table
    work.
  - **Hesitation Is Weakness** (`feature/ability/shadow/level-1/hesitation-is-weakness.md`): a free
    triggered action, offered at another hero's turn end while the Shadow has a turn left. It pays
    1 Insight, and the Shadow's next Take turn follows it.
  - The live report goes from 188 to **191** reachable compiled (without a power roll 25 → 28).
    Compatibility goes from 1433 to 1430. No foe ability changes. The V64 audit regenerates
    unchanged. `support.json` also changes the reason text of foe turn-boundary triggers.
- Stayed manual:
  - **Prescient Grace**: its effect needs the target's turn before an enemy turn the clock has already
    started, and "Self or one ally" can't be named for an enemy's turn.
  - **Halt!** and **Subtle Relocation**: movement triggers (no map).
  - Level 6 and 9 turn-boundary abilities (Fulfill Your Destiny, Time Loop, Arrestor Cycle): outside
    the reachable report; their sentences stay `trigger-unobserved`.
  - Ability-use triggers, rolls before their outcome, retargeting, and "would take damage" keep
    V173's reasons.
- Journeys and tests checked for the flipped names (`grep` of `scripts/headless` and `tests`):
  - `scripts/headless/censor.ts` used My Life for Yours by hand and expected `ability.recorded`. It
    now expects `ability.use` for that ability with the target unchanged.
  - `scripts/headless/elementalist.ts`: the same for Breath of Dawn Remembered.
  - `tests/scripts/triggered-actions.test.ts` listed My Life for Yours and Hesitation Is Weakness as
    unobserved. It now lists Word of Judgment and Subtle Relocation.
  - The `tests/scripts/effect-only.test.ts` comment on Prescient Grace is updated.
  - `tests/scripts/live-compiled-report.test.ts`: three names added, effect-only 25 → 28.
  - These only check that the ability is present, and are unchanged: the shadow journeys,
    `scripts/headless/character-scenarios.ts`, `tests/app/shadow-character.test.ts`, the "Breath of
    Dawn Remembered: Additional Recovery" part-ability checks in `elementalist.ts` and
    `tests/character-v104-elementalist.test.ts`, and Prescient Grace in `censor-level-three.ts`.
- Cross-feature probes:
  - V171 watchers and V200 area riders fire in the boundary's ordinary phase, before the offers. A
    holder their damage leaves dead is not offered (`eligibilityFacts` reads the current document).
    Their damage to a target also offers the damage half of My Life for Yours on that damage's entry.
  - V175 Mark cards share the window, and `expireOffersAtTurnStart` runs before the new turn's
    offers.
  - V174: a revision to zero closes a damage-half card, as for any `damage-taken` card. Turn cards are
    keyed to boundary entries, so revisions don't touch them.
  - Corrections: a Censor or Green Elementalist in combat now refuses damage corrections to themself
    or an ally ("rewind to the use"), as V173 does for every matching holder.
  - Undo of Take turn or End turn withdraws the cards. Undo of an accept reopens the card and clears
    `turnAfter`, since both are journaled.
  - Combat end closes the cards and doesn't dispatch a turn end, so it opens none.
  - A dazed owner is offered nothing. A dying owner is offered, with V173's bleeding warning on
    accept. A dead owner is offered nothing.
  - One per round: the ordinary allowance is shared with V173 cards (`actionUses` of the round).
    Hesitation Is Weakness is free.
- Known limits:
  - A dead *target* at its own turn start is still offered, as V173 offers do.
  - A turn-end card whose round has changed is refused. No compiled turn-end response can reach this
    (Q-TURNTRIG-1 point 1).
  - The separate part-abilities "My Life for Yours: Cleanse" and "Breath of Dawn Remembered:
    Additional Recovery" still exist beside the card's Spend. Paying both is the table's error to
    avoid.
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass. `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json`: pass.
  - `node scripts/report-live-compiled-abilities.ts`, then `--check`: matches (191, 28).
    `node scripts/audit-ability-grammar.ts`: regenerated, no diff. `node scripts/check-links.ts`: no
    broken links.
  - `vitest run --maxWorkers=2`, all passed:
    - `tests/scripts` turn-triggers, triggered-actions, effect-only, live-compiled-report,
      damage-reactions, watchers, compiled-ability and audit-ability-grammar, with
      `tests/app` turn-trigger-offers, triggered-actions, damage-reactions, marks, areas, watchers,
      combat and history: 16 files, 208 tests.
    - 43 related `tests/app` files (triggers, reactions, marks, watchers, areas, every heroic-resource
      file, granted-defenses, immunity-weakness, potency-conditions, combat, closeout, history,
      abilities, party-read-limit, effect files, squads, interactions, shadow and elementalist
      characters, tier and compiled effects, next-turn-duration): 199 tests, before the new app file
      was final.
  - `tests/scripts/rules.test.ts` fails in this worktree because `public/rules-data` is not
    generated (`pnpm rules:ingest`). It fails the same way without this change.
  - Mutation check: with `startedByThis` forced false and the affected-creature close removed, two
    of the new app tests fail.
  - Journeys were not run (TESTER).
- Review follow-ups (changes required, 2026-09-25):
  1. **Corrections.** The damage half made every damage correction to a Censor or an ally refused,
     which broke `scripts/headless/multi-target.ts` and `effect-riders.ts` and normal play. The
     correction now passes the damage the hit dealt that creature before and after
     (`correctionTaken`, `convex/lib/abilityOperations.ts` → `resolve.ts` `writeDamage` →
     `watchers.ts` → `assertNoTriggerOnCorrection`). A turn-boundary holder with the damage half and
     no revision refuses only when that changes between none and some (Q-TURNTRIG-1 point 8). Test:
     Spear Charge 4 → 5 on a Censor passes through `/ability correct`; 4 → 6 passes and 4 → 0 is
     refused through the function.
  2. **My Life for Yours applies its Recovery.** The sentence is now a `recovery-transfer`, and the
     use applies it as V175's Mark Recovery benefit does. It is refused at 0 Recoveries (the card
     stays open); otherwise the Censor's Recoveries drop by 1 and the target regains the recovery
     value up to its maximum. The rider outcome is `applied`, with a `recovery` record, and the
     table's "Applied" badge. Breath of Dawn Remembered stays table work (Q-TURNTRIG-1 point 6,
     with V175's reading as the alternative). `scripts/headless/censor.ts` now expects the Recovery
     spent and the healing (the ledger's recovery value). Test: refused at 0, then 2 → 1 Recoveries
     and Thorn 5 → 13.
  3. **Double payment.** The texts are reworded: `shared/evaluate/censorAbilities.ts` (My Life for
     Yours), and the part-abilities "My Life for Yours: Cleanse"
     (`shared/content/classes/censor/abilities.ts`) and "Breath of Dawn Remembered: Additional
     Recovery" (`shared/content/classes/elementalist/abilities.ts`). The card's Spend is the payment,
     and the part is only for a use whose card Spend wasn't paid. A part-ability used in combat now
     gets a rule warning when a compiled ability from the same source file paid its Spend this round
     (`spendPaidOnCard`).
  4. **Two Shadows.** Accepting a turn-taking card closes the other open turn-taking cards of the same
     turn end (journaled), and an accept against a turn another creature holds is refused
     (`assertTurnFree`). Test: Shade's acceptance closes Umbra's card, and Umbra's accept is refused
     with Insight unchanged.
  5. Q-TURNTRIG-1 points 4, 6 and 7 are labelled as interpretations; point 7 has an alternative;
     points 8 and 9 are added.
  6. Checks after the follow-ups: `pnpm -s lint`, `pnpm -s tsc --noEmit` and
     `pnpm -s tsc -p tsconfig.web.json` pass. The report regenerates (191, 28; only My Life for
     Yours's shape changes in `support.json`) and `--check` matches. The audit regenerates with no
     diff. `vitest run --maxWorkers=2` over 42 files (the V202 engine and app files, every
     `tests/app` file with a correction, marks, watchers, combat, history, heroic-resource-censor,
     shadow and elementalist characters, interactions, closeout): 299 tests pass. Mutation check:
     with the damaged-or-not test removed, the correction test fails. Journeys were not run
     (TESTER): `multi-target.ts`, `effect-riders.ts`, `kit-bonus.ts` (corrections on Censor or
     Elementalist targets) and `censor.ts` are the ones to run.
