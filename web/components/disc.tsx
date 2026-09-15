// SPDX-License-Identifier: GPL-3.0-only
/**
 * Disc: the circular portrait placeholder from every V1 mockup roster row, log entry, member row
 * and sheet header (docs/design-mockups/v1/README.md; audit finding 3). Initials on a neutral fill
 * until a portrait system exists. Ink for the viewer's own or the acting creature, grey for others,
 * red for a foe entry in the log, and the ring variant for the combat hero-resource portrait row
 * with its numeric badge and optional caps label (`ACTING`).
 */
import { cn } from 'cn';

export type DiscVariant = 'ink' | 'grey' | 'red' | 'ring';
export type DiscSize = 'sm' | 'md' | 'lg';

/** Up to two initials from a display name: "Goblin Warrior" → "GW", "Thorn" → "T". */
export function initialsOf(name: string): string {
  const words = name
    .split(/[\s·]+/)
    .map(word => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (words.length === 0) return '·';
  if (words.length === 1) return words[0]!.slice(0, 1).toUpperCase();
  return (words[0]!.slice(0, 1) + words[1]!.slice(0, 1)).toUpperCase();
}

const SIZE: Record<DiscSize, string> = {
  sm: 'size-(--disc-sm) text-2xs',
  md: 'size-(--disc-md) text-xs',
  lg: 'size-(--disc-lg) text-2xl',
};
const FILL: Record<Exclude<DiscVariant, 'ring'>, string> = {
  ink: 'bg-foreground text-background',
  grey: 'bg-placeholder text-muted-foreground',
  red: 'bg-primary text-primary-foreground',
};

export interface DiscProps {
  /** Name the initials come from. */
  name: string;
  variant?: DiscVariant;
  /** sm ≈ 32px (log entries), md ≈ 44px (roster rows), lg ≈ 110px (sheet header). Ring discs are 60px. */
  size?: DiscSize;
  /** Ring variant: filled for the viewer's own or the acting hero. */
  filled?: boolean;
  /** Ring variant: small numeric badge at the bottom right (heroic resource). */
  badge?: number | string;
  /** Ring variant: caps label under the disc, e.g. `Acting`. */
  caption?: string;
  /** Dim the disc (Slain, Away). */
  muted?: boolean;
  /**
   * Accessible name. Omit it where the disc sits beside the same name in visible text: the disc
   * is then decorative and hidden from assistive technology, so a roster row or member row has
   * one accessible name, not two.
   */
  label?: string;
  className?: string;
}

export function Disc({
  name,
  variant = 'grey',
  size = 'md',
  filled = false,
  badge,
  caption,
  muted,
  label,
  className,
}: DiscProps) {
  const initials = initialsOf(name);
  if (variant === 'ring') {
    return (
      <span
        className={cn('inline-flex flex-col items-center gap-1', muted && 'opacity-50', className)}
        {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      >
        <span className="relative inline-block size-(--disc-ring)">
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-full border-(length:--disc-ring-stroke)',
              filled ? 'border-primary' : 'border-border',
            )}
          />
          <span
            aria-hidden
            className={cn(
              'absolute inset-[5px] flex items-center justify-center rounded-full text-xs font-semibold',
              filled ? FILL.ink : FILL.grey,
            )}
          >
            {initials}
          </span>
          {badge !== undefined && (
            <span
              aria-hidden
              className="absolute -right-1 -bottom-1 flex min-w-5 items-center justify-center rounded-full border border-background bg-background px-1 text-2xs font-bold text-foreground ring-1 ring-rule-strong"
            >
              {badge}
            </span>
          )}
        </span>
        {caption && <span className="caps text-primary">{caption}</span>}
      </span>
    );
  }
  return (
    <span
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        SIZE[size],
        FILL[variant],
        muted && 'opacity-50',
        className,
      )}
    >
      <span aria-hidden>{initials}</span>
    </span>
  );
}
