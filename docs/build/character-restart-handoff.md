# Character wizard restart handoff

Status: all twelve level-one ancestry implementations are on `slice/V82`; hosted acceptance passed; main/shared-app delivery is in progress. Six previously completed ancestries (Devil, Polder, Dwarf,
Human, Hakaan, Orc) are joined by Dragon Knight, High Elf, Memonek, Revenant, Time Raider and
Wode Elf. [V82](V82-remaining-ancestries.md) owns this delivery.

## Current source and running app

Hosted development: <https://salient-dev.rdxx.workers.dev>, backend `dev:different-bat-943`.
Application source `8d5559f`, Worker `ff4da11e-6772-4e3c-bdd4-afd2fc88b000`, 567 reference entries.
Main remains `589d357` until acceptance completes. Preserve independent engine/UI peer work.

Every implemented trait must be checked for granted abilities, including prose and conditional
grants. Traits remain on the sheet alongside their actions. Dwarf active rune remains persisted
play state with undo/redo; Revenant borrowed traits retain their original source and nested grants.

## Verified scope and limits

Full checks on `3ddb81b` passed 333 engine and 483 app/scripts tests, lint, types, pinned sources,
content, links and build. Review corrections in `8d5559f` passed all engine tests, 11 affected app
tests, lint and web types. Independent implementation and fresh pinned-source reviews pass.
Hosted API passes 28/28. The calibrated Forge generator produces 137 complete counterparts;
135 saved comparisons match directly and two pass with the independently reviewed Unphased
source difference. A targeted three-case recheck passed.
See [V82 evidence](evidence/V82/README.md) for final live results and source/target identities.

Completion is level-one ancestry wizard support: choices, budgets, prerequisites, traits, granted
actions, derived baseline and saved headless routes. Gameplay effects remain manual. Dragon Knight
initial Wyrmplate selection is covered; automated respite switching is outside this scope.
Revenant cannot borrow Prismatic Scales without its required Wyrmplate signature. Psionic Bolt's
multi-characteristic roll retains its supported manual-use route and source tiers.

Forge comparison covers legal constructed witnesses, not every possible combination or combat
mechanics. Orc Artisan target choices remain Salient-only evidence because Forge represents the
trait as text. Class coverage remains partial Fury/Elementalist; all eleven classes and higher
levels are separate work. Preserve the existing Fury 1→2 path.

## Resume constraints

Read `agent.MD`, [Astra workflow](astra-character-workflow.md), [V44 scope](V44-character-option-delivery.md)
and the relevant character specification. Check Chords/current main before claiming another unit.
Use a free suitable test environment under the current runbook and active user instructions.

The [Opus pilot](../decisions/2026-09-19-opus-pilot-dead-end.md) is permanently abandoned without
reuse. Every test must catch a meaningful failure and add coverage. The
[browser moratorium](README.md#browser-testing-moratorium--2026-09-20) remains in effect until
V66 is authorized and implemented. Programmatic Forge counterparts are approved; website capture
is not required. No browser, Playwright or headless Chromium tests.

Compendium pin: `fb83a789da8f0327a389c277a0c790b1648d5810`.
Forge pin: `5a846aadb623a9855a023e9403bb887a956c341f`. Read game rules only from pinned Compendium.
