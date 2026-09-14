// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components } from '../../convex/_generated/api';
import { emptyAuthored, type DraftSelection } from '../../shared/characterDraft';

const modules = import.meta.glob('../../convex/**/*.ts');
async function setup() {
  const t = convexTest(schema, modules);
  betterAuthTest.register(t);
  async function actor(name: string) {
    const now = Date.now();
    const user = await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'user',
        data: {
          name,
          email: `${name}@example.test`,
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
          userId: user._id,
          token: `${name}-token`,
          expiresAt: now + 3600000,
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    const client = t.withIdentity({ subject: user._id, sessionId: session._id });
    const profile = await client.mutation(api.auth.ensureProfile, {});
    return { client, ...profile };
  }
  return { t, alice: await actor('alice'), bob: await actor('bob') };
}
const details = {
  ...emptyAuthored,
  name: 'Aster',
  appearance: 'Red coat',
  biography: 'A wanderer',
  notes: "Owner's private note",
};
const choice: DraftSelection = {
  decisionId: 'example-choice',
  ownerBranchId: 'example-branch',
  sources: [{ id: 'fixture:choice', path: 'test/choice', revision: 'test-only' }],
  value: { selected: ['example'], assignment: 1 },
};

describe('owned character drafts', () => {
  test('create/reopen persists authored fields and isolates private drafts across users', async () => {
    const { t, alice, bob } = await setup();
    const characterId = await alice.client.mutation(api.characters.create, {
      commandId: 'create-aster',
      authored: details,
    });
    const saved = await alice.client.query(api.characters.get, { characterId });
    expect(saved.authored).toEqual(details);
    expect(saved).toMatchObject({
      status: 'awaiting-rules-evaluation',
      selections: [],
      derivedBaseline: null,
      liveState: null,
      effectiveRevisionId: null,
    });
    expect(await alice.client.query(api.characters.listMine, {})).toEqual([
      { id: characterId, name: 'Aster', revision: 1, status: 'awaiting-rules-evaluation' },
    ]);
    expect(await bob.client.query(api.characters.listMine, {})).toEqual([]);
    await expect(bob.client.query(api.characters.get, { characterId })).rejects.toThrow(
      'Character unavailable',
    );
    await expect(
      bob.client.mutation(api.characters.save, {
        characterId,
        commandId: 'steal-aster',
        expectedRevision: 1,
        authored: details,
      }),
    ).rejects.toThrow('Character unavailable');
    await expect(t.query(api.characters.listMine, {})).rejects.toThrow('Sign in');
  });

  test('save records immutable source-qualified choices and preserves them on authored-only edits', async () => {
    const { t, alice } = await setup();
    const characterId = await alice.client.mutation(api.characters.create, {
      commandId: 'create-aster',
      authored: details,
    });
    await alice.client.mutation(api.characters.save, {
      characterId,
      commandId: 'save-choices',
      expectedRevision: 1,
      authored: details,
      selections: [choice],
    });
    await alice.client.mutation(api.characters.save, {
      characterId,
      commandId: 'save-biography',
      expectedRevision: 2,
      authored: { ...details, biography: 'New biography' },
    });
    const saved = await alice.client.query(api.characters.get, { characterId });
    expect(saved).toMatchObject({
      revision: 3,
      selections: [choice],
      effectiveRevisionId: null,
      derivedBaseline: null,
      liveState: null,
    });
    const revisions = await t.run(async ctx =>
      ctx.db
        .query('characterRevisions')
        .withIndex('by_character_and_revision', q => q.eq('characterId', characterId))
        .take(10),
    );
    expect(
      revisions.map(revision => ({ revision: revision.revision, selections: revision.selections })),
    ).toEqual([
      { revision: 1, selections: [] },
      { revision: 2, selections: [choice] },
      { revision: 3, selections: [choice] },
    ]);
    expect(revisions[2].parentRevisionId).toBe(revisions[1]._id);
  });

  test('stale writes cannot overwrite a saved revision and duplicate submissions do not create extra history', async () => {
    const { t, alice } = await setup();
    const createArgs = { commandId: 'create-aster', authored: details };
    const characterId = await alice.client.mutation(api.characters.create, createArgs);
    expect(await alice.client.mutation(api.characters.create, createArgs)).toBe(characterId);
    const saveArgs = {
      characterId,
      commandId: 'save-aster',
      expectedRevision: 1,
      authored: { ...details, name: 'Aster II' },
    };
    expect(await alice.client.mutation(api.characters.save, saveArgs)).toBe(2);
    expect(await alice.client.mutation(api.characters.save, saveArgs)).toBe(2);
    await expect(
      alice.client.mutation(api.characters.save, {
        ...saveArgs,
        commandId: 'stale-save',
        authored: details,
      }),
    ).rejects.toThrow('changed since you opened');
    await expect(
      alice.client.mutation(api.characters.save, { ...saveArgs, authored: details }),
    ).rejects.toThrow('different request');
    expect((await alice.client.query(api.characters.get, { characterId })).authored.name).toBe(
      'Aster II',
    );
    expect(
      await t.run(
        async ctx =>
          (
            await ctx.db
              .query('characterRevisions')
              .withIndex('by_character_and_revision', q => q.eq('characterId', characterId))
              .take(10)
          ).length,
      ),
    ).toBe(2);
  });

  test('combat locks reject both authored and selection changes', async () => {
    const { t, alice } = await setup();
    const characterId = await alice.client.mutation(api.characters.create, {
      commandId: 'create-aster',
      authored: details,
    });
    await t.run(ctx => ctx.db.patch(characterId, { combatLocked: true }));
    await expect(
      alice.client.mutation(api.characters.save, {
        characterId,
        commandId: 'locked-save',
        expectedRevision: 1,
        authored: { ...details, notes: 'Changed' },
        selections: [choice],
      }),
    ).rejects.toThrow('locked during combat');
    const saved = await alice.client.query(api.characters.get, { characterId });
    expect(saved).toMatchObject({
      revision: 1,
      authored: details,
      selections: [],
      combatLocked: true,
    });
  });

  test('choice persistence rejects missing provenance and non-JSON numbers without claiming build validity', async () => {
    const { alice } = await setup();
    const characterId = await alice.client.mutation(api.characters.create, {
      commandId: 'create-aster',
      authored: details,
    });
    const args = {
      characterId,
      commandId: 'invalid-selection',
      expectedRevision: 1,
      authored: details,
    };
    await expect(
      alice.client.mutation(api.characters.save, {
        ...args,
        selections: [{ ...choice, sources: [] }],
      }),
    ).rejects.toThrow('source references');
    await expect(
      alice.client.mutation(api.characters.save, {
        ...args,
        selections: [{ ...choice, value: Infinity }],
      }),
    ).rejects.toThrow('source references');
    expect((await alice.client.query(api.characters.get, { characterId })).revision).toBe(1);
  });
});
