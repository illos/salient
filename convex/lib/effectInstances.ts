// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 effect instances (docs/build/V158-effect-instances.md, docs/lasting-effects-design.md
 * section 1). A lasting effect is stored on the creature it applies to (its subject), or on its
 * owner when the subject is an object or squad without a live record. The owner keeps a pointer to
 * each active instance another creature holds, so `owner-dying` and `reused` find them without
 * scanning the campaign. Every write goes through the journal, so undo and redo restore instances,
 * pointers and clock registrations together. Condition instances (conditionInstances.ts) are
 * unchanged.
 */
import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import type {
  ConditionInstance,
  EffectInstance,
  EffectParty,
  OwnedEffect,
} from '../../shared/contracts/liveState';
import { bindDuration, expiryReason, timingFor } from '../../shared/resolve/lastingEffects';
import { journalPatch, type JournalScope } from './journal';
import { appendEvent } from './events';
import { registerWork, retireWork } from './clock';
import { resolveHistoricalId } from './history';
import type { ReadCtx } from './access';

export type EffectHolder = { kind: 'character' | 'foe'; id: string };
type Reader = Pick<QueryCtx, 'db'>;

const holds = (party: { kind: string }): party is EffectHolder =>
  party.kind === 'character' || party.kind === 'foe';

async function read(ctx: Reader, holder: EffectHolder) {
  if (holder.kind === 'character') {
    const row = await ctx.db.get(holder.id as Id<'characters'>);
    if (!row?.liveState) return null;
    return {
      campaignId: row.campaignId,
      name: row.authored.name,
      effectInstances: row.liveState.effectInstances ?? [],
      ownedEffects: row.liveState.ownedEffects ?? [],
    };
  }
  const row = await ctx.db.get(holder.id as Id<'foes'>);
  if (!row) return null;
  return {
    campaignId: row.campaignId,
    name: row.name,
    effectInstances: row.live.effectInstances ?? [],
    ownedEffects: row.live.ownedEffects ?? [],
  };
}

async function write(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  change: { effectInstances?: EffectInstance[]; ownedEffects?: OwnedEffect[] },
) {
  if (holder.kind === 'character') {
    const hero = await ctx.db.get(holder.id as Id<'characters'>);
    if (!hero?.liveState || hero.campaignId !== scope.campaignId)
      throw new ConvexError('Effect holder is unavailable.');
    await journalPatch(ctx, scope, 'characters', hero._id, {
      liveState: { ...hero.liveState, ...change },
    });
    return;
  }
  const foe = await ctx.db.get(holder.id as Id<'foes'>);
  if (!foe || foe.campaignId !== scope.campaignId)
    throw new ConvexError('Effect holder is unavailable.');
  await journalPatch(ctx, scope, 'foes', foe._id, { live: { ...foe.live, ...change } });
}

/** The subject holds its effect; an object or squad subject leaves it with the owner. */
export function holderOf(owner: EffectParty, subject: EffectParty): EffectHolder | undefined {
  if (holds(subject)) return { kind: subject.kind, id: subject.id };
  if (holds(owner)) return { kind: owner.kind, id: owner.id };
  return undefined;
}

const sameHolder = (a: EffectHolder, b: { kind: string; id: string }) =>
  a.kind === b.kind && a.id === b.id;

export type EffectInput = Omit<
  EffectInstance,
  'status' | 'registrationIds' | 'duration' | 'endedReason' | 'endedEventId' | 'lastSave'
>;

/**
 * Stores one instance, binds its duration to creatures and registers its clock work in a current
 * committed encounter. Outside one, nothing is scheduled and the instance is ended by `effect.end`.
 * Returns undefined when neither the subject nor the owner can hold it.
 */
