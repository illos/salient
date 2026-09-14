// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { emptyAuthored, type CharacterAuthored } from '../shared/characterDraft';
import { useCommand } from './ui';

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
    <fieldset disabled={disabled} className="stack" style={{ border: 0, padding: 0 }}>
      <label className="field">
        Name
        <input
          required
          maxLength={100}
          value={value.name}
          onChange={event => onChange({ ...value, name: event.target.value })}
        />
      </label>
      <label className="field">
        Appearance
        <textarea
          maxLength={10000}
          value={value.appearance}
          onChange={event => onChange({ ...value, appearance: event.target.value })}
        />
      </label>
      <label className="field">
        Biography
        <textarea
          maxLength={10000}
          value={value.biography}
          onChange={event => onChange({ ...value, biography: event.target.value })}
        />
      </label>
      <label className="field">
        Private notes
        <textarea
          maxLength={10000}
          value={value.notes}
          onChange={event => onChange({ ...value, notes: event.target.value })}
        />
        <span className="muted">Only you can read these notes.</span>
      </label>
    </fieldset>
  );
}
function RulesPending() {
  return (
    <div className="notice">
      <strong>Build choices are coming next.</strong>
      <p>
        You can save and reopen your character’s details now. The level-one devil Fury build choices
        are not available yet. This draft cannot join a party yet.
      </p>
    </div>
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
    <div className="stack">
      <h1>Your characters</h1>
      <section className="panel stack">
        {characters === undefined ? (
          <p role="status">Loading characters…</p>
        ) : characters.length === 0 ? (
          <p className="muted">No characters yet. Start with a name and a few details below.</p>
        ) : (
          <ul>
            {characters.map(character => (
              <li key={character.id}>
                <Link to="/characters/$characterId" params={{ characterId: character.id }}>
                  {character.name}
                </Link>{' '}
                <span className="muted">— Draft · build choices pending</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel stack">
        <h2>Start a character draft</h2>
        <RulesPending />
        <form className="stack" onSubmit={submit}>
          <AuthoredFields value={fields} onChange={setFields} disabled={command.pending} />
          {command.error && (
            <p className="error" role="alert">
              {command.error}
            </p>
          )}
          <button className="button" disabled={command.pending} type="submit">
            {command.pending ? 'Saving…' : 'Create draft'}
          </button>
        </form>
      </section>
    </div>
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
    <div className="stack">
      <Link to="/characters">← Your characters</Link>
      <h1>{character.authored.name}</h1>
      <RulesPending />
      <section className="panel stack">
        <h2>Character details</h2>
        {stale && (
          <div className="notice">
            <p>
              A newer saved version is available. Reload it before saving; this replaces the text
              currently in this form.
            </p>
            <button
              className="button secondary"
              type="button"
              disabled={command.pending}
              onClick={() => {
                setFields(character.authored);
                setExpectedRevision(character.revision);
                setSaved(false);
              }}
            >
              Reload saved version
            </button>
          </div>
        )}
        {character.combatLocked && (
          <p className="notice">Character editing is locked during combat.</p>
        )}
        <form className="stack" onSubmit={submit}>
          <AuthoredFields
            value={fields}
            onChange={value => {
              setFields(value);
              setSaved(false);
            }}
            disabled={command.pending || character.combatLocked}
          />
          {command.error && (
            <p className="error" role="alert">
              {command.error}
            </p>
          )}
          {saved && <p role="status">Draft saved.</p>}
          <button
            className="button"
            disabled={command.pending || stale || character.combatLocked}
            type="submit"
          >
            {command.pending ? 'Saving…' : 'Save draft'}
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Build</h2>
        <p className="muted">
          {character.selections.length
            ? `${character.selections.length} saved selections are preserved. Rules evaluation is pending.`
            : 'No build choices yet. Your saved details will stay separate from build choices and play resources.'}
        </p>
      </section>
    </div>
  );
}
export function CharacterPage({ characterId }: { characterId: Id<'characters'> }) {
  const character = useQuery(api.characters.get, { characterId });
  return character === undefined ? (
    <p role="status">Loading character…</p>
  ) : (
    <CharacterEditor key={character.id} character={character} />
  );
}
