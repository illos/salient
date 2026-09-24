# V147 independent rules and implementation review

Reviewer: V147-REVIEW (independent review subagent). Date: 2026-09-24.
Reviewed `slice/V147` at `125d6412` in `.worktrees/resource-conduit`.
Rules source: pinned Steel Compendium, `en/unified/md` in the main checkout (read-only).

Scope note: `125d6412` is cut from `24531816` (V144 before its closure round), not from
`558b8109`. `git diff 558b8109..125d6412` therefore also shows V144's closure commits reversed
(`docs/build/audits/V144-rules-review.md` deleted, the V144 work-log lines and the Null test cast).
Those are not V147 changes. The V147 change is `24531816..125d6412`, and it was reviewed as such.
`git merge-tree 558b8109 125d6412` merges cleanly, keeping V144's closure files.

Verdict at `125d6412`: CHANGES REQUIRED (R1 required; R2 and R3 advisory).

Checks run in the worktree:
- `npx tsc --noEmit`, `-p convex/tsconfig.json` and `-p tsconfig.web.json`: all clean.
- `npx eslint` on the 11 changed source and test files: exit 0.
- `npx vitest run tests/app/heroic-resource-conduit.test.ts tests/scripts/heroic-resource-generation.test.ts`:
  2 files, 8 tests passed.

## Findings

### R1 (required). A prayer declared in one encounter carries into the next encounter's first turn

- **Where.**
  - `convex/lib/clock.ts:288` and `:346-347`: the only place `prayNext` is cleared is a turn-start
    firing that consumes it. The `encounter-end-loss` patch clears `resourceClaims` but not
    `prayNext`.
  - `convex/lib/closeoutOperations.ts:261-296`: `voidEncounter` in `keep` mode does not clear it
    either.
  - `convex/lib/resourceOperations.ts:169-218`: `resource.pray` has `session: 'running'` and needs no
    active combat or turn. The UI toggle (`web/table/targeting.tsx:344-359`) is always shown.
- **Evidence.** `feature/conduit/level-1/piety.md`: "Before you roll to gain piety at the start of
  your turn, you can pray (no action required). If you do, your roll gains the following additional
  effects: If the roll is a 1, you gain 1 additional piety but anger the gods! You take psychic
  damage equal to 1d6 + your level…". The prayer is a choice made for one specific roll. Declaring
  in advance is a reasonable app convenience. But a declaration made for a turn that never came
  should not bind a roll in a later encounter.
- **Failure scenario.**
  1. In round 3, the Conduit's player presses Pray after their turn, meaning to pray at the next
     one.
  2. The last enemy falls, and the combat ends (or the Director voids it with `keep`) before that
     turn.
  3. `prayNext` stays `true`.
  4. Days later, a new encounter starts. At the Conduit's first turn start, the clock prays without
     the player choosing to. On a 1 it deals 1d6 + level psychic damage, ignoring immunity.

  Nothing tells the player the flag survived, except the sheet line "Praying before the next
  turn-start roll."
- **Fix.**
  - Clear `prayNext` in the `encounter-end-loss` patch (`clock.ts:346`) and in `voidEncounter`.
    Alternatively, record the declaration with its `encounterId`, or with none for a pre-combat
    declaration, and ignore a declaration from a different encounter.
  - Add a focused assertion: pray, end combat, start a new combat, take the first turn, and check
    that the turn-start event has no `prayer` and a single die.

### R2 (advisory). Blessed Domain's scope is an interpretation presented as fact

- **Where.**
  - `shared/resolve/heroicResourceGeneration.ts:89-95`. The comment says "every domain piety gain is
    1 higher from level 4".
  - `docs/build/V147-conduit-piety-generation.md:36`.
- **Evidence.**
  - `feature/conduit/level-4/blessed-domain.md`: "Whenever you gain piety from a domain effect, you
    gain 1 additional piety."
  - In the Compendium, "domain effect" names the prayer effect, not the domain piety trigger.
    `piety.md` says "can activate a domain effect of your choice", and
    `domain-piety-and-effects.md` says "whenever you activate a domain effect by praying for piety,
    you can choose one of your domains and have that domain's prayer effect take effect". The
    domain entries separate **Piety:** from **Prayer Effect:**.
  - None of the twelve prayer effects grants piety, and no level 1–6 Conduit feature does either.
    Read literally, Blessed Domain would do nothing. The implemented reading is the only one with an
    effect:
    - +1 on the domain piety triggers;
    - not on the prayer's own +2 on a 3, which comes from the prayer roll rather than from the
      domain effect.

  AGENTS.md requires an interpretation to be labelled, to cite the passage and to name the
  alternatives.
