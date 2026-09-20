# V73 — Headless Forge character counterparts

Status: In review — browserless route proved; seven comparison discrepancies retained. Character track, WIZARD; branch `slice/V73`, worktree
`.worktrees/forge-headless`. Runtime: CT114 `hosted`; comparison target is the existing
hosted development app. No browser activity or application deployment is part of this slice.

## Outcome and limits

Run the unmodified pinned Forge calculations against retained authentic characters first.
Then construct six ancestry families from pinned Forge definitions and compare their results
with characters created and read back through Salient's authenticated public API. Retain
inputs, outputs, calibration differences and failures. A discrepancy is evidence to investigate,
not permission to change the implementation or silently weaken an assertion.

The first gate is one bounded calibration on an available suitable local or remote environment. Stop and record a concrete blocker if the
adapter cannot execute; do not spend hours debugging infrastructure. Forge's browser-only
presentation imports are guarded with throwing boundaries, while all game logic remains
upstream. Unsupported choice semantics cannot count as independently verified.

## Coverage value

- Authentic Grug and Bethell sheet calibration catches incorrect loading, traversal and
  derived-stat projection before using generated counterparts as an oracle.
- Per-option persisted comparisons catch missing grants, incorrect modifiers and loss or
  substitution of decisions across the actual create/read API boundary.
- Missing, duplicate and over-budget ancestry selections must fail the comparison gate;
  Forge's `isChosen` alone accepts some invalid selections and is insufficient validation.

Orc Passionate Artisan targets have no structured Forge choice. Their preservation and lack
of extra skill grants can be tested in Salient, but Forge cannot independently validate the
target pair. Record that boundary explicitly.

## Work log

- Started from current main `a9a0e5d` plus the preserved verified V69 candidate
  (merge `01454f8`); no abandoned pilot artifacts used.
- User authorized programmatic Forge counterparts and coherent verification doctrine changes.
- Source work produces 31 counterparts across Devil, Polder, Dwarf, Human, Hakaan and Orc.
  Runtime proof passes. Saved public API comparison: 24/31 pass, seven ability-list discrepancies;
  all compared numeric and choice-persistence fields match. See [evidence](evidence/V73/README.md)
  and [independent review](reviews/V73-headless-forge-review.md). No application fixes made.

- V74 resolves the sourced action omissions: [31/31 refreshed comparisons pass](evidence/V74/README.md).
  The original 24/31 report remains historical evidence; comparator scope limits remain in force.
