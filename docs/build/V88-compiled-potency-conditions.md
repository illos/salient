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
  campaign dice stream (`convex/lib/dice.ts`), record the die on the clock event, end the instance
  when the die meets the creature's saving-throw threshold (retire the registration; turn the toggle
  off unless a manual toggle or another instance of the same condition remains), keep it on a lower
  roll, and describe both outcomes in the log with the instance's source. The threshold is the printed
  6 for foes and for any creature without an evaluated build; for an admitted hero it is the already
  evaluated `DerivedBaseline.savingThrowThreshold` (default 6, lowered by evaluated traits such as
  Otherworldly Grace with their recorded provenance). Record the threshold used and its source on the
  clock outcome. No new trait parsing, no foe trait automation. The failed-save hero-token follow-up
  stays manual and is named as such in the failure line; no token pool exists.
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
- New grants, foe loading or wizard changes. Reachability comes from existing V02/V87 loading. The seeded-inventory addendum proves
  four newly reachable bounded abilities without changing those loading paths.
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
   logs it with the threshold used and its source. With a die at or above the threshold the instance
   ends, the registration retires and the toggle is off; below it the instance and registration
   remain and the failure line names the manual hero-token follow-up. Both branches are proven with
   disclosed dice-stream positioning in `tests/app` and at least one branch with real dice in the
   headless proof. A pure or persisted case with an evaluated hero whose threshold is 5 shows a die
   of 5 succeeding for that hero and failing for a foe at the printed 6; the source of each threshold
   is read back.
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
12. **Regression.** `scripts/v72-headless-main.ts` (Brutal Slam linked corrections) passes
    unchanged. `scripts/v72-headless.ts` keeps every damage, push, cost, blocking, permission,
    correction-identity and history assertion unchanged, and only its Bury the Point remainder
    assertions change, because V88 changes that behavior by design: the BP2 occurrence is
    `condition` with status `resisted` (H has Might 2, `M < 1`), the corrected occurrence keeps a
    distinct id and reads `M < 0` still `resisted`, and `ability.resolved` on it is refused before
    and after `/history rewind` with the roster unchanged. The historical BP5 disposition case is
    superseded, not deleted from Git history. The six V72 compiled abilities produce identical damage
    and push results; manual toggles, R05 condition tests and the Malice lifecycle are unchanged.
    Record the adapted assertions in the V88 evidence; the V72 evidence stays historical.
13. **Reports.** `pnpm check` passes including report freshness; the V72 support report shows
    Bury the Point and Eye of Surlach compiled with no diagnostics. On a post-V87 integration, the
    newly reachable library-wide bounded potency abilities also require their source-backed live
    proof gate before promotion.

## Ability design and playtest evidence

