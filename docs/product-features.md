# App features: first pass

Status: consolidated feature inventory, 2026-09-11. The [v1 checkpoint](v1-spec-checkpoint.md) records the
agreed release scope and remaining work. Screen layouts and implementation contracts remain proposed where
labeled.

**Immediate milestone:** the [v0.01 scope checkpoint](pre-alpha-design-gaps.md) controls prototype delivery.
It targets desktop with temporary UI and explicitly defers several features listed below, including chat,
inventory, rules search, leveling and interchange implementation. This inventory describes the fuller V1
product; its feature lists are not prototype gates. The discussion is checkpointed with combat still deferred.

Confirmed delivery scope: the app is web-only, optimized for mobile, with no plans for native apps. V1 has no
character/campaign statistics dashboards, reference bookmarks, private direct messages, or admin-dashboard
functionality. Campaign chat is the only v1 messaging surface. Statistics are deferred at the presentation
layer: retain relevant structured gameplay data so later analysis does not require reconstructing missing
facts. Forge Steel export is not required for v1, but the character data model must preserve the information
and adapter boundaries needed to add it without rewriting the system; import remains required.

## The table: the heart of the app

Confirmed v1 mode scope: combat, free play, and a dedicated respite flow are included; respite is core
gameplay. Dedicated montage-test and negotiation flows, and downtime-project tracking, are excluded from v1.
Earlier descriptions of montage/negotiation as distinct structured states describe future design, not required
v1 modes. Their core reference text remains in scope. Research respite rules before designing its detailed
lifecycle; downtime-project integration is not a v1 prerequisite.

Confirmed v1 chat policy: authors cannot edit or delete their sent campaign-chat messages. This does not alter
campaign deletion, which removes its chat, or account deletion, which preserves username attribution in other
retained campaigns. No separate Director moderation power is established by this decision.

The campaign connects players and content and becomes the day-to-day hub. It contains distinct play sessions,
with only one active session at a time. The table is the realtime play surface inside a session, bringing
together people, conversation, characters, monsters, and rules resolution. See the
[table specification](table-spec.md) for the current session/participation model and core gameplay loop.

Stated capabilities:

- Multiple participants joined in the same shared play space, together in person or remotely.
- An active Director running play.
- Players see each other's Stamina and Recoveries, not full sheets by default. Existing explicit sheet grants
  remain applicable. A broader visibility setting is a possible later extension.
- Rolls are public by default. Planned dice-tower rolls show results only to the Director, not even the
  rolling player; the tower UI remains open.
- Proposed deliberate sharing of abilities, sheets, and monster blocks, possibly by dropping content into
  campaign chat; interface and disclosure contracts remain unsettled.
- Any campaign member may observe the table and use campaign-level party chat without being selected to play.
  Observers cannot interact with session gameplay; observation does not change the locked party roster.
- Text chat and sheet viewing remain accessible while paused and outside sessions, subject to existing
  permissions. Gameplay actions require a running session. Inventory management is character data; players may
  transfer items between their character and party inventories between sessions.
- A rolling game log as the main centerpiece for v1, including actions and outcomes. Future UI may change its
  visibility; durable history remains required.
