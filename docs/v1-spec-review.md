# V1 specification coverage review

Reviewed 2026-09-10 against the local project instructions, [feature outline](product-features.md), all five
`*-spec.md` documents, engine/rules-language design, supporting character/content/storage research, and the
implemented combat experiment.

**Assessment: enough specification to start useful implementation slices; not yet enough to treat the full
outlined app as a settled v1 build.** The architecture and several individual workflows are substantial. The
largest remaining gap is the operational play loop connecting characters, encounters, sessions, and ongoing
resources. Some other outline features have barely progressed beyond an inventory entry.

This is a review and a proposed order for further specification, not new accepted requirements, a reduction of
product scope, or authorization to implement/deploy. It assesses this checkout; UI work in another thread is
not evidence of delivered behavior unless present here.

## Current status

This review records the original gaps found before the 2026-09-11 product walkthrough. Its findings below
are historical, not the current list of unanswered product questions. The
[consolidated v1 checkpoint](v1-spec-checkpoint.md)
now records agreed scope, links to the cleaned primary specs, and lists the remaining rules, lifecycle and
implementation work. Use that checkpoint when resuming; do not repeat questions already settled there.

## Coverage against the outline

“Substantial” means useful requirements, contracts, and acceptance examples exist; it does not mean every
proposal is accepted or the feature is implemented.

