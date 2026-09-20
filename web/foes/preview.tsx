// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react';
import { cn } from 'cn';
import type { FoeDisplayObject as FoeObject } from '../../shared/contracts/foes';
import { bookOf } from './library';
import { getFoeDetail, type FoeDetail, type FoesCatalog } from './content';
import { OverlayCardContent } from '../components/overlay-card';
import { useRulesCatalog } from '../rules/content';
import { RuleArticleView } from '../rules/article';
import '../components/core-content.css';
/** This same public object renderer can be used by a future chat attachment or inline card. */
export function FoeView({
  catalog: pack,
  object,
  entries,
  onFollow,
  onRule,
  flush,
  hideParent,
}: {
  catalog: FoeDetail;
  entries: FoesCatalog;
  object: FoeObject;
  onFollow: (id: string) => void;
  onRule?: (path: string) => void;
  /** The stat block fills an overlay panel edge to edge; everything else keeps the panel padding. */
  flush?: boolean;
  /** The pop-up shows the parent control in its own header row; do not repeat it here. */
  hideParent?: boolean;
}) {
  const parent = hideParent ? undefined : pack.objects.find(o => o.id === object.parentId);
  return (
    <article>
      {parent && (
        <div className={cn(flush && 'px-6 pt-6')}>
          <button
            className="inline-flex h-8 items-center rounded-full bg-muted px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground mb-4"
            onClick={() => onFollow(parent.id)}
          >
            From {parent.name}
          </button>
        </div>
      )}
      <div
        className={cn('ds-content', flush && 'foe-statblock-flush')}
        dangerouslySetInnerHTML={{ __html: object.html }}
      />
      <div className={cn(flush && 'px-6 pb-2')}>
        {object.featureIds.map(id => {
          const feature = pack.objects.find(o => o.id === id)!;
          return (
            <section key={id} className="my-5 border-t border-border pt-4">
              <button
                className="inline-flex h-8 items-center rounded-full bg-muted px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground mb-2"
                onClick={() => onFollow(id)}
              >
                Open {feature.name}
              </button>
              <div className="ds-content" dangerouslySetInnerHTML={{ __html: feature.html }} />
            </section>
          );
        })}
        {object.supportingIds.map(id => (
          <button
            key={id}
            className="inline-flex h-8 items-center rounded-full bg-muted px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground mt-4 mr-2"
            onClick={() => onFollow(id)}
          >
            {entries.entries.find(e => e.object.id === id)?.object.name ?? 'Related reference'}
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
        <footer className="mt-6 pt-4 text-sm text-muted-foreground">
          <a href={`https://steelcompendium.io/v2/scc/${object.source.scc}/`}>
            View source on Steel Compendium
          </a>
          <p>Draw Steel: {bookOf(object)} · Draw Steel Creator License</p>
        </footer>
      </div>
    </article>
  );
}
type PreviewLocation = { foe: string } | { path: string; section?: string };
export default function FoePreview({
  initial,
  entries,
}: {
  initial: string;
  entries: FoesCatalog;
}) {
  const [history, setHistory] = useState<PreviewLocation[]>([{ foe: initial }]);
  const current = history.at(-1)!;
  const { catalog, error, retry: retryRules } = useRulesCatalog('path' in current);
  const id = 'foe' in current ? current.foe : undefined;
  const [loaded, setLoaded] = useState<{ id: string; pack?: FoeDetail; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!id) return;
    let active = true;
    void getFoeDetail(entries, id).then(
      pack => {
        if (active) setLoaded({ id, pack });
      },
      error => {
        if (active) setLoaded({ id, error: error.message });
      },
    );
    return () => {
      active = false;
    };
  }, [entries, id, attempt]);
  const pack = loaded?.id === id ? loaded?.pack : undefined;
  const detailError = loaded?.id === id ? loaded?.error : undefined;
  const object = pack?.objects.find(o => o.id === id);
  const summary = entries.entries.find(e => e.object.id === id);
  const entry = 'path' in current ? catalog?.entries.find(e => e.path === current.path) : undefined;
  // A stat block prints its own name, ancestry line and level/role line in its title band, so the
  // panel drops its header and the card fills it edge to edge. Abilities, traits, Malice features
  // and rules opened inside the same card keep the ordinary header: they have no band to run to
  // the edges, and their own controls would collide with floating ones.
  const statBlock = Boolean(object && pack) && object?.kind === 'statblock';
  // One navigation control beside Close. "From <parent>" returns to the parent card: it pops the
  // history when the parent is the previous card, and opens the parent when the card was reached
  // directly. "Back" appears only when the previous card is something other than the parent.
  const parent = object?.parentId ? pack?.objects.find(o => o.id === object.parentId) : undefined;
  const previous = history.at(-2);
  const previousIsParent =
    previous !== undefined &&
    'foe' in previous &&
    parent !== undefined &&
    previous.foe === parent.id;
  const pill =
    'inline-flex h-8 items-center rounded-full bg-muted px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground';
  const navigation = (
    <>
      {history.length > 1 && !previousIsParent && (
        <button className={pill} onClick={() => setHistory(h => h.slice(0, -1))}>
          Back
        </button>
      )}
      {parent && (
        <button
          className={pill}
          onClick={() =>
            setHistory(h => (previousIsParent ? h.slice(0, -1) : [...h, { foe: parent.id }]))
          }
        >
          From {parent.name}
        </button>
      )}
    </>
  );
  const book = entry && catalog ? catalog.books.find(b => b.id === entry.book)?.name : undefined;
  return (
    <OverlayCardContent
      title={summary?.object.name ?? entry?.name ?? 'Rule reference'}
      closeLabel="Close foe reference"
      bodyKey={JSON.stringify(current)}
      flush={statBlock}
      // An ability, trait or Malice card prints its own name; only a rule needs the header title.
      hideTitle={Boolean(object && pack)}
      leading={navigation}
      // Source references sit at the bottom of a card: a foe card prints its own source footer;
      // a rule opened here gets its book line below the article.
      footer={entry && !object ? `Draw Steel: ${book ?? 'Rules'}` : undefined}
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
        {object && pack ? (
          <FoeView
            catalog={pack}
            entries={entries}
            object={object}
            flush={statBlock}
            hideParent
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
          <div role="status">
            {id
              ? (detailError ?? 'Opening reference…')
              : (error ?? (catalog ? 'This reference is unavailable.' : 'Opening reference…'))}
            {(id ? detailError : error) && (
              <button
                onClick={() => {
                  setAttempt(n => n + 1);
                  retryRules();
                }}
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </OverlayCardContent>
  );
}
