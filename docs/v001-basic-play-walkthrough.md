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
| 7. Advance play | Explicit End turn, ordinary group/side handoff and actual next-round start | Run due common clock work once, including applicable saves for recorded effects and the confirmed Malice lifecycle. Use the effect's supplied/source-backed save inputs; do not silently ignore a known exception. Unique feature grants/expiry remain manual. |
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
The existing Director numeric adjustments, deferred attack-result editors and target-completion
rules remain settled. The next-attack control behavior is confirmed below; placement remains
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
