# Roll and damage resolution contract (R04)

Status: rules contract written 2026-09-14 by the R04 rules researcher; rules review required
before A05 implements it. Every arithmetic rule below quotes its source sentence and path. The only
source is the pinned Steel Compendium submodule at revision
`fb83a789da8f0327a389c277a0c790b1648d5810` (`v4.20260908021459`). Paths are repo-relative and
abbreviated with `SC = vendor/steel-compendium/en/unified/md`. Quotations reproduce the source
wording with its Markdown link markup removed; nothing else is changed.

The user-confirmed table decisions this contract implements are in `docs/table-spec.md` (sections
listed in `docs/build/R04-roll-and-damage-resolution.md#spec-references`). This contract does not
re-decide them. Where the Compendium is silent or ambiguous in a way that changes an outcome, the
paragraph is labeled **Interpretation** or points to a `Q-R-n` entry in
`docs/rules-questions-for-user.md`, and states what the app records meanwhile.

Types for every input and output described here are in `shared/contracts/rollResolution.ts`.

## 1. Power roll

### 1.1 Dice and characteristic

> "When you make a power roll, you roll two ten-sided dice (usually noted as 2d10 in the rules) and
> add one of your characteristics." — `SC/rule/dice/power-roll.md`, *Making a Power Roll*

> "If an ability requires a power roll, it has a "Power Roll" entry that tells you which
> characteristic to add to the 2d10 roll you make when you use the ability." —
> `SC/rule/dice/ability-roll.md`

Contract: `d10a + d10b + characteristicValue` where `characteristicValue` is the current score of the
selected characteristic. Director-controlled stat blocks print a fixed number instead of a
characteristic, for example "**Power Roll + 2:**" (`SC/monster/goblin/statblock/goblin-warrior.md`,
Spear Charge); that printed number is the roll modifier for the creature's abilities.

### 1.2 Natural roll

> "The total of your power roll before your characteristic or any other modifiers are added is
> called the natural roll." — `SC/rule/dice/natural-roll.md`

Contract: `naturalRoll = d10a + d10b`. Bonuses, penalties, edges and banes never change it.

### 1.3 Numeric bonuses and penalties (skills and similar)

> "Bonus and penalty values are specified in the rules that impose them, and are calculated
> independently of edges and banes, and before edges and banes are factored into a power roll. There
> is no limit to the number of bonuses or penalties that can apply to a power roll, and bonuses and
> penalties always add together." — `SC/rule/dice/bonuses-and-penalties.md`

Contract: `bonusTotal` is the sum of every supplied numeric bonus and penalty (penalties negative).
It is added before the edge/bane step. For v0.01 the only expected bonus is the agreed test skill
(+2, section 5). Each bonus is recorded with its label.

### 1.4 Edges and banes

> "When you make a power roll with an edge, you gain a +2 bonus to the roll. If you make a power
> roll with two or more edges, you have a **double edge**. With a double edge, you don't add anything
> to the power roll, but the outcome of the roll automatically improves one tier (to a maximum of
> tier 3)." — `SC/rule/dice/edge.md`

> "When you make a power roll with a bane, you take a −2 penalty to the roll. If you make a power
> roll with two or more banes, you have a **double bane**. With a double bane, you don't subtract
> anything from the power roll, but the outcome of the roll automatically decreases one tier (to a
> minimum of tier 1)." — `SC/rule/dice/bane.md`

> "In general, edges and banes cancel each other out, resolving as follows:
> - If you have an edge and a bane, or if you have a double edge and a double bane, the roll is
>   made as usual without any edges or banes.
> - If you have a double edge and just one bane, the roll is made with one edge, regardless of how
>   many individual edges contribute to the double edge.
> - If you have a double bane and just one edge, the roll is made with one bane, regardless of how
>   many individual banes contribute to the double bane." — `SC/rule/dice/power-roll.md`, *Rolling
> With Edges and Banes*

Contract, from supplied nonnegative integer counts `edges` and `banes` (per target, see 1.7):

1. `e = min(edges, 2)`, `b = min(banes, 2)` ("two or more" is a double; extra counts add nothing).
2. `net = e − b`, in `{−2, −1, 0, 1, 2}`.
3. `net = +1`: `edgeBaneModifier = +2`, `tierShift = 0`.
   `net = −1`: `edgeBaneModifier = −2`, `tierShift = 0`.
   `net = +2` (double edge, no bane): `edgeBaneModifier = 0`, `tierShift = +1`.
   `net = −2` (double bane, no edge): `edgeBaneModifier = 0`, `tierShift = −1`.
   `net = 0`: no modifier, no shift.

The `net` reduction is exactly the source's three cancellation cases plus the single-modifier
cases: double edge and one bane gives `net = +1` (one edge); double bane and one edge gives
`net = −1` (one bane); equal counts cancel. Three edges and one bane is still a double edge and one
bane ("regardless of how many individual edges contribute"), so `net = +1`. The mapping is fully
specified by the source; no interpretation is needed.

### 1.5 Total and tier

> "**Tier 1:** If your power roll total is **11 or lower**, it is a tier 1 outcome." /
> "**Tier 2:** If your power roll total is **12 to 16**, it is a tier 2 outcome." /
> "**Tier 3:** If your power roll total is **17 or higher**, it is a tier 3 outcome." —
> `SC/rule/dice/tier-outcome.md`

