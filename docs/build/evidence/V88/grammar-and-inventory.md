# V88 grammar comparison and ability inventory

Source pin: `fb83a789da8f0327a389c277a0c790b1648d5810`.
Baseline code: `a9c874c40d292e42f8fa7cab1cc8f320f4d37223`.
This is source research and report-authoring evidence, not a TESTER execution certificate.
Gate results and real-backend evidence are recorded separately in this directory.

## Same-current-corpus comparison

Both classifiers were applied to the same current `buildCorpus()` population of **1,289**
envelopes. The baseline classifier was loaded from the baseline commit using Node's TypeScript
stripper; the V88 classifier was loaded from the working tree. This avoids attributing an older
report's missing entries to the grammar change. The authoring comparison found:

| Measure | Count |
| --- | ---: |
| Current envelopes supplied to both classifiers | 1,289 |
| Envelopes with changed classification JSON | 105 |
| Potency diagnostics promoted from unbounded to bounded | 236 |
| Potency diagnostics demoted from bounded to unbounded | 5 |
| Differences after removing only `bounded` and derived `withinV26Bounded` | 0 |

The committed V64 report contained **1,264** entries. Its 25 missing entries already existed in
the current corpus before V88: five standalone ancestry abilities and 20 granted perk actions.
Against those original 1,264 stable identities the corresponding counts are **235 promotions and
five demotions**, with no other classification changes. The extra current-corpus promotion is
The Wode Defends' tier-three restrained clause; its first two slowed clauses were already bounded
by the baseline grammar. The machine-readable baseline fixture is
`tests/fixtures/v88-audit-baseline.json`: exact stable identities, SHA-256 hashes of canonical old
classification JSON, and the exact changed diagnostic indices/text/flags. The audit test reverses
only those enumerated flags and the derived aggregate before comparing every prior row's bytes.
The 25 additions are asserted independently, rather than silently skipped.

### Five corrected bounded labels

Each clause below is followed by another tier clause. The old diagnostic reader marked the first
post-damage bleeding/slowed clause bounded without checking that it ended the tier. V88 requires
exactly damage followed by one condition clause and no subsequent clause. These five diagnostic
flags are demoted; the abilities remain outside this compiled execution boundary. The engine lead
approved recording this correction in Chords 865.

| Ability | Previously mislabeled clause |
| --- | --- |
| Claw and Blade | `M < 4 bleeding (save ends)` |
| Executioner's Swing | `A < 3 bleeding (save ends)` |
| Heartpiercer | `R < 1 bleeding (save ends)` |
| The Natural Cycle | `P < 1 bleeding (save ends)` |
| Draining Rake | `P < 5 slowed (save ends)` |

### Preexisting report drift: exact 25 additions

- `granted|mcdm.heroes.v1/perk/area-of-expertise/area-of-expertise-inspect-object`
- `granted|mcdm.heroes.v1/perk/creature-sense/creature-sense`
- `granted|mcdm.heroes.v1/perk/criminal-contacts/criminal-contacts`
- `granted|mcdm.heroes.v1/perk/eidetic-memory/eidetic-memory-memorize-text`
- `granted|mcdm.heroes.v1/perk/engrossing-monologue/engrossing-monologue`
- `granted|mcdm.heroes.v1/perk/familiar/familiar-restore`
- `granted|mcdm.heroes.v1/perk/forgettable-face/forgettable-face`
- `granted|mcdm.heroes.v1/perk/friend-catapult/friend-catapult`
- `granted|mcdm.heroes.v1/perk/gum-up-the-works/gum-up-the-works`
- `granted|mcdm.heroes.v1/perk/improvisation-creation/improvisation-creation`
- `granted|mcdm.heroes.v1/perk/ive-got-you/i-ve-got-you`
- `granted|mcdm.heroes.v1/perk/ive-read-about-this-place/i-ve-read-about-this-place`
- `granted|mcdm.heroes.v1/perk/lie-detector/lie-detector`
- `granted|mcdm.heroes.v1/perk/open-book/open-book`
- `granted|mcdm.heroes.v1/perk/ritualist/ritualist`
- `granted|mcdm.heroes.v1/perk/slipped-lead/slipped-lead-escape-bonds`
- `granted|mcdm.heroes.v1/perk/so-tell-me/so-tell-me`
- `granted|mcdm.heroes.v1/perk/thingspeaker/thingspeaker`
- `granted|mcdm.heroes.v1/perk/traveling-artisan/traveling-artisan`
- `granted|mcdm.heroes.v1/perk/traveling-sage/traveling-sage`
- `hero-standalone|mcdm.heroes.v1/feature.ability.revenant/detonate-sigil`
- `hero-standalone|mcdm.heroes.v1/feature.ability.time-raider/concussive-slam`
- `hero-standalone|mcdm.heroes.v1/feature.ability.time-raider/minor-acceleration`
- `hero-standalone|mcdm.heroes.v1/feature.ability.time-raider/psionic-bolt`
- `hero-standalone|mcdm.heroes.v1/feature.ability.wode-elf/the-wode-defends`

