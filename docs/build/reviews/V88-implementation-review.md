# V88 independent implementation review

Reviewer: `v88_implementation_review`, 2026-09-20. Reviewed candidate
`a07dd279cb5dc98f92d231d4c9fae52812a7a7f7` against `a9c874c`, then substantively
re-reviewed fixes through `1af9c7509400d493d690851e4d3e5b0f6ecad30a`.
Verdict: **pass**, 2026-09-20, for implementation at exact `1af9c75`.
All 13 acceptance checks are verified. Separate pinned-source rules review and lead-owned
integration remain required; this verdict does not approve an untested later integration candidate.

This reviewer did not implement the slice and executed no tests, stacks or browsers.
Execution evidence is TESTER's `07b8f5b:docs/build/evidence/V88/tester-job-a07dd27.md`
and the earlier audit certificate at `ae12be6:docs/build/evidence/V88/tester-job-ac95cc3.md`.
The former reports full `CI=true pnpm check` passing, 352 engine and 562 app/scripts tests,
plus 34 focused repair tests. These are coordinator observations, not independently rerun tests.
The latest certificate is `7a273a2:docs/build/evidence/V88/tester-job-1af9c75.md`: full check
passes with 352 engine and 563 app/scripts tests, including the revised player Wode fixture.
Real headless evidence was subsequently reviewed from
`807a02e:docs/build/evidence/V88/tester-job-1af9c75-headless.md` and selected persisted
readbacks in run `b3a53798-0c7f-4546-ac0f-f24b448e9671` under the coordinator artifact directory
`/srv/presidium/projects/salient/test-artifacts/V88-1af9c75-headless-20260920T155700Z`.
This was the exact `1af9c75` runtime on the isolated loopback backend, completed with 25 readback
groups. The reviewer only read artifacts; the backend was already stopped.
The mandatory V72 certificate is
`2c71a9d:docs/build/evidence/V88/tester-job-1af9c75-v72-regressions.md`. Both actual readback
JSON files in `/srv/presidium/projects/salient/test-artifacts/V88-1af9c75-v72-20260920T160100Z`
were inspected: clean exact `1af9c75`, pinned vendors, `passed: true`, stage complete, 14 and 46
groups respectively. Their SHA-256 values match the certificate. This reviewer reconfirmed the
main runner has no diff from the source base; the isolated runner has only the approved BP changes.

## Scope read

