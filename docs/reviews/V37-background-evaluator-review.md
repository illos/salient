# V37 background evaluator review

Status: **passed for integration after corrections and inspected remote evidence**, 2026-09-17. Independent review of lead-owned evaluator changes;
not a review or self-certification of this researcher's background/kits definitions or tests.

Reviewed `shared/evaluate/character.ts`, `structure.ts`, `definitions.ts`,
`shared/content/supporting-replacements.ts`, `character-decisions.ts`, and the character evaluation
contract against the pinned Compendium and both V37 research ledgers. This is static review;
the lead owns CT114 execution. Findings refer to the worktree before the first remote check.

## Original findings — resolved by static re-review

1. **Build blocker: `removed` used before declaration.** In `character.ts:skills()`, the `chosen`
   list calls `.filter(skill => !removed.has(skill.name))` before declaring `const removed`.
   Move the declaration before use. A normal build without removals still executes this path.

2. **False complete: Mundane loses all three permanent immunities.**
   `deriveSupportingBenefits():amountOf` recognizes numbers, `3 * echelon`, `level - 1` and
   `highest characteristic`, but omits `level`. Mundane's corruption/holy/psychic immunity modifiers
   all use `value: 'level'`, and are silently skipped. At level1 they must each be1; at level2 each2.
   Source: `en/unified/md/complication/mundane.md` (“immunity to corruption, holy, and psychic damage
   equal to your level”). Add a direct level interpretation and contrasting level assertions.

3. **False complete: a removed skill can satisfy an owned-skill prerequisite.**
   `knowledgeCandidates()` resolves positive grants/collisions but ignores explicit skill-removal
   selections. Ivory Tower's lost skill is removed by `skills()` only after `validate()` has used
   the positive-grant candidates to validate Area of Expertise/Specialist targets. A target can
   therefore survive despite its sole skill grant being removed. Separate the source-selection
   view used to choose a removal from effective owned knowledge used by modifier targets, and
   validate targets against the latter. Preserve Shared Spirit's separate nuance: a conditional
   skill can remain owned while unavailable to the current controlling spirit; this is different
   from actual loss. Sources: `complication/ivory-tower.md`, `perk/area-of-expertise.md`,
   `perk/specialist.md`; Q-CHAR-11 applies to positive grant collisions, not loss.

4. **Progression invalidates Following in the Footsteps at the moment its benefit should apply.**
   The future-ability choice is filtered by `higherLevelThanCurrent` using `definitions.level`.
   An ability chosen legally at level1 with a level2 requirement fails that filter when the hero
   advances to level2, including if they learn the selected ability. The source says to reduce its
   cost once learned, not choose a different future ability on each level-up. Retain the original
   selection context/level or equivalent validated history and use current knowledge separately
   to apply the benefit. Source: `complication/following-in-the-footsteps.md`.

5. **Following in the Footsteps cost floor is1, not0.**
   `deriveSupportingChoices()` clamps modified costs with `Math.max(0, ...)`; its source benefit
   has minimum1. Apply the source-specific minimum and retain provenance for the original cost and
   its adjustment. This may not hit the floor in the presently supported Fury ability set but is
   still an incorrect implementation of the declared mechanic.

6. **Linguist acquisition must reject already-known languages.**
   The legacy `languages()` duplicate-language diagnostic is warning-only. Linguist specifically
   grants two **new** languages, so a reused known language cannot be declared complete as one of
   those two. The background implementer is adding an owned-language exclusion to that specific
   decision; verify the root owned-pool post-validation rejects reuse while preserving the earlier
   career-language policy. Source: `perk/linguist.md`. This note identifies the evaluator boundary;
   independent approval of the background module remains another reviewer's responsibility.

## Other observations

- Q-CHAR-11 replacement decisions cover occurrence2 and3 and retain the old Magic replacement ID.
  Ensure the supported content really cannot grant a fourth fixed copy before using that hard
  limit as the general evaluator contract; source entitlements are not intrinsically capped at3.
- Raised by Beasts removes culture choices/skills/edge and leaves Caelian through explicit
  conditions. The later availability sweep is needed because complication selection follows culture
  in definition order. Exercise both a clean new build and an existing culture being pruned on change.
- Source kit signatures include their damage/distance bonuses. The evaluator must cite the newly
  supplied `KIT_BONUS_SOURCES` for omitted-zero ordinary bonuses and split Stormwight sources rather
  than constructing a sentence at the kit-entry path that does not exist there.
- Initial career rewards and complication starting Wealth/Renown are build values distinct from
  current campaign resources. The derivation itself need not spend/reissue them; activation and
  persistence require the lead's separate review.
- No explicit repeated-perk acquisition prohibition was found in the core Perks chapter or general
  creation text. Do not invent one from the skill-collision ruling. This review does not authorize
  stacking repeated effects.

## Re-review

On 2026-09-17 re-read the lead's corrected `character.ts`, `structure.ts`, definitions/input wiring,
and the independent complication implementer's new `convex/lib/characterChoiceOrigins.ts` and
`tests/app/characterChoiceOrigins.test.ts`. Followed `convex/characters.ts` through preview, full-edit
save, progression preview/finalization and historical restore. This remains a static review; no
local runtime, build or tests were executed.

- Finding 1: the removed-skill set is declared before the final output filter; no read remains
  before that declaration.
- Finding 2: `amountOf` now resolves `level`. Mundane's three immunity fields enter the ordinary
  sourced immunity path at the current hero level. Existing immunity values use the greater
  applicable immunity rather than summing independent sources.
- Finding 3: `knowledgeCandidates` excludes actual selected removals for owned modifier targets.
  Removal pickers still inspect the pre-removal knowledge set, avoiding self-invalidating choices.
  Shared Spirit's conditional ownership remains separate from permanent skill loss.
