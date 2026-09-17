# V32 integration review

Reviewer: `v32_integration_review`, 2026-09-17. Read-only application review of `slice/V32`
at `6456651`, rebased onto integrated main `a0ac6d4`. The reviewer authored none of the
implementation and ran no development server, dependency installation, build or browser workload.

**Integration review verdict: PASS; no implementation changes required.** This supplements
[the original independent implementation/rules acceptance](V32-independent-review.md).
Fresh CT114 full-check evidence and all four required isolated browser scenarios have now been
reviewed and pass, including the unchanged table-audit retry. Shared playable-app verification
remains the integrating lead's separate completion gate; this report does not claim a completed merge.

## Scope and findings

Read `agent.MD`, `CLAUDE.md`, the build process, the V32 slice, existing implementation/rules
reviews, source contract, evidence logs and readback summary, and these owning spec sections:

- [Level-up](../character-wizard-spec.md#level-up).
- [Current values](../character-wizard-spec.md#current-values-when-a-build-changes).
- [Wizard flows](../character-wizard-spec.md#4-wizard-flows).
- [Progression history](../character-wizard-spec.md#5-progression-history).
- [Revision/review lifecycle](../character-wizard-spec.md#7-revision-and-review-lifecycle).
- [Content compatibility](../character-wizard-spec.md#8-content-and-forge-steel-compatibility).

Inspected the combined progression page/router, full wizard, character controls, feature labels,
V34 ability/source presentation and V31 table-history placement. Checked the shared progression,
save, restore and history API boundaries using the Convex reviewer checklist.

No blocking or nonblocking integration defect found:

- V31's table undo/redo controls are independent of character build history; V32 does not
  overwrite their components or alter their operation registration.
- V34's `AbilityCard` reads `abilitySource` through `CoreSource`. Both new Berserker abilities
  have canonical complete content, so the new presentation consumes their printed source.
  In particular, Wrecking Ball retains the paragraph directing a power roll against each
  adjacent enemy, which is absent from its extracted effect metadata. Costs stay in the card
  header and kit damage modifiers remain separately labeled.
- Source links in the new progression previews use the same reader as V34. Historical previews
  derive class attribution from the recorded build; Fury attribution is not forced onto an
  Elementalist snapshot. Feature badges distinguish source grant level from present hero level.
- Full editing supplies level-qualified definitions consistently to evaluation, selection
  serialization, parent pruning and characteristic assignment. The acknowledged standalone-save
  guard accepts its own effective revision without silently accepting another writer's change.
- Scoped advancement keeps its frozen effective base and separate saved choices; history reads
  and restoration retain their owner/Director boundary. Restoration uses the existing exact
  review operation and copies recorded evaluation without recalculating historical builds.

## Acceptance evidence

All nine V32 acceptance checks have original independent acceptance in the linked whole-slice
review. This supplemental review distinguishes retained evidence from fresh runtime verification.

| V32 check | Integration review status | Basis |
| --- | --- | --- |
| 1. Level-one compatibility and unsupported paths | Verified | Level-qualified definitions preserve the original level-one object; fresh evaluator, Elementalist browser and V21-sheet regressions pass. |
| 2. Source-derived level-two build and Forge comparison | Verified for retained artifacts and unchanged source contract | Independently matched all 62 source-ledger hashes and all 24 Forge artifact byte counts/hashes; none are missing. Read new grant bodies and Fury/XP/perk source passages. |
| 3. Scoped draft persistence, validation, timing and races | Verified | Base/version guards inspected; fresh persisted progression tests and saved/reloaded browser choices pass. |
| 4. Live/authored data retention | Verified | Fresh V32 assertions pass; compact readback confirms 20/30 to 20/39 without healing, with Recoveries 4, Ferocity 3 and XP 16 retained. |
| 5. Older pending edit invalidation | Verified | Effective-base/legacy stale guards and explicit wizard reconciliation inspected; fresh persisted tests pass. |
| 6. Additive reviewed restoration | Verified | Fresh browser restoration requires approval, caps 39 to 30 and retains four chronological revisions; incomplete/standalone cases pass in persisted tests. |
| 7. Privacy and retry/stale safety | Verified | Ownership/indexed history guards inspected; fresh persisted tests and Director browser privacy checks pass. |
| 8. Real browser/headless agreement | Verified for isolated integration | All four isolated scenarios pass, including exact source/persisted readback and rendered Wrecking Ball paragraph. Shared verification remains separate. |
| 9. Full checks, sync and independent reviews | Verified for isolated integration | CT114 full check passes 466 tests plus lint/types, content, vendor, foe, link and build checks. Four browser scenarios pass after unchanged table retry. Live authenticated readbacks also establish working backend/content integration. |

Independently reproduced `git range-diff f7137dc..15a2908 a0ac6d4..6456651`: all three V32
patches are unchanged. Original test totals therefore remain historical evidence, not a claim
about the larger integrated suite.

For fresh visual acceptance, inspect the rendered Wrecking Ball card's complete effect and
additional power-roll paragraph along with the existing advancement/history journey. The lead
added a focused browser assertion requiring that exact paragraph to be visible before opening any
source dialog. This reviewer checked the assertion against the pinned body: it exercises the
rendered sheet and discriminates a fallback to incomplete effect metadata. It passed in the lead's
fresh CT114 V32 scenario. The existing byte-exact backend-source assertions remain intact.

The original Forge exports remain in the ignored worktree artifact directory and all 24 recorded
hashes still match. Their retention limitation in the original review remains applicable. No new
Forge website observation, full rules audit, gameplay automation claim or raw-export recapture was
performed here. Chords returned an ambiguous provider-session mapping; the parent owns coordination.

## Fresh CT114 full-check evidence

The lead supplied `/tmp/v32-integrated-check.log` from the named `characters` environment.
The reviewer read the complete artifact; it records successful `pnpm check` on the integrated
application, executing at `/app` on CT114:

- 106 engine tests in 15 files and 360 app/scripts tests in 40 files: **466 total**.
- Nine V32 evaluator tests and 13 persisted character-progression tests pass, alongside the
  inherited Fury/Elementalist, admission, history, privacy, content and V34 presentation suites.
- ESLint, Prettier and both TypeScript checks pass; 201 Markdown files have valid relative links.
- Both vendor pins match; content regenerates exactly with 473 entries and 10 exclusions at
  Compendium `fb83a789da8f`; foe verification reports 11 stat blocks and 40 features.
- Rules ingestion reports 2,614 entries in 26 categories with no unresolved links, followed by
  successful production build. The bundle-size advisory remains nonfatal.

The lead also reports successful isolated backend sync and seed of 473 entries. This reviewer
did not execute that sync or inspect its separate process log. The four sequential browser
scenarios and the later shared playable-app update are still pending at this evidence checkpoint.
No additional workload was run by the reviewer.

## Fresh CT114 browser evidence, first run

Reviewed `/tmp/v32-browser-first.log`: four scenarios executed sequentially with one worker.
V25 Elementalist wizard/reload/review, V32 Fury advancement/history and V21 character-sheet
regression all passed. These results include the added exact Wrecking Ball paragraph assertion
and V32's authenticated persisted readback assertions.

The table-audit scenario failed waiting for the Command palette button. The reviewer inspected
`/tmp/v32-table-error3.png`: the actual app had entered its unavailable-page boundary with
`Function execution timed out (maximum duration: 1s)`. This is evidence of an application/backend
timeout rather than a changed button label. The lead traced it to `history:status` authentication
via `safeGetAuthUser`; that more specific diagnosis is lead-reported, since the reviewer has not
read the separate backend log. An unchanged retry remains pending; this failed run is not counted
as table acceptance, and no assertions or timeouts were relaxed.

The reviewer also compared `/tmp/v32-remote-api.d.ts` with `convex/_generated/api.d.ts` using
`cmp`: byte-identical. Shared playable-app verification remains separate and pending.

## Final isolated integration acceptance

Reviewed the [unchanged table retry](../build/evidence/V32/integration/table-retry.log): the
table audit passes in 1.5 minutes. Together with the three successful scenarios in the
[first browser run](../build/evidence/V32/integration/browser-first.log), this closes all four
required isolated browser checks. The first failed attempt remains retained; no code, assertion
or timeout change was needed to obtain the passing retry.

Independently inspected the fresh [level-two screenshot](../build/evidence/V32/integration/level-two-sheet.png)
and [compact readback](../build/evidence/V32/integration/readback-summary.json). The screenshot shows
the complete Wrecking Ball effect, its additional targeting paragraph and push tiers, cost of
5 Ferocity, current Stamina 20/39, Ferocity 3, Unstoppable Force at L2 and inherited features at L1.
The readback lists all 20 canonical source grants at the pinned revision, unchanged compatible
live values after advancement, restored Stamina 30/30, and four chronological revisions with
the restoration pointing to the original level-one build while retaining the level-two entry.

The [integrated full-check log](../build/evidence/V32/integration/check.log) is now retained in
the repository alongside those browser artifacts. The original rules verdict remains applicable:
the only follow-up code delta is the reviewed browser assertion, with no changed mechanics.
The follow-up may record `Reviewed-By: v32_integration_review (pass, 2026-09-17)` and
`Rules-Review: not required`. Shared rollout and live target verification remain a separate
merge-completion responsibility; no shared-runtime success is asserted here.
