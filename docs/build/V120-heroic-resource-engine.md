# V120: Shared heroic-resource generation engine (Shadow first)

Rules review: required. Depends on: V88 (clock producers), V115.
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).

## Goal

Generate heroic resources automatically during combat, the way the common Malice lifecycle already
does. Each class's rules come from its source ledger in [`evidence/V120/`](evidence/V120/). The
engine is shared. Classes are enabled one at a time, each with its own implementation and its own
independent rules review. This slice enables the Shadow; V140–V149 enable the other ten classes.

## Scope

- **Generation profiles.** `shared/resolve/heroicResourceGeneration.ts` maps a class (by the evaluated
  `baseline.class`) to a profile. Each profile has:
  - the resource;
  - the combat-start grant (Victories);
  - the turn-start gain (fixed or dice);
  - the encounter-end rule (lose remaining, or reset to 0);
  - the class's triggered gains, each with a limit (round, turn or encounter);
  - the pinned source path and quote for every clause.

  A class with no profile keeps fully manual generation, and so does a hero above the profile's
  `verifiedThroughLevel`. A trigger's `levelAmounts` apply later features that change its amount. A class with a profile is keyed by class,
  never by resource name, because ferocity and essence each belong to two classes.
- **Clock work.** `combat.commit` registers three pieces of work per hero participant that has a
  profile: the combat-start grant, the turn-start gain on that hero's turn, and the encounter-end
  loss.
  - The work kind is `heroic-resource`.
  - Each firing is its own log entry, with before and after values, the dice rolled and the source.
  - The resource is written through the journal, so undoing the causing operation restores it.
  - Out of combat nothing is registered, which matches "you can't gain … outside of combat".
- **Triggered gains the app cannot observe.** `resource.claim trigger=<id>` records a class trigger
  that the table has confirmed.
  - It applies the sourced amount and enforces the trigger's limit with a journaled claim record on
    the hero's live state.
  - The claim records are cleared at encounter end.
  - `abilities:sheet` lists each enabled trigger with its availability.
  - The ability panel shows a Claim control for each one.

  Later class slices call the same helper from observed events (damage taken, Stamina thresholds,
  natural rolls).
- **Manual editing stays.** `adjust.heroic-resource` is unchanged and remains the correction route.
- **Shadow profile.** Source: `feature/shadow/level-1/insight.md`; ledger:
  [`evidence/V120/shadow.md`](evidence/V120/shadow.md).
  - +Victories at combat start.
  - 1d3 at the start of each of the Shadow's turns.
  - Claim +1 insight for "the first time each combat round that you deal damage incorporating 1 or
    more surges". This is a table claim because surge spending is not recorded. From level 4 the claim
    is +2 (`feature/shadow/level-4/surge-of-insight.md`: "you gain 2 insight instead of 1"). The
    level-4 manual row points at the claim so it isn't added twice.
  - Verified through level 6. `feature/shadow/level-7/keen-insight.md` changes the turn-start gain, so
    a Shadow of level 7 or higher stays manual.
  - Lose all insight at encounter end.
  - The edge discount is a cost rule and is out of scope.

## Out of scope

- Other classes (V140–V149).
- Non-combat "stressful situations tracked in combat rounds". These stay manual until the Director
  has a control for them.
- Heroes admitted after `combat.commit`.
- **Voiding combat (labelled interpretation, [Q-RES-1](../rules-questions-for-user.md)).** The
  encounter-end loss runs on `combat.finish`, as the Malice loss does. A reset-mode void restores the
  pre-combat pool. A keep-mode void keeps the pool and logs `combat.resource-kept` for each
  generating hero with a nonzero pool. The alternatives were to apply the loss on a keep void, or to
  ask the Director.

## Acceptance

- Pure tests:
  - every profile clause cites a pinned file that exists and contains the quoted text;
  - the Shadow profile matches the ledger.
- App tests:
  - commit registers the work for a Shadow and nothing for a hero without a profile;
  - the combat-start grant equals the recorded Victories;
  - `turn.take` gives 1d3, with the die on the log entry;
  - finish sets insight to 0 and clears the claims;
  - a claim applies +1 once per round, and a second claim in the same round is refused;
  - undo restores the resource and the claim.
- Headless journey `heroic-resource`: a Shadow through commit, a turn, a claim and finish, with
  persisted readback.

## Work log

- 2026-09-24: decision recorded. Eleven independent class ledgers were saved to `evidence/V120/`.
- 2026-09-24: implemented.
  - Profiles: `shared/resolve/heroicResourceGeneration.ts`, with the Shadow enabled.
  - Clock work kind `heroic-resource`: `convex/lib/clock.ts`; registered in `combat.commit`.
  - `resource.claim`: `convex/lib/resourceOperations.ts`.
  - `abilities:sheet` gains `resourceTriggers`, and the ability panel gets its Claim control.
  - Tests: `tests/app/heroic-resource.test.ts` and `tests/scripts/heroic-resource-generation.test.ts`.
  - Journey: `SALIENT_HEADLESS_COHORT=heroic-resource`.
  - Trigger ids use hyphens, because the slash parser refuses dots in bare values.
  - Local authoring checks: `tsc` and eslint clean; the focused test files pass (1/1 and 3/3), and
    so does the Shadow Eviscerate file `potency-conditions` (8/8).
  - Void keep mode keeps the pool, as it does Malice. Claims are keyed by encounter, so stale ones
    never block a new combat.
- Independent review ([audit](audits/V120-rules-review.md)): changes required, R1–R5. Fixes:
  - **R1:** the claim amount follows the level (+2 from level 4), and the manual row points at the
    claim.
  - **R2:** `verifiedThroughLevel` was added; the Shadow's is 6.
  - **R3:** Q-RES-1 is labelled, and the keep-void note was added.
  - **R4:** a `turn` limit with no active turn is unavailable.
  - **R5:** a claim checks that the pool matches the profile.

  Tests were added: the level amount, the level ceiling, the turn window and the keep-void note. The
  focused files pass (2/2 and 4/4); `tsc` and eslint are clean.
