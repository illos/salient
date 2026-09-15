// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { RuleArticle, RuleSummary, RulesCatalog } from '../../shared/contracts/rules';
import { getRuleArticle } from './content';
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
  const prose = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!state?.article || state.id !== entry.id || !section) return;
    const target = Array.from(prose.current?.querySelectorAll('[id]') ?? []).find(
      el => el.id === section,
    );
    target?.scrollIntoView({ block: 'start' });
  }, [state, entry.id, section]);
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
      className="rules-prose"
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
      dangerouslySetInnerHTML={{ __html: state.article?.html ?? '' }}
    />
  );
}
