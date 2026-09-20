// SPDX-License-Identifier: GPL-3.0-only
// V88: source-linked save-ends instances. Toggle consequences remain manual.
import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type {
  ConditionId,
  ConditionInstance,
  ConditionToggles,
} from '../../shared/contracts/liveState';
import { noConditions } from './characterBuild';
import { journalPatch, type JournalScope } from './journal';
import { registerWork, retireWork } from './clock';

export type ConditionTarget = { kind: 'character' | 'foe'; id: string };
type ConditionState = {
  conditions?: ConditionToggles;
  manualConditions?: ConditionToggles;
  conditionInstances?: ConditionInstance[];
};

async function read(ctx: Pick<QueryCtx, 'db'>, target: ConditionTarget) {
  if (target.kind === 'character') {
    const row = await ctx.db.get(target.id as Id<'characters'>);
    if (!row?.liveState) throw new ConvexError('Condition target is unavailable.');
    return { campaignId: row.campaignId, live: row.liveState };
  }
  const row = await ctx.db.get(target.id as Id<'foes'>);
  if (!row) throw new ConvexError('Condition target is unavailable.');
  return { campaignId: row.campaignId, live: row.live };
}

async function write(
  ctx: MutationCtx,
  scope: JournalScope,
  target: ConditionTarget,
  change: ConditionState,
) {
  const { campaignId, live } = await read(ctx, target);
  if (campaignId !== scope.campaignId)
    throw new ConvexError('Condition target is outside this campaign.');
  if (target.kind === 'character') {
    const hero = await ctx.db.get(target.id as Id<'characters'>);
    await journalPatch(ctx, scope, 'characters', hero!._id, {
      liveState: { ...hero!.liveState!, ...change },
    });
  } else {
    await journalPatch(ctx, scope, 'foes', target.id as Id<'foes'>, {
      live: { ...live, ...change },
    });
  }
}

function toggles(manual: ConditionToggles, instances: ConditionInstance[]): ConditionToggles {
  const result = { ...manual };
  for (const instance of instances)
    if (instance.status === 'active') result[instance.condition] = true;
  return result;
}

export async function hasRolledConditionSave(
  ctx: Pick<QueryCtx, 'db'>,
  target: ConditionTarget,
  sourceUseEventId: string,
) {
  const { live } = await read(ctx, target);
  return (live.conditionInstances ?? []).some(
    instance => instance.sourceUseEventId === sourceUseEventId && instance.lastSave !== undefined,
  );
}

export async function applyConditionInstance(
  ctx: MutationCtx,
  scope: JournalScope,
  target: ConditionTarget,
  input: Pick<
    ConditionInstance,
    'id' | 'condition' | 'sourceUseEventId' | 'abilityName' | 'actorLabel' | 'sourcePath'
  >,
  encounterId?: Id<'encounters'>,
): Promise<ConditionInstance> {
  const { live, campaignId } = await read(ctx, target);
  if (campaignId !== scope.campaignId)
    throw new ConvexError('Condition target is outside this campaign.');
  const instances = [...(live.conditionInstances ?? [])];
  if (instances.some(instance => instance.id === input.id))
    throw new ConvexError('Condition occurrence already exists.');
  if (instances.length >= 1000)
    throw new ConvexError(
      'Too many retained condition instances; this target requires archival before another condition can be applied.',
    );
  const manual = live.manualConditions ?? live.conditions ?? noConditions();
  const instance: ConditionInstance = { ...input, duration: 'save-ends', status: 'active' };
  if (encounterId) {
    const encounter = await ctx.db.get(encounterId);
    if (
      encounter?.status === 'committed' &&
      encounter.archivedAt === null &&
      encounter.campaignId === scope.campaignId
    ) {
      instance.registrationId = await registerWork(ctx, scope, encounterId, {
        timing: {
          scope: 'creature-turn',
          boundary: 'turn-end',
          creatureId: target.id,
          occurrence: 'each',
        },
        work: { kind: 'saving-throw', effectInstanceId: input.id, creatureId: target.id },
        source: {
          logEntryId: input.sourceUseEventId,
          sourcePath: input.sourcePath,
          label: `${input.actorLabel}: ${input.abilityName} (${input.condition})`,
        },
        affectedIds: [target.id],
      });
    }
  }
  instances.push(instance);
  await write(ctx, scope, target, {
    manualConditions: manual,
    conditionInstances: instances,
    conditions: toggles(manual, instances),
  });
  return instance;
}

