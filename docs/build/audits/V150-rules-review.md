# V150 independent rules and implementation review

Reviewer: V150-REVIEW (independent rules and code review subagent). Date: 2026-09-24.
Reviewed `ee590c5f25cd88bfb1464ac3cc33a427ff55688a` against `origin/main` (`git diff origin/main...ee590c5f`),
in `.worktrees/resource-forgo`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).
Trigger: QC1's V145 shared blocker (`../review-artifacts/2026-09-24-V145-QC1.md`, R1).

Verdict at `ee590c5`: CHANGES REQUIRED (R1 and R2 required; R3 advisory).

## Source read

`complication/self-taught.md`, Benefit and Drawback, in full: "At the start of each of your turns
during combat, you can forgo gaining your Heroic Resource until the start of your next turn. If you
do, your strikes gain a damage bonus equal to your highest characteristic score until the start of
your next turn." The only other Compendium references are `_index/complication.md` and
`chapter/complications.md` (listing only). No other rule mentions it.

## Findings

### R1 (required). `combat.void` in keep mode leaves the forgo flags set into the next combat

- **Where.** `convex/lib/closeoutOperations.ts:269-293` (`voidEncounter`, keep branch). The flags are
  cleared only by the `encounter-end-loss` step at `convex/lib/clock.ts:343-345`, which a keep-mode
  void skips by design (Q-RES-1). Reset mode is fine: `restoreStart` restores the pre-combat
  `liveState`, flags included.
- **Evidence.**
  - The forgo only exists "during combat" and lasts "until the start of your next turn". A voided
    combat has no next turn, so the window cannot continue past it.
  - Q-RES-1 only justifies keeping the pool. It does not cover per-combat state. `resourceClaims`
    is also left in place, but it is keyed by `encounterId`, so it is harmless. `forgoing` and
    `forgoNext` are not keyed to an encounter.
  - `blocked()` (`convex/lib/resourceOperations.ts:62`) refuses every claim while `forgoing` is set.
    Only a later turn-start of the same hero clears it (`clock.ts:304`, `:346`).
- **Failure scenario.** A Self-Taught Censor forgoes wrath at their round-2 turn start, so
  `forgoing` is true. The Director voids the combat with `keep`. In the next combat, round 1, a
  judged creature damages the Censor before the Censor's first turn. The table presses Claim and it
  is refused with "is forgoing their Heroic Resource until the start of their next turn". The hero
  did not forgo anything in this combat.
  The same happens with a stale `forgoNext`, for example one declared after the hero's last turn:
  the first turn-start gain of the next combat is silently forgone. The panel does show "Will
  forgo", but the choice was made for a combat that no longer exists.
- **Fix.** In the keep branch of `voidEncounter`, `journalPatch` every hero in
  `heroParticipantIds` whose `forgoing` or `forgoNext` is set, clearing both flags. Alternatively,
  store the encounter id with the flags and ignore them outside that encounter. Add an assertion to
  the focused test: forgo, void keep, and the flags are false when read back.

### R2 (required). The source's own decision point (the start of the turn) still leaves claims open

- **Where.** `shared/content/supporting-complication-abilities.ts:170-174`: the listed action
  "Self-Taught: Forgo Heroic Resource", with action type "Start of your turn". When used, it goes
  through `ability.use` as an `ability.recorded` entry and stores nothing. The slice doc's out of
  scope says (`docs/build/V150-self-taught-forgo.md:29-30`): "Forgoing after the turn-start gain
  has already been applied. The table removes it with `/adjust heroic-resource`."
  `resource.forgo` (`convex/lib/resourceOperations.ts:203-256`) can only set `forgoNext`.
- **Evidence.**
  - The rules decision happens "at the start of each of your turns". The app applies the gain as
    soon as `/turn take` runs, so the only engine-honoured route is to declare it beforehand. That
    pre-declaration is labelled (Q-RES-7) and is acceptable in itself.
  - The fallback for a hero who decides at the turn start reproduces QC1 R1 exactly. `/adjust`
    reverses the pool, but `forgoing` is never set, so both claim controls stay available for the
    rest of the window.
  - QC1 accepted a manual reversal "only as an explicit supported user-facing flow, with all
    interval gains accounted for".
  - The UI list still shows the Start-of-turn action as the Self-Taught control. Using it records a
    use and suppresses nothing. AGENTS.md requires a granted action's persisted effect to be proven.
- **Failure scenario.** A Self-Taught Shadow's player presses Take turn and gains 2 insight. At
  that turn start, which is the moment the rule names, they use "Self-Taught: Forgo Heroic
  Resource" from the ability list, and the Director sets insight back with `/adjust heroic-resource`.
  The Shadow then deals damage with a surge. "Claim" is offered and adds +1 insight inside the
  forgone window. The engine gives no warning, because `forgoing` is false.
