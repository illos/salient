# Hosted app performance audit — 2026-09-19

This is the pre-change baseline. Follow-up implementation and verification are recorded in [V41](build/V41-reference-performance.md).

The live app has avoidable download and navigation costs, plus a staged table startup. The largest immediate opportunities are preserving client-side navigation, caching immutable assets, splitting the application bundle, and loading reference details/search separately from the initial listings. A separate history-read problem threatens performance as sessions grow.

This is an audit, not a deployed optimization. No application source, backend functions, content, or hosting settings were changed. One disposable account and a separate six-foe campaign were created through the normal hosted UI with the user's authorization. No existing campaign was changed.

## Target, method, and limits

- Frontend: `https://salient-dev.rdxx.workers.dev`; backend: Convex **dev** `different-bat-943`.
- Source inspected: main `6ddb3cb47e772680c01fdcf3d45319fdb9a9db21`; recorded hosted implementation `62ca7b964c700eae20fd32b3393fdbcd175c9af4`, Worker version `97387eb7-b9b7-41c1-b19e-dc96379cecc3`. The live asset filenames match the baseline build experiment. Deployment metadata was taken from the [hosted runbook](hosted-development.md), not independently queried with an administrative key.
- Headless Chromium through Playwright 1.63.0 on CT114, 1440×1000 viewport, no artificial CPU/network throttling. Browser container: 2 CPU / 2 GiB limit. Requests went to the public Worker and cloud backend, never the private Vite server. Observed Cloudflare responses used SJC.
- Three fresh-browser-context loads per public route. Repeated authenticated navigation used one context; direct table loads comprised one fresh context followed by two cached document loads. Wall times run from invoking navigation/click to the stated visible selector, including browser automation/load/polling overhead. These are small-sample synthetic observations of the real deployment, not real-user percentiles, exact INP/LCP, or guarantees for another connection.
- Collected resource sizes/timings, long tasks, response cache headers, and sanitized WebSocket query names/times/result sizes. No passwords, cookies, tokens, request bodies, or user query results are in the evidence. Subscription-to-result times include network, batching, and scheduling; they are **not server execution times**.
- The supplied campaign refused the new account with `Campaign unavailable`, as expected. Table measurements therefore use the disposable campaign, six Goblin Warriors, a running FreePlay session, no heroes, and a short log. Existing campaign size, combat, large parties, mobile CPU, long-session heap growth, and concurrency were not measured.
- Convex MCP `status` points at the stopped old local backend on `127.0.0.1:3212`; it cannot inspect this cloud target. No cloud 72-hour insights, billing, read counts, or server profiles were available through that configured connector. Backend scale findings below are explicitly code findings, not invented deployment telemetry.
- Timed browser runs finished before the character thread announced heavy CT114 validation at 04:53:30 UTC. Shared guest/network variability still applies. No measured browser run overlapped this audit's build experiments.

## Measured behavior

| Action and readiness criterion | Results |
| --- | --- |
| Cold login, email input visible | 2.690 / 3.005 / 3.352 s; median **3.005 s** |
| Cold Rules, overview visible | 2.666 / 3.643 / 4.208 s; median **3.643 s** |
| Cold Foes, first result visible | 2.844 / 4.708 / 8.151 s; median **4.708 s** |
| First Rules search, results available | **4.043 s** |
| Subsequent Rules searches in the same listing | **177 / 179 ms** |
| Search after visiting an article and returning | **1.784 s** |
| Open one Rules article, actual prose visible | **817 ms**; fetched the whole 1.51 MB ability chunk |
| First Rules → Foes transition | **1.828 / 2.322 s** in separate sequences |
| Rules → Foes while the module remains in memory | **45 ms** |
| Foes → Rules using its header link | **890 / 1,003 / 1,440 ms**, full document reload on all three |
| Foes wordmark → app | **1.950 s**, full document reload |
| App → already-loaded Rules overview | **30 / 31 ms** |
| Foe reference dialog, cached module | **30 / 32 / 39 ms** |
| Foes search for “goblin”, ready results | **21 ms** |
| Campaign → six-foe table shell | **296 / 297 / 301 ms**; log/details arrive afterward |
| Table Log → Rolls | **11 / 14 / 17 ms** |
| Table Rules overlay | **16 / 17 / 20 ms** with catalogue already loaded |
| Direct table load, log contents visible | **4.531 s** fresh context; **2.866 / 2.090 s** cached document loads |

