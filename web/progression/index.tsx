// SPDX-License-Identifier: GPL-3.0-only
/**
 * The build History page (V185; V32 before it): every recorded revision newest first, the full
 * read-only character sheet of a selected revision from its recorded evaluation, a comparison with
 * the active build, and the owner's "Restore this build". Reads `characters.history` and
 * `characters.historySheet`; restores through `characters.restore`, the same operations the CLI
 * uses (docs/character-wizard-spec.md#5-progression-history). Nothing here computes a game value.
 */
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { cn } from 'cn';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type {
  BuildDifference,
  BuildHistoryEntry,
  CharacterSheet,
  HeroSheet,
  HistorySheet,
  NameChange,
  ValueChange,
} from '../../shared/contracts/characterSheet';
import {
  historyEntryTitle,
  historyKindLabel,
  restoreOutcome,
} from '../../shared/presentation/buildHistory';
import { HeroSheetView } from '../character-sheet';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Eyebrow, Loading, Notice, SectionHeading, useCommand } from '../ui';

/** The Quiet panel each section sits in. */
const PANEL = 'rounded-lg bg-card p-6';

/** A waiting level-up is taken on the level-up screen (V164); History keeps the notice. */
function LevelUpNotice({ characterId }: { characterId: Id<'characters'> }) {
  const progression = useQuery(api.characters.progression, { characterId }) as
    { pendingLevelUps: number; targetLevel: number; draft: unknown } | undefined;
  if (!progression || (progression.pendingLevelUps < 1 && !progression.draft)) return null;
  return (
    <section
      aria-label="Level advancement"
      className={`${PANEL} flex flex-wrap items-center justify-between gap-3`}
    >
      <p className="m-0 text-base">
        {progression.pendingLevelUps > 1
          ? `${progression.pendingLevelUps} level-ups are waiting; take them one level at a time.`
          : `A level-up to level ${progression.targetLevel} is waiting.`}
      </p>
      <Link to="/characters/$characterId/level-up" params={{ characterId }} className="text-base">
        Open the level-up
      </Link>
    </section>
  );
}

function valueRow(label: string, change: ValueChange) {
  const same = change.current === change.snapshot;
  return (
    <div key={label} className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('m-0 tabular-nums', !same && 'font-medium')}>
        {same
          ? (change.snapshot ?? '—')
          : `${change.current ?? '—'} now → ${change.snapshot ?? '—'} in this build`}
      </dd>
    </div>
  );
}

function nameRows(label: string, change: NameChange) {
  if (!change.added.length && !change.removed.length) return null;
  return (
    <div key={label} className="flex flex-col gap-1 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      {change.added.length > 0 && (
        <dd className="m-0">Only in this build: {change.added.join(', ')}</dd>
      )}
      {change.removed.length > 0 && (
        <dd className="m-0">Only in the active build: {change.removed.join(', ')}</dd>
      )}
    </div>
  );
}

/** The server's comparison of the recorded build with the active one; displayed, not computed. */
function DifferenceSummary({ difference }: { difference: BuildDifference }) {
  return (
    <section aria-label="Compared with the active build" className={`${PANEL} flex flex-col gap-3`}>
      <h3 className="m-0">Compared with the active build</h3>
      {!difference.hasCurrent ? (
        <p className="m-0 text-base text-muted-foreground">
          There is no active build yet to compare with.
        </p>
      ) : difference.same ? (
        <p className="m-0 text-base text-muted-foreground">
          Level, maxima and granted features, abilities and perks match the active build.
        </p>
      ) : null}
      <dl className="m-0 flex flex-col divide-y divide-border text-base">
        {valueRow('Level', difference.level)}
        {valueRow('Stamina maximum', difference.staminaMaximum)}
        {valueRow('Recoveries maximum', difference.recoveriesMaximum)}
        {difference.hasCurrent && nameRows('Features', difference.features)}
        {difference.hasCurrent && nameRows('Abilities', difference.abilities)}
        {difference.hasCurrent && nameRows('Perks', difference.perks)}
      </dl>
    </section>
  );
}

interface Expected {
  revision: number;
  effectiveRevisionId: Id<'characterRevisions'> | null;
}

