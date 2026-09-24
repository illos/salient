// SPDX-License-Identifier: GPL-3.0-only
/** V25 persisted wizard coverage. Expected character data is independently transcribed from source. */
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { actorRollFacts, damageTargetFacts } from '../../convex/lib/resolve';
import { definitions } from '../../shared/content/level-one-decisions';
import type { EvaluationInput, EvaluationResult } from '../../shared/contracts/characterEvaluation';
import type { HeroSheet } from '../../shared/contracts/characterSheet';
import { assignCharacteristic } from '../../shared/evaluate/assignment';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import { pruneUnavailable } from '../../shared/evaluate/structure';
import reference from '../fixtures/v25-bethell.json';
import { backend, table, admitHero, storedEvents } from './fixtures/table';
import { vendorPath } from '../../scripts/lib/vendor.ts';

// The rules researcher authored these selections and expected totals independently.
const fixture = { ...reference, selections: reference.selections as EvaluationInput['selections'] };
const selections = () => draftSelectionsFrom(fixture.selections, definitions);
const authored = {
  name: 'Bethell',
  appearance: 'Polder mage',
  biography: 'Forgotten past',
  notes: 'Owner secret',
};

test('Bethell saves, reloads and supplies complete sourced features, abilities and independent source totals', async () => {
  const t = backend();
  const { player, director, observer, campaignId } = await table(t, { session: false });
  await t.action(internal.content.reseed, {});
  const id = await admitHero(t, player, director, campaignId, 'Bethell', selections());
  const saved = await player.client.query(api.characters.get, { characterId: id });
  const evaluated = saved.evaluation as EvaluationResult;
  expect(evaluated.status).toBe('complete');
  const b = evaluated.baseline!;
  expect(
    Object.fromEntries(Object.entries(b.characteristics).map(([k, v]) => [k, v.value])),
  ).toEqual(reference.expected.characteristics);
  for (const key of [
    'level',
    'ancestry',
    'class',
    'subclass',
    'career',
    'staminaMaximum',
    'recoveriesMaximum',
    'recoveryValue',
    'windedValue',
    'speed',
    'stability',
    'size',
    'disengage',
    'savingThrowThreshold',
    'renown',
    'wealth',
  ] as const)
    expect(b[key].value, key).toBe(reference.expected[key]);
  expect(b.kit).toBeNull();
  expect(b.heroicResource.name.value).toBe(reference.expected.heroicResource);
  for (const key of ['skills', 'languages', 'traits', 'features', 'perks', 'abilities'] as const)
    expect(b[key].map(grant => grant.name).sort(), key).toEqual(
      [...reference.expected[key]].sort(),
    );
  expect(saved.selections).toEqual(selections());
  const persisted = (await t.run(ctx => ctx.db.get(id)))!;
  const actor = { kind: 'character' as const, id, name: 'Bethell' };
  const rollFacts = actorRollFacts(actor, { character: persisted });
  expect(rollFacts.abilityDamageModifiers).toEqual([
    { label: 'Enchantment of Destruction', amount: 1, keywords: ['Magic'] },
    {
      label: 'Fire: Acolyte of Fire',
      amount: 1,
      keywords: ['Fire', 'Magic'],
      alternative: { ability: 'Hurl Element', damageType: 'fire' },
    },
  ]);
  expect(rollFacts).not.toHaveProperty('kitMeleeDamageBonus');
  expect(damageTargetFacts({ actor, character: persisted })).toMatchObject({
    facts: { stamina: 18, maxStamina: 18, immunities: [{ type: 'corruption', value: 3 }] },
  });
  const sheet = (await player.client.query(api.characters.sheet, { characterId: id })) as HeroSheet;
  expect(sheet.details.incitingIncident).toBe('Forgotten Memories');
  expect(sheet.live?.heroicResource).toEqual({ name: 'essence', current: 0 });
  for (const grant of [...sheet.features, ...sheet.abilities]) {
    expect(grant.content, grant.name).not.toBeNull();
    expect(grant.content!.text, grant.name).toBe(
      readFileSync(vendorPath(grant.content!.sourcePath), 'utf8'),
    );
    expect(grant.grantedBy.quote, grant.name).not.toBe('');
  }
  const fire = sheet.abilities.find(ability => ability.name === 'Bifurcated Incineration')!;
  expect(fire.buildModifiers?.map(modifier => modifier.amount)).toEqual([1, 1]);
  const hurl = sheet.abilities.find(ability => ability.name === 'Hurl Element')!;
  expect(hurl.buildModifiers?.find(modifier => modifier.condition)?.condition).toBe(
    'when choosing fire damage',
  );
  const directorSheet = (await director.client.query(api.characters.sheet, {
    characterId: id,
  })) as HeroSheet;
  expect(directorSheet.authored).not.toHaveProperty('notes');
  const peer = await observer.client.query(api.characters.sheet, { characterId: id });
  expect(peer).toMatchObject({ audience: 'peer', live: { stamina: 18, recoveries: 8 } });
  expect(peer).not.toHaveProperty('build');
});

