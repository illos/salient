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
| 2026-09-20 | V63 | Consecutive correction controls stay visible; Undo/Redo and Director/manual boundaries display correctly | `tests/browser/v26-baseline.spec.ts` | spot | [CLI lifecycle and pre-pause checks](evidence/V26/corrections-2026-09-20/README.md) | |
| 2026-09-20 | V26/V63 | Ten-ability source dialogs, log cards and reloaded table display remain readable through proper-turn navigation | `tests/browser/v26-baseline.spec.ts` | spot | [Correction CLI proof](evidence/V26/corrections-2026-09-20/v63-headless-readback.json); broader arithmetic in existing app suites | |
| 2026-09-20 | V70/V71 | Hakaan/Orc choice labels, conditional Artisan selector and trait source dialogs display correctly | new | later | V69 authenticated character runner | |
| 2026-09-20 | V68 | Campaign home layout: header meta and buttons, member cards with badges and presence dot, session rows, chat pane beside history | `v21-campaign.spec.ts` (obsolete: asserts removed next-session tiles, invite card, member rows, foe chips, role tag, command disclosure) | spot | `scripts/v68-headless.ts` report in `docs/build/evidence/V68/` | |
| 2026-09-20 | V68 | Manage players pop-up opens from INVITE PLAYERS, MANAGE PLAYERS and the request count; scrolls to the section; focus trap and Escape | new | spot | headless: `campaigns.approveRequest`, `characters.approve` steps | |
| 2026-09-20 | V68 | Start session confirmation lists every member and starts; header switches to OPEN THE TABLE / PAUSE / END | `v21-campaign.spec.ts` | spot | headless: start-with-all-members step | |
| 2026-09-20 | V68 | RECAP drill-in replaces the list, shows the read-only notice and the session's log, Back returns | new | later | headless: recap `events.list` step | |
| 2026-09-20 | V68 | Chat pane: composer sends on Enter, list scrolls to the newest message, second client sees it live | new | later | headless: chat step | |
| 2026-09-20 | V68 | Presence dot turns green for a second connected client and grey after it leaves | new | later | headless: presence step | |
| 2026-09-20 | V74 | Trait-granted action cards preserve source conditions; Dwarf rune control and refreshed maneuver display agree after change and undo/redo | new | later | `scripts/headless/trait-abilities.ts` and ancestry/rune app tests | |
| 2026-09-20 | V76/V82 | Dragon Knight initial Wyrmplate and conditional Prismatic Scales selectors have clear distinct labels; source dialogs and action cards fit without clipping | new | later | V82 character headless journey and Forge saved-readback comparisons; acceptance passed | |
| 2026-09-20 | V77/V78/V80/V81 | New ancestry purchase controls, Psionic Gift nested selector, trait descriptions and granted action cards remain readable; focus remains usable when a conditional selector disappears | new | later | V82 headless creation/replacement journeys and focused ancestry tests; acceptance passed | |
| 2026-09-20 | V79/V82 | Revenant Former Life selector and combined native/borrowed purchase list clearly show the current former ancestry and budget; nested choices, immunity/weakness summaries and provenance dialogs display correctly | new | spot | V82 Revenant headless replacement journey and Forge borrowed-trait witnesses; acceptance passed | |
