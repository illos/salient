// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard step rail (V21 item 10; Quiet, docs/design-mockups/quiet/README.md): a `card`
 * panel with a "Step n of m" label, one plain row per presented step — an 8px accent dot marks
 * the current step, a tonal round badge carries the number (a check mark once the step is done),
 * the step name, the chosen value in muted at the right — and a rounded progress bar at the
 * bottom. The rows are the same step buttons the wizard always had: the accessible name stays
 * `n. Step name` so existing tests and the keyboard flow keep working. The steps come from the
 * caller in source order; nothing here knows how many there are.
 */
import { cn } from 'cn';
import { Badge } from '../components/ui/badge';

export interface RailStep {
  id: string;
  /** Source step name without its number, e.g. `Class`. */
  name: string;
  /** The step's number in the source sequence; the presented list can skip one. */
  number: number;
  /** Label of the step's primary decision when one is recorded. */
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
        'flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-sm tabular-nums',
        done || current ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {done && !current ? '✓' : number}
    </span>
  );
}

export function StepRail({
  steps,
  currentIndex,
  sourceTotal,
  onSelect,
}: {
  steps: RailStep[];
  currentIndex: number;
  /** Steps in the source sequence, which can exceed the steps this milestone presents. */
  sourceTotal: number;
  onSelect: (index: number) => void;
}) {
  const completed = steps.filter(step => step.done).length;
  const percent = steps.length ? Math.round((completed / steps.length) * 100) : 0;
  return (
    <nav
      aria-label="Steps"
      className="flex h-full min-h-0 flex-col rounded-lg bg-card p-5"
      data-wizard-pane="rail"
    >
      <p className="mb-3 text-sm text-muted-foreground">
        Step {steps[currentIndex]?.number ?? currentIndex + 1} of {sourceTotal}
      </p>
      <ol className="-mx-3 m-0 flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0">
        {steps.map((step, index) => {
          const current = index === currentIndex;
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                aria-label={`${step.number}. ${step.name}`}
                title={step.chosen ? `${step.name}: ${step.chosen}` : step.name}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-base transition-colors duration-(--motion-fast) hover:bg-muted',
                  current
                    ? 'font-medium text-foreground'
                    : step.done
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
                onClick={() => onSelect(index)}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    current ? 'bg-primary' : 'bg-transparent',
                  )}
                />
                <StepMarker number={step.number} done={step.done} current={current} />
                <span className="min-w-0 flex-1 truncate">{step.name}</span>
                {/* The chosen value and the outstanding count are both shown: a step can be
                    decided and still owe sub-choices, and hiding the choice loses the mockup's
                    right-aligned value. */}
                {step.chosen && (
                  <span className="max-w-[45%] truncate text-sm font-normal text-muted-foreground">
                    {step.chosen}
                  </span>
                )}
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
      <div className="pt-4">
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
      </div>
    </nav>
  );
}
