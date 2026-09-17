# V37 integration review receipt

Date: 2026-09-17. Reviewer: `v32_integration_review`.
Status: **integration-ready pass; shared rollout remains a separate post-merge gate**.

This receipt combines independent static reviews with inspected CT114 artifacts. The
reviewer authored parts of the wizard/sheet, private inheritance UI/backend and tests;
those changes are certified only by the other collaborators' reviews below. No local
application workloads or remote jobs were run by this reviewer. The lead owns CT114
execution, commits, merge and shared rollout.

## Independent coverage

| Implementation | Independent review |
| --- | --- |
| Background/career/perk content, source incident coverage, root evaluator consumers | [Complication researcher's review](V37-complication-evaluator-review.md) |
| Complication catalogs, complete ability texts, source pools and eligibility | [This reviewer's catalog review](V37-complication-catalog-review.md), plus the background researcher's catalog follow-up |
| Root evaluator, replacements, trusted Footsteps origins and persistence | [Background researcher review](V37-background-evaluator-review.md) |
| Initial private inheritance access/storage and displayed revision binding | [Background researcher's private review](V37-private-director-review.md) |
| Later Director setup/activation/restore changes authored by the background researcher | [Complication researcher's activation review](V37-director-setup-activation-review.md) |
| Wizard, sheet, selected skill/language text, dependent progression controls and guidance | [Background researcher's UI review](V37-supporting-ui-review.md) |

The completed static reviews close the earlier immunity, removed-knowledge ownership,
Footsteps origin/cost-floor, private build-context, and owning-Director restore findings.
The latest UI review found stale hidden advancement targets and incorrect owned-skill
guidance for Rival's unrestricted Director target. The lead has corrected both, and
the independent UI reviewer has now closed both findings by static re-review. The
final CT114 artifacts below cover the corrected behavior.

## Generator and source integrity

Reviewed the generator change independently. It adds the borrowed Dragon Knight trait
and ability sources needed by Dragon Dreams; source catalog presence does not make an
additional ancestry/class tree selectable. Grounded's existing Motivate Earth source
is reused rather than selected twice.

The final generated complication JSON import matches the evaluator's JSON attribute.
The [compatibility diagnosis](V37-complication-catalog-review.md#convex-bundler-compatibility-appendix)
and [remote reproduction](../build/evidence/V37/integration/bundler-reproduction.txt)
explain why this narrowly fixes Convex 1.45/esbuild 0.27 metafile handling. The checked-in
generator produces the correction; no manual-only generated-file workaround or
dependency upgrade is involved. The source pins remain unchanged.

## Final isolated verification

Inspected the [final full check](../build/evidence/V37/integration/check-final.log),
[final browser batch](../build/evidence/V37/integration/browser-final.log), and
[corrected wizard expectation rerun](../build/evidence/V37/integration/wizard-final.log).
The final full check records 648 passing tests (274 engine, 374 app/scripts), lint and
type checks, 213 Markdown link checks, 483 generated content records, 289 exact supporting
source checks, foe verification, and the production build. It includes the generated
import correction and final progression/Rival implementation. The content check reports 10 excluded records; source
coverage retains 18 careers/108 incidents, 13 culture aspects, 47 core perks, 57 skills
plus five groups, 42 languages, 25 kits, and 100 complications. Rule ingestion reports
2,614 entries in 26 categories with no unresolved links.

The final browser batch passed V25 Elementalist, V32 Fury advancement, and both V37
scenarios. The revised V32 scenario exercises nested perk target to Danger Sense,
checks the persisted target was removed, and preserves the immutable earlier build.
V37 covers complete supporting text, nested selection persistence/review, Rival's
distinct owned/unrestricted target guidance, and both private inheritance setup paths
without exposing item identity to the player.

The batch's one failure was V21's obsolete expected label, `Not offered in v0.01`.
The source control already displayed `Not offered yet`; the lead changed only that
browser expectation. The separately inspected rerun passed the entire V21 wizard
scenario in 13.5 seconds. The lead confirms no implementation changes followed the
final full check. Thus all five final browser scenarios have passing receipts, with
the failed first assertion and its test-only correction preserved transparently.

Earlier [full-check](../build/evidence/V37/integration/check-before-import-fix.log) and
[supporting-browser](../build/evidence/V37/integration/supporting-browser.log) artifacts
remain supporting history. Earlier table/sheet regression passes were reported by
the lead and are not represented here as personally executed checks.

**No unresolved blocking finding remains in the cross-reviewed V37 implementation.
The isolated evidence supports integration into main.** This is an independent review
of source changes, other collaborators' findings, and lead-generated evidence; it is
not self-certification of the reviewer's implementation or a claim to have run CT114.

## Separate post-merge gate

The lead must complete merge/shared-environment verification and record the actual
integrated commit. No shared-rollout completion is implied by this isolated integration pass.
