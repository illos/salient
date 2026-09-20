# V88: Compiled potency conditions with automatic save ends

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Engine implementer (Astra ENGINE thread) with independent implementation and rules reviewers; Fable ENGINE2 thread owns assignment, verification and integration |
| Rules review | required |
| Depends on | V26 design, V64 audit, V67 pure compiler, V72 live compiled effects, R05 clock and conditions, V02 squads (boundary only) |
| Unblocks | slide/pull tier remainders, highest-characteristic roll variant (later engine slices) |
| Status | see `STATUS.md` |

## Goal

Execute the bounded post-damage potency remainder that V26 only recognized: after a compiled
damage tier, `<C> < <value>, <condition> (save ends)` evaluates the target's characteristic against
the potency value, applies the named core condition as a source-linked condition instance when the
target fails to resist, schedules its saving throw at the end of each of that creature's turns, rolls
that save automatically through the shared dice stream, and ends the instance on a success. The
boundary is the V26 single-target compiled envelope with exactly one such clause after the damage
clause. Every other remainder shape, every non-save-ends duration, every potency adjustment and every
hero-token follow-up stays explicitly manual, exactly as today.

This is the second step of the engine sequence recorded after V64 (Brutal Slam compiled path, then
the potency-condition tier remainder, then slide/pull, then highest-characteristic rolls). It is not a
general condition engine and it does not automate any condition's consequences.

## Spec references

- `docs/build/V26-compiled-ability-effects.md#1-source-to-compiled-definition` — envelope
  eligibility, node families, occurrence identity, the bounded potency remainder syntax that V88
  promotes from Unsupported to a Condition node, and the legacy-compatibility boundary.
- `docs/build/V26-compiled-ability-effects.md#2-definition-to-outcome` — pure outcome evaluation
  before persistence; missing facts are explicit.
- `docs/build/V26-compiled-ability-effects.md#3-persisted-results-and-clients` — persisted results,
  occurrence-addressed dispositions, restoration without replay, audience boundaries.
- `docs/table-spec.md#game-clock-and-scheduled-rules-work` — automatic save-ends resolution for
  supported timed effects (confirmed), save phase last, failed-save follow-up deferred.
- `docs/table-command-spec.md#clock-driven-operations` — due saves fire automatically and log
  their outcomes; no Roll card.
- `docs/conditions-and-clock.md#2-clock-contract` — boundaries, order of due work, producers.
- `docs/table-spec.md#v001-manual-condition-tracking` — the manual toggles V88 must keep working.
- `docs/build/README.md#engine-ability-design-and-playtest-evidence` — per-ability gate.
- `docs/build/README.md#programmatic-headless-completion-gate` — headless proof before any
  browser work; browser scenarios go to the backlog under the moratorium.

## In scope

- **Grammar.** In `shared/resolve/abilityGrammar.ts`, widen the bounded remainder from
  `bleeding|slowed (save ends)` to any of the nine core condition ids followed by `(save ends)`,
  still only as the second clause of a tier whose first clause is a compiled damage expression and
  only when nothing follows it. Threshold is a signed integer or `WEAK`/`AVERAGE`/`STRONG`.
  Regenerate the V64 audit report and update its tests; the audit's "bounded" column now means the
  V88 shape. The classification of every other clause must not change (byte-compare the rest).
- **Compiler node.** Add a `condition` node family to `shared/resolve/compileAbility.ts`:
  characteristic letter, threshold (`{ kind: 'printed', value }` or `{ kind: 'potency', tier: 'weak' | 'average' | 'strong' }`),
  condition id, duration `save-ends`, and `after` binding to the damage node, with the same source
  locator, ordinal and verbatim clause as any other node. Clauses that match the shape but sit in
  any other position, or carry anything after `(save ends)`, remain Unsupported with the existing
  `unsafe-tier-remainder` diagnostic.
