# Table command reference draft

Checkpoint **2026-09-13**. The command language and gameplay behaviors below are confirmed; additional
operation spellings and field schemas are a consistent **proposed reference**, not a frozen production
API or implemented registry. The common accepted spellings are `/ability use`, `/test roll`,
and `/encounter start`. The [command spec](table-command-spec.md) owns execution;
[the grammar](research/table-command-grammar.md) owns parsing. No new punctuation language is needed.

## Command form and value types

```text
[@Character] /family verb name=value ...
```

Square brackets here mean the actor prefix is optional; literal lists appear only in argument values.
Commands contain one operation, named arguments and typed values. Field order is insignificant, list
order is retained, and duplicate fields/record keys are errors. Strings use JSON double-quoting/escaping.
References use `@Name`, `@"Display Name"`, or `@{kind:id}`. `@self` resolves to the selected actor in target
fields, never to the authenticated user. Booleans, numbers, null, lists and records are distinct values.
No shell expansion, arbitrary arithmetic, pipes, scripts or multi-command separators are supported.

The authenticated issuer is supplied outside command text. The sheet and player pane use the viewed
character. Game-log cards can act for another controlled character, clearly labeled before interaction;
they use that bound actor without requiring a sheet switch. Other switch prompts/automatic sheet changes
remain open. Headless calls supply explicit actor context; explicit actor
prefixes retain their meaning. Viewing a sheet or supplying an ID never grants authority.

When the session is paused, shared operations reject changes to either roster, including player/character
selection for session membership, foe additions/removals, regrouping and saved-encounter loads. Resume
restores otherwise-permitted edits; combat still locks the party roster. Foes management between sessions
remains available. This membership lock does not prevent viewing sheets or switching the viewed sheet.

## Selection, turns and groups

| Proposed input | Meaning and constraints |
| --- | --- |
| `@Thorn /actor select` | Change this user's acting character; clear their pending ability/targets. |
| `/target toggle target=@Goblin5` | Select a target or toggle checkbox membership in multi-select mode. Ordinary single selection transfers. If this completes an otherwise-ready ability, invoke its shared execution once. |
| `/selection cancel` | Cancel this user's un-fired selection and clear targets; invalidate its pending interaction. |
| `@Thorn /turn take` | Begin an eligible individual turn and its group under current side/group rules. Successful explicit Take turn switches the invoking user's player pane to Thorn. Director equivalent remains. |
| `@Thorn /turn end` | End the individual turn, including early; process required clock work before handoff. |
| `/group create side=foes members=[@Goblin5,@Goblin6]` | Director creates a group; no merging of creature state or minion-squad semantics. |
| `/group move turns=[@{turn:goblin5-1}] group=@{group:blue}` | Director moves selected turn entries, preserving their spent state, linked creature identity and interrupted/active-group context. Other entries for the same creature stay put. Squad membership does not change. |
| `/foe add source=@{monster:core-goblin-warrior}` | Illustrative bound catalog source. Mid-combat addition defaults to a new group at the bottom with a current-round turn available. Outside combat this is roster management. |

The catalog's source IDs and choice labels are illustrative, not claims about actual stored IDs. Group
completion and spent state of each turn entry remain separate; shared squad entries additionally retain member participation. An unspent arrival joins a still-active
group but does not reopen a finished group. No remaining turns causes handoff after current/required work.
When all groups finish, advance the round even if an unacted arrival remains in a finished group;
it waits for its group's next activation, without a fabricated turn or acted status.

## Abilities and requests

| Input | Meaning and constraints |
| --- | --- |
| `@Thorn /ability use ability="Brutal Slam" targets=[@Goblin5]` | Accepted common form; resolve the bound ability with target/fact/cost validation. |
| `@Elwin /ability use ability="Healing Grace" targets=[@self]` | Self reference supplied explicitly; a source self-or-ally ability is not automatically self-only. |
| `@Thorn /ability use ability="Lines of Force" trigger=@{event:e12} choices={"extra-distance":true}` | Proposed choice/trigger fields; costs and timing come from the source. Missing required facts use cards. |
| `@Thorn /test roll characteristic=might skill=climb` | Accepted direct-test form. Retain skill identity, modifiers, dice, total and resolved outcome. |
| `@Thorn /card respond card=@{interaction:c18} answer={"roll":true}` | Proposed generic response; the identified step determines scope, response count, available fields and expiry. |
| `@Thorn /save roll effect=@{effect:e7}` | Proposed manual save invocation for a specific effect. Ordinary due save-ends rolls are automatic clock work, not a required user command. |

**Deliberate scope decision:** generic Director test requests are intentionally omitted for now, not
an unanswered specification gap. Do not reintroduce the UI, command or request lifecycle as missing work
without a new user decision. Verbal requests and direct character rolls are the selected flow; tests
required by specific actions may still use those actions' cards.

