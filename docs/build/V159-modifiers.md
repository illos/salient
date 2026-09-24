# V159: Modifiers from lasting effects

Rules review: required. Depends on: V158 and the
[lasting effects design](../lasting-effects-design.md) (QC1 PASS), sections 2, 5a and 1 (stacking).

## Goal

Lasting effects that change later rolls or derived values compile. The engine applies them
automatically, and the table can exclude them. This is slice 2 of the design's delivery plan and is
the first slice where lasting effects change numbers
([automation rulings, section 1](../decisions/2026-09-24-automation-rulings.md#1-lasting-effects-and-modifiers-may-be-automated)).

## Design

- **Payload.** A `modifier` effect-instance payload holds:
  - the roll scope: rolls by the subject, rolls against the subject, strikes by or against, power
    rolls, or ability rolls, as printed;
  - edges, banes, a bonus or a penalty, as printed; or
  - a derived stat (`speed`, `stability`, `saving-throw`) and an amount.
- **Consumable components** (design 5a):
  - A "next power roll" or "next strike" modifier is its own sibling instance with `consumeOn`.
  - The first qualifying roll consumes it, even when banes cancel it.
  - Undo of that roll restores it.
- **Rolls.** `ability.use` (rolled paths) collects the effective aggregate (design section 1,
  printed stacking) of every active modifier that applies to the actor's roll, and to each target's
  roll-against. It merges them into the per-target inputs as automatic contributions. The saved
  result records each contribution by instance id.
  - `circumstance` edges and banes: today's `edges`/`banes` arguments, additive.
  - `exclude=[instanceId…]`: the table's override, which drops an automatic contribution for this
    roll without adding an opposite bane.
  - Corrections recompute from the saved contributions and exclusions. They never double count, and
    they never re-read changed effects.
- **Derived values.** Stability feeds the V113 forced-movement allowance. The saving-throw bonus
  feeds the save work. Speed is shown on the sheet as base plus effects (it is table movement). Each
  cites its source.
- **Compile.** Whole-sentence patterns for modifier sentences with bound durations. Each cites its
  source. Only sentences whose every clause is a modifier, a gain (V157), table work (V152/V158) or
  a condition the engine applies are admitted. Anything else stays manual.
- **Display.** Automatic contributions appear on the roll's log entry ("edge from X's Y") with the
  exclude control, as a command on the existing card. The sheet shows derived stats with their
  effect sources.

## Acceptance checks

1. Pure tests:
   - aggregation with the printed stacking (the design's examples);
   - scope matching: by versus against, strikes versus all power rolls;
   - consumption, including an edge cancelled by banes;
   - exclusion;
   - pattern admission and refusal.
2. App tests (convex-test, registered operations):
   - a lasting edge applies to the next matching roll and is recorded;
   - `exclude` drops it, and a correction keeps the exclusion;
   - a consumable edge is consumed once, and undo restores it;
   - a stability bonus changes a forced-movement allowance;
   - Perfect Clarity is covered only if it is admitted; it also needs its tier-3 clarity watcher,
     which belongs to the watchers slice, so that part stays out of this slice.
3. A headless cohort, `modifiers`, with persisted readback of contributions and exclusion.
4. TESTER full gate, independent review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V159` from `slice/V158` (`bd8e7c1`) in `.worktrees/modifiers`.
