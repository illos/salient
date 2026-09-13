# Rules/combat workstream status

Checkpoint: **2026-09-13**. Gameplay design has been consolidated for handoff. This is a documentation
and research checkpoint, not an implemented command system or complete playable combat engine.
The baseline still precedes the rules-tooling pilot and implementation slice. No immediate user answer
is pending. Resume material design questions in groups of three, in plain text.

## Where to read

| Document | Responsibility |
| --- | --- |
| [Table specification](table-spec.md) | Authoritative gameplay, table roles, lifecycle, clock, targeting and history policy. |
| [Commands and action cards](table-command-spec.md) | Shared registered operations, grammar boundary, inputs, continuations and execution checks. |
| [Command reference draft](table-command-catalog.md) | Consistent proposed spellings and argument shapes for the confirmed interactions; no production API claim. |
| [Pre-alpha checkpoint](pre-alpha-design-gaps.md) | Selected v0.01 scope and decision index; fuller research does not expand the milestone. |
| [App build handoff](web-app-build-handoff.md) | Contracts the separate app thread can integrate; no direct contact is claimed. |
| [Decision record](gameplay-decision-record.md) | Original recommendations and user replies, including superseded alternatives. |

## Effective gameplay baseline

- **Opening:** the staged action card is draft until Director OK. OK commits configuration, captures the
  restoration baseline and applies combat locks before initiative. Cancel before OK discards draft
  choices; afterward, use Void keep/reset. Active players and Director may roll; observers cannot.
  The winning side chooses who starts, and the Director may choose on either result.
- **Turns/groups:** successive complete individual turns, explicit Take turn/End turn and player-chosen
  order within combined hero groups. New monsters join this round in a new group at the bottom.
  Director regrouping preserves individual spent turns and separate group completion. Unspent arrivals
  can join active groups but cannot reopen finished groups. Moving the current actor preserves its turn
  and the original group's activation; empty remaining work hands off after required effects finish.
- **Sheet/movement:** detailed sheet with remaining-action indicators; spent-action graying is advisory.
  Ordinary board movement is not recorded. Initial V1 omits I moved/Convert to maneuver buttons.
- **Targeting:** per-user visible selections, actor/target kept distinct. Ordinary single-target actions
  fire when actor/ability/target inputs are ready; self-only supplies self. Multi-select uses checkboxes,
  explicit fire below the maximum and auto-fire at the maximum. Area selection requires explicit fire.
  Firing clears targeting/ability selection; actor switch, cancellation and undo clear drafts. End turn
  and actual target death clear targeting. Additional required choices still use cards.
- **Persistent areas:** register end conditions; cards stack at the log bottom while active. Owner and
  Director update affected creatures immediately, then confirm each firing with the previous selection
  prefilled. Dependent clock work waits. Resolve now handles unobserved triggers. Ordinary missed cards
  have no reminder inbox or resurfacing.
- **Tests/FreePlay:** one-volunteer and one-roll-per-character requests; combat requests expire at round
  end, FreePlay requests at combat OK or session end. FreePlay actor defaults to the viewed sheet.
  Show test difficulty defaults off at campaign level; base roll, modifiers, total and success/failure
  remain public. Per-test difficulty reveal is deferred.
- **Costs:** applicable fixed costs debit automatically when execution is ready; optional pre-resolution
  enhancements use cards unless supplied. Unaffordable abilities are blocked for all callers. Source
  payment waivers and legal negative ranges remain valid; this is not blanket zero-floor validation.
- **Clock:** individual turn/round start/end, enqueue order with save-ends last, specific source ordering
  preserved. Include applicable effects applied before the final save phase. Automatic saves retain
  failed-save hero-token opportunities until another participant starts an individual turn.
- **History:** corrections/undo append entries and preserve originals. Future interpretation uses the
  effective branch. Manual damage overrides survive modifier edits until cleared. Previous turns lock
  against direct changes once the next individual turn starts; rewind intervening history first, even
  for Director edits. Players undo within their turn/current FreePlay stretch and redo recorded results;
  Director rewind reaches any point in the current encounter. New gameplay clears redo availability,
  retaining abandoned history. End-turn/round stamps prevent rerolls or duplicate grants after undo.

The [table spec](table-spec.md) retains exact scope, timing, privacy and source exceptions. Playable
retainers/friendly monsters remain beyond V1; initiative groups are not minion squads. All table controls
use shared registered operations with headless access and attributed, ordered log entries.

## Research and evidence

Draw Steel research is restricted to the pinned local Compendium:
`fb83a789da8f0327a389c277a0c790b1648d5810`. Forge Steel remains at
`5a846aadb623a9855a023e9403bb887a956c341f`. Neither vendor was modified.

- [Command inventory](research/table-command-rules-inventory.md) and
  [targeting cases](research/table-command-targeting-cases.md): representative core coverage across
  nine classes and general rules; not every ability or full automation.
- [Grammar report](research/table-command-grammar.md): accepted syntax, formal EBNF, quoted/stable
  references and a bounded syntax recognizer. Earlier external grammar references are historical
  architectural research; no external Draw Steel source is authorized.
- [Boundary-order synthesis](research/turn-boundary-ordering.md),
  [general-rules report](research/turn-boundary-ordering-general.md), and
  [concrete cases](research/turn-boundary-ordering-cases.md): prior delegated local-source investigations
  found no universal ordering for independent boundary effects. The user selected FIFO/save-last.
- [Essence of Tides investigation](research/essence-of-tides-save-timing.md): prior deep dive recommended
  an immediate first save with moderate confidence; the user later expressly made pre-save-phase
  inclusion a standing app policy. Source ambiguity and product policy remain separate.

The previous checkpoint had independent design audits and 66 syntax cases. This checkpoint's cleanup
uses two lead-agent review passes: decision/source consistency, then grammar/navigation and affected older
specs. It does not claim a new independent agent review or app verification. Final check counts are
recorded in the checkpoint audit below after validation.

## Remaining decisions and next work

Use [the remaining-contract checklist](table-spec.md#8-continue-exploring). Prioritize a sourced ability
walkthrough with optional spending, a triggered response, and correction inside the permitted turn window.
Key gaps are source-specific early trigger timing, conditional cost commitment, same-turn dependencies,
current-actor removal and special extra turns, initial setup roster changes, end-of-encounter ordering,
FreePlay fictional-time/resource reuse and respite. Difficulty-setting changes affecting old entries and
certain private-history projections also remain open. Do not reopen settled defaults from historical rows.

Exact operation schemas, engine runtime, production parser, persistence implementation and installed
review tooling remain separate work. The app thread owns its dirty frontend/backend/config files;
this checkpoint touches specifications and bounded research artifacts only.

## Checkpoint audit

- Completed two lead-agent cleanup passes covering decision/source consistency, command grammar,
  document organization and affected earlier specifications. Updated table/command, access, data/storage,
  engine, catalog, product, rules-language, process and handoff guidance; retained unresolved cases explicitly.
- The bounded syntax recognizer passes **97/97 cases**, including 11 expected parse trees. This validates
  syntax examples, not command semantics or an implemented engine.
- Local documentation validation passes across **50 Markdown files and 973 file/anchor links**.
- `git diff --check` passes. Both vendor revisions remain pinned and their working trees are clean.
- The checkpoint contains documentation, project instructions and research fixtures. App implementation
  changes remain outside this commit; no app tests or deployment were required for this documentation sweep.
