# A02: Minimal wizard, admission review and character sheet

| Field | Value |
| --- | --- |
| Family | A |
| Milestone | v0.01 |
| Owner type | App team |
| Rules review | required (the evaluator implements R02 formulas) |
| Depends on | R01, R02, R03, S01, A01 |
| Unblocks | A03 (hero roster), A09 |
| Status | see `STATUS.md` |

## Goal

Deliver the minimal level-one devil Fury wizard as a real decision flow over the R01 table, the pure
evaluator implementing R02, admission of the evaluated hero into a campaign under the review rules, and
the v0.01 character sheet both standalone and in the table's heroes pane. A loaded fixture behind a
mock wizard does not satisfy this slice.

## Spec references

- `docs/character-wizard-spec.md#v001-scope`, `#3-decision-system`, `#4-wizard-flows`,
  `#main-creation-and-editing`, `#7-revision-and-review-lifecycle`, `#9-shared-operations-and-reliability`,
  `#11-acceptance-scenarios`
- `docs/character-wizard-spec.md#6-ownership-attachment-and-permissions`
- `docs/character-sheet-spec.md` — all sections.
- `docs/table-spec.md#party-sheets-and-resource-visibility`, `#character-sheet-lock-during-encounters`,
  `#persistent-values-and-manual-adjustment-entries`
- `docs/accounts-and-access-spec.md#characters`, `#7-character-visibility-and-delegated-play` (peers see
  Stamina and Recoveries; notes owner-private)
- `docs/fury-level-one-decisions.md`, `docs/character-derived-values.md`, `docs/live-state-initialization.md`
  (R01 to R03 deliverables)
- `docs/pre-alpha-design-gaps.md#confirmed-first-acceptance-journey`

## In scope

- Wizard UI over the R01 JSON: every step in source order, source text panel per option, live "hero so
  far" summary from the evaluator, save draft and reopen, at least one supported option per step and the
  full pool visible with unsupported options labeled.
- Evaluator `shared/evaluate/character.ts` implementing R02 with provenance; run as a shared operation
  `characters.evaluate`; results persisted on the revision (`derivedBaseline` populated, status from the
  contract).
- Admission: submit for Director review; Director approve/decline through registered operations; owning
  active Director's own admission logged without approval; withdraw undecided submission; pending edits
  leave the effective build unchanged; combat lock respected (the lock itself is applied by A04).
- Live state initialized per R03 on first admission; draft saves never touch live values.
- Character sheet: compact header (identity, Stamina current/max/temp with winded, Recoveries with Catch
  Breath control wired to A05 when it lands, heroic resource, surges, Victories, turn state placeholder),
  body order Actions and abilities / Conditions / Features and modifiers / Character details; expandable
  source text; grouping by Main actions / Maneuvers / Move / Triggered using only source metadata;
  condition toggles rendered from R05's list (toggle operation itself in A03); Director editable persistent
  numbers producing Manual adjustment entries; hero selector for multi-character users.
- Standalone character page and the same component in the table heroes pane.
- Remove the paper-sheet fields that the spec excludes (dying tracker, empty enchantment panels).

## Out of scope

- Reaver and Stormwight Fury creation (Q-R-103, confirmed 2026-09-14): v0.01 supports Berserker only.
- Level-up, progression history UI, duplication, detachment UI, Forge Steel import (V08, V09).
- Inventory or starting equipment (V07).
- Any class-resource automation; Ferocity is an editable counter with readable rules.
- Mobile layout.

## Inputs and dependencies

R01, R02, R03 committed; S01 content available; A01 registry for the sheet's operations. If A03 is not
yet merged, condition toggles and Catch Breath render disabled with a visible "pending A03/A05" label,
not a fake handler.

## Deliverables

- `web/wizard/**`, `web/character-sheet/**`, `shared/evaluate/character.ts`
- `convex/characters.ts` extended: evaluate, submit, approve, decline, withdraw, adjust persistent value
- Tests: evaluator against the three R02 examples; admission authority matrix; draft save leaves live
  state unchanged; Manual adjustment entry shape
- Browser test: create the fixture hero through the wizard, submit, approve as Director, view sheet as
  owner, peer and observer

## Acceptance checks

1. Walking the wizard with the hero-fixture choices yields an evaluated baseline equal to the R02 complete
   example, read back from the revision document.
