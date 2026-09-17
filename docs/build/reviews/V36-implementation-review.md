# V36 independent implementation review

Reviewer: `review_foes_library`, 2026-09-17. Reviewed uncommitted `slice/V36` on
`5634420`, including coherent V30 `214d04b` and V35 `0b07723` prerequisites.

Verdict: **pass**. The coherent V35 dependency, integrated full check and final eight-scenario
browser run passed. All identified UI findings are resolved; no blocking filtering, search,
routing or reference-navigation defect remains in the reviewed code. This is branch acceptance,
not a claim of main integration or shared playable-runtime rollout.

## Scope and sources

- `docs/monster-catalog-spec.md#user-visible-flow`
- `docs/reference-library-spec.md#app-wide-rule-cards`
- `docs/reference-library-spec.md#confirmed-library-coverage`
- `docs/monster-catalog-spec.md#foes-library-browsing--v36`
- `docs/build/V36-foes-library.md#acceptance-checks`

Read project instructions and build/review process. Inspected UI, selection model, URL validation,
styles, browser changes, focused tests, shared overlay implementation and existing data contract.
No mechanics changes are made; rules review is not required. V35 ingestion has a separate review;
the initial 11-statblock evidence does not certify its pending full-corpus integration.

## Acceptance checks

| Check | Current result | Evidence |
| --- | --- | --- |
| 1. Public default, printed metadata and full Core cards | verified | Static review and full 438-statblock browser scenario; inspected desktop/Goblin/mobile cards |
| 2. Composed facets, chips, reset and empty states | verified | Selection model and recorded composed-filter/reload/empty-recovery scenario |
| 3. Search and numeric/name/band/EV sorting | verified | Selection code, all four focused tests including numeric EV/quantity assertions, and browser search/sorting; printed parent EV preserved without quantity conversion |
| 4. URL preservation and nested navigation/Back | verified | Recorded feature/parent/rule, Goblin group-context/Malice and Source of Earth scenarios |
| 5. Themes, narrow screen, keyboard and 200% text | verified | Actual computed-font doubling assertion, passing browser rerun and refreshed enlarged result screenshot |
| 6. Checks, regressions, independent review and separate corpus result | verified | Integrated full check passes 459 tests; all eight public browser scenarios pass together, including exhaustive corpus coverage; this document supplies independent implementation pass |

## Findings

1. **Medium, resolved acceptance evidence:** original `tests/browser/foes-library.spec.ts:61`
   changes the root font size to 200%, but the library's principal typography uses fixed pixel
   sizes in `web/foes/foes.css` and `web/rules/rules.css`. This does not enlarge most tested text.
   Replaced with computed-style snapshot/doubling and an assertion that row text actually doubles.
   The initial actual-enlargement run exposed word fragmentation in fixed-width mobile metadata;
   the responsive fix places identity above flexible metadata. Inspected the refreshed
   [200% results](../evidence/V36/v36-results-mobile.png): labels remain intact and readable.
2. **Low, resolved accessibility:** original `web/foes/index.tsx:159` supplied a button name containing
   only the foe/parent name, replacing its visible metadata in the accessible name. Provide a
   metadata description so screen-reader users can compare level, organization, role and EV without
   opening every result. Added `aria-describedby` and a passing accessible-description assertion.

## Verification limits

The reviewer inspected `/tmp/v36-initial-check.log` (448 passing tests and successful build),
the scenario source and implementer's browser evidence record; the reviewer did not independently
rerun CT114 workloads because the shared named environment was actively in use by the implementer.
Inspected initial light/narrow/Ghost screenshots and the durable refreshed full library,
Goblin card, 200% library and enlarged result captures. The retained
[six-scenario browser log](../evidence/V36/v36-browser-final.log) records 27.5 seconds, including
both public V34 regressions. The [evidence record](../evidence/V36/README.md) records the subsequent
4.4-second enlargement/theme/keyboard rerun after the responsive fix. No independent remote workload
rerun is claimed. Coherent dependency acceptance, the final integrated full check and the final
eight-scenario browser run subsequently passed.

Chords MCP returned an ambiguous-provider-session error; the parent maintains project coordination.

## Incremental compact-catalog review

Reviewed the provisional V35 display-package integration, explicit band/sourcebook metadata,
sourcebook filter/footer, related-rule navigation, result accessible descriptions and replacement
text-enlargement test. No new blocking implementation finding. The replacement test snapshots
computed sizes before doubling each element and asserts that row names actually double, addressing
finding 1's test defect; execution and visual evidence subsequently passed. Finding 2 is addressed by
`aria-describedby`, with a browser assertion for the row description.

Static inspection of the supplied projection found 438 stat blocks, 269 Malice objects (including
children), 1,158 abilities and 642 traits, with no dangling feature/support IDs, nonnumeric statblock
levels, parent/group mismatches or related-rule path fragments. The UI displays the supplied provenance;
the V35 owner confirmed 437 Monsters and one Heroes entry, with 21 retainers sourced from Monsters.
This review does not independently certify that ingestion claim. The copied dependency files are
provisional integration inputs, not V36-authored ingestion or independently certified source evidence.
The final coherent V35 dependency was subsequently integrated unchanged from its reviewed commit.

Reviewed the subsequent EV correction: independent features now display their parent's printed EV,
matching the preexisting parent-derived numeric sort, level and role. Minion quantity text is retained.
The Bone Shards parent-EV assertion passed with the focused tests per the implementer's record;
new numeric EV-ordering/quantity fixtures subsequently passed in the integrated check. No new finding.

## Final integration review

Inspected the coherent prerequisite commits and their independent implementation/source review records.
V36 does not alter the V35 compact catalog, display contract or generic resolver. The preserved V30
and V35 browser assertions use the new kind buttons, result names and search to locate paginated entries;
their substantive source/content assertions remain intact.

The [integrated CT114 full-check log](../evidence/V36/v36-integrated-check.log) passes lint/format,
types, 97 engine and 362 app/scripts tests (459 total), links, both vendor pins, exact generated
content/foe checks and production build. All four V36 selection tests pass, including final EV fixtures.
The 6.7 MB Foes bundle warning remains a performance follow-up; the scoped checks establish usable
browsing, without claiming a broader latency budget.

The final combined eight-scenario browser run passed in 1.9 minutes on CT114: three library scenarios,
both undead regressions, both public V34 presentation/glyph scenarios and the exhaustive test opening
all 501 parent definitions with their 2,006 feature controls. The implementer reported exit 0 and is
retaining the log/report in the [evidence directory](../evidence/V36/README.md). This result closes
the last acceptance gate; no product code changed after the final static inspection.
