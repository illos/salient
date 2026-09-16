# V32 independent rules review

Reviewer: `v32_backend`, 2026-09-16. **Scope: pure character definitions/evaluator, the independently
researched rules contract and expected fixture, and generated readable source content.** This reviewer
implemented the backend progression operations and therefore does **not** review or approve that work
here. The separate [backend review](V32-backend-review.md) owns that boundary. The reviewer did not
write the pure evaluator, level-two definitions, source contract or expected fixture.

## Verdict

**Pass for the reviewed rules/data scope.** No blocking rules defect found in the delivered
Berserker Fury 1→2 path. This is a bounded supported path: Danger Sense is the one supported new
perk, both Berserker aspect abilities are selectable, and other legal core perks remain explicitly
unsupported. This verdict does not certify browser journeys, backend authorization/persistence,
shared deployment, or complete level-two catalog coverage.

Authority is the local Steel Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`.
No internet rules sources were used. Forge is a separate reference observation, never the authority
for the results below.

## Reviewed material

- [V32 specification](../build/V32-fury-progression-history.md),
  [source contract](../research/v32-fury-progression-contract.md),
  [expected fixture](../../tests/fixtures/v32-fury-level-two.json), and inherited
  [V25 Fury fixture](../../tests/fixtures/v25-fury.json).
- [Level-qualified definitions](../../shared/content/character-decisions.ts),
  [pure evaluator](../../shared/evaluate/character.ts), widened evaluation/definition contracts,
  [content generator](../../scripts/build-content.ts), generated ability/feature/perk entries,
  and [pure evaluator checks](../../tests/character-v32-evaluator.test.ts).
- Actual unified source records and Heroes book-clean context. The clean book supplies the
  Berserker option grouping and core perk categories; the unified perk chapter belongs to another
  sourcebook and is not used to infer these pools.

## Independent findings

| Subject | Source check and conclusion |
| --- | --- |
| Level-two entitlement | Fury advancement table retains signature/3/5 abilities and adds one aspect ability costing 5, one perk, and an aspect feature. No new characteristic, language, skill, ancestry-budget or kit choice at this level. The fixture adds exactly `class.fury.level-2.perk` and `class.fury.level-2.aspect-ability`; all previous selected values are unchanged. |
| Stamina and derived values | Fury Basics prints 21 starting Stamina and +9 at each higher level. Mountain contributes +9 per echelon; both levels are first echelon. Therefore `21 + 9 + 9 = 39`, Recovery value `floor(39 / 3) = 13`, winded `floor(39 / 2) = 19`, and Recoveries remain 10. The evaluator adds the new class contribution before calculating Recovery/winded and retains its source provenance. |
| Automatic feature | The Berserker row grants Unstoppable Force. Its Charge substitution requires a **strike** signature or heroic ability; jumping is also permitted. Full readable source retains both clauses. No broader automatic Charge execution was introduced. |
| Aspect ability pool | Heroes book-clean lines 9284–9314 contain Special Delivery and Wrecking Ball under the Berserker heading. Reaver/Stormwight options immediately follow under distinct headings. The implemented pool and invalid-option diagnostics match this boundary. |
| Wrecking Ball | 5 Ferocity, maneuver, Melee/Weapon, Self. Move in a straight line through mundane structures as difficult terrain, destroying those squares and leaving difficult terrain. One Might power roll targets each enemy moved adjacent to; push 1/2/3. There is **no damage expression**, and Mountain's damage bonus cannot modify the pushes. Full generated source retains the target sentence absent from extracted effect frontmatter. |
| Special Delivery | 5 Ferocity, maneuver, melee 1, one willing ally. Vertical push up to 4 ignores stability and collision damage; the ally can make a free strike at its end with bonus damage equal to this Fury's Might. The evaluator grants the correct alternative, cost and source without manufacturing a Fury damage roll. |
| Perks | Independently read Heroes Crafting, Exploration and Intrigue headings: 6 + 10 + 6 = 22 options. The definitions match every name. Only Danger Sense is supported; other core alternatives receive an unsupported result, and Arcane Trick is outside the legal pool. Area of Expertise's owned-crafting-skill choice is not silently enabled. |
| Danger Sense | Exploration perk. Its Alertness edge and surprise protection apply in natural environments outside settlements; natural-disaster warning looks ahead 72 hours without identifying the disaster. Source text is complete. It adds neither a skill nor an unconditional derived edge. |
| Retained build | Characteristics 2/2/0/1/0, speed 6, stability 2, size 1M, disengage 1, save 5+, potencies 0/1/2, renown/wealth 1/1, ten skills and three selected languages remain unchanged. The Soldier's deferred fourth language slot remains deferred. Teamwork and all existing abilities/features remain granted. No level-4 Growing Ferocity improvement activates. |
| Retained scaling trait | The extra Polder/Fury evaluator case correctly changes Corruption Immunity from level+2 = 3 to 4 while retaining earlier choices. This is source scaling of a retained trait, not a new trait selection. |
| Eligibility and timing contract | The standard Heroic Advancement table places level two at cumulative XP 16–31. The chapter specifies gaining the level during the same respite in which sufficient XP is gained. XP is cumulative. The manual timing declaration is an explicit app integration boundary while the full respite loop is absent; it is not a new automatic award/restoration rule. |
| Build versus live play | The pure evaluator outputs baseline data only. Source respite recovery and XP/Victory conversion remain distinct from activating a build. The owning app's current-value and history policies remain app decisions, separately reviewed in backend implementation. |

Core source paths are enumerated and hashed in the fixture ledger and explained in the linked
source contract. The additional rules read directly for this review were `class/fury.md`,
`kit/mountain.md`, `rule/general/echelon.md`, `rule/general/always-round-down.md`,
`rule/health/recoveries.md`, `rule/health/winded.md`, `rule/resource/experience.md`,
`chapter/making-a-hero.md`, and the full new feature/perk/ability files, all under
`vendor/steel-compendium/en/unified/md/`. Book context is
`vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md`.

## Evidence

- Independently recomputed SHA-256 hashes for **all 62 fixture ledger entries** against local pinned
  source bytes; all matched. This includes inherited level-one sources and thirteen transition
  source records. Hash agreement confirms source identity; the substantive checks above establish
  the transition interpretation.
- Compared generated source `text` against source files for Unstoppable Force, Danger Sense,
  Wrecking Ball and Special Delivery: all four are exact matches, including Wrecking Ball's
  full body and all contextual restrictions.
- Ran `pnpm exec vitest run --project engine tests/character-v32-evaluator.test.ts --maxWorkers=1`:
  **9/9 passed** at 11:06:58 UTC. Local log: `.playtest/v32-rules-review-focused.log`.
  Coverage includes exact expected scalar/grant values, source quotes, alternate ability,
  unsupported perks/levels/classes, missing/multiple choices, parent invalidation, legacy
  definitions identity and retained level-scaling ancestry effects.
- Inspected the generic tier parser and damage application guard: kit damage is only calculated
  for an actual parsed damage clause. Push-only Wrecking Ball tiers remain unresolved movement
  clauses and do not acquire damage from their numbers.

## Evidence limits and retained questions

The [Forge capture metadata](../research/v32-forge-reference.json) records separate website work.
This reviewer did not operate the website or independently authenticate those downloads, so the
rules verdict above does not claim independent live Forge parity. Browser/source-card and
persisted live-state evidence belong to the corresponding acceptance records.

No claim is made that all eleven classes or levels 1–10 are complete, that other eligible perks
work, or that Charge substitution, terrain destruction, forced movement, natural-disaster warning,
respite awards/restoration or the outside-combat Ferocity usage lifecycle have been automated.
The source research's duplicate-perk uncertainty is correctly isolated; this supported fixture
chooses a new perk and does not require resolving it.
