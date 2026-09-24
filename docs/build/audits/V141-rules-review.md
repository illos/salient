# V141 independent rules and implementation review

Reviewer: V141-REVIEW (independent review subagent). Date: 2026-09-24.
Reviewed `c3b4fd1` (`slice/V141`) against the reviewed V120 engine at `eb32e21`
(`git diff eb32e21..c3b4fd1`), in `.worktrees/resource-summoner`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Verdict at `c3b4fd1`: PASS (R1 and R2 are advisory; nothing required).

## Findings

### R1 (advisory). The ledger calls the turn-start gain while dying an open ruling, but the slice ships it as neither a ruling nor a labelled interpretation

- **Where.**
  - `docs/build/evidence/V120/summoner.md:70-74`: this is item 6.4 under "Ambiguities that need a user
    ruling".
  - `docs/build/V141-summoner-essence-generation.md:33-34`: the item is listed under "Out of scope",
    yet the next sentence says "The gain is granted as literally written".
  - The code grants it with no condition: `shared/resolve/heroicResourceGeneration.ts:121-126`, fired
    by `convex/lib/clock.ts:289-292`.
  - `docs/rules-questions-for-user.md` has no Summoner entry for it. Only Q-SUMMONER-1 exists.
- **Evidence.**
  - `feature/summoner/level-1/essence.md`: "At the start of each of your turns during combat, you
    gain 2 essence." It has no exception.
  - `rule/health/dying.md`: "While you are dying, you can still act". V120 accepted the same reading
    for the Shadow on that citation.
  - `feature/summoner/level-1/minions.md` ("Unconscious"): "you can't summon new minions.
    Additionally, your remaining minions can't deal damage". This limits summoning and minion
    damage, not essence.
  - My reading is that the source settles it: the gain applies, and the behaviour is correct. What
    is wrong is the paperwork. The evidence ledger still says this needs a user ruling. The slice doc
    calls it both out of scope and implemented. AGENTS.md says an interpretation is labelled and names
    its alternatives, and that open questions go to `rules-questions-for-user.md`.
- **Failure scenario.** A later Summoner slice, or the reviewer of the other V140–V149 slices, reads
  the ledger and treats the dying gain as an unresolved question. They either reopen it with the
  user or withhold the gain for consistency. Nothing in the V141 records shows that the question was
  closed, or on what source.
- **Fix.** In the slice doc, move the item out of "Out of scope" into Scope as a resolved point. Cite
  `essence.md` (no exception), `dying.md` ("While you are dying, you can still act") and
  `minions.md` "Unconscious" (it limits summoning only). Name the alternative that was rejected:
  withhold the gain while dying or unconscious. Add a one-line note to ledger item 6.4 that it is
  resolved on those citations.

### R2 (advisory). `verifiedThroughLevel: 6` is backed by a sweep of levels 4–6 that no evidence file records

- **Where.**
  - `shared/resolve/heroicResourceGeneration.ts:113-114`, the comment "levels 1–6 are checked".
  - `docs/build/V141-summoner-essence-generation.md:26-27`.
  - The ledger `docs/build/evidence/V120/summoner.md:1,29` is titled "levels 1–3". It calls the
    level-4 Essence Salvage "outside this range".
