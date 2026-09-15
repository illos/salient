# V24: Character wizard assessment and delivery proposal

| Field | Value |
| --- | --- |
| Family | V |
| Primary track | Characters |
| Owner | Codex, character wizard thread |
| Rules review | Not required for this assessment; required for mechanical implementation |
| Depends on | A09; assesses the integrated A02/V21 implementation |
| Related outline | [V08](V08-classes-and-advancement.md) |
| Status | Assessment complete; implementation sequence proposed |

## Goal and scope

Evaluate what exists and recommend the next bounded work toward complete class support in the editor.
This is an assessment, not an implementation of V08 or an assertion of complete rules support.
The user requested taking up the character wizard track, starting with this evaluation.

Assessment baseline: `main` at `e83930e`, 2026-09-15. No character branch existed at assignment.
Created `slice/V24` in `/srv/presidium/projects/salient/characters` from that commit. The main
checkout's uncommitted five-track instructions were read and followed, but were not copied or
committed into this worktree. The parser and foe worktrees remain independent.

## Scope clarification

The user clarified that “all 10 classes” meant the **nine** core classes in the pinned Heroes
[Classes chapter](../../vendor/steel-compendium/en/unified/md/chapter/classes.md): Censor, Conduit,
Elementalist, Fury, Null, Shadow, Tactician, Talent and Troubadour, through **levels 1–10**.
The user also confirmed eventual support for **Beastheart and Summoner**. Whether their delivery
belongs in this development cycle or a later one remains under discussion; this does not yet
change the existing core-only V1 release gate. The eventual class target is therefore eleven.

For this proposal, “fully realized in the editor” means complete legal creation and editing choices,
correct automatic build grants and derived values, readable abilities/features, level transitions,
saved and restorable progression, and correct campaign review/live-state behavior. Combat automation
has separate acceptance. A valid build can have manually resolved gameplay features, but a missing
permanent build modifier cannot be hidden behind a manual-combat label.

## What exists

| Area | Evidence in the baseline | Assessment |
| --- | --- | --- |
| Wizard | `web/wizard/`: step rail, choice controls, characteristics assignment, source cards, partial sheet, diagnostics, explicit draft save/reopen | A usable desktop shell to extend. It imports the Fury definitions directly. |
| Supported creation | `shared/content/fury-level-one-decisions.json` | Level-one Devil/Berserker Fury, Mountain kit, Soldier, one supported culture combination and narrow skill/perk/ability selections. Characteristic arrays and spoken-language choices offer real variation. Complications are hidden. |
| Evaluation | `shared/evaluate/character.ts` | Pure deterministic validation and derived values, with source provenance and incomplete/invalid/unsupported/complete states. Numeric derivation and many grants are Fury-specific. |
| Saved model | `shared/characterDraft.ts`, `convex/characterTables.ts`, `convex/characters.ts` | Source-bearing choices, parent-linked immutable revisions, separate authored details, draft/effective pointers and live state. A good persistence foundation, not yet a progression workflow. |
| Review and activation | `convex/lib/characterOperations.ts`, `characterBuild.ts` | Exact-revision admission/full-edit review, owning-Director exemption, stale review handling, expected revisions, command receipts, combat locks and compatible live-value reconciliation. Preserve these. |
| Sheet | `web/character-sheet/`, `convex/characters.ts` | Derived build, live values, abilities/features and source references; owner/Director/peer projections. No level-up/history/restore workflow. |
| Research | `docs/v1-character-wizard-contracts.md`, source index and coverage matrix | Broad existing research: nine classes × ten levels, 12 ancestries, 18 careers, 25 kits, 47 perks and 100 complications. Source inventory is not executable support. |
| Content delivery | `shared/content/compendium/manifest.json` | The gameplay snapshot has 403 entries and Fury is its only class entry. The wider Rules library and research index do not automatically supply selectable, evaluated characters. |

