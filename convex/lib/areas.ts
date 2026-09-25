// SPDX-License-Identifier: GPL-3.0-only
/**
 * V200 areas and auras (docs/build/V200-areas-and-auras.md,
 * docs/lasting-effects-design.md#6-areas-and-auras). An area is an `area` effect instance held by
 * its user, with the members the table keeps. There is no map: the user ruled on 2026-09-25 that
 * the table picks the members (the use's targets, then `effect.members`), and that adding a member
 * is an explicit "enters the area", so enter riders fire then, within their printed limit.
 *
 * Each rider an area prints is stored as a child `watcher` instance on each member it applies to
 * (`EffectInstance.area` links it), so the V171 watcher machinery registers, fires, limits and
 * journals it, and the V158 stacking boundary sees it. A member who leaves loses its children; the
 * area's end ends them all (effectInstances.ts endEffectInstance). Every write goes through the
 * operation's journal, so undo of an add reverses the membership, the riders and whatever the enter
 * rider did.
 */
import { ConvexError } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { AreaMember, EffectInstance, EffectParty } from '../../shared/contracts/liveState';
import { riderApplies, sameAreaPayload, type AreaSide } from '../../shared/resolve/areas';
import { plain } from '../../shared/resolve/abilityGrammar';
import { baselineOf } from './characterBuild';
import {
  applyEffectInstance,
  endEffectInstance,
  logEnded,
  ownedActiveEffects,
  patchEffectInstance,
  readHolder,
  type EffectHolder,
  type EffectInput,
} from './effectInstances';
import { resolveHistoricalId } from './history';
import type { JournalScope } from './journal';
import { appendEvent } from './events';
import type { ReadCtx } from './access';
import { observeWatchers } from './watchers';

const sideOf = (party: { kind: string }): AreaSide =>
  party.kind === 'character' ? 'heroes' : 'director';

/**
 * Why the table resolves an area's riders for this member, or undefined when the engine keeps
 * them. V158: a squad or object carries no record of its own; a squad minion's turns and Stamina
 * are its squad's, which the engine doesn't track per creature (V171 watchers skip them too).
 */
async function manualReason(ctx: MutationCtx, party: EffectParty): Promise<string | undefined> {
  if (party.kind === 'squad' || party.kind === 'object')
    return `${party.name} is a ${party.kind}, which holds no effects of its own; resolve this area's riders for it at the table`;
  if (party.kind === 'foe') {
    const foeId = ctx.db.normalizeId('foes', party.id);
    const foe = foeId ? await ctx.db.get(foeId) : null;
    if (!foe) return `${party.name} is no longer at the table`;
    if (foe.squadId)
      return `${party.name} is a squad minion, whose turns and Stamina pool are its squad's; resolve this area's riders for it at the table`;
  }
  return undefined;
}

/** The area instance with this id on its holder, active or not. */
async function readArea(ctx: MutationCtx, holder: EffectHolder, id: string) {
  const record = await readHolder(ctx, holder);
  const instance = record?.effectInstances.find(item => item.id === id);
  return instance?.payload.kind === 'area' ? instance : undefined;
}

export interface Joined {
  member: AreaMember;
  /** Rider instances stored on the member, and the ones that joined a manual stacking group. */
  stored: EffectInstance[];
  manualGroup: EffectInstance[];
}

/**
 * Puts one creature in an area: stores each rider that applies to it (shared/resolve/areas.ts
 * riderApplies) as a child watcher on it, and returns its member record. The caller writes the
 * membership list. A rider's earlier firings on this creature in this area (it left and came back)
 * carry over, so "the first time in a combat round" is not reset by leaving.
 */
