# V82 independent review B: Revenant, Wode Elf and shared integration

Reviewer: Astra `remaining_dragon_high`, 2026-09-20. This reviewer did not implement
Revenant or Wode Elf. Dragon Knight, High Elf and the Forge adapter are excluded
from this independent verdict because the reviewer authored them.

Status: **implementation review PASS; fresh rules review PASS; live acceptance pending**.
Reviewed integrated source `3ddb81b` plus the staged Former Life provenance correction,
including decision, evaluator, action-catalog and content-selection wiring. This
formal refresh follows the passing project checks. No runtime jobs, browser tests
or deployment were performed by this reviewer.

## Source and findings

Reread pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`:
`en/unified/md/feature/trait/revenant/`, `feature/trait/wode-elf/`, both corresponding
structured ability directories, and the borrowed trait definitions. No blocking
source or implementation discrepancy found in the reviewed level-one scope.

- Former Life inherits size and base speed 5 without the former signature. All
  eleven eligible former ancestries are represented. Polder gives 1S/three points,
  Hakaan gives 1L/two points, and the others give 1M/two points.
- The provenance correction gives Former Life its own sourced automatic grant,
  rather than attributing it to Tough But Withered. Rereading both pinned entries
  confirms each grant now carries the correct source and quotation. The existing
  former-life test now also catches this attribution failure without duplicating
  the broader ancestry tests.
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

Reviewed the retained [full check log](../evidence/V82/check.log): lint, formatting,
types, 333 engine tests and 483 app/scripts tests passed, followed by links, vendor,
content checks and the production build. The lead also reports passing delta
lint/type checks, all 333 engine tests and 11 affected app tests after the source
correction. This reviewer inspected the staged correction and its regression
assertions directly. The lead reports calibrated Forge generation with 137 complete
counterparts; independent certification of the adapter remains outside this
reviewer's scope because they authored that adapter.

No implementation or rules blocker remains in this review's level-one scope.
Completion still requires authenticated saved API proof, including former-life
replacement, action-list availability and live-state preservation. These verdicts
do not claim live comparison or deployment acceptance. Browser verification remains
under the moratorium.

## Live discrepancy consultation: Unphased

The first non-Revenant comparison identified one difference: Salient reports
surprise immunity for Unphased; pinned Forge returns no structured immunity.
Independent source consultation confirms this is a representation gap in Forge,
not an application rules error. Compendium
`en/unified/md/feature/trait/memonek/unphased.md:9` explicitly prevents surprise.
Pinned Forge `src/data/ancestries/memonek.ts:57–61` preserves that same rule in a
generic feature; `HeroLogic.getConditionImmunities` at lines 684–699 returns only
`ConditionImmunity` features, and Forge's condition enum has no Surprised entry.
The same paid-trait rule applies when a Memonek former-life Revenant borrows it.

The proposed comparator correction preserves raw Forge output and records
`compendiumConditionImmunitiesBeyondForge: ["surprised"]` only for an actual Unphased
purchase by those two eligible ancestry cases, with the granting trait and immunity
source paths checked. All other immunity comparisons remain strict. This correction
is authored by this reviewer and therefore requires another reviewer's independent
approval; it is not covered by review B's independent verdict. Retain the original
failure evidence and run focused affected/control witnesses under distinct report
and saved-readback filenames. No application source change is warranted.
