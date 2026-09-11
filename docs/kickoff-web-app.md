# Kickoff prompt: web application implementation

You are the lead for implementing and reviewing the ordinary web-application portion of this Draw Steel
companion. Build working connected v0.01 flows from the specifications. Make routine engineering decisions
autonomously and use subagents for bounded implementation and independent review. You own integration,
verification and the resulting application; do not stop after producing a plan or scaffolding screens.

The repository is `/srv/presidium/projects/salient/code`. A separate thread is working with me on the rules
process and combat walkthrough. Proceed with independent app work while that thread resolves mechanical
behavior. This is an implementation assignment within the existing prototype scope, not a redesign of
the product or a request to build every fuller-V1 feature.

## Read first and establish current state

Read `AGENTS.md`, `agent.MD`, `docs/web-app-build-handoff.md`, `docs/pre-alpha-design-gaps.md`,
`docs/v1-spec-checkpoint.md`, `docs/v1-tech-stack-spec.md`, `docs/development-process.md`, and
`docs/rules-adaptation-principles.md`.

Use the owning specs as each slice needs them: `docs/accounts-and-access-spec.md`, `docs/table-spec.md`,
`docs/character-wizard-spec.md`, `docs/data-architecture-spec.md`, `docs/monster-catalog-spec.md`, and
`docs/engine-architecture.md`. Read `docs/rules-skills-design.md` before crossing into mechanical work.
Latest user decisions and the v0.01 checkpoint control scope; do not treat historical open questions or
proposed defaults as settled requirements.

Inspect Git status, current code, tests, installed dependencies, existing UI work and any workstream notes.
Preserve work from other threads. Establish an appropriate test baseline and investigate failures before
attributing them to your changes. Retain the useful headless experiment and its tests. Do not blindly
replace an existing frontend or migrate tooling that another thread is actively editing.

Use the confirmed Convex backend and Better Auth integration. The tech spec recommends React/TypeScript,
Vite, TanStack Router, Tailwind and pnpm; use those defaults where they fit current reality. Choose compatible
versions through current official documentation and installed APIs. Use the relevant Convex/auth skills.
Do not reopen the whole stack selection or equate the app's TypeScript choice with a permanent engine-runtime
decision. Keep both vendored submodules unmodified and do not advance their pins automatically.

## Deliver working app slices

Create a concise implementation plan, then execute it. Prefer complete flows through shared application
operations and persistence over completing every screen's appearance first. Cover:

- Application/workspace setup, navigation, typed routes, layouts, shared controls and usable temporary
  desktop presentation.
- Sign-up, sign-in, sign-out, authenticated routes, and authoritative server-side access checks.
- Campaign creation, invitations/membership and the campaign hub, with the creator as Director.
- Specified noncombat session setup, participation, roster and lifecycle operations. Leave unresolved
  combat-dependent branches explicit rather than choosing their behavior incidentally.
- Character listing, authored fields, minimal wizard presentation, saving/reopening selections and build
  revisions, and applicable campaign review flows. Integrate sourced choice/derivation contracts from the
  rules thread. A prepared-character load does not satisfy the minimal wizard requirement.
- Direct foe selection/loading, live roster surfaces and readable source content under the specified
  audience policies.
- The table and visible game-log surfaces, integrating shared game operations as their contracts become
  available. Preserve full used-action text, warning visibility and honest manual/unresolved presentation.
- Persistence, reactive updates, loading/empty/error states, retries and ordinary reload/reconnect across
  the implemented journey.

Character data must preserve real choices, source identities, authored fields, derived baseline and live
play state separately from UI state. Keep game calculations out of components. Save real state and read it
back; a successful toast or mutation response alone is not evidence that the right data changed.

V0.01 defers inventory, campaign chat, saved encounters, leveling, standalone reference browsing,
Forge Steel import/export implementation, mobile/tablet layouts and finished visual polish. Do not expand
the task into those features merely because fuller specs describe them. Unknown prototype scope should
be identified when it matters, not silently treated as an inclusion.

## Mechanical boundary

The other thread owns rules research/review tooling, interpretations, parser/engine meaning, mechanical
formulas and build validity, plus combat choices, timing, triggers, manual resolution and undo semantics.
You own app presentation, identity/access, persistence and integration. A wizard constraint can be rules
logic; a database transaction can accidentally decide combat sequencing. The boundary follows behavior,
not directory or screen names.

Implement against established mechanical contracts; request a specific contract or source-backed answer
where one is missing. You may use the provided research/review workflow when available, coordinating
ownership with that thread. Never invent a rule or embed a guessed calculation merely to finish a form.
Rule-affecting changes require source evidence and independent rules review, even in UI or import code.

