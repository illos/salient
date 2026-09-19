# V53: Human level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Ancestry implementer (Opus), reviewed by the character integration lead |
| Rules review | required |
| Depends on | V44, V45 |
| Unblocks | Later Human level units; Revenant, whose previous-life traits draw on other ancestries' lists |
| Status | see `STATUS.md` |

## Goal

Deliver the Human ancestry at level one from scratch: its signature trait, its three-point budget and
all five purchased traits, with each represented as what the source actually says. Only one of them
produces a number a sheet computes; the rest are conditional, triggered or applied at roll time, and
the unit's correctness rests on granting them visibly without inventing totals for them.

Preparation stage. Implementation waits for the integration lead's release, and this unit is
deliberately independent of V47 and V49.

## Spec references

- [Decision system](../character-wizard-spec.md#3-decision-system) — the points-budget shape, option
  support and dependent pruning.
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows) — behaviour when the ancestry or a
  purchased trait changes.
- [Forge Steel compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility) —
  same-build counterpart evidence.
- [Delivery plan](V44-character-option-delivery.md#current-execution-opus-pilot-then-every-level-one-unit).
- [Per-option delivery gate](character-verification.md#per-option-delivery-gate).
- [Merge completion](README.md#merge-completion-includes-the-playable-app).

## In scope

- A new `shared/content/ancestries/human/level-one.ts` with an `ancestry.human.base-statistics` row
  carrying size 1M, speed 5 and stability 0 with their provenance, the signature trait, the
  three-point budget and all five purchased traits, with source paths and verbatim text.
- The one derived contribution: Staying Power increasing Recoveries by 2 over the class value.
- Conditional and triggered traits represented with their conditions intact and no unconditional
  numbers — including the **three** that state amounts under conditions.
- Enabling `Human` in the ancestry choice, and the generated content-snapshot change that requires.
- Counterpart builds, tests and evidence.

## Out of scope

- Any Human level above one, and the Revenant previous-life interaction.
- Gameplay resolution: detection, condition removal, damage halving, forced-movement reduction and
  terrain handling stay manual or engine-track work.
- Defining "untyped damage" or "temporary difficult terrain" beyond what the pin says.
- V47 and V49 content.

## Inputs and dependencies

Branch `slice/V53` is cut from `853789e` in `/srv/presidium/projects/salient/opus-human`, with both
vendor submodules at their recorded pins. V45's extraction means a new ancestry module is an
independently owned file.

**One shared-pipeline dependency that cannot be avoided.**
`shared/content/compendium/ancestry.json` contains only Devil and Polder, and `trait.json` omits all
seven Human trait entries that acceptance check 1 depends on. Both are generated and must regenerate
byte-for-byte from the clean pin under `pnpm content:check`. The file to edit is the `SELECTIONS`
constant in `scripts/build-content.ts`, **not** the generated `manifest.json`. That is a shared file
and needs a claim through the integration owner before the change is made.

The counterpart builds use Fury, the Berserker aspect, the Mountain kit and career Soldier — all
supported before this unit, V47 and V49 — so V53 can be verified and merged on its own.

## Deliverables

Preparation stage: the [source inventory](../research/human-level-one-preparation.md), this
document, a `STATUS.md` row, and the evidence directory carrying the expectation ledger, the witness
plan and the capture procedure.

Implementation stage: the content module, the Recoveries contribution in a Human evaluator
contribution, the regenerated content snapshot, tests, a browser journey and the captured
counterparts.

## Acceptance checks

1. The signature trait and all five purchased traits are present with source paths and verbatim
   text, offered by the **assembled** definitions, with costs 1/2/1/1/2 against a budget of 3. The
   signature trait is granted despite having no cost field.
1a. Size 1M, speed 5 and stability 0 derive from an owning `ancestry.human.base-statistics` decision
   with provenance, rather than appearing in expectations with no source.
2. Staying Power yields Recoveries = class value + 2, and leaves recovery value untouched, since that
   derives from Stamina maximum.
3. **The load-bearing pair:** a build with Can't Take Hold and Determination derives values identical
   to a build with no purchased traits, **and** both entitlements are present and readable on the
   sheet. Both halves are required — identical numbers alone are also what a total failure to grant
   them would produce.
4. Can't Take Hold is not modelled as stability; Perseverance's slowed value is a flat 3 and does not
   combine with a kit speed bonus; Perseverance's edge is not a sheet number; Resist the Unnatural is
   not passive damage reduction. Each conditional amount appears with its condition.
5. Budget behaviour: 4 points is invalid; 2 points warns and still completes under Q-CHAR-10; 3
   points is clean.
6. Changing ancestry away from Human removes the signature trait, every purchased trait and the
   Recoveries increase, while preserving independent class, career, culture and authored choices;
   the stale-selection diagnostic path is exercised as well as the pruned path.
7. The regenerated content snapshot passes `pnpm content:check` byte-for-byte from the clean pin.
8. Three completed legal Forge counterparts covering all five traits, with unmodified exports,
   readable sheets, recorded declared and observed provenance, and explained differences.
9. Full `pnpm check` plus `pnpm test:browser` on the isolated CT114 candidate; independent
   implementation and rules reviews pass; then merge and verify on shared CT114 main.

## Ability design and playtest evidence

Not applicable in the parser/engine sense: this unit adds editor options and readable content and
changes no executed behaviour. Detect the Supernatural's resolution stays manual.

## Rules research

Complete for this stage in the [source inventory](../research/human-level-one-preparation.md), with
an exact path and quoted sentence for every claim. Four resolution-time uncertainties are recorded
rather than resolved, and none affects a level-one derived number. Unspent points need no question:
Q-CHAR-10 already settles them.

## Open questions

None requiring the user.

## Work log

2026-09-19 (preparation): claimed V53 on `slice/V53` from `853789e`; submodules at their recorded
pins. Assignment received through Chords under the user's instruction to this thread to accept scope
changes from the integration thread. No Human content module existed, so this is a from-scratch
inventory.

A fresh Anthropic source researcher derived the inventory from the pin alone, barred from reading
Forge Steel for any purpose and from any web source. Findings that shaped the plan:

- Only Staying Power produces a computed number. Two other traits state amounts under conditions, so
  neither may be filed as "non-numeric" — the correction this project already applied to Polder Geist.
- The signature trait has no cost field, so a loader iterating costed traits drops it silently.
- Human's `signature_trait_name` is correct, unlike Polder's; the printed headings remain the
  authority rather than the field.
- The structured-effects truncation that nearly lost a Shadowmeld clause does **not** occur for any
  Human trait, but two other structured losses do: `ancestry` is dropped from the unified twins, and
  `cost` is an unparsed string there.
- The Human ancestry record is absent from the generated content snapshot, which makes a
  shared-pipeline change unavoidable and claimable.
- The Devil module's note about the baseline sentence is inaccurate and must not be copied.

No application, evaluator, shared-contract, `main`, runtime or hosted change was made, and no
install, build, typecheck, test or browser was run anywhere.

2026-09-19 (correction round after independent audit): a fresh reviewer audited the preparation.
Most of its findings were right and are applied; one was not, and is rejected on evidence.

**Rejected.** The audit reported `class.fury.skills` selecting `Search` as an unsupported option
that would block every build, having read the module constant `['Jump', 'Climb']`. Verified directly
and rejected: `shared/content/supporting-backgrounds.ts:1548-1555` widens every `class.*.skills`
choice to all skills after composition, and `character-decisions.ts` runs that extension per level,
so `Search` is offered. This is precisely the module-constant-versus-assembled-definitions mistake
the V47 preparation made and the lead corrected; the audit repeated it, and acting on it would have
changed correct data.

**Applied.** Detect the Supernatural was paraphrased too broadly — only *objects* are keyed to
"supernatural", while the creature clause is a closed list of undead, construct or creature from
another world. Three traits state conditional amounts, not two, which the preparation's own table
already contradicted. The rounding of "half the damage" is **not** an open uncertainty: the pin's
always-round-down rule answers it and its worked example is a triggered halving, so recording it as
unresolved was itself an error. The signature-trait verification and the budget quote now cite paths
that exist. The snapshot dependency understated its scope — `trait.json` omits all seven Human trait
entries too — and named the wrong editable file. The Devil-note correction is now scoped precisely
and credited to the places that already record it. `damageImmunities` and `conditionImmunities` are
omitted rather than empty, since the evaluator materialises those keys only when a modifier exists.
The kit block gained its `equipmentText`. The ancestry baseline now has an owning decision in scope.

**Process correction.** This slice's header says the rules review is required, but commit `212518b`
carried `Rules-Review: not required`. Per the build process, a slice awaiting its rules review
commits `Rules-Review: required (pending)`. That commit is already handed off and rewriting it would
create exactly the candidate-identity confusion this project has been untangling all evening, so it
stands as history and this and subsequent V53 commits carry the correct value.
