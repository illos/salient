// SPDX-License-Identifier: GPL-3.0-only
/**
 * Chip and DiceChips: the small metadata pills of the log feed and sheet header (`2d10`, `+2`,
 * `14`, `Signature`, `3 Ferocity`). Quiet renders every chip as a 999px `sub` pill in sentence
 * case (docs/design-mockups/quiet/README.md, table screen): `plain` is muted text, `result` is
 * ink, `accent` is accent text on the `sub` pill (the cost pill on an ability card) and
 * `filled-accent` is the one filled accent pill (a live result or selected state).
 */
import { cn } from 'cn';

export type ChipKind = 'plain' | 'result' | 'accent' | 'filled-accent';

const KIND: Record<ChipKind, string> = {
  plain: 'bg-muted text-muted-foreground',
  result: 'bg-muted font-medium text-foreground',
  accent: 'bg-muted font-medium text-primary',
  'filled-accent': 'bg-primary font-medium text-primary-foreground',
};

export interface ChipProps {
  kind?: ChipKind;
  /** Kept for call-site compatibility: Quiet chips are sentence case at 13px either way. */
  caps?: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Chip({ kind = 'plain', children, className, title }: ChipProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-sm whitespace-nowrap tabular-nums',
        KIND[kind],
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface DiceChip {
  label: string;
  kind: 'plain' | 'result' | 'accent';
}

/** An ordered row of chips for one roll: inputs plain, the total `result`, the tier `accent`. */
export function DiceChips({ chips, className }: { chips: DiceChip[]; className?: string }) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      {chips.map((chip, index) => (
        <Chip key={`${index}:${chip.label}`} kind={chip.kind}>
          {chip.label}
        </Chip>
      ))}
    </span>
  );
}
