# V115 independent rules and implementation review

Reviewer: V115-REVIEW (independent ENGINE2 review subagent). Date: 2026-09-24.
Reviewed `2ad979a7096ec8ed8f4582d6ab4c2df527979bb2` against base `3aa24ae`, in `.worktrees/engine-kit-bonus`.
Rules source: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, `en/unified/md`.

Verdict at `2ad979a`: changes required (R1–R2). The engine fixes all three second-round findings,
V109/V110 R1 (mode), V109/V110 R2 (Field Arsenal) and V113 R1 (known immunity), on the compiled,
compatibility and correction paths.

## R1: the "Use as" selector never renders for Compendium keywords

`web/table/targeting.tsx` compared the raw keywords (`"[Melee](scc…)"`) with `melee`, so the
selector never appeared. The server refuses a use whose mode matters, so a table user had no way to
choose a mode (`rule/combat/distance.md`, Melee or Ranged). Required change: compare the readable
text, and log the table scenario in the browser backlog.

## R2: the sheet still says to adjust Field Arsenal damage by hand

`web/character-sheet/ability-card.tsx` told users to apply replacements by hand. For melee and
ranged damage the table now applies them (`feature/tactician/level-1/field-arsenal.md`), so
following the text would count the replacement twice. Required change: say the table applies the
damage replacements, and keep "by hand" for the distance benefits.

## Reviewed and accepted

- **Mode.**
  - `withMode` drops the unchosen keyword before affordability, characteristic choice, the kit
    bonus, keyword modifiers, correction and push size (Big Versus Little).
  - `kitBonusFor` follows Melee+Weapon or Ranged+Weapon (`chapter/kits.md`). Without the Weapon
    keyword neither mode gets a bonus, so no mode is demanded.
  - `modeMatters` compares the kit bonus (including arsenal adjustments) and keyword modifiers.
  - Both `ability.use` and the resolver refuse; melee is never silently assumed.
  - The mode persists on the result and in the compiled inputs, and corrections reuse it.
  - The squad path, the weapon free strikes and the creature free strike have no ambiguity.
- **Field Arsenal.** The per-tier add − subtract deltas come from evaluated replacements, keyed by
  signature and kit path. They match the source's Battle Grace example (3/6/13) and Two Shot
  (2/4/10). Corrections keep them through the saved actor facts.
- **Immunity.**
  - Evaluated hero immunities (Nonstop, Great Fortitude, Unstoppable Mind, Fearless, Bloodless)
    produce `immune` before any requirement, and damage is untouched. The V88 order is unchanged.
  - `commitConditions` is the sole applier. The compatibility path applies no conditions.
  - Closeout and `ability.resolved` treat `immune` as final.
  - The foe trait scan only withholds automation (`fact-needed`).
- **Tests and journeys.** Values trace to source:
  - Panther 10/14;
  - Two Shot 2/4/10;
  - Net and Stab 8, immune;
  - Stunning Blast 7;
  - the Censor ledgers assume melee mode.

## Non-blocking observations

1. Temporary hero prevention (Applied Chronometrics, Kinetic Shield) and positional auras (Phantom
   Flow) are not evaluated immunities. Record this as a known limitation.
2. The app test's Cursespitter control is the War Walker's ally. It is fine as an engine witness;
   the headless journey uses a legal hero control.
3. Test comment inaccuracies and a loose refusal regex.
4. A misplaced doc comment in `convex/lib/resolve.ts`.
5. A stale "applied or resisted" refusal message.
6. A compiled correction of a pre-V115 mode-dependent result throws a plain `Error`. Development
   data is disposable.

No tests, builds, services or pnpm were run by the reviewer.

## R1–R2 closure: `fb3ce1f82f23acca18266227384694b3fdd6811e`

Final static verdict: PASS. Reviewed `e797ebf..fb3ce1f`.

- **R1 closed.** The table selector compares `readableRuleText(keyword)`, so linked Compendium
  keywords render "Use as". The server's `dualMode` uses the same plain-text rule, and the scenario
  is logged in the browser backlog.
- **R2 closed.** The sheet says the table applies melee and ranged damage replacements, and keeps
  "adjust by hand" for the distance benefits (`feature/tactician/level-1/field-arsenal.md`).
- **Nits fixed.**
  - Witness index and natural-19 comments.
  - The Protective Attack no-mode refusal (`kit/shining-armor.md`: Melee, Strike, Weapon).
  - The doc comment placement.
  - The "immune" refusal message.
  - A pre-V115 correction without a mode gets a rewind `ConvexError`.
- **TESTER fixes are consistent.**
  - The A05 syntax includes `[mode=…]`.
  - Cost gating before the mode prompt is harmless: a blocked use rolls and spends nothing.
  - The Censor journey matches Back Blasphemer!'s compiled push.
- The audit and the known-limitation note are accurate.

Non-blocking: the correction catch-all message could only be wrong for a corrupted record.

No tests, builds, services or pnpm were run by the reviewer.

Reviewed-By: V115-REVIEW (pass, 2026-09-24)
