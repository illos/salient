# V103 Null level-one rules and implementation review

Reviewer ENGINE, 2026-09-21.
Candidate `17c07760ccbab470dad10a3d8b93e1a84c761f0d`, branch `slice/V103`, base `0919e704259a14d6ea3c911f3c356ff25c3b87b9`.

**Static PASS: no blocking findings.** This is independent source, implementation and authored-proof review. No tests or runtime operations were executed by this reviewer. TESTER acceptance remains separate.

Authority: pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`; independent inventory/citations in `docs/build/audits/V103-null-source-audit.md`. Sources include Null Basics, every level-one Null feature/ability, the clean Heroes choice/cost headings, and rolled-damage/kit rules. No rules inferred from evaluator output.

## Reviewed behavior

- Correct fixed Agility/Intuition2, arrays assigned to Might/Reason/Presence, Stamina21, eight Recoveries and Intuition potency. Two distinct signatures from eight, one3-Discipline and one5-Discipline choice. No kit grant. All three traditions/skill pools and augmentations match source.
- Null Speed adds Agility to speed and Disengage. Density adds6 Stamina/+1 stability and recomputes recovery/winded values; Speed adds1 to speed/Disengage. Force adds1 only to Psionic rolled damage through the existing modifier path; it is not a global damage or characteristic bonus.
- Eighteen source envelopes and21 parent-linked embedded/manual actions are exposed through sheet and shared resolution adapters. Discipline costs and outside-combat waiver are wired; four optional1-Discipline spends are separate from free parent uses. Chronal Spike replacement records permission at0; original attack owns its normal3 cost and roll, avoiding duplicate payment.
- Null Field mode/lifecycle and voluntary end are manual; wording retains persistence across encounters and dying termination. Shield reduction and tradition follow-ups retain prerequisites; initial Shield follow-ups do not require threshold2. Martial Arts explicitly uses Intuition for Grab/Knockback and size qualification and permits slide substitution.
- Phase Inversion Strike's conditional teleport Effect creates a manual-section diagnostic. Its push node is not admitted for compiled execution: damage follows compatibility handling with teleport/push remaining manual. The report reflects this; no name-specific exception was added.
- Pressure Points alone is the new supported compiled condition entry. Joint Lock lacks save-ends; Stunning Blow is compound; Phase Strike is an out-of-phase composite; Arcane Disruptor has dependent Malice punishment. Those boundaries remain explicit.

The final runtime delta from authoring review `aa498a1` clears the explicit empty `options` on pooled skill decisions so `optionsFrom` can supply legal class/tradition skills. The original helper call supplied an empty options list that shadowed those pools. This is a necessary bounded repair; I did not catch it in the first static pass. The final source-derived complete-build and tradition-edit cases cover the affected choices.

## Ledger and authored proof

Reviewed `tests/fixtures/v103-null-expected.json`, `tests/character-v103-null.test.ts`, `scripts/headless/null.ts` and Pressure Points additions in `tests/scripts/live-compiled-report.test.ts`.

Four Human Soldier witnesses span all arrays, three traditions, three augmentations, eight signatures and eight heroic choices. Force witnesses: Stamina21/recovery7/winded10/speed7/disengage3/stability0. Density:27/9/13/7/3/1. Speed:21/7/10/8/4/0. All eight Recoveries, no kit. Expected skill groups, features, actions and costs match sources.

Source damage checks:

- Force area/strike witness: Dance4/5/6; Faster5/6/8; Chronal10/13/16; Squad7/10/14. Neither Dance/Faster/Squad incorrectly adds Agility to printed flat damage.
- Density: Inertial Step7/9/12; Joint Lock6/9/11; Arcane Disruptor10/14/18.
- Speed: Kinetic6/7/8; Magnetic7/10/13 psychic; Relentless8/10/14; Impart Force0 direct tier damage, movement-dependent damage manual.
- Force condition witness: Phase Inversion7/9/11; Pressure Points7/10/12; Stunning7/8/10; Phase Strike6/7/9 psychic.
- Ordinary non-Psionic melee free strike4/7/9 receives no Force bonus, with separate persisted Stamina check.

The cohort asserts39 distinct source/embedded uses, source costs and persisted event/state readbacks, affordability refusal, outside-combat waiver, owner refusal, tradition/augmentation draft edits and admitted-build isolation. Faster Than the Eye uses two targets with both readbacks. Manual records leave target and actor state unchanged except resource payment. Psychic Pulse is recorded manual, not falsely claimed as automatic fixed/delayed damage.

Pressure Points live design uses A2 target for resistance at any I2 potency tier, and independently built Elementalist A-1 for guaranteed application without rerolling. It checks target weakened, an active source-use-linked instance and a registration ID. Pure cases exercise below/equal scores for every threshold0/1/2. These checks read the actual random tier and compare with independent damage values. No headless execution claim is made here.

## Limits

Manual action recording is not automated resolution of aura membership, potency adjustments, mitigation, threshold lifetime/surge triggers, movement, actual-distance damage or fixed/delayed damage. The proof does not claim those effects occur merely because an event exists. Phase Inversion's prerequisite remains manual; Impart Force's edge is supplied manually. Field state is not automatically managed across combat boundaries. These limits match the slice's stated scope.

The save registration is checked by instance reference, not independently queried or rolled in this cohort; prior saving-throw coverage is reused. Fixed-damage Force exclusion is principally enforced by leaving those effects manual and by the rolled-damage-only implementation, not a separate live automated fixed-damage test. Repeated outside-combat use retains the existing warning-only handling.

Generated content/report deltas were read for inventory consistency, not regenerated by ENGINE. Full gate and isolated live results must come from TESTER. No remaining static rules or implementation blocker identified at the named candidate.

Reviewed-By: ENGINE (pass, 2026-09-21)
