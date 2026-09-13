You are never to use the multiple-choice question widget, ever under any circumstances; ask questions in plain
text.

# Project instructions

## Communication

- Ask questions directly in the conversation using plain text. Do not use question widgets or structured
  question tools.
- Make reasonable implementation decisions within the user's authorized scope. Ask only when missing
  information materially affects the work.
- Distinguish confirmed requirements from proposals and assumptions.
- Current specification exploration follows the user's latest request: batch design questions in groups of
  three, using plain text and a recommendation for each. This supersedes the earlier one-question-at-a-time
  and groups-of-six preferences. Track answers in [the pre-alpha clarification queue](docs/pre-alpha-design-gaps.md).
- The discussion has resumed with a rules-review workflow accepted for trial and confirmed rules-adaptation
  philosophy. Read [the principles](docs/rules-adaptation-principles.md) and
  [the development process](docs/development-process.md). The user selected a dedicated rules/combat thread
  to work with them and a separate thread to read the specs, build and review the ordinary web app. Follow
  [the build handoff](docs/web-app-build-handoff.md); independent app work can proceed while combat contracts
  are designed. General warn-without-blocking policy is settled, with the confirmed insufficient-resource
  exception: unaffordable abilities cannot execute. Do not start another thread merely by
  recording this handoff or invent unresolved combat behavior to finish an app screen.
