// SPDX-License-Identifier: GPL-3.0-only
/** Scoped advancement and immutable build history. Every write uses the shared character API. */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DraftSelection } from '../../shared/characterDraft';
import type { EvaluationResult, SelectionValue } from '../../shared/contracts/characterEvaluation';
import type { CharacterSheet, HeroSheet } from '../../shared/contracts/characterSheet';
import type { BuildReconciliation } from '../../shared/contracts/liveState';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import type { Selections } from '../../shared/evaluate/structure';
import { DecisionEditor } from '../wizard';
import { HeroSoFar } from '../wizard/hero-so-far';
import { decisionLabel } from '../wizard/presentation';
import { Button } from '../components/ui/button';
import { RuleLink } from '../rules/link';
import { readableRuleText } from '../rules/reference';
import { Loading, Notice, useCommand } from '../ui';

const definitions = getDefinitions(2);
const firstLevelIds = new Set(getDefinitions(1).steps.flatMap(s => s.decisions.map(d => d.id)));
const newDecisions = definitions.steps.flatMap(step =>
  step.decisions
    .filter(decision => !firstLevelIds.has(decision.id))
    .map(decision => ({ step, decision })),
);
const newIds = new Set(newDecisions.map(({ decision }) => decision.id));
type OwnedCharacter = FunctionReturnType<typeof api.characters.get>;
interface Advancement {
  revision: number;
  baseRevisionId: Id<'characterRevisions'> | null;
  baseLevel: number;
  targetLevel: number;
  eligible: boolean;
  reason: string | null;
  xp: number;
  entryLevelXpOffset: number;
  requiredXp: number;
  baseSelections: DraftSelection[];
  draft: {
    version: number;
    selections: DraftSelection[];
    baseRevisionId: Id<'characterRevisions'>;
  } | null;
  draftIsStale: boolean;
}
interface HistoryEntry {
  id: Id<'characterRevisions'>;
  revision: number;
  level: number;
  kind: string;
  status: string;
  createdAt: number;
  parentRevisionId: Id<'characterRevisions'> | null;
  restoredFromRevisionId: Id<'characterRevisions'> | null;
  isEffective: boolean;
  isDraft: boolean;
}
interface HistorySnapshot {
  entry: HistoryEntry;
  evaluation: EvaluationResult | null;
  selections: DraftSelection[];
  activationPreview: BuildReconciliation | null;
}
function selectionMap(items: DraftSelection[]): Selections {
  return Object.fromEntries(items.map(item => [item.decisionId, item.value as SelectionValue]));
}

