// SPDX-License-Identifier: GPL-3.0-only
/**
 * The step's one main catalog choice (Ancestry, Career, Class, Kit, Complication).
 *
 * V96: a made choice is reported by the step header itself, which takes the option's name, its
 * own rules text and its reference, with Edit beside it. So this renders only the chooser while
 * it is open, and only the dependent choices once it is closed. The caller owns the open state
 * and the focus move, because the header it belongs to is the caller's.
 *
 * Presentation only: opening the chooser never clears the existing draft.
 */
import type { SelectionValue } from '../../shared/contracts/characterEvaluation';
import { Button } from '../components/ui/button';

export function PrimaryChoice({
  label,
  selected,
  noneLabel,
  expanded,
  chooserRef,
  onKeep,
  renderChooser,
  children,
}: {
  label: string;
  selected?: string;
  noneLabel?: string;
  /** The chooser is open: either nothing is settled yet, or the caller pressed Edit. */
  expanded: boolean;
  chooserRef: React.RefObject<HTMLDivElement | null>;
  /** Confirm the current option (or the optional none) without changing the draft. */
  onKeep: (value: SelectionValue | undefined) => void;
  renderChooser: (select: (value: SelectionValue | undefined) => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  if (!expanded) return <>{children}</>;
  return (
    <div ref={chooserRef} tabIndex={-1} role="group" aria-label={`Choose ${label.toLowerCase()}`}>
      {(selected || noneLabel) && (
        <Button type="button" variant="outline" className="mt-4" onClick={() => onKeep(selected)}>
          {selected ? `Keep ${selected}` : `Use ${noneLabel!.toLowerCase()}`}
        </Button>
      )}
      {renderChooser(onKeep)}
    </div>
  );
}
