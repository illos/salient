# V46: Devil, level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Ancestry implementer (Opus pilot unit), reviewed by the character integration lead |
| Rules review | Required: every newly enabled trait and skill choice makes mechanical claims |
| Depends on | V44, V45, V25, V32, V37, V40, V42 |
| Unblocks | Release of the remaining level-one ancestry and class units (gated on this pilot's review) |
| Status | In progress; see `STATUS.md` |

## Goal

Complete the Devil ancestry at level one: all seven purchased traits within the three-point budget,
and all thirteen interpersonal skills eligible for the Silver Tongue signature choice. Permanent
build contributions are calculated and shown with their source. Every gameplay effect the source
makes conditional or activated stays readable and is never applied automatically: its verbatim
source text is on the sheet like every other granted feature, and any amount the build calculates
for it is shown under a heading that states the effects apply only in the situation the source
describes and are resolved at the table. Two small markers were added for exactly this purpose after review:
a granted ability whose grant records that it is resolved manually prints that note on its card,
and a movement mode the source gates is marked conditional on the stat row and carries the verbatim
condition. Neither introduces a general per-feature badge scheme, and the sheet's existing
convention of showing full source text for manually resolved features is unchanged. The unit must not
change any existing Fury level-one, Berserker Fury level-two or Polder/Elementalist result, and
must not enable any ancestry, class or level beyond Devil at level one.

## Spec references

- `docs/character-wizard-spec.md#3-decision-system` — decision kinds, shapes, support flags and
  the status vocabulary the new options are evaluated under.
- `docs/character-wizard-spec.md#4-wizard-flows` — creation and full-edit entry to these choices.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — the interchange
  boundary the Forge counterparts are captured against.
- `docs/character-wizard-spec.md#13-proposed-delivery-sequence` — per-unit delivery policy.
- `docs/build/V44-character-option-delivery.md` — this unit is item 1A of the initial sequence.
- `docs/build/character-verification.md#per-option-delivery-gate` — option-to-witness ledger and
  the merge gate.
- `docs/build/character-verification.md#2-build-and-capture-the-reference` — capture procedure,
  including the 2026-09-19 pinned-application capture-mode clarification.

## In scope

- Enable Barbed Tail, Glowing Eyes, Hellsight, Prehensile Tail and Wings alongside the already
  supported Beast Legs and Impressive Horns, keeping the sourced three-point budget and costs.
- Enable all thirteen interpersonal skills for `ancestry.devil.silver-tongue-skill`, keeping the
  pool restricted to the interpersonal group and the existing duplicate-skill semantics.
- Grant Glowing Eyes' triggered ancestry ability with its source text and no activation.
- Represent Wings' flight, its derived rounds-aloft limit and its conditional damage weakness
  without adding either to the existing unconditional damage-weakness list.
- Readable source text for every granted trait and the signature trait's negotiation edge.
- Narrowly necessary shared support: a movement-mode and conditional-weakness representation in
  the evaluation contract, the widened trait-source table, and the UI rows that display them.
- Source-derived expectations, a completed same-build Forge counterpart ledger covering every
  newly supported option, unit/persistence tests and CT114 browser evidence.

## Out of scope

- Any other ancestry, class or level. Devil's later-level changes (Wings' weakness ceasing above
  3rd level, Glowing Eyes scaling with level) belong to a separately scoped ancestry-level unit,
  per `V44-character-option-delivery.md` — carry-forward is recorded, not implemented here.
- Gameplay automation of any conditional or activated effect: Barbed Tail's once-per-round extra
  damage, Glowing Eyes' triggered action and roll, Hellsight's concealment exception, Prehensile
  Tail's flanking exception, Silver Tongue's negotiation edge, and all flight movement, elapsed
  rounds, falling and conditional weakness application. These remain manual, per
  `agent.MD` "Engine and history intent" and the V44 plan's out-of-scope list.
- Import/export adapters, source-pin upgrades, progression/level-transition support changes, new
  table controls, and edits to `docs/research/v1-wizard-coverage-matrix.md` (a generated source
  inventory, not a support tracker).

## Inputs and dependencies

