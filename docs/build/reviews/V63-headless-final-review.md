# V63 final headless implementation and rules review

Date: 2026-09-20. Independent reviewer: fresh Astra review agent. Reviewed branch
`slice/V63-corrections-rebase`, source `47e69c6753c7c0f7eba22d361a1a3598f26f0155`,
against main `2f5544f`. This review did not run tests, builds, runtime services or browsers,
and made no implementation edits. The integrating lead supplied fresh CT114 evidence.

## Implementation verdict: PASS

No blocking correctness, authorization or regression finding in the bounded correction change.
This verdict follows source inspection and inspection of the fresh successful CLI proof below;
it does not inherit a verdict from the historical reviews or browser runs.

Reviewed the combined changes in `convex/lib/history.ts`, `convex/lib/historyRead.ts`,
`tests/app/abilities.test.ts`, `scripts/v63-headless.ts`, and the backend-only deterministic
dice helper `tests/browser/v26-dice-import.mjs`. Also inspected the existing history index,
window/ownership helpers and ability correction operation that these changes depend on.

- The mutation permits only an uninterrupted suffix of corrections whose cause and recorded
  original event both identify this ability use. It retains the original unit's floor and
  ownership checks and checks player authority over every continuation. Director corrections
  remain player seams. Unrelated gameplay and manual dispositions still block correction.
- Manual clause disposition accepts the same roll's linked corrections and dispositions,
  preserving the existing Director closeout exception and floor. It does not infer movement.
- The indexed query follows active `previousBranch` links only through this ability's suffix,
  checks session and decreasing sequence, and delegates the resulting scope to mutation policy.
  Undo/redo preserves those links. Incomplete indexes continue to withhold controls. This avoids
  replaying the session in passive reads and preserves projected descriptions in refusal text.
- The new regression assertions protect real failures: a second correction rejected incorrectly,
  query/mutation permission disagreement, double reconciliation or payment, changed accepted dice,
  changed unrelated targets, retries duplicating work, and crossing another roll or Director seam.
  Permission expectations are explicit constants, not values computed by the implementation.
  The multitarget test starts with 5 Ferocity and expects 0 after one use and both corrections.
- The CLI runner registers and authenticates both roles over HTTP, creates/adopts the hero via
  public operations, submits gameplay through `scripts/app.ts`, and separately reads public
  roster, result, event and history queries. The disclosed fixture imports only deterministic
  dice state. It does not seed the claimed gameplay outcomes. Target guards restrict the helper
  to the isolated engine-corrections environment. Its table replacement must stay isolated.

The suffix traversal is proportional to the number of consecutive corrections/dispositions,
not constant size; no claim of constant cost for an arbitrarily long continuation chain is made.
This review does not expand into the inherited authoritative session-replay implementation.

## Fresh evidence inspected

All links below refer to the clean reviewed source, not the earlier provisional run:

- [Source identity](../evidence/V26/corrections-2026-09-20/v63-rebased-source.json)
  records clean `47e69c6` and clean pinned vendor revisions.
- [Full check output](../evidence/V26/corrections-2026-09-20/v63-rebased-check-output.txt)
  and [exit status](../evidence/V26/corrections-2026-09-20/v63-rebased-check-exit.txt)
  show exit 0, 284 engine and 421 app/scripts tests, lint/types, source/content checks and build.
  Test totals are evidence inventory, not acceptance targets.
- [CLI persisted readback](../evidence/V26/corrections-2026-09-20/v63-rebased-headless-readback.json)
  and [exit status](../evidence/V26/corrections-2026-09-20/v63-rebased-headless-exit.txt)
  show `passed: true`, `stage: complete`, exit 0, run
  `c47b0e70-0b7a-49f9-985e-1e16d5846d73`, 12 records including setup.
  The target is the isolated CT114 engine-corrections backend (`http://backend:3210` internally),
  with frontend identity `salient-engine-corrections-dev-bd0641caff1f.tail41404c.ts.net`.
- Compared all four hashes embedded in that readback with the local reviewed files: runner,
  mutation history, indexed history read, and dice helper all match. The separate
  [file manifest](../evidence/V26/corrections-2026-09-20/v63-rebased-files.sha256)
  also identifies the reviewed test source.

