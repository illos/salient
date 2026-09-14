// SPDX-License-Identifier: GPL-3.0-only
// The shared dice operation. Owning specification: docs/dice-roller-spec.md section 4 (request and
// accepted-roll contracts, retry by request id), docs/table-command-spec.md#structured-invocation-envelope
// ("dice generation belongs to shared operations ... headless access does not grant an agent
// permission to choose live dice") and docs/engine-architecture.md#determinism-and-shared-state.
//
// Generator: a per-campaign hash DRBG. The seed is 32 bytes from crypto.getRandomValues, drawn once
// per campaign and stored server-side; value n of the stream is SHA-256(seed || n) and each die takes
// the first 32 bits of successive outputs with rejection sampling, so every face is equally likely.
// Nothing about a client, a gesture or a retry enters the stream (dice-roller-spec section 3).
import { ConvexError } from 'convex/values';
import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import type { AcceptedRoll, DieResult, DieSpec } from '../../shared/contracts/history';
import { fromHex, sha256, toHex } from './sha256';

/** Bounds on one request. Any larger request is not a table roll. */
export const MAX_DICE = 100;
export const MAX_SIDES = 1000;

export function validateDice(dice: DieSpec[]): void {
  if (!dice.length || dice.length > MAX_DICE)
    throw new ConvexError(`Roll between 1 and ${MAX_DICE} dice.`);
  const ids = new Set<string>();
  for (const die of dice) {
    if (!Number.isInteger(die.sides) || die.sides < 2 || die.sides > MAX_SIDES)
      throw new ConvexError(`Each die needs an integer side count between 2 and ${MAX_SIDES}.`);
    if (!die.id || die.id.length > 64 || ids.has(die.id))
      throw new ConvexError('Each die needs a distinct id of at most 64 characters.');
    ids.add(die.id);
  }
}

/** Draws value `counter` of the campaign stream as an unsigned 32-bit integer. */
function draw(seed: Uint8Array, counter: number): number {
  const input = new Uint8Array(seed.length + 8);
  input.set(seed);
  new DataView(input.buffer).setBigUint64(seed.length, BigInt(counter));
  return new DataView(sha256(input).buffer).getUint32(0);
}

/**
 * Pure generation from a seed and a starting counter: returns the faces and the next counter.
 * Rejection sampling discards draws at or above the largest multiple of `sides` below 2^32.
 */
export function generate(
  seed: Uint8Array,
  counter: number,
  dice: DieSpec[],
): { dice: DieResult[]; counter: number } {
  const results: DieResult[] = [];
  for (const die of dice) {
    const limit = Math.floor(0x100000000 / die.sides) * die.sides;
    let value: number;
    do {
      value = draw(seed, counter++);
    } while (value >= limit);
    results.push({ id: die.id, sides: die.sides, value: (value % die.sides) + 1 });
  }
  return { dice: results, counter };
}

async function generatorState(ctx: MutationCtx, campaignId: Id<'campaigns'>) {
  const existing = await ctx.db
    .query('diceStates')
    .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
    .unique();
  if (existing) return existing;
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const id = await ctx.db.insert('diceStates', { campaignId, seed: toHex(seed), counter: 0 });
  return (await ctx.db.get(id))!;
}

function toAccepted(roll: Doc<'rolls'>): AcceptedRoll {
  return {
    rollId: roll._id,
    commandId: roll.commandId,
    dice: roll.dice,
    source: 'generated',
    audience: roll.audience,
  };
}

/**
 * Rolls on the server for one command. The same `commandId` with the same dice returns the accepted
 * roll again; the same id with different dice is an error (dice-roller-spec section 4). The caller
 * records the result on its event (`appendEvent` `dice`); this function does not write history.
 */
export async function rollDice(
  ctx: MutationCtx,
  campaignId: Id<'campaigns'>,
  commandId: string,
  dice: DieSpec[],
): Promise<AcceptedRoll> {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(commandId))
    throw new ConvexError(
      'Provide a valid command ID (8–128 letters, numbers, underscores or hyphens).',
    );
  validateDice(dice);
  if (!(await ctx.db.get(campaignId))) throw new ConvexError('Campaign unavailable.');
  const fingerprint = JSON.stringify(dice.map(die => [die.id, die.sides]));
  const previous = await ctx.db
    .query('rolls')
    .withIndex('by_campaign_command', q =>
      q.eq('campaignId', campaignId).eq('commandId', commandId),
    )
    .unique();
  if (previous) {
    if (previous.fingerprint !== fingerprint)
      throw new ConvexError('This command ID was already used for a different roll.');
    return toAccepted(previous);
  }
  const state = await generatorState(ctx, campaignId);
  const generated = generate(fromHex(state.seed), state.counter, dice);
  await ctx.db.patch(state._id, { counter: generated.counter });
  const id = await ctx.db.insert('rolls', {
    campaignId,
    commandId,
    fingerprint,
    dice: generated.dice,
    audience: 'public',
    counterStart: state.counter,
    createdAt: Date.now(),
  });
  return toAccepted((await ctx.db.get(id))!);
}
