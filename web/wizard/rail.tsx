// SPDX-License-Identifier: GPL-3.0-only
/**
 * The wizard step rail (V21 item 10; Quiet, docs/design-mockups/quiet/README.md; V96 compaction):
 * a `card` panel headed "Character Builder" with the Making a Hero reference, a muted "Step n
 * of m" line, one compact row per presented step — the tonal round badge carries the number and
 * takes the accent on the current step (a check mark once the step is done, an exclamation on a
 * step the hero passed while it still owed a choice), then the step's chosen value, falling back
 * to the step name until it has one — with the completed percentage and its accent progress bar
 * under the heading, and the step navigation and the save action at the foot. The rows are the same
 * step buttons the wizard always had, and the accessible name keeps the step it belongs to
 * (`n. Step name: Chosen`) so the keyboard flow keeps working. The steps come from the caller in
 * presented order; nothing here knows how many there are.
 */
import { cn } from 'cn';
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
  /** Choices this step presents right now, and how many are recorded. */
  choices: number;
  decided: number;
  /** The step's own choices, listed under it while the hero is inside the step. */
  items: { id: string; label: string; done: boolean }[];
  /** Position in the presented sequence, for navigation. */
  index: number;
  /** Steps that depend on this one, such as the kit a class grants. */
  children: RailStep[];
  /** A nested step's section within its parent's page, for the rail's jump. */
  anchor?: string;
  /** No outstanding problems and at least one recorded decision (or nothing to decide, once visited). */
  done: boolean;
  /** The hero moved past this step: an outstanding choice here is something they left behind. */
  passed: boolean;
}

function StepMarker({
  number,
  done,
  current,
  unresolved,
}: {
  number: number;
  done: boolean;
  current: boolean;
  /** Passed, not current, and still owing a choice. */
  unresolved: boolean;
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
      {done && !current ? '✓' : unresolved ? '!' : number}
    </span>
  );
}

function StepRow({
  step,
  currentIndex,
  onSelect,
  onSelectItem,
  nested,
}: {
  step: RailStep;
  currentIndex: number;
  onSelect: (index: number) => void;
  onSelectItem?: (decisionId: string) => void;
  /** A step that depends on its parent, such as the kit a class grants. */
  nested?: boolean;
}) {
  const current = step.index === currentIndex;
  // A nested row is a section of this page, not a step of its own, so it shows exactly when its
  // section has something to offer. It shares its parent's index, so "is it current" says nothing.
  const visibleChildren = step.children.filter(child => child.choices > 0);
  return (
    <li>
      <button
        type="button"
        aria-current={current ? 'step' : undefined}
        // The visible text is the chosen value once there is one, so the accessible name keeps
        // the step it belongs to and still contains what the row reads.
        aria-label={step.chosen ? `${step.name}: ${step.chosen}` : step.name}
        title={step.chosen ? `${step.name}: ${step.chosen}` : step.name}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md py-1.5 pr-2 text-left text-sm transition-colors duration-(--motion-fast) hover:bg-muted',
          'pl-2',
          current
            ? 'bg-muted font-medium text-foreground'
            : step.done
              ? 'text-foreground'
              : 'text-muted-foreground',
        )}
        onClick={() => {
          onSelect(step.index);
          if (step.anchor) onSelectItem?.(step.anchor);
        }}
      >
        {nested ? (
          // The bullet sits in a badge-sized box, so it centres on the numbers above it.
          <span aria-hidden className="flex size-6 shrink-0 items-center justify-center">
            <span
              className={cn(
                'size-1.5 rounded-full',
                current ? 'bg-primary' : step.done ? 'bg-foreground' : 'bg-placeholder',
              )}
            />
          </span>
        ) : (
          <StepMarker
            number={step.number}
            done={step.done}
            current={current}
            unresolved={!current && step.passed && step.problems > 0}
          />
        )}
        {/* Once a step is decided its value stands in for the step name (V96): the rail reads
            back the hero rather than repeating the book's step list. The count still shows, since
            a step can be decided and still owe sub-choices. */}
        <span className="min-w-0 flex-1 truncate">{step.chosen ?? step.name}</span>
        {step.choices > 0 && (
          <span
            className="shrink-0 text-sm tabular-nums text-muted-foreground"
            aria-label={`${step.decided} of ${step.choices} chosen`}
          >
            {step.decided}/{step.choices}
          </span>
        )}
      </button>
      {/* Inside a step, its own choices list under it, and picking one jumps to it. */}
      {current && step.items.length > 0 && (
        <ol className="m-0 mb-1 flex list-none flex-col p-0">
          {step.items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md py-1 pr-2 text-left text-sm text-muted-foreground transition-colors duration-(--motion-fast) hover:bg-muted hover:text-foreground',
                  'pl-2',
                )}
                onClick={() => onSelectItem?.(item.id)}
              >
                <span aria-hidden className="flex size-6 shrink-0 items-center justify-center">
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      item.done ? 'bg-foreground' : 'bg-placeholder',
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {/* A dependent step sits under the one it depends on, and appears only once it applies: a
          kit shows when the chosen class grants one. */}
      {visibleChildren.length > 0 && (
        <ol className="m-0 flex list-none flex-col p-0">
          {visibleChildren.map(child => (
            <StepRow
              key={child.id}
              step={child}
              currentIndex={currentIndex}
              onSelect={onSelect}
              onSelectItem={onSelectItem}
              nested
            />
          ))}
        </ol>
      )}
    </li>
  );
}

export function StepRail({
  title,
  reference,
  steps,
  currentIndex,
  onSelect,
  onSelectItem,
  footer,
  save,
}: {
  /** The heading above the steps. */
  title: string;
  /** The rulebook reference beside the heading. */
  reference: RuleReference;
  steps: RailStep[];
  currentIndex: number;
  onSelect: (index: number) => void;
  /** Jump to one of the current step's choices. */
  onSelectItem?: (decisionId: string) => void;
  /** Step navigation, at the foot of the rail (V96). */
  footer?: React.ReactNode;
  /** Saving the hero, under the rail (V96). */
  save?: React.ReactNode;
}) {
  // Count the whole tree: a nested step is still a step of the build, and `currentIndex` is a
  // position in the presented sequence rather than in this list.
  const all = steps.flatMap(step => [step, ...step.children]);
  const completed = all.filter(step => step.done).length;
  const percent = all.length ? Math.round((completed / all.length) * 100) : 0;
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
      <div className="mt-1 mb-2 flex items-baseline justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Step {currentIndex + 1} of {all.length}
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Steps completed"
        aria-valuemin={0}
        aria-valuemax={all.length}
        aria-valuenow={completed}
        aria-valuetext={`${completed} of ${all.length} steps completed`}
        className="mb-3 h-1 w-full overflow-hidden rounded-full bg-placeholder"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-(--motion-slow) ease-(--motion-ease)"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="-mx-2 m-0 flex list-none flex-col p-0">
        {steps.map(step => (
          <StepRow
            key={step.id}
            step={step}
            currentIndex={currentIndex}
            onSelect={onSelect}
            onSelectItem={onSelectItem}
          />
        ))}
      </ol>
      <div className="flex flex-col gap-2 pt-3">
        {footer}
        {save}
      </div>
    </nav>
  );
}
