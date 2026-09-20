// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { definitions } from '../../shared/content/level-one-decisions';
import type { EvaluationResult } from '../../shared/contracts/characterEvaluation';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import reference from '../fixtures/v25-bethell.json';
import { backend, table, admitHero } from './fixtures/table';

// Catches dropped newly supported traits on persistence, missing/wrong source
// content, and stale grants after replacement. Existing V25 persistence exercises
// only the quick build; this case also protects live resources during a trait edit.
test('Polder-movement traits survive save/readback with readable effects and replacement preserves live state', async () => {
  const t = backend();
  const { player, director, campaignId } = await table(t, { session: false });
  await t.action(internal.content.reseed, {});
  const selected = {
    ...reference.selections,
    'ancestry.polder.purchased-traits': ['Nimblestep', 'Polder Geist', 'Reactive Tumble'],
  };
  const characterId = await admitHero(
    t,
    player,
    director,
    campaignId,
    'Polder-movement',
    draftSelectionsFrom(selected, definitions),
  );
  const saved = await player.client.query(api.characters.get, { characterId });
  expect((saved.evaluation as EvaluationResult).status).toBe('complete');
  expect(saved.selections).toEqual(draftSelectionsFrom(selected, definitions));
  const sheet = (await player.client.query(api.characters.sheet, { characterId })) as HeroSheet;
  for (const [name, phrases] of [
    ['Nimblestep', ['difficult terrain', 'while sneaking']],
    ['Polder Geist', ['line of effect', 'until the end of your']],
    ['Reactive Tumble', ['free', 'triggered action', 'is resolved']],
  ] as const) {
    const content = sheet.features.find(feature => feature.name === name)?.content;
    expect(content, name).not.toBeNull();
    for (const phrase of phrases) expect(content?.text, name).toContain(phrase);
  }
  await t.run(async ctx => {
    const row = (await ctx.db.get(characterId))!;
    await ctx.db.patch(characterId, {
      liveState: {
        ...row.liveState!,
        stamina: 11,
        heroicResource: { name: 'essence', current: 7 },
      },
    });
  });
  const before = (await t.run(ctx => ctx.db.get(characterId)))!;
  await player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'replace-polder-traits',
    expectedRevision: before.revision,
    authored: before.authored,
    selections: draftSelectionsFrom(reference.selections, definitions),
  });
  await player.client.mutation(api.characters.submit, {
    characterId,
    campaignId,
    commandId: 'submit-polder-replacement',
  });
  await director.client.mutation(api.characters.approve, {
    characterId,
    commandId: 'approve-polder-replacement',
  });
  const reloaded = await player.client.query(api.characters.get, { characterId });
  const baseline = (reloaded.evaluation as EvaluationResult).baseline!;
  expect(baseline.traits.map(trait => trait.name).sort()).toEqual([
    'Corruption Immunity',
    'Fearless',
    'Graceful Retreat',
    'Shadowmeld',
    'Small!',
  ]);
  expect(baseline.disengage.value).toBe(2);
  expect((await t.run(ctx => ctx.db.get(characterId)))!.liveState).toEqual(before.liveState);
});