- **Pure outcome.** Add `CompiledConditionOutcome` to `shared/resolve/compiledOutcome.ts` with
  status `applied`, `resisted`, `fact-needed` or `manual`; the resolved threshold and where it came
  from; the target's score when known; the condition; the duration; and the requirements that were
  missing. Inputs extend `CompiledAbilityInput` with per-target characteristic scores and, for hero
  actors, the evaluated potency values and named potency characteristic (Q-CHAR-12). The rule is the
  pinned text: the effect applies only when the target's score is less than the potency value.
  Unknown score (objects, squads, anything without evaluated characteristics) is `fact-needed`,
  never a guess.
- **Live application through existing operations.** `ability.use` persists the condition
  occurrence in the saved `CompiledResult` like any other effect. When the status is `applied`, in
  the same mutation: record a condition instance on the target's live state (id = occurrence id;
  condition; duration; source use event, ability name and actor label), set the existing toggle for
  that condition on, register clock work `{ kind: 'saving-throw', effectInstanceId, creatureId }`
  with timing `{ scope: 'creature-turn', boundary: 'turn-end', creatureId, occurrence: 'each' }`
  when a committed encounter exists, and append the log entry. Outside a committed encounter the
  instance is recorded with no registration and the log says the save is unscheduled.
- **Automatic saving throw.** Replace the Q-TS-1 stub for `saving-throw` work in
  `convex/lib/clock.ts` with the V1 producer for ability-sourced instances: draw one d10 from the
  campaign dice stream (`convex/lib/dice.ts`), record the die on the clock event, end the instance on
  6 or higher (retire the registration; turn the toggle off unless a manual toggle or another instance
  of the same condition remains), keep it on a lower roll, and describe both outcomes in the log with
  the instance's source. The failed-save hero-token follow-up stays manual and is named as such in the
  failure line; no token pool exists.
- **Manual controls stay coherent.** `condition.off` on a creature with active instances of that
  condition ends those instances and retires their registrations, logging which sources ended.
  `condition.on` remains a manual toggle and is not confused with an instance.
- **Corrections and dispositions.** `ability.correct` re-evaluates the condition occurrence with the
  original persisted facts and thresholds (a tier change may change the threshold; the original
  printed thresholds are never rewritten). If the status flips, end or create the instance and its
  registration accordingly and log it. If a save has already been rolled for the instance, refuse the
  correction with an explicit reason: recorded outcomes are never replayed. `ability.resolved`
  dispositions apply only to `fact-needed` and `manual` condition occurrences.
- **Reads and rendering.** Public readback (`abilities` queries, hero and foe sheets, history
  reads) exposes the condition occurrence and each live condition instance with its source label and
  duration. `web/table/targeting.tsx` renders the condition line beside damage and push with the
  verbatim clause, the outcome and, in the audience allowed to see it, the score used. The hero and
  foe sheets list instance sources under the existing condition indicator. No rules logic in
  components.
- **Audience.** Follow the pinned "Potency Presentation": every audience sees the printed
  inequality and whether the condition applied; the target's actual characteristic score appears
  only for the Director and for the target hero's own controller. A foe target's score never enters
  the public result.
- **Reports.** Regenerate `docs/build/evidence/V72/support.*` through the existing report scripts
  so Bury the Point shows its remainder as compiled and Eye of Surlach moves from
  legacy-compatibility to compiled; add any newly compiled-but-unreachable library entries to the
  unavailable count. The V64 audit report and both report tests are updated in the same slice.

## Out of scope

- Non-save-ends potency effects (`M < 1 prone`, `A < 2 grabbed`, `(EoT)`), compound effects
  (`prone and can't stand (save ends)`), potency followed by anything else, and potency clauses in
  tiers with more than two clauses. They keep today's Unsupported node and manual disposition.
- Executing any condition's consequences (bleeding Stamina loss, bane on weakened, speed for slowed,
  dazed action limits). The existing engine refusals and manual handling stand.
- Potency adjustments (Null Field, Judgment), End Effect (monster trait), the hero-token spend after
  a failed save, and any Malice or resource behavior beyond what V72 already pays.
- Multi-target and area envelopes, squads and minions as targets, objects as targets. These are
  `fact-needed` or compatibility paths and must say so.
- New grants, foe loading or wizard changes. Reachability comes only from what V02 already loads;
  V87 library seeding widens it later without changes here.
