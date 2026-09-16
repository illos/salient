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
| Status | see `STATUS.md`; specification proposal, implementation not started |

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
coverage and V25 character build work are concurrent consumers. No branch depends on their unmerged
implementations. Coordinate content/snapshot adapters and derived-fact projections before edits.

## Proposed implementation contract

### 1. Source to compiled definition

Use structured fields to locate the ability envelope and full Markdown to retain/check the source.
Support the existing standalone hero format and embedded monster blockquote format. Kit signatures
must keep their current damage semantics and source boundary; include them in adapter regression
coverage even if their complex effects remain manual. Normalize display markup only.

The bounded automatic grammar is one power roll with three tiers, supported current damage
expressions, and a following nonnegative integer `push N`. Preserve current characteristic choices,
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
post-damage work without executing the condition. Any dependency classification must be grounded in
the syntax/general rules and tested with counterexamples, never chosen from an ability's name.

For complex abilities already using A05's explicit manual remainder, preserve their established
known-input damage behavior through a clearly labeled legacy adapter while they are outside the
new compiler's safe subset. That adapter must not label their whole source compiled or gain push
automation. It must not be a catch-all bypass for malformed/new source accepted by the compiler.
Only the unchanged existing sourced definitions are eligible for that compatibility path; a
changed body/projection or source revision must be diagnosed and cannot silently fall back.
Record this boundary in the report; progressively removing it is later work.

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

Extend existing ability-result reads and cards with this small effect list. All controls use the
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

Generate a deterministic JSON/Markdown report over the 22 standalone ability entries in the current
S01 snapshot, every embedded ability of its Goblin Warrior, and the named compile-only Spinecleaver
example. Report the actual discovered denominator if integrated content has expanded before build;
record snapshot identity and keep standalone, embedded and test-only populations separate.

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

## Ability design and playtest evidence

User-confirmed workflow, 2026-09-16: follow the
[per-ability gate](README.md#engine-ability-design-and-playtest-evidence). This specification is a
shared design foundation. Before implementation, finish the source-to-behavior record for each
candidate, including exact sections/tiers and expected scenario outputs. Every ability newly built,
migrated or behaviorally changed by the shared compiler/adapter must be enumerated individually;
the report population is not automatically the implementation scope.

Initial inventory below uses source paths relative to
`vendor/steel-compendium/en/unified/md/` at the pin in Rules research. All live evidence is **pending**.
The rows for grouped regression candidates must be expanded to individual abilities before building;
they are not a substitute for the final inventory.

| Ability | Source / design | Designed | Built | In-app playtested / evidence |
| --- | --- | --- | --- | --- |
| Brutal Slam | `feature/ability/fury/level-1/brutal-slam.md`; checks 1, 7, 8: damage, push allowance, manual movement, correction/history. | Shared contract and numeric scenario specified. | No | Pending; no screenshots. |
| Spear Charge | `monster/goblin/statblock/goblin-warrior.md`, Spear Charge; check 2: embedded damage. | Contract specified; finish actor/target, dice and expected state cases. | No | Pending; no screenshots. |
| Bury the Point | Same stat block, Bury the Point; check 2: supported damage and explicit manual potency/condition/save remainder. | Contract specified; finish per-case calculations and log expectations. | No | Pending; no screenshots. |
| Thunder Roar | `feature/ability/fury/level-1/thunder-roar.md`; check 6: compatibility damage and manual ordered area movement. | Boundary specified; finish live regression cases. | No V26 change | Pending; no screenshots. |
| Out of the Way | `feature/ability/fury/level-1/out-of-the-way.md`; check 6: compatibility damage and manual slide/rider. | Boundary specified; finish live regression cases. | No V26 change | Pending; no screenshots. |
| Free-strike and kit-signature regression candidates | Check 3; enumerate each affected definition with its exact source, including Pain for Pain if its adapter changes. | Inventory and per-ability designs pending. | No V26 change | Pending; no screenshots. |
| Other standalone/embedded candidates discovered in the support report | Add individual rows for each ability gaining or changing live behavior; retain unsupported entries as such. | Inventory pending. | No | Pending if included in live scope. |
| Spinecleaver Axe | `monster/goblin/statblock/goblin-spinecleaver.md`, Axe; check 2. | Compile-only comparison; live minion design deferred to V02. | No live implementation | Deferred; cannot count as a built or playtested ability. |

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

Keep the run record and screenshots under `docs/build/evidence/V26/` (to be created during actual
playtesting), linked from each ability row, with tested revision, source pin, runtime identity,
event IDs, pass/fail and limitations. Reconcile the final inventory against adapter changes and the
generated report before review; no ability may inherit a playtest pass from another ability merely
because they share grammar. Reuse lower-level mechanics tests without duplicating them per ability.

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
