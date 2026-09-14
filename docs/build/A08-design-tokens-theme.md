# A08: Design tokens and theme migration

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 (tokens) / V1 (finished polish) |
| Owner type | App team |
| Rules review | not required |
| Depends on | None (coordinate file ownership with A03 for `web/table/**`) |
| Unblocks | V17 |
| Status | see `STATUS.md` |

## Goal

Turn the final V1 mockups' visual language into a documented token set and a component baseline, then
migrate the existing prototype UI from its dark-green/gold theme to that system. Content, labels and
behavior come from the written specs, never from the pictures; the mockup README's departures list is
binding. Finished polish is not a v0.01 gate, so this slice ends when tokens exist and the shell uses
them, not when every screen is pixel-matched.

## Spec references

- `docs/design-mockups/v1/README.md` — style authority, known departures, visual tokens subsection.
- `docs/v1-tech-stack-spec.md#2-recommended-stack` — Tailwind confirmed; shadcn/ui on Base UI and Motion
  recommended.
- `docs/v1-tech-stack-spec.md#6-visual-quality-and-sustained-performance` — project design system
  requirement; no memory growth from animation.
- `docs/v1-tech-stack-spec.md#5-browser-state-and-table-resource-lifetimes`
- `docs/character-sheet-spec.md#layout-and-content` — compact header, wrapping, no decorative boxes.
- `docs/table-spec.md#confirmed-combat-layout` — three panes and role differences.
- `agent.MD` "For v0.01, focus on desktop; all current UI is temporary" paragraph.

## In scope

- `docs/design-tokens.md`: font stack (Schibsted Grotesk with system fallback and the license/source of
  the font file), light and dark color scales with hex values chosen to match the mockups, the brick-red
  accent, border and rule weights, spacing and type scales, radius, motion durations, focus and disabled
  states. Record which values were measured from the mockups and which were chosen.
- Tailwind theme configuration exporting those tokens; CSS variables for light/dark/system with the
  preference persisted per user (account preference storage may be a local setting until V10).
- shadcn/ui installed with the Base UI variant if compatible with the pinned React and Vite; if not, record
  why and use a minimal in-repo component set. Buttons, inputs, tabs, dialog, toggle, checkbox, table,
  card, tooltip.
- Migrate `web/style.css` and existing components (login, campaigns, characters, foes, router shell) to
  the tokens and top-nav layout shown in the mockups; remove the sidebar shell.
- Reduced-motion support and no animation that retains references across a long session.

## Out of scope

- Implementing mockup content that the departures list forbids.
- Mobile and tablet layouts (V17). 3D dice (V16).
- Portraits, artwork, or copying any Draw Steel artwork.

## Inputs and dependencies

None hard. Coordinate with A03 by claiming `web/style.css`, `web/ui.tsx` and the shell first, and leaving
`web/table/**` to A03 to build on the tokens once they land.

## Deliverables

- `docs/design-tokens.md`, Tailwind and CSS variable configuration, `components.json` if shadcn is used
- Migrated shell and existing screens
- Screenshots of login, campaign home and character list in light and dark saved under `.playtest/`
  (ignored) and referenced in the work log

## Acceptance checks

1. Every color used in `web/` resolves to a token; a grep for raw hex values in components returns none.
2. Light, dark and system preference switch without reload and persist across reload.
3. `prefers-reduced-motion` disables transitions (checked in a browser test with the media emulation).
4. The login and campaign pages visually match the mockups' structure: top nav, hard rules, brick-red
   primary action, uppercase metadata; the reviewer compares screenshots to the PNGs.
5. No element listed in the mockup README departures appears in the migrated screens.
6. `pnpm check` and the existing browser journey pass unchanged in behavior.

## Rules research

None.

## Open questions

- Q-HAND-1 answered 2026-09-14: no. The login footer carries no "Draw Steel compatible" or similar
  phrase.

## Work log

