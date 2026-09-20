// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pill: the centered session-marker pill from the log feed (`Session started · 19:02`) and the
 * header status (`Running · Combat · Round 2`). Quiet (docs/design-mockups/quiet/README.md,
 * table screen) shows the header status as an accent dot beside plain text rather than a filled
 * pill; `filled` now marks the dot as live (accent) instead of filling the pill. Feed markers
 * are 999px `sub` pills in muted text.
 */
import { cn } from 'cn';

export interface PillProps {
  children: React.ReactNode;
  /** Live status (session running): the leading dot is accent; otherwise it is muted. */
  filled?: boolean;
  /** Center the pill on its own line (log feed markers). */
  centered?: boolean;
  className?: string;
  role?: string;
  'aria-live'?: 'polite' | 'off';
}

export function Pill({ children, filled, centered, className, ...rest }: PillProps) {
  if (centered) {
    return (
      <div className={cn('flex justify-center py-2', className)}>
        <span
          {...rest}
          className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-sm whitespace-nowrap text-muted-foreground"
        >
          {children}
        </span>
      </div>
    );
  }
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex h-7 items-center gap-2 text-base whitespace-nowrap text-foreground',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('size-2 rounded-full', filled ? 'bg-primary' : 'bg-muted-foreground/60')}
      />
      {children}
    </span>
  );
}