Independent readback inspection confirms Goblin Stamina follows
`7 → 7 → 10 → 7 → 10` through initial use, one bane, two banes, undo and redo.
Disposition leaves 10, its rewind removes the disposition, and Director restoration returns 7.
Player correction after that Director entry is denied without changing 7. Turn end then closes
both correction windows and manual resolution; the denied Director correction leaves 7.
Accepted dice remain 7+7 throughout. The original projected event is identical in every capture;
separate correction identities and undo/redo targets agree with the effective result. Indexed
permissions agree with these transitions. The retained events contain no warnings.

## Pinned-source rules verdict: PASS for the bounded BS/TR expectations

Performed after implementation passed. Read the local clean Compendium at
`fb83a789da8f0327a389c277a0c790b1648d5810`; no web substitutes, abandoned Opus material,
or observed output supplied the rules expectations. Source paths below are relative to
`vendor/steel-compendium/en/unified/md/`:

| Source | Clauses checked |
| --- | --- |
| `feature/ability/fury/level-1/brutal-slam.md` | Full ability, keywords, characteristic and all tiers |
| `feature/ability/fury/level-1/thunder-roar.md` | Full ability, 5 Ferocity cost, area, tiers and nearest-first effect |
| `rule/dice/power-roll.md`, `rule/dice/tier-outcome.md`, `rule/dice/edge.md`, `rule/dice/bane.md` | Roll construction, tier thresholds, single modifiers and double tier shifts |
| `rule/dice/ability-roll.md` | Characteristic damage expressions; damage to all targets before effects |
| `chapter/kits.md`, `kit/mountain.md` | Melee plus Weapon qualification; Mountain +0/+0/+4 |
| `monster/goblin/statblock/goblin-warrior.md` | Stamina 15, size 1S, stability 0 and no printed immunity |
| `movement/forced-movement.md`, `rule/character/size.md`, `rule/character/stability.md` | Push semantics, larger-to-smaller bonus, optional stability reduction and manual movement limits |

For the appendix's Might-2 Mountain fixture, Brutal Slam with 7+7 totals 16: tier 2,
`6 + 2 + 0 = 8` damage, Goblin 15→7. One bane makes total 14, still tier 2 and 8 damage.
Two banes retain total 16 and lower the outcome one tier: `3 + 2 + 0 = 5`, Goblin 10.
Reconciling +3 Stamina once is correct. Removing those banes returns 8 damage and Stamina 7.
These independently derived values match the fresh persisted proof.

Thunder Roar with 7+6 and Might 2 totals 15. One edge gives 17/tier 3 and
`13 + 4 = 17` damage, Goblin -2. Two banes lower tier 2 to tier 1 for 6 damage,
Goblin 9. An unmodified target takes 9 damage, Goblin 6. Might is added to the roll,
not these constant damage expressions. Mountain qualifies because this ability has Melee and
Weapon; Strike is not required. The 5 Ferocity cost is paid once. The appendix's 6→1 and
the regression fixture's 5→0 are consistent distinct starting balances. All target damage
precedes the nearest-first manual movement effect; selection order is not movement order.

The BS appendix's future push allowances 2/3/5 correctly combine printed 1/2/4 with the
larger 1M versus 1S bonus before optional stability reduction. V63 still retains printed push
clauses as manual text; the fresh evidence does not claim calculated allowances or movement.
Thunder Roar's printed 2/4/6 likewise remain manual. No collision or destination is inferred.
Consecutive correction authorization and history seams are the accepted application policy in
[the table spec](../../table-spec.md#director-edits-to-inline-results), not Compendium rules.

## Scope and completion limits

PASS is for V63's consecutive-correction prerequisite and indexed permission repair. It is not
acceptance of the broader V26 compiler, movement calculations, or all ten ability designs.
Thunder Roar's changed multitarget regression is covered by the fresh full suite, not a new
Thunder Roar live CLI journey. The changed shared correction lifecycle has fresh live BS proof.
The browser moratorium governs this review: no browser run was performed or used as acceptance,
and its absence is not a blocker. Visual scenarios remain in the
[browser backlog](../browser-coverage-backlog.md); historical browser artifacts are historical only.
This review does not establish a merge into main or an update to the shared playable environment.
Chords calls at start and completion reported an ambiguous provider session; the reviewer
coordinated findings with the integrating lead without guessing a sender identity.
