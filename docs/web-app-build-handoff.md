# Web app build thread handoff

The user selected two workstreams: a dedicated thread works through rules tooling and combat behavior with
the user, while a separate app thread reads the specifications, builds the ordinary web application, and
reviews its work autonomously. This handoff records that division; it does not claim either thread has
started or that the application is implemented.

Ready-to-paste assignments: [web app kickoff](kickoff-web-app.md) and
[rules/combat kickoff](kickoff-rules-combat.md). Each includes delegation, review, escalation and
cross-thread coordination instructions. Writing these prompts does not launch their assignments.

Latest specification cleanup: [consistency review](spec-consistency-review.md). Treat the current table
history contract as authoritative over older snippets: committed Director corrections create undo seams;
there is no player End turn exception across them. Deliberately omitted test-request UI remains excluded.

**Readiness-audit G4 resolved, 2026-09-13:** follow the consolidated
[combat acceptance checklist](pre-alpha-design-gaps.md#v001-combat-acceptance-checklist) for required
features and deferrals. It covers ordinary heroes/foes, full opening/turns, targeting, costs, damage,
clock/saves, sequential undo/redo, closeout and basic public direct tests. Complete verbatim used-action
text and actual work remain required in the log. Void while paused is included; dynamic terrain is
explicitly deferred with minions/captains and boss extra-turn mechanics. The checklist also owns the
accepted area/response/optional-spend/test/respite/time deferrals. Keep the basic noncombat table.

**v0.01 foe visibility, confirmed 2026-09-14:** defer hiding and its hide/reveal/Add visibility
controls. All loaded foes are visible in audience rosters, with participating foes visible in
shared setup and initiative. Full stat blocks remain Director-only; health display and Malice
visibility keep their separate policies. Fuller V1 hidden-foe designs below are future scope.
See [the owning contract](table-spec.md#monster-visibility-and-health-display). This records scope,
not an implementation change.

**Edge/bane boundary confirmed, 2026-09-14:** the acting player/Director supplies counts and the
shared roll operation calculates their rules-defined effect and logs inputs/results. Automatic
discovery of every modifier source is not required. Next-attack controls start at zero, accept
inputs before target-completion firing, record them with the accepted attack and reset afterward.
Placement is flexible for playtesting; the proposed game-log card is not mandatory. Preserve the
existing fire behavior. Multi-target attacks must support different counts per target, recorded
with their respective outcomes and cleared after the accepted attack. Composition of attack-wide
and target-specific inputs remains under review. See [the contract](table-spec.md#v001-edge-and-bane-inputs).

**Roll characteristic default confirmed, 2026-09-14:** automatically select the highest permitted
current roll characteristic when the source offers a choice, with a pre-fire override available.
Record the selected characteristic/value. See [the contract](table-spec.md#v001-roll-characteristic-default).

**Current runtime scope, 2026-09-14: game basics first.** Follow
[the owning checkpoint](pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope).
Deliver shared table operations before class/stat-block-specific execution. Unique resource grants,
thresholds, traits and ability effects are manually resolved from source text; the earlier automatic
turn-start Ferocity requirement is superseded. Do not implement deferred interpretation inside UI
components or require the parser to understand every demo ability. Existing experimental code may
remain; its presence is not evidence of an integrated feature.

The shared G4 foundation remains, including dice/actions/known fixed costs, supported generic damage,
clock/save-ends, common Malice lifecycle, Stamina/winded, ordinary-foe Slain at zero, manual adjustments,
persistent source log, sequential undo/redo, closeout and Void while paused. Hero-dying automation and
other G4 exclusions remain deferred. Scope does not mean every general rule is already implemented.

All resources use actual rules and recorded state. The Director edits persistent Stamina, Recoveries,
Heroic Resources, Malice and Victories on sheets/stat blocks/resource displays; each edit appends a
Manual adjustment entry with before/after values. Roll-local artifacts remain distinct. Editable log
inputs exist only in case-specific interactive cards. No artificial test grants or hidden prefills.

**Active integration artifact:** [the draft basic-play walkthrough](v001-basic-play-walkthrough.md)
targets accepted inputs, applied and
manual results, persistence/logging, retries, undo/redo and encounter lifecycle through shared UI and
headless paths. Source-specific feature completeness is not a gate. G1–G3 remain the separate minimal
wizard/derived-baseline/initial-state dependencies; readable class choices and source statistics are
still needed. Preserve existing authority, privacy, pause/closure and history boundaries.

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
| Encounter opening | Draft inclusion/surprise/groups until Director OK. Live roster additions appear included; removals disappear; remaining creatures retain participation/surprise/groups. OK snapshots precombat state, commits and locks party/build edits before initiative. Cancel before OK preserves independent roster changes; afterward use Void keep/reset. Active players/Director roll, observers cannot. Winning side chooses first, with Director control on either result. [Opening](table-spec.md#confirmed-initiative-setup-and-shared-presentation). |
| Character mechanics | Characters follow the same mechanical rules regardless of shared/separate controllers, including dependent consequences and eventual undo policy. Multi-character control changes UI navigation/labels, not rules. Authority and actual-user attribution remain separate. The recipient's follow-up closes the grantor's player undo window; Director rewind must undo the response first. |
| Take turn navigation | A successful explicit Take turn switches the invoking user's player pane/sheet to that character. Existing actor-switch draft clearing applies. Other users' views, passive turn changes and log-card responses do not acquire an automatic-switch rule from this decision. |
| Group/turn state | Each ordinary monster initially has its own initiative group, just like heroes; no automatic grouping by stat block. Minion squads are separate. Individual spent turns and group completion are separate. New monsters get a current-round turn in a new bottom group. Director transfers preserve state; current actor finishes without switching the original active group. Unspent members may join active groups, never reopen finished ones. No remaining turns hands off after current/required work. [Groups](table-spec.md#mid-combat-additions-and-regrouping). |
| Paused rosters | Both party and foes rosters are locked until resume, including session-player/character changes, foe additions/removals, regrouping and saved-encounter loads. Enforce in shared operations. This supersedes earlier paused-edit permission; foes management between sessions and during running combat remains permitted. [Table](table-spec.md). |
| Current-monster removal | Removing an ordinary individual-turn actor finishes that turn and its due work. During a shared squad turn, preserve surviving participants; exact handoff remains open. No separate End turn click. Pausing locks both rosters, so removal must wait until resume; no removal/turn work is queued. [Removal](table-spec.md#mid-combat-additions-and-regrouping). |
| Sheet actions/movement | Sheet-based controls and explicit End turn; spent-action graying is advisory. No ordinary board movement/distance/split-segment logging or initial I moved/Convert buttons. Required nonmovement effects still execute. [Turn UI](table-spec.md#player-sheet-actions-and-explicit-end-turn). |
| Target selection | Per-user visible drafts; target before/after ability. Single/self-only completion auto-fires; checkbox multi-select auto-fires at full count or explicitly earlier. Mapless areas explicitly fire. Accepted clearing rules retain historical targets/continuations. [Targeting](table-spec.md#roster-targeting-controls). |
| Persistent areas | Register end condition, stack fixed-bottom cards, and provide effect-owner/Director controls. Membership edits commit immediately; each firing requires confirmation with prior selection prefilled. Dependent clock work waits; Resolve now supplies unobserved triggers. No ordinary reminder inbox. [Areas](table-spec.md#persistent-area-effect-cards). |
| Ability costs | Fixed applicable costs debit automatically when ready. Optional pre-resolution enhancements use cards unless supplied. An unaffordable ability cannot execute for any caller; enforce current-state checks in shared operations, not only UI. Respect source waivers and legal negative ranges. [Costs](table-spec.md#ability-costs-and-optional-spending). |
| Void while paused | Director may use the existing Void keep/reset operation without resuming. End combat, preserve session pause and its roster lock, and skip normal ending rewards/cleanup. Ordinary gameplay and roster edits remain blocked. [Void](table-spec.md#voiding-an-encounter). |
| Void roster reset | Restore starting state restores combat-start foes membership, identity, relationships and values: remove later additions and restore removed originals. Keep preserves the current roster. This explicit reset also works while paused without unlocking ordinary roster edits. The general reset covers the Director panel's entire gameplay snapshot, including loot/stash state: remove later additions and restore original content; reconcile item locations/claims without duplication. Keep retains both foes and loot. [Void](table-spec.md#voiding-an-encounter). |
| Malice visibility | Show Malice is a persistent campaign setting, off by default, managed by the active Director. Director always sees the current shared pool; players/observers see it only when enabled. Enforce in shared reads/headless access. No resource-rule or used-action source-text change. [Visibility](table-spec.md#malice-visibility). |
| Tests/FreePlay | Deliberately no generic Request test UI/command or response lifecycle; this is not a missing gap. Director asks verbally, players roll directly, and specific actions retain their test steps. Sheet/player pane follows the viewed character. Log cards can act for another controlled character and must clearly label the acting character; no sheet switch is required. Other switching behavior remains open. Record dice/modifiers/total; calculate outcome when difficulty/source context is known, otherwise Director interprets. Show test difficulty defaults off and applies to known values throughout displayed history. Per-test reveal deferred. [Tests](table-spec.md#freeplay-baseline-and-combat-transition). |
| Clock | Individual turn/round events; enqueue order/save-last with source exceptions. Applicable effects applied before save phase join it. Automatic saves leave an optional token button until the next individual turn begins, preserving the response gap after End turn. Required area confirmation waits; optional token choice does not delay handoff. [Clock](table-spec.md#game-clock-and-scheduled-rules-work). |
| Round completion after regrouping | Once all groups finish, advance the round even if an unacted creature was moved into a finished group. It waits for that group's next activation; do not invent a turn, acted flag or individual turn-boundary effects. Active-turn and required-work completion still apply. [Groups](table-spec.md#mid-combat-additions-and-regrouping). |
| Saved encounter preparation | Save deliberate monster initiative groups, minion squads and captain assignments. Reopening, duplication and loading preserve completed preparation; load creates independent live instances and relationships. Ordinary monsters default to individual groups until regrouped; squads remain a separate mechanism. Existing mid-combat turn/group rules still apply. [Saved encounters](monster-catalog-spec.md#user-visible-flow). |
| FreePlay carryover | Resolved FreePlay actions do not consume the new encounter's actions or turns and are not replayed at start. Start from current damage/resource state, then apply source-defined startup rules. Earlier spending is not automatically refunded. [Transition](table-spec.md#freeplay-baseline-and-combat-transition). |
| Encounter closeout | Formal Director closeout UI follows the shared action-card contract. Explicit End combat ends turn structure without finishing the current turn/group/round or firing their boundary effects. It closes unused optional combat responses; already-caused required resolution completes before combat-ending effects/rewards/cleanup. Closeout lists each character's applicable action/effect options for players to review and resolve through labeled log cards; optional effects are not automatically cleared. Source-required cleanup retains its rules. Existing wrap-up returns to FreePlay. Director Finish cleanup closes unused optional cleanup choices after required resolution completes; no per-player ready confirmation or automatic execution of unchosen options. Director grants the Victory amount and recipients at closeout (editable initial 1, including 0); only confirmation commits it, without duplicate grants on finalization/retry. Detailed presentation and source-specific ending order remain open. [Closeout](table-spec.md#formal-encounter-closeout). |
| Prompt windows | Still-valid combat responses remain available through End turn. Next-turn start and explicit End combat close outstanding optional opportunities; an unrelated new ability also closes its actor's earlier unused trigger. Preserve ordered response chains and source continuations. Persistent effects retain their own lifetimes; required unresolved work still blocks dependent progression. [Prompts](table-spec.md#inline-interaction-cards-in-the-game-log). |
| Early trigger closure | An accepted unrelated new ability passes that character's earlier unused optional trigger opportunity. Preparation/refused activation does not. Preserve response chains, new opportunities, explicit continuations and responses to unrelated events. When Thorn commits another action or spends resources granted by the hit, close that hit's response window including his ally's Parry prompt. This is clarified existing precedent, not a separate dependency-repair system. Next-turn start remains the outer deadline. [Prompts](table-spec.md#inline-interaction-cards-in-the-game-log). |
| Resource bookkeeping | Track each grant/spend/reversal's causal event and resolution stage; all applicable spending, feature, usage-limit and history logic must respect grant timing. A later consequence cannot fund an earlier response. This is an explicit player-value priority. [Resources](table-spec.md#ability-costs-and-optional-spending). |
| Minimum required input | Ask only for missing facts/choices needed by the specific action/effect and derive the rest from known state. Use its card/shared headless response; no universal movement report or routine completion confirmation. Detailed responder/correction behavior remains open. [Inputs](table-spec.md#inline-interaction-cards-in-the-game-log). |
| Encounter archive | Finish cleanup, or Void after applying keep/reset, makes the encounter historical and read-only. No gameplay undo can reopen it, undo finalization or cross the boundary, even during the same open session. Current-state adjustments are new events. Storage compression does not define this boundary. [Closeout](table-spec.md#formal-encounter-closeout). |
| Director fine-tuning | Dedicated standalone damage/collision/fall tool is deliberately excluded, not a missing feature. Director uses eligible result corrections and direct live-stat adjustments in monster stat blocks/character sheets through recorded shared operations. Preserve history, archive, session and build-edit boundaries. [Fine-tuning](table-spec.md#director-fine-tuning-and-deliberate-damage-tool-omission). |
| Unsupported-effect completion | Director can mark a specific unsupported effect Resolved at table on its source card through shared/headless operations. Record the manual disposition without reapplying it; other effects keep their own status. Dependent automation still needs resulting state/facts supplied. Not a routine completion click for supported actions. [Cards](table-spec.md#inline-interaction-cards-in-the-game-log). |
| Minion overflow kills | Use the existing inline area/spatial-input card to ask the acting user to assign overflow kills; Director can also respond. Derive the count, collect missing identities and link them to the source action without duplicate damage. Required dependent work waits under existing policy. [Cards](table-spec.md#inline-interaction-cards-in-the-game-log). |
| Special actions and response consequences | Small purpose-specific card UIs collect inputs through shared handlers. Lines of Force reverses invalidated collision damage and resolves redirected consequences, preserving original history and unaffected damage. Later choices/spent resource dependencies remain open. [Sequence](table-spec.md#inline-interaction-cards-in-the-game-log). |
| Corrections | Append correction/undo entries without rewriting originals; use current effective branch. Preserve manual damage overrides through modifier edits. Once later gameplay has committed, older-event corrections require rewind of the entire intervening chain, even within the same turn and for the Director. [Corrections](table-spec.md#director-edits-to-inline-results). |
| Trigger prompt after undo | Authorized sequential undo of a triggered response refunds recorded costs and restores its prompt if still valid in restored state. Preserve original triggering dice, reverse response effects/usage and retain history; no duplicate entitlement or automatic reuse. Redo restores the recorded response. Other required-card recovery remains open. |
| Undo/redo | Players sequentially undo their character's uninterrupted latest actions up to the nearest seam or turn/FreePlay outer limit. Another character's accepted action closes the window, even under a shared controller. Director sequential rewind crosses seams within the current encounter. Automatic consequences stay linked; explicit Redo restores recorded state/dice. New execution resolves current conditions with fresh dice, including turn/round work; no separate reuse cache. Director correction controls handle reroll abuse. Committed Director corrections also create seams; the prior exception is superseded. [History](table-spec.md#undo-permissions-and-proposed-campaign-control). |

Shared operations must recheck role/control, session state, resource payment and historical-edit window,
retain accepted dice/choices and enforce once-only commitment across races/retries. Do not broaden ordinary
rule warnings into blocking, or use the Director doctrine to bypass affordability/history boundaries.
Pinned card presentation can update without mutating its immutable event history. User selection, active
effect membership, group activation and entity turn state have distinct ownership/lifetimes.

Current creature contracts are consolidated in [minion state](table-spec.md#minion-squads-and-captain-state),
[turn entries](table-spec.md#initiative-groups-confirmed-app-model) and
[the clock](table-spec.md#game-clock-and-scheduled-rules-work):

- Turn entries reference shared live creatures. Known recurring and granted turns have distinct entries;
  regrouping moves only the selected entry, never refreshing it or reopening a finished group. Actual
  grants default to a new bottom group unless their source requires immediate timing. Forced normal
  turns consume the normal entitlement; interruptions resume the prior context without another boundary.
- One squad entry defaults to four minions with plus/minus count 1–8. Add a new entry for another squad;
  no live split/merge or refill through that control. The optional captain is additional to eight.
  Members retain individual targets and participation; coordinated targeting assigns up to three per
  target using one squad roll. The captain has its own actions, rolls, costs and Stamina on the shared
  turn. Personal extra captain turns do not refresh the squad or toggle attachment benefits.
- Preserve printed EV/quantity and calculate count × EV ÷ quantity without rounding packs or fractions.
  Saved counts, living membership and pool Stamina are distinct. Multiple turn entries do not multiply
  EV, and the captain contributes separately. Live casualties do not edit saved preparation.
- Bonus loss reduces squad Stamina without casualties; gain applies to survivors without revival.
  Later non-area pool exhaustion defeats the remaining ordinary squad, subject to source exceptions.
  Area damage is finally capped by affected minions’ combined applicable Stamina and cannot kill outside
  its area. Casualty cards collect only missing identities without a second damage deduction.
- Abilities register scheduled effects with the clock, which owns dispatch through shared operations.
  Global work fires once per actual turn, including one shared squad/captain turn; personal effects and
  saves remain individual. A separate captain turn fires again; member selection or resumption does not.

The [checkpoint audit](spec-consistency-review.md#latest-rulings-checkpoint) lists corrected contradictions
and the bounded remaining arithmetic/source questions. Terrain research does not add saved terrain or
expand the ordinary-monster prototype.

Remaining source-specific responses, conditional costs, same-turn dependencies, effect-owner mapping,
source-specific minion exceptions and other gaps are in the
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
one at a time. Research only the pinned local Compendium for Draw Steel content. Recommend
interpretations, keep case rulings scoped, and honor explicitly declared standing policies.
Publish the agreed mechanical contracts and examples for the separate web-app thread to integrate. Keep
working application infrastructure separate from unsettled combat decisions.
