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
- Answering here does not change a spec. The spec change is a separate `docs` commit citing the id.

## Template

```
### Q-XX-n: <short title>

- **Status:** open | answered YYYY-MM-DD | resolved (link to spec commit or section)
- **Raised by:** <slice id or audit>, YYYY-MM-DD
- **Where:** <spec file#anchor, and Compendium paths read>
- **Conflict or gap:** two or three sentences.
- **Options:** A / B / C, each one line.
- **Recommendation:** one option and the grounds (cited text or existing ruling).
- **Blocked until answered:** what cannot be built, or "nothing; default applied provisionally".
- **Answer:** (user fills in)
```

## Open questions

The following V1 wizard questions are prepared for discussion, not answered defaults. Research by
the V1 wizard thread, 2026-09-14; see [the contracts](v1-character-wizard-contracts.md). Q-CHAR-2–5
are the shared lifecycle decisions; the remaining entries are bounded content/scope cases.

### Q-CHAR-2: How should activating an edited build reconcile a played hero's resources?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#12-open-decisions`.
- **Conflict or gap:** Retaining current inventory and avoiding a live-state rewind are settled. When
  an edit changes Stamina/Recovery maxima or the resource type, the resulting current values are not.
- **Recommendation:** Preserve damage and Recoveries spent for unchanged resource types: maximum
  Stamina 30/current 20 becoming maximum 36 would yield current 26. Preserve conditions and compatible
  counters. Preview the result and explicitly reconcile removed/replaced resources or values outside
  their new legal ranges. Apply atomically. Source-defined respite restoration remains separate.
  This is an application proposal, not a universal rulebook formula.
- **Blocked until answered:** affected activation on played characters; drafts/new-character evaluation
  can proceed. Coordinate the same boundary with respite and inventory.
- **Answer:**

### Q-CHAR-3: How does a transferred higher-level hero qualify for advancement after campaign XP clears?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#level-up`; sources
  `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md#heroic-advancement` and
  `vendor/steel-compendium/en/unified/md/rule/resource/experience.md`.
- **Conflict or gap:** Standard source thresholds are cumulative 0,16,32,…,144, with advancement during
  respite. Our transfer policy clears campaign XP but retains level. Comparing cleared XP directly to
  absolute thresholds would make a level-seven arrival earn 112 new XP before level eight.
- **Recommendation:** Keep a separate eligibility offset equal to the admitted level's lower threshold.
  Campaign XP still starts at zero. A level-seven entrant has offset 96 and needs 16 new XP for level
  eight, without importing prior campaign XP. Advancement still uses its source-defined timing.
  Coordinate with the respite thread; alternate advancement remains a separate scope choice.
- **Blocked until answered:** eligibility after transfer/higher-level admission.
- **Answer:**

### Q-CHAR-4: What happens when the owner makes new choices after restoring an earlier build?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#5-progression-history`.
- **Conflict or gap:** Restoration preserves later records and present inventory, but subsequent new
  choices have no established history policy. This is a product decision, not rulebook uncertainty.
- **Recommendation:** Save a new revision descended from the restored point and retain the previous
  future for inspection/restoration. Show dated build history and an origin label; no general branch/
  merge UI. Existing approval rules still govern activation.
- **Blocked until answered:** new choices after rollback; ordinary revision storage/history inspection
  remains independent.
- **Answer:**

### Q-CHAR-5: Do source-authorized reconfigurations need full-edit approval?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#4-wizard-flows`; sources
  `vendor/steel-compendium/en/unified/md/chapter/kits.md#changing-your-kit`,
  `vendor/steel-compendium/en/unified/md/feature/conduit/level-1/prayer.md`, and
  `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md` (I Speak Their Language; Changing
  Character Options). Related research: `docs/research/respite-rules.md`.
- **Conflict or gap:** Attached full edits require review; source-authorized respite changes and
  filling deferred language slots are not level-ups. Their application approval path is unspecified.
- **Recommendation:** Scoped, logged operations without review for choices explicitly permitted by
  source at that time, including filling a retained language entitlement. No unrelated build changes
  or extra entitlements. Preserve combat/session locks. Do not automatically enable the optional
  general respite ability-change rule for every campaign.
- **Blocked until answered:** reconfiguration activation policy; initial selections and definitions
  can proceed. Coordinate the respite operation with its owning thread.
- **Answer:**

### Q-CHAR-6: Does core-only scope allow campaign-specific languages and deity portfolios?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#fuller-product-scope`; sources
  `vendor/steel-compendium/en/unified/md/chapter/background.md`, Heroes clean **Languages in Orden**,
  and `vendor/steel-compendium/en/unified/md/feature/conduit/level-1/deity-and-domains.md`.
- **Conflict or gap:** The source permits assembled cultures, campaign languages and, with Director
  permission, a custom deity with four domains. V1 excludes homebrew mechanical options. Culture
  names/backstory are ordinary authorship; new language identities/portfolios need a boundary.
- **Recommendation:** Permit cultures assembled from core aspects and authored religious details.
  Use printed core languages and deity/saint portfolios for selectable V1 mechanics; preserve an
  extension path. This does not propose a custom-pack authoring workflow.
- **Blocked until answered:** custom selectable languages/portfolios only; printed core options can proceed.
- **Answer:**

### Q-CHAR-7: May a Revenant borrow Prismatic Scales without Wyrmplate?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/feature/trait/revenant/former-life.md` and
  `previous-life-1-point.md` in that directory; `vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/prismatic-scales.md`
  and `wyrmplate.md`.
- **Conflict or gap:** Previous Life permits a one-point purchased trait, but grants no former signature
  trait. Prismatic Scales qualifies by cost yet asks for an immunity from “your Wyrmplate trait,” which
  the Revenant lacks. Forge's flattened damage-type variants do not resolve that dependency.
