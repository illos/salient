// SPDX-License-Identifier: GPL-3.0-only
/**
 * V164 level-up, first design pass (docs/character-wizard-spec.md#level-up): the character builder's
 * layout in a level-up mode. Only the new level's steps are shown, the earlier build is fixed, and a
 * review step previews the result before it is taken. Every write uses the shared character API
 * (`characters:saveAdvancement`, `characters:finalizeAdvancement`); no rules are resolved here.
 */
import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DraftSelection } from '../../shared/characterDraft';
import type {
  CharacterChoiceOrigins,
  EvaluationResult,
  SelectionValue,
} from '../../shared/contracts/characterEvaluation';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { changeChoice } from '../../shared/evaluate/choiceTransition';
import { reconciledCurrent } from '../../shared/evaluate/liveReconciliation';
import { indexDecisions, isAvailable, type Selections } from '../../shared/evaluate/structure';
import type { Decision, Step } from '../../shared/evaluate/definitions';
import { DecisionEditor } from '../wizard';
import { HeroSoFar } from '../wizard/hero-so-far';
import { StepRail, type RailStep } from '../wizard/rail';
import { StepNav } from '../wizard/choice-list';
import { decisionLabel } from '../wizard/presentation';
import { Button, buttonVariants } from '../components/ui/button';
import { Loading, Notice, useCommand } from '../ui';

interface Progression {
  revision: number;
  baseRevisionId: Id<'characterRevisions'> | null;
  fromLevel: number;
  targetLevel: number;
  pendingLevelUps: number;
  eligible: boolean;
  reason: string | null;
  baseSelections: DraftSelection[];
  choiceOrigins: CharacterChoiceOrigins;
  newDecisionIds: string[];
  draft: { version: number; selections: DraftSelection[]; targetLevel: number } | null;
  draftIsStale: boolean;
}

const STICKY_PANE = 'sticky top-4 max-h-[calc(100dvh_-_2rem)] overflow-y-auto';
const REFERENCE = {
  id: 'mcdm.heroes.v1/chapter/making-a-hero',
  label: 'Making a Hero: Heroic Advancement',
};
const selectionMap = (items: DraftSelection[]): Selections =>
  Object.fromEntries(items.map(item => [item.decisionId, item.value as SelectionValue]));
const names = (evaluation: EvaluationResult | undefined) => {
  const b = evaluation?.baseline ?? evaluation?.partial;
  return new Set([
    ...(b?.features ?? []).map(f => f.name),
    ...(b?.abilities ?? []).map(a => a.name),
  ]);
};

export function LevelUpPage({ characterId }: { characterId: Id<'characters'> }) {
  const progression = useQuery(api.characters.progression, { characterId }) as
    Progression | undefined;
  const character = useQuery(api.characters.get, { characterId });
  const [round, setRound] = useState(0);
  // Held above the keyed flow: taking a level refreshes progression, which would otherwise unmount
  // the flow (no level-up left) or remount it on the next level before the result shows.
  const [taken, setTaken] = useState<{ level: number; remaining: number } | null>(null);
  if (!progression || !character) return <Loading>Loading level-up…</Loading>;
  if (taken)
    return (
      <div className="flex flex-col gap-4">
        <Notice role="status">
          {character.authored.name} is now level {taken.level}.
        </Notice>
        <div className="flex flex-wrap gap-3">
          {taken.remaining > 0 && progression.eligible && (
            <Button
              className="rounded-full"
              onClick={() => {
                setTaken(null);
                setRound(n => n + 1);
              }}
            >
              Take the next level-up
            </Button>
          )}
          <Link
            to="/characters/$characterId"
            params={{ characterId }}
            className={buttonVariants({ variant: 'outline', className: 'rounded-full' })}
          >
            Back to the character sheet
          </Link>
        </div>
      </div>
    );
  if (!progression.eligible && !progression.draft)
    return (
      <div className="flex flex-col gap-4">
        <Notice>{progression.reason ?? 'No level-up is available.'}</Notice>
        <Link to="/characters/$characterId" params={{ characterId }}>
          Back to the character sheet
        </Link>
      </div>
    );
  return (
    <LevelUp
      key={`${progression.baseRevisionId}-${round}`}
      characterId={characterId}
      heroName={character.authored.name}
      live={character.liveState}
      combatLocked={character.combatLocked}
      progression={progression}
      onTaken={(level, remaining) => setTaken({ level, remaining })}
    />
  );
}

