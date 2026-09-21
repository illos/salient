# V100: Conduit level one

Rules review: required. Depends on V99.

## Goal

Build and edit level-one Conduits through the full wizard and shared API.

## Scope

[Decision system](../character-wizard-spec.md#3-decision-system) and
[wizard flows](../character-wizard-spec.md#4-wizard-flows): choose a printed deity, two portfolio
domains, one level-one domain feature/skill, one prayer, ward and triggered action, two signatures,
and one ability each costing 3 and 5 Piety. No ordinary kit; higher levels remain unsupported.
Custom portfolios are deferred under the specification's Q-CHAR-6 decision.

Source: pinned `en/unified/md/class/conduit.md`, and all files in `feature/conduit/level-1/`
and `feature/ability/conduit/level-1/`. Printed portfolios reuse the V99 source catalog.
Prayer of Steel and Speed adjust permanent statistics; Destruction uses the shared Magic damage
modifier. Bastion Ward adjusts the equivalent saving threshold by one. Soldier's Skill requires
actual armor/weapon use and remains conditional/manual; Prayer of Distance remains a visible
manual range bonus. No equipment or spatial state is inferred. Piety generation, domain effects,
healing/Recovery transfers, temporary buffs, companions and rituals retain explicit source-timed
manual actions. Fixed paid choices debit the recorded Piety pool. Healing Grace enhancements are
separate 1-Piety uses; their total outside-combat budget equals Victories and remains manual.

Forge mapping: pinned `src/data/classes/conduit/` counterparts; primary Intuition, two domains,
one prayer/ward and corresponding chosen abilities. Independent expected values come from the
Compendium rather than evaluator output. Guided progression is separate from this full editor.

## Acceptance checks

1. Source-derived witnesses cover twelve domain features, all prayers/wards/arrays, both triggers
   and every signature/heroic option. Negative cases prove portfolio and chosen-feature gating.
2. Authenticated `conduit` cohort saves/admit builds, changes/prunes domain choices, invokes every
   source and embedded action, reads paid costs/log/target effects, and tests compiled condition paths.
3. TESTER owns generators, full check and isolated cohort. ENGINE independently reviews sources
   and proof; DEPLOY2 publishes accepted results without repeating tests.

## Work log

- Started from `2db8e7b`, branch `slice/V100`, `.worktrees/class-conduit`.
- Independent inventory audit: [ENGINE source audit](audits/V100-conduit-source-audit.md).
  Conduit-specific Intuition passages control Hands and Inspired Deception. The Domain Piety
  introduction conflicts with Sun/War's named paragraphs; trigger resolution remains manual,
  retaining the full source and naming the discrepancy rather than automating an interpretation.
  Grave Speech's death/time/language facts remain manual; zero Stamina is not proof of death.
