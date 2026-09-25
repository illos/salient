# V179: Immunity and weakness granted in play

Rules review: required. Depends on: V178, V158, V159, V174.

## Goal

Track the damage immunity and weakness that abilities grant in play, so that every damage path
applies them next to the printed cells and evaluated values. Only the highest immunity and weakness
of a type applies. A grant the engine can't store exactly stays manual, and the diagnostic says why.
No stat block leaves `FOE_MODIFIER_TRAITS` without a compiled granting ability that stores an
instance.

## Scope

- **Payload.** A V159 `modifier` effect instance gets a new payload, `damage-modifier`
  (`shared/contracts/liveState.ts` `DamageModifier`). It carries the defense (`immunity` or
  `weakness`), the damage type or `all-damage`, and the value. Its validator is in
  `convex/characterTables.ts`.
- **Grammar** (`shared/resolve/damageModifiers.ts` `tierDamageModifier`). A tier clause that gives
  the target a typed or untyped damage weakness N is read whole. It may have a potency. Its
  duration is "(save ends)", "(EoT)" or "until the end of the encounter". It compiles as a
  `damage-modifier` tier node after the tier's damage (`shared/resolve/compileAbility.ts`), which
  `resolveCompiledAbility` re-reads and checks for tampering.
- **Outcome** (`shared/resolve/compiledOutcome.ts` `damageModifierOutcome`). It is a `modifier`
  outcome with `tier: true` and the potency check (`rule/character/potency.md`):
  - `applied` for a hero or a foe outside a squad;
  - `resisted` when the target's score is not below the potency;
  - `manual` for a squad minion or an object, when a potency fact is missing, or when the tier's
    damage wasn't applied.
  - `commitModifiers` stores an applied outcome as an instance and logs a resisted one as
    `effect.resisted`.
- **Damage** (`convex/lib/resolve.ts` `damageTargetFacts`). The creature's active granted entries
  are added to its printed or evaluated entries (`grantedDefenses`, `withGrantedDefenses`), and
  `applyDamage` takes the highest.
  - This covers every path that builds facts there: ability damage, free strikes, squad free
    strikes, watchers, triggered damage, Strained damage and clock damage.
  - Corrections and V174 revisions keep the values their hit saved.
  - A granted entry in a V158 manual stacking group makes the creature's damage manual.
- **Corrections** (`ability.correct`). A correction that would change a stored weakness is refused;
  the table rewinds the use (Q-IW-2 point 3).
- **Revisions** (`convex/lib/damageRevisions.ts`). A potency decrease (Parry, the potency Spend
  sections) re-checks a stored weakness and ends it when it no longer applies. A rolled save
  refuses the revision.
- **Manual diagnostics** (`defenseManualReason`, diagnostic `defense-manual`). A clause the compiler
  already left manual that grants or changes an immunity or weakness says why. Each hero ability
  at levels 1 to 3 has its own reason. The diagnostic never changes whether an ability compiles.
- **Display:** the ability card, closeout and `ability.resolved` handle `resisted`, and
  `effect.list` describes the payload.
- Out of scope, kept manual (Q-IW-2): Purifying Fire, Smolder, Weakening Brand, Force Orbs, Statue
  of Power, Steel Ward, and every foe self-grant and standing or conditional trait on
  `FOE_MODIFIER_TRAITS`.

Compendium (pinned `en/unified/md`):

- the rules: `rule/damage/damage-immunity.md`, `rule/damage/damage-weakness.md`,
  `rule/character/potency.md`, `rule/combat/target.md`;
- the abilities named in Q-IW-2, and `monster/draconian/statblock/myxovidan-the-sintaker.md`.

Spec references:

- `docs/roll-and-damage-resolution.md#62-immunity-and-weakness`

## Acceptance checks

