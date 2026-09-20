# V83–V84 independent source review

Reviewer: fresh Astra source reviewer (`supporting_source_review`), 2026-09-20.
Candidate: `slice/V83` working tree in `.worktrees/supporting-actions`.
Rules authority: Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
No implementation authorship, Opus inputs, browser, service or test execution by this reviewer.

## Consultation verdict

**Source semantics pass; formal acceptance remains pending.** The lead must supply the finished
candidate, full-check and live public-API results before this becomes the formal rules review.
This review does not certify all perk effects or all level-one supporting choices complete.

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

## Formal acceptance evidence

Pending the lead's completed full check, public-API report and independent implementation review.
No remaining source-semantic blocker identified in this consultation.
