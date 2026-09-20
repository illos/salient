# Character verification with Forge Steel examples

**Confirmed by the user, 2026-09-15.** Use characters built and exported from Forge Steel as
concrete comparison examples for wizard development. **Updated with user approval, 2026-09-20:**
retained authentic exports or reproducibly constructed characters using pinned Forge Steel code
and definitions satisfy the reference requirement without a browser. Verify their choices, grants
and calculated values against the pinned Steel Compendium before adopting them as expected results.

This procedure applies to the eleven-class character track. It supplements the existing slice
checks and independent reviews in [the build process](README.md#verification-baseline). Keep
evidence in the owning slice and class notes; use the existing coverage report and status tracker.

## 1. Choose a useful target

Select the ancestry, class, subclass and level relevant to the slice, with explicit sourcebooks
and other choices. Include Beastheart/Summoner when working on their editor support. Avoid the
unrestricted random generator as a source of assumed in-scope, valid builds.

Choose examples that exercise the behavior being implemented: ordinary creation, nested domains,
two kits, companion/portfolio grants, a changed parent choice, or a level transition. Start with
small complete cases and broaden as coverage grows. One character is not evidence for every
branch of its class. Eventually cover every transition, including 3→4, 6→7 and 9→10 boundaries.

### Vary ancestry as well as class and level

Use paired examples with the same class, subclass and level but different ancestries. Keep
background and class selections constant where legal; record any changes required by ancestry
dependencies or duplicate grants. This isolates ancestry contributions instead of changing every
part of the build at once.

For example, compare the existing Polder Elementalist reference with a Dwarf Elementalist at the
same level. Establish the chosen traits and their effects from the Compendium; check that class
grants remain correct while ancestry grants, derived contributions and relevant abilities change.
Also change ancestry on an existing draft to verify removal of old grants and preservation of
independent choices and authored details.

Spread the broader fixture set across all twelve core ancestries and their distinct choice
patterns, including point budgets, nested/former-ancestry dependencies and shared skill grants.
Add source-backed cases for meaningful class/ancestry interactions. Do not require the complete
ancestry × class × subclass × level Cartesian product; select contrasting cases and use focused
tests for the underlying rules and known interactions. The Polder/Dwarf pair is a planned example,
not an already completed or verified fixture.

## 2. Build and capture the reference

Use either a retained authentic Forge Steel export or a reproducible programmatic counterpart
constructed with the pinned Forge Steel factories, definitions and selection/calculation logic.
A website capture is not required. Browser work remains suspended under the
[moratorium](README.md#browser-testing-moratorium--2026-09-20); retained website evidence may be
reused only for the behavior it actually proves, and never from the abandoned Opus pilot.

For programmatic counterparts, calibrate the adapter against retained genuine exports before
using its generated witnesses as proof. Execute Forge's own completeness and calculation paths;
validate allowed options, prerequisites, selection counts, point budgets and nested choices.
Do not assume that assigning selections to an object makes a legal completed character. An adapter
may translate exact selections and normalize output, but must not replace Forge's game calculations
or selection semantics with mocks, replicas or hand-authored expected Forge stats. Unsupported
semantics must fail closed and identify the unproved scope rather than silently skip a check.

Retain the raw export or generated Forge character, the reproducible input selections and command,
and captured Forge output with a readable JSON comparison report. The report must expose the
completeness result and the choices, grants and derived values actually compared. Record any
intentionally deferred choices; an incomplete build can test draft behavior but is not a
completed-character target.

Alongside the example, record:

- Capture/run date, Forge source revision or observed website version, and enabled sourcebook IDs.
- Target ancestry/class/subclass/level and exact selections, including nested choices.
- Raw artifact location and fingerprint, plus readable output and comparison evidence locations.
- Pinned Compendium and Forge Steel revisions, adapter revision and calibration evidence.
- Unsupported semantics, omitted comparisons and any source/version differences.

Retain original exports unchanged. Store normalized selections, independently source-derived
expectations and citations with the automated fixture. Local ignored `.playtest/` artifacts are
useful inspection evidence, but are not portable test fixtures: record that limitation until the
required data is available to the normal checkout. Do not depend on the live website during routine CI.

A retained website export may be newer than our pinned source. Record differences explicitly;
generating or calibrating a counterpart never authorizes an automatic dependency update.

## 3. Establish the expected build independently

Separate embedded definitions, actual selections, automatic grants and live state. A level-one
export can contain definitions through level ten and all subclass branches. Those records are
not all active, and they do not supply a history of completed higher-level choices.

Trace the active selection path and grants against the pinned Compendium. Use the vendored Forge
Steel code to understand factory defaults, ordering, dependencies and serialization. Check:

- Choice eligibility, counts, budgets, prerequisites and nested selections.
- Automatic, selected and conditional grants, their recipients, and the levels where they apply.
- Every implemented trait/feature's explicit or embedded action grants, including dependent
  selections and play state. Distinguish granted actions from passive modifiers; preserve the
  granting trait and source timing. Apply the project-wide
  [trait-granted ability gate](README.md#trait-granted-ability-completion-gate), even when Forge
  omits an action or represents it differently.
- Characteristics, Stamina/Recoveries, movement values, skills/languages, features and abilities.
- Kit/enchantment/other contributions already included in printed ability values.
- Companion or summon definitions and their derived grants, separately from live creatures.

Write expected results from this evidence before running our evaluator. Do not derive test
expectations by calling the implementation under test. If Forge Steel or a PDF disagrees with the
pin, record the difference and investigate it. Correct our implementation when the source supports
the correction; preserve an explained source/version difference when the reference differs. An
unresolved mismatch is not a parity pass. Use the existing question process for material ambiguity.

## 4. Recreate and verify through Salient

Enter the exact same supported choices through Salient's authenticated CLI/API operations shared
with the wizard. Save and read the persisted build and evaluated sheet back through the API.
Compare choices, grant membership and derived values with both the captured Forge result and the
independently established source expectations. Record explicit mappings where the apps use
different identifiers; a similarly named option is not proof of the same selection. Check readable
feature/ability content and distinguish permanent build calculations from manually resolved gameplay effects.

For trait-granted actions, verify the action-list entries as well as the retained trait text.
Exercise the supported operation for changing any granting play state, such as the active dwarf
rune, and independently read back the state and resulting sheet. Prove grant, replacement and
revocation, absence when ineligible, and preservation of unrelated build/live values. An unselected
nested state does not cover its granted action. Keep these cases in the existing option coverage
and evidence rather than adding a parallel checklist. Independent review must check source-based
action coverage; agreement with Forge alone cannot establish completeness.

Exercise the relevant negative/change cases: incomplete drafts, illegal options, parent changes,
removed grants, duplicate entitlements or deferred selections. Verify existing campaign review,
ownership and combat-lock behavior where the slice touches it. Draft evaluation must not reset
live resources, spawn summons or repeat one-time grants.

Run the owning slice's required evaluator, persistence and repository checks; browser checks are
suspended under the [moratorium](README.md#browser-testing-moratorium--2026-09-20) and logged in
the [backlog](browser-coverage-backlog.md) instead. A mutation
response alone is not proof of saved behavior. Mechanical changes still require independent
rules review; agreement with Forge Steel does not replace it.

## 5. Verify advancement and later interchange

For progression, retain completed exports or programmatically constructed Forge counterparts
before and after a chosen transition. Complete each level's choices and record the expected added,
removed and changed grants and values. Verify our
scoped level-up and history restoration against those observations, including retained inventory
and the confirmed live-value policy. A high-level export alone does not establish earlier choices.

When the adapters are implemented, reuse these examples for:

1. Forge Steel export → our import → persisted build/state comparison.
2. Edit or advance in our app → compatible export → reopen in Forge Steel.
3. A character created entirely in our wizard → export → reopen in Forge Steel.

Compare semantic choices, grants, customizations and state after Forge Steel's import refresh.
Valid JSON or a successful download is insufficient. Unknown/unmapped data needs explicit
preservation and diagnostics. These checks remain later adapter work until implemented; the
current export inspection is not a successful round trip.

## Report the result

Use a short evidence table in the owning slice, with links to reusable class notes:

| Check | Expected and source | Observed and evidence | Result |
| --- | --- | --- | --- |
| Target choice/grant/value or workflow | Independent expected result and pinned citation | Actual saved/read-back result or artifact | Pass, fail, explained reference difference, or not verified |

Record editor/build coverage, gameplay automation and interchange coverage separately. Preserve
useful class findings for the parser, engine and UI tracks: timing, grant recipients, shared state,
dependencies, verified cases and unresolved questions. Do not generalize a single example or
case-specific user ruling into an unverified class-wide rule.

## Per-option delivery gate

**Confirmed by the user, 2026-09-19.** Deliver each ancestry or class at an individual level in
its own implementation commit, compare options with Forge Steel counterparts of the same build,
run a full audit after the initial work, and merge each commit once full verification passes.
The [initial delivery plan](V44-character-option-delivery.md) defines the engineering scope of each
unit as all applicable branches/options, keeps shared prerequisites separate, uses carry-forward
checks for unchanged ancestry levels, and schedules foundation plus first-batch audits. Those are
implementation choices under the confirmed policy, not separately confirmed product rulings.

Maintain an option-to-fixture ledger: every delivered selectable option appears in at least one
legal completed Forge Steel counterpart with the same build in Salient. Cover nested selections,
automatic grants and derived values as well as displayed option names. Use multiple counterparts
for mutually exclusive choices and meaningful interactions; a full Cartesian product is unnecessary.
Retain portable raw exports or reproducible generated Forge characters, readable Forge output and
comparison reports, exact selections, versions and independently source-derived expectations.
Programmatic counterparts must meet the calibration and completeness requirements above; this
changes the evidence route, not the per-option coverage or independent rules-review gate. Historical
examples count only for the behavior their retained evidence actually proves; an inspected export or a Salient-only fixture is not a parity pass.

Unexplained mismatches block verification. Source-backed Forge differences require a recorded
explanation and independent review. If Forge cannot represent the same source-legal build, record
the precise limitation and closest comparison, mark exact counterpart coverage incomplete, and
resolve that gap before claiming the unit fully verified. Never silently waive counterpart coverage.

Before merging each implementation commit, complete full repository checks (and browser checks
once the moratorium is lifted) on the
integration candidate, persisted readbacks, independent implementation/rules reviews and the
existing commit gate. Then update and verify the actual shared development app under the standing
merge-completion procedure. Run a full independent audit after the initial shared foundation and
again across the first integrated option batch, including cross-option interactions and regressions.
This user authorization covers incremental verified merges; no further routine merge permission
is required. Failing required checks remain blockers, including unresolved runtime timeouts.

## Existing examples and format research

- [Actual live Elementalist export inspection](../forge-steel-interchange.md#live-export-inspection--2026-09-15)
  and [metadata](../research/forge-steel-live-export.json): embedded future definitions and actual selections.
- [Official pregen PDFs](../research/official-pregen-pdfs.md): independent sheet comparisons,
  supplementing higher-level, supplemental-class and interchange examples.
- [Forge Steel interchange research](../forge-steel-interchange.md): nested selections, refresh
  behavior, state conversion and compatibility limits.
