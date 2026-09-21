# V108 inherited ancestry/perk growth audit

ENGINE, 2026-09-21; read-only against main90ebdd5 and Compendium fb83a789da8f0327a389c277a0c790b1648d5810. No tests run. Scope: existing ancestry/perk behavior inherited by Shadow levels4–6, including Revenant purchases; not new ancestry mechanics or previously deferred perk automation.

## Required numeric repairs

1. `shared/evaluate/character.ts:799` hardcodes echelon1. Levels4–6 are echelon2 (`en/unified/md/rule/general/echelon.md`). Use derived echelon for kit contributions and actual vitals. Also repair `kitContributions`'s literal “at the 1st echelon” provenance note (line756) and `SENTENCES.echelon` if it only cites the first-echelon passage. The printed Stamina-per-echelon multiplier changes; kit damage/speed/stability do not automatically scale. Cloak and Dagger +3 per echelon becomes+6; Shining Armor+9 becomes+18.
2. `shared/evaluate/ancestries/dwarf.ts:54–63` applies literal+6 for Spark Off Your Skin. Its pinned `feature/trait/dwarf/spark-off-your-skin.md` grants+6 then another6 at4/7/10. Apply+12 at4–6, with provenance amount12 and refreshed Recovery/winded from final Stamina. `6 * ceil(level/3)` matches the printed schedule over1–10.
3. `shared/evaluate/ancestries/revenant.ts` has the same trait as BORROWED['dwarf/spark-off-your-skin'], value6, then adds Number(effect.value). Compute the scaled amount for this borrowed effect and update provenance amount too. Existing recalculation of Recovery/winded after the addition should use the final total. Former Life alone does not grant Spark; only a paid selected purchase does. Keep the revenant purchase decision ID and original dwarf source path.

At levels4/5/6, a Shadow with Cloak and Dagger and no other Stamina effects has42/48/54. With purchased native OR borrowed Spark it has54/60/66, Recovery18/20/22, winded27/30/33. Native Dwarf and Revenant with Dwarf former life must have the same Spark amount, but other ancestry properties are not interchangeable. No-Spark negative fixture must retain42/48/54. These expectations derive from Shadow18+6*(L−1), kit6 and Spark12.

## Level-based ancestry values already dynamic

Sources below are `en/unified/md/feature/trait/<ancestry>/<slug>.md`.

| Trait | At levels4/5/6 | Existing path |
| --- | --- | --- |
| Dragon Knight Wyrmplate | Selected type immunity4/5/6 | `ancestries/dragon-knight.ts` uses ctx.level |
| Dragon Knight Prismatic Scales | Additional immunity4/5/6 | Same evaluator uses ctx.level; duplicate type does not add twice |
| Polder Corruption Immunity |6/7/8|`ancestries/polder.ts` uses ctx.level+2|
| Time Raider Psychic Scar |4/5/6|`ancestries/time-raider.ts` uses ctx.level|
| Revenant Tough But Withered |cold/corruption/lightning/poison4/5/6; fire weakness stays5|`ancestries/revenant.ts` uses ctx.level|
| Revenant borrowed Polder Corruption Immunity |corruption6/7/8, other revenant immunities4/5/6|`case 'corruption'` already uses ctx.level+2 despite table placeholder value3; do not change it to additive stacking|

Revenant former ancestry's signature traits never transfer merely from former-life selection (`feature/trait/revenant/former-life.md`). The decision builder copies paid one/two-point options and purchase-dependent children only. Thus former Dragon Knight does not receive Wyrmplate; Prismatic Scales is expressly unavailable without it. Former Time Raider does not acquire Psychic Scar; it already has its own Revenant immunities. Borrowed fixed speed, condition immunity, saves5+, +1 stability/disengage and Human+2 Recoveries do not grow with echelon. Don't multiply the entire BORROWED numeric table.

Dynamic action text, intentionally manual: Devil Glowing Eyes is1d10+level psychic (including selected borrowed trait), Dragon Knight Draconian Guard reduces bylevel (including a legal borrowed purchase), Revenant Vengeance Mark permits active sigils up tolevel. Existing source adapters retain these expressions rather than fixing them at1. None warrants an automatic bonus on the permanent sheet. If a proof chooses these, assert the source/current level and manual boundary, not invented damage/reduction/mark state.

## Perk scaling and settled manual scope

A source search across all pinned perk Markdown finds level-dependent behavior in five distinct perks:

- `perk/brawny.md`: optionally lose1d6+level Stamina after failed Might test to raise outcome one tier, once/test.
- `perk/lucky-dog.md`: same payment after failed intrigue-skill test, once/test.
- `perk/creature-sense.md`: target within10, target level no greater than hero level.
- `perk/familiar.md`: familiar Stamina2×level →8/10/12. Familiar creature/state automation is deferred; restoration actions/source remain available.
- `perk/wild-rumpus.md`: repeat-use self-damage equalslevel until respite/Victory; cannot reduce it. This is supplemental Beastheart material, absent from the current core supporting perk choices. It is not a newly enabled generic Shadow perk.

No selected core perk provides a permanent Stamina bonus that changes specifically at level4. The Brawny/Lucky Dog payments and Familiar creature stats are not implemented as permanent baseline fields. `docs/build/V83-perk-action-audit.md` explicitly preserves Brawny/Lucky Dog as manual modifiers requiring future coupled test/payment resolution, and Familiar actor automation separately deferred. Do not broaden V108 into those settled mechanics or describe them as automatically scaling live state. Creature Sense already uses source-relative level wording.

The new level4/6 unrestricted perk decisions must preserve each grant's decision provenance and existing paid/conditional action projection. Changes in highest characteristics can affect other perks (e.g. Friend Catapult's twice-Might fall-distance reduction); source-relative wording already supports those manual effects. No additional hardcoded level1 numeric perk evaluator was found in the reviewed paths.

## Adjacent existing formulas

The supporting complication evaluator already interprets `3 * echelon` using `3 * Math.ceil(this.level / 3)`, plus `level`, `level - 1`, and highest characteristic dynamically. Preserve those semantics and final Stamina-derived recalculation. There is no reason to use the new kit-echelon fix to multiply unrelated static modifiers. Class-specific growth outside Shadow remains outside this assignment.

Recommended bounded persisted fixtures: native Spark and Revenant-borrowed Spark at3→4 and6; an unpurchased-Spark negative; Revenant/Polder stronger corruption plus unchanged fire weakness; an ordinary level-based immunity at4/6; kit second-echelon Stamina/provenance; and distinct new perk grants preserved across save/admission. Pair them with unchanged lower-level expectations. TESTER owns execution.

Verdict: confirmed the three reported numeric repair sites plus stale echelon provenance. No further ancestry/perk baseline scaling gap found in this bounded source/evaluator audit. Dynamic and manual cases above need accurate preservation, not new mechanics.
