import { GlyphFontNotice } from '../components/glyph';
// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Menu,
  Search,
  X,
} from 'lucide-react';
import type {
  RuleArticle,
  RuleSummary,
  RulesCatalog,
  RulesSearchResult,
} from '../../shared/contracts/rules';
import { useRulesCatalog, getRuleExcerpts } from './content';
import { searchRules } from './search-client';
import { searchRuleTitles } from './search';
import { RuleArticleView } from './article';
import './rules.css';

export interface RulesFilters {
  q?: string;
  category?: string;
  book?: string;
}

function EntryLink({
  entry,
  children,
  className,
}: {
  entry: RuleSummary;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link to="/rules/$" params={{ _splat: entry.path }} search={{}} className={className}>
      {children ?? entry.name}
    </Link>
  );
}

function useSearch(catalog: RulesCatalog, filters: RulesFilters) {
  const [state, setState] = useState<{
    key: string;
    results?: RulesSearchResult[];
    error?: string;
  }>();
  const { q = '', category = '', book = '' } = filters;
  const key = JSON.stringify([catalog.version, q, category, book]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!q.trim()) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      void searchRules({ version: catalog.version, query: q, book, category }).then(
        results => {
          if (active) setState({ key, results });
        },
        error => {
          if (active) setState({ key, error: error.message });
        },
      );
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [q, category, book, key, catalog.version, attempt]);
  return { ...(state?.key === key ? state : {}), retry: () => setAttempt(n => n + 1) };
}

