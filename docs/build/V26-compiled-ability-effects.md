# V26: Compile ability text into shared executable effects

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Primary track | Parser and rules engine |
| Owner type | Engine implementer with independent implementation and rules reviewers |
| Rules review | required |
| Depends on | S01, S02, A01, A02, A04, A05, A06, A09 |
| Unblocks | Incremental ability grammar, condition effects and later timed resource effects |
| Status | see `STATUS.md`; per-ability specification complete; independent design and rules review pass; implementation not started |

## Goal

Connect a small, reusable ability compiler to the existing live resolution path. Given supported
source wording, produce an ordered, source-linked definition; evaluate it using explicit actor,
target and dice inputs; journal supported damage and show a typed push instruction with its
calculation and manual remainder. The same definition and outcome must work headlessly and in the
app. A successful parse must never masquerade as complete rules support or completed movement.

This is the recommended first implementation for **parser/engine viability**. V22's turn-start
Ferocity recommendation optimized for immediate bookkeeping relief. This proposal instead addresses
the missing connection between reusable parsing and live execution. Ferocity remains a later small
consumer of that boundary. This priority is an engineering recommendation, not a new user ruling.

## Spec references

- `docs/build/README.md#engine-ability-design-and-playtest-evidence` — confirmed per-ability design,
  live app screenshots and visibility/completion gate.

- `docs/rules-language.md#proposed-implementation-model` — structural adapters, grammar, semantic
  checks, execution and presentation; a small compositional grammar rather than ability-name logic.
- `docs/engine-architecture.md#from-rules-text-to-executable-behavior` — source preservation,
  explicit unsupported behavior and dependency safety.
- `docs/engine-architecture.md#structured-effects-are-the-common-contract` — typed effects,
  identities and movement instructions distinct from movement results.
- `docs/engine-architecture.md#knowledge-of-rules-and-knowledge-of-the-board` — missing facts.
- `docs/roll-and-damage-resolution.md#4-tier-outcome-to-damage` — reuse current damage calculations.
- `docs/table-spec.md#inline-interaction-cards-in-the-game-log` — minimum inputs and manual disposition.
- `docs/table-spec.md#director-edits-to-inline-results` — correction window and retained dice.
- `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` — recorded restoration.
- `docs/rules-adaptation-principles.md#manual-play-is-a-supported-mode` — partial/manual play.

## In scope

1. A pure compiler shared by hero-ability and embedded monster-ability adapters, preserving all
   mechanical text in the bounded input envelope and diagnosing unsupported or inconsistent input.
2. Existing damage expressions plus `push N` represented as ordered typed nodes. Unknown clauses
   remain identifiable nodes with original text. Recognition and executability are separate.
3. Live use of compiled damage through existing shared arithmetic and journaled operations, plus
   push-distance calculation for known supported facts and a source-linked table instruction.
4. Stable per-effect occurrence identities, applied/instruction/manual/fact-needed outcomes,
   retry-safe manual dispositions, and correct correction/undo/redo behavior.
5. A small generated support report and contrasting source-grounded acceptance examples.

## Out of scope

- Conditions, potency execution, saves, resource triggers, trait automation, minions/captains,
  areas, reactions, replacement effects and arbitrary dependent-effect resumption.
- Automatic token movement, collision/fall/terrain damage or a standalone damage tool. Physical
  movement and its unsupported consequences remain table work. No movement-completed click is
  required merely because the app displayed a supported instruction.
- Pull/slide/vertical movement execution; arbitrary prose, homebrew entry UI, all-book automation,
  AI translation at runtime, a new language, service or generalized plugin framework.
- Replacing the journal, rebuilding the UI, expanding the foe catalog or changing character builds.

## Inputs and dependencies

Hard dependencies are the committed content pipeline, accepted dice/commands, evaluated hero facts,
ordinary foes, shared roll/damage operations, action cards and history named in the header. The
implementation extends `shared/resolve/index.ts`, `convex/lib/resolve.ts` and existing registered
ability operations. It does not wire the restricted `src/engine.ts` experiment into live play.

V04 remains a hard dependency of the broader V05 outline. This smaller slice does not execute areas,
responses or dependent movement consequences, so V04 is not a hard dependency here. V02 is likewise
not needed: Spinecleaver is a compile-only comparison, never an ordinary live foe fixture.

V22 (`9d50b47`, on `slice/V22`) is assessment evidence, not an unmerged code dependency. V23 foe
coverage is a concurrent consumer. V25 character work is integrated on main `14b7536` at this design
audit; rebase before implementation and preserve its actor damage modifiers, target immunities and
resource-waiver behavior. Coordinate content/snapshot adapters and derived-fact projections before edits.

## Proposed implementation contract

### 1. Source to compiled definition

Use structured fields to locate the ability envelope and full Markdown to retain/check the source.
Support the existing standalone hero format and embedded monster blockquote format. Kit signatures
must keep their current damage semantics and source boundary; include them in adapter regression
coverage even if their complex effects remain manual. Normalize display markup only.

The bounded automatic grammar is one power roll with three tiers, supported current damage
expressions, optionally followed by a nonnegative integer `push N` or the bounded post-damage
potency-condition remainder below. Preserve current characteristic choices,
fixed monster roll bonuses, damage types and kit-bonus inclusion metadata. Multiple damage
components, multiple rolls, nested alternatives and additional target subjects are unsupported.
Do not discard a second roll, unnamed paragraph, extra table, trigger or Effect section. Only
identified presentation scaffolding and declared flavor matching the source may be ignored; an
unrecognized italic paragraph is not automatically harmless flavor.

Each compiled node carries a source locator, original clause, kind, parameters and structural
position. Include content identity/revision and compiler format/version on the definition. Use
structural occurrence IDs, not clause text: two identical printed clauses remain distinct.
No requirement for source-hash certificates or manually maintained per-ability approval records.
Ordered nodes and explicit phase dependencies are enough here; do not build a general graph
scheduler before a supported mechanic requires one.

Minimum node families:

| Node | Meaning |
| --- | --- |
| Damage | Existing constant/characteristic/choice expression and optional damage type. |
| Push | Printed distance, target binding and dependency on the preceding damage phase. |
| Unsupported | Verbatim clause/section, reason, and what work cannot safely proceed. |

Unknown text cannot be assumed independent. If its effect on payment, targeting, damage or order
cannot be established, the affected automation stays unavailable and the source remains manually
usable. A manual-completion marker does not certify that an unknown modifier had no effect.
Support the current basic damage-plus-potency-condition remainder as a source-grounded example of
post-damage work without executing the condition: a characteristic letter, `<`, a signed integer or
symbolic `WEAK`/`AVERAGE`/`STRONG`, an optional comma, then `bleeding` or `slowed` and `(save ends)`.
This recognizes ordering and preserves the entire clause as Unsupported; it does not evaluate the
inequality, derive potency, apply a condition or schedule saves. Other remainder shapes stay
unsupported unless separately designed. Any dependency classification must be grounded in
the syntax/general rules and tested with counterexamples, never chosen from an ability's name.

