# V231: Record Shared Ferocity first-use ruling

## Goal

Resolve Q-FOE-3 using the user's accepted once-per-encounter interpretation.

## Scope

Documentation only: Q-FOE-3, V226, foe plan and inventory. One Shared Ferocity grant on the first
qualifying ferocity expenditure per encounter, with source-required line of effect. Later uses
by any creature do not produce another grant. Replace the earlier per-creature recommendation.

Spec: `docs/rules-adaptation-principles.md#faithful-automation-and-deliberate-departures-are-different`.
Source: pinned `monster/group/werewolf.md`, Shared Ferocity. Comparative first-time resource
wording and the limits of that evidence are recorded in Q-FOE-3; this ruling is trait-specific.

## Acceptance checks

1. QC verifies the accepted scope is consistent throughout and comparison sources are not
   presented as a conclusive rule for an omitted interval.
2. V226 tests first qualifying use, later uses by same/different creature, nonqualifying line
   of effect, a new encounter and recorded-roll idempotence. No gameplay result is claimed here.
3. Test checks links and diff whitespace on the committed candidate; QC then clears Deploy.

## Work log

- 2026-09-25: created `slice/V231` in `.worktrees/shared-ferocity-ruling` from `0d96ce08`.
  After the pinned-rule comparison, the user agreed with the revised once-per-encounter reading.
  Recorded the answer and source comparisons; runtime implementation remains V226.
