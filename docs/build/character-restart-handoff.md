# Character wizard restart handoff

Status: all twelve level-one ancestries are delivered through [V82](V82-remaining-ancestries.md).
The supporting portion is delivered as `175d17d`: [perk/kit actions](V83-supporting-actions.md)
and [culture presets](V84-culture-presets.md). All repository check stages and independent
implementation/source reviews passed; both isolated and shared-main API suites passed 31/31.

## Current source and running app

Shared main runs clean `175d17d4e4d1e2838e6d9fb796942ce2fda14925` at
<https://salient-dev-fc4f48cb09a0.tail41404c.ts.net>, including ENGINE V72. Existing data and
567 references were preserved. The isolated `supporting-actions` CT114 stack is stopped with
its data retained. [V83 evidence](evidence/V83/README.md) owns current check/review/live records,
including the isolated raw report's explicit source-label correction and accurate main report.
The prior V82 hosted ancestry deployment is historical evidence, not the current character app.
Preserve peer engine/UI work and coordinate the next runtime use through Chords.

V83 exposes 24 actions/activities from 23 core perks and corrects all 21 ordinary kit signatures'
action metadata. Familiar restoration pays one Recovery without healing and has undo/redo.
Lie Detector remains blocked on the unimplemented HeroToken pool; contextual effects remain manual.
V84 adds 11 ancestral and 16 professional presets, independent of hero ancestry, plus editable
Bespoke culture. No new culture rules or grants are introduced; players still select their skills.
Next bounded work is the complication grant/dependency audit, then starting-reward fulfillment.

Every implemented trait must be checked for granted abilities, including prose and conditional
grants. Traits remain on the sheet alongside their actions. Dwarf active rune remains persisted
play state with undo/redo; Revenant borrowed traits retain their original source and nested grants.

## Verified scope and limits

Historical V82 checks on `3ddb81b` passed 333 engine and 483 app/scripts tests, lint, types, pinned sources,
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