- **Fix.** Add a supported at-turn-start form. For example, `resource.forgo value=now` would be
  allowed only while the hero's own turn is active and before any claim in that turn. It would:
  - reverse this turn's `clock.heroic-resource` turn-start delta, journaled in the same scope;
  - set `forgoing: true` and clear `forgoNext`.

  Point the listed action's row (or its use) at that control. At minimum, make the row and the slice
  doc say plainly that forgoing after Take turn needs this control, not `/adjust`, and do not leave
  claims open. Cover it in the focused test: take turn, forgo now, pool restored, claim refused.

### R3 (advisory). The app test injects the complication instead of building it

- **Where.** `tests/app/heroic-resource-forgo.test.ts:36-49`.
- **Evidence.**
  - The test patches `derivedBaseline.features` with a hand-written feature. Its provenance uses
    `value`, where the evaluator writes `selection` (`shared/evaluate/character.ts:1602-1606`).
  - A legal build is one selection away: `'complication.choice': 'Self-Taught'`, as
    `tests/complication-actions.test.ts:81` does for other complications.
  - QC1 asked for "a focused legal-build check". As written, the test does not prove `canForgo`
    against real evaluator output.
  - Encounter-end clearing and undo are not asserted either.
- **Failure scenario.** Suppose the evaluator's complication feature name or kind changes, for
  example to a display label. `canForgo` would then return false for every real Self-Taught hero,
  and this test would still pass.
- **Fix.** Build the Shade with `'complication.choice': 'Self-Taught'` in the selections passed to
  `draftSelectionsFrom`, and drop the patch. Optionally, assert that `/combat end` or finish clears
  both flags.

## Checks with no defect

- **Detection.** `canForgo` (`shared/resolve/heroicResourceGeneration.ts:117-122`) matches
  `kind === 'complication' && name === 'Self-Taught'`. The evaluator emits exactly one such feature
  from `complication.choice`, and only when `COMPLICATION_EFFECTS[choice]` exists
  (`shared/evaluate/character.ts:1595-1607`; the key is at `shared/content/supporting-complications.ts:736`).
  The same match drives `shared/evaluate/complicationAbilities.ts:25`. The detection is reliable.
- **Lifecycle.**
  - A declared `forgoNext` is consumed at the hero's `turn-start-gain`. That step grants nothing,
    logs `forgo: true` with the quote, and sets `forgoing` (`clock.ts:282-302`).
  - The next turn start ends the window and applies that turn's gain (`clock.ts:304`, `:346`).
    Q-RES-7 is labelled, with the alternative named.
  - A forgo declared mid-turn applies at the next turn start, which is correct: the choice exists
    only at a turn start.
  - Forgoing again while already forgoing chains correctly.
  - Encounter end clears both flags (`clock.ts:343-345`).
  - All writes go through `journalPatch` in the causing operation's scope, so undoing `/turn take`
    or `resource.forgo` restores the flags.
  - Void reset restores the flags from the start snapshot. For void keep, see R1.
- **Combat-start grant.** It is not suppressed by `forgoNext`. That is correct: the forgo is chosen
  "at the start of each of your turns", and the combat-start grant comes before any turn.
- **Other gains.** The only automatic pool increases are the clock (`clock.ts:342`) and
  `resource.claim` (`resourceOperations.ts:188`). The `abilityOperations.ts:808` path only debits,
  and `/adjust` is manual. Both automatic paths are guarded.
- **Permissions.** `roles: ['director', 'player']` and `actor: 'required'` match `condition.on`
  (`convex/lib/tableOperations.ts:338-340`). `bindActor` refuses a non-director who does not own the
  hero (`convex/lib/actors.ts:97-98`).
- **UI.** The toggle text (`web/table/targeting.tsx:344-361`) states the three states accurately.
  The button submits the same shared operation, and the rule link cites the source.
- **Content row.** Its text is accurate for the pre-declaration route. See R2 for the at-turn-start
  route.
- **Interpretations.** Two choices are labelled in Q-RES-7: when the window ends, and declaring
  before the turn starts. Treating class triggers as "gaining your Heroic Resource" follows the text
  directly. The strike damage bonus is declared manual. I found no unlabelled interpretation.

## Note for later engine slices: where the guard lives

The guard exists in two places, and neither is in the shared resolver:
- the claim path, `blocked()` at `convex/lib/resourceOperations.ts:62`, which both `claimState`
  (sheet) and `resource.claim` use;
- the clock's `turn-start-gain` branch, `convex/lib/clock.ts:282-304`.

`shared/resolve/heroicResourceGeneration.ts` exports only `canForgo`. An observed trigger that goes
through `claimState` or `blocked` will honour the guard automatically. One that writes the pool
itself, as a new clock step or event observer would, will not honour it unless it repeats the check.
Before observed triggers land, a shared `gainSuppressed(live)` predicate, or a single `applyGain`
helper, in `heroicResourceGeneration.ts` would make the guard hard to miss. This is advisory, not a
V150 defect.

## Checks run by the reviewer at `ee590c5`

- `npx tsc --noEmit`: exit 0. `npx tsc --noEmit -p convex/tsconfig.json`: exit 0.
- `npx eslint` on the nine changed source and test files: exit 0.
- `npx vitest run tests/app/heroic-resource-forgo.test.ts`: 1 file, 1 test passed (5.49 s), run once.
- No other suites, journeys or services were run.

