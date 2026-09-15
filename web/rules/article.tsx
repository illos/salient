// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import type { RuleArticle, RuleSummary, RulesCatalog } from '../../shared/contracts/rules';
import { getRuleArticle, useRulesCatalog } from './content';
import './rules.css';

/** An ID can be rendered anywhere: callers do not need to know its source path or page route. */
export function RuleLink({
  id,
  children,
  section,
}: {
  id: string;
  children?: React.ReactNode;
  section?: string;
}) {
  const { catalog } = useRulesCatalog();
  const entry = catalog?.entries.find(e => e.id === id);
  if (!entry) return <span>{children ?? 'Read rule'}</span>;
  return (
    <Link
      to="/rules/$"
      params={{ _splat: entry.path }}
      hash={section}
      className="rules-inline-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children ?? entry.name}
    </Link>
  );
}

export function RuleArticleView({
  catalog,
  entry,
  onLoaded,
}: {
  catalog: RulesCatalog;
  entry: RuleSummary;
  onLoaded?: (article: RuleArticle) => void;
}) {
  const [state, setState] = useState<{ id: string; article?: RuleArticle; error?: string }>();
  const navigate = useNavigate();
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
  }, [catalog, entry, onLoaded]);
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
        <button onClick={() => window.location.reload()}>Reload references</button>
      </div>
    );
  return (
    <div
      className="rules-prose"
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
          void navigate({ to: '/rules/$', params: { _splat: path }, hash: hash ?? '', search: {} });
        }
      }}
      dangerouslySetInnerHTML={{ __html: state.article?.html ?? '' }}
    />
  );
}
