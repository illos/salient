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

- **Status:** resolved 2026-09-15; [owning policy](character-wizard-spec.md#current-values-when-a-build-changes)
- **Research check:** 2026-09-15 — product decision; [rules and spec evidence](research/remaining-character-questions-review.md#q-char-2).
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#12-open-decisions`.
- **Conflict or gap:** Retaining current inventory and avoiding a live-state rewind are settled. When
  an edit changes Stamina/Recovery maxima or the resource type, the resulting current values are not.
- **Original recommendation (superseded):** Preserve the damage/spending deficit when maxima rise,
  e.g. Stamina 20/30 → 26/36. The user's clarification instead keeps current amounts unchanged.
- **Answer:** Maximum increases do not increase current values. Stamina 20/30 → 20/36; Recoveries
  7/10 → 7/12. When a lower maximum is below the current amount, cap it to that maximum: 20/30 →
  18/18 if the new maximum is 18. Preserve conditions and compatible counters. Derived statistics
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