For complex abilities already using A05's explicit manual remainder, preserve their established
known-input damage behavior through a clearly labeled legacy adapter while they are outside the
new compiler's safe subset. That adapter must not label their whole source compiled or gain push
automation. It must not be a catch-all bypass for malformed/new source accepted by the compiler.
Only the unchanged existing sourced definitions are eligible for that compatibility path; a
changed body/projection or source revision must be diagnosed and cannot silently fall back.
Record this boundary in the report; progressively removing it is later work.

#### Runtime migration boundary

New compiled execution requires the fully checked standalone or ordinary-monster envelope above,
an existing single-target shape (`One creature`, `One creature or object`, or the equivalent
already-supported one-ally/enemy shape), and no additional mechanical section, trigger, restricted
target predicate, extra subject, area or second roll. Printed object targeting is retained but adds
no new object runtime. An omitted or contradictory section is a diagnostic, never harmless by default.

Keep the **kit-signature adapter** on its unchanged compatibility execution path for this slice;
Pain for Pain remains an individually designed regression. Common creature Free Strike, Catch Breath,
Defend and Aid Attack keep their existing special/recorded paths. New occurrence IDs and effect-list
controls apply to newly compiled results only. Unchanged compatibility results retain their existing
manual-clause storage/reads/operations; historical results never gain occurrences by being read.
Named regression abilities test that boundary without converting every manual ability to a new format.

This is structural eligibility, not rules dispatch by name. At the audited integrated snapshot the
structurally matching set has eight abilities, but only six are currently selectable for live
compiled execution: **Brutal Slam, Spear Charge, Bury the Point, Melee Weapon Free Strike,
Ranged Weapon Free Strike and Viscous Fire**. Meteoric Introduction and Ray of Agonizing
Self-Reflection match the grammar but lack a current wizard grant option; retain them as compile-only
comparisons. The four named compatibility regressions bring the live-proof inventory to ten.
New qualifying content must be added to that inventory before its behavior changes; do not silently
migrate it because a grammar check passes.

### 2. Definition to outcome

Recommended boundary: `compileAbility(source)` produces a serializable definition and diagnostics;
`resolveCompiledAbility(definition, facts, acceptedDice)` produces a typed result. Exact type and
file names are implementation choices. Both are pure and independent of Convex, filesystem access,
UI and random-number generation. Convex owns authority, accepted dice, transactions and persistence.
Compilation is not an extra mandatory confirmation step for an otherwise ready supported ability.

Call the existing shared roll/damage functions. Do not build a second damage calculator. For the
supported shape, complete the damage phase before the push instruction; retain per-target outcomes.
A parser that recognizes all tier tokens may still report unsupported execution of the envelope.

Push support in this slice is **calculation and instruction**, not spatial execution:

- Retain printed distance; add 1 when the source is a melee weapon ability and the acting creature
  is larger than the target creature. Compare `1T < 1S < 1M < 1L < 2 < ...`; `1M` and `1S` differ.
- Record the result as the supported rule-derived allowance before the target's optional stability
  reduction. Show known stability and the fact that reduction is optional; never subtract it
  automatically. Actual distance may be less, including zero.
- These calculations require relevant current size/keyword/modifier facts. Missing facts produce
  named requirements; do not assume equal size, zero stability, no modifiers or no exceptional rule.
  Authoritative evaluated/snapshot facts may be used within their explicitly supported coverage.
  If an active condition or trait has unevaluated movement consequences, a printed-distance/size
  subtotal may be shown, but movement eligibility and the final allowance remain explicitly manual.
- Identify straight-line, away-from-source semantics for the ordinary nonvertical case. Flying,
  vertical/slope exceptions, paths, collisions, terrain, movement triggers and death effects retain
  source references and explicit manual scope. Do not assert that a route or destination is legal.
- In a fixture with size 1M actor, size 1S target, no additional movement modifiers and melee weapon
  keywords, printed push 2 yields allowance 3 before optional stability reduction. For a same-size
  pair it remains 2. This is not a claim that every Brutal Slam always pushes three squares.

No new fact-entry workflow is needed to finish the slice: use known facts, return precise missing
requirements otherwise, and retain existing manual resolution. Automatic resumption after supplied
facts is outside scope. This avoids settling outstanding cross-user response authority incidentally.

### 3. Persisted results and clients

Each executed occurrence is bound to the use event, compiled node, target and effective result
revision. Preserve historical target identity using the existing A06 alias-resolution path when
rows are recreated during restoration; do not regenerate occurrence identity from a new row ID.
Expose whether it is applied damage, an outstanding movement instruction, unsupported
manual work, missing facts, or manually resolved. Keep recognition/support separate from disposition.
The numeric push allowance can be calculated while physical movement remains unrecorded.

Store the compiled definition or the complete versioned definition snapshot needed to explain that
use, accepted inputs/dice, effect records and actual journaled changes. An engine upgrade or source
update must not reinterpret an old use when reading or restoring history. Older results without
compiled records retain their existing read path; do not compile them opportunistically on read.
Store only the selected
used ability in public source records, not a whole private monster stat block.

Extend compiled ability-result reads and cards with this small effect list. All controls use the
registered operations and equivalent headless access. Extend `ability.resolved` to identify a
specific effect occurrence; retain old text/target calls only when unambiguous. A repeated clause
must not mark another occurrence resolved. Preserve existing Director authority and history limits.
An outstanding instruction alone does not block the next action or turn; do not import the
experimental engine's blanket pending-work gate. Manual disposition is optional for the instruction
and is not a routine movement-completed requirement.
An effect marked Resolved at table records the disposition once; it does not move a token, mutate
Stamina or infer a destination. Other manual state changes use existing recorded operations.

Correcting an eligible latest roll reuses accepted dice, reconciles damage once and replaces the
pending push calculation for its newly effective tier. It preserves the original event. A manual
disposition or other later gameplay must be sequentially undone before editing the originating
roll; do not introduce a selective correction bypass. Undo/redo restores saved effect records and
manual dispositions with the existing state/history branch, without compiling, rolling or executing.

### 4. Evidence that this scales beyond a demonstration

Generate a deterministic JSON/Markdown report over the integrated snapshot's standalone ability
entries, embedded Goblin Warrior abilities, kit signatures, and named compile-only Spinecleaver
example. Main `14b7536` has **48 standalone entries, two Goblin Warrior abilities and 25 kit
signatures**; the old spec baseline had 22 standalone entries. Report the actual discovered denominator
if content changes before build; record snapshot identity and keep standalone, embedded, kit and
test-only populations separate. Recognition of a kit fragment does not migrate its runtime path.

For each ability report envelope recognition, recognized nodes, executable stages, unresolved
clauses and missing prerequisites. Count fully/partially/unrecognized parsing separately from
execution support. No whole-book percentage, no claim that a rendered article or parsed tier is a
fully supported creature. Add the report to the normal reproducible check rather than a hand-edited
support ledger. The same source mutation tests must prove no name-specific handler is needed.

## Deliverables

- Pure compiler/effect contract next to `shared/resolve` and its source adapters.
- Existing ability-use, result-read, manual-disposition and correction paths consuming that contract
  for the bounded supported shapes, with journaled effect records and a small log-card rendering.
- Source-grounded compiler/pure-resolution tests, persisted shared-operation tests, per-ability
  in-app playtests with durable game-log screenshots, and a generated support report. Intended
  commands/scenarios are specified below.
