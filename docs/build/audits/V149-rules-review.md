# V149 independent rules and implementation review

Reviewer: V149-REVIEW (independent ENGINE2 review subagent). Date: 2026-09-24.
Reviewed `1228a8d62ff4087f8c09ad944c8fd158b8a04db9` on `slice/V149`, change `git diff slice/V147..1228a8d6`,
in `.worktrees/resource-troubadour`. V147, V144, V142 and V120 were reviewed separately.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `1228a8d`: CHANGES REQUIRED (R1 required; R2, R3 and R4 advisory).

## Findings

### R1 (required). A Troubadour still dead from an earlier encounter gains drama automatically

- **Where.**
  - `convex/lib/combatOperations.ts:477` registers the combat-start grant, turn-start gain and
    encounter-end loss for every participating hero with a profile. There is no check on whether the
    hero is dead.
  - `convex/lib/clock.ts:268` (`fireHeroicResource`) applies them with no such check either.
  - `convex/lib/resourceTriggers.ts:38` (`blocked`) gates the new any-hero observers and the claims.
    It does not check it.
- **Evidence.**
  - `feature/troubadour/level-1/drama.md`: "If you are still dead after the encounter in which you
    died, you can't gain drama during future encounters."
  - This rule is unambiguous, and the app can observe it. A hero whose Stamina is at or below the
    negative of their winded value when a new encounter is committed is dead (`rule/health/dying.md`).
    That hero is necessarily still dead after the encounter in which they died.
  - The slice lists it under "Out of scope" (`docs/build/V149-troubadour-drama-generation.md:45`).
    However, the V149 profile now automates every gain it forbids:
    - the Victories grant;
    - 1d3 at each turn start;
    - +2 or +10 from other heroes' damage.

    Q-RES-12, the profile, the sheet and the log say nothing about it. The out-of-scope item is
    therefore not a manual boundary. The app does the opposite of the rule without telling anyone.
- **Failure scenario.**
  1. The Troubadour dies in encounter 1 and is not brought back.
  2. The Director starts encounter 2 with the same party, and the dead Troubadour is a hero
     participant.
  3. At commit, the dead Troubadour gains drama equal to their Victories.
  4. Each of their turn starts adds 1d3. The first time another hero is winded, they gain +2.
  5. At 30 drama the table sees "Drama: Return to Life" as affordable, even though the rule forbids
     any of these gains.
- **Fix.** In `blocked`, and in `fireHeroicResource` for the Troubadour's `combat-start-grant` and
  `turn-start-gain`, refuse gains while the hero was already dead when this encounter was committed.
  Either of these can supply that fact:
  - the encounter-start snapshot's Stamina;
  - a flag recorded at commit.

  Log it as `clock.unsupported` with the quote. As a minimum alternative, keep generation manual
  for a hero who is dead at commit. Do not rely only on the slice doc's out-of-scope line. Add an app
  assertion: a Troubadour at −winded Stamina at commit gets no combat-start grant and no observed +2.

### R2 (advisory). The trigger list shows an `each` trigger as "once per each"

- **Where.** `web/table/targeting.tsx:374`:
  `{trigger.limit === 'encounter' ? 'per encounter' : `per ${trigger.limit}`}`. This code predates
  V149. V149 adds the `each` value, which it does not handle.
- **Evidence.** For `troubadour-natural-roll` and `troubadour-hero-dies`, the sheet renders
  "+3 drama, once per each" and "+10 drama, once per each (automatic when recorded)". The source says
  "Whenever …" and "When you or another hero dies". Neither is limited.
- **Failure scenario.** The Troubadour's player reads "once per each" as some unstated limit. After
  the first natural 20 they stop claiming, so drama is under-counted. The server-side text in
  `LIMIT_TEXT` ("for this occurrence") is fine. Only the UI string is wrong.
- **Fix.** Render `each` as "each time", for example with a small map shared with `LIMIT_TEXT`.

### R3 (advisory). Correction chains can double-count an any-hero death, and nothing tells the table

- **Where.** `convex/lib/resourceTriggers.ts:247-272`. The observer stores the gain on the observer
  with `useEventId` `${useEventId}:${characterId}`. `reconcileObservedGains` (same file, from
  line 285) looks only at the damaged hero's own claims and only at `damage-taken` and
  `winded-or-dying`. The correction path is `convex/lib/abilityOperations.ts:2051-2076`.