Ordinary tests need no formal request. The Director asks verbally, and a player invokes `/test roll`
from their character. Generic Request test UI/commands, response modes and request lifecycles are removed
from scope for now. Source-specific actions can still supply their own linked test steps.

The campaign's Show test difficulty setting defaults off and applies to known difficulty values in all
displayed test entries, including history. Show dice, modifiers and total; show a calculated outcome when
the app knows the difficulty or source outcome table. Otherwise leave interpretation to the Director.
Per-test difficulty reveal remains deferred. Do not invent missing difficulty or narrative consequences.

## Persistent effects and continuations

| Proposed input | Meaning and constraints |
| --- | --- |
| `/effect targets effect=@{effect:e17} targets=[@Goblin5,@Goblin6]` | Update an active area's affected-creature list. This is not a firing or confirmation by itself. |
| `/effect resolve effect=@{effect:e17}` | Resolve now: surface the current firing's confirmation for an externally observed trigger. Retain prior selection as defaults. |
| `/card respond card=@{interaction:c17} answer={"targets":[@Goblin5],"confirm":true}` | Confirm one identified due firing. The interaction binds its source effect, event/window and allowed responder. |
| `/card respond card=@{interaction:c17} answer={"targets":[],"confirm":true}` | Structurally expresses no affected creatures. Whether this is a valid response depends on that source/step; no generic new gameplay rule is established. |
| `@Thorn /card pass card=@{interaction:c19}` | Proposed decline for a step that supports declining; not permission to skip mandatory work. |

Clock events and effect end conditions are registered engine/operation data, not scripts embedded in a
card or free-form commands parsed on each tick. Fixed-bottom cards stack while their area remains active;
they are projections of ordered creation/update/response records. New due confirmations are required even
when membership is unchanged. Pending dependent work waits. Each firing has its own opportunity identity;
retries are not extra activations. Ordinary cards do not acquire persistent pinning or reminder controls.

## Encounter and history operations

| Input | Meaning and constraints |
| --- | --- |
| `/encounter start type=combat` | Accepted common form: opens draft setup, without initiative dice or combat locks yet. |
| `/card respond card=@{interaction:setup1} answer={"confirm":true}` | Proposed representation of Director OK. Commit participants/surprise/groups, snapshot precombat state and lock combat edits before initiative. |
| `/card respond card=@{interaction:initiative1} answer={"roll":true}` | Active player or Director; observers cannot roll. One accepted roll across races. |
| `/card respond card=@{interaction:side1} answer={"side":heroes}` | Eligible winning-side player or Director; the Director may choose regardless of winner. |
| `/encounter void state=keep` | Proposed spelling for confirmed keep-current void. |
| `/encounter void state=restore` | Proposed spelling for confirmed restore-starting-state void. No ordinary draft Cancel after OK. |
| `/action correct event=@{event:e24} effect=@{effect:damage8} value=10 reason="Director adjudication"` | Append a manual result correction; preserve original records and applicable overrides. Prior-turn changes require rewind first. |
| `/history undo event=@{event:correction25}` | Append reversal restoring the preceding effective result. Event identifies the intended undo unit; it does not grant selective removal across intervening dependencies. |
| `/history redo event=@{event:undo26}` | Restore recorded results/spending without dice or rule reruns, within available history. |

A correction's new entry supplies the effective current result, without rewriting the old entry. Undoing
an adjudication does not undo its source ability. Once later gameplay has committed, edits to an older
event are blocked until the entire intervening chain is rewound, including within the same turn. Director range remains the current encounter;
player range is the uninterrupted latest actions of their character up to the nearest action seam,
with turn/FreePlay-start outer bounds. A committed Director correction creates a seam too. New gameplay clears redo availability while keeping
abandoned history. Explicit Redo restores recorded dice and consequences. New executions resolve current conditions
with fresh dice, including turn/round work, without a separate result cache. Director correction controls
handle reroll abuse under the established history boundaries.

## Shared execution contract

Parsing produces actor/path/typed arguments; schema lookup and binding resolve registered operation,
visible entity/source IDs and step-specific fields. A short valid command can open guided input. Preparation
must not silently spend, roll or apply effects. Buttons and CLI responses call the same operation.

Before committing, check current authority, lifecycle, history window and source-legal affordability.
Unaffordable ability execution is a hard block, not a parser error or warning-through path. Legal payment
waivers and negative ranges remain representable. Fixed applicable costs debit once at execution;
optional pre-resolution spending must be chosen. Later conditional costs preserve their source timing.
An older-event edit after later gameplay similarly fails the history-window check until sequential
rewind, even within the same turn and even if the command is syntactically valid.

Log accepted operations and their consequences discretely, with user/source attribution, ordered identity,
original inputs and before/after state. Active card projections may change; historical records do not.
Do not infer a public API transport, production schema version or actual engine support from this reference.