- Any browser or Playwright run (moratorium). Log would-be visual scenarios in
  `docs/build/browser-coverage-backlog.md`.

## Inputs and dependencies

- Main after V72 `dbfb61d` and V02 `c1b52cb` (foe loading covers the goblin and dwarf families).
- The clock's `saving-throw` work kind and save phase already exist (`shared/contracts/clock.ts`,
  `convex/lib/clock.ts`); nothing registers one today.
- Character evaluation already derives `potencyCharacteristic` and `potency.{weak,average,strong}`
  (`shared/evaluate/classes/profile.ts`); foe characteristics come from `foeCharacteristics` in
  `convex/lib/resolve.ts`.
- Testing goes through TESTER (`testing-process.md`); the implementer runs authoring checks only
  (tsc, eslint, prettier, the single test files being edited) and submits every gate as a job.

## Deliverables

- `shared/resolve/abilityGrammar.ts`, `shared/resolve/compileAbility.ts`,
  `shared/resolve/compiledOutcome.ts`, `shared/contracts/compiledResult.ts` (additive),
  `shared/contracts/liveState.ts` (additive condition instances on hero and foe live state).
- `convex/lib/abilityOperations.ts` (use, correct, resolved), `convex/lib/clock.ts` (saving-throw
  handler), `convex/lib/tableOperations.ts` (condition.off ends instances), `convex/schema.ts`
  (additive optional fields only), audience-filtered reads.
- `web/table/targeting.tsx` condition line; hero and foe sheet instance sources.
- Tests: pure grammar/compiler/outcome cases with source-derived expected values and
  counterexamples for every out-of-scope shape; persisted `tests/app` cases for application, save
  success, save failure, undo/redo of a turn end that rolled a save, `condition.off` ending an
  instance, correction flip and correction refusal after a save; report freshness tests.
- Headless proof runner `scripts/v88-headless.ts` in the style of `scripts/v72-headless-main.ts`
  (real auth, registered operations, campaign dice, persisted readback, explicit target guard).
- Regenerated `docs/build/evidence/V26/coverage-audit-2026-09-20/` and
  `docs/build/evidence/V72/support.*`; evidence under `docs/build/evidence/V88/`.
- Independent implementation review and pinned-source rules review under `docs/build/reviews/`.

## Acceptance checks

1. **Grammar and audit.** `pnpm audit:abilities` regenerates byte-identically twice; the only
   classification changes versus the committed report are potency-condition remainders whose shape is
   damage then `<C> < <value>, <condition> (save ends)` moving into the bounded column. A test lists
   the exact set of newly bounded shapes and asserts every other row is unchanged.
2. **Pure Bury the Point.** Compiling the Goblin Warrior's Bury the Point yields damage then a
   condition node per tier with thresholds 0, 1 and 2 (printed), condition `bleeding`, duration
   `save-ends`. Outcome against Might 2 is `resisted` at every tier. Against Might 0 it is
   `resisted` at tier 1 (0 is not less than 0) and `applied` at tiers 2 and 3 (0 < 1, 0 < 2).
   Against Might −1 it is `applied` at every tier. Write the expected table from the source, then
   run. Unknown score gives `fact-needed` with the missing requirement named.
3. **Pure hero symbolic potency.** Ray of Agonizing Self-Reflection with an Elementalist actor of
   Reason 2 resolves thresholds 0/1/2 from weak/average/strong (Q-CHAR-12 named characteristic, not
   the highest score); a fixture with Intuition 3 and Reason 2 still resolves 0/1/2. Compile-only:
   no live claim.
4. **Counterexamples.** `M < 1 prone`, `A < 2 grabbed`, `R < 1 slowed (EoT)`,
   `A < STRONG, prone and can't stand (save ends)`, a potency clause as the third clause, and a
   potency clause with trailing text all stay Unsupported with `unsafe-tier-remainder`.
5. **Live application.** Through the public CLI against a real backend: a Goblin Warrior uses Bury
   the Point on a hero whose evaluated Might makes the selected tier apply. Readback shows the
   condition occurrence `applied`, a condition instance on the hero with the use event as source,
   the `bleeding` toggle on, an active `saving-throw` registration bound to the hero, and a log entry
   whose public form shows the inequality and outcome without the foe's private facts.
