# V26 correction prerequisites: early V63 rebase blocker review

Date: 2026-09-20. Reviewer: independent Codex static-review subagent.

**Current checkpoint:** the combined `5956331..a843c1a` code review below finds the initial
blocker repaired, with no new blocking code finding. Fresh CLI evidence passes review, but
the browser journey failed during setup before abilities. Overall acceptance remains blocked.
The initial blocker record and intermediate review checkpoints are preserved below.

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

## Follow-up combined review of a843c1a

Reviewed candidate `a843c1a7472c7e6c8638214473f08f35eb1cff42` against integrated base
`5956331`, including the historical mutation change, indexed-read repair, regression tests,
CT114 browser adapter, dice-import helper, and real CLI proof script. This follow-up does not
replace the historical evidence or claim execution by the reviewer.

**Conditional verdict: code/source review satisfactory; live acceptance pending.** The original
blocking finding is resolved in the reviewed code. No additional blocking code or bounded-source
finding was identified. This is not yet a formal overall `pass` or permission to claim V26
compiler completion.

### Repair and regression evidence

`convex/lib/historyRead.ts:83-123` follows `historyUnits.previousBranch` only while the current
suffix consists of corrections or dispositions linked to the requested ability. It refuses
inactive entries, missing predecessors, other sessions and nondecreasing sequences. A different
roll, adjustment or turn event ends the walk. The prepared scope retains the session/encounter
floor and chronological units, then `historyRead.ts:164-174` delegates eligibility to the same
`correctionWindow` used by mutations. This preserves original-unit ownership/floor checks,
Director correction seams, and the distinction between correction and manual-disposition windows.
Undo/redo uses the existing active branch pointers; it does not collapse or rewrite journal units.
The ordinary indexed read, catch-up refusal and closeout exception remain intact.

The helper caches the prepared suffix for both modes within one result projection. Its cost is
linear in the uninterrupted same-ability suffix, not constant in that suffix length; unrelated
historical cards stop immediately and no complete session replay was added. No hard constant
read bound or large-suffix benchmark is claimed by this review. No schema/index migration is
introduced.

The [retained red output](../evidence/V26/corrections-2026-09-20/red-output.txt) shows the two
expected failures: player read eligibility false while mutation eligibility is true after one
correction, and Director manual eligibility false after linked corrections. The
[green output](../evidence/V26/corrections-2026-09-20/green-output.txt) records both selected
tests passing after repair. These files were inspected, not rerun by the reviewer.

`tests/app/abilities.test.ts:80-119` supplies explicit expected booleans to both read and
authoritative checks; agreement alone cannot pass with two false answers. The existing lifecycle
tests now cover original/one/two corrections, undo/redo, Director seams, manual disposition,
turn end and unrelated adjustment. Their existing saved-health, retained-dice, retry, immutable
event and cross-target assertions continue to protect behavior. These additions directly catch
the observed integration failure and reuse existing scenarios rather than adding test-count cases.

The lead reports full CT114 `pnpm check` passing on this candidate, with 693 engine/app/scripts
tests and lint, type, content and build gates. That is an implementer-reported result at this
review checkpoint; a durable current check-output artifact was not yet present in the reviewed
evidence directory. This reviewer ran no tests, builds, installs or runtime workloads.

### Browser/helper and CLI inspection

The browser adapter retains the ten ability cases, source-derived expected damage, actual turn
transitions, cost assertions, retained-dice corrections and 600-second timeout. It substitutes
the named CT114 route and runtime-source identity, checks the current manifest against served
content, and stores hashes for both history modules, the runner and the dice helper. Screenshots
and public authenticated readbacks go into a fresh per-run directory. Ordinary runs remain opt-in.
Authentication tokens remain in memory. The submitting command waits for its UI acknowledgment.

`tests/browser/v26-dice-import.mjs` executes the Convex import in the existing named backend,
with anonymous deployment/config/port checks and an exclusive helper lock. It accepts only one
campaign per helper lifetime, validates the seed/request shape, restricts imports to `diceStates`,
and limits its lifetime/request count. CLI output and configuration are not exported. The
`--replace` import replaces that table, so this remains a disposable, isolated-environment fixture;
it must not be described as a production-safe campaign-scoped seed operation.

`scripts/v63-headless.ts` creates real authenticated accounts and an admitted hero through public
operations, runs table commands through the actual `scripts/app.ts` child process with the token
in its environment, and reads public roster/results/history/events back independently. Expected
Stamina, permissions and dice are asserted after each lifecycle step. It covers manual disposition
after linked corrections, rewinding that disposition, Director closure of player corrections and
unrelated-turn denial. It records source identity and file hashes, preserves earlier readbacks,
marks failures without serializing transport exceptions, and signs out its created sessions.
The fixture inputs are existing V25-era integrated files, not abandoned Opus pilot artifacts.

