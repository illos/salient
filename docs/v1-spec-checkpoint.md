# V1 specification checkpoint

Consolidated 2026-09-11 after the product walkthrough and consistency pass. This is a documentation checkpoint,
not an implementation milestone or approval of proposed technical defaults.

## Readiness

The main product boundaries are now defined well enough to organize v1 implementation into workstreams.
The app is not yet fully specified for end-to-end play: respite rules, detailed combat resolution, state
reconciliation, and several lifecycle operations still need work. Do not treat readable core-content coverage
as complete automation, or the existing headless experiment as a finished application.

The [original gap review](v1-spec-review.md) is historical. Use this checkpoint and the linked primary specs
for current decisions; the original review's unresolved scope questions are not an instruction to ask them again.

## Release scope

| Area | Included in v1 | Deferred or excluded |
| --- | --- | --- |
| Delivery | Online-first web app optimized for mobile; headless/shared game operations | No native-app plans; full offline operation is not required |
| Rules content | Core rulebooks; every core class through levels 1–10; searchable Rules, Foes, and Items references | All official supplements, including Summoner/Beastheart and associated mechanics; homebrew monsters/options/items |
| Play | Free play, combat, dedicated respite; readable rules and recorded manual resolution where automation is incomplete | Dedicated montage/negotiation flows, downtime projects, nested structured activities |
| Characters | Creation, advancement, full edits, progression history, sharing, detachment/duplication, Forge Steel import | Forge Steel export implementation; preserve the model/adapter data needed to add it without a rewrite |
| Encounters | Private user-owned templates, duplication, monsters/counts, remembered party-strength calculator, prepared rewards | Template sharing and other authored encounter content |
| Inventory | Individual item instances, equipped/unequipped state, character/party inventories, persistent Director stash and approved claims | Item stacks, direct character-to-character transfers, player-created/free-text items, standalone saved stashes |
| Accounts/social | Account settings, friendship, user blocking, regenerable personal/campaign share codes and URLs | Username search, public campaign directory, app admin-dashboard functionality |
| Messaging | Campaign chat; requests appear in the relevant UI; password-reset email | All notifications, private direct messages, author editing/deletion of sent chat messages |
| History | Detailed gameplay/inventory/progression records; data sufficient for future statistics | Statistics dashboards, Slain table UI, reference bookmarks |
| Campaign lifecycle | Owner deletion; unlisted campaigns by default | Campaign archiving, ownership transfer, public-listing controls |

Public reference coverage remains broad within core sources, even for excluded dedicated gameplay flows.
The core source audit must distinguish eligible retainers/companions/summons from supplemental entries.
General engine/parser/pack architecture can support future content without exposing it as a v1 feature.

## Primary specifications

| Topic | Authoritative checkpoint |
| --- | --- |
| Session, table, foes roster, combat lifecycle, visibility and undo | [Table](table-spec.md) |
| Accounts, roles, discovery, grants, privacy, blocking and deletion | [Accounts and access](accounts-and-access-spec.md) |
| Build choices, revisions, admission, progression and interchange | [Character wizard](character-wizard-spec.md) |
| Inventory, stash, claims and inventory history | [Inventory](inventory-spec.md) |
| Core/supplemental source scope and readable coverage | [Reference libraries](reference-library-spec.md) |
| Catalog ingestion, independent monster instances and encounter preparation | [Monster catalog](monster-catalog-spec.md) |
| Ownership/lifetimes, journals, storage, archives and future statistics | [Data architecture](data-architecture-spec.md) |
| Standalone rules engine and optional visual dice | [Engine architecture](engine-architecture.md), [dice roller](dice-roller-spec.md) |

## Settled boundaries to preserve

### Sessions, roles and rosters

A campaign has one active session, including while paused. Connection loss never pauses or closes it.
Closing a session with active combat voids that encounter with the keep/reset choice and no normal rewards.
Pausing preserves the same encounter indefinitely. Closed sessions are permanently read-only in v1.

