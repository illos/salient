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
