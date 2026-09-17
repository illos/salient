# V32 integration evidence — 2026-09-17

Rebased implementation `73b7ab4` on main `a0ac6d4`, plus the focused Wrecking Ball browser
assertion. CT114 named environment `characters`, Compose `salient-characters-dev-2389e144b9dd`,
HTTPS origin `https://salient-characters-dev-aa988a1a3752.tail41404c.ts.net`.

- [Full check](check.log): 466 tests, lint/types, source/vendor/foe checks and build pass.
- [First browser run](browser-first.log): Elementalist, Fury progression and sheet scenarios pass;
  table audit failed due to a backend authentication timeout.
- [Unchanged table retry](table-retry.log): passes in 1.5 minutes, no limits/assertions changed.
- [Persisted readback](readback-summary.json): 20/30 to 20/39 without healing, reviewed restore
  to level one with downward cap and all chronological revisions retained; 20 exact source grants.
- [Advancement](advancement-ready.png), [level-two sheet](level-two-sheet.png),
  [history preview](history-preview.png), [restored sheet](restored-sheet.png).

The level-two screenshot was visually inspected, including full Wrecking Ball source and its
additional targeting paragraph. Generated backend API types match the checked-in declarations.
Raw readback remains in the remote artifact archive and `/tmp/v32-integration-evidence.tar.gz`;
this directory retains a compact summary. Shared-main rollout is recorded separately in the slice.