Contract:

```
total      = naturalRoll + characteristicValue + bonusTotal + edgeBaneModifier
baseTier   = total <= 11 ? 1 : total <= 16 ? 2 : 3
tier       = clamp(baseTier + tierShift, 1, 3)      // then section 1.6 overrides upward
```

### 1.6 Natural 19 and 20

> "When you roll a natural 19 or 20 on a power roll, it is always a tier 3 result regardless of any
> modifiers, and on certain types of power rolls, this is a critical hit (see Critical Hit in
> Classes)." — `SC/rule/dice/natural-roll.md`

Contract: if `naturalRoll >= 19` then `tier = 3` regardless of `total` and ordinary edges or banes,
including a double bane's tier decrease.

**User decision, 2026-09-14 (Q-R-1):** natural 19/20 overrides ordinary edges and banes. A dedicated
[source check](research/natural-roll-precedence.md) supports this: Natural Roll says “regardless of
any modifiers” and Power Rolls describes edges/banes as modifying a roll. No sentence names the
exact double-bane conflict; the combined reading is now confirmed by the user. Record `tier = 3`
and `naturalNineteenOrTwenty = true`; this resolved case no longer warrants a Q-R-1 uncertainty
label. Tests separately grant success with a reward on natural 19/20. Preserve the distinct
critical-hit requirements and rules for voluntary downgrades or forced automatic tiers.

### 1.7 One roll, per-target outcome

> "When an ability has multiple targets (whether a strike with more than one target or an area
> affect), you make one power roll and apply the total to all targets. If you have edges or banes
> (see Chapter 1: The Basics) against some but not all of your targets, you might apply a different
> tier outcome to individual targets." — `SC/chapter/classes.md`, *Roll Against Multiple Creatures*

> "For example, if you target three creatures with a strike ability and the power roll totals 11,
> each of the targets should be affected by the tier 1 outcome of the ability. However, if you gain
> an edge on strikes against one of the targets to add 2 to the power roll, your total against that
> target is 13, and they are affected by the tier 2 outcome of the ability." — same section

Contract: one `naturalRoll` per ability use. Sections 1.3 to 1.6 are evaluated once per target with
that target's own `edges`/`banes` counts (the confirmed target-only input model,
`docs/table-spec.md#v001-edge-and-bane-inputs`). Each target gets its own `total`, `tier` and
damage. A single-target attack is the one-target case of the same procedure.

### 1.8 Characteristic selection

> "**Power Roll + Might or Agility:**" — `SC/feature/ability/common/melee-weapon-free-strike.md`

> "Certain abilities let you use your highest characteristic score for the power roll." —
> `SC/rule/dice/ability-roll.md`, *Characteristics and Damage*

