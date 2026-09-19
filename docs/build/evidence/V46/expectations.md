# V46 source-derived expectations

Written **before** any V46 implementation change and before running the evaluator, as
[the build process](../../README.md#verification-baseline) and
[the reference procedure](../../character-verification.md#3-establish-the-expected-build-independently)
require. Every expected result below is derived from the pinned Compendium sentence quoted beside
it. Nothing here is read out of Salient's evaluator, Forge Steel, or a previous fixture snapshot.

## Pins and provenance

| Purpose | Revision |
| --- | --- |
| Rules authority (Steel Compendium) | `fb83a789da8f0327a389c277a0c790b1648d5810` |
| Structure and counterpart application (Forge Steel) | `5a846aadb623a9855a023e9403bb887a956c341f` |
| Salient baseline | `main` `342427d` (rebased forward from `656d831`; only documentation in between) |

Source paths are relative to `vendor/steel-compendium/`. Hashes are of the file at the pin above.

| Source file | SHA-256 |
| --- | --- |
| `en/unified/md/ancestry/devil.md` | `0d4ea539d90fbe879a45fb04f2c5dc25b3583d3e691b4a9bd25be6852f824ca5` |
| `en/unified/md/feature/trait/devil/devil-traits.md` | `9a7bee3cda688eab4033927ebac09cdbfeb3bd3e3ae4f0b1515d4f9210178476` |
| `en/unified/md/feature/trait/devil/silver-tongue.md` | `1a381fd6c9cd61ec50496edcaed500095a08c460276f53b9f0d64ddb665359d9` |
| `en/unified/md/feature/trait/devil/barbed-tail.md` | `8608caa118033b302e76597c8ece35a3bfe2faf260c3f1f9a7015dc40d238a09` |
| `en/unified/md/feature/trait/devil/beast-legs.md` | `aa0330f529bdcc4b6acff0d9aab3e27519c6d7c23e0a8cd1c43d06a90506101d` |
| `en/unified/md/feature/trait/devil/glowing-eyes.md` | `e927ad90648c4a5e1b475cc61eb63b3acf03c2f1083c66272403f3c8baf6ac84` |
| `en/unified/md/feature/trait/devil/hellsight.md` | `f23bfd5ab46d73b5676b2626c483a6a755072c2badf73c1ac5fce01678b73a08` |
| `en/unified/md/feature/trait/devil/impressive-horns.md` | `07fe6ab2f0b881d56b3146f3803f3f18790c8ebb6d79a03c1614f21f8eb40b3f` |
| `en/unified/md/feature/trait/devil/prehensile-tail.md` | `2d5481f63359de78884f98ea1070125f169ce21566390754b25978fea370d747` |
| `en/unified/md/feature/trait/devil/wings.md` | `5eca88095f208d18e1e40aab0c646f787472a5f12bff36ee8953561c6078a4fc` |
| `en/unified/md/skill/group/interpersonal.md` | `d9d4ddbb59dc24d33c897ed6021358b984bedbf685772ea9db92d28483d07945` |
| `en/unified/md/movement/fly.md` | `5a985f4af7014a7bfebe1b8a4b74dbea05b2b2ac3ee3e4bd9484de37e76ba92f` |
| `en/unified/md/rule/character/speed.md` | `ac435b9ab73fd3f594d3c304205e2d2937ed8b4726ca91e4f667e7486d7dfa6b` |
| `en/unified/md/chapter/ancestries.md` | `e2aedc36cfc22aa4fc3c572c7bc92f215fe486d0fc024708c26f17386850f226` |
| `en/unified/md/rule/general/saving-throw.md` | `c10e7c0565074ea0e04ac1400e379c16f84562c6bb7345e9e83bfae0d5df0a7c` |
| `en/unified/md/rule/damage/damage-weakness.md` | `06813c15f5811dae8ba33179acbe489c474e9d7a50cefd912c4ea462687d3d1c` |
| `en/unified/md/rule/combat/concealment.md` | `431d295f34c1f032d31b8427fc91e8ae6597ac48b69a64e2d608940d3dc08a6b` |
| `en/unified/md/rule/dice/edge.md` | `e2a98df0bd44eb20b06de5735ab124c7a43da7852e5cb407c4ef290d0aedb884` |
| `en/unified/md/feature/trait/polder/small.md` | `a3de3dfb2ae35401d43240a90137538bc608e402901e01eedb7393d0c7701280` |

Quotes below are normalized the way R01 normalizes source text: Markdown links collapse to their
label, emphasis markers are removed and whitespace is collapsed. The existing
`tests/fury-decisions.test.ts` normalizer defines this exactly; V46 adds the same check for the
assembled Devil rows, which the R01 JSON's own check does not cover.

## 1. Ancestry baseline (unchanged by this unit, restated for the arithmetic)

> Unless otherwise noted, a character of any of these ancestries is size 1M and has speed 5 and
> stability 0.

Devil therefore starts at size 1M, speed 5, stability 0 before any trait, kit or other
contribution. This unit changes none of that.

## 2. Purchased-trait budget

`devil-traits.md`:

> You have 3 ancestry points to spend on the following traits. (Quick Build: Beast Legs,
> Impressive Horns.)

`chapter/ancestries.md` states the exclusion explicitly:

> But they couldn't select both Impressive Horns and Wings, since their combined cost of 4 exceeds
> the ancestry points budget for the devil.

Silver Tongue is the signature trait and carries no `cost:` field; `chapter/ancestries.md` says a
signature trait is one "your hero gets for free if they take that ancestry", so it never consumes
ancestry points. It is a separate decision from the points decision, and the points decision's
options are exactly the seven purchased traits.

Costs come from each trait file's `cost:` front matter: Barbed Tail 1, Beast Legs 1, Glowing Eyes
1, Hellsight 1, Impressive Horns 2, Prehensile Tail 2, Wings 2. Total distinct cost is 10 points
against a 3-point budget, so **at least four completed builds** are required to witness every
purchased trait; four suffice and the templates below use exactly four.

Expected diagnostics, derived from the budget sentence and the existing contract:

| Selection | Cost | Expected |
| --- | ---: | --- |
| Beast Legs + Impressive Horns | 3 | complete, no diagnostic |
| Impressive Horns + Wings | 4 | `budget-exceeded` |
| Barbed Tail + Glowing Eyes + Hellsight | 3 | complete, no diagnostic |
| Beast Legs only | 1 | nonblocking `budget-unspent` warning; status unchanged |
| Wings + Hellsight | 3 | complete, no diagnostic |

### An untyped damage weakness applies to any type

`rule/damage/damage-weakness.md` decides what Wings' weakness applies to, and Wings names no type:

> A creature who has "damage weakness X" with no specific type or keyword indicated has weakness of
> the indicated amount when they take damage of any type.

So Wings' weakness is **all damage**, recorded with `damageType: 'all-damage'` — the literal
`DamageModifierEntry` in `shared/contracts/rollResolution.ts` documents for an untyped weakness —
and the entry cites this rule alongside the trait sentence. The older `damageWeaknesses` list
spells the same idea `allDamage`; this field deliberately does not copy that inconsistency. The
same file supplies the interactions the table applies manually: the weakness is applied before an
immunity, and only the highest applicable weakness applies.

The unspent-point warning is existing accepted behavior (the Fury fixture records it under the
accepted unspent-point policy); this unit preserves it and does not change its severity.

## 3. Trait effects, classified

`build` means a permanent value the build calculates. `conditional` means an amount the build
calculates for an effect the source gates on a condition or an activation; it is recorded with its
condition and is never applied automatically. `manual` means the effect is resolved at the table
and the build calculates nothing.

| Trait | Cost | Source sentence (normalized) | Classification | Expected representation |
| --- | ---: | --- | --- | --- |
| Barbed Tail | 1 | Once per round when you make a melee strike, you can deal extra damage with the strike equal to your highest characteristic score. | conditional + manual | Granted feature. One `conditional-effect` `extra-strike-damage`, amount = highest characteristic score, condition quoting the once-per-round melee-strike clause. Activation, once-per-round tracking and application are manual. Not an `abilityModifier`: that list is applied automatically in damage resolution. |
| Beast Legs | 1 | You have speed 6. | build | Speed **set** to 6 (not +6) at the ancestry contribution, before kit and other contributions. |
| Glowing Eyes | 1 | Whenever you take damage from a creature, you can use a triggered action to deal that creature psychic damage equal to 1d10 + your level. | manual | Granted feature **and** a granted ancestry ability carrying the trait's source path, so the trigger and the 1d10 + your level formula are readable. Build selection does not activate it; the roll and damage are manual. No derived amount, for a reason of kind rather than convenience: `1d10 + your level` is a dice expression, and a `conditional-effect` amount is a single number, so recording one would have to drop the die. The ability card carries the whole expression, including the psychic damage type, and the level is a baseline value. Barbed Tail differs because its magnitude *is* a number the build must compute. |
| Hellsight | 1 | You don't take a bane on strikes made against creatures with concealment. | manual | Granted feature only. Nothing is calculated, so the reading below does not change any value this unit produces. **Interpretation:** the sentence removes the bane that `rule/combat/concealment.md` imposes, not every bane on such a strike; the alternative literal reading would suppress unrelated banes too. Neither reading is a number on the sheet, and concealment is resolved at the table either way. |
| Impressive Horns | 2 | Whenever you make a saving throw, you succeed on a roll of 5 or higher. | build | Saving-throw threshold **set** to 5, replacing the ordinary 6. |
| Prehensile Tail | 2 | You can't be flanked. | manual | Granted feature only. No defensive statistic changes; flanking is adjudicated at the table. |
| Wings | 2 | While using your wings to fly, you can stay aloft for a number of rounds equal to your Might score (minimum 1 round) before you fall. / While using your wings to fly at 3rd level or lower, you have damage weakness 5. | build + conditional + manual | A Fly movement mode citing the trait and `movement/fly.md`; one `conditional-effect` `rounds-aloft` with amount `max(1, Might)`; one `conditional-effect` `damage-weakness` amount 5 with the 3rd-level-or-lower condition. Movement, elapsed rounds, falling and the weakness are applied manually. The weakness must not enter `damageWeaknesses`, which has no condition and is displayed as always in effect. |

Two source readings worth stating explicitly, because both are places an implementation could
drift:

- **Beast Legs sets, it does not add.** "You have speed 6" replaces the ancestry's speed 5. A kit
  speed bonus then adds to 6. The existing Grug reference (Mountain kit, speed bonus 0) cannot
  distinguish set from add, so V46 adds a focused test with a nonzero kit speed bonus.
- **The Fly movement mode is an interpretation, and a labelled one.** `movement/fly.md` describes a
  creature who "has 'fly' in their speed entry" or who "gains the temporary ability to fly". Wings
  is neither phrase exactly: it is an activated, duration-limited use. Recording it as a granted
  movement mode with the verbatim condition "While using your wings to fly" keeps the restriction
  attached to the grant; the alternative, recording no mode and leaving flight entirely to the
  table, would lose the only durable statement that this hero can fly at all. Forge Steel
  independently models it as a movement-mode feature, which is corroboration of the reading, not
  authority for it.
- **Wings' aloft limit uses the Might score, floored at 1.** "equal to your Might score (minimum 1
  round)" gives `max(1, Might)`. Grug's Might 2 gives 2 rounds; Bethell's Might -1 gives 1 round.
  The minimum clause is only exercised by a negative or zero Might, which is why template D keeps
  Bethell's -1 assignment.

### Support metadata

`ancestry.devil.purchased-traits` carried `supportedSetInV001: ['Beast Legs', 'Impressive Horns']`,
which the wizard renders as an "offered set" caption. That caption's purpose is to say which legal
options are held back; with all seven offered it would only restate the list above it. The field is
therefore removed rather than completed. Polder, which does still hold three traits back, never
carried the field, so per-option `supportedInV001` flags are the established way the wizard shows
that distinction.

## 4. Silver Tongue

`silver-tongue.md`:

> You have one skill of your choice from the interpersonal skill group (see Skills in Chapter 9:
> Tests), and you gain an edge on tests when attempting to discover an NPC's motivations and
> pitfalls during a negotiation (see Chapter 11: Negotiation).

Two separate grants. The skill is a build grant; the negotiation edge is manual and readable, with
no negotiation workflow implied.

`skill/group/interpersonal.md` lists exactly thirteen skills, which is the complete eligible pool:
Brag, Empathize, Flirt, Gamble, Handle Animals, Interrogate, Intimidate, Lead, Lie, Music, Perform,
Persuade, Read Person. The R01 pool `pool.skills.interpersonal` already holds all thirteen; only
the support list restricted the choice to Persuade, so this unit adds twelve supported values and
must not widen the pool itself.

Selecting an already-granted interpersonal skill keeps the existing duplicate-skill behavior: a
`duplicate-skill` diagnostic and the existing replacement entitlement, not a second grant and not a
new unrestricted replacement. Grug already receives Intimidate from the Martial upbringing, which
makes Intimidate the natural duplicate case to check on that build and the reason template D, not
template A, witnesses Intimidate as an effective grant.

## 5. Reference templates

Four completed builds. Templates A, B and C hold the existing Grug Berserker Fury baseline
constant and vary only the purchased traits, isolating the ancestry contribution. Template D is the
existing Bethell Fire Elementalist with its ancestry changed from Polder to Devil, which also
supplies the ancestry-switch case the reference procedure asks for.

| Template | Base build | Purchased traits (3 points) | Expected ancestry-derived results |
| --- | --- | --- | --- |
| A | Grug: Devil / Berserker Fury 1 / Soldier / Mountain kit, Might 2 | Beast Legs (1) + Impressive Horns (2) | Speed 6; stability 2 (base 0 + Mountain 2); size 1M; saving throws succeed on 5+. Identical to the existing V25 Fury fixture, which this template must not change. |
| B | Same Grug baseline | Barbed Tail (1) + Prehensile Tail (2) | Speed 5 (ancestry base, Mountain adds 0); saving throws succeed on 6+ (ordinary threshold restored); conditional extra strike damage 2 (highest characteristic score, M 2 = A 2); cannot be flanked, manual. |
| C | Same Grug baseline | Glowing Eyes (1) + Wings (2) | Speed 5; saving throws 6+; Fly movement mode; rounds aloft 2 (Might 2); conditional damage weakness 5; granted ancestry ability Glowing Eyes reading 1d10 + your level, level 1. |
| D | Bethell: Fire Elementalist 1 / Mage's Apprentice / no kit, Might -1, ancestry changed Polder to Devil | Wings (2) + Hellsight (1) | Size 1M (was 1S as a Polder); speed 5; stability 0 (no kit); Fly movement mode; rounds aloft 1 (max(1, -1) = 1, the minimum clause); conditional damage weakness 5; concealment bane exception, manual. Polder's traits and its Small! size contribution are gone — the 1S came from the signature trait `feature/trait/polder/small.md` ("Your size is 1S."), not from a Polder-specific speed or stability baseline, because every ancestry shares the same 5/0 baseline. The Graceful Retreat disengage contribution is gone with it; Elementalist class grants, background choices and authored details are unchanged. |

Silver Tongue witness ledger. Thirteen completed witnesses are required because the choice has
thirteen eligible values; templates are reused rather than multiplying trait combinations.

| Silver Tongue choice | Template | Note |
| --- | --- | --- |
| Persuade | A | The existing V25 reference selection. |
| Empathize | A | |
| Gamble | A | |
| Handle Animals | A | |
| Interrogate | A | |
| Lead | A | |
| Lie | A | |
| Music | A | |
| Perform | A | |
| Read Person | A | |
| Brag | B | |
| Flirt | C | |
| Intimidate | D | Grug already has Intimidate from the Martial upbringing, so on template A it would be a duplicate rather than an effective grant. Bethell has no interpersonal skill collision. |

Bethell already uses Empathize for the duplicate fixed-Magic replacement, so template D avoids
Empathize. Both collisions are checked separately as duplicate cases rather than being hidden by
choosing around them everywhere.

### Recorded uncertainty

Two places where the pinned source is silent. Neither changes a value this unit produces, so
neither blocks it, and neither is resolved by guessing:

- **Barbed Tail with a non-positive highest characteristic.** The sentence says "extra damage ...
  equal to your highest characteristic score" and states no floor, unlike Wings' explicit
  "(minimum 1 round)". `rule/character/characteristic.md` permits negative scores. Every supported
  level-one class fixes at least one characteristic at 2, so the case is unreachable here; the
  amount is recorded as the source states it, with no invented floor.
- **Whether the rounds-aloft allowance resets per takeoff or is spent once.** The source says only
  how many rounds the hero can stay aloft before falling. The build records the limit; elapsed
  rounds and falling are table state, so the question does not arise in the build.

On an incomplete build the Fly movement mode appears as soon as Wings is chosen, but no
rounds-aloft amount is recorded until Might is known, and no Barbed Tail amount until the
characteristics are. Absent, not defaulted: a partial baseline omits values it cannot yet derive,
the same way speed reads "pending" before a kit is chosen.

Silver Tongue's negotiation edge is a +2 bonus under `rule/dice/edge.md`; it stays readable and
manual, and no test or sheet value depends on the number.

## 6. What must not change

- The existing V25 Fury and Bethell fixtures, including provenance chains, and the V32 Berserker
  Fury level-two results.
- Polder and Elementalist contributions and their position relative to kit and background effects.
- The R01 reference JSON `shared/content/fury-level-one-decisions.json`, which keeps its obsolete
  copies of the Devil rows by V45's module-ownership rule.
- The supported level and advancement registry: Devil level one enables no new level, class,
  subclass or transition.
- `damageWeaknesses`, `damageImmunities`, `conditionImmunities` and `abilityModifiers` semantics.
