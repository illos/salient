// SPDX-License-Identifier: GPL-3.0-only
/**
 * PipRow: Recoveries as a row of 6px rounded pips (docs/design-mockups/quiet/README.md, stamina
 * card). Filled pips are ink; empty pips are the `ph` tone. No outlines.
 */
import { cn } from 'cn';

export interface PipRowProps {
  filled: number;
  total: number;
  /** Accessible name, e.g. `Recoveries 8 of 10`. */
  label: string;
  className?: string;
}

export function PipRow({ filled, total, label, className }: PipRowProps) {
  const count = Math.max(0, Math.floor(total));
  const on = Math.max(0, Math.min(count, Math.floor(filled)));
  return (
    <span role="img" aria-label={label} className={cn('flex w-full items-center gap-1', className)}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            'inline-block h-(--pip-size) min-w-(--pip-size) flex-1 rounded-full transition-colors duration-(--motion-fast)',
            index < on ? 'bg-foreground' : 'bg-placeholder',
          )}
        />
      ))}
    </span>
  );
}