## Re-review at `15a7d328`

Reviewed `git diff ee590c5f 15a7d328` in the same worktree.

Verdict at `15a7d32`: CHANGES REQUIRED. R1 and R3 are closed. R2 is closed except for R4, a
narrow residual gap in the new `value=now` path.

- **R1: closed.** The keep branch of `voidEncounter` (`convex/lib/closeoutOperations.ts:271-279`)
  clears `forgoing`, `forgoNext` and `lastTurnGain` through `journalPatch` for each hero
  participant. The encounter-end step also clears `lastTurnGain` (`convex/lib/clock.ts:344`). The
  test reads both flags back as false after `/combat void mode=keep`.
- **R2: closed, except R4.**
  - `resource.forgo value=now` (`convex/lib/resourceOperations.ts:238-281`) removes the gain the
    clock recorded as `lastTurnGain` for the active turn (`convex/lib/clock.ts:347-355`), sets
    `forgoing` and clears `forgoNext`. All of this is journaled.
  - It is refused outside that turn, or when the hero is already forgoing.
  - The Self-Taught row and a "Forgo this turn" button point to it. The out-of-scope `/adjust`
    fallback is gone.
  - The test covers the removal, the refused claim, and the refused second `now`.
- **R3: closed.** The Shade is built with `'complication.choice': 'Self-Taught'`, and the test
  asserts the evaluated `{ name: 'Self-Taught', kind: 'complication' }` feature. The patch is
  removed. The test also covers a claim refused on Thorn's turn.

### R4 (required). `value=now` after a claim or spend in the same turn leaves a gain in the forgone window

- **Where.** `convex/lib/resourceOperations.ts:238-281`. The only checks are the active turn and
  `lastTurnGain.turnId`. It then applies `after = Math.max(floor, before - last.delta)`.
- **Evidence.**
  - The source fixes the decision "at the start of each of your turns". Once the hero has claimed a
    trigger, or spent from the pool, since the turn-start gain, that point has passed.
  - `value=now` still accepts in that case. It removes only the turn-start delta, so a claim made
    earlier in the same turn survives inside a window that is now forgone.
  - A spend followed by the floor clamp keeps the gain that was spent.
  - QC1 asked for "all interval gains accounted for".
- **Failure scenario.**
  - A Self-Taught Shadow takes their turn and gains 2 insight, for 2 in total. They deal surge
    damage and claim +1, for 3. Then they press "Forgo this turn": the pool becomes 3 − 2 = 1 and
    `forgoing` is set. The +1 was gained inside the forgone window, and the hero also takes the
    strike damage bonus.
  - Spend variant: the Shadow has 0, gains 2, spends 2 on an ability, then presses "Forgo this
    turn". The pool is floored at 0, so the spent gain was free.
- **Fix.** Record the post-gain pool in `lastTurnGain`, for example `after`. Refuse `value=now`
  unless `heroicResource.current === lastTurnGain.after`, with the message "only at the start of
  your turn, before claiming or spending". Alternatively, refuse it once any `resourceClaims` entry
  exists for this encounter with an `eventId` after the turn start. Add a test assertion: claim,
  then `value=now` is refused.

Checks run by the reviewer at `15a7d32`:
- `npx tsc --noEmit` and `npx tsc --noEmit -p convex/tsconfig.json`: both exit 0.
- `npx vitest run tests/app/heroic-resource-forgo.test.ts`: 1 file, 1 test passed (10.84 s), run
  once.
- No other suites, journeys or services were run.

## Re-review at `319d1b65`

Reviewed `git diff 15a7d328 319d1b65` in the same worktree.

Verdict at `319d1b6`: PASS. R1 to R4 are closed.

- **R4: closed.**
  - The clock now records the pool right after the turn-start gain as `lastTurnGain.after`
    (`convex/lib/clock.ts:353`; validator in `convex/characterTables.ts`).
  - `value=now` is refused unless `heroicResource.current === lastTurnGain.after`
    (`convex/lib/resourceOperations.ts:255-260`). This covers both failure scenarios: a claim raises
    the pool, and a spend lowers it.
  - The test claims, expects the "changed" refusal, undoes the claim, and then forgoes successfully.
    This also exercises undo of a journaled claim.
- **Advisory residual, not blocking.** A claim and a spend that cancel exactly, for example +1
  then spending 1, leave the pool equal to `after`, so the check passes. Removing the turn-start
  delta then still accounts for the whole turn-start gain. The claimed +1 has already been spent,
  so a forgo at that point cannot occur under a correct reading of "at the start of each of your
  turns". Closing this completely would take a check on the event log, for example refusing when a
  `resource.claim` or spend event exists after the turn-start event. Consider it if observed
  triggers make mid-turn pool changes more common.

Checks run by the reviewer at `319d1b6`:
- `npx tsc --noEmit` and `npx tsc --noEmit -p convex/tsconfig.json`: both exit 0.
- `npx vitest run tests/app/heroic-resource-forgo.test.ts`: 1 file, 1 test passed (5.25 s), run once.
- No other suites, journeys or services were run.
