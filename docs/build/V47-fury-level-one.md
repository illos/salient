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
all twelve choosable level-one abilities and all four stormwight kits — as selectable, source-backed
wizard content with correct permanent build contributions and explicitly manual gameplay effects.
The exploration/intrigue skill choice is already served in full and is verified, not built, here. The unit must not enable any level-two branch,
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
- Regression-test the settled Q-CHAR-11 duplicate behaviour for the new aspect skills. The
  evaluator already refuses a deliberate chosen duplicate and already generates replacement
  entitlements for fixed collisions, and the skill pool is already served in full, so this unit adds
  coverage rather than mechanism. Optionally add the `ownedPool` exclusion so the wizard stops
  offering a skill the build already has.
- Enforce the source's Stormwight complication exclusion (Slight Case of Lycanthropy), which is
  recorded today only as narrative text with no validation, and which becomes reachable the moment
  the Stormwight aspect is enabled.
- Make all four stormwight kits selectable for the Stormwight aspect only. This requires their
  `kit.<name>.contributions` rows: the evaluator gates every kit contribution on that row, so
  without it a stormwight build silently derives no Stamina, stability, disengage, kit speed term or
  kit signature ability. Their always-available Aspect Benefits, form-conditional effects, primordial
  storm, Growing Ferocity rows and Aspect of the Wild all become readable sourced content.
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
- A general per-skill roll-modifier layer. Relentless Hunter's edge is granted as sourced readable
  content with manual application, following the existing Devil Silver Tongue precedent; automatic
  test resolution is separate engine scope, not a missing part of this unit.
- Import/export implementation, source-pin changes, hosted publication and remote Git pushes.

## Inputs and dependencies

Hard: V45's extraction is merged and live (`ebe66e2`, closeout `88d1e61`), so
`shared/content/classes/fury/level-one.ts` and `shared/evaluate/classes/fury.ts` are independently
owned. V44's plan and the per-option gate are merged. Branch `slice/V47` is cut from `453dd1e` in
`/srv/presidium/projects/salient/opus-fury`, with both vendor submodules initialised at their
recorded pins (`fb83a789…` Compendium, `5a846aad…` Forge Steel).

Soft, and coordinated rather than stubbed:

- V46 (Devil level one) is uncommitted on `slice/V46` in a different worktree. It may touch the same
  shared composition and support files. This unit does not edit V46's ancestry module, and shared
  files are claimed through the lead before either unit edits them.
- The shared edits listed in the work log are this unit's implementation work, made after claiming
  those files through the lead and released when the claim is granted. They are not a request for
  the lead to author code.

All dependency installation, builds, tests, servers and browsers run on CT114 through
`presidium-dev` in a named slot after coordination. The CT114 heavy window currently belongs to the
V46 pilot thread; nothing in the preparation stage needs it.

## Deliverables

Preparation stage (this handoff):

- [Fury level-one preparation research](../research/fury-level-one-preparation.md): source boundary,
  complete option inventory, permanent-versus-manual classification, unconditional-versus-form-gated
  split for the stormwight kits, existing-support gap list checked against the assembled
  definitions, five defects found in shared data, the shared files to claim, the Forge structural
  comparison, the counterpart ledger and the one remaining interpretation.
- This slice document and its `STATUS.md` row.

Implementation stage (released after the pilot verdict):

- `shared/content/classes/fury/level-one.ts`: completed aspect options, ability pools, aspect
  Growing Ferocity content and stormwight kit contribution rows.
- Shared edits in `shared/content/supporting-backgrounds.ts`, `shared/content/supporting-kits.ts`
  and `shared/evaluate/character.ts`, written by this unit after the file claims are granted.
- `shared/evaluate/classes/fury.ts` verification for all three aspects; new contributions only where
  a branch actually changes a derived value.
- Tests: extend `tests/fury-decisions.test.ts` (source-verbatim pool/ability coverage),
  `tests/character-evaluator.test.ts` and `tests/character-derived-values.test.ts` (per-build derived
  values from independently derived expectations), plus a V47 fixture set alongside
  `tests/fixtures/v25-fury.json` and `tests/fixtures/v32-fury-level-two.json`, which stay unchanged.
