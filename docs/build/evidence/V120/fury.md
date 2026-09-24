# Fury (Ferocity) resource ledger, levels 1–3

I read the pinned Compendium and the listed Salient files only. Nothing was edited, created or run. All Compendium paths below are relative to `/srv/presidium/projects/salient/code/vendor/steel-compendium/en/unified/md/`. At levels 1–3, Ferocity is gained only through the four clauses of the Ferocity feature. No Fury ability, aspect feature, stormwight kit, perk or level 1–3 kit signature ability grants Ferocity.

## 1. Resource identity

| Item | Finding | Source |
|---|---|---|
| Name | "fueling a Heroic Resource called ferocity" | `feature/fury/level-1/ferocity.md:9` |
| Can it go negative? | **No (interpretation).** Only the Talent is explicitly allowed to go negative: "You can spend clarity you don't have, pushing that Heroic Resource into negative numbers…". The Fury text has no such permission. Spending means you "spend some of the Heroic Resource bestowed by your class" (`chapter/classes.md:48`). Salient already floors it at 0: `/srv/presidium/projects/salient/code/shared/resolve/resourceFloor.ts` returns a negative floor only for Talent clarity. | `feature/talent/level-1/clarity-and-strain.md:17` |
| Maximum | **None stated.** The Fury files and `rule/resource/heroic-resource.md` give no cap. | — |
| Name collision | The Beastheart's resource is also called "Ferocity" (`feature/beastheart/level-1/ferocity.md`). The engine must key on class, not on the resource name. | — |
| Starting value | Salient's rule: `/srv/presidium/projects/salient/code/shared/evaluate/classes/fury.ts:186-196` sets 0, labelled as an interpretation. | — |

## 2. Combat-start grant (Ferocity equal to Victories)

> "At the start of a combat encounter or some other stressful situation tracked in combat rounds (as determined by the Director), you gain ferocity equal to your Victories."
>
> — `feature/fury/level-1/ferocity.md:17`, level 1, every aspect

- Victories start at 0 at the start of an adventure. They rise by 1 for "survives a combat encounter in which the party's objectives are achieved" and are converted to Experience at a respite (`rule/resource/victories.md:7,11,19`).
- Combat starts "as soon as one creature intends to harm another" (`rule/combat/combat-round.md:11`).
- **OBSERVABLE** for combat encounters: encounter start plus the recorded Victories. **PARTLY** for a "stressful situation tracked in combat rounds", because the Director decides that.

## 3. Turn-start grant (1d3)

> "At the start of each of your turns during combat, you gain 1d3 ferocity."
>
> — `feature/fury/level-1/ferocity.md:17`

- **Levels 1–3:** 1d3, rolled.
- **Level changes after the range:** at level 7, Greater Ferocity says "you gain 1d3 + 1 ferocity instead of 1d3" (`feature/fury/level-7/greater-ferocity.md:9`). There is no change at levels 2 or 3.
- **OBSERVABLE:** the Fury's turn-start boundary during combat.
- Salient's previously accepted contract (idempotent under reload, logged die roll, rewind and redo) is in `/srv/presidium/projects/salient/code/docs/fury-goblin-automation.md:45-79`. It is marked "Automation deferred, 2026-09-14" (line 27).

## 4. Triggered gains, levels 1–3

| # | Quote and path | Level / aspect | Limit | Observability |
|---|---|---|---|---|
| T1 | "Additionally, the first time each combat round that you take damage, you gain 1 ferocity." `feature/fury/level-1/ferocity.md:19` | L1+, all aspects | Once per combat round. The source is not restricted: enemies, allies, the environment and yourself all count. | **OBSERVABLE** when the app records damage with the Fury as target, keyed to the round. **PARTLY** for damage not entered as a damage event (falling, environment) and for the Stamina-loss cases in A3. Blood for Blood's "You can deal 1d6 damage to yourself" (`feature/ability/fury/level-1/blood-for-blood.md:42`) is explicit damage, so it triggers T1 if the round's first damage hasn't happened yet. |
| T2 | "The first time you become winded or are dying in an encounter, you gain 1d3 ferocity." `feature/fury/level-1/ferocity.md:19` | L1+, all aspects | Once per encounter; see A1 for whether winded and dying are one grant or two | **OBSERVABLE** from Stamina state. Winded: "When your Stamina is equal to or less than your winded value" (half the Stamina maximum) (`rule/health/winded.md:7`). Dying: "When your Stamina is 0 or lower, you are dying" (`rule/health/dying.md:7`). Temporary Stamina "doesn't change those states" (`rule/health/temporary-stamina.md:7`). Any Stamina loss can cross the threshold, not only damage. |
| — | Out of range: Damaging Ferocity says "The first time you take damage each combat round, you gain 2 ferocity instead of 1." `feature/fury/level-4/damaging-ferocity.md:9` | L4 | — | Replaces T1 from level 4 |

