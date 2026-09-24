# V155: Prone and can't stand

Rules review: required. Depends on: V113, V119, V153, V154.

## Goal

Execute "prone and can't stand (save ends/EoT)" and the split printing "prone; X < n can't stand
(…)" as the user ruled on 2026-09-24
([automation rulings, section 5](../decisions/2026-09-24-automation-rulings.md#5-q-cond-1-prone-and-cant-stand)):
- The creature is knocked prone. Prone has no duration and ends only by Stand Up.
- A separate "can't stand" restriction carries the printed duration.
- While the restriction is active, Stand Up is refused.
- When the restriction ends, by save or EoT, the creature stays prone until it uses Stand Up.

## Scope

- `shared/resolve/abilityGrammar.ts`, `tierCantStandExpression`:
  - Reads an optional potency, "prone and" for the combined form, and a required "(save ends)" or
    "(EoT)".
  - Accepts both apostrophe forms.
  - Refuses prose durations ("until the end of their next turn") and clauses where can't stand
    follows movement.
- `shared/resolve/compileAbility.ts`:
  - The combined form becomes a prone node, with no duration and the clause's potency, plus a
    restriction node.
  - The split form becomes a restriction node only, and only after a prone printed without a potency
    in the same tier.
  - Both are condition nodes on `prone`. The restriction node has `restriction: 'cant-stand'` and
    the printed duration.
- `shared/resolve/compiledOutcome.ts`:
  - A restriction needs a plain prone before it in its tier, and a save-ends or EoT duration.
  - The restriction applies only if that tier's prone applied to the target. Otherwise it takes the
    prone's status (resisted, immune or fact-needed).
- Persistence:
  - `ConditionInstance.restriction`.
  - The restriction instance keeps prone on while it is active. Ending it leaves the separate prone
    instance, so the creature is still prone.
  - Stand Up refuses while a restriction is active. It already refuses while restrained
    (`condition/restrained.md`).
  - `condition off prone` still ends every prone instance.
- Log and table text say "can't stand" for the restriction.

Spec references:

- `docs/decisions/2026-09-24-automation-rulings.md#5-q-cond-1-prone-and-cant-stand`
- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`

Compendium (pinned `en/unified/md`): `condition/prone.md`; `feature/common/maneuvers/stand-up.md`;
`rule/general/saving-throw.md`; `rule/combat/end-of-turn.md`; split printings in
`monster/giant/statblock/hill-giant-clobberer.md`, `monster/goblin/statblock/goblin-cursespitter.md`.

| Ability | Source | Clause |
| --- | --- | --- |
| Judgment's Hammer | `feature/ability/conduit/level-1/judgments-hammer.md` | tier 3 A < STRONG, prone and can't stand (save ends) |
| Staggering Blow | `feature/ability/shadow/level-3/staggering-blow.md` | tiers 2–3 M < AVERAGE/STRONG, prone and can't stand (save ends) |
| Mindpunk | `monster/time-raider/statblock/time-raider-mind-punk.md` | R < N prone and can't stand (save ends) |
| Dizzying Hex | `monster/goblin/statblock/goblin-cursespitter.md` | tier 2 combined (EoT); tier 3 "Prone; I < 2 can't stand (save ends)" |

Eight other abilities still have unrelated blockers and stay manual:
- Earth Pillar, Hampering Roots, Writ of Execution, Stomp and Forward Assault have Effect or Malice
  sections.
- Bull Rush (`hill-giant-clobberer.md`, split form) is blocked by its target and Effect section.
- Upstage and Levity and Gravity are blocked by their target and a Strained section.

## Acceptance checks

1. `tests/scripts/cant-stand.test.ts`:
   - Grammar forms and refusals.
   - Judgment's Hammer applies both or neither, and prone immunity also stops the restriction.
   - A restriction without a prone is refused.
2. `tests/app/cant-stand.test.ts`: Dizzying Hex tier 3 against Thorn.
   - Prone (no duration) and the restriction (save ends, scheduled).
   - Stand Up is refused.
   - A failed save keeps the restriction.
   - A successful save ends only the restriction, so Thorn stays prone.
   - Stand Up then ends prone.
3. `tests/scripts/live-compiled-report.test.ts` names the 4 additions (143 → 147). Both reports are
   regenerated.
4. TESTER: `CI=true pnpm check` and `SALIENT_HEADLESS_COHORT=cant-stand node
   scripts/verify-character-headless.ts`.
5. An independent review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V155` at `f3dece4` in `.worktrees/cant-stand`.
- The V72 report moves exactly these 4 to compiled.
- Authoring runs:
  - Script tests pass, except `tests/scripts/rules.test.ts`, which needs `pnpm rules:ingest` output
    that `pnpm check` generates first.
  - The grab, tier-effects, condition, compound, potency, compiled-effects and cant-stand app tests
    pass.
  - Both typechecks pass.
- V155-REVIEW on `a11edd7`: changes required on text only; the rules behaviour passed. Fixed:
  - The clock label, the combat-end text, the foe projection, the condition-source list and the
    `condition.potency` payload now name the restriction "can't stand".
  - The doc now counts eight other abilities, including Bull Rush.

## Publication: 2026-09-24

Merged in train 8 (V155, V156) as main `d266437` and published as Worker `dd30feb0-bf87-4f0d-b420-03b67b68cced`. Release logs:
`/srv/presidium/projects/salient/test-artifacts/train8-release-d266437`.
