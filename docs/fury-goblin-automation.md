# v0.01 combat automation boundary

Status: **G5 re-scoped, 2026-09-14**. Follow [game basics first](pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope)
and the [G4 checklist](pre-alpha-design-gaps.md#v001-combat-acceptance-checklist). Shared game operations
form the v0.01 foundation; class/stat-block-specific execution is deferred and manually resolved.
This supersedes the earlier turn-start Ferocity automation requirement and ends the feature-by-feature
automation questionnaire. Historical source research/examples remain below, clearly marked.
The earlier [hero fixture](hero-fixture.md) is evidence, not a requirement to automate its features.
This is a specification boundary, not an implementation report.

Source revision: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Research uses only that local corpus. User answers are recorded separately in
[the decision record](gameplay-decision-record.md).

## Per-mechanic status

**v0.01 foe visibility, confirmed 2026-09-14:** defer hiding and its hide/reveal/Add visibility
controls. All loaded foes are visible in audience rosters, with participating foes visible in
shared setup and initiative. Full stat blocks remain Director-only; health display and Malice
visibility keep their separate policies. Fuller V1 hidden-foe designs below are future scope.
See [the owning contract](table-spec.md#monster-visibility-and-health-display). This records scope,
not an implementation change.

| Mechanic | v0.01 automation decision | Contract/evidence |
| --- | --- | --- |
| Critical-hit recognition and immediate extra main action | **Automatic — confirmed, 2026-09-14** | [Shared action-tracking contract](table-spec.md#v001-critical-hits-and-additional-main-actions); use remains optional, detailed timing/source exceptions still need contracts |
| Turn-start Ferocity | **Automation deferred, 2026-09-14** | Earlier automatic requirement superseded; source and future example retained below |
| Victories | **Use source-earned awards; no artificial test inflation — confirmed** | [Victories and numeric adjustments](#victories-and-numeric-adjustments); existing Director-confirmed closeout remains |
| Other Ferocity grants, thresholds and encounter-end loss | **Automation deferred** | Class-specific lifecycle/trigger logic is manually resolved; no further v0.01 feature questionnaire |
| Malice generation and encounter-end loss | **Automatic — confirmed** | [Malice lifecycle](#malice-lifecycle) below; Director manual adjustments remain available |
| Brutal Slam | **Unique effect execution deferred; manual resolution** | Existing parser research remains; shared dice/action/state operations can consume known inputs |
| Spear Charge | **Unique effect execution deferred; manual resolution** | Shared dice/action/state operations can consume known inputs without automatically interpreting the stat block |
| Bury the Point | **Unique effect execution deferred; manual resolution** | The known fixed-cost payment path and generic save-ends system remain; no automatic potency/bleeding selection is required |
| Winded display | **Automatic updates required by G4**; sourced formula/boundary examples still owed | [Damage scope](pre-alpha-design-gaps.md#damage-and-corrections--confirmed-for-v001) |
| Hero dying at zero Stamina | **Automation deferred beyond v0.01** | [Hero dying](#hero-dying) below; retain Stamina recording and manual resolution |
| Ordinary foe defeat at zero Stamina | **Automatic — show Slain, confirmed** | [Ordinary foes at zero Stamina](#ordinary-foes-at-zero-stamina); retain roster entry until normal cleanup |
| Free strikes | Common-rule operation contract still needed; unique feature exceptions manual | Preserve sourced basic behavior without requiring all class/stat-block exceptions to be automated |

Other unique fixture abilities/features follow the same manual-resolution boundary, including
ancestry/aspect/kit features and foe traits such as Crafty. Preserve the source and report actual
applied/manual/unresolved work. Known costs, accepted roll/damage inputs and manually registered
effect facts use shared operations; deferred interpretation must not be hidden in UI conditionals.
G4's existing deferrals remain. Building the minimal hero's sourced baseline is separate G1–G3 work.

## Turn-start Ferocity

**Historical/future contract:** the 2026-09-14 game-basics-first decision defers this automation
beyond v0.01, superseding its earlier inclusion. The source and example below remain useful for
later parser/engine work. In v0.01 the table resolves Ferocity and records actual adjustments manually.

**Source:** [Ferocity in Combat](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md#ferocity-in-combat),
SCC `mcdm.heroes.v1/feature.fury.level-1/ferocity`, grants 1d3 Ferocity at the start of each Fury turn
during combat. This grant is distinct from the encounter-start Victories grant and damage-triggered
grants; those have separate automation decisions.

**Recommendation and user decision:** automatically roll, add and log the turn-start grant through
the shared clock. The user accepted this for v0.01 on 2026-09-13: “That sounds good.”

**Retained future behavior, not a v0.01 gate:**

- Dispatch at the Fury's actual turn-start boundary through the shared clock/operations. Sheet
  selection, reload, reconnect, duplicate delivery and interrupted-turn resumption do not create a grant.
- Roll one shared 1d3 result and add that amount to current Ferocity once. Record actor, source,
  turn/cause, accepted die result and before/after balance. Automatic work does not invent a user
  invocation; retain its link to the operation that caused the boundary.
- Make the grant available at its source stage before subsequent spending. Preserve the existing
  cost, usage-limit, dependency and recorded-history contracts.
- Authorized sequential rewind of the turn-start boundary restores the preceding balance and its
  associated bookkeeping. Players retain their turn-start undo limit. Exact Redo restores the recorded
  roll/grant; genuinely executing a new turn start after rewind uses a fresh roll under existing policy.

**Acceptance example:** the fixture Fury starts with 0 Victories and 0 Ferocity before its first turn,
with no other due effects in this example. The accepted d3 result is 2: current Ferocity becomes 2
and the log records 0 → 2. A retry leaves 2. Authorized Director rewind across that boundary restores
0; exact Redo restores 2
with the same recorded die result. This example isolates the grant and does not preempt other due work.

Implementation and persisted-state verification of this feature are future work; recording the
contract does not claim the grant is implemented or expand the current shared-clock requirement.

## Victories and numeric adjustments

**User clarification, 2026-09-13:** grant Victories according to the rules, without artificially
inflating numbers for the test. The Director can deliberately edit numbers inside the encounter.
Preserve the difference between source-earned awards and attributed manual adjustments.

**Follow-up clarification:** this applies to **every resource**. Automatic gains, costs and resets
must use the actual pinned rules and recorded state. Do not alter formulas, add demo-only grants or
silently prefill resources to make an acceptance scenario work. If an adjustment is needed, make it
an explicit, attributed Director edit inside the encounter and retain its before/after values in
history. A manually prepared scenario must not be presented as a source-earned progression.

**Source:** [Victories](../vendor/steel-compendium/en/unified/md/rule/resource/victories.md), SCC
`mcdm.heroes.v1/rule.resource/victories`. A hero starts an adventure with 0 Victories. Surviving a
combat where the party achieves its objectives earns 1 Victory; the Director may withhold an award
for a trivially easy encounter or award extra for a particularly challenging one. The existing
Director-confirmed closeout controls record that award; do not award merely to fund a demonstration.

The earlier Malice example leaves the hero at **0 Victories**: for one hero, round one grants
**2 Malice** under [Earning Malice](../vendor/steel-compendium/en/unified/md/rule/monster/malice.md#earning-malice)
(one hero + round number 1), separate from the zero combat-start grant based on Victories. That
arithmetic follows the source; the subsequent [Malice automation decision](#malice-lifecycle) is
recorded separately below.

**Resolved clarification:** the user means persistent Stamina, Recoveries, Heroic Resources, Malice
and Victories, each with its own rules and lifecycle. The Director edits them on sheets, stat blocks
or resource displays; committing the change updates current state and appends an attributed **Manual
adjustment** entry. Roll-local edges/banes and result artifacts are separate. Editable inputs in the
persistent log exist only in case-specific interactive cards. The earlier inline attack-result
editor deferral remains.
Follow [the owning table contract](table-spec.md#persistent-values-and-manual-adjustment-entries).

## Malice lifecycle

**Source:** [Earning Malice](../vendor/steel-compendium/en/unified/md/rule/monster/malice.md#earning-malice),
SCC `mcdm.monsters.v1/rule.monster/malice`, at the pinned revision above.

**Recommendation and user decision:** automate the rules-based combat-start grant, round-start
gains and normal encounter-end loss. The user accepted this for v0.01 on 2026-09-13:
“Yes, let’s keep malice in.”

| Boundary | Source-defined change |
| --- | --- |
| Combat start | Gain Malice equal to the average Victories per hero in the combat. Use actual recorded Victories; do not grant or alter Victories as part of this calculation. |
| Each actual round start, including round one | Add the number of heroes generating Malice in the battle plus that round's number. A dead hero stops generating Malice; zero Stamina alone does not establish hero death. |
| Normal encounter end | Lose unused Malice. Do not synthesize another round or grant to finish combat. Void retains its separate keep/reset contract and skips ordinary ending effects. |

The shared clock/lifecycle operations update the persistent shared Malice pool and log the cause,
source, contributing values and before/after balance once. Combat-start and first-round grants are
distinct causes. Round gains add to the current pool; they do not recompute a nominal total that
would discard earlier spending or a Director's manual adjustment. Retries/reconnect and presentation
changes do not grant Malice. No automatic optional spending is implied.

The Director may edit Malice on its resource display through the existing **Manual adjustment**
operation. Preserve Show Malice (off by default), authorized audiences and the distinction between
automatic grants, ability costs and manual adjustments. Authorized sequential rewind restores the
recorded pool and causal bookkeeping; exact Redo restores recorded changes, including any separately
recorded manual edits along that path. Completed encounter archives remain closed to gameplay undo.

**Acceptance example from actual fixture values:** one hero begins with 0 Victories and a new pool
of 0 Malice. Combat-start gain is 0; round-one gain is 1 + 1 = 2, producing a pool of 2. Retrying that
boundary leaves 2. If the Director then uses the Goblin Warrior's source-costed Bury the Point,
its 2-Malice debit leaves 0 under the required cost operation. With the hero still participating and
alive, round two adds 1 + 2 = 3. A normal encounter end clears the remaining 3. This demonstrates
resource arithmetic without changing the hero's Victories or claiming full ability-effect automation.

**Remaining bounded work:** pin the startup grant's placement within the source-specific opening
sequence; verify fractional average-Victories handling and non-death participation edge cases before
automating those cases. The located [Always Round Down](../vendor/steel-compendium/en/unified/md/rule/general/always-round-down.md)
text explicitly discusses halving, so it alone does not settle an arbitrary average. The one-hero
fixture has no fractional average. Implementation and persisted-state verification remain owed.

## Hero dying

**Sources:** [Dying and Death](../vendor/steel-compendium/en/unified/md/rule/health/dying.md),
SCC `mcdm.heroes.v1/rule.health/dying`, and
[Bleeding](../vendor/steel-compendium/en/unified/md/condition/bleeding.md),
SCC `mcdm.heroes.v1/condition/bleeding`, at the pinned revision above.

**Recommendation:** automate hero dying at zero Stamina, including its bleeding consequences and
the Catch Breath restriction presented under the standing rule-warning policy. Preserve negative
Stamina; zero is not automatic hero death.

**User decision, 2026-09-13:** “Let's skip for V0.01.” Defer that hero-dying automation beyond v0.01.
The table resolves those rules manually using readable source text and existing recorded adjustments.
Retain actual current Stamina, including negative results, and the separately confirmed winded display;
do not clamp values, add a substitute death/defeat outcome at zero or claim dying consequences were
automatically applied. Numeric changes made by the Director append Manual adjustment entries.

Generic effect tracking/save-ends support remains included. Under the later game-basics-first scope,
unique ability-driven bleeding and Ferocity triggers are manually resolved; ordinary-foe defeat is
covered below. Source
death/knockout consequences must not be invented from a Stamina display; this decision establishes
no automatic hero-death workflow.

## Ordinary foes at zero Stamina

**Sources:** [Stamina — Director-Controlled Creatures and Knocking Creatures Out](../vendor/steel-compendium/en/unified/md/rule/health/stamina.md),
SCC `mcdm.heroes.v1/rule.health/stamina`, and the
[Goblin Warrior](../vendor/steel-compendium/en/unified/md/monster/goblin/statblock/goblin-warrior.md),
SCC `mcdm.monsters.v1/monster.goblin.statblock/goblin-warrior`, at the pinned revision above.
Ordinary Director-controlled creatures normally die or are destroyed at zero; the source also permits
knocking a creature unconscious instead with an otherwise lethal ability.

**Recommendation:** automatically mark ordinary foes defeated at zero, retain them in the roster
until normal cleanup, and leave death versus knockout adjudication to the table.

**User decision, 2026-09-13:** “Yes. 0 stamina make the foe show as slain.” Require the automatic
ordinary-foe defeat transition and use **Slain** as its visible status in v0.01. Reaching or crossing
zero triggers it; an overkill result must not miss the transition because its recorded value is negative.
This does not apply the hero-dying rules to foes or change the separate hero-dying deferral.

**User decision, 2026-09-14 (Q-R-200):** Slain is derived from current Stamina. If the Director
raises an ordinary foe's Stamina above zero through Manual adjustment, Slain automatically clears
and the foe can fight again under the existing action-economy rules. Record the adjustment and its
resulting status through the existing history operations.

Preserve the existing roster contract: Slain foes remain present under their existing visibility
setting until normal cleanup or Director removal and stop contributing to undefeated-roster EV.
Do not auto-end combat, grant a Victory, or reveal a hidden foe merely because its Stamina reaches
zero. Void keeps or restores the recorded roster state and skips normal defeated-foe removal.
This status is part of the table roster; the future campaign Slain dashboard remains deferred.

Record the Stamina change and resulting status with their cause. A Director's Stamina edit uses
the existing Manual adjustment operation; authorized sequential rewind/redo restores the recorded
Stamina, status and related roster state together. Preserve source-specific exceptions and manual
death/knockout adjudication; no automatic knockout-choice workflow is added by this status decision.

**Acceptance example:** the Goblin Warrior starts at its printed 15 Stamina. A supported resolved
15-damage result leaves 0 and displays Slain, retaining the visible roster entry until cleanup. An
authorized rewind of that action restores its recorded 15 Stamina and prior status; exact Redo
restores 0/Slain. Manual test setup remains explicitly recorded rather than altering source values.
