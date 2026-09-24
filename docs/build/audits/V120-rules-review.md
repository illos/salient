# V120 independent rules and implementation review

Reviewer: V120-REVIEW (independent ENGINE2 review subagent). Date: 2026-09-24.
Reviewed `282827cb104e8d615003644270dca393ce2f6928` against `origin/main` (`a5e6aec`), in
`.worktrees/engine-resources`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `282827c`: CHANGES REQUIRED (R1 and R3 required; R2, R4 and R5 advisory).

## Findings

### R1 (required). Level 4–6 Shadows get the level-1 trigger amount, and it can be counted twice

- **Where.** `shared/resolve/heroicResourceGeneration.ts:79` (`amount: 1`, no level condition), applied
  by `convex/lib/resourceOperations.ts:144`. Levels 4–6 are buildable:
  `shared/content/character-decisions.ts:45` builds definitions for levels 4, 5 and 6 and adds
  `shadowLaterDecisions`. The `shadow-level-six` journey admits such heroes.
- **Evidence.**
  - `feature/shadow/level-4/surge-of-insight.md` says: "The first time each combat round that you deal
    damage incorporating 1 or more surges, you gain 2 insight instead of 1."
  - The profile is keyed only by `baseline.class`. A level-4, 5 or 6 Shadow therefore claims +1.
  - The ledger (`evidence/V120/shadow.md`) notes "Level 4 raises it to 2", but the slice does not
    restrict the profile to levels 1–3 or apply the level-4 amount.
  - The existing manual row `Surge of Insight: Gain Insight`
    (`shared/content/classes/shadow/later-actions.ts:14-21`, surfaced through
    `shared/evaluate/shadowAbilities.ts`) still says "gain 2 Insight INSTEAD OF 1. Confirm
    eligibility and adjust the resource manually, once per round".
- **Failure scenario.** A level-4 Shadow deals damage with a surge in round 2. The table presses
  Claim, and insight rises by 1 instead of 2. Or the table follows the manual row and has the
  Director add 2 with `/adjust heroic-resource`. The Claim button is then still available "once per
  round" and adds 1 more, for a total of 3. Either way the automated gain is not what is written.
- **Fix.**
  - Make the trigger amount depend on the level. Read `baseline.level` (or the granted feature) and
    use 2 at level 4+. Cite `feature/shadow/level-4/surge-of-insight.md` with its quote in the
    profile, so the verbatim-quote test covers it. Alternatively, mark the claim `unavailable` at
    level 4+ and leave it manual.
  - Rewrite the Surge of Insight row's `activationCondition` to point to the Claim control instead
    of a manual adjustment.
  - Add a focused app assertion using a level-4 Shadow witness (the ledger `scripts/headless/shadow-level-six.ts` builds from): the claim
    gives +2, and a second claim in the same round is refused.

### R2 (advisory). The profile has no level ceiling, so higher-level changes will silently be wrong when they land

- **Where.** `shared/resolve/heroicResourceGeneration.ts:64-68` (turn start `1d3` with no level
  condition), and the `GenerationProfile` type, which has no level range.
- **Evidence.**
  - `feature/shadow/level-7/keen-insight.md`: "you gain 1d3 + 1 insight instead of 1d3".
  - `feature/shadow/level-9/gloom-squad.md`: "you can forgo gaining insight to create 1d6 clones".
    That turn-start gain is optional.
  - `feature/shadow/level-10/death-pool.md`: "3 insight instead of 2".
  - Levels 7+ are not buildable today (`getDefinitions` diagnoses unknown levels), so no hero is
    wrong right now.
- **Failure scenario.** Level-7 Shadow content is added. The clock keeps rolling a bare 1d3, and
    nothing fails.
- **Fix.** Give each profile, or each clause, a supported level range. Outside that range, return
  `clock.unsupported` or an `unavailable` reason that names the superseding feature. Alternatively,
  add a test asserting the Shadow profile's maximum level, so whoever adds level-7 content has to
  revisit it.

### R3 (required). Treating a kept Void or a kept session close as "not the end of the encounter" is an unlabelled interpretation

