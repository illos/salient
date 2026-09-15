// SPDX-License-Identifier: GPL-3.0-only
/**
 * OverlayCard: the centered scrollable card with a blurred backdrop confirmed for app-wide rule
 * cards (docs/reference-library-spec.md#app-wide-rule-cards) and reused by the table settings
 * pop-up and the reference library card (docs/table-spec.md#confirmed-combat-layout). Escape,
 * backdrop click and the close button dismiss it; Base UI traps focus in the card and returns it
 * to the trigger. Extracted from web/rules/preview.tsx (V13), which now renders through it.
 *
 * Two layers: `OverlayCard` owns the open state (`open` / `onOpenChange`) and wraps
 * `OverlayCardContent`; `OverlayCardContent` alone fits inside an existing `Dialog` root such as
 * the rule link's trigger.
 */
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import { cn } from 'cn';

export interface OverlayCardContentProps {
  /** Card title (the dialog's accessible name). */
  title: React.ReactNode;
  /** Small line above the title, e.g. the book name or `Settings`. */
  eyebrow?: React.ReactNode;
  /** Control rendered before the title block (the rule preview's Back button). */
  leading?: React.ReactNode;
  /** Accessible label of the close button; defaults to `Close`. */
  closeLabel?: string;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  bodyClassName?: string;
  /** Remount the scroll body when this changes so it starts at the top. */
  bodyKey?: string;
}

export function OverlayCardContent({
  title,
  eyebrow,
  leading,
  closeLabel = 'Close',
  children,
  className,
  backdropClassName,
  bodyClassName,
  bodyKey,
}: OverlayCardContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={cn('overlay-card-backdrop', backdropClassName)} />
      <DialogPrimitive.Popup className={cn('overlay-card', className)} aria-describedby={undefined}>
        <header className="overlay-card-header">
          {leading}
          <div>
            {eyebrow && <p className="text-xs text-muted-foreground">{eyebrow}</p>}
            <DialogPrimitive.Title className="overlay-card-title">{title}</DialogPrimitive.Title>
          </div>
          <DialogPrimitive.Close
            className="rulebook-link overlay-card-close"
            aria-label={closeLabel}
          >
            <XIcon size={18} />
          </DialogPrimitive.Close>
        </header>
        <div className={cn('overlay-card-scroll', bodyClassName)} key={bodyKey}>
          {children}
        </div>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export interface OverlayCardProps extends OverlayCardContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OverlayCard({ open, onOpenChange, ...content }: OverlayCardProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {open && <OverlayCardContent {...content} />}
    </DialogPrimitive.Root>
  );
}

/** Trigger for an `OverlayCard` rendered inside the same `Dialog` root (see web/rules/link.tsx). */
export const OverlayCardTrigger = DialogPrimitive.Trigger;
