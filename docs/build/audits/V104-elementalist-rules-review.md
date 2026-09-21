# V104 Elementalist rules review

Candidate reviewed: `d1d451b47c16e78cdd1b5c8c05c6e2248816c9c1` in `slice/V104`.
Reviewer: ENGINE, 2026-09-21. Static source and implementation review only; no tests or runtime operations executed.

## Verdict: PASS (static rules and implementation review)

R1, R2 and R3 are closed at this exact candidate. No remaining blocking static finding. This verdict does not certify full-suite or live execution; TESTER is running the remaining gates separately.

R3 closure: abilityView normalizes only typed Hurl grants to the original Hurl Element identity, passes their fixed damage type to shared modifier eligibility and suppresses conditional-choice annotations for already-fixed choices. Fire therefore includes its source +1; the six non-fire variants exclude it. The headless proof checks actual sheet modifier sums against independent tier expectations for all five builds and rejects conditional annotations on fixed variants.

The Hurl execution repair retains seven source-permitted damage types, Reason tiers, source provenance and original-name modifier matching; the untyped base is explicitly manual. The 59-use proof removes the unsupported damageType command argument, checks each typed result and persisted damage, and derives Fire/Destruction totals of 6/8/10 for fire versus 5/7/9 for the other six types.

Reviewed-By: ENGINE (pass, 2026-09-21)

## Source and scope

Authority is the pinned Steel Compendium at fb83a789da8f0327a389c277a0c790b1648d5810, principally en/unified/md/class/elementalist.md and the referenced Elementalist level-one feature/ability sources. The independently prepared source inventory is /tmp/v104-elementalist-source-audit.md (also persisted in docs/build/audits/V104-elementalist-source-audit.md).

The reviewed implementation covers all four specializations, five enchantments, four wards, eight signature choices, four 3-Essence choices and four 5-Essence choices, with specialization grants and 27 embedded/manual actions plus seven typed Hurl choices. Cross-specialization ability selection remains legal. Craft/lore selection and duplicate Magic replacement use the expanded source pools.

R1: Permanence recovery and winded provenance now references class.elementalist.enchantment rather than the nonexistent prayer decision. Its unconditional source-derived values are 24 maximum Stamina, recovery 8, winded 12 and stability 1 for the ledger witness.

R2: Instantaneous Excavation no longer enters the generic shared-roll resolver. Its grant retains the fixed 5-Essence cost and explicitly records separate rolls per eligible creature, geometry, falling and upkeep as manual. This avoids representing a single shared roll as the printed per-creature procedure.

Battle equipment bonuses, range increases, immunity, aura/timing effects, healing and terrain remain explicit manual boundaries. Persistent maintenance records reduced start-of-turn Essence income and the source's duration/end conditions; it does not claim automated upkeep or a second base-cost payment. The review does not certify those manual mechanics as automatic.

## Ledger and proof inspection

The five source-ledger witnesses exercise Fire/Destruction, Earth/Permanence, Green/Celerity, Void/Distance and Earth/Battle. Celerity gives speed 6 and disengage 2; unequipped Battle does not confer an unconditional Stamina bonus. Fire plus Destruction adds two to the applicable rolled Fire damage; Practical Magic's fixed damage remains manual rather than receiving that rolled bonus.

The original headless cohort intended 52 distinct action uses; the replacement expands this to 59 with seven typed Hurl choices, retaining persisted character/stat/grant readbacks, owner refusal, draft/admitted separation, paid-use debit and insufficient-resource refusal, manual outcome boundaries, source-linked pushes, and Ray applied/resisted cases. Ray uses an evaluated Reason -1 Null target for application and Reason 2 for resistance; application checks the slowed instance and save-registration reference. Pure threshold coverage adds all-tier strict comparisons. These are authored assertions, not executed evidence. Hurl's unsupported argument is removed, and the low-target comment now accurately describes the Null Reason -1 fixture.

## Legacy expectations

The V25 fixture adds the embedded action names without changing the previous scalar expectations. The Forge comparison excludes those explicit embedded source actions absent from standalone Forge records. Removing Magic's old unsupported-option expectation is consistent with the broadened replacement pool; duplicate-skill validation remains asserted. The live support expectation promotes Meteoric Introduction and Ray of Agonizing Self-Reflection to reachable and removes their former unavailable entries. Report generation and freshness acceptance remain TESTER work.

The final V25 delta adds exactly the two source-costed options (Practical Magic Additional Square and Explosive Assistance Enhance, each 1 Essence). Embedded provenance now quotes only verbatim source text, while activation guidance remains in the action description. These repairs preserve the earlier values and source assertions. No further blocker was identified. No tests were run by this reviewer; author-reported V25 results and remaining TESTER gates are separate evidence.

## Bounded closeout at d1d451b

Reviewed 01b10ec..d1d451b: only the slice work log and Ray grant expectation change. Ray is a cost-zero option in the level-one class.elementalist.signature-abilities decision, so the new exact level-one selectable assertion correctly replaces the historical no-grant expectation. Classification category, bounded flag, all three damage constants/types and symbolic potency remainders remain asserted unchanged. No production/runtime changes. Static PASS and the existing review trailer extend to this exact tip. The work log reports TESTER results; this reviewer ran no tests and does not independently certify those results.