- **Failure scenario.** None in play today. A later reader, or a later class slice reusing
  `BLESSED_DOMAIN`, takes the quote as a literal match for the domain piety trigger. They might also
  add the +1 to the prayer's 3 outcome, since the 3 outcome "activates a domain effect". There is no
  record of why it doesn't.
- **Fix.** Label it as an interpretation in the code comment and the slice doc. Name the
  alternatives: (a) literal, which is inert because no prayer effect grants piety; (b) also +1 on
  the prayer's 3 outcome. Say why (b) was not chosen. It is optional to add it to
  `docs/rules-questions-for-user.md` beside Q-RES-6 and Q-RES-9.

### R3 (advisory). The one rule-specific branch of the angered-gods damage is untested

- **Where.**
  - `convex/lib/clock.ts:361-362`: `{ ...facts.facts, immunities: [] }`.
  - `tests/app/heroic-resource-conduit.test.ts:108-127`.
- **Evidence.**
  - "which can't be reduced in any way" (`piety.md`) is implemented only by dropping immunities.
  - A Conduit can have psychic immunity at levels 1–6: `feature/trait/time-raider/psychic-scar.md`
    says "You have psychic immunity equal to your level". It is evaluated in
    `shared/evaluate/ancestries/time-raider.ts:31`.
  - The v100 witness has no psychic immunity. Also, the test derives the damage from the logged d6,
    so the expected value is read from the code under test rather than positioned.
  - The 2 (+1) and 3 (+2, manual domain effect) outcomes are not exercised either. The code is
    correct on reading: `extra = rolled === 3 ? 2 : 1`.
- **Failure scenario.** A refactor drops the `immunities: []` override, for example by routing the
  damage through a shared helper. A Time Raider Conduit who prays and rolls a 1 then takes
  1d6 + level − level psychic damage. The focused test still passes.
- **Fix.** In the existing app test:
  - give the witness psychic immunity, either by patching `derivedBaseline.damageImmunities` as the
    test already patches the subclass, or by using a Time Raider build;
  - position both dice (d3 = 1, then a known d6);
  - assert Stamina falls by the full 1d6 + level computed from those positioned faces.

  Optionally, also cover a positioned 3, which should add 3 + 2 and log the manual domain effect.

## Checked and correct

