// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard step rail (V21 item 10; Quiet, docs/design-mockups/quiet/README.md; V96 compaction):
 * a `card` panel headed "Character Builder" with the Making a Hero reference, a muted "Step n
 * of m" line, one compact row per presented step — the tonal round badge carries the number and
 * takes the accent on the current step (a check mark once the step is done), then the step's
 * chosen value, falling back to the step name until it has one — and a rounded progress bar at
 * the bottom, with the step navigation under it. The rows are the same step buttons the wizard
 * always had, and the accessible name
 * keeps the step it belongs to (`n. Step name: Chosen`) so the keyboard flow keeps working. The
 * steps come from the caller in presented order; nothing here knows how many there are.
 */
import { cn } from 'cn';
import { Badge } from '../components/ui/badge';
import { RuleLink } from '../rules/link';
import type { RuleReference } from '../rules/reference';

export interface RailStep {
  id: string;
  /** Source step name without its number, e.g. `Class`. */
  name: string;
  /** The step's position in the presented sequence, starting at one. */
  number: number;
  /** Value of the step's primary decision when one is recorded; it replaces the name in the row. */
  chosen?: string;
  /** Outstanding (non-warning) diagnostics for the step's decisions. */
  problems: number;
  /** No outstanding problems and at least one recorded decision (or nothing to decide, once visited). */
  done: boolean;
}

function StepMarker({
  number,
  done,
  current,
}: {
  number: number;
  done: boolean;
  current: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-sm tabular-nums transition-colors duration-(--motion-fast)',
        current
          ? 'bg-primary text-primary-foreground'
          : done
            ? 'bg-muted text-foreground'
            : 'bg-muted text-muted-foreground',
      )}
    >
      {done && !current ? '✓' : number}
    </span>
  );
}

export function StepRail({
  title,
  reference,
  steps,
  currentIndex,
  onSelect,
  footer,
}: {
  /** The heading above the steps. */
  title: string;
  /** The rulebook reference beside the heading. */
  reference: RuleReference;
  steps: RailStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
  /** Step navigation, under the progress bar (V96). */
  footer?: React.ReactNode;
}) {
  const completed = steps.filter(step => step.done).length;
  const percent = steps.length ? Math.round((completed / steps.length) * 100) : 0;
  return (
    <nav
      aria-label="Steps"
      className="flex flex-col rounded-lg bg-card p-4"
      data-wizard-pane="rail"
    >
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-base font-medium">{title}</h2>
        <RuleLink {...reference} />
      </div>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        Step {currentIndex + 1} of {steps.length}
      </p>
      <ol className="-mx-2 m-0 flex list-none flex-col p-0">
        {steps.map((step, index) => {
          const current = index === currentIndex;
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                // The visible text is the chosen value once there is one, so the accessible name
                // keeps the step it belongs to and still contains what the row reads.
                aria-label={
                  step.chosen
                    ? `${step.number}. ${step.name}: ${step.chosen}`
                    : `${step.number}. ${step.name}`
                }
                title={step.chosen ? `${step.name}: ${step.chosen}` : step.name}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-(--motion-fast) hover:bg-muted',
                  current
                    ? 'font-medium text-foreground'
                    : step.done
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
                onClick={() => onSelect(index)}
              >
                <StepMarker number={step.number} done={step.done} current={current} />
                {/* Once a step is decided its value stands in for the step name (V96): the rail
                    reads back the hero rather than repeating the book's step list. The outstanding
                    count still shows, since a step can be decided and still owe sub-choices. */}
                <span className="min-w-0 flex-1 truncate">{step.chosen ?? step.name}</span>
                {step.problems > 0 && (
                  <Badge variant="outline" aria-label={`${step.problems} to resolve`}>
                    {step.problems}
                  </Badge>
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col gap-3 pt-3">
        <div
          role="progressbar"
          aria-label="Steps completed"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={completed}
          aria-valuetext={`${completed} of ${steps.length} steps completed`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-placeholder"
        >
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-(--motion-slow) ease-(--motion-ease)"
            style={{ width: `${percent}%` }}
          />
        </div>
        {footer}
      </div>
    </nav>
  );
}