Baseline: `main` at `342427d` (rebased forward from the original `656d831`; every commit in
between is documentation, so the application tree is still the V45 delivery at `ebe66e2`). Worktree `/srv/presidium/projects/salient/opus-characters`, branch
`slice/V46`. Vendored sources initialized at their recorded pins and unmodified:
Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` (rules authority) and Forge Steel
`5a846aadb623a9855a023e9403bb887a956c341f` (structure and reference application).

Hard dependencies, all merged and live: V45's extracted `shared/content/ancestries/devil/` and
`shared/evaluate/ancestries/devil.ts` module boundary, V37's supporting backgrounds and duplicate
skill replacements, and V40/V42's wizard entry and primary-choice presentation.

All dependency installation, builds, tests, servers and browsers run on CT114 through
`presidium-dev`, in the explicitly named isolated `characters` environment
(`https://salient-characters-dev-aa988a1a3752.tail41404c.ts.net`). The shared `main` environment,
which serves the user's playable app, is not touched by this unit.

## Deliverables

- `shared/content/ancestries/devil/level-one.ts`: all seven purchased-trait options supported,
  Glowing Eyes' ability grant, and the thirteen-value Silver Tongue support list.
- `shared/evaluate/ancestries/devil.ts`: the flight contribution, alongside the existing movement,
  saving-throw, no-kit stability and trait-assembly contributions.
- `shared/contracts/characterEvaluation.ts`: `GrantedMovementMode` and `ConditionalEffect`, with
  two additive optional `DerivedBaseline` fields.
- `shared/evaluate/sources.ts`: the trait source table widened to all seven traits.
- `shared/evaluate/character.ts`: the flight contribution called after class characteristics exist.
- `web/wizard/supporting-components.tsx` and `web/character-sheet/sections.tsx`: display of the
  movement mode, its derived limit and the conditional weakness, each with its condition.
- Tests: focused evaluator tests for every trait and the skill choice, negative cases for the
  budget and pool, parent-change removal cases, persistence readback, and a browser journey.
- `docs/build/evidence/V46/`: source-derived expectations, the option-to-witness ledger, the
  captured Forge exports and rendered evidence, command output and screenshots.

## Shared contract: consumer inventory and shape rationale

Recorded here at the integration lead's request, so the next unit does not have to re-derive it.

`DerivedBaseline` gains two optional fields. Both are additive; `BASELINE_KEYS` in
`shared/evaluate/character.ts` lists required fields only, so the `complete`-status contract is
unchanged, and `convex/characters.ts` stores `derivedBaseline` as `v.union(v.any(), v.null())`, so
no schema change is needed.

```ts
GrantedMovementMode { mode; sourcePath; ruleSourcePath?; condition?; provenance }
ConditionalEffect   { feature; effect: 'rounds-aloft' | 'damage-weakness' | 'extra-strike-damage';
                      condition; sourcePath; damageType?; amount: DerivedValue<number> }
```

Why not the existing fields:

- **`damageWeaknesses`** has no condition, and its one reader,
  `web/wizard/supporting-components.tsx`, prints it as a flat always-in-effect row. Wings' weakness
  would read as permanent.
- **`abilityModifiers`** is applied automatically: `convex/lib/resolve.ts` feeds it into
  `abilityDamageModifiers`, which `shared/resolve/index.ts` matches by keyword. Barbed Tail is
  once per round and optional, so an entry there would silently automate an elected effect.
- **`supportingChoices`** (V37) does carry `condition`, and was the closest existing fit, but it is
  keyed by decision id, rendered under "Supporting build choices" with background and complication
  choices, and carries no typed amount.

Consumers of a baseline, checked file by file at this commit. Readers of the two new fields:
`web/wizard/supporting-components.tsx` (`ConditionalBuildFacts`, which always prints the condition)
and `web/character-sheet/sections.tsx` (the `Movement` stats row). Nothing under `convex/` or
`shared/resolve/` reads either. Everything else treats a baseline opaquely: `convex/table.ts` reads
stamina, recoveries, winded, class and level; `convex/lib/characterBuild.ts` casts and copies;
`shared/evaluate/liveReconciliation.ts` reads only `staminaMaximum`, `recoveriesMaximum` and
`heroicResource.name`.

`effect` is a closed union on purpose. Each member is exactly one sourced sentence in this unit,
and a later unit extends it deliberately rather than inventing free-text categories. This is not a
general conditional-rules engine and must not grow into one without its own slice.

## Acceptance checks

1. **Option inventory.** Every one of the seven purchased traits and thirteen interpersonal skills
   is selectable, with its pinned source path, cost and support flag. Read back the assembled
   definitions through `getDefinitions()` and compare against the ledger in this document.
