# V42 primary choice verification

Target: isolated CT114 `characters`, local-anonymous backend, existing test volumes preserved.
The source checkout is `characters-build`, branch `slice/V42` from `e28e764` (spec `ed98ca2`).
No schema, rules, backend functions, content or vendor pins changed.

## Verification

- `check-initial.log`: initial lint failure from the React ref-analysis rule, subsequently fixed.
- `check.log`: full `pnpm check` passed, including 274 engine + 400 app/tooling tests, lint,
  types, links, both source pins, content/supporting/Foes checks and the Vite build.
- `fixture-check.log`: final fixture lint, format and TypeScript checks passed after replacing
  primary-radio `check()` with `click()` (the selected control intentionally unmounts).
- `browser-initial.log` and `browser-initial-context.md`: retained test-only detached-radio timeout;
  the captured page already showed the correct Devil summary and dependent controls.
- `browser.log`: the focused V42 interaction/persistence journey passed in 16.0 seconds.
- Existing-journey results, screenshots and their limits are recorded below.

The new browser journey exercises every applicable main section, Edit/Keep preservation, parent
replacement and pruning, pooled Kit availability, None, keyboard focus, full-source dialogs,
unsaved read-only operation and saved/reopened character readback. It proves keeping None and
Artisan leaves revision 1 unchanged on Exit. The affected existing wizard, Elementalist, supporting
choices, layout and unsaved-creation fixtures follow the same main-choice summary interaction.

## Visual and source evidence

`class-step-light-1440x900.png` and `class-step-dark-1440x900.png` show the compact Fury summary,
source icon and Edit button above dependent class controls. `ancestry-editing.png` shows the main
Ancestry chooser with Keep Devil and no dependent controls. `ancestry-selected.png` is scrolled to
the retained trait controls; it does not show the top summary. Images were captured by the passing
V21/V42 journeys, and the light Class plus both Ancestry images were visually inspected by the lead.

`source-sha256.txt` records the tested remote bytes for all eight changed code/test files. They all
match the local worktree after the fixture corrections; application code after the full check suite changed only by the final None guard below. Test-only updates used the remote build helper and were fetched/compared explicitly.

## Regression timeout

`regression.log` records five passing existing journeys (layout, Elementalist, supporting choices,
private inheritance, unsaved entry) and a later failure in the full Fury journey's existing table
stress extension. Character creation, review and the three sheet audiences had already completed.
At 05:51:38–39 UTC the anonymous backend reported one-second query timeouts in `campaigns:get`,
`encounters:current` and `sessions:list`; the table error boundary then left zero visible log rows.
`table-timeouts.log` and `table-error-context.md` retain the evidence. The same class of transient
stress failure is recorded in V40. No table code, query limits or assertions were changed.
The bounded unchanged retry also failed, after the complete Fury wizard/save and during admission.
`fury-retry.log`, `fury-retry-context.md` and `admission-timeout.log` record `characters:submit`
exceeding the same one-second backend limit at 05:53:56 UTC. The full Fury/campaign/table journey
is **not** claimed passing. This presentation slice changes no backend/table code or limits; the
performance thread received the timeout handoff. Six distinct browser journeys have passed.

A final reviewed guard requires the raw optional choice to be absent before summarizing it as None;
an unsupported saved value instead leaves its chooser and diagnostics visible. `final-check.log` records successful final lint/types/build; `final-browser.log` records both V42/V40
journeys passing against that guard in 36.2 seconds. The earlier full-suite pass covers the unchanged
backend/evaluator. Final source hashes match all eight code/test files including this condition.

## Shared delivery

`shared/browser.log` records both V42/V40 journeys passing on actual shared CT114 main in 31.6 seconds.
`shared/runtime-status.json` identifies running source `45426dc8dabc2301b89659998e0f928bfb83b4f0`,
compose `salient-dev-b90776c53141` and the unchanged private HTTPS URL. Existing data was preserved.
The dirty-source flag reflects only peer-owned untracked audit documents in main, not additional
application edits. No hosted release or source-pin update occurred. Isolated characters services
were stopped after delivery with their data volumes retained; shared main stays running.

Acceptance 6 is complete. The broader isolated Fury admission/table timeout limitation above is
still retained; these two shared changed-feature checks do not claim a full table stress pass.
