// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import type { RuleSummary, RulesCatalog } from '../../shared/contracts/rules';
import { OverlayCardContent } from '../components/overlay-card';
import { RuleArticleView } from './article';
import './reference.css';

type Location = { entry: RuleSummary; section?: string };
/** The rule card: the shared OverlayCard with a Back control for references followed inside it. */
export default function RulePreview({
  catalog,
  initial,
}: {
  catalog: RulesCatalog;
  initial: Location;
}) {
  const [history, setHistory] = useState<Location[]>([initial]);
  const current = history.at(-1)!;
  return (
    <OverlayCardContent
      className="rule-preview"
      backdropClassName="rule-preview-backdrop"
      bodyClassName="rule-preview-scroll"
      bodyKey={`${current.entry.id}#${current.section ?? ''}`}
      closeLabel="Close rule"
      title={current.entry.name}
      footer={`Draw Steel: ${catalog.books.find(b => b.id === current.entry.book)?.name}`}
      leading={
        history.length > 1 ? (
          <button
            type="button"
            className="rulebook-link"
            aria-label="Back to previous rule"
            onClick={() => setHistory(h => h.slice(0, -1))}
          >
            <ArrowLeftIcon size={18} />
          </button>
        ) : undefined
      }
    >
      <RuleArticleView
        catalog={catalog}
        entry={current.entry}
        section={current.section}
        onFollow={(path, section) => {
          const entry = catalog.entries.find(e => e.path === path);
          if (entry) setHistory(h => [...h, { entry, section }]);
        }}
      />
    </OverlayCardContent>
  );
}
