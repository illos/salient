# V26 prerequisite corrections review

Reviewer: `v26_spec_review`. Date: 2026-09-16.

**Independent implementation/design verdict: pass.**
**Separate pinned-source rules verdict: pass for the affected expectations.**
**Final evidence review and all five prerequisite acceptance checks: pass.**
**V26 compiler acceptance: all eleven checks remain pending.**

## Scope and implementation review

Reviewed the uncommitted prerequisite changes on `slice/V26-corrections`, based on `5e010ac`
(baseline evidence rebased onto main `f7137dc`): the shared correction-window helper, application
regressions, proper-turn browser runner and accompanying specification changes. Applied the
`convex-reviewer` skill (`/srv/presidium/home/.agents/skills/convex-reviewer/SKILL.md`).
This review does not authorize or certify compiler implementation, deployment or a main merge.

No blocking findings remain in the code/design diff:

- The exception requires an uninterrupted effective history suffix containing only
  `correction.ability` entries whose cause and stored original-event ID both identify this exact
  `ability.use`. A different roll or any intervening gameplay retains the sequential-rewind rule.
- The temporary window view retains the original unit's ownership and history floor. Every
  continuation is also checked for player authority. Director corrections remain player seams;
  session status, membership, observer restrictions and the user-undo setting remain enforced.
- Actual history is unchanged: each correction remains an attributed, journaled undo unit.
  Existing correction execution reads the current effective result, reconciles damage once,
  preserves accepted dice and appends to the correction list. It does not re-spend ability cost.
- The Director can mark manual clauses after linked corrections. That disposition is then a
  later gameplay unit and prevents another correction until rewound. Existing closeout behavior
  remains bounded by the current encounter.
- No public operation, validator, authorization route or deployment configuration was added.
  The table and command specifications accurately describe this accepted application-policy
  clarification without presenting it as a new Draw Steel rule.

The tests exercise consecutive correction and idempotent retry, immutable original events,
unchanged dice/roll count, separate undo/redo, Director continuation and player refusal, multiple
targets with one fixed cost, observer refusal, settings, manual disposition, a different corrected
roll, turn end and an unrelated adjustment. These are persisted-state regressions, not merely
assertions that the helper returns true.

The browser runner now advances ordinary turns through UI commands using the encounter's eligible
groups and entries. It resets declared fixture balances after round grants, then submits each
probe on the actor's fresh turn. Brutal Slam and both consecutive Add bane clicks use the player
client; undo/redo also uses that client. The former rewind workaround is removed. The exact local
target guards and opt-in remain, and readback now identifies the changed history module by SHA-256
in addition to the base revision and runner hash. Source dialogs and state queries remain real.

## Separate pinned-source review

After the implementation/design review passed, rechecked Bane, Edge, Power Roll Outcomes, Brutal
Slam, Thunder Roar, Mountain and the turn rule in the local Steel Compendium pinned at
`fb83a789da8f0327a389c277a0c790b1648d5810`. The remaining unchanged arithmetic and individual
source mapping are covered by the [ability designs](../V26-ability-designs.md) and
[baseline review](V26-baseline-playtest-review.md). No online rules source was used.

With Might 2 and Mountain, Brutal Slam's 7+7 roll totals 16: tier 2, damage 8, Goblin Stamina
15→7. One bane gives total 14 and the same outcome; two banes lower the original tier to 1,
damage 5 and Stamina 10. Undoing only the second correction restores one bane and Stamina 7;
redo restores Stamina 10 without new dice. For Thunder Roar, shared dice 7+6 and Might 2 give
total 15; one edge produces tier 3 and 13+4=17 damage, double bane produces tier 1 and 6 damage,
and the unchanged target retains tier 2 and 9 damage. The fixed 5 Ferocity cost is charged once.

Fresh ordinary turns support the one-main-action allowance. The runner remains a controlled
fixture journey: resources and health are explicitly reset, movement/geometry remains manual,
and Lines of Force remains an unrecognized-trigger compatibility probe. No assertion of a
fully source-legal encounter or implemented trigger follows from the absence of turn warnings.

## Validation and prerequisite acceptance

Inspected the recorded red-before run (two intended failures) and full-check log
`.playtest/v26/corrections-full-check.log`: 97 engine and 338 application/tooling tests pass,
with vendor/content checks and build. The author reports the focused 38-test run passing.
The reviewer did not rerun the full suite while the browser evidence was being captured.

