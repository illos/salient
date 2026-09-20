# V75 Quiet theme — screenshots for the user, 2026-09-20

These are **manual screenshot captures the user asked for**, allowed by the
[browser testing moratorium](../../README.md#browser-testing-moratorium--2026-09-20) as evidence
for the user. They are **not** a browser test and **not** acceptance evidence: no spec ran, no
assertion was made, and no acceptance check depends on them. V75's acceptance rests on the
checks in [its slice document](../../V75-quiet-theme.md#acceptance-checks).

## How they were captured

| Item | Value |
| --- | --- |
| Source | `slice/V75` at `98b75ac` plus the accent-budget fix in the commit that adds this directory |
| Runner and target | Presidium local, the permitted peer test environment; isolated stack started from `code/.worktrees/quiet-theme` |
| Backend | Anonymous Convex `anonymous:anonymous-agent`, state `.worktrees/quiet-theme/.convex/local/default` (fresh, 4.5 MB), `http://127.0.0.1:3210`, site `3211`. The main checkout's 166 MB deployment and the shared CT114 app were untouched; `CONVEX_DEPLOY_KEY` was unset for every command so no cloud deployment could be reached. |
| Frontend | `pnpm dev` (Vite) at `http://127.0.0.1:5180` |
| Content | `pnpm content:seed`: 515 entries at pin `fb83a789da8f` |
| Driver | A one-off Node script in `/tmp` using `playwright-core`'s Chromium to navigate and screenshot. No Playwright test runner, no config, no spec file, nothing added to `tests/`. |
| Data | Disposable local development data created through the app's own UI and operations: two accounts, one campaign, one approved membership, one Devil Fury (Berserker) built through the wizard and admitted, three Goblin Warriors, a committed combat in round 1. |
| Viewport | 1512 × 950 CSS pixels; `17-sheet-top-dark.png` is a 2× crop |

## The images

| File | Screen |
| --- | --- |
| `01-login-dark.png`, `01-login-light.png` | Login: single centered column on the page ground, wordmark and footer at the edges |
| `03-campaign-home-dark.png` | Campaign home (V68 layout, re-skinned): header, member cards, session history, chat pane |
| `06-wizard-class-dark.png` | Wizard: step rail, choice tiles, "hero so far" panel |
| `07-character-sheet-dark.png` | Character sheet, full page: stamina panel, stats, skills, conditions, abilities, kit, features |
| `17-sheet-top-dark.png` | Character sheet header at 2×: identity line, characteristic tiles, stamina panel, kit tiles |
| `12-table-combat-dark.png` | Session table, Director, combat committed: three panels, roster, log, heroes pane |
| `15-table-player-turn-dark.png` | Session table, player, round 1: turn tracker, acting hero outline, dice chips in the log |
| `16-table-combat-light.png` | The same table in the light theme |
| `18-rules-dark.png`, `19-foes-dark.png` | Rules and Foes library chrome: search inset, segmented tabs, tonal filters, results panel |
| `20-foe-statblock-dark.png` | A Core stat block in the overlay panel: the preserved presentation (accent title band, serif body, bold labels, glyph tier badges) inside Quiet chrome |

## What they show about the preserved subsystems

`20-foe-statblock-dark.png` and the ability cards in `07-character-sheet-dark.png` are the visual
confirmation of [preserved subsystems](../../../design-mockups/quiet/README.md#preserved-subsystems):
the Draw Steel glyphs and the Core stat-block and rule-text presentation are unchanged; only the
panel, header, filters and controls around them take the Quiet treatment.

## Known cosmetic notes visible here

- `15-table-player-turn-dark.png` carries a dismissible error toast from an earlier deliberate
  bad command in the capture session. It is app behavior, not a theme defect, and it shows the
  Quiet toast.
- Foe rows in the player's view omit level and Stamina numbers by role-specific design, not
  because of the theme.