The baseline is a real narrow implementation, not merely a mockup. Equally, displaying disabled
alternatives is not support for those alternatives. V21 updated the presentation; it did not expand
the underlying class coverage.

## Changes needed before broad coverage

1. **Make class and level real evaluator inputs.** `EvaluationInput.level`,
   `DerivedBaseline.level` and `HeroEntity.level` are literal `1`; the backend always evaluates
   against `r01.1` Fury definitions. Ability costs and the baseline resource type are Ferocity-only.
   Generalize these contracts with the parser/table consumers before exposing other classes.
   Resource identity alone is insufficient to claim support for every class's resource behavior.
2. **Separate reusable decision rules from class content.** Keep one decision/evaluation system
   with sourced definitions per class and common option family. Support level-qualified decision
   instances, prerequisite/selection dependencies, restricted pools, budgets, automatic grants and
   grant origins. Currently branch ownership is a step ID and saves require globally unique
   decision IDs; repeated grants at different levels need deliberate identity.
3. **Generalize assignment and equipment contributions.** `assignment.ts` hardcodes Fury's fixed
   scores, assignable characteristics and arrays. The baseline exposes one kit, and Fury's Stamina
   calculation requires it. Other classes need no kit, one kit or two kits with source-specific
   overlap rules. Preserve individual kit grants as well as the combined derived contribution.
4. **Unify choice availability and change previews.** UI structural helpers and evaluator
   availability currently use different inputs (raw selections versus validated selections).
   `pruneUnavailable` removes unavailable descendants, but is not a complete validity/replacement
   planner. Return available choices, invalidated selections, removed grants and changed totals
   from shared logic used by both clients. Avoid separate class-specific wizard implementations.
5. **Add progression semantics to revisions.** Existing parent links are useful, but there are no
   scoped level-up or history/restore operations. Record target level, transition/grant origins and
   the effective base of a proposal. Preserve historical evaluation snapshots, inventory and live
   values. A level-up must stale an older full edit; restoring history must not replay item grants.
6. **Expand the gameplay content snapshot deliberately.** Reuse pinned source identities and
   source text; put interpreted build definitions outside the vendor trees. Forge Steel informs
   choice structure and interchange, not rules authority. Coordinate generator/content-manifest
   edits with the foe track. Before expanding the snapshot, replace the sheet's “first 500 feature
   rows, then filter common actions” lookup with a complete, bounded lookup of the required entries.
7. **Measure bounds with real higher-level builds.** Saves currently cap selections at 100 and
   serialized selections at 64,000 characters; revisions retain evaluation/provenance payloads.
   Test representative level-ten builds before deciding new limits or storage changes. These
   are expansion risks, not demonstrated failures of the current supported path.

The existing V08 outline also contains stale statements: current-value reconciliation and
advancement eligibility have since been settled in the owning specs. Use those current policies;
do not reopen them or reinstate a blanket “maxima changes unresolved” blocker.

## Forge Steel as a working reference and interchange target

The user reaffirmed both points during this assessment: use the existing working builder's ordering
and grants as a reference, and preserve **import and export** as features to develop. Export remains
planned future work; this reminder does not assign it a new release deadline.

Directly inspected the pinned Forge Steel implementation, beyond the existing research notes:

