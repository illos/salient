# V34 — Sitewide Core presentation

Status: Complete; merged into main and verified on shared CT114 runtime, 2026-09-17. Primary track: UI. Rules review: not required (presentation only).

## Scope and dependencies

User approved the V33 study and requested sitewide rollout. Depends on committed V33
`bc773c1` and integrated V31/main. Owning specification:
[Core presentation](../monster-presentation-spec.md#presentation),
[automatic ARIA](../monster-presentation-spec.md#automatic-aria-contract), and
[headless boundary](../monster-presentation-spec.md#headless-remains-ordinary-text).

## Acceptance

- One sanitized source projection presents known stat grids, ability metadata, tiers and glyphs
  across Rules pages, linked previews, Foes and hero/live sheets; preserves complete text and links.
- All finite glyph meanings receive automatic roles/names, unknown patterns stay readable;
  code/URLs remain literal. No caller-owned accessibility labels.
- Headless/source data, archived Foe editions, state, gameplay and permissions remain unchanged.
- Native accessibility, keyboard, blocked-font fallback, themes, narrow containers and enlarged
  text verified on live consumers; heading anchors remain stable; corpus coverage is audited.
- Full check, independent review, integration into main and verification of shared CT114 runtime.

## Work log

- 2026-09-17: Claimed UI worktree `slice/V34`, based on committed V33; named CT114 `ui` for
  validation, then established shared `main` runtime for authorized rollout. Shared presentation
  module and Rules ingestion are the integration seams; Foe edition HTML is projected without
  rewriting source archives. Hero abilities use complete source text where available. No mechanics
  or backend schema changes planned. Production and study use the same glyph descriptor.

- Shared sanitized HAST projection now handles Core stat grids, feature title/cost bands, metadata,
  tier lists, inline source markers/potencies and contextual characteristic expressions. Full hero
  source and embedded kit bodies retain effects; Director snapshots retain their original revision.
  Source edits and new gameplay are not part of this slice.
- CT114 `ui`: full `pnpm check` passed **444 tests** (97 engine + 347 app/scripts), lint, typechecks,
  links, content/Foe/vendor checks and production build. Seven Chromium browser tests passed in
  1.5 minutes, including the existing V21 sheet controls, native AX, font failure, keyboard/focus,
  semantic text selection, narrow/enlarged content, and live Stamina reload/audience boundaries.
- The source-to-render audit passed 2,614 records and **14,402 occurrences**, with zero missing
  tokens or unknown-pattern fallbacks. Review caught formatted/dice-prefixed damage forms; the
  corpus caught a blank stat placeholder and duplicated source stat row. All remain fully readable.
- [Evidence](evidence/V34/README.md) records commands, counts, screenshots, AX trees and limits.
  No changes to backend/headless/canonical source/archived Foe edition bytes. Initial type/fixture
  harness errors and the two detected corpus gaps were fixed before the final passing checks.
- [Independent presentation review](reviews/V34-presentation-review.md) passed on 2026-09-17;
  all findings resolved. Main integration and shared-runtime verification follow this checkpoint.
- Integrated V33 `bc773c1` and V34 `e3ae838` into `main` by fast-forward. Commit integration gate
  passed for both reviewed commits. `presidium-dev up` from the canonical main checkout updated
  CT114's established local-anonymous `main` environment, Compose `salient-dev-b90776c53141`, at
  [the shared playable URL](https://salient-dev-fc4f48cb09a0.tail41404c.ts.net).
  Runtime metadata confirms clean source `e3ae838ccf8272b565a45d31dd5ce041ec1f59e6`;
  backend healthy, frontend HTTPS verified, Rules regenerated with no unresolved links.
- All three V34 browser scenarios passed on shared `main` in 35.3 seconds, including authenticated
  character/Director views, embedded previews, native AX, font fallback, keyboard navigation and
  live Stamina reload. [Main rollout evidence](evidence/V34/README.md#shared-main-rollout)
  records the final log and screenshots. Existing data volume was reused; no database reset,
  migration or canonical content seed. Browser fixtures created their own test accounts/campaign.
  The completion-record commit changes documentation only and needs no further runtime sync.