## Compiled inventory

The current-main integration report regenerated after V87 reports **13 reachable compiled**,
**1,222 compatibility**, and **two structurally supported but unavailable** entries. Reachability
means the existing grant/loading paths can offer the ability; it is distinct from a claim that
its new V88 lifecycle has passed backend proof. V88 introduces no grant, parent trait, character
choice, content seed or foe-loading rule. V87's full-core foe seeding makes Razor Claws, Eye Flash,
Bola Knock and Power Chord reachable; their added current-main proof is an integration gate. The
Wode Defends was already granted by the ancestry work; its new compiled migration and live design
were approved in Chords 861.

Paths below are exact report provenance. Hero paths are repository-relative; foe paths beginning
`en/books/monsters/` are relative to `vendor/steel-compendium/`. Their unified research equivalents
are under `vendor/steel-compendium/en/unified/md/monster/` with the same family/statblock suffix.

### Thirteen reachable entries

| Ability | Exact source path | V88 change |
| --- | --- | --- |
| Melee Weapon Free Strike | `vendor/steel-compendium/en/unified/md/feature/ability/common/melee-weapon-free-strike.md` | Existing compiled damage/push behavior unchanged. |
| Ranged Weapon Free Strike | `vendor/steel-compendium/en/unified/md/feature/ability/common/ranged-weapon-free-strike.md` | Existing compiled damage/push behavior unchanged. |
| Viscous Fire | `vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/viscous-fire.md` | Existing compiled damage/push behavior unchanged. |
| Brutal Slam | `vendor/steel-compendium/en/unified/md/feature/ability/fury/level-1/brutal-slam.md` | Existing compiled damage/push behavior unchanged. |
| The Wode Defends | `vendor/steel-compendium/en/unified/md/feature/ability/wode-elf/the-wode-defends.md` | Moves compatibility to compiled; slowed/slowed/restrained conditions. |
| Spear Charge | `en/books/monsters/md/monster/goblin/statblock/goblin-warrior.md` | Existing compiled damage/push behavior unchanged. |
| Bite | `en/books/monsters/md/monster/goblin/statblock/worg.md` | Existing compiled damage/push behavior unchanged. |
| Razor Claws | `en/books/monsters/md/monster/undead/1st-echelon/statblock/ghoul.md` | Existing pure-supported damage becomes live through V87; tier-three bleeding remainder now compiles. |
| Eye Flash | `en/books/monsters/md/monster/hobgoblin/statblock/hobgoblin-redglare.md` | V87 makes the Redglare loadable; slowed/restrained/restrained conditions compile. |
| Bola Knock | `en/books/monsters/md/monster/lizardfolk/statblock/lizardfolk-bloodeye.md` | V87 makes the Bloodeye loadable; all three restrained conditions compile. |
| Power Chord | `en/books/monsters/md/monster/orc/statblock/orc-godcaller.md` | V87 makes the Godcaller loadable; tier-three weakened remainder now compiles. |
| Eye of Surlach | `en/books/monsters/md/monster/goblin/statblock/goblin-cursespitter.md` | Moves compatibility to compiled; weakened conditions. |
| Bury the Point | `en/books/monsters/md/monster/goblin/statblock/goblin-warrior.md` | Promotes the existing manual bleeding remainder to a condition node. |

