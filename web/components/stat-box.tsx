// SPDX-License-Identifier: GPL-3.0-only
/**
 * StatBox: the characteristic tile from the sheet header (docs/design-mockups/quiet/README.md,
 * identity header: a borderless `card` tile, 84px wide, 8px radius, 24px number over a 13px
 * label) and its compact form in the wizard's hero-so-far column. Inside a panel the tile is a
 * `sub` inset (`inset`), as the kit stats are. Presentation only.
 */
import { cn } from 'cn';

export interface StatBoxProps {
  value: React.ReactNode;
  label: React.ReactNode;
  /** Wizard column size: ~56px square with an abbreviated label. */
  compact?: boolean;
  /** Emphasized tile (the wizard marks chosen characteristics): ink value on the `sub` fill. */
  emphasis?: boolean;
  /** Tile placed inside a `card` panel: `sub` fill instead of `card`. */
  inset?: boolean;
  className?: string;
}

export function StatBox({ value, label, compact, emphasis, inset, className }: StatBoxProps) {
  return (
    <span
      className={cn(
        'inline-flex flex-col items-center justify-center rounded-md text-foreground',
        inset || emphasis ? 'bg-muted' : 'bg-card',
        emphasis && 'ring-1 ring-primary ring-inset',
        compact ? 'size-14 gap-0' : 'h-[68px] min-w-[84px] gap-0.5 px-3',
        className,
      )}
    >
      <span className={cn('font-medium tabular-nums', compact ? 'text-lg' : 'text-2xl')}>
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </span>
  );
}
