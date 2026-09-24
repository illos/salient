# V113: Compiled tier forced movement, EoT and prone conditions

Rules review: required. Depends on: V26, V72, V88, V110.

## Goal

Compile the next most common tier clauses after damage:
- pull, slide and vertical push, pull and slide instructions;
- conditions that last until the end of the target's next turn ("(EoT)");
- prone with no printed duration;
- conditions with no potency test ("prone", "taunted (EoT)");
- runs of these effects after damage, in printed order (for example "damage; push 3; M < STRONG,
  prone").

Movement stays an instruction and never executes. EoT conditions expire through the clock at the
affected creature's turn end. Prone persists until the table records Stand Up with `condition
off`. Grabbed without save ends, compound conditions and "can't stand" stay manual.

## Scope

- Grammar (`shared/resolve/abilityGrammar.ts`):
  - `tierConditionExpression`: an optional potency, one core condition, and "(save ends)",
    "(EoT)" or no duration. No duration is allowed only for prone; grabbed keeps save ends only.
  - `forcedMovementExpression`: "[vertical] push/pull/slide N".
  - V88's `conditionExpression` and the V64 audit are unchanged.
- Compiler (`compileAbility.ts`):
  - A run of supported push and condition clauses directly after the damage clause compiles in
    printed order.
  - Push nodes gain optional `movement` (pull, slide) and `vertical`. Condition nodes gain
    `duration` and an `always` threshold. Existing push and V88 nodes are byte-identical.
- Resolver (`compiledOutcome.ts`):
  - Movement-specific instructions.
  - Unconditional conditions apply to eligible creatures once damage completes.
  - The V88 potency path keeps its requirement order.
  - Structural checks cover the new shapes.
- Live state (`conditionInstances.ts`, `clock.ts`, `abilityOperations.ts`, validators):
  - Instance `duration` is save-ends, eot or none; instances also record `sourceActorId`.
  - EoT registers `end-of-next-turn` / `expire-effect` work; the new clock handler ends the
    instance at the creature's turn end.
  - A combat end unschedules EoT like save-ends.
  - No-duration conditions register nothing.
  - Taunted from a different source ends the old taunt.
- UI: the table effect list and condition-source labels show the movement kind and duration.
- Reports regenerated. Build README worktree recipe: each worktree gets its own `node_modules`.
- Excludes:
  - grabbed without save ends: the grab relationship, Escape Grab and size limits belong to a
    grab slice;
  - "X and Y (save ends)" compounds;
  - "prone and can't stand";
  - potency-gated or comma-combined movement;
  - Stand Up and other common maneuvers;
  - the "one target is …" choice clauses.

Spec references:

- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome`
- `docs/build/V26-compiled-ability-effects.md#3-persisted-results-and-clients`
- `docs/build/V88-compiled-potency-conditions.md`
- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode`

Compendium passages (pinned `en/unified/md`):

- `movement/forced-movement.md`:
  - Push X, Pull X and Slide X directions; fewer squares are always allowed; Vertical.
  - Big Versus Little: the melee weapon size bonus applies to any forced movement.
- `rule/character/stability.md`: stability reduces any forced movement.
- `rule/combat/end-of-turn.md`: EoT lasts until the end of the creature's next turn, or its
  current turn if imposed during it. The clock's `end-of-next-turn` clause fires at the first
  turn end of that creature after registration.
- `condition/prone.md`: a prone creature stands up with the Stand Up maneuver, which ends the
  condition. It has no other expiry.
- `condition/taunted.md`: a taunt from a different source replaces the old one.
- `condition/grabbed.md`: grabs involve size limits, one grab at a time and release rules, so
  they are excluded.
- `rule/dice/ability-roll.md`, "Abilities With Damage and Effects": effects follow damage in
  printed order.
- `rule/combat/target.md`: objects are immune to an ability's other effects, so unconditional
  conditions on objects stay `fact-needed`.
- `rule/character/potency.md`.

### Inventory

The regenerated V72 report moves exactly 27 envelopes from compatibility to compiled (72 → 99),
with no demotions. Each was read against its source.

| Corpus | Abilities |
| --- | --- |
| Hero (4) | Conduit Holy Lash (vertical pull) and Staggering Curse (slide); Null Magnetic Strike (vertical pull); Shadow Gasping in Pain (tier-3 I < STRONG prone; existing surge rider) |
| Kit (5) | Retiarius Net and Stab (EoT slowed/restrained); Stick and Robe Where I Want You (slide); Sword and Board Shield Bash (push; tier-3 prone); Vuken Unbalancing Attack (prone); Whirlwind Extension of My Arm (vertical pull) |
| Foe (18) | Predator A and B Natural Weapon; Fangling Tumbling Gore; Brambleguard Whip Frenzy; Ceramic Horse Elemental Charge; Shadow Elf Knightfell Suffusing Strike; Fire Giant Lightbearer Flamelash; Hobgoblin Firerunner Flaming Kick; Kobold Legionary Shield Bash; Orc Chainlock Heavy Crossbolt; Rival Elementalist The Writhing Green; Rival Talent (1st and 2nd echelon) Reverberating Blast and Overwhelming Rend; Servok War Engine Blade Rake; War Dog Neuronite Synlirii Grafts; Xorannox Demolition Explosion, Mover Eye Telekinetic Beam and Xorannox Toothful Thrashing |

No release-gate roster foe gains here. Their tier clauses are mostly grabbed, rage, "one target"
choices, compounds, or prose Effects.

### Engine ability design and playtest evidence

| Ability | Source | Expected (source plus characteristic or kit) | Proof |
| --- | --- | --- | --- |
| Holy Lash | `conduit/level-1/holy-lash.md` | 3/5/8 + I (I 2) + 1 Prayer of Destruction (magic) → 6/8/11 holy; vertical pull 2/3/4 | headless `tier-effects`; pure |
| Staggering Curse | `conduit/level-1/staggering-curse.md` | 6/8/11 holy (with Prayer of Destruction); slide 1/2/3 | headless |
| Magnetic Strike | `null/level-1/magnetic-strike.md` | 5/8/11 + A (A 2 → 7/10/13) psychic; vertical pull 1/2/3 | headless |
| Unbalancing Attack | `kit/vuken.md` | 4/7/9 + M (6/9/11); A < WEAK/AVERAGE/STRONG prone (no duration) | headless |
| Net and Stab | `kit/retiarius.md` | 4/6/8 + M or A (6/8/10); slowed/restrained (EoT) expiring at the target's own turn end | headless; pure |
| Heavy Crossbolt | `monster/orc/statblock/orc-chainlock.md` | tier 3: 9; unconditional prone; A < 2 slowed (save ends) | pure |
| Tumbling Gore | `monster/demon/2nd-echelon/statblock/fangling.md` | damage; pull 1; bleeding in printed order | pure |
| Suffusing Strike, Shield Bash (kobold) | knightfell, kobold legionary | taunt replacement; EoT expiry at Thorn's turn end; prone persists; history | app test |

## Acceptance checks

1. `tests/scripts/tier-effects.test.ts`:
   - Grammar admits and rejects forms as specified.
   - Net and Stab: EoT applies below the AVERAGE potency and is resisted at it; damage is 8.
   - Heavy Crossbolt: unconditional prone applies to a creature and stays `fact-needed` on an
     object.
   - Tumbling Gore: printed order.
   - Holy Lash: vertical pull instruction fields.
   - Tampered durations and movement fall back to manual.
2. `tests/scripts/compiled-ability.test.ts`: the V88 unsafe-remainder list now asserts the V113
   boundary (grabbed, grabbed EoT, bare slowed, "can't stand", compounds, trailing prose,
   comma-joined and potency-gated movement).
3. `tests/app/tier-effects.test.ts` (convex-test, registered operations):
   - Suffusing Strike taunt from a second knightfell ends the first taunt.
   - The EoT registration exists and the instance ends at Thorn's turn end.
   - Shield Bash prone has no registration and persists; history rewind and redo restore both.
   - `condition off` ends prone.
4. `tests/scripts/live-compiled-report.test.ts` names the 27 additions. `pnpm compiled:check` and
   the V67 report are fresh.
5. TESTER: `CI=true pnpm check`, plus the isolated public API journey
   `SALIENT_HEADLESS_COHORT=tier-effects node scripts/verify-character-headless.ts`. The journey
   uses legal builds and real dice, and checks:
   - movement instructions per tier for three hero abilities;
   - Vuken prone with no registration;
   - Net and Stab EoT expiring at the target's own turn end;
   - prone outlasting the turn and ended by `condition off`.

   Regression cohorts: `multi-target` and `effect-riders`.
6. An independent rules and implementation review passes before deployment.

## Work log

- 2026-09-24: ENGINE2 cut `slice/V113` at `344a7d7` in `.worktrees/engine-tier-effects` with its
  own `node_modules`.
- While freeing disk after V110, the removed V110 worktree left the main checkout's
  `node_modules` with 45 dangling links. An earlier pnpm run through that worktree's symlinked
  `node_modules` had relinked main through it. Repaired in place: links, 12 bin scripts and pnpm
  state now point at main. Announced on Chords (1725). The README recipe now uses an offline
  per-worktree install.
- Authoring checks:
  - scripts project 235/235;
  - app tests: V113 1/1, plus 36/36 across potency-conditions, multi-target, compiled-effects,
    compiled-source and condition-instances;
  - engine and web `tsc` clean, eslint clean on changed files, and `compiled:check` fresh.

  The full suite and headless journeys are TESTER's.
- TESTER (thread b3e18797) job `test-V113-285813f-1`:
  - `pnpm check` exit 0 in 216 s (402 engine, 651 app).
  - `multi-target` and `effect-riders` exit 0.
  - `tier-effects` failed at the legal-build assertion. The fixture paired the stormwight-only Vuken
    kit with a Berserker (Q-R-103; `feature/fury/level-1/beast-shape.md`). Fixed at `d748e47` with
    the Stormwight witness.
- Independent review ([audit](audits/V113-rules-review.md)): changes required, R1–R3.
  - R1: EoT on a creature in a shared squad turn (an attached captain) never came due. The
    `end-of-next-turn` clause now also matches turn participants, like `creature-turn`
    (`rule/monster/captain.md`).
  - R2: the Vuken fixture, fixed at `d748e47`.
  - R3: correcting a use whose taunt replaced another source's taunt left the old taunt ended. The
    replaced instance now records `replacedBy`, and the correction is refused with "rewind the use
    instead". Rewinding restores it through the journal.
  - Non-blocking fixes:
    - The movement label follows its kind.
    - Prone shows "until Stand Up".
    - The README recipe `cd` is explicit.
    - The STATUS row order is fixed.
  - Remaining observations (manual/unknown-source taunts, objects receiving movement instructions,
    the unused `imposedDuringTurnId`) are recorded in the audit.
- TESTER `test-V113-d748e47-2`: `tier-effects` failed. Holy Lash rolled 6/8/11. The engine was
  right: the Conduit witness's Prayer of Destruction adds +1 rolled damage to magic abilities
  (`feature/conduit/level-1/prayer-of-destruction.md`), and both conduit abilities are Magic.
  The journey's expected values are corrected.
- Review R1–R3 closed: PASS at `38a43f7`. TESTER `test-V113-38a43f7-3`:
  - `pnpm check` exit 0 in 212 s (402 engine, 652 app).
  - `multi-target` and `effect-riders` PASS.
  - `tier-effects` passed every movement and prone check, then failed at `combat.roll`. The
    heroes-only campaign takes the adjudication path, where the Director picks the first side with
    no roll due, so the call was removed.
- TESTER `test-V113-1fe1091-4` PASS: `tier-effects` exit 0 in 12 s. The run covered movement
  instructions, prone with no registration, Net and Stab EoT expiring at the target's own turn
  end, and ending prone with `condition off`. The `38a43f7` full gate (212 s, 402 engine and 652
  app tests) and the `multi-target` and `effect-riders` passes carry over (docs and journey-only
  delta). Artifacts: `/srv/presidium/projects/salient/test-artifacts/V113-1fe1091`. Ready for
  integration.

## Publication: 2026-09-24

The test and deploy thread fast-forwarded reviewed `bd6e8e4` into main and published the backend
and frontend using the DEPLOY2 hosted procedure. Backend and schema validation, the hosted build
and the upload all succeeded. Worker: `5d0f8637-0103-430d-b260-6b29072da6c2`. Content remains the 1654-entry snapshot, so no
reseed was needed. The accepted gates were reused, with no smoke test or rerun. Temporary
credentials were removed and the private hosted helpers stopped. Release logs:
`/srv/presidium/projects/salient/test-artifacts/V113-release-bd6e8e4`.