2. **Budget and pool.** Three points are spendable; any selection whose costs exceed three is
   `budget-exceeded`; a two-point selection leaving one point is the existing nonblocking
   `budget-unspent` warning; a non-interpersonal skill is `value-not-in-pool`. Verified by focused
   evaluator tests with expectations derived from the source, not from the evaluator.
3. **Permanent contributions.** Beast Legs sets speed 6 before kit contributions; Impressive Horns
   sets the saving-throw threshold to 5; Wings produces a Fly movement mode, a rounds-aloft limit
   of `max(1, Might)` and a conditional weakness 5; no other trait changes a numeric baseline
   value. Each contribution names its decision, selection and source sentence.
4. **Grants and readable text.** Selecting Glowing Eyes grants an ancestry ability with the trait's
   source path and no activation; every selected trait appears as a granted feature with its cost
   and source path; Silver Tongue grants the chosen interpersonal skill.
5. **Removal on parent change.** Deselecting a trait, changing the Silver Tongue choice and
   changing ancestry away from Devil each remove the corresponding speed, threshold, flight,
   weakness, ability, feature and skill contributions, while preserving independent class,
   background and authored choices.
6. **Persistence.** Save, reload and read the persisted build back through the application's shared
   operations: choices, grants and derived values match the in-editor evaluation.
7. **Forge counterpart coverage.** Every newly supported option appears in at least one completed
   same-build counterpart in the pinned Forge Steel application, with unmodified exported bytes,
   rendered evidence, recorded selections and independently source-derived expectations. Every
   difference is explained from the source; an unexplained mismatch blocks the unit.
8. **Regression.** Existing Fury level-one, Berserker Fury level-two and Polder/Elementalist
   results are unchanged, including provenance. Full `pnpm check` and `pnpm test:browser` pass on
   CT114 with the configured single workers.
9. **Independent review.** Implementation and rules reviews pass. The implementer does not
   self-certify.

## Ability design and playtest evidence

Not applicable as parser/engine ability execution: this unit adds no executed ability behavior.
Glowing Eyes is delivered as a readable granted ancestry ability whose trigger, roll and damage are
manual; it is not registered as an executable table operation and no ability handler changes. Its
grant and source display are covered by acceptance checks 4 and 6 and by the browser evidence.

## Rules research

Pinned Compendium paths read for this unit, all under `vendor/steel-compendium/en/unified/md/`:

- `feature/trait/devil/devil-traits.md` — three ancestry points; quick build.
- `feature/trait/devil/barbed-tail.md`, `beast-legs.md`, `glowing-eyes.md`, `hellsight.md`,
  `impressive-horns.md`, `prehensile-tail.md`, `wings.md` — costs and effects.
- `feature/trait/devil/silver-tongue.md` — signature trait, skill choice and negotiation edge.
- `skill/group/interpersonal.md` — the thirteen eligible skills.
- `movement/fly.md` — what flying means; full speed, vertical or horizontal, remain in midair.
- `rule/character/speed.md` and `chapter/ancestries.md` — ancestry baseline and budget context.
- `ancestry/devil.md` — ancestry identity and signature trait listing.

Mechanical claims this unit makes are enumerated with their exact source sentence in the
expectation ledger under `docs/build/evidence/V46/`. No claim is made that the pinned Compendium
does not state. Forge Steel is a structure and counterpart reference, never a rules source.

## Open questions

**None, and that is a result rather than an omission.** No question was appended to
`docs/rules-questions-for-user.md` by this unit, because the pin resolved every mechanic it needed:
the three-point budget and the four-point pair, Beast Legs setting rather than adding, the
saving-throw threshold, Wings' `max(1, Might)` limit and its untyped weakness while flying at 3rd
level or lower, Barbed Tail's highest characteristic score, Glowing Eyes as a triggered action, and
Silver Tongue's free interpersonal skill. Two readings that the source does not state outright are
carried as **labelled interpretations with their alternatives**, in
[the expectation ledger](evidence/V46/expectations.md), not as settled facts.

