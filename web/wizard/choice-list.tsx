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
}: {
  title: string;
  description?: string;
  reference: React.ReactNode;
  optional?: boolean;
  /** Edit, once the step's main choice is made and the header carries it (V96). */
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <h2 className="m-0 text-3xl font-medium">{title}</h2>
        {reference}
        {optional && <span className="text-sm text-muted-foreground">Optional</span>}
        {action}
      </div>
      {description && <p className="mt-2 mb-0 text-base text-muted-foreground">{description}</p>}
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
}: ChoiceRowProps) {
  return (
    <li>
      <label
        className={cn(
          'flex cursor-pointer flex-col gap-1.5 rounded-md bg-muted px-4 py-3.5 transition-colors duration-(--motion-fast)',
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

export function ChoiceList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex list-none flex-col gap-2 p-0">{children}</ul>;
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
          className="min-w-0 flex-1 justify-between gap-2"
          title={`Continue to ${next}`}
          onClick={onNext}
        >
          <span className="truncate">{next}</span>
          <span aria-hidden>→</span>
        </Button>
      ) : (
        <Button
          type="button"
          className="min-w-0 flex-1"
          disabled={finishDisabled}
          onClick={onFinish}
        >
          <span className="truncate">{finishLabel}</span>
        </Button>
      )}
    </div>
  );
}
