// SPDX-License-Identifier: GPL-3.0-only
/**
 * Disc: the circular portrait placeholder in roster rows, log entries, member rows and the sheet
 * header. Initials on a tonal fill until a portrait system exists. Ink for the viewer's own or
 * the acting creature, `ph` grey for others, accent for a foe entry in the log. The `ring`
 * variant is the combat hero-resource portrait (docs/design-mockups/quiet/README.md, heroes
 * pane): a 48px circle with no conic ring or count badge; the acting hero gets a 2px accent
 * outline offset 3px and a muted caption (`Acting`). The optional `badge` is kept as a small
 * tonal count for callers that still pass one.
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
  sm: 'size-(--disc-sm) text-sm',
  md: 'size-(--disc-md) text-sm',
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
  /** Optional account portrait. Initials remain the fallback. */
  src?: string | null;
  variant?: DiscVariant;
  /** sm ≈ 32px (log entries), md ≈ 44px (roster rows), lg ≈ 110px (sheet header). Ring discs are 48px. */
  size?: DiscSize;
  /** Ring variant: filled ink for the viewer's own hero; `acting` adds the accent outline. */
  filled?: boolean;
  /** Ring variant: the acting hero (accent outline, offset 3px). */
  acting?: boolean;
  /** Ring variant: small numeric count at the bottom right (heroic resource). */
  badge?: number | string;
  /** Ring variant: muted caption under the disc, e.g. `Acting`. */
  caption?: string;
  /** Ring variant: content rendered under the disc (the 3px stamina bar). */
  footer?: React.ReactNode;
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
  src,
  variant = 'grey',
  size = 'md',
  filled = false,
  acting = false,
  badge,
  caption,
  footer,
  muted,
  label,
  className,
}: DiscProps) {
  const initials = initialsOf(name);
  if (variant === 'ring') {
    return (
      <span
        className={cn('inline-flex flex-col items-center gap-2', muted && 'opacity-40', className)}
        {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      >
        <span className="relative inline-block size-(--disc-ring)">
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full text-sm font-medium transition-colors duration-(--motion-fast)',
              filled ? FILL.ink : FILL.grey,
              acting && 'outline-2 outline-offset-[3px] outline-primary',
            )}
          >
            {initials}
          </span>
          {badge !== undefined && (
            <span
              aria-hidden
              className="absolute -right-1 -bottom-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-sm font-medium text-foreground tabular-nums"
            >
              {badge}
            </span>
          )}
        </span>
        {footer}
        {caption && <span className="text-sm text-muted-foreground">{caption}</span>}
      </span>
    );
  }
  return (
    <span
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium select-none',
        SIZE[size],
        FILL[variant],
        muted && 'opacity-40',
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full rounded-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}
