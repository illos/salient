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

_Empty._