- **Recommendation:** For this case, allow choosing one of Wyrmplate's six types with level-scaled
  immunity, without granting Wyrmplate or a second changeable immunity. Alternatively, disallow this
  borrowed trait without its prerequisite. The recommendation is not a general borrowing precedent.
- **Blocked until answered:** this exact combination; keep it explicitly unresolved.
- **Answer:**

### Q-CHAR-8: Can both Melodrama improvements increase the same existing event?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/melodrama.md`;
  Forge `src/data/classes/troubadour/troubadour.ts` as structural comparison.
- **Conflict or gap:** Two event choices can instead improve an existing event, including one gained
  with Melodrama. A new event followed by its improvement is clear; two improvements of the same event
  are not expressly addressed. Forge's count of two alone does not settle repeated-target legality.
- **Recommendation:** Permit each choice to add an event or improve one already owned; do not allow
  two improvements of the same event through this feature without a specific ruling.
- **Blocked until answered:** the repeated-improvement combination, not other Troubadour choices.
- **Answer:**

### Q-CHAR-9: How should career project points work while V1 downtime projects are deferred?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** Heroes clean `en/books/heroes/clean/Draw Steel Heroes.md`, **Career Benefits → Project
  Points**; `vendor/steel-compendium/en/unified/md/career/artisan.md` and `career/criminal.md`.
- **Conflict or gap:** Seven careers give 120 or 240 points. The source permits splitting them between
  qualifying projects once, retaining them, and sometimes using them before the adventure with
  Director-provided materials. Deferring downtime must not silently discard or change that benefit.
- **Recommendation:** Preserve the grant/balance, with manual Director-recorded allocation to named
  core projects and resulting items through inventory authority. Label prerequisites/resolution manual;
  don't claim project automation. Career editing cannot regrant spent points. Alternatively, preserve
  the balance for later with no spending UI. Agree the bounded workflow with inventory.
- **Blocked until answered:** using the grant/claiming complete career support; recording it can proceed.
- **Answer:**

### Q-CHAR-10: Can a complete character intentionally leave ancestry points unspent?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** Heroes clean **Ancestry Traits**;
  `vendor/steel-compendium/en/unified/md/feature/trait/devil/devil-traits.md` and
  `vendor/steel-compendium/en/unified/md/feature/trait/memonek/memonek-traits.md`.
- **Conflict or gap:** The source provides a budget “to spend” and forbids exceeding it, but does not
  expressly make spending every point mandatory. Completion must distinguish unfinished from intentional.
- **Recommendation:** Permit acknowledged unspent points with a warning. Later spending follows the
  established edit/review flow; no extra in-play spending permission. Overspending remains invalid.
- **Blocked until answered:** final completion status for intentionally under-budget builds only.
- **Answer:**

### Q-CHAR-11: Which skill collisions create an unrestricted replacement choice?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md`, **Choosing Skills**;
  `vendor/steel-compendium/en/unified/md/career/warden.md`; `vendor/steel-compendium/en/unified/md/class/fury.md`.
- **Conflict or gap:** Two sources granting the same specific skill permit an unrestricted replacement.
  Warden/Fury fixed Nature grants are clear. Choosing a duplicate from a restricted pool in order to
  obtain an unrestricted choice is less explicit and could make UI order affect entitlement.
- **Recommendation:** Resolve fixed grants first, with replacements for unavoidable duplicates. Free
  selections choose distinct eligible skills not already granted; deliberate duplication does not expand
  their pool. An exhausted pool needs its own concrete ruling. This is a proposed interpretation.
- **Blocked until answered:** fixed/chosen or chosen/chosen collisions; fixed/fixed and noncolliding
  selections can proceed.
- **Answer:**

### Q-CHAR-12: Which potency basis applies when another characteristic exceeds the class's named one?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `vendor/steel-compendium/en/unified/md/rule/character/potency.md`,
  `vendor/steel-compendium/en/unified/md/class/conduit.md` (**Basics**),
  `vendor/steel-compendium/en/unified/md/chapter/the-basics.md#game-of-exceptions`;
  Forge `src/logic/hero-logic.ts#getPotency` for comparison.
- **Conflict or gap:** The general rule names the highest characteristic; class Basics specifies one
  characteristic. Normal unmodified progression makes them agree. Modified characters can diverge;
  Forge always takes the highest.
- **Recommendation:** Use the class's named characteristic, following specific-over-general, unless a
  particular effect overrides it. Obtain a ruling on the divergent case before claiming an automatic
  result; record Forge's behavior as a compatibility difference.
- **Blocked until answered:** divergent modified-character calculation; examples where both agree proceed.
- **Answer:**

### Q-CHAR-13: Should higher-level creation offer discretionary starting treasures?

- **Status:** open
- **Raised by:** V1 wizard specification research, 2026-09-14
- **Where:** `docs/character-wizard-spec.md#fuller-product-scope`; Heroes clean
  `en/books/heroes/clean/Draw Steel Heroes.md`, **For the Director → Treasures Above 1st Level**.
- **Conflict or gap:** The Director can supply starting treasures above level one, with player selection.
  Higher-level creation is required, but a level selector must not silently award optional treasure or
  duplicate retained inventory on admission.
- **Recommendation:** An explicit Director starting-treasure allowance on admission, optionally filled
  from the book's echelon guidance, with owner selection and grants applied once. No automatic extra
  inventory for existing heroes merely choosing an entry level. Coordinate with inventory.
- **Blocked until answered:** this optional workflow; higher-level build evaluation can proceed.
- **Answer:**

## Resolved questions

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
