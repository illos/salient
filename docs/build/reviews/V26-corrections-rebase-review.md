# V26 correction prerequisites: early V63 rebase blocker review

Date: 2026-09-20. Reviewer: independent Codex static-review subagent.

**Verdict: changes required.** This is a bounded, static blocker review of
`44b23babdc58d31feb3739066a9118281e2c7284`, comprising historical V26 commits replayed
onto main `0f47e89`. It is not a formal passing implementation review: current full
`pnpm check`, browser execution and runtime readback have not been run by this reviewer.
No implementation or runtime changes were made. The requested stop-and-report boundary applies.

## Contracts read

- [Build review standard](../README.md#review-standard),
  [verification baseline](../README.md#verification-baseline), and
  [test value](../README.md#test-value), plus `agent.MD`.
- [Director edits to inline results](../../table-spec.md#director-edits-to-inline-results).
- [Inline corrections and history](../../table-command-spec.md#inline-corrections-and-history).
- [V26 prerequisite acceptance](../V26-compiled-ability-effects.md#2026-09-16--prerequisite-correction-and-playtest-fixes).
- [Brutal Slam design](../V26-ability-designs.md#brutal-slam),
  [Thunder Roar design](../V26-ability-designs.md#thunder-roar), and the
  [historical correction evidence](../evidence/V26/corrections-2026-09-16/README.md).

## Blocking finding: read eligibility omits same-roll corrections

**High severity; blocks acceptance.** The historical fix updates the authoritative mutation
window, but the newer V43 read path has a separate policy implementation.

- `convex/lib/history.ts:429-468` recognizes an uninterrupted suffix of
  `correction.ability` events whose cause and original event both identify the same ability use.
  It checks player ownership of each continuation and validates the original unit against a
  shortened correction scope. Lines 435-446 also permit Director manual disposition after
  those corrections.
- `convex/abilities.ts:260-266` obtains both correction and manual eligibility from
  `loadReadCorrectionWindows`, exposing them as `mayCorrect` and `mayResolve` at lines 291-292.
- `convex/lib/historyRead.ts:44-46,66` reads the branch top rather than the suffix.
  Its correction path at lines 127-130 directly calls `directorWindow` or `playerWindow`.
  Their requested-unit checks at `convex/lib/history.ts:286-289,308-311` reject the original
  ability because the latest unit is now its correction.
- The manual exception at `convex/lib/historyRead.ts:121-125` cannot recover the normal
  active-combat case: `convex/lib/historyIndex.ts:59-74` sets `continuationOf` only for
  `ability.resolved-at-table`, not `correction.ability`. The latest correction therefore
  has no indexed continuation relationship. Closeout has a separate exception.

Consequently, after one player correction the original result reports `mayCorrect: false`
to both player and Director, despite the command path allowing a further eligible correction.
The Director also receives `mayResolve: false` after linked corrections in ordinary active combat.
The visible controls depend on these values at `web/table/targeting.tsx:367,395,440,462`.
This prevents the required second Add bane click and manual disposition through the card.

Existing tests already target the discrepancy; this review predicts these assertions fail,
but does not claim executed test failures:

| Existing test | Specific affected assertions |
| --- | --- |
| `tests/app/abilities.test.ts:870`, acceptance 9 / linked corrections continue without rewind | Line 930 expects Director `mayCorrect: true` after the first correction; line 948 expects player eligibility after the next correction. The first assertion would stop the test before the second. |
| `tests/app/abilities.test.ts:1048`, linked corrections preserve disposition/later-action/settings boundaries | Line 1072 expects Director `mayResolve: true` after two corrections. Line 1094 separately expects correction eligibility after rewinding a later turn-end event. |
| `tests/browser/v26-baseline.spec.ts:62`, consecutive corrections and ten abilities on proper turns | Lines 375-377 expect eligibility after the first Add bane; line 384 requires a second rendered Add bane control. |

The multitarget mutation test at `tests/app/abilities.test.ts:993` submits consecutive commands
directly and does not assert positive player/Director read eligibility; it cannot alone prove the
card workflow. The listed eligibility assertions protect an observable contract and should be
retained, not weakened to accept false. Resolving this finding requires reconciling the indexed
read policy with the authoritative same-roll, ownership and manual-disposition boundaries while
preserving bounded reads. No such fix is included in this review.

## Bounded pinned-source arithmetic check

The worktree records Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`.
The canonical local submodule at `/srv/presidium/projects/salient/code/vendor/steel-compendium`
was read at that exact HEAD because this worktree's submodule was uninitialized when source
inspection began. The lead subsequently initialized the worktree submodules at unchanged pins.
No source pin was changed and no online rules source was used.

Read under `en/unified/md/`: `feature/ability/fury/level-1/brutal-slam.md`,
`feature/ability/fury/level-1/thunder-roar.md`, `kit/mountain.md`,
`chapter/kits.md` (Damage Bonuses), `rule/dice/ability-roll.md`,
`rule/dice/tier-outcome.md`, `rule/dice/edge.md`, `rule/dice/bane.md`, and
`monster/goblin/statblock/goblin-warrior.md`.

For the declared Might-2 Mountain fixture and fresh 15-Stamina Goblins:

- Brutal Slam: 7+7+2=16 gives tier 2, damage 6+2+0=8, Stamina 7. One bane subtracts 2
  from the roll, leaving total 14 and the same tier/damage. Two banes instead lower the
  unmodified tier 2 to tier 1: damage 3+2+0=5, reconciled Stamina 10. Dice 8+7+2=17
  give tier 3 and damage 9+2+4=15. These match the historical evidence arithmetic.
- Thunder Roar: 7+6+2=15 gives unmodified tier 2. One edge yields total 17, tier 3,
  damage 13+4=17 and Stamina -2. Two banes lower tier 2 to tier 1, damage 6 and Stamina 9.
  The unmodified target takes 9 and has Stamina 6. The printed cost is 5 Ferocity,
  so a declared balance of 6 becomes 1 for one use. Mountain applies to its Melee/Weapon
  keywords without a Strike prerequisite. Its constant damage expressions add no Might.

The historical printed pushes and Thunder Roar's nearest-target-first movement remain manual;
these arithmetic checks do not verify movement, tactical legality, current evaluated character
builds, retained threshold effects, or fresh persisted execution. No abandoned Opus pilot material
was consulted or reused.

## Prerequisite acceptance status and unrun checks

| Prerequisite | Status on this rebase |
| --- | --- |
| 1. Consecutive inline player corrections, retained dice, reconciliation, undo/redo, retry | **Failed by static contract inspection:** the second inline control is unavailable. Remaining persistence assertions not verified by execution. |
| 2. Director continuations and authority/history boundaries | **Failed by static contract inspection** for Director read eligibility; remaining boundaries not verified by execution. |
| 3. Director manual clauses after corrections; disposition closes correction window | **Failed by static contract inspection** for manual read eligibility in ordinary combat; persistence not verified by execution. |
| 4. Ten proper-turn live probes with screenshots/readback | **Not verified.** September 16 artifacts describe their historical revision, not this rebase. |
| 5. Full checks, independent implementation review and bounded source review | **Not verified as an acceptance gate.** Only the narrow static/source review above is complete. |

No tests, typechecks, lint, formatting tools, builds, browser sessions, dependency installs or
development servers were run. No current runtime result is claimed. Historical 435-test and
browser-pass claims were not reproduced and cannot establish this revision's acceptance.
Any subsequent verification must use CT114 through the documented development tools.

Chords `whoami`, `list_threads` and `check_updates` returned “Ambiguous provider session;
cannot select a Chords project”; the lead was informed for coordination. Only this review file
was authored by the reviewer; concurrent lead edits were preserved.
