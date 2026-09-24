// SPDX-License-Identifier: GPL-3.0-only
/** Scoped advancement and immutable build history. Every write uses the shared character API. */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DraftSelection } from '../../shared/characterDraft';
import type {
  CharacterChoiceOrigins,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation';
import type { CharacterSheet, HeroSheet } from '../../shared/contracts/characterSheet';
import type { BuildReconciliation } from '../../shared/contracts/liveState';
import { HeroSoFar } from '../wizard/hero-so-far';
import { decisionLabel } from '../wizard/presentation';
import { Button } from '../components/ui/button';
import { RuleLink } from '../rules/link';
import { readableRuleText } from '../rules/reference';
import { Loading, Notice, useCommand } from '../ui';

type OwnedCharacter = FunctionReturnType<typeof api.characters.get>;
interface Advancement {
  revision: number;
  baseRevisionId: Id<'characterRevisions'> | null;
  baseLevel: number;
  targetLevel: number;
  fromLevel: number;
  eligible: boolean;
  reason: string | null;
  xp: number;
  entryLevelXpOffset: number;
  pendingLevelUps: number;
  baseSelections: DraftSelection[];
  choiceOrigins: CharacterChoiceOrigins;
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

/** The Quiet panel each progression section sits in; its previews are `sub` insets. */
const PANEL = 'rounded-lg bg-card p-6';

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
    <div className="rounded-md bg-muted p-4">
      <HeroSoFar
        evaluation={evaluation}
        heroName={name}
        sourceReference={sourceReference}
        sourceExcerpt={readableRuleText(source.quote)}
      />
      {grants.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="text-base">Grant sources</h3>
          <ul className="mt-2 flex list-none flex-wrap gap-3 p-0">
            {grants.map((grant, i) => (
              <li key={`${grant.name}-${i}`} className="flex items-center gap-2 text-base">
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

function OwnerAdvancement({ characterId }: { characterId: Id<'characters'> }) {
  const progression = useQuery(api.characters.progression, { characterId }) as
    Advancement | undefined;
  if (!progression) return <Loading>Loading advancement…</Loading>;
  // A pending level-up is taken in the level-up screen (V164); this page keeps the history.
  if (progression.pendingLevelUps < 1 && !progression.draft) return null;
  return (
    <section aria-label="Level advancement" className={`${PANEL} flex flex-col gap-3`}>
      <h2 className="m-0">Level up to level {progression.targetLevel}</h2>
      <p className="m-0 text-base">
        {progression.pendingLevelUps > 1
          ? `${progression.pendingLevelUps} level-ups are waiting; take them one level at a time.`
          : 'A level-up is waiting.'}
      </p>
      <div>
        <Link to="/characters/$characterId/level-up" params={{ characterId }} className="text-base">
          Open the level-up
        </Link>
      </div>
    </section>
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
    <section aria-label="Build history" className={`${PANEL} mt-4 flex flex-col gap-4`}>
      <h2>Build history</h2>
      <p className="m-0 text-base">
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
              <span className="ml-3 text-sm text-muted-foreground">
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
        <div className="grid items-start gap-6 border-t border-border pt-6 lg:grid-cols-2">
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
                <p className="m-0 text-base">
                  {snapshot.entry.status !== 'complete'
                    ? 'Restoring this unfinished build creates a new private draft. It does not submit for review or replace the active build. Continue its choices in Edit.'
                    : character.campaignId
                      ? 'Restoring creates a new build and submits it for Director review. Your active build changes only after approval. A Director restoring their own character is approved automatically.'
                      : 'Restoring creates and activates a new recorded build. Later history, present inventory and authored details are retained.'}
                </p>
                <p className="m-0 text-base">
                  Damage taken and Recoveries spent stay the same against the restored maxima; this
                  does not heal or refill resources.
                </p>
                {snapshot.activationPreview && (
                  <ul className="m-0 list-none p-0 text-base" aria-label="Restore resource preview">
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
              <summary className="cursor-pointer text-base">Recorded choices</summary>
              <dl className="mt-3 space-y-3 text-base">
                {snapshot.selections.map(selection => (
                  <div key={selection.decisionId}>
                    <dt className="font-medium">{decisionLabel(selection.decisionId)}</dt>
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
          <OwnerAdvancement characterId={characterId} />
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
        <Link
          to="/characters/$characterId"
          params={{ characterId }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
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
