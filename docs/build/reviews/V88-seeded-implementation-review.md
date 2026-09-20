# V88 seeded-inventory independent implementation review

Reviewer: `v88_seeded_implementation_review`, 2026-09-20.
Verdict: **pass** for the seeded-inventory addendum at
`21ec7cadcdc4a7abe04d5116cdad4d3bcd6f8b3c`, against
`c721d0b48802be806e1c0f4eab4d9d98bf93c9a7`.
No blocking findings. Separate pinned-source rules review and integrated-target verification
remain separate gates. This reviewer did not implement the change, run tests, start services,
use a browser, or commit changes.

## Scope and method

Read project `agent.MD`, [review standard](../README.md#review-standard),
[test value](../README.md#test-value),
[headless gate](../README.md#programmatic-headless-completion-gate),
[trait-granted ability gate](../README.md#trait-granted-ability-completion-gate),
[browser moratorium](../README.md#browser-testing-moratorium--2026-09-20), and
[testing process](../../../testing-process.md).
Read V88's [acceptance checks](../V88-compiled-potency-conditions.md#acceptance-checks),
[V87 addendum](../V88-compiled-potency-conditions.md#v87-seeded-inventory-addendum),
[design](../evidence/V88/seeded-inventory-design.md#designs),
[case matrix](../evidence/V88/seeded-inventory-design.md#per-ability-case-matrix), and
[execution plan](../evidence/V88/seeded-headless-plan.md).
Reviewed the complete candidate diff, inherited public result projection and damage-fact
prerequisite, shared save/history runner, existing inventory identity assertions, and the
[original implementation review](V88-implementation-review.md).
Read the four cited pinned stat-block ability passages to check that new expected constants
are independent source fixtures; the subsequent rules reviewer owns the separate rules verdict.

The candidate changes only documentation, tests and proof tooling. It introduces no production
compiler, mutation, schema, grant, loading or UI changes. Public action-sheet readbacks establish
all four existing actions, with their parent source retained. Their remaining parent traits and
other actions are explicitly outside this addendum's automation claim. Tests do not replace
source-derived arithmetic with resolver output: the independent tier/damage/condition tables
protect actual newly reachable behavior, including absent conditions on lower tiers.

## Execution evidence inspected

- [Repaired gates certificate](../evidence/V88/tester-job-21ec7ca-seeded-repair.md): TESTER's
  focused app and script checks plus full `CI=true pnpm check`, 352 engine and 571 app/scripts
  tests, pinned content, report freshness, build and budgets passed.
- [Real headless certificate](../evidence/V88/tester-job-21ec7ca-seeded-headless.md): exact
  candidate on a disposable anonymous loopback backend, 91 readback groups and ten dice
  positioning requests. Original V88 cases run before any positioning.
- Actual readback inspected:
  `/srv/presidium/projects/salient/test-artifacts/V88-21ec7ca-seeded-headless-20260920T164300Z/v88-headless-1691dca4-4449-4577-88a6-1a236a662caa.json`.
  SHA-256 independently read as
  `94b24e3555e4100759d6b0ac64d409ee15fdae22388d01dcc7f5129e25849025`.
  It records `passed: true`, `stage: complete`, exact candidate and Compendium pin
  `fb83a789da8f0327a389c277a0c790b1648d5810`. Every recorded source-file hash matches
  the committed candidate bytes, including helper, runner, resolver, persisted operations,
  clock, condition instances and result projection.
- The readback's `source.dirty: true` is disclosed, not ignored: retained
  `target-identity.txt` shows only `?? node_modules`; TESTER certifies unchanged tracked
  source, and the recorded source hashes agree. It is not evidence of an unreviewed patch.
- Inspected actual Director/controller/observer results, not just expected-summary rows:
  applied/resisted inequalities, same accepted dice through corrections, Eye's slowed-to-
  restrained replacement, and Power Chord/Razor lower-tier condition absence agree.
  Public compiled inputs are absent and observer target scores are omitted.

The prior failed Eye fixture remains recorded in
[the first focused certificate](../evidence/V88/tester-job-498778e-seeded-gates.md).
The repair correctly uses Goblin Monarch for known Presence equality and retains Redglare
as a negative fact-needed test. Its nonempty immunity cell prevents damage completion under
the inherited supported contract; a known resistance score does not bypass that dependency.

## Addendum acceptance

| Check | Status | Evidence |
| --- | --- | --- |
| Bola Knock BK1–BK3 | verified | Public loaded action, 7 damage/A0 < 1 applied; 9 damage/A2 < 2 resisted; same 6+6 corrected to tier 1, 5 damage/A0 < 0 resisted, then restored. Persisted tests inspect retired/restored save registrations. |
| Eye Flash EF1–EF3 | verified | Public action, 14 corruption/P0 < 2 applied and P2 equality resisted; same dice corrections give 9/slowed then 17/restrained with obsolete toggle removed. Persisted tier-three P3 equality and missing-damage prerequisite tested separately. |
| Power Chord PC1–PC3 | verified | Public action, 9 sonic/P0 < 2 weakened; P2 equality resists. Corrections give tier-one 5 and tier-two 7 without conditions; restore same-dice tier-three condition. Separate real tier-two use also has no condition. |
| Razor Claws RC1–RC3 | verified | Public action, 5 damage/M0 < 2 bleeding; M2 equality resists. Corrections give tier-one 3 and tier-two 4 without conditions; same-dice restoration and separate tier-two use verified. |
| Automatic saves and history | verified | BK4/EF4/PC4/RC4 each records a real source-linked d10, registration, evaluated threshold, state removal, post-save correction refusal and rewind/redo without another save. All four added saves happened to roll 10 and succeeded; both-branch generic coverage remains inherited. |
| State, cost and audiences | verified | Runner checks 50-minus-source-damage Stamina, unchanged Malice, source instance/toggle agreement, disposition refusal and Director/controller/observer projections; persisted foe targets additionally protect Director-only scores. |
| Current seeded inventory | verified | Existing explicit name list covers 13 compiled reachable identities and two unavailable identities. Full report/content gate passes on the 1,151-row snapshot; no name-based dispatch exclusion or public reseed route was introduced. |
| Helper and preserved data | verified for this isolated run | Exact checkout/commit/target and anonymous-config guards; secret/deploy overrides refused; bounded complete snapshots and campaign binding; at most 12 requests/20 minutes; actual ten successful responses and done marker. Only dice state is imported, with gameplay through registered authenticated operations. |
| Test value and full check | verified | Tests catch concrete migration, tier absence/replacement, equality, privacy, stale registration, replacement dice and damage-prerequisite failures. TESTER passed full candidate check; no failing assertion was weakened. |

## Original V88 acceptance applicability

The thirteen original checks retain their prior reviewed implementation. This addendum's
verification of those checks is incremental, not a claim to have rerun the original review.

| Original check | Status | Basis for this addendum |
| --- | --- | --- |
| 1 Grammar/audit | verified | No grammar change; inherited review and candidate report/content gates. |
| 2 Pure Bury | verified | No production/test contract change; candidate full suite passed. |
| 3 Symbolic potency | verified | Compile-only boundary unchanged; candidate full suite passed. |
| 4 Counterexamples | verified | Unsupported grammar unchanged; candidate full suite passed. |
| 5 Application | verified | Original unpositioned real cases rerun; four added real source instances. |
| 6 Resistance | verified | Original real cases plus each added ability's boundary and score projection. |
| 7 Automatic save | verified | Existing deterministic branches remain; four additional real registered saves. |
| 8 Undo/redo | verified | Shared real save helper and added persisted correction/history assertions. |
| 9 Manual coherence | verified | Existing overlap proof retained; shared manual-off helper used by added cases. |
| 10 Correction | verified | Original player Wode proof retained; added same-dice condition replacement/absence and post-save refusal. |
| 11 Eye of Surlach | verified | Original unpositioned cases rerun unchanged in the extended runner. |
| 12 V72 regressions | verified by inherited evidence | Original reviewed V72 certificates remain applicable: this delta changes neither production nor V72 runners. No new V72 real run is claimed. |
| 13 Full check/report | verified | Candidate full check passed; combined inventory is explicitly 13 reachable/1,222 compatibility/two unavailable. |

## Findings and limits

No new blocking finding. Two operational boundaries are material to interpreting the proof:

1. **Low, nonblocking — preservation coverage is limited to the isolated fixture.**
   `scripts/v88-seeded-dice-import.mjs:140` replaces the dice table from a complete snapshot,
   then checks unrelated rows. All ten actual responses report `preservedRows: 0`; preservation
   with nonempty unrelated campaigns was not exercised. The artifact-directory lock is not a
   deployment-wide lock across different directories, so exclusive target reservation by TESTER
   is essential. This pass covers the recorded disposable, exclusive target, not safe concurrent
   use against shared play data. The certificate states that limit accurately.
2. **Low, inherited — condition-instance retention limit.** The original review's 1,000 retained
   instance lifetime limitation is unchanged; this proof-only addendum neither worsens nor repairs it.

I did not independently reproduce execution: all test and live-run claims are verified through
TESTER certificates, source inspection and retained artifacts under the coordinator rule. No
browser proof is claimed or required during the moratorium. Nonempty unrelated-row preservation,
other parent-trait automation, a later integrated commit and cloud publication are not proven here.
Chords startup and final checks returned “Ambiguous provider session; cannot select a Chords
project”; no sender identity was guessed. The parent receives this verdict through agent handoff.
