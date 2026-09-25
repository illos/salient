# Questions for the user

This file is the only channel from build and rules threads to the user. Build threads append here and
keep working on what does not depend on the answer. The user works through open rows in a standalone
thread, records each decision in the owning specification, and marks the row resolved with a link.

Rules for entries:

- Rules questions cite the pinned Compendium paths that were read (`vendor/steel-compendium/...`).
  No web sources, no memory of other editions, no guess presented as a rule.
- Every question carries a recommendation, so the user can answer "yes" or redirect.
- Ids are `Q-<series>-<n>`. Series: `TS` table spec, `ARCH` engine/data/tech, `CHAR` characters,
  `ACC` accounts/product, `REC` decision record and status docs, `HAND` handoff/commands/mockups,
  `R` rules-contract slices, `A` application slices, `V` V1 slices.
- One row per question. Do not merge questions, and do not reopen a resolved row; add a new one.
- Before adding or asking a question, check the owning spec, resolved entries and decision record.
  Cite the remaining undecided behavior explicitly; do not ask the user to reconfirm a settled policy.
  Track temporary engineering dependencies separately from questions that require a user ruling.
- Answering here does not change a spec. The spec change is a separate `docs` commit citing the id.

## Template

```
### Q-XX-n: <short title>

- **Status:** open | deferred YYYY-MM-DD (resumption condition) | answered YYYY-MM-DD | resolved (link to spec commit or section)
- **Raised by:** <slice id or audit>, YYYY-MM-DD
- **Where:** <spec file#anchor, and Compendium paths read>
- **Conflict or gap:** two or three sentences.
- **Options:** A / B / C, each one line.
- **Recommendation:** one option and the grounds (cited text or existing ruling).
- **Blocked until answered:** what cannot be built, or "nothing; default applied provisionally".
- **Answer:** (user fills in)
```

## Open questions

None in this reviewed queue as of 2026-09-15. The user answered or deferred all 13 questions from
[the pinned-rules/specification audit](research/remaining-character-questions-review.md). The three
items below are deferred until after the narrow playtest; their recommendations are not rulings.
Other future design work remains in its owning specifications, including class reconfiguration
workflows beyond the language/kit decisions in Q-CHAR-5. This closes the reviewed question batch,
not implementation or playtest verification.

### Q-CHAR-15: Does Dragon Dreams permit Prismatic Scales without Wyrmplate?

- **Status:** resolved 2026-09-17 — [supporting-choice contract](v1-character-wizard-contracts.md#dragon-dreams-prerequisite-q-char-15)
- **Raised by:** V37 supporting-choice research
- **Where:** `vendor/steel-compendium/en/unified/md/complication/dragon-dreams.md`;
  `vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/prismatic-scales.md`
  and `wyrmplate.md`.
- **Conflict or gap:** Dragon Dreams grants two points of purchased Dragon Knight traits but
  does not grant the Wyrmplate signature trait. Prismatic Scales costs one point yet requires
  choosing an immunity supplied by “your Wyrmplate trait.” Q-CHAR-7 concerns Revenants and remains
  deferred; it supplies no ruling for this separate complication.
- **Recommendation:** Require Wyrmplate for Prismatic Scales; show its source but make it
  unavailable to a character lacking Wyrmplate. This preserves the trait's explicit dependency.
  Alternatively, explicitly allow one of Wyrmplate's six immunities without granting Wyrmplate.
- **Blocked until answered:** Enabling this specific borrowed trait on characters without
  Wyrmplate. Other Dragon Dreams traits and all independent supporting-choice work can proceed.
- **Answer:** “That sounds right, but I’m not familiar with the pool so we’ll have to go off of the corpus, or maybe try to infer an answer from how forge steel did it.” The source-based prerequisite is retained. Forge grants Wyrmplate automatically on its Dragon Knight ancestry and provides only text for Dragon Dreams; it supplies no counterexample without Wyrmplate. This does not resolve deferred Revenant Q-CHAR-7.

## Deferred questions

Confirmed 2026-09-15: Q-CHAR-7, Q-CHAR-9 and Q-CHAR-13 wait until after the playtest. Retain the
source evidence and undecided alternatives for later V1 work; none blocks the narrow playtest.

### Q-CHAR-7: May a Revenant borrow Prismatic Scales without Wyrmplate?

- **Status:** deferred until after the playtest, user-confirmed 2026-09-15
- **Research check:** 2026-09-15 — source ambiguity; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-7).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/feature/trait/revenant/former-life.md` and
  `previous-life-1-point.md` in that directory; `vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/prismatic-scales.md`
  and `wyrmplate.md`.
- **Conflict or gap:** Previous Life permits a one-point purchased trait, but grants no former signature
  trait. Prismatic Scales qualifies by cost yet asks for an immunity from “your Wyrmplate trait,” which
  the Revenant lacks. Forge's flattened damage-type variants do not resolve that dependency.
- **Research recommendation (not adopted):** For this case, allow choosing one of Wyrmplate's six types with level-scaled
  immunity, without granting Wyrmplate or a second changeable immunity. Alternatively, disallow this
  borrowed trait without its prerequisite. The recommendation is not a general borrowing precedent.
- **Resumption:** Revisit with the later V1 work that needs this behavior; no playtest implementation
  or default is authorized by the research recommendation.
- **Answer:** “Yep, defer all of those.” The scope deferral does not settle the underlying rule or workflow.

### Q-CHAR-9: How should career project points work while V1 downtime projects are deferred?

- **Status:** deferred until after the playtest, user-confirmed 2026-09-15
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-9).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** Heroes clean `en/books/heroes/clean/Draw Steel Heroes.md`, **Career Benefits → Project
  Points**; `vendor/steel-compendium/en/unified/md/career/artisan.md` and `career/criminal.md`.
- **Conflict or gap:** Seven careers give 120 or 240 points. The source permits splitting them between
  qualifying projects once, retaining them, and sometimes using them before the adventure with
  Director-provided materials. Deferring downtime must not silently discard or change that benefit.
- **Research recommendation (not adopted):** Preserve the grant/balance, with manual Director-recorded allocation to named
  core projects and resulting items through inventory authority. Label prerequisites/resolution manual;
  don't claim project automation. Career editing cannot regrant spent points. Alternatively, preserve
  the balance for later with no spending UI. Agree the bounded workflow with inventory.
- **Resumption:** Revisit with the later V1 work that needs this behavior; no playtest implementation
  or default is authorized by the research recommendation.
- **Answer:** “Yep, defer all of those.” The scope deferral does not settle the underlying rule or workflow.

### Q-CHAR-13: Should higher-level creation offer discretionary starting treasures?

- **Status:** deferred until after the playtest, user-confirmed 2026-09-15
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-13).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#fuller-product-scope`; Heroes clean
  `en/books/heroes/clean/Draw Steel Heroes.md`, **For the Director → Treasures Above 1st Level**.
- **Conflict or gap:** The Director can supply starting treasures above level one, with player selection.
  Higher-level creation is required, but a level selector must not silently award optional treasure or
  duplicate retained inventory on admission.
- **Research recommendation (not adopted):** An explicit Director starting-treasure allowance for new higher-level starting heroes,
  optionally filled from the book's echelon guidance, with player selection and grants applied once.
  Include its option to replace each leveled treasure/trinket with a consumable of the hero's echelon
  or lower. Existing Director inventory editing is the alternative to a dedicated picker. No automatic extra
  inventory for existing heroes merely choosing an entry level. Coordinate with inventory.
- **Resumption:** Revisit with the later V1 work that needs this behavior; no playtest implementation
  or default is authorized by the research recommendation.
- **Answer:** “Yep, defer all of those.” The scope deferral does not settle the underlying rule or workflow.

## Engineering follow-ups

These entries retain integration context without asking the user for routine engineering decisions.
No user approval is implied by this classification.

### Q-A-200: How should a hero's Stamina maximum, Recoveries and characteristics reach the table before A02?

- **Status:** engineering follow-up completed, 2026-09-15; no user ruling needed. See
  [A02 verification](build/audits/2026-09-15-A02-independent-review.md).
- **Raised by:** A03, 2026-09-14
- **Where:** `docs/table-spec.md#v001-catch-breath`, `docs/table-spec.md#persistent-values-and-manual-adjustment-entries`,
  `docs/table-command-spec.md#direct-test-rolls`, `shared/contracts/liveState.ts` (`HeroAdjustableField`),
  `docs/live-state-initialization.md` section 2.1.
- **Historical conflict or gap (before A02):** R03 takes a hero's initial Stamina, Recoveries, heroic resource and the maxima from
  the evaluated baseline, and lists only current values as Director-adjustable. No evaluator exists in
  this checkout (`derivedBaseline` is null for every character), so `/hero recover` has no recovery
  value and `/test roll` has no characteristic score to add. A03 records `null` for every
  baseline-supplied value on first table use, lets the Director set `stamina-maximum` and
  `recoveries-maximum` through `/adjust` only while the hero has no evaluated build, and requires
  `/test roll` to carry `value=<score>`, recorded as a supplied fact. Nothing is defaulted to a number.
- **Options:** A: keep the provisional route until A02 supplies the baseline, then remove the two
  provisional fields. B: refuse `/hero recover` and `/test roll` for heroes entirely until A02.
  C: keep the provisional maxima as a permanent Director override alongside the baseline.
- **Recommendation:** A. It keeps the FreePlay operations testable end to end without inventing values,
  and the two provisional verbs refuse to run once a baseline exists.
- **Blocked until answered:** nothing; A applied provisionally and labeled in the slice work log.
- **Original audit disposition:** this was a temporary A03/A02 integration dependency, not an
  already-answered duplicate. Evaluated values and first-admission initialization are already
  required by R03/A02. Retain the provisional bridge as explicit engineering context until A02
  supplies real baselines, then retire it. This reclassification does not authorize permanent
  maximum overrides or turn a shipped default into user approval. See
  [the audit](build/audits/2026-09-14-question-queue-dedup.md).
  Follow-up (A02, 2026-09-15): the evaluated baseline now supplies the maxima and characteristics;
  the two provisional verbs are removed and `/test roll` reads the score from the build.
- **Answer:**

## Resolved questions

### Q-V-2: Compare every generated stat block against Steel Cauldron

- **Status:** resolved 2026-09-16; [full-output comparison](monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16).
- **Raised by:** user direction in V23 foe-track discussion, 2026-09-16.
- **Where:** `docs/research/steel-cauldron-output-comparison.md` and the ingestion specification.
- **Conflict or gap:** The investigation compared eleven undead examples; the user wants systematic
  coverage so substantial divergence in any generated stat block is noticed and investigated.
- **Options:** No question was presented; the user supplied the requirement directly.
- **Recommendation:** Include every generated definition in a reproducible comparison report, preserve
  explicit missing/ambiguous outcomes and review material differences against the pinned source.
- **Blocked until answered:** nothing; already answered.
- **Answer:** Compare every generated stat block with its Steel Cauldron counterpart. A large divergence
  should trigger additional manual review to determine why our output differs. The previously confirmed
  example-only reuse boundary remains in force.

### Q-V-1: Monster ingestion must support correction, feature access, themes and sharing

