# Engine architecture

**Milestone scope:** the [v0.01 checkpoint](pre-alpha-design-gaps.md) selects a connected prototype with
partial ability parsing and a visible game log. The reusable engine intent below remains the architectural
destination. Minimum automation, manual sequencing and combat timing remain open in the active
[FreePlay/combat discussion](table-spec.md#8-continue-exploring); the existing bounded experiment does not
settle those contracts. Initiative groups organize both sides while preserving controller/creature identity
and applicable individual timing. Retainers and friendly monsters are future extensions beyond V1, not
implementation prerequisites for that grouping foundation.

## Confirmed product intent

Recorded from the user's clarification on 2026-09-10.

- A reusable engine should ultimately understand Draw Steel end to end, including spatial logic.
- The app calls the engine through an API-like boundary, supplying actions and relevant parameters.
- Given the same complete inputs, the engine produces deterministic outputs.
- The engine has explicit release versions. Authored content can declare the engine version it was built for
  and the versions it was tested with, preserving that information when shared or imported.
- Character sheets and monster instances hold state to which damage, conditions, resources, and other effects
  can be applied.
- The basic client does not need to maintain a digital battle map. It can communicate spatial effects in prose
  for players to enact on a physical map, another digital tool, or through theater of the mind.
- A future VTT add-on consumes engine outcomes and updates map state.
- A possible later integration observes a physical map through machine vision.
- The app is online-first; full offline operation is not an initial requirement.
- Convex is the chosen app backend for responsive shared state whether participants are together or remote.
- The engine's technology is independent of the app stack and remains undecided.
- The engine has standalone value and should support reuse by other applications and games. A Minecraft-like
  game using Draw Steel heroes and monsters is a future aspiration motivating that flexibility, not a current
  implementation task.
- Both engine calculations and the app's game operations must run without a visual UI. Agents should be able
  to use a CLI-like interface to run battles and verify calculated effects as well as actual changes to
  character and monster state.
- The session contains its table, which uses a rolling history of activity as its v1 centerpiece. Future UI
  may change log visibility while retaining the record. The [table specification](table-spec.md) defines the
  campaign hub, single active session, Director-selected participants, pause, and free-play/encounter loop.
  Encounter actions must support undo through both visual and headless interfaces. The latest
  [data architecture checkpoint](data-architecture-spec.md) places realtime shared play inside sessions and
  permits compression after closure. Confirmed v1 direction: closed sessions are permanently read-only.
  Further play requires a new session; live undo cannot reopen or cross back into a closed session.

These describe the target architecture, not an assertion that any mechanic has been implemented or verified.
V1 uses core rulebooks only and excludes all official supplements and homebrew monsters, character options,
and items. Generic parser/content portability remains architectural intent for future expansion, not a v1
authoring requirement. See the [release content scope](reference-library-spec.md).

## Proposed boundaries

The confirmed [rules adaptation principles](rules-adaptation-principles.md) govern these boundaries.
Evaluate game-rule compliance faithfully and return visible warnings for conflicts; the application must
support deliberate player/Director departures and recorded manual adjustments. A compliance warning is not
an authorization failure. Missing facts or unsupported mechanics remain unresolved until supplied or
adjudicated, rather than producing invented automatic effects. Expose complete source text and the actual
resolution steps alongside accepted changes. The visible log is a view of recorded operations, not a required
executor of state changes.

1. **Rules content:** versioned definitions, source references, and executable representations of supported
   mechanics.
2. **Rules engine:** accepts a command, relevant state and facts, explicit choices and dice results; computes
   legality, outstanding requirements, and structured effects.
3. **Application service:** authenticates callers, loads authoritative state, invokes the engine, and commits
   accepted changes with a resolution record.
4. **Clients and adapters:** collect inputs, render explanations, and present or enact effects using their
   available capabilities.

Keep the rules engine independent of screens, storage vendors, authentication providers, and map renderers. An
API-like boundary can initially be a typed function interface; it does not require a separately deployed
service.

The application service also needs a headless entry point. Visual clients and the CLI-like development
interface should invoke the same game operations, including the path that commits and reads back state.
Independent engine execution and UI-independent application execution are separate requirements; the latter
can use Convex. See [headless development](development-process.md#headless-development-workflow).

The engine defines spatial semantics and evaluates supplied spatial state. Map adapters supply geometry and
observations and render results; they should not each reimplement Draw Steel rules.

## Command registry and palette

The [table command specification](table-command-spec.md) owns the detailed interaction design and links
its source-backed command inventory, targeting research and grammar. The [table log contract](table-spec.md#confirmed-action-and-log-contract)
owns scope and presentation. The human syntax baseline was accepted on 2026-09-12; detailed schemas,
storage and operation boundaries remain proposed. No implementation is claimed by these specifications.

Every table UI button has a registered action discoverable in the command palette. Buttons, slash text,
log controls, action cards and headless callers use the same shared operations. All table activity creates
discrete ordered log entries; user-initiated actions carry authenticated issuer attribution separately
from acting-character identity. This mandate applies inside the table, not other app screens.

The registry routes operations to the appropriate app service or client handler; not every operation is
a rules-engine calculation. Slash parsing is an input adapter. **Action cards contain neither parsing nor
engine logic**: they present interaction state and collect structured input for shared handlers. Required
mid-operation input/adjudication and cross-user requests use cards. Agents must be able to inspect and
answer the same interactions without rendering them. Short commands can open guided cards; table-state
commands enter their existing workflows, including the staged initiative setup card.

The optional `@Character` prefix identifies the actor; `/family verb` identifies the operation; named
arguments identify targets and options. Authenticated user identity is external to executable text.
The composer supplies the active individual character as an editable default. `@self` resolves to the
selected actor, not the issuer. Ambiguous names need disambiguation before stable instance binding.
Discovery and execution retain existing authority, privacy and lifecycle boundaries, including Director
acting authority and warned departures from game rules.

Contextual triggered-action controls stay on their originating entry. The accepted app closing event is
the triggering creature's turn end, without a clock timer. Source-specific earlier timing and late-response
reconciliation still need contracts. Director result corrections reinterpret the resolution and replace
applied effects once, preserving accepted dice/history and appending adjudication. Undo/redo restores
recorded state without rerunning rules or dice. Detailed dependencies remain open.

The game-log/table interaction surface must expose an extensible API-like boundary for other programs and
services to contribute activity and interactions. Recommended integration uses structured submissions,
provenance, audience and applied-versus-reported state through shared operations. Rendering a line is not
itself effect application. Exact transport and schemas remain open. Future adventure modules may supply
custom handlers through this boundary; runtime, hosting, authoring and packaging are future design, with
no expansion of current core-only scope. See the [extension note](table-command-spec.md#future-adventure-module-extension).

Recommended implementation verification should compare button, palette and headless execution, exercise
request/response without rendering a card, and inspect applied state and ordered attributed history.
Retries and authority changes require checks independently of source-rule semantics. These are future
acceptance checks, not evidence of passing app tests in this documentation checkpoint.

## Standalone engine and portability

The following are proposed design requirements supporting the user's reuse objective:

- Use engine-owned entity identifiers and state contracts. Keep Convex document IDs and application account
  models in the integration layer.
- Define versioned input and output schemas that can cross language and process boundaries. Avoid making a
  host framework's objects part of the public contract.
- Run engine scenarios without Convex, a browser, or a live external service. Keep time, randomness, and other
  environmental dependencies explicit.
- Keep simulation effects separate from prose, animation, rendering, and physical observation. Each consumer
  decides how to present a common result.
- Treat an in-process library and a network API as possible delivery mechanisms for the same semantics. Do not
  require an HTTP call for every future game interaction by definition.
- Preserve Draw Steel spatial units and timing semantics. A future game adapter can map them to its world;
  changes to the actual mechanics belong in an explicit versioned rules variant.
- Target faithful Draw Steel behavior first. Reuse across clients does not require implementing an
  arbitrary-game rules framework now.

Before choosing the engine language, run the same representative scenarios through candidate approaches and
assess correctness, portability, developer tooling, Convex integration, deployment complexity, and measured
response times. Include both computation and any network round trips in latency measurements. Do not choose a
language solely to match the app, or solely because a future game might need it.

## Engine releases and content compatibility

Engine versioning and content declarations are confirmed requirements. The following field names and
compatibility behavior are proposed contracts; illustrative versions below are not existing releases.

Give every distributed engine release a stable version identifying its behavior. Preserve an exact build
identifier for development builds so two changing checkouts do not masquerade as the same tested release.
Version the engine independently of the app, content-pack release, sourcebook edition, and pack file format.
The engine's release contract should identify its supported rules representation and input/output schemas;
retain parser/transformation versions separately where content is compiled before execution.

Each immutable pack release carries engine metadata, for example:

```json
{
  "engine": {
    "builtWith": "1.4.2",
    "testedWith": ["1.4.2", "1.5.0"],
    "compatibleWith": ">=1.4.0 <2.0.0"
  }
}
```

`builtWith` identifies the exact engine used during authoring; `testedWith` lists exact releases actually
tested by the author. Optional `compatibleWith` expresses the author's intended supported range. Do not infer
successful tests across that range or treat an author declaration as app certification or complete automation
coverage. An empty test list means no testing is declared. External content with unknown authoring versions
retains that uncertainty; importing it must not fabricate a tested version. Concrete version/range syntax and
any later app-run verification records remain implementation choices.

Compare these declarations with the actual runtime when preparing content for automated use. Distinguish
declared tested versions, intended-compatible but untested versions, out-of-range versions, and unknown
metadata. Validate supported schemas/mechanics independently; compatible labels cannot make an unsupported
effect executable. A mismatch need not prevent reading or importing the content. Whether it warns or blocks
automated play is an open product decision, with the existing manual-resolution path preserved where
applicable.

Record the exact engine version actually invoked with derived build results and game resolutions, alongside
content and parser versions. A pack's authoring version does not select or install a runtime. Hosting multiple
old engines, pinning an engine per campaign, upgrade timing, and support lifetimes remain open; declaring
compatibility does not commit v1 to those capabilities. Engine upgrades must not recalculate recorded history,
and undo still restores saved state without invoking an old or new engine.

Acceptance examples: export/import preserves declarations; an in-range but untested engine is not labeled
tested; unsupported schemas cannot bypass validation through a claimed version; resolution records identify
the runtime actually used; and an engine upgrade does not change historical outcomes or undo behavior.

## From rules text to executable behavior

The user wants the engine to read stat blocks, identify mechanics, and execute them. Homebrew stat blocks
should work when they use supported Draw Steel wording and formulas. This establishes a controlled rules
language as the intended authoring interface; see [rules language](rules-language.md).

Proposed approach: preserve source text and provenance, parse supported wording into executable definitions,
and resolve actions through a deterministic runtime. Text interpretation and runtime execution are separate
responsibilities. Agents can help implement grammar and mechanics. Any AI-generated content translation
remains a candidate requiring validation and independently grounded examples before use; routine imports
should use the supported deterministic grammar.

An executable definition must preserve prerequisites, choices, timing, targets, conditions, and dependencies;
a searchable text entry or extracted numeric fields alone are not sufficient. Unrecognized mechanics remain
explicitly unsupported rather than receiving a plausible invented interpretation.

Unsupported automation is compatible with continued manual play. Expose complete source text, proposed and
applied effects, and unresolved requirements so a client can show exactly what was handled. Manual completion
and correction must use the same application state/history path, with attribution distinguishing human
decisions from engine output. Resuming automation must account for accepted manual results without applying
completed effects twice. If an unresolved clause could change the correctness of a proposed effect, obtain an
explicit adjudication before committing that effect as resolved.

Supporting arbitrary new prose immediately during play would be a separate, substantially broader requirement.
Do not assume that capability has been promised, or that live model inference is required for ordinary action
resolution.

## Structured effects are the common contract

Prose is one rendering of an outcome. Map integrations should consume typed effects rather than parse
sentences. Retain actor and target IDs, relevant quantities and units, effect ordering, and causal
relationships in those effects.

For the user's illustrative example, an outcome can identify Grug, the goblin, and a three-square forced
movement instruction. A basic client renders a sentence; a map client uses the structured instruction and any
required destination choice. The specific legality and distance in this example are illustrative, not a
verified Draw Steel rule.

Distinguish a movement instruction from a completed movement event. The former tells a participant what
remains to be enacted; the latter records an established result. A client that issues an instruction must not
falsely report that a token has already moved.

## Knowledge of rules and knowledge of the board

An engine can know a rule while lacking the current facts needed to apply it. For example, a client may supply
an attestation that a target is in range without supplying coordinates. Another client may supply positions
and terrain so the engine can calculate the answer.

Represent facts as known, unknown, or explicitly adjudicated, with provenance and a state revision where
relevant. Unknown must not default to false. Disputed or conflicting facts need an explicit resolution path.

Possible inputs include selected targets, positions, terrain, player choices, relevant conditions, and
table-supplied answers to spatial questions. The engine should request only facts necessary for the action
being resolved.

A missing fact can produce:

- A request for more information when it determines legality or a dependent outcome.
- An instruction the table can enact when the unresolved geometry can remain external.
- An explicit adjudication recorded with the resolution when the table settles the question.

Do not silently discard an unresolved spatial consequence. If later damage or another effect depends on where
movement ends, that dependent work remains pending until the necessary facts are supplied. Whether other
effects can commit earlier depends on the verified sequencing rules for that action.

## Proposed resolution lifecycle

1. Receive a command with actor, action, selected targets, content/rules versions, expected state revision,
   available facts, choices, and dice inputs. The application records the actual engine release used;
   caller-supplied version claims do not override it.
2. Validate the supplied inputs and determine remaining requirements.
3. Return a preview or a request for missing facts and choices.
4. Resolve supported mechanics into ordered effects and an explanation of their causes.
5. Commit an accepted effect batch through the application service, validating current state and permissions
   again.
6. Render committed results and pending table instructions for each client.
7. Resume pending resolution steps as further facts arrive, preserving previously accepted choices and dice
   results.

Exact types and transaction boundaries will be designed against verified examples. Do not assume every ability
fits one atomic calculation or that every action requires a confirmation screen.

## Determinism and shared state

- Random results must become explicit recorded inputs. Physical dice and a digital dice service can both
  supply them. The [3D dice roller specification](dice-roller-spec.md) records the confirmed presentation
  boundary: generation and validation stay in shared code/CLI operations; the optional draggable 3D tray
  displays accepted results, and its physics never determines gameplay values.
- Preserve content/rules versions, the exact engine release, relevant parser versions, and input state with
  each resolution so that development reproduction has a stable meaning. History navigation restores recorded
  state without rerunning that engine.
- Give submitted commands stable IDs and make retried commits idempotent. A reconnect or repeated tap must not
  apply damage twice.
- Treat sheets as views of persistent state. Characters are user-owned and have at most one campaign
  attachment; use an independent duplicate or detach before moving between campaigns. Attachment permits
  campaign operations to connect to character values such as Victories and experience. Those campaign values
  clear on detachment and do not transfer to another campaign; retain the character's current level and build
  independently of cleared XP. A duplicate does not change the original's campaign values. Other
  encounter-state boundaries remain to be defined. See
  [attachment requirements](product-features.md#character-ownership-and-campaign-attachment).
- Keep application permissions and authoritative commits outside the pure calculation layer. An engine result
  alone does not grant permission to alter another participant's state.
- Action-by-action encounter undo is required. Historical detail remains preserved across sessions; live
  rollback across a closed-session boundary is unavailable in v1. Correction records, permissions, and
  continuation within an open session remain to be specified.

## History and state restoration

The [data structure and architecture specification](data-architecture-spec.md) is the current
storage/lifecycle checkpoint: an encounter owns its undo journal, an open session is the realtime play
context, and closed-session detail can become a compressed archive. Read-only historical inspection and
activation of past state are separate operations. Closed sessions cannot be reopened or activated for play in
v1.

Campaign characters distinguish the owner's proposed build revision from the effective campaign build.
Admission and full edits need Director approval except for the owning active Director's logged changes; scoped
level-ups do not. History remains available in both cases. Encounter operations update the character's
authoritative main-sheet state immediately. Character editing, progression changes, and build activation are
locked for the duration of the encounter, including while paused. Pre-encounter snapshots support restoration,
not independent play copies. After unlocking, build approval must use current inventory/resources rather than
a stale draft snapshot. See [wizard modes and review](character-wizard.md#wizard-modes-and-campaign-review).

Character progression also requires restorable decision history with a narrower scope: rolling a level-7
character back to their level-3 build restores progression choices and their derived baseline while retaining
present inventory. See [progression history](character-wizard.md#progression-history-and-rollback). The
table-history requirements below still restore the whole affected game state; progression rollback must not be
implemented by navigating backward through unrelated table events.

The game log is a record, separate from the modifiers that produce changes. In the user's terminology, the
rules engine is a deterministic modifier and the dice roller is a pseudorandom modifier. The log records
starting game values, then records each modifier's input before invocation, its returned output, and the
resulting state changes. It must also capture changes from manual adjustments and encounter loading.

Moving backward or forward through this history restores the recorded state immediately before or after an
action. Navigation does not call modifiers, recompute rule effects, or regenerate dice results, even when the
original computation could be reproduced deterministically. The data architecture checkpoint proposes recorded
before/after changes and checkpoints, packaged as lossless archives after session closure; concrete schemas
remain open.

Keep the submitted intent, modifier inputs and outputs, committed state changes, and displayed explanation
distinguishable. Recorded dice results and resolved effects remain stable. Re-running a historical scenario
through modifiers for development is a separate operation from navigating recorded history.

Rollback must preserve consistency across all state affected by the reverted action. Merely applying a numeric
inverse is not generally sufficient to restore removed conditions, replaced values, or other information
discarded during forward execution. The checkpoint's proposed state records must preserve that information;
concrete storage and recovery implementation remains undecided.

The requirement is sequential rollback to a prior point. It does not establish selective deletion of an
arbitrary earlier action while retaining dependent later results. Action boundaries, chat behavior, access to
historical information, and whether continued play retains an alternate timeline remain product decisions. Do
not implement a branching-history system by assumption.

## Future adapters

A digital map supplies positions and other board facts, collects spatial choices, and presents resolved
movement. The engine retains responsibility for interpreting those facts under the rules.

A machine-vision adapter supplies observations with confidence and identity mapping. An observation is not
automatically a legal game action. Ambiguous token identities, unobserved moves, and disagreement with
recorded state need reconciliation before dependent rules resolve.

## App backend

Use Convex for persistent application state and shared client updates. Keep game calculations behind a
standalone engine boundary invoked by the application service. Whether that integration is in-process or
across a service boundary depends on the engine technology evaluation.

The [v1 tech stack](v1-tech-stack-spec.md) records the recommended React frontend, selected Better Auth,
Cloudflare/Convex Cloud hosting, and future home-server/LAN portability. Authoritative calculations should run
server-side while browser interactions remain responsive. Keep the engine runnable on a home server as well
as the hosted deployment; choosing frontend TypeScript does not settle its language/runtime.

Convex provides reactive queries and serializable database transactions. These are a useful foundation for
shared encounters; the application still needs command deduplication, permission checks, and explicit handling
of stale player intent. See [Convex realtime documentation](https://docs.convex.dev/realtime) and
[transaction documentation](https://docs.convex.dev/database/advanced/occ).

Online-first operation does not eliminate transient disconnects. Clients should visibly distinguish pending
commands from committed results and recover without duplicating effects. Full offline play and reconciliation
of independently edited offline encounters are outside the initial requirements.

The active [table baseline discussion](table-spec.md#8-continue-exploring) has established opening, layout
and initiative-group decisions. Reaction prompting, action budgets, group/member timing and detailed
resolution remain open. Existing source notes and prototype behavior do not settle those product/engine
contracts.

## Open decisions

- Degree of automatic application versus preview and confirmation, including triggered choices and Director
  corrections.
- Physical and digital dice workflows.
- Exact user experience during temporary connection loss.
- Initial rules edition, sourcebooks, and first verified content subset.
- Initial supported grammar, handling of official wording variants, and the authoring experience for
  unsupported homebrew.
- Engine language, runtime, and delivery mechanism. Frontend recommendations, confirmed hosting providers,
  and the remaining SSR/deployment choices are tracked in the [v1 tech stack](v1-tech-stack-spec.md).
- Engine release/compatibility policy, handling of untested or mismatched content during automated play,
  upgrade timing, and whether campaigns can select retained engine versions.

The user's spatial architecture is settled intent. These remaining details are not settled by this document.