- **Where.**
  - `convex/lib/closeoutOperations.ts:267`: `voidEncounter` restores only in `reset` mode.
  - `convex/sessions.ts:183`: closing a session with `voidMode: 'keep'` calls the same path.
  - `docs/build/V120-heroic-resource-engine.md:59` and `:90` state the behaviour ("Void keep mode
    keeps the pool, as it does Malice") but do not label it as an interpretation.
- **Evidence.**
  - `feature/shadow/level-1/insight.md`: "You lose any remaining insight at the end of the
    encounter." Its next section begins "Although you can't gain insight outside of combat".
  - After a kept Void, the Shadow still has in-combat insight while out of combat.
  - The next `combat.commit` adds Victories on top ("At the start of a combat encounter … you gain
    insight equal to your Victories"). The encounter starts with more than the source grants.
  - AGENTS.md requires that "An interpretation is labelled as one, cites the passage and names the
    alternatives considered." The Malice precedent is a similar reading, not a source.
- **Failure scenario.** The Director closes the session mid-fight with `voidMode: 'keep'`, which is
  what every headless journey's `finally` does. The Shadow keeps 5 insight into FreePlay and into
  the next combat.
- **Fix.**
  - Record this as a labelled interpretation in the slice doc and the ledger. Cite the insight
    passage and name the alternatives:
    - (a) keep, the current behaviour;
    - (b) fire the class encounter-end loss on a kept Void;
    - (c) leave it to the Director with a logged reminder.
  - Recommended: at least (c). In keep mode, append a log note naming each hero whose profiled
    resource was not reset, so the table knows to adjust it.

### R4 (advisory). The `turn` limit invents a per-round pseudo-turn when no turn is active

- **Where.** `shared/resolve/heroicResourceGeneration.ts:103`:
  `turnId: at.turnId ?? \`round-${at.round}\``.
- **Evidence.**
  - Between turns (`activeTurnId` null, for example after `turn.end` before the next `turn.take`),
    every `turn`-limited claim in the round shares the key `round-N`.
  - A claim in one gap therefore blocks a claim in a later gap of the same round.
  - Neither claim belongs to any creature's turn.
  - No enabled trigger uses `turn` yet, so this is latent until V140–V149.
- **Fix.** Refuse `turn`-limited claims with an `unavailable` reason while no turn is active. If a
  class source needs claims between turns, record the reading as a labelled interpretation when that
  trigger is added.

### R5 (advisory). `resource.claim` does not check that the pool matches the profile, but the clock does

- **Where.** `convex/lib/resourceOperations.ts:141-145`, compared with the guard at
  `convex/lib/clock.ts:273`.
- **Evidence.**
  - The clock refuses to write when `pool.name` is not `profile.resource`.
  - The claim adds `trigger.amount` to whatever pool the hero has. The sheet then shows
    `resource: live.heroicResource.name`.
- **Failure scenario.** A legacy or hand-seeded Shadow has a pool named differently. The clock
  logs "resolve manually", but the Claim still adds +1 to the wrong pool.
- **Fix.** Apply the same `pool.name.toLowerCase() !== profile.resource` check in `resourceTriggers`
  (as an `unavailable` reason) and in `resource.claim` (as a refusal).

## Reviewed and accepted

- **Combat-start grant.** Victories are read once, when `combat.commit` dispatches `combat-start`
  ("At the start of a combat encounter … equal to your Victories"). Adjusting Victories later in
  combat correctly does not re-grant.
- **Turn-start gain.**
  - It is 1d3 per actual `turn-start` for that hero, rolled from the campaign stream, with the die on
    the firing entry.
  - Dying heroes still gain, which is correct: `rule/health/dying.md` says "While you are dying, you
    can still act".
  - A warned second turn in a round is still "each of your turns".
- **Encounter-end loss.**
  - It sets the pool to 0 and clears claims at `combat.finish`, through the `combat-end` boundary.
  - It is written after the surge and temporary-Stamina cleanup, and reads the hero fresh.
  - `combat.end` alone moves to closeout, where claims are refused ("Combat has ended.").
  - Void reset restores the precombat snapshot, including the pool and claims.
- **No gain outside combat.**
  - Nothing is registered out of combat.
  - A claim is refused with no committed encounter, in round 0 (roll or choice phase), in closeout,
    and for a hero who is not in `heroParticipantIds`.
- **Heroes and records.**
  - A hero cannot be added after commit: `heroParticipantIds` is written only at commit, and no
    hero admission route exists.
  - A class change is blocked by `combatLocked`.
  - A hero with a null `liveState` is skipped at registration and reported as `clock.unsupported`
    at firing.
- **Permissions.** Claims use the same player model as `condition.on`: `bindActor`
  (`convex/lib/actors.ts:97-98`) refuses a hero the player does not own, and the Director may claim
  for any hero.
- **Idempotency and dice.**
  - `invoke` gives a once-only receipt per issuer and command id.
  - The die's command id `hr_<boundaryEventId>_<registrationId>` is unique per boundary and
    registration, is about 68 characters (within `^[A-Za-z0-9_-]{8,128}$`), and uses a null issuer
    like the saving-throw pattern.
  - Redo writes the recorded values and never rerolls.
- **Undo, redo and rewind.**
  - Clock writes go through the causing operation's journal scope (`turn.take`, `combat.commit`,
    `combat.finish`), so undo or rewind of that unit restores the pool.
  - Players cannot undo their own `turn.take` (the turn-start outer limit); the Director can rewind.
  - Claims are journaled per field. The app test proves that undoing a claim restores the pool and
    the claim.
- **Ordering.** The class steps are registered after the three Malice steps and before
  surprise-expiry. They share no state with those steps. No test pins `enqueueSeq` for a table
  containing a profiled hero.
- **Effect on existing coverage.**
  - Reviewed: `shadow-level-two`, `shadow-level-three`, `shadow-level-six`, `kit-bonus` and
    `multi-target`, plus `tests/app/potency-conditions.test.ts` (Eviscerate).
  - All of them set insight with absolute `/adjust heroic-resource value=N` before each paid use.
    The journeys never take a Shadow turn.
  - Eviscerate adjusts after `turn.take`, and positions the dice after it.
  - The `tests/app` table fixture hero Thorn is a Fury, which has no profile.
  - No exact assertion is invalidated.
- **UI.** The claim appears only on sheets the viewer may read (the Director or the owner). The
  `unavailable` reason replaces the confirmation text and disables the button.
- **Schema.** `heroLiveValidator.resourceClaims` matches `ResourceClaim`. All return validators reuse
  `heroLiveValidator` (`convex/characters.ts:184`, `convex/table.ts:280`).
- **Quotes.** Every profile clause is verbatim from `feature/shadow/level-1/insight.md`, and the pure
  test enforces it.

## Checks run by the reviewer

- `npx tsc --noEmit` on the root, `-p convex` and `-p tsconfig.web.json`: all exit 0, with no output.
- `npx eslint` on the changed source files: exit 0. `npx prettier --check` on the changed files:
  clean.
- `npx vitest run tests/app/heroic-resource.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 4 tests passed.
- No other suites, journeys or services were run.

## Verdict

CHANGES REQUIRED: R1 (the level-4+ trigger amount and the double count with the manual Surge of
Insight row) and R3 (the Void/session-close reading of encounter end is unlabelled). R2, R4 and R5
are advisory.

## R1–R5 closure: `7564aa8`

Verdict: PASS. All five findings are closed. Nothing new at blocking or required severity.

- **R1: closed.**
  - The trigger now has `levelAmounts` with `fromLevel: 4, amount: 2`, citing
    `feature/shadow/level-4/surge-of-insight.md`. Its quote is checked verbatim by the pure test,
    which now includes `levelAmounts`.
  - `triggerAmount` chooses the clause by `baseline.level`. The sheet and `resource.claim` both use
    it, and both the log payload and the UI cite the level-4 source.
  - The manual Surge of Insight row now points to the claim and says not to also adjust by hand. No
    fixture or test pins the old row text (`v108-shadow-six-expected.json` pins only names, cost and
    mode).
  - The app test proves a level-4 claim gives +2.
- **R2: closed.**
  - `verifiedThroughLevel: 6` is cited to `keen-insight.md`.
  - `generationProfile(baseline)` returns undefined outside levels 1 to that ceiling. The same call
    gates registration at commit, firing, the sheet and the claim.
  - The app test proves a level-7 Shadow gets no registrations, no triggers and a refused claim.
  - Level 9 (Gloom Squad) and level 10 (Death Pool) fall under the same ceiling.
- **R3: closed.**
  - Q-RES-1 is in `docs/rules-questions-for-user.md`. It cites the insight passage and names
    alternatives (a) and (b) alongside the current behaviour. The slice doc labels it.
  - `voidEncounter` in keep mode appends one `combat.resource-kept` entry, using the void's scope,
    for each participating hero whose level is within a profile and whose pool is nonzero. This
    covers both `combat.void` and closing the session (`convex/sessions.ts:183`).
  - The app test proves the note appears for the level-4 hero only.
- **R4: closed.** `claimWindow('turn', …)` returns null when no turn is active, and `claimState`
  reports "No turn is active." to the sheet and the operation. The pure test asserts this.
- **R5: closed.** `blocked` now refuses when `heroicResource.name` does not match
  `profile.resource`, in both the sheet and `resource.claim`.

Advisory note (no change needed): the level-4 and level-7 app test patches `derivedBaseline.level`
directly instead of building those levels. That is acceptable because the engine reads only
`baseline.level`, and V108 covers building those levels.

Checks run by the reviewer at `7564aa8`:
- `npx tsc --noEmit` on the root, `-p convex` and `-p tsconfig.web.json`: all exit 0.
- `npx eslint` on the changed files: exit 0.
- `npx vitest run tests/app/heroic-resource.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 6 tests passed.
- No other suites, journeys or services were run.
