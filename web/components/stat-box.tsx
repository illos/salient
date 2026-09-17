// SPDX-License-Identifier: GPL-3.0-only
/**
 * StatBox: the characteristic box from the sheet header (character-sheet.png: large value, caps
 * label beneath, 1px ink border) and its compact form in the wizard's hero-so-far column
 * (character-wizard-class.png: `2` over `MGT`). Also the kit boxes (`STAMINA +6`) when `caption`
 * leads. Presentation only.
 */
import { cn } from 'cn';

export interface StatBoxProps {
  value: React.ReactNode;
  label: React.ReactNode;
  /** Wizard column size: ~56px square with an abbreviated label. */
  compact?: boolean;
  /** Emphasized box (the wizard marks chosen characteristics with a heavier border). */
  emphasis?: boolean;
  className?: string;
}

export function StatBox({ value, label, compact, emphasis, className }: StatBoxProps) {
  return (
    <span
      className={cn(
        'inline-flex flex-col items-center justify-center rounded-md border bg-background text-foreground',
        emphasis ? 'border-2 border-rule-strong' : 'border-rule-strong',
        compact ? 'size-14 gap-0' : 'h-20 min-w-20 gap-1 px-3',
        className,
      )}
    >
      <span className={cn('font-bold tabular-nums', compact ? 'text-lg' : 'text-2xl')}>
        {value}
      </span>
      <span className="caps text-muted-foreground">{label}</span>
    </span>
  );
}
