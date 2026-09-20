# V88 independent pinned-source rules review

Verdict: **pass**, 2026-09-20, for application and runner commit
`1af9c7509400d493d690851e4d3e5b0f6ecad30a` against base `a9c874c`.
Reviewer: `v88_rules_review`, independent of implementation and implementation review.
All 13 acceptance checks are verified within the expressly bounded V88 scope. No blocking
rules finding or unresolved rules decision remains. This verdict does not cover a later V87
integration candidate.

## Scope and method

Read [V88](../V88-compiled-potency-conditions.md#in-scope), its acceptance checks, ability designs,
research paths and work log; [review standard](../README.md#review-standard), per-ability and
trait-granted ability gates; project `agent.MD`; the [implementation review](V88-implementation-review.md);
and the [evidence index](../evidence/V88/README.md), grammar/inventory and coordinator certificates.
Inspected compiler, outcome, instance, clock, application/correction and projection changes, plus
source-derived pure and persisted test expectations. Verified the local Compendium HEAD is
`fb83a789da8f0327a389c277a0c790b1648d5810`. Only that local pinned source was consulted.
No tests, stacks, browser or online rules research were run by this reviewer.

Execution results are independently attributed to TESTER: the final full gate passed 352 engine
and 563 app/scripts tests; exact-source V88 live proof passed 25 readback groups; unchanged V72 main
and narrowly adapted V72 isolated runners passed 14 and 46 groups. I read the retained certificates,
not a fresh execution. I cannot claim independent reproduction of the running backends, which are
stopped. This is source review of the tested candidate, not a new runtime certificate.

## Source-derived mechanical checks

All source paths in this section are relative to
`vendor/steel-compendium/en/unified/md/` at the pin above.

- `rule/character/potency.md` says potency must exceed the target characteristic. Thus equality
  resists: BP thresholds 0/1/2 against Might 2 give resisted/resisted/resisted; Might 0 gives
  resisted/applied/applied; Might −1 gives applied/applied/applied. The outcome implementation
  uses strict `<`, not `<=`, and absent facts remain missing rather than zero.
- The same source says the hero's class determines the basis. `class/elementalist.md` Basics
  gives Reason −2/−1/0 and `class/fury.md` gives Might −2/−1/0; `chapter/the-basics.md`, Game of
  Exceptions, makes these specific formulas prevail over the general highest-characteristic
  wording. This independently supports the recorded Q-CHAR-12 resolution. Reason 2 with Intuition
  3 still yields 0/1/2; choosing Might or Agility for Wode's roll/damage does not change potency.
- `rule/dice/ability-roll.md`, Abilities With Damage and Effects, puts damage before effects and
  orders multiple effects as printed. V88 binds each condition to the preceding damage node and
  persists damage before applying the instance. Unsupported damage facts prevent application.
- `rule/general/saving-throw.md` supplies one d10 at each affected creature's turn end, success
  at 6+. `feature/trait/devil/impressive-horns.md` and
  `feature/trait/{high-elf,wode-elf}/otherworldly-grace.md` explicitly replace that with 5+.
  The clock consumes the existing evaluated hero threshold/provenance and uses printed 6 for
  foes. A 5 therefore succeeds for the evaluated Impressive Horns fixture and fails for the foe.
  The die and threshold provenance are recorded; neither correction nor redo generates a new die.
- `rule/resource/hero-token.md`, Spending Hero Tokens, permits turning a failed save into success.
  The V88 failure reminder leaves this choice manual, consistent with the explicit absence of token
  automation. It does not spend a token or retry the die.
- All nine `condition/*.md` files were read. Recognizing their names with an explicit save-ends
  duration does not implement their consequences: bleeding loss, weakened banes, movement/action
  restrictions, escape/standing/teleport termination and source-relative effects remain manual.
  In particular, `condition/frightened.md` and `condition/taunted.md` replace a different-source
  instance when newly imposed. That replacement is also a manual condition consequence in this
  slice, not behavior proved by the generic overlapping-bleeding test. None of V88's newly live
  condition abilities inflicts frightened or taunted; no broader complete-condition claim is made.
- Potency Presentation supports stating the inequality and outcome without requiring disclosure of
  the resisting score. The precise Director/controller audience is the V88 application contract;
  projections enforce it and public condition events omit scores. This is not a claim that the
  Compendium itself defines application account permissions.
- Saving throws last, source-instance identity, manual toggles, correction restrictions, history
  restoration and unscheduling after combat are standing application contracts, not new rules
  inferred from the Compendium. Combat end does not falsely expire the effect or invent a final save.

## Ability and inventory checks

| Ability and pinned source | Independently derived expected behavior |
| --- | --- |
| Bury the Point, `monster/goblin/statblock/goblin-warrior.md` | Main action, melee 1, one creature, roll +2, 2 Malice; 5/6/7 damage then M < 0/1/2 bleeding (save ends). Resist does not refund its cost: damage remains an automatic effect under Spending Resources on Potencies. |
| Eye of Surlach, `monster/goblin/statblock/goblin-cursespitter.md` | Signature main action, ranged 15, one creature, roll +2, no activation cost; 3/4/5 corruption then I < 0/1/2 weakened (save ends). Intuition 2 resists all; Intuition 0 resists/applies/applies. |
| The Wode Defends, `feature/ability/wode-elf/the-wode-defends.md` | Signature main action, ranged 10, one creature; roll M or A; 2/3/5 + M or A damage then A < weak/average/strong, slowed/slowed/restrained (save ends). At named potency 0/1/2, Agility 2 resists all and Agility 0 is affected at tiers 2/3. |
| Ray of Agonizing Self-Reflection, `feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md` | Main action, ranged 10, one creature or object, Reason roll; 2/4/6 + R corruption then R < weak/average/strong slowed (save ends). Reason 2 gives tier-two damage 6 and potency 1, independently of Intuition 3. Compile-only; object conditions stay fact-needed. |
| Razor Claws, `monster/undead/1st-echelon/statblock/ghoul.md` | Roll +2; 3/4/5 damage; only tier 3 adds M < 2 bleeding (save ends). |
| Eye Flash, `monster/hobgoblin/statblock/hobgoblin-redglare.md` | Roll +3; 9/14/17 corruption, P < 1/2/3, slowed/restrained/restrained (save ends). |
| Bola Knock, `monster/lizardfolk/statblock/lizardfolk-bloodeye.md` | Roll +2; 5/7/9 damage, A < 0/1/2 restrained (save ends). |
| Power Chord, `monster/orc/statblock/orc-godcaller.md` | Roll +2; 5/7/9 sonic; only tier 3 adds P < 2 weakened (save ends). |

The Wode granting trait at `feature/trait/wode-elf/the-wode-defends.md` gives its at-will signature
ability; the existing V82 grant in `shared/content/ancestries/wode-elf/level-one.ts` is retained.
V88 adds no grant or loading path. Shadow Chains explicitly targets three creatures in
`monster/goblin/statblock/goblin-assassin.md` and correctly remains compatibility.

The report's nine live compiled and six unavailable entries describe this pre-V87 loader, not
main after V87. Existing damage/push entries and Meteoric Introduction are unchanged. The four
unavailable monster strikes above and Ray receive structural support without a live-use claim.
There are no ability-name exclusions in the new grammar.

The five audit demotions are source-correct: Ashen Hoarder's Claw and Blade, Bredbeddle's
Executioner's Swing, High Elf Deathtouch's Heartpiercer, Wode Elf Green Seer's The Natural Cycle,
and Wraith Skulker's Draining Rake each has a further semicolon clause after the previously
bounded potency clause. The strict second-and-final-clause boundary therefore excludes them.
The 25 preexisting corpus additions are separated from grammar changes; the same-corpus comparison
records 236 promotions, five demotions and no other diagnostic changes. Audit/report execution
freshness is evidenced by TESTER, not rerun by this reviewer.

## Acceptance checks

| # | Status | Rules and evidence basis |
| --- | --- | --- |
| 1 | verified | Structural grammar matches the assigned boundary; exact audit baseline and five source-confirmed demotions are explicit; TESTER repeated-byte audit passes. |
| 2 | verified | BP Might 2/0/−1 truth table above independently derived and asserted in pure tests; unknown is fact-needed. |
| 3 | verified | Elementalist's named Reason formula supports RAY1 0/1/2 with higher Intuition, compile-only. WD3 independently varies roll/damage choice. |
| 4 | verified | Non-save-ends, EoT, compound, third-clause and trailing-text cases stay unsupported; these are scope refusals, not invented alternate mechanics. |
| 5 | verified | BP live tier-three 7 damage, Might 0 < 2 applied; source-linked bleeding and target-turn-end schedule match source. |
| 6 | verified | BP live Might 2 against threshold 2 resists; controller/Director score visibility and observer omission match contract. |
| 7 | verified | Source-backed d10 and thresholds; persisted die 5 succeeds at evaluated 5 and fails at foe 6 with provenance. Live BP 5 fails at 6; Eye 7 succeeds at 5; foe 6 succeeds at 6. |
| 8 | verified | Recorded-save undo/redo assertions preserve outcome and dice. Replacement registration physical IDs follow existing aliases while occurrence and schedule remain equivalent. |
| 9 | verified | Manual toggle and overlapping bleeding sources remain separate; manual off ends registrations and records sources. No automatic condition consequences claimed. |
| 10 | verified | BP Director correction changes threshold using saved facts; legal player Wode correction covers resisted/applied and slowed/restrained replacement. Post-save correction refused without reroll. Bury remains Director-controlled. |
| 11 | verified | Eye cost, damage, Intuition thresholds and weakened duration match source; both live outcomes and evaluated-5 save witnessed. |
| 12 | verified | TESTER unchanged main 14 groups and adapted runner 46 groups pass; only approved BP condition/disposition expectations change. Costs, damage/push, authority and history remain covered. |
| 13 | verified | TESTER full check and report gates pass; nine/six inventory and compile-only boundaries accurately stated for exact candidate. |

## Ranked findings and limits

No blocking findings. No user decision required.

1. **Low, nonblocking scope caveat:** `convex/lib/conditionInstances.ts:64` and `:80` implement
   generic active-instance aggregation. Different-source frightened/taunted replacement remains
   manual under the declared condition-consequence exclusion. Future automation or newly reachable
   abilities must not treat overlapping bleeding evidence as proof of those source-specific rules.
2. **Low, nonblocking operational limit:** the implementation review records the 1,000 retained
   instance cap at `convex/lib/conditionInstances.ts:88`. It is not a Compendium limit and must not be
   presented as one; archival is not implemented. The evidence index discloses this limitation.

No additional ungrounded mechanical claim was found in the scoped diff or source-derived expected
values. Runtime results remain attributed to the coordinator's certificates; later integration and
playable-environment rollout belong to the lead's separate gate.
