# V91: Process trim

Rules review: not required. Depends on: None.

## Goal

Replace the accumulated instruction and process text with the smallest set that keeps the project's
real constraints: rules and mechanics cite and are tested against the pinned Compendium, no guessed
rules, pinned vendors, no external publication without instruction, headless proof, one test
coordinator. Everything else (queue rows, certificates, per-job documentation commits, record
fingerprinting, per-commit review trailers, twelve-section slice documents, duplicated instruction
files, 300-word Chords messages) goes.

## Scope

- `AGENTS.md` becomes the single instruction file; `CLAUDE.md` and `agent.MD` are deleted and the
  previous `agent.MD` text is archived at `docs/decisions/2026-09-20-instruction-archive.md`.
  Markdown links to the deleted files now point at `AGENTS.md`.
- `docs/build/README.md`, `testing-process.md`, `docs/development-process.md` and
  `docs/build/_template.md` rewritten; every heading anchor other documents link to is kept.
- `docs/build/STATUS.md` reduced to one row per slice; the test execution queue and narrative
  sections are gone (Chords and the slice work logs hold that history).
- `scripts/check-commit.ts`: `Verified:` and `Rules-Review:` optional; with `--merge`, `Reviewed-By:`
  is required only on the tip commit of the range. `scripts/check-links.ts` checks `AGENTS.md` and
  `testing-process.md` instead of the deleted files.
- Spec: `docs/build/README.md#commit-format`, `docs/build/README.md#slice-lifecycle`,
  `testing-process.md#coordinator-procedure`.

Out of scope: the specs under `docs/`, `docs/remote-development.md`, the product-intent text (archived,
not merged into specs), GitHub Actions.

## Acceptance checks

1. `pnpm check-links` passes over all Markdown including the archive.
2. `tests/scripts/check-commit.test.ts` passes with the relaxed rules; `--merge --range` accepts a
   range whose earlier commits lack `Reviewed-By:` and rejects one whose tip lacks it.
3. `wc -w` of `AGENTS.md`, `docs/build/README.md`, `testing-process.md`,
   `docs/development-process.md` and `docs/build/STATUS.md` totals under 4,000 words (was 21,600).

## Work log

- 2026-09-20 — Built by Fable thread `11881977` in `.worktrees/process-trim` on `slice/V91` from
  main `2297565`, on the user's instruction to cut aggressively. Authoring checks: links, the
  checker's focused test, lint and web typecheck. TESTER V90 result folded into the testing process
  (opt-in three local workers).
