// SPDX-License-Identifier: GPL-3.0-only
/**
 * PaneHeading: the pane title with a trailing caps metadata slot whose value can be brick red
 * (`MALICE 7`, `VICTORIES 3`, session-free-play-director.png and combat-table-*.png) over a hard
 * rule. `SectionHeading` in web/ui.tsx renders a plain eyebrow aside and is left unchanged; this
 * heading adds the label/value split, the accent tone and an optional actions slot.
 */
import { cn } from 'cn';

export interface PaneHeadingProps {
  children: React.ReactNode;
  /** Caps label at the right, e.g. `Malice`. */
  asideLabel?: string;
  /** Value after the label, e.g. `7`; brick red when `asideTone` is `accent`. */
  asideValue?: React.ReactNode;
  asideTone?: 'default' | 'accent';
  /** Controls placed between the title and the aside (settings icon, Back). */
  actions?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function PaneHeading({
  children,
  asideLabel,
  asideValue,
  asideTone = 'default',
  actions,
  as: Heading = 'h2',
  className,
}: PaneHeadingProps) {
  return (
    <div
      className={cn(
        'rule-strong mb-4 flex items-end justify-between gap-x-4 gap-y-1 pb-2',
        className,
      )}
    >
      <Heading className="text-2xl">{children}</Heading>
      <span className="flex items-center gap-3">
        {actions}
        {(asideLabel !== undefined || asideValue !== undefined) && (
          <span className="caps flex items-baseline gap-1.5 text-muted-foreground">
            {asideLabel}
            {asideValue !== undefined && (
              <span
                className={cn(
                  'text-xs font-bold',
                  asideTone === 'accent' ? 'text-primary' : 'text-foreground',
                )}
              >
                {asideValue}
              </span>
            )}
          </span>
        )}
      </span>
    </div>
  );
}
