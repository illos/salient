// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { admitHero, backend, table } from './fixtures/table';
import type { DerivedBaseline, SelectionValue } from '../../shared/contracts/characterEvaluation';

// Catches read-side grant repairs working for new builds only. The direct fixture patch represents
// a pre-V83 stored baseline; new-build persistence is covered through public operations separately.
test('legacy saved perks expose new actions on sheet and table without rewriting the stored build', async () => {
  const t = backend();
  await t.action(internal.content.reseed, {});
  const f = await table(t);
  const { selections } = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    selections: Record<string, SelectionValue>;
  };
  for (const key of Object.keys(selections)) if (key.startsWith('career.')) delete selections[key];
  Object.assign(selections, {
    'career.choice': "Mage's Apprentice",
    'career.mages-apprentice.skills': ['Monsters', 'Timescape'],
    'career.mages-apprentice.languages': [null],
    'career.mages-apprentice.perk': 'Familiar',
    'career.mages-apprentice.inciting-incident': 'Forgotten Memories',
  });
  const characterId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'LegacyFamiliar',
    draftSelectionsFrom(selections, getDefinitions(1)),
  );
  const stored = await t.run(async ctx => {
    const character = (await ctx.db.get(characterId))!;
    const baseline = structuredClone(character.derivedBaseline) as DerivedBaseline;
    baseline.abilities = baseline.abilities.filter(a => a.kind !== 'perk');
    await ctx.db.patch(characterId, { derivedBaseline: baseline });
    for (const revisionId of new Set([character.draftRevisionId, character.effectiveRevisionId])) {
      if (revisionId) {
        const revision = (await ctx.db.get(revisionId))!;
        await ctx.db.patch(revisionId, {
          derivedBaseline: baseline,
          evaluation: { ...revision.evaluation, baseline, partial: baseline },
        });
      }
    }
    return baseline;
  });
  const sheet = await f.player.client.query(api.characters.sheet, { characterId });
  if (sheet.audience === 'peer') throw new Error('Expected owner sheet');
  expect(sheet.abilities.find(a => a.name === 'Familiar: Restore')?.metadata.cost).toBe(
    '1 Recovery',
  );
  const abilities = await f.player.client.query(api.abilities.sheet, {
    campaignId: f.campaignId,
    actor: { kind: 'character', id: characterId, name: 'LegacyFamiliar' },
  });
  expect(abilities.abilities.find(a => a.name === 'Familiar: Restore')?.fixedCost).toEqual({
    resource: 'recovery',
    amount: 1,
  });
  expect((await t.run(ctx => ctx.db.get(characterId)))!.derivedBaseline).toEqual(stored);
});
