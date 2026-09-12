# Rules/combat workstream status

Checkpoint: **2026-09-12**. The user accepted the human command syntax baseline and requested that the
full design be saved and audited. This is specification/research work, not an implemented command system
or a completed FreePlay/combat baseline. No immediate design question is pending.

## Current contract and handoff

[Table commands and action cards](table-command-spec.md) is the detailed design entry point.
[The table specification](table-spec.md) owns encounter lifecycle, layout, roles and initiative groups.
The [app handoff](web-app-build-handoff.md) communicates settled integration requirements through files;
no direct message to the other thread is implied.

- Every table UI button has a registered palette action, shared with slash text, log/card controls and
  headless callers. All table activity has discrete ordered entries; user actions carry actual attribution.
- Intermediate input/adjudication and cross-user requests use user-aware action cards. Short commands can
  launch guided cards. Combat start uses the agreed staged initiative card. Cards contain no engine logic
  or parsing; the interaction surface supports extensible program/service contributions.
- Accepted human syntax: optional `@Character`, `/family verb`, named arguments, quoted names and target
  lists. Detailed per-operation/API schemas and the wider catalog's command names remain proposals.
- Director authority, warned manual play, privacy and session boundaries remain. Corrections replace applied
  results once and append adjudication; undo restores recorded state. Trigger controls use event-based
  opportunities, with source timing and dependency reconciliation still requiring detailed contracts.
- The mandate applies inside the table. Research breadth does not expand v0.01/V1 scope. Playable retainers
  and friendly monsters stay beyond V1; initiative groups and minion squads remain different concepts.

Rules work establishes the baseline before the tooling pilot or implementation slice. Independent app
work may proceed under its handoff. The rules checkpoint owns these design/research documents and project
guidance; app configuration, persistence and UI implementation belong to the other workstream. This
checkpoint does not audit or retrofit the app. Installed rules skills/review gates remain later work.

## Research and verification evidence

The core corpus remains pinned at `fb83a789da8f0327a389c277a0c790b1648d5810`.

