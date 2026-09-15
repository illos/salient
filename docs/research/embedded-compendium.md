# Embedded Compendium investigation

Date: 2026-09-15. Research and proposed implementation approach; no wiki implementation or deployment.

The user wants the Markdown Compendium readable as an embedded wiki, with human-readable links from
the wizard and elsewhere in the app. Raw source paths, decision IDs and snapshot diagnostics remain
internal metadata. This investigation starts the previously deferred reference-library work; it does
not claim that the library is built or change which game mechanics are playable.

## Finding

We can generate an embedded reference library from the existing pinned dependency. The source already
provides individual entries, expanded sections, book order, titles and stable identifiers. The main
work is importing the complete intended corpus, resolving links, rendering Markdown and providing
navigation/search. A rules interpreter is not a dependency of reading the rules.

Keep the existing core-book scope as the working assumption. “Entire Compendium” could also mean the
official supplements, which the current specification excludes; that remains a scope clarification
before implementation, not a reason to limit this investigation.

## How Steel Compendium builds its website

The current site is generated with **MkDocs Material**, with custom JavaScript and styles. Its
`steel-etl site` generator prepares pages before MkDocs builds HTML. We inspected upstream website
commit `3628c5d47a06584ede1aa2c8c9d21f3dd74e505f` and generator commit
`c4e0526dd44fb8162a2949d58ceeb7f8e1632b71`. These are research checkouts, separate from our pinned
content; they are not evidence that every change is deployed on the live site.
[Website configuration](https://github.com/SteelCompendium/v2/blob/3628c5d47a06584ede1aa2c8c9d21f3dd74e505f/mkdocs.yml).

### Two views of the same content

- **Browse:** individual entries organized by type, with dedicated pages.
- **Books:** full sections in source order, with nested material included inline.
- **Bestiary:** a filtered view of creature records.

The site reads the **per-book `md-linked` trees**, including Heroes, Monsters, Beastheart and Summoner.
Its build configuration controls sections, book labels/order and which sections enter search.
[Site generator configuration](https://github.com/SteelCompendium/v2/blob/3628c5d47a06584ede1aa2c8c9d21f3dd74e505f/site.yaml).

The expanded Markdown is produced upstream by walking a section and its descendants in source order.
It carries heading attributes such as `data-scc`, connecting embedded sections to individual entries.
That lets a chapter include an ability while retaining a link to its dedicated page.
[Subtree renderer](https://github.com/SteelCompendium/steel-etl/blob/c4e0526dd44fb8162a2949d58ceeb7f8e1632b71/internal/content/render_subtree.go).

### Links and presentation

SCC identifiers give entries a stable identity independent of folder organization. The site generates
redirect pages for SCC URLs and keeps readable page URLs as canonical locations. Its generator also
rewrites Markdown links when placing entries into Browse and Books, and transforms eligible entries
into formatted cards that can appear inside larger pages.
[Permalink implementation](https://github.com/SteelCompendium/steel-etl/blob/c4e0526dd44fb8162a2949d58ceeb7f8e1632b71/internal/site/permalinks.go),
[site assembly and link rewriting](https://github.com/SteelCompendium/steel-etl/blob/c4e0526dd44fb8162a2949d58ceeb7f8e1632b71/internal/site/build.go).

### Search

The inspected website code uses a custom **MiniSearch worker** behind Material's search UI. Ranking
strongly favors exact names, requires all query terms and allows prefix matching on the last term.
Results are grouped by page. Read chapters are excluded from the website's search, and embedded cards
are excluded from their container's index contribution to reduce duplicate results.
[Search implementation](https://github.com/SteelCompendium/v2/blob/3628c5d47a06584ede1aa2c8c9d21f3dd74e505f/docs/javascripts/sc-search-core.js),
[search design record](https://github.com/SteelCompendium/v2/blob/3628c5d47a06584ede1aa2c8c9d21f3dd74e505f/.repo-docs/decisions/2026-09-06-custom-search-worker.md).

For our library, retain searchability of chapter-only prose while deduplicating entries repeated in
chapters. Copying the blanket chapter exclusion could hide useful introductory/contextual material.

## What our current pin contains

Measured from Git objects at `fb83a789da8f0327a389c277a0c790b1648d5810`, without changing the sparse
checkout or dependency pin. Counts are source files, not automated mechanics or a fidelity certification.

| Representation | Markdown files | Uncompressed bytes |
| --- | ---: | ---: |
| Unified `md` | 3,111 | 7,082,346 |
| Heroes `md` | 1,952 | 3,781,567 |
| Monsters `md` | 662 | 2,407,559 |
| Heroes `md-linked` | 1,952 | 7,643,569 |
| Monsters `md-linked` | 662 | 3,968,274 |
| Core expanded chapter pages, subset of `md-linked` | 20 | 4,384,705 |

The core per-book trees contain **2,614 distinct SCC entries**. The unified tree has 3,083 SCC entries
plus 28 index files. Our generated application snapshot contains **403 entries**.

Three import details matter:

1. **Unified is not sufficient for complete core chapters.** It lacks the Heroes SCC entries for
   Perks and Rewards, whose unified paths instead contain supplemental chapters. The core versions
   are present in the per-book trees.
2. **Ordinary `md` and `md-linked` have different content structure.** The expanded Background chapter
   includes the Languages in Orden table absent from its ordinary extracted counterpart. Use expanded
   sections for reading context; keep original SCC-linked entries for identity and precise references.
3. **Relative links need a resolver across books.** A lexical scan found 83 distinct `.md` targets that
   do not resolve if each `md-linked` book is treated as a self-contained folder. Many are Monsters
   links to Heroes rules. This is a routing/import concern, not evidence that 83 rules are missing.
   A separate scan of ordinary core `md` found 33,808 inline `scc.v1:` references; every scanned target
   SCC exists in the combined core entry set. This scan did not validate fragments, all Markdown link
   forms, or textual completeness.

Method: archive the relevant trees from the pinned Git commit in memory; count Markdown files/bytes;
read frontmatter SCC lines; compare IDs and scan inline link destinations. Book-specific files are
available through Git despite the sparse checkout. See [dependency access](../steel-compendium.md)
and [navigation caveats](../compendium-navigation.md).

## What the app already provides

- [Content generator](../../scripts/build-content.ts): reproducible selection of source entries with
  original Markdown, structured metadata and source revision.
- [Content identity contract](../../shared/contracts/content.ts): already uses source-qualified SCC IDs.
- [Content queries](../../convex/content.ts): individual entry reads, a capped per-kind listing and a
  development reseed operation. Reads currently require authentication; the reference spec calls for
  public reference access. The present listing/reseed shapes need review before corpus expansion.
- [Current source renderer](../../web/character-sheet/controls.tsx): a plain `<pre>` displaying raw
  text. It does not render Markdown or resolve its links.
- [Wizard source panel](../../web/wizard/index.tsx): maps paths to the small snapshot and exposes missing
  entries as implementation diagnostics.

The [reference specification](../reference-library-spec.md) and [V13 slice](../build/V13-reference-libraries.md)
already describe public Rules, Foes and Items references. Full-text reading and searchable coverage
remain separate from runtime automation.

## Proposed implementation

Build a **Compendium section within the existing React app**, sharing an article renderer and link
resolver with contextual rule panels in the wizard, sheets and table.

1. **Import and identity:** generate one catalog from the selected per-book sources at the existing pin.
   Preserve SCC identity, publication, title, type, order, source Markdown and expanded reading text.
   Associate representations by SCC; do not concatenate every format or merge by filename alone.
2. **Article rendering:** support headings, tables, lists, quotes and internal links. Parse frontmatter
   into metadata and consume upstream heading attributes so neither appears as visible syntax. Preserve
   rules text; use structured fields for presentation where needed without calculating new mechanics.
3. **Navigation:** category browsing plus Books in chapter order, breadcrumbs, section links and a table
   of contents. Give entries readable titles and shareable app URLs backed by SCC identity. Build explicit
   mappings for original SCC links and expanded relative links; report ambiguous/unresolved destinations.
4. **Search:** generate a title/body index with type and book filters. Load search on demand and perform
   browser indexing/search in a worker. Benchmark index size and responsiveness before choosing final
   delivery. Exact names should lead; chapter context should remain discoverable without duplicate hits.
5. **Contextual reading:** a small “Read rule” link opens the same formatted article in a side panel,
   with an option to open its full Compendium page. For this conversation's example, link to
   **Making a Hero → Think**. Give `class.choice` the UI heading **Class**; retain its ID internally.

Generated static article assets are a reasonable delivery candidate because reference text changes
with content releases, not table actions. Keep the catalog/revision shared with gameplay content and
avoid shipping all expanded books in the initial application bundle. Final static-versus-Convex
delivery should follow measured bundle/index costs and integration needs; no backend change is made here.

## First implementation acceptance

- All intended core entries and 20 expanded chapter pages are inventoried; chapter-only content is kept.
- Making a Hero renders the actual prompts, and Class is a readable heading.
- Wizard links and chapter cross-references navigate inside the app, including Monsters-to-Heroes links.
- Search finds exact names and chapter-only prose without repeated copies of the same entry.
- Reloading a direct article/section URL works; returning to character creation preserves its draft.
- No raw paths, decision IDs, frontmatter or snapshot diagnostics appear in the normal reading flow.
- Reference reads are public and independent of private campaign data. Original source/version metadata
  remains available for agents and attribution.
- Formatting and source completeness are checked against representative tables, long chapters, nested
  abilities and unclassified inline sections; successful rendering alone does not establish completeness.

Recommended first slice: complete corpus import, article routes/renderer, internal links and the wizard
integration; then category/book navigation and search to complete the wiki. Reuse the upstream content
representations and ideas while keeping application interaction in our existing UI.

## Stack fit and search recommendation

Follow-up, 2026-09-15: the user emphasized rendering an ID anywhere in the app, future quick popup
previews, and excellent search. “Astra” is interpreted here as Astro, the web framework. These are
technology recommendations, not an installation or an accepted framework migration.

### Recommended stack

| Responsibility | Recommendation |
| --- | --- |
| Upstream extraction | Consume the already-generated per-book Markdown at our pin. |
| App content build | Extend our TypeScript importer with identity/link maps, rendering preparation and search documents. |
| Display | Shared React components using the remark/rehype Markdown ecosystem. |
| Article URLs | Existing TanStack Router. Rendering by ID remains independent of routes. |
| Popup previews | Existing Base UI, whose installed package exports `preview-card`; add our shared object viewer inside it. |
| Public rules search | MiniSearch in a worker, loaded on demand, with application ranking and representative relevance checks. |

The upstream Go `steel-etl` extractor has already produced our source dependency. Running its MkDocs
site generator would produce a separate site presentation to integrate. Our additional build step
should prepare content for the existing React app. It need not re-extract the books or adopt the
upstream site's HTML, DOM enhancements and routing conventions.

Astro supports typed content collections and rendering local Markdown; it is a valid choice for
building a content-focused site. For this existing application, introducing its page/rendering layer
does not itself provide the common runtime object resolver needed by chat, sheets and inventory.
Keeping the existing React application is the recommended fit for those requirements.
[Astro content collections](https://docs.astro.build/en/guides/content-collections/).

React Markdown supports replacing rendered elements with custom React components. That allows a
Markdown link to become our object-reference control, with previews and app navigation. Prefer
preparing reusable content during the build and caching requested views rather than reparsing a full
chapter for each popup. The precise precompiled representation remains an implementation choice.
[React Markdown](https://github.com/remarkjs/react-markdown),
[Base UI Preview Card](https://base-ui.com/react/components/preview-card).

### One reference, multiple views

Illustrative component API, not implemented:

```tsx
<ObjectView reference={reference} mode="link" />
<ObjectView reference={reference} mode="preview" />
<ObjectView reference={reference} mode="card" />
<ObjectView reference={reference} mode="full" />
```

The reference carries its object kind and identity, with revision/section information when required.
All views use shared resolution. Individual renderers understand rules, item definitions or owned
instances; a universal reference need not force every object to become Markdown. A preview requests
bounded content on intent, reuses cached public content, and offers keyboard/click access as well as
pointer hover. Private-instance resolution uses authorized application reads; it does not enter a
public static cache or search index. Public content caches must distinguish revisions, and private
cached views must respect access changes. Avoid installing previews on every page link eagerly.

### Search quality plan

MiniSearch provides prefix/fuzzy matching, field boosting, suggestions and filtering in JavaScript.
It fits an initial browser-worker experiment over this corpus; actual memory, loading and query times
remain unmeasured. Its available features are building blocks, not a guarantee of useful ranking.
[MiniSearch documentation](https://lucaong.github.io/minisearch/).

Recommended relevance checks:

- Every unique exact entry name returns that entry first; same-name entries show source/type context.
- Partial names and a representative set of misspellings still find the intended entry near the top.
- Name matches outrank incidental mentions in large chapters, while chapter-only prose remains searchable.
- Equivalent embedded/standalone copies produce one useful result with an appropriate section link.
- Book/type filters apply consistently, with further filters derived from available structured metadata.
- Results show useful excerpts and open the matching entry/section through the shared reference model.
- Plain-language queries receive a separate evaluation set; curated aliases or semantic retrieval may
  help, but fuzzy name matching alone does not establish concept search.

Measure cold index download/setup, warm query latency and memory while the table remains active. Run
search work outside the UI thread and debounce/cancel stale requests. Keep the search result contract
independent of the engine so a measured relevance or resource problem can justify another backend
without changing object IDs or previews. Future private-object search must enforce its audience before
returning results; sharing a result type does not imply one public index for all app data.