function Sidebar({
  catalog,
  filters,
  entry,
  close,
}: {
  catalog: RulesCatalog;
  filters: RulesFilters;
  entry?: RuleSummary;
  close: () => void;
}) {
  return (
    <nav
      className="rules-sidebar"
      aria-label="Rules navigation"
      onClick={event => {
        if ((event.target as Element).closest('a')) close();
      }}
    >
      <div className="rules-sidebar-heading">
        <BookOpen size={17} />
        <span>Chapters</span>
      </div>
      <Link
        to="/rules"
        search={{}}
        className={`rules-nav-link ${!entry && !filters.category && !filters.book && !filters.q ? 'is-active' : ''}`}
      >
        Overview <span>{catalog.entries.length.toLocaleString()}</span>
      </Link>
      <p className="rules-nav-label">Read the books</p>
      {catalog.books.map(book => (
        <details
          key={book.id}
          open={entry?.book === book.id || filters.book === book.id || undefined}
        >
          <summary>{book.name}</summary>
          <div className="rules-chapter-links">
            {catalog.entries
              .filter(e => e.kind === 'chapter' && e.book === book.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map(chapter => (
                <EntryLink
                  key={chapter.id}
                  entry={chapter}
                  className={`rules-nav-link ${entry?.id === chapter.id ? 'is-active' : ''}`}
                >
                  {chapter.name}
                </EntryLink>
              ))}
          </div>
        </details>
      ))}
      <p className="rules-nav-label">Browse by topic</p>
      {catalog.categories
        .filter(c => c.id !== 'chapter')
        .map(category => (
          <Link
            key={category.id}
            to="/rules"
            search={{ category: category.id }}
            className={`rules-nav-link ${filters.category === category.id || entry?.category === category.id ? 'is-active' : ''}`}
          >
            {category.name}
            <span>{category.count}</span>
          </Link>
        ))}
      <div className="rules-sidebar-note">Draw Steel rules, always within reach.</div>
    </nav>
  );
}

function Overview({ catalog }: { catalog: RulesCatalog }) {
  const featured = [
    'class',
    'ancestry',
    'ability',
    'condition',
    'kit',
    'statblock',
    'treasure',
    'rule',
  ];
  return (
    <>
      <div className="rules-intro">
        <h1>Rules</h1>
      </div>
      <div className="rules-section-title">
        <h2>Start with the books</h2>
        <span>Read in chapter order</span>
      </div>
      <div className="rules-books">
        {catalog.books.map((book, index) => {
          const first = catalog.entries
            .filter(e => e.kind === 'chapter' && e.book === book.id)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
          return (
            <EntryLink key={book.id} entry={first} className={`rules-book rules-book-${book.id}`}>
              <span className="rules-book-number">
                0{index + 1} / {book.id === 'beastheart' ? 'Supplemental' : 'Core book'}
              </span>
              <BookOpen size={30} strokeWidth={1.25} />
              <h3>{book.name}</h3>
              <p>{book.description}</p>
              <span className="rules-book-action">
                Open book <ArrowRight size={17} />
              </span>
            </EntryLink>
          );
        })}
      </div>
      <div className="rules-section-title">
        <h2>Explore the compendium</h2>
        <span>{catalog.entries.length.toLocaleString()} references</span>
      </div>
      <div className="rules-topic-grid">
        {featured
          .map(id => catalog.categories.find(c => c.id === id))
          .filter(c => c !== undefined)
          .map(category => (
            <Link
              key={category.id}
              to="/rules"
              search={{ category: category.id }}
              className="rules-topic"
            >
              <h3>{category.name}</h3>
              <span>
                {category.count} entries <ArrowRight size={15} />
              </span>
            </Link>
          ))}
      </div>
      <div className="rules-start">
        <h2>Making your first hero?</h2>
        <p>
          Start with a concept, then find the ancestry, class, and background that bring it to life.
        </p>
        <EntryLink
          entry={catalog.entries.find(e => e.id === 'mcdm.heroes.v1/chapter/making-a-hero')!}
        >
          Read Making a Hero <ArrowRight size={15} />
        </EntryLink>
      </div>
    </>
  );
}

function Listing({ catalog, filters }: { catalog: RulesCatalog; filters: RulesFilters }) {
  const [limit, setLimit] = useState(50);
  const results = useSearch(catalog, filters);
  const query = filters.q?.trim();
  const byId = useMemo(() => new Map(catalog.entries.map(e => [e.id, e])), [catalog]);
  const category = catalog.categories.find(c => c.id === filters.category);
  const entries = query
    ? (results.results ?? searchRuleTitles(catalog.entries, query, filters)).map(r => ({
        entry: byId.get(r.id)!,
        excerpt: r.excerpt,
      }))
    : catalog.entries
        .filter(
          e =>
            (!filters.category || e.category === filters.category) &&
            (!filters.book || e.book === filters.book),
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(entry => ({ entry, excerpt: entry.excerpt }));
  const [excerpts, setExcerpts] = useState<Record<string, string>>({});
  const visibleIds = entries
    .slice(0, limit)
    .map(e => e.entry.id)
    .join('|');
  useEffect(() => {
    if (query) return;
    let active = true;
    const ids = new Set(visibleIds.split('|'));
    void getRuleExcerpts(
      catalog,
      catalog.entries.filter(e => ids.has(e.id)),
    ).then(
      values => {
        if (active) setExcerpts(values);
      },
      () => {
        /* Titles and article links remain usable when optional snippets fail. */
      },
    );
    return () => {
      active = false;
    };
  }, [catalog, query, visibleIds]);
  return (
    <section className="rules-listing">
      <span className="rules-kicker">
        {query ? 'Search the compendium' : 'Browse the compendium'}
      </span>
      <h1>
        {query
          ? `Results for “${query}”`
          : (category?.name ??
            catalog.books.find(b => b.id === filters.book)?.name ??
            'All references')}
      </h1>
      <p className="rules-list-count" role="status">
        {query && !results.results && !results.error
          ? 'Searching full text…'
          : `${entries.length === 120 && query ? 'Top ' : ''}${entries.length} ${entries.length === 1 ? 'reference' : 'references'}`}
      </p>
      {results.error && (
        <p role="alert">
          {results.error} <button onClick={results.retry}>Try again</button>
        </p>
      )}
      {(!query || results?.results) && entries.length === 0 && (
        <div className="rules-empty">
          <Search size={30} />
          <h2>No matching references</h2>
          <p>Try fewer words, check the spelling, or clear a filter.</p>
          <Link to="/rules" search={{ q: filters.q }}>
            Search all topics and books
          </Link>
        </div>
      )}
      <div className="rules-results">
        {entries.slice(0, limit).map(({ entry, excerpt }) => (
          <EntryLink key={entry.id} entry={entry} className="rules-result">
            <div>
              <span className="rules-result-type">
                {catalog.categories.find(c => c.id === entry.category)?.name} ·{' '}
                {catalog.books.find(b => b.id === entry.book)?.name}
              </span>
              <h2>{entry.name}</h2>
              <p>{excerpt || excerpts[entry.id]}</p>
            </div>
            <ChevronRight size={19} />
          </EntryLink>
        ))}
      </div>
      {limit < entries.length && (
        <button className="rules-more" onClick={() => setLimit(limit + 50)}>
          Show more references
        </button>
      )}
    </section>
  );
}

function ArticlePage({ catalog, entry }: { catalog: RulesCatalog; entry: RuleSummary }) {
  const [article, setArticle] = useState<RuleArticle>();
  const [copied, setCopied] = useState(false);
  const [allSections, setAllSections] = useState(false);
  const loaded = useCallback((value: RuleArticle) => {
    setArticle(value);
    requestAnimationFrame(() => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (hash) document.getElementById(hash)?.scrollIntoView();
      else window.scrollTo({ top: 0 });
    });
  }, []);
  const book = catalog.books.find(b => b.id === entry.book)!;
  const chapters = catalog.entries
    .filter(e => e.book === entry.book && e.kind === 'chapter')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const chapterIndex = chapters.findIndex(e => e.id === entry.id);
  const headings = article?.id === entry.id ? article.headings : [];
  const toc = allSections ? headings : headings.filter(h => h.depth <= 3).slice(0, 90);
  return (
    <div className="rules-article-layout">
      <article className="rules-article">
        <div className="rules-breadcrumb">
          <Link to="/rules" search={{}}>
            Rules
          </Link>
          <ChevronRight size={12} />
          <Link to="/rules" search={{ book: book.id }}>
            {book.name}
          </Link>
          <ChevronRight size={12} />
          <span>{catalog.categories.find(c => c.id === entry.category)?.name}</span>
        </div>
        <header className="rules-article-header">
          <span className="rules-kicker">Draw Steel: {book.name}</span>
          <h1>{entry.name}</h1>
          <div className="rules-article-tools">
            <span>Rules reference · Resolve effects manually</span>
            <button
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href).then(
                  () => setCopied(true),
                  () => setCopied(false),
                );
              }}
            >
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>
        </header>
        <RuleArticleView catalog={catalog} entry={entry} onLoaded={loaded} />
        <footer className="rules-source">
          <span>Source: Draw Steel: {book.name}</span>
          <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">
            View on Steel Compendium <ExternalLink size={13} />
          </a>
        </footer>
        {chapterIndex >= 0 && (
          <nav className="rules-chapter-pagination" aria-label="Chapter navigation">
            {chapters[chapterIndex - 1] ? (
              <EntryLink entry={chapters[chapterIndex - 1]}>
                <ArrowLeft size={17} />
                <span>
                  <small>Previous chapter</small>
                  {chapters[chapterIndex - 1].name}
                </span>
              </EntryLink>
            ) : (
              <span />
            )}
            {chapters[chapterIndex + 1] && (
              <EntryLink entry={chapters[chapterIndex + 1]}>
                <span>
                  <small>Next chapter</small>
                  {chapters[chapterIndex + 1].name}
                </span>
                <ArrowRight size={17} />
              </EntryLink>
            )}
          </nav>
        )}
      </article>
      <aside className="rules-toc" aria-label="On this page">
        <h2>On this page</h2>
        <a href="#" onClick={() => window.scrollTo({ top: 0 })}>
          {entry.name}
        </a>
        {toc.map(h => (
          <a key={h.id} href={`#${h.id}`} className={h.depth > 2 ? 'rules-toc-nested' : ''}>
            {h.text}
          </a>
        ))}
        {!allSections && headings.length > toc.length && (
          <button onClick={() => setAllSections(true)}>
            Show all sections ({headings.length})
          </button>
        )}
      </aside>
    </div>
  );
}

