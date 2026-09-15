// SPDX-License-Identifier: GPL-3.0-only
/**
 * Chip and DiceChips: the bordered rectangular metadata chips (`2d10`, `+2`, `Test · Might`,
 * `HUMAN`, `KIT · PANTHER`) and the filled result chip (`16`, `14`) from the mockup log feed and
 * sheet header (session-free-play-director.png, combat-table-light.png, character-sheet.png).
 * `result` fills ink; `accent` is brick red, filled in dark (combat-table-dark.png result chip)
 * and outlined red text in light (`3 FEROCITY`, `Tier 2`).
 */
import { cn } from 'cn';

export type ChipKind = 'plain' | 'result' | 'accent' | 'filled-accent';

const KIND: Record<ChipKind, string> = {
  plain: 'border-input text-foreground',
  result: 'border-foreground bg-foreground text-background',
  accent: 'border-primary text-primary',
  'filled-accent': 'border-primary bg-primary text-primary-foreground',
};

export interface ChipProps {
  kind?: ChipKind;
  /** Uppercase compact metadata (`HUMAN`) instead of the default sentence-case value (`2d10`). */
  caps?: boolean;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Chip({ kind = 'plain', caps, children, className, title }: ChipProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-6 items-center rounded-(--chip-radius) border-(length:--chip-border) px-1.5 font-semibold whitespace-nowrap',
        caps ? 'caps' : 'text-xs',
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