What is genuinely unresolved here is not a rules question but a **scope** one, and it is recorded
rather than asked: every Devil trait's gameplay behaviour — activation, once-per-round tracking,
concealment, flanking, flight movement and elapsed rounds, falling, and applying the conditional
weakness — is resolved at the table. The build records the readable text and the computed amounts
and stops there, deliberately. That boundary is listed in
[what this evidence does not cover](evidence/V46/README.md#what-this-evidence-does-not-cover), and
it is a later unit's work, not an ambiguity for the user to settle.

## Work log

2026-09-19, claim. Assigned by the character integration lead through Chords as the single pilot
unit gating release of the remaining level-one queue. Read `agent.MD`, `CLAUDE.md`,
`docs/build/README.md`, the V44 plan, `shared/content/character-options.md`,
`docs/research/devil-level-one-preparation.md`, `docs/build/character-verification.md` and
`docs/research/v45-reference-inventory.md`, then the pinned sources listed above.

Created `slice/V46` in `/srv/presidium/projects/salient/opus-characters` from `88d1e61` and rebased
onto the docs-only `656d831`. Initialized both vendor submodules at their recorded pins; no vendor
file is modified. `presidium-dev` in a sibling worktree fails with the recorded
`presidium-ssh: UNKNOWN_PROJECT` broker limitation, so remote calls run through a shim that changes
only the `presidium-ssh` subprocess working directory to the canonical managed checkout; the source
archive still comes from this worktree. Confirmed the named `characters` environment is stopped
with its data retained before claiming it.

Capture mode: the lead directed, and `character-verification.md` now records, that counterparts are
built in the real pinned Forge Steel web application served on CT114 rather than the public
website. This is recorded as a pinned-source capture, not current-website parity.

2026-09-19, implementation. Content module: all seven purchased traits selectable, the supported-set
metadata brought into line with the per-option flags, all thirteen Silver Tongue values supported,
and Glowing Eyes carrying an `ancestry-ability` option grant. No new mechanism was needed for that
ability: `shared/evaluate/character.ts` already maps an option grant of that kind to a granted
ancestry ability, and `contentFor` resolves the trait's own entry, so the card renders the trait
text and groups as "other" exactly as the kit signature ability does.

Evaluator: `applyDevilConditionalEffects` adds Wings' Fly movement mode, its rounds-aloft limit
`max(1, Might)` and its conditional damage weakness 5, plus Barbed Tail's extra strike damage equal
to the highest characteristic score. It is called after `deriveProfiles` rather than alongside the
existing `applyDevilMovement`, because characteristics for classes that use the shared class profile
are only set there; deriving it at the earlier site would silently omit both amounts for a Devil
Elementalist, which template D is specifically there to catch.

Contract: two additive optional `DerivedBaseline` fields, `movementModes` and `conditionalEffects`.
The conditional weakness is deliberately kept out of `damageWeaknesses`, whose single reader renders
it as always in effect, and out of `abilityModifiers`, which `convex/lib/resolve.ts` applies
automatically to damage. `ConditionalEffect` records `damageType: 'all-damage'` for Wings and cites
`rule/damage/damage-weakness.md` in its provenance, because an untyped "damage weakness X" applies
to damage of any type. The Wings weakness is gated on `ctx.level <= 3`, the literal source clause;
the guard is inert at both supported levels and exists so a later level unit cannot inherit the
weakness without verifying it.

Remote workflow: the sibling worktree hits the recorded `presidium-ssh: UNKNOWN_PROJECT` broker
limitation, so remote calls run through a shim that changes only the `presidium-ssh` subprocess
working directory to the canonical managed checkout. Note that `--env` must precede the `run`
operation; supplied after it, the argument is passed through opaquely and the job runs in the
default `main` slot. That happened once here, on a test run that found no matching files and
exited; build jobs mount no backend data, and the shared environment's source, data and services
were untouched.

2026-09-19, verification. Full `pnpm check` on the integration candidate passes: 297 engine tests,
407 app/script tests, links 266, vendor pinned, content 483, supporting 289, foes 438 and build.
The focused V46 suite failed 2 of 13 on its first run; both were wrong expectations in the new
tests, and both the failures and their corrections are recorded in
[the evidence README](evidence/V46/README.md#retained-first-run-failures) rather than quietly fixed.

2026-09-19, independent review and repairs. Two fresh-context agents were run under the
2026-09-19 subagent authorization in `agent.MD`: one derived the expected mechanics from the pinned
Compendium without reading the implementation, one reviewed the diff. The integration lead also ran
a static reviewer. Their findings and the repairs are recorded in
[the evidence README](evidence/V46/README.md); the substantive code repairs were:

- the grant note saying Glowing Eyes' trigger, roll and damage are resolved manually reached the
  evaluator but was dropped by the sheet's `grantedBy` projection, so the sheet showed a manually
  resolved ability with no sign that it is manual. The projection now keeps the note and the
  ability card renders it, and the browser journey asserts it on the persisted sheet;
- the conditional weakness recorded `allDamage`. The resolution contract documents `all-damage`
  for an untyped weakness (`DamageModifierEntry` in `shared/contracts/rollResolution.ts`); the
  older `damageWeaknesses` list spells it `allDamage`, and this field now uses the canonical form
  rather than copying the inconsistency;
- the rounds-aloft entry recorded only "While using your wings to fly", which left the amount
  ambiguous between a maximum and elapsed play state. It now records the whole sentence, and the
  display reads "maximum rounds aloft";
- the sheet rendered an empty padded row for every character with no conditional effects;
- a level-two Devil carry-forward test and a Silver Tongue change test were added, and two weak
  assertions were replaced: the ability-modifier check asserted a condition that was true for any
  Fury regardless of the implementation, and no test read the three trait sentences that no
  contribution consumes, so they could have drifted from the pin unnoticed.

Corrections to the record rather than the code: the slice goal claimed every conditional effect
stays "explicitly manual", which overstated what a sheet without a `ConditionalBuildFacts` section
shows; it now states precisely what is delivered. The expectations ledger was missing the rule that
makes an untyped damage weakness apply to any type, five source files from its provenance table,
the statement that Silver Tongue is free, and labels on two interpretations; and it gave the wrong
cause for template D's size change (Polder's 1S comes from its Small! signature trait, not from a
Polder-specific baseline). All are corrected there.

2026-09-19, process mistakes. Two, both mine, neither touching the shared environment's source,
data or services, and both reported to the integration lead rather than cleaned away:

1. `npx tsc --noEmit -p tsconfig.json` was run once in this worktree on Presidium, before I had
   switched to the remote workflow. `npx` fetched `tsc@2.0.4` into the user-level npx cache and
   printed its "this is not the tsc command you are looking for" banner; nothing was installed into
   the checkout, which still has no `node_modules`. All dependency, build, test and browser work
   since has run on CT114.
2. `presidium-dev run build -- pnpm exec vitest run ...` was invoked without `--env characters`.
   `presidium-dev` only parses `--env` before the operation for `run`, so the argument would have
   been passed through opaquely; supplied nowhere, the job took the default `main` slot and created
   one build container in the shared compose project. Build jobs mount source, dependencies, tools
   and artifacts but not backend data, and run `--no-deps`; the job found no matching test file and
   exited 1 immediately. The shared environment's recorded source is still `ebe66e2`, not dirty, and
   its backend and web containers have been up continuously since before this slice started.

A guard now stands in front of every `presidium-dev` call from this worktree: it refuses any
invocation that does not name `--env characters` explicitly, in a position it can see, and refuses
any other environment by name. Its refusal messages and a permitted call are recorded in
[the evidence README](evidence/V46/README.md#remote-workflow-guard).

2026-09-19, remaining acceptance gaps closed. The integration lead's audit named four; all four are
accepted and addressed, none contested:

1. **The whole configured browser suite**, not a five-spec selection. *(Superseded figures: this
   entry recorded 48 passed / 2 failed / 3 skipped in 19.6m — a 53-test suite, from a candidate
   that predates the three `v46-devil-persistence` journeys. It matches neither retained full run
   and is kept only as the record of what was claimed at the time. The delivered result is in
   [the evidence README](evidence/V46/README.md#full-browser-suite) and in the final work-log entry
   below: 48 passed, 5 failed, 3 skipped, exit code 1.)*
2. **A whole-build counterpart comparison**, not an ancestry-row one. The comparison now reuses
   V45's `projectForgeReference` for all thirteen witnesses and checks culture, career, class,
   subclass, kit, perk, inciting incident, nested choices, derived skills, languages, abilities,
   granted traits and features, and the rendered sheet, against both the source-derived
   expectations and Salient's own baseline. Running it found three real mismatches in my fixtures —
   a deferred language slot the Forge witnesses had completed, an interchangeable pair of free
   skill slots serialized the other way round from the V45 Bethell capture, and the authored name —
   plus two mistakes in the comparison itself. All are recorded and fixed; no Forge export was
   recaptured, because none of them was a defect in the captures.
3. **Actual persistence evidence.** All thirteen builds are now created, saved and read back
   through `characters:create` / `characters:save` / `characters:sheet`; parent-change removal is
   proved across a reload rather than by evaluation alone; and a Devil with Wings advances to
   Berserker Fury two through the real progression UI with live state preserved, the level-up in
   history, and the level-one build then **actually restored** through the ordinary owner-request
   and Director-approval path: equal to the original build with its flight and conditional amounts,
   live Stamina and Recoveries retained under the restored maximum, XP kept, authored details
   unchanged, and the restore recorded in history. The readbacks are retained.
4. **Records restated against the tested tree.** The evidence README now gives per-candidate test
   counts rather than one carried-forward figure, retains the check and browser logs, and keeps the
   remote-workflow guard and broker shim verbatim under `evidence/V46/tooling/`.

The shared Forge projection in `tests/helpers/v45-reference.ts` gained one feature type,
`Movement Mode`, which Wings nests. The V45 reference tests still pass unchanged, so the extension
is additive.

Closing verification, on the committed tree. `pnpm check`: 22 engine files / 316 tests, 47
app-and-script files / 407 tests (**723** total), links 268, both vendor submodules at their pinned
commits and unmodified, content 483 entries at `fb83a789da8f`, supporting 289 exact source records,
foes 438 stat blocks / 2006 features, lint and build clean. Browser: the whole configured suite at
48 passed / 2 failed / 3 skipped, both failures in specs this slice does not touch and both passing
on rerun (`v21-campaign` first rerun, `table-audit` on an isolated third run at 1.3m after failing
at two different points under suite load); the V46 journey and the three persistence journeys pass;
the V46 counterpart, V46 devil and unchanged V45 reference suites pass together at 39. The only
change after that run is the evidence and work-log text recording it, and `check-links` was rerun
over the documents afterwards.

Status: reviewed-ready branch handoff. NOT merged, not pushed, no hosted publication, and the
shared playable environment is untouched — its recorded source is still the V45 delivery. The
integration lead owns the independent review, the rules review and integration.

2026-09-19, fresh rules review. Verdict: changes required, record level only. It re-normalized and
re-checked every quote in the diff against the pin — all 27 quotes, all seven cost lines, the
thirteen interpersonal skill names — and all nineteen source hashes in the expectation ledger, and
confirmed every mechanical claim: the baseline, the three-point budget and the four-point
exclusion, Beast Legs setting rather than adding, the saving-throw threshold against the ordinary
rule, Wings' `max(1, Might)` and its untyped weakness at third level or lower while flying, Barbed
Tail's highest characteristic score, Glowing Eyes as a triggered action, and Silver Tongue being
free with exactly the interpersonal pool. It found no invented rule and no automation of a
conditional effect, and confirmed both interpretations are labelled with their alternatives.

Its two findings are fixed:

- the expectation ledger still said the weakness is recorded as `allDamage`, the literal this slice
  had already renamed to `all-damage` in the code and tests. A ledger that disagrees with the tests
  derived from it is the wrong way round, so the ledger is corrected;
- the base-statistics decision carried a note claiming the baseline sentence is "absent from
  `chapter/ancestries.md`; present only in the clean Heroes text". It is in the unified tree, at
  `rule/character/speed.md` — the path the evaluator already cites for this contribution. The claim
  predates this slice, but it sits in the file this unit edits and concerns the baseline its
  arithmetic rests on, so the note is corrected rather than left.

One observation was also acted on: the sheet's `Movement: Fly` stat row sat beside Speed with no
condition, which could read as `fly` in the speed entry — unconditional flight under the movement
rule, and the opposite of what this unit is careful about everywhere else. The row now marks a
gated mode and carries the verbatim condition, with the full text still in the conditional section
below; the browser journey asserts both.


2026-09-19, second independent implementation review and the repairs it forced. Its blocking
finding was evidence correspondence: the retained logs were older than the candidate they were
filed against — engine 304 against a claimed 316, a 53-test browser log against a 56-test tree,
and a screenshot predating the conditional marker. That is not a test-count nit and it is not
answered by argument, so it is answered by two named runs whose logs carry the runtime's own
`presidium-dev status` block, and by labelling the superseded logs historical instead of quietly
replacing them.

Four of its other findings were real defects rather than documentation gaps, and each is worth
recording as a defect:

- **The authored-text check was vacuous.** All three persistence journeys built their payload as a
  name plus three empty strings, so `expect(restoredSheet.authored).toEqual(before.authored)`
  compared nothing to nothing and would have passed a restore that wiped every field. Fixed by
  giving each hero distinguishable text in all three fields and asserting they are non-empty before
  comparing.
- **Two expectations were re-derived from the code under test.** `rounds-aloft` was checked against
  `Math.max(1, baseline.characteristics.M.value)` and Barbed Tail against `Math.max(...)` over the
  baseline's own characteristics — the evaluator's output used to compute what the evaluator's
  output was then checked against. Both now assert the fixture ledger's constant first.
- **Level-one Stamina was read out of the application**, and level two was only `toBeGreaterThan`.
  Both are now constants derived from the pin in the test's own comment — `class/fury.md:41` and
  `:43`, `kit/mountain.md:21`, `rule/general/echelon.md:11` — giving 30 and 39, asserted exactly.
- **The removal journey retained nothing.** It now writes `persisted/removal-readback.json`.

The lead's corrections to my own claims are recorded because they were right and I was wrong:

- I wrote that the eight tables in `convex/schema.ts` were the whole schema. They are not; the file
  spreads seven further modules for 33 tables. The absence claim now covers all 33 and is stated as
  build-time equipment conservation, not inventory preservation, because a mutable inventory is not
  implemented at all.
- I reported five V46 browser tests. There are four: three `v46-devil-persistence` journeys and
  `v46-devil`.
- I quoted `presidium-dev status`'s `identity` field as evidence of which candidate a runtime held.
  It is not: it read the same value across two different commits. The `commit` field is the one
  that distinguishes them, and the evidence now also carries a tree hash and an application-file
  fingerprint.

The guard had one more hole than the first repair closed. The real CLI is
`argparse.ArgumentParser(prog='presidium-dev')` with `allow_abbrev` at its default, and `--env` is
the only option beginning with "e", so `--e`, `--en` and `--env` are one option and the last
occurrence wins. `--env characters --en main run build` passed the strict-prefix guard and would
have run against `main`. The guard now refuses all six spellings; the sixteen verified cases are
retained in `evidence/V46/tooling/guard-cases.log`, run against a fake downstream that executes no
workload.

One piece of evidence could not be retained and is disclosed rather than dressed up: the
`Q(foes:catalog)` function-timeout line behind the `closeout` failure was read live from the
backend container, and `up --replace` recreated that container at 19:57:19 while preparing the
final candidate. The line is quoted with that stated; the Playwright screenshot of the same failure
is the artifact that survives.

2026-09-19, delivered candidate `cc7d4ac`. `pnpm check` passes: lint and Prettier clean, engine 22
files / 316 tests, app and scripts 47 files / 407 tests, links 269 files, both submodules at their
pins and unmodified, content 483 entries at `fb83a789da8f`, supporting 289 exact source records,
foes 438 stat blocks / 2006 features, build clean.

**The whole browser suite did not pass: 48 passed, 5 failed, 3 skipped in 18.6m, exit code 1.** All
four V46 browser tests passed. The five failures are `closeout.spec.ts:21`, `combat.spec.ts:31` and
`wizard.spec.ts:23` waiting on combat-flow controls, and `table-audit.spec.ts:40` and
`v21-campaign.spec.ts:23` waiting on the `Campaigns` heading after `Create account`. None is in a
file this unit changes.

The comparison worth having is that the previous candidate `c715f60` failed three of the same
assertions, and **its application code is byte-identical to this one**: `git ls-tree -r <tree> --
convex shared web | sha256sum` is `1c7bf6e63546…` for both, and the diff between them over those
paths is empty. The same application went from three failures to five. That rules out the
application delta as the difference between the two runs; it identifies nothing about what the
difference was, and nothing is claimed. Three different Convex queries hit the 1s function limit
across the two runs — `foes:catalog`, `events:list`, `targets:drafts` — none of them a surface this
unit touches. Runtime conditions and the mid-run capacity change are recorded in
`evidence/V46/runtime/load-during-cc7d4ac-suite.log` as observation, with the per-failure timing
against the 20:08 stop, and explicitly not as a cause.

No assertion, timeout or backend limit was changed in response to any of it.