export async function applyEffectInstance(
  ctx: MutationCtx,
  scope: JournalScope,
  input: EffectInput,
  encounterId?: Id<'encounters'>,
): Promise<{ instance: EffectInstance; holder: EffectHolder } | undefined> {
  const holder = holderOf(input.owner, input.subject);
  if (!holder) return undefined;
  const current = await read(ctx, holder);
  if (!current || current.campaignId !== scope.campaignId)
    throw new ConvexError('Effect holder is outside this campaign.');
  if (current.effectInstances.some(instance => instance.id === input.id))
    throw new ConvexError('Effect instance already exists.');
  if (current.effectInstances.length >= 1000)
    throw new ConvexError(
      'Too many retained effect instances; this creature requires archival before another effect can be applied.',
    );
  const duration = bindDuration(input.printedDuration, input.owner.id, input.subject.id);
  const instance: EffectInstance = {
    ...input,
    duration,
    status: 'active',
    registrationIds: [],
  };
  const timing = timingFor(duration);
  // A saving throw needs a creature that holds its own record (rule/general/saving-throw.md).
  const schedulable = timing && (timing.work !== 'saving-throw' || holds(input.subject));
  if (encounterId && schedulable) {
    const encounter = await ctx.db.get(encounterId);
    if (
      encounter?.status === 'committed' &&
      encounter.archivedAt === null &&
      encounter.campaignId === scope.campaignId
    )
      instance.registrationIds.push(
        await registerWork(ctx, scope, encounterId, {
          timing: timing.timing,
          work:
            timing.work === 'saving-throw'
              ? {
                  kind: 'saving-throw',
                  effectInstanceId: input.id,
                  creatureId: timing.creatureId,
                }
              : { kind: 'expire-effect', effectInstanceId: input.id },
          source: {
            logEntryId: input.sourceUseEventId,
            originId: input.owner.id,
            sourcePath: input.sourcePath,
            label: `${input.actorLabel}: ${input.abilityName} (lasting effect on ${input.subject.name})`,
          },
          affectedIds: [holder.id],
        }),
      );
  }
  await write(ctx, scope, holder, { effectInstances: [...current.effectInstances, instance] });
  if (holds(input.owner) && !sameHolder(holder, input.owner)) {
    const owner = await read(ctx, input.owner);
    if (owner)
      await write(ctx, scope, input.owner, {
        ownedEffects: [
          ...owner.ownedEffects,
          { id: instance.id, holder, abilityId: instance.abilityId },
        ],
      });
  }
  return { instance, holder };
}

/** Ends one active instance with a reason, retiring its clock work and its owner's pointer. */
export async function endEffectInstance(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  id: string,
  reason: string,
): Promise<EffectInstance | undefined> {
  const current = await read(ctx, holder);
  if (!current) return undefined;
  const instances = [...current.effectInstances];
  const index = instances.findIndex(instance => instance.id === id && instance.status === 'active');
  if (index === -1) return undefined;
  const instance = instances[index]!;
  for (const registrationId of instance.registrationIds) {
    const registration = await ctx.db.get(registrationId as Id<'clockRegistrations'>);
    if (registration?.status === 'active') await retireWork(ctx, scope, registration._id);
  }
  const ended: EffectInstance = {
    ...instance,
    status: 'ended',
    endedReason: reason,
    endedEventId: scope.eventId,
  };
  instances[index] = ended;
  await write(ctx, scope, holder, { effectInstances: instances });
  if (holds(instance.owner) && !sameHolder(holder, instance.owner)) {
    const ownerId = await resolveHistoricalId(ctx, scope.campaignId, instance.owner.id);
    const owner = { kind: instance.owner.kind, id: ownerId };
    const record = await read(ctx, owner);
    if (record?.ownedEffects.some(entry => entry.id === id))
      await write(ctx, scope, owner, {
        ownedEffects: record.ownedEffects.filter(entry => entry.id !== id),
      });
  }
  return ended;
}

/** The instance with this id on a hero or foe, by the creature's id. */
export async function findEffectInstance(ctx: Reader, creatureId: string, id: string) {
  const heroId = ctx.db.normalizeId('characters', creatureId);
  const foeId = ctx.db.normalizeId('foes', creatureId);
  const holder: EffectHolder | null = heroId
    ? { kind: 'character', id: heroId }
    : foeId
      ? { kind: 'foe', id: foeId }
      : null;
  if (!holder) return null;
  const record = await read(ctx, holder);
  const instance = record?.effectInstances.find(item => item.id === id);
  return record && instance ? { holder, instance, campaignId: record.campaignId } : null;
}

