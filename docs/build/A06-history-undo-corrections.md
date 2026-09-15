# A06: History: undo, redo and corrections

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required (seam semantics affect mechanical outcomes) |
| Depends on | A04; A05 for the correction-window integration |
| Unblocks | A07, A09 |
| Status | see `STATUS.md` |

## Goal

Implement the confirmed history model over the S02 journal: player sequential undo of their own
character's uninterrupted latest actions to the nearest seam with turn start or FreePlay stretch start
as the outer limit; Director sequential rewind across seams within the current encounter; exact Redo
restoring recorded state and dice; new gameplay after undo clears redo while retaining abandoned
history; corrections and undo as appended entries; the campaign "Enable user undo" setting; and the
archive boundary that nothing crosses.

## Spec references

- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control`
- `docs/table-spec.md#director-edits-to-inline-results`
- `docs/table-spec.md#inline-interaction-cards-in-the-game-log` (trigger prompt after undo; not required
  in v0.01 beyond restoring a still-valid card)
- `docs/table-spec.md#formal-encounter-closeout` — archive boundary.
- `docs/table-command-spec.md#inline-corrections-and-history`
- `docs/data-architecture-spec.md#5-encounter-actions-and-undo`
- `docs/engine-architecture.md#history-and-state-restoration`
- `docs/pre-alpha-design-gaps.md#undo-and-redo--confirmed-for-v001`,
  `#damage-and-corrections--confirmed-for-v001`
- `docs/v1-spec-checkpoint.md#loot-and-history`
- `docs/development-process.md#headless-development-workflow` — restore without rerunning rules or dice.

## In scope

- Seam computation from the journal: another character's committed action, a committed Director
  correction or adjustment, turn start, FreePlay stretch start, encounter archive.
- `/history undo` for players: only the latest own-character command unit, only if no seam intervenes;
  restores every journal field from before values without rerunning the engine or dice; appends an
  `undone` event linked to the original; clock registrations and participation restore with their cause.
- `/history rewind` for the Director: sequential across seams within the current encounter, one unit per
  call, never into an archived encounter.
- `/history redo`: restores the recorded path exactly, including dice; unavailable after new gameplay.
- Correction entries from A05's post-roll card use the same window check: acting player until the next
  actor's turn start and no intervening seam; Director always, subject to the full-rewind rule for older
  events once later gameplay has committed.
- Campaign setting "Enable user undo" default on; off removes player undo/redo and post-roll edge/bane
  corrections (Q-A-601), preserves Director history/correction authority, and never
  affects inventory (none exists yet).
- Log presentation: undone entries stay visible and marked; the effective branch is what rules use.
- Headless parity; tests are the main deliverable.

## Out of scope

- Inventory undo (V07). Progression history (V08). Trigger-prompt refund cases beyond restoring a
  still-valid card (V04).
- Reopening archived encounters: forbidden by contract.

## Inputs and dependencies

S02 journal; A04 turn boundaries; A05 correction card (soft: this slice ships the window check as a
library function A05 calls).

## Deliverables

- `convex/lib/history.ts` (seams, window checks), `convex/history.ts` operations
- `web/table/history-controls.tsx`, log markers
- Tests: each seam type blocks player undo; Director crosses it; redo exactness including dice; new
  gameplay clears redo; archive boundary; setting off; undo of a costed ability refunds the recorded
  cost; undo of damage restores temporary Stamina and Stamina and Slain flag together

## Acceptance checks

1. Player attacks, then undoes: foe Stamina, hero resource and the ability's action use all return to the
   before values in one operation, read back; the original event remains with disposition undone.
2. Player attacks, another player acts, first player's undo is rejected with the seam named.
3. Director rewinds both in order; a rewind attempt past the encounter start is rejected.
4. Redo after undo restores the same dice values and outcome; after a new attack, redo is unavailable.
5. Turn start blocks undo of the previous turn's action for the player; Director rewind still works.
6. With "Enable user undo" off, player undo/redo and post-roll edge/bane corrections are rejected;
   Director rewind/redo and corrections remain available under their existing limits (Q-A-601).