| Prerequisite | Review status |
| --- | --- |
| 1. Consecutive player correction, unchanged dice/event, retry and sequential history | Pass: code/tests plus consecutive player clicks and undo/redo in the completed live run. |
| 2. Director continuation and existing authority/history boundaries | Code and regression tests pass. |
| 3. Manual disposition after correction, then correction window closed | Code and regression tests pass. |
| 4. Ten fresh-turn live probes with source/log screenshots and readback | Pass: complete run 6, source/log pairs and saved active-turn/state evidence. |
| 5. Full checks, independent implementation review and bounded source review | Pass for the reviewed implementation and affected expectations. |

The failed login run and interrupted three-ability run are not accepted as complete browser
evidence. All eleven compiler acceptance checks, calculated push/occurrences and the broader V26
ability scenarios remain future work. No implementation, test runner or evidence data was edited
by this reviewer.

### Built-frontend harness amendment — 2026-09-16

**Harness review: pass after correction.** The readback client now obtains its token through
the installed authenticated `GET /api/auth/convex/token` endpoint, allowing the existing browser
journey to run against Vite preview. Verified the installed Vite preview inherits the configured
authentication proxy. The first draft used ordinary browser credentials, which would omit this
application's cross-domain session. The corrected adapter mirrors the installed plugin's
`better-auth_cookie` local-storage serialization and expiry filter, sends `Better-Auth-Cookie`
with `credentials: 'omit'`, and rejects missing sessions or failed responses. Token and cookie
values are not written to the evidence. This preserves the actual logged-in user's authorization;
it adds no elevated credential, gameplay change, assertion relaxation or timeout change.
Runtime code remains at `f69843b`; live evidence was pending at this amendment and is reviewed below.

## Final evidence review — 2026-09-16

**Pass, with no remaining prerequisite blocker.** Reviewed the durable
[report](../evidence/V26/corrections-2026-09-16/README.md),
[readback](../evidence/V26/corrections-2026-09-16/readback.json), screenshots and successful browser
and full-check logs. Run 6 completed **1 passed in 6.5 minutes**, with `errors: []`, 23 records,
ten unique abilities and 240 turn-transition events through round 11. Interrupted earlier runs
are disclosed and are not used as the completion evidence.

Independently recomputed both recorded SHA-256 values: runner
`b1e0085ec32623206342d334279980536f0605e63c695df0c972f24699825890` and history module
`28bd94cf4cfa3062b43696bde40109040aacf620f8b09d0b56ae5e4cca9ada65`.
Readback records runtime `f69843b22ad4c9ff74bc355ff3632c670aef9c5a` and the expected local
Compendium pin. The durable check log confirms 97 + 338 = 435 tests and build passed; the
built-frontend authentication adapter was subsequently reviewed separately above.

Visually inspected all ten source dialogs and corresponding result cards, plus the one-bane,
two-bane, undo and redo captures. The complete Thunder Roar card clearly shows all three
targets, costs and manual movement text. The screenshots agree with saved source/result
identities and the report's arithmetic. Brutal Slam's original description stays at 8 damage
while the effective card changes to 5; this is correctly explained as immutable original
history alongside the current result.

Independent readback assertions confirm:

- Every rolled probe's actor matches its saved active turn, with no action/turn-order warning
  in the ability or 240 turn-transition events. All reported damage totals match both results
  and saved target health.
- The Brutal Slam sequence retains 7+7 dice, correction counts 0/1/2/1/2 and Goblin Stamina
  7/7/10/7/10 across original, one bane, two banes, undo and redo. The reviewed runner performs
  the two player clicks without intervening rewind.
- Bury the Point spends Malice 2→0, Out of the Way! spends Ferocity 3→0, and Thunder Roar
  spends Ferocity 6→1 once. The blocked BP4 before/after state is exactly equal, with no dice.
- LF1 before/after state is exactly equal; its unknown-Triggered/manual record is explicit.
  BP5 leaves the BP2 roster unchanged. The reloaded state exactly equals the final VF2 state.

The report accurately bounds the five prerequisites: authority, retry and negative history
cases are covered by the reviewed saved-state regressions; real browser evidence covers the
consecutive workflow and all ten ability probes. This does not convert every negative case
into a browser-tested claim. Declared health/resource resets and deterministic dice setup
remain visible, and physical placement, trigger fulfillment and manual riders remain outside
automation. The separately completed pinned-source verdict still applies to these unchanged
expectations. All eleven V26 compiler acceptance checks remain pending.

This final review used static inspection, local image viewing and read-only JSON comparisons.
No services were started, no broad tests were rerun, and no implementation, runner or evidence
data was modified by the reviewer. Only this review artifact was updated.
