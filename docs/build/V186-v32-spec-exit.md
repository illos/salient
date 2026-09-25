# V186: Level-up capture spec leaves the editor by navigation

Rules review: not required (browser spec only). Depends on: V185.

## Goal

After V185, the V32/V164 capture reached the full editor, then failed looking for an "Exit" button. The
reworked builder (V96) has none. The spec now returns to the character sheet by URL; no choice was changed.

## Acceptance checks

1. Test-Deploy capture of `tests/browser/v32-progression.spec.ts` gets past the editor to the History preview
   and restore.

## Follow-up found

V96 (`f9d5413e`, "give the wizard the site's navigation") removed the wizard's Exit button. Eight other
browser specs still click or expect it, and would fail if run:

- `v21-wizard`, `v25-elementalist`, `v37-supporting-choices` (three places)
- `v40-unsaved-wizard`, which tests Exit's unsaved-changes prompt, so it needs a redesign rather than a
  one-line change
- `v42-primary-choice`, `v58-polder`, `v62-ancestry-smoke`, `wizard`

They are not in the gate. They are logged in `docs/build/browser-coverage-backlog.md` for a wizard spec
refresh.
