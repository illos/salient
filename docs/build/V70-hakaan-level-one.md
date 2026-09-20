# V70 — Hakaan level one

Status: Hakaan merged into main through V74 `b73cb8d`. Full checks, independent reviews,
hosted API and Forge counterparts pass within the documented comparison scope.
See [V74 evidence](evidence/V74/README.md) for current delivery and source limits.

## Scope and source expectations

The unit owns `shared/content/ancestries/hakaan/level-one.ts`,
`shared/evaluate/ancestries/hakaan.ts`, `tests/character-v70-hakaan.test.ts` and this record.
It adds all five purchased traits and the automatic Big! signature, preserving manual gameplay
resolution. Expected results below were derived before writing evaluator tests.

Rules source is Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/feature/trait/hakaan/` (`hakaan-traits`, `big`, `all-is-a-feather`,
`doomsight`, `forceful`, `great-fortitude`, `stand-tough`) and
`en/unified/md/rule/character/speed.md`, Starting Size and Speed. No Opus material was consulted.

Hakaan have three ancestry points, size 1L, speed 5 and stability 0 before kit bonuses.
All Is a Feather, Forceful and Stand Tough cost one point each; Doomsight and Great Fortitude cost
two each. Great Fortitude grants permanent weakened immunity. All Is a Feather grants a conditional
lifting/hauling edge; Forceful adds one to forced movement distance; Stand Tough treats Might as one
higher only when resisting potencies and grants an edge on the specified resistance tests.
Those three conditional effects remain readable/manual, without changing the character's core
Might, attack potency or globally automating forced movement.

Doomsight retains both the Director-coordinated doomed encounter rule and the non-doomed rubble
recovery rule, including its twelve-hour delay. It does not grant permanent Stamina or recovery
bonuses. Big! changes size without inventing any additional reach or damage bonus.

## Acceptance and witnesses

| Completed build | Options covered | Independent expected result |
| --- | --- | --- |
| Mountain Fury | Big!, Doomsight, Forceful | Size 1L, speed 5, stability 2, Stamina 30, recovery 10, winded 15; complete readable doom and forced-movement rules |
| No-kit Elementalist | Great Fortitude, Stand Tough | Size 1L, stability 0, weakened immunity; unchanged core characteristics and potency |
| Mountain Fury | All Is a Feather, Forceful, Stand Tough | Three-point completion; lifting/hauling rule readable; Might remains 2 |

Additional focused cases reject Doomsight plus Great Fortitude (four points) without leaking the
rejected immunity, and replace Hakaan with Polder to prove size/immunity/trait cleanup while
preserving kit and authored name. Each test states the failure it catches and extra coverage.

The lead must run these witnesses through authenticated discovery, transition, preview, save and
readback on the remote app, including a persisted parent replacement. Shared V65 lifecycle evidence
covers unchanged review/history operations; this unit does not introduce new lifecycle behavior.
Forge comparison exports and matching Salient readbacks remain pending; source expectations and
unit assertions do not substitute for that gate. Browser scenarios are limited to later visual
inspection of ancestry choices and readable trait text, after the moratorium is lifted.

## Shared integration handoff

In `shared/content/level-one-decisions.ts`, import this unit's `levelOneDecisions`, mark Hakaan
supported in `ancestry.choice`, and append its decisions to `step.ancestry`. In
`shared/evaluate/character.ts`, import and invoke `applyHakaanBaseline(this, out, noKit)` in the
same phase as Dwarf/Human after class and kit vitals, before supporting/complication modifiers.
Existing generic ancestry grant collection handles its signature and purchased traits.
Ensure ingestion includes all `feature/trait/hakaan` entries in the shipped trait corpus.
The lead owns these shared edits, generated content and the headless witness runner.

No installs, builds, tests, servers or browser activity were run by the implementer. Runtime checks
are queued with the lead, not claimed as passes. Next handoff: integrate the module and run the
focused cases on CT114, record blockers without expanding verification into infrastructure work.
