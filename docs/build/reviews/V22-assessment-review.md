# V22 independent assessment review

Verdict: **pass** for the documentation-only assessment, 2026-09-15.

Reviewer: Codex independent reviewer (`v22_review`), not the assessment author.
Reviewed worktree: `/srv/presidium/projects/salient/engine-parser`, branch `slice/V22`,
baseline `e83930e2ffe061c83fd726f9183f33ecef8c57ad`.

The implemented/experimental/missing inventory matches the inspected code. The eight-ability
comparison reproduces. Source-linked turn-start Ferocity is a defensible first implementation
proposal; this review does not certify it as implemented or authorize deployment. No blocking
finding or unresolved rules decision prevents integrating the assessment.

## Instructions and specification sections read

- Main checkout `AGENTS.md`, `agent.MD`, and `CLAUDE.md`.
- Main checkout `docs/kickoff-development-track.md#establish-the-assignment-and-current-state`,
  `#isolate-and-build`, and `#feedback-verification-and-handoff`.
- Main checkout `docs/v1-roadmap.md#confirmed-development-tracks--2026-09-15`,
  `#independent-progress-and-shared-contracts`, `#branches-worktrees-and-environments`, and
  `#starting-implementation`.
- Main checkout `docs/build/README.md#slice-lifecycle`, `#review-standard`,
  `#branch-and-merge-policy`, and `#verification-baseline`.
- Worktree `docs/engine-architecture.md#proposed-boundaries`,
  `#from-rules-text-to-executable-behavior`, `#structured-effects-are-the-common-contract`,
  and `#app-backend`, including the new V22 assessment note.
- Worktree `docs/fury-goblin-automation.md#turn-start-ferocity` and `#per-mechanic-status`.
- Worktree `docs/build/V22-engine-parser-assessment.md` in full,
  `docs/build/V05-ability-automation.md`, `docs/build/STATUS.md`,
  `docs/build/evidence/v001-acceptance.md`, and `docs/compendium-navigation.md`.
- Convex and Convex reviewer skills, applied to the claimed integration path. This was not an
  application-wide authorization or performance audit.

Main checkout coordination documents were read in place and were not copied or edited.

## Acceptance checks

| Check | Result | Evidence |
| --- | --- | --- |
| 1. Trace live ability resolution, saved changes, source and history; distinguish the experiment. | verified | `convex/lib/registry.ts` registers `abilityOperations`; `abilityOperations.ts:1052` probes affordability before `rollDice`, then calls `resolveAbilityRoll` at line 1087. Its commit at line 1149 journals the debit, damage and `abilityResults`, retaining correction inputs. `convex/lib/resolve.ts:194` builds source references and line 229 parses individual tiers. `ability.resolved` records dispositions without applying the clause. `src/cli.ts` calls `parseAbility` and the experimental runtime; `convex/lib/engine.ts` imports that runtime, but caller search finds no registered operation using the wrapper. The dated architecture correction is accurate. |
| 2. Reproduce the eight-ability comparison. | verified | Independently ran the assessment's exact Node heredoc with `loadScenario({ includeSquad: true })`, `parseAbility`, and `parseTierText`. Diagnostic counts and parsed/manual clauses match every table row; results are summarized below. The loader checks the pinned Compendium revision. |
| 3. Run `pnpm check` and report actual outcome and limits. | verified | Inspected the author's `.playtest/v22/check.log`: lint/formatting, both TypeScript checks, 85 engine tests, 317 app/tooling tests, 156 Markdown files, both vendor pins, 403-entry content comparison, and production build pass. The log records 2,614 readable Rules entries and the Vite chunk-size advisory. The full suite was not repeated by the reviewer because no executable code changed. Source inspection of `tests/app/history.test.ts:618` confirms persisted queue/state readback and exact restoration tests exist, rather than only mutation-response assertions. |
| 4. State a bounded first implementation with source, dependencies, manual remainder and checks. | verified | The handoff explicitly proposes one own-turn grant, actual feature/source binding, accepted dice, journaled live balance, source/cause logs, retries, multiple actors, nonzero balance, spending and history checks. Other Ferocity clauses remain manual. The pinned source states the isolated 1d3 grant directly; no movement/target/response fact is needed. Existing V05 still depends on V04. |
| 5. Independent inventory and proposed-scope review against code and local source. | verified | This review inspected the changed documentation, both parser paths, clock producer/dispatcher, evaluated features, accepted dice, journal/history and representative tests. The source checks and implementation cautions below complete this check. |

### Independently reproduced parser comparison

| Ability | Experimental diagnostics | Shared tier result |
| --- | ---: | --- |
| Brutal Slam | 0 | Damage recognized; push unresolved. |
| Out of the Way! | 4 | Damage recognized; slide unresolved. |
| Thunder Roar | 1 | Damage recognized; push unresolved. Its separate Effect prescribes movement order. |
| Lines of Force | 4 | No tier projection; triggered replacement is outside tier parsing. |
| Pain for Pain | 5 | Might-or-Agility damage recognized; separate reactive Effect is not tier automation. |
| Spear Charge | 0 | Fixed damage recognized; neither Charge nor Crafty is certified. |
| Bury the Point | 0 | Fixed damage recognized; potency, bleeding and save-ends clause unresolved. |
| Spinecleaver Axe | 0 | Fixed damage recognized; push unresolved; no live minion certification. |

