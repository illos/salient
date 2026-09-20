# V82 — Complete the remaining level-one ancestries

Status: In progress, `slice/V82`, `.worktrees/remaining-ancestries`, starting at main `589d357`.
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

- Source audit and isolated unit implementation started. Revenant former-life/borrowed traits are
  the shared dependency; integrate after the other five new ancestry definitions are available.
- Lead owns `shared/content/level-one-decisions.ts`, `shared/evaluate/character.ts`, action catalog,
  Compendium build selection, Forge adapter, headless integration and final records.
