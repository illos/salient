# V161: Respite and level-up design

Rules review: required. Depends on: V01 research, V32.

## Goal

Settle the respite product questions and the level-up flow that depends on them, so V01 (respite loop)
and generic level-up for all eleven classes can be built. Design only: no code.

## Scope

- Record the user's rulings in the owning specs as they are made, one question at a time:
  `docs/table-spec.md#respite-mode`, `docs/character-wizard-spec.md#level-up`, and the decision queue
  in `docs/research/respite-rules.md#8-product-decision-queue`.
- Open questions from that queue: 2 (respite across sessions), 4 (level-up choices before or after
  respite completion), 5 (interruption), 6 (optional ability swaps and alternative advancement),
  7 (finishing with unused optional choices), 8 (reversing a completed respite); plus where the
  level-up screen lives (with UI3) and whether level-up may replace earlier choices.

## Work log

- 2026-09-24: user rulings recorded in `character-wizard-spec.md#level-up`: level-up only inside a
  campaign (outside, use the full edit), and one level per level-up event (banked XP for two levels
  means two separate flows).
- 2026-09-24: Q2 settled: a session cannot be closed while a respite is open and unresolved (table spec,
  respite research queue, roadmap).
- 2026-09-24: Q4 settled: respite completion grants pending level-ups; taking one is a separate owner
  action later, never blocking the respite or the next session. New requirement: Director-adjustable
  campaign XP per level (default 16), to design later.
- 2026-09-24: Q-CHAR-2 revised: build changes keep damage taken and Recoveries spent in both directions
  (30/30 → 36/36; 20/30 → 26/36; 26/36 → 20/30), which also covers late level-ups. Floor confirmed: a build change
  never drops Stamina below 1 or Recoveries below 0. Build handoff: the activation code implements the old
  keep-current/cap rule and must change with generic level-up.
- Build handoff for Q-CHAR-2 revised: `shared/evaluate/liveReconciliation.ts` (preview/apply, contract in
  `shared/contracts/liveState.ts`), used by `convex/lib/characterBuild.ts` activation, still implements
  `min(oldCurrent, newMaximum)`; change it to keep damage taken and Recoveries spent, with its tests.
- 2026-09-24: Q5 settled: three endings, Cancel (revert to pre-respite), Interrupt (keep what happened, no
  completion benefits) and Complete.
- 2026-09-24: Q7 settled: no ready gate; unused options lapse on Complete, visible per hero like the
  wizard's unspent-points notice.
- 2026-09-24: Q8 settled: Complete is final; corrections by Director adjustment.
- 2026-09-24: Q6 advancement settled: manual Director level-up grant; milestone advancement not in V1.
- 2026-09-24: optional Respite Ability Changes rule not in V1 (full edit with approval covers it).
- 2026-09-24: level-up adds only that level's choices; source-permitted swaps are built with the specific
  higher-level option that allows them.
