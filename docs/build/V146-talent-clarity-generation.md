# V146: Talent clarity generation and strain damage

Rules review: required. Depends on: V120 (shared heroic-resource engine).
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/talent.md`](evidence/V120/talent.md).

## Goal

Enable automatic clarity generation and strain damage for the Talent, with its own implementation and
an independent rules review.

## Scope

- **Engine.**
  - Profiles gain an optional `turnEndStrain` clause.
  - When a profile has it, `combat.commit` registers a `turn-end-strain` step at the end of each of
    that hero's turns.
  - The step applies damage equal to the negative resource through the shared damage rules
    (`applyDamage` then `writeDamage`, with temporary Stamina first). It is logged with the before
    and after pools and journaled in the causing `turn.end`.
- **Talent profile** (`feature/talent/level-1/clarity-and-strain.md`):
  - +Victories at combat start.
  - 1d3 at the start of each of the Talent's turns.
  - Strain: "At the end of each of your turns, you take 1 damage for each negative point of
    clarity."
  - "You lose any remaining clarity or reset any negative clarity at the end of the encounter": 0.
  - Claim `talent-forced-movement`: +1 "the first time each combat round that a creature is force
    moved".
    - It is a table claim, because the app computes forced movement but does not execute it.
    - From level 4 it is +2 (`feature/talent/level-4/mind-recovery.md`, "2 clarity instead of 1").
  - The existing floor −(1 + Reason) is unchanged.
  - Verified through level 6. `feature/talent/level-7/lucid-mind.md` changes the turn-start gain to
    1d3 + 1.
- **Wards.**
  - Steel Ward (`level-1/steel-ward.md`) and Force Orbs (`ability/talent/level-3/force-orbs.md`)
    grant damage immunity that the table tracks by hand. For a Talent with either, strain is logged
    as due and left to the table.
  - Vanishing Ward is set off by damage, so the strain log names it.
  - A strain log entry says when the damage leaves the Talent dying or at the death threshold.
- **Content.** The manual `Clarity and Strain: Turn-End Damage` row now points to the automation and
  the claim, so nothing is applied twice.

## Out of scope

- The strained ability gains: Entropic Bolt ("You gain 1 clarity when you obtain a tier 2 or tier 3
  outcome"), Fling Through Time (tier 3: 2 clarity) and Perfect Clarity (a target's tier 3: 1
  clarity). These are ability effects that stay manual riders on the use, pending the Effect-rider
  track.
- Mind Recovery's option to forgo Stamina from a Recovery for 3 clarity.
- Outside-combat strain (1d6 per use within a minute).
- Non-combat stressful situations.
- The ledger's ambiguities: zero-distance forced movement, objects, and the turn start while dying.
  - Forced-movement cases are the table's confirmation.
  - Strain damage is ordinary untyped damage, so only an "all" immunity would reduce it. This is
    labelled as the literal reading; the alternative is irreducible damage.

## Acceptance

- The pure quote test covers the strain clause and the Talent's amounts, including level 4.
- App test `tests/app/heroic-resource-talent.test.ts`:
  - Victories at commit;
  - 1d3 at the turn start, with its die;
  - the claim;
  - at clarity −2 with 1 temporary Stamina, `turn.end` deals 2 strain damage (1 absorbed, Stamina −1);
  - reset to 0 at finish.
- Headless cohort `heroic-resource-talent`.

## Work log

- 2026-09-24: implemented on main `a804a02`. The focused files pass (1/1 and 5/5), as does
  `tests/character-v105-talent.test.ts` (2/2); `tsc` and eslint are clean. `scripts/headless/talent.ts`
  takes no turn.
- Independent review ([audit](audits/V146-rules-review.md)): changes required.
  - R1: strain ignored the Steel Ward and Force Orbs immunity that the table tracks. It is now held
    for them. A test covers Steel Ward (held) and Vanishing Ward (applied and named).
  - R2: strain skipped when combat ends mid-turn is labelled as Q-RES-8.
  - R3: dying and death-threshold notes were added to the strain log.
- Review closure: PASS at `e76e2c4`. Advisory: the manual row now names the held-ward exception.