Contract: the ability's power-roll entry defines the permitted set (`permittedCharacteristics`).
Default selection is the permitted characteristic with the highest current value (ties: first in the
ability's printed order); the acting user may choose any other permitted one before firing
(`docs/table-spec.md#v001-roll-characteristic-default`). Recorded: `selectedCharacteristic` and
`characteristicValue`. A characteristic outside the printed set is never offered.

### 1.9 Downgrading (source rule, not automated in v0.01)

> "Whenever you make a power roll, you can downgrade it to select the outcome of a lower tier." /
> "If you downgrade a critical hit, you still get the extra action benefit of the critical hit" —
> `SC/rule/dice/power-roll.md`, *Downgrade a Power Roll*

Not in the R04/A05 scope list. If a player downgrades at the table, the app records the rolled tier
and a manual result for the chosen lower tier (`ManualResolution` in the types); the critical
additional-main-action opportunity is unaffected.

### 1.10 Automatic tier outcomes

> "Effects in the game sometimes allow a creature to obtain an automatic tier 1, 2, or 3 outcome on a
> power roll. Such effects supersede any edges, banes, bonuses, or penalties that might affect the
> roll." — `SC/rule/dice/power-roll.md`, *Automatic Tier Outcomes*

No v0.01 supported feature grants one; if a table asserts one, it is a manual result with the source
clause quoted. The type carries an optional `automaticTier` for that record only.

## 2. Critical hits

> "Whenever you make an ability roll as a main action and the roll is a natural 19 or natural 20-a
> total of 19 or 20 before adding your characteristic score or other modifiers—you score a critical
> hit. A critical hit allows you to immediately take an additional main action after resolving the
> power roll, whether or not it's your turn and even if you are dazed (see Conditions below)." —
> `SC/rule/combat/critical-hit.md`

> "You can't score a critical hit with an ability roll made as a maneuver or any other action type,
> but you can score a critical hit with a main action you use off your turn." — same file

> "Whenever you get a natural 19 or 20 on the power roll for a test—a total of 19 or 20 before adding
> your characteristic score or other modifiers you score a critical success." —
> `SC/rule/dice/natural-19-20.md`

Contract:

- `criticalHit = naturalRoll >= 19 && rollKind == "ability" && actionType == "main action"`.
  The Melee/Ranged Weapon Free Strike ("**Main action**") and the Fury signature abilities read for this
  contract, for example Brutal Slam ("**Main action**", worked in 10.13), qualify. A maneuver ability roll never does. A test never scores a
  critical hit; a natural 19/20 on a test is a critical success (section 5).
- One ability use makes one power roll (1.7), so a multi-target main action yields at most one
  critical hit and one additional main action. **Interpretation:** the source text speaks of "the
  roll" and "an additional main action" in the singular; the alternative (one per target) has no
  textual support.
- The additional main action is recorded as an opportunity (`additionalMainActionOffered`) and never
  executed automatically (`docs/table-spec.md#v001-critical-hits-and-additional-main-actions`).
- A modified total of 19 or 20 with a natural roll below 19 is not a critical hit.

Director-controlled creature free strikes never roll (section 4.4), so they never crit.

## 3. Post-roll edge and bane corrections

Application policy (`docs/table-spec.md#director-edits-to-inline-results`): a per-target
add/remove of edges or banes after the roll keeps the accepted dice and recomputes that target's
outcome. Contract: rerun sections 1.3 to 1.6 and section 4 for that target with the same
`naturalRoll` and the corrected counts; `naturalRoll`, `criticalHit` (which depends only on the
natural roll and action type) and the other targets' outcomes are unchanged. The correction records
`before`/`after` inputs and outcomes and the Stamina delta needed to reconcile the already applied
damage without dealing it twice. Counts cannot be negative.

## 4. Tier outcome to damage

### 4.1 Damage expressions

> "Certain damage-dealing abilities note that damage as a number followed by a plus sign (+) and the
> letter M, A, R, I, or P. The indicated letter means you add your characteristic score—either Might,
> Agility, Reason, Intuition, or Presence—to the damage dealt by the ability." —
> `SC/rule/dice/ability-roll.md`, *Characteristics and Damage*

> "Some abilities, including your free strikes, allow you to pick which characteristic score you add
> to their damage. Such abilities use a format similar to "7 + M or A damage," indicating that you can
> add your Might or your Agility to determine the damage." — same section

Contract: a tier's damage clause `N + X` yields `N + characteristicValue(X)`; a flat `N` yields `N`.
Any clause that is not a flat number, `N + <single letter>`, or `N + M or A` is unsupported: the
verbatim clause is recorded as unresolved (`unresolvedClauses`) and no damage is applied for it.

**User decision, 2026-09-14 (Q-R-2):** default to the highest current characteristic permitted by
the damage expression, independently of the roll selection. This matches the highest-permitted
roll default already confirmed in the table spec. A single-letter expression still uses that letter.
For Might 2 and Agility 1, `N + M or A` defaults to Might 2 even if the user chose Agility for the
roll. Preserve the source-authorized choice of another permitted characteristic; this is a default,
not a mandatory choice. Record `damageCharacteristic` and its actual value. Ties use printed order,
as for the roll default. A permitted choice is no longer labeled Q-R-2 uncertainty. This supersedes
the provisional rule tying damage to the roll characteristic.

### 4.2 Kit damage bonus

> "If a kit has a melee damage bonus, that bonus is added to the rolled damage of any damage-dealing
> ability with both the Melee and Weapon keywords. A kit's ranged damage bonus is added to the rolled
> damage of damage-dealing abilities with both the Ranged and Weapon keywords." —
> `SC/chapter/kits.md`, *Damage Bonuses*

> "Kit damage bonuses increase based on the tier outcome of the power roll for a weapon ability, and
> are presented as "+X/+Y/+Z." The X bonus is added to a tier 1 outcome, the Y bonus is added to a
> tier 2 outcome, and the Z bonus is added to a tier 3 outcome." — same file, *Bonuses Across Tiers*

> "Each kit grants a signature ability, **whose distance and damage already includes the kit's
> bonuses**." — same file, *Kit Signature Ability*

> "However, you can't use improvised weapons with weapon abilities gained from your kit, and you add
> no special bonuses from your kit to a weapon ability used with an improvised weapon." — same
> file, *Improvised Weapons* sidebar

> "**Melee Damage Bonus:** +0/+0/+4" — `SC/kit/mountain.md`, *Kit Bonuses*

> "Certain effects talk about rolled damage, which refers to the variable damage determined by making
> an ability roll. If an ability or effect deals damage without requiring a power roll, that is not
> rolled damage" — `SC/rule/damage/rolled-damage.md`

Contract: `kitBonus = kit.meleeDamageBonus[tier]` when the ability has both Melee and Weapon
keywords, is rolled (has a power roll), is not the kit's own signature ability (already included),
and `improvisedWeapon` is false; likewise `rangedDamageBonus` for Ranged + Weapon. Otherwise 0.
Thunder Roar (keywords Area, Melee, Weapon; `SC/feature/ability/fury/level-1/thunder-roar.md`) has
both Melee and Weapon, so the kit melee bonus applies to it even though it is not a strike.
`improvisedWeapon` is a supplied fact defaulting to false; the app cannot observe the weapon.

### 4.3 Damage number

```
rolledDamage(target) = tierConstant + damageCharacteristicValue + kitBonus
```

All three terms are integers; the sum is never negative in the v0.01 content (a negative
characteristic could make a clause smaller than the constant; the source states no floor, so the
arithmetic value is recorded and a negative result is labeled `negative-rolled-damage` (section 11)
rather than applied as healing; unreachable with v0.01 content).

### 4.4 Director-controlled creature free strikes

> "When a Director-controlled creature makes a free strike (see Chapter 10: Combat in *Draw Steel:
> Heroes*), they don't roll. Instead, their stat block notes a Free Strike value representing the
> amount of damage they deal" — `SC/rule/monster/creature-free-strike.md`

