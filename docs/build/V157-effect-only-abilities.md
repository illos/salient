# V157: Abilities without a power roll, and executed gains

Rules review: required. Depends on: V72, V109, V152, V154.

## Goal

Compile a main-action or maneuver ability that has no power roll, when every printed clause is one of:
- a gain the engine applies (temporary Stamina, surges); or
- bounded table work, recorded as an ordered manual occurrence as V109 riders are.

A use pays its fixed cost, applies the gains, records the action and persists a compiled result with
occurrences and dispositions, like a rolled use. This is piece 1 and 2 of the plan in
[the automation rulings](../decisions/2026-09-24-automation-rulings.md). Triggered actions, optional
spends, Strained sections, lasting effects and effects that watch for later events are out of scope
(pieces 3–6).

## Design

### Compile (`shared/resolve/compileAbility.ts`, `shared/resolve/effectOnly.ts`)

An envelope compiles as effect-only when:
- it has no roll or tier block;
- every block is an `Effect` section with no cost label (no Trigger, Spend, Strained, Persistent or
  unattached Paragraph);
- its action type is main action, maneuver or free maneuver;
- its header rows match (the existing source-header check); and
- its target is one the effect-only target reader accepts:
  - `Self` → self;
  - `One creature`, `One ally`, `Self or one ally`, `Self or one creature` → one target;
  - `N allies`, `Self and N allies` → up to N, or N + 1 including self;
  - an area "Each ally in the area" → the chosen targets.

Each Effect section must be consumed whole by an ordered list of sentence patterns in
`effectOnlyClauses`. There is no substring or name dispatch. Each pattern cites its source:
- **Gains**, a `gain` node with `subject` `actor` (printed "You") or `target`, and `temporaryStamina`
  and/or `surges`:
  - "You gain N temporary Stamina." (`fury/level-3/steelbreaker.md`)
  - "The target gains N temporary Stamina and N surges." (`conduit/level-3/saints-raiment.md`)
  - the "You gain N surges." and "Each target gains N surges." forms.
- **Table work**, an `instruction` node reusing rider shapes:
  - "Each target can make a free strike." (`tactician/level-1/now.md`)
  - "Each target can move up to their speed." (`tactician/level-1/squad-forward.md`)
  - "The target can spend a Recovery." / "Each target can spend a Recovery." and the whole Sermon of
    Grace section (`conduit/level-1/sermon-of-grace.md`)
  - "You use a strike signature ability twice." (`shadow/level-1/shadowstrike.md`)
  - further whole sentences only where the source is pure table work under the coverage boundary.

The definition has `effectOnly: true` and no `metadata`. `activation` holds `{ actionType,
fixedCost?, targetShape }`. The `grammar` "no-power-roll" diagnostic is suppressed only for this
form. Everything else keeps its diagnostics.

### Resolve (`shared/resolve/compiledOutcome.ts` `resolveEffectOnly`)

- Validate the definition the same way as the rolled path: shapes re-read from their clauses, target
  counts within the activation's shape, and tamper refusal.
- Outcomes, in printed order:
  - `gain` outcomes for each recipient: the actor for `actor` gains, otherwise each target. Status
    `applied` for a hero recipient; `manual` otherwise, since foes carry no surge counter.
  - Rider outcomes (`tier: true` when the subject is the target) for instructions.
- Affordability uses the existing `checkAffordability` with the fixed cost. There are no edges, so
  the V156 discount never applies.

### Live (`convex/lib/abilityOperations.ts`)

- A new `ability.use` branch for `compilation.mode === 'compiled' && definition.effectOnly`, placed
  before the recorded path:
  - pay the cost exactly as the recorded path does;
  - apply gains through `journalPatch` on the hero's `liveState`:
    - temporary Stamina keeps the greater of the current and granted amounts (`docs/table-spec.md`,
      "v0.01 temporary Stamina": "A sourced grant keeps the greater…");
    - surges add;
  - `recordUse` for the action type;
  - insert `abilityResults` with `effectOnly: true`, no dice or characteristic, target rows with
    zero edges and banes and a null outcome and application, and the `compiled` result;
  - event kind `ability.use`, with the description listing gains and instructions.
- Schema: `abilityResults.dice` and `characteristicValue` become optional, and `effectOnly` is added.
  Every reader handles the missing roll. `ability.correct` refuses an effect-only use ("no roll to
  correct"). `ability.resolved` works unchanged.
- The log card renders the compiled effects for an effect-only use with its "Resolved at table"
  controls (reusing `CompiledEffects`), and shows no dice line.

### Reports

The live report counts effect-only compiled abilities. The live inventory test names the additions.
Both reports are regenerated.

## Acceptance checks

1. Pure tests:
   - pattern admission, with a changed amount or an added sentence refused;
   - each admitted ability compiles;
   - Steelbreaker gains 20 temporary Stamina for the actor;
   - Saint's Raiment gives the target 20 temporary Stamina and 3 surges;
   - Now! records one free-strike instruction per ally;
   - tampering is refused;
   - triggered actions and abilities with Spend or Strained sections stay manual.
2. App test (convex-test, registered operations):
   - Steelbreaker in combat pays 7 Ferocity and raises temporary Stamina to 20. If the hero already
     has 25, it stays 25.
   - Saint's Raiment raises an ally's surges by 3 and temporary Stamina to 20.
   - Rewind restores both, and redo reapplies them.
   - An instruction disposition reads back.
   - `ability.correct` on the use is refused.
3. Headless cohort `effect-only` through the public API with persisted readback.
4. TESTER full gate, independent review, then QC1.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V157` at `c7aa637` in `.worktrees/effect-only`.
