# V105 Talent rules and implementation review

Candidate: `fd7a17d2743fc74e3d33569b5fc8b83638b9de95`, branch `slice/V105`, worktree `.worktrees/class-talent`, rebased base `d1d451b` (V104). Reviewer: ENGINE, 2026-09-21.

## Verdict: PASS (static review)

No blocking source, implementation or authored-proof finding. Reviewed authoring `8e7ee49` and the final ledger/proof/generated-artifact delta at this exact candidate. No tests, browser, backend or deployment operations were run by this reviewer. Full checks, report freshness and real headless acceptance remain TESTER evidence; this verdict is not a claim that those gates passed.

Reviewed-By: ENGINE (pass, 2026-09-21)

## Authority and inventory

Rules authority is pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, especially `en/unified/md/class/talent.md`, `feature/talent/level-1/*.md`, and `feature/ability/talent/level-1/*.md`. Independent inventory and source damage/cost tables are recorded in `/tmp/v105-talent-source-audit.md` and the slice's persisted source audit.

Three traditions, five augmentations, four wards, two of eight signatures and one each of four 3-Clarity/four 5-Clarity options match those sources. Universal Mind Spike and six tradition grants complete the 23 source envelopes. The 35 parent-gated embedded actions expose paid options, ward reactions, strain effects and other manual follow-ups. Four optional paid actions cost 2/2/3/1 respectively for Accelerate Maneuver, Minor Telekinesis Larger Target, Minor Telekinesis Vertical Slide and Remote Assistance Additional Target. They do not repeat parent activation costs.

Five independent Human/Soldier ledgers cover every tradition, augmentation, ward and selectable ability. Reason/Presence 2, all three remaining-characteristic arrays, fixed Psionics/Read Person, two interpersonal/lore skills, Mindspeech, no kit and Reason potency 0/1/2 are correctly expected. Density yields Stamina/recovery/winded 24/8/12 and stability 1; Speed yields speed 6/disengage 2. Battle without equipment does not receive unconditional bonuses. Force adds one only to Psionic rolled damage: the first witness expects Mind Spike 5/7/9, Entropic Bolt 5/6/8 and Hoarfrost 5/7/9. Remaining direct-damage tables match the independently audited sources, including unmodified area values and zero direct damage for Kinetic Grip.

## Resource semantics and manual boundaries

The shared floor is -(1 + Reason) only for Talent Clarity and otherwise zero. Both ability payments and hero-resource adjustments use it. Debit retains the signed value. The authored API proof checks 0 minus 3 and 2 minus 5 ending at -3, refusal at the floor, adjustment below -3 refusal and unchanged persisted balance afterward. Pure cases include an insufficient 1 minus 5 payment and a different resource retaining floor zero.

The cohort invokes all 58 unique new actions through public operations and reads events, costs, resource balances and target Stamina back. It also checks build/grant/skill/language lists, ownership refusal, draft pruning and admitted-build isolation. A free Mind Spike at -3 retains its base damage and pool, followed by a separately recorded strain action whose target/caster states remain unchanged. This proves the explicit manual boundary, not automatic strain damage. An ordinary non-Psionic melee free strike excludes Force and verifies persisted damage. Manual actions check no silent target/actor consequences; paid actions check blocked use at the floor.

Awe's ally/enemy branch and Smolder's mandatory damage-type choice are wholly manual and retain fixed costs. Again/Flashback rerolls and base-cost waiver, wards, reactive damage, range, Battle equipment, forced movement and strain effects remain source text/manual actions. Clarity generation, turn-end negative damage, encounter reset, outside-combat repetition and one-minute/voluntary strain are explicitly manual. These limitations must remain visible in scope and delivery claims.

The ledger covers five builds but the action loop intentionally deduplicates names, so it does not prove every ability under every augmentation combination. Kinetic Grip and Choke follow-ups remain manual compatibility behavior; this is not a new compiled-condition promotion or an automatic movement proof. The outside-combat use proves payment waiver, not automatic enforcement of timing restrictions.

## Reports and integration

The audit baseline adds exactly the 23 Talent envelopes. The authored generated reports retain compatibility treatment for conditional/strain shapes; this review does not independently regenerate or certify byte freshness. The headless failure-location allowlist adds only the controlled Talent scenario filename.

V105 starts before V104 integration. Integration must preserve V104's Elementalist additions and guards alongside Talent changes in the shared evaluator/resolver/content selection paths. This approval covers the stated candidate; integration results are separate evidence.

## Bounded combined review at cc4115e

Static PASS for the combined source integration. Compared the rebased V105 series with the reviewed 33d18be..1070749 series and inspected the shared-file delta against V104 d1d451b. Both source adapters coexist in characters:sheet and the live resolver. The seven typed Hurl execution branch and fixed-type/original-name sheet modifier repair remain intact. Manual guards retain Instantaneous Excavation and base Hurl alongside Awe and Smolder. The evaluator invokes both class-specific ability builders and both modifier functions; their parent/class gates retain isolation. The content generator retains the V104 selection and adds Talent. Both runner cohorts and the union of controlled error filenames are registered. Talent-specific content, evaluator, resource helper, ledger and cohort are unchanged from the reviewed candidate.

Generated reports and manifest are explicitly pending TESTER regeneration: the carried pre-rebase report still labels Ray/Meteoric unavailable and has pre-combination counts. This bounded PASS does not approve those stale generated artifacts as final or certify freshness. They must be replaced by the combined generator output before final delivery. No tests were run.

Reviewed-By: ENGINE (pass, 2026-09-21)

## Final generated delta at fd7a17d

Static PASS extends to fd7a17d. The cc4115e..fd7a17d delta contains only the slice log, four generated report files and manifest; application code, tests and runner are unchanged. The manifest remains 1483 entries and now cites the V104 Elementalist selection basis. Both reports use its new content hash, sha256:7ffe0438ccb96263a43c2d3c8728737d387521af8d846b3cf9fbfd6bd4347d0a.

Semantic inspection of both JSON reports confirms their 1475 envelopes and classification data are unchanged. Exactly 17 Elementalist rows gain the combined grant/availability data; Ray and Meteoric become compiled reachable, with the other 15 becoming compatibility reachable. The support totals are 23 compiled / 1433 compatibility / 0 compiled-but-unavailable. Audit grant totals rise by 51 (the 17 grants reflected at the three evaluated levels); no unresolved grants are introduced. The two corresponding V26 summary rows change availability only. This resolves the stale-artifact exclusion recorded at cc4115e. Generator execution/freshness evidence remains TESTER-owned; this review inspected the committed delta without running generators or tests. Full/live acceptance is still separate.

Reviewed-By: ENGINE (pass, 2026-09-21)