### Two unavailable entries

| Ability | Exact source path | V88 boundary |
| --- | --- | --- |
| Meteoric Introduction | `vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/meteoric-introduction.md` | Existing pure damage/push support unchanged; no live grant. |
| Ray of Agonizing Self-Reflection | `vendor/steel-compendium/en/unified/md/feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md` | Existing pure-supported ability; slowed remainders now compiled. No live grant. |

## Source constraints and ability designs

A promoted tier is one compiled damage expression followed by exactly one
`<characteristic> < <printed integer or WEAK/AVERAGE/STRONG>, <core condition> (save ends)`
clause. The comma is optional. Source clause, structural locator and damage dependency are retained.
All nine core conditions are recognized; compound conditions, trailing prose/clauses, EoT, non-save
ends, multiple targets and other envelope diagnostics remain unsupported. An ability may have
plain damage tiers alongside one bounded condition tier, as Razor Claws and Power Chord do.

The pinned potency rule is **target score < threshold**, so equality resists. Hero thresholds are
supplied by the evaluator's class-named potency characteristic under Q-CHAR-12, independently of
which characteristic rolled the attack or damage. Printed foe thresholds are used unchanged.
Missing scores and object/squad targets are fact-needed, not zero. Incomplete damage prevents
condition application until that dependency is established. Condition consequences, potency
adjustments, parent traits and additional abilities remain manual/out of scope. The pinned
saving-throw rule supplies the eventual live lifecycle: one d10 at the affected creature's turn
end, 6+ ends the instance. Pure structural support alone does not schedule or roll saves.

Rules research: `rule/character/potency.md`, `rule/general/saving-throw.md`,
`rule/dice/ability-roll.md`, and `condition/*.md` under the unified source root; class-named
potency resolution is recorded at `docs/rules-questions-for-user.md#q-char-12`.

### Changed reachable abilities

- **Bury the Point:** Goblin Warrior, main action, melee 1, one creature, fixed roll +2,
  2 Malice. Tiers deal **5/6/7** damage then test **M < 0/1/2**, bleeding (save ends).
  Might 2 resists all three; Might 0 resists/applies/applies; Might −1 applies all three.
  This source table drives the pure tests and BP6–BP10 live design in the V88 slice document.
  Correction changes the printed tier threshold without repaying Malice or rerolling damage dice.
- **Eye of Surlach:** Goblin Cursespitter signature main action, ranged 15, one creature,
  fixed roll +2, no printed activation cost. Tiers deal **3/4/5 corruption** damage then test
  **I < 0/1/2**, weakened (save ends). Intuition 0 gives resisted/applied/applied;
  Intuition 2 resists every tier. No other cursespitter ability or Crafty trait is executed.
  Applied/resisted live cases belong to its V88 design and headless runner.
- **The Wode Defends:** Existing Wode Elf ancestry signature main action, ranged 10,
  one creature, roll Might or Agility, no printed cost. Tiers deal **2/3/5 + M or A** damage,
  then test target **A < WEAK/AVERAGE/STRONG**. Conditions are **slowed/slowed/restrained**,
  all save ends. For class-evaluated potencies 0/1/2, target Agility 1 resists tiers 1/2 and
  receives restrained at tier 3; Agility 0 receives slowed at tier 2. The potency basis is the
  class's named characteristic, not implicitly the roll choice. The ancestry granting trait
  remains intact; the V88 slice document owns the live cases and retained grant proof.
  Pure test WD3 holds evaluated Reason potency at 0/1/2 while choosing Might 2 or Agility 3
  for roll and damage. Both choices reach tier 2 on 6+6, retain threshold 1 and apply slowed
  to Agility 0; both reach tier 3 on 8+8, retain threshold 2 and apply restrained. Damage
  remains 5/6 at tier 2 and 7/8 at tier 3, independently of the potency characteristic.