6. **Live resist.** The same ability on a hero whose Might resists: occurrence `resisted`, no
   instance, toggle unchanged, no registration, log states resisted; the hero's score is visible to
   the Director and to that hero's controller only.
7. **Automatic save.** Ending the affected hero's turn rolls one d10 from the campaign stream and
   logs it. With a die of 6 or more the instance ends, the registration retires and the toggle is
   off; with 5 or less the instance and registration remain and the failure line names the manual
   hero-token follow-up. Both branches are proven with disclosed dice-stream positioning in
   `tests/app` and at least one branch with real dice in the headless proof.
8. **Undo and redo.** Undoing the turn end restores the instance, registration and toggle exactly;
   redo reapplies the recorded save without a new roll.
9. **Manual coherence.** `condition.off bleeding` on a hero with an active instance ends the
   instance, retires the registration and logs the ended source; a manual `condition.on` set before
   the instance survives a successful save (toggle stays on, instance gone).
10. **Correction.** A player correction that moves Bury the Point from a resisted tier to an applied
    tier creates the instance and registration and logs it; the reverse ends them. After a save has
    been rolled for the instance, the correction is refused with the recorded reason and nothing
    changes.
11. **Eye of Surlach.** The Goblin Cursespitter's Eye of Surlach (`I < N weakened (save ends)`)
    leaves legacy compatibility only by being added to the inventory below with its own design and
    live cases; its cost and all three tiers come from the source, and its applied and resisted
    branches are proven live.
12. **Regression.** The V72 proof runners (`scripts/v72-headless.ts` isolated and
    `scripts/v72-headless-main.ts` occurrence-aware linked corrections) still pass unchanged; the six
    V72 compiled abilities produce identical damage and push results; manual toggles, R05 condition
    tests and the Malice lifecycle are unchanged.
13. **Reports.** `pnpm check` passes including report freshness; the V72 support report shows
    Bury the Point and Eye of Surlach compiled with no diagnostics and the library-wide bounded
    potency abilities as compiled-but-unavailable until V87 seeds them.

## Ability design and playtest evidence

