# V83–V84 independent source review

Reviewer: fresh Astra source reviewer (`supporting_source_review`), 2026-09-20.
Candidate: `e39ce7e46eaddb384caf69bbab1e8f33240e45df` on `slice/V83`, including ENGINE V72
`dbfb61d`; later evidence/report changes contain no executable changes.
Rules authority: Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
No implementation authorship, Opus inputs, browser, service or test execution by this reviewer.

## Final verdict

**Pass for the bounded V83/V84 rules and programmatic proof scope.** The independent
implementation review is complete and passed; this fresh source review follows it. Reviewed the
finished candidate, retained integrated check/build stages, runtime/deploy metadata, live public-API
report and updated specifications. No unresolved source or proof blocker remains. Main/shared-app
delivery is still separate and pending. This does not certify all perk gameplay effects, browser
acceptance or all level-one supporting choices complete.

## V83 findings

Independently read all 47 core perk bodies, all 21 ordinary kit signatures and the relevant
catalog, projection and payment code. Supplemental Beastheart perks and Stormwight kits remain
outside this scope. The [perk ledger](../V83-perk-action-audit.md) and
[kit ledger](../V83-kit-action-audit.md) correctly distinguish standalone actions from modifiers
to existing tests, ordinary activities, build choices and passive benefits.

All 24 `PERK_ABILITIES` source passages occur verbatim in their indicated pinned source files.
The three existing embedded abilities preserve their printed main/maneuver timings. The five
additional explicit combat actions preserve main, maneuver, triggered and free-triggered timing.
The remaining activities retain durations or unspecified timing instead of inventing free combat
actions. Familiar has two separately labelled restoration alternatives, as the source requires.
The granting perk remains independently readable. Catalog names qualifying unnamed prose
operations are application labels, not claimed source headings.

Two early metadata findings were corrected and re-read:

- Creature Sense may select any creature within 10 squares. Target level determines whether it
  reveals keywords, rather than whether the hero may attempt the maneuver.
- Thingspeaker first determines whether an object has emotional resonance. Resonance is required
  for the answers, not to begin sensing. Its additional-question bane and reuse restriction remain
  stated.

All 21 ordinary kits grant exactly their existing signature; none requires an additional action
invented from its movement or conditional-damage clauses. The shared embedded extractor preserves
printed keywords, targets, distances, roll expressions, tiers and full effects. In particular,
comma-separated characteristic alternatives remain printed alternatives; extraction does not
establish automatic execution support. Arcane Trick retains all seven effect choices. Kit bonuses
remain already included in signatures. Dual Wielder's same-roll sequence remains part of Double
Strike, rather than another granted attack.

Familiar restoration's **one Recovery payment without healing** is correct. The new resource
branch debits the current Recovery pool through the existing journal and does not write Stamina.
The respite alternative has no payment. Zero Recoveries must block the paid alternative; persisted
payment, unchanged Stamina, refusal, undo and replacement are verification obligations, not facts
established by reading this code.

Lie Detector's one hero token is preserved as a fixed unsupported resource. Refusing execution
without that pool is the honest boundary; recording a free successful use would be incorrect.
This remains an explicit capability gap, so V83 cannot establish that every perk is fully playable.

## Manual conditions and completion claims

Companion destruction/restoration, Friend Catapult's Victory reset, Thingspeaker's lingering bane,
spatial/narrative eligibility and downtime/project outcomes are not automated here. The retained
source and manual-use result disclose this boundary. Familiar's destruction precondition is
explicitly labelled manual in its grant. A familiar actor/subsystem is not needed to make the
existing selected perk's restoration action available.

This is consistent with the project's supported-data/manual-gameplay scope, provided delivery
claims remain about action exposure and the specific persisted operations actually proved. It is
not proof that these play-state restrictions are automatically enforced. Selected-perk membership
and removal are conditional grants and must be proved through saved readbacks; Recovery payment
is a separately implemented state operation and must be proved as such. Modifiers such as Brawny,
Inspired Artisan and Team Leader do not gain counterfeit standalone action types in this pass;
their coupled test/payment behavior remains future work.

## V84 findings

Independently compared every row in `shared/content/culture-presets.ts` with the Background
chapter's **Typical Ancestry Cultures Table** and **Archetypical Cultures Table**. All **11 ancestral
and 16 professional presets** match their environment, organization and upbringing. All eleven
printed ancestral language defaults match. Professional cultures correctly have no invented
language default; the existing language choice supplies it.

The chapter expressly permits a different hero ancestry from the ancestry associated with a
culture, and expressly permits modifying the sample cultures. No ancestry eligibility gate is
appropriate. There is no Revenant row: the source explains that revenants acquire their ancestry
after death. Existing aspect/language decisions remain the actual mechanical choices; a preset
only fills defaults and introduces no extra feature or skill grant.

