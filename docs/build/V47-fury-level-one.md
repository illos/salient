# V47: Fury level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Class implementer (Opus), reviewed by the character integration lead |
| Rules review | required |
| Depends on | V44, V45 |
| Unblocks | Later Fury level units; the first-wave combined audit (V44 order 1F) |
| Status | see `STATUS.md` |

## Goal

Deliver the Fury class at level one across every applicable branch — all three primordial aspects,
all twelve choosable level-one abilities, the full exploration/intrigue skill choice and all four
stormwight kits — as selectable, source-backed wizard content with correct permanent build
contributions and explicitly manual gameplay effects. The unit must not enable any level-two branch,
must leave the existing Berserker level-two path and the existing Devil Berserker reference build
unchanged, and must not touch V46's Devil files, `main`, the shared runtime or any hosted target.

This slice is in its **preparation stage**. Research, inventory and the implementation plan are
delivered now; implementation is released by the integration lead after the V46 pilot verdict.

## Spec references

- [Decision system](../character-wizard-spec.md#3-decision-system) — decision shapes, availability,
  dependent pruning and support marking for the new options.
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows) — creation and full-edit behaviour when
  the aspect or kit parent choice changes.
- [Progression history](../character-wizard-spec.md#5-progression-history) — level-one builds must
  stay restorable and must not gain level-two content.
- [Forge Steel compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility) —
  same-build counterpart evidence for every enabled option.
- [Delivery plan](V44-character-option-delivery.md#current-execution-opus-pilot-then-every-level-one-unit) —
  unit boundaries, per-unit gates and the pilot gate this slice waits behind.
- [Per-option delivery gate](character-verification.md#per-option-delivery-gate) — option-to-witness
  ledger and merge gates.
- [Merge completion](README.md#merge-completion-includes-the-playable-app) — shared app update.

## In scope

- Enable and complete the Reaver and Stormwight aspects, including each aspect's skill, its two
  1st-level aspect features, its triggered action and its Growing Ferocity benefits at the
  ferocity 2, 4 and 6 rows only.
- Enable the nine currently unsupported level-one ability options across the signature, 3-ferocity
  and 5-ferocity pools, with verbatim source text and cost provenance.
- Enable the full legal skill choice (any two from the exploration or intrigue groups) and settle
  duplicate handling against the already-granted aspect, culture and career skills.
- Make all four stormwight kits selectable for the Stormwight aspect only, with their kit bonuses
  flowing into Stamina, stability, speed, melee damage and disengage, their signature abilities and
  Aspect of the Wild granted, and their form/storm text readable.
- Repair the pre-existing stormwight kit provenance and equipment-text defects recorded in the
  [preparation research](../research/fury-level-one-preparation.md).
- Tests, fixtures, Forge counterpart evidence and browser journeys for the above.

## Out of scope

- Any Fury level above one, including the 4th/7th/10th-level rows printed inside the level-one
  Growing Ferocity and hybrid-form entries. Completing a level-one branch must not enable its
  level-two branch; `shared/content/character-support.ts` keeps level two at Berserker only.
- Gameplay execution of any ability, shapeshifting, ferocity accrual or threshold benefit. These are
  parser/engine scope under the existing per-ability design and playtest gate.
- Other classes and ancestries, including V46's Devil files.
- A general per-skill roll-modifier layer for Relentless Hunter's edge; recorded as an uncertainty
  and proposed separately rather than invented here.
- Import/export implementation, source-pin changes, hosted publication and remote Git pushes.

## Inputs and dependencies

Hard: V45's extraction is merged and live (`ebe66e2`, closeout `88d1e61`), so
`shared/content/classes/fury/level-one.ts` and `shared/evaluate/classes/fury.ts` are independently
owned. V44's plan and the per-option gate are merged. Branch `slice/V47` is cut from `453dd1e` in
`/srv/presidium/projects/salient/opus-fury`, with both vendor submodules initialised at their
recorded pins (`fb83a789…` Compendium, `5a846aad…` Forge Steel).

Soft, and coordinated rather than stubbed:

- V46 (Devil level one) is uncommitted on `slice/V46` in a different worktree. It may touch the same
  shared composition and support files. This unit does not edit V46's ancestry module, and the lead
  serialises any shared-file change between the two units.
- The shared changes listed under *Shared contract requests* below belong to the integration owner.
  Until they land, stormwight kits cannot be enabled end to end; every other part of this unit can
  proceed independently.

All dependency installation, builds, tests, servers and browsers run on CT114 through
`presidium-dev` in a named slot after coordination. The CT114 heavy window currently belongs to the
V46 pilot thread; nothing in the preparation stage needs it.

## Deliverables

Preparation stage (this handoff):

- [Fury level-one preparation research](../research/fury-level-one-preparation.md): source boundary,
  complete option inventory, permanent-versus-manual classification, existing-support gap list,
  defects found in shared data, shared-contract requests, Forge structural comparison, the
  nine-build reference matrix and the open uncertainties.
- This slice document and its `STATUS.md` row.

Implementation stage (released after the pilot verdict):

- `shared/content/classes/fury/level-one.ts`: completed aspect options, ability pools, skill pool
  support, aspect Growing Ferocity content and stormwight kit contribution rows.
- Requested shared edits in `shared/content/supporting-backgrounds.ts`,
  `shared/content/supporting-kits.ts` and `shared/evaluate/character.ts`, made by or with the
  integration owner.
- `shared/evaluate/classes/fury.ts` verification for all three aspects; new contributions only where
  a branch actually changes a derived value.
- Tests: extend `tests/fury-decisions.test.ts` (source-verbatim pool/ability coverage),
  `tests/character-evaluator.test.ts` and `tests/character-derived-values.test.ts` (per-build derived
  values from independently derived expectations), plus a V47 fixture set alongside
  `tests/fixtures/v25-fury.json` and `tests/fixtures/v32-fury-level-two.json`, which stay unchanged.
- `tests/browser/v47-fury.spec.ts`: wizard journeys for a Reaver and a stormwight build, source
  display, persisted readback after reload, and an aspect change that removes the obsolete kit and
  grants while keeping independent details.
- `docs/build/evidence/V47/`: option ledger, Forge exports and sheets, command output, screenshots,
  and any retained failure with the rerun that resolves it.

## Acceptance checks

1. Option inventory: every level-one Fury option in the pinned source appears in the definitions with
   its source path and verbatim quote, and every option this unit enables is marked supported.
   Contrasting tests confirm the ferocity 8/10/12 rows are not granted at level one and that no
   level-two aspect content becomes reachable.
2. Pure evaluation: for each of the nine reference builds, derived characteristics, Stamina,
   recoveries, recovery value, winded, stability, speed, disengage, melee damage bonus, skills,
   features and abilities match expectations derived from the source before the evaluator is run.
3. Parent change: switching aspect removes the previous aspect's skill, features, triggered action
   and any kit that is no longer eligible, preserves independent choices and authored details, and
   leaves ancestry and career contributions intact.
4. Kit eligibility: Berserker and Reaver may select only ordinary kits; Stormwight may select only
   the four stormwight kits; a missing kit produces the correct aspect-specific diagnostic.
5. Persistence: save, reload and shared headless operations return the same build for each reference
   build; review activates exactly the submitted revision; stale and unauthorised operations refuse.
6. Compatibility: the existing Devil Berserker level-one fixture and the Berserker level-two
   progression fixture evaluate byte-identically to their current results, and the level-two
   advancement gate still refuses Reaver and Stormwight.
7. Full `pnpm check` and `pnpm test:browser` pass on the isolated CT114 candidate with the configured
   single workers; evidence retained, including any failure and its rerun.
8. Same-build Forge counterparts exist for every enabled option, with unmodified exports, readable
   sheets, recorded versions and explained differences. An unexplained mismatch blocks the unit.
9. Independent implementation review and a fresh rules review pass; the implementer does not
   self-certify.
10. After the lead's merge: shared CT114 main updated and the changed journey verified at the actual
    shared HTTPS URL with saved-state readback and existing data preserved.

## Ability design and playtest evidence

Not applicable in the parser/engine sense: this unit grants abilities as readable sheet content and
changes no executed ability behaviour. Every granted ability still needs its source mapping and real
in-app evidence that it appears on the persisted sheet with correct text and cost. Any later change
to how these abilities execute belongs in a coordinated engine slice under the
[per-ability gate](README.md#engine-ability-design-and-playtest-evidence).

## Rules research

Complete for the preparation stage in the
[Fury level-one preparation research](../research/fury-level-one-preparation.md), which lists every
source path read and every mechanical claim this unit will make. Two readings are labelled as
interpretations there: that stormwight kits are available only to the Stormwight aspect, and the
recommended duplicate-skill handling for the Fury's two chosen skills. Both cite the passages they
rest on and state the alternative. Relentless Hunter's edge is recorded as an explicit uncertainty
rather than given an invented representation.

## Open questions

None requiring the user yet. If the rules reviewer rejects either labelled interpretation and the
pinned Compendium cannot settle it, append it to `docs/rules-questions-for-user.md` with the paths
read, a recommendation and the alternatives, and continue with the rest of the unit.

## Work log

2026-09-19 (preparation): claimed V47 on `slice/V47` in
`/srv/presidium/projects/salient/opus-fury`, created from `main` `453dd1e`; both vendor submodules
initialised at their recorded pins and left unmodified. Primary track: characters. Assignment
received through Chords message 217 from the integration lead
(`9e5c707a-6f45-44d3-8705-2b85efba2f7d`), which scopes this stage to research and planning and holds
implementation behind the V46 pilot verdict.

Read `agent.MD`, `CLAUDE.md`, `docs/build/README.md`, the V44 plan, `character-verification.md` and
`shared/content/character-options.md` in this checkout before starting. Source research covered the
class entry, all twelve `feature/fury/level-1` entries, all fifteen `feature/ability/fury/level-1`
entries, the seven `feature/fury/stormwight-kits` entries, the four per-animal feature directories,
the four stormwight kit records and the printed Fury chapter in the pinned Heroes book, which is
where the ability-pool membership is stated. Forge Steel's fury, berserker, reaver and stormwight
definitions were read for structure only.

Existing-support inventory recorded five gaps (Reaver and Stormwight aspects unsupported; nine of
twelve abilities unsupported; two of twenty-two skills supported; no stormwight kit contribution
rows and no stormwight kit support; no aspect Growing Ferocity content) and three pre-existing
defects in shared V37 kit data that only surface once stormwight kits are selectable: empty
`tableRow` quotes used as provenance, four paraphrased equipment strings, and a missing-kit
diagnostic that covers only Berserker and Reaver.

No application, evaluator, shared-contract, `main`, runtime or hosted change was made. No
dependency install, build, typecheck, test or browser run was performed anywhere, and none was run
locally on Presidium. Documentation links and whitespace were not machine-checked in this stage
because those commands also belong on CT114; they run with the implementation stage's first check.

### Shared contract requests for the integration owner

1. `shared/content/supporting-backgrounds.ts`: the V37 extension assigns
   `kitChoice.supportedInV001 = [...ORDINARY_KIT_NAMES]` and rebuilds per-option support from the
   ordinary list, overwriting anything the class module sets. Requested change: union with the
   composed definition's existing support, and run the existing `kit.<name>.contributions` loop over
   the stormwight names as well.
2. `shared/content/supporting-kits.ts`: fill the null `KIT_BONUS_SOURCES` fields for Boren, Corven,
   Raden and Vuken so speed, disengage, ranged damage and both distance bonuses cite that kit's own
   `kit-bonuses.md` entry with its omitted-bonus-means-zero note, and replace the four paraphrased
   `equipmentText` strings with the verbatim source sentence.
3. `shared/evaluate/character.ts`: extend the `missing()` kit diagnostic with the Stormwight case,
   citing Beast Shape.
4. `shared/content/classes/fury/level-one.ts` is owned by this unit; no other unit should edit it
   while V47 is active.