- Rules-research recommendations and the user's rulings remain separate records. Rulings apply only to their
  original cases, with no automatic precedent. Explicit case-specific product choices may depart from the
  design guidelines for taste; do not count those choices as researcher errors or generalize them. See
  [the skill design](docs/rules-skills-design.md#confirmed-isolated-decisions-no-automatic-precedent).

## Current specification checkpoint

Read [the pre-alpha clarification queue](docs/pre-alpha-design-gaps.md) and
[the v1 checkpoint](docs/v1-spec-checkpoint.md) before resuming product exploration. The immediate target is a
v0.01 pre-alpha architectural foundation; complete subsystem coverage is not automatically a milestone gate.
The first journey is campaign creation/invitation, session start, one foe and a level-one hero loaded, and
basic combat action economy with a visible game log. Character entry uses a minimal level-one devil Fury
wizard covering all applicable creation steps, with one supported option/set per step acceptable. The
pre-alpha checkpoint consolidates accepted inclusions/deferrals; the V1 checkpoint records the fuller product.
The original gap review is historical. Do not ask settled questions again. Documentation cleanup does not
authorize implementation or convert proposals into requirements.

The rules/combat baseline precedes the tooling pilot or implementation slice. Its current design is
checkpointed on 2026-09-13. Opening commitment, group transfers/handoffs, mapless targeting and persistent
area cards, requested tests, resource affordability, clock defaults and history boundaries are confirmed.
Remaining source-specific response sequencing and same-turn dependencies are next; do not reopen settled
questions from the chronological decision record.
Use [table decisions and remaining contracts](docs/table-spec.md#8-continue-exploring) and
[rules status](docs/workstream-rules-status.md). Initiative groups cover both sides; playable retainers and
friendly monsters are deferred beyond V1, with an extension path preserved. Readable core references remain
separate from playable support.

For v0.01, focus on desktop; all current UI is temporary and proves concepts/workflows. Finished visual polish
and mobile/tablet layouts are not prototype gates. Preserve shared behavior behind the replaceable UI and the
table-performance priority; the broader mobile-optimized product goal below remains for later.

## Product intent

Build a mobile-optimized, online-first **web-only** Draw Steel companion for phones, tablets, and desktop that
works independently of a digital battle map. There are no native-app plans. Convex is the chosen app backend;
the engine's long-term language and runtime remain independent decisions. The UI is being developed in another
thread; do not claim that work is implemented in this checkout without evidence.

The [pre-alpha checkpoint](docs/pre-alpha-design-gaps.md) controls immediate milestone scope; the
[v1 checkpoint](docs/v1-spec-checkpoint.md) indexes the fuller product. Requirements below for deferred features
remain future design, not prototype gates. Primary specifications retain detailed authority:
[table](docs/table-spec.md), [access](docs/accounts-and-access-spec.md),
[characters](docs/character-wizard-spec.md), [inventory](docs/inventory-spec.md),
[catalog](docs/monster-catalog-spec.md), [references](docs/reference-library-spec.md),
[data](docs/data-architecture-spec.md), and [tech stack](docs/v1-tech-stack-spec.md). Keep those documents current
rather than accumulating duplicate decisions here. The original [gap review](docs/v1-spec-review.md) is historical.

### V1 scope

- Core rulebooks only; every core class through levels 1–10. Summoner and Beastheart are official supplemental
  content, not core, and are excluded with their associated mechanics. All other official supplements and
  homebrew monsters/options/items are also excluded. Compendium presence and official provenance do not imply
  v1 inclusion.
- Public searchable Rules, Foes and Items references include eligible core retainers/companions/summons and
  items even when not fully automated. Source coverage and automation coverage are separate.
- Free play, combat and a dedicated respite loop are included. Montage/negotiation flows, downtime projects
  and nested activities are deferred. Respite needs source research before detailed design.
- Character creation, advancement, full edits, progression history, sharing, detachment/duplication and Forge
  Steel import are included. Export is not required in v1; preserve the information and adapter boundary
  needed to add it without rewriting the system.
- Private saved encounters support duplication, monsters/counts, a remembered party-strength calculator and
  prepared reward items. No other authored encounter content or template sharing is required in v1.
- Character/party inventories and a provisional single persistent Director stash are included. No item stacks,
  free-text/custom items, player item creation, direct character-to-character transfers or standalone saved
  stashes. Starting equipment belongs to character creation; later loot uses approved stash allocations.
- Campaign chat is the only messaging surface. Authors cannot edit/delete sent messages. No direct messages,
  notifications, bookmarks, public campaign directory, admin dashboard, campaign archiving or ownership
  transfer in v1. Password reset is the only email flow to design. Preserve relevant history for future
  statistics, but statistics/Slain-table dashboards are deferred.

### Table and authority boundaries

The campaign is the day-to-day hub. It contains sessions, with only one active session including pauses.
Connection loss never changes session lifecycle. The Director starts/pauses/ends sessions and selects campaign
members to play; selected players choose one or more owned/shared characters. Campaign members can observe and
chat, but observers cannot perform session actions or claim stash items.

Party-roster changes are allowed whenever no combat is active, including while paused. **The Director can
change the foes roster at any time**, including between sessions, while paused and during combat;
saved-encounter loading follows that policy. Do not reintroduce the superseded open-session or pause
restrictions. Gameplay actions still require a running session. Closed sessions remain permanently read-only.

Combat locks the party roster and ordinary character edits, including drafts, progression and build
activation. Encounter operations immediately update the main sheet; the precombat snapshot is for
history/void-reset, not a second editable sheet. Void offers keep-current or restore-starting-state and skips
ordinary rewards/cleanup. Closing a session with active combat invokes that void choice; pause preserves
combat indefinitely. Campaign deletion has its separate no-prompt policy.

Anything a player can do at the table, the Director can also do, including Take turn and acting for a
character without an owner share or disconnect prerequisite. Progression is a separate track: build choices
stay with the character owner. Existing-player takeover requires a valid prior share to that specific user. No
exclusive-controller lease is established.

Campaign ownership and active Director are distinct. Session-only Director expiry returns authority to the
owner, not a prior standing Director. Owner blocking of the active Director or that Director's account
deletion also returns control to the campaign owner. Ordinary early removal and forced combat recovery still
need detailed contracts.

The foes roster retains live instances across encounters/sessions until removed. Hidden foes are active;
hiding suppresses the roster entry, not its actions. Their names currently remain visible in the game log. Add
visibility defaults to hidden, persists per campaign and applies to saved loads. Monster stat blocks are
Director-only at the table; health display defaults to Bar, with Numerical and Winded alternatives. Verify
Winded against the source (the pinned rule includes exactly half maximum Stamina). Current roster EV includes
all undefeated foes, hidden or outside combat; defeated entries stop contributing immediately. Normal cleanup
removes defeated foes; void skips that cleanup. Verify difficulty/EV formulas and roster-reset dependencies
rather than inventing them.

### Characters, privacy and inventory

Characters stay user-owned and attach to at most one campaign. Character owners and campaign owners can detach
them; campaign owners can kick players or individual characters. Director status alone grants no detachment
authority. Detachment retains level, active build/history, authored details, inventory and personal inventory
history, clearing campaign XP/Victories. Pending edits survive privately; duplication copies the active build,
excluding pending edits. Entry level is capped by current level and uses the corresponding progression build,
not just a changed level number. Live-resource reconciliation remains open.

Admission/full edits require Director review for others' characters. The owning active Director's changes are
logged without approval. Scoped level-ups are not review gated. Outside combat, owners may edit
names/appearance/biography/notes without review, detach without Director approval, and withdraw an undecided
review. Combat locks still apply.

Multiple same-campaign character grants may coexist and include progression-history reads and eligible table
control, never build editing. Notes remain owner-private, including from Directors. Personal inventory reads
remain owner/active-Director only. Peers see Stamina and Recoveries, not full sheets by default. Valid
until-revoked grants can persist between sessions; session-scoped grants expire on closure. Ordinary dice
results are public; planned tower results are Director-only, including hidden from the roller. Historical
secret disclosure and richer content-sharing UI remain unsettled.

Inventory management is character data, not an exception to the gameplay-action block. Authorized
character/party transfers work between sessions and while paused unless the character is combat-locked.
Players can discard from their own or party inventory, but cannot return items to the stash. The Director can
directly edit character inventories subject to the lock. Inventory history permits Director undo/redo, not
player undo; owners retain their personal inventory history after departure while party-history reads follow
current campaign membership.

Saved rewards enter the persistent stash at template load, never again at combat start/cleanup. Visible stash
items support provisional claims by eligible players; one claim reserves each individual item. Director final
approval deposits items, including through normal encounter wrap-up. Unclaimed items stay in the stash. The
Director can change stash contents anytime. Hiding cancels provisional claims and prevents approval; observers
cannot claim. Detailed outside-session eligibility and lock-release/finalization ordering remain open.

### Social access and deletion

User/campaign share codes and URLs replace username search and public discovery. Owners can regenerate either
anytime; old codes/URLs stop working while pending requests remain. Requests surface in the relevant UI
without notifications. Friendship initially grants no content access.

There is one user-to-user block and no separate campaign-ban feature. It removes the target from blocker-owned
campaigns, prevents new admission there, and revokes character shares both ways. Unblocking lifts the
restriction but restores neither memberships nor shares. Campaign chat remains visible where both users remain
members of a third-party campaign. Do not restore access through gameplay undo.

Campaign deletion removes campaign chat/logs/foes/party inventory/stash while detaching and preserving others'
characters. It requires neither prior session closure nor a combat keep/reset prompt. Retaining current
recorded character state before detachment resets remains a proposed default. User-owned saved encounters
survive campaign deletion. Account deletion deletes that user's campaigns, characters and saved encounters
even during active combat elsewhere; other retained campaigns keep actions/chat attributed to the username.
Forced combat recovery remains unresolved, not grounds to defer access invalidation.

### Engine and history intent

Follow [rules adaptation principles](docs/rules-adaptation-principles.md): automate faithfully, show the
source and actual work, and trust the table. Game-rule conflicts warn players and Directors without blocking
eligible play or requiring routine Director preapproval, except that an ability whose resource cost cannot
be paid must be blocked (confirmed 2026-09-13). Check source-legal affordability, including waivers and
permitted negative resources, in shared execution for players and Director invocations. Fixed applicable
costs are deducted automatically on execution; optional pre-resolution spending uses a choice card unless
already supplied. See [ability costs](docs/table-spec.md#ability-costs-and-optional-spending).
The Director has final game-adjudication authority;
mechanical inputs and effects support recorded manual adjustments. Missing facts/unsupported mechanics are
explicit uncertainty, never invented automatic outcomes. Every used action exposes its complete verbatim
source text through the shared game log; full monster stat blocks remain Director-only. Account permissions,
private data and session lifecycle retain their separate policies. Manual play is supported from v0.01.

Keep a client-independent deterministic rules engine with full spatial-rules understanding as its intended
capability. The mobile web app is one client; future map clients and possibly physical-map observation can
consume the same structured outcomes. A potential Minecraft-like game motivates portability, not a current
implementation task. Full spatial support must not require every client to have a digital map or invent
missing spatial facts.

Both engine and app game operations must work headlessly. CLI and UI use the same operations to load actors,
run actions, inspect persisted changes and replay history. Verify rule interpretation and actual state
application separately. The table UI will iterate substantially and must not gate the headless workflow.

The user confirmed the [registered-action and action-card contract](docs/table-spec.md#confirmed-action-and-log-contract)
as table policy. Every table UI button has a registered action accessible in the command palette. Buttons,
slash commands, game-log controls and action cards use the same shared operations with headless access.
All table activity receives discrete ordered log entries; user-initiated operations carry actual user attribution
separately from acting-character identity. Mid-operation input/adjudication and cross-user action requests
at the table surface as user-aware action cards. Preserve existing privacy audiences and lifecycle boundaries.
The user explicitly scoped this pattern to the table, not the rest of the app. Table UI must follow this contract,
without inventing unresolved mechanics or implying that the registry/cards are already implemented.
Use the [formal command design](docs/table-command-spec.md) and its rules/grammar research for integration.
Guided cards can collect complex options from a short command; table-state actions are also registered.
The human syntax baseline is accepted: optional `@Character`, `/family verb`, and named arguments, with
quoted names and target lists. Detailed operation/API schemas remain proposed; research coverage does not
expand prototype scope.

Partial automation is an intended playable mode: show full ability text and distinguish applied, manually
resolved and unresolved effects. Record manual corrections, preserve dependencies and prevent double
application when automation resumes. Dice generation is pseudorandom and shared; optional visual physics
presents accepted results, never decides them.

The game log records initial values, modifier inputs/outputs and resulting state changes. Corrections and
undo append new entries without rewriting the original; future interpretation/undo uses the effective
result on the current history branch. Once the next individual turn starts, modifying any prior-turn event
requires undoing through intervening history first, including Director edits (confirmed 2026-09-13).
Director adjudication cannot bypass that boundary. Current-event continuations remain distinct from
historical edits. Undo/redo restores recorded state without rerunning rules/dice. All current campaign members can read past session logs
regardless of attendance; private notes/live tower policies remain separate. Compressed closed-session history
remains readable, never a route to reopen gameplay. Campaign chat has its own lifetime.

Standing clock policy explicitly confirmed by the user: at a boundary, resolve due work in enqueue order
with save-ends rolls last. Include all applicable save-ends effects applied before the final save phase
begins, unless their source specifies otherwise. This is an explicit standing app policy, not an inferred
precedent from a case ruling; preserve source timing and special save replacements. See
[the game-clock contract](docs/table-spec.md#game-clock-and-scheduled-rules-work).

Players can undo their own actions back to combat turn start or the beginning of the current FreePlay
stretch, under existing control/session/dependency policies, and redo their own undone actions. Director
undo/redo remains available throughout the current encounter. **Enable user undo** defaults on and governs
gameplay, not inventory. New gameplay after undo clears redo availability while retaining abandoned history
and boundary stamps. Source-specific triggered timing, conditional spending, manual-resolution sequencing
and remaining same-turn dependencies still need contracts. Do not settle them through incidental UI or
storage choices.

Build toward parsing supported Draw Steel stat-block language into a reusable rules interpreter; arbitrary
natural-language comprehension is not implied. General homebrew/pack/parser capability is future architecture,
not v1 authoring scope. This hobby project has limited human time: avoid vocabulary bans, per-rule approval
queues, source-hash proof systems and process frameworks as substitutes for behavior. Source references locate
evidence; they do not prove semantics. Prefer meaningful examples and executable coverage reports.

## Development approach

- During pre-alpha foundation work, development data is disposable and the priority is the latest live,
  playable app. Reset/reseed may replace migrations across breaking development updates. Separate branch
  development comes once there is a working app to protect. Follow
  [the development policy](docs/development-process.md#confirmed-pre-alpha-development-policy); normal runtime
  persistence and deliberate vendored-source updates remain in force.
- Use [the dice roller specification](docs/dice-roller-spec.md) for optional 3D presentation of accepted
  shared/CLI results. Visual physics never determines gameplay values; the animation technique remains
  proposed.
- Use [the data architecture](docs/data-architecture-spec.md) for current state, shared content, journals,
  session archives and future statistics. Its concrete schemas/storage contracts remain proposed.
- The general [pack architecture](docs/data-architecture-spec.md#31-common-pack-contract--proposed) supports
  portable official/community/private content, but v1 enables only eligible core sources. Disabling a pack
  preserves existing characters' use of and advancement within content they already have. Release pinning,
  precise progression/source permissions and private-pack sharing remain proposed/open. Keep engine releases
  distinct from content releases; compatibility ranges and runtime retention are not settled.

- Use [the accounts and access specification](docs/accounts-and-access-spec.md) for the detailed access
  contract. **Better Auth is selected** through its Convex integration; the prior Convex Auth preference is
  superseded. Email integration and future LAN recovery remain deferred decisions. Preserve the distinction
  between confirmed requirements, proposed implementation contracts and unresolved policy. Specification work
  is not backend/deployment authorization.
- Use [the v1 tech stack](docs/v1-tech-stack-spec.md) for recommended frontend libraries, table realtime and
  sustained-session performance, optional SSR, and Cloudflare/Convex hosting with future LAN portability.
  Retain its distinction between confirmed choices and recommended defaults; the engine runtime stays open.
- Use [the character wizard specification](docs/character-wizard-spec.md) as the primary implementation
  reference for creation, advancement, full edits, progression history, campaign review, and interchange. It
  distinguishes confirmed requirements, proposed implementation contracts, and remaining decisions. Keep it
  current when character requirements change; foundation/research notes remain supporting evidence.
- Character creation and full editing use the main wizard with foundational choices and access to all
  levels/options. A scoped level-up wizard uses the same decision system for only the character's
  level-transition choices. Campaign admission and full edits require Director review/approval except for the
  owning active Director's logged changes; pending full edits leave the effective campaign build unchanged.
  Scoped level-ups are not review gated. The user makes choices; the Director approves a revision, not
  replacement choices. See
  [wizard modes and review](docs/character-wizard.md#wizard-modes-and-campaign-review). This is a
  user-requested product workflow, distinct from development-time approval processes.
- Project-authored application code is GPLv3 (`GPL-3.0-only`); see `LICENSE` and `THIRD_PARTY_NOTICES.md` for
  the distinction from upstream software, game content, and artwork.
- Forge Steel is a pinned Git submodule at `vendor/forge-steel`. Keep it unmodified and do not advance its pin
  automatically. For the character workstream, use its progression/choice structure as a reference while
  keeping Steel Compendium as the intended rules-content source. Our UI and character model
  remain independent design decisions. See [wizard foundation](docs/character-wizard.md) and
  [dependency guide](docs/forge-steel.md).
- Preserve the ability to import Forge Steel hero data files when designing our character model; exporting
  compatible files is also desired. Treat this as an interchange adapter, not a requirement to adopt Forge
  Steel's internal model. See [file-format research](docs/forge-steel-interchange.md) for nested selections,
  runtime state, and import refresh behavior that can affect round trips.
- Character model direction: a decision matrix/tree supplies the build, supplemented by authored
  descriptions/flavor and inventory, with a derived stats/abilities layer and changeable play values. Keep the
  derived baseline distinct from current resources, conditions, and adjustments so recalculation does not
  reset play state. The proposed dependency-graph representation and remaining state decisions are recorded in
  [wizard foundation](docs/character-wizard.md#character-model-direction).
- Character progression needs its own restorable history, like the game log: restore any previous recorded
  decision point (for example level-7 Shadow back to their level-3 build), including the choices and stats
  derived from them, while retaining present inventory. This is not a whole-character or encounter rewind. See
  [progression rollback](docs/character-wizard.md#progression-history-and-rollback); live-resource
  reconciliation and new choices after rollback remain open.
- Steel Compendium is a pinned Git submodule at `vendor/steel-compendium`. Keep upstream files unmodified;
  consult [the dependency guide](docs/steel-compendium.md) to inspect or adopt updates. Do not automatically
  advance the pin during builds or startup.
- Use [the Compendium navigation guide](docs/compendium-navigation.md) to find definitions, follow rule
  references, and recover sourcebook context before implementing mechanics.
- Establish a clear, durable development process suitable for sustained agent-driven work.
- Keep requirements, architectural decisions, rules sources, and acceptance criteria in the project so later
  work can build on them.
- Verify Draw Steel mechanics against identified, versioned sources rather than inferring them from D&D or
  memory.
- Never search online for Draw Steel rules answers, rules ambiguities, or any other Draw Steel content. The pinned local Compendium at `vendor/steel-compendium` is the only permitted research source; if it does not resolve a question, report the uncertainty rather than consulting external sources. This restriction also applies to delegated research agents.
- Track permissions and attribution separately for game content, third-party application code, and artwork.
- Treat community data as an input requiring validation; do not equate successful import with complete or
  correct rules support.
- Keep proposed architecture and technology choices explicitly provisional until settled.
- Keep CLI and app UI progress coordinated. The user is developing the UI in another thread; keep game
  behavior in shared operations, communicate contract changes, and use playtest findings to inform both
  clients rather than growing a separate CLI product.