/** Combat end or removal stops the schedule without inventing an expiry. */
export async function unscheduleEffectInstance(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  id: string,
) {
  const current = await read(ctx, holder);
  if (!current) return;
  const instances = [...current.effectInstances];
  const index = instances.findIndex(instance => instance.id === id);
  const instance = instances[index];
  if (!instance?.registrationIds.length) return;
  for (const registrationId of instance.registrationIds) {
    const registration = await ctx.db.get(registrationId as Id<'clockRegistrations'>);
    if (registration?.status === 'active') await retireWork(ctx, scope, registration._id);
  }
  instances[index] = { ...instance, registrationIds: [] };
  await write(ctx, scope, holder, { effectInstances: instances });
}

export async function unscheduleHolderEffects(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
) {
  const current = await read(ctx, holder);
  for (const instance of current?.effectInstances ?? [])
    if (instance.registrationIds.length)
      await unscheduleEffectInstance(ctx, scope, holder, instance.id);
}

/** The owner's active instances: the ones it holds itself and the ones its pointers name. */
export async function ownedActiveEffects(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  owner: EffectHolder,
): Promise<{ holder: EffectHolder; instance: EffectInstance }[]> {
  const own = await read(ctx, owner);
  if (!own) return [];
  const found = own.effectInstances
    .filter(instance => instance.status === 'active' && instance.owner.id === owner.id)
    .map(instance => ({ holder: owner, instance }));
  for (const pointer of own.ownedEffects) {
    const holder = {
      kind: pointer.holder.kind,
      id: await resolveHistoricalId(ctx, campaignId, pointer.holder.id),
    };
    const record = await read(ctx, holder);
    const instance = record?.effectInstances.find(
      item => item.id === pointer.id && item.status === 'active',
    );
    if (instance && record!.campaignId === campaignId) found.push({ holder, instance });
  }
  return found;
}

/** One linked log entry per instance an engine rule ended inside the causing operation. */
async function logEnded(ctx: MutationCtx, scope: JournalScope, ended: EffectInstance[]) {
  if (!ended.length) return;
  const cause = (await ctx.db.get(scope.eventId))!;
  for (const instance of ended)
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: cause.encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: 'effect.ended',
      description: `${instance.actorLabel}'s ${instance.abilityName} on ${instance.subject.name} ends: ${instance.endedReason}.`,
      payload: {
        effectInstanceId: instance.id,
        sourceUseEventId: instance.sourceUseEventId,
        reason: instance.endedReason,
        sourcePath: instance.sourcePath,
      },
    });
}

/**
 * `reused`: the owner used the same ability again ("until you use this ability again"). Called by
 * ability.use before the new use stores its own instances.
 */
export async function endReusedEffects(
  ctx: MutationCtx,
  scope: JournalScope,
  owner: { kind: string; id: string },
  abilityId: string,
): Promise<EffectInstance[]> {
  if (!holds(owner)) return [];
  const ended: EffectInstance[] = [];
  for (const { holder, instance } of await ownedActiveEffects(ctx, scope.campaignId, owner))
    if (instance.abilityId === abilityId && instance.endsWhen.includes('reused')) {
      const done = await endEffectInstance(
        ctx,
        scope,
        holder,
        instance.id,
        `${instance.actorLabel} used ${instance.abilityName} again`,
      );
      if (done) ended.push(done);
    }
  await logEnded(ctx, scope, ended);
  return ended;
}

/**
 * `owner-dying` (rule/health/dying.md: "When your Stamina is 0 or lower, you are dying"): the
 * damage writer calls this when a hero owner's Stamina drops from above 0 to 0 or lower.
 */
export async function endOwnerDyingEffects(
  ctx: MutationCtx,
  scope: JournalScope,
  heroId: Id<'characters'>,
): Promise<EffectInstance[]> {
  const ended: EffectInstance[] = [];
  const owner: EffectHolder = { kind: 'character', id: heroId };
  for (const { holder, instance } of await ownedActiveEffects(ctx, scope.campaignId, owner))
    if (instance.endsWhen.includes('owner-dying')) {
      const done = await endEffectInstance(
        ctx,
        scope,
        holder,
        instance.id,
        `${instance.actorLabel} is dying`,
      );
      if (done) ended.push(done);
    }
  await logEnded(ctx, scope, ended);
  return ended;
}

