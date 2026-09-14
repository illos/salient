// SPDX-License-Identifier: GPL-3.0-only
/**
 * Your characters: the list, creation (which opens the wizard), and the standalone character
 * page: the sheet, the wizard entry, and the admission controls (submit to a campaign, withdraw).
 * Owning specifications: docs/character-wizard-spec.md#main-creation-and-editing and
 * #7-revision-and-review-lifecycle; docs/character-sheet-spec.md#views-permissions-and-persistence
 * (the standalone page prioritizes inspection and eligible editing; Open table when applicable).
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { emptyAuthored } from '../shared/characterDraft';
import type { CharacterSheet as SheetPayload } from '../shared/contracts/characterSheet';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { ErrorNotice, Eyebrow, Field, Loading, SectionHeading, useCommand } from './ui';
import { CharacterSheet } from './character-sheet';

export function CharactersPage() {
  const characters = useQuery(api.characters.listMine);
  const create = useMutation(api.characters.create);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const command = useCommand();
  async function submit(event: FormEvent) {
    event.preventDefault();
    await command.run(
      async commandId => {
        const characterId = await create({ commandId, authored: { ...emptyAuthored, name } });
        await navigate({ to: '/characters/$characterId/wizard', params: { characterId } });
      },
      JSON.stringify(['characters.create', name]),
    );
  }
  return (
    <>
      <div className="rule-strong mb-8 pb-5">
        <Eyebrow>Your heroes</Eyebrow>
        <h1>Your characters</h1>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_420px] items-start gap-8">
        <section>
          <SectionHeading aside={characters ? `${characters.length} total` : undefined}>
            Characters
          </SectionHeading>
          {characters === undefined ? (
            <Loading>Loading characters…</Loading>
          ) : characters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No characters yet. Start with a name; the wizard takes it from there.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {characters.map(character => (
                <li
                  key={character.id}
                  className="rule-soft flex items-center justify-between gap-4 py-3"
                >
                  <Link
                    to="/characters/$characterId"
                    params={{ characterId: character.id }}
                    className="text-lg font-bold"
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
            <p className="text-sm text-muted-foreground">
              The v0.01 wizard builds a level-one devil Fury through every applicable step of Making
              a Hero, with one supported option per step and the full pool visible.
            </p>
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <Field label="Name">
                <Input
                  required
                  maxLength={100}
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </Field>
              <ErrorNotice error={command.error} />
              <Button className="w-fit" disabled={command.pending} type="submit">
                {command.pending ? 'Creating…' : 'Create and open the wizard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SubmitControls({ characterId }: { characterId: Id<'characters'> }) {
  const character = useQuery(api.characters.get, { characterId });
  const campaigns = useQuery(api.campaigns.list);
  const submit = useMutation(api.characters.submit);
  const withdraw = useMutation(api.characters.withdraw);
  const command = useCommand();
  const [campaignId, setCampaignId] = useState<string>('');
  if (!character || !campaigns) return <Loading />;
  const pending = character.review?.status === 'pending' ? character.review : null;
  const target = character.campaignId ?? (campaignId || campaigns[0]?.id) ?? null;
  const canSubmit =
    character.status === 'complete' &&
    !pending &&
    !character.draftIsEffective &&
    !!target &&
    !character.combatLocked;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/characters/$characterId/wizard"
          params={{ characterId }}
          className="text-sm font-bold"
        >
          Open the wizard →
        </Link>
        {character.campaignId && (
          <Link
            to="/campaigns/$campaignId/table"
            params={{ campaignId: character.campaignId }}
            className="text-sm font-bold"
          >
            Open table →
          </Link>
        )}
      </div>
      {pending ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">
            {pending.kind} awaiting review in {pending.campaignName} (revision {pending.revision})
          </Badge>
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
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2 text-sm">
          {!character.campaignId && (
            <label className="flex flex-col gap-1">
              <span className="caps text-muted-foreground">Campaign</span>
              <select
                className="native-select"
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
          <Button
            type="button"
            size="sm"
            disabled={!canSubmit || command.pending}
            title={
              character.status !== 'complete'
                ? `The build is ${character.status}; finish it in the wizard first.`
                : character.draftIsEffective
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
            {character.effectiveRevisionId ? 'Submit edit for review' : 'Submit for admission'}
          </Button>
          {character.review && character.review.status !== 'pending' && (
            <span className="text-muted-foreground">
              last submission: {character.review.status} ({character.review.campaignName})
            </span>
          )}
        </div>
      )}
      <ErrorNotice error={command.error} />
    </div>
  );
}

export function CharacterPage({ characterId }: { characterId: Id<'characters'> }) {
  const navigate = useNavigate();
  const sheet = useQuery(api.characters.sheet, { characterId }) as SheetPayload | undefined;
  const mine = useQuery(api.characters.listMine);
  const [view, setView] = useState<'effective' | 'draft'>('effective');
  if (!sheet) return <Loading>Loading character…</Loading>;
  const owner = sheet.audience === 'owner';
  const hasEffective = sheet.audience !== 'peer' && sheet.build?.label === 'effective';
  return (
    <>
      <Link to="/characters" className="mb-4 inline-block text-sm text-muted-foreground">
        ← Your characters
      </Link>
      <div className="rule-strong mb-6 flex flex-wrap items-end justify-between gap-4 pb-4">
        <div>
          <Eyebrow>{owner ? 'Your character' : 'Character sheet'}</Eyebrow>
          <h1>{sheet.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {mine && mine.length > 1 && (
            <label className="flex items-center gap-2 text-xs">
              <span className="caps text-muted-foreground">Hero</span>
              <select
                className="native-select"
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
            <label className="flex items-center gap-2 text-xs">
              <span className="caps text-muted-foreground">View</span>
              <select
                className="native-select"
                aria-label="Sheet view"
                value={view}
                onChange={event => setView(event.target.value as 'effective' | 'draft')}
              >
                <option value="effective">Effective build</option>
                <option value="draft">Draft preview</option>
              </select>
            </label>
          )}
        </div>
      </div>
      {owner && (
        <Card className="mb-6">
          <CardContent>
            <SubmitControls characterId={characterId} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent>
          <CharacterSheet
            characterId={characterId}
            view={owner && hasEffective ? view : undefined}
          />
        </CardContent>
      </Card>
    </>
  );
}
