// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { makeFunctionReference } from 'convex/server';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import type { DraftSelection } from '../../shared/characterDraft';
import type { EvaluationResult, SelectionValue } from '../../shared/contracts/characterEvaluation';
import type { Decision, DecisionDefinitions } from '../../shared/evaluate/definitions';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { selectionsFrom } from '../../shared/evaluate/character';
import { backend, account, heroFixtureSelections } from './fixtures/table';

const discover = makeFunctionReference<
  'query',
  {
    selections?: DraftSelection[];
    targetLevel?: number;
    characterId?: Id<'characters'>;
  },
  {
    targetLevel: number;
    definitions: DecisionDefinitions;
    selections: DraftSelection[];
    decisions: (Decision & {
      stepId: string;
      available: boolean;
      pool: { values: string[] };
      supportedValues: string[];
    })[];
    evaluation: EvaluationResult;
  }
>('characterWizard:discover');
const transition = makeFunctionReference<
  'query',
  {
    selections: DraftSelection[];
    decisionId: string;
    value?: SelectionValue | bigint;
    targetLevel?: number;
    characterId?: Id<'characters'>;
  },
  { selections: DraftSelection[]; removed: string[]; evaluation: EvaluationResult }
>('characterWizard:transition');
const authored = { name: 'Wizard route', appearance: '', biography: '', notes: '' };

// Discovery must reflect the requested build, not a static all-options list or a previous caller's ancestry.
test('headless discovery scopes dependent choices and canonicalizes supplied provenance', async () => {
  const t = backend();
  const owner = await account(t, 'Discovery');
  const selections = draftSelectionsFrom(
    {
      'ancestry.choice': 'Dwarf',
      'ancestry.dwarf.purchased-traits': ['Grounded', 'Spark Off Your Skin'],
    },
    getDefinitions(1),
  );
  selections[0]!.sources = [{ id: 'forged', path: 'untrusted', revision: 'wrong' }];
  const result = await owner.client.query(discover, { selections });
  const dwarf = result.decisions.find(d => d.id === 'ancestry.dwarf.purchased-traits')!;
  expect(dwarf.available).toBe(true);
  expect(dwarf.supportedValues).toContain('Spark Off Your Skin');
  expect(dwarf.pool.values).toContain('Great Fortitude');
  expect(result.decisions.find(d => d.id === 'ancestry.human.purchased-traits')!.available).toBe(
    false,
  );
  expect(result.selections[0]!.sources[0]!.revision).toBe(getDefinitions(1).compendiumRevision);
  expect(result.selections[0]!.sources[0]!.path).not.toBe('untrusted');
  expect(result.evaluation.status).toBe('incomplete');
  const second = await owner.client.query(discover, {
    selections: draftSelectionsFrom({ 'ancestry.choice': 'Human' }, getDefinitions(1)),
  });
  expect(second.decisions.find(d => d.id === dwarf.id)!.available).toBe(false);
});

// Replacing a parent must remove its effects, retain unrelated authored/class choices, and produce saveable output.
test('headless ancestry transition retains unrelated choices and saves through existing characters API', async () => {
  const t = backend();
  const owner = await account(t, 'Transition');
  const original = heroFixtureSelections();
  const switched = await owner.client.query(transition, {
    selections: original,
    decisionId: 'ancestry.choice',
    value: 'Dwarf',
  });
  expect(switched.removed).toContain('ancestry.devil.purchased-traits');
  const map = selectionsFrom(switched.selections);
  expect(map['class.choice']).toBe('Fury');
  expect(map['kit.choice']).toBe('Mountain');
  expect(map['details.name']).toBe(selectionsFrom(original)['details.name']);
  expect(map['ancestry.devil.silver-tongue-skill']).toBeUndefined();
  const complete = await owner.client.query(transition, {
    selections: switched.selections,
    decisionId: 'ancestry.dwarf.purchased-traits',
    value: ['Grounded', 'Spark Off Your Skin'],
  });
  expect(complete.evaluation.status).toBe('complete');
  expect(complete.evaluation.baseline!.staminaMaximum.value).toBe(36);
  const characterId = await owner.client.mutation(api.characters.create, {
    commandId: 'save-wizard-route',
    authored,
    selections: complete.selections,
  });
  const saved = await owner.client.query(api.characters.get, { characterId });
  expect(saved.evaluation).toEqual(complete.evaluation);
  expect(selectionsFrom(saved.selections)['ancestry.dwarf.purchased-traits']).toEqual([
    'Grounded',
    'Spark Off Your Skin',
  ]);
});

