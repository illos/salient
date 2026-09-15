# V13: Reference libraries: Rules, Foes, Items

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | not required |
| Depends on | S01 |
| Unblocks | None; V07 and V08 read its core/supplemental classification (soft) |
| Status | see `STATUS.md` |

## Goal

Ship the public, searchable Rules, Foes and Items references usable without joining a campaign, covering
all core rulebook content including eligible core retainers, companions, summons and items even where
not automated, with supplemental content (Summoner, Beastheart and the rest) and homebrew excluded and
the core/supplemental classification recorded per entry. Readable coverage must never disclose private
table state, and reading an item never places it in an inventory.

## Spec references

- `docs/reference-library-spec.md#confirmed-library-coverage` — three libraries, public access.
- `docs/reference-library-spec.md#confirmed-release-scope` — core only.
- `docs/reference-library-spec.md#official-content-is-not-necessarily-core-content` — classification rules.
- `docs/reference-library-spec.md#proposed-source-and-delivery-contract` — delivery.
- `docs/reference-library-spec.md#proposed-acceptance-examples` — examples to turn into checks.
- `docs/table-spec.md#monster-visibility-and-health-display` — glossary access is separate from table privacy.
- `docs/v1-tech-stack-spec.md#3-rendering-spa-baseline-ssr-remains-optional` — reference pages are SSR/prerender candidates (decision in V17).
- `docs/compendium-navigation.md#quick-lookup` — corpus layout to index.

## In scope

- Build-time index of the pinned corpus with per-entry classification: core / supplemental / excluded, with the source path.
- Search and browse UI for rules, monsters and items; entry pages rendering the pinned Markdown with attribution.
- Core source audit output listing retainers/companions/summons judged eligible and those excluded, with reasons.
- No campaign-state joins in reference queries.

## Out of scope

- Homebrew authoring, bookmarks, automation status beyond a factual supported/manual/unresolved label (`docs/v1-spec-checkpoint.md#release-scope`).
- Playable retainers/friendly monsters (deferred beyond V1).
- Loading a foe from the library into a roster (A03/V06 own that path).

## Inputs and dependencies

- Hard: S01 content pipeline.
- Soft: V05 automation coverage for the supported/manual label; until then label every entry "manual".

## Deliverables

- `content/index/` generated classification and search index; `scripts/` audit producing `docs/core-source-audit.md`.
- Reference routes and components; shared read operations.
- Tests asserting classification counts against the audit; implementation notes in `docs/reference-library-spec.md`.

## Acceptance checks

1. `class/summoner.md` and `class/beastheart.md` are classified excluded and absent from the Rules library; the nine core class files are present.
2. Searching "winded" returns `rule/health/winded.md` rendered from the pinned corpus with its source path shown.
3. An unauthenticated request can read a monster entry; the same request cannot read any campaign roster query.
4. Every entry under `chapter/retainers.md` and the retainer statblocks appears in the audit with an eligibility decision and reason.
5. The Items library shows an item's full rules text and a "manual" label; no operation adds it to an inventory.
6. Rebuilding the index from the pinned submodule produces identical classification output.

## Rules research

None for mechanics. Corpus navigation only: `vendor/steel-compendium/en/unified/md/_index/`, `chapter/retainers.md`, `chapter/the-summoner.md`, `chapter/the-beastheart-class.md` (to identify supplemental boundaries), `rule/general/retainer.md`, `rule/general/follower.md`.

## Open questions

Candidate `Q-V-n` entries from `docs/monster-catalog-spec.md#remaining-decisions`:

- Which retainers/companions/summons count as core-eligible where the corpus does not mark provenance.
- Distribution/attribution for shipped source material under the third-party notices.

## Work log

2026-09-15 — explicitly authorized by the user for the provisional internal-tool stage. Build the
complete core-book Compendium at `/rules`, using the native stack, with clean English rendering,
search, sidebar/category/book navigation and reusable ID-based views. The user explicitly requests
automated ingestion; never copy/paste or hand-maintain generated Markdown. This assignment brings
V13 forward independently of the earlier milestone ordering. Existing source attribution and
the provisional data-repository license uncertainty are recorded in the conversation.

Plan: add a deterministic TypeScript ingest command reading Git blobs at the existing pin, generated
static catalog/articles/search documents, shared reference contracts and search ranking, a lazy-loaded
React rules route and shared article/link components. Verify corpus inclusion, source-text rendering,
cross-book links, exact/partial/typo searches and browser navigation. Readable source names replace
the older acceptance requirement to display filesystem paths. Static reference assets contain no
campaign data and require no backend mutation. Work in the current checkout because there is one
implementer and the earlier research/spec changes already live here; slice branches isolate concurrent
implementers under the build policy.

2026-09-15 — implementation and verification:

- Added the complete core reading library at `/rules`, with category/book navigation, chapter contents,
  linked articles, exact-title/prefix/fuzzy search in a web worker, filters, direct URLs and copy-link.
  Public access bypasses the app shell's login gate only for the rules routes; no campaign query changed.
- `scripts/ingest-rules.ts` reads both core books from the pin, validates every article link and emits
  sanitized HTML, metadata, search documents and an eligibility audit. The user requested `sourceUrl`
  explicitly: every record stores its original Steel Compendium SCC permalink separately from its
  internal route. Source IDs, source paths and the pinned revision are retained as metadata.
- Actual generated output is `public/rules-data/`, replacing the outline's proposed `content/index/`.
  It is ignored by Git and rebuilt automatically by dev/build. The audit is documented in
  `docs/core-source-audit.md`. Foes and Items are topics within the unified `/rules` surface as requested.