- Dated implementation notes in owning engine/rules-language/roll-resolution specs: the actual
  supported grammar, legacy/manual boundary, versions and remaining unsupported behavior.

### Build sequence

1. Rebase onto integrated main, re-run the affected-content comparison, and establish the isolated
   development backend before backend changes. Preserve V25 facts and unchanged operation contracts.
2. Implement pure envelope checks/nodes and deterministic reporting; test source mutations and
   independent expected values before wiring live execution.
3. Integrate compiled results through existing damage, payment, journaling and history operations;
   implement occurrence-addressed disposition without changing compatibility records.
4. Render source-linked effects/calculations in the log and expose identical shared/headless reads.
5. Execute all ten per-ability in-app designs’ required cases, retain screenshots and state readback, then perform
   required independent implementation/rules reviews. Do not report slice completion while evidence
   is missing. Integration/runtime update follows the current main build process when assigned.

## Acceptance checks

These are **future implementation acceptance checks**, not results from writing this specification.

1. **Real hero end to end.** Use the existing level-one devil Fury/Mountain baseline: Might 2,
   size 1M, kit damage +0/+0/+4. Against the printed Goblin Warrior (size 1S, Stamina 15,
   stability 0), with Ferocity 0 and no active condition or extra movement modifier in this
   explicitly prepared fixture, accepted dice 7+7 select Brutal Slam tier 2. Read back 8 applied damage,
   Stamina 7, and printed push 2 plus size bonus 1 = allowance 3. Source text, calculations,
   identities and manual physical-movement scope appear in both headless result and log card.
   State that other Fury/Goblin traits and triggers remain manual.
2. **Monster adapter and honest minion boundary.** Spear Charge yields the printed 3/4/5 damage
   expressions; Bury the Point retains each distinct potency/bleeding/save clause as unsupported
   post-damage work. Spinecleaver Axe tier 2 compiles to damage 4 then push 3, with full minion
   targeting context retained; live execution does not claim minion support or load it as ordinary.
3. **Choice/arithmetic regression.** Existing free-strike/kit-signature characteristic choices,
   kit bonus inclusion, per-target edges/banes, temporary Stamina, cost blocking and critical
   recognition keep their current source-derived results. Existing registered commands still work.
4. **Parameter/composition generality.** Internal fixtures rename the ability and consistently
   change its numeric clauses in both envelope and body; the same grammar changes the output
   without ability-name code. These are parser tests, not a new homebrew product feature. Two
   identical unsupported clauses get separate occurrence identities and dispositions.
5. **No lost mechanics.** Append a damage-changing paragraph outside structured `effects`, add
   a second roll, or contradict a tier projection. Each produces a source-local diagnostic;
   no new automatic result treats that omitted text as harmless. Unknown tiers/invalid expressions
   are retained safely, never evaluated as JavaScript. Validate complete source coverage of the
   bounded envelope, not merely the count of extracted fields.
6. **Sequencing counterexample.** Thunder Roar retains its nearest-target-first Effect and area
   context. The new compiler does not issue independent ordinary push instructions or invent a
   target order; its movement stays unsupported. Existing explicitly manual A05 damage support
   stays distinguishable from new compiled execution. Out of the Way's slide and movement rider
   are likewise not reduced to an ordinary push.
7. **Facts and voluntary reduction.** Cover same-size versus 1M-to-1S; no melee/weapon bonus when
   keywords do not qualify; missing size or ambiguous bare `1`; known nonzero stability; additional unhandled movement
   modifiers and an active condition with unevaluated movement consequences. Stability is not silently subtracted and no route, zero-distance choice, or completion
   is invented. Read outcomes that distinguish calculated allowance from missing/manual work.
   Lethal damage must not silently erase the source's following movement instruction; source
   death/collision consequences remain explicit manual work, not automatically triggered outcomes.
8. **Correction and restoration.** From check 1, add one bane to the eligible latest attack:
   natural 14 + Might 2 - 2 = 14, still tier 2; add a second bane: tier shifts to 1, damage becomes
   5, Goblin Stamina becomes 10, push allowance becomes 2. Original dice remain 7+7. Undo/redo
   restores the effective calculation and state exactly. Repeat after marking the push resolved:
   correction is refused until that later disposition is sequentially undone. No movement replay.
9. **Retries, access and history.** Duplicate use/disposition commands do not duplicate damage or
   marks. A fresh command cannot resolve an already resolved occurrence again. Wrong users,
   wrong targets, stale result revisions, pause/closure and archived history are refused under
   existing boundaries. Other occurrences remain unchanged. Used-action text remains public;
   unrelated monster abilities and private state remain private.
10. **Connected proof and report.** Run compiler/pure tests, persisted `convex-test` scenarios and
    `pnpm check`; run isolated-backend in-app playtests for every built or changed ability in the
    inventory below. Retain readable screenshots correlating actual game-log output to source and
    expected outcomes, with persisted readback from the same run. Include a connected headless and
    browser journey through use, manual disposition and sequential correction/undo/redo. Generate
    the support report twice with identical output and no hand edits. Independent implementation
    and pinned-source rules review must check the per-ability design/evidence mapping. Pending or
    failed live evidence blocks implementation acceptance. No claim of full-encounter automation
    or long-session usability.

11. **Integrated content and build facts.** Execute Viscous Fire in-app and the compile-only
    Meteoric Introduction/Ray cases through the pure compiler/resolver. Their missing live grant
    prerequisite must be explicit; do not expand the wizard or manufacture granted abilities. Preserve
    V25's evaluated Magic/Fire bonuses and target immunities, damage types, and unchanged optional
    spend/resource behavior. Compare generated eligibility and live grant availability with the
    inventory of ten live abilities and three compile-only comparisons; any additional behavioral
    change requires its own completed design and live evidence.

## Ability design and playtest evidence

