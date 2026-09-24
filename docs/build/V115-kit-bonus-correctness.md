# V115: Kit bonus correctness and known condition immunity

Rules review: required. Depends on: V92, V94, V109, V110, V113.

## Goal

Fix three automated-damage and automated-condition errors found by the second-round rules review
(thread a1576029), all exposed by the V109, V110 and V113 promotions:

1. **Mode choice.** A Melee-and-Ranged weapon ability used at range silently took the melee kit
   bonus. For example, a Panther Two Throats at Once dealt 14 instead of 10 at tier 3.
2. **Field Arsenal.** A two-kit Tactician's signature ignored the bonus replacement. For example,
   Rapid-Fire Two Shot with Sniper's chosen bonus dealt 4/6/8 instead of 2/4/10.
3. **Known immunity.** Automated conditions ignored evaluated condition immunities. For example,
   Net and Stab slowed a Nonstop Orc.

The fixes change the chosen damage and condition results only. Distance, geometry and monster
trait automation are out of scope.

## Scope

- Melee or Ranged (`rule/combat/distance.md`: "you choose whether to use it as a melee or a ranged
  ability").
  - `withMode` drops the unchosen keyword before every keyword-based rule: the kit bonus, build
    modifiers, and the melee-weapon push size bonus.
  - `modeMatters` detects when the kit bonus or a keyword modifier differs between modes.
  - `ability.use` and `ability.select` take `mode=melee|ranged`. When the mode matters, use
    without one is refused.
  - The chosen mode persists on the roll result and in compiled inputs, and corrections reuse it.
  - The table shows a "Use as" selector for Melee-and-Ranged abilities.
  - A compiled push with an unchosen mode needs `actor.mode`.
- Field Arsenal (`feature/tactician/level-1/field-arsenal.md`: a signature loses its kit's printed
  bonus and gains the chosen kit's).
  - `actorRollFacts` derives per-tier deltas (added − printed) from the evaluated
    `kitBonusReplacements`.
  - `kitBonusFor` adds that delta to kit signatures on both the compiled and compatibility paths.
- Known immunity (`feature/trait/orc/nonstop.md`, plus Memonek Nonstop).
  - `conditionFacts` carries evaluated `baseline.conditionImmunities`, and the resolver returns
    `immune`: no instance, toggle or registration, and damage still applies.
  - Corrections keep the immunity because it lives in the saved inputs.
  - A foe's trait text that says the creature "can't be" given a condition makes that condition
    `fact-needed`, never assumed. Example: `monster/elemental/statblock/crux-of-fire.md` Fickle and
    Free.
  - Positional auras such as the Ghost's Phantom Flow stay manual.
- Known limitation (manual):
  - Temporary condition prevention on heroes, such as level-2 Applied Chronometrics ("can't be made
    dazed") and Kinetic Shield ("can't be made bleeding"), is not an evaluated immunity.
  - Positional auras such as the Ghost's Phantom Flow are not evaluated either.
  - An automated condition can still land in these cases, and the table removes it with
    `condition off`.
- Existing proofs updated: the V94 Concussive Strike app test and the Censor headless journey now
  state the melee mode their source ledgers assume.

Spec references:

- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/build/V26-compiled-ability-effects.md#3-persisted-results-and-clients`
- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`

## Acceptance checks

1. `tests/scripts/kit-bonus-correctness.test.ts`:
   - Panther Two Throats at tier 3: melee 14, ranged 10, and no mode is rejected. With no kit, no
     mode is required.
   - Two Shot with the Field Arsenal delta: 4 at tier 2, 10 at tier 3. Printed 8 without a
     replacement.
   - Net and Stab against a Nonstop target: `immune` with damage intact. Printed prevention gives
     `fact-needed`.
2. `tests/app/kit-bonus.test.ts` (convex-test, registered operations):
   - Legal Battle Grace (Martial Artist plus Mountain) and Two Shot (Rapid-Fire plus Sniper) both
     get the -2 tier-2 kit bonus.
   - Concussive Strike: refused without a mode; ranged at a natural 19 adds 4; the persisted
     `selectedMode` holds; a correction keeps ranged.
   - Stunning Blast: Thorn with evaluated slowed immunity gets `immune`, takes 7 damage and has no
     instance or toggle. The Goblin Cursespitter control is slowed. A correction keeps `immune`.
3. TESTER: `CI=true pnpm check`, plus the isolated public API journey
   `SALIENT_HEADLESS_COHORT=kit-bonus` with legal builds and real dice.
   - The Panther Shadow is refused without a mode, then shows ranged and melee damage.
   - The Rapid-Fire + Sniper Tactician's Two Shot deals 2/4/10.
   - Hamstring Shot slows the susceptible control and not the Nonstop Orc, and a correction keeps
     the immunity.
   - Regression cohorts: `censor`, `tier-effects`, `effect-riders`.
4. An independent rules review and the second-round reviewer confirm the fixes.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V115` from the V113 tip `bd6e8e4` in `.worktrees/engine-kit-bonus`,
  with its own `node_modules`.
- Second-round findings accepted:
  - V109/V110 R1 (mode) and R2 (Field Arsenal);
  - V113 R1 (immunity).
- Authoring checks:
  - new scripts test 3/3;
  - new app test 3/3;
  - regression app tests pass: potency-conditions 8/8 (with the explicit melee mode),
    effect-riders, shadow-character, multi-target and tier-effects;
  - engine and web `tsc` clean, eslint clean.

  The full suite and headless journeys are TESTER's.
- TESTER `test-V115-2ad979a-1` FAIL:
  - `pnpm check` exit 1: the A05 syntax assertion expected the old `ability.use` arguments. It is
    updated for `[mode=…]`.
  - `kit-bonus` failed. The unfunded Shadow's use was recorded as blocked for its Insight cost
    before the mode check. The journey now funds the Insight first. Correct behaviour: cost blocking
    precedes the mode prompt.
  - `censor` failed and has been stale since V110. Back Blasphemer!'s push is now a compiled
    instruction, so the journey reads the compiled effects.
  - `tier-effects` and `effect-riders` passed.
  - An ENGINE2 debug file briefly appeared in the submitted worktree during the run. It was not
    part of the run, and it will not happen again.
- Independent review ([audit](audits/V115-rules-review.md)): changes required.
  - R1: the table's "Use as" selector compared raw link keywords, so it never showed. It now
    compares the readable text, and the scenario is logged in the browser backlog.
  - R2: the sheet told Field Arsenal users to adjust damage by hand. It now says the table applies
    the damage replacement; distance benefits stay manual.
  - Nits fixed:
    - test comments and a meaningless refusal check (now Protective Attack, which is Melee only);
    - the misplaced actor-facts doc comment;
    - the refusal message now includes "immune";
    - a pre-V115 mode-dependent compiled result now refuses correction with a rewind message
      instead of throwing.
- Review R1–R2 closed: PASS at `fb3ce1f`. TESTER `test-V115-fb3ce1f-2`:
  - `pnpm check` exit 0 in 206 s (404 engine, 658 app).
  - `kit-bonus`, `tier-effects` and `effect-riders` pass.
  - `censor` still failed on Behold a Shield of Faith!, whose bane is a V109 rider. The journey now
    matches every compiled occurrence's printed clause, which covers V109 riders and V110 pushes. All
    ten remainder patterns are confirmed against the V72 report's clauses.
- TESTER `test-V115-1673c01-3` PASS: `censor` exit 0 in 79 s. The `fb3ce1f` gate (658/658) and the
  kit-bonus, tier-effects and effect-riders passes carry over. Artifacts:
  `/srv/presidium/projects/salient/test-artifacts/V115-1673c01`. Ready for integration.