Zero page errors were recorded in the completed navigation/search/table measurement runs. Early harness attempts used a nonexistent pre-session table link and the wrong expected log phrase; those selector timeouts were corrected and are not app failures or performance samples.

## Findings and savings, in recommended order

### 1. Foes navigation destroys the warm application

**Confirmed, high impact, small fix.** [Foes header](../web/foes/index.tsx) uses ordinary anchors for `/` and `/rules` (lines 291 and 321). The Rules header uses router links. Live `performance.timeOrigin` changes confirm actual document reloads through the Foes anchors.

Those reloads discard in-memory reference promises, MiniSearch indexes, React state, the Convex connection, and active subscriptions. Even cached resources must revalidate. Returning to Foes afterward took about 950 ms again, while returning without destroying the document took 45 ms.

Replace same-tab internal anchors with router links and explicit search reset, preserving modified-click/new-tab behavior. Expected benefit is avoiding the observed **0.9–1.95 s reload paths** and repeated bootstrap/index work; 30–45 ms warm transitions demonstrate the attainable class of behavior, not a verified post-fix guarantee.

### 2. Hashed and versioned assets revalidate on every document load

**Confirmed, high impact, small configuration change.** Live JavaScript, CSS, and versioned Rules data return `Cache-Control: public, max-age=0, must-revalidate`. Cached JS/CSS requests returned HTTP 304 and took roughly 80–435 ms individually in the sampled Foes → Rules sequences. Many requests overlap; do not add their durations as a total saving. Cloudflare edge HIT does not eliminate browser-to-edge round trips.

