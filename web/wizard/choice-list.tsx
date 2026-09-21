// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard's centre column pieces (V21 item 10; Quiet, docs/design-mockups/quiet/README.md):
 * the step title block, the muted section label over a decision, the ChoiceRow (a `sub` tile
 * inside the step panel: a header with the option name at the left and its muted metadata at the
 * right, then an optional wrapped `body` line carrying the option's own rules text. The radio or
 * checkbox is screen-reader only (V96) because the inset accent ring already marks the selection;
 * the "Not offered in v0.01" state stays visible and muted) and the pinned step navigation. Presentation only: every
 * row forwards the same change the plain radio or checkbox made before; the option data supplies
 * what the row shows.
 */
import { cn } from 'cn';
import { Button } from '../components/ui/button';

export function StepTitle({
  title,
  description,
  reference,
  optional,
  action,
  eyebrow,
  more,
}: {
  title: string;
  description?: string;
  reference: React.ReactNode;
  optional?: boolean;
  /** Change, once the step's main choice is made and the header carries it (V96). */
  action?: React.ReactNode;
  /** The step this header belongs to, when its title is the chosen option's name instead. */
  eyebrow?: string;
  /** Read more: opens the entry the description came from (V96). */
  more?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <h2 className="m-0 text-3xl font-medium">{title}</h2>
        {eyebrow && <span className="text-sm text-muted-foreground">{eyebrow}</span>}
        {reference}
        {optional && <span className="text-sm text-muted-foreground">Optional</span>}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {description && <p className="mt-2 mb-0 text-base text-muted-foreground">{description}</p>}
      {more && <div className="mt-3">{more}</div>}
    </div>
  );
}

/** A decision inside the step: muted label with the rulebook icon, then its control. */
export function ChoiceSection({
  label,
  reference,
  muted,
  children,
}: {
  label: string;
  reference?: React.ReactNode;
  muted?: boolean;
  children: React.ReactNode;
}) {
  // No aria-label on the section: the visible heading names it, and a second accessible name
  // equal to a control's label inside it makes both match the same query.
  return (
    <section className={cn('flex flex-col gap-3 py-5', muted && 'text-muted-foreground')}>
      <div className="flex items-center gap-2">
        <h3 className="m-0 text-sm font-normal text-muted-foreground">{label}</h3>
        {reference}
      </div>
      {children}
    </section>
  );
}

export interface ChoiceRowProps {
  type: 'radio' | 'checkbox';
  /** Group name for radios. */
  group?: string;
  name: string;
  checked: boolean;
  /** Offered in v0.01; unsupported rows stay visible, muted and disabled. */
  supported: boolean;
  /** Source prerequisite prevents selection, while the reference remains readable. */
  unavailableReason?: string;
  onChange: () => void;
  /** Muted metadata at the right of the header (heroic resource, kit type, point cost). */
  meta?: string;
  /** The rulebook icon for the option. */
  reference?: React.ReactNode;
  /**
   * The option's own rules text under the header, wrapped rather than truncated (V96): what an
   * ancestry trait actually does, so the choice is made from the card, not the reference dialog.
   */
  body?: React.ReactNode;
  /**
   * Show a round state dot before the name. The mockup restores it for the point-budget cards,
   * where several cards are on at once and a ring alone reads as ambiguous; single-choice lists
   * keep the ring alone.
   */
  indicator?: boolean;
}

export function ChoiceRow({
  type,
  group,
  name,
  checked,
  supported,
  unavailableReason,
  onChange,
  meta,
  reference,
  body,
  indicator,
}: ChoiceRowProps) {
  return (
    <li>
      <label
        className={cn(
          'flex h-full cursor-pointer flex-col gap-1.5 rounded-md bg-muted px-4 py-3.5 transition-colors duration-(--motion-fast)',
          checked ? 'ring-1 ring-primary ring-inset' : supported && 'hover:bg-accent',
          !supported && 'cursor-default text-muted-foreground',
          'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        )}
      >
        {/* The control stays for the keyboard and assistive technology; the ring carries the
            selection visually, so no box or dot competes with the option's own name. */}
        <input
          type={type}
          name={group}
          aria-label={name}
          checked={checked}
          disabled={!supported}
          onChange={onChange}
          className="sr-only"
        />
        <span className="flex items-baseline gap-2">
          {indicator && (
            <span
              aria-hidden
              className={cn(
                'flex size-[18px] shrink-0 translate-y-0.5 items-center justify-center rounded-full text-xs',
                checked ? 'bg-primary text-primary-foreground' : 'bg-placeholder',
              )}
            >
              {checked ? '✓' : ''}
            </span>
          )}
          <span className="truncate text-lg font-medium">{name}</span>
          {reference}
          <span className="ml-auto flex items-baseline gap-2 pl-3 text-sm whitespace-nowrap text-muted-foreground">
            {meta && <span>{meta}</span>}
            {!supported && <span>{unavailableReason ?? 'Not offered yet'}</span>}
          </span>
        </span>
        {body && <span className="text-sm text-balance text-muted-foreground">{body}</span>}
      </label>
    </li>
  );
}

export function ChoiceList({ children, grid }: { children: React.ReactNode; grid?: boolean }) {
  return (
    <ul
      className={cn(
        'm-0 list-none p-0',
        grid ? 'grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-2' : 'flex flex-col gap-2',
      )}
    >
      {children}
    </ul>
  );
}

/**
 * The step navigation, at the foot of the rail (V96): back is an arrow alone, since the rail
 * already says where it goes, and forward names the step it leads to. The last step finishes.
 */
export function StepNav({
  previous,
  next,
  onPrevious,
  onNext,
  finishLabel,
  onFinish,
  finishDisabled,
}: {
  previous?: string;
  next?: string;
  onPrevious: () => void;
  onNext: () => void;
  finishLabel: string;
  onFinish: () => void;
  finishDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={previous ? `Back to ${previous}` : 'Previous step'}
        title={previous ? `Back to ${previous}` : undefined}
        disabled={!previous}
        onClick={onPrevious}
      >
        <span aria-hidden>←</span>
      </Button>
      {next ? (
        <Button
          type="button"
          className="min-w-0 flex-1 justify-between gap-2 rounded-full"
          title={`Continue to ${next}`}
          onClick={onNext}
        >
          <span className="truncate">{next}</span>
          <span aria-hidden>→</span>
        </Button>
      ) : (
        <Button
          type="button"
          className="min-w-0 flex-1 rounded-full"
          disabled={finishDisabled}
          onClick={onFinish}
        >
          <span className="truncate">{finishLabel}</span>
        </Button>
      )}
    </div>
  );
}