Independent manifest inspection counted 403 entries, 22 standalone abilities and one stat block.
These counts measure the selected content snapshot, not automation. The experiment explicitly refuses
nonzero edges/banes, parser diagnostics and existing conditions (`src/engine.ts:256`, 262, 300),
supporting the assessment's warning against installing it as the live engine.

## Pinned-source checks and priority assessment

Only local Steel Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810` was used.
`git submodule status` confirms that pin and Forge Steel's recorded
`5a846aadb623a9855a023e9403bb887a956c341f` pin. No vendor files were edited.

- `en/unified/md/feature/fury/level-1/ferocity.md#ferocity-in-combat` grants 1d3 at the
  start of each own turn during combat. Opening Victories, damage, winded/dying and ending loss
  are separate clauses. The assessment's isolated accepted-roll example, 0 + 2 = 2, follows
  directly. The out-of-combat subsection supports keeping reuse bookkeeping separate.
- `en/unified/md/monster/goblin/statblock/goblin-warrior.md` gives Bury the Point a 2-Malice
  cost, tier damage and Might-threshold bleeding with save ends. The assessment correctly treats
  that as a broader implementation than the isolated resource grant.
- `en/unified/md/condition/bleeding.md` specifies additional triggered Stamina loss. Applying a
  condition or scheduling its save would not complete Bleeding automation.
- `en/unified/md/rule/dice/ability-roll.md#abilities-with-damage-and-effects` gives the ordinary
  damage-before-effects rule and presentation order. Thunder Roar's separate Effect in
  `en/unified/md/feature/ability/fury/level-1/thunder-roar.md` explicitly orders target movement.
  Those sources support the assessment's sequencing caution.

The ranking is an engineering recommendation, not a source rule or a newly confirmed product
decision. Ferocity offers immediate repeated bookkeeping relief for the current Fury and exercises
the existing timing/persistence boundary with fewer dependencies than forced movement or conditions.
Ordered typed clauses remain the appropriate next foundation for broader ability execution.
The comparison is intentionally small and does not prove that this ordering maximizes value for all
core classes or future encounters.

## Ranked findings and implementation cautions

No blocking findings. These are nonblocking handoff cautions for the next implementation slice:

The author incorporated the source-binding and dice-identity cautions into the final handoff at
`docs/build/V22-engine-parser-assessment.md:192`. That paragraph was re-read and accurately records
the current gaps as future implementation work; the pass verdict includes this final addition.

1. **Suggestion — source binding still needs an implementation contract.**
   `docs/build/V22-engine-parser-assessment.md:185` requires actual granted-feature and clause/revision
   binding. Existing `shared/contracts/clock.ts:114` `WorkSource` carries a log entry, optional
   origin/path and label, but no revision or clause identity. `GrantedFeature` has a source path and
   provenance; `shared/evaluate/character.ts:1163` gives class features provenance from the Fury
   advancement table. That proves the grant, not the turn-start clause. The future compiler must
   connect the evaluated feature to the pinned Ferocity entry and retain the executable clause's
   source identity in journaled registration/result data. The assessment already requires that
   behavior and labels the representation as proposed; current clock support must not be mistaken
   for a completed feature compiler.
2. **Suggestion — decide accepted-roll identity and logging for automatic firings.**
   `docs/build/V22-engine-parser-assessment.md:189` proposes shared dice. `convex/lib/dice.ts:90`
   deduplicates by campaign and issuer/command key; a second request with that key returns the same
   roll or rejects a different fingerprint. A future source-bound firing needs deliberate roll
   identity and cause linkage, especially if another firing later rolls within the same command.
   `rollDice` does not write the event; the caller must retain the accepted die record with the
   firing. Avoid accidentally turning reuse of the causing command into reuse of another effect's
   dice. This is not a defect in the current assessment or the isolated grant proposal.
3. **Suggestion — spell out concrete existing dependencies when claiming the next slice.**
   `docs/build/V22-engine-parser-assessment.md:181` lists R02/R03 contracts and A09 integration.
   The concrete evaluator/admission implementation is A02; turn creation is in
   `convex/lib/initiative.ts:227`, reached through A04 operations. S02 supplies accepted dice and
   A05 supplies spending. These are already within the committed A09 foundation, so no dependency
   was bypassed. Name them in the new slice and coordinate any shared-contract edits. The current
   journal supports leaf changes and registration recreation, and existing history tests restore
   clock work; that is a reuse foundation, not proof that new Ferocity rows and dice will restore
   correctly. Keep the proposed persisted rewind/redo and fresh-execution checks mandatory.

## Claims not independently reproduced and limits

- The reviewer inspected the full passing check log but did not rerun the full 402-test suite or
  build. The independent executable reproduction was the eight-ability comparison.
- No new persisted Ferocity behavior exists to test. No live backend, browser, reconnect, human
  usability or sustained-session performance was certified by this review.
- The original install command, failed shallow-reference attempt and main checkout's historical
  ahead-of-origin count were not independently replayed. Current branch, diff and vendor pins were
  inspected; those setup-history details do not determine the recommendation.
- No comprehensive corpus coverage, universal effect-order correctness, or whole-ability semantic
  reconciliation was claimed or established. The assessment correctly identifies these as missing.
- The full check log predates the final documentation additions; the author reports a subsequent
  157-file link check. This review's own formatting and link check results are recorded below.

## Review artifact verification

`pnpm exec prettier --check docs/build/reviews/V22-assessment-review.md` passed.
`pnpm check-links` passed: 158 Markdown files, no broken relative links or anchors.