// Array changes must clear even partially compatible old assignments; repeating the same choice must preserve them.
test('headless characteristic array transition shares assignment reset semantics with the wizard', async () => {
  const t = backend();
  const owner = await account(t, 'Assignment');
  const original = heroFixtureSelections();
  const current = selectionsFrom(original)['class.fury.characteristic-array'];
  const unchanged = await owner.client.query(transition, {
    selections: original,
    decisionId: 'class.fury.characteristic-array',
    value: current,
  });
  expect(selectionsFrom(unchanged.selections)['class.fury.array-assignment']).toEqual(
    selectionsFrom(original)['class.fury.array-assignment'],
  );
  const changed = await owner.client.query(transition, {
    selections: original,
    decisionId: 'class.fury.characteristic-array',
    value: current === '1, 0, 0' ? '2, −1, −1' : '1, 0, 0',
  });
  expect(selectionsFrom(changed.selections)['class.fury.array-assignment']).toBeUndefined();
  expect(changed.evaluation.status).toBe('incomplete');
});

// Supplying an ID cannot expose another owner's private draft or use that draft's trusted choice origins.
test('headless routes require authentication and ownership before reading character context', async () => {
  const t = backend();
  const owner = await account(t, 'Owner');
  const stranger = await account(t, 'Stranger');
  const characterId = await owner.client.mutation(api.characters.create, {
    commandId: 'private-character',
    authored,
    selections: heroFixtureSelections(),
  });
  await expect(t.query(discover, {})).rejects.toThrow();
  await expect(stranger.client.query(discover, { characterId })).rejects.toThrow(/owner/);
  await expect(
    stranger.client.query(transition, {
      characterId,
      selections: [],
      decisionId: 'ancestry.choice',
      value: 'Human',
    }),
  ).rejects.toThrow(/owner/);
  const own = await owner.client.query(discover, { characterId });
  expect(own.evaluation.status).toBe('complete');
  expect(own.selections.length).toBeGreaterThan(0);
  const after = await owner.client.query(api.characters.get, { characterId });
  expect(after.revision).toBe(1);
});

// Read-only endpoints still reject oversized/non-JSON payloads, duplicate decisions and unsupported definition levels.
test('headless routes enforce input bounds and reject writes into unavailable decision branches', async () => {
  const t = backend();
  const owner = await account(t, 'Bounds');
  const selections = heroFixtureSelections();
  await expect(owner.client.query(discover, { targetLevel: 10 })).rejects.toThrow(/Unsupported/);
  await expect(
    owner.client.query(discover, { selections: [selections[0]!, selections[0]!] }),
  ).rejects.toThrow(/once/);
  await expect(
    owner.client.query(transition, {
      selections,
      decisionId: 'details.name',
      value: 'x'.repeat(64001),
    }),
  ).rejects.toThrow(/bounded/);
  await expect(
    owner.client.query(transition, { selections, decisionId: 'details.name', value: 1n }),
  ).rejects.toThrow(/bounded/);
  await expect(
    owner.client.query(transition, {
      selections,
      decisionId: 'ancestry.human.purchased-traits',
      value: ['Staying Power'],
    }),
  ).rejects.toThrow(/not available/);
});