- **Prayer outcomes.** 1 → +1 and 1d6 + level psychic damage. 2 → +1. 3 → +2, with the domain
  effect left manual. "your level" is read from `baseline.level`, which is the hero's level; that
  is the Conduit level for a single-class hero.
  - Immunity is removed. Hero damage facts carry no weaknesses, so nothing that could increase the
    damage is suppressed.
  - Temporary Stamina absorbs first. This is labelled Q-RES-6 and consistent with
    `rule/health/temporary-stamina.md` ("Whenever you take damage while you have temporary
    Stamina, the temporary Stamina decreases first").
  - The prayer is declared before the roll: `resource.pray` sets it, and the clock reads it at turn
    start.
- **Domain triggers.**
  - All twelve quotes are verbatim; the quote test covers them and the prayer clause.
  - Each is +2 and once per encounter.
  - Each is bound to the evaluated subclass. `shared/evaluate/classes/conduit.ts:13-15` writes
    `domains.join(' / ')`, and `triggersFor` splits on `' / '`. The domain values come from
    `censor/deities.ts` and exactly match the trigger `subclass` names. No other writer of
    `subclass` exists.
  - `triggersFor` is applied to the sheet list, claims, the damage observer and the Malice
    observer. The remaining `profile.triggers.find` (`resourceTriggers.ts:274`) looks up an
    existing claim by id, which is correct.
- **Death.** Death is two claims, labelled Q-RES-9, following the repeated "the first time in an
  encounter".
- **Knowledge.** Knowledge is automatic on a paid creature-ability Malice cost and claimable for
  any other spend. Both use the same trigger id, so the once-per-encounter latch covers "the
  Director spends Malice" in either path, without double counting.
- **Blessed Domain.** +1 from level 4 through `levelAmounts`. This applies to claims and observed
  gains alike (see R2 for the labelling).
- **Level ceiling.** The ceiling of 6 is right. `level-7/faithfuls-reward.md` changes the gain to
  1d3 + 1, and no level 2–6 Conduit feature changes piety generation. Level 6 Burgeoning Saint
  grants corruption or holy immunity, not psychic. Above level 6, `generationProfile` returns
  undefined, so `resource.pray` is refused and the sheet hides the toggle.
- **Engine.**
  - The resource gain, the `prayNext` clear and the damage all write through `firing.scope`, so an
    undo of the turn start restores all three.
  - The damage re-reads the character after the gain patch, so it does not overwrite the gain.
  - `writeDamage` is the same commit path that ability damage uses, including `observeHeroDamage`.
  - The dice keys `hr_…` and `hrp_…` are distinct per boundary and registration, and the die ids
    `gain` and `anger` are distinct.
  - With a fixed-kind turn start, `praying` would clear `prayNext` and log the prayer clause
    without applying an outcome. No profile has a fixed turn start together with a prayer, so this
    cannot happen today.
- **Content.**
  - The `Piety: Pray` row now points to `/resource pray` and `/resource claim`, and leaves level 7+
    manual.
  - The twelve domain prayer-effect rows only describe the manual prayer effect. No row instructs a
    manual piety gain, and none mentions Blessed Domain, so nothing double-counts.
- **Journeys.** `scripts/headless/conduit.ts` sets piety explicitly with `adjust.heroic-resource`
  before each use, takes no turns and has no foe Malice spend. Its assertions keep their meaning.
  No other journey or v100 test asserts Conduit piety.

## Closure round (2026-09-24)

Re-reviewed `slice/V147` at `13d80bb8`. It is rebased onto the V144 tip `558b8109`: `9049b142` is
the rebased implementation and `13d80bb8` holds the fixes. The V147 change is now
`git diff 558b8109..13d80bb8`, and it no longer reverts V144's closure files.

- **R1: closed.**
  - `convex/lib/clock.ts:346`: the `encounter-end-loss` patch sets `prayNext: false`.
  - `convex/lib/closeoutOperations.ts` `voidEncounter` (keep mode): clears `prayNext` for each
    participant, journaled under the void's scope, before the Q-RES-1 consequences.
  - Reset mode restores the combat-start snapshot, which holds the state before any in-combat
    declaration. That is correct.
  - The app test declares a prayer, voids with `mode=keep` and reads back `prayNext === false`.
    Encounter end is a one-line change with no dedicated assertion. It uses the same patch as
    `resourceClaims`, which V120 covers, so that is acceptable.
- **R2: closed.** Blessed Domain is labelled as Q-RES-11 in the `BLESSED_DOMAIN` comment and the
  slice doc, which cite the passage and name (a) the literal no-op and (b) +1 on the roll-of-3
  outcome. `docs/rules-questions-for-user.md` has a Q-RES-11 entry. The id is unique across local
  branches.
- **R3: closed.**
  - The test gives the Conduit psychic immunity 5 and positions both dice in order (d3 = 1, then
    d6 = 6). It asserts the logged faces `[1, 6]` and a fixed expected 7 damage. That value is
    derived from `piety.md` (1d6 + level 1), not from the code.
  - With the override removed, immunity 5 would leave 2 damage. The Stamina assertion would then
    fail, which matches the reported 16 vs 11.
  - A round-2 prayer on a positioned 3 asserts +5 piety and unchanged Stamina.

Run in this round, once, as instructed:
`npx vitest run tests/app/heroic-resource-conduit.test.ts tests/scripts/heroic-resource-generation.test.ts`.
Result: 2 files, 8 tests passed. The typechecks and eslint were not rerun for `13d80bb8`, because
this round allowed only these two test files.

Verdict at `13d80bb8`: **PASS**.
