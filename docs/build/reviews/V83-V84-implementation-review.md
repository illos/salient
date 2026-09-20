# V83–V84 independent implementation review

Reviewer: Astra `supporting_proof`, 2026-09-20.
Candidate: `2a8844e` on `slice/V83`, plus the reviewed admission-test expectation correction
and existing-culture heading correction in the working tree.

## Scope and independence

Reviewed the lead's culture catalog, definition composition, shared choice transition, wizard
controls, character/table ability projection, embedded-ability extractor and Recovery payment
changes. Also reviewed the culture and embedded-source tests authored by the lead. This reviewer
authored the supporting-action public scenarios and their app wrapper; those are explicitly
excluded from this review's independent test-quality verdict. The source review remains separate
in [the rules review](V83-V84-source-review.md).

No browser, service startup or additional test run was performed for this review.

## Consultation result

No implementation defect found in the reviewed scope. Formal acceptance awaits the final full
check and live public-API evidence. The initial review identified a compatibility-proof gap: new-build persistence tests alone did
not exercise an old baseline missing its actions. The lead added a focused historical-baseline
regression. Review confirmed its effective sheet/table assertions exercise the repaired reads;
a revision fixture used `derived` instead of `baseline` and was returned for correction before
formal acceptance.

## Culture integration

- Both supported definition levels compose the optional preset before the existing Raised by
  Beasts suppression is applied. Existing characters without a preset remain valid. The new
  option does not add skill, language or numerical grants of its own.
- The UI delegates every preset edit to the same `changeChoice` used by the public transition
  query. One transition supplies the name, aspects and any printed language default, then calls
  the existing dependent-choice pruning. Professional presets preserve the freely selected
  language. Neither application nor removal touches the ancestry selection.
- Customizing a named default changes only the starting-culture marker to Bespoke. Selecting
  Bespoke keeps the existing choices. Removing a preset does not remove its resulting editable
  culture. Invalid preset values remain ordinary evaluation errors rather than new grants.
- The preset decision is subject to the existing owner-only wizard context and canonical source
  construction. No new mutation, private-data exposure or save authorization bypass is added.
  Draft/proposed/effective revision boundaries remain those of the existing character workflow.
- Static UI review confirms the grouped selector is reachable, has an accessible label, invokes
  the normal dirty/save path, and leaves aspect, skill, language and name controls editable.
  The final heading correction describes older no-preset characters as Bespoke culture rather
  than No culture. Visual/browser acceptance remains deferred by the moratorium.

The lead-authored culture tests have distinct failure targets: compare every catalog row to the
pinned source table; prove ancestry independence and selective child pruning; prove customization
and professional-language semantics. Their expected source values are not copied from the new
catalog. The public culture scenario separately proves all 27 choices persist through the API,
retains authored fields/live state, and denies a foreign owner its transition route.

## Supporting actions and projection

- `perkAbilities` requires both the granting perk name and source path. It removes managed stale
  perk actions before adding current grants, preserves unrelated abilities, and carries the
  granting decision and exact source provenance. Character and table reads both apply it to
  stored baselines, so a pre-extraction baseline can expose actions without rewriting live state.
- Effective table actions still use the effective baseline. Character-sheet projection uses the
  requested revision's perks and abilities together. The new projection does not approve or
  activate a draft implicitly.
- Embedded extraction starts at an exact named heading, respects the next heading and the end
  of a source blockquote, and keeps original text separately from normalized metadata. Sheet
  and table now share this extraction. Missing sections return an explicit failure and remain
  manual rather than executing invented metadata. Kit signatures keep bonuses-included status.
- The lead-authored extraction tests catch loss of comma-separated characteristic text,
  blockquoted headers, multiline effects and section boundaries. These are different failures,
  not duplicate counts or assertions against the parser's own generated output.
- The admission test's corrected Pain for Pain group is a necessary changed-behavior expectation:
  its printed Main action belongs in the main group. The other baseline action groups remain
  individually asserted.

## Payment and journal

The new `recovery` resource lookup reads the existing Recovery pool with legal floor zero. Both
manual and rolled payment call sites pass the resource identity into the journaled debit. A
Recovery debit changes only Recoveries, preserving Stamina and the heroic resource. No healing
operation is invoked. Existing affordability waivers apply only to supported Ferocity/Essence
outside combat, so neither Recovery nor HeroToken gains a waiver. An absent HeroToken pool and
zero Recoveries produce the existing `ability.blocked` result before payment or action tracking.
Undo/redo use the ordinary recorded journal rather than rerunning the ability.

This is action exposure and supported manual-use/payment coverage. Familiar entity state,
narrative/spatial conditions, project outcomes and reuse limits remain manual. Lie Detector is
visible but blocked until a HeroToken pool exists; it is not a fully playable completed perk.

## Verification received

The isolated CT114 public-API report for candidate
`2a8844e59bff30786f82edc64eca3edd1be7339f` records 31/31 scenarios passing in 80.865 seconds
against `http://backend:3210`. This reviewer inspected the report; the lead executed it. Two
subsequent changes correct a stale test expectation and the no-preset UI heading; neither
changes the headless behavior. The historical-baseline regression is additional test-only work.
Final full-check evidence and the corrected historical fixture remain to be recorded.