Follow the [per-ability gate](README.md#engine-ability-design-and-playtest-evidence). Source revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. Expected values are derived from the source before running
the code. Screenshots are replaced by CLI readback under the moratorium; browser scenarios go to the
backlog. Per-ability designs live in this file's appendix below and are extended by the implementer.

| Ability | Source | Designed | Built | Headless playtested | Evidence |
| --- | --- | --- | --- | --- | --- |
| Bury the Point (Goblin Warrior) | `monster/goblin/statblock/goblin-warrior.md`, Bury the Point | Cases BP6–BP10 below | yes | passed at `1af9c75` | [V88 live certificate](evidence/V88/tester-job-1af9c75-headless.md) |
| Eye of Surlach (Goblin Cursespitter) | `monster/goblin/statblock/goblin-cursespitter.md`, Eye of Surlach | Source design and EYE1–EYE3 | yes | passed at `1af9c75` | [V88 live certificate](evidence/V88/tester-job-1af9c75-headless.md) |
| Ray of Agonizing Self-Reflection (Elementalist) | `feature/ability/elementalist/level-1/ray-of-agonizing-self-reflection.md` | Case RAY1 below (compile-only) | pure compiler verified | not reachable (no grant) | [Full gate](evidence/V88/tester-job-1af9c75.md) |
| The Wode Defends (Wode Elf ancestry, V82 grant) | `feature/ability/wode-elf/the-wode-defends.md` | Cases WD1–WD3 below | yes | passed at `1af9c75` | [V88 live certificate](evidence/V88/tester-job-1af9c75-headless.md) |
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
| BP8 **live continuation of BP7** | E's End turn | One d10 drawn from the campaign stream and logged with evaluated threshold/source. Die ≥ threshold: instance ends, registration retired, toggle off. Die < threshold: instance stays; failure line names the manual hero-token follow-up. Undo restores exactly; redo reapplies the recorded die. |
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

### The Wode Defends, live symbolic potency cases

Source: Wode Elf ancestry ability, main action, Magic/Ranged/Strike, ranged 10, one creature,
Power Roll + Might or Agility: tier 1 `2 + M or A damage; A < WEAK, slowed (save ends)`, tier 2
`3 + M or A damage; A < AVERAGE, slowed (save ends)`, tier 3
`5 + M or A damage; A < STRONG, restrained (save ends)`. The roll and damage characteristic choice
is the existing free-strike-style independent choice. The potency values are the hero's class-named
potency characteristic (`rule/character/potency.md`; Q-CHAR-12), not the rolled Might or Agility.
The target resists with Agility. Tier 3 applies a different condition from tiers 1 and 2; each tier
carries its own node.

| Case | Inputs | Expected |
| --- | --- | --- |
| WD1 **live** | A Wode Elf hero W with an evaluated build (record its class, potency characteristic score and potencies weak/average/strong); target foe with printed Agility that resists the selected tier | Damage per the chosen characteristic; threshold shown as the resolved number with its symbolic origin; `resisted`; no instance; the foe's Agility appears only in the Director audience. |
| WD2 **live** | Same hero against a foe whose printed Agility is below the selected tier's value | Instance applied (`slowed` at tiers 1–2, `restrained` at tier 3) with source W/The Wode Defends, toggle on, `saving-throw` registration at each of the foe's turn ends; the foe's End turn rolls the save from the campaign stream. |
| WD3 | Pure: potencies derived from the class-named characteristic when another characteristic is higher; Agility-based potency letter unaffected by the Might/Agility roll choice | Thresholds equal weak/average/strong of the class-named score; changing the roll characteristic does not change the threshold. |

The implementer derives the concrete hero and foe scores from the fixture's evaluated build and a
seeded stat block before running, records them in the design, and uses no name-based special case.

### V87 seeded-inventory addendum

DEPLOY integration `c721d0b` makes four previously compile-only abilities reachable. Their
production behavior already follows the reviewed structural compiler; the addendum adds proof,
not new mechanics. [Detailed fixtures/cases](evidence/V88/seeded-inventory-design.md) derive expected
values from the same pinned source. All four are signature main actions, one creature or object,
no printed Malice cost. V88 automates ordinary creatures only; condition consequences stay manual.

| Ability | Exact source below unified `md/` | Designed | Built | Headless playtested | Evidence |
| --- | --- | --- | --- | --- | --- |
| Bola Knock | `monster/lizardfolk/statblock/lizardfolk-bloodeye.md` | BK1–BK3 | yes, V87 reachable | passed at `21ec7ca` | [Design](evidence/V88/seeded-inventory-design.md); [live proof](evidence/V88/tester-job-21ec7ca-seeded-headless.md) |
| Eye Flash | `monster/hobgoblin/statblock/hobgoblin-redglare.md` | EF1–EF3 | yes, V87 reachable | passed at `21ec7ca` | [Design](evidence/V88/seeded-inventory-design.md); [live proof](evidence/V88/tester-job-21ec7ca-seeded-headless.md) |
| Power Chord | `monster/orc/statblock/orc-godcaller.md` | PC1–PC3 | yes, V87 reachable | passed at `21ec7ca` | [Design](evidence/V88/seeded-inventory-design.md); [live proof](evidence/V88/tester-job-21ec7ca-seeded-headless.md) |
| Razor Claws | `monster/undead/1st-echelon/statblock/ghoul.md` | RC1–RC3 | yes, V87 reachable | passed at `21ec7ca` | [Design](evidence/V88/seeded-inventory-design.md); [live proof](evidence/V88/tester-job-21ec7ca-seeded-headless.md) |

Bola Knock rolls +2 at ranged 5 (Ranged/Strike/Weapon): tier damage 5/7/9, then
`A < 0/1/2 restrained (save ends)`. Agility 0 resists tier 1 and is affected at tiers 2/3;
Agility 2 resists every tier, including equality at tier 3.

Eye Flash rolls +3 at ranged 10 (Magic/Ranged/Strike): 9/14/17 corruption damage, then
`P < 1 slowed`, `P < 2 restrained`, `P < 3 restrained`, all save ends. Presence 0 is affected
at every tier; Presence 2 resists tier 2 by equality. A correction between tiers 1 and 2/3
replaces slowed with restrained or vice versa, rather than retaining both source conditions.

Power Chord rolls +2 at melee 1 or ranged 10 (Magic/Melee/Ranged/Strike): 5/7/9 sonic damage.
Only tier 3 adds `P < 2 weakened (save ends)`: Presence 0 is affected and Presence 2 resists.
Tiers 1/2 have no condition node; a correction down from tier 3 retires its condition/schedule.

Razor Claws rolls +2 at melee 1 (Charge/Melee/Strike/Weapon): 3/4/5 damage. Only tier 3 adds
`M < 2 bleeding (save ends)`: Might 0 or 1 is affected and Might 2 resists. Tiers 1/2 have no
condition node. Ghoul Leap/Arise/Hunger and the other parent stat blocks' distinct traits/abilities
retain their own manual/compatibility boundaries; none is newly granted or automated here.

### Audit corpus drift

The committed V64 audit was generated before the V82 ancestry content landed, so the corpus differs
from current content. V88 compares the current baseline grammar against the changed grammar on the
same current corpus and records the earlier content drift separately in the evidence, so the "only
bounded potency rows moved" claim in check 1 is made against a like-for-like corpus. The stricter
second-and-last-clause rule also demotes clauses the V26 audit labeled bounded although a third
clause followed them; list those demotions beside the promotions in the evidence. Correct labeling
wins over preserving an unsafe baseline label, and a demoted clause stays Unsupported at runtime.

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

### 2026-09-20 — Acceptance check 12 clarified

Astra ENGINE reported (Chords 854) that `scripts/v72-headless.ts` asserts the Bury the Point
remainder as `unsupported` and disposes it (BP5), which V88 changes by design. Check 12 now says
so: the main runner stays unchanged; the isolated runner keeps every other assertion and adapts only
the Bury the Point remainder/disposition assertions to `condition`/`resisted` plus refused
disposition. Confirmed by the ENGINE2 lead; no other scope change.

### 2026-09-20 — The Wode Defends added to the live inventory

Astra ENGINE's structural report (Chords 858) found The Wode Defends, granted since V82, inside the
V88 grammar. Confirmed: it joins the live inventory with its own design (WD1–WD3) as the first live
hero symbolic-potency ability; Ray stays compile-only. Live compiled total becomes nine (V72's seven
plus Eye of Surlach and The Wode Defends); compiled-but-unavailable six. The audit comparison runs on
the same current corpus with prior content drift recorded separately.

### 2026-09-20 — Saving-throw threshold and audit demotions clarified

Astra ENGINE (Chords 864) noted that `DerivedBaseline.savingThrowThreshold` already exists with
trait provenance (for example Otherworldly Grace lowers it to 5) and that a fixed 6 would regress an
evaluated hero once saves become automatic. Confirmed: admitted heroes use their evaluated threshold,
foes and unevaluated creatures use the printed 6, the threshold and its source are recorded on the
clock outcome, and no new trait parsing is added. Also confirmed that the stricter clause-position
rule may demote clauses the V26 audit mislabeled as bounded; demotions are listed beside promotions.

### 2026-09-20 — Implementation candidate, verification pending

Worktree `.worktrees/engine-potency`, branch `slice/V88`, source base `a9c874c`.
The compiler, persisted use/correction lifecycle, source-instance presentation and automatic clock
producer are implemented. Original evaluated potency facts are saved with the compiled result;
corrections reuse them. Unknown target characteristics remain unknown instead of inheriting the
legacy foe roller's zero defaults. Public event descriptions/payloads omit target scores; query
projection grants them only to the Director and the target hero's controller.

Saving throws read the existing evaluated hero threshold and provenance, with printed 6 for foes.
Manual toggles and multiple source instances are tracked separately; ending combat unschedules
active instances without inventing a final turn. Retained save records make later correction refuse.
History restores journaled condition/registration state without replaying dice. No trait actions,
grants, loading paths, condition consequences, potency adjustments or browser automation were added.

The focused integration fixture discloses its Might-0 baseline override and dice positioning; it
exercises both correction directions and exact save restoration. The live runner uses legally
created heroes and ordinary campaign dice. The V72 assertion adaptations are documented in
[evidence/V88/v72-adaptation.md](evidence/V88/v72-adaptation.md); historical V72 capture evidence is
unchanged. Report artifacts are regenerated by authoring commands; freshness gates, persisted tests,
full check and actual headless execution remain TESTER work. Authoring TypeScript/lint/format checks
are not claimed as completed acceptance.

### 2026-09-20 — First TESTER return and repair

TESTER job `test-V88-ac95cc3-1` passed 88 focused script tests, 34 focused app tests and
byte-identical audit regeneration twice. Full check passed lint/format and 352 engine tests,
then found two superseded BP assertions plus a correction guard-order regression on an archived
encounter with a removed foe. The BP expectations are adapted as recorded in the V72 adaptation
note. Archived corrections now run the history guard before inspecting live condition instances;
damage-only results skip that lookup. The existing walkthrough remains unchanged. Full-check
failure evidence is retained on main at `ae12be6`, `evidence/V88/tester-job-ac95cc3.md`.
A repaired candidate is submitted for focused regression checks and the full gate; no runtime
or browser test has run, and independent review remains gated on the required check.

### 2026-09-20 — Full check green and implementation review repairs

TESTER `test-V88-a07dd27-2` passed the 34-test repair gate and complete `pnpm check`:
352 engine tests, 562 app/scripts tests, link/vendor/content/supporting/foe/report gates and
production build. Evidence is retained on main `07b8f5b`. Independent implementation review
found a required combat-end log missing despite correct persisted unscheduling. Combat end now
appends a public source-linked `condition.unscheduled` event naming the active condition and manual
follow-up; it adds no save or expiration. The lifecycle test reads that message as an observer.
A new legal Wode Elf player fixture also proves both correction directions and the tier-3 transition
from slowed to restrained, including player undo/redo and no replacement dice.

The initially queued real-headless jobs were cancelled before setup (TESTER 899); no environment or
account was created. The revised candidate needs coordinator gates before review closes and before
replacement live jobs. Review also records the existing 1000-retained-instance safeguard as a
nonblocking limit: no archival route is supplied by V88; it must not be described as implemented.

The `c220cbc` focused gate passed 27/28, including the unscheduling log, but exposed an invalid
physical-ID equality assertion in the new Wode redo fixture. Existing history recreates inserted
clock rows and aliases their references. The fixture now compares every other live-state field,
the same condition occurrence/source/status, and the replacement registration's active status,
timing, work, source, affected ids and encounter. Roll rows remain byte-equal. No application code
changed for this test repair; the failed attempt remains in TESTER evidence on main `4cee09c`.

### 2026-09-20 — All execution gates and implementation review passed

Exact candidate `1af9c7509400d493d690851e4d3e5b0f6ecad30a` passed the full check and
real V88 proof (25 readback groups on a local anonymous backend), plus the unchanged V72 main runner
(14 groups) and adapted V72 runner (46 groups) on CT114 `engine-live`. TESTER certificates and actual
case outcomes are collected in [evidence/V88/README.md](evidence/V88/README.md). No browser ran.
Independent implementation review now passes all 13 checks; separate pinned-source rules review is
in progress. This evidence covers the pre-V87 branch only; lead-owned integration must verify its
resulting content/API/report changes.

After TESTER stopped `engine-live` and its helper, the clean detached legacy worktree was removed.
Its four ignored local `.playtest` files were copied and byte-verified under
`/srv/presidium/projects/salient/test-artifacts/engine-live-retired-20260920/playtest` first.
The merged V72 branch had already been deleted. CT114 volumes/data and coordinator artifacts remain
retained; no environment was started during retirement. The active V88 worktree remains available.

Rules-review clarification: the pinned frightened and taunted conditions replace a prior
different-source instance. That source replacement is a manual condition consequence under V88's
existing exclusion; no ability in the V88 live inventory inflicts either condition. Supporting the
condition id in the bounded grammar does not claim automation of its consequences.

### 2026-09-20 — Reviewed branch handoff

Independent implementation reviewer `v88_implementation_review` and independent pinned-source
rules reviewer `v88_rules_review` both pass the verified `1af9c75` application, with all 13
acceptance checks verified. No blocking finding or user decision remains. Their reports are under
`docs/build/reviews/`; all attempt certificates, actual live case results and boundaries are linked
from the V88 evidence README. Final closure adds documentation and authentic review trailers only;
application and runner bytes remain those tested. ENGINE2 owns rebase/integration and shared-main
rollout. This handoff does not merge or claim the later V87-integrated result has passed.

### 2026-09-20 — Seeded inventory owner follow-up

ENGINE2 955/960 and DEPLOY 956 assign the post-V87 proof on `slice/V88-seeded-inventory`,
`.worktrees/engine-potency-seeded`, from frozen `c721d0b48802be806e1c0f4eab4d9d98bf93c9a7`.
The corrected base inherits the reseed action and 13/1222/2 report. Owner adds four ability-specific
persisted/live proof groups, then TESTER gates and independent review addenda before an explicit
handoff to DEPLOY. Main/cloud are untouched; the completed pre-V87 handoff remains intact.

The addendum authorship now includes four parameterized persisted ability cases (all tiers,
equality resistance, correction/history and audience checks), plus the public runner extension
and bounded, disclosed campaign-dice positioning helper. Original headless cases remain before
positioning begins. Source-derived fixtures and exact coordinator procedure are recorded in
[evidence/V88/seeded-inventory-design.md](evidence/V88/seeded-inventory-design.md) and
[evidence/V88/seeded-headless-plan.md](evidence/V88/seeded-headless-plan.md). Local authoring
TypeScript, scoped ESLint and Prettier pass. TESTER focused/full/live gates and independent
addendum reviews remain pending; no test stack or browser was launched by the owner.

### 2026-09-20 — Seeded equality fixture repair

TESTER job 10 (`498778e`) stopped at focused app 5/6: Eye Flash targeting a Redglare
was fact-needed despite known equal Presence/threshold, because its nonempty Fire immunity
cell makes damage manual under the existing loader. Use pinned Goblin Monarch P3 for
the fully resolved equality case; retain Redglare as an explicit missing-damage-completion
negative case. Original failure certificate is retained. No production or runner change;
focused/full gates and dependent real headless are resubmitted on the repaired candidate.

### 2026-09-20 — Seeded full and public gates passed

Frozen `21ec7cadcdc4a7abe04d5116cdad4d3bcd6f8b3c` passed TESTER job12: focused
6/6 potency and 3/3 report; full 352 engine and 571 app/scripts, 377 links, content/vendor/
report gates and build budgets. Job13 then passed 91 real public readback groups in
247.618 seconds, including the original 25 unpositioned groups and all four new abilities'
applied/resisted, correction, source-save/history/manual-off cases plus PC/RC tier2 absence.
The helper completed exactly ten disclosed requests; no outcome rows were imported. Its
unrelated-row check saw zero such rows in this fresh isolated database, so this run does
not prove preservation with a populated unrelated campaign. TESTER stopped helper/backend
and verified free ports, retaining 26 MB play data. Certificates are copied unchanged into
[evidence/V88](evidence/V88/README.md). Independent addendum reviews follow before handoff;
main/cloud integration remains DEPLOY-owned.

### 2026-09-20 — Seeded independent reviews passed

[Implementation review](reviews/V88-seeded-implementation-review.md) passed, then the separate
[pinned-source rules review](reviews/V88-seeded-rules-review.md) passed at `21ec7ca`. Both
reviewers checked actual retained readback in addition to certificates. No blocking findings
remain; the isolated helper's empty unrelated-data coverage and inherited retention limit are
explicitly retained. Code, tests, runner, helper and generated reports remain byte-identical to
the tested candidate. The owner closes documentation and replaces pending commit trailers
with these authentic verdicts before requesting TESTER's final link/metadata/byte-identity gate.
The final reviewed branch is handed to DEPLOY for integration; it is not merged or published
by the engine owner.

### 2026-09-20 — DEPLOY current-main integration staged

ENGINE explicitly handed frozen reviewed source `8d43dfb63230b3783cf559b259e29c331ca7fb87`
to DEPLOY after TESTER's final closeout certificate at
`evidence/V88/tester-job-8d43dfb-seeded-closeout.md`. DEPLOY fast-forwarded its isolated
`integration/V88` branch, then rebased the complete nine-commit V88 series without conflicts onto
current main `dd8e3ea`. The rebased executable parent is `2600c37`; newer main changes were the
retained TESTER/DEPLOY documentation and certificate records. Main, GitHub and cloud remain
unchanged until TESTER certifies the exact integrated branch head.