User-confirmed workflow, 2026-09-16: follow the
[per-ability gate](README.md#engine-ability-design-and-playtest-evidence). This specification is a
shared design foundation. The [per-ability design appendix](V26-ability-designs.md) records exact
source sections/tiers, input facts and expected scenario outputs. Every ability newly built,
migrated or behaviorally changed by the shared compiler/adapter must be enumerated individually;
the report population is not automatically the implementation scope.

### Confirmed ability scope — 2026-09-16

The user accepted three primary abilities: **Brutal Slam**, **Spear Charge** and **Bury the Point**.
The named regression set is **Melee Free Strike**, **Ranged Free Strike**, **Pain for Pain**,
**Out of the Way!**, **Thunder Roar** and **Lines of Force**. Spinecleaver Axe remains compile-only.
This fixes the intended examples, not an ability-name dispatch rule or permission to omit other
abilities affected by shared changes. Add any such abilities individually before changing their
behavior; reconcile against current integrated content and adapters before implementation.

The user resumed specification work after the checkpoint. The designs below are now individually
specified; they remain engineering designs grounded in source, not new user rules rulings.
The integrated-content audit additionally identified Meteoric Introduction, Viscous Fire and Ray of
Agonizing Self-Reflection as matching the same grammar. Viscous Fire is additionally affected live;
Meteoric and Ray remain compile-only because current wizard choices cannot grant them. These are
included under the accepted affected-ability audit requirement. [Baseline evidence](evidence/V26/baseline-2026-09-16/README.md)
now covers the ten available abilities. **V26 implementation acceptance remains pending**; existing
manual results do not prove compiled behavior, and the baseline discloses turn-setup deviations.

| Ability | Source / design | Designed | Built | In-app playtested / evidence |
| --- | --- | --- | --- | --- |
| Brutal Slam | [Source, design and BS1–BS8](V26-ability-designs.md#brutal-slam) | Complete | No | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Spear Charge | [Source, design and SC1–SC4](V26-ability-designs.md#spear-charge) | Complete | No | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Bury the Point | [Source, design and BP1–BP5](V26-ability-designs.md#bury-the-point) | Complete | No | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Melee Free Strike | [Source, design and MF3](V26-ability-designs.md#melee-free-strike) | Complete | No V26 change | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Ranged Free Strike | [Source, design and RF3](V26-ability-designs.md#ranged-free-strike) | Complete | No V26 change | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Pain for Pain | [Source, design and PP3](V26-ability-designs.md#pain-for-pain) | Complete | Compatibility retained; unverified for V26 | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Out of the Way! | [Source, design and OW2](V26-ability-designs.md#out-of-the-way) | Complete | Compatibility retained; unverified for V26 | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Thunder Roar | [Source, design and TR1](V26-ability-designs.md#thunder-roar) | Complete | Compatibility retained; unverified for V26 | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Lines of Force | [Source, design and LF1](V26-ability-designs.md#lines-of-force) | Complete | Compatibility retained; unverified for V26 | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Meteoric Introduction | [Source and pure MI2](V26-ability-designs.md#compile-only-comparison-meteoric-introduction) | Complete for compilation | No V26 change | Deferred; no current live grant option. |
| Viscous Fire | [Source, design and VF2](V26-ability-designs.md#additional-affected-ability-viscous-fire) | Complete | No V26 change | [Baseline screenshots/readback](evidence/V26/baseline-2026-09-16/README.md); full V26 case pending. |
| Ray of Agonizing Self-Reflection | [Source and pure RA2](V26-ability-designs.md#compile-only-comparison-ray-of-agonizing-self-reflection) | Complete for compilation | No V26 change | Deferred; no current live grant option. |
| Spinecleaver Axe | [Source and compile-only comparison](V26-ability-designs.md#compile-only-comparison-spinecleaver-axe) | Complete for compilation; live minion design deferred to V02 | No live implementation | Deferred; cannot count as built or playtested. |

For each live case, show the ability being used through the rendered table, then the resulting
source/result log card. Link the exact source clause and general-rule passages to a caption with
expected arithmetic, actual output, accepted inputs and observed saved state. Expand manual effects
so a reader can tell which source clauses the app did not execute. Preserve existing audiences.
Capture correction/history results where claimed. A seeded fixture is allowed; record its setup and
how deterministic dice, if used, entered the normal accepted-dice path. Never manufacture log rows.

Brutal Slam's first evidence must correlate its tier-2 source and size rule with check 1's **8 damage,
15 → 7 Stamina, and push allowance 2 + 1 = 3**, explicitly leaving physical movement manual. Check 8
adds screenshots of the corrected output and restoration. These are expected results for future
playtests, not observations or screenshot proof from this specification turn.

Keep the run record and screenshots under `docs/build/evidence/V26/`, linked from each ability row, with tested revision, source pin, runtime identity,
event IDs, pass/fail and limitations. Reconcile the final inventory against adapter changes and the
generated report before review; no ability may inherit a playtest pass from another ability merely
because they share grammar. Reuse lower-level mechanics tests without duplicating them per ability.

### Affected-ability audit — 2026-09-16

Read-only audit against integrated main `14b7536`, independently checked by `v26_scope_audit`:
48 standalone abilities, 25 kit signatures and the Goblin Warrior's two abilities are present in
the adapter input population. The design appendix covers eight structural matches, of which six
have current live grants, and four named compatibility regressions. Main's
`shared/content/level-one-decisions.ts` offers Bifurcated Incineration and Viscous Fire as the two
Elementalist signature choices; Meteoric Introduction and Ray cannot currently be granted by the
wizard. These two remain compile-only alongside Spinecleaver. Do not change character builds to
turn compiler coverage into purported live support. Future grant expansion must promote the relevant
inventory row and supply real in-app proof before reporting that ability supported live.

The remaining standalone entries do not meet the complete runtime envelope: additional Effect
sections, multiple targets/areas, restricted targeting, triggers or no qualifying damage roll.
Examples checked: Impaled! restricts the target to the actor's size or smaller; Back! is multitarget;
Hurl Element's Effect chooses the damage type; Blood for Blood!'s additional mechanics affect damage.
Do not discard these differences to admit their tier fragments. All 25 kit signatures stay on the
existing kit execution path; otherwise Bear Claws, Hamstring Shot, Net and Stab, Unbalancing Attack
and Shield Bash would add affected abilities requiring individual designs and proof.

Shared changes must preserve the nonmigrated definitions' execution, source visibility, costs and
manual handling. Add differential adapter/result-format regression checks against the integrated
baseline; a changed behavior or effect control in any excluded ability invalidates its exclusion
and requires extending this inventory before implementing that change. Reporting a diagnostic in
the developer support report alone is not a gameplay migration. Re-run this audit after rebase and
against the final implementation diff; this design audit does not certify a future implementation.

## Rules research

All paths below are under the pinned local Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`, prefix `vendor/steel-compendium/en/unified/md/`.

| Source | Governs |
| --- | --- |
| `rule/dice/ability-roll.md` | Expressions, semicolon effects, damage to all targets before effects, presentation order and exceptions. |
| `rule/dice/edge.md`, `rule/dice/bane.md` | Per-target modifier/tier correction; read with existing R04 contract. |
| `movement/forced-movement.md` | Push semantics, up-to distance, larger-creature melee-weapon bonus; multi-target order, flying, terrain, collision and death dependencies that remain manual. |
| `rule/character/size.md` | Size ordering including size-1 categories. |
| `rule/character/stability.md` | Target may reduce movement; never automatic full subtraction. |
| `feature/ability/fury/level-1/brutal-slam.md` | First live damage-plus-push example. |
| `feature/ability/fury/level-1/thunder-roar.md` | Nearest-first area movement counterexample. |
| `feature/ability/fury/level-1/out-of-the-way.md` | Slide and linked voluntary movement counterexample. |
| `monster/goblin/statblock/goblin-warrior.md` | Live ordinary foe and embedded ability format. |
| `monster/goblin/statblock/goblin-spinecleaver.md` | Compile-only damage/push comparison and retained minion context. |
| `kit/mountain.md` | Existing fixture +0/+0/+4 melee damage bonuses. |

The [design appendix](V26-ability-designs.md#shared-source-and-fixture-contract) links exact sources
for free strikes, Lines of Force, the additional Elementalist abilities, their feature bonuses,
kit inclusion and damage mitigation. Those per-ability sources form part of this slice's rules review.

The default ancestry size 1M is in `en/books/heroes/clean/Draw Steel Heroes.md`, line 1501
at this pin (read with `git show` in the submodule), and is absent from the extracted unified
ancestry chapter. Devil has no replacement size. See `docs/hero-fixture.md` for this source trail.

Read full source entries and general rules, not just the extracted tiers. Ordinary fact lookup is
implementation research, not a per-rule user approval queue. The current manual/affordability,
source-display and sequential-history decisions apply unchanged. No new rules exception is proposed.

## Open questions

None needed to specify this bounded slice. General response timing, cross-user movement choices and
arbitrary dependent-effect reconciliation remain outside it. If source research reveals that a
candidate's unknown clause can affect supported damage, keep that candidate outside automatic
execution and report why; do not invent independence to increase coverage.

## Work log

### 2026-09-16 — specification work

- User requested a first-slice specification optimized for increasing parser/engine viability.
- Branch `slice/V26` in `/srv/presidium/projects/salient/engine-parser-spec`, created from integrated
  `main` at `e83930e`. This is a short-lived slice branch, not a permanent track branch. V22 remains
  separate pending integration. Other tracks' worktrees and uncommitted main edits are preserved.
- Work in this turn is documentation only; no new gameplay behavior, backend or deployment.
- Read current instructions, roadmap/process, V22 evidence, live shared adapter/operation contracts,
  current manual/correction policy and the pinned source examples above.
- Plan: write this proposed contract and acceptance suite, connect it to owning specs/V05 without
  changing V05's dependency gate, validate documentation, obtain independent spec and rules review,
  and commit the specification for lead integration. Implementation checks above remain unrun.

### 2026-09-16 — documentation validation and baseline

- `pnpm check-links`: 157 Markdown files pass; `git diff --check` passes.
- Initial `pnpm check` passed lint/types and 85 engine plus 309 app/tooling tests, then the
  existing Rules-library generation hook timed out (eight tests skipped). No gameplay code changed.
- Isolated rerun `pnpm exec vitest run --project scripts tests/scripts/rules.test.ts` passed all
  eight tests in 60.46 seconds. Full baseline retry uses `VITEST_MAX_WORKERS=1 pnpm check` to limit
  concurrent test work; its result is recorded below. Logs are in `.playtest/v26/` (ignored).
- The serial retry passed 401 of 402 tests and failed the existing closeout audience assertion
  at `tests/app/closeout-audit.test.ts:66`: it searches the entire serialized public event for
  `37`, and matched the timestamp `1789517637835`, not a private Stamina field. The isolated
  closeout test passed. This is a reproducible explanation of a time-dependent test assertion,
  not evidence of a new data leak. No application/test code is changed by this spec slice.
- A final serial full-check run is recorded separately in `.playtest/v26/check-final.log`.
- Final `VITEST_MAX_WORKERS=1 pnpm check` passed: 85 engine + 317 app/tooling tests (402 total),
  lint/types, 157 Markdown link checks, clean vendor pins, 403-entry content comparison and build.
  The existing bundle-size advisory remains. This establishes the unchanged code baseline only;
  none of V26's proposed implementation acceptance is claimed as built or tested.


### 2026-09-16 — specification review and handoff

- [Independent review](reviews/V26-spec-review.md): design **pass**, followed by pinned-source
  rules **pass**, reviewer `v26_spec_review`; no blocking findings. All ten implementation checks
  remain future requirements, not completed acceptance.
- Documentation links pass across 158 files, and `git diff --check` passes. No executable change
  followed the final full baseline check, so no further full test run was required.
- Specification committed on `slice/V26` for lead integration. Implementation has not started.
  This records the recommended priority and reviewable contract; it does not claim new automation.
- Before implementation, rebase the slice onto integrated main, coordinate the shared adapters
  with foe/character owners, establish an isolated backend and follow the acceptance checks above.

### 2026-09-16 — confirmed per-ability visibility and live evidence

- User requires every built ability to have a source-backed design followed by a real in-app
  playtest, with screenshot proof correlating game-log output to the source.
- Recorded the standing gate in the build process, linked the development principles and slice
  template, and strengthened V26 deliverables/check 10 with a per-ability inventory and evidence
  requirements. The proposed mechanical scope and source-derived numbers are unchanged.
- All V26 implementation and live-playtest evidence remains pending. No screenshots were produced
  or claimed by this documentation change; the earlier spec reviews certify their recorded scope.
- Amendment review: **pass**, `v26_spec_review`, recorded in the existing review report; no
  blocking findings. `pnpm check-links` passes all 158 files and `git diff --check` passes.
  This documentation-only amendment does not rerun the previously passing full code baseline.

### 2026-09-16 — ability scope accepted

- User accepted the three primary abilities and six named regression abilities discussed above,
  with Spinecleaver Axe compile-only and any additional affected abilities explicitly added.
- Expanded the grouped regression inventory into individual source references. Next discussion is
  Brutal Slam's existing source-backed design; remaining per-ability designs/cases are still pending.
- This is a documentation-only scope record, with no new mechanical claim, implementation,
  deployment or playtest. Main now includes V25; reconcile its actor damage modifiers and target
  immunities when rebasing for implementation. Do not replace those integrated facts with the
  older branch baseline.

### 2026-09-16 — user checkpoint: paused during per-ability design

The user asked to checkpoint here. Pause this thread; do not advance implementation from this
checkpoint alone. Resume the design discussion one ability at a time.

**Settled:** the three primary abilities and six named regressions in
[Confirmed ability scope](#confirmed-ability-scope--2026-09-16). Every built/changed ability requires
source-backed design and real in-app playtest screenshots correlating game-log output to source,
with persisted-state readback. Keep designed, built and playtested states separate.

**Where we stopped:** Brutal Slam's design was presented to the user, using the existing reviewed
contract and acceptance check 1. In the prepared tier-2 fixture, the expected log shows roll
7 + 7 + Might 2 = 16, damage 6 + Might 2 = 8, Goblin Stamina 15 → 7, and push allowance
2 + size bonus 1 = 3. Actual movement, optional stability reduction, collision and terrain
consequences stay manual. These are expected outputs, not observed results. The user's checkpoint
request is not an additional rules ruling or a claim that all ability designs are finalized.

**Next:** resume at Brutal Slam, address any feedback, and finish its source-to-behavior record and
playtest cases. Then work through Spear Charge, Bury the Point and the named regressions individually.
Complete the affected-ability audit and independent review before claiming implementation readiness.
No new product question is currently blocking independent source research.

**Repository handoff:** use `/srv/presidium/projects/salient/engine-parser-spec`, branch `slice/V26`.
Specification `9949aba`, evidence workflow `80d1f97`, accepted scope `42fd47b` are committed there,
not merged into main. The latest checkpoint commit follows those commits. Main was observed at
`14b7536`; recheck it and Chords on resume, preserve peer work, and reconcile the integrated V25
modifiers/immunities before implementation. The parser and engine own a track, not a permanent branch.

**Verification and runtime:** documentation links and whitespace checks pass for this checkpoint.
No V26 implementation, in-app playtest or screenshot exists. No deployment, merge or runtime change
was made; this documentation-only checkpoint needs no playable-app update. Earlier review and full
code-baseline results retain their recorded scope; they do not verify future V26 behavior.


### 2026-09-16 — resumed and completed per-ability specification

- User resumed from the checkpoint and requested building out the spec. Finished each ability's
  source/behavior/input/output/playtest design in [the appendix](V26-ability-designs.md); no V26
  gameplay implementation or real playtest was performed in this documentation turn.
- Read current main instructions and audited integrated main `14b7536`. V25 increased standalone
  content from 22 to 48 and projects damage feature bonuses/immunities into live shared resolution.
  Independent read-only audit `v26_scope_audit` identified Meteoric Introduction, Viscous Fire and
  Ray of Agonizing Self-Reflection as matching the grammar. Final independent review found that
  only Viscous Fire has an integrated live grant option; Meteoric/Ray are compile-only without
  expanding character builds. Added individual source designs: six live compiled candidates and
  four unchanged compatibility regressions, ten live total, plus three compile-only comparisons.
- Specified complete single-target envelope eligibility, numeric/symbolic potency remainder syntax,
  kit/common-action exclusions, and persisted-format isolation for legacy manual results. Retained
  source-mutation diagnostics and avoided name-based rules dispatch or silent blanket migration.
- The specification branch remains based on the pre-V25 baseline; implementation must rebase onto
  main and repeat the eligibility audit. This work changes only the slice spec, design appendix,
  review record and tracker. No code, vendor pin, backend, runtime, peer branch or main edit.
- Chords task-start identity/thread/update checks succeeded with no unread messages. Later MCP
  calls reported ambiguous provider session; the documented CLI fallback identified this thread
  correctly and is used for subsequent coordination without supplying a sender identity.
- `pnpm check-links`: 159 Markdown files pass; `git diff --check`: pass. No code changed, so the
  earlier full baseline is not rerun or presented as validation of integrated V25 or future V26.
- Final review caught the unselectable Meteoric/Ray fixture prerequisite and Lines of Force's
  existing unrecognized `Triggered` usage. Corrected the designs to retain compile-only coverage
  and the exact manual action-type/unchanged-allowance limitation respectively; no incidental
  character or triggered-action implementation was added.
- Final independent design review **pass**, followed by pinned-source rules review **pass**,
  `v26_spec_review`; see the [finalization review](reviews/V26-spec-review.md). Both fixture findings
  are resolved. All eleven implementation acceptance checks, persisted effect evidence and actual
  in-app screenshots remain pending.
- Design package is ready for implementation after routine rebase/coordination and isolated-runtime
  setup. Committed on `slice/V26` for lead integration; not merged into main. This documentation-only
  change has no runtime impact and requires no playable-app update.


### 2026-09-16 — specification integrated into main

- User requested the merge. Rebased the five documentation commits onto main `14b7536` without
  conflicts. `git range-diff` confirms all five patches are unchanged; prior design/rules review
  remains applicable. Original finalization `5273563` is now `3689226` after rebase.
- Fast-forwarded main to `3689226`. The nine changed paths are documentation only; verified no
  application, backend, generated content, dependency or vendor change relative to `14b7536`.
  Main's V25 behavior and merge-completion policy are preserved. This integration note follows
  as a documentation commit, and the merged specification branch is retired after integration.
- Integration checks: `pnpm check-links` passes all 168 Markdown files in the rebased worktree
  and main; whitespace checks and `node scripts/check-commit.ts --merge --range main..HEAD`
  pass for the five incoming commits before the fast-forward. No executable change warrants
  rerunning the application suite; earlier baseline results retain their historical scope.
- **Runtime: no update required.** Frontend, backend, schema and content are unchanged by V26's
  documentation merge. No restart, sync, data reset or live feature check was needed/performed.
  This does not certify or complete any other slice's pending runtime integration.
- Chords coordination read and acknowledged the UI track's V29 handoff. Its branch remains
  separate; its changed command-error/log components must be reconciled if integrated before
  V26 implementation. No peer worktree or runtime was changed.
- V26 is ready for implementation, not completed gameplay. Ten live ability proof sets and all
  eleven implementation acceptance checks remain pending. Start implementation from then-current
  main in a fresh short-lived slice branch, repeat the content/grant audit and establish an isolated
  backend. The parser/engine track does not retain a permanent branch.


### 2026-09-16 — real-app baseline playtests

- User requested playtests. Created short-lived `slice/V26-playtest` in the existing clean worktree
  `/srv/presidium/projects/salient/engine-parser-spec`. Actual tested code is `f019e3a` (main advanced
  during branch creation); the run records the full revision and runner SHA rather than the earlier
  intended `64dc658` baseline. Shared main, runtime and peer data were not changed.
- Ran all ten currently selectable abilities through the rendered app on isolated frontend 5184,
  anonymous backend 3234/site 3235. Added an opt-in browser evidence runner and retained paired source/log
  screenshots, actual before/after readback, correction/manual-disposition/history proof. See the
  [complete baseline report](evidence/V26/baseline-2026-09-16/README.md) for fixture setup, event IDs,
  observed arithmetic, known missing behavior and honest case-coverage limits.
- Baseline passed: supported damage, costs, affordability blocking, condition non-mutation and legacy
  manual/history behavior. V26 is still unimplemented: no compiled format, occurrence identity or
  calculated push allowance. Consecutive inline corrections are unavailable after the first; rewind
  then a single two-bane correction verifies arithmetic but does not pass the designed BS7 sequence.
- The baseline reused one turn with logged resets; repeated-action/off-turn warnings are visible.
  Full designed legal-turn playtests remain required after implementation. No compile-only case,
  new product behavior, backend schema/function or app source was added.
- Early harness attempts exposed the correction limitation and Vite reloading on evidence writes;
  preserved failures locally and disabled file watching only on this isolated frontend. Final browser
  run passed in 2.8 minutes with no page errors. Full `pnpm check` passed: 97 engine + 335 app/scripts
  tests, lint/types, links, vendor/content/foe checks and production build. An earlier full-check process
  exited 143 during build; the complete rerun passed. Existing chunk-size build warning remains.
- Evidence is on this branch, not merged into main. This test/documentation change needs no shared
  runtime deployment. Independent baseline evidence and pinned-source rules review **pass**,
  `v26_spec_review`: [baseline playtest review](reviews/V26-baseline-playtest-review.md).
  All eleven V26 implementation acceptance checks remain pending.


### 2026-09-16 — prerequisite correction and playtest fixes

User accepted fixing consecutive corrections and proper-turn playtest setup before compiler work.
Work is bounded to these prerequisites on `slice/V26-corrections`, in
`/srv/presidium/projects/salient/engine-parser-spec`, based on integrated main `f7137dc` plus the
rebased baseline evidence (`5e010ac`, formerly `aeed035`). Rebase resolved only STATUS.md while
preserving V25/V27/V29 integrated records. Original baseline evidence remains historical and unchanged.

Plan: update the shared correction-window helper used by the result query and mutation; preserve
sequential undo units and player/Director seams; add focused saved-state regressions; replace the
baseline runner's rewind workaround with consecutive player clicks and use actual turn transitions
for all ten abilities. No compiler or movement implementation belongs to this prerequisite patch.
Local anonymous backend 3234/site 3235 and frontend 5184 are isolated; shared playable data is untouched.

Prerequisite acceptance:

1. Two consecutive inline player corrections retain dice, reconcile damage once and leave the original
   event intact. Player undo/redo restores each correction in sequence; retry remains idempotent.
2. Director continuations work; Director corrections still close the player's window. Settings,
   ownership, later actions/turns, manual dispositions and history boundaries remain enforced.
3. Corrected cards permit the Director to mark manual clauses; the disposition is a subsequent
   gameplay unit and blocks more correction until rewound.
4. All ten live ability probes use proper fresh turns with no action/turn-order warnings, source/log
   screenshots and saved readback. Manual movement/trigger limitations remain explicit.
5. Full repository checks, independent implementation review and bounded source review pass.

The existing A05 test explicitly expected a second correction to fail under the earlier strict
interpretation. The user's accepted V26 recommendation clarifies directly linked corrections as
continuations of the effective roll, while preserving individual undo and all unrelated-event seams.
The table and command specs now state this distinction. Two new/updated regression cases failed
before the fix and pass afterward; this is application correction policy, not a new Draw Steel rule.


Verification checkpoint: full serial `pnpm check` passes **435 tests** (97 engine + 338 app/scripts)
and build; the focused ability/history suite passes 38. Independent code/design review and subsequent
bounded pinned-source review pass in [the prerequisite review](reviews/V26-corrections-review.md).
Complete live prerequisite 4 remains pending. A partial run verified consecutive player clicks and
undo/redo but stopped during later turn progression with a backend execution timeout under host memory
pressure; a subsequent fixture setup failed to obtain its authentication token. All owned services are
stopped while coordinating a browser window. No failed/partial run counts as complete live acceptance.


### 2026-09-16 — prerequisite live verification completed

- Correction implementation is committed at `f69843b` on `slice/V26-corrections`, not merged.
  The subsequently reviewed test-only authentication adapter supports the production-built preview;
  the final readback records both its runner hash and the unchanged history module hash.
- The complete opt-in browser journey **passes in 6.5 minutes**. All ten abilities use fresh actor
  turns, with 240 ordinary turn-transition events through round 11 and no action/turn-order warnings.
  Consecutive player bane clicks, undo/redo, damage/costs, insufficient-resource blocking, manual
  dispositions and reload persistence pass. Readback has 23 records and no page errors.
- [Fresh evidence](evidence/V26/corrections-2026-09-16/README.md) contains 33 screenshots including
  paired source dialogs and game-log outputs, saved state, full-check output and the final browser
  result. Historical baseline and failed local attempts remain separate. The original baseline's
  correction workaround and turn-setup limitations are now superseded by this evidence.
- Host contention required serializing peer browser work. A later run reached Thunder Roar before
  the preview process exited with signal 15; the complete unchanged rerun used a monitored terminal
  session. No gameplay assertion or timeout was relaxed. All task-owned ports 3234/3235/5184 were
  stopped after success, and the browser window was released to V32 through Chords.
- Full checks remain 435 passing tests and build, with 38 focused history/ability tests; targeted
  lint/types passed after the test-only authentication adapter. Documentation links and whitespace
  pass. Independent final evidence review **passes**, completing all five prerequisite checks;
  see [the prerequisite review](reviews/V26-corrections-review.md).
- These are the five bounded prerequisite checks. All eleven V26 compiler acceptance checks,
  compiled definitions/occurrences and calculated push allowances remain pending. This branch has
  not changed main or the shared playable runtime; any later merge must follow runtime integration.


### 2026-09-20 — V63 rebase and integration audit

- Fable assigned a bounded prerequisite rebase/reverification; Fable retains main integration,
  shared-runtime update and final verification. Worktree `.worktrees/engine-corrections`, branch
  `slice/V63-corrections-rebase`, base main `0f47e8951dbf3da47039130e7334d2a0afd831eb`.
  Named CT114 `engine-corrections` is the planned isolated local-anonymous target; no environment
  has been provisioned or started. Character V62 owns hosted verification; heavy work was held
  while requesting a coordinated window. No shared or cloud runtime changes.
- Cherry-picked original `5e010ac`, `f69843b`, `37ec53f` cleanly as `5787f84`, `36e2400`,
  `44b23ba`. Original authorship and Spec/Reviewed-By trailers remain intact. Those reviews and
  verification statements predate this rebase and cannot establish current acceptance.
- The full mutation path remains correct in isolation: `correctionWindow` loads complete ordered
  session events through `loadHistory` and `walkHistory`. The effective branch excludes undone and
  abandoned units; only an uninterrupted suffix of `correction.ability` heads linked by both
  `causeEventId` and `payload.data.originalEventId` to the same `ability.use` permits continuation.
  Player ownership/Director seams are checked for each suffix entry, then the original unit's
  floor/ownership is checked with only the temporary validation view truncated. Recorded undo
  units and redo history are not collapsed.
- **Blocking V43 integration finding:** `abilities.results` now uses `loadReadCorrectionWindows`
  from `convex/lib/historyRead.ts`, independently of that authoritative helper. `readHistory`
  reads only branch top, redo top and redo-clearing unit. Its correction path compares the original
  ability unit with the newer correction branch top and refuses it. Thus the UI's `mayCorrect`
  becomes false after the first correction even though the mutation permits the next one.
  `historyIndex.ts` assigns `continuationOf` only to `ability.resolved-at-table`, so its manual
  window also fails to recognize a correction suffix. This is a semantic incompatibility despite
  the conflict-free cherry-pick, not a claim of a browser-observed failure.
- Existing rebased `tests/app/abilities.test.ts` assertions at the first correction's
  `mayCorrect: true`, the second player's result, and manual disposition after linked corrections
  already target the mismatch. No redundant tests or speculative application repair added.
  Reported the blocker through Chords message 566; stopped before runtime verification under the
  assignment's stop/report instruction. Independent static review **changes required**, `v63_blocker_review`; see
  [the rebase review](reviews/V26-corrections-rebase-review.md). It confirms both read-window
  defects and the bounded Brutal Slam/Thunder Roar source arithmetic. Fresh full-check,
  ten-ability journey and formal passing review remain unperformed.
- The old opt-in browser harness also requires an explicit CT114 adapter before it can run:
  fixed local ports 3234/3235/5184, backend-only `.convex` config/import access, literal 467-entry
  content expectation and synthetic remote Git identity are incompatible with the current runtime.
  No guard, assertion, timeout or target restriction was weakened. Any adapter must preserve the
  exact mechanical scenarios and record the actual source revision separately from remote snapshot.
- Compiler implementation, new abilities, source pins and 2026-09-16 evidence remain unchanged.
  No merge-readiness or re-verification PASS is claimed.

- Final lightweight checks: documentation links (273 Markdown files), whitespace, and the actual
  branch commit merge gate pass. Both vendor checkouts are initialized at the unchanged pins.
  An initial link check ran before Forge checkout completed and reported missing vendor paths;
  it passed once initialization finished. No dependency installation, build or browser ran on
  Presidium. V62 requested continued serialization of CT114 heavy work; no environment or
  workload was started, so no runtime cleanup/data deletion is needed.


### 2026-09-20 — V63 indexed-read repair and CT114 verification

Fable extended the assignment in Chords message 569 to repair the indexed read path, assert
read/mutation parity and adapt the historical browser harness for the named CT114 environment.
The preceding static blocker review remains an accurate record of the unmodified rebase.

Implemented a walk of existing `historyUnits.previousBranch` pointers through only the same
ability's correction/disposition suffix, then reuse of authoritative correction policy with that
prepared scope. Reads scale with that suffix, not all session history. No index/schema migration
or mutation-policy change. Existing lifecycle tests now compare read/mutation booleans against
explicit expectations. Two cases fail before repair and pass afterward.

Rebased onto main `5956331` before runtime proof, incorporating the headless completion doctrine.
Candidate `a843c1a` is the exact clean tested snapshot. CT114 `engine-corrections` alone hosted
installs/formatting/checks/build/live proof. Full `pnpm check` passes 284 engine +409 app/scripts
tests and all other gates. Live BetterAuth/public setup plus `scripts/app.ts command` gameplay
passes the entire correction lifecycle with persisted readback before browser acceptance.
See [fresh evidence and exact hashes](evidence/V26/corrections-2026-09-20/README.md).

| Capability | CLI/API proof | Incremental browser coverage |
| --- | --- | --- |
| Consecutive corrections, undo/redo | Passed, retained dice and exact health | Repeated visible controls/clicks pending |
| Manual disposition after correction | Passed, permissions and rewind | Historical BS8 browser case uses a fresh uncorrected roll |
| Director seam and unrelated turn | Passed, rejected mutations preserve state | Rendered availability pending |
| Ten ability proper-turn/source/log cases | Not the scope of the correction CLI | Fresh journey blocked before abilities |
| Reload and presentation | Persisted API state passed | Fresh reload/screenshots pending |

The browser failed during `createTable`, before Add foe: Director campaign page showed a backend
function execution timeout (maximum one second). No mechanics or test assertion was altered;
no retry was attempted under the stop/report directive. Fable received blocker 587 with an
accepted wake request, which does not establish that the peer started work. Failure screenshot,
page snapshot and logs are retained; authentication-bearing trace is outside Git. Fresh ten-ability
browser acceptance remains incomplete. Independent review distinguishes code/source/headless
verification from that blocked acceptance gate.

Both one-shot jobs and dice helpers exited; named backend/web stopped with data retained.
Heavy window released to V65 through Chords588. Shared/main/character/hosted runtimes were not
changed. Later main V64 adds a read-only audit; this candidate remains based on `5956331` and is
committed on branch only. All eleven compiler acceptance checks remain pending.

After the user paused testing, read-only stopped-backend logs identified `characters:reviews`
at `2026-09-20T01:50:02.754170801Z` as the failing query; `table:roster` also logged 873 ms.
Fable's proposed single unchanged rerun is held under the user pause. Non-test documentation,
review and peer handoff continue. This identifies a query, not a confirmed root cause.

### 2026-09-20 — Moratorium handoff update

Rebased V63 onto main `2f5544f`, preserving main's V64 audit and V66 browser-harness registration.
Only STATUS rows conflicted; application changes replayed cleanly. Prior test/readback artifacts
retain the exact pre-rebase identity and are not relabeled as fresh proof. Under the new
[browser moratorium](README.md#browser-testing-moratorium--2026-09-20), a missing browser run
is no longer an acceptance blocker. Added correction controls and ten-ability visual scenarios
to the [backlog](browser-coverage-backlog.md), using its `spot` priority vocabulary.
Historical blocked-review language above describes the gate before the moratorium, not the
current browser requirement. Refreshed CLI/full-check verification and final review are held
by this thread's direct user testing pause until clarified; no runtime/test command was started.

### 2026-09-20 — Resumed headless acceptance

User explicitly resumed normal work and non-browser verification. Clean candidate `47e69c6`
on main `2f5544f` passed a fresh CT114 full check (705 tests and every gate/build) and real
BetterAuth/CLI correction lifecycle (12 records, complete, exit 0). Exact source metadata,
file hashes, full output and public readback are in the
[fresh evidence](evidence/V26/corrections-2026-09-20/README.md#resumed-headless-verification--2026-09-20).
Named engine-corrections services stopped afterward with data retained. Browser scenarios remain
in the backlog under the moratorium; no browser execution or new acceptance dependency.
Independent final implementation and pinned-source rules review both [PASS](reviews/V63-headless-final-review.md). This accepts only the correction prerequisite, not the broader V26 compiler. Fable owns integration into main and the shared runtime.


### 2026-09-20 — Shared-main correction proof runner (prepared)

Added `scripts/v63-headless-main.ts` on `slice/V63-main-proof`, based on main `b6109b0`,
for the integration owner's coordinated CT114 main window. This is a separate opt-in runner;
`scripts/v63-headless.ts` and its isolated dice helper remain unchanged. No application code
changes. The runner requires main's source checkout metadata, exact shared HTTPS origin
`https://salient-dev-fc4f48cb09a0.tail41404c.ts.net`, anonymous deployment and container endpoints.
The intended command, **not yet executed**, is:

```sh
presidium-dev --env main run build -- env SALIENT_V63_MAIN_HEADLESS=1 node scripts/v63-headless-main.ts
```

The reviewed script must first be available in the coordinated main source snapshot. Do not
replace the shared slot from this worktree or run during another track's heavy window.
Real BetterAuth HTTP registration creates disposable Director/player accounts; public mutations
create their campaign, approved legacy level-one Fury, Goblin Warrior, session and encounter.
The pre-existing V45 example/decision files supply supported public character selections.
No abandoned Opus files, browser sessions, database imports, reset, seed or dice helper are used.
Disposable proof records remain for inspection; authentication sessions are signed out.

Real random dice are accepted once and retained. Pre-use public sheet tiers, character baseline
and roster health feed the shared R04 `resolveAbilityRoll` with those accepted dice to derive
expected tier, damage and Stamina for each correction. This validates persisted correction/history
parity with R04; it is not a new independent verification of R04 arithmetic. Brutal Slam's absent
fixed cost is asserted, so random starting Ferocity never requires a resource grant. The runner
preserves hero live state, allows source-derived tier-three Slain outcomes, and does not reroll
for convenient tiers. Some rolls legitimately have equal damage under different bane counts.

The lifecycle covers use, player correction, a second linked correction, undo/redo, Director
correction closing the player window, rejected player correction, manual disposition, rejected
correction until disposition rewind, and unrelated turn end closing the window. Every captured
step independently reads results for both roles, Director roster, both history controls and public
events; assertions include both roles' `mayCorrect`/`mayResolve`, original dice, expected damage,
linked correction IDs and history targets. Player `mayResolve` remains false by contract.

Output is `/artifacts/v63-headless-main-readback.json`; prior output is renamed rather than lost.
It records timestamps, elapsed time, actual source metadata, content pin, relevant source-byte
SHA-256 manifest, public readbacks and failure stage without credentials or transport exceptions.
CLI JWTs are passed only through child environment variables. The artifact is public game-state
proof, not an authentication trace. Static inspection found no unsupported setup/lifecycle path.
CT114 formatting, scoped ESLint and full web TypeScript check passed for the runner/config in the
stopped isolated environment; [readiness evidence](evidence/V26/main-corrections-2026-09-20/README.md)
records the exact overlay and checked bytes. The branch was rebased onto main `9675634`. Fable
requires clean main integration and source sync before actual execution. Shared-main acceptance
remains pending that run; browser backlog scenarios stay deferred.
