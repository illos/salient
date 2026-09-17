// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard's centre column pieces (character-wizard-class.png; V21 item 10): the step title
 * block, the caps section label over a decision, the ChoiceRow (radio or checkbox, bold name,
 * caps metadata, grey description, right-aligned facts, the muted "Not offered in v0.01" state)
 * and the pinned step navigation. Presentation only: every row forwards the same change the
 * plain radio or checkbox made before; the option data supplies what the row shows.
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
    <div className="rule-strong mb-2 pb-4">
      <div className="flex items-center gap-3">
        <h2 className="m-0 text-3xl font-bold tracking-tight">{title}</h2>
        {reference}
        {optional && <span className="caps text-muted-foreground">Optional</span>}
      </div>
      {description && <p className="mt-2 mb-0 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

/** A decision inside the step: caps label with the rulebook icon, then its control. */
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
    <section className={cn('flex flex-col gap-2 py-5', muted && 'text-muted-foreground')}>
      <div className="flex items-center gap-2">
        <h3 className="caps m-0 text-muted-foreground">{label}</h3>
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
  /** Caps metadata after the name (heroic resource, kit type, point cost). */
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
    <li className="rule-soft">
      <label
        className={cn(
          'grid cursor-pointer grid-cols-[auto_minmax(0,1.3fr)_auto_minmax(0,1.6fr)_auto] items-center gap-x-5 px-2 py-3 text-sm transition-colors duration-(--motion-fast)',
          checked ? 'bg-muted' : 'hover:bg-muted/60',
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
            'size-4 shrink-0 appearance-none border border-foreground bg-background outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:border-input',
            type === 'radio' ? 'rounded-full' : 'rounded-sm',
            'checked:border-primary checked:bg-primary',
          )}
        />
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn('truncate text-base', supported ? 'font-bold' : 'font-medium')}>
            {name}
          </span>
          {reference}
        </span>
        <span className="caps whitespace-nowrap text-muted-foreground">{meta ?? ''}</span>
        <span className="truncate text-muted-foreground">{description ?? ''}</span>
        <span className="caps justify-self-end text-right text-muted-foreground">
          {supported ? (facts ?? '') : (unavailableReason ?? 'Not offered yet')}
        </span>
      </label>
    </li>
  );
}

export function ChoiceList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 list-none border-t border-rule-strong p-0">{children}</ul>;
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
    <div className="flex items-center justify-between gap-4 border-t border-rule-strong bg-background px-10 py-4">
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