**Checked and found no Ferocity gain:**
- All level 1–3 Fury abilities (`feature/ability/fury/level-1..3/*`). Their Ferocity mentions are only costs or "Spend" entries. Make Peace With Your God, To the Death! and You Are Already Dead grant surges; Steelbreaker and Furious Change grant temporary Stamina.
- Aspect of the Wild.
- The level 1–3 features: Primordial Strength and Cunning, Relentless Hunter, Beast Shape, Mighty Leaps, Unstoppable Force, Inescapable Wrath, Tooth and Claw, Immovable Object, See Through Their Tricks, Nature's Knight.
- The stormwight kit files and the kit signature abilities (`kit/boren|corven|raden|vuken.md`).
- Perks.

**Out-of-class gains (not Fury features, noted for completeness):**
- The Rejuvenating implement enhancement: "roll a d10. On a 9 or higher, you gain 1 Heroic Resource" (`rule/treasure/implement.md:31`).
- The Godsworn title (echelon 2) gives a temporary pool of 2d10 (`title/godsworn.md:18`).

## 5. Resets, losses, caps, conversions and thresholds

**Losses and resets**
- **Encounter end:** "You lose any remaining ferocity at the end of the encounter." (`ferocity.md:21`). OBSERVABLE.
- **Spending:** heroic abilities cost 3, 5 or 7 (`feature/fury/level-1/fury-abilities.md:21,25`; `feature/fury/level-3/7-ferocity-ability.md:9`; the `cost:` frontmatter of each ability).
  - "Spend 1 Ferocity" entries: Lines of Force, Unearthly Reflexes, Furious Change, Aspect of the Wild.
  - "Spend 1+ Ferocity": To the Uttermost End (`feature/ability/fury/level-1/to-the-uttermost-end.md:42`).
  - Rule for "X+" entries: "you can spend as much of your available [Heroic Resource] as you like in multiples of X" (`chapter/classes.md:90`).

**Outside combat (neither a gain nor a spend)**
> "Though you can't gain ferocity outside of combat, you can use your heroic abilities and effects that cost ferocity without spending it. Whenever you use an ability or effect outside of combat that costs ferocity, you can't use that same ability or effect outside of combat again until you earn 1 or more Victories or finish a respite." (`ferocity.md:25`)

- Unlimited-spend abilities work "as if you had spent an amount of ferocity equal to your Victories" (`ferocity.md:27`).
- Using a heroic ability once combat has begun requires paying for it (`rule/combat/combat-round.md:11`).

**Cap and conversions:** there is no cap. Ferocity is not converted into anything. Surges are a separate resource, and "At the end of combat, you lose any surges you have remaining" (`rule/resource/surge.md:14`).

