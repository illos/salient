# V37 complication catalog: independent implementation and rules review

Reviewer: `v32_integration_review`. Date: 2026-09-17. Scope: the complication
researcher's [catalog](../../shared/content/supporting-complications.ts),
[ability texts](../../shared/content/supporting-complication-abilities.ts), and their
shared definition/evaluator consumers. Reviewed the uncommitted `slice/V37` worktree.
This review does **not** certify the reviewer's own wizard, sheet, or private-inheritance
implementation. Those require another collaborator's review.

## Verdict

Static rules and implementation review passes within the
[V37 scope](../build/V37-supporting-character-choices.md). No blocking discrepancy found
in the reviewed catalog or its shared consumers. CT114 runtime evidence and final
integration were pending at the initial review; the final evidence appendix below
supersedes that runtime status. Shared rollout remains a separate gate.

## Source preservation and inventory

Authority is Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`;
Forge `5a846aadb623a9855a023e9403bb887a956c341f` remains comparison evidence.
Read the [complication ledger](../research/v37-complications.json), its
[analysis](../research/v37-complications.md), and pinned individual rules.
Lightweight, read-only Python text inspections established:

- All 100 complication snapshot texts exactly equal their pinned source files. The
  catalog uses those complete texts directly, including benefit and drawback.
- All 100 authored fixed-skill, permanent-modifier, granted-ability and initial-state
  classifications match the ledger. All 40 permanent-modifier source quotes occur in
  their pinned source text after removing Markdown link markup.
- All 42 authored choice specifications match the ledger's counts, pools, kinds and
  source actors. All 16 literal name pools match the ledger in order and count; the
  six purchased Dragon Knight traits are constructed separately with their source costs.
- All 12 ability bodies are exact source substrings after removing only the enclosing
  Markdown blockquote markers. The embedded abilities retain their complete effects,
  tiers, exceptions and special costs; borrowed abilities retain their individual sources.
- All 70 Fury/Elementalist heroic pool paths have eligibility records and existing
  source files. All 18 Fury aspect-specific memberships match their containing
  level-2/6/9 clean-book aspect sections.

These are source inspections, not local application/test execution.

## Rules and consumer findings

Reviewed `extendComplicationDefinitions`, `poolOf`, `knowledgeCandidates`, and the
supporting-value/skill/language/ability derivation in the shared evaluator.

Dragon Dreams spends exactly two points, cannot repeat a trait, and does not grant
Wyrmplate. Prismatic Scales requires that signature under the accepted Q-CHAR-15
ruling. Its immunity parameter depends on selecting Scales. Dragon Breath and
Draconian Pride carry the five-Victories activation condition; borrowed traits do not
silently contribute permanent speed or immunity before activation.

Promising Apprentice separates the new crafting skill from an owned crafting target.
Rival's better skill uses a contribution of three rather than adding three; the
Director's rival target need not be owned. Ivory Tower limits cancellation to its
three new skills, removes that skill from derived ownership, and retains its explicit
dead-language exception. Choice grants cannot manufacture fixed-grant duplicate
replacement entitlements. Shipwrecked removes an actual known language, including
Caelian when chosen, and cannot remove an unfilled language entitlement.

Raised by Beasts disables culture choices and grants while retaining Caelian and
unrelated career/class knowledge. Shared Spirit keeps common skills available and
represents the self-only and spirit-only triples as conditional supporting choices;
neither exclusive set becomes unconditional knowledge. Loner's respite configuration
is optional at creation and is not a permanent new skill.

Initial item pools retain individual source paths: first-echelon trinkets, second-echelon
trinkets, leveled weapons/treasures, and artifacts. Artifact Bonded is absent and
Shattered Legacy is broken; neither becomes an always-active equipment bonus.
Strange Inheritance's owner decision has no selectable item value and records the
private Director requirement. Inventory equipping/spending and conditional item use
remain outside this catalog's build-entitlement scope, as explicitly stated by V37.
Private storage, approval guards, and restoration are covered by separate reviewers.

Following in the Footsteps uses separate future-class and currently-known heroic
references. Fury aspect restrictions apply, while Elementalist keywords do not invent
specialization requirements. The consumer checks the server-derived selection origin
to preserve a previously legal future reference when the hero reaches that level.
References grant no ability themselves. Once learned, the future ability receives
minus two cost with a floor of one; the known drawback ability receives plus one.

## Verification status

Read the contrasting cases in `tests/supporting-complications.test.ts`,
`tests/supporting-coverage.test.ts`, and `tests/app/characterChoiceOrigins.test.ts`.
They exercise owned targets, wrong cancellation targets, distinct grants, conditional
sets, source ability text, numeric consequences, and persisted future-choice origins.
No workloads were started by this reviewer. Parent-owned CT114 check/build/browser
results must be appended before the integration gate is considered complete.

## Convex bundler compatibility appendix

Independently diagnosed the apparent isolated-backend startup hang using installed Convex
1.45.0 source and [pinned esbuild 0.27.0 source](https://github.com/evanw/esbuild/blob/v0.27.0/internal/bundler/bundler.go#L2200).
Mixed attributed/unattributed imports of one JSON file cause esbuild to append import
attributes to a metafile input name. Convex's `doEsbuild` treats that name as a real
filesystem path, then suppresses the resulting non-esbuild error. This accounts for
the idle waiting state without a visible syntax error.

The lead's [CT114 reproduction](../build/evidence/V37/integration/bundler-reproduction.txt)
confirmed that the attributed complication input had a synthetic, nonexistent path.
Reviewed the bounded correction in `scripts/build-content.ts` and the generated
`shared/content/compendium/index.ts`: only the complication JSON import gains the same
attribute already used by shared evaluation. It changes neither record contents nor
rules semantics, preserves NodeNext compatibility, and avoids altering other JSON
import graphs. No package pin, backend runtime source, or content source was patched.
The lead reports actual function preparation completed in 4.44 seconds afterward, with
a subsequent normal clean startup and healthy HTTPS route. This reviewer inspected
the reproduction receipt and source correction; the lead executed the workloads.

## Final evidence receipt

Inspected the lead-generated [final check](../build/evidence/V37/integration/check-final.log)
and final [browser batch](../build/evidence/V37/integration/browser-final.log), followed
by the successful [wizard expectation rerun](../build/evidence/V37/integration/wizard-final.log).
The final implementation passes 648 tests, 483 snapshot-record checks, 289 exact
supporting source checks, lint/types, 213 Markdown link checks, and the build. V25,
V32 and both V37 journeys pass; V21 passes after correcting an obsolete test label
without changing implementation. The [integration receipt](V37-integration-review.md)
records independent authorship coverage and the remaining post-merge rollout gate.
No workloads were executed by this reviewer.
