# V88 verification and handoff evidence

Verified application/runner commit: `1af9c7509400d493d690851e4d3e5b0f6ecad30a`, on
`slice/V88` in `.worktrees/engine-potency`, based on `a9c874c`. This is the pre-V87 candidate:
nine live compiled abilities, six compiled-but-unavailable abilities, and 595 seeded content rows.
Integration onto newer main must account for V87's expanded loader and internal reseed action;
these certificates do not claim that later integration was tested. No merge is performed here.

## Gates and attempts

- [First attempt](tester-job-ac95cc3.md): focused suites and audit passed; full check found
  two obsolete BP assertions and archived correction guard ordering. Failures were retained.
- [First repair](tester-job-a07dd27.md): full check passed. Implementation review subsequently
  found a missing combat-end unscheduling log; that production fix is included in the final gate.
- [Review repair attempt](tester-job-c220cbc.md): unscheduling passed; the new Wode fixture
  incorrectly compared physical registration IDs after redo. Existing history aliases recreate
  those rows. The repaired fixture checks equivalent scheduling and unchanged occurrence/state/dice.
- [Final full gate](tester-job-1af9c75.md): 352 engine and 563 app/scripts tests, authoring,
  content/vendor/report/link checks and production build passed. The prior repeated audit-byte
  comparison remains valid because its grammar and generated reports did not change.
- [V88 live proof](tester-job-1af9c75-headless.md): real local anonymous backend, exact source and
  committed content, 25 readback groups; accounts/campaign retained, backend stopped.
- [Mandatory V72 regressions](tester-job-1af9c75-v72-regressions.md): exact clean source on named
  CT114 `engine-live`, unchanged main runner 14 groups and adapted runner 46 groups passed.
  Dice helper exited and environment stopped with data retained. Historical V72 evidence is intact.

TESTER authored these certificates on main; they are copied unchanged into this handoff for
self-contained branch review. The raw readbacks and logs remain in the certificate-linked artifact
directories. No browser test was run. No shared-main runtime or play data was changed by V88 proof.

## Actual live witnesses

Real-dice run `b3a53798-0c7f-4546-ac0f-f24b448e9671` at the pinned Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810` recorded:

| Case | Actual source-derived result |
| --- | --- |
| BP6 | Tier 3, 7 damage, target Might 2 resists `M < 2` |
| BP7 | Tier 3, 7 damage, target Might 0 receives bleeding from `M < 2` |
| BP9 | Original natural 13 corrected to tier 1, flipping applied to resisted; original restored by rewind |
| BP8/BP10 | Save die 5 against evaluated threshold 6 fails; after-save correction refused; history and manual removal proven |
| EYE1 | Tier 3, 5 corruption damage, target Intuition 2 resists `I < 2` |
| EYE2 | Tier 2, 4 corruption damage, target Intuition 0 receives weakened from `I < 1` |
| EYE3 | Save die 7 succeeds against evaluated Impressive Horns threshold 5; independent manual weakened toggle remains |
| WD1 | Tier 2, 5 damage, Goblin Warrior Agility 2 resists Fury Might-based average potency 1 |
| WD2 | Tier 3, 7 damage, Dwarf Warden Agility 0 receives restrained against strong potency 2; foe save die 6 succeeds |

Controller/Director/observer views were checked during every use; only the Director sees foe
resistance scores, and only the Director or owning controller sees a hero's resistance score.
Deterministic pure/persisted cases independently prove all BP Might 2/0/−1 tiers, both save branches,
hero die 5 versus foe die 5, legal player Wode correction in both directions, changed tier condition,
manual/overlapping sources, combat-end unscheduling and exact dice preservation across history.

## Design and review

- [Grammar comparison and ability inventory](grammar-and-inventory.md)
- [Approved V72 assertion adaptations](v72-adaptation.md)
- [Headless fixture design and invocation](headless-plan.md)
- [Independent implementation review](../../reviews/V88-implementation-review.md): pass, all 13 checks
- [Independent pinned-source rules review](../../reviews/V88-rules-review.md): pass, all 13 checks

The application deliberately leaves condition consequences, potency adjustments and failed-save
hero-token choices manual. This also includes the source-replacement rules in frightened and
taunted; the current V88 live inventory inflicts neither condition. Ended instances are retained for saved-outcome/correction history;
the 1000-instance limit is a documented nonblocking limitation, not an implemented archival service.

## V87 seeded-inventory addendum

Verified integrated application, runner and helper: `21ec7cadcdc4a7abe04d5116cdad4d3bcd6f8b3c`,
branch `slice/V88-seeded-inventory`, based on DEPLOY `c721d0b`. The current corpus contains
1151 entries with 13 reachable compiled / 1222 compatibility / 2 unavailable abilities.
Bola Knock, Eye Flash, Power Chord and Ghoul Razor Claws each have designed/built/playtested
rows in the slice doc. Original certificates above remain historical.

- [Source-derived designs](seeded-inventory-design.md) and [execution plan](seeded-headless-plan.md).
- [First focused failure](tester-job-498778e-seeded-gates.md): Redglare's nonempty immunity
  cell blocked damage completion. Retained as a negative case; Goblin Monarch proves equality.
- [Repaired full gate](tester-job-21ec7ca-seeded-repair.md): 352 engine + 571 app/scripts,
  focused potency 6/6 and report 3/3, all required content/report/build gates passed.
- [Real headless proof](tester-job-21ec7ca-seeded-headless.md): 91 groups, 247.618 seconds,
  run `1691dca4-4449-4577-88a6-1a236a662caa`; original 25 groups unpositioned, then ten
  disclosed dice-stream positions for ability-specific new cases. No gameplay outcome import.

The fresh isolated database had zero unrelated dice rows; the helper's preservation checks
passed vacuously for those rows. Do not describe that run as a populated unrelated-campaign
preservation experiment. Helper/backend exited, ports are free and data is retained.
No main/cloud publication or browser test was performed.

| Added ability | Applied witness | Resisted witness | Transition witness |
| --- | --- | --- | --- |
| Bola Knock | Tier2, 7 damage, A0 < 1 restrained | Tier3, 9 damage, A2 = 2 | Same6+6 to tier1: 5 damage, A0 = 0 resisted; restore tier2 |
| Eye Flash | Tier2, 14 corruption, P0 < 2 restrained | Tier2, 14 corruption, P2 = 2 | Same6+6 to tier1: 9/slowed; tier3: 17/restrained |
| Power Chord | Tier3, 9 sonic, P0 < 2 weakened | Tier3, 9 sonic, P2 = 2 | Same6+6 to tiers1/2: 5/7 sonic, no condition; restore tier3 |
| Ghoul Razor Claws | Tier3, 5 damage, M0 < 2 bleeding | Tier3, 5 damage, M2 = 2 | Same6+6 to tiers1/2: 3/4 damage, no condition; restore tier3 |

Each added applied instance completed a real save/history/manual-off sequence; Power Chord
and Razor Claws also had separate tier2 uses with no condition occurrence. The headless plan
records the disclosed edge/bane choices which make those same-dice tier changes possible.

[Independent seeded implementation review](../../reviews/V88-seeded-implementation-review.md)
passed at the exact tested candidate. The separate
[pinned-source seeded rules review](../../reviews/V88-seeded-rules-review.md) also passed.
Both verdicts cover the final implementation at `21ec7ca`; subsequent owner changes are
documentation and authentic commit-review metadata only.
