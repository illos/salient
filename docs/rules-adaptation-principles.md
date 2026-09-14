# Rules adaptation principles

Status: confirmed product philosophy from the 2026-09-11 discussion. Applies to v0.01 and later design.
This establishes direction, not a completed combat workflow or implemented controls. The
[development process](development-process.md) governs source research and independent implementation review.

These are design guidelines subject to the user's explicit case-specific product decisions. The user may
choose an exception for taste even when an agent's recommendation correctly follows the sources and these
guidelines. Record the exception and its scope; do not treat it as a research mistake, alter the source
explanation to justify it, or generalize it into a new guideline. User rulings remain isolated to their
original cases for now; they do not become standing precedent for later cases. In the absence of an explicit
exception, follow the guidelines rather than inventing exceptions on the user's behalf. When the user
explicitly declares a standing policy, honor its stated scope: the clock's pre-save-phase inclusion,
resource-affordability block, sequential player undo seams, older-event historical-edit lock and
combat prompt cutoffs are such declarations. Still-valid prompts stay available until next-turn start,
subject to explicit End combat and the clarified event-window early-close rule. The prompt convention preserves the response
gap after End turn; see [prompt windows](table-spec.md#inline-interaction-cards-in-the-game-log).

## The table decides; the app explains

The app exists to reduce the work of running Draw Steel and help the table understand what its rules expect.
The Director has final say over game adjudication. Damage amounts and multipliers, effects, conditions,
movement limits, and other mechanical inputs and outcomes must support deliberate manual adjustment.
Design correction as an ordinary table operation, including during combat, rather than an exceptional
administrative repair. A live-play adjustment is distinct from editing a character's underlying build.

Clarified 2026-09-13: the Director can edit persistent Stamina, Recoveries, Heroic Resources, Malice
and Victories on sheets, stat blocks and resource displays. Each change persists and appends an
attributed **Manual adjustment** entry with the before/after values. Roll-local edges/banes and results
are separate artifacts. The persistent game log itself is not freely editable; editable inputs exist
only on case-specific interactive cards, whose operations retain the immutable history. See
[the table contract](table-spec.md#persistent-values-and-manual-adjustment-entries).

Trust admitted participants by default. Players may knowingly depart from game rules when acting through
their available table operations. Explain the conflict to the acting player and make it visible to the
Director; do not block solely because the action conflicts with a game rule or require routine Director
preapproval of each departure, except for explicitly confirmed exceptions below. Director adjudication
remains available afterward. Warnings should inform
play without turning repeated actions into an approval queue; exact presentation remains open.

For example, an action beyond the source-defined allowance should remain possible with a visible warning.
This example establishes application policy, not the number or kinds of actions Draw Steel permits.

### Confirmed exception: resource affordability

On 2026-09-13 the user explicitly required blocking an ability when its resource cost cannot be paid.
This supersedes warning-only behavior for that case. The shared execution operation checks affordability
and refuses the unaffordable activation for both players and Director invocations; no warning-through
path silently waives the cost or creates an unauthorized negative balance. Existing attributed Director
resource adjustments remain available as separate operations.

Use the source's actual payment rules, reductions, waivers and permitted negative ranges. In particular,
legal Talent clarity spending into strain is not a rule-breaking insufficient-resource use. This decision
does not turn spent-action graying or other rule conflicts into blocking gates. See
[ability costs](table-spec.md#ability-costs-and-optional-spending) for confirmed deduction/choice behavior
and pinned source examples.

## Faithful automation and deliberate departures are different

Automatic interpretation and calculation must follow the pinned Steel Compendium sources and applicable
general rules and exceptions. Never fill an unfamiliar clause with assumptions from another RPG, similar
wording, or model memory. Distinguish source text, interpretation, and the app's adaptation choices.

Record a table's deliberate change as a human decision. Keep the source expectation and automatic result
distinguishable from the value or effect the table accepted. A one-time override does not silently rewrite
the source definition or become a permanent house rule. Reusable house-rule authoring is not established
by this philosophy and does not expand the core-only content scope.

An automation defect remains a defect even if the Director can correct it. Manual flexibility never lowers
the standard for behavior presented as an automatic rules resolution.

Confirmed test-scenario constraint, 2026-09-13: resource calculations must follow the pinned rules
and recorded state. Do not alter formulas, add artificial resource grants or silently prefill values
to make a demonstration work. If needed, the Director explicitly adjusts numbers inside the encounter
through recorded operations. Keep those manual adjustments distinguishable from source-earned resources.

## Show the source and the work

Every action's game-log entry must make its complete, verbatim source ability/action text available to
everyone at the table, including when parsing fails or no effects can be automated. Do not substitute an
AI paraphrase, extracted effect fragment, or only the selected result tier. Exact inline versus expandable
presentation remains open; the text must be close at hand in the log.

For sourced actions, retain the source identity and revision used, with access to relevant general rules
and exceptions behind the explanation. A used monster ability's disclosure does not expose the monster's
entire live stat block, unused abilities, or unrelated private character fields. This refines the existing
Director-only full-stat-block policy. Manual corrections without a source ability are labeled manual;
do not invent an official citation for a table ruling.

Show the meaningful resolution steps: actor and targets, supplied facts and choices, dice, modifiers,
calculations, effects and their dependencies, rule conflicts, and resulting state changes. Distinguish
proposed, automatically applied, manually resolved, and still unresolved work. Explanations must describe
the actual resolution and accepted changes, not plausible prose generated separately from execution.

## Manual play is a supported mode

Low automation coverage must not prevent use of readable content. The table can read an ability, resolve
it, and record the resulting damage, conditions, movement, or other adjustments through shared operations.
Players can record their own eligible sheet adjustments; the Director can adjudicate and correct play.
Manual resolution must remain usable without pretending the parser understood the ability.
The user deliberately excludes a standalone damage tool. Director fine-tuning uses eligible result
corrections and direct live-stat adjustments in monster stat blocks and character sheets, with shared
recorded operations and existing history, session and build-edit boundaries. This omission is not a gap.
Confirmed: the Director can mark an unsupported effect Resolved at table on its source log card.
Record that manual disposition without reapplying the effect. Dependent automation still requires
actual resulting state/facts supplied through shared operations; the marker does not invent them.

Distinguish a known rule conflict from an unknown result. A known conflict ordinarily produces a warning;
the confirmed resource-affordability exception blocks unaffordable ability execution. Missing
facts, unsupported mechanics, and unresolved interpretations must be identified honestly; the app cannot
claim a faithful automatic outcome it cannot determine. Support supplying the facts or recording a manual
resolution. Automation dependent on an unresolved effect must wait for that resolution; independent work
can proceed where its correctness is established. Detailed sequencing remains for the combat workstream.

Record what was actually completed so subsequent automation does not apply it twice or overwrite a manual
decision. Corrections and their resulting state changes belong in the same durable history as automation.

### Confirmed correction history boundary

Confirmed 2026-09-13: corrections and undo append new entries; they never rewrite the original log entry.
Future interpretation and undo follow the effective result on the current history branch. Once later
gameplay has committed, correcting an older event requires undoing the entire intervening chain first,
even within the same turn. This applies to everyone, including the Director; manual adjudication is not a bypass.
The Director retains their established encounter rewind authority. See
[correction history](table-spec.md#director-edits-to-inline-results) for the confirmed granularity and
manual-override behavior. Current due effects/valid continuations are not edits of their old source entry.

### Sequential undo authority

Player undo follows their character's uninterrupted latest actions in reverse order, stopping at the
nearest action seam or turn/FreePlay outer boundary. Another character's committed action or a Director
correction closes the player window. Shared controller identity does not remove a character seam;
automatic consequences remain linked to their initiating action. Director rewind crosses seams
sequentially within the current encounter. This supersedes the former End turn/Director-correction
exception. Record reversals and restore recorded redo without rerolling. Executing an action anew after
undo resolves current conditions with fresh dice, including turn/round work. No separate roll-reuse cache
or anti-reroll mechanism is required; the Director can adjudicate abuse through existing correction controls
and history boundaries. Source-specific valid responses
and inline result corrections retain their separate semantics; they are not selective Undo.
See [the owning history contract](table-spec.md#undo-permissions-and-proposed-campaign-control).

## Distinguish game rules from application boundaries

Warn-without-blocking governs game-rule compliance subject to the confirmed affordability exception.
Existing identity, campaign/character access, private
data, session pause/closure, and ownership policies retain their separate meaning. Campaign admission does
not grant control of every character or access to private notes. Combat build locks do not prohibit live
resource/effect adjustments. Review ambiguous boundaries explicitly rather than disguising game-rule
enforcement as technical validation.

The system must still represent and commit a coherent result: an intentional repeated action is different
from delivering one command twice after a reconnect. Supporting overrides does not justify duplicate
effects, malformed state, fabricated missing facts, or a log claiming changes that were never saved.

Keep rule assessment, accepted table decisions, state application, and the visible log distinguishable.
The log exposes the recorded operation and its changes; UI rendering must not be required to mutate state.
The exact persistence ordering remains an engineering decision, and headless and visual clients must use
the same operations.

## Still to design

Exact override controls and warning presentation; manual input and completion steps; trigger choices and
interruption timing; dependent-effect reconciliation after a correction; and detailed undo/continuation.
These principles constrain that work without settling the combat workflow incidentally.
