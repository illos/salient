# Character wizard restart handoff

Status: six implemented level-one ancestries and trait-granted actions are merged into main
through `b73cb8d` on 2026-09-20. Devil, Polder, Dwarf, Human, Hakaan and Orc have passing
headless character journeys and bounded Forge comparisons. V74 shared-main rollout and its 27-scenario public-API proof pass.
See [V74 evidence](evidence/V74/README.md).

## Current source and running app

[V74](V74-trait-granted-abilities.md) closes the missing trait-action grants found by the
[V73 comparison](V73-forge-headless-counterparts.md). The project-wide completion gate now requires
checking every implemented trait for granted abilities, including prose and conditional grants.
Traits remain on the sheet alongside their actions. Dwarf active rune is persisted play state;
changing it grants only the applicable maneuver and participates in table undo/redo.

Hosted development: <https://salient-dev.rdxx.workers.dev>, backend `dev:different-bat-943`.
Application source `f28ed6c`; test-only `a2a10df` supplies the live Voice recipient.
Worker `135e58f0-2918-49fb-9806-e70c8c42ce74`; existing 515-entry content preserved.
Main contains current peer work through V68 and V67. V72 engine work remains independent;
preserve its adapters and V74's ancestry projection when integrating.

## Verified scope and limits

- Full checks pass: 310 engine and 481 app/scripts tests, lint, types, pinned sources and build.
- Hosted authenticated public API: 27/27 scenarios pass, including rune persistence, permissions,
  stale/retry handling, campaign grants, undo/redo and manual Voice use.
- Forge: two authentic calibrations and 31/31 saved counterpart comparisons pass. All seven prior
  missing-ability discrepancies are resolved; original failures remain in the evidence.
- Independent implementation and pinned-source reviews pass. All 40 ancestry traits were checked;
  12 actions are sourced in the new catalog, including rune carving and three conditional maneuvers.
- Gameplay effects remain manually resolved. This does not automate damage, conditions, Voice
  recipients, detection, light effects, Doomsight approval or long-duration trait effects.
- Forge comparison is bounded to the constructed level-one families. Orc Artisan targets lack
  structured Forge counterparts; Salient persistence/no-extra-skill proof covers that explicit gap.
  Ability-name parity is not combat-mechanics parity or exhaustive rules-combination certification.

See [V74 evidence](evidence/V74/README.md) for actual commits, targets, failures and successful runs.
V69/V65 evidence remains historical; do not rebuild those candidates or repeat passing checks
without a relevant change. Visual scenarios remain in the browser coverage backlog.

## Resume constraints

Read `agent.MD`, [Astra workflow](astra-character-workflow.md), [V44 scope](V44-character-option-delivery.md)
and the relevant character specification. Check Chords and current main before claiming the next
bounded unit. Use a free suitable local or remote environment under the current runbook.

The [Opus pilot](../decisions/2026-09-19-opus-pilot-dead-end.md) is permanently abandoned without
reuse. Use fresh native agents; every test must catch a meaningful failure and add coverage.
The [browser moratorium](README.md#browser-testing-moratorium--2026-09-20) remains in effect until
V66 is authorized and implemented. Programmatic Forge counterparts are approved; website capture
is not required. No browser, Playwright or headless Chromium tests.

Compendium pin: `fb83a789da8f0327a389c277a0c790b1648d5810`.
Forge pin: `5a846aadb623a9855a023e9403bb887a956c341f`. Read game rules only from pinned Compendium.