The campaign owner and active Director are distinct. When a session-only Director appointment ends, the
owner resumes; a prior standing Director does not automatically resume. Blocking or deleting the active
Director's account also returns control to the owner in a retained campaign.

| Operation | Confirmed boundary |
| --- | --- |
| Director changes session players/selected characters | Whenever no combat encounter is active, including while paused |
| Director adds/removes foes or loads saved encounters | Any time: between sessions, while paused, or during combat |
| Gameplay actions and resource spending | Running session and applicable core rules; pause blocks gameplay |
| Ordinary character/build edits | Locked during combat, including while paused |
| Character-data inventory management | Available between sessions/while paused, subject to combat character locks and item permissions |
| Campaign observer | May read the permitted table and campaign chat; cannot perform session actions or claim stash items |

The roster-management rules supersede older restrictions requiring a running/open session to manage foes.
They do not authorize gameplay while paused or changing a closed session's records.

Players can take turns with eligible owned/shared characters. The Director can perform any player table
operation on their behalf. Character progression remains a separate owner-controlled track. Detailed
concurrent action, triggered-action and undo dependencies remain deferred to the resolution workstream.

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
- Monster-health display defaults to Bar; Numerical and Winded are alternatives. The Add visibility toggle
  defaults to hidden, persists per campaign, and also applies to template loads. Hidden foes remain active
  and may act; their names are not concealed in the game log under the current direction.
- Rolls are public by default. Planned tower results are Director-only, including hidden from the roller.
  The tower interface and historical disclosure remain unresolved.

### Loot and history

Saved encounter rewards enter the common Director stash when the template is loaded. Starting combat or
finishing it never adds those rewards a second time. Template duplication does not load monsters or grant loot.

Visible stash items can be claimed by eligible players, inside or outside encounter wrap-up. Claims reserve
individual items; the Director may adjudicate and must approve before deposits occur. Observers cannot claim.
Hiding the stash cancels provisional claims, releases reservations, and prevents approval while hidden.
Unclaimed items remain in the same persistent stash. Previously completed deposits are not provisional claims.

Players may withdraw unapproved claims. Players cannot undo inventory changes; the Director can review, undo
and redo them. This is distinct from the campaign's default-on **Enable user undo** setting for gameplay:
players can undo their own actions to the start of their turn; Director undo/redo remains available.

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
2. **Combat resolution and undo:** the explicitly deferred action-economy workstream must define legal
   operations, triggered actions, sequencing, partial/manual resolution, history dependencies and continuation
   after undo. Do not infer permanent behavior from the bounded experiment.
3. **State reconciliation:** settle live resources after build edits, progression restoration, detachment and
   duplication; void/reset after mid-combat roster changes or template rewards; and wrap-up deposits versus
   character-lock release. Campaign-deletion retention of current recorded state before detachment resets
   is still a proposal, not a confirmed default.
4. **Forced access changes:** implement loss of authorization promptly and define combat recovery when a
   participant is kicked, blocked, revoked or deleted. This is distinct from ordinary party-roster editing.
   Standalone void while paused and some early Director-removal transitions also need contracts.
5. **Coverage and interchange:** audit actual core source coverage, implement all core class choices through
   level 10, verify encounter difficulty/EV inputs and item mechanics, and demonstrate supported Forge Steel
   imports with unresolved data preserved without enabling excluded content.
6. **Application operations and delivery:** select auth using regular-account/reset/settings requirements;
   design shared operations and mobile web flows; clarify remaining historical/tower disclosure and
   outside-session stash eligibility. Preserve confirmed observer restrictions and private notes.
7. **Integration acceptance:** connect account creation, code-based admission, character review, template
   loading, free play/combat/respite, loot, session closure and the next session through the same authorized
   headless operations used by the UI. Check multiplayer access/retry behavior during implementation.

Detailed technical contracts remain proposals where labeled. No implementation, deployment or new rules
research is claimed by this checkpoint.
