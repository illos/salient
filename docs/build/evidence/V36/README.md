# V36 verification

Runtime: isolated CT114 local-anonymous `foes-library`, Compose
`salient-foes-library-dev-ad0e3f1c9d24`, source checkout
`/srv/presidium/projects/salient/foes-library`.
Preview: <https://salient-foes-library-dev-cb627850fa3d.tail41404c.ts.net/foes>.
Main/runtime and existing play data are untouched.

## Initial V27-catalog validation

2026-09-17, uncommitted V36 implementation atop main `a0ac6d4`, existing 11 stat blocks.
TypeScript and scoped ESLint pass. Four selection tests pass: parent facets, exact/partial/typo/
feature search, URL validation and numeric sorting with missing values last.

Three real HTTPS browser scenarios pass: composed filters/reload/empty recovery/sorting;
light/dark/narrow/enlarged-text/keyboard; and the existing feature→parent→feature→rule navigation,
focus, Escape/backdrop dismissal and theme regression. First new tests failed on exact
`getByLabel` selectors including nested option text; using the combobox's actual accessible
role/name fixed the tests. The product accessible names were correct in the browser snapshot.
The two new scenarios then passed in 6.4 seconds; existing reference regression passed separately.
Screenshots were visually inspected. Full-corpus integration and final review follow below.

## Provisional full-catalog validation

V35's provisional compact package `bf262edf` supplies 438 stat blocks across 54 bands,
63 parent Malice blocks and 2,006 child features (2,507 objects). The Malice tab also includes
206 independently addressable Malice children, so its all-reference count is 269. Sourcebook
provenance is 437 Monsters and one Heroes (Source of Earth); the ingest owner confirmed all
21 retainers are Monsters-book records, with no source reassignment. Printed levels 0 and 11
remain available rather than being clamped to typical hero levels.

Five public HTTPS browser scenarios pass on the provisional full catalog (25.3 seconds), including
both public V34 Core/glyph scenarios. Independent review identified that the initial root-font-size
check did not enlarge fixed-pixel text. Its replacement snapshots every element's computed font and
line-height before doubling them, asserts a row title actually doubles, and checks no document
horizontal overflow at 390 pixels. That replacement passes. Row accessible descriptions expose
band, level, organization, role and EV while retaining stable trigger names.

Six public browser scenarios subsequently passed together (27.5 seconds); the retained
[browser log](v36-browser-final.log) includes full-catalog pagination, Goblin Malice/group context,
Source of Earth attribution and both public V34 regressions. Visual inspection found narrow fixed
metadata columns broke words under actual 200% text. Mobile rows now place identity above flexible
metadata; the enlargement/theme/keyboard scenario passed again in 4.4 seconds and refreshed images
show whole labels. Independent feature rows inherit the parent's printed EV consistently with the
existing parent-level/role facets and EV ordering, without converting minion quantities.

## Coherent dependency integration

Integrated V30 `214d04b`, V35 implementation `0b07723` and its documentation handoff
`5634420` into `slice/V36`; nothing is merged into main. The compact package, shared contracts
and resolver match the reviewed V35 commit exactly. Adapted both inherited undead scenarios
and the exhaustive V35 browser test to kind buttons, accessible result names and pagination,
preserving their source-content assertions.

Before integration, the adapted exhaustive test passed all 501 parent references and all 2,006
attached features through this UI (1.4 minutes, no page errors). The final `pnpm check` passed: 459 tests (97 engine + 362 app/scripts), lint/format,
TypeScript, 204 Markdown link checks, both vendor pins, content/foes reproducibility and the
production build. See [full check log](v36-integrated-check.log). All four library selection
tests pass, including numeric EV ordering and preserved minion quantity text. Vite reports its
bundle-size warning: the lazy Foes chunk includes the full compact display catalog (6.73 MB,
705 KB gzip). No remote low-bandwidth performance claim is made.

Final integrated browser run: **8 passed in 1.9 minutes**, with no skipped, unexpected or flaky
results. Command:

```sh
pnpm exec playwright test tests/browser/foes-library.spec.ts tests/browser/foes.spec.ts tests/browser/v34-core-content.spec.ts tests/browser/v35-full-foes.spec.ts --grep-invert "hero and Director sheets" --workers=1 --output=/artifacts/browser-v36-integrated --reporter=line,json
```

The three new library scenarios, both inherited undead scenarios and both public V34 scenarios
pass. The exhaustive scenario visits all 501 parent references and checks all 2,006 feature
buttons, with zero page errors. See [browser log](v36-integrated-browser.log),
[structured report](v36-integrated-browser-report.json) and
[full-corpus coverage](full-corpus-coverage.json). Authenticated hero/Director sheets are outside
this public reference UI change and were not rerun. Final screenshots were refreshed; desktop
and actual 200% mobile results were visually inspected again.

The tested remote archive identifies base `0b07723` plus the V36 working changes; its code and
catalog match the branch after selective retrieval of formatted source. The later V35 `5634420`
change and V36 closeout additions are documentation only. No claim of a main deployment is made.

## Screenshots

- [Full catalog and bands](v36-full-library.png)
- [Light](v36-library-light.png) and [dark](v36-library-dark.png)
- [Mobile, 200% text](v36-library-mobile.png) and [enlarged result rows](v36-results-mobile.png)
- [Mobile stat block](v36-card-mobile.png)
- [Goblin stat block](v36-goblin-card.png)
