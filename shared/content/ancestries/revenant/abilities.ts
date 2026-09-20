// SPDX-License-Identifier: GPL-3.0-only
import type { AncestryAbilitySource } from "../../ancestry-abilities.ts";
export const revenantAbilities: AncestryAbilitySource[] = [
  {
    "name": "Vengeance Mark",
    "ancestry": "Revenant",
    "trait": "Vengeance Mark",
    "sourcePath": "en/unified/md/feature/trait/revenant/vengeance-mark.md",
    "decisionId": "ancestry.revenant.purchased-traits",
    "selection": "Vengeance Mark",
    "actionType": "Maneuver",
    "group": "maneuver",
    "quote": "As a maneuver, you place a magic sigil on a creature within 10 squares. When you place a sigil, you decide where it appears on the creature's body, and whether the sigil is visible to only you or to all creatures."
  },
  {
    "name": "Vengeance Mark: Remove Sigil",
    "ancestry": "Revenant",
    "trait": "Vengeance Mark",
    "sourcePath": "en/unified/md/feature/trait/revenant/vengeance-mark.md",
    "decisionId": "ancestry.revenant.purchased-traits",
    "selection": "Vengeance Mark",
    "actionType": "No action required",
    "group": "other",
    "quote": "You always know the direction to the exact location of a creature who bears one of your sigils and is on the same world. You can have a number of active sigils equal to your level, and can remove a sigil from a creature at will (no action required). If you already have the maximum number of sigils activated and you place a new one, your oldest sigil disappears with no other effect."
  }
];
