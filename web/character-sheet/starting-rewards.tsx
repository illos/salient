// SPDX-License-Identifier: GPL-3.0-only
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '../components/ui/button';
import { useCommand } from '../ui';
import { RuleLink } from '../rules/link';
import { cn } from 'cn';

export function StartingRewardsPanel({
  characterId,
  combatLocked,
  compact,
}: {
  characterId: string;
  combatLocked: boolean;
  /** Inside another panel (the compact sheet): no panel surface of its own. */
  compact?: boolean;
}) {
  const data = useQuery(api.characterRewards.get, { characterId: characterId as Id<'characters'> });
  const initialize = useMutation(api.characterRewards.initialize);
  const command = useCommand();
  if (!data) return null;
  const rewards = data.rewards;
  return (
    <section
      className={cn(
        'flex flex-col text-sm',
        compact ? 'gap-1 rounded-md bg-muted p-4' : 'gap-3 rounded-lg bg-card p-6',
      )}
      aria-label="Starting rewards"
    >
      <h3 className={cn('m-0', compact ? 'text-sm text-muted-foreground' : 'text-xl font-medium')}>
        Starting rewards
      </h3>
      {rewards ? (
        <>
          <dl className="m-0 grid grid-cols-3 gap-2 text-base">
            <div>
              <dt className="text-sm text-muted-foreground">Wealth</dt>
              <dd className="m-0 font-medium tabular-nums">{rewards.wealth}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Renown</dt>
              <dd className="m-0 font-medium tabular-nums">{rewards.renown}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Project points</dt>
              <dd className="m-0 font-medium tabular-nums">{rewards.projectPoints}</dd>
            </div>
          </dl>
          {rewards.items.map(item => (
            <div key={item.id}>
              <strong className="font-medium">{item.name}</strong> ·{' '}
              {item.state === 'pending-Director' ? 'Identity held by the Director' : item.state}
              <div>
                <RuleLink sourcePath={item.sourcePath} label="Source" />
              </div>
              {item.condition && <p className="my-1 text-muted-foreground">{item.condition}</p>}
              {item.projectSource && <p className="my-1">Repair project source possessed.</p>}
            </div>
          ))}
          <p className="text-muted-foreground">
            Granted once at first admission. Project spending and item effects are resolved
            manually; later build edits do not grant these again.
          </p>
        </>
      ) : data.canInitialize && data.originRevisionId ? (
        <>
          <p>Record the rewards from this character’s original admission.</p>
          <Button
            disabled={combatLocked || command.pending}
            onClick={() =>
              void command.run(
                commandId =>
                  initialize({
                    characterId: characterId as Id<'characters'>,
                    commandId,
                    expectedCharacterRevision: data.characterRevision,
                    expectedOriginRevisionId: data.originRevisionId!,
                  }),
                JSON.stringify([characterId, data.characterRevision, data.originRevisionId]),
              )
            }
          >
            Record starting rewards
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground">
          {data.initializationBlocked ??
            'Starting rewards are recorded when a complete character is first admitted.'}
        </p>
      )}
    </section>
  );
}