Contract: no power roll, no tier, no critical hit; `damage = statBlock.freeStrike`. The Goblin
Warrior's value is `free_strike: 1` (`SC/monster/goblin/statblock/goblin-warrior.md`). Damage type
follows the signature ability's type if any (same file); the Goblin Warrior's Spear Charge is untyped.

### 4.5 Where interpretation stops

> "Unless otherwise indicated, any effects that are determined by a power roll's tier outcome occur
> after the power roll's damage has been dealt to all targets." — `SC/rule/dice/ability-roll.md`,
> *Abilities With Damage and Effects*

Contract: damage for every target is applied first; every non-damage clause (push, potency
condition, shift, surge grant, self-damage option, forced-movement ordering) is recorded verbatim as
unresolved and left to manual resolution / *Resolved at table*. Nothing else is inferred from a
clause.

## 5. Direct test rolls

> "The player makes the power roll. If the character has a skill that applies to the test (see
> Skills later in this chapter), they can ask the Director if the skill applies and justify the use
> of the skill. If the Director agrees the skill applies, the hero gains a +2 bonus to the roll." —
> `SC/rule/test/test.md`

> "The player reports the total of the roll, and the Director interprets its success or failure." —
> same file

Test Difficulty Outcomes table (`SC/rule/test/test-difficulty.md`):

| Power Roll | Easy | Medium | Hard |
| --- | --- | --- | --- |
| ≤11 | Success with a consequence | Failure | Failure with a consequence |
| 12-16 | Success | Success with a consequence | Failure |
| 17+ | Success with a reward | Success | Success |
| Natural 19 or 20 | Success with a reward | Success with a reward | Success with a reward |

Contract: `total = naturalRoll + characteristicValue + skillBonus(+2 if agreed) + otherBonuses +
edgeBaneModifier`; `tier` as in 1.5 with the double edge/bane shift; `naturalRoll >= 19` gives
tier 3 and `criticalSuccess = true` (confirmed Q-R-1; double bane does not reduce the natural result). The outcome
label is produced only when `difficulty` is supplied; otherwise `outcome` is absent and the Director
interprets (`docs/table-command-spec.md#direct-test-rolls`). Opposed rolls
(`SC/rule/dice/opposed-power-roll.md`) are out of scope; a record without difficulty covers them.

## 6. Damage application

### 6.1 Order

> "Whenever a creature takes damage, they reduce their Stamina (see below) by an amount equal to the
> damage taken." — `SC/rule/damage/damage.md`

> "After any damage you take is reduced by damage immunity or other effects, your Stamina is reduced
> by an amount equal to the remaining damage." — `SC/rule/health/stamina.md`

> "If a creature has both damage immunity and damage weakness for a source of damage, apply the
> weakness first, then the immunity." — `SC/rule/damage/damage-weakness.md`

> "Damage immunity should be the last thing applied when calculating damage." —
> `SC/rule/damage/damage-immunity.md`

> "Whenever you take damage while you have temporary Stamina, the temporary Stamina decreases first,
> and any leftover damage is applied to your Stamina as usual. For instance, if you have 10 temporary
> Stamina and take 16 damage, you lose the temporary Stamina and then lose another 6 Stamina." —
> `SC/rule/health/temporary-stamina.md`

Contract, per target and per damage instance:

```
1. incoming        = rolledDamage (4.3) or freeStrike (4.4) or a supplied manual amount
2. afterWeakness   = incoming + weakness          (6.2)
3. afterImmunity   = max(0, afterWeakness − immunity)   (6.2)
4. absorbed        = min(temporaryStamina, afterImmunity)
   temporaryStamina' = temporaryStamina − absorbed
5. staminaDelta    = afterImmunity − absorbed
   stamina'        = stamina − staminaDelta
```

"Other effects" that reduce damage (halving by a triggered action, for example) are responses and out
of scope; when the table applies one, the supplied `manualDamageOverride` replaces step 1 and is
labeled.

### 6.2 Immunity and weakness

> "Whenever a target with damage immunity takes damage of the indicated type, they can reduce the
> damage by the value of the immunity (to a minimum of 0 damage). If the value of the immunity is
> "all," then the target ignores all damage of the indicated type." — `SC/rule/damage/damage-immunity.md`

> "If multiple damage immunities apply to a source of damage, only the immunity with the highest
> value applies." — same file

> "Damage weakness works like damage immunity, except that creatures take extra damage whenever they
> take damage of the indicated type. For instance, if a creature has fire weakness 5 and is dealt 10
> fire damage, they take 15 fire damage instead." / "A creature who has "damage weakness X" with no
> specific type or keyword indicated has weakness of the indicated amount when they take damage of
> any type." / "If multiple damage weaknesses apply to a source of damage, only the weakness with the
> highest value applies." — `SC/rule/damage/damage-weakness.md`

> "Typical damage, such as that caused by weapons, falling, traps, and monstrous claws, has no type
> associated with it." — `SC/rule/damage/damage-type.md`

