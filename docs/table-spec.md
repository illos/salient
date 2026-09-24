# Campaign sessions and the table

Version 0.60 — Consistency audit (v0.01 vs V1 labels, stale open items), 2026-09-14. Specification; not an implementation report.

This is the primary checkpoint for session participation, the table's role-dependent surfaces, and the core
play loop. **Confirmed** behavior comes from the user's table walkthrough. **Proposed** contracts and **open**
questions are identified separately. The combat sketch expresses intended workflow; mechanics must follow
verified Draw Steel rules rather than treating the sketch as a rules variant.

Related specifications: [access](accounts-and-access-spec.md), [characters](character-wizard-spec.md),
[data/history](data-architecture-spec.md), [monster catalog](monster-catalog-spec.md),
[dice](dice-roller-spec.md), [engine](engine-architecture.md), and [v1 tech stack](v1-tech-stack-spec.md).

**Immediate milestone:** the [v0.01 checkpoint](pre-alpha-design-gaps.md) controls feature delivery. Use a
temporary desktop UI with a visible game log, a minimal hero and direct catalog-to-foes-roster loading.
Campaign chat, saved encounter templates and inventory/loot are deferred. Foe hiding is also deferred:
all loaded foes are visible, with no hide/reveal or Add visibility controls; see [visibility](#monster-visibility-and-health-display). The creator serves as Director;
player-to-player character-control sharing and Director delegation are deferred. Relevant table text remains
readable under existing visibility rules. Broader surfaces and acceptance examples below describe V1, not
automatic prototype gates. FreePlay/combat specification is active; unresolved behavior is not authorized
for implementation. Playable retainers and friendly monsters are deferred beyond V1.

**Combat scope confirmed, 2026-09-13:** [the G4 acceptance checklist](pre-alpha-design-gaps.md#v001-combat-acceptance-checklist)
is complete. Require the full opening and ordinary hero/foe turn flow; settled roster targeting;
fixed costs/affordability; supported damage and manual adjustments; the clock and supported scheduled
work (saves for simple condition toggles are manual under the 2026-09-14 refinement below);
sequential undo/redo; formal closeout; Void keep/reset including while paused; and basic public direct
test rolls with dice/modifiers/total interpreted by the Director. Complete used-action source text
and actual recorded work remain required in the log.

Minion/captain/pooled-Stamina mechanics, boss extra-turn mechanics, dynamic terrain objects,
persistent area cards, broader inline attack-result editing (except the later per-target edge/bane additions), optional enhancement cards, failed-save
hero-token follow-up, automatic response reconciliation, dedicated respite/out-of-combat fictional
time and more elaborate automated test workflows are deferred beyond v0.01. Preserve the basic
noncombat table, state continuity and existing authority/privacy/history boundaries. Detailed future
contracts below remain valid design.

**Current runtime boundary, 2026-09-14:** v0.01 establishes common game operations before
class/stat-block-specific execution. Defer automatic class resources (including the earlier
turn-start Ferocity inclusion), unique traits/triggers and individual ability effects. Resolve
them manually from source text, with actual changes recorded through shared operations. Keep
the common G4 foundation, Malice lifecycle and ordinary-foe Slain status. Known action costs and
accepted roll/damage inputs can use common handlers without requiring whole-ability interpretation.
See [game basics first](pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope).

G5 scope update, 2026-09-13: hero-dying automation is deferred beyond v0.01, including its bleeding
consequences and Catch Breath warning. Retain recorded Stamina, including negative values, winded
display and manual resolution through logged adjustments. This is not automatic hero death at zero;
ordinary-foe defeat and other condition sources remain separate. See
[the scoped decision](fury-goblin-automation.md#hero-dying).

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
normally warn without blocking otherwise authorized play; the confirmed insufficient-resource exception
blocks an unaffordable ability. The Director can adjudicate; manual changes are recorded.
Missing facts and unsupported effects remain explicit unresolved work until resolved through supported
inputs or the recorded manual-resolution path. Every used action exposes complete
verbatim source text and actual resolution through the shared log. Account permissions, private data,
session lifecycle and coherent state remain separate boundaries.

Basic action economy belongs in the connected v0.01 journey, with partial automation allowed. Later dated
rulings in section 5 settle sequential undo/redo, Resolved-at-table manual completion, the standing prompt
window and interrupted-turn resumption; source-specific budgets and continuation details remain open. No
automatic pause-to-prompt policy for triggered actions has been accepted (Lines of Force uses apply-then-revise). Documenting a proposal does not authorize
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

User decisions (2026-09-20, campaign home): a session has an **optional title** set by the Director; the
campaign home lists sessions as `Session n · title` (number only when untitled), with the selected
players and a relative date, and the header reads `Session n · last played …`. There is no session summary
line. A **recap** is a later abstraction over the game log, party chat and Director notes; until it is
designed, RECAP opens that session's game log, which every member may already read under the default
above. Implementation note (V68): the title is campaign metadata, not session history, so the Director may
set or change it on any session including a closed one; this is an interpretation of "closed sessions are
permanently read-only" as applying to gameplay records, recorded here for review.

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

Confirmed roster-management timing: **when the session is paused, both rosters are locked**. No session-player
or selected-character changes, foe additions/removals, regrouping, or saved-encounter loads are permitted until
resume. This supersedes the earlier permission to edit rosters while paused. Outside a pause, party changes
require no active combat; the Director can manage foes between sessions and during running combat. The
encounter builder remains the reusable preparation tool. Monster gameplay actions require a running session,
and closed session history remains read-only.

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

User decision (2026-09-20, campaign home): connected-member presence is built now, not deferred. The
campaign home shows which members are currently connected (member cards and the chat header count), and
the future session screen reuses the same record. Implementation note (V68): presence is a Convex-backed
per-campaign heartbeat written by connected clients on campaign surfaces; a member counts as online while
their last heartbeat is fresher than the recorded threshold, which the slice work log states. Presence
grants nothing and changes no session state, exactly as the paragraph below requires.

The roster shows who is playing and who is online. Connection status does not itself select a participant,
grant character access, remove a participant, finish a turn, pause the table, or close the session. Authorized
players retain their available gameplay operations when the Director is offline; Director-only operations
still require Director authority. Session selection does not duplicate a character or bypass its campaign
admission. Several controlled characters remain distinct actors.

Removing someone through session settings removes session participation; it does not implicitly kick them from
the campaign or detach their characters. The owner retains the separate campaign membership powers in the
access spec. Ordinary player/character roster changes are blocked during an encounter, including while that
encounter is paused. End or void it before changing the roster, subject to the separate pause lock. During
running combat the foes roster does not lock: the Director
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
| Director pane | Foes roster with catalog search/add. V1, deferred beyond v0.01: saved-encounter replace/append loading, a default-visibility toggle beside Add, and per-monster show/hide controls (all loaded foes are visible in v0.01). Controls to run actions, including on behalf of any table character, make test and other rolls, activate appropriate content such as traps, and search content. |
| Director character tab | Access to the active character sheets of session players, subject to the existing private-field policy. Viewing does not grant build-choice authority. |
| Session settings | Director controls to pause/end the session and add/remove session players when no encounter is active and the session is not paused. Combat locks the party roster; pausing locks both rosters. Resume is the proposed counterpart of pause. |
| Player pane | The participant's selected character sheet(s) and actions available in the current context. The presentation for switching among several characters remains open. |

### Confirmed combat layout

Confirmed 2026-09-11: **Director pane left, game log middle, heroes pane right**, with role-specific contents:

| Viewer | Left: Director pane | Middle | Right: heroes pane |
| --- | --- | --- | --- |
| Player | Revealed foes with the Director-configured health display (in v0.01 every loaded foe is revealed; hiding is V1). This is sufficient for the current baseline. | Shared game log. | The player's own character sheet dominates, with a compact party roster showing remaining Stamina and Recoveries. |
| Director | Foes roster and controls to add/remove monsters, including during running combat. Roster edits are blocked while paused. | Shared game log. | Vertical list of players and their heroes' current Stamina, Recoveries and Heroic Resources. |

The player party roster's horizontal portrait row is a **provisional presentation preference**. The required
sheet prominence and party-resource overview are confirmed. Portrait interactions, switching among several
controlled heroes, exact group/turn indicator design and ordering the Director's player/hero list remain open.
The player-sheet turn affordances below are confirmed; their visual styling remains provisional.

Existing privacy policies apply: the player overview does not grant peer full-sheet access or include peer
Heroic Resources, and hidden foes stay absent from player roster views (V1 hiding, deferred beyond v0.01).
Group presentation must preserve that audience boundary. Adding/removing foes remains available; their initiative effects require the
remaining combat contracts. Further pane detail can be added later.

This is a replaceable desktop baseline, not a mobile or visual-polish requirement. Initiative setup retains
its separate two-list layout. The user also accepted this three-pane baseline for FreePlay, with no active
initiative or turn tracking; see the FreePlay section below.

**User decision, 2026-09-15 (desktop presentation):** the V1 mockups' desktop layouts are binding
for this pane structure; see the [mockup README](design-mockups/v1/README.md) and the
[design fidelity audit](build/audits/2026-09-15-v1-design-audit.md). Three further decisions from the
same thread:

- **Director rosters are compact cards on both sides.** In the Director's view, foes and heroes use
  the same compact card style showing the resources this section already lists: Stamina (current,
  maximum, temporary), Recoveries, Heroic Resource and the hero's other point pools, with the health
  bar and reticle from the mockup rows. Clicking a card replaces the content of that pane's roster
  section with the full character sheet or monster stat block for that creature, with a control to
  return to the roster. This is a drill-in that replaces the roster section, not an accordion that
  expands a row in place. The player's pane keeps its selected-sheet prominence; the compact party
  roster uses the same card style.
- **Table settings move to a settings pop-up.** Campaign presentation settings (monster health
  display mode, Show Malice, Show test difficulty, and later settings of the same kind) leave the
  Director pane and open in a dedicated settings menu that uses the same centered card, blurred
  backdrop and dismissal behavior as the [app-wide rule cards](reference-library-spec.md#app-wide-rule-cards).
  The settings remain registered operations; the pop-up is presentation only.
- **The provisional horizontal portrait row** for the player party roster and the exact turn
  indicator design are resolved by the mockups: the combat mockups' ring-portrait row with resource
  badges and an Acting label, and the segmented initiative bar, are the target presentation.

**User decision, 2026-09-16 (desktop review of the built layout):** two further placements, recorded
in [V29](build/V29-desktop-feedback.md).

- **Enable user undo belongs in the settings pop-up; Rewind and Redo stay in the table.** The
  campaign setting becomes a switch row of the settings pop-up. Rewind and Redo are actions taken
  during play, so they remain in the main table UI, and as a discreet icon control rather than the
  caps buttons V21 drew. Undo and Redo also keep the inline placement on the entry they would act
  on (see [Undo permissions](#undo-permissions-and-proposed-campaign-control)). The controls remain
  registered operations under unchanged authority. Recorded first as moving the whole strip into
  the pop-up and corrected by the user the same day on seeing it; the correction is what stands.

  Implementation choices under that decision, not part of it and open to change: the pair sits at
  the right-hand end of the LOG / RULES / ROLLS tab row in a reserved column, so the tabs stay
  centred and nothing overlaps as the pane narrows; and what each control would act on, or why it
  is unavailable, is carried by its tooltip and its accessible description rather than by a line
  of visible text ([V31](build/V31-history-control-placement.md)).
- **A failed operation is a dismissible toast, not a block beside the control.** Error messages from
  registered operations appear in one fixed, screen-reader announced toast region with a Dismiss
  control, instead of an inline notice that overlaps neighbouring content and moves the layout. The
  transport envelope Convex wraps around an operation's message is stripped, so the person reads the
  operation's own wording. Deliberate page-level and form-level error slots are unaffected.

### Roster targeting controls

Confirmed during the 2026-09-12 discussion. Each displayed participant in either roster has a dedicated
target button, provisionally a reticle. Target selection is separate from acting-character selection.
Users can select targets before or after an ability. Roster privacy and control permissions still apply;
a reticle grants neither control nor private-sheet access.

Minion targeting refinement, 2026-09-13: provide a target reticle for every individual minion and
for its attached captain. The squad/initiative-group container is not itself the creature target.
Keep the selected minion identity through resolution even though damage uses its squad pool; captain
damage uses the captain's separate Stamina. Multiple ordinary turn entries referencing the same actor
all target that same actor, so selecting a boss through either turn entry does not create a different
damage recipient. Existing audience/privacy rules continue to govern visible targeting controls.

| Target shape | Selection and firing |
| --- | --- |
| Ordinary single target | Default radio-like behavior: selecting another creature replaces the previous one. An already-selected target plus an ability fires; selecting a target for a pending ability fires. No extra Use confirmation. |
| Self only | Selecting the ability supplies the acting character as self and fires. This does not default a self-or-ally ability or self-centered area to self-only. |
| Multiple targets with a known allowance | Checkbox behavior; a second click removes a selected creature. The log prompts Target up to X with a fire button usable before X. Reaching X auto-fires. One accepted execution if the button/automatic paths race. |
| Area determined on the external map | Checkbox selection with Select affected creatures and an explicit fire button. No count-based auto-fire; the app cannot know the number affected. Selection supplies membership, not coordinates, distance or line of effect. |

These are target-completion rules, not permission to omit required choices or costs. Optional pre-resolution
spending and other required input use cards; unaffordable execution is blocked under
[ability costs](#ability-costs-and-optional-spending). Source target counts/kinds and shared-roll or staged
rules remain meaningful; ordinary targeting rule conflicts still warn without blocking. An up-to-X prompt
does not redefine every source ability as optionally targeting fewer creatures.

Each authenticated user owns an independent selection, even when the Director and a player act for the
same character. Others can see it with indicators distinct from their own; exact styling is deferred.
Hidden creatures (V1 hiding, deferred beyond v0.01) cannot be disclosed through another user's indicator.

| Event | Selection behavior |
| --- | --- |
| A gameplay action fires | Clear that user's targets and pending ability, for single and multi-target actions alike. This supersedes the earlier sticky-single-target proposal. |
| End turn | Clear targeting. |
| Actual target death | Deselect that target; do not treat zero Stamina as universal death. |
| Acting-character switch | Clear that user's pending ability and targets. |
| Click the same ability while it still awaits targets | Cancel the un-fired selection and clear targets, without confirmation. Invalidate its pending targeting interaction. |
| Undo | Restore gameplay state but leave that user's pending ability and targets cleared. |

Clearing one user's draft leaves others' drafts independent. It never deletes recorded targets, resolution
results or a fired action's required continuations. Selection/cancel controls are registered operations;
preparatory controls are not themselves gameplay firing that immediately clears the selection they set.
An action that cannot execute has not fired. Single-target manual deselection and specialized object,
allocation or staged target flows remain open where not specified above.

### Persistent area-effect cards

An ongoing area effect registers its end condition with the game clock. Its card stays fixed at the bottom
of the game log until the effect ends, with new entries above it. Multiple area cards stack for now; compact
or expandable formatting was recommended but is not required. On expiry the card stops being fixed and
remains in history. Ending an area does not remove separately applied conditions with their own duration.

The effect owner and Director receive affected-creature controls on the card:

1. Checkbox edits immediately update the recorded affected-creature list; there is no Apply button.
2. Each subsequent firing re-prompts for confirmation, with the previous selection checked. The table
   adjusts affected creatures from the external map, then confirms. Stored membership never silently
   substitutes for confirmation of this firing.
3. Dependent clock work, including potentially affected saves, waits for confirmation and the area's
   consequences. Preserve source timing and the FIFO/save-last policy.
4. Resolve now uses the same operation and confirmation flow for triggers the app cannot observe between
   clock events. It does not create a new use of the originating ability or invent a movement observation.

Membership edits and firing confirmation are distinct operations. The engine owns source-specific
consequences; a checkbox edit does not repeatedly fire all effects. Active-effect membership is distinct
from un-fired per-user targeting and survives ordinary clear-on-fire behavior.

Pinned cards are live projections of immutable records, not reordered historical events. Creation,
updates, confirmations and resulting effects retain discrete ordered entries and actual attribution.
Cards contain neither engine logic nor parsing; every control has the same registered headless operation.
Exact effect-owner mapping and source-specific changes/unobserved trigger resolution remain open.

Ordinary cards receive no Needs your input indicator, reminder inbox or automatic resurfacing. Users
must notice them when offered. Persistent areas are the explicitly accepted exception. Being buried
alone neither expires a valid response nor extends an expired window. A live card may show current
controls while preserving the original entries and the [historical edit boundary](#director-edits-to-inline-results).

### Game log and chat scope

Implementation note (2026-09-15): the user's [app-wide rule card presentation](reference-library-spec.md#app-wide-rule-cards)
supersedes inline source expansions. Readable labels and the shared rulebook icon open a centered,
scrollable reference card with a blurred backdrop. Source paths and IDs remain metadata; operational
values and controls retain their behavior.


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

User decision (2026-09-20, campaign home): build a **very light campaign chat** now, on the campaign home,
within the V12 contract (campaign-scoped, persistent, every member may read and write, no editing or
deletion, no notifications, separate from the game log). The user expects a longer-term game-log/chat
hybrid inside the session; that hybrid, including roll results shown in chat, is not part of the light
chat and needs its own design. Chat writes create no game-log entry and no undo seam.

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

Confirmed latest clarification: pausing locks both rosters until resume, including additions/removals,
regrouping and saved-encounter loading. The Director can manage foes between sessions and during running
combat. The encounter builder remains the reusable template-preparation tool. Between-session management
remains permitted; the earlier allowance for paused roster edits is superseded.

Confirmed: **the foes roster does not lock during running combat**. The Director may add or remove monsters as needed,
including monsters participating in the active encounter, without ending or voiding it. The character
progression/edit lock does not apply to monsters. Saved-encounter replace/append operations are not blocked
merely because combat is active. Pausing blocks roster changes, including saved-encounter loads;
executing monster gameplay actions still requires a running session.

Confirmed v1 scope (saved encounters are deferred beyond v0.01; v0.01 uses direct catalog-to-roster
loading): a saved encounter retains the monster selection, including quantities, the last setup of
its **party strength calculator** (working title), a **rewards stash**, and prepared monster initiative
groups, minion squads and captain assignments. This extends the earlier monster-selection-only scope;
no other authored supporting content is required for v1. Saved encounters are
private to their creator in v1; sharing is deferred. Loading a creator's selection into a campaign produces
independent live roster instances governed by table access, without granting access to the private template.
Definition references and rules needed to instantiate selected monsters remain necessary; this scope does not
remove their stat blocks or mechanics.

Confirmed saved preparation, 2026-09-13 (V1, deferred beyond v0.01): predesigning an encounter includes arranging monster
initiative groups, establishing minion squads and assigning their captains. Persist those choices in
the saved encounter; reopening, duplicating and loading preserve the prepared arrangement. Loading
creates independent live monsters, groups and squad/captain relationships within that load, rather
than requiring the Director to repeat completed setup. New ordinary monsters default to individual
initiative groups unless deliberately regrouped. Initiative groups and minion squads remain separate
mechanisms. Existing live-roster editing and mid-combat group/turn rules still apply; loading prepared
groups does not grant extra turns. Squad count controls, shared-turn participation and captain actions
are selected below; other preparation styling and specific source exceptions remain open. This confirms reusable monster preparation, not arbitrary additional authored encounter content.

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
roster. Confirmed comparison scope: include all undefeated monsters on the roster, including hidden ones (V1)
and those not selected into the current combat. Do not filter the total by player visibility or active-combat
membership. Defeated monsters stop contributing to current roster EV immediately, even while their entries
remain until normal encounter cleanup. This is the current-roster display policy; it does not retroactively
change recorded encounter difficulty or establish reward calculations. Exact party inputs still need
definition. Minion count arithmetic is confirmed below; other difficulty formulas, party inputs and changed-state
calculations still require source verification. Count each creature once regardless of its number of
turn entries, and count the captain separately from its squad. For minion EV, use prepared counts in
templates and surviving membership for the current undefeated-roster total; pooled Stamina is not a
quantity of creatures. Live casualties do not rewrite saved counts or recorded encounter difficulty. Do not infer a health-based EV adjustment or a
difficulty formula from the phrase “current EV.”

Confirmed v1 content scope: core rulebooks only, with all official supplements and homebrew monsters,
character options, and items excluded. Summoner and Beastheart are official supplemental classes, not core;
neither their classes nor associated mechanics are v1 targets. Reference coverage includes eligible official
retainers, companions, and summons under the [source scope](reference-library-spec.md), without assuming every
readable creature has complete automation. Monster selections use supported core-rulebook content; creating or
copying monsters for homebrew customization is deferred.

The top of the roster provides controls to search the database and add stat blocks, or (V1, deferred beyond
v0.01) load a saved encounter. Loading a saved encounter also adds its prepared reward items to the campaign's persistent Director's stash at
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

Confirmed v0.01 ordinary-foe status, 2026-09-13: when a foe's Stamina reaches or crosses zero,
automatically mark it defeated and display **Slain**. Keep its roster entry until normal cleanup
or Director removal, preserve its visibility and remove its EV from the undefeated total. Record
the transition with its cause for authorized undo/redo. This does not automatically end combat or
award Victories. Manual death/knockout adjudication remains; hero-dying automation is separately
deferred. See [the sourced contract](fury-goblin-automation.md#ordinary-foes-at-zero-stamina).

Future feature: the campaign's **Slain table** will show creatures killed by the party over the campaign's
lifetime, how they died, and who killed them. This is a later feature, not a v1 implementation requirement.
Retained history should support it; roster removal alone does not establish that a creature was killed. Kill
attribution, undo/void treatment, and its presentation remain for that feature's design.

V1 design, deferred beyond v0.01 (all v0.01 foes are visible; see [visibility](#monster-visibility-and-health-display)).
Confirmed: a **default-visibility toggle beside the roster's Add button** lets the Director choose whether
newly added monsters start visible or hidden. This sets the initial visibility of additions; changing it does
not change monsters already on the roster. Each monster retains its individual visibility control. New
campaigns default the foes-roster Add visibility toggle to hidden. Its value is stored per campaign, and both
individual catalog additions and monsters loaded from saved encounters use that current value. Changing the
default does not change existing foes' individual visibility.

Each roster monster has a Director-controlled **show/hide toggle** (V1, deferred beyond v0.01). Showing a monster makes it visible to
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
observers as well as players through authorized audience projections. Provisional user decision (V1 hiding): a hidden
foe's name is not concealed in game-log entries when it acts. Its roster entry remains hidden; a named log
entry does not reveal its full stat block or automatically toggle roster visibility. Visibility alone does not
establish a secret-roll mode; the public/tower result-audience rules remain separate.

Void-reset treatment of monsters added or removed after encounter start is settled by the 2026-09-13
[Void roster restoration](#voiding-an-encounter) ruling; Director additions/removals during combat and
mid-combat insertion/regrouping are confirmed. Their detailed pending-action, squad, and summon
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

**Confirmed long-term architecture, 2026-09-15:** chat shares and bookmarks use the same object-reference
foundation as the embedded Compendium and inventory. Rules are the main use case, with inventory items
and other supported objects sharing that model. See
[the owning data contract](data-architecture-spec.md#35-unified-object-references-and-sharing).
Detailed UI/disclosure behavior below remains proposed; implementation timing has not been assigned.

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

### Malice visibility

Confirmed 2026-09-13: **Show Malice** is a campaign setting, **off by default**, controlled by the
active Director. The Director can always view the current shared Malice pool. Turning the setting on
shows that pool to the table's players and observers; turning it off hides the current pool from their
views. Persist the choice with the campaign. It changes visibility, not Malice generation, spending,
ownership or source rules. Enforce the audience through shared reads/headless access as well as UI.
Existing complete action-source disclosure remains; this setting does not hide a used ability's text.
The [Malice rule](../vendor/steel-compendium/en/unified/md/rule/monster/malice.md#earning-malice) expressly
leaves pool disclosure to the Director/table. Exact placement of the resource display is a UI detail.

Confirmed v0.01 automation, 2026-09-13: automatically apply the source-defined combat-start Malice
grant, round-start gains and normal encounter-end loss to the persistent shared pool, with recorded
causes and before/after values. Director pool edits remain separate Manual adjustment operations;
visibility and the Void keep/reset contract remain intact. See
[the sourced lifecycle and example](fury-goblin-automation.md#malice-lifecycle).

**Implementation note, 2026-09-14 (R05):** the automated lifecycle steps are typed as `ScheduledWorkKind` `malice` items and `MaliceChange` records in `shared/contracts/clock.ts`; the growth rule is quoted and the placement of the combat-start grant (at OK, after the baseline snapshot) and the round-one gain (at round start) is recorded in [conditions and clock](conditions-and-clock.md#3-malice-common-lifecycle). Hero-count handling is confirmed by Q-R-50 below; fractional-average handling is confirmed by Q-R-51.

**User decision, 2026-09-14 (Q-R-50):** round-start Malice counts heroes still in combat, once per
hero. A hero removed from combat stops contributing to future round-start gains; a dying hero who
remains in combat still counts. Use the remaining combat turn entries to determine participation,
not the original setup list. This supersedes the provisional Q-R-50 A behavior described in the A04
implementation note; implementation and verification of the updated count remain with A04.

**User decision, 2026-09-14 (Q-R-51):** round the combat-start average Victories down to a whole
number of Malice; retain the unrounded average in the log. This follows the confirmed
[rounding convention](rules-adaptation-principles.md#confirmed-rounding-convention): round down unless
specified otherwise. For Victories 1, 1 and 2, the starting grant is 1 Malice.

### Monster visibility and health display

**Foe hiding deferred, 2026-09-14:** all loaded foes are visible in player/observer rosters;
combat participants and their initiative groups/turns have no hidden-foe presentation. Omit
hide/reveal controls and the Add visibility setting from v0.01. Full monster stat blocks remain
Director-only; health display and Malice visibility retain their separate policies. This defers
roster visibility controls, not the source rules for stealth or concealment. Fuller V1 hide/reveal
design remains future work. Audit F2 is closed for this milestone by scope deferral.

The hide/reveal behavior elsewhere in this specification describes the fuller V1 design.

Confirmed: players and observers do not see monster stat blocks at the table. The Director can inspect them to
run monsters in free play or encounters. All loaded foes appear in the v0.01 player-facing roster;
in fuller V1, only foes marked visible appear. The health modes below apply to visible foes. The public monster glossary remains accessible; refraining
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

Proposed delivery contract: when hiding enters scope, filter out hidden roster entries; provide an audience projection appropriate to
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
| Paused | Gameplay actions and changes to either roster are blocked, including regrouping and saved-encounter loads. Sheet reads, chat and unlocked character-data management remain available. Preserve the activity and rosters for resumption; gameplay corrections remain blocked. Director Void is an explicit lifecycle exception with keep/reset; the session remains paused afterward. |
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
their available character operations, the Director can verbally call for tests and operate roster foes, and accepted
changes belong in the game log and live state. Existing source disclosure, manual play, authority, pause
and privacy policies apply.

Confirmed FreePlay presentation, 2026-09-11: use the same role-specific three-pane table as combat—Director
pane left, game log middle, heroes pane right. Character sheets and rosters remain available, with no
active initiative or turn tracking. The user accepted this as sufficient for now; finer presentation can
evolve later. This layout choice does not settle how tests, abilities or other FreePlay actions resolve.

Confirmed app boundary: only the Director formally starts a tracked combat encounter. The source expectation
that harm initiates combat does not mean the app automatically opens combat when an action is selected.
The existing warning/manual-adjudication policy applies. Do not silently grant outside-combat benefits
just because the app has not entered combat tracking.

Confirmed FreePlay carryover, 2026-09-13: actions resolved before combat do not consume the new
encounter's action economy. Do not import an earlier attack as a first turn, mark an action or maneuver
spent because of it, or replay its effects when combat starts. Begin from the current recorded state:
damage remains and resource expenditures remain reflected in the relevant pools. Apply source-defined
combat-start initialization, grants or resets normally; this decision does not invent a reset or waive
an applicable resource cost. Earlier actions stay in FreePlay history. If the table intended an action
to happen during initiative, undo it while still in FreePlay, start combat, then execute it normally.
This does not add cross-encounter rewind authority.

Pinned source context, not a completed FreePlay implementation contract:

- [Combat Round, When Does Combat Start?](../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md)
  places combat before an intended harmful action and expressly rules out a cost-free opening heroic attack.
- [Ferocity Outside of Combat](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md)
  supplies class-specific cost and reuse rules. FreePlay cannot be modeled as either ordinary combat
  resource spending or unrestricted free use of every ability.
- The [Director chapter, Hazard Effects](../vendor/steel-compendium/en/unified/md/chapter/for-the-director.md#hazard-effects)
  explicitly describes noncombat hazards. Its relationship to Combat Round's broad environmental-threat
  wording needs case-specific adjudication; every damage entry is not an established automatic transition.

Remaining FreePlay contracts include source-specific test resolution, supplying facts and targets, spending
Recoveries, tracking ability reuse and elapsed fictional time, and dependent corrections/undo. Player undo
scope is confirmed through the beginning of the current FreePlay stretch; detailed dependency cases remain.
Research ordinary rule expectations before asking for decisions about their table interaction.

**Deliberate scope decision:** generic Director test requests are intentionally omitted for now, not
an unanswered specification gap. Do not reintroduce the UI, command or request lifecycle as missing work
without a new user decision. Verbal requests and direct character rolls are the selected flow; tests
required by specific actions may still use those actions' cards.

Confirmed test initiation, revised 2026-09-13: remove formal Director test requests from scope for now.
The Director asks verbally and players initiate **Roll test** from their character sheets; the Director
can also roll under existing acting authority. Preserve structured inputs, modifiers, actor attribution,
resource/action-cost bookkeeping and recorded results through shared UI/headless operations.

There is no generic Request test control or command, request card, recipient/response-mode selection,
or associated expiry/cancel/edit/reassignment workflow. This supersedes those earlier requirements.
A specific action or effect may still require a test and supply its own action-card step. Group-test
aggregation remains a separate source-specific automation question, not a generic request workflow.
See [the rules review](research/tests-and-request-ui.md).

When the app knows the difficulty or source-specific outcome table, show the calculated result. When
it does not, show dice, modifiers and total and let the Director interpret the outcome; do not block the
standalone roll or invent success/failure. Narrative consequences retain Director adjudication.
[How to Make a Test](../vendor/steel-compendium/en/unified/md/rule/test/test.md) supplies the conversational
rules procedure. An applicable skill is agreed at the table without an in-app approval gate; retain
its identity alongside its bonus.

The [confirmed action contract](#confirmed-action-and-log-contract) requires registered table commands
shared by buttons, the palette, action cards and headless execution. The human syntax baseline was
accepted on 2026-09-12; detailed grammar and schemas live in the [command specification](table-command-spec.md).

```text
@Thorn /test roll characteristic=might skill=climb
@Thorn /ability use ability="Brutal Slam" targets=[@Goblin5]
@Elwin /ability use ability="Healing Grace" targets=[@self]
```

Authenticated issuer, acting character, ability and targets are distinct. Attribution may display
`Jon@Thorn: …`, but the user name is not executable input. `@self` means the selected acting character,
including when the Director acts for that character. Autocomplete binds visible names to stable instances;
ambiguous names need disambiguation. Target selection supplies neither unknown range nor line of effect.
Multiple-target syntax is accepted; detailed geometry, allocation and target-change interactions remain open.

Confirmed character equivalence, 2026-09-13: apply the same gameplay mechanics to each character
regardless of whether one user controls several characters or different users control them. Resolve
abilities, resources, triggers, responses and dependent consequences from the characters and their
recorded actions; shared user control creates no special mechanical case. The sequential dependent-undo
policy produces the same gameplay result in both cases. Multi-character control adds UI navigation
and actor-labeling needs, not a separate rules model. Authentication, control permissions and actual-user
attribution remain separate application responsibilities.

The subsequent sequential undo ruling resolves the Recovery-grant case: the recipient's follow-up
closes the grantor's player undo window; the Director must rewind the response before the grant.

Confirmed character-context clarification, 2026-09-13: everything in the character sheet and player
pane belongs to the character the user is currently viewing. Sheet/pane tests and abilities use that
character's statistics and resources in FreePlay, during turns and between turns.

Game-log action cards can belong to either of a player's controlled characters, independently of the
viewed sheet. Clearly label the character who will act before the user interacts with a card. Its
controls execute for that labeled, bound character; viewing Elwin does not turn Thorn's response into
Elwin's action or require switching sheets to use it. Preserve actual-user attribution separately from
the acting character and apply normal authority, resource and opportunity-validity checks.

This narrows the earlier blanket all-UI-follows-selection wording. Whether the app otherwise prompts or
automatically switches the viewed character remains a separate open decision; no automatic sheet switch
is established by using a card. Explicit command actors and headless contexts retain their meaning.
Changing the viewed character does not retarget recorded actions or bound responses. Drafts spanning
turn changes remain open.

Confirmed explicit Take turn navigation, 2026-09-13: when a user chooses **Take turn** for a character
and that operation succeeds, switch that user's player pane/character sheet to the chosen character.
For example, taking Elwin's turn while viewing Thorn opens Elwin's sheet. Apply the existing actor-switch
draft-clearing rules when the viewed actor changes. This settles navigation following the user's own
explicit turn choice; it does not establish automatic switches for other users, passive turn changes,
or game-log card responses.

Confirmed campaign setting, 2026-09-12: **Show test difficulty** defaults off. With it off, recorded test
difficulty is hidden from players and remains available to the Director and engine. Turning it on shows
the difficulty. The label states the setting's positive behavior; final UI wording is provisional. This
setting does not hide the ordinary public dice roll or supply an unspecified difficulty.

Confirmed test-result display, 2026-09-12: publicly display the full roll calculation: base roll, applied
modifiers, resulting total and the calculated outcome when the app has the required difficulty or
source-specific outcome table. The user rejected keeping the calculated outcome
Director-only until revealed. Hidden difficulty does not suppress these workings or the outcome label;
the difficulty itself remains governed by Show test difficulty. Do not invent an outcome when required
inputs are missing, or automatically invent the test's narrative consequences from its result.
Per-test difficulty reveal/overrides are deferred for now, as requested by the user; the campaign setting
is the current visibility control. Confirmed 2026-09-13: the current campaign setting applies to all
displayed test entries, including historical tests. Turning it on reveals their recorded difficulties;
turning it off hides those values in the player view. This changes presentation, not recorded rolls,
difficulties or outcomes, and does not rewrite closed-session history. Director access remains unchanged.
Formal test-request UI and its lifecycle are out of scope for now.

*Implementation note, 2026-09-14 (R04):* direct test arithmetic (2d10, characteristic, agreed skill
+2, other bonuses, edges/banes, natural 19/20 critical success) and the difficulty outcome table are
in [the R04 contract](roll-and-damage-resolution.md), section 5, with examples in 10.12. Outcomes are computed only when a
difficulty is supplied.

### Inline interaction cards in the game log

Confirmed minimum-input direction, 2026-09-13: an action or dependent effect asks for only the missing
facts and choices needed to resolve it. Use known state and already-supplied facts for everything the
supported rules can derive. Collect these inputs through the relevant action/effect card and equivalent
headless operation. Do not require a complete movement report, coordinates or a routine movement-completed
confirmation when the particular resolution does not need them.

Confirmed card refinement, 2026-09-13: special actions can have small, purpose-specific interfaces on
their action cards for the inputs they need. Use suitable controls for the operation rather than requiring
one generic manual-resolution form. Cards collect input and present results; parsing and rules execution
remain in shared handlers with equivalent headless access.

Confirmed unsupported-effect completion, 2026-09-13: after the table resolves an unsupported
effect manually, the Director can mark that specific effect **Resolved at table** on its originating
log card. Record the effect's manual disposition and Director attribution without applying it again,
rerolling or labeling it automatically understood. Keep other effects of the action independently
applied, pending or manually resolved. This is an exception for partial automation, not a routine
movement-completed click or replacement for a supported purpose-specific input card.

Marking the effect resolved does not invent its resulting state or spatial facts. Record any needed
resource, damage, condition or other state changes through existing shared adjustment/input operations;
dependent automation continues only when its required state/facts are available. The same registered
operation is callable headlessly, follows existing pause/authority/history boundaries, and must not
cause duplicate effect application on retry or later automation. Preserve the original source and the
manual-resolution record for inspection and recorded undo/redo.

For example, an ice-wall effect can ask which enemy was forced into it and use recorded potency/Might
to resolve its condition; a post-movement death effect can ask which creatures are now adjacent without
requiring the entire path. These examples illustrate input minimization, not universal automation support.
The [forced-movement research](research/forced-movement-dependencies.md) supplies source-grounded cases.
This minimum-input direction remains accepted. The later user decision deliberately excludes the
standalone damage/collision/fall tool; result corrections and direct live-stat adjustments supply the
Director's fine-tuning routes. See [Director fine-tuning](#director-fine-tuning-and-deliberate-damage-tool-omission). Missing facts stay explicit, and exact responder authority, cancellation,
same-turn dependency reconciliation and source ambiguities still need their respective contracts.

Confirmed direction: inline cards support actions that need an intermediate choice or response, including
optional reactions. The engine can identify a supported response opportunity and surface a card. Cards
are user-aware: viewers receive the controls appropriate to their authority and the requested character.
This establishes the interaction surface, not a complete trigger detector or rules timing contract.

Recommended continuation model: retain an identified pending interaction linked to its originating action;
record responses and show the resulting resolution in the log. Headless callers inspect and answer that
same interaction. For optional reactions, offer an explicit decline/pass path. Source-specific effects that wait or commit,
multiple-response ordering, remaining cancellation/invalidation and undo-unit details remain open.
Combat cutoff events and the sequential player undo seam are already settled. Shared card presentation must preserve existing private-data boundaries. Detection is limited by
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
silently remove the existing warned manual-adjudication path for late or undetected actions. Exact
source-specific phases, progression while required responses are pending, simultaneous responses, and
reopening/invalidation after correction or undo remain open; the general cutoff events are settled. Unknown trigger facts must remain explicit rather than being guessed.

**Standing action-card/prompt window, confirmed 2026-09-13:** in combat, all outstanding response
opportunities that remain valid stay available through the gap after the current individual turn ends,
with next individual turn start as the outer turn-based cutoff. Explicit End combat also closes unused
optional combat responses; the clarified event-window early-close rule below still applies. End turn does not
itself close them. This includes Lines of Force,
failed-save hero-token prompts and opportunities first created by a turn ending,
such as [Hesitation Is Weakness](../vendor/steel-compendium/en/unified/md/feature/ability/shadow/level-1/hesitation-is-weakness.md).
This is an explicitly general app convention, superseding the earlier triggering-turn-end closure and
the former test-request expiry policy, whose workflow is now removed. It is not merely an isolated Lines of Force ruling.

The boundary is a new individual turn, including within the same group or under the same controller;
it is not a side change, round increment or elapsed-time timeout. Order a response racing with Take turn
against shared state so only a still-open opportunity can be accepted. Fulfilled, canceled or otherwise
invalidated interactions do not become reusable merely because the next turn has not started. Existing
authority, affordability and pause/closure restrictions still apply.

Confirmed early-close refinement, 2026-09-13: committing an unrelated new ability counts as passing
that character's earlier unused optional triggered-action opportunity. Close that opportunity when the
new ability is accepted, regardless of which authorized user acts for the character. Mere preparation
or a refused activation, including an unaffordable attempt, does not close it. Using the offered response,
ordered work in the same response chain, newly triggered opportunities and explicitly granted continuations
are distinct from unrelated later play. Responses to unrelated events and unrelated card kinds retain
their own lifetimes. The event-window clarification below also closes an ally's response to the hit
when its affected character commits subsequent play. The next individual turn start remains the outer deadline. This is a confirmed app rule,
not a claim that the source explicitly names another-ability use as an expiry event.

Clarified existing precedent, 2026-09-13: the response window for the damage taken by Thorn is
closed when Thorn commits another action or spends the resources granted by that damage, including
an allied character's unused Parry prompt. The cutoff follows the triggering event and subsequent
play by the affected character; it is not limited to prompts owned by that character's controller.
Offer Parry in the eligible ally's game-log card when the damage occurs, and close that card when
Thorn moves on in this way. A stale submission cannot revise that hit through the closed opportunity.
Keep the original hit, grant and later spending recorded. The user identifies this as already covered
by prior precedent; the earlier narrower reading of “other characters' responses” was incorrect.

Preparation/refused actions still do not commit later play. Preserve the offered response's own
cost/payment, ordered responses and explicit continuations; those are not unrelated later actions
that close their own chain. Other characters' responses to unrelated triggering events retain their
own windows. This correction does not add a universal wait barrier, selective rollback, or a special
resource-dependency repair mechanism. Existing sequential undo and prompt restoration remain in force.

This convention governs the current prompt's response window, not deletion of its historical entry or
the lifetime of an ongoing effect. Persistent-area cards retain their established effect lifetime and
can offer new firing prompts. Required unresolved work still prevents dependent progression; expiry
does not silently resolve it or permit a next turn to bypass that requirement. FreePlay has no individual
turn boundary; remaining source-specific cards retain their applicable lifetimes. No mandatory response from every player or
wall-clock countdown is introduced. Source-specific response consequences and ordering remain separate
from this accepted availability window.

Confirmed review clarification, 2026-09-13: in the Lines of Force example, apply the triggering action's
outcome first. The engine recognizes the forced-movement trigger and offers Thorn's eligible controller
the contextual Lines of Force action card. If invoked, resolve that triggered action and modify the
triggering action's effective forced-movement outcome, redirecting it under the ability's rules and chosen
options. Do not hold the original movement pending a use/pass decision for this case. The user's example
of a bugbear dealing 8 damage and pushing 3 is illustrative, not a sourced monster ability.

The response is a linked triggered action with its own attribution, source, choices and applicable costs;
it does not require a separate Director correction. Append its changes while preserving the original
action record and unaffected outcomes, including the example's damage. This describes recorded movement
outcomes/instructions in the mapless client, not automatic observation or relocation of physical pieces.
Confirmed dependent-reversal refinement, 2026-09-13: if the original push has already caused collision
damage to Thorn, accepting Lines of Force reverses that now-inapplicable collision damage and resolves
the redirected movement's consequences, collecting only newly required facts. The original attack's
unaffected damage remains. More generally within this response case, reverse consequences invalidated
by the changed movement; do not leave both the original and replacement consequences applied.

The log retains the original applied outcome, showing what would have remained without the response,
and appends the response, reversals and resulting changes. The original outcome is not merely an
uncommitted preview. The user explicitly prefers the smoother table flow of applying and then revising
over halting this case for a preliminary response decision, accepting the additional reconciliation work.
Existing opportunity, affordability, authority and history boundaries still apply. Further dependencies
involving later player choices, spent resource grants and multiple responses remain open; this does not
authorize silently replaying those choices. Turn-end prompt availability follows the standing
next-turn-start convention above. This example does not establish every ability's source-specific sequence.

Research follow-up, 2026-09-13: [intervening actions and trigger opportunities](research/trigger-opportunity-intervening-actions.md)
does not establish the hypothetical collision-grant → unrelated ability → belated Lines of Force chain
as ordinary source play. The source response precedes the collision; the app's retrospective application
creates that possible reconciliation scenario. The user has now confirmed the early-close rule above,
which prevents banking the old opportunity through unrelated later ability use. It does not close all
cards or source-authorized continuations. No automatic undo of a later resource-funded ability has been
accepted from that hypothetical. The confirmed apply-then-revise response behavior remains in force.

Confirmed minion overflow input, 2026-09-13: use the existing area/spatial-targeting pattern when
an attack takes out additional minions and the app lacks the facts needed to identify them. Its inline
action card or prompt in the game log asks the acting user to assign the overflow kills. The Director
can also complete the response under existing table authority. Derive the casualty count from resolved
damage and squad state; ask only for the missing casualty assignments. This is a linked completion of
the original action, not another attack or a second application of damage to the squad pool. Show the
acting character and source action, retain the selected minion identities in the log, and resolve the
affected consequences through shared operations. Required unresolved assignments follow the existing
dependent-work policy; they are not unused optional responses that may simply expire.

Player-side area-damage walkthrough, 2026-09-13: apply the existing target-selection and minimum-input
contracts to the sourced distinction between area damage and non-area overflow. For ordinary area
damage without relevant immunity/weakness or special traits, casualties are confined to affected
minions inside the area. Preserve each selected member's identity and squad, calculate pool changes
per squad, and ask for casualty identities only where the result leaves an actual choice. The shared
pool does not make every member of that squad an area target.

The printed example is three 5-Stamina Spinecleavers taking 6 fire damage each: their squad pool loses
15 rather than 18, and those three are removed. Their known target identities need no additional casualty
selection. In an otherwise full eight-member squad, 3 damage to each of three selected members instead
reduces the pool from 40 to 31 and removes one member; the damage dealer chooses which affected member.
The inline card can present those three candidates and request one casualty, without offering unrelated
members outside the area. This is application of existing minimal-input rules, not a new confirmation step.

Confirmed area-damage ceiling, 2026-09-13: area effects can remove only the minions affected inside
the area. Non-area overflow does not apply, including when weakness or another modifier increases the
damage. For each affected squad, the final area-damage contribution to its pool cannot exceed the
combined applicable Stamina of that squad's affected minions. Apply immunity/weakness once per squad
under the existing calculation rules, and enforce this ceiling on the final result regardless of
modifiers. This is a final bound on damage, not merely a limit on which casualties can be selected;
do not subtract excess pool damage and hide its additional casualties.

After a captain-bonus adjustment, living count need not be derivable from current pool Stamina.
The separate non-area pool-exhaustion ruling cannot kill outside-area members. Exact pool/threshold
continuation when an area effect exhausts the pool while unaffected minions survive remains open;
retain the outside-area survivors and identify unresolved subsequent arithmetic rather than silently
refilling the pool or applying non-area overflow.

Three affected minions with 5 Stamina each permit at most 15 damage to their squad's pool, even if
weakness would push the calculated result higher. The card offers only eligible affected identities,
never an outside-area overflow selection. Calculate each squad separately when an area contains more
than one squad; the captain remains a separate target with its own normal Stamina resolution. Minion
Stamina here means the applicable per-member squad value, not invented independent wound totals.

The source wording is ambiguous about modifier interaction. The selected interpretation gives priority
to the area-only casualty rule and rejects the earlier research inference of weakness-created outside
casualties. Other source-specific calculation details remain subject to their own rules, but this ceiling
and the absence of area overflow are settled. See
[the research and interpretation record](research/minion-lifecycle.md#7-area-damage-immunity-and-weakness).

The [minion rules](../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#dropping-multiple-minions)
provide the casualty constraints, including nearest additional minions for non-area overflow. Supplied
spatial facts fill the mapless client's knowledge gap; the prompt does not invent positions or replace
source-specific area, immunity or weakness handling.

### Director fine-tuning and deliberate damage-tool omission

Confirmed 2026-09-13: the standalone Director damage tool is **out of scope**. This includes the
previously suggested separate collision/fall damage controls. This is a deliberate choice, not a missing
combat-flow feature to reintroduce without a new user decision.

The Director has two established routes to fine-tune play: use the designed controls on an eligible
interactive result card, or directly adjust live gameplay stats in monster stat blocks, character
sheets and resource displays. Both use recorded,
registered shared operations available through UI and headless clients. Log the actual Director, affected
creature/stat or result, and its before/after values; apply the chosen adjustment to live state without
reapplying the original action. Historical result corrections retain the sequential-rewind boundary;
current-stat adjustments are new current events and do not rewrite archived encounters.

Direct live-stat adjustment is table adjudication, not an edit of the reusable catalog definition or
character build. Existing character-editor, privacy and running-session gates remain. The shared engine
still resolves damage for supported actions and exposes required specific inputs; removing a dedicated
damage tool does not remove damage mechanics or the Resolved at table fallback for unsupported effects.

#### Persistent values and manual adjustment entries

Clarified by the user, 2026-09-13: **Stamina, Recoveries, Heroic Resources, Malice and Victories are
persistent recorded game values**, each with its own rules and lifecycle. All these numbers are
editable by the Director on their character sheet, stat block or corresponding resource display.
This applies to v0.01 and is independent of the deferred inline attack-result editors.

Committing a field edit updates the authoritative current value through a registered shared operation
and appends a **Manual adjustment** entry to the persistent game log. Record the actual Director,
affected creature or shared resource, field, previous value and new value. The same operation is
available headlessly and follows the existing session, audience, retry and history boundaries.
For example, changing a hero's current Stamina from 12 to 17 on its sheet persists 17 and appends
“Manual adjustment — Stamina 12 → 17” with the Director and hero identified. It does not change
the earlier attack's recorded damage or present the adjustment as a new sourced healing ability.

*Implementation note, 2026-09-15 (A02):* the provisional `stamina-maximum` and `recoveries-maximum`
adjustment verbs A03 added while no evaluated build existed (Q-A-200) are removed; the maxima come
from the effective build's baseline, and `/adjust` covers current Stamina, temporary Stamina,
Recoveries, heroic resource, surges, Victories and Malice.

Edges, banes and other roll-local inputs/results belong to their action's log artifacts and are
accounted for separately. They are not the persistent sheet/resource fields described above.
The game log is a persistent history, not a collection of freely editable fields: its editable inputs
exist only in interactive cards designed for their specific cases. Submitting such a card uses that
case's shared operation and appends the appropriate record; it does not overwrite original history.
History controls such as Undo/Redo retain their own registered-operation semantics.

#### v0.01 hero tokens — deferred

Confirmed 2026-09-14: defer the shared hero-token counter and associated pool controls/automation
beyond v0.01. The previously deferred failed-save token follow-up remains deferred. Fuller V1
hero-token references elsewhere in this specification remain future scope. This does not remove
accepted surge, Recovery, Malice or other shared resource controls.

#### v0.01 surge tracking

Confirmed 2026-09-14: include a persisted surge counter on the hero sheet, editable by the
Director through the existing numeric Manual adjustment operation. Record the actual user, hero,
previous value and new value. Gains, spending and their damage/potency effects are resolved
manually for v0.01; no surge-spending card or automatic granting-feature interpretation is required.
Preserve actual recorded resources, shared UI/headless operations, session/control boundaries,
retry safety and sequential history. Do not manufacture grants or silently apply extra damage.

The [Surges rule](../vendor/steel-compendium/en/unified/md/rule/resource/surge.md), pinned revision
`fb83a789da8f0327a389c277a0c790b1648d5810`, remains the basis for actual gains/spends and clearing
remaining surges at combat end. A direct field edit is an attributed manual adjustment; this counter
inclusion does not certify automatic spending or unique resource logic. The later common combat-end
cleanup decision below includes automatic clearing of remaining surges. Unsupported extra
damage uses the established manual Stamina adjustment route rather than an added damage editor.

#### v0.01 Defend and Aid Attack

Confirmed 2026-09-14: include Defend and Aid Attack as usable common actions. Record their use,
acting creature/user and applicable target; track the source-defined action allowance and show
complete source text in the game log. Defend uses a main action; Aid Attack uses a maneuver.
Use registered UI/headless operations, existing targeting, allowance warnings, session/control
permissions, retry safety and history. The app does not infer spatial eligibility from roster order.

Resolve the benefits manually through the agreed per-target edge/bane controls and ordinary roll
inputs. Do not automatically detect beneficiaries or consume/expire their modifiers. Preserve all
source qualifications and timing in the readable text; recording the action does not certify
its effect automation. No extra condition, attack-wide modifier layer or hidden timer is required.

Sources: [Defend](../vendor/steel-compendium/en/unified/md/feature/common/main-actions/defend.md)
and [Aid Attack](../vendor/steel-compendium/en/unified/md/feature/common/maneuvers/aid-attack.md),
pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`. This scope does not change already-
included common attacks, Catch Breath or other supported clock behavior.

*Implementation note, 2026-09-14 (R04):* their benefits enter the roll only as supplied per-target
edge/bane counts; [the R04 contract](roll-and-damage-resolution.md) sections 1.4 and 1.7 define how those counts resolve.
No automatic benefit detection is added.

#### v0.01 temporary Stamina

Confirmed 2026-09-14: include a separate Director-editable temporary Stamina value on heroes and
foes, persisted with the existing attributed Manual adjustment records. Supported damage consumes
available temporary Stamina first, then applies the remainder to ordinary Stamina. For example,
10 temporary Stamina absorbs 10 of 16 damage; the remaining 6 reduces ordinary Stamina. Log both
state changes with their cause; retries and undo/redo must preserve the complete result coherently.

Ordinary healing, including Catch Breath, does not refill temporary Stamina. Keep it separate from
maximum Stamina, recovery value and winded calculations. It does not itself remove dying/dead
states or revive a Slain foe. Existing hero-dying automation remains deferred. Ability-specific
grants are manually resolved; no automatic interpretation of granting features is required.

Source: [Temporary Stamina](../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md),
pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`. A sourced grant keeps the greater of
the current temporary amount and the new grant, whereas a Director setting the field is an
explicit manual adjustment. The source normally ends temporary Stamina at encounter end unless
otherwise indicated. Grant/closeout integration must respect known exceptions and the separate
Void keep/reset contract; this input/damage decision does not invent those detailed interfaces.
The later common resource cleanup decision includes automatic normal combat-end clearing;
source-specific exceptions remain manually adjudicated.

*Implementation note, 2026-09-14 (R04):* the application order (weakness, immunity, temporary Stamina,
Stamina) and the winded/slain/dying labels are in [the R04 contract](roll-and-damage-resolution.md), section 6, with examples in
10.7 and 10.8. Temporary Stamina is excluded from the winded and recovery values.

#### v0.01 Catch Breath

Confirmed 2026-09-14: automate the ordinary hero Catch Breath maneuver. On accepted use,
spend one actual Recovery, restore Stamina using the hero's actual recovery value and record the
maneuver and both state changes together. Use the shared operation across UI/headless callers,
with source text, actual acting-user attribution, action tracking and authoritative persisted
Recovery/Stamina values. Retries cannot spend or heal twice; undo/redo restores the recorded use
and its linked state changes under the existing history boundaries.

The operation requires a Recovery to spend and follows the existing affordability contract;
never supply artificial resources. The source baseline recovery value is one-third of maximum
Stamina, rounded down. Use actual supported recorded values and source rules. The ordinary healing cap is confirmed
below; source-specific eligibility and exceptions still require verification before implementation. Director manual
numeric adjustments remain available as separate logged events.

Source: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
[Catch Breath](../vendor/steel-compendium/en/unified/md/feature/common/maneuvers/catch-breath.md)
and [Recoveries](../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md).
Keep the earlier hero-dying automation/warning deferral and manual adjudication. This does not
certify class-specific healing, NPC recovery rules or the deferred respite flow.

Out-of-combat Recovery spending confirmed 2026-09-14: heroes may use the same basic healing
control during FreePlay, one actual Recovery per use, restoring Stamina using actual recovery
value. Do not consume a combat maneuver allowance outside combat. Record the spend and healing
together and preserve affordability, retries, source eligibility and history. Repeat uses are
available while the hero has Recoveries remaining. Existing running-session/control permissions
and Director acting authority apply. This does not start a respite or replenish Recoveries.

*Implementation note, 2026-09-14 (R04):* bounds verified against the pin in [the R04 contract](roll-and-damage-resolution.md),
section 7: recovery value `floor(maxStamina / 3)`, one Recovery, foes have no Recovery pool (blocked as
unaffordable), dying is a warning only, temporary Stamina untouched. The cap was initially a
provisional interpretation; the user confirmed it in Q-R-3 below. Examples in 10.9.

Confirmed 2026-09-14 (Q-R-3): ordinary healing stops at maximum Stamina. Excess healing is lost,
and the Recovery is still spent. For 24/30 Stamina and recovery value 10, spend one Recovery and
finish at 30 Stamina, restoring 6 and losing the remaining 4 healing. Record the actual spend,
healing and cap application together.

#### v0.01 manual condition tracking

**Current scope confirmed, 2026-09-14: simple condition toggles.** Provide one on/off toggle for
each core condition on a creature. Players can change their own controlled heroes' conditions;
the Director can change conditions on all heroes and foes. Persist each condition's on/off state
and append an attributed change to the game log. Use existing shared UI/headless operations,
session/control permissions, audience boundaries, retry safety and sequential undo/redo.

Toggling is a new live-state change, not an edit of a previous attack. Record the actual user,
creature, condition and before/after state. This does not require a source name, an originating
ability selection, a duration selector, expandable application records or a remove-source workflow.
Each condition is independently toggled; Clear all remains deferred.

This supersedes the earlier v0.01 source/duration/application UI decisions. Keep those discussions
as historical/future material, not prototype gates. Ability-driven condition application and expiry
can follow when the parser understands the applying ability. A manual toggle supplies no duration,
so it cannot schedule expiry or imply a save-ends rule. Do not fabricate timing from the condition
name or silently clear toggles at turn/encounter end. The broader game clock remains in scope;
save handling for these toggles is now confirmed as manual: roll through ordinary dice controls
and toggle off the condition when appropriate. Log the roll and toggle as separate operations.
Automatic save scheduling/removal for toggles waits for ability support. This narrows the earlier
automatic-save requirement for these manual conditions without removing other supported clock work.

The simple toggles record condition state; they do not certify every condition's consequences or
reopen unique feature automation. Existing manual per-target edge/bane entry stays in force.
See [the current walkthrough](v001-basic-play-walkthrough.md#condition-tracking--current-v001-scope).

**Implementation note, 2026-09-14 (R05):** the toggle list is the nine conditions in the Compendium condition index, with verbatim effect text in `shared/content/core-conditions.json` (verified by `tests/core-conditions.test.ts`). No condition entry defines a save-ends default; duration comes only from the imposing effect. Source paths, readable text and condition-specific endings are in [conditions and clock](conditions-and-clock.md#1-core-conditions).

#### v0.01 edge and bane inputs

Superseded for V1 by [the automation rulings](decisions/2026-09-24-automation-rulings.md#1-lasting-effects-and-modifiers-may-be-automated):
tracked effects may feed edges and banes automatically, and manual inputs remain an override.

Confirmed 2026-09-14: the acting player or Director supplies the applicable edge and bane counts
for an ordinary attack before its roll resolves. The shared roll operation applies their
rules-defined effect and records the supplied inputs and outcome. v0.01 does not require automatic
discovery of every situational, class or stat-block reason for these modifiers. They remain
roll-local inputs. The later post-roll edge/bane addition exception is recorded below; broader
attack-result editing remains deferred.

Control behavior confirmed 2026-09-14: provide next-attack edge and bane inputs, initially zero,
bound to the invoking user, acting character and individual target. Set them before completing
ability/target selection.
The accepted attack consumes the draft counts, records them with its outcome and resets the controls
to zero for the next attack. These are one-attack inputs, not persistent character modifiers.
Preserve target-completion firing without adding an extra confirmation to every attack.

Placement is deliberately flexible for playtesting. A compact input card in the game log is the
initial proposal, not a fixed placement requirement; the mechanics above are confirmed. If placed
in the log, it remains a case-specific interactive card under the existing persistent-history policy.
See [the walkthrough](v001-basic-play-walkthrough.md#next-review-case-pre-roll-controls).

Per-target support confirmed 2026-09-14: multi-target attacks allow different supplied edge and
bane counts for each target. Record those inputs with the respective target outcomes and clear
the drafts after the accepted attack, under the same one-attack lifetime. The table supplies
applicability; automatic detection of modifier sources remains outside the requirement.

Target-only inputs confirmed 2026-09-14: each target has its own complete edge and bane counts,
including for a single-target attack. There is no attack-wide count, inherited modifier or
attack-wide-plus-target stacking layer. A circumstance affecting multiple targets is represented
in each affected target's supplied counts. Apply the source's edge/bane arithmetic separately to
each target's counts and record its outcome. Start each target's inputs at zero and clear them
after the accepted attack; preserve flexible placement and the confirmed one-attack lifetime.

This does not change full-count auto-fire or require a new roll per target. Follow the source's
roll-sharing rules when establishing the mechanic contract. See
[the clarification](v001-basic-play-walkthrough.md#next-review-case-attack-wide-and-target-specific-counts).

*Implementation note, 2026-09-14 (R04):* the edge/bane arithmetic, the cancellation cases and the
one-roll/per-target tier rule are sourced in [the R04 contract](roll-and-damage-resolution.md), sections 1.4 to 1.7, with a
combination table in section 10.5. Counts above two per side add nothing.

#### v0.01 roll characteristic default

Confirmed 2026-09-14: when an action permits a choice of roll characteristic, automatically select
the highest current value among the permitted characteristics. The acting player or Director may
choose another permitted characteristic before firing. Display the choice and record both the
selected characteristic and actual value with the roll. A single permitted characteristic uses
that characteristic; never expand the source's permitted set to obtain a higher number.

This selects a roll input, not a persistent sheet edit or authorization for unique feature
interpretation. Preserve the settled target/fire behavior.

Confirmed 2026-09-14 (Q-R-2): use the same highest-permitted default for damage-characteristic
choices, evaluated independently from the selected roll characteristic. For Might 2 and Agility 1,
`N + M or A` defaults to Might 2 even if the roll uses Agility. Preserve the source's permitted choices
and record the selected damage characteristic/value; the highest value is a default, not a mandatory
choice. A single-letter damage expression always uses its specified characteristic.

*Contract note, 2026-09-14 (R04):* selection and recording are specified in
[the R04 contract](roll-and-damage-resolution.md), sections 1.8 and 4.1; ties resolve to printed order.
The former provisional Q-R-2 rule tying damage to the roll characteristic is superseded.

### Director edits to inline results

Scope clarification, 2026-09-13: the controls described here belong to case-specific interactive
cards. They are not generic editing of arbitrary log fields. Broader attack-result editors remain
deferred beyond v0.01, subject to the 2026-09-14 edge/bane addition exception below; editing
persistent sheet/stat-block/resource values remains included.

**v0.01 exception confirmed, 2026-09-14:** keep existing target-completion firing, including
full-count multi-target auto-fire, and allow edges/banes to be added afterward for each individual
target through the attack's interactive card. The proposed explicit Roll step was rejected.
Post-roll additions update that target's recorded attack inputs; they do not populate next-attack
drafts or introduce an attack-wide modifier field. Pre-roll inputs remain available.

Use the established correction contract below: retain the accepted dice, re-evaluate the target's
outcome and reconcile supported applied effects without dealing the full damage a second time.
Append an attributed linked correction with before/after inputs and outcomes; preserve the original
log entry. The existing historical-edit boundary still requires sequential rewind of later gameplay
before correcting an older attack. Pause, archive, retry and undo/redo rules remain in force.
Deferred unique effects still require manual resolution rather than newly implied automation.

This exception includes post-roll Add edge/Add bane controls, not direct damage editing or every
possible result editor. Acting-player authority confirmed 2026-09-14: the acting player may add
edges/banes to their own eligible attack in the same window as their gameplay undo, with the next
actor's turn start as the outer cutoff. Existing Director correction authority remains available.

Implementation clarification accepted for V26, 2026-09-16: consecutive edge/bane corrections
may continue the **same effective ability roll** while every intervening gameplay unit is a directly
linked correction of that roll. This includes correcting different targets of the same roll.
Each correction remains a separately attributed, sequentially undoable unit; the original accepted
dice and event remain unchanged. A Director correction still closes the player's window, and user-undo
settings, ownership, pause and encounter/session boundaries still apply. Any other gameplay, including
Resolved at table, requires sequential rewind before another correction. The Director may mark manual
clauses on a card after its linked corrections; that disposition then closes the correction window.
This clarification enables V26's consecutive one-bane then two-bane workflow without permitting edits
through unrelated later actions.

Confirmed 2026-09-14 (Q-A-601): **Enable user undo** also controls acting-player post-roll
edge/bane corrections. When it is off, players cannot add or remove edges/banes on their recorded
rolls; those corrections remain available to the Director under existing history/session limits.
When it is on, the existing correction window and authority rules apply. Check the setting in the
shared correction operation, including submissions from previously opened cards.

Apply the existing undo/history limits to this permission: another character's committed action
or a Director correction can close the player's window earlier. Correcting an older attack still
requires sequentially undoing intervening gameplay; being before the next turn does not permit
editing through it. End turn alone is not the next actor's turn start, but reaching an earlier
attack still follows the existing history order. Check eligibility in the shared operation when
the modifier correction commits, including for stale cards. Preserve attribution, original dice and linked
correction history. This grants no authority over another character's attack or other result fields.
See [the walkthrough](v001-basic-play-walkthrough.md#next-review-case-post-roll-addition-authority).

Removal confirmed 2026-09-14: the same target-specific card also allows reducing edge/bane
counts, including counts supplied before the roll. Use the same acting-player/Director authority,
undo window, earlier seams and sequential-rewind rules as additions. Counts cannot be negative.
Keep the original dice, re-evaluate supported outcomes and append the linked correction. This
extends the narrow modifier exception to additions and removals, not direct damage editing.

Confirmed placement: an Undo button accompanies inline results, under existing player/Director undo
permissions. Confirmed 2026-09-16: Redo takes the matching inline placement on the entry it would
restore; Rewind and Redo are also a discreet icon pair in the log pane's tab row, and only the
Enable user undo campaign setting lives in the table settings pop-up (see
[Confirmed combat layout](#confirmed-combat-layout)). No placement changes who may undo, rewind or
redo. Confirmed 2026-09-13: undoing an adjudication restores the prior effective result while
leaving the original ability use intact; undoing the original action is a distinct operation that reverses
its applied effects. Both correction and undo append new entries. The original log entry is never
rewritten, and subsequent undo and interpretation use the effective result established by the new entry
on the current history branch. Preserve original inputs/results and the links between action, correction
and reversal. This is not a last-write-wins shortcut across abandoned branches or unrelated effects.
Detailed dependencies within the permitted history window remain open.

Confirmed user requirement, with the later card-only clarification: the Director can modify eligible
results through case-specific interactive cards in the game log. In the user's hypothetical example,
Thorn's ability deals 14 damage to Boblin; a designed correction card can expose damage and edge/bane
controls. Submitting the card's edited value (for example with Enter) submits
the correction, reinterprets the affected resolution, updates affected live character/foe state, and appends
a Director adjudication entry to the log. The ability name and 14 damage are illustrative, not verified
mechanics for a particular ability. Existing running-session and closed-history policies still apply.

Source distinction: [edges](../vendor/steel-compendium/en/unified/md/rule/dice/edge.md) and
[banes](../vendor/steel-compendium/en/unified/md/rule/dice/bane.md) modify a power roll's total or outcome
tier, rather than directly adding/subtracting damage. One gives +2/-2 to the roll; double edge/bane instead
shifts the tier. Apply the source cancellation rules as well. A recalculated tier may change damage and
other effects. The user's suggested +2/-2 controls express edge/bane intent, not unlimited additive damage.

Confirmed historical-edit boundary, refined 2026-09-13: **rewind the entire intervening gameplay
chain before correcting an older event**, including within the same turn. Ordinary inline correction
may change the current effective result; it cannot change an earlier result while retaining later
committed actions. This applies to the Director as well as every other caller and covers roll inputs,
results and applied effects. Three turns back requires undoing all intervening gameplay, not a selective
patch to the old event. Turn progression also crosses the earlier event's boundary.

Enforce this through shared UI/headless operations, including stale inline controls. Rewind is sequential
under the existing player seams and Director current-encounter scope. Once at the intended point, append
the correction; original history remains readable, and new gameplay clears the available redo path while
retaining abandoned history and recorded outcomes for inspection. Closed sessions remain read-only.

An ongoing effect firing now or a valid source-specific response such as Lines of Force is current
rules resolution, not an ordinary manual edit of an older event. Those established response windows
and linked consequences remain. This does not authorize replaying later choices after an ordinary
historical edit. Automatic consequences belong to their initiating action; detailed internal undo-unit
representation remains an engineering contract.

Presentation and correction contract (confirmed where noted; remaining UI details are proposals):

- Show editable roll inputs separately from editable resolved damage. Label controls Add edge/Add bane
  with the actual applicable adjustment; do not imply every additional edge means another +2.
- Changing roll modifiers re-evaluates the outcome using the accepted dice, without rerolling. Directly
  editing damage records a manual effect override rather than reverse-engineering a different dice roll.
  Confirmed 2026-09-13: an explicit manual damage override remains effective through later modifier
  changes until the Director clears it. A modifier correction appends its new interpretation while
  preserving the still-effective override and its provenance; no historical entry is overwritten.
- Replace the prior applied effects coherently; do not apply the corrected full damage a second time or
  overwrite a sheet with an obsolete snapshot. Preserve original and revised values, inputs, affected
  targets and the actual adjudicating user in linked history. Submit through the same headless operation.
- At the current effective result, update its automatic consequences, defeat transitions and dependent
  pending cards coherently. If later gameplay actions have committed, rewind them before correcting the
  earlier result. Source-specific response reconciliation and pending-card restoration still need
  concrete walkthroughs; do not silently replay later choices or reroll dice. A new correction can invoke the engine; undo/redo still restores
  recorded states without re-executing rules or dice.

*Implementation note, 2026-09-14 (R04):* post-roll add/remove recomputes only the corrected target
with the same dice, leaves `naturalRoll` and the critical flag unchanged, and records the Stamina
reconciliation delta; see [the R04 contract](roll-and-damage-resolution.md), sections 3 and 10.10.

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

**Implementation note, 2026-09-15 (A04):** the check is `requireCharacterEditable` in
`convex/lib/encounters.ts`: locked when `combatLocked` was set at OK or when the character has a turn entry in
the campaign's committed encounter. `characters.save` calls it; A02's draft, level-up, restoration and
activation operations call the same helper. Characters not in the encounter are not locked. A07 clears
`combatLocked` at closeout or Void.

### Respite mode

**Kit-change option, confirmed 2026-09-15 (Q-CHAR-5):** The respite loop provides a dedicated,
owner-controlled option to swap to an eligible kit as the source permits. It is a logged respite
activity with no separate full-edit approval queue; preserve the ordinary activity cost and actual
source-specific exceptions. Finalizing the change records a build revision through the shared
UI/headless operation. Apply the current-value policy separately from actual respite restoration.
Kit swaps made through the regular character editor use normal Director approval; the respite
activity is the scoped exception. Language changes use normal edits and existing Director approval; other class reconfiguration
exemptions are not established by this ruling. See [the owning wizard policy](character-wizard-spec.md#language-edits-and-respite-kit-changes)
and [Changing Your Kit](../vendor/steel-compendium/en/unified/md/chapter/kits.md#changing-your-kit).
This is fuller V1 work and remains outside v0.01.

**Respite and sessions, confirmed 2026-09-24:** a respite lives inside one game session. The session
cannot be closed while a respite is open and unresolved; the Director first finishes (or interrupts)
the respite, then closes the session. Respite never spans closed sessions, so closed-session history
stays immutable without a special respite context.

**Ending a respite, confirmed 2026-09-24:** the Director ends an open respite in one of three ways:
1. **Cancel:** every change made during the respite is reverted to the pre-respite state (activities,
   kit swaps and other respite choices), as if it never started.
2. **Interrupt:** the respite ends early with none of its completion benefits (no restoration, no
   Victory-to-XP conversion, no level-up grants). What already happened during it stands, such as an
   accepted activity or a kit swap. The table returns to ordinary play; an ambush then uses the normal
   combat setup. It is not a combat void or rewind.
3. **Complete:** the respite's benefits apply, as below.

**Complete is final, confirmed 2026-09-24:** a completed respite cannot be undone or rewound. The
Director corrects mistakes with the existing adjustments (XP, Victories, Stamina, Recoveries). Cancel
exists only while the respite is open.

**Completing with unused options, confirmed 2026-09-24:** Complete never waits for players and has no
mechanical "everyone ready" state; players confirm verbally before the Director completes. Unused
optional respite activities and choices lapse. They must be clearly visible before and while
completing, per hero, in the same style as the wizard's unspent-points notice (for example "1 activity
still unused"). Nothing mandatory can be left undone: completion benefits need no player input, and
level-ups are taken later.

**Respite completion grants level-ups, confirmed 2026-09-24:** completing a respite converts Victories to
XP, and each threshold a hero's XP crosses grants that hero one pending level-up. Taking it is the
owner's separate character-sheet action (see the [level-up policy](character-wizard-spec.md#level-up));
the respite never waits for it, and the Director can resolve the respite and move on.

Confirmed: respite is its own dedicated table mode, with a self-contained gameplay loop that the Director
starts and ends. It has mechanics to support rather than being only a pause or a descriptive log entry.

**Respite participant selection, confirmed 2026-09-14:** the Director selects participating heroes,
with the current party selected by default and individual heroes removable from that selection.
This supersedes the earlier whole-party-only decision, which the user explicitly reconsidered.
Record who participates and calculate each hero's sourced activities, recovery and effects separately.
An unselected hero receives no ordinary respite benefits or personal respite-boundary advancement merely
because the rest of the party rests; source-specific effects on other creatures retain their own rules.
The relationship to closed sessions and later party changes remains to be designed. This is fuller
V1 scope, not an addition to v0.01.

Further rules research is required before defining the loop's steps, effects, or player controls. Respite may
connect to the downtime system; that relationship is explicitly unresolved. This checkpoint does not import
combat initiative, roster/sheet locks, void/reset behavior, or reward procedures into respite. Its
interruption and session-closure behavior require separate design informed by that research. The provisional
single-structured-state policy applies; nested respite is not required in the present design.

Initial source deep dive, 2026-09-14: [respite rules and V1 questions](research/respite-rules.md)
covers the ordinary lifecycle, advancement, activity allowances, cross-hero benefits, exceptions and
between-session play, with a [core-source inventory](research/respite-source-inventory.csv).
It supplies research and proposals; the current participant-selection decision is recorded above.
Session boundaries, scoped build changes, completion/level-up ordering, interruption and history remain open. Downtime-project
tracking and respite itself remain outside v0.01; the existing V1 downtime-project exclusion is unchanged.

## 5. Encounter workflow

Confirmed opening refinement, 2026-09-11: entry into a tracked combat encounter is always an explicit
Director operation. The user describes starting an encounter as a formalized process beginning with the
initiative roll. Selecting a FreePlay action does not automatically start the app encounter. The existing
rule-warning/manual-adjudication policy still applies. Previously resolved FreePlay actions retain their
state changes but do not spend the new encounter's actions or turns; see
[FreePlay carryover](#freeplay-baseline-and-combat-transition).

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
   remains one hero per group. Confirmed 2026-09-13: each ordinary monster also starts in its own
   initiative group; do not combine identical stat blocks automatically. Minions use their separate
   squad mechanism, not automatic ordinary-monster grouping.
3. The Director clicks **OK**. On the path that requires a roll, everyone at the table sees a shared
   **Roll initiative** phase of the action card, and any active player can click **Roll**, with Director
   access retained. Observers cannot roll. A separately nominated roller is not required
   for this encounter-opening interaction. This user-selected interaction is distinct from the source's
   Director-or-chosen-player wording; it does not establish permissions for other roll types.
4. After the roll, the winner chooses **Heroes first / Foes first**: 6+ awards the choice to the players,
   and 1–5 awards it to the Director. The user confirmed this choice step before the announcement.
5. The table receives the announcement of which side goes first and enters the combat encounter view.

Confirmed draft roster updates, 2026-09-13: before OK, setup follows the live rosters. Newly added
creatures appear included; removed creatures disappear. Remaining creatures retain their participation,
surprise and initiative-group choices; roster updates do not reset the draft. Existing roster-edit
permissions, including the pause lock, still apply. New ordinary monsters default to individual initiative groups; minion squads remain separate.

Confirmed setup commitment, 2026-09-12: **OK on the setup card is the dividing point between draft
preparation and an actual combat encounter.**

- Before OK, participant inclusion/exclusion, surprise and initiative-group choices are draft encounter
  configuration. Canceling discards these choices without starting combat. Separately accepted changes
  to the persistent foes roster, such as adding a monster, remain actual roster changes and are not undone
  by canceling the encounter draft.
- On OK, commit the encounter configuration, capture the current precombat gameplay state for restoration,
  and apply the existing party-roster and character-edit locks. Capture the baseline before combat-start
  gameplay effects change it. Then proceed to initiative roll/starting-side choice, or the already-agreed
  surprise-determined path. Combat is active during these opening phases even before the combat view is
  displayed or the first individual turn begins. Formal test requests are no longer part of the FreePlay-to-combat transition.
- After OK, abandoning the encounter uses the existing **Void: keep current state / restore starting
  state** choice, including before initiative is finished or any turn is taken. Void skips normal ending
  rewards/cleanup and releases the combat locks. There is no ordinary draft Cancel path after commitment.

The shared registered operation must record this transition and snapshot once; retries must not replace
the original baseline or restart the opening. This confirms the user-visible commitment boundary, not all
source-specific combat-start effect ordering, draft reconciliation or storage implementation details.

Confirmed Director-doctrine clarification: the Director can choose the starting side even when the roll
awards the choice to the players. Keep the choice control available to the Director on either result;
no player approval or delegation is required. Preserve the roll's source-defined entitlement separately
from the actual choosing user and accepted starting side in the recorded opening. This is an explicit
application of the existing Director table authority, not a change to what the d10 result means.

Confirmed: any participating player can submit **Heroes first / Foes first** when the players win,
with Director access retained. The roller's identity does not determine
which side wins the choice. Concurrent submissions must not create conflicting accepted starting sides;
later correction is separate from duplicate delivery.

Confirmed initiative-roll audience, 2026-09-12: the precise wording is **any active player can click
Roll**. Observers cannot roll; the Director retains their existing table-action authority. This resolves
the earlier "anyone" ambiguity without creating an observer exception. All eligible viewers may see the
public roll. Retain hidden-foe and private-stat-block policies when projecting the shared action card.

Engineering requirement for the eventual shared operation: concurrent clicks produce one accepted opening
roll, shared by everyone. Lock/snapshot timing is now confirmed at OK as above; roster changes while the
draft is open follow the confirmed draft roster updates (2026-09-13) above. No initiative operation or new automatic result is
implemented here.

**Implementation note, 2026-09-15 (A04):** `/combat start` opens a `combat-setup` interaction and a draft
`encounters` row (status `draft`); the draft stores only the Director's departures from the defaults
(excluded keys, surprised keys, group keys), so `encounters.current` resolves it against the live rosters
at read time and additions/removals need no reconciliation write. `/combat setup creature=@X
included=|surprised=|group=` edits it, `/combat cancel` deletes it (the generic card close is refused),
and OK is the card's answer: `interactions.respond` runs `combat.commit`, which takes the
`encounter-start` snapshot (participating heroes' live records, every foe, the Malice pool), sets
`combatLocked` on participating heroes, creates one group per creature (combined by group key), registers
the Malice lifecycle and surprise expiry, dispatches `combat-start`, then chooses the path: `roll` when both
sides have an unsurprised creature; `surprise-determined` (other side first, round 1 starts at once) when
exactly one side is entirely surprised; `adjudication` (phase `choice`, Director only) when both sides are
surprised or a side is empty. `/combat roll` (Director or any active player) records the d10 and the
entitlement (6+: players); `/combat first side=heroes|foes` records the chooser and starts round 1. Operations:
`convex/lib/combatOperations.ts`; read: `convex/encounters.ts`.

### Initiative groups: confirmed app model

Confirmed 2026-09-11: use **initiative groups** on both sides of combat. The user explicitly identifies
the general hero-side grouping concept as application functionality; it is not claimed as a named core
hero-side rules system. The term also matches the Monsters book's **Build Initiative Groups** section.
Reserve **squad** for the specific minion rules unit.

Confirmed conceptual refinement, 2026-09-13: an initiative group contains **turn entries linked to
actors**, rather than necessarily containing actors directly. Usually an actor supplies one entry;
multiple full-turn allowances can supply multiple entries referencing the same live creature. Creature
identity, Stamina, conditions and source-scoped resources/usage limits remain shared. Each actual turn
has its own identity and start/end boundaries. An entry for an available turn is not itself a started
turn and does not fire clock effects merely by appearing in the initiative display.

Earlier references to “creatures in a group” describe the ordinary one-entry case. Read those rules
through the actor-linked turn entries without changing the settled ordinary grouping, regrouping,
spent-turn, finished-group and interrupted-group behavior. Moving an entry does not refresh its used
turn or grant a new one. This refinement does not approve the earlier proposal to reactivate a mixed
group for a boss's later turn. Additional-turn placement is confirmed below. Dragging/regrouping moves
only the selected turn entry; the actor's other entries stay in their existing groups. The user
explicitly identifies this as already implied by turns being the grouped/draggable unit, not a separate
product choice. Apply direct consequences of this model without asking for repeated confirmation.
Minion squad membership and captain relationships remain a separate rules mechanism.

Confirmed additional-turn placement, 2026-09-13: granted full turns appear at the bottom of the
initiative roster, each in its own new initiative group, just as adding a new monster turn does.
Use this default for additional source-granted turn entries; do not add another live creature or
reactivate the creature's completed group. Source rules that require the turn immediately or directly
after another turn take precedence over the default selectable placement. Exact visual placement of
such immediately due work can follow its required timing without inventing a source delay.

Bottom-of-roster placement is presentation and group insertion, not a fixed chronological order or
an instruction to wait until everyone else has acted. Existing side choice and source turn eligibility
still apply. A granted entry references its actor's existing state, preserves the granting source and
actual duration, and does not refresh already-used turns. Showing it does not itself start the turn.
Interrupted individual turns resume as confirmed below. Regrouping moves only the selected entry.
Other source sequences retain their actual timing rules.

**Implementation note, 2026-09-14 (R05):** the round boundary used with these groups is stated in [conditions and clock](conditions-and-clock.md#22-boundaries-the-app-dispatches): a round ends when no unspent turn entry remains among current participants, quoting the source's "Once all creatures on both sides of a battle have acted"; Slain or removed creatures do not hold a round open (interpretation), and a creature added mid-round receives an unused turn in that round (Q-R-52, confirmed below).

#### Minion squads and captain state

Minion subgroup direction, 2026-09-13: the squad presentation is a subgroup inside an
initiative group containing up to eight minion members and an optional attached captain. The captain
is an independent creature/stat block and is additional to the minion membership limit. Preserve the
source's same-name squad and captain eligibility rules. The subgroup needs member-level dynamic action
participation and individual targeting; a repeated-entry view of one ordinary actor is insufficient.
Squad membership/attachment remains distinct from ordinary initiative regrouping. The squad
subgroup represents shared turn participation, not a sequence of independent ordinary minion turns.
Each member retains its own conditions, participation and source-timed effects; the captain
retains its separate actions, Stamina and targets.

**Adding a squad.** Confirmed 2026-09-13: add minions as one squad entry with a shared
turn, retaining the subgroup/member targeting model above. The add UI defaults to four minions and has
plus/minus controls selecting any whole count from 1 through 8; do not restrict it to multiples of four.
The optional captain is additional to that limit. Another squad requires adding another independent
entry with its own membership, pool and participation. Manual splitting/merging of live squads is not
part of this flow. The count control configures the squad being added, not a refill or casualty-edit
mechanism for a damaged live squad. Explicit source-driven creation, revival or transformation retains
its own handling. Preserve ordinary add/group placement rules and pause locks.

**Encounter value.** Confirmed 2026-09-13: use the given source EV and creature quantity to derive
cost proportionally: selected count × printed EV ÷ printed quantity. Six minions listed at EV 3 per
four contribute EV 4.5. Preserve fractions; do not round up to full packs. Independent squad entries
with the same total count have the same combined EV. The captain’s own EV remains separate. Retain the
source’s four-minion purchase text alongside this selected calculator policy.

**Coordinated actions.** Confirmed 2026-09-13: extend the existing multi-target/group-effect selection flow.
Select the squad attack's targets and assign a number of participating minions to each, up to three
per target under the normal source rule. Show assigned and remaining available participants while
preparing the action, then resolve the coordinated squad attack with one roll. Target selection alone
does not make the action ready while required participant assignments are missing. This replaces the
unconfirmed interpretation of independently resolving successive three-minion attack batches. Retain
which minions participate wherever their positions, conditions, action spending or other source facts
matter; a count is the UI summary, not permission to invent those facts. Reuse the existing missing-fact
card pattern and standing rule-warning policy. Captain participation is not counted in the three-minion
contribution or in the squad's minion budget.

Confirmed captain provision in the card, 2026-09-13: the squad's action/turn card must accommodate its
attached captain as well as the minion targeting flow. The captain acts at the same time as the squad
and retains its normal stat-block actions and allowances, subject to its source rules and conditions.
Provide access to those ordinary actions with captain identity and remaining allowances clearly shown.
Keep the captain's targets, rolls, costs, action spending and Stamina separate from the minions' shared
attack and pool. Resolving the minion attack does not execute or spend the captain's action; choosing a
captain ability uses the normal registered action operation and its own attributed game-log result.
The card coordinates shared-turn play; it does not create one combined captain/minion attack roll.
Minions choosing other permitted actions and source exceptions such as critical-hit main actions retain
their rules. Exact layout remains an implementation/UI detail. See
[the lifecycle report](research/minion-lifecycle.md#4-coordinated-attacks-and-maneuvers) and
[the captain rule](../vendor/steel-compendium/en/unified/md/rule/monster/captain.md#separate-actions-and-stamina).

Source constraints for that shared turn: each minion normally chooses move + main action, move +
maneuver, or two moves. Minions taking an individual maneuver do not also join the squad's main action
or maneuver. Coordinated signatures use one roll and one effect instance per target, adding only the
source-defined damage for additional contributors. Only participating minions gain the critical-hit
extra main action. Coordinated maneuvers and simultaneous same-squad free strikes retain their separate
source rules; the three-contributor limit is not a universal cap on every squad operation. Do not
require ordinary board-movement logging or invent remaining movement from this UI. See
[the source lifecycle](research/minion-lifecycle.md) for evidence and exceptions.

**Shared Stamina and captain changes.** Confirmed 2026-09-13: reducing minion Stamina by removing a captain bonus does
not itself kill surviving minions. Individual minions have a stat-block Stamina value used to calculate
pool capacity and casualty thresholds, not separately tracked current Stamina or residual wounds.
Damage and its remainder belong to the squad pool. With five Stamina-4 minions, 10 non-area damage
reduces the pool from 20 to 10 and removes two minions; no survivor is assigned a personal 2-Stamina
remainder. A later 2 damage to any survivor crosses the next pool threshold (10 to 8), removing the
minion hit. Damage is deducted once, with casualties derived from that change.
Confirmed clarification, 2026-09-13: when the captain dies, remove its Stamina bonus from the squad’s
total Stamina and preserve every surviving minion. The reduced pool may be below the survivors’ combined
stat-block Stamina values; accept that state. Do not normalize it by removing minions, assigning personal
wounds, or restoring pool Stamina to fit a derived survivor count. Bonus removal is a stat adjustment,
not damage or a casualty event. Track living identities separately from the current pool: the ordinary
fixed-threshold damage example above is not an invariant for deriving survivor count after stat changes.
Confirmed pool exhaustion after captain loss, 2026-09-13: for ordinary minions, subsequent non-area
damage that exhausts the remaining squad pool defeats all surviving members, even when the pool was
below their combined stat-block Stamina. Example: two Stamina-4 minions survive bonus loss with 3 pooled
Stamina; a subsequent 3-damage non-area hit empties the pool and defeats both. The bonus-loss adjustment
itself still causes no casualties. Record each defeated identity and its applicable consequences under
the existing casualty-selection flow. This ruling does not override explicit source exceptions or the
selected area-only casualty restriction.

Confirmed replacement-captain bonus, 2026-09-13: when an eligible replacement takes over at the
source-defined start of the next round, apply the squad’s printed With Captain benefit. A Stamina bonus
increases the current pool by that bonus for each surviving minion; three survivors receiving +2 each
add 6 to the pool. Defeated members remain defeated and contribute nothing to the increase. This is a
bonus adjustment, not revival or ordinary healing; it does not reset accumulated damage, participation
or turn spending. Preserve casualty history and surviving identities.
Non-exhausting damage thresholds after a stat adjustment were decided on 2026-09-20 (below);
source-driven membership changes remain a separate follow-up.

**User decisions, 2026-09-20 (V02 build thread).** These settle the arithmetic the 2026-09-13 rulings
left open. The user answered them directly in the foes build thread; this section is the owning record.

- *Casualty ladder.* Casualties come from the squad pool crossing step values, exactly as the pinned
  Shared Low Stamina and Dropping One Minion rules describe (a squad "loses a minion when they take a
  total of 5, 10, 15 … damage"). The step value is the member's printed Stamina plus any attached
  captain's Stamina benefit. The app keeps a running total of damage since the last casualty; every hit
  adds to it, and each time it reaches the current step value one minion dies and the total drops by
  that value.
- *Captain Stamina benefit.* Attaching a captain with a Stamina benefit raises the pool by the benefit
  per living member and raises the step value by the benefit; losing the captain lowers both. Neither
  change kills anyone by itself, and neither change touches the running total: carried damage survives
  the adjustment (a 1-point carry at step 9 stays a 1-point carry at step 7). Consequence: when a loss
  lowers the step below the carried total, the next hit of any size drops a minion immediately.
- *Zero kills the squad.* Whenever the pool reaches zero every remaining member dies, whatever brought
  it there: non-area damage, area damage drained through in-area members, or a captain loss whose
  reversion takes the pool to zero or below. The pool is clamped at zero. This supersedes the edge of
  the 2026-09-13 bonus-loss and area-only rulings at exactly zero; there is no separate pool floor.
- *Area damage.* Area damage adds to the same pool ladder. Each affected member contributes at most one
  step value to the pool loss (overflow above the step is discarded, regardless of modifiers, per the
  2026-09-13 ceiling); a member whose own damage reaches the step dies; any further ladder casualties
  from that hit are chosen only among in-area members. Outside-area members die only at zero.
- *Leaving mid-turn.* A minion killed during the squad's shared turn changes nothing about the turn;
  survivors and captain keep acting. A captain killed or removed mid-turn loses its benefit at once
  (pool and step revert) and the minions finish the turn. When the last minion dies during the shared
  turn and the captain survives, the turn continues as the captain's alone; once the captain has acted
  and the last minion falls, the turn ends. Administrative removal of a single living minion is not
  offered in V02: the Director removes the whole squad or lets damage do the work.
- *Acting-together scope.* V02 builds the signature squad attack, the squad maneuvers (Grab, Hide,
  Knockback and Search for Hidden Creatures together, with one roll and one instance per target where
  the source rolls), Free Strike Together (simultaneous same-squad free strikes summed as one strike),
  and the critical-hit extra main action for participating minions only.

Worked example under these decisions (four Dwarf Axethrowers, Stamina 7, +2 Stamina with captain):
pool 36, step 9. A 10-damage hit leaves 26, kills one and carries 1. The captain dies: pool 20, step 7,
carry 1. The next death lands after 6 more damage (pool 14), the next after 7 more (pool 7), and zero
takes the last.

**Implementation note, 2026-09-20 (V02).** A squad is a `squads` row (pool, step, carried damage,
member ids in roster order, captain, parsed With Captain benefit, proportional EV, shared-turn
participation, owed casualty choice) plus one `foes` row per minion carrying `squadId`; a minion's
row holds its printed Stamina while it lives and 0 once the ladder drops it, so Slain labels, the
round boundary and cleanup read minions like other foes. The ladder arithmetic is pure in
`shared/resolve/squad.ts`; damage from any ability use, free strike or coordinated action on a
minion is routed once per squad through it, area-aware from the ability's target shape. The squad
is the actor of one turn entry (`squad` actor kind); its living members and attached captain are
the turn's participants, so global every-turn work fires once. Registered operations: `squad.add`
(count 1–8, optional captain), `squad.remove` (whole squad), `squad.captain` (attach or `none`),
`squad.participation`, `squad.casualties` (the inline card's continuation, also direct),
`squad.act` (signature attack with up to three contributors per target and free-strike extra
damage, or Grab/Knockback/Hide/Search together) and `squad.free-strike` (Free Strike Together).
Automated With Captain forms are `+N bonus to Stamina`, `+N damage bonus to strikes`, `Gain an
edge on strikes` and `Have a double edge on strikes`; every other printed benefit is shown as text
for manual play. Interpretations recorded here, both from `chapter/monster-basics.md`: in the
coordinated signature attack each target "is affected by only one instance of the ability" (Squad
Action), so a captain's strike damage bonus applies once per target; the alternative considered,
once per contributing minion, would add the bonus to the free-strike contributions the source
describes as extra damage rather than strikes. In Free Strike Together "the damage from each
minion's free strike is added together" (Free Strike Together), so each minion's own strike carries
the bonus before the sum; the alternative, once on the merged strike, would deny the benefit the
captain rule grants to "each minion". A minion that uses a Strike ability on its own while a
captain with a strike benefit is attached is pointed to `/squad act` with itself as the only
participant, where the benefit applies; its lone free strike carries the bonus directly. A dead
captain edited back above zero is not re-attached.
Known limits: post-roll corrections that would change squad pool damage are refused in V02 (rewind
or adjust the pool instead); minion immunities and weaknesses printed as anything but `-` still
leave damage manual, so the once-per-squad modifier rule has no automated case yet; compiled push
effects are not routed through the coordinated attack, whose tier text records them for manual
resolution.

Global “every turn” effects fire once per shared squad/captain turn,
not once per participant (confirmed 2026-09-13). A captain’s personal extra turn
belongs only to the captain and does not refresh squad participation (confirmed 2026-09-13).
The subgroup, member reticles and captain action controls are already selected and are not reopened by
those questions.

#### Both-side initiative groups and scope

**V1 scope clarification:** implement initiative groups and multiple-hero control, but defer playable
retainers and friendly monsters beyond V1. Keep the grouping model extensible to those actors without
implementing their control, attachment or special mechanics now. Their source research below informs that
future extension; it is not a V1 acceptance requirement. Readable core-reference coverage remains separate.

- In V1, each hero is automatically placed in their own initiative group. One player may control multiple heroes; those
  heroes remain separate actors and separate default groups. Multiple-character control was already
  required; this supplies its missing initiative organization.
- Only the Director can change hero grouping in V1, including combining multiple heroes into one group
  during initiative setup and while combat is running. Players do not create or edit initiative groups.
  This preserves the automatic one-hero-per-group default.
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

#### Mid-combat additions and regrouping

Confirmed 2026-09-12: adding a new monster during combat automatically includes it in that encounter,
in a new initiative group at the bottom of the initiative list. It does not default to an outside-combat
reserve. The Director can change its placement and group. This specifies the default insertion, not a
new fixed initiative sequence replacing the established side/group choice and alternation rules.
Confirmed 2026-09-12: the newcomer has an unused turn available in the current round, with Director
adjustment available. It need not wait until the next round merely because it joined mid-round.
Reaffirmed 2026-09-14 (Q-R-52). The requested [independent rules lookup](research/mid-round-reinforcements.md)
found this consistent with the ordinary turn rules and found explicit same-round precedent for on-turn
summons, but no general rule specifically addressing ordinary mid-round reinforcements. Preserve
source-specific timing, including immediate-after-summoner timing for summons when supported. The
question queue's provisional label was stale; this remains a confirmed app decision.

The Director can move selected turn entries between initiative groups during combat. **Spent-turn
state belongs to that entry, separately from group completion and the linked creature’s shared state.**
Moving it does not reset its spent turn or allowances. A spent entry remains grayed out when its
destination group activates; other entries for that creature retain their own entitlement. Shared squad
turns additionally preserve member participation and the captain’s separate actions. Under the standing
warn-without-blocking policy, graying communicates status rather than an additional permission lock.
Source-specific extra turns and deliberate adjudication remain distinct from regrouping.

Addition and regrouping use registered, attributed, ordered game operations accessible through the UI,
command palette and headless interface. Preserve creature identity, effects and history when changing
group membership; do not recreate the creature to move it.

Confirmed finished-group behavior, 2026-09-12: moving a creature with an unused turn into a group that
has already finished does **not** make that group eligible to activate again in the current round.
Preserve the group's completed activation separately from each member's spent-turn state. Do not mark
the transferred creature as having acted merely to represent its group's completion, and do not reset
the group's completion because the new member is unspent. The standing warned Director-adjudication
path remains separate from automatic eligibility.

Confirmed round completion after regrouping, 2026-09-13: once all initiative groups on both sides
have finished, advance the round even if an unacted creature was moved into a group that had already
finished. That creature waits for its group's next activation. Do not reopen the completed group, invent
a turn for that creature or mark it as having acted in the completed round. Preserve its actual action
history; this case does not block round progression. Finish any active individual turn and required
dependent work before advancing, and resolve the genuine round boundary under existing clock rules.
No individual turn-start/end effects fire for a turn the creature never took.

Confirmed current-actor transfer, 2026-09-12: moving the currently acting creature into another group
does not interrupt, end or restart its individual turn. Preserve its current turn identity, spent actions,
effects and clock boundaries; the move does not fire an extra turn-start/end event.

Confirmed regrouping handoff, 2026-09-12:

- If the current actor moves from active group Red to Blue, its individual turn continues. When it ends,
  Red remains the active group and continues with its remaining members. Changing membership does not
  transfer the active group to Blue.
- A creature with an unused turn that joins a still-active group may act during that group's current
  activation. This differs from joining a group that has already finished, which does not reopen it.
- If regrouping leaves the active group with no remaining members able to take an ordinary turn, it
  completes automatically and passes control under the existing side/exhaustion rules once any current
  individual turn and required effects finish. Do not prematurely end a transferred actor's ongoing turn
  or bypass pending required input. No separate group-completion confirmation is needed.

Source-derived multiple-turn allowances use the confirmed turn-entry model above. The
[boss research](research/boss-turns-and-extra-actions.md) distinguishes the relevant cases:

- Most core Solos get two nonconsecutive full turns per round; Ajax can take up to three.
- Scaleshatter Burst gives a draconian a total capacity of two turns per round until encounter end,
  not two additional turns on every use. Its text does not add Solo's nonconsecutive restriction.
- Solo Action buys an additional main action on the current turn; it creates no new full-turn entry.
- Villain actions have their own shared per-round allowance and individual encounter uses. Extra
  triggered-action capacity also retains its source scope; neither is a full-turn allowance.

Known full-turn capacity is represented by entries linked to the existing actor; conditional entries
become available when their actual grant resolves and recur only for the grant's duration. New entries
use the established own-group default unless source timing requires otherwise. Ordinary regrouping
never manufactures an entitlement or reopens a completed group. Earlier mixed-group reactivation and
counter-only proposals are historical, not outstanding product choices.

The compact turn manifest remains the presentation direction for source-derived turn/action allowances
and applicable choices. Optional purchases are not displayed as already granted. Exact placement is a
UI detail. It reflects recorded actions and supplied facts, without inventing tracked movement.

A participant can End turn early with unused actions. Resolve that actual turn's end effects and required
work; there is no separate boss-specific forgo-turn control and no permission to erase future turn
entitlements without their boundaries. Source-directed interruptions resume as specified below.
Confirmed captain extra-turn ruling, 2026-09-13: a personal extra full turn belongs only to the
captain, whether recurring or granted by an effect. It does not grant the minions another turn or
refresh their participation. Keep the existing squad attachment and captain benefits; the captain-only
entry follows the established placement, timing and interruption rules. Effects explicitly granting
turns to minions retain their own targets and timing; multi-recipient scheduling remains separate.
Label the shared squad/captain entry distinctly from captain-only extra entries. Choosing a legal entry
follows the existing Director turn-selection and source timing rules; do not impose a new universal
requirement that the shared entry must be the captain’s first actual turn.
See [the source analysis and selected interpretation](research/boss-and-captain-turn-review.md).

Confirmed current-monster removal, 2026-09-13: if the Director removes a monster from the foes roster
while it is taking its turn, automatically finish that individual turn. Resolve applicable end-turn
effects before continuing through the existing group/side/round handoff rules; no separate End turn
click is required. Removal must retain the identity/state needed to resolve and record that work, and
retries must not duplicate the turn boundary or its effects. This is roster removal, not a declaration
that the monster was killed. Existing required-input and optional-response policies still apply.
This ordinary individual-turn handoff does not exhaust surviving participants when a minion or captain
is removed during their shared turn. Exact shared-turn handoff on removal remains a follow-up; apply the confirmed captain-bonus
adjustments without reopening their casualty rules; preserve surviving participation rather than inventing a whole-squad End turn.
Roster removal is blocked while the session is paused. Resume before removing the monster; no deferred
removal or resulting turn/clock processing is queued during the pause.

**Implementation note, 2026-09-15 (A04):** `foe.add` during a committed encounter creates a new bottom
group with one unspent entry (Q-R-52 confirmed choice A); `foe.remove` of the acting foe dispatches its
`turn-end` first, then removes its entries. `/group move entry=<id> group=<id>|new` moves one entry with its
`spentRound`; group completion is `completedRound === encounter.round`, so a finished destination stays
finished and every group is unspent again when the round changes without a reset write. A group left with
no entries is removed unless it is the active group, which completes when the current turn ends (the
empty-group presentation question is otherwise unchanged). `/turn take` warns for an entry already
spent this round, for an entry whose group finished this round, and while another group is active.
Spent/completed state remains recorded; an unfinished group's activation resumes after a deliberate
departure. Acting out of side order also warns. A competing active turn is still refused.
Round advance happens in `settle` (`convex/lib/initiative.ts`) when no turn is active and every group is
finished, at most one round per operation, and only when some entry can act in the new round.

**Documentation audit, 2026-09-14 (Q-A-400):** the existing [Take turn policy](#taking-a-turn)
and [regrouping contract](#mid-combat-additions-and-regrouping) already distinguish automatic rule
eligibility from warned deliberate departures. The earlier hard refusals required an A04 repair,
not an unanswered policy choice. Preserve completed groups and spent-entry history;
do not force regrouping merely to bypass a rule-eligibility refusal. Access/session restrictions and
coherent sequencing still apply, including no competing ordinary active turns. The repair was
implemented and independently reviewed on 2026-09-15; persisted-state regressions cover the warned path.

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
  independently re-researched at the user's request; the app's Take turn/End turn interaction is
  confirmed in [Taking a turn](#taking-a-turn). The user separately accepted successive complete turns for combined hero groups
  as an app decision; the players choose their member order among themselves.
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
deferred feature. New monsters default to a new group at the bottom during combat, and Director
regrouping preserves each entity's spent-turn state. Newcomers have a current-round turn available;
adding an unspent member does not reopen a finished group, and moving the current actor preserves its
ongoing turn. The original group continues after a transferred actor finishes; unspent arrivals may join
its still-active activation, and no remaining turns causes automatic completion after required work.
Specific extra-turn rules, other within-group interruptions and dependent undo still need contracts.
A single group-level "acted" flag is not a complete turn model.

### Overall encounter sequence

Confirmed product sequence, subject to the rules notes below:

1. **Prepare participants:** the Director selects heroes and existing monsters from the foes roster, retaining
   their current values. Saved encounter loads (V1, deferred beyond v0.01) create independent roster instances
   under the catalog/data specs. Preparation and loading do not by themselves establish that initiative has begun. Starting the
   encounter locks the party roster and participating character sheets against editing; capture the starting
   gameplay state before encounter-start mechanics so a later void can restore it. Encounter actions update
   the main sheets immediately.
2. **Determine the starting side:** the Director initiates the opening procedure. Record dice and any required
   choices or exceptions.
3. **Choose who acts:** the ordinary path lets a player choose **Take turn** for a character they control
   on the acting side, and lets the Director do so on their behalf or choose an enemy group. Initiative-group
   membership is respected: Take turn starts that hero and their group; after the hero finishes, another
   member uses Take turn. Completing all member turns ends the group and advances play under the side rules. Evaluate source eligibility separately from the deliberate warned-departure path.
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
to interrupt or respond. The standing prompt window, early-close rule and sequential undo contracts
(2026-09-13) settle the general interaction; source-specific ownership and ordering of pending decisions
remain open. This checkpoint is a specification, not an implementation claim.

### Formal encounter closeout

Confirmed 2026-09-13: provide UI for the Director to formally close out the combat encounter, integrated
with the existing wrap-up workflow. The Director's explicit **End combat** closes unused optional combat
responses, including any still open after the final attack; no next individual turn is needed to expire
them. This is an additional cutoff to the normal next-turn-start deadline, not automatic expiry merely
because the final foe falls.

Confirmed end-of-structure boundary, 2026-09-13: choosing End combat ends structured turn play.
Do not automatically finish the current individual turn, complete remaining group turns, or advance
through a round boundary. End combat itself does not cause ordinary end-turn saves, damage, resource
grants or round work merely to finish the combat clock. Turns no longer govern progression once combat
has been ended. Required resolution already caused by committed actions still completes under the
existing closeout contract, as do applicable combat-ending effects, rewards and cleanup. This decision
does not automatically remove every ongoing effect: source-specific effect cleanup and outside-combat
behavior retain their own rules and any unresolved contracts.

Required unfinished resolution must complete before rewards and cleanup. Present its missing inputs
through the existing action-card convention; closing optional responses does not silently resolve or
skip required work. Closeout then proceeds through applicable outcome/rewards and cleanup, including the
existing stash allocation flow, before returning to FreePlay. Preserve original actions and prompt history,
record closure and finalization once, and reject stale responses to closed opportunities through shared
UI/headless operations. Void retains its separate keep/reset procedure.

The formal closeout UI is confirmed; exact presentation and source-specific end-effect/reward ordering
remain to be designed. Responses newly required or offered by closeout effects need their own applicable
resolution steps; the cutoff does not preempt work created by the ending procedure itself.

Common resource cleanup confirmed for v0.01, 2026-09-14: automatically clear remaining surges
and temporary Stamina at normal combat end through the established closeout flow. Record actual
before/after values and the automatic cause once; retries cannot repeat the cleanup or create
new changes. Source-specific exceptions remain manually adjudicated; do not silently claim a
known exception was resolved by the default. Exact exception handling remains an integration
contract. Preserve the recorded state/history up to the existing final archive boundary.

This common cleanup does not automate class/monster-specific grants or spending. Ordinary
Stamina, condition toggles and unrelated retained resources are not cleared by this operation.
Void skips it and preserves its existing keep-current/reset-to-start semantics. Source:
[Surges](../vendor/steel-compendium/en/unified/md/rule/resource/surge.md) and
[Temporary Stamina](../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md),
pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810`.

Source check for closeout, 2026-09-13: [Classes — Ending Effects](../vendor/steel-compendium/en/unified/md/chapter/classes.md#ending-effects)
says combat-imposed effects/conditions on heroes can end when the encounter ends if the hero wants,
unless otherwise noted. Winded, unconscious and dying are explicit exceptions. Effects on other
creatures end when convenient for the heroes, subject to Director adjudication; do not assume blanket
foe-effect removal. [Temporary Stamina](../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md)
and [surges](../vendor/steel-compendium/en/unified/md/rule/resource/surge.md) have their own combat-ending
rules. These source findings do not require simulating a final turn.

Confirmed cleanup ritual, 2026-09-13: encounter closeout displays a list of applicable options
for each player's character so they can take stock and resolve the actions or effects they choose.
Use the existing game-log action-card/prompt pattern, with each option bound to and clearly labeled for
its acting character. This includes eligible choices to end effects and other applicable encounter-end
options. Derive the list from the character's current state and source rules; do not invent a universal
set of cleanup actions. Shared-controller characters retain their own choices and bookkeeping, and the
Director retains existing acting authority.

This replaces the proposed default-clear approach: optional effect removal follows the user's choice,
not silence or an automatic clear-all. Unconditional source-required ending work still resolves under
its own rules. Preserve costs, resulting state changes and attribution through shared operations and
the game log. These are options supplied by closeout; End combat's closure of unused combat responses
does not close them before they can be used.

Confirmed cleanup completion, 2026-09-13: the Director's **Finish cleanup** closes remaining unused
optional cleanup choices and completes the ritual once the table is ready. Required unfinished
resolution must complete first. No separate ready confirmation from every player is required.
Close the unused choices without executing them; this does not automatically remove effects the
player did not choose to end. Preserve resulting state and history, reject later responses to those
closed choices, and return through the established FreePlay transition. This is the completion step
of the existing closeout workflow, not another turn boundary.

Confirmed Victory award, 2026-09-13: the Director grants the number of Victories during encounter
closeout. Present an editable award amount, initially 1 and allowing 0, and the heroes receiving it.
Clarified during G5 review: use [source-earned Victories](../vendor/steel-compendium/en/unified/md/rule/resource/victories.md),
without artificial awards to fund the test. Survival and achieved party objectives earn the ordinary
award, with the source's Director discretion for trivial or particularly challenging encounters.
Deliberate numeric adjustments remain separately attributed table operations; see
[the numeric-edit scope clarification](fury-goblin-automation.md#victories-and-numeric-adjustments).
The initial value is not an automatic grant: the Director confirms the award. Use source survival and
party-objective eligibility with Director difficulty adjudication; enemy elimination alone cannot
select the award. Apply the confirmed amount to the recipients' current Victories and record the grant,
recipients and actual Director attribution in the game log. UI and headless callers use the same
operation; retries and Finish cleanup must not grant the award again. Corrections retain existing
history boundaries. Detailed source-specific closeout ordering remains separate.

Confirmed encounter archive, 2026-09-13: Finish cleanup, or Void after applying the selected
keep/reset outcome, closes the encounter as a historical archive. It remains readable under existing history permissions, but no player or Director
can undo its finalization, reopen it, or rewind gameplay across that completed-encounter boundary,
even while the session remains open. Ordinary corrections cannot edit archived encounter events.
The Director may make new, attributed adjustments to current state; those do not rewrite the archive.
Separate inventory/progression history keeps its existing scope and cannot reopen the encounter.
This is a gameplay boundary, not a requirement to wait for compression or move storage before play
continues. The next FreePlay stretch starts after this boundary; a paused session remains paused. Void
retains its voided disposition and skips normal ending effects and awards.

Implementation note (A07, 2026-09-15): shared commands are `/combat end`,
`/combat victories amount=1 recipients=["character-id"]`, `/combat finish`, and
`/combat void mode=keep|reset`. Controls include the encounter identity to reject stale cards.
End combat and the explicit Victory confirmation remain ordinary sequential journal units until
Finish cleanup or Void seals the archive; rewinding End combat restores its recorded turn and
pending choices without rerunning a boundary. Manual clause dispositions offered during the current
closeout are continuations, not corrections of old damage; ordinary correction limits still apply.

The v0.01 reset uses the existing combat-start hero/foe/Malice snapshot. A foe deleted during play
receives a new storage ID on restoration because the database allocates IDs; the existing historical
identity alias links it to its original record. Surviving foes retain their IDs and all records restore
from the captured values. Loot, squad/captain relationships and saved roster preparation do not yet
have v0.01 persistence; this implementation does not claim those deferred subsystems.

### Voiding an encounter

Confirmed: the Director can **void an encounter**, ending it without the normal closing procedure. Do not
award Victories or apply any other encounter-ending benefits or consequences. The action card asks whether to:

| Choice | Result |
| --- | --- |
| Keep current state | Keep current Director-panel gameplay state, including foes and loot, plus character-sheet values, including changes already applied during the encounter. Skip normal encounter-ending rewards, cleanup effects, and consequences. |
| Restore starting state | Restore the combat-start Director-panel gameplay snapshot, including foes and loot, plus recorded character-sheet gameplay state. Remove later additions and restore original state. Skip normal encounter-ending rewards, cleanup effects, and consequences. |

Confirmed Void roster restoration, 2026-09-13: **Restore starting state** restores the foes-roster
membership captured at combat start as well as its recorded gameplay state. Remove live roster entries
added after that snapshot and restore original entries removed during combat, with their original
identities, recorded values and roster relationships, including prepared grouping and squad/captain
assignments. Do not recreate them from a possibly changed catalog/template or erase their retained
history. The encounter itself ends; restoring roster preparation does not restart its initiative.
**Keep current state** instead retains current foes membership, relationships and values.

This restoration is part of the explicit Void operation, including when invoked while paused; it does
not unlock ordinary paused roster edits. Campaign membership, character access and other unrelated
account changes remain outside the reset. The general Director-panel snapshot rule below also governs
loot/stash restoration.

Confirmed general Director-panel reset, 2026-09-13: **Restore starting state** returns the
Director panel's gameplay/preparation state to its combat-start snapshot. This is one restoration rule,
not separate policies for each kind of mid-combat addition. It includes the foes roster and recorded
monster state/setup, grouping and squad/captain relationships, and the live loot/stash state represented
in the panel. Monsters and loot added after combat started are removed; content present at combat start
is restored from the snapshot. Rewards loaded before combat are part of that baseline and remain.
**Keep current state** retains the current Director-panel gameplay state, including later monsters/loot.

Record the reset and preserve the original history and load/item/creature identities. Reconcile any
linked provisional allocations or inventory changes needed to restore those items coherently, without
leaving claims on removed items or duplicating items between locations. Restore recorded state rather
than rerunning template loads or reward grants. Existing character-state restoration and separate
account/access boundaries still apply. When Void is invoked while paused, the explicit panel reset is
allowed but the session remains paused and the ordinary roster-edit lock remains intact.

Confirmed paused Void, 2026-09-13: the Director may Void an encounter while the session is paused,
using the existing keep-current-state or restore-starting-state choice. This is an administrative
lifecycle operation permitted through the shared UI/headless path without first resuming. After Void,
the session remains paused with no active combat. Release combat-imposed locks while preserving the
separate pause roster lock; ordinary gameplay and roster editing remain blocked until Resume. Apply
the chosen Void disposition once and preserve its log; do not run normal combat-ending rewards or
cleanup merely because the operation was permitted during a pause.

Both choices end the encounter and release its combat-imposed party lock; the separate pause lock
still applies while the session remains paused. When voiding without closing the session,
the table returns to free play and can start a new encounter after roster changes. When voiding as part of
session closure, the session instead becomes historical. Voiding does not automatically start a replacement
encounter. Keeping current values does not mean rolling back already-applied damage or costs; restoring the
starting state does.

This is a confirmed application control, separate from a normal rules-defined encounter conclusion and from
stepping backward through individual actions. Closed sessions remain permanently read-only in v1; voiding does
not provide a route to reopen them or edit their history.

Proposed implementation contract:

- Capture the authoritative starting gameplay state, including Director-panel foes/loot state, stable
  creature/item identities and relationships/allocations, relevant character and monster values and shared
  state needed for coherent restoration, before encounter-start grants/costs/resets. Distinguish this
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
  not mutate the reusable source. Keep preserves current roster instances; reset restores the combat-start
  roster and removes post-start additions. The resulting roster can be selected into a new encounter.
  A fresh template load requires the explicit replace/append choice when the roster is nonempty; append
  preserves the retained state.
- Ordinary gameplay remains blocked while paused. Session closure uses the required void/state-choice path
  rather than treating a pause as encounter completion. Standalone Director Void is also permitted while
  paused and preserves the pause after the keep/reset choice. Once that choice is applied, Void seals
  the encounter as a historical archive; gameplay undo/redo cannot reopen it or change the selected
  outcome. Future statistics treatment beyond no ending awards remains a separate question.

Restoration is game-state restoration, not character progression rollback: encounter changes to
inventory/resources must be covered where applicable. Authored/private fields and unrelated account changes
must not be overwritten. Sheet editing is locked during the encounter, and restoring encounter gameplay values
updates the main sheet immediately. There is no separate encounter-sheet merge.

### Taking a turn

A player choosing Take turn does not require a separate Director approval step. The ordinary path follows
the acting side and source-defined eligibility. Deliberate game-rule departures remain available with
visible warnings under the adaptation principles; rule eligibility is not an application permission gate.
The same operation is available to the Director on behalf of that character. Access, running-session and
coherent-state requirements still apply. Ordinary turn claims cannot create competing active turns.
The squad/captain shared turn and source-directed interruptions are explicit exceptions to ordinary
single-creature sequencing; preserve their participants and interrupted context.

With initiative groups, the existing character-level Take turn control is only part of the interaction.
Confirmed on 2026-09-12: heroes in a combined initiative group take successive complete individual turns;
the players choose their order among themselves. Each hero retains individual start/end boundaries and
action allowances. Group membership alone does not permit interleaving ordinary turns. Director authority,
triggered actions and warned deliberate departures remain available.

Confirmed ordinary hero-group flow:

- When the heroes' side is up, a player chooses **Take turn** for an eligible hero they control. This starts
  that hero's individual turn and activates their initiative group, without a separate group-start step.
- After that hero finishes, another remaining hero in the active group takes their turn through the same
  control. The players choose member order; no fixed ordering or automatic next-hero selection is required.
- Once all members finish, the group completes and play passes to the other side if it has remaining turns.
  The existing exhausted-side and round-boundary rules still apply. No separate group-end click is needed
  for this ordinary flow.
- The Director can perform these operations on behalf of any hero. Choosing member order does not grant
  players control of another player's character.

End-turn effects and pending required inputs resolve under the confirmed clock contract when the
participant chooses End turn, including when they end early without spending their actions. Removing the currently acting monster now finishes its turn as specified
above; other interruptions, extra-turn and undo recovery remain separate.

Proposed concurrency behavior: the first valid claim accepted against the current state starts the turn. A
competing stale claim receives the updated state and does not replace the active actor or consume another
turn. Repeating the accepted command does not restart the turn. Use the same authoritative operation from
player UI, Director UI, and headless clients. No voting or fixed player ordering is established by this
control.

Confirmed immediate-turn return, 2026-09-13: when a source-forced immediate turn interrupts an
unfinished initiative group, run the target's individual turn and then resume the interrupted group's
remaining members. Wode Sickness consumes the target's normal turn for that round; it does not grant
another normal turn when the target's own group activates. Preserve group membership and the interrupted
group's activation separately from the temporarily acting creature. Apply normal individual start/end
boundaries, prompt closure and required resolution. This confirms the single forced-turn return case;
other source-granted bonus turns and multi-creature sequences retain their own source rules.

Confirmed interrupted individual turn, 2026-09-13: an immediate source-granted turn can interrupt
an individual turn already in progress. After that granted turn and its required work finish, resume
the interrupted actor's existing turn with prior spending intact. In the concrete War Dog Breaker
case, Thorn's attack remains spent and an unused maneuver remains available after the Breaker's final
turn. Suspension and resumption neither end nor restart Thorn's turn, refresh its allowances, nor fire
another Thorn turn-start/end boundary. The granted turn has its own genuine boundaries and source
rules. Existing next-individual-turn-start prompt closure still applies to its start; resumption is
not a new turn or a way to reopen expired opportunities. Preserve the interrupted group context too.
This confirms resumption behavior; resolve the triggering action and interruption at their actual
source stages rather than using resumption as permission to reorder unresolved effects.

**Implementation note, 2026-09-14 (R05):** Take turn dispatches the `turn-start` boundary for that one turn entry (`shared/contracts/clock.ts`, `BoundaryEvent` with `TurnRef`). The source text for turns, the exhausted-side sequence and Director groups is quoted in [conditions and clock](conditions-and-clock.md#21-definitions-from-the-source); the two-round worked example there lists the events an ordinary Take turn / End turn sequence produces.

### v0.01 critical hits and additional main actions

Automation confirmed 2026-09-14: recognize and log qualifying critical hits and track their
immediate additional-main-action opportunity. In the representative ordinary main-action attack,
a natural 19 or 20 (the dice total before modifiers) produces a tier 3 result and a critical hit.
A modified total of 19 or 20 alone is insufficient. Resolve the current attack, then make the
immediate extra main action available. The acting player or Director chooses whether and how to
use it; do not execute an action automatically or turn the opportunity into a generic banked action.
The action display and allowance assessment must account for this recorded opportunity.

Use shared operations and attributed persistent history. Retries cannot duplicate the grant;
undo/redo restores its recorded state without rerolling. Source recognition of critical hits
remains separate from deferred class/stat-block-specific triggers caused by a critical hit.

Source: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
[Natural Roll](../vendor/steel-compendium/en/unified/md/rule/dice/natural-roll.md) and
[Critical Hit](../vendor/steel-compendium/en/unified/md/rule/combat/critical-hit.md). Exact opportunity
lifetime, chaining, off-turn use and source exceptions need bounded contracts before implementation;
this example does not establish that only on-turn actions qualify. The inclusion decision is settled.

*Implementation note, 2026-09-14 (R04):* recognition (`naturalRoll >= 19`, ability roll, main action;
never a maneuver or a test), the one-roll/one-opportunity reading for multi-target attacks and the
natural 19/20 tier-3 override are in [the R04 contract](roll-and-damage-resolution.md), sections 1.6 and 2. The double-bane
interaction is confirmed as [Q-R-1](rules-questions-for-user.md#q-r-1-does-a-natural-19-or-20-stay-tier-3-under-a-double-bane): natural 19/20 remains tier 3 under ordinary edges/banes, including double bane. See the [source check](research/natural-roll-precedence.md). Opportunity lifetime, chaining and off-turn use remain unsettled here.

### Player-sheet actions and explicit End turn

Use the [v0.01 character sheet spec](character-sheet-spec.md) for the initial field inventory,
layout and action/resource controls. It adapts the user-supplied paper sheet for temporary desktop
use; the gameplay, permissions and history contracts here remain authoritative.

Confirmed 2026-09-12: the detailed character sheet in the player's pane is the primary v0.01 surface for
choosing actions. During the character's turn, it indicates the remaining action options/allowances.
Main-action entries gray out when that allowance is spent; maneuver entries likewise reflect their spent
allowance. Exact indicator styling remains open. This is not a sequential interface that filters and leads
players through all available actions; that richer flow is a possible future feature, outside v0.01.

The player explicitly chooses **End turn**, including when ending early with unused actions. Spending all
ordinary allowances does not itself automatically end the turn. End turn is also a registered palette/slash
and headless operation, attributed and recorded in the game log. Proposed spelling: `@Thorn /turn end`.
Individual hero-turn boundaries and the previously accepted group handoff remain the baseline; the user's
reference to finishing their characters does not establish a new command ending every controlled hero's
turn at once. Required end-turn effects and pending-input handling follow the confirmed
[clock contract](#game-clock-and-scheduled-rules-work) and timing split.

Confirmed clarification: grayed actions remain clickable and executable. Gray means the app believes the
ordinary allowance is spent; it is advisory, not an inactive control or a requirement to unlock an override.
Players can take another action with a rule warning where applicable; Director authority remains intact.
Source-defined substitutions and extra actions inform rule assessment: spending an available main action
for a second maneuver is a legal substitution, not automatically a rule violation. Exact allowance display
and fuller-product action-substitution selection remain to be designed; spent-action graying itself remains advisory.

v0.01 deferral confirmed 2026-09-14: do not add automatic main-action substitution or a dedicated
slot-selection workflow for a second maneuver. The player can execute it through the existing
nonblocking action controls. Record actual use and keep allowance indications advisory; spent
maneuver state is not an execution block. This does not invalidate the source's legal substitution,
remove actual resource affordability checks or defer the confirmed critical-hit opportunity.
The separately confirmed resource-affordability check below can block an ability that cannot be paid for.

The earlier recommendation that every selected attack first open a preparation card was not accepted as
the ordinary v0.01 flow. Action cards still handle required additional input, cross-user requests and
mid-resolution choices, and short commands may launch guided input. This correction does not settle the
every target-input or later-stage resource-commit boundary for an individual ability. Fixed activation
costs and pre-resolution optional spending are now covered below.

**Implementation note, 2026-09-14 (R05):** End turn dispatches the `turn-end` boundary of the ending turn as defined in [conditions and clock](conditions-and-clock.md#22-boundaries-the-app-dispatches); with no automatic save producer in v0.01, its save phase is empty and any manual save for a toggled condition is rolled through the dice controls outside the clock.

### Ability costs and optional spending

Confirmed resource-bookkeeping priority, 2026-09-13: track the precise causal event and resolution stage
of each resource grant, expenditure and reversal. All applicable rules must use that timing, including
affordability, optional spending, resource-based features, first-use limits and correction/undo. Reducing
this difficult mental bookkeeping is a primary player benefit, not incidental log detail.

The history must explain why a grant occurred, its amount, its before/after balance, its source and
turn/round context, and relevant usage bookkeeping. A resource earned at an earlier applicable stage
can fund a later effect. A grant earned only from a downstream consequence cannot fund a response that
logically precedes or prevents that consequence, even if apply-then-revise presentation has already
displayed it. For Lines of Force, resource gains from original attack damage can remain available while
gains caused only by the redirected-away collision are reversed. Preserve independently justified gains
and source-defined retained threshold benefits; do not model all eligibility as a check of the latest
displayed pool alone. Retrying, correcting and undoing must neither duplicate grants nor erase unrelated
ones. Exact representations and genuinely ambiguous source sequencing remain engineering/research work.

Confirmed 2026-09-13: when an ability is ready to execute, automatically deduct its applicable fixed
resource cost and show the deduction in the game log. Merely selecting an ability or opening a preparation
card does not pay its cost. Determine the actual cost using the source, selected configuration and supplied
facts, including applicable reductions or waivers; do not blindly debit the printed number in every mode.
The shared operation must check affordability against current state and apply the accepted cost once.
A retry or concurrent use cannot charge twice or spend a pool value that has already been consumed.

For optional enhancements that must be chosen before resolution, an action card offers the base ability
and the enhancements. Collect the user's choice before resolving the ability unless the command already
supplied it. Optional spending is never automatically selected. Changes to targets or effects follow the
chosen enhancement through the same headless operation. Later-stage or conditional spending still follows
its source timing; this decision does not demand choices before they become relevant or payable.

**Confirmed exception to warn-without-blocking, 2026-09-13:** if the required resource cost cannot be
paid under the applicable rules, the ability cannot execute. Do not allow an ordinary insufficient-pool
use to proceed with a warning, waive the cost, or manufacture a negative balance. For example, an
ordinary cost of 3 with only 2 available is blocked. Explain the missing resource; the failed activation
does not roll, consume the activation cost/action allowance, or apply the ability's effects. The ability
has not fired, so clear-on-fire does not discard the user's pending selection merely for this failure.

This check applies to player and Director invocations through UI, cards, slash commands and headless
access. Existing Director authority to make attributed resource adjustments remains; it does not create
an implicit bypass for an unaffordable ability. Other rule conflicts retain their established warning
policy. The exception is resource affordability for ability execution, not a new blanket prohibition on
extra actions, targeting departures or every rule mismatch.

Affordability means source-legal payment, not a universal nonnegative-number constraint. At the pinned
Compendium revision, [Clarity and Strain](../vendor/steel-compendium/en/unified/md/feature/talent/level-1/clarity-and-strain.md)
permits Talent spending down to minus (1 + Reason), with its stated strain effects; that legal spending
remains supported, and exceeding its allowed limit fails affordability. Likewise,
[Ferocity Outside of Combat](../vendor/steel-compendium/en/unified/md/feature/fury/level-1/ferocity.md)
allows specified uses without paying ferocity, subject to its separate reuse rules. A legal waiver is
not insufficient payment. These are sourced distinctions, not exceptions invented by the app.
[Heroic Abilities](../vendor/steel-compendium/en/unified/md/rule/general/heroic-ability.md) distinguishes
required activation costs from optional enhancements. Unknown costs/facts remain unresolved; do not
invent either affordable or unaffordable status. Exact conditional-cost commitment, partial resolution
and cancellation after already-accepted work remain open.

*Implementation note, 2026-09-14 (R04):* the affordability formula (fixed cost, source waiver, legal
floor) and the Fury outside-combat waiver/reuse-warning split are in [the R04 contract](roll-and-damage-resolution.md),
section 9, with the blocked example in 10.11. Ferocity and Malice have no negative range at the pin.

### Move-action rules check

Checked the pinned core Heroes turn/movement rules and searched core-source move-action references at
Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`:

- [Advance](../vendor/steel-compendium/en/unified/md/feature/common/move-actions/advance.md) grants movement
  up to speed; movement can be split around the maneuver and main action.
- [Disengage](../vendor/steel-compendium/en/unified/md/feature/common/move-actions/disengage.md) grants a
  shift of 1 square, modified by applicable features. Longer shifts can likewise be split.
- [Ride](../vendor/steel-compendium/en/unified/md/feature/common/move-actions/ride.md) moves a mount and
  rider, or has the mount Disengage under its specific rules.
- [Stand Up](../vendor/steel-compendium/en/unified/md/feature/common/maneuvers/stand-up.md) is a maneuver,
  not a move action.
- [Taking a Turn](../vendor/steel-compendium/en/unified/md/rule/combat/turn.md) permits spending the main
  action for a maneuver or move action. Thus spending the ordinary maneuver does not necessarily remove
  the option of taking another maneuver. This is a source requirement, not a new UI approval question.

No general-purpose nonmovement move action was found in this bounded check. The standard move actions
all concern movement; this is not a proof about every content exception. Taking a move action and consuming
all its granted movement are distinct. These findings do not add mounted combat or retainers to the prototype.

Confirmed initial V1 boundary, including v0.01: ordinary movement on the board is handled outside the
app and is not recorded.
Do not require logging Advance/Disengage merely to track board movement, marking a generic move action
used, or recording distances, remaining movement or split movement segments. The research question was
whether some move actions have nonmovement effects that need app execution; a supported such action
would still be recorded and resolve its relevant effects. This is not a request to create one.

Confirmed usability refinement: start light, without dedicated **I moved** or **Convert to maneuver**
buttons. These are possible later usability additions if the initial interaction proves unintuitive, not
current V1 requirements or permanently prohibited controls. Main-action substitution remains a source rule;
this decision omits a dedicated conversion button without choosing automatic cost-selection behavior.
If these table buttons are added later, they must use registered commands and the shared log/headless path.

This scopes the all-table-activity log contract: actions/effects executed in the app are recorded; physical
movement outside it does not become a required app operation. Unrecorded movement is unknown, not proof
that a creature stayed still or retained its move action. Mechanics that depend on it may require a supplied
fact or manual resolution, under the existing uncertainty policy. The shared engine's future spatial
capabilities remain separate from this client's movement tracking.

### Game clock and scheduled rules work

Current v0.01 clock scope, 2026-09-14: keep common turn/round events, saves and the confirmed
[Malice lifecycle](fury-goblin-automation.md#malice-lifecycle). Class-specific event handlers are
deferred, superseding the earlier automatic Fury turn-start grant. Its
[sourced contract](fury-goblin-automation.md#turn-start-ferocity) is retained for future work;
manual resource adjustments remain recorded and the clock must support later registered handlers.

Confirmed 2026-09-12: the table has an event-based game clock. Individual turns and rounds are the initial
timing units; preserve extension to other game events without requiring additional clocks in V1. This is
not elapsed wall time: waiting, animation, disconnect or session pause does not advance combat timing.
Ordinary turn boundaries reference the individual creature, including within an initiative group.
A minion squad and attached captain share turn timing while each participant retains its own applicable
start/end effects, conditions and spending. Do not simulate this by serially starting an ordinary full
turn for every displayed minion, or expire prompts merely because the selected acting member changes.
A real granted full turn supplies its own boundaries; resuming an interrupted turn does not.
Confirmed shared-turn counting, 2026-09-13: global “every turn” effects fire once per actual turn,
not once per participant. A squad and its captain share one turn and therefore one global start/end
boundary. Each participant still resolves its own applicable personal effects and saves. An ordinary
initiative group containing successive turns does not collapse those turns into one boundary. A separate
captain-only extra turn supplies another boundary; changing selected participants or resuming an
interrupted turn supplies none. For example, the rolling mill wheel moves 2 squares once at the shared
squad/captain turn start, and another 2 when a separate captain-only turn starts.

When an action applies an effect or consumes a limited use, register the relevant timing clause with it.
At the matching clock event, evaluate the registered work: expire an effect, reset a usage allowance,
apply a recurring effect, or perform a due saving throw. Use distinct start/end boundaries so that
start of a turn, end of a turn, start of a round and end of a round do not collapse into a generic tick.
A once-per-round allowance resets at its appropriate round boundary, not on every creature's turn.

Confirmed clock ownership, 2026-09-13: the game clock owns turn/round-based effect scheduling.
Using an ability registers its recurring or delayed work with that clock; the originating creature or
object does not maintain a second schedule or independently dispatch the same boundary. Registered work
can invoke an ability and its dependent operations, including spatial input, power rolls, damage,
triggered responses and subsequent effects, through the existing shared resolution system. The source
supplies behavior; the clock owns when it is due. A turn boundary can therefore initiate multiple
separately resolved operations without giving each effect source a turn or an action allowance.

For the Exploding Mill Wheel, activation performs its immediate movement and registers movement at
subsequent turn starts. Each due firing uses the wheel's current state and supplied spatial facts; a
collision or destruction ends its rolling registration and resolves the source-defined explosion.
Keep source/object identity and causal history linked to the registration. Undo/redo restores that
registration together with the associated recorded state under the existing sequential history rules;
restoring it does not execute another firing. This selects one scheduling owner, not a storage schema,
new ordering policy, or additional terrain-authoring scope. The confirmed shared-turn counting rule
above applies to its recurring registration.

Confirmed timing split, 2026-09-13: automatic scheduled work resolves at its prescribed game boundary;
optional follow-up actions remain available through the gap until the next individual turn starts.
For example, due end-turn effects and save-ends rolls resolve on End turn, while their optional response
controls remain active afterward. The response window does not postpone automatic work until Take turn.
Explicit End combat stops structured turns without synthesizing a final End turn or round boundary;
see [closeout](#formal-encounter-closeout). Resource generation otherwise follows its source-defined start/end/round/trigger timing; the user's resource
example does not relocate all resource grants to turn end. Required unresolved input retains its existing
dependency rules and is distinct from an optional follow-up.

Recommended representation: each registration retains its source action/effect instance and creature or
object identity, affected entities when known, exact timing clause and required operation. Timing can
reference a particular creature/turn, every actual turn, or a round boundary. A later firing can collect
its affected entities through the existing spatial-input flow. For example, an effect on Goblin 5
lasting until the start of Thorn's next turn is anchored to Thorn, not Goblin 5. Bind relative references
when the effect is applied; do not reinterpret "your" from whichever user later clicks End turn.
Keep recurring save work until the effect ends, and retire obsolete registrations when their effect is
removed. Exact data structures and dispatch implementation remain proposals.

**v0.01 refinement, 2026-09-14:** simple condition toggles use manually invoked saves through
ordinary dice controls and manual toggle removal. They do not supply timing metadata, so their
automatic save scheduling/removal is deferred until ability support. The automatic path below
applies when a supported effect actually supplies its save timing; do not infer it from a toggle.

**Resolved 2026-09-14 (Q-TS-1): no save-ends roll is automatic in v0.01.** Every v0.01 save is rolled
through ordinary dice controls and the condition is toggled off manually. The automatic resolution below
is fuller-V1 clock behavior that becomes active only when a source-backed supported operation supplies
save timing; the v0.01 clock may keep a registration hook, but nothing registers a save. See
[the questions record](rules-questions-for-user.md#q-ts-1-are-any-save-ends-rolls-automatic-in-v001).

**Automatic save-ends resolution for supported timed effects is confirmed:** when the affected creature's end-of-turn event makes a
save due, roll automatically, apply the outcome and announce it in the game log; no routine Roll prompt
is required. The [saving-throw rule](../vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md)
is d10, success on 6 or higher, at the end of each affected creature's turn. Failure leaves the effect in
place for another save when due. This is not a characteristic/skill power roll. Resolve each applicable
effect independently, preserving the distinction between an effect instance and the conditions it causes.

Source-specific exceptions remain relevant. For example,
[Swarm of Spirits](../vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-3/swarm-of-spirits.md)
can grant +1 to saves, and a hero can spend a
[hero token](../vendor/steel-compendium/en/unified/md/rule/resource/hero-token.md) after a failed save to
succeed instead, subject to that resource's use limits. Automatic rolling does not authorize automatic
optional spending. Such choices use the existing action-card contract.

Confirmed failed-save follow-up (V1; the hero-token follow-up is deferred beyond v0.01, see
[hero tokens](#v001-hero-tokens--deferred)): the automatic result applies immediately, and End turn does not wait for
an acknowledgement or token decision. On failure, keep the effect active and expose **Spend hero token**
on that result's game-log entry to eligible controllers, including the Director acting on the hero's behalf.
The button stays actionable while valid until next-turn start or explicit End combat, under the
standing prompt convention. This includes
another creature within the same initiative group, even if controlled by the same user: the boundary is
creature-turn progression, not a change of user, side or group. No wall-clock timeout applies, and unrelated
log entries do not bury away the opportunity. Existing pause/closure/access policies still govern execution.

If used while the opportunity is open, spend the token under the source resource/use rules, change that
save's outcome to success and end its effect. Preserve the rolled failure and append the attributed token
use and resulting state changes; do not reroll. An accepted use consumes this opportunity. If the next
individual turn starts first, the contextual button becomes inactive. A racing spend/start must be ordered
against shared state so the expired button cannot apply stale work or spend twice. Director manual
adjudication remains available under the historical-edit boundary: after the next turn starts, editing
that prior result requires rewind. Opportunity closure is not a bypass for that boundary.
The response remains tied to the original save and its turn for source use-limit assessment.

This follow-up now uses the user's standing next-turn-start convention for all combat prompts.
Undo/re-ending behavior is specified in the history contract below. Source-specific extra-turn mechanics
and other optional-choice consequences remain open; a new individual turn closes the old opportunity
even when the same creature takes that new turn.
Likewise, a monster's optional
[End Effect](../vendor/steel-compendium/en/unified/md/rule/monster/end-effect.md) tradeoff is not an
automatic instruction to spend Stamina.

Automatic clock work uses shared headless operations and produces discrete ordered log entries showing
its cause, dice/modifiers and state changes. The initiating End turn retains actual user attribution;
consequent automation is identifiable as system work linked to that event/source. Rendering the log/card
never drives the clock. Retries cannot reroll a due save or apply scheduled work twice. Undo/redo must
restore the recorded timing registrations and outcomes consistently with restored state, without new dice;
the detailed dependent-rollback contract remains open.

Research checkpoint: two independent local-Compendium investigations found no general ordering rule for
independent effects sharing a turn/round boundary. Explicit rules cover presented order within one ability
and player-then-Director ordering of same-trigger triggered actions; neither supplies a universal clock
queue. [Game of Exceptions](../vendor/steel-compendium/en/unified/md/chapter/the-basics.md#game-of-exceptions)
gives specific rules priority and the Director final adjudication authority. Concrete unresolved cases
include the Human Bandit Chief's End Effect versus its normal save, wet's fall consequence versus its
save, and a new save-ends effect imposed at turn end. See the
[ordering synthesis and supporting reports](research/turn-boundary-ordering.md).

Confirmed initial app policy, 2026-09-12: for work due at the same clock boundary, resolve events in the
order they were placed into the queue, with due **save-ends rolls last**. Preserve the established enqueue
order rather than deriving it from UI rendering or response arrival. This is the selected default for the
source gap, not a claim that the Compendium prescribes FIFO or save-last ordering. Specific source
sequences and the separate same-trigger ordering rule still apply within their scopes.

The earlier recommendation for a mandatory Director ordering card at every unresolved collision was not
selected. Ordinary queued work follows this default; actual choices and required input still use action
cards. Director adjudication remains available. Save-last does not authorize automatic optional spending,
remove source save replacements, or close the accepted post-save hero-token opportunity.

Confirmed case ruling, 2026-09-12: for Essence of Tides' **Convocation of Waves**, apply slowed to a
qualifying enemy ending its turn in the stream, then include that new effect in the same turn's final
save phase. A successful save removes that effect; failure leaves it active, with the accepted hero-token
follow-up. Do not reapply the stream merely because its target remains there after the save; this resolves
one exposure at that turn boundary. The user accepted the recommendation after the dedicated
[research pass](research/essence-of-tides-save-timing.md).

The general "each turn" save rule and analogous core abilities support the interpretation, but no explicit
same-boundary answer was located. Record it as an accepted case ruling, not a claim of explicit source
certainty. The user subsequently established the standing save-phase policy below; that explicit decision
supersedes the earlier case-only scope for save eligibility. Convocation tests ending position, not a
whole turn spent in the stream; once applied, its slowed effect persists until saved against or otherwise
removed, even after leaving. Map facts remain table-supplied.

**Standing save-phase policy, explicitly confirmed 2026-09-12:** every applicable save-ends effect applied
before the boundary's final save phase begins is included in that phase, unless its source specifies
otherwise. Determine eligibility from the state after preceding queued work has resolved, not a stale
list captured before that work. This includes effects newly imposed during end-turn processing. Respect
which creature's turn makes the save due; it does not grant every creature a save on every turn or round
boundary. Source-specific save replacements and ending rules still apply. This is an explicit general app
policy, not an inferred precedent or a claim that the Compendium states it verbatim.

Open resolution details: work created during the save phase or a later response, newly registered non-save
work during a boundary, exact commitment and continuation when a choice appears, correction after later
events, and manual resolution of unknown timing clauses. Queue-order recording and restoration must be deterministic;
its concrete storage schema remains an engineering proposal. The clock does not invent missing source semantics or replace non-clock triggers
such as taking damage. The existing warn-without-blocking and Director-adjudication doctrine remains.

**Implementation note, 2026-09-14 (R05):** the boundary kinds, timing clauses, registration and dispatch types for this section are in `shared/contracts/clock.ts` (types only); the sourced definitions of turn, round, end of turn and the standing ordering policy applied to those types are in [conditions and clock](conditions-and-clock.md#2-clock-contract). In v0.01 nothing registers a `saving-throw` work item (Q-TS-1), so the save phase is empty; the only registrations are the Malice lifecycle steps and, if A04 registers it, surprise expiry at the end of round 1. Q-R-50, Q-R-51 and Q-R-52 are now resolved in `rules-questions-for-user.md`.

**Implementation note, 2026-09-15 (A04):** `convex/lib/clock.ts` stores registrations in
`clockRegistrations` with a per-encounter `enqueueSeq` and dispatches each boundary inside the causing
operation's mutation: one `clock.boundary` event (origin `clock`, cause = the user event, same command id)
carrying the plan, then one event per firing in enqueue order, then the save phase computed from the queue
after the ordinary phase. Handlers exist for `malice` steps and for `operation` work by id
(`combat.surprise-expiry` at `round-end` of round 1); a `saving-throw` item or an unknown operation is logged
as `clock.unsupported` and never rolled (Q-TS-1). One-shot clauses retire after firing; recurring ones stay.
Boundaries dispatched by A04: `combat-start` at OK, `round-start` at the starting-side announcement and after
each `round-end`, `turn-start` at Take turn, `turn-end` at End turn or acting-foe removal; `combat-end` is
registered for A07. Malice: `round-start-gain` counts distinct current hero actors with remaining combat
turn entries, including dying heroes (Q-R-50); `heroParticipantIds` retains the starting snapshot.
`combat-start-grant` floors a fractional average (Q-R-51) and logs the unrounded value; `clock.malice`
events hide pool values from players and observers while Show Malice is off.

### Undo permissions and proposed campaign control

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

Confirmed 2026-09-14 (Q-A-600): only the Director may undo **Take turn**, using sequential rewind
within the existing encounter/session limits. A player cannot undo their own Take turn even if they
clicked it by mistake and nothing else has happened. The initiating turn-start operation is outside
the player undo window. Director rewind restores the recorded turn-start state and its linked
consequences without rerunning rules or dice; it cannot skip intervening gameplay.

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

The current FreePlay stretch replaces the turn-start outer limit outside combat; another character's
action can still close the window sooner. Enable user undo, session/control permissions and existing
selection-clearing rules remain. Player undo leaves the invoking user's pending ability/targets cleared.

Redo restores the recorded action and its consequences exactly, including its resource expenditures,
without rerolling or recalculating. It uses the same registered UI/palette/headless history operation and
preserves original attribution while recording who invoked redo. This is distinct from newly ending a
reopened turn and choosing whether to spend a refunded hero token again: explicitly redoing the token
expenditure restores that recorded expenditure. Existing control/session boundaries and player history
scope remain.

Confirmed 2026-09-12: taking a new gameplay action after undo clears the available redo path. Continue
from the new action; the abandoned actions remain readable in retained history, not eligible for ordinary
Redo along that discarded path. Recorded outcomes remain in history; they are not reused as dice for
new executions after undo. Read-only inspection and chat do not constitute a new gameplay action for this purpose. This establishes the ordinary
branching behavior, not a new history browser or an ability to reactivate arbitrary discarded branches.

Confirmed triggered-opportunity restoration, 2026-09-13: when authorized sequential undo restores
the point before a triggered action was used, restore its prompt if the trigger/opportunity is still
valid in the restored state. Reverse the response's recorded costs and effects, including its usage
bookkeeping, without rerolling the original triggering action, which has not itself been undone.
If the triggering action is also undone and executed anew, that new execution rolls normally.
Preserve the original use and reversal in history; restore the opportunity rather than creating a duplicate response entitlement.

Revalidate the prompt against current authority, restored game timing and source conditions. Undo does
not bypass player seams, pause/closure restrictions or the Director's rewind limit. Redo restores the
recorded response exactly; undo itself does not automatically use the reopened response. This settles
triggered-action prompt restoration, not every required-input card's recovery behavior.

Implementation note (A06, 2026-09-14): `convex/lib/history.ts` implements this section. The
undo unit is S02's scoped command unit; the effective branch and redo path are replayed from the
session's ordered events (`walkHistory`); `history.undo` (player window: own character, nearest seam,
turn start or FreePlay stretch start as the outer limit), `history.rewind` (Director, one unit per
call, never past the OK event or an archived encounter) and `history.redo` (recorded path in forward
order, cleared by new gameplay) restore recorded journal values without running rules or dice; the
undo/redo entry carries its own change record and the original keeps its dice and text with
disposition `undone`/`redone`. Enable user undo is `/campaign user-undo`. Interpretations and the
A05 correction-window contract are in `docs/build/A06-history-undo-corrections.md`.

Confirmed campaign setting: **Enable user undo**, enabled by default for new campaigns (confirmed 2026-09-11).
Disabling it blocks ordinary player undo and redo and, confirmed 2026-09-14 (Q-A-601), acting-player
post-roll edge/bane corrections. Director undo/redo and corrections remain available under their
existing limits. Setting-management authority and when changes may apply remain open.

The game log/state machine restores recorded state, rather than rerunning rules or dice. Undo/redo must change
actual affected sheet/monster/resource state, not just visible dialogue. Preserve the recorded inputs,
outputs, and later history under the confirmed redo/branching policy. The existing pause/session gates
and audience restrictions still apply unless a specific exception is established.

Confirmed 2026-09-12, narrowed by the sequential seam rule: a player may undo their own **End turn**
and reopen that individual turn provided no next individual turn or another character's action has intervened. The window closes when the next turn begins, including another
member's turn within the same initiative group. Existing Enable user undo, character-control, session and
Director authority policies still apply. End turn and its undo use the shared registered/headless history
operations. A later committed Director correction closes the player window too; there is no exception
allowing the player to unwind that edit along with End turn. Closed sessions cannot be reopened. Ordinary undo/redo itself does
not rerun dice.

Confirmed redo versus new resolution, 2026-09-13: explicit Redo restores the recorded action,
its dice and its consequences exactly. Executing an action anew after undo resolves normally from the
current conditions, with fresh dice. This includes ending a reopened turn after changing conditions.
There is no special cache of rolls to reuse across new executions of the same ability, turn end or
round boundary, and no comparison of old/new conditions is needed to choose dice: Redo restores;
a new execution resolves. This supersedes the earlier same-end reuse and changed-effect reconciliation
rules. Original outcomes remain in ordinary history for inspection and the available redo path.

For example, after undoing an End turn with a failed save, moving into an ally's save-bonus aura and
ending the turn again makes a new save with the now-applicable bonus. It does not reuse the old die.
Directly redoing the original End turn restores its original save and consequences unchanged.
The Director can adjudicate attempts to fish for better rolls and manually correct results through
the existing correction controls; no separate anti-reroll mechanism is required. Older-event corrections
still require the established sequential rewind.

Confirmed failed-save token undo, reconciled with the sequential model: first undo the character's
later optional token spend, refunding the token and reversing its success override and usage bookkeeping.
If the same character's undo window remains open, undo End turn next, restoring the pre-end effect and
clock state. Do not skip the token action to selectively undo its cause. Undoing only the token spend
leaves the original failed save in effect because End turn itself has not been undone.

Executing End turn anew rolls applicable saves normally and offers the token choice if the new result
qualifies. Prior optional expenditure is not automatically repeated. Explicit Redo instead restores
the recorded End turn, and subsequently redoing the token action restores that recorded expenditure.
Opportunities retain their accepted closing events and source resource/use rules. Preserve attributed
spend/undo/new-spend history without duplicate refunds or charges.

Confirmed automatic round-boundary undo, 2026-09-12: if the last individual turn's End turn advances the
round, undoing that End turn also reverses the automatic round-boundary changes it caused, provided the
player undo window remains open under the seam and next-turn limits. Restore the prior round/turn/group bookkeeping, usage allowances,
resource values and affected effects from their recorded changes. A round increment alone does not close
the accepted End turn undo window.

Record each automatic round-boundary change and its cause so undo restores the prior state from
history rather than guessing inverse rules. Explicit Redo restores those recorded changes and dice.
If play continues along a new path, crossing the boundary anew resolves the then-applicable work
normally, including fresh dice and source-timed grants/resets. Apply each new execution's changes once;
retrying an already accepted command must not reroll or duplicate grants. No separate boundary-result
cache is required. Correctness still requires implementation and verification.

The sequential seam rule supersedes the former player End turn undo exception after a Director
adjudication. Automatic end-turn effects remain consequences of End turn; a Director's committed edit
is a separate action. Ordinary corrections require rewind before older-event changes even within
the same turn. Valid source-specific responses retain their own contracts and are not selective Undo.

Confirmed Director rewind range, 2026-09-12: the Director can repeatedly undo gameplay back to any earlier
point in the current encounter, including previous turns and rounds, with no arbitrary action-count or
step limit. A later turn having started closes the player's End turn undo window and direct editing of
prior-turn events for everyone. It does not close the Director's rewind capability; that rewind is the
required route for correcting an older turn. Restore the dependent gameplay state coherently from retained history; existing
exact recorded redo and fresh-resolution branch behavior remain. This answers the current-encounter question;
closed-session immutability and access/privacy policies still apply. Finish cleanup and Void after
its keep/reset choice archive the encounter; gameplay undo cannot reopen it or cross that boundary.

The confirmed history contracts now include appended corrections/reversals, new-play branching with fresh resolution,
exact recorded redo, FreePlay undo scope and mandatory rewind before prior-turn edits. Remaining work includes
source-specific response reconciliation, pending-card restoration, undo-unit details and concurrent-controller submissions
and other lifecycle transitions. Completed-encounter rewind is forbidden. Player undo does not grant selective removal of an
earlier action while leaving incompatible dependent effects in place. The prior local prototype's refusal
to submit new actions from past history remains an experiment choice.

## 6. Initial rules check

Checked the following local Compendium records at `fb83a789da8f0327a389c277a0c790b1648d5810`. This is a
focused check of the walkthrough, not a complete encounter rules audit or a claim of automation support.

| Topic | Source-grounded refinement |
| --- | --- |
| Opening order | [Combat Round](../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md) includes surprise. When both sides have unsurprised creatures, the Director or their chosen player rolls one d10: 6+ gives the players the choice of starting side; otherwise the Director chooses. The die does not directly force heroes/monsters to start. Specific content can modify this procedure. |
| Turn budget | [Taking a Turn](../vendor/steel-compendium/en/unified/md/rule/combat/turn.md) provides a main action, maneuver, and move action. Movement can be split around the others; a main action can become a move action or maneuver. The user clarified that “bonus action” meant triggered action; it is not an additional standard turn slot. |
| Free and triggered actions | [Free Maneuvers](../vendor/steel-compendium/en/unified/md/rule/combat/free-maneuver.md) and [Triggered Actions](../vendor/steel-compendium/en/unified/md/rule/combat/triggered-action.md) have distinct timing/limits. Triggered actions can occur on someone else's turn when their trigger occurs. |
| Alternation and groups | Combat Round allows the remaining side to finish its unspent turns when the other side is exhausted. Ordinary enemy group members take successive creature/squad turns before passing sides. See [initiative groups](#initiative-groups-confirmed-app-model) for verified construction guidance, squad/retainer distinctions and the confirmed app extension to both sides. Ordinary sequencing and regrouping are confirmed above; personal extra turns and interruption/resumption are confirmed; explicit multi-recipient turn grants retain separate source questions. |
| Next round | Combat Round confirms the side that acted first in the initial round starts subsequent rounds. |
| Victories | [Victories](../vendor/steel-compendium/en/unified/md/rule/resource/victories.md) ties combat awards to survival and achievement of party objectives, with Director discretion for difficulty. A slain-enemy counter alone cannot decide awards. |
| Free-play boundary | Combat Round says harm intent or a damaging/negative environmental threat can start combat before the harmful action occurs. Free-play abilities and traps therefore need a rules-aware transition into encounter play; lack of a manually loaded encounter cannot bypass combat resource costs. |

The complete encounter-start, turn/round timing, resources, death/objectives, reward, cleanup, and exception
rules still require contextual research and meaningful behavior examples before implementation. Preserve the
requested app loop while applying those verified mechanics.

## 7. Proposed acceptance examples

- Removing the currently acting monster during running combat automatically finishes that individual
  turn and resolves applicable end-turn effects before the normal group/side/round handoff. No separate
  End turn click is required, duplicate delivery does not repeat effects, and historical actor references
  remain usable after roster removal. Removal alone does not report a kill.
- A combat response prompt remains available after End turn, including across an automatic round increment.
  A prompt created by End turn has the same response gap. Starting the next individual turn closes these
  outstanding opportunities, including failed-save follow-ups; stale responses cannot
  commit afterward. A response accepted first keeps its recorded effects. Required unresolved dependencies
  still prevent progression, and closing a prompt never silently applies an unresolved effect.
- Lines of Force modifies the triggering action's effective movement through a linked response after the
  original outcome is applied. Preserve the original action record and unaffected damage; do not require
  a preliminary use/pass decision or a separate Director correction. Response changes are recorded once.
- While paused, changes to either roster are refused through UI and shared headless operations, including
  session-player/character changes, foe additions/removals, regrouping and saved-encounter loads. Resume
  restores otherwise-permitted edits; combat still blocks ordinary party changes. A refused removal
  neither advances the turn nor queues removal or boundary effects for resume.
- During running combat or between sessions, the Director can add/remove foes and (V1) load a saved
  encounter. This does not run monster gameplay actions or rewrite closed history.
- V1, deferred beyond v0.01: a new campaign adds foes hidden by default; changing the campaign Add toggle
  affects later catalog additions and template loads, not existing foes. In v0.01 every added foe is visible.
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
- After authorized sequential undo of a triggered response, its costs/effects/usage are reversed and
  its prompt is available again only if valid in the restored state. Triggering dice are unchanged;
  history retains the original response and reversal, with no duplicate response entitlement.
- Equivalent character actions/responses produce the same mechanical results whether the characters
  share a controller or belong to different players. A shared controller does not alter resource, trigger
  or dependency rules; UI navigation, authority checks and attribution retain their own responsibilities.
- While viewing Thorn, successfully choosing Take turn for Elwin switches the invoking user's sheet/player
  pane to Elwin and applies existing actor-switch draft clearing. This does not require changing other
  users' viewed characters.
- With Elwin's sheet viewed, a Thorn response card clearly labels Thorn before interaction and resolves
  for Thorn using his resources and opportunity, without requiring a sheet switch. Elwin's sheet controls
  still belong to Elwin. Character selection does not retarget an existing card.
- Draft setup includes newly added roster creatures and removes deleted ones while preserving remaining
  creatures' participation, surprise and grouping. Roster updates do not reset existing draft choices.
- Director OK in encounter setup locks party players/characters before initiative. Merely opening the
  draft does not apply that lock. Attempts to add/remove them through either UI or
  headless operations fail until the encounter ends or is voided. Pausing does not unlock the roster. Later
  session removal does not implicitly expel someone from the campaign.
- Void-and-keep retains current character/monster values and skips all normal ending awards/effects.
  Void-and-restore exactly restores the recorded starting gameplay state without engine/dice calls. Both
  release combat-imposed locks, preserve any applicable session pause lock, and retain a marked historical record; cancel changes nothing, and retries/stale
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
- Between sessions, the Director can add/remove live roster monsters and, in V1 (deferred beyond v0.01),
  prepare saved encounters and load them using the replace/append flow. Loading also adds prepared rewards once under the stash contract;
  it neither starts gameplay nor reopens closed session history.
- Closing a session preserves the campaign foes roster and the state resulting from any encounter keep/reset
  choice. Starting the next session exposes those same retained instances and values without reloading a
  template or continuing the closed encounter.
- During a running encounter, the Director can add monsters and remove participating monsters without ending
  or voiding it. The encounter does not impose a foes-roster lock; party player/character locks remain
  enforced. Mid-combat insertion, regrouping and Void roster restoration are confirmed above; squad and
  summon cases remain open.
- V1, deferred beyond v0.01: loading a saved encounter into a nonempty foes roster requires replace or append; append preserves current
  instances, replacement uses fresh instances, and cancel leaves the roster unchanged. Editing the template
  changes neither load.
- V1, deferred beyond v0.01 (the four hiding examples through Revealing below): a hidden roster monster can
  perform an otherwise legal Director-submitted action against a player without
  first becoming visible in the roster. Toggling roster visibility does not enable/disable its actions or
  apply in-game concealment.
- For now, a hidden foe's action can show its name in the game log while its roster entry stays hidden. The
  log entry does not expose its full stat block or automatically reveal the roster entry.
- The roster EV comparison includes all undefeated monsters, visible or (V1) hidden, and monsters outside the
  current combat; changing visibility alone does not change its total. Defeat immediately removes a monster's
  contribution without removing its roster entry. If recorded-state restoration makes it undefeated again, its
  contribution returns; the saved template and recorded encounter facts remain unchanged.
- Adding a monster with the Add visibility toggle set to hidden creates a hidden roster entry; setting it to
  visible creates a visible entry subject to the health-display policy. Changing the default leaves existing
  entries unchanged, and individual show/hide controls remain available.
- Hidden foes remain available to the Director but are absent from the audience roster payload. Revealing one
  exposes its permitted roster/health view without its stat block or any change to encounter membership.
- Free play supports a sourced ability, applicable resource handling, and a character-initiated test with
  recorded results. No formal Director request is required; if difficulty is unrecorded, show the roll
  workings and total for Director interpretation. A harmful declaration follows the agreed warning/adjudication path and explicit
  Director start; selecting it does not automatically start tracked combat. A resolved FreePlay attack's
  damage/resource changes are present at combat start, subject to source-defined startup rules. It does
  not consume a first turn/action or apply its effects a second time.
- An encounter demonstrates starting-side choice, player Take turn and its Director equivalent, actor/group
  eligibility, turn budgets, a legal off-turn trigger, remaining-side turns, and the next round. Proposed
  simultaneous-claim handling starts only one turn and leaves the losing claim without side effects.
- While paused or between sessions, authorized users can view sheets and send/read chat, but gameplay
  mutations are rejected through both UI and CLI. Access does not require creating or reopening a session.
- Pause blocks gameplay commits without discarding accepted inputs/results. Resume retains mode, state, and
  pending work under the eventual policy.
- Wrap-up claims do not deposit inventory items. The Director can change allocations, then finish wrap-up to
  deposit the final allocations once while retaining unclaimed loot.
- Explicit End combat ends structured turn play without firing a final turn/round boundary, its saves or
  resource grants. It closes unused optional combat responses even if no next turn will start. Required
  unfinished resolution completes before rewards/cleanup; stale replies to closed prompts are refused.
  Formal closeout UI follows the shared registered action-card contract.
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
- Player undo reverses only uninterrupted latest actions of the character, stopping at the nearest
  other-character/Director-action seam or turn/FreePlay outer boundary; player redo restores their recorded undone actions. Director
  undo/redo can traverse the current encounter and restores recorded effects without rules/dice calls. New campaigns
  enable user undo by default; disabling the setting blocks player undo through shared operations while
  retaining Director controls. Source-specific response reconciliation and undo-unit details remain open.
- Corrections and undo append attributed entries; original history remains intact. Undoing a correction
  restores its prior effective result without undoing the source ability. A manual damage override survives
  later modifier edits until explicitly cleared.
- Once later gameplay has committed, direct edits to an older event are refused for every caller,
  including the Director, even within the same turn. Rewind the entire intervening chain before editing; a still-valid continuation performs
  current work without rewriting its originating event.
- An unaffordable ability fails before dice, costs, action allowances or effects change through UI or
  headless execution. Legal payment waivers and permitted negative resources still work. A blocked attempt
  has not fired and therefore retains its pending selection.
- Table redesign or disabling the visual log/dice tray does not remove recorded history or shared operation
  access.

## 8. Continue exploring

Checkpoint **2026-09-13**: opening commitment, group/turn flow, mapless targeting, persistent-area cards,
direct test rolls, resource affordability, clock defaults and the principal history boundaries are recorded.
The full FreePlay/combat baseline is not complete. Remaining work concerns playable behavior, not visual
polish or every rulebook ability as a prototype gate. The resumed review asks material product questions one at a time.

### Next baseline contracts

| Topic | Still unresolved |
| --- | --- |
| Concrete action/response sequence | Lines of Force applies after the triggering outcome and modifies it through a linked response. Still-valid combat prompts remain available through End turn; next-turn start, explicit End combat and applicable early-close rules bound them. The Director can mark a specific unsupported effect Resolved at table without duplicate application; dependent automation still requires actual state/facts. Source-specific consequences/order, dependent consequences and conditional costs remain open. |
| Same-turn dependencies | Player Undo is sequential and closes at another character's committed action, regardless of shared controller. Director rewinds across seams in reverse order. Committed Director corrections also create seams. Older-event corrections require sequential rewind even within a turn. Source-specific response reconciliation and undo-unit/concurrency details remain open. |
| Remaining group cases | Other source-specific multi-creature sequences and dependency recovery require verification; empty-group presentation is a UI detail. Actor-linked turn entries, own-group insertion for grants, selected-entry dragging, and resumption of an interrupted individual turn with spending intact are settled. A single source-forced immediate turn returns to the interrupted group and consumes the target's normal round turn where specified, as with Wode Sickness. All groups finished advances the round even with an unacted arrival in a finished group; no fabricated turn or acted flag. Removing the current monster during running play automatically finishes its turn, resolves end-turn work and continues the existing handoff. Pausing locks both rosters. Ordinary additions and transfers are settled. |
| Character switching | Sheet/player pane follows the viewed character; log cards act for their clearly labeled character, even when another sheet is viewed. Explicit successful Take turn switches the invoking user to that character. Other switch prompts, passive sheet changes and remaining drafts spanning turn changes are open. |
| Setup and first-round effects | Draft setup follows live rosters: additions included, removals disappear, remaining creatures retain participation/surprise/groups. Source-specific startup-effect ordering remains open. OK/snapshot/locks, cancel/void and observer roll exclusion are settled. Individual monster-group defaults are confirmed; saved initiative groups and minion squad/captain preparation are confirmed. |
| FreePlay mechanics | Outside-combat resource/reuse rules, Recoveries and fictional time. Resolved FreePlay actions preserve damage/resource state but do not consume the new encounter's action economy; Director start and warning/adjudication remain. Sheet/card actor contexts and sequential player undo scope are settled; formal test requests are deliberately excluded. |
| Area details and complex targets | Exact effect-owner control mapping, source-specific membership/entry effects, objects, allocations and staged targets. Minion overflow kills use the existing inline spatial-input card to collect missing casualty assignments. Card persistence, membership controls, re-prompting and dependent waits are settled. |
| Tests and visibility | Source-defined group aggregation remains open. Formal test requests and their response modes/lifecycle are removed for now. Direct rolls need no request; the Director interprets outcomes when difficulty is unrecorded. Current campaign difficulty visibility applies to known values in existing/history entries too. No per-test difficulty reveal for now. |
| Encounter completion | Formal closeout UI is confirmed: End combat ends turn structure without running a final turn/round boundary and closes unused optional combat responses; required unfinished work resolves before rewards/cleanup. Each player gets applicable cleanup options for their character; optional effect removal is choice-driven. Director Finish cleanup closes unused optional choices after required resolution completes, without individual ready confirmations. Director grants the Victory amount and recipients during closeout; enemy elimination does not automatically award it. Source-specific end-effect/reward ordering and remaining cleanup details are open. Normal completion and Void keep/reset are distinct; closed sessions remain read-only. |

Resolved Parry/resource case: Thorn committing another action or spending the granted resources
closes the response window for that hit, including his ally's Parry prompt. The user identifies this as
existing precedent. [The research note](research/ally-response-after-resource-spend.md) retains the
superseded question and clarification; no special late-response dependency mechanism is approved.

### Smaller opening and visibility questions

- Active players and Director may roll shared initiative; observers cannot. All supported table views retain
  their privacy rules. Hidden foe group/turn presentation is deferred beyond v0.01; future design cannot
  expose full stat blocks or other private data.
- Both sides entirely surprised or an empty side require explicit adjudication; no invented initiative default.
- Each ordinary monster initially has its own initiative group, just like heroes. Do not automatically
  group monsters by stat block. Director regrouping remains available. Minion squads are a separate
  mechanism with selected entry/count, targeting and shared-turn controls. Saved encounters preserve
  prepared initiative groups, minion squads and captain assignments.
- Prompt closure and the prior-turn historical-edit lock now share the next-individual-turn-start boundary.
  Source-specific extra-turn mechanics still need treatment; the window does not permit edits across that boundary.

### Follow-ups when their scope is selected

- **Minions:** the [entry, count, EV, shared-turn and Stamina contracts](#minion-squads-and-captain-state)
  are selected. The remaining arithmetic (thresholds after a stat adjustment, the pool floor, area
  exhaustion with unaffected survivors) and the mid-turn removal case were decided on 2026-09-20; see
  [the user decisions](#minion-squads-and-captain-state). Other remaining cases are mixed participant
  modifiers and explicit transformation/revival or multi-recipient turn grants. Manual live split/merge
  is excluded, not pending.
  The shared squad/captain entry and personal extra entries must be clearly labeled; this does not
  require a new scheduling policy beyond existing entry selection and source timing. See [lifecycle evidence](research/minion-lifecycle.md) and
  [captain evidence](research/boss-and-captain-turn-review.md). These do not expand the ordinary-monster prototype.
- **Dynamic terrain:** [the 35-entry review](research/dynamic-terrain-action-economy.md) finds creature-paid
  operations, triggers and scheduled effects rather than recurring terrain turns. Object identity must
  be independent of a turn entry if this scope is selected. Shared squad/captain turns count once for
  global turn effects. Object save timing and simultaneous protective-object destruction remain open.
  Research does not add terrain preparation to saved-encounter scope.
- **Fuller V1:** respite lifecycle, special turns, inventory wrap-up, source/build reconciliation, forced
  access-change recovery and richer sharing. Director Void while paused is confirmed with keep/reset and the pause lock preserved. Completed encounters are historical archives and cannot be reopened by gameplay undo.
- **After V1:** playable retainers/friendly monsters and their attachment/control, dedicated montage and
  negotiation modes, downtime projects, nested activities and custom/adventure modules.

Engineering work includes shared idempotent operations, current-state checks, authority/privacy enforcement,
headless persistence/replay and tests for the selected slice. Neither this checkpoint nor the grammar
recognizer certifies an implemented gameplay engine. Keep source findings, app decisions and proposed
schemas distinct; [the decision record](gameplay-decision-record.md) preserves the discussion trail.

## Incremental table loading — 2026-09-19

User-confirmed performance follow-up: initial roster cards receive only their authorized summary facts; full character sheets and foe source load when opened. Independent roster/log/history reads start together and do not gate unrelated panes. Ability-result reads follow the visible log page, including older activity.

Maintain a derived, incrementally updated history read projection so passive undo/correction controls do not replay the full session on each update. Existing sessions catch up in bounded batches without deleting history or blocking new gameplay. Authorization, sequential undo/redo, correction/manual-resolution windows, encounter floors and source-event identity remain governed by the existing contracts. The original append-only event journal remains authoritative.
