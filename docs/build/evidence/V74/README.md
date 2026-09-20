# V74 trait-granted abilities

Implementation: `3f577b1`, integrated with main through `9252b8f` in `6bc25c6`, then
`f28ed6c` corrects the shared evaluator import and adds persisted trait-loss coverage.
Application target: hosted development `different-bat-943`,
`https://salient-dev.rdxx.workers.dev`. Runner: CT114 `hosted` environment.
No browser tests. The private shared main application is a separate environment.

The audit covers 40 ancestry traits across Devil, Polder, Dwarf, Human, Hakaan and Orc.
The catalog exposes 12 sourced actions, including carving and three conditional rune maneuvers.
Effects continue through manual resolution; persisted rune kind controls availability.

The initial full check failed at the engine typecheck because a new relative import omitted its
extension. The corrected run is retained separately; the failure is not a passing result.
Focused local tests pass for trait grants and rune persistence, permissions, retries, undo/redo,
and Dwarf→Devil→Dwarf without resurrecting an old rune. The added ancestry-loss assertions were
run after the full-check snapshot; they change only the test and documentation.

Full `pnpm check` passed (exit 0): 310 engine and 481 app/scripts tests, lint, 319 Markdown
link checks, pinned vendor/content verification and production build. See `check.log`.
Independent implementation and rules reviews pass for `f28ed6c`.

Backend deployment and hosted frontend publication succeeded. Worker version:
`135e58f0-2918-49fb-9806-e70c8c42ce74`. No content reseed or data reset.
The first attempted headless launch was refused because the hosted build held the environment;
no scenario ran in that attempt. The run started after the build finished.
The first authenticated run (`headless-missing-target.json`, 99.173 seconds) passed all 26
existing scenarios. The new rune journey reached its final manual ability use, which failed
because the test omitted the API's required target. Test-only `a2a10df` creates a second admitted
character as the Voice recipient; no application behavior or assertion was weakened.

Forge execution/calibration and all **31 saved public-API comparisons pass**, exit 0 in 52.772
seconds (`live-comparison.json`). All seven previous missing-ability discrepancies are resolved.
`compendiumActionsBeyondForge` explicitly records Stone Singer, Doomsight, Relentless and rune
carving, which Forge keeps as trait prose. It never suppresses unknown differences. Three active
rune maneuvers are play-state grants tested separately, not permanent build choices.

`characters.tar.gz` retains counterpart JSON and all 31 saved Salient sheets; calibration,
summary and bundle inputs retain reproduction details. The bounded comparison and Orc Artisan
limitations documented in V73 still apply; this does not certify combat effect automation.
The corrected authenticated public-API run passes **27/27**, exit 0 in 99.553 seconds
(`headless.json`, runner `a2a10df`, unchanged deployed application `f28ed6c`). This proves
standalone persistence, all rune replacements/removal, duplicate/stale/unauthorized refusals,
campaign sheet/table grants, owner undo/redo, and manual Voice use against an admitted recipient.
All existing character creation, progression, review/privacy and resource-preservation journeys pass.

No browser run or automated gameplay-effect certification is claimed. Main fast-forwarded to `b73cb8d`, then CT114 shared main was updated at the existing URL
`https://salient-dev-fc4f48cb09a0.tail41404c.ts.net`. The first main run exposed its older reference
content snapshot (`main-headless-old-content.json`); loading the pinned 515-entry content snapshot
corrected that rollout omission without changing characters or campaign data. The subsequent
shared-main authenticated run passes **27/27**, exit 0 in 27.484 seconds (`main-headless.json`).
Runner and application are both CT114 main; `http://backend:3210` is its internal backend URL.

Main integration uses the same application tree as the passing fullcheck and hosted proof;
subsequent changes are generated type declarations, the reviewed target fixture, and documentation.
Final canonical-checkout links pass; the sparse worktree's separate link attempt lacked vendor
files and was not a content failure. No duplicate full build was needed for documentation.