- Character sheets and monsters available during play. Monster stat blocks are visible to the Director, not
  players/observers at the table. A campaign-wide health setting, changeable by the Director at any time,
  shows exact current Stamina (Numerical), a proportion-only health bar (Bar), or only winded status (Winded).
  The public monster glossary remains accessible; see the
  [table visibility contract](table-spec.md#monster-visibility-and-health-display).
- Rules interpreted through the engine as players take actions.
- Damage, conditions, effects, and resources reflected in the relevant sheets and stat blocks.
- Encounters run at the table, with relevant resources persisting across sessions.
- Spatial outcomes usable as prose instructions without requiring an integrated digital map.

A running session without an active structured activity is in free play: participants can use abilities and
spend resources subject to core rules, and the Director can call for tests, activate traps, and use other
applicable tools. Starting an encounter introduces rules-governed turn order and encounter resource/reward
lifecycles; completing its outcome and cleanup returns to free play. The Director can also void an encounter,
skipping its normal ending awards/effects and choosing to keep current character/monster state or restore
their pre-encounter state. Ending or voiding releases the party roster lock. A session can be paused to freeze
the table. It remains running until explicitly paused or closed, regardless of who is connected, including
when the Director or everyone disconnects. Respite is a dedicated table mode with its own self-contained
gameplay loop, started and ended by the Director. Its mechanics and possible connection to downtime require
further research. Montage tests and negotiations are future structured table states, outside v1. The user
clarified that the rules group combat, montage tests, and negotiations as encounter types; earlier
combat-specific locks and cleanup do not automatically apply to all of them. Their future design includes
Director start/end controls for montage tests. Provisionally, only one structured table state may be active at
a time. Nesting is a possible later extension informed by real play, not part of the current design. Their
detailed procedures and transitions need separate design. Role-dependent panes, presence, and remaining
interaction decisions are in the [table specification](table-spec.md).

Character sheets are locked against editing while in an encounter, including while paused. Encounter changes
immediately update the main sheet; there is no separately editable encounter copy or deferred merge.
Pre-encounter state is retained for undo/void-reset, and keep-state voiding retains already-applied changes.
See the [sheet-lock contract](table-spec.md#character-sheet-lock-during-encounters).

### Useful play with partial automation

The app should provide the practical tools for loading monsters, preparing encounters, and identifying the
abilities a character can use even while the engine's supported mechanics are growing. Availability and
affordability should reflect known character and table state; unresolved prerequisites should remain visible
rather than being guessed.

Players must be able to read the full ability text and see what the engine actually applied. They can supply
missing outcomes and correct mistakes through manual game operations. The action's history should distinguish
automated effects, manual effects, and anything still awaiting resolution. Manual changes belong to the same
state/history system and remain reversible.

An unsupported mechanic must not make its text inaccessible or prevent the table from resolving it manually.
If that mechanic affects later results, those dependent results need the table's answer before automation can
complete them. Interface details and permissions remain open.

The intended progression is useful play with increasing automation: as the parser and interpreter improve,
players should have fewer mechanical steps to handle themselves. Full ability text remains available
regardless of automation coverage.

### Headless play and UI iteration

The visual table will need extensive iteration. Both the engine and the app's game operations must be usable
independently of that UI.

A CLI-like development interface should let agents load heroes and monsters, run actions and battles, record
inputs and outputs, and inspect changes to sheets and table state. This supports two distinct checks: whether
the engine interpreted the rules correctly, and whether the resulting effects were actually applied to the
intended character or monster. See
[the development workflow](development-process.md#headless-development-workflow).

### Table history and rollback

Campaign chat and the game log are separate entities for v1. Their UI composition is deferred; a later
interface may combine chat with a curated game-log feed.

The running history is central to both play and development. The game should behave as a state machine:
actions produce transitions from one game state to the next, and those transitions remain available across
sessions.

The current checkpoint places action-by-action undo inside an encounter and realtime shared play inside an
open session. Every encounter action must be reversible. Restoring a point means restoring the corresponding
game state, including affected characters, monsters, resources, conditions, and turn or encounter progress.
Removing a displayed history entry alone does not satisfy this requirement. Confirmed for v1: closed sessions
are permanently read-only, resolving the earlier cross-session rollback question. Preserve detailed history
for review; do not reopen closed sessions or apply live undo/redo across their boundary. Further play happens
in a new session.

Navigation works forward as well as backward through recorded history. The log records initial game values,
inputs sent to modifiers such as the rules engine and dice roller, their outputs, and the resulting changes.
Navigation restores the state before or after an action using that record; it does not run the inputs through
the modifiers again.

The CLI-like interface must also expose history and rollback so agents can reproduce and investigate a
sequence without the visual UI. The visual table presents that same activity as an ongoing dialogue.

Preserve the game log from every session. All current campaign members can read all past session logs by
default, including sessions they did not attend. Add a Director-only history view later if specific
information requires it. The user also wants to analyze usage across sessions and campaigns. Possible future
character/campaign dashboards include times winded, monsters slain, and ability uses; a further analysis
engine is exploratory and its behavior remains unspecified. Metric meanings, access policies, and treatment of
rollback need definition. See the proposed [app data storage analysis](data-storage-analysis.md) for the
persistence and statistics model.

After session closure, its game log can be compressed and relevant data delivered to persistent records and
statistics. The proposed [data structure and architecture specification](data-architecture-spec.md) retains
detailed archives alongside smaller current-state, summary, and archive-reference records. Current character
values are saved during play; closure must not apply their effects again. Closing a session with an active
encounter voids it, with the same keep/reset character-and-monster-state choice as explicit voiding. Pausing
preserves it without a duration limit. An encounter cannot span closed sessions; non-encounter activity
retains its own history.

Confirmed: players can undo their own actions back to the beginning of their turn; the Director can undo and
redo those actions. Enable user undo is a confirmed campaign setting, enabled by default. Disabling it
preserves Director undo/redo; management and change-timing details remain open. Still to decide: detailed
rewind scope, the exact boundary of one action when reactions or choices intervene, how chat behaves during
rollback, continuation after undo, and whether live undo can cross encounter boundaries within an open
session. Closed sessions cannot be reactivated in v1. These decisions should not be assumed from the
requirement to restore game state.

The table role doctrine is that anything a player can do at the table, the Director can also do. Players
choose **Take turn** for eligible characters, and the Director has the same control on their behalf. Character
progression is a separate, owner-controlled track with its existing review rules; see the
[access checkpoint](accounts-and-access-spec.md#director-table-capability-doctrine).

## Campaigns and participants

- A campaign contains sessions; each session contains its table. The Director starts the session, selects
  players from campaign members, and can add/remove session players outside an active encounter. Encounter
  start locks the party's players and selected characters; roster changes require ending or voiding it before
  starting a new encounter. Selected players choose one or more eligible owned/shared characters. Session
  participation, connection status, and encounter combatants are distinct.
- A campaign has an owner, an active Director, and a group of players.
- Share codes/URLs let players request membership. Campaigns default to unlisted; the public directory and
  listing controls are deferred beyond v1. The owner approves requests and can kick members.
- V1 has one user-to-user Block control and no separate campaign-ban feature or independently managed ban.
  Blocking removes the target from every campaign owned by the blocker and prevents new membership
  requests/admission to those campaigns, including future campaigns. It also revokes character shares between
  the two users in both directions. Unblocking lifts the campaign restriction caused by that block. Unblocking
  does not restore removed memberships or revoked character shares; those require fresh admission approval or
  owner-issued sharing. If the blocker owns a campaign whose active Director is the blocked user, active
  Director control immediately returns to the campaign owner. In a campaign owned by someone else where both
  users remain members, blocking does not hide either user's campaign-chat messages: chat access follows
  campaign membership. Remaining active-combat removal handling and invitation behavior still need definition.
- The owner is initially active Director; other members are initially players. The owner can appoint a player
  as the sole active Director for the current session, if one is active, or until revoked.
- Each participant, including the Director, can have multiple characters in that campaign.
- Campaign creation allows enabling/disabling content sources. Reusable content is grouped into packs/sets,
  common to official content, future available MCDM additions, community-authored content, and personal
  homebrew. See
  [content packs and campaign selection](data-architecture-spec.md#31-common-pack-contract--proposed) for
  proposed portability/versioning contracts and unsettled behavior after creation.

When a session-only Director appointment ends, control returns to the campaign owner, not a previous standing
Director.

Ownership, acting as Director, and having characters are distinct concepts. Character access through campaign
attachment is defined below; character build choices remain with the owning user. Director appointments and
character control grants are recorded in the [accounts and access specification](accounts-and-access-spec.md).
Other editing permissions remain to be defined. V1 supports campaign deletion, not archiving or ownership
transfer. Deletion preserves other users' detached characters and removes campaign-owned records; account
deletion also removes that user's owned campaigns, characters and saved encounters. See
[deletion and retained history](accounts-and-access-spec.md#campaign-and-account-deletion) for active-session
behavior and username attribution. Only one active session per campaign is now confirmed. Closed sessions
become historical records. The [table specification](table-spec.md) refines this hierarchy; the
[data architecture checkpoint](data-architecture-spec.md) retains encounter journals and archival contracts;
its earlier cross-session encounter-segment proposal is superseded.

### Character ownership and campaign attachment

Confirmed character management outside combat: owners may edit names, appearance, biography, and notes without
Director review, and may detach their own characters without Director approval. Notes retain owner-only
visibility. Pending full edits survive departure as a private draft; detachment does not activate that draft.
Duplication copies the currently active build, excluding pending edits, while retaining the established
independent inventory/history and cleared campaign-value rules. Owners may withdraw a submitted review before
the Director decides. Both the character owner and campaign owner may detach a character. The campaign owner
can kick a player or remove individual attached characters; removing a character alone does not remove its
owner's campaign membership. Director status alone does not grant this campaign-management power. Removed
characters remain owned by their creators and follow the established detachment policy. Existing combat locks
and separate campaign/account deletion rules remain in force.

Confirmed requirements:

- Every character remains owned by the user who created it. Campaign attachment and sharing do not transfer
  ownership to the campaign owner, Director, or another player.
- The character owner can grant another player permission to view and run the character in combat for the
  current session or until revoked. An existing session player may take over an encounter character only if
  its owner has already shared it with that specific user. The active Director can act on behalf of any table
  character without such a share at any time, subject to session/pause/rules constraints; this changes neither
  party roster nor build ownership. Sharing is limited to members of the same campaign and includes
  progression-history viewing. Several eligible members may hold character grants simultaneously. Character
  notes remain owner-private; any additional private-field exclusions remain open; see the
  [accounts and access specification](accounts-and-access-spec.md).
- A character is either unattached or attached to exactly one campaign. It cannot be attached to multiple
  campaigns at once.
- While attached, the campaign owner and active Director can see the character sheet and access its
  progression/decision-tree history. Character notes are private to their owner, including hidden from the
  Director; other private-field exclusions remain to be defined. Current direction: they do not choose build
  options for someone else's character. Being Director does not grant control of those selections; a Director
  who owns a character still makes its choices as the owning user. Inspection of history does not itself
  authorize changing the active build. Other override/rollback permissions remain to be specified.
- An attached campaign can connect its operations to character values such as Victories and experience. The
  character is a participant in ongoing campaign state, rather than merely a read-only imported sheet.
- A character can be detached, becoming unattached and available to attach elsewhere.
- On detachment, campaign values clear, including XP and Victories. The user keeps the character and its
  current level, progression history, authored details, and inventory. Clearing XP must not lower the
  character's retained level or undo earned build choices.
- A character can be duplicated into another campaign. The duplicate is a separate character, so later changes
  do not synchronize with the original; the original can remain in its existing campaign.
- Campaign values do not carry into another campaign, whether moving through detachment or duplicating there.
  The destination starts with cleared campaign values; duplication does not clear the original character's
  values in its existing campaign.
- On attachment, the user chooses the entry level, up to the character's current level. Lower-level entry uses
  the corresponding progression build and its derived stats. It is not a level-number-only change.
- Admission and full edits require Director review unless the active Director owns the character; their own
  changes are logged without approval. For reviewed characters, the existing effective build stays in use
  meanwhile. Level-ups through the scoped level-up wizard are not review gated. See
  [wizard modes and review](character-wizard.md#wizard-modes-and-campaign-review).

Example: a user owns a level-7 wood elf Shadow. They can attach that character to a campaign at level 3, using
the level-3 progression with their present inventory. They cannot simultaneously attach that same character to
another campaign, but can duplicate it into another campaign or detach it before moving it. A level-7 original
and a lower-level campaign copy remain distinct character instances.

Level selection follows [progression rollback](character-wizard.md#progression-history-and-rollback): it
selects the build and derived baseline submitted for admission without rewinding inventory. The build becomes
effective after Director approval, or after a valid logged admission by its owning active Director. The
preserved history remains available; a higher-level history entry is not permission to bypass the full-edit
review gate. Scoped level-ups are ungated. The entry-level ceiling refers to the current level at attachment,
not automatically the highest level anywhere in retained history.

Proposed attachment behavior: preview the chosen build and its outstanding conversions, then submit that
revision for Director approval before it becomes the effective campaign build. Pending admission must still
respect the single-campaign attachment constraint. If an imported character lacks enough history to
reconstruct a requested level, surface missing choices and resolve them rather than inventing an earlier
build. Duplication should create a new character identity, copy the build/history and independent
authored/inventory data, and submit it for destination approval without copying the original's campaign
authority, approval, or table membership. Clear campaign values in the duplicate. The clearing rule concerns
campaign values; it does not yet specify treatment of current damage, conditions, or every encounter resource
during duplication/detachment.

Still to define: which campaign operations control Victories/experience and the complete set of campaign
values; permissions for attachment and detachment during play; character editing/progression is now blocked
while in an encounter; and access to historical campaign records after detachment. The reset policy itself is
settled: campaign values clear and the current level remains. Proposed access boundary: detachment removes
access to the live character granted by that attachment, while existing campaign log records remain subject to
the campaign's own history policy. Clearing current campaign values does not mean deleting recorded campaign
events. Visibility for ordinary players without a character grant remains open.

## Account and social features

V1 user discovery for friendship uses a personal share code and URL, analogous to campaign share codes/URLs;
username search is not included. Friend requests, campaign join requests, and character review requests
surface in the relevant UI areas. There is no notification system in v1. All notifications, including email
and push event alerts, are deferred beyond v1. Password reset is the only email flow to design for v1. Both
personal and campaign share codes/URLs can be regenerated by their owner at any time, invalidating the old
code/link without invalidating already-pending requests.

The [accounts and access specification](accounts-and-access-spec.md) consolidates signup, account management,
future administrative sign-in, and the selected Better Auth integration. Convex is the data system and
Better Auth is the chosen authentication library. The [v1 tech stack](v1-tech-stack-spec.md) records the
rationale and hosting portability; email-provider integration and future LAN recovery remain deferred.

- User profile and name.
- Signup, email, password, and account settings.
- No administration-dashboard functionality in v1. Earlier separate-admin sign-in and capability proposals are
  future work.
- Friends mechanic with sending, approving, denying, and revoking requests, plus controls to manage friends
  and blocking.
- Basic relationship categories: unaffiliated, friend, or blocked, with incoming/outgoing pending requests
  represented separately.
- Include this relationship foundation early. Friendship initially grants no additional access; friends-only
  campaign or statistics visibility is a possible future feature.

The
[proposed friendship and blocking lifecycle](accounts-and-access-spec.md#4-friendship-and-blocking-foundation)
shares a relationship mechanism while distinguishing mutual friendship from unilateral blocking. Removing
friends, clearing requests on block, and unblocking without automatic restoration are proposed transition
rules. V1 has only user-to-user blocking, which removes the target from blocker-owned campaigns, prevents
admission, and revokes character shares in both directions. Unblocking lifts its campaign restriction.
Unblocking does not restore memberships or shares. Blocking your campaign's active Director immediately
returns control to you. Blocks do not hide campaign-chat messages where both users remain members of a
third-party-owned campaign. Remaining active-combat removal and invitation behavior remain open.

## Things a user can own

- Campaigns.
- Characters.
- Saved encounters.
- Future: homebrew content, including monsters; outside v1.

This list is intentionally open. Characters retain user ownership and have at most one campaign attachment, as
defined above. Character viewing/combat sharing is established above and does not transfer creator ownership.
Saved encounters are private to their creator in v1, with sharing deferred. Homebrew sharing is future work.
Campaign ownership transfer is excluded from v1.

### Campaign inventories and loot

Hiding the Director's stash cancels all outstanding provisional claims and releases their reservations without
transferring items. The Director cannot approve claims while the stash is hidden. Revealing it again requires
fresh claims; previously approved deposits remain completed. V1 excludes item stacks: each inventory/stash
item is represented individually, with no stack splitting, merging, or partial-quantity claims. Multiple
copies of an item may exist as separate instances; monster quantities in saved encounters are unaffected.

V1 includes character inventory lists and a shared party inventory, both at campaign level, with
equipped/unequipped mechanics and transfers between party and character inventories. Inventory management is
character data, even though items may affect the character; transfers between party and character inventories
are allowed between sessions. Inventory management also works while paused if the character is not locked in
combat. Only the owner and active Director can inspect a personal inventory. V1 excludes direct
character-to-character transfers and free-text custom items. Starting equipment is supplied through character
creation. Players acquire later loot through Director-approved stash allocations rather than creating items
directly; existing items can still move via party inventory. Players may discard items from their own or the
shared party inventory but cannot return items to the Director's stash. The active Director can directly edit
character inventories, subject to the combat edit lock. Transfers, discards, and edits have a history the
Director can review, undo, and redo. Players can read their own inventory history, and all campaign members
can read party inventory history; players cannot undo personal or party inventory changes. Owners retain their
personal inventory history after their character leaves a campaign; dependency handling remains unspecified.
Exact item rules and remaining shared-inventory authority need further design.

Provisionally, there is **one persistent Director's stash per campaign**, holding rewarded/discovered loot for
party members to move into party or individual inventories. A saved encounter's reward items are added to this
same stash when the encounter is loaded; successive wrap-up screens display it without adding those rewards
again. The Director can add/remove stash items at any time, including outside encounter wrap-up. The whole
stash is hidden until the Director shares it, using a proposed toggle like monster visibility. The Director
may reveal it at any time; whenever visible, players can propose taking items, including outside wrap-up. An
accepted claim reserves the item, making it unavailable for a second claim. A player may withdraw an
unapproved claim to release it. The Director can still reassign it and approves the final allocation before
items are deposited, using the same process as wrap-up. That visibility control is sufficient for v1 sharing,
with richer mechanisms deferred. Standalone saved stashes are excluded from v1. Instead, saved encounters
include a rewards stash, with a rewards-stash step in normal encounter cleanup. An encounter wrap-up screen
includes the stash: players freely make provisional claims, the Director adjudicates allocations, and items
are deposited only when the Director finishes wrap-up. Cleanup can finish with unclaimed loot: the displayed
stash is persistent storage, and remaining items simply stay there afterward. Shops and chests are possible
later discoverable inventory objects. The user also reinforced sharing objects of different kinds through
messages; UI and v1 object-sharing scope remain open. See the [inventory specification](inventory-spec.md),
including the unresolved relationship to earlier character inventory-retention rules on detachment.

### Future Slain table

A later campaign feature will show everything killed by the party over the campaign's lifetime, how each
creature died, and who killed it. Preserve the underlying play history after foes leave the roster. Kill
attribution and undo/void treatment remain to be designed; this is not a v1 delivery requirement.

### Saved encounters

V1 users can duplicate their own saved encounters as independent templates, including monster selection,
party-strength calculator setup, and prepared rewards. Duplication does not load live foes or grant loot. The
public campaign directory is deferred beyond v1; campaigns are unlisted by default and v1 discovery uses
campaign share codes/URLs. Opting into a public listing belongs to the later directory feature.

New campaigns default the foes-roster Add visibility toggle to hidden. Its value is stored per campaign, and
both individual catalog additions and monsters loaded from saved encounters use that current value. Changing
the default does not change existing foes' individual visibility.

The encounter builder supports reusable preparation and duplication of owned saved encounters. The Director
can manage the live foes roster at any time, including additions/removals and saved-encounter loads between
sessions, while paused, or during combat. For v1, a saved encounter retains a reusable monster selection,
including quantities, its **party strength calculator** setup (working title), and a **rewards stash**. No
other authored supporting content is required. The v1 builder also calculates encounter difficulty for a
planning party: add hypothetical character stubs with adjustable levels, or import party stubs from any
campaign the user owns or actively directs. Imported stubs can be deleted individually and their levels
edited, with a reset back to the source character's current actual level. These changes do not affect the
original characters or live roster. Each encounter remembers the calculator's last setup, including the
remaining hypothetical/imported stubs and adjusted levels; reopening preserves those levels until deliberately
changed or reset. Difficulty is derived guidance, with formulas to verify against the rules. A current-EV
comparison against the current party in the foes roster is proposed, with all undefeated roster monsters
included regardless of visibility or current combat membership. Defeated monsters stop contributing
immediately, before their entries are removed at normal cleanup. Saved encounters are private to their creator
for v1; sharing is deferred.

Loading a saved encounter populates the Director's **foes roster** with independent monster instances and the
rule data needed to run them. If the roster is nonempty, a dialog offers **replace** or **append**. Changes
during play do not change the saved version, and later template edits do not change existing instances.
Loading it again creates fresh instances; loading alone does not start combat.

The foes roster mirrors the party roster and appears in the Director's pane. It is persistent campaign state:
session closure preserves the roster and its resulting keep/reset state for the next session. Defeated foes
remain marked during combat, then normal encounter cleanup removes them from the roster while preserving
history. Survivors remain; voiding follows keep/reset without that cleanup. No additional roster-clutter
mechanism is required. Its top controls search/add stat blocks or load a saved encounter. A toggle beside Add
sets whether new monsters start visible or hidden, without changing existing roster entries. Monsters retain
their stat blocks and current state until removed, can act in free play, and can be selected into combat
without resetting their values. The Director can add/remove monsters during an encounter, including
participating foes, without ending or voiding it; the foes roster has no combat lock. Hidden foes remain
usable by the Director, including attacking players; hiding only suppresses their player-facing roster
entries. For now, their names remain visible in game-log entries when they act. Each has a show/hide toggle;
visible foes follow campaign health-display policy and their full stat blocks remain private. See the
[foes-roster contract](table-spec.md#foes-roster) for remaining lifetime and editing questions.

## Public reference libraries

Anyone should be able to use these tools without joining a campaign:

- **Rules:** a searchable reference for all core Draw Steel rules in v1.
- **Items:** browse and find in-scope official game items, including those whose mechanics are not yet
  automated.
- **Foes:** search supported official monster stat blocks, with eligible retainers, companions, and summons
  included in v1 reference coverage.

**Confirmed v1 scope: core rulebooks only.** Character creation and advancement support every core class
through levels 1–10. All official supplemental content, if present in the source corpus, is outside v1,
including Summoner, Beastheart, and their associated mechanics. Homebrew monsters, character options, and
items are also excluded. Creating characters from core options and saving encounters/rewards assembled from
core content remain in scope; these are user-created records, not homebrew rules content.

Summoner and Beastheart are official MCDM supplemental classes, not core-rulebook classes; they and their
associated mechanics are not v1 targets. Compendium inclusion does not establish core status or release scope.
See the [reference-library specification](reference-library-spec.md) for source/automation boundaries.

Public reference access is in scope. Bookmarks/collections and homebrew publication are outside v1; richer
object sharing remains future design.

## Creation tools

An active Director's own character admission and full edits are logged and require no approval step. Other
characters retain Director review. This exemption does not bypass build validation, campaign source limits, or
combat character-edit locks.

The [character wizard specification](character-wizard-spec.md) consolidates the detailed character
requirements, proposed operation contracts, acceptance scenarios, and open decisions.

Character creation and management must support importing Forge Steel hero data files; compatible export is not
required for v1, but the model must support adding it without a system rewrite. Maintain our own character
model, with an interchange adapter. See [the file-format investigation](forge-steel-interchange.md). Exact
supported versions and the treatment of unmapped homebrew remain to be established through implementation.

- **Encounter builder:** prepare and save monster selections, the party strength calculator setup, and a
  rewards stash, with calculated difficulty for the planning party in v1.
- **Character wizard:** the main creation/full-edit wizard exposes foundational choices and all
  levels/options; a separate level-up view shows only choices applicable to the character's level transition.
  Both use the same decision system. Campaign admission and full edits require Director approval except for
  the owning active Director's logged changes; scoped level-ups do not.
- **Monster builder — deferred beyond v1:** no homebrew monsters in v1. Later authoring can use supported
  stat-block language; creating, copying for customization, and sharing homebrew monsters are not v1
  requirements.

These tools should connect to the things users own and the campaigns where they play. Detailed interaction
design remains open; core-rulebook coverage and the v1 authoring exclusions are settled.

## Possible additions to consider

These are suggestions, not accepted requirements:

- Session notes and a record of where the group left off.
- Director notes and control over information revealed to players.
- Bookmarks or collections for frequently used library content — explicitly excluded from v1.
- Import, export, and duplication of other user-created content, beyond the confirmed character and
  saved-encounter duplication and character-import requirements. No general campaign-cloning feature is
  established here.

## Next discussion

The user requested a checkpoint after the pre-alpha scope discussion. No question is pending. Use the
[scope and remaining gaps](pre-alpha-design-gaps.md) when the user resumes exploration. Detailed combat
mechanics remain deferred for a separate conversation; the established campaign/session hierarchy, roster
permissions and high-level encounter loop remain in place.