- 2,614 entries, 20 chapters, nine core classes, 26 categories; zero unresolved article links, copied
  images or decorative pictographs. Expanded chapter bodies preserve nested entries; raw bodies index
  chapter-only prose without adding expanded-book duplicates to search. Source excerpts retain spaces
  between blocks/table cells and render line breaks correctly.
- `pnpm check` passed: 85 engine tests, 312 app/tooling tests, clean docs links, unchanged vendor pins,
  unchanged 403-entry runtime snapshot, successful production build. The existing main-bundle size
  warning remains; rules UI and search worker are separate lazy chunks.
- `pnpm exec playwright test tests/browser/rules.spec.ts tests/browser/theme.spec.ts
  tests/browser/journey.spec.ts` passed all six tests: public reading, exact/typo search, source URLs,
  reload/history, chapter anchors, cross-references, filters, mobile navigation, plus existing account,
  session and theme workflows. Visually inspected home/chapter/creature pages in light/dark and mobile.
- Search acceptance checked all 2,208 unique case-insensitive titles for first-result placement; prefix,
  typo and book/topic filter checks also pass. Two fresh imports compare byte-for-byte in the test suite.
- No gameplay automation, inventory writes, chat/bookmark/preview behavior or deployment is included.
  The shared `RuleLink` and article view establish ID-based reuse for later consumers.

Independent review requested after `pnpm check` passed; verdict to be recorded below.

2026-09-15 — review correction: frontmatter-only ability/item facts were missing from standalone
pages. Added an explicit readable projection for source cost, level, signature status, item echelon/type,
kit type and other source context, and included it in search. Source-derived tests cover Back!'s
3 Ferocity cost, Brutal Slam's signature/level metadata, Black Ash Dart's echelon/type, and Arcane Archer's
kit type. Added browser cost visibility and an anonymous private-roster rejection assertion. This keeps
source metadata meaningful while hiding its machine keys. A new ingest and repository check verify the fix.

2026-09-15 — independent review **pass**, `rules_review`, recorded in
[the review](reviews/V13-rules-review.md). No open blockers. Refreshed `pnpm check` passed with 85
engine and 312 app/tooling tests. Final isolated browser rerun passed 2/2 (7.6s), including the cost
assertion; an overlapping reviewer browser run had collided in Playwright's shared artifact directory,
so the final run used its own output directory. Earlier account/theme regression suite passed 6/6.
`pnpm rules:check` also verified generated files. No deployment or upstream pin change occurred.

Committed: `7cda2ce` (research/shared-reference decisions), `dafcd8a` (implementation and review).


2026-09-15 — user assigned the app-wide reference presentation follow-up. Replace inline source
blocks, source paths and decision IDs with clean English and a shared, discreet rulebook icon linking
to the matching `/rules` article or section. Keep operational choices, costs, results and unresolved
resolution controls. Plan: shared ID/path resolver and accessible icon, wizard labels/section mapping,
sheet/condition/foe/log consumers, source-block anchors, browser journey and reference coverage checks.
No backend changes or gameplay semantics are planned. Independent review follows `pnpm check`.


Follow-up steering: the user replaced new-tab links with centered modal cards, blurred backdrop,
overflow scrolling and backdrop dismissal. References within a card navigate in place with Back;
Escape and close restore focus. The cleanup query passes through its existing ability ID, the only
backend projection change. Added exhaustive runtime/wizard-reference resolution and section-anchor
checks plus popup/draft-preservation and updated full journey browser coverage.

2026-09-15 — app-wide rule-card verification and review:

- Replaced inline source expansions in wizard decisions/options, standalone and table sheets,
  conditions, foe panels, campaign/table activity logs and cleanup cards. Machine decision labels
  now have English display names; provenance remains in existing data and snapshots.
- Added the shared lazy modal reader with centered layout, blurred backdrop, scrolling, related-rule
  navigation/Back, close/Escape/backdrop dismissal and focus restoration. User follow-up reduced
  the original 16px book artwork by 25% to 12px; the 28px interaction area is retained.
- Chapter decisions resolve to matching sections. Ingestion gives bold monster ability/trait titles
  stable section anchors. All current wizard sources and 403 runtime references resolve; unknown
  identities are not guessed from editable names. The existing cleanup query now projects abilityId.
- `pnpm check` passed 85 engine plus 315 app/tooling tests, docs/vendor/content checks and production
  build. New reference checks share the existing in-memory ingestion fixture, so clean checkouts do
  not depend on ignored generated assets. Independent focused reference/closeout checks passed 10/10.
- Final focused browser run passed 2/2 in 28s (`journey.spec.ts`, `rule-popup.spec.ts`), covering foe
  references, account/session flows, private draft save/reload, relevant-section scrolling, in-card
  navigation, backdrop blur/dismissal, Escape, focus restoration, unchanged drafts/route and mobile
  popup bounds. Earlier rules/theme regression tests passed 5/5. Visually inspected the popup.
- The fuller wizard run completed creation, admission, sheet audiences and the new Brutal Slam
  popup assertion, then failed in the existing later reconnect expectation: the player's pending
  ability draft was already null. No draft/reconnect write path changed in this slice. The additional
  broad closeout run timed out during environment slowdown; the table audit was interrupted. Those
  full regressions are not claimed as passing. The final focused journey reconnect check passed.
- Local backend sync succeeded at `anonymous-agent`, `http://127.0.0.1:3212`; the existing local daemon
  required direct attachment. The ignored environment file was restored afterwards. No external
  deployment, content reseed or vendor change occurred.
- Independent review: [rule-card review](reviews/V13-rule-cards-review.md), pass for this feature.
  Nonblocking follow-up: project foe identity in roster reads to avoid fetching full Director-only
  source snapshots merely to render their icons. No unresolved implementation blocker remains.
