# Character option modules

This is the developer handoff for V45's extraction of existing supported content. It adds no
ancestry, class, level or table automation. Delivery and acceptance requirements remain in the
[V44 plan](../../docs/build/V44-character-option-delivery.md) and
[reference procedure](../../docs/build/character-verification.md).

## Ownership and composition

- `ancestries/<slug>/level-one.ts` owns that ancestry's current decision rows.
- `classes/<slug>/level-<n>.ts` owns one class/level's rows. Level-one class modules also expose
  their `classProfile`. Fury level two owns its perk groups and existing Berserker progression.
- `decision-builders.ts` contains source-path and decision constructors. Constructors describe
  content; they do not determine gameplay outcomes or confer implementation support.
- `level-one-decisions.ts` composes the level-one definition object. Devil and Fury rows replace
  their original families at the same positions; Polder and Elementalist rows append in their
  established positions. Elementalist accepts the shared pools to construct its duplicate-skill
  choice. Shared career/culture composition remains outside ancestry/class ownership.
- `fury-level-one-decisions.json` stays unchanged as the pinned R01 reference and source of shared
  metadata, pools and common steps. Edit current family modules, not the obsolete copies of those
  families inside the reference artifact. Stable decision IDs preserve saved revisions.

The composer clones imported row arrays and class profiles before adding them. Elementalist's
row factory creates fresh rows. `character-decisions.ts` clones assembled level-one content into
separate level-one and level-two objects, and clones imported Fury level-two rows before adding
those. Extenders must never mutate imported module constants. `getDefinitions()` returns cached
shared content: consumers must treat it as read-only. Supplying `choiceOrigins` creates a shallow
wrapper with a deep clone of the supplied origins; it does not make the nested definitions
caller-owned. This preserves the existing API contract.

## Extension order and support

`character-decisions.ts` assembles level-specific content first, then applies the following to
each independently cloned level:

1. Set `supportingChoicesVersion` to `v37`.
2. Extend supporting backgrounds, including existing career, culture, kit and perk definitions.
3. Extend complications.
4. Add the Raised by Beasts exclusion to applicable culture decisions.
5. Extend duplicate-skill replacements after every skill-granting source has been composed.

Keep that order. In particular, level-two perk choices must exist before background extensions,
and replacement entitlement generation must see all relevant grants. A module's raw rows are
not the complete effective wizard definitions; verify the assembled result.

`character-support.ts` centralizes verified definition-level restrictions and the currently
supported advancement transition. Existing level two requires Berserker Fury; a readable
Reaver, Stormwight or other class record does not make that level supported. Level-one class,
ancestry and option support still comes from the composed decisions' support flags. Existing
builder selection in `getDefinitions()` and support registration must stay consistent. A new
level requires its builder, verified definitions/effects, support requirements and progression
consumer changes together; changing a numeric registry key alone cannot enable it safely.

## Derived values

`shared/evaluate/character.ts` orchestrates the existing evaluation phases through the narrow
context in `shared/evaluate/derivation.ts`. Ancestry contributions live in
`shared/evaluate/ancestries/`; class contributions live in `shared/evaluate/classes/`.
These functions run at their established phases, rather than as one final catch-all pass.

Fury's subclass, characteristics, vitals and resource contributions retain the original source
provenance and ordering. The shared class-profile pass preserves that Fury path; do not replace
it with generic profile arithmetic without checking every source/contribution difference.
Devil movement, saving-throw threshold, no-kit stability and trait assembly remain separate
contributions. V46 adds one more, `applyDevilConditionalEffects`, and it deliberately runs **after**
`deriveProfiles` rather than at the ancestry phase: it reads the characteristics, and for any class
whose characteristics come from the shared class profile those are only set there. A later unit that
needs a characteristic-dependent ancestry value has the same constraint. Polder baseline/disengage and Elementalist modifiers likewise retain their
positions relative to shared kit and background effects. Coordinate shared phase/interface
changes with the integration owner. An option must cease contributing when its parent choice
is no longer available; stale saved selections are not active grants.

## Delivering another unit

Implement one ancestry/level or class/level per scoped commit. Read the pinned local Compendium
and corresponding Forge definitions, inventory every choice and permanent contribution, and
preserve source wording and IDs. Add readable manual gameplay effects separately from permanent
build calculations. Update the content module and relevant evaluator contribution, then request
any shared composition/support/progression changes from the integration owner.

Keep an option-to-witness ledger with same-build Forge exports and independent source-derived
expectations. Cover parent switching, point/count restrictions, grants, save/reload and applicable
progression/history/live-state behavior. Refactoring also needs assembled-definition and evaluated
output preservation checks, including provenance, against the existing reference builds.
Run required checks and browser verification on CT114 through `presidium-dev`; no dependency,
build, server or browser workloads run on Presidium. Independent implementation and rules review,
full verification, and the shared playable-app update are merge gates in the V44 plan.