- [V88](../V88-compiled-potency-conditions.md#in-scope), acceptance checks, ability designs,
  audit corpus drift, open questions and work log.
- [Build process](../README.md#review-standard), programmatic headless completion gate,
  test value and trait-granted ability completion gate; project `agent.MD`.
- Compiler, pure outcomes, persisted application/correction, clock, instances, query projections,
  source rendering, report changes, focused tests and both V72 runner diffs.

The narrow grammar retains source clauses and dependencies; unknown scores do not become zero.
Hero potency is read from the evaluated named characteristic and correction reuses saved facts.
Damage precedes persisted conditions. Save results are journaled and dice are attached to clock
events; manual toggles and overlapping sources are independent. Score projection follows the target
controller, including historical ID resolution, and public condition events omit target scores.
No grant/loading changes were introduced. The existing Wode granting trait remains intact and its
ability migrates structurally; unavailable entries are explicitly compile-only.

## Findings

1. **Medium, resolved in `1af9c75` — combat-end unscheduling was silent.**
   `convex/lib/clock.ts:463` retires each condition's registration and clears its registration link,
   retaining the active instance, but appends no event explaining that its save is now unscheduled.
   V88's Open questions explicitly requires that log. A player sees a still-active save-ends
   condition whose previously advertised automatic schedule has silently stopped. Append a
   source-linked public explanation at combat end, without rolling a save or ending the effect;
   extend `tests/app/condition-instances.test.ts:159` to assert that explanation and restoration.
   The repair appends `condition.unscheduled` with source, occurrence and creature references,
   linked to the combat-end boundary. Observer readback asserts its explanation and source IDs.
   The existing assertions retain the active condition, remove its registration and show no save.
   The repair changes no dice or effect-expiration behavior; the full coordinator gate passes.

2. **Medium, resolved in `1af9c75` — player condition correction was unproven.**
   `tests/app/potency-conditions.test.ts:127` and `scripts/v88-headless.ts:511` correct as Director.
   Check 10 explicitly names a player correction. Bury is a foe ability, so its owner naturally
   requires Director authority; preserve that restriction and cover the authorized player path
   through The Wode Defends instead. Existing player correction tests protect general permissions,
   but did not demonstrate a player's persisted condition/registration flip. The new legal Wode
   Elf fixture uses player authority to apply slowed, correct to resisted, reapply slowed and
   correct to tier-three restrained. It checks the player's foe-score projection remains private,
   the toggles follow the selected tier, and player undo/redo restores occurrence identity and an
   equivalent active registration without new roll rows. The replacement registration's physical
   ID is correctly treated as storage identity; timing, work, source, affected IDs and encounter
   are checked. Bury's Director-only control is preserved rather than weakened to satisfy literal
   player wording. Together with the BP post-save refusal, this verifies the correction contract.

3. **Low, nonblocking lifetime limitation.** `convex/lib/conditionInstances.ts:88` caps all retained
   instances, including ended ones, at 1,000. There is no corresponding supported archival operation
   despite the refusal directing the user to archive. A long-lived hero can eventually become
   unable to receive an otherwise legal condition. Record the limit and arrange bounded retirement
   of history-ineligible ended records or a supported maintenance path; preserve rolled-save
   correction guards while doing so.

## Acceptance checks

| # | Status | Evidence and remaining boundary |
| --- | --- | --- |
| 1 | verified | Exact baseline diagnostic fixture, same-corpus comparison, explicit five demotions and 25 preexisting additions; TESTER twice-generated byte-identical audit. |
| 2 | verified | Pure source-derived BP Might 2/0/−1 truth table and missing-score cases in `tests/scripts/compiled-ability.test.ts`; full check passed. |
| 3 | verified | RAY1 named Reason potency with higher Intuition, threshold 0/1/2 and missing-potency refusal; compile-only declaration retained. |
| 4 | verified | Seven unsafe remainder counterexamples, strict second-and-final-clause compiler path; full check passed. |
| 5 | verified | Real BP7 tier three, 7 damage, target Might 0 versus threshold 2; applied source instance and schedule, with observer score omitted. |
| 6 | verified | Real BP6 tier three, Might 2 versus threshold 2 resisted; Director/controller score 2, observer omitted. |
| 7 | verified | Persisted threshold-5/6 boundary and provenance; real BP die 5 failed at 6, Eye die 7 succeeded at evaluated 5, and foe die 6 succeeded at printed 6. |
| 8 | verified | Persisted registered turn-end rewind/redo restores state and existing rolls unchanged. Real backend corroboration remains pending under the overall headless gate. |
| 9 | verified | Persisted multiple-source/manual-off retirement, source names, and independently retained manual toggle; full check passed. |
| 10 | verified | BP Director flips and post-save refusal plus legal player Wode flips, tier-three condition replacement, player undo/redo and no new dice; full gate at `1af9c75` passed. |
| 11 | verified | Real Eye tier-three Intuition 2 resisted threshold 2, tier-two Intuition 0 applied threshold 1; save succeeded while independent manual toggle persisted. |
| 12 | verified | Unchanged main runner passed 14 groups (run `a4b587d4`); adapted isolated runner passed 46 groups (run `ccb99e72`), including BP5 refused disposition after rewind, damage/push/cost/privacy/history regressions. Exact `1af9c75` runtime and report hashes checked. |
| 13 | verified | TESTER full check including report gates; regenerated inventory nine live compiled/six unavailable, BP and Eye without diagnostics. |

The Wode Defends WD1/WD2 live evidence is verified: tier-two threshold 1 resisted by foe Agility 2;
tier-three threshold 2 applied restrained against foe Agility 0, followed by a successful die-6 save.
The player's and observer's projections omit both foe scores. WD3 has meaningful pure coverage that
holds potency constant while changing Might/Agility roll and damage choices and tier-three condition.
The real BP correction also witnessed an applied-to-resisted flip on the same natural 13;
manual removal and exact history readbacks complete the runner's relevant cases.
The two V72 real runners now also pass and close the final pending implementation check.
No claimed V88 acceptance remains unverified. The retained-instance limit remains a nonblocking
documented limitation. Separate pinned-source rules review follows implementation acceptance;
this document is not that rules certificate.
