# V32 verification evidence

Date: 2026-09-16. Branch: `slice/V32`, based on `f7137dc`. This is isolated branch verification;
V32 has not been merged or installed in the shared playable app.

## Targets and source identity

- Local anonymous backend `http://127.0.0.1:3230`, HTTP/auth site `3231`, built frontend preview `5290`.
- Compendium: `fb83a789da8f0327a389c277a0c790b1648d5810`; generated authenticated content: 473 entries.
- Forge source reference stays pinned at `5a846aadb623a9855a023e9403bb887a956c341f` (14.197.0).
  Actual website capture observed 14.199.0. Neither pin was changed.

## Completed checks

[Full-check log](check.log): `VITEST_MAX_WORKERS=1 pnpm check` passed 455 tests
(106 engine, 349 app/scripts), lint/types, documentation links, vendor/content/foe checks and build.
Later presentation-only fixes have a separate targeted type/build check before the final browser run.

The independent fixture contains 62 source-ledger rows. Both the source/evaluator reviewer and the
fresh whole-slice reviewer independently verified the source hashes. See
[the rules report](../../../reviews/V32-rules-review.md) and
[whole-slice review](../../../reviews/V32-independent-review.md).

## Actual Forge reference

[Reference metadata](../../../research/v32-forge-reference.json) records the actual website
creation, export, import, level-up and reimport workflow, 24 artifact hashes and precise differences.
Level-one and level-two exports survive Forge's own reimport/export with only the collision-generated
hero ID changing. [Captured level-two sheet](forge-level-two-sheet.png).

[Active selection comparison](forge-selection-comparison.json) additionally checks 17 serialized
active grants, 10 skills, five characteristics and identity directly from the actual level-two export.
Only current-level features, selected subclass, selected nested options/kits and selected ability IDs
were counted. Higher-level and unselected definitions are not active grants. Case normalization covers
Forge's `Pain For Pain` versus the pinned source's `Pain for Pain`. Culture edge and free strikes are
shared grants checked separately against source and captured reference display.

Raw exports, traces and reference screenshots remain retained in the character worktree's ignored
`.playtest/v32/forge-reference/` directory; these captures do not implement Salient interchange adapters.

## Completed browser acceptance

The [combined regression run](browser-regressions.log) passed both the existing Elementalist
wizard/reload/review/source journey and the new Fury progression/history journey (54.1 seconds).
Final screenshot review found that inherited class features displayed the current hero level;
corrected the presentation to use each feature's source level. The [final focused run](browser.log)
passed in 38 seconds with explicit Ferocity L1 and Unstoppable Force L2 assertions.

[Authenticated readback summary](readback-summary.json) records every independent fixture field
and 20 byte-exact source grants, 20/30→20/39 advancement without healing, and restored Stamina 39→30
only after Director approval. Baseline and authored details exactly match the original build;
later history is retained. Draft save/reload, full-editor level-two retention, source dialogs,
read-only history preview and Director privacy were exercised in the real application.

Screenshots: [advancement](advancement-ready.png), [level-two sheet](level-two-sheet.png),
[history preview](history-preview.png), [restored sheet](restored-sheet.png).
The [final targeted build](final-build.log), TypeScript and scoped ESLint checks pass.
All isolated services were stopped after verification; ports 3230/3231/5290 have no listeners.

### Resolved verification interruptions

Earlier attempts are preserved under `.playtest/v32-browser-attempt*.log`:

1. Login timeout during Vite dependency optimization under host memory pressure.
2. Successful real advancement with current Stamina 20 retained while maximum 30→39; source-readback
   test then failed because its local file path doubled the `vendor/steel-compendium` prefix. Fixed.
3. Actual Convex one-second execution timeout under memory pressure before level-up choices.

No assertions or backend limits were relaxed. The branch services were stopped while waiting for a
coordinated single-browser test window. The subsequent complete runs above resolve this gate.