test('Elementalist named assignment and wizard transition persist the same four nonfixed scores', async () => {
  const t = backend();
  const { player } = await table(t, { session: false });
  const named = await player.client.mutation(api.characters.create, {
    commandId: 'named-create',
    authored,
  });
  const direct = await player.client.mutation(api.characters.create, {
    commandId: 'direct-create',
    authored,
  });
  let values: EvaluationInput['selections'] = {
    ...fixture.selections,
    'class.elementalist.array-assignment': {},
  };
  for (const characterId of [named, direct])
    await player.client.mutation(api.characters.save, {
      characterId,
      commandId: `start-${characterId}`,
      expectedRevision: 1,
      authored,
      selections: draftSelectionsFrom(values, definitions),
    });
  let revision = 2;
  for (const [target, value] of [
    ['Might', -1],
    ['Agility', 1],
    ['Intuition', 2],
    ['Presence', 1],
  ] as const) {
    values = assignCharacteristic(values, target, value, undefined, definitions);
    await player.client.mutation(api.characters.save, {
      characterId: named,
      commandId: `named-assignment-${revision}`,
      expectedRevision: revision,
      authored,
      assignment: { target, value },
    });
    await player.client.mutation(api.characters.save, {
      characterId: direct,
      commandId: `direct-assignment-${revision}`,
      expectedRevision: revision,
      authored,
      selections: draftSelectionsFrom(values, definitions),
    });
    revision++;
  }
  const a = await player.client.query(api.characters.get, { characterId: named });
  const b = await player.client.query(api.characters.get, { characterId: direct });
  expect(a.selections).toEqual(b.selections);
  expect(a.evaluation).toEqual(b.evaluation);
  expect(a.status).toBe('complete');
  await expect(
    player.client.mutation(api.characters.save, {
      characterId: named,
      commandId: 'fixed-reason',
      expectedRevision: revision,
      authored,
      assignment: { target: 'Reason', value: 1 },
    }),
  ).rejects.toThrow('fixed');
});

