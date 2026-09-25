# V170: Talent Strained sections

Rules review: required. Depends on: V159 (stacked on `slice/V159` `b544099`, itself on V158 and
V157, none merged yet).

## Goal

Talent abilities whose only blocker was their **Strained:** section compile. A use decides whether
the Talent is strained, from the clarity pool before and after this use's payment, and applies the
section's supported clauses. The table can declare strain where the engine can't observe it, which
is outside combat, and can override the automatic value. Any Strained clause the engine can't
execute keeps its ability manual.

## Scope

- Reader: `**Strained:**` is a named section label in the Markdown reader
  (`shared/resolve/abilityGrammar.ts`, `SECTION_LABEL`).
  - Why the counts differed: the structured envelope already carried the section (`name: Strained`).
    The Markdown reader didn't know the label, so it appended the paragraph to the previous section
    or left it unattached.
  - That produced `source-block-count`, `source-block-mismatch` and `unaccounted-paragraph` for all
    23 Talent abilities at levels 1–3. The fix is a projection fix, not a grammar change.
- Compile (`shared/resolve/strained.ts`, `compileAbility.ts`): a whole Strained section after the
  roll is a `strained` section node when every sentence is one of:
  - "The target takes an extra N [type] damage." Admitted only for a one-target envelope (V110) and
    when N has the type of every tier's damage.
  - "You (also) take N [type] damage that can't be reduced in any way."
  - Anything else keeps the section `unsupported` (`effect-paragraph:strained`, `manual-section`).
- Applicability (`feature/talent/level-1/clarity-and-strain.md`, Clarity in Combat): "Whenever you
  have clarity below 0, you are strained. Some psionic abilities have additional effects if you are
  already strained or become strained when you use them." `strainedState` records one basis:
  - `already-strained`: clarity below 0 before the use;
  - `became-strained`: this use's clarity payment takes it below 0;
  - `not-strained`, or `no-clarity` when the user has no clarity pool;
  - `outside-combat`: declared outside combat, where the engine can't see the one-minute window or a
    voluntary choice (Clarity Outside of Combat: "take 1d6 damage and incur the effect");
  - `declared-strained` / `declared-not-strained`: the table's override in combat.
- `ability.use` gains `strained=yes|no`. It is refused for an ability without an engine-applied
  Strained section.
  - The decision is saved in the compiled inputs, so `ability.correct` reuses it and never
    re-decides.
  - It also goes in the event data (`data.strained`) and the log text.
  - The Director can act for players, as for every operation.
- Execution:
  - Extra target damage is added to that target's damage for this use (breakdown `extraDamage`). A
    correction keeps it (`correctTarget` takes the saved extra).
  - Self-damage "that can't be reduced in any way" is applied to the user after the use's other
    effects, without immunity. This follows the Q-RES-6 interpretation.
  - Outside combat, a declared strain first rolls and applies the 1d6 (held for Steel Ward or Force
    Orbs, as the V146 turn-end strain is).
  - Wards that react to damage are named in the log.
  - The compiled `strained` outcome records the basis and the user's application (`applied`,
    `not-strained`, or `manual` with requirements).
- Table display: the card shows a "Strained effect" entry. Closeout and `ability.resolved` skip an
  applied or inapplicable one.
- Guidance: the Talent fallback note (`shared/evaluate/talentAbilities.ts`) and the "Mind Spike:
  Strain" / "Spirit Sword: Strain" records now say the engine applies these sections and how to
  declare strain outside combat.
- Out of scope: other Strained clauses (area size, self-conditions with non-EoT durations, surges
  usable immediately, Reason-valued damage, clarity gains, half-damage). The one-minute 1d6 for
  clarity abilities without a strain effect stays manual (Clarity and Strain: Outside Combat record).
  There is no UI control for the declaration: it is available through the shared operation (palette,
  slash text, CLI/API).