| Investigation | Saved evidence and bounds |
| --- | --- |
| FreePlay and initiative | [FreePlay baseline](table-spec.md#freeplay-baseline-and-combat-transition) and [group source notes](table-spec.md#initiative-groups-confirmed-app-model). Fresh independent research resolved successive ordinary monster member turns in Director-chosen order; combined hero-group timing remains an app decision. Baseline review corrected surprise/authority wording without inventing missing contracts. |
| Command rules survey | [Rules and argument inventory](research/table-command-rules-inventory.md): general rules, nine core classes, representative exceptions, monsters/minions, items, table lifecycle and deferred families. Coverage ledger distinguishes researched cases from unverified full ability coverage. |
| Targeting and continuation | [Targeting cases](research/table-command-targeting-cases.md): target roles, creatures/objects, geometry, shared roll with per-target effects, nested actions, redirection, persistent effects and minion allocation; 49 core-source references. |
| Human grammar | [Grammar report](research/table-command-grammar.md): primary-source comparison, formal EBNF, binding/error rules and guided entry. The baseline is accepted; this is not a production parser. |
| Independent design review | Reviewed source/product separation, stable-reference syntax, staged inputs, duplicate-response identity, case policy and numeric validation versus rule warnings. Findings were corrected and rechecked; bounded review is not engine certification. |
| Syntax validation | [66 syntax/shape cases](research/table-command-syntax-cases.json), including seven expected trees, passed a [bounded research recognizer](research/table-command-syntax-check.py) and independent rerun. This validates bounded syntax only, not machine lowering, game semantics or live application. |
| Card lifetimes | [Lifetime findings](table-command-spec.md#card-lifetime-investigation): Double Strike continuation and group tests can remain actionable; Persistent Magic's later stop is ongoing-effect management. Closing events/current-state checks are recommended; no separate persistent inbox is required. |

## Checkpoint audit

Two independent passes reviewed the saved design: consistency with accepted decisions and source/product
boundaries; then legibility, duplication and navigation. Findings corrected stale syntax sketches, request
scope wording, the unresolved-decisions list and a broken decision table. Both reviewers rechecked fixes
and reported no outstanding blocking findings in their bounded scope.

The final documentation checks cover relative links/section anchors, whitespace and all 66 syntax cases.
Both vendor checkouts are clean at their unchanged pins. These checks do not certify app behavior.

## Remaining work on resumption

Use [the table checklist](table-spec.md#8-continue-exploring) and
[command open decisions](table-command-spec.md#decisions-still-open). Recommended walkthroughs are a
requested test, then a targeted ability with a triggered response and correction. Open-request response
counts, source-specific trigger commitment, dependent correction/undo, combined hero-group turns and
opening commit/cancel remain unresolved. Do not settle them through UI or storage choices. Do not reopen
the accepted syntax, layout, grouping authority or Director doctrine.

## Original recommendations and user decisions

Compact decision trail for this baseline only. User decisions are not standing precedent for other cases.
The owning table spec is the current contract; this record preserves recommendations separately from replies.
The initial discussion below occurred on 2026-09-11; later rows record the 2026-09-12 checkpoint.
Early syntax sketches are historical and superseded by the accepted baseline. Taste-based choices are
not classified as research errors.

| Case | Initial recommendation / user-origin proposal | User's decision |
| --- | --- | --- |
| Work order | Original kickoff put tooling pilot first. | Establish baseline FreePlay and combat specs before the pilot/slice. |
| Entering combat | Explicit Director start, with warnings for harmful FreePlay actions. | Yes; starting an encounter is formalized, beginning with initiative. Exact initiating-action handling stays open. |
| Surprise and opening | Mark surprise before deciding whether a roll is required. | Accepted; Director sees both rosters, toggles individual surprise, excludes nonparticipants, then OK advances to the shared initiative-roll card phase when needed. Anyone may click Roll; observer exception remains unresolved. |
| Starting-side choice | Roll awards players/Director the choice before announcement. | Winner chooses, but Director may choose even when the players win. Preserve actual actor and source entitlement separately. |
| Shared player choice | Any participating player may submit Heroes first / Foes first when players win. | Accepted. |
| Combat layout | Proposed heroes/foes lists with round/turn indicators and log alongside. | Director pane left, game log middle, heroes pane right; role-specific contents. Proposed indicators were not confirmed by this answer. |
| Player left pane | Revealed foes with configured health display. | Enough for now; more detail later. |
| Player right pane | User-origin requirement. | Own sheet dominates; party roster shows Stamina/Recoveries. Horizontal portrait row is provisional. |
| Director panes | User-origin requirement. | Left foes roster with add/remove; right vertical player/hero list with Stamina, Recoveries and Heroic Resources. |
| Initiative groups | User-origin grouping on both sides; research confirmed the book's term and distinguished squads. | Use initiative groups; hero-side generalization is explicit app functionality. Default one group per hero, even with multiple heroes per player. |
| Grouping authority and allies | Director may organize both sides during setup; attached retainers would share mentor group. | Director may combine heroes, keeping one per group default. Defer retainers/friendly monsters beyond V1; preserve extension path and future attachment default. |
| V1 group controls | User-origin clarification. | Director creates monster groups; every hero automatically gets their own group, and only the Director can change hero grouping. No player group-editing controls in V1. |
| FreePlay layout | Keep the same role-specific three-pane table, sheets, rosters and log, with no active initiative or turn tracking. | Accepted as sufficient for now. This does not settle FreePlay action resolution. |
| Test initiation | Support Director-requested tests and player-initiated sheet rolls, retaining recorded inputs/results and Director adjudication. | Accepted: both should be able to roll. |
| Common commands | User proposes a palette covering every game action and registered commands shared with buttons and headless execution; example `@userhandle /test:might+skillname`. | Design exploration requested; exact syntax and resolution contracts remained open at that point. |
| Command actor selector | Distinguish the person issuing the command from the character performing it; a user may control several characters. | Use `@charactername` in place of `@userhandle` to select the acting character. Remaining grammar and name disambiguation were open at that point. |
| Command attribution | User requests attribution to the invoking user as well as the character, suggesting `joe@Thorn /skill`. | Record both identities. Combined notation was provisional; recommendation was to supply issuer identity from authentication and display it with the actor. |
| Contextual command actor | User requests automatic `@Thorn` when typing in the game log during Thorn's initiative turn. | Populate the acting-character selector from the individual turn context; preserve actual issuer attribution and existing control permissions. Defaults outside that context remain open. |
| Editable actor selector | Keep the turn-default character editable for reactions and Director actions involving another character. | Accepted. |
| Requested-test card | User proposes `@director /callTest:might@thorn` to create an inline log card with a player Roll button and optional agreed skill +2. | Record as the proposed interaction; grammar, difficulty handling and request lifecycle remained under discussion at that point. Shared headless response and named-skill recording are lead recommendations. |
| Table interaction foundation | User asks to enshrine registered actions, ordered attributed log entries and user-aware action cards for input/adjudication and cross-user requests, sharing execution with all UI buttons and headless callers. | Required inside the table. The user explicitly clarified that this is not an app-wide mandate. Exact grammar and unresolved mechanics remained open at that point. |
| Guided/table-state actions | Short commands can collect complex options in a GUI card; combat start is also a command. | Confirmed. The agreed initiative workflow lives in a staged action card. |
| Card logic and extensions | Cards present input/results; modules could provide custom handlers. | Cards contain no parsing or engine logic. Extensible program/service contributions are required; adventure modules remain future design. |
| Human syntax, 2026-09-12 | Optional actor prefix, `/family verb`, named arguments, quoted names and target lists. | Accepted as the clean, extensible baseline. Detailed operation schemas and unresolved mechanics remain separate. |
| Checkpoint, 2026-09-12 | Save the full conversation and audit for consistency and legibility. | Documentation checkpoint; no implementation or immediate follow-up question requested. |
