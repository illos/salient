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

_Empty._