test('Elementalist full edit reviews an exact revision, preserves live play, enforces locks and prunes parent choices', async () => {
  const t = backend();
  const { player, director, campaignId } = await table(t, { session: false });
  const characterId = await admitHero(t, player, director, campaignId, 'Bethell', selections());
  await t.run(async ctx => {
    const row = (await ctx.db.get(characterId))!;
    await ctx.db.patch(characterId, {
      liveState: {
        ...row.liveState!,
        stamina: 11,
        recoveries: 4,
        heroicResource: { name: 'essence', current: 7 },
        temporaryStamina: 3,
        surges: 2,
        victories: 3,
        xp: 4,
        conditions: { ...row.liveState!.conditions, prone: true },
      },
    });
  });
  const before = (await t.run(ctx => ctx.db.get(characterId)))!;
  const changed = { ...fixture.selections, 'culture.language': 'Higaran' };
  await player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'edit-bethell',
    expectedRevision: before.revision,
    authored,
    selections: draftSelectionsFrom(changed, definitions),
  });
  await player.client.mutation(api.characters.submit, {
    characterId,
    campaignId,
    commandId: 'submit-edit',
  });
  expect((await t.run(ctx => ctx.db.get(characterId)))!.effectiveRevisionId).toBe(
    before.effectiveRevisionId,
  );
  const proposed = (await director.client.query(api.characters.sheet, {
    characterId,
    view: 'proposed',
  })) as HeroSheet;
  expect(proposed.build?.revision).toBe(before.revision + 1);
  expect(proposed.authored).not.toHaveProperty('notes');
  await player.client.mutation(api.characters.save, {
    characterId,
    commandId: 'edit-again',
    expectedRevision: before.revision + 1,
    authored,
    selections: draftSelectionsFrom({ ...changed, 'culture.language': 'Illyvric' }, definitions),
  });
  await expect(
    director.client.mutation(api.characters.approve, {
      characterId,
      campaignId,
      commandId: 'stale-approve',
    }),
  ).rejects.toThrow();
  await player.client.mutation(api.characters.submit, {
    characterId,
    campaignId,
    commandId: 'resubmit-edit',
  });
  await director.client.mutation(api.characters.approve, {
    characterId,
    campaignId,
    commandId: 'approve-edit',
  });
  const after = (await t.run(ctx => ctx.db.get(characterId)))!;
  expect(after.effectiveRevisionId).toBe(after.draftRevisionId);
  expect(after.liveState).toEqual(before.liveState);
  await expect(
    player.client.mutation(api.characters.save, {
      characterId,
      commandId: 'stale-save',
      expectedRevision: before.revision,
      authored,
    }),
  ).rejects.toThrow('changed since');
  await t.run(ctx => ctx.db.patch(characterId, { combatLocked: true }));
  await expect(
    player.client.mutation(api.characters.save, {
      characterId,
      commandId: 'locked-save',
      expectedRevision: after.revision,
      authored,
    }),
  ).rejects.toThrow('locked during combat');
  const pruned = pruneUnavailable({ ...fixture.selections, 'class.choice': 'Fury' }, definitions);
  expect(Object.keys(pruned.selections).some(id => id.startsWith('class.elementalist.'))).toBe(
    false,
  );
  expect(pruned.selections['ancestry.polder.purchased-traits']).toEqual(
    fixture.selections['ancestry.polder.purchased-traits'],
  );
  expect(pruned.selections['culture.language']).toEqual(fixture.selections['culture.language']);
  expect(after.authored).toEqual(authored);
});

test('real Fury to Elementalist full edit refuses incompatible live resource atomically', async () => {
  const t = backend();
  const { player, director, campaignId, thornId } = await table(t, { session: false });
  const before = (await t.run(ctx => ctx.db.get(thornId)))!;
  await player.client.mutation(api.characters.save, {
    characterId: thornId,
    commandId: 'class-change',
    expectedRevision: before.revision,
    authored: before.authored,
    selections: selections(),
  });
  await player.client.mutation(api.characters.submit, {
    characterId: thornId,
    campaignId,
    commandId: 'class-submit',
  });
  const pending = (await t.run(ctx => ctx.db.get(thornId)))!;
  const events = await storedEvents(t, campaignId);
  await expect(
    director.client.mutation(api.characters.approve, {
      characterId: thornId,
      campaignId,
      commandId: 'class-approve',
    }),
  ).rejects.toThrow('requires explicit resource reconciliation');
  expect(await t.run(ctx => ctx.db.get(thornId))).toEqual(pending);
  expect(pending.liveState).toEqual(before.liveState);
  expect(await storedEvents(t, campaignId)).toEqual(events);
});
