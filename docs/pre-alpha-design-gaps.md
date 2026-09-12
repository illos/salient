# v0.01 pre-alpha: scope checkpoint and design gaps

Checkpointed 2026-09-12 after the combat/FreePlay and command/action-card discussion. Specification only;
this is not an implementation milestone or approval of proposed technical contracts.

## Checkpoint and resumption

**Current checkpoint, 2026-09-12:** establish baseline FreePlay and combat behavior before the tooling
pilot or implementation slice. The user requested a saved checkpoint after accepting human command syntax.
No immediate design question is pending. Earlier combat deferrals in the historical answer trail are not
current instructions. On resumption, ask one focused plain-text question when product judgment is needed.

| Confirmed area | Current baseline / owning detail |
| --- | --- |
| Opening | Explicit Director start; two roster lists, individual surprise/exclusion, group setup, shared initiative roll when needed, winner's side choice and announcement. Any participating player may submit the players' choice; the Director may always choose. [Encounter workflow](table-spec.md#5-encounter-workflow). |
| Combat view | Director pane left, log middle, heroes pane right. Player sheet plus party Stamina/Recoveries; Director sees foes controls and a vertical party-resource overview including Heroic Resources. Portrait-row format is provisional. [Role layout](table-spec.md#confirmed-combat-layout). |
| FreePlay view | Same role-specific three-pane table, with sheets, rosters and log available and no active initiative or turn tracking. [FreePlay baseline](table-spec.md#freeplay-baseline-and-combat-transition). |
| Groups | Director creates monster groups; every hero automatically gets their own group. Only the Director may change hero grouping in V1, including combining heroes during setup. Multiple heroes per player are supported. Squads remain minion-specific. [Group model](table-spec.md#initiative-groups-confirmed-app-model). |
| Scope refinement | Playable retainers and friendly monsters are deferred beyond **V1**. Groups preserve a later integration path; an attached retainer will default to its mentor's group. Readable core references remain separate from playable support. |
| Adaptation | Source-faithful automation, full used-action text, recorded manual play, warnings without rule-based blocking, and Director adjudication. [Principles](rules-adaptation-principles.md). |

The [table command specification](table-command-spec.md) owns the confirmed interaction foundation:
registered table actions shared by UI, palette, slash text and headless callers; discrete ordered log
entries with attribution; user-aware action cards for input, adjudication and cross-user requests.
The mandate is table-only. Short commands can open guided cards, and table-state commands use the same
registry. Initiative setup, roll, side choice and announcement live in a staged game-log action card.
Cards contain neither parsing nor engine logic. The interaction surface must be extensible for programs
and services; adventure-module handlers remain a future possibility, not current scope.

The accepted syntax is optional `@Character`, `/family verb` and named arguments, with quoted names and
lists such as `targets=[@Goblin5,@Goblin6]`. The [grammar report](research/table-command-grammar.md)
documents the formal baseline. Detailed per-operation/API schemas remain proposals. The broad research
inventory does not bring every command family into v0.01.

Both players and the Director may initiate tests. Director inline corrections reinterpret results, update
live state once and append adjudication; edge/bane roll changes remain distinct from direct damage edits.
Inline Undo is required. Trigger controls appear on their originating entry with an event-based window
through the triggering creature's turn; reconciling earlier source timing and applied effects remains open.
No separate persistent-card inbox has been accepted.

**Remaining contracts:** open-test response counts, group/member turns, FreePlay operations, setup
commit/cancel timing, action/trigger/manual resolution, resources/conditions, dependent corrections/undo
and encounter completion. The [table checklist](table-spec.md#8-continue-exploring) and
[command open decisions](table-command-spec.md#decisions-still-open) own the concrete cases. A requested
test and an ability/response/correction sequence are recommended next walkthroughs when work resumes.

The [rules status](workstream-rules-status.md) records current ownership, evidence and recommendations versus
user decisions. Researcher/reviewer tooling remains later work under the [accepted trial](development-process.md)
and [skill design](rules-skills-design.md); available source research is not an installed CI gate. Individual
rulings stay scoped to their original cases, and taste-based departures are not research errors. No reduced
review policy has been selected.

The separate app thread may continue independent implementation under the [build handoff](web-app-build-handoff.md).
It consumes settled mechanical contracts as they become available. Do not infer that the baseline discussion
or this cleanup authorizes unresolved combat behavior.

## Confirmed direction

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
5. Create a level-one devil Fury through a minimal working wizard and load it into the party (hero) roster.
6. Walk through the basic action economy of combat, with recorded gameplay visible in the game log.

These are connected application workflows, not isolated component demos. The list describes required
capabilities, not a rigid screen order: the hero must exist and pass applicable review before entering play.
Basic sign-up/sign-in supports the participating users.

The user corrected the fixture to **devil ancestry, Fury class, level one**. The
[prepared hero](hero-fixture.md) can supply a sourced example for the remaining choices; its other choices
were not individually mandated. The wizard must cover every applicable creation step, including ancestry,
class, career, background and other sourced choices, with one supported option or valid selection set per
step acceptable. Preserve real selections, valid counts/dependencies and derived values. Loading a prepared
hero behind a mock wizard does not meet the requirement. Starting-equipment inventory creation is excluded
by the inventory deferral; applicable build choices such as kit selection remain included.

The parser need not resolve every ability. Relevant hero, foe and ability text must remain readable under
existing visibility rules, and partial automation must be represented honestly. Exact turn/action
tracking, manual-resolution sequencing, reactions, costs and undo dependencies remain open. Game-rule
conflicts warn without blocking deliberate play; automatic application and manual completion sequencing
remain to be designed.

## Confirmed v0.01 scope by feature

| Feature | Included now / required foundation | Deferred beyond v0.01 | Owning specification |
| --- | --- | --- | --- |
| Accounts | Sign-up, sign-in, sign-out; authentication and authorization for exposed features | Profile editing, password recovery, account deletion | [Access](accounts-and-access-spec.md#1-current-implementation-and-scope) |
| Campaign participation | Creation, invitations, membership; campaign creator serves as Director | Friends system; appointing another Director | [Access](accounts-and-access-spec.md#1-current-implementation-and-scope) |
| Character control | Players control their own admitted characters; Director can act for table characters under existing restrictions | Player-to-player character-control sharing | [Access](accounts-and-access-spec.md#1-current-implementation-and-scope) |
| Character wizard | Complete minimal level-one creation path and reopening/editing outside combat; existing review, effective-build isolation and locks | Leveling up and higher-level creation/editing coverage | [Characters](character-wizard-spec.md#1-product-outcome-and-scope) |
| Build revisions | Record saved build revisions and preserve them through save/reload | Interface for browsing/restoring earlier builds | [Build history](character-wizard-spec.md#5-progression-history) |
| Forge Steel interchange | Design the character model for future adapters without rebuilding the wizard; retain build/authored/live-state separation and scoped content identities | Import/export implementation, file UI and round-trip delivery | [Characters](character-wizard-spec.md#8-content-and-forge-steel-compatibility), [research](forge-steel-interchange.md) |
| Foes and preparation | At least one catalog stat block loaded as an independent live foe | Saved-encounter authoring, duplication and template loading | [Catalog](monster-catalog-spec.md#confirmed-requirements-and-proposed-first-scope) |
| Inventory | Preserve the boundary between character builds and future item ownership; sourced build contributions remain | Entire inventory system, including starting-equipment item creation, equipment management, party inventory, stash/claims, loot and inventory history | [Inventory](inventory-spec.md#pre-alpha-scope) |
| Table and history | Session start, hero/foe rosters, basic combat journey and a visible game log; table performance remains a priority | Campaign text chat | [Table](table-spec.md) |
| Rules reference | Readable text for the heroes, foes and abilities used, under existing table visibility rules | Standalone searchable rules library, explicitly a separate feature | [References](reference-library-spec.md#confirmed-pre-alpha-scope) |
| Presentation | Desktop, temporary UI proving real workflows; shared behavior independent of screen layout | Mobile/tablet layouts and finished visual polish | [Technology](v1-tech-stack-spec.md#1-decision-status-and-product-constraints) |

Deferral removes a delivery gate, not the fuller design requirement. In particular, future import/export
must fit the character architecture, ownership must remain distinct from action authority, and saved build
revisions are separate from gameplay history. No unused inventory machinery or converter is required now.

Features not covered by these answers are not silently included or deferred. Remaining scope questions
include respite, blocking, campaign deletion, character detachment/duplication and public Items browsing.
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
| 6. Parser and engine slice | **Active, unresolved:** minimum automated mechanics and spatial facts supplied by the first client. **Engineering:** compiler/engine boundary. | Supported, partial and unsupported action examples with required inputs, outcomes and diagnostics; source research should identify reusable constructions. |
| 7. Manual play and pending work | **Active, unresolved:** who supplies missing facts/effects, sequencing, cancellation, resumption and concurrent work. | One mixed automatic/manual action identifying costs/dice already accepted, pending effects and prevention of double application. |
| 8. Table and combat slice | **Opening/layout/group defaults answered; turn behavior open:** formal Director start, surprise, shared roll and choice, role-specific three-pane view, groups on both sides. | A group/member-turn walkthrough, then action resolution and pause/reconnect; use the owning table checklist. |
| 9. Undo and continuation | **Active, unresolved:** action grouping, player/Director boundaries, dependencies and new play after undo. | Rewind/change-course examples and resulting state. Saved build revisions are already included; build-history UI and all inventory history are deferred. |
| 10. Resources and respite | **Open:** live-state reconciliation after build edits; turn/combat resource lifecycles; respite scope and rules. Detachment/duplication matter if exposed; advancement-specific questions belong to deferred leveling. | Resource-lifecycle examples and dependent scope decisions, with combat timing reserved for its dedicated discussion. |
| 11. Items and loot | **Deferred:** entire inventory system. | Resume item-authority, mechanics, claims and history work when this subsystem returns to scope; no prototype inventory workflow is needed. |
| 12. Access and lifecycle exceptions | **Core scope answered:** basic accounts, campaign invitations/membership, creator as Director, owner/Director control. **Open:** user blocking, campaign deletion and departure scope, former-member history, exact sign-in/session contracts. | Transitions and authorization for exposed operations. Settings/recovery/account deletion, friends, character-control sharing, delegation and chat are deferred; combat recovery remains parked. |
| 13. Integration and readiness | **Presentation answered:** desktop and temporary UI. **Engineering:** retries, bounded queries/resources and performance. **Open:** representative group size and recovery acceptance depth beyond ordinary persistence. | Connected desktop demonstration plus relevant boundary/failure checks. Normal save/reload/reconnect is already required; a final soak-test duration or numeric performance budget is not settled. |

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
