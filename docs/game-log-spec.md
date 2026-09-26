# Game log: messages and action-card manifests

## Status and scope

Design baseline from the user discussion, 2026-09-26. This specifies intended behavior;
it is not a claim that the current application implements these manifests. Field names and
state names below are proposed design vocabulary, not a frozen storage schema.

This is part of the [table game log contract](table-spec.md#game-log-and-chat-scope).
That contract continues to own durable history, shared operations, permissions, corrections,
undo/redo and session boundaries. The present document owns the separation of message routing,
presentation, classification and action-card lifetime. Existing source-specific timing and
ordered-resolution rules remain authoritative.

The initial ability mapping and validation scope requested for this design is **all eleven
classes at levels 1–3 and the selected V1 foe roster**, with the supporting features, granted
actors and shared rules those abilities require. The earlier
[action-card lifecycle research](research/action-card-lifecycle-audit.md) covered levels 1–10
and wider supporting content; higher-level examples do not expand this implementation scope.
This does not rewrite the character wizard's broader level support.

## Goals and boundaries

- Use one shared message model for both informational results and interactive opportunities.
- Use shared lifecycle primitives and presentation presets instead of bespoke behavior per ability.
- Keep optional opportunities visible with as few interruptions to play as possible.
- Automate supported deterministic behavior and record what happened. Automatic effects need
  a log entry, not a decision card. Eligible revert or modification controls may accompany it.
- Present a card when there is an actual choice or missing input. Mixed abilities automate the
  supported portions and ask only for outstanding decisions or facts.
- Keep effect duration, stacking, damage and condition resolution in their owning systems.
  An action-card lifetime can depend on those states without becoming an effect tracker.

## Components of a message

| Component | Responsibility | Applies to |
| --- | --- | --- |
| Content and provenance | What happened or is offered; originating operation, actor, source and linked records | Every message |
| Routing | Which authorized audiences receive it | Every message |
| Presentation | How each route displays content and eligible controls | Every message |
| Attention | Routine information or something that deserves attention now | Every message |
| Interaction | Whether there is no decision, an optional decision or required input | Every message |
| Event kind and outcome | Semantic meaning used for visual markers and readable labels | Applicable messages |
| Lifetime manifest | When an actionable opportunity opens, closes, returns or retires | Action cards |

A message may group multiple related results and opportunities while preserving their distinct
identities and ordered history. Three audience views of an opportunity refer to **one opportunity**;
they are not independently consumable copies.

### Attention and interaction

These are separate dimensions; a single mutually exclusive message-type enum is insufficient.

| Dimension | Proposed values | Contract |
| --- | --- | --- |
| Attention | Informational, Alert | Informational is the default. Alert calls attention to something worth noticing now. |
| Interaction | None, Optional, Required | None is the default. Optional offers a choice without requiring a response. Required identifies outstanding input needed for resolution. |

An optional triggered action is Alert / Optional. Automatically applied damage is normally
Informational / None. An automatic transition into dying can be Alert / None. A required
resolution choice is Alert / Required. These examples establish useful presets, not an exhaustive
severity taxonomy.

**Blocking is an execution constraint.** Required input must identify the dependent operation or
phase it prevents from progressing. It must not imply a global table pause. The shared operation
layer enforces that dependency. Optional cards never become blocking merely because they are alerts.
Required work cannot disappear through optional-response expiry.

Correction, undo and reference controls do not turn an informational result into an outstanding
gameplay decision. Their availability follows existing authority and history rules.

### Event kind and outcome

Messages carry semantic event data; presentations choose the corresponding visual treatment.
Initial vocabulary includes:

| Event kind | Detail or outcome examples |
| --- | --- |
| Damage | Amount, target, damage type where known |
| Healing | Amount actually restored, recipient |
| Test or roll | Recorded result; success, failure or critical outcome only where the operation's rules define it |
| Condition change | Condition applied or removed |
| Dying state change | Entered dying state or recovered |
| Resource change | Resource gained or spent |
| Action opportunity | Available, taken, passed or closed |
| Adjudication or correction | What changed and who changed it |

One action can deal damage, apply a condition and cause a dying-state transition. It can have
multiple markers in a grouped result; do not force it into a single lossy category or manufacture
three prompts. Display actual supported outcomes, not an inferred success/failure for every roll.

Use icons with readable text or accessible labels. Color reinforces meaning and is never the
only distinction. Exact glyphs, colors, animation and the full event vocabulary remain design
choices. The party's **!** is presently an optional-opportunity indicator; it is not automatically
a damage, failure or danger marker.

## Routing

Routes describe audience relationships such as the acting character's controller, the Director,
other party members, or the named responder of a request. Resolve them against authenticated
campaign/table membership and control, not a client-supplied role or the currently viewed sheet.
A user controlling multiple characters must see which character each opportunity belongs to.

Routing never expands disclosure permissions. Existing private-roll, hidden-information and
source-access rules govern payloads as well as rendered text. A compact audience view must not
receive private details merely because its renderer hides them. Existing campaign history access
continues to apply; this design does not create private direct messaging.

Audience membership can overlap. Proposed default: compose one view per viewer, with their
normal acting controls and any separately labeled adjudication controls they are authorized to
use. Do not duplicate the same opportunity or show the acting player their own party-only marker.
A Director acting for a monster receives ordinary acting controls for that monster.

## Presentation

Messages select shared presentation presets per route. Presets determine visible context,
reference access, compact or full layout and controls; ability content supplies names, actors,
source references and operation arguments. Presentation performs no rules resolution.

### Triggered-action views

The following three views are the confirmed baseline for a player's triggered action:

| Route | Presentation | Controls |
| --- | --- | --- |
| Acting character's player | Interactive card with ability name and a reference link to the full ability; clearly identifies the character | Take action; optional pass where supported |
| Director | Same context, explicitly framed as that player's character's opportunity | A visually distinct **Adjudicate for [character]** action |
| Other players | Compact character name and **!** indicator showing an optional opportunity exists | Awareness only |

Use the [shared reference card](reference-library-spec.md#app-wide-rule-cards) for the full ability;
raw source paths and Markdown are metadata, not reader-facing prose.
The Director's adjudication control must be visibly distinguishable from their own normal actions
by wording and treatment, not color alone. Record the actual invoking Director separately from
the character whose action they took.

The party indicator supports table etiquette: “Joe has an opportunity; shall we give him a moment?”
It adds no mandatory acknowledgment, countdown, turn reservation or extension of the window.
When taken, passed or closed, all live views stop presenting it as available. Historical entries
remain inspectable with their disposition; the exact compact historical layout remains open.

### Other initial presets

- **Automatic result:** readable summary and event markers; authorized reference, correction and
  undo controls where applicable. No take/pass prompt.
- **Required input:** focused controls for the missing choice, named responder and explanation
  of the dependent resolution waiting for it. Other viewers receive authorized status context.
- **Recurring opportunity:** present the current opportunity and relevant remaining uses or next
  boundary. Keep the longer-lived grant distinct from this one opening.
- **Continuation:** show remaining work within an accepted action, rather than pretending each
  step is an unrelated fresh trigger.

Preset selection must not require custom routing or lifecycle code for each ability.

## Action-card lifetime manifest

Every actionable card must have a defined availability contract. A persistent grant may have
many opportunity windows. Closing one window does not necessarily retire the grant, and retiring
an actionable instance does not remove its historical message or the reusable ability.

### Information the manifest must express

The proposed minimum semantic inventory is:

| Part | Required meaning |
| --- | --- |
| Identity and binding | Capability or grant, originating event/action, acting character, responder and registered operation |
| Lifetime | Creation and terminal conditions for this instance; references to granting effects or relationships |
| Openings | Events, phases or predicates that create opportunities, including recurring boundaries |
| Eligibility | Required facts and which are captured at the trigger versus rechecked on acceptance |
| Budgets | Uses, charges, expenditure or allowances, including their owner, sharing scope and reset boundary |
| Window closure | Acceptance, pass, event cutoff, phase end, cancellation or loss of validity |
| Continuation | Accepted work and explicit ordered steps that still need completion |
| Retirement | When no future opportunity is possible for this instance |
| Explanation | A readable reason for unavailable, closed or retired state |

These are conceptual responsibilities, not a requirement for one database table or separate
visual card per row. The design must support more than one budget and more than one opening
inside a lifetime. Source-dependent facts remain explicit when unknown; never invent an expiry.

### Lifecycle distinctions

- **Waiting:** the instance exists and another opening is possible, but none is currently open.
- **Open:** an opportunity can be considered, subject to current eligibility and authorization.
- **Resolving:** accepted work or its required continuations are in progress.
- **Closed opportunity:** this occurrence was used, passed or expired; another occurrence may follow.
- **Retired instance:** no future opening remains for this particular grant or sequence.

Temporary unaffordability, an absent target or a per-turn cap can disable current use while
preserving future opportunities. Exhausting a replenishable allowance is not automatically terminal.
Conversely, spending the last nonrenewable use may retire the grant. Declining an opportunity
consumes only what its source says it consumes; an occurrence limit and a use limit are different.

### Clock and optional-response cutoff

Use recorded game events and phases, not elapsed wall-clock time. Preserve the
[confirmed triggered-response convention](table-spec.md#inline-interaction-cards-in-the-game-log):

1. Apply the original action immediately as though the optional response were declined.
2. Offer the eligible response. Acceptance revises the linked outcome through the shared operation.
3. Any next **unrelated committed action**, even in the same turn and by another actor, closes
   an unused triggered-response opportunity. Preparation and refused submissions do not close it.
4. Next individual turn start remains the outer combat cutoff; End turn alone does not close it.
   Explicit End combat closes unused optional combat responses.
5. The offered response's own ordered chain, same-trigger ordering and explicitly granted
   continuations retain their existing handling. Required work cannot be silently expired.

This cutoff is not a universal lifetime for every card. Longer grants, recurring openings and
accepted sequences use their own manifest conditions. Free play does not invent combat turns.

### Effects and multiple timelines

An ability can finish its original action, leave an ongoing effect, grant a later choice and
start a separate cooldown when that choice is used. These are distinct states with distinct clocks.
The card manifest reads their authoritative facts; it does not duplicate effect timers or infer
that all consequences end when the original action card closes.

An automatic tick or expiry resolves and logs without a new decision card. A recurring optional
choice opens a card only at its valid opportunity. Ending a source effect retires a dependent
control only when that dependency actually ends its grant; there is no universal death or
source-removal shortcut.

## Worked walkthroughs

### Player triggered action

A qualifying action resolves. Joe's character has a legal response. Joe sees the ability name,
reference and Take action; the Director sees Adjudicate for that character; the other players see
“Joe's character !”. Joe or the Director can accept the same opportunity once. The response and
any linked revisions are recorded, and all views update. If an unrelated action commits first,
the unused opportunity closes. A later qualifying trigger may create another opportunity.
This is a presentation example, not a new rule granting Joe an ability.

### Automatic result with several consequences

An operation applies supported damage and a condition and detects entry into dying. The log groups
the actual results with their semantic markers. Dying can raise attention to Alert while interaction
remains None. Eligible correction/undo controls remain available under existing policy. Nobody
must dismiss a card to acknowledge the automatic resolution.

### Selected foe: Dagger Storm

An accepted Dagger Storm grants a sequence of up to three Rapier and Dagger attacks, with its
specified movement. Remaining attacks belong to that accepted sequence; executing the first
must not erase the others through the unrelated-action response cutoff. The sequence tracks its
remaining budget and completion while damage and other consequences are resolved separately.
Source: pinned Compendium `monster/human/statblock/human-scoundrel.md`, **Dagger Storm**;
see the [research walkthrough](research/action-card-lifecycle-audit.md#dagger-storm-one-grant-with-several-steps).

### Repeated openings within one grant

For a source that grants an optional choice at each qualifying turn boundary, declining one
opening closes that occurrence. The grant waits for the next boundary until its own terminal
condition is met. If that source instead limits eligibility to the first qualifying event, a
later event cannot reopen it just because the first was declined. The ability mapping must
establish which behavior applies from its source, not from a generic “unused” flag.

## Authority, synchronization and history

- Shared operations validate the responder, acting character, open opportunity, current facts,
  budgets, pause state and dependent work at acceptance. A hidden or disabled button is not authorization.
- Player and Director submissions against the same opportunity produce at most one accepted use.
  Stale submissions after a cutoff cannot spend resources or revise the result.
- UI, command palette, slash commands and headless clients inspect and answer the same opportunity.
- Reconnects and alternate devices read authoritative current availability rather than recreating
  opportunities or replaying automatic effects from message rendering.
- Record actual actor/controller attribution, triggering event, accepted choice, closure reason and
  linked results. Preserve original entries when appending revisions, correction or undo records.
- Undo/reopening follows the existing sequential history rules. A visual refresh or an old message
  cannot independently reopen an expired opportunity or restore a spent allowance.

## Validation and implementation work

This design is a basis for implementation, not proof that the minimum schema covers every source.
Before implementing the common contract, map the scoped abilities and dependent features to it.
Classify every relevant clause as automatic/log-only, optional, required, manual or a combination;
record source references, lifetime, openings, budgets and terminal conditions for actionable clauses.
Use the existing research ledger rather than repeating its source collection. Preserve unresolved
rules in [the user question queue](rules-questions-for-user.md); validation must not invent answers.

Proposed work slices, to be registered when implementation starts:

1. **Coverage and contract:** complete the levels 1–3/selected-foe mapping and paper walkthroughs;
   refine the shared vocabulary and identify unsupported permutations.
2. **Message metadata and audience views:** routing, classification, event markers and shared
   presentation presets, integrated with current access and history behavior.
3. **Lifetime orchestration:** shared opening/closure/budget/dependency handling using the game
   clock, including the recorded gap in the any-next-unrelated-action cutoff.
4. **Triggered-action integration:** acting-player, Director adjudication and party views over
   one opportunity; apply-then-revise and existing response ordering.
5. **Remaining families:** recurring opportunities, accepted continuations and required input;
   keep automatic outcomes log-only and deferred spatial effects manual.

Acceptance scenarios for those implementation slices:

- Automatic damage/healing/condition changes log without asking for acknowledgment; correction
  controls do not create mandatory gameplay decisions.
- All three triggered-action views have the expected content and permissions; the party indicator
  reveals no additional restricted content and imposes no wait barrier.
- A player/Director race spends and resolves once, with the actual invoker attributed correctly.
- An unrelated committed action closes the unused response regardless of actor; preparation or
  rejection does not; the response's own ordered work survives.
- Closing one recurring opening preserves later legal openings. Terminal exhaustion retires the
  instance; temporary ineligibility does not. Multiple effects retain independent timelines.
- Required input prevents only dependent progression and cannot disappear at an optional cutoff.
- A multi-step accepted sequence retains its remaining work after its first child action.
- UI and headless routes produce the same persisted opportunity, outcome and history; reconnect
  and stale submissions neither duplicate nor resurrect work.

Implementation verification follows the project's coordinator process. This document records
future acceptance criteria; no runtime tests or implementation completeness are claimed here.

## Remaining design choices

Exact payload/schema names, preset identifiers, icon/color treatments, historical compaction and
ordering of multiple simultaneous indicators remain open. Start with the defaults above and refine
through the scoped mapping and UI work. No extra notification system, mandatory response barrier,
new effect tracker or per-ability lifecycle callback framework is implied.