| Working reference | What to carry into our design |
| --- | --- |
| `src/components/pages/heroes/hero-edit/hero-edit-page.tsx` | Its normal section order is start, ancestry, culture, career, class, complication, details. Use this to check the completeness and flow of our steps; kit and other granted choices need to appear when their granting branch exists. |
| `class-section/class-section.tsx` | Collect active class features, group choices by level, and track completion per level. This is a useful basis for sharing one decision system between full editing and scoped advancement. |
| `src/logic/feature-logic.ts` | Select class and chosen-subclass features through the current level, then recursively traverse selected choices and automatic feature bundles, including domain, kit and perk grants. A flat list of class abilities misses this behavior. |
| `src/logic/factory-feature-logic.ts` | Factory defaults supply omitted counts, minimum levels, ability-pool restrictions and build/respite/play timing. Reading class declarations alone is insufficient. Preselected fixed grants must not become empty required prompts. |
| `src/data/classes/elementalist/elementalist.ts` | The proposed second-class path has a concrete reference for primary characteristics, automatic grants, nested enchantment/ward choices and level organization. Verify each resulting rule against the Compendium. |
| `src/models/hero.ts`, `class.ts`, `feature.ts`, `hero-state.ts` | Exported characters embed definitions and recursive selections alongside state. Preserve owning branch and level context when translating to compact local choices. |
| `src/logic/update/hero-update-logic.ts` | Forge Steel refreshes definitions and restores or filters nested selections on import. Reopening an exported character through this update path is essential compatibility evidence. |

Recommended per-class workflow: inspect its Forge Steel class/subclass definitions and referenced
factories → trace nested grants and their timing → verify mechanics and text in the Compendium →
encode our normalized definitions → test the choices, derived values and persisted behavior. Record
differences explicitly instead of assuming either a successful source extraction or a working
upstream UI proves every mechanical claim.

Design the bidirectional adapter alongside the first generalized definitions:

- Keep scoped Forge Steel IDs mapped to canonical SCC IDs and local decision instances. An upstream
  ID alone is not globally unique across all branches.
- Preserve original imported payloads, unknown fields, customizations and mapping diagnostics outside
  canonical rules evaluation. Preserve unsupported data without enabling excluded playable content.
- Translate current Stamina/Recoveries to and from Forge Steel's damage/used counters only after
  resolving supported maxima; account for resource values stored in nested features.
- Distinguish imported snapshots from actual chronological progression history.
- Export imported characters by updating understood portions of preserved data; export locally
  created characters by constructing a compatible hero graph. Test both cases.
- Do not pass campaign ownership, approvals or private application authority through interchange.

First implementation should include a documented representative Fury/Elementalist mapping and
confirm the new model loses no information required by these adapters. Actual file conversion and
live round trips remain dedicated later slices. Their acceptance includes import → edit → export →
Forge Steel reload, checking choices, grants and live values after its refresh pass. Valid JSON alone
is insufficient. See [the detailed interchange research](../forge-steel-interchange.md).

## Recommended delivery order

These are proposed bounded slices under V08, not a commitment to implement the whole track at once.
Integrate and review each completed slice, including working UI/headless behavior.

| Order | Outcome | Why this order |
| --- | --- | --- |
| 1 | Preserve the current Fury and add one complete supported level-one Elementalist path through generalized definitions, assignment, resource identity and no-kit derivation. | A contrasting class exposes Fury assumptions early and makes the generalization visibly useful. Limit common ancestry/background choices initially; publish the exact supported Elementalist selections. |
| 2 | Implement a sourced Fury 1→2 transition, scoped level-up, history browsing and restoration of recorded builds. | Prove progression and review/live-state isolation before authoring nine ten-level trees. Use the settled eligibility policy and manual XP entry where the respite loop is unavailable. |
| 3 | Add bounded Conduit and Tactician paths; include Conduit 1→2 dependency behavior and Tactician two-kit composition. | Exercise nested religion/domain choices, grants from a prior selection, and overlapping kit bonuses before bulk expansion. These are architecture acceptance examples, not optional late exceptions. |
| 4 | Complete the remaining level-one classes and branches in small batches; expand shared ancestry, culture, career, skill, language and perk options alongside them. | Existing primitives can now support broad usable coverage. Fury's other aspects, Shadow, Censor, Null, Talent and Troubadour each need their own sourced acceptance. |
| 5 | Complete progression in bands: levels 2–3, 4–6, 7–9, then 10, across supported classes. | Explicitly exercise every transition and echelon boundary, including delayed choices and changes to earlier grants. Do not postpone all higher-level work until every level-one option is finished. |
| 6 | Close exceptional ancestry/perk/complication and starting-item gaps; finish lifecycle and Forge Steel import acceptance, followed by the planned compatible-export slice. | Nested former ancestry, drawbacks, conditional grants, private Director inputs and one-time inventory grants need their actual dependencies. Bidirectional adapter design starts in stage 1; implementation and real round-trip proof follow a stable evaluated model. |

