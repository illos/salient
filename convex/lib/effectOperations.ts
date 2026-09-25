// SPDX-License-Identifier: GPL-3.0-only
/**
 * V158 `effect.list` and `effect.end` (docs/lasting-effects-design.md#operations-cliapi,
 * docs/build/V158-effect-instances.md): registered operations, so the sheet buttons, the palette,
 * slash text and headless calls share one route. Listing reads the stored instances; ending writes
 * through the journal with its reason, so undo and redo restore the instance and its clock work.
 */
import { ConvexError, v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { Reference } from '../../shared/commands/envelope';
import type { EffectInstance } from '../../shared/contracts/liveState';
import { describeDuration } from '../../shared/resolve/lastingEffects';
import { describeModifier } from '../../shared/resolve/modifiers';
import { describeWatcher } from '../../shared/resolve/watchers';
import { describeMark, effectVisibleTo } from '../../shared/resolve/marks';
import { describeArea } from '../../shared/resolve/areas';
import { bindActor } from './actors';
import { campaignEffects, endEffectInstance, findCampaignEffect } from './effectInstances';
import { addAreaMember, findMember, removeAreaMember } from './areas';
import { committedEncounter } from './encounters';
import { resolveHistoricalId } from './history';
import type { OperationDefinition, Outcome } from './registry';

function summary(instance: EffectInstance, holder: { kind: string; id: string; name: string }) {
  return {
    id: instance.id,
    kind: instance.kind,
    holder,
    owner: instance.owner,
    subject: instance.subject,
    abilityId: instance.abilityId,
    abilityName: instance.abilityName,
    actorLabel: instance.actorLabel,
    sourcePath: instance.sourcePath,
    clause: instance.clause,
    payload: instance.payload,
    printedDuration: instance.printedDuration,
    duration: instance.duration,
    endsWhen: instance.endsWhen,
    scheduled: instance.registrationIds.length > 0,
    ...(instance.manualStacking ? { manualStacking: true } : {}),
    // V200: an area's members, and the area a member's rider belongs to.
    ...(instance.members
      ? {
          members: instance.members.map(member => ({
            party: member.party,
            effects: member.effects,
            ...(member.manual ? { manual: member.manual } : {}),
          })),
        }
      : {}),
    ...(instance.area ? { area: instance.area } : {}),
    sourceUseEventId: instance.sourceUseEventId,
  };
}

const effectList: OperationDefinition = {
  id: 'effect.list',
  family: 'effect',
  verb: 'list',
  title: 'List active effects',
  description:
    'List the active lasting effects at the table, or those a creature holds, owns or is the subject of: source, duration, the printed table work, any modifier the engine applies (its instance id is what ability.use and ability.correct exclude) and any watcher the engine fires.',
  args: {
    creature: v.optional(
      v.union(v.object({ name: v.string() }), v.object({ refKind: v.string(), id: v.string() })),
    ),
  },
  argDescriptions: {
    creature: 'Only effects on, owned by or held by this hero or foe, as @Name or @{foe:id}.',
  },
  roles: ['director', 'player', 'observer'],
  session: 'active',
  actor: 'none',
  execute: async (ctx, { context, args }): Promise<Outcome> => {
    let creature: { id: string; name: string } | null = null;
    if (args.creature !== undefined) {
      const reference = args.creature as Reference;
      const current =
        'id' in reference
          ? {
              ...reference,
              id: await resolveHistoricalId(ctx, context.campaign._id, reference.id),
            }
          : reference;
      const bound = await bindActor(ctx, { ...context, role: 'director' }, current);
      creature = { id: bound.id, name: bound.name };
    }
    const listed = (await campaignEffects(ctx, context.campaign._id)).filter(
      ({ holder, instance }) =>
        // V175: whether players see marks is decided in one place (shared/resolve/marks.ts).
        effectVisibleTo(instance.kind, context.role) &&
        (!creature ||
          holder.id === creature.id ||
          instance.owner.id === creature.id ||
          instance.subject.id === creature.id),
    );
    const lines = listed.map(
      ({ instance }, index) =>
        `${index + 1}. ${instance.actorLabel}'s ${instance.abilityName} on ${instance.subject.name}, ${describeDuration(instance.printedDuration, instance.endsWhen)}${instance.registrationIds.length ? '' : ' (unscheduled)'}: "${instance.payload.text}"${instance.payload.kind === 'modifier' ? ` (${describeModifier(instance.payload.modifier)}${instance.consumeOn ? ', used up by the next roll' : ''})` : ''}${instance.payload.kind === 'watcher' ? ` (${describeWatcher(instance.payload.watcher)}${instance.manualStacking ? '; manual stacking, the engine does not fire it' : ''})` : ''}${instance.payload.kind === 'mark' ? ` (${describeMark(instance.owner.name, instance.subject.name)})` : ''}${instance.payload.kind === 'area' ? ` (${describeArea(instance.payload.area)}; members: ${(instance.members ?? []).map(member => `${member.party.name}${member.manual ? ' (manual)' : ''}`).join(', ') || 'none'})` : ''}`,
    );
    return {
      kind: 'effect.list',
      description: listed.length
        ? `Active effects${creature ? ` for ${creature.name}` : ''}: ${lines.join(' ')}`
        : `No active effects${creature ? ` for ${creature.name}` : ''}.`,
      data: {
        ...(creature ? { creature } : {}),
        effects: listed.map(({ holder, instance }) => summary(instance, holder)),
      },
    };
  },
};

const effectEnd: OperationDefinition = {
  id: 'effect.end',
  family: 'effect',
  verb: 'end',
  title: 'End an effect',
  description:
    'End one active lasting effect with a journaled reason. The Director ends any effect; a player ends effects owned by or applied to a hero they control.',
  args: { instance: v.string(), note: v.optional(v.string()) },
  argDescriptions: {
    instance: 'The effect instance id, as effect.list gives it.',
    note: 'Why it ends, up to 500 characters.',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }): Promise<Outcome> => {
    const id = String(args.instance);
    const note = args.note === undefined ? undefined : String(args.note).trim();
    if (note !== undefined && note.length > 500)
      throw new ConvexError('An effect note is at most 500 characters.');
    const found = await findCampaignEffect(ctx, context.campaign._id, id);
    if (!found) throw new ConvexError('No effect with that id is at this table.');
    const { holder, instance } = found;
    if (instance.status !== 'active')
      throw new ConvexError(
        `${instance.abilityName} on ${instance.subject.name} has already ended (${instance.endedReason ?? instance.status}).`,
      );
    if (context.role !== 'director') {
      // Anyone controlling the owner or the subject may end it (design, Operations). V175: a mark is
      // ended willingly by its owner ("You can willingly end your mark", mark.md), so only the
      // owner's player (or the Director) may end it.
      let controls = false;
      for (const party of instance.kind === 'mark'
        ? [instance.owner]
        : [instance.owner, instance.subject]) {
        if (party.kind !== 'character') continue;
        const heroId = ctx.db.normalizeId(
          'characters',
          await resolveHistoricalId(ctx, context.campaign._id, party.id),
        );
        const hero = heroId ? await ctx.db.get(heroId as Id<'characters'>) : null;
        if (hero?.campaignId === context.campaign._id && hero.ownerId === context.user._id)
          controls = true;
      }
      if (!controls)
        throw new ConvexError(
          instance.kind === 'mark'
            ? `Only ${instance.owner.name}'s player or the Director can end ${instance.owner.name}'s mark (mark.md: "You can willingly end your mark").`
            : `You do not control ${instance.owner.name} or ${instance.subject.name}; the Director ends this effect.`,
        );
    }
    const reason = `ended by ${context.user.displayName}${note ? `: ${note}` : ''}`;
    return {
      kind: 'effect.end',
      description: `${context.user.displayName} ends ${instance.actorLabel}'s ${instance.abilityName} on ${instance.subject.name}${note ? `: ${note}` : '.'}`,
      data: { effect: summary(instance, holder), reason, ...(note ? { note } : {}) },
      commit: async (mctx, scope) => {
        await endEffectInstance(mctx, scope, holder, instance.id, reason);
      },
    };
  },
};