async function storeRiders(
  ctx: MutationCtx,
  scope: JournalScope,
  area: EffectInstance,
  areaHolder: EffectHolder,
  party: EffectParty,
  encounterId: Id<'encounters'> | undefined,
): Promise<Joined> {
  if (area.payload.kind !== 'area') throw new ConvexError('Not an area.');
  const manual = await manualReason(ctx, party);
  const member: AreaMember = { party, effects: [], addedEventId: scope.eventId };
  if (manual) return { member: { ...member, manual }, stored: [], manualGroup: [] };
  const holder: EffectHolder = { kind: party.kind as 'character' | 'foe', id: party.id };
  const earlier = (await readHolder(ctx, holder))?.effectInstances ?? [];
  const stored: EffectInstance[] = [];
  const manualGroup: EffectInstance[] = [];
  for (const [index, rider] of area.payload.area.riders.entries()) {
    if (
      !riderApplies(
        rider.who,
        { id: party.id, side: sideOf(party) },
        { id: area.owner.id, side: sideOf(area.owner) },
      )
    )
      continue;
    const previous = earlier.filter(
      instance => instance.area?.id === area.id && instance.area.rider === index,
    );
    const firings = previous[previous.length - 1]?.firings;
    const input: EffectInput = {
      id: `${area.id}|${scope.eventId}|${party.id}|${index}`,
      kind: 'watcher',
      sourceUseEventId: area.sourceUseEventId,
      sourceActorId: area.sourceActorId,
      abilityId: area.abilityId,
      abilityName: area.abilityName,
      actorLabel: area.actorLabel,
      sourcePath: area.sourcePath,
      clause: area.clause,
      owner: area.owner,
      subject: party,
      payload: { kind: 'watcher', text: area.payload.text, watcher: rider.watcher },
      // The rider lasts while the member is in the area; the area's own duration ends it.
      printedDuration: { kind: 'none' },
      endsWhen: area.endsWhen.filter(trigger => trigger === 'owner-dying'),
      appliedSequence: area.appliedSequence,
      area: { id: area.id, holder: { kind: areaHolder.kind, id: areaHolder.id }, rider: index },
      ...(firings?.length ? { firings } : {}),
    };
    const result = await applyEffectInstance(ctx, scope, input, encounterId);
    if (!result) continue;
    if ('untracked' in result) continue;
    member.effects.push(result.instance.id);
    if (result.manualGroup) manualGroup.push(result.instance);
    else stored.push(result.instance);
  }
  return { member, stored, manualGroup };
}

export interface AppliedArea {
  instance: EffectInstance;
  holder: EffectHolder;
  endedAtApplication?: string;
  joined: Joined[];
}

/**
 * Stores a use's area on its user with the use's targets as its first members. They are placed in
 * the area by the use, not entering it, so no enter rider fires (labelled interpretation, Q-AREA-2
 * point 4; the alternative is firing enter riders for every target at use).
 */
export async function applyArea(
  ctx: MutationCtx,
  scope: JournalScope,
  input: EffectInput,
  members: EffectParty[],
  encounterId: Id<'encounters'> | undefined,
): Promise<AppliedArea | undefined> {
  if (input.payload.kind !== 'area' || input.kind !== 'area') throw new ConvexError('Not an area.');
  if (input.owner.kind !== 'character' && input.owner.kind !== 'foe') return undefined;
  // "Stacking Unique Effects" (Heroes book): the same ability used again doesn't stack, and the
  // most recent use sets the duration. The same user's identical aura "originates from you and
  // moves with you" (rule/combat/aura.md), so both cover the same creatures: the newer use
  // supersedes the older, whose riders end with it, as V158 supersedes an identical repeat. Areas
  // placed elsewhere (Incinerate's column) are not the same squares, so they stay separate and a
  // creature in both holds a manual stacking group.
  const superseded: EffectInstance[] = [];
  if (input.payload.area.aura) {
    const owner = { kind: input.owner.kind, id: input.owner.id };
    for (const { holder, instance } of await ownedActiveEffects(ctx, scope.campaignId, owner))
      if (
        instance.kind === 'area' &&
        instance.abilityId === input.abilityId &&
        instance.payload.kind === 'area' &&
        sameAreaPayload(instance.payload.area, input.payload.area) &&
        JSON.stringify(instance.endsWhen) === JSON.stringify(input.endsWhen)
      ) {
        const done = await endEffectInstance(
          ctx,
          scope,
          holder,
          instance.id,
          'superseded by a newer use of the same ability (the most recent use sets the duration)',
        );
        if (done) superseded.push(done);
      }
    await logEnded(ctx, scope, superseded);
  }
  const result = await applyEffectInstance(ctx, scope, input, encounterId);
  if (!result || 'untracked' in result) return undefined;
  if (result.endedAtApplication)
    return { ...result, endedAtApplication: result.endedAtApplication, joined: [] };
  const joined: Joined[] = [];
  for (const party of members)
    joined.push(await storeRiders(ctx, scope, result.instance, result.holder, party, encounterId));
  const list = joined.map(entry => entry.member);
  await patchEffectInstance(ctx, scope, result.holder, result.instance.id, instance => ({
    ...instance,
    members: list,
  }));
  return { instance: { ...result.instance, members: list }, holder: result.holder, joined };
}