/**
 * `maintained` (V148 resource.maintain, feature/elementalist/level-1/persistent-magic.md): when the
 * owner maintains fewer instances of an ability than it has active maintained effects of it, the
 * oldest excess effects end. Interpretation: maintenance entries name the ability, not the
 * instance, so the oldest effect is taken as the one no longer maintained. The alternative, asking
 * the table which instance ends, needs a choice card; `effect.end` corrects the pick.
 */
export async function endUnmaintainedEffects(
  ctx: MutationCtx,
  scope: JournalScope,
  heroId: Id<'characters'>,
  maintained: readonly { ability: string }[],
): Promise<EffectInstance[]> {
  const owner: EffectHolder = { kind: 'character', id: heroId };
  const active = (await ownedActiveEffects(ctx, scope.campaignId, owner))
    .filter(({ instance }) => instance.duration.kind === 'maintained')
    .sort((a, b) => a.instance.appliedSequence - b.instance.appliedSequence);
  const ended: EffectInstance[] = [];
  for (const name of new Set(active.map(({ instance }) => instance.abilityName))) {
    const ofAbility = active.filter(({ instance }) => instance.abilityName === name);
    const excess = ofAbility.length - maintained.filter(entry => entry.ability === name).length;
    for (const { holder, instance } of ofAbility.slice(0, Math.max(0, excess))) {
      const done = await endEffectInstance(ctx, scope, holder, instance.id, 'no longer maintained');
      if (done) ended.push(done);
    }
  }
  await logEnded(ctx, scope, ended);
  return ended;
}

/** Records a saving throw on a save-ends instance; a success ends it (rule/general/saving-throw.md). */
export async function recordEffectSave(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  id: string,
  save: NonNullable<ConditionInstance['lastSave']>,
) {
  const current = await read(ctx, holder);
  if (!current) return;
  await write(ctx, scope, holder, {
    effectInstances: current.effectInstances.map(instance =>
      instance.id === id ? { ...instance, lastSave: save } : instance,
    ),
  });
  if (save.success) await endEffectInstance(ctx, scope, holder, id, 'successful saving throw');
}

/** Ends an instance at its clock boundary; the reason names the bound duration. */
export async function expireEffectInstance(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  instance: EffectInstance,
) {
  return endEffectInstance(ctx, scope, holder, instance.id, expiryReason(instance.duration));
}

export interface ListedEffect {
  holder: EffectHolder & { name: string };
  instance: EffectInstance;
}

/** Every active instance in the campaign, per holder in roster order. */
export async function campaignEffects(
  ctx: Reader,
  campaignId: Id<'campaigns'>,
): Promise<ListedEffect[]> {
  const heroes = await ctx.db
    .query('characters')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .take(200);
  const foes = await ctx.db
    .query('foes')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .take(500);
  const listed: ListedEffect[] = [];
  for (const hero of heroes)
    for (const instance of hero.liveState?.effectInstances ?? [])
      if (instance.status === 'active')
        listed.push({
          holder: { kind: 'character', id: hero._id, name: hero.authored.name },
          instance,
        });
  for (const foe of foes)
    for (const instance of foe.live.effectInstances ?? [])
      if (instance.status === 'active')
        listed.push({ holder: { kind: 'foe', id: foe._id, name: foe.name }, instance });
  return listed;
}

/** One instance by id anywhere in the campaign, active or not. */
export async function findCampaignEffect(
  ctx: Reader,
  campaignId: Id<'campaigns'>,
  id: string,
): Promise<ListedEffect | null> {
  const heroes = await ctx.db
    .query('characters')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .take(200);
  for (const hero of heroes) {
    const instance = hero.liveState?.effectInstances?.find(item => item.id === id);
    if (instance)
      return {
        holder: { kind: 'character', id: hero._id, name: hero.authored.name },
        instance,
      };
  }
  const foes = await ctx.db
    .query('foes')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .take(500);
  for (const foe of foes) {
    const instance = foe.live.effectInstances?.find(item => item.id === id);
    if (instance) return { holder: { kind: 'foe', id: foe._id, name: foe.name }, instance };
  }
  return null;
}
