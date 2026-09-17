# V37: Supporting character choices

| Field | Value |
| --- | --- |
| Primary track | Characters |
| Owner | Character wizard lead |
| Depends on | V25, V32 |
| Rules review | Required |
| Status | In progress — source inventory and independent rules research |

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
complications. The current content snapshot contains 13 culture aspects, 18 careers, 57 skill/group
records, 25 kits, 47 core perks and 100 complications. Recount from the pinned sources and identify
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
archived. No new supporting-choice backend/runtime changes yet. Source research precedes changes.
