# V92 Shadow content rules review

Reviewed by WIZARD.2 with an independent delegated source reader on 2026-09-20.
Candidate: `76e7e37ff9e5efef0f87031781ebdc772c35bab0`, on evaluator base
`4032f4ddfceec861ec9af8b26b4741737a8767ff`. Rules source: Steel Compendium pin
`fb83a789da8f0327a389c277a0c790b1648d5810`. Scope: Shadow content module,
class/kit registration, ingest selection and generated Shadow entries; contextual static reading of
kit-parent and vitals support. This is not a full evaluator implementation or test acceptance review.

Verdict: **changes required** for one static implementation blocker; **rules content passes**.

At `shared/content/classes/shadow/level-one.ts:80` and `:109–112`, the characteristic and
potency `grant()` calls omit their required third argument, `source: string`, defined in
`shared/content/decision-builders.ts`. Restore `shadow` as the third argument in both calls.
This finding follows directly from the frozen function signature; no compiler run is claimed.
The earlier misleading quotes on ability grants have been correctly removed, and those grants
retain their ability source paths.

The content matches `en/unified/md/class/shadow.md` (Basics and advancement),
`feature/shadow/level-1/*.md`, and the nineteen `feature/ability/shadow/level-1/*.md` files
under the pinned source root. Agility 2, four assignable arrays, Stamina 18, eight Recoveries,
Agility potency, Hide and Sneak plus five eligible choices, the three colleges and their grants,
and all four signature/four 3-Insight/four 5-Insight choices are correct. Only Clever Trick has
mandatory Insight cost among the college triggered actions. Smoke Bomb remains a feature;
I'm No Threat's temporary Disengage benefit is not added to the baseline.

The kit registration adds the Shadow's own Kit feature over the existing ordinary-kit pool and
preserves the Fury aspect pools. This follows `feature/shadow/level-1/kit.md` and
`chapter/kits.md`; Stormwight separation remains the documented interpretation. The reviewed
product contract is `docs/character-wizard-spec.md`, section 3, including Q-CHAR-11's fixed-skill
replacement policy and Q-R-101's class-fixed characteristic assignment. Persisted replacement,
pruning and readback still require the pending tests.

Static comparison found the generated text for one class, eleven features and nineteen abilities
identical to their pinned Markdown sources. Full Insight limitations and I'm No Threat's illusion
termination/surge paragraph are retained. Insight gains, discounts, optional spending, teleportation
and illusion effects remain within the declared manual boundary; this review does not claim their
automation. TESTER execution, Forge comparison and headless acceptance remain pending.
