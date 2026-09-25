# V1 specification checkpoint

Consolidated through 2026-09-13 after the product, technology and gameplay design discussions. This is a
documentation checkpoint, not an implementation milestone or approval of proposed technical defaults.

The [V1 roadmap](v1-roadmap.md#confirmed-development-tracks--2026-09-15) records the confirmed
five post-v0.01 tracks: parser/rules engine, foe coverage, characters (wizard, sheets and progression),
UI/polish, and app/social features.
Character and foe coverage can advance with explicit manual mechanics while automation develops.
It also retains the earlier specification sequence and the respite discussion checkpoint.

Post-v0.01 implementation uses [the track kickoff](kickoff-development-track.md) and
[build process](build/README.md), including separate worktrees, short-lived slice branches and runtime
isolation. The [accepted prototype record](build/evidence/v001-acceptance.md) closes the scope described
below; historical statements about its remaining work are not instructions to restart it. Fuller V1
behavior still requires its own implementation and verification.

## Current release scope

The [user-confirmed 2026-09-22 target](v1-roadmap.md#current-v1-release-target--confirmed-2026-09-22)
now governs V1 release breadth: all classes close to fully automated through level two or three,
useful low-level foes rather than complete bands, and most app features working and tested.
The fuller scope below remains a source of feature contracts and future expansion, not a requirement
to complete every listed feature or all levels 1–10 before V1. See the target for unsettled boundaries.

## Immediate milestone: v0.01

Scope review concluded 2026-09-14: the user is satisfied with the shared-basics prototype scope.
Continue through the [build handoff](web-app-build-handoff.md#v001-scope-review-complete--build-handoff),
asking concrete questions only as build work exposes them. This does not declare all fuller V1
specification work complete or certify the prototype implementation.

Engine language confirmed 2026-09-14: use TypeScript for v0.01 and beyond unless a concrete reason
to change emerges. No routine later language comparison is required; packaging, runtime placement
and integration are still outstanding. See [the engine decision](engine-architecture.md#standalone-engine-and-portability).

The current target is a desktop pre-alpha with temporary UI and a durable architectural foundation. The
[pre-alpha scope checkpoint](pre-alpha-design-gaps.md) consolidates the accepted journey, per-feature
inclusions/deferrals, component boundaries and remaining gaps. Read it before applying the fuller V1 scope
below; those complete feature lists are not automatic prototype gates.

The connected journey is campaign creation/invitation, session start, a catalog foe and a level-one devil
Fury created through the minimal wizard, and basic combat with a visible game log. Complete ability parsing
is not required. Existing authority/privacy and session rules apply to exposed features. Development data
is disposable across breaking updates under the [development policy](development-process.md#confirmed-pre-alpha-development-policy).

**Latest discussion checkpoint, 2026-09-14:** v0.01 prioritizes common game basics as the foundation
for later parser/engine development. Class/stat-block-specific runtime execution is deferred,
superseding the earlier automatic turn-start Ferocity requirement. Preserve readable features,
recorded manual resolution and the separately required minimal wizard/derived baseline. G4's common
systems, Malice and Slain status remain. See [the current scope](pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope)
and [rules status](workstream-rules-status.md). Next is a common-operation acceptance walkthrough;
unresolved mechanics are not authorized for implementation by this specification update.

**v0.01 foe visibility, confirmed 2026-09-14:** defer hiding and its hide/reveal/Add visibility
controls. All loaded foes are visible in audience rosters, with participating foes visible in
shared setup and initiative. Full stat blocks remain Director-only; health display and Malice
visibility keep their separate policies. Fuller V1 hidden-foe designs below are future scope.
See [the owning contract](table-spec.md#monster-visibility-and-health-display). This records scope,
not an implementation change.

All table controls use registered UI/palette/slash/headless operations and ordered attributed log entries.
Action cards collect intermediate choices and cross-user responses, including persistent area controls.
The [command design](table-command-spec.md), [formal grammar](research/table-command-grammar.md) and
[draft command reference](table-command-catalog.md) distinguish accepted behavior from proposed schema
names. The chronological [decision record](gameplay-decision-record.md) preserves superseded alternatives.

## Readiness

The main product boundaries are defined well enough to organize workstreams. Prototype scope and remaining
contracts are tracked in the pre-alpha checkpoint; the sections below describe the fuller V1 destination.
The app is not yet fully specified for end-to-end play: respite rules, detailed combat resolution, state
reconciliation, and several lifecycle operations still need work. Do not treat readable core-content coverage
as complete automation, or the existing pre-alpha web app and headless experiment
([app status](workstream-app-status.md)) as a finished application.

The [original gap review](v1-spec-review.md) is historical. Use this checkpoint and the linked primary specs
for current decisions; the original review's unresolved scope questions are not an instruction to ask them again.

## Release scope

| Area | Included in v1 | Deferred or excluded |
| --- | --- | --- |
| Delivery | Online-first web app for phones, tablets, and desktop; headless/shared game operations; sustained table performance | No native-app plans; full offline operation is not required; preserve future LAN hosting without promising its packaging in v1 |
| Rules content | Core rulebooks and searchable references; eleven-class wizard through levels 1–10, explicitly including Beastheart/Summoner editor dependencies (Q-CHAR-14) | Other official supplements and homebrew; Beastheart/Summoner table/engine delivery has separate milestones |
| Play | Free play, combat, dedicated respite; initiative groups on both sides and multiple heroes per player; readable rules and recorded manual resolution where automation is incomplete | Playable retainers and friendly monsters; dedicated montage/negotiation flows, downtime projects, nested structured activities |
| Characters | Creation, advancement, full edits, progression history, sharing, detachment/duplication | Forge Steel import (paused, user ruling 2026-09-25) and export implementation; preserve the model/adapter data needed to add it without a rewrite |
| Encounters | Private user-owned templates, duplication, monsters/counts, prepared initiative groups and minion squads/captains, remembered party-strength calculator, prepared rewards | Template sharing and other authored encounter content |
| Inventory | Individual item instances, equipped/unequipped state, character/party inventories, persistent Director stash and approved claims | Item stacks, direct character-to-character transfers, player-created/free-text items, standalone saved stashes |
| Accounts/social | Account settings, friendship, user blocking, regenerable personal/campaign share codes and URLs | Username search, public campaign directory, app admin-dashboard functionality |
| Messaging | Campaign chat; requests appear in the relevant UI; password-reset email | All notifications, private direct messages, author editing/deletion of sent chat messages |
| History | Detailed gameplay/inventory/progression records; data sufficient for future statistics | Statistics dashboards, Slain table UI, reference bookmarks |
| Campaign lifecycle | Owner deletion; unlisted campaigns by default | Campaign archiving, ownership transfer, public-listing controls |

Public reference coverage remains broad within core sources, even for excluded dedicated gameplay flows.
The core source audit must distinguish eligible retainers/companions/summons from supplemental entries.
General engine/parser/pack architecture can support future content without exposing it as a v1 feature.

Confirmed initiative refinement: automatically create one group per hero; only the Director may change hero
grouping in V1. The Director creates monster groups and may combine heroes during setup. Retainer/friendly-monster
play is deferred beyond V1, while groups
preserve a way to add those actors later. The future attached-retainer default is their mentor's group.
This implementation deferral does not remove eligible core entries from the public reference coverage.

## Primary specifications

| Topic | Authoritative checkpoint |
| --- | --- |
| Faithful automation, warnings, table adjudication, source disclosure and manual play | [Rules adaptation principles](rules-adaptation-principles.md) |
| Source research and independent rules-review workflow accepted for trial | [Development process](development-process.md) |
| Technology recommendations, table performance, rendering and deployment portability | [V1 tech stack](v1-tech-stack-spec.md) |
| Session, table, foes roster, combat lifecycle, visibility and undo | [Table](table-spec.md) |
| Table commands, action cards, accepted human syntax and headless interaction | [Commands and action cards](table-command-spec.md) |
| Accounts, roles, discovery, grants, privacy, blocking and deletion | [Accounts and access](accounts-and-access-spec.md) |
| Build choices, revisions, admission, progression and interchange | [Character wizard](character-wizard-spec.md) |
| Initial v0.01 sheet content, hierarchy and desktop interactions | [Character sheet](character-sheet-spec.md) — temporary presentation; fuller V1 refinements remain later work |
| Inventory, stash, claims and inventory history | [Inventory](inventory-spec.md) |
| Core/supplemental source scope and readable coverage | [Reference libraries](reference-library-spec.md) |
| Catalog ingestion, independent monster instances and encounter preparation | [Monster catalog](monster-catalog-spec.md) |
| Ownership/lifetimes, journals, storage, archives and future statistics | [Data architecture](data-architecture-spec.md) |
| Standalone rules engine and optional visual dice | [Engine architecture](engine-architecture.md), [dice roller](dice-roller-spec.md) |

## Settled boundaries to preserve

### Technology and delivery

Convex is the backend and **Better Auth is the selected authentication library** through its Convex
integration. The hosted plan uses Cloudflare for the frontend/assets/object storage and Convex Cloud for the
backend. Preserve a future home-server/LAN deployment with local essential assets and services; this does not
require independent offline clients or automatic cloud/LAN synchronization.

The table is the primary realtime multiplayer and two-to-six-hour sustained-use surface: chat, rendered
character sheets, abilities, Director foes/encounter operations, inventory, and loot. It must not require
routine hard refreshes to recover from performance degradation. Other screens need ordinary responsive
behavior and correct access updates. React/Vite/TanStack Router and the supporting libraries remain the
recommended baseline in the tech spec; SSR remains a separate open delivery choice, not a long-session fix.
Email-provider integration and future local recovery arrangements are deferred; password reset stays in v1.

### Sessions, roles and rosters

A campaign has one active session, including while paused. Connection loss never pauses or closes it.
Closing a session with active combat voids that encounter with the keep/reset choice and no normal rewards.
Pausing preserves the same encounter indefinitely. Closed sessions are permanently read-only in v1.

The campaign owner and active Director are distinct. When a session-only Director appointment ends, the
owner resumes; a prior standing Director does not automatically resume. Blocking or deleting the active
Director's account also returns control to the owner in a retained campaign.

| Operation | Confirmed boundary |
| --- | --- |
| Director changes session players/selected characters | When no combat encounter is active and the session is not paused |
| Director adds/removes foes or loads saved encounters | Between sessions and during running combat; paused sessions lock both rosters, including regrouping |
| Gameplay actions and resource spending | Running session and applicable core rules; pause blocks gameplay |
| Ordinary character/build edits | Locked during combat, including while paused |
| Character-data inventory management | Available between sessions/while paused, subject to combat character locks and item permissions |
| Campaign observer | May read the permitted table and campaign chat; cannot perform session actions or claim stash items |

The roster-management rules supersede older restrictions requiring a running/open session to manage foes.
The latest pause lock supersedes the earlier permission to edit rosters while paused. These rules do not
authorize gameplay while paused or changing a closed session's records.

Players can take turns with eligible owned/shared characters. The Director can perform any player table
operation on their behalf. Character progression remains a separate owner-controlled track. Detailed
concurrent action, triggered-action and undo dependencies remain open in the active resolution workstream.

Encounter setup is draft until the Director confirms with OK. At OK, capture the precombat gameplay
baseline, commit the encounter and apply party-roster/character-edit locks before initiative. Canceling
before OK discards draft choices, preserving independent roster changes; abandoning afterward uses the
existing Void keep/reset choice, including during initiative. Detailed start-effect ordering remains open.

Any active player may roll the shared initiative roll; Director access remains and observers cannot roll.
Initial setup gives each ordinary monster its own initiative group, like heroes; minion squads are
a separate mechanism. Draft roster changes preserve remaining creatures' setup choices.
A newly added mid-combat monster defaults to a new group at the bottom of initiative, adjustable by the
Director. The Director may regroup selected turn entries during combat. Each entry retains its spent
state; entries for one creature share its live state. Squad turns additionally retain each member’s
participation and the captain’s separate action allowance. Spent entries stay grayed out in their
destination group; one creature-wide acted flag cannot represent multiple turns. Newcomers have a turn
available in the current round. An unspent member joining a finished group does not reactivate it, while
moving the currently acting creature leaves its ongoing individual turn uninterrupted. The original
group continues afterward; unspent arrivals may act during a still-active group's activation. A group
with no remaining turns finishes automatically after any current turn and required effects complete.

Minion addition is one squad per entry, default four, with plus/minus selecting any count 1–8;
optional captain is additional to eight. A new squad needs a new entry. Manual live splitting/merging
and refill through the add count are excluded; source-driven changes retain their own rules. Compute EV
proportionally from printed EV/quantity, preserving fractions. Saved counts are independent of live
casualties. Keep each minion’s identity, the squad pool and shared participation separate.

The captain uses normal actions on the shared turn; personal extra turns do not refresh the squad.
Global turn work fires once per actual turn, including one firing for a shared squad/captain turn.
Personal effects/saves still resolve for each affected creature. The game clock owns scheduled work;
abilities register effects with it rather than maintaining separate schedules.

Captain-bonus loss reduces squad Stamina without casualties; gain adds the bonus for surviving members
without revival. Later non-area damage exhausting the pool defeats the remaining ordinary squad,
subject to explicit exceptions. The area-only casualty rule remains intact. See
[the current minion contract](table-spec.md#minion-squads-and-captain-state) and
[the remaining cases](table-spec.md#8-continue-exploring).

### Characters, sharing and visibility

- Admission/full edits require Director review for other owners' characters. The active Director's own
  admission/full edits are logged without approval. Scoped level-ups need no review. All paths retain
  validation and combat locks.
- Outside combat, owners may edit names, appearance, biography and notes without review; withdraw an
  undecided submission; and detach their character without Director approval. The campaign owner can also
  remove individual characters or kick a player. Director status alone does not grant this power.
- Detachment preserves active build/level, authored details, inventory and personal history, clearing
  campaign values including XP/Victories. Pending edits survive privately without activation. Character
  duplication copies the active build, excluding pending edits, into independent owned data.
- Several same-campaign users can receive character grants at once. Grants include sheet and progression
  history reads and eligible table control, never build editing. Notes stay owner-private; personal inventory
  reads stay limited to owner and active Director. Session-scoped grants expire on closure; valid
  until-revoked grants can persist between sessions.
- Peers see Stamina and Recoveries by default. Table monster stat blocks are Director-only. Public reference
  access does not disclose private live table data.
- Monster-health display defaults to Bar; Numerical and Winded are alternatives. Fuller V1 only, deferred
  from v0.01: the Add visibility toggle defaults to hidden, persists per campaign, and also applies to
  template loads. Hidden foes remain active and may act; their names are not concealed in the game log
  under the current direction.
- Show Malice is a campaign setting, off by default, controlled by the active Director. The Director
  always sees the current shared pool; players/observers see it when enabled. Full used-action source
  disclosure and resource mechanics retain their existing rules.
- Rolls are public by default. Planned tower results are Director-only, including hidden from the roller.
  The tower interface and historical disclosure remain unresolved.

Formal Director test-request UI and its response modes/lifecycle are removed from scope for now.
The Director asks verbally; players roll directly from their character sheets, and the Director retains
acting authority. Record dice, modifiers and total. Calculate the outcome when difficulty or a source
outcome table is known; otherwise the Director interprets it. Source-specific test steps remain available
within their originating actions. Show test difficulty defaults off and governs known difficulty values
in all displayed entries, including history; per-test reveal remains deferred. Sheet/player pane uses the viewed character; log cards can act for another controlled character, with
a clear actor label before interaction and no required sheet switch. Explicit successful Take turn switches the invoking user's player pane to that character; other switching behavior remains open. Explicit `@Character` commands retain control permissions.

Confirmed 2026-09-13: applicable fixed ability costs are deducted automatically on execution; optional
pre-resolution enhancements use a choice card unless already supplied. Insufficient resources block
ability execution for players and Director invocations, as an explicit exception to ordinary rule
warnings. Evaluate source-legal payment, including waivers and permitted negative resources.

### Loot and history

Saved encounter rewards enter the common Director stash when the template is loaded. Starting combat or
finishing it never adds those rewards a second time. Template duplication does not load monsters or grant loot.

Visible stash items can be claimed by eligible players, inside or outside encounter wrap-up. Claims reserve
individual items; the Director may adjudicate and must approve before deposits occur. Observers cannot claim.
Hiding the stash cancels provisional claims, releases reservations, and prevents approval while hidden.
Unclaimed items remain in the same persistent stash. Previously completed deposits are not provisional claims.

Players may withdraw unapproved claims. Players cannot undo inventory changes; the Director can review, undo
and redo them. This is distinct from the campaign's default-on **Enable user undo** setting for gameplay:
players sequentially undo their character's uninterrupted latest actions up to the nearest seam, with
turn/FreePlay start as outer limits. Another character's action closes that window regardless of shared
controller. Director sequential rewind crosses character/turn seams within the current encounter; redo
restores the recorded path. Existing control/session policies apply. Committed Director corrections also create seams; the prior exception is superseded.

Finish cleanup, or Void after applying keep/reset, closes the encounter as a historical archive. Gameplay undo cannot reopen it or cross
that boundary, including for the Director within the same session. Archived events remain read-only;
new current-state adjustments do not rewrite them.

Corrections and undo append new entries without rewriting originals. Future interpretation/undo follows
the current branch's effective result. Manual damage overrides survive modifier edits until cleared;
undoing an adjudication restores the prior result while retaining the original ability use. Once later gameplay
has committed, everyone must rewind through the intervening chain before modifying an older
event. Director encounter rewind remains available; same-turn dependencies still need detailed contracts.

Retain structured source/actor/target identities, order, inputs, dice, outcomes, before/after state and
undo/redo/void disposition for later statistics. This requirement does not override deletion or privacy.

### Discovery, blocking, chat and deletion

Share codes/URLs locate request entry points; they do not grant friendship or campaign access. Owners can
regenerate both kinds anytime. Old codes/links become invalid; pending requests remain subject to normal
approval and block checks. Unlisted-by-default does not imply a v1 public-listing option.

One user-to-user block removes the target from campaigns owned by the blocker, prevents future admission
there, and revokes character shares in both directions. No separate campaign-ban feature exists. Unblocking
lifts the restriction but restores neither memberships nor shares. Where both users remain members of a
third-party campaign, their campaign-chat messages remain visible to each other.

Campaign chat and game logs are separate entities. Authors cannot edit/delete their sent chat messages.
Campaign deletion removes campaign chat and history; account deletion preserves username attribution in
other retained campaigns.

Campaign deletion needs no prior session closure and offers no combat keep/reset choice. It detaches and
preserves other users' characters while deleting campaign-owned logs, chat, foes, party inventory and stash.
User-owned saved encounters survive campaign deletion. Account deletion also deletes that user's own
campaigns, characters and saved encounters, even during active combat in another campaign.

## Remaining work before complete v1 play

1. **Respite and resource lifecycle:** research the pinned core rules, then define start/completion/interruption,
   reset/retention, rewards/advancement and required user choices. No downtime-project UI is required.
2. **Combat resolution and undo:** the active action-economy workstream must define source-expected
   operations, triggered actions, sequencing, partial/manual resolution, history dependencies and continuation
   after undo. Do not infer permanent behavior from the bounded experiment.
3. **State reconciliation:** settle live resources after build edits, progression restoration, detachment and
   duplication; and wrap-up deposits versus
   character-lock release. Void restore returns Director-panel foes/loot state to the combat-start
   snapshot; item/claim reconciliation must implement that confirmed scope. Campaign-deletion retention of current recorded state before detachment resets
   is still a proposal, not a confirmed default.
4. **Forced access changes:** implement loss of authorization promptly and define combat recovery when a
   participant is kicked, blocked, revoked or deleted. This is distinct from ordinary party-roster editing.
   Standalone void while paused and some early Director-removal transitions also need contracts.
5. **Coverage and interchange:** audit actual core source coverage, implement all core class choices through
   level 10, verify encounter difficulty/EV inputs and item mechanics, and demonstrate supported Forge Steel
   imports with unresolved data preserved without enabling excluded content.
6. **Application operations and delivery:** implement the selected Better Auth integration against regular
   account/reset/settings requirements; settle email integration later, retaining password-reset scope.
   Follow the tech spec for frontend recommendations, rendering, long-session performance, and hosting
   portability. Design shared operations and responsive web flows; clarify remaining historical/tower
   disclosure and outside-session stash eligibility. Preserve confirmed observer restrictions and private notes.
7. **Integration acceptance:** connect account creation, code-based admission, character review, template
   loading, free play/combat/respite, loot, session closure and the next session through the same authorized
   headless operations used by the UI. Check multiplayer access/retry behavior and sustained table performance
   during implementation.
8. **Design tokens and component library:** the [V1 mockups](design-mockups/v1/README.md) fix the
   desktop visual design: the visual language (typography, achromatic foundation, brick-red accent, rules,
   uppercase metadata) and, confirmed 2026-09-15, the layouts, proportions and display mechanics. Tokens
   were delivered by A08; layout fidelity is the V21 slice. The mockups' recorded departures from the
   specifications must not be implemented.

Detailed technical contracts remain proposals where labeled. Source-backed opening and group findings are
recorded in the table spec; this checkpoint is not an implementation, deployment or completion report.