### 2026-09-14 — Plan (implementer: Claude Fable 5.1, worktree `slice/A08`)

Spec sections read in this checkout: `docs/design-mockups/v1/README.md` (all sections, all eight
PNGs viewed), `docs/v1-tech-stack-spec.md#2-recommended-stack`,
`docs/v1-tech-stack-spec.md#5-browser-state-and-table-resource-lifetimes`,
`docs/v1-tech-stack-spec.md#6-visual-quality-and-sustained-performance`,
`docs/character-sheet-spec.md#layout-and-content`, `docs/table-spec.md#confirmed-combat-layout`,
`agent.MD` ("For v0.01, focus on desktop; all current UI is temporary"). No discrepancy between the
slice summary and the cited sections. The mockup README's "Visual tokens" subsection confirms that
exact values are a build deliverable, so the hex values below are measured or chosen here.

Plan:

- Measure the mockup PNGs with a headless Chromium canvas (no online lookup): foundation, surface,
  rule, muted text and accent colours in light and dark; record measured vs chosen in
  `docs/design-tokens.md`.
- Run the shadcn CLI (`shadcn@4.21.0`, Base UI variant, `nova` preset) against `web/style.css` with
  the `@/*` → `web/*` import alias (tsconfig + Vite). Probe in a scratch project confirmed it accepts
  the pinned React 19.3.0 / Vite 8.3.0 / Tailwind 4.3.3. Pin every added dependency exactly; replace
  the preset's Geist font with `@fontsource-variable/schibsted-grotesk` (OFL-1.1).
- Rewrite the generated CSS variables to the token set (light `:root`, dark `.dark`, system by
  `matchMedia`), keep the shadcn variable names so the components stay on the registry contract, add
  the project's type, rule, motion and focus tokens, and a reduced-motion block.
- `web/theme.ts`: `useTheme()` with `localStorage` key `salient.theme` (light | dark | system),
  system listener, and an inline pre-paint script in `index.html` so a reload does not flash.
  Account preference storage waits for V10.
- Migrate `web/router.tsx` (top nav: wordmark, Campaigns, Characters, connection status, theme
  switch, user name, Sign out; sidebar removed), `web/campaigns.tsx`, `web/characters.tsx`,
  `web/foes.tsx`, `web/ui.tsx` to the components and tokens without changing labels, roles or
  behavior the browser journey depends on. Apply Q-HAND-1: remove "Draw Steel" product phrases from
  the login eyebrow, the page title and the old sidebar wordmark.
- Browser tests: keep `tests/browser/journey.spec.ts`; add `tests/browser/theme.spec.ts` for
  acceptance checks 2 and 3 and to capture the six screenshots under `.playtest/a08/`.
- Verification: `pnpm check`, `pnpm test:browser`, grep for raw hex in `web/**`.

Environment: the worktree had no `.env.local`; copied from the main checkout. It points at the
running local backend on 127.0.0.1:3212/3213 (pid 2801309, deployment `anonymous-agent`, state in
`/srv/presidium/projects/salient/code/.convex/local/default`). The 3210/3211 backend belongs to
another project and is not touched. Motion (the library) is not added in this slice: the migrated
screens have no panel or roster transitions, so CSS transitions with the reduced-motion block cover
section 6; A03 can add Motion when the table needs it.

### 2026-09-14 — Verification and closing entry (implementer: Claude Fable 5.1, worktree `slice/A08`)

Environment: the worktree's `.env.local` (copied from the main checkout) points at the running local
backend on 127.0.0.1:3212/3213 (pid 2801309, orphaned `convex-local-backend`, deployment
`anonymous-agent`, state in `/srv/presidium/projects/salient/code/.convex/local/default`). The
3210/3211 backend (pid 2032007) serves another project and was not touched. `pnpm dev:backend`
refused to attach ("A local backend is still running on port 3212"), so functions were pushed with
`pnpm exec convex dev --once --url http://127.0.0.1:3212 --admin-key <from config.json>`; that
command removed `CONVEX_DEPLOYMENT` from the worktree's ignored `.env.local`. Vite ran as
`pnpm dev` with its log at `.playtest/a08/vite.log`; it was stopped afterwards. No seed scripts
were run; the browser tests create their own accounts and campaigns.