/**
 * `effect.members add`: the creature enters the area (user ruling, 2026-09-25). Its riders are
 * stored, then its enter riders fire within their limit as linked consequences of the operation.
 */
export async function addAreaMember(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  areaId: string,
  party: EffectParty,
  encounterId: Id<'encounters'> | undefined,
): Promise<Joined> {
  const area = await readArea(ctx, holder, areaId);
  if (!area || area.status !== 'active') throw new ConvexError('That area is not active.');
  const joined = await storeRiders(ctx, scope, area, holder, party, encounterId);
  await patchEffectInstance(ctx, scope, holder, areaId, instance => ({
    ...instance,
    members: [...(instance.members ?? []), joined.member],
  }));
  // Why the table resolves some or all of this member's riders, as a linked entry.
  const manual = joined.member.manual
    ? joined.member.manual
    : joined.manualGroup.length
      ? `${party.name} is already under ${area.abilityName} from another area in a way the engine can't resolve, so these riders form a manual stacking group and the engine fires none of them; apply the stacking rule at the table (Stacking Unique Effects)`
      : undefined;
  if (manual) {
    const cause = (await ctx.db.get(scope.eventId))!;
    await appendEvent(ctx, {
      campaignId: scope.campaignId,
      sessionId: cause.sessionId,
      encounterId: cause.encounterId,
      origin: 'engine',
      commandId: cause.commandId,
      causeEventId: scope.eventId,
      kind: 'effect.untracked',
      description: `${area.actorLabel}'s ${area.abilityName}: ${manual}.`,
      payload: { effectInstanceId: area.id, member: party, sourcePath: area.sourcePath },
    });
  }
  if (!joined.member.manual)
    await observeWatchers(ctx, scope, { kind: party.kind as 'character' | 'foe', id: party.id }, [
      { event: 'area-entered', creatureId: party.id, areaId },
    ]);
  return joined;
}

/**
 * `effect.members remove`: the creature leaves the area. The riders it held end, with a linked
 * `effect.ended` entry each.
 */
export async function removeAreaMember(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  areaId: string,
  memberId: string,
  reason: string,
): Promise<EffectInstance[]> {
  const area = await readArea(ctx, holder, areaId);
  if (!area || area.status !== 'active') throw new ConvexError('That area is not active.');
  const member = await findMember(ctx, scope.campaignId, area, memberId);
  if (!member) throw new ConvexError('That creature is not in the area.');
  const ended: EffectInstance[] = [];
  if (member.party.kind === 'character' || member.party.kind === 'foe') {
    const memberHolder: EffectHolder = {
      kind: member.party.kind,
      id: await resolveHistoricalId(ctx, scope.campaignId, member.party.id),
    };
    for (const childId of member.effects) {
      const done = await endEffectInstance(ctx, scope, memberHolder, childId, reason);
      if (done) ended.push(done);
    }
  }
  await patchEffectInstance(ctx, scope, holder, areaId, instance => ({
    ...instance,
    members: (instance.members ?? []).filter(entry => entry.party.id !== member.party.id),
  }));
  await logEnded(ctx, scope, ended);
  return ended;
}