2. Leaving the kit unselected yields status incomplete with a diagnostic naming the kit decision id;
   over-budget traits yields invalid.
3. A player's submission is not effective until Director approval; the Director's own hero is effective
   on submission with a logged entry; withdrawal before decision works.
4. Saving a draft edit after admission leaves current Stamina and every live value unchanged (read back).
5. Peer view shows Stamina and Recoveries only; owner notes are absent from the peer and Director query
   payloads (not merely hidden in UI).
6. Every ability on the sheet shows verbatim source text from S01; no ability appears that the baseline
   does not grant.
7. Director edit of Victories from 0 to 1 produces a Manual adjustment event with before/after values.
8. Rules reviewer confirms the evaluator's arithmetic against R02 and the Compendium.

## Rules research

R01 to R03 are the research; the implementer does not re-derive. If a formula in R02 cannot be
implemented as written, stop and raise `Q-A-n`; do not adjust the formula.

## Open questions

- Q-CHAR-1 answered 2026-09-14: no. Do not present the Complication step in the v0.01 wizard.

## Work log

### Question audit follow-up: Q-A-200

The temporary A03 baseline bridge is [engineering follow-up](../rules-questions-for-user.md#q-a-200-how-should-a-heros-stamina-maximum-recoveries-and-characteristics-reach-the-table-before-a02),
not a new user decision. Deliver the evaluated baseline and sourced first-admission values already
required here, then retire the provisional maximum-entry fields and supplied-score dependency for
evaluated heroes. Verify the shared table operations use the recorded baseline. This does not
establish permanent maximum overrides or claim the integration is already complete.

### Plan (2026-09-15, implementer)

Files: `shared/evaluate/{character,sources,definitions,draft,structure}.ts` (the R02 evaluator and
its presentation helpers), `convex/lib/characterBuild.ts` (evaluation entry, first-admission live
values, activation, combat lock), `convex/lib/characterOperations.ts` (registered
`character.submit|withdraw|approve|decline`), `convex/characters.ts` (evaluate, sheet and review
reads, admission wrappers), `convex/characterTables.ts` (revision evaluation fields, R03 live shape,
`characterReviews`, `unreconciled`), `convex/lib/tableOperations.ts` (baseline-fed
`/hero recover`, `/test roll`, `/adjust`), `web/wizard/`, `web/character-sheet/`,
`web/characters.tsx`, mounts in `web/table/index.tsx` and `web/campaigns.tsx`. Tests:
`tests/character-evaluator.test.ts`, `tests/app/characters.test.ts`, `tests/app/admission.test.ts`;
the app fixture (`tests/app/fixtures/table.ts`) and the browser hero fixture admit their hero through
the real path. Dependencies R01, R02, R03, S01, A01, A03 and A04 are real; no fixture stands in.

### Implementation notes (2026-09-15)

- **Evaluator.** `evaluateCharacter(input, definitions)` reproduces the three R02 examples
  byte-for-byte (`tests/character-evaluator.test.ts` compares whole results, including every
  provenance entry). Engineering choices within the R02 vocabulary, labeled here: a legal option
  R01 marks unsupported yields `unsupported-option` and its grants still appear in the partial (the
  option is legal; only the application does not offer it), so a Panther kit shows no kit numbers
  rather than invented ones; the same value twice in one `multi` or `points` decision is
  `count-mismatch` (invalid); a `null` slot in a non-deferrable `multi` is `required-choice-missing`
  (incomplete); a mismatched definitions version or revision is `definition-mismatch` under the key
  `definitions`. Steps with `presentedInV001: false` (the complication step, Q-CHAR-1) are skipped
  entirely: never a diagnostic, never a grant.
- **Admission model.** `characters.campaignId` is set only by activation (approval or the owning
  Director's logged submission); a pending submission is a `characterReviews` row and reserves the
  attachment (a second submission anywhere is refused until withdrawn or decided). Pending heroes are
  not in the roster and cannot act. A save after submission marks the review `stale`; approval of a
  stale submission is refused and the owner resubmits. Withdraw and decline are not blocked by the
  combat lock because they change no effective build; submit, save and approve are (A04's
  `requireCharacterEditable`).
- **Live state.** `liveState` is the R03 shape with `origin.kind = 'first-admission'`; the A03
  provisional shape and the `stamina-maximum` / `recoveries-maximum` verbs are removed (Q-A-200,
  option A as recommended). `/hero recover` reads the maximum and recovery value from the effective
  baseline, `/test roll` reads the characteristic from it (`value=` is refused when it disagrees, and
  still accepted as a supplied fact only for a hero without a baseline, which admission never
  produces). A later activation compares `staminaMaximum`, `recoveriesMaximum` and the heroic
  resource name and records `UnreconciledMaximumChange` entries (Q-CHAR-2) on the character; the
  sheet shows them. No v0.01 supported path changes a maximum, so this branch is exercised only for
  the "same build, new revision" case in tests.
- **Sheet audiences.** `characters.sheet` returns three shapes: owner (with notes), Director of the
  attached campaign or of a campaign with a pending submission (no notes; the `proposed` view shows
  the submitted revision), and peer members of the attached campaign (name, Stamina and Recoveries
  with their maxima). Anyone else is refused. Ability metadata is the entry's frontmatter only; the
  kit's signature ability (carried by the kit entry, which prints no ability frontmatter) groups as
  "other" with its text readable. The Catch Breath button renders disabled with the "pending A05"
  label; the existing FreePlay `/hero recover` control stays beside it.
- **Table pane.** The sheet is mounted inside A04's hero rows below the turn controls (one open sheet,
  a text selector for the others), so A04's markup and turn-taking behavior are unchanged.
- **Browser fixtures.** `tests/browser/local-fixtures.ts` now admits heroes through the CLI
  (`characters:create/save/submit/approve`) instead of importing rows; `table-audit.spec.ts` and
  `combat.spec.ts` were updated accordingly but not run (below).

### Verification (2026-09-15)

- `pnpm check`: clean after each commit (lint, engine 57 tests, app and scripts 232 tests, links,
  vendor, content, build).
- Acceptance 1: `tests/app/characters.test.ts` saves the hero-fixture choices and reads the revision
  row back: status `complete`, `derivedBaseline` equal to the R02 complete example
  (`shared/content/character-evaluation-examples.json`), `characters.evaluate` returns the same.
- Acceptance 2: same file; no kit gives `incomplete` with `kit.choice: required-choice-missing`,
  Impressive Horns + Wings gives `invalid`; both equal the R02 examples and persist on the revision.
- Acceptance 3: `tests/app/admission.test.ts`: a player's submission leaves `effectiveRevisionId`,
  `liveState` and `campaignId` null and the hero out of the roster; players and observers cannot
  approve; withdrawal, decline, stale-after-edit and the combat lock are read back from the review
  and character rows; approval sets the exact revision, the R02 baseline and the R03 first-admission
  values (30 / 0 / 10 / ferocity 0 / 0 / 0 / 0 / nine toggles off); the Director's own submission
  is effective at once with a `logged` review and an event that says so; a retried command id
  admits once.
- Acceptance 4: the same file adjusts Stamina to 12, toggles prone, saves an incomplete draft and a
  complete one, has the complete one approved as a full edit, and reads `liveState` back unchanged
  after each step; the owner's effective sheet still shows Stamina 12 while the draft preview is
  labeled `draft`.
- Acceptance 5: owner payload carries the note; Director payload has no `notes` key and no note
  text anywhere in its JSON; the observer's payload is exactly name, owner, Stamina and Recoveries
  (with maxima); an outsider is refused; a pending unattached hero is invisible to peers.
- Acceptance 6: the seven R02 abilities, in order, each with `content.text` byte-equal to the pinned
  vendor file; nine features with entries likewise; the culture edge has none (clean Heroes text).
- Acceptance 7: `/adjust victories value=1` yields `manual.adjustment`, description
  "Manual adjustment — Thorn Victories 0 → 1.", `data.before/after` 0/1, the journal row
  `liveState.victories` 0 → 1, persisted 1; a player is refused; the provisional verbs are absent
  from `commands.list` and the four `character.*` operations are present.
- Acceptance 8 (rules review): pending.
- Browser walkthrough: run against an isolated local deployment (`.convex/local` in this worktree,
  Vite on port 5181, `tests/browser` through a config pointing at that port) after fixing a
  pre-existing deploy blocker found on `main`: pushing the functions failed with
  `Failed to analyze commands.js: ... is not iterable (registry.ts)` because
  `convex/lib/combatOperations.ts` imports `bindActor` from the registry, which imports it back;
  `bindActor` now lives in `convex/lib/actors.ts` (the registry re-exports it). A second fix found
  live: `convex/characters.ts` imported the content barrel (every entry's text) for its path map,
  and the cold module load pushed a submit past the 1 s mutation limit; it imports `manifest.json`
  only. With both: `journey.spec.ts` (updated for the wizard entry), `table-audit.spec.ts`
  (admitted heroes; timeout raised to 360 s), `combat.spec.ts` (A04, heroes admitted through the
  CLI) and the new `wizard.spec.ts` **pass**. The wizard spec walks every presented step with the
  supported options (unsupported ones disabled and labeled), reads an option's source text, sees
  Stamina maximum pending before the kit and 30 after, saves and closes, submits, the Director views
  the proposed sheet without the note and approves from the campaign page, and the sheet reads
  30 / 30 and 10 / 10 with the note for the owner, without the note for the Director, and Stamina
  and Recoveries only for a peer.

### Unfinished (2026-09-15)

- `pnpm test:browser` as configured (port 5180) was not run; the specs ran through an equivalent
  config against this worktree's isolated deployment.
- No detach or duplicate operation (out of scope); no restore of pending-review UI beyond the
  campaign page queue and the character page badges.
- Independent review and rules review not requested (deferred to the user's audit thread).

### User decision follow-up: Q-R-100

Show Caelian as automatically known, with a short common-tongue explanation; it stays visible but
cannot be selected as an extra language or consume a culture/career slot. Update the original paid
Caelian fixture selection, the R01/R02 JSON mirrors, evaluator expectations and wizard presentation
together under [the owning contract](../character-wizard-spec.md#3-decision-system). Use the normal
choice flow or an explicit source-supported deferred slot; do not silently pick a replacement or
count Caelian twice. The existing complete-with-warning fixture result is superseded. This records
the decision, not a completed fixture/evaluator/UI repair.

### User decision follow-up: Q-R-101 and headless assignment

Display all characteristics; class-assigned scores are filled and locked, and a new build's other
slots are blank. Offer the chosen source array's assignable numbers as drag-and-drop values, one
use per value, with any ordering across assignable characteristics. Do not prefill the fixture's
assignment. Saved builds reopen with their recorded choices. See
[the owning decision system](../character-wizard-spec.md#3-decision-system).

The user explicitly reaffirmed headless equivalents for all such UI interactions. Use one shared
assignment operation for named-characteristic input and drag-and-drop, preserving fixed scores and
validating the chosen array. Verify both paths persist identical assignments and produce the same
baseline, including repeated array values, a partial assignment, reassignment, and refused attempts
to change fixed values or use values outside the chosen array. Remove resolved Q-R-101 uncertainty
labels in the build artifacts. This handoff records requirements, not completed implementation.

### User decision follow-up: Q-R-102

The v0.01 creation language pool contains only spoken languages from the printed ancestry and
Vaslorian regional tables, with shared names deduplicated. Dead languages are excluded; Caelian
remains visible as automatically known, without consuming a selection. Use the same allowed pool
for UI and headless input. Update the obsolete Q-R-102 unresolved label in the R01 content artifact
and verify the pool against [the wizard contract](../character-wizard-spec.md#3-decision-system).
Later acquisition and V1 custom-language policy are separate from this answer.

### User scope clarification: Berserker only

The user explicitly excludes Reaver and Stormwight from v0.01. Keep the supported creation path
Berserker/Mountain; broader source eligibility does not enable additional playable choices. Enforce
the same subset through UI and headless operations. See
[the owning scope](../character-wizard-spec.md#v001-scope). This is a scope decision, separate from
verification of the source's kit restrictions for later Fury aspects.

The requested [Q-R-103 source check](../research/fury-kit-eligibility.md) supports ordinary kits for
Berserker/Reaver and the four Stormwight kits for Stormwight, through the separate granted features
and source sections. Do not use a Martial-only metadata filter. Q-R-103 is resolved; remove its
obsolete unresolved labels while keeping the confirmed Berserker/Mountain prototype subset.
