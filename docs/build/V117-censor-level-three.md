# V117: Censor levels two and three

Rules review: required. Depends on: V99, V116.

## Goal

Build and edit a Censor of every order at target level two or three through the full wizard and
shared API. Guided advancement remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Pinned `en/unified/md/class/censor.md`, Basics and Censor Advancement Table: +9 Stamina at levels 2
  and 3 (read by the shared class-profile growth); first echelon, 12 Recoveries, unchanged
  characteristics and potency. Level 4's domain feature is out of scope.
- `feature/censor/level-2/perk.md`: one interpersonal, lore or supernatural perk.
- `2nd-level-order-features.md` grants two features per order: Exorcist Saint's Vigilance and A Sense
  for Truth; Oracle It Was Foretold and Judge of Character; Paragon Lead by Example and Stalwart Icon.
  `2nd-level-order-ability.md` pairs from `en/books/heroes/clean/Draw Steel Heroes.md`, 2nd-Level
  Exorcist/Oracle/Paragon Ability: It Is Justice You Fear / Revelator; Prescient Grace / With My
  Blessing; Blessing of the Faithful / Sentenced.
- `feature/censor/level-3/look-on-my-work-and-despair.md` (automatic) and `7-wrath-ability.md`: the four
  Edicts (Disruptive Isolation, Perfect Order, Purifying Pacifism, Stillness).
- Embedded uses, each a manual record citing its clause: Saint's Vigilance judgment, It Was Foretold
  opening main action and montage test, Look On My Work and Despair's 1-Wrath frighten and its
  retarget frighten/holy damage, Judge of Character's Presence-for-Intuition test (as V99's Inspired
  Deception), Revelator's free Judgment, and the With My Blessing target's strike.
- Table routes: It Is Justice You Fear (8/12/15 + M holy) and Sentenced (5/9/12 + P, kit melee bonus)
  roll printed damage with frightened/restrained and effect clauses manual. Prescient Grace's
  `Triggered` action type is recorded, as Parry is. The others have no power roll and are recorded
  with Wrath payment. Edict auras, surges, Recoveries, reveal and turn order stay manual. A Sense for Truth, Lead by Example and Stalwart Icon give edges or passive benefits, grant no action and change no sheet value. Interpretation: Look On My Work and Despair's closing already-frightened sentence is read with the retarget clause it follows; the alternative applies it to the 1-Wrath option too. Both texts say so and the outcome stays manual.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v117-censor-three-expected.json` extends six V99 witnesses
   (two per order, together choosing every level-2/3 ability). Focused engine test checks vitals,
   features, perk pool, costs, embedded uses, foreign-pool rejection and level/order pruning.
2. Authenticated `censor-level-three` headless cohort: six level-3 builds, draft resume and save,
   owner-only level transition, lower to 2 and back, and every new ability and embedded use with
   Wrath payment, blocked second paid use and persisted readback.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `d7a23a0` on `slice/V117`, `.worktrees/censor-three`; rebased onto `635113a`
  (V115, V118) with empty `vendor/*` per the single-copy rule. ENGINE2 informed.
- Ledger written by an isolated subagent from the canonical Compendium only: Stamina +9 per level,
  no other numeric change; It Is Justice You Fear 10/14/17 holy (no Weapon keyword, no kit bonus),
  Sentenced 7/11/18 with Mountain. Its labelled interpretations (holy damage still lands when "instead"
  replaces frightened; Edict of Stillness extra needs judged and willing) are manual clauses here.
- Author checks: both TypeScript projects and ESLint pass; focused V117, V99, V116, V114, Shadow and
  V45 engine files pass; V88 audit guard and live compiled report 34/34. Content 1708 entries;
  `compiled:check`, `content:check`, `supporting:check`, links pass.
- Independent rules/implementation review (subagent, source-only) of `ab708f7`: PASS, four
  non-blocking findings, all closed: Judge of Character now has its Presence-for-Intuition use (as
  V99's Inspired Deception); the Look On My Work and Despair reading is labelled as an interpretation;
  Revelator's Judgment is optional ("can"); the test takes the 1-Wrath cost from the ledger.
  Eighteen new uses in total.
- Test-support gate PASS at `e4fe41e`: `CI=true pnpm check` rc0 in 266 s, engine 410/410, app+scripts
  658/658, content 1708 entries at the pin. Test-Deploy isolated `censor-level-three` cohort rc0 in
  47 s: six builds, level edits and eighteen new uses persisted, seed 1708; the only backend error was
  the deliberate peer owner refusal. Artifacts `/srv/presidium/projects/salient/test-artifacts/V117-e4fe41e`.
- Ready for integration and cloud dev publication, reusing these results.
