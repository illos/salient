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


### 2026-09-15 — Codex backend implementation in progress

- Plan: implement shared `combat.end`, `combat.victories`, `combat.finish`, and `combat.void`
  operations in `convex/lib/closeoutOperations.ts`, a member-visible `convex/closeout.ts`
  projection, and persisted-state acceptance tests in `tests/app/closeout.test.ts`. Root coordinates
  schema, registry, sessions and existing-operation integration; UI agent owns closeout cards.
  A05/A06 and the S02 snapshot are real dependencies; no mechanics fixture substitutes for them.
- Sources checked in the pinned Compendium: `rule/resource/surge.md`,
  `rule/health/temporary-stamina.md`, `rule/resource/victories.md`, and `chapter/combat.md`
  (End of Combat). Default surge/temporary Stamina clearing does not clear ordinary Stamina or
  condition toggles. No final turn or round boundary is manufactured.
- Backend files now implement explicit, retry-safe Victory confirmation and final archive; Void
  restores recorded hero live state, foe records and campaign Malice without normal cleanup.
  No loot/squad schema exists in v0.01, consistent with A07's V07 deferral.
- Existing hard-deleted foe records require a newly allocated Convex document ID on recreation;
  restoration records the original identity through the existing A06 `historyAliases` mapping.
  Surviving snapshot records retain their IDs. Archived original history remains untouched.
- Engineering interpretation: End combat and Victory confirmation remain journal-undoable before
  final archive, consistent with the owning specification's explicit irreversible Finish/Void
  boundary. Old optional response cards close at End; unresolved ability clauses remain explicit
  optional closeout choices using the existing manual `ability.resolved` continuation.

### 2026-09-15 — Codex backend verification handoff

- Implemented files: `convex/lib/closeoutOperations.ts`, `convex/closeout.ts`, and
  `tests/app/closeout.test.ts`. All four operations accept an optional encounter ID to reject
  stale controls. The read projection includes Director/running-session eligibility, editable
  initial Victory 1, participating heroes and their current Victories, and unresolved source
  clauses as explicitly optional cleanup choices. No source-specific effects are inferred.
- End closes pending encounter cards, offered extra-action opportunities and targeting drafts;
  it journals actual active-turn closure without dispatching a turn or round boundary. Rewind
  before final archive restores these records; redo restores the exact closed state.
- Finish requires explicit Victory confirmation, including zero. Awards, each changed cleanup
  resource and defeated-foe removal have attributed cause-linked events and persisted before/after
  journal entries. Common combat-end Malice work runs at normal Finish only. Void archives directly
  with keep/reset and leaves any session pause in force. Session closure integration is root-owned.
- Verification: `pnpm exec vitest run --project app tests/app/closeout.test.ts` — **7 tests passed**.
  Assertions reread stored documents and application queries: two-hero retry-safe Victory awards;
  exact surge/temporary Stamina journal leaves; ordinary Stamina/conditions preserved; no synthetic
  boundary events or additional dice; card/opportunity/draft closure and rewind/redo; removed-foe
  identity alias restoration; keep/reset hero/foe/Malice state; paused roster/gameplay refusals;
  session close choice; stale encounter control refusal; optional manual clause continuation and
  archive refusal. The clause test uses seeded pinned Brutal Slam content and its printed push 2.
- `pnpm exec eslint convex/lib/closeoutOperations.ts convex/closeout.ts tests/app/closeout.test.ts`
  passed. All three files were formatted with Prettier. A project typecheck attempt encountered
  concurrent audit changes in audience-test payload typing; root will run the final combined
  `pnpm check` and local backend verification after integration. This handoff is implementation
  evidence, not an independent or rules-review verdict. No commit or external deployment was made.

- Final backend rerun after integration: **7/7 focused tests passed**, and focused ESLint passed.
  The optional-clause test now fixes its dice inputs at 7 + 7; with the admitted hero's Might 2,
  total 16 selects Brutal Slam's printed tier 2 (push 2). Earlier random-dice test nondeterminism
  was corrected after the combined run exposed it. Source checked directly:
  `feature/ability/fury/level-1/brutal-slam.md` (tier 1 push 1, tier 2 push 2, tier 3 push 4).
  The final test leaves a clause unresolved by rewinding its manual disposition before Finish,
  then verifies a late response fails at the archive boundary. A concurrent duplicate history
  guard in `ability.resolved` was reconciled by root before this passing rerun.

### 2026-09-15 — Lead integration and audit handoff