Commands and output:

- `pnpm check`: lint (ESLint + Prettier) clean; engine 28 tests; app + scripts 42 tests; check-links
  "Checked 115 Markdown files: no broken relative links or anchors."; check-vendor "matches the
  pinned submodule commits (2 submodules)"; foes:source "snapshot matches"; `vite build` ✓ 525
  modules (index CSS 67.87 kB, JS 496.68 kB, two Schibsted Grotesk woff2 files).
- `pnpm test:browser`: 4 passed (32.4s) — `journey.spec.ts` (23.5s) and the three tests in
  `theme.spec.ts` (theme switch/persistence 1.8s, reduced motion 0.7s, screenshots 5.9s).
- `grep -rnE "#[0-9a-fA-F]{3,8}\b" web --include=*.tsx --include=*.ts | grep -v web/style.css`:
  no matches. `grep -rni "draw steel" web index.html`: no matches.
- shadcn compatibility probe: `shadcn@4.21.0 init --template vite --base base --preset nova`
  against React 19.3.0 / Vite 8.3.0 / Tailwind 4.3.3 completed in a scratch project and in the
  worktree; the CLI first wrote to a literal `@/` directory because the root `tsconfig.json` had no
  alias, so `paths: {"@/*": ["./web/*"]}` was added to both tsconfigs and a Vite alias before
  re-running.

Acceptance checks:

1. **verified** — grep above returns nothing; every colour in components is a token utility.
2. **verified** — `theme.spec.ts` "light, dark and system preference switch without reload and
   persist across reload": Dark click → `html.dark` and `localStorage.salient.theme = dark` with no
   navigation; reload keeps it and the Dark toggle is `aria-pressed=true`; Light ignores an emulated
   dark system scheme across reload; System follows `emulateMedia` colour-scheme changes live and
   across reload.
3. **verified** — "prefers-reduced-motion disables transitions": the Sign in button's computed
   `transition-duration` is `0.12s` under `no-preference` and `0s` under `reduce`; `--motion-base`
   resolves to `0s`.
4. **verified by the implementer, reviewer comparison pending** — screenshots at
   `.playtest/a08/login-light.png`, `login-dark.png`, `campaign-home-light.png`,
   `campaign-home-dark.png`, `characters-light.png`, `characters-dark.png` (1440×960 viewport, full
   page). Top nav with wordmark, uppercase items and a hard rule; split login with the brick-red
   primary action; hard rules under page and section headings; uppercase metadata (eyebrows, badges,
   button labels, counts).
5. **verified** — the migrated screens carry no Library nav item, no Call for test / Give hero
   token / Respite / Session reminders controls, no combat-table elements, no Draw Steel phrase.
   Membership tags remain Director / Player / Observer derived from session selection, as the
   campaign page did before this slice (see `docs/design-tokens.md#migration-notes`).
6. **verified** — `pnpm check` and `journey.spec.ts` pass unchanged; the journey file was not
   edited. One presentation adjustment was needed to keep it unchanged: the session-player and
   foe-visibility checkboxes stay native inputs because Playwright's `getByLabel` resolves the Base
   UI checkbox to two elements (its `role=checkbox` span and its hidden input).

Deviations and leftovers: Motion (the library) is not installed (no transitions to own yet; see the
plan). `dialog`, `tabs`, `table`, `tooltip`, `select`, `separator`, `toggle` and `checkbox` are
installed but unused by the migrated screens. Independent review is deferred to the user's audit
thread per the lead's process change; commits carry no `Reviewed-By:`.