Contract: an entry applies when its type is `all-damage` (untyped "damage immunity/weakness") or
equals the instance's damage type; untyped damage is matched only by untyped entries. `weakness` and
`immunity` are the highest applicable values (0 when none); an immunity value of `"all"` sets
`afterImmunity = 0`. The v0.01 Goblin Warrior has neither ("-" in both stat block cells).

### 6.3 Winded

> "Your winded value equals half your Stamina maximum. When your Stamina is equal to or less than
> your winded value, you are winded." — `SC/rule/health/winded.md`

> "Whenever you divide an odd number in half and it results in a decimal, round the result down to
> the nearest whole number." — `SC/rule/general/always-round-down.md`

> "Temporary Stamina shouldn't be included in a creature's Stamina total when figuring out a
> creature's recovery value or winded value." — `SC/rule/health/temporary-stamina.md`

Contract: `windedValue = floor(maxStamina / 2)`; `winded = stamina <= windedValue`, evaluated on
ordinary Stamina only. The threshold is the source's exact words: **"equal to or less than your
winded value"**, where the winded value "equals half your Stamina maximum". Winded applies to every
creature: `SC/rule/health/winded.md` ends "You can tell when other creatures are winded and vice
versa", and `SC/chapter/monster-basics.md` refers monsters to the Heroes chapter for "damage and
Stamina, dying and death, ... winded". Grug: 30 / 2 = 15. Goblin Warrior: 15 / 2 = 7.5 → 7.

### 6.4 Zero and below

> "In most circumstances, Director-controlled creatures die or are destroyed when their Stamina drops
> to 0." — `SC/rule/health/stamina.md`, *Director-Controlled Creatures*

> "When your Stamina is 0 or lower, you are dying." / "While your Stamina is lower than 0, if it
> reaches the negative of your winded value, you die." — `SC/rule/health/dying.md`

Contract:

