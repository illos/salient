// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard step rail (character-wizard-class.png; V21 item 10): a STEP n OF m eyebrow, one row
 * per presented step with a 24px numbered marker (a check mark once the step is done, brick red
 * for the current step), the step name, the chosen value in grey at the right, and a thin
 * progress bar at the bottom. The rows are the same step buttons the wizard always had: the
 * accessible name stays `n. Step name` so existing tests and the keyboard flow keep working.
 * The steps come from the caller in source order; nothing here knows how many there are.
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
        'flex size-6 shrink-0 items-center justify-center rounded-full border text-2xs font-bold tabular-nums',
        done && !current
          ? 'border-foreground bg-foreground text-background'
          : current
            ? 'border-primary text-primary'
            : 'border-input text-muted-foreground',
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
    <nav aria-label="Steps" className="flex h-full min-h-0 flex-col" data-wizard-pane="rail">
      <p className="eyebrow mb-3 px-(--pane-padding-x) pt-(--pane-padding-y)">
        Step {steps[currentIndex]?.number ?? currentIndex + 1} of {sourceTotal}
      </p>
      <ol className="m-0 flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0">
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
                  'flex w-full items-center gap-3 border-l-2 py-3 pr-4 pl-[calc(var(--pane-padding-x)-2px)] text-left text-sm transition-colors duration-(--motion-fast) hover:bg-muted',
                  current
                    ? 'border-primary bg-muted font-semibold text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
                onClick={() => onSelect(index)}
              >
                <StepMarker number={step.number} done={step.done} current={current} />
                <span className="min-w-0 flex-1 truncate">{step.name}</span>
                {/* The chosen value and the outstanding count are both shown: a step can be
                    decided and still owe sub-choices, and hiding the choice loses the mockup's
                    right-aligned value. */}
                {step.chosen && (
                  <span className="max-w-[45%] truncate text-xs text-muted-foreground">
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
      <div className="px-(--pane-padding-x) pt-4 pb-(--pane-padding-y)">
        <div
          role="progressbar"
          aria-label="Steps completed"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={completed}
          aria-valuetext={`${completed} of ${steps.length} steps completed`}
          className="h-0.5 w-full bg-placeholder"
        >
          <div className="h-full bg-foreground" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </nav>
  );
}
