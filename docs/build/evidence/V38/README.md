# V38 integration evidence

The [slice](../../V38-foes-integration-navigation.md) integrates reviewed V30/V35/V36 into main
with a separate primary Foes link. CT114 named environment `characters` was the isolated validation target;
the completed shared-main rollout is recorded below. Text logs omit ANSI color
escapes and trailing whitespace, preserving results and diagnostics.

## Integrated checks

[Full check](check.log): 663 tests pass (274 evaluator, 389 application/tooling), lint, TypeScript,
227 Markdown link checks, both unchanged source pins, the unchanged 483-entry character snapshot,
289 exact supporting-choice sources, deterministic 438-statblock/2,006-feature Foes ingestion,
and production build. Rules remains 2,614 entries in 26 categories. The lazy Foes chunk is 6.73 MB
(705 KB gzip), the same catalog size already recorded by V36; no low-bandwidth claim is made.

The Foes importer/catalog/contracts and browser implementation match reviewed `slice/V36` exactly;
Convex and the character evaluator/supporting choices match main `0993e51`. New code only adds
primary navigation and explicit query clearing when crossing library destinations. Existing
V30/V35 source and V36 UI reviews are retained with their original scope and provenance.

## Browser and review

The new authenticated journey enters Foes from primary navigation, checks all 438 stat blocks,
opens Goblin Warrior, returns through the wordmark and enters Rules independently, then checks
that a Rules query does not carry into Foes. The integrated suite also covers all 501 catalog
parents and 2,006 feature controls, filters, card history, themes/mobile/enlarged text, shared
Core presentation, hero/Director sheets and supporting-character/private-inheritance flows.
[All 12 browser scenarios passed](browser.log) in 3.7 minutes, including the exhaustive
parent-card loop and its 2,006 feature-control visibility checks, with no page errors. [Independent review passed](../../reviews/V38-integration-review.md) after inspecting
the logs and screenshots. The line reporter retains the pass log; the earlier
[V36 corpus attachment](../V36/full-corpus-coverage.json) describes the identical catalog.

Screenshots: [primary navigation](v38-primary-navigation.png),
[Foes destination](v38-foes-library.png), [Goblin card](v36-goblin-card.png),
and [enlarged mobile layout](v36-library-mobile.png).

## Shared rollout

Merged and deployed `40206a5f544f91a828797e44fed75366f4a776e6` from clean canonical main on
2026-09-17. [Runtime identity](shared/runtime-status.json) records CT114 `main`, compose
`salient-dev-b90776c53141`, unchanged vendor pins, and the established
[shared app](https://salient-dev-fc4f48cb09a0.tail41404c.ts.net). Backend/frontend restarted healthy.
Foes ships in the frontend catalog; no database reseed, migration or data reset was needed.
Existing play volumes and character implementation were preserved.

[Five shared-browser scenarios](shared/browser.log) passed in 1.7 minutes with no skipped,
unexpected or flaky results. The [structured report](shared/browser-report.json) retains the
actual [coverage attachment](shared/full-corpus-coverage.json): all 501 parent cards, all 2,006
feature controls and zero page errors. This is a fresh run on shared main, separate from the
isolated test evidence. Primary navigation, independent Rules/Foes searches, filters, cards,
sourcebook/Malice context, mobile/enlarged text and themes passed.

The [shared primary navigation](shared/primary-navigation.png) and
[shared Foes library](shared/foes-library.png) show the actual deployed behavior. The final
closeout commit updates documentation only; runtime remains `40206a5`.