- **Evidence.** The slice states that there is no reconciliation for gains observed from another
  hero's damage ("The table adjusts"). The suffix does keep these gains away from the damaged hero's
  reconciler, which is correct. But corrections write damage relative to the current Stamina. So the
  sequence kill, correct to survive, correct back to kill crosses the death threshold twice. With the
  `each` limit, each crossing grants +10. Nothing in the correction event says that the Troubadour's
  earlier gain stands.
- **Failure scenario.**
  1. A goblin's strike takes Thorn to −winded, and the Troubadour gains +10.
  2. The Director corrects the edges, and Thorn survives. The +10 stays.
  3. The Director corrects again, and Thorn is dead. The Troubadour gains another +10.

  That is 20 drama for one death ("When you or another hero dies, you gain 10 drama"), and the log
  gives no prompt to fix it.
- **Fix.** Either of these:
  - When a correction's damage write is observed, append a note to the correction event naming any
    any-hero gains that were linked to the original use and still stand.
  - Or reverse `any-hero-dies` and `any-hero-winded` gains whose `useEventId` starts with the
    corrected use's ID when the corrected pools no longer satisfy them.

### R4 (advisory). The winded-crossing readings the ledger flagged are not labelled

- **Where.** `convex/lib/resourceTriggers.ts:244-248`, and Q-RES-12 in
  `docs/rules-questions-for-user.md`.
- **Evidence.** The ledger (`docs/build/evidence/V120/troubadour.md` §6) lists these ambiguities:
  - A3: a hero already winded when the encounter starts does not count; "made winded" is read as a
    crossing.
  - A4: one hit from above winded straight to dead counts as both winded (+2) and death (+10).

  The code implements both readings. They are defensible: `winded.md` says "equal to or less than",
  and the Fury's analogous "become" is labelled in Q-RES-2. But neither Q-RES-12, the slice doc nor
  the code comment labels them as interpretations or names the alternatives. AGENTS.md requires
  that label.
- **Failure scenario.** Thorn starts encounter 2 already winded. No drama is gained. A table that
  reads "the first time any hero is made winded" as "any hero is winded" expects +2 at the start and
  has no documented ruling to check against.
- **Fix.** Add both readings to Q-RES-12 as labelled current behaviour, with the alternatives: count
  a hero who starts the encounter winded; or grant only +10, not +2, for a single hit that kills.

## Reviewed and accepted

- **Compendium coverage.**
  - I read `feature/troubadour/level-1/drama.md` and `level-2/appeal-to-the-muses.md` in full.
  - I searched every file under `feature/troubadour/level-{1,2,3}` and
    `feature/ability/troubadour/level-{1,2,3}` for drama gains. Apart from Drama and Appeal, they
    only spend drama or waive a cost.
  - `level-4/melodrama.md` adds new drama events (natural 2, Malice damage, falls, 3 surges, last
    Recovery) and a +1 option. So `verifiedThroughLevel: 3` is correct, and `generationProfile`
    returns nothing at level 4 and above. The content row's "Level 4+: resolve resources and Malice
    manually" matches.
- **Profile amounts.** All match `drama.md`:
  - the Victories grant;
  - 1d3 at each turn start;
  - losing all drama at encounter end;
  - +2 three-heroes;
  - +2 winded;
  - +3 for a natural 19 or 20;
  - +10 for a death.

  The quotes are verbatim.
