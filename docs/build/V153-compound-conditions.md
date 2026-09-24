# V153: Compound tier conditions

Rules review: required. Depends on: V88, V113, V152.

## Goal

Execute tier clauses that impose two or more conditions under one potency and one duration, such
as "P < WEAK, dazed and frightened (save ends)". Also execute a condition followed by forced
movement in one clause, such as "taunted (EoT), slide 1". The conditions of a compound effect are
applied together and removed by one saving throw.

## Scope

- `shared/resolve/abilityGrammar.ts`:
  - `tierCompoundConditionExpression`: two or more core conditions joined by "and", one optional
    potency, and a required "(save ends)" or "(EoT)".
  - Prone and grabbed are excluded. Prone ends by Stand Up unless the effect says otherwise
    (`condition/prone.md`), and grabbed carries grab relationships (`condition/grabbed.md`).
  - "Prone and can't stand" is not a list of conditions and stays manual. It is a separate
    question.
  - `tierConditionMovementExpression` handles "condition (duration), movement N" only without a
    potency. Whether a potency also gates the movement is not stated.
- `shared/resolve/compileAbility.ts`: one condition node per condition. Each has its own id
  (`<clause id>~<condition>`) and a shared `group`. The condition and movement clause becomes a
  condition node, then a push node.
- `shared/resolve/compiledOutcome.ts`: condition outcomes carry `group`. A tampered member is
  outside the supported envelope: no duration, prone or grabbed, or an id that does not match its
  group.
- Persistence:
  - `ConditionInstance.saveGroup` is the first occurrence of the compound effect for that target.
  - Each member keeps its own save registration, so ending one member early (for example with
    condition off) never strands the other.
  - At a boundary the first member to fire rolls.
  - A failure leaves the others active, and each reuses that roll: the event payload has
    `shared: true` and no dice.
  - A success ends every active member at once, which retires their registrations before they
    fire.
- Regenerated V72 report. The live inventory test names the 10 additions: 3 hero abilities and
  7 foe abilities.

Spec references:

- `docs/conditions-and-clock.md#13-ending-conditions`
- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/build/V26-compiled-ability-effects.md#3-persisted-results-and-clients`

Compendium (pinned `en/unified/md`):
- `rule/general/saving-throw.md`: "If an effect has '(save ends)' at the end of its description, a
  creature suffering the effect makes a saving throw at the end of each of their turns to remove
  the effect."
  - Interpretation (labelled): the conditions of one clause are one effect, so a single save
    removes them all. If one condition ends another way first (for example teleporting out of
    restrained, `condition/restrained.md`), the others remain until the save.
  - Alternative considered: each condition saves on its own. It was rejected because the source
    prints one "(save ends)" for the whole description.
- `rule/character/potency.md`: the potency applies to the whole effect.
- `rule/combat/end-of-turn.md` (EoT); `condition/prone.md`; `condition/grabbed.md`.

| Ability | Source | Clause |
| --- | --- | --- |
| Death... Death! | `feature/ability/fury/level-2/death-death.md` | P < WEAK/AVERAGE/STRONG, dazed and frightened (save ends) |
| Stunning Blow | `feature/ability/null/level-1/stunning-blow.md` | I < WEAK/AVERAGE/STRONG, dazed and slowed (save ends) |
| Kinetic Strike | `feature/ability/null/level-1/kinetic-strike.md` | taunted (EoT)[, slide 1/2] |
| Poison Fumes | `monster/basilisk/statblock/basilisk.md` | M < 0/1/2 weakened [and slowed] (save ends) |
| Numb, Deaden, Stun, Incapacitate | `monster/rival/*/statblock/rival-null.md` | R < N dazed and slowed (EoT) / dazed and restrained (save ends) |
| Disarrange Thoughts, Disorientate | `monster/rival/*/statblock/rival-talent.md` | R < N dazed and slowed (save ends) |

## Acceptance checks

1. `tests/scripts/compound-conditions.test.ts`:
   - Grammar positives and the refused forms (no duration, prone, grabbed, duplicates, "or",
     can't stand, a potency before condition and movement).
   - Death... Death! applies both conditions or neither, and immunity to one splits them.
   - Kinetic Strike's printed order.
   - A tampered member is refused.
2. `tests/app/compound-conditions.test.ts` (convex-test, registered operations). Poison Fumes
   against Thorn:
   - Two instances with one `saveGroup`.
   - A failed save is one roll that both members share.
   - A success ends both, with both registrations retired.
   - Ending one member early leaves the other and its save.
3. `tests/scripts/live-compiled-report.test.ts` names the 10 additions. `pnpm compiled:check`
   is fresh.
4. TESTER:
   - `CI=true pnpm check`.
   - `SALIENT_HEADLESS_COHORT=compound-conditions node scripts/verify-character-headless.ts`, with
     real dice and persisted readback of the shared save.
5. An independent rules and implementation review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V153` in `.worktrees/compound-conditions` and rebased it onto
  `slice/V152` at `743ac7b`.
- Corpus survey: compound forms occur in 19 abilities (3 hero, 16 foe). 10 flip, and the rest
  have other blockers. "Prone and can't stand" occurs in 13 and is deferred to its own slice,
  because whether the save also ends prone is an interpretation.
- The V72 report moves exactly these 10 to compiled: 126 → 136 reachable compiled.
- Authoring runs:
  - `vitest run tests/app/compound-conditions.test.ts`: 2 passed.
  - `vitest run tests/scripts/compound-conditions.test.ts`: 5 passed.
  - `tsc --noEmit` and `tsc -p tsconfig.web.json --noEmit`: exit 0.

## Publication: 2026-09-24

Merged in train 7 (V152, V153, V154, V160) as main `4b87799` and published as Worker `bde8df86-9a57-4299-87f1-b6b564085f9f`.
Release logs: `/srv/presidium/projects/salient/test-artifacts/train7-release`.
