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

- Source ledger: `tests/fixtures/v100-conduit-expected.json`; twelve builds, all four arrays,
  five prayers/four wards and all 23 source abilities plus 41 embedded activities. Live cohort
  `scripts/headless/conduit.ts` checks independent Piety costs (including optional enhancements),
  outside-combat waiver, failed affordability, manual target readback and Curse of Terror applied/
  resisted save registrations. Pure all-tier thresholds complement the live random-tier witness.
- ENGINE found one resource-label defect (Wrath instead of Piety) in the embedded source adapter;
  repaired and covered by source-ledger cost checks. Manual healing and domain conditions remain
  labelled, including the out-of-combat Healing Grace Victories budget.
- Audit reachability gains a conservative finite selected-pool witness: one of two printed portfolio
  domains, with supported ancestor selection, exact cardinality and shared availability/pool checks.
  Unknown/excluded/dynamic forms remain unknown. This repairs three reachable domain ability rows;
  it changes reporting only. Regression retains all original V88 rows/hashes and adds 23 explicit IDs.
- Authoring: engine fixture 3/3; audit-focused 23/23. Full check/live evidence pending TESTER.

- ENGINE static review PASS `ec9108a`: [rules review](audits/V100-conduit-rules-review.md).
  Reviewer also confirmed the report correction for three existing Time Raider abilities: separate
  dependency paths must not share a cycle marker. Final report: 19 compiled, 1339 compatibility,
  2 structurally supported but unavailable; application dispatch is unchanged by reporting.
- TESTER `ec9108a`: generators exit 0; full `CI=true pnpm check` exit 0, 984 tests, 197.484s.
  Live Conduit cohort failed at the domain-edit fixture (11.8s): Protection requires Exploration,
  but the scenario selected Empathize. Corrected to Navigate using the domain-feature table.
  Retain full gates; retry only touched authoring checks and the Conduit cohort. Artifacts:
  `/srv/presidium/projects/salient/test-artifacts/V100-ec9108a`.
- Corrected source comment: Curse of Terror damage is holy. Numeric expectations and runtime unchanged.

- Final ENGINE review PASS `a91faef` (Chords 1437); fixture and holy-damage comment corrections
  verified independently. TESTER `a91faef`: touched lint/format exit 0; isolated
  `SALIENT_HEADLESS_COHORT=conduit` run through `scripts/verify-character-headless.ts` exit 0,
  72.2s wall time, twelve builds and 64 distinct actions. Retained full 984-test gate from `ec9108a`.
  This is one successful selected cohort, not a repeat of the aggregate headless suite.
  Artifacts: `/srv/presidium/projects/salient/test-artifacts/V100-a91faef`.
  Backend stopped, ports free, data retained. Ready for DEPLOY2 promotion with accepted evidence.
