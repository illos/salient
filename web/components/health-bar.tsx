// SPDX-License-Identifier: GPL-3.0-only
/**
 * HealthBar: the 6px rounded Stamina bar on a `ph` track (docs/design-mockups/quiet/README.md,
 * stamina card and foe rows). Foe tone fills accent; hero tone fills ink and turns accent at or
 * below the `low` threshold the caller supplies (for example the winded value from the
 * projection). Quiet drops the winded tick: the caller turns its "Winded at n" text accent
 * instead, so `windedAt` is accepted but no longer drawn. Presentation only: the thresholds come
 * from the data, never from this component.
 */
import { cn } from 'cn';

export interface HealthBarProps {
  value: number;
  max: number;
  tone: 'foe' | 'hero';
  /** Hero tone: fill turns accent when `value <= low`. */
  low?: number;
  /** Accepted for compatibility; Quiet shows the winded threshold as text, not a tick. */
  windedAt?: number;
  /** Accessible name, e.g. `Goblin Warrior Stamina`. */
  label: string;
  /** Thinner 3px bar (the hero portrait row). */
  thin?: boolean;
  className?: string;
}

export function HealthBar({ value, max, tone, low, label, thin, className }: HealthBarProps) {
  const safeMax = max > 0 ? max : 1;
  const fraction = Math.max(0, Math.min(1, value / safeMax));
  const red = tone === 'foe' || (low !== undefined && value <= low);
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.max(0, value)}
      className={cn(
        'relative block w-full overflow-hidden rounded-full bg-placeholder',
        thin ? 'h-[3px]' : 'h-(--bar-thickness)',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-[width] duration-(--motion-slow) ease-(--motion-ease)',
          red ? 'bg-primary' : 'bg-foreground',
        )}
        style={{ width: `${fraction * 100}%` }}
      />
    </span>
  );
}
