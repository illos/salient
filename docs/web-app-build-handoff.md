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

The user has now made the [action/log contract](table-spec.md#confirmed-action-and-log-contract) mandatory
inside the table. Every table UI button must have a registered action accessible through the command palette;
buttons, slash commands, log controls and action cards call the same shared operations. All table activity has
discrete ordered log entries with user attribution. Mid-operation input/adjudication and requests from
one user to another use user-aware inline action cards, also executable through headless operations.
Use the [architecture boundary](engine-architecture.md#command-registry-and-palette). Human syntax is now accepted;
detailed schemas remain proposed, and settled access/privacy and release scope remain. The user explicitly scoped this pattern to
the table, not account, campaign-management or other screens outside the table.

This handoff requires integration and review of existing table button paths as well as new table UI. It does not claim
the existing app has a complete registry or action-card system. Rules timing, dependent corrections and
multi-response completion still need mechanical contracts; rendering a card must not decide them.

Detailed design and research now live in [table commands and action cards](table-command-spec.md).
It includes the source-backed operation-family/argument inventory and the accepted human syntax baseline.
Short slash commands can launch guided cards; a caller need not type a large complete invocation.
Table-state actions, including starting encounter setup, are included. Initiative steps now live in a
staged game-log action card. Recommended guided preparation does not roll/spend/apply merely by opening its card. Review existing table controls
against the shared registry requirement without treating the research catalog as new prototype scope.

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
Own the rules research/review tooling and walk through combat with me one manageable decision at a time.
Research source rules yourself, recommend interpretations, and keep my rulings isolated to their cases.
Publish the agreed mechanical contracts and examples for the separate web-app thread to integrate. Keep
working application infrastructure separate from unsettled combat decisions.
