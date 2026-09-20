# V60: Dwarf level one

Status: candidate implemented; focused and full check suites passed on CT114; browser/Forge verification queued. No acceptance claim.
Rules review: required.

Spec: [V44 scope](V44-character-option-delivery.md),
[decision system](../character-wizard-spec.md#3-decision-system),
[reliability](../character-wizard-spec.md#9-shared-operations-and-reliability).

Owned paths: `shared/content/ancestries/dwarf/level-one.ts`,
`shared/evaluate/ancestries/dwarf.ts`, `tests/character-v60-dwarf.test.ts`, this document.
Branch `slice/V60`; worktree `.worktrees/astra-dwarf`, starting main `6459c8d`.
Lead owns content composition, evaluator call sites, shared contracts, runtime scheduling and STATUS.
No Opus inputs used. Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`.

Source expectations were read from pinned `en/unified/md/feature/trait/dwarf/*.md` before coding:
three-point purchase budget; Grounded costs 1 and adds 1 stability; Spark Off Your Skin costs 2
and adds 6 Stamina at level one; Great Fortitude costs 2 and grants weakened immunity;
Stand Tough and Stone Singer each cost 1. Runic Carving is automatic and changeable during play.
Runic Carving, Stand Tough and Stone Singer retain readable rules through their trait source paths.
Stand Tough does not alter core Might. Rune selection is not a creation decision.

The evaluator applies Dwarf contributions after class/kit values, before complication modifiers.
Spark recalculates recovery and winded values; later complication bonuses still apply. Missing-kit
Stamina and stability stay absent. Later Spark increases at levels 4/7/10 await their level units.

## Acceptance and queued witnesses

Each test states the distinct failure it catches. Coverage: Mountain stacking and dependent health;
no-kit Wodewalker sequencing; weakened immunity versus conditional Might; remaining manual trait
selection and signature; over-budget rejection; parent replacement without stale benefits.
CT114 `tsc --noEmit` and all six focused tests passed; full `pnpm check` passed (697 tests),
including types, lint, content validation and web build. No local runtime workloads were started.

| Witness | Complete legal build | Options covered | Independent expected values |
| --- | --- | --- | --- |
| A | Existing pre-pilot `v25-fury.json` choices, replace ancestry with Dwarf, remove Devil children; Grounded + Spark Off Your Skin | Grounded, Spark; Runic Carving | Mountain Fury: Stamina 21+9+6=36, recovery 12, winded 18, speed 5, stability 0+2+1=3, size 1M. |
| B | Same background/class/kit as A; Great Fortitude + Stand Tough | Great Fortitude, Stand Tough | Stamina 30, recovery 10, winded 15, stability 2; weakened immunity; core Might remains 2. |
| C | Same background/class/kit as A; Grounded + Stand Tough + Stone Singer | Stone Singer, all one-point choices together | Stamina 30, stability 3; unchanged core Might; readable Stone Singer and Runic Carving. |

Create each independently in pinned Forge `5a846aadb623a9855a023e9403bb887a956c341f` and Salient.
Use identical names, all selections, optional language vacancy, no complication, and no permanent
rune choice. Retain authentic Forge exports/readable sheets and Salient saved/reloaded readbacks.
Capture source text for Detection/Light/Voice and Stand Tough/Stone Singer in the actual UI.
A is the browser journey: create, save, reload, inspect health/stability and rule cards. B/C can
reuse that persistence journey while comparing their observed saved builds. No captures yet.

Shared wiring and generated corpus are included: 491 entries, including Dwarf ancestry and every
trait source. Remaining: browser regression and actual same-build Forge comparisons; final independent
implementation/rules review; verified integration and shared-app update.

## Check evidence — 2026-09-20

Named CT114 environment `character-restart`; main and abandoned environment untouched. Source archive
identity `ab09910bed01587d577a9bebd856a673523f42ea5b80150c94cdb8fd05f8cd6e` was main `6459c8d`
plus this candidate. Generated corpus and formatting were retrieved before commit; production/tests
match the checked tree. Later additions are documentation and evidence only.

- `pnpm content:build` and targeted Prettier: [log](evidence/V60/checks/generate.log), [exit 0](evidence/V60/checks/generate.exit).
- `pnpm exec tsc --noEmit && pnpm exec vitest run --project engine tests/character-v60-dwarf.test.ts`: [log](evidence/V60/checks/focused.log), [exit 0](evidence/V60/checks/focused.exit).
- `pnpm check`: [log](evidence/V60/checks/check.log), [exit 0](evidence/V60/checks/check.exit).
- [Independent preliminary review](reviews/V60-dwarf-review.md) found no static defect; final acceptance awaits external/browser evidence.

Committed logs strip ANSI colors and trailing whitespace only. Original bytes retained in
`/srv/presidium/projects/salient/character-restart-evidence/v60-checks.tar.gz`.
