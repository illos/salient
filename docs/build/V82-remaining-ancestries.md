# V82 — Complete the remaining level-one ancestries

Status: implementation and hosted acceptance complete; main/shared-app delivery in progress.
Candidate branch `slice/V82`, `.worktrees/remaining-ancestries`, starting at main `589d357`.
User authorized all remaining wizard ancestries on 2026-09-20: Dragon Knight (V76), High Elf (V77),
Memonek (V78), Revenant (V79), Time Raider (V80), Wode Elf (V81).

## Scope

Deliver all level-one creation choices, prerequisites, point budgets, permanent derived values,
traits and granted abilities. Audit every new trait against pinned Compendium, including prose
actions, nested selections and Revenant borrowed traits. Preserve saved decisions and live values.
Current gameplay effects remain manually resolved; respite/combat automation is not wizard scope.

## Delivery and verification

Three independent workers implement paired ancestry units in separate worktrees; the lead owns
shared wiring, content generation, public API/Forge verification and integration. Use current main
and no abandoned pilot artifacts. Existing full checks and public tests are baseline evidence;
run focused changed-mechanism tests first, then one integrated full check and independent code
and source reviews. Each test must catch a distinct meaningful failure. No browser workloads.

Extend existing Forge witness construction and strict supported-choice validation. Every supported
option needs a legal source-reviewed witness; actual pinned Forge calculations and saved public-API
readbacks remain independent comparison inputs. Explicitly record source/Forge discrepancies.
Bound live runs; stop on infrastructure blockers, preserve failures and do not increase timeouts.

## Progress

All six units are implemented and integrated on `slice/V82`. Candidate `3ddb81b` passed the full
CT114 check (333 engine plus 483 app/scripts tests, types, lint, content, links and build).
Review corrections in `8d5559f` separate Memonek Lightweight and Revenant Former Life source
provenance and reject duplicate effective borrowed traits in the Forge adapter. Delta checks
passed all 333 engine tests, 11 affected app tests, lint and web types. Independent implementation
and fresh pinned-source reviews pass. Hosted public API acceptance passes 28/28 scenarios in
110.688 seconds. Forge acceptance covers all 137 witnesses: 135 direct matches and two
source-reviewed Unphased differences; the affected cases and a control pass the targeted recheck.

The calibrated pinned Forge generator produces 137 complete counterparts: 55 non-Revenant and
82 Revenant, including all former ancestries and eligible borrowed traits. Live comparisons run
as two bounded cohorts to respect the existing account character limit and runner deadline.
No timeout was increased.

## Source and automation boundaries

Revenant inherits former ancestry size, not its signature traits. Borrowed Prismatic Scales is
unavailable because the pinned source requires Wyrmplate, which Former Life does not grant.
Dragon Knight includes the initial Wyrmplate choice; automated respite changes remain outside
wizard scope. Memonek retains both Fall Lightly and Lightweight despite incomplete source metadata.

Granted actions are present with their source text and supported manual-use routes. Psionic Bolt's
multi-characteristic roll remains manual under the current engine parser; its source tiers and
roll expression are preserved. This delivery does not claim new combat/respite automation.

Unphased is a documented Forge representation difference: both sources say the character cannot
be surprised, but Forge stores this as generic prose, not structured condition immunity. Salient
retains the sourced immunity. The comparator must preserve raw Forge output and report this narrow
Compendium-derived expectation explicitly, only for native/borrowed Unphased with matching source.
