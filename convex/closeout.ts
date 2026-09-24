// SPDX-License-Identifier: GPL-3.0-only
/** Public closeout projection; all mutations use the shared command registry. */
import type { Doc, Id } from './_generated/dataModel';
import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireUser } from './lib/access';
import { tableContext } from './lib/registry';
import { currentEncounter } from './lib/encounters';
import { closeoutHeroes } from './lib/closeoutOperations';
import type { CompiledResult } from '../shared/contracts/compiledResult';
import { resolveHistoricalId } from './lib/history';
import { actorRef } from './initiativeTables';
import type { AbilityRollResult, TargetRollOutcome } from '../shared/contracts/rollResolution';

export const current = query({
  args: { campaignId: v.id('campaigns') },
  returns: v.union(
    v.null(),
    v.object({
      encounterId: v.id('encounters'),
      phase: v.string(),
      mayManage: v.boolean(),
      mayFinish: v.boolean(),
      victory: v.object({
        confirmed: v.boolean(),
        amount: v.number(),
        recipients: v.array(v.id('characters')),
      }),
      heroes: v.array(
        v.object({ id: v.id('characters'), name: v.string(), victories: v.number() }),
      ),
      optionalChoices: v.array(
        v.object({
          eventId: v.id('events'),
          actor: actorRef,
          target: v.union(actorRef, v.null()),
          clause: v.string(),
          occurrence: v.optional(v.string()),
          abilityName: v.string(),
          abilityId: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, { campaignId }) => {
    const user = await requireUser(ctx);
    const context = await tableContext(ctx, user, campaignId);
    const encounter = context.session ? await currentEncounter(ctx, context.session) : null;
    if (!encounter || encounter.status !== 'committed') return null;
    const heroes = await closeoutHeroes(ctx, encounter);
    const mayManage = context.role === 'director' && context.session?.status === 'running';
    const optionalChoices: {
      eventId: Id<'events'>;
      actor: Doc<'abilityResults'>['actor'];
      target: Doc<'abilityResults'>['actor'] | null;
      clause: string;
      occurrence?: string;
      abilityName: string;
      abilityId: string;
    }[] = [];
    if (encounter.phase === 'closeout') {
      const events = await ctx.db
        .query('events')
        .withIndex('by_encounter_sequence', q => q.eq('encounterId', encounter._id))
        .take(10001);
      if (events.length > 10000)
        throw new Error('Too many encounter events to list cleanup choices safely.');
      for (const event of events) {
        if (event.disposition === 'undone') continue;
        const result = await ctx.db
          .query('abilityResults')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .unique();
        if (!result) continue;
        const actor = {
          ...result.actor,
          id: await resolveHistoricalId(ctx, campaignId, result.actor.id),
        };
        const targets = await Promise.all(
          result.targets.map(async target => ({
            ...target,
            effectiveTarget: {
              ...target.target,
              id: await resolveHistoricalId(ctx, campaignId, target.target.id),
            },
          })),
        );
        if (result.compiled) {
          for (const occurrence of (result.compiled as CompiledResult).effects) {
            if (
              occurrence.effect.kind === 'damage' ||
              occurrence.disposition ||
              (occurrence.effect.kind === 'gain' && occurrence.effect.status === 'applied') ||
              (occurrence.effect.kind === 'modifier' && occurrence.effect.status === 'applied') ||
              // V171: an applied watcher is tracked and fired by the engine.
              (occurrence.effect.kind === 'watcher' && occurrence.effect.status === 'applied') ||
              // V170: an applied or inapplicable Strained section leaves nothing for the table.
              (occurrence.effect.kind === 'strained' && occurrence.effect.status !== 'manual') ||
              (occurrence.effect.kind === 'condition' &&
                occurrence.effect.status !== 'fact-needed' &&
                occurrence.effect.status !== 'manual')
            )
              continue;
            const target = targets.find(target => target.target.id === occurrence.effect.targetId);
            // Compiled effects are target-bound; do not turn a missing target into a global choice.
            if (!target) continue;
            optionalChoices.push({
              eventId: event._id,
              actor,
              target: target.effectiveTarget,
              clause: occurrence.effect.clause,
              occurrence: occurrence.id,
              abilityName: result.abilityName,
              abilityId: result.abilityId,
            });
          }
          continue;
        }
        for (const target of targets)
          for (const clause of (target.outcome as TargetRollOutcome).unresolvedClauses ?? []) {
            if (!target.dispositions.some(d => d.clause === clause))
              optionalChoices.push({
                eventId: event._id,
                actor,
                target: target.effectiveTarget,
                clause,
                abilityName: result.abilityName,
                abilityId: result.abilityId,
              });
          }
        const recorded = (event.payload as { data?: { result?: AbilityRollResult } })?.data?.result;
        for (const resolution of recorded?.manualResolutions ?? []) {
          const clause = resolution.sourceClause;
          if (!result.manualDispositions.some(d => d.clause === clause))
            optionalChoices.push({
              eventId: event._id,
              actor,
              target: null,
              clause,
              abilityName: result.abilityName,
              abilityId: result.abilityId,
            });
        }
      }
    }
    return {
      encounterId: encounter._id,
      phase: encounter.phase ?? 'turns',
      mayManage,
      mayFinish: mayManage && encounter.phase === 'closeout' && !!encounter.victoryAward,
      victory: {
        confirmed: !!encounter.victoryAward,
        amount: encounter.victoryAward?.amount ?? 1,
        recipients: encounter.victoryAward?.recipientIds ?? heroes.map(h => h._id),
      },
      heroes: heroes.map(h => ({
        id: h._id,
        name: h.authored.name,
        victories: h.liveState!.victories,
      })),
      optionalChoices,
    };
  },
});