- Added the closeout phase and Victory record to encounter storage and projections; registered
  all four operations. The optional command argument is `encounter`, compatible with the lowercase
  slash grammar, while read projections keep their `encounterId` field. UI controls bind the
  current encounter. The first A07 test submits `/combat end encounter=...` through the parser.
- Session closure accepts explicit `voidMode` and `expectedEncounterId`, performs Void and closure
  atomically, and rejects stale dialogs. The separate paused roster lock is enforced after Void.
  `tests/app/closeout-session.test.ts` adds six persisted integration tests; obsolete earlier
  session tests now assert the confirmed pause policy.
- Registry assembly is lazy through `registeredOperations()`. This fixes a circular import that
  passed unit imports but failed Convex bundle analysis. The Director's current closeout manual
  dispositions use the audit team's shared `assertManualResolutionAllowed`; A05 owns that helper's
  integration and review, with A07 continuation/archive coverage retained.
- The local anonymous backend initially held pre-A02 records incompatible with the current schema.
  Following the confirmed disposable pre-alpha policy, `pnpm setup:local --reset-data` cleared 30
  app tables while retaining the authentication component, and `pnpm content:seed` loaded the 403
  entries from pinned Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`.
  Actual dev sync completed at 00:21:24 UTC on 2026-09-15, at `http://127.0.0.1:3212`.
  Code generation alone had validated bundle analysis without finishing deployment; the final
  sync used `convex dev --once` against that same existing local backend. No cloud target was used.
- Combined A07 backend/session verification after the command rename: **13/13 tests passed**.
  Local sync/reset/seed logs are in `.playtest/build-2026-09-15/`. Full-check and browser outcomes
  are recorded below when complete. Independent review and A09 certification remain with the
  user's separate audit thread.

### 2026-09-15 — Codex UI implementation and browser handoff

- Implemented `web/table/closeout-card.tsx`, `web/table/void-card.tsx`, and integration in
  `web/table/index.tsx` and `web/campaigns.tsx`. The Director can End combat, inspect labeled
  pending hero/foe source clauses, confirm the editable Victory amount and selected recipients,
  and Finish cleanup. All viewers see closeout and the confirmed award. Cleanup text explicitly
  names default surge/temporary Stamina clearing and manual source-specific exceptions.
- Table Void and session closure offer keep/reset/cancel, including while paused. Dialogs retain
  the encounter they opened for; shared mutations reject stale encounter identities. End/Finish
  use slash commands with the grammar-compatible `encounter` argument; Victory/Void use the same
  registered operations through structured invocation. Session closure uses the shared lifecycle
  mutation with `expectedEncounterId`. Target/ability panels and initiative are hidden during
  closeout; manual numeric/condition controls remain. The closeout query subscribes only during
  closeout.
- Added `tests/browser/closeout.spec.ts`: three viewer contexts, two hero Victory recipients,
  sheet award visibility, persisted cleanup readback, canceled session closure, paused Void reset,
  and paused session closure keeping current state. The test waits for session-transition readback
  before navigation. It saves `.playtest/a07/closeout-director.png`,
  `.playtest/a07/closeout-player.png`, `.playtest/a07/closeout-observer.png`, and
  `.playtest/a07/paused-reset.png` for audit inspection.
- Focused ESLint passed for the five UI/browser files; focused Prettier checks passed after
  formatting. Earlier TypeScript runs found no diagnostics in these files after API generation,
  but encountered concurrent audience-test typing changes elsewhere; those runs were not a
  successful combined check.
- Browser command: `pnpm exec playwright test tests/browser/closeout.spec.ts`. The final run reached
  context teardown after the gameplay assertions, but **exited 1** because Playwright could not
  open its shared trace artifact (`ENOENT` under `test-results/.playwright-artifacts-0/traces/`).
  This is not a certified browser pass. Concurrent Playwright artifact cleanup is the suspected
  cause. Earlier runs exposed and fixed the uppercase command-argument grammar issue and the
  test's premature navigation after Resume; a separate run hit local one-second authentication
  timeouts in `table:roster` (request `3c06d0f59cde92d6`) and `closeout:current`
  (request `2fd4c08684b871e0`).
- Browser ownership now passes to the independent audit coordinator. Recommended isolated command:
  `pnpm exec playwright test tests/browser/closeout.spec.ts --output .playtest/a07-audit-results`.
  No further implementation-thread retries or backend requests were made after this handoff.
  Independent audit/rules verdicts and final acceptance remain separate from this work log.
