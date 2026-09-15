# v0.01 pre-alpha: scope checkpoint and design gaps

Checkpointed **2026-09-14** after the game-basics-first scope revision. Specification only; this is
not an implementation milestone or approval of proposed technical interfaces.

## Checkpoint and resumption

**Scope review concluded, 2026-09-14:** the user is satisfied with the current v0.01 shared-basics
scope. No additional broad product decision was identified as necessary before build work proceeds.
The building agent can ask concrete questions when implementation exposes a material gap; do not
continue an open-ended feature questionnaire. Preserve accepted deferrals and the TypeScript choice.

Remaining work is not waived: complete the sourced hero baseline/initialization contracts (G1–G3),
shared-mechanic and manual-operation details (G5), packaging/integration (G6), and dice/persistence/
history implementation and verification (G7). Resolve source and engineering questions from evidence;
ask the user only for material product choices or source ambiguities needing adjudication. See
[the build handoff](web-app-build-handoff.md#v001-scope-review-complete--build-handoff).
This is scope readiness, not a claim that the app or walkthrough is implemented or verified.

**Character-sheet direction, 2026-09-14:** the user supplied the game's paper sheet and authorized
a reasonable v0.01 spec using its content/hierarchy as guidance, without needing to perfect the first
version. Follow the [character-sheet spec](character-sheet-spec.md) for initial desktop sections,
fields and interactions. Routine layout refinements can follow playtesting; preserve existing rules,
authority and subsystem deferrals rather than importing every paper field as a prototype feature.

Current priority: establish the shared game basics as a playable, testable foundation before class-
and stat-block-specific automation. Follow [the current runtime scope](#game-basics-first--current-runtime-scope)
and the G4 checklist below. The older chronological discussions retain fuller-product designs;
they do not require deferred feature automation in v0.01. Ask material design questions one at a time.

### Game basics first — current runtime scope

Confirmed 2026-09-14: focus v0.01 on the common game systems before automating mechanics unique to
individual classes and stat blocks. This foundation will support testing and subsequent parser/engine
development. Stop the feature-by-feature Fury/Goblin automation questionnaire.

**Keep the shared basics:** encounter opening, ordinary initiative/turn flow, action tracking,
targeting, shared dice and basic test rolls, known fixed-cost payment/affordability, supported generic
damage/state application, Stamina/winded, ordinary-foe Slain status, the common clock/save-ends system,
Malice's common lifecycle, source-based Director-confirmed Victory awards, manual numeric adjustments,
the persistent game log, sequential undo/redo, closeout and Void including while paused. Existing
G4 deferrals remain; this does not bring every general rule into the milestone.

**Defer unique feature execution:** class-specific resource generation, thresholds and resets;
individual ability effects, traits, triggers, movement interactions and stat-block-specific exceptions.
This supersedes the earlier v0.01 automatic turn-start Ferocity requirement. The proposed first-damage
Ferocity grant is also deferred, not a pending question. Read the source and resolve these mechanics
manually through recorded operations. Keep Ferocity and other persistent resources editable without
claiming their class-specific logic is automated.

Generic operations may consume known sourced inputs such as an action's fixed cost or a resolved
damage amount. That does not require the parser to understand the complete action or the engine to
execute its unique clauses. Missing interpretation stays explicit; do not invent formulas, outcomes
or artificial resource grants to complete a demo. Manual adjustments and effect dispositions must
remain distinguishable from automated rule resolution, with no duplicate application.

The first-journey minimal hero wizard, sourced creation choices/baseline statistics and live-state
initialization remain separate G1–G3 requirements. This runtime simplification does not replace the
wizard with a fixture or broaden supported character choices. Existing experimental parser/engine
work remains evidence and future development material; no deletion or rewrite is requested.

**Active artifact:** [the draft basic-play walkthrough](v001-basic-play-walkthrough.md) through the real shared UI/headless
paths: start combat, take a turn, record an action/roll and any fixed cost, apply supported damage or
record manual results, inspect persistent values/log entries, advance the clock, undo/redo and close
or void the encounter. Test permissions, retries and reload alongside the gameplay. General mechanic
inputs/formulas still need source-backed contracts; individual feature completeness is not a gate.

**Foe hiding deferred, 2026-09-14:** all loaded foes are visible in player/observer rosters;
combat participants and their initiative groups/turns have no hidden-foe presentation. Omit
hide/reveal controls and the Add visibility setting from v0.01. Full monster stat blocks remain
Director-only; health display and Malice visibility retain their separate policies. This defers
roster visibility controls, not the source rules for stealth or concealment. Fuller V1 hide/reveal
design remains future work. Audit F2 is closed for this milestone by scope deferral.

Continue with common roll-input/commit controls and automatic/manual result recording. Existing
opening, Take turn and manual-adjustment decisions remain settled.
Confirmed walkthrough answer, 2026-09-14: the acting player/Director supplies edge and bane counts;
the app calculates their rules-defined effect and logs inputs/results. Discovery of every reason
for those modifiers is not required for v0.01. See [the accepted boundary](v001-basic-play-walkthrough.md#first-review-case-supplying-edges-and-banes).
Next-attack controls confirmed, 2026-09-14: counts start at zero, are set before completing
ability/target selection, are recorded with the accepted attack and reset afterward. Preserve
existing auto-fire. Placement remains flexible for playtesting; a game-log card is not mandatory.
Characteristic default confirmed, 2026-09-14: automatically select the highest permitted current
roll characteristic when the action offers a choice; allow a pre-fire override and record the
selected characteristic/value. This does not broaden the source's permitted choices.
Per-target modifiers confirmed, 2026-09-14: multi-target attacks allow different edge/bane counts
for each target, recorded with the respective outcomes and cleared after the accepted attack.
Target-only clarification confirmed, 2026-09-14: enter complete edge/bane counts separately for
each target, including single-target attacks. The user rejects the attack-wide-plus-target
stacking proposal. No attack-wide modifier field or inherited counts; retain zero defaults,
per-target source arithmetic/logging and reset after the accepted attack. Placement stays flexible.
Critical-hit automation confirmed, 2026-09-14: recognize/log a natural 19 or 20 on the qualifying
main-action ability roll, apply its tier 3 outcome and make the immediate additional main action
available after resolution. The player chooses whether/how to use it; do not execute it automatically
or bank it as a generic action. Preserve recorded history and once-only grants. See
[the walkthrough](v001-basic-play-walkthrough.md#next-review-case-critical-hit-action-tracking).
Supported damage and Stamina updates remain settled. Exact critical opportunity lifetime,
chaining and off-turn/source-exception contracts still need bounded follow-up.

Review cadence reaffirmed, 2026-09-14: keep asking the next material question after recording each
answer until the user is satisfied with the V1 specification. Preserve the distinct v0.01 scope.
(Concluded later the same day: the scope-review conclusion at the top of this document applies.)
Firing/post-roll clarification confirmed, 2026-09-14: retain existing automatic firing, including
full-count multi-target firing, and include per-target Add edge/Add bane controls afterward. This
is a narrow exception to the earlier inline modifier-editor deferral. Follow the existing same-dice,
append-only correction and sequential-rewind contracts; direct damage editing remains deferred.
Acting-player authority confirmed, 2026-09-14: players can add edges/banes to their own eligible
attack within the same window as gameplay undo, ending at the next actor's turn start. Existing
earlier undo seams and sequential rewind still apply; Director correction authority remains.
Modifier removal confirmed, 2026-09-14: players and Director may also reduce incorrect per-target
edge/bane counts through that card under the same authority/history limits. Keep the dice and
append the correction; counts cannot be negative. Direct damage editing stays deferred.
**Condition scope simplified, 2026-09-14:** one on/off toggle per core condition. Players manage
their own controlled heroes; the Director manages all heroes/foes. Persist and log changes under
existing authority/history rules. Manual source entry, duration choices, expandable application
records and source-specific removal are superseded for v0.01. Clear all stays deferred.
Ability-driven application/expiry follows parser support; a toggle implies no duration or save rule.
See [the owning contract](table-spec.md#v001-manual-condition-tracking).
Manual save handling confirmed, 2026-09-14: for these toggles, use ordinary dice controls for
the save and manually switch the condition off when appropriate. Automatic save scheduling/removal
for toggles waits for ability support. This narrows the earlier automatic-save requirement for
manually tracked conditions; the shared clock and other supported scheduled work stay included.
Catch Breath confirmed, 2026-09-14: automate the ordinary hero maneuver, spending one actual
Recovery and restoring Stamina using actual recovery value, with linked action/state records,
affordability, retry safety and history. Preserve the hero-dying automation deferral and manual
adjudication. See [the owning contract](table-spec.md#v001-catch-breath).
Out-of-combat Recovery spending confirmed, 2026-09-14: the same basic healing control spends
one actual Recovery per use in FreePlay, with linked healing/logging and no combat maneuver cost.
Keep running-session permissions and actual resource/eligibility checks; respite stays deferred.
Temporary Stamina confirmed, 2026-09-14: a separate Director-editable value with logged changes;
supported damage consumes it before ordinary Stamina, while ordinary healing does not refill it.
Keep it separate from maximum Stamina, recovery value and winded. Ability grants remain manually
resolved. See [the owning contract](table-spec.md#v001-temporary-stamina).
Defend and Aid Attack confirmed, 2026-09-14: usable common actions with actor/target records,
source action-allowance tracking and full rules text in the log. Their modifiers are manually
resolved through the existing per-target inputs; no automatic benefit/timing interpretation.
See [the owning contract](table-spec.md#v001-defend-and-aid-attack).
Surge tracking confirmed, 2026-09-14: include a persisted Director-editable counter on the hero
sheet with attributed numeric adjustments. Gains, spending and their effects remain manual;
no surge-spending card is required. See [the owning contract](table-spec.md#v001-surge-tracking).
Hero tokens deferred, 2026-09-14: skip the shared counter and its associated UI/automation in
v0.01; the previously deferred failed-save spending follow-up stays deferred. Other accepted
resource controls remain included. The user reaffirms no class- or monster-specific feature work
in this pass; continue shared game basics, not another feature-by-feature content review.
Automatic main-action substitution deferred, 2026-09-14: keep existing nonblocking action use;
a player can use a second maneuver without a new substitution workflow. Record actual uses and
retain advisory allowance tracking and real resource-affordability checks.
Common resource cleanup confirmed, 2026-09-14: clear remaining surges and temporary Stamina
automatically at normal combat end, logging actual changes once. Specific exceptions remain
manual; Void keeps its separate keep/reset behavior. See [closeout](table-spec.md#formal-encounter-closeout).
G6 language decision strengthened, 2026-09-14: TypeScript is the standing engine choice for
v0.01 and beyond unless a concrete reason to change emerges. No routine later language comparison
is required; packaging, execution placement and integration still need engineering work. See
[the owning decision](engine-architecture.md#standalone-engine-and-portability).
The user accepts the consolidated v0.01 scope as sufficient to proceed with build work and
concrete follow-up questions as needed. The walkthrough remains a draft acceptance artifact,
not a completed implementation or test.

Review answer, 2026-09-13: Lines of Force uses the existing contextual response flow. Apply the triggering
action's outcome, surface its detected triggered-action opportunity, then modify that effective outcome
when the response is invoked. The proposed wait-before-movement approach was not selected. Preserve the
original log entry and append the linked response changes. The bugbear's damage/push numbers were
illustrative. Same-turn dependencies and other response consequences remain open; see
[the owning sequence](table-spec.md#inline-interaction-cards-in-the-game-log).

| Confirmed area | Current baseline / owning detail |
| --- | --- |
| Opening | Draft until Director OK; then snapshot, combat locks and initiative. Active players/Director roll; no observers. Winner chooses starting side; Director may choose regardless. After OK, abandoning uses Void keep/reset. [Opening](table-spec.md#confirmed-initiative-setup-and-shared-presentation). |
| Layout | Director left, log center, heroes right. Player sheet plus party resources; Director foes controls and vertical hero resources. Same role layout in FreePlay, without turns. [Layout](table-spec.md#confirmed-combat-layout). |
| Groups | One group per hero; Director owns group changes. Individual turns and spent status remain separate from group activation/completion. Newcomers and regrouping follow the settled active/finished-group rules. Groups are not minion squads. [Groups](table-spec.md#mid-combat-additions-and-regrouping). |
| Turns and movement | Sheet-based actions; advisory spent-action graying; explicit End turn. Ordinary board movement is not recorded; no initial I moved/Convert to maneuver buttons. [Turn UI](table-spec.md#player-sheet-actions-and-explicit-end-turn), [movement](table-spec.md#move-action-rules-check). |
| Targeting | Before/after ability selection; ordinary single/self auto-fire, checkbox multi-select with full-count auto-fire, explicit area fire. Per-user visible selections; accepted clearing/cancellation rules. [Targeting](table-spec.md#roster-targeting-controls). |
| Persistent areas | Stack fixed-bottom cards; owner/Director update membership and confirm each firing with prior selection prefilled. Dependent work waits; Resolve now handles unobserved triggers. No ordinary reminder inbox. [Areas](table-spec.md#persistent-area-effect-cards). |
| Tests | Deliberately no generic Request test UI/command or lifecycle. Verbal calls and direct character rolls; source-specific test steps retained. Public workings/total, calculated outcome when context is known, otherwise Director interpretation. Known difficulty hidden by default; current setting also applies to history. [Tests](table-spec.md#freeplay-baseline-and-combat-transition). |
| Costs | Fixed applicable costs debit automatically; optional pre-resolution choices use cards unless supplied. Unaffordable ability execution blocks, honoring source waivers/legal negative ranges. [Costs](table-spec.md#ability-costs-and-optional-spending). |
| Clock | Individual turn/round events, FIFO due work and save-ends last; include applicable effects applied before the final save phase. Automatic saves and event-limited hero-token response (fuller-product baseline; in v0.01 automatic saves apply only to effects with supported source-backed timing, toggled conditions use manual saves and the hero-token response is deferred, per the checklist below). [Clock](table-spec.md#game-clock-and-scheduled-rules-work). |
| Corrections | Original entries never rewritten; corrections/undo append. Manual damage overrides survive modifier changes. Older-event edits after later gameplay require the entire intervening chain to be rewound, even within the same turn and including Director edits. [Corrections](table-spec.md#director-edits-to-inline-results). |
| Undo/redo | Sequential player undo of uninterrupted own-character actions up to the nearest seam; another character's action closes the window. Turn/FreePlay outer bounds remain. Director sequential rewind crosses seams within the current encounter. Exact Redo preserves recorded dice; new execution uses current conditions and fresh dice, without a separate reuse cache. Committed Director corrections also create seams; the older exception is superseded. [History](table-spec.md#undo-permissions-and-proposed-campaign-control). |
| Scope | v0.01 remains a desktop slice with temporary UI. Playable retainers/friendly monsters are beyond V1; source references and extension boundaries remain. [V1 scope](v1-spec-checkpoint.md). |

[Commands and action cards](table-command-spec.md) own shared UI/palette/slash/headless operations and
attributed ordered entries. Cards present inputs and results; they contain neither parsing nor engine
logic. The mandate is table-only. The accepted grammar is optional `@Character`, `/family verb`, named
arguments, quoted strings and typed-reference lists. The [command catalog](table-command-catalog.md)
organizes additional proposed spellings; syntax support does not imply implemented operations or settled
schemas. Future extensibility and adventure modules do not expand current content scope.

[The table checklist](table-spec.md#8-continue-exploring) owns remaining gameplay decisions; the
[command checklist](table-command-spec.md#decisions-still-open) owns remaining operation contracts. Prioritize
a sourced ability/trigger/correction walkthrough. Same-turn dependencies, source-specific start/response
ordering, conditional spending, special turns, FreePlay fictional-time reuse,
completion/respite and certain history/privacy details remain open.

The [rules status](workstream-rules-status.md) records checkpoint evidence and ownership; the
[decision record](gameplay-decision-record.md) preserves recommendations and replies. Individual rulings
remain scoped unless explicitly declared standing. The [app handoff](web-app-build-handoff.md) communicates
settled behavior to the separate implementation thread without authorizing unresolved mechanics.

Review answer, 2026-09-13: the next-individual-turn start is the standing closing event for all combat
action-card prompts. Responses remain available after End turn, including those first triggered by it.
This supersedes earlier triggered-turn-end and combat-test round-end expiry. Persistent effects retain
their own lifetimes, required unresolved work still blocks dependent progression, and FreePlay has no artificial turn boundary; remaining source-specific cards retain applicable lifetimes.

Review refinement, 2026-09-13: automatic scheduled work resolves at its prescribed boundary, while
optional follow-ups remain active until the next individual turn starts. End-turn saves do not wait for
that response window to close. Resource grants retain source-defined timing; required unresolved input
retains its dependency rules. See [the game clock](table-spec.md#game-clock-and-scheduled-rules-work).

Review answer, 2026-09-13: following the [delegated forced-movement research](research/forced-movement-dependencies.md),
the user accepted asking for the minimum information required to resolve an action. Collect the specific
missing facts/choices on the relevant action/effect card and derive the rest from known state. No universal
movement report or routine completion confirmation is required. A separate Director collision/fall tool
was the earlier suggestion; it is deliberately excluded by the later fine-tuning decision. The proposed generic Resolved
manually control, responder authority and dependent-correction behavior remain open. Source uncertainties,
including zero-distance triggers, were not settled by this product-direction answer. See
[the owning contract](table-spec.md#inline-interaction-cards-in-the-game-log).

Review refinement, 2026-09-13: small, purpose-specific action-card interfaces are confirmed for special
actions needing input. Lines of Force also reverses dependent consequences invalidated by its changed
movement, including already-applied collision damage, and resolves the redirected consequences with
minimal new input. Keep the original applied outcome and append the response/reversals; unaffected attack
damage stays applied. The user prefers this smooth apply-then-revise flow despite the reconciliation
complexity. Later player choices and already-spent dependent resource grants remain unresolved.

Research result: [trigger opportunities and intervening actions](research/trigger-opportunity-intervening-actions.md)
finds that collision-funded spending followed by belated Lines of Force is not an ordinary source-supported
sequence: the response belongs before that collision. Original attack damage can supply Ferocity before
movement and remains after redirection. The earlier hypothetical is withdrawn as a source-backed reason
to require automatic undo of a later ability; that undo policy has not been accepted.

Review answer, 2026-09-13: committing an unrelated new ability closes that character's earlier unused
optional triggered-action opportunity. Preparation and refused activations do not count; preserve ordered
response chains, new opportunities, explicit continuations and responses to unrelated events (see the
later clarification: allies' prompts for Thorn's hit close when Thorn takes another action or spends
its resource grant). Unrelated
card kinds retain their own rules. The next individual turn start remains the outer deadline.

The user also makes precise resource bookkeeping an explicit priority: record when and why grants happen
and ensure all applicable logic respects them. Affordability, optional spends, feature thresholds, usage
limits and corrections/undo must use the appropriate source stage and causal records, preserving valid
independent grants and preventing duplication. This is identified as high-value automation because the
same bookkeeping is difficult for players. See [costs and resources](table-spec.md#ability-costs-and-optional-spending).

Review answer, 2026-09-13: when the session is paused, both rosters are locked until resume. This includes
session-player/character changes, foe additions/removals, regrouping and saved-encounter loads. It supersedes
the earlier paused-edit permission and resolves paused current-monster removal by prohibiting the edit,
without queuing removal or turn processing. Between-session foes management and running-combat foes edits
remain available; the combat party lock remains. See [roster timing](table-spec.md).

Review answer, 2026-09-13: provide formal encounter closeout UI. Director End combat closes unused
optional combat responses; required unfinished resolution completes before rewards/cleanup. The existing
wrap-up then returns to FreePlay. This supplies a cutoff when no next individual turn starts. Exact
presentation and source-specific ending order remain open. See [closeout](table-spec.md#formal-encounter-closeout).

Review answer, 2026-09-13: draft combat setup follows live roster changes before OK. Newly added
creatures appear included, removed creatures disappear, and remaining creatures retain participation,
surprise and grouping. Roster changes do not reset the draft. The subsequent decision gives each ordinary monster its own initiative group, with minion squads separate.
See [setup](table-spec.md#confirmed-initiative-setup-and-shared-presentation).

Review answer, 2026-09-13: Show test difficulty applies to all displayed test entries, including history.
Changing it updates player visibility of recorded difficulties, without changing rolls or outcomes or
rewriting closed-session history. Per-test reveal remains deferred.

Review answer, 2026-09-13: after [rules research](research/tests-and-request-ui.md), the user removes
formal Director test requests from scope for now. The Director asks verbally and players roll directly.
Retain source-specific test steps, modifiers, bookkeeping and public roll workings. If the app lacks the
difficulty/outcome table, the Director interprets the result. This supersedes the prior request-card,
response-mode and lifetime decisions, including the earlier no-cancel refinement.

**Deliberate scope decision:** generic Director test requests are intentionally omitted for now, not
an unanswered specification gap. Do not reintroduce the UI, command or request lifecycle as missing work
without a new user decision. Verbal requests and direct character rolls are the selected flow; tests
required by specific actions may still use those actions' cards.

Review answer clarified, 2026-09-13: the character sheet/player pane follows the viewed character.
Game-log cards can act for either controlled character and must clearly label who will act before
interaction. Card actions use that bound actor without requiring a sheet switch. This supersedes the
blanket all-UI-follows-selection wording. Other switch prompts/automatic sheet changes remain open.

Confirmed explicit Take turn navigation, 2026-09-13: when a user chooses **Take turn** for a character
and that operation succeeds, switch that user's player pane/character sheet to the chosen character.
For example, taking Elwin's turn while viewing Thorn opens Elwin's sheet. Apply the existing actor-switch
draft-clearing rules when the viewed actor changes. This settles navigation following the user's own
explicit turn choice; it does not establish automatic switches for other users, passive turn changes,
or game-log card responses.

Review clarification, 2026-09-13: each character follows the same mechanics regardless of whether
characters share a player or have different players. Multi-character control affects navigation and
actor labeling only, with existing authority/attribution preserved. Do not frame dependency rules as
special multi-character-player rules. The subsequent sequential undo model resolves this case: the recipient's action closes the grantor's
player undo window, regardless of shared or separate controllers.

Confirmed sequential undo seams, 2026-09-13: the game log is one ordered event history. A player can
undo their own character's uninterrupted latest actions, in reverse order, only as far as the nearest
seam. A committed action by another character closes the earlier character's undo window, even within
the same turn and even if both characters share a controller. A response/accepted follow-up is an action
for this purpose. Merely affecting another character is not another character taking an action.
Automatic consequences stay linked to the action that caused them; they do not constitute another
participant acting. Reads, chat and sheet navigation do not create gameplay undo seams.

A committed Director correction is also an intervening gameplay action and closes the player's
undo window. The older exception allowing player End turn undo to reverse that Director correction
is superseded by the current sequential model. The Director must unwind the correction before reaching
the earlier action. Ordinary corrections to older events likewise require full sequential rewind
once later gameplay has committed. Valid source-specific responses retain their separate semantics.

The existing turn-start and FreePlay-stretch limits still provide outer boundaries. A player cannot skip
an intervening action, selectively remove an earlier grant, or pull another character's accepted response
into a player-initiated undo cascade. Director rewind proceeds sequentially through the intervening actions,
including across character/turn seams, within the existing current-encounter limit. Shared UI/headless
operations enforce the same order and authority; stale inline Undo controls cannot bypass a seam.

Example: Elwin grants Thorn an opportunity to spend a Recovery; Thorn accepts. Thorn's follow-up closes
Elwin's undo window. To remove Elwin's originating action, the Director first undoes Thorn's response
(reversing its healing and refunding its Recovery spend), then undoes Elwin's action. The result is the
same if Amy controls Zik as the recipient. No new permission to rewind closed sessions, separate
encounters or inventory history is created.

Redo restores recorded actions in forward order along the available redo path under existing authority
and seam limits. It does not reroll or re-execute rules. New gameplay still clears redo availability while
preserving abandoned history and its recorded results. New execution uses current conditions and fresh
dice. Internal event granularity does not permit
selective reversal around a later accepted action.

Cleanup alignment: the latest sequential ruling supersedes the older Director-correction exception.
A committed correction creates a seam; automatic effects do not.

Cleanup checkpoint, 2026-09-13: [the consistency review](spec-consistency-review.md) aligns current
specs with sequential undo seams, retires the old Director-correction exception, and reconciles prompt,
test, character-context, grouping and pause-lock summaries. Remaining questions are explicitly listed;
intentional exclusions are not missing requirements.

Review answer, 2026-09-13: ordinary corrections to older events require undoing the entire intervening
chain first. This applies within a turn and across multiple turns, including for the Director. It
resolves the cleanup's same-turn inline-edit question. Current effective results remain editable;
valid source-specific responses retain their separate semantics.

Confirmed triggered-opportunity restoration, 2026-09-13: when authorized sequential undo restores
the point before a triggered action was used, restore its prompt if the trigger/opportunity is still
valid in the restored state. Reverse the response's recorded costs and effects, including its usage
bookkeeping, without rerolling the original triggering action. Preserve the original use and reversal
in history; restore the opportunity rather than creating a duplicate response entitlement.

Revalidate the prompt against current authority, restored game timing and source conditions. Undo does
not bypass player seams, pause/closure restrictions or the Director's rewind limit. Redo restores the
recorded response exactly; undo itself does not automatically use the reopened response. This settles
triggered-action prompt restoration, not every required-input card's recovery behavior.

Review answer, 2026-09-13: FreePlay actions have no claim on the new encounter's action economy: no imported first turn, spent
action or replay. Current damage and resource spending carry forward, subject to source-defined
combat-start initialization/grants/resets. Earlier actions stay in FreePlay history; no new rewind
scope or resource waiver is implied.
See [the combat transition](table-spec.md#freeplay-baseline-and-combat-transition).

Review answer, 2026-09-13: saved encounters include deliberate monster initiative groups, minion
squads and captain assignments. Reopening, duplication and loading preserve that preparation; loaded
instances and relationships remain independent. Individual ordinary-monster defaults and the separation
of squads from initiative groups remain. Squad count, participation and captain controls are selected; other preparation styling and source exceptions remain open; this
fuller-product decision does not expand the immediate ordinary-monster prototype fixture.
See [saved preparation](monster-catalog-spec.md#user-visible-flow).

Review answer, 2026-09-13: minion overflow-kill assignments use the existing area/spatial-targeting
pattern: an inline card or prompt in the game log asks the acting user to identify additional casualties,
with Director access retained. Derive the count and collect missing identities as a linked continuation
of the original action, without applying damage again. Required dependent work retains its existing
input policy. This settles the interaction pattern, not every minion damage/turn rule.

Review answer, 2026-09-13: choosing End combat ends structured play; turns stop governing progression.
Do not automatically finish the current turn/group/round or generate their final saves, damage or resource
work. Already-caused required resolution and combat-ending effects/rewards/cleanup retain the established
closeout flow. This does not decide every ongoing effect's outside-combat lifetime.
See [closeout](table-spec.md#formal-encounter-closeout).

Combat-flow review continued one question at a time, as requested 2026-09-13, until the 2026-09-14
scope-review conclusion above. Resolve material behavior through source checks and user decisions; do not
turn exhaustive ability coverage or visual polish into flow-completeness requirements.

Review answer, 2026-09-13: encounter-end cleanup presents each player's applicable action/effect
options so they can take stock and choose what to resolve, using the existing labeled character-bound
log cards. This replaces the proposed automatic-clear default. Source-required cleanup retains its
own rules. No mandatory per-player ready confirmation was established.

Review answer, 2026-09-13: Director Finish cleanup closes remaining unused optional cleanup choices
once the table is ready; required unfinished resolution completes first. Individual ready confirmations
are not required. Closing unused options does not execute them. See
[closeout](table-spec.md#formal-encounter-closeout).

Review answer, 2026-09-13: the Director grants the number of Victories at closeout. The accepted
control has an editable amount initially 1, including 0, and the recipient heroes. Director confirmation
commits the grant; enemy elimination and the initial field value do not award it automatically. Record
resource changes once, retaining source eligibility and Director adjudication.

Review answer, 2026-09-13: once all initiative groups finish, advance the round even if an unacted
creature was moved into an already-finished group. It waits for that group's next activation. Do not
invent a turn, mark it acted or fire individual turn boundaries. Active-turn and required-work completion
remain prerequisites to the genuine round boundary.

Review answer, 2026-09-13: the Director can mark a specific unsupported effect Resolved at table
on its log card after manual resolution. Record that disposition without applying the effect again;
dependent automation still requires actual state/facts supplied through shared adjustments/inputs.
Other parts of the action retain their own applied/pending/manual state. This is a partial-automation
fallback, not a routine movement-completed click or replacement for purpose-specific cards.

Review answer, 2026-09-13: once an encounter is closed out, it is a historical archive. Finish cleanup
is final for gameplay rewind: no player or Director can reopen the encounter or edit its archived events.
Current-state adjustments are new recorded actions, not archive edits. Existing within-encounter rewind
and closed-session immutability remain. Separate inventory/progression history cannot reopen combat.

Boss-flow review: [source research](research/boss-turns-and-extra-actions.md) distinguishes full-turn
capacity (two for Thorn Dragon, up to three for Ajax), additional main actions and separate villain/
triggered allowances. The user proposes a compact turn manifest of applicable allowances. Exact visual
placement is not a combat-flow gate. Immediate-turn return and the actor-linked turn-entry/group model are confirmed below.

Review correction, 2026-09-13: the user rejects a separate boss/ability-specific forgo-turn control.
End turn at any time is already part of the shared contract; no new early-finish mechanism is needed.
An actual End turn still resolves its source effects and required work. The rejected proposal does not
create an eventless way to erase future turn entitlements.

Review answer, 2026-09-13: Show Malice is another campaign setting, off by default, controlled by the
active Director. The Director always sees the current shared pool; enabling it shows the pool to players
and observers. Persist the setting and enforce the audience through shared access. Resource mechanics
and full used-action source disclosure remain unchanged.

Review answer, 2026-09-13: Director Void is permitted while paused, using the existing keep/reset
choice. It ends the active encounter without resuming the session; pause and its roster lock remain.
Normal gameplay remains blocked, and Void does not run normal combat-ending rewards/cleanup.

Review answer, 2026-09-13: Restore starting state also restores the combat-start foes roster: remove
foes added later and restore removed original foes with their recorded state and relationships. Keep
current state retains the current roster. This restoration is part of Void, including while paused;
ordinary paused roster edits remain blocked.

Review answer and generalization, 2026-09-13: Restore starting state returns the Director panel to its
combat-start gameplay snapshot, including monsters and loot. This governs the panel as a whole rather
than requiring a separate policy for every addition. Remove post-start additions and restore original
state; Keep retains current state. Reconcile related item locations/claims without duplication while
preserving history. Rewards loaded before combat are part of the snapshot. Existing paused-Void and
account/access boundaries remain.

No item-by-item reset-scope question is pending. Continue the end-to-end combat-flow review, distinguishing
material product decisions from source-rule implementation and cases already covered by general contracts.

Review answer, 2026-09-13: deliberately leave the standalone damage tool out of the spec, including
the suggested collision/fall controls. Director fine-tuning uses result corrections and direct live-stat
adjustments in monster stat blocks/character sheets. These remain recorded shared operations with existing
history, authority and session boundaries. This omission is not a missing combat-flow feature.

Review answer, 2026-09-13: Void also seals the encounter as a historical archive once its keep/reset
choice is applied. Neither player nor Director can reopen it through gameplay undo/redo or edit archived
events. Preserve the selected outcome and void disposition; new current-state adjustments remain separate.
Normal Finish cleanup and Void now share the terminal archive boundary.

Review answer, 2026-09-13: accepted immediate-turn return. An ability such as Wode Sickness runs
the target's normal turn immediately, then returns to the interrupted initiative group's remaining
members. That turn is spent when the target's own group activates. Preserve normal turn boundaries
and separate individual turn use from group activation.

Review refinement, 2026-09-13: the user identifies the new conceptual layer explicitly. Initiative
groups contain turn entries linked to actors, usually one per actor. Multiple entries can reference
one creature without duplicating its live state. The ordinary one-turn grouping rules still apply;
the repeated mixed-group activation proposal is superseded, with granted-entry placement confirmed below.

Review ruling, 2026-09-13: granted turns appear at the bottom of the initiative roster in their own
new groups, like newly added monster turns, unless the source requires immediate/directly following
timing. Use the existing actor; do not duplicate creatures or reopen a completed group. Bottom placement
does not impose a fixed turn order. See [the refined group model](table-spec.md#initiative-groups-confirmed-app-model).

Review answer, 2026-09-13: an immediate granted turn interrupts and then returns to the unfinished
individual turn. The interrupted actor keeps its original turn and spending: Thorn's attack remains
spent and his unused maneuver remains available after the War Dog Breaker's final turn. Do not fire
extra start/end boundaries for suspension/resumption or refresh allowances. The granted turn retains
its own genuine boundaries and source timing.

Review clarification, 2026-09-13: dragging/regrouping moves only the selected turn entry. The user
points out that this already follows from making turns the grouped/draggable unit. Their other turn
entries stay put. This is a direct implication of the model, not a separate decision requiring approval.

No turn-entry dragging question remains. Apply the model consistently to grouping controls and saved
preparation while preserving actor identity, source timing and spent-turn state. Continue the broader
combat review with concrete unresolved behavior; do not turn direct implications or implementation
verification into repeated product questions.


Review correction, 2026-09-13: the Parry case is already covered by precedent. Thorn taking damage
opens the ally's Parry card; Thorn taking another action or spending the resulting resources closes
that response window, including the ally's prompt. The earlier actor-only interpretation was too narrow.
No late-Parry dependency question remains and no special repair mechanism is approved. Preserve existing
history, source-stage resource bookkeeping, response chains and unrelated events' windows.
See [the source example and correction](research/ally-response-after-resource-spend.md).


Focus at 2026-09-13 (completed; minion squads are deferred beyond v0.01): full minion lifecycle research
was requested before further design questions.
[Context report](research/minion-lifecycle.md) covers squad preparation, captains, shared turns,
attacks, damage/casualties, reinforcements, transformations and encounter closeout, with source limitations
separated from existing app decisions. No new rule or UI choice is implied by loading this context.


Current minion/terrain discussion is checkpointed in
[the latest audit](spec-consistency-review.md#latest-rulings-checkpoint). The owning
[minion contract](table-spec.md#minion-squads-and-captain-state) includes the squad entry, count/EV,
member targets, coordinated attack/captain actions, bonus transitions and personal extra captain turns.
Area damage has a final affected-members ceiling and no outside-area casualties. The
[clock contract](table-spec.md#game-clock-and-scheduled-rules-work) owns scheduled effect dispatch and
counts shared turns once. These are selected behavior, not unanswered UI proposals.

## Confirmed direction

Review answer, 2026-09-13: removing the monster taking an ordinary individual turn finishes that turn,
resolves applicable end-turn effects and lets combat continue through the existing group/side handoff.
No separate End turn click is required. The subsequent pause decision blocks roster removal while paused. See
[group operations](table-spec.md#mid-combat-additions-and-regrouping).

The immediate target is a **v0.01 pre-alpha prototype**: a connected playable slice with a durable
architectural foundation. Components can have narrow coverage and develop at different rates. Complete
subsystems and full ability parsing are not prerequisites for this milestone.

Focus on desktop browsers. All current UI is temporary and intended to prove concepts and workflows.
Mobile/tablet layouts and finished visual polish come later. The table is this app's live gameplay surface,
with particular priority on performance and interaction quality; it is not a standalone product or an
embedding requirement. The engine retains its independent reuse intent. Shared operations and character
logic must remain usable when the temporary UI is replaced.

Development data is disposable across breaking updates. Prioritize the latest live, playable development
version; reset/reseed may replace migration. Introduce separate branch development once a working app needs
protection from disruption. Normal runtime save/reload/reconnect and recorded history still matter. This
policy does not automatically advance pinned dependencies. The
[development process](development-process.md#confirmed-pre-alpha-development-policy) owns the details.

This document is the current **v0.01 scope index**. The [V1 checkpoint](v1-spec-checkpoint.md) records the
fuller product destination, and primary specs own detailed behavior. Their complete feature lists and
acceptance examples are not automatically prototype gates. Existing core-source exclusions, authority,
privacy and session rules still apply to exposed features unless explicitly changed.

## Confirmed first acceptance journey

The user must be able to:

1. Create a campaign.
2. Invite players through the established campaign membership flow.
3. Start a session.
4. Add at least one catalog stat block directly to the live foes roster.
5. Create a level-one devil **Berserker Fury** through a minimal working wizard and load it into the party (hero) roster.
   Confirmed 2026-09-14 (Q-R-103): Reaver and Stormwight are outside v0.01; see the
   [wizard scope](character-wizard-spec.md#v001-scope).
6. Walk through the basic action economy of combat, with recorded gameplay visible in the game log.

These are connected application workflows, not isolated component demos. The list describes required
capabilities, not a rigid screen order: the hero must exist and pass applicable review before entering play.
Basic sign-up/sign-in supports the participating users.

The user corrected the fixture to **devil ancestry, Fury class, level one**. The
[prepared hero](hero-fixture.md) can supply a sourced example for the remaining choices; its other choices
were not individually mandated. The wizard must cover every applicable creation step, including ancestry,
culture, career, class, kit and the other sourced steps, using the step names and order of
[Making a Hero](../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#step-by-step-hero-making)
(ancestry, culture, career, class, kit, free strikes, complication, details, connections; "Background" is
the Compendium chapter containing Culture and Careers, not a step), with one supported option or valid
selection set per step acceptable. The optional complication step is not presented in v0.01 (Q-CHAR-1
answered 2026-09-14: no). Preserve real selections, valid counts/dependencies and derived values. Loading a prepared
hero behind a mock wizard does not meet the requirement. Starting-equipment inventory creation is excluded
by the inventory deferral; applicable build choices such as kit selection remain included.

The parser need not resolve every ability. Relevant hero, foe and ability text must remain readable under
existing visibility rules, and partial automation must be represented honestly. Exact turn/action
tracking, manual-resolution sequencing, reactions, costs and undo dependencies remain open. Game-rule
conflicts ordinarily warn without blocking deliberate play; insufficient resources for an ability are
now an explicit execution block. Automatic application and manual completion sequencing
remain to be designed.

## v0.01 combat acceptance checklist

Readiness-audit [G4](v0.01-readiness-audit.md#g4-v001-combat-acceptance-checklist) is resolved as a
scope artifact on **2026-09-13**, after reviewing the choices one at a time. This is not an implementation
completion claim. The 2026-09-14 game-basics-first revision defers unique feature automation under G5;
G1–G3 still own the wizard, evaluation and new-hero state contracts.

| Area | Required in v0.01 | Deferred beyond v0.01 |
| --- | --- | --- |
| Opening and turns | Full staged opening; ordinary heroes/foes; individual initial groups, Director regrouping, Take turn/End turn and settled action tracking | Minion squads/captains/pooled Stamina, boss extra-turn mechanics, dynamic terrain objects |
| Targeting and roll inputs | Existing self/single/multi-target firing; all foes visible; highest permitted roll characteristic selected automatically; target-only edge/bane counts with zero defaults and post-roll add/remove corrections in the accepted window | Foe hiding; persistent area-effect cards; attack-wide modifier stacking |
| Costs and common actions | Automatic applicable fixed-cost deduction, affordability block and logged spending; Catch Breath and FreePlay Recovery spending; Defend/Aid Attack with recorded use and manual benefits; critical-hit recognition and extra main-action opportunity | Optional enhancement cards; automatic main-action substitution |
| Damage and responses | Supported damage, Stamina/winded updates, source text and recorded manual adjustments/resolution; Director editing of persistent sheet/stat-block/resource numbers; per-target post-roll edge/bane additions/removals (2026-09-14 exception) | Broader inline attack-result editing, including direct damage editing, and automatic reconciliation of source-specific responses revising applied outcomes |
| Conditions and extra counters | Logged condition toggles (players on own heroes, Director on all); surge counter with manual gains/spends; separate temporary Stamina consumed before ordinary Stamina | Source/duration condition forms; automatic ability-driven condition timing; Clear all; hero-token counter and spending UI |
| Clock | Turn/round timing and supported scheduled work. No save-ends roll is automatic in v0.01 (Q-TS-1 answered 2026-09-14): all saves use ordinary dice controls and manual condition removal | Automatic end-of-turn save-ends resolution (V1, when source-backed operations supply timing); automatic save scheduling/removal for toggles; failed-save hero-token follow-up |
| History | Full settled sequential player undo, Director encounter rewind and exact recorded Redo | Separate inventory/build-history interfaces remain under their existing deferrals |
| Closing and noncombat | Formal closeout/source-earned Victory awards/archive; common Malice lifecycle and normal combat-end surge/temporary Stamina clearing; Void keep/reset including while paused; basic noncombat table | Inventory/loot, dedicated respite and out-of-combat fictional-time systems |
| Tests and log | Basic public direct test rolls showing dice/modifiers/total; complete verbatim used-action text and actual recorded work | More elaborate automated test workflows |
| Runtime specialization | Known sourced inputs consumed by shared operations; readable class/stat-block features and recorded manual resolution | Automatic class-specific resource logic and individual ability/trait/trigger execution, including turn-start Ferocity |

Shared UI/palette/slash/headless operations, authority/privacy, pause/closure, once-only commitment and
recorded-state continuity remain cross-cutting requirements. The detailed decisions below explain
each boundary. Content coverage remains narrow; this checklist does not require all ordinary creatures
or all of their mechanics to be automated.

### Combat opening — confirmed for v0.01

Review answer, 2026-09-13: the user accepts the full already-designed opening flow as a v0.01
requirement. Follow [the owning opening contract](table-spec.md#confirmed-initiative-setup-and-shared-presentation):

- A staged game-log setup card lets the Director select participants, surprise and initiative groups.
- Director **OK** commits the encounter, captures its precombat gameplay baseline and applies the
  party-roster and character-edit locks before initiative.
- Use the shared initiative roll when required, followed by the starting-side choice; preserve the
  existing surprise-determined path and player/Director/observer authority.
- Cancel before OK discards draft setup choices. Abandoning after OK uses **Void: keep current state /
  restore starting state**, including before the first turn.

Acceptance must demonstrate that sequence and both cancellation boundaries through the shared table
operations, with the existing ordered log, privacy and retry semantics. This confirms delivery scope;
it does not settle remaining source-specific combat-start effect ordering. Void while paused is also
included by the later scope decision below. Common-operation integration contracts remain open.

### Ordinary creatures and turns — confirmed for v0.01

Review answer, 2026-09-13: the user accepts ordinary heroes and foes for the combat milestone:
one initial initiative group per creature, Director regrouping, explicit **Take turn / End turn** and
the settled action tracking. Table controls retain their shared palette/slash/headless operations.
Use [the group contract](table-spec.md#initiative-groups-confirmed-app-model) and
[sheet action tracking](table-spec.md#player-sheet-actions-and-explicit-end-turn), including advisory
spent-action indicators and explicit turn ending.

**Deferred beyond v0.01:** minion squads, captains and pooled Stamina; boss extra-turn mechanics; and,
at the user's explicit addition, dynamic terrain objects. Existing designs and research remain future
work. This does not require every ordinary hero or foe to be supported: the narrow sourced content
coverage of the first journey remains.

### Targeting — confirmed for v0.01

Review answer, 2026-09-13: include the settled roster targeting controls for self, single-target and
multi-target abilities. Follow [the owning targeting contract](table-spec.md#roster-targeting-controls),
including its auto-fire/explicit-fire behavior, selection clearing, visibility and shared-operation
boundaries. This is a milestone decision, not a change to those interactions or an expansion of
automated ability coverage.

**Deferred beyond v0.01:** persistent area-effect cards with ongoing membership and repeated effects.
Their existing design remains future work. This deferral does not remove ordinary multi-target
selection. Unique ability mechanics are manually resolved under the current runtime scope.

### Ability costs — confirmed for v0.01

Review answer, 2026-09-13: require automatic deduction of applicable fixed ability costs, the
insufficient-resource execution block and visible spending in the game log. Follow
[the owning cost contract](table-spec.md#ability-costs-and-optional-spending): pay on execution,
not selection; honor applicable source payment rules; enforce affordability for both players and
Director invocations through shared operations; and prevent duplicate deductions on retries.

**Deferred beyond v0.01:** optional enhancement cards for choosing extra spending and its additional
effects. This is a delivery deferral, not permission to choose an enhancement automatically, waive
its cost or claim an unsupported enhancement was applied. Unique conditional/source-specific spending
is manual under the current runtime scope; common fixed-cost input/commit contracts remain necessary.

### Damage and corrections — confirmed for v0.01

Review answer, 2026-09-13: automatically apply supported damage and update Stamina/winded displays
on character sheets and foe stat blocks. Retain logged manual Stamina adjustments through the
existing authorized shared operations. These are live-state changes under existing session,
privacy and history boundaries, not edits to the character build.

**Later exception, 2026-09-14:** per-target post-roll Add edge/Add bane controls are included,
using the existing correction/history contract. Keep target-completion auto-fire. This supersedes
the modifier-editor deferral only for these additions.

**Deferred beyond v0.01:** broader inline attack-result editing, including direct damage editing. The fuller [result-correction contract](table-spec.md#director-edits-to-inline-results)
remains future work. Manual Stamina adjustments are new recorded operations; they do not rewrite the
attack or bypass historical-edit restrictions. Later G5 decisions defer hero-dying automation and
require ordinary foes to show Slain at zero Stamina. Damage-modifying response reconciliation is deferred
under the response scope below; F3 remains future work.

### Clock and saves — confirmed for v0.01

**Current scope refinement, 2026-09-14:** simple condition toggles use manual save rolls through
ordinary dice controls and manual removal. Automatic save scheduling/removal for those toggles
is deferred until ability support provides timing. This supersedes the earlier blanket automatic-
save acceptance for manually tracked conditions; turn/round clock work and other supported
scheduled operations remain included. The earlier source/clock contract below remains applicable
when an actual supported effect supplies its timing.

Review answer, 2026-09-13: include turn/round timing and automatic end-of-turn save-ends rolls,
with results applied to live state and recorded in the game log. Follow
[the owning clock contract](table-spec.md#game-clock-and-scheduled-rules-work), including actual
turn/round boundaries, due work in enqueue order, save-ends rolls last and the confirmed save-phase
inclusion policy. This does not require every scheduled mechanic to be automated.

**Deferred beyond v0.01:** the optional **Spend hero token** follow-up after a failed save. Its
fuller-product behavior remains specified; optional spending is not performed automatically.
Malice's common lifecycle remains included; automatic class-specific Ferocity generation is deferred
by the 2026-09-14 runtime-scope revision.

### Undo and redo — confirmed for v0.01

Review answer, 2026-09-13: require the full settled sequential gameplay undo/redo model for the
delivered combat slice. Follow [the owning history contract](table-spec.md#undo-permissions-and-proposed-campaign-control):

- Players undo their character's uninterrupted latest actions in reverse order, stopping at the nearest
  other-character action, committed Director correction or turn-start boundary. Existing control,
  session and Enable user undo policies apply.
- The Director can rewind sequentially across those seams within the current encounter; completed
  encounter archives and closed sessions remain outside gameplay rewind.
- Automatic consequences restore with their cause. Verify damage, costs, applicable clock effects
  and associated bookkeeping together, rather than reversing only the visible Stamina value.
- Redo restores recorded state and dice exactly. New gameplay after undo clears the available redo
  path while retaining abandoned history; new execution uses current conditions and fresh dice.

This confirms a milestone requirement for supported operations, not delivery of deferred mechanics,
inventory/build-history interfaces or every unresolved response/continuation case.

### Combat closeout — confirmed for v0.01

Review answer, 2026-09-13: require the settled formal closeout flow for the delivered combat slice.
Follow [the owning closeout contract](table-spec.md#formal-encounter-closeout):

- Director **End combat** ends structured turn play and closes unused optional combat responses.
  It does not manufacture a final turn/group/round boundary or the ordinary work due at one.
- Complete already-required resolution before rewards/cleanup and present applicable cleanup choices.
  Preserve source-required ending work and the distinction between required and optional effects.
- The Director confirms Victory awards using the existing amount/recipient controls; the initial
  value is not an automatic award.
- Director **Finish cleanup** closes unused optional cleanup choices, archives the encounter and
  returns to FreePlay. Required resolution must be complete; archived gameplay cannot be reopened by undo.

Inventory and loot remain deferred. Source-specific ending behavior still needs its bounded contracts;
this acceptance requirement does not authorize inventing those outcomes. Void retains its separate
keep/reset procedure, including while paused as confirmed below.

### Void while paused — confirmed for v0.01

Review answer, 2026-09-13: include the settled Director **Void: keep current state / restore starting
state** operation while the session is paused. This supersedes the readiness audit's proposed deferral.
Void applies the selected keep/reset outcome, skips ordinary rewards/cleanup and archives the encounter.
The session remains paused, both rosters remain locked and ordinary gameplay remains blocked until
resume. Preserve the distinction between released combat locks and the continuing pause roster lock.

Use the existing Void snapshot and history contract through the shared table operations; resuming
gameplay is not a prerequisite for abandoning the encounter. The inventory/loot deferral remains.

### Respite and fictional time — deferred beyond v0.01

Review answer, 2026-09-13: defer the dedicated respite workflow and out-of-combat fictional-time
systems, including tracking durations and ability reuse between fights. The basic noncombat table
remains available before and after combat under existing session permissions.

This does not defer the confirmed combat turn/round clock or encounter closeout. Preserve actual
recorded state through combat transitions and identify unsupported out-of-combat timing honestly;
the deferral does not authorize invented resets, expired effects or free ability reuse. Fuller respite
and FreePlay timing contracts remain future work.

### Response reconciliation — deferred beyond v0.01

Review answer, 2026-09-13: defer automatic reconciliation for responses that revise an already-applied
outcome, such as Lines of Force redirecting movement and reversing dependent collision consequences.
Retain readable source text and recorded manual resolution under existing authority, dependency and
history boundaries. Do not claim that dependent consequences were automatically repaired when they
were resolved manually or remain unresolved.

The fuller apply-then-revise design remains future work. This defers that automation, not all triggered
actions or the confirmed sequential undo/redo model. Source-specific response coverage remains part
of the bounded ability contracts; F3 must be resolved before damage-modifying response reconciliation
is automated.

### Direct tests and source log — confirmed for v0.01

Review answer, 2026-09-13: require a basic direct `/test roll` showing public dice, modifiers and
total, with the Director interpreting the result. More elaborate automated test workflows are
deferred beyond v0.01. Generic Director test requests remain deliberately excluded; this does not
reintroduce a request-card flow. Source-specific test steps within supported actions need their own
bounded contracts; no automated outcome is claimed from a context-free total.

The existing v0.01 log requirement remains: make every used action's complete verbatim source text
available in its game-log entry, including partial/manual uses. Show actual recorded work and distinguish
applied, manually resolved and unresolved effects under existing privacy boundaries. This carries
forward [the confirmed principles](rules-adaptation-principles.md#show-the-source-and-the-work), rather
than establishing a new ruling or exposing whole monster stat blocks.

## v0.01 combat automation decisions

The [combat automation boundary](fury-goblin-automation.md) reflects the 2026-09-14 game-basics-first
revision: shared mechanics remain in scope; class/stat-block-specific execution is deferred. The
earlier answers below retain their dates and are superseded where explicitly noted.

Historical answer, 2026-09-13 — **superseded for v0.01 on 2026-09-14**: automatically roll 1d3 Ferocity at each actual Fury turn start, add it and
log the source-linked grant through the shared clock. Authorized turn-boundary rewind/redo restores
the grant with its cause under the existing history limits. See [the contract](fury-goblin-automation.md#turn-start-ferocity).
All automatic Ferocity lifecycle/trigger work is now deferred; Malice remains confirmed below.

Review clarification, 2026-09-13: Victories must follow the rules, without artificially inflating
numbers for the test. The Director can manually edit number fields inside the encounter; preserve
attribution and the distinction from earned awards. See [source and scope notes](fury-goblin-automation.md#victories-and-numeric-adjustments).
The later clarification below resolves which numbers are meant. That correction did not itself
accept Malice automation; the subsequent explicit acceptance is recorded below.

Follow-up clarification, 2026-09-13: apply this rule to every resource. Automatic calculations use
the actual rules and recorded state; do not alter formulas, add artificial grants or silently prefill
resources for testing. Any needed adjustment is an explicit, logged Director edit inside the encounter.

Resolved clarification, 2026-09-13: the Director edits persistent Stamina, Recoveries, Heroic Resources,
Malice and Victories on sheets, stat blocks and resource displays. Each field has its own rules and
lifecycle. Committed edits update live state and append **Manual adjustment** log entries with
Director attribution and before/after values. Edges/banes and other roll-local artifacts are separate;
the persistent game log has editable inputs only through case-specific interactive cards. The inline
attack-result editor deferral remains. See
[the owning contract](table-spec.md#persistent-values-and-manual-adjustment-entries).

Review answer, 2026-09-13: include automatic Malice combat-start grants, round-start gains and
normal encounter-end clearing according to the pinned rules and actual recorded state. Preserve
Director manual editing of the persistent pool with separate Manual adjustment entries, existing
visibility and authorized history behavior. See [the sourced lifecycle contract](fury-goblin-automation.md#malice-lifecycle).
This does not automate optional Malice spending or every monster ability.

Review answer, 2026-09-13: defer automatic hero-dying behavior beyond v0.01, including dying-triggered
bleeding and the proposed Catch Breath warning. Retain Stamina recording, winded display, readable
rules and logged Director adjustments for manual resolution. Do not replace the deferred behavior
with automatic hero death/defeat at zero or clamp away negative Stamina. See
[the scoped decision](fury-goblin-automation.md#hero-dying). Other ability/condition automation remains separate.

Review answer, 2026-09-13: an ordinary foe reaching zero Stamina automatically shows **Slain**.
Retain its roster entry until normal cleanup or Director removal, following existing visibility,
defeated-roster EV and recorded undo/redo behavior. This does not automatically end combat or grant
Victories, and the hero-dying deferral remains. Death versus knockout can remain table adjudication
as proposed; no automated knockout workflow is added. See
[the scoped contract](fury-goblin-automation.md#ordinary-foes-at-zero-stamina).

## Confirmed v0.01 scope by feature

| Feature | Included now / required foundation | Deferred beyond v0.01 | Owning specification |
| --- | --- | --- | --- |
| Accounts | Sign-up, sign-in, sign-out; authentication and authorization for exposed features | Profile editing, password recovery, account deletion | [Access](accounts-and-access-spec.md#1-current-implementation-and-scope) |
| Campaign participation | Creation, invitations, membership; campaign creator serves as Director | Friends system; appointing another Director | [Access](accounts-and-access-spec.md#1-current-implementation-and-scope) |
| Character control | Players control their own admitted characters; Director can act for table characters under existing restrictions | Player-to-player character-control sharing | [Access](accounts-and-access-spec.md#1-current-implementation-and-scope) |
| Character wizard | Complete minimal level-one creation path and reopening/editing outside combat; existing review, effective-build isolation and locks | Leveling up and higher-level creation/editing coverage | [Characters](character-wizard-spec.md#1-product-outcome-and-scope) |
| Build revisions | Record saved build revisions and preserve them through save/reload | Interface for browsing/restoring earlier builds | [Build history](character-wizard-spec.md#5-progression-history) |
| Forge Steel interchange | Design the character model for future adapters without rebuilding the wizard; retain build/authored/live-state separation and scoped content identities | Import/export implementation, file UI and round-trip delivery | [Characters](character-wizard-spec.md#8-content-and-forge-steel-compatibility), [research](forge-steel-interchange.md) |
| Foes and preparation | At least one catalog stat block loaded as an independent ordinary live foe | Saved-encounter authoring, duplication and template loading; minion squads/captains/pooled Stamina, boss extra-turn mechanics and dynamic terrain objects | [Catalog](monster-catalog-spec.md#confirmed-requirements-and-proposed-first-scope), [combat scope](#ordinary-creatures-and-turns--confirmed-for-v001) |
| Inventory | Preserve the boundary between character builds and future item ownership; sourced build contributions remain | Entire inventory system, including starting-equipment item creation, equipment management, party inventory, stash/claims, loot and inventory history | [Inventory](inventory-spec.md#pre-alpha-scope) |
| Table and history | Session start, hero/foe rosters, basic combat journey, basic noncombat table and a visible game log; table performance remains a priority | Campaign text chat; dedicated respite workflow and out-of-combat fictional-time systems | [Table](table-spec.md), [combat scope](#v001-combat-acceptance-checklist) |
| Rules reference | Readable text for the heroes, foes and abilities used, under existing table visibility rules | Standalone searchable rules library, explicitly a separate feature | [References](reference-library-spec.md#confirmed-pre-alpha-scope) |
| Presentation | Desktop, temporary UI proving real workflows; shared behavior independent of screen layout | Mobile/tablet layouts and finished visual polish | [Technology](v1-tech-stack-spec.md#1-decision-status-and-product-constraints) |

Deferral removes a delivery gate, not the fuller design requirement. In particular, future import/export
must fit the character architecture, ownership must remain distinct from action authority, and saved build
revisions are separate from gameplay history. No unused inventory machinery or converter is required now.

Features not covered by these answers are not silently included or deferred. Remaining scope questions
include blocking, campaign deletion, character detachment/duplication and public Items browsing.
Some already have fuller-product policies; their prototype depth is distinct from those settled policies.
The remaining-gaps table identifies when unresolved behavior matters to the selected journey.

## How to use this queue

- **Missing decision:** user intent or a product tradeoff is needed.
- **Confusing boundary:** existing concepts or statements need a precise distinction or consistency fix.
- **Research:** investigate pinned rules/source code or demonstrate behavior; do not ask the user to supply
  ordinary rule definitions or certify each mechanic.
- **Engineering:** propose and verify a concrete contract once its product boundaries are known. Exact tables,
  libraries, codecs, and package layouts ordinarily belong here.

A gap blocks only the work that depends on it. An unfinished future capability is not automatically a
pre-alpha blocker. Each selected component should have a small demonstrable behavior, explicit inputs/outputs,
and a clear account of unsupported behavior. Logical components do not imply separate deployments.

## Proposed component ownership map

This decomposition is for discussion. The table's place inside this app and its performance priority are
confirmed, as is the separate rules-search feature. Exact internal module boundaries remain engineering
proposals. The map covers the fuller architecture; the scope table above controls prototype delivery.

| Component | Proposed ownership | Boundary to make explicit |
| --- | --- | --- |
| Content and catalogs | Source-qualified definitions, readable text, references, revisions, search and coverage; Foes is a catalog within this system | Definitions versus loaded live instances; shared conventions across Rules, Foes and Items |
| Rules reference/search feature | Standalone rules browsing and search, explicitly a separate feature and deferred beyond v0.01 | Consumes shared content; table reference text and catalog-to-roster loading do not depend on this feature |
| Parser/compiler | Source adapters, supported language, compiled mechanics and diagnostics | Compiled representation accepted by the engine; parsing time versus play time |
| Rules engine | Deterministic interpretation, legality, effects and missing-fact/choice requests | Supplied state and facts; no UI, account or database ownership |
| Character system | Choices, builds, derived baseline, drafts, review integration, progression and import | Wizard presentation versus shared evaluation; effective build versus live play values |
| Game operations | Authoritative play commands, session/combat lifecycle, manual resolution and state/history coordination | Pure engine outcomes versus authorized committed changes |
| Table surface | Interactive play, sheets, prompts, foes controls, visible game log and dice presentation inside this app; chat is deferred | Uses the same operations as the headless client; dedicated attention to sustained performance and interaction quality, without a standalone/embedding requirement |
| Inventory system | Individual items, locations, equipment, claims and transfers | Item-derived contributions versus gameplay use; transfer and restoration dependencies |
| App and access | Accounts, campaigns, membership, roles, grants, discovery and navigation | Current authorization across all operations and audience projections |

History is a cross-component contract: gameplay, progression and inventory have distinct restoration scopes.
Common recording machinery is a proposal, not permission to merge those histories or rewind access changes.
Shared dice generation and optional 3D presentation also require distinct responsibilities; whether they need
separate packages is an engineering choice.

## Remaining gaps by discussion chunk

This is a checkpoint of the original 13 chunks, not an active questionnaire. Confirmed scope is consolidated
above. Combat-dependent portions of chunks 6–10 are now active under the table's baseline discussion.
A missing contract blocks its dependent
behavior, not every other component; do not infer prototype scope from a fuller-product example.

| Chunk | Status and remaining information | Next useful artifact when work resumes |
| --- | --- | --- |
| 1. First useful prototype | **Scope answered:** the connected campaign-to-combat journey and narrow content coverage. | End-to-end acceptance scenario using the confirmed steps; do not ask the user to restate the goal. |
| 2. Component responsibilities | **Intent answered; engineering remains:** reusable engine, integral table, separate rules-search feature, replaceable UI. | Internal ownership and dependency contracts for content, parsing, evaluation, operations and presentation; package boundaries are engineering choices. |
| 3. Versions and prototype data | **Policy answered; engineering remains:** disposable development data with distinct engine/parser/content/schema identities. | Version metadata and a bounded reset/reseed path; normal persistence remains correct within a running version. Old prototype compatibility is not a gate. |
| 4. Content and catalog slice | **Scope answered; research/engineering remains:** one or more sourced foes, readable table text, no saved templates or standalone rules search. | Representative content, catalog-to-live-instance loading, source fidelity and explicit unsupported diagnostics. Public Items browsing has no independent prototype scope decision. |
| 5. Character slice | **Scope answered; research/engineering remains:** minimal level-one wizard, editing, saved revisions and compatibility-aware model. | Legal fixture choices/dependencies, derived values, saved selections reopening, and effective-build review behavior through shared operations. Live-resource reconciliation remains in chunk 10. |
| 6. Parser and engine slice | **Scope answered 2026-09-14 (game basics first); engineering remains:** shared mechanics are automated, class/stat-block-specific execution is deferred; spatial facts are supplied by the first client. **Engineering:** compiler/engine boundary and common-operation input contracts. | Supported, partial and unsupported action examples with required inputs, outcomes and diagnostics; source research should identify reusable constructions. |
| 7. Manual play and pending work | **Active, unresolved:** who supplies missing facts/effects, sequencing, cancellation, resumption and concurrent work. | One mixed automatic/manual action identifying costs/dice already accepted, pending effects and prevention of double application. |
| 8. Table and combat slice | **Baseline decisions recorded:** opening commitment, groups/transfers, sheet controls, targeting, persistent cards (deferred beyond v0.01) and ordinary clock flow. Source-specific action/response sequencing remains open. | A sourced action/response walkthrough and remaining cases in the owning table checklist. |
| 9. Undo and continuation | **Core policy answered; details remain:** sequential player undo up to nearest action seam and turn/FreePlay outer bound, Director sequential encounter rewind, recorded redo, appended reversals and new-play branching. | Same-turn dependency and undo-unit examples; preserve recorded boundary outcomes. Saved build revisions are already included; build-history UI and all inventory history are deferred. |
| 10. Resources and respite | **Costs/affordability answered; source lifecycles remain:** fixed costs debit at execution, optional pre-resolution spending uses cards and unaffordable abilities are blocked. Conditional costs, build/live-state reconciliation, FreePlay reuse and respite still need contracts. | Source-specific resource-lifecycle examples; advancement-specific questions remain deferred with leveling. |
| 11. Items and loot | **Deferred:** entire inventory system. | Resume item-authority, mechanics, claims and history work when this subsystem returns to scope; no prototype inventory workflow is needed. |
| 12. Access and lifecycle exceptions | **Core scope answered:** basic accounts, campaign invitations/membership, creator as Director, owner/Director control. **Settled in fuller specs:** blocking/deletion/departure policies and current-member historical reads. **Open:** forced-access-change recovery, private-history projections and remaining sign-in/session implementation details. | Transitions and authorization for exposed operations. Settings/recovery/account deletion, friends, character-control sharing, delegation and chat are deferred; combat recovery remains parked. |
| 13. Integration and readiness | **Presentation answered:** desktop and temporary UI. **Engineering:** retries, bounded queries/resources and performance. **Open:** representative group size and recovery acceptance depth beyond ordinary persistence. | Connected desktop demonstration plus relevant boundary/failure checks. Normal save/reload/reconnect is already required; a final soak-test duration or numeric performance budget is not settled. |

Creature rulings checkpoint, 2026-09-13: see [the audit](spec-consistency-review.md#latest-rulings-checkpoint)
and [remaining table contracts](table-spec.md#8-continue-exploring). Entry count/EV, captain bonus loss/gain,
non-area exhaustion, personal extra turns and shared-clock counting are settled. Manual live split/merge
is excluded. The next numeric cases are partial damage after stat adjustment, a pool floor, and area
exhaustion while outside-area members survive. No interpretation is selected merely by this checkpoint;
these cases resume with minion squads, which are deferred beyond v0.01. Source-specific squad exceptions
and terrain scope remain separate from the ordinary-monster prototype.

## Research and engineering work to keep off the user questionnaire

These tasks become necessary when their dependent slice is selected; the queue does not authorize backend or
rules implementation by itself.

- Audit core sources and recover book-specific content where unified paths point to supplemental chapters.
- Verify the mechanics needed for the selected fixture against the pinned corpus. Respite, broader monster
  categories and item mechanics follow their own scope; do not make their research prototype prerequisites.
  Surface only ambiguities that remain after contextual research.
- Use existing Forge Steel research to check the character-model boundary now. Exercise real imports and
  round trips when adapters are implemented; file extensions and static counts do not prove compatibility.
- Propose input/output schemas with complete, partial, unsupported and failed outcomes. Establish independent
  engine execution and persisted application readback through the same operations used by the table.
- Choose implementation details using measured examples: engine runtime/integration, packages, bounded data
  access, history storage, compatible auth packages and graphics fallback. Selected Convex/Better Auth and
  hosting direction are already recorded; do not reopen those choices without a concrete new reason.
- Coordinate with the UI work in the other thread before treating an interface as implemented or replacing
  its contracts. Source distribution/attribution and actual delivery configuration remain work for shipped
  material, not user questions about individual rules.

## Documentation ambiguities and corrections

| ID | Evidence | Treatment |
| --- | --- | --- |
| D1 | Fuller V1 feature lists were easily mistaken for v0.01 gates, and repeated additions obscured the accepted scope. | Consolidated the prototype scope above; linked it from the V1 index and owning specs. Preserved fuller requirements separately. |
| D2 | [Table acceptance](table-spec.md) contained a between-session foes-roster prohibition despite the confirmed anytime permission in the same spec. | Corrected the stale acceptance example to the existing permission. No new product decision. |
| D3 | [Rules-language proof](rules-language.md#first-proof-of-feasibility) still described selecting the first experiment. | Linked the completed milestone and retained the proof criteria as the historical scope. Do not repeat completed feasibility work. |
| D4 | [Storage research](data-storage-analysis.md) called closed-session live undo unresolved. | Clarified its historical status and the current prohibition; its older cross-session activation proposals are not current requirements. |
| D5 | Tower mode and general object sharing are planned/proposed, with incomplete delivery commitments; pack authoring and other future work appear beside current contracts. | Keep desired behavior separate from prototype inclusion. Ask about a feature's inclusion only when it affects the selected scenario; do not expand scope from an illustrative acceptance case. |
| D6 | Proposed component boundaries and technical defaults can look like accepted decisions once copied into several documents. | Keep the map and technical contracts proposed. Owning specs retain detailed behavior; this page indexes scope. |
| D7 | Delivery/verification guidance still demanded early advancement, friends, chat, inventory and mobile UI. | Aligned immediate sequences and desktop checks with the accepted slice; retained fuller acceptance examples for later delivery. |
| D8 | The queue still had an unanswered combat-transition prompt and stale open-scope language for answered topics. | Recorded the user-requested checkpoint, removed the pending prompt and kept combat explicitly deferred. |
| D9 | After combat discussion resumed, historical deferral language, repeated decision summaries and a hard-sounding Take turn eligibility clause obscured current intent. | Consolidated current decisions and gaps, marked discussion active, preserved warned rule departures, and kept group timing and deferred ally support distinct from accepted grouping. |

## Discussion record

This historical answer trail supports the consolidated scope above; it is not a second task list.

- Confirmed: architectural foundation, explicit components and partial subsystem completion are the immediate
  pre-alpha objective.
- Answer 1: the connected campaign-to-combat journey above is confirmed; breadth across its components matters
  more than full ability parsing or full subsystem coverage.
- Fixture clarification: level one, devil ancestry, Fury class. Other build choices remain unspecified.
- Answer 2: minimal wizard, with every applicable character-creation step and potentially only one supported
  option or valid selection set per step. Prepared-character loading alone is insufficient.
- Answer 3: the table belongs to this app; its distinction is live gameplay and the priority given to
  performance/interaction quality, not standalone delivery or embedding. Technical treatment follows need.
- Answer 4: development data is disposable; keep the latest version live and playable. Branch development
  comes once a working app should be protected from disruption. Prototype migration compatibility is not a
  prerequisite; ordinary save/reload/reconnect and history behavior remain required.
- Answer 5: continue deferring combat mechanics for a dedicated, in-depth discussion. The turn/action
  enforcement question is parked and unanswered; the assistant's recommended split was not accepted.
- Answer 6: saved encounters can be deferred beyond v0.01. Use direct catalog-to-roster additions for the
  first journey; this does not defer live combat or decide loot scope.
- Answer 7: defer the entire inventory system, including the starting-equipment inventory workflow. Keep
  character build choices distinct from future item ownership; inventory is not a pre-alpha gate.
- Answer 8: defer the separate friends system; campaign invitations and membership remain required.
- Answer 9: defer import and export implementation, but design for compatibility now. Adding those adapters
  later must not require rebuilding the wizard; existing source research informs the shared character model.
- Answer 10: include reopening/editing saved characters in the same minimal wizard outside combat. Existing
  review, effective-build isolation and locks apply.
- Answer 11: record saved character-build revisions in v0.01; defer the interface for browsing and restoring
  earlier builds. This does not settle combat history or require recording every unfinished wizard interaction.
- Answer 12: players control their own characters and the active Director can act for any table character;
  defer player-to-player character-control sharing beyond v0.01. Existing eligibility and gameplay restrictions
  remain; acting authority does not transfer character ownership or build-edit permission.
- Answer 13: focus on desktop for now; all current UI is temporary, intended to prove concepts. Finished
  presentation and mobile/tablet layouts are not prototype gates. Preserve the architecture behind the UI
  and the established table-performance priority.
- Answer 14: the campaign creator serves as Director in v0.01; appointing another Director is deferred.
  Preserve the distinction between campaign ownership and the Director role for later delegation.
- Answer 15: defer campaign text chat and focus on the visible game log for v0.01. Recorded gameplay
  activity must be visible at the table; this does not settle the deferred combat-history mechanics.
- Answer 16: standalone rules search/reference browsing is a separate feature and deferred beyond v0.01.
  Relevant hero, foe and ability reference text remains available at the table; catalog-to-roster loading
  remains required. Separate feature ownership does not imply a separate application or deployment.
- Answer 17: leveling up is deferred beyond v0.01. Prototype character creation and editing stay at level
  one; saved build revisions and the shared evaluation model remain foundations for later progression.
- Answer 18: include basic sign-up, sign-in and sign-out; defer profile editing, password recovery and
  account deletion beyond v0.01. Authentication and authorization remain required for exposed features;
  blocking and campaign membership-management scope are not independently settled by this answer.
- Checkpoint request: review and organize the accumulated design work, align the specifications, and stop
  here. The user is not ready for the dedicated combat discussion. No question remains pending and no
  implementation is authorized by this checkpoint.

- Resumed discussion: accepted a bounded source-research and independent-review workflow for trial, with
  tooling still to be built. Confirmed warn-without-blocking for game-rule conflicts, Director adjudication,
  player trust, faithful automation, complete verbatim used-action text in the shared log, visible workings,
  and recorded manual play. See [principles](rules-adaptation-principles.md). Detailed combat sequencing
  remains deferred; these decisions do not start implementation.

Primary references: [engine](engine-architecture.md), [rules language](rules-language.md),
[table](table-spec.md), [characters](character-wizard-spec.md), [catalog](monster-catalog-spec.md),
[references](reference-library-spec.md), [inventory](inventory-spec.md),
[access](accounts-and-access-spec.md), [data](data-architecture-spec.md),
[technology](v1-tech-stack-spec.md), and [playtest findings](playtest-1.md).

Review answer, 2026-09-13: explicit Redo restores the recorded action and dice unchanged. Executing
anew after undo resolves current conditions with fresh dice, including End turn and round-boundary work.
This supersedes the earlier same-boundary reuse and changed-effect reconciliation rules: no separate
roll cache or condition-comparison mechanism. The Director can adjudicate reroll abuse using existing
correction controls; historical-edit rewind requirements remain. Original outcomes stay in history.