| Outline area | Specification coverage | Remaining work affecting v1 |
| --- | --- | --- |
| Accounts and settings | Substantial in [access spec](accounts-and-access-spec.md#3-authentication-investigation) | Settle admin requirements and choose auth through the proposed account-flow spike; define account/campaign end-of-life behavior. |
| Friends, requests, blocking | Substantial proposed lifecycle in [access spec](accounts-and-access-spec.md#4-friendship-and-blocking-foundation) | User lookup, notifications, and the relationship between blocking, campaign bans, and existing shared play. Friendship is explicitly early scope. |
| Campaign discovery, admission, roles, sharing | Substantial in [access spec](accounts-and-access-spec.md#5-campaign-discovery-requests-and-blocking) | Final game-operation permissions, single-session policy, privacy, Director self-review, removal during play, and campaign lifecycle. |
| Character creation, editing, progression, review | Substantial in [wizard spec](character-wizard-spec.md) | Supported classes/levels, progression eligibility, resource reconciliation, inventory operations, and remaining review/transfer policies. |
| Forge Steel import / desired export | Detailed researched adapter boundary | Actual supported file shapes and conversion examples remain unproven. Import is required; compatible export is desired rather than a promised first-release deliverable. |
| Shared table, chat, playable sheet, action resolution | Strong intent and architecture; incomplete product operations | A participant/Director walkthrough, turn and action controls, manual completion, visibility, chat behavior, and session entry/exit. |
| Encounter builder and running encounters | Partial; catalog and data specs cover selections, squads, snapshots, and storage | Preparation inputs, encounter budget/difficulty behavior, supporting fields, control/reveal rules, start/end transitions, reinforcements, and outcomes. |
| Persistent resources and noncombat play | Data boundaries exist; actual workflows are thin | Recovery/respite, encounter rewards, XP/Victories, inventory changes, basic tests, and the supported between-encounter loop. |
| Public Foes reference | Substantial in [catalog spec](monster-catalog-spec.md) | Confirm initial categories and readable coverage. The proposed 409 standard foes are not all 527 audited stat-block files. |
| Public Rules and Items references | Mostly outline-level | Define browsable content, search/filter needs, linked-rule reading, and item-to-inventory interaction. The common pack model supplies storage direction, not those complete flows. |
| Monster builder / homebrew | Parser and pack foundations; authoring workflow thin | Create/edit/preview/save, supported fields and formulas, diagnostics, revisions, sharing, and selecting the result in an encounter. |
| Content packs and source selection | Substantial proposed common model | Release scope for tooling, source-management permissions, retained progression, private-pack access, and version mismatch behavior. |
| Undo, sessions, archives | Substantial storage/lifecycle design | Undo authority and action boundaries, new play after rollback, pending work at closure, cross-session restoration, and historical visibility. |
| Statistics | Preserved facts and storage direction; metric behavior exploratory | Decide whether dashboards ship in v1; define counting and rollback treatment only for included metrics. |
| Optional 3D dice | Substantial adaptation spec | Shared roll implementation and visual feasibility remain future work. The optional renderer is not necessary to establish playable shared dice behavior. |
| Mobile app delivery | Platform intent and some interaction requirements | Settle first delivery target, frontend/engine integration, and a small app-wide navigation/onboarding flow as implementation begins. |

## Highest-priority gaps

### 1. The table needs an operational specification

The [outline](product-features.md#the-table-the-heart-of-the-app) calls the table the heart of the app. The
engine explains how a supplied action resolves, and the data spec explains how its results persist. Neither
fully specifies how people run a session through ordinary app controls.

Define opening/joining a session, selecting participating characters, loading and starting an encounter,
choosing the acting hero or monster group, start/end-turn operations, ability/test/free-roll inputs, reactions
and missing facts, manual completion/correction, encounter completion, and session closure/resumption. Decide
which actions can proceed while another resolution is pending. This can be specified independently of exact
screen layouts.

The manual path needs enough operations to cover the declared playable scope. In the prototype, `ManualChange`
supports selected counters/conditions but not a general inventory, entity-creation, or turn lifecycle. Calling
unsupported mechanics “manual” does not by itself provide a way to represent every resulting state change.

Evidence: the [two-round playtest](playtest-1.md#findings-for-the-engine-and-ui-threads) needed six supporting
manual operations for four ability attempts. `needs-input` can describe either no applied effects or applied
damage awaiting movement; clients must present the actual resolution state. These findings identify concrete
product work, not a requirement to finish all automation first.

### 2. Define what happens between encounters and sessions

Persistent resources are central to the product, but their data containers are specified more clearly than
their lifecycle. Session closure already explicitly does not inherently reset resources or finish an
encounter. The app still needs rules-grounded operations for the included recovery/respite, encounter-end
rewards, XP/Victories, and ongoing condition/resource behavior.

Create a compact resource-lifecycle table: each included value, its scope, what changes/resets it, who may
initiate the operation, and how it is recorded. Include what happens when a build changes its maxima or
resource types. Explain advancement after campaign XP clears while the retained level remains, an explicit
[wizard open decision](character-wizard-spec.md#12-open-decisions).

Basic noncombat tests and manual state changes need a declared v1 path. Dedicated negotiation, montage, and
downtime/project interfaces have been considered in
[research](research/README.md#peripheral-systems-keep-the-decision-open), but not specified as complete
workflows. Decide their release treatment explicitly rather than assuming all are either mandatory or absent.

### 3. Encounter preparation is only partly covered by the catalog spec

Independent snapshot loading, minion squad state, captain relationships, and shared Malice are already
examined. The missing work is the builder and run lifecycle around them.

Specify the saved encounter's supporting data; whether it targets a party, computes a rules-grounded
budget/difficulty, or initially accepts manually prepared selections; preparation of squads/captains/variable
stats; editing and reuse; who loads and controls it; and adding/removing creatures after play starts. Define
which outcomes finish an encounter and what that operation changes. Any suggested notes, terrain, objectives,
or waves should be selected as scope, not silently added as requirements.

### 4. Inventory, Rules/Items browsing, and homebrew authoring remain underexamined

Inventory appears repeatedly as independent item instances that survive progression restoration, but there is
no complete acquire/use/equip/remove/transfer workflow or settled ownership-versus-Director editing policy.
These operations affect the sheet, resource state, review, and undo, so inventory needs more than a list
field.

Rules and Items are explicitly public tools in the [outline](product-features.md#public-reference-libraries),
yet lack the Foes library's concrete browsing and acceptance flow. They can have a small first scope.

The monster builder likewise needs an author-facing path from supported stat-block text and fields to a saved,
previewable monster that can be used in an encounter. Pack/version/parser architecture does not settle that
interface or private sharing. A full community marketplace is not an established requirement.

### 5. Resolve the policies that otherwise force incompatible implementations

These are mostly acknowledged questions in existing specs, rather than unexplored architecture. Settle them
alongside the relevant operations:

- One open session/table policy and protection against competing writes to the same character.
- Who controls monsters, corrects another character, awards resources, closes sessions, and performs undo.
  Campaign ownership, Director authority, and character control are deliberately distinct.
- What players can see of monsters, other sheets, rolls, and history; owner-private notes; what access remains
  after departure.
- Review of the active Director's own character.
- One undo step when reactions/manual completion intervene; new play after undo; pending actions at session
  closure; whether earlier sessions can be restored live.
- State reconciliation when a build changes or a member/character leaves during active play.
- Private homebrew use/retention and who can change campaign sources.

These influence both data and behavior. Choosing an archive codec or a frontend component library has much
less effect on whether two implementers build compatible features.

## Cross-spec mismatches and omissions to address

1. **No release-wide scope agreement.** The outline explicitly is not a release plan. There is no agreed list
   of included classes/levels/sourcebooks, readable monster categories, automated mechanics, manual workflows,
   or included authoring tools. The Fury example is a first slice, not the definition of v1.
2. **Companion-dependent classes cross workstream boundaries.** The wizard inventories Beastheart and Summoner
   while the catalog proposes first covering 409 standard Monsters-book foes and deferring other adapters. If
   those classes are included in v1, companion/summon creation, ownership/control, scaling, and live state
   need a supported path. This dependency should be part of the coverage decision.
3. **Cross-session undo has stale supporting language.**
   [Development process](development-process.md#headless-development-workflow) still says to verify
   restoration across session boundaries unconditionally; the newer data checkpoint leaves live undo across
   closed sessions open. Align that acceptance language before implementation. Retaining history is already
   required.
4. **The experiment's history restriction is provisional.**
   [Milestone 1](milestone-1.md#first-supported-slice) refuses new actions while the cursor is in the past and
   calls this an experiment choice. It cannot silently become the permanent answer to continuing play after
   undo or progression rollback.
5. **Some research still speaks prospectively about the first experiment.** The rules-language proof section
   and initial research should point readers to the implemented milestone so future work does not repeat
   feasibility work. They remain useful historical evidence.
6. **No whole-app acceptance journey.** Individual specs have strong examples. A release test still needs to
   connect account creation, campaign membership, character admission, encounter preparation/play, persisted
   resources, and the next session through the same operations.

## Proposed next specification pass

Keep this small: one v1 scope page, one table/session operations document containing the resource lifecycle
and permission matrix, and short additions for encounter preparation, inventory/public references, and monster
authoring. Reuse the existing architecture instead of designing a second persistence or rules system.

Use this proposed acceptance journey to expose missing decisions:

1. Two users sign in; create a campaign with selected sources; request and approve membership.
2. Create or import a supported character, obtain Director admission, and open its effective play sheet.
3. Prepare and save an encounter, load its independent snapshot, and start shared play.
4. Resolve an automated action and a manual action with any required choice/reaction, verify both users see
   the same committed state, and correct/undo through the agreed policy.
5. Disconnect and reconnect without duplicate effects; finish an encounter and perform the included
   reward/recovery/inventory operations.
6. Close the session, read its history, and begin the next session with the correct surviving state. Exercise
   an encounter spanning sessions if the proposed resume behavior is included.
7. Advance a character through the scoped level-up flow; submit a separate full edit and verify it remains
   isolated until approved.

The exact coverage is for product agreement. Foundation work can proceed while these details are settled;
there is no need to specify every future ability, screen, or database index before starting.

Candidates for explicit deferral are the optional 3D tray, advanced statistics dashboards, full pack
exchange/publishing tools, desired Forge Steel export, and dedicated noncombat subsystem interfaces. Those are
recommendations, not scope changes. Full automation, a digital map, machine vision, and full offline play
already are not prerequisites for the initial companion. Basic usable manual play and persistent state remain
central.

## Implementation evidence and limits

This section describes the 2026-09-10 checkout. A working pre-alpha web app now exists; see
[app status](workstream-app-status.md) for current evidence.

`npm run check` passed during this review: TypeScript checking and all 28 behavior tests. The code
demonstrates selected sourced abilities, some squad/resource behavior, manual changes, file persistence,
command deduplication, and exact recorded-state navigation.

The local application code still consists of `content`, `parser`, `engine`, `contracts`, `history`, and `cli`
modules. It has no frontend, Convex backend, accounts, multiplayer authorization, character wizard, catalog
importer, or random dice service. The passing checks establish the bounded experiment, not v1 readiness. No
human table playtest is recorded in the reviewed evidence.

This review does not revalidate external auth-library claims, source-distribution permissions, or the
semantics of the full rules corpus. Those are separate implementation/release checks; the existing specs and
notices already identify them.
