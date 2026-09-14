// SPDX-License-Identifier: GPL-3.0-only
// `dice.roll`: the server-side shared dice operation as an internal function. Not callable from
// clients; registered operations (A01) call rollDice in-process inside their own mutation and record
// the accepted faces on their event. Owning specification: docs/dice-roller-spec.md section 4 and
// docs/v0.01-readiness-audit.md#g7-dice-generation-and-event-storage.
import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { dieResult, dieSpec } from './encounterTables';
import { rollDice } from './lib/dice';

export const roll = internalMutation({
  args: { campaignId: v.id('campaigns'), commandId: v.string(), dice: v.array(dieSpec) },
  returns: v.object({
    rollId: v.id('rolls'),
    commandId: v.string(),
    dice: v.array(dieResult),
    source: v.literal('generated'),
    audience: v.literal('public'),
  }),
  handler: async (ctx, args) => {
    const accepted = await rollDice(ctx, args.campaignId, args.commandId, args.dice);
    return { ...accepted, rollId: accepted.rollId as never };
  },
});
