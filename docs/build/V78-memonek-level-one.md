# V78 — Memonek level one

Implementation candidate; focused, authenticated headless and Forge verification owned by the integration lead.
Branch `slice/V78`; new content/evaluator/test files belong to this unit. Shared registration belongs to the lead.

## Source and behavior

Authority: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/feature/trait/memonek/` and the common ancestry base statistics.
Both signature traits apply: Fall Lightly and Lightweight. The ancestry metadata names only Fall Lightly,
but Lightweight's source explicitly identifies it as another signature. Neither modifies ordinary size.
Four ancestry points purchase seven options. Lightning Nimbleness sets ancestry speed to 7 before kit
bonuses. Nonstop grants slowed immunity; Unphased grants surprised immunity. Normal size is 1M,
speed 5, stability 0 plus kit benefits. No language or skill is granted by Systematic Mind.

## Trait and action audit

| Traits | Classification and implementation |
| --- | --- |
| Fall Lightly; Lightweight | Conditional falling/forced-movement modifiers, readable traits; no new action |
| I Am Law | Permission to occupy/pass space, readable trait; no new action |
| Keeper of Order | Free triggered action, once per round when self or adjacent creature makes a power roll; retained trait and granted action |
| Lightning Nimbleness | Permanent speed 7 before kit |
| Nonstop; Unphased | Slowed/surprised immunity |
| Systematic Mind | Conditional test edge and related-language treatment; no trained language/skill |
| Useful Emotion | Start-of-combat surge, retained manual trigger; no player action or permanent surge grant |

Keeper's effect remains manual under the existing recorded ability-use contract. There is no extra
wizard selection or persistent play-state choice. Removing the purchase revokes the action.

## Compact option witnesses

| Legal completed loadout | Options witnessed |
| --- | --- |
| Lightning Nimbleness, Nonstop | Quick build, speed and slowed immunity |
| Keeper of Order, Unphased, Useful Emotion | Granted trigger, surprised immunity, combat surge text |
| I Am Law, Systematic Mind, Unphased, Useful Emotion | Remaining passive options and language non-grant |

Focused tests catch missing second signature, conditional-size leakage, omitted action, invalid purchase
leakage and stale grants after parent replacement. The lead must run matching Forge counterparts and
saved API create/reload/replacement witnesses before delivery. Browser testing remains suspended.
