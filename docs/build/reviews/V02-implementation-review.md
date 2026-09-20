# V02 independent review — minion squads and captains

Reviewer: `v02_independent_review`, a fresh read-only Fable subagent with no part in the
implementation, static review of `slice/V02` in `code/.worktrees/minions` plus its own reruns of
`tests/squad.test.ts` and `tests/app/squads.test.ts`. No browser (moratorium), no web research; the
pinned Compendium (`chapter/monster-basics.md` Using Minions through Tracking Squads,
`rule/monster/squad.md`, `rule/monster/captain.md`, `rule/organization/minion.md`, the Spinecleaver,
Axethrower and Warrior stat blocks) was the only rules source.

## Round 1 — `9e4a54d`, 2026-09-20: implementation changes required, rules pass

Acceptance checks 1–5 verified from the tests and the headless evidence; check 6 verified with a
recorded deviation (EV lives on the squad row, no encounter summary exists before V06). Expected
values traced to the pinned stat blocks, R04 10.13 and the Compendium examples, none produced by the
code under test. Ladder, captain eligibility and timing, Squad Action, Minion Maneuvers and Free
Strike Together matched the source as modified by the 2026-09-13 rulings and 2026-09-20 decisions;
no unsourced rule, threshold or grant.

Findings: (1) blocking — new damage while a casualty choice was owed overwrote the owed deaths;
(2) blocking — the captain's strike benefit was not applied on a lone minion's own `/ability use`
route; (3) a squad maneuver taken together marked its participants as having acted alone; (4) a
captain attached while taking its own turn left a dangling active turn; (5) the headless captain
step could pass when skipped; (6) the add control previewed pool arithmetic without the captain
benefit; (7) the two interpretations lacked citations and alternatives; (8) the trait-gate check
and the acceptance-6 deviation were unrecorded.

## Round 2 — `db69b8e`, 2026-09-20: implementation pass, rules pass

All eight findings re-verified as fixed with file and line evidence: `assertNoPendingCasualties`
guards every damage route, captain change, participation, squad action and pool edit, with
`withoutOwed` keeping owed minions out of the captain arithmetic; the lone free strike carries the
captain's strike damage and an individual rolled Strike is redirected to the shared action with one
participant; `recordUse` skips the individual mark for shared maneuvers; `onCaptainAttached` ends
the captain's active turn first; the headless step fails instead of skipping; the preview is gone;
the spec note cites Squad Action and Free Strike Together with the alternatives considered; the
work log records the trait check and the deviation. Tests rerun at `db69b8e`: 13/13 and 10/10.
Non-blocking notes: finding 4's repair is untested; `combat.finish` leaves dropped minion ids in
`squads.memberIds`, so a surviving squad's total shrinks after closeout (cosmetic; V06 decides
whether to prune).

**Implementation: pass. Rules: pass.** Trailer: `Reviewed-By: v02_independent_review (pass,
2026-09-20)`; `Rules-Review: v02_independent_review (pass, 2026-09-20)`.
