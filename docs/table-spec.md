# Campaign sessions and the table

Version 0.51 — rules adaptation philosophy, 2026-09-11. Specification only; no implementation.

This is the primary checkpoint for session participation, the table's role-dependent surfaces, and the core
play loop. **Confirmed** behavior comes from the user's table walkthrough. **Proposed** contracts and **open**
questions are identified separately. The combat sketch expresses intended workflow; mechanics must follow
verified Draw Steel rules rather than treating the sketch as a rules variant.

Related specifications: [access](accounts-and-access-spec.md), [characters](character-wizard-spec.md),
[data/history](data-architecture-spec.md), [monster catalog](monster-catalog-spec.md),
[dice](dice-roller-spec.md), [engine](engine-architecture.md), and [v1 tech stack](v1-tech-stack-spec.md).

**Immediate milestone:** the [v0.01 checkpoint](pre-alpha-design-gaps.md) controls feature delivery. Use a
temporary desktop UI with a visible game log, a minimal hero and direct catalog-to-foes-roster loading.
Campaign chat, saved encounter templates and inventory/loot are deferred. The creator serves as Director;
player-to-player character-control sharing and Director delegation are deferred. Relevant table text remains
readable under existing visibility rules. Broader surfaces and acceptance examples below describe V1, not
automatic prototype gates. Combat mechanics remain deferred for their dedicated discussion.

## Sustained use and realtime requirements

Confirmed pre-alpha clarification: the table is the live gameplay surface within this application. The user's
video-game analogy distinguishes the gameplay viewport from menus, character creation and other setup
screens. It does not request a standalone table project or embedding in other applications, nor introduce a
digital-map requirement. Give table performance and interaction quality particular attention from the first
prototype. Any special technical treatment should follow its actual workload; this distinction alone does
not select a different stack, runtime or deployment. The standalone rules-engine intent remains separate.

Confirmed technology-discussion clarification: the app serves phones, tablets, and desktop. The table is its
primary realtime multiplayer surface and the place users remain for two-to-six-hour sessions. The core
workload is campaign chat, reading effective character sheets, choosing abilities, Director monster and
encounter management, and inventory/loot. Full character building and full reference browsing are mostly
separate individual workflows, although the table includes Director search/add and relevant rules reading.

