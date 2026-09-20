# V82 independent consultation A

Reviewer: Astra remaining-Revenant/Wode implementer, independently reviewing the
Dragon Knight (V76), High Elf (V77), Memonek (V78), and Time Raider (V80) units.
2026-09-20. This is an early static implementation/source consultation, not final
acceptance before integrated full checks and authenticated reference proof.

## Result

No blocking implementation or source findings in these four unit modules. The
review covered their decisions, derivation functions, prose-action catalogs, focused
tests and specs in the V82 integration tree. Reviewed against freshly read pinned
Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` trait entries under
`en/unified/md/feature/trait/{dragon-knight,high-elf,memonek,time-raider}/` and
structured ability references. No abandoned-pilot materials used.

Dragon Knight retains Wyrmplate, requires its initial immunity choice, grants the
three-point purchased traits and required Scales choice, and deduplicates matching
immunity types without adding their values. Pride/Breath use structured ability
grants; Guard and Oath expose the correct triggered action/maneuver. Wings is a
conditional movement modifier, not an invented activated action. The initial choice
and the later respite-change rule are distinguished; this wizard slice does not
claim automated respite processing. Per-use Dragon Breath damage type remains in
source rather than incorrectly becoming a permanent build choice.

High Elf correctly grants three points, dazed immunity, save threshold 5 and
Disengage +1. Its Glamor of Terror action uses the actual damage trigger and source
expiry. Glamor, High Senses and Revisit Memory modify tests, without fictitious skill
or characteristic grants.

Memonek correctly has **both** Fall Lightly and Lightweight and four ancestry
points. Lightweight does not permanently shrink size. Lightning Nimbleness sets
speed 7 before kit bonuses; Nonstop/Unphased grant the correct condition immunities.
Keeper of Order is a free triggered action with its once-per-round restriction and
all four permitted edge/bane adjustments. Useful Emotion is a combat-start resource
grant, not initial permanent Surge state; Systematic Mind does not grant languages.

Time Raider has psychic immunity equal to level and three points. Psionic Gift has
one required nested choice with its original structured action and revokes it when
removed. Beyondsight's maneuver includes adjustment and restoration. Foresight keeps
both its passive concealment effect and its triggered action. Unstoppable Mind is
correctly sourced to its embedded paragraph in the ancestry traits entry. Four-arm
traits modify tests and existing maneuvers, rather than granting skills or inventing
extra permanent movement.

## Test value and remaining evidence

The focused tests catch concrete failures: signature omission, conditional values
mistakenly made permanent, wrong point budgets, missing granted actions, absent or
invalid mandatory children, duplicate same-type immunity stacking, and stale grants
on parent replacement. Loops over source choices cover distinct supported options;
these are not implementation-mirroring assertion inventories. No test was identified
as redundant enough to remove. Tests do not substitute for saved API proof or Forge
comparisons; the integration lead owns those and their actual run evidence.

This consultation excludes the reviewer's own Revenant/Wode code and does not
certify shared ingestion, authenticated permissions, persistence, final content
counts, Forge adapter behavior or production effects. Formal implementation and
fresh rules acceptance must cite the completed integration checks and comparison
results rather than promote this pre-check consultation alone.

## Forge representation finding

Pinned Forge's `src/components/features/feature-data/choice.tsx`, `ConfigChoice`,
expands former-ancestry paid options directly when an ancestry-feature-choice wrapper
is present, removes the wrappers, deduplicates by original feature ID, and stores
selected paid features directly. Thus multiple distinct one-point Previous Life
purchases have a real no-browser reference representation; there is no need to
modify pinned definitions or invent duplicated wrapper IDs. This source finding
was sent to the Forge adapter owner for the multi-purchase witness.
