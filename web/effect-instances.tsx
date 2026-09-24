// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 minimal active-effects list for hero and foe sheets: source, duration and the printed table
 * work, with an End button that calls the registered `effect.end` operation. Expiry, stacking and
 * authority are owned by the shared operations; nothing here resolves a rule.
 */
import { useMutation } from 'convex/react';
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
