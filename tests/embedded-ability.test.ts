// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { extractEmbeddedAbility } from '../shared/resolve/embeddedAbility.ts';

function source(kind: 'kit' | 'perk', name: string): string {
  const entries = JSON.parse(readFileSync(`shared/content/compendium/${kind}.json`, 'utf8')) as {
    name: string;
    text: string;
  }[];
  return entries.find(entry => entry.name === name)!.text;
}

// Catches kit-only frontmatter projection and accidentally discarding comma-choice roll text;
// adds independent printed metadata expectations without claiming new roll-expression execution.
test('embedded kit signature exposes printed main-action and complete roll source', () => {
  const result = extractEmbeddedAbility(source('kit', 'Arcane Archer'), 'Exploding Arrow');
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  expect(result.metadata).toMatchObject({
    actionType: 'Main action',
    keywords: ['Magic', 'Ranged', 'Strike', 'Weapon'],
    distance: 'Ranged 15',
    target: 'One creature or object',
    roll: 'Power Roll + Agility, Reason, Intuition, or Presence',
    tiers: [
      '5 + A, R, I, or P fire damage',
      '7 + A, R, I, or P fire damage',
      '10 + A, R, I, or P fire damage',
    ],
  });
  expect(result.metadata.effects?.[0]?.text).toContain('within 2 squares of the target');
  expect(result.text).not.toContain('##### Equipment');
});

// Catches ignoring blockquoted ability tables and truncating Arcane Trick after its introductory
// Effect line; adds both core perk action types and full multiline manual source preservation.
test('blockquote perks retain maneuver metadata and complete effect choices', () => {
  const force = extractEmbeddedAbility(source('perk', 'Invisible Force'), 'Invisible Force');
  const trick = extractEmbeddedAbility(source('perk', 'Arcane Trick'), 'Arcane Trick');
  if (!force.ok || !trick.ok) throw new Error('Printed core perk ability missing');
  expect(force.metadata).toMatchObject({
    actionType: 'Maneuver',
    keywords: ['Psionic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'One size 1T object',
  });
  expect(force.metadata.roll).toBeUndefined();
  expect(trick.metadata.actionType).toBe('Main action');
  expect(trick.metadata.effects?.[0]?.text).toContain('The illusion ends when you stop touching');
  expect(trick.text).toContain('> ###### Arcane Trick');
});

// Catches silently parsing the entire parent entry after a stale/misspelled grant, and leaking a
// neighboring section into the selected action; this is the source boundary the caller relies on.
test('missing names fail explicitly and named extraction ends at the next source section', () => {
  const text = source('kit', 'Mountain');
  expect(extractEmbeddedAbility(text, 'Not Pain for Pain')).toEqual({
    ok: false,
    name: 'Not Pain for Pain',
    reason: 'missing-section',
  });
  const extended = `${text}\n##### Unrelated\nDo not attach this to Pain for Pain.`;
  const result = extractEmbeddedAbility(extended, 'Pain for Pain');
  if (!result.ok) throw new Error(result.reason);
  expect(result.text).not.toContain('Do not attach');
  expect(result.metadata.effects?.[0]?.text).not.toContain('Do not attach');
  expect(extractEmbeddedAbility('###### Unusable\nNo printed ability header.', 'Unusable')).toEqual(
    { ok: false, name: 'Unusable', reason: 'missing-header' },
  );
});