Use clearly identified development fixtures to exercise unfinished integration boundaries, with real
application persistence where appropriate. Do not ship fixtures as hidden substitutes for rule evaluation
or label mocked behavior complete. Continue other routes and flows while a dependency is unresolved.

The guidelines favor faithful automation, manual adjustments, and warnings without blocking deliberate
game-rule departures. Account permissions, private data and session lifecycle are separate concerns.
My explicit case-specific exceptions apply only to those cases; do not generalize them or erase an earlier
sound source interpretation to make the product choice look like an official rule.

## How to delegate

Use subagents for independent slices that can proceed alongside useful work by you. Typical assignments
are a bounded backend/auth flow, a frontend flow using an agreed contract, or independent review of an
implemented slice. Delegate concrete deliverables rather than broad overlapping ownership such as
"build the frontend" and "build all features." Keep workers within available concurrency limits.

Each assignment must identify the task, required instruction/spec paths, exact file ownership, shared
interfaces, acceptance evidence, excluded work and when to report a blocker. Workers read relevant project
instructions themselves and return changes, actual checks, unresolved decisions and integration impacts.
Do not have several workers edit the root package manifest, lockfile, backend schema or shared contracts
without a designated owner. Keep integration and user communication with the lead.

Use a separate reviewer that did not implement the slice. Give it the actual diff, relevant specs and
acceptance behavior; ask it to inspect code and reproduce consequential behavior. Focus on correctness,
authorization, data ownership, persistence and integration failures. Have implementers fix actionable
findings and review the result. You must inspect and verify integrated changes yourself rather than treating
an agent's "done" as proof. Ordinary app review does not replace the independent rules-review gate.

## When to ask me, and when to keep building

Ask only when a missing answer materially changes product behavior, authorization/privacy, user-owned data,
or a shared contract that cannot be settled from existing decisions. Ask for genuinely unavailable
credentials or external access when needed. Route mechanical questions to the dedicated workstream through
available communication or a precise documented handoff; surface a blocked handoff to me if necessary.

Ask one focused plain-text question, explain what it blocks, and recommend an answer where supported.
Never use question widgets. Research first; do not make me choose routine filenames, component structure,
compatible dependency versions or technical details you can evaluate. Do not ask for confirmation of already
authorized reversible implementation, ordinary fixes or settled requirements.

Pause only dependent work and continue independent work. Do not interpret no reply as a required answer.
If a dependency cannot be resolved, state the exact missing input and finish everything else that can be
completed correctly. Do not stop the whole build because one combat control is awaiting a decision.

Development data is disposable under the existing policy; normal runtime persistence remains required.
Identify the actual environment before deployment-affecting work. Use authorized development resources;
do not guess a deployment target or erase unrelated data. Prepare and validate a concrete result before
requesting any genuinely necessary approval. No production mutation, external publication, paid commitment
or message to another person is authorized merely by this build prompt. Honor existing authorization and
explain the exact instruction or automated rejection if one requires a pause.

## Coordination, verification and completion

Maintain a short checkpoint at `docs/workstream-app-status.md`: current slice, owned files, working flows,
verification evidence, integration contracts, unresolved dependencies and next action. Read
`docs/workstream-rules-status.md` if it exists. Keep common contracts in the existing owning code/specs;
avoid competing copies. A shared-file note is a handoff artifact, not proof the other thread received it.

Coordinate overlapping files and shared contract/config changes before editing; preserve the other thread's
work. Follow the single-current-development-version policy and introduce isolation only when needed for
safe collaboration, without prescribing a new branch/deployment workflow. Do not reset the checkout or
rewrite unrelated changes to make integration easier.

Run checks appropriate to each change and test complete implemented flows. Exercise consequential access
boundaries as multiple users; check stored results, refresh/reconnect, duplicate submissions and failure
states. Use relevant backend tests and browser checks, keeping simple reversible presentation work light.
Do not write tests merely to match implementation text or accumulate redundant per-screen suites.
For mechanical behavior, verify interpretation separately from state application using the agreed workflow.

Keep the UI temporary but usable and the table responsive. Integrate the application before declaring
completion; isolated worker tests do not establish that the combined app works. Fix discovered issues
within scope and rerun the relevant checks. Stop repeating passed checks unless changes or new evidence
justify them.

Give concise progress updates while working. Your delivery report should identify working user journeys,
how to run/access the development app, actual verification, remaining dependencies and any material limits.
Do not claim a deploy occurred if only a build passed. Distinguish completion of your independent app
assignment from completion of the full campaign-to-combat v0.01 journey.

Start now: inspect the current implementation and specs, establish the baseline, make a short ordered plan
and begin the first independent app slice. Continue through implementation, review and integration without
waiting for approval of ordinary engineering decisions.
