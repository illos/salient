# Compiled ability effect coverage for V1: confirmed 2026-09-24

The user asked ENGINE2 on 2026-09-24 to "start chipping away" at ability text and raise the number
of fully automated abilities as high as it can go. Companions and summoned creatures are excluded
for now because they need UI design first. If ENGINE2 gets stuck and QC1 has no good answer, the
work pauses for the user.

Baseline on main `98f1c3a` (`docs/build/evidence/V72/support.json`): about 42 of 326 class
abilities at levels 1–3 compile. The rest fall back to the older path, which rolls and deals
damage and leaves every other clause for the table.

## What "compiled" means

An ability compiles (`execution: supported`) when every printed clause is one of these:

- work the engine executes: damage, conditions, potency and saves, grabs and forced-movement
  allowances;
- a bounded table instruction, shown in printed order as a manual occurrence the table resolves
  and records. This covers positions, movement, other creatures' actions, Recovery spending and
  ending effects, none of which Salient models (there is no map).

A clause cannot be a manual instruction if it changes a number the engine computes for the same
use: roll, damage, damage type, cost, target count or resources. Those clauses get executed
support or keep the ability manual. Lasting effects with later triggers stay manual until the
engine can track them. Each admitted sentence is matched whole against its pinned source. There is
no keyword or ability-name dispatch.

## Delivery

V152–V159 are reserved by ENGINE2 (V151 belongs to WIZARD3). The order follows the blocker survey
and is re-ranked after each slice:

- V152 Effect rider grammar II: whole-section table work.
- Damage choices: damage type chosen at use, and three-way characteristic lists.
- Declared use conditions: surges before the roll and conditional extra damage.
- Tiers without damage, compound conditions, and tier gains of temporary Stamina and surges.
- Abilities without a power roll.

Every slice gets its own independent review, a TESTER gate and headless proof, the QC1
second-round review, and deployment through the test coordinator.