Follow the [per-ability gate](README.md#engine-ability-design-and-playtest-evidence). Source revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. Expected values are derived from the source before running
the code. Screenshots are replaced by CLI readback under the moratorium; browser scenarios go to the
backlog. Per-ability designs live in this file's appendix below and are extended by the implementer.

| Ability | Source | Designed | Built | Headless playtested | Evidence |
| --- | --- | --- | --- | --- | --- |
| Bury the Point (Goblin Warrior) | `monster/goblin/statblock/goblin-warrior.md`, Bury the Point | Cases BP6–BP10 below | pending | pending | pending |
| Eye of Surlach (Goblin Cursespitter) | `monster/goblin/statblock/goblin-cursespitter.md`, Eye of Surlach | pending (implementer, same shape as BP6–BP10) | pending | pending | pending |
| Ray of Agonizing Self-Reflection (Elementalist) | `feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md` | Case RAY1 below (compile-only) | pending | not reachable (no grant) | pending |
| Shadow Chains (Goblin Assassin) | `monster/goblin/statblock/goblin-assassin.md` | Compatibility only: three creatures | unchanged | unchanged | regression proof |
| Brutal Slam, Viscous Fire, Melee and Ranged Weapon Free Strike, Spear Charge | V26 designs | unchanged | unchanged | V72 runners rerun | regression proof |

### Bury the Point, V88 cases

Source: Goblin Warrior, Bury the Point, 2 Malice, melee 1, one creature, Power Roll +2:
tier 1 `5 damage; M < 0 bleeding (save ends)`, tier 2 `6 damage; M < 1 bleeding (save ends)`,
tier 3 `7 damage; M < 2 bleeding (save ends)`. Damage precedes the potency effect (Ability Roll,
damage before effects). Potency applies only if the target's Might is less than the printed value.
Saving throw: d10 at the end of each of the target's turns, 6 or higher ends the effect.

| Case | Inputs | Expected calculation and saved state |
| --- | --- | --- |
| BP6 **live** | G → H (Might 2); Malice 2; tier 2 | Damage 6 applied; `2 < 1` false: resisted; no instance, no registration; log shows inequality and "resisted"; H's score visible only to Director and H's controller. |
| BP7 **live** | G → E (an evaluated hero whose Might is below the selected tier's value); Malice 2 | Damage per tier; inequality true: bleeding instance on E with source G/Bury the Point, toggle on, `saving-throw` registration at each of E's turn ends. |
| BP8 **live continuation of BP7** | E's End turn | One d10 drawn from the campaign stream and logged. ≥ 6: instance ends, registration retired, toggle off. ≤ 5: instance stays; failure line names the manual hero-token follow-up. Undo restores exactly; redo reapplies the recorded die. |
| BP9 | Player correction of BP6 to tier 3 (`M < 2`) with Might 2 | Still resisted (2 is not less than 2); no instance. Correction of BP7 to a resisting tier ends the instance and retires the registration. |
| BP10 | Correction of BP7 after BP8 rolled a save | Refused with the recorded reason; instance, registration, toggle and log unchanged. |

Legacy manual dispositions never apply to BP6 or BP7 occurrences; `ability.resolved` on them is refused.

### Ray of Agonizing Self-Reflection, compile-only case

Source: tiers `2 + R corruption damage; R < WEAK, slowed (save ends)`, `4 + R ...; R < AVERAGE ...`,
`6 + R ...; R < STRONG ...`; ranged 10; one creature or object. Elementalist potency characteristic is
Reason (class Basics; Q-CHAR-12).

| Case | Inputs | Expected |
| --- | --- | --- |
| RAY1 | Actor Reason 2 (potencies 0/1/2), target Reason 1, accepted dice giving tier 2 | Damage 4 + 2 = 6 corruption; threshold `average` = 1; `1 < 1` false: resisted. Tier 3 against the same target: threshold 2, applied. Target Reason unknown: `fact-needed`. |

## Rules research

Read first, all under `vendor/steel-compendium/en/unified/md/`:

- `rule/character/potency.md` — applies only if the potency value is higher than the target's
  characteristic score; weak/average/strong are highest-characteristic −2/−1/0 as written, with the
  class-named basis resolved by Q-CHAR-12 (`docs/rules-questions-for-user.md#q-char-12`); "Potency
  Presentation" grounds the audience rule; "Adjusting Potencies" and "Spending Resources on
  Potencies" are out of scope and must be named as manual.
- `rule/general/saving-throw.md` — d10 at the end of each of the affected creature's turns, 6 or
  higher ends the effect.
- `rule/dice/ability-roll.md` — damage to all targets before tier effects.
- `condition/*.md` (nine entries) — verbatim texts already in `shared/content/core-conditions.json`;
  V88 applies the condition and does not execute its text.
- `rule/combat/end-of-turn.md` — `(EoT)` is a different duration and stays out of scope.
- `rule/monster/end-effect.md` and `rule/resource/hero-token.md` — named manual follow-ups.

Rulings already recorded in `docs/gameplay-decision-record.md`: automatic saving throws at the
creature's turn end for supported timed effects (2026-09-12, confirmed in `docs/table-spec.md`
2818 area), standing save-phase eligibility, save phase last in enqueue order, immediate automatic
resolution without waiting for a token decision, redo preserves dice. Q-TS-1 restricted v0.01 only
and does not apply to a source-backed supported operation that supplies its save timing.

## Open questions

None. A creature slain by the same use still receives the evaluated occurrence and instance (the
source states no exception); the Director removes the foe as today. Instances survive combat end with
their registrations retired and the log stating the save is no longer scheduled; this is an
engineering boundary, not a rule claim, and manual removal remains available.

## Work log

### 2026-09-20 — Registered and assigned

Registered by the Fable ENGINE2 thread as the next engine slice after V72. Assigned to the Astra
ENGINE thread (Chords `2b1ba081-4040-4665-9ea2-22364db707f4`) for implementation on
`slice/V88` in `.worktrees/engine-potency` from current main. Fable verifies independently and owns
integration and the shared-main update. All gate runs go to TESTER; browser testing remains paused.
