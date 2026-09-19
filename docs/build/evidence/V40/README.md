# V40 verification evidence

Target: CT114 isolated `characters` environment, compose `salient-characters-dev-2389e144b9dd`.
Application validation ran only on CT114. Source pins and content are unchanged; no reset or reseed.

## Checks

[Check log](check.log): lint/types and 674 tests passed (274 engine, 400 app/tooling). The aggregate
command stopped at a pre-existing V39 review link pointing to a renamed heading.
[Completion log](check-completion.log): after repairing that documentation link, the remaining
link/vendor/content/supporting-choice/Foes checks and production build passed. The existing large
bundle warning remains outside this persistence/UI change.
[Final lint and production build](final-check.log) passed after the route/pending-edit fixes and
fixture updates; production build includes the application TypeScript check.

## Browser verification

[Focused draft journey](draft-browser.log) passed on the final route and pending-edit guards.
It proves no character during preview, blank-name rejection, Exit and reload; atomic first save
with authored text and choices; reopening, subsequent same-identity saves and first Save and close.
It holds the first create request in transit, verifies no persisted record, attempts a custom
characteristic drop while saving, and confirms that the submitted choices cannot change.

[Regression run](regression-browser.log) passed seven journeys (account/session/private-draft,
rule popup, three theme scenarios, wizard layout and complete Elementalist build/admission).
The legacy Fury walkthrough needed its old unsupported label, perk control, Complication-step
assertion and Mountain source-link selector updated to the existing V37 UI.

Initial runs are retained: [old test selectors and campaign timeout](browser-initial.log), and
[first-save route transition](browser-transition.log). The first run was stopped after obsolete
Name selectors; the campaign timeout occurred before character entry. The next run exposed a
conditional `useParams` hook call when moving from new to saved; the route now reads params exactly
once. Independent review also caught custom drag/drop remaining active inside a disabled fieldset;
selection and authored callbacks now refuse changes while saving. These fixes are covered by the
final focused journey. Failed runs are not counted as passes.

Screenshots: [Details before first save](unsaved.png), [saved draft after editing](saved.png).
The Details screenshot is scrolled to private notes; persisted assertions come from authenticated
application readback, not from screenshots alone.

## Delivery

Implementation `af69671b6469ecaaf55e1374d9cbb5a859e13f5d` is merged and running on
[shared CT114 main](https://salient-dev-fc4f48cb09a0.tail41404c.ts.net).
[Runtime identity](shared/runtime-status.json) records the established `main` environment and
`salient-dev-b90776c53141` compose target, same vendor pins and retained play-data volume.
Its source dirty flag comes from peer-owned untracked performance-audit documentation; runtime
code matches the reviewed commit. No migration, reseed, reset or hosted release was performed.

[Both actual shared browser scenarios](shared/browser.log) passed in 32.1 seconds: the complete
V40 unsaved/first-save/pending-drop/reload/edit journey and the existing wizard layout/persistence
journey. See [shared unsaved Details](shared/unsaved.png) and [shared saved character](shared/saved.png).
Verification used disposable accounts without modifying existing user records. The isolated
`characters` services were then stopped, preserving their volumes; shared main remains running.
The documentation closeout needs no further runtime update.

The full Fury flow reached its shared-table repeated-action loop after passing wizard, admission
and audience checks. One run then failed because `targets:drafts` hit the anonymous backend's
one-second execution limit (backend log, 2026-09-19 05:11:53 UTC; [failed run](fury-timeout.log)); the table error boundary
produced zero log rows. The [bounded rerun](fury-browser.log) passed the full journey in 3.8 minutes. No table implementation,
query limits, source rules or test count invariant were changed.

Final unique browser coverage: **nine scenarios pass** across the focused draft journey, seven
regression journeys, and the full Fury/admission/three-audience/table journey. The table run
includes its existing 60 real condition toggles and closeout; no broader performance claim is made.
