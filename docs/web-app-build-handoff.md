# Web app build thread handoff

The user selected two workstreams: a dedicated thread works through rules tooling and combat behavior with
the user, while a separate app thread reads the specifications, builds the ordinary web application, and
reviews its work autonomously. This handoff records that division; it does not claim either thread has
started or that the application is implemented.

Ready-to-paste assignments: [web app kickoff](kickoff-web-app.md) and
[rules/combat kickoff](kickoff-rules-combat.md). Each includes delegation, review, escalation and
cross-thread coordination instructions. Writing these prompts does not launch their assignments.

## Assignment for the app thread

Build and review the web-application portion of v0.01 from the existing specifications. Make routine
engineering choices and carry working flows through persistence and verification. Ask the user only when
an unresolved product decision materially affects the work. Keep progressing on independent work while a
rules or combat question is being resolved in the dedicated thread.

Start with [project instructions](../agent.MD), the [v0.01 scope](pre-alpha-design-gaps.md),
[tech stack](v1-tech-stack-spec.md), [accounts/access](accounts-and-access-spec.md),
[table](table-spec.md), [character wizard](character-wizard-spec.md), and
[data architecture](data-architecture-spec.md). The [V1 index](v1-spec-checkpoint.md) locates fuller-product
requirements; it does not expand the prototype. Reconcile the relevant specs into an implementation plan;
do not reinterpret this assignment as a request to redesign settled requirements.

Inspect the current checkout and any existing UI work before scaffolding or replacing it. The known local
baseline is a bounded headless TypeScript experiment, not a working web app; verify current reality rather
than relying on that historical description. Use the relevant Convex/auth skills for backend implementation
and verify library APIs against installed versions/current official documentation.

## Work that can proceed independently

### Confirmed integration contract: registered actions and action cards

Updated **2026-09-13**. The [table spec](table-spec.md) owns gameplay meaning. The
[command spec](table-command-spec.md), [formal grammar](research/table-command-grammar.md) and
[command reference draft](table-command-catalog.md) define shared operation integration; additional
catalog spellings/schemas remain proposals. This handoff does not claim the existing app implements them.

Every in-table UI button has a registered command-palette/headless operation. Slash text, sheet buttons,
log controls and action cards call the same shared behavior. Record discrete ordered entries with actual
user attribution separate from actor identity. Mid-operation input/adjudication and cross-user requests
use user-aware cards. Cards contain neither parsing nor engine logic. The mandate is table-only.

