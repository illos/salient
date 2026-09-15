// SPDX-License-Identifier: GPL-3.0-only
/**
 * PipRow: filled and empty squares for Recoveries from the sheet's Stamina block
 * (character-sheet.png: `RECOVERIES ■■■■■■■■□□`). Filled pips are ink; empty pips are outlined.
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
    <span
      role="img"
      aria-label={label}
      className={cn('inline-flex flex-wrap items-center gap-1', className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            'inline-block size-(--pip-size) border border-rule-strong',
            index < on ? 'bg-foreground' : 'bg-background',
          )}
        />
      ))}
    </span>
  );
}