- **Evidence.** I checked levels 4–6 myself and the ceiling is correct. `class/summoner.md`
  advancement rows 4th–6th grant these features:
  - Level 4: Characteristic Increase, Minion Improvement, Essence Salvage, Minion Chain, Perk, Skill.
  - Level 5: the circle features Shaping, Soul Flense, Channel, Dread March, Flash Powder, Pixie
    Lift, Nature Watch and Split, plus New Portfolio Minion.
  - Level 6: Perk, Minion Machinations, Kit Improvement, the 9-Essence Ability (A Champion's Cry,
    Army's Idol, The Champion Slams the Earth, Their Pall Shrouds All) and Return to the Source.

  Of these, only `level-4/essence-salvage.md` changes essence gain. The next change is
  `level-7/font-of-creation.md` ("3 essence instead of 2"). None of this is written down outside a
  code comment.
- **Failure scenario.** Someone adds Summoner level 4–6 content, or reviews the ceiling. The only
  ledger stops at level 3 and describes the level-4 amount as out of range. They cannot tell whether
  the ceiling of 6 was checked or assumed.
- **Fix.** Add a short "Levels 4–6" section to `evidence/V120/summoner.md` listing the features
  above and the result: only Essence Salvage changes gain, and Font of Creation at level 7 sets the
  ceiling. Retitle the ledger "levels 1–6".

## Reviewed and accepted

- **Profile clauses.** The following clauses match `feature/summoner/level-1/essence.md`, and the
  pure test checks every quote verbatim, including the level-4 `levelAmounts` quote:
  - the combat-start grant equal to Victories;
  - a fixed +2 at each turn start;
  - the encounter-end `lose`;
  - the minion-death trigger.
- **Level 4 amount.** `essence-salvage.md` says "you gain 2 essence instead of 1". The
  `class/summoner.md` 4th-level row grants Essence Salvage, so `fromLevel: 4, amount: 2` is right.
- **Ceiling.** `verifiedThroughLevel: 6` is correct (see R2). `font-of-creation.md` is a 7th-level
  feature, and `generationProfile` returns undefined from level 7, so a level-7+ Summoner stays
  fully manual.
- **Round limit.**
  - `essence.md` says "The first time each round"; `essence-salvage.md` says "each combat round".
    `limit: 'round'` fits both.
  - The claim window is keyed by encounter and round only, not by turn. It can therefore be claimed
    on anyone's turn, which the source allows ("any minion (either yours or an enemy)").
- **Exclusions.** The sources that say a death gives no essence are complete through level 6:
  - Explosive Parade (L1), Cavalry Call (L3) and Essence Funnel (L3) each say "you gain no essence
    from their deaths".
  - Willing sacrifice for a cost discount (`essence.md`) is excluded by "unwillingly".
  - No level-4–6 feature, 6th-level ability, ward, minion or champion stat block, or fixture adds
    another exclusion or gain. I grepped the whole Compendium for essence gain, loss and "instead of"
    wording.
  - The only other gain, Crystallized Essence ("give yourself 5 essence"), is a 3rd-echelon treasure
    and stays manual. The Signature Summoner title is 4th echelon and costs nothing.
  - Their Life for Mine (sacrifice and spending all essence) is level 7, above the ceiling.
  - The confirmation text leaves dismissal and Standby Minions to the table, as the slice doc says.
- **Elementalist and multiclass.**
  - The profile is found by `baseline.class.value === 'Summoner'`. There is no Elementalist profile,
    and Salient has no multiclass. The Compendium has no multiclassing either.
  - An Elementalist with an `essence` pool can never match. The Elementalist's own rules also differ
    (a damage-within-10-squares trigger, and `surging-essence.md` at level 7), so sharing a profile
    would be wrong. Keying by class avoids it.
- **Double counting.** No Summoner content row adds essence by hand. I checked
  `shared/content/classes/summoner/{abilities,level-one,minions}.ts`,
  `shared/evaluate/summonerAbilities.ts` and `shared/evaluate/classes/summoner.ts`. The only essence
  text there is payment, the out-of-combat waiver and stat-block costs.
- **Existing coverage.**
  - `scripts/headless/summoner.ts` is the only other flow that commits combat with Summoners.
    - Its heroes have 0 Victories, so the new combat-start grant writes 0 → 0.
    - It never takes a turn, so no +2 fires.
    - It sets essence with absolute `/adjust heroic-resource value=cost` before every paid use, and
      asserts 0 after payment.
    - Its `finally` keep-close sees pools at 0, so no `combat.resource-kept` note is added.
    - No assertion changes meaning.
  - `tests/character-v107-summoner.test.ts` is evaluation-only.
  - The `tests/app` table fixtures contain no Summoner. No other test or journey uses the Summoner
    witness.
- **Engine use.** The Summoner uses the V120 paths unchanged:
  - registration at `convex/lib/combatOperations.ts:476-519`;
  - `fireHeroicResource` fixed branch at `convex/lib/clock.ts:289-292`;
  - the `resource.claim` round window, and the pool-name guard (the pool is `essence`).
- **Tests and journey.**
  - The app test proves these amounts from the source: Victories at commit (3), +2 per own turn
    across two rounds, one claim per round with the refusal, +2 at level 4, and 0 after finish.
    Patching `derivedBaseline.level` is acceptable, as it was for V120.
  - The headless cohort follows the `heroic-resource` cohort's pattern with persisted readback.

## Checks run by the reviewer

- `npx tsc --noEmit` (root) and `npx tsc --noEmit -p convex`: both exit 0.
- `npx eslint` on the five changed TypeScript files: exit 0.
- `npx vitest run tests/app/heroic-resource-summoner.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 6 tests passed.
- No other suites, journeys or services were run.

## Verdict

PASS. The profile matches the Compendium for levels 1–6, and nothing required remains. R1 (the
dying gain is recorded as an open ruling but shipped without a resolution note) and R2 (the level 4–6
sweep is not in the evidence ledger) are documentation fixes and do not block.
