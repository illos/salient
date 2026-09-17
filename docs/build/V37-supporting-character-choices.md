# V37: Supporting character choices

| Field | Value |
| --- | --- |
| Primary track | Characters |
| Owner | Character wizard lead |
| Depends on | V25, V32 |
| Rules review | Required |
| Status | Verified on slice/V37 — shared-main integration pending |

## Authorized outcome

On 2026-09-17 the user requested merging V32, then deep research and implementation of the
supporting choices around ancestry and class: careers, complications and related options. Inventory
all eligible choices in the database, compare them against pinned Forge Steel, resolve or explain
discrepancies, and expose full text, correct selections and supporting permanent build mechanics in
the wizard. Parser and gameplay automation are separate work. Existing ancestry/class coverage is
preserved; this is not an assignment to implement additional class or ancestry trees.

## Owning specifications

- [Decision system](../character-wizard-spec.md#3-decision-system).
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows).
- [Current values](../character-wizard-spec.md#current-values-when-a-build-changes).
- [Research contracts](../v1-character-wizard-contracts.md#5-culture-skills-languages-and-careers).
- [Perks and complications](../v1-character-wizard-contracts.md#8-perks-and-complications-are-real-build-content).
- [Character verification](character-verification.md).

## Scope and delivery

Inventory cultures, careers/inciting incidents, skill groups/skills, languages, kits, perks and
complications. The current content snapshot contains 13 culture aspects, 18 careers, 57 selectable skill
records plus five group records, 25 kits, 47 core perks and 100 complications. Recount from the pinned sources and identify
excluded supplemental records explicitly. Source presence does not establish class eligibility.

Research and compare source text, choice counts/pools, fixed grants, nested choices, conditional
effects, drawbacks, initial rewards and timing. Preserve core rules and case-specific user rulings
when Forge differs. Never treat Factory defaults or omitted Forge controls as source authority.

Implement in bounded reviewed increments under this owning slice, with shared definitions and
evaluation feeding UI/headless persistence. Full source is available for each option, including
manual effects. Permanent modifiers and required decisions must work before declaring an option
build-complete. Gameplay-time configuration, companion play and inventory spending remain under
their owning contracts; record concrete unresolved dependencies in the existing question queue.

## Acceptance

1. Exhaustive reproducible inventory and comparison: every eligible record has identity, source,
   Forge match or explained difference, required choices and build/manual classification.
2. Every supported choice displays complete readable text, correct allowed selections, counts,
   grants and drawbacks; changing a parent removes obsolete selections and effects.
3. Shared evaluation derives permanent effects with provenance and preserves source eligibility,
   duplicate-skill rulings, deferred languages and perk/kit restrictions.
4. Creation/editing and supported Fury advancement save and reload exact choices; effective
   campaign review, current resources and immutable history remain correct.
5. Source-derived tests include meaningful contrasting cases and forbidden selections. Persisted
   app tests and actual browser journeys verify full text, nested controls and resulting sheets.
6. Pinned Forge reference comparisons, full CT114 check/build, independent implementation and
   rules reviews pass. Integrate and verify the shared app before reporting delivery complete.

## Work log

2026-09-17: source work claimed in `/srv/presidium/projects/salient/characters-build`, branch
`slice/V37`, from integrated V32 `ea831d6`. V32 shared rollout passed both real character journeys; closeout is `d9dac21`.
New implementation will use the named CT114 `characters` environment after V32 evidence is
archived. This initial claim preceded the source and implementation work recorded below.


## Source and implementation checkpoint

The [complete inventory](../research/v37-supporting-choice-inventory.md) links both exhaustive
ledgers. The first reproduction check passed against 289 exact source records and all named core
records/Forge matches. Source comparison exposed required nested choices beyond Forge's controls;
those choices are represented in shared definitions and the owner wizard.

Shared evaluation covers all career rewards, ordinary kit contributions, fixed-skill replacements,
owned targets, real skill/language loss, conditional Shared Spirit skill sets, permanent complication
values, source ability grants and source cost adjustments. Initial items/project points remain
recorded build entitlements; their equipment use/spending and conditional play remain separate.
Strange Inheritance has a separate private Director store and picker, bound to the displayed build
revision. It never writes the secret identity into owner selections or public history.

Following in the Footsteps stores server-derived choice origins in immutable revisions. Legal
future references survive reaching their level; changing the reference establishes a new origin.
Fury aspect restrictions apply to the future catalog. Full edit, progression and restoration share
this rule; clients cannot supply an earlier origin through public mutation arguments.

Independent static reviews found and corrected missing level-scaled immunity, removed-skill
ownership, choice-origin retention, cost-floor and private revision-view issues. Subsequent remote results and integration are recorded below.


## Validation checkpoint

The first complete CT114 check passed all 648 tests (274 evaluator, 374 app/tooling), lint,
TypeScript, source/link checks and frontend build. The generated snapshot contains 483 entries,
including ten added Dragon Knight trait/ability sources. Existing Fury and Elementalist fixture
values and provenance remain unchanged.

A real startup failure exposed a pinned bundler compatibility issue: mixed attributed/unattributed
imports of the same complication JSON produce a synthetic esbuild metafile path, which Convex 1.45
incorrectly passes to `stat` and then suppresses the error. A CT114 minimal reproducer confirmed
that path does not exist. The generator now emits the same JSON attribute as the shared evaluator;
no dependency pins or source records changed. The next actual function upload completed in 4.44s.
Normal restart reached a healthy backend and verified HTTPS route. Final full check passed
648 tests after the UI corrections. Elementalist, Fury advancement, supporting choices and
private inheritance all passed actual authenticated journeys. The older wizard-frame test
required updated step/availability labels; final evidence and shared rollout are tracked in
[the evidence index](evidence/V37/README.md).


## Integration readiness

All 648 checks and five final authenticated browser journeys pass on CT114 `characters`.
The earlier table/sheet regression journeys also pass. Independent implementation and rules
reviews cover every authored area without self-certification; the
[integration receipt](../reviews/V37-integration-review.md) links those scopes and artifacts.
The source comparison and Dragon Dreams/Wyrmplate ruling are complete. Parser/gameplay automation
and additional class/ancestry trees retain their separate milestones. Git merge and verification
of the established shared development app are the remaining delivery steps.
