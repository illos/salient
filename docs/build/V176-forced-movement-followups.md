# V176: Forced-movement follow-ups

Rules review: required. Depends on: V152, V159 (merged in train 17).

## Goal

Compile the level 1–3 hero abilities whose only remaining blocker is a follow-up to forced
movement. The engine has no map and can't know what moved. A forced-movement instruction is only an
allowance and proves nothing moved
([automation rulings](../decisions/2026-09-24-automation-rulings.md), ruling 2;
[design section 3](../lasting-effects-design.md#3-watchers)). So a follow-up compiles only when it
depends on the allowance itself (its distance, stability, its order) or is table work that changes
no number the engine computes
([coverage decision](../decisions/2026-09-24-compiled-effect-coverage.md#what-compiled-means)).
Follow-ups that depend on the outcome of the movement stay manual. No table-confirmed movement-fact
operation is built: of the nine candidates, only Impart Force would clearly flip with one (see the
work log), and it has other blockers.

## Scope

- `shared/resolve/effectRiders.ts`: five whole-sentence sections, each citing its pinned source. A
  new optional `forcedMovement` rule on riders:
  - `stability-replaced` (Machinations of Sound): the tier's forced movement ignores stability and is
    reduced by the target's Intuition. It is executed in each target's push allowance, since the
    allowance is a number the engine computes; it is not listed again as table work.
  - `same-distance` (Call the Thunder Down): a table rider that reads the tier push allowances. With
    one distance it shows it; with several it asks the user to pick (Q-FM-2 item 1).
  - `teleport-first` (Phase Inversion Strike): a table teleport rider. The push outcome keeps its
    calculated distance but gives no allowance; no operation confirms the teleport yet, so the push
    stays table work (Q-FM-2 item 4).
- `shared/resolve/compileAbility.ts`: `riderAdmitted`. A V176 rule needs exactly one forced movement
  in each tier. A `stability-replaced` rule is per target, so it is admitted on area envelopes.
- `shared/resolve/compiledOutcome.ts`: push outcome fields `stabilityReduction: 'ignored'`,
  `reduction` and `precondition`; rider `distances`; re-read validation of the rule.
- `web/table/targeting.tsx`: shows the reduction, "Ignores stability" and the same distance. No new
  control: the existing `ability.use`, `ability.correct` and `ability.resolved` operations carry it.
- Regenerated V72 support report and V26 audit.

Compendium (pinned `en/unified/md`): `movement/forced-movement.md` (push/pull/slide, "Multitarget
Abilities and Forced Movement", "Big Versus Little", "Slamming into Creatures");
`rule/character/stability.md`; `rule/dice/ability-roll.md` ("Abilities With Damage and Effects");
`movement/teleport.md`; `condition/restrained.md`.

| Ability | Source | Section | Dependency | Rule |
| --- | --- | --- | --- | --- |
| Sentenced | `feature/ability/censor/level-2/sentenced.md` | forced-movement rider | after-effects | — |
| Call the Thunder Down | `feature/ability/conduit/level-1/call-the-thunder-down.md` | forced-movement rider | after-effects | same-distance |
| Thunder Roar | `feature/ability/fury/level-1/thunder-roar.md` | forced-movement rider (use) | independent | — |
| Phase Inversion Strike | `feature/ability/null/level-1/phase-inversion-strike.md` | teleport rider | independent | teleport-first |
| Machinations of Sound | `feature/ability/shadow/level-2/machinations-of-sound.md` | executed in the slide allowance | independent | stability-replaced (I) |

Out of scope, kept manual (reasons in the work log): Out of the Way!, Special Delivery, Impart
Force, Repel.

Spec references:

- `docs/lasting-effects-design.md#3-watchers`
- `docs/decisions/2026-09-24-compiled-effect-coverage.md#what-compiled-means`

## Acceptance checks

1. `tests/scripts/forced-movement-followups.test.ts` (pure, source-derived):
   - Each of the five compiles with one whole-source section of the shape, dependency and rule
     above. The four kept manual stay manual.
   - Machinations of Sound, tier 2 "Slide 5": Intuition 1 gives allowance 4 and Intuition 6 gives 0.
     Stability 3 is ignored. Negative Intuition stays manual (Q-FM-1), and unknown Intuition is
     fact-needed. There is no table rider.
   - Call the Thunder Down: equal tiers show distance 2. An edge on one target (tiers 3 and 2) asks
     "2 or 3" (Q-FM-2).
   - Phase Inversion Strike: tier 2 push 4 has no allowance until the teleport, and cites the rider.
   - Sentenced waits for its restrained outcome. Thunder Roar's rider occurs once per area use.
   - Admission is whole-sentence, and a tampered stored rule is refused.
2. `tests/app/forced-movement-followups.test.ts` (convex-test, `transactionLimits: true`): the
   v100-creation Conduit uses Call the Thunder Down on two goblins through `ability.use`. The test
   reads back the pushes 3 and 2 and the asking rider, then the ledger damage. `ability.correct`
   then gives both tier 2, and the readback has distance 2.
3. Updated for the flips: `tests/app/abilities.test.ts` (A05 Thunder Roar acceptance now reads the
   compiled pushes and rider), `tests/app/compiled-source.test.ts`,
   `tests/scripts/compiled-ability.test.ts`, `tests/scripts/effect-riders.test.ts`,
   `tests/scripts/audit-ability-grammar.test.ts`, and `tests/scripts/live-compiled-report.test.ts`
   (names the five).
4. Journeys, for TESTER:
   - `scripts/v72-headless.ts` TR1: Thunder Roar is compiled; the first push subtotal is 7 (tier 3
     push 6 + Big Versus Little).
   - `scripts/headless/shadow-level-two.ts`: Machinations reads the compiled slide. Its target
     witness v97-shadow-1-2 has Intuition −1, so the slide is manual with Q-FM-1.
   - Checked and unchanged, since their manual-remainder patterns still match the compiled clauses:
     `censor-level-three.ts` (Sentenced, /restrained/), `conduit.ts` (Call the Thunder Down, /push/),
     `null.ts` (Phase Inversion Strike, /teleport/) and `fury.ts` (Thunder Roar, /push/).
   - TESTER: `CI=true pnpm check`, then the V72 headless journey and the shadow, censor, conduit,
     null and fury cohorts.
5. An independent rules and implementation review, then QC1.

## Work log

- 2026-09-25: cut `slice/V176` from main `e87a4f94` in `.worktrees/forced-followups`.
- Candidates (research pass), with their unresolved clauses from `docs/build/evidence/V72/support.json`:
  - **Flipped (5):** Sentenced, Call the Thunder Down, Thunder Roar, Phase Inversion Strike and
    Machinations of Sound. V152 had excluded Call the Thunder Down ("the same distance" reads each
    target's tier push) and Thunder Roar (ordering on an area). V176 answers the first by reading
    the push outcomes and asking when they differ. For the second, ordering and collisions are
    table work for every push.
  - **Out of the Way! (manual):** "If you take damage from an opportunity attack by moving this way,
    the target takes the same damage." This is damage from this use, conditional on your own
    unobservable movement and another creature's opportunity attack. A movement fact would not
    provide the OA damage.
  - **Special Delivery (manual):** the target is "One willing ally" (outside the target envelopes),
    there is no power roll, and "the target can make a free strike that deals extra damage equal to
    your Might score" changes the damage of another use.
  - **Impart Force (manual):** "for each square you push the target, they take 1 psychic damage"
    needs the squares actually pushed, which is a movement fact. "You gain an edge on this ability"
    and "An object you target must be your size or smaller" are further unadmitted clauses. It is
    the only candidate a movement-fact operation would clearly serve, so none was built.
  - **Repel (manual):** triggered by "is force moved" (unobserved), and it reduces "the distance of
    the triggering forced movement". That needs a force-move event that doesn't exist.
- Reports regenerated. Reachable compiled goes from 171 to 176 (without a power roll: 20, unchanged);
  unchanged reachable compatibility goes from 1450 to 1445. No foe or kit entry changed. V26 audit:
  hero standalone COMPILES 34 → 37. Thunder Roar's V26 expectation is updated to COMPILES, with a
  V176 note.
- Interactions checked:
  - No new damage write, so there are no new watcher, triggered-offer, revision or Mark firings.
  - Thunder Roar now takes the compiled path, so its damage reaches the same compiled damage writer
    as other compiled abilities.
  - A correction re-derives section riders (not lasting ones) with the correction revision, so
    `distances` follows the corrected tiers (app test 2).
  - The Machinations reduction reads the saved target characteristics, so a correction recomputes
    it from the same inputs.
- Authoring checks (all run in the worktree): `pnpm -s lint` clean; `pnpm -s tsc --noEmit` and
  `pnpm -s tsc -p tsconfig.web.json` clean; `node scripts/report-live-compiled-abilities.ts
  --check` fresh. Focused vitest with `--maxWorkers=2` over 13 files passed 214 tests:
  - the two new V176 files;
  - effect-riders, compiled-ability, audit-ability-grammar and live-compiled-report;
  - the app files abilities, compiled-source, squads, v001-walkthrough, a05-review-regressions,
    effect-riders and compiled-effects.
- Journeys were not run (TESTER). Open questions: Q-FM-1 and Q-FM-2 in
  `docs/rules-questions-for-user.md`.
