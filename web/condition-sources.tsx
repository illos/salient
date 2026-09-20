// SPDX-License-Identifier: GPL-3.0-only
/** Saved source labels only: mechanics and expiry are owned by shared operations. */
import type { ConditionInstance } from '../shared/contracts/liveState';

export type ConditionSource = Pick<
  ConditionInstance,
  'id' | 'status' | 'duration' | 'abilityName' | 'actorLabel' | 'sourcePath'
> & { condition: string };

export function ConditionSources({
  condition,
  instances = [],
}: {
  condition: string;
  instances?: readonly ConditionSource[];
}) {
  const active = instances.filter(
    instance => instance.status === 'active' && instance.condition === condition,
  );
  if (!active.length) return null;
  return (
    <span className="flex flex-col text-xs font-normal normal-case text-muted-foreground">
      {active.map(instance => (
        <span key={instance.id} title={instance.sourcePath}>
          {instance.actorLabel} · {instance.abilityName} · save ends
        </span>
      ))}
    </span>
  );
}
