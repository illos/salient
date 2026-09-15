// SPDX-License-Identifier: GPL-3.0-only
/**
 * HealthBar: the thick Stamina bar on a grey track from the mockup roster rows and the sheet's
 * Stamina block (combat-table-light.png foe rows, session-free-play-director.png party rows,
 * character-sheet.png). Foe tone fills brick red; hero tone fills ink and turns brick red at or
 * below the `low` threshold the caller supplies (for example the winded value from the projection).
 * Presentation only: the thresholds come from the data, never from this component.
 */
import { cn } from 'cn';

export interface HealthBarProps {
  value: number;
  max: number;
  tone: 'foe' | 'hero';
  /** Hero tone: fill turns red when `value <= low`. */
  low?: number;
  /** Draw a small tick at this value (the winded threshold on the sheet). */
  windedAt?: number;
  /** Accessible name, e.g. `Goblin Warrior Stamina`. */
  label: string;
  className?: string;
}

export function HealthBar({ value, max, tone, low, windedAt, label, className }: HealthBarProps) {
  const safeMax = max > 0 ? max : 1;
  const fraction = Math.max(0, Math.min(1, value / safeMax));
  const red = tone === 'foe' || (low !== undefined && value <= low);
  const tick = windedAt !== undefined ? Math.max(0, Math.min(1, windedAt / safeMax)) : undefined;
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.max(0, value)}
      className={cn('relative block h-(--bar-thickness) w-full bg-border', className)}
    >
      <span
        aria-hidden
        className={cn('absolute inset-y-0 left-0', red ? 'bg-primary' : 'bg-foreground')}
        style={{ width: `${fraction * 100}%` }}
      />
      {tick !== undefined && (
        <span
          aria-hidden
          className="absolute inset-y-0 w-px bg-primary"
          style={{ left: `${tick * 100}%` }}
        />
      )}
    </span>
  );
}