**Growing Ferocity thresholds.** These are threshold effects, not Ferocity gains. They depend on current Ferocity.
- "You gain certain benefits in combat based on the amount of ferocity you have … These benefits last until the end of your turn, even if a benefit would become unavailable to you because of the amount of ferocity you spend during your turn." (`feature/fury/level-1/growing-ferocity.md:9`)
- "Benefits are cumulative except where an improved benefit replaces a lesser benefit." (`primordial-strength.md:12`, `primordial-cunning.md:12`, and each kit's `growing-ferocity.md`)
- Tiers 8, 10 and 12 need levels 4, 7 and 10, so only tiers 2, 4 and 6 apply at levels 1–3.

| Table (path) | 2 | 4 | 6 |
|---|---|---|---|
| Berserker (`feature/fury/level-1/growing-ferocity.md`) | Knockback distance + Might | "The first time you push a creature on a turn, you gain 1 surge." | Edge on Might tests and Knockback |
| Reaver (same file) | Knockback distance + Agility | "The first time you slide a creature on a turn, you gain 1 surge." | Edge on Agility tests and Knockback |
| Boren (`feature/fury/boren/growing-ferocity.md`) | Up to two creatures grabbed; "whenever you make a strike against a creature you have grabbed, you gain 1 surge" | "The first time you grab a creature on a turn, you gain 1 surge." | Edge on Grab and Knockback |
| Corven / Raden (`feature/fury/corven/growing-ferocity.md`, `raden/…`) | Disengage shift + Agility | "The first time you shift on a turn, you gain 1 surge." | Edge on Agility tests, Escape Grab and Knockback |
| Vuken (`feature/fury/vuken/growing-ferocity.md`) | Knockback can target one additional creature | "The first time on a turn that you push a creature or knock a creature prone, you gain 1 surge." | Edge on Agility tests and Knockback |

The Stormwight uses its kit's table (`feature/fury/level-1/beast-shape.md:10`, `stormwight-kits/growing-ferocity.md:8`).

Observability of the threshold effects:
- The threshold state itself is OBSERVABLE (current Ferocity against 2, 4 and 6).
- The surge triggers are **MANUAL**, because push, slide and shift are movement. The exceptions are **PARTLY**: Boren's grab (the grabbed condition applied by the Fury), Vuken's prone (the prone condition applied) and Boren's strike against a creature it has grabbed.
- Edges and distance bonuses are roll modifiers, not resource changes.

## 6. Ambiguities needing a user ruling

- **A1.** In "The first time you become winded or are dying in an encounter, you gain 1d3", is it one grant for whichever comes first, or one for the first winded and another for the first dying? Grammatically it reads as a single "first time". A Fury who drops from above winded straight to dying gets one grant under either reading. The readings differ only when winded and dying happen at different times.
- **A2.** "Become winded" suggests a transition. Does a Fury who starts an encounter already winded (Stamina carries over between encounters) gain the 1d3 at encounter start, only on the next crossing, or not until dying? "Are dying" is phrased as a state, which makes the asymmetry sharper.
- **A3.** Does Stamina loss count as "take damage" for T1? Three cases:
  - To the Uttermost End says "you lose 1d6 Stamina" (`to-the-uttermost-end.md:42`).
  - The bleeding condition says "they lose Stamina equal to 1d6 + their level" but also "You take damage from this condition…" (`condition/bleeding.md:7,9`). That leans toward yes for bleeding only.
  - The damage rules say "Whenever a creature takes damage, they reduce their Stamina" (`rule/damage/damage.md`), which does not state the converse.
- **A4.** Zero or absorbed damage:
  - Damage fully absorbed by temporary Stamina counts as taken under a strong reading: "Whenever you take damage while you have temporary Stamina, the temporary Stamina decreases first" (`rule/health/temporary-stamina.md:9`).
  - Damage reduced to 0 by immunity is unclear. The rule gives "to a minimum of 0 damage" (`rule/damage/damage-immunity.md:9`), and whether taking 0 damage counts as taking damage is open.
- **A5.** For the combat-start grant, which non-combat "stressful situation tracked in combat rounds" triggers it is the Director's call. Salient needs a Director flag or confirmation.
- **A6.** Growing Ferocity has two open timing points:
  - What starts the "last until the end of your turn" lock? Reading (a): holding the amount at any moment during your own turn. Reading (b): holding it at the moment the benefit applies.
  - Off-turn benefits (for example during triggered actions) seem to depend on current Ferocity only.

## 7. Proposed automation boundary

**Automate, with a logged operation and source link for each:**
1. **Combat-start grant** (Ferocity = current Victories) at encounter start. Use the recorded Victories only; follow the existing "no artificial inflation" rule (`fury-goblin-automation.md:81+`). Non-combat round-tracked scenes need a Director opt-in.
2. **Turn-start 1d3** at the Fury's actual turn-start boundary, following the retained contract in `fury-goblin-automation.md:56-79`. Make it level-parameterised so level 7's +1 is ready later.
3. **First damage each round (+1)** when the app records a damage event with the Fury as target, from any source including self-damage. Flag Stamina-loss events as pending A3 rather than granting silently.
4. **First winded/dying (1d3)** from recorded Stamina transitions. Implement A1 and A2 as explicit ruling switches, or leave them manual until the user rules.
5. **Encounter-end loss** to 0; **floor 0; no cap**.
6. **Growing Ferocity tier display** (2, 4, 6 at levels 1–3), shown as active or inactive against current Ferocity.

**Keep manual, recorded through shared operations:**
- Growing Ferocity surge triggers that depend on push, slide, shift or forced movement, since movement isn't recorded.
- Grab- and prone-based surge triggers: offer a confirmation prompt when the Fury applies grabbed or prone, rather than auto-granting.
- The out-of-combat free-use lockout (per ability, until a Victory or respite).
- Out-of-class gains (implement, title).
- Every A1–A6 case until the user rules.

**Why:**
- The four Ferocity clauses depend only on encounter, round and turn boundaries, recorded damage and Stamina thresholds, all of which the app already records.
- Every threshold surge trigger depends on movement or intent, which it does not record.
- The existing policy (`/srv/presidium/projects/salient/code/docs/pre-alpha-design-gaps.md:44-52`) deferred all class-specific generation for v0.01. It requires manual adjustments to stay distinct from automated resolution, "with no duplicate application". Lifting that deferral for V1 needs the user's explicit go-ahead.

**Current Salient code:** there is no Ferocity generation logic. A grep of `shared/evaluate` and `shared/content/classes/fury` finds only the resource name, costs, source sentences (`shared/evaluate/sources.ts:103-110`) and the starting value of 0.