function LevelUp({
  characterId,
  heroName,
  live,
  combatLocked,
  progression,
  onTaken,
}: {
  characterId: Id<'characters'>;
  heroName: string;
  live: { stamina: number; recoveries: number } | null;
  combatLocked: boolean;
  progression: Progression;
  onTaken: (level: number, remaining: number) => void;
}) {
  // The earlier build is frozen for this flow; only the new level's decisions can change.
  const [base] = useState(() => ({
    revision: progression.revision,
    id: progression.baseRevisionId,
    fromLevel: progression.fromLevel,
    targetLevel: progression.targetLevel,
    selections: progression.baseSelections,
    definitions: getDefinitions(progression.targetLevel, progression.choiceOrigins),
  }));
  const { definitions, targetLevel, fromLevel } = base;
  const newIds = useMemo(() => new Set(progression.newDecisionIds), [progression.newDecisionIds]);
  const [choices, setChoices] = useState<Selections>(() =>
    selectionMap(progression.draftIsStale ? [] : (progression.draft?.selections ?? [])),
  );
  const [draftVersion, setDraftVersion] = useState(progression.draft?.version ?? 0);
  // A stale draft (another base or level) is dropped: its choices are not loaded, and the first save
  // replaces it.
  const [dirty, setDirty] = useState(progression.draftIsStale);
  const [message, setMessage] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const save = useMutation(api.characters.saveAdvancement);
  const finalize = useMutation(api.characters.finalizeAdvancement);
  const command = useCommand();
  const merged = { ...selectionMap(base.selections), ...choices };
  const newSelections = draftSelectionsFrom(merged, definitions).filter(s =>
    newIds.has(s.decisionId),
  );
  const fresh = useQuery(api.characters.evaluate, {
    characterId,
    context: 'progression',
    selections: [...base.selections, ...newSelections],
    targetLevel,
  }) as EvaluationResult | undefined;
  // Each choice changes the query's arguments, and a new query reads as loading. Keep showing the
  // last result meanwhile so the hero panel doesn't flash back to "Pending"; diagnostics, rail
  // progress and readiness use only `fresh`, so a stale result never marks a made choice missing.
  const [latest, setLatest] = useState(fresh);
  if (fresh && fresh !== latest) setLatest(fresh);
  const evaluation = fresh ?? latest;
  const before = useQuery(api.characters.evaluate, {
    characterId,
    context: 'progression',
    selections: base.selections,
    targetLevel: fromLevel,
  }) as EvaluationResult | undefined;

  // One rail row per choice this level asks of this hero (automatic grants appear in the review),
  // then the review step.
  const index = indexDecisions(definitions);
  // A choice that depends on another of this level's choices (a perk's target) joins its parent's
  // step, directly under it, rather than becoming a later step of its own.
  const available = definitions.steps.flatMap(step =>
    step.decisions
      .filter(d => newIds.has(d.id) && d.kind === 'choice' && isAvailable(d, merged, index))
      .map(decision => ({ step, decision })),
  );
  const availableIds = new Set(available.map(({ decision }) => decision.id));
  const parentOf = (decision: Decision) =>
    [
      decision.availableWhen?.decision,
      ...(decision.conditions ?? []).map(condition => condition.decision),
      ...(decision.dependsOn ?? []),
      ...(decision.dependsOnAny ?? []),
    ].find(id => id !== undefined && id !== decision.id && availableIds.has(id));
  const byId = new Map(available.map(entry => [entry.decision.id, entry.decision]));
  const rootOf = (decision: Decision): string => {
    const seen = new Set<string>();
    let current = decision;
    for (let parent = parentOf(current); parent && !seen.has(parent); parent = parentOf(current)) {
      seen.add(parent);
      current = byId.get(parent)!;
    }
    return current.id;
  };
  const choiceSteps: { step: Step; decisions: Decision[] }[] = [];
  for (const { step, decision } of available) {
    const root = rootOf(decision);
    const group = choiceSteps.find(entry => entry.decisions[0]!.id === root);
    if (group) group.decisions.push(decision);
    else choiceSteps.push({ step: step as Step, decisions: [decision] });
  }
  const problemsFor = (ids: string[]) =>
    ids.reduce(
      (sum, id) =>
        sum +
        (fresh?.diagnostics[id] ?? []).filter(diagnostic => diagnostic.severity !== 'warning')
          .length,
      0,
    );
  const rail: RailStep[] = [
    ...choiceSteps.map(({ decisions }, position) => {
      const decided = decisions.filter(d => merged[d.id] !== undefined).length;
      const problems = problemsFor(decisions.map(d => d.id));
      const chosen = merged[decisions[0]!.id];
      return {
        id: decisions[0]!.id,
        name: decisionLabel(decisions[0]!.id),
        number: position + 1,
        ...(typeof chosen === 'string' ? { chosen } : {}),
        problems,
        choices: decisions.length,
        decided,
        items: [],
        index: position,
        children: [],
        // Not done until the current choices are evaluated (no credit from a kept result).
        done: !!fresh && problems === 0 && decided > 0,
        passed: stepIndex > position,
      };
    }),
    {
      id: 'level-up.review',
      name: 'Review and take',
      number: choiceSteps.length + 1,
      problems: 0,
      choices: 0,
      decided: 0,
      items: [],
      index: choiceSteps.length,
      children: [],
      done: false,
      passed: false,
    },
  ];
  const onReview = stepIndex === choiceSteps.length;
  const current = choiceSteps[stepIndex];
  const stale =
    progression.revision !== base.revision ||
    progression.baseRevisionId !== base.id ||
    (progression.draft?.version ?? 0) > draftVersion;
  const blocked = command.pending || combatLocked || stale;
  const args = base.id
    ? {
        characterId,
        expectedRevision: base.revision,
        expectedBaseRevisionId: base.id,
      }
    : null;

  async function persist(): Promise<number | null> {
    if (!args) return null;
    if (!dirty && draftVersion > 0) return draftVersion;
    let version: number | null = null;
    const ok = await command.run(
      async commandId => {
        version = await save({
          ...args,
          commandId,
          expectedDraftVersion: draftVersion,
          selections: newSelections,
        });
      },
      JSON.stringify(['save-level-up', args, draftVersion, newSelections]),
    );
    if (!ok || version === null) return null;
    setDraftVersion(version);
    setDirty(false);
    return version;
  }
  async function goTo(index: number) {
    if (dirty && !blocked && (await persist()) === null) return;
    setStepIndex(index);
  }
  async function take() {
    if (!args) return;
    const version = await persist();
    if (version === null) return;
    const ok = await command.run(
      commandId => finalize({ ...args, commandId, expectedDraftVersion: version }),
      JSON.stringify(['take-level-up', args, version]),
    );
    if (ok) onTaken(targetLevel, progression.pendingLevelUps - 1);
  }

  // New grants: what the target build has that the earlier build did not.
  const earlier = names(before);
  const gained = [...names(evaluation)].filter(name => !earlier.has(name));
  const baselineAfter = evaluation?.baseline;
  const baselineBefore = before?.baseline;
  const vitals =
    live && baselineAfter && baselineBefore
      ? (
          [
            ['Stamina', 'stamina', 'staminaMaximum'],
            ['Recoveries', 'recoveries', 'recoveriesMaximum'],
          ] as const
        ).map(([label, field, maximum]) => {
          const beforeMax = baselineBefore[maximum].value;
          const afterMax = baselineAfter[maximum].value;
          return {
            label,
            before: `${live[field]} / ${beforeMax}`,
            after: `${reconciledCurrent(field, live[field], beforeMax, afterMax)} / ${afterMax}`,
          };
        })
      : [];
  // Readiness and problems come only from the current choices' evaluation, never the kept one.
  const ready = fresh?.status === 'complete';
  const previous = stepIndex > 0 ? rail[stepIndex - 1] : undefined;
  const next = stepIndex < rail.length - 1 ? rail[stepIndex + 1] : undefined;

  return (
    <div className="-mt-6" data-wizard-shell data-level-up>
      <div className="grid grid-cols-[224px_minmax(0,1fr)_330px] items-start gap-(--page-gap)">
        <div className={STICKY_PANE}>
          <p className="mb-4 text-sm text-muted-foreground">
            Level {fromLevel} → {targetLevel}
            {progression.pendingLevelUps > 1
              ? ` · ${progression.pendingLevelUps} level-ups pending`
              : ''}
          </p>
          <StepRail
            title="Level Up"
            reference={REFERENCE}
            steps={rail}
            currentIndex={stepIndex}
            onSelect={index => void goTo(index)}
            footer={
              <StepNav
                previous={previous?.name}
                next={next?.name}
                onPrevious={() => void goTo(stepIndex - 1)}
                onNext={() => void goTo(stepIndex + 1)}
                finishLabel={command.pending ? 'Saving…' : `Take level ${targetLevel}`}
                finishDisabled={blocked || !ready}
                onFinish={() => void take()}
              />
            }
          />
        </div>
        <div className="flex min-w-0 flex-col gap-(--page-gap)">
          {combatLocked && <Notice>Level-up is locked during combat.</Notice>}
          {stale && (
            <Notice role="status">
              This character or its level-up draft changed since the level-up opened.{' '}
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </Notice>
          )}
          {progression.draftIsStale && (
            <Notice>
              An earlier level-up draft was for a different build or level and has been set aside.
            </Notice>
          )}
          {message && <Notice role="status">{message}</Notice>}
          {!onReview && current && (
            <section
              className="flex flex-col gap-5 rounded-lg bg-card p-6"
              aria-label="Level-up step"
            >
              <h2 className="m-0">{rail[stepIndex]!.name}</h2>
              <fieldset disabled={blocked} className="m-0 min-w-0 space-y-5 border-0 p-0">
                <legend className="sr-only">Level {targetLevel} choices</legend>
                {current.decisions.map(decision => (
                  <DecisionEditor
                    key={decision.id}
                    definitions={definitions}
                    decision={decision}
                    step={current.step as Step}
                    selections={merged}
                    authored={{ name: heroName, appearance: '', biography: '', notes: '' }}
                    onAuthored={() => undefined}
                    diagnostics={fresh?.diagnostics[decision.id]}
                    onSelect={(id, value) => {
                      if (blocked || !newIds.has(id)) return;
                      setChoices(previousChoices => {
                        const pruned = changeChoice(
                          { ...selectionMap(base.selections), ...previousChoices },
                          definitions,
                          id,
                          value,
                        );
                        return Object.fromEntries(
                          Object.entries(pruned.selections).filter(([key]) => newIds.has(key)),
                        );
                      });
                      setDirty(true);
                      setMessage('');
                    }}
                  />
                ))}
              </fieldset>
            </section>
          )}
          {!onReview && next && (
            // The step's own footer, as in the character builder: the same move the rail offers.
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card px-6 py-4">
              <p className="m-0 text-sm text-muted-foreground">
                Earlier choices stay as they are; only level {targetLevel}’s choices are open.
              </p>
              <Button
                type="button"
                className="rounded-full"
                onClick={() => void goTo(stepIndex + 1)}
              >
                Continue to {next.name} <span aria-hidden>→</span>
              </Button>
            </div>
          )}
          {onReview && (
            <section className="flex flex-col gap-5 rounded-lg bg-card p-6" aria-label="Review">
              <h2 className="m-0">Review level {targetLevel}</h2>
              {vitals.length > 0 && (
                <table className="w-auto text-base">
                  <caption className="text-left text-sm text-muted-foreground">
                    Damage taken and Recoveries spent stay the same.
                  </caption>
                  <thead>
                    <tr>
                      <th className="pr-6 text-left font-medium" scope="col" />
                      <th className="pr-6 text-left font-medium" scope="col">
                        Now
                      </th>
                      <th className="text-left font-medium" scope="col">
                        After
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitals.map(row => (
                      <tr key={row.label}>
                        <th className="pr-6 text-left font-normal" scope="row">
                          {row.label}
                        </th>
                        <td className="pr-6 tabular-nums">{row.before}</td>
                        <td className="tabular-nums">{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div>
                <h3 className="m-0 text-base">New at level {targetLevel}</h3>
                {gained.length ? (
                  <ul className="mt-2 mb-0 flex list-none flex-wrap gap-2 p-0">
                    {gained.map(name => (
                      <li key={name} className="rounded-md bg-muted px-3 py-1 text-base">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 text-sm text-muted-foreground">
                    {evaluation && before ? 'No newly named features or abilities.' : 'Evaluating…'}
                  </p>
                )}
              </div>
              {!ready && <Notice>Finish this level’s choices before taking it.</Notice>}
              <div>
                <Button
                  className="rounded-full"
                  disabled={blocked || !ready}
                  onClick={() => void take()}
                >
                  {command.pending ? 'Saving…' : `Take level ${targetLevel}`}
                </Button>
              </div>
            </section>
          )}
        </div>
        <div className={STICKY_PANE}>
          <HeroSoFar
            action={
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={blocked || !dirty}
                onClick={() => void persist().then(v => v !== null && setMessage('Choices saved.'))}
              >
                {command.pending ? 'Saving…' : 'Save choices'}
              </Button>
            }
            // While loading, show the kept build without its outdated outstanding choices.
            evaluation={fresh ?? (latest ? { ...latest, diagnostics: {} } : undefined)}
            heroName={heroName}
            sourceReference={REFERENCE}
          />
        </div>
      </div>
    </div>
  );
}