Add long-lived immutable browser caching for filename-hashed `/assets/` files and explicitly versioned Rules data. Keep the HTML shell and mutable `rules-data/catalog.json` revalidating; do not make the current manifest immutable. Prefer generating exact version-prefix rules during ingestion/build so the unversioned catalogue cannot accidentally inherit them. Workers static assets support `_headers` for this purpose. [Cloudflare header documentation](https://developers.cloudflare.com/workers/static-assets/headers/).

Validation must inspect actual hosted headers and cached navigation after release, including a content-version upgrade. Caching does not remove JavaScript execution or authentication on a full reload, so it complements finding 1.

### 3. Every entry route loads unrelated page code and content

**Confirmed, high impact, moderate change.** [Router imports](../web/router.tsx) eagerly include campaigns, character pages, the wizard, progression, and the table. Only Rules/Foes are lazy. The live main entry is **1,720,734 bytes decoded**, approximately **423 KB transferred**, even on login and public reference pages. Its static JavaScript dependency closure is **1,827,886 bytes / 458,779 bytes gzipped** in the baseline build.

The module inventory identifies complication content, supporting background/complication definitions, the content manifest, and the Markdown/HTML parser stack among major contributors. [Wizard imports](../web/wizard/index.tsx), [supporting components](../web/wizard/supporting-components.tsx), and [core content rendering](../web/components/core-content.tsx) explain why they are pulled in. The shared renderer imports unified, remark, rehype, and parse5 through [presentation/content.ts](../shared/presentation/content.ts).

An isolated Vite transform making the six existing route-import groups lazy reduced the **entire initial static JS closure**, including shared imports, to **488,524 bytes / 160,726 bytes gzipped**: **73.3% fewer decoded bytes and 65.0% fewer gzip bytes**. This is a bundle-only experiment, not completed routing work. It needs proper route suspense/error handling and browser verification before shipping. Its gzip comparison uses the same compressor for both builds; live Cloudflare encoding may differ.

A second step is separating the lightweight display/glyph helpers from runtime Markdown conversion and serving pre-rendered, sanitized immutable content where possible. Preserve the sanitization and presentation contract. Chunking only one file without checking its transitive imports is insufficient. The experiment also shows the table still imports substantial shared character presentation content after initial-route splitting, so table-specific bundle work remains.

### 4. Foes bundles the entire reference package and builds search before displaying a list

**Confirmed, high impact, moderate change.** [Foes startup](../web/foes/index.tsx), lines 15–26, embeds `browser.json?raw`, parses it, and calls [createFoesLibrary](../web/foes/library.ts) at module evaluation. The package includes **2,507 objects** (438 stat blocks plus Malice/features), HTML, structured fields, provenance, and full search text. MiniSearch indexing is synchronous on the main thread, even for an empty search.

Live Foes chunk: **6,733,336 decoded bytes / approximately 692 KB transferred**. Its request alone took **1.38–4.46 s** in the cold samples. Startup long tasks were **185–202 ms**; attribution to individual parsing/indexing functions was not CPU-profiled, but their synchronous startup path is explicit in code.

Split listing metadata, search documents/index, and detail shards. Show the default 40 rows from metadata, fetch details when opened, and initialize search in a persistent worker on intent or idle time. The existing 40-row limit already bounds initial DOM work; rendering all 438 cards is not the current problem.

A local payload sketch retaining the 438 statblocks' listing fields is **282 KB raw / 20.6 KB gzip**, versus **6.63 MB raw / 680.8 KB gzip** for the full JSON package. That suggests approximately **97% less initial data** if full-text search/details are deferred. This is a sizing sketch, not a validated replacement schema; all kinds, filters, provenance, and related references must remain accessible.

### 5. Rules loads a heavy catalogue; article chunks are much larger than the requested article

**Confirmed, medium/high impact, moderate change.** [Rules catalogue loading](../web/rules/content.ts) fetches **1,696,717 decoded bytes / approximately 233 KB transferred** for 2,614 summaries before showing the overview. This request starts after application and Rules module initialization. The cold samples spent **410–1,515 ms** in this fetch.

Overviews and embedded reference buttons do not need every result excerpt and full source URL up front. Exact JSON/gzip experiments: current catalogue **232,685 gzip bytes**; moving excerpts out **77,377** (67% smaller); also deriving/deferring source paths/URLs **52,990** (77% smaller). Retain the needed identity/source resolver mapping; source metadata should move or be derived, not disappear.

[Ingestion](../scripts/ingest-rules.ts), around line 370, groups article payloads by book/category. Opening one ability fetched **1,513,763 bytes** of decoded JSON. Generated chapter chunks reach **4.21 MB** for Heroes and **5.79 MB** for Monsters; monster-statblock JSON is **4.46 MB**. Use per-article or bounded-size shards, and a compact manifest. Keep the existing versioned addressing and bounded article cache.

### 6. Rules rebuilds search after leaving the listing

**Confirmed, medium/high impact, small/moderate change.** [useSearch](../web/rules/index.tsx), lines 46–89, owns and terminates its worker on unmount. Visiting an article or clearing back to Overview unmounts `Listing`. [search.worker.ts](../web/rules/search.worker.ts) caches the search index only inside that worker, so a later listing creates a new worker, requests the **3.08 MB decoded** search corpus, and rebuilds MiniSearch.

Measured first search **4.043 s**, warm queries **177–179 ms**, and search after article navigation **1.784 s**. Response evidence confirms another search-corpus request on return. The deliberate 150 ms debounce explains much of the warm response; there is no evidence that shortening it is the highest-value fix.

Keep a worker/index service keyed by content version across route changes, with explicit lifecycle and request sequencing. Optionally prewarm on search focus. Preserve error recovery and prevent stale results from an earlier query/version. Benchmark this before adopting a larger prebuilt index: a serialized index can increase transfer size.

### 7. Table startup has serial gates and eager per-creature detail subscriptions

**Confirmed structure and network behavior, moderate impact now; larger-party costs unmeasured.** The dependency chain is:

`entry assets → auth session/token → auth.viewer → roster/campaign/encounter → child log/history/catalog/creature details`

[ProfileGate](../web/router.tsx) waits for the viewer before mounting the route; [TablePage](../web/table/index.tsx) waits for three queries before mounting its children. A fresh six-foe table reached `auth:viewer` at **3.605 s**, top-level data by **4.035 s**, and child query results by **4.461 s**. In a cached direct load the corresponding times were **1.298 / 1.432 / 1.649 s**. UI-selector timings include additional automation/paint overhead.

The first table mount had **16 active distinct subscriptions**: viewer, four top-level queries, five shared child queries, and six foe-detail queries. Each [FoeCard](../web/table/director-pane.tsx), line 94, retrieves a **4,115-byte full source snapshot** just to show the role/level subtitle. Six identical Goblins transferred **24,690 bytes** of repeated detail. [Hero cards](../web/table/heroes-pane.tsx), line 76, request full owner/Director character sheets for summary facts; [characters.sheet](../convex/characters.ts) builds abilities/features/common actions, which would add more work with heroes present.

Project small role/level/maxima fields into an audience-safe roster response; fetch full sheets only on expansion and immutable source content by shared versioned identity. Start genuinely independent log/roster queries together. Avoid replacing everything with one giant frequently invalidated subscription. Use scoped prewarming for likely table navigation and retain subscriptions briefly where useful. Convex 1.45.0 already exposes `prewarmQuery`; this was verified in installed source and the [API documentation](https://docs.convex.dev/api/classes/react.ConvexReactClient).

Identical hooks with identical arguments can share a Convex subscription; counting hooks is not a valid request count. The counts above come from WebSocket frames. Route transitions also showed brief subscribe/remove churn before the final subscriptions; simplify the changing shell/outlet structure and verify with instrumentation before assigning an exact cause or saving.

### 8. Session history is reread in full by two live table queries

**Confirmed code risk; long-session impact not measured.** [sessionEvents/loadHistory](../convex/lib/history.ts), lines 213–249, collects all active-session events and, in FreePlay, all session encounters. [history.status](../convex/history.ts) calls it. [abilities.results](../convex/abilities.ts), around line 242, independently calls `loadCorrectionWindows`, which calls the same `loadHistory` even with zero ability results in a running session.

New events can cause both subscriptions to recompute. The event-log UI itself correctly requests only 51 records, but that does not bound these separate reads. Expect increasing read bytes and history-walk CPU with session duration; no actual limit hit, OCC issue, dollar cost, or slow user campaign is established by this audit.

Introduce a semantically correct current history scope/checkpoint or maintained undo/correction summary and bounded incremental reads. Preserve rewind/redo branches, linked units, archived-encounter floors, and authorization; simply replacing `.collect()` with `.take(50)` would break history. Avoid loading correction windows when there are no relevant result rows. Test growing sessions and record server read/execution metrics before and after.

### 9. Broad reactive dependencies and hidden UI create extra work

**Confirmed code paths; aggregate savings unmeasured.** [appendEvent](../convex/lib/events.ts) patches campaign `eventSequence` on every event. Many reads load the entire campaign through [requireMember](../convex/lib/access.ts) or `tableContext`, so unrelated event changes can invalidate static-looking queries. Each `requireUser` also runs Better Auth's session/user lookup path. This is a reason to reduce redundant query/read dependencies while preserving session revocation and access checks, not to remove authentication.

[CampaignPage](../web/campaigns.tsx) mounts `CommandConsole` inside a closed `<details>`. Its [Palette](../web/palette.tsx) subscribes and renders the entire command list anyway: **34,736 result bytes** were measured while the command UI was collapsed. Mount it on opening. Table command palette already mounts conditionally; preserve that behavior.

[encounters.current](../convex/encounters.ts) sequentially reads unique foes and repeatedly filters turn entries per group. Batch independent reads and group entries once if large-combat profiling shows this matters. This is secondary to the measured startup costs.

## Practical implementation sequence and acceptance

1. Router links and immutable asset headers. Verify no new document/auth/WebSocket bootstrap on same-tab reference navigation, and the latest HTML/catalogue still updates correctly.
2. Page splitting, with proper suspense boundaries and a budget on the **transitive** initial JS closure. The isolated experiment establishes a 65% gzip reduction opportunity; prove actual load improvements on the hosted deployment after implementation.
3. Compact reference manifests, lazy details, persistent worker search. Preserve all 438 Foes, 2,507 addressable foe objects, and 2,614 Rules records. Verify navigation history, deep links, search/filter fidelity, content-version transitions, and no main-thread index startup stall.
4. Table summary reads, independent subscriptions/prewarming, and deferred full sheets. Re-measure shell **and** log/detail readiness with real hero parties and combat. Preserve Director-only source and player health visibility.
5. Bounded history/correction work with dedicated history correctness tests and server metrics at increasing log sizes. Follow with broad invalidation and hidden-panel work.

Proposed regression budgets, to agree during implementation: warm library navigation below 100 ms; no unnecessary document navigation; warmed Rules search below 250 ms; no initial Foes indexing long task above 50 ms; initial JS below 200 KB gzip using this experiment's compressor. Cold-load time budgets should be tied to a declared network/CPU profile rather than this variable connection. These are proposed acceptance goals, not achieved results.

## Evidence

[Evidence index and raw measurements](build/evidence/performance-2026-09-19/README.md) contain the complete successful samples, sanitized subscription timings and asset headers, bundle experiment, and reproduction notes. The audit account cannot verify the user's supplied campaign until granted ordinary membership; no privileged access was attempted.
