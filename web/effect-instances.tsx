// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 minimal active-effects list for hero and foe sheets: source, duration and the printed table
 * work, with an End button that calls the registered `effect.end` operation. Expiry, stacking and
 * authority are owned by the shared operations; nothing here resolves a rule.
 *
 * V200: an area or aura lists its members, with Remove buttons and an Add picker that call the
 * registered `effect.members` operation (adding a creature is it entering the area). Which riders
 * apply and fire is decided by the operation, not here.
 */
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import type { EffectDuration, EffectEndTrigger } from '../shared/contracts/liveState';
import { describeDuration } from '../shared/resolve/lastingEffects';
import { Button } from './components/ui/button';
import { useCommand } from './ui';

export interface ActiveEffect {
  id: string;
  abilityName: string;
  actorLabel: string;
  sourcePath: string;
  text: string;
  subject: string;
  printedDuration: EffectDuration;
  endsWhen: EffectEndTrigger[];
  scheduled: boolean;
  /** V158: part of a same-ability overlap the table resolves (QC1 R1b). */
  manualStacking?: boolean;
  /** V171: what a watcher watches and does, as the shared describer words it. */
  watching?: string;
  /** V175: a mark, as the shared describer words it. */
  mark?: string;
  /** V200: an area's riders, as the shared describer words them, and its members. */
  area?: string;
  members?: {
    kind: 'character' | 'foe' | 'squad' | 'object';
    id: string;
    name: string;
    manual?: string;
  }[];
  /** V200: this effect is a rider of an area the creature is in. */
  inArea?: string;
}

/** V200: the members of one area, with Remove and Add controls calling `effect.members`. */
function AreaMembers({
  campaignId,
  effect,
  canChange,
}: {
  campaignId: Id<'campaigns'>;
  effect: ActiveEffect;
  canChange: boolean;
}) {
  const invoke = useMutation(api.commands.invoke);
  const command = useCommand();
  const roster = useQuery(api.table.roster, { campaignId });
  const [pick, setPick] = useState('');
  const members = effect.members ?? [];
  const candidates = [
    ...(roster?.heroes ?? []).map(hero => ({ refKind: 'character', id: hero.id, name: hero.name })),
    ...(roster?.foes ?? []).map(foe => ({ refKind: 'foe', id: foe.id, name: foe.name })),
  ].filter(candidate => !members.some(member => member.id === candidate.id));
  const change = (key: 'add' | 'remove', refKind: string, id: string) =>
    void command.run(
      commandId =>
        invoke({
          campaignId,
          commandId,
          operation: 'effect.members',
          arguments: { instance: effect.id, [key]: { refKind, id } },
        }),
      JSON.stringify(['effect.members', campaignId, effect.id, key, id]),
    );
  return (
    <span className="flex flex-col gap-1" data-area-members>
      <span className="text-muted-foreground">In the area: {members.length ? '' : 'nobody.'}</span>
      {members.length > 0 && (
        <ul
          className="m-0 flex list-none flex-col gap-1 p-0"
          aria-label={`Members of ${effect.abilityName}`}
        >
          {members.map(member => (
            <li key={member.id} className="flex items-center gap-2">
              <span>
                {member.name}
                {member.manual ? ` (manual: ${member.manual})` : ''}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={
                  !canChange ||
                  command.pending ||
                  member.kind === 'squad' ||
                  member.kind === 'object'
                }
                aria-label={`Remove ${member.name} from ${effect.abilityName}`}
                onClick={() => change('remove', member.kind, member.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <span className="flex items-center gap-2">
        <select
          className="rounded border border-border bg-background px-1 text-sm"
          aria-label={`Creature entering ${effect.abilityName}`}
          value={pick}
          disabled={!canChange || command.pending}
          onChange={event => setPick(event.target.value)}
        >
          <option value="">Add a creature…</option>
          {candidates.map(candidate => (
            <option key={candidate.id} value={`${candidate.refKind}:${candidate.id}`}>
              {candidate.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={!canChange || command.pending || !pick}
          aria-label={`Add to ${effect.abilityName}`}
          onClick={() => {
            const [refKind, id] = pick.split(':');
            setPick('');
            if (refKind && id) change('add', refKind, id);
          }}
        >
          Add
        </Button>
      </span>
    </span>
  );
}

export function ActiveEffects({
  campaignId,
  effects,
  canEnd,
}: {
  campaignId: Id<'campaigns'> | null;
  effects: readonly ActiveEffect[];
  canEnd: boolean;
}) {
  const invoke = useMutation(api.commands.invoke);
  const command = useCommand();
  if (!effects.length) return null;
  return (
    <div className="flex flex-col gap-2" data-active-effects>
      <span className="text-sm text-muted-foreground">Active effects</span>
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Active effects">
        {effects.map(effect => (
          <li key={effect.id} className="flex items-start justify-between gap-3 text-sm">
            <span className="flex min-w-0 flex-col">
              <span title={effect.sourcePath}>
                {effect.actorLabel} · {effect.abilityName} · on {effect.subject} ·{' '}
                {describeDuration(effect.printedDuration, effect.endsWhen)}
                {effect.manualStacking
                  ? ' (manual stacking: apply the stacking rule and end it at the table)'
                  : effect.scheduled
                    ? ''
                    : ' (unscheduled)'}
              </span>
              <span className="text-muted-foreground">{effect.text}</span>
              {effect.watching && (
                <span className="text-muted-foreground">Watcher: {effect.watching}.</span>
              )}
              {effect.mark && <span className="text-muted-foreground">Mark: {effect.mark}.</span>}
              {effect.inArea && (
                <span className="text-muted-foreground">While in {effect.inArea}.</span>
              )}
              {effect.area && <span className="text-muted-foreground">Area: {effect.area}.</span>}
              {effect.members && campaignId && (
                <AreaMembers campaignId={campaignId} effect={effect} canChange={canEnd} />
              )}
            </span>
            {campaignId && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={!canEnd || command.pending}
                aria-label={`End ${effect.abilityName} on ${effect.subject}`}
                onClick={() =>
                  void command.run(
                    commandId =>
                      invoke({
                        campaignId,
                        commandId,
                        operation: 'effect.end',
                        arguments: { instance: effect.id },
                      }),
                    JSON.stringify(['effect.end', campaignId, effect.id]),
                  )
                }
              >
                End
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
