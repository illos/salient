# V82 independent implementation and rules review A

Reviewer: Astra remaining-Revenant/Wode implementer, independently reviewing the
Dragon Knight (V76), High Elf (V77), Memonek (V78), and Time Raider (V80) units.
2026-09-20. Formal scoped implementation review followed by a fresh pinned-source
rules review after the integrated full check. Live application acceptance remains pending.

## Result

**Implementation: PASS. Rules: PASS for the four scoped units.** No blocking
implementation or source findings remain in these four unit modules. The
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
points. The post-check provenance correction separates Lightweight into its own
automatic decision with the actual Lightweight path/quote; the existing focused
test now verifies that evidence rather than attributing it to Fall Lightly. Lightweight does not permanently shrink size. Lightning Nimbleness sets
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

## Validation and test value

The focused tests catch concrete failures: signature omission, conditional values
mistakenly made permanent, wrong point budgets, missing granted actions, absent or
invalid mandatory children, duplicate same-type immunity stacking, and stale grants
on parent replacement. Loops over source choices cover distinct supported options;
these are not implementation-mirroring assertion inventories. No test was identified
as redundant enough to remove. Tests do not substitute for saved API proof or Forge
comparisons; the integration lead owns those and their actual run evidence.

The integration lead's full `pnpm check` exited 0 at `3ddb81b`, with retained
[check output](../evidence/V82/check.log): **333 engine tests and 483 app/scripts
tests passed**, across 32 and 56 test files respectively. I inspected that log,
then re-reviewed the integrated decision/action registration, evaluator hooks and
the narrowly changed Memonek provenance code. The latter correction follows the
full run and still needs the lead's targeted revalidation; unchanged build/index
checks need not be repeated merely for a new reviewer.

After implementation review, I freshly reread all 33 source files in the four
trait directories (including the embedded Time Raider Unstoppable Mind) against
the final unit behavior. The source classifications and action timings above
remain correct. No additional source ambiguity was found.

This review excludes my own Revenant/Wode implementation and does not certify
authenticated permissions, persistence, live Forge comparison results or combat
automation. Final delivery remains conditional on the post-check correction
validation and authenticated application/reference proof recorded by the lead.
Passing this scoped review does not turn those pending acceptance gates into passes.

## Forge representation finding

Pinned Forge's `src/components/features/feature-data/choice.tsx`, `ConfigChoice`,
expands former-ancestry paid options directly when an ancestry-feature-choice wrapper
is present, removes the wrappers, deduplicates by original feature ID, and stores
selected paid features directly. Thus multiple distinct one-point Previous Life
purchases have a real no-browser reference representation; there is no need to
modify pinned definitions or invent duplicated wrapper IDs. This source finding
was sent to the Forge adapter owner for the multi-purchase witness.