export async function endConditionInstance(
  ctx: MutationCtx,
  scope: JournalScope,
  target: ConditionTarget,
  id: string,
  reason: string,
) {
  const { live } = await read(ctx, target);
  const instances = [...(live.conditionInstances ?? [])];
  const index = instances.findIndex(instance => instance.id === id && instance.status === 'active');
  if (index === -1) return;
  const instance = instances[index]!;
  if (instance.registrationId)
    await retireWork(ctx, scope, instance.registrationId as Id<'clockRegistrations'>);
  instances[index] = { ...instance, status: 'ended', endedReason: reason };
  const manual = live.manualConditions ?? noConditions();
  await write(ctx, scope, target, {
    conditionInstances: instances,
    conditions: toggles(manual, instances),
  });
}

export async function setManualCondition(
  ctx: MutationCtx,
  scope: JournalScope,
  target: ConditionTarget,
  condition: ConditionId,
  on: boolean,
) {
  let { live } = await read(ctx, target);
  if (!live.conditionInstances && !live.manualConditions) {
    if (!live.conditions) await write(ctx, scope, target, { conditions: noConditions() });
    await write(ctx, scope, target, {
      conditions: { ...(live.conditions ?? noConditions()), [condition]: on },
    });
    return;
  }
  if (!on)
    for (const instance of live.conditionInstances ?? []) {
      if (instance.status === 'active' && instance.condition === condition)
        await endConditionInstance(ctx, scope, target, instance.id, 'condition.off');
    }
  live = (await read(ctx, target)).live;
  const manual = {
    ...(live.manualConditions ?? live.conditions ?? noConditions()),
    [condition]: on,
  };
  await write(ctx, scope, target, {
    manualConditions: manual,
    conditions: toggles(manual, live.conditionInstances ?? []),
  });
}

export async function recordConditionSave(
  ctx: MutationCtx,
  scope: JournalScope,
  target: ConditionTarget,
  id: string,
  save: NonNullable<ConditionInstance['lastSave']>,
) {
  const { live } = await read(ctx, target);
  const instances = (live.conditionInstances ?? []).map(instance =>
    instance.id === id ? { ...instance, lastSave: save } : instance,
  );
  await write(ctx, scope, target, { conditionInstances: instances });
  if (save.success) await endConditionInstance(ctx, scope, target, id, 'successful saving throw');
}

export async function findConditionInstance(
  ctx: Pick<QueryCtx, 'db'>,
  creatureId: string,
  id: string,
) {
  const heroId = ctx.db.normalizeId('characters', creatureId);
  const foeId = ctx.db.normalizeId('foes', creatureId);
  const target: ConditionTarget | null = heroId
    ? { kind: 'character', id: heroId }
    : foeId
      ? { kind: 'foe', id: foeId }
      : null;
  if (!target) return null;
  const row = heroId ? await ctx.db.get(heroId) : await ctx.db.get(foeId!);
  if (!row || ('liveState' in row && !row.liveState)) return null;
  const { live, campaignId } = await read(ctx, target);
  const instance = live.conditionInstances?.find(item => item.id === id);
  return instance ? { target, instance, campaignId } : null;
}

/** Combat ending/removal stops this clock schedule without inventing an effect expiration. */
export async function unscheduleConditionInstance(
  ctx: MutationCtx,
  scope: JournalScope,
  target: ConditionTarget,
  id: string,
) {
  const { live } = await read(ctx, target);
  const instances = [...(live.conditionInstances ?? [])];
  const index = instances.findIndex(instance => instance.id === id);
  const instance = instances[index];
  if (!instance?.registrationId) return;
  const registration = await ctx.db.get(instance.registrationId as Id<'clockRegistrations'>);
  if (registration?.status === 'active') await retireWork(ctx, scope, registration._id);
  const next = { ...instance };
  delete next.registrationId;
  instances[index] = next;
  await write(ctx, scope, target, { conditionInstances: instances });
}

export async function unscheduleTargetConditions(
  ctx: MutationCtx,
  scope: JournalScope,
  target: ConditionTarget,
) {
  const { live } = await read(ctx, target);
  for (const instance of live.conditionInstances ?? []) {
    if (instance.registrationId) await unscheduleConditionInstance(ctx, scope, target, instance.id);
  }
}