### Changed unavailable abilities: source-backed compile-only designs

- **Ray of Agonizing Self-Reflection (RAY1):** Elementalist main action, ranged 10, one
  creature or object, Reason roll. Tiers deal **2/4/6 + R corruption** damage then test target
  **R < WEAK/AVERAGE/STRONG**, slowed (save ends). For actor Reason 2, Intuition 3, evaluated
  Reason potencies remain **0/1/2**. Target Reason 1 resists tiers 1/2 and is affected at tier 3;
  tier 2 damage is **4 + 2 = 6**, without added build bonuses. Unknown Reason requires the
  missing target fact, and absent evaluated potency requires `actor.potency.<tier>` rather
  than falling back to the highest score. `tests/scripts/compiled-ability.test.ts`, test
  `RAY1 uses evaluated Reason potency even with higher Intuition`, implements that proof
  with source-derived expectations. It is compile-only; no live Ray use or new grant is claimed.
- **Razor Claws:** Ghoul signature main action, melee 1, one creature or object, fixed roll +2,
  no printed cost. Tiers **3/4/5** damage; only tier 3 adds **M < 2 bleeding (save ends)**.
  Target Might 1 is affected and Might 2 resists at tier 3; earlier tiers have no condition.
  Existing pure constant-damage tests remain; the condition assertion now identifies a
  condition occurrence and missing target facts. Ghoul parent traits/Leap remain outside
  this ability envelope and are not automated.
- **Eye Flash:** Hobgoblin Redglare signature main action, ranged 10, one creature or object,
  fixed roll +3, no printed cost. Tiers **9/14/17 corruption** damage then **P < 1/2/3**;
  condition is **slowed/restrained/restrained**, save ends. Target Presence 1 resists tier 1
  and is restrained at tiers 2/3; equality at Presence 2 resists tier 2. Its single bounded
  condition per tier removes the old unsafe-remainder diagnostic. V87 now makes the Redglare loadable; the seeded-inventory addendum records its applied,
  resisted and changed-condition proof.
- **Bola Knock:** Lizardfolk Bloodeye signature main action, ranged 5, one creature or object,
  fixed roll +2, no printed cost. Tiers **5/7/9** damage then **A < 0/1/2 restrained (save ends)**.
  Target Agility 0 resists/applies/applies; target Agility 2 resists all tiers. Only the bounded
  strike is compiled. Reptilian Escape grants a separate response involving tail loss and
  shifting; that parent trait is retained as source context, not executed or newly granted.
  V87 now makes the Bloodeye loadable; its bounded strike receives live proof in the
  seeded-inventory addendum. No Reptilian Escape trait-completion claim is made.
- **Power Chord:** Orc Godcaller signature main action, melee 1 or ranged 10, one creature or
  object, fixed roll +2, no printed cost. Tiers **5/7/9 sonic** damage; only tier 3 adds
  **P < 2 weakened (save ends)**. Presence 1 is affected and Presence 2 resists at tier 3;
  tiers 1/2 have no condition. Cadenza, Rallying Ostinato and Relentless remain separate
  source mechanics with no new automation. V87 supplies the Godcaller loading path;
  the seeded-inventory addendum proves only the bounded Power Chord tiers.

Meteoric Introduction's existing compile-only damage/push design is unchanged. V87's foe-library
seeding activates the four rows identified above, so the current-main integration must satisfy their
trait-granted ability and live proof gates. This report adds no grant and does not claim automation
of any separate parent-trait consequence.

## Seeded inventory proof addendum

The owner addendum starts at DEPLOY integration `c721d0b`, preserving the 1151-entry corpus and
internal reseed action. [Exact designs and cases](seeded-inventory-design.md) cover all four
newly reachable entries. The preceding pre-V87 certificates remain historical; new proof must
name its own integrated source/target. No production rule, grant or loading path is added.