- Finding 4: trusted origins record a selected ability and its original level outside client-written
  selection data. An unchanged prior reference preserves that level only if its original class,
  specialization and higher-level eligibility were source-valid. Changing the reference starts at
  the current level. The pool applies the old level only to that exact currently selected value;
  other newly chosen abilities still must be future abilities at the current level.
- Finding 5: ability cost adjustments now record minimum1 and clamp reduced costs at1.
- Finding 6: the generic owned-pool validator uses the Linguist decision's new-language exclusion.
  The background module itself still requires review by someone other than its author; this
  re-review checks the root evaluator integration, not independent certification of that module.

The server preview reconstructs origins from owned persisted data. Full-edit saves write canonical
origins; advancement uses the immutable effective base and retains the earlier origin when learning
the selected ability; restore copies the selected historical snapshot's origins and recorded
evaluation without rewriting history. Public mutations accept no origin parameter. Definitions
carry a cloned context, preserving the cached base tables.

The new origin tests assert level-one Wrecking Ball remains selectable at level two while newly
selected Special Delivery does not, reject incompatible Fury aspects, check a previously invalid
aspect cannot manufacture an earlier legal origin, and exercise persisted advancement, preview,
unchanged edit, changed invalid edit and historical restoration. They assert Wrecking Ball costs3
after learning it. The Fury level2/6/9 granting features establish aspect-specific pools; the
eligibility records preserve those distinctions. A lightweight JSON source-data inspection found
all70 eligibility-record minimum levels agree with their ability source paths. This is not a claim
to implement additional class or specialization trees.

The supporting numeric derivation is now gated by `supportingChoicesVersion`, retaining legacy
fixture provenance. Initial career rewards precede complication additions/overrides and the
Betrothed cap. Stamina modifiers precede recalculated recovery/winded thresholds; Wodewalker's
recovery bonus follows that baseline. Ordinary kit numeric provenance is corrected using the
actual kit/table source map. Stormwight records remain excluded from the ordinary kit selector;
their existence in the catalog does not claim an implemented Stormwight path.

**No remaining blocking defect was found in the reviewed root evaluator/origin changes.** Final
acceptance remains subject to the lead's complete CT114 checks and browser evidence. The reviewed
focused tests did not yet include explicit contrasting Mundane level1/2 immunity assertions or an
Ivory Tower removed-skill modifier-target rejection; these regression cases were requested from the
lead for remote coverage. Passing older test snapshots does not verify newer changes.

### Independent complication catalog follow-up

After completing the separate Director-setup implementation, reviewed the other implementer's
`supporting-complications.ts`, `supporting-complication-abilities.ts`, choice construction and
integration with the root evaluator. These files were not authored by this reviewer. A lightweight
source-data read compared all100 authored complication entries with the ledger's fixed skills,
permanent modifiers, granted abilities and initial-state intents: no field omissions or differences
were found. All40 permanent-modifier quotes occur in their pinned source bodies after normalizing
Markdown links and punctuation. This checks the transformation against the research; it does not
substitute for the pinned-rule review of conditional timing or the remote evaluator tests.

Checked the high-dependency paths independently: new versus owned skills, Promising Apprentice's
independent crafting target, Ivory Tower's three-choice loss pool and dead-language pool, Shared
Spirit's conditional sets, Shipwrecked's actual known-language removal, the separate Dragon Dreams
two-point budget/Wyrmplate prerequisite/immunity parameter, Loner's optional respite configuration,
and Footsteps' future class/aspect versus known heroic-ability references. Source-granted abilities
retain their parent or canonical ability source and Dragon Dreams availability remains conditional.
Initial item selections preserve the selected treasure reference and absent/broken/possessed state;
spending, companion play and revelation remain outside this build slice.

No additional blocking catalog/evaluator finding emerged from this follow-up. The later private
setup activation guard was authored by this reviewer and is independently reviewed in
[Director setup activation review](V37-director-setup-activation-review.md), not certified here.
The source-data reads above are not an application test run. Complete CT114 evidence is pending.

## Final evidence closure

Inspected [the final CT114 check log](../build/evidence/V37/integration/check-final.log) on
2026-09-17. It records passing lint/format checks, engine and web TypeScript checks, 274 engine
tests and 374 app/script tests (648 total), source/link/vendor verification and a completed production
web build. The supporting inventory check verifies 289 exact source records and the expected
18 careers/108 incidents, 13 culture aspects, 47 core perks, 57 skills plus 5 groups, 42 languages,
25 kits and 100 complications.

The run includes the 101 supporting-coverage cases, 21 complication cases, 46 background cases,
two persisted choice-origin cases, five private-choice cases and seven Director-setup lifecycle
cases. Inspected the requested contrasting regression in `tests/supporting-coverage.test.ts`:
Mundane has exactly corruption/holy/psychic immunity equal to level at levels 1 and 2, and Ivory Tower
removing Alchemy invalidates an Area of Expertise target of Alchemy. Both earlier regression-coverage
requests are therefore closed. Passing tests authored by this reviewer are execution evidence,
not independent review of their implementation.

Also inspected [the final browser log](../build/evidence/V37/integration/browser-final.log): V25,
V32 and both V37 journeys passed, including persisted supporting choices, nested-target pruning,
private Director setup and sourced character sheets. The sole V21 old-label assertion failure was
corrected in the test and [its separate rerun passed](../build/evidence/V37/integration/wizard-final.log).

No remaining blocker is identified in the independently reviewed root evaluator, origin integration
or complication catalog. This closes the earlier remote-evidence caveats for the integration
candidate. Shared rollout/merge verification belongs to the lead. Independent approval of this
reviewer's background modules and Director-setup implementation remains in the other reviewers'
reports; this document does not self-certify those files.
