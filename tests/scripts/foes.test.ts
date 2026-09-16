// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateFoes, readInputs } from '../../scripts/ingest-foes.ts';
import {
  applyCorrections,
  fingerprint,
  importFoes,
  REVISION,
  tags,
} from '../../scripts/foes/import.ts';
import type { Identity } from '../../scripts/foes/import.ts';
import { compareBlock, compareFoes, validateComparisonReport } from '../../scripts/foes/compare.ts';
import type { Fields, FoePackage, Json } from '../../shared/contracts/foes.ts';
import { foeReference, resolveFoe, searchFoes } from '../../shared/foes/catalog.ts';
const pack = JSON.parse(
  readFileSync(new URL('../../shared/content/foes/catalog.json', import.meta.url), 'utf8'),
) as FoePackage;
const identities = JSON.parse(
  readFileSync(new URL('../../scripts/foes/identities.json', import.meta.url), 'utf8'),
) as Identity[];
const named = (name: string, parent?: string) =>
  pack.objects.find(o => o.name === name && (!parent || o.parentId?.endsWith('/' + parent)))!;
/** Synthetic counterpart, NOT a captured third-party fixture. Literal source-derived sample. */
function skeletonCounterpart(): Fields {
  return {
    id: 'skeleton',
    name: 'Skeleton',
    source: { book: 'Monsters' },
    level: 1,
    ev: 3,
    role: 'Artillery',
    organization: 'Horde',
    keywords: ['Undead', 'Soulless'],
    size: '1M',
    speed: 5,
    stamina: 10,
    stability: 0,
    freeStrike: 2,
    withCaptain: '',
    characteristics: { might: 0, agility: 2, reason: 1, intuition: 0, presence: -1 },
    immunities: { corruption: 1, poison: 1 },
    weaknesses: {},
    movementTypes: ['walk'],
    items: [
      {
        type: 'ability',
        name: 'Bone Shards',
        ability_type: 'Signature Ability',
        keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
        usage: 'Main action',
        distance: 'Melee 1 or ranged 10',
        target: 'One creature or object',
        effects: [
          { roll: '2d10 + 2', tier1: '4 damage', tier2: '6 damage', tier3: '7 damage' },
          {
            name: 'Effect',
            effect:
              "Until the start of the skeleton's next turn, the target takes 2 damage the first time they willingly move on their turn.",
          },
        ],
      },
      {
        type: 'ability',
        name: 'Bone Spur',
        cost: '2 Malice',
        keywords: ['Area', 'Weapon'],
        usage: 'Maneuver',
        distance: '1 burst',
        target: 'Each enemy in the area',
        effects: [
          {
            roll: '2d10 + 2',
            tier1: '1 damage; M<0 bleeding (save ends)',
            tier2: '2 damage; M<1 bleeding (save ends)',
            tier3: '3 damage; M<2 bleeding (save ends)',
          },
          { name: 'Effect', effect: 'Each target takes a bane on their next strike.' },
        ],
      },
      {
        type: 'feature',
        name: 'Arise',
        effects: [
          {
            effect:
              "The first time the skeleton is reduced to 0 Stamina by damage that isn't fire damage or holy damage and their body isn't destroyed, they instead have 1 Stamina and fall prone.",
          },
        ],
      },
    ],
  };
}
describe('undead source ingestion', () => {
  it('regenerates twice byte-for-byte and retains exact pinned input', async () => {
    const a = await generateFoes(),
      b = await generateFoes();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a).toEqual(pack);
    expect(a.objects.filter(o => o.kind === 'statblock')).toHaveLength(11);
    expect(a.objects.filter(o => o.kind === 'ability')).toHaveLength(23);
    expect(a.objects.filter(o => o.kind === 'trait')).toHaveLength(13);
    expect(a.objects.filter(o => o.kind === 'malice' && o.parentId)).toHaveLength(4);
    for (const input of readInputs()) {
      const object = a.objects.find(
        o => o.source.path.endsWith(input.path + '.md') && !o.parentId,
      )!;
      expect(object.original.markdown).toBe(input.markdown);
      expect(object.original.json).toBe(input.json);
      expect(object.original.linkedMarkdown).toBe(input.linkedMarkdown);
      const reconstructed =
        object.markdown +
        object.featureIds.map(id => a.objects.find(o => o.id === id)!.original.markdown).join('');
      expect(object.original.markdown.endsWith(reconstructed)).toBe(true);
    }
  }, 30_000);
  it('preserves source envelope, minion quantity, villain labels and complete ordered sections', () => {
    expect(named('Crawling Claw').ev).toEqual({
      printed: '3 for four minions',
      amount: 3,
      quantity: 4,
    });
    expect(named('Decrepit Skeleton').fields.with_captain).toBe('Gain an edge on strikes');
    expect(named('Ghost').fields.role).toBe('');
    expect(named('Paranormal Activity').activation).toEqual({
      signature: false,
      villainAction: 1,
      costText: null,
    });
    expect(named('Haunt').markdown).toContain('one additional target');
    expect(named('Shriek').fields.trigger).toBe(
      'A creature within distance targets the ghost with a strike.',
    );
    expect(named('Spirited Away').markdown).toContain('while flying this way');
    expect(named('Clobber and Clutch').markdown).toContain('Find a Cure downtime project');
    expect(named('Bone Shards').markdown).toContain('willingly move on their turn');
    const dust = named('Zombie Dust').markdown;
    expect(dust.indexOf('expelling a wave')).toBeLessThan(dust.indexOf('Power Roll'));
    expect(named('The Grasping, the Hungry').markdown).toContain('Agility test');
  });
  it('resolves exact public editions and searches independent parent-bound objects', () => {
    for (const name of ['Skeleton', 'Bone Shards', 'Arise']) {
      const object = named(name, name === 'Arise' ? 'skeleton' : undefined);
      expect(resolveFoe(pack, foeReference(pack, object.id))?.object).toBe(object);
      expect(
        resolveFoe(pack, { ...foeReference(pack, object.id), edition: 'old' }),
      ).toBeUndefined();
    }
    const arises = searchFoes(pack, 'Arise', { kind: 'trait' });
    expect(arises.map(e => e.parentName).sort()).toEqual(['Ghoul', 'Skeleton', 'Soulwight']);
    expect(new Set(arises.map(e => e.id)).size).toBe(3);
    expect(
      searchFoes(pack, 'Bone', { kind: 'ability', keyword: 'Ranged', usage: 'Main action' }).map(
        e => e.name,
      ),
    ).toEqual(['Bone Bow', 'Bone Shards']);
    expect(tags(['-', 'Magic', ''])).toEqual(['Magic']);
    expect(tags(null)).toEqual([]);
  });
  it('survives reordering without retargeting IDs and refuses missing or duplicate identity bindings', async () => {
    const inputs = readInputs().filter(i => i.path.endsWith('/skeleton'));
    const input = inputs[0],
      record = JSON.parse(input.json) as Fields;
    const features = record.features as Fields[];
    const skeleton = named('Skeleton');
    const spans = skeleton.featureIds.map(
      id => pack.objects.find(o => o.id === id)!.original.markdown,
    );
    const prefix = input.markdown.slice(0, input.markdown.indexOf(spans[0]));
    record.features = [...features].reverse();
    input.json = JSON.stringify(record);
    input.markdown = prefix + [...spans].reverse().join('');
    const reordered = await importFoes(inputs, identities);
    expect(reordered.objects[0].featureIds).toEqual([...skeleton.featureIds].reverse());
    await expect(importFoes(inputs, [])).rejects.toThrow('identity');
    await expect(
      importFoes(inputs, [...identities, identities.find(i => i.parent === skeleton.id)!]),
    ).rejects.toThrow('identity');
  });
  it('supports duplicate names with distinct explicit identities and refuses unresolvable identical records', async () => {
    const input = readInputs().find(i => i.path.endsWith('/skeleton'))!;
    const record = JSON.parse(input.json) as Fields;
    const features = record.features as Fields[];
    features[1].name = 'Bone Shards';
    input.json = JSON.stringify(record);
    input.markdown = input.markdown.replace('Bone Spur', 'Bone Shards');
    const mapped = [
      ...identities,
      {
        parent: named('Skeleton').id,
        fingerprint: fingerprint(features[1]),
        id: 'synthetic:second-bone-shards',
      },
    ];
    const result = await importFoes([input], mapped);
    expect(result.objects.filter(o => o.name === 'Bone Shards')).toHaveLength(2);
    features[1] = features[0];
    input.json = JSON.stringify(record);
    await expect(importFoes([input], mapped)).rejects.toThrow('identity');
  });
  it('uses generic whitespace extraction across multiple fixtures, rejects lost text and stat disagreements', async () => {
    const inputs = readInputs().filter(i => /\/(skeleton|zombie)$/.test(i.path));
    for (const input of inputs) input.markdown = input.markdown.replace(/^> /gm, '>   ');
    expect((await importFoes(inputs, identities)).objects.filter(o => o.parentId)).toHaveLength(6);
    inputs[0].markdown = inputs[0].markdown.replace(
      'Each target takes a bane on their next strike.',
      '',
    );
    await expect(importFoes(inputs, identities)).rejects.toThrow('Missing/reordered source text');
    const fresh = readInputs().filter(i => i.path.endsWith('/skeleton'));
    fresh[0].markdown = fresh[0].markdown.replace('**10**<br>Stamina', '**99**<br>Stamina');
    await expect(importFoes(fresh, identities)).rejects.toThrow('Printed stat');
  });
  it('checks feature table fields and optional-spend labels against printed Markdown', async () => {
    const skeleton = readInputs().find(i => i.path.endsWith('/skeleton'))!;
    skeleton.markdown = skeleton.markdown.replace(
      'Melee, Ranged, Strike, Weapon',
      'Melee, Strike, Weapon',
    );
    await expect(importFoes([skeleton], identities)).rejects.toThrow('Feature envelope');
    const ghost = readInputs().find(i => i.path.endsWith('/ghost'))!;
    ghost.markdown = ghost.markdown.replace(
      '**2 [Malice](scc.v1:mcdm.monsters.v1/rule.monster/malice):**',
      '**Optional:**',
    );
    await expect(importFoes([ghost], identities)).rejects.toThrow('Missing/reordered source text');
  });
  it('rejects incoherent corrections and reports additional parent prose', async () => {
    const leap = named('Leap');
    const correction = {
      id: leap.id,
      revision: REVISION,
      field: 'usage',
      expected: 'Maneuver' as Json,
      replacement: 'Main action' as Json,
      reason: 'Synthetic inconsistent correction',
    };
    await expect(
      importFoes(
        readInputs().filter(i => i.path.endsWith('/ghoul')),
        identities,
        [
          correction,
          {
            ...correction,
            field: '$markdown',
            expected: leap.markdown,
            replacement: leap.markdown,
          },
        ],
      ),
    ).rejects.toThrow('Feature envelope');
    const input = readInputs().find(i => i.path.endsWith('/skeleton'))!;
    input.markdown = input.markdown.replace(
      '> ⚔️',
      'A synthetic additional parent consequence.\n\n> ⚔️',
    );
    const changed = await importFoes([input], identities);
    expect(changed.objects[0].diagnostics.join(' ')).toContain('Unmodeled parent text');
    expect(compareBlock(changed, changed.objects[0], [skeletonCounterpart()]).status).toBe(
      'review',
    );
    const external = skeletonCounterpart();
    external.evQuantity = 99;
    expect(compareBlock(pack, named('Skeleton'), [external]).status).toBe('review');
  });
  it('keeps unfamiliar source text readable and flags it for comparison review', async () => {
    const input = readInputs().find(i => i.path.endsWith('/skeleton'))!;
    input.markdown += '\n> A synthetic additional consequence.\n';
    const changed = await importFoes([input], identities);
    const arise = changed.objects.find(o => o.name === 'Arise')!;
    expect(arise.html).toContain('synthetic additional consequence');
    expect(arise.diagnostics.join(' ')).toContain('Unmodeled source text');
    expect(compareBlock(changed, changed.objects[0], [skeletonCounterpart()]).status).toBe(
      'review',
    );
  });
  it('applies revision/expected-value guarded corrections, preserving originals and exact older editions', async () => {
    const object = named('Leap');
    const correction = {
      id: object.id,
      revision: REVISION,
      field: 'usage',
      expected: 'Maneuver' as Json,
      replacement: 'Synthetic usage' as Json,
      reason: 'Synthetic correction fixture',
    };
    const inputs = readInputs().filter(i => i.path.endsWith('/ghoul'));
    const corrected = await importFoes(inputs, identities, [
      correction,
      {
        ...correction,
        field: '$markdown',
        expected: object.markdown,
        replacement: object.markdown.replace('Maneuver', 'Synthetic usage'),
      },
    ]);
    const changed = corrected.objects.find(o => o.id === object.id)!;
    expect(changed.usage).toBe('Synthetic usage');
    expect(changed.html).toContain('Synthetic usage');
    expect(changed.original.record.usage).toBe('Maneuver');
    expect(changed.original.markdown).toBe(object.original.markdown);
    expect(corrected.edition).not.toBe(pack.edition);
    expect(resolveFoe(pack, foeReference(pack, object.id))?.object.usage).toBe('Maneuver');
    expect(() =>
      applyCorrections(
        structuredClone(pack.objects),
        [{ ...correction, revision: 'stale' }],
        REVISION,
      ),
    ).toThrow('Stale');
    expect(() =>
      applyCorrections(
        structuredClone(pack.objects),
        [{ ...correction, expected: 'wrong' }],
        REVISION,
      ),
    ).toThrow('Stale');
    expect(() =>
      applyCorrections([structuredClone(object), structuredClone(object)], [correction], REVISION),
    ).toThrow('ambiguous');
  });
});
describe('exhaustive external comparison', () => {
  it('refuses a stale or incomplete committed comparison record', () => {
    const report = JSON.parse(
      readFileSync(
        new URL('../../docs/build/evidence/V27-steel-cauldron.json', import.meta.url),
        'utf8',
      ),
    );
    expect(() => validateComparisonReport(pack, report)).not.toThrow();
    expect(() => validateComparisonReport(pack, { ...report, edition: 'old' })).toThrow('stale');
    expect(() => validateComparisonReport(pack, { ...report, rows: report.rows.slice(1) })).toThrow(
      'incomplete',
    );
  });
  it('reports all parents even if counterparts are missing or ambiguous', () => {
    const report = compareFoes(pack, []);
    expect(report.rows).toHaveLength(12);
    expect(report.counts.missing).toBe(12);
    const external = skeletonCounterpart();
    expect(compareBlock(pack, named('Skeleton'), [external, external]).status).toBe('ambiguous');
  });
  it('distinguishes a source-equivalent counterpart and presentation variants from material changes', () => {
    const external = skeletonCounterpart();
    expect(compareBlock(pack, named('Skeleton'), [external]).status).toBe('explained');
    external.stamina = 10;
    expect(
      compareBlock(pack, named('Skeleton'), [external]).differences.find(d => d.field === 'stamina')
        ?.classification,
    ).toBe('presentation');
    external.stamina = 11;
    expect(compareBlock(pack, named('Skeleton'), [external]).status).toBe('review');
  });
  it('flags missing paragraphs, reordered effects, changed labels, missing metadata and malformed input', () => {
    for (const mutate of [
      (e: Fields) => {
        ((e.items as Fields[])[0].effects as Fields[]).pop();
      },
      (e: Fields) => {
        ((e.items as Fields[])[0].effects as Fields[]).reverse();
      },
      (e: Fields) => {
        ((e.items as Fields[])[0].effects as Fields[])[1].name = 'Trigger';
      },
      (e: Fields) => {
        delete (e.items as Fields[])[0].target;
      },
    ]) {
      const e = skeletonCounterpart();
      mutate(e);
      expect(compareBlock(pack, named('Skeleton'), [e]).status).toBe('review');
    }
    const malformed = skeletonCounterpart();
    malformed.items = null;
    expect(compareBlock(pack, named('Skeleton'), [malformed]).status).toBe('error');
  });
});
