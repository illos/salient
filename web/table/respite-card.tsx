// SPDX-License-Identifier: GPL-3.0-only
/**
 * V167 respite on the table (docs/table-spec.md#respite-mode). The Director's card starts a respite
 * or shows who is resting with each hero's respite activity, unused ones marked as the wizard marks
 * unspent points, and ends it by Complete, Interrupt or Cancel. A resting hero's owner records their
 * one activity or changes kit. Every control submits a registered respite operation.
 */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useCommand } from '../ui';
import { CommandButton } from './setup-card';
import type { Roster } from './foe-sheet';

type Respite = NonNullable<NonNullable<Roster['session']>['respite']>;

/** The Director's respite card, shown in place of Encounter ready while no combat is running. */
export function RespiteDirectorCard({
  campaignId,
  roster,
}: {
  campaignId: Id<'campaigns'>;
  roster: Roster;
}) {
  const respite = roster.session?.respite ?? null;
  if (!respite) return <RespiteStart campaignId={campaignId} roster={roster} />;
  const name = (id: string) => roster.heroes.find(h => h.id === id)?.name ?? 'A hero';
  const unused = respite.participants.filter(p => !p.activity).length;
  return (
    <section
      className="flex flex-col gap-3 rounded-md bg-muted p-5"
      aria-label="Respite in progress"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0">Respite in progress</h3>
        <span className="text-sm text-muted-foreground tabular-nums">
          {respite.participants.length} resting
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 text-base" aria-label="Resting heroes">
        {respite.participants.map(p => (
          <li key={p.characterId} className="flex items-baseline justify-between gap-3">
            <span>{name(p.characterId)}</span>
            <span className={p.activity ? '' : 'text-sm text-muted-foreground'}>
              {p.activity ?? 'No activity yet'}
            </span>
          </li>
        ))}
      </ul>
      {unused > 0 && (
        <p className="m-0 text-sm text-muted-foreground">
          {unused} respite {unused === 1 ? 'activity' : 'activities'} still unused. They lapse when
          the respite completes.
        </p>
      )}
      <div className="flex flex-col gap-2 pt-1 [&>span]:flex [&_button]:w-full">
        <CommandButton
          campaignId={campaignId}
          text="/respite complete"
          label="Complete respite"
          variant="default"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <CommandButton campaignId={campaignId} text="/respite interrupt" label="Interrupt" />
        <CommandButton campaignId={campaignId} text="/respite cancel" label="Cancel respite" />
      </div>
    </section>
  );
}

/**
 * Start a respite for the heroes the Director picks: the whole party by default, each removable
 * (docs/table-spec.md, respite participant selection).
 */
function RespiteStart({ campaignId, roster }: { campaignId: Id<'campaigns'>; roster: Roster }) {
  const invoke = useMutation(api.commands.invoke);
  const command = useCommand();
  const [left, setLeft] = useState<ReadonlySet<string>>(new Set());
  const resting = roster.heroes.filter(hero => !left.has(hero.id));
  const toggle = (id: string) =>
    setLeft(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const start = () => {
    const characters = resting.map(hero => ({ refKind: 'character' as const, id: hero.id }));
    void command.run(
      commandId =>
        invoke({ campaignId, commandId, operation: 'respite.start', arguments: { characters } }),
      JSON.stringify(['respite.start', characters]),
    );
  };
  return (
    <section className="flex flex-col gap-3 rounded-md bg-muted p-5" aria-label="Respite">
      <h3 className="m-0">Respite</h3>
      <p className="m-0 text-sm text-muted-foreground">
        The party rests. Completing it restores Stamina and Recoveries, turns Victories into XP and
        grants level-ups.
      </p>
      {roster.heroes.length > 0 && (
        <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
          <legend className="mb-1 p-0 text-sm text-muted-foreground">Resting heroes</legend>
          {roster.heroes.map(hero => (
            <label key={hero.id} className="flex items-center gap-2 text-base">
              <input
                type="checkbox"
                checked={!left.has(hero.id)}
                onChange={() => toggle(hero.id)}
              />
              {hero.name}
            </label>
          ))}
        </fieldset>
      )}
      <Button
        type="button"
        className="w-full"
        disabled={resting.length === 0 || command.pending}
        onClick={start}
      >
        Start respite
      </Button>
    </section>
  );
}

/** A resting hero's own respite activity controls; the Director uses the palette. */
export function RespiteActivity({
  campaignId,
  hero,
  respite,
}: {
  campaignId: Id<'campaigns'>;
  hero: { id: Id<'characters'>; name: string };
  respite: Respite;
}) {
  const mine = respite.participants.find(p => p.characterId === hero.id);
  const invoke = useMutation(api.commands.invoke);
  const command = useCommand();
  const kits = useQuery(api.characters.kitOptions, mine ? { characterId: hero.id } : 'skip');
  const [activity, setActivity] = useState('');
  const [kit, setKit] = useState('');
  if (!mine) return null;
  if (mine.activity)
    return (
      <p className="m-0 text-sm text-muted-foreground">
        Respite activity: <span className="text-foreground">{mine.activity}</span>
      </p>
    );
  const run = (operation: string, args: Record<string, unknown>) =>
    void command.run(
      commandId =>
        invoke({
          campaignId,
          commandId,
          operation,
          actor: { refKind: 'character', id: hero.id },
          arguments: args,
        }),
      JSON.stringify([operation, hero.id, args]),
    );
  const choices = (kits?.options ?? []).filter(option => option !== kits?.current);
  return (
    <section className="flex flex-col gap-3 rounded-md bg-muted p-4" aria-label="Respite activity">
      <p className="m-0 text-sm text-muted-foreground">
        {hero.name} is resting and has one respite activity.
      </p>
      {kits && kits.current && !kits.multiple && choices.length > 0 && (
        <div className="flex items-stretch gap-2">
          <select
            className="native-select min-w-0 flex-1"
            aria-label="New kit"
            value={kit}
            onChange={event => setKit(event.target.value)}
          >
            <option value="">Change kit from {kits.current}…</option>
            {choices.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={!kit || command.pending}
            onClick={() =>
              run('respite.change-kit', { selections: [{ decisionId: 'kit.choice', value: kit }] })
            }
          >
            Change kit
          </Button>
        </div>
      )}
      {kits?.multiple && (
        <p className="m-0 text-sm text-muted-foreground">
          Tacticians change both kits with /respite change-kit from the command palette.
        </p>
      )}
      <div className="flex items-stretch gap-2">
        <Input
          aria-label="Other respite activity"
          placeholder="Other activity, e.g. Project roll"
          value={activity}
          onChange={event => setActivity(event.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!activity.trim() || command.pending}
          onClick={() => run('respite.activity', { name: activity.trim() })}
        >
          Record
        </Button>
      </div>
    </section>
  );
}
