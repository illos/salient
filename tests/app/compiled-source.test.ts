// SPDX-License-Identifier: GPL-3.0-only
/** V72 adapter boundary: malformed persisted source cannot use the A05 compatibility escape. */
import { describe, expect, it } from 'vitest';
import { entries, manifest } from '../../shared/content/compendium/index';
import { abilityFromEntry, abilitiesFromStatBlock } from '../../convex/lib/resolve';
import { compileLiveEntry, compileLiveKit, type LiveSource } from '../../convex/lib/compiledSource';
import type { Doc } from '../../convex/_generated/dataModel';

function source(name: string): Doc<'content'> {
  const entry = entries.find(candidate => candidate.name === name);
  if (!entry) throw new Error(`Missing bundled source ${name}`);
  return {
    ...structuredClone(entry),
    contentId: entry.id,
    revision: manifest.compendium.revision,
    _id: entry.id as Doc<'content'>['_id'],
    _creationTime: 0,
  };
}

const compilation = (name: string) => abilityFromEntry(source(name)).compilation!;

describe('V72 selected source runtime adapters', () => {
  // V176: Thunder Roar's Effect orders its tier pushes, which is table work; it now compiles.
  it.each([
    'Brutal Slam',
    'Viscous Fire',
    'Melee Weapon Free Strike',
    'Ranged Weapon Free Strike',
    'Thunder Roar',
  ])('hands the currently reachable standalone %s to the checked compiler', name => {
    const result = compilation(name);
    expect(result.mode).toBe('compiled');
    expect(result.definition.execution).toBe('supported');
    expect(result.definition.metadata).toBeDefined();
    expect(result.diagnostics).toEqual([]);
  });

  it('compiles both Goblin abilities without leaking sibling abilities or parent facts', () => {
    const definitions = abilitiesFromStatBlock(source('Goblin Warrior'));
    expect(definitions.map(ability => ability.name)).toEqual(['Spear Charge', 'Bury the Point']);
    for (const ability of definitions) {
      expect(ability.compilation?.mode).toBe('compiled');
      expect(ability.compilation?.definition.id).toBe(ability.abilityId);
      const publicSource = JSON.stringify(ability.compilation);
      const otherName = ability.name === 'Spear Charge' ? 'Bury the Point' : 'Spear Charge';
      expect(publicSource).not.toContain(otherName);
      expect(publicSource).not.toContain('Crafty');
      expect(publicSource).not.toContain('parentContext');
      expect(publicSource).not.toContain('stamina');
    }
    expect(
      definitions[1]!.compilation!.definition.tiers.every(
        nodes =>
          nodes.length === 2 && nodes[0]!.kind === 'damage' && nodes[1]!.kind === 'condition',
      ),
    ).toBe(true);
  });

  it.each(['Out of the Way!'])('preserves only the labeled established A05 path for %s', name => {
    const result = compilation(name);
    expect(result.mode).toBe('legacy-compatibility');
    expect(result.definition.execution).toBe('manual');
  });

  it('keeps Pain for Pain on the unchanged kit adapter', () => {
    const entry = source('Mountain');
    expect(compileLiveKit(entry, 'Pain for Pain').mode).toBe('legacy-compatibility');
    entry.text += '\nA new mechanical section.\n';
    expect(compileLiveKit(entry, 'Pain for Pain').mode).toBe('manual');
  });

  // Previously A05's partial reader could continue after source changes or take the first roll.
  // All three drift kinds must stop that route for both supported and legacy definitions.
  it.each(['Brutal Slam', 'Thunder Roar'])(
    'refuses changed body, projection and revision for %s',
    name => {
      const variants: LiveSource[] = [source(name), source(name), source(name)];
      variants[0]!.text += '\nThe target takes 20 extra damage.\n';
      variants[1]!.structured = { ...variants[1]!.structured, target: 'Two creatures' };
      variants[2]!.revision = 'different-source-revision';
      for (const entry of variants) {
        const result = compileLiveEntry(entry, 'ability');
        expect(result.mode).toBe('manual');
        expect(result.diagnostics.some(diagnostic => diagnostic.code === 'live-source-drift')).toBe(
          true,
        );
      }
    },
  );

  it('does not let a compilable changed numeric projection bypass the current source boundary', () => {
    const entry = source('Brutal Slam');
    entry.text = entry.text.replaceAll('6 + M damage', '60 + M damage');
    const effects = structuredClone(entry.structured.effects) as { tier2: string }[];
    effects[0]!.tier2 = effects[0]!.tier2.replace('6 + M damage', '60 + M damage');
    entry.structured.effects = effects;
    const result = compileLiveEntry(entry, 'ability');
    expect(result.definition.execution).toBe('supported');
    expect(result.mode).toBe('manual');
  });

  it('compares object values rather than incidental serialized field order', () => {
    const entry = source('Brutal Slam');
    entry.structured = Object.fromEntries(Object.entries(entry.structured).reverse());
    expect(compileLiveEntry(entry, 'ability').mode).toBe('compiled');
  });

  it('refuses a changed foe source and diagnoses it without disclosing private parent values', () => {
    const entry = source('Goblin Warrior');
    entry.structured = { ...entry.structured, stamina: 'private-secret-value' };
    const abilities = abilitiesFromStatBlock(entry);
    expect(abilities.every(ability => ability.compilation?.mode === 'manual')).toBe(true);
    expect(JSON.stringify(abilities.map(ability => ability.compilation))).not.toContain(
      'private-secret-value',
    );
  });
});
