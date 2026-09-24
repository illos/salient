// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { STARTING_ITEM_ABILITIES } from '../shared/content/starting-item-abilities.ts';
import { vendorPath } from '../scripts/lib/vendor.ts';

// Catches stale/misquoted item excerpts and higher-level weapon powers leaking into level-one
// manual cards. Uses the pinned book itself, not a second generated application catalog.
test('starting item cards retain exact source and stop at first-level weapon properties', () => {
  for (const ability of STARTING_ITEM_ABILITIES) {
    const source = readFileSync(
      vendorPath(`vendor/steel-compendium/${ability.sourcePath}`),
      'utf8',
    );
    expect(source, ability.name).toContain(ability.quote);
    if (ability.sourcePath.includes('/leveled/weapon/')) {
      const firstLevel = source.split('**1st Level:**')[1]!.split('**5th Level:**')[0]!;
      expect(firstLevel, ability.name).toContain(ability.quote);
    }
  }
});

// Catches collapsing distinct source operations into one maneuver, charging the source's free
// release, or inventing a combat action cost for a narrative item. These are different failure
// modes from source text retention: a correct quote can still have incorrect execution metadata.
test('distinct item operations preserve printed timing and narrative timing remains unspecified', () => {
  const find = (name: string) => {
    const ability = STARTING_ITEM_ABILITIES.find(entry => entry.name === name);
    expect(ability, name).toBeDefined();
    return ability!;
  };
  expect(find('Divine Vine: Distant Grab').actionType).toBe('Maneuver');
  expect(find('Divine Vine: Release Target').actionType).toBe('No action required');
  expect(find('Flameshade Gloves: Pass Through Object').actionType).toBe(
    'As part of a move action',
  );
  expect(find('Flameshade Gloves: Free Stuck Hand').actionType).toBe('Main action');
  expect(find('Deadweight: Falling Free Strike').actionType).toBe('Free maneuver');
  expect(find('Wetwork: Finishing Free Strike').actionType).toBe('Maneuver');
  expect(find('Quantum Satchel: Entangle Location').actionType).toBe('Timing not specified');
  expect(find('Quantum Satchel: Retrieve Object').cost).toBeUndefined();
  expect(STARTING_ITEM_ABILITIES.some(entry => entry.item === 'Gecko Gloves')).toBe(false);
});
