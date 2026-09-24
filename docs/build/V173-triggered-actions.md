# V173: Triggered actions (offers on observable triggers)

Rules review: required. Depends on: V172 (stacked on `slice/V172` `3d1e27e4`, itself on V171, V170
and V159, none merged yet).

## Goal

A hero's triggered ability whose trigger is an event the engine already observes, and whose effect
compiles, is offered as a response card on the log entry that set it off. The owning player, or the
Director for them, accepts it through the same `ability.use` machinery (so undo works) or passes it.
Eligibility follows `rule/combat/triggered-action.md`. Any other triggered ability stays a manual
triggered action, used by hand with its per-round allowance tracked. This is item 4 of the
[lasting effects design](../lasting-effects-design.md#8-delivery-plan). Damage-changing responses
(item 5, V174), marks and auras stay out.

## Scope

- **Grammar** (`shared/resolve/triggers.ts`, `shared/resolve/compileAbility.ts`):
  - Hero usages "Triggered" and "Free triggered" are the triggered action types (foe stat blocks
    already print "Triggered action"). This removes the `action-type` diagnostic from every hero
    triggered ability.
  - A Trigger section is read whole. Observed sentences are damage events of the damage writer:
    "The target deals damage to an ally / another creature / a creature", "The target takes
    damage", "A creature deals damage to the target", "The target takes damage from a melee strike",
    "You take damage", "Another creature damages you". Each cites its source.
  - Anything else gives `trigger-unobserved` with the missing fact: a response before the damage
    ("would take damage", V174), movement (no map), an ability roll before its outcome, a strike's
    target, turn boundaries and ability uses (not offered yet), Stamina loss. An observed trigger on
    an ability that doesn't compile otherwise gives `trigger-manual`.
  - Only abilities without a power roll compile as triggered (V157 effect-only reader), with exactly
    one observed Trigger section and a target the offer can name. The definition carries `trigger`;
    `resolveEffectOnly` re-reads it and refuses tampering.
  - New effect-only sentences: "The target takes <type> damage equal to half the triggering damage."
    (`triggered-damage`, rounded down by `rule/general/always-round-down.md`) and "The target makes a
    free strike against the creature who made the triggering strike." (table work). Each needs a
    trigger of that event.
- **Offers** (`convex/lib/triggeredActions.ts`):
  - Combat commit writes `triggerHolders` for the participating heroes' compiled triggered abilities,
    from the documents it already read (journaled with the commit).
  - The damage writer's observation (`convex/lib/watchers.ts` `observeDamage`) is the only event
    source. It reads the encounter's holders with one indexed read, matches each trigger
    (`triggerTargetFor`), checks eligibility, and writes a `triggered-offer` interaction on the
    triggering entry, with a linked `trigger.offered` log line. Both are journaled with the triggering
    operation, so undo of the hit withdraws the card. No hero documents are scanned per damage event;
    the owner's document is read only for a matching holder.
  - Eligibility (`triggerEligibility`, `rule/combat/triggered-action.md`): an ordinary triggered action
    once per round (`actionUses` of the round); a free one doesn't count; dazed (`condition/dazed.md`)
    and surprised (`rule/combat/surprised.md`) block both. Checked when offered and again on accept.
  - The card names the printed distance, "within N squares: the table confirms". Accepting it is the
    confirmation.
  - Accept (`card.respond` / `interactions.respond`) runs the ability's `ability.use` continuation,
    bound to the owning hero. The owning player or the Director may answer (ruling 4). The use
    re-checks the offer (same encounter, same ability and target, eligibility, cost). A refusal
    throws, so the card stays open. The card's resolution is journaled in the use, so undo of the
    acceptance reopens it and releases the allowance.
  - Pass is the existing `card.close`. Windows: the next individual turn start closes every open offer
    (`startTurn`). Committing another ability (`recordUse`) passes the actor's earlier offers, except
    responses to the same trigger. Combat end closes them through the existing closeout.
- **Order.** Nothing resolves by arrival: each response resolves only when someone accepts it. The use
  records `acceptanceOrder` among responses to the same trigger, and another owner's response to that
  trigger stays open. All offers in V173 go to heroes (players' side), so the "then the Director"
  step has no engine case yet. Foe triggered abilities are used by hand.
- **Manual invocation.** Every hero triggered ability can be used by hand with `/ability use`:
  - The allowance now counts it as a triggered action in the recorded, legacy and manual-compilation
    paths.
  - A second ordinary one in a round gives a rule warning. So does a dazed user. The warnings are
    advisory, as the rest of the tracker's are.
  - A compiled triggered ability used by hand leaves "half the triggering damage" to the table.
- **Riposte's melee strike.** The rolled path passes `meleeStrike`: the Strike and Melee keywords, and
  melee mode when the ability is also Ranged. A creature's free strike doesn't say it's melee, so it
  offers no Riposte.
- **History.** A correction whose changed damage a holder's trigger watches is refused ("rewind to the
  use"), as V171 does for watchers.
- **UI**: `web/table/trigger-offers.tsx` lists open offers with Accept and Pass, calling the registered
  operations. The use record shows a "Triggered damage" entry.
- Out of scope: damage-changing responses (Parry, Skin Like Castle Walls, Defensive Roll, Inertial
  Shield and so on: V174), turn-boundary and ability-use triggers, Spend sections on triggered
  abilities, marks and auras.

Spec: `docs/lasting-effects-design.md#4-triggered-actions-and-reactions`,
`docs/table-spec.md#inline-interaction-cards-in-the-game-log`,
`docs/decisions/2026-09-24-automation-rulings.md#4-who-uses-a-triggered-action`.
Rules question: [Q-TRIG-1](../rules-questions-for-user.md#q-trig-1-the-triggering-damage-an-ally-and-offers-outside-combat-v173).

## Acceptance checks

1. `tests/scripts/triggered-actions.test.ts`:
   - Feedback Loop and Riposte compile with their trigger specs.
   - My Life for Yours, Word of Judgment and Hesitation Is Weakness give `trigger-unobserved`; Skin
     Like Castle Walls and No Dying on My Watch give `trigger-manual`.
   - A missing Trigger section and a tampered trigger or usage are refused.
   - Half of 7 is 3, and a use by hand is manual.
   - Matching covers the ally, self, no-dealer, zero-damage and melee-strike cases.
   - Eligibility: an ordinary action already used, then a free one still offered; two competing
     ordinary offers; a prevention blocking both kinds.
2. `tests/app/triggered-actions.test.ts` (convex-test, `transactionLimits: true`, registered
   operations, persisted readback). The Talent is v105-3 and the Troubadour v102-2.
   - The holder is written at commit. Spear Charge (18, tier 3, 5 damage) on Thorn opens the card on
     the hit, with a `trigger.offered` line.
   - A damage-changing correction is refused.
   - The Director accepts for the player: the goblin goes 15 → 13 and the card resolves.
   - Undo restores 15, reopens the card and removes the action use.
   - The player accepts. A second hit in the round offers nothing.
   - Pass closes a card. Dazed refuses an accept and keeps the card open, and a dazed Talent is
     offered nothing.
   - Mind Spike closes two open offers. Thorn's turn start closes an offer that survived the goblin's
     turn end.
   - Used by hand, Feedback Loop is recorded as a triggered action; the second use warns.
   - Riposte and Feedback Loop both answer one hit and resolve in acceptance order 1 and 2.
3. Both reports: `node scripts/report-live-compiled-abilities.ts --check` matches; the V64 audit
   regenerates unchanged.
4. TESTER: `pnpm check` (not run here).
5. Independent review, then QC1.

## Work log

- 2026-09-24: `slice/V173` in `.worktrees/triggered`, stacked on `slice/V172` `3d1e27e4`.
  Implementation commit: `fb9d7c51` (committed on the branch, not pushed).
- Flipped to fully compiled:
  - **Feedback Loop** (`feature/ability/talent/level-1/feedback-loop.md`), offered when any creature
    damages an ally of the Talent. It targets the dealer, for half the damage.
  - **Riposte** (`feature/ability/troubadour/level-1/riposte.md`), offered when the Troubadour or an
    ally takes damage from a melee strike. The target's free strike is table work.
  - The live report goes from 160 to **162** reachable compiled (without a power roll 9 → 11);
    compatibility goes from 1461 to 1459. No foe ability changes. The V64 audit regenerates unchanged.
- The research list, each read in the Compendium. All stay manual:
  - **My Life for Yours** and **Breath of Dawn Remembered**: a turn-start trigger (not offered yet),
    Recovery spending on another creature, and a Spend section.
  - **Prescient Grace**: an enemy's turn start and a turn-order change.
  - **Word of Guidance**, **Turnabout Is Fair Play** and **Again**: they answer an ability roll before
    its outcome, which the engine resolves at once.
  - **Word of Judgment**: "would take damage" (V174).
  - **Furious Change**: Stamina loss, and animal form.
  - **Clever Trick** and **So Gullible**: they change a strike's target.
  - **Hesitation Is Weakness**: another hero's turn end, and turn order.
  - **Too Slow**: an ability-use trigger.
  - **Advanced Tactics**: an observed trigger, but its surges are for "the triggering damage" (a
    revision, V174) and it has a Spend section.
  - **No Dying on My Watch**: movement and a power roll.
  - **Harmonize**: it adds a target to the triggering ability.
- Journeys checked for the flipped names: no `scripts/headless` journey names Feedback Loop or
  Riposte. `tests/scripts/effect-only.test.ts` listed Riposte among manual triggered actions; it now
  lists the remaining four and points here.
- Deviations and choices:
  - Q-TRIG-1 records three labelled interpretations: the triggering damage is taken after immunity,
    "an ally" excludes yourself, and there are no offers outside combat.
  - Passing (`card.close`) is not journaled, as for every card, so undo of a pass doesn't reopen it.
- Review follow-ups (changes required, 2026-09-24):
  1. Q-TRIG-1 now quotes `rule/combat/target.md` (Creature) exactly, and "an ally excludes yourself"
     is labelled an interpretation there and in `shared/resolve/triggers.ts`.
  2. A dead owner (Stamina at or below the negative of the winded value, `rule/health/dying.md`, the
     test `respiteOperations.ts` uses) is neither offered a card nor allowed to accept one. A dying
     owner still is ("you can still act").
  3. Accepting refuses a card whose round is not the current round.
  4. A bleeding owner, including a dying one, gets a warning on the triggered use. It gives
     `condition/bleeding.md`'s 1d6 + level Stamina loss for the table; nothing is applied.
  5. `tests/app/triggered-actions.test.ts` adds:
     - undo of the triggering hit deletes its card;
     - a stale round is refused;
     - a dead owner is offered nothing and can't accept;
     - a dying owner accepts, with the bleeding warning and Stamina unchanged.
     `tests/scripts/triggered-actions.test.ts` adds `dead` to the prevention cases.
  6. Known limits, recorded rather than fixed:
     - Squad strikes (`squadOperations.ts` 958 and 1092) pass no dealer and no `meleeStrike`, so they
       offer no Feedback Loop or Riposte.
     - A creature's free strike doesn't say it's melee.
     - Corrections pass no `meleeStrike`. They are refused whenever a holder's trigger matches the
       changed damage.
     - Other preventions are the table's to check, and the card text says so briefly. These include
       unconscious and a printed "can't use triggered actions until …", as on foes such as the
       Bugbear Sneak.
     - Later optimisation: the damage hot path re-reads the campaign and encounter per damage write;
       the caller could pass the encounter in.
- Next steps:
  - Turn-boundary triggers from the clock's turn start and end (My Life for Yours, Breath of Dawn
    Remembered, Hesitation Is Weakness), once their effects compile.
  - Ability-use triggers from `observeUse`.
  - Optional Spend sections on triggered abilities.
  - V174 revision for damage-changing responses, which reuses these cards.
  - Director-side offers for foe triggered abilities, and the player-then-Director order for them.
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json`: pass.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches. `node
    scripts/audit-ability-grammar.ts`: regenerated, no diff.
  - `vitest run --maxWorkers=2`, all passed:
    - `tests/scripts`: triggered-actions, effect-only, live-compiled-report, watchers,
      compiled-ability, audit-ability-grammar (117 tests).
    - `tests/app/triggered-actions` (4 tests).
    - Related `tests/app` files: 39 files, 167 tests. These include abilities (the pinned
      `ability.use` syntax is unchanged), watchers, interactions, history, combat, closeout,
      party-read-limit, squads, the talent, troubadour, censor, tactician and fury resource files,
      supporting-actions, remaining-ancestries and complication-actions.
  - With the accept-time re-check and card closing disabled, the pass/early-close/expiry app test
    fails.
