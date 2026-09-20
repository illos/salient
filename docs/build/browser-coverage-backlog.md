# Browser coverage backlog

Status: active during the [browser testing moratorium](README.md#browser-testing-moratorium--2026-09-20)
that began 2026-09-20. Every thread appends here instead of running browser tests.

Purpose: while verification is headless-only, record the UI behavior each slice would have checked
in a browser, so the coverage is not lost and can be run in a later pass once
[V66](V66-browser-test-harness-repair.md) has repaired the harness. Log only what a browser can
see: layout, focus, dialogs, drag, theme, error boundaries, route transitions, screenshots for the
user. Do not log persisted-value checks; those belong to the headless proof in the slice work log.

Rules:

- One row per scenario. Append; do not edit other threads' rows except to mark them run.
- `Existing spec` names the current `tests/browser/*.spec.ts` that covers or would cover it, or
  `new`.
- `Priority` is `spot` (must be in the first post-moratorium pass), `later`, or `retire`
  (redundant with headless proof; propose removal of the browser assertion).
- When the scenario is eventually run, fill `Run` with the date, commit and result.

| Date | Slice | Scenario a browser must see | Existing spec | Priority | Headless proof reference | Run |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-20 | V42 | Full Fury wizard → admission → table journey never passed as one run on CT114 | `wizard.spec.ts` | spot | V65 headless lifecycle, pending | |
| 2026-09-20 | V58/V59 | Intermittent closeout timeout; page error boundary replaces table | `closeout.spec.ts` | spot | V59 evidence | |
| 2026-09-20 | V62 | Older wizard journey unresolved on hosted | `wizard.spec.ts` | later | V65 remote headless run | |
| 2026-09-20 | V45 | Two password-recovery scenarios and the Workers immutable-cache scenario skipped (fixtures absent) | `password-recovery.spec.ts`, `reference-cache.spec.ts` | later | V39 backend tests | |
