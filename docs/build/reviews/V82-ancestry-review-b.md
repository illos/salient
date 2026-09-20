# V82 independent review B: Revenant, Wode Elf and shared integration

Reviewer: Astra `remaining_dragon_high`, 2026-09-20. This reviewer did not implement
Revenant or Wode Elf. Dragon Knight, High Elf and the Forge adapter are excluded
from this independent verdict because the reviewer authored them.

Status: **static implementation and rules review PASS; runtime acceptance pending**.
Reviewed the integration worktree after the V79/V81 unit commits, including its
uncommitted decision, evaluator, action-catalog and content-selection wiring. No
runtime jobs, browser tests or deployment were performed by this reviewer.

## Source and findings

Reread pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`:
`en/unified/md/feature/trait/revenant/`, `feature/trait/wode-elf/`, both corresponding
structured ability directories, and the borrowed trait definitions. No blocking
source or implementation discrepancy found in the reviewed level-one scope.

- Former Life inherits size and base speed 5 without the former signature. All
  eleven eligible former ancestries are represented. Polder gives 1S/three points,
  Hakaan gives 1L/two points, and the others give 1M/two points.
- The single paid-trait list correctly permits different one-point Previous Life
  purchases repeatedly while rejecting duplicate selections. Two-point purchases
  and native options share that same budget. Changing former ancestry prunes the
  paid list and its descendants.
- Child cloning includes purchase-dependent Psionic Gift and Passionate Artisan
  choices, remaps their parent conditions, and does not copy signature choices.
  Structured child grants retain their original ability sources. Artisan choices
  remain project targets, not newly granted skills.
- Prismatic Scales refers specifically to an immunity granted by **your Wyrmplate
  trait**. Former Life does not grant Wyrmplate. Marking the borrowed option
  unavailable, with that prerequisite explanation, is justified by the pinned
  source; inventing Wyrmplate would contradict Former Life. The refusal is covered
  rather than silently accepted as complete.
- Borrowed baseline handling covers movement, stability, health, recoveries, save
  thresholds, condition immunities and Disengage. Polder corruption immunity
  replaces the weaker undead immunity with level + 2 rather than stacking or
  emitting duplicate rows. Spark Off Your Skin updates Stamina and recalculates
  recovery/winded values. The reviewed delivery is level one; this is not a
  certification of later-level borrowed trait scaling.
- Vengeance Mark retains its trait and exposes placement (maneuver), removal (no
  action), and the structured Detonate Sigil main action. Tough But Withered and
  Bloodless retain their source rules and numeric immunity/weakness contributions.
  Sigil targeting, effects and undead recovery remain explicitly manual.
- Wode Elf has all six paid traits. Swift sets base speed 6 before kit bonuses;
  Otherworldly Grace sets the 5+ save threshold. The Wode Defends is an actual
  structured ability grant. Forest Walk, Quick and Brutal and the glamor modify
  existing movement, action economy or tests; they do not define additional
  activations requiring fabricated ability entries.

## Shared integration and test value

The root registers all other ancestry decisions before constructing Revenant's
borrowed choices. Evaluator hooks apply ancestry values after class/kit values,
with Disengage additions after the no-kit default. The shared granted-action
adapter matches actual trait name **and source path**, so borrowed paid actions
transfer while original signature actions do not. Source content selections
include the complete Revenant/Wode trait and ability directories; existing shared
save/query and ability-list routes consume the same derived grants.

Focused tests add distinct failure coverage: wrong former size/budget or signature
leakage; overlapping immunity stacking; repeated/duplicate paid selections;
missing or stale nested choices; text-only ability grants; no-kit contributions;
parent replacement; unsupported Scales prerequisites; and Wode movement/save/action
revocation. These are meaningful outcome checks, not implementation-mirroring
assertions. Existing generic persistence/history tests are not duplicated here.

Completion still requires root-recorded full checks and authenticated saved API
proof, including former-life replacement, action-list availability and live-state
preservation. Forge comparison evidence is separate and is not independently
certified by this reviewer. Browser verification remains under the moratorium.
