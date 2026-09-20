// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { api, internal } from '../../convex/_generated/api';
import { getDefinitions } from '../../shared/content/character-decisions';
import { draftSelectionsFrom } from '../../shared/evaluate/draft';
import type { SelectionValue } from '../../shared/contracts/characterEvaluation';
import { account, backend, admitHero, table } from './fixtures/table';

const cases = [
  ['Devil', ['Barbed Tail', 'Glowing Eyes', 'Hellsight'], [['Glowing Eyes', 'triggered']]],
  [
    'Polder',
    ['Nimblestep', 'Polder Geist', 'Reactive Tumble'],
    [
      ['Reactive Tumble', 'triggered'],
      ['Shadowmeld', 'maneuver'],
    ],
  ],
  [
    'Human',
    ['Determination', 'Resist the Unnatural'],
    [
      ['Detect the Supernatural', 'maneuver'],
      ['Determination', 'maneuver'],
      ['Resist the Unnatural', 'triggered'],
    ],
  ],
  [
    'Dwarf',
    ['Grounded', 'Stand Tough', 'Stone Singer'],
    [
      ['Stone Singer', 'other'],
      ['Runic Carving: Carve, Change, or Remove Rune', 'other'],
    ],
  ],
  ['Hakaan', ['Doomsight', 'Forceful'], [['Doomsight', 'other']]],
  ['Orc', ['Bloodfire Rush', 'Glowing Recovery'], [['Relentless', 'other']]],
] as const;
function choices(ancestry: string, traits: readonly string[]) {
  const fixture = JSON.parse(readFileSync('tests/fixtures/v25-fury.json', 'utf8')) as {
    selections: Record<string, SelectionValue>;
  };
  for (const key of Object.keys(fixture.selections))
    if (key.startsWith('ancestry.')) delete fixture.selections[key];
  fixture.selections['ancestry.choice'] = ancestry;
  fixture.selections[`ancestry.${ancestry.toLowerCase()}.purchased-traits`] = [...traits];
  if (ancestry === 'Devil') fixture.selections['ancestry.devil.silver-tongue-skill'] = 'Persuade';
  return draftSelectionsFrom(fixture.selections, getDefinitions(1));
}

// Catches the original omission through persisted sheet reads, including correct action groups,
// source content, and absent play-time rune grants; adds every audited trait family.
test('saved traits expose all audited actions with source and correct grouping', async () => {
  const t = backend();
  await t.mutation(internal.content.reseed, {});
  const owner = await account(t, 'TraitOwner');
  for (const [ancestry, traits, actions] of cases) {
    const characterId = await owner.client.mutation(api.characters.create, {
      commandId: `trait-${ancestry}`,
      authored: { name: ancestry, appearance: '', biography: '', notes: '' },
      selections: choices(ancestry, traits),
    });
    const saved = await owner.client.query(api.characters.get, { characterId });
    expect(saved.status).toBe('complete');
    const sheet = await owner.client.query(api.characters.sheet, { characterId });
    if (sheet.audience === 'peer') throw new Error('Expected owner');
    for (const [name, group] of actions) {
      const matches = sheet.abilities.filter(a => a.name === name);
      expect(matches, name).toHaveLength(1);
      expect(matches[0]!.group, name).toBe(group);
      expect(matches[0]!.content?.text, name).toBeTruthy();
      expect(matches[0]!.grantedBy.path).toContain('feature/trait/');
      if (name !== 'Shadowmeld') expect(matches[0]!.grantedBy.path).toBe(matches[0]!.sourcePath);
    }
    expect(sheet.abilities.some(a => a.name === 'Runic Carving: Detection')).toBe(false);
    if (ancestry === 'Human') {
      await owner.client.mutation(api.characters.save, {
        characterId,
        commandId: 'human-drop-purchases',
        expectedRevision: saved.revision,
        authored: saved.authored,
        selections: choices('Human', ['Perseverance', 'Staying Power']),
      });
      const updated = await owner.client.query(api.characters.sheet, { characterId });
      if (updated.audience === 'peer') throw new Error('Expected owner');
      expect(updated.abilities.map(a => a.name)).toContain('Detect the Supernatural');
      expect(updated.abilities.map(a => a.name)).not.toContain('Determination');
      expect(updated.abilities.map(a => a.name)).not.toContain('Resist the Unnatural');
    }
  }
});

// Catches separate sheet/table grant discovery drifting, and old saved builds staying broken
// after deployment. Existing stored trait provenance must be sufficient; no resource reset.
test('old admitted traits gain table actions without editing their build', async () => {
  const t = backend();
  await t.mutation(internal.content.reseed, {});
  const f = await table(t);
  const characterId = await admitHero(
    t,
    f.player,
    f.director,
    f.campaignId,
    'Eyes',
    choices('Devil', ['Glowing Eyes', 'Impressive Horns']),
  );
  const before = (await t.run(ctx => ctx.db.get(characterId)))!;
  const old = structuredClone(before.derivedBaseline);
  old.abilities = old.abilities.filter((a: { name: string }) => a.name !== 'Glowing Eyes');
  await t.run(ctx => ctx.db.patch(characterId, { derivedBaseline: old }));
  const sheet = await f.player.client.query(api.abilities.sheet, {
    campaignId: f.campaignId,
    actor: { kind: 'character', id: characterId, name: 'Eyes' },
  });
  const action = sheet.abilities.find(a => a.name === 'Glowing Eyes');
  expect(action?.actionType).toBe('triggered action');
  expect(action?.kind).toBe('recorded');
  expect(action?.text).toContain('1d10 + your level');
  const after = (await t.run(ctx => ctx.db.get(characterId)))!;
  expect(after.liveState).toEqual(before.liveState);
  expect(after.effectiveRevisionId).toEqual(before.effectiveRevisionId);
});
