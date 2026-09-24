# V149: Troubadour drama generation

Rules review: required. Depends on: V147 (the prayer mechanism), V142 (the damage observer), V120.
Decision: [2026-09-24 heroic-resource automation](../decisions/2026-09-24-heroic-resource-automation.md).
Ledger: [`evidence/V120/troubadour.md`](evidence/V120/troubadour.md).

## Goal

Enable automatic drama generation for the Troubadour, with its own implementation and an independent
rules review. This includes Appeal to the Muses and the triggers about any hero.

## Scope

- **Engine.**
  - The prayer clause gains a `kind` (`conduit` or `appeal`), a `label` and a `fromLevel`, with
    `prayerFor` checking the hero's level.
  - A new trigger limit `each`: every confirmed occurrence applies.
  - New observers, run from the damage write for any participating hero, feed every participant's
    triggers:
    - `any-hero-winded`: Stamina crosses to at or below the winded value;
    - `any-hero-dies`: Stamina reaches the negative of the winded value (`rule/health/dying.md`).
- **Troubadour profile** (`feature/troubadour/level-1/drama.md`):
  - +Victories at combat start.
  - 1d3 at each turn start.
  - Lose all remaining drama at encounter end.
  - Appeal to the Muses (level 2, `level-2/appeal-to-the-muses.md`), declared with `/resource pray`:
    - a 1 adds 1 drama and the Director gains 1d3 Malice (rolled and applied);
    - a 2 gives the Director 1 Malice, and a 3 gives none;
    - the Heroic Resource from a 2 or 3 is distributed by the table.
  - `troubadour-hero-winded`: +2 the first time any hero is made winded. It is automatic, once per
    encounter.
  - `troubadour-hero-dies`: +10 for each hero death, including the Troubadour's own. It is
    automatic.
  - `troubadour-natural-roll`: +3 for each natural 19 or 20 in line of effect. It is a claim, once
    per occurrence.
  - `troubadour-three-heroes`: +2 the first time three heroes use an ability on one turn. It is a
    claim, once per encounter (Q-RES-12).
  - Verified through level 3. Level 4 Melodrama adds triggers that aren't modelled.
- **Still dead.** A Troubadour still dead when a later encounter is committed gets no registrations.
  `generationSuspended` is journaled for that encounter, so claims and observers refuse too.
- **Content.** The Appeal row points to the control.

## Out of scope

- Returning at 30 drama.
- Whether the body is intact.
- Automatic detection of natural 19 or 20 (line of effect).
- Distributing the appeal's Heroic Resource.
- Correction reconciliation for gains observed from another hero's damage. The table adjusts, as
  for any manual correction.

## Acceptance

- The pure test covers the Troubadour profile and the level gate on `prayerFor`.
- App test `tests/app/heroic-resource-troubadour.test.ts`:
  - an appeal with the dice fixed at 1 then 2 gives 2 drama and the Director 2 Malice;
  - Thorn made winded by a free strike gives +2, once per encounter;
  - Thorn's death gives +10;
  - natural-roll claims apply each time;
  - the three-heroes claim applies once.

## Work log

- 2026-09-24: implemented on V147. The focused tests pass; `tsc` is clean.
- Independent review ([audit](audits/V149-rules-review.md)): changes required.
  - R1: a Troubadour still dead in a later encounter gained drama. That encounter is now suspended,
    and a test covers it.
  - R2: the sheet reads "each time" for unlimited triggers.
  - R3 and R4: labelled in Q-RES-12.
- Review closure: PASS at `de1799c`. Advisory: a suspended Troubadour revived mid-encounter stays
  suspended for that encounter; the table adds drama by hand.
- Rebased onto V147 `6b0a3f7a`, which carries V142's final form and V150, and squashed into one
  commit.
  - The 'each' limit is combined with V142's forgone-occurrence rule.
  - `tsc` (root, convex, web) is clean. The Troubadour, Conduit, forgo, Fury and pure tests pass
    (14/14).

- QC1 train-4 R1 (`../review-artifacts/2026-09-24-resource-train-4-QC1.md`): correcting a hit that
  gave another hero drama could leave the gain or pay it twice. `assertCorrectionReconcilable`
  (`convex/lib/resourceTriggers.ts`, called from `ability.correct` before any write) now refuses such
  a correction and points to rewind. Regression: a tier-2 Spear Charge kills Thorn (+10 drama), and
  correcting it to tier 1 is refused with drama unchanged.