7. Post-roll bane addition by the acting player succeeds before the next actor's turn starts and is
   rejected after.
8. Rules reviewer confirms that no restoration invoked the engine or the dice operation (assert by
   counting dice events).

## Rules research

None beyond the confirmed rulings; the reviewer checks the seam semantics against the table spec, not
the Compendium.

## Open questions

None known.

## Work log

### Plan (2026-09-14, implementer)

Files: `convex/lib/history.ts` (gameplay-unit classification, the history walk, seams and windows,
restoration, the correction-window check, the registered `/history undo|rewind|redo` and
`/campaign user-undo` operations), `convex/history.ts` (`history.status` read), `convex/historyTables.ts`
(`historyAliases`, spread into `convex/schema.ts`; the `enableUserUndo` settings field is the only other
schema edit), `convex/lib/registry.ts` (registers the operations; stamps the session's current
encounter on user events), `convex/lib/audience.ts` and `convex/table.ts` (setting default and roster
validator), `web/table/history-controls.tsx` and `web/table/index.tsx` (log markers, inline Undo),
`tests/app/history.test.ts` with `tests/app/fixtures/costedAbility.ts`. Dependencies: S02, A01, A03 and
A04 are real. A05 is soft: attack events do not exist in this checkout, so the costed-ability and
damage checks run against the fixture operation `fixture.strike` (registered only from the test
process), whose journal rows mimic the expected A05 shapes: a user head event carrying the accepted
dice and a resource debit, plus one engine-origin consequence event under the same command key
journaling the target's temporary Stamina and Stamina. A05 replaces it with the real operations.

### Implementation notes (2026-09-14)