- **Status:** resolved 2026-09-15; [ingestion requirements](monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15)
  and [shared object model](data-architecture-spec.md#35-unified-object-references-and-sharing).
- **Raised by:** user clarification in V23 foe-track discussion, 2026-09-15.
- **Where:** `docs/monster-catalog-spec.md#logical-records` and the shared object model above.
- **Conflict or gap:** The assessment preserved feature sections but did not explicitly require
  regeneration of corrections, independent feature search/rendering or sharing-model compatibility.
  Its proposed position-based child identity was insufficient for durable object references.
- **Options:** No question was presented; the user supplied these requirements directly.
- **Recommendation:** Apply them to the ingestion contract and acceptance checks; keep exact storage,
  identity mapping and correction-file formats as engineering proposals.
- **Blocked until answered:** nothing; already answered by the user.
- **Answer:** Imports must be flexible enough to correct without manually editing all stat blocks.
  Individual abilities and traits must be programmatically addressable, filterable, searchable and
  themeable. Use the existing app data-sharing model, definitely for abilities and stat blocks,
  preserving the possibility of sharing individual traits. Engine work remains on the parser branch.

### Q-R-201: What happens to live values on detachment, duplication and later admission?

- **Status:** resolved 2026-09-15; [owning policy](character-wizard-spec.md#campaign-lifecycle)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-r-201).
- **Raised by:** R03, 2026-09-14
- **Where:** `docs/live-state-initialization.md` section 3; `docs/character-wizard-spec.md#12-open-decisions`
  (row "Non-campaign live-state transfer on detachment/duplication"); ruling in `agent.MD` (*Characters, privacy
  and inventory*: detachment clears campaign XP/Victories). Compendium read:
  `vendor/steel-compendium/en/unified/md/rule/resource/{victories,experience,respite}.md`,
  `vendor/steel-compendium/en/unified/md/rule/health/{stamina,recoveries}.md`. The source has no notion of a
  character changing campaigns.
- **Conflict or gap:** First admission initializes live values from the baseline. A character detached from one
  campaign and attached to another has a prior live record; the ruling clears Victories and XP but says nothing
  about current Stamina, Recoveries, temporary Stamina, surges, the heroic resource or condition toggles.
- **Original recommendation (rejected):** Carry prior non-campaign live values across transfer.
- **Answer:** These are campaign-tracked values. Moving to a new campaign starts fresh: Stamina
  and Recoveries full, prior conditions and temporary effects cleared, other resources at their
  normal initial state. XP/Victories stay zero. Retain level/build, independent inventory and
  progression history. A duplicate's fresh state does not change the original character.
- **Boundary:** This is destination-campaign initialization, not an earned respite, and does not
  grant maximum heroic resources, convert old Victories into XP or replay item grants. Q-CHAR-2
  governs build changes within an existing campaign; destination admission starts full against its
  admitted build. UI/headless use the same admission operation.
- **Build handoff:** R03/A02/V08 align re-admission with the fresh-start policy; no implementation
  verification is claimed by this decision.

### Q-CHAR-11: Which skill collisions create an unrestricted replacement choice?

- **Status:** resolved by current user interpretation 2026-09-15 (adopted for now); [owning policy](character-wizard-spec.md#confirmed-behavior)
- **Research check:** 2026-09-15 — source ambiguity; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-11).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`, **Choosing Skills**;
  `vendor/steel-compendium/en/unified/md/career/warden.md`; `vendor/steel-compendium/en/unified/md/class/fury.md`.
- **Conflict or gap:** Two sources granting the same specific skill permit an unrestricted replacement.
  Warden/Fury fixed Nature grants are clear. Choosing a duplicate from a restricted pool in order to
  obtain an unrestricted choice is less explicit and could make UI order affect entitlement.
- **Accepted policy:** Resolve fixed grants first, with replacements for unavoidable duplicates. Free
  selections choose distinct eligible skills not already granted; deliberate duplication does not expand
  their pool. An exhausted pool needs its own concrete ruling. This is the current user-selected interpretation, not an explicit fixed-only source restriction.
- **Answer:** “That seems to make sense. I think, let's go with it for now.” Unavoidable fixed
  duplicates allow an unrestricted replacement; deliberate duplicates do not expand a printed
  selection pool. Preserve explicit feature exceptions and do not infer a rule for exhausted pools.
- **Build handoff:** A02/R02/V08 use the same grant accounting independently of UI/headless selection
  order. This adopted policy can be revisited; the user question is answered for current work.

### Q-CHAR-10: Can a complete character intentionally leave ancestry points unspent?

- **Status:** resolved 2026-09-15; [owning policy](character-wizard-spec.md#confirmed-behavior)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-10).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** Heroes clean **Ancestry Traits**;
  `vendor/steel-compendium/en/unified/md/feature/trait/devil/devil-traits.md` and
  `vendor/steel-compendium/en/unified/md/feature/trait/memonek/memonek-traits.md`.
- **Conflict or gap:** The source provides a budget “to spend” and forbids exceeding it, but does not
  expressly make spending every point mandatory. Completion must distinguish unfinished from intentional.
- **Accepted policy:** Permit unspent points with a warning, without requiring a separate acknowledgement. Later spending follows the
  established edit/review flow; no extra in-play spending permission. Overspending remains invalid.
- **Answer:** Warn, but do not enforce spending. Unspent points alone do not block completion;
  an otherwise complete build stays complete. Return the same warning through shared UI/headless
  evaluation. Other required choices and the maximum budget retain their existing validation.
- **Build handoff:** A02/R02/V08 align completion diagnostics with this decision; docs do not claim
  executable verification.

### Q-CHAR-6: Does core-only scope allow custom languages and deity portfolios?

- **Status:** resolved by scope deferral 2026-09-15; [owning scope](character-wizard-spec.md#fuller-product-scope)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-6).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#fuller-product-scope`; sources
  `vendor/steel-compendium/en/unified/md/chapter/background.md`, Heroes clean **Languages in Orden**,
  and `vendor/steel-compendium/en/unified/md/feature/conduit/level-1/deity-and-domains.md`.
- **Confirmed language decision:** Custom languages are homebrew in this app and deferred beyond
  V1. The core permission to invent them does not change that scope. Normal language edits and
  Director approval do not introduce custom selectable identities. See [the owning scope](character-wizard-spec.md#fuller-product-scope).
- **Deity decision:** Custom deity/domain combinations are deferred because they are unnecessary
  for the narrow playtest. Use printed supported combinations; no custom portfolio workflow is
  required in the current delivery scope. Later inclusion needs an explicit scope decision.
  Authored religious flavor and core culture assembly remain separately allowed.
- **Related questions:** Q-R-102 resolved spoken-language tables for v0.01; Q-R-100 resolved
  Caelian as automatically known, without consuming a paid slot. Neither decides custom identities
  or all fuller V1 language scope.
- **Build handoff:** Do not build custom selectable languages or deity portfolios for the current scope.
- **Answer (language portion):** “Custom languages are part of homebrew in this app and are deferred.”
  **Answer (deity portion):** “Not Needed for a narrow play test. Defer”

### Q-CHAR-5: Do source-authorized reconfigurations need full-edit approval?

- **Status:** resolved for languages and kits 2026-09-15; [owning policy](character-wizard-spec.md#language-edits-and-respite-kit-changes)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-5).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#4-wizard-flows`; sources
  `vendor/steel-compendium/en/unified/md/chapter/kits.md#changing-your-kit`,
  `vendor/steel-compendium/en/unified/md/feature/conduit/level-1/prayer.md`, and
  `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md` (I Speak Their Language; Changing
  Character Options). Related research: `docs/research/respite-rules.md`.
- **Conflict or gap:** Attached full edits require review; source-authorized respite changes and
  filling deferred language slots are not level-ups. Their application approval path is unspecified.
- **Original recommendation (not adopted as a blanket policy):** Exempt source-authorized narrow
  changes, including languages, from full-edit approval.
- **Answer:** Language changes use ordinary edits and existing Director approval, including filling
  deferred language slots. Kits have a dedicated swap option in the respite gameplay loop, without
  a separate full-edit submission. Kits also remain selectable in the regular character editor;
  outside the respite path, these changes require normal Director approval. Preserve the source's
  activity cost and eligibility for respite swaps, log/finalize
  the resulting revision, and expose the same shared operation headlessly.
- **Scope:** No approval exemption was established for prayers, wards, augmentations or other class
  changes. Their exact respite workflows remain in [respite research question 3](research/respite-rules.md#8-product-decision-queue);
  existing full-edit policy applies meanwhile. Optional general ability swapping remains separate.
- **Build handoff:** V01/V08 implement the kit activity and ordinary language-edit path. Respite
  remains outside v0.01. This decision is not implementation evidence.

### Q-CHAR-4: What happens when the owner makes new choices after restoring an earlier build?

- **Status:** resolved 2026-09-15; [owning policy](character-wizard-spec.md#5-progression-history)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-4).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#5-progression-history`.
- **Conflict or gap:** Restoration preserves later records and present inventory, but subsequent new
  choices have no established history policy. This is a product decision, not rulebook uncertainty.
- **Original recommendation (refined):** Continue from the restored point with retained history.
  The user specified a new snapshot at the top of history, rather than moving the history position
  back to the old revision.
- **Answer:** Each finalized edit is like a commit. Restoring level three copies that old build into
  a new latest revision. The intervening history remains unchanged; subsequent edits follow the
  restoration revision. Record the source snapshot. Keep present inventory and independent live
  state with Q-CHAR-2 reconciliation; existing review/activation locks and UI/headless parity apply.
- **Build handoff:** V08 implements immutable finalized revisions and restoration by appending a
  snapshot; browsing/restoration UI remains deferred beyond v0.01. No Git storage or branch/merge UI
  requirement is implied by the analogy.

### Q-CHAR-3: How does a transferred higher-level hero qualify for advancement after campaign XP clears?

- **Status:** resolved 2026-09-15; [owning policy](character-wizard-spec.md#level-up)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-3).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#level-up`; sources
  `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#heroic-advancement` and
  `vendor/steel-compendium/en/unified/md/rule/resource/experience.md`.
- **Conflict or gap:** Standard source thresholds are cumulative 0,16,32,…,144, with advancement during
  respite. Our transfer policy clears campaign XP but retains level. Comparing cleared XP directly to
  absolute thresholds would make a level-seven arrival earn 112 new XP before level eight.
- **Accepted recommendation:** Keep a separate eligibility offset equal to the admitted effective level's lower threshold,
  not a higher historical build's level.
  Campaign XP still starts at zero. A level-seven entrant has offset 96 and needs 16 new XP for level
  eight, without importing prior campaign XP. Advancement still uses its source-defined timing.
  Coordinate with the respite thread; alternate advancement remains a separate scope choice.
- **Answer:** Yes. The campaign awards XP; the character sheet owns advancement eligibility and
  the level-up steps. An entry-level offset supports the accepted 16-new-XP example without importing
  prior campaign XP. XP awards do not choose options or automatically activate a build. Existing
  source timing, locks and scoped review exemption remain. UI and headless use the same operations.
- **Build handoff:** V01/V08 implement this division and offset; this documentation records the
  decision without claiming delivery.

### Q-CHAR-2: How should activating an edited build reconcile a played hero's resources?

- **Status:** resolved 2026-09-15, **revised by the user 2026-09-24**: damage taken and Recoveries spent
  stay unchanged when a maximum rises or falls (20/30 → 26/36; 26/36 → 20/30). A build change never drops Stamina below 1 or
  Recoveries below 0 (confirmed 2026-09-24). [owning policy](character-wizard-spec.md#current-values-when-a-build-changes)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-2).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#12-open-decisions`.
- **Conflict or gap:** Retaining current inventory and avoiding a live-state rewind are settled. When
  an edit changes Stamina/Recovery maxima or the resource type, the resulting current values are not.
- **Original recommendation (superseded):** Preserve the damage/spending deficit when maxima rise,
  e.g. Stamina 20/30 → 26/36. The user's clarification instead keeps current amounts unchanged.
- **Answer (2026-09-15, superseded 2026-09-24):** maximum increases did not increase current values
  (20/30 → 20/36), capping on decrease. **Current answer:** damage taken and Recoveries spent stay the
  same both ways (20/30 → 26/36; 26/36 → 20/30; Recoveries 7/10 → 9/12). Preserve conditions and compatible counters. Derived statistics
  still recalculate; actual restoration remains separate. Replaced resource types require explicit
  reconciliation; no automatic conversion is established. Record and apply through shared UI/headless
  activation under existing locks/review.
- **Related question:** Q-R-201 concerns retaining values across campaign transfer. This question
  concerns reconciling a changed build; both apply only when transfer also changes the baseline.
- **Build handoff:** Apply current-value preservation/downward caps and retire provisional maximum-only
  Q-CHAR-2 markers. Documentation records the decision; executable repair remains with the build thread.

### Q-CHAR-8: Can both Melodrama improvements increase the same existing event?

- **Status:** resolved by source research 2026-09-15
- **Research check:** 2026-09-15 — source-resolved interpretation; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-8).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/melodrama.md`;
  Forge `src/data/classes/troubadour/troubadour.ts` as structural comparison.
- **Resolution:** Each of the two choices may add a new event or improve an already-owned event.
  Both can improve one previously owned event for +2 drama. Adding an event then improving it gives
  +1. Keep both choice identities; this does not permit choosing the same new event twice.
- **Basis:** The alternative has no different-target or once-per-event restriction. This is a
  source-supported interpretation of the two-choice grant, not an explicit sentence saying “twice”
  or a new user ruling. The old recommendation to prohibit repeats added an unsupported restriction.
- **Owning contract:** [class advancement](v1-character-wizard-contracts.md#advancement-through-all-ten-levels).
- **Build handoff:** V08 later-level choice validation; outside v0.01.

### Q-CHAR-12: Which potency basis applies when another characteristic exceeds the class's named one?

- **Status:** resolved by source research 2026-09-15
- **Research check:** 2026-09-15 — source-resolved; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-12).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/rule/character/potency.md`,
  `vendor/steel-compendium/en/unified/md/class/conduit.md` (**Basics**),
  `vendor/steel-compendium/en/unified/md/chapter/the-basics.md#game-of-exceptions`;
  Forge `src/logic/hero-logic.ts#getPotency` for comparison.
- **Resolution:** Use the class's named potency characteristic unless a specific effect overrides
  it. Potencies explicitly says the basis is class-determined, and Game of Exceptions makes the
  specific class formula prevail. A Conduit with Intuition 2 and another characteristic 3 has baseline
  potencies 0/1/2. This is a source resolution, not a user ruling.
- **Owning contracts:** [baseline statistics](v1-character-wizard-contracts.md#baseline-statistics-and-characteristic-assignment)
  and [R02 potencies](character-derived-values.md#110-potencies).
- **Build handoff:** Remove stale Q-CHAR-12 uncertainty labels in A02/R02/R03 artifacts; ordinary Fury
  example values do not change. Forge's highest-characteristic behavior remains a compatibility difference.

### Q-R-103: Which kits may a level-one Fury choose, by aspect?

- **Status:** resolved 2026-09-14; [recorded decision](character-wizard-spec.md#3-decision-system) and [source check](research/fury-kit-eligibility.md)
- **Raised by:** R01, 2026-09-14
- **Where:** `docs/fury-level-one-decisions.md#step-6-kit`; Compendium read:
  `vendor/steel-compendium/en/unified/md/chapter/kits.md` (intro: "Censors, furies, shadows, tacticians, and
  troubadours can tap into these and many more archetypal concepts using kits."; **Kits A to Z**),
  `vendor/steel-compendium/en/unified/md/feature/fury/level-1/kit.md` ("You can use and gain the benefits of a
  kit."), `feature/fury/level-1/1st-level-aspect-features.md`, `feature/fury/level-1/beast-shape.md` ("You can
  use and gain the benefits of a stormwight kit"), `feature/fury/stormwight-kits/kit-features.md`,
  `vendor/steel-compendium/en/unified/md/_index/kit.md` (25 kits; Boren, Corven, Raden, Vuken are stormwight
  kits).
- **Conflict or gap:** No kit entry states a class restriction. The Kit feature (Berserker, Reaver) says "a kit"
  with no list; Beast Shape (Stormwight) says "a stormwight kit". Whether the 21 non-stormwight kits are all
  eligible for a Berserker/Reaver, and whether a stormwight kit is excluded for them, is an interpretation of
  "a kit" versus "a stormwight kit".
- **Options:** A: Berserker/Reaver choose from the 21 non-stormwight kits; Stormwight chooses from the 4
  stormwight kits only. B: Berserker/Reaver may also take a stormwight kit. C: some non-stormwight kits are
  excluded for the Fury.
- **Recommendation:** A. The stormwight kits describe themselves as "this stormwight kit" and are granted by
  Beast Shape; nothing in the source excludes any other kit from a kit-using class. Labeled interpretation.
- **Blocked until answered:** answered and independently source-checked; apply the supported
  v0.01 subset through A02.
- **Answer:** Yes to the ordinary/Stormwight kit split; the user required subagent source
  verification. That research supports the split through the aspect-specific feature grants and
  book sections, not a verbatim blanket prohibition. The user also explicitly excludes Reaver and
  Stormwight from v0.01: Berserker/Mountain remains the supported prototype path.

### Q-R-102: Which language lists are selectable for culture and career language choices?

- **Status:** resolved 2026-09-14; [recorded decision](character-wizard-spec.md#3-decision-system)
- **Raised by:** R01, 2026-09-14
- **Where:** `docs/fury-level-one-decisions.md#step-3-culture`; Compendium read:
  `vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md` (**Languages in Orden**, **Languages by
  Ancestry Table**, **Vaslorian Human Languages Table**, **Dead Languages Table**),
  `vendor/steel-compendium/en/unified/md/chapter/background.md` (**Languages**: "chosen from those available in
  Languages in Orden above").
- **Conflict or gap:** Career languages are "chosen from those available in Languages in Orden", a section that
  contains three tables: 25 extant languages by ancestry, 9 Vaslorian human regional languages, and 9 dead
  languages "that no modern culture uses". Whether a starting hero may know a dead language, and whether the
  regional human languages are in scope, is not stated. The unified `chapter/background.md` omits the whole
  section, so this also fixes which file the wizard cites.
- **Options:** A: the two extant tables (34 entries, 33 unique names; Khoursirian appears in both) are selectable; dead languages
  are not selectable at creation. B: all three tables. C: extant tables plus dead languages with a Director
  flag.
- **Recommendation:** A. The dead-language text describes them as reconstructed by sages and learned through
  research projects, which reads as acquired later, not at creation; but that is an inference, so it is
  recorded here rather than applied silently.
- **Blocked until answered:** answered; A02 must use the confirmed pool in UI/headless choices
  and replace the obsolete unresolved label in the content artifact.
- **Answer:** Spoken languages only. For v0.01 creation, use the two printed spoken-language
  tables, including regional languages; exclude dead languages. Caelian remains automatically known
  and not selectable as an extra-language choice under Q-R-100.

### Q-R-101: May the Fury's chosen characteristic array be assigned to Reason, Intuition and Presence in any order?

- **Status:** resolved 2026-09-14; [recorded decision](character-wizard-spec.md#3-decision-system)
- **Raised by:** R01, 2026-09-14
- **Where:** `docs/fury-level-one-decisions.md#step-5-class`; Compendium read:
  `vendor/steel-compendium/en/unified/md/class/fury.md` (**Basics**: "you can choose one of the following arrays
  for your other characteristic scores: 2, −1, −1 / 1, 1, −1 / 1, 0, 0"),
  `vendor/steel-compendium/en/unified/md/rule/character/characteristic.md`.
- **Conflict or gap:** The class fixes Might 2 and Agility 2 and offers three arrays "for your other
  characteristic scores" without saying whether the three values map to Reason, Intuition and Presence in
  the printed order or in any order the player chooses. `docs/hero-fixture.md` assigns 1, 0, 0 as Intuition 1,
  Reason 0, Presence 0, which is not the printed order.
- **Options:** A: any assignment of the three values to the three remaining characteristics. B: the values map
  to Reason, Intuition, Presence in the printed order.
- **Recommendation:** A. The wording "choose one of the following arrays" names a set of values, not an ordered
  mapping, and the classes chapter gives no ordering rule. This is an interpretation; the fixture depends on it.
- **Blocked until answered:** answered; A02 must implement the confirmed UI and equivalent
  headless assignment using the shared build operation.
- **Answer:** Display every characteristic. Fill and lock the values automatically assigned by
  class selection; leave the others blank by default. The player drags the available three or four
  numbers into those slots, allowing any assignment of the selected array. All these UI interactions
  also need headless operations: accept named-characteristic assignments with the same validation
  and persistence, without requiring drag gestures. Saved assignments remain explicit build choices.

### Q-R-100: May a chosen career or culture language duplicate the automatic Caelian grant?

- **Status:** resolved 2026-09-14; [recorded decision](character-wizard-spec.md#3-decision-system)
- **Raised by:** R01, 2026-09-14
- **Where:** `docs/fury-level-one-decisions.md#step-4-career`; Compendium read:
  `vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md` (**Culture Benefits**: "You know the
  language of your culture, in addition to knowing Caelian."; **Caelian Empire**: "All player characters know
  Caelian!"), `vendor/steel-compendium/en/unified/md/career/soldier.md` ("Languages: Two languages"),
  `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md` (**I Speak Their Language**).
- **Conflict or gap:** `docs/hero-fixture.md` spends one Soldier language slot on Caelian, which every player
  character already knows. The source never says a chosen language must be one the hero does not know, and never
  says what happens if it is. The wizard must decide whether the fixture set is complete, invalid, or has an
  open slot.
- **Options:** A: accept the duplicate with a visible warning; the slot is spent. B: reject the duplicate as
  invalid; the player must choose another language or leave the slot open. C: silently convert the duplicate
  into an open (deferred) slot.
- **Recommendation:** A. Nothing in the source forbids it, the app's standing policy is warn-without-blocking,
  and the existing fixture stays legal. C hides a choice; B adds a rule the source does not state.
- **Blocked until answered:** answered; A02/R01/R02 must correct the paid-Caelian fixture and
  its evaluator expectations, and present the automatic language grant separately.
- **Answer:** Caelian should still be shown with a short description explaining that it is the
  common tongue, but it is automatically known and not a language to spend choices on. It consumes
  no culture/career language slot. This supersedes accepting the duplicate as a spent slot; the user
  did not select a replacement language for the existing fixture.

### Q-A-601: Does Enable user undo also remove the acting player's post-roll correction window?

- **Status:** resolved 2026-09-14; [recorded decision](table-spec.md#director-edits-to-inline-results)
- **Raised by:** A06, 2026-09-14
- **Where:** `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` ("disabling it blocks
  ordinary player undo") and `docs/table-spec.md#director-edits-to-inline-results` ("the acting player
  may add edges/banes ... in the same window as their gameplay undo").
- **Conflict or gap:** The correction time window uses the same seams and next-turn limit as undo,
  while the setting explicitly disables ordinary player undo. Whether that setting also disables
  the separate modifier-correction permission is not explicitly settled. Disabling permission to
  undo does not itself erase the timing boundaries used by other operations.
- **Options:** A: the setting removes undo and redo only; corrections keep the seam/turn-start
  window. B: the setting also removes player corrections (Director-only corrections).
- **Recommendation:** A, applied provisionally; the setting's text names undo, and corrections are
  appended adjudications the Director can still rewind.
- **Blocked until answered:** answered; A06/A05 must gate acting-player corrections on the
  campaign setting and verify the change.
- **Answer:** Yes: disabling Enable user undo also disables acting-player post-roll edge/bane
  corrections (option B). Director corrections remain available under their existing limits. This
  supersedes the recommendation and provisional implementation that left player corrections enabled.

### Q-A-600: May a player undo their own Take turn?

- **Status:** resolved 2026-09-14; [recorded decision](table-spec.md#undo-permissions-and-proposed-campaign-control)
- **Raised by:** A06, 2026-09-14
- **Where:** `docs/table-spec.md#undo-permissions-and-proposed-campaign-control` (turn start as the
  outer limit; undoing End turn is settled), `docs/table-spec.md#taking-a-turn`.
- **Conflict or gap:** The spec makes turn start the outer limit of the player window and settles
  undoing End turn, but does not say whether the player's own Take turn (which starts that turn and
  dispatches its turn-start work) is inside or outside the window.
- **Options:** A: Take turn is the limit itself; only the Director rewinds it. B: the player may undo
  their own Take turn when nothing intervened, reopening the choice of who acts.
- **Recommendation:** A, applied provisionally. "Turn start" reads most naturally as the boundary,
  and the Director already rewinds it sequentially.
- **Blocked until answered:** answered; option A is confirmed. Implementation verification remains
  with A06.
- **Answer:** Director only. A player may not undo their own Take turn, even before any other
  action. The Director uses the existing sequential rewind path and its encounter/session limits.

### Q-R-3: Is regained Stamina capped at the Stamina maximum?

- **Status:** resolved 2026-09-14; [recorded decision](roll-and-damage-resolution.md#7-catch-breath-and-recovery-spending)
- **Raised by:** R04, 2026-09-14
- **Where:** `docs/roll-and-damage-resolution.md#7-catch-breath-and-recovery-spending`,
  `docs/table-spec.md#v001-catch-breath`; read
  `vendor/steel-compendium/en/unified/md/feature/common/maneuvers/catch-breath.md`,
  `vendor/steel-compendium/en/unified/md/rule/health/recoveries.md`,
  `vendor/steel-compendium/en/unified/md/rule/health/stamina.md`,
  `vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md`,
  `vendor/steel-compendium/en/unified/md/chapter/the-basics.md` (Recoveries).
- **Conflict or gap:** No sentence at the pin says Stamina cannot exceed its maximum. Stamina says
  "Some effects can also reduce your Stamina maximum, limiting the amount of Stamina you can regain",
  which implies the maximum bounds regain but does not state the cap. The table spec asked for this
  bound to be verified before implementation.
- **Options:** A: cap ordinary Stamina at the maximum; excess healing is lost, Recovery still spent /
  B: no cap (Stamina may exceed maximum) / C: cap, and refuse Catch Breath at full Stamina.
- **Recommendation:** A. It is the only reading under which "Stamina maximum" is a maximum, and
  temporary Stamina exists as the separate uncapped pool. C adds a block the source does not state.
- **Blocked until answered:** answered; retain cap application metadata and remove the obsolete
  Q-R-3 uncertainty label through the owning build work.
- **Answer:** Yes. Ordinary healing stops at maximum Stamina; excess healing is lost and the
  Recovery remains spent. The confirmed example is 24/30 Stamina with recovery value 10: finish
  at 30, restore 6 and lose the extra 4 healing.

### Q-A-400: Should Take turn from a finished initiative group be a warned departure instead of a refusal?

- **Status:** resolved 2026-09-14 under [existing turn policy](table-spec.md#taking-a-turn); implementation follow-up remains
- **Raised by:** A04, 2026-09-15
- **Where:** `docs/table-spec.md#mid-combat-additions-and-regrouping` ("moving a creature with an
  unused turn into a group that has already finished does not make that group eligible to activate
  again ... The standing warned Director-adjudication path remains separate from automatic
  eligibility"), `docs/table-spec.md#taking-a-turn` ("rule eligibility is not an application permission
  gate"), `docs/table-spec.md#player-sheet-actions-and-explicit-end-turn` (graying is advisory).
  Compendium read: `vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md` (Enemies Act In
  Groups; a creature who has acted cannot act again until a new round).
- **Conflict or gap:** the group contract makes a finished group ineligible and names Director
  adjudication as a separate path; the general doctrine makes rule eligibility a warning, not a gate.
  A04 refuses `/turn take` for an entry whose group finished this round (and for an entry already
  spent this round, and while another group is active), with the message pointing at `/group move`
  into a new group as the adjudication path. It warns, without blocking, only for acting out of side
  order and for a Slain foe.
- **Options:** A: keep the refusal; the Director regroups to act (current). B: allow it with a
  recorded rule warning, leaving the group's completion untouched. C: allow it for the Director only,
  with a warning.
- **Recommendation:** A. It keeps one active group and one active turn as coherent-state requirements
  the spec lists separately from rule eligibility, and the regroup path is one operation away.
- **Blocked until answered:** no new ruling needed; A04 must reconcile the implementation with the
  existing policy and verify the repair.
- **Resolution from existing decisions:** finished-group automatic eligibility and spent-entry
  history remain intact. Deliberate rule departures use recorded warnings, not a new permission gate
  or required regroup workaround. Access/session boundaries and coherent sequencing still apply:
  this does not allow competing ordinary active turns, reset group completion, or erase spent state.
  The question bundled those separate concerns; option B is not blanket approval to ignore them.
  See [the evidence review](build/audits/2026-09-14-question-queue-dedup.md).

### Q-R-1: Does a natural 19 or 20 stay tier 3 under a double bane?

- **Status:** resolved 2026-09-14; [recorded decision](roll-and-damage-resolution.md#16-natural-19-and-20)
- **Raised by:** R04, 2026-09-14
- **Where:** `docs/roll-and-damage-resolution.md#16-natural-19-and-20`; read
  `vendor/steel-compendium/en/unified/md/rule/dice/natural-roll.md`,
  `vendor/steel-compendium/en/unified/md/rule/dice/bane.md`,
  `vendor/steel-compendium/en/unified/md/rule/dice/power-roll.md`,
  `vendor/steel-compendium/en/unified/md/rule/test/test-difficulty.md`.
- **Conflict or gap:** Natural Roll says a natural 19 or 20 "is always a tier 3 result regardless of
  any modifiers". Bane says a double bane does not subtract from the roll but "the outcome of the roll
  automatically decreases one tier". No sentence says whether a tier decrease counts as a modifier.
  The question concerns tier 3 versus tier 2. Follow-up research found that natural 19/20 tests
  separately guarantee success with a reward, so that reward does not depend on this tier dispute.
- **Options:** A: natural 19/20 stays tier 3 (double bane is a way to "modify a roll" per Power Rolls,
  so "any modifiers" covers it) / B: apply the double-bane decrease after the natural override, giving
  tier 2 / C: Director decides per case.
- **Recommendation:** A. Power Rolls describes edges and banes as modifying a roll, the natural-roll
  sentence is unconditional, and the test table lists "Natural 19 or 20" as its own row above all
  difficulties. The critical-hit extra action is unaffected either way.
- **Blocked until answered:** answered; the build must apply the confirmed contract and remove
  obsolete uncertainty labels. Implementation verification remains with the build thread.
- **Answer:** Yes. Natural 19/20 overrides ordinary edges and banes, including double bane. The user
  requested independent source confirmation; the [subagent research](research/natural-roll-precedence.md)
  supports the interpretation. Do not generalize to unrelated automatic-tier or voluntary-downgrade rules.

### Q-R-2: For "N + M or A damage", must the damage characteristic be the roll characteristic?

- **Status:** resolved 2026-09-14; [recorded decision](roll-and-damage-resolution.md#41-damage-expressions)
- **Raised by:** R04, 2026-09-14
- **Where:** `docs/roll-and-damage-resolution.md#41-damage-expressions`,
  `docs/table-spec.md#v001-roll-characteristic-default`; read
  `vendor/steel-compendium/en/unified/md/rule/dice/ability-roll.md`,
  `vendor/steel-compendium/en/unified/md/feature/ability/common/melee-weapon-free-strike.md`,
  `vendor/steel-compendium/en/unified/md/kit/mountain.md`.
- **Conflict or gap:** Ability Roll says free strikes "allow you to pick which characteristic score
  you add to their damage" and does not tie that pick to the power-roll characteristic. The 2026-09-14
  ruling on the roll default says it "does not infer separate damage choices". With Might and Agility
  unequal the two readings give different damage. The v0.01 hero has Might 2 and Agility 2, so no
  example is affected yet.
- **Options:** A: use the roll characteristic for damage, recorded; a different pick is a manual
  result / B: offer a separate damage-characteristic choice defaulting to the highest permitted / C:
  always use the highest permitted for damage regardless of the roll.
- **Recommendation:** A for v0.01 (fewest inputs, matches the existing ruling's wording); B is the
  literal reading if the user wants the pick exposed.
- **Blocked until answered:** answered; the build must apply the confirmed contract and remove
  obsolete uncertainty labels. Implementation verification remains with the build thread.
- **Answer:** Use the higher permitted characteristic by default, as already chosen for rolls. For damage,
  choose the highest current value allowed by the damage expression independently of the roll choice;
  retain source-authorized alternatives. This is a default, not option C's mandatory highest value.

### Q-R-52: Does a creature added to combat mid-round take a turn in the current round?

- **Status:** resolved 2026-09-14; [confirmed app decision](table-spec.md#mid-combat-additions-and-regrouping)
- **Raised by:** R05, 2026-09-14
- **Where:** `docs/conditions-and-clock.md` section 2.2; `docs/table-spec.md#game-clock-and-scheduled-rules-work`;
  `docs/table-spec.md#initiative-groups-confirmed-app-model`. Compendium read:
  `vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md` (Creatures Take Turns, End of
  Round), `vendor/steel-compendium/en/unified/md/chapter/monster-basics.md` (Reinforcements paragraphs
  under Escort and Hold Them Off).
- **Conflict or gap:** The round ends "Once all creatures on both sides of a battle have acted." The
  Director can add foes during running combat. The source's reinforcement examples add creatures "At
  the start of each combat round" or "At the end of each combat round", but state no rule for a creature
  added in the middle of a round. Whether it acts this round decides when `round-end` fires and when the
  next Malice gain occurs.
- **Options:** A: the added creature gets an unspent turn entry in the current round and may act before
  the round ends. B: the added creature's first turn entry belongs to the next round; the current round
  can end without it. C: the Director chooses per addition through the add operation.
- **Recommendation:** A. It keeps "each creature in the battle takes a turn" true for the round in which
  the creature joins and needs no extra control; the Director can regroup or remove the entry.
- **Blocked until answered:** nothing; option A is confirmed. Slain or removed creatures do not hold
  a round open under the interpretation recorded in the contract.
- **Answer:** Yes; the user requested an independent pinned-source check. The check found same-round
  participation consistent with general turn rules and explicit immediate-after timing for summons,
  but no general rule specifically addressing ordinary mid-round reinforcements. See the
  [research brief](research/mid-round-reinforcements.md). The table spec already recorded option A as
  confirmed on 2026-09-12; this answer reaffirms it and corrects the stale provisional status. Preserve
  source-specific timing.

### Q-R-51: How is a fractional average of Victories handled for the combat-start Malice grant?

- **Status:** resolved 2026-09-14; [recorded decision](conditions-and-clock.md#33-manual-parts-in-v001)
- **Raised by:** R05, 2026-09-14
- **Where:** `docs/conditions-and-clock.md` section 3.3; `docs/fury-goblin-automation.md#malice-lifecycle`
  (already listed as remaining bounded work). Compendium read:
  `vendor/steel-compendium/en/unified/md/rule/monster/malice.md` (Earning Malice),
  `vendor/steel-compendium/en/unified/md/rule/general/always-round-down.md`.
- **Conflict or gap:** "At the start of combat, you gain Malice equal to the average number of
  Victories per hero." The example uses equal Victories. Always Round Down says "Whenever you divide an
  odd number in half and it results in a decimal, round the result down", which addresses halving, not
  averaging over three or more heroes (for example Victories 1, 1, 2 give 4/3).
- **Options:** A: round the average down (extend the halving rule's direction to any division).
  B: round to the nearest whole number. C: keep the exact fraction in the pool.
- **Recommendation:** A, labeled an interpretation: it is the only rounding direction the source states
  anywhere, and Malice is spent in whole numbers. Log the unrounded average with the grant.
- **Blocked until answered:** nothing; option A is now confirmed.
- **Answer:** Yes. Round fractional starting Malice down. The user also confirmed carrying the
  convention of rounding down unless otherwise specified; see the
  [standing rounding convention](rules-adaptation-principles.md#confirmed-rounding-convention).

### Q-R-50: Which heroes count as "in the battle" for the Malice round-start gain in v0.01?

- **Status:** resolved 2026-09-14; [recorded decision](conditions-and-clock.md#33-manual-parts-in-v001)
- **Raised by:** R05, 2026-09-14
- **Where:** `docs/conditions-and-clock.md` section 3.3; `docs/table-spec.md#malice-visibility`;
  `docs/fury-goblin-automation.md#malice-lifecycle`. Compendium read:
  `vendor/steel-compendium/en/unified/md/rule/monster/malice.md` (Earning Malice),
  `vendor/steel-compendium/en/unified/md/rule/health/dying.md`.
- **Conflict or gap:** The source gains "Malice equal to the number of heroes in the battle, plus the
  combat round number" and says "If a hero dies, they stop generating Malice." Hero death is not
  automated in v0.01, and the source is silent on heroes who flee, are removed from the encounter by the
  Director, or are dying but not dead. The same passage also says "As long as none of the heroes is
  taken out of the fight, you gain 8 Malice" in its example, and "taken out of the fight" is not
  defined. The count changes the pool every round.
- **Options:** A: count every hero participant committed in the encounter at each round start; the
  Director uses Manual adjustment when a hero has died or left. B: count only hero participants whose
  current turn entry exists in the round (a removed hero stops counting; a dying hero still counts).
  C: add a Director per-hero "generates Malice" flag to the encounter.
- **Recommendation:** B. It follows the source's "in the battle" wording and the existing removal
  operation without a new flag, and a dying hero still counts because the source names death, not
  dying. A was the provisional default before the user selected B.
- **Blocked until answered:** answered; A04 must replace the provisional setup count with current
  combat participation and verify the change.
- **Answer:** Yes. Removing a hero from combat also stops them contributing to Malice. A dying
  hero who remains in combat still counts. Apply this to subsequent round-start gains.

### Q-R-200: Is a foe's Slain label recomputed from current Stamina after a Director edit above zero?

- **Status:** resolved 2026-09-14; [recorded decision](live-state-initialization.md#23-labels-derived-at-read-time)
- **Raised by:** R03, 2026-09-14
- **Where:** `docs/live-state-initialization.md` section 2.3; `docs/fury-goblin-automation.md#ordinary-foes-at-zero-stamina`;
  Compendium read: `vendor/steel-compendium/en/unified/md/rule/health/stamina.md` ("In most circumstances,
  Director-controlled creatures die or are destroyed when their Stamina drops to 0."; *Knocking Creatures Out*),
  `vendor/steel-compendium/en/unified/md/chapter/monster-basics.md`.
- **Conflict or gap:** The ruling makes zero Stamina show a foe as Slain and keeps it in the roster until cleanup.
  The source says nothing about a creature's Stamina being set above zero afterwards; the only app path is a
  Director Manual adjustment (a correction). R04 derives `slain` from the post-damage Stamina and the existing
  engine recomputes it from Stamina; a recorded status would instead persist until cleanup or a Director clear.
- **Options:** A: `slain` is derived: `stamina <= 0`, so an edit above zero clears the label. B: `slain` is a
  recorded status set at zero and cleared only by cleanup, Void or an explicit Director operation.
- **Recommendation:** A. It matches R04 6.4 and `src/engine.ts`, needs no new operation, and a Director who
  corrects a foe's Stamina to a positive value evidently intends it to fight on; unconscious foes are a manual
  adjudication either way.
- **Blocked until answered:** nothing; option A is now confirmed.
- **Answer:** Yes. Raising a slain foe's Stamina above zero automatically clears Slain, allowing it
  to fight again.

### Q-TS-1: Are any save-ends rolls automatic in v0.01?

- **Status:** answered 2026-09-14; recorded in `docs/table-spec.md#game-clock-and-scheduled-rules-work`
- **Raised by:** 2026-09-14 final audit (table spec), 2026-09-14
- **Where:** `docs/table-spec.md#game-clock-and-scheduled-rules-work` (the 2026-09-14 manual-toggle
  refinement and the 2026-09-13 "automatic save-ends resolution for supported timed effects is confirmed"
  paragraph sit a few lines apart); `docs/pre-alpha-design-gaps.md#clock-and-saves--confirmed-for-v001`.
  Compendium read: `vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md`.
- **Conflict or gap:** The 2026-09-14 ruling makes saves for condition toggles manual and says automatic
  scheduling waits for ability support. The 2026-09-13 ruling requires automatic end-of-turn save rolls
  for supported timed effects. Because v0.01 also defers ability-effect execution, it is unclear whether
  any "supported timed effect" can exist in v0.01, so the automatic path may be required but untestable.
- **Options:** A: the automatic path stays in the clock contract and is dormant in v0.01 (no producer
  registers a save); every v0.01 save is manual. B: drop the automatic save requirement from the v0.01
  checklist and move it to V1. C: require at least one automatic save producer in v0.01 (would need an
  ability-effect producer, contradicting the game-basics-first deferral).
- **Recommendation:** A. The two rulings are compatible read this way: the source rule (1d10, 6 or
  higher, rolled at the end of the affected creature's turn per `saving-throw.md`) remains the clock
  contract; in v0.01 the walkthrough states honestly that only the manual path was exercised.
- **Blocked until answered:** the acceptance wording for walkthrough step 7 and whether A04 wires any
  automatic save dispatch. Default applied provisionally: option A.
- **Answer:** No. No save-ends roll is automatic in v0.01; all saves use ordinary dice controls and manual condition removal. Automatic resolution is V1 behavior.

### Q-CHAR-1: Must the v0.01 wizard present the optional Complication step?

- **Status:** answered 2026-09-14; recorded in `docs/character-wizard-spec.md#3-decision-system`
- **Raised by:** 2026-09-14 final audit (character specs), 2026-09-14
- **Where:** `docs/character-wizard-spec.md#3-decision-system`,
  `docs/pre-alpha-design-gaps.md#confirmed-first-acceptance-journey`. Compendium read:
  `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md` (step 8, Complication).
- **Conflict or gap:** v0.01 requires "every applicable creation step, one supported option per step".
  The source says complications "aren't necessary" and to check with the Director whether the game uses
  them. Whether an optional step counts as "applicable" is a product choice, not a source fact.
- **Options:** A: present the step with "No complication" as the one supported valid selection. B: omit
  the step from the v0.01 wizard entirely. C: present the step with at least one sourced complication
  supported, which adds its benefit and drawback to the R02 formulas.
- **Recommendation:** A. It satisfies "every step" without adding complication effects to the derived
  values contract; C can follow in V08.
- **Blocked until answered:** the R01 step count and whether R02 must model a complication. Default
  applied provisionally: option A, labeled provisional in R01 and A02.
- **Answer:** No. The v0.01 wizard does not present the Complication step.

### Q-HAND-1: May the login footer say "Draw Steel compatible"?

- **Status:** answered 2026-09-14; recorded in `docs/design-mockups/v1/README.md#login-footer-wording`
- **Raised by:** 2026-09-14 final audit (mockups), 2026-09-14
- **Where:** `docs/design-mockups/v1/login.png` footer tag; no spec mentions the phrase.
  `THIRD_PARTY_NOTICES.md` and `LICENSE` cover code and content attribution but not product wording.
- **Conflict or gap:** This is a rights and wording question about how the product may describe its
  relationship to Draw Steel, not a rules question. The mockups are style-only, so the phrase is not a
  requirement, but a builder may copy it.
- **Options:** A: omit any compatibility phrase until the user confirms the wording and its basis. B: use
  the phrase as shown. C: use a different attribution line the user supplies.
- **Recommendation:** A, applied provisionally in A08.
- **Blocked until answered:** nothing; the phrase is omitted.
- **Answer:** No. The phrase is not used.

### Q-REC-1: Foe hide/reveal code exists although hiding is deferred; remove or keep dormant?

- **Status:** answered 2026-09-14; recorded in `docs/monster-catalog-spec.md`
- **Raised by:** 2026-09-14 final audit (accounts/catalog docs), 2026-09-14
- **Where:** `convex/foes.ts` (`setVisible`, `setDefaultVisible`, default hidden), `web/foes.tsx`;
  `docs/table-spec.md#monster-visibility-and-health-display` (hiding deferred beyond v0.01).
- **Conflict or gap:** Working code implements a deferred feature. A03 proposes removing the controls
  and leaving every foe visible. This is an engineering choice the lead can make, recorded here only so
  the user can object.
- **Options:** A: remove the controls and the default-hidden behavior in A03; keep the schema field for
  V14. B: keep the controls but hide them behind a development flag.
- **Recommendation:** A. It matches the ruling and keeps the v0.01 UI honest.
- **Blocked until answered:** nothing; A is applied in A03 unless the user objects.
- **Answer:** No, do not remove. The code stays dormant: no UI control, not in the registry, every foe visible in v0.01. (User answered "no" to a remove-or-keep question; read as "do not remove". Correct here if intended otherwise.)

### Q-CHAR-14: Include Beastheart and Summoner in initial wizard development?

- **Status:** resolved 2026-09-15; [owning scope](character-wizard-spec.md#fuller-product-scope).
- **Raised by:** V24 character-track assessment, 2026-09-15; answered directly in the user thread.
- **Conflict or gap:** Earlier scope excluded both supplemental classes. The user corrected the core
  count to nine and considered whether early inclusion would help the model and other tracks.
- **Decision:** Include all eleven classes from the outset of wizard-track development, through
  levels 1–10. Their unusual play behavior principally belongs to table UI/engine work, which has
  separate milestones. Preserve sourced class knowledge for parser, engine and UI consumers.
- **Boundary:** Explicitly includes required supplemental editor choices, grants and derived builds;
  does not enable unrelated supplements/homebrew or claim implemented table support. Forge Steel
  remains a structural and import/export reference; Compendium remains rules authority.

## V100: Conduit domain Piety wording discrepancy — deferred automation

Pinned `en/unified/md/feature/conduit/level-1/domain-piety-and-effects.md` introduces Sun as a
nearby creature taking fire/holy damage and War as damage of 10 + level or higher. The named
paragraphs require an enemy for Sun, and greater than 10 + level in a single turn for War.
V100 retains the complete source and manual trigger resolution. A later automation slice must
resolve which clauses govern; this does not block the level-one editor or manual action routes.

## V106: Companion free strikes and special effects — deferred automation

The printed Beastheart companion stat blocks give Free Strike `1 + M`, while
`vendor/steel-compendium/en/unified/md/rule/monster/creature-free-strike.md` scopes its
no-roll rule to Director-controlled creatures. Alternatives are applying the printed fixed value
or a hero-style roll; recommendation is to retain the printed value visibly and resolve manually
until companion combat integration settles the player-controlled route. V106 does so and does
not create a companion ranged free strike.

Companion-only prose sometimes retains “you and your companion” despite actor-relative pronouns
in `feature/beastheart/level-1/companion-rules.md`; paired areas/recipients remain explicit manual
effects. Lightbender Avoidance replaces saves with expiry; basilisk Stoned requires its own save
damage and contextual cut-away action. V106 exposes source-labelled manual records rather than
reusing ordinary creature conditions or save timers. These are future automation questions, not
blocking character creation or source visibility.


## Q-SUMMONER-1 — level-one portfolio interpretation and manual source gaps

V107 uses the pinned `en/unified/md/class/summoner.md#Summoner Advancement` row `1, 1, 3, 3`
and `feature/summoner/level-1/portfolio.md` circle mapping as two distinct signature species and
two distinct three-Essence species. This is a labelled interpretation: the text does not explicitly
spell out distinctness. Repeated species or individual summoned creatures are alternatives; the latter
conflicts with portfolios being learned options and three-Essence entries summoning two creatures.
Recommendation: retain distinct known options; actual summoning and squad counts remain separate.

`feature/summoner/level-1/essence.md` says sacrifice one or more minions to reduce cost by one,
without unambiguously specifying one reduction per minion. Discount adjudication stays manual;
no one-for-one discount or unwilling-death gain is inferred. `monster/minion/summoner/elemental/statblock/brisk-gale.md`
Whirlwind does not specify shift distance. `monster/minion/summoner/demon/statblock/twisted-bengrul.md`
Soulsight names ensnarer. Both source passages stay verbatim/manual, without invented correction.

## Q-FURY-2 — may a class perk duplicate a perk the hero already has?

`feature/fury/level-2/perk.md` says "You gain one crafting, exploration, or intrigue perk of your
choice." Neither it nor the perk entries under `perk/` say whether a perk already held (for example
Teamwork from the Soldier career) may be chosen again. The Shadow level-two and career perk choices
share the question. Alternatives: exclude perks the hero already has from the choice, or allow the
repeat with no extra benefit. Current behaviour (interim interpretation, V114): the choice is
allowed and grants nothing new. Recommendation: exclude already-held perks, since a repeat has no
printed effect. Nothing else in V114 depends on the answer.

## Q-GRAB-1: how many creatures may a hero or foe hold grabbed, and when does a stat block say otherwise?

Sources:
- `chapter/monster-basics.md`, Creatures Who Grab: a creature "can have only one creature or object
  grabbed at a time unless their stat block specifies otherwise". Once at that maximum, the grabbing
  ability "can't be used against another target unless the creature releases an already grabbed
  target".
- `chapter/classes.md`, Stacking Unique Effects: "A character who is grabbed by an enemy can't be
  grabbed again by another enemy."
- For heroes, `feature/ability/common/grab.md` and `condition/grabbed.md` say only "Unless otherwise
  indicated, a creature can grab only one creature at a time".
- `feature/fury/boren/growing-ferocity.md` ("up to two creatures grabbed at a time") is an example of
  a feature that says otherwise.

Open:
- (1) For heroes, the source does not say whether a second grab fails or replaces the first.
- (2) Does a stat block "specify otherwise" only through explicit text, or also by implication? For
  example, Giant Zombie's Knocking Heads "grabs two creatures or objects", while its Rotten Smash
  targets two with "grabbed". Arixx's Claw Swing (`monster/arixx/statblock/arixx.md`) targets two
  and has no exception, so the monster rule limits it to one.

Current behaviour (V119, interim):
- Compiled grabs apply only when the actor holds no other grab and the use would grab a single
  target.
- A grab on a target already held by another creature is left to the table as `fact-needed`.
- The Grab maneuver's tier 3 is likewise withheld, with a note, in those cases.

Recommendation: for heroes, (b) the new grab fails until one is released, which matches the monster
rule. Treat only explicit text such as Growing Ferocity as "otherwise".

## Q-GRAB-2: does the grab size rule bind grabs imposed by abilities?

`condition/grabbed.md` says "A creature can grab only creatures of their size or smaller" and allows a
Might 2+ creature to grab larger creatures up to their Might. `feature/ability/common/grab.md` says the
Grab maneuver "can usually target only creatures of your size or smaller".

Current behaviour (V119, labelled interpretation):
- The rule is applied to grabs from ability tiers as well.
- A grab the grabber is too small for is `ineligible`.
- The Grab maneuver refuses such a target before rolling, reading "usually" as the Might exception.

Consequences: the Mindkiller (`monster/voiceless-talker/statblock/mindkiller.md`, 1S, Might −1)
cannot grab 1M or 1L heroes with Killer Claws, and the Voiceless Talker Invader (1M, Might −1) cannot
grab a 1L target with Tentacle.

Alternatives:
- (a) grabs imposed by abilities ignore size;
- (b) the table decides each case.

Recommendation: keep the literal rule, since it is the only printed statement, unless you want (b)
for monsters whose signature grabs would never land.

## Q-RES-1: does voiding combat end the encounter for heroic resources?

Every class resource text ends with a variant of "You lose any remaining insight at the end of the
encounter." (`feature/shadow/level-1/insight.md`). Salient ends combat in one of two ways:
- finishing it through closeout (`combat.finish`);
- voiding it (`combat.void`, or closing the session), in reset mode (restore the start snapshot) or
  keep mode (keep the live values).

Current behaviour (V120, labelled interpretation):
- The encounter-end loss runs on `combat.finish`, as the common Malice loss does.
- Reset mode restores the pre-combat pool.
- Keep mode leaves the pool and logs a `combat.resource-kept` note for each generating hero, naming
  the amount kept.

Alternatives considered:
- **(a)** Keep mode applies the loss, treating a void as the end of the encounter.
- **(b)** Keep mode asks the Director whether the encounter is over.

Recommendation: keep the current behaviour. A void is the "undo this combat" path, and finishing is
the rules path.

## Q-RES-7: when does a Self-Taught forgo end?

`complication/self-taught.md`: "At the start of each of your turns during combat, you can forgo
gaining your Heroic Resource until the start of your next turn."

Current behaviour (V150, labelled interpretation):
- The forgo covers the turn-start gain of the turn it is declared for, and every class trigger until
  the start of the hero's next turn.
- At that next turn start the window has ended, so that turn's gain applies, unless the hero forgoes
  again.
- The forgo is declared before the turn start with `/resource forgo`, because the app grants the
  gain at the start of the turn.

Alternative: "until the start of your next turn" also covers the next turn's gain.

Recommendation: keep the current behaviour, since "until" ends the window at that boundary.

## Q-TALENT-2 — Talent Force Orbs range and Strained potency (V136)

`feature/ability/talent/level-3/force-orbs.md` fires an orb "at a creature or object within 5 squares";
the ability's own distance is Self. Alternatives: a Talent distance bonus (Distance Augmentation, +2)
extends the 5 squares, or it does not. Current behaviour: the 5 squares are printed as-is and the orb
strike is a manual record. Recommendation: apply the bonus, since the orb strike is a ranged strike.

Several level-2/3 Strained paragraphs say "The potency of this ability increases by 1" (`slow.md`,
`soul-burn.md`). Interim reading: each tier's potency threshold rises by 1. The Strain records are
manual, so nothing is automated either way. Nothing else in V136 depends on either answer.
## Q-RES-8: strain when combat ends during the Talent's turn

`feature/talent/level-1/clarity-and-strain.md`: "At the end of each of your turns, you take 1 damage
for each negative point of clarity."

Current behaviour (V146, labelled interpretation):
- `combat.end` closes the active turn without a turn-end step, as it does for every other effect.
- A Talent still strained when the Director ends combat during their turn takes no strain for that
  turn. `combat.finish` then resets clarity to 0.

Alternative: apply that turn's strain at `combat.end`.

Recommendation: keep the current behaviour. Ending combat ends the encounter before the turn's end.
The table can apply the damage with `/adjust stamina` if it rules otherwise.
## Q-RES-2: the Fury's "first time you become winded or are dying"

`feature/fury/level-1/ferocity.md`: "The first time you become winded or are dying in an encounter,
you gain 1d3 ferocity."

Current behaviour (V142, labelled interpretation):
- **One grant per encounter.** It applies on the first recorded damage that does either of these:
  - takes Stamina from above the winded value to at or below it (becomes winded);
  - takes Stamina from above 0 to 0 or lower (becomes dying).

  A Fury who starts the encounter already winded and is then hit to dying gains then.
- **No grant at encounter start.** A Fury who starts an encounter already winded or dying gets
  nothing at that point. "Become" reads as a change.
- **Corrections.** A correction that makes the triggering damage no longer cross either threshold
  reverses the grant and frees it for later.
- The table can claim the grant for a state reached another way, such as self-damage entered by
  hand.

Alternatives:
- **(a)** Two grants: one for the first winded and one for the first dying.
- **(b)** A Fury already winded or dying at encounter start gains at once.

Recommendation: keep the single grant. The sentence has one "first time".

## Q-RES-3: does Stamina loss count as taking damage for heroic-resource triggers?

Examples:
- The Fury gains ferocity "the first time each combat round that you take damage".
- To the Uttermost End makes you "lose 1d6 Stamina".
- Bleeding makes a creature "lose Stamina", though `condition/bleeding.md` also says "You take damage
  from this condition".

Current behaviour (V142): only recorded damage (a damage write from an ability, free strike or squad
action) triggers automatically. Stamina loss that the table records with `/adjust stamina` does not.
The table can claim the trigger when it judges the loss to be damage.

Alternative: treat every Stamina decrease as damage.

Recommendation: keep manual claiming, since the rules distinguish losing Stamina from taking damage.

## Q-RES-4: does damage reduced to 0 count as taking damage?

`rule/damage/damage-immunity.md` reduces damage "to a minimum of 0 damage".

Current behaviour (V142): a damage write that changes neither Stamina nor temporary Stamina triggers
nothing. Damage absorbed only by temporary Stamina does count, following
`rule/health/temporary-stamina.md`: "Whenever you take damage while you have temporary Stamina, the
temporary Stamina decreases first".

Alternative: any damage instance, even 0, counts.

Recommendation: keep "0 damage is not taking damage". The table can claim the trigger if it rules
otherwise.

## Q-RES-5: what counts as "the Director uses an ability that costs Malice" for the Null?

`feature/null/level-1/discipline.md`: "The first time each combat round that the Director uses an
ability that costs Malice (see *Draw Steel: Monsters*), you gain 1 discipline."

The pointer "see *Draw Steel: Monsters*" leads to `rule/monster/malice.md`: "Monsters can spend
Malice the way heroes spend their Heroic Resource, activating and enhancing their abilities.
Abilities that make use of Malice have their Malice cost noted in a creature's stat block." Both
activating and enhancing are named there, so readings A and B are both supported. Reading C (a
Malice feature that is not a creature ability) is not.

Current behaviour (V144, labelled interpretation):
- **Automatic** when a creature ability's own printed Malice cost is paid through `ability.use`
  (reading A).
- **Claimed by the table**: Malice spent on an ability's optional enhancement (reading B), and a
  Malice feature that isn't a creature ability (reading C).

Alternatives: (b) count enhancements; (c) count any Malice spend.

Recommendation: keep reading A automatic and B and C as table claims, since only A is unambiguously
"an ability that costs Malice".

## Q-RES-6: does temporary Stamina absorb the Conduit's angered-gods damage?

`feature/conduit/level-1/piety.md`: on a prayer roll of 1, "You take psychic damage equal to 1d6 +
your level, which can't be reduced in any way."

Current behaviour (V147, labelled interpretation):
- Immunity does not apply.
- Temporary Stamina still decreases first, as for any damage taken
  (`rule/health/temporary-stamina.md`). Absorbing damage is not reducing it.

Alternative: the damage bypasses temporary Stamina too.

Recommendation: keep the current behaviour.

## Q-RES-9: the Death domain's two "first time" clauses

`feature/conduit/level-1/domain-piety-and-effects.md`: "You gain 2 piety the first time in an
encounter that a creature within 10 squares who isn't a minion is reduced to 0 Stamina, or the first
time in an encounter that a solo creature within 10 squares becomes winded."

Current behaviour (V147, labelled interpretation): two separate claims, each once per encounter. The
sentence repeats "the first time in an encounter" for each event.

Alternative: one grant for whichever happens first.

Recommendation: keep two, following the repeated clause. Compare the Fury's single "The first time
you become winded or are dying" (Q-RES-2).

## Q-RES-11: what does the Conduit's Blessed Domain add to?

`feature/conduit/level-4/blessed-domain.md`: "Whenever you gain piety from a domain effect, you gain 1
additional piety."

Current behaviour (V147, labelled interpretation): each domain piety trigger gives 3 instead of 2 from
level 4.

Alternatives:
- **(a)** Literally, a "domain effect" is the prayer effect, which grants no piety, so the feature
  does nothing.
- **(b)** Add 1 to the prayer's roll-of-3 outcome, which activates a domain effect.

Recommendation: keep the current behaviour, the only reading that has an effect on domain piety.

## Q-RES-12: how often do the Troubadour's "first time" drama triggers apply, and do they while dead?

`feature/troubadour/level-1/drama.md`: "The first time three or more heroes use an ability on the
same turn, you gain 2 drama." It sits in a list of "events … during a combat encounter". It also says:
"When you are dead, you continue to gain drama during combat as long as your body is intact."

Current behaviour (V149, labelled interpretation):
- "The first time three or more heroes …" applies once per encounter. It is table-claimed.
- Automatic triggers and claims still apply while the Troubadour is dead.
- The turn-start 1d3 applies whenever the dead Troubadour's turn starts.
- Whether the body is intact, and returning at 30 drama, stay with the table.

- A hero already winded when the encounter starts is not "made winded" until they cross the value
  again.
- One hit from above winded straight to dead gives both the +2 (made winded) and the +10 (dies).
- A Troubadour still dead when a later encounter starts (Stamina at or below the negative of the
  winded value) gains nothing in it, from the clock, the observers or claims.
- A correction of a hit that gave another hero drama (a death or the first winded) is refused. The
  table rewinds to the hit and records it again, so the drama is never left or paid twice (QC1
  train-4 R1).

Alternatives: once per turn for the three-heroes trigger; no turn-start gain while dead; a
pre-winded hero counting at encounter start.

Recommendation: keep the current behaviour.
## Q-RES-10: whose "one turn" ends Persistent Magic?

`feature/elementalist/level-1/persistent-magic.md`: "If you take damage equal to or greater than 5
times your Reason score in one turn, you stop maintaining any persistent abilities."

Current behaviour (V148, labelled interpretation):
- Damage is totalled per turn of whichever creature is acting: the encounter's active turn when the
  damage is recorded.
- Damage recorded between turns counts on its own.
- Maintenance stops when the total reaches the threshold.

Alternatives:
- **(a)** Only damage during the Elementalist's own turn counts.
- **(b)** Use a rolling window from the Elementalist's turn to their next turn.

Recommendation: keep the current behaviour. A turn is any creature's turn, and each is counted
separately.

Related V148 limits (labelled):
- The tally counts damage earlier in the same turn, even before maintenance began.
- A correction of damage to an Elementalist in combat is refused, because the turn's tally and any
  break can't be recomputed. The table rewinds to the hit and records it again (QC1 train-4 R2).
- Maintenance starts only right after the use: "start doing so immediately after you first use the
  ability" (QC1 train-4 R3). The latest standing command must be that use. Any command after it,
  including another use or a maintain already made, or a turn change, closes the choice. Several
  instances are made as use, maintain, use, maintain.

## Q-ELEMENTALIST-2 — what action exits Earth Accepts Me? (V151)

`feature/ability/elementalist/level-3/earth-accepts-me.md`: "You can remain inside the object for as long
as you like … You can travel through the object freely until you exit it." No action type is printed for
leaving. Current behaviour: "Earth Accepts Me: Exit Object" is its own record labelled "Action type not
stated", resolved manually. Alternatives: a maneuver (like ending other effects) or part of your
movement. Recommendation: treat it as part of your movement, since the text frames leaving as the end
of travelling through the object. Nothing else depends on the answer.

## Q-SUMMONER-2 — Summoner levels 2–3 readings (V138)

The pinned Compendium leaves these open; V138 builds the reading marked "current" and keeps the
effects manual.

- **Which fixture?** `feature/summoner/level-2/summoners-dominion.md` summons "a fixture from your
  minions' native manifold or origin". No rule maps circles to fixtures. Current: one per circle through
  its portfolio family (`feature/summoner/level-1/portfolio.md`) and the only featureblock under
  `monster/fixture/<family>/`: The Boil, Barrow Gates, Glade Pond, Primordial Crystal (the crystal's only
  tie to Storms is its path). Alternative: any fixture.
- **How many new minions?** `new-portfolio-minion.md` says "new minions"; the advancement row adds one
  "5" (`1, 1, 3, 3, 5`). Current: one 5-essence minion from the circle's family. Alternatives: all three,
  or a number the Director sets.
- **Is the fixture a minion?** It is called forth "like any minion"; Elite Formation gives "each of your
  minions" +3 Stamina and +1 stability. Current: the printed 20 + your level only, not counted against
  the minion maximum. Alternative: Elite applies (25/26) and it counts as a minion.
- **Summoner Strike distance with the kit.** `summoners-kit.md`: the distance "is now equal to your
  Summoner's Range"; the strike printed "Melee 1 or Ranged 5" with a Charge special. Current: Summoner's
  Range. Alternative: "Melee 1 or Ranged (Summoner's Range)", keeping melee and Charge (Lead By Example
  prints that dual form).
- **Leader Formation and the class kit.** `leader-formation.md` grants its benefit "while you don't have
  a kit"; Summoner's Kit arrives at 3rd level. Nothing is implemented either way yet.

Recommendation: keep the current readings except the strike distance, where keeping Melee 1 matches
Lead By Example and the Charge special.

## Q-COND-1: does the save for "prone and can't stand (save ends)" also end prone?

**Answered 2026-09-24: (A).** The save ends the restriction and the creature stays prone until it
uses Stand Up. See [the automation rulings](decisions/2026-09-24-automation-rulings.md#5-q-cond-1-prone-and-cant-stand).

This wording appears in 13 abilities. Examples: Judgment's Hammer tier 3 (`feature/ability/conduit/level-1/judgments-hammer.md`) and Staggering Blow (`feature/ability/shadow/level-3/staggering-blow.md`).

What the sources say (pinned `en/unified/md`):
- `condition/prone.md`: a prone creature can use Stand Up "unless the ability or effect that
  imposed the prone condition says otherwise".
- `rule/general/saving-throw.md`: a "(save ends)" effect is removed by a successful save.
- `rule/character/potency.md` explains Judgment's Hammer as "knocked flat and left struggling to
  stand". It never describes what a successful save does.
- Other stat blocks print prone and a can't-stand restriction separately, or give can't stand its
  own duration ("until the end of their next turn").

Both readings agree the creature is prone and can't use Stand Up until the save succeeds. They
differ on what the successful save removes:
- **(A)** Only the can't-stand restriction. The creature stays prone until it uses Stand Up.
- **(B)** The whole effect. Prone ends as well.

QC1 (2026-09-24, `../review-artifacts/2026-09-24-Q-COND-1-QC1.md`) finds A plausible but not
settled. Until you rule, the save result stays with the table.

Recommendation: A. The separately printed examples read that way, and a creature knocked prone
normally has to stand up itself.

## Q-RESPITE-1 — does Cancel revert a level-up or edit taken during the respite? (V165)

The ruling (docs/table-spec.md, "Ending a respite") says Cancel reverts "every change made during the
respite … (activities, kit swaps and other respite choices), as if it never started." Current behaviour:
Cancel restores participants' live values (damage taken and Recoveries spent) and reverts respite
choices; a level-up or an approved edit taken meanwhile is a separate operation and stays. Alternatives:
revert those builds too, or block level-ups and edits for participants while a respite is open.
Recommendation: keep the current behaviour; players often take their level-up whenever they get to it.

## Q-EFFECT-1: when does "until the end of your next turn" end if used on your own turn? (V158)

**Answered 2026-09-24: (B).** An effect that lasts "until the end of your next turn", used on your
own turn, lasts through your following turn and ends at the end of that turn. Used off your turn (a
triggered action, say), it ends at the end of your next turn, the next one you take. V172
([slice](build/V172-next-turn-duration.md)) binds it. The ruling covers the user-anchored ("your")
phrase only: the "(EoT)" tag keeps its explicit carve-out, and the target-anchored "their next turn"
keeps its V158 binding (the first end of the subject's turn after the effect is applied).

No passage defines the phrase; a Compendium research pass supports B by inference (pinned
`en/unified/md`):
- `rule/combat/end-of-turn.md` lines 2 and 7: "A creature suffers from such an effect until the end
  of their next turn, or the end of their current turn if the effect was imposed on their current
  turn". The carve-out is stated for the "(EoT)" tag only.
- `feature/ability/shadow/level-2/sticky-bomb.md` line 35: the creature can disarm the bomb "as a main
  action. If they don't, at the end of your next turn, the bomb detonates". Under A the bomb, placed
  on your turn, would detonate before the creature could take a main action.
- `feature/ability/shadow/level-5/blackout.md` line 27: a cloud "until the end of your next turn"
  that lets you strike enemies who end their turn in it, which under A would end before any enemy's
  turn.
- `feature/ability/elementalist/level-3/swarm-of-spirits.md` lines 44 and 46: the Persistent rider
  "lasts until the start of your next turn" beside a base "until the end of your next turn", so the
  two are distinct spans.
- `feature/ability/common/claw-dirt.md`: "(EoT)" on yourself is the explicit rule, with different
  wording.

The question as raised:

Example: Swarm of Spirits (`feature/ability/elementalist/level-3/swarm-of-spirits.md`), "Until the
end of your next turn, …", used on the elementalist's own turn.

What the sources say (pinned `en/unified/md`):
- `rule/combat/end-of-turn.md` defines EoT for the target: "until the end of their next turn, or
  the end of their current turn if the effect was imposed on their current turn".
- Nothing printed defines "your next turn" for the user of the ability.

Readings:
- **(A)** Apply the EoT rule to the user as well: used on your turn, it ends at the end of that
  turn. V158 does not bind either reading: the grammar refuses the phrase, so such sentences stay
  manual until the user rules.
- **(B)** "Next" means the turn after the current one: used on your turn, it lasts through your
  following turn.

Recommendation: B for effects anchored to the user, since the EoT sentence speaks about the target
and "next turn" otherwise reads as the following turn. The binding changes before any sentence
with this anchor compiles.

### Q-V-3: Does imported Forge Steel damage and Recoveries used survive admission? (V09)

- **Status:** deferred (Forge import paused, user ruling 2026-09-25)
- **Raised by:** V09 part a, 2026-09-24
- **Where:** `docs/character-wizard-spec.md#required-import` ("stores Stamina damage and Recoveries
  used ... Reconcile those representations explicitly"); Q-R-201 above (destination admission starts
  fresh); `docs/forge-steel-interchange.md#current-state-is-not-simply-current-totals`. Compendium
  paths as read for Q-R-201: `rule/health/{stamina,recoveries}.md`; the source has no notion of
  importing a hero.
- **Conflict or gap:** A Forge file carries `state.staminaDamage`, `state.recoveriesUsed`, surges,
  XP, Victories and conditions. Part a imports only the build as an unattached draft and reports
  non-default play state as a diagnostic; the verbatim file keeps the values. The spec asks for
  explicit reconciliation, but Q-R-201 says admission to a campaign starts full.
- **Options:** A: admission starts full (Q-R-201); Forge play state stays preserved data only.
  B: first admission seeds current Stamina = max − damage and Recoveries = max − used, clamped.
  C: offer B as an owner choice at submission, shown to the Director for approval.
- **Recommendation:** A. It matches the existing Q-R-201 ruling, keeps campaign values owned by the
  campaign, and needs no new approval path. Part c can still show the Forge values to the owner.
- **Blocked until answered:** V09 part c state reconciliation; part a is unaffected.
- **Answer:**

### Q-V-4: Which Forge Steel versions and file shapes does import support? (V09)

- **Status:** deferred (Forge import paused, user ruling 2026-09-25)
- **Raised by:** V09 part a, 2026-09-24
- **Where:** `docs/character-wizard-spec.md#required-import` ("within an explicitly tested support
  range") and `#12-open-decisions` (historical Forge shapes); `docs/forge-steel-interchange.md`
  ("Do not infer an exact Forge Steel application version from a hero file that contains none").
- **Conflict or gap:** A `.ds-hero` file carries no version. Part a validates the shape of the
  vendor pin `5a846aadb623a9855a023e9403bb887a956c341f` and is tested only on exports from website
  versions 14.198.0 and 14.199.0. Older or newer shapes may pass the guard yet use other feature ids.
- **Options:** A: support the pinned shape only; any other shape is rejected or diagnosed.
  B: also accept named older shapes, each with a retained fixture. C: accept anything that passes
  the guard and rely on diagnostics.
- **Recommendation:** A now, with B added per retained fixture when a real file needs it. C lets
  unproven ids map silently.
- **Blocked until answered:** nothing; part a applies A provisionally.
- **Answer:**

### Q-V-5: Is preserved unmapped Forge data shown to the owner? (V09)

- **Status:** deferred (Forge import paused, user ruling 2026-09-25)
- **Raised by:** V09 part a, 2026-09-24
- **Where:** `docs/character-wizard-spec.md#required-import` ("Unmapped mechanics remain visible and
  preserved"); V09 open question on preserved compatibility data.
- **Conflict or gap:** Part a stores the verbatim file and a diagnostic list (path, Forge id, name,
  reason) in `characterImports`, owner-only, and returns the diagnostics from the mutation and CLI.
  Nothing yet shows them in the app after the import.
- **Options:** A: show the diagnostics list on the imported character to its owner only.
  B: also show it to the Director at admission review. C: report only at import time.
- **Recommendation:** A, and B for items that affect the build (unmapped choices), since the
  Director approves the build; play-state notes need not reach the Director.
- **Blocked until answered:** V09 part b import UI; part a is unaffected.
- **Answer:**

### Q-V-6: What happens to a Forge file above the supported level? (V09)

- **Status:** deferred (Forge import paused, user ruling 2026-09-25)
- **Raised by:** V09 part a, 2026-09-24
- **Where:** `docs/character-wizard-spec.md#required-import` ("If an earlier level is requested,
  reconstruct only what the available data establishes"); `shared/content/character-support.ts`
  (supported definition levels).
- **Conflict or gap:** Salient's definitions stop below level 10 for most classes. Part a rejects a
  file whose level has no Salient definitions, writing nothing. A file at a defined level whose class
  lacks mappings for that level imports with those choices diagnosed.
- **Options:** A: reject, as now. B: import at the highest supported level with only the choices
  that level establishes, and say so. C: store the file as a pending import to finish once the level
  is supported.
- **Recommendation:** A until more levels exist; B risks presenting a build the player never had.
- **Blocked until answered:** nothing; part a applies A.
- **Answer:**

## Q-STRAIN-1: how a strained Mind Spike or Spirit Sword deals its damage (V170)

**Answered 2026-09-24: yes to all three current behaviours** (below): the extra damage is folded
into the hit; "can't be reduced in any way" skips immunity only; outside combat the engine rolls the
automatic 1d6, except for a Talent with Steel Ward or Force Orbs, where it is left to the table. V170
already does this; no code changes.

V170 bound these as labelled interpretations so the two abilities could compile. Pinned `en/unified/md`:
- `feature/ability/talent/level-1/mind-spike.md`: "Strained: The target takes an extra 2 psychic
  damage. You also take 2 psychic damage that can't be reduced in any way." Spirit Sword
  (`spirit-sword.md`) prints the same with an untyped 3.
- `rule/damage/damage-immunity.md`: "Damage immunity should be the last thing applied when
  calculating damage."
- `feature/talent/level-1/clarity-and-strain.md`, Clarity Outside of Combat: "you take 1d6 damage and
  incur any strain effect"; "you can take 1d6 damage and incur the effect".

Current behaviour:
1. **Extra damage.** The target's extra damage is added to this use's damage to that target (the same
   type as every tier's damage), so immunity and weakness apply once to the total. Alternative: a
   second damage instance, so immunity reduces each part separately.
2. **"Can't be reduced in any way"** follows Q-RES-6: immunity does not apply; temporary Stamina still
   absorbs it first; a weakness still adds, since it does not reduce. Alternatives: bypass temporary
   Stamina too; or ignore weakness as well.
3. **Outside combat.** When the table declares `strained=yes` and the engine would not have found the
   hero strained, the engine rolls the 1d6 and applies it as ordinary damage before the Strained
   effect. For a Talent with Steel Ward or Force Orbs it is logged as due and left to the table, as
   the V146 turn-end strain is. Alternative: always leave the 1d6 to the table.

Recommendation: keep all three.

## Q-WATCH-1: who deals a lasting effect's damage, and does a repeat use reset "the first time"? (V171)

Open; V171 binds labelled interpretations so watchers can compile. Pinned `en/unified/md`:
- `feature/ability/conduit/level-1/violence-will-not-aid-thee.md`: "The first time on a turn that the
  target deals damage to another creature, the target of this ability takes 1d10 lightning damage
  (save ends)."
- `rule/combat/turn.md` (turns exist only in combat); Heroes book, "Stacking Unique Effects" (the same
  ability used again doesn't stack; the most recent use sets the duration).

Current behaviour:
1. **Dealer.** Damage a watcher deals (the 1d10 lightning above) has no dealer, so it sets off the
   recipient's damage-taken watchers but no creature's damage-dealt watchers. Alternative: the effect's
   owner (the Conduit) deals it, which could set off the owner's own "whenever you deal damage"
   effects.
2. **Repeat use.** When the same user's identical repeat supersedes an earlier use (V158), the newer
   instance keeps the earlier firings, so "the first time on a turn" is not reset within that turn.
   Alternative: the new use starts fresh and can fire again in the same turn.
3. **Outside turns.** "The first time on a turn" and "once per round" need an active turn or round;
   damage dealt outside combat or between turns is left to the table (logged), not fired.
   Alternative: treat each out-of-turn damage as its own window.

Recommendation: keep all three; nothing compiled yet depends on 1 beyond Violence Will Not Aid Thee.

## Q-TRIG-1: the triggering damage, "an ally", and offers outside combat (V173)

Open; V173 binds labelled interpretations so Feedback Loop and Riposte can be offered. Pinned
`en/unified/md`:
- `feature/ability/talent/level-1/feedback-loop.md`: Trigger "The target deals damage to an ally.";
  Effect "The target takes psychic damage equal to half the triggering damage."
- `rule/damage/damage-immunity.md`: immunity "should be the last thing applied when calculating
  damage … if your hero has fire immunity 5 and takes 8 fire damage, they take 3 damage."
- `rule/combat/target.md`, Creature: "You aren't an eligible creature target for your own abilities
  unless those abilities also have "self" as a target (see below), or unless the ability indicates
  otherwise." It governs targets, not trigger wording, so point 2 is an interpretation.
- `rule/combat/triggered-action.md`: one triggered action per round; `rule/combat/turn.md`: turns
  and rounds exist only in combat.

Current behaviour:
1. **Triggering damage.** It is the damage the damaged creature took: the Stamina and temporary
   Stamina it lost, after immunity and weakness (a hero at 5 damage with nothing to reduce it gives
   Feedback Loop 2). Alternative: the amount before immunity and weakness.
2. **"An ally"** (interpretation). An ally is another creature on your side, never yourself, so a goblin damaging the
   Talent herself doesn't set off her Feedback Loop. The app places heroes on the players' side and
   foes on the Director's (`rule/combat/side.md`). Alternative: "an ally" includes yourself.
3. **Outside combat.** Offers are made only while combat turns are running, where the per-round limit
   and the next-turn window exist. Outside combat the ability is used by hand
   (`/ability use`), and damage sized by the triggering damage is left to the table. Alternative:
   offer outside combat too, with no limit and no window.

Recommendation: keep all three.

## Q-REACT-1: halving order, Parry's adjacency, and spent-gain accounting (V174)

Open; V174 binds labelled interpretations so six damage-changing responses can revise the hit.
Pinned `en/unified/md`:
- `rule/damage/damage-immunity.md`: "Damage immunity should be the last thing applied when
  calculating damage. For instance, if your hero has fire immunity 5 and takes 8 fire damage, they
  take 3 damage. But if an ally first halved the damage with a triggered action, your hero would
  take 4 damage before immunity is applied, with immunity then reducing the damage to 0."
- `rule/damage/damage-weakness.md`: "If a creature has both damage immunity and damage weakness for
  a source of damage, apply the weakness first, then the immunity." Neither file places a halving
  relative to weakness.
- `feature/ability/tactician/level-1/parry.md`: "You can shift 1 square. If the target is you, or if
  you end this shift adjacent to the target, the target takes half the damage. If the damage has
  any potency effect associated with it, the potency is decreased by 1."
- `docs/lasting-effects-design.md` section 5b names the spent-gain attribution an open accounting
  choice.

Current behaviour:
1. **Halving order** (interpretation). The damage as dealt is halved (rounded down,
   `rule/general/always-round-down.md`), then weakness, then immunity: 10 fire against fire
   weakness 5 becomes 5 + 5 = 10. Halved damage of 0 takes no weakness (Q-RES-4: 0 damage is not
   damage taken). Alternative: apply weakness first and halve the result (15 → 7), immunity still
   last.
2. **Parry's adjacency** (interpretation). There is no map, so accepting the card for an ally is
   the table's confirmation that the Tactician ends the shift adjacent to them; the potency
   decrease applies with the halving. Parry used on yourself needs no confirmation. Alternatives:
   a separate "adjacent" answer on the card; or applying the potency decrease even when the
   Tactician does not end adjacent (the sentence does not repeat the condition), which the table
   can do by using Parry by hand.
3. **Spent gains** (accounting choice, not a rules claim). When a revision reverses a heroic
   resource gain, spending since the gain is charged to gains made after it first, so the part of
   the gain still in the pool is the pool's rise above its level just before the gain. That part is
   removed; the rest stands and the log says how much. Alternative: attribute each spend at the
   time it happened (a later gain then never shields an earlier one), which needs a per-spend
   ledger the app doesn't keep.
4. **"One effect"** (interpretation). `feature/ability/null/level-1/inertial-shield.md`, Spend 1
   Discipline: "The potency of one effect associated with the damage is reduced by 1 for you." The
   source doesn't say who picks the effect or what happens when only one would change. When only
   one of the hit's potency effects would change, that one is reduced without asking; when several
   would, the answer names one (`potency=`). When the hit has several potency effects and none
   would change now, the answer must still name one. The reduction lasts, and a later reduction
   builds on it (QC1 train 16), so the engine never credits it to one silently. A single potency
   effect needs no answer. Alternatives: always ask which effect, even when only
   one would change; or let the user pick any potency effect, including one the reduction doesn't
   change.

Recommendation: keep all four.

## Q-MARK-1: marks from abilities other than Mark, the retarget, and "reduced to 0 Stamina" (V175)

Open; V175 compiles the Tactician's Mark and keeps the other mark sources manual. Pinned
`en/unified/md`:
- `feature/ability/tactician/level-1/mark.md`: "The target is marked by you until the end of the
  encounter, until you are dying, or until you use this ability again." "When a creature marked by
  you is reduced to 0 Stamina, you can use a free triggered action to mark a new target within
  distance." "You can initially mark only one creature using this ability, though other tactician
  abilities allow you to mark additional creatures at the same time."
- `feature/ability/tactician/level-1/mind-game.md`: "You mark the target."
  `feature/ability/tactician/level-2/fog-of-war.md` and `targets-of-opportunity.md`: "Each target is
  marked by you, and …" None of the three prints how long its mark lasts.
- `rule/health/stamina.md`: "In most circumstances, Director-controlled creatures die or are
  destroyed when their Stamina drops to 0."

Questions and current behaviour:
1. **How long does a mark from Mind Game, Fog of War or Targets of Opportunity last, and does using
   Mark again end it?** Not printed. These abilities stay manual (`mark-manual` diagnostics) until
   answered. Recommendation: such a mark follows the Mark's printed lifecycle (end of the encounter,
   or until you are dying), but only marks made with Mark end when you use Mark again, since "at the
   same time" says the extra marks coexist with the Mark's. Alternatives: every mark ends when you
   use Mark again; or each lasts until the end of the encounter only.
2. **The retarget** (interpretation). The free triggered action "to mark a new target" is treated as
   a use of Mark: the new mark has Mark's lifecycle, and the owner's earlier Mark marks (including
   the one on the creature at 0 Stamina) end, as "until you use this ability again" says.
   Alternatives: the new mark is additional and the old one stays until the encounter ends; or the
   new mark has no printed duration.
3. **"Reduced to 0 Stamina"** (interpretation). Stamina going from above 0 to 0 or lower in one
   damage write offers the retarget, since the app records a foe's arithmetic Stamina below 0 and
   `stamina.md` says such creatures die when Stamina "drops to 0". Alternative: only an exact 0.
4. **The Recovery benefit** (interpretation). "The creature dealing the damage can spend a
   Recovery": the Tactician picks the benefit, and accepting it is the table's confirmation that the
   dealer spends one (`rule/health/recoveries.md`: they regain their recovery value). Alternative:
   a second card for the dealer to accept or decline.
5. **A dying Tactician's Mark** (interpretation). A Mark used while its user is already dying ends
   as it is applied ("until you are dying"). It never marks the creature, so another Tactician's
   mark on it doesn't end. Alternative: the marking still ends the other Tactician's mark, leaving
   the creature unmarked.
6. **Hit 'Em Hard!'s "that creature"** (interpretation).
   `feature/ability/tactician/level-3/hit-em-hard.md`: "whenever you or any ally deals damage to a
   target marked by you, that creature gains 2 surges, which they can use immediately." "That
   creature" is read as the one who dealt the damage (you or the ally), since surges help the
   creature that uses them. Alternatives: the marked target gains them; or the Tactician does.
7. **The Mark's extra damage with several targets** (interpretation). "The ability deals extra
   damage equal to twice your Reason score" is added only to the marked creature whose damage set
   off the trigger, since the trigger is rolled damage "to a creature marked by you". Alternative:
   every target the ability damaged takes the extra damage.

Recommendation: 1 as above; keep 2 to 7.

## Q-MARK-2: can players see marks on foes? (V175, product)

Open (`docs/lasting-effects-design.md`, "Questions for the user", 1). V175 implements the
recommendation: marks are table knowledge, so players and observers see a foe's marks on the
roster and in `effect.list`. The decision is one constant, `MARKS_VISIBLE_TO_PLAYERS` in
`shared/resolve/marks.ts`. It gates the foe roster projection and `effect.list` only; the Director
always sees marks. It does not gate the game log (the Mark use and its linked entries are a
player's own use, whose log text every member sees), the Mark cards and their `trigger.offered`
lines, or hero sheets (a hero's sheet is shown only to its player and the Director). A "no" answer
would also need a per-audience log description for those entries. Recommendation: yes.
Alternative: only the Director and the marking Tactician's player see them.

## Q-FM-1: a negative score in Machinations of Sound (V176)

Open; kept manual. `feature/ability/shadow/level-2/machinations-of-sound.md` (pinned
`en/unified/md`): "This forced movement ignores stability. Instead, the forced movement is reduced
by a number equal to the target's Intuition score." Nothing printed says what a negative Intuition
does. V176 computes the slide allowance for Intuition 0 or higher, never below 0 (forced movement is
"up to X squares", `movement/forced-movement.md`), and leaves a target with negative Intuition as a
manual push outcome that cites this question. Alternatives: a negative score lengthens the slide
(Slide 5 at Intuition −1 is 6); or it reduces the slide by nothing. Recommendation: reduce by
nothing, since the sentence only ever reduces the movement.

## Q-FM-2: readings behind the V176 forced-movement follow-ups

Open. Compendium paths read (pinned `en/unified/md`): `movement/forced-movement.md`,
`rule/character/stability.md`, `rule/dice/ability-roll.md` ("Abilities With Damage and Effects"),
`movement/teleport.md`, `condition/restrained.md`, and the four abilities below. V176 compiles them
on these readings; each is an interpretation with its alternatives.

1. **"The same distance" when targets roll different tiers.**
   `feature/ability/conduit/level-1/call-the-thunder-down.md`: "You can push each willing ally in
   the area the same distance, ignoring stability." With one tier for every target, the rider shows
   that push distance. With different tiers (per-target edges or banes), the rider asks the table
   to pick one, by analogy with `rule/dice/ability-roll.md`: "If different tiered outcomes affect
   multiple targets, the creature using the ability picks which tier of rolled effect applies to
   them or the Director." Alternatives: the highest tier's distance; each ally uses the distance
   of the target nearest to them; or the distance the enemies were actually pushed, which depends on
   the movement outcome and would stay table work.
2. **Sentenced's exception is table work.**
   `feature/ability/censor/level-2/sentenced.md`: "While the target is restrained this way, your
   abilities that impose forced movement can still move them." The engine never automates forced
   movement of a restrained creature (`condition/restrained.md`: it "can't be force moved"; any
   active condition leaves a push outcome manual). So this exception is shown as table work once
   the restrained outcome is known, and the restrained condition instance, whose source is
   Sentenced, shows how long it lasts. Alternative: a tracked effect instance tied to that
   condition, which the Censor's later pushes would read. That would change nothing the engine
   computes today.
3. **Thunder Roar's ordering and collisions are table work.**
   `feature/ability/fury/level-1/thunder-roar.md`: "The targets are force moved one at a time,
   starting with the target nearest to you, and can be pushed into other targets in the same line."
   It replaces the user's choice of order (`movement/forced-movement.md`, "Multitarget Abilities
   and Forced Movement") and permits collisions between targets. The table resolves collision
   damage ("Slamming into Creatures") for every push. Alternative: keep the ability manual until
   collisions are modelled.
4. **Phase Inversion Strike's push waits on the teleport.**
   `feature/ability/null/level-1/phase-inversion-strike.md`: "Before the push is resolved, you
   teleport the target to a square adjacent to you and opposite the one they started in. If the
   target can't be teleported this way, you can't push them." The teleport is table work. The push
   outcome keeps its calculated distance but gives no allowance: no operation confirms the teleport
   yet, so the push stays table work after it. Teleporting ends grabbed and restrained on the target
   (`movement/teleport.md`), which the table records with `condition off`. Alternatives: show the
   push allowance now, with the teleport precondition as a warning; or keep the ability manual.
5. **Thunder Roar's size bonus.** `movement/forced-movement.md`, Big Versus Little: "When a larger
   creature force moves a smaller target with a melee weapon ability, the distance of the forced
   movement is increased by 1." Thunder Roar is an area ability with the Melee and Weapon keywords, and the engine
   already reads Melee plus Weapon keywords as a melee weapon ability. Alternative: an area ability
   is not a melee weapon ability for this rule, so no bonus.

Recommendation: keep 1 to 5 as implemented.

## Q-DT-1: readings behind the V177 damage-type options

Open. Compendium paths read (pinned `en/unified/md`): `rule/damage/damage-type.md`,
`rule/damage/damage-immunity.md`, `rule/damage/damage-weakness.md`,
`feature/fury/stormwight-kits/primordial-storm.md`, the four `feature/fury/<kit>/primordial-storm-*.md`,
and the three abilities below. V177 compiles them on these readings. Items 1 to 3 are
interpretations, each with its alternatives. Items 4 and 5 are findings outside the slice.

1. **Ray of Wrath without a choice deals untyped damage.**
   `feature/ability/conduit/level-1/ray-of-wrath.md` prints "2 + I damage" (untyped, as
   `rule/damage/damage-type.md` describes typical damage) and "You can have this ability deal holy
   damage." A use without `damage-type` deals the printed untyped damage; `damage-type=holy` deals
   holy. Alternative: require an explicit answer on every use (holy or untyped), so a forgotten
   choice against a creature with holy weakness can't pass silently.
2. **Visceral Roar's type is not chosen.** `feature/ability/fury/level-2/visceral-roar.md`: "This
   ability deals your primordial damage type (see Stormwight Kits)." The type is read from the
   user's Primordial Storm feature, for example `feature/fury/boren/primordial-storm-blizzard.md`:
   "Your primordial damage type is cold." The ability is a Stormwight choice, whose kit grants that
   feature. A user without one is refused, and so is a `damage-type` that differs from the kit's. Alternative: let the table name one of the
   four primordial types when no kit feature is found.
3. **Hurl Element's choice is made with the use, before the roll, once for the use.**
   `feature/ability/elementalist/level-1/hurl-element.md`: "When you make this strike, choose the
   damage type from one of the following options: …". The type is given with `ability.use` and
   applies to whichever tier the roll gives. Hurl Element has one target, so it can't differ per
   target. Alternative: choose after seeing the tier. That would change only which immunity or
   weakness the table aims at, since no option changes the tier damage.
4. **Finding: foes' printed immunity and weakness cells are not read.** A foe whose stat block
   prints either cell (for example `monster/demon/1st-echelon/statblock/ruinant.md`, "Holy 3"
   weakness) gets `fact-needed` damage from every ability. So a chosen type changes foe damage only
   once those cells are read. Recommendation: a separate slice that reads the cells, typed and
   untyped, citing `rule/damage/damage-immunity.md` and `damage-weakness.md`.
5. **Finding: hero damage weaknesses don't reach the damage facts.** The evaluator records them,
   for example the Revenant's "you have fire weakness 5"
   (`feature/trait/revenant/tough-but-withered.md`) and complication weaknesses, but
   `damageTargetFacts` passes only immunities. Recommendation: the same separate slice.

Recommendation: keep 1 to 3 as implemented. Schedule 4 and 5.
## Q-XP-1: does a hero admitted above level 1 carry table XP? (V190)

Resolved 2026-09-25 by the user's XP bank ruling ([V191](build/V191-xp-bank.md),
[respite mode](table-spec.md#respite-mode)): XP is a bank, so an admitted hero starts with an empty
bank at any level and the question no longer arises. The original entry follows as history.

Was: open; implementation interpretation in place. `chapter/making-a-hero.md`, Heroic Advancement: "The
amount of Experience you gain is cumulative", and the Heroic Advancement Table gives a 3rd-level
hero 32-47 XP. Salient stores only XP earned after entry (a hero admitted at level 3 starts at 0 XP)
and derives the entry level from `entryLevelXpOffset` ((entryLevel − 1) × 16), so earned level =
min(10, entry level + floor(XP ÷ XP per level)) at any campaign pace, and the sheet's "level 5 at 32"
counts XP after entry. Alternative: cumulative table XP, storing and showing the entry level's table
XP plus earned XP (the level-3 hero starts at 32 and sees "level 5 at 64"); that ties the entry XP to
one pace, so a campaign at 8 or 32 per level would need the entry XP recomputed. Recommendation: keep
the current reading; it works at every pace and changes no stored data.

4 and 5 are addressed by V178 (`docs/build/V178-immunity-weakness.md`); its readings are Q-IW-1.

## Q-IW-1: readings behind V178's damage immunity and weakness

Open. Compendium paths read (pinned `en/unified/md`): `rule/damage/damage-immunity.md`,
`rule/damage/damage-weakness.md`, `rule/damage/damage-type.md`,
`feature/summoner/level-1/minions.md`, `feature/ability/tactician/level-1/mark.md`, and every
ingested stat block's Immunity and Weakness cell (enumerated in
`tests/scripts/immunity-weakness.test.ts`). V178 applies them on these readings; each is an
interpretation with its alternatives.

1. **"Damage N" and untyped damage.** A "Damage 3" cell (for example
   `monster/giant/statblock/hill-giant-clobberer.md`) is read as the untyped damage immunity:
   `damage-immunity.md` says a stat block noting "damage immunity 5" is "representing immunity to
   all damage". It applies to typed and untyped damage alike, as R04 section 6.2 already did for
   hero entries. For weakness, `damage-weakness.md` says "A creature who has "damage weakness X"
   with no specific type or keyword indicated has weakness of the indicated amount when they take
   damage of any type." That is read the same way, including untyped damage (the Cursed Weapon
   complication's "You have damage weakness 2."). Alternative: "of any type" means any of the nine
   types in `damage-type.md`, so untyped damage takes no untyped weakness.
2. **No damage takes no weakness.** A damage instance of 0 adds no weakness, as Q-RES-4 ("0 damage
   is not taking damage") and the V174 halving (Q-REACT-1) already read it. Alternative: weakness
   adds even to 0 damage.
3. **The Mark's extra damage joins the hit.** `mark.md`: "The ability deals extra damage equal to
   twice your Reason score." The extra is added to the hit's damage before immunity, using the
   weakness and immunity the hit met as its current accepted revision saved them, so each counts
   once. Only the difference is written: for example Hill Giant Clobberer, 8 − 3 = 5, then
   8 + 4 − 3 = 9, so 4 more. Alternatives: a separate damage instance, where immunity reduces the
   extra again (1 more in that example); or leave it to the table, as V175 did.
   When a response has already halved the hit (V174), the extra is added to the halved amount and
   is not itself halved. For example, 8 halved to 4, plus 4, is 8 before immunity. This reads the
   halving as done before the benefit was taken. Alternative: the extra joins the ability's damage
   before the halving, so it is halved too: (8 + 4) / 2 = 6 before immunity.
4. **Cells left manual.** These keep the damage manual, with the cell named:
   - Summoner minions' "R" values, for example "Corruption R, Poison R"
     (`monster/minion/summoner/undead/statblock/skeleton.md`). `minions.md`: "You use your own
     characteristics where a minion's stat block refers to an R". These aren't addable as foes
     today.
   - The trolls' "Acid 5, fire" and "Acid 8, fire" weaknesses, for example
     `monster/troll/statblock/troll-whelp.md`. The fire item prints no value in the cell or the
     frontmatter, whose `weaknesses` list is "Acid 5" and "fire". **Question:** what is the trolls' fire weakness
     value? Recommendation: leave it manual until the source prints one.
   - The Orc Eye of Grole's "Cold, fire, or lightning" immunity
     (`monster/orc/statblock/orc-eye-of-grole.md`, Elemental Affinity: "The chosen type determines
     the eye's damage immunity"). No value is printed.

   - Stat blocks whose own features change their immunity or weakness outside the cells
     (`FOE_MODIFIER_TRAITS` in `shared/resolve/damageModifiers.ts`, which quotes each feature). A
     silently wrong number is worse than manual, so their damage stays manual and the diagnostic
     names the feature. They fall into these groups:
     - **Standing or conditional traits:** Count Rhodar's Grave Ward ("Rhodar has damage immunity
       5. If he takes holy damage, he loses this immunity until the end of the round."), the Devil
       Legate's Hellish Bailiff, the 13 shadow elves' Of the Umbra, the ogres' Anger traits, and
       Xorannox's six eyes' Psionic Barrier.
     - **True Name**, which removes immunities: the devil Adjudicator, Clerk, High Judge, Jurist,
       Legate, Magistrate, Notary and Scrivener, and the Devil Defector retainer. No "Detective" stat
       block is among the ingested ones.
     - **Abilities that change the user's own immunity or weakness:**
       - Locratix's Absorbing Scales and Phrrygalax's Armor of the Ancients (the swap);
       - the Crucible Dragon's Subdermal Shielding, and Break Armor on the Force of Earth and the
         Marble Stone Giant;
       - the Crux of Fire and the Essences of Storms and Tides (Convocation, "Self or one
         elemental");
       - the Lich's Necrotic Form, Lord Syuul's and the Evolutionist's Adaptability;
       - the Olothec's Psychic Pulse (`monster/olothec/statblock/olothec.md`: "Additionally, until
         the start of their next turn, the olothec has damage immunity 4.");
       - the Minotaurs' Bays, the Bonecage's Ribcage Chomp, and the Bandit Chief's Form Up!;
       - the Kobold Centurion's Testudo! and Are You Not Entertained?!;
       - the war dogs: Doomthief, Tetrarch, Iron Priest (Iron Banner), Castellan Hoplon, Soulbinder
         Psyche and Strategos Alkestis.
     - **Heroes:** the Corrupted Mentor complication (`complication/corrupted-mentor.md`: "Each
       time you use Corrupt Spirit, your holy weakness increases by 1, to a maximum equal to your
       recovery value."). The current value isn't tracked, so damage to such a hero stays manual.

     `tests/scripts/immunity-weakness.test.ts` scans every stat block whose cells are read. It
     fails when a stat block's feature text mentions immunity or weakness and isn't on that list
     or on `FOE_MODIFIER_MENTIONS_REVIEWED`, which gives a reason for each harmless mention (it
     affects a target, an object or the dealer's damage).
5. **Readings in that classification, and what it doesn't cover.**
   - "Self or one elemental" (the Convocations) and Iron Banner's "Each war dog in the area" (a 4
     aura) are read as able to reach the user, so those stat blocks are manual. Alternative: treat
     them as affecting others only and read their cells.
   - The Human Bandit Chief's Form Up! (`monster/human/statblock/human-bandit-chief.md`: "until
     the end of the encounter, while the bandit chief or any ally is adjacent to a target, they
     have damage immunity 2") is read with "they" as the bandit chief or ally, so the chief is
     manual. Alternative: "they" is the target, so the chief's own cells are read and the targets
     gain the immunity.
   - The scan classifies a whole stat block. Once a stat block is on the reviewed list, a later
     harmful mention in the same block (a second feature, or a second clause in the same
     feature) is not flagged. The Olothec's Psychic Pulse was missed this way until review: its
     targets' weakened and slimed hid "the olothec has damage immunity 4". The reviewed list was
     then re-read line by line. A change to a stat block's text still needs that re-read.
   - Not covered: features that give another creature an immunity. Examples are the Giant
     Shambler Zombie's Meat Shield ("Each ally adjacent to the shambler has damage immunity 3"),
     Castellan Hoplon's Hold the Line, the War Dog Neuronite's The Voice and the Wodenelg's rider.
     Damage to those other creatures uses their own cells, as it did before V178 for creatures
     whose cells print "-".
   - Also not covered:
     - A dealer's "ignores damage immunity" (Optacus, the Kobold Adeptus, the Jurist's
       Hellfire).
     - Effects that give a hero a weakness (for example the Bale Eye's Wilting Visions).
     - Malice feature blocks, which aren't part of a stat block's text.

     Each of these is table work today. Recommendation: an effect-instance slice that tracks
     granted immunity and weakness.

     V179 (`docs/build/V179-granted-defenses.md`) now tracks the weakness a compiled tier clause
     gives its target; its readings are Q-IW-2. The items above stay table work: the dealers'
     abilities and Wilting Visions (its 2 Malice section) are not compiled.

Recommendation: keep 1 to 3 and 5 as implemented, and answer the trolls' value in 4.

## Q-IW-2: readings behind V179's immunity and weakness granted in play

Open. Compendium paths read (pinned `en/unified/md`): `rule/damage/damage-immunity.md`,
`rule/damage/damage-weakness.md`, `rule/character/potency.md`, `rule/general/saving-throw.md`,
`feature/ability/shadow/level-1/setup.md`, `feature/ability/conduit/level-1/corruptions-curse.md`,
`feature/ability/censor/level-1/purifying-fire.md`, `feature/ability/talent/level-1/smolder.md`,
`feature/ability/talent/level-3/force-orbs.md`, `feature/ability/warrior-priest/weakening-brand.md`,
`feature/ability/conduit/level-2/statue-of-power.md`, `feature/talent/level-1/steel-ward.md`,
`feature/ability/tactician/level-1/parry.md`, and every stat block on `FOE_MODIFIER_TRAITS`
(`shared/resolve/damageModifiers.ts`). The stacking itself is printed: "If multiple damage
weaknesses apply to a source of damage, only the weakness with the highest value applies."
(`damage-weakness.md`), and the same for immunities (`damage-immunity.md`). These are the
readings:

1. **A potency clause without a subject gives the weakness to the target.** Corruption's Curse
   prints "M < WEAK, damage weakness 5 (save ends)" with no "the target has".
   `rule/character/potency.md` says an effect with a potency "is applied to a target only if the
   effect's potency value is higher than the target's indicated characteristic score", so it is
   read as the target's. Alternative: none found in the source.
2. **A weakness that follows damage the engine didn't apply stays manual.** If the tier's damage
   was left to the table (for example on a foe whose own features keep its damage manual), its
   weakness is left to the table too. This is the same rule tier conditions use. Alternative:
   store it anyway.
3. **A correction never re-derives a stored weakness.** Later damage may already have used it. So
   a correction that would change the weakness a use gave (another tier's clause, or a different
   potency result) is refused, and the table rewinds the use. A correction that keeps it keeps the
   instance. Corrections and V174 revisions of other hits keep the weakness and immunity those
   hits saved. Alternative: end the old instance, store the new one, and flag later damage for
   the table.
4. **A potency decrease ends a stored weakness.** Parry's "the potency is decreased by 1"
   (`parry.md`) and the potency Spend sections re-check a stored weakness the way they re-check a
   tier condition. A weakness no longer applied ends. A saving throw already rolled for it refuses
   the revision, as for conditions.
   Later damage may already have taken the weakness, for example a crit's additional main action
   hitting before the first hit's Parry is answered (QC1 V179 R1). The revision would then leave
   that damage standing on a weakness it says was never imposed, so it is **refused**; the table
   rewinds to the hit, and the card stays open. The check is conservative. Any later, not undone
   damage to the creature that applied a weakness while the instance was active refuses it,
   whatever the type or the source of that weakness. A later hit's saved weakness value is not
   taken as proof the grant didn't contribute. The check reads up to 500 later log entries, and
   more than that also refuses. Alternative (not built): reconcile, recomputing each later hit
   without the weakness and reversing its consequences as design 5b does for the hit itself.
5. **An unresolved stacking group makes damage manual.** Two users' Setup on one creature is left
   to the table as a V158 manual stacking group. While the group stands, the engine doesn't know
   which weakness applies, so all damage to that creature is manual. Alternative: apply the
   highest of the group, which the printed rule would give for weakness alone. It isn't used,
   because the group's durations are also the table's.
6. **Squad minions and objects hold no granted weakness.** A squad minion's weakness stays table
   work, as squad potency conditions do. An object is immune to an ability's other effects
   (`rule/combat/target.md`).
7. **The hit that imposes a weakness doesn't take it.** Setup and Corruption's Curse print the
   damage before the weakness in each tier (for example "the target has damage weakness 5 (save
   ends)" after the damage), but no general rule states the order. The only explicit statement is
   Smolder's own Effect (`feature/ability/talent/level-1/smolder.md`): "The target takes damage
   before this ability imposes any weakness." V179 reads the printed tier order the same way for
   every ability: the weakness applies from the next damage. Alternative: the imposing hit takes
   the new weakness too, since Smolder's sentence could be read as an exception.

What stays manual, and why:

- **Purifying Fire.** Its Effect lets later abilities deal fire instead of holy damage to the target
  while the weakness lasts. No later use has that choice.
- **Smolder.** The weakness type is chosen in an Effect printed before the roll, and the tier clause
  prints no type ("the target has weakness 5").
- **Weakening Brand.** The weakness equals the characteristic the roll used, a choice that isn't
  compiled.
- **Force Orbs.** Its immunity is counted in orbs.
- **Statue of Power.** The statue, an object, has the immunity.
- **Steel Ward.** It is a trait watcher, "you gain damage immunity equal to your Reason score until
  the end of your next turn". It is outside this slice's hero abilities and is still used by hand
  (Steel Ward: React).
- **Foe self-grants.** No stat block moves off `FOE_MODIFIER_TRAITS`. Each granting ability is
  manual for other reasons, so no instance can be stored:
  - Psychic Pulse's slimed;
  - the Minotaurs' "deals an extra 5 damage with strikes";
  - the Lich's spectral movement;
  - Adaptability's triggering damage type;
  - the others' grammar or cost.
- **Standing traits.** Grave Ward is regained by Sanguine Mist, which is manual. Psionic Barrier is
  lost on "When they use a main action", which includes actions taken by hand. Neither can be
  modelled exactly.
- **Conditional traits.** "While winded, the goon has damage immunity 2" (the ogres' Defiant Anger)
  depends only on Stamina. It is a candidate for a later slice. It isn't a stored instance, so it
  is left alone here.

Recommendation: keep 1 to 7 as implemented.
