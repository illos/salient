# V60 Dwarf preliminary independent review

Reviewer: Astra `closeout_fix`, 2026-09-20. Verdict: **no changes required by this static
inspection; acceptance pending full checks, browser/Forge evidence and final review**.
This is an early consultation, not the formal post-`pnpm check` implementation/rules acceptance.

Reviewed the uncommitted `slice/V60` candidate in `.worktrees/astra-dwarf`: ancestry decisions,
Dwarf derivation, shared composition/call sites, corpus selection/output and six focused tests.
The lead reports focused tests and TypeScript passed on CT114; this reviewer did not run them.
Full check was in progress during this review. Browser and same-build Forge evidence are pending.
No runtime was started, no application files were changed, and no Opus material was used.

## Source and behavior

Independently read the main checkout's pinned Compendium at
`fb83a789da8f0327a389c277a0c790b1648d5810`, under `en/unified/md/feature/trait/dwarf/`:
`dwarf-traits.md`, `great-fortitude.md`, `grounded.md`, `spark-off-your-skin.md`,
`runic-carving.md`, `stand-tough.md` and `stone-singer.md`; also the Dwarf ancestry entry.

The candidate matches the three-point budget and all five options/costs. Grounded adds one
stability; Spark adds six Stamina at level one, with recovery/winded derived from the new maximum.
Great Fortitude exposes weakened immunity. Stand Tough correctly leaves core Might and outgoing
potencies unchanged: its Might adjustment applies to resisting potencies, plus conditional test
edge, and is retained as readable manual rules. Runic Carving is an automatic readable signature;
its rune can change during play and is not a required permanent creation choice. The generated
corpus includes complete source text, including all three runes. Later Spark increments at
levels 4/7/10 remain outside this level-one unit; currently supported level two retains +6.

Kit and no-kit derivation occur before the ancestry contribution. Missing-kit Stamina/stability
remain absent, and the generic decision validator gates invalid purchased selections. Ancestry
replacement uses the existing prune mechanism and does not retain Dwarf statistics or traits.
No unsupported gameplay automation was introduced.

## Supporting interactions

The similarly named **Grounded complication** is not the Dwarf trait. Its source is
`en/unified/md/complication/grounded.md`, and it grants Motivate Earth (or enhances an existing
copy to ranged 5). The Dwarf trait reads only `ancestry.dwarf.purchased-traits`; the complication
continues through `complication.choice` and the existing ability grant path. No shared name-based
stability grant, overwrite or duplicate ability path was found. Taking the Dwarf trait alone does
not grant Motivate Earth; taking the complication alone does not add ancestry stability.

`applyDwarfBaseline` executes before `deriveSupportingBenefits`. Existing Stamina modifiers
(e.g. Elemental Inside's first-echelon +3 or the infernal-contract +3 selection) therefore add
on top of Spark, and the existing supporting path recalculates recovery/winded afterward.
Wodewalker's separate recovery bonus is applied after health division. No lost or double-counted
supporting bonus was identified in this ancestry integration. This is static inspection, not an
additional executed combination witness.

## Test value

The six tests exercise distinguishable failures: kit/ancestry health stacking; no-kit health and
Wodewalker ordering; immunity versus conditional Might; complete readable manual traits and rune
content; over-budget benefit leakage; stale benefits after parent replacement. Expectations are
explicit source-derived values rather than a second implementation of the evaluator. The corpus
check catches selectable features whose rule cards would have no shipped source entry. None is a
test-count target or a mock of the implementation's own calls. No redundant test or deletion is
requested by this review.

## Remaining acceptance

Finish the recorded full check, real wizard save/reload and rule-card journey, same-choice Forge
witnesses A/B/C, required broader browser verification, and final independent implementation then
rules review under the Astra workflow. The slice document still contains pre-verification wording
that should be updated once actual evidence is attached. No merge approval is given here.
