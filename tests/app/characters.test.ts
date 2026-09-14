// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../../convex/schema';
import { api, components } from '../../convex/_generated/api';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { emptyAuthored, type DraftSelection } from '../../shared/characterDraft';
import type {
  DerivedBaseline,
  EvaluationInput,
  EvaluationResult,
} from '../../shared/contracts/characterEvaluation';
import type { DecisionDefinitions } from '../../shared/evaluate/definitions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';

// R02 worked examples: the expected baseline and diagnostics come from the hand-computed examples
// file (checked against the pinned source by tests/character-derived-values.test.ts), never from
// running the evaluator.
const examples = JSON.parse(
  readFileSync(join(process.cwd(), 'shared/content/character-evaluation-examples.json'), 'utf8'),
) as {
  examples: Record<string, { input: EvaluationInput; expected: EvaluationResult }>;
};
const definitions = JSON.parse(
  readFileSync(join(process.cwd(), 'shared/content/fury-level-one-decisions.json'), 'utf8'),
) as DecisionDefinitions;
const fixtureSelections = () =>
  draftSelectionsFrom(examples.examples.complete!.input.selections, definitions);

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
      status: 'incomplete',
      selections: [],
      derivedBaseline: null,
      liveState: null,
      effectiveRevisionId: null,
    });
    expect(await alice.client.query(api.characters.listMine, {})).toEqual([
      {
        id: characterId,
        name: 'Aster',
        revision: 1,
        status: 'incomplete',
        campaignId: null,
        campaignName: null,
        attached: false,
        review: null,
      },
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

  test('acceptance 1: the hero-fixture choices evaluate to the R02 complete baseline, read back from the revision', async () => {
    const { t, alice } = await setup();
    const characterId = await alice.client.mutation(api.characters.create, {
      commandId: 'create-grug',
      authored: { ...details, name: 'Grug' },
    });
    const selections = fixtureSelections();
    await alice.client.mutation(api.characters.save, {
      characterId,
      commandId: 'save-fixture',
      expectedRevision: 1,
      authored: { ...details, name: 'Grug' },
      selections,
    });
    const saved = await alice.client.query(api.characters.get, { characterId });
    expect(saved.status).toBe('complete');
    const revision = await t.run(async ctx =>
      ctx.db
        .query('characterRevisions')
        .withIndex('by_character_and_revision', q =>
          q.eq('characterId', characterId).eq('revision', 2),
        )
        .unique(),
    );
    expect(revision!.status).toBe('complete');
    expect(revision!.derivedBaseline).toEqual(examples.examples.complete!.expected.baseline);
    expect(revision!.evaluation).toEqual(examples.examples.complete!.expected);
    const baseline = revision!.derivedBaseline as DerivedBaseline;
    expect([
      baseline.staminaMaximum.value,
      baseline.recoveriesMaximum.value,
      baseline.speed.value,
    ]).toEqual([30, 10, 6]);
    // The draft save wrote no live values and no effective build (R03 section 3).
    expect(saved.liveState).toBeNull();
    expect(saved.effectiveRevisionId).toBeNull();
    // The shared evaluate operation returns the same result without writing anything.
    expect(await alice.client.query(api.characters.evaluate, { selections })).toEqual(
      examples.examples.complete!.expected,
    );
  });

  test('acceptance 2: no kit is incomplete naming kit.choice; over-budget traits is invalid', async () => {
    const { alice } = await setup();
    const incomplete = await alice.client.query(api.characters.evaluate, {
      selections: draftSelectionsFrom(examples.examples.incomplete!.input.selections, definitions),
    });
    expect(incomplete).toEqual(examples.examples.incomplete!.expected);
    expect(incomplete.status).toBe('incomplete');
    expect(incomplete.diagnostics['kit.choice'][0].code).toBe('required-choice-missing');
    const invalid = await alice.client.query(api.characters.evaluate, {
      selections: draftSelectionsFrom(examples.examples.invalid!.input.selections, definitions),
    });
    expect(invalid).toEqual(examples.examples.invalid!.expected);
    expect(invalid.status).toBe('invalid');
    // Persisted the same way: the revision carries the status and no baseline.
    const characterId = await alice.client.mutation(api.characters.create, {
      commandId: 'create-bad',
      authored: details,
    });
    await alice.client.mutation(api.characters.save, {
      characterId,
      commandId: 'save-bad',
      expectedRevision: 1,
      authored: details,
      selections: draftSelectionsFrom(examples.examples.invalid!.input.selections, definitions),
    });
    const saved = await alice.client.query(api.characters.get, { characterId });
    expect(saved.status).toBe('invalid');
    expect(saved.evaluation.baseline).toBeNull();
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
