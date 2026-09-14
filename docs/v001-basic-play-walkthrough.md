# v0.01 basic-play acceptance walkthrough

Status: **draft acceptance artifact, 2026-09-14**. This develops the
[game-basics-first scope](pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope).
It combines settled behavior into a connected scenario and labels remaining decisions. It is not
an implementation report or evidence that the scenario has been run.

## Starting state

- A campaign has a running session, its Director and a selected player controlling an admitted
  level-one devil Fury. The minimal wizard, derived baseline and live-state initialization remain
  G1–G3 dependencies; an engine fixture does not prove those app workflows.
- Use the [sourced fixture baseline](hero-fixture.md): hero maximum/current Stamina 30, ten
  Recoveries, zero Victories and initial zero Ferocity. Add one independent Goblin Warrior with
  its printed 15 Stamina. Use actual persisted state; no artificial grants or hidden prefills.
- All loaded foes are visible in the player/observer roster from the outset. Foe hide/reveal and
  Add visibility controls are deferred beyond v0.01; no reveal step precedes targeting. Full monster
  stat blocks remain Director-only, with the selected health display policy applied.
- Class/stat-block-specific features are readable and manually resolved. Common operations use
  known sourced inputs and identify missing interpretation honestly.

## Main path and observable results

| Step | Shared operation / table interaction | Expected record and state |
| --- | --- | --- |
| 1. Prepare combat | Director opens the staged setup card, selects participants/surprise/groups, then confirms OK | Draft choices become a committed encounter once; starting snapshot and combat locks precede initiative. Cancel before OK is distinct from Void after it. All participating foes and their initiative groups are visible in the shared setup/turn view. |
| 2. Start the first turn | Resolve initiative and starting-side choice through the settled flow; an eligible actor takes their turn | One accepted roll/choice and active individual turn, with action tracking and actual user attribution. Explicit Take turn switches only the invoking user's pane. No automatic Fury-specific resource grant. |
| 3. Invoke a common action | Representative proposal: the hero uses the common Melee Weapon Free Strike against the visible foe, supplying its characteristic choice | Register the action, source, actor and target through the same UI/palette/slash/headless path. Preserve the settled target/fire flow; do not insert a universal extra preparation confirmation. Common roll-input controls still need their concrete contract. |
| 4. Resolve and record | Generate the accepted shared roll; evaluate known common inputs, or record manual results for unsupported interpretation | Log actual dice/modifiers/tier when known and complete verbatim action text. Apply only effects actually supported or explicitly recorded; do not execute unique feature clauses by assumption. |
| 5. Inspect live values | Read both sheets/stat blocks and the log through the application | Accepted damage changes the same persistent Stamina seen by every authorized client. Winded reflects the current value. A Director edit on the sheet/stat block/resource display adds a distinct Manual adjustment entry, never rewriting the action. |
| 6. Exercise known costs | In a separate branch, invoke an action with a sourced, known fixed cost using the real current pool | Charge once on accepted execution; unaffordable invocation produces no roll/effects/cost debit. This verifies common payment, not full interpretation of the action. Explicit manual resource edits remain recorded if the table makes them. |
| 7. Advance play | Explicit End turn, ordinary group/side handoff and actual next-round start | Run due supported common clock work once, including the confirmed Malice lifecycle. Saves for simple condition toggles are rolled manually through ordinary dice controls, then the condition is manually switched off when appropriate. Use the effect's supplied/source-backed save inputs; do not silently ignore a known exception. Unique feature grants/expiry remain manual. |
| 8. Inspect history | Exercise legal player undo, Director sequential rewind and exact Redo in separate branches before terminal closeout | Restore recorded state and causal bookkeeping together; no reroll during Redo. Another actor's accepted action or Director adjustment creates the established player seam. Paused/archived boundaries remain enforced. |
| 9. Finish | Reduce the ordinary foe to zero through accepted play, then use normal closeout; separately exercise Void keep/reset, including while paused | Foe shows Slain without automatic combat end or Victory award. Director-confirmed source-earned awards and cleanup precede archive. Void preserves its keep/reset semantics and skips normal rewards/cleanup. |

