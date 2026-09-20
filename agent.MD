You are never to use the multiple-choice question widget, ever under any circumstances; ask questions in plain
text.

# Project instructions

All feature work follows the [programmatic headless completion gate](docs/build/README.md#programmatic-headless-completion-gate):
prove the supported CLI/API route before browser acceptance. No feature is complete without it.

Every implemented trait or feature must be checked against the pinned Compendium for granted
abilities, including actions embedded in prose or dependent on choices/play state. Build those
actions in the appropriate UI list and shared CLI/API route, retain the granting trait, and prove
conditional availability and persisted changes. Trait text alone is not completion. Follow the
[trait-granted ability gate](docs/build/README.md#trait-granted-ability-completion-gate).

## Browser testing moratorium — 2026-09-20

The user deprecated all browser (Playwright) testing for the time being, site-wide, until
[V66 browser test harness repair](docs/build/V66-browser-test-harness-repair.md) is implemented.
V66 is registered but not started; do not claim it without the user's go. Verification is
headless CLI/API only under the [gate](docs/build/README.md#programmatic-headless-completion-gate);
a missing browser run is not a blocker. Log would-be browser scenarios in the
[browser coverage backlog](docs/build/browser-coverage-backlog.md) for a later pass. Headless
tests prove the app at the logical level; browser tests are only the final visual spot check that
the UI is not badly broken. Read [the moratorium](docs/build/README.md#browser-testing-moratorium--2026-09-20)
and [the audit](docs/build/audits/2026-09-20-browser-testing-failures.md).

## Character restart — 2026-09-19

The user permanently abandoned the entire Opus pilot. Its code, tests, fixtures, research and
processes must not be reused. See [the dead-end decision](docs/decisions/2026-09-19-opus-pilot-dead-end.md).
Keep the Opus fleet and old `characters` environment stopped. Earlier delivered code and the V45
foundation remain intact. The replacement [Astra workflow](docs/build/astra-character-workflow.md)
and [fresh-session handoff](docs/build/character-restart-handoff.md) are staged; staging does not
restart implementation. Future character work uses fresh Astra subagents and current main.
Every test must justify its existence through a concrete failure it catches and coverage it adds;
reject implementation-mirroring assertions, redundant tests and test-count targets. Apply the
[test value policy](docs/build/README.md#test-value) in implementation and review.

## Separate runtime rollout — 2026-09-16

The [remote development runbook](docs/remote-development.md) owns the Salient pilot adapter and
cutover status. Main data is now on CT114 with matching record/credential fingerprints, and the
identified superseded local processes are stopped. Isolated validation passed 433 check-suite
tests and all 22 real HTTPS browser tests. Main also passed reboot recovery with the same HTTPS
URL, data and credentials. The actual Salient provider-session broker check passed on 2026-09-16:
`presidium-ssh dev-runtime id` and `presidium-dev status` both succeeded. Human existing-account
sign-in remains pending.

Local and remote (CT114) are both valid test environments. Use whichever is free and suitable
for the required test; do not wait for a remote slot when the same proof can run locally.
Coordinate workloads per host/environment, preserve existing data, and record the actual source,
runner location and application target with results. The browser moratorium applies everywhere.
Use `presidium-dev` and `presidium-ssh dev-runtime` for CT114. See
[the runbook](docs/remote-development.md#choosing-a-test-environment).

This user decision (2026-09-20) supersedes the former remote-only restriction for test workloads,
including the builds, dependencies and isolated services needed to run them. It does not relocate
the shared playable app or authorize replacing its data. Reuse a compatible running environment;
name concurrent isolated environments explicitly. Do not start a stack automatically for every
provider or revive abandoned pilot environments or protected rollback copies.

## Post-v0.01 development checkpoint — 2026-09-15

The user confirmed five development tracks: parser/rules engine, foe coverage, characters
(wizard/sheets/progression), UI/polish, and app/social features. Read the
[durable roadmap](docs/v1-roadmap.md), [track kickoff](docs/kickoff-development-track.md), and
[build process](docs/build/README.md) before new implementation. The
[acceptance record](docs/build/evidence/v001-acceptance.md) closes the recorded prototype scope;
older instructions below to finish the shared-basics walkthrough describe that milestone, not a global
ban on assigned post-prototype mechanics. V1 exclusions and unresolved product/rules decisions still apply.

Character and foe coverage can advance with correct supported data/calculations and explicit manual
gameplay effects while automation develops. Use separate worktrees for active tracks, short-lived slice
branches, and isolated development backends for backend changes. Keep `main` integrated and tested;
coordinate updates to the user's playable environment. UI feedback may wait for desktop time; concrete
reports, screenshots and phone discussion support independent work elsewhere. Continue authorized work
that does not depend on pending answers. The roadmap records confirmed organization and recommended
first assignments separately; use bounded build slices rather than implementing an entire track at once.

## Merge completion directive — 2026-09-16

When the user asks to merge, complete both Git integration into `main` and the update of the
established shared playable development environment, including affected backend functions/schema,
content and frontend. This is standing authorization for those routine development updates; do not
ask for a second deployment confirmation. Verify the actual target and the changed behavior in the
running app before reporting the merge complete. Keep ownership coordinated through Chords.

Follow [the merge completion procedure](docs/build/README.md#merge-completion-includes-the-playable-app).
A successful Git merge with a pending or failed runtime update is incomplete; record the blocker and
continue the authorized work. Preserve existing play data where compatible. This directive does not
choose a new hosting target or authorize external publication/production deployment. Documentation-only
changes can record that no runtime update is needed. An explicit user request for a code-only merge
can override this default.

## Communication

- Ask questions directly in the conversation using plain text. Do not use question widgets or structured
  question tools.
- Make reasonable implementation decisions within the user's authorized scope. Ask only when missing
  information materially affects the work.
- Distinguish confirmed requirements from proposals and assumptions.
- v0.01 scope review concluded, 2026-09-14: the user is satisfied with the current shared-basics
  scope and wants the building agent to ask concrete questions as they arise during implementation.
  This supersedes the earlier instruction to keep a continuous specification questionnaire flowing.
  Use [the pre-alpha checkpoint](docs/pre-alpha-design-gaps.md) and [build handoff](docs/web-app-build-handoff.md).
  Make routine engineering decisions and research ordinary rules in the pinned source. Ask only when
  a concrete unresolved behavior materially affects the build, one plain-text question with a
  recommendation. Record the answer in the owning spec. Do not reopen settled scope or broaden into
  class/monster-specific feature work. This completes scope review, not implementation, verification
  or all fuller V1 design.
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

Current priority, 2026-09-14: **game basics first**. Establish and test common table operations before
class/stat-block-specific execution. Unique resource grants/thresholds, traits, triggers and ability
effects are manually resolved from source text in v0.01; the earlier automatic turn-start Ferocity
requirement is superseded. Stop the feature-by-feature Fury/Goblin automation questionnaire. Keep
the confirmed G4 shared systems, common Malice lifecycle, persistent numeric editing/manual-adjustment
log entries, Stamina/winded, ordinary-foe Slain status and history. The minimal wizard and sourced
build/initial-state contracts remain separate requirements. Next is a common-operation acceptance
walkthrough through shared UI/headless paths, with actual persisted state and history. See
[the current runtime scope](docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope).
Foe hiding is deferred beyond v0.01: all loaded foes are visible, with no hide/reveal or Add visibility
controls. Full stat blocks remain Director-only; health display and Malice visibility remain separate.
The fuller V1 hidden-foe design below is future scope; audit F2 is closed for the prototype.
Condition tracking in v0.01 is one logged on/off toggle per condition: players on their own
controlled heroes, Director on all heroes/foes. Earlier manual source/duration/application UI
is superseded; ability-based expiry follows parser support. Saves for these toggles use ordinary
dice controls and manual removal; automatic save scheduling/removal waits for ability support.
The shared clock remains included. Do not infer timers from toggles.
Hero tokens, including the shared counter, are deferred beyond v0.01. The user reaffirmed that
this review must stay on shared basics, with no class- or monster-specific feature work yet.
Do not interpret acceptance of a generic counter as authorization to design or implement its
class/monster-specific granting features.
TypeScript is the standing engine-language choice, reaffirmed 2026-09-14, for v0.01 and beyond.
Keep it unless a concrete reason to change emerges; no routine post-prototype language comparison
is required. Packaging, runtime placement and integration still need engineering work; this
language decision is not deployment authorization.
Later parser/engine feature work builds on that foundation; do not reopen settled scope or silently
automate deferred mechanics to finish a screen.
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
the engine uses TypeScript unless a concrete reason to change emerges; runtime placement remains a separate decision. The UI is being developed in another
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

- Character-track scope confirmed 2026-09-15 (Q-CHAR-14): include all eleven classes through levels
  1–10 from the outset of wizard development: nine core classes plus Beastheart and Summoner, with
  their editor choices, dependent grants and derived builds. Preserve sourced class knowledge for
  parser, engine and UI work. Table support has separate milestones. Other supplements/homebrew
  remain excluded; core versus supplemental provenance remains explicit. See the character spec.
- Public searchable Rules, Foes and Items references include eligible core retainers/companions/summons and
  items even when not fully automated. Source coverage and automation coverage are separate.
- Free play, combat and a dedicated respite loop are included. Montage/negotiation flows, downtime projects
  and nested activities are deferred. Respite needs source research before detailed design.
- Character creation, advancement, full edits, progression history, sharing, detachment/duplication and Forge
  Steel import are included. Export is not required in v1; preserve the information and adapter boundary
  needed to add it without rewriting the system.
- Private saved encounters support duplication, monsters/counts, prepared initiative groups, minion squads
  and captain assignments, a remembered party-strength calculator and prepared reward items. Reopening,
  duplication and loading preserve that preparation; loaded instances and relationships are independent. No other authored encounter content or template sharing is required in v1.
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

When the session is paused, both rosters are locked: no session-player/character changes, foe additions or
removals, regrouping, or saved-encounter loads until resume. This supersedes the earlier paused-edit permission.
Outside a pause, party changes require no active combat; the Director can manage foes between sessions and
during running combat. Gameplay actions still require a running session. Closed sessions remain permanently
read-only.

Combat locks the party roster and ordinary character edits, including drafts, progression and build
activation. Encounter operations immediately update the main sheet; the precombat snapshot is for
history/void-reset, not a second editable sheet. Void offers keep-current or restore-starting-state and skips
ordinary rewards/cleanup. Restore starting state returns the Director panel's gameplay state to its
combat-start snapshot, including foes, relationships and loot/stash state. Remove later additions and
restore original state; reconcile item locations/claims without duplicates. Keep retains current state. The Director may Void while paused using that keep/reset choice; the session
stays paused and its roster lock remains, while ordinary gameplay stays blocked. Closing a session with
active combat invokes that void choice; pause itself preserves
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

Show Malice is a campaign setting, off by default, controlled by the active Director. The Director
always sees the current shared pool; enabling the setting shows it to players/observers. Enforce the
audience through shared reads. This does not hide used-action source text or change resource mechanics.

The user refines initiative groups to contain actor-linked turn entries, usually one per actor.
Multiple entries share one live creature's state; each actual turn keeps distinct boundaries. Ordinary
one-turn group rules remain intact. Granted full-turn entries default to the bottom of the initiative
roster, each in its own new group, unless source timing requires an immediate/directly following turn.
This adds turn entries, not creatures, and does not impose a fixed initiative order. Dragging/regrouping
moves only the selected turn entry, leaving other entries for that actor where they are. This follows
directly from the selected model; it is not a separate unresolved product decision. The earlier repeated
mixed-group activation proposal is superseded.

Current creature checkpoint: [minion contracts](docs/table-spec.md#minion-squads-and-captain-state)
select one squad entry, default four, plus/minus count 1–8, captain additional to eight, and proportional
EV from the printed quantity. No manual live split/merge. Minion identities, current pool and shared-turn
participation are distinct: captain-bonus loss causes no casualties, replacement bonus gain revives no
one, and later non-area pool exhaustion defeats remaining ordinary members subject to source exceptions.
Area damage cannot kill outside its area. Personal extra captain turns do not refresh the squad.
The clock owns scheduled turn effects and dispatches global work once per actual turn, not per shared
participant; personal effects/saves remain individual. Remaining numeric and source cases are listed in
[the table queue](docs/table-spec.md#8-continue-exploring), not grounds to reopen those rulings.

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
mechanical inputs and effects support recorded manual adjustments. The standalone damage/collision/fall
tool is deliberately out of scope, not a missing feature. Director fine-tuning uses eligible result
corrections and direct live-stat adjustments on monster stat blocks and character sheets through shared
recorded operations. Preserve the existing history/session and character-build boundaries. Missing facts/unsupported mechanics are
explicit uncertainty, never invented automatic outcomes. Every used action exposes its complete verbatim
source text through the shared game log; full monster stat blocks remain Director-only. Account permissions,
private data and session lifecycle retain their separate policies. Manual play is supported from v0.01.

Keep a client-independent deterministic rules engine with full spatial-rules understanding as its intended
capability. The mobile web app is one client; future map clients and possibly physical-map observation can
consume the same structured outcomes. A potential Minecraft-like game motivates portability, not a current
implementation task. Full spatial support must not require every client to have a digital map or invent
missing spatial facts.

Every UI capability must be available through a supported programmatic CLI/API route using the same
application operations. This applies across the app, including character creation and choices, not
only table actions. Verify rule interpretation and actual persisted state application separately.
Completion requires a passing authenticated application journey with no browser setup or session;
engine unit tests, direct database writes and headless Chromium cannot substitute for this proof.
Run headless verification before browser acceptance and record the additional defects browser tests
find, following the [build completion gate](docs/build/README.md#programmatic-headless-completion-gate).
Only a completed comparison showing no additional gaps justifies moving redundant browser tests to
a later step. Keep distinct UI checks and existing acceptance requirements until that decision is
recorded. The table UI may evolve independently and must not gate the headless workflow.

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
resolved and unresolved effects. The Director can mark a specific unsupported effect Resolved at table
on its source log card, recording manual resolution without duplicate application. Dependent automation
still requires actual resulting state/facts; this is not a routine completion click for supported actions. Record manual corrections, preserve dependencies and prevent double
application when automation resumes. Dice generation is pseudorandom and shared; optional visual physics
presents accepted results, never decides them.

Each character follows the same gameplay mechanics regardless of shared or separate player control.
Multi-character control adds UI navigation/labeling concerns, not special resource, response or dependency
rules. Existing control permissions and user attribution remain. Do not frame unresolved dependency policy
as a special case of one user controlling several characters.

Character sheet/player pane follows the viewed character. Game-log action cards can belong to another
controlled character and must clearly label who acts before interaction. They use that bound actor
without requiring a sheet switch. Other switch prompts/automatic sheet changes remain open; do not infer
a passive turn-start switch. Explicit successful Take turn switches the invoking user's player pane to
the chosen character; existing actor-switch draft clearing applies. Explicit command actors and bound
responses retain their identity.

Formal Director test-request UI/commands and their response modes/lifecycle are removed from scope for
now. This is a deliberate scope choice, not a missing spec gap; do not add the workflow without a new
user decision. The Director asks verbally; players roll tests directly. Specific actions can still supply linked
test steps. Show recorded workings/total and calculate outcomes only when difficulty or source outcome
context is known; otherwise the Director interprets. See [tests](docs/table-spec.md#freeplay-baseline-and-combat-transition).

Standing prompt policy confirmed 2026-09-13: still-valid combat action-card response opportunities stay active
through the gap after End turn and close at the start of the next individual turn. This supersedes
triggering-turn-end closure and combat-test round-end expiry, and includes prompts created at turn end.
Persistent effects retain their own lifetimes; required unresolved work still blocks dependent progression.
FreePlay has no artificial individual-turn boundary; source-specific cards keep applicable lifetimes. See [prompt windows](docs/table-spec.md#inline-interaction-cards-in-the-game-log).

Confirmed FreePlay carryover: earlier actions do not consume the new encounter's action economy.
Damage/resource state carries forward under source-defined combat-start rules; do not replay the action,
import it as a first turn or automatically refund its costs. See
[the combat transition](docs/table-spec.md#freeplay-baseline-and-combat-transition).

Confirmed encounter closeout: provide formal Director closeout UI. Explicit End combat closes unused
optional combat responses and ends structured turn play. Do not synthesize a final turn/group/round
boundary or its saves/resource grants. Already-caused required resolution completes before rewards/cleanup;
combat-ending effects retain their rules. Closeout lists each character's applicable action/effect options
so players can take stock and choose what to resolve through labeled log cards. Optional effects are not
automatically cleared. Director Finish cleanup closes unused optional cleanup choices after required
resolution completes, without per-player ready confirmations or executing unchosen options. Existing
wrap-up then returns to FreePlay. The Director grants the Victory amount and recipients during closeout;
the editable initial value 1 (allowing 0) is not an automatic award. Record confirmed grants once.
Finish cleanup, or Void after applying keep/reset, archives the encounter: gameplay undo cannot reopen it or cross that completed boundary,
and archived events cannot be edited. Current-state adjustments remain new recorded actions.
See [closeout](docs/table-spec.md#formal-encounter-closeout).

Confirmed early closure: committing an unrelated new ability passes that character's earlier unused
optional triggered-action opportunity; preparation/refused activation does not. Preserve response chains,
new opportunities, explicit continuations and responses to unrelated events. When Thorn takes another
action or spends the resources granted by a hit, that hit's response window also closes for an ally's
Parry. This is existing precedent; prompt ownership does not exempt the response. Next-turn start is the outer
deadline. Precise causal resource-grant timing is an explicit player-value priority: all spending, feature,
usage-limit and history logic must respect when each grant becomes available, including during retrospective
responses. See [resource bookkeeping](docs/table-spec.md#ability-costs-and-optional-spending).

The game log records initial values, modifier inputs/outputs and resulting state changes. Corrections and
undo append new entries without rewriting the original; future interpretation/undo uses the effective
result on the current history branch. Once later gameplay has committed, modifying an older event requires sequentially undoing the entire
intervening chain first, even within the same turn and including Director edits (confirmed 2026-09-13).
Director adjudication cannot bypass that boundary. Current-event continuations remain distinct from
historical edits. Undo/redo restores recorded state without rerunning rules/dice. All current campaign members can read past session logs
regardless of attendance; private notes/live tower policies remain separate. Compressed closed-session history
remains readable, never a route to reopen gameplay. Campaign chat has its own lifetime.

Standing clock policy explicitly confirmed by the user: at a boundary, resolve due work in enqueue order
with save-ends rolls last. Include all applicable save-ends effects applied before the final save phase
begins, unless their source specifies otherwise. This is an explicit standing app policy, not an inferred
precedent from a case ruling; preserve source timing and special save replacements. See
[the game-clock contract](docs/table-spec.md#game-clock-and-scheduled-rules-work).

Players sequentially undo their character's uninterrupted latest actions only to the nearest seam,
with combat turn start/FreePlay-stretch start as outer limits. Another character's committed action closes
the window even when characters share a controller. Automatic consequences remain linked to their cause.
Director rewind sequentially crosses seams within the current encounter; no selective player cascade
across another character's response. Redo restores the available recorded path. Committed Director corrections also close the player window, superseding the prior
End turn undo exception. Undo a same-character optional token action before its originating End turn. **Enable user undo** defaults on and governs
gameplay, not inventory. New gameplay after undo clears redo availability while retaining abandoned history
and their recorded outcomes. Exact Redo restores recorded dice; new execution resolves current conditions
with fresh dice, including turn/round work. No separate result-reuse cache is required; the Director can
adjudicate reroll abuse using existing correction controls and history boundaries. Source-specific triggered timing, conditional spending, manual-resolution sequencing
and remaining same-turn dependencies still need contracts. Do not settle them through incidental UI or
storage choices.

Build toward parsing supported Draw Steel stat-block language into a reusable rules interpreter; arbitrary
natural-language comprehension is not implied. General homebrew/pack/parser capability is future architecture,
not v1 authoring scope. This hobby project has limited human time: avoid vocabulary bans, per-rule approval
queues, source-hash proof systems and process frameworks as substitutes for behavior. Source references locate
evidence; they do not prove semantics. Prefer meaningful examples and executable coverage reports.

## Development approach

- `CLAUDE.md` restates the standing rules from this file for Claude sessions; keep the two consistent.
  Build work is organized as slices under [`docs/build/`](docs/build/README.md) with a single status
  tracker; commits reference owning spec sections with `Spec:` trailers. Rules or product questions
  that need the user go to [`docs/rules-questions-for-user.md`](docs/rules-questions-for-user.md), not
  to a build thread.
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
  superseded. Cloudflare Email Service is selected for password reset (V39, sender
  `salient@blackgate.studio`); hosted recovery is live and browser-verified, with delivery-test inbox
  receipt confirmed by the user. Future LAN recovery remains pending. Preserve the distinction
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
