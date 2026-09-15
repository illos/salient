# Fury kit eligibility by aspect

Question: Q-R-103. Research date: 2026-09-14. A dedicated subagent checked only the local Steel
Compendium, pinned at `fb83a789da8f0327a389c277a0c790b1648d5810`, including Heroes source-order
context. No web or Forge sources were used.

## Finding

The feature grants and book structure support Berserker/Reaver choosing ordinary Chapter 6 kits,
and Stormwight choosing from its four separate Stormwight kits. The user confirmed that split.
No sentence was found stating a blanket prohibition in either direction; exclusivity follows the
aspect-specific grants and option sections, not a verbatim “cannot use” rule.

## Evidence

- [1st-Level Aspect Features](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/1st-level-aspect-features.md)
  grants **Kit** to Berserker and Reaver, and **Beast Shape** to Stormwight.
- [Kit](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/kit.md) says “You can use
  and gain the benefits of a kit” and directs the reader to Chapter 6: Kits. Panther is explicitly
  a Quick Build suggestion, not the only eligible choice. The grant states no melee-only or
  Martial-only limitation.
- [Beast Shape](../../vendor/steel-compendium/en/unified/md/feature/fury/level-1/beast-shape.md)
  says “You can use and gain the benefits of a stormwight kit.” Its source metadata identifies the
  Stormwight subclass.
- The book-specific `en/books/heroes/clean/Draw Steel Heroes.md` Git object confirms the feature
  grants at lines 8952–8970. Its **Stormwight Kits** section begins at 9992 and expressly grants
  the aspect knowledge of one Stormwight kit of the player's choice. Boren (bear), Corven (crow),
  Raden (rat) and Vuken (wolf) appear at 10040, 10097, 10157 and 10217. The next class starts at
  10275. The separate **Kits** chapter begins at 16364, with **Kits A to Z** at 16494 containing
  21 ordinary kits.

The ordinary set is Arcane Archer, Battlemind, Cloak and Dagger, Dual Wielder, Guisarmier, Martial
Artist, Mountain, Panther, Pugilist, Raider, Ranger, Rapid-Fire, Retiarius, Shining Armor, Sniper,
Spellsword, Stick and Robe, Swashbuckler, Sword and Board, Warrior Priest, and Whirlwind.

## Catalog and scope boundaries

The [unified kit index](../../vendor/steel-compendium/en/unified/md/_index/kit.md) combines all 25
entries. A `kit_type: Martial` filter would not reproduce the source groups: the Stormwight kits
also carry that value, while ordinary kits include Magic and Psionic types. Eligibility follows the
aspect's granted feature and its source option group.

The user separately confirmed that **v0.01 supports Berserker Fury only**, with Mountain remaining
the supported prototype kit. Reaver and Stormwight are later V1 coverage. Documenting their source
eligibility neither makes them playable in v0.01 nor adds class-specific runtime automation.
UI and headless build choices must enforce the same supported subset and source eligibility.

This report verifies the source interpretation; it does not certify application implementation.
