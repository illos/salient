import { GlyphFontNotice } from '../components/glyph';
// SPDX-License-Identifier: GPL-3.0-only
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronRight, Search, Skull, X } from 'lucide-react';
import { filterFoes, type LibraryEntry } from './library';
import { kinds, sorts, type FoesFilters } from './filters';
import { Dialog } from '@base-ui/react/dialog';
import { OverlayCardContent, OverlayCardTrigger } from '../components/overlay-card';
import { useFoesCatalog, type FoesCatalog } from './content';
import { useFoesSearch } from './search-client';
import '../rules/rules.css';
import '../rules/reference.css';
import './foes.css';
const FoePreview = lazy(() => import('./preview'));
function FoeResult({ entry, catalog }: { entry: LibraryEntry; catalog: FoesCatalog }) {
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const { object, band, level, role, organization, parentName } = entry;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <OverlayCardTrigger
        className="foes-result"
        data-foe-id={object.id}
        aria-describedby={`${descriptionId}-type ${descriptionId}-level ${descriptionId}-role ${descriptionId}-ev`}
        aria-label={`Open ${object.name}${parentName ? ` · ${parentName}` : ''}`}
      >
        <span className="foes-result-identity">
          <span className="rules-result-type" id={`${descriptionId}-type`}>
            {band}
            {parentName ? ` · ${parentName}` : ''} ·{' '}
            {object.kind === 'statblock' ? 'Stat block' : object.kind}
          </span>
          <span className="foes-result-name">{object.name}</span>
          <span className="foes-result-keywords">
            {object.keywords.join(' · ') || object.usage || 'Source reference'}
          </span>
        </span>
        <span className="foes-result-level" id={`${descriptionId}-level`}>
          {level ? (
            <>
              <small>Level</small>
              {level}
            </>
          ) : (
            '—'
          )}
        </span>
        <span className="foes-result-role" id={`${descriptionId}-role`}>
          {organization || '—'}
          <small>{role || object.usage}</small>
        </span>
        <span className="foes-result-ev" id={`${descriptionId}-ev`}>
          <small>EV</small>
          {entry.evPrinted || '—'}
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </OverlayCardTrigger>
      {open && (
        <Suspense
          fallback={
            <OverlayCardContent title={object.name} closeLabel="Close foe reference">
              <p role="status">Opening reference…</p>
            </OverlayCardContent>
          }
        >
          <FoePreview initial={object.id} entries={catalog} />
        </Suspense>
      )}
    </Dialog.Root>
  );
}
function Results({ results, catalog }: { results: LibraryEntry[]; catalog: FoesCatalog }) {
  const [limit, setLimit] = useState(40);
  return (
    <>
      <div className="foes-results">
        {results.slice(0, limit).map(entry => (
          <FoeResult key={entry.object.id} entry={entry} catalog={catalog} />
        ))}
      </div>
      {limit < results.length && (
        <button className="rules-more" onClick={() => setLimit(n => n + 40)}>
          Show more references ({results.length - limit} remaining)
        </button>
      )}
    </>
  );
}
export default function FoesPage({ filters }: { filters: FoesFilters }) {
  const { catalog, error, retry } = useFoesCatalog();
  return catalog ? (
    <FoesLibrary filters={filters} catalog={catalog} />
  ) : (
    <main className="p-8" role="status">
      {error ?? 'Opening foes…'}
      {error && <button onClick={retry}>Try again</button>}
    </main>
  );
}
function FoesLibrary({ filters, catalog }: { filters: FoesFilters; catalog: FoesCatalog }) {
  const statblocks = catalog.entries.filter(e => e.object.kind === 'statblock');
  const bands = [...new Set(statblocks.map(e => e.band))].sort();
  const search = useFoesSearch(catalog.version, filters.q ?? '');
  const searching = Boolean(filters.q?.trim() && !search.scores);

  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const update = (change: FoesFilters) => {
    void navigate({ to: '/foes', search: { ...filters, ...change }, replace: true });
  };
  useEffect(() => {
    document.title = 'Foes Library · Salient';
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const results = filterFoes(catalog.entries, filters, search.scores);
  const keywordEntries = catalog.entries.filter(
    e => (filters.kind ?? 'statblock') === 'all' || e.object.kind === (filters.kind ?? 'statblock'),
  );
  const keywords = [...new Set(keywordEntries.flatMap(e => e.object.keywords))].sort();
  const options = (key: 'level' | 'role' | 'organization') =>
    [...new Set(statblocks.map(e => e[key]).filter(Boolean))].sort((a, b) =>
      key === 'level' ? Number(a) - Number(b) : a.localeCompare(b),
    );
  const active = Object.entries(filters).filter(
    ([key, value]) => value && !['kind', 'sort'].includes(key),
  );
  const reset = () => {
    void navigate({
      to: '/foes',
      search: { kind: filters.kind, sort: filters.sort },
      replace: true,
    });
  };
  return (
    <div className="rules-app foes-app">
      <header className="rules-topbar">
        <div className="rules-search-box">
          <Search size={18} aria-hidden="true" />
          <input
            ref={input}
            aria-label="Search foes"
            placeholder="Search names, abilities, keywords…"
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
      </header>
      <div className="rules-layout">
        <aside className="rules-sidebar foes-sidebar" aria-label="Browse monster bands">
          <div className="rules-sidebar-heading">
            <Skull size={18} />
            <span>Foes library</span>
          </div>
          <button
            className={`rules-nav-link ${!filters.band ? 'is-active' : ''}`}
            onClick={() => update({ band: '' })}
            aria-pressed={!filters.band}
          >
            All bands <span>{statblocks.length}</span>
          </button>
          <p className="rules-nav-label">Monster bands</p>
          {bands.map(band => (
            <button
              key={band}
              className={`rules-nav-link ${filters.band === band ? 'is-active' : ''}`}
              aria-pressed={filters.band === band}
              onClick={() => update({ band })}
            >
              {band}
              <span>{statblocks.filter(e => e.band === band).length}</span>
            </button>
          ))}
          <p className="rules-sidebar-note">
            Stat blocks, abilities, traits, and Malice.
            <br />
            Draw Steel, ready to reference.
          </p>
        </aside>
        <main className="rules-main foes-main">
          <div className="rules-intro foes-intro">
            <span className="rules-kicker">The Draw Steel Compendium</span>
            <h1>Foes library</h1>
            <p>
              Find the creatures for your next encounter.
              <br />
              Explore stat blocks, abilities, and the rules that bring them to life.
            </p>
          </div>
          <div className="foes-kind-tabs" role="group" aria-label="Reference kind">
            {Object.entries({ ...kinds, all: 'All references' }).map(([kind, label]) => (
              <button
                key={kind}
                aria-pressed={(filters.kind ?? 'statblock') === kind}
                onClick={() => update({ kind: kind as FoesFilters['kind'] })}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="foes-filters">
            <label>
              Band
              <select value={filters.band ?? ''} onChange={e => update({ band: e.target.value })}>
                <option value="">All bands</option>
                {bands.map(b => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            {(['level', 'role', 'organization'] as const).map(key => (
              <label key={key}>
                {key[0].toUpperCase() + key.slice(1)}
                <select
                  value={filters[key] ?? ''}
                  onChange={e => update({ [key]: e.target.value })}
                >
                  <option value="">
                    {key === 'level'
                      ? 'All levels'
                      : key === 'role'
                        ? 'All roles'
                        : 'All organizations'}
                  </option>
                  {options(key).map(value => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Sourcebook
              <select value={filters.book ?? ''} onChange={e => update({ book: e.target.value })}>
                <option value="">All books</option>
                {[...new Set(catalog.entries.map(e => e.book))].sort().map(book => (
                  <option key={book}>{book}</option>
                ))}
              </select>
            </label>
            <label>
              Keyword
              <select
                value={filters.keyword ?? ''}
                onChange={e => update({ keyword: e.target.value })}
              >
                <option value="">All keywords</option>
                {keywords.map(k => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            {(filters.kind === 'ability' || filters.kind === 'all' || filters.usage) && (
              <label>
                Usage
                <select
                  value={filters.usage ?? ''}
                  onChange={e => update({ usage: e.target.value })}
                >
                  <option value="">All usages</option>
                  {[
                    ...new Set(
                      catalog.entries.flatMap(e => (e.object.usage ? [e.object.usage] : [])),
                    ),
                  ]
                    .sort()
                    .map(k => (
                      <option key={k}>{k}</option>
                    ))}
                </select>
              </label>
            )}
          </div>
          {active.length > 0 && (
            <div className="foes-active-filters" aria-label="Active filters">
              {active.map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => update({ [key]: '' })}
                  aria-label={`Remove ${key} filter: ${value}`}
                >
                  {key}: {value}
                  <X size={12} />
                </button>
              ))}
              <button className="foes-clear" onClick={reset}>
                Clear filters
              </button>
            </div>
          )}
          <div className="foes-results-toolbar">
            <p role="status">
              {searching ? 'Searching…' : results.length}{' '}
              {filters.kind === 'statblock' || !filters.kind
                ? results.length === 1
                  ? 'stat block'
                  : 'stat blocks'
                : results.length === 1
                  ? 'reference'
                  : 'references'}
              {filters.band ? ` · ${filters.band}` : ''}
            </p>
            <label>
              Sort by
              <select
                value={filters.sort ?? (filters.q ? 'relevance' : 'name')}
                onChange={e => update({ sort: e.target.value as FoesFilters['sort'] })}
              >
                {Object.entries(sorts).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {searching ? (
            <div role={search.error ? 'alert' : undefined}>
              {search.error ?? 'Searching references…'}
              {search.error && <button onClick={search.retry}>Try again</button>}
            </div>
          ) : results.length ? (
            <Results key={JSON.stringify(filters)} results={results} catalog={catalog} />
          ) : (
            <div className="rules-empty">
              <Search size={30} />
              <h2>No matching foes</h2>
              <p>Try another name or remove a filter to broaden your search.</p>
              <button className="foes-reset" onClick={reset}>
                Clear filters
              </button>
            </div>
          )}
          <footer className="rules-attribution">
            <p>Reference library · Resolve effects manually at the table.</p>
            Salient is an independent product published under the{' '}
            <a href="https://www.mcdmproductions.com/draw-steel-creator-license">
              DRAW STEEL Creator License
            </a>{' '}
            and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2026 MCDM Productions,
            LLC. Text prepared by Steel Compendium.
            <br />
            <GlyphFontNotice />
          </footer>
        </main>
      </div>
    </div>
  );
}
