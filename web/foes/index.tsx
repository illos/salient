import { GlyphFontNotice } from '../components/glyph';
// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, ChevronRight, Search, Skull, X } from 'lucide-react';
import { bandOf, bookOf, createFoesLibrary, type LibraryEntry } from './library';
import { kinds, sorts, type FoesFilters } from './filters';
import { SourceHtml } from '../components/core-content';
import { Dialog } from '@base-ui/react/dialog';
import type {
  FoeDisplayObject as FoeObject,
  FoeDisplayPackage as FoePackage,
} from '../../shared/contracts/foes';
import rawData from '../../shared/content/foes/browser.json?raw';
import { foeReference, resolveFoe } from '../../shared/foes/catalog';
import { OverlayCardContent, OverlayCardTrigger } from '../components/overlay-card';
import { useRulesCatalog } from '../rules/content';
import { RuleArticleView } from '../rules/article';
import { ThemeSwitch } from '../components/session-user';
import '../rules/rules.css';
import '../rules/reference.css';
import './foes.css';
const pack = JSON.parse(rawData) as FoePackage;
const library = createFoesLibrary(pack);
const statblocks = library.entries.filter(e => e.object.kind === 'statblock');
const bands = [...new Set(statblocks.map(e => e.band))].sort();
/** This same public object renderer can be used by a future chat attachment or inline card. */
export function FoeView({
  catalog: pack,
  object,
  onFollow,
  onRule,
}: {
  catalog: FoePackage;
  object: FoeObject;
  onFollow: (id: string) => void;
  onRule?: (path: string) => void;
}) {
  const parent = pack.objects.find(o => o.id === object.parentId);
  return (
    <article>
      {parent && (
        <button
          className="text-sm font-medium text-primary underline underline-offset-4 mb-4"
          onClick={() => onFollow(parent.id)}
        >
          From {parent.name}
        </button>
      )}
      <SourceHtml
        html={object.html}
        title={object.kind === 'statblock' ? object.name : undefined}
      />
      {object.featureIds.map(id => {
        const feature = resolveFoe(pack, foeReference(pack, id))!.object;
        return (
          <section key={id} className="my-5 border-t border-border pt-4">
            <button
              className="text-sm font-medium text-primary underline underline-offset-4 mb-2"
              onClick={() => onFollow(id)}
            >
              Open {feature.name}
            </button>
            <SourceHtml html={feature.html} />
          </section>
        );
      })}
      {object.supportingIds.map(id => (
        <button
          key={id}
          className="text-sm font-medium text-primary underline underline-offset-4 mt-4"
          onClick={() => onFollow(id)}
        >
          {pack.objects.find(o => o.id === id)?.name ?? 'Related reference'}
        </button>
      ))}
      {Boolean(object.relatedRules?.length) && (
        <nav className="foes-related-rules" aria-label="Related rules">
          <h3>Related rules</h3>
          {object.relatedRules?.map(rule => (
            <a
              key={rule.id}
              href={`/rules/${rule.path}`}
              onClick={event => {
                if (
                  onRule &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.shiftKey &&
                  !event.altKey &&
                  event.button === 0
                ) {
                  event.preventDefault();
                  onRule(rule.path);
                }
              }}
            >
              {rule.name}
              <small>{rule.relationship.replaceAll('-', ' ')}</small>
            </a>
          ))}
        </nav>
      )}
      {object.diagnostics.map(d => (
        <p role="status" key={d}>
          {d}
        </p>
      ))}
      <footer className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
        <a href={`https://steelcompendium.io/v2/scc/${object.source.scc}/`}>
          View source on Steel Compendium
        </a>
        <p>Draw Steel: {bookOf(object)} · Draw Steel Creator License</p>
      </footer>
    </article>
  );
}
type PreviewLocation = { foe: string } | { path: string; section?: string };
function FoePreview({ initial }: { initial: string }) {
  const [history, setHistory] = useState<PreviewLocation[]>([{ foe: initial }]);
  const { catalog, error } = useRulesCatalog();
  const current = history.at(-1)!;
  const object =
    'foe' in current ? resolveFoe(pack, foeReference(pack, current.foe))!.object : undefined;
  const entry = 'path' in current ? catalog?.entries.find(e => e.path === current.path) : undefined;
  return (
    <OverlayCardContent
      title={object?.name ?? entry?.name ?? 'Rule reference'}
      eyebrow={`${object ? bandOf(object) : 'Rules'} · source reference`}
      closeLabel="Close foe reference"
      bodyKey={JSON.stringify(current)}
      leading={
        history.length > 1 ? (
          <button
            className="text-sm font-medium text-primary underline underline-offset-4"
            onClick={() => setHistory(h => h.slice(0, -1))}
          >
            Back
          </button>
        ) : undefined
      }
    >
      <div
        onClick={event => {
          if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0
          )
            return;
          const href = (event.target as Element).closest('a')?.getAttribute('href');
          if (href?.startsWith('/rules/')) {
            event.preventDefault();
            const [path, section] = href.slice(7).split('#');
            setHistory(h => [...h, { path, section }]);
          }
        }}
      >
        {object ? (
          <FoeView
            catalog={pack}
            object={object}
            onFollow={foe => setHistory(h => [...h, { foe }])}
            onRule={path => setHistory(h => [...h, { path }])}
          />
        ) : catalog && entry ? (
          <RuleArticleView
            catalog={catalog}
            entry={entry}
            section={'section' in current ? current.section : undefined}
            onFollow={(path, section) => setHistory(h => [...h, { path, section }])}
          />
        ) : (
          <p role="status">
            {error || (catalog ? 'This reference is unavailable.' : 'Opening reference…')}
          </p>
        )}
      </div>
    </OverlayCardContent>
  );
}
function FoeResult({ entry }: { entry: LibraryEntry }) {
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
      {open && <FoePreview initial={object.id} />}
    </Dialog.Root>
  );
}
function Results({ results }: { results: LibraryEntry[] }) {
  const [limit, setLimit] = useState(40);
  return (
    <>
      <div className="foes-results">
        {results.slice(0, limit).map(entry => (
          <FoeResult key={entry.object.id} entry={entry} />
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
  const results = library.search(filters);
  const keywordEntries = library.entries.filter(
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
        <a href="/" className="rules-wordmark">
          Salient<span> / Foes</span>
        </a>
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
        <a href="/rules" className="foes-rules-link">
          Rules index <ArrowRight size={15} />
        </a>
        <ThemeSwitch />
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
                {[...new Set(library.entries.map(e => e.book))].sort().map(book => (
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
                  {[...new Set(pack.search.flatMap(e => (e.usage ? [e.usage] : [])))]
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
              {results.length}{' '}
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
          {results.length ? (
            <Results key={JSON.stringify(filters)} results={results} />
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