/** The owner's restore action; it states the outcome and uses the shared `characters.restore`. */
function RestorePanel({
  characterId,
  history,
  expected,
}: {
  characterId: Id<'characters'>;
  history: HistorySheet;
  expected: Expected;
}) {
  const character = useQuery(api.characters.get, { characterId });
  const restore = useMutation(api.characters.restore);
  const command = useCommand();
  // The revision this panel created: its outcome is read back from the character, not assumed.
  const [restoredId, setRestoredId] = useState<Id<'characterRevisions'> | null>(null);
  if (!character) return <Loading>Loading character…</Loading>;
  const complete = history.entry.status === 'complete';
  const changed =
    !restoredId &&
    (expected.revision !== character.revision ||
      expected.effectiveRevisionId !== character.effectiveRevisionId);
  const active = history.entry.isEffective;
  const outcome = !restoredId
    ? null
    : character.effectiveRevisionId === restoredId
      ? 'Restored as a new revision; it is now the active build.'
      : character.review?.status === 'pending' && character.review.revision === character.revision
        ? 'Restored as a new revision and submitted for Director review. The character sheet shows its review status.'
        : complete && character.campaignId
          ? `Restored as a new revision, saved but not submitted. ${
              character.pendingDirectorSetup ?? 'Private Director setup is still required.'
            } Submit it from the character sheet afterwards.`
          : 'Restored as a new private draft. Open Edit to continue its choices.';
  return (
    <section aria-label="Restore this build" className={`${PANEL} flex flex-col gap-3`}>
      <h3 className="m-0">Restore this build</h3>
      <p className="m-0 text-base">{restoreOutcome(complete, !!character.campaignId)}</p>
      <p className="m-0 text-base text-muted-foreground">
        Later revisions stay in history. Inventory, name, appearance and notes are not part of a
        build and stay as they are. Damage taken and Recoveries spent stay the same against the
        restored maxima; restoring does not heal or refill anything.
      </p>
      {active && !restoredId && <Notice>This is the active build.</Notice>}
      {changed && (
        <Notice>
          The character changed since you opened this build. Select it again to restore it.
        </Notice>
      )}
      {character.combatLocked && <Notice>Restoration is locked during combat.</Notice>}
      {outcome && <Notice role="status">{outcome}</Notice>}
      <div>
        <Button
          disabled={command.pending || changed || active || character.combatLocked || !!restoredId}
          onClick={() => {
            const args = {
              characterId,
              expectedRevision: expected.revision,
              sourceRevisionId: history.entry.id as Id<'characterRevisions'>,
              expectedEffectiveRevisionId: expected.effectiveRevisionId,
            };
            void command.run(
              async commandId => setRestoredId(await restore({ ...args, commandId })),
              JSON.stringify(['restore', args]),
            );
          }}
        >
          Restore this build
        </Button>
      </div>
    </section>
  );
}

function RecordedBuild({
  characterId,
  revisionId,
  owner,
  expected,
}: {
  characterId: Id<'characters'>;
  revisionId: Id<'characterRevisions'>;
  owner: boolean;
  expected: Expected | null;
}) {
  const history = useQuery(api.characters.historySheet, { characterId, revisionId }) as
    HistorySheet | undefined;
  if (!history) return <Loading>Loading the recorded build…</Loading>;
  return (
    <section aria-label="Recorded build" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0">{historyEntryTitle(history.entry)}</h2>
        <p className="m-0 text-base text-muted-foreground">
          Recorded {new Date(history.entry.createdAt).toLocaleString()}. This sheet shows the build
          as recorded, read-only, with the hero’s current Stamina, Recoveries and other live values.
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <DifferenceSummary difference={history.difference} />
        {!owner ? (
          <Notice>Only the character’s owner can restore a recorded build.</Notice>
        ) : expected ? (
          <RestorePanel characterId={characterId} history={history} expected={expected} />
        ) : (
          <Notice>
            The character was still loading. Select this revision again to restore it.
          </Notice>
        )}
      </div>
      <HeroSheetView sheet={history.sheet} inventory={history.inventory} />
    </section>
  );
}

