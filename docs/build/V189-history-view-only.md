# V189: History is view-only; restore deferred

Rules review: not required (presentation switch; no rule added or changed). Depends on: V185
(build History page and restore).

## Goal

User ruling 2026-09-25: "Let's defer restoring for now. Just make the historical copies viewable."
Follow-up direction the same day: "Don't remove the work you've already done, just stash it for
now." The History page and the CLI stop offering restore; the V185 restore UI, CLI verb, helpers
and tests stay in the code behind one shared switch, so re-enabling is a one-line change.

## Scope

- Switch: `BUILD_RESTORE_ENABLED = false` in shared/presentation/buildHistory.ts, citing the ruling.
- UI (web/progression/index.tsx): `RestorePanel` is kept but rendered only when the switch is on,
  with the owner-only and still-loading restore notices and the owner `characters.get` read it
  needs. With the switch off, the page's intro and the Director's notice omit restore wording and
  say recorded builds are view-only. The revision list, "Restored from revision N" labels, the
  comparison with the active build and the full read-only recorded sheet are unchanged.
- CLI (scripts/app.ts): `pnpm app restore` is kept; while the switch is off it prints that restore
  is deferred and exits 1 without calling the mutation. `history` and `history-sheet` unchanged.
- Server: `characters.restore` unchanged. The `history` headless cohort and the lifecycle journey
  keep calling it through the helper (scripts/lib/build-history.ts), which is not the CLI verb.
- Browser spec (tests/browser/v32-progression.spec.ts): the restore, approval and restored-sheet
  steps run only when the switch is on; otherwise the spec asserts the restore region and button
  are absent. The history-preview screenshot and recorded-sheet checks are unchanged.
- Docs: ruling note in docs/character-wizard-spec.md#5-progression-history; V185 note adjusted.

Spec: docs/character-wizard-spec.md#5-progression-history

## Acceptance checks

1. `npx tsc --noEmit` and `npx tsc -p tsconfig.web.json --noEmit` clean; `pnpm -s lint` clean.
2. `npx vitest run --project app tests/app/build-history.test.ts` passes (server restore unchanged).
3. TESTER: `tests/browser/v32-progression.spec.ts` (authored here, not run by the implementer):
   History shows no restore control; the preview and recorded-sheet checks pass.
4. Gate.

## Work log

- 2026-09-25: worktree `.worktrees/history-view-only`, branch `slice/V189` from main `d3ab253`.
  First pass deleted the restore UI and CLI; reverted on the user's follow-up and reimplemented as
  the `BUILD_RESTORE_ENABLED` switch. Authoring checks run; see the commit report.