/** The member record for a creature id, matching ids recorded before an undo or redo. */
export async function findMember(
  ctx: ReadCtx,
  campaignId: Id<'campaigns'>,
  area: Pick<EffectInstance, 'members'>,
  creatureId: string,
): Promise<AreaMember | undefined> {
  for (const member of area.members ?? [])
    if (
      member.party.id === creatureId ||
      (await resolveHistoricalId(ctx, campaignId, member.party.id)) === creatureId
    )
      return member;
  return undefined;
}

/**
 * V200, feature/troubadour/level-1/routines.md: "At the start of each combat round, as long as you
 * are not dazed, dead, or surprised, you can either choose a new performance or maintain your
 * current performance (no action required). Your performance lasts until you are unable to maintain
 * it or until the end of the encounter."
 * - Choosing a performance: any use of an ability with the Performance keyword by the owner ends the
 *   owner's current one (this function), before the new use stores its own.
 * Returns the ended instances, each logged as a linked `effect.ended` entry.
 */
export async function endChosenPerformance(
  ctx: MutationCtx,
  scope: JournalScope,
  owner: { kind: string; id: string },
  keywords: readonly string[],
  abilityName: string,
): Promise<EffectInstance[]> {
  if (owner.kind !== 'character' && owner.kind !== 'foe') return [];
  if (!keywords.some(keyword => plain(keyword).trim().toLowerCase() === 'performance')) return [];
  const ended: EffectInstance[] = [];
  for (const { holder, instance } of await ownedActiveEffects(ctx, scope.campaignId, {
    kind: owner.kind,
    id: owner.id,
  }))
    if (instance.endsWhen.includes('performance')) {
      const done = await endEffectInstance(
        ctx,
        scope,
        holder,
        instance.id,
        `${instance.actorLabel} chose a performance again (${abilityName}; Routines)`,
      );
      if (done) ended.push(done);
    }
  await logEnded(ctx, scope, ended);
  return ended;
}

/**
 * V200: the clock's `performance` work at the start of a combat round. The owner maintains the
 * performance unless they can't: dazed (condition/dazed.md) or dead (rule/health/dying.md: "if it
 * reaches the negative of your winded value, you die"). Surprise lasts "until the end of the first
 * combat round" (rule/combat/surprised.md), and this work is registered by a use made in a round,
 * so no later round start finds its owner surprised. Interpretation (Q-AREA-2 point 5):
 * maintaining needs no act, so an owner able to maintain it keeps it; the table ends it with
 * /effect end otherwise.
 */
export async function maintainPerformance(
  ctx: MutationCtx,
  scope: JournalScope,
  holder: EffectHolder,
  instance: EffectInstance,
  label: string,
): Promise<{ kind: string; description: string; payload: unknown }> {
  const owner =
    instance.owner.kind === 'character'
      ? await ctx.db.get(
          (await resolveHistoricalId(ctx, scope.campaignId, instance.owner.id)) as Id<'characters'>,
        )
      : null;
  const live = owner?.liveState;
  const baseline = owner ? baselineOf(owner.derivedBaseline) : undefined;
  const why = !live
    ? undefined
    : live.conditions.dazed
      ? `${instance.actorLabel} is dazed at the start of the round, so can't maintain it`
      : baseline && live.stamina < 0 && live.stamina <= -baseline.windedValue.value
        ? `${instance.actorLabel} is dead, so can't maintain it`
        : undefined;
  if (!why)
    return {
      kind: 'effect.maintained',
      description: `${label}: maintained (no action required).`,
      payload: { effectInstanceId: instance.id, sourcePath: instance.sourcePath },
    };
  const ended = await endEffectInstance(ctx, scope, holder, instance.id, `${why} (Routines)`);
  return {
    kind: 'effect.ended',
    description: `${label}: ends — ${ended?.endedReason ?? why}.`,
    payload: {
      effectInstanceId: instance.id,
      sourceUseEventId: instance.sourceUseEventId,
      reason: ended?.endedReason ?? why,
      sourcePath: instance.sourcePath,
    },
  };
}