- `tests/browser/v47-fury.spec.ts`: wizard journeys for a Reaver and a stormwight build, source
  display, persisted readback after reload, and an aspect change that removes the obsolete kit and
  grants while keeping independent details.
- `docs/build/evidence/V47/`: counterpart ledger, Forge exports and sheets, command output,
  screenshots, and any retained failure with the rerun that resolves it.

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
6a. A stormwight build derives a complete baseline — Stamina, recovery value, winded, stability,
   disengage, kit speed term, kit contributions and the kit signature ability — with every kit
   provenance quote non-empty and citing that kit's own source entry, never the ordinary Kits table.
6b. A stormwight fury cannot take the Slight Case of Lycanthropy complication, and the refusal
   carries its source; other aspects are unaffected.
7. Full `pnpm check` and `pnpm test:browser` pass on the isolated CT114 candidate with the configured
   single workers; evidence retained, including any failure and its rerun.
8. Same-build Forge counterparts exist for every option this unit newly enables — both new aspects
   with their features and triggered actions, the nine new abilities, and all four stormwight kits
   with their signature abilities and Aspect of the Wild — each a completed legal build with no
   deferred selections, unmodified exports, readable sheets, recorded versions and explained
   differences. Choices this unit does not newly enable (the ordinary kits, the exploration and
   intrigue skill pool, cultures, careers, perks and complications) are reused already-verified
   shared choices and are identified as such rather than re-witnessed. Illegal and duplicate
   attempts are negative tests, never counterpart rows. An unexplained mismatch blocks the unit.
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
source path read and every mechanical claim this unit will make. One reading is labelled as an
interpretation there — that stormwight kits are available only to the Stormwight aspect — with the
passages it rests on and the alternative stated.

Duplicate skills are **not** an open rules question: Q-CHAR-11 is resolved, and free selections must
choose distinct eligible skills that are not already granted. This unit implements that settled
policy; how it is enforced in data and UI is an engineering choice assessed against current
evaluator semantics. Relentless Hunter's edge is likewise not a rules gap; the source is explicit
and the representation follows the existing sourced-content-plus-manual-application precedent.

## Open questions

None requiring the user. If the rules reviewer rejects the labelled stormwight-kit interpretation
and the pinned Compendium cannot settle it, append it to `docs/rules-questions-for-user.md` with the
paths read, a recommendation and the alternatives, and continue with the rest of the unit.

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

Existing-support inventory recorded four gaps (Reaver and Stormwight aspects unsupported; nine of
twelve abilities unsupported; no stormwight kit contribution rows and no stormwight kit support; no
aspect Growing Ferocity content) and three pre-existing defects in shared V37 kit data that only
surface once stormwight kits are selectable: empty `tableRow` quotes used as provenance, four
paraphrased equipment strings, and a missing-kit diagnostic that covers only Berserker and Reaver.

No application, evaluator, shared-contract, `main`, runtime or hosted change was made. No
dependency install, build, typecheck, test or browser run was performed anywhere, and none was run
locally on Presidium. Documentation links and whitespace were not machine-checked in this stage
because those commands also belong on CT114; they run with the implementation stage's first check.