1. `tests/scripts/granted-defenses.test.ts` (pure):
   - The tier clauses of Setup, Corruption's Curse, Purifying Fire and Expunging Exhalation read as
     printed: potency, type, value and save ends.
   - Setup, Corruption's Curse and Expunging Exhalation compile. Purifying Fire, Smolder,
     Weakening Brand, Force Orbs and Statue of Power stay manual with a `defense-manual` reason.
   - Setup's weakness is applied below the potency and resisted at it. It is manual for an object,
     a squad, or damage that wasn't applied. A tampered node is refused.
   - Granted and printed entries: the highest applies (the rule examples: 10 fire takes 15, and 12
     fire with damage immunity 5 and fire immunity 10 takes 2). The weakness applies before the
     immunity. A typed grant meets only its type.
   - Ended, consumed and object-held grants are ignored. A manual stacking group is manual.
   - A potency decrease ends a stored weakness.
   - The immunity-ignoring dealers (Optacus, Kobold Adeptus, the Jurist's fire) have no compiled
     ability.
2. `tests/app/granted-defenses.test.ts` (convex-test, `transactionLimits: true`), with persisted
   readback:
   - **Setup at tier 2 on a goblin:** 11 damage, and a stored damage weakness 5 (save ends).
     - A later goblin free strike deals 1 + 5.
     - Hurl Element fire at tier 1 deals 6 + 5.
     - A correction to tier 2 deals 8 + 5 from the saved facts.
     - After `effect.end`, the free strike deals 1.
   - **Setup at tier 1:** resisted, with nothing stored and 1 dealt afterwards.
     - A correction with one edge keeps the instance.
     - A double edge would change it, so it is refused.
   - **Two Shadows' Setups:** a manual stacking group, so the next damage is manual.
   - **Myxovidan's Expunging Exhalation at tier 2 on the Talent:** 12 damage, and a stored
     corruption weakness 3, scheduled in combat.
     - Parry halves the damage to 6 and ends the weakness; undo restores it.
     - The untyped free strike 7 takes no corruption weakness.
3. `tests/scripts/live-compiled-report.test.ts` lists the three new compiled abilities. Both
   reports are regenerated: V72 changes and V64 is unchanged.
4. Journey, for TESTER: `scripts/headless/conduit.ts` checks Corruption's Curse as compiled and
   resisted by the Might 2 Censor target. TESTER: `CI=true pnpm check` and the conduit journey.
5. An independent rules and implementation review.

## Work log

- 2026-09-25: worked on `slice/V179` in `.worktrees/granted-defenses`, cut from main `bb2e4e6e`.
- **Hero abilities at levels 1 to 3 that grant an immunity or weakness** (every
  `feature/ability/**` file at those levels mentioning immunity or weakness):
  - Setup and Corruption's Curse compile.
  - Purifying Fire, Smolder, Weakening Brand (kit), Force Orbs and Statue of Power stay manual,
    each with its reason in Q-IW-2.
  - Hesitation Is Weakness and Teamwork Has Its Place only mention the word.
- **Flips** in the regenerated V72 report:
  - Setup, Corruption's Curse and the foe ability Expunging Exhalation (Myxovidan the Sintaker)
    change from manual/legacy-compatibility to supported/compiled.
  - Reachable compiled abilities go from 179 to 182; the 20 without a power roll are unchanged.
    Compatibility goes from 1442 to 1439.
  - Purifying Fire, Searing Grasp and Dweomer Plume lose `unsafe-tier-remainder` but stay manual
    (manual-section and target-boundary). `defense-manual` is added to already-manual abilities.
  - The V64 audit regenerates unchanged, since classify is untouched.
- **Foes moved off the manual list: none.** Every self-grant on `FOE_MODIFIER_TRAITS` is an
  ability that is manual for other reasons, or a trait no stored instance models exactly
  (Q-IW-2). The V178 scan test is unchanged and still classifies every mention.
- **Dealers that ignore immunity:** none of their abilities compile, and foe free strikes are
  untyped, so there is nothing to apply. A pure test fails if one compiles.
- **Interactions checked:**
  - **Watchers, clock damage, Strained and triggered damage:** they read `damageTargetFacts`.
    "Can't be reduced" still clears immunities, granted ones included.
  - **Triggered offers:** they are sized from the application.
  - **Marks:** the extra damage uses the hit's saved values.
  - **Squads:** minions never hold a grant.
  - **Corrections and V174 revisions:** see the Scope section.
  - **Stacking:** the same user's repeat supersedes, and two users' uses form a manual group.
  - **The hit itself:** a weakness is stored after the use's damage, so the hit that imposes it
    doesn't take it (an interpretation: Q-IW-2 point 7).
- **Tests and journeys touched:**
  - `tests/scripts/live-compiled-report.test.ts` (compiled list);
  - `scripts/headless/conduit.ts` (a Corruption's Curse branch replaces the manual-remainder
    check);
  - the new files `tests/scripts/granted-defenses.test.ts` and `tests/app/granted-defenses.test.ts`.
  - Grepped every flipped name against `scripts/headless` and `tests`:
    - Setup appears only in build selections and ability lists (v92/v97/v98/v108/v109/v152
      ledgers).
    - Corruption's Curse appears in the v100 ledger, whose `manualRemainder` the conduit journey no
      longer reads for it, and in the v109 selections.
    - Expunging Exhalation and Myxovidan appear in no journey.
- **Authoring checks** (all run in the worktree):
  - `pnpm -s lint` clean.
  - `pnpm -s tsc --noEmit` and `pnpm -s tsc -p tsconfig.web.json` clean.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches.
  - Focused vitest with `--maxWorkers=2`: the two new files, all of `tests/scripts`, and the app
    files immunity-weakness, modifiers, damage-reactions, effect-instances, closeout,
    potency-conditions, tier-effects, compiled-effects, shadow-character, heroic-resource-conduit,
    marks, watchers, multi-target and abilities. Only `tests/scripts/rules.test.ts` failed, because
    this worktree has no generated `public/rules-data` (`pnpm rules:ingest` not run). No rules data
    changed.
- Journeys were not run (TESTER). Open question: Q-IW-2 in `docs/rules-questions-for-user.md`.
- 2026-09-25, QC1 R1 (High, `review-artifacts/2026-09-25-V179-QC1.md`):
  - **Finding:** a potency-reducing reaction ended a granted weakness after a later hit had already
    taken it, leaving that hit's +3 standing.
  - **Fix, refuse chosen over reconcile (Q-IW-2 point 4):** `planRevision`
    (`convex/lib/damageRevisions.ts` `laterDamageUsing`) refuses before any write when the
    revision would end a stored weakness or immunity. It does so if any later damage application
    to the holder, not undone and outside the imposing hit's command, applied a weakness (or an
    immunity) while the instance was active. A saved value is never taken as authority to keep the
    damage. The card stays open, and the table rewinds to the hit.
  - **Test:** `tests/app/granted-defenses.test.ts`, "V179 QC1 R1", follows QC1's ordering with
    real dice:
    - Myxovidan's natural 20 deals 15 plus the weakness (21 → 6).
    - The additional main action's tier 1 deals 7 + 3 (6 → −4).
    - Parry is refused. Stamina is −4, the weakness is active, the card is open and Vane has no
      triggered action used.
    - Undoing the later hit lets Parry through: 21 − 7 = 14, and the weakness ends.
    - The immediate-Parry control is kept.
    - Without the fix, the new case fails (the response resolves).

