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
  /**
   * Full-bleed body for content that prints its own title, such as a Core stat block: the card
   * fills the panel edge to edge, the header's title and eyebrow are not drawn (the title stays
   * as the dialog's accessible name), and Back and Close float over the top corners.
   */
  flush?: boolean;
  /**
   * Keep the header and its eyebrow, but do not draw the title: for content that prints its own
   * name (a Core ability or trait card) without a band to run to the panel edges. The title
   * remains the dialog's accessible name.
   */
  hideTitle?: boolean;
  /** Content rendered after the body, at the bottom of the card: the source reference line. */
  footer?: React.ReactNode;
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
  flush,
  hideTitle,
  footer,
}: OverlayCardContentProps) {
  const close = (
    <DialogPrimitive.Close className="rulebook-link overlay-card-close" aria-label={closeLabel}>
      <XIcon size={18} />
    </DialogPrimitive.Close>
  );
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={cn('overlay-card-backdrop', backdropClassName)} />
      <DialogPrimitive.Popup className={cn('overlay-card', className)} aria-describedby={undefined}>
        {flush ? (
          <>
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <div className="overlay-card-floating">
              {leading}
              {close}
            </div>
          </>
        ) : (
          <header
            className={cn(
              'overlay-card-header',
              hideTitle && !eyebrow && 'overlay-card-header-slim',
            )}
          >
            {leading}
            <div>
              {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
              <DialogPrimitive.Title className={hideTitle ? 'sr-only' : 'overlay-card-title'}>
                {title}
              </DialogPrimitive.Title>
            </div>
            {close}
          </header>
        )}
        <div
          className={cn('overlay-card-scroll', flush && 'overlay-card-scroll-flush', bodyClassName)}
          key={bodyKey}
        >
          {children}
          {footer && <div className="overlay-card-footer">{footer}</div>}
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
