# A03: Table shell and FreePlay basics

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required (direct test rolls, Recovery spending) |
| Depends on | A01, S01; R05 for condition list; R04 for test-roll arithmetic (soft: may land as manual until R04) |
| Unblocks | A04 |
| Status | see `STATUS.md` |

## Goal

Turn the campaign page into the table: the three-pane running-session layout with role-specific panes,
the foes roster and party roster wired to real rosters, the game log with ordered entries, and the
FreePlay operations that have no combat dependency: direct public test rolls, out-of-combat Recovery
spending, manual condition toggles, Director persistent-value edits, Malice display per setting. The foe
hide/reveal code stays in place but dormant, since hiding is deferred and the user chose not to remove it.

## Spec references

- `docs/table-spec.md#1-campaign--session--table`, `#2-participation-and-presence`,
  `#campaign-observers-and-party-chat`, `#director-capability-doctrine`, `#acting-on-behalf-of-a-character`
- `docs/table-spec.md#3-table-surfaces`, `#confirmed-combat-layout` (the same layout hosts FreePlay),
  `#game-log-and-chat-scope`, `#foes-roster`, `#party-sheets-and-resource-visibility`,
  `#public-rolls-and-the-dice-tower`, `#malice-visibility`, `#monster-visibility-and-health-display`
- `docs/table-spec.md#4-session-status-and-play-mode`, `#freeplay-baseline-and-combat-transition`
- `docs/table-spec.md#v001-manual-condition-tracking`, `#v001-catch-breath` (out-of-combat use),
  `#persistent-values-and-manual-adjustment-entries`, `#v001-temporary-stamina`, `#v001-surge-tracking`
- `docs/table-command-spec.md#direct-test-rolls`, `#malice-display-setting`, `#roster-target-selection`
- `docs/character-sheet-spec.md` (heroes pane hosting)
- `docs/v001-basic-play-walkthrough.md#starting-state`
- `docs/pre-alpha-design-gaps.md#direct-tests-and-source-log--confirmed-for-v001`

## In scope

- Route and layout for a running session: Director pane (foes roster, Malice, quick actions), center
  log with command input (from A01), heroes pane (party list for Director showing Stamina, Recoveries,
  Heroic Resource per hero; sheet-dominant pane for players; read-only for observers).
- Foes roster: live instances from the campaign, health display per campaign setting (Bar default,
  Numerical, Winded), Slain marker at zero, full stat block Director-only, used-action text public. Keep
  `setVisible` / `setDefaultVisible` in code but dormant (Q-REC-1 answered 2026-09-14: do not remove):
  no UI control, not registered in the command palette, and every loaded foe is visible regardless of the
  stored flag until V14.
- Party roster: admitted heroes from A02; selected session players choose their characters; Take turn is
  not in this slice.
- Operations (all registered): `/test roll` with characteristic, edges, banes, optional difficulty;
  `/hero recover` (one Recovery, recovery value, no maneuver cost outside combat); `/condition on|off`
  with authority (own heroes for players, all for Director); `/adjust <field>` for Director persistent
  numbers producing Manual adjustment entries; `/campaign malice-visible on|off` (Director only).
- Session gating: gameplay operations require a running session; paused blocks them; closed sessions are
  read-only. Roster lock while paused for foe add/remove.
- Log: ordered entries with user attribution separate from acting character; used-action verbatim source
  text expandable; older-entry paging; reactive updates for all three roles.
- Headless parity: every operation above callable through `pnpm app command`.

## Out of scope

- Combat (A04, A05). Initiative, turns, targeting for attacks.
- Undo/redo (A06); this slice writes journal rows so A06 can restore them.
- Chat (V12), inventory (V07), foe hiding (V14), hero tokens (V15), saved encounters (V06).
- Test-request UI: deliberately excluded; do not add "Call for test".

## Inputs and dependencies

A01 registry; S01 content for foe and hero text; R05 condition list (if R05 has not landed, render the
condition list from a clearly named fixture `fixtures/conditions-pending-R05.json` and replace it in the
same slice before review). R04's test-roll arithmetic: until R04 lands, `/test roll` records dice and
inputs and reports "total pending R04" rather than computing a total; replace before review if R04 is
available.

## Deliverables

- `web/table/**` (layout, panes, log, roster components), routes
- `convex/table.ts` operations listed above; `convex/foes.ts` visibility controls left dormant and
  excluded from the registry
- Tests: authority matrix for every operation across Director/player/observer and session states;
  Malice visibility enforced in query payloads; condition toggle logs before/after; Recovery spending
  arithmetic against R04 examples
- Browser test: three contexts see the same log entry after a Director `/adjust`

## Acceptance checks

1. Observer cannot invoke any operation above (server rejects; UI shows read-only).
2. A player toggles a condition on their own hero and the event shows player attribution and hero
   actor; toggling another player's hero is rejected.
3. With Show Malice off, the player's roster query payload contains no Malice value; on, it does.
4. `/hero recover` reduces Recoveries by one and raises Stamina by the recovery value capped at maximum,
   with both changes in one event's journal rows (read back).
5. A paused session rejects `/test roll` and foe addition; resume allows them.
6. Health display setting changes what the player payload contains (bar fraction vs number vs winded
   flag), not merely the rendering.
7. Every loaded foe appears for all roles even if its stored visibility flag is false; no hide control
   exists in the UI or the registry.
