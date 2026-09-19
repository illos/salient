// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { RuleArticle, RuleSummary, RulesCatalog } from '../../shared/contracts/rules';
import { getRuleArticle, getRulePart } from './content';
import './rules.css';

export function RuleArticleView({
  catalog,
  entry,
  onLoaded,
  onFollow,
  section,
}: {
  catalog: RulesCatalog;
  entry: RuleSummary;
  onLoaded?: (article: RuleArticle) => void;
  onFollow?: (path: string, section?: string) => void;
  section?: string;
}) {
  const [state, setState] = useState<{ id: string; article?: RuleArticle; error?: string }>();
  const navigate = useNavigate();
  const hash = useRouterState({ select: state => state.location.hash });
  const targetSection = section ?? (onFollow ? undefined : hash);
  const [parts, setParts] = useState<{
    id: string;
    html: Record<string, string>;
    error?: string;
  }>();
  const [partAttempt, setPartAttempt] = useState(0);
  const keepSectionInView = useRef(true);
  useLayoutEffect(() => {
    keepSectionInView.current = true;
  }, [entry.id, targetSection]);
  useEffect(() => {
    // Streaming may insert earlier sections above an anchor. Retain it until the reader takes control.
    const release = () => {
      keepSectionInView.current = false;
    };
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    for (const event of events)
      window.addEventListener(event, release, { capture: true, passive: true });
    return () => {
      for (const event of events) window.removeEventListener(event, release, true);
    };
  }, []);
  const prose = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  useLayoutEffect(() => {
    if (!state?.article || state.id !== entry.id || !targetSection || !keepSectionInView.current)
      return;
    const target = Array.from(prose.current?.querySelectorAll('[id]') ?? []).find(
      el => el.id === decodeURIComponent(targetSection),
    );
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
  }, [state, parts, entry.id, targetSection]);
  useEffect(() => {
    let active = true;
    getRuleArticle(catalog, entry).then(
      article => {
        if (active) {
          setState({ id: entry.id, article });
          onLoaded?.(article);
        }
      },
      error => {
        if (active) setState({ id: entry.id, error: String(error.message) });
      },
    );
    return () => {
      active = false;
    };
  }, [catalog, entry, onLoaded, attempt]);
  const article = state?.id === entry.id ? state.article : undefined;
  useEffect(() => {
    if (!article?.parts?.length) return;
    let active = true;
    // Prioritize an anchored section; then stream a few independent parts at a time.
    const queue = [...article.parts].sort(
      (a, b) =>
        Number(Boolean(targetSection && b.ids.includes(decodeURIComponent(targetSection)))) -
        Number(Boolean(targetSection && a.ids.includes(decodeURIComponent(targetSection)))),
    );
    async function next() {
      while (active && queue.length) {
        const part = queue.shift()!;
        try {
          const value = await getRulePart(catalog, part.file);
          if (active)
            setParts(previous => ({
              id: entry.id,
              html: {
                ...(previous?.id === entry.id ? previous.html : {}),
                [part.file]: value.html,
              },
            }));
        } catch (error) {
          if (active)
            setParts(previous => ({
              id: entry.id,
              html: previous?.id === entry.id ? previous.html : {},
              error: error instanceof Error ? error.message : 'This section could not load.',
            }));
          active = false;
        }
      }
    }
    void Promise.all(Array.from({ length: Math.min(3, queue.length) }, next));
    return () => {
      active = false;
    };
  }, [article, catalog, entry.id, targetSection, partAttempt]);
  if (state?.id !== entry.id)
    return (
      <p role="status" className="rules-loading">
        Opening {entry.name}…
      </p>
    );
  if (state.error)
    return (
      <div role="alert">
        <p>{state.error}</p>
        <button
          onClick={() => {
            setState(undefined);
            setAttempt(n => n + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  return (
    <div
      className="rules-prose ds-content"
      ref={prose}
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
        const anchor = (event.target as Element).closest('a');
        if (!anchor || anchor.target === '_blank') return;
        const href = anchor.getAttribute('href');
        if (href?.startsWith('/rules/')) {
          event.preventDefault();
          const [path, hash] = href.slice('/rules/'.length).split('#');
          if (onFollow) onFollow(path!, hash ? decodeURIComponent(hash) : undefined);
          else
            void navigate({
              to: '/rules/$',
              params: { _splat: path },
              hash: hash ?? '',
              search: {},
            });
        }
      }}
    >
      <div
        className="rules-article-part"
        dangerouslySetInnerHTML={{ __html: article?.html ?? '' }}
      />
      {article?.parts?.map(part => (
        <div
          key={part.file}
          className="rules-article-part"
          dangerouslySetInnerHTML={{
            __html: parts?.id === entry.id ? (parts.html[part.file] ?? '') : '',
          }}
        />
      ))}
      {article?.parts?.some(
        part => parts?.id !== entry.id || parts.html[part.file] === undefined,
      ) && (
        <div role="status" className="rules-part-status">
          {parts?.id === entry.id && parts.error ? (
            <>
              {parts.error} <button onClick={() => setPartAttempt(n => n + 1)}>Try again</button>
            </>
          ) : (
            'Loading remaining sections…'
          )}
        </div>
      )}
    </div>
  );
}