Stage 6 cases should be sampled in model tests earlier; the ordering is for completing their user
workflows. Shared-option work should ship throughout, since a class dropdown with fixed backgrounds
does not meet the eventual character-editor goal. Inventory grants depend on inventory work; parser
completion is not a general dependency of class choices or permanent build calculations.

### First implementation slice: concrete acceptance

Recommended next outcome: **create, save, reopen and review either the existing Fury or a supported
level-one Elementalist using the same wizard and evaluator.** Select the exact Elementalist branch,
enchantment, ward and abilities from the pinned sources when claiming the slice.

- Existing Fury choices, derived values, audience restrictions and campaign behavior still pass.
- Trace both class paths through Forge Steel's actual definitions, factory defaults and nested
  selections; document their bidirectional mapping without embedding the upstream runtime in ours.
- The selected Elementalist path has correct sourced characteristics, resource identity, grants,
  ability costs and derived values without requiring a kit.
- Changing a draft's class removes incompatible grants, explains affected choices, and preserves
  independent authored details and still-valid foundational choices.
- Named/headless assignment and UI assignment persist equivalent builds. Save/reload recovers them.
- Incomplete drafts remain editable. Unsupported options are distinguished from invalid selections
  and legal features whose gameplay effects require manual resolution.
- Admission/full edits activate the exact reviewed revision. Existing compatible live values are
  preserved; changing a played character to an incompatible resource still requires the unresolved
  explicit reconciliation contract, rather than inventing a conversion.
- Full source text is available for every granted feature/ability. Only verified shared operations
  advertise automated execution; dependent combat automation stays coordinated with the engine track.
- Run source-derived evaluator tests, persisted Convex tests, browser flow checks and `pnpm check`,
  followed by independent implementation and rules reviews. Live checks use an isolated backend.

## Completion evidence for the eventual editor

### Supplemental classes: editor inclusion proposed

Following the user's scope clarification and observation that the exotic behavior principally
belongs to the table/engine, recommend including **all eleven classes in the editor build-out**.
The earlier recommendation to treat the supplements mainly as early architecture examples gave
too much weight to wizard-specific complexity. Their complete creation/edit/progression choices
can use the same bounded delivery process as core classes. Table UI and engine support have
separate milestones and must not become a blanket prerequisite for their editor implementation.
This is the revised recommendation; the overall core-only V1 release gate has not yet changed.

The pinned sources expose concrete model requirements:

| Class | Editor responsibilities | Larger gameplay dependency |
| --- | --- | --- |
| Beastheart | Choose a companion; preserve its identity and source; derive its build alongside the hero; show grants belonging to the hero, companion or both; test a companion advancement breakpoint. | Linked turns/action allowances, shared resources and distinct creature health/conditions; companion replacement and history. |
| Summoner | Choose a circle, portfolio options and formation; preserve creature definitions and level-dependent improvements; keep learned options distinct from live summoned creatures. | Summoning/dismissal, controlled squads, pooled health, commands and hero-linked effects. Do not assume ordinary foe-minion behavior is identical. |

Compendium evidence read: `feature/beastheart/level-1/companion.md`, `companion-rules.md`,
`heart-of-the-beast.md`, `ferocity.md`, and `feature/beastheart/level-10/companion-advancement-feature.md`;
`feature/summoner/level-1/portfolio.md`, `minions.md`, `formation.md` and `essence.md`, under
`vendor/steel-compendium/en/unified/md/`. This establishes representative architecture concerns,
not exhaustive mechanical acceptance.

