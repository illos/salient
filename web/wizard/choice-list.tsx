// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard's centre column pieces (V21 item 10; Quiet, docs/design-mockups/quiet/README.md):
 * the step title block, the muted section label over a decision, the ChoiceRow (a `sub` tile
 * inside the step panel with a radio or checkbox, the option name, muted metadata, description
 * and right-aligned facts; the selected tile takes an inset accent ring; the "Not offered in
 * v0.01" state stays visible and muted) and the pinned step navigation. Presentation only: every
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
}: {
  title: string;
  description?: string;
  reference: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <h2 className="m-0 text-3xl font-medium">{title}</h2>
        {reference}
        {optional && <span className="text-sm text-muted-foreground">Optional</span>}
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
  /** Muted metadata after the name (heroic resource, kit type, point cost). */
  meta?: string;
  /** Short grey description. */
  description?: string;
  /** Right-aligned facts (primary characteristics). */
  facts?: string;
  /** The rulebook icon for the option. */
  reference?: React.ReactNode;
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
  description,
  facts,
  reference,
}: ChoiceRowProps) {
  return (
    <li>
      <label
        className={cn(
          'grid cursor-pointer grid-cols-[auto_minmax(0,1.3fr)_auto_minmax(0,1.6fr)_auto] items-center gap-x-5 rounded-md bg-muted px-4 py-3.5 text-base transition-colors duration-(--motion-fast)',
          checked ? 'ring-1 ring-primary ring-inset' : supported && 'hover:bg-accent',
          !supported && 'cursor-default text-muted-foreground',
        )}
      >
        <input
          type={type}
          name={group}
          aria-label={name}
          checked={checked}
          disabled={!supported}
          onChange={onChange}
          className={cn(
            'size-[18px] shrink-0 cursor-pointer appearance-none bg-placeholder transition-colors duration-(--motion-fast) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-40',
            type === 'radio' ? 'rounded-full' : 'rounded-[5px]',
            'checked:bg-primary',
          )}
        />
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-lg font-medium">{name}</span>
          {reference}
        </span>
        <span className="text-sm whitespace-nowrap text-muted-foreground">{meta ?? ''}</span>
        <span className="truncate text-base text-muted-foreground">{description ?? ''}</span>
        <span className="justify-self-end text-right text-sm text-muted-foreground">
          {supported ? (facts ?? '') : (unavailableReason ?? 'Not offered yet')}
        </span>
      </label>
    </li>
  );
}

export function ChoiceList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex list-none flex-col gap-2 p-0">{children}</ul>;
}

/** The pinned bottom navigation: previous and next step names; the last step finishes. */
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
    <div className="flex items-center justify-between gap-4 px-6 pt-4 pb-6">
      <Button type="button" variant="outline" disabled={!previous} onClick={onPrevious}>
        ← {previous ?? 'Previous step'}
      </Button>
      {next ? (
        <Button type="button" onClick={onNext}>
          Continue to {next} →
        </Button>
      ) : (
        <Button type="button" disabled={finishDisabled} onClick={onFinish}>
          {finishLabel}
        </Button>
      )}
    </div>
  );
}
