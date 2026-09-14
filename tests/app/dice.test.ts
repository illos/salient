// SPDX-License-Identifier: GPL-3.0-only
// S02 acceptance check 3: the shared dice operation is server-side, retry-idempotent on commandId,
// and a new command id draws new values. Expected values below come from the specification
// (docs/dice-roller-spec.md section 4) and published SHA-256 test vectors, not from running the code.
import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import { createHash } from 'node:crypto';
import schema from '../../convex/schema';
import { api, components, internal } from '../../convex/_generated/api';
import { generate, rollDice } from '../../convex/lib/dice';
import { fromHex, sha256, toHex } from '../../convex/lib/sha256';

const modules = import.meta.glob('../../convex/**/*.ts');
async function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  const now = Date.now();
  const auth = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'user',
      data: {
        name: 'Director',
        email: 'director@example.test',
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const session = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'session',
      data: {
        userId: auth._id,
        token: 'director-token',
        expiresAt: now + 3600000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  const client = t.withIdentity({ subject: auth._id, sessionId: session._id });
  await client.mutation(api.auth.ensureProfile, {});
  const campaignId = await client.mutation(api.campaigns.create, {
    name: 'Dice',
    commandId: 'create-dice-campaign',
  });
  return { t, client, campaignId };
}
const powerRoll = [
  { id: 'd10a', sides: 10 },
  { id: 'd10b', sides: 10 },
];

describe('sha256', () => {
  test('matches the FIPS 180-4 vectors and Node for a multi-block input', () => {
    const encoder = new TextEncoder();
    expect(toHex(sha256(encoder.encode('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(toHex(sha256(new Uint8Array(0)))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    const long = encoder.encode('a'.repeat(1000));
    expect(toHex(sha256(long))).toBe(createHash('sha256').update(long).digest('hex'));
    expect(toHex(fromHex('00ff10'))).toBe('00ff10');
  });
});

describe('shared dice operation', () => {
  test('same commandId returns the identical accepted roll; a new id draws new values', async () => {
    const { t, campaignId } = await setup();
    const first = await t.run(ctx => rollDice(ctx, campaignId, 'roll-command-1', powerRoll, null));
    const retry = await t.run(ctx => rollDice(ctx, campaignId, 'roll-command-1', powerRoll, null));
    expect(retry).toEqual(first);
    expect(first.source).toBe('generated');
    expect(first.audience).toBe('public');
    expect(first.dice.map(d => d.id)).toEqual(['d10a', 'd10b']);
    for (const die of first.dice) {
      expect(Number.isInteger(die.value)).toBe(true);
      expect(die.value).toBeGreaterThanOrEqual(1);
      expect(die.value).toBeLessThanOrEqual(10);
    }
    // Read the persisted roll rather than trusting the return value.
    const rolls = await t.run(ctx =>
      ctx.db
        .query('rolls')
        .withIndex('by_campaign_command', q => q.eq('campaignId', campaignId))
        .take(10),
    );
    expect(rolls).toHaveLength(1);
    expect(rolls[0]!.dice).toEqual(first.dice);
    expect(rolls[0]!.counterStart).toBe(0);
    // A new command id advances the stream: it is a new accepted roll with its own id and values
    // drawn from a later counter (the faces themselves may coincide by chance).
    const next = await t.run(ctx => rollDice(ctx, campaignId, 'roll-command-2', powerRoll, null));
    expect(next.rollId).not.toBe(first.rollId);
    const after = await t.run(ctx =>
      ctx.db
        .query('rolls')
        .withIndex('by_campaign_command', q => q.eq('campaignId', campaignId))
        .take(10),
    );
    expect(after.map(r => r.counterStart)).toEqual([0, 2]);
    const state = await t.run(ctx =>
      ctx.db
        .query('diceStates')
        .withIndex('by_campaign', q => q.eq('campaignId', campaignId))
        .unique(),
    );
    expect(state!.counter).toBe(4);
    // The stream is a function of the stored seed and counter: the accepted faces reproduce.
    expect(generate(fromHex(state!.seed), 0, powerRoll).dice).toEqual(first.dice);
    expect(generate(fromHex(state!.seed), 2, powerRoll).dice).toEqual(next.dice);
  });

  test('reusing a commandId with different dice is rejected and rolls nothing', async () => {
    const { t, campaignId } = await setup();
    await t.run(ctx => rollDice(ctx, campaignId, 'roll-command-1', powerRoll, null));
    await expect(
      t.run(ctx => rollDice(ctx, campaignId, 'roll-command-1', [{ id: 'd6', sides: 6 }], null)),
    ).rejects.toThrow('different roll');
    const rolls = await t.run(ctx =>
      ctx.db
        .query('rolls')
        .withIndex('by_campaign_command', q => q.eq('campaignId', campaignId))
        .take(10),
    );
    expect(rolls).toHaveLength(1);
  });

  test('requests are validated: bounds, distinct die ids, valid command id', async () => {
    const { t, campaignId } = await setup();
    const cases: [Parameters<typeof rollDice>[3], string][] = [
      [[], 'between 1 and 100'],
      [[{ id: 'x', sides: 1 }], 'side count'],
      [[{ id: 'x', sides: 6.5 }], 'side count'],
      [[{ id: 'x', sides: 1001 }], 'side count'],
      [
        [
          { id: 'x', sides: 6 },
          { id: 'x', sides: 6 },
        ],
        'distinct id',
      ],
    ];
    for (const [dice, message] of cases)
      await expect(
        t.run(ctx => rollDice(ctx, campaignId, 'roll-command-1', dice, null)),
      ).rejects.toThrow(message);
    await expect(t.run(ctx => rollDice(ctx, campaignId, 'short', powerRoll, null))).rejects.toThrow(
      'command ID',
    );
    expect(await t.run(ctx => ctx.db.query('rolls').take(1))).toEqual([]);
  });

  test('every face is reachable and within range across the stream', () => {
    const seed = fromHex('0'.repeat(63) + '1');
    const { dice, counter } = generate(
      seed,
      0,
      Array.from({ length: 100 }, (_, i) => ({ id: `d${i}`, sides: 10 })),
    );
    expect(counter).toBeGreaterThanOrEqual(100);
    expect(new Set(dice.map(d => d.value))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });

  test('dice.roll is registered as an internal function and persists the same accepted roll', async () => {
    const { t, campaignId } = await setup();
    const accepted = await t.mutation(internal.dice.roll, {
      campaignId,
      commandId: 'internal-roll-1',
      dice: powerRoll,
      issuerId: null,
    });
    // The public API exposes no dice module; convex-test itself does not enforce the internal
    // boundary, which is a platform property of internalMutation.
    expect('dice' in api).toBe(false);
    const stored = await t.run(ctx => ctx.db.get('rolls', accepted.rollId));
    expect(stored!.dice).toEqual(accepted.dice);
    expect(
      await t.mutation(internal.dice.roll, {
        campaignId,
        commandId: 'internal-roll-1',
        dice: powerRoll,
        issuerId: null,
      }),
    ).toEqual(accepted);
  });
});
