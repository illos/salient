# V30 independent implementation review — 2026-09-16

Reviewer: `v30_implementation_review`, independent of implementation.

Review target: uncommitted `slice/V30` changes relative to `663b49f`, in
`/srv/presidium/projects/salient/foes`. Current content edition:
`24315df7920eadd03b5a546af9deae3f460bafa531c77e9650421cf628323425`.

## Verdict

**Pass — implementation review.** No blocking findings. All technical acceptance checks pass.
The separate pinned-source review is the next required lifecycle gate; this verdict does not
claim that review, integration into main or shared-runtime verification is complete.

## Specifications read

- [Confirmed ingestion requirements](../../monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15).
- [Full-output comparison](../../monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16).
- [Unified object references and sharing](../../data-architecture-spec.md#35-unified-object-references-and-sharing).
- [App-wide rule cards](../../reference-library-spec.md#app-wide-rule-cards).
- [V30 acceptance checks](../V30-second-echelon-undead.md#acceptance-checks) and
  [review standard](../README.md#review-standard).

Read repository instructions, roadmap, kickoff, importer/comparator and CLI changes, maintained
batch and identity data, generated package/edition, consumer documentation, UI diff and tests.
No engine execution or backend changes are present in the reviewed diff.

## Acceptance checks

| Check | Status | Evidence |
| --- | --- | --- |
| 1. Deterministic generation, counts, exact source bytes/spans | Verified | Direct independent audit confirms 20 stat blocks, 44 abilities, 24 traits, six child Malice records and two Malice parents. All 22 parents retain exact pinned JSON, Markdown and linked Markdown; all 74 child spans match original Markdown using JavaScript UTF-16 offsets. Current catalog equals its immutable edition. The repeated deterministic-generation test and `pnpm foes:check` passed in the final full check, confirming exact regeneration of the generated catalog and immutable edition. |
| 2. Existing IDs, objects and editions retained | Verified | Compared baseline Git objects directly: all 52 V27 objects deep-equal current objects. All 40 existing registry entries remain the identical prefix; 34 entries append. Original edition bytes equal baseline Git bytes. New tests also resolve original references against the old edition and refuse them against the new edition. |
| 3. Echelon Malice links and independent features | Verified | Inspected explicit batch paths, generated links and browser assertions. Every supporting ID resolves; all child IDs belong to their containing parent. First-echelon blocks link level-one Malice, second-echelon blocks link level-four Malice, and level-four Malice links level-one Malice. Existing duplicate-name search tests now include Flesh Mournling's distinct Arise. |
| 4. Exhaustive fail-closed comparison | Verified | Independently ran cached comparison with output redirected to `/tmp/salient-v30-independent-comparison.json`: 22 explained, zero review/missing/ambiguous/error. Result equals committed report. For every parent, removed counterpart, duplicate counterpart, level changed to 99, and removed first-feature effects all fail: 88 rejected mutations. Reviewed revision/digest/retrieval failure handling and both explicit Malice mappings. Fetch itself was performed by implementer, not repeated by reviewer. |
| 5. Source-derived regression coverage | Verified | Inspected all 19 focused tests, including corrections, identities, nested spending, villain labels, triggers, minion quantity and comparison mutations. New Mummy Lord and level-four Malice expected text/values were checked directly against pinned Markdown. All 19 focused foe tests passed in the final full check, alongside all 340 app/script tests. |
| 6. Browser cards, themes and navigation | Verified | Read `/tmp/salient-v30-browser-3.log`: both tests passed in 10.1 seconds on isolated frontend `http://127.0.0.1:5187`. Tests open all 20 stat blocks, verify both echelon-specific Malice labels, and exercise original navigation, independent ability/trait/Malice cards, prior-Malice navigation, both themes and focus restoration. Inspected the light Binding Curse and dark Mummy Lord screenshots linked below. |
| 7. Full check and required reviews | Verified technical checks; separate rules review pending | `VITEST_MAX_WORKERS=1 pnpm check` passed with unchanged assertions/time limits: lint, 97 engine tests, 340 app/script tests, 177 Markdown link checks, both vendor pins, content regeneration, foe regeneration and production build. Read completed `/tmp/salient-v30-check-4.log`; implementer confirmed process exit 0. Focused browser suite passed. This report supplies the independent implementation pass; pinned-source review follows separately under the build lifecycle. |

## Findings

No blocking or nonblocking implementation defects identified.

The new four-minion comparison disposition is conditional on the printed basis, local amount and
quantity, matching external amount, and absent external quantity. Explicit disagreement remains
unresolved. The generator checks supporting references after importing the complete maintained
selection; intentionally incomplete importer fixtures retain the documented fixture behavior.

The static comparison report is coverage evidence, not engine certification. Existing correction,
exact-edition and source preservation boundaries remain intact. No external code or generated
external data was added to the canonical package.

## Verification limits and failed attempts

The reviewer ran direct baseline/source/identity/span audits, cached comparison reproduction and
88 comparison mutations. The implementer ran the full and browser suites; the reviewer inspected
their actual logs rather than launching competing full checks on the heavily loaded host.

The initial full check failed on timeouts in Rules setup and two foe tests. Those failures do not
count as passing validation. A second full run was stopped for host memory pressure. A third run
with `VITEST_MAX_WORKERS=2` passed every foe test but still timed out in the unchanged Rules
deterministic regeneration test. The fourth run used one worker after stopping the isolated
browser server and passed completely. Assertions and application behavior were unchanged.
Initial browser attempts also timed out; the unchanged implementation
subsequently passed both browser tests using an ignored local configuration that extends test time
budgets and uses the already-running isolated server. No application timeout was changed.
The final browser test also added all-20-parent opening/link checks and passed again.

The production build retained Vite chunk-size advisories (foes chunk 644.62 kB, gzip 55.40 kB;
main chunk 675.88 kB). These are warnings, not build failures. This slice does not claim sustained
table performance, engine execution or deployment verification. No implemented acceptance claim
remains unreproduced except that initial fetch/build invocations were not repeated personally;
their exact resulting package/report were independently checked as described above.

Chords `whoami`, `list_threads` and `check_updates` were attempted at review start; another
`check_updates` was attempted at the review boundary. All returned “Ambiguous provider session;
cannot select a Chords project.” Coordination evidence was sent to the assigning parent agent.
No shared runtime, main-branch or vendor changes were made by this reviewer.

Screenshots inspected:

- [Binding Curse, light theme](../evidence/V30-ability-light.png).
- [Mummy Lord, dark theme](../evidence/V30-undead-dark.png).

Source passages read directly from Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`:
`en/books/monsters/md/monster/undead/2nd-echelon/statblock/mummy-lord.md` and
`en/books/monsters/md/monster/undead/2nd-echelon/undead-malice-level-4-malice-features.md`.
The separate rules review owns comprehensive mechanical-source approval.