Expected numerical outcomes come from the actual accepted inputs and sourced formulas. A deterministic
development case may supply disclosed dice inputs for verification, but that is not live random play,
an artificial resource grant or a claim that missing feature effects were automated.

For each committed step, inspect authoritative state and the ordered log, then verify a retry and
reload preserve that result without duplicate dice, costs or effects. Use a player, Director and
observer to check the existing access/audience boundaries. This document records checks still to run.

## Source references for the representative common action

Pinned Steel Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`:

- [Taking a Turn](../vendor/steel-compendium/en/unified/md/rule/combat/turn.md): ordinary action allowance,
  ordering and main-action substitution. Existing app policy makes ordinary rule warnings advisory.
- [Free Strike main action](../vendor/steel-compendium/en/unified/md/feature/common/main-actions/free-strike.md)
  and [Melee Weapon Free Strike](../vendor/steel-compendium/en/unified/md/feature/ability/common/melee-weapon-free-strike.md):
  a common main action with a Might/Agility roll and sourced damage tiers. Its name does not make
  this voluntary main-action use free of action spending.
- [Ability Roll](../vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md),
  [Power Rolls](../vendor/steel-compendium/en/unified/md/rule/dice/power-roll.md) and
  [Power Roll Outcomes](../vendor/steel-compendium/en/unified/md/rule/dice/tier-outcome.md): common
  dice/tier context. Detailed modifier, critical and damage/application cases need bounded verification.

The action is a proposed representative for the shared operation; this document does not certify
full free-strike support, stat-block exceptions or all common actions.

*Implementation note, 2026-09-14 (R04):* the bounded verification of modifier, critical and
damage/application cases for this action is [the R04 contract](roll-and-damage-resolution.md); its section 10 works the
Melee Weapon Free Strike at each tier, a critical, a post-roll bane correction and the damage order
with the fixture numbers. Open source questions are [Q-R-1](rules-questions-for-user.md#q-r-1-does-a-natural-19-or-20-stay-tier-3-under-a-double-bane) to [Q-R-3](rules-questions-for-user.md#q-r-3-is-regained-stamina-capped-at-the-stamina-maximum).

## Foe visibility — confirmed for v0.01

**Foe hiding deferred, 2026-09-14:** all loaded foes are visible in player/observer rosters;
combat participants and their initiative groups/turns have no hidden-foe presentation. Omit
hide/reveal controls and the Add visibility setting from v0.01. Full monster stat blocks remain
Director-only; health display and Malice visibility retain their separate policies. This defers
roster visibility controls, not the source rules for stealth or concealment. Fuller V1 hide/reveal
design remains future work. Audit F2 is closed for this milestone by scope deferral.

The earlier explicit-reveal recommendation was not accepted; hiding itself is deferred. Neither
attack-triggered reveal nor hidden initiative presentation blocks this walkthrough.

## Remaining common-operation contracts

Continue with gaps exposed by this common flow: roll-input/commit controls, known-cost input
boundaries, applying versus manually recording results and their history units. Do not restart
the deferred class/stat-block feature questionnaire. The walkthrough remains unrun and uncertified.

### First review case: supplying edges and banes

**Confirmed by the user, 2026-09-14:** for the first ordinary attack, the acting player or
Director supplies its applicable edge and bane counts before the roll resolves. The shared roll
operation calculates their rules-defined effect and records the supplied inputs and result.
Automatically discovering every situational/class/stat-block reason for those counts is not a
v0.01 requirement. This confirms the input/automation boundary; the source arithmetic is unchanged.

These are roll-local inputs, not persistent resource fields or edits to a completed log entry.
The existing Director numeric adjustments and target-completion rules remain settled. Broader
attack-result editors remain deferred, except for the later per-target post-roll edge/bane additions. The next-attack control behavior is confirmed below; placement remains
flexible for playtesting. No universal extra confirmation is selected.

Source context: [Edge](../vendor/steel-compendium/en/unified/md/rule/dice/edge.md),
[Bane](../vendor/steel-compendium/en/unified/md/rule/dice/bane.md) and
[Bonuses and Penalties](../vendor/steel-compendium/en/unified/md/rule/dice/bonuses-and-penalties.md)
at the pinned revision above. The complete mixed-edge/bane and tier-boundary arithmetic still
needs bounded verification before implementation.

### Next review case: pre-roll controls

**Confirmed mechanics, 2026-09-14; placement flexible:** provide next-attack inputs,
bound to the invoking user, acting character and individual target. Edge and bane counts start at zero and can be
set before completing the ability/target selection. The accepted attack consumes those inputs,
records them with its result and clears the draft counts for the next attack. This preserves the
settled target-completion fire behavior without an extra confirmation on every attack.

The counts are a draft for one attack, not a persistent character buff or freely editable history.
The user expects to experiment with placement: the proposed compact game-log card is not a fixed
layout requirement. Wherever placed, preserve the confirmed mechanics and existing log-card policy.
Per-target modifier support and target-only input composition are confirmed below. Other
required-input cases still need concrete contracts where the common walkthrough needs them.

### Next review case: characteristic choice

**Confirmed, 2026-09-14:** when the common attack's source permits a choice of
roll characteristic, automatically select the highest permitted current value and allow the acting user to
choose another permitted characteristic before firing. Show and record the selected characteristic
and actual value. This is the confirmed UI default, not a rule requiring the higher choice, and does
not extend the permitted set or infer separate damage choices. The representative Melee Weapon
Free Strike permits Might or Agility; see its source and the Ability Roll reference above.

### Next review case: target-specific modifiers

**Confirmed, 2026-09-14:** include target-specific edge/bane inputs in v0.01's
multi-target attack flow. If an attack has an edge against one foe but not another, the supplied
counts must be able to differ by target and be recorded with the respective outcomes. The table
still supplies applicability; this does not require automated detection of the reason.

The user accepts per-target variation in the milestone. Record each target's supplied counts and
resolved outcome; these inputs retain the confirmed one-attack lifetime. Placement remains flexible.
Full-count auto-fire remains unchanged. The later clarification below makes all modifier inputs
target-only, with no attack-wide layer. Source-defined shared dice mechanics require verification,
not a new product ruling.

### Next review case: attack-wide and target-specific counts

**Resolved, 2026-09-14 — target-only inputs.** The user rejects the proposed attack-wide counts
plus target-specific additions. Enter each target's complete edge and bane counts directly.
There is no attack-wide count, inherited value or stacking layer between input scopes.

For example, enter two edges for Goblin A and one edge for Goblin B directly. If a circumstance
affects both, account for it in each target's supplied counts. This same model applies to a
single-target attack. The app applies the source arithmetic separately to each target's counts
and records the corresponding inputs and outcome. Counts start at zero and reset after the
accepted attack; placement remains flexible. Existing target-completion firing is unchanged.

This rejects input stacking across attack/target scopes; it does not change the source rules for
multiple edges/banes applying to one target. Continue the walkthrough with these inputs settled.

### Next review case: critical-hit action tracking

**Confirmed, 2026-09-14:** include automatic critical-hit recognition and the
resulting immediate additional-main-action opportunity for the representative common main-action
attack. This is shared action-economy behavior, not unique class/stat-block execution. The user
has already included supported damage application and Stamina updates; do not ask for those again.

Pinned source: [Natural Roll](../vendor/steel-compendium/en/unified/md/rule/dice/natural-roll.md)
requires a tier 3 outcome for a natural 19 or 20 regardless of modifiers. The
[Critical Hit rule](../vendor/steel-compendium/en/unified/md/rule/combat/critical-hit.md) grants an
immediate additional main action after resolving the qualifying ability roll. This example is
the hero's ordinary Melee Weapon Free Strike used as a main action. A modified total of 19 or 20
alone does not establish a critical hit.

Require recognizing/logging the critical, finishing the current action's resolution and exposing
that immediate extra-main-action opportunity in shared action tracking. The user chooses whether
and how to use it; do not execute an action automatically or store it as a generic banked action.
History must restore the recorded opportunity without rerolling or duplicating it. Exact lifetime,
chaining and off-turn/source-exception cases still require bounded source/contract work; the
common critical-hit inclusion is settled. This does not turn deferred class/stat-block triggers
into automatic behavior. No implementation or verification is claimed by this scope decision.

### Next review case: multi-target firing and modifier entry

**Resolved, 2026-09-14 — keep existing firing and allow post-roll additions.** The user rejects
changing multi-target attacks to an explicit Roll step. Keep full-count auto-fire and the existing
early-fire control. Include per-target Add edge/Add bane controls after the attack has fired;
pre-roll inputs remain available. This is a narrow exception to the prior v0.01 modifier-editor
deferral, not inclusion of direct damage editing or every attack-result editor.

Use the existing interactive correction-card contract: keep the dice, update the affected target's
inputs and outcome, reconcile supported applied effects and append a linked attributed correction.
Do not deal full corrected damage again, overwrite the original log, alter the next-attack draft,
or automate deferred unique clauses. Later gameplay still requires sequential rewind before an
older attack can be corrected. Existing Director authority and session/history boundaries apply.

### Next review case: post-roll addition authority

**Confirmed, 2026-09-14:** the acting player may add edges/banes to their own eligible attack
result, alongside existing Director authority. The user specifies the same window as undo, until
the next actor starts their turn. Preserve earlier undo seams: another character's committed action
or a Director correction can close the player window sooner. Intervening gameplay must still be
undone sequentially before an older attack is corrected. End turn alone is not the next actor's
turn start, but it does not remove that sequential history requirement. Check eligibility when
the shared operation commits so stale cards cannot bypass the boundary.
For example, a player who notices an omitted edge immediately after their attack could add it
without asking the Director to operate the card. This does not authorize changing another
character's attack, editing other result fields or bypassing sequential rewind.

### Next review case: removing a modifier

**Confirmed, 2026-09-14:** allow reducing a target's edge or bane count through
the same post-roll card, under the same acting-player/Director authority and history limits as
additions. This lets the table remove an incorrectly applied modifier, including one supplied
before the roll, without undoing and rerolling the whole attack. Keep the accepted dice, re-evaluate
supported outcomes and append a correction. Counts cannot be negative. The narrow post-roll
modifier exception now includes removal as well as addition; direct damage editing stays deferred.

## Condition tracking — current v0.01 scope

**Confirmed simplification, 2026-09-14:** show one on/off toggle per core condition. Players may
change their own controlled heroes; the Director may change all heroes/foes. Persist the state
and append an attributed log entry for each change. Keep normal session/control/history rules.

No manual source field, duration menu, expandable source/application list or source-removal
workflow is required in v0.01. Clear all remains deferred. Ability-driven condition application
and expiry can follow parser support; the manual toggle supplies no timer or save rule. This
supersedes the earlier condition-input design below, not the shared clock as a whole. Do not
infer expiry at turn/encounter end or automatic condition consequences from these toggles.

## Earlier condition review — historical, superseded for v0.01

The following records explain the earlier design and source research. They are not current
v0.01 UI requirements. The latest simple-toggle decision above controls delivery; the player/
Director authority and persistent logging remain accepted.

### Next review case: manual condition tracking

**Confirmed, 2026-09-14:** provide Director controls to manually apply and remove
core conditions on a hero or foe, with attributed persistent log entries. For each application,
record the condition and its source/duration information as needed. Feed known supported duration
or save-ends data into the already-included shared clock; unsupported timing remains explicit
manual resolution. Do not invent an expiry or save schedule from the condition name alone.

This supplies the condition records needed during play while class/stat-block-specific effects
are manually resolved. It does not require automatic interpretation of every ability that applies
a condition or automatic execution of every condition consequence. Player authority is confirmed
below; exact supported duration choices and multi-source condition lifetimes still need contracts.

### Next review case: player condition controls

**Confirmed, 2026-09-14:** allow a player to manually apply/remove conditions
on their own controlled hero, with the same attributed current-state records and supported timing
as Director condition edits. The Director retains access to all heroes and foes. This lets
a player record a condition the table resolved without requiring the Director to operate their
sheet. It does not grant player access to other participants' conditions or foe stat blocks.
These are new live-state changes, not edits to an earlier attack; existing session/history rules
still apply. The player permission is limited to their own controlled hero; Director authority
continues to cover all heroes and foes.

### Next review case: condition sources and display

**Confirmed, 2026-09-14:** show one indicator per condition on a creature, with
expandable details retaining each recorded source/application and its duration. For example,
Weakened appears once while its details can show two different abilities that imposed it. This
keeps separate source information available for timing and removal without presenting duplicate
condition penalties. The exact placement remains flexible for playtesting.

Source context at pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`:
[Stacking Unique Effects](../vendor/steel-compendium/en/unified/md/chapter/classes.md#stacking-unique-effects)
states that identical conditions do not double their penalties. It also has distinct rules for
repeated uses of the same ability and a restriction on being grabbed again. The confirmed display
is not a ruling that every duplicate application is valid or independently expires/saves. Preserve
source records without inventing those merge, replacement or save semantics. Exact overlapping
lifetime rules remain bounded source/contract work before automation.

### Next review case: condition removal scope

**Confirmed, 2026-09-14:** manual removal from a condition's source details removes only the
selected application, one at a time. Clear all is deferred unless play demonstrates a need for it.
Keep the condition indicator while another effective application remains. Use the confirmed
player-own-hero/Director-all authority, append an attributed record and retire only the selected
application's scheduled work. Preserve historical source records.

This is manual removal scope, not automatic interpretation of an ability that ends a condition.
Source-defined removal, replacement and save semantics still need their own contracts. Removing
one source must not silently remove every other source as well.

### Next review case: condition duration choices

**Confirmed, 2026-09-14:** start manual condition entry with four duration modes:
Save ends, EoT, End of encounter, and Manual. Users supply the duration from the actual effect;
do not default a condition name to a presumed duration. Manual retains the stated timing for
table handling and invents no expiry. Other timing clauses remain manual for this initial input
set rather than being silently translated into one of these choices.

Source context, pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`:
- [Saving Throw](../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md) supplies the
  ordinary save-ends schedule and check; known exceptions need their actual inputs/manual handling.
- [EoT](../vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md) expires at the end of
  the affected creature's next turn, or its current turn if imposed during that turn. Do not
  always add an extra turn or substitute the source creature's turn.
- [End of Encounter](../vendor/steel-compendium/en/unified/md/chapter/classes.md#end-of-encounter)
  supplies encounter duration; its five-minute out-of-combat rule remains manually tracked under
  the existing fictional-time deferral. Normal closeout and Void retain their distinct contracts.

This initial input menu is confirmed. The common clock and automatic saves are already included;
this decision neither reopens their scope nor certifies overlapping-source lifetime behavior.

### Next review case: manual condition source entry

**Status, 2026-09-14:** this proposal received no separate answer; it was overtaken by the
simple-toggle decision above, which requires no source field in v0.01. It is not a pending question.

**Proposal, not yet accepted, 2026-09-14:** retain the originating action/source automatically
when it is already known in the operation context. For a condition added directly from a sheet
without that context, offer an optional plain-text source label rather than requiring the user
to find an ability in a catalog. Blank source text does not prevent recording the condition:
identify the entry as a manual application and retain the applying user and event/time context.

This preserves distinct application records even when their source labels are blank or identical.
A typed label is descriptive, not evidence that the engine understands the ability or a reliable
key for merging repeated effects. Existing condition, duration, target and authority requirements
still apply. The proposal changes source-entry burden, not condition application permissions.

## Next review case: save-ends with simple toggles

**Confirmed, 2026-09-14:** for manually toggled conditions in v0.01, let the
table make the needed save through the ordinary dice controls and toggle the condition off when
appropriate. Defer automatic save-ends scheduling/removal for those toggles until an applying
ability supplies the necessary timing. This narrows the earlier automatic-save acceptance
for manually tracked conditions; it does not remove turn/round clock work or other supported
scheduled operations. The condition toggle itself cannot identify which effects allow a save.

The user accepts the manual-save proposal after checking that the standard save is 1d10,
succeeding on 6 or higher. Use actual dice and source-specific exceptions where relevant. Log the
roll through the ordinary dice operation; switching the condition off is a separate logged state
change. Do not infer which toggles end from the roll alone. Ability-derived and manual-condition
save paths must be distinguished honestly in the eventual acceptance test.

## Next review case: Catch Breath

**Confirmed, 2026-09-14:** include the ordinary hero Catch Breath maneuver as a
shared basic operation: spend one actual Recovery, restore Stamina using the hero's actual
recovery value and record the maneuver and both state changes. Preserve affordability, retries,
action tracking and history rather than requiring separate manual Recovery/Stamina edits.

Source: [Catch Breath](../vendor/steel-compendium/en/unified/md/feature/common/maneuvers/catch-breath.md)
and [Recoveries](../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md), pinned revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. This example concerns an ordinary injured hero who can
use the maneuver; source eligibility, healing limits and exceptions need bounded verification.
Keep the earlier hero-dying automation/warning deferral and manual adjudication; do not silently
reinstate dying automation or certify all special recovery/healing features. This confirms the
common maneuver, not class-specific healing or respite scope. No implementation is claimed.

## Next review case: Recoveries outside combat

**Confirmed, 2026-09-14:** allow heroes to spend a Recovery outside combat
through the same basic healing control, one Recovery per use. Spend the actual Recovery and
restore Stamina using actual recovery value, with linked records; no combat maneuver allowance
is consumed. Allow repeat uses when the hero has Recoveries remaining, under source eligibility
and existing running-session/control permissions.

Source: [Recoveries](../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md) explicitly
allows spending remaining Recoveries outside combat. Expose that common
operation in v0.01 FreePlay, not to introduce respite, replenish Recoveries, change healing
formulas or invent special eligibility. The Director retains existing acting authority.

## Next review case: temporary Stamina

**Confirmed, 2026-09-14:** include a separate Director-editable temporary Stamina
value with the existing attributed Manual adjustment entries. Supported damage consumes temporary
Stamina first and then ordinary Stamina; ordinary healing, including Catch Breath, does not refill
the temporary pool. Keep it separate from maximum Stamina, recovery value and winded calculations.
Record the state changes with their cause and restore them coherently through undo/redo.

Source: [Temporary Stamina](../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md),
pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`. For example, 10 temporary Stamina absorbs
10 of 16 incoming damage, leaving 6 applied to ordinary Stamina. Unique ability grants remain
manually resolved; this does not require the parser to understand those abilities.

The source also specifies that a new temporary-Stamina grant uses the greater of the existing
amount and the new grant, and that the pool normally ends with the encounter unless specified
otherwise. A Director directly setting the live value is a manual adjustment, not a new grant.
Detailed grant/closeout integration must preserve those distinctions and known exceptions; do not
silently treat this confirmed input/damage scope as automation of every granting feature.

## Next review case: Defend and Aid Attack

**Confirmed, 2026-09-14:** expose Defend and Aid Attack as usable common actions
in v0.01. Record their use, actor and applicable target, track the source action allowance and log
the full source text. Resolve their benefits manually using the settled per-target edge/bane
controls and ordinary roll inputs; do not automatically discover beneficiaries or consume/expire
their modifiers. This does not change already-included common attack, Catch Breath or clock behavior.

Source: [Defend](../vendor/steel-compendium/en/unified/md/feature/common/main-actions/defend.md)
is a main action; [Aid Attack](../vendor/steel-compendium/en/unified/md/feature/common/maneuvers/aid-attack.md)
is a maneuver, at pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`. Preserve their full
conditions, timing, permitted targets and source exceptions in readable text and manual resolution.
No additional condition type, hidden timer or modifier stacking layer is introduced by recording
these actions. Existing allowance warnings, controls, logs and history still apply.

## Next review case: surge tracking

**Confirmed, 2026-09-14:** provide a basic persisted surge counter on the hero
sheet, editable by the Director under the existing numeric Manual adjustment contract. The table
records actual gains/spending and resolves their damage/potency effects manually. Do not add a
surge-spending card or automate granting features for this initial scope. Keep attributed history,
actual before/after values and the ordinary control/session boundaries.

Source: [Surges](../vendor/steel-compendium/en/unified/md/rule/resource/surge.md), pinned revision
`fb83a789da8f0327a389c277a0c790b1648d5810`, explicitly tracks surges on the character sheet and
specifies their damage/potency spending and loss of remaining surges at combat end. Those rules
remain the table's basis for actual adjustments; this confirmed counter scope neither changes them nor
certifies automatic spending/closeout or unique feature interpretation. Manual Stamina adjustments
remain the existing route for resolving unsupported extra damage.

## Next review case: hero-token pool

**Deferred beyond v0.01, 2026-09-14:** the user declines the proposed shared hero-token counter.
Do not require a pool display, manual counter controls, automatic grants or spending interfaces
for the prototype. The failed-save token follow-up remains deferred. The source reference below
is future design material, not a v0.01 gate. Other accepted resource counters remain included.

Source: [Hero Tokens](../vendor/steel-compendium/en/unified/md/rule/resource/hero-token.md), pinned
revision `fb83a789da8f0327a389c277a0c790b1648d5810`, establishes a shared pool, session-start tokens
based on hero count, Director awards, spending benefits and usage limits. Actual manual adjustments
must follow those rules or be clearly recorded Director adjudication; no test-only grants or hidden
prefills when this feature enters scope. This reference does not authorize hero-token delivery
in v0.01 or certify automatic lifecycle/spending.

## Next review case: main-action substitution

**Deferred beyond v0.01, 2026-09-14:** do not automatically select/spend the ordinary main-action
allowance for a second maneuver or add a substitution workflow. The user explicitly relies on
the existing nonblocking design: a player can use another maneuver without extra controls.
Record the actual use and retain advisory allowance tracking; do not turn a spent maneuver into
an execution block. Existing resource affordability still applies to any real resource cost.
This defers substitution bookkeeping, not the rule allowing the substitution or the already-
included critical-hit opportunity.

Source: [Taking a Turn](../vendor/steel-compendium/en/unified/md/rule/combat/turn.md), pinned revision
`fb83a789da8f0327a389c277a0c790b1648d5810`, permits using a main action for a maneuver or move action.
The rule permission remains valid. Automatic slot selection and its dedicated UI are deferred
for the prototype; do not describe every second maneuver as inherently illegal. No external-map
movement tracking or class/monster-specific work is introduced.

## Next review case: combat-end resource cleanup

**Confirmed, 2026-09-14:** at normal combat end, automatically clear remaining
surges and temporary Stamina as part of the established closeout flow, recording the changes once.
This adds common cleanup to the accepted counters without automating any class/monster-specific
grant or spending feature. Specific source exceptions remain manually adjudicated; known exceptions
must not be silently presented as automatically resolved. Exact exception handling remains a bounded
integration contract. Keep Void's existing keep/reset semantics rather than running normal cleanup.

Source: [Surges](../vendor/steel-compendium/en/unified/md/rule/resource/surge.md) end with combat;
[Temporary Stamina](../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md) normally
ends with an encounter unless otherwise indicated, at pinned revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. This is an automation-scope question about those
common endings, not a proposal to erase ordinary Stamina, conditions or other retained resources.

## Next audit case: prototype engine language

**Standing choice confirmed, 2026-09-14:** readiness-audit
[G6](v0.01-readiness-audit.md#g6-engine-placement-and-content-delivery-for-v001) uses TypeScript
for v0.01 and beyond unless a concrete reason to change emerges. This strengthens the earlier
prototype-only acceptance and removes the expectation of a routine later language comparison.
Preserve shared UI/headless behavior and the existing portable engine boundary.

The [engine architecture](engine-architecture.md#standalone-engine-and-portability) now records
that standing choice. Content packaging, execution placement and integration still need engineering
work. This does not approve every G6 technical suggestion, claim the walkthrough is implemented
or authorize class/monster-specific feature work or deployment.

## Review checkpoint: shared v0.01 scope

**Scope review complete, 2026-09-14:** the user is satisfied with the current shared-basics scope
and authorizes the building agent to ask concrete questions as they arise during build work.
The accepted mechanics and deferrals are consolidated in the
[G4 scope table](pre-alpha-design-gaps.md#v001-combat-acceptance-checklist). No further broad
feature questionnaire is needed; keep class/monster-specific runtime work deferred.

This is not an assertion that G5 is implemented or G1–G3/G6–G7 are complete. Remaining sourced
formulas, hero baseline/data contracts, packaging, persistence and integrated acceptance checks
still require work. The walkthrough remains unrun and uncertified. Use the
[build handoff](web-app-build-handoff.md#v001-scope-review-complete--build-handoff) to resolve those
items, asking the user only when a material product choice or source ambiguity requires it.
