// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pill: the centered session-marker pill from the log feed (`SESSION STARTED · 19:02`,
 * session-free-play-director.png) and the header status pill (`RUNNING · FREE PLAY`,
 * `RUNNING · COMBAT · ROUND 2`). `filled` renders the brick-red header variant.
 */
import { cn } from 'cn';

export interface PillProps {
  children: React.ReactNode;
  /** Brick-red filled variant (session header status). Default is the outlined feed marker. */
  filled?: boolean;
  /** Center the pill on its own line (log feed markers). */
  centered?: boolean;
  className?: string;
  role?: string;
  'aria-live'?: 'polite' | 'off';
}

export function Pill({ children, filled, centered, className, ...rest }: PillProps) {
  const pill = (
    <span
      {...rest}
      className={cn(
        'caps inline-flex h-7 items-center whitespace-nowrap',
        filled
          ? 'rounded-md bg-primary px-3 text-primary-foreground'
          : 'rounded-full border border-input px-3 text-muted-foreground',
        !centered && className,
      )}
    >
      {children}
    </span>
  );
  if (!centered) return pill;
  return <div className={cn('flex justify-center py-2', className)}>{pill}</div>;
}
