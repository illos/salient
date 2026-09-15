# A02 latest character rulings: Q-CHAR-10 and Q-CHAR-11

Research recorded before implementation. New owning commits: `5d0e4c5` (unspent ancestry
points) and `e0f52f7` (skill collisions). Read the current question answers and
`character-wizard-spec.md#confirmed-behavior`, plus R02's matching tables/status contract.

Pinned source only, revision `fb83a789da8f0327a389c277a0c790b1648d5810`:

- `en/unified/md/feature/trait/devil/devil-traits.md` grants three ancestry points to spend.
  The user's answer now explicitly permits underspending with a warning and no completion or
  acknowledgement gate. Preserve over-budget rejection and unrelated required choices.
- `en/unified/md/chapter/making-a-hero.md`, **Choosing Skills**, recommends considering all
  creation grants together and permits another skill from any group when two sources grant the
  same specific skill. The source does not explicitly state a fixed-only restriction. The user's
  adopted interpretation resolves fixed grants first and disallows discretionary duplication
  from creating an unrestricted choice; it applies regardless of input/UI ordering.
- The supported Soldier/Berserker Fury path has fixed Nature and Lift, with no unavoidable
  fixed/fixed duplicate. Warden is outside the delivered career choices. Therefore no broader
  replacement-choice workflow is needed for v0.01. Invalid chosen collisions must not be accepted
  as complete or mint an unrestricted entitlement. Exhausted pools and explicit feature-specific
  replacement rules remain their concrete later scope.

## Implemented scope

- Unspent ancestry points retain `budget-unspent` warning severity and completion eligibility;
  the message now reflects the confirmed policy and carries no open-question uncertainty.
- Skill accounting collects fixed grants before evaluating discretionary collisions, independently
  of selection-map order. A chosen collision is invalid, preserves the fixed grant and creates
  no unrestricted replacement. Chosen/chosen collisions diagnose both granting choices; invalid
  choices contribute no skills. The original ten distinct supported grants remain unchanged.
- No supported fixed/fixed collision exists. A future unsupported path requiring that entitlement
  remains explicitly unsupported, keeping the skill once and reporting that its unrestricted
  replacement choice is needed. It does not silently discard or choose the entitlement. Building
  a replacement-choice workflow for Warden or other future options remains outside v0.01.
- Removed resolved Q-CHAR-1/5/6/10/11 tags from the R01 artifact, so the wizard no longer labels
  them open. Corrected the culture-name note: authored assembly of core culture aspects does not
  create a custom selectable language. Skill/language pools and source quotations are unchanged.
- Refreshed R01/R02 completion and collision notes and marked the earlier audit's unresolved
  Q-CHAR-10/11 statements as historical. The minimal evaluator now has no active uncertainty ids.

## Verification and independent review

**25 focused tests passed** across five files: the new creation-rulings tests, existing whole-result
evaluator fixtures, source decision/derived-value checks, and new persisted public-operation tests.
The ancestry cases cover two points and zero points, remaining required choices and over-budget
rejection. The collision cases cover earlier chosen/later fixed Lift and two chosen Swim grants,
reversed input ordering, no duplicate grant and no unrestricted entitlement.

Persisted coverage calls the public shared evaluator, saves the exact result, and proves a two-point
revision can submit and activate without acknowledgement. A duplicate-choice draft is invalid,
cannot submit, and preserves the previous effective baseline and live state. Existing whole-result
fixtures and source fidelity checks remain green.
Standalone engine TypeScript, focused ESLint and Prettier checks also pass.

`review_a09` independently read the current user rulings and pinned budget/skill/Fury/Berserker
sources, reviewed this implementation, and reran 23 engine plus two persisted tests: **code and
rules review pass**. No new ruling or online research was used. Root owns deployment and final
browser/visual verification; this subtask did not deploy or commit.
