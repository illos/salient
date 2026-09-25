// SPDX-License-Identifier: GPL-3.0-only
/**
 * Your characters: the list, creation (which opens the wizard), and the standalone character
 * page: the sheet, the wizard entry, and the admission controls (submit to a campaign, withdraw).
 * Owning specifications: docs/character-wizard-spec.md#main-creation-and-editing and
 * #7-revision-and-review-lifecycle; docs/character-sheet-spec.md#views-permissions-and-persistence
 * (the standalone page prioritizes inspection and eligible editing; Open table when applicable).
 */
import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { CharacterSheet as SheetPayload } from '../shared/contracts/characterSheet';
import { Badge } from './components/ui/badge';
import { Button, buttonVariants } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Eyebrow, Loading, SectionHeading, useCommand } from './ui';
import { CharacterSheet } from './character-sheet';
import { SecretInheritance } from './character-sheet/secret-inheritance';

export function CharactersPage() {
  const characters = useQuery(api.characters.listMine);
  return (
    <>
      <div className="mb-8">
        <Eyebrow>Your heroes</Eyebrow>
        <h1>Your characters</h1>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-4">
        <section>
          <SectionHeading aside={characters ? `${characters.length} total` : undefined}>
            Characters
          </SectionHeading>
          {characters === undefined ? (
            <Loading>Loading characters…</Loading>
          ) : characters.length === 0 ? (
            <p className="m-0 rounded-md bg-muted p-4 text-base text-muted-foreground">
              No characters yet. Explore the wizard and save when you’re ready.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {characters.map(character => (
                <li
                  key={character.id}
                  className="flex items-center justify-between gap-4 rounded-lg bg-card p-6"
                >
                  <Link
                    to="/characters/$characterId"
                    params={{ characterId: character.id }}
                    className="text-lg font-medium"
                  >
                    {character.name}
                  </Link>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={character.attached ? 'default' : 'outline'}>
                      {character.attached ? `In ${character.campaignName}` : 'Draft'}
                    </Badge>
                    <span>build {character.status}</span>
                    {character.review && (
                      <span>
                        · {character.review.kind} {character.review.status} (
                        {character.review.campaignName})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2>Start a character</h2>
            <p className="text-base text-muted-foreground">
              The wizard supports level-one Devil Fury and Polder Elementalist builds through Making
              a Hero. Supported choices are enabled; additional options remain visible for
              reference.
            </p>
            <p className="text-base text-muted-foreground">
              Choose a name in the Details step. Your character is created only when you save.
            </p>
            <Link
              to="/characters/$characterId/wizard"
              params={{ characterId: 'new' }}
              className={buttonVariants({ className: 'w-fit' })}
            >
              Open character wizard
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/** The standalone page's header actions: EDIT (the wizard), Open table and the review submission. */
function SubmitControls({ characterId }: { characterId: Id<'characters'> }) {
  const character = useQuery(api.characters.get, { characterId });
  const campaigns = useQuery(api.campaigns.list);
  const viewer = useQuery(api.auth.viewer);
  const submit = useMutation(api.characters.submit);
  const withdraw = useMutation(api.characters.withdraw);
  const command = useCommand();
  const [campaignId, setCampaignId] = useState<string>('');
  const target = character?.campaignId ?? (campaignId || campaigns?.[0]?.id) ?? null;
  const strangeInheritance = character?.selections.some(
    selection =>
      selection.decisionId === 'complication.choice' && selection.value === 'Strange Inheritance',
  );
  const directingTarget =
    !!target &&
    campaigns?.some(campaign => campaign.id === target && campaign.ownerId === viewer?.userId);
  const needsPrivateSetup = !!strangeInheritance && !!directingTarget;
  const inheritance = useQuery(
    api.characterSecrets.inheritance,
    needsPrivateSetup && target
      ? { characterId, view: 'draft', campaignId: target as Id<'campaigns'> }
      : 'skip',
  );
  if (!character || !campaigns || viewer === undefined) return <Loading />;
  const pending = character.review?.status === 'pending' ? character.review : null;
  const canSubmit =
    character.status === 'complete' &&
    !pending &&
    (!character.campaignId || !character.draftIsEffective) &&
    !character.fullEditIsStale &&
    (!needsPrivateSetup || !!inheritance?.item) &&
    !!target &&
    !character.combatLocked;
  const action = buttonVariants({
    variant: 'outline',
    size: 'sm',
    className: 'hover:no-underline',
  });
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!character.campaignId && !pending && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Campaign</span>
            <select
              className="native-select h-8"
              aria-label="Campaign to submit to"
              value={target ?? ''}
              onChange={event => setCampaignId(event.target.value)}
            >
              {campaigns.length === 0 && <option value="">Join a campaign first</option>}
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <Link
          to="/characters/$characterId/wizard"
          params={{ characterId }}
          className={action}
          title="Open the wizard"
        >
          Edit
        </Link>
        {character.campaignId && (
          <Link
            to="/campaigns/$campaignId/table"
            params={{ campaignId: character.campaignId }}
            className={action}
          >
            Open table
          </Link>
        )}
        {pending ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={command.pending}
            onClick={() =>
              void command.run(
                commandId => withdraw({ commandId, characterId }),
                JSON.stringify(['character.withdraw', characterId, pending.id]),
              )
            }
          >
            Withdraw submission
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canSubmit || command.pending}
            title={
              character.status !== 'complete'
                ? `The build is ${character.status}; finish it in the wizard first.`
                : character.fullEditIsStale
                  ? 'Review and save this older draft in the editor before submitting.'
                  : needsPrivateSetup && !inheritance?.item
                    ? 'Save the Director’s private inheritance choice before submitting.'
                    : character.campaignId && character.draftIsEffective
                      ? 'The saved build is already the effective one.'
                      : undefined
            }
            onClick={() =>
              target &&
              void command.run(
                commandId =>
                  submit({ commandId, characterId, campaignId: target as Id<'campaigns'> }),
                JSON.stringify(['character.submit', characterId, target, character.revision]),
              )
            }
          >
            {character.campaignId ? 'Submit edit for review' : 'Submit for admission'}
          </Button>
        )}
      </div>
      {character.fullEditIsStale && (
        <p className="text-sm text-muted-foreground">
          This draft predates the effective build. Open Edit to review and reconcile it.
        </p>
      )}
      {(character.pendingDirectorSetup || (needsPrivateSetup && !inheritance?.item)) && (
        <p className="max-w-lg text-sm text-muted-foreground">
          {character.pendingDirectorSetup && <>{character.pendingDirectorSetup} </>}
          {needsPrivateSetup
            ? 'Your recorded character choices can be complete while private Director setup is still required. Save the inherited trinket below before submitting.'
            : 'Your recorded character choices can be complete while private Director setup is still required. Submit for review; your Director chooses the inherited trinket privately before approving the build.'}
        </p>
      )}
      {needsPrivateSetup &&
        target &&
        !pending &&
        (!character.campaignId || !character.draftIsEffective) && (
          <div className="w-full max-w-2xl text-left">
            <SecretInheritance
              characterId={characterId}
              view="draft"
              campaignId={target as Id<'campaigns'>}
            />
          </div>
        )}
      {pending ? (
        <Badge variant="outline">
          {pending.kind} awaiting review in {pending.campaignName} (revision {pending.revision})
        </Badge>
      ) : (
        character.review &&
        character.review.status !== 'pending' && (
          <span className="text-sm text-muted-foreground">
            last submission: {character.review.status} ({character.review.campaignName})
          </span>
        )
      )}
    </div>
  );
}

export function CharacterPage({ characterId }: { characterId: Id<'characters'> }) {
  const navigate = useNavigate();
  const sheet = useQuery(api.characters.sheet, { characterId }) as SheetPayload | undefined;
  const mine = useQuery(api.characters.listMine);
  // A pending level-up (V163) shows as the owner's "Level up" action (V164).
  const progression = useQuery(
    api.characters.progression,
    sheet?.audience === 'owner' ? { characterId } : 'skip',
  ) as { eligible: boolean; pendingLevelUps: number; targetLevel: number } | undefined;
  const [view, setView] = useState<'effective' | 'draft'>('effective');
  if (!sheet) return <Loading>Loading character…</Loading>;
  const owner = sheet.audience === 'owner';
  const hasEffective = sheet.audience !== 'peer' && sheet.build?.label === 'effective';
  return (
    <>
      <Link
        to="/characters"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Your characters
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <Eyebrow className="mb-0 pt-1.5">{owner ? 'Your character' : 'Character sheet'}</Eyebrow>
        <div className="flex flex-wrap items-start justify-end gap-3">
          {mine && mine.length > 1 && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Hero</span>
              <select
                className="native-select h-8"
                aria-label="Switch hero"
                value={mine.some(c => c.id === characterId) ? characterId : ''}
                onChange={event =>
                  void navigate({
                    to: '/characters/$characterId',
                    params: { characterId: event.target.value as Id<'characters'> },
                  })
                }
              >
                {!mine.some(c => c.id === characterId) && (
                  <option value="">Another owner's hero</option>
                )}
                {mine.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {owner && hasEffective && (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">View</span>
              <select
                className="native-select h-8"
                aria-label="Sheet view"
                value={view}
                onChange={event => setView(event.target.value as 'effective' | 'draft')}
              >
                <option value="effective">Effective build</option>
                <option value="draft">Draft preview</option>
              </select>
            </label>
          )}
          {owner && progression?.eligible && progression.pendingLevelUps > 0 && (
            <Link
              to="/characters/$characterId/level-up"
              params={{ characterId }}
              className={buttonVariants({ size: 'sm', className: 'hover:no-underline' })}
            >
              Level up to {progression!.targetLevel}
              {progression!.pendingLevelUps > 1 ? ` (${progression!.pendingLevelUps} pending)` : ''}
            </Link>
          )}
          {sheet.audience !== 'peer' && (
            <Link
              to="/characters/$characterId/history"
              params={{ characterId }}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'hover:no-underline',
              })}
            >
              History
            </Link>
          )}
          {owner && <SubmitControls characterId={characterId} />}
        </div>
      </div>
      <CharacterSheet characterId={characterId} view={owner && hasEffective ? view : undefined} />
    </>
  );
}
