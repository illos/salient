// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef, useState } from 'react';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation';
import { Button } from '../components/ui/button';

/** Presentation only: opening the chooser never clears the existing draft. */
export function PrimaryChoice({
  label,
  selected,
  noneLabel,
  noneConfirmed,
  reference,
  diagnostics,
  onSelect,
  renderChooser,
  children,
}: {
  label: string;
  selected?: string;
  noneLabel?: string;
  noneConfirmed: boolean;
  reference?: React.ReactNode;
  diagnostics?: React.ReactNode;
  onSelect: (value: SelectionValue | undefined) => void;
  renderChooser: (select: (value: SelectionValue | undefined) => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const expanded = editing || (!selected && !(noneLabel && noneConfirmed));
  const [focusAfterChange, setFocusAfterChange] = useState(false);
  const chooser = useRef<HTMLDivElement>(null);
  const edit = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!focusAfterChange) return;
    const target = expanded ? chooser.current : edit.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest' });
  }, [expanded, focusAfterChange]);
  function finish(value: SelectionValue | undefined) {
    onSelect(value);
    setFocusAfterChange(true);
    setEditing(false);
  }
  return expanded ? (
    <div ref={chooser} tabIndex={-1} role="group" aria-label={`Choose ${label.toLowerCase()}`}>
      {(selected || noneLabel) && (
        <Button type="button" variant="outline" className="mt-4" onClick={() => finish(selected)}>
          {selected ? `Keep ${selected}` : `Use ${noneLabel!.toLowerCase()}`}
        </Button>
      )}
      {renderChooser(finish)}
    </div>
  ) : (
    <>
      <section className="py-5" aria-label={`Selected ${label.toLowerCase()}`}>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="m-0 text-xl font-medium">{selected ?? noneLabel}</h3>
          {reference}
          <Button
            ref={edit}
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Edit ${label.toLowerCase()}`}
            onClick={() => {
              setFocusAfterChange(true);
              setEditing(true);
            }}
          >
            Edit
          </Button>
        </div>
        {diagnostics}
      </section>
      {children}
    </>
  );
}