/** A preview displays recorded or proposed maxima, never current gameplay resources. */
function BuildPreview({ evaluation, name }: { evaluation?: EvaluationResult; name: string }) {
  const baseline = evaluation?.baseline ?? evaluation?.partial;
  // Use this evaluation's recorded provenance, including its quotation. A historical
  // Elementalist (or incomplete ancestry-only build) must not inherit Fury attribution.
  const identity = baseline?.class ?? baseline?.ancestry;
  const source = identity?.provenance.find(item => item.source.quote)?.source;
  if (!evaluation) return <Loading>Evaluating build…</Loading>;
  if (!source)
    return (
      <Notice>
        No sourced build summary was recorded. Inspect the recorded choices for this revision.
      </Notice>
    );
  const sourceReference = {
    sourcePath: source.path,
    label: `${identity!.value} ${baseline?.class ? 'class' : 'ancestry'} selection`,
  };
  const grants = [
    ...(baseline?.traits ?? []),
    ...(baseline?.features ?? []),
    ...(baseline?.perks ?? []),
    ...(baseline?.abilities ?? []),
  ];
  return (
    <div className="rounded-md border p-4">
      <HeroSoFar
        evaluation={evaluation}
        heroName={name}
        sourceReference={sourceReference}
        sourceExcerpt={readableRuleText(source.quote)}
      />
      {grants.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-base">Grant sources</h3>
          <ul className="mt-2 flex list-none flex-wrap gap-3 p-0">
            {grants.map((grant, i) => (
              <li key={`${grant.name}-${i}`} className="flex items-center gap-2 text-sm">
                <span>{grant.name}</span>
                <RuleLink sourcePath={grant.sourcePath} label={grant.name} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AdvancementEditor({
  characterId,
  character,
  progression,
  reload,
}: {
  characterId: Id<'characters'>;
  character: OwnedCharacter;
  progression: Advancement;
  reload: () => void;
}) {
  // Freeze the edit base. Reactive updates must never overwrite an unsaved local choice or
  // silently rebase it onto a different effective build or another tab's saved draft.
  const [base] = useState(() => ({
    revision: progression.revision,
    id: progression.baseRevisionId,
    selections: progression.baseSelections,
  }));
  const [choices, setChoices] = useState<Selections>(() =>
    selectionMap(progression.draftIsStale ? [] : (progression.draft?.selections ?? [])),
  );
  const [draftVersion, setDraftVersion] = useState(progression.draft?.version ?? 0);
  const [dirty, setDirty] = useState(false);
  const [duringRespite, setDuringRespite] = useState(false);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState('');
  const save = useMutation(api.characters.saveAdvancement);
  const finalize = useMutation(api.characters.finalizeAdvancement);
  const command = useCommand();
  const newSelections = draftSelectionsFrom(choices, definitions).filter(s =>
    newIds.has(s.decisionId),
  );
  const merged = [...base.selections, ...newSelections];
  const evaluation = useQuery(api.characters.evaluate, {
    selections: merged,
    targetLevel: 2,
  }) as EvaluationResult | undefined;
  const stale =
    progression.revision !== base.revision ||
    progression.baseRevisionId !== base.id ||
    (progression.draft?.version ?? 0) > draftVersion;
  const blocked =
    command.pending || character.combatLocked || stale || !progression.eligible || finished;
  const args = base.id
    ? {
        characterId,
        expectedRevision: base.revision,
        expectedBaseRevisionId: base.id,
        expectedDraftVersion: draftVersion,
      }
    : null;
  return (
    <section aria-label="Level advancement" className="flex flex-col gap-4">
      <h2>Advance Fury to level 2</h2>
      <p className="m-0 text-sm">
        Keep your earlier choices and add this level’s grants. Advancement takes place during a
        respite; this action does not heal or refill resources and needs no Director approval.
      </p>
      <p className="m-0 text-sm">
        Campaign XP: {progression.xp}; entry-level credit: {progression.entryLevelXpOffset}. Level 2
        requires {progression.requiredXp} cumulative XP.
      </p>
      {!progression.eligible && !finished && <Notice>{progression.reason}</Notice>}
      {character.combatLocked && <Notice>Progression is locked during combat.</Notice>}
      {stale && !finished && (
        <Notice role="status">
          The character or advancement draft changed. Your local choices are still shown. Reload the
          latest build before saving or advancing.
          <Button variant="outline" className="ml-3" onClick={reload}>
            Reload latest build
          </Button>
        </Notice>
      )}
      {progression.draftIsStale && !stale && !finished && (
        <Notice>
          The previous advancement draft belongs to an older build. Save new level-two choices for
          this build.
        </Notice>
      )}
      {message && <Notice role="status">{message}</Notice>}
      {!finished && base.id && progression.baseLevel === 1 && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <fieldset disabled={blocked} className="min-w-0 space-y-5">
              <legend className="sr-only">New level-two choices</legend>
              {newDecisions.map(({ decision, step }) => (
                <DecisionEditor
                  key={decision.id}
                  definitions={definitions}
                  decision={decision}
                  step={step}
                  selections={{ ...selectionMap(base.selections), ...choices }}
                  authored={character.authored}
                  onAuthored={() => undefined}
                  diagnostics={evaluation?.diagnostics[decision.id]}
                  onSelect={(id, value) => {
                    if (blocked || !newIds.has(id)) return;
                    setChoices(previous => {
                      const next = { ...previous };
                      if (value === undefined) delete next[id];
                      else next[id] = value;
                      return next;
                    });
                    setDirty(true);
                    setMessage('');
                  }}
                />
              ))}
            </fieldset>
            <Button
              disabled={blocked || !args}
              onClick={async () => {
                if (!args) return;
                const ok = await command.run(
                  async commandId => {
                    const version = await save({ ...args, commandId, selections: newSelections });
                    setDraftVersion(version);
                  },
                  JSON.stringify(['save-advancement', args, newSelections]),
                );
                if (ok) {
                  setDirty(false);
                  setMessage('Advancement draft saved.');
                }
              }}
            >
              Save advancement draft
            </Button>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={duringRespite}
                disabled={blocked}
                onChange={event => setDuringRespite(event.target.checked)}
              />
              This advancement occurs during a respite
            </label>
            <Button
              disabled={
                blocked ||
                !args ||
                dirty ||
                draftVersion === 0 ||
                !duringRespite ||
                evaluation?.status !== 'complete'
              }
              onClick={async () => {
                if (!args) return;
                const ok = await command.run(
                  commandId => finalize({ ...args, commandId, duringRespite }),
                  JSON.stringify(['finalize-advancement', args, duringRespite]),
                );
                if (ok) {
                  setFinished(true);
                  setMessage(
                    'Advanced to level 2. The active sheet and build history have been updated.',
                  );
                }
              }}
            >
              Advance to level 2
            </Button>
            {dirty && (
              <p className="m-0 text-sm text-muted-foreground">
                Save these choices before advancing.
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Proposed level-two build. Current resources are unchanged.
            </p>
            <BuildPreview evaluation={evaluation} name={character.authored.name} />
          </div>
        </div>
      )}
    </section>
  );
}

function OwnerAdvancement({
  characterId,
  character,
}: {
  characterId: Id<'characters'>;
  character: OwnedCharacter;
}) {
  const progression = useQuery(api.characters.progression, { characterId }) as
    Advancement | undefined;
  const [reloadVersion, setReloadVersion] = useState(0);
  if (!progression) return <Loading>Loading advancement…</Loading>;
  return (
    <AdvancementEditor
      key={`${characterId}-${reloadVersion}`}
      characterId={characterId}
      character={character}
      progression={progression}
      reload={() => setReloadVersion(n => n + 1)}
    />
  );
}

function BuildHistory({
  characterId,
  sheet,
  character,
}: {
  characterId: Id<'characters'>;
  sheet: HeroSheet;
  character?: OwnedCharacter;
}) {
  const history = usePaginatedQuery(
    api.characters.history,
    { characterId },
    { initialNumItems: 12 },
  );
  const entries = history.results as HistoryEntry[];
  const [selected, setSelected] = useState<{
    id: Id<'characterRevisions'>;
    expectedRevision: number | null;
    expectedEffectiveRevisionId: Id<'characterRevisions'> | null;
  } | null>(null);
  const snapshot = useQuery(
    api.characters.historySnapshot,
    selected ? { characterId, revisionId: selected.id } : 'skip',
  ) as HistorySnapshot | undefined;
  const restore = useMutation(api.characters.restore);
  const command = useCommand();
  const [message, setMessage] = useState('');
  const changed =
    !!selected &&
    !!character &&
    (selected.expectedRevision !== character.revision ||
      selected.expectedEffectiveRevisionId !== character.effectiveRevisionId);
  return (
    <section aria-label="Build history" className="mt-10 flex flex-col gap-4 border-t pt-6">
      <h2>Build history</h2>
      <p className="m-0 text-sm">
        Browse recorded builds without changing the active sheet or current resources. Later history
        is retained when you restore.
      </p>
      {history.status === 'LoadingFirstPage' ? (
        <Loading>Loading history…</Loading>
      ) : (
        <ol className="m-0 list-none space-y-2 p-0">
          {entries.map(entry => (
            <li key={entry.id}>
              <Button
                variant={selected?.id === entry.id ? 'default' : 'outline'}
                onClick={() => {
                  setSelected({
                    id: entry.id,
                    expectedRevision: character?.revision ?? null,
                    expectedEffectiveRevisionId: character?.effectiveRevisionId ?? null,
                  });
                  setMessage('');
                }}
              >
                Revision {entry.revision} · level {entry.level} · {entry.kind.replaceAll('-', ' ')}{' '}
                · {entry.status}
                {entry.isEffective ? ' · Active' : ''}
                {entry.isDraft ? ' · Draft' : ''}
              </Button>
              <span className="ml-3 text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
      {history.status !== 'Exhausted' && history.status !== 'LoadingFirstPage' && (
        <Button
          variant="outline"
          disabled={history.status === 'LoadingMore'}
          onClick={() => history.loadMore(12)}
        >
          {history.status === 'LoadingMore' ? 'Loading…' : 'Load older builds'}
        </Button>
      )}
      {message && <Notice role="status">{message}</Notice>}
      {selected && !snapshot && <Loading>Loading recorded build…</Loading>}
      {snapshot && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3>
              Recorded revision {snapshot.entry.revision} · Level {snapshot.entry.level}
            </h3>
            <Notice>
              This is a read-only recorded build. Present inventory, authored details and current
              resources are unchanged.
            </Notice>
            {character && (
              <>
                <p className="m-0 text-sm">
                  {snapshot.entry.status !== 'complete'
                    ? 'Restoring this unfinished build creates a new private draft. It does not submit for review or replace the active build. Continue its choices in Edit.'
                    : character.campaignId
                      ? 'Restoring creates a new build and submits it for Director review. Your active build changes only after approval. A Director restoring their own character is approved automatically.'
                      : 'Restoring creates and activates a new recorded build. Later history, present inventory and authored details are retained.'}
                </p>
                <p className="m-0 text-sm">
                  Current Stamina and Recoveries are retained up to the restored maxima; this does
                  not heal or refill resources.
                </p>
                {snapshot.activationPreview && (
                  <ul className="m-0 list-none p-0 text-sm" aria-label="Restore resource preview">
                    {snapshot.activationPreview.changes.map(change => (
                      <li key={change.field}>
                        {change.field}: {change.currentBefore}/{change.maximumBefore ?? '—'} →{' '}
                        {change.currentAfter}/{change.maximumAfter}
                      </li>
                    ))}
                  </ul>
                )}
                {snapshot.activationPreview?.incompatibleResource && (
                  <Notice>
                    The heroic resource changes; activation requires explicit resource
                    reconciliation.
                  </Notice>
                )}
                {changed && (
                  <Notice>
                    The character changed since you opened this build. Select its revision again to
                    reload the restore preview.
                  </Notice>
                )}
                {sheet.combatLocked && <Notice>Restoration is locked during combat.</Notice>}
                <Button
                  disabled={
                    command.pending ||
                    changed ||
                    sheet.combatLocked ||
                    selected?.expectedRevision === null
                  }
                  onClick={async () => {
                    if (!selected || selected.expectedRevision === null) return;
                    const args = {
                      characterId,
                      expectedRevision: selected.expectedRevision,
                      sourceRevisionId: selected.id,
                      expectedEffectiveRevisionId: selected.expectedEffectiveRevisionId,
                    };
                    const ok = await command.run(
                      commandId => restore({ ...args, commandId }),
                      JSON.stringify(['restore', args]),
                    );
                    if (ok)
                      setMessage(
                        snapshot.entry.status !== 'complete'
                          ? 'Recorded choices restored as a new private draft. Open Edit to continue.'
                          : character.campaignId
                            ? 'Restored build submitted. Check the character sheet for its review status.'
                            : 'Recorded build restored as a new active revision.',
                      );
                  }}
                >
                  Restore this build
                </Button>
              </>
            )}
            <details>
              <summary className="cursor-pointer text-sm">Recorded choices</summary>
              <dl className="mt-3 space-y-3 text-sm">
                {snapshot.selections.map(selection => (
                  <div key={selection.decisionId}>
                    <dt className="font-semibold">{decisionLabel(selection.decisionId)}</dt>
                    <dd className="m-0 break-words">
                      {typeof selection.value === 'string'
                        ? selection.value
                        : JSON.stringify(selection.value)}
                    </dd>
                    {selection.sources.map((source, index) => (
                      <RuleLink
                        key={index}
                        sourcePath={source.path}
                        label={decisionLabel(selection.decisionId)}
                      />
                    ))}
                  </div>
                ))}
              </dl>
            </details>
            {!snapshot.evaluation && (
              <Notice>
                This revision has no recorded evaluation. Restore its saved choices as a draft and
                continue in Edit.
              </Notice>
            )}
          </div>
          {snapshot.evaluation && (
            <BuildPreview evaluation={snapshot.evaluation} name={sheet.name} />
          )}
        </div>
      )}
    </section>
  );
}

function AuthorizedProgression({
  characterId,
  sheet,
}: {
  characterId: Id<'characters'>;
  sheet: HeroSheet;
}) {
  // Directors may read history, but the draft/advancement endpoint belongs exclusively to owners.
  const character = useQuery(
    api.characters.get,
    sheet.audience === 'owner' ? { characterId } : 'skip',
  );
  return (
    <>
      {sheet.audience === 'owner' &&
        (character ? (
          <OwnerAdvancement characterId={characterId} character={character} />
        ) : (
          <Loading>Loading character…</Loading>
        ))}
      {sheet.audience === 'director' && (
        <Notice>
          The character owner makes progression choices. You can inspect recorded builds here.
        </Notice>
      )}
      <BuildHistory characterId={characterId} sheet={sheet} character={character} />
    </>
  );
}

export function ProgressionPage({ characterId }: { characterId: Id<'characters'> }) {
  const sheet = useQuery(api.characters.sheet, { characterId }) as CharacterSheet | undefined;
  if (!sheet) return <Loading>Opening progression…</Loading>;
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1>{sheet.name} · Progression</h1>
        <Link to="/characters/$characterId" params={{ characterId }}>
          Back to character sheet
        </Link>
      </header>
      {sheet.audience === 'peer' ? (
        <Notice>Build history is available to the character owner and Director.</Notice>
      ) : (
        <AuthorizedProgression key={characterId} characterId={characterId} sheet={sheet} />
      )}
    </div>
  );
}