function HistoryList({
  characterId,
  selected,
  onSelect,
}: {
  characterId: Id<'characters'>;
  selected: Id<'characterRevisions'> | null;
  onSelect: (id: Id<'characterRevisions'>) => void;
}) {
  const history = usePaginatedQuery(
    api.characters.history,
    { characterId },
    { initialNumItems: 12 },
  );
  const entries = history.results as BuildHistoryEntry[];
  return (
    <section aria-label="Build history" className={PANEL}>
      <SectionHeading as="h2" aside={`${entries.length} shown`}>
        Revisions
      </SectionHeading>
      {history.status === 'LoadingFirstPage' ? (
        <Loading>Loading history…</Loading>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {entries.map(entry => (
            <li key={entry.id}>
              <button
                type="button"
                aria-pressed={selected === entry.id}
                aria-label={historyEntryTitle(entry)}
                onClick={() => onSelect(entry.id as Id<'characterRevisions'>)}
                className={cn(
                  'flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md px-3 py-2 text-left text-base transition-colors hover:bg-muted',
                  selected === entry.id && 'bg-muted',
                )}
              >
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium">Revision {entry.revision}</span>
                  <span className="text-muted-foreground">Level {entry.level}</span>
                  <span>{historyKindLabel(entry)}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {entry.isEffective && <Badge>Active</Badge>}
                  {entry.isDraft && !entry.isEffective && <Badge variant="outline">Draft</Badge>}
                  {entry.status !== 'complete' && <Badge variant="outline">{entry.status}</Badge>}
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {history.status !== 'Exhausted' && history.status !== 'LoadingFirstPage' && (
        <Button
          className="mt-3"
          variant="outline"
          disabled={history.status === 'LoadingMore'}
          onClick={() => history.loadMore(12)}
        >
          {history.status === 'LoadingMore' ? 'Loading…' : 'Load older revisions'}
        </Button>
      )}
    </section>
  );
}

function AuthorizedHistory({
  characterId,
  sheet,
}: {
  characterId: Id<'characters'>;
  sheet: HeroSheet;
}) {
  const owner = sheet.audience === 'owner';
  // Restore's optimistic-concurrency values come from the owner-only read, captured on selection.
  const character = useQuery(api.characters.get, owner ? { characterId } : 'skip');
  const [selected, setSelected] = useState<{
    id: Id<'characterRevisions'>;
    expected: Expected | null;
  } | null>(null);
  return (
    <div className="flex flex-col gap-6">
      {owner && <LevelUpNotice characterId={characterId} />}
      {!owner && (
        <Notice>
          The character’s owner makes progression choices and restores builds. You can inspect every
          recorded build here.
        </Notice>
      )}
      <HistoryList
        characterId={characterId}
        selected={selected?.id ?? null}
        onSelect={id =>
          setSelected({
            id,
            expected: character
              ? { revision: character.revision, effectiveRevisionId: character.effectiveRevisionId }
              : null,
          })
        }
      />
      {selected ? (
        <RecordedBuild
          key={selected.id}
          characterId={characterId}
          revisionId={selected.id}
          owner={owner}
          expected={selected.expected}
        />
      ) : (
        <p className="m-0 text-base text-muted-foreground">
          Select a revision to see its full recorded character sheet.
        </p>
      )}
    </div>
  );
}

export function HistoryPage({ characterId }: { characterId: Id<'characters'> }) {
  const sheet = useQuery(api.characters.sheet, { characterId }) as CharacterSheet | undefined;
  if (!sheet) return <Loading>Opening history…</Loading>;
  return (
    <>
      <Link
        to="/characters/$characterId"
        params={{ characterId }}
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to the character sheet
      </Link>
      <div className="mb-6">
        <Eyebrow>Build history</Eyebrow>
        <h1>{sheet.name} · History</h1>
        <p className="m-0 text-base text-muted-foreground">
          Every creation, edit, level-up, respite kit change and restore records the whole build.
          Live values, inventory and written details are not part of a build and stay current.
        </p>
      </div>
      {sheet.audience === 'peer' ? (
        <Notice>Build history is available to the character owner and Director.</Notice>
      ) : (
        <AuthorizedHistory key={characterId} characterId={characterId} sheet={sheet} />
      )}
    </>
  );
}