export function RulesPage({ path, filters }: { path?: string; filters: RulesFilters }) {
  const { catalog, error, retry } = useRulesCatalog();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        input.current?.focus();
      }
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const update = (change: RulesFilters) => {
    void navigate({ to: '/rules', search: { ...filters, ...change }, replace: true });
  };
  const entry = catalog?.entries.find(e => e.path === path);
  const filtered = Boolean(filters.q || filters.book || filters.category);
  useEffect(() => {
    document.title = entry ? `${entry.name} · Salient Rules` : 'Rules Compendium · Salient';
  }, [entry]);
  if (error)
    return (
      <div className="rules-loading" role="alert">
        <h1>Rules are unavailable</h1>
        <p>{error}</p>
        <button onClick={retry}>Try again</button>
      </div>
    );
  if (!catalog)
    return (
      <div className="rules-loading" role="status">
        Opening the compendium…
      </div>
    );
  return (
    <div className="rules-app">
      <header className="rules-topbar">
        <div className="rules-search-box">
          <Search size={18} />
          <input
            ref={input}
            aria-label="Search rules"
            placeholder="Search rules, abilities, creatures…"
            value={filters.q ?? ''}
            onChange={e => update({ q: e.target.value })}
          />
          {filters.q ? (
            <button aria-label="Clear search" onClick={() => update({ q: '' })}>
              <X size={16} />
            </button>
          ) : (
            <kbd>⌘ / Ctrl K</kbd>
          )}
        </div>
        <button
          className="rules-menu"
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>
      <div className={`rules-layout ${sidebarOpen ? 'rules-nav-open' : ''}`}>
        <Sidebar
          catalog={catalog}
          filters={filters}
          entry={entry}
          close={() => setSidebarOpen(false)}
        />
        <main className="rules-main" id="rules-main">
          {!entry && filtered && (
            <div className="rules-filters">
              <label>
                Book
                <select
                  aria-label="Filter by book"
                  value={filters.book ?? ''}
                  onChange={e => update({ book: e.target.value })}
                >
                  <option value="">All books</option>
                  {catalog.books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Topic
                <select
                  aria-label="Filter by topic"
                  value={filters.category ?? ''}
                  onChange={e => update({ category: e.target.value })}
                >
                  <option value="">All topics</option>
                  {catalog.categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <Link to="/rules" search={{}}>
                Clear filters
              </Link>
            </div>
          )}
          {path ? (
            entry ? (
              <ArticlePage key={entry.id} catalog={catalog} entry={entry} />
            ) : (
              <div className="rules-empty">
                <h1>Reference not found</h1>
                <p>This address does not match an entry in this compendium.</p>
                <Link to="/rules" search={{}}>
                  Browse all rules
                </Link>
              </div>
            )
          ) : filtered ? (
            <Listing catalog={catalog} filters={filters} />
          ) : (
            <Overview catalog={catalog} />
          )}
          <footer className="rules-attribution">
            Salient is an independent product published under the{' '}
            <a
              href="https://www.mcdmproductions.com/draw-steel-creator-license"
              target="_blank"
              rel="noopener noreferrer"
            >
              DRAW STEEL Creator License
            </a>{' '}
            and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2026 MCDM Productions,
            LLC.
            <br />
            Rules text prepared by{' '}
            <a href="https://steelcompendium.io/v2/" target="_blank" rel="noopener noreferrer">
              Steel Compendium
            </a>
            .<br />
            <GlyphFontNotice />
          </footer>
        </main>
      </div>
    </div>
  );
}