- **Units and the walk.** A unit is a user-originated gameplay event (its head) plus every event that
  shares its scoped command key (S02's undo unit). `walkHistory` replays the session's events in
  sequence: a gameplay head joins the effective branch and clears the redo path; a `history.undo` /
  `history.rewind` entry pops the branch onto the redo path; a `history.redo` entry pops it back.
  The walk is pure over the event list and is verified against synthetic journals. Event kinds in
  `NON_GAMEPLAY_KINDS` (notes, settings, session lifecycle, card open/close) and
  `ENCOUNTER_LIFECYCLE_KINDS` (setup draft, OK) are not units and create no seams; A07 adds its
  closeout/void kinds to the lifecycle set.
- **Scope and floor.** History works on the running session. In a committed encounter the floor is
  the OK event (found through the precombat snapshot's `eventId`): the encounter start is never
  rewound. In FreePlay the floor is the last event of the session's most recent archived encounter,
  else the session start. Units at or below the floor are refused for every caller. `run` now stamps
  `encounterId` on user events (S02 reserved the field) so the archive floor can be located.
- **Seams (player).** `playerWindow`: the latest unit on the branch must belong to a character the
  user owns; otherwise the seam is named: another creature's turn start, a committed Director
  adjustment (`manual.adjustment`, `correction.*`; these count as the Director's even when they act on
  the player's hero), another character's committed action, or a Director table action
  (`combat.first-side`, `group.move`, `foe.*`). A stale control naming an older own unit is refused
  with "undo your later action first". A `turn.take` unit is the outer limit: it is never
  player-undoable. `directorWindow`: the latest unit, one per call, never past the floor.
- **Restoration.** `restoreUnit` reads the unit's journal, writes every `before` (undo, last to
  first) or `after` (redo, first to last) back through `journalPatch`/`journalInsert`/`journalDelete`
  under the history event, so the undo/redo entry carries its own change record and the original is
  untouched apart from `disposition` (`undone` / `redone`, the S02 effective-status marker). No
  modifier runs: no engine call, no `rollDice`; recorded dice stay on the events (tests count `rolls`
  rows, the generator counter and dice-bearing events before and after).
- **Re-created documents.** Convex assigns fresh ids, so a document removed by undoing a journaled
  insert (a `turns` row, a group, a registration) returns under a new id on redo. `historyAliases`
  maps each former id to the live one; restoration resolves entity ids and rewrites recorded values
  (for example `encounters.activeTurnId`) through the alias chain. Verified by Take turn rewound,
  redone and rewound again.
- **Enable user undo.** `campaigns.settings.enableUserUndo` (absent means on) through
  `/campaign user-undo state=on|off`, a `campaign.setting` entry like A03's settings. Off refuses
  player `history.undo` and `history.redo`; Director rewind/redo and corrections are unaffected.
- **Not journaled, not restored.** Interaction rows (cards) and `rolls`/`snapshots` are outside the
  journal. Undoing a unit that answered a card leaves the card `resolved`; no v0.01 card resolves a
  gameplay unit except `table.roll`'s guided entry. Trigger-prompt restoration is V04. Player undo
  does not clear pending targeting drafts because none exist yet (A05 owns them).

### Interpretations recorded here, not rules

1. **Now confirmed by the user, 2026-09-14 (Q-A-600):** the player's own **Take turn** is not
   player-undoable, even if nothing else has happened. Only the Director rewinds it through the
   existing sequential history path. See the [owning contract](../table-spec.md#undo-permissions-and-proposed-campaign-control).
   Verify the initiating Take turn and its linked turn-start consequences remain outside the player
   window; this decision does not certify the implementation.
2. A **Director adjustment or correction on the player's hero** is the Director's entry, closes the
   player window and is not player-undoable; other operations the Director issues *for* a hero
   (`@Thorn /hero recover`) are that character's actions and are player-undoable.
3. **Superseded by user decision, 2026-09-14 (Q-A-601):** Enable user undo also gates the acting
   player's post-roll edge/bane corrections. Off leaves those corrections Director-only. The
   implementation initially omitted this check; A06/A05 must apply and verify the updated contract.
4. In **FreePlay**, Director rewind reaches back to the FreePlay stretch start (session start or the
   last archived encounter), the same floor players have, since the spec bounds rewind by the
   archive and session closure rather than by a FreePlay-specific limit.
5. The opening units after OK (`combat.initiative-roll`, `combat.first-side`) are gameplay units the
   Director can rewind and redo (the recorded d10 restores exactly); OK itself is the floor.

### Contract for A05 (acceptance check 7)

When a post-roll edge/bane correction commits, call, inside the mutation and before writing:

```ts
import { assertCorrectionAllowed, correctionWindow } from './lib/history';
// Throws ConvexError with the reason a card should show; returns the unit when allowed.
const unit = await assertCorrectionAllowed(ctx, attackHeadEventId, context.user);
// Or, for a read/projection: { allowed, reason, unit }.
const window = await correctionWindow(ctx, attackHeadEventId, context.user);
```

`eventId` may be the attack's head event or any consequence event of the unit. Allowed iff the event's
unit is the latest on the branch of the running session (older events need the intervening chain
rewound first, Director included), the unit is above the floor, and for a player the unit is their own
character's with no seam after it (another actor's turn start is the outer cutoff; their own End turn
is a later own action that must be undone first). Name the correction event kind `correction.<what>`
so it counts as a Director/acting-player correction seam for later undo. Append it as its own unit
with journal rows so `/history undo` of the adjudication restores the prior effective result.

### Verification (2026-09-14)

- `pnpm check`: exit 0 (lint, engine 51 tests, app and scripts 239 tests including
  `tests/app/history.test.ts` 14 tests, links, vendor, content, build).
- `node scripts/check-commit.ts --range main..HEAD`: see the hand-back entry.
- `tests/app/history.test.ts` reads persisted rows back for every check: hero `liveState`, foe `live`,
  encounter phase/round/active turn, turns, turn entries, groups, clock registrations, Malice, event
  dispositions, the history event's own `changes` rows, and dice evidence (`rolls` count, generator
  counter, dice-bearing events) before and after every undo/rewind/redo.
- Acceptance checks: 1 verified with the fixture (foe temporary Stamina 3→0 and Stamina 15→13 and the
  hero resource 3→2 all return in one `/history undo`; head and consequence events `undone`; the
  "action use" part is not verified: no allowance tracker exists before A05). 2 verified (seam
  named "Zik's committed action"; a stale `event=` control refused likewise). 3 verified (Director
  rewinds Zik's then Thorn's strike, then the opening choice and roll; the next rewind is refused
  with "the encounter start"). 4 verified (same dice on the event, same foe/hero state after redo;
  after a new strike redo is refused with "cleared the redo path" and the undone entry stays listed;
  the new strike rolled one more time). 5 verified (the foe's turn start refuses the player's undo;
  the Director rewinds the turn start, End turn and strike in order; the player's own Take turn is
  refused as the outer limit). 6 verified (setting off refuses player undo and redo; Director rewind
  and redo unaffected; the setting entry is an attributed `campaign.setting`). 7 partially verified:
  `correctionWindow` is exercised for the acting player (allowed before the next actor's turn start,
  refused after, refused after their own End turn until it is undone), for the Director (refused with
  "Later gameplay has committed" until rewound) and for another player (refused); the A05 card that
  calls it does not exist yet. 8 verified by counting in every restore test; no `rollDice` call
  exists in `convex/lib/history.ts`.
- Also verified: FreePlay Recovery and condition undo/redo; Director adjustment seam; sequential
  Director rewind to the session start (8 units) restoring the absence of the live record; archived
  encounter as a floor for both roles with the following FreePlay stretch undoable; End turn undo
  restoring round, Malice, group completion, turn status and a retired surprise registration together,
  then redo; Take turn rewound, redone (alias) and rewound again.
- Not exercised: browser rendering of `history-controls.tsx` and the log markers (no browser test in
  this slice); live CLI against a deployment; A07 archive events (the archive was simulated by
  patching the encounter row); units that delete documents (`foe.remove`, empty-group deletion) under
  redo; more than one alias hop.

### Audit needed

- Seam semantics in `playerWindow` / `seamOf` / `ownsUnit` against
  `docs/table-spec.md#undo-permissions-and-proposed-campaign-control`: actor-based ownership, the
  Director-adjustment exclusion, Take turn as the outer limit (Q-A-600), End turn undoable by the player.
- `isGameplayHead` classification: `NON_GAMEPLAY_KINDS` and `ENCOUNTER_LIFECYCLE_KINDS` (settings,
  notes, cards, setup and OK are not units; opening roll/choice, foe add/remove and group moves are).
- Restoration without engine or dice: `restoreUnit` / `restoreChange` (journal only; dispositions
  are the only edit to original events); the alias mechanism for re-created documents.
- Floors: OK event via the precombat snapshot; FreePlay floor from archived encounters' events
  (depends on `run` stamping `encounterId`); what A07 must add to `ENCOUNTER_LIFECYCLE_KINDS`.
- `correctionWindow` contract for A05: repair and verify the missing setting gate for acting-player
  corrections under confirmed Q-A-601; preserve Director corrections and existing history limits.
- Not journaled state (interaction rows, drafts) left unchanged by undo.

### User decision follow-up: Q-A-601

The user confirmed that disabling Enable user undo also disables acting-player post-roll edge/bane
corrections. Update the shared correction permission check consumed by A05 and its card projection;
previously opened cards must not bypass the current setting. Verify both player refusal when off
and ordinary window-limited access when on, with Director authority retained. The original
implementation/verification notes above describe the earlier ungated behavior, not proof of this fix.

### 2026-09-15 — Independent repair closure

Q-A-601 now gates player corrections through the shared history policy. Independent review and
persisted regressions cover recorded-dice restoration, sequential seams, repeated identity aliases,
current audience projection and clearing the invoker's targeting preparation on Undo/Rewind.
A07 establishes the completed encounter archive floor. The earlier integration checklist is
historical. See [the A06 verdict](audits/2026-09-15-A06-review.md) and
[combined acceptance evidence](evidence/v001-acceptance.md).