The browser's BS8 manual-disposition case uses a fresh uncorrected Brutal Slam. Therefore its
screenshot alone cannot prove manual resolution after correction; that part of the contract is
covered by the app tests and the pending CLI lifecycle. Final evidence must make this distinction
clear. Neither static script inspection nor the historical screenshots establishes that either
new live script has passed.

### Source and acceptance checkpoint

The preceding pinned-source Brutal Slam/Thunder Roar calculations remain valid; neither their
source pin nor arithmetic was changed by the repair. The shared handler alters correction
eligibility, not damage rules. Compiler occurrences, calculated movement, unique triggers and
manual riders remain outside this prerequisite patch.

| Prerequisite | Follow-up status |
| --- | --- |
| 1. Consecutive corrections, reconciliation, undo/redo and retry | Code review satisfactory; focused red/green evidence inspected. Fresh rendered controls and persisted live lifecycle pending review. |
| 2. Director continuations and authority/history boundaries | Code review satisfactory; explicit positive/negative lifecycle coverage inspected. Live CLI evidence pending. |
| 3. Manual disposition after corrections and rewind boundary | Code review satisfactory; focused regression proof inspected. Corrected-card live CLI evidence pending. |
| 4. Ten proper-turn probes with source screenshots and readback | Not verified on the candidate; root is executing the browser journey. |
| 5. Full checks and independent/source review | Full check reported passing by lead; bounded code/source review complete. Durable current check artifact and live evidence review still required for final overall pass. |

Chords remains unavailable to this subagent with the same ambiguous-session error; the lead
received the findings directly. No application source or runtime was changed by this reviewer.

## Final evidence checkpoint: browser acceptance blocked

**Final bounded verdict: code/source/headless review satisfactory; overall acceptance blocked
by the incomplete browser journey. No full PASS.** No further runtime work was performed by
this reviewer. The following fresh artifacts were inspected after the preceding checkpoint:

- [Full check output](../evidence/V26/corrections-2026-09-20/v63-check-output.txt) and
  [exit status](../evidence/V26/corrections-2026-09-20/v63-check-exit.txt): 284 engine plus
  409 app/scripts tests pass, with exit 0 through the repository checks and build.
- [Tested source identity](../evidence/V26/corrections-2026-09-20/v63-tested-source.json)
  records clean candidate `a843c1a` and unchanged clean vendor pins.
- [Headless readback](../evidence/V26/corrections-2026-09-20/v63-headless-readback.json)
  records `passed: true`, `stage: complete`, the setup and eleven gameplay snapshots;
  [headless exit status](../evidence/V26/corrections-2026-09-20/v63-headless-exit.txt) is 0.
  Its script, history, history-read and helper hashes match the files independently read in
  this review. All snapshots retain dice 7+7. Stamina progresses 7, 7, 10, 7, 10 through
  original/one bane/two banes/undo/redo. Manual disposition preserves Stamina 10, creates one
  disposition, closes correction permissions and leaves manual eligibility. Rewind removes
  that disposition and restores correction eligibility. Director correction restores Stamina 7
  and closes only the player's correction permission. Turn end closes all three permissions;
  the refused follow-up snapshots preserve recorded damage and disposition state.
- [Browser output](../evidence/V26/corrections-2026-09-20/v63-browser-output.txt) and
  [exit status](../evidence/V26/corrections-2026-09-20/v63-browser-exit.txt) report failure
  during `createTable`, waiting for Add foe at `tests/browser/v21-fixtures.ts:86`.
  The retained error context displays the backend's maximum-execution-time error. The run
  did not reach the ability journey, so it supplies neither a fresh mechanical failure nor
  passing rendered correction/ten-ability evidence. The lead stopped the isolated environment
  and reported the blocker; no retry or application repair is claimed here.

The first three prerequisite contracts now have satisfactory static review, meaningful regression
coverage and fresh real CLI persisted evidence, including manual disposition after corrections.
Their rendered-control proof and prerequisite 4's ten proper-turn screenshots remain unverified
on this candidate. Prerequisite 5's full-check artifact and bounded source review are verified
from evidence, but the complete implementation acceptance gate cannot pass without the required
browser evidence. Historical screenshots cannot substitute for that missing candidate run.

The reviewed integration base remains `5956331`; the lead reports subsequent main `458b6e8`
contains a read-only V64 audit without an application delta. This report does not attest to a new
merge, shared-runtime update or unperformed rerun.

## Lead addendum: changed acceptance policy

The preceding independent verdict describes the pre-moratorium acceptance gate. Main `2f5544f`
now defers all browser testing; absent browser evidence is not a blocker. V63 was rebased onto
that main and visual scenarios recorded in the browser backlog. This policy addendum does not
invent a fresh reviewer verdict or relabel the saved checks as post-rebase runs. Updated headless
verification and final review remain held by the direct user testing pause in this thread.