8. Rules reviewer confirms the test-roll total and the Recovery arithmetic against R04.

## Rules research

Covered by R04 and R05. Paths for the reviewer: `rule/health/recoveries.md`, `rule/dice/*.md`,
`chapter/tests.md`.

## Open questions

None known.

## Work log

### Plan (2026-09-14, implementer)

Files: `convex/lib/tableOperations.ts` (operations), `convex/table.ts` (roster query with audience
rules), `convex/lib/registry.ts` (post-event `commit` hook for journaled writes; bare-word arguments
lowered to strings), `convex/schema.ts`, `convex/characterTables.ts`, `convex/foeTables.ts` (live-state
fields and campaign settings), `convex/foes.ts` (every loaded foe listed; paused roster lock),
`web/table/index.tsx` (three panes), `web/foes.tsx` (hide controls removed), `tests/app/table.test.ts`.
Dependencies: A01 registry and S02 journal/dice are real; R04 and R05 are real (no fixtures needed);
A02 has not landed, so heroes are the existing `characters` rows and live state is initialized on
first table use (see the implementation note below).

### Implementation notes (2026-09-14)

- **Hero live state before A02.** `characters.liveState` is now `null | heroLive`. First table use
  writes the R03 literal initial values (temporary Stamina 0, surges 0, Victories 0, XP 0, every
  toggle off) and `null` for every baseline-supplied value (Stamina, Recoveries, heroic resource
  name and current, Stamina maximum, Recoveries maximum), with
  `origin: { kind: 'first-table-use-without-baseline' }`. `/adjust stamina-maximum` and
  `/adjust recoveries-maximum` exist only while `derivedBaseline` is null and are labeled provisional
  in the palette. `/test roll` requires `value=<score>` and records `characteristicValueSource:
  "supplied"`. Question Q-A-200 records the route for the user; no number was defaulted.
- **Command syntax.** The parser reads bare words as symbols; the runner now lowers top-level
  symbols to strings before validation, so `/condition on name=prone`, `/campaign malice-visible
  state=on`, `/campaign health-display mode=winded` and `/test roll difficulty=medium` work from
  the console and the CLI. The spelling `/campaign malice-visible state=on|off` (an argument) stands
  in for the slice's `on|off` path word; `/condition on|off` uses the verb as specified.
- **Foe visibility (Q-REC-1).** `foes.list` and `table.roster` list every loaded foe for every role;
  `foes.setVisible` / `setDefaultVisible` remain in `convex/foes.ts`, unregistered, with no UI control.
- **Foe conditions.** `foes.live.conditions` is optional; absent means every toggle off. The first
  toggle journals the all-off record and then the toggle, so both rows sit under one event.
- **Session gating.** Gameplay operations are `session: 'running'`; the display settings
  (`campaign.malice-visible`, `campaign.health-display`) are `session: 'none'` per the spec's "at any
  time" wording. `foes.add` / `foes.remove` refuse while paused. Closed sessions are read-only through
  `appendEvent`.
- **Heroes pane audience.** The roster returns every hero's live values to every member (the spec's
  party-sheet visibility for players and observers was not narrowed here); the Director's edits and a
  player's own controls are gated by role and ownership on the server.
- **Generated API.** `convex/_generated/api.d.ts` was extended by hand for the two new modules (no
  local deployment in this checkout to run `convex codegen`).

### Verification (2026-09-14)

- `pnpm check`: clean after each commit (lint, engine 51 tests, app+scripts 193 tests, links, vendor,
  content, build).
- `tests/app/table.test.ts` (6 tests): acceptance 1 (observer rejected for every operation; player
  rejected for Director operations; no registered foe-visibility operation), 2 (player toggles prone
  on Thorn: `actorName` Player, `boundActor` Thorn, `data.before/after`, journal rows
  `liveState` then `liveState.conditions.prone` false→true; off: true→false; another owner's hero
  rejected with "do not control"), 3 (Malice absent from the player payload with Show Malice off,
  present when on, absent again when off; Director always sees it), 4 (R04 10.9: max 30, recovery
  value 10; 22→30 healed 8 `capApplied` Q-R-3, Recoveries 10→9, both rows under one event;
  19→29; 30→30 with 0 healed and the Recovery spent; 0 Recoveries blocked; retry spends once),
  5 (paused: `/test roll` and `foes.add` refused; resumed: test roll recorded with the R04 total,
  tier and medium outcome derived in the test from the recorded dice; no outcome without difficulty;
  double bane recorded as a tier shift), 6 and 7 (bar → fraction only, numerical → number only,
  winded → flag only in the player payload, Director full state; Slain at 0; a foe stored
  `visible: false` appears for the player).
- Browser test (three contexts see a Director `/adjust`): **not run**; not verified.
- Acceptance 8 (rules reviewer): pending.

### Unfinished (2026-09-14)

- Browser test for the three-context log update.
- No implementation note was added to `docs/table-spec.md`; the notes above live only here.
- The heroes pane is a resource list with prompted edits, not a sheet; the character sheet spec's
  hosting is not implemented.
- "Show test difficulty" campaign setting (`docs/table-command-spec.md#direct-test-rolls`) is not
  implemented; recorded difficulty is shown to everyone in the log description.
- Independent review and rules review not requested (deferred to the user's audit thread).
