# V110 independent rules and implementation review

Reviewer: V110-REVIEW (independent ENGINE2 review subagent). Date: 2026-09-24.
Reviewed `eca2cee1478364a040be56210d2e7a015f516a9f` against base `cce0416`, in `.worktrees/engine-targets`.
Rules source: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, `en/unified/md`.

Verdict at `eca2cee`: changes required (R1). No rules error in the 30 promoted abilities. Per-target
resolution, the correction rework and the headless expected values are correct against the source.

## R1: the Area keyword admitted Target entries that are not "Each …" areas

`compileAbility.ts` cleared `target-boundary` whenever the shape was `area`. `targetShapeOf` returns
`area` for any Area-keyword envelope, so the boundary also cleared for these Targets:

- "Special" (32), "Self and each ally in the area" (23), "Self and three allies"
- "The triggering creature" (2), "One corpse"
- numbered "One creature (or object) in the area"

None of these was compiled at `eca2cee`, but Bilious Expulsion and Guardian From Afar were one
Effect slice away from an uncapped area. `rule/combat/target.md` (Each [Target]; Self) makes all
eligible targets affected only for unnumbered "each … in the area" Targets. Required change:
- Admit `area` only for that form.
- Keep the boundary for numbered, self, special and triggering Targets.
- Add Area-keyword negative tests.
- Regenerate the reports and confirm the 30 additions are unchanged.

## Reviewed and accepted

- **The 30 promotions.** Read against source (7 hero, 2 kit, 21 foe).
  - Each compiled tier holds exactly the printed damage, with `push N` or a save-ends potency
    condition where printed.
  - The only sections are two use-subject area-terrain Effects.
  - No printed Effect, trigger, "one target" clause or tier effect on the user is dropped.
  - The kit-bonus flag is set only on the two kit signatures.
  - No minion signature is promoted.
- **Per-target application.**
  - One roll gives each target its own tier from its own edges and banes (`chapter/classes.md`,
    `rule/dice/edge.md`).
  - All damage precedes tier effects (`rule/dice/ability-roll.md`, "Abilities With Damage and
    Effects"), and riders occur once per use.
  - Target-subject and tier-outcome sections stay manual on multi-target envelopes.
  - Object, squad and uncharacterised potency targets stay `fact-needed`.
  - Push is a per-target instruction, and the table orders push (`movement/forced-movement.md`).
- **Target limits.** Counted envelopes accept 1..max distinct targets and area envelopes at least
  one. Compiled counted uses refuse more than printed (`rule/combat/target.md`).
- **Correction rework.**
  - Other targets re-resolve from their current edges and banes, and their occurrences are kept
    by (node, target).
  - Only the corrected target's instances are ended and re-applied.
  - Single-target behaviour is unchanged, and persisted inputs are stripped from public reads.
  - Undo and redo still go through the journal.
- **`ability.resolved`.** Candidates come only from the current effects, so superseded ids are
  still refused.
- **Headless and test expected values.** Every value traces to source:
  - Back Blasphemer! 3/5/7 (Cloak and Dagger)
  - Back! 5/8/15 (Panther)
  - Quick Rewrite 4/5/6, with P2 potencies 0/1/2
  - Two Shot 4/6/8
  - Shadow Chains 2/4/5 with A < 0/1/2

## Non-blocking observations

1. The kit bonus for Melee-or-Ranged abilities follows `rule/combat/distance.md` mode choice.
   This has been owed since V92 and is not a regression.
2. War Spider Trample and Wode Hag Predator's Alacrity reuse a capped ability against more
   targets; they are now refused rather than warned. Neither is on the V1 roster.
3. Squad weakness and immunity apply once per squad (`chapter/monster-basics.md`). This predates
   V110.
4. Enemy eligibility and self-targeting are not enforced (out of scope).
5. V26 §3 revision wording should match the per-target revision rule.
6. Riders are addressed through the first target, which is cosmetic in closeout.
7. The correction save guard could be narrowed to the corrected target.

No tests, builds, generators or services were run by the reviewer.
