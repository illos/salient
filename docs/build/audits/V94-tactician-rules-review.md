# V94 Tactician rules review

Reviewed frozen `05a591d66e8590248dbfa2f494f0ef49402c95be` (content `6f08c63`,
arsenal `90051c5`) against Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
character wizard decision rules and character contracts §6–7. Reviewer: WIZARD.2.
Verdict on that frozen candidate: **changes required**. No tests run for this review.
This review preceded the user's transfer of implementation ownership to WIZARD.2; repaired
code requires another independent reviewer.

## Findings

1. `shared/evaluate/classes/tactician.ts:195–212` emits signature adjustments only for
   overlapping unequal benefits. This omits applicable bonuses supplied solely by the other kit.
   `chapter/kits.md`, Damage Bonuses and Distance Bonus, applies bonuses to abilities with the
   relevant Weapon and Melee/Ranged keywords; signatures have no exemption. Mountain + Whirlwind
   makes Pain for Pain's distance melee 2 (printed 1, subtract 0, add Whirlwind 1), even though
   Mountain prints no distance bonus. Generate adjustments from resolved minus printed bonuses
   for each applicable signature keyword family, including a zero originating bonus. Keep whole
   damage tuples. Reject the proposed overlap-only interpretation.
2. `shared/evaluate/character.ts:831` passes only the first kit to `applyDevilMovement`;
   `shared/evaluate/ancestries/devil.ts:49–87` uses that kit's printed speed/stability. A Devil
   with Shining Armor first and Sniper second must gain Sniper's +1 speed; Martial Artist first
   and Mountain second must gain Mountain's +2 stability. Field Arsenal applies to every ancestry.
   Consume resolved contributions while retaining Devil trait/base values and provenance.
3. `shared/content/classes/tactician/level-one.ts:76–80` attributes the doctrine skill sentence
   to each feature's file. The sentence lives in `feature/tactician/level-1/tactical-doctrine.md`,
   not Covert Operations, Studied Commander or Commanding Presence. Remove the mismatched quote
   from the feature grants; the separate doctrine-skill decision already has the right citation.
4. `docs/build/V94-tactician-level-one.md:140–143` acknowledges embedded actions as prose only.
   `feature/ability/tactician/level-1/mark.md` grants a 1-Focus free trigger and a free retarget;
   `feature/tactician/level-1/studied-commander.md` grants a conditioned Reason-test respite
   activity. Expose these in the action list and existing shared route with source conditions and
   persisted readback. Manual narrative outcomes can stay manual; prose alone is not completion
   under AGENTS.md's trait-granted-action rule.

## Confirmed within scope

Equal printed overlap values may be taken once without an otherwise redundant choice: the
implementation labels this interface interpretation and retains both kit citations. It changes
neither the value nor the source's non-stacking rule. Whole-tuple selection and lower-value choices
are supported directly by Field Arsenal. The four source-ledger witnesses remain valid.

The class baseline, three arrays, Lead plus two eligible skills, three doctrine skill groups,
3-/5-Focus choices, fixed and optional costs, ordinary-kit pool, both signatures and Focus
outside-combat waiver match the cited source. Full Mark and Studied Commander text must remain
readable alongside the new explicit actions. This is not a claim of complete table automation.

## Independent repair review

WIZARD.2 delegated `v94_final_review`, who authored none of the implementation, reviewed the
repaired content, arsenal, Devil integration, embedded-action grants and both Convex projections.
Verdict: **pass** within the stated manual boundaries. All four findings above are closed. All
27 ingested Tactician rows byte-match the pin; all21 ordinary-kit signature keyword classifications
match their individual source rows. Devil provenance is additive. The new bounded headless
journey also received static review; cleanup now supplies the explicit keep choice if an assertion
fails during active combat. No reviewer tests, builds or deployments were performed.

This static pass does not replace TESTER's exact-candidate check, Forge execution or public
readback. Trigger adjudication, Mark state/benefit outcomes, respite prerequisites/outcomes,
optional spending, Focus gains and execution of signature adjustments remain manual.