The shared choice transition fills those decisions, preserves ancestry and permits modification.
Changing a printed default marks the selection Bespoke; that presentation is compatible with the
source. Professional language selection does not discard the professional label because the
table prescribes no language. An optional preset decision avoids invalidating existing saved
cultures. Persisted cross-ancestry choice, editable defaults, eligible skill preservation/pruning
and Bespoke behavior still require the finished candidate's headless evidence.

## Initial proof review

**Independent proof review passes for the bounded V83/V84 scope.** Read the assertions in
`scripts/headless/supporting-actions.ts`, `scripts/headless/culture-presets.ts`, the culture
transition tests and `tests/app/perk-legacy.test.ts`, and inspected the lead's live report
[initial live report](../evidence/V83/headless-initial.json). The report records source
`2a8844e59bff30786f82edc64eca3edd1be7339f`, target `http://backend:3210`, run
`ab82d584-a97d-441d-82fc-4b1f31fa3d34`: **31/31 pass in 80.865 seconds**. The runner is CT114
environment `supporting-actions`, compose `salient-supporting-actions-dev-d21ad518e747`, against
its isolated anonymous development Convex deployment. This reviewer did not execute or author
those proofs.

The new public-route scenarios establish:

- Saved readbacks for every one of the 24 perk action entries, with retained feature, provenance,
  exact multiplicity, grouping and removal on replacement; all 21 kit signatures are successively
  saved and projected with only the current signature, main-action metadata and printed tiers.
- Familiar's recorded manual use with one persisted Recovery debit and unchanged other live state,
  zero-Recovery refusal, exact undo/redo, free respite alternative, foreign-caller refusal and
  effective versus pending grants across Director approval. Creature Sense and Arcane Trick add
  prose versus embedded table witnesses; Lie Detector proves the unsupported pool blocks use
  without live-state changes.
- All 27 culture defaults are obtained independently from the book tables and compared with
  actual saved choices on a human. Existing ancestry purchases, authored details and live values
  remain unchanged; professional rows preserve the chosen language. A modified Dwarf environment
  persists as Bespoke with its name and unaffected organization skill retained. Foreign transition
  access is refused. Focused transition assertions separately distinguish retained legal children
  from pruned invalid children and cover each editable default.

These witnesses exercise behavior rather than repeating an application catalog. The legacy perk
fixture's direct database patch is appropriately limited to representing a pre-V83 stored build
whose retained Familiar perk has no extracted abilities. Both public read projections recover the
action and its cost without rewriting that stored baseline; new-build persistence is proved by
the separate public-route scenario. This catches a distinct backward-compatibility failure.

The evidence does **not** claim every perk's manual effect executed, every kit's combat effect
automated, or all temporal/spatial conditions enforced. That is the same bounded scope reviewed
above. No additional redundant run is required by this review.

## Integrated acceptance

The [implementation review](V83-V84-implementation-review.md) now passes, explicitly excluding
its author's own public-action proof from the independent test-quality verdict. This source
review independently covers that proof as described above. Re-read the corrected legacy fixture:
its revision evaluation now uses the actual `baseline` key, and the owner-sheet audience narrowing
is correct. These changes strengthen the intended historical read projection without new rules.

Inspected the [integrated live report](../evidence/V83/headless-integrated.json): **31/31 pass**,
no failures/skips, **72.199 seconds**, run `5cabe99f-08b5-4994-aced-b4fef39ee96a`, same isolated
CT114 environment. The report's manually supplied source field incorrectly says
`e39ce7e2def154271548eb49709976ee70f7e8fd`. The independently retained
[runtime metadata](../evidence/V83/runtime-integrated.json) and
[deployment log](../evidence/V83/deploy-integrated.log) identify actual clean source
`e39ce7e46eaddb384caf69bbab1e8f33240e45df` with unchanged pinned submodules. The raw report remains
unaltered and the [evidence record](../evidence/V83/README.md) explicitly corrects this provenance
label. No repeated behavior run is needed solely to replace that label.

The [integrated check log](../evidence/V83/check-integrated-report-stale.log) records lint,
**339 engine + 514 app/script tests**, links, source pins, content, supporting inventory and foes
passing, then stops on the stale generated V72 compatibility report. Regeneration adds twenty
manual compatibility entries (53 to 73), leaving compiled six and unavailable four unchanged.
This is a report-data correction, not additional effect automation. The
[remaining build log](../evidence/V83/build-integrated.log) records successful report check,
type checking, production build and budgets; the lead confirmed command exit zero. All required
repository stages have passed after that correction. The interrupted run is retained and is not
represented as one uninterrupted passing invocation.

Updated V83/V84 specs, wizard spec, workflow and handoff keep culture defaults editable and
ancestry-independent, preserve the explicit HeroToken/manual-condition limits, and distinguish
this isolated acceptance from pending main delivery. No rules-contract expansion or new browser
acceptance was introduced. Final delivery wording should replace now-stale “review/build pending”
status lines once the lead records these completed reviews and the actual main/shared-app outcome.