The table must stay responsive without routine performance-driven hard refreshes that hold up the group.
Users should promptly see consistent accepted actions; presentation on a slow device must not hold up others.
The [tech spec](v1-tech-stack-spec.md#9-verification-and-acceptance) proposes bounded client resources,
subscription lifetimes, independent animation, and a six-hour multi-client acceptance exercise. This does not
change visibility, permissions, session persistence, or the deferred action-resolution contracts below.

## Terminology: encounters and structured table states

Confirmed v1 mode scope: combat, free play, and a dedicated respite flow are included; respite is core
gameplay. Dedicated montage-test and negotiation flows, and downtime-project tracking, are excluded from v1.
Earlier descriptions of montage/negotiation as distinct structured states describe future design, not required
v1 modes. Their core reference text remains in scope. Research respite rules before designing its detailed
lifecycle; downtime-project integration is not a v1 prerequisite.

The user clarified that the core rules use **encounter** for combat, montage tests, and negotiations. The
table has distinct structured states for **combat, montage tests, negotiations, and respite**, each with its
own gameplay loop. Future montage tests are designed as a dedicated mode started and ended by the Director;
negotiations likewise have a distinct future structured state. Both flows are outside v1. Respite remains its
own loop, without asserting that the rules classify it as an encounter. Detailed mechanics still require
source research before implementation.

Earlier unqualified uses of “encounter” in this walkthrough describe **combat encounters**, including the
party/sheet locks, initiative, monster selection, rewards, and void/reset procedures. Do not automatically
apply those combat contracts to montage tests, negotiations, or respite merely because they share terminology.
The broader rules category need not dictate a shared table UI or identical lifecycle. Saved encounters retain
monster selections, the party-strength calculator setup, and rewards-stash preparation; preparation for other
encounter types is outside v1.

## Discussion boundary: action economy deferred

Latest clarification: [rules adaptation principles](rules-adaptation-principles.md) now settle the general
enforcement policy. Trust table participants: warn about game-rule conflicts without blocking an otherwise
authorized player or Director operation, and make departures visible to the Director. Allow recorded manual
adjustment of mechanical inputs and effects. Every used action provides its complete verbatim source text
through the shared log, together with actual resolution steps and unresolved work. Exact controls, action
budgets, timing, interruption, manual completion and undo dependencies remain for the dedicated discussion.

Pre-alpha clarification, 2026-09-11: the user now requires the physical interaction steps of basic combat
action economy in the first connected v0.01 journey, without complete ability parsing. Follow the
[clarification queue](pre-alpha-design-gaps.md#confirmed-first-acceptance-journey) for the walkthrough and
component scope. The detailed timing, warning presentation and interruption decisions remain unanswered; this
milestone requirement does not approve a particular resolution design or authorize implementation.

The earlier pre-alpha walkthrough deferred combat mechanics for a dedicated, in-depth conversation.
Warn-without-blocking is now confirmed; automatic tracking depth and manual interaction still need design.

The user explicitly deferred detailed action economy to its own separate, substantial workstream. This
includes action budgets and substitutions, triggered-action opportunities/prompts, timing and interruption
sequencing, and detailed resolution behavior. The question about automatically pausing resolution to prompt
for a triggered action is unanswered and deferred; no default was accepted.

Retain the confirmed high-level encounter loop, player Take turn control, Director table authority, roster
lock, and normal/void encounter exits. Existing source notes and proposed contracts below remain useful inputs
for the later workstream, not completed action-economy design. This is a deferral of the current exploration,
not a decision to omit required rules support from v1 or authorization to implement that workstream now.

## 1. Campaign → session → table

Confirmed:

- A campaign connects players and content and is the day-to-day hub once a player has an active campaign.
- A campaign contains distinct play sessions. Only one session may be active at a time within that campaign.
- The active Director starts a session when ready to run the game. A closed session becomes a historical
  record of play.
- The table is the realtime play surface inside a session. This supersedes the earlier conceptual model in
  which a persistent table contained successive sessions. Physical database records remain undecided.
- A session can be paused, freezing gameplay. Pausing and ending a session are different operations.
- The table remains running until explicitly paused or closed, regardless of who is connected. Director
  disconnection, all players leaving, or zero connected clients never automatically pause or close the
  session. Returning clients reconnect to its existing lifecycle and state.
- Sheet access and chat remain available at any time, including while paused and outside a session, subject to
  existing access permissions. Gameplay actions that change game state are blocked while paused or without a
  running session. Reading a sheet does not grant permission to change its live values. Inventory management
  is classified as character data: authorized character/party inventory transfers are available between
  sessions, without creating an exception to the gameplay-action block.
- Combat encounters are the most important and complex play mode. Respite is a confirmed dedicated table mode
  with a self-contained gameplay loop started and ended by the Director. Montage tests and negotiations are
  future structured states outside v1; each included mode's mechanics require further research and design.

Proposed lifecycle representation: retain `open`, `closing`, and `closed` for persistence/archiving, with
`running` or `paused` inside an open session. A paused session occupies the same campaign session slot and
retains its underlying mode and encounter state; resuming does not start a new session or reroll initiative.
Do not allow a second session while the previous one is closing. These are implementation proposals supporting
the single-session requirement.

Confirmed for v1: **closed sessions are permanently read-only**. They cannot be reopened for further play or
live undo; further play happens in a new session. Preserve their detailed history for reading and analysis.
This resolves the earlier open question about reactivating closed sessions. Closing a session with an active
encounter voids that encounter and presents the same keep-current-state or restore-starting-state choice as
explicit voiding. The encounter cannot continue into another session. Pausing does not close or void it, and
there is no encounter duration limit. The same encounter may continue after an arbitrarily long pause within
its still-open session.

### Reading session history

Confirmed: **all current campaign members can read all past session logs by default**, including sessions they
did not attend. Attendance or selection as a session player is not a history-access gate. This is
campaign-member access, not public site access.

Do not design separate Director/player history views preemptively. If specific historical information needs
Director-only access, add that view when the need is identified. Existing live-table visibility and planned
tower-roll requirements remain recorded in their own sections; this default does not decide when previously
hidden results should be revealed or expose unrelated private character/account data. Reading history does not
grant live gameplay authority or reopen a session.

### Account deletion during play

Account deletion also deletes that user's characters and saved encounters. In other users' retained campaigns,
their past actions and chat remain attributed to their username, not a generic deleted-user label. Account
deletion is allowed even while their character is in another campaign's active combat; combat locks must not
prevent deletion. Historical attribution does not preserve a usable account or live character. If a deleted
account was the active Director of another user's retained campaign, that campaign's owner automatically
becomes the active Director. This changes the play role, not campaign ownership. Handling affected combat
participation still needs an operational contract. This supersedes the ordinary roster-lock restriction for
account deletion only; it does not grant routine mid-combat party editing or settle detailed action-resolution
behavior.

### Campaign deletion

The owner can delete the campaign without first closing a running or paused session. Deletion permanently
removes campaign chat, session logs, foes, party inventory, and the Director's stash. Attached characters are
detached under the existing retention/reset policy, retaining their personal inventory and history. This is a
distinct campaign lifecycle operation; existing session-history retention applies to campaigns that remain.
The deletion flow must end live activity and release character locks. Campaign deletion does not offer the
usual combat keep/reset choice. Proposed default: retain current recorded character state, apply detachment
resets, and skip encounter-start restoration and encounter rewards. Account deletion also deletes all
campaigns owned by that user under this policy. Saved encounter templates are user-owned content and survive
campaign deletion.

### Closing a session with an active encounter

Confirmed: closing the session invokes the encounter-void flow when an encounter is active. The Director
chooses whether to keep current character/monster state or restore the recorded pre-encounter state. Skip
normal encounter-ending rewards and consequences in either case. Finish the session as a historical record; do
not leave a resumable encounter attached to a closed session. Without an active encounter, closure does not
require this void choice.

Proposed consistency contract: present the state choice before committing closure. Canceling leaves the
session and encounter in their prior state. Commit the chosen void outcome and session closure together,
record the disposition, and prevent late commands from changing the sealed result. Archive the state after
that decision, not an earlier snapshot. Existing session-scoped authority expires at the committed closure
boundary. Detailed interrupted-operation handling remains implementation work.

A break, disconnection, or passage of time is neither an automatic pause nor closure. Use pause to preserve
the encounter for later continuation; no duration timeout should end it or prompt the void flow. This
supersedes the earlier proposal for encounters spanning closed sessions and does not require an archive-reopen
operation to resume a paused encounter.

Confirmed roster-management timing: whenever no combat encounter is active, the Director can change session
players and selected characters, including while paused. The Director can change the campaign foes roster at
any time, regardless of encounter or pause state, including additions/removals and saved-encounter loads. This
supersedes earlier open-session/between-session restrictions on foes-roster management; the encounter builder
remains the reusable preparation tool. Monster gameplay actions still follow the running-session rules, and
closed session history remains read-only.

V1 users can duplicate their own saved encounters as independent templates, including monster selection,
party-strength calculator setup, and prepared rewards. Duplication does not load live foes or grant loot. The
public campaign directory is deferred beyond v1; campaigns are unlisted by default and v1 discovery uses
campaign share codes/URLs. Opting into a public listing belongs to the later directory feature.

## 2. Participation and presence

Confirmed participation sequence:

1. The Director selects who is playing from the campaign's members when starting the session.
2. The Director can add or remove session players while no encounter is active. Starting an encounter locks
   the party roster for its duration. Adding/removing players or their selected characters requires ending or
   voiding that encounter first; further combat starts as a new encounter. This supersedes the earlier “at any
   time” requirement.
3. A selected player chooses one or more characters they own or have been given access to play in the session.
4. The Director selects heroes and monsters for a particular encounter.

Keep these concepts distinct:

| Concept | Meaning |
| --- | --- |
| Campaign membership | The user belongs to the campaign and is in the pool from which session participants are selected. |
| Session participation | The Director selected this user to play in this session. |
| Campaign observer | A campaign member watching the table without selection as a session player. Observation grants no session controls or gameplay interaction. |
| Selected session characters | The participant's owned or shared characters chosen for session play. Existing campaign admission and effective-build requirements still apply. |
| Encounter combatants | The heroes/monsters selected for this encounter; session participation alone is not an initiative entry. |
| Online presence | Whether a participant is currently connected/active in the session through Convex-backed presence. Exact presence implementation and freshness thresholds remain open. |

The roster shows who is playing and who is online. Connection status does not itself select a participant,
grant character access, remove a participant, finish a turn, pause the table, or close the session. Authorized
players retain their available gameplay operations when the Director is offline; Director-only operations
still require Director authority. Session selection does not duplicate a character or bypass its campaign
admission. Several controlled characters remain distinct actors.

Removing someone through session settings removes session participation; it does not implicitly kick them from
the campaign or detach their characters. The owner retains the separate campaign membership powers in the
access spec. Ordinary player/character roster changes are blocked during an encounter, including while that
encounter is paused. End or void it before changing the roster. The foes roster does not lock: the Director
may add and remove monsters, including participating combatants, during an encounter without ending or voiding
it. Rules-specific summon/companion behavior and turn integration remain deferred. Campaign removal, account
suspension, or grant revocation must still stop unauthorized commands immediately; the lock must not preserve
access after it is revoked. Recovery from those exceptional access changes remains open.

Existing character grants allow eligible shared characters to be selected for session play. The table now
includes free play as well as combat; grants must be applied to the allowed play operations in both contexts.
This does not grant build editing or arbitrary inventory administration. Same-campaign sharing boundaries and
concurrent controllers remain governed by the access spec's unresolved policies.

### Campaign observers and party chat

Confirmed v1 chat policy: authors cannot edit or delete their sent campaign-chat messages. This does not alter
campaign deletion, which removes its chat, or account deletion, which preserves username attribution in other
retained campaigns. No separate Director moderation power is established by this decision.

Campaign chat is the only v1 messaging surface; private direct messages are deferred. The game log remains a
separate entity.

Campaign chat follows campaign membership. In a third-party-owned campaign where both users remain members, a
user-to-user block does not hide their messages from each other. Revoked character shares remain revoked
independently of chat visibility. When a campaign owner blocks its active Director, Director control
immediately returns to that owner; active-combat membership-removal handling still needs its own contract.

Confirmed: any current campaign member may enter and observe the active table without being selected to play.
An observer cannot interact with session controls, choose a character for play, take a turn, make session
rolls, answer gameplay prompts, or otherwise change session/game state. Existing ownership or character shares
do not substitute for selection as a session player. The active Director retains the separately established
Director authority.

Party chat belongs to the ongoing campaign experience and is available to campaign members, including
observers, during and between sessions. Using campaign chat is distinct from interacting with session
gameplay. This carries forward the confirmed always-available chat direction; precise channel layout remains
open.

Watching does not add the member to the locked party roster. Campaign members may therefore arrive or leave as
observers during an encounter without ending it. To become a player, the Director must select them under the
existing roster rules, so an active encounter must first end or be voided.

Observation grants access to the table's permitted audience view, not Director-only controls/data or private
character fields. Monster visibility follows the health-display policy below; party sheets and rolls follow
the policies below, with historical disclosure and proposed content sharing still to be designed. Proposed
presence presentation distinguishes observers from playing participants; observer connections must not affect
encounter membership or reward eligibility.

### Director capability doctrine

Confirmed table doctrine: **anything a player can do at the table, the Director can also do.** Apply this
consistently across table operations in free play, encounters, and other table activities. In particular,
players may choose **Take turn** for an eligible character, and the Director may do so on their behalf.

The relevant authority is the active Director in that campaign, not site administrator access. Existing
session/pause constraints still govern whether an operation is currently available. Game-rule conflicts are
warnings under the adaptation principles; detailed override controls remain to be designed.

Scope confirmed: character progression is a separate track. The table doctrine does not grant another user's
build choices or level-up selections to the Director. Existing character ownership, progression, and review
rules remain in force. Authority follows the operation's purpose, not whether a progression screen happens to
be opened from the table.

Session-only Director appointments return control to the campaign owner when they end, even if someone else
previously held an until-revoked appointment. Pausing or disconnecting does not end the appointment.

### Acting on behalf of a character

Confirmed:

- An existing session participant may take over an existing encounter character only if its owner has already
  shared that character with that specific user and the grant remains valid.
- The active Director may take actions on behalf of any character at the table at any time, without an
  owner-issued character share and without waiting for its owner to disconnect.
- These actions do not add/remove party members or characters, so the encounter need not end. The party roster
  lock still prevents adding a new player to perform the takeover.
- The character keeps its identity, current state, and turn progress; changing who submits its actions does
  not create another turn or replenish actions/resources.

This authority concerns playing the character. Existing pause and session constraints still apply;
game-rule and action-timing conflicts follow the warn-without-blocking principle. Build choices remain with
the character owner, and campaign ownership alone does not grant this
Director authority. Private-field policy is unchanged.

Proposed operation behavior: record both the authenticated acting user and the character they acted for.
Revalidate Director authority or the specific owner-issued grant when accepting commands; serialize competing
commands against current state. Taking over must not automatically rerun pending actions or accepted dice.
Whether the UI has an explicit control handoff or simply exposes actions to eligible users remains open; no
exclusive-controller lease is established here.

## 3. Table surfaces

The table UI will undergo substantial revision. The following are required capabilities, not a fixed panel
layout or frontend framework.

| Surface | Confirmed contents |
| --- | --- |
| Shared table | Party roster, online presence, dice roller, engine-driven activity, and game log. Existing text chat remains part of the table intent. |
| Director pane | Foes roster with catalog search/add, saved-encounter replace/append loading, a default-visibility toggle beside Add, and per-monster show/hide controls. Controls to run actions, including on behalf of any table character, present/call for tests, make rolls, load encounters, activate appropriate content such as traps, and search content. |
| Director character tab | Access to the active character sheets of session players, subject to the existing private-field policy. Viewing does not grant build-choice authority. |
| Session settings | Director controls to pause/end the session and add/remove session players when no encounter is active. During an encounter the party roster is locked. Resume is the proposed counterpart of pause. |
| Player pane | The participant's selected character sheet(s) and actions available in the current context. The presentation for switching among several characters remains open. |

For v1, the game log is the main centerpiece. A later UI may choose not to expose it as a main surface;
durable recording remains required. Keep the shared operations independent of the visual log and panes.

**Confirmed v0.01 scope:** defer campaign text chat and focus on a visible game log. The prototype must
show recorded gameplay activity at the table; background recording alone does not meet this requirement.
The presentation may be temporary, consistent with the desktop concept-proving UI scope. This decision
does not settle the deferred combat timing, action grouping or undo contracts. The chat requirements below
remain for the fuller product, with chat and gameplay records kept distinct.

Chat and sheet access are also available through the campaign/character experience outside the live table.
Chat therefore cannot depend on an active session record. For v1, **campaign chat and the game log are
separate entities**. Their UI presentation is explicitly deferred. A later interface may merge chat with a
curated game-log feed; that possibility does not merge their underlying records or lifetimes. Channel layout
and historical presentation remain open.

The dice roller follows its existing spec: shared code generates/validates/records results, and the optional
3D tray presents accepted values. A disabled or absent visual tray must not prevent play. Both CLI and UI
invoke the same gameplay operations.

### Foes roster

Confirmed: the **foes roster** is the monster counterpart to the party roster and lives in the Director's
pane. It holds live monster instances with their stat blocks and current play state preserved until the
Director removes them or normal encounter cleanup removes defeated foes. Monsters can be run in free play
without belonging to a combat encounter; their gameplay operations retain the running-session, pause, rules,
and recording requirements.

Confirmed: the foes roster is **persistent campaign state**, presented through each session's Director pane.
Closing a session preserves its monsters and their resulting state after any required encounter keep/reset
choice. The next session uses that same roster; session closure does not clear or recreate it. No additional
mechanism to prevent roster clutter is required in this scope: the user expects combat to eliminate most
monsters.

Confirmed latest clarification: the Director can manage the foes roster at any time, including between
sessions, during pauses, and during combat. The encounter builder remains the reusable template-preparation
tool. Earlier restrictions requiring an open/running session for roster additions/removals or saved-encounter
loading are superseded.

Confirmed: **the foes roster does not lock during combat**. The Director may add or remove monsters as needed,
including monsters participating in the active encounter, without ending or voiding it. The character
progression/edit lock does not apply to monsters. Saved-encounter replace/append operations are not blocked
merely because combat is active. Foes-roster management is available regardless of encounter or pause state;
executing monster gameplay actions still requires a running session.

Confirmed v1 scope: a saved encounter retains the monster selection, including quantities, the last setup of
its **party strength calculator** (working title), and a **rewards stash**. This extends the earlier
monster-selection-only scope; no other authored supporting content is required for v1. Saved encounters are
private to their creator in v1; sharing is deferred. Loading a creator's selection into a campaign produces
independent live roster instances governed by table access, without granting access to the private template.
Definition references and rules needed to instantiate selected monsters remain necessary; this scope does not
remove their stat blocks or mechanics.

Confirmed v1 requirement: the encounter builder calculates **encounter difficulty for a selected party**. This
is derived guidance alongside monster selection, not an additional authored-content requirement for saved
encounters.

Confirmed builder party setup:

- Add hypothetical character stubs and change their individual levels.
- Select the party from any campaign the user owns or for which they are the active Director, loading
  character stubs into the builder.
- Delete imported stubs individually or edit their levels to adjust the planning party, including planning for
  future levels.
- Provide a level reset for imported stubs that restores the source character's current actual level, undoing
  the hypothetical planning-level adjustment.

These are planning representations: removing a stub does not delete its character, detach it from its
campaign, or change the live party roster. Level changes to either hypothetical or imported stubs, including
resetting an imported level, do not perform character progression or change the original characters. Proposed
reset behavior: retain a source-character reference and read its current level through authorized access; do
not treat an old imported value as necessarily current. A purely hypothetical stub has no source character
whose actual level can be restored. Proposed contract: load only the character summary/rules inputs required
for difficulty calculation and revalidate campaign-owner/active-Director access when importing. Ordinary
campaign membership alone does not grant this import route. Confirmed: each saved encounter remembers the
party strength calculator exactly as last configured, including hypothetical/imported stubs, individual
removals, and adjusted levels. Reopening the builder restores that planning setup; it does not automatically
reset imported levels to current source values. The level-reset control deliberately returns imported stubs to
their source characters' current actual levels. Saving calculator inputs refines the earlier
monster-selection-only scope without requiring additional authored encounter content. Loading into the foes
roster does not turn planning stubs into actual session participants. Required numerical inputs and formulas
await rules research.

The user proposed showing **current encounter value (EV) against the current party** in the Director's foes
roster. Confirmed comparison scope: include all undefeated monsters on the roster, including hidden ones and
those not selected into the current combat. Do not filter the total by player visibility or active-combat
membership. Defeated monsters stop contributing to current roster EV immediately, even while their entries
remain until normal encounter cleanup. This is the current-roster display policy; it does not retroactively
change recorded encounter difficulty or establish reward calculations. Exact party inputs still need
definition. Exact difficulty formulas, party inputs, organization/count handling, and any treatment of changed
monster state require verification against the pinned rules. Do not infer a health-based EV adjustment or a
difficulty formula from the phrase “current EV.”

Confirmed v1 content scope: core rulebooks only, with all official supplements and homebrew monsters,
character options, and items excluded. Summoner and Beastheart are official supplemental classes, not core;
neither their classes nor associated mechanics are v1 targets. Reference coverage includes eligible official
retainers, companions, and summons under the [source scope](reference-library-spec.md), without assuming every
readable creature has complete automation. Monster selections use supported core-rulebook content; creating or
copying monsters for homebrew customization is deferred.

The top of the roster provides controls to search the database and add stat blocks, or load a saved encounter.
Loading a saved encounter also adds its prepared reward items to the campaign's persistent Director's stash at
that time; encounter start/wrap-up do not add them again. Loading a saved encounter into an empty roster
populates it. If the roster is nonempty, show a dialog with **Replace current roster** and **Append to current
roster** choices. Replacement removes the current roster entries in favor of the loaded selection; append
preserves existing instances and adds the selection. Loading does not itself start combat.

The encounter selects monsters from this roster and uses their existing current state. At normal encounter
end, cleanup automatically removes defeated monsters from the roster; surviving monsters remain. During
combat, defeated monsters remain marked as defeated, subject to their visibility setting and the Director's
existing removal controls. Removing a roster entry preserves its historical record. Void-and-keep retains
their current roster state for free play or another encounter; void-and-reset restores the involved monsters
to their recorded pre-encounter gameplay state. Voiding skips the normal defeated-foe cleanup and follows its
keep/reset choice. Loading a saved encounter creates independent instances rather than updating existing
monsters or the reusable source.

Future feature: the campaign's **Slain table** will show creatures killed by the party over the campaign's
lifetime, how they died, and who killed them. This is a later feature, not a v1 implementation requirement.
Retained history should support it; roster removal alone does not establish that a creature was killed. Kill
attribution, undo/void treatment, and its presentation remain for that feature's design.

Confirmed: a **default-visibility toggle beside the roster's Add button** lets the Director choose whether
newly added monsters start visible or hidden. This sets the initial visibility of additions; changing it does
not change monsters already on the roster. Each monster retains its individual visibility control. New
campaigns default the foes-roster Add visibility toggle to hidden. Its value is stored per campaign, and both
individual catalog additions and monsters loaded from saved encounters use that current value. Changing the
default does not change existing foes' individual visibility.

Each roster monster has a Director-controlled **show/hide toggle**. Showing a monster makes it visible to
players, with its health presented according to the campaign's monster-health setting. It does not expose its
full stat block. Hiding a monster removes it from the player-facing roster view without removing the monster
from the Director's roster. Confirmed clarification: **hidden means absent from the players' roster view, not
inactive**. The Director can use a hidden monster to act against or attack players without revealing its
roster entry first, subject to the normal session and gameplay rules. The toggle does not apply an in-game
hiding/invisibility effect. Visibility and encounter membership are separate properties; revealing a monster
does not enroll it in combat or start a turn.

Proposed consistency details: give each added creature a distinct instance identity; preserve existing
identities and state on append. Canceling the replace/append dialog changes nothing, and validate the load
before committing replacement. Preserve historical references after removal. Apply the show/hide boundary to
observers as well as players through authorized audience projections. Provisional user decision: a hidden
foe's name is not concealed in game-log entries when it acts. Its roster entry remains hidden; a named log
entry does not reveal its full stat block or automatically toggle roster visibility. Visibility alone does not
establish a secret-roll mode; the public/tower result-audience rules remain separate.

Open: the history/void-reset treatment of monsters added or removed after encounter start. Director
additions/removals during combat are confirmed. Their detailed turn, pending-action, squad, and summon
interactions belong to the deferred rules/resolution workstream.

### Party sheets and resource visibility

Confirmed: players cannot inspect other players' full character sheets by default. They can see each other's
Stamina and Recoveries. This supplies the shared party-resource view without making whole sheets public.
Existing explicit character-sharing grants and Director/campaign-owner access remain separate permissions;
this rule does not revoke a previously granted sheet view.

A configurable party-resource visibility setting, analogous to monster health modes, is a possible future
extension, not a current requirement. The precise current/maximum formatting remains a presentation detail.
Proposed observer presentation uses the same limited party-resource view as ordinary players, subject to the
established audience boundary.

### Public rolls and the dice tower

Confirmed default: rolls are public to the table audience, including campaign observers; “public” does not
mean an anonymous site-wide feed.

Planned feature: a **dice tower** mode. Its result is visible only to the active Director, **not even to the
player who made the roll**. The tower's UI and delivery timing remain unsettled. The result-audience rule is
confirmed for that feature; the exact gesture/control is not.

The shared dice/application path must enforce the audience. A tower submitter can receive a submission
acknowledgement without the result. Do not return hidden faces/totals through the submitting player's
response, visual dice, text fallback, subscriptions, or ordinary log details. The authorized Director can read
the recorded result; the engine can use it through shared operations. How related outcome explanations or
later history are revealed still needs definition. See the
[dice specification](dice-roller-spec.md#roll-visibility-and-planned-tower-mode).

### Proposed content sharing

The user wants to explore a way to show abilities, character sheets, and monster stat blocks to the group.
Inventory discussion reinforces this as a general direction for objects shared through messaging, including
items/loot; see the [inventory specification](inventory-spec.md#objects-shared-through-messages). Sharing a
displayed object is separate from transferring an owned item. Dragging an item into campaign chat so everyone
can see it is one suggested interface; another sharing mechanism may be chosen. This is a proposed feature,
not a settled drag-and-drop requirement.

Keep showing content distinct from granting character control or editing rights. Proposed design: a
deliberate, readable content share with an explicit audience, rather than silently opening access to its
underlying private record. Define whether it is a snapshot or a live view, who may share which content,
private-field exclusions, and later revocation/history behavior before implementation. Deliberately sharing a
monster stat block would be an explicit disclosure path; the normal table still withholds it. An ability share
need not expose the entire character sheet.

These presentation/access questions do not resume the deferred action-economy workstream.

### Monster visibility and health display

Confirmed: players and observers do not see monster stat blocks at the table. The Director can inspect them to
run monsters in free play or encounters. Only foes marked visible are shown in the player-facing roster; the
health modes below apply to those visible foes. The public monster glossary remains accessible; refraining
from looking up foes during play is a table-etiquette expectation, not an application restriction on glossary
access.

A campaign-level **Monster health display** setting has exactly three modes. **New campaigns default to Bar.**
The active Director can change it at any time:

| Mode | Player/observer presentation |
| --- | --- |
| Numerical | Show the monster's exact current health (Stamina). This does not reveal the rest of its stat block. |
| Bar | Show the proportion of health remaining as a standard health bar, hiding exact Stamina values. |
| Winded | Show no health number or bar; indicate whether the monster is winded. |

The setting governs the audience view and does not reduce the Director's access to the underlying stat
block/state. It applies at campaign scope rather than being a separate per-encounter choice. Changing
presentation does not change Stamina, trigger game effects, or require ending an encounter. The Director's
ability to change it at any time includes while the session is paused or between sessions; gameplay remains
frozen as previously specified.

Source refinement: the pinned [Winded rule](../vendor/steel-compendium/en/unified/md/rule/health/winded.md),
at Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`, defines winded at Stamina **equal to or
below** half its maximum, including exactly 50%. Use that rule rather than the walkthrough's informal “below
50%.” For a maximum of 20, current Stamina 11 is not winded and 10 is winded. The indicator reflects current
state, including after healing or restoration.

Proposed delivery contract: filter out hidden roster entries and provide an audience projection appropriate to
the current mode, with full monster state available only through the Director's authorized operations.
Player/observer table payloads must not embed the hidden stat block or exact Stamina in Bar/Winded mode and
merely hide it in the UI. Apply the same projection to tooltips and state details exposed through the live
game log. Public glossary content remains a separate reference surface.

Open presentation details: whether Numerical also shows maximum Stamina; how shared minion-squad health is
represented; and how historical health disclosures behave after a setting change. The handling of historical
logs and information already displayed is separate from updating the current live view. This focused display
decision does not reopen the deferred action-economy workstream.

### Campaign inventories

Observers cannot claim items from the visible Director's stash; they cannot interact with the session. Stash
visibility alone does not grant claim authority. Outside-session allocations retain their separately
established flow.

Hiding the Director's stash cancels all outstanding provisional claims and releases their reservations without
transferring items. The Director cannot approve claims while the stash is hidden. Revealing it again requires
fresh claims; previously approved deposits remain completed. V1 excludes item stacks: each inventory/stash
item is represented individually, with no stack splitting, merging, or partial-quantity claims. Multiple
copies of an item may exist as separate instances; monster quantities in saved encounters are unaffected.

Confirmed v1 direction: character and shared party inventories live at campaign level, with
equipped/unequipped mechanics and transfers between party and individual inventories. Provisionally, each
campaign has one persistent Director's stash for claimable awarded/discovered loot, including encounter
rewards, with confirmed Director authority to add/remove stash items at any time, including outside encounter
wrap-up. The whole stash is hidden until the Director shares it; a toggle like monster visibility is the
proposed control. Rewards stashes in saved encounters and normal encounter cleanup are confirmed for v1.
Standalone saved stashes are excluded from v1; discoverable shops/chests are possible later extensions. See
the [inventory specification](inventory-spec.md). Inventory management is character data, even though items
can affect the character. Party/character transfers work between sessions under their access rules; they are
not gameplay actions exempted from the session gate. Actual gameplay item use still follows gameplay
constraints. Inventory management remains available while paused if the character is not locked in combat.
Personal inventory inspection is limited to its owner and active Director. Players may discard items from
their own or the shared party inventory but cannot return them to the Director's stash. The Director can
directly edit character inventories, subject to the existing combat character-edit lock. V1 excludes direct
character-to-character transfers, player creation of new inventory items, and free-text custom items. Starting
equipment comes from character creation; later loot goes through the Director's stash approval flow; existing
party/character inventory transfers remain available. The Director can reveal the stash at any time. Whenever
visible, players may propose taking items, inside or outside wrap-up; the Director approves the final
allocation before deposits occur. An accepted stash claim reserves the item and blocks another claim until
availability changes, while the Director retains allocation authority. Players can withdraw their unapproved
stash claims to release the item. Inventory transfers, discards, and edits have a history the Director can
review, undo, and redo. A character's owner retains access to personal inventory history after the character
leaves the campaign. Players can read their own inventory history, and all campaign members can read party
inventory history; players cannot undo their personal inventory changes or changes they made to party
inventory, regardless of the campaign gameplay-undo setting. Richer sharing is deferred.

## 4. Session status and play mode

Keep session pause distinct from the table's underlying activity:

| State/mode | Behavior |
| --- | --- |
| Running, free play | No structured activity is active. Players can use abilities and spend resources subject to core rules. The Director can call for tests, activate traps, and use other applicable tools. |
| Running, combat encounter | Combat timing/order governs actions, with rules-authorized exceptions and reactions. Encounter resource and reward mechanics participate in the lifecycle. |
| Running, respite | Dedicated self-contained gameplay loop, started and ended by the Director. Mechanics and possible downtime relationship require research. |
| Paused | Gameplay actions are blocked; sheet reads, chat, unlocked character-data management, and Director foes-roster management remain available. The Director may change the party roster if no combat is active. Preserve the activity for resumption; gameplay corrections remain blocked. |
| No running session / closed | Sheet reads, chat, authorized character/party inventory transfers, and campaign foes-roster management remain available. Gameplay actions are blocked. Changes affect current campaign/character data, never reopen or rewrite closed session history. |

V1 has free play plus structured combat and respite. Montage tests and negotiations remain future structured
states. **Provisional user decision: only one structured state can be active at a time.** Finish or otherwise
end the current activity through its supported lifecycle before starting another; no nested or suspended
parent/child activity loop is required for the present design. Pausing the session preserves its existing
activity rather than opening another activity slot.

The user has seen montage tests nested inside combat or negotiation, and the reverse, in actual play. Preserve
nesting as a possible later extension, not a claim that the rules prohibit it. Detailed transitions and each
mode's ending/cancellation behavior still need design; the single-state decision does not silently give
noncombat modes combat's void/reset mechanics.

Confirmed pause boundary: sheet viewing and chat continue, while gameplay mutations are blocked. The
gameplay-action block applies outside a running session too; character-data management, including confirmed
between-session inventory transfers, is a separate category. Proposed enforcement: check this boundary through
authoritative shared operations, not just disabled UI controls. Recheck pause status before committing an
in-flight result. Preserve already accepted dice, applied changes, and pending choices; decide how an
interrupted operation resumes before implementation. Presence is observational rather than game progression.
Character editing remains locked while an encounter is active, including while paused. Accepted encounter
changes use the main sheet immediately; pausing blocks further gameplay changes.

### Character sheet lock during encounters

Confirmed replacement for the previous independent encounter-sheet model: **a character's sheet is locked
against editing while that character is in an encounter. Encounter gameplay changes immediately update the
main sheet.** There is one live character state, not an encounter copy awaiting writeback.

The lock covers character-editor changes, draft/choice edits, level-ups, progression restoration, activation
of reviewed builds, and out-of-play detail/inventory edits. An existing editor or pending approval cannot
bypass it. Authorized encounter operations still apply damage, resources, conditions, inventory changes, and
recorded corrections to the main sheet as they are accepted. Viewing the sheet and using chat remain available
under existing access rules.

The lock lasts until the encounter finishes its normal ending procedure or is voided. Pausing retains it. It
applies to both owner and Director; Director table authority does not grant an independent editing route
around the lock. Other characters not in the encounter remain governed by their normal workflows.

Retain an immutable record of pre-encounter gameplay values for undo and void/reset. This is a restoration
record, not a separately editable character. Keep-state voiding leaves already-applied main-sheet values in
place; reset voiding restores the recorded pre-encounter gameplay values directly to the main sheet. Neither
path reruns rules or dice. Normal ending adds only the applicable ending effects; it does not copy or reapply
changes already accepted during play.

Proposed enforcement: bind the character to the active encounter and check that binding in every
character-edit/approval operation, including stale autosaves. Main-sheet and table reads use the same
authoritative live values. Commit gameplay changes with their history records so accepted state is durable
immediately, without waiting for encounter or session closure. Keep existing drafts intact while locked rather
than discarding or automatically applying them on unlock.

Build/resource reconciliation after a permitted build change outside an encounter remains a separate wizard
concern. There is no longer an open question about the timing of encounter-to-main-sheet writeback: accepted
changes reach the main sheet immediately.

### Respite mode

Confirmed: respite is its own dedicated table mode, with a self-contained gameplay loop that the Director
starts and ends. It has mechanics to support rather than being only a pause or a descriptive log entry.

Further rules research is required before defining the loop's steps, effects, or player controls. Respite may
connect to the downtime system; that relationship is explicitly unresolved. This checkpoint does not import
combat initiative, roster/sheet locks, void/reset behavior, or reward procedures into respite. Its
interruption and session-closure behavior require separate design informed by that research. The provisional
single-structured-state policy applies; nested respite is not required in the present design.

## 5. Encounter workflow

Confirmed product sequence, subject to the rules notes below:

1. **Prepare participants:** the Director selects heroes and existing monsters from the foes roster, retaining
   their current values. Saved encounter loads create independent roster instances under the catalog/data
   specs. Preparation and loading do not by themselves establish that initiative has begun. Starting the
   encounter locks the party roster and participating character sheets against editing; capture the starting
   gameplay state before encounter-start mechanics so a later void can restore it. Encounter actions update
   the main sheets immediately.
2. **Determine the starting side:** the Director initiates the opening procedure. Record dice and any required
   choices or exceptions.
3. **Choose who acts:** when it is the heroes' side, a player may choose **Take turn** for an eligible
   character they control. The Director can also choose Take turn on a character's behalf under the table
   capability doctrine. The Director chooses the eligible actor/group on their side. Exact eligibility follows
   core rules and current turn state.
4. **Take the turn:** the controller uses available actions in legal order. They may choose to end the turn
   without spending every available action. Ending a turn still needs to process required end-turn effects and
   unresolved dependencies.
5. **Pass control:** alternate sides according to the rules, tracking who has acted. Apply exceptions for
   groups, exhausted sides, and abilities that alter normal order.
6. **Finish the round:** process round-boundary effects, then begin the next round with the side that started
   the first round, subject to any specific rules exceptions.
7. **Resolve the encounter outcome:** elimination of a side or a Director decision can bring play to its
   ending procedure. The Director awards applicable Victories and completes rules-required cleanup, including
   the v1 rewards-stash step. An encounter wrap-up screen includes the stash, which stays hidden until
   deliberately shared. Players can make provisional loot claims; the Director can adjudicate allocations
   before finishing wrap-up. Only Director completion deposits the final allocations into party/character
   inventories. Cleanup can finish with unclaimed loot; wrap-up displays persistent stash storage, and the
   remaining items simply stay in that same stash afterward without automatic transfer or discard. Victory
   eligibility is not inferred from enemy elimination alone.
8. **Return to free play:** after outcome/rewards/cleanup are complete, the encounter is over and the
   session's table returns to free play. The party roster can then change. Voiding is a separate exit
   described below.

Proposed operation groups are prepare/start encounter, choose acting creature/group, use action or answer a
pending request, end turn/round, declare encounter outcome, complete rewards/cleanup, and void with an
explicit state choice. Naming and transaction boundaries remain open. Ending and rewarding must be recorded
and retry-safe so returning to free play cannot award the same Victories twice.

Manual resolution remains an intended playable path. Show full source text, applied effects, and outstanding
work. Turn enforcement cannot simply prohibit every off-turn operation: legal triggered actions need a route
to interrupt or respond. The exact interaction and ownership of pending decisions belong to the deferred
action-economy workstream; they are not implemented or settled by this checkpoint.

### Voiding an encounter

Confirmed: the Director can **void an encounter**, ending it without the normal closing procedure. Do not
award Victories or apply any other encounter-ending benefits or consequences. The dialog asks whether to:

| Choice | Result |
| --- | --- |
| Keep current state | Keep the current character-sheet and monster-instance values, including changes already applied during the encounter. Skip normal encounter-ending rewards, cleanup effects, and consequences. |
| Restore starting state | Restore character-sheet and monster-instance gameplay state to immediately before the encounter started. Skip normal encounter-ending rewards, cleanup effects, and consequences. |

Both choices end the encounter and release the party roster lock. When voiding without closing the session,
the table returns to free play and can start a new encounter after roster changes. When voiding as part of
session closure, the session instead becomes historical. Voiding does not automatically start a replacement
encounter. Keeping current values does not mean rolling back already-applied damage or costs; restoring the
starting state does.

This is a confirmed application control, separate from a normal rules-defined encounter conclusion and from
stepping backward through individual actions. Closed sessions remain permanently read-only in v1; voiding does
not provide a route to reopen them or edit their history.

Proposed implementation contract:

- Capture the authoritative starting gameplay state, including relevant character and monster values and
  shared state needed for coherent restoration, before encounter-start grants/costs/resets. Distinguish this
  boundary from loading a saved template. Restore recorded values without rerunning rules or dice.
- Present both choices explicitly; canceling the dialog leaves the encounter unchanged. Before committing,
  validate current Director authority, encounter identity/revision, and the selected choice. Apply the state
  decision and terminal encounter status together, with duplicate-command protection.
- Preserve the encounter journal and record that it was voided, who did it, and whether state was kept or
  restored. Do not rewrite the encounter as a victory/defeat or delete its prior dialogue. Chat, ownership,
  access grants, and campaign membership remain outside gameplay restoration.
- Close pending encounter work as canceled/superseded without applying unresolved effects. Reject stale action
  results after voiding. Release turn/control bookkeeping so the ended encounter cannot continue acting. This
  administrative termination must not run normal encounter-end game effects.
- Keep loaded monster snapshots independent of their saved encounter template. Retaining monster values does
  not mutate the reusable source. The foes roster retains those instances for selection into a new encounter.
  A fresh template load requires the explicit replace/append choice when the roster is nonempty; append
  preserves the retained state.
- Ordinary gameplay remains blocked while paused. Session closure uses the required void/state-choice path
  rather than treating a pause as encounter completion. Whether standalone voiding requires resuming first
  remains open; whether void itself can be undone and its statistics treatment beyond no ending awards also
  remain open.

Restoration is game-state restoration, not character progression rollback: encounter changes to
inventory/resources must be covered where applicable. Authored/private fields and unrelated account changes
must not be overwritten. Sheet editing is locked during the encounter, and restoring encounter gameplay values
updates the main sheet immediately. There is no separate encounter-sheet merge.

### Taking a turn

A player choosing Take turn does not require a separate Director approval step. The control is available when
their side may act and the selected character is eligible under the rules. The same operation is available to
the Director on behalf of that character.

Proposed concurrency behavior: the first valid claim accepted against the current state starts the turn. A
competing stale claim receives the updated state and does not replace the active actor or consume another
turn. Repeating the accepted command does not restart the turn. Use the same authoritative operation from
player UI, Director UI, and headless clients. No voting or fixed player ordering is established by this
control.

### Undo permissions and proposed campaign control

Confirmed: players can undo their own actions, back as far as the beginning of their turn. The Director can
undo those actions and redo them as well. This complements the Director table-capability doctrine; Director
redo is explicitly established. Player redo has not been specified.

Confirmed campaign setting: **Enable user undo**, enabled by default for new campaigns (confirmed 2026-09-11).
Disabling it blocks ordinary player undo while retaining Director undo/redo. Setting-management authority and
when changes may apply remain open.

The game log/state machine restores recorded state, rather than rerunning rules or dice. Undo/redo must change
actual affected sheet/monster/resource state, not just visible dialogue. Preserve the recorded inputs,
outputs, and later history for redo under the eventual continuation policy. The existing pause/session gates
and audience restrictions still apply unless a specific exception is established.

This checkpoint settles the basic permission direction, not the undo tree. Detailed grouping/dependencies, new
play after undo, treatment of triggered actions on another actor's turn, whether a just-ended turn can still
be undone, shared-controller attribution, and Director rewind limits remain for later
history/action-resolution design. The player boundary does not grant selective removal of an earlier action
while leaving incompatible dependent effects in place. Free-play undo needs a separate scope because it has no
turn boundary. The prior local prototype's refusal to submit new actions from past history remains an
experiment choice.

## 6. Initial rules check

Checked the following local Compendium records at `fb83a789da8f0327a389c277a0c790b1648d5810`. This is a
focused check of the walkthrough, not a complete encounter rules audit or a claim of automation support.

| Topic | Source-grounded refinement |
| --- | --- |
| Opening order | [Combat Round](../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md) includes surprise. When both sides have unsurprised creatures, the Director or their chosen player rolls one d10: 6+ gives the players the choice of starting side; otherwise the Director chooses. The die does not directly force heroes/monsters to start. Specific content can modify this procedure. |
| Turn budget | [Taking a Turn](../vendor/steel-compendium/en/unified/md/rule/combat/turn.md) provides a main action, maneuver, and move action. Movement can be split around the others; a main action can become a move action or maneuver. The user clarified that “bonus action” meant triggered action; it is not an additional standard turn slot. |
| Free and triggered actions | [Free Maneuvers](../vendor/steel-compendium/en/unified/md/rule/combat/free-maneuver.md) and [Triggered Actions](../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md) have distinct timing/limits. Triggered actions can occur on someone else's turn when their trigger occurs. |
| Alternation and groups | Combat Round allows the remaining side to finish its unspent turns when the other side is exhausted. Director creatures act in groups; their members take turns before passing sides. Monster group construction and squad details need further source verification. |
| Next round | Combat Round confirms the side that acted first in the initial round starts subsequent rounds. |
| Victories | [Victories](../vendor/steel-compendium/en/unified/md/rule/resource/victories.md) ties combat awards to survival and achievement of party objectives, with Director discretion for difficulty. A slain-enemy counter alone cannot decide awards. |
| Free-play boundary | Combat Round says harm intent or a damaging/negative environmental threat can start combat before the harmful action occurs. Free-play abilities and traps therefore need a rules-aware transition into encounter play; lack of a manually loaded encounter cannot bypass combat resource costs. |

The complete encounter-start, turn/round timing, resources, death/objectives, reward, cleanup, and exception
rules still require contextual research and meaningful behavior examples before implementation. Preserve the
requested app loop while applying those verified mechanics.

## 7. Proposed acceptance examples

- While paused, the Director can edit the party roster if no combat is active. Combat still blocks ordinary
  party changes.
- During combat, a pause, or between sessions, the Director can add/remove foes and load a saved encounter.
  This does not run monster gameplay actions or rewrite closed history.
- A new campaign adds foes hidden by default; changing the campaign Add toggle affects later catalog additions
  and template loads, not existing foes.
- Respite is an included mode; montage/negotiation mode controls and downtime-project tracking are absent from
  v1.


- After session closure, attempts to resume it, submit gameplay, or apply live undo/redo to its history are
  refused, including for the Director. Reading retained history leaves current campaign state unchanged;
  further play starts a new session.
- Under the provisional single-state policy, starting a second structured activity while one is active is
  refused without changing the existing activity. Session pause preserves that activity and does not enable
  nesting.
- A current campaign member can read past session logs even without having attended or been selected to play.
  The default history view is shared across campaign members; reading it does not reopen the session or grant
  gameplay authority.
- Starting a session from campaign members creates one current play context. A competing start cannot create a
  second; pausing preserves that session.
- The roster distinguishes selected offline players from connected players. Disconnecting does not remove
  characters or advance play. Director disconnection and zero connected clients leave a running session
  running; returning clients see the same session and encounter state. A paused session stays paused on
  reconnect. Presence changes never perform lifecycle operations.
- A campaign member outside the session roster can observe and use campaign chat, including mid-encounter, but
  cannot invoke session gameplay commands even if they own or have a share for a character. Observation
  neither changes the party roster nor grants Director/private data access. A nonmember cannot obtain this
  access through a campaign/session ID alone.
- A participant selects multiple eligible owned/shared characters; an unapproved character or revoked grant
  cannot be used to bypass admission/access rules.
- Director and player clients expose their specified controls; server authorization enforces the same boundary
  for headless callers.
- An existing participant with a valid prior share can act for an existing encounter character; an unshared
  participant cannot. The active Director can act for any table character without a share, including while the
  owner is connected. Neither route changes the roster, resets the turn, bypasses pause/rules, or grants build
  editing. Commands identify the actual acting user and controlled character.
- Starting an encounter locks party players/characters. Attempts to add/remove them through either UI or
  headless operations fail until the encounter ends or is voided. Pausing does not unlock the roster. Later
  session removal does not implicitly expel someone from the campaign.
- Void-and-keep retains current character/monster values and skips all normal ending awards/effects.
  Void-and-restore exactly restores the recorded starting gameplay state without engine/dice calls. Both
  release the roster lock and retain a marked historical record; cancel changes nothing, and retries/stale
  action results cannot apply further effects.
- Foes added from the catalog retain their state across free-play actions and encounter use. Selecting an
  existing foe for combat does not recreate or heal it; survivors remain after normal ending, and voiding
  follows the keep/reset choice without normal defeated-foe cleanup. Void-reset restores its encounter-start
  values, including damage already present before combat.
- A defeated foe remains marked during combat unless the Director removes it. Normal encounter cleanup removes
  defeated foes while retaining survivors and historical records; retries must not erase history or duplicate
  cleanup. Voiding does not run this normal cleanup.
- The builder accepts hypothetical stubs with independently adjustable levels and imports party stubs from
  campaigns owned or actively directed by the user. Deleting an imported stub, changing its level, or
  resetting it to its source character's current level updates only the planning party; original characters
  and live rosters remain unchanged. A user with neither role cannot import through a guessed campaign ID.
- Reopening a saved encounter restores its last calculator setup, including hypothetical/imported stubs and
  adjusted levels. Source-character advancement does not silently replace saved planning levels; reset
  deliberately retrieves the actual level. Loading monsters into a session does not enroll calculator stubs as
  participants.
- The encounter builder derives difficulty from the selected monsters and party using verified rules. Changing
  either selection refreshes the guidance; unsupported or missing inputs remain visible rather than producing
  a guessed difficulty. Concrete numerical acceptance cases await rules research.
- Between sessions, the Director can prepare saved encounters, add/remove live roster monsters, and load saved
  encounters using the replace/append flow. Loading also adds prepared rewards once under the stash contract;
  it neither starts gameplay nor reopens closed session history.
- Closing a session preserves the campaign foes roster and the state resulting from any encounter keep/reset
  choice. Starting the next session exposes those same retained instances and values without reloading a
  template or continuing the closed encounter.
- During a running encounter, the Director can add monsters and remove participating monsters without ending
  or voiding it. The encounter does not impose a foes-roster lock; party player/character locks remain
  enforced. Detailed turn and restoration cases await the deferred resolution/history design.
- Loading a saved encounter into a nonempty foes roster requires replace or append; append preserves current
  instances, replacement uses fresh instances, and cancel leaves the roster unchanged. Editing the template
  changes neither load.
- A hidden roster monster can perform an otherwise legal Director-submitted action against a player without
  first becoming visible in the roster. Toggling roster visibility does not enable/disable its actions or
  apply in-game concealment.
- For now, a hidden foe's action can show its name in the game log while its roster entry stays hidden. The
  log entry does not expose its full stat block or automatically reveal the roster entry.
- The roster EV comparison includes all undefeated visible/hidden monsters and monsters outside the current
  combat; changing visibility alone does not change its total. Defeat immediately removes a monster's
  contribution without removing its roster entry. If recorded-state restoration makes it undefeated again, its
  contribution returns; the saved template and recorded encounter facts remain unchanged.
- Adding a monster with the Add visibility toggle set to hidden creates a hidden roster entry; setting it to
  visible creates a visible entry subject to the health-display policy. Changing the default leaves existing
  entries unchanged, and individual show/hide controls remain available.
- Hidden foes remain available to the Director but are absent from the audience roster payload. Revealing one
  exposes its permitted roster/health view without its stat block or any change to encounter membership.
- Free play supports a legal ability, resource expenditure, and Director-requested test with recorded results.
  A rules-triggered combat start uses the agreed transition.
- An encounter demonstrates starting-side choice, player Take turn and its Director equivalent, actor/group
  eligibility, turn budgets, a legal off-turn trigger, remaining-side turns, and the next round. Proposed
  simultaneous-claim handling starts only one turn and leaves the losing claim without side effects.
- While paused or between sessions, authorized users can view sheets and send/read chat, but gameplay
  mutations are rejected through both UI and CLI. Access does not require creating or reopening a session.
- Pause blocks gameplay commits without discarding accepted inputs/results. Resume retains mode, state, and
  pending work under the eventual policy.
- Wrap-up claims do not deposit inventory items. The Director can change allocations, then finish wrap-up to
  deposit the final allocations once while retaining unclaimed loot.
- Normal encounter ending records the outcome, awards and cleanup once, then returns to free play. Closing
  with an active encounter instead requires the void keep/reset choice, skips normal ending effects, and
  records the final state before archival. No active encounter carries into the next session; retries cannot
  reapply the selected result.
- A long pause retains the same session, encounter, turn, and state. Elapsed time does not close the
  encounter, award benefits, or trigger a void prompt.
- Players/observers cannot open loaded monster stat blocks at the table, but can still browse the public
  glossary. Numerical exposes exact current Stamina, Bar exposes only the remaining proportion, and Winded
  exposes only winded status. At maximum 20/current 10, Winded is shown.
- Director changes to the campaign health mode update the audience view during encounters and pauses without
  changing game state or exposing hidden fields through table payloads. Director stat-block access remains
  available.
- Ordinary players can see party Stamina/Recoveries but cannot inspect another character's full sheet without
  a separate valid permission.
- Ordinary rolls are public to the table audience. For tower mode, only the Director receives faces/totals;
  the rolling player and observers do not receive results through any client path.
- During an encounter, attempts to edit the character, save changed choices, level up, restore progression, or
  activate a pending build are refused, including through an already-open editor or Director operation.
  Viewing stays available; pause retains the lock. Normal ending/voiding releases it.
- Accepted encounter damage/resource changes appear immediately on the main sheet and survive reload.
  Undo/reset restores that same state; keep-state voiding does not reapply changes. No encounter-end
  copy/merge is required.
- Player undo restores their recorded actions as far back as their turn start, without crossing that
  permission boundary. Director undo/redo restores recorded effects without rules/dice calls. New campaigns
  enable user undo by default; disabling the setting blocks player undo through shared operations while
  retaining Director controls. Detailed dependency cases await the deferred history/resolution design.
- Table redesign or disabling the visual log/dice tray does not remove recorded history or shared operation
  access.

## 8. Continue exploring

Remaining work, distinct from settled product decisions:

1. **Remaining pause details:** sheet viewing/chat are confirmed available and gameplay changes blocked.
   Roster timing is settled: foes at any time, party when no combat is active. Define in-flight action
   handling and remaining lifecycle operations such as standalone void while paused; do not reintroduce
   roster-management gates.
2. **Participation/access exceptions:** ordinary party changes now require ending or voiding the encounter.
   Prior-share takeover and Director on-behalf actions are now confirmed. Define their exact UI, recovery
   after forced campaign removal or grant revocation, and detailed observer visibility/presence.
   Campaign-member observation without session interaction is now confirmed.
3. **Taking turns — detailed work deferred:** player-selected Take turn and the Director equivalent are
   confirmed. Detailed eligibility, group timing, and interactions belong to the separate action-economy
   workstream.
4. **Action economy/resolution — deferred by user:** automatic application, reaction prompts, triggered
   actions, sequencing, end-turn pending work, and their action/undo boundaries need a separate design effort.
   Resume only when that workstream is taken up.
5. **Encounter boundaries:** transition from a harmful free-play action, rules-created
   combatants/reinforcements, objectives, defeat/escape, award recipients, and normal cleanup. The foes roster
   now supplies retained monsters for reuse. Director monster additions/removals during combat are confirmed.
   Refine their history/void-reset handling, in-flight operations, and interactions with recorded undo.
   Foes-roster management during pauses is already allowed.
6. **Session closure:** active encounters are now voided with the keep/reset choice; no encounter carries into
   a closed/new session. Refine interrupted-operation consistency and any specific historical information
   requiring a Director-only view. Campaign-wide history readership is confirmed by default. Closed sessions
   are permanently read-only in v1; resuming an indefinitely paused session remains available because it has
   not closed.

Respite is confirmed as a dedicated Director-started/ended gameplay loop; research its mechanics and possible
downtime relationship before detailing it. Montage tests and negotiations are confirmed distinct structured
table states; their detailed loops require separate design. V1 now includes the dedicated respite flow and
excludes montage/negotiation flows and downtime-project tracking; detailed respite rules and interface still
need design. Chat/game-log UI composition is also explicitly deferred; retain separate entities for v1 and the
possibility of a later combined curated feed.
