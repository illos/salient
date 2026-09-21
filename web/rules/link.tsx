// SPDX-License-Identifier: GPL-3.0-only
import { lazy, Suspense, useState } from 'react';
import { Dialog, DialogTrigger } from '../components/ui/dialog';
import { useRulesCatalog } from './content';
import { resolveRule, type RuleReference } from './reference';
import './reference.css';

const RulePreview = lazy(() => import('./preview'));
export function RulebookIcon() {
  return <span className="rulebook-icon" aria-hidden="true" />;
}

/** The same icon and modal reader serve every operational surface. */
export function RuleLink(reference: RuleReference) {
  const { catalog, error } = useRulesCatalog();
  const [open, setOpen] = useState(false);
  const target = catalog ? resolveRule(catalog, reference) : undefined;
  const name = reference.label ?? target?.entry.name ?? 'Rule';
  const label = `Read ${name} in the rules`;
  if (!target || !catalog) {
    const status = error || catalog ? 'Reference unavailable' : 'Loading reference';
    return (
      <span
        className="rulebook-link"
        aria-disabled="true"
        aria-label={`${name}: ${status}`}
        title={`${name}: ${status}`}
      >
        <RulebookIcon />
      </span>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rulebook-link" aria-label={label} title={label}>
        <RulebookIcon />
      </DialogTrigger>
      {open && (
        <Suspense fallback={null}>
          <RulePreview catalog={catalog} initial={target} />
        </Suspense>
      )}
    </Dialog>
  );
}

/**
 * The same modal reader behind a worded control rather than the icon (V96): used where a card
 * shows the opening of an entry and offers to read the rest.
 */
export function RuleReadMore({
  text = 'Read more',
  ...reference
}: RuleReference & { text?: string }) {
  const { catalog, error } = useRulesCatalog();
  const [open, setOpen] = useState(false);
  const target = catalog ? resolveRule(catalog, reference) : undefined;
  const name = reference.label ?? target?.entry.name ?? 'Rule';
  if (!target || !catalog) {
    const status = error || catalog ? 'Reference unavailable' : 'Loading reference';
    return (
      <span className="text-sm text-muted-foreground" aria-label={`${name}: ${status}`}>
        {status}
      </span>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-8 cursor-pointer items-center rounded-full bg-muted px-3 text-sm text-foreground transition-colors duration-(--motion-fast) hover:bg-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={`Read ${name} in the rules`}
      >
        {text}
      </DialogTrigger>
      {open && (
        <Suspense fallback={null}>
          <RulePreview catalog={catalog} initial={target} />
        </Suspense>
      )}
    </Dialog>
  );
}