/** Whether the caller's player controls one of these heroes (the Director always may act). */
async function controlsAny(
  ctx: Parameters<OperationDefinition['execute']>[0],
  context: Parameters<OperationDefinition['execute']>[1]['context'],
  parties: readonly { kind: string; id: string }[],
): Promise<boolean> {
  if (context.role === 'director') return true;
  for (const party of parties) {
    if (party.kind !== 'character') continue;
    const heroId = ctx.db.normalizeId(
      'characters',
      await resolveHistoricalId(ctx, context.campaign._id, party.id),
    );
    const hero = heroId ? await ctx.db.get(heroId as Id<'characters'>) : null;
    if (hero?.campaignId === context.campaign._id && hero.ownerId === context.user._id) return true;
  }
  return false;
}

/**
 * V200 `effect.members` (docs/lasting-effects-design.md#6-areas-and-auras). There is no map, so the
 * table keeps who is in an area or aura (user ruling, 2026-09-25). Adding a member is an explicit
 * "enters the area": its riders are stored and its enter riders fire within their printed limit.
 * Removing one is leaving: its riders end. Both are journaled with the actor, so undo of an add
 * reverses the membership and everything the enter rider did.
 */
const effectMembers: OperationDefinition = {
  id: 'effect.members',
  family: 'effect',
  verb: 'members',
  title: 'Change who is in an area',
  description:
    'Add a creature to an area or aura (it enters the area: enter riders fire within their limit) or remove one (it leaves; its riders end). The table keeps the members: there is no map. The Director changes any area; a player changes areas their hero owns or moves their own hero.',
  args: {
    instance: v.string(),
    add: v.optional(
      v.union(v.object({ name: v.string() }), v.object({ refKind: v.string(), id: v.string() })),
    ),
    remove: v.optional(
      v.union(v.object({ name: v.string() }), v.object({ refKind: v.string(), id: v.string() })),
    ),
    note: v.optional(v.string()),
  },
  argDescriptions: {
    instance: 'The area effect instance id, as effect.list gives it.',
    add: 'The hero or foe entering the area, as @Name or @{foe:id}.',
    remove: 'The hero or foe leaving the area, as @Name or @{foe:id}.',
    note: 'Why, up to 500 characters.',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'none',
  execute: async (ctx, { context, args }): Promise<Outcome> => {
    const id = String(args.instance);
    const note = args.note === undefined ? undefined : String(args.note).trim();
    if (note !== undefined && note.length > 500)
      throw new ConvexError('A note is at most 500 characters.');
    if ((args.add === undefined) === (args.remove === undefined))
      throw new ConvexError('Give exactly one of add=@Creature or remove=@Creature.');
    const found = await findCampaignEffect(ctx, context.campaign._id, id);
    if (!found || found.instance.payload.kind !== 'area')
      throw new ConvexError('No area with that id is at this table.');
    const { holder, instance } = found;
    if (instance.status !== 'active')
      throw new ConvexError(
        `${instance.actorLabel}'s ${instance.abilityName} area has already ended (${instance.endedReason ?? instance.status}).`,
      );
    const reference = (args.add ?? args.remove) as Reference;
    const current =
      'id' in reference
        ? { ...reference, id: await resolveHistoricalId(ctx, context.campaign._id, reference.id) }
        : reference;
    const bound = await bindActor(ctx, { ...context, role: 'director' }, current);
    if (bound.kind === 'squad')
      throw new ConvexError(
        `${bound.name} is a squad: add or remove its minions one by one (the table resolves the area's riders for them).`,
      );
    const party = { kind: bound.kind, id: bound.id, name: bound.name };
    if (!(await controlsAny(ctx, context, [instance.owner, party])))
      throw new ConvexError(
        `You do not control ${instance.owner.name} or ${party.name}; the Director changes this area.`,
      );
    const member = await findMember(ctx, context.campaign._id, instance, party.id);
    const area = `${instance.actorLabel}'s ${instance.abilityName}`;
    const who = context.user.displayName;
    if (args.add !== undefined) {
      if (member) throw new ConvexError(`${party.name} is already in ${area}.`);
      const encounter = await committedEncounter(ctx, context.campaign);
      return {
        kind: 'effect.members',
        description: `${who}: ${party.name} enters ${area}${note ? ` (${note})` : ''}.`,
        data: {
          effectInstanceId: instance.id,
          change: 'add',
          member: party,
          ...(note ? { note } : {}),
        },
        commit: async (mctx, scope) => {
          await addAreaMember(mctx, scope, holder, instance.id, party, encounter?._id);
        },
      };
    }
    if (!member) throw new ConvexError(`${party.name} is not in ${area}.`);
    // An area that names its user ("Self and each ally in the area") is an aura: it "always
    // originates from you and moves with you" (rule/combat/aura.md), so its user never leaves it.
    if (
      party.id === instance.owner.id &&
      instance.payload.kind === 'area' &&
      instance.payload.area.riders.some(rider => rider.who.self)
    )
      throw new ConvexError(
        `${area} originates from ${instance.owner.name} and moves with them (rule/combat/aura.md), so ${instance.owner.name} can't leave it; end the effect with /effect end instead.`,
      );
    return {
      kind: 'effect.members',
      description: `${who}: ${party.name} leaves ${area}${note ? ` (${note})` : ''}.`,
      data: {
        effectInstanceId: instance.id,
        change: 'remove',
        member: party,
        ...(note ? { note } : {}),
      },
      commit: async (mctx, scope) => {
        await removeAreaMember(
          mctx,
          scope,
          holder,
          instance.id,
          party.id,
          `${party.name} left ${area} (removed by ${who}${note ? `: ${note}` : ''})`,
        );
      },
    };
  },
};

export const effectOperations: OperationDefinition[] = [effectList, effectEnd, effectMembers];
