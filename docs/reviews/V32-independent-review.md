# V32 independent whole-slice review

Reviewer: `v32_final_review`, 2026-09-16. The reviewer authored none of the implementation,
research fixture, source contract or acceptance tests. Target: uncommitted `slice/V32` changes
based on `f7137dc` in the isolated character worktree, including the final presentation fixes.
No merge, deployment or implementation edit was performed by this reviewer.

## Verdicts and findings

**Independent implementation review: PASS.** All nine bounded V32 acceptance checks are verified
by the evidence below. No unresolved blocking code finding remains. The initial missing-browser
evidence gate is closed by the successful complete real-app journey and authenticated readback.

**Fresh independent whole-slice rules review: PASS**, finalized after implementation acceptance.
This includes the evaluator/content and the backend XP, timing, reconciliation and restoration
behaviors. The reviewer independently read their source and policy basis and did not author them.

These verdicts accept the reviewed branch. They do not claim integration into `main`, a shared
playable-app update, all-class progression, or bespoke gameplay automation.

**Nonblocking evidence-retention limitation:** raw Forge exports, traces and full application
payloads remain in the ignored worktree `.playtest/v32/` directory. Durable metadata/hashes,
comparison summaries, check logs and screenshots are retained under
[the V32 evidence directory](../build/evidence/V32/README.md). The reviewer inspected the actual
local raw artifacts and independently checked their hashes; future reproduction after removal
of this worktree would also require retaining those raw artifacts elsewhere.

Previously found receipt collisions, unattached list labeling, incomplete-history restoration,
legacy stale-draft invalidation and the wizard's acknowledged-save stale state were re-read in
corrected form. Supporting reports:
[backend review](V32-backend-review.md), [wizard integration review](V32-ui-integration-review.md),
and [bounded rules review](V32-rules-review.md). Their component authorship boundaries do not
substitute for this fresh whole-slice review.

## Specification and implementation scope

Read `agent.MD`, `CLAUDE.md`, the build process and the complete V32 slice, plus:

- [Level-up](../character-wizard-spec.md#level-up).
- [Current values](../character-wizard-spec.md#current-values-when-a-build-changes).
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows).
- [Progression history](../character-wizard-spec.md#5-progression-history).
- [Revision/review lifecycle](../character-wizard-spec.md#7-revision-and-review-lifecycle).
- [Content compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility).

Inspected all changed backend functions/schema and shared progression helpers, evaluator and
level-qualified definitions, content-generator additions and generated grant bodies, progression
UI/router, wizard/character integration, fixtures and acceptance tests. Applied the Convex
reviewer skill's authentication, ownership, indexed reads, bounded writes and validators checklist.

The scoped mutation derives from the effective snapshot and accepts only new decision IDs; it
cannot import an unrelated full-edit proposal. Exact revision/base/draft-version checks reject
races. Advancement marks earlier reviews stale without altering their historical snapshots.
Restoration copies the stored evaluation into a new revision, keeps old records, and invokes the
existing exact-revision review path for attached complete builds. Incomplete restoration remains
a private draft. Authentication and ownership precede writes; history permits owner or the
currently supported campaign-owner Director and excludes independent private notes. The UI
freezes edit bases, retains local choices on conflicts and calls these shared APIs.

### Final presentation delta

`DecisionEditor` renders the sourced quotation when an automatic decision has no explicit grant
list, making the Stamina increase visible without calculating rules in the UI. `BuildPreview`
derives its reference and quotation from the displayed evaluation's recorded class provenance,
falling back to ancestry for a partial build. It no longer labels Elementalist history as Fury or
presents an empty quotation. Missing usable provenance gets an explicit notice. The final
screenshots show both the Stamina explanation and the recorded source quotation.

Final screenshot inspection also exposed inherited level-one features labeled with the hero's
current level. The lead changed `featureCategory` to read the grant level from its canonical
source path, omitting a level when the path does not identify one. Static review of this narrow
fix passes: it preserves level-one attribution and labels Unstoppable Force level two without
changing baseline calculations. The new browser assertions check both labels; the focused rerun passes in 38.0s. The reviewer
inspected its updated screenshot and independently repeated the raw readback comparisons.

The browser source-readback correction uses the complete `content.sourcePath` directly; its
previous extra prefix caused a test-only missing-file failure. Exact-byte assertions remain.
Earlier login/backend timeouts and that failed attempt remain documented; the final rerun passed
without relaxing assertions or backend limits.

## Acceptance evidence

| V32 check | State | Evidence |
| --- | --- | --- |
| 1. Level-one compatibility and unsupported paths | Verified | Nine focused evaluator tests and full regression check pass. Original level-one definitions, Fury/Elementalist paths, explicit unsupported levels/classes and optional legacy revision fields inspected. The actual V25 Elementalist wizard/reload/review browser regression also passes. |
| 2. Source-derived level-two build and Forge comparison | Verified | Source contract, 62-row source ledger, independent fixture, actual local Forge exports/metadata and active selection comparison inspected. Independently checked every returned fixture baseline field and all 20 delivered source grants. Stamina 39, recovery 13, winded 19; original characteristics and skills retained. |
| 3. Draft persistence, scoped validation, timing/authority/races | Verified | Persisted tests cover draft reload/versioning, XP 15/16, false respite confirmation, earlier-choice injection, nonowner, foreign/stale base, incomplete target and combat refusal. Browser saves/reloads both new choices and verifies timing confirmation is required before owner finalization. |
| 4. Preserve resources and authored data | Verified | Actual authenticated readback and sheet show 20/30 → 20/39. Reviewer independently compared every live field except display labels unchanged. Recoveries 4, Ferocity 3, XP 16 retained. Persisted tests additionally cover conditions and independent fields; no automatic respite healing. |
| 5. Stale pending edits cannot revert advancement | Verified | Pending review refusal, unchanged stale resubmission refusal, base-pointer-only approval race and legacy metadata absence covered by passing persisted tests. Earlier snapshots are compared unchanged. Legitimate full-edit review remains separate. |
| 6. Additive reviewed history restoration | Verified | Actual browser previews level 1 while level 2 remains effective, submits restoration, keeps current Stamina 39 pending, then Director approval caps it to 30. Raw readback restores the exact original baseline/authored fields and retains chronological creation/full-edit/level-up/restore entries with source provenance. Tests also cover incomplete drafts, forward restoration and owning-Director/standalone behavior. |
| 7. History privacy, stale writes and retries | Verified | Passing persisted tests refuse another owner, ordinary member and unrelated account, exclude notes, and exercise stale writes, duplicate retries and independent long-prefix restoration IDs. Browser Director view has no owner restore control or private note. |
| 8. Browser journeys and authenticated headless agreement | Verified | Both real-browser tests pass in 54.1s: V25 Elementalist 14.5s and V32 progression 38.9s. Saved draft, source cards, full-editor choice retention, history preview, reviewed restoration and authenticated headless readback agree. The final feature-label rerun also passes (37.2s journey, 38.0s total). Four durable app screenshots inspected. |
| 9. Full checks, isolated sync and independent reviews | Verified | Full check passes 455 tests, lint/types, links, pinned-source/content/foe checks and production build. Later presentation-only fixes have a passing targeted type/build check. Isolated backend 3230/site 3231/frontend 5290 was synced and seeded 473 source entries; final real-app tests pass. Fresh implementation/rules verdicts are recorded above. Shared environment was not updated by this branch acceptance. |

Execution evidence: [full check](../build/evidence/V32/check.log),
[final build](../build/evidence/V32/final-build.log),
[two-test browser regression](../build/evidence/V32/browser-regressions.log),
[browser result](../build/evidence/V32/browser.log),
[persisted readback summary](../build/evidence/V32/readback-summary.json).

Visual evidence inspected:
[advancement ready](../build/evidence/V32/advancement-ready.png),
[level-two sheet](../build/evidence/V32/level-two-sheet.png),
[history preview](../build/evidence/V32/history-preview.png),
[restored sheet](../build/evidence/V32/restored-sheet.png).

### Reviewer reproduction and limits

The reviewer performed read-only checks against `.playtest/v32/application/readback.json`,
confirming final raw SHA-256
`42dff6d72071c5762faa8da9009dc8ffae23468dd7ceb61ca16b4b7c61b1179f`, character `k174w2vad5kf7018n92kt14rzn8eg45s`, all fixture scalar,
identity, characteristic, potency and named-grant fields, all 20 exact source texts at the pinned
revision, live-state preservation, restored original baseline/authored data and four chronological
history entries. The restored effective revision is `jx74rt56cv8f3ev9wcex3emntd8ehde0`, copied from
`jx78mgc037q2wh20qw53zbqnf18egh3c`; the intervening level-up remains present.

Also independently matched all 62 ledger hashes to pinned source and all 24 Forge artifact hashes
and byte counts. Both level-one and level-two raw Forge exports compare deeply equal to their
reimported exports after omitting the regenerated root ID. The durable
[active Forge comparison](../build/evidence/V32/forge-selection-comparison.json) records 17 serialized
active grants, 10 skills and five characteristics using explicit level/subclass/selection filtering.
Culture edge and free strikes are separately sourced/displayed shared grants. Inherited ledger
level-one examples remain historical inputs; explicit V32 transition expectations supply level-two
values. Forge website 14.199.0 and pinned reference 14.197.0 are recorded separately.

No heavy test suite or browser was run by this reviewer. Execution logs, actual screenshots and
persisted payloads were inspected, and their substantive data comparisons were independently
reproduced locally. Special Delivery's alternate build selection is source/unit-tested; bespoke
in-app execution of either new ability is not claimed. No claim of shared deployment or complete
respite/XP-award automation was made or verified.

## Independent rules review

The pinned Compendium is the sole rules authority; no online rules sources were used. The reviewer
read all inherited ledger source bodies covering ancestry traits, culture, Soldier, Fury grants,
Mountain, free strikes and skills, plus Heroes book culture/language/deferred-language passages;
Fury Basics/advancement, the level-two perk and aspect entitlements, both Berserker ability bodies,
Unstoppable Force, Danger Sense, the Heroes book's Berserker grouping and crafting/exploration/
intrigue perk categories, recovery/winded/rounding/echelon rules, experience, respite, Heroic
Advancement and Polder Corruption Immunity. Pin:
`fb83a789da8f0327a389c277a0c790b1648d5810`.

The calculations match source: 21 + 9 class Stamina + 9 Mountain = 39; floor(39/3) = 13 recovery;
floor(39/2) = 19 winded; both levels remain first echelon. Berserker retains the original abilities
and adds one 5-Ferocity aspect maneuver; neither new maneuver is a Strike. Wrecking Ball's full
body includes its adjacent-enemy target sentence and push tiers 1/2/3, with no damage. Special
Delivery affects one willing ally and adds the Fury's Might to that ally's free strike. Danger
Sense adds no skill or unconditional edge. Unsupported perk choices are explicitly diagnosed;
category membership comes from the core Heroes book, not the supplemental unified perk chapter.
Polder corruption immunity correctly changes from 3 to 4 through its level + 2 rule.

XP 16 is cumulative and is not spent. The owner-confirmed respite flag is the declared bounded
manual timing context; it is not a completed respite implementation. Source respite restoration
and Victory→XP conversion remain distinct manual work. Entry-level credit and retaining current
amounts with downward caps are explicitly the user's Q-CHAR-3/Q-CHAR-2 app policies. Additive
snapshot restoration follows Q-CHAR-4 and does not replay inventory, resource or respite grants.
The source's duplicate-perk uncertainty is irrelevant to this supported new-Danger-Sense path.
No new class-specific resolver/automation was introduced or accepted by this review.