2026-09-19 (correction round): the integration lead returned findings on the first preparation
commit. Accepted and applied, with two independent Anthropic subagent reviews run under the
[recorded delegation authorization](../../agent.MD#character-track-delegation--2026-09-19): one
source review of every mechanical claim against the pin, one static inspection of the assembled
definitions, duplicate enforcement, aspect-change pruning and the kit provenance path. Neither
subagent could run node, pnpm, a build, a test or a browser, and neither used any web source.

Corrected in this round:

- **My error.** The first commit said only `Jump` and `Climb` are enabled for `class.fury.skills`.
  That is the raw module constant, not the served definition: `shared/content/supporting-backgrounds.ts`
  widens every `class.*.skills` choice to all skills after composition, and the decision's
  `optionsFrom` restricts legality to the exploration and intrigue groups, so all 22 legal values are
  already offered. The `character-options.md` guide warns about exactly this, and I read the raw
  module anyway. The skill pool is removed from the gap list and from the counterpart ledger.
- Duplicate skills are settled by Q-CHAR-11, not an open question. Free selections choose distinct
  eligible skills not already granted; deliberate duplication does not expand a printed pool. This
  unit implements that policy; the `ownedPool` exclusion is the proposed data representation, judged
  against what the evaluator already enforces.
- Relentless Hunter is an engineering representation choice, not rules uncertainty. The source is
  explicit, and Devil's Silver Tongue sets the precedent: grant the sourced content and leave
  application manual, without inventing a modifier field or implying the edge does not exist.
- The counterpart ledger was wrong: it mixed a level-two row and incomplete negative selections into
  the witness count. It now contains five completed legal builds covering only what this unit newly
  enables, with reused shared choices identified as reused and negative cases moved to tests.

### Shared files this unit will edit, after claiming them through the lead

These are this unit's implementation work, not a request for the lead to write code. Each claim is
coordinated because V46 may touch the same files.

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

2026-09-19 (second correction round, independent reviews returned): both subagent reviews came back
with findings that changed the plan, and they are recorded here rather than quietly absorbed.

Source review (pinned Compendium and Forge Steel):

- Confirmed the class baseline, all three aspects' grants, the level gates on every Growing Ferocity
  table, the printed ability-pool membership and order, and all four stormwight kits' figures.
- **Wrong in the first draft:** the null `KIT_BONUS_SOURCES` fields were enumerated as if all four
  kits shared them. Only Boren nulls `speed` and `disengage`; Corven, Raden and Vuken populate those
  and null `stability` instead. The first draft would have left three kits' stability provenance
  unrepaired.
- **Missing in the first draft:** the paths that actually carry every stormwight figure are
  `feature/fury/<kit>/`, not `kit/<slug>.md`, which holds only flavour and the signature ability;
  the sentence granting one stormwight kit is not in `stormwight-kits/kit-features.md`; the four
  kits' always-available Aspect Benefits were omitted entirely, and Raden's unconditional "ignores
  difficult terrain" was misattributed to Vuken's form; Corven's and Raden's animal forms forbid
  every ability except Aspect of the Wild; Vuken has two distinct +2 speed figures, one
  unconditional and one form-only, which must not be conflated; and Growing Ferocity provenance
  belongs to the aspect feature entries, not `primordial-aspect.md`.
- **New scope:** Slight Case of Lycanthropy cannot be taken by a stormwight fury. Salient records
  that only as narrative text with no validation, so enabling this aspect exposes an illegal
  combination. Added to scope with its own acceptance check and negative test.

Assembled-definitions review (static, whole extension chain):

- Confirmed the skills correction, and confirmed that both halves of Q-CHAR-11 are already
  enforced: fixed collisions generate replacement entitlements, and a deliberate chosen duplicate is
  already refused with an `invalid` `duplicate-skill` diagnostic that forces the build invalid. This
  unit therefore owes a regression test, not a mechanism; the `ownedPool` exclusion is optional
  presentation polish.
- **Raised the severity of the missing kit contribution rows.** The evaluator gates every kit
  contribution on an available `kit.<name>.contributions` decision, and none exists for the four
  stormwight kits — `STORMWIGHT_KIT_NAMES` is exported and referenced nowhere. A Stormwight who picks
  Boren today would derive no Stamina, and therefore no recovery value or winded value, no stability,
  no disengage and no kit speed term, with no diagnostic at all. It is masked only because the aspect
  is unsupported. This is the unit's most important implementation item, ahead of the provenance
  repairs.
- Noted a stale spec line for the lead: `docs/character-wizard-spec.md` still records the Q-R-103
  note that only Berserker with Mountain is supported, while V37 code supports all 21 ordinary kits.

Neither reviewer ran any install, build, typecheck, test or browser, and neither consulted any web
source. Remaining limits of this stage: every claim about the assembled definitions is from static
reading, since the composer cannot be executed here; those counts are confirmed on CT114 with the
implementation stage's first full check.
