# V88 seeded-inventory independent rules review

Reviewer: `v88_seeded_rules_review`, 2026-09-20.
Verdict: **pass**, no blocking findings, for candidate
`21ec7cadcdc4a7abe04d5116cdad4d3bcd6f8b3c` against DEPLOY integration
`c721d0b48802be806e1c0f4eab4d9d98bf93c9a7`.
This reviewer did not author the implementation or perform its independent implementation review.

## Scope and evidence

Read project instructions, the [review standard](../README.md#review-standard),
[headless gate](../README.md#programmatic-headless-completion-gate),
[trait-granted ability gate](../README.md#trait-granted-ability-completion-gate),
[V88 acceptance checks](../V88-compiled-potency-conditions.md#acceptance-checks),
[seeded addendum](../V88-compiled-potency-conditions.md#v87-seeded-inventory-addendum),
[design](../evidence/V88/seeded-inventory-design.md),
[headless plan](../evidence/V88/seeded-headless-plan.md), candidate diff, and
[implementation PASS](V88-seeded-implementation-review.md).
This incremental review covers the four newly reachable abilities and their new fixtures/evidence;
it does not replace the original V88 rules review or claim new parent-stat-block automation.

Only the pinned local Compendium was used for rules research. Its checked-out revision is
`fb83a789da8f0327a389c277a0c790b1648d5810`; paths in the source table below are relative to
`vendor/steel-compendium/en/unified/md/`. Read the complete listed stat blocks, including parent
traits and other abilities, not just the signature rows.

| Source passage | Independently verified mechanical claim |
| --- | --- |
| `monster/lizardfolk/statblock/lizardfolk-bloodeye.md`, Bola Knock | Main action, Ranged/Strike/Weapon, ranged 5, one creature or object, +2; 5/7/9 damage, A < 0/1/2 restrained (save ends). |
| `monster/hobgoblin/statblock/hobgoblin-redglare.md`, Eye Flash | Main action, Magic/Ranged/Strike, ranged 10, one creature or object, +3; 9/14/17 corruption damage, P < 1 slowed / P < 2 restrained / P < 3 restrained (save ends). |
| `monster/orc/statblock/orc-godcaller.md`, Power Chord | Main action, Magic/Melee/Ranged/Strike, melee 1 or ranged 10, one creature or object, +2; 5/7/9 sonic damage. Only tier three adds P < 2 weakened (save ends). |
| `monster/undead/1st-echelon/statblock/ghoul.md`, Razor Claws | Main action, Charge/Melee/Strike/Weapon, melee 1, one creature or object, +2; 3/4/5 damage. Only tier three adds M < 2 bleeding (save ends). |
| `rule/character/potency.md`, opening rule and worked example | Strict comparison: equality resists; resisted potency does not remove the printed damage. |
| `rule/dice/edge.md` and `rule/dice/bane.md` | Double edge/bane changes the outcome one tier, without adding/subtracting a numeric bonus, bounded to tiers 1–3. |
| `rule/general/saving-throw.md` | Save ends checks at each affected creature's turn end, one d10, success on 6+. |
| `feature/trait/devil/impressive-horns.md` | Retained selected Devil trait changes saving-throw success to 5+. |
| `class/fury.md#basics` and `class/elementalist.md#basics` | Fury fixes M/A at 2 and permits remaining 2/−1/−1 or 1/0/0; Elementalist fixes R at 2 and permits remaining 2/1/0/0. |

None of the four signature abilities prints a Malice cost. The fixture's unchanged Malice within
each use/correction is correct; campaign Malice can change between turns. Printed object targeting
is preserved as source information while the bounded automation proves ordinary creature targets.

## Acceptance disposition

| Addendum check | Status and evidence |
| --- | --- |
| Four tier tables, printed roll bonus and damage types | **verified** against the source passages above and independent constants in `tests/app/potency-conditions.test.ts` and `scripts/v88-headless.ts`. The coordinator's focused persisted tests cover all three tiers. |
| Strict resistance boundaries | **verified**: live Bola A2 at threshold2, Eye P2 at threshold2, Power Chord P2 at threshold2, Razor M2 at threshold2 all resist. Persisted Eye also uses Monarch P3 at threshold3. |
| Tier absence and replacement | **verified**: real same-dice Eye correction changes restrained → slowed → restrained. Power Chord/Razor tier-one and tier-two correction results have no condition effects; independent tier-two uses also have none. Bola's tier-one A0 equality resists. |
| Corrections, dice and persistence | **verified**: actual readback retains accepted 6+6 through each correction; 12+2 or 12+3 is tier two, double bane gives tier one and double edge tier three. The persisted tests inspect retired/restored registrations and unchanged rolls, while the public runner checks Stamina reconciliation, current source instances and toggles. |
| Legal evaluated hero fixtures | **verified**: saved baselines show N M0/A0/R2/I2/P1 and P M2/A2/R−1/I−1/P2, matching the legal arrays above; original H is M2/A2/R1/I0/P0. Fixtures are created, saved, submitted and approved through public routes. |
| Saving-throw thresholds and provenance | **verified**: actual BK4/RC4 event thresholds are 6 for N; EF4/PC4 thresholds are 5 for H, with pinned Impressive Horns provenance. Each recorded die is 10 and succeeds. The source-linked instance/registration, outcome, post-save refusal and history checks passed. These four live saves do not independently exercise failure or the exact 5/6 boundary; existing deterministic coverage remains applicable. |
| Source retention, availability and grants | **verified for the four abilities**: public catalog/add and action-sheet records expose the existing named abilities and parent source. Candidate changes only proof tooling, tests and documentation; no new grant, loader or parent-trait consequence is introduced. |
| Full gate and actual headless proof | **verified through coordinator evidence**, not independently executed: 352 engine plus 571 app/scripts tests; 91 real readback groups, ten disclosed dice positions on the exact candidate. |

The actual headless JSON inspected is
`/srv/presidium/projects/salient/test-artifacts/V88-21ec7ca-seeded-headless-20260920T164300Z/v88-headless-1691dca4-4449-4577-88a6-1a236a662caa.json`.
It records the expected pin, `passed: true` and `stage: complete`. I inspected saved hero baselines,
actual Director result dice/damage/condition rows across BK/EF/PC/RC, and source-save event thresholds
and provenance, not solely the runner's expected-summary records. Execution/cleanup authority is
[TESTER's repaired-gates certificate](../evidence/V88/tester-job-21ec7ca-seeded-repair.md) and
[real-headless certificate](../evidence/V88/tester-job-21ec7ca-seeded-headless.md).

## Fixture repair and limits

The pinned Goblin Monarch stat block has Presence 3, Stamina 80 and no printed immunity/weakness;
it is a valid persisted Eye equality target. Dwarf Warden A0/P0/M2, Goblin Warrior A2, Bloodeye
M1/P0 and Godcaller P2 also match their printed stat blocks. Redglare's Fire 6 immunity does
not make corruption damage immune under the game rules. Its retained `fact-needed` case instead
accurately documents the existing application's conservative damage-fact prerequisite for a
nonempty immunity cell. It does not assert a new game rule. The repaired positive equality case
and retained negative dependency case keep that distinction clear.

Reptilian Escape, Infernal Ichor, Cadenza, Rallying Ostinato, Relentless, Leap, Arise and Hunger
remain outside this addendum's automation claim. Source text and existing support boundaries remain;
this pass is not completion of those parents' granted actions or condition consequences. No new
trait implementation is being substituted with text-only support. Impressive Horns remains selected
and evaluated instead of being removed to force an ordinary save threshold.

No rules discrepancy or unsupported new mechanical claim requires a change or user ruling.
Original V88 acceptance remains covered by its prior reviews and the rerun original cases; the
implementation review records the full original acceptance mapping. I ran no tests, browser or
services and made no commit. A later integrated revision and cloud deployment are not proven here.
The isolated helper run had no unrelated dice rows, so nonempty unrelated-row preservation is not
established, as already disclosed by TESTER and the implementation reviewer.

Chords startup and later checks returned “Ambiguous provider session; cannot select a Chords
project.” No sender identity was guessed; the review is returned through the parent-agent handoff.
