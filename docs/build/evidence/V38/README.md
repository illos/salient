# V38 integration evidence

The [slice](../../V38-foes-integration-navigation.md) integrates reviewed V30/V35/V36 into main
with a separate primary Foes link. CT114 named environment `characters` is the isolated target;
shared main stays on the preceding verified version until merge/rollout. Text logs omit ANSI color
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

Pending; isolated verification does not establish a completed shared rollout.
