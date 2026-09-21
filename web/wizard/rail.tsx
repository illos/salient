// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard step rail (V21 item 10; Quiet, docs/design-mockups/quiet/README.md; V96 compaction):
 * a `card` panel headed "Character Builder" with the Making a Hero reference, a muted "Step n
 * of m" line, one compact row per presented step — the tonal round badge carries the number and
 * takes the accent on the current step (a check mark once the step is done), the step name, the
 * chosen value in muted at the right — and a rounded progress bar at the bottom. The rows are the
 * same step buttons the wizard always had: the accessible name stays `n. Step name` so the
 * keyboard flow keeps working. The steps come from the caller in presented order; nothing here
 * knows how many there are.
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
}: {
  /** The heading above the steps. */
  title: string;
  /** The rulebook reference beside the heading. */
  reference: RuleReference;
  steps: RailStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  const completed = steps.filter(step => step.done).length;
  const percent = steps.length ? Math.round((completed / steps.length) * 100) : 0;
  return (
    <nav
      aria-label="Steps"
      className="flex h-full min-h-0 flex-col rounded-lg bg-card p-4"
      data-wizard-pane="rail"
    >
      <div className="flex items-center gap-2">
        <h2 className="m-0 text-base font-medium">{title}</h2>
        <RuleLink {...reference} />
      </div>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        Step {currentIndex + 1} of {steps.length}
      </p>
      <ol className="-mx-2 m-0 flex min-h-0 flex-1 list-none flex-col overflow-y-auto p-0">
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
                <span className="min-w-0 flex-1 truncate">{step.name}</span>
                {/* The chosen value and the outstanding count are both shown: a step can be
                    decided and still owe sub-choices. */}
                {step.chosen && (
                  <span className="max-w-[45%] truncate text-xs font-normal text-muted-foreground">
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
      <div className="pt-3">
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
