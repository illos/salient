# A07: Closeout and Void

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required |
| Depends on | A05, A06 |
| Unblocks | A09 |
| Status | see `STATUS.md` |

## Goal

Implement the formal Director closeout: End combat closes turn structure and unused optional responses;
required caused work completes; closeout lists each character's applicable optional cleanup choices as
labeled cards; Director confirms Victory amount and recipients (editable initial 1, allowing 0); Finish
cleanup clears surges and temporary Stamina with logged changes, closes unused choices, and archives the
encounter. Implement Void with keep current state or restore starting state, including while paused,
restoring the full Director-panel snapshot on reset, and archiving either way.

## Spec references

- `docs/table-spec.md#formal-encounter-closeout`, `#voiding-an-encounter`,
  `#closing-a-session-with-an-active-encounter`, `#overall-encounter-sequence`
- `docs/table-command-spec.md#formal-encounter-closeout`
- `docs/pre-alpha-design-gaps.md#combat-closeout--confirmed-for-v001`,
  `#void-while-paused--confirmed-for-v001`
- `docs/v1-spec-checkpoint.md#sessions-roles-and-rosters`, `#loot-and-history`
- `docs/agent.MD` "Table and authority boundaries" paragraph on Void (in `agent.MD`)
- `docs/v001-basic-play-walkthrough.md#main-path-and-observable-results` step 9

## In scope

- `/combat end`: ends structured turns without synthesizing a final turn/group/round boundary or its
  effects; closes unused optional response cards; waits for required unresolved work (none automated in
  v0.01 beyond A05's unresolved-clause cards, which are optional to resolve) before cleanup.
- Closeout card listing each character's optional cleanup options as labeled log cards (in v0.01 the
  options are: resolve any pending unresolved clause, spend nothing; there is no automated optional
  effect, so the list may be empty and must say so honestly).
- Victory award: Director sets amount and recipients on the card; confirmation commits once; retry-safe;
  no award on Void.
- Finish cleanup: clear surges and temporary Stamina for every hero with one logged change each; close
  unused choices; set encounter status archived; release combat locks; return the session to FreePlay.
- Void: `/combat void keep|reset`; reset restores the S02 snapshot for foes (membership, identity,
  values, groups) and hero live values captured at OK; keep retains current state; both archive and skip
  rewards and cleanup; allowed while paused with the pause and roster lock preserved.
- Closing a session with an active encounter invokes the Void choice.
- Archive boundary enforced: A06 operations reject anything touching an archived encounter.
- Headless parity.

## Out of scope

- Loot and stash deposits (V07). Respite (V01). Source-specific ending effects (V05).
- Statistics from archived encounters.

## Inputs and dependencies

A05 for surges/temporary Stamina; A06 for the archive boundary; S02 snapshot.

## Deliverables

- `convex/closeout.ts`, `web/table/closeout-card.tsx`, `web/table/void-card.tsx`
- Tests: End combat with an open optional card closes it; Victory commit once under retry; Finish cleanup
  clears counters and archives; Void reset restores every snapshot field including a foe added
  mid-combat (removed) and a foe removed mid-combat (restored); Void keep leaves state; Void while paused
  keeps pause; undo rejected after archive; session close with active combat prompts Void
- Browser test: closeout flow visible to player and observer; Victory appears on the sheet

## Acceptance checks

1. After End combat, no Take turn or attack succeeds; FreePlay operations do once Finish cleanup runs.
2. Victory confirmation of 1 to two heroes creates one award event per hero; a retry with the same
   commandId creates none.
3. Finish cleanup sets surges 0 and temporary Stamina 0 on a hero that had 2 and 3, with two logged
   changes carrying before/after; ordinary Stamina and condition toggles are untouched.
4. Void reset after adding a second Goblin mid-combat and damaging the first leaves exactly the
   original foe at its snapshot Stamina; Void keep leaves both at current values.
5. Void while paused succeeds; the session stays paused; roster edits remain blocked.
6. A Director rewind or player undo after archive is rejected naming the archive boundary.
7. Closing the session mid-combat requires the keep/reset choice and records it.
8. Rules reviewer confirms the surge and temporary Stamina end-of-combat rule against the Compendium
   (`rule/health/temporary-stamina.md` and the surge rule in the source) and that no round-end effects were
   synthesized.

## Rules research

- `vendor/steel-compendium/en/unified/md/chapter/combat.md` (End of Combat)
- `vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md`
- Surge rule: locate in `rule/` or `chapter/combat.md`; cite the path found.
- Victory rule: `chapter/rewards.md` or `chapter/combat.md`; cite the path found.

## Open questions

None known. Source-specific exceptions to end-of-combat clearing are manual by ruling.

## Work log

_Empty._
