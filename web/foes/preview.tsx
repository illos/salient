// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react';
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
}: {
  catalog: FoeDetail;
  entries: FoesCatalog;
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
      <div className="ds-content" dangerouslySetInnerHTML={{ __html: object.html }} />
      {object.featureIds.map(id => {
        const feature = pack.objects.find(o => o.id === id)!;
        return (
          <section key={id} className="my-5 border-t border-border pt-4">
            <button
              className="text-sm font-medium text-primary underline underline-offset-4 mb-2"
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
          className="text-sm font-medium text-primary underline underline-offset-4 mt-4"
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
  return (
    <OverlayCardContent
      title={summary?.object.name ?? entry?.name ?? 'Rule reference'}
      eyebrow={`${summary?.band ?? 'Rules'} · source reference`}
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
        {object && pack ? (
          <FoeView
            catalog={pack}
            entries={entries}
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