- Ordinary foe: `slain = stamina' <= 0`. **Interpretation:** the Damage rule states a reduction with
  no floor, so `stamina'` records the arithmetic value (it may be negative) and `slain` is the flag;
  a display may show 0. The alternative, clamping the stored value at 0, loses no rule (no core rule
  reads a foe's negative Stamina) and is acceptable if A05 prefers it, but the flag, not the number,
  is the Slain signal. Slain does not end the encounter.
- Hero: `dying = stamina' <= 0` and `deadThresholdReached = stamina' <= −windedValue` are recorded
  labels only; no dying automation, no bleeding application, no Catch Breath block beyond a warning
  (deferred, `docs/pre-alpha-design-gaps.md#v001-combat-acceptance-checklist`).
- Temporary Stamina "doesn't change those states" (`SC/rule/health/temporary-stamina.md`).
- "If you damage a creature with an ability that would kill them, you can choose to instead knock
  them unconscious." (`SC/rule/health/stamina.md`, *Knocking Creatures Out*): an attacker's choice
  recorded as a manual result (`ManualResolution`); the Slain ruling above is unchanged.

## 7. Catch Breath and Recovery spending

> "A creature who uses the Catch Breath maneuver spends a Recovery and regains Stamina equal to their
> recovery value." — `SC/feature/common/maneuvers/catch-breath.md`

> "A creature who is dying (see Dying and Death in Stamina below) can't use the Catch Breath
> maneuver, but other creatures can help them spend Recoveries in other ways." — same file

> "A hero also has a recovery value that equals one-third of their Stamina maximum, rounded down." /
> "Outside of combat, you can spend as many Recoveries as you have remaining." —
> `SC/rule/health/recoveries.md`

> "Director-controlled creatures don't have Recoveries or a recovery value." —
> `SC/rule/health/stamina.md`, *No Recoveries*

> "Regaining Stamina can't restore temporary Stamina." — `SC/rule/health/temporary-stamina.md`

> "Some effects can also reduce your Stamina maximum, limiting the amount of Stamina you can regain."
> — `SC/rule/health/stamina.md`

Contract:

```
recoveryValue   = floor(maxStamina / 3)
cost            = 1 Recovery; affordable iff recoveries >= 1 (a creature without a Recovery pool cannot pay)
stamina'        = min(maxStamina, stamina + recoveryValue)     // cap confirmed: Q-R-3
healed          = stamina' − stamina
temporaryStamina unchanged
```

In combat this is a maneuver with action tracking; in FreePlay the same operation spends one Recovery
per use with no maneuver allowance (`docs/table-spec.md#v001-catch-breath`). A dying hero using it in
combat receives a warning, not a block (dying is not automated in v0.01 and the prohibition is not an
affordability rule). Using it at full Stamina spends the Recovery and heals 0 with a warning.

**User decision, 2026-09-14 (Q-R-3):** ordinary regained Stamina is capped at `maxStamina`.
Excess healing is lost and the Recovery remains spent. For current Stamina 24, maximum 30 and
recovery value 10, spend one Recovery, restore 6 Stamina and finish at 30; the remaining 4 healing
is lost. Keep `capApplied: true` when the cap limits healing, but no longer label this resolved
case `uncertainty: "Q-R-3"`. This confirms the prior interpretation; it does not claim the pinned
source explicitly states that sentence or add class-specific healing automation.

## 8. Saving throws for manually toggled conditions

> "To make a saving throw, a creature rolls a d10. On a 6 or higher, the effect ends. Otherwise, it
> continues." — `SC/rule/general/saving-throw.md`

Contract: `success = d10 >= threshold`, `threshold` defaults to 6. A feature that changes the
threshold (the fixture's Impressive Horns, `docs/hero-fixture.md`) is a supplied fact recorded with
its source label. The roll and the condition toggle are separate operations
(`docs/table-spec.md#v001-manual-condition-tracking`); the roll result never removes a toggle by
itself.

## 9. Affordability

> "If an ability has a Heroic Resource cost to activate—as in, you can't use the ability at all
> without spending some of your Heroic Resource—then it is a heroic ability." —
> `SC/rule/general/heroic-ability.md`

> "Signature abilities don't require your Heroic Resource to use" —
> `SC/rule/combat/signature-ability.md`

> "Choose one heroic ability from the following options, each of which costs 3 ferocity to use." /
> "... each of which costs 5 ferocity to use." — `SC/feature/fury/level-1/fury-abilities.md`

> "Though you can't gain ferocity outside of combat, you can use your heroic abilities and effects
> that cost ferocity without spending it. Whenever you use an ability or effect outside of combat
> that costs ferocity, you can't use that same ability or effect outside of combat again until you
> earn 1 or more Victories or finish a respite." — `SC/feature/fury/level-1/ferocity.md`

> "Monsters can spend Malice the way heroes spend their Heroic Resource, activating and enhancing
> their abilities. Abilities that make use of Malice have their Malice cost noted in a creature's
> stat block." — `SC/rule/monster/malice.md`

Contract:

```
fixedCost   = ability metadata (e.g. "5 Ferocity", "2 Malice"); signature/free strikes: none
waived      = hero Ferocity cost while not in combat (source waiver above)   // other classes: their own text
legalFloor  = 0 for Ferocity and Malice at this pin; a class-specific negative range is a
              supplied fact (Talent clarity, docs/table-spec.md#ability-costs-and-optional-spending)
affordable  = fixedCost == none || waived || (pool − fixedCost.amount) >= legalFloor
```

Unaffordable: blocked; no roll, no debit, no action-allowance use, no effects
(`docs/table-spec.md#ability-costs-and-optional-spending`). Affordable: debit once, then roll. The
outside-combat reuse restriction is a usage rule, not a payment shortfall: the app warns when its
records show a prior outside-combat use since the last Victory or respite, and does not block. Unknown
cost text is an unresolved fact, neither affordable nor unaffordable; the ability is recorded as
manual.

## 10. Worked examples

Fixture numbers (`docs/hero-fixture.md`; `SC/monster/goblin/statblock/goblin-warrior.md`):

| Creature | Might | Agility | Max Stamina | Winded value | Recovery value | Kit melee bonus |
| --- | --- | --- | --- | --- | --- | --- |
| Grug (hero, Fury, Mountain kit) | 2 | 2 | 30 | 30/2 = 15 | floor(30/3) = 10 | +0/+0/+4 |
| Goblin Warrior (foe) | −2 | 2 | 15 | floor(15/2) = 7 | none | none |

Melee Weapon Free Strike tiers: "≤11: 2 + M or A damage / 12-16: 5 + M or A damage / 17+: 7 + M or A
damage" (`SC/feature/ability/common/melee-weapon-free-strike.md`); keywords Charge, Melee, Strike,
Weapon; Main action. Grug's default characteristic: Might and Agility tie at 2; Might is first in
the printed order, so Might is selected (1.8). Under the confirmed Q-R-2 default, damage also uses Might.

### 10.1 Single-target free strike, tier 1

Dice 4 + 5 → natural 9. Total 9 + 2 (Might) + 0 (bonuses) + 0 (no edges/banes) = 11 → 11 ≤ 11 →
tier 1. Damage 2 + 2 + 0 (kit tier 1 bonus) = 4. Goblin Warrior: no weakness, no immunity, no
temporary Stamina → Stamina 15 − 4 = 11. 11 > 7 → not winded. Not slain. Not a critical.

### 10.2 Single-target free strike, tier 2

Dice 6 + 7 → natural 13. Total 13 + 2 = 15 → 12 ≤ 15 ≤ 16 → tier 2. Damage 5 + 2 + 0 = 7. Goblin
Warrior 15 − 7 = 8. 8 > 7 → not winded.

### 10.3 Single-target free strike, tier 3 (not a critical)

Dice 8 + 9 → natural 17. Total 17 + 2 = 19 → 19 ≥ 17 → tier 3. Natural 17 < 19 → not a critical
hit even though the modified total is 19. Damage 7 + 2 + 4 (Mountain tier 3) = 13. Goblin Warrior
15 − 13 = 2. 2 ≤ 7 → winded. 2 > 0 → not slain.

### 10.4 Critical hit

Dice 10 + 10 → natural 20. Total 20 + 2 = 22 → tier 3; natural ≥ 19 → tier 3 regardless; ability
roll as a main action → critical hit. Damage 7 + 2 + 4 = 13. Goblin Warrior 15 − 13 = 2 (winded).
Record `criticalHit: true`, `additionalMainActionOffered: true`; the extra main action is offered
to the acting user, not executed. Variant: natural 19 (9 + 10) with one bane: total 19 + 2 − 2 =
19, tier 3 by total anyway and also by natural roll; critical hit.

### 10.5 Edge and bane combinations on one roll (natural 12, Might 2)

| edges | banes | e, b | net | modifier | tier shift | total | tier |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0, 0 | 0 | 0 | 0 | 14 | 2 |
| 1 | 0 | 1, 0 | +1 | +2 | 0 | 16 | 2 |
| 2 | 0 | 2, 0 | +2 | 0 | +1 | 14 → base tier 2 | 3 |
| 0 | 1 | 0, 1 | −1 | −2 | 0 | 12 | 2 |
| 0 | 2 | 0, 2 | −2 | 0 | −1 | 14 → base tier 2 | 1 |
| 1 | 1 | 1, 1 | 0 | 0 | 0 | 14 | 2 |
| 2 | 1 | 2, 1 | +1 | +2 | 0 | 16 | 2 |
| 3 | 1 | 2, 1 | +1 | +2 | 0 | 16 | 2 |
| 1 | 2 | 1, 2 | −1 | −2 | 0 | 12 | 2 |
| 2 | 2 | 2, 2 | 0 | 0 | 0 | 14 | 2 |
| 3 | 5 | 2, 2 | 0 | 0 | 0 | 14 | 2 |

Boundary check with natural 15, Might 2 (total 17, tier 3): one bane → 15 → tier 2; two banes → no
penalty, base tier 3, shift −1 → tier 2; three edges and two banes → cancel → total 17, tier 3.

### 10.6 Multi-target attack with different per-target counts

Grug uses Thunder Roar (`SC/feature/ability/fury/level-1/thunder-roar.md`: "5 Ferocity"; Area,
Melee, Weapon; Main action; "≤11: 6 damage; push 2 / 12-16: 9 damage; push 4 / 17+: 13 damage; push
6"; target "Each enemy in the area") with Ferocity 6 against three Goblin Warriors, each at 15.

Affordability: 6 − 5 = 1 ≥ 0 → affordable; debit → Ferocity 1. One roll: dice 7 + 6 → natural 13;
base 13 + 2 (Might) = 15. Kit bonus applies (Melee and Weapon keywords, rolled damage, not the kit
signature): +0/+0/+4.

| Target | edges | banes | modifier / shift | total | tier | damage | Stamina | winded | slain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warrior 1 | 1 | 0 | +2 / 0 | 17 | 3 | 13 + 0 + 4 = 17 | 15 − 17 = −2 | yes | yes |
| Warrior 2 | 0 | 2 | 0 / −1 | 15 → tier 2 | 1 | 6 + 0 + 0 = 6 | 15 − 6 = 9 | no (9 > 7) | no |
| Warrior 3 | 0 | 0 | 0 / 0 | 15 | 2 | 9 + 0 + 0 = 9 | 15 − 9 = 6 | yes (6 ≤ 7) | no |

Natural 13 → no critical. The push clauses and the "force moved one at a time" Effect are recorded
verbatim as unresolved for manual resolution (4.5). Warrior 1's recorded Stamina is −2 with
`slain: true` (6.4 interpretation).

### 10.7 Damage that crosses winded (hero)

Grug at 30 (no temporary Stamina) takes 16 damage from a manual Director entry: 30 − 16 = 14. Winded
value 15; 14 ≤ 15 → winded. Before the hit `winded` was false; the record shows the transition.
Foe case: 10.3 (15 → 2, threshold 7).

### 10.8 Damage that consumes temporary Stamina then Stamina

Source example: Grug with 10 temporary Stamina takes 16. absorbed = min(10, 16) = 10 → temporary 0;
staminaDelta = 16 − 10 = 6 → Stamina 30 − 6 = 24. 24 > 15 → not winded.

A05 check 6: 3 temporary Stamina and 20 Stamina, 5 damage: absorbed 3 → temporary 0; delta 2 →
Stamina 18. Partial absorption: 10 temporary, 4 damage: absorbed 4 → temporary 6, Stamina unchanged.

### 10.9 Catch Breath at and near the cap

Recovery value 10; each case below is independent and spends one Recovery (10 → 9):

- Stamina 19: 19 + 10 = 29 ≤ 30 → 29, healed 10, no cap.
- Stamina 22: 22 + 10 = 32 > 30 → 30 (Q-R-3 cap), healed 8, `capApplied: true`.
- Stamina 30: 30 + 10 = 40 → 30, healed 0, Recovery still spent, warning.
- Stamina 24 with 5 temporary Stamina: Stamina 30, temporary stays 5 ("Regaining Stamina can't
  restore temporary Stamina", and it is a separate pool).
- Goblin Warrior: no Recovery pool → cannot pay → blocked.

### 10.10 Post-roll bane addition that changes tier

Original: dice 8 + 2 → natural 10; total 10 + 2 = 12 → tier 2; free strike damage 5 + 2 + 0 = 7;
Goblin Warrior 15 → 8. Correction: add one bane to that target; same dice; total 10 + 2 − 2 = 10 →
tier 1; damage 2 + 2 + 0 = 4. Reconciliation delta = 7 − 4 = +3 → Stamina 8 → 11; winded stays
false (11 > 7). Natural roll 10 → `criticalHit` unchanged (false). Removing the bane again restores
tier 2 / 7 damage / Stamina 8 as a further linked correction.

Tier-3 case: natural 15, total 17 → tier 3, damage 13, Goblin 15 → 2 (winded). Add one bane → 15 →
tier 2, damage 7 → Stamina 8, winded cleared (8 > 7). Add a second bane → double bane → total 17,
base tier 3, shift −1 → tier 2, damage 7 (same as one bane). Natural 19 with two banes → confirmed tier 3 (Q-R-1), with no uncertainty label.

### 10.11 Blocked unaffordable ability

Grug with Ferocity 2 selects Thunder Roar (5 Ferocity): 2 − 5 = −3 < 0 → not affordable → blocked.
Record: an `AbilityRollBlocked` response (`kind: "blocked"`, `poolBefore: 2`,
`reason: "Ferocity 2 < cost 5"`); no dice, no debit (Ferocity stays 2), no
main action used, no effects, pending target selection retained. Spec example: cost 3 (Out of the
Way!, "costs 3 ferocity") with 2 available → blocked. Same hero in FreePlay: cost waived → executes
with no debit; a second FreePlay use before a Victory or respite executes with a warning.

### 10.12 Direct test and save

Might test to climb, skill Climb agreed (+2), one edge: dice 7 + 4 → natural 11; total 11 + 2 + 2 +
2 = 17 → tier 3. Difficulty medium → "Success". Difficulty hard → "Success". Difficulty absent →
no outcome, Director interprets. Natural 19 (9 + 10), no skill, one bane: total 19 + 2 − 2 = 19 →
tier 3; critical success → "Success with a reward" at any difficulty.

Save: d10 = 6 → 6 ≥ 6 → success (effect ends; toggle removed by a separate operation). d10 = 5 → no.
With a supplied threshold 5 (Impressive Horns, recorded as a fact): 5 ≥ 5 → success.

### 10.13 Signature ability with tier text: Brutal Slam

Brutal Slam (`SC/feature/ability/fury/level-1/brutal-slam.md`: Melee, Strike, Weapon; Main action;
"≤11: 3 + M damage; push 1 / 12-16: 6 + M damage; push 2 / 17+: 9 + M damage; push 4"; power roll
+ Might, so no characteristic choice). Signature ability: no cost. Not the kit's own signature, has
Melee and Weapon, rolled → Mountain +0/+0/+4 applies (`docs/hero-fixture.md` states the same
5/8/15).

| Dice | natural | total (+2 Might) | tier | damage | Goblin Warrior 15 → | winded (≤ 7) |
| --- | --- | --- | --- | --- | --- | --- |
| 3 + 6 | 9 | 11 | 1 | 3 + 2 + 0 = 5 | 10 | no |
| 7 + 7 | 14 | 16 | 2 | 6 + 2 + 0 = 8 | 7 | yes |
| 9 + 9 | 18 | 20 | 3 | 9 + 2 + 4 = 15 | 0 | yes; slain (0 ≤ 0) |

The push clauses are recorded verbatim as unresolved (4.5). The tier-3 row is not a critical hit
(natural 18); dice 9 + 10 would be.

### 10.14 Creature free strike

Goblin Warrior free strike against Grug (30, no temporary Stamina): no roll; damage 1 → 29. Against
Grug with 3 temporary Stamina: absorbed 1 → temporary 2, Stamina unchanged.

## 11. What the app records when the source does not decide

| Case | Provisional behavior | Label |
| --- | --- | --- |
| Foe Stamina below 0 | arithmetic value recorded, `slain` flag | interpretation, 6.4 |
| Negative rolled damage (negative characteristic) | arithmetic value recorded, no damage or healing applied, manual | `negative-rolled-damage`, 4.3; unreachable with v0.01 content |
| Unsupported tier clause | verbatim, unresolved, manual | `unresolvedClauses` |
| Downgraded roll, automatic tier, halving response | manual result with source clause | `ManualResolution` |

## 12. Sources read

All under `vendor/steel-compendium/en/unified/md/` at `fb83a789da8f0327a389c277a0c790b1648d5810`:
`rule/dice/{ability-roll,bane,bonuses-and-penalties,edge,natural-19-20,natural-roll,opposed-power-roll,power-roll,tier-outcome}.md`;
`rule/combat/{critical-hit,strike,target,melee,ranged,turn,opportunity-attack,signature-ability}.md`;
`rule/damage/{damage,damage-immunity,damage-type,damage-weakness,rolled-damage}.md`;
`rule/health/{dying,falling,recoveries,stamina,suffocating,temporary-stamina,winded}.md`;
`rule/general/{saving-throw,always-round-down,heroic-ability,ability}.md`;
`rule/test/{test,test-difficulty}.md`; `rule/character/potency.md`; `rule/resource/heroic-resource.md`;
`rule/monster/{creature-free-strike,malice}.md`; `chapter/{tests,combat,classes,kits,the-basics,monster-basics}.md`;
`class/fury.md`; `feature/fury/level-1/{ferocity,fury-abilities,kit}.md`;
`feature/ability/fury/level-1/{brutal-slam,hit-and-run,impaled,to-the-death,thunder-roar,blood-for-blood}.md`;
`feature/ability/common/{melee-weapon-free-strike,ranged-weapon-free-strike}.md`;
`feature/common/main-actions/free-strike.md`; `feature/common/maneuvers/catch-breath.md`;
`kit/mountain.md`; `monster/goblin/statblock/goblin-warrior.md`.
