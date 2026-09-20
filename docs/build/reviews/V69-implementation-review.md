# V69 character integration independent implementation review

Reviewer: Astra `integration_audit`, 2026-09-20. Candidate: `ab0f2fd` on `slice/V69`.
The reviewer did not implement the application or tests and ran no runtime or browser workload.

**Implementation verdict: pass; no blocking code or test-value findings. Overall acceptance remains
pending live headless verification, fresh rules review and genuine Forge counterparts.** This is not
a delivery or main-merge verdict.

## Evidence and scope

Inspected the retained CT114 [full check log](../evidence/V69/check-fixed.log) and
[exit status](../evidence/V69/check-fixed.exit): exit 0, 310 engine tests and 427 app/script tests,
with lint, formatting, TypeScript, content validation and build passing. The
[focused log](../evidence/V69/focused.log) and [exit status](../evidence/V69/focused.exit) record
11 passing Hakaan/Orc tests and successful corpus generation. These are inspected execution
artifacts, not independently rerun checks. The earlier failed check is preserved separately.

Reviewed V70/V71 decision modules and evaluators, their shared registration and evaluation order,
content selections/generated entries, both focused test files, and V69's headless runner additions.
Also revisited the integrated V65 discovery/transition and shared choice-change implementation from
the earlier static audit. The formal review also covers preserved V57/V58/V60/V61 production and
non-browser test changes in the character delta `b6109b0..ab0f2fd`; unrelated engine changes are
outside this review. The new ancestry modules reuse existing authenticated persistence and
authorization; no new write path, schema or permission mechanism is introduced.

## Implementation findings

Hakaan and Orc are registered as supported choices and their decision families are appended once.
Their permanent contributions run after class/kit values and before supporting modifiers. Invalid
purchased choices are excluded by the existing validated selection context, so over-budget immunity
does not leak into partial results. Conditional effects remain readable rules rather than permanent
health, speed, characteristic or recovery bonuses.

Orc Artisan uses `selectionRole: skill-target`. Both the generic skill collector and duplicate-skill
validation distinguish that role from a skill grant. Its two selected crafting targets remain visible
in supporting choices without adding training or ordinary skill bonuses. The purchased-trait
condition participates in existing dependency pruning, including ancestry replacement.

All new trait directories are included in the generated corpus. Headless assertions now require
nonempty purchased-trait content, repairing the earlier name-only coverage gap. The explicit local
`content` assertion in `ab0f2fd` preserves that requirement while narrowing its nullable type.
Hakaan's saved replacement now exercises public transition/save/readback, verifies removal of Big!
and weakened immunity, and retains authored details. Orc's saved parent edit removes Artisan's
stored targets and projected trait. No direct database mutation substitutes for either journey.

The earlier static source consultation used only pinned Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`, including the Hakaan/Orc trait directories and crafting
skill group. It found no source discrepancy. This implementation review does not replace the
separately required fresh rules review. No Opus material was consulted.

## Preserved ancestry implementations

The combined passing check supplies the previously missing post-integration evidence for this
formal code/test-value review of Devil, Polder, Dwarf and Human. Their earlier preliminary reviews
were inspected alongside the actual candidate code; their old browser failures are not treated as
current blockers under the moratorium.

Devil's changes enable its existing seven trait options and thirteen interpersonal skill choices;
they do not replace shared cost, collision, grant or numeric derivation. Polder removes three support
overrides while preserving four-point validation and its existing numeric contributions. Neither
change turns conditional trait text into unconditional mechanics. No implementation defect found.

Dwarf and Human register independent decision families and generated source content. Both run after
class/kit derivation, including the no-kit path, and before complication benefits. Dwarf adds stability,
weakened immunity and Spark's Stamina contribution, recalculating recovery/winded before later
supporting bonuses. Human adds recovery capacity rather than healing value. Their purchased
contributions use validated selections, and their source-specific identifiers avoid confusing
similarly named complication choices. Replacement follows existing dependency pruning. No
implementation defect found in either module or its integration.

This closes the code/test-value review gap for these four preserved units on this candidate. It does
not close fresh rules review, the upcoming live run, or missing authentic Forge counterparts. Polder's
retained actual comparison remains evidence for its recorded build; it does not certify the other
ancestries. Incomplete Forge coverage still blocks their merge/acceptance under the existing policy.

## Test value

- Devil's three cases cover all newly enabled skill grants and collisions, legal trait combinations
  with conditional effects excluded from permanent values, and removal of the new grants after
  ancestry replacement. Named source-derived option lists are content assertions, not a duplicated
  rules evaluator. No removal is warranted.
- Polder's two evaluator cases cover the new movement bundle and the mixed old/new budget boundary.
  Its app case adds authenticated admission/readback, actual rule text, approved replacement and
  preservation of nondefault live resources. Direct database setup creates the nondefault resource
  precondition; the operation under test still uses save/submit/approve. This persistence coverage
  is distinct from the evaluator cases and the previous quick-build fixture.
- Dwarf's six cases cover kit stacking and health division, no-kit/Wodewalker ordering, immunity
  versus resistance-only Might, remaining purchases and readable runes, invalid-budget bonus leakage,
  and removal of ancestry benefits. Human's four cases cover recovery count versus healing across
  class paths, remaining manual purchases and signature content, invalid-budget leakage, and
  ancestry replacement. Their per-content numeric/budget assertions protect different source
  configurations; they are not redundant replicas of the generic validator.
- Hakaan's five cases distinguish large size and readable Doomsight; no-kit immunity versus
  resistance-only Might; the remaining manual-strength purchase; invalid-budget immunity leakage;
  and stale size/immunity after ancestry replacement. Expected mechanical values are source-derived
  constants, including the corrected explicit Might and potency expectations.
- Orc's six cases distinguish kit/no-kit stability and unchanged healing; slowed immunity versus
  conditional speed; owned/unowned Artisan targets without training; missing, repeated and
  noncrafting targets; invalid-budget immunity leakage; and purchased-parent/ancestry cleanup.
- Live additions exercise deployed discovery, save retries, fresh readback, source projection and
  parent replacement. These catch transport, deployed-content and persistence failures that pure
  evaluator cases cannot. Compatible purchases share witnesses; the changes do not multiply browser
  cases or create a new harness.

No redundant or implementation-mirroring test requiring removal was found. Live witnesses are
implemented but were not yet reported as executed at this review boundary; record their actual
result separately. Broader per-option reference coverage remains incomplete and is not implied by
this implementation pass.
