// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { emptyAuthored, type CharacterAuthored } from '../shared/characterDraft';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { ErrorNotice, Eyebrow, Field, Notice, SectionHeading, useCommand } from './ui';

function AuthoredFields({
  value,
  onChange,
  disabled,
}: {
  value: CharacterAuthored;
  onChange: (value: CharacterAuthored) => void;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="m-0 flex flex-col gap-4 border-0 p-0">
      <Field label="Name">
        <Input
          required
          maxLength={100}
          value={value.name}
          onChange={event => onChange({ ...value, name: event.target.value })}
        />
      </Field>
      <Field label="Appearance">
        <Textarea
          maxLength={10000}
          value={value.appearance}
          onChange={event => onChange({ ...value, appearance: event.target.value })}
        />
      </Field>
      <Field label="Biography">
        <Textarea
          maxLength={10000}
          value={value.biography}
          onChange={event => onChange({ ...value, biography: event.target.value })}
        />
      </Field>
      <Field label="Private notes" hint="Only you can read these notes.">
        <Textarea
          maxLength={10000}
          value={value.notes}
          onChange={event => onChange({ ...value, notes: event.target.value })}
        />
      </Field>
    </fieldset>
  );
}
function RulesPending() {
  return (
    <Notice>
      <strong>Build choices are coming next.</strong>
      <p className="mt-1">
        You can save and reopen your character’s details now. The level-one devil Fury build choices
        are not available yet. This draft cannot join a party yet.
      </p>
    </Notice>
  );
}
export function CharactersPage() {
  const characters = useQuery(api.characters.listMine);
  const create = useMutation(api.characters.create);
  const navigate = useNavigate();
  const [fields, setFields] = useState<CharacterAuthored>({ ...emptyAuthored });
  const command = useCommand();
  async function submit(event: FormEvent) {
    event.preventDefault();
    await command.run(
      async commandId => {
        const characterId = await create({ commandId, authored: fields });
        await navigate({ to: '/characters/$characterId', params: { characterId } });
      },
      JSON.stringify(['characters.create', fields]),
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
            Drafts
          </SectionHeading>
          {characters === undefined ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading characters…
            </p>
          ) : characters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No characters yet. Start with a name and a few details.
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
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">Draft</Badge>
                    <span className="text-sm text-muted-foreground">— build choices pending</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2>Start a character draft</h2>
            <RulesPending />
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <AuthoredFields value={fields} onChange={setFields} disabled={command.pending} />
              <ErrorNotice error={command.error} />
              <Button className="w-fit" disabled={command.pending} type="submit">
                {command.pending ? 'Saving…' : 'Create draft'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
type LoadedCharacter = FunctionReturnType<typeof api.characters.get>;
function CharacterEditor({ character }: { character: LoadedCharacter }) {
  const [fields, setFields] = useState<CharacterAuthored>(character.authored);
  const [expectedRevision, setExpectedRevision] = useState(character.revision);
  const [saved, setSaved] = useState(false);
  const save = useMutation(api.characters.save);
  const command = useCommand();
  const stale = character.revision !== expectedRevision;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    const success = await command.run(
      async commandId => {
        const revision = await save({
          commandId,
          characterId: character.id,
          expectedRevision,
          authored: fields,
        });
        setExpectedRevision(revision);
      },
      JSON.stringify(['characters.save', character.id, expectedRevision, fields]),
    );
    if (success) setSaved(true);
  }
  return (
    <>
      <Link to="/characters" className="mb-4 inline-block text-sm text-muted-foreground">
        ← Your characters
      </Link>
      <div className="rule-strong mb-8 flex items-end justify-between gap-6 pb-5">
        <div>
          <Eyebrow>Character draft</Eyebrow>
          <h1>{character.authored.name}</h1>
        </div>
        <Badge variant="outline" className="h-9 px-4 text-xs">
          Draft
        </Badge>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-8">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2>Character details</h2>
            {stale && (
              <Notice>
                <p>
                  A newer saved version is available. Reload it before saving; this replaces the
                  text currently in this form.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  type="button"
                  disabled={command.pending}
                  onClick={() => {
                    setFields(character.authored);
                    setExpectedRevision(character.revision);
                    setSaved(false);
                  }}
                >
                  Reload saved version
                </Button>
              </Notice>
            )}
            {character.combatLocked && <Notice>Character editing is locked during combat.</Notice>}
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <AuthoredFields
                value={fields}
                onChange={value => {
                  setFields(value);
                  setSaved(false);
                }}
                disabled={command.pending || character.combatLocked}
              />
              <ErrorNotice error={command.error} />
              {saved && (
                <p role="status" className="text-sm text-success">
                  Draft saved.
                </p>
              )}
              <Button
                className="w-fit"
                disabled={command.pending || stale || character.combatLocked}
                type="submit"
              >
                {command.pending ? 'Saving…' : 'Save draft'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <aside className="flex flex-col gap-6">
          <RulesPending />
          <section>
            <SectionHeading>Build</SectionHeading>
            <p className="text-sm text-muted-foreground">
              {character.selections.length
                ? `${character.selections.length} saved selections are preserved. Rules evaluation is pending.`
                : 'No build choices yet. Your saved details will stay separate from build choices and play resources.'}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
export function CharacterPage({ characterId }: { characterId: Id<'characters'> }) {
  const character = useQuery(api.characters.get, { characterId });
  return character === undefined ? (
    <p role="status" className="text-sm text-muted-foreground">
      Loading character…
    </p>
  ) : (
    <CharacterEditor key={character.id} character={character} />
  );
}
