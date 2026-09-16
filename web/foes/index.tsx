import { GlyphFontNotice } from '../components/glyph';
// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import { SourceHtml } from '../components/core-content';
import { Dialog } from '@base-ui/react/dialog';
import type { FoeKind, FoeObject, FoePackage, FoeSearchEntry } from '../../shared/contracts/foes';
import data from '../../shared/content/foes/catalog.json';
import { foeReference, resolveFoe, searchFoes } from '../../shared/foes/catalog';
import { OverlayCardContent, OverlayCardTrigger } from '../components/overlay-card';
import { useRulesCatalog } from '../rules/content';
import { RuleArticleView } from '../rules/article';
import { ThemeSwitch } from '../components/session-user';
import '../rules/rules.css';
import '../rules/reference.css';
const pack = data as unknown as FoePackage;
/** This same public object renderer can be used by a future chat attachment or inline card. */
export function FoeView({
  catalog: pack,
  object,
  onFollow,
}: {
  catalog: FoePackage;
  object: FoeObject;
  onFollow: (id: string) => void;
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
          {resolveFoe(pack, foeReference(pack, id))!.object.name}
        </button>
      ))}
      {object.diagnostics.map(d => (
        <p role="status" key={d}>
          {d}
        </p>
      ))}
      <footer className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
        <a href={`https://steelcompendium.io/v2/scc/${object.source.scc}/`}>
          View source on Steel Compendium
        </a>
        <p>Draw Steel: Monsters · Draw Steel Creator License</p>
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
      eyebrow="Undead · source reference"
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
function FoeResult({ result }: { result: FoeSearchEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <OverlayCardTrigger className="rounded border border-border bg-card p-5 text-left hover:border-primary">
        <span className="block text-xs text-muted-foreground">
          {result.parentName || 'Undead'} · {result.kind}
        </span>
        <span className="block text-lg font-semibold">{result.name}</span>
        {result.usage && <span className="text-sm text-muted-foreground">{result.usage}</span>}
      </OverlayCardTrigger>
      {open && <FoePreview initial={result.id} />}
    </Dialog.Root>
  );
}
export default function FoesPage() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<FoeKind | ''>('');
  const [keyword, setKeyword] = useState('');
  const [usage, setUsage] = useState('');
  const results = searchFoes(pack, query, {
    kind: kind || undefined,
    keyword: keyword || undefined,
    usage: usage || undefined,
  });
  return (
    <main className="foes-reference-page mx-auto max-w-6xl px-8 py-10">
      <header className="mb-10 flex items-center justify-between border-b border-border pb-5">
        <a href="/rules" className="text-xl font-bold">
          Salient / References
        </a>
        <ThemeSwitch />
      </header>
      <p className="eyebrow">Foes · Undead</p>
      <h1 className="mb-3 text-4xl font-bold">The restless dead</h1>
      <p className="mb-8 text-muted-foreground">
        Explore {pack.objects.filter(o => o.kind === 'statblock').length} stat blocks, their
        abilities and traits, and shared Undead Malice.
      </p>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <label>
          Search undead
          <input
            className="mt-1 w-full rounded border border-input bg-background p-2"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
        <label>
          Kind
          <select
            className="mt-1 w-full rounded border border-input bg-background p-2"
            value={kind}
            onChange={e => setKind(e.target.value as FoeKind | '')}
          >
            <option value="">All kinds</option>
            {['statblock', 'ability', 'trait', 'malice'].map(k => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label>
          Keyword
          <select
            className="mt-1 w-full rounded border border-input bg-background p-2"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          >
            <option value="">All keywords</option>
            {[...new Set(pack.search.flatMap(e => e.keywords))].sort().map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Usage
          <select
            className="mt-1 w-full rounded border border-input bg-background p-2"
            value={usage}
            onChange={e => setUsage(e.target.value)}
          >
            <option value="">All usages</option>
            {[...new Set(pack.search.flatMap(e => (e.usage ? [e.usage] : [])))].sort().map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>
      <p role="status" className="mb-4 text-sm text-muted-foreground">
        {results.length} references
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {results.map(result => (
          <FoeResult key={result.id} result={result} />
        ))}
      </div>
      {!results.length && <p>No matching references. Try another search or filter.</p>}
      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        Salient is an independent product published under the{' '}
        <a href="https://www.mcdmproductions.com/draw-steel-creator-license">
          DRAW STEEL Creator License
        </a>{' '}
        and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2026 MCDM Productions, LLC.
        Text prepared by Steel Compendium.
        <br />
        <GlyphFontNotice />
      </footer>
    </main>
  );
}
