// SPDX-License-Identifier: GPL-3.0-only
/**
 * DEVELOPMENT FIXTURE, NOT A RULE. A06 test-only operation whose journal rows mimic the shapes A05's
 * attack events are expected to record: the user head event carries the accepted dice and a fixed
 * resource cost debit; one engine-origin consequence event under the same command key journals the
 * damage to the target (temporary Stamina first, then Stamina). The damage and cost are supplied by
 * the test; nothing is derived from a stat block or the Compendium. A05 replaces this with the
 * real `ability.*` operations; the history tests then run against those.
 */
import { ConvexError, v } from 'convex/values';
import type { Id } from '../../../convex/_generated/dataModel';
import { rollDice } from '../../../convex/lib/dice';
import { appendEvent } from '../../../convex/lib/events';
import { journalPatch } from '../../../convex/lib/journal';
import { operations, type OperationDefinition } from '../../../convex/lib/registry';
import { initialHeroLive } from '../../../convex/lib/tableOperations';

export const FIXTURE_STRIKE_ID = 'fixture.strike';

const fixtureStrike: OperationDefinition = {
  id: FIXTURE_STRIKE_ID,
  family: 'fixture',
  verb: 'strike',
  title: 'Fixture strike (test only)',
  description:
    'TEST FIXTURE: pay a fixed heroic-resource cost, roll 2d10, deal the supplied damage to a foe (temporary Stamina first). Shapes only; no rule.',
  args: {
    target: v.object({ refKind: v.string(), id: v.string() }),
    cost: v.number(),
    damage: v.number(),
  },
  argDescriptions: {
    target: 'The foe, as @{foe:id}.',
    cost: 'Heroic resource debited on execution.',
    damage: 'Damage the fixture applies.',
  },
  roles: ['director', 'player'],
  session: 'running',
  actor: 'required',
  execute: async (ctx, { context, envelope, actor, args }) => {
    if (actor!.kind !== 'character') throw new ConvexError('The fixture strike acts for heroes.');
    const hero = await ctx.db.get(actor!.id as Id<'characters'>);
    if (!hero || hero.campaignId !== context.campaign._id)
      throw new ConvexError('That hero is not at this table.');
    const live = hero.liveState ?? initialHeroLive(Date.now());
    const cost = Number(args.cost);
    const damage = Number(args.damage);
    const resource = live.heroicResource.current ?? 0;
    // Confirmed insufficient-resource exception: an unaffordable cost blocks before any roll.
    if (resource < cost)
      throw new ConvexError(`${actor!.name} cannot pay ${cost} (has ${resource}).`);
    const target = args.target as { id: string };
    const foeId = ctx.db.normalizeId('foes', target.id);
    const foe = foeId ? await ctx.db.get(foeId) : null;
    if (!foe || foe.campaignId !== context.campaign._id)
      throw new ConvexError('That foe is not at this table.');
    const accepted = await rollDice(
      ctx,
      context.campaign._id,
      envelope.commandId,
      [
        { id: 'd10a', sides: 10 },
        { id: 'd10b', sides: 10 },
      ],
      context.user._id,
    );
    const fromTemporary = Math.min(foe.live.temporaryStamina, damage);
    const temporaryAfter = foe.live.temporaryStamina - fromTemporary;
    const staminaAfter = foe.live.stamina - (damage - fromTemporary);
    return {
      kind: 'fixture.strike',
      description: `${actor!.name} strikes ${foe.name} for ${damage} (fixture; cost ${cost}).`,
      dice: accepted.dice,
      data: { cost, damage, rollId: accepted.rollId, target: { kind: 'foe', id: foe._id } },
      commit: async (mctx, scope) => {
        await journalPatch(mctx, scope, 'characters', hero._id, {
          liveState: {
            ...live,
            heroicResource: { ...live.heroicResource, current: resource - cost },
          },
        });
        const consequence = await appendEvent(mctx, {
          campaignId: context.campaign._id,
          sessionId: context.session!._id,
          origin: 'engine',
          commandId: envelope.commandId,
          causeEventId: scope.eventId,
          kind: 'fixture.damage',
          description: `${foe.name} takes ${damage}: temporary ${foe.live.temporaryStamina} → ${temporaryAfter}, Stamina ${foe.live.stamina} → ${staminaAfter}.`,
          payload: { damage, temporaryAfter, staminaAfter },
        });
        await journalPatch(
          mctx,
          { campaignId: scope.campaignId, eventId: consequence },
          'foes',
          foe._id,
          {
            live: { ...foe.live, temporaryStamina: temporaryAfter, stamina: staminaAfter },
          },
        );
      },
    };
  },
};

/** Registers the fixture in the shared registry once, for the test process only. */
export function registerFixtureStrike(): void {
  if (!operations.some(operation => operation.id === FIXTURE_STRIKE_ID))
    operations.push(fixtureStrike);
}
