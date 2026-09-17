# V35 independent implementation review — 2026-09-17

Reviewer: `implementation_review`, independent of implementation.

Review target: uncommitted `slice/V35` changes in
`/srv/presidium/projects/salient/foes-full`, based on main `a0ac6d4` plus reviewed
V30 prerequisite `214d04b`. Reviewed content edition:
`bf262edf546e91e1540cc17489915f18c4873ddd8bd8e225b20f3441e3f74f30`.
This review does not claim a merge or runtime rollout.

## Verdict

**Pass — implementation review.** No blocking findings. All technical acceptance checks
are verified against the reviewed edition and final CT114 evidence. The subsequent
independent pinned-source review remains required; this verdict does not claim that gate,
main integration or the shared playable runtime update is complete.

## Specifications read

- [Confirmed ingestion requirements](../../monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15).
- [Full-output comparison](../../monster-catalog-spec.md#full-output-comparison--confirmed-2026-09-16).
- [Unified object references and sharing](../../data-architecture-spec.md#35-unified-object-references-and-sharing).
- [Core monster presentation](../../monster-presentation-spec.md#presentation),
  [headless text](../../monster-presentation-spec.md#headless-remains-ordinary-text) and
  [production adapters](../../monster-presentation-spec.md#production-adapters).
- [V35 acceptance checks](../V35-full-core-ingestion.md#acceptance-checks) and
  [review standard](../README.md#review-standard).

Read repository instructions, the importer, source adaptations, maintained selection and
identity registry, comparator and CLI, compact consumer projection, shared resolver and
search contract, UI changes, source findings and regression/browser tests. No gameplay,
backend or live-roster implementation is included in this review scope.

## Acceptance checks

| Check | Status | Evidence |
| --- | --- | --- |
| 1. Exact inventory and retained source | Verified | Independent static inspection found 438 stat blocks, 1,158 abilities, 642 traits, 63 Malice parents and 206 Malice children: 2,507 addressable objects. Compared all 501 parents against actual pinned Git blobs: original JSON, Markdown and linked Markdown are byte-exact; every JSON record agrees with its retained source string. All 2,006 child spans agree using UTF-16 offsets; every parent body reconstructs from its prefix and ordered original feature spans. Final package originals, Markdown and structured fields equal that audited package; catalog bytes equal its immutable edition, and browser projection is exactly the specified evidence-free projection. |
| 2. Determinism, identities, historical editions, anomalies | Verified | All 74 existing registry entries remain an identical prefix of the 2,006-entry registry. V27 and V30 immutable edition files equal baseline Git bytes. Generation allocates no IDs. Gnoll/Hag adaptations guard exact JSON and Markdown hashes, account for every original JSON feature exactly once and preserve joined/missing original records. The final focused CT114 run passed repeated byte-for-byte regeneration against the repository package (30.06 seconds). |
| 3. Explicit full comparison and source dispositions | Verified artifact and guards | Inspected the 501-parent selection, 476-file pinned external inventory, byte-digest retrieval checks, explicit counterpart mappings and 63 field dispositions. Material exceptions guard exact source/external revisions, local/external values and relevant source excerpts; ordering, amounts, qualifiers and effect labels remain compared. Final report contains all 501 parents: 475 explained and 26 explicitly unavailable; 476 external records retrieved, no retrieval errors. Unavailable classification now guards exact pinned JSON/Markdown and ordered local content/diagnostics; offline report validation recomputes that guard. |
| 4. Source regression and reference coverage | Verified | Negative fixtures cover omitted prose, altered stats/envelopes, ambiguous identity bindings, stale source adaptations and stale correction expectations. Exhaustive reference assertions cover source-qualified groups, related Rules identities, parent features and Malice. Representative source relationships distinguish dragon Malice, echelon prior Malice, Xorannox eyes, retainers and Source of Earth. Independent static audit confirms all supporting/child references and search group/sourcebook projections; 91 distinct Rules links resolve to the pinned identity/title (including the one-element SCC array on the Heroes summon). The CT114 focused log records all 25 foe and seven Core presentation tests passing, including 12 unavailable-content/revision mutations plus name/level refusal cases. |
| 5. Browser corpus, independent features, themes, errors and volume | Verified | The final real-HTTPS CT114 run passed all five scoped browser tests in 1.7 minutes. Inspected the report and coverage attachment: all 501 parents and 2,006 feature controls opened at the reviewed edition, with zero page errors; the corpus test took 77.523 seconds. Independent feature navigation, both themes, shared Core semantics and missing-font fallback also passed. Inspected repaired Gnoll light and Hag dark screenshots, plus Source of Earth light and an independent Binding Curse dark card from the initial passing scoped run. |
| 6. Full check and independent reviews | Verified technical checks; separate source review pending | Inspected the final CT114 `pnpm check` log: lint/formatting, TypeScript, 97 engine tests, 358 app/scripts tests, 198 Markdown file link checks, both vendor pins, exact content/foe regeneration and production build passed. This report supplies the implementation pass; independent pinned-source review must follow. |

## Findings

No remaining blocking or nonblocking implementation defect identified.

Two observations were sent during review: the full-corpus page retained Undead-specific
copy, and unavailable counterpart rows returned before checking local diagnostics. The
copy has been corrected. The reviewed-content guard for unavailable rows is implemented
and independently inspected. The focused CT114 run passed its negative cases. A source-
identity assertion initially treated the Heroes summon SCC array as a scalar; the source
agent had already corrected both generation and the assertion when this was reported.

## Verification limits

The reviewer performed read-only source, identity, edition and span audits locally, with
no local development server, build, dependency installation or browser workload. CT114
execution is coordinated by the assigning parent agent; this reviewer does not claim to
have run those suites personally. The initial package used for the completed direct audit
was `/tmp/v35-pack-first.json`; final edition source/effect fields were subsequently compared
against it and remain identical. Final catalog/edition/browser/report files were inspected
directly from their repository paths.

Inspected [the focused CT114 log](../evidence/V35/focused.log): 32 tests passed in
46.26 seconds, including all 2,507 objects through the shared Core presentation adapter.
The presentation test now reads/parses archival JSON with a `FoePackage` type instead of
inferring its entire generated literal. Its assertions are unchanged; the full-corpus
loop completed in 1.335 seconds under its explicit 30-second allowance.

No external Draw Steel rules sources were consulted. Existing pinned Steel Cauldron
evidence was inspected only as the authorized secondary comparison. Comprehensive
mechanical-source approval belongs to the subsequent independent rules review.

Chords `whoami`, `list_threads` and `check_updates` returned “Ambiguous provider session;
cannot select a Chords project.” Coordination was sent to the assigning parent agent.
No main-branch, shared-runtime or vendor mutation was made by this reviewer.

The [full CT114 check log](../evidence/V35/check.log) records the passing final run.
Earlier memory-limit failures do not count as acceptance: the implementer identified a
generated JSON literal import that inflated type/transformation memory and changed the
test input mechanism as described above. The successful full run retained all assertions.
Vite reports large chunks: Foes 6,708.64 kB (696.78 kB gzip), main 1,017.22 kB
(301.54 kB gzip). These remain build advisories; browser corpus checks establish the
scoped usability gate, without claiming a broader latency/performance budget.


## Browser evidence and scope

The final [browser log](../evidence/V35/browser.log),
[structured report](../evidence/V35/browser-report.json) and
[full corpus coverage](../evidence/V35/full-corpus-coverage.json) agree on five passing tests
and the exact reviewed edition. The isolated target was
`https://salient-foes-dev-7bbd8a1a60ab.tail41404c.ts.net`, CT114 environment `foes`,
Compose `salient-foes-dev-40d531b6ad5e`. Shared main was not used for these tests.

Final screenshots inspected:

- [Gnoll Malice, light](../evidence/V35/gnoll-malice-light.png): restored envelope,
  all Iron Jaws tiers and the following effect remain readable.
- [Hag Malice, dark](../evidence/V35/hag-malice-dark.png): the independently extracted
  Casting Curses and Bodies appears before Hag Wyrd.

Also inspected Source of Earth light and Binding Curse dark in the first browser run;
the final equivalent captures are retained as
[Source of Earth](../evidence/V35/source-of-earth-light.png) and
[Binding Curse](../evidence/V35/second-echelon-ability-dark.png).

The first browser invocation accidentally included the unrelated authenticated
hero/Director fixture, which timed out waiting for campaign membership approval before
its presentation assertions. Its five relevant public tests already passed. That failed
whole invocation is not reported as a clean pass; the corrected exact five-test run
subsequently passed without product/assertion changes. Private gameplay surfaces were
not changed or certified by V35.

The reviewer did not personally repeat the remote suites, external retrieval or actual
browser interactions. Actual logs, generated outputs, coverage attachment and rendered
screenshots were inspected; independent local source/identity/span/projection audits
provide separate evidence. No claimed technical acceptance item remains unverified.

## Source-review follow-up

The independent source reviewer identified imprecise prose in six Troll weakness
dispositions. Reviewed the follow-up diff: only the explanatory `disposition` strings
changed, now correctly describing Acid with its printed magnitude followed by fire
without a magnitude. Directly checked all six pinned Markdown rows. Exact compared
values, source/revision guards and generated content remain unchanged. The implementation
**pass remains valid**. The implementer reports the scoped CT114 cached comparison and
`foes:check` rerun passed; the regenerated report retains 475 explained and 26 unavailable
rows at the same edition. No broad test rerun is needed for this explanation-only change.
