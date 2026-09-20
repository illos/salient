// SPDX-License-Identifier: GPL-3.0-only
import { expect, test } from 'vitest';
import { abilitiesFromStatBlock } from '../../convex/lib/resolve';
import statblocks from '../../shared/content/compendium/statblock.json';
import manifest from '../../shared/content/compendium/manifest.json';
import type { ContentEntry } from '../../shared/contracts/content';

// V87 exposes the entire core corpus. This catches five previously blank ability cards caused by
// source spacing in four retainer signature headings and Rival Null's Inertial Flow heading.
// build-content.test independently verifies every snapshot body/feature against the pinned source.
test('every embedded core ability has a nonempty, byte-exact source section', () => {
  let count = 0;
  for (const entry of statblocks as unknown as ContentEntry[]) {
    const expected = (entry.features ?? []).filter(
      (feature): feature is { feature_type: string; name: string } =>
        feature !== null &&
        typeof feature === 'object' &&
        !Array.isArray(feature) &&
        feature.feature_type === 'ability' &&
        typeof feature.name === 'string',
    );
    const abilities = abilitiesFromStatBlock({
      ...entry,
      contentId: entry.id,
      revision: manifest.compendium.revision,
    });
    expect(
      abilities.map(ability => ability.name),
      entry.id,
    ).toEqual(expected.map(f => f.name));
    for (const ability of abilities) {
      expect(ability.text.trim().length, `${entry.id}: ${ability.name}`).toBeGreaterThan(0);
      expect(entry.text.includes(ability.text), `${entry.id}: ${ability.name}`).toBe(true);
    }
    count += abilities.length;
  }
  expect(count).toBe(1158);
});