| Integration | Contract to preserve |
| --- | --- |
| Encounter opening | Draft inclusion/surprise/groups until Director OK. OK snapshots precombat state, commits and locks party/build edits before initiative. Cancel before OK preserves independent roster changes; afterward use Void keep/reset. Active players/Director roll, observers cannot. Winning side chooses first, with Director control on either result. [Opening](table-spec.md#confirmed-initiative-setup-and-shared-presentation). |
| Group/turn state | Individual spent turns and group completion are separate. New monsters get a current-round turn in a new bottom group. Director transfers preserve state; current actor finishes without switching the original active group. Unspent members may join active groups, never reopen finished ones. No remaining turns hands off after current/required work. [Groups](table-spec.md#mid-combat-additions-and-regrouping). |
| Sheet actions/movement | Sheet-based controls and explicit End turn; spent-action graying is advisory. No ordinary board movement/distance/split-segment logging or initial I moved/Convert buttons. Required nonmovement effects still execute. [Turn UI](table-spec.md#player-sheet-actions-and-explicit-end-turn). |
| Target selection | Per-user visible drafts; target before/after ability. Single/self-only completion auto-fires; checkbox multi-select auto-fires at full count or explicitly earlier. Mapless areas explicitly fire. Accepted clearing rules retain historical targets/continuations. [Targeting](table-spec.md#roster-targeting-controls). |
| Persistent areas | Register end condition, stack fixed-bottom cards, and provide effect-owner/Director controls. Membership edits commit immediately; each firing requires confirmation with prior selection prefilled. Dependent clock work waits; Resolve now supplies unobserved triggers. No ordinary reminder inbox. [Areas](table-spec.md#persistent-area-effect-cards). |
| Ability costs | Fixed applicable costs debit automatically when ready. Optional pre-resolution enhancements use cards unless supplied. An unaffordable ability cannot execute for any caller; enforce current-state checks in shared operations, not only UI. Respect source waivers and legal negative ranges. [Costs](table-spec.md#ability-costs-and-optional-spending). |
| Tests/FreePlay | One-volunteer or per-character requests. Expire at round end, or FreePlay combat commitment/session end. Viewed controlled sheet supplies FreePlay actor default. Show test difficulty defaults off; roll workings and success/failure stay public. Per-test reveal deferred. [Tests](table-spec.md#freeplay-baseline-and-combat-transition). |
| Clock | Individual turn/round events; enqueue order/save-last with source exceptions. Applicable effects applied before save phase join it. Automatic saves leave an optional token button until another participant begins an individual turn. Required area confirmation waits; optional token choice does not delay handoff. [Clock](table-spec.md#game-clock-and-scheduled-rules-work). |
| Corrections | Append correction/undo entries without rewriting originals; use current effective branch. Preserve manual damage overrides through modifier edits. Next individual turn locks prior-turn direct editing for everyone; rewind intervening history first. [Corrections](table-spec.md#director-edits-to-inline-results). |
| Undo/redo | Players undo own current turn/FreePlay stretch; Director can rewind throughout current encounter. Recorded redo, new-play branch policy and stamped turn/round results prevent rerolls/duplicate grants. End-turn undo can refund dependent token spend and Director edits before next turn starts. [History](table-spec.md#undo-permissions-and-proposed-campaign-control). |

Shared operations must recheck role/control, session state, resource payment and historical-edit window,
retain accepted dice/choices and enforce once-only commitment across races/retries. Do not broaden ordinary
rule warnings into blocking, or use the Director doctrine to bypass affordability/history boundaries.
Pinned card presentation can update without mutating its immutable event history. User selection, active
effect membership, group activation and entity turn state have distinct ownership/lifetimes.

Remaining source-specific responses, conditional costs, same-turn dependencies, effect-owner mapping,
current-actor removal, setup roster reconciliation and other gaps are in the
[table checklist](table-spec.md#8-continue-exploring). Do not silently select behavior to finish a screen.
The broad command inventory does not expand v0.01 or implement retainers/friendly monsters beyond V1.

### Independent app work

- App/workspace setup, routing, layouts, navigation and shared UI controls, following the stack spec and
  the temporary desktop presentation scope.
- Sign-up, sign-in, sign-out, authenticated routes and server-side access checks.
- Campaign creation, invitations, membership, campaign navigation and the selected-player/session setup
  flows whose behavior is already specified.
- Shared persistence, reactive reads, form handling, loading/empty/error states, retry/reconnect handling,
  and clear separation between authenticated user identity and game entities.
- Character list, authored fields, wizard presentation, saved selections/revisions and campaign review UI,
  using the agreed character model and sourced evaluation behavior where available.
- Foe selection/loading surfaces, roster presentation, readable source content, and the table/log shell,
  respecting the existing audience and source-disclosure policies.
- Integration and review of the exposed app behavior, including authorization, ownership, persistence,
  navigation, duplicate submissions and reload/reconnect. Use shared operations for headless and UI clients.

These are complete connected app flows where contracts exist, not permission to label empty screens or
mock persistence as finished functionality. Use clearly identified development fixtures to exercise an
unavailable integration, and report that dependency as unfinished.

## Behavior owned by the dedicated rules/combat thread

- Research/reviewer skills, source-backed interpretation, the ruling record and rules-review gate.
- Step-by-step combat walkthrough with the user: choices, timing, triggers, manual completion, overrides,
  pending effects, correction and undo/continuation.
- Parser/engine semantics, mechanical formulas, legal build choices and derivation, and the mechanical
  expectations needed to verify those behaviors.

The distinction follows behavior, not filenames. Rendering a character wizard is app work; deciding its
valid options or derived Stamina is rules work. Rendering a turn button does not establish an action budget.
Saving a recorded outcome is app work; deciding which effects may commit before a pending trigger is rules
work. Broadly specified session operations may also depend on combat decisions: implement the settled
noncombat path without inventing the unresolved active-combat branch.

The app thread consumes and integrates mechanical contracts as they become available. It must not invent
rules in UI components, turn a fixture into production rules logic, or silently choose combat behavior to
complete a screen. The research/review requirement applies whenever its work changes mechanical meaning.
Its independent web work does not need to wait for those tools to be finished.

## Coordination and review

Keep one current shared contract for each integration: required inputs, outputs, state ownership, source
text, warnings and unresolved/manual work. The app thread can propose transport/storage/UI needs; the
rules/combat thread settles mechanical meaning with the user. Schema and API choices must not decide
unsettled sequencing by accident. Agree the relevant contract incrementally, not the whole engine upfront.

Announce overlapping files and shared-contract changes before editing them concurrently. Keep changes
scoped, preserve the other thread's work and designate an owner for an overlapping change. Follow the
existing single-current-development-version policy; this division does not itself prescribe new branches,
separate deployments or competing implementations.

Review each delivered app slice against its specification and actual persisted behavior. Present what works,
what was tested, and exact remaining dependencies. A scaffolded table is not a completed combat journey;
integrated combat remains part of overall v0.01 acceptance. Independent rules verification remains separate
from ordinary web-app review.

Remain within v0.01 deferrals: no requirement to deliver inventory, campaign chat, saved encounters,
leveling, standalone reference browsing, interchange, mobile layouts or finished visual polish. Apply
existing runtime permissions and scoped user exceptions. This handoff does not grant production deployment
or external publication authority; follow the existing deployment policy and actual session authorization.

## Starting prompt for the dedicated thread

Read the project instructions, rules-adaptation principles, rules-skills design and development process.
Own the rules research/review tooling and walk through combat with plain-text design questions in
batches of three. Research only the pinned local Compendium for Draw Steel content. Recommend
interpretations, keep case rulings scoped, and honor explicitly declared standing policies.
Publish the agreed mechanical contracts and examples for the separate web-app thread to integrate. Keep
working application infrastructure separate from unsettled combat decisions.
