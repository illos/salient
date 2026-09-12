# Campaign sessions and the table

Version 0.54 — Combat/FreePlay baseline and accepted command syntax checkpoint, 2026-09-12. Specification; not an implementation report.

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
automatic prototype gates. FreePlay/combat specification is active; unresolved behavior is not authorized
for implementation. Playable retainers and friendly monsters are deferred beyond V1.

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

## Discussion boundary: FreePlay and combat baseline now active

The user prioritized baseline FreePlay and combat specifications before the tooling pilot or implementation
slice. The earlier discussion deferral has ended. Work through one manageable topic at a time, researching
the pinned sources before asking for product decisions. The [remaining-contracts list](#8-continue-exploring)
identifies what the recorded opening, layout and group decisions do not yet settle.

The [rules adaptation principles](rules-adaptation-principles.md) govern every operation: game-rule conflicts
warn without blocking otherwise authorized play; the Director can adjudicate; manual changes are recorded.
Missing facts and unsupported effects remain explicit unresolved work. Every used action exposes complete
verbatim source text and actual resolution through the shared log. Account permissions, private data,
session lifecycle and coherent state remain separate boundaries.

Basic action economy belongs in the connected v0.01 journey, with partial automation allowed. Detailed
budgets, interruptions, manual completion and undo/continuation remain open. In particular, no automatic
pause-to-prompt policy for triggered actions has been accepted. Documenting a proposal does not authorize
implementing it. The existing headless experiment is evidence, not the final combat contract.

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
| Initiative group | Combat participants organized to act within the same side activation. Group membership is distinct from the player controlling each creature; see the initiative-group contract below. |
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

The table UI will undergo substantial revision. The capability inventory below does not prescribe a frontend
framework; the confirmed combat layout that follows gives the current desktop baseline.

| Surface | Confirmed contents |
| --- | --- |
| Shared table | Party roster, online presence, dice roller, engine-driven activity, and game log. Existing text chat remains part of the table intent. |
| Director pane | Foes roster with catalog search/add, saved-encounter replace/append loading, a default-visibility toggle beside Add, and per-monster show/hide controls. Controls to run actions, including on behalf of any table character, present/call for tests, make rolls, load encounters, activate appropriate content such as traps, and search content. |
| Director character tab | Access to the active character sheets of session players, subject to the existing private-field policy. Viewing does not grant build-choice authority. |
| Session settings | Director controls to pause/end the session and add/remove session players when no encounter is active. During an encounter the party roster is locked. Resume is the proposed counterpart of pause. |
| Player pane | The participant's selected character sheet(s) and actions available in the current context. The presentation for switching among several characters remains open. |

### Confirmed combat layout

Confirmed 2026-09-11: **Director pane left, game log middle, heroes pane right**, with role-specific contents:

| Viewer | Left: Director pane | Middle | Right: heroes pane |
| --- | --- | --- | --- |
| Player | Revealed foes with the Director-configured health display. This is sufficient for the current baseline. | Shared game log. | The player's own character sheet dominates, with a compact party roster showing remaining Stamina and Recoveries. |
| Director | Foes roster and controls to add/remove monsters, including during combat under the existing anytime roster policy. | Shared game log. | Vertical list of players and their heroes' current Stamina, Recoveries and Heroic Resources. |

The player party roster's horizontal portrait row is a **provisional presentation preference**. The required
sheet prominence and party-resource overview are confirmed. Portrait interactions, switching among several
controlled heroes, group/turn indicators and ordering the Director's player/hero list remain open.

Existing privacy policies apply: the player overview does not grant peer full-sheet access or include peer
Heroic Resources, and hidden foes stay absent from player roster views. Group presentation must preserve
that audience boundary. Adding/removing foes remains available; their initiative effects require the
remaining combat contracts. Further pane detail can be added later.

This is a replaceable desktop baseline, not a mobile or visual-polish requirement. Initiative setup retains
its separate two-list layout. The user also accepted this three-pane baseline for FreePlay, with no active
initiative or turn tracking; see the FreePlay section below.

### Game log and chat scope

For v1, the game log is the main centerpiece. A later UI may choose not to expose it as a main surface;
durable recording remains required. Keep the shared operations independent of the visual log and panes.

#### Confirmed action and log contract

Confirmed 2026-09-11: the user establishes this as the way the table must work, not an optional UI proposal.

- All abilities, actions, effects, conditions and other table activity land in the game log as discrete,
  ordered entries. A card can present an entry and its related responses without losing their individual
  records or ordering. The log must reflect real operations and state changes, not just descriptive text.
- Every user-initiated operation carries attribution to the actual invoking user, separately from any
  acting character or Director context. Preserve attribution for requests, responses and adjudications.
  Automatic effects retain their originating action; do not invent a user invocation for engine activity.
- Anything requiring additional input, a choice, a response or adjudication partway through resolution
  surfaces as an inline **action card** (working title). Whenever one user prompts action from another,
  that interaction goes through an action card. This is the common mechanism, not a tests-only feature.
- Cards are user-aware and expose the controls appropriate to each viewer. Preserve the established
  scoped/open request behavior, Director authority, and contextual triggered-action availability.
- Every table UI button has a registered action accessible through the command palette. Buttons, slash commands,
  log controls and action cards invoke the same shared operations. A dedicated button is never the sole
  route to an action; UI redesign must not remove access to underlying functionality.
- Slash commands and action-card interactions reduce to structured headless operations that an agent or
  other programmatic caller can invoke. Starting an operation, inspecting pending input, supplying a
  response, and reading its applied results must not require a browser or rendered card.
- Short slash commands can open an action card with a small GUI that guides the available options.
  People need not type a complete complex invocation. Guided entry and direct input share the same
  operation; the exact preparation/submission interface remains to be designed.
- Table-state actions are included. `/encounter start type=combat` starts the formal encounter
  setup/initiative workflow through a registered action and its cards, preserving participant/group/
  surprise setup and starting-side choice. Director authority comes from authentication, not a typed prefix.
- Inline Director corrections append attributed adjudications and update affected state; Undo/Redo use
  their recorded history under the existing authority rules. Neither editing nor undo erases the record.

The user explicitly scopes this contract to the table where the game log exists, within supported release
scope. Existing privacy and access policies still govern what each viewer sees; a comprehensive action
registry is not universal permission. This decision does not require command registration, action cards
or game-log entries on account, campaign-management or other screens outside the table. Registered table
controls need not all invoke the rules engine.
The human command syntax baseline is accepted. Exact operation schemas, storage/order mechanism and
action-resolution dependencies remain open.
The [shared architecture contract](engine-architecture.md#command-registry-and-palette) owns execution boundaries.
The detailed [table command specification](table-command-spec.md) consolidates this conversation, the
source-backed command/argument inventory, guided-card behavior and the accepted human syntax baseline.

Confirmed extensibility refinement: this surface needs an API-like boundary through which other programs
and services can contribute activity and interactions. Its entries/cards are not limited to the built-in
UI or engine. Structured integration and existing authority/state/history boundaries remain; precise
payloads and transport are open. "Game log" is still a working name for this broader interaction surface.

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
populates it. If the roster is nonempty, show an action card with **Replace current roster** and **Append to current
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
identities and state on append. Canceling the replace/append card changes nothing, and validate the load
before committing replacement. Preserve historical references after removal. Apply the show/hide boundary to
observers as well as players through authorized audience projections. Provisional user decision: a hidden
foe's name is not concealed in game-log entries when it acts. Its roster entry remains hidden; a named log
entry does not reveal its full stat block or automatically toggle roster visibility. Visibility alone does not
establish a secret-roll mode; the public/tower result-audience rules remain separate.

Open: the history/void-reset treatment of monsters added or removed after encounter start. Director
additions/removals during combat are confirmed. Their detailed turn, pending-action, squad, and summon
interactions remain open in the active rules/resolution workstream; friendly-monster play is post-V1 work.

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

These presentation/access proposals do not settle action-economy behavior.

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
decision does not settle action-economy behavior.

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
| Running, free play | No structured activity is active. Authorized participants can use applicable abilities, make tests and record resource/state changes. Apply the relevant outside-combat rules; this mode is not a blanket exemption from costs or restrictions. |
| Running, combat encounter | Track combat groups, individual turns, resources and effects. Rule conflicts follow the warn-without-blocking policy; missing facts remain unresolved. Exact action/turn sequencing still needs the contracts below. |
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

### FreePlay baseline and combat transition

Confirmed: FreePlay is the running table's state when no structured activity is active. Players can use
their available character operations, the Director can call for tests and operate roster foes, and accepted
changes belong in the game log and live state. Existing source disclosure, manual play, authority, pause
and privacy policies apply.

Confirmed FreePlay presentation, 2026-09-11: use the same role-specific three-pane table as combat—Director
pane left, game log middle, heroes pane right. Character sheets and rosters remain available, with no
active initiative or turn tracking. The user accepted this as sufficient for now; finer presentation can
evolve later. This layout choice does not settle how tests, abilities or other FreePlay actions resolve.

Confirmed app boundary: only the Director formally starts a tracked combat encounter. The source expectation
that harm initiates combat does not mean the app automatically opens combat when an action is selected.
How the initiating declaration is warned, retained, resolved manually or carried into initiative remains
open. Do not silently grant outside-combat benefits just because the app has not entered combat tracking.

Pinned source context, not a completed FreePlay implementation contract:

- [Combat Round, When Does Combat Start?](../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md)
  places combat before an intended harmful action and expressly rules out a cost-free opening heroic attack.
- [Ferocity Outside of Combat](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md)
  supplies class-specific cost and reuse rules. FreePlay cannot be modeled as either ordinary combat
  resource spending or unrestricted free use of every ability.
- The [Director chapter, Hazard Effects](../vendor/steel-compendium/en/unified/md/chapter/for-the-director.md#hazard-effects)
  explicitly describes noncombat hazards. Its relationship to Combat Round's broad environmental-threat
  wording needs case-specific adjudication; every damage entry is not an established automatic transition.

Remaining FreePlay contracts include requesting/resolving tests, supplying facts and targets, spending
Recoveries, tracking ability reuse and elapsed fictional time, and corrections/undo without a turn boundary.
Research ordinary rule expectations before asking for decisions about their table interaction.

Confirmed test initiation, 2026-09-11: [How to Make a Test](../vendor/steel-compendium/en/unified/md/rule/test/test.md)
describes the Director calling for a test, choosing its characteristic/difficulty and interpreting the
reported result. The user accepted the app interaction: support a Director-requested test and let a player initiate a
test roll directly from their character sheet, with recorded inputs/results and Director adjudication
retained. Both players and the Director can initiate rolls. This does not supply missing difficulty,
decide success or establish automatic narrative consequences.

The [confirmed action contract](#confirmed-action-and-log-contract) requires registered table commands
shared by buttons, the palette, action cards and headless execution. The human syntax baseline was
accepted on 2026-09-12; detailed grammar and schemas live in the [command specification](table-command-spec.md).

```text
@Thorn /test roll characteristic=might skill=climb
@Thorn /ability use ability="Brutal Slam" targets=[@Goblin5]
@Elwin /ability use ability="Healing Grace" targets=[@self]
/test request characteristic=might actors=[@Thorn]
```

Authenticated issuer, acting character, ability and targets are distinct. Attribution may display
`Jon@Thorn: …`, but the user name is not executable input. `@self` means the selected acting character,
including when the Director acts for that character. Autocomplete binds visible names to stable instances;
ambiguous names need disambiguation. Target selection supplies neither unknown range nor line of effect.
Multiple-target syntax is accepted; detailed geometry, allocation and target-change interactions remain open.

The composer automatically populates `@Thorn` during Thorn's individual initiative turn. The selector
remains editable for reactions or Director actions; it grants no additional control permissions. Defaults
outside an identified individual turn, including FreePlay and combined hero groups, remain open.

A requested test creates an inline action card rather than rolling immediately. For Thorn, the card
provides a Roll control to the eligible controller while preserving Director acting authority. It can
include the agreed skill's +2. A recommended detail is to label and retain the selected skill, not merely
the numeric bonus. The request and response share headless operations and retain actual requester/roller
attribution. Table agreement about a skill does not create an in-app approval gate. Difficulty visibility,
request editing/cancellation and open-request response counts remain unresolved.

### Inline interaction cards in the game log

Confirmed direction: inline cards support actions that need an intermediate choice or response, including
optional reactions. The engine can identify a supported response opportunity and surface a card. Cards
are user-aware: viewers receive the controls appropriate to their authority and the requested character.
This establishes the interaction surface, not a complete trigger detector or rules timing contract.

Confirmed request scope: `actors=[@Thorn]` on the Director's test request scopes the roll to Thorn;
Thorn's eligible controller can respond for Thorn. Omitting the `actors` argument makes the request
active for everyone eligible to participate. Existing Director authority to act for characters remains,
and the standing observer prohibition is not silently widened by this example. Open response scope does
not itself settle whether the request accepts one volunteer or separate rolls from multiple characters.

Recommended continuation model: retain an identified pending interaction linked to its originating action;
record responses and show the resulting resolution in the log. Headless callers inspect and answer that
same interaction. For optional reactions, offer an explicit decline/pass path. Which effects wait or commit,
multiple responders/reactions, ordering, expiry/cancellation, and undo across a pending interaction remain
open. Shared card presentation must preserve existing private-data boundaries. Detection is limited by
supported rules and available facts; manual play must remain possible for undetected opportunities.

Confirmed triggered-action presentation: when the engine detects an applicable triggered action from
another participant's action, the eligible controller sees a call to action on that originating inline
entry. It remains active while the specific opportunity is valid, then becomes inactive when its conditions
or timing window have passed. This is a contextual opportunity, not a permanently reusable ability button.

Source grounding: [Triggered Actions and Free Triggered Actions](../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md)
requires the specified trigger, distinguishes the ordinary once-per-round allowance from free triggered
actions, and supplies ordering when several respond to one trigger: player-controlled creatures decide
their order, then the Director orders their creatures' responses. The card design does not replace those
rules with first-click-wins ordering or establish a universal response duration.

Recommended implementation contract: tie opportunity validity to recorded game events and action phases,
not an arbitrary wall-clock countdown. Revalidate a response against current state and distinguish use,
pass and closed-window states in the log. Preserve authenticated responder/acting-character attribution,
Director acting authority and shared headless access. Inactivating the ordinary response control must not
silently remove the existing warned manual-adjudication path for late or undetected actions. Exact phase
boundaries, progression while responses are pending, simultaneous responses, and reopening/invalidation
after correction or undo remain open. Unknown trigger facts must remain explicit rather than being guessed.

User clarification: the intended window is event-based. Creature X performs Y, opening an applicable
triggered-action opportunity; when that creature's turn ends, the unused opportunity closes. No elapsed-time
countdown is intended. Record this as the requested app window, not a source claim that every triggered
action may legally be delayed until turn end. Ability-specific timing may require intervention before an
effect completes: for example, [Lines of Force](../vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/lines-of-force.md)
triggers when its target would be force moved. How the requested turn window handles already-applied
effects and such earlier timing remains open. Do not replace the user's turn-end boundary with an
unaccepted generic timeout or require a response from every player to end a turn.

### Director edits to inline results

Confirmed placement: an Undo button accompanies inline results, under existing player/Director undo
permissions. Recommended granularity from the discussion, not yet independently confirmed: undoing an
adjudication restores the prior result; undoing the original action reverses its applied effects. Preserve
history and recorded-result redo. Detailed dependency handling remains open.

Confirmed user requirement: the Director can modify results inline in the game log. In the user's
hypothetical example, Thorn's ability deals 14 damage to Boblin; the Director can click and edit the
displayed result, or apply an edge/bane using inline controls. Pressing Enter on the edited line submits
the correction, reinterprets the affected resolution, updates affected live character/foe state, and appends
a Director adjudication entry to the log. The ability name and 14 damage are illustrative, not verified
mechanics for a particular ability. Existing running-session and closed-history policies still apply.

Source distinction: [edges](../vendor/steel-compendium/en/unified/md/rule/dice/edge.md) and
[banes](../vendor/steel-compendium/en/unified/md/rule/dice/bane.md) modify a power roll's total or outcome
tier, rather than directly adding/subtracting damage. One gives +2/-2 to the roll; double edge/bane instead
shifts the tier. Apply the source cancellation rules as well. A recalculated tier may change damage and
other effects. The user's suggested +2/-2 controls express edge/bane intent, not unlimited additive damage.

Recommended presentation and correction contract, pending detailed design:

- Show editable roll inputs separately from editable resolved damage. Label controls Add edge/Add bane
  with the actual applicable adjustment; do not imply every additional edge means another +2.
- Changing roll modifiers re-evaluates the outcome using the accepted dice, without rerolling. Directly
  editing damage records a manual effect override rather than reverse-engineering a different dice roll.
  Interaction between an existing manual override and later modifier edits remains open.
- Replace the prior applied effects coherently; do not apply the corrected full damage a second time or
  overwrite a sheet with an obsolete snapshot. Preserve original and revised values, inputs, affected
  targets and the actual adjudicating user in linked history. Submit through the same headless operation.
- Later dependent actions, reactions, defeat transitions and pending cards can be affected. Exact
  invalidation/reconciliation and correction ordering still need a concrete walkthrough; do not silently
  replay later choices or reroll dice. A new correction can invoke the engine; undo/redo still restores
  recorded states without re-executing rules or dice.

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

Confirmed opening refinement, 2026-09-11: entry into a tracked combat encounter is always an explicit
Director operation. The user describes starting an encounter as a formalized process beginning with the
initiative roll. Selecting a FreePlay action does not automatically start the app encounter. The existing
rule-warning/manual-adjudication policy still applies; remaining handling of an initiating action is open.

Opening source context: [Determine Surprise](../vendor/steel-compendium/en/unified/md/rule/combat/surprised.md)
precedes starting-side determination in the pinned Heroes book. [Combat Round](../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md)
sometimes determines the starting side without a roll; otherwise the d10 determines who chooses the
starting side. The user accepted handling surprise within the opening step and rolling when needed;
no unconditional-roll exception is established by describing the ordinary roll-card path below.

Source expectation for the surprise toggle: a surprised creature remains surprised until the end of the
first combat round, cannot take triggered or free triggered actions under the rules, and grants an edge
to ability rolls made against it. Surprise does not remove its ordinary turn. Apply the existing
warning/manual-adjudication policy to rule departures. Only selected combatants count when assessing
whether a side is entirely surprised; an excluded roster creature cannot change the initiative outcome.
Actual application and expiration of these effects remain part of the turn/round contract.

The ordinary source procedure covers a roll when both sides have unsurprised creatures, or a first side
determined by surprise when exactly one side is entirely surprised. Both sides entirely surprised or an
empty side do not have a source-established default in this procedure. Preserve explicit adjudication
instead of inventing a roll result or automatic starting side for those cases.

### Confirmed initiative setup and shared presentation

The user's opening walkthrough, 2026-09-11:

Confirmed presentation refinement: these steps live in a staged **action card in the game log**, not a
separate undefined dialog. The Director receives setup controls; other viewers receive the appropriate
status and response controls under existing privacy/authority. Its phase changes and accepted responses
retain discrete ordered log records even when presented as one continuing card.

1. The Director invokes encounter start, opening the setup phase of the action card. Populate two side-by-side lists from the heroes roster and foes
   roster, initially including their contents.
2. The Director can quickly toggle **Surprised** on individual creatures and remove anyone who will not
   participate from initiative. This is selection for this combat, not deletion from the persistent rosters.
   The Director also organizes initiative groups on either side, including combining heroes; the default
   remains one hero per group.
3. The Director clicks **OK**. On the path that requires a roll, everyone at the table sees a shared
   **Roll initiative** phase of the action card, and anyone can click **Roll**. A separately nominated roller is not required
   for this encounter-opening interaction. This user-selected interaction is distinct from the source's
   Director-or-chosen-player wording; it does not establish permissions for other roll types.
4. After the roll, the winner chooses **Heroes first / Foes first**: 6+ awards the choice to the players,
   and 1–5 awards it to the Director. The user confirmed this choice step before the announcement.
5. The table receives the announcement of which side goes first and enters the combat encounter view.

Confirmed Director-doctrine clarification: the Director can choose the starting side even when the roll
awards the choice to the players. Keep the choice control available to the Director on either result;
no player approval or delegation is required. Preserve the roll's source-defined entitlement separately
from the actual choosing user and accepted starting side in the recorded opening. This is an explicit
application of the existing Director table authority, not a change to what the d10 result means.

Confirmed: any participating player can submit **Heroes first / Foes first** when the players win,
with Director access retained. The roller's identity does not determine
which side wins the choice. Concurrent submissions must not create conflicting accepted starting sides;
later correction is separate from duplicate delivery.

The user's "anyone can click roll" establishes an open shared-roll interaction. Whether this specifically
includes observers remains to be reconciled with the existing observer prohibition on session rolls; do
not silently broaden observer access through this description. All may see the public roll. Also retain
the established hidden-foe and private-stat-block policies when projecting the shared action card.

Engineering requirement for the eventual shared operation: concurrent clicks produce one accepted opening
roll, shared by everyone. Exact lock/snapshot timing within setup and handling roster changes while setup
is open remain to be defined. No initiative operation or new automatic result is implemented here.

### Initiative groups: confirmed app model

Confirmed 2026-09-11: use **initiative groups** on both sides of combat. The user explicitly identifies
the general hero-side grouping concept as application functionality; it is not claimed as a named core
hero-side rules system. The term also matches the Monsters book's **Build Initiative Groups** section.
Reserve **squad** for the specific minion rules unit.

**V1 scope clarification:** implement initiative groups and multiple-hero control, but defer playable
retainers and friendly monsters beyond V1. Keep the grouping model extensible to those actors without
implementing their control, attachment or special mechanics now. Their source research below informs that
future extension; it is not a V1 acceptance requirement. Readable core-reference coverage remains separate.

- In V1, each hero is automatically placed in their own initiative group. One player may control multiple heroes; those
  heroes remain separate actors and separate default groups. Multiple-character control was already
  required; this supplies its missing initiative organization.
- Only the Director can change hero grouping in V1, including combining multiple heroes into one group
  during initiative setup. Players do not create or edit initiative groups. This preserves the automatic
  one-hero-per-group default and does not settle regrouping during active combat.
- For the later retainer feature, an attached retainer belongs to their hero's initiative group by default.
  Preserve the ability to distinguish the mentor relationship from arbitrary group membership.
- In V1, the Director creates enemy initiative groups and adds monsters to them.
- Preserve a future path for player-controlled retainers and other friendly monster stat blocks on the
  heroes' side. Their implementation is deferred beyond V1; avoid tying allegiance or control to whether
  an actor uses a hero sheet or monster stat block.
- Participants within a group act together for the purpose of the side's activation before handing play
  to the other side. Grouping does not merge creatures' action allowances, health, conditions or ordinary
  resources. Apply any specifically sourced sharing, such as minion Stamina pools, separately.

Keep **controller**, **creature**, **side**, and **initiative group** distinct. The Director retains their
established ability to act for player-controlled creatures. Assigning a group alone does not grant access
to another user's character. After V1, how a player receives control and usable stat-block access for an
allied NPC will need a concrete contract; enemy-stat-block privacy is not a reason to make authorized ally play
impossible, and ally control does not disclose unrelated enemy data.

#### Source expectations and timing distinctions

Verified against core Heroes/Monsters at Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`:

- [Monster Basics, Step 6: Build Initiative Groups](../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#step-6-build-initiative-groups)
  recommends, without a solo, roughly as many enemy groups as heroes, plus or minus one or two. It also
  recommends group EV around the encounter strength of one to two heroes, with stated exceptions. These
  are encounter-building guidelines, not exact-count requirements or new hard app gates.
- [Combat Round, Enemies Act In Groups](../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md#enemies-act-in-groups)
  explicitly has the Director choose one creature or minion squad, complete its turn, then choose another
  in the group, until its members have finished. The Director chooses member order as each next turn begins;
  the group does not need a predeclared internal order under this ordinary rule. Each ordinary creature
  retains its own turn and boundaries. Thus a group of A, B and C may take B's whole turn, then A's whole
  turn, then C's whole turn. It cannot, solely because they share a group, begin B's ordinary turn, take
  A's ordinary actions, and then resume B's unfinished turn.
  The Monsters book's broader "acting on the same turn" wording describes the group's place in the
  alternating order; the explicit Heroes procedure establishes successive member turns. After the group
  finishes, ordinary play passes to the other side if it has remaining turns. If that side is exhausted,
  the remaining side finishes its turns under Combat Round's rule. This normal monster sequence was
  independently re-researched at the user's request; how the app starts/ends each turn still needs its
  interaction contract, and applying this timing to combined hero groups remains a separate app decision.
- [Retainers, Retainers in Combat](../vendor/steel-compendium/en/unified/md/chapter/retainers.md#retainers-in-combat)
  gives a retainer their own actions but makes the mentor's turn start/end also the retainer's start/end.
  The player may still control the retainer if the mentor cannot act. This differs from the separate turn
  boundaries of ordinary enemy group members. Detailed action interleaving is not explicitly settled by
  that passage; do not infer it from the app group abstraction.
- The [Retainers introduction](../vendor/steel-compendium/en/unified/md/chapter/retainers.md) limits active
  retainer control to one retainer per **player**, not one per hero. When retainers are implemented, preserve
  that source expectation as a warning when exceeded, under the existing deliberate-departure policy.
- [Organized as Squads](../vendor/steel-compendium/en/unified/md/rule/monster/squad.md) permits squads of up
  to eight same-name minions. [Acting Together](../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#acting-together)
  gives them shared-turn and coordinated-action mechanics. A squad may act within an initiative group;
  arbitrary group membership does not create a squad or its shared Stamina/attack rules.
- [Attached Squad Captain, Separate Actions and Stamina](../vendor/steel-compendium/en/unified/md/rule/monster/captain.md#separate-actions-and-stamina)
  specifically has a captain take their turn at the same time as their squad, with separate action options
  and Stamina. Preserve that exception rather than treating captain/squad timing as ordinary group timing.
  Applicable [triggered actions](../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md)
  and specific ability exceptions can also occur during another creature's turn; successive ordinary
  turns are not a ban on those responses or on recorded deliberate departures.
- [Sides, NPC Allies](../vendor/steel-compendium/en/unified/md/rule/combat/side.md) places allies on the
  heroes' side and recommends players receive and run an allied NPC's stat block. Being friendly does not
  automatically make that NPC a retainer or grant mentor-linked timing.

For example, one player controlling heroes A and B starts with groups A and B; the Director may combine
them during setup. In a future retainer example, a retainer attached to A joins A's group by default.
Twelve ordinary enemies could be arranged as four groups of three,
with each group completing its members' turns before handing over. That illustrates cadence only; actual
group composition should consider EV and specific creature rules, not just headcount.

Confirmed setup interaction: expose Director-only group organization on both sides before OK, retaining
individual surprise and participation controls. Hero groups are created automatically; their membership
can only be changed by the Director in V1. Unattached friendly NPC grouping is later work with that
deferred feature. Specific extra-turn rules,
regrouping/reinforcements during combat, within-group interruptions and
undo still need contracts. A single group-level "acted" flag is not a complete turn model.

### Overall encounter sequence

Confirmed product sequence, subject to the rules notes below:

1. **Prepare participants:** the Director selects heroes and existing monsters from the foes roster, retaining
   their current values. Saved encounter loads create independent roster instances under the catalog/data
   specs. Preparation and loading do not by themselves establish that initiative has begun. Starting the
   encounter locks the party roster and participating character sheets against editing; capture the starting
   gameplay state before encounter-start mechanics so a later void can restore it. Encounter actions update
   the main sheets immediately.
2. **Determine the starting side:** the Director initiates the opening procedure. Record dice and any required
   choices or exceptions.
3. **Choose who acts:** the ordinary path lets a player choose **Take turn** for a character they control
   on the acting side, and lets the Director do so on their behalf or choose an enemy group. Initiative-group
   membership must be respected; how a hero's Take turn activates its group and selects subsequent members
   remains open. Evaluate source eligibility separately from the deliberate warned-departure path.
4. **Take the turn:** track the actor's actions and source-defined allowances, with warned departures and
   manual adjustment available under the adaptation principles. They may choose to end the turn
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
award Victories or apply any other encounter-ending benefits or consequences. The action card asks whether to:

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
- Present both choices explicitly; canceling the action card leaves the encounter unchanged. Before committing,
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

A player choosing Take turn does not require a separate Director approval step. The ordinary path follows
the acting side and source-defined eligibility. Deliberate game-rule departures remain available with
visible warnings under the adaptation principles; rule eligibility is not an application permission gate.
The same operation is available to the Director on behalf of that character. Access, running-session and
coherent-state requirements still apply; a departure is not permission to fabricate concurrent active turns.

With initiative groups, the existing character-level Take turn control is only part of the interaction.
The group activation, ordering of its member turns, handoff between different controllers and group-ending
step need a concrete contract. Successive ordinary hero turns within a group are a recommendation for
discussion, not yet an accepted timing rule. Do not infer shared start/end boundaries from group membership.

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
| Alternation and groups | Combat Round allows the remaining side to finish its unspent turns when the other side is exhausted. Ordinary enemy group members take successive creature/squad turns before passing sides. See [initiative groups](#initiative-groups-confirmed-app-model) for verified construction guidance, squad/retainer distinctions and the confirmed app extension to both sides. Detailed sequencing remains open. |
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
- Free play supports a sourced ability, applicable resource handling, and a Director-requested test with
  recorded results. A harmful declaration follows the agreed warning/adjudication path and explicit
  Director start; selecting it does not automatically start tracked combat.
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

Review checkpoint, 2026-09-12: the opening flow, three-pane role layout, group defaults, Director
authority and command/action-card foundation are recorded. Human command syntax is accepted. The full FreePlay/combat baseline is not complete. The following gaps concern
playable behavior, not a demand for more visual polish or whole-book automation.

### Next baseline contracts

| Topic | Missing behavior / useful concrete example | Work needed |
| --- | --- | --- |
| Group and creature turns | Two heroes with different controllers share a group: who starts it, which creature acts first, how the next member takes over, and what ends the group? Track actor-specific start/end effects and action allowances. Switching among a player's controlled heroes must be usable. | Product interaction and sourced timing. Successive ordinary hero turns are a recommendation, not yet confirmed. |
| FreePlay | Use an ability or request a test, supply targets/facts, record damage/healing/Recoveries and manual changes, track outside-combat reuse and fictional time, and handle a harmful declaration before Director-started combat. Define action interactions and undo scope; the shared three-pane layout is confirmed. | Rules research plus product workflow; existing permissions and manual-play philosophy are settled. |
| Opening completion | Define when setup commits participants/groups/surprise, captures pre-start values, locks character editing and applies combat-start effects. Distinguish canceling setup from voiding an encounter; preserve accepted roll/choice through pause or reconnect. | Concrete engineering lifecycle proposal; surface only user-visible tradeoffs needing a decision. “OK” alone does not establish every ordering detail. |
| Action resolution | Select an action and targets, supply spatial facts, accept costs/dice, apply supported effects, offer triggered actions and record manual/pending work. Establish which independent work may proceed and how completion avoids double application. | Sourced worked example and product decisions, especially interruption/continuation. Contextual trigger cards are accepted; exact detection, commitment and response-order contracts remain open. |
| Resources, conditions and round boundaries | Define encounter/round/turn grants and resets for the chosen hero/foe, surprise application/expiry, ongoing effects, saves and defeat handling. Source ordinary rules; retain per-creature timing inside groups. | Bounded research and shared-state contract. Surprise does not skip the creature's ordinary turn. |
| Correction and changing combat | A second controller acts, an earlier result is corrected/undone, or the Director adds/removes a foe from the active group. Preserve spent actions, dependent effects and retained history. Define group/side handoff after interruption and possible regrouping. | Product decisions plus engineering. Foe management and Director authority are already allowed; do not reopen them. |
| Encounter end and return to FreePlay | Record Director completion, applicable Victories and end effects, resolve/cancel outstanding work, clean defeated foes and retain survivor/current hero state. Exercise keep/reset void and session closure separately. | Source research and ordering contract; normal ending, void choice and closed-session immutability are already settled. Inventory/loot is excluded from v0.01. |

The user accepted FreePlay's shared layout and both player/Director test initiation. The common command model, palette, action cards and headless execution are checkpointed, including
accepted human syntax. Detailed action interactions remain next work on resumption.
Group/member-turn controls and a sourced Fury action remain subsequent walkthroughs; ordinary monster-group
timing is source-resolved, while applying that timing to combined hero groups remains an app decision.

### Smaller opening and visibility questions

- The shared Roll control is open to participants; whether the user's “anyone” explicitly includes observers
  remains an unresolved exception question. Until settled, do not silently override the existing observer
  prohibition on session actions.
- Starting enemy group membership is not prescribed: manual construction is confirmed, but singleton
  defaults, suggested balanced groups and persistence between encounters are not. No exact group-count or
  EV limit should become a hard gate.
- Both sides entirely surprised or an empty side require explicit adjudication rather than an invented
  ordinary initiative result. Group membership does not replace individual surprise.
- Group/active-turn presentation must respect hidden foes. Show/hide does not disable their gameplay, and
  their names already remain visible when used in game-log entries; broader group disclosure is not implied.

### Follow-ups when their scope is selected

- **Minions:** distinct squad construction, shared Stamina, captain relationships and action sequencing are
  needed when minions enter the playable slice. An ordinary non-minion foe does not depend on this work.
- **Fuller V1:** special extra turns, respite lifecycle, saved-template initiative-group persistence, inventory
  wrap-up, forced-access-change recovery and richer sharing need their relevant contracts. Their presence in
  this spec does not turn all of them into prototype gates. Standalone void while paused remains open.
- **After V1:** retainers and friendly-monster control/attachment and timing; dedicated montage/negotiation
  flows, downtime projects and nested activities. Keep the accepted extension boundaries.

Engineering verification remains separate from product decisions: duplicate commands and concurrent clicks
must not reroll or apply effects twice; authorized headless and UI clients must read the same persisted
outcome. Tests and independent rules review follow once a bounded behavior is implemented. Neither this
cleanup nor a source citation certifies the existing experiment as the completed combat system.