- **Appeal.**
  - `prayerFor` gates it at level 2 or higher. `/resource pray` refuses below level 2, and the sheet
    hides it.
  - It is declared before the roll (`prayNext`) and consumed at the turn-start firing.
  - On a 1: +1 drama, plus a separate 1d3 roll (key `hra_…`, different from the gain's `hr_…` and
    the Conduit's `hrp_…`) added to `campaigns.malice`. That is the same pool `fireMalice` uses. The
    write goes through `journalPatch` in the firing scope, so it is undone with the operation.
  - On a 2: +1 Malice, and the Heroic Resource is left to the table.
  - On a 3: no Malice, and the Heroic Resource is left to the table.
  - The app test proves the roll of 1 (drama 2, Malice +2).
- **Conduit.** Its prayer now goes through `prayerFor` with no `fromLevel`, so the behaviour is
  unchanged. `kind: 'conduit'` keeps the V147 branch. Only the UI labels change ("Pray",
  "Cancel: Pray"). No test or journey asserts the old labels.
- **Winded and death detection.**
  - Winded is a crossing on Stamina only, so temporary Stamina does not count (`winded.md`).
  - Death is `before > −winded ≥ after` (`dying.md`: "if it reaches the negative of your winded
    value"). A hero already dead who takes more damage does not re-trigger.
  - A revived hero who dies again counts again. That matches "When you or another hero dies".
  - "Any hero" includes the Troubadour. `damageSatisfies` returns false for the any-hero observers,
    so the Troubadour's own damage is not counted twice.
  - Winded is once per encounter through the `encounter` window, and death uses `each`. In an area
    hit that kills two heroes, each death applies.
- **`each` limit.** `claimWindow('each')` returns `{}`, and `claimState` skips the taken check.
  Claims are cleared at encounter end. Claiming a natural 19 or 20 by table confirmation, once per
  click, is acceptable. The rule is "Whenever", line of effect is positional, and every claim is a
  journaled, undoable command with a unique `commandId` dice key.
- **Three heroes.** It is a claim, once per encounter, labelled in Q-RES-12 and in the confirmation
  text. Counting free strikes and triggered actions is supported by `free-strike.md` ("the … Free
  Strike ability").
- **Dead Troubadour within the encounter of death.** The gains continue. This is labelled in
  Q-RES-12, and it matches "you continue to gain drama during combat as long as your body is intact".
  Body integrity and the return at 30 drama stay manual.
- **Engine.**
  - The observer loop iterates `encounter.heroParticipantIds`.
  - `applyObserved` enforces participation, round 1 or later, and a matching pool.
  - The gains are written in the damage operation's scope, so undo and redo restore them with the
    damage.
  - Observed triggers have no dice, so the `hrt_` key is unaffected.
- **Content and journeys.**
  - The Appeal row now points to `/resource pray`. No other Troubadour row tells the table to add
    drama by hand.
  - `scripts/headless/troubadour.ts` and `troubadour-level-three.ts` only commit combat, so the
    round stays at 0 and `blocked` keeps the new observers inert. Their `heroicResource.current === 0`
    assertions still hold.
  - `tests/character-v132-troubadour-three.test.ts` references the Appeal row only by name.
  - The Fury witness Thorn is affected only when a Troubadour participates.

## Checks run by the reviewer at `1228a8d`

- `npx tsc --noEmit` on the root, `-p convex/tsconfig.json` and `-p tsconfig.web.json`: all clean.
- `npx eslint` on the nine changed code and test files: exit 0.
- `npx vitest run tests/app/heroic-resource-troubadour.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 9 tests passed (one run).
- No other suites, journeys or services were run.

## Verdict

CHANGES REQUIRED. R1 must be fixed or turned into an explicit, surfaced manual boundary. R2–R4 are
advisory.

## R1–R4 closure: `de1799c`

Verdict: PASS. All four findings are closed. Nothing new at required severity.

- **R1: closed.**
  - The profile carries `deadStaysSilent`, which quotes `drama.md` verbatim.
  - When `combat.commit` runs, the registration loop (`convex/lib/combatOperations.ts:483-494`)
    skips any hero at Stamina ≤ −winded (`rule/health/dying.md`). That hero gets no combat-start,
    turn-start or encounter-end registrations. Instead, `generationSuspended: <encounterId>` is
    journaled on the hero, so undoing the commit clears it.
  - `blocked()` (`convex/lib/resourceTriggers.ts:50`) refuses claims and any-hero observers for that
    encounter, and gives the reason. The sheet shows the same reason.
  - The flag is keyed to the encounter, so it has no effect on later encounters.
  - The app test does the following:
    1. It kills the Bard and finishes the encounter.
    2. It gives the Bard 2 Victories and commits a new encounter.
    3. It asserts that drama stays 0 and that the Bard has no active registrations. Without the fix,
       the 2-Victories grant would have fired.
    4. It asserts that a claim is refused with /still dead/, and that Thorn's recorded death adds
       nothing.
  - Advisory: if a hero who was suspended at commit is revived by other means, for example a Scroll
    of Resurrection, they stay suspended for the rest of that encounter. The rule does not settle
    this. The suspension is explicit and conservative, and the table can use `/adjust` for any gain.
- **R2: closed.** `web/table/targeting.tsx:373-379` shows unlimited triggers as "each time".
- **R3 and R4: closed as labelled.** Q-RES-12 now lists these as current behaviour:
  - a hero who is already winded when the encounter starts does not count;
  - a single hit that takes a hero from above winded to dead gives both +2 and +10;
  - a Troubadour still dead when a later encounter starts gains nothing in it;
  - a chain of corrections can pay +10 twice, and the table adjusts.

  The alternatives are named. The slice doc no longer lists the still-dead case as out of scope.

Checks run by the reviewer at `de1799c`:
- `npx vitest run tests/app/heroic-resource-troubadour.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 9 tests passed (one run).
- No other suites, journeys or services were run.
