// SPDX-License-Identifier: GPL-3.0-only
/**
 * PaneHeading: the panel title (`Foes`, `Heroes`, 20–22px/500) with a trailing metadata slot
 * (`Malice 7`, `Victories 3`) whose label is muted and whose value is ink, or accent for a live
 * value (docs/design-mockups/quiet/README.md, table screen). No rule beneath: air separates it
 * from the panel body. `SectionHeading` in web/ui.tsx is the plain page variant.
 */
import { cn } from 'cn';

export interface PaneHeadingProps {
  children: React.ReactNode;
  /** Label at the right, e.g. `Malice`. */
  asideLabel?: string;
  /** Value after the label, e.g. `7`; accent when `asideTone` is `accent`. */
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
    <div className={cn('mb-5 flex items-end justify-between gap-x-4 gap-y-1', className)}>
      <Heading className="text-xl font-medium">{children}</Heading>
      <span className="flex items-center gap-3">
        {actions}
        {(asideLabel !== undefined || asideValue !== undefined) && (
          <span className="flex items-baseline gap-1.5 text-sm text-muted-foreground">
            {asideLabel}
            {asideValue !== undefined && (
              <span
                className={cn(
                  'text-base font-medium tabular-nums',
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