Spec: `docs/decisions/2026-09-24-compiled-effect-coverage.md#what-compiled-means`,
`docs/decisions/2026-09-24-automation-rulings.md#1-lasting-effects-and-modifiers-may-be-automated`.
Rules question: [Q-STRAIN-1](../rules-questions-for-user.md#q-strain-1-how-a-strained-mind-spike-or-spirit-sword-deals-its-damage-v170).

## Acceptance checks

1. `tests/scripts/strained.test.ts`:
   - the grammar admits and refuses pinned texts;
   - `strainedState` bases: already, became (1 paying 3 → −2), exactly 0 is not strained,
     no-clarity, outside combat with 1d6, already strained outside combat without 1d6, and both
     overrides;
   - Mind Spike and Spirit Sword compile, and Hoarfrost, Optic Blast, Levity and Gravity and Kinetic
     Pulse stay manual without block-count noise;
   - Mind Spike does 4 → 6 at tier 1 and 8 → 10 at tier 3; Spirit Sword does 5 → 8;
   - tampering is refused.
2. `tests/app/talent-strained.test.ts` (convex-test, registered operations, persisted readback; the
   v105-2 Talent with Reason 2 against a goblin warrior with Stamina 15):
   - unstrained Mind Spike: 4 damage and no self-damage;
   - at clarity −1: 6 damage, the Talent takes 2, clarity stays −1, basis `already-strained`;
   - `strained=no` override: 4 damage;
   - a bane correction: tier 2 at 8 becomes tier 1 at 6, and the self-damage is not repeated;
   - outside combat, `strained=yes`: 1d6 then 2 to the Talent, 6 to the goblin;
   - `strained=` is refused for Kinetic Grip.
3. Both reports regenerated and checked: `node scripts/report-live-compiled-abilities.ts --check`
   and the V64 audit test (`tests/scripts/audit-ability-grammar.test.ts`).
4. TESTER: `pnpm check` and the `talent` headless journey (assertions updated, not run here).
5. Independent review, then QC1.

## Work log

- 2026-09-24: `slice/V170` in `.worktrees/strained`, cut from `slice/V159` `b5440999`.
- Flipped to fully compiled: **Mind Spike** (`feature/ability/talent/level-1/mind-spike.md`) and
  **Spirit Sword** (`.../spirit-sword.md`). The live report goes from 156 to **158** reachable
  compiled (effect-only unchanged at 8); compatibility goes from 1465 to 1463.
- The other 21 Talent Strained abilities (levels 1–3) lose the block-count, mismatch and
  unaccounted-paragraph diagnostics. They stay manual through `manual-section` on their Strained (or
  other) sections:
  - Hoarfrost: self slowed "until the end of your next turn"; slowed becomes restrained.
  - Kinetic Pulse and Gravitic Burst: burst size, which changes the targets, plus a self-condition.
  - Optic Blast: a surge usable immediately, and Reason-valued damage. Its Effect is manual too.
  - Materialize: adjacent creatures.
  - Levity and Gravity: half the damage the target takes.
  - Overwhelm: crying, no triggered actions or free strikes.
  - Entropic Bolt: a clarity gain by tier. Its Effect is manual too.
  - The rest also have manual tiers, Effects or targets.
  - Force Orbs still has an unaccounted second Effect paragraph.
- Journey dependency fixed, not run: `scripts/headless/talent.ts`.
  - Its manual-remainder match now includes each compiled effect's kind, so `strained` matches the
    compiled Strained entry.
  - Mind Spike at clarity −3 now expects the tier damage + 2 on the target and 2 off the caster
    (Stamina plus temporary Stamina).
  - No other journey names Mind Spike or Spirit Sword.
- Authoring checks run (worktree):
  - `pnpm -s lint`: pass.
  - `tsc --noEmit` and `tsc -p tsconfig.web.json --noEmit`: pass.
  - `node scripts/report-live-compiled-abilities.ts --check`: matches.
  - `vitest run` (10 files, 166 tests, `--maxWorkers=2`): pass. The files were `tests/scripts/strained`,
    `tests/app/talent-strained`, `live-compiled-report`, `audit-ability-grammar`,
    `character-v105-talent`, `character-v136-talent-three`, `character-v160-talent-resource-note`,
    `compiled-ability`, `effect-riders` and `tests/app/modifiers`.
- Committed on `slice/V170` as `3d75770`; not pushed. Next: TESTER gate, then independent review.
- 2026-09-25: QC1 train 13 **R1** (High) fixed: Strained self-damage overwrote watcher damage.
  - Cause: `ability.use` planned the user's Strained damage from its record before the use, and
    `commitStrained` wrote those absolute pools after the target damage. That damage can fire a
    `damage-dealt` watcher on the user first (Violence Will Not Aid Thee), whose damage was then
    erased while its firing record stayed.
  - Fix: `writePlannedDamage` (`convex/lib/resolve.ts`) with `reapplyDamage`
    (`shared/resolve/index.ts`). Planned damage is written against the creature's pools as they are at
    the write. The amount after weakness and immunity is the planned one, so Q-STRAIN-1 ("can't be
    reduced" skips immunity only) and weakness are unchanged. Temporary Stamina absorbs first
    (`rule/health/temporary-stamina.md`). `commitStrained` uses it for the 1d6 to incur and the
    section's own damage, and returns what was applied.
  - Record: the saved result holds the applied values: `targets[].applied`, compiled `damage`
    applications and the Strained `selfApplication`. The use's own log entry was written before the
    commit and keeps the planned values. When a write differs from the plan, a linked
    `ability.damage-reapplied` entry states the applied and planned Stamina. Everything is written
    in the use's journal scope, so undo restores the pools and the watcher's firing record together.
  - Other preplanned pool writes in the chain, inspected:
    - `ability.use` target damage: could be changed by an earlier target's watcher or an
      `ability-used` watcher. Fixed the same way.
    - The free-strike path of `ability.use`: `observeUse` runs before its damage. Fixed the same
      way.
    - The effect-only path: its temporary Stamina and surge gains were absolute values written after
      `observeUse`. They are now applied to the current values (surges add, the greater temporary
      Stamina is kept). Feedback Loop's triggered damage uses `writePlannedDamage`.
    - `squad.act` targets (`squadOperations.ts`): one target's `damage-taken` watcher can damage
      another. Fixed the same way.
    - Safe, with reasons:
      - The fixed-cost debit is the commit's first write, and it re-reads the record.
      - The squad free strike is a single write with nothing before it in its commit.
      - Squad pools: a watcher never writes one, because `recordOf` refuses squad members.
      - The clock's strain and prayer damage (`clock.ts`) and a watcher's own damage are computed
        from a fresh read just before the write.
      - A correction's write is computed at execution from current pools, and a use that set off a
        firing refuses corrections.
  - Test: `tests/app/watcher-interactions.test.ts` runs a Talent and a Conduit through registered
    operations with dice fixed. Violence Will Not Aid Thee is on the Talent, whose Mind Spike at
    clarity −1 goes 20 → 13 → 11. The test checks the saved `selfApplication`, the linked entry,
    undo and redo with the firing record, and a temporary Stamina 8 case (7 then 2: temporary 0,
    Stamina 19). The test fails without the fix: the Talent ends at 18.
