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