Forge Steel's `src/data/classes/beastheart/beastheart.ts` uses `createSummonChoice` for the
companion; `src/data/classes/summoner/graves.ts` uses it for portfolio selections. Its
`src/models/summon.ts` combines a creature definition with summoning information and advancement
features. This demonstrates useful shared selection structure; it does not establish identical
lifecycle rules for companions and summoned minions.

Each class slice should actually evaluate, save/reload, change a dependent choice and
restore a recorded build. Check explicit Forge Steel import/export mappings for the related
creature and nested selections. Learning a summon must never spawn a live creature; reevaluating
a companion's build must never refill its health. These examples should drive the minimum needed
model extensions, avoiding an untested generic companion framework.

The revised sequence keeps the first generalized class and progression slices, then includes
Beastheart and Summoner alongside the other classes when their decision/grant dependencies are
available. They do not have to wait for all nine core classes to be complete. Complete their
editor progression in the same level bands; schedule creature control, table presentation and
combat execution with the consuming tracks. No claim of full table support follows from editor
completion alone. Do not advertise a source option as a valid build until its actual choices,
permanent grants and derived values are supported.

### Coverage checks

Extend the existing coverage matrix with executable evidence for decisions, grants, derived values,
save/reload, editing, each level transition and source display. Track gameplay automation separately.
Test every subclass/domain branch and each transition, not just one level-1/5/10 hero per class.
Include forbidden selections, budget/count errors, parent changes, duplicate-skill entitlements,
deferred languages, kit overlap, conditional/negative modifiers and no repeated inventory grants.

The key end-to-end history example remains a recorded level-seven Shadow restored to its level-three
build, retaining present inventory and later records. Direct high-level creation must retain the
choices needed for each lower-level build; imported missing history must remain visibly incomplete.

## Verification and work log

2026-09-15, assessment:

- Read the project instructions, current five-track roadmap/kickoff, build process/status,
  acceptance record, character specs, V08 outline and existing source research.
- Inspected wizard, evaluator, persisted revision/review/activation operations, sheet and content
  snapshot at `e83930e`. Inspected the pinned Classes chapter and representative class progression
  source tables; this assessment is not a new comprehensive rules review.
- In the baseline checkout, ran `pnpm exec vitest run --project engine --project app
  tests/character-evaluator.test.ts tests/character-derived-values.test.ts
  tests/character-creation-rulings.test.ts tests/app/characters.test.ts
  tests/app/character-rulings.test.ts tests/app/character-review-queue.test.ts`:
  **six files, 31 tests passed**. These include evaluator behavior and persisted application
  readback/review/ruling tests, not just mutation-response assertions.
- `python3 docs/research/build-v1-wizard-index.py --check`: both research artifacts verified.
- `pnpm check-vendor`: both source submodules match their recorded pins.
- `node scripts/inspect-character-sources.ts`: inspected 11 Forge Steel classes and 33 subclasses,
  with ten level entries per class. These include the nine core classes plus Beastheart and
  Summoner; counts do not certify choice coverage or change the core scope.
- Checked all nine relative link targets in this assessment (the vendor target against the pinned
  baseline checkout); formatted the assessment with Prettier and ran `git diff --check`.
- No implementation, backend sync, seed, live browser walkthrough or deployment performed. The full
  repository check was not rerun for this assessment. Historical browser acceptance is reported as
  historical evidence, not a new test result.

## Owning references

- [Character wizard specification](../character-wizard-spec.md)
- [Researched V1 character contracts](../v1-character-wizard-contracts.md)
- [Source coverage matrix](../research/v1-wizard-coverage-matrix.md)
- [Character sheet specification](../character-sheet-spec.md)
- [V08 outline](V08-classes-and-advancement.md)
- [Recorded prototype acceptance](evidence/v001-acceptance.md)
